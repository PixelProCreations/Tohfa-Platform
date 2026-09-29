/**
 * livestock.repo.ts is the ONLY place that writes SQL for the livestock
 * module.
 *
 *  - Every function takes an `Executor` first so the service can compose
 *    calls inside one transaction.
 *  - Animals and production logs are owned through `farms.farmer_id`
 *    directly (both tables carry `farm_id`) — a single join, simpler than
 *    crops' `farm_crops -> plots -> farms` chain because livestock is not
 *    plot-scoped (root CLAUDE.md's farm-land-locations doctrine). Lifecycle
 *    events have no `farm_id` of their own and are owned through
 *    `animal_id -> livestock_animals.farm_id -> farms.farmer_id`.
 *  - A row owned by a different farmer is indistinguishable from a row that
 *    does not exist (root CLAUDE.md §2.1) — every farmer-scoped read/write
 *    below re-derives ownership in the query itself, never trusting a
 *    previously-loaded row.
 *  - `deleted_at IS NULL` is on every live read of animals/production logs.
 *    `livestock_lifecycle_events` has no `deleted_at` — it is append-only
 *    (BR-47; db/migrations/0024_livestock.sql).
 *  - Rows are mapped to the wire shape here; snake_case never leaves this file.
 *
 * Schema: db/migrations/0024_livestock.sql.
 */
import type { Executor } from '../../db/pool.js';
import type {
  AnimalGender,
  AnimalResponse,
  AnimalSource,
  AnimalSpecies,
  CreateAnimalBody,
  CreateProductionLogBody,
  DairyProductType,
  LifecycleStatus,
  OrganicStatus,
  ProductionLogResponse,
  ProductionUnit,
  RecordLifecycleEventBody,
} from './livestock.schema.js';

// ---------------------------------------------------------------------------
// Domain inputs / results
// ---------------------------------------------------------------------------

export interface CreateAnimalData extends CreateAnimalBody {
  farmId: string;
}

/** Only the keys present are written; `null` clears a nullable column. */
export interface UpdateAnimalPatch {
  tag?: string | undefined;
  name?: string | null | undefined;
  species?: AnimalSpecies | undefined;
  breed?: string | null | undefined;
  gender?: AnimalGender | undefined;
  dateOfBirth?: string | null | undefined;
  source?: AnimalSource | undefined;
  purchasedOn?: string | null | undefined;
  sourceFarm?: string | null | undefined;
  organicStatus?: OrganicStatus | undefined;
  withdrawalUntil?: string | null | undefined;
  notes?: string | null | undefined;
}

/** Keyset position for both list endpoints: (created_at, id), both DESC. */
export interface ListCursor {
  createdAt: string;
  id: string;
}

export interface ListAnimalsArgs {
  farmerId: string;
  species?: AnimalSpecies | undefined;
  lifecycleStatus?: LifecycleStatus | undefined;
  cursor?: ListCursor | undefined;
  limit: number;
}

export interface ListAnimalsResult {
  items: AnimalResponse[];
  next: ListCursor | null;
}

export interface CreateProductionLogData extends CreateProductionLogBody {
  farmId: string;
}

export interface ListProductionLogsArgs {
  farmerId: string;
  productType?: DairyProductType | undefined;
  animalId?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  cursor?: ListCursor | undefined;
  limit: number;
}

export interface ListProductionLogsResult {
  items: ProductionLogResponse[];
  next: ListCursor | null;
}

// ---------------------------------------------------------------------------
// Interface — the service depends on THIS, which is what lets the tests run
// against a plain in-memory fake.
// ---------------------------------------------------------------------------

export interface LivestockRepo {
  createAnimal(db: Executor, data: CreateAnimalData): Promise<string>;

  /** Full livestock_animals row, owned by farmerId and not soft-deleted; else null. */
  findAnimal(db: Executor, farmerId: string, animalId: string): Promise<AnimalResponse | null>;

  listAnimals(db: Executor, args: ListAnimalsArgs): Promise<ListAnimalsResult>;

