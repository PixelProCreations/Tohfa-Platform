/**
 * Role definitions (BR-109).
 *
 * Layers:
 *  1. service against a fake repo (assembly, ordering, 404)
 *  2. the router: permission wiring (refused before any SQL runs), GET only
 *  3. PostgreSQL: the real repo against the seeded permission tables, inside a rolled-back transaction
 */
import type { Server } from 'node:http';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { AppError } from '../../http/problem.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { aScope, databaseReady, describeIfDatabase, IDS } from '../../test/factories.js';
import { rolesRepo, type GrantRow, type RoleRow, type RolesRepo } from './roles.repo.js';
import { rolesRouter } from './roles.routes.js';
import { roleDefinition } from './roles.schema.js';
import { createRolesService } from './roles.service.js';

const scope = aScope({ level: ScopeLevel.VIEW, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'role.definition.view' });

const ROLES: RoleRow[] = [
  { code: 'SUPER_ADMIN', name: 'TOHFA Super Admin', level: 1, scopeDimension: null, summary: 'Full system.' },
  { code: 'SUB_WH_ADMIN', name: 'Sub Warehouse Admin', level: 4, scopeDimension: 'warehouse_id', summary: null },
];
const GRANTS: GrantRow[] = [
  { roleCode: 'SUPER_ADMIN', code: 'a.one', module: 'M', description: 'A one', scope: 'all', predicate: null },
  { roleCode: 'SUPER_ADMIN', code: 'b.two', module: 'M', description: 'B two', scope: 'all', predicate: null },
  { roleCode: 'SUB_WH_ADMIN', code: 'a.one', module: 'M', description: 'A one', scope: 'own', predicate: null },
];

function fakeRepo(): { repo: RolesRepo; calls: Array<string | undefined> } {
  const calls: Array<string | undefined> = [];
  const repo: RolesRepo = {
    async listRoles(_db, code) {
      calls.push(code);
      return ROLES.filter((r) => code === undefined || r.code === code);
    },
    async listGrants(_db, code) {
      return GRANTS.filter((g) => code === undefined || g.roleCode === code);
    },
  };
  return { repo, calls };
}

const serviceWith = (repo: RolesRepo) => createRolesService({ repo, db: {} as never });

async function caught(promise: Promise<unknown>): Promise<AppError> {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

describe('roles service (BR-109)', () => {
  it('BR-109a: each role carries its level, scope dimension and only its own granted permissions, in repo order', async () => {
    const { repo } = fakeRepo();
    const result = await serviceWith(repo).list(scope);
    expect(result.items.map((r) => r.code)).toEqual(['SUPER_ADMIN', 'SUB_WH_ADMIN']);
    for (const item of result.items) expect(roleDefinition.parse(item)).toEqual(item);
    expect(result.items[0]).toMatchObject({ level: 1, scopeDimension: null, summary: 'Full system.' });
    expect(result.items[0]!.permissions.map((p) => p.code)).toEqual(['a.one', 'b.two']);
    expect(result.items[1]!.permissions).toEqual([{ code: 'a.one', module: 'M', description: 'A one', scope: 'own', predicate: null }]);
  });

  it('BR-109a: one role by code carries the same shape as in the list', async () => {
    const { repo, calls } = fakeRepo();
    const role = await serviceWith(repo).get(scope, 'SUB_WH_ADMIN');
    expect(calls).toEqual(['SUB_WH_ADMIN']);
    expect(role).toEqual({
      code: 'SUB_WH_ADMIN',
      name: 'Sub Warehouse Admin',
      level: 4,
      scopeDimension: 'warehouse_id',
      summary: null,
      permissions: [{ code: 'a.one', module: 'M', description: 'A one', scope: 'own', predicate: null }],
    });
  });

  it('BR-109b: an unknown role code is 404 NOT_FOUND', async () => {
    const { repo } = fakeRepo();
    const error = await caught(serviceWith(repo).get(scope, 'NOPE'));
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
  });
});

describe('roles router (BR-109c)', () => {
  let server: Server;
  const token = (roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>, extra: { farmerId?: string; customerId?: string } = {}): string =>
    `Bearer ${signAccessToken({ sub: IDS.userSuperAdmin, roles, farmerId: extra.farmerId ?? null, customerId: extra.customerId ?? null })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-109c: the router registers GET routes only', () => {
    const routes = rolesRouter.stack
      .filter((layer) => layer.route !== undefined)
      .flatMap((layer) => {
        const route = layer.route as unknown as { path: string; methods: Record<string, boolean> };
        return Object.keys(route.methods).map((m) => `${m} ${route.path}`);
      });
    expect(new Set(routes)).toEqual(new Set(['get /', 'get /:code']));
  });

  it('BR-109c: both routes are 401 without a token', async () => {
    expect((await request(server).get('/v1/roles')).status).toBe(401);
    expect((await request(server).get('/v1/roles/SUPER_ADMIN')).status).toBe(401);
  });

  it('BR-109c: FARMER and CUSTOMER are 403 (role.definition.view = none)', async () => {
    for (const auth of [
      token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
      token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
    ]) {
      expect((await request(server).get('/v1/roles').set('Authorization', auth)).status).toBe(403);
      expect((await request(server).get('/v1/roles/SUPER_ADMIN').set('Authorization', auth)).status).toBe(403);
    }
  });
});

describeIfDatabase('roles (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    expect(await databaseReady('role_permissions'), 'the database is reachable and migrated').toBe(true);
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

  const service = (tx: pg.PoolClient) => createRolesService({ repo: rolesRepo, db: tx });

  it('BR-109a (PostgreSQL): the seeded tables give every rbac.json role with its level and exactly its non-none grants', async () => {
    await inRollback(async (tx) => {
      const rbac = loadRbac();
      const result = await service(tx).list(scope);
      expect(result.items.map((r) => r.code).sort()).toEqual([...rbac.rolesByCode.keys()].sort());
      for (const role of result.items) {
        expect(roleDefinition.parse(role)).toEqual(role);
        expect(role.level).toBe(rbac.rolesByCode.get(role.code as RoleCode)!.level);
        const expected = rbac.document.permissions
          .filter((p) => (p.grants[role.code as RoleCode] ?? 'none') !== 'none')
          .map((p) => `${p.code}:${p.grants[role.code as RoleCode]}`)
          .sort();
        expect(role.permissions.map((p) => `${p.code}:${p.scope}`).sort(), role.code).toEqual(expected);
      }
      const ta = result.items.find((r) => r.code === 'TOHFA_ADMIN')!;
      expect(ta.permissions.find((p) => p.code === 'admin.account.disable')).toMatchObject({ scope: 'conditional', predicate: 'LOWER_ROLES_ONLY' });
    });
  });

  it('BR-109a (PostgreSQL): the response is read from role_permissions, so changing a grant row changes it', async () => {
    await inRollback(async (tx) => {
      await tx.query(
        `UPDATE role_permissions SET scope = 'none'
          WHERE role_id = (SELECT id FROM roles WHERE code = 'TOHFA_ADMIN')
            AND permission_id = (SELECT id FROM permissions WHERE code = 'role.definition.view')`,
      );
      const ta = await service(tx).get(scope, 'TOHFA_ADMIN');
      expect(ta.permissions.map((p) => p.code)).not.toContain('role.definition.view');
      expect((await caught(service(tx).get(scope, 'NOT_A_ROLE'))).status).toBe(404);
    });
  });
});
