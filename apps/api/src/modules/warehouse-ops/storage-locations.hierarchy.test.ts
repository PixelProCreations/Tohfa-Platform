/**
 * BR-125: storage locations form a per-warehouse tree; a batch is linked to the location it was
 * placed in at quality check; usage figures are read from the linked batches.
 *
 *  a  schemas: parentId optional on create, nullable on update
 *  b  a child gets its parent's level + 1; a foreign, unknown or inactive parent is 422
 *  c  no cycle (service 422, database trigger backstop)
 *  d  the depth limit comes from system_config, also for a moved subtree
 *  e  usedKg / batchCount (direct and subtree) from ACTIVE non-empty LINKED batches only
 *  f  deactivation refused (409) while in use; reactivation refused under an inactive parent
 *  g  the quality check links the batch through storageLocationId (BR-106 path unchanged otherwise)
 *  h  the audit images carry parentId
 *
 * Schema tests need no database; the rest run on real PostgreSQL in a rolled-back transaction.
 */
import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { insertCrop, insertFarmerWithPlot, insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { inGoodsReceiptWorld } from '../../test/goodsReceiptWorld.js';
import { qcParameters, qualityCheckCreateBody } from '../goods-receipts/goods-receipts.schema.js';
import { createStorageLocationBody, updateStorageLocationBody } from './storage-locations.schema.js';
import { createStorageLocationsService } from './storage-locations.service.js';
import { storageLocationsRepo } from './storage-locations.repo.js';
import { inRolledBackTx, loadWarehouseIds, type WarehouseIds } from './testkit.js';

describe('BR-125a: storage location hierarchy schemas', () => {
  it('BR-125a: parentId is an optional UUID on create and a nullable optional UUID on update', () => {
    const parentId = newId();
    expect(createStorageLocationBody.parse({ code: 'R-1', name: 'Rack 1', parentId })).toMatchObject({ parentId });
    expect(createStorageLocationBody.safeParse({ code: 'R-1', name: 'Rack 1' }).success).toBe(true);
    expect(createStorageLocationBody.safeParse({ code: 'R-1', name: 'Rack 1', parentId: 'not-a-uuid' }).success).toBe(false);
    expect(updateStorageLocationBody.parse({ parentId })).toEqual({ parentId });
    expect(updateStorageLocationBody.parse({ parentId: null })).toEqual({ parentId: null });
    expect(updateStorageLocationBody.safeParse({ parentId: 'x' }).success).toBe(false);
    expect(updateStorageLocationBody.safeParse({}).success).toBe(false);
  });

  it('BR-125g: the quality check body accepts an optional storageLocationId UUID', () => {
    const base = {
      assignedGrade: 'GRADE_1',
      outcome: 'ACCEPTED',
      acceptedQtyKg: '100.000',
      items: qcParameters.map((parameter) => ({ parameter, score: 8, passed: true })),
    };
    const id = newId();
    expect(qualityCheckCreateBody.parse({ ...base, storageLocationId: id }).storageLocationId).toBe(id);
    expect(qualityCheckCreateBody.safeParse({ ...base, storageLocationId: 'nope' }).success).toBe(false);
  });
});

async function failure(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error, 'expected the call to fail').toBeInstanceOf(AppError);
  return error as AppError;
}

