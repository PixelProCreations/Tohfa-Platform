/**
 * In-memory IdempotencyStore for unit tests that run a service against a mocked
 * repo and a pass-through transaction runner (no database, no rollback).
 *
 * It keeps the one property the real `idempotency_keys` table gives that a unit
 * test can observe: a key is scoped to its actor. Atomicity with the business
 * write and the rollback-on-error behaviour are database properties and are
 * proven against real Postgres, not here.
 */
import type { ClaimResult, IdempotencyClaim, IdempotencyStore } from '../http/idempotency.js';

interface Entry {
  operation: string;
  requestHash: string;
  response: unknown;
}

export function createInMemoryIdempotencyStore(): IdempotencyStore & { size(): number } {
  const entries = new Map<string, Entry>();
  const keyOf = (actorUserId: string, key: string): string => `${actorUserId}\u0000${key}`;
  return {
    async claim(_tx, claim: IdempotencyClaim): Promise<ClaimResult> {
      const id = keyOf(claim.actorUserId, claim.key);
      const existing = entries.get(id);
      if (existing !== undefined) {
        return {
          claimed: false,
          operation: existing.operation,
          requestHash: existing.requestHash,
          response: existing.response,
        };
      }
      entries.set(id, { operation: claim.operation, requestHash: claim.requestHash, response: null });
      return { claimed: true };
    },
    async complete(_tx, actorUserId, key, response) {
      const entry = entries.get(keyOf(actorUserId, key));
      if (entry !== undefined) entry.response = JSON.parse(JSON.stringify(response));
    },
    size: () => entries.size,
  };
}
