/**
 * BR-102: SQL for inter-warehouse transfers. Every function takes an `Executor` so the service can
 * run each state change as ONE transaction; no authorization decision lives here.
 *
 * Stock moves ONLY through `stock_ledger` (CLAUDE.md 2.3): `balance_after` is inserted as 0 and
 * computed by trg_stock_ledger_balance under a row lock, `qty_available` is maintained by
 * trg_stock_ledger_apply. Nothing here writes a balance column. A destination batch is inserted
 * with `qty_available` at its default 0 and filled by its TRANSFER_IN ledger row.
 *
 * Money is computed in SQL `numeric` and returned as integer paise (bigint as text), never a float.
 * `inventory_batches.source_farmer_id` is read only to copy it onto a destination batch inside SQL;
 * it never leaves this file (BR-16).
 */
import { fromPaise, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { shelfFreeSql } from '../../db/shelfAvailability.js';
import { logger } from '../../logger.js';
import { findPlaceableLocation, type PlaceableLocation } from '../warehouse-ops/storage-locations.repo.js';
import type {
  ListTransfersQuery,
  ReceiveCondition,
  Transfer,
  TransferLine,
  TransferStatus,
  TransferSummary,
} from './warehouse-transfers.schema.js';

/** BR-102 rule 3: Rs 50,000 (UNCONFIRMED). Used only when system_config has no usable row. */
export const FALLBACK_HIGH_VALUE_THRESHOLD_PAISE = 5_000_000;

export interface BatchCheck {
  batchId: string;
  batchCode: string;
  warehouseId: string;
  status: string;
  /** numeric(12,2) as text, or null when the batch has no cost. */
  costPerKg: string | null;
  /** round(qty x cost x 100) in integer paise, or null when the batch has no cost. */
  lineValuePaise: number | null;
  /** qty <= the batch's free shelf (BR-100 `shelfFreeSql`), compared in SQL numeric. */
  fits: boolean;
}

export interface NewTransfer {
  fromWarehouseId: string;
  toWarehouseId: string;
  initiatedBy: string;
  totalValuePaise: number;
  hasUnvaluedLines: boolean;
  requiresApproval: boolean;
  vehicleNumber: string | null;
  notes: string | null;
}

export interface NewTransferItem {
  batchId: string;
  qtyKg: string;
  costPerKg: string | null;
  lineValuePaise: number | null;
}

/** BR-126: what the destination recorded for one received line (all but the quantity optional). */
export interface ReceivedLine {
  qtyKg: string;
  destBatchId: string | null;
  inLedgerId: string | null;
  damagedQtyKg?: string;
  spoiledQtyKg?: string;
  condition?: ReceiveCondition | null;
  actualGrade?: string | null;
  actualCropId?: string | null;
  storageLocationId?: string | null;
  storageLocation?: string | null;
}

export interface LedgerInsert {
  batchId: string;
  warehouseId: string;
  movementType: 'TRANSFER_OUT' | 'TRANSFER_IN';
  /** Signed decimal string: negative for TRANSFER_OUT. */
  qtyDeltaKg: string;
  transferId: string;
  transferNumber: string;
  actorId: string;
}

export interface WarehouseTransfersRepo {
  /** The non-deleted warehouses among `ids`, with their active flag. */
  findWarehouses(db: Executor, ids: string[]): Promise<Array<{ id: string; isActive: boolean }>>;
  /** `system_config.transfer_high_value_threshold_paise`, or the documented fallback (logged). */
  highValueThresholdPaise(db: Executor): Promise<number>;
  /**
   * Row-locks the named batches (FOR UPDATE, in id order so two transfers never deadlock), then
   * values each line and checks it against the free shelf. Unknown batches are simply absent.
   */
  lockAndCheckBatches(db: Executor, lines: Array<{ batchId: string; qtyKg: string }>): Promise<BatchCheck[]>;
  /** Inserts the header as PENDING_APPROVAL with the next TRF number. */
  insertTransfer(db: Executor, input: NewTransfer): Promise<{ id: string; transferNumber: string }>;
  insertItems(db: Executor, transferId: string, items: NewTransferItem[]): Promise<void>;
  /** The transfer with its lines, header row-locked FOR UPDATE. */
  lockTransfer(db: Executor, id: string): Promise<Transfer | null>;
  findTransfer(db: Executor, id: string): Promise<Transfer | null>;
  /** `visibleWarehouses` null = unfiltered; otherwise either side must be in the list. */
  list(db: Executor, query: ListTransfersQuery, visibleWarehouses: string[] | null): Promise<{ items: TransferSummary[]; total: number }>;
  /** Inserts one ledger row and returns its id. Throws the raw pg error (23514) on a stock guard. */
  insertLedger(db: Executor, row: LedgerInsert): Promise<string>;
  setOutLedger(db: Executor, itemId: string, ledgerId: string): Promise<void>;
  /** IN_TRANSIT + dispatched_at; also approved_by/approved_at when an approver is given. */
  markDispatched(db: Executor, id: string, approvedBy: string | null): Promise<void>;
  /**
   * A new ACTIVE batch in `warehouseId` copied from the source batch (crop, grade, farmer, cost,
   * expiry), placed in the given location (BR-126); returns its id.
   */
  insertDestBatch(
    db: Executor,
    input: {
      sourceBatchId: string;
      warehouseId: string;
      qtyKg: string;
      transferNumber: string;
      storageLocationId?: string | null;
      storageLocation?: string | null;
    },
  ): Promise<string>;
  markItemReceived(db: Executor, itemId: string, input: ReceivedLine): Promise<void>;
  /** RECEIVED, with the next TGR receipt number (BR-126) drawn in the same statement. */
  markReceived(db: Executor, id: string, input: { receivedBy: string; hasDiscrepancy: boolean; receiptNote: string | null }): Promise<void>;
  /** BR-126: the ids among `ids` that are live crop_master rows. */
  findLiveCropIds(db: Executor, ids: string[]): Promise<string[]>;
  /** BR-125/BR-126: a live location of the warehouse, share-locked; null when there is none. */
  findPlaceableLocation(db: Executor, warehouseId: string, id: string): Promise<PlaceableLocation | null>;
  markCancelled(db: Executor, id: string, input: { cancelledBy: string; reason: string }): Promise<void>;
}

interface HeaderRow {
  id: string;
  transfer_number: string;
  receipt_number: string | null;
  initiated_by_name: string | null;
  from_warehouse_id: string;
  to_warehouse_id: string;
  status: TransferStatus;
  total_value_paise: string;
  has_unvalued_lines: boolean;
  requires_approval: boolean;
  has_discrepancy: boolean;
  vehicle_number: string | null;
  notes: string | null;
  receipt_note: string | null;
  cancel_reason: string | null;
  initiated_by: string;
  approved_by: string | null;
  approved_at: Date | null;
  dispatched_at: Date | null;
  received_by: string | null;
  received_at: Date | null;
  cancelled_by: string | null;
  cancelled_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
}

interface LineRow {
  id: string;
  batch_id: string;
  batch_code: string;
  crop_id: string;
  grade: string;
  qty_sent: string;
  qty_received: string | null;
  variance_qty: string | null;
  cost_per_kg: string | null;
  line_value_paise: string | null;
  dest_batch_id: string | null;
  damaged_qty: string | null;
  spoiled_qty: string | null;
  condition: ReceiveCondition | null;
  actual_grade: TransferLine['actualGrade'];
  actual_crop_id: string | null;
  actual_crop_name: string | null;
  storage_location_id: string | null;
  storage_location: string | null;
}

/** Always selected FROM `HEADER_FROM` (the initiator's name is joined, never looked up per row). */
const HEADER_COLUMNS = `
  t.id, t.transfer_number, t.receipt_number, iu.full_name AS initiated_by_name,
  t.from_warehouse_id, t.to_warehouse_id, t.status,
  t.total_value_paise::text AS total_value_paise, t.has_unvalued_lines, t.requires_approval, t.has_discrepancy,
  t.vehicle_number, t.notes, t.receipt_note, t.cancel_reason,
  t.initiated_by, t.approved_by, t.approved_at, t.dispatched_at, t.received_by, t.received_at,
  t.cancelled_by, t.cancelled_at, t.created_at, t.updated_at
`;

const HEADER_FROM = `stock_transfers t LEFT JOIN users iu ON iu.id = t.initiated_by`;

const iso = (value: Date | null): string | null => (value === null ? null : value.toISOString());
const money = (paise: string | null): Money | null => (paise === null ? null : fromPaise(Number(paise)));

function toSummary(row: HeaderRow): TransferSummary {
  return {
    id: row.id,
    transferNumber: row.transfer_number,
    receiptNumber: row.receipt_number,
    fromWarehouseId: row.from_warehouse_id,
    toWarehouseId: row.to_warehouse_id,
    status: row.status,
    totalValue: fromPaise(Number(row.total_value_paise)),
    hasUnvaluedLines: row.has_unvalued_lines,
    requiresApproval: row.requires_approval,
    hasDiscrepancy: row.has_discrepancy,
    vehicleNumber: row.vehicle_number,
    notes: row.notes,
    receiptNote: row.receipt_note,
    cancelReason: row.cancel_reason,
    initiatedBy: row.initiated_by,
    initiatedByName: row.initiated_by_name,
    approvedBy: row.approved_by,
    approvedAt: iso(row.approved_at),
    dispatchedAt: iso(row.dispatched_at),
    receivedBy: row.received_by,
    receivedAt: iso(row.received_at),
    cancelledBy: row.cancelled_by,
    cancelledAt: iso(row.cancelled_at),
    createdAt: row.created_at.toISOString(),
    updatedAt: iso(row.updated_at),
  };
}

function toLine(row: LineRow): TransferLine {
  return {
    id: row.id,
    batchId: row.batch_id,
    batchCode: row.batch_code,
    cropId: row.crop_id,
    grade: row.grade,
    qtySentKg: row.qty_sent,
    qtyReceivedKg: row.qty_received,
    varianceKg: row.variance_qty,
    costPerKg: row.cost_per_kg,
    lineValue: money(row.line_value_paise),
    destBatchId: row.dest_batch_id,
    damagedQtyKg: row.damaged_qty,
    spoiledQtyKg: row.spoiled_qty,
    condition: row.condition,
    actualGrade: row.actual_grade,
    actualProductId: row.actual_crop_id,
    actualProductName: row.actual_crop_name,
    storageLocationId: row.storage_location_id,
    storageLocation: row.storage_location,
  };
}

async function loadLines(db: Executor, transferId: string): Promise<TransferLine[]> {
  // Allow-list of batch columns: never source_farmer_id (BR-16). variance_qty is generated
  // (qty_received - qty_sent) and only meaningful once the line was received.
  const result = await db.query<LineRow>(
    `SELECT i.id, i.batch_id, b.batch_code, b.crop_id, b.grade::text AS grade,
            i.qty_sent::text AS qty_sent, i.qty_received::text AS qty_received,
            CASE WHEN i.qty_received IS NULL THEN NULL ELSE i.variance_qty::text END AS variance_qty,
            i.cost_per_kg::text AS cost_per_kg, i.line_value_paise::text AS line_value_paise, i.dest_batch_id,
            -- BR-126: the breakdown columns default to 0; before receipt they read null.
            CASE WHEN i.qty_received IS NULL THEN NULL ELSE i.damaged_qty::text END AS damaged_qty,
            CASE WHEN i.qty_received IS NULL THEN NULL ELSE i.spoiled_qty::text END AS spoiled_qty,
            i.condition, i.actual_grade::text AS actual_grade, i.actual_crop_id, ac.name AS actual_crop_name,
            i.storage_location_id, i.storage_location
       FROM stock_transfer_items i
       JOIN inventory_batches b ON b.id = i.batch_id
       LEFT JOIN crop_master ac ON ac.id = i.actual_crop_id
      WHERE i.transfer_id = $1
      ORDER BY i.created_at, i.id`,
    [transferId],
  );
  return result.rows.map(toLine);
}

async function loadTransfer(db: Executor, id: string, lock: boolean): Promise<Transfer | null> {
  const result = await db.query<HeaderRow>(
    `SELECT ${HEADER_COLUMNS} FROM ${HEADER_FROM} WHERE t.id = $1${lock ? ' FOR UPDATE OF t' : ''}`,
    [id],
  );
  const row = result.rows[0];
  if (row === undefined) return null;
  return { ...toSummary(row), lines: await loadLines(db, id) };
}

export const warehouseTransfersRepo: WarehouseTransfersRepo = {
  async findWarehouses(db, ids) {
    const result = await db.query<{ id: string; is_active: boolean }>(
      `SELECT id, is_active FROM warehouses WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [ids],
    );
    return result.rows.map((row) => ({ id: row.id, isActive: row.is_active }));
  },

  async highValueThresholdPaise(db) {
    const result = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'transfer_high_value_threshold_paise' LIMIT 1`,
    );
    const value = result.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
    logger.warn(
      { key: 'transfer_high_value_threshold_paise', fallback: FALLBACK_HIGH_VALUE_THRESHOLD_PAISE },
      'system_config row missing or unusable; using the BR-102 fallback threshold',
    );
    return FALLBACK_HIGH_VALUE_THRESHOLD_PAISE;
  },

  async lockAndCheckBatches(db, lines) {
    const ids = lines.map((l) => l.batchId);
    // Lock first, in a stable order, then read: the shelf figure below is computed under the lock,
    // so a concurrent sale or transfer of the same batch waits for this transaction.
    await db.query(`SELECT id FROM inventory_batches WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE`, [ids]);
    const result = await db.query<{
      batch_id: string;
      batch_code: string;
      warehouse_id: string;
      status: string;
      cost_per_kg: string | null;
      line_value_paise: string | null;
      fits: boolean;
    }>(
      `SELECT b.id AS batch_id, b.batch_code, b.warehouse_id, b.status, b.cost_per_kg::text AS cost_per_kg,
              CASE WHEN b.cost_per_kg IS NULL THEN NULL
                   ELSE round(l.qty * b.cost_per_kg * 100)::bigint::text END AS line_value_paise,
              l.qty <= ${shelfFreeSql('b')} AS fits
         FROM unnest($1::uuid[], $2::numeric[]) WITH ORDINALITY AS l(batch_id, qty, ord)
         JOIN inventory_batches b ON b.id = l.batch_id
        ORDER BY l.ord`,
      [ids, lines.map((l) => l.qtyKg)],
    );
    return result.rows.map((row) => ({
      batchId: row.batch_id,
      batchCode: row.batch_code,
      warehouseId: row.warehouse_id,
      status: row.status,
      costPerKg: row.cost_per_kg,
      lineValuePaise: row.line_value_paise === null ? null : Number(row.line_value_paise),
      fits: row.fits,
    }));
  },

  async insertTransfer(db, input) {
    const result = await db.query<{ id: string; transfer_number: string }>(
      `INSERT INTO stock_transfers (
         transfer_number, from_warehouse_id, to_warehouse_id, status, initiated_by,
         total_value_paise, has_unvalued_lines, requires_approval, vehicle_number, notes
       ) VALUES (
         'TRF-' || lpad(nextval('stock_transfer_number_seq')::text, 6, '0'), $1, $2, 'PENDING_APPROVAL', $3,
         $4::bigint, $5, $6, $7, $8
       ) RETURNING id, transfer_number`,
      [
        input.fromWarehouseId,
        input.toWarehouseId,
        input.initiatedBy,
        String(input.totalValuePaise),
        input.hasUnvaluedLines,
        input.requiresApproval,
        input.vehicleNumber,
        input.notes,
      ],
    );
    const row = result.rows[0]!;
    return { id: row.id, transferNumber: row.transfer_number };
  },

  async insertItems(db, transferId, items) {
    await db.query(
      `INSERT INTO stock_transfer_items (transfer_id, batch_id, qty_sent, cost_per_kg, line_value_paise)
       SELECT $1, l.batch_id, l.qty, l.cost, l.value
         FROM unnest($2::uuid[], $3::numeric[], $4::numeric[], $5::bigint[]) AS l(batch_id, qty, cost, value)`,
      [
        transferId,
        items.map((i) => i.batchId),
        items.map((i) => i.qtyKg),
        items.map((i) => i.costPerKg),
        items.map((i) => (i.lineValuePaise === null ? null : String(i.lineValuePaise))),
      ],
    );
  },

  lockTransfer: (db, id) => loadTransfer(db, id, true),
  findTransfer: (db, id) => loadTransfer(db, id, false),

  async list(db, query, visibleWarehouses) {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (visibleWarehouses !== null) {
      params.push(visibleWarehouses);
      conditions.push(`(t.from_warehouse_id = ANY($${params.length}::uuid[]) OR t.to_warehouse_id = ANY($${params.length}::uuid[]))`);
    }
    if (query.status !== undefined) {
      params.push(query.status);
      conditions.push(`t.status = $${params.length}`);
    }
    if (query.warehouseId !== undefined) {
      params.push(query.warehouseId);
      const at = `$${params.length}::uuid`;
      if (query.direction === 'INBOUND') conditions.push(`t.to_warehouse_id = ${at}`);
      else if (query.direction === 'OUTBOUND') conditions.push(`t.from_warehouse_id = ${at}`);
      else conditions.push(`(t.from_warehouse_id = ${at} OR t.to_warehouse_id = ${at})`);
    }
    const where = conditions.length === 0 ? 'TRUE' : conditions.join(' AND ');
    const count = await db.query<{ total: string }>(`SELECT count(*)::text AS total FROM stock_transfers t WHERE ${where}`, params);
    const rows = await db.query<HeaderRow>(
      `SELECT ${HEADER_COLUMNS} FROM ${HEADER_FROM} WHERE ${where}
        ORDER BY t.created_at DESC, t.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return { items: rows.rows.map(toSummary), total: Number(count.rows[0]?.total ?? '0') };
  },

  async insertLedger(db, row) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO stock_ledger (
         batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, ref_id, remarks, created_by
       ) VALUES ($1, $2, $3::stock_movement_type, $4::numeric, 0, 'STOCK_TRANSFER', $5, $6, $7)
       RETURNING id`,
      [row.batchId, row.warehouseId, row.movementType, row.qtyDeltaKg, row.transferId, `Inter-warehouse transfer ${row.transferNumber}`, row.actorId],
    );
    return result.rows[0]!.id;
  },

  async setOutLedger(db, itemId, ledgerId) {
    await db.query(`UPDATE stock_transfer_items SET out_ledger_id = $2, updated_at = now() WHERE id = $1`, [itemId, ledgerId]);
  },

  async markDispatched(db, id, approvedBy) {
    await db.query(
      `UPDATE stock_transfers
          SET status = 'IN_TRANSIT', dispatched_at = now(),
              approved_by = COALESCE($2::uuid, approved_by),
              approved_at = CASE WHEN $2::uuid IS NULL THEN approved_at ELSE now() END,
              updated_at = now()
        WHERE id = $1`,
      [id, approvedBy],
    );
  },

  async insertDestBatch(db, input) {
    // qty_available stays at its default 0: the TRANSFER_IN ledger row fills it (CLAUDE.md 2.3).
    // BR-126: the destination's location (validated by the service; the composite foreign key keeps
    // it in this batch's warehouse) is set at insert; crop and grade stay the source batch's.
    const result = await db.query<{ id: string }>(
      `INSERT INTO inventory_batches (
         batch_code, warehouse_id, crop_id, grade, goods_receipt_id, source_farmer_id,
         qty_received, cost_per_kg, received_on, expiry_on, status, storage_location_id, storage_location
       )
       SELECT s.batch_code || '/' || $4, $2, s.crop_id, s.grade, NULL, s.source_farmer_id,
              $3::numeric, s.cost_per_kg, (now() AT TIME ZONE 'Asia/Kolkata')::date, s.expiry_on, 'ACTIVE', $5, $6
         FROM inventory_batches s
        WHERE s.id = $1
       RETURNING id`,
      [
        input.sourceBatchId,
        input.warehouseId,
        input.qtyKg,
        input.transferNumber,
        input.storageLocationId ?? null,
        input.storageLocation ?? null,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error(`source batch ${input.sourceBatchId} vanished during receipt`);
    return row.id;
  },

  async markItemReceived(db, itemId, input) {
    await db.query(
      `UPDATE stock_transfer_items
          SET qty_received = $2::numeric, dest_batch_id = $3, in_ledger_id = $4,
              damaged_qty = $5::numeric, spoiled_qty = $6::numeric, condition = $7,
              actual_grade = $8::produce_grade, actual_crop_id = $9, storage_location_id = $10, storage_location = $11,
              updated_at = now()
        WHERE id = $1`,
      [
        itemId,
        input.qtyKg,
        input.destBatchId,
        input.inLedgerId,
        input.damagedQtyKg ?? '0',
        input.spoiledQtyKg ?? '0',
        input.condition ?? null,
        input.actualGrade ?? null,
        input.actualCropId ?? null,
        input.storageLocationId ?? null,
        input.storageLocation ?? null,
      ],
    );
  },

  async markReceived(db, id, input) {
    await db.query(
      `UPDATE stock_transfers
          SET status = 'RECEIVED', received_by = $2, received_at = now(),
              has_discrepancy = $3, receipt_note = $4, updated_at = now(),
              -- BR-126: TGR-<Asia/Kolkata year>-<6 digits>, the GRN-/BATCH- pattern.
              receipt_number = 'TGR-' || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYYY') || '-'
                               || lpad(nextval('stock_transfer_receipt_number_seq')::text, 6, '0')
        WHERE id = $1`,
      [id, input.receivedBy, input.hasDiscrepancy, input.receiptNote],
    );
  },

  async findLiveCropIds(db, ids) {
    if (ids.length === 0) return [];
    const result = await db.query<{ id: string }>(
      `SELECT id FROM crop_master WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [ids],
    );
    return result.rows.map((row) => row.id);
  },

  findPlaceableLocation: (db, warehouseId, id) => findPlaceableLocation(db, warehouseId, id),

  async markCancelled(db, id, input) {
    await db.query(
      `UPDATE stock_transfers
          SET status = 'CANCELLED', cancelled_by = $2, cancelled_at = now(), cancel_reason = $3, updated_at = now()
        WHERE id = $1`,
      [id, input.cancelledBy, input.reason],
    );
  },
};
