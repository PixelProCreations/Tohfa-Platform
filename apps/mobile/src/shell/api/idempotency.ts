/**
 * Idempotency-Key generation and reuse (root CLAUDE.md §2.4).
 *
 * The server contract (docs/openapi.yaml `IdempotencyKeyHeader`): the key is a
 * client-generated UUIDv4, unique per LOGICAL operation. Replaying the same
 * key with an identical body returns the original response; the same key with
 * a different body is 409 `IDEMPOTENCY_KEY_REUSED`.
 *
 * So the client rule is: a retry of the same submission (timeout, network
 * drop, double tap) MUST reuse the key — otherwise the server sees a new
 * operation and moves money twice — and a changed body MUST get a new key.
 * `createIdempotencyKeyCache` encodes exactly that, keyed by an operation name
 * plus a canonical form of the body.
 */

type RandomByte = () => number;

function defaultRandomByte(): number {
  const c = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } }).crypto;
  if (c?.getRandomValues !== undefined) {
    return c.getRandomValues(new Uint8Array(1))[0] ?? 0;
  }
  // Older Android JS engines have no WebCrypto. The key is not a secret, it
  // only has to be unique per operation, so Math.random is acceptable here.
  return Math.floor(Math.random() * 256);
}

/**
 * A UUIDv4 string. Uses `crypto.randomUUID` when present; otherwise builds one
 * from random bytes (`randomByte` is injectable for tests).
 */
export function newIdempotencyKey(randomByte?: RandomByte): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (randomByte === undefined && c?.randomUUID !== undefined) {
    return c.randomUUID();
  }
  const next = randomByte ?? defaultRandomByte;
  const bytes = Array.from({ length: 16 }, () => next() & 0xff);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // version 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** JSON with object keys sorted, so `{a,b}` and `{b,a}` compare equal. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'undefined';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

export interface IdempotencyKeyCache {
  /** Same `operation` + same body → same key, until `release(operation)`. */
  keyFor(operation: string, body: unknown): string;
  /** Call after the operation definitively succeeded (or the user abandoned it). */
  release(operation: string): void;
}

export function createIdempotencyKeyCache(): IdempotencyKeyCache {
  const entries = new Map<string, { fingerprint: string; key: string }>();
  return {
    keyFor(operation, body) {
      const fingerprint = stableStringify(body);
      const existing = entries.get(operation);
      if (existing !== undefined && existing.fingerprint === fingerprint) return existing.key;
      const key = newIdempotencyKey();
      entries.set(operation, { fingerprint, key });
      return key;
    },
    release(operation) {
      entries.delete(operation);
    },
  };
}
