import React from 'react';
import MeterReadings from './MeterReadings';

// User requirement: Inside Meter & Daily Sales, directly render the Record Meter & Reconciliation workflow without the sub-tab switcher from Picture 1
export default function MeterDailySales({ onOpenQuickSale, onOpenReceipt }) {
  return (
    <MeterReadings
      onOpenQuickSale={onOpenQuickSale}
      onOpenReceipt={onOpenReceipt}
    />
  );
}
