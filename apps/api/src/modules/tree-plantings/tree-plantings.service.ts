import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  treePlantingsRepo,
  type TreePlantingCursor,
  type TreePlantingsRepo,
  type UpdateTreePlantingPatch,
} from './tree-plantings.repo.js';
import type {
  CreateTreePlantingBody,
  ListTreePlantingsQuery,
  ListTreePlantingsResponse,
  TreePlantingResponse,
  UpdateTreePlantingBody,
} from './tree-plantings.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface TreePlantingsServiceDeps {
  repo: TreePlantingsRepo;
  db: Executor;
  runTx: TransactionRunner;
}

function ownFarmerId(scope: ResolvedScope): string {
  if (scope.farmerId === undefined) {
    throw new AppError('FORBIDDEN', { detail: 'Endpoint requires a farmer identity.' });
  }
  return scope.farmerId;
}

function getTodayKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function encodeCursor(cursor: TreePlantingCursor): string {
  return Buffer.from(JSON.stringify([cursor.createdAt, cursor.id]), 'utf8').toString('base64url');
}

function decodeCursor(raw: string): TreePlantingCursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      !Number.isNaN(Date.parse(parsed[0])) &&
      typeof parsed[1] === 'string' &&
      /^[0-9a-f-]{36}$/i.test(parsed[1])
    ) {
      return { createdAt: parsed[0], id: parsed[1] };
    }
  } catch {
    // fall through
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

export interface TreePlantingsService {
  listTreePlantings(scope: ResolvedScope, query: ListTreePlantingsQuery): Promise<ListTreePlantingsResponse>;
  getTreePlanting(scope: ResolvedScope, id: string): Promise<TreePlantingResponse>;
  createTreePlanting(scope: ResolvedScope, body: CreateTreePlantingBody): Promise<TreePlantingResponse>;
  updateTreePlanting(scope: ResolvedScope, id: string, body: UpdateTreePlantingBody): Promise<TreePlantingResponse>;
  deleteTreePlanting(scope: ResolvedScope, id: string): Promise<void>;
}

export function createTreePlantingsService(deps: TreePlantingsServiceDeps = {
  repo: treePlantingsRepo,
  db: pool,
  runTx: withTransaction,
}): TreePlantingsService {
  const { repo, db, runTx } = deps;

  return {
    async listTreePlantings(scope, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
      const { items, next } = await repo.listTreePlantings(db, farmerId, query.limit, cursor);

      return {
        items,
        page: {
          nextCursor: next === null ? null : encodeCursor(next),
          hasMore: next !== null,
        },
      };
    },

    async getTreePlanting(scope, id) {
      const farmerId = ownFarmerId(scope);
      const record = await repo.findTreePlantingById(db, farmerId, id);
      if (record === null) {
        throw new AppError('NOT_FOUND', { detail: `Tree planting with id "${id}" not found.` });
      }
      return record;
    },

    async createTreePlanting(scope, body) {
      const farmerId = ownFarmerId(scope);

      // BR-55a
      if (body.treeCount <= 0 || !Number.isInteger(body.treeCount)) {
        throw new AppError('VALIDATION_FAILED', { detail: 'treeCount must be a positive integer.' });
      }

      // BR-55b
      if (body.plantedOn) {
        const today = getTodayKolkata();
        if (body.plantedOn > today) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `plantedOn cannot be in the future (today is ${today} in Asia/Kolkata).`,
          });
        }
      }

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);

        // Ownership check for farmId and plotId (BR-36)
        if (body.farmId) {
          const farmExists = await repo.checkFarmBelongsToFarmer(tx, farmerId, body.farmId);
          if (!farmExists) {
            throw new AppError('NOT_FOUND', { detail: `Farm not found: ${body.farmId}` });
          }
        }
        if (body.plotId) {
          const plotExists = await repo.checkPlotBelongsToFarmer(tx, farmerId, body.plotId);
          if (!plotExists) {
            throw new AppError('NOT_FOUND', { detail: `Plot not found: ${body.plotId}` });
          }
        }

        const created = await repo.createTreePlanting(tx, farmerId, body);

        // BR-55e, BR-35
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'FARMER',
          actionCode: 'tree_planting.create',
          entityType: 'tree_planting',
          entityId: created.id,
          after: created,
        });

        return created;
      });
    },

    async updateTreePlanting(scope, id, body) {
      const farmerId = ownFarmerId(scope);

      // BR-55a
      if (body.treeCount !== undefined && (body.treeCount <= 0 || !Number.isInteger(body.treeCount))) {
        throw new AppError('VALIDATION_FAILED', { detail: 'treeCount must be a positive integer.' });
      }

      // BR-55b
      if (body.plantedOn) {
        const today = getTodayKolkata();
        if (body.plantedOn > today) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `plantedOn cannot be in the future (today is ${today} in Asia/Kolkata).`,
          });
        }
      }

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);

        const before = await repo.findTreePlantingById(tx, farmerId, id);
        if (before === null) {
          throw new AppError('NOT_FOUND', { detail: `Tree planting with id "${id}" not found.` });
        }

        if (body.farmId) {
          const farmExists = await repo.checkFarmBelongsToFarmer(tx, farmerId, body.farmId);
          if (!farmExists) {
            throw new AppError('NOT_FOUND', { detail: `Farm not found: ${body.farmId}` });
          }
        }
        if (body.plotId) {
          const plotExists = await repo.checkPlotBelongsToFarmer(tx, farmerId, body.plotId);
          if (!plotExists) {
            throw new AppError('NOT_FOUND', { detail: `Plot not found: ${body.plotId}` });
          }
        }

        const patch: UpdateTreePlantingPatch = { ...body };
        const updated = await repo.updateTreePlanting(tx, farmerId, id, patch);
        if (updated === null) {
          throw new AppError('NOT_FOUND', { detail: `Tree planting with id "${id}" not found.` });
        }

        // BR-55e, BR-35
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'FARMER',
          actionCode: 'tree_planting.update',
          entityType: 'tree_planting',
          entityId: id,
          before,
          after: updated,
          changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
        });

        return updated;
      });
    },

    async deleteTreePlanting(scope, id) {
      const farmerId = ownFarmerId(scope);

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);

        const before = await repo.findTreePlantingById(tx, farmerId, id);
        if (before === null) {
          throw new AppError('NOT_FOUND', { detail: `Tree planting with id "${id}" not found.` });
        }

        const deleted = await repo.softDeleteTreePlanting(tx, farmerId, id);
        if (!deleted) {
          throw new AppError('NOT_FOUND', { detail: `Tree planting with id "${id}" not found.` });
        }

        // BR-55e, BR-35
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'FARMER',
          actionCode: 'tree_planting.delete',
          entityType: 'tree_planting',
          entityId: id,
          before,
        });
      });
    },
  };
}

export const treePlantingsService: TreePlantingsService = createTreePlantingsService();
