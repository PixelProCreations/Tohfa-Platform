/**
 * Admin promotion approval: POST /admin/promotions/{id}/approve (BR-114), with BR-35 (audit row in
 * the same transaction).
 *
 * The PostgreSQL tests here insert the request rows directly inside a transaction that is always
 * rolled back; the create path itself (BR-117) is tested in admin-promotions.requests.test.ts.
 *
 * Layers:
 *  1. service against a fake repo
 *  2. request schema
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
import { approvePromotionBody, promotionRequest } from './admin-promotions.schema.js';
import { createAdminPromotionsService } from './admin-promotions.service.js';

const PERMISSION = 'admin.promotion.approve';
const W1 = IDS.warehouseOoty;

function superScope(userId: string = newId()): ResolvedScope {
  const scope = resolveScope(anActor({ userId, roles: [aRole(RoleCode.SUPER_ADMIN)] }), PERMISSION);
  if (scope === null) throw new Error('SUPER_ADMIN holds none');
  return scope;
}

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

interface Calls {
  events: string[];
  invalidated: string[];
}

function fakeRepo(row: PromotionRow | null, targetRoles: string[] | null = ['SUB_WH_ADMIN']): { repo: AdminPromotionsRepo; calls: Calls } {
  const calls: Calls = { events: [], invalidated: [] };
  const repo: AdminPromotionsRepo = {
    async findForUpdate() {
      calls.events.push('load');
      return row;
    },
    async lockTargetRoles() {
      calls.events.push('lockTarget');
      return targetRoles;
    },
    // Create/list/read/reject (BR-117) are not part of approve; reaching one here is a bug.
    async findById() {
      throw new Error('approve must not call findById');
    },
    async list() {
      throw new Error('approve must not call list');
    },
    async hasPendingForTarget() {
      throw new Error('approve must not call hasPendingForTarget');
    },
    async insertRequest() {
      throw new Error('approve must not call insertRequest');
    },
    async markRejected() {
      throw new Error('approve must not call markRejected');
    },
    async endRoleAssignments(_db, _userId, roleCode) {
      calls.events.push(`end:${roleCode}`);
      return 1;
    },
    async addRoleAssignment(_db, input) {
      calls.events.push(`add:${input.roleCode}`);
    },
    async markApproved(_db, _id, decidedBy, note) {
      calls.events.push('approve');
      return { ...row!, status: 'APPROVED', decidedBy, decidedAt: new Date('2026-10-23T10:00:00Z'), decisionNote: note };
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

function serviceWith(repo: AdminPromotionsRepo, calls: Calls, log: RecordedQuery[] = []) {
  const tx = {
    async query(sql: string, params: unknown[] = []) {
      log.push({ sql, params });
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  } as Executor;
  return createAdminPromotionsService({
    repo,
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

// ---------------------------------------------------------------------------
// 1. Service
// ---------------------------------------------------------------------------
describe('promotion approve: state and target (BR-114b, BR-114c)', () => {
  it('BR-114b: an unknown request is 404 NOT_FOUND and nothing is written', async () => {
    const { repo, calls } = fakeRepo(null);
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).approve(superScope(), newId(), {}));
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(calls.events).toEqual(['load']);
    expect(auditInserts(log)).toEqual([]);
  });

  it.each(['APPROVED', 'REJECTED'] as const)('BR-114b: a %s request is 409 INVALID_STATE_TRANSITION and nothing is written', async (status) => {
    const { repo, calls } = fakeRepo(aRequest({ status, decidedBy: newId(), decidedAt: new Date() }));
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).approve(superScope(), newId(), {}));
    expect(error.status).toBe(409);
    expect(error.code).toBe('INVALID_STATE_TRANSITION');
    expect(calls.events).toEqual(['load']);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-114c: approving a promotion of your own account is 403 and nothing is written', async () => {
    const scope = superScope();
    const { repo, calls } = fakeRepo(aRequest({ targetUserId: scope.userId }));
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).approve(scope, newId(), {}));
    expect(error.status).toBe(403);
    expect(calls.events).toEqual(['load']);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-114c: an actor whose grant is not `all` cannot promote into a role above its own (403)', async () => {
    const scope = aScope({ level: ScopeLevel.CONDITIONAL, roleCode: RoleCode.TOHFA_ADMIN, permission: PERMISSION });
    const { repo, calls } = fakeRepo(aRequest({ fromRole: 'TOHFA_ADMIN', toRole: 'SUPER_ADMIN' }), ['TOHFA_ADMIN']);
    expect((await caught(serviceWith(repo, calls).approve(scope, newId(), {}))).status).toBe(403);
    expect(calls.events).not.toContain('approve');
  });

  it('BR-114c: a stale request (target gone, or no longer holding from_role) is 409 CONFLICT and nothing is written', async () => {
    for (const targetRoles of [null, ['MAIN_WH_ADMIN']]) {
      const { repo, calls } = fakeRepo(aRequest(), targetRoles);
      const log: RecordedQuery[] = [];
      const error = await caught(serviceWith(repo, calls, log).approve(superScope(), newId(), {}));
      expect(error.status).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(calls.events).toEqual(['load', 'lockTarget']);
      expect(auditInserts(log)).toEqual([]);
    }
  });
});

describe('promotion approve: the approval (BR-114d, BR-35)', () => {
  it('BR-114d: ends the old role, adds the new one, marks APPROVED, revokes sessions and refresh tokens, one audit row, then invalidates tokens after commit', async () => {
    const req = aRequest();
    const { repo, calls } = fakeRepo(req);
    const log: RecordedQuery[] = [];
    const actor = superScope(IDS.userSuperAdmin);
    const result = await serviceWith(repo, calls, log).approve(actor, req.id, { note: 'Approved at review' });

    expect(promotionRequest.parse(result)).toEqual(result);
    expect(result).toMatchObject({ id: req.id, status: 'APPROVED', decidedBy: IDS.userSuperAdmin, decisionNote: 'Approved at review', fromRole: 'SUB_WH_ADMIN', toRole: 'MAIN_WH_ADMIN' });
    expect(calls.events).toEqual([
      'load',
      'lockTarget',
      'end:SUB_WH_ADMIN',
      'add:MAIN_WH_ADMIN',
      'approve',
      'revokeSessions',
      'revokeRefreshTokens',
      'commit',
      'invalidate',
    ]);
    expect(calls.invalidated).toEqual([req.targetUserId]);

    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    const params = inserts[0]!.params;
    expect(params[0]).toBe(IDS.userSuperAdmin);
    expect(params[2]).toBe(RoleCode.SUPER_ADMIN);
    expect(params[3]).toBe(PERMISSION);
    expect(params[4]).toBe('promotion_request');
    expect(params[5]).toBe(req.id);
    expect(JSON.parse(params[8] as string)).toMatchObject({ status: 'PENDING', targetUserId: req.targetUserId, fromRole: 'SUB_WH_ADMIN', toRole: 'MAIN_WH_ADMIN' });
    expect(JSON.parse(params[9] as string)).toMatchObject({ status: 'APPROVED', decidedBy: IDS.userSuperAdmin, decisionNote: 'Approved at review' });
    expect(params[10]).toEqual(expect.arrayContaining(['status', 'decidedBy', 'decidedAt', 'decisionNote']));
  });

  it('BR-114d: a target already holding to_role keeps that assignment (no duplicate add)', async () => {
    const { repo, calls } = fakeRepo(aRequest(), ['SUB_WH_ADMIN', 'MAIN_WH_ADMIN']);
    await serviceWith(repo, calls).approve(superScope(), newId(), {});
    expect(calls.events).toContain('end:SUB_WH_ADMIN');
    expect(calls.events.filter((e) => e.startsWith('add:'))).toEqual([]);
  });

  it('BR-114d: when the transaction fails, access tokens are not invalidated', async () => {
    const { repo, calls } = fakeRepo(aRequest());
    repo.revokeRefreshTokens = async () => {
      throw new Error('boom');
    };
    await expect(serviceWith(repo, calls).approve(superScope(), newId(), {})).rejects.toThrow('boom');
    expect(calls.invalidated).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Request schema
// ---------------------------------------------------------------------------
describe('promotion approve: request schema (BR-114)', () => {
  it('BR-114: the body is optional; note is trimmed text up to 500 characters; unknown keys are refused', () => {
    expect(approvePromotionBody.parse(undefined)).toEqual({});
    expect(approvePromotionBody.parse({ note: '  ok ' })).toEqual({ note: 'ok' });
    for (const bad of [{ note: '' }, { note: 'x'.repeat(501) }, { status: 'APPROVED' }, { toRole: 'SUPER_ADMIN' }]) {
      expect(approvePromotionBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Router
// ---------------------------------------------------------------------------
describe('promotion approve router (BR-114a)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-114a: 401 without a token; 403 for every role but SUPER_ADMIN', async () => {
    const path = `/v1/admin/promotions/${newId()}/approve`;
    expect((await request(server).post(path)).status).toBe(401);
    for (const auth of [
      token([{ code: RoleCode.TOHFA_ADMIN }]),
      token([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]),
      token([{ code: RoleCode.MAIN_WH_ADMIN }]),
      token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }]),
      token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
      token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
    ]) {
      const res = await request(server).post(path).set('Authorization', auth).send({});
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('BR-114a: a malformed id or body is 422 before any SQL', async () => {
    const auth = token([{ code: RoleCode.SUPER_ADMIN }]);
    expect((await request(server).post('/v1/admin/promotions/not-a-uuid/approve').set('Authorization', auth)).status).toBe(422);
    expect((await request(server).post(`/v1/admin/promotions/${newId()}/approve`).set('Authorization', auth).send({ extra: 1 })).status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// 4. PostgreSQL
// ---------------------------------------------------------------------------
describeIfDatabase('promotion approve (PostgreSQL, rolled back)', () => {
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

  async function aPromotion(tx: pg.PoolClient, target: string, requestedBy: string, fromRole = 'SUB_WH_ADMIN', toRole = 'MAIN_WH_ADMIN'): Promise<string> {
    const result = await tx.query<{ id: string }>(
      `INSERT INTO promotion_requests (target_user_id, from_role, to_role, requested_by, reason) VALUES ($1, $2, $3, $4, 'fixture') RETURNING id`,
      [target, fromRole, toRole, requestedBy],
    );
    return result.rows[0]!.id;
  }

  async function aSession(tx: pg.PoolClient, userId: string): Promise<void> {
    const session = (await tx.query<{ id: string }>(`INSERT INTO sessions (user_id, expires_at) VALUES ($1, now() + interval '1 day') RETURNING id`, [userId])).rows[0]!.id;
    await tx.query(`INSERT INTO refresh_tokens (session_id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, now() + interval '1 day')`, [session, userId, `hash-${newId()}`]);
  }

  const service = (tx: pg.PoolClient, invalidated: string[] = []) =>
    createAdminPromotionsService({
      repo: adminPromotionsRepo,
      transaction: async (fn) => fn(tx),
      invalidateAccessTokens: async (userId) => {
        invalidated.push(userId);
      },
    });

  it('BR-114d (PostgreSQL): a SUB_WH_ADMIN promoted to MAIN_WH_ADMIN: old role ended, new role live, request APPROVED, sessions revoked, one audit row; a second approve is 409', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      const target = await anAdmin(tx, 'SUB_WH_ADMIN');
      await aSession(tx, target);
      const id = await aPromotion(tx, target, actor);
      const invalidated: string[] = [];

      const result = await service(tx, invalidated).approve(superScope(actor), id, { note: 'ok' });
      expect(result).toMatchObject({ id, status: 'APPROVED', decidedBy: actor, decisionNote: 'ok', targetUserId: target });
      expect(invalidated).toEqual([target]);

      const live = await tx.query<{ role_code: string; warehouse_id: string | null }>(
        `SELECT role_code, warehouse_id FROM user_roles WHERE user_id = $1 AND valid_from <= now() AND (valid_to IS NULL OR valid_to > now())`,
        [target],
      );
      expect(live.rows).toEqual([{ role_code: 'MAIN_WH_ADMIN', warehouse_id: null }]);
      const open = await tx.query<{ s: number; r: number }>(
        `SELECT (SELECT count(*)::int FROM sessions WHERE user_id = $1 AND revoked_at IS NULL) AS s,
                (SELECT count(*)::int FROM refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL) AS r`,
        [target],
      );
      expect(open.rows[0]).toEqual({ s: 0, r: 0 });
      const audit = await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = $1 AND entity_id = $2`, [PERMISSION, id]);
      expect(audit.rows[0]!.n).toBe(1);

      const again = await caught(service(tx).approve(superScope(actor), id, {}));
      expect(again.code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  it('BR-114b (PostgreSQL): an unknown id is 404', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      expect((await caught(service(tx).approve(superScope(actor), newId(), {}))).status).toBe(404);
    });
  });

  it('BR-114c (PostgreSQL): a stale request (target no longer SUB_WH_ADMIN) is 409 CONFLICT and stays PENDING', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      const target = await anAdmin(tx, 'SUB_WH_ADMIN');
      const id = await aPromotion(tx, target, actor);
      await tx.query(`UPDATE user_roles SET valid_to = now() WHERE user_id = $1`, [target]);
      expect((await caught(service(tx).approve(superScope(actor), id, {}))).code).toBe('CONFLICT');
      expect((await tx.query(`SELECT status FROM promotion_requests WHERE id = $1`, [id])).rows[0]).toEqual({ status: 'PENDING' });
    });
  });

  it('BR-114e (PostgreSQL): the table refuses a second PENDING request for one target, a downward or sideways promotion, and a non-admin role', async () => {
    const violates = async (tx: pg.PoolClient, sql: string, params: unknown[]): Promise<string | undefined> => {
      await tx.query('SAVEPOINT s');
      try {
        await tx.query(sql, params);
        return undefined;
      } catch (error) {
        return (error as { code?: string }).code;
      } finally {
        await tx.query('ROLLBACK TO SAVEPOINT s');
      }
    };
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      const target = await anAdmin(tx, 'SUB_WH_ADMIN');
      await aPromotion(tx, target, actor);
      const insert = `INSERT INTO promotion_requests (target_user_id, from_role, to_role, requested_by) VALUES ($1, $2, $3, $4)`;
      expect(await violates(tx, insert, [target, 'SUB_WH_ADMIN', 'TOHFA_ADMIN', actor])).toBe('23505');
      const other = await anAdmin(tx, 'MAIN_WH_ADMIN');
      expect(await violates(tx, insert, [other, 'MAIN_WH_ADMIN', 'MAIN_WH_ADMIN', actor])).toBe('23514');
      expect(await violates(tx, insert, [other, 'FARMER_ADMIN', 'MAIN_WH_ADMIN', actor])).toBe('23514');
      expect(await violates(tx, insert, [other, 'TOHFA_ADMIN', 'MAIN_WH_ADMIN', actor])).toBe('23514');
      expect(await violates(tx, insert, [other, 'FARMER', 'MAIN_WH_ADMIN', actor])).toBe('23514');
      expect(await violates(tx, insert, [other, 'SUB_WH_ADMIN', 'FARMER_ADMIN', actor])).toBe('23514');
      expect(await violates(tx, insert, [other, 'MAIN_WH_ADMIN', 'TOHFA_ADMIN', actor])).toBeUndefined();
    });
  });
});
