/**
 * BR-104: the warehouse activity feed. Must match docs/openapi.yaml (`GET /warehouses/{id}/activity`).
 *
 * The cursor codec lives here (not in the service) so the query schema can refuse a malformed cursor
 * as a 422 on `query.cursor` before the handler runs, and the service can decode it with the same code.
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

export const activityTypes = ['STOCK_MOVEMENT', 'GOODS_RECEIPT', 'TRANSFER', 'ISSUE', 'RETURN', 'DOCUMENT'] as const;
export type ActivityType = (typeof activityTypes)[number];
const activityTypeEnum = z.enum(activityTypes);

// ---------------------------------------------------------------------------
// Cursor: base64url of the JSON array [occurredAt, type, sourceId] of the last row of a page.
// `occurredAt` is the full-precision (microsecond) UTC text Postgres produced; a JS Date would drop the
// microseconds and make the keyset predicate skip or repeat rows that differ below the millisecond.
// ---------------------------------------------------------------------------
export interface ActivityCursor {
  occurredAt: string;
  type: ActivityType;
  sourceId: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MICRO_INSTANT = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d:[0-5]\d\.\d{6}Z$/;
const CURSOR_MAX = 512;

export function encodeActivityCursor(cursor: ActivityCursor): string {
  return Buffer.from(JSON.stringify([cursor.occurredAt, cursor.type, cursor.sourceId]), 'utf8').toString('base64url');
}

/** The decoded cursor, or null for anything this endpoint did not produce. Never throws. */
export function decodeActivityCursor(raw: string): ActivityCursor | null {
  if (raw.length === 0 || raw.length > CURSOR_MAX || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length !== 3 || !parsed.every((part) => typeof part === 'string')) return null;
  const [occurredAt, type, sourceId] = parsed as [string, string, string];
  const instant = MICRO_INSTANT.exec(occurredAt);
  // A forged value is a 422 here, not a failed ::timestamptz / ::uuid cast (500) in SQL.
  if (instant === null || !isCalendarDate(instant[1]!)) return null;
  if (!activityTypeEnum.safeParse(type).success || !UUID.test(sourceId)) return null;
  return { occurredAt, type: type as ActivityType, sourceId };
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------
const calendarDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/**
 * `type` is ONE comma-separated parameter (`?type=ISSUE,RETURN`); a repeated parameter arrives as an
 * array and is refused, so there is a single representation to document and test.
 */
const typeList = z
  .string()
  .transform((value) => value.split(','))
  .pipe(z.array(activityTypeEnum).min(1))
  .transform((types) => [...new Set(types)]);

/** GET /v1/warehouses/{id}/activity. The span cap (report_max_range_days) is enforced by the service. */
export const activityQuery = z
  .object({
    type: typeList.optional(),
    from: calendarDate.optional(),
    to: calendarDate.optional(),
    cursor: z
      .string()
      .max(CURSOR_MAX)
      .refine((value) => decodeActivityCursor(value) !== null, { message: 'cursor is not a value returned by this endpoint.' })
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((value) => (value.from === undefined) === (value.to === undefined), {
    message: 'from and to must be given together',
    path: ['to'],
  })
  .refine((value) => value.from === undefined || value.to === undefined || value.from <= value.to, {
    message: '"from" must be earlier than or equal to "to"',
    path: ['to'],
  });
export type ActivityQuery = z.infer<typeof activityQuery>;

// ---------------------------------------------------------------------------
// Response. An allow-list: no farmer, no customer, no free text (BR-104 item 5).
// ---------------------------------------------------------------------------
export const activityEvent = z.object({
  type: activityTypeEnum,
  /** The id of the source row (ledger row, goods receipt, transfer, issue, return request or document). */
  sourceId: z.string().uuid(),
  /** UTC instant with microsecond precision, e.g. `2033-03-10T08:00:00.000002Z`. */
  occurredAt: z.string().regex(MICRO_INSTANT),
  /** Movement type, GRN number, transfer number, issue number, return request id or document type. */
  reference: z.string(),
  /** Current status of a goods receipt, transfer, issue or return; `ARCHIVED` for an archived document; else null. */
  status: z.string().nullable(),
  /** Issue severity; null for every other type. */
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).nullable(),
  /** Signed ledger kg for a stock movement, gross kg for a goods receipt; else null. */
  qtyKg: z.string().regex(/^-?\d{1,9}\.\d{3}$/).nullable(),
  /** OUTBOUND or INBOUND for a transfer, relative to the requested warehouse; else null. */
  direction: z.enum(['OUTBOUND', 'INBOUND']).nullable(),
  /** The user recorded on the source row (ledger created_by, received_by, initiated_by, reported_by, uploaded_by). */
  actorId: z.string().uuid().nullable(),
});
export type ActivityEvent = z.infer<typeof activityEvent>;

export const activityPageResponse = z.object({
  items: z.array(activityEvent),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ActivityPage = z.infer<typeof activityPageResponse>;
