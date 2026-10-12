/**
 * Module 11 (Warehouse Finance), BR-75: the expense payment voucher, a read-only document derived
 * from one recorded expense. Nothing is stored: the same expense always yields the same voucher.
 *
 * There is no approval stage (BR-62, owner decision 2026-10-11: expenses are only recorded), so the
 * voucher names the recorder and no authorizer.
 *
 * Takes a `ResolvedScope`, never a `Request`.
 */
import { pool, type Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { expenseVoucherRepo, type ExpenseVoucherRepo } from './expense-voucher.repo.js';
import type { ExpenseRecord } from './finance.repo.js';
import type { ExpenseVoucherResponse } from './finance.schema.js';
import { notFound } from './finance.shared.js';

export interface ExpenseVoucherServiceDeps {
  repo: ExpenseVoucherRepo;
  db: Executor;
}

export interface ExpenseVoucherService {
  getVoucher(scope: ResolvedScope, id: string): Promise<ExpenseVoucherResponse>;
}

/**
 * The voucher number is DERIVED, not allocated: no sequence exists to keep in step, and the same
 * expense always yields the same number. The date keeps it readable; 8 hex digits of the expense id
 * make a collision within one expense date practically impossible (UNCONFIRMED default: the design
 * shows a sequential number such as VCH-000821, which would need a stored sequence).
 */
export function voucherNumberFor(expense: Pick<ExpenseRecord, 'id' | 'expenseDate'>): string {
  const day = expense.expenseDate.replaceAll('-', '');
  return `VCH-${day}-${expense.id.replaceAll('-', '').slice(0, 8).toUpperCase()}`;
}

export function createExpenseVoucherService(
  deps: ExpenseVoucherServiceDeps = { repo: expenseVoucherRepo, db: pool },
): ExpenseVoucherService {
  const { repo, db } = deps;
  return {
    async getVoucher(scope, id) {
      const source = await repo.findVoucherSource(db, scope, id);
      if (source === null) throw notFound('Expense', id);
      const { expense } = source;
      return {
        voucherNumber: voucherNumberFor(expense),
        voucherType: 'EXPENSE',
        expenseId: expense.id,
        warehouse: source.warehouse,
        category: expense.category,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        paymentMethod: expense.paymentMethod,
        vendor: expense.vendor,
        description: expense.description,
        status: expense.status,
        recordedBy: { id: expense.recordedBy, name: source.recorderName },
      };
    },
  };
}

export const expenseVoucherService: ExpenseVoucherService = createExpenseVoucherService();
