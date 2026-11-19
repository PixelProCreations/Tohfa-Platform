import { createHash, timingSafeEqual } from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { Response, Request } from 'express';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import {
  beginIdempotent,
  idempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import {
  fulfilmentRepo,
  type AdminOrderDetailRecord,
  type AdminOrderListRecord,
  type FulfilmentRepo,
} from './fulfilment.repo.js';
import { adminOrderDetailResponse, type AdminOrderDetailResponse } from './fulfilment.schema.js';
import type {
  AdminOrdersQuery,
  AdminOrderListItem,
  AdminOrderDetail,
  AssignWarehouseRequest,
  PackOrderRequest,
  DispatchOrderRequest,
  VerifyOtpRequest,
  CancelOrderRequest,
  OrderIssueRequest,
  OrderIssueResponse,
  StockCheckResponse,
  OrdersSummaryQuery,
  OrdersSummaryResponse,
  OrderTracking,
  OrderTrackingEvent,
} from './fulfilment.schema.js';
import { orderStatuses, type OrderStatus, type DeliverySlot } from './orders.schema.js';

export const orderEventsEmitter = new EventEmitter();

// Valid state machine transitions
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['READY_FOR_PICKUP', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'PICKED_UP', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'CANCELLED'],
  DISPATCHED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  PICKED_UP: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
  COMPLETED: [],
};

export interface FulfilmentService {
  /**
   * BR-101: GET /admin/orders. Confined by the resolved scope in SQL (the repo); takes no Actor so
   * that role names cannot creep back in. Out-of-scope filters and customer-owned scopes are empty.
   */
  listAdminOrders(
    scope: ResolvedScope,
    query: AdminOrdersQuery,
  ): Promise<{ items: AdminOrderListItem[]; page: { nextCursor: string | null; hasMore: boolean } }>;

  getAdminOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
  ): Promise<AdminOrderDetail>;

  assignWarehouse(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: AssignWarehouseRequest,
  ): Promise<AdminOrderDetail>;

  /** BR-118: `idempotencyKey` is the required Idempotency-Key header (422 when missing). */
  packOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: PackOrderRequest,
    idempotencyKey?: string,
  ): Promise<AdminOrderDetail>;

  /** BR-118: `idempotencyKey` is the required Idempotency-Key header (422 when missing). */
  dispatchOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: DispatchOrderRequest,
    idempotencyKey?: string,
  ): Promise<AdminOrderDetail>;

  /** BR-118: `idempotencyKey` is the required Idempotency-Key header (422 when missing). */
  verifyOtp(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: VerifyOtpRequest,
    idempotencyKey?: string,
  ): Promise<AdminOrderDetail>;

  /** Cancel an order prior to completion (BR-151). Honours Idempotency-Key. */
  cancelOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: CancelOrderRequest,
    idempotencyKey?: string,
  ): Promise<AdminOrderDetailResponse>;

  /** Report an issue against an order, linked to warehouse_issues (BR-152). Honours Idempotency-Key. */
  createOrderIssue(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: OrderIssueRequest,
    idempotencyKey?: string,
  ): Promise<OrderIssueResponse>;

  /** Check warehouse stock availability and shortage for an order (BR-156). */
  checkStock(
    scope: ResolvedScope,
    orderId: string,
  ): Promise<StockCheckResponse>;

  /** Get aggregated orders summary by status and warehouse (BR-163). */
  getOrdersSummary(
    scope: ResolvedScope,
    query: OrdersSummaryQuery,
  ): Promise<OrdersSummaryResponse>;

  getOrderTracking(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
  ): Promise<OrderTracking>;

  /**
   * BR-99: GET /admin/orders/{orderId}. Any channel; confined to the scope in SQL; allow-list
   * serialized. Read-only, so no audit row (BR-35 covers mutations). Takes only the scope (no
   * Actor): authority comes from `order.list.view_all` as resolved by requirePermission.
   */
  getAdminOrderDetail(scope: ResolvedScope, orderId: string): Promise<AdminOrderDetailResponse>;

  streamOrderEvents(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    req: Request,
    res: Response,
  ): Promise<void>;
}

/**
 * BR-92: `*` for every character but the last four, e.g. `+919876543210` -> `*********3210`; four
 * characters or fewer are masked fully. Same output as the sales read (`MaskedMobile`). Applied for
 * every scope on the admin order detail and list (BR-99, BR-101): like `Sale`, the response never
 * carries a full mobile.
 */
export function maskMobile(mobile: string | null | undefined): string | null {
  if (!mobile) return null;
  if (mobile.length <= 4) return '*'.repeat(Math.max(mobile.length, 1));
  return `${'*'.repeat(mobile.length - 4)}${mobile.slice(-4)}`;
}

/**
 * BR-101 allow-list serializer for one `GET /admin/orders` item (openapi `AdminOrderSummary`). Every
 * documented key is named here and nothing else, so a column joined into the list query later (a farm,
 * batch or customer id) cannot reach the wire (BR-16). The owner amendment of 2026-10-23 adds exactly
 * the buyer's name and mobile, the mobile masked by the same `maskMobile` as the detail (BR-92).
 */
