/**
 * Returns & Issues (RMA). See CLAUDE.md for the four-file module pattern.
 *
 * <name>.repo.ts is the ONLY place that writes SQL for this module.
 * Rules:
 *  - Every function takes an `Executor` first so the service can compose calls
 *    inside one transaction (`withTransaction`).
 *  - Values are always positional params (`$1`), never string-interpolated.
 *    The ONE exception is a pre-built scope fragment from `scopedWhere`, whose
 *    column names come from our own code and whose values are still params.
 *  - Rows are mapped to the domain shape HERE, so snake_case never escapes
 *    this file.
 *  - No authorization decisions live here — the repo applies the filter it is
 *    handed; deciding what that filter is, is the service's job.
 *
 * `return_requests` carries no warehouse_id of its own (see
 * db/migrations/0042_returns.sql), so every warehouse-scoped query here joins
 * to `orders` and scopes on `o.warehouse_id`.
 */
import type { Executor } from '../../db/pool.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import type {
  InspectReturnItem,
  ListReturnsQuery,
  ReturnItemCondition,
  ReturnRequestItemResponse,
  ReturnRequestResponse,
  ReturnStatus,
  ReturnStatusHistoryEntryResponse,
  ReturnSummaryResponse,
} from './returnRequests.schema.js';

// ---------------------------------------------------------------------------
// Raw row shapes. Never leave this file.
// ---------------------------------------------------------------------------
interface ReturnSummaryRow {
  id: string;
  order_id: string;
  customer_id: string;
  warehouse_id: string;
  status: ReturnStatus;
  reason: string;
  note: string | null;
  created_at: Date;
  updated_at: Date | null;
}

interface ReturnItemRow {
  id: string;
  order_item_id: string;
  requested_qty: string;
  accepted_qty: string | null;
  damaged_qty: string | null;
  condition: ReturnItemCondition | null;
}

interface HistoryRow {
  id: string;
  return_request_id: string;
  from_status: ReturnStatus | null;
  to_status: ReturnStatus;
  changed_by: string | null;
  note: string | null;
  created_at: Date;
}

export interface OrderForReturn {
  id: string;
  customerId: string;
  warehouseId: string;
  status: string;
}

export interface OrderItemForReturn {
  id: string;
  qtyKg: string;
  unitPrice: string;
  status: string;
}

