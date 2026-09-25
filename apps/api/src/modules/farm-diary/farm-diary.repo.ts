/**
 * farm-diary.repo.ts is the ONLY place that writes SQL for the farm diary.
 *
 *  - Every function takes an `Executor` first so the service can compose
 *    calls inside one transaction.
 *  - Every entry-level read/write takes `farmerId` and puts
 *    `farmer_id = $n` in the WHERE clause itself (BR-40/BR-43). A row owned by
 *    someone else is therefore indistinguishable from a row that does not
 *    exist — the query simply matches nothing — which is what lets the service
 *    answer NOT_FOUND / empty rather than 403.
 *  - `deleted_at IS NULL` is on every entry read (BR-43b).
 *  - Rows are mapped to the wire shape here; snake_case never leaves this file.
 *
 * Schema: db/migrations/0020_farm_diary.sql plus 0021_farm_diary_workforce.sql
 * (diary_entry_workers; diary_entries.labor_count dropped; is_active on both
 * taxonomy tables).
 */
import type { Executor } from '../../db/pool.js';
import type {
  CreateDiaryCategoryBody,
  CreateDiarySubActivityBody,
  DiaryCalendarResponse,
  DiaryCategoryResponse,
  DiaryEntryResponse,
  DiaryEntrySummaryResponse,
  DiaryPhotoResponse,
  DiarySubActivityResponse,
  DiaryWorkerResponse,
  WorkerPaymentStatus,
} from './farm-diary.schema.js';

// ---------------------------------------------------------------------------
// Domain inputs (already validated by the service)
// ---------------------------------------------------------------------------

export interface WorkerRowInput {
  name: string;
  role: string | null;
  hoursWorked: number;
  wageRatePaise: number;
  paymentStatus: WorkerPaymentStatus;
}

export interface CreateEntryData {
  farmerId: string;
  plotId: string;
  farmCropId: string;
  categoryKey: string;
  subActivityKey: string;
  activityFields: Record<string, unknown>;
  minutes: number;
  notes: string | null;
  /** YYYY-MM-DD; null lets the column default (current_date) apply. */
  activityOn: string | null;
  voiceNoteKey: string | null;
  voiceNoteDurationS: number | null;
}

/** Only the keys present are written; `null` clears a nullable column. */
export interface UpdateEntryPatch {
  categoryKey?: string | undefined;
  subActivityKey?: string | undefined;
  activityFields?: Record<string, unknown> | undefined;
  minutes?: number | undefined;
  notes?: string | null | undefined;
  activityOn?: string | undefined;
  voiceNoteKey?: string | null | undefined;
  voiceNoteDurationS?: number | null | undefined;
}

export interface ListEntriesArgs {
  farmerId: string;
  date?: string | undefined;
  /** First day of the month, YYYY-MM-01. */
  monthStart?: string | undefined;
  plotId?: string | undefined;
  categoryKey?: string | undefined;
  cursor?: EntryCursor | undefined;
  limit: number;
}

/**
 * Keyset position for the list. Ordering is (activity_on, logged_at, id) all
 * DESC; the cursor carries all three so a page boundary is exact even when two
 * entries share a day and a millisecond. `loggedAt` keeps microsecond
 * precision (a JS Date would truncate it and skip/duplicate rows).
 */
export interface EntryCursor {
  activityOn: string;
  loggedAt: string;
  id: string;
}

export interface ListEntriesResult {
  items: DiaryEntrySummaryResponse[];
  /** Position of the last returned row, when there is a further page. */
  next: EntryCursor | null;
}

export interface AttachPhotoData {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UpdateCategoryPatch {
  name?: string | undefined;
  nameTa?: string | null | undefined;
  iconKey?: string | null | undefined;
  sortOrder?: number | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateSubActivityPatch {
  name?: string | undefined;
  nameTa?: string | null | undefined;
  sortOrder?: number | undefined;
  isActive?: boolean | undefined;
}

export interface TaxonomyRows {
  categories: DiaryCategoryResponse[];
  subActivities: DiarySubActivityResponse[];
}

// ---------------------------------------------------------------------------
// Interface — the service depends on THIS, which is what lets the tests run
// against a plain in-memory fake.
// ---------------------------------------------------------------------------

export interface FarmDiaryRepo {
  /** Active categories and active sub-activities of active categories, sort_order ascending. */
  listActiveTaxonomy(db: Executor): Promise<TaxonomyRows>;

