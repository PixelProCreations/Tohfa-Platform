import { describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import type {
  ActivePlantingRow,
  ConsecutivePlantingRow,
  CropMasterTaxonomyRow,
  CropPlanningInsightRepo,
  HarvestStatRow,
} from './crop-planning-insight.repo.js';
import { cropPlanningInsightResponse } from './crop-planning-insight.schema.js';
import { createCropPlanningInsightService } from './crop-planning-insight.service.js';

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';

const CROP_CARROT = '40000000-0000-4000-8000-000000000001';
const CROP_POTATO = '40000000-0000-4000-8000-000000000002';
const CROP_CABBAGE = '40000000-0000-4000-8000-000000000003';

function farmerScope(farmerId: string): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission: 'farmer.crops.view_own',
  });
}

function nonFarmerScope(): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
    userId: newId(),
    roleCode: RoleCode.CUSTOMER,
    permission: 'farmer.crops.view_own',
  });
}

function createFakeRepo(): CropPlanningInsightRepo {
  const taxonomy: CropMasterTaxonomyRow[] = [
    {
      cropMasterId: CROP_CARROT,
      cropName: 'Carrot',
      category: 'Root Vegetables',
      seasonMonths: [10, 11, 12, 1],
    },
    {
      cropMasterId: CROP_POTATO,
      cropName: 'Potato',
      category: 'Tubers',
      seasonMonths: [3, 4, 5],
    },
    {
      cropMasterId: CROP_CABBAGE,
      cropName: 'Cabbage',
      category: 'Brassica',
      seasonMonths: null,
    },
  ];

  const activePlantingsFarmerA: ActivePlantingRow[] = [
    {
      cropMasterId: CROP_CARROT,
      plotId: 'plot-1',
      plotName: 'Plot 1 - North Terrace',
      areaAcres: 1.5,
      expectedYieldKg: 3000,
    },
    {
      cropMasterId: CROP_CARROT,
      plotId: 'plot-2',
      plotName: 'Plot 2 - Valley Flat',
      areaAcres: 2.0,
      expectedYieldKg: 4000,
    },
    {
      cropMasterId: CROP_CABBAGE,
      plotId: 'plot-1',
      plotName: 'Plot 1 - North Terrace',
      areaAcres: 1.5,
      expectedYieldKg: null,
    },
  ];

  const harvestStatsFarmerA: HarvestStatRow[] = [
    {
      cropMasterId: CROP_CARROT,
      pastHarvestCount: 3,
      lastHarvestedOn: '2026-06-15',
    },
    {
      cropMasterId: CROP_POTATO,
      pastHarvestCount: 1,
      lastHarvestedOn: '2025-11-20',
    },
  ];

  const consecutivePlantingsFarmerA: ConsecutivePlantingRow[] = [
    {
      cropMasterId: CROP_CARROT,
      plotName: 'Plot 1 - North Terrace',
    },
  ];

  return {
    async listCropMasterTaxonomy(_db: Executor, _farmerId: string) {
      return taxonomy;
    },
    async listFarmerActivePlantings(_db: Executor, farmerId: string) {
      if (farmerId === FARMER_A) return activePlantingsFarmerA;
      return [];
    },
    async getFarmerHarvestStats(_db: Executor, farmerId: string) {
      if (farmerId === FARMER_A) return harvestStatsFarmerA;
      return [];
    },
    async getFarmerConsecutivePlantings(_db: Executor, farmerId: string) {
      if (farmerId === FARMER_A) return consecutivePlantingsFarmerA;
      return [];
    },
  };
}

