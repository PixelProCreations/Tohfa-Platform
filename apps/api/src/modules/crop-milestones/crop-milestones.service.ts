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
  return d.toISOString().slice(0, 10);
}

export interface CropMilestonesService {
  listMilestones(scope: ResolvedScope, farmCropId: string): Promise<CropMilestonesListResponse>;
  initializeMilestones(scope: ResolvedScope, farmCropId: string): Promise<CropMilestonesListResponse>;
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

  async function populateFromTemplates(executor: Executor, farmerId: string, farmCropId: string, cropId: string, plantedOn: string | null) {
    const templates = await repo.listTemplates(executor, cropId);
    if (templates.length === 0) return [];

    const toInsert = templates.map((t) => {
      let targetDate: string | null = null;
      if (plantedOn && t.expectedDaysAfterPlanting !== null) {
        targetDate = addDaysToDate(plantedOn, t.expectedDaysAfterPlanting);
      }
      return {
        farmerId,
        farmCropId,
        templateId: t.id,
        stageCode: t.stageCode,
        stageName: t.stageName,
        sequenceOrder: t.sequenceOrder,
        targetDate,
      };
    });

    await repo.insertMilestones(executor, toInsert);
    return repo.listMilestonesForCrop(executor, farmerId, farmCropId);
  }

  return {
    async listMilestones(scope, farmCropId) {
      const farmerId = ownFarmerId(scope);
      const crop = await getCropOrThrow(db, farmerId, farmCropId);

      let items = await repo.listMilestonesForCrop(db, farmerId, farmCropId);
      if (items.length === 0) {
        // Auto-initialize if empty
        items = await runTx(async (tx) => {
          await repo.lockFarmer(tx, farmerId);
          return populateFromTemplates(tx, farmerId, farmCropId, crop.cropId, crop.plantedOn);
        });
      }

      const { totalCount, completedCount, progressPct } = calculateProgress(items);
      return { items, totalCount, completedCount, progressPct };
    },

    async initializeMilestones(scope, farmCropId) {
      const farmerId = ownFarmerId(scope);
      const crop = await getCropOrThrow(db, farmerId, farmCropId);

      const items = await runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);
        const created = await populateFromTemplates(tx, farmerId, farmCropId, crop.cropId, crop.plantedOn);

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode ?? 'FARMER',
          actionCode: 'crop_milestone.initialize',
          entityType: 'crop_milestones',
          entityId: farmCropId,
          after: created,
        });

        return created;
      });

      const { totalCount, completedCount, progressPct } = calculateProgress(items);
      return { items, totalCount, completedCount, progressPct };
    },

    async updateMilestone(scope, farmCropId, id, body) {
      const farmerId = ownFarmerId(scope);
      await getCropOrThrow(db, farmerId, farmCropId);

      // BR-57a, BR-57b
      if (body.status === 'COMPLETED') {
        const today = getTodayKolkata();
        if (body.completedOn && body.completedOn > today) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `completedOn cannot be in the future (today is ${today} in Asia/Kolkata).`,
          });
        }
      }

      return runTx(async (tx) => {
        await repo.lockFarmer(tx, farmerId);

        const before = await repo.findMilestoneById(tx, farmerId, farmCropId, id);
        if (before === null) {
          throw new AppError('NOT_FOUND', { detail: `Milestone with id "${id}" not found.` });
        }

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
          actorRole: scope.roleCode ?? 'FARMER',
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
      const templates = await repo.listTemplates(db, query.cropMasterId);
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
