/**
 * BR-80: warehouse profile writes (contact phone and operating hours only).
 *
 *  - Scope first, then the row lock: another or an unknown warehouse is the same 404 (BR-30).
 *  - One audit row in the same transaction. The image is masked: it only says whether a phone and
 *    hours are SET, never their values; `changedFields` carries the real names of what changed.
 *  - A request that changes nothing writes nothing and audits nothing.
 *  - Capacity is deliberately not editable here: it stays on `warehouse.capacity.set` (BR-66).
 */
import { isDeepStrictEqual } from 'node:util';
import type { Executor } from '../../db/pool.js';
import { withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type { WarehouseDetail } from '../warehouses/warehouses.schema.js';
import { warehouseNotFound, requireReachableWarehouse } from './scope.js';
import { warehouseProfileRepo, type ProfilePatch, type ProfileRow, type WarehouseProfileRepo } from './warehouse-profile.repo.js';
import type { UpdateWarehouseProfileBody } from './warehouse-profile.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface WarehouseProfileServiceDeps {
  repo: WarehouseProfileRepo;
  runTx: TransactionRunner;
}

export interface WarehouseProfileService {
  update(scope: ResolvedScope, id: string, body: UpdateWarehouseProfileBody): Promise<WarehouseDetail>;
}

const maskedImage = (row: ProfileRow | { contactPhone: string | null; operatingHours: unknown }): Record<string, unknown> => ({
  contactPhoneSet: row.contactPhone !== null,
  operatingHoursSet: row.operatingHours !== null,
});

function changedFieldNames(current: ProfileRow, patch: ProfilePatch): string[] {
  const changed: string[] = [];
  if (patch.contactPhone !== undefined && patch.contactPhone !== current.contactPhone) changed.push('contactPhone');
  // jsonb does not keep key order, so hours are compared structurally, not as text.
  if (patch.operatingHours !== undefined && !isDeepStrictEqual(patch.operatingHours, current.operatingHours)) {
    changed.push('operatingHours');
  }
  return changed;
}

export function createWarehouseProfileService(deps: Partial<WarehouseProfileServiceDeps> = {}): WarehouseProfileService {
  const repo = deps.repo ?? warehouseProfileRepo;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));

  return {
    async update(scope, id, body) {
      return runTx(async (tx) => {
        await requireReachableWarehouse(tx, scope, id);
        const current = await repo.lock(tx, id);
        if (current === null) throw warehouseNotFound(id);

        const patch: ProfilePatch = {};
        if (body.contactPhone !== undefined) patch.contactPhone = body.contactPhone;
        if (body.operatingHours !== undefined) patch.operatingHours = body.operatingHours;

        const changed = changedFieldNames(current, patch);
        if (changed.length > 0) {
          await repo.update(tx, id, patch);
          const after: ProfileRow = {
            contactPhone: patch.contactPhone === undefined ? current.contactPhone : patch.contactPhone,
            operatingHours: patch.operatingHours === undefined ? current.operatingHours : patch.operatingHours,
          };
          await writeAuditLog(tx, {
            actorId: scope.userId,
            actorRole: scope.roleCode,
            actionCode: 'warehouse.profile.edit',
            entityType: 'warehouse',
            entityId: id,
            warehouseId: id,
            before: maskedImage(current),
            after: maskedImage(after),
            changedFields: changed,
          });
        }

        const detail = await repo.findDetail(tx, id);
        if (detail === null) throw warehouseNotFound(id);
        return detail;
      });
    },
  };
}

export const warehouseProfileService: WarehouseProfileService = createWarehouseProfileService();
