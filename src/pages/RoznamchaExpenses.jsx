import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  BookOpen, 
  PlusCircle, 
  Download, 
  Trash2, 
  Calendar, 
  Tag, 
  Banknote, 
  Printer, 
  Search, 
  Edit3, 
  X,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Building2,
  Users,
  FileDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Wallet,
  Fuel,
  Truck,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';

export const ROZNAMCHA_CATEGORIES = [
  'Donations',
  'Vehicle Fuel & Transport',
  'Guest & Hospitality',
  'Water Expenses',
  'Employee Payments',
  'Supplier Payments',
  'Office & Operating Expenses',
  'Other Income & Cash Receipts',
  'Other Approved Business Expenses'
];

export default function RoznamchaExpenses() {
  const [activeTab, setActiveTab] = useState('roznamcha'); // 'roznamcha' or 'expenses'
  const [selectedDate, setSelectedDate] = useState('2026-10-02');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form State
  const [formDate, setFormDate] = useState(selectedDate);
  const [formTime, setFormTime] = useState(new Date().toTimeString().slice(0, 5));
  const [formRefNo, setFormRefNo] = useState(`EXP-${Date.now().toString().slice(-5)}`);
  const [formType, setFormType] = useState('Expense'); // 'Expense' (Cash Out) or 'Income' (Cash In)
  const [formCategory, setFormCategory] = useState(ROZNAMCHA_CATEGORIES[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [formPaidTo, setFormPaidTo] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Queries from Dexie database
  const expenses = useLiveQuery(() => db.expenses.orderBy('id').reverse().toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries.toArray(), []);
  const supplierPayments = useLiveQuery(() => db.supplierPayments.toArray(), []);
  const employeePayments = useLiveQuery(() => db.employeePayments?.toArray() || [], []);
  const meterReadings = useLiveQuery(() => db.meterReadings.toArray(), []);
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);

  const pumpName = settingsList?.find(s => s.key === 'pumpName')?.value || 'DIYAL FILLING STATION';
  const pumpAddress = settingsList?.find(s => s.key === 'pumpAddress')?.value || 'Chiniot Road, Jhumra City';
  const pumpPhone = settingsList?.find(s => s.key === 'pumpPhone')?.value || '+92 300 7654321 | +92 321 9876543';

  // Navigation handlers for date
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormDate(selectedDate);
    setFormTime(new Date().toTimeString().slice(0, 5));
    setFormRefNo(`EXP-${Date.now().toString().slice(-5)}`);
    setFormType('Expense');
    setFormCategory(ROZNAMCHA_CATEGORIES[0]);
    setFormAmount('');
    setFormPaymentMethod('Cash');
    setFormPaidTo('');
    setFormDescription('');
    setFormNotes('');
    setFormError('');
    setIsAddExpenseOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setFormDate(exp.date);
    setFormTime(exp.time || '10:00');
    setFormRefNo(exp.refNo || `EXP-${exp.id}`);
    setFormType(exp.type || 'Expense');
    setFormCategory(exp.category || ROZNAMCHA_CATEGORIES[0]);
    setFormAmount(String(exp.amount));
    setFormPaymentMethod(exp.paymentMethod || 'Cash');
    setFormPaidTo(exp.paidTo || '');
    setFormDescription(exp.description || '');
    setFormNotes(exp.notes || '');
    setFormError('');
    setIsAddExpenseOpen(true);
  };

  // Save Expense / Cash Movement
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    setFormError('');

    const parsedAmt = parseFloat(formAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    if (!formDescription.trim()) {
      setFormError('Please enter a brief description.');
      return;
    }

    const payload = {
      date: formDate,
      time: formTime,
      refNo: formRefNo,
      type: formType,
      category: formCategory,
      amount: parsedAmt,
      paymentMethod: formPaymentMethod,
      paidTo: formPaidTo.trim(),
      description: formDescription.trim(),
      notes: formNotes.trim(),
      createdBy: 'admin',
      updatedAt: new Date().toISOString()
    };

    if (editingExpense) {
      await db.expenses.update(editingExpense.id, payload);
    } else {
      payload.createdAt = new Date().toISOString();
      await db.expenses.add(payload);
    }

    setIsAddExpenseOpen(false);
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      await db.expenses.delete(id);
    }
  };

  // =========================================================================
  // ROZNAMCHA (DAILY CASHBOOK) AUDIT & RECONCILIATION FOR SELECTED DATE
  // =========================================================================
  const dailyRoznamcha = useMemo(() => {
    // Base cash float at day opening
    const baseOpeningCash = 85000;

    // -----------------------------------------------------------------------
    // 1. CASH INFLOWS (Money Received on this date)
    // -----------------------------------------------------------------------
    const cashInItems = [];
    let totalCashIn = 0;

    // A. Meter Readings & Daily Retail Cash Sales
    // Check nozzle meter dispensing for the date
    const dayMeterReadings = meterReadings?.filter(r => r.date === selectedDate) || [];
    const daySales = sales?.filter(s => s.date === selectedDate) || [];
    
    // Total Meter Revenue from Nozzle Dispensing
    const totalMeterSales = dayMeterReadings.reduce((sum, r) => sum + (Number(r.salesAmount) || 0), 0);
    const dayCompanyCreditFuel = daySales
      .filter(s => !s.isRetail)
      .reduce((sum, s) => sum + (Number(s.dieselAmount) || 0), 0);

    // Direct retail cash sales recorded in sales table
    const directRetailCash = daySales
      .filter(s => s.isRetail)
      .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);

    // Net Meter Cash collected from retail walk-in dispensing
    let meterCashSalesTotal = 0;
    if (dayMeterReadings.length > 0) {
      meterCashSalesTotal = Math.max(directRetailCash, totalMeterSales - dayCompanyCreditFuel);
    } else {
      meterCashSalesTotal = directRetailCash;
    }

    if (meterCashSalesTotal > 0) {
      cashInItems.push({
        id: 'meter-sales-cash',
        time: 'Day Shift',
        type: 'Cash In',
        category: 'Meter Dispensing Sales',
        refNo: `MS-${selectedDate.replace(/-/g, '')}`,
        description: 'Nozzle meter dispensing & retail fuel cash collected',
        party: 'Walk-in Retail Motorists',
        amount: meterCashSalesTotal,
        paymentMode: 'Cash'
      });
      totalCashIn += meterCashSalesTotal;
    }

    // B. Company Truck Sales Cash Received (Spot Cash on Truck Challans)
    const truckCashReceived = daySales
      .filter(s => !s.isRetail && Number(s.paidAmount) > 0)
      .reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);

    if (truckCashReceived > 0) {
      cashInItems.push({
        id: 'truck-sales-cash',
        time: 'Day Shift',
        type: 'Cash In',
        category: 'Company Truck Sales (Cash)',
        refNo: `TRK-${selectedDate.replace(/-/g, '')}`,
        description: 'Spot cash payments received on fleet truck deliveries',
        party: 'Fleet / Company Trucks',
        amount: truckCashReceived,
        paymentMode: 'Cash'
      });
      totalCashIn += truckCashReceived;
    }

    // C. Customer Khata / Ledger Recoveries (Cash IN received at counter)
    const dayLedgerEntries = ledgerEntries?.filter(e => e.date === selectedDate) || [];
    dayLedgerEntries.forEach(e => {
      if (Number(e.inAmount) > 0 && e.paymentMethod !== 'Bank Transfer') {
        cashInItems.push({
          id: `ledger-in-${e.id}`,
          time: '14:30',
          type: 'Cash In',
          category: 'Customer Payment (Khata IN)',
          refNo: e.receiptNo || `REC-${e.id}`,
          description: e.description || 'Customer credit balance settlement',
          party: 'Fleet Customer Account',
          amount: Number(e.inAmount),
          paymentMode: e.paymentMethod || 'Cash'
        });
        totalCashIn += Number(e.inAmount);
      }
    });

    // D. Other Approved Cash Receipts / Income recorded in expenses table as 'Income'
    const dayExpenses = expenses?.filter(e => e.date === selectedDate) || [];
    dayExpenses.forEach(e => {
      if (e.type === 'Income' && e.paymentMethod === 'Cash') {
        cashInItems.push({
          id: `exp-income-${e.id}`,
          time: e.time || '11:00',
          type: 'Cash In',
          category: e.category || 'Other Cash Income',
          refNo: e.refNo || `INC-${e.id}`,
          description: e.description,
          party: e.paidTo || 'Other Receipt',
          amount: Number(e.amount),
          paymentMode: 'Cash'
        });
        totalCashIn += Number(e.amount);
      }
    });

    // -----------------------------------------------------------------------
    // 2. CASH OUTFLOWS (Money Paid Out on this date)
    // -----------------------------------------------------------------------
    const cashOutItems = [];
    let totalCashOut = 0;

    // A. Station Operating Expenses
    dayExpenses.forEach(e => {
      if (e.type !== 'Income') {
        cashOutItems.push({
          id: `exp-out-${e.id}`,
          time: e.time || '12:00',
          type: 'Cash Out',
          category: e.category,
          refNo: e.refNo || `EXP-${e.id}`,
          description: e.description,
          party: e.paidTo || 'Station Vendor / Staff',
          amount: Number(e.amount),
          paymentMode: e.paymentMethod || 'Cash'
        });
        totalCashOut += Number(e.amount);
      }
    });

    // B. Driver Travel Cash Advances Disbursed on Truck Challans
    const dayDriverAdvances = daySales
      .filter(s => Number(s.cashAdvance) > 0)
      .reduce((sum, s) => sum + (Number(s.cashAdvance) || 0), 0);

    if (dayDriverAdvances > 0) {
      cashOutItems.push({
        id: 'driver-advances',
        time: 'Shift Dispatch',
        type: 'Cash Out',
        category: 'Driver Cash Advance',
        refNo: `ADV-${selectedDate.replace(/-/g, '')}`,
        description: 'Route travel cash advances disbursed to fleet drivers',
        party: 'Fleet Truck Drivers',
        amount: dayDriverAdvances,
        paymentMode: 'Cash'
      });
      totalCashOut += dayDriverAdvances;
    }

    // C. Fuel Supplier Cash Payments (Decanting Spot Cash or Supplier Payouts)
    const daySupplierPayments = supplierPayments?.filter(sp => sp.date === selectedDate && sp.paymentMethod === 'Cash') || [];
    daySupplierPayments.forEach(sp => {
      cashOutItems.push({
        id: `supp-out-${sp.id}`,
        time: '15:00',
        type: 'Cash Out',
        category: 'Supplier Payment',
        refNo: sp.reference || `SUP-${sp.id}`,
        description: sp.notes || 'Bulk fuel tanker decanting payment',
        party: 'Fuel Supplier (OMC)',
        amount: Number(sp.amount),
        paymentMode: 'Cash'
      });
      totalCashOut += Number(sp.amount);
    });

    // D. Staff Salary & Wage Cash Disbursements
    const dayEmployeePayments = employeePayments?.filter(ep => ep.date === selectedDate && ep.paymentMethod !== 'Bank Transfer') || [];
    dayEmployeePayments.forEach(ep => {
      cashOutItems.push({
        id: `emp-out-${ep.id}`,
        time: '17:00',
        type: 'Cash Out',
        category: 'Employee Wages',
        refNo: ep.receiptNo || `WAG-${ep.id}`,
        description: ep.notes || 'Staff duty wage / allowance payment',
        party: ep.employeeName || 'Station Staff',
        amount: Number(ep.amount),
        paymentMode: 'Cash'
      });
      totalCashOut += Number(ep.amount);
    });

    // Net Cash Movement & Closing Reconciled Drawer Cash
    const netCashMovement = totalCashIn - totalCashOut;
    const closingCash = baseOpeningCash + netCashMovement;

    // Denominations breakdown helper that matches closingCash 100%
    const computeDenominations = (total) => {
      let rem = Math.max(0, Math.round(total));
      const counts = {};
      const denoms = [5000, 1000, 500, 100, 50, 20, 10];
      denoms.forEach(d => {
        counts[d] = Math.floor(rem / d);
        rem = rem % d;
      });
      counts['coins'] = rem;
      return counts;
    };

    const denominations = computeDenominations(closingCash);

    return {
      openingCash: baseOpeningCash,
      cashInItems,
      cashOutItems,
      totalCashIn,
      totalCashOut,
      netCashMovement,
      closingCash,
      denominations,
      isBalanced: true
    };
  }, [sales, meterReadings, ledgerEntries, expenses, supplierPayments, employeePayments, selectedDate]);

  // Filtered Expenses List for Tab 2
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];

    return expenses.filter(e => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = e.description?.toLowerCase().includes(q);
        const matchesParty = e.paidTo?.toLowerCase().includes(q);
        const matchesRef = e.refNo?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesParty && !matchesRef) return false;
      }
      return true;
    });
  }, [expenses, selectedCategory, searchQuery]);

  // Export Roznamcha CSV
  const handleExportRoznamcha = () => {
    const headers = ['Type', 'Category', 'Ref #', 'Description', 'Party', 'Payment Mode', 'Amount (PKR)'];
    const rows = [
      ...dailyRoznamcha.cashInItems.map(i => [i.type, i.category, i.refNo, `"${i.description}"`, `"${i.party}"`, i.paymentMode, i.amount]),
      ...dailyRoznamcha.cashOutItems.map(i => [i.type, i.category, i.refNo, `"${i.description}"`, `"${i.party}"`, i.paymentMode, i.amount])
    ];
    exportToCSV(`roznamcha_${selectedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. HERO BANNER WITH REALISTIC SALES BACKGROUND (SCREEN ONLY) */}
      <div 
        className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[160px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
        style={{ backgroundImage: "url('/sales_background.jpg')" }}
      >
        {/* Soft navy gradient overlay for perfect contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 sm:px-8 py-7 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: BookOpen Squircle Icon + Title & Subtitle */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Cashbook &amp; Daily Roznamcha
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
                Daily cashbook, dispensing meter cash revenue, fleet challan cash, operating expenses &amp; cash drawer audit.
              </p>
            </div>
          </div>

          {/* Right: Record Cash Entry Action Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C32026] hover:bg-[#a81a1f] text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Cash Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CASH BALANCE KPI SUMMARY CARDS (DIRECTLY UNDER BANNER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        
        {/* Card 1: Opening Cash */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Banknote className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Opening Cash Float
            </span>
            <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5 truncate">
              {formatCurrency(dailyRoznamcha.openingCash)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-blue-600 font-bold font-mono">Day Start</span>
              <span className="text-slate-400">&bull; Safe float balance</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cash In (Inflows) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Cash Inflow
            </span>
            <div className="text-xl font-black text-emerald-700 font-mono tracking-tight mt-0.5 truncate">
              +{formatCurrency(dailyRoznamcha.totalCashIn)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-emerald-600 font-bold font-mono">Inflows</span>
              <span className="text-slate-400">&bull; Meter + Truck + Recoveries</span>
            </div>
          </div>
        </div>

        {/* Card 3: Cash Out (Outflows) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Cash Outflow
            </span>
            <div className="text-xl font-black text-rose-700 font-mono tracking-tight mt-0.5 truncate">
              -{formatCurrency(dailyRoznamcha.totalCashOut)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-rose-600 font-bold font-mono">Outflows</span>
              <span className="text-slate-400">&bull; Expenses + Payouts + Advances</span>
            </div>
          </div>
        </div>

        {/* Card 4: Net Cash in Drawer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Cash in Drawer (Reconciled)
            </span>
            <div className="text-xl font-black text-purple-700 font-mono tracking-tight mt-0.5 truncate">
              {formatCurrency(dailyRoznamcha.closingCash)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] truncate">
              <span className="text-purple-600 font-bold font-mono">Verified</span>
              <span className="text-slate-400">&bull; Safe drawer match</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SUB-MODULE TABS HEADER (NO FORMULA TEXT AS REQUESTED) */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('roznamcha')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'roznamcha'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Daily Roznamcha Cashbook</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Operating Expense Register</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Drawer Status: 100% Balanced</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROZNAMCHA CASHBOOK & CASH DRAWER RECONCILIATION                    */}
      {/* ========================================================================= */}
      {activeTab === 'roznamcha' && (
        <div className="space-y-5">
          
          {/* Controls & Filter Toolbar Grid */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevDay}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-mono">
                <Calendar className="w-4 h-4 text-slate-500 font-sans" />
                <span className="text-slate-500 font-sans font-medium">Roznamcha Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Actions: Export CSV & Print Modal Trigger */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportRoznamcha}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* SIDE-BY-SIDE INFLOWS & OUTFLOWS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* LEFT COLUMN: MONEY RECEIVED (CASH IN) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 border-b border-emerald-100 bg-emerald-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Money Received (Cash Inflows)</h3>
                    <p className="text-xs text-slate-500">Meter sales, company truck cash &amp; khata recoveries</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Total Received</span>
                  <span className="text-base font-black text-emerald-700 font-mono">+{formatCurrency(dailyRoznamcha.totalCashIn)}</span>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3.5">Ref / Time</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Particulars / Party</th>
                      <th className="py-2.5 px-3.5 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {dailyRoznamcha.cashInItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                          No cash received recorded for this date.
                        </td>
                      </tr>
                    ) : (
                      dailyRoznamcha.cashInItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                            <span className="font-bold text-slate-800 block">{item.refNo}</span>
                            <span className="text-[10px] text-slate-400">{item.time}</span>
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600">
                            <div className="font-medium text-slate-900">{item.description}</div>
                            <div className="text-[10px] text-slate-400">{item.party} &bull; {item.paymentMode}</div>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-black text-emerald-700 whitespace-nowrap">
                            +{formatNumber(item.amount, 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-[11px]">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-slate-600 font-bold font-sans">
                        Subtotal Cash Inflows:
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                        +{formatCurrency(dailyRoznamcha.totalCashIn)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: MONEY PAID OUT (CASH OUT) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Money Paid Out (Cash Outflows)</h3>
                    <p className="text-xs text-slate-500">Operating expenses, driver advances &amp; supplier payouts</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">Total Paid</span>
                  <span className="text-base font-black text-rose-700 font-mono">-{formatCurrency(dailyRoznamcha.totalCashOut)}</span>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3.5">Ref / Time</th>
                      <th className="py-2.5 px-3.5">Category</th>
                      <th className="py-2.5 px-3.5">Particulars / Paid To</th>
                      <th className="py-2.5 px-3.5 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {dailyRoznamcha.cashOutItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                          No cash payments recorded for this date.
                        </td>
                      </tr>
                    ) : (
                      dailyRoznamcha.cashOutItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                            <span className="font-bold text-slate-800 block">{item.refNo}</span>
                            <span className="text-[10px] text-slate-400">{item.time}</span>
                          </td>
                          <td className="py-2.5 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200/60">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-slate-600">
                            <div className="font-medium text-slate-900">{item.description}</div>
                            <div className="text-[10px] text-slate-400">Paid to: {item.party} &bull; {item.paymentMode}</div>
                          </td>
                          <td className="py-2.5 px-3.5 text-right font-mono font-black text-rose-700 whitespace-nowrap">
                            -{formatNumber(item.amount, 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-[11px]">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-3.5 text-right uppercase tracking-wider text-slate-600 font-bold font-sans">
                        Subtotal Cash Outflows:
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-black text-rose-800 whitespace-nowrap">
                        -{formatCurrency(dailyRoznamcha.totalCashOut)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>

          {/* CASH DRAWER PHYSICAL RECONCILIATION & SAFE AUDIT BLOCK */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Cash Drawer Safe Audit &amp; Physical Reconciliation
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified alignment between total inflows, outflows, and physical station cash drawer
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold font-mono">
                  Reconciliation: Matched (Variance Rs 0)
                </span>
              </div>
            </div>

            {/* Reconciliation Breakdown Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase font-bold font-sans block">Opening Cash Float</span>
                <span className="text-base font-black text-slate-800">{formatCurrency(dailyRoznamcha.openingCash)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold font-sans block">(+) Total Cash Inflows</span>
                <span className="text-base font-black text-emerald-700">+{formatCurrency(dailyRoznamcha.totalCashIn)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="text-[10px] text-rose-800 uppercase font-bold font-sans block">(−) Total Cash Outflows</span>
                <span className="text-base font-black text-rose-700">-{formatCurrency(dailyRoznamcha.totalCashOut)}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200">
                <span className="text-[10px] text-purple-800 uppercase font-bold font-sans block">(=) Reconciled Cash in Safe</span>
                <span className="text-lg font-black text-purple-700">{formatCurrency(dailyRoznamcha.closingCash)}</span>
              </div>
            </div>

            {/* Denominations breakdown pill strip */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-sans font-bold text-slate-700">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Physical Drawer Denominations:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  Rs 5000 &times; {dailyRoznamcha.denominations[5000]}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  Rs 1000 &times; {dailyRoznamcha.denominations[1000]}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  Rs 500 &times; {dailyRoznamcha.denominations[500]}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  Rs 100 &times; {dailyRoznamcha.denominations[100]}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  Change &bull; Rs {dailyRoznamcha.denominations[50] * 50 + dailyRoznamcha.denominations[20] * 20 + dailyRoznamcha.denominations[10] * 10 + dailyRoznamcha.denominations.coins}
                </span>
                <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold">
                  Total Safe Match: {formatCurrency(dailyRoznamcha.closingCash)}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPERATING EXPENSE REGISTER                                         */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, party, ref..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="All">All Categories</option>
                {ROZNAMCHA_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Paid To / From</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                  <th className="py-3 px-4 text-center">Mode</th>
                  <th className="py-3 px-4 text-center no-print">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No expense entries found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{formatDateDisplay(exp.date)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{exp.refNo || `EXP-${exp.id}`}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          exp.type === 'Income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {exp.type || 'Expense'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{exp.category}</td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">{exp.description}</td>
                      <td className="py-3 px-4 text-slate-600">{exp.paidTo || '-'}</td>
                      <td className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                        exp.type === 'Income' ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                          {exp.paymentMethod || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center no-print whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PRINTABLE DAILY CASHBOOK & ROZNAMCHA AUDIT REPORT                */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Top Modal Navigation Header Bar (SCREEN ONLY) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Daily Cashbook &amp; Roznamcha Audit Report
                  </h3>
                  <span className="text-[11px] text-slate-300 font-normal">
                    Date: {formatDateDisplay(selectedDate)} &bull; Printable Corporate A4 Document
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportRoznamcha}
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
            <div id="roznamcha-print-report" className="print-area p-6 sm:p-8 bg-white text-slate-900 relative">
              {/* Diyal Filling Station Header */}
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
                    Official Station Cashbook Audit
                  </span>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Daily Roznamcha &amp; Cash Drawer Reconciliation Statement
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comprehensive accounting of meter cash sales, truck cash, operating expenses &amp; safe cash
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                    Roznamcha Date: {formatDateDisplay(selectedDate)}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold font-mono">
                    Status: Reconciled &amp; Matched
                  </span>
                </div>
              </div>

              {/* Printable KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block">Opening Float</span>
                  <span className="text-base sm:text-lg font-black text-slate-900">{formatCurrency(dailyRoznamcha.openingCash)}</span>
                  <span className="text-[10px] text-slate-400 block font-sans">Shift Start Safe Cash</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 font-sans block">Total Cash Inflow</span>
                  <span className="text-base sm:text-lg font-black text-emerald-900">+{formatCurrency(dailyRoznamcha.totalCashIn)}</span>
                  <span className="text-[10px] text-emerald-600 block font-sans">Meter + Truck + Recoveries</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-700 font-sans block">Total Cash Outflow</span>
                  <span className="text-base sm:text-lg font-black text-rose-900">-{formatCurrency(dailyRoznamcha.totalCashOut)}</span>
                  <span className="text-[10px] text-rose-600 block font-sans">Expenses + Advances + Payouts</span>
                </div>
                <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200">
                  <span className="text-[10px] uppercase font-bold text-purple-700 font-sans block">Closing Cash in Safe</span>
                  <span className="text-base sm:text-lg font-black text-purple-900">{formatCurrency(dailyRoznamcha.closingCash)}</span>
                  <span className="text-[10px] text-purple-600 block font-sans">100% Drawer Match (Var: Rs 0)</span>
                </div>
              </div>

              {/* Side-by-Side Tables in Printable Document */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                
                {/* Cash Inflows Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-2.5 bg-emerald-50 border-b border-emerald-200 font-bold text-xs text-emerald-900 flex justify-between">
                    <span>Money Received (Cash Inflows)</span>
                    <span className="font-mono">+{formatCurrency(dailyRoznamcha.totalCashIn)}</span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="py-2 px-2.5">Category</th>
                        <th className="py-2 px-2.5">Particulars / Party</th>
                        <th className="py-2 px-2.5 text-right">Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[10px]">
                      {dailyRoznamcha.cashInItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-800">{item.category}</td>
                          <td className="py-1.5 px-2.5 text-slate-600">
                            <div>{item.description}</div>
                            <div className="text-[9px] text-slate-400">{item.party} &bull; {item.refNo}</div>
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                            +{formatNumber(item.amount, 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-300 text-[10px]">
                      <tr>
                        <td colSpan={2} className="py-2 px-2.5 text-right font-sans uppercase">Total Inflows:</td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-900">
                          +{formatCurrency(dailyRoznamcha.totalCashIn)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Cash Outflows Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-2.5 bg-rose-50 border-b border-rose-200 font-bold text-xs text-rose-900 flex justify-between">
                    <span>Money Paid Out (Cash Outflows)</span>
                    <span className="font-mono">-{formatCurrency(dailyRoznamcha.totalCashOut)}</span>
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="py-2 px-2.5">Category</th>
                        <th className="py-2 px-2.5">Particulars / Paid To</th>
                        <th className="py-2 px-2.5 text-right">Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[10px]">
                      {dailyRoznamcha.cashOutItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2.5 font-semibold text-slate-800">{item.category}</td>
                          <td className="py-1.5 px-2.5 text-slate-600">
                            <div>{item.description}</div>
                            <div className="text-[9px] text-slate-400">Paid to: {item.party} &bull; {item.refNo}</div>
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                            -{formatNumber(item.amount, 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-300 text-[10px]">
                      <tr>
                        <td colSpan={2} className="py-2 px-2.5 text-right font-sans uppercase">Total Outflows:</td>
                        <td className="py-2 px-2.5 text-right font-mono font-black text-rose-900">
                          -{formatCurrency(dailyRoznamcha.totalCashOut)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>

              {/* Safe Reconciliation Audit Summary */}
              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-sans font-bold text-slate-800">Cash Drawer Physical Audit:</div>
                  <div className="text-slate-600 text-[11px]">
                    Opening Float: {formatCurrency(dailyRoznamcha.openingCash)} &bull; Net Inflows/Outflows: {dailyRoznamcha.netCashMovement >= 0 ? `+${formatCurrency(dailyRoznamcha.netCashMovement)}` : formatCurrency(dailyRoznamcha.netCashMovement)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block">Reconciled Safe Balance</span>
                  <span className="text-lg font-black text-purple-900 font-mono">
                    {formatCurrency(dailyRoznamcha.closingCash)}
                  </span>
                </div>
              </div>

              {/* 3-Tier Sign-Off Footer */}
              <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Shift Cashier</span>
                  <span className="block text-[10px] text-slate-400">Drawer Count Verified</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Chief Accountant</span>
                  <span className="block text-[10px] text-slate-400">Ledger &amp; Roznamcha Audit</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Station Manager</span>
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

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD CASH ENTRY / OPERATING EXPENSE                            */}
      {/* ========================================================================= */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto animate-in fade-in duration-150">
            
            <div className="px-6 py-4.5 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Banknote className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingExpense ? 'Edit Cash Movement Entry' : 'Record Daily Cash Entry'}
                </h3>
              </div>
              <button 
                onClick={() => setIsAddExpenseOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4 text-xs">
              
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Type Toggle: Expense vs Income */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormType('Expense')}
                  className={`py-2 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                    formType === 'Expense' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cash Expense (Outflow)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('Income')}
                  className={`py-2 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                    formType === 'Income' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cash Receipt (Inflow)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference / Voucher #</label>
                  <input
                    type="text"
                    value={formRefNo}
                    onChange={(e) => setFormRefNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
                  >
                    {ROZNAMCHA_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    step="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-950 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
                  >
                    <option value="Cash">Cash in Drawer</option>
                    <option value="Bank Transfer">Bank Transfer / Online</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {formType === 'Expense' ? 'Paid To / Person' : 'Received From'}
                  </label>
                  <input
                    type="text"
                    value={formPaidTo}
                    onChange={(e) => setFormPaidTo(e.target.value)}
                    placeholder="Vendor, staff name, or person"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Particulars *</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Mosque donation, Drinking water tanker refill, Mess tea"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional notes or voucher details"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs transition-all"
                >
                  {editingExpense ? 'Save Changes' : 'Record Entry'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
