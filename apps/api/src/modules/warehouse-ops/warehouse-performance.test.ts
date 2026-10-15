/**
 * BR-80 (performance read): GET /v1/warehouses/{id}/performance?from&to returns exact, read-only
 * derivations from existing rows for one warehouse and an inclusive IST date range.
 *
 *  f  the figures are exact counts and sums over the range, for that warehouse only
 *     (orders by status, goods receipts, return requests, stock-ledger movements by type)
 *  g  the response carries NO score, rate, target, ranking or SLA: the key set is pinned
 *  h  the range is two real dates, from <= to, and capped by system_config.report_max_range_days
 *     (fallback 366 when the row is missing), exactly as the reports module does
 *  i  scope: `warehouse.all.view` (Super/Tohfa/Main; a Sub admin is 403); another or unknown warehouse is 404
 *  j  it is a read: nothing is written, no audit row
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { performanceQuery } from './warehouse-performance.schema.js';
import { createWarehousePerformanceService } from './warehouse-performance.service.js';
import { warehousePerformanceRepo } from './warehouse-performance.repo.js';
import { inRolledBackTx, loadWarehouseIds, startHttpHarness, type HttpHarness, type WarehouseIds } from './testkit.js';

const FROM = '2032-05-10';
const TO = '2032-05-12';

// ===========================================================================
// 1. Schema
// ===========================================================================
describe('warehouse performance schema', () => {
  it('BR-80h: needs real from and to dates with from <= to, and is strict', () => {
    expect(performanceQuery.safeParse({ from: FROM, to: TO }).success).toBe(true);
    expect(performanceQuery.safeParse({ from: FROM, to: FROM }).success).toBe(true);
    for (const bad of [
      {},
      { from: FROM },
      { to: TO },
      { from: TO, to: FROM },
      { from: '2032-02-30', to: TO },
      { from: '2032-5-10', to: TO },
      { from: FROM, to: TO, warehouseId: newId() },
      { from: FROM, to: TO, groupBy: 'day' },
    ]) {
      expect(performanceQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ===========================================================================
// 2. Service against real Postgres, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('warehouse performance service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('orders', 'goods_receipts', 'return_requests', 'stock_ledger', 'system_config');
    if (ready) {
      const { pool } = await import('../../db/pool.js');
      wh = await loadWarehouseIds(pool);
    }
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const viewer = (userId: string = newId()) =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'warehouse.all.view', userId });
  const service = (tx: Executor) => createWarehousePerformanceService({ repo: warehousePerformanceRepo, db: tx });

  /**
   * Fixture. IST day = UTC + 5:30, so 2032-05-09T18:29:59Z is still IST 05-09 and 05-12T18:30:00Z is IST 05-13.
   * `session_replication_role = replica` (this transaction only) lets the fixture skip building purchase orders,
   * farmers and batches just to get a goods receipt or a ledger row; the queries under test are plain SELECTs.
   *
   *  Ooty orders:   o1 DELIVERED 05-10 | o2 PICKED_UP 05-10T20:00Z (IST 05-11) | o3 CANCELLED 05-11 | o4 CONFIRMED 05-11
   *                 o5 PICKED_UP IST 05-09 (before) | o6 DELIVERED IST 05-13 (after)
   *  Coonoor order: o7 DELIVERED 05-11 (another warehouse)
   *  Returns:       o1 REFUNDED 05-10 | o4 PENDING 05-11 | o7 (Coonoor) REFUNDED 05-11 | o5 REJECTED IST 05-09 (before)
   *  Receipts:      Ooty 05-10 ACCEPTED gross 10 acc 8 rej 2 | 05-10 ACCEPTED gross 5.5 acc 5.5 | 05-11 REJECTED gross 1 rej 1
   *                 Ooty IST 05-13 (after) | Coonoor 05-10
   *  Ledger (Ooty): RECEIPT +100 and +50.5, SALE -20.25 and -1, ADJUSTMENT -2 (all in range); a RECEIPT before, a SALE
   *                 after and a Coonoor RECEIPT.
   */
  async function seed(tx: Executor): Promise<void> {
    await tx.query(`SET LOCAL session_replication_role = replica`);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const customerId = (
      await tx.query<{ id: string }>(
        `INSERT INTO customers (user_id, customer_code, preferred_warehouse_id) VALUES ($1, $2, $3) RETURNING id`,
        [newId(), `C-PERF-${stamp}`, wh.ooty],
      )
    ).rows[0]!.id;

    const order = async (n: string, warehouse: string, status: string, placedAt: string): Promise<string> =>
      (
        await tx.query<{ id: string }>(
          `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, status, total_amount, placed_at, cancellation_reason)
           VALUES ($1, $2, $3, 'ONLINE', $4::order_status, 10, $5, $6) RETURNING id`,
          [`O-PERF-${n}-${stamp}`, customerId, warehouse, status, placedAt, status === 'CANCELLED' ? 'fixture' : null],
        )
      ).rows[0]!.id;
    const o1 = await order('1', wh.ooty, 'DELIVERED', '2032-05-10T10:00:00Z');
    await order('2', wh.ooty, 'PICKED_UP', '2032-05-10T20:00:00Z');
    await order('3', wh.ooty, 'CANCELLED', '2032-05-11T05:00:00Z');
    const o4 = await order('4', wh.ooty, 'CONFIRMED', '2032-05-11T06:00:00Z');
    const o5 = await order('5', wh.ooty, 'PICKED_UP', '2032-05-09T18:29:59Z');
    await order('6', wh.ooty, 'DELIVERED', '2032-05-12T18:30:00Z');
    const o7 = await order('7', wh.coonoor, 'DELIVERED', '2032-05-11T05:00:00Z');

    const ret = async (orderId: string, status: string, createdAt: string): Promise<void> => {
      await tx.query(
        `INSERT INTO return_requests (order_id, customer_id, status, reason, created_at) VALUES ($1, $2, $3::return_status, 'fixture', $4)`,
        [orderId, customerId, status, createdAt],
      );
    };
    await ret(o1, 'REFUNDED', '2032-05-10T10:00:00Z');
    await ret(o4, 'PENDING', '2032-05-11T06:00:00Z');
    await ret(o7, 'REFUNDED', '2032-05-11T05:00:00Z');
    await ret(o5, 'REJECTED', '2032-05-09T18:29:59Z');

    const grn = async (n: string, warehouse: string, status: string, gross: string, accepted: string, rejected: string, receivedAt: string): Promise<void> => {
      await tx.query(
        `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, status, gross_qty_kg, accepted_qty_kg,
                                     rejected_qty_kg, rejection_reason, received_by, received_at)
         VALUES ($1, $2, $3, $4, $5::grn_status, $6, $7, $8, $9, $10, $11)`,
        [`GRN-PERF-${n}-${stamp}`, newId(), warehouse, newId(), status, gross, accepted, rejected, Number(rejected) > 0 ? 'fixture' : null, newId(), receivedAt],
      );
    };
    await grn('1', wh.ooty, 'ACCEPTED', '10', '8', '2', '2032-05-10T10:00:00Z');
    await grn('2', wh.ooty, 'ACCEPTED', '5.5', '5.5', '0', '2032-05-10T11:00:00Z');
    await grn('3', wh.ooty, 'REJECTED', '1', '0', '1', '2032-05-11T05:00:00Z');
    await grn('4', wh.ooty, 'ACCEPTED', '99', '99', '0', '2032-05-12T18:30:00Z');
    await grn('5', wh.coonoor, 'ACCEPTED', '77', '77', '0', '2032-05-10T10:00:00Z');

    const ledger = async (warehouse: string, type: string, delta: string, at: string): Promise<void> => {
      await tx.query(
        `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, created_at)
         VALUES ($1, $2, $3::stock_movement_type, $4, 1000, $5)`,
        [newId(), warehouse, type, delta, at],
      );
    };
    await ledger(wh.ooty, 'RECEIPT', '100', '2032-05-10T10:00:00Z');
    await ledger(wh.ooty, 'RECEIPT', '50.5', '2032-05-11T10:00:00Z');
    await ledger(wh.ooty, 'SALE', '-20.25', '2032-05-11T11:00:00Z');
    await ledger(wh.ooty, 'SALE', '-1', '2032-05-12T11:00:00Z');
    await ledger(wh.ooty, 'ADJUSTMENT', '-2', '2032-05-12T12:00:00Z');
    await ledger(wh.ooty, 'RECEIPT', '9', '2032-05-09T18:29:59Z');
    await ledger(wh.ooty, 'SALE', '-9', '2032-05-12T18:30:00Z');
    await ledger(wh.coonoor, 'RECEIPT', '500', '2032-05-10T10:00:00Z');
  }

  dbTest('BR-80f: exact counts and sums for the warehouse and the inclusive IST range, nothing from another warehouse or outside the range', async () => {
    await inRolledBackTx(async (tx) => {
      await seed(tx);
      const result = await service(tx).get(viewer(), wh.ooty, { from: FROM, to: TO });
      expect(result).toEqual({
        warehouseId: wh.ooty,
        from: FROM,
        to: TO,
        orders: {
          placed: 4,
          fulfilled: 2,
          cancelled: 1,
          byStatus: [
            { status: 'CANCELLED', count: 1 },
            { status: 'CONFIRMED', count: 1 },
            { status: 'DELIVERED', count: 1 },
            { status: 'PICKED_UP', count: 1 },
          ],
        },
        receiving: {
          goodsReceipts: 3,
          byStatus: [
            { status: 'ACCEPTED', count: 2 },
            { status: 'REJECTED', count: 1 },
          ],
          grossQtyKg: '16.500',
          acceptedQtyKg: '13.500',
          rejectedQtyKg: '3.000',
        },
        returns: {
          requested: 2,
          byStatus: [
            { status: 'PENDING', count: 1 },
            { status: 'REFUNDED', count: 1 },
          ],
        },
        stockMovements: [
          { movementType: 'ADJUSTMENT', entries: 1, qtyKg: '-2.000' },
          { movementType: 'RECEIPT', entries: 2, qtyKg: '150.500' },
          { movementType: 'SALE', entries: 2, qtyKg: '-21.250' },
        ],
      });

      // Coonoor, same range, sees only its own rows.
      const coonoor = await service(tx).get(viewer(), wh.coonoor, { from: FROM, to: TO });
      expect(coonoor.orders).toMatchObject({ placed: 1, fulfilled: 1, cancelled: 0 });
      expect(coonoor.receiving).toMatchObject({ goodsReceipts: 1, grossQtyKg: '77.000' });
      expect(coonoor.returns.requested).toBe(1);
      expect(coonoor.stockMovements).toEqual([{ movementType: 'RECEIPT', entries: 1, qtyKg: '500.000' }]);
    });
  });

  dbTest('BR-80f: the range is inclusive on both IST days and a single day works', async () => {
    await inRolledBackTx(async (tx) => {
      await seed(tx);
      const day = await service(tx).get(viewer(), wh.ooty, { from: '2032-05-11', to: '2032-05-11' });
      // IST 05-11: o2 (UTC 05-10 20:00), o3 and o4.
      expect(day.orders.placed).toBe(3);
      expect(day.orders.byStatus).toEqual([
        { status: 'CANCELLED', count: 1 },
        { status: 'CONFIRMED', count: 1 },
        { status: 'PICKED_UP', count: 1 },
      ]);
      const edge = await service(tx).get(viewer(), wh.ooty, { from: '2032-05-09', to: '2032-05-09' });
      expect(edge.orders.placed).toBe(1);
      expect(edge.returns.requested).toBe(1);
    });
  });

  dbTest('BR-80f: an empty range returns zeros and empty lists, never nulls', async () => {
    await inRolledBackTx(async (tx) => {
      const result = await service(tx).get(viewer(), wh.gudalur, { from: '2032-06-01', to: '2032-06-02' });
      expect(result).toEqual({
        warehouseId: wh.gudalur,
        from: '2032-06-01',
        to: '2032-06-02',
        orders: { placed: 0, fulfilled: 0, cancelled: 0, byStatus: [] },
        receiving: { goodsReceipts: 0, byStatus: [], grossQtyKg: '0.000', acceptedQtyKg: '0.000', rejectedQtyKg: '0.000' },
        returns: { requested: 0, byStatus: [] },
        stockMovements: [],
      });
    });
  });

  dbTest('BR-80g: the response carries only counts, sums and breakdowns: no score, rate, target, ranking or SLA', async () => {
    await inRolledBackTx(async (tx) => {
      await seed(tx);
      const result = await service(tx).get(viewer(), wh.ooty, { from: FROM, to: TO });
      expect(Object.keys(result).sort()).toEqual(['from', 'orders', 'receiving', 'returns', 'stockMovements', 'to', 'warehouseId']);
      expect(Object.keys(result.orders).sort()).toEqual(['byStatus', 'cancelled', 'fulfilled', 'placed']);
      expect(Object.keys(result.receiving).sort()).toEqual(['acceptedQtyKg', 'byStatus', 'goodsReceipts', 'grossQtyKg', 'rejectedQtyKg']);
      expect(Object.keys(result.returns).sort()).toEqual(['byStatus', 'requested']);
      expect(JSON.stringify(result)).not.toMatch(/rate|score|sla|target|rank|percent|turnover/i);
    });
  });

  dbTest('BR-80h: the span cap is system_config.report_max_range_days (the limit itself is allowed), with a 366 fallback when the row is missing', async () => {
    await inRolledBackTx(async (tx) => {
      await tx.query(
        `INSERT INTO system_config (key, value, data_type, description) VALUES ('report_max_range_days', '5'::jsonb, 'number', 'fixture')
         ON CONFLICT (key) DO UPDATE SET value = '5'::jsonb`,
      );
      const svc = service(tx);
      // 05-10 .. 05-15 is a span of 5 days: allowed. 05-16 is 6: refused on query.to.
      await svc.get(viewer(), wh.ooty, { from: '2032-05-10', to: '2032-05-15' });
      const tooWide = await svc.get(viewer(), wh.ooty, { from: '2032-05-10', to: '2032-05-16' }).then(() => null, (e: unknown) => e);
      expect(tooWide).toBeInstanceOf(AppError);
      expect((tooWide as AppError).status).toBe(422);
      expect((tooWide as AppError).code).toBe('VALIDATION_FAILED');
      expect((tooWide as AppError).errors).toEqual({ 'query.to': ['Date range cannot exceed 5 days.'] });

      await tx.query(`DELETE FROM system_config WHERE key = 'report_max_range_days'`);
      await svc.get(viewer(), wh.ooty, { from: '2031-05-10', to: '2032-05-10' }); // 366 days
      const fallback = await svc.get(viewer(), wh.ooty, { from: '2031-05-09', to: '2032-05-10' }).then(() => null, (e: unknown) => e);
      expect((fallback as AppError).status).toBe(422);
    });
  });

  dbTest('BR-80i: another warehouse and an unknown warehouse are the same 404, for a scope that does not cover them', async () => {
    await inRolledBackTx(async (tx) => {
      const svc = service(tx);
      const subOwn = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [wh.ooty], permission: 'warehouse.all.view' });
      const subWide = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [wh.ooty], permission: 'warehouse.all.view' });
      const messages = new Set<string>();
      for (const [scope, id] of [[subOwn, wh.coonoor], [subWide, wh.coonoor], [subOwn, newId()], [viewer(), newId()]] as const) {
        const error = await svc.get(scope, id, { from: FROM, to: TO }).then(() => null, (e: unknown) => e);
        expect((error as AppError).status).toBe(404);
        expect((error as AppError).code).toBe('NOT_FOUND');
        messages.add((error as AppError).message.replace(/[0-9a-f-]{36}/g, '<id>'));
      }
      expect(messages.size).toBe(1);
      expect((await svc.get(subWide, wh.ooty, { from: FROM, to: TO })).warehouseId).toBe(wh.ooty);
    });
  });

  dbTest('BR-80j: reading performance writes nothing: no audit row and no changed table', async () => {
    await inRolledBackTx(async (tx) => {
      await seed(tx);
      const count = async () =>
        (await tx.query<{ n: string }>(
          `SELECT ((SELECT count(*) FROM audit_log) + (SELECT count(*) FROM orders) + (SELECT count(*) FROM stock_ledger)
                 + (SELECT count(*) FROM goods_receipts) + (SELECT count(*) FROM return_requests))::text AS n`,
        )).rows[0]!.n;
      const before = await count();
      await service(tx).get(viewer(), wh.ooty, { from: FROM, to: TO });
      expect(await count()).toBe(before);
    });
  });
});

