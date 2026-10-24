import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Users, 
  CreditCard, 
  ArrowDownLeft, 
  Calendar, 
  Download, 
  Printer, 
  PlusCircle, 
  Truck, 
  Building2, 
  CheckCircle2, 
  Search, 
  X,
  Fuel,
  ShieldCheck,
  FileSpreadsheet,
  Check,
  RefreshCw,
  FileText
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';

export default function CustomersLedger({ 
  onOpenPaymentModal, 
  onOpenReceipt, 
  activeTab = 'ledgers', 
  onTabChange,
  selectedCustomerId: propCustomerId,
  onSelectCustomer,
  hideHeader = false
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState(propCustomerId || '');

  // Synchronize with parent selectedCustomerId if supplied
  useEffect(() => {
    if (propCustomerId && propCustomerId !== selectedCustomerId) {
      setSelectedCustomerId(propCustomerId);
    }
  }, [propCustomerId]);
  const [dateFilterType, setDateFilterType] = useState('custom'); // 'month', 'custom'
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-05');
  const [selectedVehicle, setSelectedVehicle] = useState('All');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [viewMode, setViewMode] = useState('detailed'); // 'detailed' (default like company sales) | 'summary'
  
  // Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState('');
  const [newCustOpeningBalance, setNewCustOpeningBalance] = useState('');
  const [newCustBalanceType, setNewCustBalanceType] = useState('Receivable');
  const [newCustNotes, setNewCustNotes] = useState('');

  // Live queries
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries.toArray(), []);
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);
  const vehicles = useLiveQuery(
    () => selectedCustomerId ? db.vehicles.where('customerId').equals(Number(selectedCustomerId)).toArray() : [],
    [selectedCustomerId]
  );

  const pumpName = settingsList?.find(s => s.key === 'pumpName')?.value || 'DIYAL FILLING STATION';
  const pumpAddress = settingsList?.find(s => s.key === 'pumpAddress')?.value || 'Chiniot Road, Jhumra City';
  const pumpPhone = settingsList?.find(s => s.key === 'pumpPhone')?.value || '+92 300 7654321 | +92 321 9876543';

  // Initialize default to M.B GOODS
  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      const mb = customers.find(c => c.name.includes('M.B GOODS')) || customers[0];
      setSelectedCustomerId(String(mb.id));
    }
  }, [customers, selectedCustomerId]);

  const activeCustomer = useMemo(() => {
    if (!customers || !selectedCustomerId) return null;
    return customers.find(c => c.id === Number(selectedCustomerId));
  }, [customers, selectedCustomerId]);

  const isMbGoods = activeCustomer?.name?.includes('M.B GOODS');

  // Check if office rent is already charged for the selected month (M.B Goods only)
  const rentMonthKey = dateFilterType === 'month' ? selectedMonth : (startDate?.slice(0, 7) || '2026-10');
  
  const existingRentEntry = useMemo(() => {
    if (!activeCustomer || !ledgerEntries || !isMbGoods) return null;
    return ledgerEntries.find(e => 
      e.customerId === activeCustomer.id &&
      e.date.startsWith(rentMonthKey) &&
      (e.description?.toUpperCase().includes('RENT') || e.receiptNo?.toUpperCase().includes('RENT') || e.receiptNo?.includes('ADJ-0510'))
    );
  }, [activeCustomer, ledgerEntries, isMbGoods, rentMonthKey]);

  // Idempotent Rent Posting for M.B Goods
  const handlePostRent = async () => {
    if (!activeCustomer || !isMbGoods) return;
    if (existingRentEntry) {
      alert(`Office rent for ${rentMonthKey} is already recorded (${existingRentEntry.receiptNo || 'ADJ'}, PKR ${formatNumber(existingRentEntry.outAmount, 0)}). Duplicate rent charges are strictly prevented.`);
      return;
    }

    const rentDate = `${rentMonthKey}-05`; // Standard 5th of month rent date
    await db.ledgerEntries.add({
      customerId: activeCustomer.id,
      date: rentDate,
      inAmount: 0,
      outAmount: 60000,
      mobilOilAdv: 0,
      dieselAmount: 0,
      description: `MONTHLY OFFICE RENT (${rentMonthKey})`,
      receiptNo: `RENT-${rentMonthKey.replace('-', '')}`,
      paymentMethod: 'Adjustment',
      createdAt: new Date().toISOString()
    });

    setIsRentModalOpen(false);
    alert(`Successfully posted PKR 60,000 office rent for ${rentMonthKey} to ${activeCustomer.name} ledger.`);
  };

  // Quick Preset Handlers (Matching Reference Image 1)
  const handleSetPreset = (days) => {
    const baseEnd = new Date('2026-10-05');
    const start = new Date(baseEnd);
    start.setDate(start.getDate() - (days - 1));
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(baseEnd.toISOString().split('T')[0]);
    setDateFilterType('custom');
  };

  // Filtered detailed challans matching selected customer, dates, and vehicle
  const filteredChallans = useMemo(() => {
    if (!sales || !activeCustomer) return [];

    return sales
      .filter(s => {
        if (s.customerId !== activeCustomer.id) return false;
        if (startDate && s.date < startDate) return false;
        if (endDate && s.date > endDate) return false;
        if (selectedVehicle !== 'All' && s.vehicleNo !== selectedVehicle) return false;
        if (onlyUnpaid && (s.outstandingAmount || 0) <= 0) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date) || (parseInt(a.serialNo) - parseInt(b.serialNo)));
  }, [sales, activeCustomer, startDate, endDate, selectedVehicle, onlyUnpaid]);

  // Aggregated Summary Stats for the reference card badges
  const summaryStats = useMemo(() => {
    let totalLitres = 0;
    let totalFuelAmount = 0;
    let totalMobilOil = 0;
    let totalCashAdvance = 0;
    let totalChallanAmount = 0;
    let totalDue = 0;

    filteredChallans.forEach(c => {
      totalLitres += (c.litres || 0);
      totalFuelAmount += (c.dieselAmount || 0);
      totalMobilOil += (c.mobilOil || 0);
      totalCashAdvance += (c.cashAdvance || 0);
      totalChallanAmount += (c.totalAmount || 0);
      totalDue += (c.outstandingAmount ?? (c.totalAmount - (c.paidAmount || 0)));
    });

    return {
      totalLitres,
      totalFuelAmount,
      totalMobilOil,
      totalCashAdvance,
      totalChallanAmount,
      totalDue,
      count: filteredChallans.length
    };
  }, [filteredChallans]);

  // --- AGGREGATE CUSTOMER LEDGER SUMMARY (ORIGINAL EXCEL LOGIC) ---
  const ledgerData = useMemo(() => {
    if (!activeCustomer || !sales || !ledgerEntries) {
      return { 
        dailyRows: [], 
        totals: {
          trucks: 0,
          dieselLtr: 0,
          petrolLtr: 0,
          dieselAmount: 0,
          petrolAmount: 0,
          mobilOilAdv: 0,
          fuelChargesTotal: 0,
          inAmount: 0,
          outAmount: 0
        }, 
        openingBalance: 0, 
        closingBalance: 0 
      };
    }

    const allCustSales = sales.filter(s => s.customerId === activeCustomer.id);
    const allCustEntries = ledgerEntries.filter(e => e.customerId === activeCustomer.id);

    let periodStart = startDate || '';
    let periodEnd = endDate || '';
    if (dateFilterType === 'month' && selectedMonth) {
      periodStart = `${selectedMonth}-01`;
      periodEnd = `${selectedMonth}-31`;
    }

    // Opening Balance calculation at start of period
    const initialOpening = activeCustomer.openingBalance || 0;
    let priorCharges = 0;
    let priorPayments = 0;

    if (periodStart) {
      const priorSales = allCustSales.filter(s => s.date < periodStart);
      const priorEntries = allCustEntries.filter(e => e.date < periodStart);

      priorSales.forEach(s => {
        const fuelAmt = s.dieselAmount || 0;
        const advAmt = (s.cashAdvance || 0) + (s.mobilOil || 0);
        priorCharges += (fuelAmt + advAmt);
      });

      priorEntries.forEach(e => {
        priorPayments += (e.inAmount || 0);
        priorCharges += (e.outAmount || 0);
      });
    }

    const openingBalance = initialOpening + priorCharges - priorPayments;

    let periodSales = allCustSales;
    let periodEntries = allCustEntries;

    if (periodStart) {
      periodSales = periodSales.filter(s => s.date >= periodStart);
      periodEntries = periodEntries.filter(e => e.date >= periodStart);
    }
    if (periodEnd) {
      periodSales = periodSales.filter(s => s.date <= periodEnd);
      periodEntries = periodEntries.filter(e => e.date <= periodEnd);
    }

    if (selectedVehicle !== 'All') {
      periodSales = periodSales.filter(s => s.vehicleNo === selectedVehicle);
    }

    const dateSet = new Set();
    periodSales.forEach(s => dateSet.add(s.date));
    periodEntries.forEach(e => dateSet.add(e.date));

    const sortedDates = Array.from(dateSet).sort();
    let runningBalance = openingBalance;

    let totalTrucks = 0;
    let totalDieselLtr = 0;
    let totalPetrolLtr = 0;
    let totalDieselAmount = 0;
    let totalPetrolAmount = 0;
    let totalMobilOilAdv = 0;
    let totalCharges = 0;
    let totalIn = 0;
    let totalOut = 0;

    const dailyRows = sortedDates.map(date => {
      const daySales = periodSales.filter(s => s.date === date);
      const dayEntries = periodEntries.filter(e => e.date === date);

      const truckSet = new Set();
      daySales.forEach(s => {
        truckSet.add(s.serialNo || s.id);
      });
      const truckCount = truckSet.size;

      const dieselLtr = daySales.reduce((acc, s) => acc + (s.fuelType === 'Diesel' ? (s.litres || 0) : 0), 0);
      const petrolLtr = daySales.reduce((acc, s) => acc + (s.fuelType === 'Petrol' ? (s.litres || 0) : 0), 0);
      
      const dieselAmount = daySales.reduce((acc, s) => acc + (s.fuelType === 'Diesel' ? (s.dieselAmount || 0) : 0), 0);
      const petrolAmount = daySales.reduce((acc, s) => acc + (s.fuelType === 'Petrol' ? (s.dieselAmount || 0) : 0), 0);
      const fuelAmount = dieselAmount + petrolAmount;

      const cashAdvances = daySales.reduce((acc, s) => acc + (s.cashAdvance || 0), 0);
      const mobilOil = daySales.reduce((acc, s) => acc + (s.mobilOil || 0), 0);
      const dayMobilOilAdv = cashAdvances + mobilOil;

      const dayTotalAmount = fuelAmount + dayMobilOilAdv;

      const inAmount = dayEntries.reduce((acc, e) => acc + (e.inAmount || 0), 0);
      const outAmount = dayEntries.reduce((acc, e) => acc + (e.outAmount || 0), 0);

      runningBalance = runningBalance + dayTotalAmount + outAmount - inAmount;

      totalTrucks += truckCount;
      totalDieselLtr += dieselLtr;
      totalPetrolLtr += petrolLtr;
      totalDieselAmount += dieselAmount;
      totalPetrolAmount += petrolAmount;
      totalMobilOilAdv += dayMobilOilAdv;
      totalCharges += dayTotalAmount;
      totalIn += inAmount;
      totalOut += outAmount;

      return {
        date,
        truckCount,
        dieselLtr,
        petrolLtr,
        dieselAmount,
        petrolAmount,
        mobilOilAdv: dayMobilOilAdv,
        totalAmount: dayTotalAmount,
        inAmount,
        outAmount,
        balance: runningBalance
      };
    });

    return {
      dailyRows,
      totals: {
        trucks: totalTrucks,
        dieselLtr: totalDieselLtr,
        petrolLtr: totalPetrolLtr,
        dieselAmount: totalDieselAmount,
        petrolAmount: totalPetrolAmount,
        mobilOilAdv: totalMobilOilAdv,
        fuelChargesTotal: totalCharges,
        inAmount: totalIn,
        outAmount: totalOut
      },
      openingBalance,
      closingBalance: runningBalance
    };
  }, [activeCustomer, sales, ledgerEntries, dateFilterType, selectedMonth, startDate, endDate, selectedVehicle]);

  // Export to Excel CSV
  const handleExportExcel = () => {
    if (!activeCustomer || !filteredChallans.length) return;
    const rows = filteredChallans.map((c, idx) => ({
      '#': idx + 1,
      'Date': formatDateDisplay(c.date),
      'Challan #': `#${c.serialNo || c.id}`,
      'Vehicle #': c.vehicleNo,
      'Fuel Type': c.fuelType || 'Diesel',
      'Litres': c.litres,
      'Rate (PKR)': c.rate,
      'Fuel Amount (PKR)': c.dieselAmount,
      'Mobil Oil (PKR)': c.mobilOil || 0,
      'Driver Advance (PKR)': c.cashAdvance || 0,
      'Total Amount (PKR)': c.totalAmount,
      'Due (PKR)': c.outstandingAmount ?? (c.totalAmount - (c.paidAmount || 0)),
      'Status': (c.outstandingAmount <= 0 || c.paidAmount >= c.totalAmount) ? 'Paid' : 'Pending'
    }));

    // Add Totals row
    rows.push({
      '#': 'TOTAL',
      'Date': `${filteredChallans.length} Challans`,
      'Challan #': '',
      'Vehicle #': '',
      'Fuel Type': '',
      'Litres': summaryStats.totalLitres,
      'Rate (PKR)': '',
      'Fuel Amount (PKR)': summaryStats.totalFuelAmount,
      'Mobil Oil (PKR)': summaryStats.totalMobilOil,
      'Driver Advance (PKR)': summaryStats.totalCashAdvance,
      'Total Amount (PKR)': summaryStats.totalChallanAmount,
      'Due (PKR)': summaryStats.totalDue,
      'Status': ''
    });

    const periodStr = `${startDate}_to_${endDate}`;
    exportToCSV(`${activeCustomer.name.replace(/\s+/g, '_')}_Summary_Challans_${periodStr}.csv`, rows);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const opBal = parseFloat(newCustOpeningBalance) || 0;
    const credLimit = parseFloat(newCustCreditLimit) || 0;

    const newId = await db.customers.add({
      name: newCustName.trim().toUpperCase(),
      company: newCustCompany.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      creditLimit: credLimit,
      openingBalance: opBal,
      balanceType: newCustBalanceType,
      notes: newCustNotes.trim(),
      createdAt: new Date().toISOString()
    });

    setSelectedCustomerId(String(newId));
    setIsAddCustomerOpen(false);

    setNewCustName('');
    setNewCustCompany('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustCreditLimit('');
    setNewCustOpeningBalance('');
    setNewCustNotes('');
  };

  return (
    <div className="space-y-5 pb-12">
      
      {!hideHeader && (
        <>
          {/* 1. HERO BANNER WITH REALISTIC SALES BACKGROUND (SCREEN ONLY) */}
          <div 
            className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[140px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
            style={{ backgroundImage: "url('/sales_background.jpg')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent pointer-events-none"></div>

            <div className="relative z-10 w-full px-6 sm:px-8 py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-4.5">
                {/* Correctly sized and aligned rounded-2xl icon container */}
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Users className="w-7 h-7 sm:w-7.5 sm:h-7.5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                    Customer Ledgers &amp; Fleet Khata
                  </h1>
                  <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
                    Manage company credit accounts, fleet challan summaries, and ledger statements.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setIsAddCustomerOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white font-bold text-xs shadow-md border border-white/20 backdrop-blur-md transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                  <span>Add Customer</span>
                </button>

                {/* Compact Record Payment button without IN/OUT or Arrow */}
                <button
                  onClick={() => onOpenPaymentModal && onOpenPaymentModal(activeCustomer)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C32026] hover:bg-[#a81a1f] active:bg-[#8e1419] text-white font-bold text-xs shadow-md shadow-red-950/30 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-white" />
                  <span>Record Payment</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. 4 EXECUTIVE KPI SUMMARY CARDS (BELOW BANNER) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
            
            {/* Card 1: Opening Balance */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                  Opening Balance
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
                  {formatCurrency(ledgerData.openingBalance)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
                  <span className="text-amber-600 font-bold font-mono">
                    Brought Forward
                  </span>
                  <span className="text-slate-400">balance</span>
                </div>
              </div>
            </div>

            {/* Card 2: Period Total Fleet Fuel Sales */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Fuel className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                  Fleet Fuel Sales
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
                  {formatCurrency(summaryStats.totalChallanAmount)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
                  <span className="text-blue-600 font-bold font-mono">
                    {summaryStats.count} Challans
                  </span>
                  <span className="text-slate-400 truncate">&bull; {formatNumber(summaryStats.totalLitres, 1)} L</span>
                </div>
              </div>
            </div>

            {/* Card 3: Payments Received */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                  Payments Received
                </span>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight mt-0.5 truncate font-mono">
                  {formatCurrency(ledgerData.totals.inAmount)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
                  <span className="text-emerald-600 font-bold font-mono">
                    Bank / Cheques
                  </span>
                  <span className="text-slate-400">settlements</span>
                </div>
              </div>
            </div>

            {/* Card 4: Outstanding Balance / Due */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-full ${ledgerData.closingBalance >= 0 ? 'bg-[#C32026]' : 'bg-emerald-600'} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
                  Outstanding Due
                </span>
                <div className={`text-xl sm:text-2xl font-black ${ledgerData.closingBalance >= 0 ? 'text-rose-700' : 'text-emerald-700'} tracking-tight mt-0.5 truncate font-mono`}>
                  {formatCurrency(ledgerData.closingBalance)}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
                  <span className={`font-bold font-mono ${ledgerData.closingBalance >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {ledgerData.closingBalance >= 0 ? 'Receivable' : 'Credit Balance'}
                  </span>
                  <span className="text-slate-400 truncate">&bull; {activeCustomer?.name || 'Customer'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* 3. SUB-NAVIGATION TABS (ACCOUNTS & DETAILED LEDGERS, CREDIT LIMITS, SUMMARY CHALLANS) */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onTabChange ? onTabChange('ledgers') : null}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ledgers'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Accounts &amp; Detailed Ledgers</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange ? onTabChange('credit-limits') : null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Credit Limits &amp; Risk</span>
              </button>

              <button
                type="button"
                onClick={() => onTabChange ? onTabChange('summary-challans') : null}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Consolidated Summary Challans</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium px-3 hidden lg:block">
              {activeCustomer?.name}: Ledger reconciled with original Excel formulas
            </div>
          </div>
        </>
      )}

      {/* 4. FILTER CARD MATCHING REFERENCE IMAGE 1 */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs no-print space-y-4">
        
        {/* Top Header Row of Filter Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>Consolidated Company Summary Challan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate a multi-day consolidated summary bill for corporate fleet payment (2 days, 3 days, 1 week, 2 weeks, or custom)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isMbGoods && (
              existingRentEntry ? (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rent Active ({formatCurrency(existingRentEntry.outAmount || 60000)})</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer"
                  title="Post recurring monthly rent of PKR 60,000 for M.B GOODS"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Post Rent</span>
                </button>
              )
            )}

            <button
              onClick={handleExportExcel}
              disabled={filteredChallans.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              disabled={filteredChallans.length === 0}
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
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (onSelectCustomer) onSelectCustomer(e.target.value);
              }}
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
            />
          </div>

          {/* Truck / Vehicle Filter */}
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

          {/* Only Unpaid Checkbox */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-semibold py-2">
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

        {/* Quick Periods Row & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium">Quick Periods:</span>
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
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 font-medium cursor-pointer transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'detailed'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Itemized Challans ({filteredChallans.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily Summary ({ledgerData.dailyRows.length})
            </button>
          </div>
        </div>

      </div>

      {/* 5. MAIN TABLE DETAIL (LIKE COMPANY SALES & REFERENCE IMAGE 2) */}
      {viewMode === 'detailed' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Fleet Challan Details &mdash; {activeCustomer?.name} ({filteredChallans.length} Records)
              </h3>
            </div>
            <span className="text-xs text-slate-500">
              Period: {formatDateDisplay(startDate)} &mdash; {formatDateDisplay(endDate)}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b-2 border-slate-300 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 text-center">#</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Challan #</th>
                  <th className="py-2.5 px-3">Vehicle #</th>
                  <th className="py-2.5 px-3">Fuel Type</th>
                  <th className="py-2.5 px-3 text-right">Litres</th>
                  <th className="py-2.5 px-3 text-right">Rate (PKR)</th>
                  <th className="py-2.5 px-3 text-right">Fuel Amt (PKR)</th>
                  <th className="py-2.5 px-3 text-right">Mobil Oil</th>
                  <th className="py-2.5 px-3 text-right">Driver Advance</th>
                  <th className="py-2.5 px-3 text-right font-black">Total (PKR)</th>
                  <th className="py-2.5 px-3 text-right text-rose-700 font-black">Due (PKR)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {filteredChallans.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-10 text-center text-slate-400 font-sans">
                      No fleet challans found matching selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredChallans.map((c, idx) => {
                    const isPaid = (c.outstandingAmount <= 0) || (c.paidAmount >= c.totalAmount);
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-sans font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-900 font-medium">
                          {formatDateDisplay(c.date)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-bold text-blue-700">
                          #{c.serialNo || c.id}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-900">
                          {c.vehicleNo}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.fuelType === 'Petrol' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.fuelType || 'Diesel'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-semibold text-slate-800">
                          {c.litres > 0 ? formatNumber(c.litres, 2) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-600">
                          {c.rate > 0 ? formatNumber(c.rate, 2) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-slate-900">
                          {formatNumber(c.dieselAmount || 0, 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-600">
                          {c.mobilOil > 0 ? formatNumber(c.mobilOil, 0) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-600">
                          {c.cashAdvance > 0 ? formatNumber(c.cashAdvance, 0) : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-950">
                          {formatCurrency(c.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-rose-700">
                          {formatCurrency(c.outstandingAmount ?? (c.totalAmount - (c.paidAmount || 0)))}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap font-sans">
                          <button
                            type="button"
                            onClick={() => onOpenReceipt && onOpenReceipt(c)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs cursor-pointer hover:underline"
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                <tr>
                  <td colSpan={5} className="py-3 px-3 uppercase font-sans font-black">
                    TOTAL ({filteredChallans.length} Challans):
                  </td>
                  <td className="py-3 px-3 text-right font-black">{formatNumber(summaryStats.totalLitres, 2)}</td>
                  <td className="py-3 px-3 text-right">-</td>
                  <td className="py-3 px-3 text-right font-black">{formatNumber(summaryStats.totalFuelAmount, 0)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(summaryStats.totalMobilOil, 0)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(summaryStats.totalCashAdvance, 0)}</td>
                  <td className="py-3 px-3 text-right font-black">{formatCurrency(summaryStats.totalChallanAmount)}</td>
                  <td className="py-3 px-3 text-right font-black text-rose-700">{formatCurrency(summaryStats.totalDue)}</td>
                  <td colSpan={2} className="py-3 px-3 text-center font-sans text-slate-500 font-normal">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* DAILY SUMMARY VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Date-wise Daily Aggregated Fuel Summary &mdash; {activeCustomer?.name}
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b-2 border-slate-300 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-center">Trucks</th>
                  <th className="py-2.5 px-3 text-right">Diesel (Ltr)</th>
                  <th className="py-2.5 px-3 text-right">Diesel Amount</th>
                  <th className="py-2.5 px-3 text-right">Mobil Oil / Adv.</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-right text-emerald-800">IN (Payment)</th>
                  <th className="py-2.5 px-3 text-right text-rose-800">OUT (Rent/Debit)</th>
                  <th className="py-2.5 px-3 text-right font-black">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {ledgerData.dailyRows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 font-sans">
                      No customer ledger transactions found for this period.
                    </td>
                  </tr>
                ) : (
                  ledgerData.dailyRows.map(row => (
                    <tr key={row.date} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {formatDateDisplay(row.date)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {row.truckCount > 0 ? (
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[11px]">
                            {row.truckCount}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-slate-800">
                        {row.dieselLtr > 0 ? formatNumber(row.dieselLtr, 2) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-900">
                        {row.dieselAmount > 0 ? formatNumber(row.dieselAmount, 0) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-700">
                        {row.mobilOilAdv > 0 ? formatNumber(row.mobilOilAdv, 0) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-950">
                        {row.totalAmount > 0 ? formatCurrency(row.totalAmount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-emerald-700">
                        {row.inAmount > 0 ? formatCurrency(row.inAmount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-rose-700">
                        {row.outAmount > 0 ? formatCurrency(row.outAmount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-black text-slate-950 bg-slate-50/50">
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                <tr>
                  <td className="py-3 px-3 uppercase font-sans font-black">TOTAL:</td>
                  <td className="py-3 px-3 text-center text-blue-700 font-black">{ledgerData.totals.trucks}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(ledgerData.totals.dieselLtr, 2)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(ledgerData.totals.dieselAmount, 0)}</td>
                  <td className="py-3 px-3 text-right">{formatNumber(ledgerData.totals.mobilOilAdv, 0)}</td>
                  <td className="py-3 px-3 text-right font-black">{formatCurrency(ledgerData.totals.fuelChargesTotal)}</td>
                  <td className="py-3 px-3 text-right text-emerald-800 font-black">{formatCurrency(ledgerData.totals.inAmount)}</td>
                  <td className="py-3 px-3 text-right text-rose-800 font-black">{formatCurrency(ledgerData.totals.outAmount)}</td>
                  <td className="py-3 px-3 text-right font-black text-blue-900 text-sm bg-blue-50/70">
                    {formatCurrency(ledgerData.closingBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PRINT REPORT MODAL (EXACTLY MATCHING REFERENCE IMAGE 2)               */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-150">
            
            {/* Top Modal Navigation Header Bar (SCREEN ONLY) */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Customer Ledger Summary Report
                  </h3>
                  <span className="text-[11px] text-slate-300 font-normal">
                    {activeCustomer?.name} &bull; Printable Corporate A4 Document
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
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
                  onClick={() => setIsPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* MODAL REPORT BODY (PRINTABLE STATEMENT MATCHING REFERENCE IMAGE 2) */}
            <div id="customer-statement-report" className="print-area p-6 sm:p-8 bg-white text-slate-900 relative">
              
              {/* Header: Logo, Diyal Filling Station & Contact (NO image on top right as requested) */}
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

              {/* Title Block with Period & Total Challans Pills */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
                <div>
                  <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                    Customer Ledger Summary
                  </h1>
                  <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                    {activeCustomer?.company ? `${activeCustomer.name} (${activeCustomer.company})` : activeCustomer?.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Summary of fuel transactions, challans and outstanding balance
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block leading-none">Reporting Period</span>
                      <span className="font-bold text-slate-800">{formatDateDisplay(startDate)} to {formatDateDisplay(endDate)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block leading-none">Total Challans</span>
                      <span className="font-black text-blue-700">{summaryStats.count}</span>
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
                    <span>Summary</span>
                  </div>
                  <div className="p-3.5 bg-slate-50/50 flex-1 grid grid-cols-4 gap-2 text-center items-center font-mono">
                    
                    {/* Circle 1: Total Litres */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <Fuel className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Litres</span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5">{formatNumber(summaryStats.totalLitres, 2)} L</span>
                    </div>

                    {/* Circle 2: Total Challans */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <Truck className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Challans</span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5">{summaryStats.count}</span>
                    </div>

                    {/* Circle 3: Total Amount */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Total Amount</span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5">PKR {formatNumber(summaryStats.totalChallanAmount, 0)}</span>
                    </div>

                    {/* Circle 4: Outstanding Due */}
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Outstanding Due</span>
                      <span className="text-xs font-bold text-rose-700 mt-0.5">PKR {formatNumber(summaryStats.totalDue, 0)}</span>
                    </div>

                  </div>
                </div>

              </div>

              {/* Challan Summary Table (Matching Reference Image 2) */}
              <div className="my-5 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-[#1e3a8a] text-white px-4 py-2 font-bold text-xs flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Challan Summary</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-bold uppercase text-[10px]">
                        <th className="py-2.5 px-3 text-center">#</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Challan #</th>
                        <th className="py-2.5 px-3">Vehicle #</th>
                        <th className="py-2.5 px-3">Fuel Type</th>
                        <th className="py-2.5 px-3 text-right">Litres</th>
                        <th className="py-2.5 px-3 text-right">Rate (PKR)</th>
                        <th className="py-2.5 px-3 text-right">Fuel Amount (PKR)</th>
                        <th className="py-2.5 px-3 text-right">Mobil Oil (PKR)</th>
                        <th className="py-2.5 px-3 text-right">Driver Advance (PKR)</th>
                        <th className="py-2.5 px-3 text-right font-black">Total Amount (PKR)</th>
                        <th className="py-2.5 px-3 text-right text-rose-700 font-black">Due (PKR)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      {filteredChallans.map((c, idx) => {
                        const isPaid = (c.outstandingAmount <= 0) || (c.paidAmount >= c.totalAmount);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-center text-slate-400 font-sans">{idx + 1}</td>
                            <td className="py-2 px-3 whitespace-nowrap text-slate-900">{formatDateDisplay(c.date)}</td>
                            <td className="py-2 px-3 font-bold text-blue-700 whitespace-nowrap">#{c.serialNo || c.id}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">{c.vehicleNo}</td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                c.fuelType === 'Petrol' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {c.fuelType || 'Diesel'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-medium">{c.litres > 0 ? formatNumber(c.litres, 2) : '-'}</td>
                            <td className="py-2 px-3 text-right text-slate-600">{c.rate > 0 ? formatNumber(c.rate, 2) : '-'}</td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-900">{formatNumber(c.dieselAmount || 0, 0)}</td>
                            <td className="py-2 px-3 text-right text-slate-500">{c.mobilOil > 0 ? formatNumber(c.mobilOil, 0) : '-'}</td>
                            <td className="py-2 px-3 text-right text-slate-500">{c.cashAdvance > 0 ? formatNumber(c.cashAdvance, 0) : '-'}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-950">{formatNumber(c.totalAmount, 0)}</td>
                            <td className="py-2 px-3 text-right font-bold text-rose-700">{formatNumber(c.outstandingAmount ?? (c.totalAmount - (c.paidAmount || 0)), 0)}</td>
                            <td className="py-2 px-3 text-center font-sans whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isPaid ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs font-bold text-slate-900">
                      <tr>
                        <td colSpan={5} className="py-3 px-3 uppercase font-sans font-black">
                          TOTAL ({filteredChallans.length} Challans)
                        </td>
                        <td className="py-3 px-3 text-right font-black">{formatNumber(summaryStats.totalLitres, 2)}</td>
                        <td className="py-3 px-3 text-right">-</td>
                        <td className="py-3 px-3 text-right font-black">{formatNumber(summaryStats.totalFuelAmount, 0)}</td>
                        <td className="py-3 px-3 text-right">{formatNumber(summaryStats.totalMobilOil, 0)}</td>
                        <td className="py-3 px-3 text-right">{formatNumber(summaryStats.totalCashAdvance, 0)}</td>
                        <td className="py-3 px-3 text-right font-black">{formatNumber(summaryStats.totalChallanAmount, 0)}</td>
                        <td className="py-3 px-3 text-right font-black text-rose-700">{formatNumber(summaryStats.totalDue, 0)}</td>
                        <td className="py-3 px-3 text-center font-sans text-slate-400 font-normal">-</td>
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
                    &bull; This is a summary report for the mentioned period. Detailed challan list is attached separately.
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

      {/* MODAL: POST MONTHLY OFFICE RENT (M.B GOODS ONLY) */}
      {isRentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">Post Monthly Office Rent</h3>
              </div>
              <button 
                onClick={() => setIsRentModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 leading-relaxed">
              Office space rented at pump premises to <strong>M.B GOODS</strong>. Fixed recurring charge: <strong>PKR 60,000 / month</strong>.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Billing Month</label>
                <input
                  type="month"
                  value={rentMonthKey}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rent Amount (PKR)</label>
                <input
                  type="text"
                  value="60,000"
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Debit Classification</label>
                <input
                  type="text"
                  value="OUT (Office Rent / Debit Adjustment)"
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRentModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePostRent}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-all"
              >
                Confirm &amp; Post Rent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD BUSINESS CUSTOMER */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base text-slate-900">Add Business Customer Account</h3>
              </div>
              <button 
                onClick={() => setIsAddCustomerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Customer Name *</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  placeholder="e.g. AL-REHMAN LOGISTICS or M.B GOODS"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 uppercase focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fleet Agency Name</label>
                  <input
                    type="text"
                    value={newCustCompany}
                    onChange={e => setNewCustCompany(e.target.value)}
                    placeholder="Goods Transport Co."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Terminal</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  placeholder="Bypass Road, Goods Terminal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Balance (PKR)</label>
                  <input
                    type="number"
                    value={newCustOpeningBalance}
                    onChange={e => setNewCustOpeningBalance(e.target.value)}
                    placeholder="e.g. 1355204"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved Credit Limit (PKR)</label>
                  <input
                    type="number"
                    value={newCustCreditLimit}
                    onChange={e => setNewCustCreditLimit(e.target.value)}
                    placeholder="e.g. 5000000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Notes</label>
                <input
                  type="text"
                  value={newCustNotes}
                  onChange={e => setNewCustNotes(e.target.value)}
                  placeholder="Authorized vehicle fleet numbers &amp; credit agreement"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
