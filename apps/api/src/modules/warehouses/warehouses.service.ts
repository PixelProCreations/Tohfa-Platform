/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * <name>.service.ts holds the business logic and is the ONLY layer that makes
 * authorization decisions beyond "does the actor hold this permission".
 * Rules:
 *  - Take the `ResolvedScope` produced by `requirePermission`, never a Request.
 *    That keeps the service callable from a job, a script or a test.
 *  - Translate the scope into a SQL filter with `scopedWhere` and hand it to
 *    the repo. Cross-scope rows come back EMPTY, never 403 — see
 *    requirePermission.ts for why.
 *  - Evaluate `conditional` predicates with `assertPredicate` after loading the
 *    target row and before any state change.
 *  - Wrap multi-statement writes in `withTransaction` and write the audit row
 *    with the same client.
 *  - Throw `AppError` with a domain `ErrorCode`; never return an error shape.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import { warehousesRepo, type WarehousesRepo } from './warehouses.repo.js';
import type {
  ListWarehousesQuery,
  ListWarehousesResponse,
  UpdateCapacityBody,
  WarehouseCapacityView,
  WarehouseDetail,
} from './warehouses.schema.js';

/** Runs `fn` in one transaction. Injectable so tests can roll everything back. */
export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface WarehousesServiceDeps {
  repo: WarehousesRepo;
  db: Executor;
  transaction: TransactionRunner;
}

/**
 * Dependencies are injected with defaults. Production code calls
 * `warehousesService`; tests call `createWarehousesService({ repo: fake })`.
 */
export function createWarehousesService(
  deps: Partial<WarehousesServiceDeps> = {},
): WarehousesService {
  const repo = deps.repo ?? warehousesRepo;
  const db = deps.db ?? pool;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));

  function notFound(id: string): AppError {
    // 404 rather than 403 when the row exists but is out of scope: a 403 would
    // confirm the row's existence to an actor who is not allowed to know. The
    // detail is identical for "unknown" and "not yours" for the same reason.
    return new AppError('NOT_FOUND', { detail: `No warehouse with id ${id} is visible to you.` });
  }

  return {
    async list(scope, filters): Promise<ListWarehousesResponse> {
      // `w.id` is the warehouse column for this table; a Sub Warehouse Admin is
      // therefore confined to the row for their own warehouse.
      const scopeFilter = scopedWhere(scope, { warehouseColumn: 'w.id', startIndex: 1 });

      const { items, total } = await repo.list(db, { filters, scope: scopeFilter });

      return {
        items,
        page: filters.page,
        pageSize: filters.pageSize,
        total,
      };
    },

    async getById(scope, id): Promise<WarehouseDetail> {
      const scopeFilter = scopedWhere(scope, { warehouseColumn: 'w.id', startIndex: 2 });
      const warehouse = await repo.findById(db, id, scopeFilter);

      if (warehouse === null) throw notFound(id);

      return warehouse;
    },

    async getCapacity(scope, id): Promise<WarehouseCapacityView> {
      const scopeFilter = scopedWhere(scope, { warehouseColumn: 'w.id', startIndex: 2 });
      const capacity = await repo.findCapacity(db, id, scopeFilter);

      if (capacity === null) throw notFound(id);

      // BR-131: read after the scope check, so an invisible warehouse reads nothing more.
      return { ...capacity, thresholdPercent: await repo.capacityThresholdPercent(db) };
    },

    async setCapacity(scope, id, body): Promise<WarehouseCapacityView> {
      const scopeFilter = scopedWhere(scope, { warehouseColumn: 'w.id', startIndex: 2 });

      // BR-66: the audit row shares the transaction with the change, and the
      // images carry `capacityKg` only. The capacity is deliberately NOT
      // compared with current stock (not specified; open owner question), and
      // nothing here writes to inventory_batches or stock_ledger.
      return transaction(async (tx) => {
        const current = await repo.lockCapacity(tx, id, scopeFilter);
        if (current === null) throw notFound(id);

        const stored = await repo.setCapacity(tx, id, body.capacityKg);
        const before = { capacityKg: current.capacityKg };
        const after = { capacityKg: stored };

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.capacity.set',
          entityType: 'warehouse',
          entityId: id,
          warehouseId: id,
          before,
          after,
          changedFields: changedFields(before, after),
        });

        const capacity = await repo.findCapacity(tx, id, scopeFilter);
        if (capacity === null) throw notFound(id);
        return { ...capacity, thresholdPercent: await repo.capacityThresholdPercent(tx) };
      });
    },
  };
}

export interface WarehousesService {
  list(scope: ResolvedScope, filters: ListWarehousesQuery): Promise<ListWarehousesResponse>;
  getById(scope: ResolvedScope, id: string): Promise<WarehouseDetail>;
  getCapacity(scope: ResolvedScope, id: string): Promise<WarehouseCapacityView>;
  setCapacity(
    scope: ResolvedScope,
    id: string,
    body: UpdateCapacityBody,
  ): Promise<WarehouseCapacityView>;
}

/** The production instance. */
export const warehousesService: WarehousesService = createWarehousesService();
