/**
 * Two layers of test, per the _example reference module:
 *
 *  1. SERVICE tests with a fake repo — where BR-48's preference semantics
 *     (sparse table, missing row = enabled, own-user only) are asserted.
 *  2. ONE integration test against a real pool that proves the SQL parses and
 *     the columns match db/migrations/0027. Soft-skips without a database.
 *
 * The dispatcher half of BR-48 (a disabled category creates no IN_APP / PUSH /
 * SMS row) is asserted in notifications.test.ts, next to handleDomainEvent.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import type { Executor } from '../../db/pool.js';
import { IDS, aScope, databaseReady, describeIfDatabase } from '../../test/factories.js';
import { createNotificationPreferencesService } from './notification-preferences.service.js';
import type { NotificationPreferencesRepo } from './notification-preferences.repo.js';
import {
  notificationCategories,
  type NotificationCategory,
} from './notification-preferences.schema.js';

interface FakeRepo extends NotificationPreferencesRepo {
  /** `${userId}:${category}` -> enabled */
  store: Map<string, boolean>;
}

function fakeRepo(): FakeRepo {
  const store = new Map<string, boolean>();
  const key = (userId: string, category: NotificationCategory) => `${userId}:${category}`;
  return {
    store,
    async listByUserId(_db, userId) {
      return notificationCategories
        .filter((category) => store.has(key(userId, category)))
        .map((category) => ({ category, enabled: store.get(key(userId, category))! }));
    },
    async upsert(_db, userId, category, enabled) {
      store.set(key(userId, category), enabled);
      return { category, enabled };
    },
    async isCategoryEnabled(_db, userId, category) {
      return store.get(key(userId, category)) ?? true;
    },
  };
}

const noopDb: Executor = {
  query: async () => {
    throw new Error('the fake repo should never reach the database');
  },
};

const farmerScope = () => aScope({ userId: IDS.userFarmer });

describe('notificationPreferencesService.listMine', () => {
  it('returns all five categories, enabled, for a user with no stored rows', async () => {
    const service = createNotificationPreferencesService({ repo: fakeRepo(), db: noopDb });

    const result = await service.listMine(farmerScope());

    expect(result.items).toEqual([
      { category: 'WEATHER', enabled: true },
      { category: 'FARM', enabled: true },
      { category: 'MARKETING', enabled: true },
      { category: 'PAYROLL', enabled: true },
      { category: 'COMMUNITY', enabled: true },
    ]);
  });

  it('overlays stored rows onto the all-enabled default, keeping the fixed order', async () => {
    const repo = fakeRepo();
    repo.store.set(`${IDS.userFarmer}:COMMUNITY`, false);
    repo.store.set(`${IDS.userFarmer}:WEATHER`, false);
    const service = createNotificationPreferencesService({ repo, db: noopDb });

    const result = await service.listMine(farmerScope());

    expect(result.items.map((p) => p.category)).toEqual([...notificationCategories]);
    expect(result.items.find((p) => p.category === 'COMMUNITY')?.enabled).toBe(false);
    expect(result.items.find((p) => p.category === 'WEATHER')?.enabled).toBe(false);
    expect(result.items.find((p) => p.category === 'MARKETING')?.enabled).toBe(true);
  });

  it("never reads another user's rows (own-data only, BR-36)", async () => {
    const repo = fakeRepo();
    repo.store.set(`${IDS.customer}:MARKETING`, false);
    const service = createNotificationPreferencesService({ repo, db: noopDb });

    const result = await service.listMine(farmerScope());

    expect(result.items.every((p) => p.enabled)).toBe(true);
  });
});

describe('notificationPreferencesService.updateMine', () => {
  it('BR-48: disabling a category is persisted for the caller and reported by the dispatcher lookup', async () => {
    const repo = fakeRepo();
    const service = createNotificationPreferencesService({ repo, db: noopDb });

    const updated = await service.updateMine(farmerScope(), 'MARKETING', false);

    expect(updated).toEqual({ category: 'MARKETING', enabled: false });
    // The dispatcher (notifications.service.ts) consults isCategoryEnabled —
    // it must now see MARKETING as off for this user, and only this user.
    expect(await repo.isCategoryEnabled(noopDb, IDS.userFarmer, 'MARKETING')).toBe(false);
    expect(await repo.isCategoryEnabled(noopDb, IDS.customer, 'MARKETING')).toBe(true);
    expect(await repo.isCategoryEnabled(noopDb, IDS.userFarmer, 'PAYROLL')).toBe(true);

    const listed = await service.listMine(farmerScope());
    expect(listed.items.find((p) => p.category === 'MARKETING')?.enabled).toBe(false);
  });

  it('re-enabling a category flips it back on', async () => {
    const repo = fakeRepo();
    const service = createNotificationPreferencesService({ repo, db: noopDb });

    await service.updateMine(farmerScope(), 'PAYROLL', false);
    const updated = await service.updateMine(farmerScope(), 'PAYROLL', true);

    expect(updated).toEqual({ category: 'PAYROLL', enabled: true });
    expect(await repo.isCategoryEnabled(noopDb, IDS.userFarmer, 'PAYROLL')).toBe(true);
  });
});

describe('HTTP Route Integration', () => {
  const app = createApp();

  it('GET /v1/notification-preferences requires authentication', async () => {
    const res = await request(app).get('/v1/notification-preferences');
    expect(res.status).toBe(401);
  });

  it('PATCH /v1/notification-preferences/:category requires authentication', async () => {
    const res = await request(app)
      .patch('/v1/notification-preferences/MARKETING')
      .send({ enabled: false });
    expect(res.status).toBe(401);
  });
});

describeIfDatabase('notificationPreferencesService (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('notification_preferences');
    if (!ready) {
      console.warn(
        '[skip] no reachable `notification_preferences` table — run `docker compose up -d && pnpm db:migrate`',
      );
    }
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  it('runs the real list query against Postgres', async () => {
    if (!ready) return;

    const { pool } = await import('../../db/pool.js');
    const service = createNotificationPreferencesService({ db: pool });

    // A random user id has no rows, so the result is the synthesised default.
    const result = await service.listMine(aScope({ userId: '00000000-0000-4000-8000-0000000000ff' }));

    expect(result.items).toHaveLength(5);
    expect(result.items.every((p) => p.enabled)).toBe(true);
  });

  it('upserts and reads back a preference with the real SQL (rolled back)', async () => {
    if (!ready) return;

    const { pool } = await import('../../db/pool.js');
    const { notificationPreferencesRepo } = await import('./notification-preferences.repo.js');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const user = await client.query<{ id: string }>('SELECT id FROM users LIMIT 1');
      const userId = user.rows[0]?.id;
      if (userId === undefined) return;

      await notificationPreferencesRepo.upsert(client, userId, 'COMMUNITY', false);
      expect(await notificationPreferencesRepo.isCategoryEnabled(client, userId, 'COMMUNITY')).toBe(false);

      // Second write on the same (user, category) hits ON CONFLICT, not a duplicate row.
      await notificationPreferencesRepo.upsert(client, userId, 'COMMUNITY', true);
      const rows = await notificationPreferencesRepo.listByUserId(client, userId);
      expect(rows.filter((p) => p.category === 'COMMUNITY')).toEqual([
        { category: 'COMMUNITY', enabled: true },
      ]);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
