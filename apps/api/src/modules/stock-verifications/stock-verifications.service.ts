/**
 * BR-106: physical stock verification (count vs system), and its hand-off to BR-37.
 *
 * All business logic lives here; the service takes a `ResolvedScope`, never a Request.
 *
 *  - A count NEVER edits the ledger. Recording one snapshots the batch's ledger-derived balance
 *    (`system_qty`, read under a share lock) next to the physical figure; the database generates
 *    the variance. A count equal to the system figure has nothing to reconcile and is RECONCILED at
 *    once; any other count is RECORDED.
 *  - A non-zero variance reaches the ledger only as a COUNT_CORRECTION stock adjustment of exactly
 *    the variance, raised here and created by the stock-adjustments service in the SAME transaction.
 *    It is PENDING and needs someone other than its raiser to approve it (BR-37a/b). Raising links
 *    it (`adjustment_id`) and marks the count RECONCILED: the variance is now in the adjustment
 *    workflow. DISPUTED is a legal status of the table but nothing in this API writes it yet.
 *  - Scope. Confined to assigned warehouses even under an `all` grant; a batch or a count outside
 *    the scope is the same 404 as an unknown id, a list outside it an empty page (BR-30).
 *  - Idempotency. Recording and raising claim the Idempotency-Key in the same transaction as
 *    their writes, so a retried count is recorded once.
 *  - Audit. One row per change, same transaction, masked: never the free-text notes (BR-35).
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { beginIdempotent, idempotencyStore, requireIdempotencyKey, type IdempotencyStore } from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import { signedKgToGrams } from '../stock-adjustments/stock-adjustments.schema.js';
import { stockAdjustmentsService, type StockAdjustmentsService } from '../stock-adjustments/stock-adjustments.service.js';
import { confineToAssignedWarehouses, visibleWarehouseIds } from '../warehouse-ops/scope.js';
import { stockVerificationsRepo, type StockVerificationsRepo } from './stock-verifications.repo.js';
import type {
  CreateVerificationBody,
  ListVerificationsQuery,
  ListVerificationsResponse,
  RaiseAdjustmentBody,
  RaisedAdjustment,
  StockVerification,
} from './stock-verifications.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface StockVerificationsServiceDeps {
  repo: StockVerificationsRepo;
  db: Executor;
  runTx: TransactionRunner;
  idempotency: IdempotencyStore;
  adjustments: Pick<StockAdjustmentsService, 'createInTransaction'>;
}

export interface StockVerificationsService {
  list(scope: ResolvedScope, query: ListVerificationsQuery): Promise<ListVerificationsResponse>;
  get(scope: ResolvedScope, id: string): Promise<StockVerification>;
  create(
    scope: ResolvedScope,
    rawKey: string | undefined,
    body: CreateVerificationBody,
  ): Promise<{ verification: StockVerification; replayed: boolean }>;
  raiseAdjustment(
    scope: ResolvedScope,
    id: string,
    rawKey: string | undefined,
    body: RaiseAdjustmentBody,
  ): Promise<RaisedAdjustment>;
}

const OPERATION = {
  create: 'stock-verification.create',
  raise: 'stock-verification.raise-adjustment',
} as const;

const ENTITY_TYPE = 'stock_verification';

function verificationNotFound(id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No stock verification with id ${id} is visible to you.` });
}

function batchNotFound(id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No batch with id ${id} is visible to you.` });
}

/** The masked audit image: never the notes. */
function image(v: StockVerification): Record<string, unknown> {
  return {
    batchId: v.batchId,
    warehouseId: v.warehouseId,
    systemQtyKg: v.systemQtyKg,
    countedQtyKg: v.countedQtyKg,
    varianceKg: v.varianceKg,
    status: v.status,
    adjustmentId: v.adjustmentId,
  };
}

