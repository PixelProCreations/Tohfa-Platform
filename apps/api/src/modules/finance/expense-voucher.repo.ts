/**
 * Module 11 (Warehouse Finance), BR-75: SQL only, for the derived expense voucher.
 *
 * Warehouse scoping applies `warehouseScopeFilter` and hides soft-deleted rows exactly as the plain
 * expense read does, so a row outside the caller's scope is absent here too (the caller answers 404).
 */
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import { EXPENSE_COLUMNS, mapExpense, type ExpenseRecord, type ExpenseRow } from './finance.repo.js';

export interface VoucherSource {
  expense: ExpenseRecord;
  warehouse: { id: string; code: string; name: string } | null;
  recorderName: string;
}

interface VoucherRow extends ExpenseRow {
  warehouse_code: string | null;
  warehouse_name: string | null;
  recorder_name: string;
}

export interface ExpenseVoucherRepo {
  findVoucherSource(db: Executor, scope: ResolvedScope, id: string): Promise<VoucherSource | null>;
}

export const expenseVoucherRepo: ExpenseVoucherRepo = {
  async findVoucherSource(db, scope, id) {
    const filter = warehouseScopeFilter(scope, 'e.warehouse_id', 2);
    // Only the recorder's name leaves this query: no mobile, e-mail or other user column.
    const result = await db.query<VoucherRow>(
      `SELECT ${EXPENSE_COLUMNS}, w.code AS warehouse_code, w.name AS warehouse_name,
              r.full_name AS recorder_name
         FROM expenses e
         LEFT JOIN warehouses w ON w.id = e.warehouse_id
         JOIN users r ON r.id = e.recorded_by
        WHERE e.id = $1::uuid AND e.deleted_at IS NULL AND ${filter.sql}`,
      [id, ...filter.params],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      expense: mapExpense(row),
      warehouse:
        row.warehouse_id === null || row.warehouse_code === null || row.warehouse_name === null
          ? null
          : { id: row.warehouse_id, code: row.warehouse_code, name: row.warehouse_name },
      recorderName: row.recorder_name,
    };
  },
};
