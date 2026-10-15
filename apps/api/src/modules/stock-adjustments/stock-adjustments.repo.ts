/**
 * BR-37: SQL for manual stock adjustments. Every function takes an `Executor` so the service can
 * run each state change as ONE transaction; no authorization decision lives here.
 *
 * Nothing here writes a quantity. An approval's stock movement is a `stock_ledger` INSERT made by
 * the inventory service (BR-37b); this file only records the id of that ledger row. The decided
 * row is then frozen by trg_stock_adjustments_frozen_when_decided (0070).
 *
 * `inventory_batches.source_farmer_id` is never selected (BR-16).
 */
import type { Executor } from '../../db/pool.js';
import type {
  AdjustmentStatus,
  AdjustmentType,
  ListAdjustmentsQuery,
  StockAdjustment,
} from './stock-adjustments.schema.js';

/** The batch facts an adjustment needs. */
export interface AdjustableBatch {
  id: string;
  warehouseId: string;
  status: string;
  /** numeric(12,3) as text: the ledger-derived balance. */
  qtyAvailableKg: string;
}

export interface NewAdjustment {
  batchId: string;
  warehouseId: string;
  adjustmentType: AdjustmentType;
  /** Signed decimal string, never zero. */
  qtyDeltaKg: string;
  reason: string;
  createdBy: string;
}

export interface StockAdjustmentsRepo {
  /** The batch, or null when unknown. Not locked: the approval's ledger insert locks it. */
  findBatch(db: Executor, batchId: string): Promise<AdjustableBatch | null>;
  /** Inserts a PENDING adjustment and returns its id. */
  insertAdjustment(db: Executor, input: NewAdjustment): Promise<string>;
  findAdjustment(db: Executor, id: string): Promise<StockAdjustment | null>;
  /** The adjustment, row-locked FOR UPDATE so two deciders serialise. */
  lockAdjustment(db: Executor, id: string): Promise<StockAdjustment | null>;
  /** `visibleWarehouses` null = unfiltered; otherwise the adjustment's warehouse must be listed. */
  list(
    db: Executor,
    query: ListAdjustmentsQuery,
    visibleWarehouses: string[] | null,
  ): Promise<{ items: StockAdjustment[]; total: number }>;
  /** PENDING -> APPROVED with the approver and the ledger row the approval inserted. */
  markApproved(db: Executor, id: string, input: { approvedBy: string; ledgerEntryId: string }): Promise<void>;
  /** PENDING -> REJECTED with the rejecter and the reason. */
  markRejected(db: Executor, id: string, input: { rejectedBy: string; reason: string }): Promise<void>;
}

interface AdjustmentRow {
  id: string;
  batch_id: string;
  batch_code: string;
  warehouse_id: string;
  crop_id: string;
  grade: string;
  adjustment_type: AdjustmentType;
  qty_delta: string;
  reason: string;
  status: AdjustmentStatus;
  created_by: string;
  created_at: Date;
  approved_by: string | null;
  approved_at: Date | null;
  rejected_by: string | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  ledger_entry_id: string | null;
  verification_id: string | null;
  updated_at: Date | null;
}

const iso = (value: Date | null): string | null => (value === null ? null : value.toISOString());

function toAdjustment(row: AdjustmentRow): StockAdjustment {
  return {
    id: row.id,
    batchId: row.batch_id,
    batchCode: row.batch_code,
    warehouseId: row.warehouse_id,
    cropId: row.crop_id,
    grade: row.grade,
    adjustmentType: row.adjustment_type,
    qtyDeltaKg: row.qty_delta,
    reason: row.reason,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    approvedBy: row.approved_by,
    approvedAt: iso(row.approved_at),
    rejectedBy: row.rejected_by,
    rejectedAt: iso(row.rejected_at),
    rejectionReason: row.rejection_reason,
    ledgerEntryId: row.ledger_entry_id,
    verificationId: row.verification_id,
    updatedAt: iso(row.updated_at),
  };
}

