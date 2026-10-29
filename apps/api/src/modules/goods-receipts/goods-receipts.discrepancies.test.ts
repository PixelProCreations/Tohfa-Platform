/**
 * BR-121: persisted damage / mismatch reports on a goods receipt.
 *
 *   1. Schema: the body and query contract (no database).
 *   2. HTTP wiring: 401 / 403 / 422 that are decided before any SQL (no database).
 *   3. Unit: the service against a counting mock repo and the in-memory idempotency store.
 *   4. PostgreSQL, rolled back (src/test/goodsReceiptWorld): the real rows, audit, scope, paging,
 *      idempotency_keys and the table's own constraints.
 *
 * The invariants under test above all: a report never reaches another warehouse's receipt (BR-30),
 * is audited in its own transaction (BR-35), is never created in a status other than OPEN, and
 * changes nothing that is stocked (BR-106).
 */
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import type { Actor } from '../../auth/requireAuth.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, encodeKeysetCursor } from '../../http/keysetCursor.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { aScope, anActor, IDS, newId } from '../../test/factories.js';
import { inGoodsReceiptWorld, type GoodsReceiptWorld } from '../../test/goodsReceiptWorld.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import type { GoodsReceiptsRepo } from './goods-receipts.repo.js';
import {
  goodsReceiptDiscrepancyCreateBody,
  listGoodsReceiptDiscrepanciesQuery,
  qcParameters,
  qualityCheckCreateBody,
  type GoodsReceiptDiscrepancyCreateBody,
} from './goods-receipts.schema.js';
import { createGoodsReceiptsService } from './goods-receipts.service.js';

const POST_CODE = 'inventory.quality_check.perform';
const GET_CODE = 'inventory.goods_receipt.record';

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

const rawBody = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: 'DAMAGE',
  expected: '10 crates intact',
  actual: '2 crates crushed',
  ...overrides,
});

const body = (overrides: Record<string, unknown> = {}): GoodsReceiptDiscrepancyCreateBody =>
  goodsReceiptDiscrepancyCreateBody.parse(rawBody(overrides));

function refusedAt(input: Record<string, unknown>): string[] {
  const parsed = goodsReceiptDiscrepancyCreateBody.safeParse(input);
  expect(parsed.success, JSON.stringify(input)).toBe(false);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.path.join('.'));
}

