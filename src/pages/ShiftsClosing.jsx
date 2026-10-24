import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  RotateCcw, 
  Check, 
  Printer, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Fuel, 
  Banknote, 
  CreditCard,
  User,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay } from '../utils/formatters';

export default function ShiftsClosing() {
  const [shiftNumber, setShiftNumber] = useState('Shift 1 (Day)');
  const [operatorName, setOperatorName] = useState('Naveed Akhtar');
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosedSuccess, setIsClosedSuccess] = useState(false);

  // Queries
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const expenses = useLiveQuery(() => db.expenses.toArray(), []);
  const nozzles = useLiveQuery(() => db.nozzles.toArray(), []);
  const shifts = useLiveQuery(() => db.shifts.orderBy('id').reverse().toArray(), []);

  // Compute live shift figures
  const shiftSummary = useMemo(() => {
    if (!sales) return { totalFuelSales: 0, creditSales: 0, cashSales: 0, cashAdvances: 0, dieselLtr: 0, petrolLtr: 0 };

    let totalFuelSales = 0;
    let creditSales = 0;
    let cashSales = 0;
    let cashAdvances = 0;
    let dieselLtr = 0;
    let petrolLtr = 0;

    sales.forEach(s => {
      totalFuelSales += s.dieselAmount || 0;
      cashAdvances += s.cashAdvance || 0;

      if (s.paymentType === 'Cash') {
        cashSales += s.dieselAmount || 0;
      } else {
        creditSales += s.totalAmount || 0;
      }

      if (s.fuelType === 'Diesel') dieselLtr += s.litres || 0;
      if (s.fuelType === 'Petrol') petrolLtr += s.litres || 0;
    });

    const shiftExpenses = expenses ? expenses.reduce((sum, e) => sum + (e.amount || 0), 0) : 0;

    // Expected cash in hand = Cash Sales - Cash Advances given to drivers - Expenses paid
    // (Note: in a petrol pump, cash advances are taken out of the daily drawer cash!)
    const expectedCash = Math.max(0, cashSales - cashAdvances - shiftExpenses);

    return {
      totalFuelSales,
      creditSales,
      cashSales,
      cashAdvances,
      shiftExpenses,
      expectedCash,
      dieselLtr,
      petrolLtr
    };
  }, [sales, expenses]);

  const numCounted = parseFloat(actualCashCounted) || 0;
  const cashDifference = numCounted - shiftSummary.expectedCash;

  const handleCloseShift = async (e) => {
    e.preventDefault();

    const newShiftRecord = {
      shiftNumber,
      shiftDate: new Date().toISOString().split('T')[0],
      operatorName,
      startTime: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      endTime: new Date().toISOString(),
      status: 'Closed',
      totalFuelLitres: shiftSummary.dieselLtr + shiftSummary.petrolLtr,
      totalFuelAmount: shiftSummary.totalFuelSales,
      totalCashAdvances: shiftSummary.cashAdvances,
      creditSalesAmount: shiftSummary.creditSales,
      cashSalesAmount: shiftSummary.cashSales,
      expensesPaid: shiftSummary.shiftExpenses,
      expectedCash: shiftSummary.expectedCash,
      actualCashCounted: numCounted,
      difference: cashDifference,
      notes: closingNotes.trim()
    };

    await db.shifts.add(newShiftRecord);
    setIsClosedSuccess(true);
    setTimeout(() => setIsClosedSuccess(false), 5000);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-mono">
              Daily Operations
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Shift Management & Cash Drawer Reconciliation</h2>
          <p className="text-xs text-slate-400">
            Reconcile meter sales, customer credit fleet dispensing, driver advances, petty cash, and cash drawer handovers
          </p>
        </div>

        <button
          onClick={handlePrintSlip}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-sky-400" />
          <span>Print Shift Sheet</span>
        </button>
      </div>

      {/* Live Active Shift Reconciliation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl print-area">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-sans">Active Shift: {shiftNumber}</h3>
              <p className="text-xs text-slate-400 font-mono">Operator Incharge: {operatorName} • Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Clock className="w-3.5 h-3.5" /> Shift In Progress
          </div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Fuel Revenue</span>
            <div className="text-xl font-black text-white font-mono mt-1">
              {formatCurrency(shiftSummary.totalFuelSales)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Diesel: {formatNumber(shiftSummary.dieselLtr, 1)}L | Petrol: {formatNumber(shiftSummary.petrolLtr, 1)}L
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] text-sky-400 uppercase font-semibold">Fleet Credit Sales</span>
            <div className="text-xl font-black text-sky-400 font-mono mt-1">
              {formatCurrency(shiftSummary.creditSales)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Charged directly to customer ledgers
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] text-amber-400 uppercase font-semibold">Driver Cash Advances</span>
            <div className="text-xl font-black text-amber-400 font-mono mt-1">
              {formatCurrency(shiftSummary.cashAdvances)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Paid out to fleet drivers
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold">Shift Petty Expenses</span>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1">
              {formatCurrency(shiftSummary.shiftExpenses)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Mess, generator fuel, maintenance
            </div>
          </div>

        </div>

        {/* Expected Cash Drawer Balance Formula */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-300 font-sans block">
              Expected Physical Cash in Register:
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Cash Sales - Driver Advances - Shift Expenses
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            {formatCurrency(shiftSummary.expectedCash)}
          </div>
        </div>

        {/* Shift Closing Form */}
        <form onSubmit={handleCloseShift} className="mt-6 pt-6 border-t border-slate-800 space-y-4 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Select Shift</label>
              <select
                value={shiftNumber}
                onChange={e => setShiftNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Shift 1 (Day)">Shift 1 (Morning / Day)</option>
                <option value="Shift 2 (Night)">Shift 2 (Evening / Night)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Operator / Cashier</label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Actual Physical Cash Counted (PKR)
              </label>
              <input
                type="number"
                step="1"
                required
                value={actualCashCounted}
                onChange={e => setActualCashCounted(e.target.value)}
                placeholder="Count cash in drawer..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {numCounted > 0 && (
            <div className={`p-3 rounded-xl border font-mono text-xs flex justify-between items-center ${
              cashDifference === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : cashDifference > 0
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <span>
                {cashDifference === 0
                  ? '✓ Perfect Cash Balance (Zero shortage/excess)'
                  : cashDifference > 0
                  ? `▲ Cash Excess / Surplus: ${formatCurrency(cashDifference)}`
                  : `▼ Cash Shortage / Deficit: ${formatCurrency(Math.abs(cashDifference))}`}
              </span>
              <span className="font-bold">Counted: {formatCurrency(numCounted)}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Closing Remarks / Handover Notes</label>
            <input
              type="text"
              value={closingNotes}
              onChange={e => setClosingNotes(e.target.value)}
              placeholder="e.g. Cash handed over to Manager Tariq. Nozzle 2 calibration checked."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          {isClosedSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Shift successfully closed and archived to history!</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>Finalize & Close Shift</span>
            </button>
          </div>
        </form>

      </div>

      {/* Previous Closed Shifts Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            Previous Closed Shifts History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Shift</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3 text-right">Fuel Revenue</th>
                <th className="py-2.5 px-3 text-right">Credit Sales</th>
                <th className="py-2.5 px-3 text-right">Cash Advances</th>
                <th className="py-2.5 px-3 text-right">Expected Cash</th>
                <th className="py-2.5 px-3 text-right">Actual Counted</th>
                <th className="py-2.5 px-3 text-right">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {shifts?.map(s => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 text-slate-300">{formatDateDisplay(s.shiftDate)}</td>
                  <td className="py-2 px-3 font-bold text-white">{s.shiftNumber}</td>
                  <td className="py-2 px-3 text-slate-300 font-sans">{s.operatorName}</td>
                  <td className="py-2 px-3 text-right text-white font-bold">{formatCurrency(s.totalFuelAmount)}</td>
                  <td className="py-2 px-3 text-right text-sky-400">{formatCurrency(s.creditSalesAmount)}</td>
                  <td className="py-2 px-3 text-right text-amber-400">{formatCurrency(s.totalCashAdvances)}</td>
                  <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(s.expectedCash)}</td>
                  <td className="py-2 px-3 text-right text-emerald-400 font-bold">{formatCurrency(s.actualCashCounted)}</td>
                  <td className={`py-2 px-3 text-right font-bold ${
                    s.difference === 0 ? 'text-slate-400' : s.difference > 0 ? 'text-sky-400' : 'text-rose-400'
                  }`}>
                    {s.difference > 0 ? `+${s.difference}` : s.difference}
                  </td>
                </tr>
              ))}

              {(!shifts || shifts.length === 0) && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-500">
                    No closed shifts archived yet. Active shift data is ready above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
