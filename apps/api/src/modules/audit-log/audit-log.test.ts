/**
 * GET /v1/admin/audit-log (auditlog.view) and GET /v1/admin/audit-log/export (auditlog.export).
 *
 * BR-35: the audit trail is append-only; SUPER_ADMIN may read and export, nobody edits or deletes.
 * BR-30: a warehouse admin sees only entries of its own warehouse; another warehouse's entry is
 *        absent from the page (an empty result), never a 403.
 *
 * Layers:
 *  1. service against a fake repo (which scope fragment reaches SQL, paging envelope)
 *  2. request schemas (filters, cursor, from/to order, strictness)
 *  3. the router itself: GET only, permission wiring (no database needed: refused before any query)
 *  4. PostgreSQL: the real repo and SQL inside a transaction that is always rolled back
 */
import type { Server } from 'node:http';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { CURSOR_TAGS, encodeKeysetCursor } from '../../http/keysetCursor.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { AppError } from '../../http/problem.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { auditLogRepo, type AuditLogRepo, type ListArgs } from './audit-log.repo.js';
import { auditLogRouter } from './audit-log.routes.js';
import { exportAuditLogQuery, listAuditLogQuery, type AuditLogEntry } from './audit-log.schema.js';
import { createAuditLogService } from './audit-log.service.js';

const W1 = IDS.warehouseOoty;
const W2 = IDS.warehouseCoonoor;

function superScope(permission = 'auditlog.view'): ResolvedScope {
  return aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission });
}

function tohfaScope(): ResolvedScope {
  return aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN, permission: 'auditlog.view' });
}

function subScope(warehouseId: string): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    roleCode: RoleCode.SUB_WH_ADMIN,
    permission: 'auditlog.view',
    warehouseIds: [warehouseId],
    userId: IDS.userSubWhAdmin,
  });
}

function mainScope(warehouseIds: string[] = []): ResolvedScope {
  return aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'auditlog.view', warehouseIds });
}

function anEntry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: newId(),
    actorId: IDS.userSuperAdmin,
    actorType: 'USER',
    actorRole: 'SUPER_ADMIN',
    action: 'warehouse.capacity.set',
    entityType: 'warehouse',
    entityId: W1,
    warehouseId: W1,
    outcome: 'ALLOWED',
    before: { capacityKg: '100.000' },
    after: { capacityKg: '200.000' },
    changedFields: ['capacityKg'],
    correlationId: null,
    ip: null,
    at: '2026-10-20T10:00:00.000Z',
    ...overrides,
  };
}

/** A repo that records what the service asked for and answers from a fixed page. */
function fakeRepo(items: AuditLogEntry[] = [], nextCursor: string | null = null): { repo: AuditLogRepo; calls: ListArgs[] } {
  const calls: ListArgs[] = [];
  const repo: AuditLogRepo = {
    async list(_db, args) {
      calls.push(args);
      return { items, nextCursor, hasMore: nextCursor !== null };
    },
    async listForExport() {
      throw new Error('not used by these tests');
    },
    async getMaxRows() {
      return 50000;
    },
  };
  return { repo, calls };
}

const noDb = { query: async () => ({ rows: [], rowCount: 0 }) } as never;

