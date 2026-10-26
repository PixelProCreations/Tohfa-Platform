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
  OrderTracking,
  OrderTrackingEvent,
} from './fulfilment.schema.js';
import type { OrderStatus } from './orders.schema.js';

export const orderEventsEmitter = new EventEmitter();

// Valid state machine transitions
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'READY_FOR_PICKUP', 'CANCELLED'],
  PACKED: ['READY_FOR_PICKUP', 'DISPATCHED', 'PICKED_UP', 'CANCELLED'],
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
export function maskMobile(mobile: string | null): string | null {
  if (mobile === null) return null;
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
    customerName: record.buyerName ?? null,
    customerMobileMasked: maskMobile(record.buyerMobile ?? null),
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
    paymentMethod: record.paymentMethod,
    paymentStatus: record.paymentStatus,
    warehouse: { id: record.warehouseId, name: record.warehouseName },
    buyer,
    items: record.items.map((item) => ({
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

        const targetStatus: OrderStatus =
          order.fulfillmentType === 'PICKUP' ? 'READY_FOR_PICKUP' : 'DISPATCHED';

        validateTransition(order.status, targetStatus);

        const note = input.vehicleNumber
          ? `Dispatched via vehicle ${input.vehicleNumber}`
          : order.fulfillmentType === 'PICKUP'
            ? 'Ready for customer pickup'
            : 'Dispatched for delivery';

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
            deliveryPartnerId: input.deliveryPartnerId,
          },
        });

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
  };
}

export const fulfilmentService = createFulfilmentService();
