/**
 * BR-130 (owner request 2026-10-27, "Group D" D5): a stock adjustment names its creator
 * (`createdByName`) and its approver (`approvedByName`), read by LEFT JOIN on `users` in the same
 * query as the row (no per-row lookup). A pending or rejected adjustment has no approver, so its
 * `approvedByName` is null. Scope filters are unchanged.
 *
 * Real SQL inside ONE rolled-back transaction (the approved adjustment's ledger row is append-only
 * and could never be removed if committed).
 */
import { afterAll, beforeAll, expect, it } from 'vitest';
import type pg from 'pg';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { listAdjustmentsQuery } from './stock-adjustments.schema.js';

describeIfDatabase('stock adjustment creator and approver names (PostgreSQL, rolled back) — BR-130', () => {
  let ready = false;
  let client: pg.PoolClient;
  let ootyId = '';
  let coonoorId = '';
  const ids = { batch: '', approved: '', pending: '', rejected: '' };

  beforeAll(async () => {
    ready = await databaseReady('stock_adjustments');
    if (!ready) return;
    const [{ pool }, fx] = await Promise.all([import('../../db/pool.js'), import('../../test/dbFixtures.js')]);
    client = await pool.connect();
    await client.query('BEGIN');
    const wh = await client.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`);
    ootyId = wh.rows.find((w) => w.code === 'WH-OOTY')!.id;
    coonoorId = wh.rows.find((w) => w.code === 'WH-COON')!.id;

    const creator = await fx.insertUser(client, 'ADMIN', 'BR130 Raised By');
    const approver = await fx.insertUser(client, 'ADMIN', 'BR130 Approved By');
    const rejecter = await fx.insertUser(client, 'ADMIN', 'BR130 Rejected By');
    const farmerId = (await fx.insertFarmerWithPlot(client)).farmerId;
    const cropId = await fx.insertCrop(client);
    ids.batch = newId();
    await client.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 100, 0, 'ACTIVE')`,
      [ids.batch, `B-BR130A-${ids.batch.slice(0, 8)}`, ootyId, cropId, farmerId],
    );
    await client.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', 100, 0, 'TEST', 'BR-130 fixture receipt')`,
      [ids.batch, ootyId],
    );

    ids.approved = newId();
    const ledgerRow = await client.query<{ id: string }>(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, ref_id, remarks, created_by)
       VALUES ($1, $2, 'ADJUSTMENT', -3, 0, 'stock_adjustment', $3, 'BR-130 fixture', $4) RETURNING id`,
      [ids.batch, ootyId, ids.approved, approver],
    );
    await client.query(
      `INSERT INTO stock_adjustments (id, batch_id, warehouse_id, adjustment_type, qty_delta, reason, status, created_by, approved_by, approved_at, ledger_entry_id, created_at)
       VALUES ($1, $2, $3, 'DAMAGE', -3, 'BR-130 approved fixture', 'APPROVED', $4, $5, now(), $6, now() - interval '3 minutes')`,
      [ids.approved, ids.batch, ootyId, creator, approver, ledgerRow.rows[0]!.id],
    );
    ids.pending = newId();
    await client.query(
      `INSERT INTO stock_adjustments (id, batch_id, warehouse_id, adjustment_type, qty_delta, reason, status, created_by, created_at)
       VALUES ($1, $2, $3, 'SHRINKAGE', -1, 'BR-130 pending fixture', 'PENDING', $4, now() - interval '2 minutes')`,
      [ids.pending, ids.batch, ootyId, creator],
    );
    ids.rejected = newId();
    await client.query(
      `INSERT INTO stock_adjustments (id, batch_id, warehouse_id, adjustment_type, qty_delta, reason, status, created_by, rejected_by, rejected_at, rejection_reason, created_at)
       VALUES ($1, $2, $3, 'EXPIRY', -1, 'BR-130 rejected fixture', 'REJECTED', $4, $5, now(), 'Recount first', now() - interval '1 minute')`,
      [ids.rejected, ids.batch, ootyId, creator, rejecter],
    );
  }, 60_000);

  afterAll(async () => {
    if (!ready) return;
    await client.query('ROLLBACK');
    client.release();
    const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  it('BR-130a: list rows name the creator; only the approved one names an approver (pending and rejected are null)', async () => {
    if (!ready) return;
    const { stockAdjustmentsRepo } = await import('./stock-adjustments.repo.js');
    const { items, total } = await stockAdjustmentsRepo.list(client, listAdjustmentsQuery.parse({ batchId: ids.batch }), null);
    expect(total).toBe(3);
    const byId = new Map(items.map((a) => [a.id, a]));
    expect(byId.get(ids.approved)).toMatchObject({ status: 'APPROVED', createdByName: 'BR130 Raised By', approvedByName: 'BR130 Approved By' });
    expect(byId.get(ids.pending)).toMatchObject({ status: 'PENDING', createdByName: 'BR130 Raised By', approvedByName: null });
    expect(byId.get(ids.rejected)).toMatchObject({ status: 'REJECTED', createdByName: 'BR130 Raised By', approvedByName: null });
    // The rejecter is never reported as an approver, and the scope filter is unchanged.
    expect(JSON.stringify(items)).not.toContain('BR130 Rejected By');
    const other = await stockAdjustmentsRepo.list(client, listAdjustmentsQuery.parse({ batchId: ids.batch }), [coonoorId]);
    expect(other).toEqual({ items: [], total: 0 });
  });

  it('BR-130a: the detail (and the row-locked read the decisions use) carries the same names as the list row', async () => {
    if (!ready) return;
    const { stockAdjustmentsRepo } = await import('./stock-adjustments.repo.js');
    const { createStockAdjustmentsService } = await import('./stock-adjustments.service.js');
    const { items } = await stockAdjustmentsRepo.list(client, listAdjustmentsQuery.parse({ batchId: ids.batch }), null);
    const service = createStockAdjustmentsService({ repo: stockAdjustmentsRepo, db: client, runTx: async (fn) => fn(client) });
    const sub = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'inventory.stock_adjustment.create', warehouseIds: [ootyId] });
    for (const row of items) {
      expect(await service.get(sub, row.id)).toEqual(row);
      expect(await stockAdjustmentsRepo.lockAdjustment(client, row.id)).toEqual(row);
    }
    const approved = await stockAdjustmentsRepo.findAdjustment(client, ids.approved);
    expect(approved).toMatchObject({ createdByName: 'BR130 Raised By', approvedByName: 'BR130 Approved By' });
  });
});
