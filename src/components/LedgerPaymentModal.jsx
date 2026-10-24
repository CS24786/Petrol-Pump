import React, { useState } from 'react';
import { db } from '../db/db';
import { X, ArrowDownLeft, ArrowUpRight, Check, Calendar, CreditCard } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function LedgerPaymentModal({ isOpen, customer, onClose, onSaved }) {
  const [entryType, setEntryType] = useState('IN'); // 'IN' = Payment Received, 'OUT' = Debit Adjustment
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [receiptNo, setReceiptNo] = useState(`REC-${Date.now().toString().slice(-6)}`);
  const [description, setDescription] = useState('AMOUNT RECEIVED (Payment)');

  if (!isOpen || !customer) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleTypeSwitch = (type) => {
    setEntryType(type);
    if (type === 'IN') {
      setDescription('AMOUNT RECEIVED (Payment)');
    } else {
      setDescription('MONTHLY RENT / DEBIT ADJUSTMENT');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    const newEntry = {
      customerId: customer.id,
      date,
      inAmount: entryType === 'IN' ? numAmount : 0,
      outAmount: entryType === 'OUT' ? numAmount : 0,
      mobilOilAdv: 0,
      dieselAmount: 0,
      description: description.trim(),
      receiptNo: receiptNo.trim(),
      paymentMethod,
      createdAt: new Date().toISOString()
    };

    await db.ledgerEntries.add(newEntry);

    if (onSaved) onSaved(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Customer Ledger Entry ({customer.name})
            </h2>
            <p className="text-xs text-slate-500">Record Payment Received (IN) or Debit/Rent Adjustment (OUT)</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type Selector (IN vs OUT) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => handleTypeSwitch('IN')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryType === 'IN'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-200" />
              <span>Payment Received (IN)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTypeSwitch('OUT')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryType === 'OUT'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-200" />
              <span>Debit / Rent (OUT)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Entry Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Receipt / Ref #</label>
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500000"
                required
                autoFocus
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-base text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Adjustment">Adjustment / Rent</option>
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Description / Particulars *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Bank transfer, Cheque clearing, Rent deduction"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Impact preview */}
          <div className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
            entryType === 'IN' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span>
              {entryType === 'IN' ? 'Customer Balance Impact:' : 'Customer Debit Impact:'}
            </span>
            <span className="font-extrabold text-sm">
              {entryType === 'IN' ? '-' : '+'}{formatCurrency(numAmount)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-lg text-white text-xs font-bold shadow-sm transition-all cursor-pointer ${
                entryType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Save Ledger Entry
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