// ---------------------------------------------------------------------------
// 1. Schema
// ---------------------------------------------------------------------------
describe('BR-121b: the discrepancy body is validated strictly', () => {
  it('BR-121b: every type in the set is accepted, anything else is refused on body.type', () => {
    for (const type of ['QUANTITY', 'QUALITY', 'CROP_MISMATCH', 'DAMAGE', 'OTHER']) {
      expect(goodsReceiptDiscrepancyCreateBody.safeParse(rawBody({ type })).success, type).toBe(true);
    }
    expect(refusedAt(rawBody({ type: 'SHORT' }))).toContain('type');
    expect(refusedAt(rawBody({ type: undefined }))).toContain('type');
  });

  it('BR-121b: expected and actual are required, trimmed, non-blank and at most 200 characters', () => {
    expect(body({ expected: '  10 crates  ', actual: '\t8 crates\n' })).toMatchObject({ expected: '10 crates', actual: '8 crates' });
    expect(refusedAt(rawBody({ expected: undefined }))).toContain('expected');
    expect(refusedAt(rawBody({ actual: undefined }))).toContain('actual');
    expect(refusedAt(rawBody({ expected: '   ' }))).toContain('expected');
    expect(refusedAt(rawBody({ actual: '' }))).toContain('actual');
    expect(refusedAt(rawBody({ expected: 'e'.repeat(201) }))).toContain('expected');
    expect(refusedAt(rawBody({ actual: 7 }))).toContain('actual');
    // 200 after trimming is the bound, surrounding spaces do not count against it
    expect(body({ expected: ` ${'e'.repeat(200)} ` }).expected).toHaveLength(200);
  });

  it('BR-121b: note is optional, trimmed, non-blank and at most 500 characters', () => {
    expect(body().note).toBeUndefined();
    expect(body({ note: '  photos at the dock ' }).note).toBe('photos at the dock');
    expect(refusedAt(rawBody({ note: '  ' }))).toContain('note');
    expect(refusedAt(rawBody({ note: 'n'.repeat(501) }))).toContain('note');
    expect(refusedAt(rawBody({ note: null }))).toContain('note');
  });

  it('BR-121b: status may be sent only as OPEN; a closed or unknown status and unknown keys are refused', () => {
    expect(body({ status: 'OPEN' }).status).toBe('OPEN');
    expect(body().status).toBeUndefined();
    for (const status of ['RESOLVED', 'CLOSED', 'open', '']) {
      expect(refusedAt(rawBody({ status }))).toContain('status');
    }
    expect(refusedAt(rawBody({ warehouseId: IDS.warehouseOoty }))).toEqual(['']);
    expect(refusedAt(rawBody({ createdBy: IDS.userSuperAdmin }))).toEqual(['']);
  });

  it('BR-121f: the list query takes a cursor this list produced and a limit of 1-100; anything else is refused', () => {
    expect(listGoodsReceiptDiscrepanciesQuery.parse({})).toEqual({ limit: 20 });
    const own = encodeKeysetCursor(CURSOR_TAGS.goodsReceiptDiscrepancies, { ts: '2026-10-26T10:00:00.000000Z', id: newId() });
    expect(listGoodsReceiptDiscrepanciesQuery.safeParse({ cursor: own }).success).toBe(true);
    const foreign = encodeKeysetCursor(CURSOR_TAGS.promotionRequests, { ts: '2026-10-26T10:00:00.000000Z', id: newId() });
    expect(listGoodsReceiptDiscrepanciesQuery.safeParse({ cursor: foreign }).success).toBe(false);
    expect(listGoodsReceiptDiscrepanciesQuery.safeParse({ cursor: 'garbage' }).success).toBe(false);
    expect(listGoodsReceiptDiscrepanciesQuery.safeParse({ limit: '0' }).success).toBe(false);
    expect(listGoodsReceiptDiscrepanciesQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(listGoodsReceiptDiscrepanciesQuery.safeParse({ status: 'OPEN' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 2. HTTP wiring (decided before any SQL)
// ---------------------------------------------------------------------------
describe('BR-121a: the discrepancy routes are wired to existing permission codes', () => {
  const app = createApp();
  const url = (id: string): string => `/v1/admin/goods-receipts/${id}/discrepancies`;
  const base = { farmerId: null, customerId: null };
  const tokens: Record<string, string> = {
    farmer: signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null }),
    customer: signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() }),
    farmerAdmin: signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base }),
    sub: signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }], ...base }),
  };
  const auth = (who: string): string => `Bearer ${tokens[who]}`;

  it('BR-121a: both routes are 401 without a token', async () => {
    const id = newId();
    const get = await request(app).get(url(id));
    const post = await request(app).post(url(id)).set('Idempotency-Key', randomUUID()).send(rawBody());
    expect(get.status).toBe(401);
    expect(post.status).toBe(401);
  });

  it('BR-121a: Farmer, Customer and Farmer Admin are 403 problem+json naming inventory.quality_check.perform on POST and inventory.goods_receipt.record on GET', async () => {
    const id = newId();
    for (const who of ['farmer', 'customer', 'farmerAdmin']) {
      const post = await request(app).post(url(id)).set('Authorization', auth(who)).set('Idempotency-Key', randomUUID()).send(rawBody());
      expect(post.status, `POST as ${who}`).toBe(403);
      expect(post.headers['content-type']).toContain('application/problem+json');
      expect(post.body.code).toBe('FORBIDDEN');
      expect(post.body.meta?.permission).toBe(POST_CODE);

      const get = await request(app).get(url(id)).set('Authorization', auth(who));
      expect(get.status, `GET as ${who}`).toBe(403);
      expect(get.body.meta?.permission).toBe(GET_CODE);
    }
  });

  it('BR-121a / BR-121e: a permitted caller without an Idempotency-Key, with a malformed id, body or query is 422 before any SQL', async () => {
    const id = newId();
    const noKey = await request(app).post(url(id)).set('Authorization', auth('sub')).send(rawBody());
    expect(noKey.status).toBe(422);
    expect(noKey.body.code).toBe('VALIDATION_FAILED');
    expect(noKey.body.errors).toHaveProperty(['header.Idempotency-Key']);

    const badId = await request(app).post(url('not-a-uuid')).set('Authorization', auth('sub')).set('Idempotency-Key', randomUUID()).send(rawBody());
    expect(badId.status).toBe(422);
    const badBody = await request(app).post(url(id)).set('Authorization', auth('sub')).set('Idempotency-Key', randomUUID()).send(rawBody({ status: 'RESOLVED' }));
    expect(badBody.status).toBe(422);
    const badQuery = await request(app).get(`${url(id)}?cursor=garbage`).set('Authorization', auth('sub'));
    expect(badQuery.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// 3. Unit: counting mock repo
// ---------------------------------------------------------------------------
describe('BR-121: the discrepancy service (unit)', () => {
  const WH = IDS.warehouseOoty;
  const OTHER_WH = IDS.warehouseCoonoor;
  const GRN_ID = '4a1c7b52-0000-4000-8000-0000000000b1';
  const FOREIGN_GRN_ID = '4a1c7b52-0000-4000-8000-0000000000b2';
  const sub: Actor = anActor({ userId: IDS.userSubWhAdmin, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: WH }] });
  const subScope = (permission: string): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, permission, roleCode: RoleCode.SUB_WH_ADMIN, userId: sub.userId, warehouseIds: [WH] });

  function harness() {
    const calls: Record<string, number> = {};
    const executors: Record<string, Executor[]> = {};
    const seen = (name: string, tx: Executor): void => {
      calls[name] = (calls[name] ?? 0) + 1;
      (executors[name] ??= []).push(tx);
    };
    const receipts: Record<string, string> = { [GRN_ID]: WH, [FOREIGN_GRN_ID]: OTHER_WH };
    const repo = {
      // The real filter is scopedWhere on gr.warehouse_id; a confined scope sees only its warehouses.
      findGoodsReceiptById: async (tx: Executor, id: string, scope: ResolvedScope) => {
        seen('findGoodsReceiptById', tx);
        const warehouseId = receipts[id];
        if (warehouseId === undefined) return null;
        if (scope.level !== ScopeLevel.ALL && !scope.warehouseIds.includes(warehouseId)) return null;
        return { id, warehouseId, status: 'ACCEPTED' };
      },
      insertDiscrepancy: async (tx: Executor, data: { goodsReceiptId: string; type: string; expected: string; actual: string; note: string | null; createdBy: string }) => {
        seen('insertDiscrepancy', tx);
        return {
          id: `d-${calls['insertDiscrepancy']}`,
          goodsReceiptId: data.goodsReceiptId,
          warehouseId: receipts[data.goodsReceiptId]!,
          type: data.type,
          expected: data.expected,
          actual: data.actual,
          status: 'OPEN',
          note: data.note,
          createdBy: data.createdBy,
          createdByName: 'Sub Admin',
          createdAt: '2026-10-26T06:00:00.000Z',
        };
      },
      listDiscrepancies: async (tx: Executor) => {
        seen('listDiscrepancies', tx);
        return { items: [], nextCursor: null, hasMore: false };
      },
      recordAudit: async (tx: Executor, entry: { actionCode: string; entityType: string; warehouseId?: string }) => {
        seen(`audit:${entry.actionCode}:${entry.entityType}:${entry.warehouseId}`, tx);
        return 'audit-1';
      },
    } as unknown as GoodsReceiptsRepo;
    const tx = { query: async () => ({ rows: [] }), name: 'tx' } as unknown as Executor;
    const db = { query: async () => ({ rows: [] }), name: 'db' } as unknown as Executor;
    let transactions = 0;
    const runTx = async <T>(fn: (e: Executor) => Promise<T>): Promise<T> => {
      transactions += 1;
      return fn(tx);
    };
    const service = createGoodsReceiptsService(repo, runTx, db, async () => {}, createInMemoryIdempotencyStore());
    return { service, calls, executors, tx, db, transactions: () => transactions };
  }

  it('BR-121c: a report is inserted OPEN for the caller, with one audit row on the SAME transaction executor', async () => {
    const h = harness();
    const created = await h.service.createDiscrepancy(sub, subScope(POST_CODE), GRN_ID, body({ note: 'dock photos' }), 'k-1');
    expect(created).toMatchObject({ goodsReceiptId: GRN_ID, warehouseId: WH, status: 'OPEN', createdBy: sub.userId, note: 'dock photos' });
    const auditKey = `audit:${POST_CODE}:goods_receipt_discrepancy:${WH}`;
    expect(h.calls).toEqual({ findGoodsReceiptById: 1, insertDiscrepancy: 1, [auditKey]: 1 });
    expect(h.transactions()).toBe(1);
    for (const name of ['findGoodsReceiptById', 'insertDiscrepancy', auditKey]) {
      expect(h.executors[name]?.[0], name).toBe(h.tx);
    }
  });

  it('BR-121d: another warehouse\'s receipt and an unknown id are the same 404 on POST and GET, and nothing is written', async () => {
    const h = harness();
    const unknown = newId();
    const foreignPost = await expectAppError(h.service.createDiscrepancy(sub, subScope(POST_CODE), FOREIGN_GRN_ID, body(), 'k-f'), 'NOT_FOUND', 404);
    const unknownPost = await expectAppError(h.service.createDiscrepancy(sub, subScope(POST_CODE), unknown, body(), 'k-u'), 'NOT_FOUND', 404);
    expect(foreignPost.detail?.replace(FOREIGN_GRN_ID, 'X')).toBe(unknownPost.detail?.replace(unknown, 'X'));
    const foreignGet = await expectAppError(h.service.listDiscrepancies(sub, subScope(GET_CODE), FOREIGN_GRN_ID, { limit: 20 }), 'NOT_FOUND', 404);
    const unknownGet = await expectAppError(h.service.listDiscrepancies(sub, subScope(GET_CODE), unknown, { limit: 20 }), 'NOT_FOUND', 404);
    expect(foreignGet.detail?.replace(FOREIGN_GRN_ID, 'X')).toBe(unknownGet.detail?.replace(unknown, 'X'));
    expect(h.calls['insertDiscrepancy']).toBeUndefined();
    expect(h.calls['listDiscrepancies']).toBeUndefined();
    expect(Object.keys(h.calls).filter((k) => k.startsWith('audit:'))).toEqual([]);
  });

  it('BR-121e: a missing or blank Idempotency-Key is 422 naming the header, and nothing is read or written', async () => {
    const h = harness();
    for (const key of [undefined, '', '   ']) {
      const error = await expectAppError(h.service.createDiscrepancy(sub, subScope(POST_CODE), GRN_ID, body(), key), 'VALIDATION_FAILED', 422);
      expect(error.errors).toHaveProperty(['header.Idempotency-Key']);
    }
    expect(h.calls).toEqual({});
  });

  it('BR-121e: a replay returns the identical body and writes once; the same key with another body or receipt is 409', async () => {
    const h = harness();
    const first = await h.service.createDiscrepancy(sub, subScope(POST_CODE), GRN_ID, body(), 'k-r');
    const replay = await h.service.createDiscrepancy(sub, subScope(POST_CODE), GRN_ID, body(), 'k-r');
    expect(replay).toEqual(first);
    // OPEN sent explicitly is the same request as OPEN by default
    const replayWithOpen = await h.service.createDiscrepancy(sub, subScope(POST_CODE), GRN_ID, body({ status: 'OPEN' }), 'k-r');
    expect(replayWithOpen).toEqual(first);
    expect(h.calls['insertDiscrepancy']).toBe(1);
    await expectAppError(h.service.createDiscrepancy(sub, subScope(POST_CODE), GRN_ID, body({ actual: '3 crates crushed' }), 'k-r'), 'IDEMPOTENCY_KEY_REUSED', 409);
    await expectAppError(h.service.createDiscrepancy(sub, subScope(POST_CODE), newId(), body(), 'k-r'), 'IDEMPOTENCY_KEY_REUSED', 409);
    expect(h.calls['insertDiscrepancy']).toBe(1);
  });

  it('BR-121f: the list reads on the pool, never inside a transaction, after the receipt passed the scope filter', async () => {
    const h = harness();
    const page = await h.service.listDiscrepancies(sub, subScope(GET_CODE), GRN_ID, { limit: 20 });
    expect(page).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
    expect(h.executors['findGoodsReceiptById']).toEqual([h.db]);
    expect(h.executors['listDiscrepancies']).toEqual([h.db]);
    expect(h.transactions()).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. PostgreSQL, rolled back
// ---------------------------------------------------------------------------
const dbReady = (): Promise<boolean> =>
  requireDatabaseTables('goods_receipts', 'goods_receipt_discrepancies', 'quality_checks', 'inventory_batches', 'audit_log', 'idempotency_keys');

function dbIt(name: string, fn: (world: GoodsReceiptWorld) => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await dbReady())) return ctx.skip();
    await inGoodsReceiptWorld(fn);
  });
}

