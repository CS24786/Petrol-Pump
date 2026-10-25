import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Gauge, 
  Fuel, 
  PlusCircle, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  ArrowRight,
  ShieldAlert,
  Info,
  X,
  Droplet,
  Wallet,
  Users,
  ChevronDown,
  ChevronRight,
  Eye
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';
import Pagination from '../components/Pagination';

export default function MeterReadings({ onNavigate, onOpenQuickSale, onOpenReceipt }) {
  const [selectedDate, setSelectedDate] = useState('2026-10-02');
  const [filterFuel, setFilterFuel] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);

  // Form State
  const [formDate, setFormDate] = useState(selectedDate);
  const [formNozzleId, setFormNozzleId] = useState('');
  const [formOpening, setFormOpening] = useState('');
  const [formClosing, setFormClosing] = useState('');
  const [formTesting, setFormTesting] = useState('0');
  const [formRate, setFormRate] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formAuditReason, setFormAuditReason] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const nozzles = useLiveQuery(() => db.nozzles.toArray(), []);
  const meterReadings = useLiveQuery(() => db.meterReadings.orderBy('date').reverse().toArray(), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const fuelRates = useLiveQuery(() => db.fuelRates.toArray(), []);

  // When opening modal, initialize nozzle & carry forward previous closing reading
  useEffect(() => {
    if (nozzles && nozzles.length > 0 && !formNozzleId) {
      setFormNozzleId(String(nozzles[0].id));
    }
  }, [nozzles, formNozzleId]);

  // Selected nozzle object
  const activeNozzle = useMemo(() => {
    if (!nozzles || !formNozzleId) return null;
    return nozzles.find(n => n.id === Number(formNozzleId));
  }, [nozzles, formNozzleId]);

  // Auto-populate opening reading and current fuel rate when nozzle or date changes
  useEffect(() => {
    if (!activeNozzle) return;

    // Look up previous closing reading for this nozzle
    const prevReadings = meterReadings
      ?.filter(r => r.nozzleId === activeNozzle.id && r.date < formDate)
      ?.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (prevReadings && prevReadings.length > 0) {
      setFormOpening(String(prevReadings[0].closingMeter));
    } else {
      setFormOpening(String(activeNozzle.openingMeter || activeNozzle.currentMeter || 0));
    }

    // Default rate from fuel rates table
    const matchedRate = fuelRates?.find(r => r.fuelType?.toLowerCase() === activeNozzle.fuelType?.toLowerCase());
    if (matchedRate) {
      setFormRate(String(matchedRate.rate));
    } else {
      setFormRate(activeNozzle.fuelType === 'Petrol' ? '400.66' : '397.45');
    }
  }, [activeNozzle, formDate, meterReadings, fuelRates]);

  // Form calculations
  const openingNum = parseFloat(formOpening) || 0;
  const closingNum = parseFloat(formClosing) || 0;
  const testingNum = parseFloat(formTesting) || 0;
  const rateNum = parseFloat(formRate) || 0;
  const calculatedLitres = Math.max(0, closingNum - openingNum - testingNum);
  const calculatedSalesAmt = Math.round(calculatedLitres * rateNum);


  // Filtered readings for selected date/fuel/search
  const filteredReadings = useMemo(() => {
    if (!meterReadings) return [];
    return meterReadings.filter(r => {
      if (selectedDate && r.date !== selectedDate) return false;
      if (filterFuel !== 'All' && r.fuelType !== filterFuel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNozzle = r.nozzleName?.toLowerCase().includes(q);
        const matchFuel = r.fuelType?.toLowerCase().includes(q);
        const matchRemarks = r.remarks?.toLowerCase().includes(q);
        const matchMeters = String(r.openingMeter).includes(q) || String(r.closingMeter).includes(q);
        if (!matchNozzle && !matchFuel && !matchRemarks && !matchMeters) return false;
      }
      return true;
    });
  }, [meterReadings, selectedDate, filterFuel, searchQuery]);

  // Backward compatibility alias for CSV/reports
  const dateReadings = filteredReadings;

  // Counts for Sub-Tabs
  const nozzleCounts = useMemo(() => {
    const forDate = meterReadings?.filter(r => !selectedDate || r.date === selectedDate) || [];
    return {
      all: forDate.length,
      diesel: forDate.filter(r => r.fuelType === 'Diesel').length,
      petrol: forDate.filter(r => r.fuelType === 'Petrol').length,
    };
  }, [meterReadings, selectedDate]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredReadings.length / pageSize));
  const paginatedReadings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReadings.slice(start, start + pageSize);
  }, [filteredReadings, currentPage, pageSize]);

  // All sales for selected date
  const dateSales = useMemo(() => {
    if (!sales || !selectedDate) return [];
    return sales.filter(s => s.date === selectedDate);
  }, [sales, selectedDate]);

  // RECONCILIATION CALCULATIONS for the selected date
  const reconciliation = useMemo(() => {
    // 1. Meter Totals
    let dieselMeterLitres = 0;
    let dieselMeterSales = 0;
    let petrolMeterLitres = 0;
    let petrolMeterSales = 0;

    const allForDate = meterReadings?.filter(r => r.date === selectedDate) || [];
    allForDate.forEach(r => {
      if (r.fuelType === 'Diesel') {
        dieselMeterLitres += (r.litresSold || 0);
        dieselMeterSales += (r.salesAmount || 0);
      } else if (r.fuelType === 'Petrol') {
        petrolMeterLitres += (r.litresSold || 0);
        petrolMeterSales += (r.salesAmount || 0);
      }
    });

    // 2. Company Truck Challans Totals (non-retail sales)
    let dieselTruckLitres = 0;
    let dieselTruckAmount = 0;
    let petrolTruckLitres = 0;
    let petrolTruckAmount = 0;

    dateSales.forEach(s => {
      if (!s.isRetail) {
        if (s.fuelType === 'Diesel') {
          dieselTruckLitres += (s.litres || 0);
          dieselTruckAmount += (s.dieselAmount || 0);
        } else if (s.fuelType === 'Petrol') {
          petrolTruckLitres += (s.litres || 0);
          petrolTruckAmount += (s.dieselAmount || 0);
        }
      }
    });

    // 3. Unrecorded Retail Sales (Meter - Truck)
    const dieselRetailLitres = Math.max(0, dieselMeterLitres - dieselTruckLitres);
    const dieselAvgRate = dieselMeterLitres > 0 ? (dieselMeterSales / dieselMeterLitres) : 397.45;
    const dieselRetailAmount = Math.round(dieselRetailLitres * dieselAvgRate);

    const petrolRetailLitres = Math.max(0, petrolMeterLitres - petrolTruckLitres);
    const petrolAvgRate = petrolMeterLitres > 0 ? (petrolMeterSales / petrolMeterLitres) : 400.66;
    const petrolRetailAmount = Math.round(petrolRetailLitres * petrolAvgRate);

    // 4. Discrepancy checks (if truck sales exceed meter reading)
    const dieselDiscrepancy = dieselTruckLitres > dieselMeterLitres ? (dieselTruckLitres - dieselMeterLitres) : 0;
    const petrolDiscrepancy = petrolTruckLitres > petrolMeterLitres ? (petrolTruckLitres - petrolMeterLitres) : 0;

    return {
      dieselMeterLitres,
      dieselMeterSales,
      petrolMeterLitres,
      petrolMeterSales,
      dieselTruckLitres,
      dieselTruckAmount,
      petrolTruckLitres,
      petrolTruckAmount,
      dieselRetailLitres,
      dieselRetailAmount,
      petrolRetailLitres,
      petrolRetailAmount,
      dieselDiscrepancy,
      petrolDiscrepancy,
      hasDiscrepancy: dieselDiscrepancy > 0 || petrolDiscrepancy > 0
    };
  }, [meterReadings, dateSales, selectedDate]);

  // Open Edit Modal
  const handleStartEdit = (reading) => {
    setEditingReading(reading);
    setFormDate(reading.date);
    setFormNozzleId(String(reading.nozzleId));
    setFormOpening(String(reading.openingMeter));
    setFormClosing(String(reading.closingMeter));
    setFormTesting(String(reading.testingLitres || 0));
    setFormRate(String(reading.rate));
    setFormRemarks(reading.remarks || '');
    setFormAuditReason('');
    setFormError('');
    setIsRecordModalOpen(true);
  };

  // Open Add Modal
  const handleStartAdd = () => {
    setEditingReading(null);
    setFormDate(selectedDate);
    setFormRemarks('');
    setFormAuditReason('');
    setFormClosing('');
    setFormTesting('0');
    setFormError('');
    setIsRecordModalOpen(true);
  };

  // Save Meter Reading
  const handleSaveReading = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formNozzleId || !activeNozzle) {
      setFormError('Please select a dispenser nozzle. If no nozzles exist, please add one in Fuel Stock & Tanks first.');
      return;
    }

    if (closingNum < openingNum) {
      setFormError('Closing meter reading cannot be less than opening reading.');
      return;
    }

    if (calculatedLitres <= 0) {
      setFormError('Litres sold must be greater than zero.');
      return;
    }

    if (editingReading && !formAuditReason.trim()) {
      setFormError('Please enter an authorized reason for correcting this reading.');
      return;
    }

    // Check duplicate reading for same nozzle and date if not editing
    if (!editingReading) {
      const duplicate = meterReadings?.find(
        r => r.date === formDate && r.nozzleId === Number(formNozzleId)
      );
      if (duplicate) {
        setFormError(`A meter reading already exists for ${activeNozzle?.nozzleName} on ${formDate}. Edit the existing reading instead.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const readingRecord = {
        date: formDate,
        nozzleId: Number(formNozzleId),
        nozzleName: activeNozzle?.nozzleName || `Nozzle ${formNozzleId}`,
        fuelType: activeNozzle?.fuelType || 'Diesel',
        openingMeter: openingNum,
        closingMeter: closingNum,
        testingLitres: testingNum,
        litresSold: calculatedLitres,
        rate: rateNum,
        salesAmount: calculatedSalesAmt,
        remarks: formRemarks.trim(),
        createdAt: editingReading ? editingReading.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingReading) {
        await db.meterReadings.update(editingReading.id, readingRecord);
        // Log to audit trail
        await db.auditLogs?.add({
          date: new Date().toISOString().split('T')[0],
          entityType: 'MeterReading',
          entityId: editingReading.id,
          action: 'Correction',
          performedBy: 'admin',
          reason: formAuditReason.trim(),
          details: `Changed reading for ${readingRecord.nozzleName}: Opening ${openingNum}, Closing ${closingNum}, Litres ${calculatedLitres}`,
          createdAt: new Date().toISOString()
        });
      } else {
        const id = await db.meterReadings.add(readingRecord);
        // Also update nozzle current meter reading
        await db.nozzles.update(Number(formNozzleId), {
          currentMeter: closingNum
        });
      }

      setIsRecordModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Error saving meter reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Meter Reading
  const handleDeleteReading = async (id) => {
    if (window.confirm('Are you sure you want to delete this meter reading? This will affect reconciliation.')) {
      await db.meterReadings.delete(id);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredReadings.length) return;
    const rows = filteredReadings.map(r => ({
      'Date': formatDateDisplay(r.date),
      'Nozzle / Dispenser': r.nozzleName,
      'Fuel Type': r.fuelType,
      'Opening Meter': r.openingMeter,
      'Closing Meter': r.closingMeter,
      'Testing (L)': r.testingLitres || 0,
      'Litres Sold': r.litresSold,
      'Rate (PKR)': r.rate,
      'Sales Amount (PKR)': r.salesAmount,
      'Remarks': r.remarks || ''
    }));
    exportToCSV(`meter_readings_${selectedDate || 'all'}.csv`, rows);
  };

  return (
    <div className="space-y-5">
      
      {/* 1. HERO BANNER WITH ATTENDANT & CAR BACKGROUND */}
      <div 
        className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[160px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
        style={{
          backgroundImage: "url('./meter_background.jpg')"
        }}
      >
        {/* Soft gradient overlay on left for maximum text & icon contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/50 to-transparent pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 sm:px-8 py-7 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Gauge Icon + Title & Subtitle */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <Gauge className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Meter &amp; Daily Sales
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
                Track fuel sales, meter readings and manage daily operations in real-time.
              </p>
            </div>
          </div>

          {/* Right: Record Meter Reading Button */}
          <div className="shrink-0">
            <button
              onClick={handleStartAdd}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-950/40 hover:shadow-blue-900/50 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Record Meter Reading</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR TOP KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 no-print">
        
        {/* Card 1: Total Meter Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Meter Sales
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
              {formatCurrency(reconciliation.dieselMeterSales + reconciliation.petrolMeterSales)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-blue-600 font-bold font-mono">
                {formatNumber(reconciliation.dieselMeterLitres + reconciliation.petrolMeterLitres, 1)} L
              </span>
              <span className="text-slate-400">Total dispensed</span>
            </div>
          </div>
        </div>

        {/* Card 2: Diesel (HSD) Meter */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Droplet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Diesel (HSD) Meter
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
              {formatNumber(reconciliation.dieselMeterLitres, 1)} L
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-emerald-600 font-bold font-mono">
                {formatCurrency(reconciliation.dieselMeterSales)}
              </span>
              <span className="text-slate-400">Dispensed</span>
            </div>
          </div>
        </div>

        {/* Card 3: Petrol (PMG) Meter */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Droplet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Petrol (PMG) Meter
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
              {formatNumber(reconciliation.petrolMeterLitres, 1)} L
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-amber-500 font-bold font-mono">
                {formatCurrency(reconciliation.petrolMeterSales)}
              </span>
              <span className="text-slate-400">Dispensed</span>
            </div>
          </div>
        </div>

        {/* Card 4: Retail Walk-in (Diff) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Retail Walk-in (Diff)
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate">
              {formatCurrency(reconciliation.dieselRetailAmount + reconciliation.petrolRetailAmount)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-purple-600 font-bold font-mono">
                {formatNumber(reconciliation.dieselRetailLitres + reconciliation.petrolRetailLitres, 1)} L
              </span>
              <span className="text-slate-400">Reconciled cash</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SEARCH & FILTER CONTROLS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 no-print">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search nozzle name, meter #, operator, remarks..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker Input */}
          <div className="relative shrink-0 flex items-center">
            <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer font-mono"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                title="Clear date filter (Show all dates)"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Fuel Type Dropdown */}
          <div className="relative shrink-0">
            <Fuel className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterFuel}
              onChange={e => {
                setFilterFuel(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              <option value="All">Fuel Type: All</option>
              <option value="Diesel">Diesel (HSD)</option>
              <option value="Petrol">Petrol (PMG)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Action Buttons: Export CSV & Print Report */}
          <button
            onClick={handleExportCSV}
            disabled={filteredReadings.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            disabled={filteredReadings.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>

      </div>

      {/* 4. METER READINGS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200/80 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Date</th>
                <th className="py-3.5 px-4 font-semibold">Nozzle / Dispenser</th>
                <th className="py-3.5 px-4 font-semibold">Fuel Type</th>
                <th className="py-3.5 px-4 text-right font-semibold">Opening Meter</th>
                <th className="py-3.5 px-4 text-right font-semibold">Closing Meter</th>
                <th className="py-3.5 px-4 text-right font-semibold">Testing (L)</th>
                <th className="py-3.5 px-4 text-right font-semibold">Litres Sold</th>
                <th className="py-3.5 px-4 text-right font-semibold">Rate (PKR)</th>
                <th className="py-3.5 px-4 text-right font-semibold">Sales Amount</th>
                <th className="py-3.5 px-4 font-semibold">Remarks</th>
                <th className="py-3.5 px-4 text-center no-print font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedReadings.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-12 text-center text-slate-400">
                    <Gauge className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No meter readings found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      No records match the current filters. Click "Record Meter Reading" above to log a new reading.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedReadings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                      {formatDateDisplay(reading.date)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {reading.nozzleName}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        reading.fuelType === 'Petrol'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                      }`}>
                        {reading.fuelType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      {formatNumber(reading.openingMeter, 1)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatNumber(reading.closingMeter, 1)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500 whitespace-nowrap">
                      {reading.testingLitres ? `${formatNumber(reading.testingLitres, 1)} L` : '0.0 L'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600 text-xs sm:text-sm whitespace-nowrap">
                      {formatNumber(reading.litresSold, 2)} L
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                      Rs {formatNumber(reading.rate, 2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(reading.salesAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs max-w-xs truncate">
                      {reading.remarks || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center no-print whitespace-nowrap">
                      <button
                        onClick={() => handleStartEdit(reading)}
                        title="View / Edit Reading"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-xs border border-blue-200/60 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Record Count & Pagination */}
        <Pagination 
          currentPage={currentPage}
          totalItems={filteredReadings.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
        />

      </div>

      {/* RECORD / EDIT METER READING MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col my-auto">
            
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingReading ? 'Correct Meter Reading (With Audit Trail)' : 'Record Daily Meter Reading'}
                </h3>
              </div>
              <button 
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReading} className="p-5 space-y-4">
              
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reading Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nozzle / Meter
                  </label>
                  <select
                    value={formNozzleId}
                    onChange={(e) => setFormNozzleId(e.target.value)}
                    disabled={Boolean(editingReading)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {(!nozzles || nozzles.length === 0) ? (
                      <option value="">No nozzles configured - Add in Fuel Stock &amp; Tanks</option>
                    ) : (
                      nozzles.map(n => (
                        <option key={n.id} value={n.id}>
                          {n.nozzleName} ({n.fuelType})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Meter Readings Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Opening Meter Reading
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formOpening}
                    onChange={(e) => setFormOpening(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Carried forward from previous close</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Closing Meter Reading *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formClosing}
                    onChange={(e) => setFormClosing(e.target.value)}
                    placeholder="Enter closing meter"
                    required
                    autoFocus
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-black text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Must be &ge; Opening</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Testing / Calibration (Litres)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formTesting}
                    onChange={(e) => setFormTesting(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Pumped back to tank</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Selling Rate (PKR/Ltr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Calculated Summary Box */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-blue-600 block text-[11px]">Calculated Litres Sold:</span>
                  <span className="font-extrabold text-blue-950 text-base">{formatNumber(calculatedLitres, 2)} Ltr</span>
                </div>
                <div className="text-right">
                  <span className="text-blue-600 block text-[11px]">Calculated Sales Amount:</span>
                  <span className="font-extrabold text-emerald-800 text-base">{formatCurrency(calculatedSalesAmt)}</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shift Remarks / Notes
                </label>
                <input
                  type="text"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="e.g. Normal 24hr dispense, calibration check completed"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Required Audit Reason for edits */}
              {editingReading && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl">
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Reason for Correction (Required for Audit Trail) *</span>
                  </label>
                  <input
                    type="text"
                    value={formAuditReason}
                    onChange={(e) => setFormAuditReason(e.target.value)}
                    placeholder="e.g. Corrected typo in closing meter after supervisor verification"
                    required
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs text-slate-900 focus:outline-none"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-2.5">
                {editingReading ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this meter reading? This will affect reconciliation.')) {
                        handleDeleteReading(editingReading.id);
                        setIsRecordModalOpen(false);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Reading</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingReading ? 'Save Correction' : 'Save Meter Reading'}
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
