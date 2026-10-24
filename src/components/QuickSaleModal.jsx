import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { X, Fuel, Banknote, Car, Check, Calendar, Hash, ArrowRight, Users, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function QuickSaleModal({ isOpen, onClose, onSaleSaved }) {
  const [isRetailSale, setIsRetailSale] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [litres, setLitres] = useState('');
  const [rate, setRate] = useState(397.45);
  const [dieselAmount, setDieselAmount] = useState('');
  const [cashAdvance, setCashAdvance] = useState('');
  const [mobilOil, setMobilOil] = useState('');
  const [paymentReceived, setPaymentReceived] = useState('0');
  const [serialNo, setSerialNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [printAfterSave, setPrintAfterSave] = useState(false);

  // Queries
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const vehicles = useLiveQuery(
    () => customerId ? db.vehicles.where('customerId').equals(Number(customerId)).toArray() : [],
    [customerId]
  );
  const fuelRates = useLiveQuery(() => db.fuelRates.toArray(), []);
  const lastSale = useLiveQuery(() => db.sales.orderBy('id').last(), []);

  // Initialize customer default to M.B GOODS
  useEffect(() => {
    if (customers && customers.length > 0 && !customerId) {
      const mb = customers.find(c => c.name.includes('M.B GOODS')) || customers[0];
      setCustomerId(String(mb.id));
    }
  }, [customers, customerId]);

  // Set next serial number
  useEffect(() => {
    if (lastSale?.serialNo) {
      const lastNum = parseInt(lastSale.serialNo, 10);
      setSerialNo(!isNaN(lastNum) ? String(lastNum + 1) : '1021');
    } else {
      setSerialNo('780');
    }
  }, [lastSale]);

  // Update rate when fuelType or fuelRates changes
  useEffect(() => {
    if (fuelRates) {
      const matched = fuelRates.find(r => r.fuelType.toLowerCase() === fuelType.toLowerCase());
      if (matched) {
        setRate(matched.rate);
      }
    }
  }, [fuelType, fuelRates]);

  // Auto calculate amount from litres
  const handleLitresChange = (val) => {
    setLitres(val);
    const ltrNum = parseFloat(val);
    if (!isNaN(ltrNum) && ltrNum > 0) {
      setDieselAmount(String(Math.round(ltrNum * rate)));
    } else {
      setDieselAmount('');
    }
  };

  // Reverse calculate litres from amount
  const handleAmountChange = (val) => {
    setDieselAmount(val);
    const amtNum = parseFloat(val);
    if (!isNaN(amtNum) && amtNum > 0 && rate > 0) {
      setLitres(String((amtNum / rate).toFixed(2)));
    }
  };

  if (!isOpen) return null;

  const numLitres = parseFloat(litres) || 0;
  const numRate = parseFloat(rate) || 0;
  const numDieselAmt = parseFloat(dieselAmount) || 0;
  const numCash = isRetailSale ? 0 : (parseFloat(cashAdvance) || 0);
  const numOil = isRetailSale ? 0 : (parseFloat(mobilOil) || 0);

  const formulaPrice = Math.round(numLitres * numRate);
  const diff = numDieselAmt > 0 ? numDieselAmt - formulaPrice : 0;
  const totalAmount = numDieselAmt + numCash + numOil;

  const numPaid = isRetailSale ? totalAmount : (parseFloat(paymentReceived) || 0);
  const outstandingAmount = Math.max(0, totalAmount - numPaid);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (numLitres <= 0 && numCash <= 0 && numOil <= 0) {
      alert('Please enter either fuel quantity/amount or driver cash advance.');
      return;
    }

    const selectedCust = customers?.find(c => c.id === Number(customerId));

    const newSale = {
      date,
      serialNo: serialNo.trim(),
      customerId: isRetailSale ? null : Number(customerId),
      customerName: isRetailSale ? 'Walk-in / Retail' : (selectedCust ? selectedCust.name : 'M.B GOODS'),
      isRetail: isRetailSale,
      vehicleNo: isRetailSale ? 'Walk-in Retail' : (vehicleNo.trim().toUpperCase() || 'General'),
      transactionType: fuelType,
      fuelType,
      litres: numLitres,
      rate: numRate,
      dieselAmount: numDieselAmt,
      cashAdvance: numCash,
      mobilOil: numOil,
      formulaPrice,
      difference: diff,
      totalAmount,
      paidAmount: numPaid,
      outstandingAmount,
      paymentType: isRetailSale ? 'Cash' : (outstandingAmount === 0 ? 'Cash/Paid' : (numPaid > 0 ? 'Partial' : 'Credit')),
      paymentStatus: outstandingAmount === 0 ? 'Paid' : (numPaid > 0 ? 'Partial' : 'Unpaid'),
      operatorName: 'Cashier',
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    const id = await db.sales.add(newSale);
    newSale.id = id;

    // Deduct stock from tank exactly once
    if (numLitres > 0) {
      const tank = await db.tanks.where('fuelType').equals(fuelType).first();
      if (tank) {
        const newStock = Math.max(0, (tank.currentStockLitres || 0) - numLitres);
        await db.tanks.update(tank.id, { currentStockLitres: newStock });
      }
    }

    // If regular customer made on-spot payment, record in ledgerEntries
    if (!isRetailSale && numPaid > 0) {
      await db.ledgerEntries.add({
        customerId: Number(customerId),
        date,
        inAmount: numPaid,
        outAmount: 0,
        mobilOilAdv: 0,
        dieselAmount: 0,
        description: `On-spot payment against Bill #${newSale.serialNo || id}`,
        receiptNo: `REC-${newSale.serialNo || id}`,
        paymentMethod: 'Cash',
        createdAt: new Date().toISOString()
      });
    }

    // Reset form
    setLitres('');
    setDieselAmount('');
    setCashAdvance('');
    setMobilOil('');
    setPaymentReceived('0');
    setNotes('');
    setVehicleNo('');

    if (onSaleSaved) {
      onSaleSaved(newSale, printAfterSave);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Quick Fuel Sale (F2)</h2>
              <p className="text-xs text-slate-500">Fleet billing or retail dispensing</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Toggle */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setIsRetailSale(false)}
              className={`py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                !isRetailSale ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Regular Business Customer
            </button>
            <button
              type="button"
              onClick={() => setIsRetailSale(true)}
              className={`py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                isRetailSale ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Walk-in Retail Cash
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Serial # */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial #</label>
              <input
                type="text"
                value={serialNo}
                onChange={e => setSerialNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Customer & Vehicle (if Regular) */}
          {!isRetailSale ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Account</label>
                <select
                  value={customerId}
                  onChange={e => {
                    setCustomerId(e.target.value);
                    setVehicleNo('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {customers?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle #</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={e => setVehicleNo(e.target.value)}
                  placeholder="e.g. 5244"
                  list="quickVehicles"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none uppercase"
                />
                <datalist id="quickVehicles">
                  {vehicles?.map(v => (
                    <option key={v.id} value={v.vehicleNo} />
                  ))}
                </datalist>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Walk-in Retail: Cash sale without customer account registration.</span>
            </div>
          )}

          {/* Fuel Type & Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFuelType('Diesel')}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    fuelType === 'Diesel'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Diesel
                </button>
                <button
                  type="button"
                  onClick={() => setFuelType('Petrol')}
                  className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    fuelType === 'Petrol'
                      ? 'bg-emerald-600 text-white border-emerald-700 font-extrabold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Petrol
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rate (PKR/L)</label>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={e => setRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Litres & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Litres</label>
              <input
                type="number"
                step="0.01"
                value={litres}
                onChange={e => handleLitresChange(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fuel Amount (PKR)</label>
              <input
                type="number"
                value={dieselAmount}
                onChange={e => handleAmountChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Regular Customer Cash Advance / Mobil Oil */}
          {!isRetailSale && (
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Driver Advance</label>
                <input
                  type="number"
                  value={cashAdvance}
                  onChange={e => setCashAdvance(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobil Oil</label>
                <input
                  type="number"
                  value={mobilOil}
                  onChange={e => setMobilOil(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Received</label>
                <input
                  type="number"
                  value={paymentReceived}
                  onChange={e => setPaymentReceived(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700"
                />
              </div>
            </div>
          )}

          {/* Total Summary */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-sans">Net Total</span>
              <span className="text-base font-extrabold text-blue-700">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block text-[10px] uppercase font-sans">
                {isRetailSale ? 'Cash Paid' : 'Credit Balance'}
              </span>
              <span className={`text-base font-bold ${
                isRetailSale ? 'text-emerald-700' : (outstandingAmount > 0 ? 'text-amber-700' : 'text-emerald-700')
              }`}>
                {formatCurrency(isRetailSale ? totalAmount : outstandingAmount)}
              </span>
            </div>
          </div>

          {/* Print Checkbox & Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={printAfterSave}
                onChange={e => setPrintAfterSave(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 cursor-pointer"
              />
              <span>Print bill after saving</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Save Transaction
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