// ---------------------------------------------------------------------------
// 1. Service: which scope reaches SQL
// ---------------------------------------------------------------------------
describe('audit log service: list scope (fake repo)', () => {
  it('BR-35: SUPER_ADMIN (auditlog.view = all) lists with no scope restriction', async () => {
    const { repo, calls } = fakeRepo([anEntry()]);
    const service = createAuditLogService({ repo, db: noDb });
    const page = await service.list(superScope(), listAuditLogQuery.parse({}));
    expect(calls[0]!.scope.sql).toBe('TRUE');
    expect(calls[0]!.scope.params).toEqual([]);
    expect(page.items).toHaveLength(1);
  });

  it('BR-35: TOHFA_ADMIN (auditlog.view = all) also lists with no scope restriction', async () => {
    const { repo, calls } = fakeRepo();
    await createAuditLogService({ repo, db: noDb }).list(tohfaScope(), listAuditLogQuery.parse({}));
    expect(calls[0]!.scope.sql).toBe('TRUE');
  });

  it('BR-30: a SUB_WH_ADMIN (own) is confined to its assigned warehouse by the WHERE clause, not a post-hoc check', async () => {
    const { repo, calls } = fakeRepo();
    await createAuditLogService({ repo, db: noDb }).list(subScope(W1), listAuditLogQuery.parse({}));
    expect(calls[0]!.scope.sql).toMatch(/a\.warehouse_id = ANY\(\$\d+::uuid\[\]\)/);
    expect(calls[0]!.scope.params).toEqual([[W1]]);
  });

  it('BR-30: a MAIN_WH_ADMIN (own) with an assigned warehouse is confined to it', async () => {
    const { repo, calls } = fakeRepo();
    await createAuditLogService({ repo, db: noDb }).list(mainScope([W2]), listAuditLogQuery.parse({}));
    expect(calls[0]!.scope.params).toEqual([[W2]]);
  });

  it('BR-30: a MAIN_WH_ADMIN (own) with no assigned warehouse fails closed to an empty page (open rbac conflict, unconfirmed default)', async () => {
    const { repo, calls } = fakeRepo();
    await createAuditLogService({ repo, db: noDb }).list(mainScope([]), listAuditLogQuery.parse({}));
    expect(calls[0]!.scope.sql).toBe('FALSE');
  });

  it('BR-35: the page envelope carries the repo cursor and the filters reach the repo unchanged', async () => {
    const cursor = encodeKeysetCursor(CURSOR_TAGS.auditLog, { ts: '2026-10-20T10:00:00.000000Z', id: newId() });
    const { repo, calls } = fakeRepo([anEntry()], cursor);
    const query = listAuditLogQuery.parse({ action: 'payout.approve', entityType: 'payout', limit: '5' });
    const page = await createAuditLogService({ repo, db: noDb }).list(superScope(), query);
    expect(page.page).toEqual({ nextCursor: cursor, hasMore: true });
    expect(calls[0]!.filters).toMatchObject({ action: 'payout.approve', entityType: 'payout' });
    expect(calls[0]!.limit).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// 2. Request schema
// ---------------------------------------------------------------------------
describe('audit log list query schema', () => {
  it('BR-35: accepts every documented filter', () => {
    const parsed = listAuditLogQuery.safeParse({
      actorId: newId(),
      action: 'listing.approve',
      entityType: 'listing',
      entityId: newId(),
      from: '2026-10-01T00:00:00+05:30',
      to: '2026-10-31T23:59:59Z',
      limit: '50',
    });
    expect(parsed.success).toBe(true);
  });

  it('BR-35: `from` after `to` is refused (422 at the route)', () => {
    const parsed = listAuditLogQuery.safeParse({ from: '2026-10-02T00:00:00Z', to: '2026-10-01T00:00:00Z' });
    expect(parsed.success).toBe(false);
  });

  it('BR-35: a cursor this list did not produce is refused, including another list\'s cursor', () => {
    expect(listAuditLogQuery.safeParse({ cursor: newId() }).success).toBe(false);
    const stockLedgerCursor = encodeKeysetCursor('sl', { ts: '2026-10-20T10:00:00.000000Z', id: newId() });
    expect(listAuditLogQuery.safeParse({ cursor: stockLedgerCursor }).success).toBe(false);
  });

  it('BR-35: unknown query keys and a limit above 100 are refused', () => {
    expect(listAuditLogQuery.safeParse({ warehouseId: W1 }).success).toBe(false);
    expect(listAuditLogQuery.safeParse({ limit: '101' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. The router: read-only, permission wiring (refused before any SQL runs)
// ---------------------------------------------------------------------------
describe('audit log router', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-35: the router registers GET routes only; no update or delete path exists', () => {
    const methods = auditLogRouter.stack
      .filter((layer) => layer.route !== undefined)
      .flatMap((layer) => Object.keys((layer.route as unknown as { methods: Record<string, boolean> }).methods));
    expect(methods.length).toBeGreaterThan(0);
    expect(new Set(methods)).toEqual(new Set(['get']));
  });

  it.each(['post', 'put', 'patch', 'delete'] as const)('BR-35: %s on /v1/admin/audit-log is 404 even for SUPER_ADMIN', async (verb) => {
    const res = await request(server)[verb]('/v1/admin/audit-log').set('Authorization', token([{ code: RoleCode.SUPER_ADMIN }])).send({});
    expect(res.status).toBe(404);
  });

  it('BR-35: GET /v1/admin/audit-log is 401 without a token and 403 for FARMER_ADMIN, FARMER and CUSTOMER', async () => {
    expect((await request(server).get('/v1/admin/audit-log')).status).toBe(401);
    const denied = [
      token([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]),
      token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
      token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
    ];
    for (const auth of denied) {
      const res = await request(server).get('/v1/admin/audit-log').set('Authorization', auth);
      expect(res.status).toBe(403);
      expect(res.headers['content-type']).toContain('application/problem+json');
    }
  });

  it('BR-35: a malformed filter is 422 problem+json', async () => {
    const res = await request(server)
      .get('/v1/admin/audit-log?from=2026-10-02T00:00:00Z&to=2026-10-01T00:00:00Z')
      .set('Authorization', token([{ code: RoleCode.SUPER_ADMIN }]));
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// 4. PostgreSQL: real repo, real SQL, always rolled back
// ---------------------------------------------------------------------------
describeIfDatabase('audit log (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;
  let wA = '';
  let wB = '';

  beforeAll(async () => {
    expect(await databaseReady('audit_log'), 'the database is reachable and migrated').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
    const wh = await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE deleted_at IS NULL ORDER BY code LIMIT 2`);
    expect(wh.rows.length, 'two seeded warehouses').toBe(2);
    wA = wh.rows[0]!.id;
    wB = wh.rows[1]!.id;
  });

  async function inRollback<T>(fn: (tx: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  interface Seeded {
    action: string;
    actorId: string;
    rowA: string;
    rowB: string;
    rowNone: string;
  }

  /**
   * Three entries under one unique action code (so other rows in the database never interfere):
   * one in warehouse A, one in warehouse B, one tied to no warehouse. Explicit timestamps.
   */
  async function seed(tx: pg.PoolClient): Promise<Seeded> {
    const rand = Math.floor(10_000_000 + Math.random() * 89_999_999);
    const actorId = newId();
    await tx.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Audit Reader', 'ADMIN', 'ACTIVE')`,
      [actorId, `+9197${rand}`],
    );
    const action = `test.auditlog.${rand}`;
    const insert = async (warehouseId: string | null, at: string, entityId: string): Promise<string> => {
      const r = await tx.query<{ id: string }>(
        `INSERT INTO audit_log (actor_id, actor_role, action_code, entity_type, entity_id, warehouse_id, before, after, changed_fields, created_at)
         VALUES ($1, 'SUPER_ADMIN', $2, 'warehouse', $3, $4, '{"capacityKg":"1.000"}'::jsonb, '{"capacityKg":"2.000"}'::jsonb, ARRAY['capacityKg'], $5::timestamptz)
         RETURNING id`,
        [actorId, action, entityId, warehouseId, at],
      );
      return r.rows[0]!.id;
    };
    const rowA = await insert(wA, '2031-01-01T10:00:00Z', wA);
    const rowB = await insert(wB, '2031-01-02T10:00:00Z', wB);
    const rowNone = await insert(null, '2031-01-03T10:00:00Z', newId());
    return { action, actorId, rowA, rowB, rowNone };
  }

  const ids = (items: AuditLogEntry[]): string[] => items.map((i) => i.id);

  it('BR-35: SUPER_ADMIN sees every entry, newest first, with the stored images', async () => {
    await inRollback(async (tx) => {
      const s = await seed(tx);
      const service = createAuditLogService({ repo: auditLogRepo, db: tx });
      const page = await service.list(superScope(), listAuditLogQuery.parse({ action: s.action }));
      expect(ids(page.items)).toEqual([s.rowNone, s.rowB, s.rowA]);
      const a = page.items[2]!;
      expect(a).toMatchObject({
        actorId: s.actorId,
        actorType: 'USER',
        actorRole: 'SUPER_ADMIN',
        action: s.action,
        entityType: 'warehouse',
        warehouseId: wA,
        outcome: 'ALLOWED',
        before: { capacityKg: '1.000' },
        after: { capacityKg: '2.000' },
        changedFields: ['capacityKg'],
        at: '2031-01-01T10:00:00.000Z',
      });
      expect(page.page).toEqual({ nextCursor: null, hasMore: false });
    });
  });

  it('BR-30: a SUB_WH_ADMIN sees only its own warehouse\'s entries (not another warehouse\'s, not unscoped ones)', async () => {
    await inRollback(async (tx) => {
      const s = await seed(tx);
      const service = createAuditLogService({ repo: auditLogRepo, db: tx });
      const page = await service.list(subScope(wA), listAuditLogQuery.parse({ action: s.action }));
      expect(ids(page.items)).toEqual([s.rowA]);
    });
  });

  it('BR-30: a SUB_WH_ADMIN asking for another warehouse\'s entry by entityId gets an empty page, never 403', async () => {
    await inRollback(async (tx) => {
      const s = await seed(tx);
      const service = createAuditLogService({ repo: auditLogRepo, db: tx });
      const page = await service.list(subScope(wA), listAuditLogQuery.parse({ action: s.action, entityId: wB }));
      expect(page).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
    });
  });

  it('BR-35: actorId, entityType, entityId, from and to combine with AND (from/to inclusive)', async () => {
    await inRollback(async (tx) => {
      const s = await seed(tx);
      const service = createAuditLogService({ repo: auditLogRepo, db: tx });
      const list = async (q: Record<string, string>): Promise<string[]> =>
        ids((await service.list(superScope(), listAuditLogQuery.parse({ action: s.action, ...q }))).items);
      expect(await list({ actorId: s.actorId })).toHaveLength(3);
      expect(await list({ actorId: newId() })).toEqual([]);
      expect(await list({ entityType: 'payout' })).toEqual([]);
      expect(await list({ entityId: wB })).toEqual([s.rowB]);
      expect(await list({ from: '2031-01-02T10:00:00Z' })).toEqual([s.rowNone, s.rowB]);
      expect(await list({ to: '2031-01-02T10:00:00Z' })).toEqual([s.rowB, s.rowA]);
      expect(await list({ from: '2031-01-02T00:00:00+05:30', to: '2031-01-02T23:59:59+05:30' })).toEqual([s.rowB]);
    });
  });

  it('BR-35: keyset paging returns every entry exactly once in order, including entries that share a timestamp', async () => {
    await inRollback(async (tx) => {
      const s = await seed(tx);
      // Two more entries tied to the microsecond with rowB.
      for (let i = 0; i < 2; i += 1) {
        await tx.query(
          `INSERT INTO audit_log (actor_id, action_code, entity_type, warehouse_id, created_at)
           VALUES ($1, $2, 'warehouse', $3, '2031-01-02T10:00:00Z')`,
          [s.actorId, s.action, wB],
        );
      }
      const service = createAuditLogService({ repo: auditLogRepo, db: tx });
      const all = ids((await service.list(superScope(), listAuditLogQuery.parse({ action: s.action, limit: '100' }))).items);
      expect(all).toHaveLength(5);

      const paged: string[] = [];
      let cursor: string | undefined;
      for (let guard = 0; guard < 10; guard += 1) {
        const page = await service.list(
          superScope(),
          listAuditLogQuery.parse({ action: s.action, limit: '2', ...(cursor === undefined ? {} : { cursor }) }),
        );
        paged.push(...ids(page.items));
        if (!page.page.hasMore) break;
        cursor = page.page.nextCursor!;
      }
      expect(paged).toEqual(all);
    });
  });
});

// ---------------------------------------------------------------------------
// 5. Export (auditlog.export, SUPER_ADMIN only): CSV, row cap, same-transaction audit row
// ---------------------------------------------------------------------------
interface RecordedQuery {
  client: string;
  sql: string;
  params: unknown[];
}

/** An Executor that records every statement and answers an audit insert with an id. */
function recordingTx(name: string, log: RecordedQuery[]): never {
  return {
    async query(sql: string, params: unknown[] = []) {
      log.push({ client: name, sql, params });
      return { rows: [{ id: newId() }], rowCount: 1 };
    },
  } as never;
}

function exportRepo(entries: AuditLogEntry[], maxRows: number): AuditLogRepo {
  return {
    async list() {
      throw new Error('not used by the export');
    },
    async listForExport(db, args) {
      await db.query('SELECT /* listForExport */ 1', [args.limit]);
      return entries.slice(0, args.limit);
    },
    async getMaxRows() {
      return maxRows;
    },
  };
}

const CSV_HEADER =
  'id,at,actor_id,actor_type,actor_role,action,entity_type,entity_id,warehouse_id,outcome,changed_fields,correlation_id,ip,before,after';

describe('audit log export service (fake repo)', () => {
  it('BR-35: the export writes exactly one auditlog.export audit row on the SAME transaction client as the read, after it', async () => {
    const log: RecordedQuery[] = [];
    const tx = recordingTx('tx', log);
    const service = createAuditLogService({
      repo: exportRepo([anEntry(), anEntry({ warehouseId: null })], 50000),
      db: recordingTx('pool', log),
      transaction: async (fn) => fn(tx),
    });
    const result = await service.exportCsv(superScope('auditlog.export'), exportAuditLogQuery.parse({ action: 'warehouse.capacity.set' }));

    expect(result.rowCount).toBe(2);
    expect(log.every((q) => q.client === 'tx')).toBe(true);
    const inserts = log.filter((q) => /INSERT INTO audit_log/.test(q.sql));
    expect(inserts).toHaveLength(1);
    expect(log.findIndex((q) => /INSERT INTO audit_log/.test(q.sql))).toBeGreaterThan(log.findIndex((q) => /listForExport/.test(q.sql)));
    const params = inserts[0]!.params;
    expect(params[0]).toBe(IDS.userSuperAdmin); // actor
    expect(params[2]).toBe(RoleCode.SUPER_ADMIN); // actor role
    expect(params[3]).toBe('auditlog.export'); // action code
    expect(params[4]).toBe('audit_log'); // entity type
    expect(JSON.parse(params[9] as string)).toEqual({ filters: { action: 'warehouse.capacity.set' }, rowCount: 2 });
  });

  it('BR-35: the CSV has the documented header, one line per entry, CRLF endings and the injection guard', async () => {
    const log: RecordedQuery[] = [];
    const tx = recordingTx('tx', log);
    const entry = anEntry({ actorRole: '=HYPERLINK("x")', changedFields: ['a', 'b'] });
    const service = createAuditLogService({ repo: exportRepo([entry], 50000), db: tx, transaction: async (fn) => fn(tx) });
    const { csv, filename } = await service.exportCsv(superScope('auditlog.export'), exportAuditLogQuery.parse({}));
    expect(filename).toBe('audit-log.csv');
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(CSV_HEADER);
    expect(lines).toHaveLength(3); // header, one row, then the empty string after the final CRLF
    expect(lines[1]).toContain(entry.id);
    expect(lines[1]).toContain(`"'=HYPERLINK(""x"")"`);
    expect(lines[1]).toContain(',a;b,');
  });

  it('BR-35: an export over system_config.export_max_rows is 422 on query.to, never truncated, and writes no audit row; exactly the cap is allowed', async () => {
    const entries = [anEntry(), anEntry(), anEntry()];
    const over: RecordedQuery[] = [];
    const overTx = recordingTx('tx', over);
    const refusing = createAuditLogService({ repo: exportRepo(entries, 2), db: overTx, transaction: async (fn) => fn(overTx) });
    const error = await refusing.exportCsv(superScope('auditlog.export'), exportAuditLogQuery.parse({})).then(
      () => null,
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe('VALIDATION_FAILED');
    expect((error as AppError).status).toBe(422);
    expect(Object.keys((error as AppError).errors ?? {})).toEqual(['query.to']);
    expect(over.some((q) => /INSERT INTO audit_log/.test(q.sql))).toBe(false);

    const exact: RecordedQuery[] = [];
    const exactTx = recordingTx('tx', exact);
    const allowing = createAuditLogService({ repo: exportRepo(entries, 3), db: exactTx, transaction: async (fn) => fn(exactTx) });
    expect((await allowing.exportCsv(superScope('auditlog.export'), exportAuditLogQuery.parse({}))).rowCount).toBe(3);
  });
});

describe('audit log export router (permission wiring)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string }>): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: null, customerId: null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-35: GET /v1/admin/audit-log/export is 401 anonymous and 403 for TOHFA_ADMIN, MAIN_WH_ADMIN and SUB_WH_ADMIN (auditlog.export is SUPER_ADMIN only)', async () => {
    expect((await request(server).get('/v1/admin/audit-log/export')).status).toBe(401);
    for (const roles of [
      [{ code: RoleCode.TOHFA_ADMIN }],
      [{ code: RoleCode.MAIN_WH_ADMIN }],
      [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }],
    ]) {
      const res = await request(server).get('/v1/admin/audit-log/export').set('Authorization', token(roles));
      expect(res.status, JSON.stringify(roles)).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('BR-35: a write verb on /v1/admin/audit-log/export is 404 even for SUPER_ADMIN', async () => {
    const res = await request(server).post('/v1/admin/audit-log/export').set('Authorization', token([{ code: RoleCode.SUPER_ADMIN }])).send({});
    expect(res.status).toBe(404);
  });
});

describeIfDatabase('audit log export (PostgreSQL)', () => {
  let pool: pg.Pool;
  let server: Server;

  beforeAll(async () => {
    expect(await databaseReady('audit_log'), 'the database is reachable and migrated').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-35: the real export writes one auditlog.export row in its own transaction, and the file does not contain that row', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const rand = Math.floor(10_000_000 + Math.random() * 89_999_999);
      const actorId = newId();
      await client.query(
        `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Audit Exporter', 'ADMIN', 'ACTIVE')`,
        [actorId, `+9196${rand}`],
      );
      const action = `test.auditlogexp.${rand}`;
      for (let i = 0; i < 2; i += 1) {
        await client.query(`INSERT INTO audit_log (actor_id, action_code, entity_type) VALUES ($1, $2, 'thing')`, [actorId, action]);
      }
      const service = createAuditLogService({ repo: auditLogRepo, db: client, transaction: async (fn) => fn(client) });
      const result = await service.exportCsv(
        aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: 'auditlog.export', userId: actorId }),
        exportAuditLogQuery.parse({ action }),
      );
      expect(result.rowCount).toBe(2);
      expect(result.csv.split('\r\n').filter((l) => l.length > 0)).toHaveLength(3);
      expect(result.csv).not.toContain(',auditlog.export,');
      const exportsAfter = await client.query<{ n: number; after: unknown }>(
        `SELECT count(*)::int AS n, max(after::text)::jsonb AS after FROM audit_log WHERE action_code = 'auditlog.export' AND actor_id = $1`,
        [actorId],
      );
      expect(exportsAfter.rows[0]!.n).toBe(1);
      expect(exportsAfter.rows[0]!.after).toEqual({ filters: { action }, rowCount: 2 });
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('BR-35: SUPER_ADMIN gets a CSV attachment through the router, and one auditlog.export row is committed with it', async () => {
    const { ensureStandardUsers } = await import('../../test/dbFixtures.js');
    await ensureStandardUsers(pool, 'userSuperAdmin');
    const count = async (): Promise<number> =>
      (await pool.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'auditlog.export'`)).rows[0]!.n;
    const before = await count();
    const res = await request(server)
      .get(`/v1/admin/audit-log/export?action=test.auditlog.none.${newId()}`)
      .set('Authorization', `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUPER_ADMIN }], farmerId: null, customerId: null })}`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toBe('attachment; filename="audit-log.csv"');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.text).toBe(`${CSV_HEADER}\r\n`);
    expect(await count()).toBe(before + 1);
  });
});
