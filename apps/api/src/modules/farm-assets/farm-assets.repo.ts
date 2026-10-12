/**
 * farm-assets.repo.ts is the ONLY place that writes SQL for the farm-assets
 * module.
 *
 *  - Every function takes an `Executor` first so the service can compose
 *    calls inside one transaction.
 *  - The farmer-facing routes have no `/farms/{farmId}/...` nesting (unlike
 *    crops' `/plots/{plotId}/...`), so ownership is always the two-hop
 *    `farm_assets -> farms.farmer_id` join, never a client-supplied farmer id
 *    (root CLAUDE.md §2.1). `listFarmAssets`/`findFarmAsset` are farmer-wide
 *    (across every one of the farmer's `farms` rows/land locations —
 *    "farm-land-locations-model"), not scoped to one farm.
 *  - `deleted_at IS NULL` is on every farm_assets read; DELETE is a soft
 *    delete (see farm-assets.service.ts) — a farmer retiring a broken tool,
 *    not a real-world sale record.
 *  - `next_service_due_on` is a GENERATED column (db/migrations/0025) — it is
 *    SELECTed, never INSERTed/UPDATEd here; Postgres would reject an attempt
 *    to write it directly.
 *  - Rows are mapped to the wire shape here; snake_case never leaves this
 *    file. `status`/`dueNote` are NOT computed here — that is
 *    farm-assets.service.ts's job, from `nextServiceDueOn` vs `current_date`.
 *
 * Schema: db/migrations/0025_farm_assets.sql.
 */
import type { Executor } from '../../db/pool.js';
import type { CreateFarmAssetBody, FarmAssetCategory } from './farm-assets.schema.js';

// ---------------------------------------------------------------------------
// Domain inputs / results
// ---------------------------------------------------------------------------

/**
 * Unlike crops' `CreateFarmCropData` (which adds `plotId` on top of the
 * request body, because `plotId` travels in the URL there), `farmId` already
 * lives in `CreateFarmAssetBody` — this module has no `/farms/{farmId}/...`
 * nesting — so the create-data shape is just the request body itself.
 */
export type CreateFarmAssetData = CreateFarmAssetBody;

/** Only the keys present are written; `null` clears a nullable column. */
export interface UpdateFarmAssetPatch {
  name?: string | undefined;
  makeModel?: string | null | undefined;
  fuelType?: string | null | undefined;
  coverageAreaAcres?: number | null | undefined;
  purchasedOn?: string | null | undefined;
  costPaise?: number | null | undefined;
  serviceIntervalDays?: number | null | undefined;
  lastServicedOn?: string | null | undefined;
  notes?: string | null | undefined;
}

/** Keyset position for the list: (created_at, id), both DESC — same shape crops/farm-diary use. */
export interface FarmAssetCursor {
  createdAt: string;
  id: string;
}

export interface ListFarmAssetsArgs {
  farmerId: string;
  category?: FarmAssetCategory | undefined;
  /**
   * Present only when the caller asked for `dueOnly=true`. The value is
   * `system_config.asset_service_due_soon_days` (the service fetches it via
   * `getAssetServiceDueSoonDays`): a row counts as "due" for this filter the
   * same way it counts as DUE_SOON-or-OVERDUE for the computed `status` field
   * — `next_service_due_on <= current_date + dueWithinDays`. Filtering in SQL
   * (rather than fetching everything and discarding in application code)
   * keeps FarmInventoryScreen.tsx's per-category due counts cheap even as a
   * farmer's asset register grows.
   */
  dueWithinDays?: number | undefined;
  cursor?: FarmAssetCursor | undefined;
  limit: number;
}

export interface FarmAssetRecord {
  id: string;
  farmId: string;
  category: FarmAssetCategory;
  name: string;
  makeModel: string | null;
  fuelType: string | null;
  coverageAreaAcres: number | null;
  purchasedOn: string | null;
  costPaise: number | null;
  serviceIntervalDays: number | null;
  lastServicedOn: string | null;
  /** GENERATED column value (db/migrations/0025) — never written by this repo. */
  nextServiceDueOn: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListFarmAssetsResult {
  items: FarmAssetRecord[];
  next: FarmAssetCursor | null;
}

// ---------------------------------------------------------------------------
// Interface — the service depends on THIS, which is what lets the tests run
// against a plain in-memory fake.
// ---------------------------------------------------------------------------

export interface FarmAssetsRepo {
  /** Ownership is derived server-side — farms.farmer_id — never a client-supplied farmer id (root CLAUDE.md §2.1). */
  isFarmOwnedByFarmer(db: Executor, farmId: string, farmerId: string): Promise<boolean>;

