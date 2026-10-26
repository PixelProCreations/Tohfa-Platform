/**
 * Admin account creation: POST /admin/accounts (BR-28, BR-112), with BR-35 (audit row in the same
 * transaction) and BR-35b (a denied attempt is recorded).
 *
 * Layers:
 *  1. service against a fake repo: the BR-28 table, the DENIED audit row, the SUB_WH_ADMIN refusal,
 *     the Farmer Admin zone rule, the masked audit image
 *  2. request schema
 *  3. the router: the any-of gate (refused before any SQL)
 *  4. PostgreSQL: the real repo and SQL inside a transaction that is always rolled back
 */
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { RBAC_JSON_PATH } from '../../paths.js';
import { resolveScope, type ResolvedScope } from '../../rbac/requirePermission.js';
import { randomMobile } from '../../test/dbFixtures.js';
import { aRole, anActor, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { adminAccountsRepo, type AdminAccountsRepo } from './admin-accounts.repo.js';
import { adminAccountCreated, createAdminAccountBody, CREATE_PERMISSION_BY_ROLE } from './admin-accounts.schema.js';
import { createAdminAccountsService } from './admin-accounts.service.js';

const ZONE = IDS.zoneNorth;
const NEW_USER = '50000000-0000-4000-8000-000000000001';
const W1 = IDS.warehouseOoty;
const ADMIN_ACTORS = [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.FARMER_ADMIN, RoleCode.MAIN_WH_ADMIN, RoleCode.SUB_WH_ADMIN];
const CREATABLE = ['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN'] as const;

function readCreationRules(): Array<{ canCreate: string; allowedCreators: string[] }> {
  const parsed = JSON.parse(readFileSync(RBAC_JSON_PATH, 'utf8')) as { creationRules: Array<{ canCreate: string; allowedCreators: string[] }> };
  return parsed.creationRules;
}

const actorFor = (code: RoleCode, userId: string = newId()) =>
  anActor({ userId, roles: [aRole(code, code === RoleCode.FARMER_ADMIN ? { zoneId: ZONE } : code === RoleCode.SUB_WH_ADMIN ? { warehouseId: W1 } : {})] });

/** The scope the route resolves for the requested role's create code (null = the actor lacks it). */
function createScopeFor(code: RoleCode, role: string, userId?: string): ResolvedScope | null {
  return resolveScope(actorFor(code, userId), CREATE_PERMISSION_BY_ROLE[role as keyof typeof CREATE_PERMISSION_BY_ROLE]);
}

/** The scope the any-of gate attached (any create code the actor holds). */
function gateScopeFor(code: RoleCode, userId?: string): ResolvedScope {
  const actor = actorFor(code, userId);
  for (const permission of Object.values(CREATE_PERMISSION_BY_ROLE)) {
    const scope = resolveScope(actor, permission);
    if (scope !== null) return scope;
  }
  // FARMER_ADMIN / SUB_WH_ADMIN never pass the gate; a synthetic scope lets the service be probed.
  return { level: ScopeLevel.ALL, permission: 'admin.sub_wh_admin.create', roleCode: code, warehouseIds: [], zoneIds: [], userId: actor.userId };
}

interface RecordedQuery {
  sql: string;
  params: unknown[];
}

interface CreateCalls {
  events: string[];
  assignments: Array<{ roleCode: string; zoneId: string | null }>;
  commits: number;
}

function fakeRepo(opts: { zone?: { isActive: boolean } | null; mobileTaken?: boolean } = {}): { repo: AdminAccountsRepo; calls: CreateCalls } {
  const calls: CreateCalls = { events: [], assignments: [], commits: 0 };
  const unexpected = async (): Promise<never> => {
    throw new Error('disable-path repo method called by create');
  };
  const repo: AdminAccountsRepo = {
    findAdminForUpdate: unexpected,
    countOtherActiveSuperAdmins: unexpected,
    markDisabled: unexpected,
    revokeSessions: unexpected,
    revokeRefreshTokens: unexpected,
    async findZone() {
      calls.events.push('findZone');
      return opts.zone === undefined ? { isActive: true } : opts.zone;
    },
    async insertAdminUser() {
      calls.events.push('insertUser');
      if (opts.mobileTaken === true) throw Object.assign(new Error('dup'), { code: '23505', constraint: 'uq_users_mobile_live' });
      return NEW_USER;
    },
    async insertAdminProfile() {
      calls.events.push('insertProfile');
      return 'ADM-007';
    },
    async insertRoleAssignment(_db, input) {
      calls.events.push('insertAssignment');
      calls.assignments.push({ roleCode: input.roleCode, zoneId: input.zoneId });
      return new Date('2026-10-23T10:00:00Z');
    },
    findFarmerAdminForUpdate: unexpected,
    findZones: unexpected,
    endZoneAssignments: unexpected,
  };
  return { repo, calls };
}

function serviceWith(repo: AdminAccountsRepo, calls: CreateCalls, log: RecordedQuery[] = []) {
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
      calls.commits += 1;
      return result;
    },
    invalidateAccessTokens: async () => undefined,
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

const body = (role: string, extra: Record<string, unknown> = {}) =>
  createAdminAccountBody.parse({ role, fullName: 'New Admin', mobile: '+919876500011', ...(role === 'FARMER_ADMIN' ? { zoneId: ZONE } : {}), ...extra });

// ---------------------------------------------------------------------------
// 1. Service
// ---------------------------------------------------------------------------
describe('admin account create: the BR-28 hierarchy (BR-28a, BR-28b)', () => {
  it('BR-28a: over the 4 roles this endpoint creates x 5 admin actors, exactly the creationRules pairs succeed and every other pair is 403 with nothing created', async () => {
    const rules = readCreationRules();
    let allowed = 0;
    let denied = 0;
    for (const role of CREATABLE) {
      const allowedCreators = rules.find((rule) => rule.canCreate === role)!.allowedCreators;
      for (const actor of ADMIN_ACTORS) {
        const { repo, calls } = fakeRepo();
        const log: RecordedQuery[] = [];
        const promise = serviceWith(repo, calls, log).create(gateScopeFor(actor), createScopeFor(actor, role), body(role));
        if (allowedCreators.includes(actor)) {
          const created = await promise;
          expect(created.role, `${actor} -> ${role}`).toBe(role);
          expect(calls.events, `${actor} -> ${role}`).toContain('insertUser');
          allowed += 1;
        } else {
          const error = await caught(promise);
          expect(error.status, `${actor} -> ${role}`).toBe(403);
          expect(error.code).toBe('FORBIDDEN');
          expect(calls.events, `${actor} -> ${role}`).not.toContain('insertUser');
          denied += 1;
        }
      }
    }
    // 4 targets: SUPER (SA), TOHFA (SA), FARMER_ADMIN (SA, TA), MAIN (SA) = 5 allowed, 15 denied.
    expect({ allowed, denied }).toEqual({ allowed: 5, denied: 15 });
  });

  it('BR-28b: MAIN_WH_ADMIN creating a SUPER_ADMIN is 403 and ONE DENIED audit row records the attempt; nothing else is written', async () => {
    const { repo, calls } = fakeRepo();
    const log: RecordedQuery[] = [];
    const actorId = newId();
    const error = await caught(serviceWith(repo, calls, log).create(gateScopeFor(RoleCode.MAIN_WH_ADMIN, actorId), createScopeFor(RoleCode.MAIN_WH_ADMIN, 'SUPER_ADMIN', actorId), body('SUPER_ADMIN')));
    expect(error.status).toBe(403);
    expect(calls.events).toEqual([]);
    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    const params = inserts[0]!.params;
    expect(params[0]).toBe(actorId);
    expect(params[2]).toBe(RoleCode.MAIN_WH_ADMIN);
    expect(params[3]).toBe('admin.super_admin.create');
    expect(params[4]).toBe('user');
    expect(params[5]).toBeNull();
    expect(params[7]).toBe('DENIED');
    expect(JSON.parse(params[9] as string)).toEqual({ requestedRole: 'SUPER_ADMIN' });
    expect(JSON.stringify(params)).not.toContain('+919876500011');
    expect(calls.commits).toBe(1);
  });

  it('BR-28b: TOHFA_ADMIN creating a TOHFA_ADMIN or a MAIN_WH_ADMIN is 403 with a DENIED audit row', async () => {
    for (const role of ['TOHFA_ADMIN', 'MAIN_WH_ADMIN']) {
      const { repo, calls } = fakeRepo();
      const log: RecordedQuery[] = [];
      expect((await caught(serviceWith(repo, calls, log).create(gateScopeFor(RoleCode.TOHFA_ADMIN), createScopeFor(RoleCode.TOHFA_ADMIN, role), body(role)))).status).toBe(403);
      expect(auditInserts(log).map((q) => q.params[7])).toEqual(['DENIED']);
    }
  });
});

describe('admin account create: SUB_WH_ADMIN and zones (BR-112a, BR-112b)', () => {
  it('BR-112a: role SUB_WH_ADMIN is 422 VALIDATION_FAILED on body.role pointing at POST /admin/sub-warehouse-admins; nothing is written', async () => {
    const { repo, calls } = fakeRepo();
    const log: RecordedQuery[] = [];
    const error = await caught(
      serviceWith(repo, calls, log).create(gateScopeFor(RoleCode.SUPER_ADMIN), createScopeFor(RoleCode.SUPER_ADMIN, 'SUB_WH_ADMIN'), body('SUB_WH_ADMIN', { zoneId: null })),
    );
    expect(error.status).toBe(422);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(error.errors)).toContain('/admin/sub-warehouse-admins');
    expect(calls.events).toEqual([]);
    expect(auditInserts(log)).toEqual([]);
  });

  it('BR-112b: a FARMER_ADMIN without a zoneId is 422 on body.zoneId; any other role naming a zone is 422', async () => {
    const sa = gateScopeFor(RoleCode.SUPER_ADMIN);
    const { repo, calls } = fakeRepo();
    const missing = await caught(serviceWith(repo, calls).create(sa, createScopeFor(RoleCode.SUPER_ADMIN, 'FARMER_ADMIN'), body('FARMER_ADMIN', { zoneId: null })));
    expect(missing.status).toBe(422);
    expect(missing.errors).toHaveProperty(['body.zoneId']);
    for (const role of ['SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN']) {
      const error = await caught(serviceWith(repo, calls).create(sa, createScopeFor(RoleCode.SUPER_ADMIN, role), body(role, { zoneId: ZONE })));
      expect(error.status, role).toBe(422);
      expect(error.errors).toHaveProperty(['body.zoneId']);
    }
    expect(calls.events).toEqual([]);
  });

  it('BR-112b: an unknown or inactive zone is 422 and no account is created', async () => {
    for (const zone of [null, { isActive: false }]) {
      const { repo, calls } = fakeRepo({ zone });
      const error = await caught(serviceWith(repo, calls).create(gateScopeFor(RoleCode.TOHFA_ADMIN), createScopeFor(RoleCode.TOHFA_ADMIN, 'FARMER_ADMIN'), body('FARMER_ADMIN')));
      expect(error.status).toBe(422);
      expect(error.errors).toHaveProperty(['body.zoneId']);
      expect(calls.events).toEqual(['findZone']);
    }
  });

  it('BR-112b: a FARMER_ADMIN is bound to exactly the one zone it was created with', async () => {
    const { repo, calls } = fakeRepo();
    const created = await serviceWith(repo, calls).create(gateScopeFor(RoleCode.TOHFA_ADMIN), createScopeFor(RoleCode.TOHFA_ADMIN, 'FARMER_ADMIN'), body('FARMER_ADMIN'));
    expect(created.zoneIds).toEqual([ZONE]);
    expect(calls.assignments).toEqual([{ roleCode: 'FARMER_ADMIN', zoneId: ZONE }]);
  });
});

