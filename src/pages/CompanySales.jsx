import React from 'react';
import TruckChallans from './TruckChallans';

export default function CompanySales({ onOpenPaymentModal, onOpenReceipt }) {
  return (
    <TruckChallans
      onOpenPaymentModal={onOpenPaymentModal}
      onOpenReceipt={onOpenReceipt}
    />
  );
}