  createFarmAsset(db: Executor, data: CreateFarmAssetData): Promise<string>;

  /** Full farm_assets row, owned by farmerId (via any of their farms) and not soft-deleted; else null. */
  findFarmAsset(db: Executor, farmerId: string, assetId: string): Promise<FarmAssetRecord | null>;

  /** Farmer-wide across every one of farmerId's `farms` rows — used by both the farmer-facing route and the admin-by-farmerId route. */
  listFarmAssets(db: Executor, args: ListFarmAssetsArgs): Promise<ListFarmAssetsResult>;

  /** Returns false when no live row owned by farmerId matched. */
  updateFarmAsset(db: Executor, farmerId: string, assetId: string, patch: UpdateFarmAssetPatch): Promise<boolean>;

  /** Soft delete (sets deleted_at); returns false when no live row owned by farmerId matched. */
  softDeleteFarmAsset(db: Executor, farmerId: string, assetId: string): Promise<boolean>;

  /**
   * Specification gap (see db/seed/001_reference.sql): no source document
   * defines the DUE_SOON window. 14 is a placeholder chosen to match the
   * mock screens' own fixture data, mirroring
   * certifications.repo.ts's getCertExpiryWarningDays.
   */
  getAssetServiceDueSoonDays(db: Executor): Promise<number>;
}

// ---------------------------------------------------------------------------
// Row types and mappers
// ---------------------------------------------------------------------------

interface FarmAssetRow {
  id: string;
  farm_id: string;
  category: FarmAssetCategory;
  name: string;
  make_model: string | null;
  fuel_type: string | null;
  coverage_area_acres: string | null;
  purchased_on: string | null;
  cost_paise: number | null;
  service_interval_days: number | null;
  last_serviced_on: string | null;
  next_service_due_on: string | null;
  notes: string | null;
  created_at: Date;
  created_at_cursor: string;
  updated_at: Date | null;
}

function toFarmAsset(row: FarmAssetRow): FarmAssetRecord {
  return {
    id: row.id,
    farmId: row.farm_id,
    category: row.category,
    name: row.name,
    makeModel: row.make_model,
    fuelType: row.fuel_type,
    coverageAreaAcres: row.coverage_area_acres === null ? null : Number(row.coverage_area_acres),
    purchasedOn: row.purchased_on,
    costPaise: row.cost_paise,
    serviceIntervalDays: row.service_interval_days,
    lastServicedOn: row.last_serviced_on,
    nextServiceDueOn: row.next_service_due_on,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const FARM_ASSET_SELECT = `
  SELECT fa.id, fa.farm_id, fa.category, fa.name, fa.make_model, fa.fuel_type,
         fa.coverage_area_acres,
         fa.purchased_on::text AS purchased_on,
         fa.cost_paise, fa.service_interval_days,
         fa.last_serviced_on::text AS last_serviced_on,
         fa.next_service_due_on::text AS next_service_due_on,
         fa.notes, fa.created_at,
         to_char(fa.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_cursor,
         fa.updated_at
    FROM farm_assets fa
    JOIN farms f ON f.id = fa.farm_id
`;

/**
 * Builds `SET col = $n, ...` from a patch. Column names come from the fixed
 * map below, never from the client; values are always positional params.
 * Same shape as crops.repo.ts's buildSet.
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

const FARM_ASSET_PATCH_COLUMNS: Record<string, { column: string; cast?: string }> = {
  name: { column: 'name' },
  makeModel: { column: 'make_model' },
  fuelType: { column: 'fuel_type' },
  coverageAreaAcres: { column: 'coverage_area_acres' },
  purchasedOn: { column: 'purchased_on', cast: '::date' },
  costPaise: { column: 'cost_paise' },
  serviceIntervalDays: { column: 'service_interval_days' },
  lastServicedOn: { column: 'last_serviced_on', cast: '::date' },
  notes: { column: 'notes' },
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const farmAssetsRepo: FarmAssetsRepo = {
  async isFarmOwnedByFarmer(db, farmId, farmerId) {
    const result = await db.query<{ ok: boolean }>(
      `SELECT true AS ok
         FROM farms f
        WHERE f.id = $1 AND f.farmer_id = $2 AND f.deleted_at IS NULL
        LIMIT 1`,
      [farmId, farmerId],
    );
    return result.rows.length > 0;
  },

  async createFarmAsset(db, data) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO farm_assets (
         farm_id, category, name, make_model, fuel_type, coverage_area_acres,
         purchased_on, cost_paise, service_interval_days, last_serviced_on, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9, $10::date, $11)
       RETURNING id`,
      [
        data.farmId,
        data.category,
        data.name,
        data.makeModel ?? null,
        data.fuelType ?? null,
        data.coverageAreaAcres ?? null,
        data.purchasedOn ?? null,
        data.costPaise ?? null,
        data.serviceIntervalDays,
        data.lastServicedOn ?? null,
        data.notes ?? null,
      ],
    );
    return result.rows[0]!.id;
  },

  async findFarmAsset(db, farmerId, assetId) {
    const result = await db.query<FarmAssetRow>(
      `${FARM_ASSET_SELECT}
        WHERE fa.id = $1 AND f.farmer_id = $2
          AND fa.deleted_at IS NULL AND f.deleted_at IS NULL
        LIMIT 1`,
      [assetId, farmerId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toFarmAsset(row);
  },

  async listFarmAssets(db, args) {
    const params: unknown[] = [args.farmerId];
    const conditions: string[] = ['f.farmer_id = $1', 'fa.deleted_at IS NULL', 'f.deleted_at IS NULL'];

    if (args.category !== undefined) {
      params.push(args.category);
      conditions.push(`fa.category = $${params.length}`);
    }
    if (args.dueWithinDays !== undefined) {
      params.push(args.dueWithinDays);
      conditions.push(`fa.next_service_due_on IS NOT NULL AND fa.next_service_due_on <= (current_date + $${params.length}::int)`);
    }
    if (args.cursor !== undefined) {
      params.push(args.cursor.createdAt, args.cursor.id);
      const n = params.length;
      conditions.push(`(fa.created_at, fa.id) < ($${n - 1}::timestamptz, $${n}::uuid)`);
    }

    params.push(args.limit + 1);
    const result = await db.query<FarmAssetRow>(
      `${FARM_ASSET_SELECT}
        WHERE ${conditions.join(' AND ')}
        ORDER BY fa.created_at DESC, fa.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > args.limit;
    const rows = hasMore ? result.rows.slice(0, args.limit) : result.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(toFarmAsset),
      next: hasMore && last !== undefined ? { createdAt: last.created_at_cursor, id: last.id } : null,
    };
  },

  async updateFarmAsset(db, farmerId, assetId, patch) {
    const set = buildSet({ ...patch }, FARM_ASSET_PATCH_COLUMNS, 3);
    const setSql = set.sql.length > 0 ? `${set.sql}, updated_at = now()` : 'updated_at = now()';
    // Ownership is re-derived through the same farms join as the read path —
    // an assetId belonging to a different farmer matches nothing here either
    // (root CLAUDE.md §2.1).
    const result = await db.query(
      `UPDATE farm_assets
          SET ${setSql}
        WHERE id = $1 AND deleted_at IS NULL
          AND farm_id IN (SELECT f.id FROM farms f WHERE f.farmer_id = $2 AND f.deleted_at IS NULL)`,
      [assetId, farmerId, ...set.params],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async softDeleteFarmAsset(db, farmerId, assetId) {
    const result = await db.query(
      `UPDATE farm_assets
          SET deleted_at = now(), updated_at = now()
        WHERE id = $1 AND deleted_at IS NULL
          AND farm_id IN (SELECT f.id FROM farms f WHERE f.farmer_id = $2 AND f.deleted_at IS NULL)`,
      [assetId, farmerId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async getAssetServiceDueSoonDays(db) {
    const result = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'asset_service_due_soon_days' LIMIT 1`,
    );
    const raw = result.rows[0]?.value;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 14;
  },
};
