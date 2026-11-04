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
 *  - Animal records (health, breeding, feed plans/logs, housing, hygiene;
 *    0084) carry their own farm_id but are owned through the ANIMAL: every
 *    insert is an `INSERT ... SELECT` from the caller's own live animal and
 *    every list joins animal -> farm -> farmer, so a foreign animalId writes
 *    nothing and lists nothing (BR-137a/b) even if the service forgot to check.
 *    Their responses are parsed through the allow-list Zod response schemas,
 *    so farm_id (or any stray jsonb key) can never reach a client (BR-137f).
 *
 * Schema: db/migrations/0024_livestock.sql, 0084_livestock_animal_records.sql.
 */
import type { Executor } from '../../db/pool.js';
import {
  livestockBreedingRecord,
  livestockFeedLog,
  livestockFeedPlan,
  livestockHealthRecord,
  livestockHousingRecord,
  livestockHygieneLog,
  type AnimalGender,
  type AnimalResponse,
  type AnimalSource,
  type AnimalSpecies,
  type BreedingRecordType,
  type CreateAnimalBody,
  type CreateBreedingRecordBody,
  type CreateFeedLogBody,
  type CreateFeedPlanBody,
  type CreateHealthRecordBody,
  type CreateHousingRecordBody,
  type CreateHygieneLogBody,
  type CreateProductionLogBody,
  type DairyProductType,
  type HealthRecordType,
  type LifecycleStatus,
  type LivestockBreedingRecord,
  type LivestockFeedLog,
  type LivestockFeedPlan,
  type LivestockHealthRecord,
  type LivestockHousingRecord,
  type LivestockHygieneLog,
  type OrganicStatus,
  type ProductionLogResponse,
  type ProductionSession,
  type ProductionUnit,
  type RecordLifecycleEventBody,
} from './livestock.schema.js';

/**
 * The system_config key holding the minimum indoor space per animal, in square feet (BR-141).
 * One key for every species: system_config has no per-species keys anywhere.
 */
export const MIN_INDOOR_SPACE_SQFT_KEY = 'livestock_min_indoor_space_sqft_per_animal';

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

/**
 * `loggedOn` and `restrictedFromSale` are resolved by the service (BR-139),
 * never left to a column default: the date the rule compared against must be
 * the date that is stored.
 */
export interface CreateProductionLogData extends Omit<CreateProductionLogBody, 'loggedOn' | 'restrictedFromSale'> {
  farmId: string;
  loggedOn: string;
  restrictedFromSale: boolean;
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

/**
 * Keyset position for the animal-record lists: (record date, created_at, id),
 * all DESC. The date leads because the screen orders by the date the farmer
 * entered (a back-filled record must sort by when it happened, not when it
 * was typed in); created_at and id make the order total so pages never skip
 * or repeat a row with a tied date.
 */
export interface DatedCursor {
  date: string;
  createdAt: string;
  id: string;
}

export interface ListAnimalRecordsArgs {
  farmerId: string;
  animalId: string;
  cursor?: DatedCursor | undefined;
  limit: number;
}

export interface DateRangeFilter {
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
}

export interface AnimalRecordsPage<T> {
  items: T[];
  next: DatedCursor | null;
}

/**
 * A health record as stored: the variant-specific fields in `details`, the
 * promoted ones (next due date, withdrawal end dates) in their own columns
 * and NOT also in `details` — one home per value, so they cannot disagree.
 */
export interface StoredHealthRecord {
  id: string;
  animalId: string;
  recordType: HealthRecordType;
  recordDate: string;
  nextDueDate: string | null;
  milkWithdrawalUntil: string | null;
  meatWithdrawalUntil: string | null;
  details: Record<string, unknown>;
  notes: string | null;
  attachmentUploadId: string | null;
  createdAt: string;
  updatedAt: string | null;
}
export type HealthRecordStorage = Omit<StoredHealthRecord, 'id' | 'animalId' | 'createdAt' | 'updatedAt'>;

/** Same split as StoredHealthRecord; PREGNANCY_CHECK's two dates are the promoted columns. */
export interface StoredBreedingRecord {
  id: string;
  animalId: string;
  recordType: BreedingRecordType;
  recordDate: string;
  expectedDeliveryDate: string | null;
  nextCheckDate: string | null;
  details: Record<string, unknown>;
  notes: string | null;
  attachmentUploadId: string | null;
  createdAt: string;
  updatedAt: string | null;
}
export type BreedingRecordStorage = Omit<StoredBreedingRecord, 'id' | 'animalId' | 'createdAt' | 'updatedAt'>;

// ---------------------------------------------------------------------------
// Interface — the service depends on THIS, which is what lets the tests run
// against a plain in-memory fake.
// ---------------------------------------------------------------------------

export interface LivestockRepo {
  createAnimal(db: Executor, data: CreateAnimalData): Promise<string>;

