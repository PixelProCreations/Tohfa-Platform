import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

describeIfDatabase('POST /admin/listings/:id/approve (BR-29)', () => {
  const app = createApp();
  let ready = false;

  let warehouseId: string;
  let zoneId: string;
  let cropId: string;

  let farmerAdminUserId: string;
  let farmerAdminFarmerId: string;
  let farmerAdminToken: string;

  let otherFarmerUserId: string;
  let otherFarmerId: string;

  let ownListingId: string;
  let peerListingId: string;

  const createdUserIds: string[] = [];
  const createdFarmerIds: string[] = [];
  const createdListingIds: string[] = [];

  beforeAll(async () => {
    ready =
      (await databaseReady('produce_listings')) &&
      (await databaseReady('listing_routing')) &&
      (await databaseReady('purchase_orders'));
    if (!ready) return;

    // 1. Ensure warehouse and zone exist
    const whRes = await pool.query<{ id: string }>('SELECT id FROM warehouses LIMIT 1');
    if (whRes.rows.length > 0) {
      warehouseId = whRes.rows[0]!.id;
    } else {
      warehouseId = newId();
      await pool.query(
        `INSERT INTO warehouses (id, code, name, type, address, city, pincode, is_active)
         VALUES ($1, 'WH-TEST-BR29', 'Test WH', 'MAIN', 'Test Address', 'Ooty', '643001', true)`,
        [warehouseId],
      );
    }

    const zoneRes = await pool.query<{ id: string }>('SELECT id FROM zones WHERE is_active = true LIMIT 1');
    if (zoneRes.rows.length > 0) {
      zoneId = zoneRes.rows[0]!.id;
    } else {
      zoneId = newId();
      await pool.query(
        `INSERT INTO zones (id, code, name, warehouse_id, is_active)
         VALUES ($1, 'ZONE-TEST-BR29', 'Test Zone', $2, true)`,
        [zoneId, warehouseId],
      );
    }

    // Ensure isolated crop and fair price exist for this test
    const catRes = await pool.query<{ id: string }>('SELECT id FROM categories LIMIT 1');
    cropId = newId();
    await pool.query(
      `INSERT INTO crop_master (id, slug, name, category_id) VALUES ($1, $2, 'BR-29 Test Crop', $3)`,
      [cropId, `br29-crop-${cropId}`, catRes.rows[0]!.id],
    );

    // 2. Create Farmer Admin who is also a Farmer
    farmerAdminUserId = newId();
    farmerAdminFarmerId = newId();
    createdUserIds.push(farmerAdminUserId);
    createdFarmerIds.push(farmerAdminFarmerId);

    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'BR-29 Farmer Admin', 'ADMIN', 'ACTIVE')`,
      [farmerAdminUserId, `+9198${Math.floor(10000000 + Math.random() * 89999999)}`],
    );

    // Set fair price ceiling (fair_prices is append-only, set_by references users)
    const fpRes = await pool.query<{ id: string }>(
      `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
       VALUES ($1, 'GRADE_1', '100.00', '2020-01-01', $2)
       RETURNING id`,
      [cropId, farmerAdminUserId],
    );
    const fairPriceId = fpRes.rows[0]!.id;

    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, role_code, zone_id)
       VALUES ($1, (SELECT id FROM roles WHERE code = 'FARMER_ADMIN'), 'FARMER_ADMIN', $2)`,
      [farmerAdminUserId, zoneId],
    );

    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, kyc_status, application_status)
       VALUES ($1, $2, $3, $4, 'VERIFIED', 'APPROVED')`,
      [farmerAdminFarmerId, farmerAdminUserId, `TF-FA-${farmerAdminFarmerId.slice(0, 6)}`, zoneId],
    );

    farmerAdminToken = signAccessToken({
      sub: farmerAdminUserId,
      roles: [{ code: RoleCode.FARMER_ADMIN, zoneId }],
      farmerId: farmerAdminFarmerId,
      customerId: null,
    });

    // 3. Create another peer admin so listing_routing findRouteTarget can find a recipient
    const peerAdminUserId = newId();
    createdUserIds.push(peerAdminUserId);
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'BR-29 Peer Admin', 'ADMIN', 'ACTIVE')`,
      [peerAdminUserId, `+9198${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, role_code, zone_id)
       VALUES ($1, (SELECT id FROM roles WHERE code = 'FARMER_ADMIN'), 'FARMER_ADMIN', $2)`,
      [peerAdminUserId, zoneId],
    );

    // 4. Create another Farmer in the same zone
    otherFarmerUserId = newId();
    otherFarmerId = newId();
    createdUserIds.push(otherFarmerUserId);
    createdFarmerIds.push(otherFarmerId);

    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, 'BR-29 Peer Farmer', 'FARMER', 'ACTIVE')`,
      [otherFarmerUserId, `+9198${Math.floor(10000000 + Math.random() * 89999999)}`],
    );

    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, kyc_status, application_status)
       VALUES ($1, $2, $3, $4, 'VERIFIED', 'APPROVED')`,
      [otherFarmerId, otherFarmerUserId, `TF-PF-${otherFarmerId.slice(0, 6)}`, zoneId],
    );

    // 5. Create listings
    ownListingId = newId();
    createdListingIds.push(ownListingId);
    await pool.query(
      `INSERT INTO produce_listings (
         id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id,
         status
       ) VALUES ($1, $2, $3, $4, 'GRADE_1', '100.000', '50.00', $5, 'PENDING_APPROVAL')`,
      [ownListingId, `LST-OWN-${ownListingId.slice(0, 6)}`, farmerAdminFarmerId, cropId, fairPriceId],
    );

    peerListingId = newId();
    createdListingIds.push(peerListingId);
    await pool.query(
      `INSERT INTO produce_listings (
         id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id,
         status
       ) VALUES ($1, $2, $3, $4, 'GRADE_1', '150.000', '55.00', $5, 'PENDING_APPROVAL')`,
      [peerListingId, `LST-PEER-${peerListingId.slice(0, 6)}`, otherFarmerId, cropId, fairPriceId],
    );
  });

  afterAll(async () => {
    if (!ready) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL session_replication_role = replica');
      for (const id of createdListingIds) {
        await client.query('DELETE FROM purchase_orders WHERE listing_id = $1', [id]).catch(() => undefined);
        await client.query('DELETE FROM listing_routing WHERE listing_id = $1', [id]).catch(() => undefined);
        await client.query('DELETE FROM produce_listings WHERE id = $1', [id]).catch(() => undefined);
      }
      if (cropId) {
        await client.query('DELETE FROM fair_prices WHERE crop_id = $1', [cropId]).catch(() => undefined);
        await client.query('DELETE FROM crop_master WHERE id = $1', [cropId]).catch(() => undefined);
      }
      for (const id of createdFarmerIds) {
        await client.query('DELETE FROM farmers WHERE id = $1', [id]).catch(() => undefined);
      }
      for (const id of createdUserIds) {
        await client.query('DELETE FROM user_roles WHERE user_id = $1', [id]).catch(() => undefined);
        await client.query('DELETE FROM users WHERE id = $1', [id]).catch(() => undefined);
      }
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  it('BR-29: a Farmer Admin approving their own listing is refused with 403 SELF_APPROVAL_FORBIDDEN and routed away', async () => {
    const res = await request(app)
      .post(`/v1/admin/listings/${ownListingId}/approve`)
      .set('Authorization', `Bearer ${farmerAdminToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({ warehouseId });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SELF_APPROVAL_FORBIDDEN');

    // Verify routing record exists in database
    const routingRes = await pool.query<{ routed_reason: string; attempted_action: string }>(
      'SELECT routed_reason, attempted_action FROM listing_routing WHERE listing_id = $1',
      [ownListingId],
    );
    expect(routingRes.rows).toHaveLength(1);
    expect(routingRes.rows[0]!.routed_reason).toBe('self_approval');
    expect(routingRes.rows[0]!.attempted_action).toBe('approve');
  });

  it('BR-29: a Farmer Admin approving someone elses listing in their zone succeeds with 200 and raises a purchase order', async () => {
    const res = await request(app)
      .post(`/v1/admin/listings/${peerListingId}/approve`)
      .set('Authorization', `Bearer ${farmerAdminToken}`)
      .set('Idempotency-Key', crypto.randomUUID())
      .send({ warehouseId });

    expect(res.status).toBe(200);
    expect(res.body.listing.status).toBe('ACCEPTED');
    expect(res.body.purchaseOrderId).toBeDefined();

    // Verify purchase order created in database
    const poRes = await pool.query<{ id: string; listing_id: string }>(
      'SELECT id, listing_id FROM purchase_orders WHERE listing_id = $1',
      [peerListingId],
    );
    expect(poRes.rows).toHaveLength(1);
  });

  it('BR-226: GET /admin/listings returns summary counts across the filtered set unaffected by limit/cursor', async () => {
    const res = await request(app)
      .get(`/v1/admin/listings?zoneId=${zoneId}&limit=1`)
      .set('Authorization', `Bearer ${farmerAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.page.hasMore).toBe(true);
    expect(res.body.summary).toMatchObject({
      total: expect.any(Number),
      pending: expect.any(Number),
      counterOffered: expect.any(Number),
      approved: expect.any(Number),
      rejected: expect.any(Number),
      expired: expect.any(Number),
    });
    expect(res.body.summary.total).toBeGreaterThanOrEqual(2);
    expect(res.body.summary.pending).toBeGreaterThanOrEqual(1);
    expect(res.body.summary.approved).toBeGreaterThanOrEqual(1);
  });

  it('BR-233 (D1): FARMER_ADMIN sees only own-zone listings on GET /admin/listings and gets 404 on GET /admin/listings/:id for foreign zone', async () => {
    // Create a second active zone, farmer, and listing in that other zone
    const foreignZoneId = newId();
    const foreignFarmerUserId = newId();
    const foreignFarmerId = newId();
    const foreignListingId = newId();
    await pool.query(
      `INSERT INTO zones (id, code, name, warehouse_id, is_active) VALUES ($1, $2, 'Foreign Zone D1', $3, true)`,
      [foreignZoneId, `ZN-D1-${foreignZoneId.slice(0, 6)}`, warehouseId],
    );
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'D1 Foreign Farmer', 'FARMER', 'ACTIVE')`,
      [foreignFarmerUserId, `+9197${Math.floor(10000000 + Math.random() * 89999999)}`],
    );
    await pool.query(
      `INSERT INTO farmers (id, user_id, tohfa_farmer_id, zone_id, kyc_status, application_status) VALUES ($1, $2, $3, $4, 'VERIFIED', 'APPROVED')`,
      [foreignFarmerId, foreignFarmerUserId, `TF-D1-${foreignFarmerId.slice(0, 6)}`, foreignZoneId],
    );
    const fpRes = await pool.query<{ id: string }>(
      `SELECT id FROM fair_prices WHERE crop_id = $1 LIMIT 1`,
      [cropId],
    );
    await pool.query(
      `INSERT INTO produce_listings (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id, status)
       VALUES ($1, $2, $3, $4, 'GRADE_1', '80.000', '45.00', $5, 'ACCEPTED')`,
      [foreignListingId, `LST-D1-${foreignListingId.slice(0, 6)}`, foreignFarmerId, cropId, fpRes.rows[0]!.id],
    );

    const superToken = signAccessToken({
      sub: farmerAdminUserId,
      roles: [{ code: RoleCode.SUPER_ADMIN }],
      farmerId: null,
      customerId: null,
    });

    try {
      // Farmer Admin filtered by foreign zone sees 0 items (zone scope enforced server-side)
      const faListRes = await request(app)
        .get(`/v1/admin/listings?zoneId=${foreignZoneId}`)
        .set('Authorization', `Bearer ${farmerAdminToken}`);
      expect(faListRes.status).toBe(200);
      expect(faListRes.body.items).toEqual([]);
      expect(faListRes.body.summary.total).toBe(0);

      // Farmer Admin fetching foreign listing detail gets 404 (not 403)
      const faDetailForeign = await request(app)
        .get(`/v1/admin/listings/${foreignListingId}`)
        .set('Authorization', `Bearer ${farmerAdminToken}`);
      expect(faDetailForeign.status).toBe(404);

      // Farmer Admin fetching own-zone listing detail gets 200
      const faDetailOwn = await request(app)
        .get(`/v1/admin/listings/${peerListingId}`)
        .set('Authorization', `Bearer ${farmerAdminToken}`);
      expect(faDetailOwn.status).toBe(200);
      expect(faDetailOwn.body.id).toBe(peerListingId);

      // Super Admin can read foreign listing detail (200) and ACCEPTED status
      const saDetailForeign = await request(app)
        .get(`/v1/admin/listings/${foreignListingId}`)
        .set('Authorization', `Bearer ${superToken}`);
      expect(saDetailForeign.status).toBe(200);
      expect(saDetailForeign.body.status).toBe('ACCEPTED');
    } finally {
      await pool.query(`DELETE FROM produce_listings WHERE id = $1`, [foreignListingId]).catch(() => undefined);
      await pool.query(`DELETE FROM farmers WHERE id = $1`, [foreignFarmerId]).catch(() => undefined);
      await pool.query(`DELETE FROM users WHERE id = $1`, [foreignFarmerUserId]).catch(() => undefined);
      await pool.query(`DELETE FROM zones WHERE id = $1`, [foreignZoneId]).catch(() => undefined);
    }
  });
});
