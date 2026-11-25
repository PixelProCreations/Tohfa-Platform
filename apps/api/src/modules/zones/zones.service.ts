import { ScopeLevel } from '@tohfa/shared-types';
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type {
  AdminZoneDetail,
  AdminZoneListItem,
  CreateZoneBody,
  ListZonesQuery,
  PublicZoneListItem,
  TransferZoneFarmersBody,
  UpdateZoneBody,
} from './zones.schema.js';
import { zonesRepo, type ZoneDetailRow, type ZoneListRow, type ZonesRepo } from './zones.repo.js';

export function deriveShortCode(code: string): string {
  const stripped = code.replace(/^ZONE[-_]/i, '');
  return stripped.slice(0, 3).toUpperCase();
}

export function maskMobile(mobile: string): string {
  if (mobile.length <= 4) return '*'.repeat(mobile.length);
  return '*'.repeat(mobile.length - 4) + mobile.slice(-4);
}

function toZoneListItem(row: ZoneListRow): AdminZoneListItem {
  return {
    id: row.id,
    code: row.code,
    shortCode: deriveShortCode(row.code),
    name: row.name,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouseName,
    description: row.description,
    taluks: row.taluks,
    isActive: row.isActive,
    createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)).toISOString(),
  };
}

function toZoneDetail(row: ZoneDetailRow): AdminZoneDetail {
  return {
    id: row.id,
    code: row.code,
    shortCode: deriveShortCode(row.code),
    name: row.name,
    warehouseId: row.warehouseId,
    warehouseName: row.warehouseName,
    description: row.description,
    taluks: row.taluks,
    manager:
      row.manager === null
        ? null
        : {
            userId: row.manager.userId,
            fullName: row.manager.fullName,
            mobile: maskMobile(row.manager.mobile),
          },
    isActive: row.isActive,
    createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)).toISOString(),
  };
}

export interface TransferZoneFarmersResult {
  sourceZoneId: string;
  targetZoneId: string;
  transferredCount: number;
  transferredFarmerIds: string[];
}

export interface ZonesService {
  list(scope: ResolvedScope, query: ListZonesQuery): Promise<AdminZoneListItem[]>;
  get(scope: ResolvedScope, id: string): Promise<AdminZoneDetail>;
  listPublic(): Promise<PublicZoneListItem[]>;
  create(scope: ResolvedScope, body: CreateZoneBody): Promise<AdminZoneDetail>;
  update(scope: ResolvedScope, id: string, body: UpdateZoneBody): Promise<AdminZoneDetail>;
  transferFarmers(scope: ResolvedScope, id: string, body: TransferZoneFarmersBody): Promise<TransferZoneFarmersResult>;
}

const PG_UNIQUE_VIOLATION = '23505';

function validateUniqueTaluks(taluks: string[] | undefined): void {
  if (!taluks) return;
  const seen = new Set<string>();
  for (const t of taluks) {
    const key = t.trim().toLowerCase();
    if (seen.has(key)) {
      throw new AppError('VALIDATION_FAILED', { detail: `Duplicate taluk "${t}" in request.` });
    }
    seen.add(key);
  }
}

