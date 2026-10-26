import { writeAuditLog, type AuditEntry } from '../../audit/auditLog.js';
import type { Executor } from '../../db/pool.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import { toBatchView, type BatchRow } from '../inventory/inventory.repo.js';
import type { BatchView } from '../inventory/inventory.schema.js';
import { counterOffersRepo } from '../listings/counter-offers.repo.js';
import type { ProduceGrade } from '../purchase-orders/purchase-orders.schema.js';
import type {
  CreateGoodsReceiptBody,
  DiscrepancyType,
  GoodsReceiptDiscrepancyResponse,
  GoodsReceiptResponse,
  GrnStatus,
  ListGoodsReceiptDiscrepanciesQuery,
  ListGoodsReceiptsQuery,
  QcOutcome,
  QualityCheckCreateBody,
  QualityCheckItemResponse,
  QualityCheckResponse,
  QualityCounterOfferResponse,
} from './goods-receipts.schema.js';

/**
 * timestamptz -> ISO-8601 UTC ("2026-10-05T07:42:36.490Z"), the `format: date-time`
 * docs/openapi.yaml promises. node-postgres parses timestamptz into a Date, so the
 * columns are selected raw and serialized here (as listings.repo.ts does). Never
 * `::text` a timestamptz for the wire: Postgres's own form
 * ("2026-10-05 07:42:36.490266+00") is not RFC 3339 and Hermes parses it as NaN.
 *
 * A JS Date stops at milliseconds, so the list cursor is built in SQL
 * (`cursorReceivedAt`, to_char ... US) to keep microseconds: a truncated cursor
 * would skip receipts created within the same millisecond as the last row of a page.
 */
const CURSOR_TS = `'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'`;

export interface GoodsReceiptRow {
  id: string;
  grn_number: string;
  purchase_order_id: string;
  warehouse_id: string;
  farmer_id: string;
  status: GrnStatus;
  gross_qty_kg: string;
  accepted_qty_kg: string;
  rejected_qty_kg: string;
  rejection_reason: string | null;
  vehicle_number: string | null;
  photo_keys: string[];
  received_by: string;
  /** BR-119: users.full_name of received_by, joined onto the inserted row. */
  received_by_name?: string | null;
  received_at: Date;
  created_at: Date;
  updated_at: Date | null;
}

export interface QualityCheckRow {
  id: string;
  goods_receipt_id: string;
  warehouse_id: string;
  assigned_grade: ProduceGrade;
  listed_grade: ProduceGrade;
  outcome: QcOutcome;
  accepted_qty_kg: string;
  rejected_qty_kg: string;
  price_adjustment: string;
  defect_notes: string | null;
  photo_keys: string[];
  checked_by: string;
  checked_at: Date;
  created_at: Date;
  updated_at: Date | null;
}

export interface PurchaseOrderForReceipt {
  id: string;
  poNumber: string;
  farmerId: string;
  warehouseId: string;
  cropId: string;
  cropName: string;
  grade: ProduceGrade;
  quantityKg: string;
  pricePerKg: string;
  status: string;
}

/**
 * A quality counter-offer is a round of the negotiation on the listing behind the receipt's
 * purchase order (goods_receipts.purchase_order_id -> purchase_orders.listing_id), written to
 * counter_offers with the receipt recorded in goods_receipt_id (db/migrations/0058).
 */
export interface InsertCounterOfferData {
  listingId: string;
  goodsReceiptId: string;
  round: number;
  pricePerKg: string;
  quantityKg: string;
  message?: string | null | undefined;
  offeredByUserId: string;
  /** Computed by the SERVICE from system_config.counter_offer_window_hours (BR-10). */
  expiresAt: Date;
}

/** The listing a receipt's quality counter-offer negotiates on, locked for the transaction. */
export interface QualityNegotiationTarget {
  listingId: string;
  listingStatus: string;
  listingVersion: number;
  /** users.id of the farmer who owns the listing: the notification recipient. */
  ownerUserId: string;
  /** The price on the receipt's purchase order, the one the farmer agreed to. */
  agreedPricePerKg: string;
}

/** Where the listing's negotiation stands: the last round used and the offer still open, if any. */
export interface NegotiationState {
  maxRound: number;
  pendingOfferId: string | null;
}

/** system_config values the listing counter-offers also use (BR-10 window, BR-11 rounds). */
export interface CounterOfferConfig {
  windowHours: number;
  roundLimit: number;
}

/**
 * BR-106: what stocking a receipt needs from it and its purchase order. Read with the receipt row
 * locked, so the quality check and a farmer's acceptance of a quality counter-offer on the same
 * receipt cannot both decide to stock it.
 */
export interface StockingSource {
  goodsReceiptId: string;
  warehouseId: string;
  /** goods_receipts.farmer_id: provenance only (BR-24b), never on a customer response (BR-16). */
  farmerId: string;
  cropId: string;
  /** purchase_orders.price_per_kg, the agreed price: the batch cost as-is (owner decision 1). */
  purchasePricePerKg: string;
  grossQtyKg: string;
  /** The batch this receipt already produced, if any (at most one: migration 0070). */
  existingBatchId: string | null;
}

