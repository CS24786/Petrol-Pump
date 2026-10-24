import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Truck, PlusCircle, Check, Calendar, Hash, Building2, Download } from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';

export default function PurchasesSuppliers() {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [tankId, setTankId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [fuelType, setFuelType] = useState('Diesel');
  const [litres, setLitres] = useState('');
  const [rate, setRate] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [lorryNo, setLorryNo] = useState('');
  const [notes, setNotes] = useState('');

  // Queries
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const purchases = useLiveQuery(() => db.purchases.orderBy('id').reverse().toArray(), []);
  const tanks = useLiveQuery(() => db.tanks.toArray(), []);

  // Initialize defaults
  React.useEffect(() => {
    if (suppliers && suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
    if (tanks && tanks.length > 0 && !tankId) {
      setTankId(tanks[0].id);
    }
  }, [suppliers, tanks, supplierId, tankId]);

  const numLitres = parseFloat(litres) || 0;
  const numRate = parseFloat(rate) || 0;
  const totalAmount = Math.round(numLitres * numRate);
  const numPaid = parseFloat(paidAmount) || 0;
  const balanceAmount = totalAmount - numPaid;

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (numLitres <= 0 || numRate <= 0) return;

    const newPurchase = {
      supplierId: Number(supplierId),
      tankId: Number(tankId),
      invoiceNo: invoiceNo.trim(),
      date,
      fuelType,
      litres: numLitres,
      purchaseRate: numRate,
      totalAmount,
      paidAmount: numPaid,
      balanceAmount,
      lorryNo: lorryNo.trim().toUpperCase(),
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    await db.purchases.add(newPurchase);

    // Increase tank stock!
    const tank = await db.tanks.get(Number(tankId));
    if (tank) {
      const newStock = (tank.currentStockLitres || 0) + numLitres;
      await db.tanks.update(tank.id, { currentStockLitres: newStock });
    }

    // Reset form
    setLitres('');
    setRate('');
    setPaidAmount('');
    setLorryNo('');
    setNotes('');
    setIsPurchaseModalOpen(false);
  };

  const handleExportCSV = () => {
    if (!purchases?.length) return;
    const exportData = purchases.map(p => {
      const supp = suppliers?.find(s => s.id === p.supplierId);
      return {
        'Date': p.date,
        'Invoice #': p.invoiceNo,
        'Supplier': supp?.name || 'PSO',
        'Fuel Type': p.fuelType,
        'Lorry #': p.lorryNo,
        'Litres': p.litres,
        'Rate': p.purchaseRate,
        'Total Amount': p.totalAmount,
        'Paid Amount': p.paidAmount,
        'Balance': p.balanceAmount
      };
    });
    exportToCSV(`Purchases_Log_${new Date().toISOString().slice(0, 10)}.csv`, exportData);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-mono">
              Fuel Procurement
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Purchases & Oil Marketing Companies (OMCs)</h2>
          <p className="text-xs text-slate-400">
            Record fuel tanker decanting, supplier invoices, payments, and automated tank inventory addition
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
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold shadow-lg transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>Receive Fuel Tanker</span>
          </button>
        </div>
      </div>

      {/* Supplier Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suppliers?.map(s => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">{s.name}</h4>
                <p className="text-[11px] text-slate-400">{s.phone || 'OMC Supplier'}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-baseline font-mono">
              <span className="text-[11px] text-slate-400">Outstanding Balance:</span>
              <span className="text-sm font-bold text-rose-400">{formatCurrency(s.currentBalance || 0)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Purchases History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            Fuel Tanker Receiving Register
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Supplier</th>
                <th className="py-2.5 px-3">Lorry #</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Litres</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">Total Bill</th>
                <th className="py-2.5 px-3 text-right">Paid Amount</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {purchases?.map(p => {
                const supp = suppliers?.find(s => s.id === p.supplierId);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300">{formatDateDisplay(p.date)}</td>
                    <td className="py-2.5 px-3 text-slate-400">#{p.invoiceNo}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-200">{supp?.name || 'PSO'}</td>
                    <td className="py-2.5 px-3 text-amber-300 font-bold">{p.lorryNo || '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.fuelType === 'Diesel' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {p.fuelType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">{formatNumber(p.litres, 0)} L</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{formatNumber(p.purchaseRate, 2)}</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">{formatCurrency(p.totalAmount)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">{formatCurrency(p.paidAmount)}</td>
                    <td className="py-2.5 px-3 text-right text-rose-400 font-bold">{formatCurrency(p.balanceAmount)}</td>
                  </tr>
                );
              })}

              {(!purchases || purchases.length === 0) && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No fuel purchases recorded yet. Click "Receive Fuel Tanker" to record a delivery.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Purchase */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                Receive Fuel Tanker (Purchase Invoice)
              </h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-slate-400 mb-1">Invoice / Delivery Slip #</label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Supplier (OMC)</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {suppliers?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tanker Lorry / Bowser #</label>
                  <input
                    type="text"
                    value={lorryNo}
                    onChange={e => setLorryNo(e.target.value)}
                    placeholder="e.g. TL-8842"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Product</label>
                  <select
                    value={fuelType}
                    onChange={e => setFuelType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Diesel">High Speed Diesel (HSD)</option>
                    <option value="Petrol">Super Petrol (PMG)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Decant Into Tank</label>
                  <select
                    value={tankId}
                    onChange={e => setTankId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {tanks?.map(t => (
                      <option key={t.id} value={t.id}>{t.tankName} ({t.currentStockLitres}L currently)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Litres Received</label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="e.g. 15000"
                    value={litres}
                    onChange={e => setLitres(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Purchase Rate per Ltr</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 392.50"
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
                <span className="text-slate-400 text-xs">Total Bill Amount:</span>
                <span className="text-base font-black text-amber-400">{formatCurrency(totalAmount)}</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount Paid to Supplier Now (PKR)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 5000000"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
                >
                  Confirm & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
