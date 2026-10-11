import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomInt, randomUUID } from 'node:crypto';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase } from '../../test/factories.js';

/**
 * BR-67: a user sees only their own live sessions and no secrets; the
 * `/auth/me` additions (status, createdAt, lastLoginAt) are additive.
 *
 * Every query here runs against a real database: the session listing is
 * pure SQL (live = not revoked AND not expired, scoped by the token's user id),
 * so a mocked repo could not catch a wrong predicate.
 */

const SECRET_SENTINEL_FCM = 'fcm-token-SECRET-sentinel';
const SECRET_SENTINEL_DEVICE = 'device-id-SECRET-sentinel';

const app = createApp();

function tokenFor(userId: string, role: RoleCode = RoleCode.CUSTOMER): string {
  return signAccessToken({
    sub: userId,
    roles: [{ code: role }],
    farmerId: null,
    customerId: null,
  });
}

function randomMobile(): string {
  return `+9199${String(randomInt(0, 100_000_000)).padStart(8, '0')}`;
}

describe('BR-67a: GET /v1/auth/me/sessions requires authentication', () => {
  it('BR-67a: rejects a request with no token with 401', async () => {
    const res = await request(app).get('/v1/auth/me/sessions');
    expect(res.status).toBe(401);
  });

  it('BR-67a: rejects a malformed bearer token with 401', async () => {
    const res = await request(app).get('/v1/auth/me/sessions').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });
});

