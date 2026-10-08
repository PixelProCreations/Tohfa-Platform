import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import type {
  CropMilestoneRecord,
  CropMilestoneTemplateRecord,
  CropMilestonesRepo,
  FarmCropBasicInfo,
} from './crop-milestones.repo.js';
import { createCropMilestonesService } from './crop-milestones.service.js';

function todayIst(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';
const CROP_A = '50000000-0000-4000-8000-000000000001';
const CROP_B = '50000000-0000-4000-8000-000000000002';
const MASTER_CROP = '40000000-0000-4000-8000-000000000001';

function farmerScope(farmerId: string, permission = 'farmer.crop_milestone.manage_own'): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission,
  });
}

interface FakeDbState {
  milestones: Map<string, CropMilestoneRecord>;
  templates: CropMilestoneTemplateRecord[];
  audits: unknown[][];
  lockedFarmers: string[];
}

function createFakeRepo(state: FakeDbState): CropMilestonesRepo {
  return {
    async lockFarmer(_db, farmerId) {
      state.lockedFarmers.push(farmerId);
    },

    async getFarmCropBasicInfo(_db, farmerId, farmCropId): Promise<FarmCropBasicInfo | null> {
      if (farmerId === FARMER_A && farmCropId === CROP_A) {
        return { id: CROP_A, cropId: MASTER_CROP, plantedOn: '2026-09-01' };
      }
      if (farmerId === FARMER_B && farmCropId === CROP_B) {
        return { id: CROP_B, cropId: MASTER_CROP, plantedOn: '2026-09-15' };
      }
      return null;
    },

    async listMilestonesForCrop(_db, farmerId, farmCropId) {
      return Array.from(state.milestones.values())
        .filter((m) => m.farmerId === farmerId && m.farmCropId === farmCropId)
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    },

    async findMilestoneById(_db, farmerId, farmCropId, id) {
      const m = state.milestones.get(id);
      if (!m || m.farmerId !== farmerId || m.farmCropId !== farmCropId) {
        return null;
      }
      return { ...m };
    },

    async updateMilestone(_db, farmerId, farmCropId, id, patch) {
      const m = state.milestones.get(id);
      if (!m || m.farmerId !== farmerId || m.farmCropId !== farmCropId) {
        return null;
      }
      if (patch.status !== undefined) m.status = patch.status;
      if ('completedOn' in patch) m.completedOn = patch.completedOn ?? null;
      if ('targetDate' in patch) m.targetDate = patch.targetDate ?? null;
      if ('notes' in patch) m.notes = patch.notes ?? null;
      m.updatedAt = new Date().toISOString();
      return { ...m };
    },

    async listTemplates(_db, _cropMasterId) {
      return [...state.templates];
    },

    async insertMilestones(_db, milestones) {
      const results: CropMilestoneRecord[] = [];
      for (const item of milestones) {
        const id = newId();
        const rec: CropMilestoneRecord = {
          id,
          farmerId: item.farmerId,
          farmCropId: item.farmCropId,
          templateId: item.templateId,
          stageCode: item.stageCode,
          stageName: item.stageName,
          sequenceOrder: item.sequenceOrder,
          status: 'PENDING',
          targetDate: item.targetDate,
          completedOn: null,
          notes: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        };
        state.milestones.set(id, rec);
        results.push(rec);
      }
      return results;
    },
  };
}

