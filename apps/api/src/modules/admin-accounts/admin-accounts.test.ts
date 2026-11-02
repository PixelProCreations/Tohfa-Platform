/**
 * Admin account disable (BR-110), with BR-35 (audit row in the same transaction).
 *
 * Layers:
 *  1. service against a fake repo (self, LOWER_ROLES_ONLY, last Super Admin, idempotency, revocation,
 *     audit image, token invalidation after commit)
 *  2. request schema
 *  3. the router: permission wiring (refused before any SQL runs)
 *  4. PostgreSQL: the real repo and SQL inside a transaction that is always rolled back
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
import { aRole, anActor, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { adminAccountsRepo, type AdminAccount, type AdminAccountRow, type AdminAccountsRepo } from './admin-accounts.repo.js';
import { adminAccountsRouter } from './admin-accounts.routes.js';
import { adminAccountStatus, disableAdminAccountBody } from './admin-accounts.schema.js';
import { createAdminAccountsService } from './admin-accounts.service.js';

const PERMISSION = 'admin.account.disable';
const ZONE = IDS.zoneNorth;
const W1 = IDS.warehouseOoty;

/** Scopes exactly as the middleware resolves them from docs/rbac.json. */
function scopeFor(code: RoleCode, userId: string = newId()): ResolvedScope {
  const extra = code === RoleCode.FARMER_ADMIN ? { zoneId: ZONE } : code === RoleCode.SUB_WH_ADMIN ? { warehouseId: W1 } : {};
  const scope = resolveScope(anActor({ userId, roles: [aRole(code, extra)] }), PERMISSION);
  if (scope === null) throw new Error(`${code} holds none`);
  return scope;
}

const LEVEL: Record<string, number> = {
  SUPER_ADMIN: 1,
  TOHFA_ADMIN: 2,
  FARMER_ADMIN: 3,
  MAIN_WH_ADMIN: 3,
  SUB_WH_ADMIN: 4,
};

function anAccount(roleCodes: string[], overrides: Partial<AdminAccountRow> = {}): AdminAccount {
  return {
    account: {
      id: newId(),
      fullName: 'Target Admin',
      status: 'ACTIVE',
      disabledAt: null,
      disabledBy: null,
      disabledReason: null,
      ...overrides,
    },
    roles: roleCodes.map((code) => ({ code, level: LEVEL[code]! })),
  };
}

interface Calls {
  events: string[];
  disabled: Array<{ id: string; by: string; reason: string | null }>;
  invalidated: string[];
}

function fakeRepo(target: AdminAccount | null, otherActiveSupers = 1): { repo: AdminAccountsRepo; calls: Calls } {
  const calls: Calls = { events: [], disabled: [], invalidated: [] };
  const unexpected = async (): Promise<never> => {
    throw new Error('create/zones repo method called by disable');
  };
  const repo: AdminAccountsRepo = {
    async findAdminForUpdate() {
      calls.events.push('load');
      return target;
    },
    async countOtherActiveSuperAdmins() {
      calls.events.push('countSupers');
      return otherActiveSupers;
    },
    async markDisabled(_db, id, by, reason) {
      calls.events.push('disable');
      calls.disabled.push({ id, by, reason });
      return { ...target!.account, status: 'DISABLED', disabledAt: new Date('2026-10-23T10:00:00Z'), disabledBy: by, disabledReason: reason };
    },
    async revokeSessions() {
      calls.events.push('revokeSessions');
    },
    async revokeRefreshTokens() {
      calls.events.push('revokeRefreshTokens');
      return 2;
    },
    // Create (BR-112) and zones (BR-113) are never reached by disable.
    findZone: unexpected,
    insertAdminUser: unexpected,
    insertAdminProfile: unexpected,
    insertRoleAssignment: unexpected,
    findFarmerAdminForUpdate: unexpected,
    findZones: unexpected,
    endZoneAssignments: unexpected,
  };
  return { repo, calls };
}

interface RecordedQuery {
  sql: string;
  params: unknown[];
}

