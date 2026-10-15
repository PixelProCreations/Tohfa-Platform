/**
 * BR-104: the warehouse activity feed, a read-only, scoped UNION over existing records.
 *
 *  a  query validation: types, real dates with from <= to, span cap, limit 1-100, malformed cursor 422, strict
 *  b  each of the six sources appears with its documented fields, newest first, only for the requested warehouse
 *  c  cursor paging over a fixed fixture returns every event exactly once across pages
 *  d  the type and date filters narrow the result
 *  e  scope: another and an unknown warehouse are the same 404 for a Sub admin; 401 without a token;
 *     403 for farmer, customer and Farmer Admin
 *  f  no event carries a farmer id, customer data or free text; reading writes nothing; there is no write route
 *
 * Layers: schema and cursor tests (no I/O), service unit tests against a mocked repo and a recording fake
 * database, SQL-shape tests of the query builder, service tests against real Postgres in a rolled-back
 * transaction, and real-HTTP tests through the real app router.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type pg from 'pg';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import {
  activityQuery,
  activityTypes,
  decodeActivityCursor,
  encodeActivityCursor,
  type ActivityCursor,
  type ActivityQuery,
  type ActivityType,
} from './warehouse-activity.schema.js';
import { createWarehouseActivityService } from './warehouse-activity.service.js';
import {
  buildActivityQuery,
  warehouseActivityRepo,
  type ActivityFilter,
  type ActivityRow,
  type WarehouseActivityRepo,
} from './warehouse-activity.repo.js';
import { inRolledBackTx, loadWarehouseIds, startHttpHarness, type HttpHarness, type WarehouseIds } from './testkit.js';

const FROM = '2033-03-10';
const TO = '2033-03-11';

const aCursor = (overrides: Partial<ActivityCursor> = {}): ActivityCursor => ({
  occurredAt: '2033-03-10T05:00:00.123456Z',
  type: 'ISSUE',
  sourceId: newId(),
  ...overrides,
});

// ===========================================================================
// 1. Schema and cursor (no I/O)
// ===========================================================================
describe('warehouse activity query schema', () => {
  it('BR-104a: everything is optional, limit defaults to 20 and the query is strict', () => {
    expect(activityQuery.parse({})).toEqual({ limit: 20 });
    for (const extra of [{ warehouseId: newId() }, { farmerId: newId() }, { sort: 'asc' }, { page: '2' }]) {
      expect(activityQuery.safeParse(extra).success, JSON.stringify(extra)).toBe(false);
    }
  });

  it('BR-104a: type is a comma-separated list of the six types, de-duplicated; anything else is refused', () => {
    expect(activityQuery.parse({ type: 'ISSUE' }).type).toEqual(['ISSUE']);
    expect(activityQuery.parse({ type: 'TRANSFER,RETURN,TRANSFER' }).type).toEqual(['TRANSFER', 'RETURN']);
    expect(activityQuery.parse({ type: activityTypes.join(',') }).type).toEqual([...activityTypes]);
    for (const type of ['', ',', 'ISSUE,', 'issue', 'ORDER', 'ISSUE,ORDER', ' ISSUE', ['ISSUE', 'RETURN'], 3]) {
      expect(activityQuery.safeParse({ type }).success, JSON.stringify(type)).toBe(false);
    }
  });

  it('BR-104a: from and to are real dates, given together, with from <= to', () => {
    expect(activityQuery.safeParse({ from: FROM, to: TO }).success).toBe(true);
    expect(activityQuery.safeParse({ from: FROM, to: FROM }).success).toBe(true);
    for (const bad of [
      { from: FROM },
      { to: TO },
      { from: TO, to: FROM },
      { from: '2033-02-30', to: TO },
      { from: '2033-3-10', to: TO },
      { from: FROM, to: '2033-03-11T00:00:00Z' },
    ]) {
      expect(activityQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-104a: limit is an integer 1-100', () => {
    expect(activityQuery.parse({ limit: '1' }).limit).toBe(1);
    expect(activityQuery.parse({ limit: '100' }).limit).toBe(100);
    for (const limit of ['0', '101', '-1', '1.5', 'ten', '']) {
      expect(activityQuery.safeParse({ limit }).success, limit).toBe(false);
    }
  });

  it('BR-104a: a malformed cursor is refused on cursor; a cursor of this endpoint is accepted', () => {
    expect(activityQuery.safeParse({ cursor: encodeActivityCursor(aCursor()) }).success).toBe(true);
    for (const cursor of ['', 'not-base64!', 'abc', 'x'.repeat(513), Buffer.from('["a","b"]').toString('base64url')]) {
      const result = activityQuery.safeParse({ cursor });
      expect(result.success, cursor).toBe(false);
      if (!result.success) expect(result.error.issues[0]?.path).toEqual(['cursor']);
    }
  });
});

describe('warehouse activity cursor', () => {
  it('BR-104c: a cursor round-trips exactly, microseconds included, and is opaque', () => {
    const cursor = aCursor({ occurredAt: '2033-03-10T05:00:00.000001Z', type: 'STOCK_MOVEMENT' });
    const encoded = encodeActivityCursor(cursor);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encoded).not.toContain(cursor.sourceId);
    expect(decodeActivityCursor(encoded)).toEqual(cursor);
  });

  it('BR-104a: a malformed cursor decodes to null, never throws', () => {
    const enc = (value: unknown) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
    const good = aCursor();
    for (const raw of [
      '',
      '%%%',
      Buffer.from('not json').toString('base64url'),
      enc({ occurredAt: good.occurredAt }),
      enc([good.occurredAt, good.type]),
      enc([good.occurredAt, good.type, good.sourceId, 'extra']),
      enc([good.occurredAt, 'ORDER', good.sourceId]),
      enc([good.occurredAt, good.type, 'not-a-uuid']),
      enc(['2033-03-10', good.type, good.sourceId]),
      enc(['2033-03-10T05:00:00Z', good.type, good.sourceId]),
      enc(['2033-02-30T05:00:00.000000Z', good.type, good.sourceId]),
      enc(['2033-03-10T25:00:00.000000Z', good.type, good.sourceId]),
      enc([1, good.type, good.sourceId]),
    ]) {
      expect(decodeActivityCursor(raw), raw).toBeNull();
    }
  });
});

// ===========================================================================
// 2. Service against a mocked repo and a recording fake database
// ===========================================================================

/** A fake Executor that answers the warehouse-existence probe and records every statement it is given. */
function recordingDb(knownWarehouses: string[]): Executor & { statements: string[] } {
  const statements: string[] = [];
  return {
    statements,
    async query<R extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params: unknown[] = []) {
      statements.push(sql);
      if (/FROM warehouses/.test(sql)) {
        const found = knownWarehouses.includes(String(params[0]));
        return { rows: found ? [{ '?column?': 1 }] : [], rowCount: found ? 1 : 0 } as unknown as pg.QueryResult<R>;
      }
      return { rows: [], rowCount: 0 } as unknown as pg.QueryResult<R>;
    },
  };
}