  /** Full livestock_animals row, owned by farmerId and not soft-deleted; else null. */
  findAnimal(db: Executor, farmerId: string, animalId: string): Promise<AnimalResponse | null>;

  /**
   * Same as `findAnimal`, but takes a row lock on the animal (`FOR UPDATE`) that
   * lasts until the caller's transaction ends. BR-139: a writer that must decide
   * from `withdrawal_until` locks the row so a concurrent treatment cannot change
   * it between the read and the dependent insert. `db` must be a transaction.
   */
  findAnimalForUpdate(db: Executor, farmerId: string, animalId: string): Promise<AnimalResponse | null>;

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

  // --- animal records (0084) -------------------------------------------------

  /** `undefined` = no such live upload; `null`/a userId = its (possibly-null) owner. Same contract as pest.repo.ts. */
  findUploadOwner(db: Executor, uploadId: string): Promise<string | null | undefined>;

  /**
   * BR-138: raise livestock_animals.withdrawal_until to `until` unless it is
   * already later — never shortens. Called inside the same transaction as the
   * treatment insert.
   */
  extendAnimalWithdrawal(db: Executor, animalId: string, until: string): Promise<void>;

  /**
   * Each insert copies farm_id from the animal and only matches the caller's
   * own live animal; it returns null (writes nothing) for anything else.
   */
  insertHealthRecord(db: Executor, farmerId: string, animalId: string, body: CreateHealthRecordBody): Promise<LivestockHealthRecord | null>;
  listHealthRecords(
    db: Executor,
    args: ListAnimalRecordsArgs & { recordType?: HealthRecordType | undefined },
  ): Promise<AnimalRecordsPage<LivestockHealthRecord>>;

  insertBreedingRecord(db: Executor, farmerId: string, animalId: string, body: CreateBreedingRecordBody): Promise<LivestockBreedingRecord | null>;
  listBreedingRecords(
    db: Executor,
    args: ListAnimalRecordsArgs & { recordType?: BreedingRecordType | undefined },
  ): Promise<AnimalRecordsPage<LivestockBreedingRecord>>;

  insertFeedPlan(db: Executor, farmerId: string, animalId: string, body: CreateFeedPlanBody): Promise<LivestockFeedPlan | null>;
  listFeedPlans(db: Executor, args: ListAnimalRecordsArgs): Promise<AnimalRecordsPage<LivestockFeedPlan>>;

  insertFeedLog(db: Executor, farmerId: string, animalId: string, body: CreateFeedLogBody): Promise<LivestockFeedLog | null>;
  listFeedLogs(db: Executor, args: ListAnimalRecordsArgs & DateRangeFilter): Promise<AnimalRecordsPage<LivestockFeedLog>>;

  insertHousingRecord(db: Executor, farmerId: string, animalId: string, body: CreateHousingRecordBody): Promise<LivestockHousingRecord | null>;
  listHousingRecords(db: Executor, args: ListAnimalRecordsArgs): Promise<AnimalRecordsPage<LivestockHousingRecord>>;
  /**
   * BR-141: the raw JSON text of `system_config.livestock_min_indoor_space_sqft_per_animal`
   * (`value::text`, e.g. `11` or `10.5`), or undefined when the row is missing. Text, not the
   * parsed value, so the service can validate the decimal exactly without a float round trip.
   */
  getMinIndoorSpaceSqFtPerAnimal(db: Executor): Promise<string | undefined>;

