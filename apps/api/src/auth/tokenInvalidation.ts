/**
 * Per-user "don't trust tokens issued before this moment" stamp.
 *
 * `requireAuth` only checks a JWT's signature and expiry. That leaves a gap:
 * logging out a session or rotating a refresh token (see auth.service.ts)
 * kills future *refresh* calls, but an access token already handed to a
 * client keeps working — unchanged — until it naturally expires
 * (`JWT_ACCESS_TTL`, see config.ts). For a password change/reset that is a
 * real hole: the whole point of the flow is "the previous credential no
 * longer grants access", and a still-valid access token means it still does,
 * for up to that TTL.
 *
 * This module closes the gap for those security-sensitive events by writing
 * a per-user timestamp to Redis: "reject any access token minted before this
 * instant". `requireAuth` checks it on every authenticated request using the
 * token's own `iat` (seconds since epoch, stamped by `jsonwebtoken` at sign
 * time — see jwt.ts). It is intentionally NOT wired into an ordinary logout;
 * that is a separate, less urgent product decision.
 *
 * Owning the Redis key convention here (rather than inlining
 * `auth:tokens-invalid-before:${id}` at both the write site in
 * auth.service.ts and the read site in requireAuth.ts) is what stops the two
 * from drifting apart.
 *
 * Uses the shared general-purpose `redis` client (apps/api/src/redis.ts) —
 * NOT `queueRedis`, which is reserved for BullMQ.
 */
import type { Redis } from 'ioredis';
import { logger } from '../logger.js';
import { redis } from '../redis.js';

/**
 * How long the stamp lives in Redis. This is deliberately a fixed, generous
 * value rather than something derived from `config.JWT_ACCESS_TTL` (a string
 * like `'5m'` or `'15m'`): the stamp only needs to outlive the longest access
 * token that could still be in someone's hands. 24 hours is comfortably
 * longer than any realistic access-token TTL, so there is no risk of the TTL
 * configuration drifting out from under this constant and silently
 * shortening the protection window.
 */
const INVALIDATION_TTL_SECONDS = 60 * 60 * 24; // 24h

function invalidationKey(userId: string): string {
  return `auth:tokens-invalid-before:${userId}`;
}

/**
 * Record that every access token issued for `userId` before *now* should be
 * treated as revoked. Call this only after the credential change that
 * motivates it has actually committed (see auth.service.ts's
 * `resetPassword`/`changePassword`, which call it after their
 * `withTransaction` block, not inside it — Redis is not part of the Postgres
 * transaction).
 *
 * Fails open, matching `isAccessTokenInvalidated` below and
 * rate-limit/rateLimiter.ts's documented philosophy: if Redis is unreachable
 * at the moment of a password change, the change itself (already committed
 * to Postgres, with every refresh token/session already revoked) must not
 * be reported as failed to the caller. The only thing lost is this extra
 * belt-and-suspenders access-token cutoff for the remainder of the token's
 * natural TTL -- the same exposure window that existed before this module
 * was added.
 */
export async function markTokensInvalidBefore(userId: string, client: Redis = redis): Promise<void> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  try {
    await client.set(invalidationKey(userId), String(nowSeconds), 'EX', INVALIDATION_TTL_SECONDS);
  } catch (error) {
    logger.warn(
      { err: error, userId },
      'tokenInvalidation: failed to write invalidation stamp; access tokens issued before this password change may keep working until they naturally expire',
    );
  }
}

/**
 * True when `issuedAtSeconds` (a token's `iat`) predates the last
 * `markTokensInvalidBefore(userId)` stamp -- i.e. the token was minted before
 * the user's password was last changed/reset and must be rejected.
 *
 * IMPORTANT: fails OPEN on any Redis error, exactly like
 * rate-limit/rateLimiter.ts's `consumeOrFailOpen`. `requireAuth` runs on
 * every authenticated route in the API; losing Redis must not turn into an
 * outage of the entire auth surface. Worst case on a Redis outage is the
 * pre-existing exposure window this module exists to shrink -- not zero, but
 * never a false rejection of a legitimate, unrevoked session.
 */
export async function isAccessTokenInvalidated(
  userId: string,
  issuedAtSeconds: number,
  client: Redis = redis,
): Promise<boolean> {
  try {
    const stamp = await client.get(invalidationKey(userId));
    if (stamp === null) return false;

    const invalidBeforeSeconds = Number(stamp);
    if (!Number.isFinite(invalidBeforeSeconds)) return false;

    return issuedAtSeconds < invalidBeforeSeconds;
  } catch (error) {
    logger.warn(
      { err: error, userId },
      'tokenInvalidation: check unavailable; failing open (treating token as not invalidated)',
    );
    return false;
  }
}
