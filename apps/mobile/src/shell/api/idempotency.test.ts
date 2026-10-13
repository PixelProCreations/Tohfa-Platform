import { describe, expect, it } from 'vitest';
import { createIdempotencyKeyCache, newIdempotencyKey, stableStringify } from './idempotency';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newIdempotencyKey', () => {
  it('produces a UUIDv4 (docs/openapi.yaml IdempotencyKeyHeader: format uuid)', () => {
    for (let i = 0; i < 50; i += 1) expect(newIdempotencyKey()).toMatch(UUID_V4);
  });

  it('produces a UUIDv4 even without crypto.randomUUID (older Android JS engines)', () => {
    let n = 0;
    const key = newIdempotencyKey(() => (n++ * 37) % 256);
    expect(key).toMatch(UUID_V4);
  });

  it('does not repeat across calls', () => {
    const keys = new Set(Array.from({ length: 200 }, () => newIdempotencyKey()));
    expect(keys.size).toBe(200);
  });
});

describe('stableStringify', () => {
  it('is independent of object key order', () => {
    expect(stableStringify({ a: 1, b: { d: 2, c: 3 } })).toBe(
      stableStringify({ b: { c: 3, d: 2 }, a: 1 }),
    );
  });
});

describe('createIdempotencyKeyCache', () => {
  it('BR-17b/BR-61d: a retry of the identical body reuses the same key, so the server replays instead of moving money twice', () => {
    const cache = createIdempotencyKeyCache();
    const first = cache.keyFor('cash-topup', { amount: '5000.00', fiscalCashTag: 'T-1' });
    const retry = cache.keyFor('cash-topup', { fiscalCashTag: 'T-1', amount: '5000.00' });
    expect(retry).toBe(first);
  });

  it('BR-62a: a changed body gets a fresh key (reusing the old key would be 409 IDEMPOTENCY_KEY_REUSED)', () => {
    const cache = createIdempotencyKeyCache();
    const first = cache.keyFor('cash-topup', { amount: '5000.00' });
    const changed = cache.keyFor('cash-topup', { amount: '6000.00' });
    expect(changed).not.toBe(first);
  });

  it('release() ends the logical operation: the next identical submit is a new operation with a new key', () => {
    const cache = createIdempotencyKeyCache();
    const first = cache.keyFor('refund', { id: 'r1' });
    cache.release('refund');
    expect(cache.keyFor('refund', { id: 'r1' })).not.toBe(first);
  });

  it('keeps separate operations apart', () => {
    const cache = createIdempotencyKeyCache();
    expect(cache.keyFor('a', { x: 1 })).not.toBe(cache.keyFor('b', { x: 1 }));
  });
});
