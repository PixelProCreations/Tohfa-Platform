/**
 * Keyset cursor for GET /admin/orders, ordered by `(placed_at DESC, id DESC)`.
 *
 * The cursor carries BOTH columns, and `placed_at` as microsecond text (http/microTimestamp.ts):
 * the earlier cursor was `<ISO millisecond>|<id>`, so two orders placed within one millisecond
 * compared unequal to the rounded value and the page boundary skipped one of them. A cursor that
 * this module did not produce is refused at validation (422), never cast in SQL (it was a 500).
 */
import { isMicroTimestamp } from '../../http/microTimestamp.js';

export interface AdminOrderCursorKey {
  /** Microsecond UTC text of `orders.placed_at`. */
  ts: string;
  id: string;
}

const TAG = 'ao';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Opaque base64url cursor (openapi `PageMeta`: clients never parse or build one). */
export function encodeAdminOrderCursor(key: AdminOrderCursorKey): string {
  return Buffer.from(JSON.stringify([TAG, key.ts, key.id]), 'utf8').toString('base64url');
}

/** null for anything `encodeAdminOrderCursor` did not produce. */
export function decodeAdminOrderCursor(raw: string): AdminOrderCursorKey | null {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed[0] === TAG &&
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
