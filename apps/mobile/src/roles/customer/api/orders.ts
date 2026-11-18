/**
 * Customer orders (docs/openapi.yaml tag "Cart & Orders"):
 *   POST /orders/quote (read-only pricing, same path as checkout, BR-200),
 *   POST /orders (wallet-only checkout, Idempotency-Key required, BR-17),
 *   GET /orders (cursor paged OrderSummary), GET /orders/{id}, GET /orders/{id}/tracking,
 *   POST /orders/{id}/reorder (Idempotency-Key), GET /delivery-slots.
 *
 * Checkout errors: 402 WALLET_INSUFFICIENT (top-level shortfall/balance/required,
 * read via ApiError.walletShortfall), 409 STOCK_UNAVAILABLE / INSUFFICIENT_ALLOCATION /
 * CART_LOCK_EXPIRED / SLOT_FULL, 404 foreign or deleted address, 422, 501.
 */
import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Money } from '@tohfa/shared-types';
import { api, getAccessToken } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import { openEventStream, type EventStreamHandle } from '../../../shell/api/sse';
import { buildQueryString, nextPageParam, type Page } from '../../../shell/api/pagination';
import { walletQueryKeys } from './wallet';
import { cartQueryKeys, type Cart } from './cart';
import type { SellableGrade } from './catalog';
import type { Quantity } from '../utils/money';

export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'DISPATCHED',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'PICKED_UP',
  'CANCELLED',
  'RETURNED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Request names; responses carry the stored `DELIVERY` / `PICKUP` (accept both). */
export type FulfillmentType = 'HOME_DELIVERY' | 'WAREHOUSE_PICKUP';
export type StoredFulfillmentType = FulfillmentType | 'DELIVERY' | 'PICKUP';
export type DeliverySlot = 'MORNING_8_12' | 'AFTERNOON_12_4' | 'EVENING_4_8';
export const DELIVERY_SLOTS: readonly DeliverySlot[] = ['MORNING_8_12', 'AFTERNOON_12_4', 'EVENING_4_8'];

export function isPickupFulfillment(f: string | null | undefined): boolean {
  return f === 'PICKUP' || f === 'WAREHOUSE_PICKUP';
}

/** docs/openapi.yaml `CheckoutRequest` (payment is WALLET only, BR-17). */
export interface CheckoutInput {
  fulfillmentType: FulfillmentType;
  warehouseId: string;
  deliveryAddressId?: string | null | undefined;
  /** YYYY-MM-DD, today or later in Asia/Kolkata. */
  deliveryDate?: string | undefined;
  deliverySlot?: DeliverySlot | undefined;
  paymentMethod: 'WALLET';
  notes?: string | undefined;
}

export interface QuoteSlot {
  date: string;
  slot: DeliverySlot;
  label: string;
  startsAt: string;
  cutoff: string;
  cutoffPassed: boolean;
  capacity: number | null;
  booked: number;
  available: number | null;
  bookable: boolean;
}

/** docs/openapi.yaml `CheckoutQuote`. `totalAmount` equals the placed order's total. */
export interface CheckoutQuote {
  fulfillmentType: StoredFulfillmentType;
  warehouseId: string;
  cartId: string;
  cartStatus: 'ACTIVE' | 'LOCKED';
  lockExpiresAt: string | null;
  lockExpired: boolean;
  lines: { id: string; productId: string; name: string; grade: SellableGrade; qtyKg: Quantity; unitPrice: Money; lineTotal: Money }[];
  itemCount: number;
  subtotal: Money;
  deliveryFee: Money;
  handlingFee: Money;
  gstRateBasisPoints: number;
  gstAmount: Money;
  discount: Money;
  totalAmount: Money;
  freeDeliveryThreshold: Money;
  walletBalance: Money;
  walletSufficient: boolean;
  shortfall: Money;
  slot: QuoteSlot | null;
}

