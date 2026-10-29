/**
 * BR-124: the printable goods receipt note, a derived read-only JSON document.
 *
 *   1. HTTP wiring: 401 / 403 / 422 decided before any SQL, and the 200's headers with the service
 *      stubbed (no database).
 *   2. PostgreSQL, rolled back (src/test/goodsReceiptWorld): the exact document before and after a
 *      quality check, scope, read-only, and that no farm identity leaves.
 */
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import { inGoodsReceiptWorld, type GoodsReceiptWorld } from '../../test/goodsReceiptWorld.js';
import {
  goodsReceiptDiscrepancyCreateBody,
  qcParameters,
  qualityCheckCreateBody,
  type GoodsReceiptDocumentResponse,
} from './goods-receipts.schema.js';
import { goodsReceiptsService } from './goods-receipts.service.js';

const CODE = 'inventory.goods_receipt.record';
const QC_CODE = 'inventory.quality_check.perform';

const DOCUMENT_KEYS = [
  'batchCode',
  'crop',
  'discrepancyCount',
  'documentType',
  'farmer',
  'goodsReceiptId',
  'grade',
  'grnNumber',
  'packages',
  'purchaseOrder',
  'qualityCheck',
  'quantities',
  'receivedAt',
  'receivedBy',
  'status',
  'vehicleNumber',
  'warehouse',
];

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<AppError> {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected ${code}`).toBeInstanceOf(AppError);
  expect((caught as AppError).code).toBe(code);
  expect((caught as AppError).status).toBe(status);
  return caught as AppError;
}

// ---------------------------------------------------------------------------
// 1. HTTP
// ---------------------------------------------------------------------------
describe('BR-124a / BR-124b: the document route', () => {
  const app = createApp();
  const url = (id: string): string => `/v1/admin/goods-receipts/${id}/document`;
  const base = { farmerId: null, customerId: null };
  const tokens: Record<string, string> = {
    farmer: signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null }),
    customer: signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() }),
    farmerAdmin: signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base }),
    sub: signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }], ...base }),
  };
  const auth = (who: string): string => `Bearer ${tokens[who]}`;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('BR-124a: 401 without a token', async () => {
    expect((await request(app).get(url(newId()))).status).toBe(401);
  });

  it('BR-124a: Farmer, Customer and Farmer Admin are 403 naming inventory.goods_receipt.record', async () => {
    for (const who of ['farmer', 'customer', 'farmerAdmin']) {
      const res = await request(app).get(url(newId())).set('Authorization', auth(who));
      expect(res.status, who).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.meta?.permission).toBe(CODE);
    }
  });

  it('BR-124a: a malformed id is 422 before any SQL', async () => {
    const res = await request(app).get(url('not-a-uuid')).set('Authorization', auth('sub'));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('BR-124b: the 200 is the service document as JSON with Cache-Control: no-store', async () => {
    const id = newId();
    const document = { documentType: 'GOODS_RECEIPT_NOTE', goodsReceiptId: id } as unknown as GoodsReceiptDocumentResponse;
    const spy = vi.spyOn(goodsReceiptsService, 'getDocument').mockResolvedValue(document);
    const res = await request(app).get(url(id)).set('Authorization', auth('sub'));
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body).toEqual(document);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![2]).toBe(id);
  });

  it('BR-124b: a 404 from the service also carries Cache-Control: no-store', async () => {
    vi.spyOn(goodsReceiptsService, 'getDocument').mockRejectedValue(new AppError('NOT_FOUND', { detail: 'nope' }));
    const res = await request(app).get(url(newId())).set('Authorization', auth('sub'));
    expect(res.status).toBe(404);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

// ---------------------------------------------------------------------------
// 2. PostgreSQL, rolled back
// ---------------------------------------------------------------------------
const dbReady = (): Promise<boolean> =>
  requireDatabaseTables('goods_receipts', 'goods_receipt_discrepancies', 'quality_checks', 'inventory_batches', 'warehouses');

function dbIt(name: string, fn: (world: GoodsReceiptWorld) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inGoodsReceiptWorld(fn);
  });
}

async function receiptFacts(db: Executor, goodsReceiptId: string) {
  const res = await db.query<{ grn: string; po_number: string; po_id: string; crop_id: string; farmer_id: string; received_at: Date; code: string; name: string }>(
    `SELECT gr.grn_number AS grn, po.po_number, po.id AS po_id, po.crop_id, gr.farmer_id, gr.received_at, w.code, w.name
       FROM goods_receipts gr
       JOIN purchase_orders po ON po.id = gr.purchase_order_id
       JOIN warehouses w ON w.id = gr.warehouse_id
      WHERE gr.id = $1`,
    [goodsReceiptId],
  );
  return res.rows[0]!;
}

async function writeCounts(db: Executor) {
  const res = await db.query(
    `SELECT (SELECT count(*)::int FROM audit_log) AS audit,
            (SELECT count(*)::int FROM goods_receipts) AS receipts,
            (SELECT count(*)::int FROM quality_checks) AS checks,
            (SELECT count(*)::int FROM idempotency_keys) AS keys`,
  );
  return res.rows[0] as Record<string, number>;
}

async function nameLot(w: GoodsReceiptWorld, farmerId: string, cropId: string, token: string): Promise<void> {
  await w.tx.query(`UPDATE users SET full_name = $2 WHERE id = (SELECT user_id FROM farmers WHERE id = $1)`, [farmerId, `Farmer ${token}`]);
  await w.tx.query(`UPDATE crop_master SET name = $2 WHERE id = $1`, [cropId, `Crop ${token}`]);
}

dbIt('BR-124c: before the quality check the document is exactly the receipt, with no check, no parts, no packages and no reports', async (w) => {
  const lot = await w.lot();
  const token = `doc${newId().slice(0, 6)}`;
  await nameLot(w, lot.farmerId, lot.cropId, token);
  const facts = await receiptFacts(w.tx, lot.goodsReceiptId);

  const before = await writeCounts(w.tx);
  const doc = await w.goodsReceipts.getDocument(w.admin, w.scope(CODE), lot.goodsReceiptId);
  expect(doc).toEqual({
    documentType: 'GOODS_RECEIPT_NOTE',
    goodsReceiptId: lot.goodsReceiptId,
    grnNumber: facts.grn,
    status: 'AWAITING_QC',
    purchaseOrder: { id: lot.purchaseOrderId, poNumber: facts.po_number },
    warehouse: { id: w.ooty, code: facts.code, name: facts.name },
    farmer: { id: lot.farmerId, name: `Farmer ${token}` },
    crop: { id: lot.cropId, name: `Crop ${token}` },
    grade: { listed: 'GRADE_1', assigned: null },
    quantities: { grossQtyKg: '100.000', acceptedQtyKg: '0.000', rejectedQtyKg: '0.000', damagedQtyKg: null, spoiledQtyKg: null },
    packages: null,
    vehicleNumber: null,
    receivedBy: { id: w.adminId, name: w.adminName },
    receivedAt: facts.received_at.toISOString(),
    batchCode: null,
    qualityCheck: null,
    discrepancyCount: 0,
  });
  // A read: nothing written.
  expect(await writeCounts(w.tx)).toEqual(before);
  // Derived: the same state yields the same document.
  expect(await w.goodsReceipts.getDocument(w.admin, w.scope(CODE), lot.goodsReceiptId)).toEqual(doc);
});

dbIt('BR-124d: after a check with a breakdown, packages and two reports the document carries the summary, the parts, the batch and the count', async (w) => {
  const lot = await w.lot();
  await w.tx.query(`UPDATE goods_receipts SET package_count = 12, package_unit = 'CRATE', vehicle_number = 'TN43AB1234' WHERE id = $1`, [lot.goodsReceiptId]);
  const { qualityCheck, batch } = await w.goodsReceipts.recordQualityCheck(
    w.admin,
    w.scope(QC_CODE),
    lot.goodsReceiptId,
    qualityCheckCreateBody.parse({
      assignedGrade: 'GRADE_2',
      outcome: 'PARTIALLY_ACCEPTED',
      acceptedQtyKg: '90.000',
      rejectedQtyKg: '10.000',
      damagedQtyKg: '4.000',
      spoiledQtyKg: '3.500',
      rejectionReasonCode: 'PHYSICAL_DAMAGE',
      items: qcParameters.map((parameter, i) => ({ parameter, score: 7, passed: i !== 3 })),
    }),
    `br124d-qc-${lot.goodsReceiptId}`,
  );
  for (const n of [1, 2]) {
    await w.goodsReceipts.createDiscrepancy(
      w.admin,
      w.scope(QC_CODE),
      lot.goodsReceiptId,
      goodsReceiptDiscrepancyCreateBody.parse({ type: 'DAMAGE', expected: `e${n}`, actual: `a${n}` }),
      `br124d-d${n}-${lot.goodsReceiptId}`,
    );
  }
  // Another receipt's report never counts.
  const other = await w.lot();
  await w.goodsReceipts.createDiscrepancy(
    w.admin,
    w.scope(QC_CODE),
    other.goodsReceiptId,
    goodsReceiptDiscrepancyCreateBody.parse({ type: 'OTHER', expected: 'x', actual: 'y' }),
    `br124d-other-${other.goodsReceiptId}`,
  );

  const doc = await w.goodsReceipts.getDocument(w.admin, w.scope(CODE), lot.goodsReceiptId);
  expect(doc.status).toBe('PARTIALLY_ACCEPTED');
  expect(doc.grade).toEqual({ listed: 'GRADE_1', assigned: 'GRADE_2' });
  expect(doc.quantities).toEqual({
    grossQtyKg: '100.000',
    acceptedQtyKg: '90.000',
    rejectedQtyKg: '10.000',
    damagedQtyKg: '4.000',
    spoiledQtyKg: '3.500',
  });
  expect(doc.packages).toEqual({ count: 12, unit: 'CRATE' });
  expect(doc.vehicleNumber).toBe('TN43AB1234');
  expect(batch).not.toBeNull();
  expect(doc.batchCode).toBe(batch!.batchCode);
  expect(doc.qualityCheck).toEqual({
    outcome: 'PARTIALLY_ACCEPTED',
    assignedGrade: 'GRADE_2',
    rejectionReasonCode: 'PHYSICAL_DAMAGE',
    passedPoints: 4,
    totalPoints: 5,
    checkedBy: { id: w.adminId, name: w.adminName },
    checkedAt: qualityCheck.checkedAt,
  });
  expect(doc.discrepancyCount).toBe(2);
});

dbIt('BR-124e: another warehouse\'s receipt is the same 404 as an unknown id for a confined caller; an unconfined caller reads it', async (w) => {
  const foreign = await w.lot(w.coonoor);
  const unknown = newId();
  const a = await expectAppError(w.goodsReceipts.getDocument(w.admin, w.scope(CODE), foreign.goodsReceiptId), 'NOT_FOUND', 404);
  const b = await expectAppError(w.goodsReceipts.getDocument(w.admin, w.scope(CODE), unknown), 'NOT_FOUND', 404);
  expect(a.detail?.replace(foreign.goodsReceiptId, 'X')).toBe(b.detail?.replace(unknown, 'X'));

  const main = aScope({ level: ScopeLevel.ALL, permission: CODE, roleCode: RoleCode.MAIN_WH_ADMIN, userId: w.adminId });
  const doc = await w.goodsReceipts.getDocument(w.admin, main, foreign.goodsReceiptId);
  expect(doc.warehouse.id).toBe(w.coonoor);
});

dbIt('BR-124f: the key set is pinned and no farm name, district or plot appears anywhere in the document', async (w) => {
  const lot = await w.lot();
  await nameLot(w, lot.farmerId, lot.cropId, `kf${newId().slice(0, 6)}`);
  const farm = await w.tx.query<{ name: string; district: string; plot: string }>(
    `SELECT f.name, f.district, p.name AS plot FROM farms f JOIN plots p ON p.farm_id = f.id WHERE f.farmer_id = $1`,
    [lot.farmerId],
  );
  const doc = await w.goodsReceipts.getDocument(w.admin, w.scope(CODE), lot.goodsReceiptId);
  expect(Object.keys(doc).sort()).toEqual(DOCUMENT_KEYS);
  expect(Object.keys(doc.farmer).sort()).toEqual(['id', 'name']);
  const json = JSON.stringify(doc);
  for (const value of [farm.rows[0]!.name, farm.rows[0]!.district, farm.rows[0]!.plot]) {
    expect(json, value).not.toContain(value);
  }
  for (const key of ['farmName', 'location', 'gps', 'latitude', 'longitude', 'fmb', 'mobile', 'email', 'pricePerKg', 'tohfaFarmerId']) {
    expect(json, key).not.toContain(`"${key}"`);
  }
});