function mapUniqueConflict(error: unknown): never {
  if (typeof error === 'object' && error !== null && (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION) {
    const constraint = (error as { constraint?: string }).constraint ?? '';
    if (constraint.includes('taluk')) {
      throw new AppError('CONFLICT', { detail: 'One or more taluks are already assigned to another zone.' });
    }
    throw new AppError('CONFLICT', { detail: 'A zone with this code already exists.' });
  }
  throw error;
}

export function createZonesService(repo: ZonesRepo = zonesRepo): ZonesService {
  return {
    async listPublic() {
      const rows = await repo.listPublic(pool);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        warehouseTown: r.warehouseTown,
      }));
    },
    async list(scope, query) {
      if (scope.level === ScopeLevel.OWN && scope.zoneIds.length === 0) {
        return [];
      }

      const rows = await repo.list(pool, {
        status: query.status ?? 'ACTIVE',
        warehouseId: query.warehouseId,
        zoneIds: scope.level === ScopeLevel.OWN ? scope.zoneIds : undefined,
      });

      return rows.map(toZoneListItem);
    },

    async get(scope, id) {
      if (scope.level === ScopeLevel.OWN && !scope.zoneIds.includes(id)) {
        throw new AppError('NOT_FOUND', { detail: 'Zone not found' });
      }

      const row = await repo.findById(pool, id);
      if (row === null) {
        throw new AppError('NOT_FOUND', { detail: 'Zone not found' });
      }

      return toZoneDetail(row);
    },

    async create(scope, body) {
      validateUniqueTaluks(body.taluks);
      return withTransaction(async (tx) => {
        if (body.warehouseId !== undefined && !(await repo.isActiveWarehouse(tx, body.warehouseId))) {
          throw new AppError('VALIDATION_FAILED', { detail: `Warehouse ${body.warehouseId} does not exist or is inactive.` });
        }

        let zoneId: string;
        try {
          zoneId = await repo.createZone(tx, {
            code: body.code.toUpperCase(),
            name: body.name,
            warehouseId: body.warehouseId ?? null,
            description: body.description ?? null,
            isActive: body.isActive,
          });
          if (body.taluks && body.taluks.length > 0) {
            await repo.replaceZoneTaluks(tx, zoneId, body.taluks);
          }
        } catch (error) {
          mapUniqueConflict(error);
        }

        const created = await repo.findById(tx, zoneId);
        if (created === null) throw new AppError('NOT_FOUND', { detail: 'Created zone could not be reloaded.' });
        const detail = toZoneDetail(created);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'zone.create',
          entityType: 'zone',
          entityId: zoneId,
          after: detail,
        });
        return detail;
      });
    },

    async update(scope, id, body) {
      validateUniqueTaluks(body.taluks);
      return withTransaction(async (tx) => {
        const beforeRow = await repo.findById(tx, id);
        if (beforeRow === null) {
          throw new AppError('NOT_FOUND', { detail: 'Zone not found' });
        }
        const before = toZoneDetail(beforeRow);

        if (body.warehouseId !== undefined && body.warehouseId !== null && !(await repo.isActiveWarehouse(tx, body.warehouseId))) {
          throw new AppError('VALIDATION_FAILED', { detail: `Warehouse ${body.warehouseId} does not exist or is inactive.` });
        }

        if (body.isActive === false && beforeRow.isActive) {
          const farmerCount = await repo.countActiveFarmersInZone(tx, id);
          if (farmerCount > 0) {
            throw new AppError('CONFLICT', {
              detail: `Cannot deactivate zone with ${farmerCount} active farmer(s). Transfer farmers first.`,
              meta: { farmerCount },
            });
          }
        }

        try {
          await repo.updateZone(tx, id, {
            name: body.name,
            warehouseId: body.warehouseId,
            description: body.description,
            isActive: body.isActive,
          });
          if (body.taluks !== undefined) {
            await repo.replaceZoneTaluks(tx, id, body.taluks);
          }
        } catch (error) {
          mapUniqueConflict(error);
        }

        const afterRow = await repo.findById(tx, id);
        if (afterRow === null) throw new AppError('NOT_FOUND', { detail: 'Zone not found' });
        const after = toZoneDetail(afterRow);

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'zone.update',
          entityType: 'zone',
          entityId: id,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return after;
      });
    },

    async transferFarmers(scope, id, body) {
      if (id === body.targetZoneId) {
        throw new AppError('VALIDATION_FAILED', { detail: 'Target zone must differ from source zone.' });
      }
      return withTransaction(async (tx) => {
        const [source, target] = await Promise.all([repo.findById(tx, id), repo.findById(tx, body.targetZoneId)]);
        if (source === null) throw new AppError('NOT_FOUND', { detail: 'Source zone not found' });
        if (target === null) throw new AppError('NOT_FOUND', { detail: 'Target zone not found' });
        if (!target.isActive) {
          throw new AppError('VALIDATION_FAILED', { detail: 'Target zone must be active before transferring farmers.' });
        }

        const transferredFarmerIds = await repo.transferFarmers(tx, id, body.targetZoneId, body.farmerIds);
        const result: TransferZoneFarmersResult = {
          sourceZoneId: id,
          targetZoneId: body.targetZoneId,
          transferredCount: transferredFarmerIds.length,
          transferredFarmerIds,
        };

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'zone.transfer_farmers',
          entityType: 'zone',
          entityId: id,
          after: { ...result, reason: body.reason },
        });
        return result;
      });
    },
  };
}

export const zonesService = createZonesService();
