/**
 * BR-200: POST /orders/quote prices the cart through the SAME path as checkout, so the quoted
 * total equals the order total, and a quote writes nothing (no stock, cart, slot or wallet change).
 * BR-201: a full / switched-off slot is 409 SLOT_FULL at quote and at checkout.
 *
 * Pure unit test: the transaction helper and the audit writer are stubbed, every repo method is
 * a fake that records whether it was called.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db/pool.js', () => ({
  pool: {},
  withTransaction: async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn({}),
}));
vi.mock('../../audit/auditLog.js', () => ({ writeAuditLog: async () => undefined }));

import type { Money } from '@tohfa/shared-types';
import { newId, aScope } from '../../test/factories.js';
import type { Actor } from '../../auth/requireAuth.js';
import type { WalletService } from '../wallet/wallet.service.js';
import type { DeliverySlotsService } from '../delivery-slots/delivery-slots.service.js';
import { describeSlot } from '../delivery-slots/delivery-slots.service.js';
import { createOrdersService } from './orders.service.js';
import type { CartCheckoutItem, OrdersRepo, OrderRecord } from './orders.repo.js';
import type { CheckoutRequest } from './orders.schema.js';
import { cartLineTotal } from '../cart/cart.pricing.js';

/** Deterministic PRNG so a failure is reproducible from the seed. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

interface World {
  items: CartCheckoutItem[];
  deliveryFee: string;
  threshold: string;
  handlingFee: string;
  gstPercent: string;
  slotFull: boolean;
}

function randomWorld(r: () => number): World {
  const n = 1 + Math.floor(r() * 6);
  const items: CartCheckoutItem[] = [];
  for (let i = 0; i < n; i++) {
    const unitPrice = `${Math.floor(r() * 400) + 1}.${String(Math.floor(r() * 100)).padStart(2, '0')}`;
    const qtyKg = `${Math.floor(r() * 5)}.${String(1 + Math.floor(r() * 999)).padStart(3, '0')}`;
    items.push({
      id: newId(),
      cartId: 'c',
      productId: newId(),
      name: `P${i}`,
      grade: 'GRADE_1',
      qtyKg,
      unitPrice,
      lineTotal: cartLineTotal(unitPrice, qtyKg),
      allocationId: newId(),
      batchId: newId(),
    });
  }
  const money = (max: number) => `${Math.floor(r() * max)}.${String(Math.floor(r() * 100)).padStart(2, '0')}`;
  return {
    items,
    deliveryFee: money(80),
    threshold: money(1500),
    handlingFee: r() < 0.3 ? '0.00' : money(30),
    gstPercent: ['0', '5', '12', '18', '2.5'][Math.floor(r() * 5)]!,
    slotFull: false,
  };
}

function harness(world: World, walletBalance = '100000.00') {
  const writes: string[] = [];
  let created: { totalAmount: Money; subtotal: Money; deliveryFee: Money; handlingFee: Money; gstAmount: Money } | null = null;
  const cartId = newId();
  const lockedUntil = new Date(Date.now() + 3_600_000);

  const repo: OrdersRepo = {
    async getDeliveryConfig() {
      return {
        deliveryFee: world.deliveryFee as Money,
        freeDeliveryThreshold: world.threshold as Money,
        homeDeliveryEnabled: true,
        handlingFee: world.handlingFee as Money,
      };
    },
    async getRetailGstRateRaw() { return world.gstPercent; },
    async isOwnLiveAddress() { return true; },
    async getCustomerWalletBalance() { return walletBalance; },
    async findCartForCheckout(_db, customerId) {
      return { id: cartId, customerId, warehouseId: null, status: 'LOCKED', lockedAt: new Date(), lockedUntil, items: world.items };
    },
    async generateOrderNumber() { writes.push('generateOrderNumber'); return 'TOH-2026-000001'; },
    async findOrderByCartId() { return null; },
    async findOrderByCartOrIdempotencyKey() { return null; },
    async findOrderById() { return null; },
    async listOrders() { return { orders: [], nextCursor: null, hasMore: false }; },
    async checkAndBookDeliverySlot() {
      writes.push('checkAndBookDeliverySlot');
      if (world.slotFull) throw new Error('SLOT_CAPACITY_EXCEEDED');
    },
    async createOrder(_db, params) {
      writes.push('createOrder');
      created = params;
      const order = {
        id: newId(), orderNumber: params.orderNumber, customerId: params.customerId, warehouseId: params.warehouseId,
        cartId: params.cartId, channel: 'ONLINE', fulfillmentType: params.fulfillmentType,
        deliveryAddressId: params.deliveryAddressId ?? null, deliverySlot: params.deliverySlot ?? null,
        deliveryDate: params.deliveryDate ?? null, subtotal: params.subtotal, deliveryFee: params.deliveryFee,
        handlingFee: params.handlingFee, discount: params.discount, gstAmount: params.gstAmount,
        totalAmount: params.totalAmount, paymentMethod: params.paymentMethod, paymentStatus: 'PAID',
        status: 'CONFIRMED', deliveryOtpHash: null, itemCount: params.items.length, placedAt: new Date(),
        createdAt: new Date(), updatedAt: null,
      } as unknown as OrderRecord;
      return { order, items: [] };
    },
    async convertAllocationsAndAppendStockLedger() { writes.push('convertAllocationsAndAppendStockLedger'); },
  } as OrdersRepo;

  const walletSvc = {
    async getWalletForActor() { return { id: newId(), balance: walletBalance } as never; },
    async move() { writes.push('wallet.move'); return {} as never; },
  } as unknown as WalletService;

  const slotsSvc: DeliverySlotsService = {
    async listSlots() { throw new Error('unused'); },
    async describeOne(_db, _wh, date, slot) {
      return describeSlot(date, slot, world.slotFull ? { slot, capacity: 2, booked: 2, isActive: true } : null, 120, new Date());
    },
  };

  const service = createOrdersService({ repo, walletSvc, slotsSvc, events: { publish: async () => undefined } });
  return { service, writes, created: () => created };
}

const actor: Actor = { userId: newId(), roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId: newId() };

function body(r: () => number): CheckoutRequest {
  return r() < 0.5
    ? { fulfillmentType: 'WAREHOUSE_PICKUP', warehouseId: newId(), paymentMethod: 'WALLET' }
    : {
        fulfillmentType: 'HOME_DELIVERY',
        warehouseId: newId(),
        deliveryAddressId: newId(),
        deliveryDate: '2999-01-01',
        deliverySlot: 'MORNING_8_12',
        paymentMethod: 'WALLET',
      };
}

describe('BR-200: quote/checkout parity', () => {
  it('BR-200a: over 300 random carts and configs, quote totals equal the order checkout writes', async () => {
    const r = rng(20261117);
    for (let i = 0; i < 300; i++) {
      const world = randomWorld(r);
      const input = body(r);
      const q = harness(world);
      const quote = await q.service.quote(actor, aScope(), input);
      expect(q.writes, `quote wrote something (iteration ${i})`).toEqual([]);

      const c = harness(world);
      const order = await c.service.checkout(actor, aScope(), input, `key-${i}`);
      const written = c.created()!;
      expect(quote.totalAmount, `iteration ${i}`).toBe(written.totalAmount);
      expect(quote.totalAmount).toBe(order.totalAmount);
      expect(quote.subtotal).toBe(written.subtotal);
      expect(quote.deliveryFee).toBe(written.deliveryFee);
      expect(quote.handlingFee).toBe(written.handlingFee);
      expect(quote.gstAmount).toBe(written.gstAmount);
    }
  });

  it('BR-200b: the handling fee is added to every order, pickup and delivery, and is not taxed', async () => {
    const world: World = {
      items: [{ id: newId(), cartId: 'c', productId: newId(), name: 'A', grade: 'GRADE_1', qtyKg: '1.000', unitPrice: '100.00', lineTotal: '100.00', allocationId: null, batchId: null }],
      deliveryFee: '40.00', threshold: '500.00', handlingFee: '15.00', gstPercent: '5', slotFull: false,
    };
    const { service } = harness(world);
    const pickup = await service.quote(actor, aScope(), { fulfillmentType: 'PICKUP', warehouseId: newId(), paymentMethod: 'WALLET' });
    expect(pickup).toMatchObject({ subtotal: '100.00', deliveryFee: '0.00', handlingFee: '15.00', gstAmount: '5.00', totalAmount: '120.00', gstRateBasisPoints: 500 });
  });

  it('BR-200c: wallet sufficiency and shortfall use the checkout comparison (shortfall = total - balance)', async () => {
    const world: World = {
      items: [{ id: newId(), cartId: 'c', productId: newId(), name: 'A', grade: 'GRADE_1', qtyKg: '5.000', unitPrice: '100.00', lineTotal: '500.00', allocationId: null, batchId: null }],
      deliveryFee: '40.00', threshold: '500.00', handlingFee: '0.00', gstPercent: '0', slotFull: false,
    };
    const poor = harness(world, '200.00');
    const q = await poor.service.quote(actor, aScope(), { fulfillmentType: 'PICKUP', warehouseId: newId(), paymentMethod: 'WALLET' });
    expect(q).toMatchObject({ walletBalance: '200.00', walletSufficient: false, shortfall: '300.00' });
    // checkout refuses with the same shortfall
    await expect(poor.service.checkout(actor, aScope(), { fulfillmentType: 'PICKUP', warehouseId: newId(), paymentMethod: 'WALLET' }, 'k'))
      .rejects.toMatchObject({ code: 'WALLET_INSUFFICIENT' });
    const exact = harness(world, '500.00');
    const q2 = await exact.service.quote(actor, aScope(), { fulfillmentType: 'PICKUP', warehouseId: newId(), paymentMethod: 'WALLET' });
    expect(q2).toMatchObject({ walletSufficient: true, shortfall: '0.00' });
  });

  it('BR-200d: the quote reports the cart lock and the chosen slot', async () => {
    const world = randomWorld(rng(7));
    const { service } = harness(world);
    const q = await service.quote(actor, aScope(), {
      fulfillmentType: 'HOME_DELIVERY', warehouseId: newId(), deliveryAddressId: newId(),
      deliveryDate: '2999-01-01', deliverySlot: 'EVENING_4_8', paymentMethod: 'WALLET',
    });
    expect(q.lockExpired).toBe(false);
    expect(q.lockExpiresAt).not.toBeNull();
    expect(q.slot).toMatchObject({ slot: 'EVENING_4_8', date: '2999-01-01', bookable: true });
  });

  it('BR-201: a full slot is 409 SLOT_FULL at quote and at checkout (not generic CONFLICT)', async () => {
    const world = { ...randomWorld(rng(9)), slotFull: true };
    const input: CheckoutRequest = {
      fulfillmentType: 'HOME_DELIVERY', warehouseId: newId(), deliveryAddressId: newId(),
      deliveryDate: '2999-01-01', deliverySlot: 'MORNING_8_12', paymentMethod: 'WALLET',
    };
    const q = harness(world);
    await expect(q.service.quote(actor, aScope(), input)).rejects.toMatchObject({ code: 'SLOT_FULL', status: 409 });
    const c = harness(world);
    await expect(c.service.checkout(actor, aScope(), input, 'k')).rejects.toMatchObject({ code: 'SLOT_FULL', status: 409 });
    expect(c.writes).not.toContain('createOrder');
  });

  it('BR-187: a quote with no customer id is refused, never priced against another cart', async () => {
    const { service, writes } = harness(randomWorld(rng(3)));
    await expect(
      service.quote({ ...actor, customerId: null }, aScope(), { fulfillmentType: 'PICKUP', warehouseId: newId(), paymentMethod: 'WALLET' }),
    ).rejects.toMatchObject({ status: 403 });
    expect(writes).toEqual([]);
  });
});