function anEvent(overrides: Partial<ActivityRow> = {}): ActivityRow {
  return {
    type: 'STOCK_MOVEMENT',
    sourceId: newId(),
    occurredAt: '2033-03-10T05:00:00.000000Z',
    reference: 'RECEIPT',
    status: null,
    severity: null,
    qtyKg: '10.000',
    direction: null,
    actorId: null,
    ...overrides,
  };
}

function fakeRepo(rows: ActivityRow[], maxRangeDays = 366): WarehouseActivityRepo & { calls: ActivityFilter[] } {
  const calls: ActivityFilter[] = [];
  return {
    calls,
    async maxRangeDays() {
      return maxRangeDays;
    },
    async page(_db, filter) {
      calls.push(filter);
      return rows.slice(0, filter.limit + 1);
    },
  };
}

describe('warehouse activity service (mocked repo)', () => {
  const OOTY = newId();
  const COONOOR = newId();
  const sub = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [OOTY], permission: 'warehouse.activity.view' });
  const main = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission: 'warehouse.activity.view' });
  const q = (overrides: Partial<ActivityQuery> = {}): ActivityQuery => ({ limit: 20, ...overrides });

  it('BR-104e: another and an unknown warehouse are the same 404 and the feed is never queried', async () => {
    const repo = fakeRepo([anEvent()]);
    const db = recordingDb([OOTY, COONOOR]);
    const svc = createWarehouseActivityService({ repo, db });
    const subWide = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [OOTY], permission: 'warehouse.activity.view' });
    const shapes = new Set<string>();
    for (const [scope, id] of [[sub, COONOOR], [sub, newId()], [subWide, COONOOR], [main, newId()]] as const) {
      const error = await svc.list(scope, id, q()).then(() => null, (e: unknown) => e);
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).status).toBe(404);
      expect((error as AppError).code).toBe('NOT_FOUND');
      shapes.add(`${(error as AppError).message.replace(/[0-9a-f-]{36}/g, '<id>')}|${JSON.stringify((error as AppError).errors)}`);
    }
    expect(shapes.size).toBe(1);
    expect(repo.calls).toHaveLength(0);
    expect((await svc.list(sub, OOTY, q())).items).toHaveLength(1);
    expect((await svc.list(main, COONOOR, q())).items).toHaveLength(1);
  });

  it('BR-104c: nextCursor is set only when there is another page, and encodes the last returned event', async () => {
    const rows = [
      anEvent({ occurredAt: '2033-03-10T05:00:03.000003Z' }),
      anEvent({ occurredAt: '2033-03-10T05:00:02.000002Z', type: 'ISSUE' }),
      anEvent({ occurredAt: '2033-03-10T05:00:01.000001Z' }),
    ];
    const svc = createWarehouseActivityService({ repo: fakeRepo(rows), db: recordingDb([OOTY]) });

    const first = await svc.list(sub, OOTY, q({ limit: 2 }));
    expect(first.items.map((item) => item.sourceId)).toEqual([rows[0]!.sourceId, rows[1]!.sourceId]);
    expect(first.page.hasMore).toBe(true);
    expect(decodeActivityCursor(first.page.nextCursor!)).toEqual({
      occurredAt: rows[1]!.occurredAt,
      type: 'ISSUE',
      sourceId: rows[1]!.sourceId,
    });

    const exact = await svc.list(sub, OOTY, q({ limit: 3 }));
    expect(exact.items).toHaveLength(3);
    expect(exact.page).toEqual({ nextCursor: null, hasMore: false });

    const empty = await createWarehouseActivityService({ repo: fakeRepo([]), db: recordingDb([OOTY]) }).list(sub, OOTY, q());
    expect(empty).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
  });

  it('BR-104c/d: the decoded cursor, types, dates and limit reach the repo unchanged', async () => {
    const repo = fakeRepo([]);
    const svc = createWarehouseActivityService({ repo, db: recordingDb([OOTY]) });
    const cursor = aCursor();
    await svc.list(sub, OOTY, q({ type: ['ISSUE', 'RETURN'], from: FROM, to: TO, cursor: encodeActivityCursor(cursor), limit: 7 }));
    expect(repo.calls).toEqual([{ warehouseId: OOTY, types: ['ISSUE', 'RETURN'], from: FROM, to: TO, cursor, limit: 7 }]);

    await svc.list(sub, OOTY, q());
    expect(repo.calls[1]).toEqual({ warehouseId: OOTY, types: [...activityTypes], limit: 20 });
  });

  it('BR-104a: a malformed cursor reaching the service is 422 VALIDATION_FAILED on query.cursor', async () => {
    const repo = fakeRepo([]);
    const svc = createWarehouseActivityService({ repo, db: recordingDb([OOTY]) });
    const error = await svc.list(sub, OOTY, q({ cursor: 'garbage' })).then(() => null, (e: unknown) => e);
    expect((error as AppError).status).toBe(422);
    expect((error as AppError).code).toBe('VALIDATION_FAILED');
    expect(Object.keys((error as AppError).errors ?? {})).toEqual(['query.cursor']);
    expect(repo.calls).toHaveLength(0);
  });

  it('BR-104a: the span is capped by report_max_range_days (the cap itself allowed), 422 on query.to', async () => {
    const repo = fakeRepo([], 5);
    const svc = createWarehouseActivityService({ repo, db: recordingDb([OOTY]) });
    await svc.list(sub, OOTY, q({ from: '2033-03-10', to: '2033-03-15' }));
    const error = await svc.list(sub, OOTY, q({ from: '2033-03-10', to: '2033-03-16' })).then(() => null, (e: unknown) => e);
    expect((error as AppError).status).toBe(422);
    expect((error as AppError).code).toBe('VALIDATION_FAILED');
    expect((error as AppError).errors).toEqual({ 'query.to': ['Date range cannot exceed 5 days.'] });
    expect(repo.calls).toHaveLength(1);
  });

  it('BR-104f: an event carries exactly the documented keys, and reading sends no INSERT, UPDATE or DELETE', async () => {
    const db = recordingDb([OOTY]);
    const svc = createWarehouseActivityService({ repo: warehouseActivityRepo, db });
    await svc.list(sub, OOTY, q({ from: FROM, to: TO, cursor: encodeActivityCursor(aCursor()) }));
    expect(db.statements.length).toBeGreaterThan(0);
    for (const sql of db.statements) expect(sql).not.toMatch(/\b(INSERT|UPDATE|DELETE|TRUNCATE|MERGE)\b/i);

    const result = await createWarehouseActivityService({ repo: fakeRepo([anEvent()]), db }).list(sub, OOTY, q());
    expect(Object.keys(result.items[0]!).sort()).toEqual(
      ['actorId', 'direction', 'occurredAt', 'qtyKg', 'reference', 'severity', 'sourceId', 'status', 'type'].sort(),
    );
  });
});

