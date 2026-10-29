/**
 * Pure mapping functions for the warehouse order screens (design module M5).
 *
 * These functions translate API DTOs (api/orders.ts) into the screen display
 * shapes. No React, no network: unit-tested in plain-Node vitest.
 *
 * BR-99: The customer list (OrderSummaryDto) carries no buyer PII; the
 * allow-list means adding a field to the DTO cannot leak it here.
 * BR-16: No farmerId, farm name or batch GPS is passed through.
 */
import { parseMoney, toPaise } from '@tohfa/shared-types';
import { formatPaise } from '../../../money/paise';
import type {
  AdminOrderLineDto,
  AdminOrderStatus,
  FulfillmentType,
  AdminFulfilmentType,
  OrderSummaryDto,
} from '../../../api/orders';
import type { BatchDto } from '../../../api/inventory';
import { t, type TranslationKey } from '../../../i18n';

// ─── Shared display types ─────────────────────────────────────────────────────

/** One line of an order rendered on the detail screen. */
export interface OrderDetailLine {
  name: string;
  grade: string;
  qtyDetail: string;
  price: string;
}

/**
 * One row of the order list (structural match of OrdersListScreen's `OrderRow`).
 * Defined here so mappers can be tested without importing from the screen.
 */
export interface OrderListRow {
  /** The order uuid: what the screens navigate and call the API with (BR-99). */
  id: string;
  /** The human code (`ORD-…`), for display and search only. */
  orderNumber: string;
  warehouseId: string;
  warehouseName: string;
  /** BR-99: the summary carries no buyer name. Always '—'. */
  customer: string;
  status: string;
  items: string;
  amount: string;
  fulfillment: 'Pickup' | 'Delivery';
  time: string;
  action: string;
  actionScreen: string;
  actionStep?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map an API grade string to a display label. */
export function gradeDisplayLabel(grade: string): string {
  const MAP: Record<string, string> = {
    GRADE_1: 'Grade 1',
    GRADE_2: 'Grade 2',
    GRADE_3: 'Grade 3',
    REJECT: 'Reject',
  };
  return MAP[grade] ?? grade;
}

/** Format a Money decimal string to "₹N,NNN" display. */
export function formatMoney(money: string | null | undefined): string {
  if (!money) return '—';
  try {
    return formatPaise(toPaise(parseMoney(money)));
  } catch {
    return '—';
  }
}

/** Format an ISO timestamp to a short date-time string for list display. */
export function formatOrderTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return isToday ? `Today · ${time}` : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ` · ${time}`;
}

// ─── Status display ───────────────────────────────────────────────────────────

/** Human display label for an order status, as shown in OrdersListScreen rows. */
export function orderStatusLabel(status: string): string {
  const MAP: Record<string, string> = {
    PENDING_PAYMENT: 'Pending Payment',
    CONFIRMED: 'Confirmed',
    PACKED: 'Packing',
    DISPATCHED: 'Dispatched',
    READY_FOR_PICKUP: 'Ready for Pickup',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Completed',
    PICKED_UP: 'Completed',
    CANCELLED: 'Cancelled',
    RETURNED: 'Returned',
  };
  return MAP[status] ?? status;
}

/** Colour tone (matches TONE_COLORS in OrdersListScreen) for a status. */
export function orderStatusTone(status: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' {
  if (status === 'CONFIRMED') return 'info';
  if (status === 'PACKED' || status === 'DISPATCHED' || status === 'OUT_FOR_DELIVERY') return 'warning';
  if (status === 'READY_FOR_PICKUP') return 'warning';
  if (status === 'DELIVERED' || status === 'PICKED_UP') return 'success';
  if (status === 'CANCELLED' || status === 'RETURNED') return 'danger';
  return 'neutral';
}

/** Broad category for a status (used by order queue tabs). */
export function orderCategoryOf(status: string): 'Pending' | 'Completed' | 'Cancelled' {
  if (status === 'DELIVERED' || status === 'PICKED_UP') return 'Completed';
  if (status === 'CANCELLED' || status === 'RETURNED') return 'Cancelled';
  return 'Pending';
}

/** Payment status display label. */
export function paymentStatusLabel(paymentStatus: string): string {
  const MAP: Record<string, string> = {
    PENDING: 'Pending',
    PAID: 'Paid',
    PARTIALLY_PAID: 'Partial',
    REFUNDED: 'Refunded',
    REFUND_DUE: 'Refund Due',
    FAILED: 'Failed',
  };
  return MAP[paymentStatus] ?? paymentStatus;
}

/** Sales channel display label. */
export function channelLabel(channel: string): string {
  const MAP: Record<string, string> = {
    ONLINE: 'Online',
    MARKET: 'Market Day',
    DIRECT: 'Direct',
    HORECA: 'HORECA',
    B2B: 'B2B',
  };
  return MAP[channel] ?? channel;
}

/** Delivery slot display label (i18n); an unknown slot shows its code rather than a guess. */
export function deliverySlotLabel(slot: string | null | undefined): string {
  if (!slot) return t('orders.noValue');
  const MAP: Record<string, TranslationKey> = {
    MORNING_8_12: 'orders.deliverySlot.MORNING_8_12',
    AFTERNOON_12_4: 'orders.deliverySlot.AFTERNOON_12_4',
    EVENING_4_8: 'orders.deliverySlot.EVENING_4_8',
  };
  const key = MAP[slot];
  return key ? t(key) : slot;
}

/** "1 Item" / "N Items" (i18n). */
export function itemCountLabel(count: number): string {
  return count === 1 ? t('orders.items.one') : t('orders.items.many', { count });
}

