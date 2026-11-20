/**
 * Checkout arithmetic (BR-161, BR-98). Pure, integer paise only — no float ever
 * touches a money value (root CLAUDE.md 2.2).
 *
 *  - subtotal  = sum of the cart line totals
 *  - delivery  = the configured fee for a DELIVERY order whose subtotal is below the
 *                free-delivery threshold; 0 for pickup or at/above the threshold
 *  - gst       = round_half_up(subtotal * rate% / 100), once per order, on the goods
 *                subtotal (the same per-invoice formula as BR-98 / sales.math gstPaise)
 *  - handling  = the configured per-order handling fee (BR-200), pickup and delivery alike;
 *                not subject to GST (GST is on the goods subtotal only)
 *  - discount  = 0 (no promotion engine exists; kept as a column for the future)
 *  - total     = subtotal + delivery + handling + gst - discount
 *
 * BR-200: this is the ONE pricing function. `POST /orders/quote` and `POST /orders` both call it
 * with the same inputs, so a quote's total is the order total by construction.
 */
import { fromPaise, lessThan, parseMoney, subtract, toPaise, type Money } from '@tohfa/shared-types';
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
  /** BR-200: flat per-order handling fee; omitted means 0. */
  handlingFee?: Money | undefined;
  /** GST rate in basis points of a percent (5% -> 500). */
  gstRateBasisPoints: number;
}

export interface CheckoutTotals {
  subtotal: Money;
  deliveryFee: Money;
  handlingFee: Money;
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
  const handlingPaise = input.handlingFee === undefined ? 0 : toPaise(input.handlingFee);
  const gst = gstPaise(subtotalPaise, input.gstRateBasisPoints);
  const discountPaise = 0;
  return {
    subtotal: fromPaise(subtotalPaise),
    deliveryFee: fromPaise(deliveryPaise),
    handlingFee: fromPaise(handlingPaise),
    discount: fromPaise(discountPaise),
    gstAmount: fromPaise(gst),
    totalAmount: fromPaise(subtotalPaise + deliveryPaise + handlingPaise + gst - discountPaise),
  };
}

/**
 * BR-200 / BR-17: can this balance pay this total? The same comparison checkout makes before it
 * refuses with WALLET_INSUFFICIENT (BR-192 `shortfall` = total - balance), in integer paise.
 */
export function walletCoverage(balance: Money | string, total: Money): { sufficient: boolean; shortfall: Money } {
  const bal = parseMoney(balance);
  const short = lessThan(bal, total);
  return { sufficient: !short, shortfall: short ? subtract(total, bal) : fromPaise(0) };
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
