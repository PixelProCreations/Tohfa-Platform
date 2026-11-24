import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import {
  verifyRazorpayPaymentSignature,
  type CreateOrderParams,
  type GatewayOrderResult,
  type PaymentCapturedPayload,
  type PaymentGateway,
  type RefundPaymentParams,
  type RefundResult,
  type WebhookEvent,
} from './gateway.js';

/** Key secret the mock signs checkout callbacks with when RAZORPAY_KEY_SECRET is unset. */
export const MOCK_KEY_SECRET = 'mock_key_secret';

export class MockPaymentGateway implements PaymentGateway {
  readonly provider = 'mock' as const;
  readonly keySecret: string;
  /** Gateway orders created through this instance (amount in paise), for tests and dev. */
  readonly orders = new Map<string, { amountPaise: number; currency: string; receipt: string }>();
  /** Payment attempts registered with `simulatePayment`, by payment id. */
  readonly payments = new Map<string, PaymentCapturedPayload>();

  constructor(keySecret: string = config.RAZORPAY_KEY_SECRET || MOCK_KEY_SECRET) {
    this.keySecret = keySecret;
  }

  async createOrder(params: CreateOrderParams): Promise<GatewayOrderResult> {
    const syntheticId = `order_mock_${randomUUID().replace(/-/g, '').slice(0, 14)}`;
    const currency = params.currency ?? 'INR';
    this.orders.set(syntheticId, { amountPaise: Number(params.amountPaise), currency, receipt: params.receipt });
    return {
      gatewayOrderId: syntheticId,
      amountPaise: Number(params.amountPaise),
      currency,
      status: 'created',
    };
  }

  /**
   * Dev/test helper: records a payment attempt against a gateway order and returns it with the
   * checkout signature the Razorpay SDK would hand the client. The amount defaults to the order's.
   */
  simulatePayment(
    gatewayOrderId: string,
    opts: { status?: string; amountPaise?: number; paymentId?: string; method?: string } = {},
  ): PaymentCapturedPayload & { signature: string } {
    const paymentId = opts.paymentId ?? `pay_mock_${randomUUID().replace(/-/g, '').slice(0, 14)}`;
    const payment: PaymentCapturedPayload = {
      paymentId,
      orderId: gatewayOrderId,
      amountPaise: opts.amountPaise ?? this.orders.get(gatewayOrderId)?.amountPaise ?? 0,
      currency: 'INR',
      method: opts.method ?? 'upi',
      status: opts.status ?? 'captured',
      email: null,
      contact: null,
    };
    this.payments.set(paymentId, payment);
    return { ...payment, signature: this.signPayment(gatewayOrderId, paymentId) };
  }

  /** The checkout signature for an order/payment pair, as Razorpay computes it. */
  signPayment(gatewayOrderId: string, gatewayPaymentId: string): string {
    return createHmac('sha256', this.keySecret).update(`${gatewayOrderId}|${gatewayPaymentId}`).digest('hex');
  }

  verifyPaymentSignature(gatewayOrderId: string, gatewayPaymentId: string, signature: string): boolean {
    return verifyRazorpayPaymentSignature(gatewayOrderId, gatewayPaymentId, signature, this.keySecret);
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody;
    const expected = createHmac('sha256', secret).update(bodyBuffer).digest('hex');

    const sigBuf = Buffer.from(signature, 'utf-8');
    const expBuf = Buffer.from(expected, 'utf-8');

    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return timingSafeEqual(sigBuf, expBuf);
  }

  parseEvent(rawBody: Buffer | string): WebhookEvent {
    const text = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
    const parsed = JSON.parse(text) as {
      event: string;
      created_at?: number;
      payload?: {
        payment?: {
          entity?: {
            id: string;
            order_id?: string | null;
            amount: number;
            currency: string;
            method?: string | null;
            status: string;
            email?: string | null;
            contact?: string | null;
          };
        };
      };
    };

    const paymentEntity = parsed.payload?.payment?.entity;
    const payment: PaymentCapturedPayload | undefined = paymentEntity
      ? {
          paymentId: paymentEntity.id,
          orderId: paymentEntity.order_id ?? null,
          amountPaise: Number(paymentEntity.amount),
          currency: paymentEntity.currency,
          method: paymentEntity.method ?? null,
          status: paymentEntity.status,
          email: paymentEntity.email ?? null,
          contact: paymentEntity.contact ?? null,
        }
      : undefined;

    return {
      event: parsed.event,
      createdAt: parsed.created_at ?? Math.floor(Date.now() / 1000),
      payment,
      rawPayload: parsed as Record<string, unknown>,
    };
  }

  async fetchPayment(gatewayPaymentId: string): Promise<PaymentCapturedPayload | null> {
    const simulated = this.payments.get(gatewayPaymentId);
    if (simulated) return { ...simulated };
    // Pre-existing behaviour for payments this instance never saw (top-up reconcile tests).
    return {
      paymentId: gatewayPaymentId,
      orderId: `order_mock_${gatewayPaymentId}`,
      amountPaise: 100000,
      currency: 'INR',
      status: 'captured',
    };
  }

  async fetchOrderPayments(gatewayOrderId: string): Promise<PaymentCapturedPayload[]> {
    return [...this.payments.values()].filter((p) => p.orderId === gatewayOrderId).map((p) => ({ ...p }));
  }

  async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    return { refundId: `rfnd_mock_${params.gatewayPaymentId}`.slice(0, 120), status: 'processed' };
  }
}

export const mockPaymentGateway = new MockPaymentGateway();
