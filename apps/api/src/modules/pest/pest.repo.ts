/**
 * pest.repo — SQL only.
 *
 * No authorization decisions live here — the service verifies plot ownership
 * (`findOwnedPlotId`, the same `plots -> farms -> farmer_id` join soil.repo
 * uses) or farm ownership (`findOwnedFarmId`) BEFORE calling any per-table
 * method below. Every per-table statement still filters on `plot_id` (and,
 * for detail/patch, the row's own id too) so a mutation can never silently
 * touch a different plot's data. The farm-wide analytics queries filter on
 * `plots.farm_id` for the same reason.
 *
 * `pest_detections`, `pest_treatment_logs` and `pest_treatment_reminders` are
 * plain mutable rows — none of them is one of CLAUDE.md's four named
 * append-only ledgers. `pest_library` and `weather_risk_notes` are read-only
 * from this module (admin-curated / seeded content).
 *
 * Row mappers live here so snake_case never leaves the repo.
 */
import type { Executor } from '../../db/pool.js';

/**
 * `date` columns come back as JS Dates from `pg`, constructed at LOCAL
 * midnight of the stored calendar date (pg's default date parser). Read the
 * calendar date back with the LOCAL getters: `toISOString()` would convert
 * to UTC first and, in any timezone east of UTC (IST, +05:30, i.e. every
 * production and dev box for this client), shift the date back by one day —
 * a '2026-09-20' detection would be served as '2026-09-19'. The integration
 * tests in pest.test.ts caught exactly that.
 */
