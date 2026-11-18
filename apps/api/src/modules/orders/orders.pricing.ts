/**
 * Checkout arithmetic (BR-161, BR-98). Pure, integer paise only — no float ever
 * touches a money value (root CLAUDE.md 2.2).
 *
 *  - subtotal  = sum of the cart line totals
 *  - delivery  = the configured fee for a DELIVERY order whose subtotal is below the
 *                free-delivery threshold; 0 for pickup or at/above the threshold
 *  - gst       = round_half_up(subtotal * rate% / 100), once per order, on the goods
 *                subtotal (the same per-invoice formula as BR-98 / sales.math gstPaise)
 *  - discount  = 0 (no promotion engine exists; kept as a column for the future)
 *  - total     = subtotal + delivery + gst - discount
 */
import { fromPaise, parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import { gstPaise } from '../sales/sales.math.js';

export type DbFulfilmentType = 'PICKUP' | 'DELIVERY';

/** Client aliases (HOME_DELIVERY, WAREHOUSE_PICKUP) map onto the DB `fulfilment_type` enum. */
export function toDbFulfilmentType(value: string): DbFulfilmentType {
  return value === 'HOME_DELIVERY' || value === 'DELIVERY' ? 'DELIVERY' : 'PICKUP';
}

export interface CheckoutPricingInput {
  /** Cart line totals as stored (pg NUMERIC strings). */
  lineTotals: readonly string[];
  fulfilment: DbFulfilmentType;
  deliveryFee: Money;
  freeDeliveryThreshold: Money;
  /** GST rate in basis points of a percent (5% -> 500). */
  gstRateBasisPoints: number;
}

export interface CheckoutTotals {
  subtotal: Money;
  deliveryFee: Money;
  discount: Money;
  gstAmount: Money;
  totalAmount: Money;
}

export function computeCheckoutTotals(input: CheckoutPricingInput): CheckoutTotals {
  const subtotalPaise = input.lineTotals.reduce((acc, line) => acc + toPaise(parseMoney(line)), 0);
  const deliveryPaise =
    input.fulfilment === 'DELIVERY' && subtotalPaise < toPaise(input.freeDeliveryThreshold)
      ? toPaise(input.deliveryFee)
      : 0;
  const gst = gstPaise(subtotalPaise, input.gstRateBasisPoints);
  const discountPaise = 0;
  return {
    subtotal: fromPaise(subtotalPaise),
    deliveryFee: fromPaise(deliveryPaise),
    discount: fromPaise(discountPaise),
    gstAmount: fromPaise(gst),
    totalAmount: fromPaise(subtotalPaise + deliveryPaise + gst - discountPaise),
  };
}

/** Today's calendar date in Asia/Kolkata, `YYYY-MM-DD`. */
export function todayInKolkata(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
