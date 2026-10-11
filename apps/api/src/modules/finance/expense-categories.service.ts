/**
 * Module 11 (Warehouse Finance), BR-73: expense category writes (create, rename, deactivate,
 * reactivate) and the management list. Permission `finance.expense_category.manage` (SA / TA).
 *
 * UNCONFIRMED DEFAULT (owner approval pending): categories are not deletable, names are unique
 * case-insensitively, and a no-op update is a 200 that writes no audit row. These writes are not
 * money-moving, so no Idempotency-Key is required: a repeated create is refused by the unique name.
 */
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { expenseCategoriesRepo, type ExpenseCategoriesRepo, type ExpenseCategoryAdminRecord } from './expense-categories.repo.js';
import type {
  CreateExpenseCategoryBody,
  ExpenseCategoryAdminResponse,
  ListExpenseCategoriesAdminResponse,
  ManageCategoriesQuery,
  UpdateExpenseCategoryBody,
} from './finance.schema.js';
import { notFound } from './finance.shared.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface ExpenseCategoriesServiceDeps {
  repo: ExpenseCategoriesRepo;
  db: Executor;
  runTx: TransactionRunner;
}

export interface ExpenseCategoriesService {
  list(query: ManageCategoriesQuery): Promise<ListExpenseCategoriesAdminResponse>;
  create(scope: ResolvedScope, body: CreateExpenseCategoryBody): Promise<ExpenseCategoryAdminResponse>;
  update(scope: ResolvedScope, id: string, body: UpdateExpenseCategoryBody): Promise<ExpenseCategoryAdminResponse>;
}

const AUDIT_CODE = 'finance.expense_category.manage';

/** A category name is not personal data, so the audit image can carry it; the expense count is a derived figure and is left out. */
function auditImage(category: ExpenseCategoryAdminRecord): Record<string, unknown> {
  return { id: category.id, name: category.name, isActive: category.isActive };
}

function nameTaken(name: string): AppError {
  return new AppError('CONFLICT', { detail: `An expense category named "${name}" already exists (names are compared ignoring case).` });
}

export function createExpenseCategoriesService(
  deps: ExpenseCategoriesServiceDeps = { repo: expenseCategoriesRepo, db: pool, runTx: withTransaction },
): ExpenseCategoriesService {
  const { repo, db, runTx } = deps;

  return {
    async list(query) {
      return { items: await repo.list(db, query.status) };
    },

    async create(scope, body) {
      return runTx(async (tx) => {
        if ((await repo.findOtherByName(tx, body.name, null)) !== null) throw nameTaken(body.name);
        const created = await repo.insert(tx, body.name);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: AUDIT_CODE,
          entityType: 'expense_category',
          entityId: created.id,
          after: auditImage(created),
        });
        return created;
      });
    },

    async update(scope, id, body) {
      return runTx(async (tx) => {
        const current = await repo.findById(tx, id);
        if (current === null) throw notFound('Expense category', id);

        const nameChanges = body.name !== undefined && body.name !== current.name;
        const activeChanges = body.isActive !== undefined && body.isActive !== current.isActive;
        if (!nameChanges && !activeChanges) return current;

        if (nameChanges && body.name !== undefined && (await repo.findOtherByName(tx, body.name, id)) !== null) {
          throw nameTaken(body.name);
        }
        const updated = await repo.update(tx, id, {
          name: nameChanges ? body.name : undefined,
          isActive: activeChanges ? body.isActive : undefined,
        });
        if (updated === null) throw notFound('Expense category', id);

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: AUDIT_CODE,
          entityType: 'expense_category',
          entityId: id,
          before: auditImage(current),
          after: auditImage(updated),
          changedFields: [...(nameChanges ? ['name'] : []), ...(activeChanges ? ['isActive'] : [])],
        });
        return updated;
      });
    },
  };
}

export const expenseCategoriesService: ExpenseCategoriesService = createExpenseCategoriesService();
