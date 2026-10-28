/**
 * BR-126: what the destination records when it receives a transfer (BR-102), without changing stock.
 *
 *  a  schema: every new receive-line field is optional and strict; an old body parses unchanged
 *  b  TGR receipt number (null before receipt, increasing) and initiatedByName on list and detail
 *  c  damaged + spoiled are a breakdown of the shortfall; above it 422; stock credited unchanged
 *  d  condition, actual grade and actual product stored only; unknown product 422
 *  e  storage location of the destination copied to the destination batch; others 422
 *  f  idempotency unchanged: a replay returns the same number; an added field on the key is 409
 *  g  the database refuses a breakdown above the shortfall and a RECEIVED transfer without a number
 *
 * Schema tests need no database; the rest run on real PostgreSQL in a rolled-back transaction.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { insertCrop, insertFarmerWithPlot, insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { inRolledBackTx, loadWarehouseIds, type WarehouseIds } from '../warehouse-ops/testkit.js';
import { receiveTransferBody } from './warehouse-transfers.schema.js';
import { warehouseTransfersRepo } from './warehouse-transfers.repo.js';
import { createWarehouseTransfersService } from './warehouse-transfers.service.js';

describe('BR-126a: receive-line schema', () => {
  it('BR-126a: the new line fields are optional and strict; an old body parses unchanged', () => {
    const itemId = newId();
    const old = { lines: [{ itemId, qtyReceivedKg: '4' }], receiptNote: 'short' };
    expect(receiveTransferBody.parse(old)).toEqual(old);

    const full = {
      lines: [
        {
          itemId,
          qtyReceivedKg: '4',
          damagedQtyKg: '0.5',
          spoiledQtyKg: '0.250',
          condition: 'FAIR',
          actualGrade: 'GRADE_2',
          actualProductId: newId(),
          storageLocationId: newId(),
          storageLocation: 'Bin 7',
        },
      ],
    };
    expect(receiveTransferBody.parse(full)).toEqual(full);

    const line = (extra: Record<string, unknown>) => ({ lines: [{ itemId, qtyReceivedKg: '4', ...extra }] });
    for (const bad of [
      line({ damagedQtyKg: 0.5 }),
      line({ damagedQtyKg: '-1' }),
      line({ spoiledQtyKg: '1.0001' }),
      line({ condition: 'OK' }),
      line({ actualGrade: 'A' }),
      line({ actualProductId: 'carrot' }),
      line({ storageLocationId: 'shelf' }),
      line({ storageLocation: '' }),
      line({ storageLocation: 's'.repeat(41) }),
      line({ farmerId: newId() }),
    ]) {
      expect(receiveTransferBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

async function failure(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(() => null, (e: unknown) => e);
  expect(error, 'expected the call to fail').toBeInstanceOf(AppError);
  return error as AppError;
}

describeIfDatabase('BR-126: transfer receipt details (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('stock_transfers', 'stock_transfer_items', 'inventory_batches', 'stock_ledger', 'storage_locations');
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

  const service = (tx: Executor) =>
    createWarehouseTransfersService({ repo: warehouseTransfersRepo, db: tx, runTx: async (fn) => fn(tx), idempotency: createInMemoryIdempotencyStore() });

  interface World {
    tx: Executor;
    main: string;
    mainName: string;
    receiverId: string;
    farmerId: string;
    cropId: string;
    svc: ReturnType<typeof service>;
  }

  async function world(tx: Executor): Promise<World> {
    const farmer = await insertFarmerWithPlot(tx);
    const mainName = `CI Transfer Main ${newId().slice(0, 6)}`;
    return {
      tx,
      main: await insertUser(tx, 'ADMIN', mainName),
      mainName,
      receiverId: await insertUser(tx, 'ADMIN', 'CI transfer receiver'),
      farmerId: farmer.farmerId,
      cropId: await insertCrop(tx),
      svc: service(tx),
    };
  }

  async function batch(w: World, warehouseId: string, qty: string): Promise<string> {
    const id = newId();
    await w.tx.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, cost_per_kg, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, $6::numeric, 1.00, 'ACTIVE')`,
      [id, `B-CI-TGR-${id.slice(0, 8)}`, warehouseId, w.cropId, w.farmerId, qty],
    );
    await w.tx.query(
      `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks)
       VALUES ($1, $2, 'RECEIPT', $3::numeric, 0, 'TEST', 'fixture receipt')`,
      [id, warehouseId, qty],
    );
    return id;
  }

  /** Ooty -> Coonoor, 5 kg of one batch, below the threshold so it is IN_TRANSIT at once. */
  async function inTransit(w: World, qtyKg = '5') {
    const b = await batch(w, wh.ooty, '20');
    const { transfer } = await w.svc.create(
      aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'transfer.inter_warehouse.initiate', userId: w.main }),
      newId(),
      { fromWarehouseId: wh.ooty, toWarehouseId: wh.coonoor, lines: [{ batchId: b, qtyKg }] },
    );
    expect(transfer.status).toBe('IN_TRANSIT');
    return { transfer, sourceBatchId: b, itemId: transfer.lines[0]!.id };
  }

  const receiver = (w: World) =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'transfer.inter_warehouse.receive', userId: w.receiverId, warehouseIds: [wh.coonoor] });
  const viewer = (w: World) =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN, permission: 'transfer.inter_warehouse.view', userId: w.receiverId });

  async function location(tx: Executor, warehouseId: string, code: string, isActive = true): Promise<string> {
    const res = await tx.query<{ id: string }>(
      `INSERT INTO storage_locations (warehouse_id, code, name, is_active) VALUES ($1, $2, $3, $4) RETURNING id`,
      [warehouseId, code, `Location ${code}`, isActive],
    );
    return res.rows[0]!.id;
  }

  async function snapshot(tx: Executor, transferId: string) {
    const res = await tx.query<{ status: string; ins: number; batches: number }>(
      `SELECT t.status,
              (SELECT count(*)::int FROM stock_ledger l WHERE l.ref_id = t.id AND l.movement_type = 'TRANSFER_IN') AS ins,
              (SELECT count(*)::int FROM stock_transfer_items i WHERE i.transfer_id = t.id AND i.dest_batch_id IS NOT NULL) AS batches
         FROM stock_transfers t WHERE t.id = $1`,
      [transferId],
    );
    return res.rows[0]!;
  }

  dbTest('BR-126b: a receipt gets TGR-<year>-<6+ digits>, null before, a higher number later; list and detail carry it and initiatedByName', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await world(tx);
      const first = await inTransit(w);
      expect(first.transfer).toMatchObject({ receiptNumber: null, initiatedByName: w.mainName });
      const second = await inTransit(w);

      const r1 = await w.svc.receive(receiver(w), first.transfer.id, newId(), { lines: [{ itemId: first.itemId, qtyReceivedKg: '5' }] });
      const r2 = await w.svc.receive(receiver(w), second.transfer.id, newId(), { lines: [{ itemId: second.itemId, qtyReceivedKg: '5' }] });
      const year = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(new Date());
      expect(r1.receiptNumber).toMatch(new RegExp(`^TGR-${year}-\\d{6,}$`));
      expect(Number(r2.receiptNumber!.split('-')[2])).toBeGreaterThan(Number(r1.receiptNumber!.split('-')[2]));
      expect(r1.initiatedByName).toBe(w.mainName);

      const detail = await w.svc.get(viewer(w), first.transfer.id);
      expect(detail).toMatchObject({ receiptNumber: r1.receiptNumber, initiatedByName: w.mainName });
      const list = await w.svc.list(viewer(w), { page: 1, pageSize: 100, warehouseId: wh.coonoor, direction: 'INBOUND', status: 'RECEIVED' });
      const row = list.items.find((t) => t.id === first.transfer.id);
      expect(row).toMatchObject({ receiptNumber: r1.receiptNumber, initiatedByName: w.mainName });
    });
  });

  dbTest('BR-126c: damaged + spoiled above the shortfall is 422 and writes nothing; within it the destination is credited exactly qtyReceivedKg', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await world(tx);
      const t = await inTransit(w);
      // Shortfall 5 - 4 = 1 kg; 0.6 + 0.401 = 1.001 kg is one gram too many.
      const over = await failure(
        w.svc.receive(receiver(w), t.transfer.id, newId(), {
          lines: [{ itemId: t.itemId, qtyReceivedKg: '4', damagedQtyKg: '0.6', spoiledQtyKg: '0.401' }],
          receiptNote: 'crushed crates',
        }),
      );
      expect(over.status).toBe(422);
      expect(over.code).toBe('VALIDATION_FAILED');
      expect(over.errors).toHaveProperty(['body.lines.0.damagedQtyKg']);
      expect(await snapshot(tx, t.transfer.id)).toEqual({ status: 'IN_TRANSIT', ins: 0, batches: 0 });

      // A full receipt has no shortfall, so any damage is refused.
      const none = await failure(
        w.svc.receive(receiver(w), t.transfer.id, newId(), { lines: [{ itemId: t.itemId, qtyReceivedKg: '5', damagedQtyKg: '0.001' }] }),
      );
      expect(none.errors).toHaveProperty(['body.lines.0.damagedQtyKg']);

      const ok = await w.svc.receive(receiver(w), t.transfer.id, newId(), {
        lines: [{ itemId: t.itemId, qtyReceivedKg: '4', damagedQtyKg: '0.6', spoiledQtyKg: '0.4' }],
        receiptNote: 'crushed crates',
      });
      expect(ok.lines[0]).toMatchObject({ qtyReceivedKg: '4.000', varianceKg: '-1.000', damagedQtyKg: '0.600', spoiledQtyKg: '0.400' });
      expect(ok.hasDiscrepancy).toBe(true);

      // The same receipt without a breakdown credits the same: one TRANSFER_IN of 4 kg into a 4 kg batch.
      const plain = await inTransit(w);
      const plainOk = await w.svc.receive(receiver(w), plain.transfer.id, newId(), {
        lines: [{ itemId: plain.itemId, qtyReceivedKg: '4' }],
        receiptNote: 'short',
      });
      expect(plainOk.lines[0]).toMatchObject({ damagedQtyKg: '0.000', spoiledQtyKg: '0.000' });
      const stock = async (transferId: string, destBatchId: string) =>
        (await tx.query<{ ledger: string; available: string; received: string }>(
          `SELECT (SELECT string_agg(qty_delta::text, ',') FROM stock_ledger WHERE ref_id = $1 AND movement_type = 'TRANSFER_IN') AS ledger,
                  b.qty_available::text AS available, b.qty_received::text AS received
             FROM inventory_batches b WHERE b.id = $2`,
          [transferId, destBatchId],
        )).rows[0]!;
      expect(await stock(t.transfer.id, ok.lines[0]!.destBatchId!)).toEqual({ ledger: '4.000', available: '4.000', received: '4.000' });
      expect(await stock(plain.transfer.id, plainOk.lines[0]!.destBatchId!)).toEqual({ ledger: '4.000', available: '4.000', received: '4.000' });

      // Not yet received: the breakdown reads null.
      const pendingLine = (await inTransit(w)).transfer.lines[0]!;
      expect(pendingLine).toMatchObject({ damagedQtyKg: null, spoiledQtyKg: null, condition: null, storageLocationId: null });
    });
  });

  dbTest('BR-126d: condition, actual grade and actual product are stored and returned; an unknown product is 422; the destination batch keeps the source crop and grade', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await world(tx);
      const t = await inTransit(w);
      const unknown = await failure(
        w.svc.receive(receiver(w), t.transfer.id, newId(), { lines: [{ itemId: t.itemId, qtyReceivedKg: '5', actualProductId: newId() }] }),
      );
      expect(unknown.status).toBe(422);
      expect(unknown.errors).toHaveProperty(['body.lines.0.actualProductId']);
      expect((await snapshot(tx, t.transfer.id)).status).toBe('IN_TRANSIT');

      const otherCrop = await insertCrop(tx);
      const cropName = (await tx.query<{ name: string }>(`SELECT name FROM crop_master WHERE id = $1`, [otherCrop])).rows[0]!.name;
      const ok = await w.svc.receive(receiver(w), t.transfer.id, newId(), {
        lines: [{ itemId: t.itemId, qtyReceivedKg: '5', condition: 'POOR', actualGrade: 'GRADE_3', actualProductId: otherCrop }],
      });
      expect(ok.lines[0]).toMatchObject({ condition: 'POOR', actualGrade: 'GRADE_3', actualProductId: otherCrop, actualProductName: cropName });
      const dest = await tx.query<{ crop_id: string; grade: string }>(`SELECT crop_id, grade::text FROM inventory_batches WHERE id = $1`, [ok.lines[0]!.destBatchId]);
      expect(dest.rows[0]).toEqual({ crop_id: w.cropId, grade: 'GRADE_1' });
      expect((await w.svc.get(viewer(w), t.transfer.id)).lines[0]).toMatchObject({ condition: 'POOR', actualGrade: 'GRADE_3', actualProductId: otherCrop });
    });
  });

  dbTest('BR-126e: a storage location of the destination is copied to the destination batch; another warehouse, unknown or inactive is 422', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await world(tx);
      const dest = await location(tx, wh.coonoor, 'TGR-LOC-1');
      const foreign = await location(tx, wh.ooty, 'TGR-LOC-F');
      const off = await location(tx, wh.coonoor, 'TGR-LOC-OFF', false);
      const t = await inTransit(w);
      for (const storageLocationId of [foreign, newId(), off]) {
        const e = await failure(
          w.svc.receive(receiver(w), t.transfer.id, newId(), { lines: [{ itemId: t.itemId, qtyReceivedKg: '5', storageLocationId }] }),
        );
        expect(e.status, storageLocationId).toBe(422);
        expect(e.errors).toHaveProperty(['body.lines.0.storageLocationId']);
      }
      expect(await snapshot(tx, t.transfer.id)).toEqual({ status: 'IN_TRANSIT', ins: 0, batches: 0 });

      const ok = await w.svc.receive(receiver(w), t.transfer.id, newId(), { lines: [{ itemId: t.itemId, qtyReceivedKg: '5', storageLocationId: dest }] });
      expect(ok.lines[0]).toMatchObject({ storageLocationId: dest, storageLocation: 'TGR-LOC-1' });
      const batchRow = await tx.query<{ storage_location_id: string; storage_location: string }>(
        `SELECT storage_location_id, storage_location FROM inventory_batches WHERE id = $1`,
        [ok.lines[0]!.destBatchId],
      );
      expect(batchRow.rows[0]).toEqual({ storage_location_id: dest, storage_location: 'TGR-LOC-1' });

      // A text label is kept as given, with or without an id.
      const t2 = await inTransit(w);
      const labelled = await w.svc.receive(receiver(w), t2.transfer.id, newId(), {
        lines: [{ itemId: t2.itemId, qtyReceivedKg: '5', storageLocation: 'Dock 2' }],
      });
      expect(labelled.lines[0]).toMatchObject({ storageLocationId: null, storageLocation: 'Dock 2' });
    });
  });

  dbTest('BR-126f: a replay returns the same receipt number and writes nothing twice; the same key with an added field is 409', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await world(tx);
      const t = await inTransit(w);
      const key = newId();
      const body = { lines: [{ itemId: t.itemId, qtyReceivedKg: '5' }] };
      const first = await w.svc.receive(receiver(w), t.transfer.id, key, body);
      const replay = await w.svc.receive(receiver(w), t.transfer.id, key, body);
      expect(replay).toEqual(first);
      expect(await snapshot(tx, t.transfer.id)).toEqual({ status: 'RECEIVED', ins: 1, batches: 1 });
      const reused = await failure(
        w.svc.receive(receiver(w), t.transfer.id, key, { lines: [{ itemId: t.itemId, qtyReceivedKg: '5', condition: 'GOOD' }] }),
      );
      expect(reused.status).toBe(409);
      expect(reused.code).toBe('IDEMPOTENCY_KEY_REUSED');
    });
  });

  dbTest('BR-126g: the database refuses a breakdown above the shortfall and a RECEIVED transfer without a receipt number', async () => {
    await inRolledBackTx(async (tx) => {
      const w = await world(tx);
      const t = await inTransit(w);
      await tx.query('SAVEPOINT g1');
      const breakdown = await tx
        .query(`UPDATE stock_transfer_items SET qty_received = 4, damaged_qty = 1, spoiled_qty = 0.001 WHERE id = $1`, [t.itemId])
        .then(() => null, (e: unknown) => e);
      await tx.query('ROLLBACK TO SAVEPOINT g1');
      expect((breakdown as { code?: string }).code).toBe('23514');

      await tx.query('SAVEPOINT g2');
      const unnumbered = await tx
        .query(`UPDATE stock_transfers SET status = 'RECEIVED', received_by = $2, received_at = now() WHERE id = $1`, [t.transfer.id, w.receiverId])
        .then(() => null, (e: unknown) => e);
      await tx.query('ROLLBACK TO SAVEPOINT g2');
      expect((unnumbered as { code?: string; constraint?: string }).constraint).toBe('stock_transfers_receipt_number_chk');
    });
  });
});