  /**
   * Returns false when no live row owned by farmerId matched. Throws the raw
   * pg error (23505) on a duplicate `(farm_id, tag)` — the service translates
   * it into `CONFLICT`.
   */
  updateAnimal(db: Executor, farmerId: string, animalId: string, patch: UpdateAnimalPatch): Promise<boolean>;

  /**
   * Ownership is derived the same way `findAnimal` does (farm_id ->
   * farms.farmer_id); returns false, never throws, for a foreign animalId.
   * Throws the raw pg error (23505) on a second lifecycle event for the same
   * animal — the service translates it into `LIVESTOCK_ALREADY_EXITED` (BR-47a).
   */
  insertLifecycleEvent(db: Executor, farmerId: string, animalId: string, body: RecordLifecycleEventBody): Promise<boolean>;

  /** Sets livestock_animals.lifecycle_status. Called in the same transaction as insertLifecycleEvent (BR-47b). */
  setAnimalLifecycleStatus(db: Executor, animalId: string, status: LifecycleStatus): Promise<void>;

  createProductionLog(db: Executor, data: CreateProductionLogData): Promise<string>;
  /** One production log row, owned by farmerId and not soft-deleted; else null. */
  findProductionLog(db: Executor, farmerId: string, logId: string): Promise<ProductionLogResponse | null>;
  listProductionLogs(db: Executor, args: ListProductionLogsArgs): Promise<ListProductionLogsResult>;

  /** Admin route only (`admin.livestock.view_all`, scope all): every live animal for a given farmerId, active and inactive. */
  listAnimalsForFarmer(db: Executor, farmerId: string): Promise<AnimalResponse[]>;
}

// ---------------------------------------------------------------------------
// Row types and mappers
// ---------------------------------------------------------------------------

interface AnimalRow {
  id: string;
  tag: string;
  name: string | null;
  species: AnimalResponse['species'];
  breed: string | null;
  gender: AnimalGender;
  date_of_birth: string | null;
  source: AnimalSource;
  purchased_on: string | null;
  source_farm: string | null;
  organic_status: OrganicStatus;
  lifecycle_status: LifecycleStatus;
  withdrawal_until: string | null;
  notes: string | null;
  created_at: Date;
  created_at_cursor: string;
  updated_at: Date | null;
}

interface ProductionLogRow {
  id: string;
  animal_id: string | null;
  product_type: DairyProductType;
  quantity: string;
  unit: ProductionUnit;
  logged_on: string;
  batch_info: string | null;
  sessions: number | null;
  notes: string | null;
  created_at: Date;
  created_at_cursor: string;
  updated_at: Date | null;
}

