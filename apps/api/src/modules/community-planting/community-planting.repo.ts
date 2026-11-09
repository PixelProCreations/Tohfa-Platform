import type { Executor } from '../../db/pool.js';

/** The system_config key holding the minimum distinct-farmer group size (BR-136). */
export const COMMUNITY_MIN_GROUP_SIZE_KEY = 'community_planting_min_farmers';

export interface CommunityPlantingFilters {
  cropId?: string;
  month?: number;
  region?: string;
}

/**
 * One row per (crop, farmer) over the active plantings of the crop filter (if any), whether or
 * not they fall inside the month/region slice.
 *
 * `farmerKey` is NOT a farmer id: it is a DENSE_RANK computed inside the query, meaningful only
 * within one result set, so the service can count distinct farmers without ever holding a real
 * farmer identifier. `quantityGrams` is the summed expected yield, in integer grams, of the
 * plantings INSIDE the slice, so the service adds integers, never floats.
 *
 * The outside flags exist only for the differencing check (BR-136i): each says whether this
 * farmer has a planting of this crop in a coarser slice the caller could also ask for, but not in
 * the requested one. "Coarser" means the same request with the month filter dropped
 * (`outsideMonth`), the region filter dropped (`outsideRegion`), or both dropped
 * (`outsideSlice`). A filter that is not set never makes a planting "outside".
 */
export interface CropFarmerPlantingRow {
  cropMasterId: string;
  cropName: string;
  farmerKey: number;
  quantityGrams: number;
  inSlice: boolean;
  outsideMonth: boolean;
  outsideRegion: boolean;
  outsideSlice: boolean;
}

export interface RegionFarmerCountRow {
  region: string;
  farmers: number;
}

export interface FilterCropRow {
  cropMasterId: string;
  cropName: string;
}

export interface CommunityPlantingRepo {
  /** Raw jsonb value of the min-group-size key, or `undefined` when the key is missing. */
  getMinGroupSize(db: Executor): Promise<unknown>;
  listCropFarmerPlantings(db: Executor, filters: CommunityPlantingFilters): Promise<CropFarmerPlantingRow[]>;
  listRegionFarmerCounts(db: Executor): Promise<RegionFarmerCountRow[]>;
  /**
   * Distinct farmers with an active planting in `region` (normalised like REGION_EXPR), counted
   * exactly as `listRegionFarmerCounts` counts them; 0 for a region that does not exist.
   */
  countRegionFarmers(db: Executor, region: string): Promise<number>;
  listActiveCrops(db: Executor): Promise<FilterCropRow[]>;
}

/**
 * The region of a planting (BR-136 decision 1, default chosen, owner may revise): the farm's
 * taluk, falling back to the farmer's profile taluk when the farm has none. Farms created by the
 * application-approval path (farmer-applications.service.ts) carry only village/district, while
 * the same approval fills `farmers.taluk`; without the fallback those farmers would be in no
 * region at all. A blank farm taluk counts as none. Taluk is free text, so grouping and
 * filtering both use this one normalisation (trimmed, case-folded, initcapped) and
 * "kotagiri " and "Kotagiri" are one region. Every query here uses this same expression, so the
 * summary, the region gate and the filter options always agree.
 */
const REGION_EXPR = `initcap(lower(btrim(COALESCE(NULLIF(btrim(fa.taluk), ''), fr.taluk))))`;

/** The normalised form of a caller-supplied region, the same normalisation as REGION_EXPR. */
const REGION_PARAM = (placeholder: string) => `initcap(lower(btrim(${placeholder}::text)))`;

/**
 * The rows that count as "the community is growing" (BR-136):
 *   - planting status PLANNED or GROWING (the same "active" definition as crop-planning-insight),
 *   - nothing soft-deleted along farm_crops -> plots -> farms -> farmers, nor the crop itself,
 *   - the farmer's application is APPROVED (an applicant is not yet a TOHFA farmer).
 */
const ACTIVE_PLANTINGS_FROM = `
  FROM farm_crops fc
  JOIN plots p        ON p.id = fc.plot_id     AND p.deleted_at IS NULL
  JOIN farms fa       ON fa.id = p.farm_id     AND fa.deleted_at IS NULL
  JOIN farmers fr     ON fr.id = fa.farmer_id  AND fr.deleted_at IS NULL
                     AND fr.application_status = 'APPROVED'
  JOIN crop_master cm ON cm.id = fc.crop_id    AND cm.deleted_at IS NULL
 WHERE fc.deleted_at IS NULL
   AND fc.status IN ('PLANNED', 'GROWING')`;