function toDateOnly(value: Date): string {
  const year = String(value.getFullYear()).padStart(4, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

/** Escape LIKE/ILIKE wildcards so a user's `q` is matched literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

// ---------------------------------------------------------------------------
// pest_library
// ---------------------------------------------------------------------------

interface PestLibraryRow {
  id: string;
  name: string;
  scientific_name: string | null;
  category: string;
  risk_level: string;
  crops: string[] | null;
  season: string | null;
  symptoms: string[] | null;
  organic_treatments: string[] | null;
  prevention: string[] | null;
  recommended_treatment: string | null;
  interval_days: number | null;
  phi_days: number | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface PestLibraryEntry {
  id: string;
  name: string;
  scientificName: string | null;
  category: string;
  riskLevel: string;
  crops: string[];
  season: string | null;
  symptoms: string[];
  organicTreatments: string[];
  prevention: string[];
  recommendedTreatment: string | null;
  intervalDays: number | null;
  phiDays: number | null;
  createdAt: string;
  updatedAt: string | null;
}

/** The text[] columns are nullable in 0023 but arrays (not nullable) in the spec: null -> []. */
function toPestLibraryEntry(row: PestLibraryRow): PestLibraryEntry {
  return {
    id: row.id,
    name: row.name,
    scientificName: row.scientific_name,
    category: row.category,
    riskLevel: row.risk_level,
    crops: row.crops ?? [],
    season: row.season,
    symptoms: row.symptoms ?? [],
    organicTreatments: row.organic_treatments ?? [],
    prevention: row.prevention ?? [],
    recommendedTreatment: row.recommended_treatment,
    intervalDays: row.interval_days === null ? null : Number(row.interval_days),
    phiDays: row.phi_days === null ? null : Number(row.phi_days),
    createdAt: row.created_at.toISOString(),
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

const PEST_LIBRARY_COLUMNS = `
  id, name, scientific_name, category, risk_level, crops, season, symptoms,
  organic_treatments, prevention, recommended_treatment, interval_days, phi_days,
  created_at, updated_at
`;

export interface PestLibraryFilters {
  q?: string;
  crop?: string;
}

// ---------------------------------------------------------------------------
// weather_risk_notes
// ---------------------------------------------------------------------------

interface WeatherRiskNoteRow {
  id: string;
  region: string;
  note: string;
  risk_level: string | null;
  valid_from: Date | null;
  valid_until: Date | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface WeatherRiskNote {
  id: string;
  region: string;
  note: string;
  riskLevel: string | null;
  validFrom: string | null;
  validUntil: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function toWeatherRiskNote(row: WeatherRiskNoteRow): WeatherRiskNote {
  return {
    id: row.id,
    region: row.region,
    note: row.note,
    riskLevel: row.risk_level,
    validFrom: row.valid_from === null ? null : toDateOnly(row.valid_from),
    validUntil: row.valid_until === null ? null : toDateOnly(row.valid_until),
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

const WEATHER_RISK_NOTE_COLUMNS = `
  id, region, note, risk_level, valid_from, valid_until, created_by, created_at, updated_at
`;

// ---------------------------------------------------------------------------
// pest_detections
// ---------------------------------------------------------------------------

interface PestDetectionRow {
  id: string;
  plot_id: string;
  farm_crop_id: string | null;
  pest_library_id: string | null;
  pest_name: string;
  scientific_name: string | null;
  crop_label: string | null;
  severity: string;
  status: string;
  detected_on: Date;
  notes: string | null;
  photo_upload_id: string | null;
  resolved_at: Date | null;
  resolution_effective: boolean | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface PestDetection {
  id: string;
  plotId: string;
  farmCropId: string | null;
  pestLibraryId: string | null;
  pestName: string;
  scientificName: string | null;
  cropLabel: string | null;
  severity: string;
  status: string;
  detectedOn: string;
  notes: string | null;
  photoUploadId: string | null;
  resolvedAt: string | null;
  resolutionEffective: boolean | null;
  createdAt: string;
  updatedAt: string | null;
}

function toPestDetection(row: PestDetectionRow): PestDetection {
  return {
    id: row.id,
    plotId: row.plot_id,
    farmCropId: row.farm_crop_id,
    pestLibraryId: row.pest_library_id,
    pestName: row.pest_name,
    scientificName: row.scientific_name,
    cropLabel: row.crop_label,
    severity: row.severity,
    status: row.status,
    detectedOn: toDateOnly(row.detected_on),
    notes: row.notes,
    photoUploadId: row.photo_upload_id,
    resolvedAt: toIsoOrNull(row.resolved_at),
    resolutionEffective: row.resolution_effective,
    createdAt: row.created_at.toISOString(),
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

const PEST_DETECTION_COLUMNS = `
  id, plot_id, farm_crop_id, pest_library_id, pest_name, scientific_name, crop_label, severity,
  status, detected_on, notes, photo_upload_id, resolved_at, resolution_effective,
  created_at, updated_at
`;

export interface InsertPestDetectionParams {
  plotId: string;
  farmCropId: string | null;
  pestLibraryId: string | null;
  pestName: string;
  scientificName: string | null;
  cropLabel: string | null;
  severity: string;
  detectedOn: string;
  notes: string | null;
  photoUploadId: string | null;
}

/**
 * `resolvedAt: 'NOW'` means "stamp `resolved_at = now()` in SQL" — the
 * timestamp is always the database clock, never a client value. `null`
 * clears it. Absent leaves it untouched.
 */
export interface PestDetectionPatch {
  status?: string;
  resolutionEffective?: boolean | null;
  notes?: string | null;
  resolvedAt?: 'NOW' | null;
}

// ---------------------------------------------------------------------------
// pest_treatment_logs
// ---------------------------------------------------------------------------

interface PestTreatmentLogRow {
  id: string;
  plot_id: string;
  farm_crop_id: string | null;
  detection_id: string | null;
  pest_library_id: string | null;
  pest_name: string;
  category: string;
  severity: string;
  treatment: string;
  interval_days: number | null;
  phi_days: number | null;
  applied_on: Date;
  next_application_date: Date | null;
  photo_upload_id: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface PestTreatmentLog {
  id: string;
  plotId: string;
  farmCropId: string | null;
  detectionId: string | null;
  pestLibraryId: string | null;
  pestName: string;
  category: string;
  severity: string;
  treatment: string;
  intervalDays: number | null;
  phiDays: number | null;
  appliedOn: string;
  nextApplicationDate: string | null;
  photoUploadId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function toPestTreatmentLog(row: PestTreatmentLogRow): PestTreatmentLog {
  return {
    id: row.id,
    plotId: row.plot_id,
    farmCropId: row.farm_crop_id,
    detectionId: row.detection_id,
    pestLibraryId: row.pest_library_id,
    pestName: row.pest_name,
    category: row.category,
    severity: row.severity,
    treatment: row.treatment,
    intervalDays: row.interval_days === null ? null : Number(row.interval_days),
    phiDays: row.phi_days === null ? null : Number(row.phi_days),
    appliedOn: toDateOnly(row.applied_on),
    nextApplicationDate: row.next_application_date === null ? null : toDateOnly(row.next_application_date),
    photoUploadId: row.photo_upload_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

const PEST_TREATMENT_LOG_COLUMNS = `
  id, plot_id, farm_crop_id, detection_id, pest_library_id, pest_name, category, severity,
  treatment, interval_days, phi_days, applied_on, next_application_date, photo_upload_id,
  created_at, updated_at
`;

export interface InsertPestTreatmentLogParams {
  plotId: string;
  farmCropId: string | null;
  detectionId: string | null;
  pestLibraryId: string | null;
  pestName: string;
  category: string;
  severity: string;
  treatment: string;
  intervalDays: number | null;
  phiDays: number | null;
  appliedOn: string;
  nextApplicationDate: string | null;
  photoUploadId: string | null;
}

// ---------------------------------------------------------------------------
// pest_treatment_reminders
// ---------------------------------------------------------------------------

interface PestTreatmentReminderRow {
  id: string;
  plot_id: string;
  detection_id: string | null;
  title: string;
  target_pest: string | null;
  due_date: Date;
  repeat_interval: string;
  status: string;
  completed_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface PestTreatmentReminder {
  id: string;
  plotId: string;
  detectionId: string | null;
  title: string;
  targetPest: string | null;
  dueDate: string;
  repeatInterval: string;
  status: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function toPestTreatmentReminder(row: PestTreatmentReminderRow): PestTreatmentReminder {
  return {
    id: row.id,
    plotId: row.plot_id,
    detectionId: row.detection_id,
    title: row.title,
    targetPest: row.target_pest,
    dueDate: toDateOnly(row.due_date),
    repeatInterval: row.repeat_interval,
    status: row.status,
    completedAt: toIsoOrNull(row.completed_at),
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

const PEST_TREATMENT_REMINDER_COLUMNS = `
  id, plot_id, detection_id, title, target_pest, due_date, repeat_interval, status,
  completed_at, notes, created_at, updated_at
`;

export interface InsertPestTreatmentReminderParams {
  plotId: string;
  detectionId: string | null;
  title: string;
  targetPest: string | null;
  dueDate: string;
  repeatInterval: string;
  notes: string | null;
}

/** `completedAt: 'NOW'` stamps `completed_at = now()` in SQL; `null` clears it; absent = untouched. */
export interface PestTreatmentReminderPatch {
  title?: string;
  dueDate?: string;
  status?: string;
  notes?: string | null;
  completedAt?: 'NOW' | null;
}

// ---------------------------------------------------------------------------
// analytics
// ---------------------------------------------------------------------------

export interface MonthCount {
  /** Calendar month of `detected_on`, 1-12. */
  month: number;
  count: number;
}

export interface CropCount {
  crop: string;
  count: number;
}

export interface TreatmentTally {
  treatment: string;
  timesUsed: number;
  timesEffective: number;
}

// ---------------------------------------------------------------------------
// repo
// ---------------------------------------------------------------------------

export interface OwnedPlotArgs {
  farmerId: string;
  farmId: string;
  plotId: string;
}

export interface OwnedFarmArgs {
  farmerId: string;
  farmId: string;
}

export interface PestRepo {
  findOwnedPlotId(db: Executor, args: OwnedPlotArgs): Promise<string | null>;
  findOwnedFarmId(db: Executor, args: OwnedFarmArgs): Promise<string | null>;
  /** `undefined` = no such upload at all; `null`/a userId = its (possibly-null) owner. */
  findUploadOwner(db: Executor, uploadId: string): Promise<string | null | undefined>;
  /** True when `farmCropId` is a live `farm_crops` row on this plot. */
  farmCropExistsOnPlot(db: Executor, plotId: string, farmCropId: string): Promise<boolean>;

  listPestLibrary(db: Executor, filters: PestLibraryFilters): Promise<PestLibraryEntry[]>;
  findPestLibraryEntryById(db: Executor, id: string): Promise<PestLibraryEntry | null>;

  listCurrentWeatherRiskNotes(db: Executor): Promise<WeatherRiskNote[]>;

  listDetections(db: Executor, plotId: string): Promise<PestDetection[]>;
  findDetectionById(db: Executor, plotId: string, id: string): Promise<PestDetection | null>;
  insertDetection(db: Executor, params: InsertPestDetectionParams): Promise<PestDetection>;
  updateDetection(
    db: Executor,
    plotId: string,
    id: string,
    patch: PestDetectionPatch,
  ): Promise<PestDetection | null>;

  listTreatmentLogs(db: Executor, plotId: string): Promise<PestTreatmentLog[]>;
  insertTreatmentLog(db: Executor, params: InsertPestTreatmentLogParams): Promise<PestTreatmentLog>;

  listReminders(db: Executor, plotId: string): Promise<PestTreatmentReminder[]>;
  findReminderById(db: Executor, plotId: string, id: string): Promise<PestTreatmentReminder | null>;
  insertReminder(db: Executor, params: InsertPestTreatmentReminderParams): Promise<PestTreatmentReminder>;
  updateReminder(
    db: Executor,
    plotId: string,
    id: string,
    patch: PestTreatmentReminderPatch,
  ): Promise<PestTreatmentReminder | null>;

  countDetectionsByMonth(db: Executor, farmId: string): Promise<MonthCount[]>;
  countDetectionsByCrop(db: Executor, farmId: string): Promise<CropCount[]>;
  tallyTreatmentEffectiveness(db: Executor, farmId: string): Promise<TreatmentTally[]>;
}

export const pestRepo: PestRepo = {
  /** Identical join to soil.repo#findOwnedPlotId. */
  async findOwnedPlotId(db, args) {
    const result = await db.query<{ id: string }>(
      `SELECT p.id
         FROM plots p
         JOIN farms f ON f.id = p.farm_id
        WHERE p.id = $1 AND p.farm_id = $2 AND f.farmer_id = $3 AND f.deleted_at IS NULL
        LIMIT 1`,
      [args.plotId, args.farmId, args.farmerId],
    );
    return result.rows[0]?.id ?? null;
  },

  async findOwnedFarmId(db, args) {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM farms WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [args.farmId, args.farmerId],
    );
    return result.rows[0]?.id ?? null;
  },

  async findUploadOwner(db, uploadId) {
    const result = await db.query<{ uploaded_by: string | null }>(
      `SELECT uploaded_by FROM uploads WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [uploadId],
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0]?.uploaded_by ?? null;
  },

  async farmCropExistsOnPlot(db, plotId, farmCropId) {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM farm_crops WHERE id = $1 AND plot_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [farmCropId, plotId],
    );
    return result.rows.length > 0;
  },

  async listPestLibrary(db, filters) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (filters.q !== undefined) {
      params.push(`%${escapeLike(filters.q)}%`);
      conditions.push(`(name ILIKE $${params.length} OR scientific_name ILIKE $${params.length})`);
    }
    if (filters.crop !== undefined) {
      params.push(filters.crop);
      conditions.push(`EXISTS (SELECT 1 FROM unnest(crops) AS c WHERE lower(c) = lower($${params.length}))`);
    }
    const where = conditions.length === 0 ? '' : `WHERE ${conditions.join(' AND ')}`;
    const result = await db.query<PestLibraryRow>(
      `SELECT ${PEST_LIBRARY_COLUMNS} FROM pest_library ${where} ORDER BY name ASC`,
      params,
    );
    return result.rows.map(toPestLibraryEntry);
  },

  async findPestLibraryEntryById(db, id) {
    const result = await db.query<PestLibraryRow>(
      `SELECT ${PEST_LIBRARY_COLUMNS} FROM pest_library WHERE id = $1 LIMIT 1`,
      [id],
    );
    const row = result.rows[0];
    return row === undefined ? null : toPestLibraryEntry(row);
  },

  /** A null bound is open-ended on that side; both bounds are inclusive. */
  async listCurrentWeatherRiskNotes(db) {
    const result = await db.query<WeatherRiskNoteRow>(
      `SELECT ${WEATHER_RISK_NOTE_COLUMNS} FROM weather_risk_notes
        WHERE (valid_from IS NULL OR valid_from <= CURRENT_DATE)
          AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        ORDER BY valid_from DESC NULLS LAST, created_at DESC`,
    );
    return result.rows.map(toWeatherRiskNote);
  },

  async listDetections(db, plotId) {
    const result = await db.query<PestDetectionRow>(
      `SELECT ${PEST_DETECTION_COLUMNS} FROM pest_detections
        WHERE plot_id = $1
        ORDER BY detected_on DESC, created_at DESC`,
      [plotId],
    );
    return result.rows.map(toPestDetection);
  },

  async findDetectionById(db, plotId, id) {
    const result = await db.query<PestDetectionRow>(
      `SELECT ${PEST_DETECTION_COLUMNS} FROM pest_detections WHERE plot_id = $1 AND id = $2 LIMIT 1`,
      [plotId, id],
    );
    const row = result.rows[0];
    return row === undefined ? null : toPestDetection(row);
  },

  async insertDetection(db, params) {
    const result = await db.query<PestDetectionRow>(
      `INSERT INTO pest_detections (
         plot_id, farm_crop_id, pest_library_id, pest_name, scientific_name, crop_label, severity,
         detected_on, notes, photo_upload_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${PEST_DETECTION_COLUMNS}`,
      [
        params.plotId,
        params.farmCropId,
        params.pestLibraryId,
        params.pestName,
        params.scientificName,
        params.cropLabel,
        params.severity,
        params.detectedOn,
        params.notes,
        params.photoUploadId,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('pest_detections insert returned no row');
    return toPestDetection(row);
  },

  async updateDetection(db, plotId, id, patch) {
    const setClauses: string[] = ['updated_at = now()'];
    const values: unknown[] = [plotId, id];

    const scalarColumns: Array<[keyof Omit<PestDetectionPatch, 'resolvedAt'>, string]> = [
      ['status', 'status'],
      ['resolutionEffective', 'resolution_effective'],
      ['notes', 'notes'],
    ];
    for (const [key, column] of scalarColumns) {
      const value = patch[key];
      if (value === undefined) continue;
      values.push(value);
      setClauses.push(`${column} = $${values.length}`);
    }
    if (patch.resolvedAt === 'NOW') setClauses.push('resolved_at = now()');
    if (patch.resolvedAt === null) setClauses.push('resolved_at = NULL');

    const result = await db.query<PestDetectionRow>(
      `UPDATE pest_detections SET ${setClauses.join(', ')}
        WHERE plot_id = $1 AND id = $2
        RETURNING ${PEST_DETECTION_COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    return row === undefined ? null : toPestDetection(row);
  },

  async listTreatmentLogs(db, plotId) {
    const result = await db.query<PestTreatmentLogRow>(
      `SELECT ${PEST_TREATMENT_LOG_COLUMNS} FROM pest_treatment_logs
        WHERE plot_id = $1
        ORDER BY applied_on DESC, created_at DESC`,
      [plotId],
    );
    return result.rows.map(toPestTreatmentLog);
  },

  async insertTreatmentLog(db, params) {
    const result = await db.query<PestTreatmentLogRow>(
      `INSERT INTO pest_treatment_logs (
         plot_id, farm_crop_id, detection_id, pest_library_id, pest_name, category, severity,
         treatment, interval_days, phi_days, applied_on, next_application_date, photo_upload_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING ${PEST_TREATMENT_LOG_COLUMNS}`,
      [
        params.plotId,
        params.farmCropId,
        params.detectionId,
        params.pestLibraryId,
        params.pestName,
        params.category,
        params.severity,
        params.treatment,
        params.intervalDays,
        params.phiDays,
        params.appliedOn,
        params.nextApplicationDate,
        params.photoUploadId,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('pest_treatment_logs insert returned no row');
    return toPestTreatmentLog(row);
  },

  async listReminders(db, plotId) {
    const result = await db.query<PestTreatmentReminderRow>(
      `SELECT ${PEST_TREATMENT_REMINDER_COLUMNS} FROM pest_treatment_reminders
        WHERE plot_id = $1
        ORDER BY due_date ASC, created_at ASC`,
      [plotId],
    );
    return result.rows.map(toPestTreatmentReminder);
  },

  async findReminderById(db, plotId, id) {
    const result = await db.query<PestTreatmentReminderRow>(
      `SELECT ${PEST_TREATMENT_REMINDER_COLUMNS} FROM pest_treatment_reminders
        WHERE plot_id = $1 AND id = $2 LIMIT 1`,
      [plotId, id],
    );
    const row = result.rows[0];
    return row === undefined ? null : toPestTreatmentReminder(row);
  },

  async insertReminder(db, params) {
    const result = await db.query<PestTreatmentReminderRow>(
      `INSERT INTO pest_treatment_reminders (
         plot_id, detection_id, title, target_pest, due_date, repeat_interval, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${PEST_TREATMENT_REMINDER_COLUMNS}`,
      [
        params.plotId,
        params.detectionId,
        params.title,
        params.targetPest,
        params.dueDate,
        params.repeatInterval,
        params.notes,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('pest_treatment_reminders insert returned no row');
    return toPestTreatmentReminder(row);
  },

  async updateReminder(db, plotId, id, patch) {
    const setClauses: string[] = ['updated_at = now()'];
    const values: unknown[] = [plotId, id];

    const scalarColumns: Array<[keyof Omit<PestTreatmentReminderPatch, 'completedAt'>, string]> = [
      ['title', 'title'],
      ['dueDate', 'due_date'],
      ['status', 'status'],
      ['notes', 'notes'],
    ];
    for (const [key, column] of scalarColumns) {
      const value = patch[key];
      if (value === undefined) continue;
      values.push(value);
      setClauses.push(`${column} = $${values.length}`);
    }
    if (patch.completedAt === 'NOW') setClauses.push('completed_at = now()');
    if (patch.completedAt === null) setClauses.push('completed_at = NULL');

    const result = await db.query<PestTreatmentReminderRow>(
      `UPDATE pest_treatment_reminders SET ${setClauses.join(', ')}
        WHERE plot_id = $1 AND id = $2
        RETURNING ${PEST_TREATMENT_REMINDER_COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    return row === undefined ? null : toPestTreatmentReminder(row);
  },

  async countDetectionsByMonth(db, farmId) {
    const result = await db.query<{ month: number; count: number }>(
      `SELECT EXTRACT(MONTH FROM d.detected_on)::int AS month, COUNT(*)::int AS count
         FROM pest_detections d
         JOIN plots p ON p.id = d.plot_id
        WHERE p.farm_id = $1
        GROUP BY 1
        ORDER BY 1`,
      [farmId],
    );
    return result.rows.map((row) => ({ month: Number(row.month), count: Number(row.count) }));
  },

  /**
   * Detections with no `farm_crop_id` are EXCLUDED (inner join), not bucketed
   * as "Unknown": the question is "which crops are most affected", and an
   * untagged sighting says nothing about any crop. A soft-deleted farm_crops
   * row still counts — the detection happened against that crop regardless.
   */
  async countDetectionsByCrop(db, farmId) {
    const result = await db.query<{ crop: string; count: number }>(
      `SELECT cm.name AS crop, COUNT(*)::int AS count
         FROM pest_detections d
         JOIN plots p ON p.id = d.plot_id
         JOIN farm_crops fc ON fc.id = d.farm_crop_id
         JOIN crop_master cm ON cm.id = fc.crop_id
        WHERE p.farm_id = $1
        GROUP BY cm.name
        ORDER BY count DESC, cm.name ASC`,
      [farmId],
    );
    return result.rows.map((row) => ({ crop: row.crop, count: Number(row.count) }));
  },

  /**
   * Grouped by the exact `treatment` text the farmer logged (no case/space
   * folding — the farmer's own label is the identity). `timesEffective`
   * counts only logs whose linked detection carries the farmer's own
   * `resolution_effective = true`; an unlinked log (detection_id NULL, or its
   * detection since deleted -> SET NULL) or an unassessed detection
   * (resolution_effective NULL) counts toward `timesUsed` only.
   */
  async tallyTreatmentEffectiveness(db, farmId) {
    const result = await db.query<{ treatment: string; times_used: number; times_effective: number }>(
      `SELECT t.treatment,
              COUNT(*)::int AS times_used,
              COUNT(*) FILTER (WHERE d.resolution_effective IS TRUE)::int AS times_effective
         FROM pest_treatment_logs t
         JOIN plots p ON p.id = t.plot_id
         LEFT JOIN pest_detections d ON d.id = t.detection_id
        WHERE p.farm_id = $1
        GROUP BY t.treatment
        ORDER BY times_used DESC, t.treatment ASC`,
      [farmId],
    );
    return result.rows.map((row) => ({
      treatment: row.treatment,
      timesUsed: Number(row.times_used),
      timesEffective: Number(row.times_effective),
    }));
  },
};
