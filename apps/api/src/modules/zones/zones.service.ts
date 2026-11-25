import { ScopeLevel } from '@tohfa/shared-types';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import type {
  AdminZoneDetail,
  AdminZoneListItem,
  ListZonesQuery,
  PublicZoneListItem,
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

export interface ZonesService {
  list(scope: ResolvedScope, query: ListZonesQuery): Promise<AdminZoneListItem[]>;
  get(scope: ResolvedScope, id: string): Promise<AdminZoneDetail>;
  listPublic(): Promise<PublicZoneListItem[]>;
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
  };
}

export const zonesService = createZonesService();
