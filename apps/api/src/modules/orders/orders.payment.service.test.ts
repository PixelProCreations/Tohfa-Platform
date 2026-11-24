/**
 * BR-213..BR-216: gateway-paid orders (UPI / CARD / NETBANKING via Razorpay), the verify and
 * webhook confirmation path, the payment window, customer cancel, release and late capture.
 *
 * Unit tests over a STATEFUL in-memory OrdersRepo (orders, payments rows, allocations, stock
 * ledger, slot bookings, cart) and the mock gateway. Transactions are simulated: they run one at
 * a time (the row lock) and a throw restores the state snapshot taken at the start (rollback),
 * so "nothing written" is observable. The SQL itself is covered by orders.payment.repo.db.test.ts.
 */
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Executor } from '../../db/pool.js';

type TxRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
const hooks = vi.hoisted(() => ({
  runTx: null as null | (<T>(fn: (tx: unknown) => Promise<T>) => Promise<T>),
  audits: [] as { actionCode: string; entityId?: string | null; after?: unknown }[],
}));

vi.mock('../../db/pool.js', () => ({
  pool: {},
  withTransaction: <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => {
    if (!hooks.runTx) throw new Error('no world');
    return hooks.runTx(fn);
  },
}));
vi.mock('../../audit/auditLog.js', () => ({
  writeAuditLog: async (_tx: unknown, entry: { actionCode: string; entityId?: string | null; after?: unknown }) => {
    hooks.audits.push(entry);
    return 'audit-id';
  },
}));

import { RoleCode, type Money } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { AppError } from '../../http/problem.js';
import { MockPaymentGateway } from '../../payments/mock.gateway.js';
import { createWebhookDispatcher } from '../../payments/webhookDispatch.js';
import { aScope, newId } from '../../test/factories.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import type { WalletService } from '../wallet/wallet.service.js';
import type { DeliverySlotsService } from '../delivery-slots/delivery-slots.service.js';
import { describeSlot } from '../delivery-slots/delivery-slots.service.js';
import { createOrderPaymentService } from './orders.payment.service.js';
import { createOrdersService } from './orders.service.js';
import type {
  CartCheckoutItem,
  OrderItemRecord,
  OrderPaymentRecord,
  OrderRecord,
  OrdersRepo,
} from './orders.repo.js';
import type { CheckoutRequest } from './orders.schema.js';

// ---------------------------------------------------------------------------------------------
// The in-memory world
// ---------------------------------------------------------------------------------------------

interface State {
  orders: Map<string, OrderRecord>;
  items: Map<string, OrderItemRecord[]>;
  payments: Map<string, OrderPaymentRecord>;
  history: { orderId: string; from: string | null; to: string }[];
  ledger: { orderId: string; type: 'SALE' | 'RELEASE'; qty: number }[];
  consumed: number;
  reserved: number;
  slotBooked: number;
  cartStatus: string;
  walletBalance: number;
  walletDebits: number;
  orderSeq: number;
}

const CUSTOMER_ID = newId();
const OTHER_CUSTOMER_ID = newId();
const WAREHOUSE_ID = newId();