  /**
   * BR-42a / BR-45b: true only when the sub-activity exists, belongs to the
   * category, and BOTH rows are is_active. Reads the live table every time —
   * the taxonomy is admin-managed, not a fixed seed.
   */
  isActiveSubActivityOfCategory(db: Executor, categoryKey: string, subActivityKey: string): Promise<boolean>;

  /**
   * Ownership is derived server-side — plots -> farms.farmer_id — never from a
   * client-supplied farmer id (BR-40).
   */
  isPlotOwnedByFarmer(db: Executor, plotId: string, farmerId: string): Promise<boolean>;

  /**
   * BR-42b: id of a farm_crops row in status GROWING on this plot. With
   * `farmCropId` it must be that exact row; without, the most recently planted
   * GROWING crop. Null when there is none.
   */
  findGrowingCropOnPlot(db: Executor, plotId: string, farmCropId?: string): Promise<string | null>;

  createEntry(db: Executor, data: CreateEntryData): Promise<string>;

  /**
   * BR-44c: delete-then-insert of the entry's whole workforce set. Callers
   * run it inside the same transaction as the entry write.
   */
  replaceWorkers(db: Executor, entryId: string, workers: WorkerRowInput[]): Promise<void>;

  /** Full entry (workers, photos, labour cost) owned by farmerId and not soft-deleted; else null. */
  findEntry(db: Executor, farmerId: string, entryId: string): Promise<DiaryEntryResponse | null>;

  listEntries(db: Executor, args: ListEntriesArgs): Promise<ListEntriesResult>;

  /** Distinct days in [monthStart, monthStart + 1 month) with at least one live entry. */
  calendarDays(db: Executor, farmerId: string, monthStart: string): Promise<DiaryCalendarResponse['days']>;

  /** Returns false when no live row owned by farmerId matched (BR-43a). */
  updateEntry(db: Executor, farmerId: string, entryId: string, patch: UpdateEntryPatch): Promise<boolean>;

  /** Sets deleted_at — never a SQL DELETE (BR-43b). False when nothing matched. */
  softDeleteEntry(db: Executor, farmerId: string, entryId: string): Promise<boolean>;

  addPhoto(db: Executor, entryId: string, photo: AttachPhotoData): Promise<DiaryPhotoResponse>;

  /** Removes the photo only if its entry is live and owned by farmerId. */
  deletePhoto(db: Executor, farmerId: string, entryId: string, photoId: string): Promise<boolean>;

