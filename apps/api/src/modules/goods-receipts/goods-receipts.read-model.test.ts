/**
 * BR-119: the admin goods-receipt reads carry the receiver's name and the receipt's quality check
 * (C2), inside the unchanged BR-30 scope. Real PostgreSQL, rolled back (src/test/goodsReceiptWorld).
 */
import { expect, it } from 'vitest';
import { AppError } from '../../http/problem.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { inGoodsReceiptWorld, type GoodsReceiptWorld } from '../../test/goodsReceiptWorld.js';
import { qcParameters, qualityCheckCreateBody } from './goods-receipts.schema.js';

const dbReady = (): Promise<boolean> =>
  requireDatabaseTables('goods_receipts', 'quality_checks', 'quality_check_items', 'inventory_batches', 'idempotency_keys');

function dbIt(name: string, fn: (world: GoodsReceiptWorld) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inGoodsReceiptWorld(fn);
  });
}

function qcBody(overrides: Record<string, unknown> = {}) {
  return qualityCheckCreateBody.parse({
    assignedGrade: 'GRADE_2',
    outcome: 'PARTIALLY_ACCEPTED',
    acceptedQtyKg: '90.000',
    rejectedQtyKg: '10.000',
    defectNotes: 'Bruised on 10 kg.',
    items: qcParameters.map((parameter, i) => ({ parameter, score: 6 + i, passed: true })),
    ...overrides,
  });
}

dbIt('BR-119c: the receipt read and the list rows carry receivedByName (users.full_name of received_by)', async (w) => {
  const lot = await w.lot();
  const read = await w.goodsReceipts.getById(w.admin, w.scope('inventory.goods_receipt.record'), lot.goodsReceiptId);
  expect(read.receivedByName).toBe(w.adminName);

  const page = await w.goodsReceipts.list(w.admin, w.scope('inventory.goods_receipt.record'), {
    limit: 100,
    purchaseOrderId: lot.purchaseOrderId,
  });
  expect(page.items.map((i) => i.id)).toEqual([lot.goodsReceiptId]);
  expect(page.items[0]?.receivedByName).toBe(w.adminName);
  // the quality-check block is a detail-read field only (one read, never N per page)
  expect(page.items[0]).not.toHaveProperty('qualityCheck');
});

dbIt('BR-119c: the create response carries receivedByName', async (w) => {
  const lot = await w.lot();
  const created = await w.goodsReceipts.createGoodsReceipt(
    w.admin,
    w.scope('inventory.goods_receipt.record'),
    { purchaseOrderId: lot.purchaseOrderId, warehouseId: w.ooty, grossQtyKg: '20.000', photos: [] },
    `br119c-${lot.goodsReceiptId}`,
  );
  expect(created.receivedByName).toBe(w.adminName);
});

dbIt('BR-119d: qualityCheck is null before the check, then the recorded check with five items, checkedBy and checkedByName', async (w) => {
  const lot = await w.lot();
  const before = await w.goodsReceipts.getById(w.admin, w.scope('inventory.goods_receipt.record'), lot.goodsReceiptId);
  expect(before.qualityCheck).toBeNull();

  const recorded = await w.goodsReceipts.recordQualityCheck(
    w.admin,
    w.scope('inventory.quality_check.perform'),
    lot.goodsReceiptId,
    qcBody(),
    `br119d-${lot.goodsReceiptId}`,
  );

  const after = await w.goodsReceipts.getById(w.admin, w.scope('inventory.goods_receipt.record'), lot.goodsReceiptId);
  const qc = after.qualityCheck;
  expect(qc).not.toBeNull();
  expect(qc).toMatchObject({
    id: recorded.qualityCheck.id,
    goodsReceiptId: lot.goodsReceiptId,
    assignedGrade: 'GRADE_2',
    listedGrade: 'GRADE_1',
    outcome: 'PARTIALLY_ACCEPTED',
    acceptedQtyKg: '90.000',
    rejectedQtyKg: '10.000',
    defectNotes: 'Bruised on 10 kg.',
    checkedBy: w.adminId,
    checkedByName: w.adminName,
    checkedAt: recorded.qualityCheck.checkedAt,
  });
  expect(qc?.items?.map((i) => i.parameter).sort()).toEqual([...qcParameters].sort());
  expect(qc?.items?.find((i) => i.parameter === 'FRESHNESS')?.score).toBe(10);
});

dbIt('BR-119d: another warehouse\'s receipt is still the same 404 for a confined Sub admin, quality check or not', async (w) => {
  const lot = await w.lot(w.coonoor);
  await expect(
    w.goodsReceipts.getById(w.admin, w.scope('inventory.goods_receipt.record'), lot.goodsReceiptId),
  ).rejects.toSatisfy((error: unknown) => error instanceof AppError && error.code === 'NOT_FOUND' && error.status === 404);
});