export const communityPlantingRepo: CommunityPlantingRepo = {
  async getMinGroupSize(db) {
    const result = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = $1 LIMIT 1`,
      [COMMUNITY_MIN_GROUP_SIZE_KEY],
    );
    return result.rows.length === 0 ? undefined : result.rows[0]!.value;
  },

  async listCropFarmerPlantings(db, filters) {
    interface DbRow {
      crop_master_id: string;
      crop_name: string;
      farmer_key: string | number;
      quantity_grams: string | number;
      in_slice: boolean;
      outside_month: boolean;
      outside_region: boolean;
      outside_slice: boolean;
    }
    // `m` / `r`: does the planting match the month / region filter (true when that filter is not
    // set). `month` is the calendar month of planted_on (any year); a planting with no planted_on
    // cannot match a month filter, because farm_crops has no planned-sowing date to fall back
    // on (BR-136 decision 2). Only the crop filter narrows the rows: plantings outside the
    // month/region slice are kept so the service can see who a coarser slice would add
    // (BR-136i), and they contribute no grams. The window function runs after GROUP BY, so the
    // rank is over the grouped farmer ids and the real id never leaves the database.
    const result = await db.query<DbRow>(
      `WITH p AS (
         SELECT fc.crop_id AS crop_id,
                cm.name    AS crop_name,
                fa.farmer_id AS farmer_id,
                fc.expected_yield_kg AS expected_yield_kg,
                ($2::int IS NULL OR COALESCE(EXTRACT(MONTH FROM fc.planted_on) = $2::int, false)) AS m,
                ($3::text IS NULL OR COALESCE(${REGION_EXPR} = ${REGION_PARAM('$3')}, false)) AS r
         ${ACTIVE_PLANTINGS_FROM}
            AND ($1::uuid IS NULL OR fc.crop_id = $1::uuid)
       )
       SELECT crop_id AS crop_master_id,
              crop_name,
              DENSE_RANK() OVER (ORDER BY farmer_id) AS farmer_key,
              ROUND(COALESCE(SUM(expected_yield_kg) FILTER (WHERE m AND r), 0) * 1000)::bigint AS quantity_grams,
              bool_or(m AND r)       AS in_slice,
              bool_or(r AND NOT m)   AS outside_month,
              bool_or(m AND NOT r)   AS outside_region,
              bool_or(NOT (m AND r)) AS outside_slice
         FROM p
        GROUP BY crop_id, crop_name, farmer_id`,
      [filters.cropId ?? null, filters.month ?? null, filters.region ?? null],
    );
    return result.rows.map((r) => ({
      cropMasterId: r.crop_master_id,
      cropName: r.crop_name,
      farmerKey: Number(r.farmer_key),
      quantityGrams: Number(r.quantity_grams),
      inSlice: r.in_slice === true,
      outsideMonth: r.outside_month === true,
      outsideRegion: r.outside_region === true,
      outsideSlice: r.outside_slice === true,
    }));
  },

  async listRegionFarmerCounts(db) {
    interface DbRow {
      region: string;
      farmers: number;
    }
    const result = await db.query<DbRow>(
      `SELECT ${REGION_EXPR} AS region,
              COUNT(DISTINCT fa.farmer_id)::int AS farmers
       ${ACTIVE_PLANTINGS_FROM}
          AND ${REGION_EXPR} IS NOT NULL
          AND ${REGION_EXPR} <> ''
        GROUP BY 1
        ORDER BY 1`,
    );
    return result.rows.map((r) => ({ region: r.region, farmers: Number(r.farmers) }));
  },

  async countRegionFarmers(db, region) {
    const result = await db.query<{ farmers: number }>(
      `SELECT COUNT(DISTINCT fa.farmer_id)::int AS farmers
       ${ACTIVE_PLANTINGS_FROM}
          AND ${REGION_EXPR} = ${REGION_PARAM('$1')}`,
      [region],
    );
    return Number(result.rows[0]?.farmers ?? 0);
  },

  async listActiveCrops(db) {
    interface DbRow {
      id: string;
      name: string;
    }
    const result = await db.query<DbRow>(
      `SELECT id, name
         FROM crop_master
        WHERE is_active = true AND deleted_at IS NULL
        ORDER BY name ASC, id ASC`,
    );
    return result.rows.map((r) => ({ cropMasterId: r.id, cropName: r.name }));
  },
};
