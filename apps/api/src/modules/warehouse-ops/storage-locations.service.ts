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
 *  - Nothing here touches inventory_batches or the stock ledger: `inventory_batches.storage_location`
 *    is free text and deliberately not linked (see db/migrations/0053_storage_locations.sql).
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

/** The masked audit image: no free-text name. */
function image(location: StorageLocation): Record<string, unknown> {
  return {
    code: location.code,
    locationType: location.locationType,
    capacityKg: location.capacityKg,
    isActive: location.isActive,
  };
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
  return changed;
}

export function createStorageLocationsService(deps: Partial<StorageLocationsServiceDeps> = {}): StorageLocationsService {
  const repo = deps.repo ?? storageLocationsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));

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
        let created: StorageLocation;
        try {
          created = await repo.insert(tx, warehouseId, body);
        } catch (error) {
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

        const updated = await repo.update(tx, id, patch);
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
