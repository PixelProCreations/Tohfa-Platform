/**
 * crops.repo.ts is the ONLY place that writes SQL for the crops module.
 *
 *  - Every function takes an `Executor` first so the service can compose
 *    calls inside one transaction.
 *  - `findFarmCrop`/`updateFarmCrop` are addressed by `farmCropId` alone (no
 *    `plotId` in the URL for those routes), so ownership is derived in the
 *    query itself via `farm_crops -> plots -> farms.farmer_id` — a row owned
 *    by a different farmer is indistinguishable from a row that does not
 *    exist, exactly as farm-diary.repo.ts does for diary entries.
 *  - `deleted_at IS NULL` is on every farm_crops read (the table already has
 *    the column; a crop is retired by moving it to status FAILED, not by
 *    soft-deleting it — see crops.service.ts).
 *  - Rows are mapped to the wire shape here; snake_case never leaves this file.
 *
 * Schema: db/migrations/0004_produce_pricing_marketing.sql (farm_crops,
 * crop_master) plus db/migrations/0023_crops_extra_fields.sql (seed/grade
 * columns, BR-46's partial unique index).
 */
import type { Executor } from '../../db/pool.js';
import type {
  CreateCropMasterBody,
  CreateFarmCropBody,
  CropMasterResponse,
  FarmCropResponse,
  FarmCropStatus,
  PlotRotationHistoryResponse,
} from './crops.schema.js';

// ---------------------------------------------------------------------------
// Domain inputs / results
// ---------------------------------------------------------------------------

export interface CreateFarmCropData extends CreateFarmCropBody {
  plotId: string;
}

/** Only the keys present are written; `null` clears a nullable column. */
export interface UpdateFarmCropPatch {
  status?: FarmCropStatus | undefined;
  plantedOn?: string | null | undefined;
  expectedHarvestOn?: string | null | undefined;
  actualHarvestOn?: string | null | undefined;
  expectedYieldKg?: number | null | undefined;
  actualYieldKg?: number | null | undefined;
  seedVariety?: string | null | undefined;
  seedCompany?: string | null | undefined;
  seedQuantity?: number | null | undefined;
  seedQuantityUnit?: string | null | undefined;
  seedCostPaise?: number | null | undefined;
  expectedGrade?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface ListFarmCropsArgs {
  plotId: string;
  status?: FarmCropStatus | undefined;
  cursor?: FarmCropCursor | undefined;
  limit: number;
}

/** Keyset position for the list: (created_at, id), both DESC. */
export interface FarmCropCursor {
  createdAt: string;
  id: string;
}

export interface ListFarmCropsResult {
  items: FarmCropResponse[];
  next: FarmCropCursor | null;
}

export interface UpdateCropMasterPatch {
  name?: string | undefined;
  nameTa?: string | null | undefined;
  categoryId?: string | undefined;
  botanicalName?: string | null | undefined;
  seasonMonths?: number[] | null | undefined;
  shelfLifeDays?: number | null | undefined;
  iconKey?: string | null | undefined;
  isActive?: boolean | undefined;
}

// ---------------------------------------------------------------------------
// Interface — the service depends on THIS, which is what lets the tests run
// against a plain in-memory fake.
// ---------------------------------------------------------------------------

export interface CropsRepo {
  /**
   * Ownership is derived server-side — plots -> farms.farmer_id — never from
   * a client-supplied farmer id (root CLAUDE.md §2.1).
   */
  isPlotOwnedByFarmer(db: Executor, plotId: string, farmerId: string): Promise<boolean>;

  createFarmCrop(db: Executor, data: CreateFarmCropData): Promise<string>;

  /** Full farm_crops row (with crop_master display fields), owned by farmerId and not soft-deleted; else null. */
  findFarmCrop(db: Executor, farmerId: string, farmCropId: string): Promise<FarmCropResponse | null>;

  listFarmCrops(db: Executor, args: ListFarmCropsArgs): Promise<ListFarmCropsResult>;

  /**
   * Returns false when no live row owned by farmerId matched. Throws the raw
   * pg error (23505) on a BR-46 violation — the service translates it into
   * `CROP_PLOT_ALREADY_GROWING`.
   */
  updateFarmCrop(db: Executor, farmerId: string, farmCropId: string, patch: UpdateFarmCropPatch): Promise<boolean>;

  /** Most-recent-first planting history for a plot (BR-46's "one GROWING at a time" is what makes this a clean timeline). */
  getPlotRotationHistory(db: Executor, plotId: string): Promise<PlotRotationHistoryResponse['history']>;

