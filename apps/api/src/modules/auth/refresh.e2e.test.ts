/**
 * Refresh-token rotation against the real router and a real Postgres.
 *
 * Regression for the QA finding: a refresh JWT used to be deterministic
 * (sub, jti = session id, iat), so a refresh in the same second as login (or
 * as a previous refresh) minted a byte-identical token, whose hash collided
 * with `refresh_tokens_token_hash_key` -> 500. Two parallel refreshes of one
 * token also both passed the "not used yet" read and raced.
 *
 * Uses the dev SUPER_ADMIN seeded by db/seed/003_dev_users.sql, so run it on a
 * throwaway / CI database that has the dev users.
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { AUDIENCE, ISSUER } from '../../auth/jwt.js';
import { config } from '../../config.js';
import { pool, withTransaction } from '../../db/pool.js';
import { authRepo, type AuthRepo } from './auth.repo.js';
import { createAuthService } from './auth.service.js';
import { closeRedis } from '../../redis.js';
import { databaseReady, describeIfDatabase } from '../../test/factories.js';

const MOBILE = '+919800000001';
const PASSWORD = 'Password@123';

const sha256 = (v: string): string => crypto.createHash('sha256').update(v).digest('hex');

describeIfDatabase('HTTP: POST /v1/auth/refresh rotation (real router, real database)', () => {
  const app = createApp();
  let ready = false;

  beforeAll(async () => {
    ready = (await databaseReady('refresh_tokens')) && (await databaseReady('users'));
    if (!ready) throw new Error('database is not migrated: run `pnpm db:migrate`');
    const dev = await pool.query(`SELECT 1 FROM users WHERE mobile = $1`, [MOBILE]);
    if (dev.rowCount === 0) throw new Error('dev user missing: seed db/seed/003_dev_users.sql');
  });

  afterAll(async () => {
    await pool.end().catch(() => undefined);
    await closeRedis().catch(() => undefined);
  });

  async function login(): Promise<{ accessToken: string; refreshToken: string }> {
    const res = await request(app).post('/v1/auth/login').send({ mobile: MOBILE, password: PASSWORD });
    expect(res.status).toBe(200);
    return res.body as { accessToken: string; refreshToken: string };
  }

  const refresh = (refreshToken: string): request.Test =>
    request(app).post('/v1/auth/refresh').send({ refreshToken });

  const sessionIdOf = (refreshToken: string): string => {
    const decoded = jwt.decode(refreshToken) as { jti: string };
    return decoded.jti;
  };

  it('HTTP: refresh in the same second as login returns 200 with a different token (was 500)', async () => {
    const first = await login();
    const res = await refresh(first.refreshToken);
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).not.toBe(first.refreshToken);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('HTTP: two sequential refreshes in the same second both return 200, each with a new token', async () => {
    const first = await login();
    const second = await refresh(first.refreshToken);
    expect(second.status).toBe(200);
    const third = await refresh(second.body.refreshToken as string);
    expect(third.status).toBe(200);
    const tokens = new Set([first.refreshToken, second.body.refreshToken, third.body.refreshToken]);
    expect(tokens.size).toBe(3);
    // Three distinct hashes are stored for the one session.
    const { rows } = await pool.query<{ n: string }>(
      `SELECT count(DISTINCT token_hash) AS n FROM refresh_tokens WHERE session_id = $1`,
      [sessionIdOf(first.refreshToken)],
    );
    expect(Number(rows[0]!.n)).toBe(3);
  });

  it('HTTP: parallel refreshes of the SAME token: exactly one 200, every other 401, never 500', async () => {
    const first = await login();
    const results = await Promise.all(
      Array.from({ length: 4 }, () => refresh(first.refreshToken)),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 401, 401, 401]);
    for (const r of results.filter((x) => x.status === 401)) {
      expect(r.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(r.body.code).toBe('UNAUTHENTICATED');
    }
    // Exactly one rotation happened: the old row is used once and has one successor.
    const { rows } = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM refresh_tokens WHERE replaced_by IS NOT NULL AND session_id = $1`,
      [sessionIdOf(first.refreshToken)],
    );
    expect(Number(rows[0]!.n)).toBe(1);
  });

  it('HTTP: reuse of an already-rotated token is 401 and kills the whole family, including the newest token', async () => {
    const first = await login();
    const rotated = await refresh(first.refreshToken);
    expect(rotated.status).toBe(200);

    const replay = await refresh(first.refreshToken);
    expect(replay.status).toBe(401);
    expect(replay.body.code).toBe('UNAUTHENTICATED');

    // The legitimate newest token is dead too, and the session is revoked.
    const afterKill = await refresh(rotated.body.refreshToken as string);
    expect(afterKill.status).toBe(401);
    const { rows } = await pool.query<{ revoked_at: Date | null; revoke_reason: string | null }>(
      `SELECT revoked_at, revoke_reason FROM sessions WHERE id = $1`,
      [sessionIdOf(first.refreshToken)],
    );
    expect(rows[0]!.revoked_at).not.toBeNull();
    expect(rows[0]!.revoke_reason).toBe('TOKEN_REUSE_DETECTED');
  });

  it('HTTP: a refresh token issued before the nonce claim existed (no nonce) is still accepted until it expires', async () => {
    const live = await login();
    const sessionId = sessionIdOf(live.refreshToken);
    const userId = (jwt.decode(live.refreshToken) as { sub: string }).sub;
    // Exactly the old deterministic payload: sub, typ, jti, iat, exp (iat backdated so it
    // cannot collide with the token login just issued).
    const legacy = jwt.sign({ sub: userId, typ: 'refresh', jti: sessionId, iat: Math.floor(Date.now() / 1000) - 120 }, config.JWT_SECRET, {
      algorithm: 'HS256',
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: '30d',
    });
    expect(Object.keys(jwt.decode(legacy) as object)).not.toContain('nonce');
    await pool.query(
      `INSERT INTO refresh_tokens (session_id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, now() + interval '30 days')
       ON CONFLICT (token_hash) DO NOTHING`,
      [sessionId, userId, sha256(legacy)],
    );
    const res = await refresh(legacy);
    expect(res.status).toBe(200);
    expect(res.body.refreshToken).not.toBe(legacy);
  });

  it('HTTP: an access token presented as a refresh token is still 401 (typ check unchanged)', async () => {
    const live = await login();
    const res = await refresh(live.accessToken);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('HTTP: a refresh token that was never issued by the server is 401', async () => {
    const live = await login();
    const forged = jwt.sign(
      { sub: (jwt.decode(live.refreshToken) as { sub: string }).sub, typ: 'refresh', jti: sessionIdOf(live.refreshToken), nonce: 'x' },
      config.JWT_SECRET,
      { algorithm: 'HS256', issuer: ISSUER, audience: AUDIENCE, expiresIn: '30d' },
    );
    const res = await refresh(forged);
    expect(res.status).toBe(401);
  });

  // The HTTP race above is timing-dependent (the winner usually commits before the others read).
  // This one is not: two transactions rotate the SAME stored token at once, and only the row
  // lock plus the `used_at IS NULL` guard in rotateRefreshToken can let exactly one through.
  it('HTTP: rotateRefreshToken on one stored token from two concurrent transactions: exactly one wins, the other gets null (no error)', async () => {
    const live = await login();
    const sessionId = sessionIdOf(live.refreshToken);
    const userId = (jwt.decode(live.refreshToken) as { sub: string }).sub;
    const stored = await authRepo.findRefreshTokenByHash(pool, sha256(live.refreshToken));
    expect(stored).not.toBeNull();
    const expiresAt = new Date(Date.now() + 86_400_000);
    const rotate = (tag: string) =>
      withTransaction((tx) =>
        authRepo.rotateRefreshToken(tx, stored!.id, {
          sessionId,
          userId,
          tokenHash: sha256(`${live.refreshToken}:${tag}`),
          expiresAt,
        }),
      );
    const results = await Promise.all([rotate('a'), rotate('b'), rotate('c')]);
    expect(results.filter((r) => r !== null)).toHaveLength(1);
    // The session holds the login token plus exactly one successor: losers inserted nothing.
    const total = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM refresh_tokens WHERE session_id = $1`,
      [sessionId],
    );
    expect(Number(total.rows[0]!.n)).toBe(2);
    const old = await authRepo.findRefreshTokenByHash(pool, sha256(live.refreshToken));
    expect(old!.used_at).not.toBeNull();
    expect(old!.replaced_by).not.toBeNull();
  });

  it('HTTP: a refresh that loses the rotation claim is 401 and revokes the session family (service branch)', async () => {
    const live = await login();
    const sessionId = sessionIdOf(live.refreshToken);
    const revoked: Array<{ sessionId: string; reason: string }> = [];
    // The real repo for every read; only the claim is forced to lose, as it does when another
    // request consumed the token between this request's read and its rotation.
    const losing: AuthRepo = {
      ...authRepo,
      rotateRefreshToken: async () => null,
      revokeSessionTokenFamily: async (_db, id, reason) => {
        revoked.push({ sessionId: id, reason });
      },
    };
    await expect(createAuthService(losing).refreshToken(live.refreshToken)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
      status: 401,
    });
    expect(revoked).toEqual([{ sessionId, reason: 'TOKEN_REUSE_DETECTED' }]);
  });
});
