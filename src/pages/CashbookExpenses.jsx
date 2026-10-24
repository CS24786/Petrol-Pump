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
  Receipt,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';

const EXPENSE_CATEGORIES = [
  'Electricity & Gen Fuel',
  'Staff Food & Tea',
  'Pump Maintenance',
  'Printing & Stationeries',
  'Salaries & Tips',
  'Government Taxes / Fees',
  'Office Rent / Lease',
  'Miscellaneous'
];

export default function CashbookExpenses() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // New expense form
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paidTo, setPaidTo] = useState('');

  // Queries
  const expenses = useLiveQuery(() => db.expenses.orderBy('id').reverse().toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const ledgerEntries = useLiveQuery(() => db.ledgerEntries.toArray(), []);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter(e => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (filterDate && e.date !== filterDate) return false;
      return true;
    });
  }, [expenses, selectedCategory, filterDate]);

  // Aggregate sums
  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredExpenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!expenses) return {};
    const map = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + (e.amount || 0);
    });
    return map;
  }, [expenses]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const numAmt = parseFloat(amount) || 0;
    if (numAmt <= 0) return;

    await db.expenses.add({
      date,
      category,
      amount: numAmt,
      description: description.trim(),
      paidTo: paidTo.trim(),
      createdAt: new Date().toISOString()
    });

    setAmount('');
    setDescription('');
    setPaidTo('');
    setIsAddExpenseOpen(false);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      await db.expenses.delete(id);
    }
  };

  const handleExportCSV = () => {
    if (!filteredExpenses.length) return;
    const exportData = filteredExpenses.map(e => ({
      'Date': e.date,
      'Category': e.category,
      'Description': e.description,
      'Paid To': e.paidTo,
      'Amount (PKR)': e.amount
    }));
    exportToCSV(`Expenses_Cashbook_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  return (
    <div className="space-y-6 pb-14">
      
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono">
              Petty Cash & Expenses
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Daily Cashbook & Station Expenses</h2>
          <p className="text-xs text-slate-400">
            Track daily operating costs, generator diesel, staff mess, maintenance, and petty cash payouts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Filtered Expense Total</span>
          <div className="text-2xl font-black text-rose-400 font-mono mt-2">
            {formatCurrency(totalExpenseAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1">{filteredExpenses.length} Expense Entries Listed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Top Expense Category</span>
          <div className="text-xl font-bold text-white font-mono mt-2 truncate">
            {Object.keys(categoryBreakdown).length > 0
              ? Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0][0]
              : 'None'}
          </div>
          <p className="text-xs text-slate-500 mt-1">Highest operating expense head</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Petty Cash In Hand</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            Available on Drawer
          </div>
          <p className="text-xs text-slate-500 mt-1">Reconciled in shift closing</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Filter by Category</label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">Filter by Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
          />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Expense Vouchers Register
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description / Details</th>
                <th className="py-2.5 px-3">Paid To / Recipient</th>
                <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredExpenses.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 text-slate-300">{formatDateDisplay(e.date)}</td>
                  <td className="py-2.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 font-sans">
                      {e.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 font-sans">{e.description}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans">{e.paidTo || 'Cash Out'}</td>
                  <td className="py-2.5 px-3 text-right text-rose-400 font-black text-sm">
                    {formatCurrency(e.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No expense records matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              Record Petty Expense
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  step="1"
                  required
                  min="1"
                  placeholder="e.g. 4500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base text-rose-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Generator filter replacement & mobil oil top-up"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Paid To / Vendor</label>
                <input
                  type="text"
                  placeholder="e.g. Ali Auto Workshop / Attendant Mess"
                  value={paidTo}
                  onChange={e => setPaidTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
