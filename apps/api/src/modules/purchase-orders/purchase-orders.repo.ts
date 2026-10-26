import type { Executor } from '../../db/pool.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import type {
  GoodsReceiptSummary,
  ListPurchaseOrdersQuery,
  PoStatus,
  ProduceGrade,
  PurchaseOrderDetailResponse,
  PurchaseOrderListItem,
} from './purchase-orders.schema.js';

/**
 * timestamptz -> ISO-8601 UTC ("2026-10-05T07:42:36.490Z"), the `format: date-time`
 * docs/openapi.yaml promises. node-postgres parses timestamptz into a Date, so the
 * columns are selected raw and serialized here (as listings.repo.ts does). Never
 * `::text` a timestamptz for the wire: Postgres's own form
 * ("2026-10-05 07:42:36.490266+00") is not RFC 3339 and Hermes parses it as NaN.
 * Calendar `date` columns (expectedDeliveryDate) stay `::text`.
 *
 * A JS Date stops at milliseconds, so list cursors are built in SQL (`cursorIssuedAt`
 * column, to_char ... US) to keep microseconds: a truncated cursor would skip rows
 * created within the same millisecond as the last row of a page.
 */
const CURSOR_TS = `'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'`;

export interface PurchaseOrderRow {
  id: string;
  po_number: string;
  farmer_id: string;
  listing_id: string;
  warehouse_id: string;
  crop_id: string;
  grade: ProduceGrade;
  quantity_kg: string;
  price_per_kg: string;
  total_amount: string;
  status: PoStatus;
  issued_by: string;
  issued_at: Date;
  expected_delivery_date: string | null;
  cancelled_by: string | null;
  cancelled_at: Date | null;
  cancellation_reason: string | null;
  created_at: Date;
  updated_at: Date | null;
  farmer_name?: string;
  tohfa_farmer_id?: string;
  /** BR-119: crop_master.name, joined by the reads that return a row; null when the crop is missing. */
  crop_name?: string | null;
}

export interface InsertPurchaseOrderData {
  farmerId: string;
  listingId: string;
  warehouseId: string;
  cropId: string;
  grade: ProduceGrade;
  quantityKg: string;
  pricePerKg: string;
  totalAmount: string;
  issuedBy: string;
  expectedDeliveryDate?: string | null | undefined;
}

export interface PurchaseOrdersRepo {
  nextPoNumber(tx: Executor): Promise<string>;
  insertPurchaseOrder(tx: Executor, data: InsertPurchaseOrderData): Promise<PurchaseOrderRow>;
  findPurchaseOrderById(
    tx: Executor,
    id: string,
    scope: ResolvedScope,
  ): Promise<PurchaseOrderDetailResponse | null>;
  findPurchaseOrderByListingId(tx: Executor, listingId: string): Promise<PurchaseOrderRow | null>;
  listPurchaseOrders(
    tx: Executor,
    scope: ResolvedScope,
    query: ListPurchaseOrdersQuery,
  ): Promise<{ items: PurchaseOrderListItem[]; nextCursor: string | null; hasMore: boolean }>;
  findGoodsReceiptsByPoId(tx: Executor, poId: string): Promise<GoodsReceiptSummary[]>;
}

