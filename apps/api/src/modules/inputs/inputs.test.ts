/**
 * Approved Inputs Catalogue (BR-241 — D11):
 *  - Admin CRUD at /v1/admin/inputs (inputs.catalog.view / inputs.catalog.manage)
 *  - Public/Farmer read at /v1/inputs (inputs.catalog.view, APPROVED only, admin metadata stripped per BR-16)
 */
import type { Server } from 'node:http';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { describeIfDatabase, newId } from '../../test/factories.js';

function randomMobile(): string {
  return `+917${Math.floor(100000000 + Math.random() * 899999999)}`;
}

describeIfDatabase('Approved Inputs Catalogue HTTP (BR-241)', () => {
  let server: Server;
  let ready = false;

  const superAdminId = newId();
  const tohfaAdminId = newId();
  const farmerAdminId = newId();
  const farmerUserId = newId();
  const farmerId = newId();
  const customerUserId = newId();

  const token = (userId: string, roleCode: RoleCode, extra: { farmerId?: string } = {}) =>
    signAccessToken({
      sub: userId,
      roles: [{ code: roleCode }],
      farmerId: extra.farmerId ?? null,
      customerId: null,
    });

  beforeAll(async () => {
    try {
      await pool.query('SELECT 1 FROM approved_inputs LIMIT 0');
      ready = true;
    } catch {
      return;
    }

    const app = createApp();
    server = app.listen(0);

    for (const [id, name, type] of [
      [superAdminId, 'SA Inputs', 'ADMIN'],
      [tohfaAdminId, 'TA Inputs', 'ADMIN'],
      [farmerAdminId, 'FA Inputs', 'ADMIN'],
      [farmerUserId, 'Farmer Inputs', 'FARMER'],
      [customerUserId, 'Customer Inputs', 'CUSTOMER'],
    ] as const) {
      await pool.query(
        `INSERT INTO users (id, full_name, mobile, user_type, status) VALUES ($1, $2, $3, $4, 'ACTIVE')`,
        [id, name, randomMobile(), type],
      );
    }
  });

  afterAll(async () => {
    server?.close();
  });

  it('BR-241: manages inputs catalog (CRUD, status approval, search), strips admin fields from farmer view, and writes audit_log', async (ctx) => {
    if (!ready) return ctx.skip();

    const saToken = token(superAdminId, RoleCode.SUPER_ADMIN);
    const taToken = token(tohfaAdminId, RoleCode.TOHFA_ADMIN);
    const faToken = token(farmerAdminId, RoleCode.FARMER_ADMIN);
    const farmerToken = token(farmerUserId, RoleCode.FARMER, { farmerId });
    const customerToken = token(customerUserId, RoleCode.CUSTOMER);

    const code1 = `INP-${newId().slice(0, 6).toUpperCase()}`;
    const code2 = `INP-${newId().slice(0, 6).toUpperCase()}`;

    // FARMER & FARMER_ADMIN cannot create/edit/delete -> 403
    expect(
      (
        await request(server)
          .post('/v1/admin/inputs')
          .set('Authorization', `Bearer ${farmerToken}`)
          .send({ code: code1, name: 'Neem Oil', category: 'Bio-Pesticide', manufacturer: 'GreenAg' })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(server)
          .post('/v1/admin/inputs')
          .set('Authorization', `Bearer ${faToken}`)
          .send({ code: code1, name: 'Neem Oil', category: 'Bio-Pesticide', manufacturer: 'GreenAg' })
      ).status,
    ).toBe(403);
    // CUSTOMER cannot view /v1/inputs -> 403
    expect(
      (await request(server).get('/v1/inputs').set('Authorization', `Bearer ${customerToken}`)).status,
    ).toBe(403);

    // SUPER_ADMIN creates a PENDING input
    const createRes = await request(server)
      .post('/v1/admin/inputs')
      .set('Authorization', `Bearer ${saToken}`)
      .send({
        code: code1,
        name: 'Trichoderma Viride WP',
        category: 'Bio-Fungicide',
        subcategory: 'Microbial',
        farmingType: 'ORGANIC',
        manufacturer: 'Nilgiris Bio Labs',
        registrationId: 'REG-NPOP-442',
        composition: 'Trichoderma viride 1x10^8 CFU/g',
        applicableCrops: ['Potato', 'Carrot'],
        dosage: '5g/L water',
        applicationMethod: 'Soil drench',
        status: 'PENDING',
        referenceNote: 'Internal review pending lab COA',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('PENDING');
    const inputId = createRes.body.id as string;

    // Duplicate code -> 409 CONFLICT
    const dupRes = await request(server)
      .post('/v1/admin/inputs')
      .set('Authorization', `Bearer ${taToken}`)
      .send({ code: code1.toLowerCase(), name: 'Dup', category: 'Bio-Fungicide', manufacturer: 'X' });
    expect(dupRes.status).toBe(409);

    // Farmer view does NOT show PENDING input yet (both list & detail 404)
    const farmerListBefore = await request(server)
      .get(`/v1/inputs?search=${encodeURIComponent(code1)}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(farmerListBefore.status).toBe(200);
    expect(farmerListBefore.body.items).toEqual([]);

    const farmerDetailPending = await request(server)
      .get(`/v1/inputs/${inputId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(farmerDetailPending.status).toBe(404);

    // TOHFA_ADMIN approves it -> status APPROVED + approvedBy set
    const approveRes = await request(server)
      .patch(`/v1/admin/inputs/${inputId}`)
      .set('Authorization', `Bearer ${taToken}`)
      .send({ status: 'APPROVED', statusReason: 'NPOP COA verified' });
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('APPROVED');
    expect(approveRes.body.approvedBy).toBe(tohfaAdminId);

    // Now Farmer sees it via GET /v1/inputs WITHOUT admin metadata (BR-16)
    const farmerListAfter = await request(server)
      .get(`/v1/inputs?search=${encodeURIComponent(code1)}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(farmerListAfter.status).toBe(200);
    expect(farmerListAfter.body.items).toHaveLength(1);
    expect(farmerListAfter.body.items[0]).toMatchObject({ id: inputId, code: code1, status: 'APPROVED' });
    expect(farmerListAfter.body.items[0]).not.toHaveProperty('referenceNote');
    expect(farmerListAfter.body.items[0]).not.toHaveProperty('statusReason');
    expect(farmerListAfter.body.items[0]).not.toHaveProperty('approvedBy');

    const farmerDetailOk = await request(server)
      .get(`/v1/inputs/${inputId}`)
      .set('Authorization', `Bearer ${farmerToken}`);
    expect(farmerDetailOk.status).toBe(200);
    expect(farmerDetailOk.body).not.toHaveProperty('referenceNote');

    // Also test soft-delete by SA
    const create2 = await request(server)
      .post('/v1/admin/inputs')
      .set('Authorization', `Bearer ${saToken}`)
      .send({ code: code2, name: 'Neem Cake', category: 'Soil Amendment', manufacturer: 'Kovai Bio' });
    expect(create2.status).toBe(201);
    const input2Id = create2.body.id as string;

    const delRes = await request(server)
      .delete(`/v1/admin/inputs/${input2Id}`)
      .set('Authorization', `Bearer ${saToken}`);
    expect(delRes.status).toBe(204);

    // Verify audit_log rows
    const auditRes = await pool.query<{ action_code: string }>(
      `SELECT action_code FROM audit_log WHERE entity_type = 'approved_input' AND entity_id = $1 ORDER BY created_at ASC`,
      [inputId],
    );
    expect(auditRes.rows.map((r) => r.action_code)).toEqual(['inputs.create', 'inputs.update']);
  });
});
