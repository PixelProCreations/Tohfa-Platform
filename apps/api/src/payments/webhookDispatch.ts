/**
 * POST /webhooks/razorpay routing (BR-17b top-ups, BR-214 orders).
 *
 * After the signature check, the event is routed by the `payments` row of its gateway order id:
 * `ref_type = 'TOPUP'` goes to the existing top-up handler unchanged, `ref_type = 'ORDER'` goes
 * to the ONE order confirmation path (`confirmOrderPayment`), the same function verify uses.
 *
 * Idempotency: the existing top-up handler is idempotent on the payment id (it does not dedupe
 * on X-Razorpay-Event-Id, and neither does this router); the order path is idempotent through
 * the order row lock + same payment id + UNIQUE payments.gateway_payment_id (BR-214).
 *
 * A business refusal on the order path (late capture after cancellation, amount mismatch, a
 * second payment) is answered 200 and logged: Razorpay retries non-2xx answers, and retrying
 * cannot change those outcomes. Infrastructure failures still throw so Razorpay retries.
 */
import { config } from '../config.js';
import { pool, type Executor } from '../db/pool.js';
import { AppError } from '../http/problem.js';
import { logger } from '../logger.js';
import { ordersRepo, type OrdersRepo } from '../modules/orders/orders.repo.js';
import {
  orderPaymentService,
  type OrderPaymentService,
} from '../modules/orders/orders.payment.service.js';
import { topupService, type TopupService } from '../modules/topup/topup.service.js';
import type { WebhookResponse } from '../modules/topup/topup.schema.js';
import { paymentGateway as defaultPaymentGateway } from './index.js';
import type { PaymentGateway } from './gateway.js';

export interface WebhookDispatcher {
  dispatch(rawBody: Buffer | string, signature: string | undefined, eventId: string | undefined): Promise<WebhookResponse>;
}

/** Order-path refusals that a webhook retry cannot change: acknowledged, logged. */
const SETTLED_ORDER_CODES = new Set([
  'ORDER_PAYMENT_EXPIRED',
  'PAYMENT_AMOUNT_MISMATCH',
  'ORDER_NOT_AWAITING_PAYMENT',
  'CONFLICT',
  'NOT_FOUND',
]);

export function createWebhookDispatcher(opts: {
  gateway?: PaymentGateway;
  repo?: Pick<OrdersRepo, 'getPaymentByGatewayOrderId'>;
  db?: Executor;
  topups?: Pick<TopupService, 'processRazorpayWebhook'>;
  orderPayments?: Pick<OrderPaymentService, 'confirmOrderPayment' | 'recordFailedPayment'>;
  webhookSecret?: string;
} = {}): WebhookDispatcher {
  const gateway = opts.gateway ?? defaultPaymentGateway;
  const repo = opts.repo ?? ordersRepo;
  const db = opts.db ?? pool;
  const topups = opts.topups ?? topupService;
  const orderPayments = opts.orderPayments ?? orderPaymentService;
  const secret = opts.webhookSecret ?? (config.RAZORPAY_WEBHOOK_SECRET || 'mock_webhook_secret');

  return {
    async dispatch(rawBody, signature, eventId) {
      if (!signature) {
        throw new AppError('UNAUTHENTICATED', { status: 401, detail: 'Missing X-Razorpay-Signature header.' });
      }
      if (!gateway.verifyWebhookSignature(rawBody, signature, secret)) {
        throw new AppError('UNAUTHENTICATED', { status: 401, detail: 'Invalid or forged webhook signature.' });
      }

      const event = gateway.parseEvent(rawBody);
      const gatewayOrderId = event.payment?.orderId ?? null;
      const row = gatewayOrderId ? await repo.getPaymentByGatewayOrderId(db, gatewayOrderId) : null;

      if (row?.refType !== 'ORDER' || !gatewayOrderId || !event.payment) {
        // TOPUP (and anything unrecognised): the pre-existing top-up handler, unchanged. It
        // re-checks the signature, which is cheap and keeps it safe to call on its own.
        return topups.processRazorpayWebhook(rawBody, signature, eventId);
      }

      if (event.event === 'payment.captured') {
        try {
          const { outcome } = await orderPayments.confirmOrderPayment(gatewayOrderId, event.payment, {
            rawPayload: event.rawPayload,
            source: 'WEBHOOK',
          });
          return { received: true, duplicate: outcome === 'ALREADY_CONFIRMED' };
        } catch (err) {
          if (err instanceof AppError && SETTLED_ORDER_CODES.has(err.code)) {
            logger.warn(
              { code: err.code, gatewayOrderId, gatewayPaymentId: event.payment.paymentId, eventId },
              'razorpay webhook: order payment not confirmed',
            );
            return { received: true };
          }
          throw err;
        }
      }

      if (event.event === 'payment.failed') {
        // BR-214 4: record the attempt only; the order stays PENDING_PAYMENT until expiry.
        await orderPayments.recordFailedPayment(gatewayOrderId, event.rawPayload);
        return { received: true };
      }

      return { received: true };
    },
  };
}

export const webhookDispatcher = createWebhookDispatcher();
