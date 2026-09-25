import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import type { Redis } from 'ioredis';
import { isAccessTokenInvalidated, markTokensInvalidBefore } from './tokenInvalidation.js';
import { pingRedis, redis } from '../redis.js';

/**
 * A minimal fake Redis client -- just the `get`/`set` surface this module
 * uses -- so these tests run without a live Redis connection. Mirrors
 * rate-limit/rateLimiter.test.ts's `fakeRedis()` (also just enough of the
 * client to exercise the module under test).
 */
function fakeRedis(initial: Record<string, string> = {}): Redis {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    async get(key: string) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
      return 'OK' as const;
    },
  } as unknown as Redis;
}

/** Every call rejects, standing in for an unreachable/timed-out Redis. */
function brokenRedis(): Redis {
  return {
    async get() {
      throw new Error('ECONNREFUSED');
    },
    async set() {
      throw new Error('ECONNREFUSED');
    },
  } as unknown as Redis;
}

describe('isAccessTokenInvalidated', () => {
  it('returns false when no stamp has ever been written for the user', async () => {
    const client = fakeRedis();
    await expect(isAccessTokenInvalidated('user-1', 1_000, client)).resolves.toBe(false);
  });

  it('returns true when the token was issued before the stamp (BR: revoked-before-password-change)', async () => {
    const client = fakeRedis();
    await markTokensInvalidBefore('user-1', client);
    const stampedAt = Number(await client.get('auth:tokens-invalid-before:user-1'));

    const tokenIssuedBefore = stampedAt - 60; // minted a minute before the change
    await expect(isAccessTokenInvalidated('user-1', tokenIssuedBefore, client)).resolves.toBe(true);
  });

  it('returns false when the token was issued after the stamp (a fresh login/token is unaffected)', async () => {
    const client = fakeRedis();
    await markTokensInvalidBefore('user-1', client);
    const stampedAt = Number(await client.get('auth:tokens-invalid-before:user-1'));

    const tokenIssuedAfter = stampedAt + 60; // minted a minute after the change
    await expect(isAccessTokenInvalidated('user-1', tokenIssuedAfter, client)).resolves.toBe(false);
  });

  it('scopes the stamp per user -- invalidating user-1 never affects user-2', async () => {
    const client = fakeRedis();
    await markTokensInvalidBefore('user-1', client);
    const stampedAt = Number(await client.get('auth:tokens-invalid-before:user-1'));

    await expect(isAccessTokenInvalidated('user-2', stampedAt - 60, client)).resolves.toBe(false);
  });

  it('fails OPEN (returns false, never throws) when Redis is unreachable', async () => {
    // This is the hard requirement: requireAuth runs on every authenticated
    // route, so a Redis outage must never reject an otherwise-valid token.
    await expect(isAccessTokenInvalidated('user-1', 1_000, brokenRedis())).resolves.toBe(false);
  });
});

describe('markTokensInvalidBefore', () => {
  it('writes a numeric unix-seconds stamp under the documented key', async () => {
    const client = fakeRedis();
    const before = Math.floor(Date.now() / 1000);
    await markTokensInvalidBefore('user-1', client);
    const after = Math.floor(Date.now() / 1000);

    const stamp = Number(await client.get('auth:tokens-invalid-before:user-1'));
    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(after);
  });

  it('never throws even when the underlying Redis write fails (fail open on the write side too)', async () => {
    // A password change must not come back as a 500 to the caller just
    // because Redis hiccuped at that exact moment -- the DB commit (password
    // hash + revoked sessions) already succeeded by the time this is called.
    await expect(markTokensInvalidBefore('user-1', brokenRedis())).resolves.toBeUndefined();
  });
});

/**
 * Optional real-Redis proof, analogous in spirit to `databaseReady` in
 * test/factories.ts: soft-skips instead of failing when no live Redis is
 * reachable, so this file stays green without Docker running, but actually
 * exercises the shared production client (apps/api/src/redis.ts) when one is.
 */
async function realRedisAvailable(): Promise<boolean> {
  try {
    return await pingRedis();
  } catch {
    return false;
  }
}

describe('against the real shared redis client', () => {
  it('round-trips through actual Redis, not just the fake', async () => {
    if (!(await realRedisAvailable())) return;

    const userId = `test-${randomUUID()}`;
    const beforeAnyStamp = Math.floor(Date.now() / 1000) - 10;

    try {
      await expect(isAccessTokenInvalidated(userId, beforeAnyStamp, redis)).resolves.toBe(false);

      await markTokensInvalidBefore(userId, redis);

      await expect(isAccessTokenInvalidated(userId, beforeAnyStamp, redis)).resolves.toBe(true);

      const afterTheStamp = Math.floor(Date.now() / 1000) + 10;
      await expect(isAccessTokenInvalidated(userId, afterTheStamp, redis)).resolves.toBe(false);
    } finally {
      // Real key, real cleanup -- don't leave test stamps sitting in dev Redis.
      await redis.del(`auth:tokens-invalid-before:${userId}`);
    }
  });
});
