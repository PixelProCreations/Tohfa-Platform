/**
 * BR-120: the quality check's damaged / spoiled breakdown, graded condition levels, crop mismatch
 * and rejection reason codes, and the strict `items[]` contract. Schema tests need no database; the
 * rest run on real PostgreSQL, rolled back (src/test/goodsReceiptWorld).
 *
 * The invariant under test above all: none of this changes what is stocked (BR-106). The batch and
 * its RECEIPT ledger row are `acceptedQtyKg` exactly as before.
 */
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { insertCrop, requireDatabaseTables } from '../../test/dbFixtures.js';
import { inGoodsReceiptWorld, type GoodsReceiptWorld } from '../../test/goodsReceiptWorld.js';
import { qcParameters, qualityCheckCreateBody } from './goods-receipts.schema.js';

const dbReady = (): Promise<boolean> =>
  requireDatabaseTables('goods_receipts', 'quality_checks', 'quality_check_items', 'inventory_batches', 'stock_ledger', 'idempotency_keys');

function dbIt(name: string, fn: (world: GoodsReceiptWorld) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inGoodsReceiptWorld(fn);
  });
}

const fiveItems = (extra: Record<string, unknown> = {}) =>
  qcParameters.map((parameter) => ({ parameter, score: 8, passed: true, ...extra }));

/** A raw (unparsed) body: 100 kg received, 80 accepted, 20 rejected. */
function rawBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    assignedGrade: 'GRADE_1',
    outcome: 'PARTIALLY_ACCEPTED',
    acceptedQtyKg: '80.000',
    rejectedQtyKg: '20.000',
    rejectionReason: 'Damaged and spoiled on arrival.',
    items: fiveItems(),
    ...overrides,
  };
}

const body = (overrides: Record<string, unknown> = {}) => qualityCheckCreateBody.parse(rawBody(overrides));

function refusedAt(input: Record<string, unknown>): string[] {
  const parsed = qualityCheckCreateBody.safeParse(input);
  expect(parsed.success).toBe(false);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.path.join('.'));
}

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<void> {
  await expect(promise).rejects.toSatisfy((error: unknown) => {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(code);
    expect((error as AppError).status).toBe(status);
    return true;
  });
}

async function writes(db: Executor, goodsReceiptId: string) {
  const res = await db.query<{ status: string; checks: number; batches: number }>(
    `SELECT gr.status::text AS status,
            (SELECT count(*)::int FROM quality_checks qc WHERE qc.goods_receipt_id = gr.id) AS checks,
            (SELECT count(*)::int FROM inventory_batches ib WHERE ib.goods_receipt_id = gr.id) AS batches
       FROM goods_receipts gr WHERE gr.id = $1`,
    [goodsReceiptId],
  );
  return res.rows[0]!;
}

async function stockOf(db: Executor, goodsReceiptId: string) {
  const res = await db.query<{
    crop_id: string;
    qty_received: string;
    qty_available: string;
    ledger_qty: string;
    accepted: string;
    rejected: string;
  }>(
    `SELECT ib.crop_id, ib.qty_received::text, ib.qty_available::text,
            (SELECT string_agg(sl.qty_delta::text, ',') FROM stock_ledger sl
              WHERE sl.batch_id = ib.id AND sl.movement_type = 'RECEIPT') AS ledger_qty,
            gr.accepted_qty_kg::text AS accepted, gr.rejected_qty_kg::text AS rejected
       FROM goods_receipts gr
       JOIN inventory_batches ib ON ib.goods_receipt_id = gr.id
      WHERE gr.id = $1`,
    [goodsReceiptId],
  );
  return res.rows;
}

