/**
 * BR-116: GET /v1/admin/inventory/overview — one read-only aggregate for the admin inventory tab.
 *
 *  a  strict query; pinned response key set; integer counts; three-decimal quantities
 *  b  per-warehouse stock is the BR-100 free shelf of ACTIVE batches
 *  c  near-expiry / low-stock follow system_config; an unusable threshold is null, never a default
 *  d  pending adjustments, RECORDED counts and RECORDED non-zero-variance counts
 *  e  scope: Sub sees only its warehouse (other warehouses' rows excluded), all sees all, other scopes empty
 *  f  BR-107: DISPUTED is never queried for and never reported
 *  g  permission matrix over real HTTP
 *
 * The PostgreSQL sections run in a transaction that is always rolled back. Counts are asserted as
 * DELTAS against a baseline read in the same transaction, so rows other tests left behind cannot
 * move them.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { inRolledBackTx, loadWarehouseIds, startHttpHarness, type HttpHarness, type WarehouseIds } from '../warehouse-ops/testkit.js';
import { inventoryOverviewRepo, type InventoryOverviewRepo } from './inventory-overview.repo.js';
import { inventoryOverviewQuery, inventoryOverviewResponse, type InventoryOverview } from './inventory-overview.schema.js';
import { createInventoryOverviewService } from './inventory-overview.service.js';

const PERMISSION = 'inventory.batch.view';

const OVERVIEW_KEYS = [
  'lowStockCount', 'nearExpiryBatchCount', 'pendingAdjustmentCount', 'thresholds', 'unreconciledVerificationCount',
  'varianceUnreconciledVerificationCount', 'warehouses',
].sort();

/** Any key that could carry a farm, batch or buyer identity (BR-16). */
const FORBIDDEN_KEY = /farm|village|gps|fmb|batchId|batchCode|source|customer|mobile|plot/i;

function keysMatching(pattern: RegExp, value: unknown, path = '$'): string[] {
  if (Array.isArray(value)) return value.flatMap((item, i) => keysMatching(pattern, item, `${path}[${i}]`));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => [
      ...(pattern.test(key) ? [`${path}.${key}`] : []),
      ...keysMatching(pattern, child, `${path}.${key}`),
    ]);
  }
  return [];
}

const allScope = (roleCode: RoleCode = RoleCode.MAIN_WH_ADMIN): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode, permission: PERMISSION });
const subScope = (warehouseId: string): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [warehouseId], permission: PERMISSION });

