/**
 * The warehouse order queue and its fulfilment actions (docs/openapi.yaml tag
 * Fulfilment):
 *   GET  /admin/orders                     order.list.view_all      (BR-101, BR-30; Sub = own)
 *   GET  /admin/orders/{orderId}           order.list.view_all      (BR-99, BR-30)
 *   POST /admin/orders/{id}/pack           order.mark_packed        (BR-37; Idempotency-Key)
 *   POST /admin/orders/{id}/dispatch       order.dispatch           (BR-21; Idempotency-Key)
 *   POST /admin/orders/{id}/verify-otp     order.pickup_otp.verify  (BR-20; Idempotency-Key)
 * POST /admin/orders/{id}/assign-warehouse is `none` for a Sub Warehouse Admin
 * and is not used here.
 *
 * Money stays as the API's decimal string (`Money`) and weights as kg strings;
 * the screens' mappers turn them into integer paise and grams. Ids are uuids;
 * `orderNumber` is the human code.
 *
 * The three writes take an Idempotency-Key as the spec asks. The server
 * IGNORES it on all three today (server gap), so the screens re-read the order
 * after an unknown outcome and treat a status that has already moved as done
 * (screens/warehouse/orders/orderActions.ts).
 *
 * Spec gaps the types below make visible (docs/openapi.yaml should say these):
 *  - OrderSummary.status is the 6-value OrderStatus, but the server sends the
 *    stored status (also PENDING_PAYMENT, READY_FOR_PICKUP, PICKED_UP,
 *    RETURNED) and filters on it. The list filter therefore also takes
 *    READY_FOR_PICKUP, which the Ready for Pickup queue needs.
 *  - OrderSummary.fulfillmentType is HOME_DELIVERY / WAREHOUSE_PICKUP, but the
 *    server sends the stored PICKUP / DELIVERY; AdminOrderDetail.fulfilmentType
 *    is PICKUP / DELIVERY. The mappers normalise both.
 *  - AdminOrderDetail.items carry no order-item id, so `packedLines` (keyed by
 *    orderItemId) cannot be built from the detail; the app packs the whole order.
 *  - POST .../dispatch is "specified but not enabled" in the spec, yet the
 *    server moves a PICKUP order PACKED -> READY_FOR_PICKUP with it (and a
 *    DELIVERY order to DISPATCHED). The app uses it only to mark a pickup order
 *    ready. There is no delivery-partner list endpoint.
 *  - pack / dispatch / verify-otp return the server's own order shape, not the
 *    spec's `Order`; the app reads only `status` from it and re-reads the detail.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';
import type { Grade, QuantityKg } from './inventory';

/** docs/openapi.yaml `OrderStatus` (OrderSummary, the list). */
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PICKED_UP'
  | 'CANCELLED'
  | 'RETURNED';

/** docs/openapi.yaml `AdminOrderDetail.status` (the detail and its timeline). */
export type AdminOrderStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PACKED'
  | 'DISPATCHED'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PICKED_UP'
  | 'CANCELLED'
  | 'RETURNED';

/** The list's status filter: the spec enum plus READY_FOR_PICKUP, which the server accepts (spec gap). */
export type OrderListStatusFilter = OrderStatus | 'READY_FOR_PICKUP';

/** docs/openapi.yaml `FulfillmentType` (OrderSummary). Normalized with stored PICKUP/DELIVERY. */
export type FulfillmentType = 'HOME_DELIVERY' | 'WAREHOUSE_PICKUP' | 'PICKUP' | 'DELIVERY';

/** docs/openapi.yaml `AdminOrderDetail.fulfilmentType`. */
export type AdminFulfilmentType = 'PICKUP' | 'DELIVERY';

/** docs/openapi.yaml `SalesChannel`. */
export type SalesChannel = 'ONLINE' | 'MARKET' | 'HORECA' | 'B2B' | 'DIRECT';

/** docs/openapi.yaml `OrderSummary.paymentStatus` / `AdminOrderDetail.paymentStatus`. */
export type OrderPaymentStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED' | 'REFUND_DUE' | 'FAILED';

/** docs/openapi.yaml `AdminOrderDetail.paymentMethod`. */
export type AdminPaymentMethod = 'WALLET' | 'UPI' | 'CARD' | 'NETBANKING' | 'CASH';