describe('admin account create: the write (BR-112c, BR-35)', () => {
  it('BR-112c: account, profile, assignment and ONE masked audit row in one transaction; the response carries no mobile or credential', async () => {
    const { repo, calls } = fakeRepo();
    const log: RecordedQuery[] = [];
    const actorId = newId();
    const created = await serviceWith(repo, calls, log).create(gateScopeFor(RoleCode.SUPER_ADMIN, actorId), createScopeFor(RoleCode.SUPER_ADMIN, 'MAIN_WH_ADMIN', actorId), body('MAIN_WH_ADMIN'));
    expect(adminAccountCreated.parse(created)).toEqual(created);
    expect(created).toEqual({
      userId: NEW_USER,
      adminCode: 'ADM-007',
      fullName: 'New Admin',
      role: 'MAIN_WH_ADMIN',
      status: 'ACTIVE',
      zoneIds: [],
      assignedAt: '2026-10-23T10:00:00.000Z',
    });
    expect(JSON.stringify(created)).not.toMatch(/password|\+91/i);
    expect(calls.events).toEqual(['insertUser', 'insertProfile', 'insertAssignment']);
    expect(calls.commits).toBe(1);

    const inserts = auditInserts(log);
    expect(inserts).toHaveLength(1);
    const params = inserts[0]!.params;
    expect(params[0]).toBe(actorId);
    expect(params[3]).toBe('admin.main_wh_admin.create');
    expect(params[5]).toBe(NEW_USER);
    expect(params[7]).toBe('ALLOWED');
    expect(JSON.parse(params[9] as string)).toEqual({ role: 'MAIN_WH_ADMIN', zoneIds: [], adminCode: 'ADM-007' });
    expect(JSON.stringify(params)).not.toContain('New Admin');
    expect(JSON.stringify(params)).not.toContain('+919876500011');
  });

  it('BR-112c: a taken mobile is 409 CONFLICT and the message never echoes it', async () => {
    const { repo, calls } = fakeRepo({ mobileTaken: true });
    const error = await caught(serviceWith(repo, calls).create(gateScopeFor(RoleCode.SUPER_ADMIN), createScopeFor(RoleCode.SUPER_ADMIN, 'TOHFA_ADMIN'), body('TOHFA_ADMIN')));
    expect(error.status).toBe(409);
    expect(JSON.stringify({ detail: error.message, errors: error.errors })).not.toContain('+919876500011');
  });
});

