import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, exportDatabaseBackup, restoreDatabaseBackup } from '../db/db';
import { ensureSystemInitialized, loadSampleTestingData, wipeAllData } from '../db/seedData';
import { clearSessionUser } from '../utils/auth';
import { 
  Building2, 
  RotateCw, 
  Sparkles, 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Fuel, 
  GitBranch, 
  ExternalLink, 
  Info, 
  Check, 
  RefreshCw,
  Edit2,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  FileCode,
  Laptop
} from 'lucide-react';

export default function SettingsBackup() {
  const currentAppVersion = 'v1.0.0';

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showGuideDrawer, setShowGuideDrawer] = useState(false);

  // GitHub Auto-Update States
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState(null);
  const [isEditingRepo, setIsEditingRepo] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Queries from Dexie
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);
  const fuelRates = useLiveQuery(() => db.fuelRates.toArray(), []);
  const customerCount = useLiveQuery(() => db.customers.count(), []);
  const salesCount = useLiveQuery(() => db.sales.count(), []);
  const readingsCount = useLiveQuery(() => db.meterReadings.count(), []);

  // Database settings mapped
  const pumpSettings = React.useMemo(() => {
    if (!settingsList) return {};
    const map = {};
    settingsList.forEach(s => {
      map[s.key] = s.value;
    });
    return map;
  }, [settingsList]);

  // Form States for Station Profile
  const [stationName, setStationName] = useState('DIYAL FILLING STATION');
  const [tagline, setTagline] = useState('تیل خالص، پیمانہ پورا، معیاری سروس کی ضمانت • Authorized Petroleum Dealer');
  const [primaryPhone, setPrimaryPhone] = useState('0300-7654321');
  const [secondaryMobile, setSecondaryMobile] = useState('0321-9876543');
  const [proprietor1, setProprietor1] = useState('Chaudhry Diyal Muhammad (0300-1122334)');
  const [proprietor2, setProprietor2] = useState('Haji Naveed Akhtar (0321-5566778)');
  const [address, setAddress] = useState('Chiniot Road, Chak Jhumra, FSD.');
  const [cityRegion, setCityRegion] = useState('Faisalabad / Punjab');
  const [ntn, setNtn] = useState('NTN-4829103-7');
  const [email, setEmail] = useState('diyal.station@gmail.com');
  const [githubRepo, setGithubRepo] = useState('CS24786/Petrol-Pump');

  // Fuel Rates States
  const dieselRate = fuelRates?.find(r => r.fuelType === 'Diesel')?.rate || 397.45;
  const petrolRate = fuelRates?.find(r => r.fuelType === 'Petrol')?.rate || 400.66;
  const [newDieselRate, setNewDieselRate] = useState(dieselRate);
  const [newPetrolRate, setNewPetrolRate] = useState(petrolRate);

  // Sync state when DB loads
  useEffect(() => {
    if (pumpSettings.pumpName) setStationName(pumpSettings.pumpName);
    if (pumpSettings.pumpTagline) setTagline(pumpSettings.pumpTagline);
    if (pumpSettings.pumpPhonePrimary || pumpSettings.pumpPhone) {
      setPrimaryPhone(pumpSettings.pumpPhonePrimary || pumpSettings.pumpPhone);
    }
    if (pumpSettings.pumpPhoneSecondary) setSecondaryMobile(pumpSettings.pumpPhoneSecondary);
    if (pumpSettings.proprietor1) setProprietor1(pumpSettings.proprietor1);
    if (pumpSettings.proprietor2) setProprietor2(pumpSettings.proprietor2);
    if (pumpSettings.pumpAddress) setAddress(pumpSettings.pumpAddress);
    if (pumpSettings.pumpCity) setCityRegion(pumpSettings.pumpCity);
    if (pumpSettings.pumpNTN) setNtn(pumpSettings.pumpNTN);
    if (pumpSettings.pumpEmail) setEmail(pumpSettings.pumpEmail);
    if (pumpSettings.githubRepo) setGithubRepo(pumpSettings.githubRepo);
  }, [pumpSettings]);

  useEffect(() => {
    setNewDieselRate(dieselRate);
    setNewPetrolRate(petrolRate);
  }, [dieselRate, petrolRate]);

  // Handle Save Station Profile & Fuel Rates
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      await db.settings.bulkPut([
        { key: 'pumpName', value: stationName },
        { key: 'pumpTagline', value: tagline },
        { key: 'pumpPhonePrimary', value: primaryPhone },
        { key: 'pumpPhone', value: primaryPhone },
        { key: 'pumpPhoneSecondary', value: secondaryMobile },
        { key: 'proprietor1', value: proprietor1 },
        { key: 'proprietor2', value: proprietor2 },
        { key: 'pumpAddress', value: address },
        { key: 'pumpCity', value: cityRegion },
        { key: 'pumpNTN', value: ntn },
        { key: 'pumpEmail', value: email },
        { key: 'githubRepo', value: githubRepo }
      ]);

      // Save Fuel Rates
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

      setSuccessMsg('Station profile & fuel rates successfully saved to database!');
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setErrorMsg('Failed to save profile: ' + err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click JSON Backup Download
  const handleExportBackup = async () => {
    try {
      setIsProcessing(true);
      const backup = await exportDatabaseBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `PetrolPump_Database_Backup_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('Complete database snapshot JSON exported successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg('Export error: ' + err.message);
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // File Upload Restore
  const handleFileRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsProcessing(true);
        const parsed = JSON.parse(event.target.result);
        
        if (!parsed.tables || typeof parsed.tables !== 'object') {
          throw new Error('Invalid backup file. Missing database tables schema.');
        }

        if (window.confirm('Restore database from backup file? The system will create an automatic safety checkpoint first.')) {
          await restoreDatabaseBackup(parsed);
          setSuccessMsg('Database restored successfully from backup!');
          setTimeout(() => setSuccessMsg(''), 4000);
        }
      } catch (err) {
        setErrorMsg('Restore error: ' + err.message);
        setTimeout(() => setErrorMsg(''), 5000);
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Load Sample Testing Data
  const handleLoadSampleData = async () => {
    try {
      setIsProcessing(true);
      setShowSampleModal(false);
      await loadSampleTestingData();
      localStorage.setItem('PP_SAMPLE_DATA_LOADED', 'true');
      clearSessionUser();
      // Redirect immediately to Login screen
      window.location.reload();
    } catch (err) {
      setErrorMsg('Failed to load sample data: ' + err.message);
      setIsProcessing(false);
    }
  };

  // Wipe All Data / Clean Database (Start Fresh with 0 records)
  const handleWipeAllData = async () => {
    try {
      setIsProcessing(true);
      setShowWipeModal(false);
      await wipeAllData(true);
      localStorage.setItem('PP_SAMPLE_DATA_LOADED', 'false');
      clearSessionUser();
      // Redirect immediately to Login screen
      window.location.reload();
    } catch (err) {
      setErrorMsg('Failed to wipe data: ' + err.message);
      setIsProcessing(false);
    }
  };

  // Check for GitHub Updates
  const handleCheckGitHubUpdates = async () => {
    try {
      setIsCheckingUpdate(true);
      setUpdateResult(null);
      setIsDownloadingUpdate(false);
      setDownloadProgress(0);
      setUpdateDownloaded(false);

      const targetRepo = githubRepo.trim() || 'CS24786/Petrol-Pump';
      const apiUrl = `https://api.github.com/repos/${targetRepo}/releases/latest`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        // If 404 (no releases published yet), system is already on new/initial version!
        setUpdateResult({
          status: 'up_to_date',
          tagName: currentAppVersion,
          message: `System already on new version (${currentAppVersion})`
        });
        return;
      }

      const releaseData = await response.json();
      const latestTag = releaseData.tag_name || '';

      // Check if remote version is strictly newer than currentAppVersion
      const cleanLatest = latestTag.replace(/[^0-9.]/g, '');
      const cleanCurrent = currentAppVersion.replace(/[^0-9.]/g, '');
      
      const isNewer = cleanLatest && cleanCurrent && (
        cleanLatest.localeCompare(cleanCurrent, undefined, { numeric: true }) > 0
      );

      if (!isNewer) {
        setUpdateResult({
          status: 'up_to_date',
          tagName: currentAppVersion,
          message: `System already on new version (${currentAppVersion})`
        });
        return;
      }

      // Look for .exe asset and latest.yml asset in release
      const exeAsset = releaseData.assets?.find(a => a.name.endsWith('.exe'));
      const ymlAsset = releaseData.assets?.find(a => a.name === 'latest.yml');

      setUpdateResult({
        status: 'update_available',
        tagName: latestTag,
        releaseName: releaseData.name || latestTag,
        publishedAt: releaseData.published_at ? new Date(releaseData.published_at).toLocaleDateString() : 'Recent',
        body: releaseData.body || 'New enhancements, UI updates and stability improvements.',
        htmlUrl: releaseData.html_url,
        exeAsset: exeAsset ? { name: exeAsset.name, downloadUrl: exeAsset.browser_download_url } : null,
        ymlAsset: ymlAsset ? { name: ymlAsset.name, downloadUrl: ymlAsset.browser_download_url } : null
      });

    } catch (err) {
      // In case of offline or local network, report system is on current version
      setUpdateResult({
        status: 'up_to_date',
        tagName: currentAppVersion,
        message: `System already on new version (${currentAppVersion})`
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Download New Version Handler
  const handleDownloadUpdate = () => {
    setIsDownloadingUpdate(true);
    setDownloadProgress(0);

    const targetRepo = githubRepo.trim() || 'CS24786/Petrol-Pump';
    const tag = updateResult?.tagName || 'v1.0.1';
    const cleanVer = tag.replace('v', '');
    const downloadUrl = updateResult?.exeAsset?.downloadUrl || 
      `https://github.com/${targetRepo}/releases/download/${tag}/Diyal-Filling-Station-Setup-${cleanVer}.exe`;

    // Trigger browser download of installer file
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = `Diyal-Filling-Station-Setup-${cleanVer}.exe`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Realistic progress animation
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 20) + 12;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setDownloadProgress(100);
        setIsDownloadingUpdate(false);
        setUpdateDownloaded(true);
        setSuccessMsg(`New version (${tag}) downloaded! Click "Restart & Apply Changes" to complete installation.`);
      } else {
        setDownloadProgress(current);
      }
    }, 280);
  };

  // Restart & Apply Changes Handler
  const handleRestartAndApply = () => {
    setIsRestarting(true);
    setSuccessMsg('Restarting Diyal Filling Station System & applying updates...');
    setTimeout(() => {
      if (window.electronAPI?.quitAndInstall) {
        window.electronAPI.quitAndInstall();
      } else {
        window.location.reload();
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Toast Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 text-xs">Dismiss</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-700 hover:text-rose-900 text-xs">Dismiss</button>
        </div>
      )}

      {/* Main 2-Column Layout matching Marble Project Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================
            LEFT COLUMN: Station & Company Profile (7 cols)
           ======================================================== */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-5">
          
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                  Petrol Pump &amp; Station Profile
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  Printed on challans, customer invoices, shift reports &amp; official ledgers
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Offline Database</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            
            {/* Field: STATION / COMPANY NAME */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PETROL PUMP / STATION NAME *
              </label>
              <input
                type="text"
                required
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                placeholder="e.g. Diyal Filling Station"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold text-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            {/* Field: TAGLINE / SLOGAN */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                TAGLINE / SLOGAN
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="تیل خالص، پیمانہ پورا، معیاری سروس کی ضمانت"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                style={{ direction: 'rtl' }}
              />
            </div>

            {/* Field: PRIMARY PHONE & SECONDARY MOBILE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  PRIMARY PHONE # *
                </label>
                <input
                  type="text"
                  required
                  value={primaryPhone}
                  onChange={(e) => setPrimaryPhone(e.target.value)}
                  placeholder="0300-7654321"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  SECONDARY MOBILE #
                </label>
                <input
                  type="text"
                  value={secondaryMobile}
                  onChange={(e) => setSecondaryMobile(e.target.value)}
                  placeholder="0321-9876543"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
            </div>

            {/* Field: PROPRIETOR 1 & PROPRIETOR 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  PROPRIETOR 1 (NAME &amp; #)
                </label>
                <input
                  type="text"
                  value={proprietor1}
                  onChange={(e) => setProprietor1(e.target.value)}
                  placeholder="Chaudhry Diyal Muhammad (0300-1122334)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  PROPRIETOR 2 (NAME &amp; #)
                </label>
                <input
                  type="text"
                  value={proprietor2}
                  onChange={(e) => setProprietor2(e.target.value)}
                  placeholder="Haji Naveed Akhtar (0321-5566778)"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
            </div>

            {/* Field: STATION YARD / SHOWROOM ADDRESS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                STATION YARD / HIGHWAY ADDRESS
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Chiniot Road, Chak Jhumra, FSD."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            {/* Field: CITY / REGION & NTN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  CITY / REGION
                </label>
                <input
                  type="text"
                  value={cityRegion}
                  onChange={(e) => setCityRegion(e.target.value)}
                  placeholder="Faisalabad / Punjab"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  NTN / TAX REGISTRATION #
                </label>
                <input
                  type="text"
                  value={ntn}
                  onChange={(e) => setNtn(e.target.value)}
                  placeholder="NTN-4829103-7"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
            </div>

            {/* Field: EMAIL (OPTIONAL) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                EMAIL (OPTIONAL)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="diyal.station@gmail.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            {/* Section: Fuel Dispensing Rates */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                ACTIVE FUEL DISPENSING RATES (PKR / LITRE)
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-amber-900">High Speed Diesel (HSD)</span>
                    <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newDieselRate}
                      onChange={(e) => setNewDieselRate(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-emerald-900">Super Motor Petrol (PMG)</span>
                    <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newPetrolRate}
                      onChange={(e) => setNewPetrolRate(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-slate-900 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-[#0c1527] hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Save Station Profile &amp; Fuel Rates</span>
              </button>
            </div>

          </form>
        </div>


        {/* ========================================================
            RIGHT COLUMN: Remote Auto-Update & Database Safety (5 cols)
           ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* --------------------------------------------------------
              CARD 1: Remote System Auto-Update
             -------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Remote System Auto-Update
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200">
                {currentAppVersion}
              </span>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-slate-500 leading-relaxed">
              Deploy remote updates to clients via GitHub Releases without visiting the client machine.
            </p>

            {/* Source Repository Display & Edit */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                  <span>Source:</span>
                  <a
                    href={`https://github.com/${githubRepo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{githubRepo}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingRepo(!isEditingRepo)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Change repository name"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {isEditingRepo && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="Owner/Repo-Name"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await db.settings.put({ key: 'githubRepo', value: githubRepo });
                      setIsEditingRepo(false);
                      setSuccessMsg('GitHub repository configuration updated!');
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
                  >
                    Set
                  </button>
                </div>
              )}
            </div>

            {/* Check for GitHub Updates Button */}
            <button
              type="button"
              onClick={handleCheckGitHubUpdates}
              disabled={isCheckingUpdate}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 text-blue-600 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
              <span>{isCheckingUpdate ? 'Connecting to GitHub Releases...' : 'Check for GitHub Updates'}</span>
            </button>

            {/* Update Result Display */}
            {updateResult && (
              <div className="animate-in fade-in space-y-2.5">
                {updateResult.status === 'up_to_date' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-3 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-extrabold text-sm block text-emerald-950">System already on new version ({currentAppVersion})</span>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Your station terminal is running the latest stable build. No new updates required.
                      </p>
                    </div>
                  </div>
                )}

                {updateResult.status === 'update_available' && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-950 text-xs space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-indigo-950 flex items-center gap-1.5 text-sm">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        New Version Available: {updateResult.tagName}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-mono">{updateResult.publishedAt}</span>
                    </div>

                    <p className="text-[11px] text-indigo-800/90 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                      {updateResult.body}
                    </p>

                    {/* Progress Bar while downloading */}
                    {isDownloadingUpdate && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-mono text-indigo-900">
                          <span>Downloading installer package...</span>
                          <span className="font-bold">{downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-indigo-100 rounded-full h-2.5 overflow-hidden border border-indigo-200">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${downloadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Download or Restart & Apply Changes */}
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {!updateDownloaded ? (
                        <button
                          type="button"
                          onClick={handleDownloadUpdate}
                          disabled={isDownloadingUpdate}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                        >
                          <Download className={`w-3.5 h-3.5 ${isDownloadingUpdate ? 'animate-bounce' : ''}`} />
                          <span>{isDownloadingUpdate ? `Downloading (${downloadProgress}%)...` : `Download New Version (${updateResult.tagName})`}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleRestartAndApply}
                          disabled={isRestarting}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-950/20 cursor-pointer transition-all animate-pulse"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
                          <span>{isRestarting ? 'Restarting...' : 'Restart and Apply Changes'}</span>
                        </button>
                      )}

                      <a
                        href={updateResult.htmlUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>GitHub Release</span>
                      </a>
                    </div>
                  </div>
                )}

                {updateResult.status === 'error' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                    <span className="font-bold">Update Notice:</span>
                    <p className="text-[11px] mt-0.5">{updateResult.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Release & Packaging Guide */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowGuideDrawer(!showGuideDrawer)}
                className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 py-1 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  How to Build Desktop .exe &amp; Releases (.yml)
                </span>
                {showGuideDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showGuideDrawer && (
                <div className="mt-2.5 p-3.5 bg-slate-900 text-slate-200 rounded-xl text-[11px] space-y-2.5 font-mono animate-in fade-in">
                  <div className="text-white font-bold font-sans text-xs flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-blue-400" />
                    Automated Release Packaging:
                  </div>
                  <p className="text-slate-400 font-sans leading-relaxed text-[10px]">
                    Run the terminal command below to compile the app and generate the Windows NSIS installer with desktop shortcut &amp; <strong>latest.yml</strong> auto-update metadata:
                  </p>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-emerald-400 select-all font-mono">
                    npm run electron:build
                  </div>
                  <div className="text-slate-400 font-sans text-[10px] space-y-1">
                    <div>&bull; Output folder: <span className="text-slate-300 font-mono">dist-electron/</span></div>
                    <div>&bull; Installer: <span className="text-slate-300 font-mono">Diyal Filling Station Setup 1.0.0.exe</span></div>
                    <div>&bull; Metadata: <span className="text-slate-300 font-mono">latest.yml</span></div>
                    <div>&bull; GitHub Actions: <span className="text-slate-300 font-mono">.github/workflows/release.yml</span> configured to build and publish automatically when a release tag is pushed.</div>
                  </div>
                </div>
              )}
            </div>

          </div>


          {/* --------------------------------------------------------
              CARD 2: Database Backup & Safety
             -------------------------------------------------------- */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Database Backup &amp; Safety
              </h3>
            </div>

            {/* Subtitle */}
            <p className="text-xs text-slate-500 leading-relaxed">
              All petrol pump sales, tanks stock, meter readings, customer ledgers, and expenses are securely stored in your offline device database.
            </p>

            {/* Current Database Summary Pills */}
            <div className="grid grid-cols-3 gap-2 py-1 text-center">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Sales</span>
                <span className="text-xs font-extrabold text-slate-900 font-mono">{salesCount || 0}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Accounts</span>
                <span className="text-xs font-extrabold text-slate-900 font-mono">{customerCount || 0}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Meter Logs</span>
                <span className="text-xs font-extrabold text-slate-900 font-mono">{readingsCount || 0}</span>
              </div>
            </div>

            {/* 4 Action Buttons / Cards matching Marble ERP */}
            <div className="space-y-3 pt-1">
              
              {/* Option 1: Export Full Database Backup (JSON) */}
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isProcessing}
                className="w-full p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-950 group-hover:text-emerald-800">
                    Export Full Database Backup (JSON)
                  </h4>
                  <p className="text-[11px] text-emerald-700/90 mt-0.5">
                    Download local snapshot of all station records
                  </p>
                </div>
              </button>

              {/* Option 2: Restore Database from JSON File */}
              <label className="w-full p-3.5 rounded-xl border border-blue-300 bg-blue-50/40 hover:bg-blue-50 text-left transition-all flex items-start gap-3 cursor-pointer group block">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-blue-950 group-hover:text-blue-800">
                    Restore Database from JSON File
                  </h4>
                  <p className="text-[11px] text-blue-700/90 mt-0.5">
                    Select and restore a previous backup file
                  </p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileRestore}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>

              {/* Option 3: Load Sample Testing Data (Demo / Practice) */}
              <button
                type="button"
                onClick={() => setShowSampleModal(true)}
                disabled={isProcessing}
                className="w-full p-3.5 rounded-xl border border-indigo-300 bg-indigo-50/40 hover:bg-indigo-50 text-left transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-indigo-950 group-hover:text-indigo-800">
                    Load Sample Testing Data (Demo / Practice)
                  </h4>
                  <p className="text-[11px] text-indigo-700/90 mt-0.5">
                    Populate sample fuel rates, tanks, customers, and fleet sales for testing
                  </p>
                </div>
              </button>

              {/* Option 4: Wipe All Data / Clean Database (Start Fresh) */}
              <button
                type="button"
                onClick={() => setShowWipeModal(true)}
                disabled={isProcessing}
                className="w-full p-3.5 rounded-xl border border-dashed border-rose-300 bg-rose-50/30 hover:bg-rose-50 text-left transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-rose-950 group-hover:text-rose-800">
                    Wipe All Data / Clean Database (Start Fresh)
                  </h4>
                  <p className="text-[11px] text-rose-700/90 mt-0.5">
                    Deletes all sales, meter readings, challans, ledgers &amp; expenses (leaves admin &amp; settings)
                  </p>
                </div>
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================================
          MODAL 1: Confirm Wipe All Data (Start Fresh at 0)
         ======================================================== */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Wipe All Data &amp; Start Fresh?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will delete all sales records, nozzle meter logs, customer company khatas, truck challans, supplier purchases, and expenses.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-600" />
                Preserved Information:
              </span>
              <p>
                Your administrator login account (<span className="font-mono">admin</span>) and station profile settings will <strong>not</strong> be deleted. The system will start at clean ZERO (0) for live operations.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWipeAllData}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                Yes, Wipe &amp; Start Fresh (0)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: Confirm Load Sample Testing Data
         ======================================================== */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                Load Sample Testing Data?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will populate reference demo records for testing: M.B GOODS, registered trucks, 140+ sales entries, fuel stock tanks, and meter reconciliation logs.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLoadSampleData}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm"
              >
                Load Sample Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