function serviceWith(repo: AdminAccountsRepo, calls: Calls, log: RecordedQuery[] = []) {
  const tx = {
    async query(sql: string, params: unknown[] = []) {
      log.push({ sql, params });
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  } as Executor;
  return createAdminAccountsService({
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
describe('admin account disable: self and hierarchy (BR-110a, BR-110b)', () => {
  it('BR-110a: an admin disabling their own account is 403 FORBIDDEN and nothing is read, written or audited', async () => {
    for (const code of [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN]) {
      const scope = scopeFor(code);
      const target = anAccount([code], { id: scope.userId });
      const { repo, calls } = fakeRepo(target);
      const log: RecordedQuery[] = [];
      const error = await caught(serviceWith(repo, calls, log).disable(scope, scope.userId, {}));
      expect(error.code).toBe('FORBIDDEN');
      expect(error.status).toBe(403);
      expect(calls.disabled).toEqual([]);
      expect(calls.invalidated).toEqual([]);
      expect(auditInserts(log)).toEqual([]);
    }
  });

  it.each([
    [RoleCode.TOHFA_ADMIN, ['SUPER_ADMIN']],
    [RoleCode.TOHFA_ADMIN, ['TOHFA_ADMIN']],
    [RoleCode.TOHFA_ADMIN, ['SUB_WH_ADMIN', 'TOHFA_ADMIN']],
    [RoleCode.FARMER_ADMIN, ['FARMER_ADMIN']],
    [RoleCode.FARMER_ADMIN, ['MAIN_WH_ADMIN']],
    [RoleCode.FARMER_ADMIN, ['TOHFA_ADMIN']],
  ])('BR-110b: LOWER_ROLES_ONLY: %s disabling an equal-or-higher account %j is 403 and nothing is written', async (actor, targetRoles) => {
    const { repo, calls } = fakeRepo(anAccount(targetRoles));
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).disable(scopeFor(actor), newId(), {}));
    expect(error.code).toBe('FORBIDDEN');
    expect(error.status).toBe(403);
    expect(calls.disabled).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });

  it.each([
    [RoleCode.TOHFA_ADMIN, ['FARMER_ADMIN']],
    [RoleCode.TOHFA_ADMIN, ['MAIN_WH_ADMIN']],
    [RoleCode.TOHFA_ADMIN, ['SUB_WH_ADMIN']],
    [RoleCode.FARMER_ADMIN, ['SUB_WH_ADMIN']],
    [RoleCode.SUPER_ADMIN, ['SUPER_ADMIN']],
    [RoleCode.SUPER_ADMIN, ['TOHFA_ADMIN']],
  ])('BR-110b: %s may disable a %j account (strictly lower, or SUPER_ADMIN with `all`)', async (actor, targetRoles) => {
    const target = anAccount(targetRoles);
    const { repo, calls } = fakeRepo(target);
    const result = await serviceWith(repo, calls).disable(scopeFor(actor), target.account.id, {});
    expect(result.status).toBe('DISABLED');
    expect(calls.disabled).toHaveLength(1);
  });

  it('BR-110b: the predicate is surfaced by the middleware from docs/rbac.json, not decided by role name', () => {
    expect(scopeFor(RoleCode.SUPER_ADMIN)).toMatchObject({ level: ScopeLevel.ALL });
    expect(scopeFor(RoleCode.TOHFA_ADMIN)).toMatchObject({ level: ScopeLevel.CONDITIONAL, predicate: 'LOWER_ROLES_ONLY' });
    expect(scopeFor(RoleCode.FARMER_ADMIN)).toMatchObject({ level: ScopeLevel.CONDITIONAL, predicate: 'LOWER_ROLES_ONLY' });
    for (const code of [RoleCode.MAIN_WH_ADMIN, RoleCode.SUB_WH_ADMIN, RoleCode.FARMER, RoleCode.CUSTOMER]) {
      expect(resolveScope(anActor({ roles: [aRole(code, { warehouseId: W1 })] }), PERMISSION)).toBeNull();
    }
  });
});

describe('admin account disable: last Super Admin, idempotency, 404 (BR-110c, BR-110d, BR-110f)', () => {
  it('BR-110c: disabling the last ACTIVE SUPER_ADMIN is 409 CONFLICT and nothing is written', async () => {
    const { repo, calls } = fakeRepo(anAccount(['SUPER_ADMIN']), 0);
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).disable(scopeFor(RoleCode.SUPER_ADMIN), newId(), {}));
    expect(error.code).toBe('CONFLICT');
    expect(error.status).toBe(409);
    expect(calls.disabled).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-110c: the Super Admin count is only consulted when the target is a SUPER_ADMIN', async () => {
    const { repo, calls } = fakeRepo(anAccount(['TOHFA_ADMIN']), 0);
    await serviceWith(repo, calls).disable(scopeFor(RoleCode.SUPER_ADMIN), newId(), {});
    expect(calls.events).not.toContain('countSupers');
  });

  it('BR-110d: an already DISABLED account is a 200 no-op: state unchanged, no write, no revocation, no audit row, no invalidation', async () => {
    const disabledAt = new Date('2026-01-01T00:00:00Z');
    const by = newId();
    const target = anAccount(['SUB_WH_ADMIN'], { status: 'DISABLED', disabledAt, disabledBy: by, disabledReason: 'first' });
    const { repo, calls } = fakeRepo(target);
    const log: RecordedQuery[] = [];
    const result = await serviceWith(repo, calls, log).disable(scopeFor(RoleCode.TOHFA_ADMIN), target.account.id, { reason: 'again' });
    expect(result).toEqual({
      id: target.account.id,
      fullName: 'Target Admin',
      status: 'DISABLED',
      roles: ['SUB_WH_ADMIN'],
      disabledAt: disabledAt.toISOString(),
      disabledBy: by,
      disabledReason: 'first',
    });
    expect(calls.events).toEqual(['load', 'commit']);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-110d: an already DISABLED account the actor may not act on is still 403, not a silent 200', async () => {
    const { repo, calls } = fakeRepo(anAccount(['SUPER_ADMIN'], { status: 'DISABLED' }));
    expect((await caught(serviceWith(repo, calls).disable(scopeFor(RoleCode.TOHFA_ADMIN), newId(), {}))).status).toBe(403);
  });

  it('BR-110f: a missing user, a non-admin user or an admin without a live role is 404 NOT_FOUND', async () => {
    const { repo, calls } = fakeRepo(null);
    const error = await caught(serviceWith(repo, calls).disable(scopeFor(RoleCode.SUPER_ADMIN), newId(), {}));
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
    expect(calls.disabled).toEqual([]);
  });
});

