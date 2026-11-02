/**
 * BR-130 (owner request 2026-10-27, "Group D" D5): the stock ledger names who recorded each row and,
 * for a row an approved stock adjustment inserted, who approved that adjustment; and one ledger row
 * is readable alone at GET /admin/stock-ledger/{id}.
 *
 *  - `createdByName` is `users.full_name` of the row's `created_by` (exposed as `performedBy`).
 *  - `approvedByName` exists only where an approver is derivable: the adjustment whose
 *    `ledger_entry_id` is this row (BR-37b). Every other row has null.
 *  - The detail uses the list's permission (`inventory.stock_ledger.view_own`) and the list's
 *    `scopedWhere` warehouse filter, so another warehouse's row (Sub admin) and an unknown id are the
 *    same 404 with the same body (BR-30). It is read-only: nothing here writes a ledger row.
 *
 * The SQL runs inside ONE rolled-back transaction (the ledger is append-only, so a committed fixture
 * row could never be removed). The HTTP half therefore covers only what needs no committed ledger
 * row: 401, 403, 422 and the unknown-id 404 through the real router.
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type { InventoryRepo } from './inventory.repo.js';
import { listStockLedgerQuery } from './inventory.schema.js';
import { InventoryService } from './inventory.service.js';

/** The documented item keys (openapi `StockLedgerEntry`), names included. */
const ENTRY_KEYS = [
  'approvedByName', 'balanceAfterKg', 'batchId', 'createdByName', 'id', 'performedAt', 'performedBy', 'qtyDeltaKg',
  'refId', 'refType', 'remarks', 'txnType', 'warehouseId',
].sort();

const allScope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: 'inventory.stock_ledger.view_own' });
const subScope = (warehouseId: string) =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'inventory.stock_ledger.view_own', warehouseIds: [warehouseId] });

// The pool is closed ONCE, after every describe in this file: a describe that closed it would leave
// the next one unable to reach the database.
afterAll(async () => {
  if (process.env['DATABASE_URL'] === undefined) return;
  const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
  await Promise.allSettled([closePool(), closeRedis()]);
});

describe('stock ledger detail service (stub repo) — BR-130', () => {
  it('BR-130c: a row the repo does not return (unknown, or outside the scope) is 404 NOT_FOUND with one detail text, never 403', async () => {
    const seen: string[] = [];
    const repo = {
      async getStockLedgerEntryById(_db: unknown, _scope: unknown, id: string) {
        seen.push(id);
        return null;
      },
    } as unknown as InventoryRepo;
    const service = new InventoryService(repo);
    const unknownId = newId();
    const otherId = newId();
    const a = await service.getStockLedgerEntry(subScope(IDS.warehouseOoty), unknownId).catch((e: unknown) => e);
    const b = await service.getStockLedgerEntry(subScope(IDS.warehouseOoty), otherId).catch((e: unknown) => e);
    expect(seen).toEqual([unknownId, otherId]);
    for (const error of [a, b]) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(404);
      expect((error as AppError).code).toBe('NOT_FOUND');
    }
    expect((a as AppError).message.replace(unknownId, 'X')).toBe((b as AppError).message.replace(otherId, 'X'));
  });
});

