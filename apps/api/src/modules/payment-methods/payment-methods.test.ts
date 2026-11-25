import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { RoleCode } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import { IDS } from '../../test/factories.js';
import { pool } from '../../db/pool.js';

describe('BR-171: payment methods CRUD (admin)', () => {
  const app = createApp();

  const superAdminToken = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
    farmerId: null,
    customerId: null,
  });

  const tohfaAdminToken = signAccessToken({
    sub: IDS.userTohfaAdmin,
    roles: [{ code: RoleCode.TOHFA_ADMIN }],
    farmerId: null,
    customerId: null,
  });

  it('BR-171a: auth & permission enforcement', async () => {
    // Unauthenticated
    const resNoAuth = await request(app).get('/v1/admin/payment-methods');
    expect(resNoAuth.status).toBe(401);

    // Forbidden for non-SUPER_ADMIN (TOHFA_ADMIN has none)
    const resForbidden = await request(app)
      .get('/v1/admin/payment-methods')
      .set('Authorization', `Bearer ${tohfaAdminToken}`);
    expect(resForbidden.status).toBe(403);

    // Allowed for SUPER_ADMIN
    const resOk = await request(app)
      .get('/v1/admin/payment-methods')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resOk.status).toBe(200);
  });

  it('BR-171b: validation on create', async () => {
    // Invalid type
    const resBadType = await request(app)
      .post('/v1/admin/payment-methods')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        type: 'CRYPTO',
        label: 'Bitcoin',
      });
    expect(resBadType.status).toBe(422);

    // Empty label
    const resEmptyLabel = await request(app)
      .post('/v1/admin/payment-methods')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        type: 'CASH',
        label: '   ',
      });
    expect(resEmptyLabel.status).toBe(422);
  });

  it('BR-171c: full CRUD and single-default invariant', async () => {
    // 1. Create first payment method as default
    const res1 = await request(app)
      .post('/v1/admin/payment-methods')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        type: 'CASH',
        label: 'Cash on Counter',
        isDefault: true,
        config: { note: 'Counter cash payments' },
      });
    expect(res1.status).toBe(201);
    expect(res1.body.id).toBeDefined();
    expect(res1.body.isDefault).toBe(true);
    expect(res1.body.isActive).toBe(true);
    const id1 = res1.body.id;

    // 2. Create second payment method as default -> method 1 is unset from default
    const res2 = await request(app)
      .post('/v1/admin/payment-methods')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        type: 'UPI',
        label: 'UPI QR Code',
        isDefault: true,
        config: { vpa: 'merchant@upi' },
      });
    expect(res2.status).toBe(201);
    expect(res2.body.isDefault).toBe(true);
    const id2 = res2.body.id;

    // Verify method 1 is no longer default
    const resGet1 = await request(app)
      .get(`/v1/admin/payment-methods/${id1}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resGet1.status).toBe(200);
    expect(resGet1.body.isDefault).toBe(false);

    // 3. List payment methods
    const resList = await request(app)
      .get('/v1/admin/payment-methods')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resList.status).toBe(200);
    expect(Array.isArray(resList.body)).toBe(true);
    const ids = resList.body.map((m: any) => m.id);
    expect(ids).toContain(id1);
    expect(ids).toContain(id2);

    // 4. Update method 1 (PUT)
    const resUpdate = await request(app)
      .put(`/v1/admin/payment-methods/${id1}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        label: 'Cash on Delivery / Counter',
        isDefault: false,
      });
    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.label).toBe('Cash on Delivery / Counter');

    // 5. Delete (deactivate) method 2
    const resDelete = await request(app)
      .delete(`/v1/admin/payment-methods/${id2}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect([200, 204]).toContain(resDelete.status);

    // Verify method 2 is now inactive
    const resGet2 = await request(app)
      .get(`/v1/admin/payment-methods/${id2}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resGet2.status).toBe(200);
    expect(resGet2.body.isActive).toBe(false);

    // 6. Verify audit logs
    const auditRes = await pool.query(
      `SELECT action_code, entity_id FROM audit_log WHERE entity_type = 'payment_method' ORDER BY created_at ASC`,
    );
    const actionCodes = auditRes.rows.map((r) => r.action_code);
    expect(actionCodes).toContain('payment_method.create');
    expect(actionCodes).toContain('payment_method.update');
    expect(actionCodes).toContain('payment_method.deactivate');
  });
});
