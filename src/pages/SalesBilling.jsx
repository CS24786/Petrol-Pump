import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Receipt, 
  Search, 
  Download, 
  PlusCircle, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  Fuel, 
  Users, 
  AlertCircle,
  Zap 
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay, exportToCSV } from '../utils/formatters';

export default function SalesBilling({ onOpenQuickSale, onOpenReceipt }) {
  const [activeTab, setActiveTab] = useState('new-sale'); // 'new-sale' or 'invoices'

  // Form State for New Sale
  const [isRetailSale, setIsRetailSale] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [serialNo, setSerialNo] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');
  const [litres, setLitres] = useState('');
  const [rate, setRate] = useState(397.45);
  const [dieselAmount, setDieselAmount] = useState('');
  const [cashAdvance, setCashAdvance] = useState('');
  const [mobilOil, setMobilOil] = useState('');
  const [paymentReceived, setPaymentReceived] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [formSuccessMsg, setFormSuccessMsg] = useState('');
  const [formErrorMsg, setFormErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invoices Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterFuel, setFilterFuel] = useState('All');
  const [filterCustomer, setFilterCustomer] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Queries
  const sales = useLiveQuery(() => db.sales.orderBy('id').reverse().toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const fuelRates = useLiveQuery(() => db.fuelRates.toArray(), []);
  const customerVehicles = useLiveQuery(
    () => customerId ? db.vehicles.where('customerId').equals(Number(customerId)).toArray() : [],
    [customerId]
  );
  const lastSale = useLiveQuery(() => db.sales.orderBy('id').last(), []);

  // Set default customer to M.B GOODS
  useEffect(() => {
    if (customers && customers.length > 0 && !customerId) {
      const mb = customers.find(c => c.name.includes('M.B GOODS')) || customers[0];
      setCustomerId(String(mb.id));
    }
  }, [customers, customerId]);

  // Set initial serial number
  useEffect(() => {
    if (lastSale?.serialNo) {
      const lastNum = parseInt(lastSale.serialNo, 10);
      setSerialNo(!isNaN(lastNum) ? String(lastNum + 1) : '1021');
    } else {
      setSerialNo('780');
    }
  }, [lastSale]);

  // Sync rate when fuelType or fuelRates change
  useEffect(() => {
    if (fuelRates) {
      const matched = fuelRates.find(r => r.fuelType.toLowerCase() === fuelType.toLowerCase());
      if (matched) {
        setRate(matched.rate);
      }
    }
  }, [fuelType, fuelRates]);

  // Auto-calculate fuel amount when litres change
  const handleLitresChange = (val) => {
    setLitres(val);
    const ltrNum = parseFloat(val);
    if (!isNaN(ltrNum) && ltrNum > 0) {
      const calcAmt = Math.round(ltrNum * rate);
      setDieselAmount(String(calcAmt));
    } else {
      setDieselAmount('');
    }
  };

  // Reverse calculate litres if amount is typed directly (especially useful in walk-in sales)
  const handleAmountChange = (val) => {
    setDieselAmount(val);
    const amtNum = parseFloat(val);
    if (!isNaN(amtNum) && amtNum > 0 && rate > 0) {
      const calcLtr = (amtNum / rate).toFixed(2);
      setLitres(String(calcLtr));
    }
  };

  // Calculations for current form
  const numLitres = parseFloat(litres) || 0;
  const numRate = parseFloat(rate) || 0;
  const numFuelAmt = parseFloat(dieselAmount) || 0;
  const numCash = isRetailSale ? 0 : (parseFloat(cashAdvance) || 0);
  const numOil = isRetailSale ? 0 : (parseFloat(mobilOil) || 0);
  const formulaPrice = Math.round(numLitres * numRate);
  const diff = numFuelAmt > 0 ? numFuelAmt - formulaPrice : 0;
  const totalAmount = numFuelAmt + numCash + numOil;

  // For walk-in sales, payment received is automatically the full total amount
  const numPaid = isRetailSale ? totalAmount : (parseFloat(paymentReceived) || 0);
  const outstandingAmount = Math.max(0, totalAmount - numPaid);

  const handleSaveSale = async (shouldPrint = false) => {
    setFormErrorMsg('');
    setFormSuccessMsg('');

    if (numLitres <= 0 && numCash <= 0 && numOil <= 0) {
      setFormErrorMsg('Please enter either fuel quantity/amount or driver cash advance.');
      return;
    }

    if (!isRetailSale && !customerId) {
      setFormErrorMsg('Please select a regular business customer account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCust = customers?.find(c => c.id === Number(customerId));

      const newSale = {
        date: transactionDate,
        serialNo: serialNo.trim(),
        customerId: isRetailSale ? null : Number(customerId),
        customerName: isRetailSale ? 'Walk-in / Retail' : (selectedCust ? selectedCust.name : 'M.B GOODS'),
        isRetail: isRetailSale,
        vehicleNo: isRetailSale ? 'Walk-in Retail' : (vehicleNo.trim().toUpperCase() || 'General'),
        transactionType: fuelType,
        fuelType: fuelType,
        litres: numLitres,
        rate: numRate,
        dieselAmount: numFuelAmt,
        cashAdvance: numCash,
        mobilOil: numOil,
        formulaPrice,
        difference: diff,
        totalAmount,
        paidAmount: numPaid,
        outstandingAmount,
        paymentType: isRetailSale ? 'Cash' : (outstandingAmount === 0 ? 'Cash/Paid' : (numPaid > 0 ? 'Partial' : 'Credit')),
        paymentStatus: outstandingAmount === 0 ? 'Paid' : (numPaid > 0 ? 'Partial' : 'Unpaid'),
        paymentMethod: isRetailSale ? paymentMethod : (numPaid > 0 ? paymentMethod : 'Credit'),
        operatorName: 'Cashier',
        notes: notes.trim(),
        createdAt: new Date().toISOString()
      };

      // Add to sales table
      const newId = await db.sales.add(newSale);
      newSale.id = newId;

      // Exactly once: Deduct stock from underground tank if fuel dispensed
      if (numLitres > 0) {
        const tank = await db.tanks.where('fuelType').equals(fuelType).first();
        if (tank) {
          const updatedStock = Math.max(0, (tank.currentStockLitres || 0) - numLitres);
          await db.tanks.update(tank.id, { currentStockLitres: updatedStock });
        }
      }

      // If customer made a payment at the time of sale, record in ledgerEntries
      if (!isRetailSale && numPaid > 0) {
        await db.ledgerEntries.add({
          customerId: Number(customerId),
          date: transactionDate,
          inAmount: numPaid,
          outAmount: 0,
          mobilOilAdv: 0,
          dieselAmount: 0,
          description: `On-spot payment against Bill #${newSale.serialNo || newId}`,
          receiptNo: `REC-${newSale.serialNo || newId}`,
          paymentMethod,
          createdAt: new Date().toISOString()
        });
      }

      setFormSuccessMsg(`Sale #${newSale.serialNo || newId} successfully recorded! Stock and ledgers updated.`);

      // Reset form fields
      setLitres('');
      setDieselAmount('');
      setCashAdvance('');
      setMobilOil('');
      setPaymentReceived('0');
      setNotes('');
      setVehicleNo('');
      
      // Auto-increment serial
      const nextSerial = parseInt(serialNo, 10);
      if (!isNaN(nextSerial)) {
        setSerialNo(String(nextSerial + 1));
      }

      if (shouldPrint && onOpenReceipt) {
        onOpenReceipt(newSale);
      }
    } catch (err) {
      setFormErrorMsg(err.message || 'Failed to save sales entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered sales for Bills & Invoices tab
  const filteredSales = useMemo(() => {
    if (!sales) return [];

    return sales.filter(s => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesVeh = s.vehicleNo?.toLowerCase().includes(query);
        const matchesSerial = s.serialNo?.toLowerCase().includes(query);
        const matchesCust = s.customerName?.toLowerCase().includes(query);
        if (!matchesVeh && !matchesSerial && !matchesCust) return false;
      }
      // Date filters
      if (filterStartDate && s.date < filterStartDate) return false;
      if (filterEndDate && s.date > filterEndDate) return false;

      // Fuel filter
      if (filterFuel !== 'All' && s.fuelType !== filterFuel) return false;

      // Customer filter
      if (filterCustomer === 'Retail') {
        if (!s.isRetail) return false;
      } else if (filterCustomer !== 'All') {
        if (s.customerId !== Number(filterCustomer)) return false;
      }

      // Status filter
      if (filterStatus === 'Paid' && (s.outstandingAmount || 0) > 0) return false;
      if (filterStatus === 'Unpaid' && (s.paidAmount || 0) > 0) return false;
      if (filterStatus === 'Partial' && ((s.paidAmount || 0) === 0 || (s.outstandingAmount || 0) === 0)) return false;

      return true;
    });
  }, [sales, searchQuery, filterStartDate, filterEndDate, filterFuel, filterCustomer, filterStatus]);

  // Aggregate totals for invoices
  const invoiceTotals = useMemo(() => {
    let count = filteredSales.length;
    let litres = 0;
    let totalAmt = 0;
    let paidAmt = 0;
    let outstanding = 0;

    filteredSales.forEach(s => {
      litres += (s.litres || 0);
      totalAmt += (s.totalAmount || 0);
      paidAmt += (s.paidAmount || 0);
      outstanding += (s.outstandingAmount || 0);
    });

    return { count, litres, totalAmt, paidAmt, outstanding };
  }, [filteredSales]);

  // Delete sale with confirmation
  const handleDeleteSale = async (sale) => {
    if (window.confirm(`Are you sure you want to delete Invoice #${sale.serialNo || sale.id}?`)) {
      // Revert stock if fuel was dispensed
      if (sale.litres > 0 && sale.fuelType) {
        const tank = await db.tanks.where('fuelType').equals(sale.fuelType).first();
        if (tank) {
          await db.tanks.update(tank.id, {
            currentStockLitres: (tank.currentStockLitres || 0) + sale.litres
          });
        }
      }
      await db.sales.delete(sale.id);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const exportRows = filteredSales.map(s => ({
      'Date': s.date,
      'Bill / Serial #': s.serialNo || s.id,
      'Customer / Profile': s.isRetail ? 'Walk-in Retail' : s.customerName,
      'Vehicle #': s.vehicleNo,
      'Fuel Type': s.fuelType,
      'Litres': s.litres,
      'Rate': s.rate,
      'Fuel Amount': s.dieselAmount,
      'Cash Advance': s.cashAdvance,
      'Mobil Oil': s.mobilOil,
      'Total Amount': s.totalAmount,
      'Payment Received': s.paidAmount,
      'Outstanding Balance': s.outstandingAmount,
      'Payment Status': s.paymentStatus || (s.outstandingAmount === 0 ? 'Paid' : 'Credit')
    }));
    exportToCSV(`Fuel_Sales_Invoices_${new Date().toISOString().slice(0, 10)}.csv`, exportRows);
  };

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Header & Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Sales & Fuel Billing
          </h2>
          <p className="text-xs text-slate-500">
            Fast dispensing entry for regular business customer accounts and walk-in cash retail
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenQuickSale && (
            <button
              onClick={onOpenQuickSale}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Quick Retail (F2)</span>
            </button>
          )}

          {/* Sub-navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('new-sale')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'new-sale'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Sale Entry</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Bills & Invoices History</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: NEW SALE FORM */}
      {activeTab === 'new-sale' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
          
          {/* Sale Type Selector (Regular Business Customer vs Walk-in Retail) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Sales Workflow Mode:
              </span>
              <p className="text-[11px] text-slate-500">
                {isRetailSale 
                  ? 'Retail Walk-in: Dispenses fuel on-spot with instant cash. No customer account or ledger created.' 
                  : 'Regular Business Customer: Linked to business account ledger with vehicle logs, driver advances & billing.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setIsRetailSale(false)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  !isRetailSale
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Regular Customer</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRetailSale(true)}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  isRetailSale
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Fuel className="w-3.5 h-3.5" />
                <span>Walk-in / Retail</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {formErrorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formErrorMsg}</span>
            </div>
          )}

          {formSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{formSuccessMsg}</span>
              </div>
              <button
                onClick={() => setFormSuccessMsg('')}
                className="text-[11px] underline text-emerald-700 font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Serial / Bill # */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serial / Bill Number *
              </label>
              <input
                type="text"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                placeholder="e.g. 789"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fuel Product *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFuelType('Diesel')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    fuelType === 'Diesel'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Diesel (HSD)
                </button>
                <button
                  type="button"
                  onClick={() => setFuelType('Petrol')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    fuelType === 'Petrol'
                      ? 'bg-emerald-600 text-white border-emerald-700 font-extrabold shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Petrol (PMG)
                </button>
              </div>
            </div>

            {/* Regular Customer Account selector (Hidden if Walk-in) */}
            {!isRetailSale ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Regular Business Customer *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      setVehicleNo('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Customer Account --</option>
                    {customers?.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} &bull; {c.company || 'Business Account'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value)}
                    placeholder="e.g. 5244, 8658, 6219"
                    list="registeredVehicles"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                  />
                  <datalist id="registeredVehicles">
                    {customerVehicles?.map(v => (
                      <option key={v.id} value={v.vehicleNo} />
                    ))}
                  </datalist>
                </div>
              </>
            ) : (
              <div className="md:col-span-2 p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Retail Walk-in Customer:</strong> No customer profile or registration required. Sale will be included in daily sales totals and deduct tank stock immediately.
                </span>
              </div>
            )}

            {/* Rate Per Litre */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rate Per Litre (PKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => {
                  const newR = parseFloat(e.target.value) || 0;
                  setRate(newR);
                  if (numLitres > 0) {
                    setDieselAmount(String(Math.round(numLitres * newR)));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Litres Dispensed */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fuel Quantity (Litres)
              </label>
              <input
                type="number"
                step="0.01"
                value={litres}
                onChange={(e) => handleLitresChange(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Fuel Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fuel Amount (PKR) = Litres &times; Rate
              </label>
              <input
                type="number"
                value={dieselAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Auto-calculated or enter amount"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Additional Regular Customer Fields (Driver Cash Advance & Mobil Oil from Oct-26 sheet) */}
            {!isRetailSale && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Driver Cash Advance (PKR)
                  </label>
                  <input
                    type="number"
                    value={cashAdvance}
                    onChange={(e) => setCashAdvance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobil Oil / Lubricant (PKR)
                  </label>
                  <input
                    type="number"
                    value={mobilOil}
                    onChange={(e) => setMobilOil(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Received (PKR)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={paymentReceived}
                      onChange={(e) => setPaymentReceived(e.target.value)}
                      placeholder="0 for full credit"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shrink-0"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online">Online</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <div className={isRetailSale ? 'md:col-span-1' : 'md:col-span-3'}>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Pump bay 1, driver token #, shift notes"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

          </div>

          {/* Real-time Financial Breakdown Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Fuel Litres</span>
                <span className="text-base font-bold text-slate-800 font-mono">
                  {formatNumber(numLitres, 2)} L
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Fuel Amount</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {formatCurrency(numFuelAmt)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Net Total Billed</span>
                <span className="text-base font-black text-blue-700 font-mono">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                  {isRetailSale ? 'Cash Paid' : 'Outstanding Credit'}
                </span>
                <span className={`text-base font-bold font-mono ${
                  isRetailSale ? 'text-emerald-700' : (outstandingAmount > 0 ? 'text-amber-700' : 'text-emerald-700')
                }`}>
                  {formatCurrency(isRetailSale ? totalAmount : outstandingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setLitres('');
                setDieselAmount('');
                setCashAdvance('');
                setMobilOil('');
                setPaymentReceived('0');
                setNotes('');
                setVehicleNo('');
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
            >
              Reset Form
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveSale(false)}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              Save Sale
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveSale(true)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Save &amp; Print Bill</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: BILLS & INVOICES HISTORY */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          
          {/* Aggregate KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Invoices</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{invoiceTotals.count}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Fuel Dispensed</span>
              <span className="text-lg font-bold text-slate-900 font-mono">{formatNumber(invoiceTotals.litres, 2)} L</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Billed</span>
              <span className="text-lg font-bold text-blue-700 font-mono">{formatCurrency(invoiceTotals.totalAmt)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Received</span>
              <span className="text-lg font-bold text-emerald-700 font-mono">{formatCurrency(invoiceTotals.paidAmt)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Outstanding Balance</span>
              <span className="text-lg font-bold text-rose-600 font-mono">{formatCurrency(invoiceTotals.outstanding)}</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search vehicle, bill #, customer..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Start Date */}
              <div>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  title="Start Date"
                />
              </div>

              {/* End Date */}
              <div>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  title="End Date"
                />
              </div>

              {/* Customer Selector */}
              <div>
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All Customer Accounts</option>
                  <option value="Retail">Walk-in / Retail Cash</option>
                  {customers?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Selector */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All Payment Statuses</option>
                  <option value="Paid">Fully Paid</option>
                  <option value="Partial">Partially Paid</option>
                  <option value="Unpaid">Unpaid / Credit</option>
                </select>
              </div>

            </div>

            {/* Action Bar (Export CSV, Clear Filters) */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500 font-medium">
                Showing {filteredSales.length} invoice records
              </div>

              <div className="flex items-center gap-2">
                {(searchQuery || filterStartDate || filterEndDate || filterFuel !== 'All' || filterCustomer !== 'All' || filterStatus !== 'All') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setFilterFuel('All');
                      setFilterCustomer('All');
                      setFilterStatus('All');
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Bill #</th>
                    <th className="py-2.5 px-3">Customer Profile</th>
                    <th className="py-2.5 px-3">Vehicle #</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3 text-right">Litres</th>
                    <th className="py-2.5 px-3 text-right">Rate</th>
                    <th className="py-2.5 px-3 text-right">Fuel Amt</th>
                    <th className="py-2.5 px-3 text-right">Adv / Oil</th>
                    <th className="py-2.5 px-3 text-right">Total Billed</th>
                    <th className="py-2.5 px-3 text-right">Received</th>
                    <th className="py-2.5 px-3 text-right">Outstanding</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {formatDateDisplay(s.date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        #{s.serialNo || s.id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {s.isRetail ? (
                          <span className="text-slate-500 italic">Walk-in / Retail</span>
                        ) : (
                          s.customerName || 'M.B GOODS'
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                        {s.vehicleNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.fuelType === 'Diesel'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : s.fuelType === 'Petrol'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.fuelType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {s.litres > 0 ? formatNumber(s.litres, 2) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {s.rate > 0 ? formatNumber(s.rate, 2) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {s.dieselAmount > 0 ? formatNumber(s.dieselAmount, 0) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        {(s.cashAdvance || 0) + (s.mobilOil || 0) > 0 
                          ? formatNumber((s.cashAdvance || 0) + (s.mobilOil || 0), 0) 
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(s.totalAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatNumber(s.paidAmount || 0, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-bold">
                        {formatNumber(s.outstandingAmount || 0, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          (s.outstandingAmount || 0) === 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (s.paidAmount || 0) > 0
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {(s.outstandingAmount || 0) === 0 ? 'Paid' : ((s.paidAmount || 0) > 0 ? 'Partial' : 'Credit')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenReceipt(s)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                            title="View &amp; Print Bill / Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(s)}
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