describeIfDatabase('stock ledger names and detail (PostgreSQL, rolled back) — BR-130', () => {
  let ready = false;
  let client: pg.PoolClient;
  let ootyId = '';
  let coonoorId = '';
  const ids = { batch: '', receipt: '', anonymous: '', adjustmentRow: '', coonoorRow: '', pendingAdjustment: '' };

  beforeAll(async () => {
    ready = await databaseReady('stock_adjustments');
    if (!ready) return;
    const [{ pool }, fx] = await Promise.all([import('../../db/pool.js'), import('../../test/dbFixtures.js')]);
    client = await pool.connect();
    await client.query('BEGIN');
    const wh = await client.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`);
    ootyId = wh.rows.find((w) => w.code === 'WH-OOTY')!.id;
    coonoorId = wh.rows.find((w) => w.code === 'WH-COON')!.id;

    const recorder = await fx.insertUser(client, 'ADMIN', 'BR130 Ledger Recorder');
    const creator = await fx.insertUser(client, 'ADMIN', 'BR130 Adjustment Creator');
    const approver = await fx.insertUser(client, 'ADMIN', 'BR130 Adjustment Approver');
    const farmerId = (await fx.insertFarmerWithPlot(client)).farmerId;
    const cropId = await fx.insertCrop(client);

    const batch = async (warehouseId: string): Promise<string> => {
      const id = newId();
      await client.query(
        `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status)
         VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 100, 0, 'ACTIVE')`,
        [id, `B-BR130-${id.slice(0, 8)}`, warehouseId, cropId, farmerId],
      );
      return id;
    };
    const ledger = async (batchId: string, warehouseId: string, type: string, qty: string, createdBy: string | null, refType: string | null = null, refId: string | null = null): Promise<string> => {
      const r = await client.query<{ id: string }>(
        `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, ref_id, remarks, created_by)
         VALUES ($1, $2, $3, $4::numeric, 0, $5, $6, 'BR-130 fixture', $7) RETURNING id`,
        [batchId, warehouseId, type, qty, refType, refId, createdBy],
      );
      return r.rows[0]!.id;
    };

    ids.batch = await batch(ootyId);
    ids.receipt = await ledger(ids.batch, ootyId, 'RECEIPT', '100', recorder);
    ids.anonymous = await ledger(ids.batch, ootyId, 'WASTAGE', '-1', null);
    // An approved adjustment and the ADJUSTMENT row its approval inserted (recorded by the approver, BR-37b).
    const adjustmentId = newId();
    ids.adjustmentRow = await ledger(ids.batch, ootyId, 'ADJUSTMENT', '-2', approver, 'stock_adjustment', adjustmentId);
    await client.query(
      `INSERT INTO stock_adjustments (id, batch_id, warehouse_id, adjustment_type, qty_delta, reason, status, created_by, approved_by, approved_at, ledger_entry_id)
       VALUES ($1, $2, $3, 'DAMAGE', -2, 'BR-130 fixture damage', 'APPROVED', $4, $5, now(), $6)`,
      [adjustmentId, ids.batch, ootyId, creator, approver, ids.adjustmentRow],
    );
    // A PENDING adjustment names no ledger row, so nothing in the ledger gains its creator.
    ids.pendingAdjustment = newId();
    await client.query(
      `INSERT INTO stock_adjustments (id, batch_id, warehouse_id, adjustment_type, qty_delta, reason, status, created_by)
       VALUES ($1, $2, $3, 'SHRINKAGE', -1, 'BR-130 fixture pending', 'PENDING', $4)`,
      [ids.pendingAdjustment, ids.batch, ootyId, creator],
    );
    const coonoorBatch = await batch(coonoorId);
    ids.coonoorRow = await ledger(coonoorBatch, coonoorId, 'RECEIPT', '10', recorder);
  }, 60_000);

  afterAll(async () => {
    if (!ready) return;
    await client.query('ROLLBACK');
    client.release();
  });

  it('BR-130b: list rows name the recorder; the row an approved adjustment inserted names its approver; other rows have null names', async (ctx) => {
    if (!ready) return ctx.skip();
    const { inventoryRepo } = await import('./inventory.repo.js');
    const page = await inventoryRepo.listStockLedger(client, allScope, listStockLedgerQuery.parse({ batchId: ids.batch, limit: 10 }));
    const byId = new Map(page.items.map((item) => [item.id, item]));
    expect(page.items).toHaveLength(3);
    for (const item of page.items) expect(Object.keys(item).sort()).toEqual(ENTRY_KEYS);
    expect(byId.get(ids.receipt)).toMatchObject({ createdByName: 'BR130 Ledger Recorder', approvedByName: null });
    expect(byId.get(ids.anonymous)).toMatchObject({ performedBy: null, createdByName: null, approvedByName: null });
    expect(byId.get(ids.adjustmentRow)).toMatchObject({
      txnType: 'ADJUSTMENT',
      createdByName: 'BR130 Adjustment Approver',
      approvedByName: 'BR130 Adjustment Approver',
    });
    // The scope filter is unchanged: a Sub admin of Coonoor sees none of the Ooty rows.
    const sub = await inventoryRepo.listStockLedger(client, subScope(coonoorId), listStockLedgerQuery.parse({ batchId: ids.batch, limit: 10 }));
    expect(sub.items).toEqual([]);
  });

  it('BR-130c: the detail is the list item exactly, for an all-scope caller and for the Sub admin of the row\'s warehouse', async (ctx) => {
    if (!ready) return ctx.skip();
    const { inventoryRepo } = await import('./inventory.repo.js');
    const service = new InventoryService(inventoryRepo);
    const page = await inventoryRepo.listStockLedger(client, allScope, listStockLedgerQuery.parse({ batchId: ids.batch, limit: 10 }));
    for (const item of page.items) {
      expect(await service.getStockLedgerEntry(allScope, item.id, client)).toEqual(item);
      expect(await service.getStockLedgerEntry(subScope(ootyId), item.id, client)).toEqual(item);
    }
    const coonoor = await service.getStockLedgerEntry(subScope(coonoorId), ids.coonoorRow, client);
    expect(coonoor).toMatchObject({ id: ids.coonoorRow, warehouseId: coonoorId, createdByName: 'BR130 Ledger Recorder', approvedByName: null });
  });

  it('BR-130c: another warehouse\'s row (Sub admin) and an unknown id are the same 404 NOT_FOUND, never 403', async (ctx) => {
    if (!ready) return ctx.skip();
    const { inventoryRepo } = await import('./inventory.repo.js');
    const service = new InventoryService(inventoryRepo);
    const unknownId = newId();
    const other = await service.getStockLedgerEntry(subScope(ootyId), ids.coonoorRow, client).catch((e: unknown) => e);
    const unknown = await service.getStockLedgerEntry(subScope(ootyId), unknownId, client).catch((e: unknown) => e);
    for (const error of [other, unknown]) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(404);
      expect((error as AppError).code).toBe('NOT_FOUND');
    }
    expect((other as AppError).message.replace(ids.coonoorRow, 'X')).toBe((unknown as AppError).message.replace(unknownId, 'X'));
    // A restricted scope with nothing to confine to fails closed (Farmer Admin `view`): 404 as well.
    const farmerAdmin = aScope({ level: ScopeLevel.VIEW, roleCode: RoleCode.FARMER_ADMIN, permission: 'inventory.stock_ledger.view_own' });
    const closed = await service.getStockLedgerEntry(farmerAdmin, ids.receipt, client).catch((e: unknown) => e);
    expect((closed as AppError).status).toBe(404);
  });
});

describeIfDatabase('GET /v1/admin/stock-ledger/{id} (real router) — BR-130', () => {
  let ready = false;
  let server: Server;
  const tokens: Record<string, string> = {};

  beforeAll(async () => {
    ready = await databaseReady('stock_ledger');
    if (!ready) return;
    const [{ createApp }, { signAccessToken }] = await Promise.all([import('../../app.js'), import('../../auth/jwt.js')]);
    const sign = (code: RoleCode, extra: { warehouseId?: string } = {}, ids: { farmerId?: string; customerId?: string } = {}): string =>
      signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code, ...extra }], farmerId: ids.farmerId ?? null, customerId: ids.customerId ?? null });
    tokens['super'] = sign(RoleCode.SUPER_ADMIN);
    tokens['farmer'] = sign(RoleCode.FARMER, {}, { farmerId: IDS.farmer });
    tokens['customer'] = sign(RoleCode.CUSTOMER, {}, { customerId: IDS.customer });
    server = createApp().listen(0);
  }, 60_000);

  afterAll(async () => {
    if (!ready) return;
    if (server !== undefined) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const get = (id: string, who?: string) => {
    const req = request(server).get(`/v1/admin/stock-ledger/${id}`);
    return who === undefined ? req : req.set('Authorization', `Bearer ${tokens[who]!}`);
  };

  it('BR-130d: 401 without a token, 403 for a farmer or customer, 422 for a malformed id, 404 problem+json for an unknown id', async (ctx) => {
    if (!ready) return ctx.skip();
    expect((await get(newId())).status).toBe(401);
    expect((await get(newId(), 'farmer')).status).toBe(403);
    expect((await get(newId(), 'customer')).status).toBe(403);
    expect((await get('not-a-uuid', 'super')).status).toBe(422);
    const missing = await get(newId(), 'super');
    expect(missing.status).toBe(404);
    expect(missing.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(missing.body.code).toBe('NOT_FOUND');
    // The ledger detail's own 404 (not an unmatched route), and it names nothing but the id asked for.
    expect(missing.body.detail).toMatch(/stock ledger entry/i);
  });
});