export function toAdminOrderListItem(record: AdminOrderListRecord): AdminOrderListItem {
  return {
    id: record.id,
    orderNumber: record.orderNumber,
    status: record.status,
    channel: record.channel,
    fulfillmentType: record.fulfillmentType,
    warehouseId: record.warehouseId,
    itemCount: record.itemCount,
    totalAmount: record.totalAmount,
    paymentStatus: record.paymentStatus,
    deliveryDate: record.deliveryDate,
    placedAt: record.placedAt,
    buyerName: record.buyerName ?? null,
    customerName: record.buyerName ?? null,
    customerMobileMasked: maskMobile(record.buyerMobile ?? null),
    packedAt: record.packedAt ?? null,
    readyAt: record.readyAt ?? null,
  };
}

/**
 * BR-99 allow-list serializer: every documented key is named here and nothing else, so a field
 * added to the record (or a farm / batch / OTP column joined in later) cannot reach the response.
 * The strict schema parse is the second fence.
 */
export function toAdminOrderDetail(record: AdminOrderDetailRecord): AdminOrderDetailResponse {
  const buyer =
    record.customerId !== null
      ? {
          kind: 'CUSTOMER' as const,
          customerId: record.customerId,
          customerCode: record.customerCode,
          name: record.customerName ?? '',
          mobileMasked: maskMobile(record.customerMobile),
        }
      : {
          kind: 'WALK_IN' as const,
          customerId: null,
          customerCode: null,
          name: record.walkInName ?? '',
          mobileMasked: maskMobile(record.walkInMobile),
        };
  return adminOrderDetailResponse.parse({
    id: record.id,
    orderNumber: record.orderNumber,
    channel: record.channel,
    status: record.status,
    fulfilmentType: record.fulfilmentType,
    pickupType: record.pickupType ?? (record.fulfilmentType === 'PICKUP' ? 'WAREHOUSE_PICKUP' : 'HOME_DELIVERY'),
    notes: record.notes ?? null,
    paymentMethod: record.paymentMethod,
    paymentStatus: record.paymentStatus,
    warehouse: { id: record.warehouseId, name: record.warehouseName },
    buyer,
    items: record.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      grade: item.grade,
      qtyKg: item.qtyKg,
      unitPrice: item.unitPrice,
      gstRate: item.gstRate,
      gstAmount: item.gstAmount,
      lineTotal: item.lineTotal,
    })),
    totals: {
      subtotal: record.subtotal,
      deliveryFee: record.deliveryFee,
      discount: record.discount,
      gst: record.gstAmount,
      total: record.totalAmount,
    },
    invoice:
      record.invoice === null
        ? null
        : { id: record.invoice.id, invoiceNumber: record.invoice.invoiceNumber, status: record.invoice.status },
    fulfilment: {
      deliveryDate: record.deliveryDate,
      deliverySlot: record.deliverySlot,
      otpRequired: record.otpRequired,
      otpVerifiedAt: record.otpVerifiedAt,
    },
    timeline: record.timeline.map((event) => ({
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      at: event.at,
    })),
    placedAt: record.placedAt,
    packedAt: record.packedAt,
    completedAt: record.completedAt,
    cancelledAt: record.cancelledAt,
    deliveryAddress:
      record.fulfilmentType === 'DELIVERY' && record.deliveryAddress
        ? {
            line1: record.deliveryAddress.line1,
            line2: record.deliveryAddress.line2 ?? null,
            city: record.deliveryAddress.city,
            district: record.deliveryAddress.district ?? null,
            state: record.deliveryAddress.state ?? null,
            pincode: record.deliveryAddress.pincode,
            lat: record.deliveryAddress.lat !== null && record.deliveryAddress.lat !== undefined ? Number(record.deliveryAddress.lat) : null,
            lng: record.deliveryAddress.lng !== null && record.deliveryAddress.lng !== undefined ? Number(record.deliveryAddress.lng) : null,
          }
        : null,
    deliveryPartner:
      record.fulfilmentType === 'DELIVERY' && record.deliveryPartner
        ? {
            id: record.deliveryPartner.id,
            name: record.deliveryPartner.name,
            phone: record.deliveryPartner.phone,
            vehicleRef: record.deliveryPartner.vehicleRef ?? null,
          }
        : null,
    deliverySlot: record.deliverySlot ?? null,
  });
}

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/**
 * The `operation` recorded on an idempotency_keys claim (BR-118). One per endpoint, so a key used on
 * one of them and sent to another is 409 IDEMPOTENCY_KEY_REUSED, never a replay of the wrong thing.
 */
const OPERATION = {
  pack: 'order.mark_packed',
  dispatch: 'order.dispatch',
  verifyOtp: 'order.pickup_otp.verify',
  cancel: 'order.cancel',
  issue: 'order.issue',
} as const;

