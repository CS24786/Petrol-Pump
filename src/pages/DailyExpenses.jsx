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
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';

export const EXPENSE_CATEGORIES = [
  'Electricity & Gen Fuel',
  'Salaries & Wages',
  'Pump Maintenance',
  'Staff Mess & Tea',
  'Stationery & Printing',
  'Government Taxes / Fees',
  'Office Rent / Lease',
  'Other Business Expenses'
];

export default function DailyExpenses() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [description, setDescription] = useState('');
  const [paidTo, setPaidTo] = useState('');

  // Queries
  const expenses = useLiveQuery(() => db.expenses.orderBy('id').reverse().toArray(), []);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];

    return expenses.filter(e => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (filterStartDate && e.date < filterStartDate) return false;
      if (filterEndDate && e.date > filterEndDate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = e.description?.toLowerCase().includes(q);
        const matchesPaid = e.paidTo?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesPaid) return false;
      }
      return true;
    });
  }, [expenses, selectedCategory, filterStartDate, filterEndDate, searchQuery]);

  // Aggregate sums
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredExpenses]);

  // Category breakdown for summary cards
  const categoryBreakdown = useMemo(() => {
    if (!expenses) return {};
    const map = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + (e.amount || 0);
    });
    return map;
  }, [expenses]);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setDate(new Date().toISOString().split('T')[0]);
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount('');
    setPaymentMethod('Cash');
    setDescription('');
    setPaidTo('');
    setIsAddExpenseOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingExpense(exp);
    setDate(exp.date);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setPaymentMethod(exp.paymentMethod || 'Cash');
    setDescription(exp.description || '');
    setPaidTo(exp.paidTo || '');
    setIsAddExpenseOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const numAmt = parseFloat(amount) || 0;
    if (numAmt <= 0) return;

    if (editingExpense) {
      await db.expenses.update(editingExpense.id, {
        date,
        category,
        amount: numAmt,
        paymentMethod,
        description: description.trim(),
        paidTo: paidTo.trim()
      });
    } else {
      await db.expenses.add({
        date,
        category,
        amount: numAmt,
        paymentMethod,
        description: description.trim(),
        paidTo: paidTo.trim(),
        createdAt: new Date().toISOString()
      });
    }

    setIsAddExpenseOpen(false);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this operational expense entry?')) {
      await db.expenses.delete(id);
    }
  };

  const handleExportCSV = () => {
    if (!filteredExpenses.length) return;
    const rows = filteredExpenses.map(e => ({
      'Date': e.date,
      'Category': e.category,
      'Amount (PKR)': e.amount,
      'Payment Method': e.paymentMethod || 'Cash',
      'Description / Particulars': e.description,
      'Paid To': e.paidTo
    }));
    exportToCSV(`Daily_Expenses_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Daily Operational Expenses &amp; Petty Cash
          </h2>
          <p className="text-xs text-slate-500">
            Track electricity, generator fuel, staff mess, pump maintenance &amp; administrative costs
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Aggregate Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 no-print">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Filtered Total
          </span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-1 block">
            {formatCurrency(totalExpenseAmount)}
          </span>
          <span className="text-[11px] text-slate-500">
            Across {filteredExpenses.length} entries
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Generator &amp; Power
          </span>
          <span className="text-xl font-bold text-blue-700 font-mono mt-1 block">
            {formatCurrency(categoryBreakdown['Electricity & Gen Fuel'] || 0)}
          </span>
          <span className="text-[11px] text-slate-500">
            Fuel top-up &amp; electric bills
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pump Maintenance
          </span>
          <span className="text-xl font-bold text-amber-700 font-mono mt-1 block">
            {formatCurrency(categoryBreakdown['Pump Maintenance'] || 0)}
          </span>
          <span className="text-[11px] text-slate-500">
            Nozzle &amp; hose repairs
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Staff Food &amp; Mess
          </span>
          <span className="text-xl font-bold text-emerald-700 font-mono mt-1 block">
            {formatCurrency(categoryBreakdown['Staff Food & Tea'] || 0)}
          </span>
          <span className="text-[11px] text-slate-500">
            Attendant tea &amp; daily mess
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search description, paid to..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="date"
              value={filterStartDate}
              onChange={e => setFilterStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
              title="Start Date"
            />
          </div>

          <div>
            <input
              type="date"
              value={filterEndDate}
              onChange={e => setFilterEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
              title="End Date"
            />
          </div>

        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Expenses Log &amp; Vouchers</h3>
          <span className="text-xs font-bold text-blue-700 font-mono">
            Total: {formatCurrency(totalExpenseAmount)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description / Particulars</th>
                <th className="py-2.5 px-3">Paid To</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                <th className="py-2.5 px-3 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600">{formatDateDisplay(e.date)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-medium">{e.description}</td>
                    <td className="py-2.5 px-3 text-slate-600">{e.paidTo || 'N/A'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{e.paymentMethod || 'Cash'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600"
                          title="Edit Expense"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Delete Expense"
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

      {/* Add / Edit Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200">
              <h3 className="font-bold text-sm text-slate-900">
                {editingExpense ? 'Edit Operational Expense' : 'Record Daily Operational Expense'}
              </h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Particulars *</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Generator diesel 30L, hose pipe replacement"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Paid To / Vendor</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={e => setPaidTo(e.target.value)}
                    placeholder="e.g. Al-Madina Hotel, Electrician"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Cash">Cash (Petty Cash Drawer)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-sm"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
