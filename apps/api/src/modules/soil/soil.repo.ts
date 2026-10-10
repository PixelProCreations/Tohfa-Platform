/**
 * soil.repo — SQL only.
 *
 * No authorization decisions live here — the service verifies plot ownership
 * (`findOwnedPlotId`, which joins `plots -> farms -> farmer_id` in one query,
 * the same relationship farms.service.ts checks across two calls) BEFORE
 * calling any of the per-table methods below. Every per-table statement still
 * filters on `plot_id` (and, for detail/patch/delete, the row's own id too)
 * so a mutation can never silently touch a different plot's data.
 *
 * `soil_test_records`, `soil_amendments`, `soil_moisture_observations`,
 * `erosion_conservation_notes`, `crop_rotation_entries` and
 * `cover_crop_windows` are all plain mutable/insert-only rows — none of them
 * are one of CLAUDE.md's four named append-only ledgers, so ordinary
 * UPDATE/DELETE is fine where the module calls for it.
 *
 * Everything lives behind ONE `SoilRepo` interface (rather than one object
 * per table) so the service takes a single injectable dependency, exactly
 * like `FarmsRepo` does for farms + plots.
 */
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';

/** `date` columns come back as JS Dates from `pg`; keep only the calendar date. */
function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// BR-40 classification bands (system_config)
// ---------------------------------------------------------------------------

export interface ClassificationBands {
  low: number;
  high: number;
  belowLabel: string;
  insideLabel: string;
  aboveLabel: string;
}

export type SoilMetricKey =
  | 'organicCarbon'
  | 'ph'
  | 'ec'
  | 'tds'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium';

/**
 * One system_config key per metric. NOTE: no migration or seed inserts these
 * rows yet — the band values (low/high and the three labels per metric) are a
 * product/agronomy decision that no file in this repo defines (docs/rules.md
 * BR-40 only says they must live in system_config). Until the owner supplies
 * them, `getClassificationBands` fails with a clear 503 rather than guessing.
 */
export const SOIL_CLASSIFICATION_CONFIG_KEYS: Record<SoilMetricKey, string> = {
  organicCarbon: 'soil.classification.organic_carbon',
  ph: 'soil.classification.ph',
  ec: 'soil.classification.ec',
  tds: 'soil.classification.tds',
  nitrogen: 'soil.classification.nitrogen',
  phosphorus: 'soil.classification.phosphorus',
  potassium: 'soil.classification.potassium',
};

// ---------------------------------------------------------------------------
// soil_test_records
// ---------------------------------------------------------------------------

interface SoilTestRecordRow {
  id: string;
  plot_id: string;
  test_date: Date;
  next_due_date: Date;
  organic_carbon_pct: string;
  ph: string;
  ec_ds_per_m: string;
  tds_ppm: number | null;
  nitrogen_kg_per_ha: string | null;
  phosphorus_kg_per_ha: string | null;
  potassium_kg_per_ha: string | null;
  lime_status: string | null;
  lab_report_upload_id: string | null;
  created_at: Date;
  updated_at: Date | null;
}