export const purchaseOrdersRepo: PurchaseOrdersRepo = {
  async nextPoNumber(tx: Executor): Promise<string> {
    const year = new Date().getFullYear();
    const result = await tx.query<{ seq: string }>(
      `SELECT nextval('purchase_order_number_seq')::text AS seq`,
    );
    const num = (result.rows[0]?.seq ?? '1').padStart(6, '0');
    return `PO-${year}-${num}`;
  },

  async insertPurchaseOrder(
    tx: Executor,
    data: InsertPurchaseOrderData,
  ): Promise<PurchaseOrderRow> {
    const poNumber = await this.nextPoNumber(tx);
    // BR-119: the crop name is joined onto the inserted row in the same statement, so the approval
    // response can name the crop without a second lookup.
    const sql = `
      WITH ins AS (
      INSERT INTO purchase_orders (
        po_number,
        farmer_id,
        listing_id,
        warehouse_id,
        crop_id,
        grade,
        quantity_kg,
        price_per_kg,
        total_amount,
        issued_by,
        expected_delivery_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id,
        po_number,
        farmer_id,
        listing_id,
        warehouse_id,
        crop_id,
        grade,
        quantity_kg,
        price_per_kg,
        total_amount,
        status,
        issued_by,
        issued_at,
        expected_delivery_date,
        cancelled_by,
        cancelled_at,
        cancellation_reason,
        created_at,
        updated_at
      )
      SELECT ins.*, cm.name AS crop_name
        FROM ins
        LEFT JOIN crop_master cm ON cm.id = ins.crop_id
    `;

    const values = [
      poNumber,
      data.farmerId,
      data.listingId,
      data.warehouseId,
      data.cropId,
      data.grade,
      data.quantityKg,
      data.pricePerKg,
      data.totalAmount,
      data.issuedBy,
      data.expectedDeliveryDate ?? null,
    ];

    const result = await tx.query<PurchaseOrderRow>(sql, values);
    return result.rows[0]!;
  },

  async findPurchaseOrderByListingId(
    tx: Executor,
    listingId: string,
  ): Promise<PurchaseOrderRow | null> {
    const sql = `
      SELECT
        po.id,
        po.po_number,
        po.farmer_id,
        po.listing_id,
        po.warehouse_id,
        po.crop_id,
        po.grade,
        po.quantity_kg,
        po.price_per_kg,
        po.total_amount,
        po.status,
        po.issued_by,
        po.issued_at,
        po.expected_delivery_date,
        po.cancelled_by,
        po.cancelled_at,
        po.cancellation_reason,
        po.created_at,
        po.updated_at,
        cm.name AS crop_name
      FROM purchase_orders po
      LEFT JOIN crop_master cm ON cm.id = po.crop_id
      WHERE po.listing_id = $1
    `;
    const result = await tx.query<PurchaseOrderRow>(sql, [listingId]);
    return result.rows[0] ?? null;
  },

  async findPurchaseOrderById(
    tx: Executor,
    id: string,
    scope: ResolvedScope,
  ): Promise<PurchaseOrderDetailResponse | null> {
    const scopeFilter = scopedWhere(scope, {
      warehouseColumn: 'po.warehouse_id',
      startIndex: 2,
    });

    const sql = `
      SELECT
        po.id,
        po.po_number AS "poNumber",
        po.farmer_id AS "farmerId",
        po.listing_id AS "listingId",
        po.warehouse_id AS "warehouseId",
        po.crop_id AS "cropId",
        po.grade,
        po.quantity_kg::text AS "quantityKg",
        po.price_per_kg::text AS "pricePerKg",
        po.total_amount::text AS "totalAmount",
        po.status,
        po.expected_delivery_date::text AS "expectedDeliveryDate",
        po.issued_at AS "issuedAt",
        u.full_name AS "farmerName",
        f.tohfa_farmer_id AS "tohfaFarmerId",
        cm.name AS "cropName"
      FROM purchase_orders po
      LEFT JOIN farmers f ON f.id = po.farmer_id
      LEFT JOIN users u ON u.id = f.user_id
      -- BR-119: LEFT JOIN, so a missing crop row is a null name, never a missing purchase order.
      LEFT JOIN crop_master cm ON cm.id = po.crop_id
      WHERE po.id = $1 AND ${scopeFilter.sql}
    `;

    const result = await tx.query<
      Omit<PurchaseOrderDetailResponse, 'issuedAt' | 'goodsReceipts'> & { issuedAt: Date }
    >(sql, [id, ...scopeFilter.params]);
    const row = result.rows[0];
    if (!row) return null;

    const receipts = await this.findGoodsReceiptsByPoId(tx, id);
    return {
      ...row,
      cropName: row.cropName ?? null,
      issuedAt: row.issuedAt.toISOString(),
      goodsReceipts: receipts,
    };
  },

  async listPurchaseOrders(
    tx: Executor,
    scope: ResolvedScope,
    query: ListPurchaseOrdersQuery,
  ): Promise<{ items: PurchaseOrderListItem[]; nextCursor: string | null; hasMore: boolean }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (query.status) {
      conditions.push(`po.status = $${index}`);
      params.push(query.status);
      index += 1;
    }

    if (query.warehouseId) {
      conditions.push(`po.warehouse_id = $${index}`);
      params.push(query.warehouseId);
      index += 1;
    }

    if (query.cursor) {
      conditions.push(`po.issued_at < $${index}::timestamptz`);
      params.push(query.cursor);
      index += 1;
    }

    const scopeFilter = scopedWhere(scope, {
      warehouseColumn: 'po.warehouse_id',
      startIndex: index,
    });
    conditions.push(scopeFilter.sql);
    params.push(...scopeFilter.params);
    index = scopeFilter.nextIndex;

    const limit = query.limit;
    params.push(limit + 1);
    const limitClause = `LIMIT $${index}`;

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        po.id,
        po.po_number AS "poNumber",
        po.farmer_id AS "farmerId",
        po.listing_id AS "listingId",
        po.warehouse_id AS "warehouseId",
        po.crop_id AS "cropId",
        po.grade,
        po.quantity_kg::text AS "quantityKg",
        po.price_per_kg::text AS "pricePerKg",
        po.total_amount::text AS "totalAmount",
        po.status,
        po.expected_delivery_date::text AS "expectedDeliveryDate",
        po.issued_at AS "issuedAt",
        to_char(po.issued_at AT TIME ZONE 'UTC', ${CURSOR_TS}) AS "cursorIssuedAt",
        u.full_name AS "farmerName",
        cm.name AS "cropName"
      FROM purchase_orders po
      -- Display names for the admin list, joined here so a page is one query (no per-row lookup).
      -- LEFT JOINs: a missing farmer, user or crop row yields null names, never a dropped PO.
      LEFT JOIN farmers f ON f.id = po.farmer_id
      LEFT JOIN users u ON u.id = f.user_id
      LEFT JOIN crop_master cm ON cm.id = po.crop_id
      ${whereClause}
      ORDER BY po.issued_at DESC
      ${limitClause}
    `;

    const result = await tx.query<
      Omit<PurchaseOrderListItem, 'issuedAt'> & { issuedAt: Date; cursorIssuedAt: string }
    >(sql, params);
    const hasMore = result.rows.length > limit;
    const rawItems = hasMore ? result.rows.slice(0, limit) : result.rows;
    const nextCursor =
      hasMore && rawItems.length > 0 ? rawItems[rawItems.length - 1]!.cursorIssuedAt : null;
    const items: PurchaseOrderListItem[] = rawItems.map(({ cursorIssuedAt: _cursor, ...row }) => ({
      ...row,
      farmerName: row.farmerName ?? null,
      cropName: row.cropName ?? null,
      issuedAt: row.issuedAt.toISOString(),
    }));

    return { items, nextCursor, hasMore };
  },

  async findGoodsReceiptsByPoId(tx: Executor, poId: string): Promise<GoodsReceiptSummary[]> {
    // BR-119: every receipt of one purchase order is of that order's crop; joined here, once for
    // all of them, never looked up per receipt.
    const sql = `
      SELECT
        gr.id,
        gr.grn_number AS "grnNumber",
        gr.purchase_order_id AS "purchaseOrderId",
        gr.warehouse_id AS "warehouseId",
        gr.gross_qty_kg::text AS "grossQtyKg",
        gr.accepted_qty_kg::text AS "acceptedQtyKg",
        gr.rejected_qty_kg::text AS "rejectedQtyKg",
        gr.status,
        gr.created_at AS "receivedAt",
        cm.name AS "cropName"
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      LEFT JOIN crop_master cm ON cm.id = po.crop_id
      WHERE gr.purchase_order_id = $1
      ORDER BY gr.created_at ASC
    `;
    const result = await tx.query<Omit<GoodsReceiptSummary, 'receivedAt'> & { receivedAt: Date }>(
      sql,
      [poId],
    );
    return result.rows.map((row) => ({
      ...row,
      cropName: row.cropName ?? null,
      receivedAt: row.receivedAt.toISOString(),
    }));
  },
};
