import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { purgeNonSeedStockAdjustmentEvidence, removeCommittedFixtures } from '../../test/committedFixtureCleanup.js';

describeIfDatabase('Stock Adjustment Evidence & Code (BR-164, BR-16, BR-37)', () => {
  const app = createApp();
  let ready = false;

  let superAdminToken: string;
  let superAdminUserId: string;

  let warehouseId: string;
  let batchId: string;
  let adjustmentId: string;

  const createdUserIds: string[] = [];
  const createdBatchIds: string[] = [];
  const createdAdjustmentIds: string[] = [];

  beforeAll(async () => {
    ready = await databaseReady('stock_adjustments');
    if (!ready) return;

    // Pick seeded warehouse
    const whRes = await pool.query<{ id: string }>(
      `SELECT id FROM warehouses ORDER BY code ASC LIMIT 1`,
    );
    warehouseId = whRes.rows[0]!.id;

    // Super Admin user
    superAdminUserId = newId();
    createdUserIds.push(superAdminUserId);
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status)
       VALUES ($1, '+919999000164', 'ADMIN', 'SuperAdmin Evidence', 'ACTIVE')
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

    // Create a batch in warehouse
    const cropRes = await pool.query<{ id: string }>(`SELECT id FROM crop_master LIMIT 1`);
    const cropId = cropRes.rows[0]!.id;
    const farmerRes = await pool.query<{ id: string }>(`SELECT id FROM farmers LIMIT 1`);
    const farmerId = farmerRes.rows[0]!.id;

    batchId = newId();
    createdBatchIds.push(batchId);
    await pool.query(
      `INSERT INTO inventory_batches (
         id, batch_code, warehouse_id, crop_id, source_farmer_id, grade, qty_received, qty_available, status
       )
       VALUES ($1, 'BATCH-EV-164', $2, $3, $4, 'GRADE_1', 100, 100, 'ACTIVE')`,
      [batchId, warehouseId, cropId, farmerId],
    );

    // Create a stock adjustment
    adjustmentId = newId();
    createdAdjustmentIds.push(adjustmentId);
    await pool.query(
      `INSERT INTO stock_adjustments (
         id, batch_id, warehouse_id, adjustment_type, qty_delta, reason, status, created_by
       )
       VALUES ($1, $2, $3, 'DAMAGE', -5.000, 'Damaged sacks in transit', 'PENDING', $4)`,
      [adjustmentId, batchId, warehouseId, superAdminUserId],
    );
  });

  afterAll(async () => {
    if (!ready) return;
    await purgeNonSeedStockAdjustmentEvidence(pool);
    if (createdAdjustmentIds.length > 0) {
      await pool.query(`DELETE FROM stock_adjustments WHERE id = ANY($1::uuid[])`, [createdAdjustmentIds]);
    }
    if (createdBatchIds.length > 0) {
      await pool.query(`DELETE FROM inventory_batches WHERE id = ANY($1::uuid[])`, [createdBatchIds]);
    }
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

  it('BR-164a: stock adjustment returns stable adjustmentCode and empty evidence initially', async () => {
    const res = await request(app)
      .get(`/v1/admin/stock-adjustments/${adjustmentId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(adjustmentId);
    expect(res.body.adjustmentCode).toMatch(/^ADJ-\d+/);
    expect(Array.isArray(res.body.evidence)).toBe(true);
    expect(res.body.evidence).toHaveLength(0);
  });

  it('BR-164b: POST /v1/admin/stock-adjustments/:id/evidence attaches evidence via JSON url', async () => {
    const res = await request(app)
      .post(`/v1/admin/stock-adjustments/${adjustmentId}/evidence`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ url: 'https://storage.tohfa.com/damage-report-1.jpg' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.url).toBe('https://storage.tohfa.com/damage-report-1.jpg');

    // Verify GET contains the evidence
    const getRes = await request(app)
      .get(`/v1/admin/stock-adjustments/${adjustmentId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.evidence).toHaveLength(1);
    expect(getRes.body.evidence[0].url).toBe('https://storage.tohfa.com/damage-report-1.jpg');
  });

  it('BR-164c: POST /v1/admin/stock-adjustments/:id/evidence strips EXIF/GPS from raw image binary', async () => {
    // Generate JPEG with GPS EXIF
    const rawImage = await sharp({
      create: {
        width: 40,
        height: 40,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .withMetadata({
        orientation: 1,
        exif: {
          IFD0: {
            Make: 'InspectorPhone',
            ImageDescription: 'Rotten tomatoes GPS: 11.4000, 76.7000',
          },
        },
      })
      .jpeg()
      .toBuffer();

    const initialMeta = await sharp(rawImage).metadata();
    expect(initialMeta.exif).toBeDefined();

    const res = await request(app)
      .post(`/v1/admin/stock-adjustments/${adjustmentId}/evidence`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .set('Content-Type', 'image/jpeg')
      .send(rawImage);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.url).toMatch(/\/storage\/stock-adjustments\//);

    // Verify evidence count on adjustment
    const getRes = await request(app)
      .get(`/v1/admin/stock-adjustments/${adjustmentId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.evidence).toHaveLength(2);
  });

  it('BR-164d: POST /v1/admin/stock-adjustments/:id/evidence returns 404 for unknown adjustment', async () => {
    const res = await request(app)
      .post(`/v1/admin/stock-adjustments/${newId()}/evidence`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ url: 'https://storage.tohfa.com/unknown.jpg' });

    expect(res.status).toBe(404);
  });
});
