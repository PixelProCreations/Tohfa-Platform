/**
 * farms.service — business logic for a farmer's own land locations (`farms`)
 * and their zones (`plots`).
 *
 * `farmer.farm.manage_own` is a single `own`-scoped permission covering both
 * tables: a plot is only ever reached through a farm the actor owns, so
 * ownership is enforced by loading (and, for plots, joining through) the
 * parent `farms` row and comparing `farm.farmerId` against `scope.farmerId` —
 * the same load-then-compare idiom `counter-offers.service.ts#requireOwnListing`
 * uses for a farmer's own listing. A farm/plot that exists but belongs to
 * another farmer 404s, exactly like it, never 403 (root CLAUDE.md §2.1,
 * BR-36): a 403 would confirm the row's existence to an actor not allowed to
 * know about it.
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import { scopedWhere, type ResolvedScope } from '../../rbac/requirePermission.js';
import {
  farmsRepo,
  type Farm,
  type FarmWithPlotCount,
  type FarmsRepo,
  type Plot,
} from './farms.repo.js';
import type {
  CreateFarmBody,
  CreatePlotBody,
  UpdateFarmBody,
  UpdatePlotBody,
} from './farms.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** Postgres unique_violation — `plots_name_unique_per_farm` (db/migrations/0003). */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

export interface FarmsServiceDeps {
  repo: FarmsRepo;
  runTx: TransactionRunner;
  db: Executor;
}

/**
 * Dependencies are injected with defaults. Production code calls
 * `farmsService`; tests call `createFarmsService({ repo: fake })`.
 */
