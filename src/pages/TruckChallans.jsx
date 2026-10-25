import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Truck, 
  PlusCircle, 
  Search, 
  Printer, 
  Download, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Fuel, 
  Building2, 
  DollarSign, 
  X,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';
import ThreeCopyChallanModal from '../components/ThreeCopyChallanModal';

export default function TruckChallans({ onOpenPaymentModal }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'new'
  const [selectedChallanForPrint, setSelectedChallanForPrint] = useState(null);
  const [editingChallan, setEditingChallan] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Unpaid', 'Partial', 'Paid'
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Form State for New / Edit Challan
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formTime, setFormTime] = useState(new Date().toTimeString().slice(0, 5));
  const [formChallanNo, setFormChallanNo] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formVehicleNo, setFormVehicleNo] = useState('');
  const [formDriverName, setFormDriverName] = useState('');
  const [formFuelType, setFormFuelType] = useState('Diesel');
  const [formLitres, setFormLitres] = useState('');
  const [formRate, setFormRate] = useState(397.45);
  const [formDieselAmount, setFormDieselAmount] = useState('');
  const [formMobilOilLitres, setFormMobilOilLitres] = useState('');
  const [formMobilOil, setFormMobilOil] = useState('');
  const [formCashAdvance, setFormCashAdvance] = useState('');
  const [formOtherCharges, setFormOtherCharges] = useState('');
  const [formAmountReceived, setFormAmountReceived] = useState('0');
  const [formNotes, setFormNotes] = useState('');
  const [formOverrideReason, setFormOverrideReason] = useState('');
  const [allowCreditOverride, setAllowCreditOverride] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const sales = useLiveQuery(() => db.sales.orderBy('id').reverse().toArray(), []);
  const fuelRates = useLiveQuery(() => db.fuelRates.toArray(), []);
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);
  const customerVehicles = useLiveQuery(
    () => formCustomerId ? db.vehicles.where('customerId').equals(Number(formCustomerId)).toArray() : [],
    [formCustomerId]
  );

  const pumpSettings = useMemo(() => {
    if (!settingsList) return {};
    const map = {};
    settingsList.forEach(s => { map[s.key] = s.value; });
    return map;
  }, [settingsList]);

  // Set default customer to M.B GOODS
  useEffect(() => {
    if (customers && customers.length > 0 && !formCustomerId) {
      const mb = customers.find(c => c.name.includes('M.B GOODS')) || customers[0];
      setFormCustomerId(String(mb.id));
    }
  }, [customers, formCustomerId]);

  // Generate Challan Number
  useEffect(() => {
    if (sales && sales.length > 0 && !formChallanNo) {
      const maxSerial = Math.max(...sales.map(s => parseInt(s.serialNo, 10) || 0), 1000);
      setFormChallanNo(String(maxSerial + 1));
    } else if (!formChallanNo) {
      setFormChallanNo('1001');
    }
  }, [sales, formChallanNo]);

  // Sync Rate when fuelType changes
  useEffect(() => {
    if (fuelRates) {
      const matched = fuelRates.find(r => r.fuelType?.toLowerCase() === formFuelType.toLowerCase());
      if (matched) {
        setFormRate(matched.rate);
      }
    }
  }, [formFuelType, fuelRates]);

  // Calculate Fuel Amount on litres change
  const handleLitresChange = (val) => {
    setFormLitres(val);
    const ltr = parseFloat(val);
    if (!isNaN(ltr) && ltr > 0) {
      setFormDieselAmount(String(Math.round(ltr * formRate)));
    } else {
      setFormDieselAmount('');
    }
  };

  // Calculations for current form
  const numLitres = parseFloat(formLitres) || 0;
  const numFuelAmt = parseFloat(formDieselAmount) || 0;
  const numMobilOil = parseFloat(formMobilOil) || 0;
  const numCashAdvance = parseFloat(formCashAdvance) || 0;
  const numOther = parseFloat(formOtherCharges) || 0;
  const totalChallanAmount = numFuelAmt + numMobilOil + numCashAdvance + numOther;
  const numReceived = parseFloat(formAmountReceived) || 0;
  const remainingDue = Math.max(0, totalChallanAmount - numReceived);

  // Active customer object & live credit calculation
  const activeCustomer = useMemo(() => {
    if (!customers || !formCustomerId) return null;
    return customers.find(c => c.id === Number(formCustomerId));
  }, [customers, formCustomerId]);

  // Current customer outstanding balance
  const customerOutstanding = useMemo(() => {
    if (!activeCustomer || !sales) return 0;
    const prev = activeCustomer.openingBalance || 0;
    let out = 0;
    let inc = 0;
    sales.forEach(s => {
      if (s.customerId === activeCustomer.id) {
        out += (s.totalAmount || 0);
        inc += (s.paidAmount || 0);
      }
    });
    return prev + out - inc;
  }, [activeCustomer, sales]);

  // Credit limit breach calculation
  const customerLimit = activeCustomer?.creditLimit || 2000000;
  const projectedBalance = customerOutstanding + remainingDue;
  const isCreditExceeded = projectedBalance > customerLimit;
  const exceededByAmount = isCreditExceeded ? (projectedBalance - customerLimit) : 0;

  // Filtered Truck Challans (only company truck challans, no retail)
  const truckChallans = useMemo(() => {
    if (!sales) return [];

    return sales.filter(s => {
      if (s.isRetail) return false; // Strictly business truck challans
      if (filterCustomer !== 'All' && s.customerId !== Number(filterCustomer)) return false;
      if (filterStatus === 'Unpaid' && s.outstandingAmount <= 0) return false;
      if (filterStatus === 'Paid' && s.outstandingAmount > 0) return false;
      if (filterStatus === 'Partial' && (s.paidAmount <= 0 || s.outstandingAmount <= 0)) return false;
      if (filterStartDate && s.date < filterStartDate) return false;
      if (filterEndDate && s.date > filterEndDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSerial = s.serialNo?.toLowerCase().includes(q);
        const matchesVeh = s.vehicleNo?.toLowerCase().includes(q);
        const matchesCust = s.customerName?.toLowerCase().includes(q);
        const matchesDriver = s.driverName?.toLowerCase().includes(q);
        if (!matchesSerial && !matchesVeh && !matchesCust && !matchesDriver) return false;
      }
      return true;
    });
  }, [sales, filterCustomer, filterStatus, filterStartDate, filterEndDate, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCustomer, filterStatus, filterStartDate, filterEndDate]);

  const totalPages = Math.max(1, Math.ceil(truckChallans.length / pageSize));
  const paginatedChallans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return truckChallans.slice(start, start + pageSize);
  }, [truckChallans, currentPage, pageSize]);

  // Save Challan
  const handleSaveChallan = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formCustomerId) {
      setFormError('Please select a company customer.');
      return;
    }

    if (!formVehicleNo.trim()) {
      setFormError('Please enter a vehicle / truck registration number.');
      return;
    }

    if (totalChallanAmount <= 0) {
      setFormError('Challan must contain fuel, Mobil Oil, or cash advance amount.');
      return;
    }

    if (isCreditExceeded && !allowCreditOverride) {
      setFormError(`Customer credit limit of PKR ${customerLimit.toLocaleString()} will be exceeded by PKR ${exceededByAmount.toLocaleString()}. Check management override box with authorized reason.`);
      return;
    }

    if (isCreditExceeded && allowCreditOverride && !formOverrideReason.trim()) {
      setFormError('Please enter management override reason for exceeding customer credit limit.');
      return;
    }

    setIsSubmitting(true);
    try {
      const challanRecord = {
        date: formDate,
        time: formTime,
        serialNo: formChallanNo.trim(),
        customerId: Number(formCustomerId),
        customerName: activeCustomer?.name || 'M.B GOODS',
        vehicleNo: formVehicleNo.trim(),
        driverName: formDriverName.trim() || `Driver (${formVehicleNo.trim()})`,
        fuelType: numLitres > 0 ? formFuelType : 'None',
        litres: numLitres,
        rate: parseFloat(formRate) || 0,
        dieselAmount: numFuelAmt,
        mobilOilLitres: parseFloat(formMobilOilLitres) || 0,
        mobilOil: numMobilOil,
        cashAdvance: numCashAdvance,
        otherCharges: numOther,
        totalAmount: totalChallanAmount,
        paidAmount: numReceived,
        outstandingAmount: remainingDue,
        paymentType: numReceived >= totalChallanAmount ? 'Cash' : 'Credit',
        paymentStatus: numReceived >= totalChallanAmount ? 'Paid' : numReceived > 0 ? 'Partial' : 'Unpaid',
        notes: formNotes.trim(),
        isRetail: false,
        isCreditOverride: isCreditExceeded,
        overrideReason: formOverrideReason.trim(),
        createdAt: new Date().toISOString()
      };

      let savedId;
      if (editingChallan) {
        await db.sales.update(editingChallan.id, challanRecord);
        savedId = editingChallan.id;
        // Audit log
        await db.auditLogs?.add({
          date: formDate,
          entityType: 'TruckChallan',
          entityId: editingChallan.id,
          action: 'ChallanEdited',
          performedBy: 'admin',
          reason: formOverrideReason || 'Correction of challan entry',
          details: `Edited challan #${challanRecord.serialNo} for ${challanRecord.customerName}, Vehicle ${challanRecord.vehicleNo}`,
          createdAt: new Date().toISOString()
        });
      } else {
        savedId = await db.sales.add(challanRecord);
      }

      // Reset form
      const savedChallan = { ...challanRecord, id: savedId };
      setSelectedChallanForPrint(savedChallan);
      setActiveTab('list');
      setEditingChallan(null);
      setFormLitres('');
      setFormDieselAmount('');
      setFormCashAdvance('');
      setFormMobilOil('');
      setFormMobilOilLitres('');
      setFormOtherCharges('');
      setFormAmountReceived('0');
      setFormNotes('');
      setFormOverrideReason('');
      setAllowCreditOverride(false);
      setFormChallanNo(String(parseInt(formChallanNo, 10) + 1));
    } catch (err) {
      setFormError(err.message || 'Error saving truck challan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Challan
  const handleStartEdit = (challan) => {
    setEditingChallan(challan);
    setFormDate(challan.date);
    setFormChallanNo(challan.serialNo || String(challan.id));
    setFormCustomerId(String(challan.customerId));
    setFormVehicleNo(challan.vehicleNo);
    setFormDriverName(challan.driverName || '');
    setFormFuelType(challan.fuelType === 'Petrol' ? 'Petrol' : 'Diesel');
    setFormLitres(String(challan.litres || ''));
    setFormRate(challan.rate || 397.45);
    setFormDieselAmount(String(challan.dieselAmount || ''));
    setFormMobilOil(String(challan.mobilOil || ''));
    setFormMobilOilLitres(String(challan.mobilOilLitres || ''));
    setFormCashAdvance(String(challan.cashAdvance || ''));
    setFormOtherCharges(String(challan.otherCharges || ''));
    setFormAmountReceived(String(challan.paidAmount || '0'));
    setFormNotes(challan.notes || '');
    setFormError('');
    setActiveTab('new');
  };

  // Cancel / Delete Challan with Audit Trail
  const handleCancelChallan = async (challan) => {
    const reason = window.prompt(`Enter reason to cancel / void Challan #${challan.serialNo || challan.id}:`);
    if (!reason) return;

    await db.sales.delete(challan.id);
    await db.auditLogs?.add({
      date: new Date().toISOString().split('T')[0],
      entityType: 'TruckChallan',
      entityId: challan.id,
      action: 'ChallanCancelled',
      performedBy: 'admin',
      reason: reason.trim(),
      details: `Cancelled challan #${challan.serialNo} of amount PKR ${challan.totalAmount} for ${challan.customerName}`,
      createdAt: new Date().toISOString()
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!truckChallans || truckChallans.length === 0) return;
    const rows = truckChallans.map(c => ({
      'Challan #': `#${c.serialNo || c.id}`,
      'Date': formatDateDisplay(c.date),
      'Company': c.customerName,
      'Truck #': c.vehicleNo,
      'Driver': c.driverName || '',
      'Fuel Type': c.fuelType || 'Diesel',
      'Litres': c.litres || 0,
      'Rate': c.rate || 0,
      'Fuel Amount (PKR)': c.dieselAmount || 0,
      'Mobil Oil (PKR)': c.mobilOil || 0,
      'Driver Advance (PKR)': c.cashAdvance || 0,
      'Total Amount (PKR)': c.totalAmount || 0,
      'Paid (PKR)': c.paidAmount || 0,
      'Due (PKR)': c.outstandingAmount ?? (c.totalAmount - (c.paidAmount || 0)),
      'Status': c.paymentStatus || 'Pending'
    }));
    exportToCSV(`company_truck_challans_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  // Aggregate fleet statistics
  const fleetStats = useMemo(() => {
    let totalFleetLitres = 0;
    let totalFleetFuelAmt = 0;
    let totalFleetMobilOil = 0;
    let totalFleetCashAdv = 0;
    let totalFleetAmount = 0;
    let totalFleetDue = 0;

    (sales || []).filter(s => !s.isRetail).forEach(s => {
      totalFleetLitres += (s.litres || 0);
      totalFleetFuelAmt += (s.dieselAmount || 0);
      totalFleetMobilOil += (s.mobilOil || 0);
      totalFleetCashAdv += (s.cashAdvance || 0);
      totalFleetAmount += (s.totalAmount || 0);
      totalFleetDue += (s.outstandingAmount || 0);
    });

    return {
      totalFleetLitres,
      totalFleetFuelAmt,
      totalFleetMobilOil,
      totalFleetCashAdv,
      totalFleetAmount,
      totalFleetDue,
      challansCount: (sales || []).filter(s => !s.isRetail).length
    };
  }, [sales]);

  return (
    <div className="space-y-5">
      
      {/* 1. HERO BANNER WITH FUEL TANKER TRUCK & ATTENDANT BACKGROUND */}
      <div 
        className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[160px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
        style={{
          backgroundImage: "url('./sales_background.jpg')"
        }}
      >
        {/* Soft gradient overlay on left for maximum text & icon contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 sm:px-8 py-7 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Truck Icon + Title & Subtitle */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <Truck className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Company Sales &amp; Truck Challans
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
                Track company fuel sales, manage truck challans and monitor all dispatches in real time.
              </p>
            </div>
          </div>

          {/* Right: Prominent Red Action Button */}
          <div className="shrink-0">
            {activeTab === 'new' ? (
              <button
                onClick={() => {
                  setEditingChallan(null);
                  setActiveTab('list');
                }}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-slate-800/90 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-slate-950/40 border border-white/20 transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Back to Challans List</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingChallan(null);
                  setActiveTab('new');
                }}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#C32026] hover:bg-[#a81a1f] active:bg-[#8e1419] text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/40 hover:shadow-red-900/50 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>New Truck Challan</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. FOUR KPI STAT SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 no-print">
        
        {/* Card 1: Total Fleet Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Fleet Sales
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
              {formatCurrency(fleetStats.totalFleetAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-blue-600 font-bold font-mono">
                {fleetStats.challansCount} Challans
              </span>
              <span className="text-slate-400">Total recorded</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fleet Fuel Litres */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Fleet Fuel Litres
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
              {formatNumber(fleetStats.totalFleetLitres, 1)} L
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-purple-600 font-bold font-mono">
                {formatCurrency(fleetStats.totalFleetFuelAmt)}
              </span>
              <span className="text-slate-400">Fuel value</span>
            </div>
          </div>
        </div>

        {/* Card 3: Mobil Oil & Advances */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Oil &amp; Cash Advances
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
              {formatCurrency(fleetStats.totalFleetMobilOil + fleetStats.totalFleetCashAdv)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-amber-600 font-bold font-mono">
                Oil: {formatCurrency(fleetStats.totalFleetMobilOil)}
              </span>
              <span className="text-slate-400">&bull; Cash: {formatCurrency(fleetStats.totalFleetCashAdv)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Due */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-[#e11d48] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Outstanding Due
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight mt-0.5 truncate">
              {formatCurrency(fleetStats.totalFleetDue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-rose-600 font-bold font-mono">
                Pending Clearance
              </span>
              <span className="text-slate-400">in Ledgers</span>
            </div>
          </div>
        </div>

      </div>

      {/* NEW / EDIT CHALLAN FORM */}
      {activeTab === 'new' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 no-print animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {editingChallan ? `Edit Challan #${editingChallan.serialNo || editingChallan.id}` : 'Record New Truck Challan'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every truck transaction updates company ledger, outstanding balance, and credit limit
              </p>
            </div>
            <span className="text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1 rounded-lg border border-blue-200 font-bold">
              Challan #{formChallanNo}
            </span>
          </div>

          {formError && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Credit Limit Alert Banner */}
          {isCreditExceeded && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Credit Limit Warning: {activeCustomer?.name} has reached or exceeded approved credit!</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] bg-white/70 p-2 rounded-lg border border-amber-200">
                <div>Limit: <strong>{formatCurrency(customerLimit)}</strong></div>
                <div>Current Balance: <strong>{formatCurrency(customerOutstanding)}</strong></div>
                <div className="text-rose-700">Exceeded By: <strong>{formatCurrency(exceededByAmount)}</strong></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={allowCreditOverride}
                  onChange={(e) => setAllowCreditOverride(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Management Override Authorized for this Challan</span>
              </label>
              {allowCreditOverride && (
                <input
                  type="text"
                  value={formOverrideReason}
                  onChange={(e) => setFormOverrideReason(e.target.value)}
                  placeholder="Enter manager name & reason for override (e.g. Approved by Tariq Mehmood - payment promised tomorrow)"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                />
              )}
            </div>
          )}

          <form onSubmit={handleSaveChallan} className="space-y-4">
            
            {/* Meta Row: Company, Vehicle, Date, Driver */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Company Customer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Customer *
                </label>
                <select
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {customers?.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Truck / Vehicle Registration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Truck / Vehicle No *
                </label>
                <input
                  type="text"
                  list="registered-trucks"
                  value={formVehicleNo}
                  onChange={(e) => setFormVehicleNo(e.target.value)}
                  placeholder="e.g. 5244 or TL-8842"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="registered-trucks">
                  {customerVehicles?.map(v => (
                    <option key={v.id} value={v.vehicleNo}>
                      {v.vehicleNo} ({v.driverName || 'Truck'})
                    </option>
                  ))}
                </datalist>
              </div>

              {/* Driver Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  value={formDriverName}
                  onChange={(e) => setFormDriverName(e.target.value)}
                  placeholder="Driver name / CNIC"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* MULTI-ITEM SECTION: Fuel, Mobil Oil, Cash Advance */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">
                Challan Items & Quantities
              </div>

              {/* Fuel Particulars */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={formFuelType}
                    onChange={(e) => setFormFuelType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="Diesel">High Speed Diesel (HSD)</option>
                    <option value="Petrol">Super PMG Petrol</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fuel Litres Dispensed
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formLitres}
                    onChange={(e) => handleLitresChange(e.target.value)}
                    placeholder="e.g. 50.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Rate / Litre (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRate}
                    onChange={(e) => {
                      setFormRate(e.target.value);
                      const r = parseFloat(e.target.value);
                      if (numLitres > 0 && !isNaN(r)) {
                        setFormDieselAmount(String(Math.round(numLitres * r)));
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fuel Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={formDieselAmount}
                    onChange={(e) => setFormDieselAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mobil Oil & Cash Advance */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mobil Oil (Litres / Pk)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formMobilOilLitres}
                    onChange={(e) => setFormMobilOilLitres(e.target.value)}
                    placeholder="e.g. 4 Ltr"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mobil Oil Amount (PKR)
                  </label>
                  <input
                    type="number"
                    value={formMobilOil}
                    onChange={(e) => setFormMobilOil(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                    Driver Travel Cash Advance (PKR)
                  </label>
                  <input
                    type="number"
                    value={formCashAdvance}
                    onChange={(e) => setFormCashAdvance(e.target.value)}
                    placeholder="e.g. 3000"
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Other Approved Charges (PKR)
                  </label>
                  <input
                    type="number"
                    value={formOtherCharges}
                    onChange={(e) => setFormOtherCharges(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Totals & Payments Row */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <span className="text-xs text-slate-500 block">Total Challan Amount:</span>
                <span className="text-xl font-black text-slate-950 font-mono">
                  {formatCurrency(totalChallanAmount)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Fuel ({formatNumber(numFuelAmt, 0)}) + Oil ({formatNumber(numMobilOil, 0)}) + Cash ({formatNumber(numCashAdvance, 0)})
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Received Now (PKR)
                </label>
                <input
                  type="number"
                  value={formAmountReceived}
                  onChange={(e) => setFormAmountReceived(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:text-right">
                <span className="text-xs text-slate-500 block">Remaining Due on Account:</span>
                <span className="text-xl font-black text-rose-700 font-mono">
                  {formatCurrency(remainingDue)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Debited to {activeCustomer?.name} ledger
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Challan Remarks / Notes
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. Dispatched to Multan terminal, driver travel advance recorded"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('list');
                  setEditingChallan(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : editingChallan ? 'Update Challan' : 'Save & Print 3 Copies'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* CHALLANS LIST TAB */}
      {activeTab === 'list' && (
        <div className="space-y-4 no-print">
          
          {/* SEARCH & FILTER TOOLBAR */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
            
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
              {/* Search */}
              <div className="relative flex-1 sm:flex-initial sm:w-64 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search truck, challan #, company, driver..."
                  className="w-full pl-10 pr-8 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Customer Filter */}
              <div className="relative">
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="All">All Companies</option>
                  {customers?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Payment Status Filter */}
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-3.5 pr-8 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="All">All Payment Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Pending / Unpaid</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Date Filters */}
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono cursor-pointer"
                  />
                </div>
                <span className="text-xs text-slate-400 font-medium">to</span>
                <div className="relative">
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono cursor-pointer"
                  />
                </div>
                {(filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                    }}
                    title="Clear date filters"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Actions: Export CSV & Print PDF */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportCSV}
                disabled={truckChallans.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                disabled={truckChallans.length === 0}
                title="Print Challan Log or Save as PDF"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-40 transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Report</span>
              </button>
            </div>

          </div>

          {/* TABLE CONTAINER CARD */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 font-semibold text-[11px] tracking-wide">
                    <th className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">Challan #</th>
                    <th className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">Company</th>
                    <th className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">Truck #</th>
                    <th className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">Fuel Type</th>
                    <th className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">Litres</th>
                    <th className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">Fuel Amt (PKR)</th>
                    <th className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">Mobil Oil</th>
                    <th className="py-3.5 px-4 text-right font-semibold text-slate-700 whitespace-nowrap">Driver Advance</th>
                    <th className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">Total Amount</th>
                    <th className="py-3.5 px-4 text-right font-bold text-rose-600 whitespace-nowrap">Due (PKR)</th>
                    <th className="py-3.5 px-4 text-center font-semibold text-slate-700 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-center font-semibold text-slate-700 whitespace-nowrap no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedChallans.length === 0 ? (
                    <tr>
                      <td colSpan="13" className="py-12 text-center text-slate-400">
                        <Truck className="w-9 h-9 mx-auto text-slate-300 mb-2.5" />
                        <p className="font-semibold text-slate-700 text-sm">No truck challans found</p>
                        <p className="text-xs text-slate-400 mt-0.5">Click "New Truck Challan" to record fleet transactions</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedChallans.map((challan) => {
                      const due = challan.outstandingAmount ?? (challan.totalAmount - (challan.paidAmount || 0));
                      let displayStatus = challan.paymentStatus;
                      if (!displayStatus) {
                        displayStatus = due <= 0 ? 'Paid' : (challan.paidAmount > 0 ? 'Partial' : 'Pending');
                      } else if (displayStatus === 'Unpaid') {
                        displayStatus = 'Pending';
                      }

                      return (
                        <tr key={challan.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedChallanForPrint(challan)}
                              className="hover:underline cursor-pointer font-bold text-blue-600"
                              title="Click to view & print 3-copy challan"
                            >
                              #{challan.serialNo || challan.id}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap text-xs">
                            {formatDateDisplay(challan.date)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-xs whitespace-nowrap">
                            {challan.customerName}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-mono font-semibold border border-slate-200/70">
                              {challan.vehicleNo}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                              challan.fuelType === 'Petrol'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                                : 'bg-amber-50 text-amber-700 border-amber-200/70'
                            }`}>
                              {challan.fuelType || 'Diesel'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap text-xs">
                            {challan.litres > 0 ? `${formatNumber(challan.litres, 2)} L` : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800 whitespace-nowrap text-xs">
                            {challan.dieselAmount > 0 ? formatNumber(challan.dieselAmount, 0) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap text-xs">
                            {challan.mobilOil > 0 ? formatNumber(challan.mobilOil, 0) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-700 whitespace-nowrap text-xs">
                            {challan.cashAdvance > 0 ? formatNumber(challan.cashAdvance, 0) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                            {formatCurrency(challan.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap text-xs">
                            <span className={due > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {formatCurrency(due)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold border ${
                              displayStatus === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                : displayStatus === 'Partial'
                                ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                                : 'bg-amber-50 text-amber-700 border-amber-200/80'
                            }`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center no-print whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedChallanForPrint(challan)}
                                title="Print 3 Copies (Pump, Driver, Company)"
                                className="p-1.5 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStartEdit(challan)}
                                title="Edit Challan with Audit Trail"
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancelChallan(challan)}
                                title="Cancel / Void Challan"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Record Count & Pagination */}
            <div className="p-4 border-t border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 no-print">
              <div>
                Showing <strong className="text-slate-800">{truckChallans.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</strong> to <strong className="text-slate-800">{Math.min(currentPage * pageSize, truckChallans.length)}</strong> of <strong className="text-slate-800">{truckChallans.length}</strong> records
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold disabled:opacity-40 cursor-pointer"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold disabled:opacity-40 cursor-pointer"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* 3 COPIES PRINT MODAL */}
      {selectedChallanForPrint && (
        <ThreeCopyChallanModal
          challan={selectedChallanForPrint}
          pumpSettings={pumpSettings}
          onClose={() => setSelectedChallanForPrint(null)}
        />
      )}

    </div>
  );
}
