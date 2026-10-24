import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Database, 
  Fuel, 
  Gauge, 
  AlertTriangle, 
  PlusCircle, 
  Edit3, 
  Download, 
  Printer, 
  SlidersHorizontal,
  CheckCircle2, 
  Calendar,
  X,
  FileSpreadsheet,
  Droplet,
  Trash2,
  Info,
  ChevronRight,
  Search,
  Sliders,
  ShieldCheck,
  Check
} from 'lucide-react';
import { formatNumber, formatCurrency, formatDateDisplay, exportToCSV } from '../utils/formatters';

export default function StockManagement() {
  const [activeTab, setActiveTab] = useState('tanks'); // 'tanks', 'sheet', 'nozzles'
  const [tankSearch, setTankSearch] = useState('');

  // Add Tank Modal State
  const [isAddTankModalOpen, setIsAddTankModalOpen] = useState(false);
  const [newTankName, setNewTankName] = useState('');
  const [newTankFuelType, setNewTankFuelType] = useState('Diesel');
  const [newTankCapacity, setNewTankCapacity] = useState('30000');
  const [newTankStock, setNewTankStock] = useState('15000');
  const [newTankDip, setNewTankDip] = useState('120.0');
  const [newTankThreshold, setNewTankThreshold] = useState('5000');
  const [addTankError, setAddTankError] = useState('');
  const [isAddingTank, setIsAddingTank] = useState(false);

  // Edit Tank Modal State
  const [isEditTankModalOpen, setIsEditTankModalOpen] = useState(false);
  const [editingTank, setEditingTank] = useState(null);
  const [editTankName, setEditTankName] = useState('');
  const [editTankFuelType, setEditTankFuelType] = useState('Diesel');
  const [editTankCapacity, setEditTankCapacity] = useState('');
  const [editTankThreshold, setEditTankThreshold] = useState('');
  const [editTankError, setEditTankError] = useState('');

  // Dip modal state
  const [selectedTank, setSelectedTank] = useState(null);
  const [dipCm, setDipCm] = useState('');
  const [dipLitres, setDipLitres] = useState('');
  const [isDipModalOpen, setIsDipModalOpen] = useState(false);

  // Manual Adjustment modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustTankId, setAdjustTankId] = useState('');
  const [adjustType, setAdjustType] = useState('Addition'); // 'Addition' or 'Deduction'
  const [adjustLitres, setAdjustLitres] = useState('');
  const [adjustReason, setAdjustReason] = useState('Physical Dip Reconciliation');
  const [adjustDate, setAdjustDate] = useState(new Date().toISOString().split('T')[0]);

  // Stock Sheet Filter State
  const [sheetFuel, setSheetFuel] = useState('All');
  const [sheetMonth, setSheetMonth] = useState('2026-10');

  // Queries
  const tanks = useLiveQuery(() => db.tanks.toArray(), []);
  const nozzles = useLiveQuery(() => db.nozzles.toArray(), []);
  const purchases = useLiveQuery(() => db.purchases.toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const adjustments = useLiveQuery(() => db.stockAdjustments?.toArray() || [], []);

  // --- ADD NEW TANK HANDLER ---
  const handleOpenAddTank = () => {
    setNewTankName('');
    setNewTankFuelType('Diesel');
    setNewTankCapacity('25000');
    setNewTankStock('15000');
    setNewTankDip('120.0');
    setNewTankThreshold('5000');
    setAddTankError('');
    setIsAddTankModalOpen(true);
  };

  const handleSaveNewTank = async (e) => {
    e.preventDefault();
    if (!newTankName.trim()) {
      setAddTankError('Please enter a descriptive tank name.');
      return;
    }

    const capacity = parseFloat(newTankCapacity) || 0;
    const stock = parseFloat(newTankStock) || 0;
    const dip = parseFloat(newTankDip) || 0;
    const threshold = parseFloat(newTankThreshold) || 5000;

    if (capacity <= 0) {
      setAddTankError('Tank capacity must be greater than 0 litres.');
      return;
    }
    if (stock > capacity) {
      setAddTankError('Initial stock cannot exceed total tank capacity.');
      return;
    }

    setIsAddingTank(true);
    setAddTankError('');

    try {
      const tankId = await db.tanks.add({
        tankName: newTankName.trim(),
        fuelType: newTankFuelType,
        capacityLitres: capacity,
        currentStockLitres: stock,
        currentDipCm: dip,
        minimumThresholdLitres: threshold,
        lastDipDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      // Optional audit trail
      if (db.auditLogs) {
        await db.auditLogs.add({
          date: new Date().toISOString().split('T')[0],
          entityType: 'Tank',
          entityId: tankId,
          action: 'Create',
          performedBy: 'admin',
          reason: 'Commissioned new storage tank',
          details: `Added ${newTankName.trim()} (${newTankFuelType}), Cap: ${capacity}L, Stock: ${stock}L`,
          createdAt: new Date().toISOString()
        });
      }

      setIsAddTankModalOpen(false);
    } catch (err) {
      setAddTankError(err.message || 'Failed to add new tank.');
    } finally {
      setIsAddingTank(false);
    }
  };

  // --- EDIT TANK HANDLER ---
  const handleOpenEditTank = (tank) => {
    setEditingTank(tank);
    setEditTankName(tank.tankName || '');
    setEditTankFuelType(tank.fuelType || 'Diesel');
    setEditTankCapacity(String(tank.capacityLitres || ''));
    setEditTankThreshold(String(tank.minimumThresholdLitres || tank.reorderLevelLitres || '5000'));
    setEditTankError('');
    setIsEditTankModalOpen(true);
  };

  const handleSaveEditTank = async (e) => {
    e.preventDefault();
    if (!editingTank) return;
    if (!editTankName.trim()) {
      setEditTankError('Tank name is required.');
      return;
    }

    const cap = parseFloat(editTankCapacity) || editingTank.capacityLitres;
    const thresh = parseFloat(editTankThreshold) || 5000;

    try {
      await db.tanks.update(editingTank.id, {
        tankName: editTankName.trim(),
        fuelType: editTankFuelType,
        capacityLitres: cap,
        minimumThresholdLitres: thresh
      });

      setIsEditTankModalOpen(false);
    } catch (err) {
      setEditTankError(err.message || 'Failed to update tank details.');
    }
  };

  // --- DELETE TANK HANDLER ---
  const handleDeleteTank = async (tank) => {
    const attachedNozzles = (nozzles || []).filter(n => n.tankId === tank.id);
    if (attachedNozzles.length > 0) {
      alert(`Cannot delete "${tank.tankName}" because ${attachedNozzles.length} dispenser nozzle(s) are linked to it. Please reassign nozzles first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${tank.tankName}"? This action cannot be undone.`)) {
      await db.tanks.delete(tank.id);
      if (db.auditLogs) {
        await db.auditLogs.add({
          date: new Date().toISOString().split('T')[0],
          entityType: 'Tank',
          entityId: tank.id,
          action: 'Delete',
          performedBy: 'admin',
          reason: 'Decommissioned storage tank',
          details: `Deleted ${tank.tankName} (${tank.fuelType})`,
          createdAt: new Date().toISOString()
        });
      }
    }
  };

  // --- DIP UPDATE HANDLERS ---
  const handleOpenDip = (tank) => {
    setSelectedTank(tank);
    setDipCm(String(tank.currentDipCm || ''));
    setDipLitres(String(tank.currentStockLitres || ''));
    setIsDipModalOpen(true);
  };

  const handleSaveDip = async (e) => {
    e.preventDefault();
    if (!selectedTank) return;

    const newStock = parseFloat(dipLitres) || 0;
    const oldStock = selectedTank.currentStockLitres || 0;
    const diff = newStock - oldStock;

    await db.tanks.update(selectedTank.id, {
      currentDipCm: parseFloat(dipCm) || 0,
      currentStockLitres: newStock,
      lastDipDate: new Date().toISOString().split('T')[0]
    });

    // Record adjustment audit if variance exists
    if (diff !== 0) {
      await db.stockAdjustments.add({
        tankId: selectedTank.id,
        fuelType: selectedTank.fuelType,
        date: new Date().toISOString().split('T')[0],
        type: diff > 0 ? 'Addition' : 'Deduction',
        litres: Math.abs(diff),
        reason: `Dip Calibration Adjustment (${diff > 0 ? '+' : ''}${diff}L)`,
        createdAt: new Date().toISOString()
      });
    }

    setIsDipModalOpen(false);
  };

  // --- MANUAL STOCK ADJUSTMENT HANDLER ---
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    const ltrs = parseFloat(adjustLitres) || 0;
    if (ltrs <= 0 || !adjustTankId) return;

    const tank = await db.tanks.get(Number(adjustTankId));
    if (!tank) return;

    const stockDelta = adjustType === 'Addition' ? ltrs : -ltrs;
    const updatedStock = Math.max(0, (tank.currentStockLitres || 0) + stockDelta);

    await db.tanks.update(tank.id, {
      currentStockLitres: updatedStock,
      lastDipDate: adjustDate
    });

    await db.stockAdjustments.add({
      tankId: tank.id,
      fuelType: tank.fuelType,
      date: adjustDate,
      type: adjustType,
      litres: ltrs,
      reason: adjustReason,
      createdAt: new Date().toISOString()
    });

    setIsAdjustModalOpen(false);
    setAdjustLitres('');
  };

  // Aggregate Date-wise Stock Sheet
  const stockSheetData = useMemo(() => {
    if (!sales || !purchases) return [];

    // Filter by selected month
    const monthSales = sales.filter(s => s.date.startsWith(sheetMonth));
    const monthPurchases = purchases.filter(p => p.date.startsWith(sheetMonth));
    const monthAdjustments = adjustments?.filter(a => a.date.startsWith(sheetMonth)) || [];

    // Unique dates
    const dateSet = new Set();
    monthSales.forEach(s => dateSet.add(s.date));
    monthPurchases.forEach(p => dateSet.add(p.date));
    monthAdjustments.forEach(a => dateSet.add(a.date));

    const sortedDates = Array.from(dateSet).sort();

    // Baseline opening stocks for the month
    const products = sheetFuel === 'All' ? ['Diesel', 'Petrol'] : [sheetFuel];
    const sheetRows = [];

    products.forEach(product => {
      let runningStock = product === 'Diesel' ? 25000 : 18000;

      sortedDates.forEach(date => {
        const dayPurchases = monthPurchases.filter(p => p.date === date && p.fuelType === product);
        const daySales = monthSales.filter(s => s.date === date && s.fuelType === product);
        const dayAdjs = monthAdjustments.filter(a => a.date === date && a.fuelType === product);

        const received = dayPurchases.reduce((acc, p) => acc + (p.litres || 0), 0);
        const sold = daySales.reduce((acc, s) => acc + (s.litres || 0), 0);
        const added = dayAdjs.filter(a => a.type === 'Addition').reduce((acc, a) => acc + (a.litres || 0), 0);
        const deducted = dayAdjs.filter(a => a.type === 'Deduction').reduce((acc, a) => acc + (a.litres || 0), 0);
        const netAdjustment = added - deducted;

        const opening = runningStock;
        const closing = opening + received - sold + netAdjustment;
        runningStock = closing;

        if (received > 0 || sold > 0 || netAdjustment !== 0) {
          sheetRows.push({
            date,
            fuelType: product,
            openingStock: opening,
            received,
            sold,
            adjustment: netAdjustment,
            closingStock: closing
          });
        }
      });
    });

    return sheetRows.sort((a, b) => b.date.localeCompare(a.date));
  }, [sales, purchases, adjustments, sheetMonth, sheetFuel]);

  // Totals for Stock Sheet
  const sheetTotals = useMemo(() => {
    let totalReceived = 0;
    let totalSold = 0;
    let totalAdjustment = 0;
    stockSheetData.forEach(row => {
      totalReceived += row.received || 0;
      totalSold += row.sold || 0;
      totalAdjustment += row.adjustment || 0;
    });
    return { totalReceived, totalSold, totalAdjustment };
  }, [stockSheetData]);

  const handleExportCSV = () => {
    if (!stockSheetData.length) return;
    const rows = stockSheetData.map(r => ({
      'Date': r.date,
      'Fuel Product': r.fuelType,
      'Opening Stock (Ltr)': r.openingStock,
      'Purchases Received (Ltr)': r.received,
      'Quantity Sold (Ltr)': r.sold,
      'Adjustments (Ltr)': r.adjustment,
      'Closing Stock (Ltr)': r.closingStock
    }));
    exportToCSV(`Fuel_Stock_Sheet_${sheetMonth}.csv`, rows);
  };

  // Filtered Tanks for Search
  const filteredTanks = useMemo(() => {
    if (!tanks) return [];
    if (!tankSearch.trim()) return tanks;
    const q = tankSearch.toLowerCase();
    return tanks.filter(t => 
      t.tankName?.toLowerCase().includes(q) || 
      t.fuelType?.toLowerCase().includes(q)
    );
  }, [tanks, tankSearch]);

  // Aggregate stock statistics
  const stockSummary = useMemo(() => {
    let totalStock = 0;
    let totalCapacity = 0;
    let dieselStock = 0;
    let dieselCapacity = 0;
    let petrolStock = 0;
    let petrolCapacity = 0;
    let lowStockCount = 0;

    (tanks || []).forEach(t => {
      const stock = t.currentStockLitres || 0;
      const capacity = t.capacityLitres || 0;
      const threshold = t.minimumThresholdLitres || t.reorderLevelLitres || 5000;

      totalStock += stock;
      totalCapacity += capacity;

      if (t.fuelType === 'Diesel' || t.fuelType === 'HSD') {
        dieselStock += stock;
        dieselCapacity += capacity;
      } else {
        petrolStock += stock;
        petrolCapacity += capacity;
      }

      if (stock <= threshold) {
        lowStockCount++;
      }
    });

    const overallPct = totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;
    const dieselPct = dieselCapacity > 0 ? Math.round((dieselStock / dieselCapacity) * 100) : 0;
    const petrolPct = petrolCapacity > 0 ? Math.round((petrolStock / petrolCapacity) * 100) : 0;

    return { 
      totalStock, 
      totalCapacity,
      dieselStock, 
      dieselCapacity,
      dieselPct,
      petrolStock, 
      petrolCapacity,
      petrolPct,
      lowStockCount, 
      tankCount: (tanks || []).length,
      overallPct
    };
  }, [tanks]);

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. HERO BANNER WITH ATTENDANT & CAR BACKGROUND (meter_background.jpg) */}
      <div 
        className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[160px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
        style={{
          backgroundImage: "url('/meter_background.jpg')"
        }}
      >
        {/* Soft gradient overlay on left for maximum text & icon contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 sm:px-8 py-7 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Fuel Squircle Icon + Title & Subtitle */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <Fuel className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Fuel Stock &amp; Underground Tanks
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
                Monitor storage tanks, daily dip calibrations, dispenser totalizers, and date-wise reconciliation.
              </p>
            </div>
          </div>

          {/* Right: Action Buttons (Add Tank & Stock Adjustment) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenAddTank}
              className="flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-full bg-[#C32026] hover:bg-[#a81a1f] active:bg-[#8f151a] text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/40 hover:shadow-red-900/50 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Add New Tank</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => {
                if (tanks && tanks.length > 0) setAdjustTankId(String(tanks[0].id));
                setIsAdjustModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/20 font-bold text-xs sm:text-sm backdrop-blur-xs shadow-md transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-white/90" />
              <span>Stock Adjustment</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 no-print">
        
        {/* Card 1: Total Underground Fuel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Underground Fuel
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
              {formatNumber(stockSummary.totalStock, 0)} L
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-blue-600 font-bold font-mono">
                {stockSummary.tankCount} Storage Tanks
              </span>
              <span className="text-slate-400">&bull; {stockSummary.overallPct}% Capacity</span>
            </div>
          </div>
        </div>

        {/* Card 2: Diesel (HSD) Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Droplet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Diesel (HSD) Stock
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
              {formatNumber(stockSummary.dieselStock, 0)} L
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-amber-600 font-bold font-mono">
                {stockSummary.dieselPct}% Full
              </span>
              <span className="text-slate-400">&bull; Heavy Transport</span>
            </div>
          </div>
        </div>

        {/* Card 3: Petrol (PMG) Stock */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Petrol (PMG) Stock
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
              {formatNumber(stockSummary.petrolStock, 0)} L
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-emerald-600 font-bold font-mono">
                {stockSummary.petrolPct}% Full
              </span>
              <span className="text-slate-400">&bull; Regular Motor Fuel</span>
            </div>
          </div>
        </div>

        {/* Card 4: Inventory Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center shrink-0 shadow-xs ${
            stockSummary.lowStockCount > 0 ? 'bg-rose-600' : 'bg-emerald-600'
          }`}>
            {stockSummary.lowStockCount > 0 ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Inventory Status
            </span>
            <div className={`text-xl sm:text-2xl font-black tracking-tight mt-0.5 truncate ${
              stockSummary.lowStockCount > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}>
              {stockSummary.lowStockCount > 0 ? `${stockSummary.lowStockCount} Tank Low` : 'Normal Safe Level'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className={`font-bold font-mono ${
                stockSummary.lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {stockSummary.lowStockCount > 0 ? 'Re-order required' : 'Calibrated Safe Dips'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SUB-MODULE TABS HEADER */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('tanks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tanks'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-blue-600" />
            <span>Tanks &amp; Dip Measurement</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {tanks?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Date-wise Stock Movement Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab('nozzles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'nozzles'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gauge className="w-4 h-4 text-amber-500" />
            <span>Dispenser Nozzles</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {nozzles?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: TANKS & FUEL STOCK */}
      {activeTab === 'tanks' && (
        <div className="space-y-5">
          
          {/* Search & Header Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={tankSearch}
                onChange={e => setTankSearch(e.target.value)}
                placeholder="Search storage tank by name, fuel type..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddTank}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Storage Tank</span>
              </button>
            </div>
          </div>

          {/* Underground Tanks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredTanks?.map(tank => {
              const capacity = tank.capacityLitres || 1;
              const stock = tank.currentStockLitres || 0;
              const pct = Math.min(100, Math.round((stock / capacity) * 100));
              const isDiesel = tank.fuelType === 'Diesel' || tank.fuelType === 'HSD';
              const ullage = Math.max(0, capacity - stock);
              const threshold = tank.minimumThresholdLitres || tank.reorderLevelLitres || 5000;
              const isLow = stock <= threshold;

              return (
                <div key={tank.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isDiesel ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {isDiesel ? <Droplet className="w-5 h-5" /> : <Fuel className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-slate-900">{tank.tankName}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDiesel
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {tank.fuelType}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          Tank ID: #{tank.id} &bull; Calibrated: {tank.lastDipDate ? formatDateDisplay(tank.lastDipDate) : 'Today'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Card Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditTank(tank)}
                        title="Edit Tank Details"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTank(tank)}
                        title="Delete Tank"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Metric Badges in Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-center font-mono">
                    <div className="p-1">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Current Stock</span>
                      <span className="text-base font-black text-slate-900">{formatNumber(stock, 0)} L</span>
                    </div>
                    <div className="p-1 border-l border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Capacity</span>
                      <span className="text-base font-semibold text-slate-700">{formatNumber(capacity, 0)} L</span>
                    </div>
                    <div className="p-1 border-t sm:border-t-0 sm:border-l border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Dip Depth</span>
                      <span className="text-base font-bold text-blue-700">{tank.currentDipCm} cm</span>
                    </div>
                    <div className="p-1 border-t sm:border-t-0 sm:border-l border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Empty Space</span>
                      <span className="text-base font-semibold text-slate-500">{formatNumber(ullage, 0)} L</span>
                    </div>
                  </div>

                  {/* Visual Fill Gauge with Percentage */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-sans font-medium">Storage Level:</span>
                        <span className="font-bold text-slate-900">{pct}% Full</span>
                        {isLow && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 font-sans">
                            Low Stock Alert
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-sans text-[11px]">
                        Reserve Min: {formatNumber(threshold, 0)} L
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          isDiesel 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-600' 
                            : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <div className="text-[11px] text-slate-400">
                      {(nozzles || []).filter(n => n.tankId === tank.id).length} Dispenser Nozzles Connected
                    </div>
                    <button
                      onClick={() => handleOpenDip(tank)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update Dip / Stock</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Dispenser Nozzles Preview inside Tab 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Dispenser Nozzle Totalizer Meters</h3>
                <p className="text-xs text-slate-500">Monitor opening meters, current electronic meters, and testing litres</p>
              </div>
              <button
                onClick={() => setActiveTab('nozzles')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <span>View Full Nozzle Registry</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-2.5 px-4">Nozzle ID</th>
                    <th className="py-2.5 px-4">Dispenser Bay</th>
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4 text-right">Opening Meter</th>
                    <th className="py-2.5 px-4 text-right">Current Meter</th>
                    <th className="py-2.5 px-4 text-right">Testing (Ltr)</th>
                    <th className="py-2.5 px-4 text-right">Total Dispensed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nozzles?.map(n => {
                    const dispensed = Math.max(0, (n.currentMeter || 0) - (n.openingMeter || 0) - (n.testingLitres || 0));

                    return (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">#{n.id}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">{n.nozzleName}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            n.fuelType === 'Diesel'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {n.fuelType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600">{formatNumber(n.openingMeter, 1)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatNumber(n.currentMeter, 1)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500">{n.testingLitres || 0} L</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700">{formatNumber(dispensed, 1)} L</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: DATE-WISE STOCK SHEET */}
      {activeTab === 'sheet' && (
        <div className="space-y-4">
          
          {/* Sheet Filter Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Filter Month</label>
                <input
                  type="month"
                  value={sheetMonth}
                  onChange={e => setSheetMonth(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Product</label>
                <select
                  value={sheetFuel}
                  onChange={e => setSheetFuel(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  <option value="All">All Products (Diesel &amp; Petrol)</option>
                  <option value="Diesel">Diesel (HSD)</option>
                  <option value="Petrol">Petrol (PMG)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Stock Sheet</span>
              </button>
            </div>
          </div>

          {/* Month Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-center font-mono">
            <div className="p-2">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Total Purchases Received</span>
              <span className="text-base font-black text-emerald-700">+{formatNumber(sheetTotals.totalReceived, 0)} L</span>
            </div>
            <div className="p-2 border-l border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Total Quantity Sold</span>
              <span className="text-base font-black text-slate-900">&minus;{formatNumber(sheetTotals.totalSold, 0)} L</span>
            </div>
            <div className="p-2 border-l border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Net Dip Adjustments</span>
              <span className={`text-base font-black ${sheetTotals.totalAdjustment >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                {sheetTotals.totalAdjustment > 0 ? `+${formatNumber(sheetTotals.totalAdjustment, 0)}` : formatNumber(sheetTotals.totalAdjustment, 0)} L
              </span>
            </div>
            <div className="p-2 border-l border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block font-sans font-semibold">Current Physical Stock</span>
              <span className="text-base font-black text-blue-700">{formatNumber(stockSummary.totalStock, 0)} L</span>
            </div>
          </div>

          {/* Stock Sheet Table */}
          <div className="print-area bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80">
              <h3 className="text-sm font-bold text-slate-900">Date-wise Fuel Stock Sheet ({sheetMonth})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Fuel Product</th>
                    <th className="py-2.5 px-4 text-right">Opening Stock</th>
                    <th className="py-2.5 px-4 text-right">Received (Purchases)</th>
                    <th className="py-2.5 px-4 text-right">Sold (Sales)</th>
                    <th className="py-2.5 px-4 text-right">Adjustments</th>
                    <th className="py-2.5 px-4 text-right">Closing Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockSheetData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        No stock records available for selected month.
                      </td>
                    </tr>
                  ) : (
                    stockSheetData.map((row, idx) => (
                      <tr key={`${row.date}-${row.fuelType}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{formatDateDisplay(row.date)}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.fuelType === 'Diesel'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {row.fuelType}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-700">{formatNumber(row.openingStock, 0)} L</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                          {row.received > 0 ? `+${formatNumber(row.received, 0)}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {row.sold > 0 ? `-${formatNumber(row.sold, 0)}` : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                          {row.adjustment !== 0 ? (row.adjustment > 0 ? `+${row.adjustment}` : row.adjustment) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-extrabold text-blue-700 bg-blue-50/30">
                          {formatNumber(row.closingStock, 0)} L
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: DISPENSER NOZZLES FULL REGISTRY */}
      {activeTab === 'nozzles' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Dispenser Nozzles &amp; Mechanical/Electronic Totalizers</h3>
                <p className="text-xs text-slate-500">Each dispenser nozzle is physically piped to an underground storage tank</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nozzle ID</th>
                    <th className="py-3 px-4">Nozzle Name &amp; Island Bay</th>
                    <th className="py-3 px-4">Connected Storage Tank</th>
                    <th className="py-3 px-4">Fuel Product</th>
                    <th className="py-3 px-4 text-right">Opening Meter</th>
                    <th className="py-3 px-4 text-right">Current Meter</th>
                    <th className="py-3 px-4 text-right">Testing (Ltr)</th>
                    <th className="py-3 px-4 text-right">Total Dispensed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nozzles?.map(n => {
                    const linkedTank = tanks?.find(t => t.id === n.tankId);
                    const dispensed = Math.max(0, (n.currentMeter || 0) - (n.openingMeter || 0) - (n.testingLitres || 0));

                    return (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">#{n.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{n.nozzleName}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {linkedTank ? linkedTank.tankName : `Tank #${n.tankId}`}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            n.fuelType === 'Diesel'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {n.fuelType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{formatNumber(n.openingMeter, 1)}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatNumber(n.currentMeter, 1)}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">{n.testingLitres || 0} L</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-blue-700">{formatNumber(dispensed, 1)} L</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW TANK (wo koi new tank module add bi kr skty ho gy)      */}
      {/* ========================================================================= */}
      {isAddTankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Add New Storage Tank</h3>
                  <p className="text-xs text-slate-500">Commission a new underground fuel tank to station inventory</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddTankModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addTankError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addTankError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewTank} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tank Name &amp; Description *
                </label>
                <input
                  type="text"
                  value={newTankName}
                  onChange={e => setNewTankName(e.target.value)}
                  placeholder="e.g. Tank 3 - High Speed Diesel (HSD)"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fuel Product *
                  </label>
                  <select
                    value={newTankFuelType}
                    onChange={e => setNewTankFuelType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Diesel">High Speed Diesel (HSD)</option>
                    <option value="Petrol">Super Motor Gasoline (PMG)</option>
                    <option value="Mobil Oil">Mobil / Engine Oil</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Storage Capacity (Litres) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1000"
                    value={newTankCapacity}
                    onChange={e => setNewTankCapacity(e.target.value)}
                    placeholder="e.g. 35000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Initial Physical Stock (Litres)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={newTankStock}
                    onChange={e => setNewTankStock(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Initial Dip Level (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newTankDip}
                    onChange={e => setNewTankDip(e.target.value)}
                    placeholder="e.g. 120.0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Low Stock Alert Threshold (Litres)
                </label>
                <input
                  type="number"
                  step="100"
                  min="500"
                  value={newTankThreshold}
                  onChange={e => setNewTankThreshold(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Triggers low inventory warnings when remaining stock falls below this quantity.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddTankModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingTank}
                  className="px-6 py-2.5 bg-[#C32026] hover:bg-[#a81a1f] text-white font-bold rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-50"
                >
                  {isAddingTank ? 'Commissioning...' : 'Add Storage Tank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT TANK DETAILS                                               */}
      {/* ========================================================================= */}
      {isEditTankModalOpen && editingTank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Edit Tank Details</h3>
                  <p className="text-xs text-slate-500">Update configuration for Tank #{editingTank.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditTankModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editTankError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editTankError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditTank} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tank Name *</label>
                <input
                  type="text"
                  value={editTankName}
                  onChange={e => setEditTankName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={editTankFuelType}
                    onChange={e => setEditTankFuelType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Diesel">Diesel (HSD)</option>
                    <option value="Petrol">Petrol (PMG)</option>
                    <option value="Mobil Oil">Mobil Oil</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Capacity (Litres)</label>
                  <input
                    type="number"
                    value={editTankCapacity}
                    onChange={e => setEditTankCapacity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Low Stock Alert Threshold (Litres)</label>
                <input
                  type="number"
                  value={editTankThreshold}
                  onChange={e => setEditTankThreshold(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditTankModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UPDATE DIP / CALIBRATION                                         */}
      {/* ========================================================================= */}
      {isDipModalOpen && selectedTank && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Update Dip: {selectedTank.tankName}</h3>
                  <p className="text-xs text-slate-500 font-mono">Product: {selectedTank.fuelType} &bull; Capacity: {formatNumber(selectedTank.capacityLitres, 0)} L</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDipModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDip} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Dip Measurement (cm) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={dipCm}
                  onChange={e => setDipCm(e.target.value)}
                  placeholder="e.g. 142.5"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Calibrated Fuel Quantity (Litres) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={dipLitres}
                  onChange={e => setDipLitres(e.target.value)}
                  placeholder="e.g. 21450"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Live Variance Calculation Note */}
              {(() => {
                const diff = (parseFloat(dipLitres) || 0) - (selectedTank.currentStockLitres || 0);
                if (diff === 0 || isNaN(diff)) return null;
                return (
                  <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    diff > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <Info className="w-4 h-4 shrink-0" />
                    <span>
                      Variance: <strong>{diff > 0 ? `+${diff}` : diff} Litres</strong>. An audit adjustment will be automatically created in the stock register.
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDipModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Save Dip &amp; Calibrate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: MANUAL STOCK ADJUSTMENT                                          */}
      {/* ========================================================================= */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C32026] border border-red-200 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Manual Stock Adjustment</h3>
                  <p className="text-xs text-slate-500">Record physical reconciliation, evaporation, or testing loss</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdjustModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Storage Tank *</label>
                <select
                  value={adjustTankId}
                  onChange={e => setAdjustTankId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  {tanks?.map(t => (
                    <option key={t.id} value={t.id}>{t.tankName} ({t.fuelType})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={e => setAdjustType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Addition">Stock Addition (+)</option>
                    <option value="Deduction">Stock Deduction (&minus;)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity (Litres) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={adjustLitres}
                    onChange={e => setAdjustLitres(e.target.value)}
                    placeholder="e.g. 150"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Reason *</label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Physical Dip Reconciliation">Physical Dip Reconciliation</option>
                  <option value="Temperature & Evaporation Loss">Temperature &amp; Evaporation Loss</option>
                  <option value="Calibration & Testing Litres">Calibration &amp; Testing Litres</option>
                  <option value="Operator Entry Correction">Operator Entry Correction</option>
                  <option value="Leakage / Maintenance Test">Leakage / Maintenance Test</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  value={adjustDate}
                  onChange={e => setAdjustDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C32026] hover:bg-[#a81a1f] text-white font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Apply Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
