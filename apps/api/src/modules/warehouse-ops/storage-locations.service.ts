/**
 * BR-79: storage locations of a warehouse.
 *
 * All business logic lives here; the service takes a `ResolvedScope`, never a Request.
 *  - Scope first: another warehouse and an unknown warehouse are the same 404 (BR-30), then the
 *    location is looked up INSIDE that warehouse, so a location id under the wrong warehouse is 404 too.
 *  - Every change writes one audit row in the same transaction. The image is masked on purpose: it
 *    carries the code, type, capacity and status but never the free-text name (BR-35); the changed
 *    field names do include `name` so the audit trail still shows that it was edited.
 *  - A change that alters nothing writes nothing and audits nothing.
 *  - Nothing here writes inventory_batches or the stock ledger. Batches are LINKED to a location at
 *    quality check (BR-125, `inventory_batches.storage_location_id`); this service only reads them, to
 *    report usage and to refuse deactivating a location that still holds stock.
 *  - BR-125 tree: a parent is a live, ACTIVE location of the same warehouse, never the location itself
 *    or one of its descendants, within `system_config.storage_location_max_depth` tiers. Hierarchy
 *    changes of one warehouse are serialised by an advisory lock (the cycle trigger takes the same
 *    one), and the parent is share-locked so it cannot be switched off under a new child. Every
 *    refusal is decided before anything is written.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { requireReachableWarehouse } from './scope.js';
import { storageLocationsRepo, type StorageLocationsRepo } from './storage-locations.repo.js';
import {
  normaliseKg,
  type CreateStorageLocationBody,
  type ListStorageLocationsQuery,
  type ListStorageLocationsResponse,
  type StorageLocation,
  type UpdateStorageLocationBody,
} from './storage-locations.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface StorageLocationsServiceDeps {
  repo: StorageLocationsRepo;
  db: Executor;
  runTx: TransactionRunner;
}

export interface StorageLocationsService {
  list(scope: ResolvedScope, warehouseId: string, query: ListStorageLocationsQuery): Promise<ListStorageLocationsResponse>;
  get(scope: ResolvedScope, warehouseId: string, id: string): Promise<StorageLocation>;
  create(scope: ResolvedScope, warehouseId: string, body: CreateStorageLocationBody): Promise<StorageLocation>;
  update(scope: ResolvedScope, warehouseId: string, id: string, patch: UpdateStorageLocationBody): Promise<StorageLocation>;
}

/** The masked audit image: no free-text name. `parentId` is the BR-125 tree position. */
function image(location: StorageLocation): Record<string, unknown> {
  return {
    code: location.code,
    locationType: location.locationType,
    capacityKg: location.capacityKg,
    isActive: location.isActive,
    parentId: location.parentId,
  };
}

function parentRefused(message: string): AppError {
  return new AppError('VALIDATION_FAILED', {
    status: 422,
    detail: 'The parent storage location cannot be used.',
    errors: { 'body.parentId': [message] },
  });
}

/** BR-125: the trigger's cycle guard (23514, hint STORAGE_LOCATION_CYCLE) as the field error it means. */
function isCycle(error: unknown): boolean {
  const pg = error as { code?: string; hint?: string };
  return pg.code === '23514' && pg.hint === 'code: STORAGE_LOCATION_CYCLE';
}