// ===========================================================================
// 3. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('warehouse performance routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let harness: HttpHarness;

  beforeAll(async () => {
    ready = await requireDatabaseTables('orders', 'warehouses');
    if (ready) harness = await startHttpHarness();
  });

  afterAll(async () => {
    if (ready) await harness.stop();
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const path = (id: string): string => `/v1/warehouses/${id}/performance`;

  dbTest('BR-80i (HTTP): 401 without a token; 403 for FARMER, CUSTOMER, FARMER_ADMIN and every Sub admin (the design gates it on warehouse.all.view)', async () => {
    const url = `${path(harness.warehouse.ooty)}?from=${FROM}&to=${TO}`;
    expect((await request(harness.server).get(url)).status).toBe(401);
    for (const role of ['farmer', 'customer', 'farmerAdmin', 'subOoty', 'subCoonoor'] as const) {
      const res = await request(harness.server).get(url).set('Authorization', harness.auth(role));
      expect(res.status, role).toBe(403);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
  });

  dbTest('BR-80f/h (HTTP): Super, Tohfa and Main read any of the four warehouses; unknown is 404; bad ranges are 422', async () => {
    for (const role of ['superAdmin', 'tohfaAdmin', 'main'] as const) {
      for (const id of Object.values(harness.warehouse)) {
        const res = await request(harness.server).get(path(id)).query({ from: FROM, to: TO }).set('Authorization', harness.auth(role));
        expect(res.status, `${role} ${id}: ${JSON.stringify(res.body)}`).toBe(200);
        expect(res.body).toMatchObject({ warehouseId: id, from: FROM, to: TO });
        expect(Array.isArray(res.body.orders.byStatus)).toBe(true);
      }
    }
    expect((await request(harness.server).get(path(newId())).query({ from: FROM, to: TO }).set('Authorization', harness.auth('main'))).status).toBe(404);
    expect((await request(harness.server).get(path('not-a-uuid')).query({ from: FROM, to: TO }).set('Authorization', harness.auth('main'))).status).toBe(422);
    for (const query of [{}, { from: FROM }, { from: TO, to: FROM }, { from: '2032-02-30', to: TO }, { from: FROM, to: TO, extra: '1' }, { from: '2000-01-01', to: '2032-01-01' }]) {
      const res = await request(harness.server).get(path(harness.warehouse.ooty)).query(query).set('Authorization', harness.auth('main'));
      expect(res.status, JSON.stringify(query)).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
  });

  dbTest('BR-80j (HTTP): performance is read-only: a POST or PATCH on it is not a route', async () => {
    for (const method of ['post', 'patch', 'put', 'delete'] as const) {
      const res = await request(harness.server)[method](path(harness.warehouse.ooty)).set('Authorization', harness.auth('superAdmin')).send({});
      expect([404, 405], method).toContain(res.status);
    }
  });
});