/** docs/openapi.yaml `DeliverySlotAvailability`. */
export interface DeliverySlotAvailability {
  slot: DeliverySlot;
  label: string;
  date: string;
  startsAt: string;
  endsAt: string;
  cutoff: string;
  cutoffPassed: boolean;
  capacity: number | null;
  booked: number;
  available: number | null;
  isActive: boolean;
  bookable: boolean;
}

export interface OrderThumbnail {
  productName: string;
  imageUrl: string;
}

/** docs/openapi.yaml `OrderSummary`. */
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel?: string;
  fulfillmentType?: StoredFulfillmentType;
  warehouseId?: string;
  itemCount?: number;
  thumbnails?: OrderThumbnail[];
  totalAmount: Money;
  paymentStatus?: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED' | 'FAILED';
  deliveryDate?: string | null;
  placedAt: string;
}

export interface OrderLine {
  /** orderItemId (returns, reviews). */
  id: string;
  productId: string;
  name: string;
  grade: SellableGrade;
  qtyKg: Quantity;
  fulfilledQtyKg?: Quantity;
  unitPrice: Money;
  gstRate?: number;
  gstAmount?: Money;
  lineTotal: Money;
}

/** docs/openapi.yaml `Order`. */
export interface Order extends OrderSummary {
  items: OrderLine[];
  subtotal: Money;
  /** Earlier name; the server sends `deliveryFee`. */
  deliveryCharge?: Money;
  deliveryFee?: Money;
  handlingFee?: Money;
  discount?: Money;
  gstAmount?: Money;
  paymentMethod?: string;
  paymentMethodLabel?: string;
  /** PICKUP orders only; a human reference, NOT the handover OTP. */
  pickupCode?: string | null;
  /** PICKUP orders only; render `payload` as a QR code. */
  pickupQr?: { payload: string } | null;
  deliverySlot?: DeliverySlot | null;
  deliveryAddressId?: string | null;
  otpRequired?: boolean;
  invoiceId?: string | null;
  cancellationReason?: string | null;
  deliveredAt?: string | null;
}
/** @deprecated old name. */
export type OrderResponse = Order;

export interface OrderTrackingEvent {
  id?: string;
  status: OrderStatus;
  at: string;
  note?: string | null;
}

/** docs/openapi.yaml `OrderTracking`. */
export interface OrderTracking {
  orderId: string;
  status: OrderStatus;
  otpRequired?: boolean;
  estimatedArrival?: string | null;
  events: OrderTrackingEvent[];
}
/** @deprecated old name. */
export type OrderTrackingResponse = OrderTracking;

export type ReorderUnavailableReason = 'OUT_OF_STOCK' | 'DELISTED' | 'INSUFFICIENT_ALLOCATION';
export interface ReorderResult {
  cart: Cart;
  addedCount: number;
  unavailable: { productId: string; name: string; grade: SellableGrade; qtyKg: Quantity; reason: ReorderUnavailableReason }[];
}

const TERMINAL: ReadonlySet<string> = new Set(['DELIVERED', 'PICKED_UP', 'CANCELLED', 'RETURNED', 'COMPLETED']);
const UPCOMING: ReadonlySet<string> = new Set([
  'PENDING_PAYMENT',
  'CONFIRMED',
  'PACKED',
  'DISPATCHED',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
]);

/** No further status change is expected (stop polling). */
export function isTerminalStatus(status: string | null | undefined): boolean {
  return status != null && TERMINAL.has(status);
}
/** Still on its way (the "upcoming" group of My Orders). */
export function isActiveStatus(status: string | null | undefined): boolean {
  return status != null && UPCOMING.has(status);
}
/** POST /orders/{id}/review is accepted only for these (else 409). */
export function isReviewEligible(status: string | null | undefined): boolean {
  return status === 'DELIVERED' || status === 'PICKED_UP';
}
/** POST /orders/{id}/returns is accepted only for these (else 409). */
export function isReturnEligible(status: string | null | undefined): boolean {
  return status === 'DELIVERED' || status === 'PICKED_UP';
}