function locationNotFound(id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No storage location with id ${id} in this warehouse.` });
}

/** Names of the fields a patch would really change. */
function changedFieldNames(current: StorageLocation, patch: UpdateStorageLocationBody): string[] {
  const changed: string[] = [];
  if (patch.name !== undefined && patch.name !== current.name) changed.push('name');
  if (patch.locationType !== undefined && patch.locationType !== current.locationType) changed.push('locationType');
  if (patch.capacityKg !== undefined) {
    const next = patch.capacityKg === null ? null : normaliseKg(patch.capacityKg);
    if (next !== current.capacityKg) changed.push('capacityKg');
  }
  if (patch.isActive !== undefined && patch.isActive !== current.isActive) changed.push('isActive');
  if (patch.parentId !== undefined && patch.parentId !== current.parentId) changed.push('parentId');
  return changed;
}

export function createStorageLocationsService(deps: Partial<StorageLocationsServiceDeps> = {}): StorageLocationsService {
  const repo = deps.repo ?? storageLocationsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));

  /**
   * BR-125: refuses a parent that is unknown or of another warehouse (one message for both, BR-30),
   * inactive, the moved location itself or one of its descendants, or too deep. `movedId` is null for
   * a new location. Must run inside the caller's transaction, after `lockHierarchy`.
   */
  async function checkParent(tx: Executor, warehouseId: string, movedId: string | null, parentId: string): Promise<void> {
    if (movedId !== null && parentId === movedId) throw parentRefused('A location cannot be its own parent.');
    const facts = await repo.hierarchyFacts(tx, warehouseId, movedId, parentId);
    if (facts.parentIsActive === null || facts.parentLevel === null) {
      throw parentRefused('No storage location with that id in this warehouse.');
    }
    if (facts.parentInSubtree) throw parentRefused('A location cannot be placed under one of its own descendants.');
    if (!facts.parentIsActive) throw parentRefused('The parent location is not active.');
    const maxDepth = await repo.maxDepth(tx);
    // Levels run 0 .. maxDepth - 1; the deepest node of the moved subtree lands on
    // parentLevel + 1 + subtreeHeight.
    if (facts.parentLevel + 1 + facts.subtreeHeight > maxDepth - 1) {
      throw parentRefused(`A warehouse's storage locations are at most ${maxDepth} levels deep.`);
    }
  }

  return {
    async list(scope, warehouseId, query) {
      await requireReachableWarehouse(db, scope, warehouseId);
      const { items, total } = await repo.list(db, warehouseId, query);
      return { items, page: query.page, pageSize: query.pageSize, total };
    },

    async get(scope, warehouseId, id) {
      await requireReachableWarehouse(db, scope, warehouseId);
      const location = await repo.findById(db, warehouseId, id);
      if (location === null) throw locationNotFound(id);
      return location;
    },

    async create(scope, warehouseId, body) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, warehouseId);
        if (body.parentId !== undefined) {
          await repo.lockHierarchy(tx, warehouseId);
          await checkParent(tx, warehouseId, null, body.parentId);
        }
        let created: StorageLocation;
        try {
          created = await repo.insert(tx, warehouseId, body);
        } catch (error) {
          if (isCycle(error)) throw parentRefused('A location cannot be placed under one of its own descendants.');
          if (isCodeTaken(error)) {
            throw new AppError('CONFLICT', {
              detail: 'This warehouse already has a storage location with that code.',
              errors: { 'body.code': ['Already used in this warehouse (codes are case-insensitive).'] },
            });
          }
          throw error;
        }
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.storage_location.create',
          entityType: 'storage_location',
          entityId: created.id,
          warehouseId,
          after: image(created),
        });
        return created;
      });
    },

    async update(scope, warehouseId, id, patch) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, warehouseId);
        const current = await repo.lockById(tx, warehouseId, id);
        if (current === null) throw locationNotFound(id);

        const changed = changedFieldNames(current, patch);
        if (changed.length === 0) return current;

        // BR-125: validate the new parent (422) before any state check (409).
        const parentChanges = changed.includes('parentId');
        if (parentChanges) {
          await repo.lockHierarchy(tx, warehouseId);
          if (patch.parentId !== null && patch.parentId !== undefined) {
            await checkParent(tx, warehouseId, id, patch.parentId);
          }
        }
        if (changed.includes('isActive') && patch.isActive === false) {
          const usage = await repo.usage(tx, warehouseId, id);
          if (usage.activeChildCount > 0 || usage.batchCount > 0) {
            throw new AppError('CONFLICT', {
              detail: 'A storage location that holds stock or has active locations under it cannot be deactivated.',
              meta: { activeChildCount: usage.activeChildCount, batchCount: usage.batchCount },
            });
          }
        }
        if (changed.includes('isActive') && patch.isActive === true && !parentChanges) {
          if ((await repo.parentIsActive(tx, id)) === false) {
            throw new AppError('CONFLICT', {
              detail: 'A storage location cannot be reactivated while its parent location is inactive.',
            });
          }
        }

        let updated: StorageLocation;
        try {
          updated = await repo.update(tx, warehouseId, id, patch);
        } catch (error) {
          if (isCycle(error)) throw parentRefused('A location cannot be placed under one of its own descendants.');
          throw error;
        }
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'warehouse.storage_location.update',
          entityType: 'storage_location',
          entityId: id,
          warehouseId,
          before: image(current),
          after: image(updated),
          changedFields: changed,
        });
        return updated;
      });
    },
  };
}

function isCodeTaken(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === '23505' &&
    (error as { constraint?: unknown }).constraint === 'uq_storage_locations_code'
  );
}

export const storageLocationsService: StorageLocationsService = createStorageLocationsService();