function toSummary(row: ReturnSummaryRow): ReturnSummaryResponse {
  return {
    id: row.id,
    orderId: row.order_id,
    customerId: row.customer_id,
    warehouseId: row.warehouse_id,
    status: row.status,
    reason: row.reason,
    note: row.note,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

function toItem(row: ReturnItemRow): ReturnRequestItemResponse {
  return {
    id: row.id,
    orderItemId: row.order_item_id,
    requestedQty: row.requested_qty,
    acceptedQty: row.accepted_qty,
    damagedQty: row.damaged_qty,
    condition: row.condition,
  };
}

function toHistoryEntry(row: HistoryRow): ReturnStatusHistoryEntryResponse {
  return {
    id: row.id,
    returnRequestId: row.return_request_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedBy: row.changed_by,
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

const SUMMARY_COLUMNS = `
  r.id, r.order_id, r.customer_id, o.warehouse_id, r.status, r.reason, r.note,
  r.created_at, r.updated_at
`;

export interface InsertReturnRequestInput {
  orderId: string;
  customerId: string;
  reason: string;
  note: string | null;
}

export interface InsertReturnRequestItemInput {
  orderItemId: string;
  requestedQty: string;
}

export interface InsertStatusHistoryInput {
  returnRequestId: string;
  fromStatus: ReturnStatus | null;
  toStatus: ReturnStatus;
  changedBy: string | null;
  note?: string | null;
}

export interface ListArgs {
  filters: ListReturnsQuery;
  scope: ResolvedScope;
}

export interface ListResult {
  items: ReturnSummaryResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReturnRequestsRepo {
  /** The order a return is being filed against, unscoped — the service decides who may see it. */
  findOrderForReturn(db: Executor, orderId: string): Promise<OrderForReturn | null>;
  /** The subset of an order's items named in a return request body. */
  findOrderItemsByIds(
    db: Executor,
    orderId: string,
    orderItemIds: string[],
  ): Promise<OrderItemForReturn[]>;

  insertReturnRequest(db: Executor, input: InsertReturnRequestInput): Promise<ReturnSummaryRowShape>;
  insertReturnRequestItems(
    db: Executor,
    returnRequestId: string,
    items: InsertReturnRequestItemInput[],
  ): Promise<ReturnRequestItemResponse[]>;
  insertStatusHistory(db: Executor, input: InsertStatusHistoryInput): Promise<void>;

  findById(db: Executor, id: string, scope: ResolvedScope): Promise<ReturnRequestResponse | null>;
  /** Unscoped lookup for a transition handler that has already loaded the row via findById. */
  findRawById(db: Executor, id: string): Promise<ReturnSummaryRowShape | null>;
  list(db: Executor, args: ListArgs): Promise<ListResult>;

  updateStatus(db: Executor, id: string, status: ReturnStatus): Promise<void>;
  /**
   * Conditional transition: only moves `id` to `newStatus` when it is
   * currently `expectedCurrent`, and reports whether it actually did. This is
   * what makes a refund endpoint's status transition idempotent — a replay
   * that arrives after the first call already advanced the row is a no-op
   * here rather than a second write (BR-61).
   */
  updateStatusIfCurrent(
    db: Executor,
    id: string,
    expectedCurrent: ReturnStatus,
    newStatus: ReturnStatus,
  ): Promise<boolean>;
  updateInspectionItems(db: Executor, returnRequestId: string, items: InspectReturnItem[]): Promise<void>;
  markOrderItemsReturned(db: Executor, orderItemIds: string[]): Promise<void>;

  getItems(db: Executor, returnRequestId: string): Promise<ReturnRequestItemResponse[]>;
  getHistory(db: Executor, returnRequestId: string): Promise<ReturnStatusHistoryEntryResponse[]>;

  /** Sum of unit_price * accepted_qty across a return's items, for the refund amount. */
  sumAcceptedAmount(db: Executor, returnRequestId: string): Promise<string>;
}

/** The shape `insertReturnRequest`/`findRawById` return — status + timestamps, no join needed. */
export interface ReturnSummaryRowShape {
  id: string;
  orderId: string;
  customerId: string;
  status: ReturnStatus;
  reason: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export const returnRequestsRepo: ReturnRequestsRepo = {
  async findOrderForReturn(db, orderId): Promise<OrderForReturn | null> {
    const result = await db.query<OrderForReturn>(
      `SELECT o.id, o.customer_id AS "customerId", o.warehouse_id AS "warehouseId", o.status
         FROM orders o
        WHERE o.id = $1`,
      [orderId],
    );
    return result.rows[0] ?? null;
  },

  async findOrderItemsByIds(db, orderId, orderItemIds): Promise<OrderItemForReturn[]> {
    const result = await db.query<OrderItemForReturn>(
      `SELECT oi.id, oi.qty_kg::text AS "qtyKg", oi.unit_price::text AS "unitPrice", oi.status
         FROM order_items oi
        WHERE oi.order_id = $1 AND oi.id = ANY($2::uuid[])`,
      [orderId, orderItemIds],
    );
    return result.rows;
  },

  async insertReturnRequest(db, input): Promise<ReturnSummaryRowShape> {
    const result = await db.query<{
      id: string;
      order_id: string;
      customer_id: string;
      status: ReturnStatus;
      reason: string;
      note: string | null;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `INSERT INTO return_requests (order_id, customer_id, reason, note)
       VALUES ($1, $2, $3, $4)
       RETURNING id, order_id, customer_id, status, reason, note, created_at, updated_at`,
      [input.orderId, input.customerId, input.reason, input.note],
    );
    const row = result.rows[0]!;
    return {
      id: row.id,
      orderId: row.order_id,
      customerId: row.customer_id,
      status: row.status,
      reason: row.reason,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async insertReturnRequestItems(db, returnRequestId, items): Promise<ReturnRequestItemResponse[]> {
    const inserted: ReturnRequestItemResponse[] = [];
    for (const item of items) {
      const result = await db.query<ReturnItemRow>(
        `INSERT INTO return_request_items (return_request_id, order_item_id, requested_qty)
         VALUES ($1, $2, $3)
         RETURNING id, order_item_id, requested_qty::text AS requested_qty,
                   accepted_qty::text AS accepted_qty, damaged_qty::text AS damaged_qty, condition`,
        [returnRequestId, item.orderItemId, item.requestedQty],
      );
      inserted.push(toItem(result.rows[0]!));
    }
    return inserted;
  },

  async insertStatusHistory(db, input): Promise<void> {
    await db.query(
      `INSERT INTO return_request_status_history
         (return_request_id, from_status, to_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.returnRequestId, input.fromStatus, input.toStatus, input.changedBy, input.note ?? null],
    );
  },

  async findById(db, id, scope): Promise<ReturnRequestResponse | null> {
    const scopeFilter = scopedWhere(scope, { warehouseColumn: 'o.warehouse_id', startIndex: 2 });

    const result = await db.query<ReturnSummaryRow>(
      `SELECT ${SUMMARY_COLUMNS}
         FROM return_requests r
         JOIN orders o ON o.id = r.order_id
        WHERE r.id = $1 AND ${scopeFilter.sql}
        LIMIT 1`,
      [id, ...scopeFilter.params],
    );

    const row = result.rows[0];
    if (row === undefined) return null;

    const items = await this.getItems(db, id);
    return { ...toSummary(row), items };
  },

  async findRawById(db, id): Promise<ReturnSummaryRowShape | null> {
    const result = await db.query<{
      id: string;
      order_id: string;
      customer_id: string;
      status: ReturnStatus;
      reason: string;
      note: string | null;
      created_at: Date;
      updated_at: Date | null;
    }>(
      `SELECT id, order_id, customer_id, status, reason, note, created_at, updated_at
         FROM return_requests
        WHERE id = $1
        LIMIT 1`,
      [id],
    );
    const row = result.rows[0];
    if (row === undefined) return null;
    return {
      id: row.id,
      orderId: row.order_id,
      customerId: row.customer_id,
      status: row.status,
      reason: row.reason,
      note: row.note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async list(db, { filters, scope }): Promise<ListResult> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (filters.status !== undefined) {
      conditions.push(`r.status = $${index}`);
      params.push(filters.status);
      index += 1;
    }

    if (filters.cursor !== undefined) {
      conditions.push(`r.created_at < $${index}::timestamptz`);
      params.push(filters.cursor);
      index += 1;
    }

    const scopeFilter = scopedWhere(scope, { warehouseColumn: 'o.warehouse_id', startIndex: index });
    conditions.push(scopeFilter.sql);
    params.push(...scopeFilter.params);
    index = scopeFilter.nextIndex;

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit;
    params.push(limit + 1);
    const limitClause = `LIMIT $${index}`;

    const result = await db.query<ReturnSummaryRow>(
      `SELECT ${SUMMARY_COLUMNS}
         FROM return_requests r
         JOIN orders o ON o.id = r.order_id
        ${whereClause}
        ORDER BY r.created_at DESC
        ${limitClause}`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const items = rows.map(toSummary);
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.createdAt : null;

    return { items, nextCursor, hasMore };
  },

  async updateStatus(db, id, status): Promise<void> {
    await db.query(
      `UPDATE return_requests SET status = $2, updated_at = now() WHERE id = $1`,
      [id, status],
    );
  },

  async updateStatusIfCurrent(db, id, expectedCurrent, newStatus): Promise<boolean> {
    const result = await db.query(
      `UPDATE return_requests
          SET status = $3, updated_at = now()
        WHERE id = $1 AND status = $2
        RETURNING id`,
      [id, expectedCurrent, newStatus],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async updateInspectionItems(db, returnRequestId, items): Promise<void> {
    for (const item of items) {
      await db.query(
        `UPDATE return_request_items
            SET accepted_qty = $3, damaged_qty = $4, condition = $5, updated_at = now()
          WHERE return_request_id = $1 AND order_item_id = $2`,
        [returnRequestId, item.orderItemId, item.acceptedQty, item.damagedQty, item.condition],
      );
    }
  },

  async markOrderItemsReturned(db, orderItemIds): Promise<void> {
    if (orderItemIds.length === 0) return;
    await db.query(
      `UPDATE order_items SET status = 'RETURNED', updated_at = now() WHERE id = ANY($1::uuid[])`,
      [orderItemIds],
    );
  },

  async getItems(db, returnRequestId): Promise<ReturnRequestItemResponse[]> {
    const result = await db.query<ReturnItemRow>(
      `SELECT id, order_item_id, requested_qty::text AS requested_qty,
              accepted_qty::text AS accepted_qty, damaged_qty::text AS damaged_qty, condition
         FROM return_request_items
        WHERE return_request_id = $1
        ORDER BY created_at ASC`,
      [returnRequestId],
    );
    return result.rows.map(toItem);
  },

  async getHistory(db, returnRequestId): Promise<ReturnStatusHistoryEntryResponse[]> {
    const result = await db.query<HistoryRow>(
      `SELECT id, return_request_id, from_status, to_status, changed_by, note, created_at
         FROM return_request_status_history
        WHERE return_request_id = $1
        ORDER BY created_at ASC`,
      [returnRequestId],
    );
    return result.rows.map(toHistoryEntry);
  },

  async sumAcceptedAmount(db, returnRequestId): Promise<string> {
    // ROUND to 2dp before leaving SQL: unit_price (2dp) * accepted_qty (3dp)
    // produces up to 5dp, and Money's wire format never carries more than 2.
    const result = await db.query<{ total: string | null }>(
      `SELECT ROUND(SUM(oi.unit_price * COALESCE(ri.accepted_qty, 0))::numeric, 2)::text AS total
         FROM return_request_items ri
         JOIN order_items oi ON oi.id = ri.order_item_id
        WHERE ri.return_request_id = $1`,
      [returnRequestId],
    );
    return result.rows[0]?.total ?? '0.00';
  },
};
