import { ErrorCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { CURSOR_TAGS, encodeKeysetCursor, requireKeysetCursor } from '../../http/keysetCursor.js';
import { MICRO_TS_SQL } from '../../http/microTimestamp.js';
import { scopedWhere, type ResolvedScope, type ScopedWhere } from '../../rbac/requirePermission.js';
import type {
  BatchView,
  CreateBatchInput,
  ListBatchesQuery,
  ListStockLedgerQuery,
  PageMeta,
  ProduceGrade,
  RecordMovementInput,
  StockLedgerEntryView,
} from './inventory.schema.js';

export interface BatchRow {
  id: string;
  batch_code: string;
  warehouse_id: string;
  crop_id: string;
  crop_name?: string | null;
  grade: string;
  goods_receipt_id: string | null;
  source_farmer_id: string;
  qty_received: string;
  qty_available: string;
  cost_per_kg: string | null;
  storage_location: string | null;
  /** BR-125 (migration 0079); absent only in hand-built test rows. */
  storage_location_id?: string | null;
  received_on: Date | string;
  expiry_on: Date | string | null;
  status: string;
  created_at: Date;
  updated_at: Date | null;
}

export interface StockLedgerRow {
  id: string;
  batch_id: string;
  warehouse_id: string;
  movement_type: string;
  qty_delta: string;
  balance_after: string;
  ref_type: string | null;
  ref_id: string | null;
  remarks: string | null;
  created_by: string | null;
  created_at: Date;
}

export function toBatchView(row: BatchRow): BatchView {
  const formatDate = (val: Date | string | null | undefined): string | null => {
    if (!val) return null;
    if (val instanceof Date) return val.toISOString().split('T')[0]!;
    return String(val).split('T')[0]!;
  };

  return {
    id: row.id,
    batchCode: row.batch_code,
    warehouseId: row.warehouse_id,
    cropId: row.crop_id,
    cropName: row.crop_name ?? undefined,
    grade: row.grade as ProduceGrade,
    goodsReceiptId: row.goods_receipt_id,
    sourceFarmerId: row.source_farmer_id,
    qtyReceivedKg: row.qty_received,
    qtyAvailableKg: row.qty_available,
    costPerKg: row.cost_per_kg,
    storageLocation: row.storage_location,
    storageLocationId: row.storage_location_id ?? null,
    receivedOn: formatDate(row.received_on) ?? new Date().toISOString().split('T')[0]!,
    expiryOn: formatDate(row.expiry_on),
    status: row.status as BatchView['status'],
  };
}

export function toStockLedgerEntryView(row: StockLedgerRow): StockLedgerEntryView {
  return {
    id: row.id,
    batchId: row.batch_id,
    warehouseId: row.warehouse_id,
    txnType: row.movement_type as StockLedgerEntryView['txnType'],
    qtyDeltaKg: row.qty_delta,
    balanceAfterKg: row.balance_after,
    refType: row.ref_type,
    refId: row.ref_id,
    performedBy: row.created_by,
    performedAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    remarks: row.remarks,
  };
}

function renumber(scope: ScopedWhere, startIndex: number): ScopedWhere {
  let sql = scope.sql;
  scope.params.forEach((_, idx) => {
    const oldPlaceholder = `$${idx + 1}`;
    const newPlaceholder = `__PARAM_${idx}__`;
    sql = sql.split(oldPlaceholder).join(newPlaceholder);
  });
  scope.params.forEach((_, idx) => {
    const newPlaceholder = `__PARAM_${idx}__`;
    const targetPlaceholder = `$${startIndex + idx}`;
    sql = sql.split(newPlaceholder).join(targetPlaceholder);
  });
  return {
    sql,
    params: scope.params,
    nextIndex: startIndex + scope.params.length,
  };
}

export interface ListBatchesResult {
  items: BatchView[];
  page: PageMeta;
}

export interface ListStockLedgerResult {
  items: StockLedgerEntryView[];
  page: PageMeta;
}

export interface InventoryRepo {
  createBatch(db: Executor, input: CreateBatchInput): Promise<BatchRow>;
  insertLedgerMovement(db: Executor, input: RecordMovementInput): Promise<StockLedgerRow>;
  listBatches(db: Executor, scope: ResolvedScope, filters: ListBatchesQuery): Promise<ListBatchesResult>;
  getBatchById(db: Executor, scope: ResolvedScope, id: string): Promise<BatchView | null>;
  listStockLedger(
    db: Executor,
    scope: ResolvedScope,
    filters: ListStockLedgerQuery,
  ): Promise<ListStockLedgerResult>;
  getPooledAvailability(
    db: Executor,
    warehouseId: string,
    cropId: string,
    grade: string,
  ): Promise<string>;
  resolveLedgerFarmer(
    db: Executor,
    ledgerEntryId: string,
  ): Promise<{ ledgerId: string; batchId: string; sourceFarmerId: string } | null>;
}

export const inventoryRepo: InventoryRepo = {
  async createBatch(db: Executor, input: CreateBatchInput): Promise<BatchRow> {
    const res = await db.query<BatchRow>(
      `INSERT INTO inventory_batches (
         batch_code,
         warehouse_id,
         crop_id,
         grade,
         goods_receipt_id,
         source_farmer_id,
         qty_received,
         qty_available,
         cost_per_kg,
         storage_location,
         received_on,
         expiry_on,
         status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, COALESCE($10::date, CURRENT_DATE), $11::date, 'ACTIVE')
       RETURNING *`,
      [
        input.batchCode,
        input.warehouseId,
        input.cropId,
        input.grade,
        input.goodsReceiptId ?? null,
        input.sourceFarmerId,
        input.qtyReceivedKg,
        input.costPerKg ?? null,
        input.storageLocation ?? null,
        input.receivedOn ?? null,
        input.expiryOn ?? null,
      ],
    );
    return res.rows[0]!;
  },

  async insertLedgerMovement(db: Executor, input: RecordMovementInput): Promise<StockLedgerRow> {
    try {
        const res = await db.query<StockLedgerRow>(`
          INSERT INTO stock_ledger (
            batch_id,
            warehouse_id,
            movement_type,
            qty_delta,
            balance_after,
            ref_type,
            ref_id,
            remarks,
            created_by
          ) VALUES (
            $1,
            COALESCE($2, (SELECT warehouse_id FROM inventory_batches WHERE id = $1)),
            $3,
            $4,
            (
              COALESCE(
                (SELECT balance_after FROM stock_ledger WHERE batch_id = $1 ORDER BY created_at DESC, id DESC LIMIT 1),
                0.000
              ) + $4::numeric
            ),
            $5,
            $6,
            $7,
            $8
          )
          RETURNING *
        `, [
          input.batchId,
          input.warehouseId ?? null,
          input.movementType,
          input.qtyDeltaKg,
          input.refType ?? null,
          input.refId ?? null,
          input.remarks ?? null,
          input.performedBy ?? null,
        ]);
        // qty_available is maintained by trg_stock_ledger_apply from this INSERT (CLAUDE.md 2.3);
        // nothing here writes the balance column.
        return res.rows[0]!;
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string; hint?: string };
      if (
        errorObj.code === '23514' ||
        errorObj.hint?.includes('INSUFFICIENT_STOCK') ||
        errorObj.message?.includes('insufficient stock')
      ) {
        throw new AppError(ErrorCode.STOCK_UNAVAILABLE, {
          detail: `Insufficient stock available on batch ${input.batchId}`,
          cause: err,
        });
      }
      throw err;
    }
  },

  async listBatches(
    db: Executor,
    scope: ResolvedScope,
    filters: ListBatchesQuery,
  ): Promise<ListBatchesResult> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    const baseScope = scopedWhere(scope, { warehouseColumn: 'b.warehouse_id' });
    const scoped = renumber(baseScope, params.length + 1);
    conditions.push(scoped.sql);
    params.push(...scoped.params);

    if (filters.warehouseId !== undefined) {
      params.push(filters.warehouseId);
      conditions.push(`b.warehouse_id = $${params.length}`);
    }
    if (filters.cropId !== undefined) {
      params.push(filters.cropId);
      conditions.push(`b.crop_id = $${params.length}`);
    }
    if (filters.grade !== undefined) {
      params.push(filters.grade);
      conditions.push(`b.grade = $${params.length}`);
    }
    if (filters.status !== undefined) {
      params.push(filters.status);
      conditions.push(`b.status = $${params.length}`);
    }
    if (filters.cursor !== undefined && filters.cursor.length > 0) {
      // Keyset on (created_at, id): the row-value comparison matches the ORDER BY exactly, so no
      // row is skipped or repeated when created_at ties (the old `b.id > cursor` did both).
      const after = requireKeysetCursor(CURSOR_TAGS.inventoryBatches, filters.cursor);
      params.push(after.ts, after.id);
      conditions.push(`(b.created_at, b.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }

    const where = conditions.length === 0 ? 'TRUE' : conditions.join(' AND ');
    const limit = filters.limit;
    params.push(limit + 1);

    const querySql = `
      SELECT b.*, cm.name AS crop_name, ${MICRO_TS_SQL('b.created_at')} AS cursor_ts
        FROM inventory_batches b
        LEFT JOIN crop_master cm ON cm.id = b.crop_id
       WHERE ${where}
       ORDER BY b.created_at DESC, b.id DESC
       LIMIT $${params.length}
    `;

    const result = await db.query<BatchRow & { cursor_ts: string }>(querySql, params);
    const rows = result.rows;
    const hasMore = rows.length > limit;
    const itemsToReturn = hasMore ? rows.slice(0, limit) : rows;
    const last = itemsToReturn[itemsToReturn.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeKeysetCursor(CURSOR_TAGS.inventoryBatches, { ts: last.cursor_ts, id: last.id })
        : null;

    return {
      items: itemsToReturn.map(toBatchView),
      page: {
        nextCursor,
        hasMore,
      },
    };
  },

  async getBatchById(db: Executor, scope: ResolvedScope, id: string): Promise<BatchView | null> {
    const params: unknown[] = [id];
    const conditions: string[] = ['b.id = $1'];

    const baseScope = scopedWhere(scope, { warehouseColumn: 'b.warehouse_id' });
    const scoped = renumber(baseScope, params.length + 1);
    conditions.push(scoped.sql);
    params.push(...scoped.params);

    const where = conditions.join(' AND ');
    const querySql = `
      SELECT b.*, cm.name AS crop_name
        FROM inventory_batches b
        LEFT JOIN crop_master cm ON cm.id = b.crop_id
       WHERE ${where}
       LIMIT 1
    `;

    const result = await db.query<BatchRow>(querySql, params);
    if (result.rows.length === 0) {
      return null;
    }
    return toBatchView(result.rows[0]!);
  },

  async listStockLedger(
    db: Executor,
    scope: ResolvedScope,
    filters: ListStockLedgerQuery,
  ): Promise<ListStockLedgerResult> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    const baseScope = scopedWhere(scope, { warehouseColumn: 'l.warehouse_id' });
    const scoped = renumber(baseScope, params.length + 1);
    conditions.push(scoped.sql);
    params.push(...scoped.params);

    if (filters.batchId !== undefined) {
      params.push(filters.batchId);
      conditions.push(`l.batch_id = $${params.length}`);
    }
    if (filters.warehouseId !== undefined) {
      params.push(filters.warehouseId);
      conditions.push(`l.warehouse_id = $${params.length}`);
    }
    if (filters.txnType !== undefined) {
      params.push(filters.txnType);
      conditions.push(`l.movement_type = $${params.length}`);
    }
    if (filters.from !== undefined) {
      params.push(filters.from);
      conditions.push(`l.created_at >= $${params.length}::timestamptz`);
    }
    if (filters.to !== undefined) {
      params.push(filters.to);
      conditions.push(`l.created_at <= $${params.length}::timestamptz`);
    }
    if (filters.cursor !== undefined && filters.cursor.length > 0) {
      // Keyset on (created_at, id), matching the ORDER BY (the old `l.id < cursor` skipped rows).
      const after = requireKeysetCursor(CURSOR_TAGS.stockLedger, filters.cursor);
      params.push(after.ts, after.id);
      conditions.push(`(l.created_at, l.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }

    const where = conditions.length === 0 ? 'TRUE' : conditions.join(' AND ');
    const limit = filters.limit;
    params.push(limit + 1);

    const querySql = `
      SELECT l.*, ${MICRO_TS_SQL('l.created_at')} AS cursor_ts
        FROM stock_ledger l
       WHERE ${where}
       ORDER BY l.created_at DESC, l.id DESC
       LIMIT $${params.length}
    `;

    const result = await db.query<StockLedgerRow & { cursor_ts: string }>(querySql, params);
    const rows = result.rows;
    const hasMore = rows.length > limit;
    const itemsToReturn = hasMore ? rows.slice(0, limit) : rows;
    const last = itemsToReturn[itemsToReturn.length - 1];
    const nextCursor =
      hasMore && last !== undefined
        ? encodeKeysetCursor(CURSOR_TAGS.stockLedger, { ts: last.cursor_ts, id: last.id })
        : null;

    return {
      items: itemsToReturn.map(toStockLedgerEntryView),
      page: {
        nextCursor,
        hasMore,
      },
    };
  },

  async getPooledAvailability(
    db: Executor,
    warehouseId: string,
    cropId: string,
    grade: string,
  ): Promise<string> {
    const res = await db.query<{ pooled_available: string }>(
      `SELECT COALESCE(SUM(qty_available), 0)::text AS pooled_available
         FROM inventory_batches
        WHERE warehouse_id = $1
          AND crop_id = $2
          AND grade = $3
          AND status = 'ACTIVE'`,
      [warehouseId, cropId, grade],
    );
    return res.rows[0]?.pooled_available ?? '0.000';
  },

  async resolveLedgerFarmer(
    db: Executor,
    ledgerEntryId: string,
  ): Promise<{ ledgerId: string; batchId: string; sourceFarmerId: string } | null> {
    const res = await db.query<{ ledger_id: string; batch_id: string; source_farmer_id: string }>(
      `SELECT l.id AS ledger_id, l.batch_id, b.source_farmer_id
         FROM stock_ledger l
         JOIN inventory_batches b ON b.id = l.batch_id
        WHERE l.id = $1`,
      [ledgerEntryId],
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0]!;
    return {
      ledgerId: row.ledger_id,
      batchId: row.batch_id,
      sourceFarmerId: row.source_farmer_id,
    };
  },
};
