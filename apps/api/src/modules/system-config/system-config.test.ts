/**
 * System Config Read & Edit (BR-242 — D12):
 *  - GET /v1/admin/system-config (system.config.manage — SUPER_ADMIN only)
 *  - PATCH /v1/admin/system-config/:key (whitelist only, type/range validated, audit_log)
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

describeIfDatabase('System Config Admin API (BR-242)', () => {
  let server: Server;
  let ready = false;
  let originalValue: unknown;

  const superAdminId = newId();
  const tohfaAdminId = newId();
  const farmerAdminId = newId();

  const token = (userId: string, roleCode: RoleCode) =>
    signAccessToken({
      sub: userId,
      roles: [{ code: roleCode }],
      farmerId: null,
      customerId: null,
    });

  beforeAll(async () => {
    try {
      const check = await pool.query<{ value: unknown }>(
        `SELECT value FROM system_config WHERE key = 'counter_offer_window_hours' LIMIT 1`,
      );
      if (check.rows.length === 0) return;
      originalValue = check.rows[0]!.value;
      ready = true;
    } catch {
      return;
    }

    const app = createApp();
    server = app.listen(0);

    for (const [id, name] of [
      [superAdminId, 'SA Config'],
      [tohfaAdminId, 'TA Config'],
      [farmerAdminId, 'FA Config'],
    ] as const) {
      await pool.query(
        `INSERT INTO users (id, full_name, mobile, user_type, status) VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE')`,
        [id, name, randomMobile()],
      );
    }
  });

  afterAll(async () => {
    if (ready && originalValue !== undefined) {
      await pool.query(`UPDATE system_config SET value = $1::jsonb WHERE key = 'counter_offer_window_hours'`, [
        JSON.stringify(originalValue),
      ]);
    }
    server?.close();
  });

  it('BR-242: SUPER_ADMIN reads and updates safe business keys with type/range checks and audit_log; TOHFA_ADMIN is 403; read-only keys rejected', async (ctx) => {
    if (!ready) return ctx.skip();

    const saToken = token(superAdminId, RoleCode.SUPER_ADMIN);
    const taToken = token(tohfaAdminId, RoleCode.TOHFA_ADMIN);
    const faToken = token(farmerAdminId, RoleCode.FARMER_ADMIN);

    // Non-SA roles rejected (403)
    expect(
      (await request(server).get('/v1/admin/system-config').set('Authorization', `Bearer ${taToken}`)).status,
    ).toBe(403);
    expect(
      (await request(server).get('/v1/admin/system-config').set('Authorization', `Bearer ${faToken}`)).status,
    ).toBe(403);

    // SA lists config items with isEditable flags
    const listRes = await request(server)
      .get('/v1/admin/system-config')
      .set('Authorization', `Bearer ${saToken}`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.items)).toBe(true);
    const cow = listRes.body.items.find((i: { key: string }) => i.key === 'counter_offer_window_hours');
    expect(cow).toMatchObject({ key: 'counter_offer_window_hours', dataType: 'number', isEditable: true });
    const otp = listRes.body.items.find((i: { key: string }) => i.key === 'otp_max_attempts');
    expect(otp?.isEditable).toBe(false);

    // Read-only key rejected (403)
    const roRes = await request(server)
      .patch('/v1/admin/system-config/otp_max_attempts')
      .set('Authorization', `Bearer ${saToken}`)
      .send({ value: 99, reason: 'Try override' });
    expect(roRes.status).toBe(403);

    // Unknown key -> 404
    const missingRes = await request(server)
      .patch('/v1/admin/system-config/nonexistent_key_xyz')
      .set('Authorization', `Bearer ${saToken}`)
      .send({ value: 10, reason: 'Check unknown' });
    expect(missingRes.status).toBe(404);

    // Type mismatch -> 422
    const badType = await request(server)
      .patch('/v1/admin/system-config/counter_offer_window_hours')
      .set('Authorization', `Bearer ${saToken}`)
      .send({ value: 'not-a-number', reason: 'Type check' });
    expect(badType.status).toBe(422);

    // Out-of-range percentage -> 422
    const badPct = await request(server)
      .patch('/v1/admin/system-config/retail_gst_rate_percent')
      .set('Authorization', `Bearer ${saToken}`)
      .send({ value: 150, reason: 'Out of range pct' });
    expect(badPct.status).toBe(422);

    // Valid edit succeeds (200) and writes audit_log
    const okRes = await request(server)
      .patch('/v1/admin/system-config/counter_offer_window_hours')
      .set('Authorization', `Bearer ${saToken}`)
      .send({ value: 36, reason: 'Extend farmer negotiation window for holiday season' });
    expect(okRes.status).toBe(200);
    expect(okRes.body.value).toBe(36);

    const auditRes = await pool.query<{ action_code: string }>(
      `SELECT action_code FROM audit_log WHERE entity_type = 'system_config' AND actor_id = $1`,
      [superAdminId],
    );
    expect(auditRes.rows.map((r) => r.action_code)).toContain('system_config.update');
  });
});
