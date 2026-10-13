/**
 * POST /v1/admin/orders/{orderId}/assign-warehouse under concurrency (BR-85j).
 *
 * The reassign used to read the order with no lock, run its state and channel checks on that
 * read, and then issue `UPDATE ... WHERE status = <what it read>` without looking at the row
 * count. A pack (or cancel) committing between the read and the update made the UPDATE match
 * nothing, yet the order_status_history row and the audit row were still written and the caller
 * got 200: an append-only ledger then records a reassignment that never happened.
 *
 * The fix: the checks run on the row locked with SELECT ... FOR UPDATE inside the transaction,
 * and an UPDATE that matches no row is a 409 that rolls back (no history, no audit row).
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { fulfilmentRepo, type FulfilmentRepo } from './fulfilment.repo.js';
import { createFulfilmentService } from './fulfilment.service.js';

const WH_A = '10000000-0000-4000-8000-0000000000a1';
const WH_B = '10000000-0000-4000-8000-0000000000b2';
const PERMISSION = 'order.warehouse.assign';

interface FakeTx extends Executor {
  statements: string[];
}

function fakeTx(): FakeTx {
  const statements: string[] = [];
  return {
    statements,
    query: vi.fn(async (sql: string) => {
      statements.push(sql);
      // writeAuditLog reads back the inserted id.
      return /INSERT INTO audit_log/i.test(sql) ? { rows: [{ id: newId() }], rowCount: 1 } : { rows: [], rowCount: 0 };
    }),
  } as unknown as FakeTx;
}

function harness(opts: {
  unlocked: { status: string; channel: string; warehouseId?: string };
  locked: { status: string; channel: string; warehouseId?: string } | null;
  updatedRows?: number;
}) {
  const orderId = newId();
  const tx = fakeTx();
  const asOrder = (o: { status: string; channel: string; warehouseId?: string }) => ({
    id: orderId,
    status: o.status,
    channel: o.channel,
    fulfillmentType: 'PICKUP',
    warehouseId: o.warehouseId ?? WH_A,
  });
  const repo = {
    findOrderForFulfilment: vi.fn(async () => asOrder(opts.unlocked)),
    lockOrderForUpdate: vi.fn(async () => (opts.locked === null ? null : asOrder(opts.locked))),
    updateOrderStatus: vi.fn(async () => opts.updatedRows ?? 1),
  } as unknown as FulfilmentRepo;
  let committed = false;
  const runTx = async <T>(fn: (t: Executor) => Promise<T>): Promise<T> => {
    const result = await fn(tx);
    committed = true;
    return result;
  };
  const service = createFulfilmentService({ repo, db: {} as Executor, runTx });
  const actor = { userId: newId(), roles: [{ code: RoleCode.MAIN_WH_ADMIN }], farmerId: null, customerId: null };
  const main: ResolvedScope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: PERMISSION });
  return { orderId, tx, repo, service, actor, main, wasCommitted: () => committed };
}

describe('assign-warehouse row lock (fake repo) — BR-85j', () => {
  it('BR-85j: the state check runs on the row locked inside the transaction, not on an earlier unlocked read', async () => {
    // The unlocked read still says CONFIRMED; by the time the row is locked it has been PACKED.
    const h = harness({ unlocked: { status: 'CONFIRMED', channel: 'ONLINE' }, locked: { status: 'PACKED', channel: 'ONLINE' } });
    await expect(h.service.assignWarehouse(h.actor, h.main, h.orderId, { warehouseId: WH_B })).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
    expect(vi.mocked(h.repo.lockOrderForUpdate)).toHaveBeenCalledWith(h.tx, h.orderId);
    expect(vi.mocked(h.repo.updateOrderStatus)).not.toHaveBeenCalled();
    expect(h.tx.statements.some((sql) => /audit_log/i.test(sql))).toBe(false);
    expect(h.wasCommitted()).toBe(false);
  });

  it('BR-85j: the update uses the LOCKED status as its from-status and runs on the transaction client', async () => {
    const h = harness({ unlocked: { status: 'PENDING_PAYMENT', channel: 'ONLINE' }, locked: { status: 'CONFIRMED', channel: 'ONLINE' } });
    await h.service.assignWarehouse(h.actor, h.main, h.orderId, { warehouseId: WH_B });
    const call = vi.mocked(h.repo.updateOrderStatus).mock.calls[0]!;
    expect(call[0]).toBe(h.tx);
    expect(call[1]).toMatchObject({ orderId: h.orderId, fromStatus: 'CONFIRMED', toStatus: 'CONFIRMED', warehouseId: WH_B });
    expect(h.tx.statements.some((sql) => /INSERT INTO audit_log/i.test(sql))).toBe(true);
    expect(h.wasCommitted()).toBe(true);
  });

  it('BR-85j: an UPDATE that matches no row is 409 CONFLICT and writes no audit row (the transaction rolls back)', async () => {
    const h = harness({
      unlocked: { status: 'CONFIRMED', channel: 'ONLINE' },
      locked: { status: 'CONFIRMED', channel: 'ONLINE' },
      updatedRows: 0,
    });
    await expect(h.service.assignWarehouse(h.actor, h.main, h.orderId, { warehouseId: WH_B })).rejects.toMatchObject({
      code: 'CONFLICT',
      status: 409,
    });
    expect(h.tx.statements.some((sql) => /audit_log/i.test(sql))).toBe(false);
    expect(h.wasCommitted()).toBe(false);
  });

  it('BR-85j: an order that is gone (or out of scope) once locked is 404 NOT_FOUND, nothing written', async () => {
    const h = harness({ unlocked: { status: 'CONFIRMED', channel: 'ONLINE' }, locked: null });
    await expect(h.service.assignWarehouse(h.actor, h.main, h.orderId, { warehouseId: WH_B })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
    expect(vi.mocked(h.repo.updateOrderStatus)).not.toHaveBeenCalled();

    const sub = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [WH_B], permission: PERMISSION });
    const h2 = harness({ unlocked: { status: 'CONFIRMED', channel: 'ONLINE' }, locked: { status: 'CONFIRMED', channel: 'ONLINE' } });
    await expect(h2.service.assignWarehouse(h2.actor, sub, h2.orderId, { warehouseId: WH_B })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
    expect(vi.mocked(h2.repo.updateOrderStatus)).not.toHaveBeenCalled();
  });

  it('BR-85i: the counter-sale refusal is decided on the locked row and still writes nothing', async () => {
    for (const channel of ['DIRECT', 'MARKET']) {
      const h = harness({ unlocked: { status: 'PENDING_PAYMENT', channel }, locked: { status: 'PENDING_PAYMENT', channel } });
      await expect(h.service.assignWarehouse(h.actor, h.main, h.orderId, { warehouseId: WH_B })).rejects.toMatchObject({
        code: 'COUNTER_SALE_NOT_REASSIGNABLE',
        status: 409,
      });
      expect(vi.mocked(h.repo.lockOrderForUpdate), channel).toHaveBeenCalledWith(h.tx, h.orderId);
      expect(vi.mocked(h.repo.updateOrderStatus), channel).not.toHaveBeenCalled();
      expect(h.wasCommitted(), channel).toBe(false);
    }
  });
});

describe('pack / dispatch status updates that match no row (fake repo) — BR-85j', () => {
  it('BR-85j: pack and dispatch are 409 CONFLICT with no audit row when the conditional status update changes nothing', async () => {
    for (const action of ['pack', 'dispatch'] as const) {
      const h = harness({ unlocked: { status: 'CONFIRMED', channel: 'ONLINE' }, locked: null, updatedRows: 0 });
      const call =
        action === 'pack'
          ? h.service.packOrder(h.actor, h.main, h.orderId, {})
          : h.service.dispatchOrder(h.actor, h.main, h.orderId, {});
      await expect(call, action).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
      expect(h.tx.statements.some((sql) => /audit_log/i.test(sql)), action).toBe(false);
      expect(h.wasCommitted(), action).toBe(false);
    }
  });
});

describe('fulfilmentRepo.updateOrderStatus (fake executor) — BR-85j', () => {
  it('BR-85j: when the conditional UPDATE matches no row it reports 0 and appends no order_status_history row', async () => {
    const statements: string[] = [];
    const db = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        return { rows: [], rowCount: /^\s*UPDATE orders/i.test(sql) ? 0 : 1 };
      }),
    } as unknown as Executor;
    const updated = await fulfilmentRepo.updateOrderStatus(db, {
      orderId: newId(),
      fromStatus: 'CONFIRMED',
      toStatus: 'PACKED',
      actorUserId: newId(),
    });
    expect(updated).toBe(0);
    expect(statements.some((sql) => /order_status_history/i.test(sql))).toBe(false);
  });

  it('BR-85j: lockOrderForUpdate takes a row lock (SELECT ... FOR UPDATE)', async () => {
    const statements: string[] = [];
    const db = {
      query: vi.fn(async (sql: string) => {
        statements.push(sql);
        return { rows: [], rowCount: 0 };
      }),
    } as unknown as Executor;
    await expect(fulfilmentRepo.lockOrderForUpdate(db, newId())).resolves.toBeNull();
    expect(statements[0]).toMatch(/FOR UPDATE/i);
  });
});

// ===========================================================================
// Real PostgreSQL: a pack that commits while the reassign is waiting for the row
// ===========================================================================
describeIfDatabase('assign-warehouse races a concurrent status change (PostgreSQL) — BR-85j', () => {
  let ready = false;
  let coonoor = '';
  let gudalur = '';
  const created = { users: [] as string[], customers: [] as string[], crops: [] as string[], orders: [] as string[] };

  beforeAll(async () => {
    ready = await databaseReady('sale_payments');
    if (!ready) return;
    const [{ pool }, fx] = await Promise.all([import('../../db/pool.js'), import('../../test/dbFixtures.js')]);
    const wh = await pool.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-COON', 'WH-GUDA')`);
    coonoor = wh.rows.find((w) => w.code === 'WH-COON')!.id;
    gudalur = wh.rows.find((w) => w.code === 'WH-GUDA')!.id;
    const userId = await fx.insertUser(pool, 'CUSTOMER', 'Reassign Race Buyer');
    const customer = await pool.query<{ id: string }>(
      `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
      [userId, `CUST-RR-${newId().slice(0, 8)}`],
    );
    created.users.push(userId);
    created.customers.push(customer.rows[0]!.id);
    created.crops.push(await fx.insertCrop(pool));
  });

  afterAll(async () => {
    if (!ready) return;
    const [{ closePool, withTransaction }, { closeRedis }, { removeCommittedFixtures }] = await Promise.all([
      import('../../db/pool.js'),
      import('../../redis.js'),
      import('../../test/committedFixtureCleanup.js'),
    ]);
    try {
      await removeCommittedFixtures(withTransaction, {
        orderIds: created.orders,
        cropIds: created.crops,
        customerIds: created.customers,
        userIds: created.users,
      });
    } finally {
      await Promise.allSettled([closePool(), closeRedis()]);
    }
  });

  it('BR-85j: a pack that commits while the reassign waits for the row makes the reassign 409; the order stays put and no reassign history or audit row is written', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    const o = await pool.query<{ id: string }>(
      `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, subtotal, total_amount,
                           payment_method, payment_status, status)
       VALUES ($1, $2, $3, 'ONLINE', 1.10, 1.10, 'WALLET', 'PAID', 'CONFIRMED') RETURNING id`,
      [`OL-RR-${newId().slice(0, 12)}`, created.customers[0]!, coonoor],
    );
    const orderId = o.rows[0]!.id;
    created.orders.push(orderId);
    await pool.query(
      `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, line_total) VALUES ($1, $2, 'GRADE_2', 1.000, 1.10, 1.10)`,
      [orderId, created.crops[0]!],
    );

    const service = createFulfilmentService();
    const actor = { userId: '00000000-0000-0000-0000-000000000001', roles: [{ code: RoleCode.MAIN_WH_ADMIN }], farmerId: null, customerId: null };
    const main: ResolvedScope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: PERMISSION });

    // A concurrent pack holds the row and moves it to PACKED, but has not committed yet.
    const packer = await pool.connect();
    let reassign: Promise<unknown> | undefined;
    try {
      await packer.query('BEGIN');
      await packer.query(`SELECT id FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
      await packer.query(`UPDATE orders SET status = 'PACKED', packed_at = now() WHERE id = $1`, [orderId]);

      reassign = service.assignWarehouse(actor, main, orderId, { warehouseId: gudalur, reason: 'race' }).then(
        (value) => ({ ok: true as const, value }),
        (error: unknown) => ({ ok: false as const, error }),
      );
      // Give the reassign time to reach (and block on) the row before the pack commits.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await packer.query('COMMIT');
    } finally {
      packer.release();
    }

    const outcome = (await reassign) as { ok: boolean; error?: { code?: string; status?: number } };
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatchObject({ status: 409 });

    const row = await pool.query<{ status: string; warehouse_id: string }>(`SELECT status, warehouse_id FROM orders WHERE id = $1`, [orderId]);
    expect(row.rows[0]).toEqual({ status: 'PACKED', warehouse_id: coonoor });
    const history = await pool.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM order_status_history WHERE order_id = $1 AND note LIKE 'Reassigned%'`,
      [orderId],
    );
    expect(history.rows[0]!.n).toBe('0');
    const audit = await pool.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM audit_log WHERE entity_id = $1 AND action_code = 'order.warehouse.assign'`,
      [orderId],
    );
    expect(audit.rows[0]!.n).toBe('0');
  });
});
