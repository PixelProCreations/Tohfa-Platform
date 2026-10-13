/**
 * BR-104: SQL for the warehouse activity feed. ONE `UNION ALL` statement over the tables that already hold
 * each event; nothing is written and there is no activity table (rules.md BR-104 item 2 says why).
 *
 * Keyset paging: every branch applies the warehouse filter, the optional IST day window and the cursor
 * predicate `(occurred_at, type, source_id) < (cursor)`, orders itself newest first and takes limit + 1
 * rows (so each branch can use its `(warehouse_id, created_at)` index); the outer query re-orders the
 * merged rows the same way and keeps limit + 1, the extra row only telling the service there is a next page.
 *
 * `type` is compared and ordered with COLLATE "C" so the tie-break between two events at the same instant
 * is plain byte order, the same in the ORDER BY and in the cursor predicate, whatever the database
 * collation is. The timestamp leaves as microsecond text so the cursor built from it is exact.
 *
 * Selected columns are an allow-list: no farmer_id, customer data, title, note, reason or other free text.
 */
import type { Executor } from '../../db/pool.js';
import { reportsRepo } from '../reports/reports.repo.js';
import type { ActivityCursor, ActivityEvent, ActivityType } from './warehouse-activity.schema.js';

export type ActivityRow = ActivityEvent;

export interface ActivityFilter {
  warehouseId: string;
  /** The sources to include; a type not listed has no branch in the SQL at all. */
  types: ActivityType[];
  /** Inclusive Asia/Kolkata calendar dates, both or neither. */
  from?: string;
  to?: string;
  cursor?: ActivityCursor;
  /** Page size; the query returns up to limit + 1 rows. */
  limit: number;
}

export interface WarehouseActivityRepo {
  /** system_config.report_max_range_days (fallback 366), the same reader the reports and performance reads use. */
  maxRangeDays(db: Executor): Promise<number>;
  /** Up to `limit + 1` events, newest first. */
  page(db: Executor, filter: ActivityFilter): Promise<ActivityRow[]>;
}

interface Branch {
  type: ActivityType;
  /** FROM ... (with joins). */
  from: string;
  /** The warehouse predicate; `$1` is always the warehouse id. */
  warehouse: string;
  /** The immutable timestamp the event is anchored to. */
  at: string;
  id: string;
  reference: string;
  status: string;
  severity: string;
  qtyKg: string;
  direction: string;
  actor: string;
}

const NULL_TEXT = 'NULL::text';

const BRANCHES: readonly Branch[] = [
  {
    type: 'STOCK_MOVEMENT',
    from: 'stock_ledger l',
    warehouse: 'l.warehouse_id = $1',
    at: 'l.created_at',
    id: 'l.id',
    reference: 'l.movement_type::text',
    status: NULL_TEXT,
    severity: NULL_TEXT,
    qtyKg: 'l.qty_delta::text',
    direction: NULL_TEXT,
    actor: 'l.created_by',
  },
  {
    // Anchored at received_at (when the produce arrived), carrying the gross kg weighed in: accepted and
    // rejected kg change as the receipt is inspected, gross does not.
    type: 'GOODS_RECEIPT',
    from: 'goods_receipts gr',
    warehouse: 'gr.warehouse_id = $1',
    at: 'gr.received_at',
    id: 'gr.id',
    reference: 'gr.grn_number',
    status: 'gr.status::text',
    severity: NULL_TEXT,
    qtyKg: 'gr.gross_qty_kg::text',
    direction: NULL_TEXT,
    actor: 'gr.received_by',
  },
  {
    type: 'TRANSFER',
    from: 'stock_transfers t',
    warehouse: '(t.from_warehouse_id = $1 OR t.to_warehouse_id = $1)',
    at: 't.created_at',
    id: 't.id',
    reference: 't.transfer_number',
    status: 't.status',
    severity: NULL_TEXT,
    qtyKg: NULL_TEXT,
    direction: `CASE WHEN t.from_warehouse_id = $1 THEN 'OUTBOUND' ELSE 'INBOUND' END`,
    actor: 't.initiated_by',
  },
  {
    type: 'ISSUE',
    from: 'warehouse_issues i',
    warehouse: 'i.warehouse_id = $1',
    at: 'i.created_at',
    id: 'i.id',
    reference: 'i.issue_number',
    status: 'i.status',
    severity: 'i.severity',
    qtyKg: NULL_TEXT,
    direction: NULL_TEXT,
    actor: 'i.reported_by',
  },
  {
    // return_requests has no warehouse_id (0046_returns.sql): the order owns that fact.
    type: 'RETURN',
    from: 'return_requests r JOIN orders o ON o.id = r.order_id',
    warehouse: 'o.warehouse_id = $1',
    at: 'r.created_at',
    id: 'r.id',
    reference: 'r.id::text',
    status: 'r.status::text',
    severity: NULL_TEXT,
    qtyKg: NULL_TEXT,
    direction: NULL_TEXT,
    actor: 'NULL::uuid',
  },
  {
    // The derived expiry status of BR-105 is not repeated here; only the stored archive state is shown.
    type: 'DOCUMENT',
    from: 'warehouse_documents d',
    warehouse: 'd.warehouse_id = $1',
    at: 'd.created_at',
    id: 'd.id',
    reference: 'd.doc_type',
    status: `CASE WHEN d.archived_at IS NOT NULL THEN 'ARCHIVED' END`,
    severity: NULL_TEXT,
    qtyKg: NULL_TEXT,
    direction: NULL_TEXT,
    actor: 'd.uploaded_by',
  },
];