async function reportsOf(db: Executor, goodsReceiptId: string) {
  const res = await db.query<{ id: string; warehouse_id: string; type: string; expected: string; actual: string; status: string; note: string | null; created_by: string }>(
    `SELECT id, warehouse_id, type, expected, actual, status, note, created_by
       FROM goods_receipt_discrepancies WHERE goods_receipt_id = $1 ORDER BY created_at, id`,
    [goodsReceiptId],
  );
  return res.rows;
}

async function auditRowsFor(db: Executor, entityIds: string[]) {
  const res = await db.query<{ action_code: string; entity_type: string; entity_id: string; warehouse_id: string; actor_id: string }>(
    `SELECT action_code, entity_type, entity_id, warehouse_id, actor_id
       FROM audit_log WHERE entity_id = ANY($1::uuid[]) AND entity_type = 'goods_receipt_discrepancy'`,
    [entityIds],
  );
  return res.rows;
}

async function receiptState(db: Executor, goodsReceiptId: string) {
  const res = await db.query(
    `SELECT gr.status::text AS status, gr.accepted_qty_kg::text AS accepted, gr.rejected_qty_kg::text AS rejected,
            gr.updated_at IS NOT NULL AS touched,
            (SELECT count(*)::int FROM quality_checks qc WHERE qc.goods_receipt_id = gr.id) AS checks,
            (SELECT count(*)::int FROM inventory_batches ib WHERE ib.goods_receipt_id = gr.id) AS batches,
            (SELECT count(*)::int FROM stock_ledger sl WHERE sl.ref_id = gr.id) AS "ledgerRows"
       FROM goods_receipts gr WHERE gr.id = $1`,
    [goodsReceiptId],
  );
  return res.rows[0] as Record<string, unknown>;
}