  // --- Admin crop taxonomy ---
  listCropMaster(db: Executor, activeOnly: boolean): Promise<CropMasterResponse[]>;
  /** Any crop_master row (active or not) by id — used both for admin reads and the create-time existence check. */
  findCropMaster(db: Executor, id: string): Promise<CropMasterResponse | null>;
  findCropMasterBySlug(db: Executor, slug: string): Promise<CropMasterResponse | null>;
  createCropMaster(db: Executor, data: CreateCropMasterBody): Promise<CropMasterResponse>;
  updateCropMaster(db: Executor, id: string, patch: UpdateCropMasterPatch): Promise<CropMasterResponse | null>;
}

// ---------------------------------------------------------------------------
// Row types and mappers
// ---------------------------------------------------------------------------

interface CropMasterRow {
  id: string;
  slug: string;
  name: string;
  name_ta: string | null;
  category_id: string;
  botanical_name: string | null;
  default_unit: string;
  season_months: number[] | null;
  shelf_life_days: number | null;
  icon_key: string | null;
  is_active: boolean;
}

interface FarmCropRow {
  id: string;
  plot_id: string;
  crop_master_id: string;
  crop_name: string;
  crop_name_ta: string | null;
  crop_icon_key: string | null;
  status: FarmCropStatus;
  planted_on: string | null;
  expected_harvest_on: string | null;
  actual_harvest_on: string | null;
  expected_yield_kg: string | null;
  actual_yield_kg: string | null;
  seed_variety: string | null;
  seed_company: string | null;
  seed_quantity: string | null;
  seed_quantity_unit: string | null;
  seed_cost_paise: number | null;
  expected_grade: string | null;
  notes: string | null;
  created_at: Date;
  created_at_cursor: string;
  updated_at: Date | null;
}

interface RotationRow {
  farm_crop_id: string;
  crop_name: string;
  crop_icon_key: string | null;
  planted_on: string | null;
  actual_harvest_on: string | null;
  status: FarmCropStatus;
}

function toCropMaster(row: CropMasterRow): CropMasterResponse {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameTa: row.name_ta,
    categoryId: row.category_id,
    botanicalName: row.botanical_name,
    defaultUnit: row.default_unit,
    seasonMonths: row.season_months,
    shelfLifeDays: row.shelf_life_days,
    iconKey: row.icon_key,
    isActive: row.is_active,
  };
}

