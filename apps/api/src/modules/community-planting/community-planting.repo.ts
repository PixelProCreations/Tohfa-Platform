import type { Executor } from '../../db/pool.js';

/** The system_config key holding the minimum distinct-farmer group size (BR-136). */
export const COMMUNITY_MIN_GROUP_SIZE_KEY = 'community_planting_min_farmers';

export interface CommunityPlantingFilters {
  cropId?: string;
  month?: number;
  region?: string;
}

/**
 * One row per (crop, farmer) over the active plantings that match the filters.
 *
 * `farmerKey` is NOT a farmer id: it is a DENSE_RANK computed inside the query, meaningful only
 * within one result set, so the service can count distinct farmers without ever holding a real
 * farmer identifier. `quantityGrams` is the summed expected yield in integer grams, so the
 * service adds integers, never floats.
 */
export interface CropFarmerPlantingRow {
  cropMasterId: string;
  cropName: string;
  farmerKey: number;
  quantityGrams: number;
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
  listActiveCrops(db: Executor): Promise<FilterCropRow[]>;
}

/**
 * Taluk is free text on `farms`. Grouping and filtering both use this one normalisation
 * (trimmed, case-folded, initcapped) so "kotagiri " and "Kotagiri" are one region.
 */
const REGION_EXPR = `initcap(lower(btrim(fa.taluk)))`;

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
    }
    // `month` is the calendar month of planted_on (any year); a planting with no planted_on
    // cannot match a month filter. The window function runs after GROUP BY, so the rank is over
    // the grouped farmer ids and the real id never leaves the database.
    const result = await db.query<DbRow>(
      `SELECT fc.crop_id AS crop_master_id,
              cm.name    AS crop_name,
              DENSE_RANK() OVER (ORDER BY fa.farmer_id) AS farmer_key,
              ROUND(COALESCE(SUM(fc.expected_yield_kg), 0) * 1000)::bigint AS quantity_grams
       ${ACTIVE_PLANTINGS_FROM}
          AND ($1::uuid IS NULL OR fc.crop_id = $1::uuid)
          AND ($2::int  IS NULL OR EXTRACT(MONTH FROM fc.planted_on) = $2::int)
          AND ($3::text IS NULL OR ${REGION_EXPR} = initcap(lower(btrim($3::text))))
        GROUP BY fc.crop_id, cm.name, fa.farmer_id`,
      [filters.cropId ?? null, filters.month ?? null, filters.region ?? null],
    );
    return result.rows.map((r) => ({
      cropMasterId: r.crop_master_id,
      cropName: r.crop_name,
      farmerKey: Number(r.farmer_key),
      quantityGrams: Number(r.quantity_grams),
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
          AND fa.taluk IS NOT NULL
          AND btrim(fa.taluk) <> ''
        GROUP BY 1
        ORDER BY 1`,
    );
    return result.rows.map((r) => ({ region: r.region, farmers: Number(r.farmers) }));
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