dbIt('BR-121c: a report on a receipt in scope is stored OPEN with the receipt\'s warehouse and the caller, audited once, and changes nothing else', async (w) => {
  const lot = await w.lot();
  const before = await receiptState(w.tx, lot.goodsReceiptId);
  const created = await w.goodsReceipts.createDiscrepancy(
    w.admin,
    w.scope(POST_CODE),
    lot.goodsReceiptId,
    body({ type: 'QUANTITY', expected: ' 100 kg ', actual: '96 kg', note: 'Scale reading at the dock.' }),
    `br121c-${lot.goodsReceiptId}`,
  );
  expect(created).toEqual({
    id: expect.any(String),
    goodsReceiptId: lot.goodsReceiptId,
    warehouseId: w.ooty,
    type: 'QUANTITY',
    expected: '100 kg',
    actual: '96 kg',
    status: 'OPEN',
    note: 'Scale reading at the dock.',
    createdBy: w.adminId,
    createdByName: w.adminName,
    createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
  });
  expect(await reportsOf(w.tx, lot.goodsReceiptId)).toEqual([
    {
      id: created.id,
      warehouse_id: w.ooty,
      type: 'QUANTITY',
      expected: '100 kg',
      actual: '96 kg',
      status: 'OPEN',
      note: 'Scale reading at the dock.',
      created_by: w.adminId,
    },
  ]);
  expect(await auditRowsFor(w.tx, [created.id])).toEqual([
    { action_code: POST_CODE, entity_type: 'goods_receipt_discrepancy', entity_id: created.id, warehouse_id: w.ooty, actor_id: w.adminId },
  ]);
  expect(await receiptState(w.tx, lot.goodsReceiptId)).toEqual(before);
});