describe('CropPlanningInsightService (Module 10 - BR-38, BR-36)', () => {
  const dummyDb = {} as Executor;

  it('BR-36: rejects a caller with no farmer identity', async () => {
    const service = createCropPlanningInsightService({
      repo: createFakeRepo(),
      db: dummyDb,
    });

    await expect(service.getCropPlanningInsight(nonFarmerScope())).rejects.toThrow(
      AppError,
    );
  });

  it('season: marks crops in or out of season for October (month 10)', async () => {
    const service = createCropPlanningInsightService({
      repo: createFakeRepo(),
      db: dummyDb,
      nowMonthKolkata: () => 10,
    });

    const res = await service.getCropPlanningInsight(farmerScope(FARMER_A));
    expect(res.crops).toHaveLength(3);

    const carrot = res.crops.find((c) => c.cropMasterId === CROP_CARROT)!;
    expect(carrot.inSeason).toBe(true);

    const potato = res.crops.find((c) => c.cropMasterId === CROP_POTATO)!;
    expect(potato.inSeason).toBe(false);

    const cabbage = res.crops.find((c) => c.cropMasterId === CROP_CABBAGE)!;
    expect(cabbage.inSeason).toBeNull();
  });

  it('season: marks crops in or out of season for April (month 4)', async () => {
    const service = createCropPlanningInsightService({
      repo: createFakeRepo(),
      db: dummyDb,
      nowMonthKolkata: () => 4,
    });

    const res = await service.getCropPlanningInsight(farmerScope(FARMER_A));

    const carrot = res.crops.find((c) => c.cropMasterId === CROP_CARROT)!;
    expect(carrot.inSeason).toBe(false);

    const potato = res.crops.find((c) => c.cropMasterId === CROP_POTATO)!;
    expect(potato.inSeason).toBe(true);
  });

  it('season: the default month is the Asia/Kolkata month, not the UTC month', async () => {
    // 2026-09-30 20:00 UTC is 2026-10-01 01:30 IST: October in Kolkata, September in UTC.
    vi.useFakeTimers({ now: new Date('2026-09-30T20:00:00Z') });
    try {
      const service = createCropPlanningInsightService({ repo: createFakeRepo(), db: dummyDb });
      const res = await service.getCropPlanningInsight(farmerScope(FARMER_A));
      expect(res.crops.find((c) => c.cropMasterId === CROP_CARROT)?.inSeason).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('plantings: derives active plots, acreage and expected yield', async () => {
    const service = createCropPlanningInsightService({
      repo: createFakeRepo(),
      db: dummyDb,
      nowMonthKolkata: () => 10,
    });

    const res = await service.getCropPlanningInsight(farmerScope(FARMER_A));

    // Carrot is grown on 2 distinct plots: Plot 1 (1.5 ac) + Plot 2 (2.0 ac)
    const carrot = res.crops.find((c) => c.cropMasterId === CROP_CARROT)!;
    expect(carrot.youGrow).toBe(true);
    expect(carrot.activePlots).toEqual(['Plot 1 - North Terrace', 'Plot 2 - Valley Flat']);
    expect(carrot.totalAcreageGrown).toBe(3.5);
    expect(carrot.expectedYieldKg).toBe(7000);

    // Potato is not actively grown
    const potato = res.crops.find((c) => c.cropMasterId === CROP_POTATO)!;
    expect(potato.youGrow).toBe(false);
    expect(potato.activePlots).toEqual([]);
    expect(potato.totalAcreageGrown).toBe(0);
    expect(potato.expectedYieldKg).toBeNull();

    // Cabbage is grown on Plot 1 with null expected yield
    const cabbage = res.crops.find((c) => c.cropMasterId === CROP_CABBAGE)!;
    expect(cabbage.youGrow).toBe(true);
    expect(cabbage.activePlots).toEqual(['Plot 1 - North Terrace']);
    expect(cabbage.totalAcreageGrown).toBe(1.5);
    expect(cabbage.expectedYieldKg).toBeNull();
  });

  it('harvests: derives past harvest count and recency date', async () => {
    const service = createCropPlanningInsightService({
      repo: createFakeRepo(),
      db: dummyDb,
      nowMonthKolkata: () => 10,
    });

    const res = await service.getCropPlanningInsight(farmerScope(FARMER_A));

    const carrot = res.crops.find((c) => c.cropMasterId === CROP_CARROT)!;
    expect(carrot.pastHarvestCount).toBe(3);
    expect(carrot.lastHarvestedOn).toBe('2026-06-15');

    const potato = res.crops.find((c) => c.cropMasterId === CROP_POTATO)!;
    expect(potato.pastHarvestCount).toBe(1);
    expect(potato.lastHarvestedOn).toBe('2025-11-20');

    const cabbage = res.crops.find((c) => c.cropMasterId === CROP_CABBAGE)!;
    expect(cabbage.pastHarvestCount).toBe(0);
    expect(cabbage.lastHarvestedOn).toBeNull();
  });

  it('rotation: flags consecutive plantings of one crop on the same plot', async () => {
    const service = createCropPlanningInsightService({
      repo: createFakeRepo(),
      db: dummyDb,
      nowMonthKolkata: () => 10,
    });

    const res = await service.getCropPlanningInsight(farmerScope(FARMER_A));

    const carrot = res.crops.find((c) => c.cropMasterId === CROP_CARROT)!;
    expect(carrot.hasConsecutivePlanting).toBe(true);
    expect(carrot.consecutivePlotNames).toEqual(['Plot 1 - North Terrace']);

    const potato = res.crops.find((c) => c.cropMasterId === CROP_POTATO)!;
    expect(potato.hasConsecutivePlanting).toBe(false);
    expect(potato.consecutivePlotNames).toEqual([]);

    const cabbage = res.crops.find((c) => c.cropMasterId === CROP_CABBAGE)!;
    expect(cabbage.hasConsecutivePlanting).toBe(false);
    expect(cabbage.consecutivePlotNames).toEqual([]);
  });

  it('BR-36: returns empty stats for a farmer with no plantings or harvests', async () => {
    const service = createCropPlanningInsightService({
      repo: createFakeRepo(),
      db: dummyDb,
      nowMonthKolkata: () => 10,
    });

    const res = await service.getCropPlanningInsight(farmerScope(FARMER_B));
    expect(res.crops).toHaveLength(3);

    for (const crop of res.crops) {
      expect(crop.youGrow).toBe(false);
      expect(crop.activePlots).toEqual([]);
      expect(crop.totalAcreageGrown).toBe(0);
      expect(crop.expectedYieldKg).toBeNull();
      expect(crop.pastHarvestCount).toBe(0);
      expect(crop.lastHarvestedOn).toBeNull();
      expect(crop.hasConsecutivePlanting).toBe(false);
      expect(crop.consecutivePlotNames).toEqual([]);
    }
  });

  it('BR-38: the response carries no advisory text, only derived facts', async () => {
    const service = createCropPlanningInsightService({
      repo: createFakeRepo(),
      db: dummyDb,
      nowMonthKolkata: () => 10,
    });

    const res = await service.getCropPlanningInsight(farmerScope(FARMER_A));
    // The deferred-feature notes live in docs/crop-planning-insight-design.md,
    // not in an English string on every response.
    expect(Object.keys(res).sort()).toEqual(['crops', 'generatedAt']);
    expect(cropPlanningInsightResponse.shape).not.toHaveProperty('specGaps');
  });
});
