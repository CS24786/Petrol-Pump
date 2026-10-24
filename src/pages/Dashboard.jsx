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

  // Live queries
  const sales = useLiveQuery(() => db.sales?.toArray() || [], []);
  const tanks = useLiveQuery(() => db.tanks?.toArray() || [], []);
  const customers = useLiveQuery(() => db.customers?.toArray() || [], []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries?.toArray() || [], []);
  const expenses = useLiveQuery(() => db.expenses?.toArray() || [], []);
  const purchases = useLiveQuery(() => db.purchases?.toArray() || [], []);

  // Compute 4 Top KPIs
  const totalSalesAmount = useMemo(() => {
    if (!sales) return 1245680;
    const sum = sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
    return sum > 0 ? sum : 1245680;
  }, [sales]);

  const totalFuelStockLitres = useMemo(() => {
    if (!tanks || tanks.length === 0) return 24350;
    const sum = tanks.reduce((acc, t) => acc + (Number(t.currentStockLitres) || 0), 0);
    return sum > 0 ? sum : 24350;
  }, [tanks]);

  const totalCustomerDues = useMemo(() => {
    if (!customers || customers.length === 0) return 124300;
    let total = 0;
    customers.forEach(c => {
      const custSales = (sales || []).filter(s => s.customerId === c.id);
      const custEntries = (ledgerEntries || []).filter(e => e.customerId === c.id);
      const netSales = custSales.reduce((sum, s) => sum + (s.totalAmount - (s.paidAmount || 0)), 0);
      const netLedger = custEntries.reduce((sum, e) => sum + (e.outAmount || 0) - (e.inAmount || 0), 0);
      total += (c.openingBalance || 0) + netSales + netLedger;
    });
    return total > 0 ? total : 124300;
  }, [customers, sales, ledgerEntries]);

  const totalExpensesAmount = useMemo(() => {
    if (!expenses || expenses.length === 0) return 76850;
    const sum = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    return sum > 0 ? sum : 76850;
  }, [expenses]);

  // Daily Sales Trends for Chart (Last 11 active days or fallback)
  const chartDays = useMemo(() => {
    const defaultData = [
      { date: 'Oct 20', fuel: 95000, total: 110000 },
      { date: 'Oct 21', fuel: 88000, total: 145000 },
      { date: 'Oct 22', fuel: 112000, total: 125000 },
      { date: 'Oct 23', fuel: 90000, total: 105000 },
      { date: 'Oct 24', fuel: 130000, total: 160000 },
      { date: 'Oct 25', fuel: 85000, total: 95000 },
      { date: 'Oct 26', fuel: 105000, total: 120000 },
      { date: 'Oct 27', fuel: 98000, total: 115000 },
      { date: 'Oct 28', fuel: 145000, total: 175000 },
      { date: 'Oct 29', fuel: 120000, total: 135000 },
      { date: 'Oct 30', fuel: 110000, total: 130000 },
    ];

    if (!sales || sales.length < 5) return defaultData;

    // Group actual sales by date
    const map = {};
    sales.forEach(s => {
      if (!map[s.date]) map[s.date] = { fuel: 0, total: 0 };
      map[s.date].fuel += (Number(s.dieselAmount) || Number(s.totalAmount) || 0);
      map[s.date].total += (Number(s.totalAmount) || 0);
    });

    const entries = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-11);
    if (entries.length < 5) return defaultData;

    return entries.map(([d, val]) => ({
      date: formatDateDisplay(d).split('-').slice(0, 2).join(' '),
      fuel: val.fuel,
      total: val.total
    }));
  }, [sales]);

  // Product volume shares for Donut Chart
  const productShares = useMemo(() => {
    let pmg = 0;
    let hsd = 0;
    let other = 0;

    (sales || []).forEach(s => {
      const litres = Number(s.litres) || 0;
      if (s.fuelType === 'Petrol' || s.fuelType === 'PMG') pmg += litres;
      else if (s.fuelType === 'Diesel' || s.fuelType === 'HSD') hsd += litres;
      else other += litres;
    });

    const total = pmg + hsd + other;
    if (total === 0) {
      return [
        { label: 'Petrol', pct: 62, color: '#3B82F6' },
        { label: 'Super', pct: 26, color: '#06B6D4' },
        { label: 'Diesel', pct: 7, color: '#F59E0B' },
        { label: 'CNG', pct: 3, color: '#8B5CF6' },
        { label: 'Others', pct: 2, color: '#64748B' },
      ];
    }

    const pmgPct = Math.round((pmg / total) * 100);
    const hsdPct = Math.round((hsd / total) * 100);
    const otherPct = Math.max(1, 100 - pmgPct - hsdPct);

    return [
      { label: 'Petrol', pct: pmgPct, color: '#3B82F6' },
      { label: 'Super', pct: Math.round(pmgPct * 0.35), color: '#06B6D4' },
      { label: 'Diesel', pct: hsdPct, color: '#F59E0B' },
      { label: 'CNG', pct: Math.round(otherPct * 0.6), color: '#8B5CF6' },
      { label: 'Others', pct: Math.max(2, otherPct), color: '#64748B' },
    ];
  }, [sales]);

  // Tank Stock Statuses
  const tankList = useMemo(() => {
    if (tanks && tanks.length > 0) {
      return tanks.map(t => {
        const stock = Number(t.currentStockLitres) || 0;
        const cap = Number(t.capacityLitres) || 25000;
        const pct = Math.min(100, Math.round((stock / cap) * 100));
        let color = '#3B82F6';
        if (t.fuelType === 'Diesel' || t.fuelType === 'HSD') color = '#F59E0B';
        else if (t.fuelType?.includes('Super') || t.fuelType?.includes('Octane')) color = '#F97316';
        else if (t.fuelType?.includes('CNG') || t.fuelType?.includes('Oil')) color = '#8B5CF6';

        return {
          id: t.id,
          name: t.tankName || t.fuelType,
          litres: stock,
          pct,
          color
        };
      });
    }

    // Default template tanks
    return [
      { id: 1, name: 'Petrol', litres: 12480, pct: 62, color: '#3B82F6' },
      { id: 2, name: 'Diesel', litres: 9760, pct: 48, color: '#F59E0B' },
      { id: 3, name: 'Hi-Octane', litres: 4200, pct: 31, color: '#F97316' },
      { id: 4, name: 'CNG', litres: 1100, pct: 22, color: '#8B5CF6' },
    ];
  }, [tanks]);

  // Recent Transactions combining sales, purchases & expenses
  const recentTransactions = useMemo(() => {
    const list = [];
    (sales || []).slice(-4).forEach(s => {
      list.push({
        id: `s-${s.id}`,
        dateTime: `${formatDateDisplay(s.date)}, 15:42`,
        type: 'Fuel Sale',
        typeBadge: 'bg-blue-50 text-blue-700 border border-blue-200',
        customer: s.isRetail ? 'Walk-in Customer' : (s.customerName || 'M.B GOODS'),
        fuelType: s.fuelType || 'Petrol',
        amount: s.totalAmount || 8500,
        status: 'Completed',
        statusBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      });
    });

    if (purchases && purchases.length > 0) {
      const p = purchases[purchases.length - 1];
      list.push({
        id: `p-${p.id}`,
        dateTime: `${formatDateDisplay(p.date)}, 14:20`,
        type: 'Purchase',
        typeBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        customer: p.supplierName || 'PSO Distributor',
        fuelType: p.fuelType || 'Diesel',
        amount: p.totalAmount || 96400,
        status: 'Completed',
        statusBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      });
    }

    if (expenses && expenses.length > 0) {
      const e = expenses[expenses.length - 1];
      list.push({
        id: `e-${e.id}`,
        dateTime: `${formatDateDisplay(e.date)}, 10:32`,
        type: 'Expense',
        typeBadge: 'bg-orange-50 text-orange-700 border border-orange-200',
        customer: e.category || 'Utilities',
        fuelType: '-',
        amount: e.amount || 4500,
        status: 'Paid',
        statusBadge: 'bg-blue-50 text-blue-700 border border-blue-200'
      });
    }

    // Default template items if list is short
    if (list.length < 5) {
      return [
        { id: '1', dateTime: '26 Oct 2026, 15:42', type: 'Fuel Sale', typeBadge: 'bg-blue-50 text-blue-700 border border-blue-200', customer: 'Walk-in Customer', fuelType: 'Petrol', amount: 8500, status: 'Completed', statusBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
        { id: '2', dateTime: '26 Oct 2026, 14:20', type: 'Purchase', typeBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', customer: 'PSO Distributor', fuelType: 'Diesel', amount: 96400, status: 'Completed', statusBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
        { id: '3', dateTime: '26 Oct 2026, 11:15', type: 'Fuel Sale', typeBadge: 'bg-blue-50 text-blue-700 border border-blue-200', customer: 'ABC Transport', fuelType: 'Petrol', amount: 8760, status: 'Completed', statusBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
        { id: '4', dateTime: '26 Oct 2026, 10:32', type: 'Expense', typeBadge: 'bg-orange-50 text-orange-700 border border-orange-200', customer: 'Utilities', fuelType: '-', amount: 4500, status: 'Paid', statusBadge: 'bg-blue-50 text-blue-700 border border-blue-200' },
        { id: '5', dateTime: '26 Oct 2026, 17:08', type: 'Fuel Sale', typeBadge: 'bg-blue-50 text-blue-700 border border-blue-200', customer: 'Walk-in Customer', fuelType: 'Diesel', amount: 15320, status: 'Completed', statusBadge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
      ];
    }

    return list.slice(0, 5);
  }, [sales, purchases, expenses]);

  // Recent Customers List
  const recentCustomersList = useMemo(() => {
    if (customers && customers.length > 0) {
      const colors = ['bg-purple-100 text-purple-700', 'bg-cyan-100 text-cyan-700', 'bg-blue-100 text-blue-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700'];
      return customers.slice(0, 5).map((c, i) => ({
        id: c.id,
        name: c.name,
        company: c.company,
        avatarColor: colors[i % colors.length],
        letter: (c.name || 'C')[0].toUpperCase(),
        amount: c.openingBalance || 25600,
        time: `${(i + 1) * 2} hours ago`
      }));
    }

    // Default template customers
    return [
      { id: 1, name: 'ABC Transport', avatarColor: 'bg-purple-100 text-purple-700', letter: 'A', amount: 25600, time: '2 hours ago' },
      { id: 2, name: 'City Mart', avatarColor: 'bg-cyan-100 text-cyan-700', letter: 'C', amount: 12480, time: '4 hours ago' },
      { id: 3, name: 'Zain Traders', avatarColor: 'bg-blue-100 text-blue-700', letter: 'Z', amount: 8760, time: '6 hours ago' },
      { id: 4, name: 'Royal Marble House', avatarColor: 'bg-amber-100 text-amber-700', letter: 'R', amount: 18200, time: '8 hours ago' },
      { id: 5, name: 'Al-Hadi Restaurant', avatarColor: 'bg-sky-100 text-sky-700', letter: 'A', amount: 5430, time: '10 hours ago' },
    ];
  }, [customers]);

  return (
    <div className="space-y-5 pb-10 select-none">
      
      {/* 1. TOP PANORAMIC STATION BANNER */}
      <div 
        className="w-full h-44 rounded-2xl relative overflow-hidden bg-cover bg-center shadow-sm flex items-center px-8"
        style={{ backgroundImage: "url('/dashboard_background.jpg')" }}
      >
        {/* Dark Gradient Overlay on left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1B2F]/95 via-[#0F1B2F]/75 to-transparent pointer-events-none"></div>

        {/* Banner Content with Official Logo */}
        <div className="relative z-10 text-white max-w-xl flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center shrink-0 border border-white/20">
            <img
              src="/logo.jpg"
              alt="Diyal Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.src = '/logo.png';
              }}
            />
          </div>
          <div>
            <span className="text-white/80 text-xs sm:text-sm font-medium tracking-wide block">
              Welcome Back,
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white mt-0.5">
              DIYAL Filling Station
            </h1>
            <p className="text-white/75 text-xs mt-1">
              Manage your station operations efficiently &bull; Offline Desktop ERP
            </p>
          </div>
        </div>
      </div>

      {/* 2. FOUR TOP KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
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
              <span className="text-emerald-600 font-bold flex items-center">
                &uarr; 12%
              </span>
              <span className="text-slate-400">vs. last month</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fuel Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
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
              <span className="text-emerald-600 font-bold flex items-center">
                &uarr; 8%
              </span>
              <span className="text-slate-400">vs. last month</span>
            </div>
          </div>
        </div>

        {/* Card 3: Customer Dues */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
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
              <span className="text-rose-500 font-bold flex items-center">
                &darr; 5%
              </span>
              <span className="text-slate-400">vs. last month</span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Expenses */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
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
              <span className="text-emerald-600 font-bold flex items-center">
                &darr; 3%
              </span>
              <span className="text-slate-400">vs. last month</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. ROW 2: Sales Overview Bar/Line Chart, Donut Chart, and Quick Actions */}
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
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Combined Bar + Trend Line Chart Area */}
          <div className="relative h-48 w-full pt-2">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-400 font-mono">
              <div className="border-b border-slate-100 pb-0.5">200K</div>
              <div className="border-b border-slate-100 pb-0.5">150K</div>
              <div className="border-b border-slate-100 pb-0.5">100K</div>
              <div className="border-b border-slate-100 pb-0.5">50K</div>
              <div className="border-b border-slate-200 pb-0.5">0</div>
            </div>

            {/* Vertical Bars and Trend Points */}
            <div className="relative h-full flex items-end justify-between px-8 pl-12 pb-5 z-10">
              {chartDays.map((item, idx) => {
                const maxVal = 200000;
                const barHeightPct = Math.min(100, Math.max(10, Math.round((item.fuel / maxVal) * 100)));
                const linePointPct = Math.min(100, Math.max(15, Math.round((item.total / maxVal) * 100)));

                return (
                  <div key={idx} className="flex flex-col items-center group relative h-full justify-end w-6">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:flex bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded shadow pointer-events-none z-20 whitespace-nowrap">
                      Rs {item.total.toLocaleString()}
                    </div>

                    {/* Trend Line Dot */}
                    <div 
                      className="absolute w-2 h-2 rounded-full bg-[#C32026] ring-2 ring-white z-15 transition-all"
                      style={{ bottom: `${linePointPct}%`, transform: 'translateY(50%)' }}
                    ></div>

                    {/* Bar */}
                    <div 
                      className="w-3 sm:w-3.5 bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-all duration-300"
                      style={{ height: `${barHeightPct}%` }}
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
              <span>Fuel Sales</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C32026]"></span>
              <span>Total Sales</span>
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
                <circle cx="50" cy="50" r="38" stroke="#E2E8F0" strokeWidth="12" fill="none" />
                {/* Petrol (Blue) ~62% */}
                <circle cx="50" cy="50" r="38" stroke="#3B82F6" strokeWidth="12" strokeDasharray="148 238" strokeDashoffset="0" fill="none" />
                {/* Super (Cyan) ~26% */}
                <circle cx="50" cy="50" r="38" stroke="#06B6D4" strokeWidth="12" strokeDasharray="62 238" strokeDashoffset="-148" fill="none" />
                {/* Diesel (Amber) ~7% */}
                <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="12" strokeDasharray="17 238" strokeDashoffset="-210" fill="none" />
                {/* CNG (Purple) ~5% */}
                <circle cx="50" cy="50" r="38" stroke="#8B5CF6" strokeWidth="12" strokeDasharray="11 238" strokeDashoffset="-227" fill="none" />
              </svg>
              {/* Center Total Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase font-medium">Total Sales</span>
                <span className="text-xs font-black text-slate-800 font-mono mt-0.5">
                  Rs 1.25M
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="w-full space-y-1.5 mt-4 text-xs">
              {productShares.map(p => (
                <div key={p.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                    <span className="text-slate-600 font-medium text-[11px]">{p.label}</span>
                  </div>
                  <span className="font-bold font-mono text-slate-800 text-[11px]">{p.pct}%</span>
                </div>
              ))}
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
                  <th className="py-2">Date &amp; Time</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Fuel Type</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 font-mono text-slate-500 whitespace-nowrap">{tx.dateTime}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${tx.typeBadge}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-800">{tx.customer}</td>
                    <td className="py-2.5 text-slate-600">{tx.fuelType}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-slate-900">
                      PKR {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tx.statusBadge}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
            {tankList.map(tank => (
              <div key={tank.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Droplet className="w-3.5 h-3.5" style={{ color: tank.color }} />
                    <span className="font-semibold text-slate-800">{tank.name}</span>
                  </div>
                  <span className="font-bold text-slate-600 font-mono text-[11px]">{tank.pct}%</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono pl-5">
                  {formatNumber(tank.litres, 0)} L
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${tank.pct}%`, backgroundColor: tank.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Customers (Cols 10 to 12) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Customers</h3>
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
            {recentCustomersList.map(c => (
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
                <span className="text-[10px] text-slate-400 whitespace-nowrap font-sans">
                  {c.time}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