/**
 * Normalise fulfillment type from either the list format
 * ('WAREHOUSE_PICKUP'/'HOME_DELIVERY'/'PICKUP'/'DELIVERY') or the detail format ('PICKUP'/'DELIVERY')
 * to the screen's 'Pickup' | 'Delivery' value.
 */
export function fulfillmentTypeOf(
  listType: FulfillmentType | null | undefined,
  detailType: AdminFulfilmentType | null | undefined,
): 'Pickup' | 'Delivery' {
  if (listType === 'WAREHOUSE_PICKUP' || listType === 'PICKUP' || detailType === 'PICKUP') return 'Pickup';
  if (listType === 'HOME_DELIVERY' || listType === 'DELIVERY' || detailType === 'DELIVERY') return 'Delivery';
  // Heuristic: unknown types default to Pickup for Pending orders (most common)
  return 'Pickup';
}

// ─── Action derivation ────────────────────────────────────────────────────────

/**
 * Determine the next action label, target screen and optional step for an
 * order row in the list. The action drives the row's button and the Flow's
 * navigation when the user taps it.
 *
 * Screen keys and steps mirror OrdersFlow routing (./OrdersFlow.tsx):
 *   M5S04 OrderDetail      M5S05 StockCheck        M5S07 PackingScreen
 *   M5S11 PickupOtp        M5S13 DeliveryPrep       M5S16 OrderIssue
 */
function deriveOrderAction(
  status: AdminOrderStatus | string,
  fulfillment: 'Pickup' | 'Delivery',
): { action: string; actionScreen: string; actionStep?: string } {
  switch (status) {
    case 'CONFIRMED':
      return { action: 'Check Stock', actionScreen: 'M5S05' };
    case 'PACKED':
      if (fulfillment === 'Pickup') {
        return { action: 'Ready for Pickup', actionScreen: 'M5S07', actionStep: 'confirm' };
      }
      return { action: 'Prepare Delivery', actionScreen: 'M5S13' };
    case 'READY_FOR_PICKUP':
      return { action: 'Verify Pickup', actionScreen: 'M5S11', actionStep: 'verify' };
    case 'OUT_FOR_DELIVERY':
      return { action: 'View Order', actionScreen: 'M5S04' };
    default:
      return { action: 'View Order', actionScreen: 'M5S04' };
  }
}

// ─── toOrderRow ───────────────────────────────────────────────────────────────

/**
 * Map an `OrderSummaryDto` (list endpoint) to the `OrderRow` shape the
 * OrdersListScreen renders. `warehouseName` is looked up from the caller's
 * warehouse map because OrderSummaryDto carries only `warehouseId`.
 */
export function toOrderRow(dto: OrderSummaryDto, warehouseName: string): OrderListRow {
  const fulfillment = fulfillmentTypeOf(dto.fulfillmentType ?? null, null);
  const { action, actionScreen, actionStep } = deriveOrderAction(dto.status, fulfillment);
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    warehouseId: dto.warehouseId ?? '',
    warehouseName,
    customer: dto.customerName ?? '—',
    status: orderStatusLabel(dto.status),
    items: itemCountLabel(dto.itemCount ?? 0),
    amount: formatMoney(dto.totalAmount),
    fulfillment,
    time: formatOrderTime(dto.placedAt),
    action,
    actionScreen,
    ...(actionStep !== undefined ? { actionStep } : {}),
  };
}

// ─── toOrderDetailLines ───────────────────────────────────────────────────────

/**
 * Map order line DTOs to the detail screen's display rows.
 * BR-99: no batchId, no farmerId in the output.
 */
export function toOrderDetailLines(items: AdminOrderLineDto[]): OrderDetailLine[] {
  return items.map((item) => ({
    name: item.name,
    grade: gradeDisplayLabel(item.grade),
    qtyDetail: `${item.qtyKg} KG × ${formatMoney(item.unitPrice)}`,
    price: formatMoney(item.lineTotal),
  }));
}

// ─── Stock Check ─────────────────────────────────────────────────────────────

export interface StockCheckRow {
  name: string;
  status: 'Available' | 'Insufficient';
  ordered: string;
  available: string;
  required: string;
  shortage?: string;
  orderedKg: number;
  availableKg: number;
  shortageKg: number;
  reservedKg: number;
}

/**
 * Compare order lines against active batches to determine stock availability.
 */
export function computeStockCheckRows(
  orderItems: AdminOrderLineDto[],
  batches: BatchDto[],
): StockCheckRow[] {
  return orderItems.map((item) => {
    const matchingBatches = batches.filter(
      (b) =>
        (b.cropId === item.productId || (b.cropName && b.cropName.toLowerCase() === item.name.toLowerCase())) &&
        (b.grade === item.grade || !b.grade),
    );
    const availableKg = matchingBatches.reduce((acc, b) => acc + (Number(b.qtyAvailableKg) || 0), 0);
    const reservedKg = matchingBatches.reduce((acc, b) => acc + (Number(b.qtyReservedKg ?? 0) || 0), 0);
    const orderedKg = Number(item.qtyKg) || 0;
    const isShort = availableKg < orderedKg;
    const shortageKg = isShort ? Math.round((orderedKg - availableKg) * 1000) / 1000 : 0;
    const displayName = `${item.name} · ${gradeDisplayLabel(item.grade)}`;

    return {
      name: displayName,
      status: isShort ? 'Insufficient' : 'Available',
      ordered: `${orderedKg} KG`,
      available: `${availableKg} KG`,
      required: `${orderedKg} KG`,
      ...(isShort ? { shortage: `${shortageKg} KG` } : {}),
      orderedKg,
      availableKg,
      shortageKg,
      reservedKg,
    };
  });
}