// ===========================================================================
// 3. The SQL builder (no I/O)
// ===========================================================================
describe('warehouse activity SQL', () => {
  const W = newId();
  const base: ActivityFilter = { warehouseId: W, types: [...activityTypes], limit: 20 };
  const TABLES: Record<ActivityType, string> = {
    STOCK_MOVEMENT: 'stock_ledger',
    GOODS_RECEIPT: 'goods_receipts',
    TRANSFER: 'stock_transfers',
    ISSUE: 'warehouse_issues',
    RETURN: 'return_requests',
    DOCUMENT: 'warehouse_documents',
  };

  it('BR-104b: one UNION ALL statement over the six sources, each limited to limit + 1, outer limit + 1', () => {
    const { text, values } = buildActivityQuery(base);
    expect(text.match(/UNION ALL/g)).toHaveLength(5);
    for (const table of Object.values(TABLES)) expect(text).toContain(table);
    expect(values[0]).toBe(W);
    expect(values).toContain(21);
    expect(text).toMatch(/ORDER BY e\.occurred_at DESC, e\.type COLLATE "C" DESC, e\.source_id DESC\s+LIMIT/);
    expect(text).toMatch(/o\.warehouse_id = \$1/);
    expect(text).toMatch(/from_warehouse_id = \$1 OR \w+\.to_warehouse_id = \$1/);
  });

  it('BR-104d: the type filter drops the excluded branches from the SQL', () => {
    const { text } = buildActivityQuery({ ...base, types: ['ISSUE', 'DOCUMENT'] });
    expect(text).not.toContain('UNION ALL\n'.repeat(2));
    expect(text.match(/UNION ALL/g)).toHaveLength(1);
    expect(text).toContain('warehouse_issues');
    expect(text).toContain('warehouse_documents');
    for (const table of ['stock_ledger', 'goods_receipts', 'stock_transfers', 'return_requests']) expect(text).not.toContain(table);
    expect(buildActivityQuery({ ...base, types: ['RETURN'] }).text).not.toContain('UNION ALL');
  });

  it('BR-104c/d: the date window and the cursor are bound parameters, never interpolated', () => {
    const cursor = aCursor();
    const { text, values } = buildActivityQuery({ ...base, from: FROM, to: TO, cursor });
    expect(values).toEqual(expect.arrayContaining([W, FROM, TO, cursor.occurredAt, cursor.type, cursor.sourceId, 21]));
    for (const value of [FROM, TO, cursor.occurredAt, cursor.sourceId]) expect(text).not.toContain(value);
    expect(text).toContain(`AT TIME ZONE 'Asia/Kolkata'`);
    expect(text.match(/::timestamptz, \$\d+::text COLLATE "C", \$\d+::uuid\)/g)).toHaveLength(6);
  });

  it('BR-104f: no branch selects a farmer, a customer or free text', () => {
    const { text } = buildActivityQuery(base);
    for (const column of ['farmer_id', 'customer_id', 'title', 'description', 'notes', 'note', 'reason', 'remarks', 'resolution_note', 'receipt_note', 'cancel_reason', 'rejection_reason', 'vehicle_number', 'document_number']) {
      expect(text).not.toMatch(new RegExp(`\\.${column}\\b`));
    }
  });
});

