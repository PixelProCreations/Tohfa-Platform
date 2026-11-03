/**
 * BR-135, database half: migration 0082's triggers on `user_roles` and `farmers`. Every test runs in
 * its own transaction that is always rolled back. Skipped (visibly) when no database is configured;
 * CI runs it after migrate + seed.
 */
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../db/pool.js';
import { insertUser, requireDatabaseTables } from '../test/dbFixtures.js';
import { describeIfDatabase, newId } from '../test/factories.js';
import { loadRbac } from './loadRbac.js';
import { endUserRoleCodes, singleRoleAdminCodes } from './roleExclusivity.js';

const SINGLE_ROLE_ADMINS = [RoleCode.SUPER_ADMIN, RoleCode.TOHFA_ADMIN, RoleCode.MAIN_WH_ADMIN, RoleCode.SUB_WH_ADMIN];
const END_USER_ROLES = [RoleCode.FARMER, RoleCode.CUSTOMER];

describeIfDatabase('BR-135: role exclusivity triggers (migration 0082)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await requireDatabaseTables('user_roles', 'farmers', 'roles', 'warehouses');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../db/pool.js');
    await closePool();
  });

  /** Runs `fn` inside a transaction that is always rolled back. */
  async function inRollback(fn: (tx: pg.PoolClient) => Promise<void>): Promise<void> {
    const { pool } = await import('../db/pool.js');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  async function aWarehouse(tx: Executor): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO warehouses (id, code, name) VALUES ($1, $2, 'BR-135 Warehouse')`, [id, `WH-135-${id.slice(0, 8)}`]);
    return id;
  }

  /** Inserts by role_id only, as farmer approval does; role_code is filled by the scope trigger. */
  async function grant(tx: Executor, userId: string, code: string, opts: { validTo?: string } = {}): Promise<void> {
    const warehouseId = code === RoleCode.SUB_WH_ADMIN ? await aWarehouse(tx) : null;
    await tx.query(
      `INSERT INTO user_roles (user_id, role_id, role_code, warehouse_id, valid_from, valid_to)
       SELECT $1, r.id, r.code, $3, now() - interval '2 days', $4::timestamptz FROM roles r WHERE r.code = $2`,
      [userId, code, warehouseId, opts.validTo ?? null],
    );
  }

  async function makeFarmer(tx: Executor, userId: string, deleted = false): Promise<string> {
    const id = newId();
    await tx.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, deleted_at) VALUES ($1, $2, $3, $4::timestamptz)`,
      [id, userId, `TOHFA-135-${id.slice(0, 8)}`, deleted ? new Date().toISOString() : null],
    );
    return id;
  }

  async function expectBr135(promise: Promise<unknown>): Promise<void> {
    await expect(promise).rejects.toMatchObject({ code: '23514', message: expect.stringContaining('BR-135') });
  }

  /** Runs `fn` under a savepoint and rolls back to it, so one transaction can try several refusals. */
  async function attempt(tx: Executor, fn: () => Promise<unknown>): Promise<void> {
    await tx.query('SAVEPOINT br135');
    try {
      await expectBr135(fn());
    } finally {
      await tx.query('ROLLBACK TO SAVEPOINT br135');
    }
  }

  it('BR-135: the SQL role lists match docs/rbac.json', async (ctx) => {
    if (!ready) return ctx.skip();
    const { pool } = await import('../db/pool.js');
    const codes = loadRbac().document.roles.map((role) => role.code);
    const res = await pool.query<{ code: string; kind: string | null }>(
      `SELECT c AS code, app_br135_role_kind(c) AS kind FROM unnest($1::text[]) AS c`,
      [codes],
    );
    const ofKind = (kind: string) => res.rows.filter((row) => row.kind === kind).map((row) => row.code).sort();
    expect(ofKind('SINGLE_ROLE_ADMIN')).toEqual([...singleRoleAdminCodes()].sort());
    expect(ofKind('END_USER')).toEqual([...endUserRoleCodes()].sort());
  });

  describe('user_roles', () => {
    for (const admin of SINGLE_ROLE_ADMINS) {
      it(`BR-135: refuses FARMER or CUSTOMER for a ${admin}, and ${admin} for a FARMER, a CUSTOMER or a farmers row`, async (ctx) => {
        if (!ready) return ctx.skip();
        await inRollback(async (tx) => {
          const adminUser = await insertUser(tx, 'ADMIN');
          await grant(tx, adminUser, admin);
          for (const endUser of END_USER_ROLES) {
            await attempt(tx, () => grant(tx, adminUser, endUser));
          }

          for (const endUser of END_USER_ROLES) {
            const user = await insertUser(tx, endUser === RoleCode.FARMER ? 'FARMER' : 'CUSTOMER');
            await grant(tx, user, endUser);
            await attempt(tx, () => grant(tx, user, admin));
          }

          const farmerOnly = await insertUser(tx, 'FARMER');
          await makeFarmer(tx, farmerOnly);
          await attempt(tx, () => grant(tx, farmerOnly, admin));
        });
      });
    }

    it('BR-135: allows FARMER_ADMIN + FARMER (with a farmers row), in either order', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (tx) => {
        const a = await insertUser(tx, 'ADMIN');
        await grant(tx, a, RoleCode.FARMER_ADMIN);
        await grant(tx, a, RoleCode.FARMER);
        await makeFarmer(tx, a);

        const b = await insertUser(tx, 'FARMER');
        await grant(tx, b, RoleCode.FARMER);
        await makeFarmer(tx, b);
        await grant(tx, b, RoleCode.FARMER_ADMIN);
      });
    });

    it('BR-135: does not restrict admin + admin (open contradiction 33)', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (tx) => {
        const user = await insertUser(tx, 'ADMIN');
        await grant(tx, user, RoleCode.FARMER_ADMIN);
        await grant(tx, user, RoleCode.TOHFA_ADMIN);
        await grant(tx, user, RoleCode.MAIN_WH_ADMIN);
      });
    });

    it('BR-135: ignores ended roles and soft-deleted farmers rows', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (tx) => {
        const user = await insertUser(tx, 'ADMIN');
        await grant(tx, user, RoleCode.FARMER, { validTo: new Date(Date.now() - 60_000).toISOString() });
        await makeFarmer(tx, user, true);
        await grant(tx, user, RoleCode.SUB_WH_ADMIN);
      });
    });

    it('BR-135: a repeated insert of a role already held is not a new grant (old dual-role rows are not re-validated)', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (tx) => {
        const user = await insertUser(tx, 'ADMIN');
        await grant(tx, user, RoleCode.SUPER_ADMIN);
        // A pre-0082 dual-role row, written with the trigger disabled for this transaction only.
        await tx.query('ALTER TABLE user_roles DISABLE TRIGGER trg_user_roles_br135_guard');
        await grant(tx, user, RoleCode.FARMER);
        await tx.query('ALTER TABLE user_roles ENABLE TRIGGER trg_user_roles_br135_guard');
        // Re-running a seed that inserts SUPER_ADMIN again with ON CONFLICT DO NOTHING still works.
        await tx.query(
          `INSERT INTO user_roles (user_id, role_id, role_code)
           SELECT $1, r.id, r.code FROM roles r WHERE r.code = 'SUPER_ADMIN'
           ON CONFLICT DO NOTHING`,
          [user],
        );
      });
    });
  });

  describe('farmers', () => {
    for (const admin of SINGLE_ROLE_ADMINS) {
      it(`BR-135: refuses a farmers row for a ${admin}, and restoring a soft-deleted one`, async (ctx) => {
        if (!ready) return ctx.skip();
        await inRollback(async (tx) => {
          const user = await insertUser(tx, 'ADMIN');
          await grant(tx, user, admin);
          await attempt(tx, () => makeFarmer(tx, user));

          // A soft-deleted row is allowed (it is no farmer) but may not be restored.
          const farmerId = await makeFarmer(tx, user, true);
          await attempt(tx, () => tx.query(`UPDATE farmers SET deleted_at = NULL WHERE id = $1`, [farmerId]));
        });
      });
    }

    it('BR-135: allows a farmers row for a FARMER_ADMIN and for a user with no admin role', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (tx) => {
        const farmerAdmin = await insertUser(tx, 'ADMIN');
        await grant(tx, farmerAdmin, RoleCode.FARMER_ADMIN);
        await makeFarmer(tx, farmerAdmin);

        const plain = await insertUser(tx, 'FARMER');
        const farmerId = await makeFarmer(tx, plain, true);
        await tx.query(`UPDATE farmers SET deleted_at = NULL WHERE id = $1`, [farmerId]);
      });
    });

    it('BR-135: updating other columns of a pre-0082 dual-role farmer is not checked', async (ctx) => {
      if (!ready) return ctx.skip();
      await inRollback(async (tx) => {
        const user = await insertUser(tx, 'ADMIN');
        const farmerId = await makeFarmer(tx, user);
        // A pre-0082 dual-role row, written with the trigger disabled for this transaction only.
        await tx.query('ALTER TABLE user_roles DISABLE TRIGGER trg_user_roles_br135_guard');
        await grant(tx, user, RoleCode.MAIN_WH_ADMIN);
        await tx.query('ALTER TABLE user_roles ENABLE TRIGGER trg_user_roles_br135_guard');
        await tx.query(`UPDATE farmers SET village = 'Ithalar' WHERE id = $1`, [farmerId]);
      });
    });
  });
});
