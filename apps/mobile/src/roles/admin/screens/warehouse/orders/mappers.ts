/**
 * The order API's rows -> the order screens' types. Pure (no React), so
 * plain-Node vitest covers every rule (../../../tests/mappers_orders.test.ts).
 *
 * Money becomes integer paise (parseMoney/toPaise from @tohfa/shared-types)
 * and weight integer grams (parseKgToGrams), read as text and never through a
 * float. A figure the server did not send is null and shows as "no value",
 * never as 0.
 *
 * Statuses: docs/openapi.yaml gives the list (OrderSummary) the 6-value
 * OrderStatus and the detail (AdminOrderDetail) a 10-value enum. Each has an
 * exhaustive table below; the list falls back to the detail table because the
 * server sends the stored status on the list too (READY_FOR_PICKUP, PICKED_UP,
 * ...; spec gap), and anything else is 'unknown', never guessed.
 *
 * The detail mapper is an allow-list: it copies named fields only, so an OTP,
 * an OTP hash, a farmer id, a batch code or anything else a future server adds
 * can never reach a screen through it (BR-99, BR-16, BR-20).
 */
import { parseMoney, toPaise, type Paise } from '@tohfa/shared-types';
import { ApiError } from '../../../../../shell/api/client';
import { createIdempotencyKeyCache, newIdempotencyKey, type IdempotencyKeyCache } from '../../../../../shell/api/idempotency';
import { bodyFingerprint } from '../../../api/hookHelpers';
import type {
  AdminOrderDetailDto,
  AdminOrderLineDto,
  AdminOrderStatus,
  OrderStatus,
  OrderSummaryDto,
} from '../../../api/orders';
import type { TaskSummaryDto } from '../../../api/tasks';
import { t, type TranslationKey } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate, formatAdminDay, relativeTime } from '../../../utils/datetime';
import { isAreaAvailable } from '../availability';
import { gradeLabel } from '../inventory/mappers';
import type {
  OrderAction,
  OrderDetailView,
  OrderFulfilment,
  OrderLineView,
  OrderListRow,
  OrderNextAction,
  OrderStatusTone,
  OrderTaskCounts,
  OrderTimelineEntry,
  OrderUiStatus,
  PermissionCheck,
  WarehouseScope,
} from './types';