describe('BR-120a: the quality check items[] contract is validated strictly', () => {
  it('BR-120a: five distinct parameters with score, measuredValue, remarks, photoKeys and condition in range are accepted', () => {
    const parsed = qualityCheckCreateBody.safeParse(
      rawBody({
        items: qcParameters.map((parameter, i) => ({
          parameter,
          score: i * 2,
          passed: i !== 3,
          measuredValue: i === 2 ? 12.5 : 0,
          remarks: 'r'.repeat(500),
          photoKeys: ['a', 'b', 'c', 'd', 'e'],
          condition: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNACCEPTABLE'][i],
        })),
      }),
    );
    expect(parsed.success).toBe(true);
  });

  it('BR-120a: a duplicate parameter is refused on body.items even when there are five items', () => {
    const items = fiveItems();
    items[4] = { ...items[0]! };
    expect(refusedAt(rawBody({ items }))).toContain('items');
  });

  it('BR-120a: fewer or more than five items are refused', () => {
    expect(refusedAt(rawBody({ items: fiveItems().slice(0, 4) }))).toContain('items');
    expect(refusedAt(rawBody({ items: [...fiveItems(), { parameter: 'APPEARANCE', passed: true }] }))).toContain('items');
  });

  it('BR-120a: score, measuredValue, remarks, photoKeys and condition out of range are refused on the item', () => {
    const bad = (patch: Record<string, unknown>) => {
      const items = fiveItems();
      items[2] = { ...items[2]!, ...patch };
      return refusedAt(rawBody({ items }));
    };
    expect(bad({ score: 11 })).toContain('items.2.score');
    expect(bad({ score: 7.5 })).toContain('items.2.score');
    expect(bad({ measuredValue: -0.001 })).toContain('items.2.measuredValue');
    expect(bad({ measuredValue: 10_000_000 })).toContain('items.2.measuredValue');
    expect(bad({ remarks: 'r'.repeat(501) })).toContain('items.2.remarks');
    expect(bad({ photoKeys: ['1', '2', '3', '4', '5', '6'] })).toContain('items.2.photoKeys');
    expect(bad({ condition: 'BAD' })).toContain('items.2.condition');
    expect(bad({ passed: undefined })).toContain('items.2.passed');
    expect(bad({ grade: 'GRADE_1' })).toContain('items.2');
  });

  it('BR-120b: damagedQtyKg / spoiledQtyKg / cropMismatchQtyKg are decimal strings with at most 3 decimals, never negative', () => {
    expect(refusedAt(rawBody({ damagedQtyKg: '1.2345' }))).toContain('damagedQtyKg');
    expect(refusedAt(rawBody({ spoiledQtyKg: '-1.000' }))).toContain('spoiledQtyKg');
    expect(refusedAt(rawBody({ damagedQtyKg: 5 }))).toContain('damagedQtyKg');
    const id = randomUUID();
    expect(refusedAt(rawBody({ actualCropId: id, cropMismatchQtyKg: '1e3' }))).toContain('cropMismatchQtyKg');
    expect(refusedAt(rawBody({ actualCropId: id, cropMismatchQtyKg: '0.000' }))).toContain('cropMismatchQtyKg');
    // Both are optional: a body without them is the pre-BR-120 body and still parses (read back as
    // 0.000, BR-120f).
    expect(qualityCheckCreateBody.safeParse(rawBody()).success).toBe(true);
  });

  it('BR-120d: actualCropId and cropMismatchQtyKg come together or not at all', () => {
    expect(refusedAt(rawBody({ actualCropId: randomUUID() }))).toContain('cropMismatchQtyKg');
    expect(refusedAt(rawBody({ cropMismatchQtyKg: '5.000' }))).toContain('actualCropId');
    expect(refusedAt(rawBody({ actualCropId: 'not-a-uuid', cropMismatchQtyKg: '5.000' }))).toContain('actualCropId');
  });

  it('BR-120e: a rejection reason code outside the set is refused', () => {
    expect(refusedAt(rawBody({ rejectionReasonCode: 'TOO_UGLY' }))).toContain('rejectionReasonCode');
    expect(qualityCheckCreateBody.safeParse(rawBody({ rejectionReasonCode: 'SPOILAGE' })).success).toBe(true);
  });
});

dbIt('BR-120b: damaged + spoiled above the rejected quantity is 422 VALIDATION_FAILED and writes nothing', async (w) => {
  const lot = await w.lot();
  await expectAppError(
    w.goodsReceipts.recordQualityCheck(
      w.admin,
      w.scope('inventory.quality_check.perform'),
      lot.goodsReceiptId,
      body({ damagedQtyKg: '12.000', spoiledQtyKg: '8.001' }),
      `br120b-over-${lot.goodsReceiptId}`,
    ),
    'VALIDATION_FAILED',
    422,
  );
  expect(await writes(w.tx, lot.goodsReceiptId)).toEqual({ status: 'AWAITING_QC', checks: 0, batches: 0 });
});

dbIt('BR-120b: damaged + spoiled within the rejected quantity is recorded and returned', async (w) => {
  const lot = await w.lot();
  const result = await w.goodsReceipts.recordQualityCheck(
    w.admin,
    w.scope('inventory.quality_check.perform'),
    lot.goodsReceiptId,
    body({ damagedQtyKg: '12.000', spoiledQtyKg: '8.000' }),
    `br120b-ok-${lot.goodsReceiptId}`,
  );
  expect(result.qualityCheck).toMatchObject({ damagedQtyKg: '12.000', spoiledQtyKg: '8.000', rejectedQtyKg: '20.000' });
});