function toFarmCrop(row: FarmCropRow): FarmCropResponse {
  return {
    id: row.id,
    plotId: row.plot_id,
    cropMasterId: row.crop_master_id,
    cropName: row.crop_name,
    cropNameTa: row.crop_name_ta,
    cropIconKey: row.crop_icon_key,
    status: row.status,
    plantedOn: row.planted_on,
    expectedHarvestOn: row.expected_harvest_on,
    actualHarvestOn: row.actual_harvest_on,
    expectedYieldKg: row.expected_yield_kg === null ? null : Number(row.expected_yield_kg),
    actualYieldKg: row.actual_yield_kg === null ? null : Number(row.actual_yield_kg),
    seedVariety: row.seed_variety,
    seedCompany: row.seed_company,
    seedQuantity: row.seed_quantity === null ? null : Number(row.seed_quantity),
    seedQuantityUnit: row.seed_quantity_unit as FarmCropResponse['seedQuantityUnit'],
    seedCostPaise: row.seed_cost_paise,
    expectedGrade: row.expected_grade as FarmCropResponse['expectedGrade'],
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const CROP_MASTER_COLUMNS =
  'id, slug, name, name_ta, category_id, botanical_name, default_unit, season_months, shelf_life_days, icon_key, is_active';

/**
 * Joined to crop_master for the display fields the mobile crop screens
 * render (cropName/cropNameTa/cropIconKey) — never crop_master.hsn_code or a
 * bare category_id (crops.schema.ts's allow-list doctrine, same as BR-16's
 * catalog serializer).
 */
const FARM_CROP_SELECT = `
  SELECT fc.id, fc.plot_id, fc.crop_id AS crop_master_id,
         cm.name AS crop_name, cm.name_ta AS crop_name_ta, cm.icon_key AS crop_icon_key,
         fc.status,
         fc.planted_on::text AS planted_on,
         fc.expected_harvest_on::text AS expected_harvest_on,
         fc.actual_harvest_on::text AS actual_harvest_on,
         fc.expected_yield_kg, fc.actual_yield_kg,
         fc.seed_variety, fc.seed_company, fc.seed_quantity, fc.seed_quantity_unit, fc.seed_cost_paise,
         fc.expected_grade, fc.notes, fc.created_at,
         to_char(fc.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_cursor,
         fc.updated_at
    FROM farm_crops fc
    JOIN crop_master cm ON cm.id = fc.crop_id
`;

/**
 * Builds `SET col = $n, ...` from a patch. Column names come from the fixed
 * map below, never from the client; values are always positional params.
 */
function buildSet(
  patch: Record<string, unknown>,
  columns: Record<string, { column: string; cast?: string }>,
  startIndex: number,
): { sql: string; params: unknown[] } {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [field, spec] of Object.entries(columns)) {
    if (!(field in patch) || patch[field] === undefined) continue;
    params.push(patch[field]);
    sets.push(`${spec.column} = $${startIndex + params.length - 1}${spec.cast ?? ''}`);
  }
  return { sql: sets.join(', '), params };
}

const FARM_CROP_PATCH_COLUMNS: Record<string, { column: string; cast?: string }> = {
  status: { column: 'status' },
  plantedOn: { column: 'planted_on', cast: '::date' },
  expectedHarvestOn: { column: 'expected_harvest_on', cast: '::date' },
  actualHarvestOn: { column: 'actual_harvest_on', cast: '::date' },
  expectedYieldKg: { column: 'expected_yield_kg' },
  actualYieldKg: { column: 'actual_yield_kg' },
  seedVariety: { column: 'seed_variety' },
  seedCompany: { column: 'seed_company' },
  seedQuantity: { column: 'seed_quantity' },
  seedQuantityUnit: { column: 'seed_quantity_unit' },
  seedCostPaise: { column: 'seed_cost_paise' },
  expectedGrade: { column: 'expected_grade' },
  notes: { column: 'notes' },
};

const CROP_MASTER_PATCH_COLUMNS: Record<string, { column: string; cast?: string }> = {
  name: { column: 'name' },
  nameTa: { column: 'name_ta' },
  categoryId: { column: 'category_id' },
  botanicalName: { column: 'botanical_name' },
  seasonMonths: { column: 'season_months', cast: '::smallint[]' },
  shelfLifeDays: { column: 'shelf_life_days' },
  iconKey: { column: 'icon_key' },
  isActive: { column: 'is_active' },
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const cropsRepo: CropsRepo = {
  async isPlotOwnedByFarmer(db, plotId, farmerId) {
    const result = await db.query<{ ok: boolean }>(
      `SELECT true AS ok
         FROM plots p
         JOIN farms f ON f.id = p.farm_id
        WHERE p.id = $1 AND f.farmer_id = $2
          AND p.deleted_at IS NULL AND f.deleted_at IS NULL
        LIMIT 1`,
      [plotId, farmerId],
    );
    return result.rows.length > 0;
  },

  async createFarmCrop(db, data) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO farm_crops (
         plot_id, crop_id, planted_on, expected_harvest_on, expected_yield_kg,
         seed_variety, seed_company, seed_quantity, seed_quantity_unit, seed_cost_paise,
         expected_grade, notes
       )
       VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        data.plotId,
        data.cropMasterId,
        data.plantedOn ?? null,
        data.expectedHarvestOn ?? null,
        data.expectedYieldKg ?? null,
        data.seedVariety ?? null,
        data.seedCompany ?? null,
        data.seedQuantity ?? null,
        data.seedQuantityUnit ?? null,
        data.seedCostPaise ?? null,
        data.expectedGrade ?? null,
        data.notes ?? null,
      ],
    );
    return result.rows[0]!.id;
  },

  async findFarmCrop(db, farmerId, farmCropId) {
    const result = await db.query<FarmCropRow>(
      `${FARM_CROP_SELECT}
         JOIN plots p ON p.id = fc.plot_id
         JOIN farms f ON f.id = p.farm_id
        WHERE fc.id = $1 AND f.farmer_id = $2
          AND fc.deleted_at IS NULL AND p.deleted_at IS NULL AND f.deleted_at IS NULL
        LIMIT 1`,
      [farmCropId, farmerId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toFarmCrop(row);
  },

  async listFarmCrops(db, args) {
    const params: unknown[] = [args.plotId];
    const conditions: string[] = ['fc.plot_id = $1', 'fc.deleted_at IS NULL'];

    if (args.status !== undefined) {
      params.push(args.status);
      conditions.push(`fc.status = $${params.length}`);
    }
    if (args.cursor !== undefined) {
      params.push(args.cursor.createdAt, args.cursor.id);
      const n = params.length;
      conditions.push(`(fc.created_at, fc.id) < ($${n - 1}::timestamptz, $${n}::uuid)`);
    }

    params.push(args.limit + 1);
    const result = await db.query<FarmCropRow>(
      `${FARM_CROP_SELECT}
        WHERE ${conditions.join(' AND ')}
        ORDER BY fc.created_at DESC, fc.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > args.limit;
    const rows = hasMore ? result.rows.slice(0, args.limit) : result.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(toFarmCrop),
      next: hasMore && last !== undefined ? { createdAt: last.created_at_cursor, id: last.id } : null,
    };
  },

  async updateFarmCrop(db, farmerId, farmCropId, patch) {
    const set = buildSet({ ...patch }, FARM_CROP_PATCH_COLUMNS, 3);
    const setSql = set.sql.length > 0 ? `${set.sql}, updated_at = now()` : 'updated_at = now()';
    // Ownership is re-derived through the same plots/farms join as the read
    // path — a farmCropId belonging to a different farmer matches nothing
    // here either (root CLAUDE.md §2.1).
    const result = await db.query(
      `UPDATE farm_crops
          SET ${setSql}
        WHERE id = $1 AND deleted_at IS NULL
          AND plot_id IN (
            SELECT p.id FROM plots p JOIN farms f ON f.id = p.farm_id
             WHERE f.farmer_id = $2 AND p.deleted_at IS NULL AND f.deleted_at IS NULL
          )`,
      [farmCropId, farmerId, ...set.params],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async getPlotRotationHistory(db, plotId) {
    const result = await db.query<RotationRow>(
      `SELECT fc.id AS farm_crop_id, cm.name AS crop_name, cm.icon_key AS crop_icon_key,
              fc.planted_on::text AS planted_on, fc.actual_harvest_on::text AS actual_harvest_on,
              fc.status
         FROM farm_crops fc
         JOIN crop_master cm ON cm.id = fc.crop_id
        WHERE fc.plot_id = $1 AND fc.deleted_at IS NULL
        ORDER BY COALESCE(fc.planted_on, fc.created_at::date) DESC, fc.created_at DESC`,
      [plotId],
    );
    return result.rows.map((row) => ({
      farmCropId: row.farm_crop_id,
      cropName: row.crop_name,
      cropIconKey: row.crop_icon_key,
      plantedOn: row.planted_on,
      actualHarvestOn: row.actual_harvest_on,
      status: row.status,
    }));
  },

  async listCropMaster(db, activeOnly) {
    const result = await db.query<CropMasterRow>(
      `SELECT ${CROP_MASTER_COLUMNS}
         FROM crop_master
        WHERE deleted_at IS NULL ${activeOnly ? 'AND is_active = true' : ''}
        ORDER BY name`,
    );
    return result.rows.map(toCropMaster);
  },

  async findCropMaster(db, id) {
    const result = await db.query<CropMasterRow>(
      `SELECT ${CROP_MASTER_COLUMNS} FROM crop_master WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    const row = result.rows[0];
    return row === undefined ? null : toCropMaster(row);
  },

  async findCropMasterBySlug(db, slug) {
    const result = await db.query<CropMasterRow>(
      `SELECT ${CROP_MASTER_COLUMNS} FROM crop_master WHERE slug = $1 AND deleted_at IS NULL`,
      [slug],
    );
    const row = result.rows[0];
    return row === undefined ? null : toCropMaster(row);
  },

  async createCropMaster(db, data) {
    const result = await db.query<CropMasterRow>(
      `INSERT INTO crop_master (slug, name, name_ta, category_id, botanical_name, default_unit, season_months, shelf_life_days, icon_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7::smallint[], $8, $9)
       RETURNING ${CROP_MASTER_COLUMNS}`,
      [
        data.slug,
        data.name,
        data.nameTa ?? null,
        data.categoryId,
        data.botanicalName ?? null,
        data.defaultUnit,
        data.seasonMonths ?? null,
        data.shelfLifeDays ?? null,
        data.iconKey ?? null,
      ],
    );
    return toCropMaster(result.rows[0]!);
  },

  async updateCropMaster(db, id, patch) {
    const set = buildSet({ ...patch }, CROP_MASTER_PATCH_COLUMNS, 2);
    if (set.sql.length === 0) return cropsRepo.findCropMaster(db, id);
    const result = await db.query<CropMasterRow>(
      `UPDATE crop_master SET ${set.sql} WHERE id = $1 AND deleted_at IS NULL RETURNING ${CROP_MASTER_COLUMNS}`,
      [id, ...set.params],
    );
    const row = result.rows[0];
    return row === undefined ? null : toCropMaster(row);
  },
};
