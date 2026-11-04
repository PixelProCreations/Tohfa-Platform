/**
 * Community planting summary (BR-136) — the TOHFA Calendar "What the community is growing" view.
 *
 * WHY this is safe to show one farmer: it is an aggregate across ALL approved farmers, and it is
 * released only in groups of at least `system_config.community_planting_min_farmers` distinct
 * farmers (k-anonymity). The rules, in order:
 *
 *   1. A crop with >= k distinct farmers is a visible row (`byCrop`).
 *   2. Crops below k are folded together into `other`, which is released only if the folded
 *      crops TOGETHER have >= k distinct farmers; it names no crop.
 *   3. `totals` are computed over the released groups only. If they also included suppressed
 *      crops, "total minus visible rows" would hand back exactly the data step 1 suppressed.
 *
 * The scope is not used to narrow the query: the data is the community, never one farmer's rows,
 * so there is no owner predicate to inject. Who may call it at all is decided in docs/rbac.json
 * (`farmer.community.view_planting_summary`), which today grants it to NO role: the cross-farmer
 * view conflicts with BR-36 and awaits an owner decision (rules.md open contradiction 34). The
 * repo never returns a real farmer id (only a per-query rank), and every response object is
 * parsed through an allow-list schema.
 *
 * The threshold has no fallback constant and no shipped value: a missing or unusable value is
 * 503 COMMUNITY_PLANTING_NOT_CONFIGURED, because showing groups of one is exactly the failure
 * this rule exists to prevent, and the value itself is the owner's to choose.
 */
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  COMMUNITY_MIN_GROUP_SIZE_KEY,
  communityPlantingRepo,
  type CommunityPlantingFilters,
  type CommunityPlantingRepo,
} from './community-planting.repo.js';
import {
  plantingFiltersResponse,
  plantingSummaryResponse,
  type PlantingFiltersResponse,
  type PlantingSummaryCrop,
  type PlantingSummaryQuery,
  type PlantingSummaryResponse,
} from './community-planting.schema.js';

export interface CommunityPlantingServiceDeps {
  repo?: CommunityPlantingRepo;
  db?: Executor;
}

export interface CommunityPlantingService {
  getPlantingSummary(scope: ResolvedScope, query: PlantingSummaryQuery): Promise<PlantingSummaryResponse>;
  getPlantingFilters(scope: ResolvedScope): Promise<PlantingFiltersResponse>;
}

/** Calendar months, 1 = January. The client labels them from its own i18n catalogue. */
const MONTHS: readonly number[] = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * A usable threshold is a JSON integer >= 2. 1 (or less) would release single-farmer groups,
 * which is the anonymity breach itself, so it is refused rather than honoured.
 */
function parseMinGroupSize(raw: unknown): number {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 2) return raw;
  throw new AppError('COMMUNITY_PLANTING_NOT_CONFIGURED', {
    detail:
      `Community planting summary is not configured: system_config.${COMMUNITY_MIN_GROUP_SIZE_KEY} ` +
      'must be a JSON integer of at least 2. BR-136 forbids a hard-coded fallback; the owner must set it.',
    meta: { configKey: COMMUNITY_MIN_GROUP_SIZE_KEY },
  });
}

const gramsToKg = (grams: number): number => grams / 1000;

interface CropGroup {
  cropMasterId: string;
  cropName: string;
  farmers: Set<number>;
  grams: number;
}

export function createCommunityPlantingService(
  deps: CommunityPlantingServiceDeps = {},
): CommunityPlantingService {
  const repo = deps.repo ?? communityPlantingRepo;
  const db = deps.db ?? pool;

  return {
    async getPlantingSummary(_scope, query) {
      const minGroupSize = parseMinGroupSize(await repo.getMinGroupSize(db));

      const filters: CommunityPlantingFilters = {
        ...(query.crop === undefined ? {} : { cropId: query.crop }),
        ...(query.month === undefined ? {} : { month: query.month }),
        ...(query.region === undefined ? {} : { region: query.region }),
      };
      const rows = await repo.listCropFarmerPlantings(db, filters);

      const groups = new Map<string, CropGroup>();
      for (const r of rows) {
        let group = groups.get(r.cropMasterId);
        if (group === undefined) {
          group = { cropMasterId: r.cropMasterId, cropName: r.cropName, farmers: new Set(), grams: 0 };
          groups.set(r.cropMasterId, group);
        }
        group.farmers.add(r.farmerKey);
        group.grams += r.quantityGrams;
      }

      const released: CropGroup[] = [];
      const small: CropGroup[] = [];
      for (const group of groups.values()) {
        (group.farmers.size >= minGroupSize ? released : small).push(group);
      }

      const smallFarmers = new Set<number>();
      let smallGrams = 0;
      for (const group of small) {
        for (const f of group.farmers) smallFarmers.add(f);
        smallGrams += group.grams;
      }
      const otherReleased = small.length > 0 && smallFarmers.size >= minGroupSize;

      // Totals over released groups only (rule 3 above).
      const releasedFarmers = new Set<number>(otherReleased ? smallFarmers : []);
      let releasedGrams = otherReleased ? smallGrams : 0;
      for (const group of released) {
        for (const f of group.farmers) releasedFarmers.add(f);
        releasedGrams += group.grams;
      }

      const byCrop: PlantingSummaryCrop[] = released
        .sort(
          (a, b) =>
            b.farmers.size - a.farmers.size ||
            b.grams - a.grams ||
            a.cropName.localeCompare(b.cropName) ||
            a.cropMasterId.localeCompare(b.cropMasterId),
        )
        .map((g) => ({
          cropMasterId: g.cropMasterId,
          cropName: g.cropName,
          farmers: g.farmers.size,
          quantityKg: gramsToKg(g.grams),
        }));

      const response: PlantingSummaryResponse = {
        generatedAt: new Date().toISOString(),
        filters: {
          crop: query.crop ?? null,
          month: query.month ?? null,
          region: query.region ?? null,
        },
        minGroupSize,
        totals: {
          farmers: releasedFarmers.size,
          totalPlantedKg: gramsToKg(releasedGrams),
          crops: released.length + (otherReleased ? small.length : 0),
        },
        byCrop,
        other: otherReleased
          ? { crops: small.length, farmers: smallFarmers.size, quantityKg: gramsToKg(smallGrams) }
          : null,
      };
      return plantingSummaryResponse.parse(response);
    },

    async getPlantingFilters(_scope) {
      const minGroupSize = parseMinGroupSize(await repo.getMinGroupSize(db));
      const [crops, regionCounts] = await Promise.all([
        repo.listActiveCrops(db),
        repo.listRegionFarmerCounts(db),
      ]);

      const response: PlantingFiltersResponse = {
        minGroupSize,
        crops: crops.map((c) => ({ cropMasterId: c.cropMasterId, cropName: c.cropName })),
        months: [...MONTHS],
        // A region is offered only if it reaches k on its own; its farmer count is not sent.
        regions: regionCounts
          .filter((r) => r.farmers >= minGroupSize)
          .map((r) => r.region)
          .sort((a, b) => a.localeCompare(b)),
      };
      return plantingFiltersResponse.parse(response);
    },
  };
}

export const communityPlantingService: CommunityPlantingService = createCommunityPlantingService();