export const orderQueryKeys = {
  all: ['orders'] as const,
  list: (status?: OrderStatus) => ['orders', 'list', status ?? null] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  tracking: (id: string) => ['orders', 'detail', id, 'tracking'] as const,
  quote: (input: CheckoutInput | null) => ['orders', 'quote', input ? checkoutFingerprint(input) : null] as const,
  slots: (warehouseId: string, date: string) => ['delivery-slots', warehouseId, date] as const,
};

/** Checkout body with only the keys the contract allows (no undefined, no empty strings). */
export function toCheckoutBody(input: CheckoutInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    fulfillmentType: input.fulfillmentType,
    warehouseId: input.warehouseId,
    paymentMethod: 'WALLET',
  };
  if (input.fulfillmentType === 'HOME_DELIVERY') {
    if (input.deliveryAddressId) body['deliveryAddressId'] = input.deliveryAddressId;
    if (input.deliveryDate) body['deliveryDate'] = input.deliveryDate;
    if (input.deliverySlot) body['deliverySlot'] = input.deliverySlot;
  }
  if (input.notes && input.notes.trim().length > 0) body['notes'] = input.notes.trim().slice(0, 300);
  return body;
}

/** Stable fingerprint of a checkout payload (same payload -> same Idempotency-Key). */
export function checkoutFingerprint(input: CheckoutInput): string {
  const b = toCheckoutBody(input);
  return Object.keys(b)
    .sort()
    .map((k) => `${k}=${String(b[k])}`)
    .join('&');
}

/** True when the input satisfies the contract's required fields. */
export function isCheckoutInputComplete(input: Partial<CheckoutInput> | null | undefined): input is CheckoutInput {
  if (!input || !input.warehouseId || !input.fulfillmentType) return false;
  if (input.fulfillmentType === 'HOME_DELIVERY') {
    return !!input.deliveryAddressId && !!input.deliveryDate && !!input.deliverySlot;
  }
  return true;
}

/**
 * One Idempotency-Key per checkout attempt: `orderIdempotencyKeys.keyFor(fingerprint)`
 * replays the key for the same payload (retry after a timeout or a top-up),
 * `.reset()` after success (or on 409 IDEMPOTENCY_KEY_REUSED).
 */
export const orderIdempotencyKeys = createIdempotencyKeyCache();

export function quoteCheckout(input: CheckoutInput, signal?: AbortSignal): Promise<CheckoutQuote> {
  return api.post<CheckoutQuote>('/orders/quote', toCheckoutBody(input), undefined, signal ? { signal } : undefined);
}

export function placeOrder(input: CheckoutInput, idempotencyKey: string): Promise<Order> {
  return api.post<Order>('/orders', toCheckoutBody(input), idempotencyKey, { timeoutMs: 20_000 });
}

export function fetchOrders(params: { status?: OrderStatus; cursor?: string; limit?: number }, signal?: AbortSignal): Promise<Page<OrderSummary>> {
  return api.get<Page<OrderSummary>>(
    `/orders${buildQueryString({ status: params.status, cursor: params.cursor, limit: params.limit })}`,
    signal,
  );
}

export function fetchOrder(id: string, signal?: AbortSignal): Promise<Order> {
  return api.get<Order>(`/orders/${encodeURIComponent(id)}`, signal);
}

export function fetchOrderTracking(id: string, signal?: AbortSignal): Promise<OrderTracking> {
  return api.get<OrderTracking>(`/orders/${encodeURIComponent(id)}/tracking`, signal);
}

export function reorder(orderId: string, idempotencyKey: string): Promise<ReorderResult> {
  return api.post<ReorderResult>(`/orders/${encodeURIComponent(orderId)}/reorder`, {}, idempotencyKey);
}

export async function fetchDeliverySlots(
  warehouseId: string,
  date: string,
  signal?: AbortSignal,
): Promise<DeliverySlotAvailability[]> {
  const res = await api.get<{ items: DeliverySlotAvailability[] }>(
    `/delivery-slots${buildQueryString({ warehouseId, date })}`,
    signal,
  );
  return res.items;
}

