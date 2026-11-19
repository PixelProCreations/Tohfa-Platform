import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { pool } from '../../db/pool.js';
import { RoleCode } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import { IDS } from '../../test/factories.js';

describe('BR-167: warehouse staff details (bank account, documents, emergency contact)', () => {
  const app = createApp();
  const superAdminToken = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
    farmerId: null,
    customerId: null,
  });

  const getSeedWarehouseId = async (): Promise<string> => {
    const res = await pool.query<{ id: string }>("SELECT id FROM warehouses WHERE code = 'WH-OOTY' LIMIT 1");
    return res.rows[0]!.id;
  };

  const createTestStaff = async (warehouseId: string) => {
    const res = await request(app)
      .post('/v1/admin/warehouse-staff')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        fullName: 'Ravi Kumar',
        designation: 'Floor Manager',
        warehouseId,
        joinedOn: '2026-01-15',
        status: 'ACTIVE',
      });
    expect(res.status).toBe(201);
    return res.body as { id: string; fullName: string };
  };

  it('BR-167a: bank account can be set and read (GET, POST, PUT)', async () => {
    const whId = await getSeedWarehouseId();
    const staff = await createTestStaff(whId);

    // Initial GET should return 404 or null
    const getRes1 = await request(app)
      .get(`/v1/admin/warehouse-staff/${staff.id}/bank-account`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(getRes1.status).toBe(404);

    // POST invalid body should fail 422
    const badPost = await request(app)
      .post(`/v1/admin/warehouse-staff/${staff.id}/bank-account`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ accountHolderName: '' });
    expect(badPost.status).toBe(422);

    // POST valid bank account
    const postRes = await request(app)
      .post(`/v1/admin/warehouse-staff/${staff.id}/bank-account`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        accountHolderName: 'Ravi Kumar',
        accountNumber: '123456789012',
        ifsc: 'SBIN0001234',
        bankName: 'State Bank of India',
        branchName: 'Ooty Main',
      });
    expect(postRes.status).toBe(201);
    expect(postRes.body.accountHolderName).toBe('Ravi Kumar');
    expect(postRes.body.accountNumber).toBe('123456789012');

    // PUT to update bank account
    const putRes = await request(app)
      .put(`/v1/admin/warehouse-staff/${staff.id}/bank-account`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        accountHolderName: 'Ravi K',
        accountNumber: '123456789099',
        ifsc: 'HDFC0001234',
        bankName: 'HDFC Bank',
        branchName: 'Coonoor Branch',
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.bankName).toBe('HDFC Bank');

    // GET returns updated account
    const getRes2 = await request(app)
      .get(`/v1/admin/warehouse-staff/${staff.id}/bank-account`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(getRes2.status).toBe(200);
    expect(getRes2.body.accountHolderName).toBe('Ravi K');
    expect(getRes2.body.ifsc).toBe('HDFC0001234');
  });

  it('BR-167b: staff documents can be added and listed (GET, POST)', async () => {
    const whId = await getSeedWarehouseId();
    const staff = await createTestStaff(whId);

    // Initial GET returns empty array
    const get1 = await request(app)
      .get(`/v1/admin/warehouse-staff/${staff.id}/documents`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(get1.status).toBe(200);
    expect(get1.body.items).toEqual([]);

    // Invalid document type returns 422
    const badDoc = await request(app)
      .post(`/v1/admin/warehouse-staff/${staff.id}/documents`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        type: 'INVALID_DOC',
        documentNumber: '1234',
        fileUrl: 'https://example.com/doc.pdf',
      });
    expect(badDoc.status).toBe(422);

    // POST valid document
    const postDoc = await request(app)
      .post(`/v1/admin/warehouse-staff/${staff.id}/documents`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        type: 'AADHAAR',
        documentNumber: '1234-5678-9012',
        fileUrl: 'https://storage.example.com/aadhaar.pdf',
      });
    expect(postDoc.status).toBe(201);
    expect(postDoc.body.type).toBe('AADHAAR');

    // GET lists the document
    const get2 = await request(app)
      .get(`/v1/admin/warehouse-staff/${staff.id}/documents`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(get2.status).toBe(200);
    expect(get2.body.items).toHaveLength(1);
    expect(get2.body.items[0].documentNumber).toBe('1234-5678-9012');
  });

  it('BR-167c: emergency contact can be set and updated (GET, PUT)', async () => {
    const whId = await getSeedWarehouseId();
    const staff = await createTestStaff(whId);

    // Initial GET returns 404
    const get1 = await request(app)
      .get(`/v1/admin/warehouse-staff/${staff.id}/emergency-contact`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(get1.status).toBe(404);

    // PUT invalid mobile returns 422
    const badPut = await request(app)
      .put(`/v1/admin/warehouse-staff/${staff.id}/emergency-contact`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Anita',
        relationship: 'Spouse',
        mobile: '123',
      });
    expect(badPut.status).toBe(422);

    // PUT valid emergency contact
    const putRes = await request(app)
      .put(`/v1/admin/warehouse-staff/${staff.id}/emergency-contact`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Anita Kumar',
        relationship: 'Spouse',
        mobile: '+919876543210',
      });
    expect(putRes.status).toBe(200);
    expect(putRes.body.name).toBe('Anita Kumar');
    expect(putRes.body.relationship).toBe('Spouse');

    // GET returns contact
    const get2 = await request(app)
      .get(`/v1/admin/warehouse-staff/${staff.id}/emergency-contact`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(get2.status).toBe(200);
    expect(get2.body.mobile).toBe('+919876543210');
  });
});