function createTestContext() {
  const state: FakeDbState = {
    milestones: new Map(),
    templates: [
      {
        id: '10000000-0000-4000-8000-000000000001',
        cropMasterId: null,
        stageCode: 'STAGE_SOWING',
        stageName: 'Sowing & Germination',
        description: 'Seed emergence',
        sequenceOrder: 1,
        expectedDaysAfterPlanting: 7,
      },
      {
        id: '10000000-0000-4000-8000-000000000002',
        cropMasterId: null,
        stageCode: 'STAGE_VEGETATIVE',
        stageName: 'Vegetative Growth',
        description: 'Leaf and shoot growth',
        sequenceOrder: 2,
        expectedDaysAfterPlanting: 30,
      },
      {
        id: '10000000-0000-4000-8000-000000000003',
        cropMasterId: null,
        stageCode: 'STAGE_FLOWERING',
        stageName: 'Flowering',
        description: 'Bud opening',
        sequenceOrder: 3,
        expectedDaysAfterPlanting: 50,
      },
      {
        id: '10000000-0000-4000-8000-000000000004',
        cropMasterId: null,
        stageCode: 'STAGE_HARVEST',
        stageName: 'Harvest',
        description: 'Produce harvest',
        sequenceOrder: 4,
        expectedDaysAfterPlanting: 75,
      },
    ],
    audits: [],
    lockedFarmers: [],
  };
  const repo = createFakeRepo(state);
  const fakeTx: Executor = {
    query: async (_sql: string, params?: unknown[]) => {
      state.audits.push(params ?? []);
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  };
  const service = createCropMilestonesService({
    repo,
    db: fakeTx,
    runTx: async (fn) => fn(fakeTx),
  });

  return { state, repo, service, audits: state.audits };
}

describe('Crop Milestones (BR-57)', () => {
  it('BR-57a rejects completedOn in the future relative to Asia/Kolkata', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const list = await service.listMilestones(scope, CROP_A);
    const firstMilestone = list.items[0]!;

    const futureDate = addDays(todayIst(), 3);
    await expect(
      service.updateMilestone(scope, CROP_A, firstMilestone.id, {
        status: 'COMPLETED',
        completedOn: futureDate,
      }),
    ).rejects.toThrowError(AppError);
  });

  it('BR-57b auto-initializes milestones from templates with 0% progress on first list', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const list = await service.listMilestones(scope, CROP_A);
    expect(list.totalCount).toBe(4);
    expect(list.completedCount).toBe(0);
    expect(list.progressPct).toBe(0);
    expect(list.items[0]?.stageCode).toBe('STAGE_SOWING');
    expect(list.items[0]?.targetDate).toBe('2026-09-08'); // 2026-09-01 + 7 days
    expect(list.items[1]?.stageCode).toBe('STAGE_VEGETATIVE');
  });

  it('BR-57c prevents cross-farmer access (returns 404 NOT_FOUND, BR-36)', async () => {
    const { service } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    const listA = await service.listMilestones(scopeA, CROP_A);
    const firstMilestone = listA.items[0]!;

    // Farmer B cannot list milestones for Crop A
    await expect(service.listMilestones(scopeB, CROP_A)).rejects.toThrowError(AppError);

    // Farmer B cannot update milestone on Crop A
    await expect(
      service.updateMilestone(scopeB, CROP_A, firstMilestone.id, {
        status: 'COMPLETED',
      }),
    ).rejects.toThrowError(AppError);
  });

  it('BR-57d updates milestone to COMPLETED and recalculates progress percentage', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const initial = await service.listMilestones(scope, CROP_A);
    const first = initial.items[0]!;
    const second = initial.items[1]!;

    // Complete first milestone (1 out of 4 = 25%)
    const updatedFirst = await service.updateMilestone(scope, CROP_A, first.id, {
      status: 'COMPLETED',
      completedOn: '2026-09-08',
      notes: 'Germination successful, 95% emergence.',
    });
    expect(updatedFirst.status).toBe('COMPLETED');
    expect(updatedFirst.completedOn).toBe('2026-09-08');

    const afterFirst = await service.listMilestones(scope, CROP_A);
    expect(afterFirst.completedCount).toBe(1);
    expect(afterFirst.progressPct).toBe(25);

    // Complete second milestone (2 out of 4 = 50%)
    await service.updateMilestone(scope, CROP_A, second.id, {
      status: 'COMPLETED',
      completedOn: todayIst(),
    });

    const afterSecond = await service.listMilestones(scope, CROP_A);
    expect(afterSecond.completedCount).toBe(2);
    expect(afterSecond.progressPct).toBe(50);
  });

  it('BR-57e allows updating milestone status to SKIPPED', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const list = await service.listMilestones(scope, CROP_A);
    const milestone = list.items[2]!;

    const updated = await service.updateMilestone(scope, CROP_A, milestone.id, {
      status: 'SKIPPED',
      notes: 'Skipping flowering stage check due to weather.',
    });
    expect(updated.status).toBe('SKIPPED');
  });

  it('BR-57f locks farmer row and writes audit logs on milestone mutations (BR-35)', async () => {
    const { service, state, audits } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const list = await service.listMilestones(scope, CROP_A);
    const milestone = list.items[0]!;

    await service.updateMilestone(scope, CROP_A, milestone.id, {
      status: 'COMPLETED',
      completedOn: '2026-09-05',
    });

    expect(state.lockedFarmers).toContain(FARMER_A);
    expect(audits.some((a) => a[3] === 'crop_milestone.update')).toBe(true);
  });

  it('BR-57g lists available milestone templates', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    const templates = await service.listTemplates(scope, {});
    expect(templates.length).toBe(4);
    expect(templates[0]?.stageCode).toBe('STAGE_SOWING');
    expect(templates[3]?.stageCode).toBe('STAGE_HARVEST');
  });
});
