/**
 * Display helpers for orders (status labels, IST dates, badges). Pure functions:
 * every value comes from the API (`OrderSummary` / `Order` / `OrderTracking`).
 */
import { isPickupFulfillment, type DeliverySlot } from '../api/orders';

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  CONFIRMED: 'Order confirmed',
  PACKED: 'Packed',
  DISPATCHED: 'On the way',
  READY_FOR_PICKUP: 'Ready to collect',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  PICKED_UP: 'Collected',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

/** Human label of an order status; an unknown future value reads "In progress". */
export function orderStatusLabel(status: string | null | undefined): string {
  return (status && STATUS_LABEL[status]) || 'In progress';
}

export const SLOT_LABELS: Record<DeliverySlot, string> = {
  MORNING_8_12: '8 AM - 12 PM',
  AFTERNOON_12_4: '12 PM - 4 PM',
  EVENING_4_8: '4 PM - 8 PM',
};

/** `dd/MM/yyyy` in Asia/Kolkata for a timestamp or a YYYY-MM-DD date. */
export function formatIstDate(value: string | null | undefined): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  const t = Date.parse(value);
  if (Number.isNaN(t)) return '';
  const ist = new Date(t + 330 * 60_000);
  const dd = String(ist.getUTCDate()).padStart(2, '0');
  const mm = String(ist.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${ist.getUTCFullYear()}`;
}

/** YYYY-MM-DD in IST `addDays` from `now`. */
function istDay(now: number, addDays: number): string {
  return new Date(now + 330 * 60_000 + addDays * 86_400_000).toISOString().slice(0, 10);
}

/** The pill on an active order row: "Arrive today/tomorrow", "Ready to collect", or the status. */
export function activeOrderBadge(
  o: { status: string; fulfillmentType?: string | null | undefined; deliveryDate?: string | null | undefined },
  now: number = Date.now(),
): string {
  if (isPickupFulfillment(o.fulfillmentType)) {
    return o.status === 'READY_FOR_PICKUP' ? 'Ready to collect' : orderStatusLabel(o.status);
  }
  if (o.deliveryDate === istDay(now, 0)) return 'Arrive Today';
  if (o.deliveryDate === istDay(now, 1)) return 'Arrive Tomorrow';
  return orderStatusLabel(o.status);
}
