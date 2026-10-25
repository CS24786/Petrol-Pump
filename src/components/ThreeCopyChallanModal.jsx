import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { 
  Printer, 
  X, 
  Fuel, 
  ShieldCheck, 
  FileText, 
  User, 
  Building2, 
  Truck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay } from '../utils/formatters';

export default function ThreeCopyChallanModal({ challan, pumpSettings, onClose }) {
  const [activeView, setActiveView] = useState('all'); // 'all', 'pump', 'driver', 'company'

  // Query latest purchases for purchase cost estimation
  const purchases = useLiveQuery(() => db.purchases.toArray(), []);
  const customer = useLiveQuery(
    () => challan?.customerId ? db.customers.get(challan.customerId) : null,
    [challan?.customerId]
  );

  if (!challan) return null;

  const pumpName = pumpSettings?.pumpName || 'DIYAL FILLING STATION';
  const pumpAddress = pumpSettings?.pumpAddress || 'Chiniot Road, Chak Jhumra, FSD.';
  const pumpPhone = pumpSettings?.pumpPhone || '+92 300 7654321 / +92 321 9876543';
  const pumpNTN = pumpSettings?.pumpNTN || '4829103-7';

  // Find latest purchase rate for this fuel type
  const matchedPurchase = purchases
    ?.filter(p => p.fuelType?.toLowerCase() === (challan.fuelType || 'diesel').toLowerCase() && p.purchaseRate > 0)
    ?.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const purchaseCostPerLitre = matchedPurchase?.purchaseRate || (challan.fuelType === 'Petrol' ? 388.00 : 385.50);
  const hasCostInfo = Boolean(purchaseCostPerLitre);

  // Profit Calculations for Copy 1
  const fuelSalesAmount = challan.dieselAmount || (challan.litres * challan.rate) || 0;
  const fuelCostTotal = hasCostInfo ? (challan.litres * purchaseCostPerLitre) : null;
  const fuelProfit = hasCostInfo ? (fuelSalesAmount - fuelCostTotal) : null;
  const profitMarginPct = hasCostInfo && fuelSalesAmount > 0 
    ? ((fuelProfit / fuelSalesAmount) * 100).toFixed(1) 
    : null;

  // Mobil Oil profit if applicable (estimated purchase cost is ~80% of retail or known)
  const mobilSalesAmount = challan.mobilOil || 0;
  const mobilCost = mobilSalesAmount > 0 ? (mobilSalesAmount * 0.82) : 0;
  const mobilProfit = mobilSalesAmount > 0 ? (mobilSalesAmount - mobilCost) : 0;

  const handlePrint = () => {
    window.print();
  };

  // Reusable Single Challan Copy Card
  const renderChallanSlip = (copyType) => {
    const isPump = copyType === 'pump';
    const isDriver = copyType === 'driver';
    const isCompany = copyType === 'company';

    const copyTitle = isPump 
      ? 'COPY 1: PETROL PUMP RECORD (INTERNAL)' 
      : isDriver 
      ? 'COPY 2: TRUCK DRIVER COPY' 
      : 'COPY 3: COMPANY ACCOUNT COPY';

    const copyColorBadge = isPump
      ? 'bg-amber-100 text-amber-900 border-amber-300'
      : isDriver
      ? 'bg-blue-100 text-blue-900 border-blue-300'
      : 'bg-emerald-100 text-emerald-900 border-emerald-300';

    return (
      <div 
        key={copyType} 
        className={`bg-white text-slate-900 p-5 rounded-xl border border-slate-300 shadow-xs text-xs font-mono mb-4 break-inside-avoid print:shadow-none print:border-slate-800 ${
          activeView !== 'all' && activeView !== copyType ? 'hidden print:block' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center pb-2.5 border-b border-dashed border-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-sans font-extrabold text-slate-500 uppercase tracking-wider">
              Diyal Filling Station ERP
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${copyColorBadge}`}>
              {copyTitle}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-1">
            <img src="./logo.png" alt="Diyal Logo" className="h-6 w-auto object-contain" onError={(e) => { e.target.src = './logo.jpg'; }} />
            <h3 className="text-base font-black font-sans text-slate-950">
              {pumpName}
            </h3>
          </div>
          <p className="text-[10px] text-slate-600">{pumpAddress}</p>
          <p className="text-[10px] text-slate-600">Tel: {pumpPhone} | NTN: {pumpNTN}</p>
        </div>

        {/* Challan & Vehicle Info */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 py-2 border-b border-dashed border-slate-300 text-[11px]">
          <div>
            <span className="text-slate-500">Challan #: </span>
            <span className="font-bold font-mono">#{challan.serialNo || challan.id}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Date: </span>
            <span className="font-bold">{formatDateDisplay(challan.date)}</span>
          </div>

          <div>
            <span className="text-slate-500">Company: </span>
            <span className="font-bold">{challan.customerName || customer?.name || 'M.B GOODS'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Truck / Vehicle #: </span>
            <span className="font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {challan.vehicleNo || 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-slate-500">Driver: </span>
            <span>{challan.driverName || `Driver (${challan.vehicleNo || ''})`}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Operator: </span>
            <span>{challan.operatorName || 'Cashier / Incharge'}</span>
          </div>
        </div>

        {/* Particulars Table */}
        <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5">
          <div className="flex justify-between font-bold text-[10px] text-slate-500 border-b border-slate-200 pb-1 uppercase">
            <span>Particulars / Item</span>
            <span>Rate</span>
            <span>Qty / Litres</span>
            <span className="text-right">Amount (PKR)</span>
          </div>

          {/* Fuel Item */}
          {challan.litres > 0 && (
            <div className="flex justify-between items-center py-0.5 font-bold">
              <span>{challan.fuelType || 'Diesel'} Fuel</span>
              <span className="font-normal font-mono">Rs {formatNumber(challan.rate, 2)}</span>
              <span className="font-mono">{formatNumber(challan.litres, 2)} Ltr</span>
              <span className="font-mono text-right">{formatNumber(fuelSalesAmount, 0)}</span>
            </div>
          )}

          {/* Mobil Oil Item */}
          {challan.mobilOil > 0 && (
            <div className="flex justify-between items-center py-0.5">
              <span>Mobil Oil / Lube</span>
              <span className="font-normal font-mono">-</span>
              <span className="font-mono">{challan.mobilOilLitres ? `${challan.mobilOilLitres} Ltr` : '1 Unit'}</span>
              <span className="font-bold font-mono text-right">{formatNumber(challan.mobilOil, 0)}</span>
            </div>
          )}

          {/* Cash Advance Item */}
          {challan.cashAdvance > 0 && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-indigo-900 font-semibold">Driver Travel Cash Advance</span>
              <span className="font-normal font-mono">-</span>
              <span className="font-mono">Cash</span>
              <span className="font-bold font-mono text-right">{formatNumber(challan.cashAdvance, 0)}</span>
            </div>
          )}
        </div>

        {/* Totals & Payments */}
        <div className="py-2 border-b border-dashed border-slate-300 space-y-1">
          <div className="flex justify-between text-xs font-black">
            <span>TOTAL CHALLAN AMOUNT:</span>
            <span className="font-mono">{formatCurrency(challan.totalAmount || (fuelSalesAmount + challan.cashAdvance + challan.mobilOil))}</span>
          </div>

          <div className="flex justify-between text-[11px] text-emerald-800 font-semibold">
            <span>Payment Received / Adjusted:</span>
            <span className="font-mono">{formatCurrency(challan.paidAmount || 0)}</span>
          </div>

          <div className="flex justify-between text-[11px] text-rose-700 font-bold">
            <span>Remaining Amount Due:</span>
            <span className="font-mono">{formatCurrency(challan.outstandingAmount ?? (challan.totalAmount - (challan.paidAmount || 0)))}</span>
          </div>

          {/* Company Copy displays customer running/previous balance if available */}
          {isCompany && customer && (
            <div className="pt-1 mt-1 border-t border-slate-100 flex justify-between text-[10px] text-slate-600 font-semibold">
              <span>Customer Account Outstanding:</span>
              <span className="font-mono text-slate-900">{formatCurrency(customer.currentBalance || customer.openingBalance || 0)}</span>
            </div>
          )}
        </div>

        {/* CONFIDENTIAL INTERNAL COST & PROFIT SECTION (ONLY on Copy 1) */}
        {isPump ? (
          <div className="my-2.5 p-2 rounded bg-amber-50/80 border border-amber-300/80 text-[10px]">
            <div className="flex items-center gap-1 font-bold text-amber-900 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Internal Confidential Cost & Profit (Pump Record Only)</span>
            </div>
            
            {hasCostInfo ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block text-[9px]">Purchase Cost/Ltr:</span>
                  <span className="font-bold">Rs {formatNumber(purchaseCostPerLitre, 2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Total Fuel Cost:</span>
                  <span className="font-bold">{formatCurrency(fuelCostTotal)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Fuel Profit:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(fuelProfit)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Profit Margin:</span>
                  <span className="font-bold text-blue-700">{profitMarginPct}%</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic">
                Purchase cost data currently unavailable. Profit not calculated.
              </div>
            )}

            <div className="mt-1 text-[9px] text-amber-800">
              * Note: Driver Cash Advance (Rs {formatNumber(challan.cashAdvance || 0, 0)}) is an advance payout and excluded from fuel profit.
            </div>
          </div>
        ) : (
          /* Driver and Company copies strictly omit internal cost/profit */
          null
        )}

        {/* Signatures */}
        <div className="pt-5 pb-1 grid grid-cols-2 gap-6 text-center text-[10px] text-slate-600">
          <div>
            <div className="border-t border-slate-400 pt-1">
              {isDriver ? 'Driver Signature' : 'Authorized Receiver'}
            </div>
          </div>
          <div>
            <div className="border-t border-slate-400 pt-1">
              Authorized Station Incharge
            </div>
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[92vh]">
        
        {/* Modal Header & Copy Selectors */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Challan #{challan.serialNo || challan.id} &bull; 3 Official Copies
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Pump Internal Record, Truck Driver Copy, and Company Account Copy
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Toggle Bar (Filter which copy to preview) */}
        <div className="px-5 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2 text-xs no-print">
          <span className="text-slate-500 font-medium">Preview Copy:</span>
          <button
            onClick={() => setActiveView('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeView === 'all' ? 'bg-white shadow-xs text-blue-700 font-bold border border-slate-200' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            All 3 Copies
          </button>
          <button
            onClick={() => setActiveView('pump')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeView === 'pump' ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Copy 1 (Pump Internal)
          </button>
          <button
            onClick={() => setActiveView('driver')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeView === 'driver' ? 'bg-blue-100 text-blue-900 font-bold border border-blue-300' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Copy 2 (Truck Driver)
          </button>
          <button
            onClick={() => setActiveView('company')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              activeView === 'company' ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Copy 3 (Company Account)
          </button>
        </div>

        {/* Printable Scroll Container */}
        <div className="p-5 overflow-y-auto flex-1 bg-slate-100/60 print-area">
          {renderChallanSlip('pump')}
          {renderChallanSlip('driver')}
          {renderChallanSlip('company')}
        </div>

        {/* Modal Action Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between no-print">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single source challan &bull; No duplicate sales recorded</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {activeView === 'all' ? 'All 3 Copies' : 'Selected Copy'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
