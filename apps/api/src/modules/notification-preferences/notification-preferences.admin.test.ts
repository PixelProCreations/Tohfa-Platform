import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { closePool, pool } from '../../db/pool.js';
import { describeIfDatabase } from '../../test/factories.js';
import { insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { notificationCategories } from './notification-preferences.schema.js';

/**
 * BR-82f-h: the admin Notification Settings categories.
 *
 * The categories are the toggles of the admin Notification Settings screen
 * (a master switch plus Operational, Order, Wallet & Payout and System
 * groups). They live behind their own permission so a farmer or customer can
 * neither read nor set them, and they are ADDITIVE: the five original
 * categories, their defaults and the farmer/customer endpoints are untouched.
 */

const ADMIN_ROLES = [
  RoleCode.SUPER_ADMIN,
  RoleCode.TOHFA_ADMIN,
  RoleCode.FARMER_ADMIN,
  RoleCode.MAIN_WH_ADMIN,
  RoleCode.SUB_WH_ADMIN,
] as const;

const EXPECTED_ADMIN_CATEGORIES = [
  'IN_APP_MASTER',
  'GOODS_RECEIVING',
  'INVENTORY_ALERTS',
  'WAREHOUSE_OPERATIONS',
  'TASK_ALERTS',
  'EXCEPTION_ALERTS',
  'ORDER_CONFIRMED',
  'ORDER_DISPATCHED',
  'ORDER_DELIVERED',
  'WALLET_CREDITED',
  'PAYOUT_RELEASED',
  'SYSTEM_MESSAGES',
  'MAINTENANCE_MESSAGES',
  'SECURITY_ALERTS',
];

const app = createApp();

function tokenFor(userId: string, role: RoleCode): string {
  return signAccessToken({ sub: userId, roles: [{ code: role }], farmerId: null, customerId: null });
}

interface Item {
  category: string;
  enabled: boolean;
}

describe('BR-82f: GET /v1/notification-preferences/admin requires authentication', () => {
  it('BR-82f: no token is 401', async () => {
    expect((await request(app).get('/v1/notification-preferences/admin')).status).toBe(401);
    const patch = await request(app).patch('/v1/notification-preferences/admin/GOODS_RECEIVING').send({ enabled: false });
    expect(patch.status).toBe(401);
  });
});

describeIfDatabase('BR-82f-h: admin notification categories (real database, real router)', () => {
  const admins = new Map<string, string>();

  async function adminToken(role: RoleCode): Promise<{ id: string; token: string }> {
    const id = await insertUser(pool, 'ADMIN', `BR-82 ${role}`);
    return { id, token: tokenFor(id, role) };
  }

  beforeAll(async () => {
    expect(await requireDatabaseTables('users', 'notification_preferences')).toBe(true);
  });

  afterAll(async () => {
    for (const id of admins.keys()) {
      await pool.query('DELETE FROM users WHERE id = $1', [id]);
    }
    await closePool();
  });

  it.each(ADMIN_ROLES)('BR-82f: %s sees the 14 admin categories, in order, all enabled by default', async (role) => {
    const { id, token } = await adminToken(role);
    admins.set(id, role);
    const res = await request(app).get('/v1/notification-preferences/admin').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const items = (res.body as { items: Item[] }).items;
    expect(items.map((i) => i.category)).toEqual(EXPECTED_ADMIN_CATEGORIES);
    expect(items.every((i) => i.enabled)).toBe(true);
  });

  it.each([
    [RoleCode.FARMER, 'FARMER'],
    [RoleCode.CUSTOMER, 'CUSTOMER'],
  ] as const)('BR-82g: %s can neither read nor set the admin categories (403) and nothing is stored', async (role, userType) => {
    const id = await insertUser(pool, userType, `BR-82 ${role}`);
    admins.set(id, role);
    const token = tokenFor(id, role);

    const get = await request(app).get('/v1/notification-preferences/admin').set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(403);
    const patch = await request(app)
      .patch('/v1/notification-preferences/admin/GOODS_RECEIVING')
      .set('Authorization', `Bearer ${token}`)
      .send({ enabled: false });
    expect(patch.status).toBe(403);
    const stored = await pool.query('SELECT 1 FROM notification_preferences WHERE user_id = $1', [id]);
    expect(stored.rowCount).toBe(0);
  });

  it('BR-82g: a farmer cannot set an admin category through the farmer endpoint either (422, nothing stored)', async () => {
    const id = await insertUser(pool, 'FARMER', 'BR-82 farmer');
    admins.set(id, 'FARMER');
    const res = await request(app)
      .patch('/v1/notification-preferences/GOODS_RECEIVING')
      .set('Authorization', `Bearer ${tokenFor(id, RoleCode.FARMER)}`)
      .send({ enabled: false });
    expect(res.status).toBe(422);
    const stored = await pool.query('SELECT 1 FROM notification_preferences WHERE user_id = $1', [id]);
    expect(stored.rowCount).toBe(0);
  });

  it('BR-82h: toggling an admin category persists for the caller only, and re-enabling restores it', async () => {
    const a = await adminToken(RoleCode.MAIN_WH_ADMIN);
    const b = await adminToken(RoleCode.MAIN_WH_ADMIN);
    admins.set(a.id, 'a');
    admins.set(b.id, 'b');

    const off = await request(app)
      .patch('/v1/notification-preferences/admin/INVENTORY_ALERTS')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ enabled: false });
    expect(off.status).toBe(200);
    expect(off.body).toEqual({ category: 'INVENTORY_ALERTS', enabled: false });

    const listA = await request(app).get('/v1/notification-preferences/admin').set('Authorization', `Bearer ${a.token}`);
    const listB = await request(app).get('/v1/notification-preferences/admin').set('Authorization', `Bearer ${b.token}`);
    expect((listA.body as { items: Item[] }).items.find((i) => i.category === 'INVENTORY_ALERTS')?.enabled).toBe(false);
    expect((listA.body as { items: Item[] }).items.filter((i) => !i.enabled)).toHaveLength(1);
    expect((listB.body as { items: Item[] }).items.every((i) => i.enabled)).toBe(true);

    const on = await request(app)
      .patch('/v1/notification-preferences/admin/INVENTORY_ALERTS')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ enabled: true });
    expect(on.body).toEqual({ category: 'INVENTORY_ALERTS', enabled: true });
  });

  it.each([
    ['an original category', 'WEATHER', { enabled: false }],
    ['an unknown category', 'NOPE', { enabled: false }],
    ['a non-boolean value', 'TASK_ALERTS', { enabled: 'no' }],
    ['an extra key', 'TASK_ALERTS', { enabled: false, userId: 'x' }],
    ['an empty body', 'TASK_ALERTS', {}],
  ])('BR-82h: %s is 422 on the admin endpoint', async (_label, category, body) => {
    const { id, token } = await adminToken(RoleCode.SUPER_ADMIN);
    admins.set(id, 'x');
    const res = await request(app)
      .patch(`/v1/notification-preferences/admin/${category}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(res.status).toBe(422);
  });

  it('BR-82h: the original five categories are unchanged (same set, same order, default on) and admin rows never leak into that list', async () => {
    expect([...notificationCategories]).toEqual(['WEATHER', 'FARM', 'MARKETING', 'PAYROLL', 'COMMUNITY']);

    const { id, token } = await adminToken(RoleCode.SUPER_ADMIN);
    admins.set(id, 'x');
    await request(app)
      .patch('/v1/notification-preferences/admin/SECURITY_ALERTS')
      .set('Authorization', `Bearer ${token}`)
      .send({ enabled: false });

    const res = await request(app).get('/v1/notification-preferences').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      items: [
        { category: 'WEATHER', enabled: true },
        { category: 'FARM', enabled: true },
        { category: 'MARKETING', enabled: true },
        { category: 'PAYROLL', enabled: true },
        { category: 'COMMUNITY', enabled: true },
      ],
    });
  });

  it('BR-82h: the database accepts every admin category and still rejects an unknown one', async () => {
    const id = await insertUser(pool, 'ADMIN', 'BR-82 check constraint');
    admins.set(id, 'x');
    for (const category of EXPECTED_ADMIN_CATEGORIES) {
      await pool.query('INSERT INTO notification_preferences (user_id, category, enabled) VALUES ($1, $2, false)', [id, category]);
    }
    await expect(
      pool.query("INSERT INTO notification_preferences (user_id, category, enabled) VALUES ($1, 'BOGUS', false)", [id]),
    ).rejects.toThrow(/notification_preferences_category_check/);
  });
});
