import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Users, 
  FileSpreadsheet, 
  ShieldCheck, 
  PlusCircle, 
  CreditCard, 
  Calendar, 
  Fuel, 
  ArrowDownLeft, 
  Building2, 
  X,
  ShieldAlert
} from 'lucide-react';
import CustomersLedger from './CustomersLedger';
import CreditLimits from './CreditLimits';
import CompanySummaryChallans from './CompanySummaryChallans';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function CustomerLedgersHub({ onOpenPaymentModal, onOpenReceipt }) {
  const [activeTab, setActiveTab] = useState('ledgers'); // 'ledgers' | 'credit-limits' | 'summary-challans'
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Add Customer Modal State
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustCreditLimit, setNewCustCreditLimit] = useState('');
  const [newCustOpeningBalance, setNewCustOpeningBalance] = useState('');
  const [newCustBalanceType, setNewCustBalanceType] = useState('Receivable');
  const [newCustNotes, setNewCustNotes] = useState('');

  // Live queries from Dexie
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries.toArray(), []);

  // Default to M.B GOODS or first customer
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

  // Aggregate executive metrics for the active customer across all modules
  const customerMetrics = useMemo(() => {
    if (!activeCustomer) {
      return {
        openingBalance: 0,
        fuelSalesAmount: 0,
        totalLitres: 0,
        challansCount: 0,
        paymentsReceived: 0,
        outstandingDue: 0
      };
    }

    const openingBalance = activeCustomer.openingBalance || 0;

    // Filter customer sales
    const custSales = (sales || []).filter(s => s.customerId === activeCustomer.id);
    let fuelSalesAmount = 0;
    let totalLitres = 0;
    let salesPaid = 0;

    custSales.forEach(s => {
      fuelSalesAmount += (s.totalAmount || 0);
      totalLitres += (s.litres || 0);
      salesPaid += (s.paidAmount || 0);
    });

    // Filter customer ledger entries
    const custEntries = (ledgerEntries || []).filter(e => e.customerId === activeCustomer.id);
    let ledgerIn = 0;
    let ledgerOut = 0;

    custEntries.forEach(e => {
      ledgerIn += (e.inAmount || 0);
      ledgerOut += (e.outAmount || 0);
    });

    const paymentsReceived = salesPaid + ledgerIn;
    const totalCharges = fuelSalesAmount + ledgerOut;
    const outstandingDue = openingBalance + totalCharges - paymentsReceived;

    return {
      openingBalance,
      fuelSalesAmount,
      totalLitres,
      challansCount: custSales.length,
      paymentsReceived,
      outstandingDue
    };
  }, [activeCustomer, sales, ledgerEntries]);

  // Handle Add Customer Form Submit
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
      
      {/* 1. PERSISTENT HERO BANNER WITH REALISTIC SALES BACKGROUND (STAYS ON ALL TABS) */}
      <div 
        className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[140px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
        style={{ backgroundImage: "url('/sales_background.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent pointer-events-none"></div>

        <div className="relative z-10 w-full px-6 sm:px-8 py-5 sm:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-4.5">
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

            {/* Compact Record Payment button without IN/OUT or arrow */}
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

      {/* 2. 4 EXECUTIVE KPI SUMMARY CARDS (PERSISTENT ON ALL TABS) */}
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
              {formatCurrency(customerMetrics.openingBalance)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-amber-600 font-bold font-mono">
                Brought Forward
              </span>
              <span className="text-slate-400">balance</span>
            </div>
          </div>
        </div>

        {/* Card 2: Fleet Fuel Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Fleet Fuel Sales
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
              {formatCurrency(customerMetrics.fuelSalesAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-blue-600 font-bold font-mono">
                {customerMetrics.challansCount} Challans
              </span>
              <span className="text-slate-400 truncate">&bull; {formatNumber(customerMetrics.totalLitres, 1)} L</span>
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
              {formatCurrency(customerMetrics.paymentsReceived)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-emerald-600 font-bold font-mono">
                Bank / Cheques
              </span>
              <span className="text-slate-400">settlements</span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Due */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-full ${customerMetrics.outstandingDue >= 0 ? 'bg-[#C32026]' : 'bg-emerald-600'} text-white flex items-center justify-center shrink-0 shadow-xs`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Outstanding Due
            </span>
            <div className={`text-xl sm:text-2xl font-black ${customerMetrics.outstandingDue >= 0 ? 'text-rose-700' : 'text-emerald-700'} tracking-tight mt-0.5 truncate font-mono`}>
              {formatCurrency(customerMetrics.outstandingDue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className={`font-bold font-mono ${customerMetrics.outstandingDue >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {customerMetrics.outstandingDue >= 0 ? 'Receivable' : 'Credit Balance'}
              </span>
              <span className="text-slate-400 truncate">&bull; {activeCustomer?.name || 'Customer'}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SUB-NAVIGATION TABS (PERSISTENT ON ALL TABS) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ledgers')}
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
            onClick={() => setActiveTab('credit-limits')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'credit-limits'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Credit Limits &amp; Risk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary-challans')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'summary-challans'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Consolidated Summary Challans</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-3 hidden lg:block">
          {activeTab === 'ledgers' && `${activeCustomer?.name || 'Customer'}: Ledger statement reconciled with Excel formulas`}
          {activeTab === 'credit-limits' && 'Approved credit thresholds & management override safeguards'}
          {activeTab === 'summary-challans' && 'Multi-day consolidated billing & itemized statement for registered fleets'}
        </div>
      </div>

      {/* 4. RENDER SELECTED SUB-TAB CONTENT */}
      {activeTab === 'ledgers' && (
        <CustomersLedger
          hideHeader={true}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          onOpenPaymentModal={onOpenPaymentModal}
          onOpenReceipt={onOpenReceipt}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === 'credit-limits' && (
        <CreditLimits
          onOpenPaymentModal={onOpenPaymentModal}
          onNavigateToLedger={() => setActiveTab('ledgers')}
        />
      )}

      {activeTab === 'summary-challans' && (
        <CompanySummaryChallans
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          onOpenPaymentModal={onOpenPaymentModal}
          onOpenReceipt={onOpenReceipt}
        />
      )}

      {/* MODAL: ADD BUSINESS CUSTOMER (ACCESSIBLE FROM BANNER ON ALL TABS) */}
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
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Billing Office / Yard Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  placeholder="Terminal #4, Goods Forwarding Agency, Lahore / Multan Road"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Approved Credit Limit (PKR)</label>
                  <input
                    type="number"
                    value={newCustCreditLimit}
                    onChange={e => setNewCustCreditLimit(e.target.value)}
                    placeholder="2500000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Balance (PKR)</label>
                  <input
                    type="number"
                    value={newCustOpeningBalance}
                    onChange={e => setNewCustOpeningBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Balance Type</label>
                <select
                  value={newCustBalanceType}
                  onChange={e => setNewCustBalanceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="Receivable">Receivable (Customer owes DIYAL Station)</option>
                  <option value="Payable">Payable / Advance (DIYAL Station owes Customer)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Agreement Notes / Special Terms</label>
                <textarea
                  value={newCustNotes}
                  onChange={e => setNewCustNotes(e.target.value)}
                  rows={2}
                  placeholder="Payment settlement every 5 days or 15 days via crossed cheque."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none resize-none"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-all"
                >
                  Create Customer Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