export function createStockVerificationsService(deps: Partial<StockVerificationsServiceDeps> = {}): StockVerificationsService {
  const repo = deps.repo ?? stockVerificationsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));
  const idempotency = deps.idempotency ?? idempotencyStore;
  const adjustments = deps.adjustments ?? stockAdjustmentsService;

  async function reload(tx: Executor, id: string): Promise<StockVerification> {
    const verification = await repo.findVerification(tx, id);
    if (verification === null) throw new Error(`stock verification ${id} vanished inside its own transaction`);
    return verification;
  }

  return {
    async list(scope, query) {
      const visible = visibleWarehouseIds(confineToAssignedWarehouses(scope));
      if (query.warehouseId !== undefined && visible !== null && !visible.includes(query.warehouseId)) {
        return { items: [], page: query.page, pageSize: query.pageSize, total: 0 };
      }
      const { items, total } = await repo.list(db, query, visible);
      return { items, page: query.page, pageSize: query.pageSize, total };
    },

    async get(scope, id) {
      const verification = await repo.findVerification(db, id);
      if (verification === null || !warehouseVisible(confineToAssignedWarehouses(scope), verification.warehouseId)) {
        throw verificationNotFound(id);
      }
      return verification;
    },

    async create(scope, rawKey, body) {
      const key = requireIdempotencyKey(rawKey);
      return runTx(async (tx) => {
        const idem = await beginIdempotent<StockVerification>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: OPERATION.create,
          request: body,
        });
        if (idem.replay) return { verification: idem.response, replayed: true };

        const batch = await repo.lockBatchForCount(tx, body.batchId);
        if (batch === null || !warehouseVisible(confineToAssignedWarehouses(scope), batch.warehouseId)) {
          throw batchNotFound(body.batchId);
        }
        const matches = signedKgToGrams(body.countedQtyKg) === signedKgToGrams(batch.qtyAvailableKg);
        const id = await repo.insertVerification(tx, {
          warehouseId: batch.warehouseId,
          batchId: batch.id,
          systemQtyKg: batch.qtyAvailableKg,
          countedQtyKg: body.countedQtyKg,
          status: matches ? 'RECONCILED' : 'RECORDED',
          notes: body.notes ?? null,
          verifiedBy: scope.userId,
        });
        const verification = await reload(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'inventory.stock_verification.perform',
          entityType: ENTITY_TYPE,
          entityId: id,
          warehouseId: verification.warehouseId,
          after: image(verification),
        });
        await idem.complete(verification);
        return { verification, replayed: false };
      });
    },

    async raiseAdjustment(scope, id, rawKey, body) {
      const key = requireIdempotencyKey(rawKey);
      return runTx(async (tx) => {
        const idem = await beginIdempotent<RaisedAdjustment>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: OPERATION.raise,
          request: { id, body },
        });
        if (idem.replay) return idem.response;

        const current = await repo.lockVerification(tx, id);
        if (current === null || !warehouseVisible(confineToAssignedWarehouses(scope), current.warehouseId)) {
          throw verificationNotFound(id);
        }
        const variance = signedKgToGrams(current.varianceKg);
        if (current.status !== 'RECORDED' || current.adjustmentId !== null || variance === 0) {
          throw new AppError('INVALID_STATE_TRANSITION', {
            detail:
              variance === 0
                ? 'This count matches the system figure; there is no variance to adjust.'
                : `A ${current.status} count${current.adjustmentId === null ? '' : ' that already has an adjustment'} cannot raise one; only a RECORDED count with a variance can.`,
            meta: { status: current.status },
          });
        }

        const adjustment = await adjustments.createInTransaction(tx, scope, {
          batchId: current.batchId,
          adjustmentType: 'COUNT_CORRECTION',
          qtyDeltaKg: current.varianceKg,
          reason:
            body.reason ??
            `Stock verification ${current.id}: counted ${current.countedQtyKg} kg against ${current.systemQtyKg} kg in the system.`,
        });
        await repo.linkAdjustment(tx, id, adjustment.id);

        const verification = await reload(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'inventory.stock_verification.reconcile',
          entityType: ENTITY_TYPE,
          entityId: id,
          warehouseId: verification.warehouseId,
          before: image(current),
          after: image(verification),
          changedFields: ['status', 'adjustmentId'],
        });
        const result: RaisedAdjustment = { verification, adjustment: { ...adjustment, verificationId: id } };
        await idem.complete(result);
        return result;
      });
    },
  };
}

export const stockVerificationsService: StockVerificationsService = createStockVerificationsService();
