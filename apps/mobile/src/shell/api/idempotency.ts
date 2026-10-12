/**
 * Idempotency-Key helpers for writes that must be safe to replay (root
 * CLAUDE.md 2.4). In src/shell/ because every role sends such writes; moved
 * here from roles/farmer/api/listings.ts, which re-exports them unchanged.
 */

/**
 * UUIDv4 for the `Idempotency-Key` header. Hermes on older Androids has no
 * `crypto.randomUUID`; the fallback only has to be unique per logical
 * operation from this device (the server scopes keys and keeps them 24h), not
 * unguessable, so Math.random is acceptable there.
 */
export function newIdempotencyKey(): string {
  const cryptoLike = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof cryptoLike?.randomUUID === 'function') return cryptoLike.randomUUID();
  const hex = '0123456789abcdef';
  let key = '';
  for (let i = 0; i < 36; i += 1) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      key += '-';
    } else if (i === 14) {
      key += '4';
    } else {
      const nibble = Math.floor(Math.random() * 16);
      key += hex.charAt(i === 19 ? (nibble & 0x3) | 0x8 : nibble);
    }
  }
  return key;
}

/** A per-operation key cache; see createIdempotencyKeyCache. */
export interface IdempotencyKeyCache {
  keyFor: (fingerprint: string) => string;
  reset: () => void;
}

/**
 * One key per logical request: a retry of the same body replays the same key
 * (the server returns the original result), while a changed body gets a new
 * key (re-using one would be 409 IDEMPOTENCY_KEY_REUSED).
 */
export function createIdempotencyKeyCache(generate: () => string = newIdempotencyKey): IdempotencyKeyCache {
  let current: { fingerprint: string; key: string } | null = null;
  return {
    keyFor(fingerprint: string): string {
      if (current === null || current.fingerprint !== fingerprint) {
        current = { fingerprint, key: generate() };
      }
      return current.key;
    },
    reset(): void {
      current = null;
    },
  };
}
