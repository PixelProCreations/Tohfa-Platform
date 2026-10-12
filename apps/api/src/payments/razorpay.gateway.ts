import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config.js';
import type {
  CreateOrderParams,
  GatewayOrderResult,
  PaymentCapturedPayload,
  PaymentGateway,
  RefundPaymentParams,
  RefundResult,
  WebhookEvent,
} from './gateway.js';

export class RazorpayPaymentGateway implements PaymentGateway {
  readonly provider = 'razorpay' as const;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(keyId = config.RAZORPAY_KEY_ID, keySecret = config.RAZORPAY_KEY_SECRET) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  async createOrder(params: CreateOrderParams): Promise<GatewayOrderResult> {
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay API keys are not configured');
    }

    const authHeader = `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amountPaise,
        currency: params.currency ?? 'INR',
        receipt: params.receipt,
        notes: params.notes ?? {},
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Razorpay createOrder failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
      status: string;
    };

    return {
      gatewayOrderId: data.id,
      amountPaise: data.amount,
      currency: data.currency,
      status: data.status,
    };
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
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay API keys are not configured');
    }

    const authHeader = `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
    const response = await fetch(`https://api.razorpay.com/v1/payments/${gatewayPaymentId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Razorpay fetchPayment failed (${response.status}): ${errorBody}`);
    }

    const paymentEntity = (await response.json()) as {
      id: string;
      order_id?: string | null;
      amount: number;
      currency: string;
      method?: string | null;
      status: string;
      email?: string | null;
      contact?: string | null;
    };

    return {
      paymentId: paymentEntity.id,
      orderId: paymentEntity.order_id ?? null,
      amountPaise: Number(paymentEntity.amount),
      currency: paymentEntity.currency,
      method: paymentEntity.method ?? null,
      status: paymentEntity.status,
      email: paymentEntity.email ?? null,
      contact: paymentEntity.contact ?? null,
    };
  }

  /**
   * POST /v1/payments/{id}/refund. NOT exercised against the live Razorpay API in this repository's
   * tests (the mock gateway and injected refunders are); verify in the Razorpay test mode before
   * setting system_config sales.upi_refund_mode = 'auto' in production.
   */
  async refundPayment(params: RefundPaymentParams): Promise<RefundResult> {
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay API keys are not configured');
    }
    const authHeader = `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')}`;
    const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(params.gatewayPaymentId)}/refund`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: params.amountPaise, receipt: params.idempotencyKey.slice(0, 40), notes: params.notes ?? {} }),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Razorpay refundPayment failed (${response.status}): ${errorBody}`);
    }
    const data = (await response.json()) as { id: string; status: string };
    return { refundId: data.id, status: data.status };
  }
}

export const razorpayPaymentGateway = new RazorpayPaymentGateway();