describe('admin account disable: the real disable (BR-110e, BR-35)', () => {
  it('BR-110e: disables with the reason, revokes sessions and refresh tokens, writes one audit row, then invalidates access tokens after commit', async () => {
    const target = anAccount(['SUB_WH_ADMIN']);
    const { repo, calls } = fakeRepo(target);
    const log: RecordedQuery[] = [];
    const actor = scopeFor(RoleCode.TOHFA_ADMIN, IDS.userTohfaAdmin);
    const result = await serviceWith(repo, calls, log).disable(actor, target.account.id, { reason: 'Left the company' });

    expect(adminAccountStatus.parse(result)).toEqual(result);
    expect(result).toMatchObject({ status: 'DISABLED', disabledBy: IDS.userTohfaAdmin, disabledReason: 'Left the company', roles: ['SUB_WH_ADMIN'] });
    expect(calls.disabled).toEqual([{ id: target.account.id, by: IDS.userTohfaAdmin, reason: 'Left the company' }]);
    expect(calls.events).toEqual(['load', 'disable', 'revokeSessions', 'revokeRefreshTokens', 'commit', 'invalidate']);
    expect(calls.invalidated).toEqual([target.account.id]);

    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    const params = inserts[0]!.params;
    expect(params[0]).toBe(IDS.userTohfaAdmin);
    expect(params[2]).toBe(RoleCode.TOHFA_ADMIN);
    expect(params[3]).toBe('admin.account.disable');
    expect(params[4]).toBe('user');
    expect(params[5]).toBe(target.account.id);
    expect(JSON.parse(params[8] as string)).toMatchObject({ status: 'ACTIVE', disabledReason: null, roles: ['SUB_WH_ADMIN'] });
    expect(JSON.parse(params[9] as string)).toMatchObject({ status: 'DISABLED', disabledReason: 'Left the company', disabledBy: IDS.userTohfaAdmin });
    expect(params[10]).toEqual(expect.arrayContaining(['status', 'disabledAt', 'disabledBy', 'disabledReason']));
  });

  it('BR-110e: when the transaction fails, access tokens are not invalidated', async () => {
    const target = anAccount(['SUB_WH_ADMIN']);
    const { repo, calls } = fakeRepo(target);
    repo.revokeRefreshTokens = async () => {
      throw new Error('boom');
    };
    await expect(serviceWith(repo, calls).disable(scopeFor(RoleCode.SUPER_ADMIN), target.account.id, {})).rejects.toThrow('boom');
    expect(calls.invalidated).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Request schema
// ---------------------------------------------------------------------------
describe('admin account disable: request schema (BR-110)', () => {
  it('BR-110: the body is optional; reason is trimmed text up to 500 characters; unknown keys are refused', () => {
    expect(disableAdminAccountBody.parse(undefined)).toEqual({});
    expect(disableAdminAccountBody.parse({})).toEqual({});
    expect(disableAdminAccountBody.parse({ reason: '  left  ' })).toEqual({ reason: 'left' });
    expect(disableAdminAccountBody.safeParse({ reason: '' }).success).toBe(false);
    expect(disableAdminAccountBody.safeParse({ reason: 'x'.repeat(501) }).success).toBe(false);
    expect(disableAdminAccountBody.safeParse({ status: 'DISABLED' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Router
// ---------------------------------------------------------------------------
describe('admin accounts router (BR-110f)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-110f: the router registers exactly create (BR-112), disable (BR-110) and the Farmer Admin zones (BR-113); no reactivation route', () => {
    const routes = adminAccountsRouter.stack
      .filter((layer) => layer.route !== undefined)
      .flatMap((layer) => {
        const route = layer.route as unknown as { path: string; methods: Record<string, boolean> };
        return Object.keys(route.methods).map((m) => `${m} ${route.path}`);
      });
    expect(new Set(routes)).toEqual(new Set(['post /', 'post /:id/disable', 'put /:id/zones']));
  });

  it('BR-110f: 401 without a token; 403 for MAIN_WH_ADMIN, SUB_WH_ADMIN, FARMER and CUSTOMER (admin.account.disable = none)', async () => {
    const id = newId();
    expect((await request(server).post(`/v1/admin/accounts/${id}/disable`)).status).toBe(401);
    for (const auth of [
      token([{ code: RoleCode.MAIN_WH_ADMIN }]),
      token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }]),
      token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
      token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
    ]) {
      const res = await request(server).post(`/v1/admin/accounts/${id}/disable`).set('Authorization', auth).send({});
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('BR-110f: a malformed id or body is 422 before any SQL', async () => {
    const auth = token([{ code: RoleCode.SUPER_ADMIN }]);
    expect((await request(server).post('/v1/admin/accounts/not-a-uuid/disable').set('Authorization', auth)).status).toBe(422);
    expect((await request(server).post(`/v1/admin/accounts/${newId()}/disable`).set('Authorization', auth).send({ extra: 1 })).status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// 4. PostgreSQL
// ---------------------------------------------------------------------------
describeIfDatabase('admin account disable (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;
  let warehouseId = '';

  beforeAll(async () => {
    expect(await databaseReady('refresh_tokens'), 'the database is reachable and migrated').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
    const wh = await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE deleted_at IS NULL ORDER BY code LIMIT 1`);
    warehouseId = wh.rows[0]!.id;
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

  const rand = (): number => Math.floor(10_000_000 + Math.random() * 89_999_999);

  async function anAdmin(
    tx: pg.PoolClient,
    role: string,
    opts: { status?: string; userType?: string; roleEnded?: boolean } = {},
  ): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, $4, $5)`, [
      id,
      `+9193${rand()}`,
      `Admin ${role}`,
      opts.userType ?? 'ADMIN',
      opts.status ?? 'ACTIVE',
    ]);
    await tx.query(
      `INSERT INTO user_roles (user_id, role_id, warehouse_id, valid_from, valid_to)
       SELECT $1, r.id, $3, now() - interval '2 days', $4 FROM roles r WHERE r.code = $2`,
      [id, role, role === 'SUB_WH_ADMIN' ? warehouseId : null, opts.roleEnded === true ? new Date(Date.now() - 86_400_000) : null],
    );
    return id;
  }

  async function aSession(tx: pg.PoolClient, userId: string): Promise<void> {
    const session = (
      await tx.query<{ id: string }>(`INSERT INTO sessions (user_id, expires_at) VALUES ($1, now() + interval '1 day') RETURNING id`, [userId])
    ).rows[0]!.id;
    await tx.query(`INSERT INTO refresh_tokens (session_id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, now() + interval '1 day')`, [
      session,
      userId,
      `hash-${newId()}`,
    ]);
  }

  const service = (tx: pg.PoolClient, invalidated: string[] = []) =>
    createAdminAccountsService({
      repo: adminAccountsRepo,
      transaction: async (fn) => fn(tx),
      invalidateAccessTokens: async (userId) => {
        invalidated.push(userId);
      },
    });

  const scopeAs = (code: RoleCode, userId: string): ResolvedScope => ({ ...scopeFor(code), userId });

  it('BR-110e (PostgreSQL): a TOHFA_ADMIN disables a Sub admin: status, live sessions and refresh tokens revoked, one audit row; a replay is a no-op', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'TOHFA_ADMIN');
      const target = await anAdmin(tx, 'SUB_WH_ADMIN');
      await aSession(tx, target);
      await aSession(tx, target);
      const invalidated: string[] = [];

      const result = await service(tx, invalidated).disable(scopeAs(RoleCode.TOHFA_ADMIN, actor), target, { reason: 'Contract ended' });
      expect(result).toMatchObject({ id: target, status: 'DISABLED', disabledBy: actor, disabledReason: 'Contract ended', roles: ['SUB_WH_ADMIN'] });
      expect(invalidated).toEqual([target]);

      const user = (await tx.query(`SELECT status, disabled_by, disabled_reason FROM users WHERE id = $1`, [target])).rows[0];
      expect(user).toEqual({ status: 'DISABLED', disabled_by: actor, disabled_reason: 'Contract ended' });
      const live = await tx.query<{ s: number; r: number }>(
        `SELECT (SELECT count(*)::int FROM sessions WHERE user_id = $1 AND revoked_at IS NULL) AS s,
                (SELECT count(*)::int FROM refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL) AS r`,
        [target],
      );
      expect(live.rows[0]).toEqual({ s: 0, r: 0 });
      const reasons = await tx.query<{ revoke_reason: string; revoked_by: string }>(`SELECT DISTINCT revoke_reason, revoked_by FROM sessions WHERE user_id = $1`, [target]);
      expect(reasons.rows).toEqual([{ revoke_reason: 'ACCOUNT_DISABLED', revoked_by: actor }]);

      const again = await service(tx, invalidated).disable(scopeAs(RoleCode.SUPER_ADMIN, actor), target, { reason: 'Second' });
      expect(again).toEqual(result);
      expect(invalidated).toEqual([target]);
      const audit = await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM audit_log WHERE action_code = 'admin.account.disable' AND entity_id = $1`, [target]);
      expect(audit.rows[0]!.n).toBe(1);
    });
  });

  it('BR-110b (PostgreSQL): the target level is its highest-authority live role; an ended assignment does not count', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'TOHFA_ADMIN');
      const target = await anAdmin(tx, 'SUB_WH_ADMIN');
      await tx.query(
        `INSERT INTO user_roles (user_id, role_id, valid_from) SELECT $1, id, now() - interval '2 days' FROM roles WHERE code = 'TOHFA_ADMIN'`,
        [target],
      );
      expect((await caught(service(tx).disable(scopeAs(RoleCode.TOHFA_ADMIN, actor), target, {}))).status).toBe(403);
      await tx.query(`UPDATE user_roles SET valid_to = now() - interval '1 second' WHERE user_id = $1 AND role_code = 'TOHFA_ADMIN'`, [target]);
      expect((await service(tx).disable(scopeAs(RoleCode.TOHFA_ADMIN, actor), target, {})).status).toBe('DISABLED');
    });
  });

  it('BR-110f (PostgreSQL): a farmer user, an admin with only an ended role, and an unknown id are 404', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      const farmerUser = await anAdmin(tx, 'FARMER', { userType: 'FARMER' });
      const ended = await anAdmin(tx, 'SUB_WH_ADMIN', { roleEnded: true });
      for (const id of [farmerUser, ended, newId()]) {
        expect((await caught(service(tx).disable(scopeAs(RoleCode.SUPER_ADMIN, actor), id, {}))).status, id).toBe(404);
      }
    });
  });

  it('BR-110c (PostgreSQL): the last ACTIVE SUPER_ADMIN cannot be disabled; with another active one it can', async () => {
    await inRollback(async (tx) => {
      // The actor's own account is no longer active (a still-valid token): it does not count.
      const actor = await anAdmin(tx, 'SUPER_ADMIN', { status: 'DISABLED' });
      const target = await anAdmin(tx, 'SUPER_ADMIN');
      await tx.query(
        `UPDATE users SET status = 'DISABLED'
          WHERE id <> $1 AND id IN (SELECT user_id FROM user_roles WHERE role_code = 'SUPER_ADMIN')`,
        [target],
      );
      const error = await caught(service(tx).disable(scopeAs(RoleCode.SUPER_ADMIN, actor), target, {}));
      expect(error.code).toBe('CONFLICT');
      expect((await tx.query(`SELECT status FROM users WHERE id = $1`, [target])).rows[0]).toEqual({ status: 'ACTIVE' });

      await anAdmin(tx, 'SUPER_ADMIN');
      expect((await service(tx).disable(scopeAs(RoleCode.SUPER_ADMIN, actor), target, {})).status).toBe('DISABLED');
    });
  });

  it('BR-110a (PostgreSQL): self-disable is 403 and the account stays ACTIVE', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      expect((await caught(service(tx).disable(scopeAs(RoleCode.SUPER_ADMIN, actor), actor, {}))).status).toBe(403);
      expect((await tx.query(`SELECT status FROM users WHERE id = $1`, [actor])).rows[0]).toEqual({ status: 'ACTIVE' });
    });
  });
});