/** Builds the one statement; exported so its shape can be tested without a database. */
export function buildActivityQuery(filter: ActivityFilter): { text: string; values: unknown[] } {
  const values: unknown[] = [filter.warehouseId];
  const param = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  let window: ((column: string) => string) | null = null;
  if (filter.from !== undefined && filter.to !== undefined) {
    const from = param(filter.from);
    const to = param(filter.to);
    // Inclusive IST days: [from 00:00 IST, to + 1 day 00:00 IST), as warehouse-performance and reports.
    window = (column) =>
      `${column} >= (${from}::date)::timestamp AT TIME ZONE 'Asia/Kolkata'
           AND ${column} < ((${to}::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')`;
  }

  let after: ((branch: Branch) => string) | null = null;
  if (filter.cursor !== undefined) {
    const at = param(filter.cursor.occurredAt);
    const type = param(filter.cursor.type);
    const id = param(filter.cursor.sourceId);
    after = (branch) =>
      `(${branch.at}, '${branch.type}'::text COLLATE "C", ${branch.id}) < (${at}::timestamptz, ${type}::text COLLATE "C", ${id}::uuid)`;
  }

  const limit = param(filter.limit + 1);
  const wanted = new Set(filter.types);

  const branches = BRANCHES.filter((branch) => wanted.has(branch.type)).map((branch) => {
    const where = [branch.warehouse];
    if (window !== null) where.push(window(branch.at));
    if (after !== null) where.push(after(branch));
    return `(SELECT '${branch.type}'::text AS type, ${branch.id} AS source_id, ${branch.at} AS occurred_at,
          ${branch.reference} AS reference, ${branch.status} AS status, ${branch.severity} AS severity,
          ${branch.qtyKg} AS qty_kg, ${branch.direction} AS direction, ${branch.actor} AS actor_id
     FROM ${branch.from}
    WHERE ${where.join('\n      AND ')}
    ORDER BY ${branch.at} DESC, ${branch.id} DESC
    LIMIT ${limit})`;
  });

  const text = `SELECT e.type, e.source_id,
       to_char(e.occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS occurred_at_text,
       e.reference, e.status, e.severity, e.qty_kg, e.direction, e.actor_id
  FROM (
${branches.join('\n  UNION ALL\n')}
  ) e
 ORDER BY e.occurred_at DESC, e.type COLLATE "C" DESC, e.source_id DESC
 LIMIT ${limit}`;
  return { text, values };
}

interface RawRow {
  type: ActivityType;
  source_id: string;
  occurred_at_text: string;
  reference: string;
  status: string | null;
  severity: ActivityEvent['severity'];
  qty_kg: string | null;
  direction: 'OUTBOUND' | 'INBOUND' | null;
  actor_id: string | null;
}

export const warehouseActivityRepo: WarehouseActivityRepo = {
  maxRangeDays(db) {
    return reportsRepo.getMaxRangeDays(db);
  },

  async page(db, filter) {
    if (filter.types.length === 0) return [];
    const { text, values } = buildActivityQuery(filter);
    const result = await db.query<RawRow>(text, values);
    return result.rows.map((row) => ({
      type: row.type,
      sourceId: row.source_id,
      occurredAt: row.occurred_at_text,
      reference: row.reference,
      status: row.status,
      severity: row.severity,
      qtyKg: row.qty_kg,
      direction: row.direction,
      actorId: row.actor_id,
    }));
  },
};