/** BR-106: the accepted quality counter-offer, and the inspector's values to stock its lot with. */
export interface QualityOfferStocking {
  goodsReceiptId: string;
  /** The accepted offer quantity, capped in SQL at the receipt's gross quantity. */
  quantityKg: string;
  /** null when the receipt was counter-offered without a quality check (no inspector grade). */
  qualityCheck: {
    assignedGrade: ProduceGrade;
    expiryOn: string | null;
    storageLocation: string | null;
  } | null;
}

export interface InsertInventoryBatchData {
  batchCode: string;
  warehouseId: string;
  cropId: string;
  grade: ProduceGrade;
  goodsReceiptId: string;
  sourceFarmerId: string;
  qtyReceivedKg: string;
  costPerKg: string;
  storageLocation: string | null;
  expiryOn: string | null;
}

/** BR-120: what validating a crop mismatch needs; null for an unknown receipt. */
export interface CropMismatchContext {
  purchaseOrderCropId: string;
  actualCropExists: boolean;
}

export interface InsertReceiptMovementData {
  batchId: string;
  warehouseId: string;
  qtyKg: string;
  goodsReceiptId: string;
  /** users.id of the admin who accepted the goods; null when the system stocked them. */
  createdBy: string | null;
}

/** BR-121: one damage / mismatch report. `warehouseId` is not here: the SQL takes the receipt's. */
export interface InsertDiscrepancyData {
  goodsReceiptId: string;
  type: DiscrepancyType;
  expected: string;
  actual: string;
  note: string | null;
  createdBy: string;
}

export interface GoodsReceiptsRepo {
  nextGrnNumber(tx: Executor): Promise<string>;
  insertGoodsReceipt(
    tx: Executor,
    data: CreateGoodsReceiptBody & { farmerId: string; receivedBy: string },
  ): Promise<GoodsReceiptRow>;
  findGoodsReceiptById(
    tx: Executor,
    id: string,
    scope: ResolvedScope,
  ): Promise<GoodsReceiptResponse | null>;
  /** Only a purchase order destined for a warehouse `scope` reaches; any other is `null` (BR-30). */
  findPurchaseOrderForReceipt(
    tx: Executor,
    poId: string,
    scope: ResolvedScope,
  ): Promise<PurchaseOrderForReceipt | null>;
  insertQualityCheckWithItems(
    tx: Executor,
    data: QualityCheckCreateBody & {
      goodsReceiptId: string;
      warehouseId: string;
      listedGrade: ProduceGrade;
      checkedBy: string;
    },
  ): Promise<QualityCheckResponse>;
  findQualityCheckByGoodsReceiptId(
    tx: Executor,
    goodsReceiptId: string,
  ): Promise<QualityCheckResponse | null>;
  /** BR-120: the receipt's purchase-order crop and whether `actualCropId` names a crop at all. */
  findCropMismatchContext(
    tx: Executor,
    goodsReceiptId: string,
    actualCropId: string,
  ): Promise<CropMismatchContext | null>;
  updateGoodsReceiptStatus(
    tx: Executor,
    id: string,
    status: GrnStatus,
    acceptedQtyKg: string,
    rejectedQtyKg: string,
    rejectionReason?: string | null,
  ): Promise<void>;
  findQualityNegotiationTarget(tx: Executor, goodsReceiptId: string): Promise<QualityNegotiationTarget | null>;
  findNegotiationState(tx: Executor, listingId: string): Promise<NegotiationState>;
  getCounterOfferConfig(tx: Executor): Promise<CounterOfferConfig>;
  insertQualityCounterOffer(tx: Executor, data: InsertCounterOfferData): Promise<QualityCounterOfferResponse>;
  /** ACCEPTED -> COUNTER_OFFERED under the listing's optimistic lock; the new version, or null on a lost race. */
  markListingCounterOffered(tx: Executor, listingId: string, expectedVersion: number): Promise<number | null>;
  /** Sets only the status: the QC quantities and rejection reason stay as recorded. */
  markGoodsReceiptCounterOffered(tx: Executor, goodsReceiptId: string): Promise<void>;
  recordAudit(tx: Executor, entry: AuditEntry): Promise<string>;
  /** BR-106: the receipt (row-locked) and its purchase order; null for an unknown receipt. */
  findStockingSource(tx: Executor, goodsReceiptId: string): Promise<StockingSource | null>;
  /** BR-106: the quality counter-offer `offerId`; null when the offer is a plain listing offer. */
  findQualityOfferStocking(tx: Executor, offerId: string): Promise<QualityOfferStocking | null>;
  /** `BATCH-<year>-<6 digits>` from inventory_batch_number_seq (migration 0070). */
  nextBatchCode(tx: Executor): Promise<string>;
  /** Inserts the batch with qty_available 0; the RECEIPT ledger row fills it. Returns its id. */
  insertInventoryBatch(tx: Executor, data: InsertInventoryBatchData): Promise<string>;
  /** Appends the RECEIPT row to stock_ledger; its trigger maintains the batch balance. */
  insertReceiptMovement(tx: Executor, data: InsertReceiptMovementData): Promise<string>;
  findBatchView(tx: Executor, batchId: string): Promise<BatchView>;
  listGoodsReceipts(
    tx: Executor,
    scope: ResolvedScope,
    query: ListGoodsReceiptsQuery,
  ): Promise<{ items: GoodsReceiptResponse[]; nextCursor: string | null; hasMore: boolean }>;
  /** BR-121: inserts an OPEN report in the receipt's own warehouse; the caller has scope-checked the receipt. */
  insertDiscrepancy(tx: Executor, data: InsertDiscrepancyData): Promise<GoodsReceiptDiscrepancyResponse>;
  /** BR-121: one receipt's reports, newest first, keyset-paged on (created_at, id). */
  listDiscrepancies(
    tx: Executor,
    goodsReceiptId: string,
    query: ListGoodsReceiptDiscrepanciesQuery,
  ): Promise<{ items: GoodsReceiptDiscrepancyResponse[]; nextCursor: string | null; hasMore: boolean }>;
}

