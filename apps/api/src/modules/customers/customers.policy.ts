/**
 * SWA Module 7 (Customers): pure policy helpers, no I/O.
 *
 *  - `customerAccess`  turns a ResolvedScope into what the repo applies (BR-91) and whether the
 *                      serializers mask (BR-92). Masking is chosen by the SCOPE LEVEL, never by a
 *                      role check, so a role granted `own` later inherits it (BR-92d).
 *  - `maskMobile`      BR-92 / openapi `MaskedMobile`.
 *  - `buildRedactor`   BR-97: strips farmer identity from support text for `own` actors and
 *                      refuses replies that would carry it into a customer-facing thread.
 *  - keyset cursors    opaque base64url JSON; anything not produced here is a 422.
 */
import { ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';

export interface CustomerAccess {
  /** Warehouses the customer must be seen at (BR-91); null = not confined. */
  warehouseIds: string[] | null;
  /** Fail closed: the scope can see no customer at all. */
  denyAll: boolean;
  /** BR-92: name, masked mobile and customer code only. */
  masked: boolean;
}

/**
 * Confinement reuses warehouseScope.ts so this module agrees with every other warehouse-admin
 * read: an `own` Sub Warehouse Admin is confined to its warehouse, an `own` Main Warehouse Admin
 * with no assigned warehouse sees all four (owner, 2026-10-11), and a farmer- or customer-owned
 * scope fails closed. Anything below `all` is masked (fail closed for `view`/`conditional` too).
 */
export function customerAccess(scope: ResolvedScope): CustomerAccess {
  const masked = scope.level !== ScopeLevel.ALL;
  const filter = warehouseScopeFilter(scope, 'warehouse_id');
  if (filter.sql === 'FALSE') return { warehouseIds: null, denyAll: true, masked };
  if (filter.sql === 'TRUE') return { warehouseIds: null, denyAll: false, masked };
  return { warehouseIds: [...scope.warehouseIds], denyAll: false, masked };
}

/** `*` for every character except the last four digits; four characters or fewer are fully masked. */
export function maskMobile(mobile: string): string {
  if (mobile.length <= 4) return '*'.repeat(Math.max(mobile.length, 1));
  const tail = mobile.slice(-4);
  if (!/^[0-9]{4}$/.test(tail)) return '*'.repeat(mobile.length);
  return `${'*'.repeat(mobile.length - 4)}${tail}`;
}

// ---------------------------------------------------------------------------
// BR-97 redaction
// ---------------------------------------------------------------------------
/** API marker that replaces a farmer identity in support text (not a UI string). */
export const REDACTED = '[redacted]';

export interface Redactor {
  redact(text: string): { text: string; changed: boolean };
  matches(text: string): boolean;
}

const MIN_TERM_LENGTH = 3;
/** A person-name part shorter than this ("Raj" is kept as a full-name term only) is too common to redact alone. */
const MIN_NAME_PART_LENGTH = 4;
/** Two decimal coordinates with at least four decimals each: a GPS position (BR-16 lists GPS). */
const GPS_PAIR = /-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}/g;

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * `terms` are matched whole (farmer id, farmer code, farm name, villages, centroid, batch codes);
 * `personNames` are matched whole AND by each part of four or more letters, because a note says
 * "Ramesh" more often than "Ramesh Kumar". Farm names are not split: "Green Valley Farm" must not
 * redact the word "farm" from every message.
 */
export function buildRedactor(terms: readonly string[], personNames: readonly string[]): Redactor {
  const all = new Set<string>();
  const add = (raw: string, min: number): void => {
    const term = raw.trim();
    if (term.length >= min) all.add(term.toLowerCase());
  };
  for (const term of terms) add(term, MIN_TERM_LENGTH);
  for (const name of personNames) {
    add(name, MIN_TERM_LENGTH);
    for (const part of name.split(/\s+/)) add(part, MIN_NAME_PART_LENGTH);
  }
  // Longest first so "Ramesh Kumar" is replaced as one unit before "Ramesh".
  const sorted = [...all].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const termPattern =
    sorted.length === 0 ? null : new RegExp(`(?<![\\p{L}\\p{N}])(?:${sorted.join('|')})(?![\\p{L}\\p{N}])`, 'giu');

  const redact = (text: string): { text: string; changed: boolean } => {
    let out = text.replace(GPS_PAIR, REDACTED);
    if (termPattern !== null) out = out.replace(termPattern, REDACTED);
    return { text: out, changed: out !== text };
  };
  return { redact, matches: (text) => redact(text).changed };
}

// ---------------------------------------------------------------------------
// Keyset cursors
// ---------------------------------------------------------------------------
export interface NameKey {
  name: string;
  id: string;
}
export interface TimeKey {
  /** Microsecond UTC timestamp, as the repo emits it. */
  ts: string;
  id: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MICRO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

function invalidCursor(): never {
  throw new AppError('VALIDATION_FAILED', {
    detail: 'cursor is not a value returned by this endpoint.',
    errors: { 'query.cursor': ['Invalid cursor.'] },
  });
}

function decodeParts(raw: string, tag: string): [string, string] {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed[0] === tag &&
      typeof parsed[1] === 'string' &&
      typeof parsed[2] === 'string'
    ) {
      return [parsed[1], parsed[2]];
    }
  } catch {
    // fall through to the 422
  }
  return invalidCursor();
}

const encode = (parts: string[]): string => Buffer.from(JSON.stringify(parts), 'utf8').toString('base64url');

export function encodeNameKey(key: NameKey): string {
  return encode(['n', key.name, key.id]);
}

export function decodeNameKey(raw: string): NameKey {
  const [name, id] = decodeParts(raw, 'n');
  if (!UUID.test(id)) invalidCursor();
  return { name, id };
}

export function encodeTimeKey(key: TimeKey): string {
  return encode(['t', key.ts, key.id]);
}

export function decodeTimeKey(raw: string): TimeKey {
  const [ts, id] = decodeParts(raw, 't');
  if (!MICRO_TS.test(ts) || !UUID.test(id)) invalidCursor();
  return { ts, id };
}
