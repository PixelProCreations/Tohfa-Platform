import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { closePool, pool } from '../../db/pool.js';
import { describeIfDatabase } from '../../test/factories.js';
import { randomMobile, requireDatabaseTables } from '../../test/dbFixtures.js';

/**
 * BR-82a-e: PATCH /v1/auth/me, the admin's own-profile edit.
 *
 * Only `fullName` and `preferredLocale` are editable. `mobile` and `email` are
 * the locked identity fields of BR-33 and are refused with 403 FIELD_LOCKED,
 * every other key is a 422. All of it runs through the real router and a real
 * database: the permission matrix, the UPDATE and the audit row are SQL and
 * middleware behaviour a mocked repo could not prove.
 *
 * Users are left behind on purpose: audit_log is append-only and references
 * them, so they can never be deleted (the run database is disposable).
 */

const ADMIN_ROLES = [
  RoleCode.SUPER_ADMIN,
  RoleCode.TOHFA_ADMIN,
  RoleCode.FARMER_ADMIN,
  RoleCode.MAIN_WH_ADMIN,
  RoleCode.SUB_WH_ADMIN,
] as const;

const app = createApp();

function tokenFor(userId: string, role: RoleCode): string {
  return signAccessToken({ sub: userId, roles: [{ code: role }], farmerId: null, customerId: null });
}

interface Problem {
  code?: string;
  status?: number;
}

