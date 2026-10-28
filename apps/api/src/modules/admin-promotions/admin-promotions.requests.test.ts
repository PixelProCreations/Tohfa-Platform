/**
 * Promotion request create / list / read / reject (BR-117), with BR-114 (the approve that consumes a
 * request) and BR-35 (audit row in the same transaction).
 *
 * Layers:
 *  1. service against a fake repo
 *  2. request schemas
 *  3. the router: permission wiring (refused before any SQL)
 *  4. PostgreSQL: the real repo, SQL and migration 0074 constraints, rolled back
 */
import type { Server } from 'node:http';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { resolveScope, type ResolvedScope } from '../../rbac/requirePermission.js';
import { randomMobile } from '../../test/dbFixtures.js';
import { aRole, anActor, aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { adminPromotionsRepo, type AdminPromotionsRepo, type PromotionRow } from './admin-promotions.repo.js';
import { createPromotionBody, listPromotionsQuery, promotionRequest, rejectPromotionBody } from './admin-promotions.schema.js';
import { createAdminPromotionsService } from './admin-promotions.service.js';

function scopeFor(role: RoleCode, permission: string, userId: string = newId()): ResolvedScope {
  const scope = resolveScope(anActor({ userId, roles: [aRole(role)] }), permission);
  if (scope === null) throw new Error(`${role} holds none of ${permission}`);
  return scope;
}
const superScope = (permission: string, userId?: string) => scopeFor(RoleCode.SUPER_ADMIN, permission, userId);
const tohfaScope = (permission: string, userId?: string) => scopeFor(RoleCode.TOHFA_ADMIN, permission, userId);

function aRequest(overrides: Partial<PromotionRow> = {}): PromotionRow {
  return {
    id: newId(),
    targetUserId: newId(),
    fromRole: 'SUB_WH_ADMIN',
    toRole: 'MAIN_WH_ADMIN',
    requestedBy: newId(),
    reason: 'Runs Ooty well',
    status: 'PENDING',
    decidedBy: null,
    decidedAt: null,
    decisionNote: null,
    createdAt: new Date('2026-10-20T09:00:00Z'),
    ...overrides,
  };
}

interface FakeState {
  events: string[];
  invalidated: string[];
  request: PromotionRow | null;
  targetRoles: string[] | null;
  pending: boolean;
}

function fakeRepo(state: Partial<FakeState> = {}): { repo: AdminPromotionsRepo; calls: FakeState } {
  const calls: FakeState = { events: [], invalidated: [], request: null, targetRoles: ['SUB_WH_ADMIN'], pending: false, ...state };
  const repo: AdminPromotionsRepo = {
    async findForUpdate() {
      calls.events.push('load');
      return calls.request;
    },
    async findById() {
      calls.events.push('read');
      return calls.request;
    },
    async list(_db, query) {
      calls.events.push(`list:${query.limit}`);
      return { items: calls.request === null ? [] : [calls.request], nextCursor: null, hasMore: false };
    },
    async lockTargetRoles() {
      calls.events.push('lockTarget');
      return calls.targetRoles;
    },
    async hasPendingForTarget() {
      calls.events.push('pendingCheck');
      return calls.pending;
    },
    async insertRequest(_db, input) {
      calls.events.push(`insert:${input.fromRole}->${input.toRole}`);
      return aRequest({ ...input, status: 'PENDING' });
    },
    async endRoleAssignments(_db, _userId, roleCode) {
      calls.events.push(`end:${roleCode}`);
      return 1;
    },
    async addRoleAssignment(_db, input) {
      calls.events.push(`add:${input.roleCode}`);
    },
    async markApproved() {
      throw new Error('unexpected approve');
    },
    async markRejected(_db, _id, decidedBy, note) {
      calls.events.push('reject');
      return { ...calls.request!, status: 'REJECTED', decidedBy, decidedAt: new Date('2026-10-23T10:00:00Z'), decisionNote: note };
    },
    async revokeSessions() {
      calls.events.push('revokeSessions');
    },
    async revokeRefreshTokens() {
      calls.events.push('revokeRefreshTokens');
      return 1;
    },
  };
  return { repo, calls };
}

interface RecordedQuery {
  sql: string;
  params: unknown[];
}

function serviceWith(repo: AdminPromotionsRepo, calls: FakeState, log: RecordedQuery[] = []) {
  const tx = {
    async query(sql: string, params: unknown[] = []) {
      log.push({ sql, params });
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  } as Executor;
  return createAdminPromotionsService({
    repo,
    db: tx,
    transaction: async (fn) => {
      const result = await fn(tx);
      calls.events.push('commit');
      return result;
    },
    invalidateAccessTokens: async (userId) => {
      calls.events.push('invalidate');
      calls.invalidated.push(userId);
    },
  });
}

const auditInserts = (log: RecordedQuery[]): RecordedQuery[] => log.filter((q) => /INSERT INTO audit_log/.test(q.sql));

async function caught(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

const REQUEST = 'admin.promotion.request';
const VIEW = 'admin.promotion.view';
const REJECT = 'admin.promotion.reject';

// ---------------------------------------------------------------------------
// 1. Service: create
// ---------------------------------------------------------------------------
describe('promotion request create: refusals (BR-117b, BR-117c, BR-117d)', () => {
  it('BR-117b: requesting a promotion of your own account is 403 and nothing is read or written', async () => {
    const scope = superScope(REQUEST);
    const { repo, calls } = fakeRepo();
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).create(scope, { targetUserId: scope.userId, toRole: 'MAIN_WH_ADMIN', reason: 'x' }));
    expect(error.status).toBe(403);
    expect(calls.events).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-117b: a target that is not a live admin (missing, deleted, not ADMIN, or no live role) is 404 and nothing is written', async () => {
    for (const targetRoles of [null, [], ['FARMER']]) {
      const { repo, calls } = fakeRepo({ targetRoles });
      const log: RecordedQuery[] = [];
      const error = await caught(serviceWith(repo, calls, log).create(superScope(REQUEST), { targetUserId: newId(), toRole: 'MAIN_WH_ADMIN', reason: 'x' }));
      expect(error.status, JSON.stringify(targetRoles)).toBe(404);
      expect(calls.events.some((e) => e.startsWith('insert'))).toBe(false);
      expect(auditInserts(log)).toEqual([]);
    }
  });

  it('BR-117b: toRole not strictly higher than the target\'s highest role is 422 on body.toRole', async () => {
    for (const [targetRoles, toRole] of [
      [['MAIN_WH_ADMIN'], 'MAIN_WH_ADMIN'],
      [['TOHFA_ADMIN'], 'MAIN_WH_ADMIN'],
      [['SUB_WH_ADMIN', 'TOHFA_ADMIN'], 'TOHFA_ADMIN'],
      [['SUPER_ADMIN'], 'SUPER_ADMIN'],
    ] as const) {
      const { repo, calls } = fakeRepo({ targetRoles: [...targetRoles] });
      const error = await caught(serviceWith(repo, calls).create(superScope(REQUEST), { targetUserId: newId(), toRole, reason: 'x' }));
      expect(error.status, `${targetRoles.join('+')} -> ${toRole}`).toBe(422);
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(Object.keys(error.errors ?? {})).toContain('body.toRole');
      expect(calls.events.some((e) => e.startsWith('insert'))).toBe(false);
    }
  });

  it('BR-117b: a target holding two live roles tied at its highest level (FARMER_ADMIN + MAIN_WH_ADMIN) is 409 CONFLICT (ambiguous from_role)', async () => {
    const { repo, calls } = fakeRepo({ targetRoles: ['FARMER_ADMIN', 'MAIN_WH_ADMIN'] });
    const error = await caught(serviceWith(repo, calls).create(superScope(REQUEST), { targetUserId: newId(), toRole: 'TOHFA_ADMIN', reason: 'x' }));
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(calls.events.some((e) => e.startsWith('insert'))).toBe(false);
  });

  it('BR-117c: LOWER_ROLES_ONLY: a TOHFA_ADMIN may not request a promotion into a role above its own, nor for an account at or above its level (403)', async () => {
    const cases: Array<[string[], 'SUPER_ADMIN' | 'TOHFA_ADMIN' | 'MAIN_WH_ADMIN']> = [
      [['MAIN_WH_ADMIN'], 'SUPER_ADMIN'],
      [['SUB_WH_ADMIN'], 'SUPER_ADMIN'],
      [['TOHFA_ADMIN'], 'SUPER_ADMIN'],
    ];
    for (const [targetRoles, toRole] of cases) {
      const { repo, calls } = fakeRepo({ targetRoles });
      const error = await caught(serviceWith(repo, calls).create(tohfaScope(REQUEST), { targetUserId: newId(), toRole, reason: 'x' }));
      expect(error.status, `${targetRoles.join('+')} -> ${toRole}`).toBe(403);
      expect(calls.events.some((e) => e.startsWith('insert'))).toBe(false);
    }
  });

  it('BR-117c: a TOHFA_ADMIN may request SUB_WH_ADMIN -> MAIN_WH_ADMIN and MAIN_WH_ADMIN -> TOHFA_ADMIN; a SUPER_ADMIN may request TOHFA_ADMIN -> SUPER_ADMIN', async () => {
    for (const [scope, targetRoles, toRole] of [
      [tohfaScope(REQUEST), ['SUB_WH_ADMIN'], 'MAIN_WH_ADMIN'],
      [tohfaScope(REQUEST), ['MAIN_WH_ADMIN'], 'TOHFA_ADMIN'],
      [superScope(REQUEST), ['TOHFA_ADMIN'], 'SUPER_ADMIN'],
    ] as const) {
      const { repo, calls } = fakeRepo({ targetRoles: [...targetRoles] });
      const result = await serviceWith(repo, calls).create(scope, { targetUserId: newId(), toRole, reason: 'x' });
      expect(result.status).toBe('PENDING');
      expect(result.fromRole).toBe(targetRoles[0]);
      expect(result.toRole).toBe(toRole);
    }
  });

  it('BR-117d: a target that already has a PENDING request is 409 CONFLICT and nothing is written', async () => {
    const { repo, calls } = fakeRepo({ pending: true });
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).create(superScope(REQUEST), { targetUserId: newId(), toRole: 'MAIN_WH_ADMIN', reason: 'x' }));
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(calls.events).toEqual(['lockTarget', 'pendingCheck']);
    expect(auditInserts(log)).toEqual([]);
  });
});