dbIt('BR-120c: a breakdown changes nothing that is stocked: batch, RECEIPT ledger row and receipt quantities equal the plain check', async (w) => {
  const plain = await w.lot();
  const broken = await w.lot();
  const scope = w.scope('inventory.quality_check.perform');
  await w.goodsReceipts.recordQualityCheck(w.admin, scope, plain.goodsReceiptId, body(), `br120c-plain-${plain.goodsReceiptId}`);
  const withBreakdown = await w.goodsReceipts.recordQualityCheck(
    w.admin,
    scope,
    broken.goodsReceiptId,
    body({ damagedQtyKg: '15.500', spoiledQtyKg: '4.500', rejectionReasonCode: 'PHYSICAL_DAMAGE' }),
    `br120c-broken-${broken.goodsReceiptId}`,
  );

  const strip = (rows: Awaited<ReturnType<typeof stockOf>>) => rows.map(({ crop_id: _c, ...rest }) => rest);
  const expected = [{ qty_received: '80.000', qty_available: '80.000', ledger_qty: '80.000', accepted: '80.000', rejected: '20.000' }];
  expect(strip(await stockOf(w.tx, plain.goodsReceiptId))).toEqual(expected);
  expect(strip(await stockOf(w.tx, broken.goodsReceiptId))).toEqual(expected);
  expect(withBreakdown.batch?.qtyReceivedKg).toBe('80.000');
});

dbIt('BR-120d: a crop mismatch is stored with its quantity and the crop name; the batch keeps the purchase order crop', async (w) => {
  const lot = await w.lot();
  const otherCrop = await insertCrop(w.tx);
  await w.tx.query(`UPDATE crop_master SET name = 'BR-120 Beans' WHERE id = $1`, [otherCrop]);
  const result = await w.goodsReceipts.recordQualityCheck(
    w.admin,
    w.scope('inventory.quality_check.perform'),
    lot.goodsReceiptId,
    body({ actualCropId: otherCrop, cropMismatchQtyKg: '5.250' }),
    `br120d-${lot.goodsReceiptId}`,
  );
  expect(result.qualityCheck).toMatchObject({
    actualCropId: otherCrop,
    actualCropName: 'BR-120 Beans',
    cropMismatchQtyKg: '5.250',
  });
  const stock = await stockOf(w.tx, lot.goodsReceiptId);
  expect(stock.map((s) => [s.crop_id, s.qty_received])).toEqual([[lot.cropId, '80.000']]);
});

dbIt('BR-120d: an unknown crop, the purchase order\'s own crop, or a quantity above gross is 422 and writes nothing', async (w) => {
  const scope = w.scope('inventory.quality_check.perform');
  const lot = await w.lot();
  const tries = [
    { actualCropId: randomUUID(), cropMismatchQtyKg: '5.000' },
    { actualCropId: lot.cropId, cropMismatchQtyKg: '5.000' },
    { actualCropId: await insertCrop(w.tx), cropMismatchQtyKg: '100.001' },
  ];
  for (const [i, extra] of tries.entries()) {
    await expectAppError(
      w.goodsReceipts.recordQualityCheck(w.admin, scope, lot.goodsReceiptId, body(extra), `br120d-bad-${i}-${lot.goodsReceiptId}`),
      'VALIDATION_FAILED',
      422,
    );
  }
  expect(await writes(w.tx, lot.goodsReceiptId)).toEqual({ status: 'AWAITING_QC', checks: 0, batches: 0 });
});

dbIt('BR-120e: a reason code is stored and returned, alone it satisfies the reason requirement, and with nothing rejected it is 422', async (w) => {
  const scope = w.scope('inventory.quality_check.perform');
  const lot = await w.lot();
  const result = await w.goodsReceipts.recordQualityCheck(
    w.admin,
    scope,
    lot.goodsReceiptId,
    body({ rejectionReason: undefined, rejectionReasonCode: 'SPOILAGE' }),
    `br120e-${lot.goodsReceiptId}`,
  );
  expect(result.qualityCheck.rejectionReasonCode).toBe('SPOILAGE');
  const receipt = await w.tx.query<{ rejection_reason: string }>(
    `SELECT rejection_reason FROM goods_receipts WHERE id = $1`,
    [lot.goodsReceiptId],
  );
  expect(receipt.rows[0]?.rejection_reason).toBe('SPOILAGE');

  const clean = await w.lot();
  await expectAppError(
    w.goodsReceipts.recordQualityCheck(
      w.admin,
      scope,
      clean.goodsReceiptId,
      body({ outcome: 'ACCEPTED', acceptedQtyKg: '100.000', rejectedQtyKg: '0.000', rejectionReasonCode: 'OTHER' }),
      `br120e-zero-${clean.goodsReceiptId}`,
    ),
    'VALIDATION_FAILED',
    422,
  );
  expect(await writes(w.tx, clean.goodsReceiptId)).toEqual({ status: 'AWAITING_QC', checks: 0, batches: 0 });

  // Without a code, a note or defect notes a rejected quantity is still refused, as before.
  const bare = await w.lot();
  await expectAppError(
    w.goodsReceipts.recordQualityCheck(w.admin, scope, bare.goodsReceiptId, body({ rejectionReason: undefined }), `br120e-bare-${bare.goodsReceiptId}`),
    'VALIDATION_FAILED',
    422,
  );
});

