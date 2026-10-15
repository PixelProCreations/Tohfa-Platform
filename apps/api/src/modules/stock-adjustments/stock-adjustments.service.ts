/**
 * BR-37: manual stock adjustments (and BR-30 warehouse scope).
 *
 * All business logic lives here; the service takes a `ResolvedScope`, never a Request.
 *
 *  - Scope. A scope that carries assigned warehouses is confined to them even under an `all` grant
 *    (`confineToAssignedWarehouses`). A list outside the scope is an empty page, a single row
 *    outside it is the same 404 as an unknown id; never 403 (requirePermission.ts explains why).
 *  - Creating an adjustment moves NO stock: it is a PENDING request (BR-37b).
 *  - Deciding one needs `inventory.stock_adjustment.approve` (a Sub admin holds `none`, so it never
 *    reaches here) and is refused to the adjustment's own creator: 403 SELF_APPROVAL_FORBIDDEN
 *    (BR-37a; also DB CHECKs). That is a fact about the ROW, not about a role, which is why it is
 *    checked here and not in rbac.json.
 *  - Approval moves the stock by INSERTING one ADJUSTMENT row into stock_ledger through the
 *    inventory service, in the SAME transaction as the status change and the audit row (BR-37b).
 *    The ledger trigger maintains the batch balance and refuses a negative one, which surfaces as
 *    409 STOCK_UNAVAILABLE and rolls the whole approval back.
 *  - Idempotency. Create and approve claim the Idempotency-Key in the same transaction as their
 *    writes, so a replay returns the stored response and writes nothing twice.
 *  - Audit. One row per state change, same transaction, masked: ids, type, signed quantity, status
 *    and the ledger row; never the free-text reason or rejection reason (free text can carry names
 *    and phone numbers, BR-35).
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { beginIdempotent, idempotencyStore, requireIdempotencyKey, type IdempotencyStore } from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import type { RecordMovementInput, StockLedgerEntryView } from '../inventory/inventory.schema.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { confineToAssignedWarehouses, visibleWarehouseIds } from '../warehouse-ops/scope.js';
import { stockAdjustmentsRepo, type StockAdjustmentsRepo } from './stock-adjustments.repo.js';
import {
  signedKgToGrams,
  type CreateAdjustmentBody,
  type ListAdjustmentsQuery,
  type ListAdjustmentsResponse,
  type RejectAdjustmentBody,
  type StockAdjustment,
} from './stock-adjustments.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** The one ledger writer (inventory service). Injected so unit tests can observe the insert. */
export interface LedgerWriter {
  recordMovement(
    actor: { userId: string },
    scope: ResolvedScope,
    input: RecordMovementInput,
    tx?: Executor,
  ): Promise<StockLedgerEntryView>;
}

export interface StockAdjustmentsServiceDeps {
  repo: StockAdjustmentsRepo;
  db: Executor;
  runTx: TransactionRunner;
  idempotency: IdempotencyStore;
  ledger: LedgerWriter;
}

export interface StockAdjustmentsService {
  list(scope: ResolvedScope, query: ListAdjustmentsQuery): Promise<ListAdjustmentsResponse>;
  get(scope: ResolvedScope, id: string): Promise<StockAdjustment>;
  create(
    scope: ResolvedScope,
    rawKey: string | undefined,
    body: CreateAdjustmentBody,
  ): Promise<{ adjustment: StockAdjustment; replayed: boolean }>;
  /**
   * Creates a PENDING adjustment inside the caller's transaction (no idempotency claim of its own).
   * Used by `create` and by the BR-106 stock verification, which raises a COUNT_CORRECTION.
   */
  createInTransaction(tx: Executor, scope: ResolvedScope, body: CreateAdjustmentBody): Promise<StockAdjustment>;
  approve(scope: ResolvedScope, id: string, rawKey: string | undefined): Promise<StockAdjustment>;
  reject(scope: ResolvedScope, id: string, body: RejectAdjustmentBody): Promise<StockAdjustment>;
}

