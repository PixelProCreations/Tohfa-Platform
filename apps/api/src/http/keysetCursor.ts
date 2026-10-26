/**
 * Opaque keyset cursors for lists ordered by `(<timestamp> DESC, id DESC)`.
 *
 * Same scheme as the wallet transactions and admin order cursors: the cursor carries the last
 * row's timestamp as microsecond UTC text (`MICRO_TS_SQL`) AND its id, so the next page starts
 * exactly after it with the row-value predicate `(ts, id) < (cursor.ts, cursor.id)`. A cursor on
 * the id alone skipped or repeated rows, because uuids are not ordered by time; a millisecond
 * timestamp skipped rows that shared a millisecond.
 *
 * Each list passes its own tag, so a cursor from one list is refused by another. Anything this
 * module did not produce decodes to null and is refused 422 before it can reach a SQL cast.
 */
import { AppError } from './problem.js';
import { isMicroTimestamp } from './microTimestamp.js';

export interface KeysetKey {
  /** Microsecond UTC text of the sort timestamp, as `MICRO_TS_SQL` prints it. */
  ts: string;
  id: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Opaque base64url cursor (openapi `CursorParam`: clients never parse or build one). */
export function encodeKeysetCursor(tag: string, key: KeysetKey): string {
  return Buffer.from(JSON.stringify([tag, key.ts, key.id]), 'utf8').toString('base64url');
}

/** null for anything `encodeKeysetCursor(tag, ...)` did not produce. */
export function decodeKeysetCursor(tag: string, raw: string): KeysetKey | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed[0] === tag &&
      typeof parsed[1] === 'string' &&
      typeof parsed[2] === 'string' &&
      isMicroTimestamp(parsed[1]) &&
      UUID.test(parsed[2])
    ) {
      return { ts: parsed[1], id: parsed[2] };
    }
  } catch {
    // not base64url JSON: fall through
  }
  return null;
}

/** For a repo whose caller skipped route validation: decode or throw 422 VALIDATION_FAILED. */
export function requireKeysetCursor(tag: string, raw: string): KeysetKey {
  const key = decodeKeysetCursor(tag, raw);
  if (key === null) {
    throw new AppError('VALIDATION_FAILED', {
      detail: 'cursor is not a value returned by this endpoint.',
      errors: { 'query.cursor': ['Invalid cursor.'] },
    });
  }
  return key;
}

/** Cursor tags, one per list. */
export const CURSOR_TAGS = {
  inventoryBatches: 'ib',
  stockLedger: 'sl',
  allocations: 'al',
  auditLog: 'au',
  adminFarmers: 'fm',
  promotionRequests: 'pr',
  goodsReceiptDiscrepancies: 'gd',
} as const;
