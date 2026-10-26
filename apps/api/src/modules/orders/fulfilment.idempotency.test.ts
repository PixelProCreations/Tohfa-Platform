/**
 * BR-118: the order fulfilment writes honour their Idempotency-Key (docs/openapi.yaml
 * `IdempotencyKeyHeader`, `required: true`; root CLAUDE.md 2.4).
 *
 * WHY THIS FILE EXISTS: POST /admin/orders/{id}/pack, /dispatch and /verify-otp declared the header
 * (and the mobile admin app sends it) but the server ignored it. A retry after a dropped response
 * turned a pack or a handover that had succeeded into 409 INVALID_STATE_TRANSITION, which the admin
 * reads as a failure, and a retried verify-otp re-ran the OTP check against an order already handed
 * over.
 *
 * The contract is the shared helper's (apps/api/src/http/idempotency.ts, BR-68): missing key 422,
 * replay returns the stored response and writes nothing (no second order_status_history row, no
 * second audit row, no OTP attempt, no second order event), same key with a different request 409
 * IDEMPOTENCY_KEY_REUSED, a refused attempt is not remembered (a wrong OTP still counts, BR-20).
 *
 *   1. Unit: a counting fake repo and the in-memory store.
 *   2. PostgreSQL, one rolled-back transaction whose inner transactions are SAVEPOINTs, with the
 *      real repo and the real `idempotency_keys` store.
 */
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { insertCrop, insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { fulfilmentRepo, type FulfilmentRepo } from './fulfilment.repo.js';
import { createFulfilmentService } from './fulfilment.service.js';

const wire = (value: unknown): unknown => JSON.parse(JSON.stringify(value));
const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<AppError> {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected ${code}`).toBeInstanceOf(AppError);
  expect((caught as AppError).code).toBe(code);
  expect((caught as AppError).status).toBe(status);
  return caught as AppError;
}

// ---------------------------------------------------------------------------
// 1. Unit
// ---------------------------------------------------------------------------
describe('BR-118: pack, dispatch and verify-otp honour the Idempotency-Key (unit)', () => {
  const WH = '10000000-0000-4000-8000-0000000000a1';
  const OTP = '4821';
  const actor: Actor = { userId: newId(), roles: [{ code: RoleCode.MAIN_WH_ADMIN }], farmerId: null, customerId: null };
  const scope: ResolvedScope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, userId: actor.userId });

  function harness(initialStatus: string) {
    const orderId = newId();
    const state = { status: initialStatus, otpAttempts: 0 };
    const order = () => ({
      id: orderId,
      orderNumber: 'TOH-2026-000001',
      status: state.status,
      channel: 'ONLINE',
      fulfillmentType: 'PICKUP',
      warehouseId: WH,
      itemCount: 1,
      totalAmount: '200.00',
      paymentStatus: 'PAID',
      deliveryDate: null,
      placedAt: '2026-10-26T04:00:00.000Z',
      subtotal: '200.00',
      deliveryFee: '0.00',
      discount: '0.00',
      gstAmount: '0.00',
      deliverySlot: null,
      deliveryAddressId: null,
      otpRequired: true,
      cancellationReason: null,
      deliveredAt: null,
      items: [],
    });
    const repo = {
      findOrderForFulfilment: vi.fn(async () => order()),
      getOrderDeliveryOtpHolder: vi.fn(async () => ({
        id: orderId,
        status: state.status,
        fulfilmentType: 'PICKUP',
        deliveryOtpHash: sha256(OTP),
        otpAttempts: state.otpAttempts,
        customerId: newId(),
        warehouseId: WH,
      })),
      getMaxOtpAttempts: vi.fn(async () => 3),
      incrementOtpAttempts: vi.fn(async () => (state.otpAttempts += 1)),
      updateOrderStatus: vi.fn(async (_tx: Executor, params: { fromStatus: string; toStatus: string }) => {
        if (params.fromStatus !== state.status) return 0;
        state.status = params.toStatus;
        return 1;
      }),
    } as unknown as FulfilmentRepo;
    const audits: string[] = [];
    const tx = {
      query: vi.fn(async (sql: string, params?: unknown[]) => {
        if (/INSERT INTO audit_log/i.test(sql)) {
          audits.push(String(params?.find((p) => typeof p === 'string' && p.startsWith('order.')) ?? 'audit'));
          return { rows: [{ id: newId() }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }),
    } as unknown as Executor;
    const emitter = new EventEmitter();
    const events: unknown[] = [];
    emitter.on(`order:${orderId}`, (event) => events.push(event));
    const store = createInMemoryIdempotencyStore();
    const service = createFulfilmentService({ repo, db: tx, runTx: async (fn) => fn(tx), emitter, idempotency: store });
    return { orderId, state, repo, audits, events, store, service };
  }

  it('BR-118a: a missing, empty or blank Idempotency-Key is 422 VALIDATION_FAILED naming the header on pack, dispatch and verify-otp, and nothing is written', async () => {
    for (const key of [undefined, '', '  ']) {
      const pack = harness('CONFIRMED');
      const packError = await expectAppError(pack.service.packOrder(actor, scope, pack.orderId, {}, key), 'VALIDATION_FAILED', 422);
      expect(Object.keys(packError.errors ?? {})).toContain('header.Idempotency-Key');
      const dispatch = harness('PACKED');
      await expectAppError(dispatch.service.dispatchOrder(actor, scope, dispatch.orderId, {}, key), 'VALIDATION_FAILED', 422);
      const verify = harness('READY_FOR_PICKUP');
      await expectAppError(verify.service.verifyOtp(actor, scope, verify.orderId, { otp: OTP }, key), 'VALIDATION_FAILED', 422);
      for (const h of [pack, dispatch, verify]) {
        expect(vi.mocked(h.repo.updateOrderStatus)).not.toHaveBeenCalled();
        expect(vi.mocked(h.repo.incrementOtpAttempts)).not.toHaveBeenCalled();
        expect(h.audits).toEqual([]);
        expect(h.store.size()).toBe(0);
      }
    }
  });

  it('BR-118b: a replayed pack returns the identical body (not INVALID_STATE_TRANSITION) with one status change, one audit row and one event', async () => {
    const h = harness('CONFIRMED');
    const key = newId();
    const first = await h.service.packOrder(actor, scope, h.orderId, {}, key);
    const second = await h.service.packOrder(actor, scope, h.orderId, {}, key);
    expect(first.status).toBe('PACKED');
    expect(wire(second)).toEqual(wire(first));
    expect(vi.mocked(h.repo.updateOrderStatus)).toHaveBeenCalledTimes(1);
    expect(h.audits).toHaveLength(1);
    expect(h.events).toHaveLength(1);
  });

  it('BR-118b: a replayed dispatch returns the identical body with one status change, one audit row and one event', async () => {
    const h = harness('PACKED');
    const key = newId();
    const body = { vehicleNumber: 'TN43AB1234' };
    const first = await h.service.dispatchOrder(actor, scope, h.orderId, body, key);
    const second = await h.service.dispatchOrder(actor, scope, h.orderId, body, key);
    expect(first.status).toBe('READY_FOR_PICKUP');
    expect(wire(second)).toEqual(wire(first));
    expect(vi.mocked(h.repo.updateOrderStatus)).toHaveBeenCalledTimes(1);
    expect(h.audits).toHaveLength(1);
    expect(h.events).toHaveLength(1);
  });

  it('BR-118b / BR-20: a replayed verify-otp returns the identical body, counts no OTP attempt and changes the status once', async () => {
    const h = harness('READY_FOR_PICKUP');
    const key = newId();
    const first = await h.service.verifyOtp(actor, scope, h.orderId, { otp: OTP }, key);
    const second = await h.service.verifyOtp(actor, scope, h.orderId, { otp: OTP }, key);
    expect(first.status).toBe('PICKED_UP');
    expect(wire(second)).toEqual(wire(first));
    expect(vi.mocked(h.repo.updateOrderStatus)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(h.repo.incrementOtpAttempts)).not.toHaveBeenCalled();
    expect(h.audits).toHaveLength(1);
    expect(h.events).toHaveLength(1);
  });

  it('BR-118c: the same key with a different body, a different order or on a different operation is 409 IDEMPOTENCY_KEY_REUSED; nothing more is written and no OTP attempt is counted', async () => {
    const h = harness('PACKED');
    const key = newId();
    await h.service.dispatchOrder(actor, scope, h.orderId, { vehicleNumber: 'TN43AB1234' }, key);
    await expectAppError(h.service.dispatchOrder(actor, scope, h.orderId, { vehicleNumber: 'TN43ZZ9999' }, key), 'IDEMPOTENCY_KEY_REUSED', 409);
    await expectAppError(h.service.dispatchOrder(actor, scope, newId(), { vehicleNumber: 'TN43AB1234' }, key), 'IDEMPOTENCY_KEY_REUSED', 409);
    await expectAppError(h.service.packOrder(actor, scope, h.orderId, {}, key), 'IDEMPOTENCY_KEY_REUSED', 409);
    await expectAppError(h.service.verifyOtp(actor, scope, h.orderId, { otp: '0000' }, key), 'IDEMPOTENCY_KEY_REUSED', 409);
    expect(vi.mocked(h.repo.updateOrderStatus)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(h.repo.incrementOtpAttempts)).not.toHaveBeenCalled();
    expect(h.audits).toHaveLength(1);
  });

  it('BR-118d / BR-20: a wrong OTP is still 422 OTP_INVALID and still counts exactly one attempt', async () => {
    const h = harness('READY_FOR_PICKUP');
    const error = await expectAppError(h.service.verifyOtp(actor, scope, h.orderId, { otp: '0000' }, newId()), 'OTP_INVALID', 422);
    expect(error.meta).toEqual({ remainingAttempts: 2 });
    expect(vi.mocked(h.repo.incrementOtpAttempts)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(h.repo.updateOrderStatus)).not.toHaveBeenCalled();
    expect(h.state.status).toBe('READY_FOR_PICKUP');
  });
});

// ---------------------------------------------------------------------------
// 2. PostgreSQL, rolled back
// ---------------------------------------------------------------------------
class RollbackFixture extends Error {}

interface World {
  tx: Executor;
  admin: Actor;
  scope: ResolvedScope;
  events: string[];
  service: ReturnType<typeof createFulfilmentService>;
  order: (status: string, otp: string) => Promise<string>;
}

async function inRolledBackTx(fn: (world: World) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../../db/pool.js');
  await withTransaction(async (tx) => {
    const adminId = await insertUser(tx, 'ADMIN', 'BR-118 fulfilment admin');
    const wh = await tx.query<{ id: string }>(`SELECT id FROM warehouses WHERE code = 'WH-OOTY'`);
    const ooty = wh.rows[0]?.id;
    if (ooty === undefined) throw new Error('seeded warehouse WH-OOTY is missing: run the reference seed first');
    const customerUser = await insertUser(tx, 'CUSTOMER', 'BR-118 buyer');
    const customer = await tx.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [customerUser, `CUST-B118-${newId().slice(0, 8)}`],
    );
    const customerId = customer.rows[0]!.id;
    const cropId = await insertCrop(tx);

    let savepoints = 0;
    const runTx = async <T>(work: (executor: Executor) => Promise<T>): Promise<T> => {
      const name = `sp_${(savepoints += 1)}`;
      await tx.query(`SAVEPOINT ${name}`);
      try {
        const result = await work(tx);
        await tx.query(`RELEASE SAVEPOINT ${name}`);
        return result;
      } catch (error) {
        await tx.query(`ROLLBACK TO SAVEPOINT ${name}`);
        throw error;
      }
    };
    const emitter = new EventEmitter();
    const events: string[] = [];
    const originalEmit = emitter.emit.bind(emitter);
    emitter.emit = (name: string | symbol, ...args: unknown[]): boolean => {
      events.push(String(name));
      return originalEmit(name, ...args);
    };

    await fn({
      tx,
      admin: { userId: adminId, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], farmerId: null, customerId: null },
      scope: aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, userId: adminId }),
      events,
      // The real repo and the real idempotency store (the default) on `tx`.
      service: createFulfilmentService({ repo: fulfilmentRepo, db: tx, runTx, emitter }),
      order: async (status, otp) => {
        const res = await tx.query<{ id: string }>(
          `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, fulfilment_type,
                               subtotal, delivery_fee, discount, gst_amount, total_amount,
                               payment_method, payment_status, status, delivery_otp_hash, otp_attempts, placed_at)
           VALUES ($1, $2, $3, 'ONLINE', 'PICKUP', 200.00, 0.00, 0.00, 0.00, 200.00,
                   'WALLET', 'PAID', $4, $5, 0, now())
           RETURNING id`,
          [`B118-${newId().slice(0, 13)}`, customerId, ooty, status, sha256(otp)],
        );
        const id = res.rows[0]!.id;
        await tx.query(
          `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, line_total)
           VALUES ($1, $2, 'GRADE_1', 2.000, 100.00, 200.00)`,
          [id, cropId],
        );
        return id;
      },
    });
    throw new RollbackFixture();
  }).catch((error: unknown) => {
    if (!(error instanceof RollbackFixture)) throw error;
  });
}

const dbReady = (): Promise<boolean> => requireDatabaseTables('orders', 'order_status_history', 'audit_log', 'idempotency_keys');

function dbIt(name: string, fn: (world: World) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inRolledBackTx(fn);
  });
}

async function orderEffects(db: Executor, orderId: string) {
  const res = await db.query<{ status: string; otpAttempts: number; history: string[]; audits: string[] }>(
    `SELECT o.status::text AS status, o.otp_attempts AS "otpAttempts",
            COALESCE((SELECT array_agg(h.to_status::text ORDER BY h.created_at, h.id)
                        FROM order_status_history h WHERE h.order_id = o.id), '{}') AS history,
            COALESCE((SELECT array_agg(a.action_code ORDER BY a.created_at, a.id)
                        FROM audit_log a WHERE a.entity_id = o.id), '{}') AS audits
       FROM orders o WHERE o.id = $1`,
    [orderId],
  );
  // One outer transaction: now() is the same for every row, so the order of the rows is not
  // meaningful. Compare them as sorted multisets (a duplicate still shows up twice).
  const row = res.rows[0]!;
  return { ...row, history: [...row.history].sort(), audits: [...row.audits].sort() };
}

describeIfDatabase('BR-118: order fulfilment writes are idempotent against PostgreSQL (rolled back)', () => {
  dbIt('BR-118b: replayed pack, dispatch and verify-otp each return the identical body and leave exactly one history row, one audit row and one event each', async (w) => {
    const orderId = await w.order('CONFIRMED', '4821');
    const packKey = newId();
    const dispatchKey = newId();
    const verifyKey = newId();

    const packed = await w.service.packOrder(w.admin, w.scope, orderId, {}, packKey);
    expect(wire(await w.service.packOrder(w.admin, w.scope, orderId, {}, packKey))).toEqual(wire(packed));
    const dispatched = await w.service.dispatchOrder(w.admin, w.scope, orderId, {}, dispatchKey);
    expect(wire(await w.service.dispatchOrder(w.admin, w.scope, orderId, {}, dispatchKey))).toEqual(wire(dispatched));
    const verified = await w.service.verifyOtp(w.admin, w.scope, orderId, { otp: '4821' }, verifyKey);
    expect(wire(await w.service.verifyOtp(w.admin, w.scope, orderId, { otp: '4821' }, verifyKey))).toEqual(wire(verified));

    expect([packed.status, dispatched.status, verified.status]).toEqual(['PACKED', 'READY_FOR_PICKUP', 'PICKED_UP']);
    expect(await orderEffects(w.tx, orderId)).toEqual({
      status: 'PICKED_UP',
      otpAttempts: 0,
      history: ['PACKED', 'PICKED_UP', 'READY_FOR_PICKUP'],
      audits: ['order.dispatch', 'order.mark_packed', 'order.pickup_otp.verify'],
    });
    expect(w.events).toEqual([`order:${orderId}`, `order:${orderId}`, `order:${orderId}`]);
  });

  dbIt('BR-118c: the same key with a different body or order is 409 IDEMPOTENCY_KEY_REUSED and writes nothing', async (w) => {
    const orderId = await w.order('PACKED', '4821');
    const other = await w.order('PACKED', '1111');
    const key = newId();
    await w.service.dispatchOrder(w.admin, w.scope, orderId, { vehicleNumber: 'TN43AB1234' }, key);
    const before = await orderEffects(w.tx, orderId);
    await expectAppError(w.service.dispatchOrder(w.admin, w.scope, orderId, { vehicleNumber: 'TN43ZZ9999' }, key), 'IDEMPOTENCY_KEY_REUSED', 409);
    await expectAppError(w.service.dispatchOrder(w.admin, w.scope, other, { vehicleNumber: 'TN43AB1234' }, key), 'IDEMPOTENCY_KEY_REUSED', 409);
    expect(await orderEffects(w.tx, orderId)).toEqual(before);
    expect((await orderEffects(w.tx, other)).history).toEqual([]);
  });

  dbIt('BR-118d / BR-20: a wrong OTP counts one attempt and is not remembered, so the same key then verifies the right OTP once', async (w) => {
    const orderId = await w.order('READY_FOR_PICKUP', '4821');
    const key = newId();
    await expectAppError(w.service.verifyOtp(w.admin, w.scope, orderId, { otp: '0000' }, key), 'OTP_INVALID', 422);
    expect(await orderEffects(w.tx, orderId)).toMatchObject({ status: 'READY_FOR_PICKUP', otpAttempts: 1, history: [], audits: [] });

    const verified = await w.service.verifyOtp(w.admin, w.scope, orderId, { otp: '4821' }, key);
    expect(verified.status).toBe('PICKED_UP');
    expect(wire(await w.service.verifyOtp(w.admin, w.scope, orderId, { otp: '4821' }, key))).toEqual(wire(verified));
    expect(await orderEffects(w.tx, orderId)).toEqual({
      status: 'PICKED_UP',
      otpAttempts: 1,
      history: ['PICKED_UP'],
      audits: ['order.pickup_otp.verify'],
    });
  });
});