describeIfDatabase('BR-125: storage location tree and usage (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('storage_locations', 'warehouses', 'inventory_batches', 'stock_ledger');
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

  const manage = (userId: string) =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'warehouse.storage_location.manage', userId });
  const service = (tx: Executor) => createStorageLocationsService({ repo: storageLocationsRepo, db: tx, runTx: async (fn) => fn(tx) });

  async function count(tx: Executor, warehouseId: string): Promise<string> {
    return (await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM storage_locations WHERE warehouse_id = $1`, [warehouseId])).rows[0]!.n;
  }

  /** An ACTIVE batch in `warehouseId`, filled through a RECEIPT ledger row, linked to `locationId`. */
  async function placedBatch(tx: Executor, warehouseId: string, locationId: string | null, qty: string, text: string | null = null): Promise<string> {
    const farmer = await insertFarmerWithPlot(tx);
    const cropId = await insertCrop(tx);
    const id = newId();
    await tx.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, cost_per_kg, status, storage_location_id, storage_location)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, $6::numeric, 10, 'ACTIVE', $7, $8)`,
      [id, `B-CI-SL-${id.slice(0, 8)}`, warehouseId, cropId, farmer.farmerId, qty, locationId, text],
    );
    await tx.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', $3::numeric, 0, 'TEST', 'fixture receipt')`,
      [id, warehouseId, qty],
    );
    return id;
  }

  dbTest('BR-125b: a child gets its parent level + 1; a parent of another warehouse, an unknown and an inactive parent are 422 on body.parentId and write nothing', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await insertUser(tx, 'ADMIN', 'CI tree admin');
      const svc = service(tx);
      const room = await svc.create(manage(userId), wh.ooty, { code: 'T-ROOM', name: 'Cold room' });
      const rack = await svc.create(manage(userId), wh.ooty, { code: 'T-RACK', name: 'Rack', parentId: room.id });
      const shelf = await svc.create(manage(userId), wh.ooty, { code: 'T-SHELF', name: 'Shelf', parentId: rack.id });
      expect([room.level, rack.level, shelf.level]).toEqual([0, 1, 2]);
      expect([room.parentId, rack.parentId, shelf.parentId]).toEqual([null, room.id, rack.id]);
      expect((await svc.get(manage(userId), wh.ooty, shelf.id)).level).toBe(2);

      const foreign = await svc.create(manage(userId), wh.coonoor, { code: 'T-FOREIGN', name: 'Other warehouse' });
      const inactive = await svc.create(manage(userId), wh.ooty, { code: 'T-OFF', name: 'Off' });
      await svc.update(manage(userId), wh.ooty, inactive.id, { isActive: false });
      const before = await count(tx, wh.ooty);
      const messages = new Set<string>();
      for (const parentId of [foreign.id, newId()]) {
        const e = await failure(svc.create(manage(userId), wh.ooty, { code: `T-BAD-${parentId.slice(0, 4)}`, name: 'x', parentId }));
        expect(e.status).toBe(422);
        expect(e.code).toBe('VALIDATION_FAILED');
        expect(e.errors).toHaveProperty(['body.parentId']);
        messages.add(JSON.stringify(e.errors));
      }
      // Another warehouse's location and an unknown id are indistinguishable (BR-30).
      expect(messages.size).toBe(1);
      const off = await failure(svc.create(manage(userId), wh.ooty, { code: 'T-UNDER-OFF', name: 'x', parentId: inactive.id }));
      expect(off.status).toBe(422);
      expect(off.errors).toHaveProperty(['body.parentId']);
      expect(await count(tx, wh.ooty)).toBe(before);

      // Re-parenting and making a root again through PATCH.
      const moved = await svc.update(manage(userId), wh.ooty, shelf.id, { parentId: room.id });
      expect(moved).toMatchObject({ parentId: room.id, level: 1 });
      const root = await svc.update(manage(userId), wh.ooty, shelf.id, { parentId: null });
      expect(root).toMatchObject({ parentId: null, level: 0 });
    });
  });

  dbTest('BR-125c: a location cannot be its own parent or sit under its own descendant (422), and the database refuses a cycle written directly', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await insertUser(tx, 'ADMIN', 'CI tree admin');
      const svc = service(tx);
      const a = await svc.create(manage(userId), wh.ooty, { code: 'C-A', name: 'A' });
      const b = await svc.create(manage(userId), wh.ooty, { code: 'C-B', name: 'B', parentId: a.id });
      const c = await svc.create(manage(userId), wh.ooty, { code: 'C-C', name: 'C', parentId: b.id });
      for (const parentId of [a.id, c.id, b.id]) {
        const e = await failure(svc.update(manage(userId), wh.ooty, a.id, { parentId }));
        expect(e.status, parentId).toBe(422);
        expect(e.errors).toHaveProperty(['body.parentId']);
      }
      expect((await svc.get(manage(userId), wh.ooty, a.id)).parentId).toBeNull();

      await tx.query('SAVEPOINT cyc');
      const raw = await tx.query(`UPDATE storage_locations SET parent_id = $2 WHERE id = $1`, [a.id, c.id]).then(() => null, (e: unknown) => e);
      await tx.query('ROLLBACK TO SAVEPOINT cyc');
      expect((raw as { code?: string; hint?: string }).code).toBe('23514');
      expect((raw as { hint?: string }).hint).toBe('code: STORAGE_LOCATION_CYCLE');

      // The composite foreign key refuses a parent of another warehouse even when written directly.
      const foreign = await svc.create(manage(userId), wh.coonoor, { code: 'C-F', name: 'F' });
      await tx.query('SAVEPOINT fk');
      const cross = await tx.query(`UPDATE storage_locations SET parent_id = $2 WHERE id = $1`, [a.id, foreign.id]).then(() => null, (e: unknown) => e);
      await tx.query('ROLLBACK TO SAVEPOINT fk');
      expect((cross as { code?: string }).code).toBe('23503');
    });
  });

  dbTest('BR-125d: the depth limit is system_config.storage_location_max_depth, checked for a new child and for a moved subtree', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await insertUser(tx, 'ADMIN', 'CI tree admin');
      const svc = service(tx);
      await tx.query(`UPDATE system_config SET value = '3'::jsonb WHERE key = 'storage_location_max_depth'`);
      const l0 = await svc.create(manage(userId), wh.kotagiri, { code: 'D-0', name: 'L0' });
      const l1 = await svc.create(manage(userId), wh.kotagiri, { code: 'D-1', name: 'L1', parentId: l0.id });
      const l2 = await svc.create(manage(userId), wh.kotagiri, { code: 'D-2', name: 'L2', parentId: l1.id });
      expect(l2.level).toBe(2);
      const tooDeep = await failure(svc.create(manage(userId), wh.kotagiri, { code: 'D-3', name: 'L3', parentId: l2.id }));
      expect(tooDeep.status).toBe(422);
      expect(tooDeep.errors).toHaveProperty(['body.parentId']);

      // A two-level subtree (x -> y) moved under l1 would put y at level 3: refused.
      const x = await svc.create(manage(userId), wh.kotagiri, { code: 'D-X', name: 'X' });
      await svc.create(manage(userId), wh.kotagiri, { code: 'D-Y', name: 'Y', parentId: x.id });
      const subtree = await failure(svc.update(manage(userId), wh.kotagiri, x.id, { parentId: l1.id }));
      expect(subtree.status).toBe(422);
      // Under l0 the deepest node lands on level 2: allowed.
      expect((await svc.update(manage(userId), wh.kotagiri, x.id, { parentId: l0.id })).level).toBe(1);

      // Raising the figure takes effect at once.
      await tx.query(`UPDATE system_config SET value = '4'::jsonb WHERE key = 'storage_location_max_depth'`);
      expect((await svc.create(manage(userId), wh.kotagiri, { code: 'D-3', name: 'L3', parentId: l2.id })).level).toBe(3);
    });
  });

  dbTest('BR-125e: usedKg and batchCount count ACTIVE non-empty LINKED batches only, and the subtree figures roll descendants up', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await insertUser(tx, 'ADMIN', 'CI tree admin');
      const svc = service(tx);
      const room = await svc.create(manage(userId), wh.gudalur, { code: 'U-ROOM', name: 'Room' });
      const rack = await svc.create(manage(userId), wh.gudalur, { code: 'U-RACK', name: 'Rack', parentId: room.id });
      const empty = await svc.create(manage(userId), wh.gudalur, { code: 'U-EMPTY', name: 'Empty' });
      expect(empty).toMatchObject({ usedKg: '0.000', batchCount: 0, subtreeUsedKg: '0.000', subtreeBatchCount: 0 });

      await placedBatch(tx, wh.gudalur, room.id, '10.5');
      await placedBatch(tx, wh.gudalur, rack.id, '2.250');
      await placedBatch(tx, wh.gudalur, rack.id, '1');
      // Not counted: a batch with only the free text, and a depleted batch.
      await placedBatch(tx, wh.gudalur, null, '99', 'Room');
      const depleted = await placedBatch(tx, wh.gudalur, rack.id, '5');
      await tx.query(
        `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
         VALUES ($1, $2, 'WASTAGE', -5, 0, 'TEST', 'empty it')`,
        [depleted, wh.gudalur],
      );

      const list = await svc.list(manage(userId), wh.gudalur, { page: 1, pageSize: 100, q: 'U-' });
      const byCode = new Map(list.items.map((l) => [l.code, l]));
      expect(byCode.get('U-ROOM')).toMatchObject({ level: 0, usedKg: '10.500', batchCount: 1, subtreeUsedKg: '13.750', subtreeBatchCount: 3 });
      expect(byCode.get('U-RACK')).toMatchObject({ level: 1, usedKg: '3.250', batchCount: 2, subtreeUsedKg: '3.250', subtreeBatchCount: 2 });
      expect(byCode.get('U-EMPTY')).toMatchObject({ usedKg: '0.000', batchCount: 0 });
      // The detail agrees with the list.
      expect(await svc.get(manage(userId), wh.gudalur, room.id)).toEqual(byCode.get('U-ROOM'));
    });
  });

  dbTest('BR-125f: deactivating a location with an active child or a placed batch is 409 CONFLICT and writes nothing; reactivating under an inactive parent is 409', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await insertUser(tx, 'ADMIN', 'CI tree admin');
      const svc = service(tx);
      const room = await svc.create(manage(userId), wh.ooty, { code: 'F-ROOM', name: 'Room' });
      const rack = await svc.create(manage(userId), wh.ooty, { code: 'F-RACK', name: 'Rack', parentId: room.id });

      const withChild = await failure(svc.update(manage(userId), wh.ooty, room.id, { isActive: false }));
      expect(withChild.status).toBe(409);
      expect(withChild.code).toBe('CONFLICT');
      expect(withChild.meta).toMatchObject({ activeChildCount: 1, batchCount: 0 });

      const batch = await placedBatch(tx, wh.ooty, rack.id, '4');
      const withBatch = await failure(svc.update(manage(userId), wh.ooty, rack.id, { isActive: false }));
      expect(withBatch.status).toBe(409);
      expect(withBatch.meta).toMatchObject({ activeChildCount: 0, batchCount: 1 });
      expect((await svc.get(manage(userId), wh.ooty, rack.id)).isActive).toBe(true);
      const audits = await tx.query(`SELECT 1 FROM audit_log WHERE entity_id = $1 AND action_code = 'warehouse.storage_location.update'`, [rack.id]);
      expect(audits.rowCount).toBe(0);

      // Once the batch is empty the rack can be switched off, then the room.
      await tx.query(
        `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
         VALUES ($1, $2, 'WASTAGE', -4, 0, 'TEST', 'empty it')`,
        [batch, wh.ooty],
      );
      expect((await svc.update(manage(userId), wh.ooty, rack.id, { isActive: false })).isActive).toBe(false);
      expect((await svc.update(manage(userId), wh.ooty, room.id, { isActive: false })).isActive).toBe(false);

      const under = await failure(svc.update(manage(userId), wh.ooty, rack.id, { isActive: true }));
      expect(under.status).toBe(409);
      expect(under.code).toBe('CONFLICT');
      expect((await svc.update(manage(userId), wh.ooty, room.id, { isActive: true })).isActive).toBe(true);
      expect((await svc.update(manage(userId), wh.ooty, rack.id, { isActive: true })).isActive).toBe(true);
    });
  });

  dbTest('BR-125h: the create and update audit images carry parentId and changedFields names it', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await insertUser(tx, 'ADMIN', 'CI tree admin');
      const svc = service(tx);
      const room = await svc.create(manage(userId), wh.ooty, { code: 'H-ROOM', name: 'Room' });
      const rack = await svc.create(manage(userId), wh.ooty, { code: 'H-RACK', name: 'Rack', parentId: room.id });
      await svc.update(manage(userId), wh.ooty, rack.id, { parentId: null });
      const rows = await tx.query<{ action_code: string; before: Record<string, unknown> | null; after: Record<string, unknown>; changed_fields: string[] | null }>(
        `SELECT action_code, before, after, changed_fields FROM audit_log WHERE entity_id = $1 ORDER BY action_code`,
        [rack.id],
      );
      expect(rows.rows.map((r) => r.action_code)).toEqual(['warehouse.storage_location.create', 'warehouse.storage_location.update']);
      expect(rows.rows[0]!.after).toMatchObject({ parentId: room.id });
      expect(rows.rows[1]!.before).toMatchObject({ parentId: room.id });
      expect(rows.rows[1]!.after).toMatchObject({ parentId: null });
      expect(rows.rows[1]!.changed_fields).toEqual(['parentId']);
    });
  });
});

