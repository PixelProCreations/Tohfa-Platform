/**
 * BR-163: customer order and wallet events are published after commit, to the
 * customer's user, best-effort, and never on an idempotent replay.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import type { DomainEventName, EventBus } from '../../events/bus.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { aScope, newId } from '../../test/factories.js';
import { EVENT_TEMPLATE_MAP } from '../notifications/notifications.service.js';
import { createWalletCreditedPublisher } from '../topup/topup.events.js';
import type { FulfilmentRepo } from './fulfilment.repo.js';
import { createFulfilmentService } from './fulfilment.service.js';
import { createOrderEventPublisher, type OrderEventPublisher } from './orders.events.js';

function fakeBus() {
  const published: Array<{ name: DomainEventName; payload: unknown }> = [];
  const bus: EventBus = {
    publish: vi.fn(async (name, payload) => {
      published.push({ name, payload });
    }),
    subscribe: vi.fn(() => () => undefined),
    clear: vi.fn(),
  };
  return { bus, published };
}

const db = {} as Executor;
const USER = '30000000-0000-4000-8000-0000000000c1';

describe('BR-163: order event publisher', () => {
  it('BR-163: order.confirmed goes to the customer user with order number and total', async () => {
    const { bus, published } = fakeBus();
    const pub = createOrderEventPublisher({
      db,
      bus,
      lookup: async () => ({ userId: USER, orderNumber: 'TOH-2026-000009', totalAmount: '210.00' }),
    });
    await pub.publish('order.confirmed', 'o-1');
    expect(published).toEqual([
      {
        name: 'order.confirmed',
        payload: { userId: USER, orderId: 'o-1', orderNumber: 'TOH-2026-000009', totalAmount: '210.00' },
      },
    ]);
  });

  it('BR-163: a lookup failure is swallowed (a committed order never becomes a 500)', async () => {
    const { bus, published } = fakeBus();
    const pub = createOrderEventPublisher({
      db,
      bus,
      lookup: async () => {
        throw new Error('db down');
      },
    });
    await expect(pub.publish('order.delivered', 'o-1')).resolves.toBeUndefined();
    expect(published).toEqual([]);
  });

  it('BR-163: a walk-in order (no customer) publishes nothing', async () => {
    const { bus, published } = fakeBus();
    const pub = createOrderEventPublisher({ db, bus, lookup: async () => null });
    await pub.publish('order.dispatched', 'o-1');
    expect(published).toEqual([]);
  });

  it('BR-163: wallet.credited carries amount, balance and reference to the wallet owner', async () => {
    const { bus, published } = fakeBus();
    const publish = createWalletCreditedPublisher({ db, bus, lookup: async () => USER });
    await publish({ walletId: 'w-1', amount: '500.00', balanceAfter: '750.00', reference: 'pay_123' });
    expect(published).toEqual([
      { name: 'wallet.credited', payload: { userId: USER, amount: '500.00', balance: '750.00', reference: 'pay_123' } },
    ]);
  });

  it('BR-163: every published customer event maps to a notification template', () => {
    for (const name of ['order.confirmed', 'order.dispatched', 'order.delivered', 'wallet.credited'] as const) {
      expect(EVENT_TEMPLATE_MAP[name]).toBeTruthy();
    }
  });
});

describe('BR-163: fulfilment publishes dispatched / delivered after commit', () => {
  const OTP = '4821';
  const actor: Actor = { userId: newId(), roles: [{ code: RoleCode.MAIN_WH_ADMIN }], farmerId: null, customerId: null };
  const scope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, userId: actor.userId });

  function harness(status: string, fulfillmentType: 'PICKUP' | 'DELIVERY') {
    const orderId = newId();
    const state = { status };
    const repo = {
      findOrderForFulfilment: vi.fn(async () => ({
        id: orderId,
        orderNumber: 'TOH-2026-000001',
        status: state.status,
        fulfillmentType,
        warehouseId: 'wh',
        items: [],
      })),
      getOrderDeliveryOtpHolder: vi.fn(async () => ({
        id: orderId,
        status: state.status,
        fulfilmentType: fulfillmentType,
        deliveryOtpHash: createHash('sha256').update(OTP).digest('hex'),
        otpAttempts: 0,
        customerId: newId(),
        warehouseId: 'wh',
      })),
      getMaxOtpAttempts: vi.fn(async () => 3),
      incrementOtpAttempts: vi.fn(async () => 1),
      updateOrderStatus: vi.fn(async (_tx: Executor, p: { toStatus: string }) => {
        state.status = p.toStatus;
        return 1;
      }),
    } as unknown as FulfilmentRepo;
    const tx = { query: vi.fn(async () => ({ rows: [{ id: newId() }], rowCount: 1 })) } as unknown as Executor;
    const sent: string[] = [];
    const events: OrderEventPublisher = { publish: vi.fn(async (name) => void sent.push(name)) };
    const service = createFulfilmentService({
      repo,
      db: tx,
      runTx: async (fn) => fn(tx),
      idempotency: createInMemoryIdempotencyStore(),
      events,
    });
    return { orderId, service, sent };
  }

  it('BR-163: dispatching a delivery order publishes order.dispatched once, not on replay', async () => {
    const h = harness('PACKED', 'DELIVERY');
    await h.service.dispatchOrder(actor, scope, h.orderId, {}, 'k1');
    await h.service.dispatchOrder(actor, scope, h.orderId, {}, 'k1');
    expect(h.sent).toEqual(['order.dispatched']);
  });

  it('BR-163: a pickup order made ready publishes no "on its way" event', async () => {
    const h = harness('PACKED', 'PICKUP');
    await h.service.dispatchOrder(actor, scope, h.orderId, {}, 'k1');
    expect(h.sent).toEqual([]);
  });

  it('BR-163: a verified handover publishes order.delivered', async () => {
    const h = harness('READY_FOR_PICKUP', 'PICKUP');
    await h.service.verifyOtp(actor, scope, h.orderId, { otp: OTP }, 'k2');
    expect(h.sent).toEqual(['order.delivered']);
  });
});