export function createFarmsService(deps: Partial<FarmsServiceDeps> = {}): FarmsService {
  const repo = deps.repo ?? farmsRepo;
  const runTx = deps.runTx ?? withTransaction;
  const db = deps.db ?? pool;

  /**
   * A `FARMER` role always carries `scope.farmerId` once `own` scope resolves
   * (see requirePermission.ts#resolveScope) — this only trips if a token was
   * minted before farmer approval finished, which is a provisioning bug, not
   * a normal 403/404 case. NOT_FOUND mirrors certifications.service.ts's
   * `resolveFarmerId` for the same situation.
   */
  function requireFarmerId(scope: ResolvedScope): string {
    if (scope.farmerId === undefined) {
      throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for actor.' });
    }
    return scope.farmerId;
  }

  /** Cross-scope reads return an empty result set, not 403 — root CLAUDE.md §2.1, BR-36. */
  async function requireOwnFarm(tx: Executor, scope: ResolvedScope, farmId: string): Promise<Farm> {
    const farmerId = requireFarmerId(scope);
    const farm = await repo.findById(tx, farmId);
    if (farm === null || farm.farmerId !== farmerId) {
      throw new AppError('NOT_FOUND', { detail: 'Farm not found.' });
    }
    return farm;
  }

  /** Ownership of a plot is checked by joining through its parent farm (BR-36). */
  async function requireOwnPlot(
    tx: Executor,
    scope: ResolvedScope,
    farmId: string,
    plotId: string,
  ): Promise<Plot> {
    await requireOwnFarm(tx, scope, farmId);
    const plot = await repo.findPlotById(tx, farmId, plotId);
    if (plot === null) {
      throw new AppError('NOT_FOUND', { detail: 'Plot not found.' });
    }
    return plot;
  }

  return {
    async list(scope) {
      const filter = scopedWhere(scope, { farmerColumn: 'f.farmer_id', startIndex: 1 });
      return repo.listByScope(db, filter);
    },

    async create(scope, body) {
      const farmerId = requireFarmerId(scope);

      return runTx(async (tx) => {
        const farm = await repo.insert(tx, {
          farmerId,
          name: body.name,
          areaAcres: body.areaAcres ?? null,
          village: body.village ?? null,
          taluk: body.taluk ?? null,
          district: body.district ?? null,
          boundary: body.boundary ?? null,
          // A fresh POST carries no server-measured figure yet; that only
          // arrives via PATCH's `calculatedAreaAcres` once the client
          // computes it from the drawn polygon.
          boundaryAreaAcres: null,
          boundaryDrawnBy: body.boundary !== undefined ? scope.userId : null,
        });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.farm.create',
          entityType: 'farm',
          entityId: farm.id,
          after: { name: farm.name, farmerId },
        });

        return farm;
      });
    },

    async update(scope, farmId, body) {
      return runTx(async (tx) => {
        const existing = await requireOwnFarm(tx, scope, farmId);

        // `hasOwnProperty` (not `!== undefined`) is what lets the client send
        // `boundary: null` to explicitly clear a drawn boundary versus simply
        // omitting the field to leave it untouched. When the key IS present,
        // the only two possible values are a polygon or `null` (JSON has no
        // `undefined`), so `=== null` alone tells the two apart.
        const hasBoundaryKey = Object.prototype.hasOwnProperty.call(body, 'boundary');
        const clearingBoundary = hasBoundaryKey && body.boundary === null;

        const updated = await repo.update(tx, farmId, {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.areaAcres !== undefined ? { areaAcres: body.areaAcres } : {}),
          ...(body.village !== undefined ? { village: body.village } : {}),
          ...(body.taluk !== undefined ? { taluk: body.taluk } : {}),
          ...(body.district !== undefined ? { district: body.district } : {}),
          ...(body.waterSources !== undefined ? { waterSources: body.waterSources } : {}),
          ...(body.landBoundaryContext !== undefined
            ? { landBoundaryContext: body.landBoundaryContext }
            : {}),
          ...(body.notes !== undefined ? { notes: body.notes } : {}),
          ...(hasBoundaryKey
            ? {
                boundaryUpdate: {
                  geojson: body.boundary ?? null,
                  // Clearing the boundary clears everything derived from it,
                  // regardless of what (if anything) the client sent for
                  // calculatedAreaAcres.
                  boundaryAreaAcres: clearingBoundary ? null : body.calculatedAreaAcres ?? null,
                  drawnBy: clearingBoundary ? null : scope.userId,
                },
              }
            : {}),
        });

        if (updated === null) {
          // The row existed a moment ago (requireOwnFarm just loaded it); this
          // means a concurrent delete won the race between load and write.
          throw new AppError('NOT_FOUND', { detail: 'Farm not found.' });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.farm.update',
          entityType: 'farm',
          entityId: farmId,
          before: { name: existing.name, boundaryVersion: existing.boundaryVersion },
          after: { name: updated.name, boundaryVersion: updated.boundaryVersion },
        });

        return updated;
      });
    },

    async remove(scope, farmId) {
      await runTx(async (tx) => {
        const existing = await requireOwnFarm(tx, scope, farmId);
        const deleted = await repo.softDelete(tx, farmId);
        if (!deleted) {
          throw new AppError('NOT_FOUND', { detail: 'Farm not found.' });
        }
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.farm.delete',
          entityType: 'farm',
          entityId: farmId,
          before: { name: existing.name },
        });
      });
    },

    async listPlots(scope, farmId) {
      await requireOwnFarm(db, scope, farmId);
      return repo.listPlots(db, farmId);
    },

    async createPlot(scope, farmId, body) {
      return runTx(async (tx) => {
        await requireOwnFarm(tx, scope, farmId);
        try {
          const plot = await repo.insertPlot(tx, {
            farmId,
            name: body.name,
            areaAcres: body.areaAcres ?? null,
            soilType: body.soilType ?? null,
            sunExposure: body.sunExposure ?? null,
            irrigationType: body.irrigationType ?? null,
          });
          await writeAuditLog(tx, {
            actorId: scope.userId,
            actorRole: scope.roleCode,
            actionCode: 'farmer.farm.plot.create',
            entityType: 'plot',
            entityId: plot.id,
            after: { name: plot.name, farmId },
          });
          return plot;
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new AppError('CONFLICT', {
              detail: `A zone named "${body.name}" already exists on this farm.`,
              cause: error,
            });
          }
          throw error;
        }
      });
    },

    async updatePlot(scope, farmId, plotId, body) {
      return runTx(async (tx) => {
        const existing = await requireOwnPlot(tx, scope, farmId, plotId);
        try {
          const updated = await repo.updatePlot(tx, farmId, plotId, {
            ...(body.name !== undefined ? { name: body.name } : {}),
            ...(body.areaAcres !== undefined ? { areaAcres: body.areaAcres } : {}),
            ...(body.soilType !== undefined ? { soilType: body.soilType } : {}),
            ...(body.sunExposure !== undefined ? { sunExposure: body.sunExposure } : {}),
            ...(body.irrigationType !== undefined ? { irrigationType: body.irrigationType } : {}),
          });
          if (updated === null) {
            throw new AppError('NOT_FOUND', { detail: 'Plot not found.' });
          }
          await writeAuditLog(tx, {
            actorId: scope.userId,
            actorRole: scope.roleCode,
            actionCode: 'farmer.farm.plot.update',
            entityType: 'plot',
            entityId: plotId,
            before: { name: existing.name },
            after: { name: updated.name },
          });
          return updated;
        } catch (error) {
          if (isUniqueViolation(error)) {
            throw new AppError('CONFLICT', {
              detail: `A zone named "${body.name ?? existing.name}" already exists on this farm.`,
              cause: error,
            });
          }
          throw error;
        }
      });
    },

    async removePlot(scope, farmId, plotId) {
      await runTx(async (tx) => {
        const existing = await requireOwnPlot(tx, scope, farmId, plotId);
        const deleted = await repo.deletePlot(tx, farmId, plotId);
        if (!deleted) {
          throw new AppError('NOT_FOUND', { detail: 'Plot not found.' });
        }
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.farm.plot.delete',
          entityType: 'plot',
          entityId: plotId,
          before: { name: existing.name },
        });
      });
    },
  };
}

export interface FarmsService {
  list(scope: ResolvedScope): Promise<FarmWithPlotCount[]>;
  create(scope: ResolvedScope, body: CreateFarmBody): Promise<Farm>;
  update(scope: ResolvedScope, farmId: string, body: UpdateFarmBody): Promise<Farm>;
  remove(scope: ResolvedScope, farmId: string): Promise<void>;
  listPlots(scope: ResolvedScope, farmId: string): Promise<Plot[]>;
  createPlot(scope: ResolvedScope, farmId: string, body: CreatePlotBody): Promise<Plot>;
  updatePlot(scope: ResolvedScope, farmId: string, plotId: string, body: UpdatePlotBody): Promise<Plot>;
  removePlot(scope: ResolvedScope, farmId: string, plotId: string): Promise<void>;
}

/** The production instance. */
export const farmsService: FarmsService = createFarmsService();