dbIt('BR-121c: a report is accepted after the quality check too, and leaves the check, the batch and the ledger as they were (BR-106)', async (w) => {
  const lot = await w.lot();
  await w.goodsReceipts.recordQualityCheck(
    w.admin,
    w.scope(POST_CODE),
    lot.goodsReceiptId,
    qualityCheckCreateBody.parse({
      assignedGrade: 'GRADE_1',
      outcome: 'ACCEPTED',
      acceptedQtyKg: '100.000',
      items: qcParameters.map((parameter) => ({ parameter, score: 8, passed: true })),
    }),
    `br121c-qc-${lot.goodsReceiptId}`,
  );
  const before = await receiptState(w.tx, lot.goodsReceiptId);
  expect(before).toMatchObject({ status: 'ACCEPTED', checks: 1, batches: 1, ledgerRows: 1 });
  await w.goodsReceipts.createDiscrepancy(w.admin, w.scope(POST_CODE), lot.goodsReceiptId, body(), `br121c-after-${lot.goodsReceiptId}`);
  expect(await receiptState(w.tx, lot.goodsReceiptId)).toEqual(before);
  expect(await reportsOf(w.tx, lot.goodsReceiptId)).toHaveLength(1);
});

dbIt('BR-121d: a confined Sub admin gets the same 404 for another warehouse\'s receipt as for an unknown id, on POST and GET, and nothing is written', async (w) => {
  const foreign = await w.lot(w.coonoor);
  const unknown = newId();
  const post = (id: string) => w.goodsReceipts.createDiscrepancy(w.admin, w.scope(POST_CODE), id, body(), `br121d-${id}`);
  const get = (id: string) => w.goodsReceipts.listDiscrepancies(w.admin, w.scope(GET_CODE), id, { limit: 20 });
  const foreignPost = await expectAppError(post(foreign.goodsReceiptId), 'NOT_FOUND', 404);
  const unknownPost = await expectAppError(post(unknown), 'NOT_FOUND', 404);
  expect(foreignPost.detail?.replace(foreign.goodsReceiptId, 'X')).toBe(unknownPost.detail?.replace(unknown, 'X'));
  const foreignGet = await expectAppError(get(foreign.goodsReceiptId), 'NOT_FOUND', 404);
  const unknownGet = await expectAppError(get(unknown), 'NOT_FOUND', 404);
  expect(foreignGet.detail?.replace(foreign.goodsReceiptId, 'X')).toBe(unknownGet.detail?.replace(unknown, 'X'));
  expect(await reportsOf(w.tx, foreign.goodsReceiptId)).toEqual([]);
  const keys = await w.tx.query(`SELECT 1 FROM idempotency_keys WHERE idempotency_key = ANY($1::text[])`, [[`br121d-${foreign.goodsReceiptId}`, `br121d-${unknown}`]]);
  expect(keys.rows).toEqual([]);

  // A caller with no assigned warehouse (Main / Super) reaches it.
  const unconfined = aScope({ level: ScopeLevel.ALL, permission: POST_CODE, roleCode: RoleCode.MAIN_WH_ADMIN, userId: w.adminId });
  const created = await w.goodsReceipts.createDiscrepancy(w.admin, unconfined, foreign.goodsReceiptId, body(), `br121d-main-${foreign.goodsReceiptId}`);
  expect(created.warehouseId).toBe(w.coonoor);
});

