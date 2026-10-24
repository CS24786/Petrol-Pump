import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  Truck, 
  Fuel, 
  DollarSign, 
  Users, 
  Database, 
  BookOpen, 
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Coins,
  Receipt,
  FileSpreadsheet,
  Info,
  TrendingUp,
  TrendingDown,
  FileDown,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  ShieldCheck,
  X
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';

const REPORT_TABS = [
  { id: 'overall_sales', label: 'Overall Sales & Analytics', icon: BarChart3 },
  { id: 'meter_reconciliation', label: 'Meter Sales & Reconciliation', icon: Fuel },
  { id: 'truck_sales', label: 'Truck Challans & Fleet Sales', icon: Truck },
  { id: 'detailed_sales', label: 'Detailed Sales Registry', icon: FileSpreadsheet },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overall_sales');
  const [periodType, setPeriodType] = useState('daily'); // 'daily', 'weekly', 'month', 'overall'
  const [selectedDate, setSelectedDate] = useState('2026-10-02');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [selectedCustomerId, setSelectedCustomerId] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Live queries from Dexie database
  const meterReadings = useLiveQuery(() => db.meterReadings?.toArray() || [], []);
  const sales = useLiveQuery(() => db.sales?.toArray() || [], []);
  const customers = useLiveQuery(() => db.customers?.toArray() || [], []);
  const expenses = useLiveQuery(() => db.expenses?.toArray() || [], []);
  const purchases = useLiveQuery(() => db.purchases?.toArray() || [], []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries?.toArray() || [], []);
  const suppliers = useLiveQuery(() => db.suppliers?.toArray() || [], []);
  const tanks = useLiveQuery(() => db.tanks?.toArray() || [], []);
  const nozzles = useLiveQuery(() => db.nozzles?.toArray() || [], []);
  const settingsList = useLiveQuery(() => db.settings?.toArray() || [], []);

  const pumpName = settingsList?.find(s => s.key === 'pumpName')?.value || 'DIYAL FILLING STATION';
  const pumpAddress = settingsList?.find(s => s.key === 'pumpAddress')?.value || 'Chiniot Road, Jhumra City';
  const pumpPhone = settingsList?.find(s => s.key === 'pumpPhone')?.value || '+92 300 7654321 | +92 321 9876543';

  // Navigation handlers for date / month
  const handlePrevPeriod = () => {
    if (periodType === 'daily') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (periodType === 'weekly') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 7);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (periodType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const prevD = new Date(y, m - 2, 1);
      setSelectedMonth(prevD.toISOString().slice(0, 7));
    }
  };

  const handleNextPeriod = () => {
    if (periodType === 'daily') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (periodType === 'weekly') {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 7);
      setSelectedDate(d.toISOString().split('T')[0]);
    } else if (periodType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const nextD = new Date(y, m, 1);
      setSelectedMonth(nextD.toISOString().slice(0, 7));
    }
  };

  // Base date filter helper
  const isDateInRange = (dateStr) => {
    if (!dateStr) return false;
    if (periodType === 'daily') {
      return dateStr === selectedDate;
    }
    if (periodType === 'weekly') {
      // 7 days ending at selectedDate
      const refDate = new Date(selectedDate || '2026-10-02');
      const start7 = new Date(refDate);
      start7.setDate(start7.getDate() - 6);
      const start7Str = start7.toISOString().split('T')[0];
      const refStr = refDate.toISOString().split('T')[0];
      return dateStr >= start7Str && dateStr <= refStr;
    }
    if (periodType === 'month') {
      return dateStr.startsWith(selectedMonth);
    }
    if (periodType === 'overall') {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    }
    return true;
  };

  // Human readable period label
  const periodLabel = useMemo(() => {
    if (periodType === 'daily') return `Daily Report: ${formatDateDisplay(selectedDate)}`;
    if (periodType === 'weekly') {
      const ref = new Date(selectedDate || '2026-10-02');
      const st = new Date(ref);
      st.setDate(st.getDate() - 6);
      return `Weekly Report: ${formatDateDisplay(st.toISOString().split('T')[0])} to ${formatDateDisplay(ref.toISOString().split('T')[0])}`;
    }
    if (periodType === 'month') return `Monthly Report: ${selectedMonth}`;
    return `Overall Report: ${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}`;
  }, [periodType, selectedDate, selectedMonth, startDate, endDate]);

  // -------------------------------------------------------------------------
  // FILTERED DATASETS
  // -------------------------------------------------------------------------
  const filteredMeterReadings = useMemo(() => {
    if (!meterReadings) return [];
    return meterReadings.filter(r => isDateInRange(r.date));
  }, [meterReadings, periodType, selectedDate, selectedMonth, startDate, endDate]);

  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter(s => {
      if (!isDateInRange(s.date)) return false;
      if (selectedCustomerId !== 'All') {
        if (selectedCustomerId === 'Retail') {
          if (!s.isRetail) return false;
        } else if (s.customerId !== Number(selectedCustomerId)) {
          return false;
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesVeh = s.vehicleNo?.toLowerCase().includes(q);
        const matchesCust = s.customerName?.toLowerCase().includes(q);
        const matchesSerial = String(s.serialNo || '').toLowerCase().includes(q);
        if (!matchesVeh && !matchesCust && !matchesSerial) return false;
      }
      return true;
    });
  }, [sales, periodType, selectedDate, selectedMonth, startDate, endDate, selectedCustomerId, searchQuery]);

  // -------------------------------------------------------------------------
  // OVERALL SALES & FINANCIAL SUMMARY CALCULATIONS
  // -------------------------------------------------------------------------
  const overallSummary = useMemo(() => {
    let salesTotalRevenue = 0;
    let salesTotalLitres = 0;
    let dieselLitres = 0;
    let dieselRevenue = 0;
    let petrolLitres = 0;
    let petrolRevenue = 0;
    let mobilOilAmount = 0;
    let totalCash = 0;
    let totalCredit = 0;
    let cashAdvanceTotal = 0;
    let retailCount = 0;
    let fleetCount = 0;

    filteredSales.forEach(s => {
      const tot = Number(s.totalAmount) || 0;
      const ltr = Number(s.litres) || 0;
      const adv = Number(s.cashAdvance) || 0;
      const oil = Number(s.mobilOil) || 0;
      const paid = Number(s.paidAmount) || 0;

      salesTotalRevenue += tot;
      salesTotalLitres += ltr;
      cashAdvanceTotal += adv;
      mobilOilAmount += oil;

      if (s.isRetail) retailCount++;
      else fleetCount++;

      if (s.fuelType === 'Diesel' || s.fuelType === 'HSD') {
        dieselLitres += ltr;
        dieselRevenue += (Number(s.dieselAmount) || tot);
      } else if (s.fuelType === 'Petrol' || s.fuelType === 'PMG') {
        petrolLitres += ltr;
        petrolRevenue += (Number(s.dieselAmount) || tot);
      }

      if (s.isRetail || s.paymentType === 'Cash' || paid >= tot) {
        totalCash += tot;
      } else {
        totalCredit += (Number(s.outstandingAmount) || Math.max(0, tot - paid));
        totalCash += paid;
      }
    });

    // Check Meter Readings for total ground truth dispensing
    let meterTotalRevenue = 0;
    let meterTotalLitres = 0;
    let meterDieselLitres = 0;
    let meterPetrolLitres = 0;

    filteredMeterReadings.forEach(r => {
      const sold = (Number(r.litresSold) || 0) + (Number(r.adjustments) || 0);
      const amt = Number(r.salesAmount) || 0;
      meterTotalRevenue += amt;
      meterTotalLitres += sold;
      if (r.fuelType === 'Petrol' || r.fuelType === 'PMG') {
        meterPetrolLitres += sold;
      } else {
        meterDieselLitres += sold;
      }
    });

    // Final reconciled volume and revenue
    const totalRevenue = Math.max(salesTotalRevenue, meterTotalRevenue);
    const totalLitres = Math.max(salesTotalLitres, meterTotalLitres);
    const finalDieselLitres = Math.max(dieselLitres, meterDieselLitres);
    const finalPetrolLitres = Math.max(petrolLitres, meterPetrolLitres);

    // Percentage shares
    const dieselSharePct = totalLitres > 0 ? Math.round((finalDieselLitres / totalLitres) * 100) : 0;
    const petrolSharePct = totalLitres > 0 ? Math.round((finalPetrolLitres / totalLitres) * 100) : 0;
    const cashSharePct = totalRevenue > 0 ? Math.round((totalCash / totalRevenue) * 100) : 0;
    const creditSharePct = totalRevenue > 0 ? Math.round((totalCredit / totalRevenue) * 100) : 0;

    return {
      totalRevenue,
      totalLitres,
      dieselLitres: finalDieselLitres,
      dieselRevenue,
      petrolLitres: finalPetrolLitres,
      petrolRevenue,
      mobilOilAmount,
      totalCash,
      totalCredit,
      cashAdvanceTotal,
      dieselSharePct,
      petrolSharePct,
      cashSharePct,
      creditSharePct,
      totalTransactions: filteredSales.length,
      retailCount,
      fleetCount,
      meterTotalRevenue,
      meterTotalLitres
    };
  }, [filteredSales, filteredMeterReadings]);

  // -------------------------------------------------------------------------
  // SALES TREND DATA FOR INTERACTIVE GRAPH (DAILY / WEEKLY / MONTHLY)
  // -------------------------------------------------------------------------
  const trendData = useMemo(() => {
    const map = {};

    filteredSales.forEach(s => {
      const d = s.date;
      if (!d) return;
      if (!map[d]) {
        map[d] = { date: d, revenue: 0, litres: 0, dieselLitres: 0, petrolLitres: 0, cash: 0, credit: 0 };
      }
      const amt = Number(s.totalAmount) || 0;
      const ltr = Number(s.litres) || 0;
      map[d].revenue += amt;
      map[d].litres += ltr;
      if (s.fuelType === 'Diesel' || s.fuelType === 'HSD') map[d].dieselLitres += ltr;
      else if (s.fuelType === 'Petrol' || s.fuelType === 'PMG') map[d].petrolLitres += ltr;
      if (s.isRetail || s.paymentType === 'Cash') map[d].cash += amt;
      else map[d].credit += amt;
    });

    filteredMeterReadings.forEach(r => {
      const d = r.date;
      if (!d) return;
      if (!map[d]) {
        map[d] = { date: d, revenue: 0, litres: 0, dieselLitres: 0, petrolLitres: 0, cash: 0, credit: 0 };
      }
      const amt = Number(r.salesAmount) || 0;
      const ltr = (Number(r.litresSold) || 0) + (Number(r.adjustments) || 0);
      if (map[d].revenue === 0) {
        map[d].revenue = amt;
        map[d].litres = ltr;
        map[d].cash = amt;
      }
    });

    const list = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
    const maxRevenue = list.reduce((m, item) => Math.max(m, item.revenue), 1000);

    return { list, maxRevenue };
  }, [filteredSales, filteredMeterReadings]);

  // -------------------------------------------------------------------------
  // FLEET / CUSTOMER WISE AGGREGATES
  // -------------------------------------------------------------------------
  const customerBreakdown = useMemo(() => {
    const map = {};
    filteredSales.forEach(s => {
      const cName = s.isRetail ? 'Walk-in Retail Motorists' : (s.customerName || 'M.B GOODS');
      if (!map[cName]) {
        map[cName] = {
          name: cName,
          isRetail: s.isRetail,
          deliveries: 0,
          dieselLitres: 0,
          petrolLitres: 0,
          totalLitres: 0,
          fuelAmount: 0,
          cashAdvances: 0,
          mobilOil: 0,
          totalAmount: 0
        };
      }
      map[cName].deliveries += 1;
      const ltr = Number(s.litres) || 0;
      map[cName].totalLitres += ltr;
      if (s.fuelType === 'Diesel' || s.fuelType === 'HSD') map[cName].dieselLitres += ltr;
      else map[cName].petrolLitres += ltr;
      map[cName].fuelAmount += (Number(s.dieselAmount) || 0);
      map[cName].cashAdvances += (Number(s.cashAdvance) || 0);
      map[cName].mobilOil += (Number(s.mobilOil) || 0);
      map[cName].totalAmount += (Number(s.totalAmount) || 0);
    });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredSales]);

  // Export Comprehensive CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Serial / Challan #', 'Vehicle #', 'Customer / Party', 'Fuel Product', 'Litres', 'Rate (PKR)', 'Diesel / Fuel (PKR)', 'Cash Advance (PKR)', 'Mobil Oil (PKR)', 'Total Amount (PKR)', 'Payment Type', 'Status'];
    const rows = filteredSales.map(s => [
      s.date,
      s.serialNo || `CHL-${s.id}`,
      `"${s.vehicleNo || 'Retail'}"`,
      `"${s.isRetail ? 'Walk-in Retail' : (s.customerName || 'M.B GOODS')}"`,
      s.fuelType || 'Diesel',
      s.litres || 0,
      s.rate || 0,
      s.dieselAmount || 0,
      s.cashAdvance || 0,
      s.mobilOil || 0,
      s.totalAmount || 0,
      s.paymentType || (s.isRetail ? 'Cash' : 'Credit'),
      s.paymentStatus || 'Paid'
    ]);
    exportToCSV(`Sales_Report_${periodType}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. HERO BANNER WITH REALISTIC SALES BACKGROUND (SCREEN ONLY) */}
      <div 
        className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[160px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
        style={{ backgroundImage: "url('/sales_background.jpg')" }}
      >
        {/* Soft navy gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 sm:px-8 py-7 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: BarChart3 Squircle Icon + Title & Subtitle */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Sales Reports &amp; Business Analytics
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
                Comprehensive station revenue analytics, daily nozzle meter dispensing, fleet truck challans &amp; fuel volume trends.
              </p>
            </div>
          </div>

          {/* Right: Quick Action Buttons (Export Excel & Print Report) */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold shadow-sm backdrop-blur-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-white/90" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C32026] hover:bg-[#a81a1f] text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS STRIP (EXACTLY MATCHING SUPPLIERS & PURCHASES MODULE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        
        {/* Card 1: Total Sales Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Sales Revenue
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
              {formatCurrency(overallSummary.totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-blue-600 font-bold font-mono">
                {overallSummary.totalTransactions} Sales
              </span>
              <span className="text-slate-400">&bull; Fuel &amp; Lubricants</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Volume Dispensed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Volume Dispensed
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight mt-0.5 truncate font-mono">
              {formatNumber(overallSummary.totalLitres, 0)} L
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-amber-600 font-bold font-mono">
                HSD: {formatNumber(overallSummary.dieselLitres, 0)}L
              </span>
              <span className="text-slate-400">&bull; PMG: {formatNumber(overallSummary.petrolLitres, 0)}L</span>
            </div>
          </div>
        </div>

        {/* Card 3: Spot Cash Collected */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Spot Cash Collected
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight mt-0.5 truncate font-mono">
              {formatCurrency(overallSummary.totalCash)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-emerald-600 font-bold font-mono">
                {overallSummary.cashSharePct}% Share
              </span>
              <span className="text-slate-400">&bull; Nozzle &amp; Counter cash</span>
            </div>
          </div>
        </div>

        {/* Card 4: Fleet Credit Sales (Receivable) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Fleet Credit Receivables
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight mt-0.5 truncate font-mono">
              {formatCurrency(overallSummary.totalCredit)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-purple-600 font-bold font-mono">
                {overallSummary.creditSharePct}% Share
              </span>
              <span className="text-slate-400">&bull; Billed to Ledgers</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SUB-MODULE TABS HEADER */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {REPORT_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* 4. PERIOD SELECTION & FILTER TOOLBAR GRID (DAILY / WEEKLY / MONTHLY / OVERALL) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-center">
          
          {/* Period Mode Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
              Report Period Filter
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { id: 'daily', label: 'Daily' },
                { id: 'weekly', label: 'Weekly' },
                { id: 'month', label: 'Monthly' },
                { id: 'overall', label: 'Overall' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodType(p.id)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    periodType === p.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Date / Period Pickers with Quick Navigator */}
          {periodType === 'daily' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                Selected Day (Date)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevPeriod}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleNextPeriod}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {periodType === 'weekly' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                Week Ending Date (7-Day)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevPeriod}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleNextPeriod}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {periodType === 'month' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">
                Selected Month
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevPeriod}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleNextPeriod}
                  className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {periodType === 'overall' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Customer / Profile Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Customer / Segment</label>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Customer Segments</option>
              <option value="Retail">Walk-in Retail Motorists</option>
              {customers?.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Search Vehicle / Invoice</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search vehicle #, serial..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none uppercase"
              />
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERALL SALES & ANALYTICS (WITH INTERACTIVE SALES GRAPH)          */}
      {/* ========================================================================= */}
      {activeTab === 'overall_sales' && (
        <div className="space-y-5">
          
          {/* INTERACTIVE SALES TREND GRAPH */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Sales Revenue &amp; Fuel Volume Trend Graph ({periodType.toUpperCase()})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Visual comparison of daily revenue (PKR) and dispensed litres over the active period
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-600"></span>
                  <span className="text-slate-600 font-sans">Daily Revenue</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  Peak: {formatCurrency(trendData.maxRevenue)}
                </span>
              </div>
            </div>

            {/* Visual Bar Chart */}
            <div className="h-56 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 overflow-x-auto">
              {trendData.list.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  No sales data available for this selected period.
                </div>
              ) : (
                trendData.list.map(day => {
                  const heightPct = Math.max(8, Math.round((day.revenue / trendData.maxRevenue) * 100));
                  return (
                    <div key={day.date} className="flex-1 min-w-[36px] max-w-[64px] flex flex-col items-center h-full justify-end group relative cursor-pointer">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                        <span className="font-bold">{formatDateDisplay(day.date)}</span>
                        <span className="text-blue-300 font-mono">{formatCurrency(day.revenue)} &bull; {formatNumber(day.litres, 0)}L</span>
                        <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1 mt-0.5"></div>
                      </div>

                      {/* Bar Pill */}
                      <div 
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-700 group-hover:to-indigo-600 transition-all shadow-xs relative flex items-start justify-center pt-1"
                      >
                        {heightPct > 30 && (
                          <span className="text-[9px] font-mono font-bold text-white/90 scale-90 sm:scale-100 hidden sm:block truncate px-0.5">
                            {formatNumber(day.litres, 0)}L
                          </span>
                        )}
                      </div>

                      {/* X-axis Date Label */}
                      <span className="text-[10px] font-mono text-slate-500 mt-2 truncate w-full text-center">
                        {day.date.slice(-2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SIDE-BY-SIDE ANALYTICS CARDS (PRODUCT MIX & SETTLEMENT SHARE) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Left Card: Fuel Product Volume Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Fuel className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Fuel Product Dispensing Mix</h3>
                    <p className="text-xs text-slate-500">Volume share of High Speed Diesel vs Super Motor Gasoline</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">{formatNumber(overallSummary.totalLitres, 0)} Litres</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${overallSummary.dieselSharePct}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`Diesel: ${overallSummary.dieselSharePct}%`}
                  ></div>
                  <div 
                    style={{ width: `${overallSummary.petrolSharePct}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Petrol: ${overallSummary.petrolSharePct}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>High Speed Diesel ({overallSummary.dieselSharePct}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Super Petrol ({overallSummary.petrolSharePct}%)</span>
                  </span>
                </div>
              </div>

              {/* Product Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <span className="text-[10px] text-amber-800 uppercase font-bold font-sans block">High Speed Diesel (HSD)</span>
                  <span className="text-base font-black text-slate-900">{formatNumber(overallSummary.dieselLitres, 0)} L</span>
                  <span className="text-[11px] text-amber-700 block mt-0.5">{formatCurrency(overallSummary.dieselRevenue)}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold font-sans block">Super Petrol (PMG)</span>
                  <span className="text-base font-black text-slate-900">{formatNumber(overallSummary.petrolLitres, 0)} L</span>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">{formatCurrency(overallSummary.petrolRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Right Card: Revenue Settlement Mode Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Payment &amp; Settlement Distribution</h3>
                    <p className="text-xs text-slate-500">Nozzle spot cash collections vs corporate fleet credit</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-900">{formatCurrency(overallSummary.totalRevenue)}</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${overallSummary.cashSharePct}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Cash: ${overallSummary.cashSharePct}%`}
                  ></div>
                  <div 
                    style={{ width: `${overallSummary.creditSharePct}%` }}
                    className="bg-purple-600 h-full transition-all"
                    title={`Credit: ${overallSummary.creditSharePct}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Spot Cash ({overallSummary.cashSharePct}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                    <span>Fleet Credit ({overallSummary.creditSharePct}%)</span>
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold font-sans block">Spot Cash Received</span>
                  <span className="text-base font-black text-emerald-700">{formatCurrency(overallSummary.totalCash)}</span>
                  <span className="text-[11px] text-slate-500 font-sans block mt-0.5">Walk-in &amp; Spot Collections</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                  <span className="text-[10px] text-purple-800 uppercase font-bold font-sans block">Fleet Credit Ledger</span>
                  <span className="text-base font-black text-purple-700">{formatCurrency(overallSummary.totalCredit)}</span>
                  <span className="text-[11px] text-slate-500 font-sans block mt-0.5">Billed to Customer Accounts</span>
                </div>
              </div>
            </div>

          </div>

          {/* CUSTOMER & FLEET PROFILE BREAKDOWN TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Customer &amp; Fleet Segment Sales Summary</h3>
                <p className="text-xs text-slate-500">Deliveries, fuel volume, cash advances and total amount billed per customer</p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {customerBreakdown.length} Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Customer Profile / Fleet Segment</th>
                    <th className="py-3 px-4 text-center">Deliveries</th>
                    <th className="py-3 px-4 text-right">Diesel (L)</th>
                    <th className="py-3 px-4 text-right">Petrol (L)</th>
                    <th className="py-3 px-4 text-right">Total Fuel (L)</th>
                    <th className="py-3 px-4 text-right">Driver Advances</th>
                    <th className="py-3 px-4 text-right">Total Billed (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerBreakdown.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.name}
                        {c.isRetail && <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">Spot Cash</span>}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">{c.deliveries}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">{formatNumber(c.dieselLitres, 0)} L</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800">{formatNumber(c.petrolLitres, 0)} L</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatNumber(c.totalLitres, 0)} L</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-700">
                        {c.cashAdvances > 0 ? formatCurrency(c.cashAdvances) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-blue-900">
                        {formatCurrency(c.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: METER SALES & NOZZLE RECONCILIATION                                */}
      {/* ========================================================================= */}
      {activeTab === 'meter_reconciliation' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nozzle Meter Dispensing Readings</h3>
              <p className="text-xs text-slate-500">Audit of electronic totalizer meters, testing litres, and gross revenue</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{filteredMeterReadings.length} Meter Logs</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Nozzle Name</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-right">Opening Meter</th>
                  <th className="py-3 px-4 text-right">Closing Meter</th>
                  <th className="py-3 px-4 text-right">Testing (L)</th>
                  <th className="py-3 px-4 text-right">Litres Sold</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Total Revenue (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeterReadings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No meter readings recorded for this active period.
                    </td>
                  </tr>
                ) : (
                  filteredMeterReadings.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-600">{formatDateDisplay(r.date)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.nozzleName || `Nozzle ${r.nozzleId}`}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.fuelType === 'Petrol' || r.fuelType === 'PMG' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.fuelType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatNumber(r.openingMeter, 1)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">{formatNumber(r.closingMeter, 1)}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{r.testingLitres || 0}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatNumber(r.litresSold, 1)} L</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">Rs {formatNumber(r.rate, 2)}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-blue-900">{formatCurrency(r.salesAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRUCK CHALLANS & FLEET SALES                                       */}
      {/* ========================================================================= */}
      {activeTab === 'truck_sales' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Fleet Truck Challans Summary</h3>
              <p className="text-xs text-slate-500">Record of credit truck challans dispatched to company fleet accounts</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{filteredSales.filter(s => !s.isRetail).length} Challans</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Serial #</th>
                  <th className="py-3 px-4">Vehicle #</th>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4 text-right">Litres</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Fuel Bill (PKR)</th>
                  <th className="py-3 px-4 text-right">Advance (PKR)</th>
                  <th className="py-3 px-4 text-right">Total Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.filter(s => !s.isRetail).map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-600">{formatDateDisplay(s.date)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.serialNo}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.vehicleNo}</td>
                    <td className="py-3 px-4 text-slate-600">{s.customerName || 'M.B GOODS'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatNumber(s.litres, 2)} L</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">Rs {formatNumber(s.rate, 2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">{formatCurrency(s.dieselAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">{s.cashAdvance > 0 ? formatCurrency(s.cashAdvance) : '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-blue-900">{formatCurrency(s.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: DETAILED SALES REGISTRY                                            */}
      {/* ========================================================================= */}
      {activeTab === 'detailed_sales' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Complete Station Sales Registry</h3>
              <p className="text-xs text-slate-500">Every sales transaction recorded during active period</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{filteredSales.length} Transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Serial / Ref</th>
                  <th className="py-3 px-4">Vehicle #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-right">Litres</th>
                  <th className="py-3 px-4 text-right">Rate</th>
                  <th className="py-3 px-4 text-right">Advance</th>
                  <th className="py-3 px-4 text-right">Total (PKR)</th>
                  <th className="py-3 px-4 text-center">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-slate-600">{formatDateDisplay(s.date)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.serialNo || `SL-${s.id}`}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{s.vehicleNo || 'Retail'}</td>
                    <td className="py-3 px-4 text-slate-600">{s.isRetail ? 'Walk-in Retail' : (s.customerName || 'M.B GOODS')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.fuelType === 'Petrol' || s.fuelType === 'PMG' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {s.fuelType || 'Diesel'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatNumber(s.litres, 2)} L</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">Rs {formatNumber(s.rate, 2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-700">{s.cashAdvance > 0 ? formatCurrency(s.cashAdvance) : '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-blue-900">{formatCurrency(s.totalAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.isRetail || s.paymentType === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {s.isRetail || s.paymentType === 'Cash' ? 'Cash' : 'Credit'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE STATION SALES PERFORMANCE & AUDIT REPORT                 */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Top Modal Navigation Header Bar (SCREEN ONLY) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Station Sales Performance &amp; Analytics Audit Report
                  </h3>
                  <span className="text-[11px] text-slate-300 font-normal">
                    {periodLabel} &bull; Printable Corporate A4 Document
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer border border-slate-700 transition-all shadow-xs"
                  title="Save as PDF via system print preview"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-400" />
                  <span>Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet (print-area) */}
            <div id="sales-analytics-report" className="print-area p-6 sm:p-8 bg-white text-slate-900 relative">
              {/* Header: Diyal Filling Station */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-100 shadow-xs flex items-center justify-center shrink-0">
                    <img 
                      src="/logo.jpg" 
                      alt="Diyal Logo" 
                      className="w-full h-full object-contain"
                      onError={e => { e.target.src = '/logo.png'; }}
                    />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight uppercase font-sans">
                      DIYAL
                    </h2>
                    <h3 className="text-xs font-black tracking-widest text-[#C32026] uppercase">
                      FILLING STATION
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 sm:text-left font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📍</span>
                    <span>{pumpAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📞</span>
                    <span className="font-mono">{pumpPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">🏛️</span>
                    <span className="font-mono font-semibold">NTN: 1234567-8</span>
                  </div>
                </div>
              </div>

              {/* Title & Metadata Ribbon */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                    Official Station Revenue Audit
                  </span>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Station Sales Performance &amp; Analytics Audit Statement
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official audit of electronic meter dispensing, company fleet sales &amp; settlement shares
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                    {periodLabel}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-bold font-mono">
                    {overallSummary.totalTransactions} Transactions
                  </span>
                </div>
              </div>

              {/* 4 Financial KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block">Total Revenue</span>
                  <span className="text-base sm:text-lg font-black text-slate-900">{formatCurrency(overallSummary.totalRevenue)}</span>
                  <span className="text-[10px] text-slate-400 block font-sans">Gross Sales Volume</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                  <span className="text-[10px] uppercase font-bold text-amber-700 font-sans block">Total Litres Dispensed</span>
                  <span className="text-base sm:text-lg font-black text-amber-900">{formatNumber(overallSummary.totalLitres, 0)} L</span>
                  <span className="text-[10px] text-amber-700 block font-sans">HSD: {formatNumber(overallSummary.dieselLitres, 0)} | PMG: {formatNumber(overallSummary.petrolLitres, 0)}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 font-sans block">Spot Cash Collected</span>
                  <span className="text-base sm:text-lg font-black text-emerald-900">{formatCurrency(overallSummary.totalCash)}</span>
                  <span className="text-[10px] text-emerald-700 block font-sans">{overallSummary.cashSharePct}% Cash Share</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                  <span className="text-[10px] uppercase font-bold text-purple-700 font-sans block">Fleet Credit Ledger</span>
                  <span className="text-base sm:text-lg font-black text-purple-900">{formatCurrency(overallSummary.totalCredit)}</span>
                  <span className="text-[10px] text-purple-700 block font-sans">{overallSummary.creditSharePct}% Credit Share</span>
                </div>
              </div>

              {/* Product Breakdown Summary Strip */}
              <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-sans font-bold text-slate-800">High Speed Diesel (HSD) Performance:</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Volume:</span>
                    <span className="font-bold text-slate-900">{formatNumber(overallSummary.dieselLitres, 0)} Litres ({overallSummary.dieselSharePct}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Revenue Billed:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(overallSummary.dieselRevenue)}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-sans font-bold text-slate-800">Super Motor Petrol (PMG) Performance:</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Volume:</span>
                    <span className="font-bold text-slate-900">{formatNumber(overallSummary.petrolLitres, 0)} Litres ({overallSummary.petrolSharePct}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Revenue Billed:</span>
                    <span className="font-bold text-emerald-900">{formatCurrency(overallSummary.petrolRevenue)}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Sales Registry Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Challan #</th>
                      <th className="py-2.5 px-3">Vehicle / Party</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-right">Litres</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Fuel (PKR)</th>
                      <th className="py-2.5 px-3 text-right">Advance (PKR)</th>
                      <th className="py-2.5 px-3 text-right">Total (PKR)</th>
                      <th className="py-2.5 px-3 text-center">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[10px]">
                    {filteredSales.slice(0, 40).map((s, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 font-mono text-slate-600 whitespace-nowrap">{formatDateDisplay(s.date)}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{s.serialNo || `SL-${s.id}`}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {s.vehicleNo || 'Retail'} {s.customerName ? `(${s.customerName})` : ''}
                        </td>
                        <td className="py-1.5 px-3 whitespace-nowrap">{s.fuelType || 'Diesel'}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{formatNumber(s.litres, 1)} L</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">Rs {formatNumber(s.rate, 2)}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-900 whitespace-nowrap">{formatCurrency(s.dieselAmount || 0)}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-amber-800 whitespace-nowrap">{s.cashAdvance > 0 ? formatCurrency(s.cashAdvance) : '-'}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-black text-blue-900 whitespace-nowrap">{formatCurrency(s.totalAmount)}</td>
                        <td className="py-1.5 px-3 text-center whitespace-nowrap">
                          <span className="font-semibold text-slate-700">{s.isRetail ? 'Spot Cash' : 'Credit'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[11px]">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-700 font-black">
                        Total Summary:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                        {formatNumber(overallSummary.totalLitres, 0)} L
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                        {formatCurrency(overallSummary.dieselRevenue + overallSummary.petrolRevenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-amber-900 whitespace-nowrap">
                        {formatCurrency(overallSummary.cashAdvanceTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-blue-950 whitespace-nowrap">
                        {formatCurrency(overallSummary.totalRevenue)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 3-Tier Signatures Block */}
              <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Station Sales Auditor</span>
                  <span className="block text-[10px] text-slate-400">Meter Verification Checked</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Accounts Manager</span>
                  <span className="block text-[10px] text-slate-400">Revenue &amp; Ledgers Reconciled</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Station General Manager</span>
                  <span className="block text-[10px] text-slate-400">Diyal Filling Station</span>
                </div>
              </div>

              <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>System Generated Official Document &bull; Diyal ERP</span>
                <span>Printed on: {new Date().toLocaleString('en-GB')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