describeIfDatabase('BR-82: PATCH /v1/auth/me (real database, real router)', () => {
  const failTriggerNames: string[] = [];

  async function createUser(
    userType: 'ADMIN' | 'FARMER' | 'CUSTOMER' = 'ADMIN',
    fullName = 'BR-82 Original Name',
    email: string | null = null,
  ): Promise<{ id: string; mobile: string }> {
    const mobile = randomMobile();
    // Unique per call: uq_users_email_live is global and users outlive the run.
    const uniqueEmail = email === null ? null : `${randomUUID()}-${email}`;
    const result = await pool.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status, email)
       VALUES ($1, $2, $3::user_type, 'ACTIVE', $4)
       RETURNING id`,
      [mobile, fullName, userType, uniqueEmail],
    );
    return { id: result.rows[0]!.id, mobile };
  }

  async function userRow(id: string): Promise<{
    full_name: string;
    preferred_locale: string;
    mobile: string;
    email: string | null;
    status: string;
    user_type: string;
  }> {
    const result = await pool.query<{
      full_name: string;
      preferred_locale: string;
      mobile: string;
      email: string | null;
      status: string;
      user_type: string;
    }>('SELECT full_name, preferred_locale, mobile, email, status, user_type FROM users WHERE id = $1', [id]);
    return result.rows[0]!;
  }

  async function auditRows(userId: string): Promise<
    Array<{
      actor_id: string;
      actor_role: string | null;
      action_code: string;
      entity_type: string;
      entity_id: string;
      before: unknown;
      after: unknown;
      changed_fields: string[] | null;
    }>
  > {
    const result = await pool.query<{
      actor_id: string;
      actor_role: string | null;
      action_code: string;
      entity_type: string;
      entity_id: string;
      before: unknown;
      after: unknown;
      changed_fields: string[] | null;
    }>(
      `SELECT actor_id, actor_role, action_code, entity_type, entity_id, before, after, changed_fields
         FROM audit_log
        WHERE actor_id = $1 AND action_code = 'auth.profile.update_own'
        ORDER BY created_at`,
      [userId],
    );
    return result.rows;
  }

  beforeAll(async () => {
    expect(await requireDatabaseTables('users', 'audit_log')).toBe(true);
  });

  afterAll(async () => {
    for (const name of failTriggerNames) {
      await pool.query(`DROP TRIGGER IF EXISTS ${name} ON audit_log`);
    }
    await pool.query('DROP FUNCTION IF EXISTS br82_fail_audit()');
    await closePool();
  });

  describe('BR-82a: who may call it', () => {
    it('BR-82a: rejects a request with no token with 401', async () => {
      const res = await request(app).patch('/v1/auth/me').send({ fullName: 'Anyone' });
      expect(res.status).toBe(401);
    });

    it.each(ADMIN_ROLES)('BR-82a: %s may edit their own profile (200)', async (role) => {
      const user = await createUser();
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, role)}`)
        .send({ fullName: `Renamed ${role}` });
      expect(res.status).toBe(200);
      expect((res.body as { fullName: string }).fullName).toBe(`Renamed ${role}`);
    });

    it.each([
      [RoleCode.FARMER, 'FARMER'],
      [RoleCode.CUSTOMER, 'CUSTOMER'],
    ] as const)('BR-82a: %s is refused with 403 and nothing changes', async (role, userType) => {
      const user = await createUser(userType, 'BR-82 Untouched');
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, role)}`)
        .send({ fullName: 'Hijacked' });
      expect(res.status).toBe(403);
      expect((await userRow(user.id)).full_name).toBe('BR-82 Untouched');
      expect(await auditRows(user.id)).toHaveLength(0);
    });
  });

  describe('BR-82b: the edit', () => {
    it('BR-82b: changes the name, trims it, leaves every other column alone and returns the GET /auth/me shape', async () => {
      const user = await createUser('ADMIN', 'BR-82 Before', 'before@example.test');
      const before = await userRow(user.id);
      const token = tokenFor(user.id, RoleCode.MAIN_WH_ADMIN);

      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullName: '  BR-82 After  ' });

      expect(res.status).toBe(200);
      const after = await userRow(user.id);
      expect(after.full_name).toBe('BR-82 After');
      expect(after.mobile).toBe(before.mobile);
      expect(after.email).toBe(before.email);
      expect(after.status).toBe(before.status);
      expect(after.user_type).toBe(before.user_type);
      expect(after.preferred_locale).toBe(before.preferred_locale);

      const me = await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${token}`);
      expect(me.status).toBe(200);
      expect(Object.keys(res.body as object).sort()).toEqual(Object.keys(me.body as object).sort());
      expect(res.body).toEqual(me.body);
    });

    it('BR-82b: only the fields that were sent change (locale only keeps the name)', async () => {
      const user = await createUser('ADMIN', 'BR-82 Keep Me');
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.SUB_WH_ADMIN)}`)
        .send({ preferredLocale: 'ta' });
      expect(res.status).toBe(200);
      const row = await userRow(user.id);
      expect(row.full_name).toBe('BR-82 Keep Me');
      expect(row.preferred_locale).toBe('ta');
      expect((res.body as { preferredLocale: string }).preferredLocale).toBe('ta');
    });

    it('BR-82e: rejects a locale outside en/ta with 422 and changes nothing', async () => {
      const user = await createUser('ADMIN', 'BR-82 Locale');
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.SUPER_ADMIN)}`)
        .send({ preferredLocale: 'fr' });
      expect(res.status).toBe(422);
      expect((await userRow(user.id)).preferred_locale).toBe('en');
    });

    it('BR-82e: accepts both valid locales', async () => {
      const user = await createUser();
      const token = tokenFor(user.id, RoleCode.SUPER_ADMIN);
      for (const locale of ['ta', 'en'] as const) {
        const res = await request(app).patch('/v1/auth/me').set('Authorization', `Bearer ${token}`).send({ preferredLocale: locale });
        expect(res.status).toBe(200);
        expect((await userRow(user.id)).preferred_locale).toBe(locale);
      }
    });

    it.each([
      ['an empty body', {}],
      ['a one character name', { fullName: 'A' }],
      ['a blank name', { fullName: '    ' }],
      ['a 121 character name', { fullName: 'x'.repeat(121) }],
      ['a non-string name', { fullName: 12345 }],
    ])('BR-82b: rejects %s with 422', async (_label, body) => {
      const user = await createUser('ADMIN', 'BR-82 Valid');
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.SUPER_ADMIN)}`)
        .send(body);
      expect(res.status).toBe(422);
      expect((await userRow(user.id)).full_name).toBe('BR-82 Valid');
    });
  });

  describe('BR-82c: locked and unknown fields', () => {
    it.each([
      ['mobile', { mobile: '+919999999999' }],
      ['email', { email: 'taken@example.test' }],
      ['mobile and email', { mobile: '+919999999999', email: 'taken@example.test' }],
      ['mobile null', { mobile: null }],
    ])('BR-82c: %s is FIELD_LOCKED (403), and a valid name in the same request is NOT applied either', async (_label, extra) => {
      const user = await createUser('ADMIN', 'BR-82 Locked', 'locked@example.test');
      const before = await userRow(user.id);
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.SUPER_ADMIN)}`)
        .send({ fullName: 'Should Not Apply', ...extra });
      expect(res.status).toBe(403);
      expect((res.body as Problem).code).toBe('FIELD_LOCKED');
      expect(await userRow(user.id)).toEqual(before);
      expect(await auditRows(user.id)).toHaveLength(0);
    });

    it.each([
      ['status', { status: 'DISABLED' }],
      ['roles', { roles: [{ code: 'SUPER_ADMIN' }] }],
      ['userType', { userType: 'ADMIN' }],
      ['permissions', { permissions: ['help.article.manage'] }],
      ['id', { id: randomUUID() }],
      ['an arbitrary key', { nickname: 'x' }],
    ])('BR-82c: %s is an unknown key (422) and nothing is applied', async (_label, extra) => {
      const user = await createUser('ADMIN', 'BR-82 Strict');
      const before = await userRow(user.id);
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.SUPER_ADMIN)}`)
        .send({ fullName: 'Should Not Apply', ...extra });
      expect(res.status).toBe(422);
      expect((res.body as Problem).code).toBe('VALIDATION_FAILED');
      expect(await userRow(user.id)).toEqual(before);
    });
  });

  describe('BR-82d: audit', () => {
    it('BR-82d: writes one masked audit row (field names only, never the name value)', async () => {
      const user = await createUser('ADMIN', 'BR-82 Secret Before Name');
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.TOHFA_ADMIN)}`)
        .send({ fullName: 'BR-82 Secret After Name', preferredLocale: 'ta' });
      expect(res.status).toBe(200);

      const rows = await auditRows(user.id);
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.actor_role).toBe(RoleCode.TOHFA_ADMIN);
      expect(row.entity_type).toBe('user');
      expect(row.entity_id).toBe(user.id);
      expect([...(row.changed_fields ?? [])].sort()).toEqual(['fullName', 'preferredLocale']);
      expect(row.before).toBeNull();
      expect(row.after).toBeNull();
      const serialised = JSON.stringify(row);
      expect(serialised).not.toContain('Secret');
      expect(serialised).not.toContain('BR-82 Secret');
    });

    it('BR-82d: records only the fields that actually changed', async () => {
      const user = await createUser('ADMIN', 'BR-82 Same Name');
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.SUPER_ADMIN)}`)
        .send({ fullName: 'BR-82 Same Name', preferredLocale: 'ta' });
      expect(res.status).toBe(200);
      const rows = await auditRows(user.id);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.changed_fields).toEqual(['preferredLocale']);
    });

    it('BR-82d: a no-op edit succeeds, changes nothing and writes no audit row', async () => {
      const user = await createUser('ADMIN', 'BR-82 No Op');
      const res = await request(app)
        .patch('/v1/auth/me')
        .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.SUPER_ADMIN)}`)
        .send({ fullName: 'BR-82 No Op', preferredLocale: 'en' });
      expect(res.status).toBe(200);
      expect(await auditRows(user.id)).toHaveLength(0);
    });

    it('BR-82d: the audit row is in the same transaction (a failing audit insert rolls the edit back)', async () => {
      const user = await createUser('ADMIN', 'BR-82 Atomic');
      await pool.query(`
        CREATE OR REPLACE FUNCTION br82_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'br82 forced audit failure';
        END $$`);
      const trigger = `br82_fail_${user.id.replace(/-/g, '')}`;
      failTriggerNames.push(trigger);
      await pool.query(
        `CREATE TRIGGER ${trigger} BEFORE INSERT ON audit_log
           FOR EACH ROW WHEN (NEW.actor_id = '${user.id}') EXECUTE FUNCTION br82_fail_audit()`,
      );
      try {
        const res = await request(app)
          .patch('/v1/auth/me')
          .set('Authorization', `Bearer ${tokenFor(user.id, RoleCode.SUPER_ADMIN)}`)
          .send({ fullName: 'BR-82 Must Roll Back' });
        expect(res.status).toBe(500);
        expect((await userRow(user.id)).full_name).toBe('BR-82 Atomic');
      } finally {
        await pool.query(`DROP TRIGGER IF EXISTS ${trigger} ON audit_log`);
      }
    });
  });
});