const SELECT_ADJUSTMENT = `
  SELECT a.id, a.batch_id, b.batch_code, a.warehouse_id, b.crop_id, b.grade::text AS grade,
         a.adjustment_type, a.qty_delta::text AS qty_delta, a.reason, a.status,
         a.created_by, a.created_at, a.approved_by, a.approved_at,
         a.rejected_by, a.rejected_at, a.rejection_reason, a.ledger_entry_id,
         v.id AS verification_id, a.updated_at
    FROM stock_adjustments a
    JOIN inventory_batches b ON b.id = a.batch_id
    LEFT JOIN stock_verifications v ON v.adjustment_id = a.id`;

export const stockAdjustmentsRepo: StockAdjustmentsRepo = {
  async findBatch(db, batchId) {
    const result = await db.query<{ id: string; warehouse_id: string; status: string; qty_available: string }>(
      `SELECT id, warehouse_id, status::text AS status, qty_available::text AS qty_available
         FROM inventory_batches
        WHERE id = $1`,
      [batchId],
    );
    const row = result.rows[0];
    return row === undefined
      ? null
      : { id: row.id, warehouseId: row.warehouse_id, status: row.status, qtyAvailableKg: row.qty_available };
  },

  async insertAdjustment(db, input) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO stock_adjustments (batch_id, warehouse_id, adjustment_type, qty_delta, reason, status, created_by)
       VALUES ($1, $2, $3, $4::numeric, $5, 'PENDING', $6)
       RETURNING id`,
      [input.batchId, input.warehouseId, input.adjustmentType, input.qtyDeltaKg, input.reason, input.createdBy],
    );
    return result.rows[0]!.id;
  },

  async findAdjustment(db, id) {
    const result = await db.query<AdjustmentRow>(`${SELECT_ADJUSTMENT} WHERE a.id = $1`, [id]);
    const row = result.rows[0];
    return row === undefined ? null : toAdjustment(row);
  },

  async lockAdjustment(db, id) {
    const result = await db.query<AdjustmentRow>(`${SELECT_ADJUSTMENT} WHERE a.id = $1 FOR UPDATE OF a`, [id]);
    const row = result.rows[0];
    return row === undefined ? null : toAdjustment(row);
  },

  async list(db, query, visibleWarehouses) {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (visibleWarehouses !== null) {
      params.push(visibleWarehouses);
      conditions.push(`a.warehouse_id = ANY($${params.length}::uuid[])`);
    }
    if (query.status !== undefined) {
      params.push(query.status);
      conditions.push(`a.status = $${params.length}`);
    }
    if (query.warehouseId !== undefined) {
      params.push(query.warehouseId);
      conditions.push(`a.warehouse_id = $${params.length}::uuid`);
    }
    if (query.batchId !== undefined) {
      params.push(query.batchId);
      conditions.push(`a.batch_id = $${params.length}::uuid`);
    }
    if (query.adjustmentType !== undefined) {
      params.push(query.adjustmentType);
      conditions.push(`a.adjustment_type = $${params.length}`);
    }
    const where = conditions.length === 0 ? 'TRUE' : conditions.join(' AND ');
    const count = await db.query<{ total: string }>(
      `SELECT count(*)::text AS total FROM stock_adjustments a WHERE ${where}`,
      params,
    );
    const rows = await db.query<AdjustmentRow>(
      `${SELECT_ADJUSTMENT} WHERE ${where}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return { items: rows.rows.map(toAdjustment), total: Number(count.rows[0]?.total ?? '0') };
  },

  async markApproved(db, id, input) {
    await db.query(
      `UPDATE stock_adjustments
          SET status = 'APPROVED', approved_by = $2, approved_at = now(), ledger_entry_id = $3, updated_at = now()
        WHERE id = $1 AND status = 'PENDING'`,
      [id, input.approvedBy, input.ledgerEntryId],
    );
  },

  async markRejected(db, id, input) {
    await db.query(
      `UPDATE stock_adjustments
          SET status = 'REJECTED', rejected_by = $2, rejected_at = now(), rejection_reason = $3, updated_at = now()
        WHERE id = $1 AND status = 'PENDING'`,
      [id, input.rejectedBy, input.reason],
    );
  },
};