/**
 * BR-121: the columns of a report as the API returns them, with the reporter's name. `d` is the
 * report row, `u` the LEFT JOINed users row.
 */
const DISCREPANCY_COLUMNS = `
  d.id,
  d.goods_receipt_id AS "goodsReceiptId",
  d.warehouse_id AS "warehouseId",
  d.type,
  d.expected,
  d.actual,
  d.status,
  d.note,
  d.created_by AS "createdBy",
  u.full_name AS "createdByName",
  d.created_at AS "createdAt"`;

type DiscrepancyRow = Omit<GoodsReceiptDiscrepancyResponse, 'createdAt'> & { createdAt: Date };

function toDiscrepancyResponse(row: DiscrepancyRow): GoodsReceiptDiscrepancyResponse {
  return { ...row, createdByName: row.createdByName ?? null, createdAt: row.createdAt.toISOString() };
}

export const goodsReceiptsRepo: GoodsReceiptsRepo = {
  async nextGrnNumber(tx: Executor): Promise<string> {
    const year = new Date().getFullYear();
    const result = await tx.query<{ seq: string }>(
      `SELECT nextval('goods_receipt_number_seq')::text AS seq`,
    );
    const num = (result.rows[0]?.seq ?? '1').padStart(6, '0');
    return `GRN-${year}-${num}`;
  },

  async insertGoodsReceipt(
    tx: Executor,
    data: CreateGoodsReceiptBody & { farmerId: string; receivedBy: string },
  ): Promise<GoodsReceiptRow> {
    const grnNumber = await this.nextGrnNumber(tx);
    // BR-119: the receiver's name is joined onto the inserted row in the same statement.
    const sql = `
      WITH ins AS (
      INSERT INTO goods_receipts (
        grn_number,
        purchase_order_id,
        warehouse_id,
        farmer_id,
        gross_qty_kg,
        vehicle_number,
        photo_keys,
        received_by,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'AWAITING_QC')
      RETURNING
        id,
        grn_number,
        purchase_order_id,
        warehouse_id,
        farmer_id,
        status,
        gross_qty_kg::text,
        accepted_qty_kg::text,
        rejected_qty_kg::text,
        rejection_reason,
        vehicle_number,
        photo_keys,
        received_by,
        received_at,
        created_at,
        updated_at
      )
      SELECT ins.*, u.full_name AS received_by_name
        FROM ins
        LEFT JOIN users u ON u.id = ins.received_by
    `;

    const values = [
      grnNumber,
      data.purchaseOrderId,
      data.warehouseId,
      data.farmerId,
      data.grossQtyKg,
      data.vehicleNumber ?? null,
      data.photos,
      data.receivedBy,
    ];

    const result = await tx.query<GoodsReceiptRow>(sql, values);
    return result.rows[0]!;
  },

  async findPurchaseOrderForReceipt(
    tx: Executor,
    poId: string,
    scope: ResolvedScope,
  ): Promise<PurchaseOrderForReceipt | null> {
    const scopeFilter = scopedWhere(scope, {
      warehouseColumn: 'po.warehouse_id',
      startIndex: 2,
    });
    const sql = `
      SELECT
        po.id,
        po.po_number AS "poNumber",
        po.farmer_id AS "farmerId",
        po.warehouse_id AS "warehouseId",
        po.crop_id AS "cropId",
        c.name AS "cropName",
        po.grade,
        po.quantity_kg::text AS "quantityKg",
        po.price_per_kg::text AS "pricePerKg",
        po.status
      FROM purchase_orders po
      JOIN crop_master c ON c.id = po.crop_id
      WHERE po.id = $1 AND ${scopeFilter.sql}
    `;
    const result = await tx.query<PurchaseOrderForReceipt>(sql, [poId, ...scopeFilter.params]);
    return result.rows[0] ?? null;
  },

  async findGoodsReceiptById(
    tx: Executor,
    id: string,
    scope: ResolvedScope,
  ): Promise<GoodsReceiptResponse | null> {
    const scopeFilter = scopedWhere(scope, {
      warehouseColumn: 'gr.warehouse_id',
      startIndex: 2,
    });

    const sql = `
      SELECT
        gr.id,
        gr.grn_number AS "grnNumber",
        gr.purchase_order_id AS "purchaseOrderId",
        gr.warehouse_id AS "warehouseId",
        gr.farmer_id AS "farmerId",
        gr.gross_qty_kg::text AS "grossQtyKg",
        gr.accepted_qty_kg::text AS "acceptedQtyKg",
        gr.rejected_qty_kg::text AS "rejectedQtyKg",
        gr.rejection_reason AS "rejectionReason",
        gr.vehicle_number AS "vehicleNumber",
        COALESCE(gr.photo_keys, '{}') AS "photos",
        gr.status,
        gr.received_by AS "receivedBy",
        ru.full_name AS "receivedByName",
        gr.received_at AS "receivedAt",
        po.po_number AS "poNumber",
        c.name AS "cropName",
        po.grade,
        ib.id AS "batchId",
        ib.batch_code AS "batchCode"
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      JOIN crop_master c ON c.id = po.crop_id
      -- BR-106: at most one batch per receipt (uq_inventory_batches_goods_receipt_id), so no fan-out.
      LEFT JOIN inventory_batches ib ON ib.goods_receipt_id = gr.id
      -- BR-119: the receiver's display name (admin surface); a missing user is a null name.
      LEFT JOIN users ru ON ru.id = gr.received_by
      WHERE gr.id = $1 AND ${scopeFilter.sql}
    `;

    const result = await tx.query<Omit<GoodsReceiptResponse, 'receivedAt'> & { receivedAt: Date }>(
      sql,
      [id, ...scopeFilter.params],
    );
    const row = result.rows[0];
    return row
      ? { ...row, receivedByName: row.receivedByName ?? null, receivedAt: row.receivedAt.toISOString() }
      : null;
  },

  async insertQualityCheckWithItems(
    tx: Executor,
    data: QualityCheckCreateBody & {
      goodsReceiptId: string;
      warehouseId: string;
      listedGrade: ProduceGrade;
      checkedBy: string;
    },
  ): Promise<QualityCheckResponse> {
    // BR-120: the breakdown, reason code and crop mismatch are stored on the check; the mismatched
    // crop's name is joined onto the inserted row in the same statement.
    const qcSql = `
      WITH ins AS (
      INSERT INTO quality_checks (
        goods_receipt_id,
        warehouse_id,
        assigned_grade,
        listed_grade,
        outcome,
        accepted_qty_kg,
        rejected_qty_kg,
        price_adjustment,
        defect_notes,
        photo_keys,
        checked_by,
        expiry_on,
        storage_location,
        damaged_qty_kg,
        spoiled_qty_kg,
        rejection_reason_code,
        actual_crop_id,
        crop_mismatch_qty_kg
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::date, $13,
              $14::numeric, $15::numeric, $16, $17, $18::numeric)
      RETURNING
        id,
        goods_receipt_id AS "goodsReceiptId",
        warehouse_id AS "warehouseId",
        assigned_grade AS "assignedGrade",
        listed_grade AS "listedGrade",
        outcome,
        accepted_qty_kg::text AS "acceptedQtyKg",
        rejected_qty_kg::text AS "rejectedQtyKg",
        price_adjustment::text AS "priceAdjustment",
        defect_notes AS "defectNotes",
        COALESCE(photo_keys, '{}') AS "photos",
        checked_by AS "checkedBy",
        checked_at AS "checkedAt",
        damaged_qty_kg::text AS "damagedQtyKg",
        spoiled_qty_kg::text AS "spoiledQtyKg",
        rejection_reason_code AS "rejectionReasonCode",
        actual_crop_id AS "actualCropId",
        crop_mismatch_qty_kg::text AS "cropMismatchQtyKg"
      )
      SELECT ins.*, ac.name AS "actualCropName"
        FROM ins
        LEFT JOIN crop_master ac ON ac.id = ins."actualCropId"
    `;

    const qcValues = [
      data.goodsReceiptId,
      data.warehouseId,
      data.assignedGrade,
      data.listedGrade,
      data.outcome,
      data.acceptedQtyKg,
      data.rejectedQtyKg ?? '0.000',
      data.priceAdjustment ?? '0.00',
      data.defectNotes ?? null,
      data.photos,
      data.checkedBy,
      // Stored so a batch deferred by a quality counter-offer is stocked with them later (BR-106).
      data.expiryOn ?? null,
      data.storageLocation ?? null,
      data.damagedQtyKg ?? '0.000',
      data.spoiledQtyKg ?? '0.000',
      data.rejectionReasonCode ?? null,
      data.actualCropId ?? null,
      data.cropMismatchQtyKg ?? null,
    ];

    const qcResult = await tx.query<Omit<QualityCheckResponse, 'checkedAt' | 'items'> & { checkedAt: Date }>(
      qcSql,
      qcValues,
    );
    const qcRaw = qcResult.rows[0]!;
    const qcRow = { ...qcRaw, checkedAt: qcRaw.checkedAt.toISOString() };

    const itemResponses: QualityCheckItemResponse[] = [];
    for (const item of data.items) {
      const itemSql = `
        INSERT INTO quality_check_items (
          quality_check_id,
          parameter,
          score,
          passed,
          measured_value,
          remarks,
          photo_keys,
          condition
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          quality_check_id AS "qualityCheckId",
          parameter,
          score,
          passed,
          measured_value AS "measuredValue",
          remarks,
          COALESCE(photo_keys, '{}') AS "photoKeys",
          condition
      `;

      const itemValues = [
        qcRow.id,
        item.parameter,
        item.score ?? null,
        item.passed,
        item.measuredValue ?? null,
        item.remarks ?? null,
        item.photoKeys,
        item.condition ?? null,
      ];

      const itemRes = await tx.query<QualityCheckItemResponse>(itemSql, itemValues);
      itemResponses.push(itemRes.rows[0]!);
    }

    return {
      ...qcRow,
      items: itemResponses,
    };
  },

  async findQualityCheckByGoodsReceiptId(
    tx: Executor,
    goodsReceiptId: string,
  ): Promise<QualityCheckResponse | null> {
    const sql = `
      SELECT
        qc.id,
        qc.goods_receipt_id AS "goodsReceiptId",
        qc.warehouse_id AS "warehouseId",
        qc.assigned_grade AS "assignedGrade",
        qc.listed_grade AS "listedGrade",
        qc.outcome,
        qc.accepted_qty_kg::text AS "acceptedQtyKg",
        qc.rejected_qty_kg::text AS "rejectedQtyKg",
        qc.price_adjustment::text AS "priceAdjustment",
        qc.defect_notes AS "defectNotes",
        COALESCE(qc.photo_keys, '{}') AS "photos",
        qc.checked_by AS "checkedBy",
        cu.full_name AS "checkedByName",
        qc.checked_at AS "checkedAt",
        qc.damaged_qty_kg::text AS "damagedQtyKg",
        qc.spoiled_qty_kg::text AS "spoiledQtyKg",
        qc.rejection_reason_code AS "rejectionReasonCode",
        qc.actual_crop_id AS "actualCropId",
        ac.name AS "actualCropName",
        qc.crop_mismatch_qty_kg::text AS "cropMismatchQtyKg"
      FROM quality_checks qc
      -- BR-119: the inspector's display name (admin surface); a missing user is a null name.
      LEFT JOIN users cu ON cu.id = qc.checked_by
      -- BR-120: the crop actually delivered, when it differed from the purchase order's.
      LEFT JOIN crop_master ac ON ac.id = qc.actual_crop_id
      WHERE qc.goods_receipt_id = $1
      -- A receipt is checked once (recordQualityCheck needs AWAITING_QC); the latest wins if not.
      ORDER BY qc.checked_at DESC, qc.created_at DESC
      LIMIT 1
    `;
    const result = await tx.query<Omit<QualityCheckResponse, 'checkedAt' | 'items'> & { checkedAt: Date }>(
      sql,
      [goodsReceiptId],
    );
    const qcRaw = result.rows[0];
    if (!qcRaw) return null;
    const qc = { ...qcRaw, checkedByName: qcRaw.checkedByName ?? null, checkedAt: qcRaw.checkedAt.toISOString() };

    const itemsSql = `
      SELECT
        id,
        quality_check_id AS "qualityCheckId",
        parameter,
        score,
        passed,
        measured_value AS "measuredValue",
        remarks,
        COALESCE(photo_keys, '{}') AS "photoKeys",
        condition
      FROM quality_check_items
      WHERE quality_check_id = $1
      ORDER BY created_at, id
    `;
    const itemsRes = await tx.query<QualityCheckItemResponse>(itemsSql, [qc.id]);
    return {
      ...qc,
      items: itemsRes.rows,
    };
  },

  async findCropMismatchContext(
    tx: Executor,
    goodsReceiptId: string,
    actualCropId: string,
  ): Promise<CropMismatchContext | null> {
    const result = await tx.query<CropMismatchContext>(
      `SELECT po.crop_id AS "purchaseOrderCropId",
              EXISTS (SELECT 1 FROM crop_master c WHERE c.id = $2) AS "actualCropExists"
         FROM goods_receipts gr
         JOIN purchase_orders po ON po.id = gr.purchase_order_id
        WHERE gr.id = $1`,
      [goodsReceiptId, actualCropId],
    );
    return result.rows[0] ?? null;
  },

  async updateGoodsReceiptStatus(
    tx: Executor,
    id: string,
    status: GrnStatus,
    acceptedQtyKg: string,
    rejectedQtyKg: string,
    rejectionReason?: string | null,
  ): Promise<void> {
    const sql = `
      UPDATE goods_receipts
      SET
        status = $2,
        accepted_qty_kg = $3,
        rejected_qty_kg = $4,
        rejection_reason = $5,
        updated_at = now()
      WHERE id = $1
    `;
    await tx.query(sql, [
      id,
      status,
      acceptedQtyKg,
      rejectedQtyKg,
      rejectionReason ?? null,
    ]);
  },

  /**
   * receipt -> purchase order -> listing. `FOR UPDATE OF l` holds the listing row for the rest of
   * the transaction, so two quality counter-offers on the same lot (or one racing a farmer's
   * response) queue up here and the second one sees the first one's PENDING offer, instead of
   * both computing the same round. UNIQUE(listing_id, round) remains the backstop.
   */
  async findQualityNegotiationTarget(
    tx: Executor,
    goodsReceiptId: string,
  ): Promise<QualityNegotiationTarget | null> {
    const result = await tx.query<QualityNegotiationTarget>(
      `SELECT l.id AS "listingId",
              l.status AS "listingStatus",
              l.version AS "listingVersion",
              f.user_id AS "ownerUserId",
              po.price_per_kg::text AS "agreedPricePerKg"
         FROM goods_receipts gr
         JOIN purchase_orders po ON po.id = gr.purchase_order_id
         JOIN produce_listings l ON l.id = po.listing_id AND l.deleted_at IS NULL
         JOIN farmers f ON f.id = l.farmer_id
        WHERE gr.id = $1
          FOR UPDATE OF l`,
      [goodsReceiptId],
    );
    return result.rows[0] ?? null;
  },

  /** The listing counter-offer helpers, so both surfaces count rounds the same way (BR-11). */
  async findNegotiationState(tx: Executor, listingId: string): Promise<NegotiationState> {
    const maxRound = await counterOffersRepo.getMaxRound(tx, listingId);
    const pending = await counterOffersRepo.findLatestPendingOffer(tx, listingId);
    return { maxRound, pendingOfferId: pending?.id ?? null };
  },

  /** The SAME system_config readers the listing counter-offers use (BR-10, BR-11); NaN when unset. */
  async getCounterOfferConfig(tx: Executor): Promise<CounterOfferConfig> {
    const windowHours = await counterOffersRepo.getCounterOfferWindowHours(tx);
    const roundLimit = await counterOffersRepo.getCounterOfferRoundLimit(tx);
    return { windowHours, roundLimit };
  },

  /**
   * counter_offers has no offered_by / offered_by_user_id columns: the actor is `actor` and
   * `actor_user_id`, aliased here to the `offeredBy` / `offeredByUserId` names of the documented
   * CounterOffer response.
   */
  async insertQualityCounterOffer(
    tx: Executor,
    data: InsertCounterOfferData,
  ): Promise<QualityCounterOfferResponse> {
    const result = await tx.query<
      Omit<QualityCounterOfferResponse, 'expiresAt' | 'respondedAt'> & { expiresAt: Date; respondedAt: Date | null }
    >(
      `INSERT INTO counter_offers
         (listing_id, goods_receipt_id, round, actor, actor_user_id, price_per_kg, quantity_kg, message, status, expires_at)
       VALUES ($1, $2, $3, 'ADMIN', $4, $5, $6, $7, 'PENDING', $8)
       RETURNING
         id,
         listing_id AS "listingId",
         goods_receipt_id AS "goodsReceiptId",
         round,
         actor AS "offeredBy",
         actor_user_id AS "offeredByUserId",
         price_per_kg::text AS "pricePerKg",
         quantity_kg::text AS "quantityKg",
         message,
         status,
         expires_at AS "expiresAt",
         responded_at AS "respondedAt"`,
      [
        data.listingId,
        data.goodsReceiptId,
        data.round,
        data.offeredByUserId,
        data.pricePerKg,
        data.quantityKg,
        data.message ?? null,
        data.expiresAt,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('counter_offers insert returned no row');
    return {
      ...row,
      expiresAt: row.expiresAt.toISOString(),
      respondedAt: row.respondedAt === null ? null : row.respondedAt.toISOString(),
    };
  },

  async markListingCounterOffered(
    tx: Executor,
    listingId: string,
    expectedVersion: number,
  ): Promise<number | null> {
    const updated = await counterOffersRepo.transitionListingStatus(
      tx,
      listingId,
      'COUNTER_OFFERED',
      ['ACCEPTED'],
      expectedVersion,
    );
    return updated === null ? null : updated.version;
  },

  async markGoodsReceiptCounterOffered(tx: Executor, goodsReceiptId: string): Promise<void> {
    await tx.query(
      `UPDATE goods_receipts SET status = 'COUNTER_OFFERED', updated_at = now() WHERE id = $1`,
      [goodsReceiptId],
    );
  },

  async recordAudit(tx: Executor, entry: AuditEntry): Promise<string> {
    return writeAuditLog(tx, entry);
  },

  /**
   * `FOR UPDATE OF gr` holds the receipt for the rest of the transaction: a quality check and a
   * farmer accepting a quality counter-offer on the same receipt queue here, and the second one
   * sees the first one's batch in `existingBatchId`. uq_inventory_batches_goods_receipt_id
   * (migration 0070) remains the backstop.
   */
  async findStockingSource(tx: Executor, goodsReceiptId: string): Promise<StockingSource | null> {
    const result = await tx.query<StockingSource>(
      `SELECT gr.id AS "goodsReceiptId",
              gr.warehouse_id AS "warehouseId",
              gr.farmer_id AS "farmerId",
              po.crop_id AS "cropId",
              po.price_per_kg::text AS "purchasePricePerKg",
              gr.gross_qty_kg::text AS "grossQtyKg",
              (SELECT ib.id FROM inventory_batches ib WHERE ib.goods_receipt_id = gr.id) AS "existingBatchId"
         FROM goods_receipts gr
         JOIN purchase_orders po ON po.id = gr.purchase_order_id
        WHERE gr.id = $1
          FOR UPDATE OF gr`,
      [goodsReceiptId],
    );
    return result.rows[0] ?? null;
  },

  /**
   * The quantity is capped at the receipt's gross quantity IN SQL (numeric, never a JS float): an
   * offer is not validated against what arrived, and stock can never exceed what physically came
   * in (BR-106, UNCONFIRMED default). The latest quality check of the receipt supplies the grade,
   * expiry and storage location.
   */
  async findQualityOfferStocking(tx: Executor, offerId: string): Promise<QualityOfferStocking | null> {
    const result = await tx.query<{
      goodsReceiptId: string;
      quantityKg: string;
      assignedGrade: ProduceGrade | null;
      expiryOn: string | null;
      storageLocation: string | null;
    }>(
      `SELECT co.goods_receipt_id AS "goodsReceiptId",
              LEAST(co.quantity_kg, gr.gross_qty_kg)::text AS "quantityKg",
              qc.assigned_grade AS "assignedGrade",
              to_char(qc.expiry_on, 'YYYY-MM-DD') AS "expiryOn",
              qc.storage_location AS "storageLocation"
         FROM counter_offers co
         JOIN goods_receipts gr ON gr.id = co.goods_receipt_id
         LEFT JOIN LATERAL (
              SELECT q.assigned_grade, q.expiry_on, q.storage_location
                FROM quality_checks q
               WHERE q.goods_receipt_id = gr.id
               ORDER BY q.checked_at DESC, q.created_at DESC
               LIMIT 1
         ) qc ON true
        WHERE co.id = $1
          AND co.goods_receipt_id IS NOT NULL`,
      [offerId],
    );
    const row = result.rows[0];
    if (row === undefined) return null;
    return {
      goodsReceiptId: row.goodsReceiptId,
      quantityKg: row.quantityKg,
      qualityCheck:
        row.assignedGrade === null
          ? null
          : { assignedGrade: row.assignedGrade, expiryOn: row.expiryOn, storageLocation: row.storageLocation },
    };
  },

  async nextBatchCode(tx: Executor): Promise<string> {
    const year = new Date().getFullYear();
    const result = await tx.query<{ seq: string }>(
      `SELECT nextval('inventory_batch_number_seq')::text AS seq`,
    );
    const num = (result.rows[0]?.seq ?? '1').padStart(6, '0');
    return `BATCH-${year}-${num}`;
  },

  async insertInventoryBatch(tx: Executor, data: InsertInventoryBatchData): Promise<string> {
    // qty_available stays at its default 0: the RECEIPT ledger row fills it (CLAUDE.md 2.3).
    const result = await tx.query<{ id: string }>(
      `INSERT INTO inventory_batches (
         batch_code, warehouse_id, crop_id, grade, goods_receipt_id, source_farmer_id,
         qty_received, cost_per_kg, storage_location, received_on, expiry_on, status
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7::numeric, $8::numeric, $9, (now() AT TIME ZONE 'Asia/Kolkata')::date, $10::date, 'ACTIVE'
       )
       RETURNING id`,
      [
        data.batchCode,
        data.warehouseId,
        data.cropId,
        data.grade,
        data.goodsReceiptId,
        data.sourceFarmerId,
        data.qtyReceivedKg,
        data.costPerKg,
        data.storageLocation,
        data.expiryOn,
      ],
    );
    return result.rows[0]!.id;
  },

  async insertReceiptMovement(tx: Executor, data: InsertReceiptMovementData): Promise<string> {
    // balance_after is computed by trg_stock_ledger_balance under a row lock on the batch; the 0
    // here is overwritten before the row is stored.
    const result = await tx.query<{ id: string }>(
      `INSERT INTO stock_ledger (
         batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, ref_id, remarks, created_by
       ) VALUES ($1, $2, 'RECEIPT', $3::numeric, 0, 'GOODS_RECEIPT', $4, 'Goods receipt accepted', $5)
       RETURNING id`,
      [data.batchId, data.warehouseId, data.qtyKg, data.goodsReceiptId, data.createdBy],
    );
    return result.rows[0]!.id;
  },

  async findBatchView(tx: Executor, batchId: string): Promise<BatchView> {
    const result = await tx.query<BatchRow>(
      `SELECT b.id, b.batch_code, b.warehouse_id, b.crop_id, c.name AS crop_name, b.grade,
              b.goods_receipt_id, b.source_farmer_id, b.qty_received::text, b.qty_available::text,
              b.cost_per_kg::text, b.storage_location, to_char(b.received_on, 'YYYY-MM-DD') AS received_on,
              to_char(b.expiry_on, 'YYYY-MM-DD') AS expiry_on, b.status, b.created_at, b.updated_at
         FROM inventory_batches b
         JOIN crop_master c ON c.id = b.crop_id
        WHERE b.id = $1`,
      [batchId],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error(`inventory batch ${batchId} vanished inside its own transaction`);
    return toBatchView(row);
  },

  async listGoodsReceipts(
    tx: Executor,
    scope: ResolvedScope,
    query: ListGoodsReceiptsQuery,
  ): Promise<{ items: GoodsReceiptResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let index = 1;

    if (query.status) {
      conditions.push(`gr.status = $${index}`);
      params.push(query.status);
      index += 1;
    }

    if (query.warehouseId) {
      conditions.push(`gr.warehouse_id = $${index}`);
      params.push(query.warehouseId);
      index += 1;
    }

    if (query.purchaseOrderId) {
      conditions.push(`gr.purchase_order_id = $${index}`);
      params.push(query.purchaseOrderId);
      index += 1;
    }

    if (query.cursor) {
      conditions.push(`gr.received_at < $${index}::timestamptz`);
      params.push(query.cursor);
      index += 1;
    }

    const scopeFilter = scopedWhere(scope, {
      warehouseColumn: 'gr.warehouse_id',
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
        gr.id,
        gr.grn_number AS "grnNumber",
        gr.purchase_order_id AS "purchaseOrderId",
        gr.warehouse_id AS "warehouseId",
        gr.farmer_id AS "farmerId",
        gr.gross_qty_kg::text AS "grossQtyKg",
        gr.accepted_qty_kg::text AS "acceptedQtyKg",
        gr.rejected_qty_kg::text AS "rejectedQtyKg",
        gr.rejection_reason AS "rejectionReason",
        gr.vehicle_number AS "vehicleNumber",
        COALESCE(gr.photo_keys, '{}') AS "photos",
        gr.status,
        gr.received_by AS "receivedBy",
        ru.full_name AS "receivedByName",
        gr.received_at AS "receivedAt",
        to_char(gr.received_at AT TIME ZONE 'UTC', ${CURSOR_TS}) AS "cursorReceivedAt",
        po.po_number AS "poNumber",
        c.name AS "cropName",
        po.grade,
        ib.id AS "batchId",
        ib.batch_code AS "batchCode"
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      JOIN crop_master c ON c.id = po.crop_id
      LEFT JOIN inventory_batches ib ON ib.goods_receipt_id = gr.id
      -- BR-119: joined in the page query, never looked up per row.
      LEFT JOIN users ru ON ru.id = gr.received_by
      ${whereClause}
      ORDER BY gr.received_at DESC
      ${limitClause}
    `;

    const result = await tx.query<
      Omit<GoodsReceiptResponse, 'receivedAt'> & { receivedAt: Date; cursorReceivedAt: string }
    >(sql, params);
    const hasMore = result.rows.length > limit;
    const rawItems = hasMore ? result.rows.slice(0, limit) : result.rows;
    const nextCursor =
      hasMore && rawItems.length > 0 ? rawItems[rawItems.length - 1]!.cursorReceivedAt : null;
    const items: GoodsReceiptResponse[] = rawItems.map(({ cursorReceivedAt: _cursor, ...row }) => ({
      ...row,
      receivedByName: row.receivedByName ?? null,
      receivedAt: row.receivedAt.toISOString(),
    }));

    return { items, nextCursor, hasMore };
  },

  async insertDiscrepancy(tx: Executor, data: InsertDiscrepancyData): Promise<GoodsReceiptDiscrepancyResponse> {
    // The warehouse is the receipt's, read in this statement, never taken from the request; the
    // composite foreign key (migration 0077) refuses any other. status takes its default, OPEN.
    const result = await tx.query<DiscrepancyRow>(
      `WITH ins AS (
         INSERT INTO goods_receipt_discrepancies (goods_receipt_id, warehouse_id, type, expected, actual, note, created_by)
         SELECT gr.id, gr.warehouse_id, $2, $3, $4, $5, $6
           FROM goods_receipts gr
          WHERE gr.id = $1
         RETURNING *
       )
       SELECT ${DISCREPANCY_COLUMNS}
         FROM ins d
         LEFT JOIN users u ON u.id = d.created_by`,
      [data.goodsReceiptId, data.type, data.expected, data.actual, data.note, data.createdBy],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error(`goods receipt ${data.goodsReceiptId} vanished inside its own transaction`);
    return toDiscrepancyResponse(row);
  },

  async listDiscrepancies(
    tx: Executor,
    goodsReceiptId: string,
    query: ListGoodsReceiptDiscrepanciesQuery,
  ): Promise<{ items: GoodsReceiptDiscrepancyResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const params: unknown[] = [goodsReceiptId];
    const conditions = ['d.goods_receipt_id = $1'];
    if (query.cursor !== undefined && query.cursor.length > 0) {
      // Keyset on (created_at, id), matching the ORDER BY, so tied timestamps are neither skipped
      // nor repeated (http/keysetCursor.ts).
      const after = requireKeysetCursor(CURSOR_TAGS.goodsReceiptDiscrepancies, query.cursor);
      params.push(after.ts, after.id);
      conditions.push(`(d.created_at, d.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    params.push(query.limit + 1);
    const result = await tx.query<DiscrepancyRow & { cursorTs: string }>(
      `SELECT ${DISCREPANCY_COLUMNS}, ${MICRO_TS_SQL('d.created_at')} AS "cursorTs"
         FROM goods_receipt_discrepancies d
         LEFT JOIN users u ON u.id = d.created_by
        WHERE ${conditions.join(' AND ')}
        ORDER BY d.created_at DESC, d.id DESC
        LIMIT $${params.length}`,
      params,
    );
    const hasMore = result.rows.length > query.limit;
    const rows = hasMore ? result.rows.slice(0, query.limit) : result.rows;
    const last = rows[rows.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeKeysetCursor(CURSOR_TAGS.goodsReceiptDiscrepancies, { ts: last.cursorTs, id: last.id })
        : null;
    return { items: rows.map(({ cursorTs: _cursorTs, ...row }) => toDiscrepancyResponse(row)), nextCursor, hasMore };
  },
};