/** POST /orders/quote, re-run whenever the input changes. Disabled until the input is complete. */
export const useOrderQuote = (input: Partial<CheckoutInput> | null | undefined) => {
  const complete = isCheckoutInputComplete(input) ? input : null;
  return useQuery({
    queryKey: orderQueryKeys.quote(complete),
    queryFn: ({ signal }) => quoteCheckout(complete as CheckoutInput, signal),
    enabled: complete !== null && !!getAccessToken(),
    staleTime: 0,
    retry: false,
  });
};

/** POST /orders. The caller supplies the attempt's Idempotency-Key (see orderIdempotencyKeys). */
export const usePlaceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CheckoutInput; idempotencyKey: string }) =>
      placeOrder(input, idempotencyKey),
    onSuccess: (order) => {
      qc.setQueryData(orderQueryKeys.detail(order.id), order);
      void qc.invalidateQueries({ queryKey: cartQueryKeys.cart });
      void qc.invalidateQueries({ queryKey: orderQueryKeys.all });
      void qc.invalidateQueries({ queryKey: walletQueryKeys.wallet });
      void qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

/** Cursor-paged own orders, newest first. */
export const useOrders = (status?: OrderStatus, limit = 20) =>
  useInfiniteQuery({
    queryKey: orderQueryKeys.list(status),
    queryFn: ({ pageParam, signal }) =>
      fetchOrders({ ...(status ? { status } : {}), ...(pageParam ? { cursor: pageParam } : {}), limit }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<OrderSummary>) => nextPageParam(last),
    enabled: !!getAccessToken(),
  });

export const useOrder = (id: string | null | undefined) =>
  useQuery({
    queryKey: orderQueryKeys.detail(id ?? ''),
    queryFn: ({ signal }) => fetchOrder(id as string, signal),
    enabled: !!id && !!getAccessToken(),
  });

/** Poll delays while an order is active: 5s, 10s, 20s, then every 30s; reset on a status change. */
export const TRACKING_BACKOFF_MS = [5_000, 10_000, 20_000, 30_000] as const;

export function trackingInterval(status: string | null | undefined, unchangedPolls: number): number | false {
  if (isTerminalStatus(status)) return false;
  const i = Math.min(Math.max(0, unchangedPolls), TRACKING_BACKOFF_MS.length - 1);
  return TRACKING_BACKOFF_MS[i] ?? 30_000;
}

/**
 * Merge one SSE `order.status` frame into the cached tracking timeline. Frames
 * carry no `id`; a frame whose status equals the cached status (the "Connected"
 * frame) changes nothing and returns `prev` unchanged.
 */
export function applyStreamEvent(prev: OrderTracking | undefined, ev: OrderTrackingEvent): OrderTracking | undefined {
  if (!prev || prev.status === ev.status) return prev;
  return { ...prev, status: ev.status, events: [...prev.events, ev] };
}

function parseStatusFrame(data: string): OrderTrackingEvent | null {
  try {
    const v = JSON.parse(data) as Partial<OrderTrackingEvent>;
    if (typeof v.status !== 'string' || typeof v.at !== 'string') return null;
    return { status: v.status, at: v.at, note: v.note ?? null } as OrderTrackingEvent;
  } catch {
    return null;
  }
}

/**
 * Live pushes from SSE `GET /orders/{id}/events` (BR-36). Each status change is
 * merged into the tracking cache at once and then re-read from
 * `GET /orders/{id}/tracking` (for the history row ids, and for anything missed
 * while reconnecting — frames have no ids, so `Last-Event-ID` is useless; the
 * connect frame's status differing from the cache is what triggers that re-read).
 * `onLive(true)` while the stream is open; `onLive(false)` while reconnecting or
 * after it gave up — the caller polls in those windows.
 */
export function useOrderEventStream(orderId: string | null | undefined, enabled: boolean, onLive: (live: boolean) => void): void {
  const qc = useQueryClient();
  useEffect(() => {
    if (!orderId || !enabled) {
      onLive(false);
      return undefined;
    }
    const key = orderQueryKeys.tracking(orderId);
    let handle: EventStreamHandle | null = null;
    handle = openEventStream({
      path: `/orders/${encodeURIComponent(orderId)}/events`,
      onOpen: () => onLive(true),
      onDisconnect: () => onLive(false),
      onFallback: () => onLive(false),
      isDone: () => isTerminalStatus(qc.getQueryData<OrderTracking>(key)?.status),
      onMessage: (msg) => {
        if (msg.event !== 'order.status') return;
        const ev = parseStatusFrame(msg.data);
        if (!ev) return;
        const prev = qc.getQueryData<OrderTracking>(key);
        const next = applyStreamEvent(prev, ev);
        if (next === prev) return;
        qc.setQueryData(key, next);
        void qc.invalidateQueries({ queryKey: key, exact: true });
        void qc.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId), exact: true });
        if (isTerminalStatus(ev.status)) {
          handle?.close();
          onLive(false);
        }
      },
    });
    return () => {
      handle?.close();
      onLive(false);
    };
    // onLive is a state setter (stable).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, enabled, qc]);
}