// ===========================================================================
// 4. Service against real Postgres, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('warehouse activity service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables(
      'stock_ledger', 'goods_receipts', 'stock_transfers', 'warehouse_issues', 'return_requests', 'orders', 'warehouse_documents', 'system_config',
    );
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

  const main = () => aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [], permission: 'warehouse.activity.view' });
  const subOoty = () => aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [wh.ooty], permission: 'warehouse.activity.view' });
  const service = (tx: Executor) => createWarehouseActivityService({ repo: warehouseActivityRepo, db: tx });

  interface Fixture {
    actor: string;
    farmer: string;
    customer: string;
    ids: Record<string, string>;
  }

  /**
   * One row per source in Ooty on IST 2033-03-10/11, the same sources in Coonoor, plus Ooty rows outside the
   * window. `session_replication_role = replica` (this transaction only) skips the foreign-key and ledger
   * triggers, so the fixture needs no purchase order, batch or upload just to exist; the reads are plain SELECTs.
   * Two Ooty events share one timestamp to the microsecond (ties broken by type), and two differ by one
   * microsecond (JS Date would lose that), so paging must use the full-precision cursor.
   */
  async function seed(tx: Executor): Promise<Fixture> {
    await tx.query(`SET LOCAL session_replication_role = replica`);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const actor = newId();
    const farmer = newId();
    const customer = (
      await tx.query<{ id: string }>(
        `INSERT INTO customers (user_id, customer_code, preferred_warehouse_id) VALUES ($1, $2, $3) RETURNING id`,
        [newId(), `C-ACT-${stamp}`, wh.ooty],
      )
    ).rows[0]!.id;
    const ids: Record<string, string> = {};

    const ledger = async (key: string, warehouse: string, type: string, delta: string, at: string) => {
      ids[key] = (
        await tx.query<{ id: string }>(
          `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, remarks, created_by, created_at)
           VALUES ($1, $2, $3::stock_movement_type, $4, 1000, 'free text remark', $5, $6) RETURNING id`,
          [newId(), warehouse, type, delta, actor, at],
        )
      ).rows[0]!.id;
    };
    const grn = async (key: string, warehouse: string, at: string) => {
      ids[key] = (
        await tx.query<{ id: string }>(
          `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, status, gross_qty_kg, accepted_qty_kg,
                                       rejected_qty_kg, rejection_reason, received_by, received_at)
           VALUES ($1, $2, $3, $4, 'ACCEPTED'::grn_status, 12.5, 10, 2.5, 'free text rejection', $5, $6) RETURNING id`,
          [`GRN-ACT-${key}-${stamp}`, newId(), warehouse, farmer, actor, at],
        )
      ).rows[0]!.id;
    };
    const transfer = async (key: string, from: string, to: string, at: string) => {
      ids[key] = (
        await tx.query<{ id: string }>(
          `INSERT INTO stock_transfers (transfer_number, from_warehouse_id, to_warehouse_id, status, initiated_by, notes, created_at)
           VALUES ($1, $2, $3, 'IN_TRANSIT', $4, 'free text note', $5) RETURNING id`,
          [`TRF-ACT-${key}-${stamp}`, from, to, actor, at],
        )
      ).rows[0]!.id;
    };
    const issue = async (key: string, warehouse: string, at: string) => {
      ids[key] = (
        await tx.query<{ id: string }>(
          `INSERT INTO warehouse_issues (issue_number, warehouse_id, category, severity, title, description, status, reported_by, created_at)
           VALUES ($1, $2, 'EQUIPMENT', 'HIGH', 'free text title', 'free text description', 'OPEN', $3, $4) RETURNING id`,
          [`ISS-ACT-${key}-${stamp}`, warehouse, actor, at],
        )
      ).rows[0]!.id;
    };
    const ret = async (key: string, warehouse: string, at: string) => {
      const orderId = (
        await tx.query<{ id: string }>(
          `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, status, total_amount, placed_at)
           VALUES ($1, $2, $3, 'ONLINE', 'DELIVERED'::order_status, 10, $4) RETURNING id`,
          [`O-ACT-${key}-${stamp}`, customer, warehouse, at],
        )
      ).rows[0]!.id;
      ids[key] = (
        await tx.query<{ id: string }>(
          `INSERT INTO return_requests (order_id, customer_id, status, reason, note, created_at)
           VALUES ($1, $2, 'PENDING'::return_status, 'free text reason', 'free text note', $3) RETURNING id`,
          [orderId, customer, at],
        )
      ).rows[0]!.id;
    };
    const doc = async (key: string, warehouse: string, at: string, archived: boolean) => {
      ids[key] = (
        await tx.query<{ id: string }>(
          `INSERT INTO warehouse_documents (warehouse_id, doc_type, title, document_number, upload_id, uploaded_by, archived_at, archived_by, created_at)
           VALUES ($1, 'FSSAI', 'free text doc title', 'DOC-NO-1', $2, $3, $4, $5, $6) RETURNING id`,
          [warehouse, newId(), actor, archived ? at : null, archived ? actor : null, at],
        )
      ).rows[0]!.id;
    };

    // Ooty, inside the window (newest first): issue and document tie at 07:00:00.000001; ledger and grn differ by 1 us.
    await ret('return', wh.ooty, '2033-03-11T09:00:00Z');
    await issue('issue', wh.ooty, '2033-03-11T07:00:00.000001Z');
    await doc('document', wh.ooty, '2033-03-11T07:00:00.000001Z', true);
    await transfer('transferIn', wh.coonoor, wh.ooty, '2033-03-10T12:00:00Z');
    await transfer('transferOut', wh.ooty, wh.kotagiri, '2033-03-10T11:00:00Z');
    await ledger('ledger', wh.ooty, 'SALE', '-20.25', '2033-03-10T08:00:00.000002Z');
    await grn('grn', wh.ooty, '2033-03-10T08:00:00.000001Z');
    // Ooty, outside the window: IST 03-09 23:59:59 and IST 03-12 00:00.
    await ledger('before', wh.ooty, 'RECEIPT', '9', '2033-03-09T18:29:59Z');
    await issue('after', wh.ooty, '2033-03-11T18:30:00Z');
    // Coonoor only (never visible from Ooty).
    await ledger('cLedger', wh.coonoor, 'RECEIPT', '5', '2033-03-10T08:00:00Z');
    await grn('cGrn', wh.coonoor, '2033-03-10T08:00:00Z');
    await transfer('cTransfer', wh.coonoor, wh.gudalur, '2033-03-10T08:00:00Z');
    await issue('cIssue', wh.coonoor, '2033-03-10T08:00:00Z');
    await ret('cReturn', wh.coonoor, '2033-03-10T08:00:00Z');
    await doc('cDocument', wh.coonoor, '2033-03-10T08:00:00Z', false);
    return { actor, farmer, customer, ids };
  }

  const window = (overrides: Partial<ActivityQuery> = {}): ActivityQuery => ({ from: FROM, to: TO, limit: 100, ...overrides });

  dbTest('BR-104b: each of the six sources appears with its documented fields, newest first, only for that warehouse', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const result = await service(tx).list(main(), wh.ooty, window());
      expect(result.page).toEqual({ nextCursor: null, hasMore: false });
      expect(result.items).toEqual([
        { type: 'RETURN', sourceId: f.ids['return'], occurredAt: '2033-03-11T09:00:00.000000Z', reference: f.ids['return'], status: 'PENDING', severity: null, qtyKg: null, direction: null, actorId: null },
        // Same instant: type DESC puts ISSUE before DOCUMENT.
        { type: 'ISSUE', sourceId: f.ids['issue'], occurredAt: '2033-03-11T07:00:00.000001Z', reference: expect.stringMatching(/^ISS-ACT-issue-/), status: 'OPEN', severity: 'HIGH', qtyKg: null, direction: null, actorId: f.actor },
        { type: 'DOCUMENT', sourceId: f.ids['document'], occurredAt: '2033-03-11T07:00:00.000001Z', reference: 'FSSAI', status: 'ARCHIVED', severity: null, qtyKg: null, direction: null, actorId: f.actor },
        { type: 'TRANSFER', sourceId: f.ids['transferIn'], occurredAt: '2033-03-10T12:00:00.000000Z', reference: expect.stringMatching(/^TRF-ACT-transferIn-/), status: 'IN_TRANSIT', severity: null, qtyKg: null, direction: 'INBOUND', actorId: f.actor },
        { type: 'TRANSFER', sourceId: f.ids['transferOut'], occurredAt: '2033-03-10T11:00:00.000000Z', reference: expect.stringMatching(/^TRF-ACT-transferOut-/), status: 'IN_TRANSIT', severity: null, qtyKg: null, direction: 'OUTBOUND', actorId: f.actor },
        { type: 'STOCK_MOVEMENT', sourceId: f.ids['ledger'], occurredAt: '2033-03-10T08:00:00.000002Z', reference: 'SALE', status: null, severity: null, qtyKg: '-20.250', direction: null, actorId: f.actor },
        { type: 'GOODS_RECEIPT', sourceId: f.ids['grn'], occurredAt: '2033-03-10T08:00:00.000001Z', reference: expect.stringMatching(/^GRN-ACT-grn-/), status: 'ACCEPTED', severity: null, qtyKg: '12.500', direction: null, actorId: f.actor },
      ]);

      // Coonoor sees its own six plus the transfer it sent to Ooty, never Ooty's rows.
      const coonoor = await service(tx).list(main(), wh.coonoor, window());
      const coonoorIds = coonoor.items.map((item) => item.sourceId).sort();
      expect(coonoorIds).toEqual(
        [f.ids['cLedger'], f.ids['cGrn'], f.ids['cTransfer'], f.ids['cIssue'], f.ids['cReturn'], f.ids['cDocument'], f.ids['transferIn']].sort(),
      );
      expect(coonoor.items.find((item) => item.sourceId === f.ids['transferIn'])?.direction).toBe('OUTBOUND');
      expect(coonoor.items.find((item) => item.sourceId === f.ids['cDocument'])?.status).toBeNull();
    });
  });

  dbTest('BR-104c: paging with limit 1 and 2 returns every event exactly once, in the same order, microseconds intact', async () => {
    await inRolledBackTx(async (tx) => {
      await seed(tx);
      const svc = service(tx);
      const all = (await svc.list(subOoty(), wh.ooty, window())).items.map((item) => `${item.type}:${item.sourceId}`);
      expect(all).toHaveLength(7);
      for (const limit of [1, 2, 3]) {
        const seen: string[] = [];
        let cursor: string | undefined;
        for (let guard = 0; guard < 20; guard += 1) {
          const page = await svc.list(subOoty(), wh.ooty, window({ limit, ...(cursor === undefined ? {} : { cursor }) }));
          expect(page.items.length).toBeLessThanOrEqual(limit);
          seen.push(...page.items.map((item) => `${item.type}:${item.sourceId}`));
          expect(page.page.hasMore).toBe(page.page.nextCursor !== null);
          if (page.page.nextCursor === null) break;
          cursor = page.page.nextCursor;
        }
        expect(seen, `limit ${limit}`).toEqual(all);
      }
    });
  });

  dbTest('BR-104d: the type and date filters narrow the result', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const svc = service(tx);
      const types = await svc.list(main(), wh.ooty, window({ type: ['TRANSFER', 'GOODS_RECEIPT'] }));
      expect(types.items.map((item) => item.sourceId)).toEqual([f.ids['transferIn'], f.ids['transferOut'], f.ids['grn']]);

      const day = await svc.list(main(), wh.ooty, window({ from: TO, to: TO }));
      expect(day.items.map((item) => item.type)).toEqual(['RETURN', 'ISSUE', 'DOCUMENT']);

      const edges = await svc.list(main(), wh.ooty, window({ from: '2033-03-09', to: '2033-03-12', type: ['STOCK_MOVEMENT', 'ISSUE'] }));
      const edgeIds = edges.items.map((item) => item.sourceId);
      expect(edgeIds).toEqual(expect.arrayContaining([f.ids['before'], f.ids['after']]));
      const narrow = await svc.list(main(), wh.ooty, window({ type: ['STOCK_MOVEMENT', 'ISSUE'] }));
      expect(narrow.items.map((item) => item.sourceId)).toEqual([f.ids['issue'], f.ids['ledger']]);
    });
  });

  dbTest('BR-104a: the span cap is system_config.report_max_range_days with a 366 fallback', async () => {
    await inRolledBackTx(async (tx) => {
      await tx.query(
        `INSERT INTO system_config (key, value, data_type, description) VALUES ('report_max_range_days', '5'::jsonb, 'number', 'fixture')
         ON CONFLICT (key) DO UPDATE SET value = '5'::jsonb`,
      );
      const svc = service(tx);
      await svc.list(main(), wh.ooty, window({ from: '2033-03-10', to: '2033-03-15' }));
      const tooWide = await svc.list(main(), wh.ooty, window({ from: '2033-03-10', to: '2033-03-16' })).then(() => null, (e: unknown) => e);
      expect((tooWide as AppError).status).toBe(422);
      expect((tooWide as AppError).errors).toEqual({ 'query.to': ['Date range cannot exceed 5 days.'] });

      await tx.query(`DELETE FROM system_config WHERE key = 'report_max_range_days'`);
      await svc.list(main(), wh.ooty, window({ from: '2032-03-10', to: '2033-03-10' })); // 365 days
      const fallback = await svc.list(main(), wh.ooty, window({ from: '2032-03-08', to: '2033-03-10' })).then(() => null, (e: unknown) => e);
      expect((fallback as AppError).status).toBe(422);
    });
  });

  dbTest('BR-104e: another and an unknown warehouse are the same 404 for a Sub admin', async () => {
    await inRolledBackTx(async (tx) => {
      const svc = service(tx);
      const messages = new Set<string>();
      for (const id of [wh.coonoor, newId()]) {
        const error = await svc.list(subOoty(), id, window()).then(() => null, (e: unknown) => e);
        expect((error as AppError).status).toBe(404);
        messages.add((error as AppError).message.replace(/[0-9a-f-]{36}/g, '<id>'));
      }
      expect(messages.size).toBe(1);
    });
  });

  dbTest('BR-104f: no event carries a farmer id, customer data or free text, and reading writes nothing', async () => {
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const count = async () =>
        (await tx.query<{ n: string }>(
          `SELECT ((SELECT count(*) FROM audit_log) + (SELECT count(*) FROM stock_ledger) + (SELECT count(*) FROM goods_receipts)
                 + (SELECT count(*) FROM stock_transfers) + (SELECT count(*) FROM warehouse_issues)
                 + (SELECT count(*) FROM return_requests) + (SELECT count(*) FROM warehouse_documents))::text AS n`,
        )).rows[0]!.n;
      const before = await count();
      const result = await service(tx).list(main(), wh.ooty, window());
      expect(await count()).toBe(before);
      const body = JSON.stringify(result);
      expect(body).not.toContain(f.farmer);
      expect(body).not.toContain(f.customer);
      expect(body).not.toMatch(/free text|DOC-NO-1/);
    });
  });
});