/** docs/openapi.yaml `DeliverySlot`. */
export type DeliverySlot = 'MORNING_8_12' | 'AFTERNOON_12_4' | 'EVENING_4_8';

/** docs/openapi.yaml `AdminOrderDetail.invoice.status`. */
export type OrderInvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED' | 'CREDIT_NOTED';

/** docs/openapi.yaml `OrderSummary`: no farm identity (BR-101). */
export interface OrderSummaryDto {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  channel?: SalesChannel;
  fulfillmentType?: FulfillmentType;
  warehouseId?: string;
  customerName?: string | null;
  customerMobileMasked?: string | null;
  packedAt?: string | null;
  readyAt?: string | null;
  itemCount?: number;
  totalAmount: Money;
  paymentStatus?: OrderPaymentStatus;
  /** date (YYYY-MM-DD). */
  deliveryDate?: string | null;
  placedAt: string;
}

/** One line of `AdminOrderDetail.items` (farm-anonymous, BR-99). */
export interface AdminOrderLineDto {
  /** The crop id. */
  productId: string;
  name: string;
  grade: Grade;
  /** kg, exactly 3 decimals. */
  qtyKg: QuantityKg;
  unitPrice: Money;
  /** Percent, 2 decimals, as stored on the line. */
  gstRate: string;
  gstAmount: Money;
  lineTotal: Money;
}

/** `AdminOrderDetail.buyer`: CUSTOMER (id and code) or WALK_IN. The mobile is masked for every scope (BR-92). */
export interface AdminOrderBuyerDto {
  kind: 'CUSTOMER' | 'WALK_IN';
  customerId: string | null;
  customerCode: string | null;
  name: string;
  /** `******1234` (MaskedMobile), or null. */
  mobileMasked: string | null;
}

/** `AdminOrderDetail.timeline`: status changes and times only; no note, no actor. */
export interface AdminOrderTimelineDto {
  fromStatus: AdminOrderStatus | null;
  toStatus: AdminOrderStatus;
  at: string;
}

/**
 * docs/openapi.yaml `AdminOrderDetail`: an allow-list with no farm identity,
 * no batch ids, no OTP or its hash, no delivery address (BR-99, BR-16, BR-20).
 */