function makeWorld(opts: { stockFails?: boolean; walletBalance?: number } = {}) {
  let state: State = {
    orders: new Map(),
    items: new Map(),
    payments: new Map(),
    history: [],
    ledger: [],
    consumed: 0,
    reserved: 2,
    slotBooked: 0,
    cartStatus: 'LOCKED',
    walletBalance: opts.walletBalance ?? 0,
    walletDebits: 0,
    orderSeq: 0,
  };
  const cartId = newId();
  const cartItems: CartCheckoutItem[] = [
    { id: newId(), cartId, productId: newId(), name: 'Carrot', grade: 'GRADE_1', qtyKg: '2.000', unitPrice: '100.00', lineTotal: '200.00', allocationId: newId(), batchId: newId() },
  ];
  const events: string[] = [];
  const now = () => new Date();

  // One transaction at a time (the order row lock) and rollback on throw.
  let chain: Promise<unknown> = Promise.resolve();
  const runTx: TxRunner = <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => {
    const run = async (): Promise<T> => {
      const snapshot = structuredClone(state);
      try {
        return await fn({} as Executor);
      } catch (err) {
        state = snapshot;
        throw err;
      }
    };
    const result = chain.then(run, run);
    chain = result.catch(() => undefined);
    return result;
  };
  hooks.runTx = runTx;

  const copy = (o: OrderRecord): OrderRecord => ({ ...o });
  const paymentOf = (orderId: string): OrderPaymentRecord | null =>
    [...state.payments.values()].filter((p) => p.refId === orderId).at(-1) ?? null;

  const repo: OrdersRepo = {
    async getDeliveryConfig() {
      return { deliveryFee: '40.00' as Money, freeDeliveryThreshold: '500.00' as Money, homeDeliveryEnabled: true, handlingFee: '0.00' as Money };
    },
    async getRetailGstRateRaw() { return '0'; },
    async isOwnLiveAddress() { return true; },
    async getCustomerWalletBalance() { return state.walletBalance.toFixed(2); },
    async findCartForCheckout(_db, customerId) {
      if (customerId !== CUSTOMER_ID || state.cartStatus === 'CONVERTED') return null;
      return { id: cartId, customerId, warehouseId: WAREHOUSE_ID, status: state.cartStatus, lockedAt: new Date(), lockedUntil: new Date(Date.now() + 3_600_000), items: cartItems };
    },
    async generateOrderNumber() { state.orderSeq += 1; return `TOH-2026-${String(state.orderSeq).padStart(6, '0')}`; },
    async findOrderByCartId() { return null; },
    async findOrderByCartOrIdempotencyKey() { return null; },
    async findOrderById(_db, orderId, customerId) {
      const o = state.orders.get(orderId);
      if (!o || o.customerId !== customerId) return null;
      const { cancellationReason: _c, cancelledAt: _a, ...rest } = o;
      return { order: { ...rest }, items: state.items.get(orderId) ?? [] };
    },
    async listOrders() { return { orders: [], nextCursor: null, hasMore: false }; },
    async checkAndBookDeliverySlot() { state.slotBooked += 1; },
    async createOrder(_db, p) {
      const id = newId();
      const status = p.status ?? 'CONFIRMED';
      const order: OrderRecord = {
        id, orderNumber: p.orderNumber, customerId: p.customerId, warehouseId: p.warehouseId, cartId: p.cartId,
        channel: 'ONLINE', fulfillmentType: p.fulfillmentType, deliveryAddressId: p.deliveryAddressId ?? null,
        deliverySlot: p.deliverySlot ?? null, deliveryDate: p.deliveryDate ?? null, subtotal: p.subtotal,
        deliveryFee: p.deliveryFee, handlingFee: p.handlingFee, discount: p.discount, gstAmount: p.gstAmount,
        totalAmount: p.totalAmount, paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus ?? (status === 'PENDING_PAYMENT' ? 'PENDING' : 'PAID'), status,
        deliveryOtpHash: 'h', itemCount: p.items.length, placedAt: new Date(), createdAt: new Date(), updatedAt: null,
        idempotencyKey: p.idempotencyKey ?? null, paymentExpiresAt: p.paymentExpiresAt ?? null,
        cancelledAt: null, cancellationReason: null,
      };
      if ([...state.orders.values()].some((o) => o.customerId === p.customerId && o.idempotencyKey && o.idempotencyKey === p.idempotencyKey)) {
        throw Object.assign(new Error('duplicate key'), { code: '23505' });
      }
      state.orders.set(id, order);
      state.items.set(id, p.items.map((it) => ({ id: newId(), orderId: id, productId: it.productId, name: it.name, grade: it.grade, qtyKg: it.qtyKg, unitPrice: it.unitPrice, lineTotal: it.lineTotal })));
      state.history.push({ orderId: id, from: null, to: status });
      state.cartStatus = 'CONVERTED';
      return { order: copy(order), items: state.items.get(id)! };
    },
    async convertAllocationsAndAppendStockLedger(_db, items, orderId) {
      if (opts.stockFails) throw new AppError('STOCK_UNAVAILABLE', { detail: 'gone' });
      for (const it of items) {
        state.reserved -= Number(it.qtyKg);
        state.consumed += Number(it.qtyKg);
        state.ledger.push({ orderId, type: 'SALE', qty: -Number(it.qtyKg) });
      }
    },
    async findOrderByIdempotencyKey(_db, customerId, key) {
      const o = [...state.orders.values()].find((x) => x.customerId === customerId && x.idempotencyKey === key);
      if (!o) return null;
      return { order: copy(o), items: state.items.get(o.id) ?? [], payment: paymentOf(o.id) };
    },
    async lockOrderForPayment(_db, orderId) {
      const o = state.orders.get(orderId);
      return o ? copy(o) : null;
    },
    async getOrderByGatewayOrderId(_db, gatewayOrderId) {
      const p = [...state.payments.values()].find((x) => x.refType === 'ORDER' && x.gatewayOrderId === gatewayOrderId);
      const o = p?.refId ? state.orders.get(p.refId) : undefined;
      return p && o ? { order: copy(o), payment: { ...p } } : null;
    },
    async getPaymentByGatewayOrderId(_db, gatewayOrderId) {
      const p = [...state.payments.values()].find((x) => x.gatewayOrderId === gatewayOrderId);
      return p ? { ...p } : null;
    },
    async getOrderPayment(_db, orderId) {
      const p = paymentOf(orderId);
      return p ? { ...p } : null;
    },
    async insertOrderPayment(_db, p) {
      const row: OrderPaymentRecord = {
        id: newId(), gateway: 'razorpay', gatewayOrderId: p.gatewayOrderId, gatewayPaymentId: null, amount: p.amount,
        currency: 'INR', method: p.method, status: 'CREATED', refType: 'ORDER', refId: p.orderId, capturedAt: null,
        createdAt: new Date(), updatedAt: null,
      };
      state.payments.set(row.id, row);
      return { ...row };
    },
    async markOrderPaymentCaptured(_db, p) {
      const row = state.payments.get(p.paymentId);
      if (!row || !['CREATED', 'AUTHORIZED', 'FAILED'].includes(row.status)) return null;
      if ([...state.payments.values()].some((x) => x.id !== row.id && x.gatewayPaymentId === p.gatewayPaymentId)) {
        throw Object.assign(new Error('duplicate gateway_payment_id'), { code: '23505' });
      }
      row.status = 'CAPTURED';
      row.gatewayPaymentId = p.gatewayPaymentId;
      row.capturedAt = new Date();
      return { ...row };
    },
    async markOrderPaymentFailed(_db, p) {
      const row = state.payments.get(p.paymentId);
      if (!row || !['CREATED', 'AUTHORIZED', 'FAILED'].includes(row.status)) return null;
      row.status = 'FAILED';
      return { ...row };
    },
    async confirmPendingOrder(_db, p) {
      const o = state.orders.get(p.orderId);
      if (!o || o.status !== 'PENDING_PAYMENT') return null;
      o.status = 'CONFIRMED';
      o.paymentStatus = 'PAID';
      state.history.push({ orderId: o.id, from: 'PENDING_PAYMENT', to: 'CONFIRMED' });
      return copy(o);
    },
    async cancelPendingOrder(_db, p) {
      const o = state.orders.get(p.orderId);
      if (!o || o.status !== 'PENDING_PAYMENT') return null;
      o.status = 'CANCELLED';
      o.paymentStatus = 'FAILED';
      o.cancelledAt = new Date();
      o.cancellationReason = p.reason;
      state.history.push({ orderId: o.id, from: 'PENDING_PAYMENT', to: 'CANCELLED' });
      return copy(o);
    },
    async markOrderRefundDue(_db, orderId) {
      const o = state.orders.get(orderId);
      if (!o || o.status !== 'CANCELLED') return null;
      o.paymentStatus = 'REFUND_DUE';
      return copy(o);
    },
    async releaseOrderStock(_db, order) {
      if (state.ledger.some((l) => l.orderId === order.id && l.type === 'RELEASE')) return { released: false, ledgerRows: 0, allocations: 0 };
      const sales = state.ledger.filter((l) => l.orderId === order.id && l.type === 'SALE');
      for (const s of sales) {
        state.ledger.push({ orderId: order.id, type: 'RELEASE', qty: -s.qty });
        state.consumed += s.qty;
      }
      return { released: true, ledgerRows: sales.length, allocations: sales.length };
    },
    async releaseDeliverySlot(_db, order) {
      if (!order.deliveryDate || !order.deliverySlot || state.slotBooked === 0) return false;
      state.slotBooked -= 1;
      return true;
    },
    async listExpiredPendingPaymentOrders() {
      return [...state.orders.values()]
        .filter((o) => o.status === 'PENDING_PAYMENT' && o.paymentExpiresAt && o.paymentExpiresAt <= now())
        .map((o) => ({ orderId: o.id, customerId: o.customerId, paymentExpiresAt: o.paymentExpiresAt!, gatewayOrderId: paymentOf(o.id)?.gatewayOrderId ?? null }));
    },
    async getOrderPaymentWindowMinutes() { return 15; },
  };

  const walletSvc = {
    async getWalletForActor() { return { id: 'wallet-1', balance: state.walletBalance.toFixed(2) } as never; },
    async move(_scope: unknown, p: { amount: string }) {
      state.walletBalance -= Number(p.amount);
      state.walletDebits += 1;
      return {} as never;
    },
  } as unknown as WalletService;

  const slotsSvc: DeliverySlotsService = {
    async listSlots() { throw new Error('unused'); },
    async describeOne(_db, _wh, date, slot) { return describeSlot(date, slot, null, 120, new Date('2000-01-01T00:00:00Z')); },
  };

  const gateway = new MockPaymentGateway('test_key_secret');
  const createOrderSpy = vi.spyOn(gateway, 'createOrder');
  const publisher = { publish: async (name: string, id: string) => { events.push(`${name}:${id}`); } };
  const idempotency = createInMemoryIdempotencyStore();

  const orders = createOrdersService({ repo, walletSvc, slotsSvc, events: publisher, gateway, db: {} as never });
  const payments = createOrderPaymentService({ repo, gateway, db: {} as never, runTx, events: publisher, idempotency });

  const topupCalls: string[] = [];
  const webhookSecret = 'test_webhook_secret';
  const webhook = createWebhookDispatcher({
    gateway,
    repo,
    db: {} as never,
    webhookSecret,
    orderPayments: payments,
    topups: { async processRazorpayWebhook(_raw, _sig, eventId) { topupCalls.push(eventId ?? ''); return { received: true, duplicate: false }; } },
  });

  function webhookBody(event: string, entity: { id: string; order_id: string; amount: number; status: string }) {
    const raw = JSON.stringify({ event, created_at: 1_700_000_000, payload: { payment: { entity: { ...entity, currency: 'INR', method: 'upi' } } } });
    return { raw, signature: createHmac('sha256', webhookSecret).update(raw).digest('hex') };
  }

  return {
    get state() { return state; },
    repo, gateway, createOrderSpy, events, orders, payments, webhook, webhookBody, topupCalls, idempotency,
  };
}

