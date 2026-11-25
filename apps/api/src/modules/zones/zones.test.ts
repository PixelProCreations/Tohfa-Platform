import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { randomMobile } from '../../test/dbFixtures.js';
import { deriveShortCode, maskMobile, zonesService } from './zones.service.js';

describe('Zones Unit Logic', () => {
  it('deriveShortCode strips ZONE prefix and returns 3-char uppercase short code', () => {
    expect(deriveShortCode('ZONE-OOTY')).toBe('OOT');
    expect(deriveShortCode('ZONE-COON')).toBe('COO');
    expect(deriveShortCode('ZONE-KOTA')).toBe('KOT');
    expect(deriveShortCode('ZONE-GUDA')).toBe('GUD');
    expect(deriveShortCode('ZONE_TEST')).toBe('TES');
    expect(deriveShortCode('DEMO-ZONE')).toBe('DEM');
    expect(deriveShortCode('AB')).toBe('AB');
  });

  it('maskMobile masks all but the last 4 digits per BR-92', () => {
    expect(maskMobile('+919876543210')).toBe('*********3210');
    expect(maskMobile('1234')).toBe('****');
    expect(maskMobile('12')).toBe('**');
    expect(maskMobile('')).toBe('');
  });
});

describeIfDatabase('Zones Module (BR-161 Priority 1)', () => {
  const app = createApp();
  let ready = false;

  let superAdminToken: string;
  let tohfaAdminToken: string;
  let mainWhAdminToken: string;
  let subWhAdminToken: string;
  let farmerToken: string;
  let customerToken: string;
  let farmerAdminUserId: string;
  let farmerAdminToken: string;

  let ootyZoneId: string;
  let ootyWarehouseId: string;
  let kotagiriZoneId: string;
  let kotagiriWarehouseId: string;
  let gudalurZoneId: string;

  const createdUserIds: string[] = [];
  const createdZoneIds: string[] = [];

  beforeAll(async () => {
    ready = await databaseReady('zones');
    if (!ready) return;

    // Retrieve canonical seed zones and warehouses
    const ootyRes = await pool.query<{ id: string; warehouse_id: string }>(
      `SELECT id, warehouse_id FROM zones WHERE code = 'ZONE-OOTY' LIMIT 1`,
    );
    ootyZoneId = ootyRes.rows[0]!.id;
    ootyWarehouseId = ootyRes.rows[0]!.warehouse_id;

    const kotagiriRes = await pool.query<{ id: string; warehouse_id: string }>(
      `SELECT id, warehouse_id FROM zones WHERE code = 'ZONE-KOTA' LIMIT 1`,
    );
    kotagiriZoneId = kotagiriRes.rows[0]!.id;
    kotagiriWarehouseId = kotagiriRes.rows[0]!.warehouse_id;

    const gudalurRes = await pool.query<{ id: string }>(
      `SELECT id FROM zones WHERE code = 'ZONE-GUDA' LIMIT 1`,
    );
    gudalurZoneId = gudalurRes.rows[0]!.id;

    // Helper to create test user and token
    const makeUserWithRole = async (
      roleCode: RoleCode,
      fullName: string,
      userType: 'ADMIN' | 'FARMER' | 'CUSTOMER',
      extraRoleFields: { warehouseId?: string; zoneId?: string } = {},
    ): Promise<{ userId: string; token: string }> => {
      const userId = newId();
      createdUserIds.push(userId);
      await pool.query(
        `INSERT INTO users (id, mobile, user_type, full_name, status) VALUES ($1, $2, $3, $4, 'ACTIVE')`,
        [userId, randomMobile(), userType, fullName],
      );

      const roleRes = await pool.query<{ id: string }>(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
      const roleId = roleRes.rows[0]!.id;

      await pool.query(
        `INSERT INTO user_roles (user_id, role_id, role_code, warehouse_id, zone_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, roleId, roleCode, extraRoleFields.warehouseId ?? null, extraRoleFields.zoneId ?? null],
      );

      const token = signAccessToken({
        sub: userId,
        roles: [
          {
            code: roleCode,
            ...(extraRoleFields.warehouseId ? { warehouseId: extraRoleFields.warehouseId } : {}),
            ...(extraRoleFields.zoneId ? { zoneId: extraRoleFields.zoneId } : {}),
          },
        ],
        customerId: userType === 'CUSTOMER' ? newId() : null,
        farmerId: userType === 'FARMER' ? newId() : null,
      });

      return { userId, token };
    };

    const sa = await makeUserWithRole(RoleCode.SUPER_ADMIN, 'Super Admin Zone Test', 'ADMIN');
    superAdminToken = sa.token;

    const ta = await makeUserWithRole(RoleCode.TOHFA_ADMIN, 'Tohfa Admin Zone Test', 'ADMIN');
    tohfaAdminToken = ta.token;

    const mw = await makeUserWithRole(RoleCode.MAIN_WH_ADMIN, 'Main WH Admin Zone Test', 'ADMIN', {
      warehouseId: ootyWarehouseId,
    });
    mainWhAdminToken = mw.token;

    const sw = await makeUserWithRole(RoleCode.SUB_WH_ADMIN, 'Sub WH Admin Zone Test', 'ADMIN', {
      warehouseId: kotagiriWarehouseId,
    });
    subWhAdminToken = sw.token;

    const fa = await makeUserWithRole(RoleCode.FARMER_ADMIN, 'Kotagiri FA Zone Test', 'ADMIN', {
      zoneId: kotagiriZoneId,
    });
    farmerAdminUserId = fa.userId;
    farmerAdminToken = fa.token;

    const farmer = await makeUserWithRole(RoleCode.FARMER, 'Farmer Zone Test', 'FARMER');
    farmerToken = farmer.token;

    const customer = await makeUserWithRole(RoleCode.CUSTOMER, 'Customer Zone Test', 'CUSTOMER');
    customerToken = customer.token;
  });

  afterAll(async () => {
    if (!ready) return;

    if (createdUserIds.length > 0) {
      await pool.query(`DELETE FROM user_roles WHERE user_id = ANY($1::uuid[])`, [createdUserIds]);
      await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [createdUserIds]);
    }

    if (createdZoneIds.length > 0) {
      await pool.query(`DELETE FROM zone_taluks WHERE zone_id = ANY($1::uuid[])`, [createdZoneIds]);
      await pool.query(`DELETE FROM zones WHERE id = ANY($1::uuid[])`, [createdZoneIds]);
    }
  });

  describe('BR-161a: GET /admin/zones (List)', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get('/v1/admin/zones');
      expect(res.status).toBe(401);
    });

    it('returns 403 when called by FARMER or CUSTOMER', async () => {
      const farmerRes = await request(app)
        .get('/v1/admin/zones')
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(farmerRes.status).toBe(403);

      const customerRes = await request(app)
        .get('/v1/admin/zones')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(customerRes.status).toBe(403);
    });

    it('returns 200 for SUPER_ADMIN, TOHFA_ADMIN, MAIN_WH_ADMIN, and SUB_WH_ADMIN with all zones', async () => {
      for (const token of [superAdminToken, tohfaAdminToken, mainWhAdminToken, subWhAdminToken]) {
        const res = await request(app)
          .get('/v1/admin/zones')
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(4);
      }
    });

    it('enforces strict allow-list keys on every zone item (never leaks internal or manager fields)', async () => {
      const res = await request(app)
        .get('/v1/admin/zones')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);

      const expectedKeys = [
        'code',
        'createdAt',
        'description',
        'id',
        'isActive',
        'name',
        'shortCode',
        'taluks',
        'warehouseId',
        'warehouseName',
      ].sort();

      for (const item of res.body) {
        expect(Object.keys(item).sort()).toEqual(expectedKeys);
        expect(item).not.toHaveProperty('manager');
        expect(item).not.toHaveProperty('deleted_at');
        expect(item).not.toHaveProperty('updated_at');
      }
    });

    it('includes all 4 canonical seed zones with correctly derived shortCode', async () => {
      const res = await request(app)
        .get('/v1/admin/zones')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);

      const ooty = res.body.find((z: { code: string }) => z.code === 'ZONE-OOTY');
      expect(ooty).toBeDefined();
      expect(ooty.shortCode).toBe('OOT');
      expect(ooty.name).toBe('Ooty Zone');
      expect(ooty.warehouseId).toBe(ootyWarehouseId);

      const coon = res.body.find((z: { code: string }) => z.code === 'ZONE-COON');
      expect(coon).toBeDefined();
      expect(coon.shortCode).toBe('COO');

      const kota = res.body.find((z: { code: string }) => z.code === 'ZONE-KOTA');
      expect(kota).toBeDefined();
      expect(kota.shortCode).toBe('KOT');

      const guda = res.body.find((z: { code: string }) => z.code === 'ZONE-GUDA');
      expect(guda).toBeDefined();
      expect(guda.shortCode).toBe('GUD');
    });

    it('aggregates mapped taluks ordered alphabetically from zone_taluks', async () => {
      const res = await request(app)
        .get('/v1/admin/zones')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);

      const ooty = res.body.find((z: { code: string }) => z.code === 'ZONE-OOTY');
      expect(ooty.taluks).toEqual(['Kundah', 'Ooty', 'Udhagamandalam']);

      const guda = res.body.find((z: { code: string }) => z.code === 'ZONE-GUDA');
      expect(guda.taluks).toEqual(['Gudalur', 'Pandalur']);

      const kota = res.body.find((z: { code: string }) => z.code === 'ZONE-KOTA');
      expect(kota.taluks).toEqual(['Kotagiri']);
    });

    it('filters by warehouseId when requested', async () => {
      const res = await request(app)
        .get(`/v1/admin/zones?warehouseId=${ootyWarehouseId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      for (const item of res.body) {
        expect(item.warehouseId).toBe(ootyWarehouseId);
      }
    });

    it('filters by status: ACTIVE (default), INACTIVE, and ALL', async () => {
      // Create an inactive fixture zone
      const inactiveZoneId = newId();
      createdZoneIds.push(inactiveZoneId);
      await pool.query(
        `INSERT INTO zones (id, code, name, warehouse_id, is_active)
         VALUES ($1, 'ZONE-TEST-INACT', 'Inactive Test Zone', $2, false)`,
        [inactiveZoneId, ootyWarehouseId],
      );

      // Default should not include inactive zone
      const defaultRes = await request(app)
        .get('/v1/admin/zones')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(defaultRes.status).toBe(200);
      expect(defaultRes.body.some((z: { id: string }) => z.id === inactiveZoneId)).toBe(false);

      // ?status=ACTIVE should not include inactive zone
      const activeRes = await request(app)
        .get('/v1/admin/zones?status=ACTIVE')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(activeRes.status).toBe(200);
      expect(activeRes.body.some((z: { id: string }) => z.id === inactiveZoneId)).toBe(false);

      // ?status=INACTIVE should include inactive zone
      const inactiveRes = await request(app)
        .get('/v1/admin/zones?status=INACTIVE')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(inactiveRes.status).toBe(200);
      expect(inactiveRes.body.some((z: { id: string }) => z.id === inactiveZoneId)).toBe(true);
      for (const z of inactiveRes.body) {
        expect(z.isActive).toBe(false);
      }

      // ?status=ALL should include both active and inactive
      const allRes = await request(app)
        .get('/v1/admin/zones?status=ALL')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(allRes.status).toBe(200);
      expect(allRes.body.some((z: { id: string }) => z.id === inactiveZoneId)).toBe(true);
      expect(allRes.body.some((z: { id: string }) => z.id === ootyZoneId)).toBe(true);
    });

    it('FARMER_ADMIN sees only their assigned zone in the list', async () => {
      const res = await request(app)
        .get('/v1/admin/zones')
        .set('Authorization', `Bearer ${farmerAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(kotagiriZoneId);
      expect(res.body[0].code).toBe('ZONE-KOTA');
    });

    it('FARMER_ADMIN with no assigned zone returns empty list', async () => {
      const emptyScopeFa = {
        userId: newId(),
        roleCode: 'FARMER_ADMIN' as const,
        level: ScopeLevel.OWN,
        permission: 'zone.view',
        warehouseIds: [],
        zoneIds: [],
      };
      const result = await zonesService.list(emptyScopeFa, {});
      expect(result).toEqual([]);
    });
  });

  describe('BR-161b: GET /admin/zones/:id (Detail)', () => {
    it('returns 401 when unauthenticated', async () => {
      const res = await request(app).get(`/v1/admin/zones/${ootyZoneId}`);
      expect(res.status).toBe(401);
    });

    it('returns 403 when called by FARMER or CUSTOMER', async () => {
      const res1 = await request(app)
        .get(`/v1/admin/zones/${ootyZoneId}`)
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .get(`/v1/admin/zones/${ootyZoneId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res2.status).toBe(403);
    });

    it('returns 404 for unknown zone UUID', async () => {
      const unknownId = newId();
      const res = await request(app)
        .get(`/v1/admin/zones/${unknownId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(404);
    });

    it('returns 404 for soft-deleted zone', async () => {
      const deletedZoneId = newId();
      createdZoneIds.push(deletedZoneId);
      await pool.query(
        `INSERT INTO zones (id, code, name, warehouse_id, is_active, deleted_at)
         VALUES ($1, 'ZONE-DEL-TEST', 'Deleted Test Zone', $2, false, now())`,
        [deletedZoneId, ootyWarehouseId],
      );

      const res = await request(app)
        .get(`/v1/admin/zones/${deletedZoneId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(404);
    });

    it('enforces strict allow-list keys on zone detail (including manager)', async () => {
      const res = await request(app)
        .get(`/v1/admin/zones/${kotagiriZoneId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);

      const expectedKeys = [
        'code',
        'createdAt',
        'description',
        'id',
        'isActive',
        'manager',
        'name',
        'shortCode',
        'taluks',
        'warehouseId',
        'warehouseName',
      ].sort();

      expect(Object.keys(res.body).sort()).toEqual(expectedKeys);
      expect(res.body.code).toBe('ZONE-KOTA');
      expect(res.body.shortCode).toBe('KOT');
      expect(res.body.taluks).toEqual(['Kotagiri']);
    });

    it('resolves active zone manager and masks mobile per BR-92 (*********XXXX)', async () => {
      // kotagiriZoneId has farmerAdminUserId assigned in beforeAll
      const res = await request(app)
        .get(`/v1/admin/zones/${kotagiriZoneId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);

      expect(res.body.manager).not.toBeNull();
      expect(res.body.manager.userId).toBe(farmerAdminUserId);
      expect(res.body.manager.fullName).toBe('Kotagiri FA Zone Test');
      expect(res.body.manager.mobile).toMatch(/^\*+[0-9]{4}$/);
      expect(res.body.manager.mobile).toHaveLength(13); // +91XXXXXXXXXX
    });

    it('returns manager: null when no active Farmer Admin is assigned to the zone', async () => {
      const res = await request(app)
        .get(`/v1/admin/zones/${gudalurZoneId}`)
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.manager).toBeNull();
    });

    it('FARMER_ADMIN: cross-scope read returns 404 NOT FOUND, never 403', async () => {
      // farmerAdminToken is assigned to kotagiriZoneId only
      // 1. Reading own zone succeeds (200)
      const ownRes = await request(app)
        .get(`/v1/admin/zones/${kotagiriZoneId}`)
        .set('Authorization', `Bearer ${farmerAdminToken}`);
      expect(ownRes.status).toBe(200);
      expect(ownRes.body.id).toBe(kotagiriZoneId);

      // 2. Reading out-of-scope zone (Ooty) returns 404 NOT_FOUND, NOT 403!
      const outOfScopeRes = await request(app)
        .get(`/v1/admin/zones/${ootyZoneId}`)
        .set('Authorization', `Bearer ${farmerAdminToken}`);
      expect(outOfScopeRes.status).toBe(404);
      expect(outOfScopeRes.body.code).toBe('NOT_FOUND');
    });
  });

  describe('BR-143: GET /v1/zones (Public List)', () => {
    it('returns 200 without authentication (security: [])', async () => {
      const res = await request(app).get('/v1/zones');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(4);
    });

    it('exposes only the minimum fields (id, name, warehouseTown) on every item and no sensitive data', async () => {
      const res = await request(app).get('/v1/zones');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(4);

      for (const item of res.body) {
        expect(Object.keys(item).sort()).toEqual(['id', 'name', 'warehouseTown'].sort());
        expect(typeof item.id).toBe('string');
        expect(typeof item.name).toBe('string');
        expect(typeof item.warehouseTown).toBe('string');
        expect(item).not.toHaveProperty('code');
        expect(item).not.toHaveProperty('shortCode');
        expect(item).not.toHaveProperty('manager');
        expect(item).not.toHaveProperty('warehouseId');
        expect(item).not.toHaveProperty('taluks');
      }
    });

    it('returns all 4 canonical warehouse zones with their warehouse towns', async () => {
      const res = await request(app).get('/v1/zones');
      expect(res.status).toBe(200);

      const towns = res.body.map((z: { warehouseTown: string }) => z.warehouseTown);
      expect(towns).toContain('Udhagamandalam');
      expect(towns).toContain('Coonoor');
      expect(towns).toContain('Kotagiri');
      expect(towns).toContain('Gudalur');
    });
  });
});
