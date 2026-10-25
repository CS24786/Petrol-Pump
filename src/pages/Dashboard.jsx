import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Fuel, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Users, 
  PlusCircle, 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight,
  Database,
  Truck,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Building2,
  BarChart3,
  Zap,
  Receipt,
  FileSpreadsheet,
  UserPlus,
  Droplet,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay } from '../utils/formatters';

export default function Dashboard({ onNavigate, onOpenQuickSale, onOpenReceipt, onOpenPaymentModal }) {
  const [salesPeriod, setSalesPeriod] = useState('7days'); // '7days', 'month'

  // Live queries directly connected to Dexie Database
  const sales = useLiveQuery(() => db.sales?.toArray() || [], []);
  const tanks = useLiveQuery(() => db.tanks?.toArray() || [], []);
  const customers = useLiveQuery(() => db.customers?.toArray() || [], []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries?.toArray() || [], []);
  const expenses = useLiveQuery(() => db.expenses?.toArray() || [], []);
  const purchases = useLiveQuery(() => db.purchases?.toArray() || [], []);
  const employeePayments = useLiveQuery(() => db.employeePayments?.toArray() || [], []);

  // 1. Total Sales KPI (Live from db.sales)
  const totalSalesAmount = useMemo(() => {
    if (!sales || sales.length === 0) return 0;
    return sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  }, [sales]);

  // 2. Fuel Stock KPI (Live sum of underground tanks current stock in litres)
  const totalFuelStockLitres = useMemo(() => {
    if (!tanks || tanks.length === 0) return 0;
    return tanks.reduce((acc, t) => acc + (Number(t.currentStockLitres) || 0), 0);
  }, [tanks]);

  // 3. Customer Dues KPI (Live receivables: opening balance + unpaid credit sales + ledger entries)
  const totalCustomerDues = useMemo(() => {
    if (!customers || customers.length === 0) return 0;
    let total = 0;
    customers.forEach(c => {
      const custSales = (sales || []).filter(s => s.customerId === c.id);
      const custEntries = (ledgerEntries || []).filter(e => e.customerId === c.id);
      const netSales = custSales.reduce((sum, s) => sum + ((Number(s.totalAmount) || 0) - (Number(s.paidAmount) || 0)), 0);
      const netLedger = custEntries.reduce((sum, e) => sum + (Number(e.outAmount) || 0) - (Number(e.inAmount) || 0), 0);
      total += (Number(c.openingBalance) || 0) + netSales + netLedger;
    });
    return Math.max(0, total);
  }, [customers, sales, ledgerEntries]);

  // 4. Total Expenses KPI (Live sum of Roznamcha operating expenses + staff wage disbursements)
  const totalExpensesAmount = useMemo(() => {
    const expSum = (expenses || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const wageSum = (employeePayments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    return expSum + wageSum;
  }, [expenses, employeePayments]);

  // 5. Daily Sales Trends for Chart (Dynamically computed from real db.sales)
  const chartDays = useMemo(() => {
    const numDays = salesPeriod === 'month' ? 30 : 7;
    const now = new Date();
    
    // Extract unique dates from actual sales
    const salesDates = [...new Set((sales || []).map(s => s.date).filter(Boolean))].sort();

    let targetDates = [];
    if (salesDates.length > 0) {
      targetDates = salesDates.slice(-numDays);
      // Pad to at least 7 dates for consistent layout
      if (targetDates.length < 7) {
        const lastDate = new Date(targetDates[targetDates.length - 1]);
        let offset = 1;
        while (targetDates.length < 7) {
          const prev = new Date(lastDate);
          prev.setDate(prev.getDate() - offset);
          const iso = prev.toISOString().split('T')[0];
          if (!targetDates.includes(iso)) {
            targetDates.unshift(iso);
          }
          offset++;
        }
      }
    } else {
      // Clean zero state: generate last 7 calendar days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        targetDates.push(d.toISOString().split('T')[0]);
      }
    }

    return targetDates.map(dateStr => {
      const daySales = (sales || []).filter(s => s.date === dateStr);
      const fuel = daySales.reduce((sum, s) => sum + (Number(s.dieselAmount) || 0), 0);
      const total = daySales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
      const parts = dateStr.split('-');
      const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : dateStr;
      return {
        date: label,
        fullDate: dateStr,
        fuel,
        total
      };
    });
  }, [sales, salesPeriod]);

  // Scale maximum dynamically based on highest daily sale
  const chartMaxVal = useMemo(() => {
    const max = Math.max(0, ...chartDays.map(d => d.total));
    return max > 0 ? Math.ceil(max * 1.2) : 50000;
  }, [chartDays]);

  // 6. Product volume breakdown for Donut Chart (Live from db.sales)
  const productShares = useMemo(() => {
    let pmg = 0;
    let hsd = 0;
    let other = 0;

    (sales || []).forEach(s => {
      const litres = Number(s.litres) || 0;
      const t = (s.fuelType || '').toLowerCase();
      if (t.includes('petrol') || t.includes('pmg')) {
        pmg += litres;
      } else if (t.includes('diesel') || t.includes('hsd')) {
        hsd += litres;
      } else if (litres > 0) {
        other += litres;
      }
    });

    const totalLitres = pmg + hsd + other;
    if (totalLitres === 0) return [];

    const pmgPct = Math.round((pmg / totalLitres) * 100);
    const hsdPct = Math.round((hsd / totalLitres) * 100);
    const otherPct = Math.max(0, 100 - pmgPct - hsdPct);

    const circumference = 238; // 2 * pi * 38
    let currentOffset = 0;
    const list = [];

    if (pmg > 0) {
      const dash = Math.round((pmgPct / 100) * circumference);
      list.push({
        label: 'Petrol (PMG)',
        litres: pmg,
        pct: pmgPct,
        color: '#10B981',
        strokeDasharray: `${dash} ${circumference}`,
        strokeDashoffset: currentOffset
      });
      currentOffset -= dash;
    }

    if (hsd > 0) {
      const dash = Math.round((hsdPct / 100) * circumference);
      list.push({
        label: 'Diesel (HSD)',
        litres: hsd,
        pct: hsdPct,
        color: '#F59E0B',
        strokeDasharray: `${dash} ${circumference}`,
        strokeDashoffset: currentOffset
      });
      currentOffset -= dash;
    }

    if (otherPct > 0) {
      const dash = Math.round((otherPct / 100) * circumference);
      list.push({
        label: 'Others / Mobil Oil',
        litres: other,
        pct: otherPct,
        color: '#3B82F6',
        strokeDasharray: `${dash} ${circumference}`,
        strokeDashoffset: currentOffset
      });
    }

    return list;
  }, [sales]);

  // 7. Tank Stock Statuses (Live from db.tanks)
  const tankList = useMemo(() => {
    if (!tanks || tanks.length === 0) return [];
    return tanks.map(t => {
      const stock = Number(t.currentStockLitres) || 0;
      const cap = Number(t.capacityLitres) || 25000;
      const pct = cap > 0 ? Math.min(100, Math.round((stock / cap) * 100)) : 0;
      let color = '#10B981';
      if (t.fuelType === 'Diesel' || t.fuelType === 'HSD') color = '#F59E0B';

      return {
        id: t.id,
        name: t.tankName || t.fuelType,
        fuelType: t.fuelType,
        litres: stock,
        capacity: cap,
        pct,
        color
      };
    });
  }, [tanks]);

  // 8. Recent Transactions Audit Trail (Live from db.sales, db.purchases, db.expenses, db.employeePayments)
  const recentTransactions = useMemo(() => {
    const list = [];

    (sales || []).forEach(s => {
      list.push({
        id: `s-${s.id}`,
        timestamp: s.createdAt || `${s.date}T12:00:00`,
        dateTime: formatDateDisplay(s.date),
        type: s.isRetail ? 'Retail Sale' : 'Fleet Challan',
        typeBadge: s.isRetail ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200',
        customer: s.isRetail ? 'Walk-in Retail' : (s.customerName || 'Fleet Account'),
        fuelType: s.fuelType || 'Fuel',
        amount: Number(s.totalAmount) || 0,
        status: s.paymentStatus || (s.paymentType === 'Cash' ? 'Paid' : 'Credit'),
        statusBadge: s.paymentType === 'Credit' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      });
    });

    (purchases || []).forEach(p => {
      list.push({
        id: `p-${p.id}`,
        timestamp: p.createdAt || `${p.date}T10:00:00`,
        dateTime: formatDateDisplay(p.date),
        type: 'Tanker Delivery',
        typeBadge: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
        customer: p.supplierName || 'Fuel Supplier',
        fuelType: p.fuelType || 'Fuel Supply',
        amount: Number(p.totalAmount) || 0,
        status: p.status || 'Received',
        statusBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      });
    });

    (expenses || []).forEach(e => {
      list.push({
        id: `e-${e.id}`,
        timestamp: e.createdAt || `${e.date}T09:00:00`,
        dateTime: formatDateDisplay(e.date),
        type: 'Expense',
        typeBadge: 'bg-orange-50 text-orange-700 border border-orange-200',
        customer: e.paidTo || e.category || 'Station Expense',
        fuelType: '-',
        amount: Number(e.amount) || 0,
        status: 'Paid',
        statusBadge: 'bg-slate-100 text-slate-700 border border-slate-200'
      });
    });

    (employeePayments || []).forEach(ep => {
      list.push({
        id: `ep-${ep.id}`,
        timestamp: ep.createdAt || `${ep.date}T11:00:00`,
        dateTime: formatDateDisplay(ep.date),
        type: ep.type === 'Advance' ? 'Staff Advance' : 'Staff Salary',
        typeBadge: 'bg-purple-50 text-purple-700 border border-purple-200',
        customer: ep.employeeName || 'Staff Member',
        fuelType: '-',
        amount: Number(ep.amount) || 0,
        status: 'Disbursed',
        statusBadge: 'bg-purple-50 text-purple-700 border border-purple-200'
      });
    });

    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  }, [sales, purchases, expenses, employeePayments]);

  // 9. Recent Customers List (Live from db.customers)
  const recentCustomersList = useMemo(() => {
    if (!customers || customers.length === 0) return [];
    const colors = [
      'bg-blue-100 text-blue-700', 
      'bg-emerald-100 text-emerald-700', 
      'bg-purple-100 text-purple-700', 
      'bg-amber-100 text-amber-700', 
      'bg-rose-100 text-rose-700'
    ];
    return customers.slice(0, 5).map((c, i) => {
      const custSales = (sales || []).filter(s => s.customerId === c.id);
      const custEntries = (ledgerEntries || []).filter(e => e.customerId === c.id);
      const netSales = custSales.reduce((sum, s) => sum + ((Number(s.totalAmount) || 0) - (Number(s.paidAmount) || 0)), 0);
      const netLedger = custEntries.reduce((sum, e) => sum + (Number(e.outAmount) || 0) - (Number(e.inAmount) || 0), 0);
      const currentBalance = (Number(c.openingBalance) || 0) + netSales + netLedger;

      return {
        id: c.id,
        name: c.name,
        company: c.company || c.name,
        avatarColor: colors[i % colors.length],
        letter: (c.name || 'C')[0].toUpperCase(),
        amount: currentBalance,
        phone: c.phone || 'Fleet Account'
      };
    });
  }, [customers, sales, ledgerEntries]);

  return (
    <div className="space-y-5 pb-10 select-none">
      
      {/* 1. TOP PANORAMIC STATION BANNER */}
      <div 
        className="w-full h-44 rounded-2xl relative overflow-hidden bg-cover bg-center shadow-xs flex items-center px-6 sm:px-8 border border-slate-200/80"
        style={{ backgroundImage: "url('./dashboard_background.jpg')" }}
      >
        {/* Dark Gradient Overlay for optimal contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B2F]/95 via-[#0F1B2F]/80 to-transparent pointer-events-none"></div>

        {/* Banner Content with Clean Diyal Logo matching Login screen */}
        <div className="relative z-10 text-white max-w-xl flex items-center gap-4">
          <div className="h-14 sm:h-16 w-auto flex items-center justify-center shrink-0">
            <img
              src="./logo.png"
              alt="Diyal Logo"
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div>
            <span className="text-white/80 text-xs sm:text-sm font-medium tracking-wide block">
              Live Station Overview &bull; Real-time Operations
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white mt-0.5">
              DIYAL Filling Station
            </h1>
            <p className="text-white/75 text-xs mt-1">
              Petroleum ERP &bull; 24/7 Dispensers, Underground Tanks &amp; Fleet Ledgers
            </p>
          </div>
        </div>
      </div>

      {/* 2. FOUR TOP KPI METRIC CARDS (ALL 100% LIVE FROM DEXIE DB) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Sales
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5 truncate">
              {formatCurrency(totalSalesAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-blue-600 font-bold font-mono">
                {(sales || []).length} Records
              </span>
              <span className="text-slate-400">&bull; Live transactions</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fuel Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Droplet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Fuel Stock
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5 truncate">
              {formatNumber(totalFuelStockLitres, 0)} L
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-emerald-600 font-bold font-mono">
                {(tanks || []).length} Tanks
              </span>
              <span className="text-slate-400">&bull; Underground stock</span>
            </div>
          </div>
        </div>

        {/* Card 3: Customer Dues */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Customer Dues
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5 truncate">
              {formatCurrency(totalCustomerDues)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-amber-700 font-bold font-mono">
                {(customers || []).length} Accounts
              </span>
              <span className="text-slate-400">&bull; Net receivables</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Expenses
            </span>
            <div className="text-xl font-extrabold text-slate-900 font-sans tracking-tight mt-0.5 truncate">
              {formatCurrency(totalExpensesAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-purple-600 font-bold font-mono">
                {(expenses || []).length + (employeePayments || []).length} Vouchers
              </span>
              <span className="text-slate-400">&bull; Roznamcha &amp; Wages</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ROW 2: Sales Overview Bar/Trend Chart, Donut Chart, and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Sales Overview Chart (Cols 1 to 6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Sales Overview</h3>
            </div>
            <select
              value={salesPeriod}
              onChange={(e) => setSalesPeriod(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-600 font-medium cursor-pointer focus:outline-none"
            >
              <option value="7days">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Combined Bar + Trend Line Chart Area */}
          <div className="relative h-48 w-full pt-2">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono">
              <div className="border-b border-slate-100 pb-0.5">{Math.round(chartMaxVal / 1000)}K</div>
              <div className="border-b border-slate-100 pb-0.5">{Math.round((chartMaxVal * 0.75) / 1000)}K</div>
              <div className="border-b border-slate-100 pb-0.5">{Math.round((chartMaxVal * 0.5) / 1000)}K</div>
              <div className="border-b border-slate-100 pb-0.5">{Math.round((chartMaxVal * 0.25) / 1000)}K</div>
              <div className="border-b border-slate-200 pb-0.5">0</div>
            </div>

            {/* Vertical Bars and Trend Points */}
            <div className="relative h-full flex items-end justify-between px-6 pl-10 pb-5 z-10">
              {chartDays.map((item, idx) => {
                const barHeightPct = chartMaxVal > 0 ? Math.min(100, Math.round((item.fuel / chartMaxVal) * 100)) : 0;
                const linePointPct = chartMaxVal > 0 ? Math.min(100, Math.round((item.total / chartMaxVal) * 100)) : 0;

                return (
                  <div key={idx} className="flex flex-col items-center group relative h-full justify-end w-6">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:flex bg-slate-900 text-white text-[10px] py-0.5 px-2 rounded-md shadow pointer-events-none z-20 whitespace-nowrap font-mono">
                      {item.fullDate}: {formatCurrency(item.total)}
                    </div>

                    {/* Trend Line Dot (Only rendered if amount > 0) */}
                    {item.total > 0 && (
                      <div 
                        className="absolute w-2 h-2 rounded-full bg-[#C32026] ring-2 ring-white z-15 transition-all"
                        style={{ bottom: `${linePointPct}%`, transform: 'translateY(50%)' }}
                      ></div>
                    )}

                    {/* Bar */}
                    <div 
                      className={`w-3 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                        item.fuel > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-100 h-0.5'
                      }`}
                      style={{ height: `${Math.max(2, barHeightPct)}%` }}
                    ></div>

                    {/* Date label */}
                    <span className="text-[9px] text-slate-400 font-mono absolute -bottom-5 whitespace-nowrap">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Fuel Sales (PKR)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C32026]"></span>
              <span>Total Invoiced</span>
            </div>
          </div>
        </div>

        {/* Fuel Sales by Type Donut Chart (Cols 7 to 9) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Fuel className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Fuel Sales by Type</h3>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                {/* Segments for each fuel product */}
                {productShares.map(p => (
                  <circle
                    key={p.label}
                    cx="50"
                    cy="50"
                    r="38"
                    stroke={p.color}
                    strokeWidth="12"
                    strokeDasharray={p.strokeDasharray}
                    strokeDashoffset={p.strokeDashoffset}
                    fill="none"
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
              {/* Center Total Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Total Billed</span>
                <span className="text-xs font-black text-slate-800 font-mono mt-0.5 truncate max-w-[85px]">
                  {formatCurrency(totalSalesAmount)}
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="w-full space-y-1.5 mt-4 text-xs">
              {productShares.length === 0 ? (
                <div className="text-center py-2 text-slate-400 text-xs italic font-sans">
                  No fuel dispensed yet
                </div>
              ) : (
                productShares.map(p => (
                  <div key={p.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                      <span className="text-slate-600 font-medium text-[11px]">{p.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-400">{formatNumber(p.litres, 0)} L</span>
                      <span className="font-bold text-slate-800">{p.pct}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions (Cols 10 to 12) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
          </div>

          <div className="space-y-2.5 my-auto">
            <button
              onClick={onOpenQuickSale}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-xs font-semibold text-slate-800 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </div>
                <span>New Sale / Invoice</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('customer-ledgers')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-xs font-semibold text-slate-800 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <span>Add Customer</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('roznamcha-expenses')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-xs font-semibold text-slate-800 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <span>Add Expense</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-xs font-semibold text-slate-800 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span>View Reports</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('summary-challans')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800 cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <span>Generate Report</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

      </div>

      {/* 4. ROW 3: Recent Transactions, Fuel Stock Levels, and Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Recent Transactions Table (Cols 1 to 6) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
            </div>
            <button
              onClick={() => onNavigate('daily-sales')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-400 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Entity / Account</th>
                  <th className="py-2">Product</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans italic text-xs">
                      No transactions recorded yet. Use "New Sale", "Add Expense", or "Record Reading" to add real transactions.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 font-mono text-slate-500 whitespace-nowrap">{tx.dateTime}</td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tx.typeBadge}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-slate-800 whitespace-nowrap">{tx.customer}</td>
                      <td className="py-2.5 text-slate-600 whitespace-nowrap">{tx.fuelType}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-2.5 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tx.statusBadge}`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fuel Stock Levels (Cols 7 to 9) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Fuel Stock Levels</h3>
            </div>
            <button
              onClick={() => onNavigate('stock-management')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 my-auto">
            {tankList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic font-sans">
                No storage tanks configured. Visit Stock Management to register underground tanks.
              </div>
            ) : (
              tankList.map(tank => (
                <div key={tank.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-3.5 h-3.5" style={{ color: tank.color }} />
                      <span className="font-semibold text-slate-800">{tank.name}</span>
                    </div>
                    <span className="font-bold text-slate-600 font-mono text-[11px]">{tank.pct}%</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono pl-5">
                    {formatNumber(tank.litres, 0)} / {formatNumber(tank.capacity, 0)} L
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${tank.pct}%`, backgroundColor: tank.color }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Customers (Cols 10 to 12) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Customer Accounts</h3>
            </div>
            <button
              onClick={() => onNavigate('customer-ledgers')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 my-auto">
            {recentCustomersList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic font-sans">
                No customer accounts registered yet. Use "Add Customer" to create credit accounts.
              </div>
            ) : (
              recentCustomersList.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${c.avatarColor}`}>
                      {c.letter}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 leading-tight">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {formatCurrency(c.amount)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                    {c.phone}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
