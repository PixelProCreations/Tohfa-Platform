/**
 * Community planting summary (BR-136) — the TOHFA Calendar "What the community is growing" view.
 *
 * WHY this is safe to show one farmer: it is an aggregate across ALL approved farmers, and it is
 * released only in groups of at least `system_config.community_planting_min_farmers` distinct
 * farmers (k-anonymity). The rules, in order:
 *
 *   0. A region filter is accepted only for a region that reaches k on its own (the same count
 *      the filters endpoint uses); otherwise the answer is the empty summary a nonexistent
 *      region gets (BR-136h).
 *   1. A crop with >= k distinct farmers is a visible row (`byCrop`), unless subtracting it
 *      from the same crop in a coarser slice (month and/or region dropped) would isolate fewer
 *      than k farmers; then it is withheld entirely (BR-136i).
 *   2. Crops below k are folded together into `other`, which is released only if the folded
 *      crops TOGETHER have >= k distinct farmers and pass the same differencing check; it names
 *      no crop and does not say how many crops it folds.
 *   3. `totals` are computed over the released groups only. If they also included suppressed
 *      crops, "total minus visible rows" would hand back exactly the data step 1 suppressed.
 *      `totals.farmers` is withheld (null) when "total minus one released group" is 1..k-1.
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
  /** Farmers with a planting of this crop inside the requested slice. */
  farmers: Set<number>;
  /** Grams inside the slice. */
  grams: number;
  /** Farmers a coarser slice would add or change (see CropFarmerPlantingRow). */
  outsideMonth: Set<number>;
  outsideRegion: Set<number>;
  outsideSlice: Set<number>;
}

/** A set of farmers that may be derived by a caller: either nobody, or at least k farmers. */
const isSafeGroupSize = (size: number, k: number): boolean => size === 0 || size >= k;

function union(sets: Iterable<Set<number>>): Set<number> {
  const out = new Set<number>();
  for (const s of sets) for (const v of s) out.add(v);
  return out;
}

/**
 * BR-136i, slice differencing: a group released in a filtered slice must not let a caller
 * subtract it from the same group in a coarser slice (month dropped, region dropped, or both)
 * and isolate fewer than k farmers. For each coarser slice, the farmers who have a planting of
 * these crops there but outside the requested slice must be nobody or at least k. With no month
 * and no region filter every outside set is empty, so the unfiltered summary is unaffected.
 */
function survivesDifferencing(groups: CropGroup[], k: number): boolean {
  return (
    isSafeGroupSize(union(groups.map((g) => g.outsideMonth)).size, k) &&
    isSafeGroupSize(union(groups.map((g) => g.outsideRegion)).size, k) &&
    isSafeGroupSize(union(groups.map((g) => g.outsideSlice)).size, k)
  );
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
      // BR-136h, the region gate: a region is accepted only if it reaches k on its own, counted
      // exactly as the filters endpoint counts it. Below k (or unknown) nothing is read and the
      // answer is the same empty summary in both cases, so the response cannot tell a small
      // region from a nonexistent one.
      const regionAccepted =
        query.region === undefined || (await repo.countRegionFarmers(db, query.region)) >= minGroupSize;
      const rows = regionAccepted ? await repo.listCropFarmerPlantings(db, filters) : [];

      const groups = new Map<string, CropGroup>();
      for (const r of rows) {
        let group = groups.get(r.cropMasterId);
        if (group === undefined) {
          group = {
            cropMasterId: r.cropMasterId,
            cropName: r.cropName,
            farmers: new Set(),
            grams: 0,
            outsideMonth: new Set(),
            outsideRegion: new Set(),
            outsideSlice: new Set(),
          };
          groups.set(r.cropMasterId, group);
        }
        if (r.inSlice) group.farmers.add(r.farmerKey);
        group.grams += r.quantityGrams;
        if (r.outsideMonth) group.outsideMonth.add(r.farmerKey);
        if (r.outsideRegion) group.outsideRegion.add(r.farmerKey);
        if (r.outsideSlice) group.outsideSlice.add(r.farmerKey);
      }

      // A crop at k that fails the differencing check is withheld outright: folding it into
      // `other` or counting it in the totals would hand the same numbers back by subtraction.
      const released: CropGroup[] = [];
      const small: CropGroup[] = [];
      for (const group of groups.values()) {
        if (group.farmers.size === 0) continue; // only outside the slice
        if (group.farmers.size < minGroupSize) small.push(group);
        else if (survivesDifferencing([group], minGroupSize)) released.push(group);
      }

      const smallFarmers = union(small.map((g) => g.farmers));
      const smallGrams = small.reduce((sum, g) => sum + g.grams, 0);
      const otherReleased =
        small.length > 0 && smallFarmers.size >= minGroupSize && survivesDifferencing(small, minGroupSize);

      // Totals over released groups only (rule 3 above).
      const releasedGroups: Array<Set<number>> = released.map((g) => g.farmers);
      if (otherReleased) releasedGroups.push(smallFarmers);
      const releasedFarmers = union(releasedGroups);
      const releasedGrams =
        released.reduce((sum, g) => sum + g.grams, 0) + (otherReleased ? smallGrams : 0);
      // BR-136i: "farmer total minus one released group" must be nobody or at least k farmers,
      // otherwise the total is withheld (null). Kilograms are a plain sum of released groups, so
      // subtracting from them only ever yields released numbers.
      const farmersTotalSafe = releasedGroups.every((g) =>
        isSafeGroupSize(releasedFarmers.size - g.size, minGroupSize),
      );

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
          farmers: farmersTotalSafe ? releasedFarmers.size : null,
          totalPlantedKg: gramsToKg(releasedGrams),
          // Named rows only: how many crops were folded into `other` is not released (BR-136i).
          crops: released.length,
        },
        byCrop,
        other: otherReleased ? { farmers: smallFarmers.size, quantityKg: gramsToKg(smallGrams) } : null,
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
