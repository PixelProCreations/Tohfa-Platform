import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../http/errorHandler.js';
import { pingRedis, redis } from '../redis.js';
import { signAccessToken } from './jwt.js';
import { markTokensInvalidBefore } from './tokenInvalidation.js';
import { optionalAuth, requireAuth } from './requireAuth.js';

/**
 * `requireAuth` is now `asyncHandler`-wrapped internally (to `await` the
 * tokenInvalidation.ts Redis check) but must remain a drop-in `RequestHandler`
 * for the dozens of routes that mount it bare, and `optionalAuth` must keep
 * working when it calls `requireAuth(req, _res, next)` directly rather than
 * through Express's own dispatch. This file proves both: ordinary behaviour
 * is unchanged, AND the actual security gap (an old access token surviving a
 * password change) is closed.
 */
function actorApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.get('/protected', requireAuth, (req, res) => {
    res.json({ actor: req.actor ?? null });
  });
  app.get('/optional', optionalAuth, (req, res) => {
    res.json({ actor: req.actor ?? null });
  });
  app.use(errorHandler);
  return app;
}

function freshToken(userId: string): string {
  return signAccessToken({
    sub: userId,
    roles: [{ code: 'CUSTOMER' }],
    farmerId: null,
    customerId: null,
  });
}

/** Soft-skip guard, same spirit as `databaseReady` in test/factories.ts. */
async function realRedisAvailable(): Promise<boolean> {
  try {
    return await pingRedis();
  } catch {
    return false;
  }
}

describe('requireAuth: unchanged drop-in RequestHandler behaviour', () => {
  const app = actorApp();

  it('401 UNAUTHENTICATED with no Authorization header', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('401 UNAUTHENTICATED with a malformed/garbage token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('a freshly-issued, valid access token still works and populates req.actor', async () => {
    const userId = randomUUID();
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${freshToken(userId)}`);
    expect(res.status).toBe(200);
    expect(res.body.actor.userId).toBe(userId);
    expect(res.body.actor.roles).toEqual([{ code: 'CUSTOMER' }]);
  });
});

describe('requireAuth: closes the password-change access-token gap', () => {
  const app = actorApp();

  it('a token issued BEFORE markTokensInvalidBefore(userId) is rejected, even though it has not expired -- this is the exact bug reported live (old access token kept working after change-password)', async () => {
    if (!(await realRedisAvailable())) return;

    const userId = randomUUID();
    const oldToken = freshToken(userId);

    // `iat` has one-second resolution; wait past the second boundary so the
    // invalidation stamp is unambiguously later than the token's `iat`, the
    // same way it would be for any real password change that happens some
    // time after login.
    await new Promise((resolve) => setTimeout(resolve, 1_100));

    try {
      // This call is exactly what auth.service.ts's resetPassword/
      // changePassword now perform right after their transaction commits.
      await markTokensInvalidBefore(userId);

      // Before this fix: 200. After this fix: 401. This is the proof the gap
      // is closed, not just that nothing broke.
      const rejected = await request(app).get('/protected').set('Authorization', `Bearer ${oldToken}`);
      expect(rejected.status).toBe(401);
      expect(rejected.body.code).toBe('UNAUTHENTICATED');
      expect(rejected.body.detail).toMatch(/revoked/i);

      // A brand-new token, minted AFTER the password change, must still work
      // -- the fix must not lock the user out of their own new session.
      const accepted = await request(app).get('/protected').set('Authorization', `Bearer ${freshToken(userId)}`);
      expect(accepted.status).toBe(200);
    } finally {
      await redis.del(`auth:tokens-invalid-before:${userId}`);
    }
  }, 10_000);
});

describe('optionalAuth: direct-call usage survives the asyncHandler wrap', () => {
  const app = actorApp();

  it('no Authorization header -> passes through with no actor (never calls requireAuth at all)', async () => {
    const res = await request(app).get('/optional');
    expect(res.status).toBe(200);
    expect(res.body.actor).toBeNull();
  });

  it('a valid Authorization header -> populates req.actor via the direct `requireAuth(req, _res, next)` call', async () => {
    const userId = randomUUID();
    const res = await request(app).get('/optional').set('Authorization', `Bearer ${freshToken(userId)}`);
    expect(res.status).toBe(200);
    expect(res.body.actor.userId).toBe(userId);
  });

  it('a present-but-invalid token is still rejected (pre-existing behaviour, unchanged)', async () => {
    const res = await request(app).get('/optional').set('Authorization', 'Bearer not-a-real-jwt');
    expect(res.status).toBe(401);
  });
});