describe('promotion request create: the write (BR-117e, BR-35)', () => {
  it('BR-117e: inserts a PENDING request (from_role derived, requested_by = caller) and one audit row in the same transaction; no role, session or token change', async () => {
    const { repo, calls } = fakeRepo({ targetRoles: ['SUB_WH_ADMIN'] });
    const log: RecordedQuery[] = [];
    const target = newId();
    const actor = tohfaScope(REQUEST, IDS.userTohfaAdmin);
    const result = await serviceWith(repo, calls, log).create(actor, { targetUserId: target, toRole: 'MAIN_WH_ADMIN', reason: 'Runs Ooty well' });

    expect(promotionRequest.parse(result)).toEqual(result);
    expect(result).toMatchObject({ targetUserId: target, fromRole: 'SUB_WH_ADMIN', toRole: 'MAIN_WH_ADMIN', requestedBy: IDS.userTohfaAdmin, reason: 'Runs Ooty well', status: 'PENDING', decidedBy: null });
    expect(calls.events).toEqual(['lockTarget', 'pendingCheck', 'insert:SUB_WH_ADMIN->MAIN_WH_ADMIN', 'commit']);
    expect(calls.invalidated).toEqual([]);

    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    const params = inserts[0]!.params;
    expect(params[0]).toBe(IDS.userTohfaAdmin);
    expect(params[2]).toBe(RoleCode.TOHFA_ADMIN);
    expect(params[3]).toBe(REQUEST);
    expect(params[4]).toBe('promotion_request');
    expect(params[5]).toBe(result.id);
    expect(params[8]).toBeNull();
    expect(JSON.parse(params[9] as string)).toMatchObject({ status: 'PENDING', targetUserId: target, fromRole: 'SUB_WH_ADMIN', toRole: 'MAIN_WH_ADMIN' });
  });

  it('BR-117d: a unique-index race on the one-PENDING rule surfaces as 409 CONFLICT, not 500', async () => {
    const { repo, calls } = fakeRepo();
    repo.insertRequest = async () => {
      throw Object.assign(new Error('duplicate key'), { code: '23505', constraint: 'uq_promotion_requests_one_pending' });
    };
    const error = await caught(serviceWith(repo, calls).create(superScope(REQUEST), { targetUserId: newId(), toRole: 'MAIN_WH_ADMIN', reason: 'x' }));
    expect(error.status).toBe(409);
    expect(error.code).toBe('CONFLICT');
  });
});

