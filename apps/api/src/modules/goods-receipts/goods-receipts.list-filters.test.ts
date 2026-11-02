/**
 * BR-122: text search and an Asia/Kolkata day range on the admin purchase-order and goods-receipt
 * lists.
 *
 *   1. Schema: the two query contracts (no database).
 *   2. HTTP: 422 decided before any SQL (no database).
 *   3. PostgreSQL, rolled back (src/test/goodsReceiptWorld): what `q` matches, that wildcards are
 *      literal, the IST day window, the unchanged BR-30 scope and keyset paging with filters.
 *
 * Every database test tags its rows with a fresh token and searches for it, so seeded or committed
 * rows of other suites can never match.
 */
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import { inGoodsReceiptWorld, type GoodsReceiptWorld, type IntakeLot } from '../../test/goodsReceiptWorld.js';
import { purchaseOrdersRepo } from '../purchase-orders/purchase-orders.repo.js';
import { listPurchaseOrdersQuery } from '../purchase-orders/purchase-orders.schema.js';
import { listGoodsReceiptsQuery } from './goods-receipts.schema.js';

const PO_CODE = 'purchase.order.view';
const GRN_CODE = 'inventory.goods_receipt.record';

const queries = [
  ['purchase orders', listPurchaseOrdersQuery],
  ['goods receipts', listGoodsReceiptsQuery],
] as const;

function refusedAt(schema: (typeof queries)[number][1], input: Record<string, unknown>): string[] {
  const parsed = schema.safeParse(input);
  expect(parsed.success, JSON.stringify(input)).toBe(false);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.path.join('.'));
}

