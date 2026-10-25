import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Building2, 
  Truck, 
  PlusCircle, 
  CreditCard, 
  Download, 
  Printer, 
  Search, 
  Phone, 
  MapPin, 
  Fuel, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  X, 
  ChevronRight, 
  Eye, 
  Droplet, 
  ArrowDownLeft, 
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';
import { exportReportToPDF } from '../utils/pdfExport';
import Pagination from '../components/Pagination';

export default function SuppliersPurchasesHub({ defaultTab = 'purchases' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'purchases', 'suppliers', 'payments'
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('All');
  const [filterFuel, setFilterFuel] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Pagination states
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [purchasesPageSize, setPurchasesPageSize] = useState(15);

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isEditPurchaseModalOpen, setIsEditPurchaseModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // Print Modals
  const [selectedPurchaseForPrint, setSelectedPurchaseForPrint] = useState(null);
  const [isPurchasesPrintModalOpen, setIsPurchasesPrintModalOpen] = useState(false);
  const [isStatementPrintModalOpen, setIsStatementPrintModalOpen] = useState(false);

  // New Purchase Form State
  const [supplierId, setSupplierId] = useState('');
  const [tankId, setTankId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [fuelType, setFuelType] = useState('Diesel');
  const [litres, setLitres] = useState('');
  const [rate, setRate] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [lorryNo, setLorryNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Purchase Form State
  const [editSupplierId, setEditSupplierId] = useState('');
  const [editTankId, setEditTankId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editInvoiceNo, setEditInvoiceNo] = useState('');
  const [editFuelType, setEditFuelType] = useState('Diesel');
  const [editLitres, setEditLitres] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('0');
  const [editLorryNo, setEditLorryNo] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Supplier Form State (Add / Edit)
  const [suppName, setSuppName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppAddress, setSuppAddress] = useState('');
  const [suppOpeningBalance, setSuppOpeningBalance] = useState('0');
  const [suppNotes, setSuppNotes] = useState('');

  // Payment Form State (Add / Edit)
  const [paySupplierId, setPaySupplierId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Queries
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const purchases = useLiveQuery(() => db.purchases.orderBy('id').reverse().toArray(), []);
  const supplierPayments = useLiveQuery(() => db.supplierPayments?.orderBy('id').reverse().toArray() || [], []);
  const tanks = useLiveQuery(() => db.tanks.toArray(), []);
  const settingsList = useLiveQuery(() => db.settings.toArray(), []);

  const pumpName = settingsList?.find(s => s.key === 'pumpName')?.value || 'DIYAL FILLING STATION';
  const pumpAddress = settingsList?.find(s => s.key === 'pumpAddress')?.value || 'Chiniot Road, Chak Jhumra, FSD.';
  const pumpPhone = settingsList?.find(s => s.key === 'pumpPhone')?.value || '+92 300 7654321 | +92 321 9876543';

  // Initialize form defaults
  useEffect(() => {
    if (suppliers && suppliers.length > 0) {
      if (!supplierId) setSupplierId(String(suppliers[0].id));
      if (!selectedSupplierId) setSelectedSupplierId(String(suppliers[0].id));
      if (!paySupplierId) setPaySupplierId(String(suppliers[0].id));
    }
    if (tanks && tanks.length > 0 && !tankId) {
      const defaultTank = tanks.find(t => t.fuelType === fuelType) || tanks[0];
      setTankId(String(defaultTank.id));
    }
  }, [suppliers, tanks, supplierId, selectedSupplierId, paySupplierId, tankId, fuelType]);

  // When fuel type changes in New Purchase, pick appropriate tank
  const handleFuelTypeChange = (type) => {
    setFuelType(type);
    if (tanks) {
      const match = tanks.find(t => t.fuelType === type);
      if (match) setTankId(String(match.id));
    }
  };

  const handleEditFuelTypeChange = (type) => {
    setEditFuelType(type);
    if (tanks) {
      const match = tanks.find(t => t.fuelType === type);
      if (match) setEditTankId(String(match.id));
    }
  };

  // Calculated values for New Purchase
  const numLitres = parseFloat(litres) || 0;
  const numRate = parseFloat(rate) || 0;
  const totalAmount = Math.round(numLitres * numRate);
  const numPaid = parseFloat(paidAmount) || 0;
  const balanceAmount = Math.max(0, totalAmount - numPaid);

  // Calculated values for Edit Purchase
  const editNumLitres = parseFloat(editLitres) || 0;
  const editNumRate = parseFloat(editRate) || 0;
  const editTotalAmount = Math.round(editNumLitres * editNumRate);
  const editNumPaid = parseFloat(editPaidAmount) || 0;
  const editBalanceAmount = Math.max(0, editTotalAmount - editNumPaid);

  // --- 1. CREATE PURCHASE ---
  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (numLitres <= 0 || numRate <= 0) {
      alert('Please enter valid fuel quantity (litres) and rate.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPurchase = {
        supplierId: Number(supplierId),
        tankId: Number(tankId),
        invoiceNo: invoiceNo.trim().toUpperCase(),
        date,
        fuelType,
        litres: numLitres,
        purchaseRate: numRate,
        totalAmount,
        paidAmount: numPaid,
        balanceAmount,
        lorryNo: lorryNo.trim().toUpperCase(),
        driverName: driverName.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString()
      };

      const newId = await db.purchases.add(newPurchase);

      // Increase underground storage tank stock
      const targetTank = await db.tanks.get(Number(tankId));
      if (targetTank) {
        const updatedStock = (targetTank.currentStockLitres || 0) + numLitres;
        await db.tanks.update(targetTank.id, {
          currentStockLitres: updatedStock,
          lastDipDate: date
        });
      }

      // Log to audit trail
      if (db.auditLogs) {
        await db.auditLogs.add({
          date,
          entityType: 'Purchase',
          entityId: newId,
          action: 'Create',
          performedBy: 'admin',
          reason: 'Fuel tanker delivery received',
          details: `Invoice ${newPurchase.invoiceNo}: ${numLitres}L ${fuelType} into Tank #${tankId}`,
          createdAt: new Date().toISOString()
        });
      }

      // Reset
      setLitres('');
      setRate('');
      setPaidAmount('0');
      setLorryNo('');
      setDriverName('');
      setNotes('');
      setInvoiceNo(`INV-${Date.now().toString().slice(-6)}`);
      setIsPurchaseModalOpen(false);
    } catch (err) {
      alert('Failed to save purchase: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2. OPEN EDIT PURCHASE ---
  const handleOpenEditPurchase = (p) => {
    setEditingPurchase(p);
    setEditSupplierId(String(p.supplierId));
    setEditTankId(String(p.tankId));
    setEditDate(p.date);
    setEditInvoiceNo(p.invoiceNo);
    setEditFuelType(p.fuelType || 'Diesel');
    setEditLitres(String(p.litres));
    setEditRate(String(p.purchaseRate));
    setEditPaidAmount(String(p.paidAmount || '0'));
    setEditLorryNo(p.lorryNo || '');
    setEditDriverName(p.driverName || '');
    setEditNotes(p.notes || '');
    setIsEditPurchaseModalOpen(true);
  };

  // --- 3. SAVE EDIT PURCHASE (Reconcile Stock Delta) ---
  const handleSaveEditPurchase = async (e) => {
    e.preventDefault();
    if (!editingPurchase) return;
    if (editNumLitres <= 0 || editNumRate <= 0) {
      alert('Please enter valid fuel quantity (litres) and rate.');
      return;
    }

    setIsSubmitting(true);
    try {
      const oldTankId = editingPurchase.tankId;
      const newTankId = Number(editTankId);
      const oldLitres = editingPurchase.litres || 0;
      const newLitres = editNumLitres;

      // Update storage tank stock reconciliation
      if (oldTankId === newTankId) {
        const delta = newLitres - oldLitres;
        if (delta !== 0) {
          const tank = await db.tanks.get(newTankId);
          if (tank) {
            const newStock = Math.max(0, (tank.currentStockLitres || 0) + delta);
            await db.tanks.update(tank.id, {
              currentStockLitres: newStock,
              lastDipDate: editDate
            });
          }
        }
      } else {
        // Tank changed: revert old tank, apply to new tank
        const oldTank = await db.tanks.get(oldTankId);
        if (oldTank) {
          const revStock = Math.max(0, (oldTank.currentStockLitres || 0) - oldLitres);
          await db.tanks.update(oldTank.id, { currentStockLitres: revStock });
        }
        const newTank = await db.tanks.get(newTankId);
        if (newTank) {
          const addStock = (newTank.currentStockLitres || 0) + newLitres;
          await db.tanks.update(newTank.id, {
            currentStockLitres: addStock,
            lastDipDate: editDate
          });
        }
      }

      const updatedRecord = {
        supplierId: Number(editSupplierId),
        tankId: newTankId,
        invoiceNo: editInvoiceNo.trim().toUpperCase(),
        date: editDate,
        fuelType: editFuelType,
        litres: newLitres,
        purchaseRate: editNumRate,
        totalAmount: editTotalAmount,
        paidAmount: editNumPaid,
        balanceAmount: editBalanceAmount,
        lorryNo: editLorryNo.trim().toUpperCase(),
        driverName: editDriverName.trim(),
        notes: editNotes.trim(),
        updatedAt: new Date().toISOString()
      };

      await db.purchases.update(editingPurchase.id, updatedRecord);

      // Audit log
      if (db.auditLogs) {
        await db.auditLogs.add({
          date: editDate,
          entityType: 'Purchase',
          entityId: editingPurchase.id,
          action: 'Update',
          performedBy: 'admin',
          reason: 'Corrected fuel purchase invoice details',
          details: `Invoice ${updatedRecord.invoiceNo}: ${newLitres}L (delta: ${newLitres - oldLitres}L)`,
          createdAt: new Date().toISOString()
        });
      }

      setIsEditPurchaseModalOpen(false);
      setEditingPurchase(null);
    } catch (err) {
      alert('Failed to update purchase: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 4. DELETE PURCHASE (With Stock Reversal) ---
  const handleDeletePurchase = async (p) => {
    if (window.confirm(`Delete Purchase Invoice #${p.invoiceNo}? This will deduct ${formatNumber(p.litres, 0)}L from tank stock.`)) {
      if (p.litres > 0 && p.tankId) {
        const tank = await db.tanks.get(p.tankId);
        if (tank) {
          const revStock = Math.max(0, (tank.currentStockLitres || 0) - p.litres);
          await db.tanks.update(tank.id, { currentStockLitres: revStock });
        }
      }
      await db.purchases.delete(p.id);

      if (db.auditLogs) {
        await db.auditLogs.add({
          date: new Date().toISOString().split('T')[0],
          entityType: 'Purchase',
          entityId: p.id,
          action: 'Delete',
          performedBy: 'admin',
          reason: 'Reversed fuel purchase invoice',
          details: `Deleted Invoice ${p.invoiceNo}, deducted ${p.litres}L from Tank #${p.tankId}`,
          createdAt: new Date().toISOString()
        });
      }
    }
  };

  // --- 5. SUPPLIER MANAGEMENT (CREATE / EDIT) ---
  const handleOpenAddSupplier = () => {
    setSuppName('');
    setSuppPhone('');
    setSuppAddress('');
    setSuppOpeningBalance('0');
    setSuppNotes('');
    setIsAddSupplierOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!suppName.trim()) return;

    const opBal = parseFloat(suppOpeningBalance) || 0;
    const newId = await db.suppliers.add({
      name: suppName.trim(),
      phone: suppPhone.trim(),
      address: suppAddress.trim(),
      openingBalance: opBal,
      currentBalance: opBal,
      notes: suppNotes.trim(),
      createdAt: new Date().toISOString()
    });

    setSelectedSupplierId(String(newId));
    setIsAddSupplierOpen(false);
  };

  const handleOpenEditSupplier = (s) => {
    setEditingSupplier(s);
    setSuppName(s.name);
    setSuppPhone(s.phone || '');
    setSuppAddress(s.address || '');
    setSuppOpeningBalance(String(s.openingBalance || '0'));
    setSuppNotes(s.notes || '');
    setIsEditSupplierOpen(true);
  };

  const handleSaveEditSupplier = async (e) => {
    e.preventDefault();
    if (!editingSupplier || !suppName.trim()) return;

    const opBal = parseFloat(suppOpeningBalance) || 0;
    await db.suppliers.update(editingSupplier.id, {
      name: suppName.trim(),
      phone: suppPhone.trim(),
      address: suppAddress.trim(),
      openingBalance: opBal,
      notes: suppNotes.trim(),
      updatedAt: new Date().toISOString()
    });

    setIsEditSupplierOpen(false);
    setEditingSupplier(null);
  };

  // --- 6. RECORD SUPPLIER PAYMENT ---
  const handleOpenRecordPayment = (sId = null) => {
    if (sId) setPaySupplierId(String(sId));
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayAmount('');
    setPayMethod('Bank Transfer');
    setPayReference(`CHQ-${Date.now().toString().slice(-6)}`);
    setPayNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0 || !paySupplierId) return;

    await db.supplierPayments.add({
      supplierId: Number(paySupplierId),
      date: payDate,
      amount: amt,
      paymentMethod: payMethod,
      reference: payReference.trim() || `CHQ-${Date.now().toString().slice(-6)}`,
      notes: payNotes.trim(),
      createdAt: new Date().toISOString()
    });

    setIsPaymentModalOpen(false);
    setPayAmount('');
    setPayReference('');
    setPayNotes('');
  };

  const handleDeletePayment = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier payment record?')) {
      await db.supplierPayments.delete(id);
    }
  };

  // --- 7. FILTERED PURCHASES ---
  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    return purchases.filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesInv = p.invoiceNo?.toLowerCase().includes(q);
        const matchesLorry = p.lorryNo?.toLowerCase().includes(q);
        const matchesDriver = p.driverName?.toLowerCase().includes(q);
        const supp = suppliers?.find(s => s.id === p.supplierId);
        const matchesSupp = supp?.name?.toLowerCase().includes(q);
        if (!matchesInv && !matchesLorry && !matchesDriver && !matchesSupp) return false;
      }
      if (filterSupplier !== 'All' && p.supplierId !== Number(filterSupplier)) return false;
      if (filterFuel !== 'All' && p.fuelType !== filterFuel) return false;
      if (filterDate && p.date !== filterDate) return false;
      return true;
    });
  }, [purchases, searchQuery, filterSupplier, filterFuel, filterDate, suppliers]);

  // Overall Totals for KPI Strip
  const totals = useMemo(() => {
    let litres = 0;
    let totalAmt = 0;
    let paidOnDelivery = 0;
    let directPayments = 0;
    let balanceAmt = 0;
    let dieselLitres = 0;
    let petrolLitres = 0;

    (purchases || []).forEach(p => {
      litres += (p.litres || 0);
      totalAmt += (p.totalAmount || 0);
      paidOnDelivery += (p.paidAmount || 0);
      balanceAmt += (p.balanceAmount || 0);
      if (p.fuelType === 'Diesel') dieselLitres += (p.litres || 0);
      else petrolLitres += (p.litres || 0);
    });

    (supplierPayments || []).forEach(sp => {
      directPayments += (sp.amount || 0);
    });

    const totalPaid = paidOnDelivery + directPayments;

    // Total supplier opening balances
    let totalOpeningPayable = 0;
    (suppliers || []).forEach(s => {
      totalOpeningPayable += (s.openingBalance || 0);
    });

    const totalPayable = Math.max(0, totalOpeningPayable + totalAmt - totalPaid);

    return { 
      count: (purchases || []).length, 
      litres, 
      dieselLitres,
      petrolLitres,
      totalAmt, 
      paidAmt: totalPaid, 
      balanceAmt: totalPayable,
      totalPayable
    };
  }, [purchases, supplierPayments, suppliers]);

  // Active Supplier Statement Details
  const activeSupplier = useMemo(() => {
    if (!suppliers || !selectedSupplierId) return null;
    return suppliers.find(s => s.id === Number(selectedSupplierId));
  }, [suppliers, selectedSupplierId]);

  const activeSupplierDetails = useMemo(() => {
    if (!activeSupplier) return { purchases: [], payments: [], history: [], totalPurchases: 0, totalPaid: 0, netPayable: 0 };

    const suppPurchases = purchases?.filter(p => p.supplierId === activeSupplier.id) || [];
    const suppPayments = supplierPayments?.filter(p => p.supplierId === activeSupplier.id) || [];

    const totalPurchasesAmt = suppPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const purchasesPaidOnSpot = suppPurchases.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
    const directPay = suppPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalPaid = purchasesPaidOnSpot + directPay;

    const opening = activeSupplier.openingBalance || 0;
    const netPayable = opening + totalPurchasesAmt - totalPaid;

    // Build History
    const history = [];
    suppPurchases.forEach(p => {
      history.push({
        id: `purch-${p.id}`,
        rawId: p.id,
        rawObj: p,
        date: p.date,
        type: 'Purchase',
        ref: p.invoiceNo,
        description: `${p.fuelType} Tanker Delivery (${formatNumber(p.litres, 0)}L @ Rs ${formatNumber(p.purchaseRate, 2)}) - Lorry #${p.lorryNo || 'N/A'}`,
        debitAmount: p.totalAmount, // Increases payable
        creditAmount: p.paidAmount || 0, // Paid on spot
        balance: 0
      });
    });

    suppPayments.forEach(p => {
      history.push({
        id: `pay-${p.id}`,
        rawId: p.id,
        rawObj: p,
        date: p.date,
        type: 'Payment',
        ref: p.reference || `PAY-${p.id}`,
        description: `Direct Payment via ${p.paymentMethod} ${p.notes ? `(${p.notes})` : ''}`,
        debitAmount: 0,
        creditAmount: p.amount, // Decreases payable
        balance: 0
      });
    });

    // Sort chronological to accurately compute running balance
    history.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    let running = opening;
    history.forEach(item => {
      running += (item.debitAmount || 0) - (item.creditAmount || 0);
      item.balance = running;
    });

    // Reverse for displaying newest records first
    const displayHistory = [...history].reverse();

    return {
      purchases: suppPurchases,
      payments: suppPayments,
      history: displayHistory,
      totalPurchases: totalPurchasesAmt,
      totalPaid,
      netPayable
    };
  }, [activeSupplier, purchases, supplierPayments]);

  // Purchases Summary for Report & Print
  const purchasesSummary = useMemo(() => {
    let totalLitres = 0;
    let dieselLitres = 0;
    let petrolLitres = 0;
    let totalBilled = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    (filteredPurchases || []).forEach(p => {
      totalLitres += (p.litres || 0);
      if (p.fuelType === 'Diesel') dieselLitres += (p.litres || 0);
      else petrolLitres += (p.litres || 0);
      totalBilled += (p.totalAmount || 0);
      totalPaid += (p.paidAmount || 0);
      totalBalance += (p.balanceAmount || 0);
    });

    return { totalLitres, dieselLitres, petrolLitres, totalBilled, totalPaid, totalBalance };
  }, [filteredPurchases]);

  // Export Purchases CSV
  const handleExportPurchasesCSV = () => {
    if (!filteredPurchases.length) return;
    const rows = filteredPurchases.map(p => {
      const supp = suppliers?.find(s => s.id === p.supplierId);
      const tank = tanks?.find(t => t.id === p.tankId);
      return {
        'Date': p.date,
        'Invoice #': p.invoiceNo,
        'Supplier': supp?.name || 'PSO',
        'Fuel Product': p.fuelType,
        'Storage Tank': tank?.tankName || 'Tank 1',
        'Lorry / Tanker #': p.lorryNo,
        'Driver Name': p.driverName,
        'Litres Received': p.litres,
        'Rate (PKR)': p.purchaseRate,
        'Total Billed (PKR)': p.totalAmount,
        'Paid Amount (PKR)': p.paidAmount,
        'Balance Payable (PKR)': p.balanceAmount
      };
    });
    exportToCSV(`Fuel_Purchases_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  // Export Supplier Statement CSV
  const handleExportStatementCSV = () => {
    if (!activeSupplier || !activeSupplierDetails.history.length) return;
    const rows = activeSupplierDetails.history.map(h => ({
      'Date': h.date,
      'Type': h.type,
      'Reference / Invoice #': h.ref,
      'Description': h.description,
      'Purchase Billed (PKR)': h.debitAmount,
      'Payment Paid (PKR)': h.creditAmount
    }));
    exportToCSV(`${activeSupplier.name.replace(/\s+/g, '_')}_Supplier_Statement.csv`, rows);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* 1. HERO BANNER WITH ATTENDANT & CAR BACKGROUND (meter_background.jpg) */}
      <div 
        className="relative rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print min-h-[160px] flex items-center bg-slate-900 bg-cover bg-right md:bg-center"
        style={{
          backgroundImage: "url('./meter_background.jpg')"
        }}
      >
        {/* Soft navy gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/55 to-transparent pointer-events-none"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full px-6 sm:px-8 py-7 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Building/OMC Squircle Icon + Title & Subtitle */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
              <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                Suppliers &amp; Fuel Purchases
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-normal drop-shadow-xs mt-1 max-w-xl leading-relaxed">
                Manage bulk fuel tanker decanting, Oil Marketing Companies (OMCs), and supplier payment reconciliation.
              </p>
            </div>
          </div>

          {/* Right: Action Buttons (Only 2 buttons: Receive Fuel Tanker & Add Supplier) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="flex items-center gap-2.5 px-5 sm:px-6 py-3 rounded-full bg-[#C32026] hover:bg-[#a81a1f] active:bg-[#8f151a] text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/40 hover:shadow-red-900/50 transition-all cursor-pointer"
            >
              <Truck className="w-4 h-4 text-white" />
              <span>Receive Fuel Tanker</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleOpenAddSupplier}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/20 font-bold text-xs sm:text-sm backdrop-blur-xs shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white/90" />
              <span>Add Supplier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FOUR TOP KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 no-print">
        
        {/* Card 1: Deliveries Received */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Deliveries Received
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
              {totals.count} Tankers
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-blue-600 font-bold font-mono">
                {formatNumber(totals.litres, 0)} L
              </span>
              <span className="text-slate-400">&bull; Decanted to Tanks</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Purchase Cost */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Fuel className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Total Purchase Cost
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5 truncate font-mono">
              {formatCurrency(totals.totalAmt)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-indigo-600 font-bold font-mono">
                Billed
              </span>
              <span className="text-slate-400">&bull; OMC Invoices</span>
            </div>
          </div>
        </div>

        {/* Card 3: Paid on Delivery & Cheques */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Settled Payments
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight mt-0.5 truncate font-mono">
              {formatCurrency(totals.paidAmt)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-emerald-600 font-bold font-mono">
                Bank / Cheques
              </span>
              <span className="text-slate-400">&bull; Settled Payouts</span>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Payables */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-full bg-[#e11d48] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block truncate">
              Outstanding Payables
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight mt-0.5 truncate font-mono">
              {formatCurrency(totals.totalPayable)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs truncate">
              <span className="text-rose-600 font-bold font-mono">
                Payable
              </span>
              <span className="text-slate-400">&bull; Balance Owed to OMCs</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SUB-MODULE TABS HEADER */}
      <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Fuel Tanker Purchases</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {purchases?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Supplier Accounts &amp; Statements</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {suppliers?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Payment Vouchers</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
              {supplierPayments?.length || 0}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-3 hidden lg:block">
          {activeTab === 'purchases' && 'Bulk fuel decanted into tanks updates storage stock and supplier balance'}
          {activeTab === 'suppliers' && 'Track OMC supplier invoices, payments, and running ledger credit'}
          {activeTab === 'payments' && 'Direct payments disbursed to suppliers via Cheques or Bank Transfers'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FUEL TANKER PURCHASES & INWARD STOCK                               */}
      {/* ========================================================================= */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search invoice #, lorry #, driver..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <select
                  value={filterSupplier}
                  onChange={e => setFilterSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="All">All Fuel Suppliers</option>
                  {suppliers?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filterFuel}
                  onChange={e => setFilterFuel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="All">All Fuel Products</option>
                  <option value="Diesel">Diesel (HSD)</option>
                  <option value="Petrol">Petrol (PMG)</option>
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleExportPurchasesCSV}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsPurchasesPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Fuel Tanker Inward Decanting Registry</h3>
                <p className="text-xs text-slate-500">Record of all bulk fuel supplies from licensed OMCs</p>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Showing {filteredPurchases.length} of {purchases?.length || 0} deliveries
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Invoice #</th>
                    <th className="py-3 px-3.5">Supplier (OMC)</th>
                    <th className="py-3 px-3.5">Product</th>
                    <th className="py-3 px-3.5">Storage Tank</th>
                    <th className="py-3 px-3.5">Lorry / Driver</th>
                    <th className="py-3 px-3.5 text-right">Quantity (Ltr)</th>
                    <th className="py-3 px-3.5 text-right">Rate</th>
                    <th className="py-3 px-3.5 text-right">Total Cost</th>
                    <th className="py-3 px-3.5 text-right">Paid</th>
                    <th className="py-3 px-3.5 text-right">Balance</th>
                    <th className="py-3 px-3.5 text-center no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const paginatedPurchases = filteredPurchases.slice((purchasesPage - 1) * purchasesPageSize, purchasesPage * purchasesPageSize);
                    if (paginatedPurchases.length === 0) {
                      return (
                        <tr>
                          <td colSpan={12} className="py-10 text-center text-xs text-slate-400">
                            No fuel purchase entries found. Click &quot;Receive Fuel Tanker&quot; to record delivery.
                          </td>
                        </tr>
                      );
                    }
                    return paginatedPurchases.map(p => {
                      const supp = suppliers?.find(s => s.id === p.supplierId);
                      const tank = tanks?.find(t => t.id === p.tankId);

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3.5 font-mono text-slate-600">{formatDateDisplay(p.date)}</td>
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-900">{p.invoiceNo}</td>
                          <td className="py-3 px-3.5 font-bold text-slate-900">{supp?.name || 'PSO'}</td>
                          <td className="py-3 px-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.fuelType === 'Diesel'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {p.fuelType}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 font-medium">
                            {tank?.tankName || `Tank #${p.tankId}`}
                          </td>
                          <td className="py-3 px-3.5 font-mono text-slate-700">
                            {p.lorryNo} {p.driverName ? `(${p.driverName})` : ''}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-black text-slate-900">
                            {formatNumber(p.litres, 0)} L
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                            Rs {formatNumber(p.purchaseRate, 2)}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-black text-blue-700">
                            {formatCurrency(p.totalAmount)}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono text-emerald-700 font-bold">
                            {formatNumber(p.paidAmount || 0, 0)}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono text-rose-600 font-black">
                            {formatNumber(p.balanceAmount || 0, 0)}
                          </td>

                          {/* ACTIONS COLUMN: EDIT, PRINT, DELETE */}
                          <td className="py-3 px-3.5 text-center no-print">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Action Button */}
                              <button
                                onClick={() => handleOpenEditPurchase(p)}
                                className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Edit Purchase Record"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Print Voucher Button */}
                              <button
                                onClick={() => setSelectedPurchaseForPrint(p)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                                title="Print Delivery Voucher"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Action Button */}
                              <button
                                onClick={() => handleDeletePurchase(p)}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete &amp; Reverse Stock"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={purchasesPage}
              totalItems={filteredPurchases.length}
              pageSize={purchasesPageSize}
              onPageChange={setPurchasesPage}
              onPageSizeChange={setPurchasesPageSize}
            />
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUPPLIER ACCOUNTS & STATEMENTS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'suppliers' && (
        <div className="space-y-5">
          
          {/* Supplier Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
            {suppliers?.map(s => {
              const isSelected = String(s.id) === selectedSupplierId;
              const suppPurchases = purchases?.filter(p => p.supplierId === s.id) || [];
              const totalPurchases = suppPurchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
              const paidSpot = suppPurchases.reduce((acc, p) => acc + (p.paidAmount || 0), 0);
              const directPay = supplierPayments?.filter(sp => sp.supplierId === s.id).reduce((acc, sp) => acc + (sp.amount || 0), 0) || 0;
              const totalPaid = paidSpot + directPay;
              const payable = (s.openingBalance || 0) + totalPurchases - totalPaid;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSupplierId(String(s.id))}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3.5 ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-600 shadow-md ring-2 ring-blue-600/20'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{s.name}</h3>
                        <span className="text-xs text-slate-500 font-mono block mt-0.5">{s.phone || 'No phone'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEditSupplier(s)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-white transition-colors cursor-pointer"
                        title="Edit Supplier Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white">
                          Selected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Outstanding Balance:</span>
                    <span className="font-mono font-black text-rose-700 text-sm">{formatCurrency(payable)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Supplier Statement */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider font-mono">
                      Supplier Statement &amp; Ledger
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {activeSupplier?.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeSupplier?.address} &bull; Tel: {activeSupplier?.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => handleOpenRecordPayment(activeSupplier?.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditSupplier(activeSupplier)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Supplier</span>
                  </button>
                  <button
                    onClick={handleExportStatementCSV}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => setIsStatementPrintModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>

              {/* 4 Statement KPI Metric Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold font-sans block">Opening Balance</span>
                  <span className="text-base font-bold text-slate-800">
                    {formatCurrency(activeSupplier?.openingBalance || 0)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold font-sans block">Purchases Billed</span>
                  <span className="text-base font-bold text-blue-700">
                    {formatCurrency(activeSupplierDetails.totalPurchases)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-semibold font-sans block">Payments Settled</span>
                  <span className="text-base font-bold text-emerald-700">
                    {formatCurrency(activeSupplierDetails.totalPaid)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                  <span className="text-[10px] text-rose-800 uppercase font-semibold font-sans block">Net Balance Payable</span>
                  <span className="text-base font-black text-rose-700">
                    {formatCurrency(activeSupplierDetails.netPayable)}
                  </span>
                </div>
              </div>

              {/* History Table */}
              <div className="rounded-xl border border-slate-200/80 overflow-hidden">
                <div className="p-3.5 border-b border-slate-200/80 bg-slate-50 text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Transaction &amp; Procurement History</span>
                  <span className="text-[11px] font-normal text-slate-500 font-mono">
                    {activeSupplierDetails.history.length} records
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3.5">Date</th>
                        <th className="py-2.5 px-3.5">Transaction</th>
                        <th className="py-2.5 px-3.5">Reference / Invoice #</th>
                        <th className="py-2.5 px-3.5">Particulars / Delivery Notes</th>
                        <th className="py-2.5 px-3.5 text-right">Purchase Billed</th>
                        <th className="py-2.5 px-3.5 text-right">Payment Paid</th>
                        <th className="py-2.5 px-3.5 text-center no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSupplierDetails.history.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                            No purchases or payments recorded for this supplier.
                          </td>
                        </tr>
                      ) : (
                        activeSupplierDetails.history.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3.5 font-mono text-slate-600">{formatDateDisplay(item.date)}</td>
                            <td className="py-2.5 px-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.type === 'Purchase'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {item.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">{item.ref}</td>
                            <td className="py-2.5 px-3.5 text-slate-600">{item.description}</td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900">
                              {item.debitAmount > 0 ? formatCurrency(item.debitAmount) : '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-700">
                              {item.creditAmount > 0 ? formatCurrency(item.creditAmount) : '-'}
                            </td>
                            <td className="py-2.5 px-3.5 text-center no-print">
                              {item.type === 'Purchase' ? (
                                <button
                                  onClick={() => handleOpenEditPurchase(item.rawObj)}
                                  className="p-1 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                                  title="Edit Purchase"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDeletePayment(item.rawId)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Delete Payment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYMENT SETTLEMENTS REGISTER                                       */}
      {/* ========================================================================= */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Supplier Payment Disbursements</h3>
                <p className="text-xs text-slate-500">Record of bank transfers, cheques and cash settlements made to OMCs</p>
              </div>
              <button
                onClick={() => handleOpenRecordPayment()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Payment Voucher</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Supplier (OMC)</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Reference / Cheque #</th>
                    <th className="py-3 px-4">Particulars / Notes</th>
                    <th className="py-3 px-4 text-right">Amount Settled</th>
                    <th className="py-3 px-4 text-center no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {supplierPayments?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-slate-400">
                        No supplier payments recorded yet. Click &quot;New Payment Voucher&quot; to disburse payment.
                      </td>
                    </tr>
                  ) : (
                    supplierPayments.map(sp => {
                      const supp = suppliers?.find(s => s.id === sp.supplierId);

                      return (
                        <tr key={sp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-700">{formatDateDisplay(sp.date)}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{supp?.name || 'OMC Supplier'}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {sp.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">{sp.reference}</td>
                          <td className="py-3 px-4 text-slate-600">{sp.notes || '-'}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                            {formatCurrency(sp.amount)}
                          </td>
                          <td className="py-3 px-4 text-center no-print">
                            <button
                              onClick={() => handleDeletePayment(sp.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RECEIVE FUEL TANKER (NEW PURCHASE)                              */}
      {/* ========================================================================= */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Receive Fuel Tanker (OMC Delivery)</h3>
                  <p className="text-xs text-slate-500">Record decanted fuel stock into underground tanks</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPurchaseModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier (OMC) *</label>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    {suppliers?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fuel Product *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFuelTypeChange('Diesel')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        fuelType === 'Diesel'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Diesel (HSD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFuelTypeChange('Petrol')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        fuelType === 'Petrol'
                          ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Petrol (PMG)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Decanting Tank *</label>
                  <select
                    value={tankId}
                    onChange={e => setTankId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    {tanks?.filter(t => t.fuelType === fuelType).map(t => (
                      <option key={t.id} value={t.id}>{t.tankName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice / Delivery Voucher # *</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    placeholder="PSO-INV-89210"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanker Lorry # *</label>
                  <input
                    type="text"
                    value={lorryNo}
                    onChange={e => setLorryNo(e.target.value)}
                    placeholder="TL-8842"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 uppercase focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Litres Received *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={litres}
                    onChange={e => setLitres(e.target.value)}
                    placeholder="e.g. 15000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Rate (PKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                    placeholder="e.g. 392.50"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Paid on Delivery (PKR)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    placeholder="Muhammad Aslam"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Real-time Calculation Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Total Purchase Cost</span>
                  <span className="text-base font-black text-blue-700">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold block">Balance Payable</span>
                  <span className="text-base font-black text-rose-600">{formatCurrency(balanceAmount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#C32026] hover:bg-[#a81a1f] text-white font-bold rounded-xl cursor-pointer shadow-md disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Decanting...' : 'Save & Decant to Tank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT FUEL PURCHASE ("oe actions me edit wala option bi ho")       */}
      {/* ========================================================================= */}
      {isEditPurchaseModalOpen && editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Edit Fuel Purchase #{editingPurchase.invoiceNo}</h3>
                  <p className="text-xs text-slate-500">Correct delivery litres, purchase rate, or tank assignment</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditPurchaseModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier (OMC) *</label>
                  <select
                    value={editSupplierId}
                    onChange={e => setEditSupplierId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    {suppliers?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fuel Product *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditFuelTypeChange('Diesel')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editFuelType === 'Diesel'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Diesel (HSD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditFuelTypeChange('Petrol')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        editFuelType === 'Petrol'
                          ? 'bg-emerald-600 text-white border-emerald-700 font-black shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Petrol (PMG)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Decanting Tank *</label>
                  <select
                    value={editTankId}
                    onChange={e => setEditTankId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    {tanks?.map(t => (
                      <option key={t.id} value={t.id}>{t.tankName} ({t.fuelType})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice / Voucher # *</label>
                  <input
                    type="text"
                    value={editInvoiceNo}
                    onChange={e => setEditInvoiceNo(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanker Lorry # *</label>
                  <input
                    type="text"
                    value={editLorryNo}
                    onChange={e => setEditLorryNo(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 uppercase focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Litres Received *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editLitres}
                    onChange={e => setEditLitres(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Rate (PKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editRate}
                    onChange={e => setEditRate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Paid (PKR)</label>
                  <input
                    type="number"
                    value={editPaidAmount}
                    onChange={e => setEditPaidAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={editDriverName}
                    onChange={e => setEditDriverName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Difference and Reconciliation Note */}
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-blue-600 uppercase font-sans font-semibold block">Total Cost</span>
                  <span className="text-base font-black text-blue-900">{formatCurrency(editTotalAmount)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-rose-600 uppercase font-sans font-semibold block">Balance Payable</span>
                  <span className="text-base font-black text-rose-700">{formatCurrency(editBalanceAmount)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditPurchaseModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Updating...' : 'Update & Reconcile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD SUPPLIER                                                     */}
      {/* ========================================================================= */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Add Fuel Supplier (OMC)</h3>
                  <p className="text-xs text-slate-500">Register new Oil Marketing Company</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddSupplierOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier / OMC Name *</label>
                <input
                  type="text"
                  value={suppName}
                  onChange={e => setSuppName(e.target.value)}
                  placeholder="e.g. Attock Petroleum Limited (APL)"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={suppPhone}
                  onChange={e => setSuppPhone(e.target.value)}
                  placeholder="+92 21 111-111-776"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Office / Depot Address</label>
                <input
                  type="text"
                  value={suppAddress}
                  onChange={e => setSuppAddress(e.target.value)}
                  placeholder="Head Office, Karachi / Rawalpindi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Payable Balance (PKR)</label>
                <input
                  type="number"
                  value={suppOpeningBalance}
                  onChange={e => setSuppOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#C32026] hover:bg-[#a81a1f] text-white font-bold rounded-xl cursor-pointer shadow-md transition-all"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT SUPPLIER                                                    */}
      {/* ========================================================================= */}
      {isEditSupplierOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Edit Supplier Details</h3>
                  <p className="text-xs text-slate-500">Update profile for {editingSupplier.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditSupplierOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  value={suppName}
                  onChange={e => setSuppName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={suppPhone}
                  onChange={e => setSuppPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={suppAddress}
                  onChange={e => setSuppAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Payable Balance (PKR)</label>
                <input
                  type="number"
                  value={suppOpeningBalance}
                  onChange={e => setSuppOpeningBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditSupplierOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RECORD SUPPLIER PAYMENT                                          */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Record Supplier Payment</h3>
                  <p className="text-xs text-slate-500">Disburse bank transfer or cheque settlement</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Supplier *</label>
                <select
                  value={paySupplierId}
                  onChange={e => setPaySupplierId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  {suppliers?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-emerald-700 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Bank Transfer">Bank Transfer (FT)</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Cash">Cash at Depot</option>
                    <option value="Online / Pay Order">Pay Order / RTGS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cheque / Ref #</label>
                  <input
                    type="text"
                    value={payReference}
                    onChange={e => setPayReference(e.target.value)}
                    placeholder="CHQ-981244"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Bank Details</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="HBL / MCB account transfer voucher"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-md transition-all"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: PRINTABLE FUEL TANKER INWARD DECANTING VOUCHER                   */}
      {/* ========================================================================= */}
      {selectedPurchaseForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Top Modal Navigation Header Bar (SCREEN ONLY - Clean White Style) */}
            <div className="px-6 py-4 bg-white text-slate-800 border-b border-slate-200 flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Fuel Tanker Inward Decanting Voucher
                  </h3>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Invoice #{selectedPurchaseForPrint.invoiceNo} &bull; Delivery Receipt
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const fname = `Diyal_Decanting_Voucher_${selectedPurchaseForPrint.invoiceNo || 'Tanker'}.pdf`;
                    exportReportToPDF('tanker-decanting-voucher', fname);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer border border-blue-200 transition-all shadow-xs"
                  title="Directly save PDF file to your computer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPurchaseForPrint(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet (print-area) */}
            <div id="tanker-decanting-voucher" className="print-area p-6 sm:p-8 bg-white text-slate-900 relative">
              {/* Diyal Station Header */}
              <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                <div className="flex items-center gap-3">
                  <img 
                    src="./logo.png" 
                    alt="Diyal Logo" 
                    className="h-12 w-auto object-contain shrink-0 drop-shadow-xs"
                    onError={e => { e.target.src = './logo.jpg'; }}
                  />
                  <div className="flex flex-col leading-none">
                    <h2 className="text-xl font-black text-slate-950 uppercase font-sans">DIYAL</h2>
                    <h3 className="text-xs font-bold tracking-widest text-[#C32026] uppercase mt-0.5">FILLING STATION</h3>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-0.5 text-right font-sans">
                  <div>📍 {pumpAddress}</div>
                  <div className="font-mono">📞 {pumpPhone}</div>
                  <div className="font-mono text-slate-500 font-medium">NTN: 1234567-8</div>
                </div>
              </div>

              {/* Voucher Title */}
              <div className="py-3 flex items-center justify-between border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">Fuel Receiving Record</span>
                  <h1 className="text-lg font-black text-slate-900">TANKER INWARD DECANTING VOUCHER</h1>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 block">
                    {selectedPurchaseForPrint.invoiceNo}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                    Date: {formatDateDisplay(selectedPurchaseForPrint.date)}
                  </span>
                </div>
              </div>

              {/* Voucher Content Grid */}
              <div className="grid grid-cols-2 gap-4 my-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-sans">Carrier &amp; Logistics</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Supplier (OMC):</span>
                    <span className="font-bold text-slate-900 font-sans">{suppliers?.find(s => s.id === selectedPurchaseForPrint.supplierId)?.name || 'PSO'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Tanker Lorry #:</span>
                    <span className="font-black text-slate-900">{selectedPurchaseForPrint.lorryNo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Driver Name:</span>
                    <span className="font-bold text-slate-800 font-sans">{selectedPurchaseForPrint.driverName || 'Authorized Driver'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Decanted Into:</span>
                    <span className="font-bold text-blue-800 font-sans">{tanks?.find(t => t.id === selectedPurchaseForPrint.tankId)?.tankName || `Tank ${selectedPurchaseForPrint.tankId}`}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase font-sans">Fuel &amp; Settlement</div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Product Type:</span>
                    <span className="font-black text-slate-900 font-sans">{selectedPurchaseForPrint.fuelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Decanted Volume:</span>
                    <span className="font-black text-blue-700">{formatNumber(selectedPurchaseForPrint.litres, 0)} Litres</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Purchase Rate:</span>
                    <span>Rs {formatNumber(selectedPurchaseForPrint.purchaseRate, 2)} / L</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                    <span className="text-slate-700 font-sans">Total Billed:</span>
                    <span className="text-blue-900 font-black">{formatCurrency(selectedPurchaseForPrint.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-sans">Spot Paid:</span>
                    <span>{formatCurrency(selectedPurchaseForPrint.paidAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-black">
                    <span className="font-sans">Balance Payable:</span>
                    <span>{formatCurrency(selectedPurchaseForPrint.balanceAmount || 0)}</span>
                  </div>
                </div>
              </div>

              {/* QA Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">Quality Checks:</span>
                  <span className="text-emerald-700 font-semibold">✓ Density Verified</span>
                  <span className="text-emerald-700 font-semibold">✓ Water Paste Clear</span>
                  <span className="text-emerald-700 font-semibold">✓ Dip Verified</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-8 pt-5 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-28 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Tanker Driver</span>
                  <span className="block text-[10px] text-slate-400">Carrier Sign</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-28 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Decanting Operator</span>
                  <span className="block text-[10px] text-slate-400">Dip Checked</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-28 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Station Manager</span>
                  <span className="block text-[10px] text-slate-400">Diyal Filling Station</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: PRINTABLE FUEL PURCHASES (TANKERS) REGISTRY REPORT               */}
      {/* ========================================================================= */}
      {isPurchasesPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Top Modal Navigation Header Bar (SCREEN ONLY - Clean White Style) */}
            <div className="px-6 py-4 bg-white text-slate-800 border-b border-slate-200 flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Fuel Purchases &amp; Tanker Deliveries Registry
                  </h3>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Official OMC Bulk Procurement Record &bull; Printable Corporate A4 Document
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPurchasesCSV}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fname = `Diyal_Fuel_Purchases_Registry.pdf`;
                    exportReportToPDF('fuel-purchases-registry-report', fname);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer border border-blue-200 transition-all shadow-xs"
                  title="Directly save PDF file to your computer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPurchasesPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet (print-area) */}
            <div id="fuel-purchases-registry-report" className="print-area p-6 sm:p-8 bg-white text-slate-900 relative">
              {/* Diyal Filling Station Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                <div className="flex items-center gap-3">
                  <img 
                    src="./logo.png" 
                    alt="Diyal Logo" 
                    className="h-12 sm:h-14 w-auto object-contain shrink-0 drop-shadow-xs"
                    onError={e => { e.target.src = './logo.jpg'; }}
                  />
                  <div className="flex flex-col leading-none">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-wider uppercase font-sans">
                      DIYAL
                    </h2>
                    <h3 className="text-xs font-bold tracking-widest text-[#C32026] uppercase mt-0.5">
                      FILLING STATION
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 sm:text-left font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📍</span>
                    <span>{pumpAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📞</span>
                    <span className="font-mono">{pumpPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">🏛️</span>
                    <span className="font-mono font-semibold">NTN: 1234567-8</span>
                  </div>
                </div>
              </div>

              {/* Title & Metadata Ribbon */}
              <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                    Official Bulk Fuel Procurement
                  </span>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Fuel Purchases &amp; Tanker Decanting Registry
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comprehensive inward registry of licensed OMC fuel tanker supplies
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                    Generated: {new Date().toLocaleDateString('en-GB')}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-800 font-bold font-mono">
                    {filteredPurchases.length} Deliveries
                  </span>
                </div>
              </div>

              {/* Printable KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 font-mono">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-sans block">Total Volume</span>
                  <span className="text-base sm:text-lg font-black text-slate-900">{formatNumber(purchasesSummary.totalLitres, 0)} L</span>
                  <span className="text-[10px] text-slate-500 block font-sans">Diesel: {formatNumber(purchasesSummary.dieselLitres, 0)} | Petrol: {formatNumber(purchasesSummary.petrolLitres, 0)}</span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-700 font-sans block">Total Billed</span>
                  <span className="text-base sm:text-lg font-black text-blue-900">{formatCurrency(purchasesSummary.totalBilled)}</span>
                  <span className="text-[10px] text-blue-600 block font-sans">Gross Procurement Cost</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 font-sans block">Paid on Spot</span>
                  <span className="text-base sm:text-lg font-black text-emerald-900">{formatCurrency(purchasesSummary.totalPaid)}</span>
                  <span className="text-[10px] text-emerald-600 block font-sans">Direct Decanting Payments</span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-700 font-sans block">Outstanding Balance</span>
                  <span className="text-base sm:text-lg font-black text-rose-900">{formatCurrency(purchasesSummary.totalBalance)}</span>
                  <span className="text-[10px] text-rose-600 block font-sans">Net Unsettled Invoices</span>
                </div>
              </div>

              {/* Purchases Registry Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Supplier (OMC)</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Storage Tank</th>
                      <th className="py-2.5 px-3">Lorry / Driver</th>
                      <th className="py-2.5 px-3 text-right">Litres</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Total (PKR)</th>
                      <th className="py-2.5 px-3 text-right">Paid (PKR)</th>
                      <th className="py-2.5 px-3 text-right">Balance (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {filteredPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-xs text-slate-400">
                          No fuel tanker purchases match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPurchases.map(p => {
                        const supp = suppliers?.find(s => s.id === p.supplierId);
                        const tank = tanks?.find(t => t.id === p.tankId);
                        return (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">{formatDateDisplay(p.date)}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{p.invoiceNo}</td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{supp?.name || 'OMC Supplier'}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.fuelType === 'Diesel' 
                                  ? 'bg-amber-100 text-amber-900' 
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}>
                                {p.fuelType}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{tank?.tankName || `Tank ${p.tankId}`}</td>
                            <td className="py-2 px-3 text-slate-700 font-mono">{p.lorryNo || 'N/A'}{p.driverName ? ` (${p.driverName})` : ''}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{formatNumber(p.litres, 0)} L</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600 whitespace-nowrap">Rs {formatNumber(p.purchaseRate, 2)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-blue-900 whitespace-nowrap">{formatCurrency(p.totalAmount)}</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold whitespace-nowrap">{formatNumber(p.paidAmount || 0, 0)}</td>
                            <td className="py-2 px-3 text-right font-mono text-rose-700 font-bold whitespace-nowrap">{formatNumber(p.balanceAmount || 0, 0)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[11px]">
                    <tr>
                      <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-700 font-black">
                        Total Summary:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                        {formatNumber(purchasesSummary.totalLitres, 0)} L
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">-</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-blue-950 whitespace-nowrap">
                        {formatCurrency(purchasesSummary.totalBilled)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                        {formatCurrency(purchasesSummary.totalPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-rose-800 whitespace-nowrap">
                        {formatCurrency(purchasesSummary.totalBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures & Footer Verification */}
              <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Decanting Officer</span>
                  <span className="block text-[10px] text-slate-400">Station Incharge</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Tanker Driver Sign</span>
                  <span className="block text-[10px] text-slate-400">OMC Logistics Carrier</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Station Manager</span>
                  <span className="block text-[10px] text-slate-400">Diyal Filling Station</span>
                </div>
              </div>

              <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>System Generated Official Document &bull; Diyal ERP</span>
                <span>Printed on: {new Date().toLocaleString('en-GB')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: PRINTABLE SUPPLIER STATEMENT & LEDGER REPORT                     */}
      {/* ========================================================================= */}
      {isStatementPrintModalOpen && activeSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in duration-150">
            {/* Top Modal Navigation Header Bar (SCREEN ONLY - Clean White Style) */}
            <div className="px-6 py-4 bg-white text-slate-800 border-b border-slate-200 flex items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Supplier Account Statement &amp; Ledger Report
                  </h3>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {activeSupplier?.name} &bull; Printable Corporate A4 Document
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportStatementCSV}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const fname = `Diyal_Supplier_Statement_${(activeSupplier?.name || 'Supplier').replace(/\s+/g, '_')}.pdf`;
                    exportReportToPDF('supplier-statement-report', fname);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer border border-blue-200 transition-all shadow-xs"
                  title="Directly save PDF file to your computer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStatementPrintModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Sheet (print-area) */}
            <div id="supplier-statement-report" className="print-area p-6 sm:p-8 bg-white text-slate-900 relative">
              {/* Header: Logo, Diyal Filling Station & Contact */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                <div className="flex items-center gap-3">
                  <img 
                    src="./logo.png" 
                    alt="Diyal Logo" 
                    className="h-12 sm:h-14 w-auto object-contain shrink-0 drop-shadow-xs"
                    onError={e => { e.target.src = './logo.jpg'; }}
                  />
                  <div className="flex flex-col leading-none">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-wider uppercase font-sans">
                      DIYAL
                    </h2>
                    <h3 className="text-xs font-bold tracking-widest text-[#C32026] uppercase mt-0.5">
                      FILLING STATION
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-0.5 sm:text-left font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📍</span>
                    <span>{pumpAddress}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">📞</span>
                    <span className="font-mono">{pumpPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">🏛️</span>
                    <span className="font-mono font-semibold">NTN: 1234567-8</span>
                  </div>
                </div>
              </div>

              {/* Title Block & Supplier Details */}
              <div className="py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                    OMC Vendor Statement &amp; Ledger
                  </span>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {activeSupplier?.name}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    📍 {activeSupplier?.address || 'Pakistan'} &bull; 📞 {activeSupplier?.phone || 'N/A'}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end text-xs font-mono space-y-1">
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    Statement Date: {new Date().toLocaleDateString('en-GB')}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold">
                    Account Status: Active
                  </span>
                </div>
              </div>

              {/* 4 Financial KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold font-sans block">Opening Balance</span>
                  <span className="text-base sm:text-lg font-black text-slate-900">
                    {formatCurrency(activeSupplier?.openingBalance || 0)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                  <span className="text-[10px] text-blue-700 uppercase font-bold font-sans block">Purchases Billed</span>
                  <span className="text-base sm:text-lg font-black text-blue-900">
                    {formatCurrency(activeSupplierDetails.totalPurchases)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-bold font-sans block">Payments Settled</span>
                  <span className="text-base sm:text-lg font-black text-emerald-900">
                    {formatCurrency(activeSupplierDetails.totalPaid)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
                  <span className="text-[10px] text-rose-700 uppercase font-bold font-sans block">Net Balance Payable</span>
                  <span className="text-base sm:text-lg font-black text-rose-900">
                    {formatCurrency(activeSupplierDetails.netPayable)}
                  </span>
                </div>
              </div>

              {/* Detailed Ledger Transactions Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Ref / Invoice #</th>
                      <th className="py-2.5 px-3">Particulars &amp; Decanting Notes</th>
                      <th className="py-2.5 px-3 text-right">Billed / Debit (PKR)</th>
                      <th className="py-2.5 px-3 text-right">Settled / Credit (PKR)</th>
                      <th className="py-2.5 px-3 text-right">Balance (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {/* Row 0: Opening Balance */}
                    <tr className="bg-slate-50/80 font-semibold italic text-slate-600">
                      <td className="py-2 px-3 font-mono">-</td>
                      <td className="py-2 px-3">Opening</td>
                      <td className="py-2 px-3 font-mono">OP-BAL</td>
                      <td className="py-2 px-3">Initial Opening Balance Brought Forward</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(activeSupplier?.openingBalance || 0)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-400">-</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-800">
                        {formatCurrency(activeSupplier?.openingBalance || 0)}
                      </td>
                    </tr>

                    {activeSupplierDetails.history.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                          No transactions recorded for this supplier.
                        </td>
                      </tr>
                    ) : (
                      activeSupplierDetails.history.map(item => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">{formatDateDisplay(item.date)}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.type === 'Purchase'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">{item.ref}</td>
                          <td className="py-2 px-3 text-slate-700">{item.description}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {item.debitAmount > 0 ? formatCurrency(item.debitAmount) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                            {item.creditAmount > 0 ? formatCurrency(item.creditAmount) : '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-800 whitespace-nowrap">
                            {formatCurrency(item.balance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[11px]">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-right uppercase tracking-wider text-slate-700 font-black">
                        Total Purchases &amp; Payments Settled:
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-950 whitespace-nowrap">
                        {formatCurrency((activeSupplier?.openingBalance || 0) + activeSupplierDetails.totalPurchases)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-800 whitespace-nowrap">
                        {formatCurrency(activeSupplierDetails.totalPaid)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-rose-800 whitespace-nowrap">
                        {formatCurrency(activeSupplierDetails.netPayable)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Settlement Notes & Terms */}
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <p className="font-sans">
                  <span className="font-bold text-slate-800">Settlement Terms: </span>
                  Inward bulk tanker deliveries are reconciled against OMC gate passes &amp; computerized dip calibrations.
                </p>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                  <span className="font-mono font-black text-rose-700 text-sm">
                    {formatCurrency(activeSupplierDetails.netPayable)}
                  </span>
                </div>
              </div>

              {/* Signatures & Footer */}
              <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Authorized Signatory</span>
                  <span className="block text-[10px] text-slate-400">Diyal Filling Station Accounts</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                  <span className="font-bold text-slate-800">Supplier Acknowledgment</span>
                  <span className="block text-[10px] text-slate-400">{activeSupplier?.name}</span>
                </div>
              </div>

              <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>System Generated Official Document &bull; Diyal ERP</span>
                <span>Printed on: {new Date().toLocaleString('en-GB')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