const customer: Actor = { userId: newId(), roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId: CUSTOMER_ID };
const otherCustomer: Actor = { userId: newId(), roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId: OTHER_CUSTOMER_ID };
const scope = aScope({ roleCode: RoleCode.CUSTOMER, permission: 'order.place' });

const pickup = (paymentMethod: CheckoutRequest['paymentMethod']): CheckoutRequest => ({
  fulfillmentType: 'PICKUP', warehouseId: WAREHOUSE_ID, paymentMethod,
});
const delivery = (paymentMethod: CheckoutRequest['paymentMethod']): CheckoutRequest => ({
  fulfillmentType: 'HOME_DELIVERY', warehouseId: WAREHOUSE_ID, deliveryAddressId: newId(),
  deliveryDate: '2999-01-01', deliverySlot: 'MORNING_8_12', paymentMethod,
});

async function placePending(w: ReturnType<typeof makeWorld>, input = pickup('UPI')) {
  const order = await w.orders.checkout(customer, scope, input, newId());
  expect(order.status).toBe('PENDING_PAYMENT');
  return order;
}

function audits(code: string) {
  return hooks.audits.filter((a) => a.actionCode === code);
}

beforeEach(() => {
  hooks.audits.length = 0;
});

// ---------------------------------------------------------------------------------------------
// BR-213
// ---------------------------------------------------------------------------------------------
describe('BR-213: gateway-paid order creation', () => {
  it('BR-213a: UPI/CARD/NETBANKING checkout returns 201 PENDING_PAYMENT / PENDING with the payment block, amount equal to the server total', async () => {
    for (const method of ['UPI', 'CARD', 'NETBANKING'] as const) {
      const w = makeWorld();
      const before = Date.now();
      const order = await w.orders.checkout(customer, scope, pickup(method), newId());
      expect(order).toMatchObject({ status: 'PENDING_PAYMENT', paymentStatus: 'PENDING', paymentMethod: method, totalAmount: '200.00' });
      expect(order.payment).toMatchObject({
        gateway: 'RAZORPAY',
        gatewayOrderId: expect.stringMatching(/^order_mock_/),
        razorpayKeyId: 'rzp_test_mock_publishable_key',
        amount: '200.00',
        currency: 'INR',
      });
      const expiresIn = new Date(order.payment!.expiresAt).getTime() - before;
      expect(expiresIn).toBeGreaterThanOrEqual(15 * 60_000 - 1_000);
      expect(expiresIn).toBeLessThanOrEqual(15 * 60_000 + 5_000);
      // The gateway order is for the server total in paise, with no client amount anywhere.
      expect(w.createOrderSpy).toHaveBeenCalledTimes(1);
      expect(w.createOrderSpy.mock.calls[0]![0]).toMatchObject({ amountPaise: 20000, currency: 'INR' });
      expect(w.state.payments.size).toBe(1);
      expect([...w.state.payments.values()][0]).toMatchObject({ status: 'CREATED', refType: 'ORDER', amount: '200.00', method });
      // Not confirmed: no order.confirmed event for a pending order (BR-213 6).
      expect(w.events).toEqual([]);
    }
  });

  it('BR-213b: stock, slot and cart are taken on creation; no wallet debit or balance check', async () => {
    const w = makeWorld({ walletBalance: 0 });
    const order = await w.orders.checkout(customer, scope, delivery('CARD'), newId());
    expect(order).toMatchObject({ status: 'PENDING_PAYMENT', totalAmount: '240.00' });
    expect(w.state.consumed).toBe(2);
    expect(w.state.ledger).toEqual([{ orderId: order.id, type: 'SALE', qty: -2 }]);
    expect(w.state.slotBooked).toBe(1);
    expect(w.state.cartStatus).toBe('CONVERTED');
    expect(w.state.walletDebits).toBe(0);
  });

  it('BR-213b: a stock conflict fails before any Razorpay order is created', async () => {
    const w = makeWorld({ stockFails: true });
    await expect(w.orders.checkout(customer, scope, pickup('UPI'), newId())).rejects.toMatchObject({ code: 'STOCK_UNAVAILABLE' });
    expect(w.createOrderSpy).not.toHaveBeenCalled();
    expect(w.state.orders.size).toBe(0);
    expect(w.state.payments.size).toBe(0);
  });

  it('BR-213c: the same key replays the same order and gatewayOrderId; one Razorpay order', async () => {
    const w = makeWorld();
    const key = newId();
    const first = await w.orders.checkout(customer, scope, pickup('UPI'), key);
    const replay = await w.orders.checkout(customer, scope, pickup('UPI'), key);
    expect(replay.id).toBe(first.id);
    expect(replay.payment?.gatewayOrderId).toBe(first.payment?.gatewayOrderId);
    expect(replay.payment?.expiresAt).toBe(first.payment?.expiresAt);
    expect(w.createOrderSpy).toHaveBeenCalledTimes(1);
    expect(w.state.orders.size).toBe(1);
    expect(w.state.payments.size).toBe(1);
  });

  it('BR-213d: WALLET is unchanged (CONFIRMED / PAID, debit, event) and the balance check is WALLET-only', async () => {
    const rich = makeWorld({ walletBalance: 1000 });
    const order = await rich.orders.checkout(customer, scope, pickup('WALLET'), newId());
    expect(order).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'PAID', payment: null });
    expect(rich.state.walletDebits).toBe(1);
    expect(rich.state.walletBalance).toBe(800);
    expect(rich.createOrderSpy).not.toHaveBeenCalled();
    expect(rich.events).toEqual([`order.confirmed:${order.id}`]);

    const poor = makeWorld({ walletBalance: 10 });
    await expect(poor.orders.checkout(customer, scope, pickup('WALLET'), newId())).rejects.toMatchObject({ code: 'WALLET_INSUFFICIENT', status: 402 });
    // The same empty wallet does not block a UPI order.
    await expect(poor.orders.checkout(customer, scope, pickup('UPI'), newId())).resolves.toMatchObject({ status: 'PENDING_PAYMENT' });

    // The quote accepts every method except CASH; walletSufficient only matters for WALLET.
    const quoting = makeWorld({ walletBalance: 10 });
    const quote = await quoting.orders.quote(customer, scope, pickup('NETBANKING'));
    expect(quote).toMatchObject({ totalAmount: '200.00', walletSufficient: false });
  });

  it('BR-213e: a gateway failure is 503 PAYMENT_GATEWAY_UNAVAILABLE and nothing is written', async () => {
    const w = makeWorld();
    w.createOrderSpy.mockRejectedValueOnce(new Error('ECONNRESET'));
    await expect(w.orders.checkout(customer, scope, delivery('UPI'), newId())).rejects.toMatchObject({
      code: 'PAYMENT_GATEWAY_UNAVAILABLE',
      status: 503,
    });
    expect(w.state.orders.size).toBe(0);
    expect(w.state.payments.size).toBe(0);
    expect(w.state.consumed).toBe(0);
    expect(w.state.ledger).toEqual([]);
    expect(w.state.slotBooked).toBe(0);
    expect(w.state.cartStatus).toBe('LOCKED');
    expect(audits('order.place')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// BR-214
// ---------------------------------------------------------------------------------------------
describe('BR-214: payment verification and the one confirmation path', () => {
  it('BR-214a: a bad signature is 422 PAYMENT_SIGNATURE_INVALID and nothing changes', async () => {
    const w = makeWorld();
    const order = await placePending(w);
    const paid = w.gateway.simulatePayment(order.payment!.gatewayOrderId);
    await expect(
      w.payments.verifyOrderPayment(customer, scope, order.id, {
        razorpayOrderId: order.payment!.gatewayOrderId, razorpayPaymentId: paid.paymentId, razorpaySignature: 'f'.repeat(64),
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_SIGNATURE_INVALID', status: 422 });
    // A valid signature for ANOTHER gateway order is refused too.
    await expect(
      w.payments.verifyOrderPayment(customer, scope, order.id, {
        razorpayOrderId: 'order_other', razorpayPaymentId: paid.paymentId, razorpaySignature: w.gateway.signPayment('order_other', paid.paymentId),
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_SIGNATURE_INVALID', status: 422 });
    expect(w.state.orders.get(order.id)).toMatchObject({ status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' });
    expect(w.events).toEqual([]);
  });

  it('BR-214b: an amount or order mismatch is 409 PAYMENT_AMOUNT_MISMATCH', async () => {
    const w = makeWorld();
    const order = await placePending(w);
    const gwId = order.payment!.gatewayOrderId;
    const short = w.gateway.simulatePayment(gwId, { amountPaise: 100 });
    await expect(
      w.payments.verifyOrderPayment(customer, scope, order.id, { razorpayOrderId: gwId, razorpayPaymentId: short.paymentId, razorpaySignature: short.signature }),
    ).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_MISMATCH', status: 409 });

    // The fetched payment belongs to another gateway order although the signature names ours.
    const elsewhere = w.gateway.simulatePayment('order_somewhere_else', { amountPaise: 20000 });
    await expect(
      w.payments.verifyOrderPayment(customer, scope, order.id, {
        razorpayOrderId: gwId, razorpayPaymentId: elsewhere.paymentId, razorpaySignature: w.gateway.signPayment(gwId, elsewhere.paymentId),
      }),
    ).rejects.toMatchObject({ code: 'PAYMENT_AMOUNT_MISMATCH', status: 409 });
    expect(w.state.orders.get(order.id)?.status).toBe('PENDING_PAYMENT');
  });

  it('BR-214c: an authorized-only payment is 202 PAYMENT_PENDING', async () => {
    const w = makeWorld();
    const order = await placePending(w);
    const gwId = order.payment!.gatewayOrderId;
    const auth = w.gateway.simulatePayment(gwId, { status: 'authorized' });
    const err = await w.payments
      .verifyOrderPayment(customer, scope, order.id, { razorpayOrderId: gwId, razorpayPaymentId: auth.paymentId, razorpaySignature: auth.signature })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect(err).toMatchObject({ code: 'PAYMENT_PENDING', status: 202 });
    expect(w.state.orders.get(order.id)?.status).toBe('PENDING_PAYMENT');
  });

  it('BR-214d: a valid capture confirms once, with one audit row and one event after commit', async () => {
    const w = makeWorld();
    const order = await placePending(w);
    const gwId = order.payment!.gatewayOrderId;
    const paid = w.gateway.simulatePayment(gwId);
    const body = { razorpayOrderId: gwId, razorpayPaymentId: paid.paymentId, razorpaySignature: paid.signature };

    const confirmed = await w.payments.verifyOrderPayment(customer, scope, order.id, body);
    expect(confirmed).toMatchObject({ id: order.id, status: 'CONFIRMED', paymentStatus: 'PAID' });
    expect([...w.state.payments.values()][0]).toMatchObject({ status: 'CAPTURED', gatewayPaymentId: paid.paymentId });
    expect(w.state.history.filter((h) => h.to === 'CONFIRMED')).toHaveLength(1);

    // Repeat: 200 with the same order, nothing written, no second event.
    const again = await w.payments.verifyOrderPayment(customer, scope, order.id, body);
    expect(again.status).toBe('CONFIRMED');
    expect(audits('order.payment.confirm')).toHaveLength(1);
    expect(w.events).toEqual([`order.confirmed:${order.id}`]);
  });

  it('BR-214e: verify then webhook (and webhook then verify, and both at once) for the same payment confirms once', async () => {
    // verify -> webhook
    const a = makeWorld();
    const o1 = await placePending(a);
    const p1 = a.gateway.simulatePayment(o1.payment!.gatewayOrderId);
    await a.payments.verifyOrderPayment(customer, scope, o1.id, { razorpayOrderId: o1.payment!.gatewayOrderId, razorpayPaymentId: p1.paymentId, razorpaySignature: p1.signature });
    const hook1 = a.webhookBody('payment.captured', { id: p1.paymentId, order_id: o1.payment!.gatewayOrderId, amount: 20000, status: 'captured' });
    await expect(a.webhook.dispatch(hook1.raw, hook1.signature, 'evt_1')).resolves.toEqual({ received: true, duplicate: true });
    expect(a.events).toHaveLength(1);

    // webhook -> verify
    hooks.audits.length = 0;
    const b = makeWorld();
    const o2 = await placePending(b);
    const p2 = b.gateway.simulatePayment(o2.payment!.gatewayOrderId);
    const hook2 = b.webhookBody('payment.captured', { id: p2.paymentId, order_id: o2.payment!.gatewayOrderId, amount: 20000, status: 'captured' });
    await expect(b.webhook.dispatch(hook2.raw, hook2.signature, 'evt_2')).resolves.toEqual({ received: true, duplicate: false });
    await expect(
      b.payments.verifyOrderPayment(customer, scope, o2.id, { razorpayOrderId: o2.payment!.gatewayOrderId, razorpayPaymentId: p2.paymentId, razorpaySignature: p2.signature }),
    ).resolves.toMatchObject({ status: 'CONFIRMED' });
    expect(b.events).toHaveLength(1);
    expect(audits('order.payment.confirm')).toHaveLength(1);

    // racing: the row lock serialises them
    hooks.audits.length = 0;
    const c = makeWorld();
    const o3 = await placePending(c);
    const p3 = c.gateway.simulatePayment(o3.payment!.gatewayOrderId);
    const hook3 = c.webhookBody('payment.captured', { id: p3.paymentId, order_id: o3.payment!.gatewayOrderId, amount: 20000, status: 'captured' });
    await Promise.all([
      c.payments.verifyOrderPayment(customer, scope, o3.id, { razorpayOrderId: o3.payment!.gatewayOrderId, razorpayPaymentId: p3.paymentId, razorpaySignature: p3.signature }),
      c.webhook.dispatch(hook3.raw, hook3.signature, 'evt_3'),
    ]);
    expect(c.events).toHaveLength(1);
    expect(audits('order.payment.confirm')).toHaveLength(1);
  });

  it('BR-214f: the webhook routes ORDER payments to the order path and TOPUP payments to the top-up handler', async () => {
    const w = makeWorld();
    const order = await placePending(w);
    const gwId = order.payment!.gatewayOrderId;

    // A failed attempt is recorded; the order stays pending (BR-214 4).
    const failed = w.webhookBody('payment.failed', { id: 'pay_failed_1', order_id: gwId, amount: 20000, status: 'failed' });
    await expect(w.webhook.dispatch(failed.raw, failed.signature, 'evt_f')).resolves.toEqual({ received: true });
    expect([...w.state.payments.values()][0]?.status).toBe('FAILED');
    expect(w.state.orders.get(order.id)?.status).toBe('PENDING_PAYMENT');

    const captured = w.webhookBody('payment.captured', { id: 'pay_ok_1', order_id: gwId, amount: 20000, status: 'captured' });
    await w.webhook.dispatch(captured.raw, captured.signature, 'evt_c');
    expect(w.state.orders.get(order.id)).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'PAID' });
    expect(w.topupCalls).toEqual([]);

    // No ORDER payments row for this gateway order: the existing top-up handler gets it.
    const topup = w.webhookBody('payment.captured', { id: 'pay_topup_1', order_id: 'order_topup_xyz', amount: 50000, status: 'captured' });
    await expect(w.webhook.dispatch(topup.raw, topup.signature, 'evt_t')).resolves.toEqual({ received: true, duplicate: false });
    expect(w.topupCalls).toEqual(['evt_t']);

    // A forged signature is 401 before any routing.
    await expect(w.webhook.dispatch(captured.raw, 'f'.repeat(64), 'evt_x')).rejects.toMatchObject({ status: 401 });
  });

  it("BR-214g: another customer's order is 404 on verify and cancel", async () => {
    const w = makeWorld();
    const order = await placePending(w);
    const paid = w.gateway.simulatePayment(order.payment!.gatewayOrderId);
    await expect(
      w.payments.verifyOrderPayment(otherCustomer, scope, order.id, { razorpayOrderId: order.payment!.gatewayOrderId, razorpayPaymentId: paid.paymentId, razorpaySignature: paid.signature }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await expect(w.payments.cancelPendingOrder(otherCustomer, scope, order.id, newId())).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await expect(w.payments.verifyOrderPayment({ ...customer, customerId: null }, scope, order.id, {
      razorpayOrderId: 'x', razorpayPaymentId: 'y', razorpaySignature: 'z',
    })).rejects.toMatchObject({ status: 404 });
    expect(w.state.orders.get(order.id)?.status).toBe('PENDING_PAYMENT');
  });
});

// ---------------------------------------------------------------------------------------------
// BR-215
// ---------------------------------------------------------------------------------------------
describe('BR-215: payment window, cancel, release and late capture', () => {
  function expire(w: ReturnType<typeof makeWorld>, orderId: string) {
    w.state.orders.get(orderId)!.paymentExpiresAt = new Date(Date.now() - 1_000);
  }

  it('BR-215a: the sweep cancels an expired unpaid order and releases allocation, ledger and slot in one transaction', async () => {
    const w = makeWorld();
    const order = await placePending(w, delivery('UPI'));
    // Not yet expired: untouched.
    await expect(w.payments.sweepExpiredPendingOrders()).resolves.toMatchObject({ scanned: 0 });
    expire(w, order.id);
    await expect(w.payments.sweepExpiredPendingOrders()).resolves.toMatchObject({ scanned: 1, cancelled: 1, confirmed: 0 });
    expect(w.state.orders.get(order.id)).toMatchObject({ status: 'CANCELLED', paymentStatus: 'FAILED', cancellationReason: 'PAYMENT_NOT_COMPLETED' });
    expect(w.state.consumed).toBe(0);
    expect(w.state.ledger).toEqual([
      { orderId: order.id, type: 'SALE', qty: -2 },
      { orderId: order.id, type: 'RELEASE', qty: 2 },
    ]);
    expect(w.state.slotBooked).toBe(0);
    expect(audits('order.payment.cancel')).toHaveLength(1);
    // Idempotent: a second run finds nothing to do.
    await expect(w.payments.sweepExpiredPendingOrders()).resolves.toMatchObject({ scanned: 0 });
    expect(w.events).toEqual([]);
  });

  it('BR-215a: the sweep leaves an order pending when the gateway cannot be reached', async () => {
    const w = makeWorld();
    const order = await placePending(w);
    expire(w, order.id);
    vi.spyOn(w.gateway, 'fetchOrderPayments').mockRejectedValueOnce(new Error('timeout'));
    await expect(w.payments.sweepExpiredPendingOrders()).resolves.toMatchObject({ failed: 1, cancelled: 0 });
    expect(w.state.orders.get(order.id)?.status).toBe('PENDING_PAYMENT');
  });

  it('BR-215b: the sweep confirms an expired order whose payment was captured', async () => {
    const w = makeWorld();
    const order = await placePending(w);
    w.gateway.simulatePayment(order.payment!.gatewayOrderId);
    expire(w, order.id);
    await expect(w.payments.sweepExpiredPendingOrders()).resolves.toMatchObject({ confirmed: 1, cancelled: 0 });
    expect(w.state.orders.get(order.id)).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'PAID' });
    expect(w.state.ledger.filter((l) => l.type === 'RELEASE')).toEqual([]);
    expect(w.events).toEqual([`order.confirmed:${order.id}`]);
  });

  it('BR-215c: customer cancel releases stock and slot and sets CUSTOMER_CANCELLED; a replay returns the same result', async () => {
    const w = makeWorld();
    const order = await placePending(w, delivery('NETBANKING'));
    const key = newId();
    const cancelled = await w.payments.cancelPendingOrder(customer, scope, order.id, key);
    expect(cancelled).toMatchObject({ id: order.id, status: 'CANCELLED', paymentStatus: 'FAILED', cancellationReason: 'CUSTOMER_CANCELLED' });
    expect(w.state.consumed).toBe(0);
    expect(w.state.slotBooked).toBe(0);
    expect(w.state.ledger.filter((l) => l.type === 'RELEASE')).toHaveLength(1);

    const replay = await w.payments.cancelPendingOrder(customer, scope, order.id, key);
    expect(replay).toMatchObject({ id: order.id, status: 'CANCELLED' });
    expect(w.state.ledger.filter((l) => l.type === 'RELEASE')).toHaveLength(1);
    expect(audits('order.payment.cancel')).toHaveLength(1);
    // The key is required.
    await expect(w.payments.cancelPendingOrder(customer, scope, order.id, undefined)).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
  });

  it('BR-215d: cancelling an order that is not pending is 409 ORDER_NOT_AWAITING_PAYMENT', async () => {
    const w = makeWorld({ walletBalance: 1000 });
    const walletOrder = await w.orders.checkout(customer, scope, pickup('WALLET'), newId());
    await expect(w.payments.cancelPendingOrder(customer, scope, walletOrder.id, newId())).rejects.toMatchObject({
      code: 'ORDER_NOT_AWAITING_PAYMENT',
      status: 409,
    });
    expect(w.state.orders.get(walletOrder.id)?.status).toBe('CONFIRMED');
    expect(w.state.ledger.filter((l) => l.type === 'RELEASE')).toEqual([]);
  });

  it('BR-215e: cancel finds a capture at the gateway and confirms instead', async () => {
    const w = makeWorld();
    const order = await placePending(w);
    w.gateway.simulatePayment(order.payment!.gatewayOrderId);
    const result = await w.payments.cancelPendingOrder(customer, scope, order.id, newId());
    expect(result).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'PAID' });
    expect(w.state.ledger.filter((l) => l.type === 'RELEASE')).toEqual([]);
    expect(w.events).toEqual([`order.confirmed:${order.id}`]);
  });

  it('BR-215f: a late capture keeps the order CANCELLED, sets REFUND_DUE, and verify is 409 ORDER_PAYMENT_EXPIRED (no refund call)', async () => {
    const w = makeWorld();
    const refundSpy = vi.spyOn(w.gateway, 'refundPayment');
    const order = await placePending(w);
    const gwId = order.payment!.gatewayOrderId;
    await w.payments.cancelPendingOrder(customer, scope, order.id, newId());

    const late = w.gateway.simulatePayment(gwId);
    const body = { razorpayOrderId: gwId, razorpayPaymentId: late.paymentId, razorpaySignature: late.signature };
    await expect(w.payments.verifyOrderPayment(customer, scope, order.id, body)).rejects.toMatchObject({ code: 'ORDER_PAYMENT_EXPIRED', status: 409 });
    expect(w.state.orders.get(order.id)).toMatchObject({ status: 'CANCELLED', paymentStatus: 'REFUND_DUE' });
    expect([...w.state.payments.values()][0]).toMatchObject({ status: 'CAPTURED', gatewayPaymentId: late.paymentId });
    // Repeating verify, or the webhook for the same capture, changes nothing more.
    await expect(w.payments.verifyOrderPayment(customer, scope, order.id, body)).rejects.toMatchObject({ code: 'ORDER_PAYMENT_EXPIRED' });
    const hook = w.webhookBody('payment.captured', { id: late.paymentId, order_id: gwId, amount: 20000, status: 'captured' });
    await expect(w.webhook.dispatch(hook.raw, hook.signature, 'evt_late')).resolves.toEqual({ received: true });
    expect(audits('order.payment.refund_due')).toHaveLength(1);
    expect(refundSpy).not.toHaveBeenCalled();
    expect(w.events).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// BR-216
// ---------------------------------------------------------------------------------------------
describe('BR-216: cash stays disabled', () => {
  it('BR-216a: CASH checkout is 422 PAYMENT_METHOD_DISABLED, no order, no stock or slot taken (quote refuses it too)', async () => {
    const w = makeWorld({ walletBalance: 1000 });
    await expect(w.orders.checkout(customer, scope, delivery('CASH'), newId())).rejects.toMatchObject({
      code: 'PAYMENT_METHOD_DISABLED',
      status: 422,
    });
    expect(w.state.orders.size).toBe(0);
    expect(w.state.consumed).toBe(0);
    expect(w.state.slotBooked).toBe(0);
    expect(w.state.cartStatus).toBe('LOCKED');
    expect(w.state.walletDebits).toBe(0);
    await expect(w.orders.quote(customer, scope, pickup('CASH'))).rejects.toMatchObject({ code: 'PAYMENT_METHOD_DISABLED', status: 422 });
  });
});
