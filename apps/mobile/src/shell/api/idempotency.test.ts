/**
 * Idempotency-Key helpers (root CLAUDE.md 2.4: money-moving writes must be
 * safe to replay). Moved here from roles/farmer/api/listings.ts so the admin
 * role can use them without a cross-role import; listings.ts re-exports them,
 * so the farmer screens and roles/farmer/tests/listings.test.ts are unchanged
 * (that file is what proves the re-export; shell tests may not import roles).
 */
import { describe, expect, it } from 'vitest';
import { createIdempotencyKeyCache, newIdempotencyKey } from './idempotency';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newIdempotencyKey', () => {
  it('produces UUIDv4-shaped, distinct keys', () => {
    const a = newIdempotencyKey();
    const b = newIdempotencyKey();
    expect(a).toMatch(UUID_V4);
    expect(b).toMatch(UUID_V4);
    expect(a).not.toBe(b);
  });

  it('falls back to a UUIDv4 shape when crypto.randomUUID is missing (older Hermes)', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(newIdempotencyKey()).toMatch(UUID_V4);
    } finally {
      if (original) Object.defineProperty(globalThis, 'crypto', original);
    }
  });
});

describe('createIdempotencyKeyCache', () => {
  it('replays the same key for the same body, so a retry moves money once', () => {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `k-${++n}`);
    expect(cache.keyFor('{"amount":"100.00"}')).toBe('k-1');
    expect(cache.keyFor('{"amount":"100.00"}')).toBe('k-1');
  });

  it('issues a new key when the body changes (reusing one would be 409 IDEMPOTENCY_KEY_REUSED)', () => {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `k-${++n}`);
    expect(cache.keyFor('a')).toBe('k-1');
    expect(cache.keyFor('b')).toBe('k-2');
  });

  it('reset() forgets the key, so the next request starts a new operation', () => {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `k-${++n}`);
    cache.keyFor('a');
    cache.reset();
    expect(cache.keyFor('a')).toBe('k-2');
  });
});