dbIt('BR-120f: the receipt read returns every stored addition, item conditions included; a plain check reads back zeros and nulls', async (w) => {
  const lot = await w.lot();
  const otherCrop = await insertCrop(w.tx);
  await w.goodsReceipts.recordQualityCheck(
    w.admin,
    w.scope('inventory.quality_check.perform'),
    lot.goodsReceiptId,
    body({
      damagedQtyKg: '10.000',
      spoiledQtyKg: '2.500',
      rejectionReasonCode: 'PHYSICAL_DAMAGE',
      actualCropId: otherCrop,
      cropMismatchQtyKg: '3.000',
      items: qcParameters.map((parameter) => ({
        parameter,
        score: 6,
        passed: parameter !== 'DAMAGE_PEST',
        condition: parameter === 'DAMAGE_PEST' ? 'POOR' : 'GOOD',
      })),
    }),
    `br120f-${lot.goodsReceiptId}`,
  );
  const read = await w.goodsReceipts.getById(w.admin, w.scope('inventory.goods_receipt.record'), lot.goodsReceiptId);
  expect(read.qualityCheck).toMatchObject({
    damagedQtyKg: '10.000',
    spoiledQtyKg: '2.500',
    rejectionReasonCode: 'PHYSICAL_DAMAGE',
    actualCropId: otherCrop,
    actualCropName: 'Fixture Crop',
    cropMismatchQtyKg: '3.000',
  });
  const conditions = Object.fromEntries((read.qualityCheck?.items ?? []).map((i) => [i.parameter, i.condition]));
  expect(conditions).toEqual({
    APPEARANCE: 'GOOD',
    SIZE_UNIFORMITY: 'GOOD',
    MOISTURE: 'GOOD',
    DAMAGE_PEST: 'POOR',
    FRESHNESS: 'GOOD',
  });

  const plain = await w.lot();
  await w.goodsReceipts.recordQualityCheck(w.admin, w.scope('inventory.quality_check.perform'), plain.goodsReceiptId, body(), `br120f-plain-${plain.goodsReceiptId}`);
  const plainRead = await w.goodsReceipts.getById(w.admin, w.scope('inventory.goods_receipt.record'), plain.goodsReceiptId);
  expect(plainRead.qualityCheck).toMatchObject({
    damagedQtyKg: '0.000',
    spoiledQtyKg: '0.000',
    rejectionReasonCode: null,
    actualCropId: null,
    actualCropName: null,
    cropMismatchQtyKg: null,
  });
  expect(plainRead.qualityCheck?.items?.every((i) => i.condition === null)).toBe(true);
});

dbIt('BR-120g: a replay with the same key and breakdown returns the same result and stocks once; a different breakdown on the key is 409', async (w) => {
  const lot = await w.lot();
  const scope = w.scope('inventory.quality_check.perform');
  const key = `br120g-${lot.goodsReceiptId}`;
  const first = await w.goodsReceipts.recordQualityCheck(w.admin, scope, lot.goodsReceiptId, body({ damagedQtyKg: '5.000' }), key);
  const replay = await w.goodsReceipts.recordQualityCheck(w.admin, scope, lot.goodsReceiptId, body({ damagedQtyKg: '5.000' }), key);
  expect(replay).toEqual(first);
  expect(await writes(w.tx, lot.goodsReceiptId)).toEqual({ status: 'PARTIALLY_ACCEPTED', checks: 1, batches: 1 });
  await expectAppError(
    w.goodsReceipts.recordQualityCheck(w.admin, scope, lot.goodsReceiptId, body({ damagedQtyKg: '6.000' }), key),
    'IDEMPOTENCY_KEY_REUSED',
    409,
  );
});