  // --- Admin taxonomy (BR-45) ---
  findCategory(db: Executor, key: string): Promise<DiaryCategoryResponse | null>;
  createCategory(db: Executor, data: CreateDiaryCategoryBody): Promise<DiaryCategoryResponse>;
  updateCategory(db: Executor, key: string, patch: UpdateCategoryPatch): Promise<DiaryCategoryResponse | null>;
  findSubActivity(db: Executor, key: string): Promise<DiarySubActivityResponse | null>;
  createSubActivity(
    db: Executor,
    categoryKey: string,
    data: CreateDiarySubActivityBody,
  ): Promise<DiarySubActivityResponse>;
  updateSubActivity(
    db: Executor,
    key: string,
    patch: UpdateSubActivityPatch,
  ): Promise<DiarySubActivityResponse | null>;
}

// ---------------------------------------------------------------------------
// Row types and mappers
// ---------------------------------------------------------------------------

interface CategoryRow {
  key: string;
  name: string;
  name_ta: string | null;
  icon_key: string | null;
  sort_order: number;
  is_active: boolean;
}

interface SubActivityRow {
  key: string;
  category_key: string;
  name: string;
  name_ta: string | null;
  sort_order: number;
  is_active: boolean;
}

interface EntryRow {
  id: string;
  plot_id: string;
  farm_crop_id: string;
  category_key: string;
  sub_activity_key: string;
  activity_fields: Record<string, unknown>;
  minutes: number;
  notes: string | null;
  activity_on: string;
  logged_at: Date;
  logged_at_cursor: string;
  voice_note_key: string | null;
  voice_note_duration_s: number | null;
  created_at: Date;
  updated_at: Date | null;
  total_labour_cost_paise: string;
  worker_count: string;
  photo_count: string;
}

interface WorkerRow {
  id: string;
  name: string;
  role: string | null;
  hours_worked: string;
  wage_rate_paise: number;
  payment_status: WorkerPaymentStatus;
}

interface PhotoRow {
  id: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  created_at: Date;
}

function toCategory(row: CategoryRow): DiaryCategoryResponse {
  return {
    key: row.key,
    name: row.name,
    nameTa: row.name_ta,
    iconKey: row.icon_key,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function toSubActivity(row: SubActivityRow): DiarySubActivityResponse {
  return {
    key: row.key,
    categoryKey: row.category_key,
    name: row.name,
    nameTa: row.name_ta,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function toWorker(row: WorkerRow): DiaryWorkerResponse {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    // NUMERIC arrives as a string; hours are a quantity, not money, so a JS
    // number is the right wire type.
    hoursWorked: Number(row.hours_worked),
    wageRatePaise: row.wage_rate_paise,
    paymentStatus: row.payment_status,
  };
}

function toPhoto(row: PhotoRow): DiaryPhotoResponse {
  return {
    id: row.id,
    storageKey: row.storage_key,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at.toISOString(),
  };
}

function toSummary(row: EntryRow): DiaryEntrySummaryResponse {
  return {
    id: row.id,
    plotId: row.plot_id,
    farmCropId: row.farm_crop_id,
    categoryKey: row.category_key,
    subActivityKey: row.sub_activity_key,
    minutes: row.minutes,
    notes: row.notes,
    activityOn: row.activity_on,
    loggedAt: row.logged_at.toISOString(),
    totalLabourCostPaise: Number(row.total_labour_cost_paise),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
    workerCount: Number(row.worker_count),
    photoCount: Number(row.photo_count),
  };
}

/**
 * Labour cost is computed here at read time, never stored (BR-44). hours are
 * NUMERIC and may be fractional (1.5 h x 333 paise = 499.5), so the sum is
 * ROUNDed to whole paise — Postgres ROUND on numeric is half-away-from-zero —
 * and cast to bigint so no float ever touches it.
 */
const ENTRY_SELECT = `
  SELECT e.id, e.plot_id, e.farm_crop_id, e.category_key, e.sub_activity_key,
         e.activity_fields, e.minutes, e.notes, e.activity_on::text AS activity_on,
         e.logged_at,
         to_char(e.logged_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS logged_at_cursor,
         e.voice_note_key, e.voice_note_duration_s, e.created_at, e.updated_at,
         COALESCE((SELECT ROUND(SUM(w.hours_worked * w.wage_rate_paise))::bigint
                     FROM diary_entry_workers w
                    WHERE w.diary_entry_id = e.id), 0)::text AS total_labour_cost_paise,
         (SELECT count(*) FROM diary_entry_workers w WHERE w.diary_entry_id = e.id)::text AS worker_count,
         (SELECT count(*) FROM diary_entry_photos p WHERE p.diary_entry_id = e.id)::text AS photo_count
    FROM diary_entries e
`;

const CATEGORY_COLUMNS = 'key, name, name_ta, icon_key, sort_order, is_active';
const SUB_ACTIVITY_COLUMNS = 'key, category_key, name, name_ta, sort_order, is_active';

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

const ENTRY_PATCH_COLUMNS: Record<string, { column: string; cast?: string }> = {
  categoryKey: { column: 'category_key' },
  subActivityKey: { column: 'sub_activity_key' },
  activityFields: { column: 'activity_fields', cast: '::jsonb' },
  minutes: { column: 'minutes' },
  notes: { column: 'notes' },
  activityOn: { column: 'activity_on', cast: '::date' },
  voiceNoteKey: { column: 'voice_note_key' },
  voiceNoteDurationS: { column: 'voice_note_duration_s' },
};

const CATEGORY_PATCH_COLUMNS: Record<string, { column: string; cast?: string }> = {
  name: { column: 'name' },
  nameTa: { column: 'name_ta' },
  iconKey: { column: 'icon_key' },
  sortOrder: { column: 'sort_order' },
  isActive: { column: 'is_active' },
};

const SUB_ACTIVITY_PATCH_COLUMNS: Record<string, { column: string; cast?: string }> = {
  name: { column: 'name' },
  nameTa: { column: 'name_ta' },
  sortOrder: { column: 'sort_order' },
  isActive: { column: 'is_active' },
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export const farmDiaryRepo: FarmDiaryRepo = {
  async listActiveTaxonomy(db) {
    const categories = await db.query<CategoryRow>(
      `SELECT ${CATEGORY_COLUMNS}
         FROM diary_activity_categories
        WHERE is_active = true
        ORDER BY sort_order, key`,
    );
    const subs = await db.query<SubActivityRow>(
      `SELECT s.key, s.category_key, s.name, s.name_ta, s.sort_order, s.is_active
         FROM diary_sub_activities s
         JOIN diary_activity_categories c ON c.key = s.category_key
        WHERE s.is_active = true AND c.is_active = true
        ORDER BY s.sort_order, s.key`,
    );
    return {
      categories: categories.rows.map(toCategory),
      subActivities: subs.rows.map(toSubActivity),
    };
  },

  async isActiveSubActivityOfCategory(db, categoryKey, subActivityKey) {
    const result = await db.query<{ ok: boolean }>(
      `SELECT true AS ok
         FROM diary_sub_activities s
         JOIN diary_activity_categories c ON c.key = s.category_key
        WHERE s.key = $2 AND s.category_key = $1
          AND s.is_active = true AND c.is_active = true
        LIMIT 1`,
      [categoryKey, subActivityKey],
    );
    return result.rows.length > 0;
  },

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

  async findGrowingCropOnPlot(db, plotId, farmCropId) {
    const params: unknown[] = [plotId];
    let cropFilter = '';
    if (farmCropId !== undefined) {
      params.push(farmCropId);
      cropFilter = 'AND fc.id = $2';
    }
    const result = await db.query<{ id: string }>(
      `SELECT fc.id
         FROM farm_crops fc
        WHERE fc.plot_id = $1 AND fc.status = 'GROWING' AND fc.deleted_at IS NULL
              ${cropFilter}
        ORDER BY fc.planted_on DESC NULLS LAST, fc.created_at DESC
        LIMIT 1`,
      params,
    );
    return result.rows[0]?.id ?? null;
  },

  async createEntry(db, data) {
    const result = await db.query<{ id: string }>(
      `INSERT INTO diary_entries (
         farmer_id, plot_id, farm_crop_id, category_key, sub_activity_key,
         activity_fields, minutes, notes, activity_on, voice_note_key, voice_note_duration_s
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, COALESCE($9::date, current_date), $10, $11)
       RETURNING id`,
      [
        data.farmerId,
        data.plotId,
        data.farmCropId,
        data.categoryKey,
        data.subActivityKey,
        JSON.stringify(data.activityFields),
        data.minutes,
        data.notes,
        data.activityOn,
        data.voiceNoteKey,
        data.voiceNoteDurationS,
      ],
    );
    return result.rows[0]!.id;
  },

  async replaceWorkers(db, entryId, workers) {
    await db.query(`DELETE FROM diary_entry_workers WHERE diary_entry_id = $1`, [entryId]);
    for (const worker of workers) {
      await db.query(
        `INSERT INTO diary_entry_workers (diary_entry_id, name, role, hours_worked, wage_rate_paise, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [entryId, worker.name, worker.role, worker.hoursWorked, worker.wageRatePaise, worker.paymentStatus],
      );
    }
  },

  async findEntry(db, farmerId, entryId) {
    const result = await db.query<EntryRow>(
      `${ENTRY_SELECT}
        WHERE e.id = $1 AND e.farmer_id = $2 AND e.deleted_at IS NULL
        LIMIT 1`,
      [entryId, farmerId],
    );
    const row = result.rows[0];
    if (row === undefined) return null;

    const workers = await db.query<WorkerRow>(
      `SELECT id, name, role, hours_worked::text AS hours_worked, wage_rate_paise, payment_status
         FROM diary_entry_workers
        WHERE diary_entry_id = $1
        ORDER BY created_at, id`,
      [entryId],
    );
    const photos = await db.query<PhotoRow>(
      `SELECT id, storage_key, mime_type, size_bytes, created_at
         FROM diary_entry_photos
        WHERE diary_entry_id = $1
        ORDER BY created_at, id`,
      [entryId],
    );

    const summary = toSummary(row);
    return {
      id: summary.id,
      plotId: summary.plotId,
      farmCropId: summary.farmCropId,
      categoryKey: summary.categoryKey,
      subActivityKey: summary.subActivityKey,
      minutes: summary.minutes,
      notes: summary.notes,
      activityOn: summary.activityOn,
      loggedAt: summary.loggedAt,
      totalLabourCostPaise: summary.totalLabourCostPaise,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
      activityFields: row.activity_fields,
      voiceNoteKey: row.voice_note_key,
      voiceNoteDurationS: row.voice_note_duration_s,
      workers: workers.rows.map(toWorker),
      photos: photos.rows.map(toPhoto),
    };
  },

  async listEntries(db, args) {
    // farmer_id is ALWAYS the first condition (BR-40); every other filter only
    // narrows within the caller's own rows.
    const params: unknown[] = [args.farmerId];
    const conditions: string[] = ['e.farmer_id = $1', 'e.deleted_at IS NULL'];

    if (args.date !== undefined) {
      params.push(args.date);
      conditions.push(`e.activity_on = $${params.length}::date`);
    }
    if (args.monthStart !== undefined) {
      params.push(args.monthStart);
      const i = params.length;
      conditions.push(`e.activity_on >= $${i}::date AND e.activity_on < ($${i}::date + interval '1 month')`);
    }
    if (args.plotId !== undefined) {
      params.push(args.plotId);
      conditions.push(`e.plot_id = $${params.length}`);
    }
    if (args.categoryKey !== undefined) {
      params.push(args.categoryKey);
      conditions.push(`e.category_key = $${params.length}`);
    }
    if (args.cursor !== undefined) {
      params.push(args.cursor.activityOn, args.cursor.loggedAt, args.cursor.id);
      const n = params.length;
      conditions.push(
        `(e.activity_on, e.logged_at, e.id) < ($${n - 2}::date, $${n - 1}::timestamptz, $${n}::uuid)`,
      );
    }

    params.push(args.limit + 1);
    const result = await db.query<EntryRow>(
      `${ENTRY_SELECT}
        WHERE ${conditions.join(' AND ')}
        ORDER BY e.activity_on DESC, e.logged_at DESC, e.id DESC
        LIMIT $${params.length}`,
      params,
    );

    const hasMore = result.rows.length > args.limit;
    const rows = hasMore ? result.rows.slice(0, args.limit) : result.rows;
    const last = rows[rows.length - 1];
    return {
      items: rows.map(toSummary),
      next:
        hasMore && last !== undefined
          ? { activityOn: last.activity_on, loggedAt: last.logged_at_cursor, id: last.id }
          : null,
    };
  },

  async calendarDays(db, farmerId, monthStart) {
    const result = await db.query<{ day: string; entry_count: string }>(
      `SELECT e.activity_on::text AS day, count(*)::text AS entry_count
         FROM diary_entries e
        WHERE e.farmer_id = $1 AND e.deleted_at IS NULL
          AND e.activity_on >= $2::date AND e.activity_on < ($2::date + interval '1 month')
        GROUP BY e.activity_on
        ORDER BY e.activity_on`,
      [farmerId, monthStart],
    );
    return result.rows.map((row) => ({ date: row.day, entryCount: Number(row.entry_count) }));
  },

  async updateEntry(db, farmerId, entryId, patch) {
    const normalised: Record<string, unknown> = { ...patch };
    if (patch.activityFields !== undefined) normalised['activityFields'] = JSON.stringify(patch.activityFields);

    const set = buildSet(normalised, ENTRY_PATCH_COLUMNS, 3);
    // Even a workers-only PATCH touches the row, so updated_at moves and the
    // ownership check below is the same single statement either way.
    const setSql = set.sql.length > 0 ? `${set.sql}, updated_at = now()` : 'updated_at = now()';
    const result = await db.query(
      `UPDATE diary_entries
          SET ${setSql}
        WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL`,
      [entryId, farmerId, ...set.params],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async softDeleteEntry(db, farmerId, entryId) {
    const result = await db.query(
      `UPDATE diary_entries
          SET deleted_at = now(), updated_at = now()
        WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL`,
      [entryId, farmerId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async addPhoto(db, entryId, photo) {
    const result = await db.query<PhotoRow>(
      `INSERT INTO diary_entry_photos (diary_entry_id, storage_key, mime_type, size_bytes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, storage_key, mime_type, size_bytes, created_at`,
      [entryId, photo.storageKey, photo.mimeType, photo.sizeBytes],
    );
    return toPhoto(result.rows[0]!);
  },

  async deletePhoto(db, farmerId, entryId, photoId) {
    // diary_entry_photos has no deleted_at (it is an attachment list, not a
    // ledger), so removing a photo is a real DELETE — scoped through the
    // parent entry's owner so a foreign photo id matches nothing.
    const result = await db.query(
      `DELETE FROM diary_entry_photos p
        USING diary_entries e
        WHERE p.id = $1 AND p.diary_entry_id = $2
          AND e.id = p.diary_entry_id AND e.farmer_id = $3 AND e.deleted_at IS NULL`,
      [photoId, entryId, farmerId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async findCategory(db, key) {
    const result = await db.query<CategoryRow>(
      `SELECT ${CATEGORY_COLUMNS} FROM diary_activity_categories WHERE key = $1`,
      [key],
    );
    const row = result.rows[0];
    return row === undefined ? null : toCategory(row);
  },

  async createCategory(db, data) {
    const result = await db.query<CategoryRow>(
      `INSERT INTO diary_activity_categories (key, name, name_ta, icon_key, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${CATEGORY_COLUMNS}`,
      [data.key, data.name, data.nameTa ?? null, data.iconKey ?? null, data.sortOrder],
    );
    return toCategory(result.rows[0]!);
  },

  async updateCategory(db, key, patch) {
    const set = buildSet({ ...patch }, CATEGORY_PATCH_COLUMNS, 2);
    if (set.sql.length === 0) return farmDiaryRepo.findCategory(db, key);
    const result = await db.query<CategoryRow>(
      `UPDATE diary_activity_categories SET ${set.sql} WHERE key = $1 RETURNING ${CATEGORY_COLUMNS}`,
      [key, ...set.params],
    );
    const row = result.rows[0];
    return row === undefined ? null : toCategory(row);
  },

  async findSubActivity(db, key) {
    const result = await db.query<SubActivityRow>(
      `SELECT ${SUB_ACTIVITY_COLUMNS} FROM diary_sub_activities WHERE key = $1`,
      [key],
    );
    const row = result.rows[0];
    return row === undefined ? null : toSubActivity(row);
  },

  async createSubActivity(db, categoryKey, data) {
    const result = await db.query<SubActivityRow>(
      `INSERT INTO diary_sub_activities (key, category_key, name, name_ta, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SUB_ACTIVITY_COLUMNS}`,
      [data.key, categoryKey, data.name, data.nameTa ?? null, data.sortOrder],
    );
    return toSubActivity(result.rows[0]!);
  },

  async updateSubActivity(db, key, patch) {
    const set = buildSet({ ...patch }, SUB_ACTIVITY_PATCH_COLUMNS, 2);
    if (set.sql.length === 0) return farmDiaryRepo.findSubActivity(db, key);
    const result = await db.query<SubActivityRow>(
      `UPDATE diary_sub_activities SET ${set.sql} WHERE key = $1 RETURNING ${SUB_ACTIVITY_COLUMNS}`,
      [key, ...set.params],
    );
    const row = result.rows[0];
    return row === undefined ? null : toSubActivity(row);
  },
};
