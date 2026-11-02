/**
 * BR-132 (owner request 2026-10-27, "Group D" D6b): the admin warehouse payload (GET /warehouses and
 * GET /warehouses/{id}) carries `staffCount`, the number of DISTINCT live admin users bound to the
 * warehouse (UNCONFIRMED definition):
 *   - a `user_roles` row with `warehouse_id` = the warehouse (only SUB_WH_ADMIN and MAIN_WH_ADMIN can
 *     carry one: user_roles_warehouse_only_for_wh_roles_chk), live now: valid_from <= now() and
 *     valid_to null or in the future (the LIVE_ROLE reading of admin-accounts / admin-promotions);
 *   - its user ACTIVE and not soft-deleted;
 *   - a user with two live bindings on the same warehouse counts once.
 * One aggregate join in the same query, never a per-row lookup. Every warehouse route is admin-only
 * (rbac: FARMER and CUSTOMER hold `none`), so no customer response gains it.
 *
 * Real SQL in rolled-back transactions on a fresh fixture warehouse.
 */
import type { Server } from 'node:http';
import { afterAll, beforeAll, expect, it } from 'vitest';
import type pg from 'pg';
import request from 'supertest';
import { RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { createWarehousesService } from './warehouses.service.js';

/** The documented Warehouse keys (openapi `Warehouse`), now with staffCount. */
const WAREHOUSE_KEYS = [
  'address', 'capacityKg', 'city', 'code', 'contactPhone', 'createdAt', 'id', 'isActive', 'isMarketDayVenue', 'latitude',
  'longitude', 'marketDayOfWeek', 'name', 'operatingHours', 'pincode', 'staffCount', 'type',
].sort();

// The pool is closed ONCE, after every describe in this file.
afterAll(async () => {
  if (process.env['DATABASE_URL'] === undefined) return;
  const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
  await Promise.allSettled([closePool(), closeRedis()]);
});

describeIfDatabase('warehouse staffCount (PostgreSQL, rolled back) — BR-132', () => {
  let ready = false;
  let pool: pg.Pool;

  beforeAll(async () => {
    ready = await databaseReady('user_roles');
    if (!ready) return;
    ({ pool } = await import('../../db/pool.js'));
  });

  async function inRollback(fn: (tx: pg.PoolClient) => Promise<void>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  async function warehouse(tx: Executor, label: string): Promise<{ id: string; code: string }> {
    const id = newId();
    const code = `WH-T132-${id.slice(0, 8)}`;
    await tx.query(`INSERT INTO warehouses (id, code, name, type) VALUES ($1, $2, $3, 'SUB')`, [id, code, `BR-132 ${label}`]);
    return { id, code };
  }

  async function admin(tx: Executor, opts: { status?: 'ACTIVE' | 'DISABLED' | 'PENDING'; deleted?: boolean } = {}): Promise<string> {
    const { insertUser } = await import('../../test/dbFixtures.js');
    const id = await insertUser(tx, 'ADMIN', 'BR-132 staff');
    if (opts.status !== undefined && opts.status !== 'ACTIVE') await tx.query(`UPDATE users SET status = $2 WHERE id = $1`, [id, opts.status]);
    if (opts.deleted === true) await tx.query(`UPDATE users SET deleted_at = now() WHERE id = $1`, [id]);
    return id;
  }

  async function bind(tx: Executor, userId: string, role: 'SUB_WH_ADMIN' | 'MAIN_WH_ADMIN', warehouseId: string, window: { from?: string; to?: string } = {}): Promise<void> {
    await tx.query(
      `INSERT INTO user_roles (user_id, role_id, role_code, warehouse_id, valid_from, valid_to)
       SELECT $1, r.id, r.code, $2, COALESCE($3::timestamptz, now()), $4::timestamptz FROM roles r WHERE r.code = $5`,
      [userId, warehouseId, window.from ?? null, window.to ?? null, role],
    );
  }

  it('BR-132a: counts distinct ACTIVE, undeleted users with a live warehouse binding; ended, future, disabled, pending, deleted and other-warehouse bindings are not counted', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRollback(async (tx) => {
      const target = await warehouse(tx, 'target');
      const other = await warehouse(tx, 'other');
      const empty = await warehouse(tx, 'empty');
      // Counted: a Sub admin, a Main admin bound to the warehouse, and one user bound twice (counted once).
      await bind(tx, await admin(tx), 'SUB_WH_ADMIN', target.id);
      await bind(tx, await admin(tx), 'MAIN_WH_ADMIN', target.id);
      const twice = await admin(tx);
      await bind(tx, twice, 'SUB_WH_ADMIN', target.id);
      await bind(tx, twice, 'MAIN_WH_ADMIN', target.id);
      // A binding ending in the future is still live.
      await bind(tx, await admin(tx), 'SUB_WH_ADMIN', target.id, { from: '2020-01-01T00:00:00Z', to: '2999-01-01T00:00:00Z' });
      // Not counted.
      await bind(tx, await admin(tx), 'SUB_WH_ADMIN', target.id, { from: '2020-01-01T00:00:00Z', to: '2020-06-01T00:00:00Z' });
      await bind(tx, await admin(tx), 'SUB_WH_ADMIN', target.id, { from: '2999-01-01T00:00:00Z' });
      await bind(tx, await admin(tx, { status: 'DISABLED' }), 'SUB_WH_ADMIN', target.id);
      await bind(tx, await admin(tx, { status: 'PENDING' }), 'SUB_WH_ADMIN', target.id);
      await bind(tx, await admin(tx, { deleted: true }), 'SUB_WH_ADMIN', target.id);
      await bind(tx, await admin(tx), 'SUB_WH_ADMIN', other.id);

      const service = createWarehousesService({ db: tx, transaction: (fn) => fn(tx) });
      expect((await service.getById(aScope({ permission: 'warehouse.own.view' }), target.id)).staffCount).toBe(4);
      expect((await service.getById(aScope({ permission: 'warehouse.own.view' }), other.id)).staffCount).toBe(1);
      expect((await service.getById(aScope({ permission: 'warehouse.own.view' }), empty.id)).staffCount).toBe(0);

      // The list carries the same figure, from one aggregate join (no row is repeated by it).
      const listed = await service.list(aScope(), { q: 'WH-T132-', page: 1, pageSize: 100 });
      const byId = new Map(listed.items.map((w) => [w.id, w]));
      expect(listed.items.filter((w) => w.id === target.id)).toHaveLength(1);
      expect(byId.get(target.id)?.staffCount).toBe(4);
      expect(byId.get(other.id)?.staffCount).toBe(1);
      expect(byId.get(empty.id)?.staffCount).toBe(0);
      for (const item of listed.items) expect(Object.keys(item).sort()).toEqual(WAREHOUSE_KEYS);
    });
  });
});

describeIfDatabase('warehouse staffCount through the real router — BR-132', () => {
  let ready = false;
  let server: Server;
  const tokens: Record<string, string> = {};
  let ootyId = '';

  beforeAll(async () => {
    ready = await databaseReady('user_roles');
    if (!ready) return;
    const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
      import('../../app.js'),
      import('../../auth/jwt.js'),
      import('../../db/pool.js'),
    ]);
    ootyId = (await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE code = 'WH-OOTY'`)).rows[0]!.id;
    const sign = (code: RoleCode, extra: { warehouseId?: string } = {}, ids: { customerId?: string } = {}): string =>
      signAccessToken({ sub: IDS.userSuperAdmin, roles: [{ code, ...extra }], farmerId: null, customerId: ids.customerId ?? null });
    tokens['main'] = sign(RoleCode.MAIN_WH_ADMIN);
    tokens['sub'] = sign(RoleCode.SUB_WH_ADMIN, { warehouseId: ootyId });
    tokens['customer'] = sign(RoleCode.CUSTOMER, {}, { customerId: IDS.customer });
    server = createApp().listen(0);
  }, 60_000);

  afterAll(async () => {
    if (server !== undefined) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('BR-132b: the list and the detail carry staffCount as the live count; a customer still cannot read any warehouse payload', async (ctx) => {
    if (!ready) return ctx.skip();
    const { pool } = await import('../../db/pool.js');
    const expected = await pool.query<{ n: number }>(
      `SELECT count(DISTINCT ur.user_id)::int AS n
         FROM user_roles ur JOIN users u ON u.id = ur.user_id
        WHERE ur.warehouse_id = $1 AND ur.valid_from <= now() AND (ur.valid_to IS NULL OR ur.valid_to > now())
          AND u.status = 'ACTIVE' AND u.deleted_at IS NULL`,
      [ootyId],
    );
    const detail = await request(server).get(`/v1/warehouses/${ootyId}`).set('Authorization', `Bearer ${tokens['sub']!}`);
    expect(detail.status).toBe(200);
    expect(Object.keys(detail.body).sort()).toEqual(WAREHOUSE_KEYS);
    expect(detail.body.staffCount).toBe(expected.rows[0]!.n);

    const list = await request(server).get('/v1/warehouses?pageSize=100').set('Authorization', `Bearer ${tokens['main']!}`);
    expect(list.status).toBe(200);
    const ooty = (list.body.items as Array<{ id: string; staffCount: unknown }>).find((w) => w.id === ootyId);
    expect(ooty?.staffCount).toBe(expected.rows[0]!.n);

    expect((await request(server).get(`/v1/warehouses/${ootyId}`).set('Authorization', `Bearer ${tokens['customer']!}`)).status).toBe(403);
    expect((await request(server).get('/v1/warehouses').set('Authorization', `Bearer ${tokens['customer']!}`)).status).toBe(403);
  });
});
