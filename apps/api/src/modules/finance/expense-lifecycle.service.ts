/**
 * Module 11 (Warehouse Finance), BR-73 / BR-75: the expense decision lifecycle and the voucher.
 *
 * UNCONFIRMED DEFAULT (owner approval pending; stated in docs/openapi.yaml): the design prototypes
 * define no approval stage for the warehouse roles, so the lifecycle is the smallest safe reading of
 * the schema that already exists.
 *
 *   RECORDED --approve--> APPROVED    permission finance.expense.approve (SA / TA), never the recorder
 *   RECORDED --reject---> REJECTED    same permission, with a short reason, never the recorder
 *   RECORDED --cancel---> CANCELLED   permission finance.expense.log, the recorder only
 *
 * A decided expense is final (409 INVALID_STATE_TRANSITION), money fields never change, nothing is
 * deleted. Every decision is idempotent through `Idempotency-Key` (BR-68's mechanism): a replay
 * returns the original response before any state check, so it writes no second audit row.
 *
 * Takes a `ResolvedScope`, never a `Request`. Each decision and its masked audit row share one transaction.
 */
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import {
  beginIdempotent,
  idempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { expenseLifecycleRepo, type ExpenseLifecycleRepo } from './expense-lifecycle.repo.js';
import type { ExpenseRecord } from './finance.repo.js';
import type { ExpenseResponse, ExpenseVoucherResponse, RejectExpenseBody } from './finance.schema.js';
import { failValidation, notFound } from './finance.shared.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface ExpenseLifecycleServiceDeps {
  repo: ExpenseLifecycleRepo;
  db: Executor;
  runTx: TransactionRunner;
  idempotency?: IdempotencyStore;
}

export interface ExpenseLifecycleService {
  approve(scope: ResolvedScope, idempotencyKey: string | undefined, id: string): Promise<ExpenseResponse>;
  reject(scope: ResolvedScope, idempotencyKey: string | undefined, id: string, body: RejectExpenseBody): Promise<ExpenseResponse>;
  cancel(scope: ResolvedScope, idempotencyKey: string | undefined, id: string): Promise<ExpenseResponse>;
  getVoucher(scope: ResolvedScope, id: string): Promise<ExpenseVoucherResponse>;
}

type Decision = 'approve' | 'reject' | 'cancel';

const DECISION_AUDIT_CODE: Record<Decision, string> = {
  approve: 'finance.expense.approve',
  reject: 'finance.expense.reject',
  cancel: 'finance.expense.cancel',
};

/**
 * The audit image of an expense: ids, amounts and codes only. The vendor, the description and the
 * rejection reason are free text that can carry names or phone numbers, so they never enter the log.
 */
function maskedExpense(expense: ExpenseRecord): Record<string, unknown> {
  return {
    id: expense.id,
    category: expense.category,
    amount: expense.amount,
    paymentMethod: expense.paymentMethod,
    expenseDate: expense.expenseDate,
    warehouseId: expense.warehouseId,
    status: expense.status,
  };
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

export function createExpenseLifecycleService(
  deps: ExpenseLifecycleServiceDeps = { repo: expenseLifecycleRepo, db: pool, runTx: withTransaction },
): ExpenseLifecycleService {
  const { repo, db, runTx } = deps;
  const idempotency = deps.idempotency ?? idempotencyStore;

  async function decide(
    scope: ResolvedScope,
    idempotencyKey: string | undefined,
    id: string,
    decision: Decision,
    reason: string | null,
  ): Promise<ExpenseResponse> {
    const key = requireIdempotencyKey(idempotencyKey);
    if (decision === 'reject' && (reason === null || reason.trim().length === 0)) {
      return failValidation({ 'body.reason': ['A reason is required to reject an expense.'] });
    }

    return runTx(async (tx) => {
      // First, before any lookup or state check: a replay answers with the stored original.
      const idem = await beginIdempotent<ExpenseResponse>(idempotency, tx, {
        actorUserId: scope.userId,
        key,
        operation: DECISION_AUDIT_CODE[decision],
        request: { expenseId: id, reason },
      });
      if (idem.replay) return idem.response;

      const current = await repo.findExpenseById(tx, scope, id);
      if (current === null) throw notFound('Expense', id);

      if (decision === 'cancel') {
        // The row is visible to this actor, so naming the rule leaks nothing: 403, not 404.
        if (current.recordedBy !== scope.userId) {
          throw new AppError('FORBIDDEN', { detail: 'Only the user who recorded an expense can cancel it.' });
        }
      } else if (current.recordedBy === scope.userId) {
        // Checked here so the caller gets a domain error, not the CHECK violation the database would raise.
        throw new AppError('SELF_APPROVAL_FORBIDDEN', {
          detail: 'You cannot approve or reject an expense you recorded yourself.',
        });
      }

      if (current.status !== 'RECORDED') {
        throw new AppError('INVALID_STATE_TRANSITION', {
          detail: `This expense is ${current.status}; a decided expense is final.`,
        });
      }

      const decided =
        decision === 'approve'
          ? await repo.markApproved(tx, id, scope.userId)
          : decision === 'reject'
            ? await repo.markRejected(tx, id, scope.userId, reason ?? '')
            : await repo.markCancelled(tx, id, scope.userId);
      if (decided === null) {
        // Another decision committed between the read and the conditional UPDATE.
        throw new AppError('INVALID_STATE_TRANSITION', { detail: 'This expense was decided by another request.' });
      }

      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: DECISION_AUDIT_CODE[decision],
        entityType: 'expense',
        entityId: decided.id,
        ...(decided.warehouseId === null ? {} : { warehouseId: decided.warehouseId }),
        before: { status: current.status },
        after: maskedExpense(decided),
        changedFields: ['status'],
      });

      await idem.complete(decided);
      return decided;
    });
  }

  return {
    approve: (scope, idempotencyKey, id) => decide(scope, idempotencyKey, id, 'approve', null),
    reject: (scope, idempotencyKey, id, body) => decide(scope, idempotencyKey, id, 'reject', body.reason),
    cancel: (scope, idempotencyKey, id) => decide(scope, idempotencyKey, id, 'cancel', null),

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
        authorizedBy:
          expense.status === 'APPROVED' && expense.decidedBy !== null && source.decidedByName !== null
            ? { id: expense.decidedBy, name: source.decidedByName }
            : null,
        decidedAt: expense.decidedAt,
        decisionReason: expense.decisionReason,
      };
    },
  };
}

export const expenseLifecycleService: ExpenseLifecycleService = createExpenseLifecycleService();