const OPERATION = {
  create: 'stock-adjustment.create',
  approve: 'stock-adjustment.approve',
} as const;

const ENTITY_TYPE = 'stock_adjustment';

/** stock_ledger.ref_type for an approved adjustment (docs/openapi.yaml StockLedgerEntry example). */
export const ADJUSTMENT_LEDGER_REF_TYPE = 'stock_adjustment';

function adjustmentNotFound(id: string): AppError {
  // One body for "no such adjustment" and "an adjustment of another warehouse" (BR-30).
  return new AppError('NOT_FOUND', { detail: `No stock adjustment with id ${id} is visible to you.` });
}

function batchNotFound(id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No batch with id ${id} is visible to you.` });
}

function invalidTransition(from: string, action: string): AppError {
  return new AppError('INVALID_STATE_TRANSITION', {
    detail: `A ${from} stock adjustment cannot be ${action}; only a PENDING one can.`,
    meta: { status: from },
  });
}

/** The masked audit image: never the reason or the rejection reason. */
function image(a: StockAdjustment): Record<string, unknown> {
  return {
    batchId: a.batchId,
    warehouseId: a.warehouseId,
    adjustmentType: a.adjustmentType,
    qtyDeltaKg: a.qtyDeltaKg,
    status: a.status,
    ledgerEntryId: a.ledgerEntryId,
  };
}

export function createStockAdjustmentsService(deps: Partial<StockAdjustmentsServiceDeps> = {}): StockAdjustmentsService {
  const repo = deps.repo ?? stockAdjustmentsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));
  const idempotency = deps.idempotency ?? idempotencyStore;
  const ledger: LedgerWriter = deps.ledger ?? inventoryService;

  async function reload(tx: Executor, id: string): Promise<StockAdjustment> {
    const adjustment = await repo.findAdjustment(tx, id);
    if (adjustment === null) throw new Error(`stock adjustment ${id} vanished inside its own transaction`);
    return adjustment;
  }

  /** Loads and row-locks a PENDING adjustment the scope may see and the actor did not raise. */
  async function lockDecidable(tx: Executor, scope: ResolvedScope, id: string, action: string): Promise<StockAdjustment> {
    const current = await repo.lockAdjustment(tx, id);
    if (current === null || !warehouseVisible(confineToAssignedWarehouses(scope), current.warehouseId)) {
      throw adjustmentNotFound(id);
    }
    if (current.status !== 'PENDING') throw invalidTransition(current.status, action);
    // BR-37a: the person who loses the stock does not write it off. Also DB CHECKs
    // (stock_adjustments_no_self_approval_chk / _no_self_rejection_chk); refused here first for a clean 403.
    if (current.createdBy === scope.userId) {
      throw new AppError('SELF_APPROVAL_FORBIDDEN', {
        detail: `A stock adjustment cannot be ${action} by the admin who raised it (BR-37a).`,
      });
    }
    return current;
  }

  async function createInTransaction(tx: Executor, scope: ResolvedScope, body: CreateAdjustmentBody): Promise<StockAdjustment> {
    const batch = await repo.findBatch(tx, body.batchId);
    // BR-30: a batch in a warehouse the scope cannot reach is indistinguishable from an unknown one.
    if (batch === null || !warehouseVisible(confineToAssignedWarehouses(scope), batch.warehouseId)) {
      throw batchNotFound(body.batchId);
    }
    // A removal larger than the balance could never be approved: refuse it now (the ledger
    // trigger re-checks at approval, when the balance may have moved).
    const delta = signedKgToGrams(body.qtyDeltaKg);
    if (delta < 0 && -delta > signedKgToGrams(batch.qtyAvailableKg)) {
      throw new AppError('STOCK_UNAVAILABLE', {
        detail: `The batch holds ${batch.qtyAvailableKg} kg; an adjustment cannot remove more than that.`,
        meta: { batchIds: [batch.id] },
      });
    }

    const id = await repo.insertAdjustment(tx, {
      batchId: batch.id,
      warehouseId: batch.warehouseId,
      adjustmentType: body.adjustmentType,
      qtyDeltaKg: body.qtyDeltaKg,
      reason: body.reason,
      createdBy: scope.userId,
    });
    const adjustment = await reload(tx, id);
    await writeAuditLog(tx, {
      actorId: scope.userId,
      actorRole: scope.roleCode,
      actionCode: 'inventory.stock_adjustment.create',
      entityType: ENTITY_TYPE,
      entityId: id,
      warehouseId: adjustment.warehouseId,
      after: image(adjustment),
    });
    return adjustment;
  }

  return {
    async list(scope, query) {
      const visible = visibleWarehouseIds(confineToAssignedWarehouses(scope));
      // Cross-scope reads are an empty page, never 403 (BR-30).
      if (query.warehouseId !== undefined && visible !== null && !visible.includes(query.warehouseId)) {
        return { items: [], page: query.page, pageSize: query.pageSize, total: 0 };
      }
      const { items, total } = await repo.list(db, query, visible);
      return { items, page: query.page, pageSize: query.pageSize, total };
    },

    async get(scope, id) {
      const adjustment = await repo.findAdjustment(db, id);
      if (adjustment === null || !warehouseVisible(confineToAssignedWarehouses(scope), adjustment.warehouseId)) {
        throw adjustmentNotFound(id);
      }
      return adjustment;
    },

    async create(scope, rawKey, body) {
      const key = requireIdempotencyKey(rawKey);
      return runTx(async (tx) => {
        const idem = await beginIdempotent<StockAdjustment>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: OPERATION.create,
          request: body,
        });
        if (idem.replay) return { adjustment: idem.response, replayed: true };

        const adjustment = await createInTransaction(tx, scope, body);
        await idem.complete(adjustment);
        return { adjustment, replayed: false };
      });
    },

    createInTransaction,

    async approve(scope, id, rawKey) {
      const key = requireIdempotencyKey(rawKey);
      return runTx(async (tx) => {
        const idem = await beginIdempotent<StockAdjustment>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: OPERATION.approve,
          request: { id },
        });
        if (idem.replay) return idem.response;

        const current = await lockDecidable(tx, scope, id, 'approved');

        // BR-37b: the quantity moves only by this INSERT; the trigger maintains qty_available.
        const entry = await ledger.recordMovement(
          { userId: scope.userId },
          scope,
          {
            batchId: current.batchId,
            warehouseId: current.warehouseId,
            movementType: 'ADJUSTMENT',
            qtyDeltaKg: current.qtyDeltaKg,
            refType: ADJUSTMENT_LEDGER_REF_TYPE,
            refId: current.id,
            remarks: `Stock adjustment (${current.adjustmentType})`,
            performedBy: scope.userId,
          },
          tx,
        );
        await repo.markApproved(tx, id, { approvedBy: scope.userId, ledgerEntryId: entry.id });

        const adjustment = await reload(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'inventory.stock_adjustment.approve',
          entityType: ENTITY_TYPE,
          entityId: id,
          warehouseId: adjustment.warehouseId,
          before: image(current),
          after: image(adjustment),
          changedFields: ['status', 'approvedBy', 'approvedAt', 'ledgerEntryId'],
        });
        await idem.complete(adjustment);
        return adjustment;
      });
    },

    async reject(scope, id, body) {
      return runTx(async (tx) => {
        const current = await lockDecidable(tx, scope, id, 'rejected');
        await repo.markRejected(tx, id, { rejectedBy: scope.userId, reason: body.reason });
        const adjustment = await reload(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'inventory.stock_adjustment.reject',
          entityType: ENTITY_TYPE,
          entityId: id,
          warehouseId: adjustment.warehouseId,
          before: image(current),
          after: image(adjustment),
          changedFields: ['status', 'rejectedBy', 'rejectedAt', 'rejectionReason'],
        });
        return adjustment;
      });
    },
  };
}

export const stockAdjustmentsService: StockAdjustmentsService = createStockAdjustmentsService();