// ---------------------------------------------------------------------------
// 1b. Service: reject
// ---------------------------------------------------------------------------
describe('promotion request reject (BR-117f, BR-35)', () => {
  it('BR-117f: an unknown request is 404 and nothing is written', async () => {
    const { repo, calls } = fakeRepo({ request: null });
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).reject(superScope(REJECT), newId(), {}));
    expect(error.status).toBe(404);
    expect(calls.events).toEqual(['load']);
    expect(auditInserts(log)).toEqual([]);
  });

  it.each(['APPROVED', 'REJECTED'] as const)('BR-117f: a %s request is 409 INVALID_STATE_TRANSITION and nothing is written', async (status) => {
    const { repo, calls } = fakeRepo({ request: aRequest({ status, decidedBy: newId(), decidedAt: new Date() }) });
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).reject(superScope(REJECT), newId(), {}));
    expect(error.status).toBe(409);
    expect(error.code).toBe('INVALID_STATE_TRANSITION');
    expect(calls.events).toEqual(['load']);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-117f: rejecting a promotion of your own account is 403 and nothing is written', async () => {
    const scope = superScope(REJECT);
    const { repo, calls } = fakeRepo({ request: aRequest({ targetUserId: scope.userId }) });
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).reject(scope, newId(), {}));
    expect(error.status).toBe(403);
    expect(calls.events).toEqual(['load']);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-117f: marks REJECTED with the decider and note, one audit row with before/after, and no role, session or token change', async () => {
    const req = aRequest();
    const { repo, calls } = fakeRepo({ request: req });
    const log: RecordedQuery[] = [];
    const result = await serviceWith(repo, calls, log).reject(superScope(REJECT, IDS.userSuperAdmin), req.id, { note: 'Not yet' });

    expect(promotionRequest.parse(result)).toEqual(result);
    expect(result).toMatchObject({ id: req.id, status: 'REJECTED', decidedBy: IDS.userSuperAdmin, decisionNote: 'Not yet' });
    expect(calls.events).toEqual(['load', 'reject', 'commit']);
    expect(calls.invalidated).toEqual([]);

    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    const params = inserts[0]!.params;
    expect(params[3]).toBe(REJECT);
    expect(params[4]).toBe('promotion_request');
    expect(params[5]).toBe(req.id);
    expect(JSON.parse(params[8] as string)).toMatchObject({ status: 'PENDING' });
    expect(JSON.parse(params[9] as string)).toMatchObject({ status: 'REJECTED', decisionNote: 'Not yet' });
    expect(params[10]).toEqual(expect.arrayContaining(['status', 'decidedBy', 'decidedAt', 'decisionNote']));
  });
});

