/**
 * Idempotency-Key handling for non-repeatable POSTs (docs/openapi.yaml
 * `IdempotencyKeyHeader`; BR-68 for the listing writes).
 *
 * The contract, from the spec text: replaying a key with an identical request
 * returns the original response; replaying it with a different request is 409
 * `IDEMPOTENCY_KEY_REUSED`; keys are retained 24 hours.
 *
 * HOW: `beginIdempotent` runs inside the caller's transaction. It first CLAIMS the
 * key (`INSERT ... ON CONFLICT`, never check-then-insert); the operation then
 * runs and `complete` records the response, all in that one transaction. So:
 *   - a request that fails (4xx or 5xx) rolls the claim back and the key stays
 *     usable, an error is never replayed;
 *   - two concurrent requests with one key serialise on the primary key: the
 *     second blocks until the first commits and then replays its stored response,
 *     so the operation runs once;
 *   - a replay returns before the operation, so it writes no second row, no
 *     second audit row and sends no second notification.
 *
 * Keys are scoped to the acting user, so one farmer's key can neither collide
 * with nor reveal another's.
 */
import { createHash } from 'node:crypto';
import type { Executor } from '../db/pool.js';
import { AppError } from './problem.js';

/** docs/openapi.yaml IdempotencyKeyHeader: "Keys are retained 24 hours." */
export const IDEMPOTENCY_RETENTION_HOURS = 24;
const MAX_KEY_LENGTH = 255;
const HEADER_FIELD = 'header.Idempotency-Key';

export interface IdempotencyClaim {
  actorUserId: string;
  key: string;
  operation: string;
  requestHash: string;
}

export type ClaimResult =
  | { claimed: true }
  | { claimed: false; operation: string; requestHash: string; response: unknown };

export interface IdempotencyStore {
  /** Atomically claim the key for this transaction, or report what already holds it. */
  claim(tx: Executor, claim: IdempotencyClaim): Promise<ClaimResult>;
  /** Record the response the claimed key produced (same transaction as the claim). */
  complete(tx: Executor, actorUserId: string, key: string, response: unknown): Promise<void>;
}

/**
 * The header value, or 422 VALIDATION_FAILED. Missing, empty and whitespace-only
 * all count as missing. The value itself is never echoed back. Whether it is a
 * UUID is deliberately not checked: the spec says "format: uuid", but the
 * contract that matters here is uniqueness per logical operation.
 */
export function requireIdempotencyKey(raw: string | undefined): string {
  const key = raw?.trim() ?? '';
  if (key.length === 0) {
    throw new AppError('VALIDATION_FAILED', {
      status: 422,
      detail: 'An Idempotency-Key header is required for this request.',
      errors: { [HEADER_FIELD]: ['Required. Send a unique value per logical operation (a UUIDv4) and reuse it when retrying.'] },
    });
  }
  if (key.length > MAX_KEY_LENGTH) {
    throw new AppError('VALIDATION_FAILED', {
      status: 422,
      detail: 'The Idempotency-Key header is too long.',
      errors: { [HEADER_FIELD]: [`Must be at most ${MAX_KEY_LENGTH} characters.`] },
    });
  }
  return key;
}

/** JSON with object keys sorted, so equal requests hash equal whatever the key order. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Fingerprint of "what the client asked for": the operation, its target ids and its parsed body. */
export function fingerprintRequest(operation: string, request: unknown): string {
  return createHash('sha256').update(canonicalJson({ operation, request })).digest('hex');
}

export interface IdempotentContext {
  actorUserId: string;
  key: string;
  operation: string;
  /** Everything that makes this request this request: target ids and the parsed body. */
  request: unknown;
}

export type IdempotentStart<T> =
  | { replay: true; response: T }
  | { replay: false; complete(result: T): Promise<void> };

/**
 * Begin an idempotent operation inside the transaction `tx` that the operation's
 * own writes use. Either the key already produced a response (`replay: true`,
 * return it and do nothing else), or this transaction now owns the key: run the
 * operation, then call `complete(result)` once, with the exact value the route
 * will send (it is stored and replayed as the response body, so it must be
 * JSON-serialisable). Calling it is part of the contract: an operation that
 * returns without `complete` leaves a claim with no stored response.
 */
export async function beginIdempotent<T>(
  store: IdempotencyStore,
  tx: Executor,
  ctx: IdempotentContext,
): Promise<IdempotentStart<T>> {
  const requestHash = fingerprintRequest(ctx.operation, ctx.request);
  const claim = await store.claim(tx, {
    actorUserId: ctx.actorUserId,
    key: ctx.key,
    operation: ctx.operation,
    requestHash,
  });

  if (!claim.claimed) {
    if (claim.operation !== ctx.operation || claim.requestHash !== requestHash) {
      throw new AppError('IDEMPOTENCY_KEY_REUSED', {
        status: 409,
        detail: 'This Idempotency-Key was already used for a different request. Use a new key for a new request.',
      });
    }
    return { replay: true, response: claim.response as T };
  }

  return {
    replay: false,
    complete: (result) => store.complete(tx, ctx.actorUserId, ctx.key, result),
  };
}

/** The PostgreSQL store over `idempotency_keys` (migration 0045). */
export const idempotencyStore: IdempotencyStore = {
  async claim(tx, claim) {
    // DO UPDATE ... WHERE takes over a claim past the retention window; a live
    // claim matches the conflict but not the WHERE, so nothing is returned and
    // the existing row is read below. The conflict wait on a concurrent,
    // uncommitted claim is what serialises parallel requests.
    const inserted = await tx.query(
      `INSERT INTO idempotency_keys (actor_user_id, idempotency_key, operation, request_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (actor_user_id, idempotency_key) DO UPDATE
         SET operation = EXCLUDED.operation,
             request_hash = EXCLUDED.request_hash,
             response_body = NULL,
             created_at = now()
         WHERE idempotency_keys.created_at < now() - make_interval(hours => $5::int)
       RETURNING 1`,
      [claim.actorUserId, claim.key, claim.operation, claim.requestHash, IDEMPOTENCY_RETENTION_HOURS],
    );
    if (inserted.rowCount === 1) return { claimed: true };

    const existing = await tx.query<{ operation: string; request_hash: string; response_body: unknown }>(
      `SELECT operation, request_hash, response_body
         FROM idempotency_keys WHERE actor_user_id = $1 AND idempotency_key = $2`,
      [claim.actorUserId, claim.key],
    );
    const row = existing.rows[0];
    if (row === undefined) {
      // The holder rolled back between our conflict and this read. Asking the
      // client to retry is correct: the key is free again.
      throw new AppError('CONFLICT', { detail: 'A concurrent request with this Idempotency-Key was abandoned. Retry.' });
    }
    return {
      claimed: false,
      operation: row.operation,
      requestHash: row.request_hash,
      response: row.response_body,
    };
  },

  async complete(tx, actorUserId, key, response) {
    await tx.query(
      `UPDATE idempotency_keys SET response_body = $3::jsonb WHERE actor_user_id = $1 AND idempotency_key = $2`,
      [actorUserId, key, JSON.stringify(response)],
    );
  },
};
