import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  cropMilestonesRepo,
  type CropMilestoneRecord,
  type CropMilestoneTemplateRecord,
  type CropMilestonesRepo,
} from './crop-milestones.repo.js';
import type {
  CropMilestoneResponse,
  CropMilestoneTemplateResponse,
  CropMilestonesListResponse,
  ListTemplatesQuery,
  UpdateMilestoneBody,
} from './crop-milestones.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface CropMilestonesServiceDeps {
  repo: CropMilestonesRepo;
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

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  // Past year 9999 toISOString() emits '+010000-..', which Postgres rejects as a 500; refuse it as a client error.
  if (d.getUTCFullYear() > 9999) {
    throw new AppError('VALIDATION_FAILED', {
      detail: 'planting date is too far in the future to schedule milestones',
    });
  }
  return d.toISOString().slice(0, 10);
}

export interface CropMilestonesService {
  listMilestones(scope: ResolvedScope, farmCropId: string): Promise<CropMilestonesListResponse>;
  /** `created` is true only when this call inserted rows; the route answers 201 for that and 200 otherwise. */
  initializeMilestones(
    scope: ResolvedScope,
    farmCropId: string,
  ): Promise<{ created: boolean; milestones: CropMilestonesListResponse }>;
  updateMilestone(
    scope: ResolvedScope,
    farmCropId: string,
    id: string,
    body: UpdateMilestoneBody,
  ): Promise<CropMilestoneResponse>;
  listTemplates(scope: ResolvedScope, query: ListTemplatesQuery): Promise<CropMilestoneTemplateResponse[]>;
}

export function createCropMilestonesService(deps: CropMilestonesServiceDeps = {
  repo: cropMilestonesRepo,
  db: pool,
  runTx: withTransaction,
}): CropMilestonesService {
  const { repo, db, runTx } = deps;

  async function getCropOrThrow(executor: Executor, farmerId: string, farmCropId: string) {
    const crop = await repo.getFarmCropBasicInfo(executor, farmerId, farmCropId);
    if (!crop) {
      throw new AppError('NOT_FOUND', { detail: `Farm crop with id "${farmCropId}" not found.` });
    }
    return crop;
  }

  function calculateProgress(items: CropMilestoneRecord[]) {
    const totalCount = items.length;
    const completedCount = items.filter((i) => i.status === 'COMPLETED').length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    return { totalCount, completedCount, progressPct };
  }

  /**
   * BR-57b: a crop that has templates of its own gets only those; otherwise it gets the universal ones.
   * Mixing the two would let a crop-specific and a universal stage share a sequence number.
   */
  async function templatesForCrop(executor: Executor, cropMasterId?: string): Promise<CropMilestoneTemplateRecord[]> {
    const templates = await repo.listTemplates(executor, cropMasterId);
    const own = templates.filter((t) => t.cropMasterId !== null);
    return own.length > 0 ? own : templates.filter((t) => t.cropMasterId === null);
  }

  /**
   * Populates missing milestones from templates under the owner lock. The audit row is written only when
   * rows were really inserted (BR-57e): the INSERT is ON CONFLICT DO NOTHING, so a concurrent initialiser
   * or a repeat call inserts nothing and must leave no trail claiming it did.
   */
  async function initializeUnderLock(tx: Executor, scope: ResolvedScope, farmerId: string, farmCropId: string) {
    await repo.lockFarmer(tx, farmerId);
    const crop = await getCropOrThrow(tx, farmerId, farmCropId);

    const templates = await templatesForCrop(tx, crop.cropId);
    const inserted = await repo.insertMilestones(
      tx,
      templates.map((t) => ({
        farmerId,
        farmCropId,
        templateId: t.id,
        stageCode: t.stageCode,
        stageName: t.stageName,
        sequenceOrder: t.sequenceOrder,
        targetDate:
          crop.plantedOn !== null && t.expectedDaysAfterPlanting !== null
            ? addDaysToDate(crop.plantedOn, t.expectedDaysAfterPlanting)
            : null,
      })),
    );

    if (inserted.length > 0) {
      await writeAuditLog(tx, {
        actorId: scope.userId,
        actorRole: scope.roleCode,
        actionCode: 'crop_milestone.initialize',
        entityType: 'crop_milestones',
        entityId: farmCropId,
        // Masked: the crop and the stages only, not the farmer id or the full rows.
        after: { insertedCount: inserted.length, stageCodes: inserted.map((m) => m.stageCode) },
      });
    }

    const items = await repo.listMilestonesForCrop(tx, farmerId, farmCropId);
    return { items, created: inserted.length > 0 };
  }

  return {
    async listMilestones(scope, farmCropId) {
      const farmerId = ownFarmerId(scope);
      await getCropOrThrow(db, farmerId, farmCropId);

      let items = await repo.listMilestonesForCrop(db, farmerId, farmCropId);
      if (items.length === 0) {
        // BR-57b: first access auto-initialises, under the same lock and audit as the explicit endpoint.
        items = (await runTx((tx) => initializeUnderLock(tx, scope, farmerId, farmCropId))).items;
      }

      return { items, ...calculateProgress(items) };
    },

    async initializeMilestones(scope, farmCropId) {
      const farmerId = ownFarmerId(scope);
      const { items, created } = await runTx((tx) => initializeUnderLock(tx, scope, farmerId, farmCropId));
      return { created, milestones: { items, ...calculateProgress(items) } };
    },

    async updateMilestone(scope, farmCropId, id, body) {
      const farmerId = ownFarmerId(scope);

      // BR-57a: whatever status it arrives with, a completion date is never in the future.
      if (body.completedOn) {
        const today = getTodayKolkata();
        if (body.completedOn > today) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `completedOn cannot be in the future (today is ${today} in Asia/Kolkata).`,
          });
        }
      }

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);
        await getCropOrThrow(tx, farmerId, farmCropId);

        const before = await repo.findMilestoneById(tx, farmerId, farmCropId, id);
        if (before === null) {
          throw new AppError('NOT_FOUND', { detail: `Milestone with id "${id}" not found.` });
        }

        // BR-57c: marking COMPLETED records the completion date.
        const patch: UpdateMilestoneBody = { ...body };
        if (patch.status === 'COMPLETED' && !patch.completedOn && !before.completedOn) {
          patch.completedOn = getTodayKolkata();
        }

        const updated = await repo.updateMilestone(tx, farmerId, farmCropId, id, patch);
        if (updated === null) {
          throw new AppError('NOT_FOUND', { detail: `Milestone with id "${id}" not found.` });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'crop_milestone.update',
          entityType: 'crop_milestone',
          entityId: id,
          before,
          after: updated,
          changedFields: changedFields(before as unknown as Record<string, unknown>, updated as unknown as Record<string, unknown>),
        });

        return updated;
      });
    },

    async listTemplates(_scope, query) {
      const templates = await templatesForCrop(db, query.cropMasterId);
      return templates.map((t: CropMilestoneTemplateRecord) => ({
        id: t.id,
        cropMasterId: t.cropMasterId,
        stageCode: t.stageCode,
        stageName: t.stageName,
        description: t.description,
        sequenceOrder: t.sequenceOrder,
        expectedDaysAfterPlanting: t.expectedDaysAfterPlanting,
      }));
    },
  };
}

export const cropMilestonesService: CropMilestonesService = createCropMilestonesService();