// ---------------------------------------------------------------------------
// 1c. Service: reads
// ---------------------------------------------------------------------------
describe('promotion request reads (BR-117g)', () => {
  it('BR-117g: an `all` scope lists through the repo and reads one by id', async () => {
    const req = aRequest();
    const { repo, calls } = fakeRepo({ request: req });
    const service = serviceWith(repo, calls);
    const page = await service.list(superScope(VIEW), listPromotionsQuery.parse({}));
    expect(page).toEqual({ items: [promotionRequest.parse(page.items[0])], page: { nextCursor: null, hasMore: false } });
    expect(page.items[0]!.id).toBe(req.id);
    expect((await service.get(superScope(VIEW), req.id)).id).toBe(req.id);
  });

  it('BR-117g: an unknown id is 404', async () => {
    const { repo, calls } = fakeRepo({ request: null });
    expect((await caught(serviceWith(repo, calls).get(superScope(VIEW), newId()))).status).toBe(404);
  });

  it('BR-117g: a scope that is not `all` reads an empty page and 404 by id, never 403, and issues no SQL', async () => {
    const { repo, calls } = fakeRepo({ request: aRequest() });
    const service = serviceWith(repo, calls);
    const own = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, permission: VIEW });
    expect(await service.list(own, listPromotionsQuery.parse({}))).toEqual({ items: [], page: { nextCursor: null, hasMore: false } });
    const error = await caught(service.get(own, newId()));
    expect(error.status).toBe(404);
    expect(calls.events).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Schemas
// ---------------------------------------------------------------------------
describe('promotion request schemas (BR-117b)', () => {
  it('BR-117b: create needs a uuid target, an allowed toRole and a 1-500 character trimmed reason; unknown keys are refused', () => {
    const target = newId();
    expect(createPromotionBody.parse({ targetUserId: target, toRole: 'MAIN_WH_ADMIN', reason: '  ok ' })).toEqual({ targetUserId: target, toRole: 'MAIN_WH_ADMIN', reason: 'ok' });
    for (const bad of [
      {},
      { targetUserId: 'x', toRole: 'MAIN_WH_ADMIN', reason: 'r' },
      { targetUserId: target, toRole: 'FARMER_ADMIN', reason: 'r' },
      { targetUserId: target, toRole: 'SUB_WH_ADMIN', reason: 'r' },
      { targetUserId: target, toRole: 'FARMER', reason: 'r' },
      { targetUserId: target, toRole: 'MAIN_WH_ADMIN' },
      { targetUserId: target, toRole: 'MAIN_WH_ADMIN', reason: '   ' },
      { targetUserId: target, toRole: 'MAIN_WH_ADMIN', reason: 'x'.repeat(501) },
      { targetUserId: target, toRole: 'MAIN_WH_ADMIN', reason: 'r', fromRole: 'SUB_WH_ADMIN' },
      { targetUserId: target, toRole: 'MAIN_WH_ADMIN', reason: 'r', status: 'APPROVED' },
    ]) {
      expect(createPromotionBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-117f: the reject body is optional; note is trimmed text up to 500 characters', () => {
    expect(rejectPromotionBody.parse(undefined)).toEqual({});
    expect(rejectPromotionBody.parse({ note: ' no ' })).toEqual({ note: 'no' });
    for (const bad of [{ note: '' }, { note: 'x'.repeat(501) }, { status: 'REJECTED' }]) {
      expect(rejectPromotionBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-117g: the list query is strict: status enum, uuid targetUserId, limit 1-100 (default 20), and only a cursor this list produced', () => {
    expect(listPromotionsQuery.parse({})).toEqual({ limit: 20 });
    expect(listPromotionsQuery.parse({ status: 'PENDING', limit: '5' })).toEqual({ status: 'PENDING', limit: 5 });
    for (const bad of [{ status: 'OPEN' }, { targetUserId: 'x' }, { limit: '0' }, { limit: '101' }, { cursor: 'garbage' }, { cursor: newId() }, { other: '1' }]) {
      expect(listPromotionsQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Router
// ---------------------------------------------------------------------------
describe('promotion request router (BR-117a)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const others = () => [
    token([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]),
    token([{ code: RoleCode.MAIN_WH_ADMIN }]),
    token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: IDS.warehouseOoty }]),
    token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
    token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
  ];

  it('BR-117a: create, list and read are 401 without a token and 403 for every role but SUPER_ADMIN and TOHFA_ADMIN', async () => {
    const id = newId();
    const body = { targetUserId: newId(), toRole: 'MAIN_WH_ADMIN', reason: 'r' };
    expect((await request(server).post('/v1/admin/promotions').send(body)).status).toBe(401);
    expect((await request(server).get('/v1/admin/promotions')).status).toBe(401);
    expect((await request(server).get(`/v1/admin/promotions/${id}`)).status).toBe(401);
    for (const auth of others()) {
      for (const res of [
        await request(server).post('/v1/admin/promotions').set('Authorization', auth).send(body),
        await request(server).get('/v1/admin/promotions').set('Authorization', auth),
        await request(server).get(`/v1/admin/promotions/${id}`).set('Authorization', auth),
      ]) {
        expect(res.status).toBe(403);
        expect(res.body.code).toBe('FORBIDDEN');
      }
    }
  });

  it('BR-117a: reject is 401 without a token and 403 for every role but SUPER_ADMIN (TOHFA_ADMIN included)', async () => {
    const path = `/v1/admin/promotions/${newId()}/reject`;
    expect((await request(server).post(path)).status).toBe(401);
    for (const auth of [token([{ code: RoleCode.TOHFA_ADMIN }]), ...others()]) {
      const res = await request(server).post(path).set('Authorization', auth).send({});
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('BR-117a: a malformed id, body or query is 422 before any SQL', async () => {
    const auth = token([{ code: RoleCode.SUPER_ADMIN }]);
    expect((await request(server).post('/v1/admin/promotions').set('Authorization', auth).send({ targetUserId: newId(), toRole: 'FARMER_ADMIN', reason: 'r' })).status).toBe(422);
    expect((await request(server).get('/v1/admin/promotions?status=OPEN').set('Authorization', auth)).status).toBe(422);
    expect((await request(server).get('/v1/admin/promotions/not-a-uuid').set('Authorization', auth)).status).toBe(422);
    expect((await request(server).post('/v1/admin/promotions/not-a-uuid/reject').set('Authorization', auth)).status).toBe(422);
    expect((await request(server).post(`/v1/admin/promotions/${newId()}/reject`).set('Authorization', auth).send({ extra: 1 })).status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// 4. PostgreSQL
// ---------------------------------------------------------------------------
describeIfDatabase('promotion requests (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;
  let warehouseId = '';

  beforeAll(async () => {
    expect(await databaseReady('promotion_requests'), 'the database is reachable and migrated (0074)').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
    warehouseId = (await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE deleted_at IS NULL ORDER BY code LIMIT 1`)).rows[0]!.id;
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

  async function anAdmin(tx: pg.PoolClient, role: string): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE')`, [id, randomMobile(), `Admin ${role}`]);
    await tx.query(
      `INSERT INTO user_roles (user_id, role_id, warehouse_id, valid_from) SELECT $1, r.id, $3, now() - interval '2 days' FROM roles r WHERE r.code = $2`,
      [id, role, role === 'SUB_WH_ADMIN' ? warehouseId : null],
    );
    return id;
  }

  const service = (tx: pg.PoolClient, invalidated: string[] = []) =>
    createAdminPromotionsService({
      repo: adminPromotionsRepo,
      db: tx,
      transaction: async (fn) => fn(tx),
      invalidateAccessTokens: async (userId) => {
        invalidated.push(userId);
      },
    });

  const auditCount = async (tx: pg.PoolClient, action: string, id: string): Promise<number> =>
    (await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = $1 AND entity_id = $2`, [action, id])).rows[0]!.n;

  it('BR-117e / BR-114 (PostgreSQL): a TOHFA_ADMIN creates a request, a second one for the same target is 409, and a SUPER_ADMIN can then approve it', async () => {
    await inRollback(async (tx) => {
      const tohfa = await anAdmin(tx, 'TOHFA_ADMIN');
      const sa = await anAdmin(tx, 'SUPER_ADMIN');
      const target = await anAdmin(tx, 'SUB_WH_ADMIN');

      const created = await service(tx).create(tohfaScope(REQUEST, tohfa), { targetUserId: target, toRole: 'MAIN_WH_ADMIN', reason: 'Ready' });
      expect(created).toMatchObject({ targetUserId: target, fromRole: 'SUB_WH_ADMIN', toRole: 'MAIN_WH_ADMIN', requestedBy: tohfa, reason: 'Ready', status: 'PENDING' });
      expect(await auditCount(tx, REQUEST, created.id)).toBe(1);
      const live = await tx.query<{ role_code: string }>(`SELECT role_code FROM user_roles WHERE user_id = $1 AND (valid_to IS NULL OR valid_to > now())`, [target]);
      expect(live.rows).toEqual([{ role_code: 'SUB_WH_ADMIN' }]);

      const again = await caught(service(tx).create(superScope(REQUEST, sa), { targetUserId: target, toRole: 'TOHFA_ADMIN', reason: 'Other' }));
      expect(again.code).toBe('CONFLICT');

      const approved = await service(tx).approve(superScope('admin.promotion.approve', sa), created.id, {});
      expect(approved.status).toBe('APPROVED');
    });
  });

  it('BR-117f (PostgreSQL): reject marks REJECTED with one audit row and no role change; a second reject and a later approve are 409; a new request may then be created', async () => {
    await inRollback(async (tx) => {
      const sa = await anAdmin(tx, 'SUPER_ADMIN');
      const target = await anAdmin(tx, 'MAIN_WH_ADMIN');
      const created = await service(tx).create(superScope(REQUEST, sa), { targetUserId: target, toRole: 'TOHFA_ADMIN', reason: 'Ready' });

      const rejected = await service(tx).reject(superScope(REJECT, sa), created.id, { note: 'Next quarter' });
      expect(rejected).toMatchObject({ id: created.id, status: 'REJECTED', decidedBy: sa, decisionNote: 'Next quarter' });
      expect(await auditCount(tx, REJECT, created.id)).toBe(1);
      const live = await tx.query<{ role_code: string }>(`SELECT role_code FROM user_roles WHERE user_id = $1 AND (valid_to IS NULL OR valid_to > now())`, [target]);
      expect(live.rows).toEqual([{ role_code: 'MAIN_WH_ADMIN' }]);

      expect((await caught(service(tx).reject(superScope(REJECT, sa), created.id, {}))).code).toBe('INVALID_STATE_TRANSITION');
      expect((await caught(service(tx).approve(superScope('admin.promotion.approve', sa), created.id, {}))).code).toBe('INVALID_STATE_TRANSITION');

      const fresh = await service(tx).create(superScope(REQUEST, sa), { targetUserId: target, toRole: 'TOHFA_ADMIN', reason: 'Try again' });
      expect(fresh.status).toBe('PENDING');
    });
  });

  it('BR-117b (PostgreSQL): a non-admin user is 404; a disabled-or-ended admin with no live role is 404', async () => {
    await inRollback(async (tx) => {
      const sa = await anAdmin(tx, 'SUPER_ADMIN');
      const farmerUser = newId();
      await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'F', 'FARMER', 'ACTIVE')`, [farmerUser, randomMobile()]);
      expect((await caught(service(tx).create(superScope(REQUEST, sa), { targetUserId: farmerUser, toRole: 'MAIN_WH_ADMIN', reason: 'r' }))).status).toBe(404);
      const ended = await anAdmin(tx, 'SUB_WH_ADMIN');
      await tx.query(`UPDATE user_roles SET valid_to = now() WHERE user_id = $1`, [ended]);
      expect((await caught(service(tx).create(superScope(REQUEST, sa), { targetUserId: ended, toRole: 'MAIN_WH_ADMIN', reason: 'r' }))).status).toBe(404);
      expect((await caught(service(tx).create(superScope(REQUEST, sa), { targetUserId: newId(), toRole: 'MAIN_WH_ADMIN', reason: 'r' }))).status).toBe(404);
    });
  });

  it('BR-117g (PostgreSQL): list filters by status and target, pages one row at a time in (createdAt, id) DESC order with every row exactly once, and get reads one', async () => {
    await inRollback(async (tx) => {
      const sa = await anAdmin(tx, 'SUPER_ADMIN');
      const targets = [await anAdmin(tx, 'SUB_WH_ADMIN'), await anAdmin(tx, 'SUB_WH_ADMIN'), await anAdmin(tx, 'MAIN_WH_ADMIN')];
      const ids: string[] = [];
      for (const target of targets) {
        const toRole = target === targets[2] ? 'TOHFA_ADMIN' : 'MAIN_WH_ADMIN';
        ids.push((await service(tx).create(superScope(REQUEST, sa), { targetUserId: target, toRole, reason: 'r' })).id);
      }
      // Same transaction => same now(): every created_at ties, so the id breaks the tie.
      await service(tx).reject(superScope(REJECT, sa), ids[0]!, {});

      const scope = superScope(VIEW, sa);
      const mine = new Set(ids);
      const full = (await service(tx).list(scope, listPromotionsQuery.parse({ limit: '100' }))).items.filter((r) => mine.has(r.id));
      expect(full.map((r) => r.id).sort()).toEqual([...ids].sort());

      const paged: string[] = [];
      let cursor: string | undefined;
      for (let i = 0; i < 1000; i += 1) {
        const page = await service(tx).list(scope, listPromotionsQuery.parse(cursor === undefined ? { limit: '1' } : { limit: '1', cursor }));
        paged.push(...page.items.map((r) => r.id));
        if (!page.page.hasMore) break;
        cursor = page.page.nextCursor!;
      }
      expect(paged.filter((id) => mine.has(id))).toEqual(full.map((r) => r.id));
      expect(new Set(paged).size).toBe(paged.length);

      const pending = (await service(tx).list(scope, listPromotionsQuery.parse({ status: 'PENDING', limit: '100' }))).items.filter((r) => mine.has(r.id));
      expect(pending.map((r) => r.id).sort()).toEqual([ids[1]!, ids[2]!].sort());
      const forTarget = await service(tx).list(scope, listPromotionsQuery.parse({ targetUserId: targets[2] }));
      expect(forTarget.items.map((r) => r.id)).toEqual([ids[2]]);

      expect((await service(tx).get(scope, ids[0]!)).status).toBe('REJECTED');
      expect((await caught(service(tx).get(scope, newId()))).status).toBe(404);
    });
  });
});