// ---------------------------------------------------------------------------
// 2. Request schema
// ---------------------------------------------------------------------------
describe('admin account create: request schema (BR-112)', () => {
  it('BR-112c: the body is strict: no password, email, status or admin code; the mobile is E.164', () => {
    const good = { role: 'TOHFA_ADMIN', fullName: '  Asha  ', mobile: '+919876500011' };
    expect(createAdminAccountBody.parse(good).fullName).toBe('Asha');
    for (const bad of [
      {},
      { ...good, role: 'FARMER' },
      { ...good, role: 'CUSTOMER' },
      { ...good, mobile: '9876500011' },
      { ...good, fullName: '' },
      { ...good, zoneId: 'not-a-uuid' },
      { ...good, password: 'Password@123' },
      { ...good, email: 'a@b.test' },
      { ...good, status: 'ACTIVE' },
      { ...good, adminCode: 'ADM-001' },
    ]) {
      expect(createAdminAccountBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Router
// ---------------------------------------------------------------------------
describe('admin account create router (BR-112d)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const good = { role: 'TOHFA_ADMIN', fullName: 'X Y', mobile: '+919876500011' };

  it('BR-112d: 401 without a token; 403 FORBIDDEN for FARMER_ADMIN, SUB_WH_ADMIN, FARMER and CUSTOMER (no admin.*.create code) before any SQL', async () => {
    expect((await request(server).post('/v1/admin/accounts').send(good)).status).toBe(401);
    for (const auth of [
      token([{ code: RoleCode.FARMER_ADMIN, zoneId: ZONE }]),
      token([{ code: RoleCode.SUB_WH_ADMIN, warehouseId: W1 }]),
      token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
      token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
    ]) {
      const res = await request(server).post('/v1/admin/accounts').set('Authorization', auth).send(good);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('BR-112d: a malformed body is 422 before any SQL', async () => {
    const res = await request(server).post('/v1/admin/accounts').set('Authorization', token([{ code: RoleCode.SUPER_ADMIN }])).send({ ...good, password: 'x' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});

// ---------------------------------------------------------------------------
// 4. PostgreSQL
// ---------------------------------------------------------------------------
describeIfDatabase('admin account create (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    expect(await databaseReady('admin_profiles'), 'the database is reachable and migrated').toBe(true);
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

  async function aZone(tx: pg.PoolClient, isActive = true): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO zones (id, code, name, is_active) VALUES ($1, $2, $3, $4)`, [id, `Z-${id.slice(0, 8)}`, 'Fixture Zone', isActive]);
    return id;
  }

  async function anAdmin(tx: pg.PoolClient, role: string): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Creator', 'ADMIN', 'ACTIVE')`, [id, randomMobile()]);
    await tx.query(`INSERT INTO user_roles (user_id, role_id, valid_from) SELECT $1, r.id, now() - interval '1 day' FROM roles r WHERE r.code = $2`, [id, role]);
    return id;
  }

  const service = (tx: pg.PoolClient) =>
    createAdminAccountsService({ repo: adminAccountsRepo, transaction: async (fn) => fn(tx), invalidateAccessTokens: async () => undefined });

  it('BR-112c (PostgreSQL): a TOHFA_ADMIN creates a FARMER_ADMIN: ACTIVE, no password, ADM- code, created_by, one zone-bound assignment, one masked audit row', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'TOHFA_ADMIN');
      const zone = await aZone(tx);
      const mobile = randomMobile();
      const created = await service(tx).create(
        gateScopeFor(RoleCode.TOHFA_ADMIN, actor),
        createScopeFor(RoleCode.TOHFA_ADMIN, 'FARMER_ADMIN', actor),
        createAdminAccountBody.parse({ role: 'FARMER_ADMIN', fullName: 'Elected Farmer', mobile, zoneId: zone }),
      );
      expect(created).toMatchObject({ role: 'FARMER_ADMIN', status: 'ACTIVE', zoneIds: [zone] });
      expect(created.adminCode).toMatch(/^ADM-\d{3,}$/);

      const user = (await tx.query(`SELECT status, user_type, password_hash FROM users WHERE id = $1`, [created.userId])).rows[0];
      expect(user).toEqual({ status: 'ACTIVE', user_type: 'ADMIN', password_hash: null });
      const profile = (await tx.query(`SELECT admin_code, created_by FROM admin_profiles WHERE user_id = $1`, [created.userId])).rows[0];
      expect(profile).toEqual({ admin_code: created.adminCode, created_by: actor });
      const roles = (await tx.query(`SELECT role_code, zone_id, warehouse_id, assigned_by FROM user_roles WHERE user_id = $1`, [created.userId])).rows;
      expect(roles).toEqual([{ role_code: 'FARMER_ADMIN', zone_id: zone, warehouse_id: null, assigned_by: actor }]);
      const audit = (await tx.query(`SELECT action_code, outcome, after FROM audit_log WHERE entity_id = $1`, [created.userId])).rows;
      expect(audit).toEqual([{ action_code: 'admin.farmer_admin.create', outcome: 'ALLOWED', after: { role: 'FARMER_ADMIN', zoneIds: [zone], adminCode: created.adminCode } }]);
    });
  });

  it('BR-28b (PostgreSQL): MAIN_WH_ADMIN creating a SUPER_ADMIN is 403, creates no user and leaves one DENIED audit row', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'MAIN_WH_ADMIN');
      const mobile = randomMobile();
      const error = await caught(
        service(tx).create(gateScopeFor(RoleCode.MAIN_WH_ADMIN, actor), createScopeFor(RoleCode.MAIN_WH_ADMIN, 'SUPER_ADMIN', actor), createAdminAccountBody.parse({ role: 'SUPER_ADMIN', fullName: 'Nope', mobile })),
      );
      expect(error.status).toBe(403);
      expect((await tx.query(`SELECT count(*)::int AS n FROM users WHERE mobile = $1`, [mobile])).rows[0]).toEqual({ n: 0 });
      const audit = (await tx.query(`SELECT action_code, outcome, actor_role, entity_id FROM audit_log WHERE actor_id = $1`, [actor])).rows;
      expect(audit).toEqual([{ action_code: 'admin.super_admin.create', outcome: 'DENIED', actor_role: 'MAIN_WH_ADMIN', entity_id: null }]);
    });
  });

  it('BR-112b (PostgreSQL): an inactive or unknown zone is 422 and a taken mobile is 409; nothing is created', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      const inactive = await aZone(tx, false);
      for (const zoneId of [inactive, newId()]) {
        const error = await caught(
          service(tx).create(gateScopeFor(RoleCode.SUPER_ADMIN, actor), createScopeFor(RoleCode.SUPER_ADMIN, 'FARMER_ADMIN', actor), createAdminAccountBody.parse({ role: 'FARMER_ADMIN', fullName: 'Z', mobile: randomMobile(), zoneId })),
        );
        expect(error.status).toBe(422);
      }
      const taken = (await tx.query<{ mobile: string }>(`SELECT mobile FROM users WHERE id = $1`, [actor])).rows[0]!.mobile;
      const error = await caught(
        service(tx).create(gateScopeFor(RoleCode.SUPER_ADMIN, actor), createScopeFor(RoleCode.SUPER_ADMIN, 'TOHFA_ADMIN', actor), createAdminAccountBody.parse({ role: 'TOHFA_ADMIN', fullName: 'T', mobile: taken })),
      );
      expect(error.status).toBe(409);
    });
  });
});
