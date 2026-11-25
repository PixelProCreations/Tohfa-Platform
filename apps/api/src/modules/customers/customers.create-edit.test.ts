import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { randomMobile } from '../../test/dbFixtures.js';
import { customersService } from './customers.service.js';
import { ScopeLevel } from '@tohfa/shared-types';

describeIfDatabase('Customer Create & Edit Module (BR-160)', () => {
  const app = createApp();
  let ready = false;

  let superAdminUserId: string;
  let superAdminToken: string;
  let subWhAdminUserId: string;
  let subWhAdminToken: string;

  let warehouseId: string;

  const createdUserIds: string[] = [];
  const createdCustomerIds: string[] = [];

  beforeAll(async () => {
    ready = await databaseReady('customers');
    if (!ready) return;

    // Pick canonical warehouse
    const whRes = await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE code = 'WH-OOTY' LIMIT 1`);
    warehouseId = whRes.rows[0]?.id ?? (await pool.query<{ id: string }>(`SELECT id FROM warehouses LIMIT 1`)).rows[0]!.id;

    // Create Super Admin
    superAdminUserId = newId();
    createdUserIds.push(superAdminUserId);
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Super Admin Test', 'ACTIVE')`,
      [superAdminUserId, randomMobile()],
    );
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, role_code) SELECT $1, id, code FROM roles WHERE code = 'SUPER_ADMIN'`,
      [superAdminUserId],
    );
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });

    // Create Sub WH Admin (no customer create/edit grant)
    subWhAdminUserId = newId();
    createdUserIds.push(subWhAdminUserId);
    await pool.query(
      `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Sub Admin Test', 'ACTIVE')`,
      [subWhAdminUserId, randomMobile()],
    );
    await pool.query(
      `INSERT INTO user_roles (user_id, role_id, role_code, warehouse_id) SELECT $1, id, code, $2 FROM roles WHERE code = 'SUB_WH_ADMIN'`,
      [subWhAdminUserId, warehouseId],
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
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SET LOCAL session_replication_role = replica');

      if (createdCustomerIds.length > 0) {
        await client.query(`DELETE FROM audit_log WHERE entity_type = 'customer' AND entity_id = ANY($1::uuid[])`, [createdCustomerIds]);
        await client.query(`DELETE FROM customer_addresses WHERE customer_id = ANY($1::uuid[])`, [createdCustomerIds]);
        await client.query(`DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE customer_id = ANY($1::uuid[]))`, [createdCustomerIds]);
        await client.query(`DELETE FROM wallets WHERE customer_id = ANY($1::uuid[])`, [createdCustomerIds]);
        await client.query(`DELETE FROM customers WHERE id = ANY($1::uuid[])`, [createdCustomerIds]);
      }

      if (createdUserIds.length > 0) {
        await client.query(`DELETE FROM user_roles WHERE user_id = ANY($1::uuid[])`, [createdUserIds]);
        await client.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [createdUserIds]);
      }

      await client.query('COMMIT');
    } catch {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  });

  describe('BR-160a: Customer Creation baseline', () => {
    it('creates user, customer, wallet, address, generates customerCode and records audit log', async () => {
      const mobile = randomMobile();
      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Priya Sharma',
          mobile,
          email: 'priya.sharma@example.com',
          customerType: 'RETAIL',
          preferredWarehouseId: warehouseId,
          address: {
            line1: '14 Nilgiri View',
            city: 'Ooty',
            state: 'Tamil Nadu',
            pincode: '643001',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.customerCode).toMatch(/^CUST-\d{4,}$/);
      expect(res.body.name).toBe('Priya Sharma');
      expect(res.body.mobile).toBe(mobile);
      expect(res.body.customerType).toBe('RETAIL');
      expect(res.body.preferredWarehouseId).toBe(warehouseId);
      expect(res.body.linkedToExistingUser).toBe(false);

      const customerId = res.body.id;
      createdCustomerIds.push(customerId);

      // Verify wallet was created
      const walletRes = await pool.query<{ id: string; balance: string }>(
        `SELECT id, balance FROM wallets WHERE customer_id = $1`,
        [customerId],
      );
      expect(walletRes.rows).toHaveLength(1);
      expect(Number(walletRes.rows[0]!.balance)).toBe(0);

      // Verify address was created
      const addrRes = await pool.query<{ line1: string; city: string; is_default: boolean }>(
        `SELECT line1, city, is_default FROM customer_addresses WHERE customer_id = $1`,
        [customerId],
      );
      expect(addrRes.rows).toHaveLength(1);
      expect(addrRes.rows[0]!.line1).toBe('14 Nilgiri View');
      expect(addrRes.rows[0]!.city).toBe('Ooty');
      expect(addrRes.rows[0]!.is_default).toBe(true);

      // Verify user was created with ACTIVE status and no password/credentials
      const userRes = await pool.query<{ id: string; status: string; password_hash: string | null }>(
        `SELECT u.id, u.status, u.password_hash FROM users u
         JOIN customers c ON c.user_id = u.id
         WHERE c.id = $1`,
        [customerId],
      );
      expect(userRes.rows).toHaveLength(1);
      expect(userRes.rows[0]!.status).toBe('ACTIVE');
      expect(userRes.rows[0]!.password_hash).toBeNull();
      createdUserIds.push(userRes.rows[0]!.id);

      // Verify audit log
      const auditRes = await pool.query<{ action_code: string; entity_type: string; entity_id: string }>(
        `SELECT action_code, entity_type, entity_id FROM audit_log WHERE entity_id = $1`,
        [customerId],
      );
      expect(auditRes.rows).toHaveLength(1);
      expect(auditRes.rows[0]!.action_code).toBe('customer.record.create');
      expect(auditRes.rows[0]!.entity_type).toBe('customer');
    });

    it('rejects POST /admin/customers for actors without customer.record.create permission', async () => {
      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${subWhAdminToken}`)
        .send({
          name: 'Unauthorized Test',
          mobile: randomMobile(),
          customerType: 'RETAIL',
        });
      expect(res.status).toBe(403);
    });
  });

  describe('BR-160b: Mobile Collisions & Role Merging', () => {
    it('returns 409 CONFLICT if a live customer with the same mobile already exists', async () => {
      const mobile = randomMobile();
      // Create first customer
      const res1 = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Existing Customer',
          mobile,
          customerType: 'RETAIL',
        });
      expect(res1.status).toBe(201);
      createdCustomerIds.push(res1.body.id);

      // Attempt second customer with same mobile
      const res2 = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Duplicate Customer',
          mobile,
          customerType: 'RETAIL',
        });
      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('CONFLICT');
    });

    it('attaches CUSTOMER role to live farmer, sets linkedToExistingUser: true, and writes customer.role_attached audit', async () => {
      const farmerUserId = newId();
      const farmerMobile = randomMobile();
      createdUserIds.push(farmerUserId);

      // Create live farmer user & role
      await pool.query(
        `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'FARMER', 'Murugan Farmer', 'ACTIVE')`,
        [farmerUserId, farmerMobile],
      );
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id, role_code) SELECT $1, id, code FROM roles WHERE code = 'FARMER'`,
        [farmerUserId],
      );

      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Murugan Customer',
          mobile: farmerMobile,
          customerType: 'RETAIL',
        });

      expect(res.status).toBe(201);
      expect(res.body.linkedToExistingUser).toBe(true);
      expect(res.body.mobile).toBe(farmerMobile);

      const customerId = res.body.id;
      createdCustomerIds.push(customerId);

      // Check customer row points to existing farmer user id
      const custRow = await pool.query<{ user_id: string }>(
        `SELECT user_id FROM customers WHERE id = $1`,
        [customerId],
      );
      expect(custRow.rows[0]!.user_id).toBe(farmerUserId);

      // Check roles on user
      const rolesRes = await pool.query<{ role_code: string }>(
        `SELECT role_code FROM user_roles WHERE user_id = $1 ORDER BY role_code`,
        [farmerUserId],
      );
      const roles = rolesRes.rows.map((r) => r.role_code);
      expect(roles).toContain('FARMER');
      expect(roles).toContain('CUSTOMER');

      // Check audit log has customer.role_attached
      const auditRes = await pool.query<{ action_code: string }>(
        `SELECT action_code FROM audit_log WHERE entity_id = $1`,
        [customerId],
      );
      expect(auditRes.rows.map((r) => r.action_code)).toContain('customer.role_attached');
    });

    it('rejects with 409 CONFLICT if mobile belongs to an administrative account (BR-135)', async () => {
      const adminUserId = newId();
      const adminMobile = randomMobile();
      createdUserIds.push(adminUserId);

      await pool.query(
        `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, 'ADMIN', 'Admin Account', 'ACTIVE')`,
        [adminUserId, adminMobile],
      );
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id, role_code) SELECT $1, id, code FROM roles WHERE code = 'TOHFA_ADMIN'`,
        [adminUserId],
      );

      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Attempt Customer On Admin',
          mobile: adminMobile,
          customerType: 'RETAIL',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('creates a fresh user row when mobile belongs to a soft-deleted user (linkedToExistingUser: false)', async () => {
      const deletedUserId = newId();
      const deletedMobile = randomMobile();
      createdUserIds.push(deletedUserId);

      // Insert soft-deleted user
      await pool.query(
        `INSERT INTO users (id, mobile, user_type, full_name, status, deleted_at) VALUES ($1, $2, 'CUSTOMER', 'Past User', 'ACTIVE', now() - interval '5 days')`,
        [deletedUserId, deletedMobile],
      );

      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Reused Number New User',
          mobile: deletedMobile,
          customerType: 'RETAIL',
        });

      expect(res.status).toBe(201);
      expect(res.body.linkedToExistingUser).toBe(false);

      const customerId = res.body.id;
      createdCustomerIds.push(customerId);

      // Customer must point to a new user row, NOT the soft-deleted one
      const custRow = await pool.query<{ user_id: string }>(
        `SELECT user_id FROM customers WHERE id = $1`,
        [customerId],
      );
      expect(custRow.rows[0]!.user_id).not.toBe(deletedUserId);
      createdUserIds.push(custRow.rows[0]!.user_id);
    });
  });

  describe('BR-160c: Business Name Constraint', () => {
    it('rejects B2B customer creation without businessName with 422 VALIDATION_FAILED', async () => {
      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Trader Joe',
          mobile: randomMobile(),
          customerType: 'B2B',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('rejects HORECA customer creation with empty/whitespace businessName with 422 VALIDATION_FAILED', async () => {
      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Chef Gordon',
          mobile: randomMobile(),
          customerType: 'HORECA',
          businessName: '   ',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('succeeds for B2B and HORECA when valid businessName is provided', async () => {
      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Anand Kumar',
          mobile: randomMobile(),
          customerType: 'B2B',
          businessName: 'Anand Organic Stores',
          businessType: 'Wholesale Grocery',
        });

      expect(res.status).toBe(201);
      expect(res.body.businessName).toBe('Anand Organic Stores');
      expect(res.body.businessType).toBe('Wholesale Grocery');
      createdCustomerIds.push(res.body.id);
    });
  });

  describe('BR-160d: GSTIN Format and Uniqueness', () => {
    it('rejects invalid GSTIN format with 422', async () => {
      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Bad GST Customer',
          mobile: randomMobile(),
          customerType: 'B2B',
          businessName: 'Bad GST Enterprise',
          gstin: 'NOT-A-VALID-GSTIN',
        });

      expect(res.status).toBe(422);
    });

    it('rejects duplicate GSTIN on create with 409 CONFLICT', async () => {
      const validGstin = '33AABCT1332L1ZV';
      const res1 = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'GST Org One',
          mobile: randomMobile(),
          customerType: 'B2B',
          businessName: 'GST Enterprise One',
          gstin: validGstin,
        });
      expect(res1.status).toBe(201);
      createdCustomerIds.push(res1.body.id);

      const res2 = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'GST Org Two',
          mobile: randomMobile(),
          customerType: 'B2B',
          businessName: 'GST Enterprise Two',
          gstin: validGstin,
        });
      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('CONFLICT');
    });
  });

  describe('BR-160e: Customer Profile Edit (PATCH)', () => {
    let testCustomerId: string;
    let initialMobile: string;

    beforeAll(async () => {
      initialMobile = randomMobile();
      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Edit Base Customer',
          mobile: initialMobile,
          email: 'initial@example.com',
          customerType: 'RETAIL',
        });
      testCustomerId = res.body.id;
      createdCustomerIds.push(testCustomerId);
    });

    it('updates name, email, businessType and address', async () => {
      const res = await request(app)
        .patch(`/v1/admin/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
          businessType: 'Boutique Hotel',
          address: {
            line1: '99 Hill Top',
            city: 'Coonoor',
            state: 'Tamil Nadu',
            pincode: '643101',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.email).toBe('updated@example.com');
      expect(res.body.businessType).toBe('Boutique Hotel');

      // Verify audit log for edit
      const auditRes = await pool.query<{ action_code: string }>(
        `SELECT action_code FROM audit_log WHERE entity_id = $1 AND action_code = 'customer.profile.edit'`,
        [testCustomerId],
      );
      expect(auditRes.rows).toHaveLength(1);
    });

    it('rejects mobile if sent in PATCH payload (BR-33 locked)', async () => {
      const res = await request(app)
        .patch(`/v1/admin/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          mobile: '+919999999999',
          name: 'Locked Mobile Test',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('updates GSTIN with permission, setting gst_verified to false', async () => {
      const gstin = '33AABCT1332L2ZW';
      const res = await request(app)
        .patch(`/v1/admin/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          customerType: 'B2B',
          businessName: 'Verified Co',
          gstin,
        });

      expect(res.status).toBe(200);
      expect(res.body.gstin).toBe(gstin);
      expect(res.body.gstVerified).toBe(false);

      // Verify in database
      const row = await pool.query<{ gstin: string; gst_verified: boolean }>(
        `SELECT gstin, gst_verified FROM customers WHERE id = $1`,
        [testCustomerId],
      );
      expect(row.rows[0]!.gstin).toBe(gstin);
      expect(row.rows[0]!.gst_verified).toBe(false);
    });

    it('forbids editing GSTIN if caller lacks customer.gst_details.manage permission', async () => {
      // Calling service.update with gstScope: null throws 403 FORBIDDEN
      const scope = {
        level: ScopeLevel.ALL,
        permission: 'customer.profile.edit',
        roleCode: 'SUPER_ADMIN' as const,
        warehouseIds: [],
        zoneIds: [],
        userId: superAdminUserId,
      };

      await expect(
        customersService.update(scope, null, testCustomerId, {
          gstin: '33AABCT1332L3ZX',
        }),
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('rejects changing customer to B2B without a businessName on PATCH with 422', async () => {
      // Create a retail customer with no business name
      const resCreate = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Retail To B2B',
          mobile: randomMobile(),
          customerType: 'RETAIL',
        });
      const retailId = resCreate.body.id;
      createdCustomerIds.push(retailId);

      const resPatch = await request(app)
        .patch(`/v1/admin/customers/${retailId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          customerType: 'B2B',
          // no businessName
        });

      expect(resPatch.status).toBe(422);
      expect(resPatch.body.code).toBe('VALIDATION_FAILED');
    });
  });

  describe('BR-160f: Read Payloads and Privacy Masking', () => {
    let maskedCustomerId: string;
    let customerMobile: string;

    beforeAll(async () => {
      customerMobile = randomMobile();
      const res = await request(app)
        .post('/v1/admin/customers')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Read Test Customer',
          mobile: customerMobile,
          customerType: 'B2B',
          businessName: 'Read Test Corp',
          businessType: 'Retailer',
          preferredWarehouseId: warehouseId,
        });
      maskedCustomerId = res.body.id;
      createdCustomerIds.push(maskedCustomerId);
    });

    it('GET /admin/customers/:id returns customerType, businessName, businessType, gstin, gstVerified', async () => {
      const res = await request(app)
        .get(`/v1/admin/customers/${maskedCustomerId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.customerType).toBe('B2B');
      expect(res.body.businessName).toBe('Read Test Corp');
      expect(res.body.businessType).toBe('Retailer');
      expect(res.body.gstin).toBeNull();
      expect(res.body.gstVerified).toBe(false);
      expect(res.body.mobile).toBe(customerMobile);
    });

    it('GET /admin/customers list item includes customerType and businessName', async () => {
      const res = await request(app)
        .get(`/v1/admin/customers?q=Read Test Customer`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      const row = res.body.items.find((r: { id: string }) => r.id === maskedCustomerId);
      expect(row).toBeDefined();
      expect(row.customerType).toBe('B2B');
      expect(row.businessName).toBe('Read Test Corp');
    });

    it('GET /admin/customers/:id masks mobile for warehouse admin actor (BR-92)', async () => {
      const res = await request(app)
        .get(`/v1/admin/customers/${maskedCustomerId}`)
        .set('Authorization', `Bearer ${subWhAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.piiMasked).toBe(true);
      expect(res.body.mobile).toBeUndefined();
      expect(res.body.mobileMasked).toMatch(/^\*{5,}\d{4}$/);
    });
  });
});