// ===========================================================================
// 1. Schemas
// ===========================================================================
describe('inventory overview schemas', () => {
  it('BR-116a: the query takes no parameters; an unknown one is rejected (422 at the route)', () => {
    expect(inventoryOverviewQuery.safeParse({}).success).toBe(true);
    for (const bad of [{ warehouseId: newId() }, { status: 'DISPUTED' }, { limit: '5' }]) {
      expect(inventoryOverviewQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-116a / BR-116f: the response schema is strict at every depth; a DISPUTED bucket or a farmer id cannot be added', () => {
    const good: InventoryOverview = {
      warehouses: [{ warehouseId: newId(), name: 'Ooty', availableQtyKg: '12.500' }],
      nearExpiryBatchCount: 1,
      lowStockCount: null,
      pendingAdjustmentCount: 0,
      unreconciledVerificationCount: 2,
      varianceUnreconciledVerificationCount: 2,
      thresholds: { nearExpiryDays: 7, lowStockThresholdKg: null },
    };
    expect(inventoryOverviewResponse.safeParse(good).success).toBe(true);
    expect(inventoryOverviewResponse.safeParse({ ...good, disputedVerificationCount: 0 }).success).toBe(false);
    expect(inventoryOverviewResponse.safeParse({ ...good, warehouses: [{ ...good.warehouses[0], farmerId: newId() }] }).success).toBe(false);
    expect(inventoryOverviewResponse.safeParse({ ...good, pendingAdjustmentCount: 1.5 }).success).toBe(false);
    expect(inventoryOverviewResponse.safeParse({ ...good, thresholds: { ...good.thresholds, extra: 1 } }).success).toBe(false);
  });
});

// ===========================================================================
// 2. Service and repo against fakes (no database)
// ===========================================================================
describe('inventory overview service (fake repo)', () => {
  function fakeRepo(overrides: Partial<InventoryOverviewRepo> = {}): InventoryOverviewRepo & { scopes: ResolvedScope[] } {
    const scopes: ResolvedScope[] = [];
    return {
      scopes,
      getThresholds: async () => ({ expiryDays: 7, capacityPercent: '90', lowStockKg: '50' }),
      warehouseStock: async (_db, scope) => {
        scopes.push(scope);
        return [{ warehouseId: newId(), name: 'Ooty', availableQtyKg: '105.000' }];
      },
      backlogCounts: async (_db, scope) => {
        scopes.push(scope);
        return { pendingAdjustments: 2, recordedVerifications: 2, recordedVerificationsWithVariance: 1 };
      },
      alertConditionCounts: async (_db, scope) => {
        scopes.push(scope);
        return { nearExpiryBatches: 1, lowStockGroups: 3 };
      },
      ...overrides,
    };
  }

  it('BR-116a: the response is exactly the documented key set, and the resolved scope reaches every repo call unchanged', async () => {
    const repo = fakeRepo();
    const scope = subScope(newId());
    const out = await createInventoryOverviewService({ repo, db: {} as Executor }).get(scope);
    expect(Object.keys(out).sort()).toEqual(OVERVIEW_KEYS);
    expect(Object.keys(out.thresholds).sort()).toEqual(['lowStockThresholdKg', 'nearExpiryDays']);
    expect(Object.keys(out.warehouses[0]!).sort()).toEqual(['availableQtyKg', 'name', 'warehouseId']);
    expect(out).toMatchObject({
      nearExpiryBatchCount: 1,
      lowStockCount: 3,
      pendingAdjustmentCount: 2,
      unreconciledVerificationCount: 2,
      varianceUnreconciledVerificationCount: 1,
      thresholds: { nearExpiryDays: 7, lowStockThresholdKg: '50' },
    });
    expect(repo.scopes).toHaveLength(3);
    for (const passed of repo.scopes) expect(passed).toBe(scope);
    expect(keysMatching(FORBIDDEN_KEY, out)).toEqual([]);
  });

  it('BR-116c: an unusable near-expiry or low-stock threshold reports that count as null, never a hard-coded default', async () => {
    const repo = fakeRepo({ getThresholds: async () => ({ expiryDays: null, capacityPercent: null, lowStockKg: null }) });
    const out = await createInventoryOverviewService({ repo, db: {} as Executor }).get(allScope());
    expect(out.nearExpiryBatchCount).toBeNull();
    expect(out.lowStockCount).toBeNull();
    expect(out.thresholds).toEqual({ nearExpiryDays: null, lowStockThresholdKg: null });
    // The threshold-free figures are still reported.
    expect(out.pendingAdjustmentCount).toBe(2);

    const onlyExpiry = fakeRepo({ getThresholds: async () => ({ expiryDays: 3, capacityPercent: null, lowStockKg: null }) });
    const partial = await createInventoryOverviewService({ repo: onlyExpiry, db: {} as Executor }).get(allScope());
    expect(partial.nearExpiryBatchCount).toBe(1);
    expect(partial.lowStockCount).toBeNull();
  });

  it('BR-116f (BR-107): no statement the overview repo issues names DISPUTED, and the counts name RECORDED', async () => {
    const statements: string[] = [];
    const db = {
      query: async (sql: string) => {
        statements.push(sql);
        if (sql.includes('FROM system_config')) return { rows: [{ value: 7 }], rowCount: 1 };
        if (sql.includes('pending_adjustments')) {
          return { rows: [{ pending_adjustments: 0, recorded: 0, recorded_with_variance: 0 }], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      },
    } as unknown as Executor;
    const out = await createInventoryOverviewService({ repo: inventoryOverviewRepo, db }).get(allScope());
    expect(statements.length).toBeGreaterThan(0);
    // A handful of aggregate statements, not one per warehouse or batch.
    expect(statements.length).toBeLessThanOrEqual(6);
    for (const sql of statements) expect(sql).not.toMatch(/DISPUTED/i);
    expect(statements.some((sql) => /v\.status = 'RECORDED'/.test(sql))).toBe(true);
    expect(JSON.stringify(out)).not.toMatch(/DISPUTED/i);
  });
});

// ===========================================================================
// 3. Repo + service against real PostgreSQL, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('inventory overview (PostgreSQL, rolled back)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables(
      'inventory_batches', 'allocations', 'orders', 'order_items', 'stock_adjustments', 'stock_verifications', 'system_config',
    );
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

  const overview = (tx: Executor, scope: ResolvedScope) =>
    createInventoryOverviewService({ repo: inventoryOverviewRepo, db: tx }).get(scope);

  /** The reference seed creates both keys; the test only changes their value (rolled back). */
  async function setConfig(tx: Executor, key: string, value: unknown): Promise<void> {
    const updated = await tx.query(`UPDATE system_config SET value = $2::jsonb WHERE key = $1`, [key, JSON.stringify(value)]);
    expect(updated.rowCount, `system_config.${key} must be seeded`).toBe(1);
  }

  const qty = (o: InventoryOverview, warehouseId: string): number =>
    Number(o.warehouses.find((w) => w.warehouseId === warehouseId)?.availableQtyKg ?? 'NaN');

  /**
   * Fixture. `session_replication_role = replica` (this transaction only) skips the FK and ledger
   * triggers, so a batch can be written with its qty_available directly; the queries under test are
   * plain SELECTs. Crops are fresh uuids so every low-stock group below is new.
   *
   *  Ooty:    b1 ACTIVE 100 kg (crop c1) expiring in 30 days; cart hold 10 kg + pending UPI DIRECT 5 kg -> shelf 85
   *           b2 ACTIVE  20 kg (crop c2) expiring in 3 days  -> near expiry; group 20 < 50 -> low stock
   *           b3 EXPIRED 40 kg (crop c3) past expiry         -> counts nowhere
   *           adjustments: PENDING x2, APPROVED x1, REJECTED x1
   *           counts: RECORDED -2 kg, RECORDED 0 kg, RECONCILED -1 kg, DISPUTED +3 kg (fixture only: no route
   *                   writes DISPUTED, BR-107; it is here to prove the overview never counts it)
   *  Coonoor: b4 ACTIVE  10 kg (crop c4) expiring tomorrow    -> near expiry and low stock
   *           adjustments: PENDING x1; counts: RECORDED +5 kg
   */
  async function seed(tx: Executor): Promise<void> {
    await tx.query(`SET LOCAL session_replication_role = replica`);
    await setConfig(tx, 'alert_batch_expiry_days', 7);
    await setConfig(tx, 'low_stock_threshold_kg', 50);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const user = newId();

    const batch = async (n: string, warehouseId: string, qtyKg: string, status: string, expiresInDays: number): Promise<string> =>
      (
        await tx.query<{ id: string }>(
          `INSERT INTO inventory_batches (batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, expiry_on, status)
           VALUES ($1, $2, $3, 'GRADE_1', $4, $5::numeric, $5::numeric, (now() AT TIME ZONE 'Asia/Kolkata')::date + $6::int, $7)
           RETURNING id`,
          [`BATCH-OV-${n}-${stamp}`, warehouseId, newId(), newId(), qtyKg, expiresInDays, status],
        )
      ).rows[0]!.id;
    const b1 = await batch('1', wh.ooty, '100', 'ACTIVE', 30);
    const b2 = await batch('2', wh.ooty, '20', 'ACTIVE', 3);
    const b3 = await batch('3', wh.ooty, '40', 'EXPIRED', -2);
    const b4 = await batch('4', wh.coonoor, '10', 'ACTIVE', 1);

    // BR-100 claims on b1: a cart hold and a pending UPI counter sale.
    await tx.query(
      `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty, reserved_qty) VALUES ($1, $2, 'ONLINE', 70, 10)`,
      [b1, wh.ooty],
    );
    const sale = await tx.query<{ id: string }>(
      `INSERT INTO orders (order_number, customer_id, walk_in_name, walk_in_mobile, warehouse_id, channel, subtotal, total_amount,
                           payment_method, payment_status, status)
       VALUES ($1, NULL, 'OV Walk-in', '+919800000001', $2, 'DIRECT', 50, 50, 'UPI', 'PENDING', 'PENDING_PAYMENT') RETURNING id`,
      [`OV-${stamp}`, wh.ooty],
    );
    await tx.query(
      `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, line_total, batch_id, status)
       VALUES ($1, $2, 'GRADE_1', 5.000, 10, 50, $3, 'PENDING')`,
      [sale.rows[0]!.id, newId(), b1],
    );

    const adjustment = async (warehouseId: string, batchId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<void> => {
      await tx.query(
        `INSERT INTO stock_adjustments (batch_id, warehouse_id, adjustment_type, qty_delta, reason, status, created_by,
                                        approved_by, approved_at, ledger_entry_id, rejected_by, rejected_at, rejection_reason)
         VALUES ($1, $2, 'DAMAGE', -1, 'fixture', $3, $4,
                 CASE WHEN $3 = 'APPROVED' THEN $5::uuid END, CASE WHEN $3 = 'APPROVED' THEN now() END,
                 CASE WHEN $3 = 'APPROVED' THEN $6::uuid END,
                 CASE WHEN $3 = 'REJECTED' THEN $5::uuid END, CASE WHEN $3 = 'REJECTED' THEN now() END,
                 CASE WHEN $3 = 'REJECTED' THEN 'fixture' END)`,
        [batchId, warehouseId, status, user, newId(), newId()],
      );
    };
    await adjustment(wh.ooty, b1, 'PENDING');
    await adjustment(wh.ooty, b2, 'PENDING');
    await adjustment(wh.ooty, b1, 'APPROVED');
    await adjustment(wh.ooty, b2, 'REJECTED');
    await adjustment(wh.coonoor, b4, 'PENDING');

    const count = async (warehouseId: string, batchId: string, system: string, counted: string, status: string): Promise<void> => {
      await tx.query(
        `INSERT INTO stock_verifications (warehouse_id, batch_id, system_qty, counted_qty, status, verified_by)
         VALUES ($1, $2, $3::numeric, $4::numeric, $5, $6)`,
        [warehouseId, batchId, system, counted, status, user],
      );
    };
    await count(wh.ooty, b1, '100', '98', 'RECORDED');
    await count(wh.ooty, b2, '20', '20', 'RECORDED');
    await count(wh.ooty, b1, '100', '99', 'RECONCILED');
    await count(wh.ooty, b3, '40', '43', 'DISPUTED');
    await count(wh.coonoor, b4, '10', '15', 'RECORDED');
  }

  dbTest('BR-116b / BR-116d (DB): stock is the BR-100 free shelf of ACTIVE batches; the backlog counts PENDING adjustments and RECORDED counts only', async () => {
    await inRolledBackTx(async (tx) => {
      await setConfig(tx, 'alert_batch_expiry_days', 7);
      await setConfig(tx, 'low_stock_threshold_kg', 50);
      const before = await overview(tx, allScope());
      await seed(tx);
      const after = await overview(tx, allScope());

      // 100 - 10 (cart hold) - 5 (pending UPI sale) + 20; the EXPIRED batch's 40 kg does not count.
      expect(qty(after, wh.ooty) - qty(before, wh.ooty)).toBeCloseTo(105, 3);
      expect(qty(after, wh.coonoor) - qty(before, wh.coonoor)).toBeCloseTo(10, 3);
      for (const row of after.warehouses) expect(row.availableQtyKg).toMatch(/^[0-9]+\.[0-9]{3}$/);

      expect(after.pendingAdjustmentCount - before.pendingAdjustmentCount).toBe(3);
      expect(after.unreconciledVerificationCount - before.unreconciledVerificationCount).toBe(3);
      expect(after.varianceUnreconciledVerificationCount - before.varianceUnreconciledVerificationCount).toBe(2);
      expect(after.nearExpiryBatchCount! - before.nearExpiryBatchCount!).toBe(2);
      expect(after.lowStockCount! - before.lowStockCount!).toBe(2);
      expect(Object.keys(after).sort()).toEqual(OVERVIEW_KEYS);
      expect(keysMatching(FORBIDDEN_KEY, after)).toEqual([]);
      expect(JSON.stringify(after)).not.toMatch(/DISPUTED/i);
    });
  });

  dbTest('BR-116b (DB): every live warehouse in an all scope is listed, one with no stock at 0.000', async () => {
    await inRolledBackTx(async (tx) => {
      const out = await overview(tx, allScope(RoleCode.SUPER_ADMIN));
      const ids = out.warehouses.map((w) => w.warehouseId);
      for (const id of [wh.ooty, wh.coonoor, wh.kotagiri, wh.gudalur]) expect(ids).toContain(id);
      expect(new Set(ids).size).toBe(ids.length);
      // A fresh, empty warehouse: listed, at exactly zero.
      const empty = await tx.query<{ id: string }>(
        `INSERT INTO warehouses (code, name, type) VALUES ($1, 'OV Empty', 'SUB') RETURNING id`,
        [`WH-OV-${Date.now()}`],
      );
      const withEmpty = await overview(tx, allScope(RoleCode.SUPER_ADMIN));
      expect(withEmpty.warehouses.find((w) => w.warehouseId === empty.rows[0]!.id)?.availableQtyKg).toBe('0.000');
    });
  });

  dbTest('BR-116c (DB): the near-expiry and low-stock counts follow system_config; an unusable value is null', async () => {
    await inRolledBackTx(async (tx) => {
      await seed(tx);
      await setConfig(tx, 'alert_batch_expiry_days', 7);
      await setConfig(tx, 'low_stock_threshold_kg', 50);
      const wide = await overview(tx, subScope(wh.ooty));
      expect(wide.thresholds).toEqual({ nearExpiryDays: 7, lowStockThresholdKg: '50' });

      // Narrow the horizon to 2 days: Ooty's b2 (3 days out) is no longer near expiry.
      await setConfig(tx, 'alert_batch_expiry_days', 2);
      // Lower the low-stock line to 15 kg: Ooty's 20 kg group is no longer low.
      await setConfig(tx, 'low_stock_threshold_kg', 15);
      const narrow = await overview(tx, subScope(wh.ooty));
      expect(wide.nearExpiryBatchCount! - narrow.nearExpiryBatchCount!).toBe(1);
      expect(wide.lowStockCount! - narrow.lowStockCount!).toBe(1);
      expect(narrow.thresholds).toEqual({ nearExpiryDays: 2, lowStockThresholdKg: '15' });

      await setConfig(tx, 'alert_batch_expiry_days', 'seven');
      await tx.query(`DELETE FROM system_config WHERE key = 'low_stock_threshold_kg'`);
      const unusable = await overview(tx, subScope(wh.ooty));
      expect(unusable.nearExpiryBatchCount).toBeNull();
      expect(unusable.lowStockCount).toBeNull();
      expect(unusable.thresholds).toEqual({ nearExpiryDays: null, lowStockThresholdKg: null });
      expect(unusable.pendingAdjustmentCount).toBe(wide.pendingAdjustmentCount);
    });
  });

  dbTest('BR-116e (DB): a Sub admin sees only its warehouse — another warehouse\'s batches, adjustments and counts are excluded, never a 403', async () => {
    await inRolledBackTx(async (tx) => {
      await setConfig(tx, 'alert_batch_expiry_days', 7);
      await setConfig(tx, 'low_stock_threshold_kg', 50);
      const before = await overview(tx, subScope(wh.ooty));
      await seed(tx);
      const after = await overview(tx, subScope(wh.ooty));

      expect(after.warehouses.map((w) => w.warehouseId)).toEqual([wh.ooty]);
      expect(qty(after, wh.ooty) - qty(before, wh.ooty)).toBeCloseTo(105, 3);
      // Only Ooty's rows: Coonoor's PENDING adjustment, RECORDED +5 count, near-expiry and low-stock batch are not here.
      expect(after.pendingAdjustmentCount - before.pendingAdjustmentCount).toBe(2);
      expect(after.unreconciledVerificationCount - before.unreconciledVerificationCount).toBe(2);
      expect(after.varianceUnreconciledVerificationCount - before.varianceUnreconciledVerificationCount).toBe(1);
      expect(after.nearExpiryBatchCount! - before.nearExpiryBatchCount!).toBe(1);
      expect(after.lowStockCount! - before.lowStockCount!).toBe(1);

      // The Coonoor Sub admin, symmetrically, sees Coonoor's rows only.
      const coonoor = await overview(tx, subScope(wh.coonoor));
      expect(coonoor.warehouses.map((w) => w.warehouseId)).toEqual([wh.coonoor]);
    });
  });

  dbTest('BR-116e (DB): a scope that is not warehouse-shaped (customer, farmer) reads an empty list and zeros', async () => {
    await inRolledBackTx(async (tx) => {
      await seed(tx);
      for (const scope of [
        aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: PERMISSION, customerId: newId() }),
        aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.FARMER, permission: PERMISSION, farmerId: newId() }),
      ]) {
        const out = await overview(tx, scope);
        expect(out.warehouses).toEqual([]);
        expect(out).toMatchObject({
          nearExpiryBatchCount: 0,
          lowStockCount: 0,
          pendingAdjustmentCount: 0,
          unreconciledVerificationCount: 0,
          varianceUnreconciledVerificationCount: 0,
        });
      }
    });
  });

  dbTest('BR-116f (DB): a DISPUTED count is never counted, and no statement against the database names it', async () => {
    await inRolledBackTx(async (tx) => {
      await seed(tx);
      const statements: string[] = [];
      const spy = {
        query: (sql: string, params?: unknown[]) => {
          statements.push(sql);
          return tx.query(sql, params);
        },
      } as unknown as Executor;
      const out = await createInventoryOverviewService({ repo: inventoryOverviewRepo, db: spy }).get(subScope(wh.ooty));
      expect(statements.length).toBeGreaterThan(0);
      for (const sql of statements) expect(sql).not.toMatch(/DISPUTED/i);
      expect(JSON.stringify(out)).not.toMatch(/DISPUTED/i);
      // Ooty holds exactly one DISPUTED (+3 kg) count; if it were counted, these would be 3 and 2.
      const disputed = await tx.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM stock_verifications WHERE warehouse_id = $1 AND status = 'DISPUTED'`,
        [wh.ooty],
      );
      expect(disputed.rows[0]!.n).toBeGreaterThanOrEqual(1);
      const recorded = await tx.query<{ all: number; variance: number }>(
        `SELECT count(*)::int AS all, count(*) FILTER (WHERE variance_qty <> 0)::int AS variance
           FROM stock_verifications WHERE warehouse_id = $1 AND status = 'RECORDED' AND batch_id IS NOT NULL`,
        [wh.ooty],
      );
      expect(out.unreconciledVerificationCount).toBe(recorded.rows[0]!.all);
      expect(out.varianceUnreconciledVerificationCount).toBe(recorded.rows[0]!.variance);
    });
  });

  dbTest('BR-116 (DB): it is a read — nothing is written and no audit row', async () => {
    await inRolledBackTx(async (tx) => {
      const audits = async () => (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log`)).rows[0]!.n;
      const beforeAudit = await audits();
      const statements: string[] = [];
      const spy = { query: (sql: string, params?: unknown[]) => (statements.push(sql), tx.query(sql, params)) } as unknown as Executor;
      await createInventoryOverviewService({ repo: inventoryOverviewRepo, db: spy }).get(allScope());
      for (const sql of statements) expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE)\b/i);
      expect(await audits()).toBe(beforeAudit);
    });
  });
});