// ---------------------------------------------------------------------------
// 1. Schema
// ---------------------------------------------------------------------------
describe('BR-122a: both list queries take q, from and to, strictly', () => {
  for (const [name, schema] of queries) {
    it(`BR-122a: ${name}: q is trimmed and must be 1-100 characters`, () => {
      expect(schema.parse({ q: '  GRN-2026  ' })).toMatchObject({ q: 'GRN-2026' });
      expect(schema.parse({ q: 'x'.repeat(100) }).q).toHaveLength(100);
      expect(refusedAt(schema, { q: '' })).toContain('q');
      expect(refusedAt(schema, { q: '   ' })).toContain('q');
      expect(refusedAt(schema, { q: 'x'.repeat(101) })).toContain('q');
      // Wildcards are allowed through the schema: the repo matches them literally.
      expect(schema.parse({ q: '100%_\\' }).q).toBe('100%_\\');
    });

    it(`BR-122a: ${name}: from and to are real YYYY-MM-DD dates, each optional, with from <= to`, () => {
      expect(schema.parse({ from: '2026-03-10', to: '2026-03-12' })).toMatchObject({ from: '2026-03-10', to: '2026-03-12' });
      expect(schema.parse({ from: '2026-03-10', to: '2026-03-10' })).toMatchObject({ from: '2026-03-10', to: '2026-03-10' });
      expect(schema.parse({ from: '2026-03-10' })).toMatchObject({ from: '2026-03-10' });
      expect(schema.parse({ to: '2026-03-10' })).toMatchObject({ to: '2026-03-10' });
      expect(refusedAt(schema, { from: '2026-02-30' })).toContain('from');
      expect(refusedAt(schema, { to: '2026-3-1' })).toContain('to');
      expect(refusedAt(schema, { from: '2026-03-10T00:00:00Z' })).toContain('from');
      expect(refusedAt(schema, { from: '2026-03-12', to: '2026-03-10' })).toContain('to');
    });

    it(`BR-122a: ${name}: the query is still strict and keeps its defaults`, () => {
      expect(schema.parse({}).limit).toBe(20);
      expect(refusedAt(schema, { search: 'x' })).toEqual(['']);
      expect(refusedAt(schema, { dateFrom: '2026-03-10' })).toEqual(['']);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. HTTP (decided before any SQL)
// ---------------------------------------------------------------------------
describe('BR-122b: an invalid search or range is 422 before any SQL', () => {
  const app = createApp();
  const sub = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }],
    farmerId: null,
    customerId: null,
  });

  for (const path of ['/v1/admin/purchase-orders', '/v1/admin/goods-receipts']) {
    it(`BR-122b: ${path} refuses from > to on query.to, a blank q and an unreal date`, async () => {
      const reversed = await request(app).get(`${path}?from=2026-03-12&to=2026-03-10`).set('Authorization', `Bearer ${sub}`);
      expect(reversed.status).toBe(422);
      expect(reversed.headers['content-type']).toContain('application/problem+json');
      expect(reversed.body.code).toBe('VALIDATION_FAILED');
      expect(reversed.body.errors).toHaveProperty(['query.to']);

      const blank = await request(app).get(`${path}?q=%20%20`).set('Authorization', `Bearer ${sub}`);
      expect(blank.status).toBe(422);
      expect(blank.body.errors).toHaveProperty(['query.q']);

      const unreal = await request(app).get(`${path}?from=2026-02-30`).set('Authorization', `Bearer ${sub}`);
      expect(unreal.status).toBe(422);
      expect(unreal.body.errors).toHaveProperty(['query.from']);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. PostgreSQL, rolled back
// ---------------------------------------------------------------------------
const dbReady = (): Promise<boolean> => requireDatabaseTables('goods_receipts', 'purchase_orders', 'crop_master', 'farmers', 'users');

function dbIt(name: string, fn: (world: GoodsReceiptWorld) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inGoodsReceiptWorld(fn);
  });
}

/** A short letters-only token, so it never collides with seeded names or with another test's. */
const freshToken = (): string => `zq${newId().replaceAll('-', '').slice(0, 10).replace(/[0-9]/g, (d) => 'abcdefghij'[Number(d)]!)}`;

interface LotNames {
  farmer?: string;
  crop?: string;
  poNumber?: string;
  grnNumber?: string;
  /** Sets both purchase_orders.issued_at and goods_receipts.received_at. */
  at?: string;
}

/** Renames the lot's farmer, crop, numbers and moves its timestamps (every row is the lot's own). */
async function shape(db: Executor, lot: IntakeLot, names: LotNames): Promise<IntakeLot> {
  if (names.farmer !== undefined) {
    await db.query(`UPDATE users SET full_name = $2 WHERE id = (SELECT user_id FROM farmers WHERE id = $1)`, [lot.farmerId, names.farmer]);
  }
  if (names.crop !== undefined) {
    await db.query(`UPDATE crop_master SET name = $2 WHERE id = $1`, [lot.cropId, names.crop]);
  }
  if (names.poNumber !== undefined) {
    await db.query(`UPDATE purchase_orders SET po_number = $2 WHERE id = $1`, [lot.purchaseOrderId, names.poNumber]);
  }
  if (names.grnNumber !== undefined) {
    await db.query(`UPDATE goods_receipts SET grn_number = $2 WHERE id = $1`, [lot.goodsReceiptId, names.grnNumber]);
  }
  if (names.at !== undefined) {
    await db.query(`UPDATE purchase_orders SET issued_at = $2::timestamptz WHERE id = $1`, [lot.purchaseOrderId, names.at]);
    await db.query(`UPDATE goods_receipts SET received_at = $2::timestamptz WHERE id = $1`, [lot.goodsReceiptId, names.at]);
  }
  return lot;
}

type Filters = { q?: string; from?: string; to?: string; cursor?: string; limit?: number; purchaseOrderId?: string };

async function poIds(w: GoodsReceiptWorld, filters: Filters, scope = unconfinedPo(w)): Promise<string[]> {
  const { purchaseOrderId: _ignored, ...rest } = filters;
  const res = await purchaseOrdersRepo.listPurchaseOrders(w.tx, scope, listPurchaseOrdersQuery.parse(rest));
  return res.items.map((i) => i.id);
}

async function grnIds(w: GoodsReceiptWorld, filters: Filters, scope = w.scope(GRN_CODE)): Promise<string[]> {
  const res = await w.goodsReceipts.list(w.admin, scope, listGoodsReceiptsQuery.parse(filters));
  return res.items.map((i) => i.id);
}

const unconfinedPo = (w: GoodsReceiptWorld) =>
  aScope({ level: ScopeLevel.ALL, permission: PO_CODE, roleCode: RoleCode.MAIN_WH_ADMIN, userId: w.adminId });

dbIt('BR-122c: q matches the PO number, farmer name and crop name of a purchase order, and the GRN number too on a receipt, case-insensitively', async (w) => {
  const t = freshToken();
  const T = t.toUpperCase();
  const a = await shape(w.tx, await w.lot(), { farmer: `Farmer ${t} Alpha`, crop: `Crop ${t} Kale`, poNumber: `PO-${T}-A`, grnNumber: `GRN-${T}-A` });
  const b = await shape(w.tx, await w.lot(), { farmer: `Farmer ${t} Bravo`, crop: `Crop ${t} Leek`, poNumber: `PO-${T}-B`, grnNumber: `GRN-${T}-B` });

  // farmer name, any case
  expect(await poIds(w, { q: `FARMER ${t} alpha` })).toEqual([a.purchaseOrderId]);
  expect(await grnIds(w, { q: `farmer ${T} ALPHA` })).toEqual([a.goodsReceiptId]);
  // crop name
  expect(await poIds(w, { q: `${t} leek` })).toEqual([b.purchaseOrderId]);
  expect(await grnIds(w, { q: `${t} LEEK` })).toEqual([b.goodsReceiptId]);
  // PO number: on both lists
  expect(await poIds(w, { q: `po-${t}-b` })).toEqual([b.purchaseOrderId]);
  expect(await grnIds(w, { q: `po-${t}-b` })).toEqual([b.goodsReceiptId]);
  // GRN number: on the receipt list only (a purchase order has no GRN number of its own)
  expect(await grnIds(w, { q: `grn-${t}-a` })).toEqual([a.goodsReceiptId]);
  expect(await poIds(w, { q: `grn-${t}-a` })).toEqual([]);
  // the token alone matches both, newest first (ties keep the existing order)
  expect((await poIds(w, { q: t })).sort()).toEqual([a.purchaseOrderId, b.purchaseOrderId].sort());
  expect((await grnIds(w, { q: t })).sort()).toEqual([a.goodsReceiptId, b.goodsReceiptId].sort());
});

dbIt('BR-122c: %, _ and \\ in q match only those characters, and an injection string is plain text', async (w) => {
  const t = freshToken();
  const pct = await shape(w.tx, await w.lot(), { crop: `Crop ${t} 100% Kale` });
  const noPct = await shape(w.tx, await w.lot(), { crop: `Crop ${t} 100X Kale` });
  const under = await shape(w.tx, await w.lot(), { crop: `Crop ${t} a_b` });
  const noUnder = await shape(w.tx, await w.lot(), { crop: `Crop ${t} axb` });
  const slash = await shape(w.tx, await w.lot(), { farmer: `Farmer ${t} back\\slash` });
  await shape(w.tx, await w.lot(), { farmer: `Farmer ${t} backslash` });

  expect(await poIds(w, { q: `${t} 100%` })).toEqual([pct.purchaseOrderId]);
  expect(await grnIds(w, { q: `${t} 100%` })).toEqual([pct.goodsReceiptId]);
  expect(await poIds(w, { q: `${t} a_b` })).toEqual([under.purchaseOrderId]);
  expect(await grnIds(w, { q: `${t} a_b` })).toEqual([under.goodsReceiptId]);
  expect(await poIds(w, { q: `${t} back\\s` })).toEqual([slash.purchaseOrderId]);
  expect(await grnIds(w, { q: `${t} back\\s` })).toEqual([slash.goodsReceiptId]);
  expect(noPct.purchaseOrderId).not.toBe(pct.purchaseOrderId);
  expect(noUnder.purchaseOrderId).not.toBe(under.purchaseOrderId);

  // `%` alone is a literal percent sign: inside one purchase order it matches only the one that has one.
  expect(await grnIds(w, { q: '%', purchaseOrderId: pct.purchaseOrderId })).toEqual([pct.goodsReceiptId]);
  expect(await grnIds(w, { q: '%', purchaseOrderId: noPct.purchaseOrderId })).toEqual([]);
  expect(await grnIds(w, { q: '_', purchaseOrderId: noUnder.purchaseOrderId })).toEqual([]);

  for (const q of [`${t}' OR '1'='1`, `${t}%' OR 1=1 --`, `${t}'); DROP TABLE goods_receipts; --`]) {
    expect(await poIds(w, { q }), q).toEqual([]);
    expect(await grnIds(w, { q }), q).toEqual([]);
  }
  const still = await w.tx.query(`SELECT count(*)::int AS n FROM goods_receipts WHERE id = $1`, [pct.goodsReceiptId]);
  expect(still.rows[0]).toEqual({ n: 1 });
});

dbIt('BR-122d: from and to are inclusive Asia/Kolkata days of issued_at and received_at', async (w) => {
  const t = freshToken();
  // 2026-03-10T18:45Z is 00:15 IST on 11 March; 18:15Z is 23:45 IST on 10 March.
  const early11 = await shape(w.tx, await w.lot(), { crop: `Crop ${t}`, at: '2026-03-10T18:45:00Z' });
  const late10 = await shape(w.tx, await w.lot(), { crop: `Crop ${t}`, at: '2026-03-10T18:15:00Z' });
  const on12 = await shape(w.tx, await w.lot(), { crop: `Crop ${t}`, at: '2026-03-12T10:00:00Z' });

  const cases: Array<[Filters, IntakeLot[]]> = [
    [{ from: '2026-03-11', to: '2026-03-11' }, [early11]],
    [{ from: '2026-03-10', to: '2026-03-10' }, [late10]],
    [{ from: '2026-03-10' }, [on12, early11, late10]],
    [{ to: '2026-03-11' }, [early11, late10]],
    [{ from: '2026-03-11', to: '2026-03-12' }, [on12, early11]],
    [{ from: '2026-03-13' }, []],
    [{ to: '2026-03-09' }, []],
  ];
  for (const [filters, expected] of cases) {
    const label = JSON.stringify(filters);
    expect(await poIds(w, { q: t, ...filters }), label).toEqual(expected.map((l) => l.purchaseOrderId));
    expect(await grnIds(w, { q: t, ...filters }), label).toEqual(expected.map((l) => l.goodsReceiptId));
  }
});

dbIt('BR-122e: the filters only narrow the scoped list: a confined caller never matches another warehouse\'s rows', async (w) => {
  const t = freshToken();
  const mine = await shape(w.tx, await w.lot(), { crop: `Crop ${t}`, at: '2026-04-02T06:00:00Z' });
  const foreign = await shape(w.tx, await w.lot(w.coonoor), { crop: `Crop ${t}`, at: '2026-04-02T07:00:00Z' });
  const filters = { q: t, from: '2026-04-02', to: '2026-04-02' };

  // Sub admin: purchase.order.view at `own`, inventory.goods_receipt.record at `all` confined by assignment.
  const subPo = aScope({ level: ScopeLevel.OWN, permission: PO_CODE, roleCode: RoleCode.SUB_WH_ADMIN, userId: w.adminId, warehouseIds: [w.ooty] });
  expect(await poIds(w, filters, subPo)).toEqual([mine.purchaseOrderId]);
  expect(await grnIds(w, filters)).toEqual([mine.goodsReceiptId]);
  // Naming the other warehouse is still an empty page, never a 403.
  expect(await grnIds(w, { ...filters, warehouseId: w.coonoor } as Filters)).toEqual([]);

  // Unconfined Main admin sees both, newest first.
  expect(await poIds(w, filters)).toEqual([foreign.purchaseOrderId, mine.purchaseOrderId]);
  const main = aScope({ level: ScopeLevel.ALL, permission: GRN_CODE, roleCode: RoleCode.MAIN_WH_ADMIN, userId: w.adminId });
  expect(await grnIds(w, filters, main)).toEqual([foreign.goodsReceiptId, mine.goodsReceiptId]);
});

dbIt('BR-122f: with filters set, paging one row at a time returns the full filtered list once each, and an existing-format cursor still works', async (w) => {
  const t = freshToken();
  const lots = [
    await shape(w.tx, await w.lot(), { crop: `Crop ${t}`, at: '2026-05-01T04:00:00Z' }),
    await shape(w.tx, await w.lot(), { crop: `Crop ${t}`, at: '2026-05-02T04:00:00Z' }),
    await shape(w.tx, await w.lot(), { crop: `Crop ${t}`, at: '2026-05-03T04:00:00Z' }),
    // outside the window: never on any page
    await shape(w.tx, await w.lot(), { crop: `Crop ${t}`, at: '2026-05-09T04:00:00Z' }),
  ];
  const filters = { q: t, from: '2026-05-01', to: '2026-05-03' };
  const expectedPo = [lots[2]!, lots[1]!, lots[0]!].map((l) => l.purchaseOrderId);
  const expectedGrn = [lots[2]!, lots[1]!, lots[0]!].map((l) => l.goodsReceiptId);

  const pagePo = async (cursor?: string) =>
    purchaseOrdersRepo.listPurchaseOrders(w.tx, unconfinedPo(w), listPurchaseOrdersQuery.parse({ ...filters, limit: 1, ...(cursor ? { cursor } : {}) }));
  const pageGrn = async (cursor?: string) =>
    w.goodsReceipts.list(w.admin, w.scope(GRN_CODE), listGoodsReceiptsQuery.parse({ ...filters, limit: 1, ...(cursor ? { cursor } : {}) }));

  const seenPo: string[] = [];
  let cursor: string | undefined;
  for (let guard = 0; guard < 10; guard += 1) {
    const page = await pagePo(cursor);
    seenPo.push(...page.items.map((i) => i.id));
    if (page.nextCursor === null) break;
    // The cursor keeps its existing format: the row's timestamp to the microsecond.
    expect(page.nextCursor).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/);
    cursor = page.nextCursor;
  }
  expect(seenPo).toEqual(expectedPo);

  const seenGrn: string[] = [];
  cursor = undefined;
  for (let guard = 0; guard < 10; guard += 1) {
    const page = await pageGrn(cursor);
    seenGrn.push(...page.items.map((i) => i.id));
    if (page.page.nextCursor === null) break;
    expect(page.page.nextCursor).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/);
    cursor = page.page.nextCursor;
  }
  expect(seenGrn).toEqual(expectedGrn);

  // A cursor built in the pre-existing format (no filters involved in it) still pages.
  const handBuilt = '2026-05-02T12:00:00.000000Z';
  expect(await poIds(w, { ...filters, cursor: handBuilt })).toEqual([lots[1]!.purchaseOrderId, lots[0]!.purchaseOrderId]);
  expect(await grnIds(w, { ...filters, cursor: handBuilt })).toEqual([lots[1]!.goodsReceiptId, lots[0]!.goodsReceiptId]);
});
