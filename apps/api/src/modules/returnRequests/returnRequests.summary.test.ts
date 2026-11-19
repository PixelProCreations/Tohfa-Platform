import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { RoleCode } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import { IDS } from '../../test/factories.js';

describe('BR-168: returns summary (GET /admin/returns/summary)', () => {
  const app = createApp();
  const superAdminToken = signAccessToken({
    sub: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
    farmerId: null,
    customerId: null,
  });

  it('BR-168a: returns 200 with total and status counts', async () => {
    const res = await request(app)
      .get('/v1/admin/returns/summary')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('pending');
    expect(res.body).toHaveProperty('inspecting');
    expect(res.body).toHaveProperty('approved');
    expect(res.body).toHaveProperty('rejected');
    expect(res.body).toHaveProperty('refunded');
    expect(typeof res.body.total).toBe('number');
    expect(typeof res.body.pending).toBe('number');
  });

  it('BR-168b: validates date range (from <= to)', async () => {
    const res = await request(app)
      .get('/v1/admin/returns/summary?from=2026-12-31&to=2026-01-01')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(422);
  });
});
