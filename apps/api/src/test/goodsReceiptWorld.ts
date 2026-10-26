/**
 * A rolled-back PostgreSQL world for goods-receipt tests that need real SQL (BR-119, BR-120): one
 * outer transaction that is always rolled back, the services' own transactions run as SAVEPOINTs
 * on it, so a refused request really rolls its writes back and the test can still look.
 *
 * The same harness as goods-receipts.batch.test.ts (BR-106), shared so new suites do not copy it.
 */
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Actor } from '../auth/requireAuth.js';
import type { Executor } from '../db/pool.js';
import type { ResolvedScope } from '../rbac/requirePermission.js';
import { goodsReceiptsRepo } from '../modules/goods-receipts/goods-receipts.repo.js';
import { createGoodsReceiptsService } from '../modules/goods-receipts/goods-receipts.service.js';
import { insertCrop, insertFarmerWithPlot, insertUser } from './dbFixtures.js';
import { aScope, anActor, newId } from './factories.js';

export interface IntakeLot {
  farmerId: string;
  cropId: string;
  purchaseOrderId: string;
  goodsReceiptId: string;
}

export interface GoodsReceiptWorld {
  tx: Executor;
  adminId: string;
  /** users.full_name of the admin who received and checks the lots. */
  adminName: string;
  ooty: string;
  coonoor: string;
  admin: Actor;
  /** Sub admin of WH-OOTY at the real `all` grant, confined by its assigned warehouse (BR-30). */
  scope: (permission: string) => ResolvedScope;
  goodsReceipts: ReturnType<typeof createGoodsReceiptsService>;
  /** farmer -> crop -> listing -> purchase order (GRADE_1, Rs 50/kg) -> 100 kg receipt AWAITING_QC. */
  lot: (warehouseId?: string) => Promise<IntakeLot>;
}

class RollbackWorld extends Error {}

async function insertLot(db: Executor, warehouseId: string, adminId: string): Promise<IntakeLot> {
  const farmer = await insertFarmerWithPlot(db);
  const cropId = await insertCrop(db);
  const fairPriceId = newId();
  await db.query(
    `INSERT INTO fair_prices (id, crop_id, grade, ceiling_price, effective_from, set_by)
     VALUES ($1, $2, 'GRADE_1', 100.00, '2026-01-01', $3)`,
    [fairPriceId, cropId, adminId],
  );
  const listingId = newId();
  await db.query(
    `INSERT INTO produce_listings
       (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status,
        final_price_per_kg, final_quantity_kg, approved_by, approved_at, version)
     VALUES ($1, $2, $3, $4, 'GRADE_1', 100, 50.00, $5, 'ACCEPTED', 50.00, 100, $6, now(), 2)`,
    [listingId, `LST-GRW-${listingId.slice(0, 8)}`, farmer.farmerId, cropId, fairPriceId, adminId],
  );
  const purchaseOrderId = newId();
  await db.query(
    `INSERT INTO purchase_orders
       (id, po_number, farmer_id, listing_id, warehouse_id, crop_id, grade, quantity_kg, price_per_kg, total_amount, issued_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'GRADE_1', 100, 50.00, 5000.00, $7)`,
    [purchaseOrderId, `PO-GRW-${purchaseOrderId.slice(0, 8)}`, farmer.farmerId, listingId, warehouseId, cropId, adminId],
  );
  const goodsReceiptId = newId();
  await db.query(
    `INSERT INTO goods_receipts (id, grn_number, purchase_order_id, warehouse_id, farmer_id, gross_qty_kg, received_by, status)
     VALUES ($1, $2, $3, $4, $5, 100, $6, 'AWAITING_QC')`,
    [goodsReceiptId, `GRN-GRW-${goodsReceiptId.slice(0, 8)}`, purchaseOrderId, warehouseId, farmer.farmerId, adminId],
  );
  return { farmerId: farmer.farmerId, cropId, purchaseOrderId, goodsReceiptId };
}

export async function inGoodsReceiptWorld(fn: (world: GoodsReceiptWorld) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../db/pool.js');
  await withTransaction(async (tx) => {
    const adminName = `Intake Admin ${newId().slice(0, 6)}`;
    const adminId = await insertUser(tx, 'ADMIN', adminName);
    const res = await tx.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`,
    );
    const ooty = res.rows.find((r) => r.code === 'WH-OOTY')?.id;
    const coonoor = res.rows.find((r) => r.code === 'WH-COON')?.id;
    if (ooty === undefined || coonoor === undefined) {
      throw new Error('seeded warehouses WH-OOTY / WH-COON are missing: run the reference seed first');
    }
    let savepoints = 0;
    const runTx = async <T>(work: (executor: Executor) => Promise<T>): Promise<T> => {
      const name = `grw_sp_${(savepoints += 1)}`;
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
    await fn({
      tx,
      adminId,
      adminName,
      ooty,
      coonoor,
      admin: anActor({ userId: adminId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: ooty }] }),
      scope: (permission) =>
        aScope({
          level: ScopeLevel.ALL,
          permission,
          roleCode: RoleCode.SUB_WH_ADMIN,
          userId: adminId,
          warehouseIds: [ooty],
        }),
      goodsReceipts: createGoodsReceiptsService(goodsReceiptsRepo, runTx, tx),
      lot: (warehouseId = ooty) => insertLot(tx, warehouseId, adminId),
    });
    throw new RollbackWorld();
  }).catch((error: unknown) => {
    if (!(error instanceof RollbackWorld)) throw error;
  });
}