/**
 * GET /orders/{id}/tracking + live SSE pushes. While the stream is open the
 * poll is off; when the stream is reconnecting, unsupported or has failed for
 * good, it falls back to polling with backoff. Both stop once the order is
 * terminal or the screen unmounts.
 */
export const useOrderTracking = (orderId: string | null | undefined, options: { enabled?: boolean } = {}) => {
  const qc = useQueryClient();
  const [live, setLive] = useState(false);
  const enabled = !!orderId && (options.enabled ?? true) && !!getAccessToken();
  const query = useQuery({
    queryKey: orderQueryKeys.tracking(orderId ?? ''),
    queryFn: async ({ signal }) => {
      const prev = qc.getQueryData<OrderTracking & { _unchanged?: number }>(orderQueryKeys.tracking(orderId as string));
      const next = await fetchOrderTracking(orderId as string, signal);
      const unchanged = prev && prev.status === next.status ? (prev._unchanged ?? 0) + 1 : 0;
      if (prev && prev.status !== next.status) {
        void qc.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId as string), exact: true });
      }
      return Object.assign(next, { _unchanged: unchanged });
    },
    enabled,
    refetchInterval: (q) => {
      if (live) return false;
      const data = q.state.data as (OrderTracking & { _unchanged?: number }) | undefined;
      if (!data) return TRACKING_BACKOFF_MS[0];
      return trackingInterval(data.status, data._unchanged ?? 0);
    },
    refetchIntervalInBackground: false,
  });
  useOrderEventStream(orderId, enabled && !!query.data && !isTerminalStatus(query.data.status), setLive);
  return query;
};

/** Idempotency keys for reorder taps (one per order per attempt). */
export const reorderIdempotencyKeys = createIdempotencyKeyCache();

export const useReorder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => reorder(orderId, reorderIdempotencyKeys.keyFor(`reorder:${orderId}`)),
    onSuccess: (res) => {
      reorderIdempotencyKeys.reset();
      qc.setQueryData(cartQueryKeys.cart, res.cart);
    },
  });
};

/** GET /delivery-slots for one warehouse-day. */
export const useDeliverySlots = (warehouseId: string | null | undefined, date: string | null | undefined) =>
  useQuery({
    queryKey: orderQueryKeys.slots(warehouseId ?? '', date ?? ''),
    queryFn: ({ signal }) => fetchDeliverySlots(warehouseId as string, date as string, signal),
    enabled: !!warehouseId && !!date && !!getAccessToken(),
    staleTime: 30_000,
  });

/** Today's date (YYYY-MM-DD) in Asia/Kolkata, plus `addDays`. */
export function istDate(addDays = 0, now: Date = new Date()): string {
  const ist = new Date(now.getTime() + 330 * 60_000 + addDays * 86_400_000);
  return ist.toISOString().slice(0, 10);
}
