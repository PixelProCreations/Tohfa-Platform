import type { Executor } from '../../db/pool.js';

export interface CropMasterTaxonomyRow {
  cropMasterId: string;
  cropName: string;
  category: string;
  seasonMonths: number[] | null;
}

export interface ActivePlantingRow {
  cropMasterId: string;
  plotId: string;
  plotName: string;
  areaAcres: number | null;
  expectedYieldKg: number | null;
}

export interface HarvestStatRow {
  cropMasterId: string;
  pastHarvestCount: number;
  lastHarvestedOn: string | null;
}

export interface ConsecutivePlantingRow {
  cropMasterId: string;
  plotName: string;
}

export interface CropPlanningInsightRepo {
  listCropMasterTaxonomy(db: Executor, farmerId: string): Promise<CropMasterTaxonomyRow[]>;
  listFarmerActivePlantings(db: Executor, farmerId: string): Promise<ActivePlantingRow[]>;
  getFarmerHarvestStats(db: Executor, farmerId: string): Promise<HarvestStatRow[]>;
  getFarmerConsecutivePlantings(db: Executor, farmerId: string): Promise<ConsecutivePlantingRow[]>;
}

export const cropPlanningInsightRepo: CropPlanningInsightRepo = {
  async listCropMasterTaxonomy(db: Executor, farmerId: string): Promise<CropMasterTaxonomyRow[]> {
    interface DbRow {
      crop_master_id: string;
      crop_name: string;
      category_name: string;
      season_months: number[] | null;
    }

    const result = await db.query<DbRow>(
      `SELECT cm.id AS crop_master_id,
              cm.name AS crop_name,
              c.name AS category_name,
              cm.season_months
         FROM crop_master cm
         JOIN categories c ON c.id = cm.category_id
        WHERE (
          cm.is_active = true
          OR cm.id IN (
            SELECT fc.crop_id
              FROM farm_crops fc
              JOIN plots p ON p.id = fc.plot_id
              JOIN farms f ON f.id = p.farm_id
             WHERE f.farmer_id = $1
               AND fc.deleted_at IS NULL
               AND p.deleted_at IS NULL
               AND f.deleted_at IS NULL
          )
        )
          AND cm.deleted_at IS NULL
        ORDER BY cm.name ASC`,
      [farmerId],
    );

    return result.rows.map((r) => ({
      cropMasterId: r.crop_master_id,
      cropName: r.crop_name,
      category: r.category_name,
      seasonMonths: r.season_months,
    }));
  },

  async listFarmerActivePlantings(db: Executor, farmerId: string): Promise<ActivePlantingRow[]> {
    interface DbRow {
      crop_master_id: string;
      plot_id: string;
      plot_name: string;
      area_acres: string | number | null;
      expected_yield_kg: string | number | null;
    }

    const result = await db.query<DbRow>(
      `SELECT fc.crop_id AS crop_master_id,
              fc.plot_id,
              p.name AS plot_name,
              p.area_acres,
              fc.expected_yield_kg
         FROM farm_crops fc
         JOIN plots p ON p.id = fc.plot_id
         JOIN farms f ON f.id = p.farm_id
        WHERE f.farmer_id = $1
          AND fc.status IN ('PLANNED', 'GROWING')
          AND fc.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND f.deleted_at IS NULL
        ORDER BY p.name ASC`,
      [farmerId],
    );

    return result.rows.map((r) => ({
      cropMasterId: r.crop_master_id,
      plotId: r.plot_id,
      plotName: r.plot_name,
      areaAcres: r.area_acres === null ? null : Number(r.area_acres),
      expectedYieldKg: r.expected_yield_kg === null ? null : Number(r.expected_yield_kg),
    }));
  },

  async getFarmerHarvestStats(db: Executor, farmerId: string): Promise<HarvestStatRow[]> {
    interface DbRow {
      crop_master_id: string;
      past_harvest_count: string | number;
      last_harvested_on: string | null;
    }

    const result = await db.query<DbRow>(
      `SELECT fc.crop_id AS crop_master_id,
              COUNT(*)::int AS past_harvest_count,
              MAX(fc.actual_harvest_on)::text AS last_harvested_on
         FROM farm_crops fc
         JOIN plots p ON p.id = fc.plot_id
         JOIN farms f ON f.id = p.farm_id
        WHERE f.farmer_id = $1
          AND fc.status = 'HARVESTED'
          AND fc.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND f.deleted_at IS NULL
        GROUP BY fc.crop_id`,
      [farmerId],
    );

    return result.rows.map((r) => ({
      cropMasterId: r.crop_master_id,
      pastHarvestCount: Number(r.past_harvest_count),
      lastHarvestedOn: r.last_harvested_on,
    }));
  },

  async getFarmerConsecutivePlantings(db: Executor, farmerId: string): Promise<ConsecutivePlantingRow[]> {
    interface DbRow {
      crop_master_id: string;
      plot_name: string;
    }

    const result = await db.query<DbRow>(
      `WITH ranked_plantings AS (
         SELECT p.id AS plot_id,
                p.name AS plot_name,
                fc.crop_id,
                ROW_NUMBER() OVER (
                  PARTITION BY p.id
                  ORDER BY COALESCE(fc.planted_on, fc.created_at::date) DESC, fc.created_at DESC
                ) AS rn
           FROM farm_crops fc
           JOIN plots p ON p.id = fc.plot_id
           JOIN farms f ON f.id = p.farm_id
          WHERE f.farmer_id = $1
            AND fc.deleted_at IS NULL
            AND p.deleted_at IS NULL
            AND f.deleted_at IS NULL
       )
       SELECT r1.crop_id AS crop_master_id,
              r1.plot_name
         FROM ranked_plantings r1
         JOIN ranked_plantings r2 ON r1.plot_id = r2.plot_id AND r2.rn = 2
        WHERE r1.rn = 1 AND r1.crop_id = r2.crop_id
        ORDER BY r1.plot_name ASC`,
      [farmerId],
    );

    return result.rows.map((r) => ({
      cropMasterId: r.crop_master_id,
      plotName: r.plot_name,
    }));
  },
};
