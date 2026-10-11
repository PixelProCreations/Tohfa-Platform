/**
 * Module 11 (Warehouse Finance), BR-73 / BR-75: SQL only, for the expense decisions and the voucher.
 *
 * The decision UPDATEs are conditional on `status = 'RECORDED'`: two concurrent decisions on one
 * expense serialise on the row lock and the loser matches no row (the caller answers 409). The
 * database trigger `trg_expenses_immutable_guard` (migration 0049) is the backstop that makes a
 * decided expense, and the money fields, immutable even to a statement that bypasses this repo.
 *
 * Warehouse scoping reuses `findExpenseById` from the finance repo (it applies
 * `warehouseScopeFilter` and hides soft-deleted rows), so a row outside the caller's scope is
 * absent here exactly as it is for the plain expense read.
 */
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import { EXPENSE_COLUMNS, financeRepo, mapExpense, type ExpenseRecord, type ExpenseRow } from './finance.repo.js';

export interface VoucherSource {
  expense: ExpenseRecord;
  warehouse: { id: string; code: string; name: string } | null;
  recorderName: string;
  decidedByName: string | null;
}

interface VoucherRow extends ExpenseRow {
  warehouse_code: string | null;
  warehouse_name: string | null;
  recorder_name: string;
  decided_by_name: string | null;
}

export interface ExpenseLifecycleRepo {
  findExpenseById(db: Executor, scope: ResolvedScope, id: string): Promise<ExpenseRecord | null>;
  /** RECORDED -> APPROVED. Null when the expense is no longer RECORDED. */
  markApproved(db: Executor, id: string, deciderId: string): Promise<ExpenseRecord | null>;
  /** RECORDED -> REJECTED with its reason. Null when the expense is no longer RECORDED. */
  markRejected(db: Executor, id: string, deciderId: string, reason: string): Promise<ExpenseRecord | null>;
  /** RECORDED -> CANCELLED, by the recorder. Null when the expense is no longer RECORDED. */
  markCancelled(db: Executor, id: string, recorderId: string): Promise<ExpenseRecord | null>;
  findVoucherSource(db: Executor, scope: ResolvedScope, id: string): Promise<VoucherSource | null>;
}

const RETURNING = `RETURNING ${EXPENSE_COLUMNS}`;

export const expenseLifecycleRepo: ExpenseLifecycleRepo = {
  findExpenseById: (db, scope, id) => financeRepo.findExpenseById(db, scope, id),

  async markApproved(db, id, deciderId) {
    const result = await db.query<ExpenseRow>(
      `UPDATE expenses AS e
          SET status = 'APPROVED', approved_by = $2, approved_at = now(), decided_by = $2, decided_at = now()
        WHERE id = $1 AND status = 'RECORDED' AND deleted_at IS NULL
        ${RETURNING}`,
      [id, deciderId],
    );
    const row = result.rows[0];
    return row ? mapExpense(row) : null;
  },

  async markRejected(db, id, deciderId, reason) {
    const result = await db.query<ExpenseRow>(
      `UPDATE expenses AS e
          SET status = 'REJECTED', decided_by = $2, decided_at = now(), decision_reason = $3
        WHERE id = $1 AND status = 'RECORDED' AND deleted_at IS NULL
        ${RETURNING}`,
      [id, deciderId, reason],
    );
    const row = result.rows[0];
    return row ? mapExpense(row) : null;
  },

  async markCancelled(db, id, recorderId) {
    const result = await db.query<ExpenseRow>(
      `UPDATE expenses AS e
          SET status = 'CANCELLED', decided_by = $2, decided_at = now()
        WHERE id = $1 AND status = 'RECORDED' AND deleted_at IS NULL AND recorded_by = $2
        ${RETURNING}`,
      [id, recorderId],
    );
    const row = result.rows[0];
    return row ? mapExpense(row) : null;
  },

  async findVoucherSource(db, scope, id) {
    const filter = warehouseScopeFilter(scope, 'e.warehouse_id', 2);
    // Only names leave this query for the people involved: no mobile, e-mail or other user column.
    const result = await db.query<VoucherRow>(
      `SELECT ${EXPENSE_COLUMNS}, w.code AS warehouse_code, w.name AS warehouse_name,
              r.full_name AS recorder_name, d.full_name AS decided_by_name
         FROM expenses e
         LEFT JOIN warehouses w ON w.id = e.warehouse_id
         JOIN users r ON r.id = e.recorded_by
         LEFT JOIN users d ON d.id = e.decided_by
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
      decidedByName: row.decided_by_name,
    };
  },
};