// ===========================================================================
// 4. Real HTTP through the app: permission matrix and scope
// ===========================================================================
describeIfDatabase('GET /v1/admin/inventory/overview (HTTP)', () => {
  let harness: HttpHarness | undefined;

  beforeAll(async () => {
    if (await requireDatabaseTables('inventory_batches', 'stock_adjustments', 'stock_verifications', 'system_config')) {
      harness = await startHttpHarness();
    }
  });
  afterAll(async () => {
    await harness?.stop();
  });

  const get = (role: Parameters<HttpHarness['auth']>[0] | null, query: Record<string, string> = {}) => {
    const req = request(harness!.server).get('/v1/admin/inventory/overview').query(query);
    return role === null ? req : req.set('Authorization', harness!.auth(role));
  };

  it('BR-116g (HTTP): 401 without a token; 403 problem+json for Farmer Admin, Farmer and Customer', async (context) => {
    if (harness === undefined) context.skip();
    expect((await get(null)).status).toBe(401);
    for (const role of ['farmerAdmin', 'farmer', 'customer'] as const) {
      const res = await get(role);
      expect(res.status, role).toBe(403);
      expect(res.headers['content-type'], role).toContain('application/problem+json');
    }
  });

  it('BR-116g / BR-116e (HTTP): 200 for Super, TOHFA and Main (every warehouse) and for a Sub admin (its own warehouse only)', async (context) => {
    if (harness === undefined) context.skip();
    const w = harness!.warehouse;
    for (const role of ['superAdmin', 'tohfaAdmin', 'main'] as const) {
      const res = await get(role);
      expect(res.status, role).toBe(200);
      expect(inventoryOverviewResponse.safeParse(res.body).success, role).toBe(true);
      const ids = (res.body as InventoryOverview).warehouses.map((row) => row.warehouseId);
      for (const id of [w.ooty, w.coonoor, w.kotagiri, w.gudalur]) expect(ids, role).toContain(id);
    }
    const sub = await get('subOoty');
    expect(sub.status).toBe(200);
    expect((sub.body as InventoryOverview).warehouses.map((row) => row.warehouseId)).toEqual([w.ooty]);
  });

  it('BR-116a (HTTP): an unknown query parameter is 422 VALIDATION_FAILED', async (context) => {
    if (harness === undefined) context.skip();
    const res = await get('main', { warehouseId: newId() });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});