export interface AdminOrderDetailDto {
  id: string;
  orderNumber: string;
  channel: 'ONLINE' | 'DIRECT' | 'MARKET' | 'HORECA' | 'B2B';
  status: AdminOrderStatus;
  fulfilmentType: AdminFulfilmentType;
  paymentMethod: AdminPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  warehouse: { id: string; name: string };
  buyer: AdminOrderBuyerDto;
  items: AdminOrderLineDto[];
  totals: { subtotal: Money; deliveryFee: Money; discount: Money; gst: Money; total: Money };
  invoice: { id: string; invoiceNumber: string; status: OrderInvoiceStatus } | null;
  fulfilment: {
    deliveryDate: string | null;
    deliverySlot: DeliverySlot | null;
    /** True while a handover OTP is set and not yet verified. The code itself is never sent (BR-20). */
    otpRequired: boolean;
    otpVerifiedAt: string | null;
  };
  timeline: AdminOrderTimelineDto[];
  placedAt: string;
  packedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

/**
 * The 200 body of pack / dispatch / verify-otp: docs/openapi.yaml `Order`
 * (OrderSummary plus lines and amounts). The server sends its own order shape
 * (spec gap), so only the fields both share are typed; the app reads `status`.
 */
export interface OrderDto {
  id: string;
  orderNumber?: string;
  /** The stored status after the action, e.g. PACKED or READY_FOR_PICKUP. */
  status: AdminOrderStatus;
  otpRequired?: boolean;
}

/** One packed line: docs/openapi.yaml pack body `packedLines[]`. */
export interface PackedLine {
  orderItemId: string;
  fulfilledQtyKg: QuantityKg;
}

/** docs/openapi.yaml pack request body (optional). */
export interface PackOrderBody {
  packedLines?: PackedLine[];
}

/** docs/openapi.yaml dispatch request body. */
export interface DispatchOrderBody {
  /** Max 20 characters. */
  vehicleNumber?: string | undefined;
  deliveryPartnerId?: string | undefined;
  /** date-time. */
  expectedArrival?: string | undefined;
}

/** docs/openapi.yaml verify-otp request body. */
export interface VerifyOtpBody {
  /** The customer's 4-digit code, `^[0-9]{4}$` (BR-20). */
  otp: string;
  podPhotoUrl?: string;
}

export interface ListAdminOrdersParams {
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
  status?: OrderListStatusFilter | undefined;
  /** Narrows the caller's scope only; another warehouse is an empty page (BR-30). */
  warehouseId?: string | undefined;
  channel?: SalesChannel | undefined;
  /** date (YYYY-MM-DD). */
  deliveryDate?: string | undefined;
  /** Substring search on order number or buyer name (BR-127). */
  q?: string | undefined;
}

/**
 * Problem codes these endpoints document: 401/403/404/422/500, 409 CONFLICT and
 * INVALID_STATE_TRANSITION (an action from the wrong status), OTP_INVALID (422,
 * wrong code; `meta.remainingAttempts`) and OTP_LOCKED (429, too many wrong
 * codes) on verify-otp (BR-20), and WAREHOUSE_SCOPE_VIOLATION for a Sub
 * Warehouse Admin with no warehouse assigned.
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'INTERNAL',
  'INVALID_STATE_TRANSITION',
  'OTP_INVALID',
  'OTP_LOCKED',
  'WAREHOUSE_SCOPE_VIOLATION',
];

/** docs/openapi.yaml verify-otp `otp` pattern: exactly four ASCII digits. */
const PICKUP_OTP_RE = /^[0-9]{4}$/;

/** True for a code the server can accept: exactly four digits (BR-20). */
export function isPickupOtp(otp: string): boolean {
  return PICKUP_OTP_RE.test(otp);
}

/** Thrown, with no request made, for a pickup code that is not exactly four digits. */
export class PickupOtpFormatError extends Error {
  constructor() {
    super('A pickup OTP is exactly 4 digits.');
    this.name = 'PickupOtpFormatError';
  }
}

export function listAdminOrders(params: ListAdminOrdersParams = {}, signal?: AbortSignal): Promise<Page<OrderSummaryDto>> {
  return adminGet<Page<OrderSummaryDto>>(
    '/admin/orders',
    {
      cursor: params.cursor,
      limit: params.limit,
      status: params.status,
      warehouseId: params.warehouseId,
      channel: params.channel,
      deliveryDate: params.deliveryDate,
      q: params.q,
    },
    signal,
  );
}

/** One order of any channel; 404 when it is outside the caller's scope (BR-30). */
export function getAdminOrder(orderId: string, signal?: AbortSignal): Promise<AdminOrderDetailDto> {
  return adminGet<AdminOrderDetailDto>(`/admin/orders/${encodeURIComponent(orderId)}`, undefined, signal);
}

/** Mark a CONFIRMED order packed (409 INVALID_STATE_TRANSITION from any other status). */
export function packOrder(orderId: string, body: PackOrderBody, idempotencyKey: string): Promise<OrderDto> {
  return adminPost<OrderDto>(`/admin/orders/${encodeURIComponent(orderId)}/pack`, body, { idempotencyKey });
}

/** Move a PACKED order on: a pickup order to READY_FOR_PICKUP (the server's rule; see the header). */
export function dispatchOrder(orderId: string, body: DispatchOrderBody, idempotencyKey: string): Promise<OrderDto> {
  return adminPost<OrderDto>(`/admin/orders/${encodeURIComponent(orderId)}/dispatch`, body, { idempotencyKey });
}

/**
 * Verify the customer's handover code; success moves a pickup order to
 * PICKED_UP. A code that is not exactly four digits is refused here, before
 * any request, so it never costs the customer one of the server's attempts.
 */
export function verifyPickupOtp(orderId: string, body: VerifyOtpBody, idempotencyKey: string): Promise<OrderDto> {
  if (!isPickupOtp(body.otp)) return Promise.reject(new PickupOtpFormatError());
  return adminPost<OrderDto>(`/admin/orders/${encodeURIComponent(orderId)}/verify-otp`, body, { idempotencyKey });
}
