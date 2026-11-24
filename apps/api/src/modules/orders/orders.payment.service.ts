/**
 * BR-213..BR-215: the gateway-paid order lifecycle after creation.
 *
 * ONE confirmation path (`confirmOrderPayment`) is shared by the client verify call, the Razorpay
 * webhook, the customer cancel (when it finds a capture) and the payment-expiry sweep. It always
 * locks the order row FOR UPDATE first, so verify and webhook racing each other serialise and the
 * second one finds the order already CONFIRMED by the same payment (idempotent, no second event).
 * The UNIQUE payments.gateway_payment_id is the last guard.
 *
 * Refunds are MANUAL (owner decision 2026-11-20): a capture that arrives after the order was
 * cancelled leaves it CANCELLED with payment_status REFUND_DUE; nothing here calls a refund API.
 */
import { parseMoney, toPaise } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import {
  beginIdempotent,
  idempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { logger } from '../../logger.js';
import { paymentGateway as defaultPaymentGateway, type PaymentGateway } from '../../payments/index.js';
import type { PaymentCapturedPayload } from '../../payments/gateway.js';
import { createOrderEventPublisher, type OrderEventPublisher } from './orders.events.js';
import {
  ordersRepo,
  type OrderPaymentRecord,
  type OrderRecord,
  type OrdersRepo,
  type PendingOrderCancellationReason,
} from './orders.repo.js';
import type { OrderPaymentVerifyRequest, OrderResponse } from './orders.schema.js';
import { mapOrderResponse, orderPaymentBlock, razorpayKeyIdFor } from './orders.service.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** Who is acting: a customer (verify, cancel) or the system (webhook, sweep). */
export interface PaymentActor {
  userId: string | null;
  role: string;
}

const SYSTEM_ACTOR: PaymentActor = { userId: null, role: 'SYSTEM_BOT' };

export type ConfirmOutcome = 'CONFIRMED' | 'ALREADY_CONFIRMED';

export interface ConfirmOptions {
  actor?: PaymentActor;
  /** The checkout signature (verify only), stored on the payments row. */
  signature?: string | null;
  /** The webhook payload, stored on the payments row. */
  rawPayload?: unknown;
  /** Where the capture was learned from; recorded in the audit row. */
  source: 'VERIFY' | 'WEBHOOK' | 'CANCEL' | 'SWEEP';
}

export interface ExpirySweepResult {
  scanned: number;
  confirmed: number;
  cancelled: number;
  skipped: number;
  failed: number;
}

export interface OrderPaymentService {
  /**
   * BR-214 3: THE confirmation. Locks the order; PENDING_PAYMENT -> CONFIRMED/PAID (payments row
   * CAPTURED, history, audit `order.payment.confirm`, `order.confirmed` after commit); already
   * CONFIRMED by this payment -> ALREADY_CONFIRMED (nothing written, no event); CANCELLED -> the
   * order stays cancelled, payment_status REFUND_DUE, and 409 ORDER_PAYMENT_EXPIRED is thrown
   * AFTER that write commits. The payment must be `captured`, for the order's gateway order and
   * for exactly the order total, else 409 PAYMENT_AMOUNT_MISMATCH.
   */
  confirmOrderPayment(
    gatewayOrderId: string,
    payment: PaymentCapturedPayload,
    opts: ConfirmOptions,
  ): Promise<{ outcome: ConfirmOutcome; orderId: string }>;

  /** BR-213 / BR-214 4: a `payment.failed` attempt is recorded; the order is not touched. */
  recordFailedPayment(gatewayOrderId: string, rawPayload?: unknown): Promise<void>;

  /** BR-214: POST /orders/{id}/payment/verify. */
  verifyOrderPayment(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    body: OrderPaymentVerifyRequest,
  ): Promise<OrderResponse>;

  /** BR-215 3: POST /orders/{id}/cancel. */
  cancelPendingOrder(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    idempotencyKey: string | undefined,
  ): Promise<OrderResponse>;

  /** BR-215 2: job `order-payment-expiry-sweep`. */
  sweepExpiredPendingOrders(limit?: number): Promise<ExpirySweepResult>;
}

/** The `operation` of a cancel's idempotency_keys claim. */
const CANCEL_OPERATION = 'order.payment.cancel';

function gatewayUnavailable(cause: unknown): AppError {
  return new AppError('PAYMENT_GATEWAY_UNAVAILABLE', {
    status: 503,
    detail: 'The payment gateway could not be reached. Nothing was changed; please retry.',
    cause,
  });
}

function notFound(): AppError {
  return new AppError('NOT_FOUND', { status: 404, detail: 'Order not found.' });
}

function notAwaitingPayment(status: string): AppError {
  return new AppError('ORDER_NOT_AWAITING_PAYMENT', {
    status: 409,
    detail: `The order is ${status}, not awaiting payment (BR-215).`,
  });
}

function amountMismatch(detail: string): AppError {
  return new AppError('PAYMENT_AMOUNT_MISMATCH', { status: 409, detail });
}

function paymentExpired(): AppError {
  return new AppError('ORDER_PAYMENT_EXPIRED', {
    status: 409,
    detail:
      'The payment arrived after the order was cancelled. The order stays cancelled and the amount will be refunded (BR-215).',
  });
}

/** BR-214 2: captured, against this gateway order, for exactly the order total in paise. */
function assertCaptureMatches(order: OrderRecord, gatewayOrderId: string, payment: PaymentCapturedPayload): void {
  if (payment.status !== 'captured') {
    throw amountMismatch(`The payment is ${payment.status}, not captured.`);
  }
  if (payment.orderId && payment.orderId !== gatewayOrderId) {
    throw amountMismatch('The payment was made against a different gateway order.');
  }
  const totalPaise = toPaise(parseMoney(order.totalAmount));
  if (payment.amountPaise !== totalPaise) {
    throw amountMismatch(
      `The payment amount (${payment.amountPaise} paise) does not equal the order total (${totalPaise} paise).`,
    );
  }
}

export function createOrderPaymentService(opts: {
  repo?: OrdersRepo;
  gateway?: PaymentGateway;
  db?: Executor;
  runTx?: TransactionRunner;
  events?: OrderEventPublisher;
  idempotency?: IdempotencyStore;
} = {}): OrderPaymentService {
  const repo = opts.repo ?? ordersRepo;
  const gateway = opts.gateway ?? defaultPaymentGateway;
  const db = opts.db ?? pool;
  const runTx: TransactionRunner = opts.runTx ?? ((fn) => withTransaction(fn));
  const events = opts.events ?? createOrderEventPublisher({ db });
  const idempotency = opts.idempotency ?? idempotencyStore;

  async function audit(
    tx: Executor,
    actor: PaymentActor,
    actionCode: string,
    order: OrderRecord,
    after: Record<string, unknown>,
  ): Promise<void> {
    await writeAuditLog(tx, {
      actorId: actor.userId,
      ...(actor.userId === null ? { actorType: 'SYSTEM' as const } : {}),
      actorRole: actor.role,
      actionCode,
      entityType: 'order',
      entityId: order.id,
      warehouseId: order.warehouseId,
      before: { status: order.status, paymentStatus: order.paymentStatus },
      after,
    });
  }

  /**
   * The confirmation writes on an order the caller has ALREADY locked (lockOrderForPayment) in
   * `tx`. Returns 'REFUND_DUE' for a cancelled order (the caller throws ORDER_PAYMENT_EXPIRED
   * after commit, so the REFUND_DUE write is kept).
   */
  async function confirmLocked(
    tx: Executor,
    order: OrderRecord,
    gatewayOrderId: string,
    payment: PaymentCapturedPayload,
    o: ConfirmOptions,
  ): Promise<ConfirmOutcome | 'REFUND_DUE'> {
    const actor = o.actor ?? SYSTEM_ACTOR;
    const row: OrderPaymentRecord | null = await repo.getOrderPayment(tx, order.id);
    if (!row || row.gatewayOrderId !== gatewayOrderId) {
      throw amountMismatch('The payment does not belong to this order.');
    }

    if (order.status === 'PENDING_PAYMENT') {
      assertCaptureMatches(order, gatewayOrderId, payment);
      const captured = await capture(tx, row, payment, o);
      if (!captured) {
        throw new AppError('CONFLICT', {
          status: 409,
          detail: 'The order payment is already recorded with another payment id.',
        });
      }
      const confirmed = await repo.confirmPendingOrder(tx, {
        orderId: order.id,
        actorUserId: actor.userId,
        note: `Gateway payment ${payment.paymentId} captured and verified (${o.source.toLowerCase()})`,
      });
      if (!confirmed) throw notAwaitingPayment(order.status);
      await audit(tx, actor, 'order.payment.confirm', order, {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        gatewayOrderId,
        gatewayPaymentId: payment.paymentId,
        amountPaise: payment.amountPaise,
        source: o.source,
      });
      return 'CONFIRMED';
    }

    if (order.status === 'CANCELLED') {
      // BR-215 5: late capture. Only a real capture makes money due back to the customer.
      if (payment.status !== 'captured') {
        throw amountMismatch(`The payment is ${payment.status}, not captured.`);
      }
      if (order.paymentStatus === 'REFUND_DUE' && row.gatewayPaymentId === payment.paymentId) {
        return 'REFUND_DUE'; // already recorded; nothing to write
      }
      await capture(tx, row, payment, o);
      await repo.markOrderRefundDue(tx, order.id);
      await audit(tx, actor, 'order.payment.refund_due', order, {
        status: 'CANCELLED',
        paymentStatus: 'REFUND_DUE',
        gatewayOrderId,
        gatewayPaymentId: payment.paymentId,
        amountPaise: payment.amountPaise,
        source: o.source,
      });
      logger.warn(
        { orderId: order.id, gatewayOrderId, gatewayPaymentId: payment.paymentId },
        'order payment captured after cancellation: REFUND_DUE, refund manually in the Razorpay dashboard (BR-215)',
      );
      return 'REFUND_DUE';
    }

    // CONFIRMED (or already further along in fulfilment): paid before.
    if (order.paymentStatus === 'PAID' && row.status === 'CAPTURED') {
      if (row.gatewayPaymentId === payment.paymentId) return 'ALREADY_CONFIRMED';
      logger.error(
        { orderId: order.id, gatewayOrderId, gatewayPaymentId: payment.paymentId, recorded: row.gatewayPaymentId },
        'second capture for an already paid order: refund manually in the Razorpay dashboard',
      );
      throw new AppError('CONFLICT', {
        status: 409,
        detail: 'The order is already paid by another payment.',
      });
    }
    throw notAwaitingPayment(order.status);
  }

  /** payments row -> CAPTURED. false when the row already holds a different payment id. */
  async function capture(
    tx: Executor,
    row: OrderPaymentRecord,
    payment: PaymentCapturedPayload,
    o: ConfirmOptions,
  ): Promise<boolean> {
    let updated: OrderPaymentRecord | null;
    try {
      updated = await repo.markOrderPaymentCaptured(tx, {
        paymentId: row.id,
        gatewayPaymentId: payment.paymentId,
        signature: o.signature ?? null,
        ...(o.rawPayload === undefined ? {} : { rawPayload: o.rawPayload }),
      });
    } catch (err) {
      // UNIQUE payments.gateway_payment_id: this payment id is already recorded elsewhere.
      if ((err as { code?: string }).code === '23505') {
        throw new AppError('CONFLICT', { status: 409, detail: 'This payment is already recorded.', cause: err });
      }
      throw err;
    }
    if (updated) return true;
    // Already CAPTURED/REFUNDED: fine only when it is this same payment.
    return row.gatewayPaymentId === payment.paymentId;
  }

  /** BR-215 4: cancel + release, in the caller's transaction, on a locked PENDING_PAYMENT order. */
  async function cancelLocked(
    tx: Executor,
    order: OrderRecord,
    reason: PendingOrderCancellationReason,
    actor: PaymentActor,
  ): Promise<void> {
    const cancelled = await repo.cancelPendingOrder(tx, { orderId: order.id, reason, actorUserId: actor.userId });
    if (!cancelled) throw notAwaitingPayment(order.status);
    const stock = await repo.releaseOrderStock(tx, order, actor.userId);
    const slotReleased = await repo.releaseDeliverySlot(tx, order);
    await audit(tx, actor, 'order.payment.cancel', order, {
      status: 'CANCELLED',
      paymentStatus: 'FAILED',
      cancellationReason: reason,
      stockReleased: stock.released,
      slotReleased,
    });
  }

  /** The captured payment of a gateway order, if any (BR-215 cancel and sweep). */
  async function findCapture(gatewayOrderId: string): Promise<PaymentCapturedPayload | null> {
    if (!gateway.fetchOrderPayments) throw gatewayUnavailable(new Error('gateway cannot list order payments'));
    let payments: PaymentCapturedPayload[];
    try {
      payments = await gateway.fetchOrderPayments(gatewayOrderId);
    } catch (err) {
      throw gatewayUnavailable(err);
    }
    return payments.find((p) => p.status === 'captured') ?? null;
  }

  async function loadOwnResponse(
    executor: Executor,
    orderId: string,
    customerId: string,
    extra: Pick<OrderRecord, 'cancellationReason'> = {},
  ): Promise<OrderResponse> {
    const res = await repo.findOrderById(executor, orderId, customerId);
    if (!res) throw notFound();
    const order: OrderRecord = { ...res.order, ...extra };
    const payment = await repo.getOrderPayment(executor, orderId);
    return mapOrderResponse(order, res.items, orderPaymentBlock(order, payment, razorpayKeyIdFor(gateway)));
  }

  async function confirmOrderPayment(
    gatewayOrderId: string,
    payment: PaymentCapturedPayload,
    o: ConfirmOptions,
  ): Promise<{ outcome: ConfirmOutcome; orderId: string }> {
    const found = await repo.getOrderByGatewayOrderId(db, gatewayOrderId);
    if (!found) throw notFound();
    const orderId = found.order.id;
    const outcome = await runTx(async (tx) => {
      const locked = await repo.lockOrderForPayment(tx, orderId);
      if (!locked) throw notFound();
      return confirmLocked(tx, locked, gatewayOrderId, payment, o);
    });
    if (outcome === 'REFUND_DUE') throw paymentExpired();
    if (outcome === 'CONFIRMED') await events.publish('order.confirmed', orderId);
    return { outcome, orderId };
  }

  return {
    confirmOrderPayment,

    async recordFailedPayment(gatewayOrderId, rawPayload) {
      const found = await repo.getOrderByGatewayOrderId(db, gatewayOrderId);
      if (!found) return;
      await repo.markOrderPaymentFailed(db, {
        paymentId: found.payment.id,
        ...(rawPayload === undefined ? {} : { rawPayload }),
      });
    },

    async verifyOrderPayment(actor, scope, orderId, body) {
      // Own order only; unknown and another customer's are the same 404 (BR-36).
      const customerId = actor.customerId;
      const own = customerId ? await repo.findOrderById(db, orderId, customerId) : null;
      if (!own || !customerId) throw notFound();

      const row = await repo.getOrderPayment(db, orderId);
      const signatureOk =
        gateway.verifyPaymentSignature?.(body.razorpayOrderId, body.razorpayPaymentId, body.razorpaySignature) ?? false;
      if (!signatureOk || !row?.gatewayOrderId || body.razorpayOrderId !== row.gatewayOrderId) {
        throw new AppError('PAYMENT_SIGNATURE_INVALID', {
          status: 422,
          detail: 'The payment signature does not verify for this order.',
        });
      }

      // An idempotent repeat of a verify that already confirmed: no gateway round trip.
      if (own.order.status !== 'PENDING_PAYMENT' && row.status === 'CAPTURED' && row.gatewayPaymentId === body.razorpayPaymentId) {
        if (own.order.status === 'CANCELLED') throw paymentExpired();
        return loadOwnResponse(db, orderId, customerId);
      }

      // BR-214 2: never trust the client's success; ask Razorpay.
      if (!gateway.fetchPayment) throw gatewayUnavailable(new Error('gateway cannot fetch payments'));
      let fetched: PaymentCapturedPayload | null;
      try {
        fetched = await gateway.fetchPayment(body.razorpayPaymentId);
      } catch (err) {
        throw gatewayUnavailable(err);
      }
      if (!fetched) throw amountMismatch('The payment was not found at the gateway.');
      if (fetched.orderId !== row.gatewayOrderId) {
        throw amountMismatch('The payment was made against a different gateway order.');
      }
      if (fetched.status === 'authorized') {
        throw new AppError('PAYMENT_PENDING', {
          status: 202,
          detail: 'The payment is authorized but not yet captured. Poll the order; it confirms automatically.',
        });
      }
      assertCaptureMatches(own.order, row.gatewayOrderId, fetched);

      await confirmOrderPayment(row.gatewayOrderId, fetched, {
        actor: { userId: actor.userId, role: scope.roleCode },
        signature: body.razorpaySignature,
        source: 'VERIFY',
      });
      return loadOwnResponse(db, orderId, customerId);
    },

    async cancelPendingOrder(actor, scope, orderId, idempotencyKey) {
      const key = requireIdempotencyKey(idempotencyKey);
      const customerId = actor.customerId;
      const own = customerId ? await repo.findOrderById(db, orderId, customerId) : null;
      if (!own || !customerId) throw notFound();
      const who: PaymentActor = { userId: actor.userId, role: scope.roleCode };

      const result = await runTx(async (tx) => {
        const idem = await beginIdempotent<OrderResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: CANCEL_OPERATION,
          request: { orderId },
        });
        if (idem.replay) return { response: idem.response, confirmed: false };

        const locked = await repo.lockOrderForPayment(tx, orderId);
        if (!locked) throw notFound();
        if (locked.status !== 'PENDING_PAYMENT') throw notAwaitingPayment(locked.status);

        // BR-215 3: the customer may have paid a moment ago; a capture confirms instead.
        const row = await repo.getOrderPayment(tx, orderId);
        const captured = row?.gatewayOrderId ? await findCapture(row.gatewayOrderId) : null;
        let confirmed = false;
        let extra: Pick<OrderRecord, 'cancellationReason'> = {};
        if (captured && row?.gatewayOrderId) {
          const outcome = await confirmLocked(tx, locked, row.gatewayOrderId, captured, { actor: who, source: 'CANCEL' });
          confirmed = outcome === 'CONFIRMED';
        } else {
          await cancelLocked(tx, locked, 'CUSTOMER_CANCELLED', who);
          extra = { cancellationReason: 'CUSTOMER_CANCELLED' };
        }
        const response = await loadOwnResponse(tx, orderId, customerId, extra);
        await idem.complete(response);
        return { response, confirmed };
      });

      if (result.confirmed) await events.publish('order.confirmed', orderId);
      return result.response;
    },

    async sweepExpiredPendingOrders(limit = 100) {
      const expired = await repo.listExpiredPendingPaymentOrders(db, limit);
      const result: ExpirySweepResult = { scanned: expired.length, confirmed: 0, cancelled: 0, skipped: 0, failed: 0 };

      for (const candidate of expired) {
        try {
          // Ask the gateway BEFORE locking: an unreachable gateway leaves the order pending for
          // the next run rather than cancelling one that may have been paid.
          const captured = candidate.gatewayOrderId ? await findCapture(candidate.gatewayOrderId) : null;
          const outcome = await runTx(async (tx) => {
            const locked = await repo.lockOrderForPayment(tx, candidate.orderId);
            if (!locked || locked.status !== 'PENDING_PAYMENT') return 'SKIPPED' as const;
            if (captured && candidate.gatewayOrderId) {
              return confirmLocked(tx, locked, candidate.gatewayOrderId, captured, { source: 'SWEEP' });
            }
            await cancelLocked(tx, locked, 'PAYMENT_NOT_COMPLETED', SYSTEM_ACTOR);
            return 'CANCELLED' as const;
          });
          if (outcome === 'CONFIRMED') {
            result.confirmed += 1;
            await events.publish('order.confirmed', candidate.orderId);
          } else if (outcome === 'CANCELLED') {
            result.cancelled += 1;
          } else {
            result.skipped += 1;
          }
        } catch (err) {
          result.failed += 1;
          logger.error({ err, orderId: candidate.orderId }, 'order-payment-expiry-sweep: order not settled; retried next run');
        }
      }
      return result;
    },
  };
}

export const orderPaymentService = createOrderPaymentService();
