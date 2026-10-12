/**
 * BR-81: Sub Warehouse Admin staffing (list and create; deactivation is NOT built, see the report).
 * Also carries the BR-25 and BR-28 tests that the rule texts require for the part of the admin-creation
 * hierarchy this module implements.
 *
 *  BR-25a  creating a SUB_WH_ADMIN without a warehouse is 422 `WAREHOUSE_REQUIRED`
 *  BR-25b  the database rejects the same assignment inserted directly
 *  BR-28a  exactly the 8 allowed (creator, target) pairs of docs/rbac.json `creationRules` hold a
 *          non-`none` grant on `admin.<target>.create` (data level), and POST /v1/admin/sub-warehouse-admins
 *          is allowed for exactly the creators `creationRules` lists for SUB_WH_ADMIN (HTTP level)
 *  BR-28b  the request cannot name a role: this endpoint can only ever create a SUB_WH_ADMIN
 *  BR-81a  the created account is ACTIVE with no password and signs in only after the existing
 *          forgot-password / reset-password flow set one
 *  BR-81b  one account + one admin profile + one warehouse-scoped assignment, assigned_by = the creator
 *  BR-81c  the warehouse must exist and be active (422), a taken mobile is 409, a creator whose scope does
 *          not cover the warehouse gets 404
 *  BR-81d  a warehouse holds at most system_config.sub_wh_admin_max_per_warehouse live admins (409)
 *  BR-81e  one masked audit row in the same transaction (no name, no mobile)
 *  BR-81f  the list shows live assignments only, scoped, never a mobile number
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { RBAC_JSON_PATH } from '../../paths.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { randomMobile, requireDatabaseTables } from '../../test/dbFixtures.js';
import { createSubAdminBody, listSubAdminsQuery } from './sub-admins.schema.js';
import { createSubAdminsService } from './sub-admins.service.js';
import { subAdminsRepo } from './sub-admins.repo.js';
import { inRolledBackTx, loadWarehouseIds, startHttpHarness, type HttpHarness, type WarehouseIds } from './testkit.js';

const TARGET_PERMISSION: Record<string, string> = {
  SUPER_ADMIN: 'admin.super_admin.create',
  TOHFA_ADMIN: 'admin.tohfa_admin.create',
  FARMER_ADMIN: 'admin.farmer_admin.create',
  MAIN_WH_ADMIN: 'admin.main_wh_admin.create',
  SUB_WH_ADMIN: 'admin.sub_wh_admin.create',
};
/** `creationRules` is read straight from docs/rbac.json: the loader's typed document does not carry it. */
function readCreationRules(): Array<{ canCreate: string; allowedCreators: string[] }> {
  const parsed = JSON.parse(readFileSync(RBAC_JSON_PATH, 'utf8')) as { creationRules?: Array<{ canCreate: string; allowedCreators: string[] }> };
  if (parsed.creationRules === undefined) throw new Error('docs/rbac.json has no creationRules');
  return parsed.creationRules;
}
const ACTORS = [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.FARMER_ADMIN, RoleCode.MAIN_WH_ADMIN, RoleCode.SUB_WH_ADMIN];

