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
 * db/migrations/0046_returns.sql), so every warehouse-scoped query here joins
 * to `orders` and scopes on `o.warehouse_id`.
 */
import type { Executor } from '../../db/pool.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import type {
  InspectReturnItem,
  ListReturnsQuery,
  ReturnItemCondition,
  ReturnKpiSummary,
  ReturnRequestItemResponse,
  ReturnRequestResponse,
  ReturnStatus,
  ReturnStatusHistoryEntryResponse,
  ReturnSummaryResponse,
  ReturnsSummaryQuery,
  ReturnsSummaryResponse,
} from './returnRequests.schema.js';

// ---------------------------------------------------------------------------
// Raw row shapes. Never leave this file.
// ---------------------------------------------------------------------------
interface ReturnSummaryRow {
  id: string;
  order_id: string;
  order_number?: string | null;
  customer_id: string;
  customer_name?: string | null;
  warehouse_id: string;
  status: ReturnStatus;
  reason: string;
  note: string | null;
  issue_category?: string | null;
  issue_ticket?: string | null;
  requested_resolution?: string | null;
  customer_evidence?: string[] | null;
  inspection_notes?: string | null;
  inspection_photos?: string[] | null;
  return_window_eligible?: boolean | null;
  projected_refund_amount?: string | null;
  projected_refund_method?: string | null;
  photo_keys: string[] | null;
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
    orderNumber: row.order_number ?? null,
    customerId: row.customer_id,
    customerName: row.customer_name ?? null,
    warehouseId: row.warehouse_id,
    status: row.status,
    reason: row.reason,
    note: row.note,
    issueCategory: row.issue_category ?? null,
    issueTicket: row.issue_ticket ?? null,
    requestedResolution: row.requested_resolution ?? null,
    customerEvidence: row.customer_evidence ?? [],
    inspectionNotes: row.inspection_notes ?? null,
    inspectionPhotos: row.inspection_photos ?? [],
    returnWindowEligible: row.return_window_eligible ?? true,
    projectedRefundAmount: row.projected_refund_amount ?? null,
    projectedRefundMethod: row.projected_refund_method ?? null,
    // BR-204: STORAGE KEYS here; the service replaces them with signed read URLs before any response.
    photos: row.photo_keys ?? [],
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
  r.id, r.order_id, o.order_number, r.customer_id, u.full_name AS customer_name,
  o.warehouse_id, r.status, r.reason, r.note,
  r.issue_category, r.issue_ticket, r.requested_resolution, r.customer_evidence,
  r.inspection_notes, r.inspection_photos, r.photo_keys,
  (r.created_at <= (COALESCE(o.completed_at, o.placed_at) + interval '7 days')) AS return_window_eligible,
  o.payment_method AS projected_refund_method,
  ROUND(COALESCE(
    (SELECT SUM(oi.unit_price * (CASE WHEN r.status = 'PENDING' THEN ri.requested_qty ELSE COALESCE(ri.accepted_qty, 0) END))
       FROM return_request_items ri
       JOIN order_items oi ON oi.id = ri.order_item_id
      WHERE ri.return_request_id = r.id),
    0
  )::numeric, 2)::text AS projected_refund_amount,
  r.created_at, r.updated_at
`;

export interface InsertReturnRequestInput {
  orderId: string;
  customerId: string;
  reason: string;
  note: string | null;
  issueCategory?: string | null;
  issueTicket?: string | null;
  requestedResolution?: string | null;
  customerEvidence?: string[];
  /** BR-204: validated storage keys of the caller's own ISSUE_PHOTO uploads (max 5). */
  photoKeys?: string[];
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
  summary: ReturnKpiSummary;
}

/**
 * The customer's own list (BR-155g) carries no staff KPI summary — those counts are a
 * warehouse-scoped admin figure and have no meaning on a customer response.
 */
export type CustomerListResult = Omit<ListResult, 'summary'>;

/** BR-155: a customer's own returns, newest first. customerId is mandatory, never optional. */
export interface CustomerListArgs {
  customerId: string;
  cursor?: string | undefined;
  limit: number;
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

  /**
   * BR-155e: per order item, the quantity already on returns that were not REJECTED, as kg
   * strings ("1.500"). Items with nothing returned are absent from the map.
   */
  sumAlreadyReturnedQty(
    db: Executor,
    orderId: string,
    orderItemIds: string[],
  ): Promise<Record<string, string>>;

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
  /** BR-155g: filtered by return_requests.customer_id in SQL. */
  listForCustomer(db: Executor, args: CustomerListArgs): Promise<CustomerListResult>;
  /** BR-155h: null for an unknown id AND for another customer's return. */
  findByIdForCustomer(db: Executor, id: string, customerId: string): Promise<ReturnRequestResponse | null>;

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
  updateInspectionItems(
    db: Executor,
    returnRequestId: string,
    items: InspectReturnItem[],
    notes?: string | null,
    photos?: string[],
  ): Promise<void>;
  markOrderItemsReturned(db: Executor, orderItemIds: string[]): Promise<void>;

  getItems(db: Executor, returnRequestId: string): Promise<ReturnRequestItemResponse[]>;
  getHistory(db: Executor, returnRequestId: string): Promise<ReturnStatusHistoryEntryResponse[]>;

  /** Sum of unit_price * accepted_qty across a return's items, for the refund amount. */
  sumAcceptedAmount(db: Executor, returnRequestId: string): Promise<string>;
  getSummary(
    db: Executor,
    args: { scope: ResolvedScope; filters: ReturnsSummaryQuery },
  ): Promise<ReturnsSummaryResponse>;
}

/** The shape `insertReturnRequest`/`findRawById` return — status + timestamps, no join needed. */
export interface ReturnSummaryRowShape {
  id: string;
  orderId: string;
  orderNumber?: string | null;
  customerId: string;
  customerName?: string | null;
  warehouseId?: string;
  status: ReturnStatus;
  reason: string;
  note: string | null;
  issueCategory?: string | null;
  issueTicket?: string | null;
  requestedResolution?: string | null;
  customerEvidence?: string[];
  inspectionNotes?: string | null;
  inspectionPhotos?: string[];
  returnWindowEligible?: boolean;
  projectedRefundAmount?: string | null;
  projectedRefundMethod?: string | null;
  /** BR-204: storage keys (not URLs). */
  photoKeys?: string[];
  createdAt: Date;
  updatedAt: Date | null;
}

/** BR-204: upload rows for photo validation (owner + storage key). Not on the repo interface so
 * hand-built repo fakes stay valid; injected into the service as a dependency. */
export async function findUploadsForReturn(
  db: Executor,
  ids: string[],
): Promise<Array<{ id: string; storageKey: string; uploadedBy: string | null }>> {
  if (ids.length === 0) return [];
  const res = await db.query<{ id: string; storage_key: string; uploaded_by: string | null }>(
    `SELECT id, storage_key, uploaded_by FROM uploads WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
    [ids],
  );
  return res.rows.map((r) => ({ id: r.id, storageKey: r.storage_key, uploadedBy: r.uploaded_by }));
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

  async sumAlreadyReturnedQty(db, orderId, orderItemIds): Promise<Record<string, string>> {
    const result = await db.query<{ order_item_id: string; qty: string }>(
      `SELECT ri.order_item_id, SUM(ri.requested_qty)::numeric(12,3)::text AS qty
         FROM return_request_items ri
         JOIN return_requests r ON r.id = ri.return_request_id
        WHERE r.order_id = $1
          AND ri.order_item_id = ANY($2::uuid[])
          AND r.status <> 'REJECTED'
        GROUP BY ri.order_item_id`,
      [orderId, orderItemIds],
    );
    return Object.fromEntries(result.rows.map((row) => [row.order_item_id, row.qty]));
  },

  async insertReturnRequest(db, input): Promise<ReturnSummaryRowShape> {
    const result = await db.query<{
      id: string;
      order_id: string;
      customer_id: string;
      status: ReturnStatus;
      reason: string;
      note: string | null;
      issue_category: string | null;
      issue_ticket: string | null;
      requested_resolution: string | null;
      customer_evidence: string[];
      photo_keys: string[];
      created_at: Date;
      updated_at: Date | null;
    }>(
      `INSERT INTO return_requests (
         order_id, customer_id, reason, note,
         issue_category, issue_ticket, requested_resolution, customer_evidence,
         photo_keys
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[])
       RETURNING id, order_id, customer_id, status, reason, note,
                 issue_category, issue_ticket, requested_resolution, customer_evidence,
                 photo_keys, created_at, updated_at`,
      [
        input.orderId,
        input.customerId,
        input.reason,
        input.note,
        input.issueCategory ?? null,
        input.issueTicket ?? null,
        input.requestedResolution ?? null,
        input.customerEvidence ?? [],
        input.photoKeys ?? [],
      ],
    );
    const row = result.rows[0]!;
    return {
      id: row.id,
      orderId: row.order_id,
      customerId: row.customer_id,
      status: row.status,
      reason: row.reason,
      note: row.note,
      issueCategory: row.issue_category,
      issueTicket: row.issue_ticket,
      requestedResolution: row.requested_resolution,
      customerEvidence: row.customer_evidence,
      photoKeys: row.photo_keys,
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
         LEFT JOIN customers c ON c.id = r.customer_id
         LEFT JOIN users u ON u.id = c.user_id
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

    if (filters.warehouseId !== undefined) {
      conditions.push(`o.warehouse_id = $${index}`);
      params.push(filters.warehouseId);
      index += 1;
    }

    if (filters.q !== undefined && filters.q.trim().length > 0) {
      conditions.push(`(o.order_number ILIKE '%' || $${index} || '%' OR u.full_name ILIKE '%' || $${index} || '%' OR r.reason ILIKE '%' || $${index} || '%')`);
      params.push(filters.q.trim());
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
         LEFT JOIN customers c ON c.id = r.customer_id
         LEFT JOIN users u ON u.id = c.user_id
        ${whereClause}
        ORDER BY r.created_at DESC
        ${limitClause}`,
      params,
    );

    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;
    const items = rows.map(toSummary);
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.createdAt : null;

    // Compute KPI summary counts across caller's scoped set (respecting warehouseId if provided)
    const summaryConditions: string[] = [];
    const summaryParams: unknown[] = [];
    let sIdx = 1;

    if (filters.warehouseId !== undefined) {
      summaryConditions.push(`o.warehouse_id = $${sIdx}`);
      summaryParams.push(filters.warehouseId);
      sIdx += 1;
    }

    const summaryScope = scopedWhere(scope, { warehouseColumn: 'o.warehouse_id', startIndex: sIdx });
    summaryConditions.push(summaryScope.sql);
    summaryParams.push(...summaryScope.params);

    const summaryWhere = summaryConditions.length > 0 ? `WHERE ${summaryConditions.join(' AND ')}` : '';

    const summaryResult = await db.query<{
      pending: string;
      under_review: string;
      approved: string;
      refund_pending: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE r.status = 'PENDING')::int AS pending,
         COUNT(*) FILTER (WHERE r.status = 'INSPECTED')::int AS under_review,
         COUNT(*) FILTER (WHERE r.status = 'APPROVED')::int AS approved,
         COUNT(*) FILTER (WHERE r.status = 'REFUND_PENDING_BANK')::int AS refund_pending
       FROM return_requests r
       JOIN orders o ON o.id = r.order_id
       ${summaryWhere}`,
      summaryParams,
    );

    const summaryRow = summaryResult.rows[0];
    const summary: ReturnKpiSummary = {
      pending: parseInt(summaryRow?.pending ?? '0', 10),
      underReview: parseInt(summaryRow?.under_review ?? '0', 10),
      approved: parseInt(summaryRow?.approved ?? '0', 10),
      refundPending: parseInt(summaryRow?.refund_pending ?? '0', 10),
    };

    return { items, nextCursor, hasMore, summary };
  },

  async listForCustomer(db, { customerId, cursor, limit }): Promise<CustomerListResult> {
    const params: unknown[] = [customerId];
    let cursorClause = '';
    if (cursor !== undefined) {
      params.push(cursor);
      cursorClause = `AND r.created_at < $${params.length}::timestamptz`;
    }
    params.push(limit + 1);
    const result = await db.query<ReturnSummaryRow>(
      `SELECT ${SUMMARY_COLUMNS}
         FROM return_requests r
         JOIN orders o ON o.id = r.order_id
         LEFT JOIN customers c ON c.id = r.customer_id
         LEFT JOIN users u ON u.id = c.user_id
        WHERE r.customer_id = $1 ${cursorClause}
        ORDER BY r.created_at DESC
        LIMIT $${params.length}`,
      params,
    );
    const hasMore = result.rows.length > limit;
    const items = (hasMore ? result.rows.slice(0, limit) : result.rows).map(toSummary);
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.createdAt : null;
    return { items, nextCursor, hasMore };
  },

  async findByIdForCustomer(db, id, customerId): Promise<ReturnRequestResponse | null> {
    const result = await db.query<ReturnSummaryRow>(
      `SELECT ${SUMMARY_COLUMNS}
         FROM return_requests r
         JOIN orders o ON o.id = r.order_id
         LEFT JOIN customers c ON c.id = r.customer_id
         LEFT JOIN users u ON u.id = c.user_id
        WHERE r.id = $1 AND r.customer_id = $2
        LIMIT 1`,
      [id, customerId],
    );
    const row = result.rows[0];
    if (row === undefined) return null;
    const items = await this.getItems(db, id);
    return { ...toSummary(row), items };
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

  async updateInspectionItems(db, returnRequestId, items, notes, photos): Promise<void> {
    for (const item of items) {
      await db.query(
        `UPDATE return_request_items
            SET accepted_qty = $3, damaged_qty = $4, condition = $5, updated_at = now()
          WHERE return_request_id = $1 AND order_item_id = $2`,
        [returnRequestId, item.orderItemId, item.acceptedQty, item.damagedQty, item.condition],
      );
    }
    if (notes !== undefined || photos !== undefined) {
      await db.query(
        `UPDATE return_requests
            SET inspection_notes = COALESCE($2, inspection_notes),
                inspection_photos = COALESCE($3, inspection_photos),
                updated_at = now()
          WHERE id = $1`,
        [returnRequestId, notes ?? null, photos ?? null],
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

  async getSummary(db, { scope, filters }): Promise<ReturnsSummaryResponse> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (filters.warehouseId !== undefined) {
      conditions.push(`o.warehouse_id = $${index}`);
      params.push(filters.warehouseId);
      index += 1;
    }
    if (filters.from !== undefined) {
      conditions.push(`r.created_at >= ($${index}::text || ' 00:00:00+05:30')::timestamptz`);
      params.push(filters.from);
      index += 1;
    }
    if (filters.to !== undefined) {
      conditions.push(`r.created_at <= ($${index}::text || ' 23:59:59.999999+05:30')::timestamptz`);
      params.push(filters.to);
      index += 1;
    }

    const scopeFilter = scopedWhere(scope, { warehouseColumn: 'o.warehouse_id', startIndex: index });
    conditions.push(scopeFilter.sql);
    params.push(...scopeFilter.params);

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE r.status = 'PENDING')::int AS pending,
        COUNT(*) FILTER (WHERE r.status = 'INSPECTED')::int AS inspecting,
        COUNT(*) FILTER (WHERE r.status = 'APPROVED')::int AS approved,
        COUNT(*) FILTER (WHERE r.status = 'REJECTED')::int AS rejected,
        COUNT(*) FILTER (WHERE r.status IN ('REFUNDED', 'REFUND_PENDING_BANK'))::int AS refunded
      FROM return_requests r
      JOIN orders o ON o.id = r.order_id
      ${whereClause}
    `;
    const res = await db.query<{
      total: number;
      pending: number;
      inspecting: number;
      approved: number;
      rejected: number;
      refunded: number;
    }>(sql, params);
    const row = res.rows[0];
    return {
      total: row?.total ?? 0,
      pending: row?.pending ?? 0,
      inspecting: row?.inspecting ?? 0,
      approved: row?.approved ?? 0,
      rejected: row?.rejected ?? 0,
      refunded: row?.refunded ?? 0,
    };
  },
};
