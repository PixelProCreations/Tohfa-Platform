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

    // Ensure crop and fair price exist
    const cropRes = await pool.query<{ id: string }>('SELECT id FROM crop_master LIMIT 1');
    if (cropRes.rows.length > 0) {
      cropId = cropRes.rows[0]!.id;
    } else {
      const catRes = await pool.query<{ id: string }>('SELECT id FROM categories LIMIT 1');
      cropId = newId();
      await pool.query(
        `INSERT INTO crop_master (id, slug, name, category_id) VALUES ($1, $2, 'BR-29 Test Crop', $3)`,
        [cropId, `br29-crop-${cropId}`, catRes.rows[0]!.id],
      );
    }

    // Set fair price ceiling
    const fpRes = await pool.query<{ id: string }>(
      `INSERT INTO fair_prices (crop_id, grade, ceiling_price, effective_from, set_by)
       VALUES ($1, 'GRADE_1', '100.00', '2020-01-01', $2)
       ON CONFLICT (crop_id, grade, effective_from) DO UPDATE SET ceiling_price = '100.00'
       RETURNING id`,
      [cropId, newId()],
    );
    const fairPriceId = fpRes.rows[0]!.id;

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
    for (const id of createdListingIds) {
      await pool.query('DELETE FROM purchase_orders WHERE listing_id = $1', [id]).catch(() => undefined);
      await pool.query('DELETE FROM listing_routing WHERE listing_id = $1', [id]).catch(() => undefined);
      await pool.query('DELETE FROM produce_listings WHERE id = $1', [id]).catch(() => undefined);
    }
    for (const id of createdFarmerIds) {
      await pool.query('DELETE FROM farmers WHERE id = $1', [id]).catch(() => undefined);
    }
    for (const id of createdUserIds) {
      await pool.query('DELETE FROM user_roles WHERE user_id = $1', [id]).catch(() => undefined);
      await pool.query('DELETE FROM users WHERE id = $1', [id]).catch(() => undefined);
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
});
