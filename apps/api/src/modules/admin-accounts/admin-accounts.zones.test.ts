/**
 * Farmer Admin zones: PUT /admin/accounts/{id}/zones (BR-113), with BR-35 (audit row in the same
 * transaction).
 *
 * Layers:
 *  1. service against a fake repo: 404, zone validation, replace semantics, idempotency, audit, the
 *     token invalidation after commit
 *  2. request schema
 *  3. the router: permission wiring (refused before any SQL)
 *  4. PostgreSQL: the real repo and SQL (and migration 0073) inside a transaction that is always
 *     rolled back
 */
import type { Server } from 'node:http';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { resolveScope, type ResolvedScope } from '../../rbac/requirePermission.js';
import { randomMobile } from '../../test/dbFixtures.js';
import { aRole, anActor, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { adminAccountsRepo, type AdminAccountsRepo } from './admin-accounts.repo.js';
import { farmerAdminZones, setFarmerAdminZonesBody } from './admin-accounts.schema.js';
import { createAdminAccountsService } from './admin-accounts.service.js';

const PERMISSION = 'admin.farmer_admin.assign_zones';
const Z1 = '20000000-0000-4000-8000-0000000000a1';
const Z2 = '20000000-0000-4000-8000-0000000000a2';
const Z3 = '20000000-0000-4000-8000-0000000000a3';
const W1 = IDS.warehouseOoty;

function scopeFor(code: RoleCode, userId: string = newId()): ResolvedScope {
  const scope = resolveScope(anActor({ userId, roles: [aRole(code)] }), PERMISSION);
  if (scope === null) throw new Error(`${code} holds none`);
  return scope;
}

interface Calls {
  events: string[];
  ended: string[][];
  added: string[];
  invalidated: string[];
}

function fakeRepo(current: Array<string | null> | null, zones: Array<{ id: string; isActive: boolean }> = [Z1, Z2, Z3].map((id) => ({ id, isActive: true }))) {
  const calls: Calls = { events: [], ended: [], added: [], invalidated: [] };
  const unexpected = async (): Promise<never> => {
    throw new Error('unexpected repo method for zones');
  };
  const repo: AdminAccountsRepo = {
    findAdminForUpdate: unexpected,
    countOtherActiveSuperAdmins: unexpected,
    markDisabled: unexpected,
    revokeSessions: unexpected,
    revokeRefreshTokens: unexpected,
    findZone: unexpected,
    insertAdminUser: unexpected,
    insertAdminProfile: unexpected,
    async insertRoleAssignment(_db, input) {
      calls.events.push('add');
      expect(input.roleCode).toBe('FARMER_ADMIN');
      calls.added.push(input.zoneId!);
      return new Date();
    },
    async findFarmerAdminForUpdate() {
      calls.events.push('load');
      return current === null ? null : { zoneIds: current };
    },
    async findZones(_db, ids) {
      calls.events.push('findZones');
      return zones.filter((zone) => ids.includes(zone.id));
    },
    async endZoneAssignments(_db, _userId, keep) {
      calls.events.push('end');
      calls.ended.push(keep);
      return 1;
    },
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
describe('farmer admin zones: target and zone validation (BR-113b)', () => {
  it('BR-113b: a user that is not a live Farmer Admin is 404 and nothing is written', async () => {
    const { repo, calls } = fakeRepo(null);
    const log: RecordedQuery[] = [];
    const error = await caught(serviceWith(repo, calls, log).setZones(scopeFor(RoleCode.SUPER_ADMIN), newId(), { zoneIds: [Z1] }));
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(calls.events).toEqual(['load']);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-113b: an unknown or inactive zone is 422 on body.zoneIds and nothing is written', async () => {
    for (const zones of [[{ id: Z1, isActive: true }], [{ id: Z1, isActive: true }, { id: Z2, isActive: false }]]) {
      const { repo, calls } = fakeRepo([Z1], zones);
      const log: RecordedQuery[] = [];
      const error = await caught(serviceWith(repo, calls, log).setZones(scopeFor(RoleCode.TOHFA_ADMIN), newId(), { zoneIds: [Z1, Z2] }));
      expect(error.status).toBe(422);
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.errors).toHaveProperty(['body.zoneIds']);
      expect(calls.events).not.toContain('end');
      expect(calls.events).not.toContain('add');
      expect(auditInserts(log)).toEqual([]);
    }
  });
});

describe('farmer admin zones: replace and idempotency (BR-113c, BR-113d, BR-35)', () => {
  it('BR-113c: replace semantics: zones not listed are ended, new zones added, kept zones untouched; one audit row; tokens invalidated after commit', async () => {
    const { repo, calls } = fakeRepo([Z1, Z2]);
    const log: RecordedQuery[] = [];
    const actor = scopeFor(RoleCode.TOHFA_ADMIN, IDS.userTohfaAdmin);
    const target = newId();
    const result = await serviceWith(repo, calls, log).setZones(actor, target, { zoneIds: [Z3, Z2] });

    expect(farmerAdminZones.parse(result)).toEqual(result);
    expect(result).toEqual({ userId: target, zoneIds: [Z2, Z3].sort() });
    expect(calls.ended).toEqual([[Z2, Z3].sort()]);
    expect(calls.added).toEqual([Z3]);
    expect(calls.events).toEqual(['load', 'findZones', 'end', 'add', 'commit', 'invalidate']);
    expect(calls.invalidated).toEqual([target]);

    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    const params = inserts[0]!.params;
    expect(params[0]).toBe(IDS.userTohfaAdmin);
    expect(params[2]).toBe(RoleCode.TOHFA_ADMIN);
    expect(params[3]).toBe(PERMISSION);
    expect(params[4]).toBe('user');
    expect(params[5]).toBe(target);
    expect(JSON.parse(params[8] as string)).toEqual({ zoneIds: [Z1, Z2].sort() });
    expect(JSON.parse(params[9] as string)).toEqual({ zoneIds: [Z2, Z3].sort() });
    expect(params[10]).toEqual(['zoneIds']);
  });

  it('BR-113c: a live Farmer Admin assignment with no zone is ended by any replace', async () => {
    const { repo, calls } = fakeRepo([null]);
    const result = await serviceWith(repo, calls).setZones(scopeFor(RoleCode.SUPER_ADMIN), newId(), { zoneIds: [Z1] });
    expect(result.zoneIds).toEqual([Z1]);
    expect(calls.ended).toEqual([[Z1]]);
    expect(calls.added).toEqual([Z1]);
  });

  it('BR-113d: a list equal (as a set) to the current zones is a 200 no-op: no write, no audit row, no invalidation', async () => {
    const { repo, calls } = fakeRepo([Z2, Z1]);
    const log: RecordedQuery[] = [];
    const target = newId();
    const result = await serviceWith(repo, calls, log).setZones(scopeFor(RoleCode.SUPER_ADMIN), target, { zoneIds: [Z1, Z2] });
    expect(result).toEqual({ userId: target, zoneIds: [Z1, Z2].sort() });
    expect(calls.events).toEqual(['load', 'findZones', 'commit']);
    expect(auditInserts(log)).toEqual([]);
    expect(calls.invalidated).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Request schema
// ---------------------------------------------------------------------------
describe('farmer admin zones: request schema (BR-113b)', () => {
  it('BR-113b: zoneIds is a non-empty list of distinct UUIDs; unknown keys are refused', () => {
    expect(setFarmerAdminZonesBody.parse({ zoneIds: [Z1, Z2] })).toEqual({ zoneIds: [Z1, Z2] });
    for (const bad of [{}, { zoneIds: [] }, { zoneIds: [Z1, Z1] }, { zoneIds: ['x'] }, { zoneIds: [Z1], extra: 1 }, { zoneIds: Z1 }]) {
      expect(setFarmerAdminZonesBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Router
// ---------------------------------------------------------------------------
describe('farmer admin zones router (BR-113a)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-113a: 401 without a token; 403 for FARMER_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN, FARMER and CUSTOMER', async () => {
    const path = `/v1/admin/accounts/${newId()}/zones`;
    expect((await request(server).put(path).send({ zoneIds: [Z1] })).status).toBe(401);
    for (const auth of [
      token([{ code: RoleCode.FARMER_ADMIN, zoneId: Z1 }]),
      token([{ code: RoleCode.MAIN_WH_ADMIN }]),
      token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }]),
      token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
      token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
    ]) {
      const res = await request(server).put(path).set('Authorization', auth).send({ zoneIds: [Z1] });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('BR-113a: a malformed id or body is 422 before any SQL', async () => {
    const auth = token([{ code: RoleCode.TOHFA_ADMIN }]);
    expect((await request(server).put('/v1/admin/accounts/not-a-uuid/zones').set('Authorization', auth).send({ zoneIds: [Z1] })).status).toBe(422);
    expect((await request(server).put(`/v1/admin/accounts/${newId()}/zones`).set('Authorization', auth).send({ zoneIds: [] })).status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// 4. PostgreSQL
// ---------------------------------------------------------------------------
describeIfDatabase('farmer admin zones (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    expect(await databaseReady('user_roles'), 'the database is reachable and migrated').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
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

  async function aZone(tx: pg.PoolClient): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO zones (id, code, name) VALUES ($1, $2, 'Fixture Zone')`, [id, `Z-${id.slice(0, 8)}`]);
    return id;
  }

  async function aFarmerAdmin(tx: pg.PoolClient, zoneId: string): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'FA', 'ADMIN', 'ACTIVE')`, [id, randomMobile()]);
    await tx.query(
      `INSERT INTO user_roles (user_id, role_id, zone_id, valid_from) SELECT $1, r.id, $2, now() - interval '1 day' FROM roles r WHERE r.code = 'FARMER_ADMIN'`,
      [id, zoneId],
    );
    return id;
  }

  const liveZones = async (tx: pg.PoolClient, userId: string): Promise<string[]> =>
    (
      await tx.query<{ zone_id: string }>(
        `SELECT zone_id FROM user_roles WHERE user_id = $1 AND role_code = 'FARMER_ADMIN' AND (valid_to IS NULL OR valid_to > now()) ORDER BY zone_id`,
        [userId],
      )
    ).rows.map((row) => row.zone_id);

  const service = (tx: pg.PoolClient, invalidated: string[] = []) =>
    createAdminAccountsService({
      repo: adminAccountsRepo,
      transaction: async (fn) => fn(tx),
      invalidateAccessTokens: async (userId) => {
        invalidated.push(userId);
      },
    });

  it('BR-113c (PostgreSQL): one Farmer Admin holds several zones as separate live rows (migration 0073); a replace ends one and adds one; a replay is a no-op', async () => {
    await inRollback(async (tx) => {
      const [za, zb, zc] = [await aZone(tx), await aZone(tx), await aZone(tx)];
      const target = await aFarmerAdmin(tx, za);
      const actorId = newId();
      await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'SA', 'ADMIN', 'ACTIVE')`, [actorId, randomMobile()]);
      const actor = scopeFor(RoleCode.SUPER_ADMIN, actorId);
      const invalidated: string[] = [];

      const added = await service(tx, invalidated).setZones(actor, target, { zoneIds: [za, zb] });
      expect(added.zoneIds).toEqual([za, zb].sort());
      expect(await liveZones(tx, target)).toEqual([za, zb].sort());

      const replaced = await service(tx, invalidated).setZones(actor, target, { zoneIds: [zb, zc] });
      expect(replaced.zoneIds).toEqual([zb, zc].sort());
      expect(await liveZones(tx, target)).toEqual([zb, zc].sort());
      const ended = await tx.query(`SELECT count(*)::int AS n FROM user_roles WHERE user_id = $1 AND zone_id = $2 AND valid_to IS NOT NULL`, [target, za]);
      expect(ended.rows[0]).toEqual({ n: 1 });

      const again = await service(tx, invalidated).setZones(actor, target, { zoneIds: [zc, zb] });
      expect(again).toEqual(replaced);
      expect(invalidated).toEqual([target, target]);

      const audit = await tx.query<{ before: unknown; after: unknown }>(
        `SELECT before, after FROM audit_log WHERE action_code = $1 AND entity_id = $2 ORDER BY created_at, id`,
        [PERMISSION, target],
      );
      expect(audit.rows).toHaveLength(2);
    });
  });

  it('BR-113b (PostgreSQL): a non-Farmer-Admin user is 404; an unknown zone is 422 and the zones are unchanged', async () => {
    await inRollback(async (tx) => {
      const za = await aZone(tx);
      const target = await aFarmerAdmin(tx, za);
      const actor = scopeFor(RoleCode.TOHFA_ADMIN);
      expect((await caught(service(tx).setZones(actor, IDS.userSuperAdmin, { zoneIds: [za] }))).status).toBe(404);
      expect((await caught(service(tx).setZones(actor, target, { zoneIds: [za, newId()] }))).status).toBe(422);
      expect(await liveZones(tx, target)).toEqual([za]);
    });
  });
});