  insertHygieneLog(db: Executor, farmerId: string, animalId: string, body: CreateHygieneLogBody): Promise<LivestockHygieneLog | null>;
  listHygieneLogs(db: Executor, args: ListAnimalRecordsArgs & DateRangeFilter): Promise<AnimalRecordsPage<LivestockHygieneLog>>;
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
  session: ProductionSession | null;
  quality_grade: string | null;
  fat_percent: string | null;
  restricted_from_sale: boolean;
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
    session: row.session,
    qualityGrade: row.quality_grade,
    fatPercent: row.fat_percent === null ? null : Number(row.fat_percent),
    restrictedFromSale: row.restricted_from_sale,
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
         pl.batch_info, pl.sessions, pl.session, pl.quality_grade, pl.fat_percent,
         pl.restricted_from_sale, pl.notes, pl.created_at,
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
// Animal records — storage split and response builders (pure; also used by
// the test fake so both paths share one mapping)
// ---------------------------------------------------------------------------

/** Variant-specific keys kept in `details`, per record type. Promoted keys are deliberately absent. */
const HEALTH_DETAIL_KEYS: Record<HealthRecordType, readonly string[]> = {
  VACCINATION: ['vaccineName', 'veterinarian', 'dose', 'route', 'batchNumber'],
  DEWORMING: [
    'productName',
    'activeIngredient',
    'targetParasite',
    'dose',
    'route',
    'animalWeight',
    'batchNumber',
    'expiryDate',
    'administeredBy',
    'observedReaction',
  ],
  CHECKUP: [
    'checkupType',
    'checkupTime',
    'veterinarian',
    'clinic',
    'bodyTemperature',
    'bodyWeight',
    'healthStatus',
    'appetite',
    'activityLevel',
    'symptoms',
    'findings',
    'diagnosis',
    'treatmentRequired',
    'followUpRequired',
    'recommendedActions',
  ],
  TREATMENT: [
    'treatmentType',
    'condition',
    'symptoms',
    'description',
    'medicineName',
    'dosage',
    'route',
    'frequency',
    'medicationStartDate',
    'medicationEndDate',
    'prescribedBy',
    'administeredBy',
  ],
};

const BREEDING_DETAIL_KEYS: Record<BreedingRecordType, readonly string[]> = {
  HEAT: ['breedingMethod', 'sire', 'semenStrawRef', 'technician', 'heatSigns'],
  INSEMINATION: ['inseminationType', 'inseminationTime', 'sire', 'semenStrawRef', 'location', 'technician', 'heatSigns'],
  PREGNANCY_CHECK: ['checkType', 'result', 'examinationMethod', 'location', 'gestationAge', 'findings'],
  CALVING: ['outcome', 'calvingTime', 'offspringCount', 'deliveryType', 'offspringName', 'offspringGender', 'birthWeight', 'findings'],
};

/** Only the listed keys that were actually supplied — an allow-list on the way IN as well. */
function pickDefined(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out;
}

/** Every listed key, `null` when absent — the response contract is "every documented key always present". */
function fillNull(source: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(keys.map((key) => [key, source[key] ?? null]));
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** Splits a create body into what goes in `details` and what goes in the promoted columns. */
export function healthRecordStorage(body: CreateHealthRecordBody): HealthRecordStorage {
  const source = body as unknown as Record<string, unknown>;
  const details = pickDefined(source, HEALTH_DETAIL_KEYS[body.recordType]);
  let nextDueDate: string | null = null;
  let milkWithdrawalUntil: string | null = null;
  let meatWithdrawalUntil: string | null = null;

  switch (body.recordType) {
    case 'VACCINATION':
    case 'DEWORMING':
      nextDueDate = body.nextDueDate ?? null;
      break;
    case 'CHECKUP':
      nextDueDate = body.followUpDate ?? null;
      break;
    case 'TREATMENT':
      // The end dates are promoted (BR-138 keys off them); the rest of each
      // window stays in details so the response can be rebuilt whole.
      if (body.milkWithdrawal !== undefined) {
        milkWithdrawalUntil = body.milkWithdrawal.endDate;
        details['milkWithdrawal'] = pickDefined(body.milkWithdrawal, ['startDate', 'reason']);
      }
      if (body.meatWithdrawal !== undefined) {
        meatWithdrawalUntil = body.meatWithdrawal.endDate;
        details['meatWithdrawal'] = pickDefined(body.meatWithdrawal, ['startDate', 'reason']);
      }
      break;
  }

  return {
    recordType: body.recordType,
    recordDate: body.recordDate,
    nextDueDate,
    milkWithdrawalUntil,
    meatWithdrawalUntil,
    details,
    notes: body.notes ?? null,
    attachmentUploadId: body.attachmentUploadId ?? null,
  };
}

/** Rebuilds the wire shape and parses it through the allow-list response schema. */
export function toHealthRecord(stored: StoredHealthRecord): LivestockHealthRecord {
  const d = stored.details;
  const promoted: Record<string, unknown> = {};
  switch (stored.recordType) {
    case 'VACCINATION':
    case 'DEWORMING':
      promoted['nextDueDate'] = stored.nextDueDate;
      break;
    case 'CHECKUP':
      promoted['followUpDate'] = stored.nextDueDate;
      break;
    case 'TREATMENT': {
      const milk = asRecord(d['milkWithdrawal']);
      const meat = asRecord(d['meatWithdrawal']);
      promoted['milkWithdrawal'] =
        stored.milkWithdrawalUntil === null
          ? null
          : { startDate: milk['startDate'] ?? null, endDate: stored.milkWithdrawalUntil, reason: milk['reason'] ?? null };
      promoted['meatWithdrawal'] =
        stored.meatWithdrawalUntil === null
          ? null
          : { startDate: meat['startDate'] ?? null, endDate: stored.meatWithdrawalUntil, reason: meat['reason'] ?? null };
      break;
    }
  }

  return livestockHealthRecord.parse({
    ...fillNull(d, HEALTH_DETAIL_KEYS[stored.recordType]),
    ...promoted,
    // Spread last: nothing in `details` can override the record's identity.
    id: stored.id,
    animalId: stored.animalId,
    recordType: stored.recordType,
    recordDate: stored.recordDate,
    notes: stored.notes,
    attachmentUploadId: stored.attachmentUploadId,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  });
}

export function breedingRecordStorage(body: CreateBreedingRecordBody): BreedingRecordStorage {
  const source = body as unknown as Record<string, unknown>;
  return {
    recordType: body.recordType,
    recordDate: body.recordDate,
    expectedDeliveryDate: body.recordType === 'PREGNANCY_CHECK' ? (body.expectedDeliveryDate ?? null) : null,
    nextCheckDate: body.recordType === 'PREGNANCY_CHECK' ? body.nextCheckDate : null,
    details: pickDefined(source, BREEDING_DETAIL_KEYS[body.recordType]),
    notes: body.notes ?? null,
    attachmentUploadId: body.attachmentUploadId ?? null,
  };
}

export function toBreedingRecord(stored: StoredBreedingRecord): LivestockBreedingRecord {
  const promoted =
    stored.recordType === 'PREGNANCY_CHECK'
      ? { expectedDeliveryDate: stored.expectedDeliveryDate, nextCheckDate: stored.nextCheckDate }
      : {};
  return livestockBreedingRecord.parse({
    ...fillNull(stored.details, BREEDING_DETAIL_KEYS[stored.recordType]),
    ...promoted,
    id: stored.id,
    animalId: stored.animalId,
    recordType: stored.recordType,
    recordDate: stored.recordDate,
    notes: stored.notes,
    attachmentUploadId: stored.attachmentUploadId,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  });
}

// --- SQL rows ---------------------------------------------------------------

/** Columns every animal-record SELECT/RETURNING emits, for keyset paging and timestamps. */
interface RecordRowBase {
  id: string;
  animal_id: string;
  sort_date: string;
  created_at: Date;
  created_at_cursor: string;
  updated_at: Date | null;
}

interface HealthRecordRow extends RecordRowBase {
  record_type: HealthRecordType;
  record_date: string;
  next_due_date: string | null;
  milk_withdrawal_until: string | null;
  meat_withdrawal_until: string | null;
  details: unknown;
  notes: string | null;
  attachment_upload_id: string | null;
}

interface BreedingRecordRow extends RecordRowBase {
  record_type: BreedingRecordType;
  record_date: string;
  expected_delivery_date: string | null;
  next_check_date: string | null;
  details: unknown;
  notes: string | null;
  attachment_upload_id: string | null;
}

interface FeedPlanRow extends RecordRowBase {
  effective_from: string;
  plan_name: string | null;
  feed_type: string;
  source: string | null;
  grazing_duration: string | null;
  grazing_duration_unit: string | null;
  water_source: string;
  start_time: string | null;
  end_time: string | null;
  items: unknown;
  notes: string | null;
  attachment_upload_id: string | null;
}

interface FeedLogRow extends RecordRowBase {
  fed_on: string;
  feed_type: string;
  quantity: string;
  unit: string;
  notes: string | null;
}

interface HousingRecordRow extends RecordRowBase {
  housing_type: string;
  housing_name: string;
  location: string | null;
  indoor_space_value: string;
  indoor_space_unit: string;
  outdoor_space_value: string;
  outdoor_space_unit: string;
  start_date: string;
  notes: string | null;
  attachment_upload_id: string | null;
}

interface HygieneLogRow extends RecordRowBase {
  performed_on: string;
  activity: string;
  notes: string | null;
}

function rowTimestamps(row: RecordRowBase): { createdAt: string; updatedAt: string | null } {
  return { createdAt: row.created_at.toISOString(), updatedAt: row.updated_at === null ? null : row.updated_at.toISOString() };
}

function fromHealthRow(row: HealthRecordRow): LivestockHealthRecord {
  return toHealthRecord({
    id: row.id,
    animalId: row.animal_id,
    recordType: row.record_type,
    recordDate: row.record_date,
    nextDueDate: row.next_due_date,
    milkWithdrawalUntil: row.milk_withdrawal_until,
    meatWithdrawalUntil: row.meat_withdrawal_until,
    details: asRecord(row.details),
    notes: row.notes,
    attachmentUploadId: row.attachment_upload_id,
    ...rowTimestamps(row),
  });
}

function fromBreedingRow(row: BreedingRecordRow): LivestockBreedingRecord {
  return toBreedingRecord({
    id: row.id,
    animalId: row.animal_id,
    recordType: row.record_type,
    recordDate: row.record_date,
    expectedDeliveryDate: row.expected_delivery_date,
    nextCheckDate: row.next_check_date,
    details: asRecord(row.details),
    notes: row.notes,
    attachmentUploadId: row.attachment_upload_id,
    ...rowTimestamps(row),
  });
}

function fromFeedPlanRow(row: FeedPlanRow): LivestockFeedPlan {
  return livestockFeedPlan.parse({
    id: row.id,
    animalId: row.animal_id,
    effectiveFrom: row.effective_from,
    planName: row.plan_name,
    feedType: row.feed_type,
    source: row.source,
    grazingDuration:
      row.grazing_duration === null ? null : { value: Number(row.grazing_duration), unit: row.grazing_duration_unit },
    waterSource: row.water_source,
    startTime: row.start_time,
    endTime: row.end_time,
    items: Array.isArray(row.items) ? row.items : [],
    notes: row.notes,
    attachmentUploadId: row.attachment_upload_id,
    ...rowTimestamps(row),
  });
}

function fromFeedLogRow(row: FeedLogRow): LivestockFeedLog {
  return livestockFeedLog.parse({
    id: row.id,
    animalId: row.animal_id,
    fedOn: row.fed_on,
    feedType: row.feed_type,
    quantity: Number(row.quantity),
    unit: row.unit,
    notes: row.notes,
    ...rowTimestamps(row),
  });
}

function fromHousingRow(row: HousingRecordRow): LivestockHousingRecord {
  return livestockHousingRecord.parse({
    id: row.id,
    animalId: row.animal_id,
    housingType: row.housing_type,
    housingName: row.housing_name,
    location: row.location,
    indoorSpacePerAnimal: { value: Number(row.indoor_space_value), unit: row.indoor_space_unit },
    outdoorSpace: { value: Number(row.outdoor_space_value), unit: row.outdoor_space_unit },
    startDate: row.start_date,
    notes: row.notes,
    attachmentUploadId: row.attachment_upload_id,
    ...rowTimestamps(row),
  });
}

function fromHygieneRow(row: HygieneLogRow): LivestockHygieneLog {
  return livestockHygieneLog.parse({
    id: row.id,
    animalId: row.animal_id,
    activity: row.activity,
    performedOn: row.performed_on,
    notes: row.notes,
    ...rowTimestamps(row),
  });
}

// --- SQL building blocks ------------------------------------------------------

/**
 * One table's shape for the shared list/insert helpers. `columns` is used for
 * both SELECT and INSERT ... RETURNING (the insert aliases the table as `r`
 * too), so a created record and a listed one are mapped identically.
 */
interface RecordTable {
  table: string;
  dateColumn: string;
  columns: string;
}

const KEYSET_COLUMNS = (dateColumn: string): string => `
  r.id, r.animal_id, r.${dateColumn}::text AS sort_date, r.created_at,
  to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at_cursor,
  r.updated_at`;

const HEALTH_TABLE: RecordTable = {
  table: 'livestock_health_records',
  dateColumn: 'record_date',
  columns: `${KEYSET_COLUMNS('record_date')}, r.record_type, r.record_date::text AS record_date,
    r.next_due_date::text AS next_due_date, r.milk_withdrawal_until::text AS milk_withdrawal_until,
    r.meat_withdrawal_until::text AS meat_withdrawal_until, r.details, r.notes, r.attachment_upload_id`,
};

const BREEDING_TABLE: RecordTable = {
  table: 'livestock_breeding_records',
  dateColumn: 'record_date',
  columns: `${KEYSET_COLUMNS('record_date')}, r.record_type, r.record_date::text AS record_date,
    r.expected_delivery_date::text AS expected_delivery_date, r.next_check_date::text AS next_check_date,
    r.details, r.notes, r.attachment_upload_id`,
};

const FEED_PLAN_TABLE: RecordTable = {
  table: 'livestock_feed_plans',
  dateColumn: 'effective_from',
  columns: `${KEYSET_COLUMNS('effective_from')}, r.effective_from::text AS effective_from, r.plan_name, r.feed_type,
    r.source, r.grazing_duration, r.grazing_duration_unit, r.water_source,
    to_char(r.start_time, 'HH24:MI') AS start_time, to_char(r.end_time, 'HH24:MI') AS end_time,
    r.items, r.notes, r.attachment_upload_id`,
};

const FEED_LOG_TABLE: RecordTable = {
  table: 'livestock_feed_logs',
  dateColumn: 'fed_on',
  columns: `${KEYSET_COLUMNS('fed_on')}, r.fed_on::text AS fed_on, r.feed_type, r.quantity, r.unit, r.notes`,
};

const HOUSING_TABLE: RecordTable = {
  table: 'livestock_housing_records',
  dateColumn: 'start_date',
  columns: `${KEYSET_COLUMNS('start_date')}, r.housing_type, r.housing_name, r.location,
    r.indoor_space_value, r.indoor_space_unit, r.outdoor_space_value, r.outdoor_space_unit,
    r.start_date::text AS start_date, r.notes, r.attachment_upload_id`,
};

const HYGIENE_TABLE: RecordTable = {
  table: 'livestock_hygiene_logs',
  dateColumn: 'performed_on',
  columns: `${KEYSET_COLUMNS('performed_on')}, r.performed_on::text AS performed_on, r.activity, r.notes`,
};

/** An extra list condition; `sql` receives the placeholder (e.g. `$5`) for `value`. */
interface ListFilter {
  sql: (placeholder: string) => string;
  value: unknown;
}

function dateRangeFilters(dateColumn: string, args: DateRangeFilter): ListFilter[] {
  const filters: ListFilter[] = [];
  if (args.dateFrom !== undefined) filters.push({ sql: (p) => `r.${dateColumn} >= ${p}::date`, value: args.dateFrom });
  if (args.dateTo !== undefined) filters.push({ sql: (p) => `r.${dateColumn} <= ${p}::date`, value: args.dateTo });
  return filters;
}

/**
 * Keyset list of one animal's records. Ownership is re-derived in the query
 * (animal -> farm -> farmer, all live), so a foreign or unknown animalId
 * simply yields no rows — the empty page BR-137b requires, with no separate
 * existence check that could leak whether the animal exists.
 */
async function listForAnimal<Row extends RecordRowBase, T>(
  db: Executor,
  spec: RecordTable,
  args: ListAnimalRecordsArgs,
  filters: ListFilter[],
  map: (row: Row) => T,
): Promise<AnimalRecordsPage<T>> {
  const params: unknown[] = [args.animalId, args.farmerId];
  const conditions = [
    'r.animal_id = $1',
    'f.farmer_id = $2',
    'r.deleted_at IS NULL',
    'la.deleted_at IS NULL',
    'f.deleted_at IS NULL',
  ];
  for (const filter of filters) {
    params.push(filter.value);
    conditions.push(filter.sql(`$${params.length}`));
  }
  if (args.cursor !== undefined) {
    params.push(args.cursor.date, args.cursor.createdAt, args.cursor.id);
    const n = params.length;
    conditions.push(`(r.${spec.dateColumn}, r.created_at, r.id) < ($${n - 2}::date, $${n - 1}::timestamptz, $${n}::uuid)`);
  }
  params.push(args.limit + 1);

  const result = await db.query<Row>(
    `SELECT ${spec.columns}
       FROM ${spec.table} r
       JOIN livestock_animals la ON la.id = r.animal_id
       JOIN farms f ON f.id = la.farm_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.${spec.dateColumn} DESC, r.created_at DESC, r.id DESC
      LIMIT $${params.length}`,
    params,
  );

  const hasMore = result.rows.length > args.limit;
  const rows = hasMore ? result.rows.slice(0, args.limit) : result.rows;
  const last = rows[rows.length - 1];
  return {
    items: rows.map(map),
    next: hasMore && last !== undefined ? { date: last.sort_date, createdAt: last.created_at_cursor, id: last.id } : null,
  };
}

/**
 * `INSERT ... SELECT` from the caller's own live animal: farm_id is copied
 * from the animal, and a foreign/unknown/soft-deleted animal matches no row,
 * so nothing is written and null comes back.
 *
 * Each `values` entry is [column, SQL expression, value]; `?` in the
 * expression is replaced by the value's placeholder ($3 onwards — $1 is
 * animalId, $2 farmerId). Values are always bound parameters; column names and
 * expressions are fixed strings in this file, never client input.
 */
async function insertForAnimal<Row extends RecordRowBase, T>(
  db: Executor,
  spec: RecordTable,
  farmerId: string,
  animalId: string,
  values: Array<[column: string, expression: string, value: unknown]>,
  map: (row: Row) => T,
): Promise<T | null> {
  const columns = values.map(([column]) => column);
  const expressions = values.map(([, expression], index) => expression.replace('?', `$${index + 3}`));
  const result = await db.query<Row>(
    `INSERT INTO ${spec.table} AS r (farm_id, animal_id, ${columns.join(', ')})
     SELECT la.farm_id, la.id, ${expressions.join(', ')}
       FROM livestock_animals la
       JOIN farms f ON f.id = la.farm_id
      WHERE la.id = $1 AND f.farmer_id = $2
        AND la.deleted_at IS NULL AND f.deleted_at IS NULL
     RETURNING ${spec.columns}`,
    [animalId, farmerId, ...values.map(([, , value]) => value)],
  );
  const row = result.rows[0];
  return row === undefined ? null : map(row);
}

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

  async findAnimalForUpdate(db, farmerId, animalId) {
    const result = await db.query<AnimalRow>(
      `${ANIMAL_SELECT}
         JOIN farms f ON f.id = la.farm_id
        WHERE la.id = $1 AND f.farmer_id = $2
          AND la.deleted_at IS NULL AND f.deleted_at IS NULL
        LIMIT 1
          FOR UPDATE OF la`,
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
      `INSERT INTO livestock_production_logs (
         farm_id, animal_id, product_type, quantity, unit, logged_on, batch_info, sessions,
         session, quality_grade, fat_percent, restricted_from_sale, notes
       )
       VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        data.farmId,
        data.animalId ?? null,
        data.productType,
        data.quantity,
        data.unit,
        data.loggedOn,
        data.batchInfo ?? null,
        data.sessions ?? null,
        data.session ?? null,
        data.qualityGrade ?? null,
        data.fatPercent ?? null,
        data.restrictedFromSale,
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

  // --- animal records (0084) -------------------------------------------------

  async findUploadOwner(db, uploadId) {
    const result = await db.query<{ uploaded_by: string | null }>(
      `SELECT uploaded_by FROM uploads WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [uploadId],
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0]?.uploaded_by ?? null;
  },

  async extendAnimalWithdrawal(db, animalId, until) {
    // BR-138: GREATEST keeps a later existing date, so this can only extend.
    await db.query(
      `UPDATE livestock_animals
          SET withdrawal_until = GREATEST(COALESCE(withdrawal_until, $2::date), $2::date),
              updated_at = now()
        WHERE id = $1`,
      [animalId, until],
    );
  },

  async insertHealthRecord(db, farmerId, animalId, body) {
    const s = healthRecordStorage(body);
    return insertForAnimal(
      db,
      HEALTH_TABLE,
      farmerId,
      animalId,
      [
        ['record_type', '?', s.recordType],
        ['record_date', '?::date', s.recordDate],
        ['next_due_date', '?::date', s.nextDueDate],
        ['milk_withdrawal_until', '?::date', s.milkWithdrawalUntil],
        ['meat_withdrawal_until', '?::date', s.meatWithdrawalUntil],
        ['details', '?::jsonb', JSON.stringify(s.details)],
        ['notes', '?', s.notes],
        ['attachment_upload_id', '?::uuid', s.attachmentUploadId],
      ],
      fromHealthRow,
    );
  },

  async listHealthRecords(db, args) {
    const filters: ListFilter[] = args.recordType === undefined ? [] : [{ sql: (p) => `r.record_type = ${p}`, value: args.recordType }];
    return listForAnimal(db, HEALTH_TABLE, args, filters, fromHealthRow);
  },

  async insertBreedingRecord(db, farmerId, animalId, body) {
    const s = breedingRecordStorage(body);
    return insertForAnimal(
      db,
      BREEDING_TABLE,
      farmerId,
      animalId,
      [
        ['record_type', '?', s.recordType],
        ['record_date', '?::date', s.recordDate],
        ['expected_delivery_date', '?::date', s.expectedDeliveryDate],
        ['next_check_date', '?::date', s.nextCheckDate],
        ['details', '?::jsonb', JSON.stringify(s.details)],
        ['notes', '?', s.notes],
        ['attachment_upload_id', '?::uuid', s.attachmentUploadId],
      ],
      fromBreedingRow,
    );
  },

  async listBreedingRecords(db, args) {
    const filters: ListFilter[] = args.recordType === undefined ? [] : [{ sql: (p) => `r.record_type = ${p}`, value: args.recordType }];
    return listForAnimal(db, BREEDING_TABLE, args, filters, fromBreedingRow);
  },

  async insertFeedPlan(db, farmerId, animalId, body) {
    return insertForAnimal(
      db,
      FEED_PLAN_TABLE,
      farmerId,
      animalId,
      [
        ['effective_from', 'COALESCE(?::date, current_date)', body.effectiveFrom ?? null],
        ['plan_name', '?', body.planName ?? null],
        ['feed_type', '?', body.feedType],
        ['source', '?', body.source ?? null],
        ['grazing_duration', '?::numeric', body.grazingDuration?.value ?? null],
        ['grazing_duration_unit', '?', body.grazingDuration?.unit ?? null],
        ['water_source', '?', body.waterSource],
        ['start_time', '?::time', body.startTime ?? null],
        ['end_time', '?::time', body.endTime ?? null],
        ['items', '?::jsonb', JSON.stringify(body.items)],
        ['notes', '?', body.notes ?? null],
        ['attachment_upload_id', '?::uuid', body.attachmentUploadId ?? null],
      ],
      fromFeedPlanRow,
    );
  },

  async listFeedPlans(db, args) {
    return listForAnimal(db, FEED_PLAN_TABLE, args, [], fromFeedPlanRow);
  },

  async insertFeedLog(db, farmerId, animalId, body) {
    return insertForAnimal(
      db,
      FEED_LOG_TABLE,
      farmerId,
      animalId,
      [
        ['fed_on', 'COALESCE(?::date, current_date)', body.fedOn ?? null],
        ['feed_type', '?', body.feedType],
        ['quantity', '?::numeric', body.quantity],
        ['unit', '?', body.unit],
        ['notes', '?', body.notes ?? null],
      ],
      fromFeedLogRow,
    );
  },

  async listFeedLogs(db, args) {
    return listForAnimal(db, FEED_LOG_TABLE, args, dateRangeFilters('fed_on', args), fromFeedLogRow);
  },

  async insertHousingRecord(db, farmerId, animalId, body) {
    return insertForAnimal(
      db,
      HOUSING_TABLE,
      farmerId,
      animalId,
      [
        ['housing_type', '?', body.housingType],
        ['housing_name', '?', body.housingName],
        ['location', '?', body.location ?? null],
        ['indoor_space_value', '?::numeric', body.indoorSpacePerAnimal.value],
        ['indoor_space_unit', '?', body.indoorSpacePerAnimal.unit],
        ['outdoor_space_value', '?::numeric', body.outdoorSpace.value],
        ['outdoor_space_unit', '?', body.outdoorSpace.unit],
        ['start_date', '?::date', body.startDate],
        ['notes', '?', body.notes ?? null],
        ['attachment_upload_id', '?::uuid', body.attachmentUploadId ?? null],
      ],
      fromHousingRow,
    );
  },

  async listHousingRecords(db, args) {
    return listForAnimal(db, HOUSING_TABLE, args, [], fromHousingRow);
  },

  async getMinIndoorSpaceSqFtPerAnimal(db) {
    const result = await db.query<{ raw: string | null }>(`SELECT value::text AS raw FROM system_config WHERE key = $1 LIMIT 1`, [
      MIN_INDOOR_SPACE_SQFT_KEY,
    ]);
    return result.rows.length === 0 ? undefined : (result.rows[0]!.raw ?? undefined);
  },

  async insertHygieneLog(db, farmerId, animalId, body) {
    return insertForAnimal(
      db,
      HYGIENE_TABLE,
      farmerId,
      animalId,
      [
        ['performed_on', 'COALESCE(?::date, current_date)', body.performedOn ?? null],
        ['activity', '?', body.activity],
        ['notes', '?', body.notes ?? null],
      ],
      fromHygieneRow,
    );
  },

  async listHygieneLogs(db, args) {
    return listForAnimal(db, HYGIENE_TABLE, args, dateRangeFilters('performed_on', args), fromHygieneRow);
  },
};
