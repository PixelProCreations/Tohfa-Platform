import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { returnRequestsRepo } from '../returnRequests/returnRequests.repo.js';
import type { ReportsRepo } from './reports.repo.js';
import {
  cashTopupsQuery,
  customersQuery,
  inventoryQuery,
  receivingQuery,
  returnsQuery,
  salesQuery,
} from './reports.schema.js';
import { createReportsService } from './reports.service.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const W1 = '11111111-1111-4111-8111-111111111111';
const W2 = '22222222-2222-4222-8222-222222222222';

function subScope(level: ResolvedScope['level'], warehouseId: string, permission: string): ResolvedScope {
  return aScope({ level, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission });
}

function mainScope(level: ResolvedScope['level'], permission: string): ResolvedScope {
  return aScope({ level, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission });
}

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  const appError = error as AppError;
  expect(appError.code).toBe(code);
  expect(appError.status).toBe(status);
  return appError;
}

/** A repo that returns "nothing there" for every report and counts how often it was asked. */
function createFakeRepo(maxRangeDays = 366): { repo: ReportsRepo; calls: string[] } {
  const calls: string[] = [];
  const repo: ReportsRepo = {
    async getMaxRangeDays() {
      calls.push('getMaxRangeDays');
      return maxRangeDays;
    },
    async sales() {
      calls.push('sales');
      return { count: 0, total: '0.00', byDay: [], byChannel: [], byStatus: [] };
    },
    async receiving() {
      calls.push('receiving');
      return [];
    },
    async inventory() {
      calls.push('inventory');
      return [];
    },
    async returns() {
      calls.push('returns');
      return { byStatus: [], byDay: [], refundedTotal: '0.00' };
    },
    async customers() {
      calls.push('customers');
      return { customersWithOrders: 0, newCustomers: 0, byDay: [] };
    },
    async cashTopups() {
      calls.push('cashTopups');
      return { count: 0, total: '0.00', byDay: [] };
    },
  };
  return { repo, calls };
}

const RANGE = { from: '2031-03-10', to: '2031-03-12' };