dbIt('BR-121e: a replay with the same key returns the same body and leaves one report and one audit row; another body or receipt on the key is 409', async (w) => {
  const lot = await w.lot();
  const other = await w.lot();
  const key = `br121e-${lot.goodsReceiptId}`;
  const scope = w.scope(POST_CODE);
  const first = await w.goodsReceipts.createDiscrepancy(w.admin, scope, lot.goodsReceiptId, body(), key);
  const replay = await w.goodsReceipts.createDiscrepancy(w.admin, scope, lot.goodsReceiptId, body(), key);
  expect(replay).toEqual(JSON.parse(JSON.stringify(first)));
  await expectAppError(w.goodsReceipts.createDiscrepancy(w.admin, scope, lot.goodsReceiptId, body({ type: 'OTHER' }), key), 'IDEMPOTENCY_KEY_REUSED', 409);
  await expectAppError(w.goodsReceipts.createDiscrepancy(w.admin, scope, other.goodsReceiptId, body(), key), 'IDEMPOTENCY_KEY_REUSED', 409);
  expect(await reportsOf(w.tx, lot.goodsReceiptId)).toHaveLength(1);
  expect(await reportsOf(w.tx, other.goodsReceiptId)).toEqual([]);
  expect(await auditRowsFor(w.tx, [first.id])).toHaveLength(1);
});

