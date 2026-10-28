/**
 * BR-123: an optional package count and unit on a goods receipt, both or neither.
 *
 *   1. Schema: the create body (no database).
 *   2. HTTP: 422 decided before any SQL (no database).
 *   3. PostgreSQL, rolled back (src/test/goodsReceiptWorld): stored and read back on every receipt
 *      read, never a quantity, idempotency unchanged (BR-118), and the table's own constraints.
 */
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { IDS, newId } from '../../test/factories.js';
import { inGoodsReceiptWorld, type GoodsReceiptWorld } from '../../test/goodsReceiptWorld.js';
import { createGoodsReceiptBody } from './goods-receipts.schema.js';

const CODE = 'inventory.goods_receipt.record';
const UNITS = ['CRATE', 'BAG', 'SACK', 'BOX', 'BUNDLE', 'TRAY', 'OTHER'];

const rawBody = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  purchaseOrderId: newId(),
  warehouseId: IDS.warehouseOoty,
  grossQtyKg: '40.000',
  ...overrides,
});

function refusedAt(input: Record<string, unknown>): string[] {
  const parsed = createGoodsReceiptBody.safeParse(input);
  expect(parsed.success, JSON.stringify(input)).toBe(false);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.path.join('.'));
}

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
// 1. Schema
// ---------------------------------------------------------------------------
describe('BR-123a: the package fields of the create body', () => {
  it('BR-123a: both are optional; without them the parsed body is exactly what it was before', () => {
    const parsed = createGoodsReceiptBody.parse(rawBody());
    expect(parsed).not.toHaveProperty('packageCount');
    expect(parsed).not.toHaveProperty('packageUnit');
  });

  it('BR-123a: packageCount is a JSON integer from 1 to 100000', () => {
    for (const packageCount of [1, 12, 100000]) {
      expect(createGoodsReceiptBody.parse(rawBody({ packageCount, packageUnit: 'CRATE' })).packageCount).toBe(packageCount);
    }
    for (const packageCount of [0, -1, 1.5, 100001, '12', null]) {
      expect(refusedAt(rawBody({ packageCount, packageUnit: 'CRATE' })), String(packageCount)).toContain('packageCount');
    }
  });

  it('BR-123a: packageUnit is one of the set', () => {
    for (const packageUnit of UNITS) {
      expect(createGoodsReceiptBody.parse(rawBody({ packageCount: 3, packageUnit })).packageUnit).toBe(packageUnit);
    }
    for (const packageUnit of ['crate', 'PALLET', '', 7]) {
      expect(refusedAt(rawBody({ packageCount: 3, packageUnit })), String(packageUnit)).toContain('packageUnit');
    }
  });

  it('BR-123a: one without the other is refused on the missing field', () => {
    expect(refusedAt(rawBody({ packageCount: 3 }))).toEqual(['packageUnit']);
    expect(refusedAt(rawBody({ packageUnit: 'BAG' }))).toEqual(['packageCount']);
  });
});

// ---------------------------------------------------------------------------
// 2. HTTP (decided before any SQL)
// ---------------------------------------------------------------------------
describe('BR-123b: a half package pair is 422 before any SQL', () => {
  const app = createApp();
  const sub = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }],
    farmerId: null,
    customerId: null,
  });

  it('BR-123b: packageCount without packageUnit is 422 VALIDATION_FAILED naming body.packageUnit', async () => {
    const res = await request(app)
      .post('/v1/admin/goods-receipts')
      .set('Authorization', `Bearer ${sub}`)
      .set('Idempotency-Key', randomUUID())
      .send(rawBody({ packageCount: 4 }));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.errors).toHaveProperty(['body.packageUnit']);
  });
});

// ---------------------------------------------------------------------------
// 3. PostgreSQL, rolled back
// ---------------------------------------------------------------------------
const dbReady = (): Promise<boolean> => requireDatabaseTables('goods_receipts', 'idempotency_keys', 'audit_log');

function dbIt(name: string, fn: (world: GoodsReceiptWorld) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inGoodsReceiptWorld(fn);
  });
}

async function receiptRows(db: Executor, purchaseOrderId: string) {
  const res = await db.query<{ id: string; gross: string; accepted: string; rejected: string; package_count: number | null; package_unit: string | null }>(
    `SELECT id, gross_qty_kg::text AS gross, accepted_qty_kg::text AS accepted, rejected_qty_kg::text AS rejected,
            package_count, package_unit
       FROM goods_receipts WHERE purchase_order_id = $1 ORDER BY created_at, id`,
    [purchaseOrderId],
  );
  return res.rows;
}