// ---------------------------------------------------------------------------
// Unit: request schemas
// ---------------------------------------------------------------------------
describe('Reports request schemas (BR-64e)', () => {
  it.each([
    ['sales', salesQuery],
    ['receiving', receivingQuery],
    ['returns', returnsQuery],
    ['customers', customersQuery],
    ['cash-topups', cashTopupsQuery],
  ] as const)('BR-64e: %s requires from and to as real calendar dates with from <= to', (_name, schema) => {
    expect(schema.safeParse(RANGE).success).toBe(true);
    expect(schema.safeParse({ from: '2031-03-10', to: '2031-03-10' }).success).toBe(true);
    expect(schema.safeParse({ from: '2031-03-12', to: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({ from: '2031-02-30', to: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({ to: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({ from: '2031-03-10' }).success).toBe(false);
    expect(schema.safeParse({ ...RANGE, warehouseId: 'not-a-uuid' }).success).toBe(false);
    expect(schema.safeParse({ ...RANGE, surprise: '1' }).success).toBe(false);
  });

  it('BR-64e: sales accepts only the four order channels as a filter', () => {
    expect(salesQuery.safeParse({ ...RANGE, channel: 'MARKET' }).success).toBe(true);
    expect(salesQuery.safeParse({ ...RANGE, channel: 'EBAY' }).success).toBe(false);
  });

  it('BR-64e: inventory is a snapshot, so from and to are optional there (but still real dates when sent)', () => {
    expect(inventoryQuery.safeParse({}).success).toBe(true);
    expect(inventoryQuery.safeParse({ warehouseId: W1 }).success).toBe(true);
    expect(inventoryQuery.safeParse(RANGE).success).toBe(true);
    expect(inventoryQuery.safeParse({ from: '2031-02-30' }).success).toBe(false);
    expect(inventoryQuery.safeParse({ from: '2031-03-12', to: '2031-03-10' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Unit: service (mocked repo)
// ---------------------------------------------------------------------------
describe('Reports service (mocked repo)', () => {
  it('BR-64a: a Sub admin asking for another warehouse gets 404 NOT_FOUND and no report is read', async () => {
    const { repo, calls } = createFakeRepo();
    const service = createReportsService({ repo, db: {} as Executor });
    const sub = subScope(ScopeLevel.OWN, W1, 'order.list.view_all');

    await expectAppError(service.sales(sub, { ...RANGE, warehouseId: W2 }), 'NOT_FOUND', 404);
    await expectAppError(service.inventory(sub, { warehouseId: W2 }), 'NOT_FOUND', 404);
    expect(calls).toEqual([]);

    // Its own warehouse is fine.
    const own = await service.sales(sub, { ...RANGE, warehouseId: W1 });
    expect(own.warehouseId).toBe(W1);
  });

  it('BR-64a: a Sub admin is confined even where docs/rbac.json grants it `all` (returns, receiving, cash top-ups)', async () => {
    const { repo, calls } = createFakeRepo();
    const service = createReportsService({ repo, db: {} as Executor });

    await expectAppError(
      service.returns(subScope(ScopeLevel.ALL, W1, 'rma.request.process'), { ...RANGE, warehouseId: W2 }),
      'NOT_FOUND',
      404,
    );
    await expectAppError(
      service.receiving(subScope(ScopeLevel.ALL, W1, 'inventory.goods_receipt.record'), { ...RANGE, warehouseId: W2 }),
      'NOT_FOUND',
      404,
    );
    await expectAppError(
      service.cashTopups(subScope(ScopeLevel.ALL, W1, 'wallet.cash_topup.process'), { ...RANGE, warehouseId: W2 }),
      'NOT_FOUND',
      404,
    );
    expect(calls).toEqual([]);
  });

  it('BR-64b: a Main admin may filter by any warehouse id', async () => {
    const { repo } = createFakeRepo();
    const service = createReportsService({ repo, db: {} as Executor });
    const main = mainScope(ScopeLevel.ALL, 'order.list.view_all');
    expect((await service.sales(main, { ...RANGE, warehouseId: W2 })).warehouseId).toBe(W2);
    expect((await service.sales(main, RANGE)).warehouseId).toBeNull();
  });

  it('BR-64e: a span over report_max_range_days is 422 on query.to; the limit itself is allowed', async () => {
    const { repo, calls } = createFakeRepo(30);
    const service = createReportsService({ repo, db: {} as Executor });
    const main = mainScope(ScopeLevel.ALL, 'order.list.view_all');

    // 2031-03-01 .. 2031-03-31 is a span of 30 days.
    await expect(service.sales(main, { from: '2031-03-01', to: '2031-03-31' })).resolves.toBeDefined();
    const error = await expectAppError(
      service.sales(main, { from: '2031-03-01', to: '2031-04-01' }),
      'VALIDATION_FAILED',
      422,
    );
    expect(Object.keys(error.errors ?? {})).toEqual(['query.to']);
    expect(calls.filter((c) => c === 'sales')).toHaveLength(1);
  });

  it('BR-64g: the average order value is computed from the exact sum and count, rounding half a paisa up', async () => {
    const { repo } = createFakeRepo();
    const service = createReportsService({
      repo: { ...repo, sales: async () => ({ count: 3, total: '10.00', byDay: [], byChannel: [], byStatus: [] }) },
      db: {} as Executor,
    });
    const main = mainScope(ScopeLevel.ALL, 'order.list.view_all');
    expect((await service.sales(main, RANGE)).averageOrderValue).toBe('3.33');

    // 0.05 / 2 = 0.025: half a rupee-cent goes up, not to the float answer 0.02.
    const half = createReportsService({
      repo: { ...repo, sales: async () => ({ count: 2, total: '0.05', byDay: [], byChannel: [], byStatus: [] }) },
      db: {} as Executor,
    });
    expect((await half.sales(main, RANGE)).averageOrderValue).toBe('0.03');
  });

  it('BR-64c: no orders means count 0, total 0.00, average 0.00 and empty lists, not invented zero rows', async () => {
    const { repo } = createFakeRepo();
    const service = createReportsService({ repo, db: {} as Executor });
    expect(await service.sales(mainScope(ScopeLevel.ALL, 'order.list.view_all'), RANGE)).toEqual({
      from: RANGE.from,
      to: RANGE.to,
      warehouseId: null,
      count: 0,
      total: '0.00',
      averageOrderValue: '0.00',
      byDay: [],
      byChannel: [],
      byStatus: [],
    });
  });
});

// ---------------------------------------------------------------------------
// HTTP wiring through the real router (no database needed: auth and validation
// run before the service touches the pool)
// ---------------------------------------------------------------------------
describe('Reports HTTP wiring (BR-64h)', () => {
  const app = createApp();
  const paths = ['sales', 'receiving', 'inventory', 'returns', 'customers', 'cash-topups'] as const;
  const query = '?from=2031-03-10&to=2031-03-12';

  const farmer = signAccessToken({
    sub: IDS.userFarmer,
    roles: [{ code: RoleCode.FARMER }],
    farmerId: IDS.farmer,
    customerId: null,
  });
  const sub = signAccessToken({
    sub: IDS.userSubWhAdmin,
    roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }],
    farmerId: null,
    customerId: null,
  });

  it.each(paths)('BR-64h: GET /v1/admin/reports/%s without a token is 401', async (path) => {
    const res = await request(app).get(`/v1/admin/reports/${path}${query}`);
    expect(res.status).toBe(401);
  });

  it.each(paths)('BR-64h: GET /v1/admin/reports/%s with a farmer token is 403', async (path) => {
    const res = await request(app).get(`/v1/admin/reports/${path}${query}`).set('Authorization', `Bearer ${farmer}`);
    expect(res.status).toBe(403);
  });

  it.each(paths)('BR-64h: %s is GET only', async (path) => {
    const res = await request(app)
      .post(`/v1/admin/reports/${path}${query}`)
      .set('Authorization', `Bearer ${sub}`)
      .send({});
    expect(res.status).toBe(404);
  });

  it('BR-64e: an impossible date is 422 through the router', async () => {
    const res = await request(app)
      .get('/v1/admin/reports/sales?from=2031-02-30&to=2031-03-10')
      .set('Authorization', `Bearer ${sub}`);
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('BR-64a: a Sub admin asking for another warehouse is 404 through the router', async () => {
    const res = await request(app)
      .get(`/v1/admin/reports/sales${query}&warehouseId=${W2}`)
      .set('Authorization', `Bearer ${sub}`);
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// PostgreSQL: every query against the real schema
// ---------------------------------------------------------------------------
class RollbackFixture extends Error {}

describeIfDatabase('Reports (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('goods_receipts');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  interface World {
    coon: string;
    kota: string;
    ooty: string;
    guda: string;
    cropA: string;
    cropB: string;
    cropAName: string;
    cropBName: string;
    returns: { r1: string };
  }

  /**
   * One fixed world, in IST days 2031-03-10..12 (a range no real data can occupy):
   *
   *   orders (placed_at UTC -> IST day)            wh    cust channel status     total
   *   o1 2031-03-10T10:00Z -> 03-10                COON  C1   ONLINE  DELIVERED  100.10
   *   o2 2031-03-10T20:00Z -> 03-11 (edge)         COON  C1   ONLINE  CONFIRMED  200.20
   *   o3 2031-03-11T05:00Z -> 03-11                COON  C2   MARKET  DELIVERED    0.05
   *   o4 2031-03-11T05:00Z -> 03-11                KOTA  C3   ONLINE  CANCELLED 1000.00
   *   o5 2031-03-09T18:29:59Z -> 03-09 23:59:59    COON  C1   ONLINE  DELIVERED    5.00  (before the range)
   *   o6 2031-03-12T18:30:00Z -> 03-13 00:00:00    COON  C1   ONLINE  DELIVERED    7.00  (after the range)
   *
   * `session_replication_role = replica` switches off FK and trigger enforcement for
   * this transaction only, so the fixture does not have to build purchase orders,
   * listings and farmers just to get a goods receipt row. The queries under test are
   * plain SELECTs and joins, which replica mode does not change. Everything rolls back.
   */
  async function seedWorld(tx: Executor): Promise<World> {
    await tx.query(`SET LOCAL session_replication_role = replica`);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 100000)}`;

    const wh = await tx.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses`);
    const byCode = new Map(wh.rows.map((r) => [r.code, r.id]));
    const coon = byCode.get('WH-COON')!;
    const kota = byCode.get('WH-KOTA')!;
    const ooty = byCode.get('WH-OOTY')!;
    const guda = byCode.get('WH-GUDA')!;

    const crops = await tx.query<{ id: string; name: string }>(
      `SELECT id, name FROM crop_master ORDER BY slug LIMIT 2`,
    );
    const [cropA, cropB] = [crops.rows[0]!, crops.rows[1]!];

    const customer = async (label: string, preferred: string | null, createdAt: string): Promise<string> => {
      const r = await tx.query<{ id: string }>(
        `INSERT INTO customers (user_id, customer_code, preferred_warehouse_id, created_at)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [newId(), `C-${label}-${stamp}`, preferred, createdAt],
      );
      return r.rows[0]!.id;
    };
    const c1 = await customer('1', coon, '2031-03-10T10:00:00Z');
    const c2 = await customer('2', coon, '2031-03-11T05:00:00Z');
    const c3 = await customer('3', kota, '2031-03-11T05:00:00Z');
    await customer('4', coon, '2031-03-09T10:00:00Z'); // created before the range

    const order = async (
      n: string,
      warehouse: string,
      customerId: string,
      channel: string,
      status: string,
      total: string,
      placedAt: string,
    ): Promise<string> => {
      const cancelReason = status === 'CANCELLED' ? 'fixture' : null;
      const r = await tx.query<{ id: string }>(
        `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, status, total_amount,
                             placed_at, cancellation_reason)
         VALUES ($1, $2, $3, $4, $5::order_status, $6, $7, $8) RETURNING id`,
        [`O-${n}-${stamp}`, customerId, warehouse, channel, status, total, placedAt, cancelReason],
      );
      return r.rows[0]!.id;
    };
    const o1 = await order('1', coon, c1, 'ONLINE', 'DELIVERED', '100.10', '2031-03-10T10:00:00Z');
    const o2 = await order('2', coon, c1, 'ONLINE', 'CONFIRMED', '200.20', '2031-03-10T20:00:00Z');
    const o3 = await order('3', coon, c2, 'MARKET', 'DELIVERED', '0.05', '2031-03-11T05:00:00Z');
    const o4 = await order('4', kota, c3, 'ONLINE', 'CANCELLED', '1000.00', '2031-03-11T05:00:00Z');
    await order('5', coon, c1, 'ONLINE', 'DELIVERED', '5.00', '2031-03-09T18:29:59Z');
    await order('6', coon, c1, 'ONLINE', 'DELIVERED', '7.00', '2031-03-12T18:30:00Z');

    // Returns. Order items give the refund its price: 10.05 x 3.333 + 2.00 x 1.000 = 35.49665 -> 35.50.
    const item = async (orderId: string, price: string): Promise<string> => {
      const r = await tx.query<{ id: string }>(
        `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, line_total)
         VALUES ($1, $2, 'GRADE_1', 5, $3, 0) RETURNING id`,
        [orderId, cropA.id, price],
      );
      return r.rows[0]!.id;
    };
    const ret = async (orderId: string, customerId: string, status: string, createdAt: string): Promise<string> => {
      const r = await tx.query<{ id: string }>(
        `INSERT INTO return_requests (order_id, customer_id, status, reason, created_at)
         VALUES ($1, $2, $3::return_status, 'fixture', $4) RETURNING id`,
        [orderId, customerId, status, createdAt],
      );
      return r.rows[0]!.id;
    };
    const retItem = async (returnId: string, orderItemId: string, accepted: string | null): Promise<void> => {
      await tx.query(
        `INSERT INTO return_request_items (return_request_id, order_item_id, requested_qty, accepted_qty)
         VALUES ($1, $2, 5, $3)`,
        [returnId, orderItemId, accepted],
      );
    };
    const i1a = await item(o1, '10.05');
    const i1b = await item(o1, '2.00');
    const i3 = await item(o3, '4.00');
    const i2 = await item(o2, '9.00');
    const i4 = await item(o4, '10.00');
    const r1 = await ret(o1, c1, 'REFUNDED', '2031-03-10T10:00:00Z');
    await retItem(r1, i1a, '3.333');
    await retItem(r1, i1b, '1.000');
    const r2 = await ret(o3, c2, 'PENDING', '2031-03-11T05:00:00Z');
    await retItem(r2, i3, null);
    const r3 = await ret(o2, c1, 'REJECTED', '2031-03-10T20:00:00Z'); // IST 03-11
    await retItem(r3, i2, '2.000'); // rejected: its accepted qty must NOT be counted as refunded
    const r4 = await ret(o4, c3, 'REFUNDED', '2031-03-11T05:00:00Z');
    await retItem(r4, i4, '2.000');

    // Goods receipts.
    const grn = async (n: string, warehouse: string, status: string, receivedAt: string): Promise<void> => {
      await tx.query(
        `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, status,
                                     gross_qty_kg, received_by, received_at)
         VALUES ($1, $2, $3, $4, $5::grn_status, 10, $6, $7)`,
        [`GRN-${n}-${stamp}`, newId(), warehouse, newId(), status, newId(), receivedAt],
      );
    };
    await grn('1', coon, 'ACCEPTED', '2031-03-10T10:00:00Z');
    await grn('2', coon, 'ACCEPTED', '2031-03-10T11:00:00Z');
    await grn('3', coon, 'REJECTED', '2031-03-10T20:00:00Z'); // IST 03-11
    await grn('4', kota, 'ACCEPTED', '2031-03-11T05:00:00Z');
    await grn('5', coon, 'ACCEPTED', '2031-03-12T18:30:00Z'); // IST 03-13, outside

    // Inventory batches.
    const batch = async (n: string, warehouse: string, crop: string, avail: string, status: string): Promise<void> => {
      await tx.query(
        `INSERT INTO inventory_batches (batch_code, warehouse_id, crop_id, grade, source_farmer_id,
                                        qty_received, qty_available, status)
         VALUES ($1, $2, $3, 'GRADE_1', $4, 100, $5, $6)`,
        [`B-${n}-${stamp}`, warehouse, crop, newId(), avail, status],
      );
    };
    await batch('1', coon, cropA.id, '10.500', 'ACTIVE');
    await batch('2', coon, cropA.id, '4.250', 'ACTIVE');
    await batch('3', coon, cropA.id, '3.000', 'EXPIRED');
    await batch('4', coon, cropA.id, '0.000', 'DEPLETED');
    await batch('5', kota, cropB.id, '1.000', 'ACTIVE');

    // Top-ups.
    const topup = async (
      n: string,
      channel: string,
      status: string,
      amount: string,
      warehouse: string | null,
      createdAt: string,
    ): Promise<void> => {
      const cash = channel === 'CASH';
      await tx.query(
        `INSERT INTO topups (wallet_id, channel, amount, fiscal_cash_tag, warehouse_id, processed_by, status, created_at)
         VALUES ($1, $2::topup_channel, $3, $4, $5, $6, $7, $8)`,
        [newId(), channel, amount, cash ? `FT-${n}-${stamp}` : null, warehouse, cash ? newId() : null, status, createdAt],
      );
    };
    await topup('1', 'CASH', 'SUCCESS', '100.50', coon, '2031-03-10T10:00:00Z');
    await topup('2', 'CASH', 'SUCCESS', '200.25', coon, '2031-03-10T20:00:00Z'); // IST 03-11
    await topup('3', 'CASH', 'PENDING', '999.00', coon, '2031-03-10T10:00:00Z');
    await topup('4', 'UPI', 'SUCCESS', '888.00', coon, '2031-03-10T10:00:00Z');
    await topup('5', 'CASH', 'SUCCESS', '50.00', kota, '2031-03-11T05:00:00Z');
    await topup('6', 'CASH', 'FAILED', '777.00', coon, '2031-03-11T05:00:00Z');

    return {
      coon,
      kota,
      ooty,
      guda,
      cropA: cropA.id,
      cropB: cropB.id,
      cropAName: cropA.name,
      cropBName: cropB.name,
      returns: { r1 },
    };
  }

  async function makeService(tx: Executor) {
    const { reportsRepo } = await import('./reports.repo.js');
    return createReportsService({ repo: reportsRepo, db: tx });
  }

  it('BR-64a: sales for a Sub admin is its own warehouse only, with exact Kolkata-day buckets', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      const sub = subScope(ScopeLevel.OWN, w.coon, 'order.list.view_all');

      // o1+o2+o3: 100.10 + 200.20 + 0.05 = 300.35; 30035 / 3 = 10011.67 paise -> 100.12.
      expect(await service.sales(sub, RANGE)).toEqual({
        from: '2031-03-10',
        to: '2031-03-12',
        warehouseId: null,
        count: 3,
        total: '300.35',
        averageOrderValue: '100.12',
        byDay: [
          { date: '2031-03-10', count: 1, total: '100.10' },
          // o2 was placed at 20:00 UTC = 01:30 IST the next morning (BR-64f).
          { date: '2031-03-11', count: 2, total: '200.25' },
        ],
        byChannel: [
          { channel: 'MARKET', count: 1, total: '0.05' },
          { channel: 'ONLINE', count: 2, total: '300.30' },
        ],
        byStatus: [
          { status: 'CONFIRMED', count: 1 },
          { status: 'DELIVERED', count: 2 },
        ],
      });
    });
  });

  it('BR-64f: the range is inclusive of the whole IST day at both ends (23:59:59 IST in, 00:00:00 IST next day out)', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      const sub = subScope(ScopeLevel.OWN, w.coon, 'order.list.view_all');

      // o5 is 2031-03-09 23:59:59 IST and o6 is 2031-03-13 00:00:00 IST: both outside 10..12.
      expect((await service.sales(sub, RANGE)).count).toBe(3);
      // Widen by one day on each side and they are both in.
      const wide = await service.sales(sub, { from: '2031-03-09', to: '2031-03-13' });
      expect(wide.count).toBe(5);
      expect(wide.byDay.map((d) => d.date)).toEqual(['2031-03-09', '2031-03-10', '2031-03-11', '2031-03-13']);
    });
  });

  it('BR-64b: sales for a Main admin sees all warehouses, and may filter to one', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);

      for (const level of [ScopeLevel.ALL, ScopeLevel.OWN]) {
        const main = mainScope(level, 'order.list.view_all');
        const all = await service.sales(main, RANGE);
        // + o4 (KOTA) 1000.00 -> 1300.35 over 4 orders = 325.0875 -> 325.09
        expect(all.count).toBe(4);
        expect(all.total).toBe('1300.35');
        expect(all.averageOrderValue).toBe('325.09');
        // Statuses come back in lifecycle (enum) order, not alphabetically.
        expect(all.byStatus).toEqual([
          { status: 'CONFIRMED', count: 1 },
          { status: 'DELIVERED', count: 2 },
          { status: 'CANCELLED', count: 1 },
        ]);

        const kotaOnly = await service.sales(main, { ...RANGE, warehouseId: w.kota });
        expect(kotaOnly.warehouseId).toBe(w.kota);
        expect(kotaOnly.count).toBe(1);
        expect(kotaOnly.total).toBe('1000.00');
      }
    });
  });

  it('BR-64a: a Sub admin gets 404 for another warehouse id, and a customer-scoped caller sees nothing', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      const sub = subScope(ScopeLevel.OWN, w.coon, 'order.list.view_all');
      await expectAppError(service.sales(sub, { ...RANGE, warehouseId: w.kota }), 'NOT_FOUND', 404);

      // docs/rbac.json grants CUSTOMER `own` on order.list.view_all; the filter fails closed.
      const customer = aScope({
        level: ScopeLevel.OWN,
        roleCode: RoleCode.CUSTOMER,
        customerId: newId(),
        permission: 'order.list.view_all',
      });
      const empty = await service.sales(customer, RANGE);
      expect(empty.count).toBe(0);
      expect(empty.total).toBe('0.00');
    });
  });

  it('BR-64c: a channel with no orders is absent (not zero), and the channel filter narrows every aggregate', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      const sub = subScope(ScopeLevel.OWN, w.coon, 'order.list.view_all');

      const report = await service.sales(sub, RANGE);
      expect(report.byChannel.map((c) => c.channel)).not.toContain('HORECA');
      expect(report.byChannel.map((c) => c.channel)).not.toContain('B2B');

      const market = await service.sales(sub, { ...RANGE, channel: 'MARKET' });
      expect(market.count).toBe(1);
      expect(market.total).toBe('0.05');
      expect(market.byChannel).toEqual([{ channel: 'MARKET', count: 1, total: '0.05' }]);
      expect(market.byDay).toEqual([{ date: '2031-03-11', count: 1, total: '0.05' }]);

      const none = await service.sales(sub, { ...RANGE, channel: 'B2B' });
      expect(none).toMatchObject({ count: 0, total: '0.00', averageOrderValue: '0.00', byDay: [], byChannel: [], byStatus: [] });
    });
  });

  it('BR-64g: the sales total is an exact decimal sum, never float arithmetic', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      // 0.10 + 0.20 would be 0.30000000000000004 in a double.
      await tx.query(
        `INSERT INTO orders (order_number, customer_id, warehouse_id, total_amount, placed_at)
         VALUES ($1, $2, $3, 0.10, '2031-06-01T05:00:00Z'), ($4, $2, $3, 0.20, '2031-06-01T06:00:00Z')`,
        [`OF-1-${newId()}`, newId(), w.guda, `OF-2-${newId()}`],
      );
      const report = await service.sales(subScope(ScopeLevel.OWN, w.guda, 'order.list.view_all'), {
        from: '2031-06-01',
        to: '2031-06-01',
      });
      expect(report.total).toBe('0.30');
      expect(report.averageOrderValue).toBe('0.15');
    });
  });

  it('BR-64a: receiving counts per status per IST day, for a Sub admin even on an `all` grant', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);

      const sub = subScope(ScopeLevel.ALL, w.coon, 'inventory.goods_receipt.record');
      expect(await service.receiving(sub, RANGE)).toEqual({
        from: '2031-03-10',
        to: '2031-03-12',
        warehouseId: null,
        byDay: [
          { date: '2031-03-10', status: 'ACCEPTED', count: 2 },
          { date: '2031-03-11', status: 'REJECTED', count: 1 },
        ],
      });

      const main = await service.receiving(mainScope(ScopeLevel.ALL, 'inventory.goods_receipt.record'), RANGE);
      expect(main.byDay).toEqual([
        { date: '2031-03-10', status: 'ACCEPTED', count: 2 },
        { date: '2031-03-11', status: 'ACCEPTED', count: 1 },
        { date: '2031-03-11', status: 'REJECTED', count: 1 },
      ]);
    });
  });

  it('BR-64a: the inventory snapshot counts ACTIVE batches only, per crop, as exact decimal strings', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);

      const sub = await service.inventory(subScope(ScopeLevel.OWN, w.coon, 'inventory.batch.view'), {});
      expect(sub.warehouseId).toBeNull();
      expect(sub.from).toBeNull();
      expect(sub.to).toBeNull();
      expect(sub.items).toEqual([
        { cropId: w.cropA, name: w.cropAName, totalQty: '14.750', batchCount: 2 },
      ]);
      await expectAppError(
        service.inventory(subScope(ScopeLevel.OWN, w.coon, 'inventory.batch.view'), { warehouseId: w.kota }),
        'NOT_FOUND',
        404,
      );

      const main = await service.inventory(mainScope(ScopeLevel.ALL, 'inventory.batch.view'), {});
      const a = main.items.find((i) => i.cropId === w.cropA);
      const b = main.items.find((i) => i.cropId === w.cropB);
      expect(a).toEqual({ cropId: w.cropA, name: w.cropAName, totalQty: '14.750', batchCount: 2 });
      expect(b).toEqual({ cropId: w.cropB, name: w.cropBName, totalQty: '1.000', batchCount: 1 });

      const kota = await service.inventory(mainScope(ScopeLevel.ALL, 'inventory.batch.view'), { warehouseId: w.kota });
      expect(kota.items).toEqual([{ cropId: w.cropB, name: w.cropBName, totalQty: '1.000', batchCount: 1 }]);

      // The snapshot does not use from/to: sending them changes nothing and is echoed.
      const withRange = await service.inventory(mainScope(ScopeLevel.ALL, 'inventory.batch.view'), {
        ...RANGE,
        warehouseId: w.kota,
      });
      expect(withRange.items).toEqual(kota.items);
      expect(withRange.from).toBe('2031-03-10');
    });
  });

  it('BR-64a: returns are scoped through the order warehouse, and refunded is only REFUNDED returns', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);

      // COON: r1 REFUNDED 03-10, r2 PENDING 03-11, r3 REJECTED 03-10T20:00Z = IST 03-11.
      const sub = await service.returns(subScope(ScopeLevel.ALL, w.coon, 'rma.request.process'), RANGE);
      expect(sub).toEqual({
        from: '2031-03-10',
        to: '2031-03-12',
        warehouseId: null,
        byStatus: [
          { status: 'PENDING', count: 1 },
          { status: 'REJECTED', count: 1 },
          { status: 'REFUNDED', count: 1 },
        ],
        byDay: [
          { date: '2031-03-10', count: 1 },
          { date: '2031-03-11', count: 2 },
        ],
        refundedTotal: '35.50',
      });

      // r4 (KOTA) adds 2.000 x 10.00 = 20.00.
      const main = await service.returns(mainScope(ScopeLevel.ALL, 'rma.request.process'), RANGE);
      expect(main.refundedTotal).toBe('55.50');
      expect(main.byStatus).toEqual([
        { status: 'PENDING', count: 1 },
        { status: 'REJECTED', count: 1 },
        { status: 'REFUNDED', count: 2 },
      ]);

      await expectAppError(
        service.returns(subScope(ScopeLevel.ALL, w.coon, 'rma.request.process'), { ...RANGE, warehouseId: w.kota }),
        'NOT_FOUND',
        404,
      );
    });
  });

  it('BR-64g: the refunded total matches the amount the returns module itself would refund (same expression)', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      const refund = await returnRequestsRepo.sumAcceptedAmount(tx, w.returns.r1);
      expect(refund).toBe('35.50');
      const report = await service.returns(subScope(ScopeLevel.ALL, w.coon, 'rma.request.process'), RANGE);
      expect(report.refundedTotal).toBe(refund);
    });
  });

  it('BR-64d: customers are counts only, scoped by order warehouse (orders) and preferred warehouse (new)', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);

      // COON in range: o1,o2 (C1) and o3 (C2) -> 2 distinct customers. New in range, preferring COON: C1, C2.
      const sub = await service.customers(subScope(ScopeLevel.OWN, w.coon, 'customer.list.view'), RANGE);
      expect(sub).toEqual({
        from: '2031-03-10',
        to: '2031-03-12',
        warehouseId: null,
        customersWithOrders: 2,
        newCustomers: 2,
        byDay: [
          { date: '2031-03-10', count: 1 },
          // C1 (o2, IST 03-11) and C2 (o3): two distinct customers that day.
          { date: '2031-03-11', count: 2 },
        ],
      });
      // Nothing but numbers and dates may appear in the payload.
      expect(Object.keys(sub).sort()).toEqual(
        ['byDay', 'customersWithOrders', 'from', 'newCustomers', 'to', 'warehouseId'].sort(),
      );
      expect(JSON.stringify(sub)).not.toMatch(/mobile|email|name|address|phone|C-[0-9]-/i);

      const main = await service.customers(mainScope(ScopeLevel.OWN, 'customer.list.view'), RANGE);
      expect(main.customersWithOrders).toBe(3);
      expect(main.newCustomers).toBe(3);

      await expectAppError(
        service.customers(subScope(ScopeLevel.OWN, w.coon, 'customer.list.view'), { ...RANGE, warehouseId: w.kota }),
        'NOT_FOUND',
        404,
      );
    });
  });

  it('BR-64a: cash top-ups count only successful CASH rows, per IST day, scoped by topups.warehouse_id', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);

      const sub = await service.cashTopups(subScope(ScopeLevel.ALL, w.coon, 'wallet.cash_topup.process'), RANGE);
      expect(sub).toEqual({
        from: '2031-03-10',
        to: '2031-03-12',
        warehouseId: null,
        count: 2,
        total: '300.75',
        byDay: [
          { date: '2031-03-10', count: 1, total: '100.50' },
          { date: '2031-03-11', count: 1, total: '200.25' },
        ],
      });

      const main = await service.cashTopups(mainScope(ScopeLevel.ALL, 'wallet.cash_topup.process'), RANGE);
      expect(main.count).toBe(3);
      expect(main.total).toBe('350.75');

      await expectAppError(
        service.cashTopups(subScope(ScopeLevel.ALL, w.coon, 'wallet.cash_topup.process'), { ...RANGE, warehouseId: w.kota }),
        'NOT_FOUND',
        404,
      );
    });
  });

  it('BR-64c: a range with no rows is empty lists and 0 / 0.00, for every report', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      const quiet = { from: '2031-09-01', to: '2031-09-02' };
      const sub = (permission: string) => subScope(ScopeLevel.ALL, w.coon, permission);

      expect((await service.receiving(sub('inventory.goods_receipt.record'), quiet)).byDay).toEqual([]);
      expect(await service.returns(sub('rma.request.process'), quiet)).toMatchObject({
        byStatus: [],
        byDay: [],
        refundedTotal: '0.00',
      });
      expect(await service.customers(sub('customer.list.view'), quiet)).toMatchObject({
        customersWithOrders: 0,
        newCustomers: 0,
        byDay: [],
      });
      expect(await service.cashTopups(sub('wallet.cash_topup.process'), quiet)).toMatchObject({
        count: 0,
        total: '0.00',
        byDay: [],
      });
    });
  });

  it('BR-64e: the span cap is read from system_config report_max_range_days, falling back to 366 when the row is missing', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      const sub = subScope(ScopeLevel.OWN, w.coon, 'order.list.view_all');

      // No row seeded: fallback 366. 2031-01-01 .. 2032-01-02 is 366 days; one more is 367.
      await tx.query(`DELETE FROM system_config WHERE key = 'report_max_range_days'`);
      await expect(service.sales(sub, { from: '2031-01-01', to: '2032-01-02' })).resolves.toBeDefined();
      await expectAppError(service.sales(sub, { from: '2031-01-01', to: '2032-01-03' }), 'VALIDATION_FAILED', 422);

      await tx.query(
        `INSERT INTO system_config (key, value, data_type, description)
         VALUES ('report_max_range_days', '7'::jsonb, 'number', 'fixture')`,
      );
      await expect(service.sales(sub, { from: '2031-03-10', to: '2031-03-17' })).resolves.toBeDefined();
      await expectAppError(service.sales(sub, { from: '2031-03-10', to: '2031-03-18' }), 'VALIDATION_FAILED', 422);

      // A value that is not a non-negative integer falls back too.
      await tx.query(`UPDATE system_config SET value = '"abc"'::jsonb WHERE key = 'report_max_range_days'`);
      await expect(service.sales(sub, { from: '2031-01-01', to: '2032-01-02' })).resolves.toBeDefined();
    });
  });

  it('BR-64h: reports never write: running every report leaves every source table unchanged', async () => {
    if (!ready) return;
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const service = await makeService(tx);
      const tables = ['orders', 'goods_receipts', 'inventory_batches', 'return_requests', 'customers', 'topups'];
      const snapshot = async (): Promise<string[]> => {
        const out: string[] = [];
        for (const t of tables) {
          const r = await tx.query<{ h: string }>(`SELECT md5(string_agg(x::text, ',' ORDER BY x::text)) AS h FROM ${t} x`);
          out.push(r.rows[0]!.h);
        }
        return out;
      };
      const before = await snapshot();
      const main = (permission: string) => mainScope(ScopeLevel.ALL, permission);
      await service.sales(main('order.list.view_all'), RANGE);
      await service.receiving(main('inventory.goods_receipt.record'), RANGE);
      await service.inventory(main('inventory.batch.view'), {});
      await service.returns(main('rma.request.process'), RANGE);
      await service.customers(main('customer.list.view'), RANGE);
      await service.cashTopups(main('wallet.cash_topup.process'), RANGE);
      expect(await snapshot()).toEqual(before);
      expect(w.coon).toBeDefined();
    });
  });
});
