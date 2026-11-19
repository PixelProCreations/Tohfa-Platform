import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase } from '../../test/factories.js';

describeIfDatabase('BR-166: Per-warehouse & per-produce allocation config', () => {
  const app = createApp();
  let ready = false;

  const superAdminToken = signAccessToken({
    sub: '00000000-0000-0000-0000-000000000001',
    roles: [{ code: 'SUPER_ADMIN' }],
    customerId: null,
    farmerId: null,
  });

  const tohfaAdminToken = signAccessToken({
    sub: '00000000-0000-0000-0000-000000000002',
    roles: [{ code: 'TOHFA_ADMIN' }],
    customerId: null,
    farmerId: null,
  });

  let warehouseId: string;
  let cropId: string;

  beforeAll(async () => {
    ready = await databaseReady('allocation_config');
    if (!ready) return;

    const whRes = await pool.query<{ id: string }>('SELECT id FROM warehouses ORDER BY code ASC LIMIT 1');
    warehouseId = whRes.rows[0]!.id;

    const cropRes = await pool.query<{ id: string }>('SELECT id FROM crop_master LIMIT 1');
    cropId = cropRes.rows[0]!.id;
  });

  afterAll(async () => {
    if (!ready) return;
    await pool.query(
      `DELETE FROM allocation_config WHERE effective_from = '2026-10-01'`,
    );
  });

  it('BR-166a: sets and retrieves per-warehouse allocation config', async () => {
    // 1. PATCH per-warehouse allocation
    const patchRes = await request(app)
      .patch('/v1/admin/allocation-config')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        effectiveFrom: '2026-10-01',
        warehouseId,
        channels: [
          { channel: 'ONLINE', percentage: 60 },
          { channel: 'LIVE_MARKET', percentage: 20 },
          { channel: 'RESERVE', percentage: 10 },
          { channel: 'BUFFER', percentage: 10 },
        ],
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.warehouseId).toBe(warehouseId);
    expect(patchRes.body.channels).toEqual([
      { channel: 'ONLINE', percentage: 60 },
      { channel: 'LIVE_MARKET', percentage: 20 },
      { channel: 'RESERVE', percentage: 10 },
      { channel: 'BUFFER', percentage: 10 },
    ]);

    // 2. GET per-warehouse allocation
    const getRes = await request(app)
      .get(`/v1/admin/allocation-config?warehouseId=${warehouseId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.warehouseId).toBe(warehouseId);
    expect(getRes.body.channels).toEqual([
      { channel: 'ONLINE', percentage: 60 },
      { channel: 'LIVE_MARKET', percentage: 20 },
      { channel: 'RESERVE', percentage: 10 },
      { channel: 'BUFFER', percentage: 10 },
    ]);
  });

  it('BR-166b: sets per-produce override with cropId and grade', async () => {
    const patchRes = await request(app)
      .patch('/v1/admin/allocation-config')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        effectiveFrom: '2026-10-01',
        cropId,
        grade: 'GRADE_1',
        channels: [
          { channel: 'ONLINE', percentage: 80 },
          { channel: 'LIVE_MARKET', percentage: 10 },
          { channel: 'RESERVE', percentage: 5 },
          { channel: 'BUFFER', percentage: 5 },
        ],
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.cropId).toBe(cropId);
    expect(patchRes.body.grade).toBe('GRADE_1');

    const getRes = await request(app)
      .get(`/v1/admin/allocation-config?cropId=${cropId}&grade=GRADE_1`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.cropId).toBe(cropId);
    expect(getRes.body.grade).toBe('GRADE_1');
    expect(getRes.body.channels).toEqual([
      { channel: 'ONLINE', percentage: 80 },
      { channel: 'LIVE_MARKET', percentage: 10 },
      { channel: 'RESERVE', percentage: 5 },
      { channel: 'BUFFER', percentage: 5 },
    ]);
  });

  it('BR-166c: rejects allocation config update by TOHFA_ADMIN (Super Admin only)', async () => {
    const patchRes = await request(app)
      .patch('/v1/admin/allocation-config')
      .set('Authorization', `Bearer ${tohfaAdminToken}`)
      .send({
        effectiveFrom: '2026-10-01',
        channels: [
          { channel: 'ONLINE', percentage: 70 },
          { channel: 'LIVE_MARKET', percentage: 10 },
          { channel: 'RESERVE', percentage: 10 },
          { channel: 'BUFFER', percentage: 10 },
        ],
      });

    expect(patchRes.status).toBe(403);
  });
});