// ===========================================================================
// 5. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('warehouse activity routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let harness: HttpHarness;

  beforeAll(async () => {
    ready = await requireDatabaseTables('warehouse_issues', 'warehouse_documents', 'warehouses');
    if (ready) harness = await startHttpHarness();
  });

  afterAll(async () => {
    if (ready) await harness.stop();
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const path = (id: string): string => `/v1/warehouses/${id}/activity`;

  dbTest('BR-104e (HTTP): 401 without a token; 403 for FARMER, CUSTOMER and FARMER_ADMIN', async () => {
    const url = path(harness.warehouse.ooty);
    expect((await request(harness.server).get(url)).status).toBe(401);
    for (const role of ['farmer', 'customer', 'farmerAdmin'] as const) {
      const res = await request(harness.server).get(url).set('Authorization', harness.auth(role));
      expect(res.status, role).toBe(403);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
  });

  dbTest('BR-104e (HTTP): a Sub admin reads its own warehouse; another and an unknown warehouse are the same 404', async () => {
    const own = await request(harness.server).get(path(harness.warehouse.ooty)).set('Authorization', harness.auth('subOoty'));
    expect(own.status, JSON.stringify(own.body)).toBe(200);
    expect(Array.isArray(own.body.items)).toBe(true);
    expect(Object.keys(own.body.page).sort()).toEqual(['hasMore', 'nextCursor']);

    const other = await request(harness.server).get(path(harness.warehouse.coonoor)).set('Authorization', harness.auth('subOoty'));
    const unknown = await request(harness.server).get(path(newId())).set('Authorization', harness.auth('subOoty'));
    expect(other.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(other.body.code).toBe(unknown.body.code);
    expect(String(other.body.detail).replace(/[0-9a-f-]{36}/g, '<id>')).toBe(String(unknown.body.detail).replace(/[0-9a-f-]{36}/g, '<id>'));

    for (const role of ['superAdmin', 'tohfaAdmin', 'main'] as const) {
      for (const id of Object.values(harness.warehouse)) {
        const res = await request(harness.server).get(path(id)).set('Authorization', harness.auth(role));
        expect(res.status, `${role} ${id}`).toBe(200);
      }
    }
  });

  dbTest('BR-104a (HTTP): bad queries are 422 VALIDATION_FAILED, a malformed cursor on query.cursor', async () => {
    for (const query of [
      { type: 'ORDER' },
      { from: FROM },
      { from: TO, to: FROM },
      { from: '2033-02-30', to: TO },
      { from: '2000-01-01', to: '2033-01-01' },
      { limit: '0' },
      { limit: '101' },
      { extra: '1' },
      { cursor: 'garbage' },
    ]) {
      const res = await request(harness.server).get(path(harness.warehouse.ooty)).query(query).set('Authorization', harness.auth('main'));
      expect(res.status, JSON.stringify(query)).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    }
    const cursor = await request(harness.server).get(path(harness.warehouse.ooty)).query({ cursor: 'garbage' }).set('Authorization', harness.auth('main'));
    expect(Object.keys(cursor.body.errors)).toEqual(['query.cursor']);
    expect((await request(harness.server).get(path('not-a-uuid')).set('Authorization', harness.auth('main'))).status).toBe(422);
  });

  dbTest('BR-104f (HTTP): the feed is read-only: no write method is a route', async () => {
    for (const method of ['post', 'patch', 'put', 'delete'] as const) {
      const res = await request(harness.server)[method](path(harness.warehouse.ooty)).set('Authorization', harness.auth('superAdmin')).send({});
      expect([404, 405], method).toContain(res.status);
    }
  });
});
