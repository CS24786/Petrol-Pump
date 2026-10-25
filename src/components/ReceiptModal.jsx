import React, { useRef } from 'react';
import { Printer, X, Download, CheckCircle, Fuel } from 'lucide-react';
import { formatCurrency, formatNumber, formatDateDisplay } from '../utils/formatters';

export default function ReceiptModal({ sale, pumpSettings, onClose }) {
  const receiptRef = useRef(null);

  if (!sale) return null;

  const pumpName = pumpSettings?.pumpName || 'DIYAL FILLING STATION';
  const pumpAddress = pumpSettings?.pumpAddress || 'Chiniot Road, Chak Jhumra, FSD.';
  const pumpPhone = pumpSettings?.pumpPhone || '+92 300 7654321';
  const pumpNTN = pumpSettings?.pumpNTN || '4829103-7';

  const handlePrint = () => {
    window.print();
  };

  const isRetail = sale.isRetail || !sale.customerId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">Fuel Dispense Receipt / Bill</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Content - Styled for 80mm Thermal Slip and Screen View */}
        <div className="p-6 bg-white text-slate-900 font-mono text-xs overflow-y-auto max-h-[70vh] print-area" ref={receiptRef}>
          
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex items-center justify-center gap-2">
              <img src="./logo.png" alt="Diyal Logo" className="h-7 w-auto object-contain" onError={(e) => { e.target.src = './logo.jpg'; }} />
              <h2 className="text-base font-extrabold tracking-wide text-slate-950 font-sans">{pumpName}</h2>
            </div>
            <p className="text-[10px] text-slate-600">{pumpAddress}</p>
            <p className="text-[10px] text-slate-600">Tel: {pumpPhone} | NTN: {pumpNTN}</p>
            <div className="inline-block mt-1 px-2.5 py-0.5 border border-slate-900 font-bold text-[10px] uppercase">
              {isRetail ? 'WALK-IN RETAIL SALE RECEIPT' : 'REGULAR FLEET INVOICE'}
            </div>
          </div>

          {/* Meta Details */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Bill / Serial #:</span>
              <span className="font-bold">#{sale.serialNo || sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date:</span>
              <span className="font-bold">{formatDateDisplay(sale.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-bold">{isRetail ? 'Walk-in / Retail' : (sale.customerName || 'M.B GOODS')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle #:</span>
              <span className="font-bold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                {sale.vehicleNo || 'Retail'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Operator:</span>
              <span>{sale.operatorName || 'Cashier'}</span>
            </div>
          </div>

          {/* Transaction Items */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
            <div className="flex justify-between font-bold border-b border-slate-200 pb-1 text-[10px] text-slate-500 uppercase">
              <span>Item / Particulars</span>
              <span>Amount (PKR)</span>
            </div>

            {sale.litres > 0 ? (
              <div className="space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>{sale.fuelType || 'Diesel'} Fuel</span>
                  <span>{formatNumber(sale.dieselAmount, 0)}</span>
                </div>
                <div className="text-[10px] text-slate-600 flex justify-between">
                  <span>Quantity: {formatNumber(sale.litres, 2)} Ltr @ Rs {formatNumber(sale.rate, 2)}</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 italic">No fuel dispensed in this entry</div>
            )}

            {sale.cashAdvance > 0 && (
              <div className="flex justify-between">
                <span>Driver Cash Advance (CASH)</span>
                <span className="font-bold">{formatNumber(sale.cashAdvance, 0)}</span>
              </div>
            )}

            {sale.mobilOil > 0 && (
              <div className="flex justify-between">
                <span>Mobil Oil / Lubricant</span>
                <span className="font-bold">{formatNumber(sale.mobilOil, 0)}</span>
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between text-sm font-extrabold text-slate-950">
              <span>TOTAL BILLED:</span>
              <span>{formatCurrency(sale.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-emerald-700 font-bold">
              <span>Payment Received:</span>
              <span>{formatCurrency(sale.paidAmount || 0)}</span>
            </div>
            {!isRetail && (
              <div className="flex justify-between text-[11px] text-rose-600 font-bold">
                <span>Outstanding Balance:</span>
                <span>{formatCurrency(sale.outstandingAmount || 0)}</span>
              </div>
            )}
            <div className="text-[10px] text-slate-600 flex justify-between pt-1">
              <span>Payment Mode:</span>
              <span className="font-bold">{sale.paymentType || (isRetail ? 'Cash' : 'Credit Account')}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 pb-3 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-600">
            <div>
              <div className="border-t border-slate-400 pt-1">Customer / Driver Signature</div>
            </div>
            <div>
              <div className="border-t border-slate-400 pt-1">Authorized Pump Incharge</div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-2 text-[10px] text-slate-400">
            <p>Thank you for refueling at {pumpName}!</p>
            <p>Powered by Diyal Offline Desktop ERP</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Bill (Ctrl+P)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
