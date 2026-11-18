/**
 * BR-182: customer-facing order display helpers. Pure, no I/O.
 *
 *  - paymentMethodLabel: human label for the payment_method enum ("Wallet").
 *  - pickupCode: a short human reference ("PICKUP-0039") derived from the order-number sequence so
 *    the customer can quote it at the counter. It is NOT the handover OTP (BR-20, unchanged: the OTP
 *    is still hashed, shown once at checkout and verified by staff) and grants nothing by itself.
 */
import type { FulfillmentType, PaymentMethod } from './orders.schema.js';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  WALLET: 'Wallet',
  CASH: 'Cash',
  NETBANKING: 'Net banking',
  UPI: 'UPI',
  CARD: 'Card',
};

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_LABELS[method] ?? method;
}

/** `TOH-2026-000039` -> `PICKUP-0039` (last four digits of the sequence); null if no digits. Pickup orders only. */
export function pickupCode(orderNumber: string, fulfillmentType: FulfillmentType): string | null {
  if (fulfillmentType !== 'PICKUP') return null;
  const seq = /(\d+)$/.exec(orderNumber)?.[1];
  if (seq === undefined) return null;
  return `PICKUP-${seq.slice(-4).padStart(4, '0')}`;
}
