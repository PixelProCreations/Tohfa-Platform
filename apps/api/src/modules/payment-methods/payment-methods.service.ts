import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  paymentMethodsRepo,
  type PaymentMethodsRepo,
} from './payment-methods.repo.js';
import type {
  CreatePaymentMethodInput,
  ListPaymentMethodsQuery,
  PaymentMethodResponse,
  UpdatePaymentMethodInput,
} from './payment-methods.schema.js';

export interface PaymentMethodsServiceDeps {
  repo: PaymentMethodsRepo;
  db: Executor;
  runTx: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;
}

export interface PaymentMethodsService {
  create(scope: ResolvedScope, input: CreatePaymentMethodInput): Promise<PaymentMethodResponse>;
  update(scope: ResolvedScope, id: string, patch: UpdatePaymentMethodInput): Promise<PaymentMethodResponse>;
  getById(scope: ResolvedScope, id: string): Promise<PaymentMethodResponse>;
  list(scope: ResolvedScope, query?: ListPaymentMethodsQuery): Promise<PaymentMethodResponse[]>;
  deactivate(scope: ResolvedScope, id: string): Promise<PaymentMethodResponse>;
}

export function createPaymentMethodsService(
  deps: Partial<PaymentMethodsServiceDeps> = {},
): PaymentMethodsService {
  const repo = deps.repo ?? paymentMethodsRepo;
  const db = deps.db ?? pool;
  const runTx = deps.runTx ?? withTransaction;

  return {
    async create(scope, input) {
      return runTx(async (tx) => {
        if (input.isDefault) {
          await repo.unsetDefaultExcept(tx);
        }

        const res = await repo.create(tx, input);

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'payment_method.create',
          entityType: 'payment_method',
          entityId: res.id,
          after: res,
        });

        return res;
      });
    },

    async update(scope, id, patch) {
      const existing = await repo.findById(db, id);
      if (!existing) {
        throw new AppError('NOT_FOUND', { detail: `Payment method ${id} not found` });
      }

      return runTx(async (tx) => {
        if (patch.isDefault) {
          await repo.unsetDefaultExcept(tx, id);
        }

        const updated = await repo.update(tx, id, patch);
        if (!updated) {
          throw new AppError('NOT_FOUND', { detail: `Payment method ${id} not found` });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'payment_method.update',
          entityType: 'payment_method',
          entityId: id,
          before: existing,
          after: updated,
        });

        return updated;
      });
    },

    async getById(_scope, id) {
      const existing = await repo.findById(db, id);
      if (!existing) {
        throw new AppError('NOT_FOUND', { detail: `Payment method ${id} not found` });
      }
      return existing;
    },

    async list(_scope, query) {
      return repo.list(db, query);
    },

    async deactivate(scope, id) {
      const existing = await repo.findById(db, id);
      if (!existing) {
        throw new AppError('NOT_FOUND', { detail: `Payment method ${id} not found` });
      }

      return runTx(async (tx) => {
        const deactivated = await repo.deactivate(tx, id);
        if (!deactivated) {
          throw new AppError('NOT_FOUND', { detail: `Payment method ${id} not found` });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'payment_method.deactivate',
          entityType: 'payment_method',
          entityId: id,
          before: existing,
          after: deactivated,
        });

        return deactivated;
      });
    },
  };
}

export const paymentMethodsService = createPaymentMethodsService();