/** Raw reading, no classification labels — those are computed in the service. */
export interface SoilTestRecord {
  id: string;
  plotId: string;
  testDate: string;
  nextDueDate: string;
  organicCarbonPct: number;
  ph: number;
  ecDsPerM: number;
  tdsPpm: number | null;
  nitrogenKgPerHa: number | null;
  phosphorusKgPerHa: number | null;
  potassiumKgPerHa: number | null;
  limeStatus: string | null;
  labReportUploadId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function toSoilTestRecord(row: SoilTestRecordRow): SoilTestRecord {
  return {
    id: row.id,
    plotId: row.plot_id,
    testDate: toDateOnly(row.test_date),
    nextDueDate: toDateOnly(row.next_due_date),
    organicCarbonPct: Number(row.organic_carbon_pct),
    ph: Number(row.ph),
    ecDsPerM: Number(row.ec_ds_per_m),
    tdsPpm: row.tds_ppm,
    nitrogenKgPerHa: row.nitrogen_kg_per_ha === null ? null : Number(row.nitrogen_kg_per_ha),
    phosphorusKgPerHa: row.phosphorus_kg_per_ha === null ? null : Number(row.phosphorus_kg_per_ha),
    potassiumKgPerHa: row.potassium_kg_per_ha === null ? null : Number(row.potassium_kg_per_ha),
    limeStatus: row.lime_status,
    labReportUploadId: row.lab_report_upload_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const SOIL_TEST_COLUMNS = `
  id, plot_id, test_date, next_due_date, organic_carbon_pct, ph, ec_ds_per_m, tds_ppm,
  nitrogen_kg_per_ha, phosphorus_kg_per_ha, potassium_kg_per_ha, lime_status,
  lab_report_upload_id, created_at, updated_at
`;

export interface InsertSoilTestParams {
  plotId: string;
  testDate: string;
  nextDueDate: string;
  organicCarbonPct: number;
  ph: number;
  ecDsPerM: number;
  tdsPpm: number | null;
  nitrogenKgPerHa: number | null;
  phosphorusKgPerHa: number | null;
  potassiumKgPerHa: number | null;
  limeStatus: string | null;
  labReportUploadId: string | null;
}

// ---------------------------------------------------------------------------
// soil_amendments
// ---------------------------------------------------------------------------

interface SoilAmendmentRow {
  id: string;
  plot_id: string;
  amendment_type: string;
  quantity_kg: string;
  applied_date: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface SoilAmendment {
  id: string;
  plotId: string;
  amendmentType: string;
  quantityKg: number;
  appliedDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function toSoilAmendment(row: SoilAmendmentRow): SoilAmendment {
  return {
    id: row.id,
    plotId: row.plot_id,
    amendmentType: row.amendment_type,
    quantityKg: Number(row.quantity_kg),
    appliedDate: toDateOnly(row.applied_date),
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const SOIL_AMENDMENT_COLUMNS = `
  id, plot_id, amendment_type, quantity_kg, applied_date, notes, created_at, updated_at
`;

export interface InsertSoilAmendmentParams {
  plotId: string;
  amendmentType: string;
  quantityKg: number;
  appliedDate: string;
  notes: string | null;
}

export interface SoilAmendmentPatch {
  amendmentType?: string;
  quantityKg?: number;
  appliedDate?: string;
  notes?: string | null;
}

// ---------------------------------------------------------------------------
// soil_moisture_observations
// ---------------------------------------------------------------------------

interface SoilMoistureRow {
  id: string;
  plot_id: string;
  level: string;
  observed_at: Date;
  observed_by: string;
  created_at: Date;
  updated_at: Date | null;
}

export interface SoilMoistureObservation {
  id: string;
  plotId: string;
  level: string;
  observedAt: string;
  observedBy: string;
  createdAt: string;
  updatedAt: string | null;
}

function toSoilMoisture(row: SoilMoistureRow): SoilMoistureObservation {
  return {
    id: row.id,
    plotId: row.plot_id,
    level: row.level,
    observedAt: row.observed_at.toISOString(),
    observedBy: row.observed_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const SOIL_MOISTURE_COLUMNS = `
  id, plot_id, level, observed_at, observed_by, created_at, updated_at
`;

export interface InsertSoilMoistureParams {
  plotId: string;
  level: string;
  observedAt: string | null;
  observedBy: string;
}

// ---------------------------------------------------------------------------
// erosion_conservation_notes
// ---------------------------------------------------------------------------

interface ErosionNoteRow {
  id: string;
  plot_id: string;
  risk_level: string;
  practice_notes: string | null;
  logged_at: Date;
  created_at: Date;
  updated_at: Date | null;
}

export interface ErosionNote {
  id: string;
  plotId: string;
  riskLevel: string;
  practiceNotes: string | null;
  loggedAt: string;
  createdAt: string;
  updatedAt: string | null;
}

function toErosionNote(row: ErosionNoteRow): ErosionNote {
  return {
    id: row.id,
    plotId: row.plot_id,
    riskLevel: row.risk_level,
    practiceNotes: row.practice_notes,
    loggedAt: row.logged_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const EROSION_NOTE_COLUMNS = `
  id, plot_id, risk_level, practice_notes, logged_at, created_at, updated_at
`;

export interface InsertErosionNoteParams {
  plotId: string;
  riskLevel: string;
  practiceNotes: string | null;
  loggedAt: string | null;
}

// ---------------------------------------------------------------------------
// crop_rotation_entries
// ---------------------------------------------------------------------------

interface CropRotationEntryRow {
  id: string;
  plot_id: string;
  sequence_order: number;
  crop_name: string;
  planned_date: Date | null;
  status: string;
  created_at: Date;
  updated_at: Date | null;
}

export interface CropRotationEntry {
  id: string;
  plotId: string;
  sequenceOrder: number;
  cropName: string;
  plannedDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

function toCropRotationEntry(row: CropRotationEntryRow): CropRotationEntry {
  return {
    id: row.id,
    plotId: row.plot_id,
    sequenceOrder: row.sequence_order,
    cropName: row.crop_name,
    plannedDate: row.planned_date === null ? null : toDateOnly(row.planned_date),
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const CROP_ROTATION_COLUMNS = `
  id, plot_id, sequence_order, crop_name, planned_date, status, created_at, updated_at
`;

export interface CropRotationEntryWrite {
  sequenceOrder: number;
  cropName: string;
  plannedDate: string | null;
  status: string;
}

// ---------------------------------------------------------------------------
// cover_crop_windows
// ---------------------------------------------------------------------------

interface CoverCropWindowRow {
  id: string;
  plot_id: string;
  cover_crop_type: string;
  window_start: Date;
  window_end: Date;
  created_at: Date;
  updated_at: Date | null;
}

export interface CoverCropWindow {
  id: string;
  plotId: string;
  coverCropType: string;
  windowStart: string;
  windowEnd: string;
  createdAt: string;
  updatedAt: string | null;
}

function toCoverCropWindow(row: CoverCropWindowRow): CoverCropWindow {
  return {
    id: row.id,
    plotId: row.plot_id,
    coverCropType: row.cover_crop_type,
    windowStart: toDateOnly(row.window_start),
    windowEnd: toDateOnly(row.window_end),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at === null ? null : row.updated_at.toISOString(),
  };
}

const COVER_CROP_WINDOW_COLUMNS = `
  id, plot_id, cover_crop_type, window_start, window_end, created_at, updated_at
`;

export interface InsertCoverCropWindowParams {
  plotId: string;
  coverCropType: string;
  windowStart: string;
  windowEnd: string;
}

// ---------------------------------------------------------------------------
// repo
// ---------------------------------------------------------------------------

export interface OwnedPlotArgs {
  farmerId: string;
  farmId: string;
  plotId: string;
}

export interface SoilRepo {
  findOwnedPlotId(db: Executor, args: OwnedPlotArgs): Promise<string | null>;
  /** `undefined` = no such upload at all; `null`/a userId = its (possibly-null) owner. */
  findUploadOwner(db: Executor, uploadId: string): Promise<string | null | undefined>;
  getClassificationBands(db: Executor): Promise<Record<SoilMetricKey, ClassificationBands>>;

  listSoilTests(db: Executor, plotId: string): Promise<SoilTestRecord[]>;
  findSoilTestById(db: Executor, plotId: string, testId: string): Promise<SoilTestRecord | null>;
  insertSoilTest(db: Executor, params: InsertSoilTestParams): Promise<SoilTestRecord>;

  findOwnedFarmSummary(
    db: Executor,
    farmId: string,
    farmerId: string,
  ): Promise<FarmSummaryRow | null>;
  listPlotsForFarm(db: Executor, farmId: string): Promise<FarmPlotSummary[]>;

  listSoilAmendments(db: Executor, plotId: string): Promise<SoilAmendment[]>;
  findSoilAmendmentById(db: Executor, plotId: string, id: string): Promise<SoilAmendment | null>;
  insertSoilAmendment(db: Executor, params: InsertSoilAmendmentParams): Promise<SoilAmendment>;
  updateSoilAmendment(
    db: Executor,
    plotId: string,
    id: string,
    patch: SoilAmendmentPatch,
  ): Promise<SoilAmendment | null>;
  deleteSoilAmendment(db: Executor, plotId: string, id: string): Promise<boolean>;

  listSoilMoisture(db: Executor, plotId: string): Promise<SoilMoistureObservation[]>;
  insertSoilMoisture(db: Executor, params: InsertSoilMoistureParams): Promise<SoilMoistureObservation>;

  listErosionNotes(db: Executor, plotId: string): Promise<ErosionNote[]>;
  insertErosionNote(db: Executor, params: InsertErosionNoteParams): Promise<ErosionNote>;

  listCropRotation(db: Executor, plotId: string): Promise<CropRotationEntry[]>;
  replaceCropRotationSequence(
    tx: Executor,
    plotId: string,
    entries: CropRotationEntryWrite[],
  ): Promise<CropRotationEntry[]>;

  findCurrentCoverCropWindow(db: Executor, plotId: string): Promise<CoverCropWindow | null>;
  insertCoverCropWindow(db: Executor, params: InsertCoverCropWindowParams): Promise<CoverCropWindow>;
}

export interface FarmSummaryRow {
  farmId: string;
  farmName: string;
  district: string;
  taluk: string | null;
  village: string | null;
  totalAcres: number | null;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  tohfaFarmerId: string;
}

export interface FarmPlotSummary {
  id: string;
  farmId: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  sunExposure: string | null;
  irrigationType: string | null;
}

export const soilRepo: SoilRepo = {
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

  async findUploadOwner(db, uploadId) {
    const result = await db.query<{ uploaded_by: string | null }>(
      `SELECT uploaded_by FROM uploads WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [uploadId],
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0]?.uploaded_by ?? null;
  },

  /**
   * Batch-reads every classification band this module needs in ONE round
   * trip (BR-40: one shared function, fed by one config read, not seven).
   * Throws a 503 AppError naming every missing key — a soil test response
   * cannot silently fall back to a hidden literal, since that is exactly what
   * BR-40 forbids.
   */
  async getClassificationBands(db) {
    const keys = Object.values(SOIL_CLASSIFICATION_CONFIG_KEYS);
    const result = await db.query<{ key: string; value: ClassificationBands }>(
      `SELECT key, value FROM system_config WHERE key = ANY($1::text[])`,
      [keys],
    );
    const byKey = new Map(result.rows.map((row) => [row.key, row.value]));

    // Collect EVERY missing key so one error tells the operator the whole
    // list, not just the first gap.
    const missing = Object.values(SOIL_CLASSIFICATION_CONFIG_KEYS).filter((key) => !byKey.has(key));
    if (missing.length > 0) {
      // 503, not a plain Error (-> opaque 500): the request is fine, the
      // deployment is not configured. There is no dedicated config ErrorCode,
      // so the generic INTERNAL code carries an explicit 503 status; the
      // fix is data (insert the system_config rows), not a code change.
      throw new AppError('INTERNAL', {
        status: 503,
        detail:
          'Soil classification is not configured: system_config is missing ' +
          `${missing.join(', ')}. BR-40 forbids a hard-coded fallback; an administrator must insert these rows.`,
        meta: { missingConfigKeys: missing },
      });
    }

    const bands = {} as Record<SoilMetricKey, ClassificationBands>;
    for (const [metric, key] of Object.entries(SOIL_CLASSIFICATION_CONFIG_KEYS) as Array<
      [SoilMetricKey, string]
    >) {
      bands[metric] = byKey.get(key) as ClassificationBands;
    }
    return bands;
  },

  async listSoilTests(db, plotId) {
    const result = await db.query<SoilTestRecordRow>(
      `SELECT ${SOIL_TEST_COLUMNS} FROM soil_test_records
        WHERE plot_id = $1
        ORDER BY test_date DESC, created_at DESC`,
      [plotId],
    );
    return result.rows.map(toSoilTestRecord);
  },

  async findOwnedFarmSummary(db, farmId, farmerId) {
    const result = await db.query<{
      farm_id: string;
      farm_name: string;
      district: string;
      taluk: string | null;
      village: string | null;
      area_acres: string | null;
      farmer_id: string;
      farmer_name: string;
      farmer_mobile: string;
      tohfa_farmer_id: string;
    }>(
      `SELECT f.id AS farm_id, f.name AS farm_name, f.district, f.taluk, f.village, f.area_acres,
              fm.id AS farmer_id, u.full_name AS farmer_name, u.mobile AS farmer_mobile, fm.tohfa_farmer_id
         FROM farms f
         JOIN farmers fm ON fm.id = f.farmer_id
         JOIN users u ON u.id = fm.user_id
        WHERE f.id = $1 AND f.farmer_id = $2 AND f.deleted_at IS NULL
        LIMIT 1`,
      [farmId, farmerId],
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      farmId: row.farm_id,
      farmName: row.farm_name,
      district: row.district,
      taluk: row.taluk,
      village: row.village,
      totalAcres: row.area_acres == null ? null : Number(row.area_acres),
      farmerId: row.farmer_id,
      farmerName: row.farmer_name,
      farmerMobile: row.farmer_mobile,
      tohfaFarmerId: row.tohfa_farmer_id,
    };
  },

  async listPlotsForFarm(db, farmId) {
    const result = await db.query<{
      id: string;
      farm_id: string;
      name: string;
      area_acres: string | null;
      soil_type: string | null;
      sun_exposure: string | null;
      irrigation_type: string | null;
    }>(
      `SELECT id, farm_id, name, area_acres, soil_type, sun_exposure, irrigation_type
         FROM plots
        WHERE farm_id = $1
        ORDER BY created_at ASC`,
      [farmId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      farmId: row.farm_id,
      name: row.name,
      areaAcres: row.area_acres == null ? null : Number(row.area_acres),
      soilType: row.soil_type,
      sunExposure: row.sun_exposure,
      irrigationType: row.irrigation_type,
    }));
  },

  async findSoilTestById(db, plotId, testId) {
    const result = await db.query<SoilTestRecordRow>(
      `SELECT ${SOIL_TEST_COLUMNS} FROM soil_test_records WHERE plot_id = $1 AND id = $2 LIMIT 1`,
      [plotId, testId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toSoilTestRecord(row);
  },

  async insertSoilTest(db, params) {
    const result = await db.query<SoilTestRecordRow>(
      `INSERT INTO soil_test_records (
         plot_id, test_date, next_due_date, organic_carbon_pct, ph, ec_ds_per_m, tds_ppm,
         nitrogen_kg_per_ha, phosphorus_kg_per_ha, potassium_kg_per_ha, lime_status,
         lab_report_upload_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING ${SOIL_TEST_COLUMNS}`,
      [
        params.plotId,
        params.testDate,
        params.nextDueDate,
        params.organicCarbonPct,
        params.ph,
        params.ecDsPerM,
        params.tdsPpm,
        params.nitrogenKgPerHa,
        params.phosphorusKgPerHa,
        params.potassiumKgPerHa,
        params.limeStatus,
        params.labReportUploadId,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('soil_test_records insert returned no row');
    return toSoilTestRecord(row);
  },

  async listSoilAmendments(db, plotId) {
    const result = await db.query<SoilAmendmentRow>(
      `SELECT ${SOIL_AMENDMENT_COLUMNS} FROM soil_amendments
        WHERE plot_id = $1
        ORDER BY applied_date DESC, created_at DESC`,
      [plotId],
    );
    return result.rows.map(toSoilAmendment);
  },

  async findSoilAmendmentById(db, plotId, id) {
    const result = await db.query<SoilAmendmentRow>(
      `SELECT ${SOIL_AMENDMENT_COLUMNS} FROM soil_amendments WHERE plot_id = $1 AND id = $2 LIMIT 1`,
      [plotId, id],
    );
    const row = result.rows[0];
    return row === undefined ? null : toSoilAmendment(row);
  },

  async insertSoilAmendment(db, params) {
    const result = await db.query<SoilAmendmentRow>(
      `INSERT INTO soil_amendments (plot_id, amendment_type, quantity_kg, applied_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SOIL_AMENDMENT_COLUMNS}`,
      [params.plotId, params.amendmentType, params.quantityKg, params.appliedDate, params.notes],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('soil_amendments insert returned no row');
    return toSoilAmendment(row);
  },

  async updateSoilAmendment(db, plotId, id, patch) {
    const setClauses: string[] = ['updated_at = now()'];
    const values: unknown[] = [plotId, id];
    let idx = 3;

    const scalarColumns: Array<[keyof SoilAmendmentPatch, string]> = [
      ['amendmentType', 'amendment_type'],
      ['quantityKg', 'quantity_kg'],
      ['appliedDate', 'applied_date'],
      ['notes', 'notes'],
    ];
    for (const [key, column] of scalarColumns) {
      const value = patch[key];
      if (value === undefined) continue;
      setClauses.push(`${column} = $${idx}`);
      values.push(value);
      idx += 1;
    }

    const result = await db.query<{ id: string }>(
      `UPDATE soil_amendments SET ${setClauses.join(', ')} WHERE plot_id = $1 AND id = $2 RETURNING id`,
      values,
    );
    if (result.rowCount === 0) return null;
    return this.findSoilAmendmentById(db, plotId, id);
  },

  async deleteSoilAmendment(db, plotId, id) {
    const result = await db.query(`DELETE FROM soil_amendments WHERE plot_id = $1 AND id = $2`, [
      plotId,
      id,
    ]);
    return result.rowCount === 1;
  },

  async listSoilMoisture(db, plotId) {
    const result = await db.query<SoilMoistureRow>(
      `SELECT ${SOIL_MOISTURE_COLUMNS} FROM soil_moisture_observations
        WHERE plot_id = $1
        ORDER BY observed_at DESC`,
      [plotId],
    );
    return result.rows.map(toSoilMoisture);
  },

  async insertSoilMoisture(db, params) {
    const result = await db.query<SoilMoistureRow>(
      `INSERT INTO soil_moisture_observations (plot_id, level, observed_at, observed_by)
       VALUES ($1, $2, COALESCE($3::timestamptz, now()), $4)
       RETURNING ${SOIL_MOISTURE_COLUMNS}`,
      [params.plotId, params.level, params.observedAt, params.observedBy],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('soil_moisture_observations insert returned no row');
    return toSoilMoisture(row);
  },

  async listErosionNotes(db, plotId) {
    const result = await db.query<ErosionNoteRow>(
      `SELECT ${EROSION_NOTE_COLUMNS} FROM erosion_conservation_notes
        WHERE plot_id = $1
        ORDER BY logged_at DESC`,
      [plotId],
    );
    return result.rows.map(toErosionNote);
  },

  async insertErosionNote(db, params) {
    const result = await db.query<ErosionNoteRow>(
      `INSERT INTO erosion_conservation_notes (plot_id, risk_level, practice_notes, logged_at)
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()))
       RETURNING ${EROSION_NOTE_COLUMNS}`,
      [params.plotId, params.riskLevel, params.practiceNotes, params.loggedAt],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('erosion_conservation_notes insert returned no row');
    return toErosionNote(row);
  },

  async listCropRotation(db, plotId) {
    const result = await db.query<CropRotationEntryRow>(
      `SELECT ${CROP_ROTATION_COLUMNS} FROM crop_rotation_entries
        WHERE plot_id = $1
        ORDER BY sequence_order ASC`,
      [plotId],
    );
    return result.rows.map(toCropRotationEntry);
  },

  /** Delete-then-insert inside the caller's transaction — the whole plan is replaced atomically. */
  async replaceCropRotationSequence(tx, plotId, entries) {
    await tx.query(`DELETE FROM crop_rotation_entries WHERE plot_id = $1`, [plotId]);

    const inserted: CropRotationEntry[] = [];
    for (const entry of entries) {
      const result = await tx.query<CropRotationEntryRow>(
        `INSERT INTO crop_rotation_entries (plot_id, sequence_order, crop_name, planned_date, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${CROP_ROTATION_COLUMNS}`,
        [plotId, entry.sequenceOrder, entry.cropName, entry.plannedDate, entry.status],
      );
      const row = result.rows[0];
      if (row === undefined) throw new Error('crop_rotation_entries insert returned no row');
      inserted.push(toCropRotationEntry(row));
    }
    return inserted.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  },

  /**
   * The plot's "current/most relevant" window: one that contains today if
   * any does, else the nearest upcoming one, else the most recently ended
   * one. Ties within a tier are broken by `created_at DESC` (the latest
   * thing the farmer logged wins).
   */
  async findCurrentCoverCropWindow(db, plotId) {
    const result = await db.query<CoverCropWindowRow>(
      `SELECT ${COVER_CROP_WINDOW_COLUMNS} FROM cover_crop_windows
        WHERE plot_id = $1
        ORDER BY
          CASE
            WHEN CURRENT_DATE BETWEEN window_start AND window_end THEN 0
            WHEN window_start > CURRENT_DATE THEN 1
            ELSE 2
          END ASC,
          CASE WHEN window_start > CURRENT_DATE THEN window_start END ASC,
          CASE WHEN window_start <= CURRENT_DATE THEN window_end END DESC,
          created_at DESC
        LIMIT 1`,
      [plotId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toCoverCropWindow(row);
  },

  async insertCoverCropWindow(db, params) {
    const result = await db.query<CoverCropWindowRow>(
      `INSERT INTO cover_crop_windows (plot_id, cover_crop_type, window_start, window_end)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COVER_CROP_WINDOW_COLUMNS}`,
      [params.plotId, params.coverCropType, params.windowStart, params.windowEnd],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('cover_crop_windows insert returned no row');
    return toCoverCropWindow(row);
  },
};
