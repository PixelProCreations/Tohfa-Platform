/**
 * farms.repo — SQL only.
 *
 * Boundary writes/reads follow the exact PostGIS pattern already established
 * in farmer-applications.service.ts's approval-time backfill (the one place
 * `farms` was written before this module existed): a GeoJSON polygon is
 * written with `ST_SetSRID(ST_GeomFromGeoJSON($n::json), 4326)::geography`
 * and read back with `ST_AsGeoJSON(boundary)::json`, so the service gets a
 * plain `{ type: 'Polygon', coordinates: [...] }` with no manual parsing.
 *
 * No authorization decisions live here — the service verifies ownership
 * (`farms.farmer_id` / `plots.farm_id -> farms.farmer_id`) BEFORE calling
 * into this file. `update`/`updatePlot`/`softDelete`/`deletePlot` still key
 * every statement off the row's own primary key (and, for plots, `farm_id`
 * too) so a mutation can never silently touch a different aggregate.
 */
import type { Executor } from '../../db/pool.js';
import type { ScopedWhere } from '../../rbac/requirePermission.js';
import type { GeoJsonPolygon } from './farms.schema.js';

// --------------------------------------------------------------------------
// farms
// --------------------------------------------------------------------------

/** Raw row shape as it comes out of Postgres. Never leaves this file. */
interface FarmRow {
  id: string;
  farmer_id: string;
  name: string;
  survey_number: string | null;
  area_acres: string | null;
  centroid_lat: string | null;
  centroid_lng: string | null;
  boundary_geojson: GeoJsonPolygon | null;
  boundary_area_acres: string | null;
  boundary_drawn_by: string | null;
  boundary_drawn_at: Date | null;
  boundary_version: number;
  address: string | null;
  village: string | null;
  taluk: string | null;
  district: string;
  is_primary: boolean;
  water_sources: string[];
  land_boundary_context: string[];
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface Farm {
  id: string;
  farmerId: string;
  name: string;
  surveyNumber: string | null;
  areaAcres: number | null;
  centroidLat: number | null;
  centroidLng: number | null;
  boundary: GeoJsonPolygon | null;
  boundaryAreaAcres: number | null;
  boundaryDrawnBy: string | null;
  boundaryDrawnAt: string | null;
  boundaryVersion: number;
  address: string | null;
  village: string | null;
  taluk: string | null;
  district: string;
  isPrimary: boolean;
  waterSources: string[];
  landBoundaryContext: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface FarmWithPlotCount extends Farm {
  plotCount: number;
}

function toFarm(row: FarmRow): Farm {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    name: row.name,
    surveyNumber: row.survey_number,
    // NUMERIC columns come back as strings (db/pool.ts type parser override).
    areaAcres: row.area_acres === null ? null : Number(row.area_acres),
    centroidLat: row.centroid_lat === null ? null : Number(row.centroid_lat),
    centroidLng: row.centroid_lng === null ? null : Number(row.centroid_lng),
    boundary: row.boundary_geojson,
    boundaryAreaAcres: row.boundary_area_acres === null ? null : Number(row.boundary_area_acres),
    boundaryDrawnBy: row.boundary_drawn_by,
    boundaryDrawnAt: row.boundary_drawn_at === null ? null : row.boundary_drawn_at.toISOString(),
    boundaryVersion: row.boundary_version,
    address: row.address,
    village: row.village,
    taluk: row.taluk,
    district: row.district,
    isPrimary: row.is_primary,
    waterSources: row.water_sources,
    landBoundaryContext: row.land_boundary_context,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const FARM_COLUMNS = `
  f.id, f.farmer_id, f.name, f.survey_number, f.area_acres,
  f.centroid_lat, f.centroid_lng,
  ST_AsGeoJSON(f.boundary)::json AS boundary_geojson,
  f.boundary_area_acres, f.boundary_drawn_by, f.boundary_drawn_at, f.boundary_version,
  f.address, f.village, f.taluk, f.district, f.is_primary,
  f.water_sources, f.land_boundary_context, f.notes,
  f.created_at, f.updated_at
`;

export interface InsertFarmParams {
  farmerId: string;
  name: string;
  areaAcres: number | null;
  village: string | null;
  taluk: string | null;
  district: string | null;
  boundary: GeoJsonPolygon | null;
  boundaryAreaAcres: number | null;
  /** Non-null only when `boundary` is also supplied. */
  boundaryDrawnBy: string | null;
}

/** A boundary (re)draw, computed by the service. `geojson: null` clears it. */
export interface BoundaryPatch {
  geojson: GeoJsonPolygon | null;
  boundaryAreaAcres: number | null;
  /** Non-null only when `geojson` is non-null. */
  drawnBy: string | null;
}

export interface FarmPatch {
  name?: string;
  areaAcres?: number;
  village?: string;
  taluk?: string;
  district?: string;
  waterSources?: string[];
  landBoundaryContext?: string[];
  notes?: string | null;
  boundaryUpdate?: BoundaryPatch;
}

// --------------------------------------------------------------------------
// plots
// --------------------------------------------------------------------------

interface PlotRow {
  id: string;
  farm_id: string;
  name: string;
  area_acres: string | null;
  soil_type: string | null;
  sun_exposure: string | null;
  irrigation_type: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface Plot {
  id: string;
  farmId: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  sunExposure: string | null;
  irrigationType: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function toPlot(row: PlotRow): Plot {
  return {
    id: row.id,
    farmId: row.farm_id,
    name: row.name,
    areaAcres: row.area_acres === null ? null : Number(row.area_acres),
    soilType: row.soil_type,
    sunExposure: row.sun_exposure,
    irrigationType: row.irrigation_type,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const PLOT_COLUMNS = `
  p.id, p.farm_id, p.name, p.area_acres, p.soil_type, p.sun_exposure, p.irrigation_type,
  p.created_at, p.updated_at
`;

export interface InsertPlotParams {
  farmId: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  sunExposure: string | null;
  irrigationType: string | null;
}

export interface PlotPatch {
  name?: string;
  areaAcres?: number;
  soilType?: string;
  sunExposure?: string;
  irrigationType?: string;
}

// --------------------------------------------------------------------------
// repo
// --------------------------------------------------------------------------

export interface FarmsRepo {
  listByScope(db: Executor, scope: ScopedWhere): Promise<FarmWithPlotCount[]>;
  findById(db: Executor, farmId: string): Promise<Farm | null>;
  insert(db: Executor, params: InsertFarmParams): Promise<Farm>;
  update(db: Executor, farmId: string, patch: FarmPatch): Promise<Farm | null>;
  softDelete(db: Executor, farmId: string): Promise<boolean>;
  listPlots(db: Executor, farmId: string): Promise<Plot[]>;
  findPlotById(db: Executor, farmId: string, plotId: string): Promise<Plot | null>;
  insertPlot(db: Executor, params: InsertPlotParams): Promise<Plot>;
  updatePlot(db: Executor, farmId: string, plotId: string, patch: PlotPatch): Promise<Plot | null>;
  deletePlot(db: Executor, farmId: string, plotId: string): Promise<boolean>;
}

export const farmsRepo: FarmsRepo = {
  async listByScope(db, scope) {
    const result = await db.query<FarmRow & { plot_count: string }>(
      `SELECT ${FARM_COLUMNS}, COALESCE(pc.cnt, 0)::int AS plot_count
         FROM farms f
         LEFT JOIN (
           SELECT farm_id, COUNT(*)::int AS cnt FROM plots GROUP BY farm_id
         ) pc ON pc.farm_id = f.id
        WHERE f.deleted_at IS NULL AND ${scope.sql}
        ORDER BY f.is_primary DESC, f.created_at ASC`,
      scope.params,
    );
    return result.rows.map((row) => ({ ...toFarm(row), plotCount: Number(row.plot_count) }));
  },

  async findById(db, farmId) {
    const result = await db.query<FarmRow>(
      `SELECT ${FARM_COLUMNS} FROM farms f WHERE f.id = $1 AND f.deleted_at IS NULL LIMIT 1`,
      [farmId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toFarm(row);
  },

  async insert(db, params) {
    const boundaryJson = params.boundary === null ? null : JSON.stringify(params.boundary);
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO farms (
         farmer_id, name, area_acres, village, taluk, district,
         boundary, boundary_area_acres, boundary_drawn_by, boundary_drawn_at
       )
       VALUES (
         $1, $2, $3, $4, $5, COALESCE($6, 'The Nilgiris'),
         CASE WHEN $7::json IS NULL THEN NULL
              ELSE ST_SetSRID(ST_GeomFromGeoJSON($7::json), 4326)::geography END,
         $8, $9,
         CASE WHEN $7::json IS NULL THEN NULL ELSE now() END
       )
       RETURNING id`,
      [
        params.farmerId,
        params.name,
        params.areaAcres,
        params.village,
        params.taluk,
        params.district,
        boundaryJson,
        params.boundaryAreaAcres,
        params.boundaryDrawnBy,
      ],
    );
    const id = inserted.rows[0]?.id;
    if (id === undefined) throw new Error('farms insert returned no row');
    const farm = await this.findById(db, id);
    if (farm === null) throw new Error('farms insert returned no row on read-back');
    return farm;
  },

  async update(db, farmId, patch) {
    const setClauses: string[] = ['updated_at = now()'];
    const values: unknown[] = [farmId];
    let idx = 2;

    const scalarColumns: Array<[keyof FarmPatch, string]> = [
      ['name', 'name'],
      ['areaAcres', 'area_acres'],
      ['village', 'village'],
      ['taluk', 'taluk'],
      ['district', 'district'],
      ['notes', 'notes'],
    ];
    for (const [key, column] of scalarColumns) {
      const value = patch[key];
      if (value === undefined) continue;
      setClauses.push(`${column} = $${idx}`);
      values.push(value);
      idx += 1;
    }

    if (patch.waterSources !== undefined) {
      setClauses.push(`water_sources = $${idx}::text[]`);
      values.push(patch.waterSources);
      idx += 1;
    }
    if (patch.landBoundaryContext !== undefined) {
      setClauses.push(`land_boundary_context = $${idx}::text[]`);
      values.push(patch.landBoundaryContext);
      idx += 1;
    }

    if (patch.boundaryUpdate !== undefined) {
      const geojsonIdx = idx;
      idx += 1;
      values.push(
        patch.boundaryUpdate.geojson === null ? null : JSON.stringify(patch.boundaryUpdate.geojson),
      );
      setClauses.push(
        `boundary = CASE WHEN $${geojsonIdx}::json IS NULL THEN NULL
                         ELSE ST_SetSRID(ST_GeomFromGeoJSON($${geojsonIdx}::json), 4326)::geography END`,
      );
      setClauses.push(`boundary_area_acres = $${idx}`);
      values.push(patch.boundaryUpdate.boundaryAreaAcres);
      idx += 1;
      setClauses.push(`boundary_drawn_by = $${idx}::uuid`);
      values.push(patch.boundaryUpdate.drawnBy);
      idx += 1;
      setClauses.push(
        `boundary_drawn_at = CASE WHEN $${geojsonIdx}::json IS NULL THEN NULL ELSE now() END`,
      );
      setClauses.push('boundary_version = boundary_version + 1');
    }

    const result = await db.query<{ id: string }>(
      `UPDATE farms SET ${setClauses.join(', ')} WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      values,
    );
    if (result.rowCount === 0) return null;
    return this.findById(db, farmId);
  },

  async softDelete(db, farmId) {
    const result = await db.query(
      `UPDATE farms SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [farmId],
    );
    return result.rowCount === 1;
  },

  async listPlots(db, farmId) {
    const result = await db.query<PlotRow>(
      `SELECT ${PLOT_COLUMNS} FROM plots p WHERE p.farm_id = $1 ORDER BY p.created_at ASC`,
      [farmId],
    );
    return result.rows.map(toPlot);
  },

  async findPlotById(db, farmId, plotId) {
    const result = await db.query<PlotRow>(
      `SELECT ${PLOT_COLUMNS} FROM plots p WHERE p.farm_id = $1 AND p.id = $2 LIMIT 1`,
      [farmId, plotId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toPlot(row);
  },

  async insertPlot(db, params) {
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO plots (farm_id, name, area_acres, soil_type, sun_exposure, irrigation_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [params.farmId, params.name, params.areaAcres, params.soilType, params.sunExposure, params.irrigationType],
    );
    const id = inserted.rows[0]?.id;
    if (id === undefined) throw new Error('plots insert returned no row');
    const plot = await this.findPlotById(db, params.farmId, id);
    if (plot === null) throw new Error('plots insert returned no row on read-back');
    return plot;
  },

  async updatePlot(db, farmId, plotId, patch) {
    const setClauses: string[] = ['updated_at = now()'];
    const values: unknown[] = [farmId, plotId];
    let idx = 3;

    const scalarColumns: Array<[keyof PlotPatch, string]> = [
      ['name', 'name'],
      ['areaAcres', 'area_acres'],
      ['soilType', 'soil_type'],
      ['sunExposure', 'sun_exposure'],
      ['irrigationType', 'irrigation_type'],
    ];
    for (const [key, column] of scalarColumns) {
      const value = patch[key];
      if (value === undefined) continue;
      setClauses.push(`${column} = $${idx}`);
      values.push(value);
      idx += 1;
    }

    const result = await db.query<{ id: string }>(
      `UPDATE plots SET ${setClauses.join(', ')} WHERE farm_id = $1 AND id = $2 RETURNING id`,
      values,
    );
    if (result.rowCount === 0) return null;
    return this.findPlotById(db, farmId, plotId);
  },

  async deletePlot(db, farmId, plotId) {
    const result = await db.query(`DELETE FROM plots WHERE farm_id = $1 AND id = $2`, [farmId, plotId]);
    return result.rowCount === 1;
  },
};