describeIfDatabase('BR-67: own live sessions and /auth/me additions (real database)', () => {
  const createdUserIds: string[] = [];
  let ready = false;

  async function createUser(
    userType: 'FARMER' | 'CUSTOMER' | 'ADMIN',
    overrides: { status?: 'PENDING' | 'ACTIVE' | 'DISABLED'; lastLoginAt?: Date | null } = {},
  ): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type, status, last_login_at)
       VALUES ($1, $2, $3::user_type, $4, $5)
       RETURNING id`,
      [randomMobile(), 'BR-67 Test User', userType, overrides.status ?? 'ACTIVE', overrides.lastLoginAt ?? null],
    );
    const id = result.rows[0]!.id;
    createdUserIds.push(id);
    return id;
  }

  async function createSession(
    userId: string,
    opts: {
      issuedAt?: Date;
      expiresAt?: Date;
      revoked?: boolean;
      platform?: 'ios' | 'android' | 'web';
      userAgent?: string;
      ip?: string;
      lastSeenAt?: Date | null;
    } = {},
  ): Promise<string> {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO sessions
         (user_id, device_id, platform, fcm_token, user_agent, last_seen_ip,
          issued_at, expires_at, last_seen_at, revoked_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        userId,
        SECRET_SENTINEL_DEVICE,
        opts.platform ?? 'android',
        SECRET_SENTINEL_FCM,
        opts.userAgent ?? 'TohfaApp/1.0',
        opts.ip ?? '203.0.113.7',
        opts.issuedAt ?? new Date(Date.now() - 60_000),
        opts.expiresAt ?? new Date(Date.now() + 3_600_000),
        opts.lastSeenAt ?? null,
        opts.revoked === true ? new Date() : null,
      ],
    );
    return result.rows[0]!.id;
  }

  beforeAll(async () => {
    ready = (await databaseReady('sessions')) && (await databaseReady('users'));
  });

  afterAll(async () => {
    if (ready && createdUserIds.length > 0) {
      // sessions.user_id is ON DELETE CASCADE.
      await pool.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [createdUserIds]);
    }
    await pool.end();
  });

  it('BR-67a: returns only live sessions (a revoked and an expired session are excluded)', async () => {
    if (!ready) return;
    const userId = await createUser('CUSTOMER');
    const live = await createSession(userId);
    await createSession(userId, { revoked: true });
    await createSession(userId, {
      issuedAt: new Date(Date.now() - 7_200_000),
      expiresAt: new Date(Date.now() - 1_000),
    });

    const res = await request(app).get('/v1/auth/me/sessions').set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(res.status).toBe(200);
    expect((res.body as Array<{ id: string }>).map((s) => s.id)).toEqual([live]);
  });

  it("BR-67b: never lists another user's sessions, and ignores a userId in the query string", async () => {
    if (!ready) return;
    const me = await createUser('CUSTOMER');
    const other = await createUser('CUSTOMER');
    const mine = await createSession(me);
    const theirs = await createSession(other);

    const res = await request(app)
      .get(`/v1/auth/me/sessions?userId=${other}`)
      .set('Authorization', `Bearer ${tokenFor(me)}`);

    expect(res.status).toBe(200);
    const ids = (res.body as Array<{ id: string }>).map((s) => s.id);
    expect(ids).toEqual([mine]);
    expect(ids).not.toContain(theirs);
  });

  it('BR-67c: exposes exactly the allow-listed fields and no secrets (and no isCurrent, the token has no session id)', async () => {
    if (!ready) return;
    const userId = await createUser('CUSTOMER');
    const issuedAt = new Date('2026-10-01T10:00:00.000Z');
    const lastSeenAt = new Date('2026-10-02T11:00:00.000Z');
    await createSession(userId, {
      issuedAt,
      lastSeenAt,
      platform: 'ios',
      userAgent: 'TohfaApp/2.0 (iOS)',
      ip: '198.51.100.9',
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    const res = await request(app).get('/v1/auth/me/sessions').set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(res.status).toBe(200);
    const [session] = res.body as Array<Record<string, unknown>>;
    expect(Object.keys(session!).sort()).toEqual(
      ['expiresAt', 'id', 'issuedAt', 'lastSeenAt', 'lastSeenIp', 'platform', 'userAgent'],
    );
    expect(session).toMatchObject({
      platform: 'ios',
      userAgent: 'TohfaApp/2.0 (iOS)',
      lastSeenIp: '198.51.100.9',
      issuedAt: issuedAt.toISOString(),
      lastSeenAt: lastSeenAt.toISOString(),
    });
    expect(JSON.stringify(res.body)).not.toContain(SECRET_SENTINEL_FCM);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_SENTINEL_DEVICE);
  });

  it('BR-67d: lists newest first and caps the list at 50 rows', async () => {
    if (!ready) return;
    const userId = await createUser('CUSTOMER');
    const base = Date.now() - 10_000_000;
    const ids: string[] = [];
    for (let i = 0; i < 52; i += 1) {
      ids.push(await createSession(userId, { issuedAt: new Date(base + i * 1000) }));
    }

    const res = await request(app).get('/v1/auth/me/sessions').set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(res.status).toBe(200);
    const returned = (res.body as Array<{ id: string }>).map((s) => s.id);
    expect(returned).toHaveLength(50);
    // Newest first: the last-inserted (newest) session leads; the two oldest are cut.
    expect(returned[0]).toBe(ids[51]);
    expect(returned).toEqual([...ids].reverse().slice(0, 50));
  });

  it('BR-67e: returns an empty array, not 404, for a user with no live sessions', async () => {
    if (!ready) return;
    const userId = await createUser('CUSTOMER');
    const res = await request(app).get('/v1/auth/me/sessions').set('Authorization', `Bearer ${tokenFor(userId)}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it.each([
    ['FARMER', RoleCode.FARMER],
    ['CUSTOMER', RoleCode.CUSTOMER],
    ['ADMIN', RoleCode.SUPER_ADMIN],
    ['ADMIN', RoleCode.TOHFA_ADMIN],
    ['ADMIN', RoleCode.FARMER_ADMIN],
    ['ADMIN', RoleCode.MAIN_WH_ADMIN],
  ] as const)('BR-67f: a %s user holding role %s can list own sessions', async (userType, role) => {
    if (!ready) return;
    const userId = await createUser(userType);
    const live = await createSession(userId);
    const res = await request(app).get('/v1/auth/me/sessions').set('Authorization', `Bearer ${tokenFor(userId, role)}`);
    expect(res.status).toBe(200);
    expect((res.body as Array<{ id: string }>).map((s) => s.id)).toEqual([live]);
  });

  it('BR-67f: a SUB_WH_ADMIN can list own sessions', async () => {
    if (!ready) return;
    const userId = await createUser('ADMIN');
    const live = await createSession(userId);
    const token = signAccessToken({
      sub: userId,
      roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: randomUUID() }],
      farmerId: null,
      customerId: null,
    });
    const res = await request(app).get('/v1/auth/me/sessions').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect((res.body as Array<{ id: string }>).map((s) => s.id)).toEqual([live]);
  });

  it('BR-67g: GET /auth/me additionally returns status, createdAt and lastLoginAt, keeping every existing field', async () => {
    if (!ready) return;
    const lastLoginAt = new Date('2026-10-03T08:30:00.000Z');
    const userId = await createUser('CUSTOMER', { status: 'ACTIVE', lastLoginAt });

    const res = await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${tokenFor(userId)}`);

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body['status']).toBe('ACTIVE');
    expect(body['lastLoginAt']).toBe(lastLoginAt.toISOString());
    expect(typeof body['createdAt']).toBe('string');
    expect(Number.isNaN(Date.parse(body['createdAt'] as string))).toBe(false);
    // Pre-existing contract is untouched.
    for (const key of ['id', 'fullName', 'mobile', 'email', 'userType', 'preferredLocale', 'roles', 'permissions']) {
      expect(body).toHaveProperty(key);
    }
    expect(body['id']).toBe(userId);
    expect(body['userType']).toBe('CUSTOMER');
  });

  it('BR-67g: GET /auth/me returns lastLoginAt null (not omitted) for a user who has never logged in', async () => {
    if (!ready) return;
    const userId = await createUser('FARMER', { status: 'PENDING', lastLoginAt: null });

    const res = await request(app).get('/v1/auth/me').set('Authorization', `Bearer ${tokenFor(userId, RoleCode.FARMER)}`);

    expect(res.status).toBe(200);
    const body = res.body as Record<string, unknown>;
    expect(body).toHaveProperty('lastLoginAt', null);
    expect(body['status']).toBe('PENDING');
  });
});