dbIt('BR-123c: packages are stored and returned on the create response, the list row and the detail; without them all three are null', async (w) => {
  const lot = await w.lot();
  const scope = w.scope(CODE);
  const withPackages = await w.goodsReceipts.createGoodsReceipt(
    w.admin,
    scope,
    createGoodsReceiptBody.parse(rawBody({ purchaseOrderId: lot.purchaseOrderId, warehouseId: w.ooty, packageCount: 12, packageUnit: 'CRATE' })),
    `br123c-a-${lot.purchaseOrderId}`,
  );
  const without = await w.goodsReceipts.createGoodsReceipt(
    w.admin,
    scope,
    createGoodsReceiptBody.parse(rawBody({ purchaseOrderId: lot.purchaseOrderId, warehouseId: w.ooty })),
    `br123c-b-${lot.purchaseOrderId}`,
  );
  expect(withPackages).toMatchObject({ packageCount: 12, packageUnit: 'CRATE', grossQtyKg: '40.000' });
  expect(without).toMatchObject({ packageCount: null, packageUnit: null });

  const detailWith = await w.goodsReceipts.getById(w.admin, scope, withPackages.id);
  const detailWithout = await w.goodsReceipts.getById(w.admin, scope, without.id);
  expect(detailWith).toMatchObject({ packageCount: 12, packageUnit: 'CRATE' });
  expect(detailWithout).toMatchObject({ packageCount: null, packageUnit: null });
  // The fixture's own receipt (created before this rule's columns were set) reads null / null too.
  expect(await w.goodsReceipts.getById(w.admin, scope, lot.goodsReceiptId)).toMatchObject({ packageCount: null, packageUnit: null });

  const list = await w.goodsReceipts.list(w.admin, scope, { limit: 100, purchaseOrderId: lot.purchaseOrderId });
  const byId = new Map(list.items.map((i) => [i.id, i]));
  expect(byId.get(withPackages.id)).toMatchObject({ packageCount: 12, packageUnit: 'CRATE' });
  expect(byId.get(without.id)).toMatchObject({ packageCount: null, packageUnit: null });

  // Descriptive only: the quantities are exactly the request's, nothing else moved. (One world
  // transaction: every row shares now(), so the order is not asserted.)
  const rows = await receiptRows(w.tx, lot.purchaseOrderId);
  expect(rows).toHaveLength(3);
  expect(rows).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: lot.goodsReceiptId, package_count: null, package_unit: null }),
    { id: withPackages.id, gross: '40.000', accepted: '0.000', rejected: '0.000', package_count: 12, package_unit: 'CRATE' },
    { id: without.id, gross: '40.000', accepted: '0.000', rejected: '0.000', package_count: null, package_unit: null },
  ]));
  const audit = await w.tx.query<{ after: Record<string, unknown> }>(
    `SELECT after FROM audit_log WHERE entity_id = $1 AND action_code = $2`,
    [withPackages.id, CODE],
  );
  expect(audit.rows).toHaveLength(1);
  expect(audit.rows[0]!.after).toMatchObject({ package_count: 12, package_unit: 'CRATE' });
});

dbIt('BR-123d: a replay with the same key and body returns the same response; a different, added or removed package value on the key is 409', async (w) => {
  const lot = await w.lot();
  const scope = w.scope(CODE);
  const body = (extra: Record<string, unknown> = {}) =>
    createGoodsReceiptBody.parse(rawBody({ purchaseOrderId: lot.purchaseOrderId, warehouseId: w.ooty, ...extra }));

  const key = `br123d-${lot.purchaseOrderId}`;
  const first = await w.goodsReceipts.createGoodsReceipt(w.admin, scope, body({ packageCount: 5, packageUnit: 'BAG' }), key);
  const replay = await w.goodsReceipts.createGoodsReceipt(w.admin, scope, body({ packageCount: 5, packageUnit: 'BAG' }), key);
  expect(replay).toEqual(JSON.parse(JSON.stringify(first)));
  await expectAppError(w.goodsReceipts.createGoodsReceipt(w.admin, scope, body({ packageCount: 6, packageUnit: 'BAG' }), key), 'IDEMPOTENCY_KEY_REUSED', 409);
  await expectAppError(w.goodsReceipts.createGoodsReceipt(w.admin, scope, body({ packageCount: 5, packageUnit: 'SACK' }), key), 'IDEMPOTENCY_KEY_REUSED', 409);
  await expectAppError(w.goodsReceipts.createGoodsReceipt(w.admin, scope, body(), key), 'IDEMPOTENCY_KEY_REUSED', 409);

  // A key first used WITHOUT packages: adding them later is a different request.
  const plainKey = `br123d-plain-${lot.purchaseOrderId}`;
  const plain = await w.goodsReceipts.createGoodsReceipt(w.admin, scope, body(), plainKey);
  expect(await w.goodsReceipts.createGoodsReceipt(w.admin, scope, body(), plainKey)).toEqual(JSON.parse(JSON.stringify(plain)));
  await expectAppError(w.goodsReceipts.createGoodsReceipt(w.admin, scope, body({ packageCount: 1, packageUnit: 'BOX' }), plainKey), 'IDEMPOTENCY_KEY_REUSED', 409);

  // The fixture's receipt plus exactly the two created here.
  expect(await receiptRows(w.tx, lot.purchaseOrderId)).toHaveLength(3);
});

dbIt('BR-123e: the table refuses a half pair, a count below 1 or above the bound, and a unit outside the set', async (w) => {
  const lot = await w.lot();
  const attempt = async (count: number | null, unit: string | null): Promise<string | undefined> => {
    await w.tx.query('SAVEPOINT br123e');
    try {
      await w.tx.query(`UPDATE goods_receipts SET package_count = $2, package_unit = $3 WHERE id = $1`, [lot.goodsReceiptId, count, unit]);
      await w.tx.query('RELEASE SAVEPOINT br123e');
      return undefined;
    } catch (error) {
      await w.tx.query('ROLLBACK TO SAVEPOINT br123e');
      return (error as { constraint?: string }).constraint;
    }
  };
  expect(await attempt(3, 'TRAY')).toBeUndefined();
  expect(await attempt(null, null)).toBeUndefined();
  expect(await attempt(3, null)).toBe('goods_receipts_package_pair_chk');
  expect(await attempt(null, 'BAG')).toBe('goods_receipts_package_pair_chk');
  expect(await attempt(0, 'BAG')).toBe('goods_receipts_package_count_chk');
  expect(await attempt(100001, 'BAG')).toBe('goods_receipts_package_count_chk');
  expect(await attempt(2, 'PALLET')).toBe('goods_receipts_package_unit_chk');
});
