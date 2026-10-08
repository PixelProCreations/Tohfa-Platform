import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  cropPlanningInsightRepo,
  type CropPlanningInsightRepo,
} from './crop-planning-insight.repo.js';
import {
  cropPlanningInsightResponse,
  type CropPlanningInsightItem,
  type CropPlanningInsightResponse,
} from './crop-planning-insight.schema.js';

export const DEFAULT_SPEC_GAPS: string[] = [
  'Market supply vs customer demand indicator is deferred (owner decision required).',
  'Automated crop-switching recommendations are deferred per BR-38.',
  'Dynamic fair price forecast models are not in scope.',
];

export interface CropPlanningInsightServiceDeps {
  repo?: CropPlanningInsightRepo;
  db?: Executor;
  nowMonthKolkata?: () => number;
}

export interface CropPlanningInsightService {
  getCropPlanningInsight(scope: ResolvedScope): Promise<CropPlanningInsightResponse>;
}

function ownFarmerId(scope: ResolvedScope): string {
  if (scope.farmerId === undefined) {
    throw new AppError('FORBIDDEN', { detail: 'Endpoint requires a farmer identity.' });
  }
  return scope.farmerId;
}

function getCurrentMonthKolkata(): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'numeric',
  });
  return Number(formatter.format(new Date()));
}

export function createCropPlanningInsightService(
  deps: CropPlanningInsightServiceDeps = {},
): CropPlanningInsightService {
  const repo = deps.repo ?? cropPlanningInsightRepo;
  const db = deps.db ?? pool;
  const nowMonth = deps.nowMonthKolkata ?? getCurrentMonthKolkata;

  return {
    async getCropPlanningInsight(scope: ResolvedScope): Promise<CropPlanningInsightResponse> {
      const farmerId = ownFarmerId(scope);

      const [taxonomies, activePlantings, harvestStats, consecutivePlantings] =
        await Promise.all([
          repo.listCropMasterTaxonomy(db, farmerId),
          repo.listFarmerActivePlantings(db, farmerId),
          repo.getFarmerHarvestStats(db, farmerId),
          repo.getFarmerConsecutivePlantings(db, farmerId),
        ]);

      const currentMonth = nowMonth();

      const crops: CropPlanningInsightItem[] = taxonomies.map((crop) => {
        const cropActivePlantings = activePlantings.filter(
          (p) => p.cropMasterId === crop.cropMasterId,
        );
        const youGrow = cropActivePlantings.length > 0;
        const activePlots = Array.from(
          new Set(cropActivePlantings.map((p) => p.plotName)),
        ).sort();

        let inSeason: boolean | null = null;
        if (crop.seasonMonths && crop.seasonMonths.length > 0) {
          inSeason = crop.seasonMonths.includes(currentMonth);
        }

        const distinctPlots = new Map<string, number>();
        for (const p of cropActivePlantings) {
          if (!distinctPlots.has(p.plotId)) {
            distinctPlots.set(p.plotId, p.areaAcres ?? 0);
          }
        }
        let totalAcreage = 0;
        for (const acres of distinctPlots.values()) {
          totalAcreage += acres;
        }
        const totalAcreageGrown = Math.round(totalAcreage * 1000) / 1000;

        const yieldVals = cropActivePlantings
          .map((p) => p.expectedYieldKg)
          .filter((v): v is number => v !== null && v !== undefined);
        const expectedYieldKg =
          yieldVals.length > 0
            ? Math.round(yieldVals.reduce((acc, v) => acc + v, 0) * 100) / 100
            : null;

        const stat = harvestStats.find((s) => s.cropMasterId === crop.cropMasterId);
        const pastHarvestCount = stat !== undefined ? stat.pastHarvestCount : 0;
        const lastHarvestedOn = stat !== undefined ? stat.lastHarvestedOn : null;

        const conPlots = consecutivePlantings
          .filter((c) => c.cropMasterId === crop.cropMasterId)
          .map((c) => c.plotName);
        const consecutivePlotNames = Array.from(new Set(conPlots)).sort();
        const hasConsecutivePlanting = consecutivePlotNames.length > 0;

        return {
          cropMasterId: crop.cropMasterId,
          cropName: crop.cropName,
          category: crop.category,
          youGrow,
          inSeason,
          activePlots,
          totalAcreageGrown,
          expectedYieldKg,
          pastHarvestCount,
          lastHarvestedOn,
          hasConsecutivePlanting,
          consecutivePlotNames,
        };
      });

      const response: CropPlanningInsightResponse = {
        generatedAt: new Date().toISOString(),
        crops,
        specGaps: DEFAULT_SPEC_GAPS,
      };

      return cropPlanningInsightResponse.parse(response);
    },
  };
}

export const cropPlanningInsightService: CropPlanningInsightService =
  createCropPlanningInsightService();
