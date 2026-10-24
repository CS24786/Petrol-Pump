import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  ShieldAlert, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Search, 
  TrendingUp, 
  Building2, 
  DollarSign, 
  Download, 
  X,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatNumber, exportToCSV } from '../utils/formatters';

export default function CreditLimits({ onOpenPaymentModal, onNavigateToLedger }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Exceeded', 'Warning', 'Healthy'
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newLimit, setNewLimit] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editError, setEditError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries.toArray(), []);

  // Compute live real-time balances & utilization for each customer
  const customerCreditData = useMemo(() => {
    if (!customers) return [];

    return customers.map(cust => {
      const prevBal = cust.openingBalance || 0;
      
      // Calculate OUT: total charges billed
      let totalOut = 0;
      sales?.forEach(s => {
        if (s.customerId === cust.id) {
          totalOut += (s.totalAmount || 0);
        }
      });
      ledgerEntries?.forEach(e => {
        if (e.customerId === cust.id) {
          totalOut += (e.outAmount || 0);
        }
      });

      // Calculate IN: total payments received
      let totalIn = 0;
      sales?.forEach(s => {
        if (s.customerId === cust.id) {
          totalIn += (s.paidAmount || 0);
        }
      });
      ledgerEntries?.forEach(e => {
        if (e.customerId === cust.id) {
          totalIn += (e.inAmount || 0);
        }
      });

      const currentBalance = prevBal + totalOut - totalIn;
      const creditLimit = cust.creditLimit || 2000000;
      const utilizationPct = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
      const isExceeded = currentBalance > creditLimit;
      const isNearLimit = !isExceeded && utilizationPct >= 80;
      const exceededAmount = isExceeded ? (currentBalance - creditLimit) : 0;
      const availableCredit = Math.max(0, creditLimit - currentBalance);

      return {
        ...cust,
        currentBalance,
        creditLimit,
        utilizationPct: Math.min(200, utilizationPct),
        isExceeded,
        isNearLimit,
        exceededAmount,
        availableCredit,
        status: isExceeded ? 'Exceeded' : isNearLimit ? 'Warning' : 'Healthy'
      };
    });
  }, [customers, sales, ledgerEntries]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalLimit = 0;
    let totalUtilized = 0;
    let exceededCount = 0;
    let warningCount = 0;

    customerCreditData.forEach(c => {
      totalLimit += c.creditLimit;
      totalUtilized += c.currentBalance;
      if (c.isExceeded) exceededCount++;
      else if (c.isNearLimit) warningCount++;
    });

    return {
      totalLimit,
      totalUtilized,
      exceededCount,
      warningCount,
      healthyCount: customerCreditData.length - exceededCount - warningCount
    };
  }, [customerCreditData]);

  // Filtered List
  const filteredData = useMemo(() => {
    return customerCreditData.filter(c => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [customerCreditData, statusFilter, searchQuery]);

  // Start Edit
  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setNewLimit(String(cust.creditLimit));
    setEditReason('');
    setEditError('');
  };

  // Save Limit
  const handleSaveLimit = async (e) => {
    e.preventDefault();
    setEditError('');

    const parsed = parseFloat(newLimit);
    if (isNaN(parsed) || parsed < 0) {
      setEditError('Please enter a valid credit limit amount.');
      return;
    }

    if (!editReason.trim()) {
      setEditError('Please enter an authorized reason for changing this customer limit.');
      return;
    }

    setIsSubmitting(true);
    try {
      await db.customers.update(editingCustomer.id, {
        creditLimit: parsed
      });

      // Audit log
      await db.auditLogs?.add({
        date: new Date().toISOString().split('T')[0],
        entityType: 'CustomerCreditLimit',
        entityId: editingCustomer.id,
        action: 'CreditLimitUpdated',
        performedBy: 'admin',
        reason: editReason.trim(),
        details: `Updated credit limit for ${editingCustomer.name} from PKR ${editingCustomer.creditLimit} to PKR ${parsed}`,
        createdAt: new Date().toISOString()
      });

      setEditingCustomer(null);
    } catch (err) {
      setEditError(err.message || 'Error updating credit limit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Company', 'Contact', 'Credit Limit (PKR)', 'Current Balance (PKR)', 'Utilization %', 'Available Credit (PKR)', 'Status'];
    const rows = filteredData.map(c => [
      `"${c.name}"`,
      `"${c.phone || ''}"`,
      c.creditLimit,
      c.currentBalance,
      c.utilizationPct.toFixed(1),
      c.availableCredit,
      c.status
    ]);
    exportToCSV('customer_credit_limits.csv', headers, rows);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <span>Company Customer Credit Limits & Exposure</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor outstanding credit exposure, trigger limit alerts, and record authorized credit overrides
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Summary</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Sanctioned Limit</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {formatCurrency(stats.totalLimit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all registered fleets</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Credit Utilized</div>
          <div className="text-xl font-extrabold text-blue-700 mt-1 font-mono">
            {formatCurrency(stats.totalUtilized)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Overall: {stats.totalLimit > 0 ? ((stats.totalUtilized / stats.totalLimit) * 100).toFixed(1) : 0}% exposure
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="text-xs font-semibold text-rose-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Limit Exceeded</span>
          </div>
          <div className="text-xl font-extrabold text-rose-700 mt-1 font-mono">
            {stats.exceededCount} <span className="text-xs font-sans font-normal text-slate-500">Companies</span>
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Require payment or authorized override
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Healthy / Near Limit</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
            {stats.healthyCount} <span className="text-xs font-normal text-amber-600 font-sans">({stats.warningCount} warning)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Within approved limits</div>
        </div>

      </div>

      {/* Credit Limits List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fleet company..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter:</span>
            {['All', 'Exceeded', 'Warning', 'Healthy'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Phone / Terminal</th>
                <th className="py-3 px-4 text-right">Sanctioned Limit</th>
                <th className="py-3 px-4 text-right">Current Outstanding</th>
                <th className="py-3 px-4 w-44">Utilization</th>
                <th className="py-3 px-4 text-right">Available / Exceeded</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No customer accounts match filter criteria.
                  </td>
                </tr>
              ) : (
                filteredData.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{c.name}</div>
                      <div className="text-[11px] font-normal text-slate-400">{c.company}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      <div>{c.phone || '-'}</div>
                      <div className="text-slate-400 truncate max-w-xs">{c.address || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      {formatCurrency(c.creditLimit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className={c.isExceeded ? 'text-rose-700 font-bold' : c.isNearLimit ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                            {c.utilizationPct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all ${
                              c.isExceeded
                                ? 'bg-rose-600'
                                : c.isNearLimit
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, c.utilizationPct)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {c.isExceeded ? (
                        <span className="text-rose-700 font-bold block">
                          +{formatCurrency(c.exceededAmount)} Over
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium block">
                          {formatCurrency(c.availableCredit)} Free
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.isExceeded
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : c.isNearLimit
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Adjust Credit Limit"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] cursor-pointer"
                        >
                          Change Limit
                        </button>
                        <button
                          onClick={() => onOpenPaymentModal && onOpenPaymentModal(c)}
                          title="Record Payment"
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-200 cursor-pointer"
                        >
                          Receive IN
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

      {/* EDIT CREDIT LIMIT MODAL */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
            
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  Adjust Credit Limit: {editingCustomer.name}
                </h3>
              </div>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLimit} className="p-5 space-y-4">
              
              {editError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Current Credit Limit:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(editingCustomer.creditLimit)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Current Outstanding Balance:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(editingCustomer.currentBalance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Credit Limit (PKR) *
                </label>
                <input
                  type="number"
                  step="1000"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  placeholder="e.g. 5000000"
                  required
                  autoFocus
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Management Authorization & Reason *
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Approved seasonal limit increase by Director"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Credit Limit'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