// ===========================================================================
// 1. Schemas and the rbac.json data
// ===========================================================================
describe('sub warehouse admin schemas', () => {
  const body = { fullName: 'Karthik Kumar', mobile: '+919876500001', warehouseId: newId() };

  it('BR-81b: the create body needs a name and an E.164 mobile, trims the name, and is strict', () => {
    expect(createSubAdminBody.parse({ ...body, fullName: '  Karthik Kumar ' }).fullName).toBe('Karthik Kumar');
    for (const bad of [
      {},
      { ...body, fullName: '' },
      { ...body, fullName: 'n'.repeat(121) },
      { ...body, mobile: '9876500001' },
      { ...body, mobile: '+91 98765 00001' },
      { ...body, warehouseId: 'not-a-uuid' },
      { ...body, role: 'SUPER_ADMIN' },
      { ...body, roleCode: 'SUPER_ADMIN' },
      { ...body, password: 'Password@123' },
      { ...body, email: 'a@b.test' },
      { ...body, status: 'ACTIVE' },
      { ...body, adminCode: 'SWA-001' },
      { ...body, isStandby: true },
    ]) {
      expect(createSubAdminBody.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });

  it('BR-25a: a missing or null warehouseId parses (the service answers WAREHOUSE_REQUIRED, not a generic 422)', () => {
    expect(createSubAdminBody.safeParse({ fullName: 'A', mobile: '+919876500001' }).success).toBe(true);
    expect(createSubAdminBody.safeParse({ fullName: 'A', mobile: '+919876500001', warehouseId: null }).success).toBe(true);
  });

  it('BR-81f: the list query is strict, pages at most 100 and filters by warehouseId', () => {
    expect(listSubAdminsQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listSubAdminsQuery.safeParse({ warehouseId: 'x' }).success).toBe(false);
    expect(listSubAdminsQuery.safeParse({ pageSize: '101' }).success).toBe(false);
    expect(listSubAdminsQuery.safeParse({ role: 'SUPER_ADMIN' }).success).toBe(false);
  });
});

describe('BR-28a: docs/rbac.json creationRules and the admin.*.create grants agree', () => {
  const rbac = loadRbac();
  const rules = readCreationRules();

  it('BR-28a: over 5 targets x 5 admin actors exactly the 8 allowed pairs hold a grant and the other 17 are none', () => {
    let allowed = 0;
    let denied = 0;
    for (const rule of rules) {
      for (const actor of ACTORS) {
        const grant = rbac.grantFor(TARGET_PERMISSION[rule.canCreate]!, actor);
        const expected = rule.allowedCreators.includes(actor);
        expect(grant !== ScopeLevel.NONE, `${actor} creating ${rule.canCreate}`).toBe(expected);
        if (expected) allowed += 1;
        else denied += 1;
      }
    }
    expect(rules).toHaveLength(5);
    expect({ allowed, denied }).toEqual({ allowed: 8, denied: 17 });
  });

  it('BR-28a: SUB_WH_ADMIN is creatable by exactly SUPER_ADMIN, TOHFA_ADMIN and MAIN_WH_ADMIN', () => {
    const rule = rules.find((r) => r.canCreate === 'SUB_WH_ADMIN')!;
    expect([...rule.allowedCreators].sort()).toEqual(['MAIN_WH_ADMIN', 'SUPER_ADMIN', 'TOHFA_ADMIN']);
  });
});

// ===========================================================================
// 2. Service against real Postgres, in a rolled-back transaction
// ===========================================================================
describeIfDatabase('sub warehouse admin service (PostgreSQL)', () => {
  let ready = false;
  let wh: WarehouseIds;

  beforeAll(async () => {
    ready = await requireDatabaseTables('users', 'user_roles', 'admin_profiles', 'system_config');
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

  const creator = (userId: string, roleCode: RoleCode = RoleCode.MAIN_WH_ADMIN) =>
    aScope({ level: ScopeLevel.ALL, roleCode, permission: 'admin.sub_wh_admin.create', userId });
  const service = (tx: Executor) => createSubAdminsService({ repo: subAdminsRepo, db: tx, runTx: async (fn) => fn(tx) });
  async function actor(tx: Executor): Promise<string> {
    const user = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status) VALUES ($1, 'CI swa creator', 'ADMIN', 'ACTIVE') RETURNING id`,
      [randomMobile()],
    );
    return user.rows[0]!.id;
  }
  const fail = async (promise: Promise<unknown>): Promise<AppError> => {
    const error = await promise.then(() => null, (e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    return error as AppError;
  };
  const input = (warehouseId: string | null | undefined, name = 'Karthik Kumar') =>
    ({ fullName: name, mobile: randomMobile(), ...(warehouseId === undefined ? {} : { warehouseId }) });

  dbTest('BR-25a: a missing or null warehouse is 422 WAREHOUSE_REQUIRED and creates nothing', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const before = (await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM users`)).rows[0]!.n;
      for (const warehouseId of [undefined, null]) {
        const error = await fail(svc.create(creator(userId), input(warehouseId)));
        expect(error.status).toBe(422);
        expect(error.code).toBe('WAREHOUSE_REQUIRED');
      }
      expect((await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM users`)).rows[0]!.n).toBe(before);
    });
  });

  dbTest('BR-25b: the database rejects a SUB_WH_ADMIN assignment without a warehouse when inserted directly', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      await tx.query('SAVEPOINT direct');
      const error = await tx
        .query(`INSERT INTO user_roles (user_id, role_id, role_code, warehouse_id) SELECT $1, id, code, NULL FROM roles WHERE code = 'SUB_WH_ADMIN'`, [userId])
        .then(() => null, (e: unknown) => e);
      await tx.query('ROLLBACK TO SAVEPOINT direct');
      expect(error).not.toBeNull();
      expect((error as { code?: string }).code).toBe('23514');
    });
  });

  dbTest('BR-81b: creates one ACTIVE account with no password, an admin profile and a warehouse-scoped assignment', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const body = input(wh.coonoor, 'Karthik Kumar');
      const created = await svc.create(creator(userId), body);

      expect(created).toMatchObject({ fullName: 'Karthik Kumar', status: 'ACTIVE', warehouseId: wh.coonoor });
      expect(created.adminCode).toMatch(/^SWA-\d{3,}$/);
      expect(Object.keys(created).sort()).toEqual(['adminCode', 'assignedAt', 'fullName', 'status', 'userId', 'warehouseId']);

      const user = (await tx.query<{ mobile: string; password_hash: string | null; user_type: string; status: string }>(
        `SELECT mobile, password_hash, user_type, status FROM users WHERE id = $1`, [created.userId])).rows[0]!;
      expect(user).toEqual({ mobile: body.mobile, password_hash: null, user_type: 'ADMIN', status: 'ACTIVE' });
      const profile = (await tx.query<{ admin_code: string; created_by: string; is_standby: boolean }>(
        `SELECT admin_code, created_by, is_standby FROM admin_profiles WHERE user_id = $1`, [created.userId])).rows[0]!;
      expect(profile).toEqual({ admin_code: created.adminCode, created_by: userId, is_standby: false });
      const roles = (await tx.query<{ role_code: string; warehouse_id: string; assigned_by: string; valid_to: Date | null }>(
        `SELECT role_code, warehouse_id, assigned_by, valid_to FROM user_roles WHERE user_id = $1`, [created.userId])).rows;
      expect(roles).toEqual([{ role_code: 'SUB_WH_ADMIN', warehouse_id: wh.coonoor, assigned_by: userId, valid_to: null }]);

      // Admin codes never repeat.
      const second = await svc.create(creator(userId), input(wh.coonoor, 'Second Admin'));
      expect(second.adminCode).not.toBe(created.adminCode);
    });
  });

  dbTest('BR-81c: an unknown or inactive warehouse is 422, a taken mobile is 409, a scope that does not cover the warehouse is 404', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);

      const unknown = await fail(svc.create(creator(userId), input(newId())));
      expect(unknown.status).toBe(422);
      expect(unknown.code).toBe('VALIDATION_FAILED');
      expect(unknown.errors).toHaveProperty('body.warehouseId');

      await tx.query(`UPDATE warehouses SET is_active = false WHERE id = $1`, [wh.gudalur]);
      const inactive = await fail(svc.create(creator(userId), input(wh.gudalur)));
      expect(inactive.status).toBe(422);
      expect(inactive.errors).toHaveProperty('body.warehouseId');

      const first = input(wh.ooty);
      await svc.create(creator(userId), first);
      await tx.query('SAVEPOINT dup');
      const dup = await fail(svc.create(creator(userId), { ...input(wh.kotagiri), mobile: first.mobile }));
      await tx.query('ROLLBACK TO SAVEPOINT dup');
      expect(dup.status).toBe(409);
      expect(dup.code).toBe('CONFLICT');
      expect(JSON.stringify(dup.errors ?? {})).not.toContain(first.mobile);

      // A farmer's mobile is taken too: an admin is never attached to an existing account.
      const subOwn = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [wh.ooty], permission: 'admin.sub_wh_admin.create', userId });
      const other = await fail(svc.create(subOwn, input(wh.coonoor)));
      expect(other.status).toBe(404);
      expect((await svc.create(subOwn, input(wh.ooty))).warehouseId).toBe(wh.ooty);
    });
  });

  dbTest('BR-81d: a warehouse holds at most system_config.sub_wh_admin_max_per_warehouse live admins; a disabled one frees its slot', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      await tx.query(`UPDATE system_config SET value = '2'::jsonb WHERE key = 'sub_wh_admin_max_per_warehouse'`);
      const a = await svc.create(creator(userId), input(wh.ooty, 'A'));
      await svc.create(creator(userId), input(wh.ooty, 'B'));

      await tx.query('SAVEPOINT cap');
      const full = await fail(svc.create(creator(userId), input(wh.ooty, 'C')));
      await tx.query('ROLLBACK TO SAVEPOINT cap');
      expect(full.status).toBe(409);
      expect(full.code).toBe('CONFLICT');
      expect(full.detail).toContain('2');

      // Another warehouse has its own count.
      expect((await svc.create(creator(userId), input(wh.coonoor, 'D'))).warehouseId).toBe(wh.coonoor);

      await tx.query(`UPDATE users SET status = 'DISABLED' WHERE id = $1`, [a.userId]);
      expect((await svc.create(creator(userId), input(wh.ooty, 'E'))).warehouseId).toBe(wh.ooty);
    });
  });

  dbTest('BR-81d: with the config row missing or unusable the cap falls back to 5', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      await tx.query(`DELETE FROM system_config WHERE key = 'sub_wh_admin_max_per_warehouse'`);
      const live = (await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM user_roles WHERE role_code = 'SUB_WH_ADMIN' AND warehouse_id = $1 AND valid_to IS NULL`, [wh.kotagiri])).rows[0]!.n;
      for (let i = Number(live); i < 5; i += 1) await svc.create(creator(userId), input(wh.kotagiri, `Fill ${i}`));
      await tx.query('SAVEPOINT cap');
      const sixth = await fail(svc.create(creator(userId), input(wh.kotagiri, 'Sixth')));
      await tx.query('ROLLBACK TO SAVEPOINT cap');
      expect(sixth.status).toBe(409);

      await tx.query(`INSERT INTO system_config (key, value, data_type, description) VALUES ('sub_wh_admin_max_per_warehouse', '"many"'::jsonb, 'string', 'fixture')`);
      await tx.query('SAVEPOINT cap2');
      const unusable = await fail(svc.create(creator(userId), input(wh.kotagiri, 'Seventh')));
      await tx.query('ROLLBACK TO SAVEPOINT cap2');
      expect(unusable.status).toBe(409);
    });
  });

  dbTest('BR-81e: one masked audit row in the same transaction: no name, no mobile; it rolls back with the account', async () => {
    const { pool } = await import('../../db/pool.js');
    const auditCount = async () => (await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM audit_log WHERE action_code = 'admin.sub_wh_admin.create'`)).rows[0]!.n;
    const before = await auditCount();
    let secretMobile = '';
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const body = input(wh.ooty, 'Secret Person Name');
      secretMobile = body.mobile;
      const created = await service(tx).create(creator(userId, RoleCode.TOHFA_ADMIN), body);
      const rows = (await tx.query<{ actor_role: string; entity_type: string; entity_id: string; warehouse_id: string; before: unknown; after: unknown; changed_fields: string[] | null }>(
        `SELECT actor_role, entity_type, entity_id::text, warehouse_id::text, before, after, changed_fields
           FROM audit_log WHERE actor_id = $1 AND action_code = 'admin.sub_wh_admin.create'`, [userId])).rows;
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        actor_role: 'TOHFA_ADMIN',
        entity_type: 'user',
        entity_id: created.userId,
        warehouse_id: wh.ooty,
        before: null,
        after: { role: 'SUB_WH_ADMIN', warehouseId: wh.ooty, adminCode: created.adminCode },
        changed_fields: null,
      });
      expect(JSON.stringify(rows)).not.toContain('Secret Person Name');
      expect(JSON.stringify(rows)).not.toContain(secretMobile);
    });
    expect(await auditCount()).toBe(before);
    expect((await pool.query(`SELECT 1 FROM users WHERE mobile = $1`, [secretMobile])).rowCount).toBe(0);
  });

  dbTest('BR-81f: lists live assignments only, by admin code, filtered and scoped, with no mobile number', async () => {
    await inRolledBackTx(async (tx) => {
      const userId = await actor(tx);
      const svc = service(tx);
      const a = await svc.create(creator(userId), input(wh.ooty, 'Ooty One'));
      const b = await svc.create(creator(userId), input(wh.ooty, 'Ooty Two'));
      const c = await svc.create(creator(userId), input(wh.coonoor, 'Coonoor One'));
      const ended = await svc.create(creator(userId), input(wh.ooty, 'Ooty Ended'));
      const gone = await svc.create(creator(userId), input(wh.ooty, 'Ooty Deleted'));
      await tx.query(`UPDATE user_roles SET valid_to = now() - interval '1 second', valid_from = now() - interval '1 hour' WHERE user_id = $1`, [ended.userId]);
      await tx.query(`UPDATE users SET deleted_at = now() WHERE id = $1`, [gone.userId]);

      const all = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: 'admin.sub_wh_admin.create', userId });
      const mine = await svc.list(all, { warehouseId: wh.ooty, page: 1, pageSize: 20 });
      expect(mine.items.map((item) => item.userId).sort()).toEqual([a.userId, b.userId].sort());
      expect(mine.total).toBe(2);
      expect(mine.items.map((item) => item.adminCode)).toEqual([...mine.items.map((item) => item.adminCode)].sort());
      for (const item of mine.items) expect(Object.keys(item).sort()).toEqual(['adminCode', 'assignedAt', 'fullName', 'status', 'userId', 'warehouseId']);

      const everyone = await svc.list(all, { page: 1, pageSize: 100 });
      expect(everyone.items.map((item) => item.userId)).toEqual(expect.arrayContaining([a.userId, b.userId, c.userId]));
      expect(everyone.items.map((item) => item.userId)).not.toContain(ended.userId);
      expect(everyone.items.map((item) => item.userId)).not.toContain(gone.userId);
      const paged = await svc.list(all, { warehouseId: wh.ooty, page: 2, pageSize: 1 });
      expect(paged.items).toHaveLength(1);
      expect(paged.total).toBe(2);

      // A scope that covers only Coonoor sees only Coonoor, and 404 for Ooty.
      const coonoorOnly = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [wh.coonoor], permission: 'admin.sub_wh_admin.create', userId });
      expect((await svc.list(coonoorOnly, { page: 1, pageSize: 100 })).items.map((item) => item.warehouseId)).toEqual(
        expect.not.arrayContaining([wh.ooty]),
      );
      expect((await fail(svc.list(coonoorOnly, { warehouseId: wh.ooty, page: 1, pageSize: 20 }))).status).toBe(404);
      expect((await fail(svc.list(all, { warehouseId: newId(), page: 1, pageSize: 20 }))).status).toBe(404);
    });
  });
});

// ===========================================================================
// 3. Real HTTP through the real app router
// ===========================================================================
describeIfDatabase('sub warehouse admin routes (real app router, PostgreSQL)', () => {
  let ready = false;
  let harness: HttpHarness;
  const tag = `CI SWA ${Date.now()}`;
  const path = '/v1/admin/sub-warehouse-admins';

  beforeAll(async () => {
    ready = await requireDatabaseTables('users', 'user_roles', 'admin_profiles');
    if (ready) harness = await startHttpHarness();
  });

  afterAll(async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    // The accounts this suite committed go; the audit rows are append-only and stay.
    await pool.query(`DELETE FROM users WHERE full_name LIKE $1`, [`${tag}%`]);
    await harness.stop();
  });

  const dbTest = (name: string, fn: () => Promise<void>) =>
    it(name, async (context) => {
      if (!ready) context.skip();
      await fn();
    });

  const goodBody = (warehouseId: string, label = 'x') => ({ fullName: `${tag} ${label}`, mobile: randomMobile(), warehouseId });
  const created = async (): Promise<number> => {
    const { pool } = await import('../../db/pool.js');
    return Number((await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM users WHERE full_name LIKE $1`, [`${tag}%`])).rows[0]!.n);
  };

  dbTest('BR-28a (HTTP): POST is allowed for exactly the creators creationRules lists for SUB_WH_ADMIN; every other role is 403 and creates nothing', async () => {
    const rules = readCreationRules();
    const allowedCreators = rules.find((rule) => rule.canCreate === 'SUB_WH_ADMIN')!.allowedCreators;
    const roles: Array<[HarnessRoleName, string]> = [
      ['superAdmin', 'SUPER_ADMIN'],
      ['tohfaAdmin', 'TOHFA_ADMIN'],
      ['farmerAdmin', 'FARMER_ADMIN'],
      ['main', 'MAIN_WH_ADMIN'],
      ['subOoty', 'SUB_WH_ADMIN'],
      ['farmer', 'FARMER'],
      ['customer', 'CUSTOMER'],
    ];
    for (const [role, roleCode] of roles) {
      const before = await created();
      const res = await request(harness.server).post(path).set('Authorization', harness.auth(role)).send(goodBody(harness.warehouse.kotagiri, role));
      if (allowedCreators.includes(roleCode)) {
        expect(res.status, `${role}: ${JSON.stringify(res.body)}`).toBe(201);
        expect(await created()).toBe(before + 1);
      } else {
        expect(res.status, role).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
        expect(await created()).toBe(before);
      }
    }
    expect((await request(harness.server).post(path).send(goodBody(harness.warehouse.kotagiri))).status).toBe(401);
  });

  dbTest('BR-28b (HTTP): a request cannot name a role: SUPER_ADMIN, TOHFA_ADMIN and MAIN_WH_ADMIN accounts cannot be created here', async () => {
    const before = await created();
    for (const role of ['SUPER_ADMIN', 'TOHFA_ADMIN', 'MAIN_WH_ADMIN', 'FARMER_ADMIN']) {
      for (const field of ['role', 'roleCode', 'roles']) {
        const res = await request(harness.server).post(path).set('Authorization', harness.auth('main')).send({ ...goodBody(harness.warehouse.ooty, 'role'), [field]: role });
        expect(res.status, `${field}=${role}`).toBe(422);
      }
    }
    expect(await created()).toBe(before);
  });

  dbTest('BR-25a (HTTP): no warehouseId is 422 WAREHOUSE_REQUIRED; a malformed one is VALIDATION_FAILED; an unknown one is 422', async () => {
    const before = await created();
    const missing = await request(harness.server).post(path).set('Authorization', harness.auth('superAdmin')).send({ fullName: `${tag} nowh`, mobile: randomMobile() });
    expect(missing.status).toBe(422);
    expect(missing.body.code).toBe('WAREHOUSE_REQUIRED');
    const nulled = await request(harness.server).post(path).set('Authorization', harness.auth('superAdmin')).send({ fullName: `${tag} nowh`, mobile: randomMobile(), warehouseId: null });
    expect(nulled.body.code).toBe('WAREHOUSE_REQUIRED');
    const bad = await request(harness.server).post(path).set('Authorization', harness.auth('superAdmin')).send({ ...goodBody('not-a-uuid'), warehouseId: 'not-a-uuid' });
    expect(bad.status).toBe(422);
    expect(bad.body.code).toBe('VALIDATION_FAILED');
    const unknown = await request(harness.server).post(path).set('Authorization', harness.auth('superAdmin')).send(goodBody(newId()));
    expect(unknown.status).toBe(422);
    expect(await created()).toBe(before);
  });

  dbTest('BR-81a (HTTP): the new admin cannot sign in until the existing forgot-password flow sets a password, then signs in as SUB_WH_ADMIN of that warehouse only', async () => {
    const body = goodBody(harness.warehouse.gudalur, 'login');
    const make = await request(harness.server).post(path).set('Authorization', harness.auth('main')).send(body);
    expect(make.status).toBe(201);
    expect(make.body).toMatchObject({ fullName: body.fullName, status: 'ACTIVE', warehouseId: harness.warehouse.gudalur });
    expect(JSON.stringify(make.body)).not.toContain(body.mobile);

    const early = await request(harness.server).post('/v1/auth/login').send({ mobile: body.mobile, password: 'Password@123' });
    expect(early.status).toBe(401);

    const forgot = await request(harness.server).post('/v1/auth/forgot-password').send({ mobile: body.mobile });
    expect(forgot.status).toBe(202);
    const reset = await request(harness.server).post('/v1/auth/reset-password').send({ challengeId: forgot.body.challengeId, code: forgot.body._mockCode, newPassword: 'A-Strong-Passw0rd!' });
    expect(reset.status).toBe(204);

    const login = await request(harness.server).post('/v1/auth/login').send({ mobile: body.mobile, password: 'A-Strong-Passw0rd!' });
    expect(login.status, JSON.stringify(login.body)).toBe(200);
    const { verifyAccessToken } = await import('../../auth/jwt.js');
    const claims = verifyAccessToken(login.body.accessToken as string);
    expect(claims.roles).toEqual([{ code: 'SUB_WH_ADMIN', warehouseId: harness.warehouse.gudalur }]);
  });

  dbTest('BR-81f (HTTP): Super, Tohfa and Main list; FARMER, CUSTOMER, FARMER_ADMIN and Sub are 403; the list never carries a mobile', async () => {
    await request(harness.server).post(path).set('Authorization', harness.auth('superAdmin')).send(goodBody(harness.warehouse.ooty, 'listed'));
    for (const role of ['superAdmin', 'tohfaAdmin', 'main'] as const) {
      const res = await request(harness.server).get(path).query({ warehouseId: harness.warehouse.ooty }).set('Authorization', harness.auth(role));
      expect(res.status, role).toBe(200);
      expect(res.body.items.every((item: { warehouseId: string }) => item.warehouseId === harness.warehouse.ooty)).toBe(true);
      expect(JSON.stringify(res.body)).not.toMatch(/\+91\d/);
    }
    expect((await request(harness.server).get(path)).status).toBe(401);
    for (const role of ['farmer', 'customer', 'farmerAdmin', 'subOoty'] as const) {
      expect((await request(harness.server).get(path).set('Authorization', harness.auth(role))).status, role).toBe(403);
    }
    expect((await request(harness.server).get(path).query({ warehouseId: newId() }).set('Authorization', harness.auth('main'))).status).toBe(404);
  });

  dbTest('BR-81d (HTTP): the 6th admin of one warehouse is 409 under the default cap of 5, and there is no delete or update route', async () => {
    const { pool } = await import('../../db/pool.js');
    const live = Number((await pool.query<{ n: string }>(`SELECT count(*)::text AS n FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE ur.role_code = 'SUB_WH_ADMIN' AND ur.warehouse_id = $1 AND ur.valid_to IS NULL AND u.deleted_at IS NULL AND u.status <> 'DISABLED'`, [harness.warehouse.coonoor])).rows[0]!.n);
    for (let i = live; i < 5; i += 1) {
      const ok = await request(harness.server).post(path).set('Authorization', harness.auth('main')).send(goodBody(harness.warehouse.coonoor, `fill ${i}`));
      expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    }
    const sixth = await request(harness.server).post(path).set('Authorization', harness.auth('main')).send(goodBody(harness.warehouse.coonoor, 'sixth'));
    expect(sixth.status).toBe(409);
    expect(sixth.body.code).toBe('CONFLICT');
    const any = (await request(harness.server).get(path).query({ warehouseId: harness.warehouse.coonoor }).set('Authorization', harness.auth('main'))).body.items[0] as { userId: string };
    for (const method of ['delete', 'patch', 'put'] as const) {
      const res = await request(harness.server)[method](`${path}/${any.userId}`).set('Authorization', harness.auth('superAdmin')).send({});
      expect([404, 405], method).toContain(res.status);
    }
  });
});

type HarnessRoleName = Parameters<HttpHarness['auth']>[0];