function has<K extends string>(table: Readonly<Record<K, unknown>>, key: string): key is K {
  return Object.prototype.hasOwnProperty.call(table, key);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Scope ───────────────────────────────────────────────────────────────────

/**
 * The warehouseId every order request sends. A Sub scope is always its own
 * warehouse uuid, whatever a picker says (BR-30, BR-101); the Main view sends
 * the warehouse picked in its selector, only when that is a uuid (the old
 * sample selector held codes like 'WH-COON', which the API refuses), and
 * otherwise none, for all warehouses.
 */
export function ordersWarehouseFilter(scope: WarehouseScope, selectedId: string | undefined): string | undefined {
  if (scope.warehouseId !== undefined) return scope.warehouseId;
  return selectedId !== undefined && UUID_RE.test(selectedId) ? selectedId : undefined;
}

/**
 * An order uuid route param, or undefined. Hosts that still hold sample data
 * pass a human code ('ORD-1024'); that is not an order the API can look up, so
 * the screen shows "not found" instead of a 422.
 */
export function orderIdParam(params: Readonly<Record<string, unknown>> | null | undefined): string | undefined {
  const value: unknown = params?.['orderId'];
  return typeof value === 'string' && UUID_RE.test(value) ? value : undefined;
}

// ─── Statuses ────────────────────────────────────────────────────────────────

/** docs/openapi.yaml OrderStatus (the list), every value. */
export const LIST_STATUS_TABLE: Readonly<Record<OrderStatus, OrderUiStatus>> = {
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  DISPATCHED: 'dispatched',
  OUT_FOR_DELIVERY: 'outForDelivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

/** docs/openapi.yaml AdminOrderDetail.status (the detail and its timeline), every value. */
export const DETAIL_STATUS_TABLE: Readonly<Record<AdminOrderStatus, OrderUiStatus>> = {
  PENDING_PAYMENT: 'pendingPayment',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  DISPATCHED: 'dispatched',
  READY_FOR_PICKUP: 'readyForPickup',
  OUT_FOR_DELIVERY: 'outForDelivery',
  DELIVERED: 'delivered',
  PICKED_UP: 'pickedUp',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

/** A list status; the stored statuses the list spec omits fall back to the detail table. */
export function listStatusOf(status: string): OrderUiStatus {
  if (has(LIST_STATUS_TABLE, status)) return LIST_STATUS_TABLE[status];
  return detailStatusOf(status);
}

export function detailStatusOf(status: string): OrderUiStatus {
  return has(DETAIL_STATUS_TABLE, status) ? DETAIL_STATUS_TABLE[status] : 'unknown';
}

const STATUS_LABEL: Readonly<Record<OrderUiStatus, TranslationKey>> = {
  pendingPayment: 'orders.status.pendingPayment',
  confirmed: 'orders.status.confirmed',
  packed: 'orders.status.packed',
  readyForPickup: 'orders.status.readyForPickup',
  dispatched: 'orders.status.dispatched',
  outForDelivery: 'orders.status.outForDelivery',
  delivered: 'orders.status.delivered',
  pickedUp: 'orders.status.pickedUp',
  cancelled: 'orders.status.cancelled',
  returned: 'orders.status.returned',
  unknown: 'orders.status.unknown',
};

const STATUS_TONE: Readonly<Record<OrderUiStatus, OrderStatusTone>> = {
  pendingPayment: 'neutral',
  confirmed: 'warning',
  packed: 'info',
  readyForPickup: 'success',
  dispatched: 'info',
  outForDelivery: 'info',
  delivered: 'success',
  pickedUp: 'success',
  cancelled: 'danger',
  returned: 'danger',
  unknown: 'neutral',
};

export function orderStatusLabelKey(status: OrderUiStatus): TranslationKey {
  return STATUS_LABEL[status];
}

export function orderStatusLabel(status: OrderUiStatus): string {
  return t(STATUS_LABEL[status]);
}

export function orderStatusTone(status: OrderUiStatus): OrderStatusTone {
  return STATUS_TONE[status];
}

// ─── Fulfilment ──────────────────────────────────────────────────────────────

/**
 * HOME_DELIVERY (list spec) and DELIVERY (detail spec, and what the server
 * stores) are the same thing; so are WAREHOUSE_PICKUP and PICKUP.
 */
export function normalizeFulfilment(value: string | null | undefined): OrderFulfilment {
  switch (value) {
    case 'WAREHOUSE_PICKUP':
    case 'PICKUP':
      return 'pickup';
    case 'HOME_DELIVERY':
    case 'DELIVERY':
      return 'delivery';
    default:
      return 'unknown';
  }
}

const FULFILMENT_LABEL: Readonly<Record<OrderFulfilment, TranslationKey>> = {
  pickup: 'orders.fulfilment.pickup',
  delivery: 'orders.fulfilment.delivery',
  unknown: 'orders.fulfilment.unknown',
};

export function fulfilmentLabel(fulfilment: OrderFulfilment): string {
  return t(FULFILMENT_LABEL[fulfilment]);
}

// ─── Units ───────────────────────────────────────────────────────────────────

/** A Money string as integer paise; null when absent or not Money. */
export function moneyToPaise(value: unknown): Paise | null {
  if (typeof value !== 'string') return null;
  try {
    const paise = toPaise(parseMoney(value));
    return Number.isSafeInteger(paise) ? paise : null;
  } catch {
    return null;
  }
}

function paiseLabel(paise: Paise | null): string {
  return paise === null ? t('orders.noValue') : formatPaise(paise);
}

function gramsOf(value: unknown): number | null {
  return typeof value === 'string' ? parseKgToGrams(value) : null;
}

function itemsLabel(count: number | null): string {
  if (count === null) return t('orders.noValue');
  return count === 1 ? t('orders.items.one') : t('orders.items.many', { count });
}

// ─── List ────────────────────────────────────────────────────────────────────

export function toOrderListRow(dto: OrderSummaryDto, now: Date): OrderListRow {
  const status = listStatusOf(dto.status);
  const fulfilment = normalizeFulfilment(dto.fulfillmentType);
  const itemCount = typeof dto.itemCount === 'number' && Number.isSafeInteger(dto.itemCount) ? dto.itemCount : null;
  const totalPaise = moneyToPaise(dto.totalAmount);
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status,
    statusLabel: orderStatusLabel(status),
    tone: orderStatusTone(status),
    fulfilment,
    fulfilmentLabel: fulfilmentLabel(fulfilment),
    itemCount,
    itemsLabel: itemsLabel(itemCount),
    totalPaise,
    amountLabel: paiseLabel(totalPaise),
    placedLabel: formatAdminDate(dto.placedAt, now),
    placedAgo: relativeTime(dto.placedAt, now),
    warehouseId: dto.warehouseId ?? null,
  };
}

// ─── Detail ──────────────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABEL: Readonly<Record<string, TranslationKey>> = {
  PENDING: 'orders.payment.status.PENDING',
  PAID: 'orders.payment.status.PAID',
  PARTIALLY_PAID: 'orders.payment.status.PARTIALLY_PAID',
  REFUNDED: 'orders.payment.status.REFUNDED',
  FAILED: 'orders.payment.status.FAILED',
};

const PAYMENT_METHOD_LABEL: Readonly<Record<string, TranslationKey>> = {
  WALLET: 'orders.payment.method.WALLET',
  UPI: 'orders.payment.method.UPI',
  CARD: 'orders.payment.method.CARD',
  NETBANKING: 'orders.payment.method.NETBANKING',
  CASH: 'orders.payment.method.CASH',
};

function labelFrom(table: Readonly<Record<string, TranslationKey>>, value: string): string {
  const key = has(table, value) ? table[value] : undefined;
  return key === undefined ? t('orders.noValue') : t(key);
}

function toLine(line: AdminOrderLineDto, index: number): OrderLineView {
  const qtyGrams = gramsOf(line.qtyKg);
  const unitPaise = moneyToPaise(line.unitPrice);
  const lineTotalPaise = moneyToPaise(line.lineTotal);
  const qty = qtyGrams === null ? t('orders.noValue') : formatKg(qtyGrams);
  return {
    key: `${index}:${line.productId}:${line.grade}`,
    name: line.name,
    gradeLabel: gradeLabel(line.grade),
    qtyGrams,
    qtyDetail: t('orders.line.qtyDetail', { qty, price: paiseLabel(unitPaise) }),
    lineTotalPaise,
    lineTotalLabel: paiseLabel(lineTotalPaise),
    checklistLabel: t('orders.line.checklist', { name: line.name, qty }),
  };
}

/** Status changes only, oldest first; a same-status row (e.g. a warehouse reassignment) is not a change. */
function toTimeline(dto: AdminOrderDetailDto, now: Date): OrderTimelineEntry[] {
  return dto.timeline
    .filter((row) => row.fromStatus !== row.toStatus)
    .map((row, index) => {
      const status = detailStatusOf(row.toStatus);
      return {
        key: `${index}:${row.toStatus}:${row.at}`,
        status,
        label: orderStatusLabel(status),
        dayLabel: formatAdminDay(row.at),
        atLabel: formatAdminDate(row.at, now),
      };
    });
}

function sumGrams(lines: readonly OrderLineView[]): number | null {
  let total = 0;
  for (const line of lines) {
    if (line.qtyGrams === null) return null;
    total += line.qtyGrams;
  }
  return total;
}

function dateOrNull(iso: string | null | undefined, now: Date): string | null {
  if (typeof iso !== 'string' || iso === '') return null;
  const label = formatAdminDate(iso, now);
  return label === '' ? null : label;
}

/** The detail as the screens show it: named fields only (an allow-list, BR-99). */
export function toOrderDetail(dto: AdminOrderDetailDto, now: Date): OrderDetailView {
  const status = detailStatusOf(dto.status);
  const fulfilment = normalizeFulfilment(dto.fulfilmentType);
  const lines = dto.items.map(toLine);
  const subtotalPaise = moneyToPaise(dto.totals.subtotal);
  const deliveryFeePaise = moneyToPaise(dto.totals.deliveryFee);
  const discountPaise = moneyToPaise(dto.totals.discount);
  const gstPaise = moneyToPaise(dto.totals.gst);
  const totalPaise = moneyToPaise(dto.totals.total);
  const deliveryDate = dto.fulfilment.deliveryDate;
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status,
    statusLabel: orderStatusLabel(status),
    tone: orderStatusTone(status),
    fulfilment,
    fulfilmentLabel: fulfilmentLabel(fulfilment),
    warehouseId: dto.warehouse.id,
    warehouseName: dto.warehouse.name,
    buyerName: dto.buyer.name,
    buyerMobileMasked: typeof dto.buyer.mobileMasked === 'string' ? dto.buyer.mobileMasked : null,
    paymentStatusLabel: labelFrom(PAYMENT_STATUS_LABEL, dto.paymentStatus),
    paymentMethodLabel: labelFrom(PAYMENT_METHOD_LABEL, dto.paymentMethod),
    lines,
    itemCount: lines.length,
    totalGrams: sumGrams(lines),
    totals: {
      subtotalPaise,
      deliveryFeePaise,
      discountPaise,
      gstPaise,
      totalPaise,
      subtotalLabel: paiseLabel(subtotalPaise),
      deliveryFeeLabel: paiseLabel(deliveryFeePaise),
      discountLabel: paiseLabel(discountPaise),
      gstLabel: paiseLabel(gstPaise),
      totalLabel: paiseLabel(totalPaise),
    },
    deliveryDateLabel: typeof deliveryDate === 'string' && deliveryDate !== '' ? formatAdminDay(`${deliveryDate}T00:00:00+05:30`) : null,
    otpRequired: dto.fulfilment.otpRequired === true,
    otpVerifiedLabel: dateOrNull(dto.fulfilment.otpVerifiedAt, now),
    timeline: toTimeline(dto, now),
    placedLabel: formatAdminDate(dto.placedAt, now),
    packedLabel: dateOrNull(dto.packedAt, now),
    completedLabel: dateOrNull(dto.completedAt, now),
    // Only a uuid is kept: anything else could not be looked up (GET /invoices/{id}).
    // Checked here rather than with billing's invoiceIdParam: billing-invoices/mappers imports this file.
    invoiceId: typeof dto.invoice?.id === 'string' && UUID_RE.test(dto.invoice.id) ? dto.invoice.id : null,
  };
}