dbIt('BR-121f: the list is newest first, pages by (createdAt, id) without skipping or repeating ties, and is empty for a receipt without reports', async (w) => {
  const lot = await w.lot();
  const empty = await w.lot();
  const scope = w.scope(GET_CODE);
  expect(await w.goodsReceipts.listDiscrepancies(w.admin, scope, empty.goodsReceiptId, { limit: 20 })).toEqual({
    items: [],
    page: { nextCursor: null, hasMore: false },
  });

  // Five reports; the world is one transaction, so now() is the SAME instant for all of them: every
  // row ties on created_at and only the id orders them. Paging must still visit each exactly once.
  const ids: string[] = [];
  for (let i = 0; i < 5; i += 1) {
    const created = await w.goodsReceipts.createDiscrepancy(
      w.admin,
      w.scope(POST_CODE),
      lot.goodsReceiptId,
      body({ expected: `expected ${i}` }),
      `br121f-${i}-${lot.goodsReceiptId}`,
    );
    ids.push(created.id);
  }
  // One older report, so "newest first" is visible across distinct timestamps too.
  const older = await w.tx.query<{ id: string }>(
    `INSERT INTO goods_receipt_discrepancies (goods_receipt_id, warehouse_id, type, expected, actual, created_by, created_at)
     VALUES ($1, $2, 'OTHER', 'older', 'older', $3, now() - interval '1 hour') RETURNING id`,
    [lot.goodsReceiptId, w.ooty, w.adminId],
  );

  const full = await w.goodsReceipts.listDiscrepancies(w.admin, scope, lot.goodsReceiptId, { limit: 100 });
  const expectedOrder = [...ids].sort().reverse().concat(older.rows[0]!.id);
  expect(full.items.map((i) => i.id)).toEqual(expectedOrder);
  expect(full.page).toEqual({ nextCursor: null, hasMore: false });

  const paged: string[] = [];
  let cursor: string | undefined;
  for (let guard = 0; guard < 10; guard += 1) {
    const page = await w.goodsReceipts.listDiscrepancies(w.admin, scope, lot.goodsReceiptId, { limit: 2, ...(cursor === undefined ? {} : { cursor }) });
    paged.push(...page.items.map((i) => i.id));
    expect(page.page.hasMore).toBe(page.page.nextCursor !== null);
    if (page.page.nextCursor === null) break;
    cursor = page.page.nextCursor;
  }
  expect(paged).toEqual(expectedOrder);

  // Rows of another receipt never appear.
  await w.goodsReceipts.createDiscrepancy(w.admin, w.scope(POST_CODE), empty.goodsReceiptId, body(), `br121f-other-${empty.goodsReceiptId}`);
  const again = await w.goodsReceipts.listDiscrepancies(w.admin, scope, lot.goodsReceiptId, { limit: 100 });
  expect(again.items.every((i) => i.goodsReceiptId === lot.goodsReceiptId)).toBe(true);
});

dbIt('BR-121g: the table refuses a type or status outside the sets, blank or over-long text, and a warehouse that is not the receipt\'s', async (w) => {
  const lot = await w.lot();
  const attempt = async (overrides: Partial<Record<'type' | 'status' | 'expected' | 'actual' | 'note' | 'warehouse_id', string>>): Promise<string | undefined> => {
    const row = { type: 'DAMAGE', status: 'OPEN', expected: 'e', actual: 'a', note: null as string | null, warehouse_id: w.ooty, ...overrides };
    await w.tx.query('SAVEPOINT br121g');
    try {
      await w.tx.query(
        `INSERT INTO goods_receipt_discrepancies (goods_receipt_id, warehouse_id, type, expected, actual, status, note, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [lot.goodsReceiptId, row.warehouse_id, row.type, row.expected, row.actual, row.status, row.note, w.adminId],
      );
      await w.tx.query('RELEASE SAVEPOINT br121g');
      return undefined;
    } catch (error) {
      await w.tx.query('ROLLBACK TO SAVEPOINT br121g');
      return (error as { constraint?: string }).constraint;
    }
  };
  expect(await attempt({})).toBeUndefined();
  expect(await attempt({ type: 'SHORT' })).toBe('goods_receipt_discrepancies_type_chk');
  expect(await attempt({ status: 'RESOLVED' })).toBe('goods_receipt_discrepancies_status_chk');
  expect(await attempt({ expected: '   ' })).toBe('goods_receipt_discrepancies_expected_chk');
  expect(await attempt({ actual: 'a'.repeat(201) })).toBe('goods_receipt_discrepancies_actual_chk');
  expect(await attempt({ note: ' ' })).toBe('goods_receipt_discrepancies_note_chk');
  expect(await attempt({ warehouse_id: w.coonoor })).toBe('goods_receipt_discrepancies_receipt_fk');
});