describeIfDatabase('BR-125g: the quality check links the batch to a storage location (PostgreSQL)', () => {
  const fiveItems = () => qcParameters.map((parameter) => ({ parameter, score: 8, passed: true }));
  const qc = (overrides: Record<string, unknown> = {}) =>
    qualityCheckCreateBody.parse({ assignedGrade: 'GRADE_1', outcome: 'ACCEPTED', acceptedQtyKg: '100.000', items: fiveItems(), ...overrides });

  const dbIt = (name: string, fn: Parameters<typeof inGoodsReceiptWorld>[0]) =>
    it(name, async (ctx) => {
      if (!(await requireDatabaseTables('storage_locations', 'goods_receipts', 'quality_checks', 'inventory_batches'))) return ctx.skip();
      await inGoodsReceiptWorld(fn);
    });

  async function location(tx: Executor, warehouseId: string, code: string, isActive = true): Promise<string> {
    const res = await tx.query<{ id: string }>(
      `INSERT INTO storage_locations (warehouse_id, code, name, is_active) VALUES ($1, $2, $3, $4) RETURNING id`,
      [warehouseId, code, `Location ${code}`, isActive],
    );
    return res.rows[0]!.id;
  }

  dbIt('BR-125g: storageLocationId links the batch and, without text, copies the location code as the label', async (w) => {
    const loc = await location(w.tx, w.ooty, 'QC-LINK-1');
    const lot = await w.lot();
    const result = await w.goodsReceipts.recordQualityCheck(w.admin, w.scope('inventory.quality_check.perform'), lot.goodsReceiptId, qc({ storageLocationId: loc }), randomUUID());
    expect(result.batch).toMatchObject({ storageLocationId: loc, storageLocation: 'QC-LINK-1' });
    const row = await w.tx.query<{ storage_location_id: string; storage_location: string }>(
      `SELECT storage_location_id, storage_location FROM inventory_batches WHERE goods_receipt_id = $1`,
      [lot.goodsReceiptId],
    );
    expect(row.rows[0]).toEqual({ storage_location_id: loc, storage_location: 'QC-LINK-1' });
    const check = await w.tx.query<{ storage_location_id: string }>(`SELECT storage_location_id FROM quality_checks WHERE goods_receipt_id = $1`, [lot.goodsReceiptId]);
    expect(check.rows[0]!.storage_location_id).toBe(loc);
  });

  dbIt('BR-125g: with both the id and a text label both are kept as given; text only links nothing', async (w) => {
    const loc = await location(w.tx, w.ooty, 'QC-LINK-2');
    const both = await w.lot();
    const r1 = await w.goodsReceipts.recordQualityCheck(w.admin, w.scope('inventory.quality_check.perform'), both.goodsReceiptId, qc({ storageLocationId: loc, storageLocation: 'Bin 4' }), randomUUID());
    expect(r1.batch).toMatchObject({ storageLocationId: loc, storageLocation: 'Bin 4' });
    const textOnly = await w.lot();
    const r2 = await w.goodsReceipts.recordQualityCheck(w.admin, w.scope('inventory.quality_check.perform'), textOnly.goodsReceiptId, qc({ storageLocation: 'QC-LINK-2' }), randomUUID());
    expect(r2.batch).toMatchObject({ storageLocationId: null, storageLocation: 'QC-LINK-2' });
  });

  dbIt('BR-125g: a location of another warehouse, an unknown and an inactive location are 422 on body.storageLocationId and nothing is written', async (w) => {
    const foreign = await location(w.tx, w.coonoor, 'QC-FOREIGN');
    const inactive = await location(w.tx, w.ooty, 'QC-OFF', false);
    for (const storageLocationId of [foreign, newId(), inactive]) {
      const lot = await w.lot();
      const e = await failure(w.goodsReceipts.recordQualityCheck(w.admin, w.scope('inventory.quality_check.perform'), lot.goodsReceiptId, qc({ storageLocationId }), randomUUID()));
      expect(e.status, storageLocationId).toBe(422);
      expect(e.code).toBe('VALIDATION_FAILED');
      expect(e.errors).toHaveProperty(['body.storageLocationId']);
      const left = await w.tx.query<{ checks: number; batches: number; status: string }>(
        `SELECT gr.status::text AS status,
                (SELECT count(*)::int FROM quality_checks q WHERE q.goods_receipt_id = gr.id) AS checks,
                (SELECT count(*)::int FROM inventory_batches b WHERE b.goods_receipt_id = gr.id) AS batches
           FROM goods_receipts gr WHERE gr.id = $1`,
        [lot.goodsReceiptId],
      );
      expect(left.rows[0]).toEqual({ status: 'AWAITING_QC', checks: 0, batches: 0 });
    }
  });
});
