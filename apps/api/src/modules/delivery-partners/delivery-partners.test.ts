import { afterAll, beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { randomMobile } from '../../test/dbFixtures.js';

describeIfDatabase('Delivery Partners Module (BR-157, P0-71)', () => {
  const app = createApp();
  let ready = false;

  let superAdminToken: string;
  let superAdminUserId: string;

  let tohfaAdminToken: string;
  let tohfaAdminUserId: string;

  let mainWhAdminToken: string;
  let mainWhAdminUserId: string;

  let subWhAdminToken: string;
  let subWhAdminUserId: string;

  let farmerToken: string;
  let farmerUserId: string;

  let customerToken: string;
  let customerUserId: string;

  beforeAll(async () => {
    ready = await databaseReady('delivery_partners');
    if (!ready) return;

    // Super Admin
    superAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'SA User', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [superAdminUserId, randomMobile()],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // TOHFA Admin
    tohfaAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'TA User', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [tohfaAdminUserId, randomMobile()],
    );
    tohfaAdminToken = signAccessToken({
      sub: tohfaAdminUserId,
      roles: [{ code: 'TOHFA_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // Main WH Admin
    mainWhAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'MW User', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [mainWhAdminUserId, randomMobile()],
    );
    mainWhAdminToken = signAccessToken({
      sub: mainWhAdminUserId,
      roles: [{ code: 'MAIN_WH_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // Sub WH Admin
    subWhAdminUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'SW User', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [subWhAdminUserId, randomMobile()],
    );
    subWhAdminToken = signAccessToken({
      sub: subWhAdminUserId,
      roles: [{ code: 'SUB_WH_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // Farmer
    farmerUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'FARMER', 'Farmer User', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [farmerUserId, randomMobile()],
    );
    farmerToken = signAccessToken({
      sub: farmerUserId,
      roles: [{ code: 'FARMER' }],
      customerId: null,
      farmerId: newId(),
    });

    // Customer
    customerUserId = newId();
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'CUSTOMER', 'Customer User', 'ACTIVE') ON CONFLICT DO NOTHING`,
      [customerUserId, randomMobile()],
    );
    customerToken = signAccessToken({
      sub: customerUserId,
      roles: [{ code: 'CUSTOMER' }],
      customerId: newId(),
      farmerId: null,
    });
  });

  it('BR-157b: POST /admin/delivery-partners validates required fields, creates partner and writes audit log', async () => {
    if (!ready) return;

    // 1. Validation errors
    const emptyRes = await request(app)
      .post('/v1/admin/delivery-partners')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({});
    expect(emptyRes.status).toBe(422);

    const blankRes = await request(app)
      .post('/v1/admin/delivery-partners')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: '   ', phone: '' });
    expect(blankRes.status).toBe(422);

    // 2. Successful creation
    const partnerName = `Speedy Delivery ${newId().slice(0, 6)}`;
    const phone = '+919876543210';
    const vehicleRef = 'TN-43-AB-1234 (Tata Ace)';

    const createRes = await request(app)
      .post('/v1/admin/delivery-partners')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: partnerName, phone, vehicleRef });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({
      name: partnerName,
      phone,
      vehicleRef,
      isActive: true,
    });
    expect(createRes.body.id).toBeDefined();

    // 3. Verify audit log written
    const auditRes = await pool.query<{ action_code: string; entity_type: string; entity_id: string }>(
      `SELECT action_code, entity_type, entity_id FROM audit_log WHERE entity_type = 'delivery_partners' AND entity_id = $1`,
      [createRes.body.id],
    );
    expect(auditRes.rows.length).toBeGreaterThan(0);
    expect(auditRes.rows[0]!.action_code).toBe('delivery.partner.manage');
  });

  it('BR-157a: GET /admin/delivery-partners lists active partners only, sorted by name, and supports status filters and getById', async () => {
    if (!ready) return;

    const suffix = newId().slice(0, 6);
    const active1 = `Alpha Partner ${suffix}`;
    const active2 = `Beta Partner ${suffix}`;
    const inactive = `Inactive Partner ${suffix}`;
    const deleted = `Deleted Partner ${suffix}`;

    const res1 = await pool.query<{ id: string }>(
      `INSERT INTO delivery_partners (name, phone, is_active) VALUES ($1, '+919000000001', true) RETURNING id`,
      [active1],
    );
    const res2 = await pool.query<{ id: string }>(
      `INSERT INTO delivery_partners (name, phone, is_active) VALUES ($1, '+919000000002', true) RETURNING id`,
      [active2],
    );
    const res3 = await pool.query<{ id: string }>(
      `INSERT INTO delivery_partners (name, phone, is_active) VALUES ($1, '+919000000003', false) RETURNING id`,
      [inactive],
    );
    const res4 = await pool.query<{ id: string }>(
      `INSERT INTO delivery_partners (name, phone, is_active, deleted_at) VALUES ($1, '+919000000004', true, now()) RETURNING id`,
      [deleted],
    );

    const activeId1 = res1.rows[0]!.id;
    const activeId2 = res2.rows[0]!.id;
    const inactiveId = res3.rows[0]!.id;
    const deletedId = res4.rows[0]!.id;

    try {
      // 1. Default (active only)
      const listRes = await request(app)
        .get('/v1/admin/delivery-partners')
        .set('Authorization', `Bearer ${subWhAdminToken}`);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);

      const names = listRes.body.map((p: { name: string }) => p.name);
      expect(names).toContain(active1);
      expect(names).toContain(active2);
      expect(names).not.toContain(inactive);
      expect(names).not.toContain(deleted);

      // Verify ordering
      const alphaIdx = names.indexOf(active1);
      const betaIdx = names.indexOf(active2);
      expect(alphaIdx).toBeLessThan(betaIdx);

      // 2. Query ?status=inactive
      const listInactiveRes = await request(app)
        .get('/v1/admin/delivery-partners?status=inactive')
        .set('Authorization', `Bearer ${subWhAdminToken}`);

      expect(listInactiveRes.status).toBe(200);
      const inactiveNames = listInactiveRes.body.map((p: { name: string }) => p.name);
      expect(inactiveNames).toContain(inactive);
      expect(inactiveNames).not.toContain(active1);
      expect(inactiveNames).not.toContain(active2);
      expect(inactiveNames).not.toContain(deleted);

      // 3. Query ?status=all
      const listAllRes = await request(app)
        .get('/v1/admin/delivery-partners?status=all')
        .set('Authorization', `Bearer ${subWhAdminToken}`);

      expect(listAllRes.status).toBe(200);
      const allNames = listAllRes.body.map((p: { name: string }) => p.name);
      expect(allNames).toContain(active1);
      expect(allNames).toContain(active2);
      expect(allNames).toContain(inactive);
      expect(allNames).not.toContain(deleted);

      // 4. GET /admin/delivery-partners/{id}
      // Active partner -> 200
      const getActiveRes = await request(app)
        .get(`/v1/admin/delivery-partners/${activeId1}`)
        .set('Authorization', `Bearer ${subWhAdminToken}`);
      expect(getActiveRes.status).toBe(200);
      expect(getActiveRes.body).toMatchObject({ id: activeId1, name: active1, isActive: true });

      // Inactive partner -> 200
      const getInactiveRes = await request(app)
        .get(`/v1/admin/delivery-partners/${inactiveId}`)
        .set('Authorization', `Bearer ${subWhAdminToken}`);
      expect(getInactiveRes.status).toBe(200);
      expect(getInactiveRes.body).toMatchObject({ id: inactiveId, name: inactive, isActive: false });

      // Unknown partner -> 404
      const getUnknownRes = await request(app)
        .get(`/v1/admin/delivery-partners/${newId()}`)
        .set('Authorization', `Bearer ${subWhAdminToken}`);
      expect(getUnknownRes.status).toBe(404);

      // Soft-deleted partner -> 404
      const getDeletedRes = await request(app)
        .get(`/v1/admin/delivery-partners/${deletedId}`)
        .set('Authorization', `Bearer ${subWhAdminToken}`);
      expect(getDeletedRes.status).toBe(404);
    } finally {
      await pool.query(`DELETE FROM delivery_partners WHERE id IN ($1, $2, $3, $4)`, [
        activeId1,
        activeId2,
        inactiveId,
        deletedId,
      ]);
    }
  });

  it('BR-157c: PATCH /admin/delivery-partners/{id} updates partner fields and supports deactivation', async () => {
    if (!ready) return;

    const initName = `Initial Partner ${newId().slice(0, 6)}`;
    const ins = await pool.query<{ id: string }>(
      `INSERT INTO delivery_partners (name, phone, vehicle_ref, is_active) VALUES ($1, '+919888888888', 'TN-01-A-1', true) RETURNING id`,
      [initName],
    );
    const partnerId = ins.rows[0]!.id;

    // 1. Partial update
    const updatedName = `Updated Partner ${newId().slice(0, 6)}`;
    const patchRes = await request(app)
      .patch(`/v1/admin/delivery-partners/${partnerId}`)
      .set('Authorization', `Bearer ${mainWhAdminToken}`)
      .send({ name: updatedName, vehicleRef: 'TN-01-B-2', isActive: false });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toMatchObject({
      id: partnerId,
      name: updatedName,
      phone: '+919888888888',
      vehicleRef: 'TN-01-B-2',
      isActive: false,
    });

    // 2. GET /admin/delivery-partners/{id} retrieves the partner (even when inactive)
    const getByIdRes = await request(app)
      .get(`/v1/admin/delivery-partners/${partnerId}`)
      .set('Authorization', `Bearer ${mainWhAdminToken}`);
    expect(getByIdRes.status).toBe(200);
    expect(getByIdRes.body.isActive).toBe(false);

    // 3. GET /admin/delivery-partners?status=inactive lists it; ?status=active excludes it
    const listInactive = await request(app)
      .get(`/v1/admin/delivery-partners?status=inactive`)
      .set('Authorization', `Bearer ${mainWhAdminToken}`);
    expect(listInactive.status).toBe(200);
    expect(listInactive.body.some((p: { id: string }) => p.id === partnerId)).toBe(true);

    const listActive = await request(app)
      .get(`/v1/admin/delivery-partners?status=active`)
      .set('Authorization', `Bearer ${mainWhAdminToken}`);
    expect(listActive.status).toBe(200);
    expect(listActive.body.some((p: { id: string }) => p.id === partnerId)).toBe(false);

    // 4. Reactivation is supported (two-way door)
    const reactivateRes = await request(app)
      .patch(`/v1/admin/delivery-partners/${partnerId}`)
      .set('Authorization', `Bearer ${mainWhAdminToken}`)
      .send({ isActive: true });
    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.isActive).toBe(true);

    // 5. 404 for unknown partner
    const notFoundRes = await request(app)
      .patch(`/v1/admin/delivery-partners/${newId()}`)
      .set('Authorization', `Bearer ${mainWhAdminToken}`)
      .send({ name: 'Does Not Exist' });
    expect(notFoundRes.status).toBe(404);

    // Clean up
    await pool.query(`DELETE FROM delivery_partners WHERE id = $1`, [partnerId]);
  });

  it('BR-157d: DELETE /admin/delivery-partners/{id} performs soft delete and prevents hard delete if referenced by orders', async () => {
    if (!ready) return;

    const name = `Soft Delete Partner ${newId().slice(0, 6)}`;
    const ins = await pool.query<{ id: string }>(
      `INSERT INTO delivery_partners (name, phone, is_active) VALUES ($1, '+919777777777', true) RETURNING id`,
      [name],
    );
    const partnerId = ins.rows[0]!.id;

    // 1. Soft delete via DELETE endpoint
    const deleteRes = await request(app)
      .delete(`/v1/admin/delivery-partners/${partnerId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(deleteRes.status).toBe(204);

    // 2. Verify row has deleted_at set and is_active = false
    const checkDb = await pool.query<{ is_active: boolean; deleted_at: Date | null }>(
      `SELECT is_active, deleted_at FROM delivery_partners WHERE id = $1`,
      [partnerId],
    );
    expect(checkDb.rows[0]!.is_active).toBe(false);
    expect(checkDb.rows[0]!.deleted_at).not.toBeNull();

    // 3. Second delete or update is 404
    const deleteAgain = await request(app)
      .delete(`/v1/admin/delivery-partners/${partnerId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(deleteAgain.status).toBe(404);

    // 4. Hard delete protection when referenced by order (checked in rolled-back tx)
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const partner2 = await client.query<{ id: string }>(
        `INSERT INTO delivery_partners (name, phone, is_active) VALUES ('Ref Partner', '+919666666666', true) RETURNING id`,
      );
      const partner2Id = partner2.rows[0]!.id;

      const whRes = await client.query<{ id: string }>(`SELECT id FROM warehouses LIMIT 1`);
      const whId = whRes.rows[0]!.id;

      const custRes = await client.query<{ id: string }>(`SELECT id FROM customers LIMIT 1`);
      let custId: string;
      if (custRes.rows.length > 0) {
        custId = custRes.rows[0]!.id;
      } else {
        const c = await client.query<{ id: string }>(
          `INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`,
          [customerUserId, `CUST-${newId().slice(0, 6)}`],
        );
        custId = c.rows[0]!.id;
      }

      const addr = await client.query<{ id: string }>(
        `INSERT INTO customer_addresses (customer_id, line1, city, pincode) VALUES ($1, '10 Test Lane', 'Ooty', '643001') RETURNING id`,
        [custId],
      );
      const addressId = addr.rows[0]!.id;

      await client.query<{ id: string }>(
        `INSERT INTO orders (order_number, warehouse_id, customer_id, channel, fulfilment_type, status, payment_method, payment_status, subtotal, delivery_fee, discount, gst_amount, total_amount, delivery_address_id, delivery_partner_id)
         VALUES ($1, $2, $3, 'ONLINE', 'DELIVERY', 'OUT_FOR_DELIVERY', 'WALLET', 'PAID', 100, 40, 0, 5, 145, $4, $5) RETURNING id`,
        [`ORD-DP-${newId().slice(0, 8)}`, whId, custId, addressId, partner2Id],
      );

      // Direct hard delete in DB is blocked by FK ON DELETE RESTRICT constraint
      await expect(client.query(`DELETE FROM delivery_partners WHERE id = $1`, [partner2Id])).rejects.toThrow(
        /violates foreign key constraint "orders_delivery_partner_id_fkey"/i,
      );
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('BR-157e: RBAC enforcement: caller requires delivery.partner.manage', async () => {
    if (!ready) return;

    // Allowed roles: SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN, SUB_WH_ADMIN
    const saRes = await request(app).get('/v1/admin/delivery-partners').set('Authorization', `Bearer ${superAdminToken}`);
    expect(saRes.status).toBe(200);

    const taRes = await request(app).get('/v1/admin/delivery-partners').set('Authorization', `Bearer ${tohfaAdminToken}`);
    expect(taRes.status).toBe(200);

    const mwRes = await request(app).get('/v1/admin/delivery-partners').set('Authorization', `Bearer ${mainWhAdminToken}`);
    expect(mwRes.status).toBe(200);

    const swRes = await request(app).get('/v1/admin/delivery-partners').set('Authorization', `Bearer ${subWhAdminToken}`);
    expect(swRes.status).toBe(200);

    // Denied roles: FARMER, CUSTOMER
    const farmerRes = await request(app).get('/v1/admin/delivery-partners').set('Authorization', `Bearer ${farmerToken}`);
    expect(farmerRes.status).toBe(403);

    const customerRes = await request(app).get('/v1/admin/delivery-partners').set('Authorization', `Bearer ${customerToken}`);
    expect(customerRes.status).toBe(403);

    // No auth
    const noAuth = await request(app).get('/v1/admin/delivery-partners');
    expect(noAuth.status).toBe(401);
  });

  afterAll(async () => {
    if (!ready) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL session_replication_role = replica');
      await client.query('DELETE FROM delivery_partners');
      await client.query(
        `DELETE FROM users WHERE id IN ($1, $2, $3, $4, $5, $6)`,
        [
          superAdminUserId,
          tohfaAdminUserId,
          mainWhAdminUserId,
          subWhAdminUserId,
          farmerUserId,
          customerUserId,
        ],
      );
      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });
});
