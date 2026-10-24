import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Database, 
  Fuel, 
  Gauge, 
  AlertTriangle, 
  PlusCircle, 
  Check, 
  Edit3, 
  TrendingDown, 
  CheckCircle2, 
  Droplet 
} from 'lucide-react';
import { formatNumber, formatCurrency, formatDateDisplay } from '../utils/formatters';

export default function StockTanks() {
  const [selectedTank, setSelectedTank] = useState(null);
  const [dipCm, setDipCm] = useState('');
  const [dipLitres, setDipLitres] = useState('');
  const [isDipModalOpen, setIsDipModalOpen] = useState(false);

  // Nozzle modal state
  const [selectedNozzle, setSelectedNozzle] = useState(null);
  const [closingMeter, setClosingMeter] = useState('');
  const [testingLitres, setTestingLitres] = useState('');
  const [isNozzleModalOpen, setIsNozzleModalOpen] = useState(false);

  // Queries
  const tanks = useLiveQuery(() => db.tanks.toArray(), []);
  const nozzles = useLiveQuery(() => db.nozzles.toArray(), []);
  const purchases = useLiveQuery(() => db.purchases.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);

  // Handle Dip Update
  const handleOpenDip = (tank) => {
    setSelectedTank(tank);
    setDipCm(String(tank.currentDipCm || ''));
    setDipLitres(String(tank.currentStockLitres || ''));
    setIsDipModalOpen(true);
  };

  const handleSaveDip = async (e) => {
    e.preventDefault();
    if (!selectedTank) return;

    await db.tanks.update(selectedTank.id, {
      currentDipCm: parseFloat(dipCm) || 0,
      currentStockLitres: parseFloat(dipLitres) || 0,
      lastDipDate: new Date().toISOString().split('T')[0]
    });

    setIsDipModalOpen(false);
  };

  // Handle Nozzle Meter Update
  const handleOpenNozzle = (nozzle) => {
    setSelectedNozzle(nozzle);
    setClosingMeter(String(nozzle.currentMeter || nozzle.openingMeter || ''));
    setTestingLitres(String(nozzle.testingLitres || '0'));
    setIsNozzleModalOpen(true);
  };

  const handleSaveNozzle = async (e) => {
    e.preventDefault();
    if (!selectedNozzle) return;

    await db.nozzles.update(selectedNozzle.id, {
      currentMeter: parseFloat(closingMeter) || selectedNozzle.currentMeter,
      testingLitres: parseFloat(testingLitres) || 0
    });

    setIsNozzleModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider font-mono">
              Stock & Inventory Control
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">Underground Tanks & Dispenser Nozzles</h2>
          <p className="text-xs text-slate-400">
            Monitor dip levels, nozzle mechanical/electronic meters, testing litres, and tanker delivery stock
          </p>
        </div>
      </div>

      {/* Tanks List */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-400" />
          Underground Fuel Storage Tanks
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tanks?.map(tank => {
            const pct = Math.round(((tank.currentStockLitres || 0) / (tank.capacityLitres || 1)) * 100);
            const isLow = (tank.currentStockLitres || 0) <= (tank.reorderLevelLitres || 0);
            const isDiesel = tank.fuelType === 'Diesel';

            return (
              <div key={tank.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${isDiesel ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{tank.tankName}</h4>
                      <span className="text-[11px] text-slate-400 font-mono">Product: {tank.fuelType}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenDip(tank)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand-400" />
                    <span>Update Dip / Stock</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 my-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 font-mono text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Current Stock</span>
                    <span className="text-base font-black text-white">{formatNumber(tank.currentStockLitres, 0)} L</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Capacity</span>
                    <span className="text-base font-semibold text-slate-300">{formatNumber(tank.capacityLitres, 0)} L</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Dip Depth</span>
                    <span className="text-base font-bold text-amber-400">{tank.currentDipCm} cm</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Tank Volume:</span>
                    <span className={`font-bold ${isDiesel ? 'text-amber-400' : 'text-emerald-400'}`}>{pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow
                          ? 'bg-rose-500'
                          : isDiesel
                          ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Last Dip Recorded: {formatDateDisplay(tank.lastDipDate)}</span>
                  {isLow && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Reorder Needed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nozzle Meters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              Dispensing Nozzles & Totalizer Meters
            </h3>
            <p className="text-xs text-slate-400">Totalizer opening meter, current meter, and pump testing volume</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Nozzle Name</th>
                <th className="py-2.5 px-3">Fuel Product</th>
                <th className="py-2.5 px-3 text-right">Opening Meter</th>
                <th className="py-2.5 px-3 text-right">Current Meter</th>
                <th className="py-2.5 px-3 text-right">Testing (Ltr)</th>
                <th className="py-2.5 px-3 text-right">Dispensed Total</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {nozzles?.map(n => {
                const dispensed = Math.max(0, (n.currentMeter || 0) - (n.openingMeter || 0) - (n.testingLitres || 0));

                return (
                  <tr key={n.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-200">{n.nozzleName}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.fuelType === 'Diesel' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {n.fuelType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{formatNumber(n.openingMeter, 2)}</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">{formatNumber(n.currentMeter, 2)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-400">{formatNumber(n.testingLitres, 1)} L</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-black">{formatNumber(dispensed, 2)} L</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400">
                        Active
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <button
                        onClick={() => handleOpenNozzle(n)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                      >
                        Update Meter
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Update Tank Dip */}
      {isDipModalOpen && selectedTank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Record Dip for {selectedTank.tankName}</h3>
            
            <form onSubmit={handleSaveDip} className="space-y-3 font-mono">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-sans">Dip Measurement (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={dipCm}
                  onChange={e => setDipCm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-sans">Calculated / Chart Litres</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={dipLitres}
                  onChange={e => setDipLitres(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 font-sans">
                <button
                  type="button"
                  onClick={() => setIsDipModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
                >
                  Save Dip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Nozzle Meter */}
      {isNozzleModalOpen && selectedNozzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Update Meter for {selectedNozzle.nozzleName}</h3>
            
            <form onSubmit={handleSaveNozzle} className="space-y-3 font-mono">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-sans">Current Totalizer Meter Reading</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={closingMeter}
                  onChange={e => setClosingMeter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-sans">Testing Litres (Not Sold)</label>
                <input
                  type="number"
                  step="0.1"
                  value={testingLitres}
                  onChange={e => setTestingLitres(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 font-sans">
                <button
                  type="button"
                  onClick={() => setIsNozzleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold"
                >
                  Update Meter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
