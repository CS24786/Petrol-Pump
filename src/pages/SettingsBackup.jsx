import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, exportDatabaseBackup, restoreDatabaseBackup } from '../db/db';
import { seedInitialData } from '../db/seedData';
import { 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Fuel, 
  Printer, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  FileJson,
  Info
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function SettingsBackup() {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Queries
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);
  const fuelRates = useLiveQuery(() => db.fuelRates.toArray(), []);

  // Form states for pump profile
  const pumpName = settingsList?.find(s => s.key === 'pumpName')?.value || 'DIYAL FILLING STATION';
  const pumpTagline = settingsList?.find(s => s.key === 'pumpTagline')?.value || 'Authorized Petroleum Dealer';
  const pumpAddress = settingsList?.find(s => s.key === 'pumpAddress')?.value || 'Main Highway Bypass, Near Freight Hub';
  const pumpPhone = settingsList?.find(s => s.key === 'pumpPhone')?.value || '+92 300 7654321 / +92 321 9876543';
  const pumpNTN = settingsList?.find(s => s.key === 'pumpNTN')?.value || '4829103-7';

  const [editPumpName, setEditPumpName] = useState(pumpName);
  const [editPumpTagline, setEditPumpTagline] = useState(pumpTagline);
  const [editPumpAddress, setEditPumpAddress] = useState(pumpAddress);
  const [editPumpPhone, setEditPumpPhone] = useState(pumpPhone);
  const [editPumpNTN, setEditPumpNTN] = useState(pumpNTN);

  // Fuel rates
  const dieselRate = fuelRates?.find(r => r.fuelType === 'Diesel')?.rate || 397.45;
  const petrolRate = fuelRates?.find(r => r.fuelType === 'Petrol')?.rate || 400.66;

  const [newDieselRate, setNewDieselRate] = useState(dieselRate);
  const [newPetrolRate, setNewPetrolRate] = useState(petrolRate);

  // Sync state when DB loads
  React.useEffect(() => {
    setEditPumpName(pumpName);
    setEditPumpTagline(pumpTagline);
    setEditPumpAddress(pumpAddress);
    setEditPumpPhone(pumpPhone);
    setEditPumpNTN(pumpNTN);
  }, [pumpName, pumpTagline, pumpAddress, pumpPhone, pumpNTN]);

  React.useEffect(() => {
    setNewDieselRate(dieselRate);
    setNewPetrolRate(petrolRate);
  }, [dieselRate, petrolRate]);

  // Save Pump Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await db.settings.put({ key: 'pumpName', value: editPumpName });
    await db.settings.put({ key: 'pumpTagline', value: editPumpTagline });
    await db.settings.put({ key: 'pumpAddress', value: editPumpAddress });
    await db.settings.put({ key: 'pumpPhone', value: editPumpPhone });
    await db.settings.put({ key: 'pumpNTN', value: editPumpNTN });

    setSuccessMsg('Station business details updated successfully!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Save Fuel Rates
  const handleSaveRates = async (e) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    const dRateObj = fuelRates?.find(r => r.fuelType === 'Diesel');
    if (dRateObj) {
      await db.fuelRates.update(dRateObj.id, { rate: parseFloat(newDieselRate) || 397.45, effectiveDate: today });
    } else {
      await db.fuelRates.add({ fuelType: 'Diesel', rate: parseFloat(newDieselRate) || 397.45, effectiveDate: today });
    }

    const pRateObj = fuelRates?.find(r => r.fuelType === 'Petrol');
    if (pRateObj) {
      await db.fuelRates.update(pRateObj.id, { rate: parseFloat(newPetrolRate) || 400.66, effectiveDate: today });
    } else {
      await db.fuelRates.add({ fuelType: 'Petrol', rate: parseFloat(newPetrolRate) || 400.66, effectiveDate: today });
    }

    setSuccessMsg('Petrol and Diesel dispensing rates updated across all sales screens!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // 1-Click JSON Backup Download
  const handleExportBackup = async () => {
    try {
      const backup = await exportDatabaseBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `PetrolPump_Backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('Complete database backup JSON exported successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Export error: ' + err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  // File Upload Restore
  const handleFileRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        const parsed = JSON.parse(event.target.result);
        
        if (!parsed.tables || typeof parsed.tables !== 'object') {
          throw new Error('Invalid backup file. Missing database tables schema.');
        }

        if (window.confirm('Restore database from backup file? The system will create an automatic safety backup checkpoint first.')) {
          await restoreDatabaseBackup(parsed);
          setSuccessMsg('Database restored successfully from backup!');
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      } catch (err) {
        setErrorMsg('Restore error: ' + err.message);
        setTimeout(() => setErrorMsg(''), 5000);
      } finally {
        setIsRestoring(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Reset to October 2026 Sample Data
  const handleResetToDemo = async () => {
    if (window.confirm('Reload October 2026 client dataset? This will restore all vehicles and M.B Goods transactions.')) {
      try {
        setIsRestoring(true);
        await seedInitialData(true);
        setSuccessMsg('October 2026 reference dataset reloaded successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg('Reset error: ' + err.message);
      } finally {
        setIsRestoring(false);
      }
    }
  };

  return (
    <div className="space-y-5 pb-14">
      
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            System Settings &amp; Data Protection
          </h2>
          <p className="text-xs text-slate-500">
            Station branding, fuel dispensing rates, automated disaster recovery &amp; local persistent backups
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Local IndexedDB Persistence Active</span>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Section 1: Petrol Pump Station Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Station Identity &amp; Invoicing Details</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Station / Pump Name</label>
              <input
                type="text"
                value={editPumpName}
                onChange={e => setEditPumpName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sub-heading / Tagline</label>
              <input
                type="text"
                value={editPumpTagline}
                onChange={e => setEditPumpTagline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Station Address (Appears on Bills)</label>
              <input
                type="text"
                value={editPumpAddress}
                onChange={e => setEditPumpAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number(s)</label>
                <input
                  type="text"
                  value={editPumpPhone}
                  onChange={e => setEditPumpPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NTN / STRN</label>
                <input
                  type="text"
                  value={editPumpNTN}
                  onChange={e => setEditPumpNTN(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-sm transition-colors"
              >
                Save Station Profile
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Fuel Dispensing Rates Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
            <Fuel className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Configure Fuel Rates (PKR per Litre)</h3>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-4 text-xs">
            <p className="text-slate-500">
              Update dispensing rates for Diesel and Petrol. Changes apply immediately to new sales entries and dispenser nozzles.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                <span className="font-bold text-amber-900 uppercase text-[11px] block">High Speed Diesel (HSD)</span>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Rate (PKR/Ltr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDieselRate}
                    onChange={e => setNewDieselRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-base text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                <span className="font-bold text-emerald-900 uppercase text-[11px] block">Super Petrol (PMG)</span>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-0.5">Rate (PKR/Ltr)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPetrolRate}
                    onChange={e => setNewPetrolRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-base text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer shadow-sm transition-colors"
              >
                Update Fuel Rates
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Section 3: Data Protection, Backup & Disaster Recovery */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Local Data Backup &amp; Disaster Recovery</h3>
        </div>

        <p className="text-xs text-slate-500">
          Your business records are stored locally in the offline database. Regularly export JSON backups to preserve customer ledgers, sales records, and fuel stock history.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Export Backup */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 font-bold">
                <Download className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Export 1-Click JSON Backup</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Generates a verified, standalone JSON backup file of all sales, ledgers, suppliers, tanks, and expenses.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              Export JSON File
            </button>
          </div>

          {/* Card 2: Restore from Backup */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 font-bold">
                <Upload className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Restore from Backup File</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload a verified JSON backup file. The system automatically creates a pre-restore safety checkpoint first.
              </p>
            </div>
            
            <label className="mt-4 w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg text-center cursor-pointer shadow-2xs transition-colors block">
              <span>{isRestoring ? 'Restoring Database...' : 'Upload &amp; Restore JSON'}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileRestore}
                disabled={isRestoring}
                className="hidden"
              />
            </label>
          </div>

          {/* Card 3: Reload Reference Dataset */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2 font-bold">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Reload Client October 2026 Data</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Restores the client's reference Excel dataset: 140+ vehicle sales, M.B Goods starting balance Rs. 1,355,204, and ledger.
              </p>
            </div>
            <button
              onClick={handleResetToDemo}
              className="mt-4 w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              Reload Oct-2026 Data
            </button>
          </div>

        </div>
      </div>

      {/* System Technical Info Footer */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Petrol Pump Management System &bull; Version 1.0.0 &bull; Local Offline Dexie IndexedDB Database</span>
        </div>
        <div className="font-mono text-emerald-700 font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Database Engine Online</span>
        </div>
      </div>

    </div>
  );
}
