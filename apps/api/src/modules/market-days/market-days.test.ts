import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { purgeNonSeedMarketDays, removeCommittedFixtures } from '../../test/committedFixtureCleanup.js';

describeIfDatabase('Market Days Schedule CRUD (BR-162)', () => {
  const app = createApp();
  let ready = false;

  let superAdminToken: string;
  let superAdminUserId: string;

  let subWhAdminToken: string;
  let subWhAdminUserId: string;

  let warehouseId: string;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    ready = await databaseReady('market_days');
    if (!ready) return;

    // Fetch a seeded warehouse
    const whRes = await pool.query<{ id: string }>(
      `SELECT id FROM warehouses ORDER BY code ASC LIMIT 1`,
    );
    warehouseId = whRes.rows[0]!.id;

    // Super Admin user
    superAdminUserId = newId();
    createdUserIds.push(superAdminUserId);
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status)
       VALUES ($1, '+919999000162', 'ADMIN', 'SuperAdmin MarketDays', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [superAdminUserId],
    );
    await pool.query(
      `INSERT INTO user_roles (id, user_id, role_id, role_code)
       SELECT $1, $2, r.id, r.code FROM roles r WHERE r.code = 'SUPER_ADMIN'`,
      [newId(), superAdminUserId],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // Sub-warehouse Admin user (does NOT have market.schedule.manage)
    subWhAdminUserId = newId();
    createdUserIds.push(subWhAdminUserId);
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status)
       VALUES ($1, '+919999001162', 'ADMIN', 'SubWH Admin MarketDays', 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [subWhAdminUserId],
    );
    await pool.query(
      `INSERT INTO user_roles (id, user_id, role_id, role_code, warehouse_id)
       SELECT $1, $2, r.id, r.code, $3 FROM roles r WHERE r.code = 'SUB_WH_ADMIN'`,
      [newId(), subWhAdminUserId, warehouseId],
    );
    subWhAdminToken = signAccessToken({
      sub: subWhAdminUserId,
      roles: [{ code: 'SUB_WH_ADMIN', warehouseId }],
      customerId: null,
      farmerId: null,
    });
  });

  afterAll(async () => {
    if (!ready) return;
    await purgeNonSeedMarketDays(pool);
    await removeCommittedFixtures(
      async (fn) => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const res = await fn(client);
          await client.query('COMMIT');
          return res;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      },
      {
        userIds: createdUserIds,
      },
    );
  });

  let createdMarketDayId: string;

  it('BR-162a: POST /v1/admin/market-days creates a new market day schedule', async () => {
    const res = await request(app)
      .post('/v1/admin/market-days')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        warehouseId,
        marketDate: '2026-07-15',
        startTime: '08:00',
        endTime: '14:00',
        isActive: true,
        notes: 'Special summer organic market',
      });

    expect(res.status).toBe(201);
    createdMarketDayId = res.body.id;
    expect(res.body).toHaveProperty('id');
    expect(res.body.warehouseId).toBe(warehouseId);
    expect(res.body.marketDate).toBe('2026-07-15');
    expect(res.body.startTime).toBe('08:00');
    expect(res.body.endTime).toBe('14:00');
    expect(res.body.isActive).toBe(true);
    expect(res.body.notes).toBe('Special summer organic market');
    expect(res.body.warehouseName).toBeDefined();
  });

  it('BR-162b: POST /v1/admin/market-days rejects invalid time range (start >= end)', async () => {
    const res = await request(app)
      .post('/v1/admin/market-days')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        warehouseId,
        marketDate: '2026-07-16',
        startTime: '16:00',
        endTime: '14:00',
        isActive: true,
      });

    expect(res.status).toBe(422);
  });

  it('BR-162c: POST /v1/admin/market-days enforces RBAC (403 for unauthorized role)', async () => {
    const res = await request(app)
      .post('/v1/admin/market-days')
      .set('Authorization', `Bearer ${subWhAdminToken}`)
      .send({
        warehouseId,
        marketDate: '2026-07-17',
        startTime: '09:00',
        endTime: '17:00',
      });

    expect(res.status).toBe(403);
  });

  it('BR-162d: PATCH /v1/admin/market-days/:id updates market day details', async () => {
    const res = await request(app)
      .patch(`/v1/admin/market-days/${createdMarketDayId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        startTime: '09:00',
        endTime: '15:00',
        isActive: false,
        notes: 'Postponed closing',
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdMarketDayId);
    expect(res.body.startTime).toBe('09:00');
    expect(res.body.endTime).toBe('15:00');
    expect(res.body.isActive).toBe(false);
    expect(res.body.notes).toBe('Postponed closing');
  });

  it('BR-162e: PATCH /v1/admin/market-days/:id returns 404 for non-existent id', async () => {
    const res = await request(app)
      .patch(`/v1/admin/market-days/${newId()}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        isActive: true,
      });

    expect(res.status).toBe(404);
  });

  it('BR-162f: GET /v1/admin/market-days lists market days with filtering', async () => {
    // 1. Unfiltered
    const resAll = await request(app)
      .get('/v1/admin/market-days')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resAll.status).toBe(200);
    expect(Array.isArray(resAll.body)).toBe(true);
    expect(resAll.body.some((m: any) => m.id === createdMarketDayId)).toBe(true);

    // 2. Filter by warehouseId
    const resWh = await request(app)
      .get(`/v1/admin/market-days?warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resWh.status).toBe(200);
    expect(resWh.body.every((m: any) => m.warehouseId === warehouseId)).toBe(true);

    // 3. Filter by date window
    const resDateMatch = await request(app)
      .get(`/v1/admin/market-days?from=2026-07-01&to=2026-07-31`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resDateMatch.status).toBe(200);
    expect(resDateMatch.body.some((m: any) => m.id === createdMarketDayId)).toBe(true);

    const resDateMiss = await request(app)
      .get(`/v1/admin/market-days?from=2026-08-01&to=2026-08-31`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resDateMiss.status).toBe(200);
    expect(resDateMiss.body.some((m: any) => m.id === createdMarketDayId)).toBe(false);
  });
});
