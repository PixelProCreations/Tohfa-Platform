/**
 * BR-182: customer-facing order display helpers. Pure, no I/O.
 *
 *  - paymentMethodLabel: human label for the payment_method enum ("Wallet").
 *  - pickupCode: a short human reference ("PICKUP-0039") derived from the order-number sequence so
 *    the customer can quote it at the counter. It is NOT the handover OTP (BR-20, unchanged: the OTP
 *    is still hashed, shown once at checkout and verified by staff) and grants nothing by itself.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
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

/**
 * BR-194: the pickup QR payload a customer shows at the counter. Carries ONLY the order number and
 * the pickup code, plus an HMAC so staff can verify it offline-of-database before looking the order
 * up. It never carries the handover OTP (BR-20) and grants nothing by itself: the handover still
 * needs the OTP. Format: `TOHFA|PICKUP|v1|<orderNumber>|<pickupCode>|<sig>` where `sig` is the
 * first 22 base64url characters of HMAC-SHA256(key, `v1|<orderNumber>|<pickupCode>`) and `key` is
 * HMAC-SHA256(secret, 'tohfa.pickup-qr.v1') (domain-separated from JWT signing).
 */
const QR_PREFIX = 'TOHFA|PICKUP|v1';

function qrSignature(secret: string, orderNumber: string, code: string): string {
  const key = createHmac('sha256', secret).update('tohfa.pickup-qr.v1').digest();
  return createHmac('sha256', key).update(`v1|${orderNumber}|${code}`).digest('base64url').slice(0, 22);
}

export function pickupQr(
  orderNumber: string,
  fulfillmentType: FulfillmentType,
  secret: string,
): { payload: string } | null {
  const code = pickupCode(orderNumber, fulfillmentType);
  if (code === null) return null;
  return { payload: `${QR_PREFIX}|${orderNumber}|${code}|${qrSignature(secret, orderNumber, code)}` };
}

/** Staff-side check: returns the order number and pickup code when the signature is genuine. */
export function verifyPickupQr(
  payload: string,
  secret: string,
): { orderNumber: string; pickupCode: string } | null {
  const parts = payload.split('|');
  if (parts.length !== 6 || parts.slice(0, 3).join('|') !== QR_PREFIX) return null;
  const [, , , orderNumber, code, sig] = parts as [string, string, string, string, string, string];
  const expected = Buffer.from(qrSignature(secret, orderNumber, code));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { orderNumber, pickupCode: code };
}
