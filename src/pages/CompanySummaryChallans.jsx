import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  FileSpreadsheet, 
  Calendar, 
  Download, 
  Printer, 
  FileDown, 
  Building2, 
  Truck, 
  Fuel, 
  CheckCircle2, 
  CreditCard,
  FileText,
  X,
  Eye,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  List
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';
import { exportReportToPDF } from '../utils/pdfExport';
import Pagination from '../components/Pagination';

export default function CompanySummaryChallans({ 
  onOpenPaymentModal, 
  onOpenReceipt, 
  selectedCustomerId: propCustomerId, 
  onSelectCustomer: propSetCustomerId 
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(propCustomerId || '');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-05');
  const [selectedVehicle, setSelectedVehicle] = useState('All');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' (default as requested: daily trucks & payments) | 'detailed'
  const [expandedDates, setExpandedDates] = useState(new Set());
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printReportMode, setPrintReportMode] = useState('daily'); // 'daily' | 'detailed'

  // Pagination states
  const [dailyPage, setDailyPage] = useState(1);
  const [dailyPageSize, setDailyPageSize] = useState(10);
  const [detailedPage, setDetailedPage] = useState(1);
  const [detailedPageSize, setDetailedPageSize] = useState(10);

  // Queries
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries.toArray(), []);
  const vehicles = useLiveQuery(
    () => selectedCustomerId ? db.vehicles.where('customerId').equals(Number(selectedCustomerId)).toArray() : [],
    [selectedCustomerId]
  );
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);

  const pumpName = settingsList?.find(s => s.key === 'pumpName')?.value || 'DIYAL FILLING STATION';
  const pumpAddress = settingsList?.find(s => s.key === 'pumpAddress')?.value || 'Chiniot Road, Chak Jhumra, FSD.';
  const pumpPhone = settingsList?.find(s => s.key === 'pumpPhone')?.value || '+92 300 7654321 | +92 321 9876543';

  // Synchronize with parent propCustomerId
  useEffect(() => {
    if (propCustomerId && propCustomerId !== selectedCustomerId) {
      setSelectedCustomerId(propCustomerId);
    }
  }, [propCustomerId]);

  // Default customer to M.B GOODS or first customer
  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      const mb = customers.find(c => c.name.includes('M.B GOODS')) || customers[0];
      const initialId = String(mb.id);
      setSelectedCustomerId(initialId);
      if (propSetCustomerId) propSetCustomerId(initialId);
    }
  }, [customers, selectedCustomerId, propSetCustomerId]);

  const activeCustomer = useMemo(() => {
    if (!customers || !selectedCustomerId) return null;
    return customers.find(c => c.id === Number(selectedCustomerId));
  }, [customers, selectedCustomerId]);

  // Handle changing customer dropdown
  const handleCustomerChange = (id) => {
    setSelectedCustomerId(id);
    if (propSetCustomerId) propSetCustomerId(id);
  };

  // Quick Preset Handlers (Matching Reference Image 1)
  const handleSetPreset = (days) => {
    const baseEnd = new Date('2026-10-05');
    const start = new Date(baseEnd);
    start.setDate(start.getDate() - (days - 1));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(baseEnd.toISOString().split('T')[0]);
  };

  // Toggle expanded date row
  const toggleDateExpand = (date) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  // Filter matched raw challans
  const matchedChallans = useMemo(() => {
    if (!sales || !activeCustomer) return [];

    return sales
      .filter(s => {
        if (s.customerId !== activeCustomer.id) return false;
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;
        if (selectedVehicle !== 'All' && s.vehicleNo !== selectedVehicle) return false;
        if (onlyUnpaid && (s.outstandingAmount || 0) <= 0 && (s.paidAmount >= s.totalAmount)) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date) || (parseInt(a.serialNo) - parseInt(b.serialNo)));
  }, [sales, activeCustomer, startDate, endDate, selectedVehicle, onlyUnpaid]);

  // --- DAILY CONSOLIDATED SUMMARY LOGIC (TRUCKS & ACCORDING PAYMENT WITH SEPARATE ADVANCE & MOBIL OIL) ---
  const dailySummaryData = useMemo(() => {
    if (!activeCustomer || !matchedChallans) {
      return {
        rows: [],
        totals: {
          trucks: 0,
          litres: 0,
          fuelAmount: 0,
          mobilOil: 0,
          driverAdvance: 0,
          totalAmount: 0,
          paidAmount: 0,
          dueAmount: 0
        }
      };
    }

    // Filter customer ledger entries for payments in date range
    const custEntries = (ledgerEntries || []).filter(e => {
      if (e.customerId !== activeCustomer.id) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });

    // Group dates
    const dateSet = new Set();
    matchedChallans.forEach(s => dateSet.add(s.date));
    custEntries.forEach(e => dateSet.add(e.date));

    const sortedDates = Array.from(dateSet).sort();

    let totalTrucks = 0;
    let totalLitres = 0;
    let totalFuelAmount = 0;
    let totalMobilOil = 0;
    let totalDriverAdvance = 0;
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDue = 0;

    const rows = sortedDates.map(date => {
      const daySales = matchedChallans.filter(s => s.date === date);
      const dayEntries = custEntries.filter(e => e.date === date);

      // Number of trucks / challans on this day
      const truckCount = daySales.length;

      // Total fuel litres on this day
      const dayLitres = daySales.reduce((acc, s) => acc + (s.litres || 0), 0);

      // Fuel Amount on this day
      const dayFuelAmount = daySales.reduce((acc, s) => acc + (s.dieselAmount || 0), 0);

      // SEPARATE COLUMN: Mobil Oil
      const dayMobilOil = daySales.reduce((acc, s) => acc + (s.mobilOil || 0), 0);

      // SEPARATE COLUMN: Driver Cash Advance
      const dayDriverAdvance = daySales.reduce((acc, s) => acc + (s.cashAdvance || s.cash || 0), 0);

      // Total Payment / Amount formed on this day: Fuel + Mobil Oil + Driver Advance
      const dayTotalAmount = daySales.reduce(
        (acc, s) => acc + (s.totalAmount || (s.dieselAmount || 0) + (s.mobilOil || 0) + (s.cashAdvance || s.cash || 0)), 
        0
      );

      // Payments received on this day (from sales paidAmount + ledger inAmount)
      const dayPaidAmount = daySales.reduce((acc, s) => acc + (s.paidAmount || 0), 0) + 
                            dayEntries.reduce((acc, e) => acc + (e.inAmount || 0), 0);

      // Outstanding due on this day
      const dayDueAmount = daySales.reduce(
        (acc, s) => acc + (s.outstandingAmount ?? (s.totalAmount - (s.paidAmount || 0))), 
        0
      );

      totalTrucks += truckCount;
      totalLitres += dayLitres;
      totalFuelAmount += dayFuelAmount;
      totalMobilOil += dayMobilOil;
      totalDriverAdvance += dayDriverAdvance;
      totalAmount += dayTotalAmount;
      totalPaid += dayPaidAmount;
      totalDue += dayDueAmount;

      return {
        date,
        truckCount,
        litres: dayLitres,
        fuelAmount: dayFuelAmount,
        mobilOil: dayMobilOil,
        driverAdvance: dayDriverAdvance,
        totalAmount: dayTotalAmount,
        paidAmount: dayPaidAmount,
        dueAmount: dayDueAmount,
        challans: daySales
      };
    });

    return {
      rows,
      totals: {
        trucks: totalTrucks,
        litres: totalLitres,
        fuelAmount: totalFuelAmount,
        mobilOil: totalMobilOil,
        driverAdvance: totalDriverAdvance,
        totalAmount,
        paidAmount: totalPaid,
        dueAmount: totalDue
      }
    };
  }, [activeCustomer, matchedChallans, ledgerEntries, startDate, endDate]);

  // Paginated Slices
  const paginatedDailyRows = useMemo(() => {
    const start = (dailyPage - 1) * dailyPageSize;
    return dailySummaryData.rows.slice(start, start + dailyPageSize);
  }, [dailySummaryData.rows, dailyPage, dailyPageSize]);

  const paginatedMatchedChallans = useMemo(() => {
    const start = (detailedPage - 1) * detailedPageSize;
    return matchedChallans.slice(start, start + detailedPageSize);
  }, [matchedChallans, detailedPage, detailedPageSize]);

  // Export to Excel CSV
  const handleExportCSV = () => {
    if (!activeCustomer) return;

    if (viewMode === 'daily') {
      const rows = dailySummaryData.rows.map((r, idx) => ({
        '#': idx + 1,
        'Date': formatDateDisplay(r.date),
        'Trucks Count': `${r.truckCount} Trucks`,
        'Fuel Litres': r.litres,
        'Fuel Amount (PKR)': r.fuelAmount,
        'Mobil Oil (PKR)': r.mobilOil,
        'Driver Advance (PKR)': r.driverAdvance,
        'Total Amount (PKR)': r.totalAmount,
        'Payment Received (PKR)': r.paidAmount,
        'Outstanding Due (PKR)': r.dueAmount
      }));

      // Totals row
      rows.push({
        '#': 'TOTAL',
        'Date': `${dailySummaryData.rows.length} Days`,
        'Trucks Count': `${dailySummaryData.totals.trucks} Trucks`,
        'Fuel Litres': dailySummaryData.totals.litres,
        'Fuel Amount (PKR)': dailySummaryData.totals.fuelAmount,
        'Mobil Oil (PKR)': dailySummaryData.totals.mobilOil,
        'Driver Advance (PKR)': dailySummaryData.totals.driverAdvance,
        'Total Amount (PKR)': dailySummaryData.totals.totalAmount,
        'Payment Received (PKR)': dailySummaryData.totals.paidAmount,
        'Outstanding Due (PKR)': dailySummaryData.totals.dueAmount
      });

      const periodStr = `${startDate}_to_${endDate}`;
      exportToCSV(`${activeCustomer.name.replace(/\s+/g, '_')}_Daily_Summary_Challans_${periodStr}.csv`, rows);
    } else {
      const rows = matchedChallans.map((c, idx) => ({
        '#': idx + 1,
        'Date': formatDateDisplay(c.date),
        'Challan #': `#${c.serialNo || c.id}`,
        'Vehicle #': c.vehicleNo,
        'Fuel Type': c.fuelType || 'Diesel',
        'Litres': c.litres,
        'Rate (PKR)': c.rate,
        'Fuel Amount (PKR)': c.dieselAmount,
        'Mobil Oil (PKR)': c.mobilOil || 0,
        'Driver Advance (PKR)': c.cashAdvance || c.cash || 0,
        'Total Amount (PKR)': c.totalAmount,
        'Due (PKR)': c.outstandingAmount ?? (c.totalAmount - (c.paidAmount || 0)),
        'Status': (c.outstandingAmount <= 0 || c.paidAmount >= c.totalAmount) ? 'Paid' : 'Pending'
      }));

      rows.push({
        '#': 'TOTAL',
        'Date': `${matchedChallans.length} Challans`,
        'Challan #': '',
        'Vehicle #': '',
        'Fuel Type': '',
        'Litres': dailySummaryData.totals.litres,
        'Rate (PKR)': '',
        'Fuel Amount (PKR)': dailySummaryData.totals.fuelAmount,
        'Mobil Oil (PKR)': dailySummaryData.totals.mobilOil,
        'Driver Advance (PKR)': dailySummaryData.totals.driverAdvance,
        'Total Amount (PKR)': dailySummaryData.totals.totalAmount,
        'Due (PKR)': dailySummaryData.totals.dueAmount,
        'Status': ''
      });

      const periodStr = `${startDate}_to_${endDate}`;
      exportToCSV(`${activeCustomer.name.replace(/\s+/g, '_')}_Itemized_Challans_${periodStr}.csv`, rows);
    }
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      
      {/* 1. FILTER CONTROLS CARD MATCHING REFERENCE IMAGE 1 (SCREEN ONLY) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs no-print space-y-4">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>Consolidated Company Summary Challan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily summary of fleet trucks, fuel payments, separate Mobil Oil &amp; driver cash advances
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={dailySummaryData.rows.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            {/* Print / Save PDF Button -> Opens modal form */}
            <button
              onClick={() => {
                setPrintReportMode(viewMode);
                setIsPrintModalOpen(true);
              }}
              disabled={dailySummaryData.rows.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Inputs Grid matching Reference Image 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          
          {/* Company Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {customers?.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Vehicle Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Truck / Vehicle Filter
            </label>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Trucks ({vehicles?.length || 0})</option>
              {vehicles?.map(v => (
                <option key={v.id} value={v.vehicleNo}>
                  Truck #{v.vehicleNo}
                </option>
              ))}
            </select>
          </div>

          {/* Unpaid Checkbox */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-semibold py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/70">
              <input
                type="checkbox"
                checked={onlyUnpaid}
                onChange={(e) => setOnlyUnpaid(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Only Unpaid Challans</span>
            </label>
          </div>

        </div>

        {/* Quick Periods Presets Bar (Matching Reference Image 1) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Quick Periods:</span>
            {[
              { label: '2 Days', days: 2 },
              { label: '3 Days', days: 3 },
              { label: '4 Days', days: 4 },
              { label: '5 Days', days: 5 },
              { label: '1 Week (7 Days)', days: 7 },
              { label: '2 Weeks (14 Days)', days: 14 }
            ].map(p => (
              <button
                key={p.days}
                type="button"
                onClick={() => handleSetPreset(p.days)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 text-slate-600 font-medium cursor-pointer transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            Selected: <span className="font-bold text-slate-800">{formatDateDisplay(startDate)}</span> to <span className="font-bold text-slate-800">{formatDateDisplay(endDate)}</span>
          </div>
        </div>

        {/* Live Aggregates Metric Pills Row (With Separate Mobil Oil & Advance Badges) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2 border-t border-slate-100 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Total Trucks</span>
            <span className="font-bold text-blue-700 text-sm">{dailySummaryData.totals.trucks} Trucks</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Total Litres</span>
            <span className="font-bold text-slate-900 text-sm">{formatNumber(dailySummaryData.totals.litres, 2)} L</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Fuel Amount</span>
            <span className="font-bold text-slate-900 text-sm">{formatCurrency(dailySummaryData.totals.fuelAmount)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <span className="text-[10px] text-amber-700 uppercase font-sans font-semibold block">Mobil Oil</span>
            <span className="font-bold text-amber-900 text-sm">{formatCurrency(dailySummaryData.totals.mobilOil)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
            <span className="text-[10px] text-indigo-700 uppercase font-sans font-semibold block">Driver Advance</span>
            <span className="font-bold text-indigo-900 text-sm">{formatCurrency(dailySummaryData.totals.driverAdvance)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Total Payment</span>
            <span className="font-black text-slate-950 text-sm">{formatCurrency(dailySummaryData.totals.totalAmount)}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-[10px] text-rose-500 uppercase font-sans font-semibold block">Outstanding Due</span>
            <span className="font-black text-rose-700 text-sm">{formatCurrency(dailySummaryData.totals.dueAmount)}</span>
          </div>
        </div>

      </div>

      {/* 2. TABLE VIEW CONTAINER WITH VIEW-MODE TOGGLE (DAILY SUMMARY vs ITEMIZED CHALLANS) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
        
        {/* Table Title Bar & Mode Switcher */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                {viewMode === 'daily' 
                  ? `Date-wise Daily Trucks & Fuel Summary (${dailySummaryData.rows.length} Days)`
                  : `Itemized Fleet Challans (${matchedChallans.length} Challans)`}
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeCustomer?.name} &bull; {formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Daily Summary (Default) vs Itemized */}
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'daily' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Daily Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('detailed')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'detailed' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5 text-emerald-600" />
                <span>Itemized Slips</span>
              </button>
            </div>

            <button
              onClick={() => {
                setPrintReportMode(viewMode);
                setIsPrintModalOpen(true);
              }}
              disabled={dailySummaryData.rows.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Preview</span>
            </button>
          </div>
        </div>

        {/* --- VIEW 1: DAILY CONSOLIDATED SUMMARY (BY DATE & TRUCKS WITH SEPARATE ADVANCE & MOBIL OIL) --- */}
        {viewMode === 'daily' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 text-center">#</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-center">Trucks</th>
                  <th className="py-3 px-3 text-right">Fuel Litres</th>
                  <th className="py-3 px-3 text-right">Fuel Amt (PKR)</th>
                  <th className="py-3 px-3 text-right text-amber-800 font-black">Mobil Oil (PKR)</th>
                  <th className="py-3 px-3 text-right text-indigo-800 font-black">Driver Advance (PKR)</th>
                  <th className="py-3 px-3 text-right font-black">Total Payment (PKR)</th>
                  <th className="py-3 px-3 text-right text-emerald-800">Payment Rec. (PKR)</th>
                  <th className="py-3 px-3 text-right text-rose-700 font-black">Net Due (PKR)</th>
                  <th className="py-3 px-3 text-center">Breakdown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {dailySummaryData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-sans">
                      <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No transactions recorded for {activeCustomer?.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting the date range or truck filter above.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedDailyRows.map((row, idx) => {
                    const isExpanded = expandedDates.has(row.date);
                    return (
                      <React.Fragment key={row.date}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-sans font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-900 font-bold">
                            {formatDateDisplay(row.date)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-xs">
                              <Truck className="w-3 h-3 text-blue-600" />
                              <span>{row.truckCount} Trucks</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-slate-900">
                            {row.litres > 0 ? `${formatNumber(row.litres, 2)} L` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-slate-900">
                            {row.fuelAmount > 0 ? formatNumber(row.fuelAmount, 0) : '-'}
                          </td>
                          {/* SEPARATE COLUMN: Mobil Oil */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-amber-900 bg-amber-50/30">
                            {row.mobilOil > 0 ? formatNumber(row.mobilOil, 0) : '-'}
                          </td>
                          {/* SEPARATE COLUMN: Driver Cash Advance */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-indigo-900 bg-indigo-50/30">
                            {row.driverAdvance > 0 ? formatNumber(row.driverAdvance, 0) : '-'}
                          </td>
                          {/* Total Payment / Bill Formed on this day */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-black text-slate-950 text-xs bg-slate-50/70">
                            {row.totalAmount > 0 ? formatCurrency(row.totalAmount) : '-'}
                          </td>
                          {/* Payments Received */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-emerald-700">
                            {row.paidAmount > 0 ? formatCurrency(row.paidAmount) : '-'}
                          </td>
                          {/* Net Outstanding Due */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap font-black text-rose-700">
                            {row.dueAmount > 0 ? formatCurrency(row.dueAmount) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => toggleDateExpand(row.date)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                            >
                              <span>{isExpanded ? 'Hide' : 'Slips'}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expandable row: Individual truck challans for this date */}
                        {isExpanded && (
                          <tr className="bg-slate-50/70 border-y border-slate-200/80">
                            <td colSpan={11} className="p-3 pl-10">
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                                <div className="px-3 py-2 bg-slate-100 text-slate-800 font-bold text-[11px] flex items-center justify-between">
                                  <span>Truck Challans for {formatDateDisplay(row.date)} ({row.challans.length} Slips)</span>
                                  <span className="text-slate-500 font-normal">Day Total: {formatCurrency(row.totalAmount)}</span>
                                </div>
                                <table className="w-full text-left text-[10px] font-mono">
                                  <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                                      <th className="p-2">Challan #</th>
                                      <th className="p-2">Vehicle #</th>
                                      <th className="p-2">Fuel Type</th>
                                      <th className="p-2 text-right">Litres</th>
                                      <th className="p-2 text-right">Rate</th>
                                      <th className="p-2 text-right">Fuel Amt</th>
                                      <th className="p-2 text-right">Mobil Oil</th>
                                      <th className="p-2 text-right">Driver Advance</th>
                                      <th className="p-2 text-right font-black">Challan Total</th>
                                      <th className="p-2 text-center">Receipt</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {row.challans.map(c => (
                                      <tr key={c.id} className="hover:bg-slate-50">
                                        <td className="p-2 font-bold text-blue-700">#{c.serialNo || c.id}</td>
                                        <td className="p-2 font-bold text-slate-900">{c.vehicleNo}</td>
                                        <td className="p-2">{c.fuelType || 'Diesel'}</td>
                                        <td className="p-2 text-right">{c.litres > 0 ? formatNumber(c.litres, 2) : '-'}</td>
                                        <td className="p-2 text-right">{c.rate > 0 ? formatNumber(c.rate, 2) : '-'}</td>
                                        <td className="p-2 text-right">{formatNumber(c.dieselAmount || 0, 0)}</td>
                                        <td className="p-2 text-right text-amber-800">{c.mobilOil > 0 ? formatNumber(c.mobilOil, 0) : '-'}</td>
                                        <td className="p-2 text-right text-indigo-800">{c.cashAdvance > 0 ? formatNumber(c.cashAdvance, 0) : '-'}</td>
                                        <td className="p-2 text-right font-bold text-slate-950">{formatNumber(c.totalAmount, 0)}</td>
                                        <td className="p-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => onOpenReceipt && onOpenReceipt(c)}
                                            className="text-blue-600 hover:text-blue-800 font-sans font-bold text-[10px]"
                                          >
                                            View
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              {dailySummaryData.rows.length > 0 && (
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                  <tr>
                    <td colSpan={2} className="py-3 px-3 uppercase font-sans font-black">
                      TOTAL ({dailySummaryData.rows.length} Days)
                    </td>
                    <td className="py-3 px-3 text-center font-black text-blue-700">
                      {dailySummaryData.totals.trucks} Trucks
                    </td>
                    <td className="py-3 px-3 text-right font-black">{formatNumber(dailySummaryData.totals.litres, 2)} L</td>
                    <td className="py-3 px-3 text-right font-black">{formatNumber(dailySummaryData.totals.fuelAmount, 0)}</td>
                    <td className="py-3 px-3 text-right font-black text-amber-900">{formatNumber(dailySummaryData.totals.mobilOil, 0)}</td>
                    <td className="py-3 px-3 text-right font-black text-indigo-900">{formatNumber(dailySummaryData.totals.driverAdvance, 0)}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-950 text-sm">{formatCurrency(dailySummaryData.totals.totalAmount)}</td>
                    <td className="py-3 px-3 text-right font-black text-emerald-800">{formatCurrency(dailySummaryData.totals.paidAmount)}</td>
                    <td className="py-3 px-3 text-right font-black text-rose-700 text-sm">{formatCurrency(dailySummaryData.totals.dueAmount)}</td>
                    <td className="py-3 px-3 text-center font-sans text-slate-400 font-normal">-</td>
                  </tr>
                </tfoot>
              )}
            </table>
            <Pagination 
              currentPage={dailyPage}
              totalItems={dailySummaryData.rows.length}
              pageSize={dailyPageSize}
              onPageChange={setDailyPage}
              onPageSizeChange={(sz) => { setDailyPageSize(sz); setDailyPage(1); }}
            />
          </div>
        )}

        {/* --- VIEW 2: ITEMIZED INDIVIDUAL CHALLANS SLIPS --- */}
        {viewMode === 'detailed' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 text-center">#</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Challan #</th>
                  <th className="py-3 px-3">Vehicle #</th>
                  <th className="py-3 px-3">Fuel Type</th>
                  <th className="py-3 px-3 text-right">Litres</th>
                  <th className="py-3 px-3 text-right">Rate (PKR)</th>
                  <th className="py-3 px-3 text-right">Fuel Amt (PKR)</th>
                  <th className="py-3 px-3 text-right text-amber-800 font-black">Mobil Oil (PKR)</th>
                  <th className="py-3 px-3 text-right text-indigo-800 font-black">Driver Advance (PKR)</th>
                  <th className="py-3 px-3 text-right font-black">Total Amount (PKR)</th>
                  <th className="py-3 px-3 text-right text-rose-700 font-black">Due (PKR)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {matchedChallans.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-12 text-center text-slate-400 font-sans">
                      <Truck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No challans recorded for {activeCustomer?.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting the date range or truck filter above.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedMatchedChallans.map((c, idx) => {
                    const isPaid = (c.outstandingAmount <= 0) || (c.paidAmount >= c.totalAmount);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-sans">{idx + 1}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-800 font-medium">{formatDateDisplay(c.date)}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-700 whitespace-nowrap">#{c.serialNo || c.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{c.vehicleNo}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.fuelType === 'Petrol' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.fuelType || 'Diesel'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{c.litres > 0 ? formatNumber(c.litres, 2) : '-'}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{c.rate > 0 ? formatNumber(c.rate, 2) : '-'}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatNumber(c.dieselAmount || 0, 0)}</td>
                        {/* SEPARATE COLUMN: Mobil Oil */}
                        <td className="py-2.5 px-3 text-right text-amber-800 font-semibold">{c.mobilOil > 0 ? formatNumber(c.mobilOil, 0) : '-'}</td>
                        {/* SEPARATE COLUMN: Driver Advance */}
                        <td className="py-2.5 px-3 text-right text-indigo-800 font-semibold">{c.cashAdvance > 0 ? formatNumber(c.cashAdvance, 0) : '-'}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-950">{formatNumber(c.totalAmount, 0)}</td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-700">{formatNumber(c.outstandingAmount ?? (c.totalAmount - (c.paidAmount || 0)), 0)}</td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onOpenReceipt && onOpenReceipt(c)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                            title="View 3-Copy Thermal Receipt"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {matchedChallans.length > 0 && (
                <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                  <tr>
                    <td colSpan={5} className="py-3 px-3 uppercase font-sans font-black">
                      TOTAL ({matchedChallans.length} Challans)
                    </td>
                    <td className="py-3 px-3 text-right font-black">{formatNumber(dailySummaryData.totals.litres, 2)}</td>
                    <td className="py-3 px-3 text-right">-</td>
                    <td className="py-3 px-3 text-right font-black">{formatNumber(dailySummaryData.totals.fuelAmount, 0)}</td>
                    <td className="py-3 px-3 text-right font-black text-amber-900">{formatNumber(dailySummaryData.totals.mobilOil, 0)}</td>
                    <td className="py-3 px-3 text-right font-black text-indigo-900">{formatNumber(dailySummaryData.totals.driverAdvance, 0)}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-950">{formatNumber(dailySummaryData.totals.totalAmount, 0)}</td>
                    <td className="py-3 px-3 text-right font-black text-rose-700">{formatNumber(dailySummaryData.totals.dueAmount, 0)}</td>
                    <td colSpan={2} className="py-3 px-3 text-center font-sans text-slate-400 font-normal">-</td>
                  </tr>
                </tfoot>
              )}
            </table>
            <Pagination 
              currentPage={detailedPage}
              totalItems={matchedChallans.length}
              pageSize={detailedPageSize}
              onPageChange={setDetailedPage}
              onPageSizeChange={(sz) => { setDetailedPageSize(sz); setDetailedPage(1); }}
            />
          </div>
        )}
      </div>

      {/* 3. PRINT REPORT MODAL FORM (MATCHING REFERENCE IMAGE 2 - WITH SAVE PDF, PRINT, EXPORT, HEADING) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-150">
            
            {/* Top Modal Navigation Header Bar (SCREEN ONLY - Clean White Style) */}
            <div className="px-6 py-4 bg-white text-slate-800 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                    Consolidated Summary Challans Report
                  </h3>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {activeCustomer?.name} &bull; Daily Trucks &amp; Fuel Payment Statement
                  </span>
                </div>
              </div>

              {/* Action Buttons: Save PDF, Print Report, Export Excel, Close X */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const fname = `Diyal_Summary_Challan_${(activeCustomer?.name || 'Customer').replace(/\s+/g, '_')}_${startDate}_to_${endDate}.pdf`;
                    exportReportToPDF('consolidated-challan-report', fname);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer transition-all border border-blue-200 shadow-xs"
                  title="Save this document directly to PDF file on your computer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODAL REPORT BODY (PRINTABLE STATEMENT MATCHING REFERENCE IMAGE 2) */}
            <div id="consolidated-challan-report" className="print-area p-6 sm:p-8 bg-white text-slate-900 relative">
              
              {/* Header: Logo, Diyal Filling Station & Contact (NO image on top right as requested) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                <div className="flex items-center gap-3">
                  <img 
                    src="./logo.png" 
                    alt="Diyal Logo" 
                    className="h-12 sm:h-14 w-auto object-contain shrink-0 drop-shadow-xs"
                    onError={e => { e.target.src = './logo.jpg'; }}
                  />
                  <div className="flex flex-col leading-none">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-wider uppercase font-sans">
                      DIYAL
                    </h2>
                    <h3 className="text-xs font-bold tracking-widest text-[#C32026] uppercase mt-0.5">
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

              {/* Title Block with Period & Total Challans / Trucks Pills */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                    Consolidated Summary Challans
                  </h1>
                  <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                    {activeCustomer?.company ? `${activeCustomer.name} (${activeCustomer.company})` : activeCustomer?.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily summary of fleet trucks, fuel payments, separate Mobil Oil &amp; driver cash advances
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block leading-none">Billing Period</span>
                      <span className="font-bold text-slate-800">{formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block leading-none">Total Trucks</span>
                      <span className="font-black text-blue-700">{dailySummaryData.totals.trucks} Trucks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Summary Cards: Customer Details (Left) + 4 Stat Badges (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-5">
                
                {/* Left Card: Customer Details */}
                <div className="md:col-span-6 rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="bg-[#1e3a8a] text-white px-4 py-2 font-bold text-xs flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Customer Details</span>
                  </div>
                  <div className="p-3.5 bg-slate-50/50 space-y-1.5 text-xs">
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-medium">Customer Name:</span>
                      <span className="font-bold text-slate-900">{activeCustomer?.company || activeCustomer?.name}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-medium">Contact Person:</span>
                      <span className="text-slate-800 font-medium">M. Bilal</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-medium">Phone:</span>
                      <span className="font-mono text-slate-800">{activeCustomer?.phone || '+92 301 5551234'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-medium shrink-0">Address:</span>
                      <span className="text-slate-700">{activeCustomer?.address || 'Terminal #4, Goods Forwarding Agency, Lahore / Multan Road'}</span>
                    </div>
                    <div className="flex">
                      <span className="w-32 text-slate-500 font-medium">Customer Type:</span>
                      <span className="text-slate-800">Transport Company</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Summary (4 circular badges in a row) */}
                <div className="md:col-span-6 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="bg-[#0f172a] text-white px-4 py-2 font-bold text-xs flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Summary Overview</span>
                  </div>
                  <div className="p-3.5 bg-slate-50/50 flex-1 grid grid-cols-4 gap-2 text-center items-center font-mono">
                    
                    {/* Circle 1: Total Litres */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <Fuel className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Litres</span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5">{formatNumber(dailySummaryData.totals.litres, 2)} L</span>
                    </div>

                    {/* Circle 2: Total Trucks */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <Truck className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Trucks</span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5">{dailySummaryData.totals.trucks}</span>
                    </div>

                    {/* Circle 3: Total Amount */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Amount</span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5">PKR {formatNumber(dailySummaryData.totals.totalAmount, 0)}</span>
                    </div>

                    {/* Circle 4: Outstanding Due */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Outstanding Due</span>
                      <span className="text-xs font-bold text-rose-700 mt-0.5">PKR {formatNumber(dailySummaryData.totals.dueAmount, 0)}</span>
                    </div>

                  </div>
                </div>

              </div>

              {/* DAILY CONSOLIDATED SUMMARY TABLE WITH SEPARATE ADVANCE & MOBIL OIL */}
              <div className="my-5 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-[#1e3a8a] text-white px-4 py-2 font-bold text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    <span>Daily Consolidated Fleet Summary</span>
                  </div>
                  <span className="text-[11px] font-normal text-blue-100">
                    {dailySummaryData.rows.length} Days &bull; {dailySummaryData.totals.trucks} Trucks
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3 text-center">#</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-center">Trucks</th>
                        <th className="py-2.5 px-3 text-right">Fuel Litres</th>
                        <th className="py-2.5 px-3 text-right">Fuel Amt (PKR)</th>
                        <th className="py-2.5 px-3 text-right">Mobil Oil (PKR)</th>
                        <th className="py-2.5 px-3 text-right">Driver Advance (PKR)</th>
                        <th className="py-2.5 px-3 text-right font-black">Total Amount (PKR)</th>
                        <th className="py-2.5 px-3 text-right">Payment Rec. (PKR)</th>
                        <th className="py-2.5 px-3 text-right text-rose-700 font-black">Due (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {dailySummaryData.rows.map((r, idx) => (
                        <tr key={r.date} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-400 font-sans">{idx + 1}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-slate-900 font-bold">{formatDateDisplay(r.date)}</td>
                          <td className="py-2 px-3 text-center whitespace-nowrap font-bold text-blue-700">{r.truckCount} Trucks</td>
                          <td className="py-2 px-3 text-right font-semibold">{r.litres > 0 ? `${formatNumber(r.litres, 2)} L` : '-'}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatNumber(r.fuelAmount || 0, 0)}</td>
                          {/* SEPARATE COLUMN: Mobil Oil */}
                          <td className="py-2 px-3 text-right text-amber-800 font-bold">{r.mobilOil > 0 ? formatNumber(r.mobilOil, 0) : '-'}</td>
                          {/* SEPARATE COLUMN: Driver Advance */}
                          <td className="py-2 px-3 text-right text-indigo-800 font-bold">{r.driverAdvance > 0 ? formatNumber(r.driverAdvance, 0) : '-'}</td>
                          <td className="py-2 px-3 text-right font-black text-slate-950">{formatNumber(r.totalAmount, 0)}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">{r.paidAmount > 0 ? formatNumber(r.paidAmount, 0) : '-'}</td>
                          <td className="py-2 px-3 text-right font-black text-rose-700">{formatNumber(r.dueAmount, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                      <tr>
                        <td colSpan={2} className="py-3 px-3 uppercase font-sans font-black">
                          TOTAL ({dailySummaryData.rows.length} Days)
                        </td>
                        <td className="py-3 px-3 text-center font-black text-blue-700">
                          {dailySummaryData.totals.trucks} Trucks
                        </td>
                        <td className="py-3 px-3 text-right font-black">{formatNumber(dailySummaryData.totals.litres, 2)} L</td>
                        <td className="py-3 px-3 text-right font-black">{formatNumber(dailySummaryData.totals.fuelAmount, 0)}</td>
                        <td className="py-3 px-3 text-right font-black text-amber-800">{formatNumber(dailySummaryData.totals.mobilOil, 0)}</td>
                        <td className="py-3 px-3 text-right font-black text-indigo-800">{formatNumber(dailySummaryData.totals.driverAdvance, 0)}</td>
                        <td className="py-3 px-3 text-right font-black text-slate-950">{formatNumber(dailySummaryData.totals.totalAmount, 0)}</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-800">{formatNumber(dailySummaryData.totals.paidAmount, 0)}</td>
                        <td className="py-3 px-3 text-right font-black text-rose-700">{formatNumber(dailySummaryData.totals.dueAmount, 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Footer matching Reference Image 2: Note (Left) & Thank You / Diyal Filling Station (Right) */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs relative overflow-hidden">
                <div className="text-slate-600 max-w-lg space-y-1">
                  <div className="flex items-center gap-1 font-bold text-slate-800">
                    <span>ℹ️ Note:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    &bull; This is a daily consolidated summary bill. Itemized individual challans are logged against each vehicle.
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    &bull; Please arrange payment against the outstanding due amount at the earliest.
                  </p>
                </div>

                <div className="sm:text-right pr-6">
                  <div className="font-serif italic text-lg sm:text-xl font-bold text-slate-900 tracking-wide">
                    Thank You
                  </div>
                  <div className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Diyal Filling Station
                  </div>
                </div>

                {/* Diagonal brand stripes in bottom-right corner as shown in Reference Image 2 */}
                <div className="absolute right-0 bottom-0 pointer-events-none opacity-90 hidden sm:block">
                  <div className="w-16 h-16 overflow-hidden relative">
                    <div className="w-24 h-4 bg-[#C32026] rotate-45 absolute -right-6 top-8"></div>
                    <div className="w-24 h-4 bg-[#1e3a8a] rotate-45 absolute -right-6 top-4"></div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