function toAnimal(row: AnimalRow): AnimalResponse {
  return {
    id: row.id,
    tag: row.tag,
    name: row.name,
    species: row.species,
    breed: row.breed,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    source: row.source,
    purchasedOn: row.purchased_on,
    sourceFarm: row.source_farm,
    organicStatus: row.organic_status,
    lifecycleStatus: row.lifecycle_status,
    withdrawalUntil: row.withdrawal_until,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

function toProductionLog(row: ProductionLogRow): ProductionLogResponse {
  return {
    id: row.id,
    animalId: row.animal_id,
    productType: row.product_type,
    quantity: Number(row.quantity),
    unit: row.unit,
    loggedOn: row.logged_on,
    batchInfo: row.batch_info,
    sessions: row.sessions,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const ANIMAL_SELECT = `
  SELECT la.id, la.tag, la.name, la.species, la.breed, la.gender,
         la.date_of_birth::text AS date_of_birth,
         la.source,
         la.purchased_on::text AS purchased_on,
         la.source_farm, la.organic_status, la.lifecycle_status,
         la.withdrawal_until::text AS withdrawal_until,
         la.notes, la.created_at,
         to_char(la.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_cursor,
         la.updated_at
    FROM livestock_animals la
`;

const PRODUCTION_LOG_SELECT = `
  SELECT pl.id, pl.animal_id, pl.product_type, pl.quantity, pl.unit,
         pl.logged_on::text AS logged_on,
         pl.batch_info, pl.sessions, pl.notes, pl.created_at,
         to_char(pl.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_cursor,
         pl.updated_at
    FROM livestock_production_logs pl
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

const ANIMAL_PATCH_COLUMNS: Record<string, { column: string; cast?: string }> = {
  tag: { column: 'tag' },
  name: { column: 'name' },
  species: { column: 'species' },
  breed: { column: 'breed' },
  gender: { column: 'gender' },
  dateOfBirth: { column: 'date_of_birth', cast: '::date' },
  source: { column: 'source' },
  purchasedOn: { column: 'purchased_on', cast: '::date' },
  sourceFarm: { column: 'source_farm' },
  organicStatus: { column: 'organic_status' },
  withdrawalUntil: { column: 'withdrawal_until', cast: '::date' },
  notes: { column: 'notes' },
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const livestockRepo: LivestockRepo = {
  async createAnimal(db, data) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO livestock_animals (
         farm_id, tag, name, species, breed, gender, date_of_birth, source,
         purchased_on, source_farm, organic_status, withdrawal_until, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9::date, $10, $11, $12::date, $13)
       RETURNING id`,
      [
        data.farmId,
        data.tag,
        data.name ?? null,
        data.species,
        data.breed ?? null,
        data.gender,
        data.dateOfBirth ?? null,
        data.source,
        data.purchasedOn ?? null,
        data.sourceFarm ?? null,
        data.organicStatus,
        data.withdrawalUntil ?? null,
        data.notes ?? null,
      ],
    );
    return result.rows[0]!.id;
  },

  async findAnimal(db, farmerId, animalId) {
    const result = await db.query<AnimalRow>(
      `${ANIMAL_SELECT}
         JOIN farms f ON f.id = la.farm_id
        WHERE la.id = $1 AND f.farmer_id = $2
          AND la.deleted_at IS NULL AND f.deleted_at IS NULL
        LIMIT 1`,
      [animalId, farmerId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toAnimal(row);
  },

  async listAnimals(db, args) {
    const params: unknown[] = [args.farmerId];
    const conditions: string[] = ['f.farmer_id = $1', 'la.deleted_at IS NULL', 'f.deleted_at IS NULL'];

    // Omitted lifecycleStatus defaults to ACTIVE-only — an animal that has
    // left the herd drops off the default list (BR-47c).
    params.push(args.lifecycleStatus ?? 'ACTIVE');
    conditions.push(`la.lifecycle_status = $${params.length}`);

    if (args.species !== undefined) {
      params.push(args.species);
      conditions.push(`la.species = $${params.length}`);
    }
    if (args.cursor !== undefined) {
      params.push(args.cursor.createdAt, args.cursor.id);
      const n = params.length;
      conditions.push(`(la.created_at, la.id) < ($${n - 1}::timestamptz, $${n}::uuid)`);
    }

    params.push(args.limit + 1);
    const result = await db.query<AnimalRow>(
      `${ANIMAL_SELECT}
         JOIN farms f ON f.id = la.farm_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY la.created_at DESC, la.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > args.limit;
    const rows = hasMore ? result.rows.slice(0, args.limit) : result.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(toAnimal),
      next: hasMore && last !== undefined ? { createdAt: last.created_at_cursor, id: last.id } : null,
    };
  },

  async updateAnimal(db, farmerId, animalId, patch) {
    const set = buildSet({ ...patch }, ANIMAL_PATCH_COLUMNS, 3);
    const setSql = set.sql.length > 0 ? `${set.sql}, updated_at = now()` : 'updated_at = now()';
    const result = await db.query(
      `UPDATE livestock_animals
          SET ${setSql}
        WHERE id = $1 AND deleted_at IS NULL
          AND farm_id IN (SELECT id FROM farms WHERE farmer_id = $2 AND deleted_at IS NULL)`,
      [animalId, farmerId, ...set.params],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async insertLifecycleEvent(db, farmerId, animalId, body) {
    const result = await db.query(
      `INSERT INTO livestock_lifecycle_events (animal_id, event_type, event_date, counterparty, sale_price_paise, reason, notes)
       SELECT la.id, $2, COALESCE($3::date, current_date), $4, $5, $6, $7
         FROM livestock_animals la
         JOIN farms f ON f.id = la.farm_id
        WHERE la.id = $1 AND f.farmer_id = $8
          AND la.deleted_at IS NULL AND f.deleted_at IS NULL`,
      [
        animalId,
        body.eventType,
        body.eventDate ?? null,
        body.counterparty ?? null,
        body.salePricePaise ?? null,
        body.reason ?? null,
        body.notes ?? null,
        farmerId,
      ],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async setAnimalLifecycleStatus(db, animalId, status) {
    await db.query('UPDATE livestock_animals SET lifecycle_status = $2, updated_at = now() WHERE id = $1', [animalId, status]);
  },

  async createProductionLog(db, data) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO livestock_production_logs (farm_id, animal_id, product_type, quantity, unit, logged_on, batch_info, sessions, notes)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, current_date), $7, $8, $9)
       RETURNING id`,
      [
        data.farmId,
        data.animalId ?? null,
        data.productType,
        data.quantity,
        data.unit,
        data.loggedOn ?? null,
        data.batchInfo ?? null,
        data.sessions ?? null,
        data.notes ?? null,
      ],
    );
    return result.rows[0]!.id;
  },

  async findProductionLog(db, farmerId, logId) {
    const result = await db.query<ProductionLogRow>(
      `${PRODUCTION_LOG_SELECT}
         JOIN farms f ON f.id = pl.farm_id
        WHERE pl.id = $1 AND f.farmer_id = $2
          AND pl.deleted_at IS NULL AND f.deleted_at IS NULL
        LIMIT 1`,
      [logId, farmerId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toProductionLog(row);
  },

  async listProductionLogs(db, args) {
    const params: unknown[] = [args.farmerId];
    const conditions: string[] = ['f.farmer_id = $1', 'pl.deleted_at IS NULL', 'f.deleted_at IS NULL'];

    if (args.productType !== undefined) {
      params.push(args.productType);
      conditions.push(`pl.product_type = $${params.length}`);
    }
    if (args.animalId !== undefined) {
      params.push(args.animalId);
      conditions.push(`pl.animal_id = $${params.length}`);
    }
    if (args.dateFrom !== undefined) {
      params.push(args.dateFrom);
      conditions.push(`pl.logged_on >= $${params.length}::date`);
    }
    if (args.dateTo !== undefined) {
      params.push(args.dateTo);
      conditions.push(`pl.logged_on <= $${params.length}::date`);
    }
    if (args.cursor !== undefined) {
      params.push(args.cursor.createdAt, args.cursor.id);
      const n = params.length;
      conditions.push(`(pl.created_at, pl.id) < ($${n - 1}::timestamptz, $${n}::uuid)`);
    }

    params.push(args.limit + 1);
    const result = await db.query<ProductionLogRow>(
      `${PRODUCTION_LOG_SELECT}
         JOIN farms f ON f.id = pl.farm_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY pl.created_at DESC, pl.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > args.limit;
    const rows = hasMore ? result.rows.slice(0, args.limit) : result.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(toProductionLog),
      next: hasMore && last !== undefined ? { createdAt: last.created_at_cursor, id: last.id } : null,
    };
  },

  async listAnimalsForFarmer(db, farmerId) {
    const result = await db.query<AnimalRow>(
      `${ANIMAL_SELECT}
         JOIN farms f ON f.id = la.farm_id
        WHERE f.farmer_id = $1 AND la.deleted_at IS NULL AND f.deleted_at IS NULL
        ORDER BY la.created_at DESC`,
      [farmerId],
    );
    return result.rows.map(toAnimal);
  },
};