/**
 * Thrown inside the verify-otp transaction when the code does not match, so that the transaction
 * (and with it the Idempotency-Key claim) rolls back; the caller then counts the attempt OUTSIDE it
 * (BR-20: a wrong code must still count) and answers OTP_INVALID. Never escapes the service.
 */
class WrongOtpAttempt extends Error {
  constructor(readonly maxAttempts: number) {
    super('wrong OTP');
  }
}

export function createFulfilmentService(opts: {
  repo?: FulfilmentRepo;
  db?: Executor;
  emitter?: EventEmitter;
  runTx?: TransactionRunner;
  idempotency?: IdempotencyStore;
} = {}): FulfilmentService {
  const repo = opts.repo ?? fulfilmentRepo;
  const db = opts.db ?? pool;
  const runTx: TransactionRunner = opts.runTx ?? ((fn) => withTransaction(fn));
  const emitter = opts.emitter ?? orderEventsEmitter;
  const idempotency = opts.idempotency ?? idempotencyStore;

  /**
   * BR-118: the response the route sends, read on the transaction that made the change so it can be
   * stored with the claim and replayed byte for byte. The order exists: it was just updated.
   */
  async function orderAfterChange(tx: Executor, orderId: string): Promise<AdminOrderDetail> {
    const updated = await repo.findOrderForFulfilment(tx, orderId);
    if (updated === null) {
      throw new AppError('INTERNAL', { detail: `Order ${orderId} vanished inside its own transaction.` });
    }
    return updated;
  }

  /**
   * BR-85j: `updateOrderStatus` is conditional on the from-status and reports how many rows it
   * changed. 0 means another writer moved the order first; throwing inside the transaction rolls
   * back the audit row, so neither ledger claims a change that did not happen.
   */
  function assertOrderUpdated(orderId: string, updated: number): void {
    if (updated === 0) {
      throw new AppError('CONFLICT', {
        detail: `Order ${orderId} changed while this action was in progress; reload it and try again.`,
      });
    }
  }

  function validateTransition(from: OrderStatus, to: OrderStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    if (!allowed.includes(to)) {
      throw new AppError('INVALID_STATE_TRANSITION', {
        status: 409,
        detail: `Cannot transition order from status ${from} to ${to}.`,
      });
    }
  }

  // Legacy role-name confinement, still used by the action routes. Those routes ALSO apply
  // `warehouseVisible(scope, ...)` (BR-101), which only ever narrows: a scope carrying a customer or
  // farmer id fails closed to the same 404 as an unknown id, whatever this function returns.
  // It stays because verify-otp grants SUB_WH_ADMIN `all` in rbac.json yet is confined here.
  function getWarehouseScope(actor: Actor): string | null {
    // If actor has a SUB_WH_ADMIN role or specific assigned warehouse in claims/actor
    const hasOnlySubWh =
      actor.roles.some((r) => r.code === 'SUB_WH_ADMIN') &&
      !actor.roles.some((r) => r.code === 'SUPER_ADMIN' || r.code === 'TOHFA_ADMIN' || r.code === 'MAIN_WH_ADMIN');

    if (hasOnlySubWh) {
      // Find assigned warehouse from actor roles
      const subWhRole = actor.roles.find((r) => r.code === 'SUB_WH_ADMIN');
      return subWhRole?.warehouseId ?? (actor as { warehouseId?: string }).warehouseId ?? null;
    }
    return null;
  }

  return {
    async listAdminOrders(scope, query) {
      // No 403 for a cross-warehouse `warehouseId`: the repo ANDs it onto the scope predicate and
      // the page is simply empty (BR-30). A 403 would confirm the other warehouse's orders exist.
      const { items, nextCursor, hasMore } = await repo.listAdminOrders(db, scope, query);

      return { items: items.map(toAdminOrderListItem), page: { nextCursor, hasMore } };
    },

    async getAdminOrder(actor, scope, orderId) {
      const warehouseScope = getWarehouseScope(actor);
      const order = await repo.findOrderForFulfilment(db, orderId, warehouseScope);
      if (!order || !warehouseVisible(scope, order.warehouseId)) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }
      return order;
    },

    async assignWarehouse(actor, scope, orderId, input) {
      const warehouseScope = getWarehouseScope(actor);
      if (warehouseScope) {
        throw new AppError('FORBIDDEN', {
          status: 403,
          detail: 'Sub Warehouse Admins cannot reassign orders.',
        });
      }

      // BR-85j: every check below runs on the row locked inside the transaction. Deciding on an
      // unlocked read let a pack/cancel commit in between: the conditional UPDATE then matched no
      // row, yet the history and audit rows were still written and the caller got 200.
      await runTx(async (tx) => {
        const order = await repo.lockOrderForUpdate(tx, orderId);
        if (!order || !warehouseVisible(scope, order.warehouseId)) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Order ${orderId} not found.`,
          });
        }

        // BR-85i: a counter sale is made AT a warehouse, from that warehouse's batches. A pending UPI
        // sale's items already name those batches (the hold, BR-94), so moving it would make the
        // later confirm write SALE ledger rows for batches at another warehouse (refused by the
        // ledger trigger) and let a second warehouse see the sale. Completed counter sales are
        // PICKED_UP and already refused by the status check below; this names the pending case.
        if (order.channel === 'DIRECT' || order.channel === 'MARKET') {
          throw new AppError('COUNTER_SALE_NOT_REASSIGNABLE', {
            detail: `Order ${orderId} is a ${order.channel} counter sale; it stays at the warehouse that made it.`,
            meta: { channel: order.channel, status: order.status },
          });
        }

        if (order.status !== 'CONFIRMED' && order.status !== 'PENDING_PAYMENT') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: `Cannot reassign warehouse for order in status ${order.status}.`,
          });
        }

        // With the row locked this cannot match 0 rows; the check stays so that dropping the lock
        // later fails loudly (and rolls back the audit row) instead of reporting a phantom reassign.
        assertOrderUpdated(orderId, await repo.updateOrderStatus(tx, {
          orderId,
          fromStatus: order.status,
          toStatus: order.status,
          actorUserId: actor.userId,
          warehouseId: input.warehouseId,
          note: `Reassigned to warehouse: ${input.warehouseId}${input.reason ? ` - ${input.reason}` : ''}`,
        }));

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'order.warehouse.assign',
          entityType: 'orders',
          entityId: orderId,
          after: { newWarehouseId: input.warehouseId, reason: input.reason },
        });
      });

      const updated = await repo.findOrderForFulfilment(db, orderId);
      return updated!;
    },

    async packOrder(actor, scope, orderId, input, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);
      const warehouseScope = getWarehouseScope(actor);

      // BR-118: the key is claimed first, in the transaction that changes the status. A replay
      // returns the stored order before the state check (the first call already packed it, so it
      // would be INVALID_STATE_TRANSITION) and writes no second history or audit row.
      const outcome = await runTx(async (tx) => {
        const idem = await beginIdempotent<AdminOrderDetail>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: OPERATION.pack,
          request: { orderId, body: input },
        });
        if (idem.replay) return { replayed: true as const, order: idem.response };

        const order = await repo.findOrderForFulfilment(tx, orderId, warehouseScope);
        if (!order || !warehouseVisible(scope, order.warehouseId)) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Order ${orderId} not found.`,
          });
        }

        validateTransition(order.status, 'PACKED');

        assertOrderUpdated(orderId, await repo.updateOrderStatus(tx, {
          orderId,
          fromStatus: order.status,
          toStatus: 'PACKED',
          actorUserId: actor.userId,
          packedAt: new Date(),
          note: `Packed at warehouse ${order.warehouseId}`,
        }));

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'order.mark_packed',
          entityType: 'orders',
          entityId: orderId,
          after: { previousStatus: order.status, newStatus: 'PACKED' },
        });

        const updated = await orderAfterChange(tx, orderId);
        await idem.complete(updated);
        return { replayed: false as const, order: updated, warehouseId: order.warehouseId };
      });
      if (outcome.replayed) return outcome.order;

      const eventPayload: OrderTrackingEvent = {
        status: 'PACKED',
        at: new Date().toISOString(),
        note: `Packed at warehouse ${outcome.warehouseId}`,
      };
      emitter.emit(`order:${orderId}`, eventPayload);

      return outcome.order;
    },

    async dispatchOrder(actor, scope, orderId, input, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);
      const warehouseScope = getWarehouseScope(actor);

      // BR-118: claimed first, as for pack.
      const outcome = await runTx(async (tx) => {
        const idem = await beginIdempotent<AdminOrderDetail>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: OPERATION.dispatch,
          request: { orderId, body: input },
        });
        if (idem.replay) return { replayed: true as const, order: idem.response };

        const order = await repo.findOrderForFulfilment(tx, orderId, warehouseScope);
        if (!order || !warehouseVisible(scope, order.warehouseId)) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Order ${orderId} not found.`,
          });
        }

        let targetStatus: OrderStatus;
        let note: string;

        if (order.fulfillmentType === 'PICKUP') {
          if (input.deliveryPartnerId) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `Order ${orderId} is for warehouse pickup and cannot be assigned a delivery partner.`,
            });
          }
          targetStatus = 'READY_FOR_PICKUP';
          validateTransition(order.status, targetStatus);
          note = input.vehicleNumber
            ? `Dispatched via vehicle ${input.vehicleNumber}`
            : 'Ready for customer pickup';

          assertOrderUpdated(orderId, await repo.updateOrderStatus(tx, {
            orderId,
            fromStatus: order.status,
            toStatus: targetStatus,
            actorUserId: actor.userId,
            note,
          }));

          await writeAuditLog(tx, {
            actorId: actor.userId,
            actionCode: 'order.dispatch',
            entityType: 'orders',
            entityId: orderId,
            after: {
              previousStatus: order.status,
              newStatus: targetStatus,
              vehicleNumber: input.vehicleNumber,
            },
          });
        } else {
          // DELIVERY order (BR-21, BR-159)
          if (!input.deliveryPartnerId) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `Order ${orderId} is for home delivery and requires a delivery partner.`,
            });
          }

          const partnerRes = await tx.query<{ id: string; name: string; is_active: boolean }>(
            `SELECT id, name, is_active FROM delivery_partners WHERE id = $1 AND deleted_at IS NULL`,
            [input.deliveryPartnerId],
          );
          const partner = partnerRes.rows[0];
          if (!partner || !partner.is_active) {
            throw new AppError('NOT_FOUND', {
              status: 404,
              detail: `Delivery partner ${input.deliveryPartnerId} not found or inactive.`,
            });
          }

          targetStatus = 'OUT_FOR_DELIVERY';
          validateTransition(order.status, targetStatus);

          if (!order.deliveryDate) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: 'Cannot dispatch a delivery order with no delivery date.',
            });
          }

          // Check slot locking and capacity (BR-159)
          if (input.slot && order.deliverySlot && input.slot !== order.deliverySlot) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: `Cannot change delivery slot at dispatch; order is booked for slot ${order.deliverySlot}.`,
            });
          }

          const effectiveSlot = input.slot ?? (order.deliverySlot as DeliverySlot | null | undefined);
          const effectiveDate = order.deliveryDate;
          if (effectiveSlot && effectiveDate) {
            const slotRes = await tx.query<{ id: string; capacity_orders: number; booked_orders: number }>(
              `SELECT id, capacity_orders, booked_orders
                 FROM delivery_slots
                WHERE warehouse_id = $1 AND slot_date = $2 AND slot = $3
                FOR UPDATE`,
              [order.warehouseId, effectiveDate, effectiveSlot],
            );
            if (slotRes.rows.length > 0) {
              const slotRow = slotRes.rows[0]!;
              const alreadyBooked = order.deliverySlot === effectiveSlot;
              if (!alreadyBooked) {
                if (slotRow.booked_orders >= slotRow.capacity_orders) {
                  throw new AppError('CONFLICT', {
                    status: 409,
                    detail: `Delivery slot ${effectiveSlot} is fully booked.`,
                  });
                }
                await tx.query(
                  `UPDATE delivery_slots SET booked_orders = booked_orders + 1, updated_at = now() WHERE id = $1`,
                  [slotRow.id],
                );
              }
            }
          }

          note = input.vehicleNumber
            ? `Dispatched via ${partner.name} (${input.vehicleNumber})`
            : `Dispatched via ${partner.name}`;

          assertOrderUpdated(orderId, await repo.updateOrderStatus(tx, {
            orderId,
            fromStatus: order.status,
            toStatus: targetStatus,
            actorUserId: actor.userId,
            note,
            deliveryPartnerId: input.deliveryPartnerId,
            deliverySlot: effectiveSlot ?? undefined,
          }));

          await writeAuditLog(tx, {
            actorId: actor.userId,
            actionCode: 'order.dispatch',
            entityType: 'orders',
            entityId: orderId,
            after: {
              previousStatus: order.status,
              newStatus: targetStatus,
              deliveryPartnerId: input.deliveryPartnerId,
              vehicleNumber: input.vehicleNumber,
              slot: effectiveSlot ?? undefined,
            },
          });
        }

        const updated = await orderAfterChange(tx, orderId);
        await idem.complete(updated);
        return { replayed: false as const, order: updated, targetStatus, note };
      });
      if (outcome.replayed) return outcome.order;

      const eventPayload: OrderTrackingEvent = {
        status: outcome.targetStatus,
        at: new Date().toISOString(),
        note: outcome.note,
      };
      emitter.emit(`order:${orderId}`, eventPayload);

      return outcome.order;
    },

    async verifyOtp(actor, scope, orderId, input, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);
      const warehouseScope = getWarehouseScope(actor);

      // BR-118: claimed first. A replay of a verification that succeeded returns the stored order:
      // it re-checks no code, counts no attempt and writes no second history or audit row.
      let outcome: { replayed: true; order: AdminOrderDetail } | { replayed: false; order: AdminOrderDetail; targetStatus: OrderStatus };
      try {
        outcome = await runTx(async (tx) => {
          const idem = await beginIdempotent<AdminOrderDetail>(idempotency, tx, {
            actorUserId: actor.userId,
            key,
            operation: OPERATION.verifyOtp,
            request: { orderId, body: input },
          });
          if (idem.replay) return { replayed: true as const, order: idem.response };

          const otpHolder = await repo.getOrderDeliveryOtpHolder(tx, orderId);
          if (!otpHolder || !warehouseVisible(scope, otpHolder.warehouseId)) {
            throw new AppError('NOT_FOUND', {
              status: 404,
              detail: `Order ${orderId} not found.`,
            });
          }

          if (warehouseScope && otpHolder.warehouseId !== warehouseScope) {
            throw new AppError('NOT_FOUND', {
              status: 404,
              detail: `Order ${orderId} not found.`,
            });
          }

          const maxAttempts = await repo.getMaxOtpAttempts(tx);
          if (otpHolder.otpAttempts >= maxAttempts) {
            throw new AppError('OTP_LOCKED', {
              status: 429,
              detail: 'Maximum OTP verification attempts exceeded. OTP is locked.',
            });
          }

          if (!otpHolder.deliveryOtpHash) {
            throw new AppError('INVALID_STATE_TRANSITION', {
              status: 409,
              detail: 'Order has no delivery OTP configured.',
            });
          }

          // Hash input OTP and compare in constant time
          const inputHash = createHash('sha256').update(input.otp).digest('hex');
          const bufA = Buffer.from(inputHash, 'utf8');
          const bufB = Buffer.from(otpHolder.deliveryOtpHash, 'utf8');
          const isMatch = bufA.length === bufB.length && timingSafeEqual(bufA, bufB);

          // Roll this transaction (and the claim) back; the attempt is counted below, outside it.
          if (!isMatch) throw new WrongOtpAttempt(maxAttempts);

          const targetStatus: OrderStatus =
            otpHolder.fulfilmentType === 'PICKUP' ? 'PICKED_UP' : 'DELIVERED';

          validateTransition(otpHolder.status, targetStatus);

          assertOrderUpdated(orderId, await repo.updateOrderStatus(tx, {
            orderId,
            fromStatus: otpHolder.status,
            toStatus: targetStatus,
            actorUserId: actor.userId,
            completedAt: new Date(),
            otpVerifiedAt: new Date(),
            otpVerifiedBy: actor.userId,
            note: 'Handover verified via OTP',
          }));

          await writeAuditLog(tx, {
            actorId: actor.userId,
            actionCode: 'order.pickup_otp.verify',
            entityType: 'orders',
            entityId: orderId,
            after: {
              previousStatus: otpHolder.status,
              newStatus: targetStatus,
            },
          });

          const updated = await orderAfterChange(tx, orderId);
          await idem.complete(updated);
          return { replayed: false as const, order: updated, targetStatus };
        });
      } catch (error) {
        if (!(error instanceof WrongOtpAttempt)) throw error;
        // BR-20: the wrong code counts, committed on its own (as before BR-118), so the lockout
        // holds even though the refused request's transaction and claim were rolled back.
        const attempts = await repo.incrementOtpAttempts(db, orderId);
        const remaining = Math.max(0, error.maxAttempts - attempts);
        throw new AppError('OTP_INVALID', {
          status: 422,
          detail: `${remaining} attempts remaining before this OTP is locked.`,
          meta: { remainingAttempts: remaining },
        });
      }
      if (outcome.replayed) return outcome.order;

      const eventPayload: OrderTrackingEvent = {
        status: outcome.targetStatus,
        at: new Date().toISOString(),
        note: 'Handover verified via OTP',
      };
      emitter.emit(`order:${orderId}`, eventPayload);

      return outcome.order;
    },

    async getAdminOrderDetail(scope, orderId) {
      const record = await repo.findAdminOrderDetail(db, scope, orderId);
      if (record === null) {
        // Same code and detail for "unknown" and "outside your warehouse" (BR-30): a different
        // answer would confirm that the order exists.
        throw new AppError('NOT_FOUND', { detail: `Order "${orderId}" not found.` });
      }
      return toAdminOrderDetail(record);
    },

    async getOrderTracking(actor, scope, orderId) {
      const customerScope = actor.customerId ?? null;
      const tracking = await repo.getOrderTracking(db, orderId, customerScope);
      if (!tracking) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order tracking for ${orderId} not found.`,
        });
      }
      return tracking;
    },

    async streamOrderEvents(actor, scope, orderId, req, res) {
      const customerScope = actor.customerId ?? null;
      const tracking = await repo.getOrderTracking(db, orderId, customerScope);
      if (!tracking) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      // Send initial tracking status frame
      const initialEvent: OrderTrackingEvent = {
        status: tracking.status,
        at: new Date().toISOString(),
        note: 'Connected to order event stream',
      };
      res.write(`event: order.status\ndata: ${JSON.stringify(initialEvent)}\n\n`);

      // Heartbeat keepalive every 20 seconds
      const heartbeatInterval = setInterval(() => {
        res.write(': keepalive\n\n');
      }, 20000);

      // Event listener
      const onStatusChange = (event: OrderTrackingEvent) => {
        res.write(`event: order.status\ndata: ${JSON.stringify(event)}\n\n`);
        if (
          event.status === 'DELIVERED' ||
          event.status === 'PICKED_UP' ||
          event.status === 'CANCELLED'
        ) {
          cleanup();
          res.end();
        }
      };

      const cleanup = () => {
        clearInterval(heartbeatInterval);
        emitter.removeListener(`order:${orderId}`, onStatusChange);
      };

      emitter.on(`order:${orderId}`, onStatusChange);
      req.on('close', cleanup);
    },

    async cancelOrder(actor, scope, orderId, input, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);
      const warehouseScope = getWarehouseScope(actor);
      return await runTx(async (tx) => {
        const idem = await beginIdempotent<AdminOrderDetailResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: OPERATION.cancel,
          request: { orderId, body: input },
        });
        if (idem.replay) return idem.response;

        const order = await repo.findOrderForFulfilment(tx, orderId, warehouseScope);
        if (!order || !warehouseVisible(scope, order.warehouseId)) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Order ${orderId} not found.`,
          });
        }
        if (warehouseScope && order.warehouseId !== warehouseScope) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Order ${orderId} not found.`,
          });
        }

        validateTransition(order.status, 'CANCELLED');

        const reason = input.reason?.trim() || 'Cancelled by admin';

        assertOrderUpdated(
          orderId,
          await repo.updateOrderStatus(tx, {
            orderId,
            fromStatus: order.status,
            toStatus: 'CANCELLED',
            actorUserId: actor.userId,
            cancelledAt: new Date(),
            cancellationReason: reason,
            note: reason,
          }),
        );

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'order.cancel',
          entityType: 'orders',
          entityId: orderId,
          after: {
            previousStatus: order.status,
            newStatus: 'CANCELLED',
            reason,
          },
        });

        const record = await repo.findAdminOrderDetail(tx, scope, orderId);
        if (record === null) {
          throw new AppError('INTERNAL', { detail: `Order ${orderId} vanished.` });
        }
        const response = toAdminOrderDetail(record);
        await idem.complete(response);
        return response;
      });
    },

    async createOrderIssue(actor, scope, orderId, input, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);
      const warehouseScope = getWarehouseScope(actor);
      return await runTx(async (tx) => {
        const idem = await beginIdempotent<OrderIssueResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: OPERATION.issue,
          request: { orderId, body: input },
        });
        if (idem.replay) return idem.response;

        const order = await repo.findOrderForFulfilment(tx, orderId, warehouseScope);
        if (!order || !warehouseVisible(scope, order.warehouseId)) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Order ${orderId} not found.`,
          });
        }
        if (warehouseScope && order.warehouseId !== warehouseScope) {
          throw new AppError('NOT_FOUND', {
            status: 404,
            detail: `Order ${orderId} not found.`,
          });
        }

        const seqRes = await tx.query<{ nextval: string }>(
          `SELECT nextval('warehouse_issue_number_seq')::text AS nextval`,
        );
        const seqNum = seqRes.rows[0]?.nextval ?? '1';
        const issueNumber = `ISS-${seqNum.padStart(4, '0')}`;

        const issueType = input.issueType ?? 'OTHER';
        const severity = input.severity ?? 'MEDIUM';
        const category =
          issueType.toLowerCase() === 'quality' || issueType.toLowerCase() === 'damaged'
            ? 'QUALITY'
            : 'OTHER';
        const title = `Order ${order.orderNumber} Issue: ${issueType}`.slice(0, 160);
        const description = input.description.slice(0, 4000);
        const lineItemIdsJson = JSON.stringify(input.lineItemIds ?? []);

        const insertRes = await tx.query<{ id: string; issue_number: string; status: string }>(
          `INSERT INTO warehouse_issues (
             issue_number, warehouse_id, category, severity, title,
             description, status, reported_by, order_id, order_line_ids
           )
           VALUES ($1, $2, $3, $4, $5, $6, 'OPEN', $7, $8, $9::jsonb)
           RETURNING id, issue_number, status`,
          [
            issueNumber,
            order.warehouseId,
            category,
            severity,
            title,
            description,
            actor.userId,
            orderId,
            lineItemIdsJson,
          ],
        );
        const issueRow = insertRes.rows[0]!;

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actionCode: 'warehouse.issue.manage',
          entityType: 'warehouse_issues',
          entityId: issueRow.id,
          after: {
            orderId,
            issueNumber: issueRow.issue_number,
            category,
            status: issueRow.status,
          },
        });

        const response: OrderIssueResponse = {
          id: issueRow.id,
          issueNumber: issueRow.issue_number,
          status: issueRow.status,
        };
        await idem.complete(response);
        return response;
      });
    },

    async checkStock(scope, orderId) {
      const order = await repo.findOrderForFulfilment(db, orderId);
      if (!order || !warehouseVisible(scope, order.warehouseId)) {
        throw new AppError('NOT_FOUND', {
          status: 404,
          detail: `Order ${orderId} not found.`,
        });
      }

      const linesRes = await db.query<{
        id: string;
        crop_id: string;
        name: string;
        grade: string;
        qty_kg: string;
      }>(
        `SELECT oi.id, oi.crop_id, cm.name, oi.grade::text AS grade, oi.qty_kg::text AS qty_kg
           FROM order_items oi
           JOIN crop_master cm ON cm.id = oi.crop_id
          WHERE oi.order_id = $1
          ORDER BY oi.created_at, oi.id`,
        [orderId],
      );

      let anyShortage = false;
      const lines = [];

      for (const line of linesRes.rows) {
        const orderedKg = Number(line.qty_kg);

        const stockRes = await db.query<{ shelf_stock: string }>(
          `SELECT COALESCE(SUM(qty_available), 0)::text AS shelf_stock
             FROM inventory_batches
            WHERE warehouse_id = $1
              AND crop_id = $2
              AND grade = $3::produce_grade
              AND status = 'ACTIVE'`,
          [order.warehouseId, line.crop_id, line.grade],
        );
        const availableStockKg = Number(stockRes.rows[0]?.shelf_stock ?? 0);

        const reservedRes = await db.query<{ reserved: string }>(
          `SELECT COALESCE(SUM(a.reserved_qty), 0)::text AS reserved
             FROM allocations a
             JOIN inventory_batches b ON b.id = a.batch_id
            WHERE b.warehouse_id = $1
              AND b.crop_id = $2
              AND b.grade = $3::produce_grade
              AND b.status = 'ACTIVE'`,
          [order.warehouseId, line.crop_id, line.grade],
        );
        const reservedKg = Number(reservedRes.rows[0]?.reserved ?? 0);

        const availableKg = Math.max(0, availableStockKg - reservedKg);
        const shortageKg = Math.max(0, orderedKg - availableKg);
        const isShort = shortageKg > 0;
        if (isShort) anyShortage = true;

        lines.push({
          orderItemId: line.id,
          cropId: line.crop_id,
          cropName: line.name,
          grade: line.grade,
          orderedKg: orderedKg.toFixed(3),
          availableStockKg: availableStockKg.toFixed(3),
          reservedKg: reservedKg.toFixed(3),
          availableKg: availableKg.toFixed(3),
          shortageKg: shortageKg.toFixed(3),
          status: isShort ? ('SHORTAGE' as const) : ('IN_STOCK' as const),
        });
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: anyShortage ? ('INSUFFICIENT' as const) : ('AVAILABLE' as const),
        lines,
      };
    },

    async getOrdersSummary(scope, query) {
      if (query.warehouseId && !warehouseVisible(scope, query.warehouseId)) {
        return {
          total: 0,
          byStatus: Object.fromEntries(orderStatuses.map((s) => [s, 0])),
          byWarehouse: [],
        };
      }

      const params: any[] = [];
      const conditions: string[] = [];

      // Warehouse scoping
      if (scope.level === 'own' && scope.warehouseIds && scope.warehouseIds.length > 0) {
        params.push(scope.warehouseIds);
        conditions.push(`o.warehouse_id = ANY($${params.length}::uuid[])`);
      } else if (query.warehouseId) {
        params.push(query.warehouseId);
        conditions.push(`o.warehouse_id = $${params.length}`);
      }

      if (query.from) {
        params.push(query.from);
        conditions.push(`o.placed_at >= $${params.length}::timestamptz`);
      }
      if (query.to) {
        params.push(query.to);
        conditions.push(`o.placed_at <= $${params.length}::timestamptz`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const statusRes = await db.query<{ status: string; count: string }>(
        `SELECT o.status::text, count(*)::text AS count
           FROM orders o
          ${whereClause}
          GROUP BY o.status`,
        params,
      );

      const byStatus: Record<string, number> = Object.fromEntries(
        orderStatuses.map((s) => [s, 0]),
      );
      let total = 0;
      for (const row of statusRes.rows) {
        const count = Number(row.count);
        byStatus[row.status] = count;
        total += count;
      }

      // Warehouse counts
      const whConditions: string[] = [];
      const whParams: any[] = [];
      if (scope.level === 'own' && scope.warehouseIds && scope.warehouseIds.length > 0) {
        whParams.push(scope.warehouseIds);
        whConditions.push(`w.id = ANY($${whParams.length}::uuid[])`);
      } else if (query.warehouseId) {
        whParams.push(query.warehouseId);
        whConditions.push(`w.id = $${whParams.length}`);
      }
      const whWhere = whConditions.length > 0 ? `WHERE ${whConditions.join(' AND ')}` : '';

      const orderJoinConditions = ['o.warehouse_id = w.id'];
      const joinParams = [...whParams];
      if (query.from) {
        joinParams.push(query.from);
        orderJoinConditions.push(`o.placed_at >= $${joinParams.length}::timestamptz`);
      }
      if (query.to) {
        joinParams.push(query.to);
        orderJoinConditions.push(`o.placed_at <= $${joinParams.length}::timestamptz`);
      }

      const whRes = await db.query<{ warehouseId: string; name: string; count: string }>(
        `SELECT w.id AS "warehouseId", w.name, count(o.id)::text AS count
           FROM warehouses w
           LEFT JOIN orders o ON ${orderJoinConditions.join(' AND ')}
          ${whWhere}
          GROUP BY w.id, w.name
          ORDER BY w.name`,
        joinParams,
      );

      const byWarehouse = whRes.rows.map((r) => ({
        warehouseId: r.warehouseId,
        name: r.name,
        count: Number(r.count),
      }));

      return {
        total,
        byStatus,
        byWarehouse,
      };
    },
  };
}

export const fulfilmentService = createFulfilmentService();