/**
 * The invoice the order detail's "View Invoice" entry opens (M5S18), or
 * undefined to hide the entry: the order has no invoice yet, or the caller
 * cannot read invoices (availability.ts 'orderInvoices', invoice.view_own).
 * Display only; the server scopes GET /invoices/{id} to the caller (BR-36).
 */
export function orderInvoiceEntry(order: Pick<OrderDetailView, 'invoiceId'>, can: PermissionCheck): string | undefined {
  if (order.invoiceId === null) return undefined;
  return isAreaAvailable('orderInvoices', can) ? order.invoiceId : undefined;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

function countOf(summary: TaskSummaryDto, type: 'ORDER_PACK' | 'ORDER_DISPATCH' | 'ORDER_PICKUP_OTP'): number {
  const value = summary.byType[type];
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

/** The three order counts, or null before the summary loads (shown as no value, not 0). */
export function orderTaskCounts(summary: TaskSummaryDto | undefined): OrderTaskCounts | null {
  if (summary === undefined) return null;
  return {
    toPack: countOf(summary, 'ORDER_PACK'),
    toMarkReady: countOf(summary, 'ORDER_DISPATCH'),
    awaitingPickup: countOf(summary, 'ORDER_PICKUP_OTP'),
  };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * What the detail offers next. Delivery orders get nothing after packing:
 * dispatch for delivery is not enabled in Track 1 (BR-21, docs/rules.md open
 * contradiction 3), so only a pickup order is marked ready.
 */
export function nextOrderAction(order: OrderDetailView, can: PermissionCheck): OrderNextAction | null {
  switch (order.status) {
    case 'confirmed':
      return can('order.mark_packed') ? { kind: 'pack', screen: 'M5S07', step: 'packing' } : null;
    case 'packed':
      return order.fulfilment === 'pickup' && can('order.dispatch') ? { kind: 'markReady', screen: 'M5S07', step: 'confirm' } : null;
    case 'readyForPickup':
      return can('order.pickup_otp.verify') ? { kind: 'verifyPickup', screen: 'M5S11', step: 'verify' } : null;
    default:
      return null;
  }
}

/** The statuses an order is in once each action has landed (it may have moved further since). */
const LANDED: Readonly<Record<OrderAction, readonly OrderUiStatus[]>> = {
  pack: ['packed', 'readyForPickup', 'dispatched', 'outForDelivery', 'delivered', 'pickedUp'],
  markReady: ['readyForPickup', 'dispatched', 'outForDelivery', 'delivered', 'pickedUp'],
  verifyOtp: ['pickedUp', 'delivered'],
};

/**
 * True when the order's stored status shows `action` already happened. This
 * is what makes a retry safe while the server ignores the Idempotency-Key: a
 * write whose answer was lost is treated as done once its status has moved.
 * A cancelled or unknown status is never "done".
 */
export function actionLanded(action: OrderAction, status: string): boolean {
  return LANDED[action].includes(detailStatusOf(status));
}

/** OTP_INVALID's `meta.remainingAttempts`, or null. */
export function otpAttemptsLeft(err: unknown): number | null {
  if (!(err instanceof ApiError)) return null;
  const left = err.problem.meta?.['remainingAttempts'];
  return typeof left === 'number' && Number.isSafeInteger(left) && left >= 0 ? left : null;
}

export interface OrderActionKeyRing {
  keyFor: (orderId: string, action: OrderAction, body: unknown) => string;
}

/**
 * One Idempotency-Key per logical write (root CLAUDE.md 2.4): the same order,
 * action and body reuse their key on a retry, a changed body (another OTP
 * typed) gets a new one, and two orders or two actions never share a key.
 */
export function createOrderActionKeyRing(generate: () => string = newIdempotencyKey): OrderActionKeyRing {
  // One single-body cache per order and action, so packing one order and then
  // marking it ready does not drop the pack key a late retry still needs.
  const caches = new Map<string, IdempotencyKeyCache>();
  return {
    keyFor: (orderId, action, body) => {
      const slot = `${orderId}:${action}`;
      let cache = caches.get(slot);
      if (cache === undefined) {
        cache = createIdempotencyKeyCache(generate);
        caches.set(slot, cache);
      }
      return cache.keyFor(bodyFingerprint(body));
    },
  };
}
