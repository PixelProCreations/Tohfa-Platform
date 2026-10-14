import type { Executor } from '../../db/pool.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import type {
  GoodsReceiptSummary,
  ListPurchaseOrdersQuery,
  PoStatus,
  ProduceGrade,
  PurchaseOrderDetailResponse,
  PurchaseOrderResponse,
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
  ): Promise<{ items: PurchaseOrderResponse[]; nextCursor: string | null; hasMore: boolean }>;
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
    const sql = `
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
      FROM purchase_orders
      WHERE listing_id = $1
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
        f.tohfa_farmer_id AS "tohfaFarmerId"
      FROM purchase_orders po
      LEFT JOIN farmers f ON f.id = po.farmer_id
      LEFT JOIN users u ON u.id = f.user_id
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
      issuedAt: row.issuedAt.toISOString(),
      goodsReceipts: receipts,
    };
  },

  async listPurchaseOrders(
    tx: Executor,
    scope: ResolvedScope,
    query: ListPurchaseOrdersQuery,
  ): Promise<{ items: PurchaseOrderResponse[]; nextCursor: string | null; hasMore: boolean }> {
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
        to_char(po.issued_at AT TIME ZONE 'UTC', ${CURSOR_TS}) AS "cursorIssuedAt"
      FROM purchase_orders po
      ${whereClause}
      ORDER BY po.issued_at DESC
      ${limitClause}
    `;

    const result = await tx.query<
      Omit<PurchaseOrderResponse, 'issuedAt'> & { issuedAt: Date; cursorIssuedAt: string }
    >(sql, params);
    const hasMore = result.rows.length > limit;
    const rawItems = hasMore ? result.rows.slice(0, limit) : result.rows;
    const nextCursor =
      hasMore && rawItems.length > 0 ? rawItems[rawItems.length - 1]!.cursorIssuedAt : null;
    const items: PurchaseOrderResponse[] = rawItems.map(({ cursorIssuedAt: _cursor, ...row }) => ({
      ...row,
      issuedAt: row.issuedAt.toISOString(),
    }));

    return { items, nextCursor, hasMore };
  },

  async findGoodsReceiptsByPoId(tx: Executor, poId: string): Promise<GoodsReceiptSummary[]> {
    const sql = `
      SELECT
        id,
        grn_number AS "grnNumber",
        purchase_order_id AS "purchaseOrderId",
        warehouse_id AS "warehouseId",
        gross_qty_kg::text AS "grossQtyKg",
        accepted_qty_kg::text AS "acceptedQtyKg",
        rejected_qty_kg::text AS "rejectedQtyKg",
        status,
        created_at AS "receivedAt"
      FROM goods_receipts
      WHERE purchase_order_id = $1
      ORDER BY created_at ASC
    `;
    const result = await tx.query<Omit<GoodsReceiptSummary, 'receivedAt'> & { receivedAt: Date }>(
      sql,
      [poId],
    );
    return result.rows.map((row) => ({ ...row, receivedAt: row.receivedAt.toISOString() }));
  },
};
