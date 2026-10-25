import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Receipt, 
  Fuel, 
  Search, 
  Download, 
  Printer, 
  Calendar, 
  Gauge, 
  Truck, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  DollarSign,
  PlusCircle,
  Eye,
  Wallet,
  Droplet,
  Layers
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';
import ThreeCopyChallanModal from '../components/ThreeCopyChallanModal';
import Pagination from '../components/Pagination';

export default function DailySales({ onOpenQuickSale, onOpenReceipt }) {
  const [selectedDate, setSelectedDate] = useState('2026-10-22');
  const [fuelFilter, setFuelFilter] = useState('All');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('All'); // 'All', 'Business', 'Retail'
  const [searchQuery, setSearchQuery] = useState('');
  const [challanFor3Copy, setChallanFor3Copy] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Queries
  const sales = useLiveQuery(() => db.sales?.orderBy('id').reverse().toArray() || [], []);
  const meterReadings = useLiveQuery(() => db.meterReadings?.toArray() || [], []);
  const fuelRates = useLiveQuery(() => db.fuelRates?.toArray() || [], []);
  const settingsList = useLiveQuery(() => db.settings?.toArray() || [], []);

  const pumpName = settingsList?.find(s => s.key === 'pumpName')?.value || 'DIYAL FILLING STATION';

  // Filter sales for the selected date
  const dateSales = useMemo(() => {
    if (!sales || !selectedDate) return [];
    return sales.filter(s => {
      if (s.date !== selectedDate) return false;
      if (fuelFilter !== 'All') {
        if (fuelFilter === 'Diesel' && s.fuelType !== 'Diesel' && s.fuelType !== 'HSD') return false;
        if (fuelFilter === 'Petrol' && s.fuelType !== 'Petrol' && s.fuelType !== 'PMG') return false;
      }
      if (customerTypeFilter === 'Business' && s.isRetail) return false;
      if (customerTypeFilter === 'Retail' && !s.isRetail) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSerial = s.serialNo?.toString().toLowerCase().includes(q);
        const matchesCust = s.customerName?.toLowerCase().includes(q);
        const matchesVeh = s.vehicleNo?.toLowerCase().includes(q);
        if (!matchesSerial && !matchesCust && !matchesVeh) return false;
      }
      return true;
    });
  }, [sales, selectedDate, fuelFilter, customerTypeFilter, searchQuery]);

  const paginatedSales = useMemo(() => {
    const start = (page - 1) * pageSize;
    return dateSales.slice(start, start + pageSize);
  }, [dateSales, page, pageSize]);

  // DAILY 3-WAY RECONCILIATION TOTALS
  const reconciliation = useMemo(() => {
    // 1. Ground Truth Meter Totals for selected date
    let dieselMeterLitres = 0;
    let dieselMeterSales = 0;
    let petrolMeterLitres = 0;
    let petrolMeterSales = 0;

    (meterReadings || []).filter(r => r.date === selectedDate).forEach(r => {
      const sold = (Number(r.litresSold) || 0) + (Number(r.adjustments) || 0);
      const amt = Number(r.salesAmount) || 0;
      if (r.fuelType === 'Diesel' || r.fuelType === 'HSD') {
        dieselMeterLitres += sold;
        dieselMeterSales += amt;
      } else if (r.fuelType === 'Petrol' || r.fuelType === 'PMG') {
        petrolMeterLitres += sold;
        petrolMeterSales += amt;
      }
    });

    // 2. Company Truck Fleet Challans for date
    let dieselTruckLitres = 0;
    let dieselTruckAmount = 0;
    let petrolTruckLitres = 0;
    let petrolTruckAmount = 0;
    let totalMobilOil = 0;
    let totalCashAdvances = 0;

    (sales || []).filter(s => s.date === selectedDate && !s.isRetail).forEach(s => {
      const ltr = Number(s.litres) || 0;
      const amt = Number(s.dieselAmount) || 0;
      if (s.fuelType === 'Diesel' || s.fuelType === 'HSD') {
        dieselTruckLitres += ltr;
        dieselTruckAmount += amt;
      } else {
        petrolTruckLitres += ltr;
        petrolTruckAmount += amt;
      }
      totalMobilOil += (Number(s.mobilOil) || 0);
      totalCashAdvances += (Number(s.cashAdvance) || 0);
    });

    // 3. Retail Unrecorded Reconciliation Difference (Meter - Truck)
    const dieselRetailLitres = Math.max(0, dieselMeterLitres - dieselTruckLitres);
    const dieselRate = dieselMeterLitres > 0 ? (dieselMeterSales / dieselMeterLitres) : 397.45;
    const dieselRetailAmount = Math.round(dieselRetailLitres * dieselRate);

    const petrolRetailLitres = Math.max(0, petrolMeterLitres - petrolTruckLitres);
    const petrolRate = petrolMeterLitres > 0 ? (petrolMeterSales / petrolMeterLitres) : 400.66;
    const petrolRetailAmount = Math.round(petrolRetailLitres * petrolRate);

    // Total Station Revenue from Fuel (Based on Meter Readings, which includes truck + retail)
    const totalMeterFuelSales = dieselMeterSales + petrolMeterSales;
    // Total Station Turnover including Mobil Oil from challans
    const totalGrossTurnover = totalMeterFuelSales + totalMobilOil;

    // Discrepancy checks
    const hasDiscrepancy = dieselTruckLitres > dieselMeterLitres || petrolTruckLitres > petrolMeterLitres;

    return {
      dieselMeterLitres,
      dieselMeterSales,
      petrolMeterLitres,
      petrolMeterSales,
      totalMeterLitres: dieselMeterLitres + petrolMeterLitres,
      totalMeterFuelSales,
      dieselTruckLitres,
      dieselTruckAmount,
      petrolTruckLitres,
      petrolTruckAmount,
      totalTruckLitres: dieselTruckLitres + petrolTruckLitres,
      totalTruckAmount: dieselTruckAmount + petrolTruckAmount,
      dieselRetailLitres,
      dieselRetailAmount,
      petrolRetailLitres,
      petrolRetailAmount,
      totalRetailLitres: dieselRetailLitres + petrolRetailLitres,
      totalRetailAmount: dieselRetailAmount + petrolRetailAmount,
      totalMobilOil,
      totalCashAdvances,
      totalGrossTurnover,
      hasDiscrepancy
    };
  }, [meterReadings, sales, selectedDate]);

  // Export Daily Sales
  const handleExportCSV = () => {
    const rows = dateSales.map(s => ({
      'Challan / Serial #': s.serialNo || s.id,
      'Date': s.date,
      'Customer': s.isRetail ? 'Walk-in Customer' : s.customerName,
      'Vehicle #': s.vehicleNo || 'General',
      'Fuel Type': s.fuelType,
      'Litres': s.litres,
      'Rate': s.rate,
      'Fuel Amount': s.dieselAmount,
      'Mobil Oil': s.mobilOil || 0,
      'Cash Advance': s.cashAdvance || 0,
      'Total Amount': s.totalAmount,
      'Payment Mode': s.paymentType
    }));
    exportToCSV(`Daily_Sales_Billing_${selectedDate}.csv`, rows);
  };

  return (
    <div className="space-y-5 pb-10 select-none">
      
      {/* 1. TOP PANORAMIC STATION BANNER (Identical to Dashboard) */}
      <div 
        className="w-full h-44 rounded-2xl relative overflow-hidden bg-cover bg-center shadow-sm flex items-center justify-between px-8"
        style={{ backgroundImage: "url('./dashboard_background.jpg')" }}
      >
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B2F]/95 via-[#0F1B2F]/80 to-transparent pointer-events-none"></div>

        {/* Banner Left Info */}
        <div className="relative z-10 text-white max-w-xl flex items-center gap-3.5">
          <img
            src="./logo.png"
            alt="Diyal Logo"
            className="h-12 w-auto object-contain shrink-0 drop-shadow-md"
            onError={(e) => {
              e.target.src = './logo.jpg';
            }}
          />
          <div>
            <span className="text-white/80 text-xs sm:text-sm font-medium tracking-wide block">
              Diyal Filling Station &bull; Module 2
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white mt-0.5">
              Sales &amp; Meter Dispensing
            </h1>
            <p className="text-white/75 text-xs mt-1">
              Ground-truth meter dispensing, fleet truck challans &amp; retail reconciliation
            </p>
          </div>
        </div>

        {/* Banner Right Quick Controls */}
        <div className="relative z-10 flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
          {/* Date Selector Pill */}
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs text-white">
            <Calendar className="w-4 h-4 text-white/80" />
            <span className="text-white/70 font-medium">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-white outline-none cursor-pointer font-mono"
            />
          </div>

          {/* Quick Dispense F2 Button */}
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C32026] hover:bg-[#a81a1f] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Sale (F2)</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR TOP METRIC CARDS (Styled exactly like Dashboard KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Meter Dispensed Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              1. Total Meter Sales
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5 truncate">
              {formatCurrency(reconciliation.totalMeterFuelSales)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-blue-600 font-bold font-mono">
                {formatNumber(reconciliation.totalMeterLitres, 1)} L
              </span>
              <span className="text-slate-400">Total dispensed</span>
            </div>
          </div>
        </div>

        {/* Card 2: Company Fleet Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              2. Company Challans
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5 truncate">
              {formatCurrency(reconciliation.totalTruckAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-indigo-600 font-bold font-mono">
                {formatNumber(reconciliation.totalTruckLitres, 1)} L
              </span>
              <span className="text-slate-400">Fleet ledger sales</span>
            </div>
          </div>
        </div>

        {/* Card 3: Unrecorded Retail Difference */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              3. Retail Walk-in (Diff)
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5 truncate">
              {formatCurrency(reconciliation.totalRetailAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-emerald-600 font-bold font-mono">
                {formatNumber(reconciliation.totalRetailLitres, 1)} L
              </span>
              <span className="text-slate-400">Calculated diff only</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Station Turnover */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Daily Turnover
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5 truncate">
              {formatCurrency(reconciliation.totalGrossTurnover)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-purple-600 font-bold">
                +{formatCurrency(reconciliation.totalMobilOil)}
              </span>
              <span className="text-slate-400">Mobil Oil billed</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. CORE RECONCILIATION SUMMARY BANNER */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-sm">3-Way Reconciliation Principle (Zero Double-Counting)</span>
            <div className="flex items-center gap-1.5">
              {reconciliation.hasDiscrepancy ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Excess Truck Fleet Sales!
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Reconciliation Balanced &amp; Verified
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 text-slate-600 leading-relaxed">
            Meter readings represent the ground-truth fuel dispensed at the nozzles. Company truck sales are included inside the meter totals. Unrecorded retail sales is purely a calculated difference (<code className="font-mono bg-blue-100 px-1 py-0.5 rounded font-bold">Total Meter − Truck Challans</code>); ordinary retail walk-in customers do not have customer profiles, bills, or ledgers.
          </p>
        </div>
      </div>

      {/* 4. PRODUCT-WISE RECONCILIATION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Diesel (HSD) Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h3 className="text-sm font-bold text-slate-900">Diesel (HSD) Reconciliation</h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-700">
              Meter: {formatNumber(reconciliation.dieselMeterLitres, 2)} L
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600 font-sans">Total Meter Dispensed:</span>
              <span className="font-bold text-slate-900">{formatNumber(reconciliation.dieselMeterLitres, 2)} L &bull; {formatCurrency(reconciliation.dieselMeterSales)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600 font-sans">Company Fleet Challans:</span>
              <span className="font-bold text-indigo-700">{formatNumber(reconciliation.dieselTruckLitres, 2)} L &bull; {formatCurrency(reconciliation.dieselTruckAmount)}</span>
            </div>
            <div className="flex justify-between py-1 font-sans">
              <span className="text-slate-600">Calculated Walk-in Retail Difference:</span>
              <span className="font-mono font-bold text-emerald-700">{formatNumber(reconciliation.dieselRetailLitres, 2)} L &bull; {formatCurrency(reconciliation.dieselRetailAmount)}</span>
            </div>
          </div>
        </div>

        {/* Petrol (PMG) Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h3 className="text-sm font-bold text-slate-900">Petrol (PMG) Reconciliation</h3>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700">
              Meter: {formatNumber(reconciliation.petrolMeterLitres, 2)} L
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600 font-sans">Total Meter Dispensed:</span>
              <span className="font-bold text-slate-900">{formatNumber(reconciliation.petrolMeterLitres, 2)} L &bull; {formatCurrency(reconciliation.petrolMeterSales)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-600 font-sans">Company Fleet Challans:</span>
              <span className="font-bold text-indigo-700">{formatNumber(reconciliation.petrolTruckLitres, 2)} L &bull; {formatCurrency(reconciliation.petrolTruckAmount)}</span>
            </div>
            <div className="flex justify-between py-1 font-sans">
              <span className="text-slate-600">Calculated Walk-in Retail Difference:</span>
              <span className="font-mono font-bold text-emerald-700">{formatNumber(reconciliation.petrolRetailLitres, 2)} L &bull; {formatCurrency(reconciliation.petrolRetailAmount)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 5. SEARCH & FILTER STRIP */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 no-print">
        
        {/* Left Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Fuel Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['All', 'Diesel', 'Petrol'].map(type => (
              <button
                key={type}
                onClick={() => setFuelFilter(type)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  fuelFilter === type
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type === 'All' ? 'All Fuels' : type}
              </button>
            ))}
          </div>

          {/* Customer Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'All', label: 'All Accounts' },
              { id: 'Business', label: 'Company Fleet' },
              { id: 'Retail', label: 'Retail' }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setCustomerTypeFilter(c.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  customerTypeFilter === c.id
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Search Box & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Vehicle, Customer, Challan #..."
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 uppercase"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Print Daily Sales Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>

      </div>

      {/* 6. SALES & BILLING TRANSACTIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Fuel Sales &amp; Fleet Challans Register
            </h3>
            <span className="text-xs text-slate-400 font-mono">({dateSales.length} records)</span>
          </div>
          <span className="text-xs font-mono text-slate-500">Date: {formatDateDisplay(selectedDate)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-400 border-b border-slate-100 font-semibold bg-slate-50/50">
              <tr>
                <th className="py-2.5 px-3">Challan #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Customer Profile</th>
                <th className="py-2.5 px-3">Vehicle #</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Litres</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Fuel Amt</th>
                <th className="py-2.5 px-3 text-right">Adv / Oil</th>
                <th className="py-2.5 px-3 text-right">Total Billed</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {dateSales.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 italic font-sans">
                    No sales or fleet transactions recorded for {formatDateDisplay(selectedDate)}. Press F2 or click "New Sale" to record.
                  </td>
                </tr>
              ) : (
                paginatedSales.map(s => {
                  const advancesAndOil = (Number(s.cashAdvance) || 0) + (Number(s.mobilOil) || 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        #{s.serialNo || s.id}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {s.time || '10:00'}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {s.isRetail ? (
                          <span className="text-slate-500 italic">Walk-in Retail</span>
                        ) : (
                          s.customerName || 'M.B GOODS'
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {s.vehicleNo || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.fuelType === 'Petrol' || s.fuelType === 'PMG'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {s.fuelType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                        {s.litres > 0 ? `${formatNumber(s.litres, 2)} L` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {s.rate > 0 ? formatNumber(s.rate, 2) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatNumber(s.dieselAmount || 0, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {advancesAndOil > 0 ? formatNumber(advancesAndOil, 0) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-slate-900 text-xs">
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.paymentType === 'Credit'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {s.paymentType === 'Credit' ? 'Credit' : 'Paid'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 3-Copy Challan Print Button for fleet */}
                          {!s.isRetail ? (
                            <button
                              onClick={() => setChallanFor3Copy(s)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-[10px] border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="Print 3 Copies (Pump Internal, Driver, Company)"
                            >
                              <Printer className="w-3 h-3" />
                              <span>3 Copies</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenReceipt(s)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              title="View & Print Bill"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {dateSales.length > 0 && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td colSpan={5} className="py-3 px-3 uppercase font-mono">Date Totals:</td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatNumber(dateSales.reduce((sum, s) => sum + (Number(s.litres) || 0), 0), 2)} L
                  </td>
                  <td></td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatCurrency(dateSales.reduce((sum, s) => sum + (Number(s.dieselAmount) || 0), 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    {formatCurrency(dateSales.reduce((sum, s) => sum + (Number(s.cashAdvance) || 0) + (Number(s.mobilOil) || 0), 0))}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-blue-700 text-xs">
                    {formatCurrency(dateSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <Pagination 
          currentPage={page}
          totalItems={dateSales.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
        />
      </div>

      {/* 3-Copy Print Modal */}
      {challanFor3Copy && (
        <ThreeCopyChallanModal
          isOpen={true}
          challan={challanFor3Copy}
          onClose={() => setChallanFor3Copy(null)}
        />
      )}

    </div>
  );
}
