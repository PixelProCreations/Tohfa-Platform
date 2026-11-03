/**
 * Livestock business logic (BR-47).
 *
 * Two services live here, sharing one repo:
 *   - createLivestockService       farmer-facing `/farmers/me/livestock/*`
 *   - createLivestockAdminService  admin read-only `/admin/farmers/{farmerId}/livestock/animals`
 *
 * OWNERSHIP. Every farmer-facing method resolves the owner from
 * `scope.farmerId` and nothing else — there is no client-supplied farmerId
 * anywhere in the farmer-facing request schemas. That holds even for a
 * SUPER_ADMIN/TOHFA_ADMIN whose rbac grant on `farmer.livestock.*` is `all`:
 * these are `/me` endpoints, so "all" cannot mean "every farmer's livestock"
 * here — exactly the doctrine crops.service.ts and farm-diary.service.ts
 * document for their own `/me` endpoints. A foreign animal is NOT_FOUND,
 * never 403 (root CLAUDE.md §2.1).
 *
 * WHICH FARM. Animals and production logs belong to the farmer's operation
 * as a whole, not one plot (root CLAUDE.md's farm-land-locations doctrine),
 * but the tables still carry a `farm_id` FK (a farmer's operation can have
 * more than one `farms` row — no uniqueness constraint on `farms.farmer_id`,
 * only `is_primary` is unique per farmer, db/migrations/0003). There is no
 * farm picker anywhere in the mock UI, so a new animal/production log is
 * always attached to the farmer's PRIMARY farm (falling back to their
 * earliest-created one when none is marked primary) — `farmsRepo.listByScope`
 * already orders `is_primary DESC, created_at ASC`, so `farms[0]` is exactly
 * that farm, the same ordering farm-diary.service.ts's `listPlots` reads
 * (though it flattens across every farm rather than picking one, because a
 * plot picker has no single-farm ambiguity to resolve).
 *
 * BR-47. An animal can exit the herd (SOLD/TRANSFERRED/CULLED/DECEASED) at
 * most once. The database enforces this with a unique index
 * (`uq_livestock_lifecycle_events_one_per_animal`, db/migrations/0024); this
 * service only translates the resulting constraint violation into the domain
 * error `LIVESTOCK_ALREADY_EXITED`. It does not re-implement the check in
 * application code, because a check-then-write in the service would still
 * race two concurrent requests recording the same animal's exit.
 *
 * ANIMAL RECORDS (BR-136..BR-138). Health, breeding, feed plan, feed log,
 * housing and hygiene records hang off one animal. Every create runs the
 * same sequence inside one transaction: ownership (404) -> rule checks (422)
 * -> attachment ownership (422) -> insert -> side effects. Ownership comes
 * first so a foreign animal is indistinguishable from a missing one (BR-138b:
 * 404 before the FEMALE-only 422). Lists never 404: a foreign animal is an
 * empty page (BR-136b), which the repo's ownership join produces by itself.
 *
 * BR-137. A TREATMENT with a withdrawal window raises the animal's
 * withdrawal_until in the SAME transaction as the insert — an animal whose
 * treatment is recorded but whose withdrawal banner never appears is exactly
 * the half-applied state that lets restricted milk be sold.
 *
 * BR-139. Production logged from an animal under withdrawal is stored
 * restricted_from_sale = TRUE whatever the client sent.
 *
 * BR-140. The housing list says, per record, whether the indoor space per
 * animal meets `system_config.livestock_min_indoor_space_sqft_per_animal`, and
 * returns that standard. The comparison is exact integer maths (see
 * meetsIndoorSpaceStandard); a missing or unusable standard is 503 with no
 * fallback constant, the same fail-closed stance as BR-135.
 */
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { farmsService, type FarmsService } from '../farms/farms.service.js';
import {
  livestockRepo,
  MIN_INDOOR_SPACE_SQFT_KEY,
  type AnimalRecordsPage,
  type CreateAnimalData,
  type CreateProductionLogData,
  type DatedCursor,
  type ListCursor,
  type LivestockRepo,
  type UpdateAnimalPatch,
} from './livestock.repo.js';
import type {
  AnimalResponse,
  CreateAnimalBody,
  CreateBreedingRecordBody,
  CreateFeedLogBody,
  CreateFeedPlanBody,
  CreateHealthRecordBody,
  CreateHousingRecordBody,
  CreateHygieneLogBody,
  CreateProductionLogBody,
  ListAdminAnimalsResponse,
  ListAnimalsQuery,
  ListAnimalsResponse,
  ListBreedingRecordsQuery,
  ListBreedingRecordsResponse,
  ListFeedLogsQuery,
  ListFeedLogsResponse,
  ListFeedPlansQuery,
  ListFeedPlansResponse,
  ListHealthRecordsQuery,
  ListHealthRecordsResponse,
  ListHousingRecordsQuery,
  ListHousingRecordsResponse,
  ListHygieneLogsQuery,
  ListHygieneLogsResponse,
  ListProductionLogsQuery,
  ListProductionLogsResponse,
  LivestockBreedingRecord,
  LivestockFeedLog,
  LivestockFeedPlan,
  LivestockHealthRecord,
  LivestockHousingRecord,
  LivestockHygieneLog,
  ProductionLogResponse,
  RecordLifecycleEventBody,
  UpdateAnimalBody,
} from './livestock.schema.js';
import { listHousingRecordsResponse } from './livestock.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface LivestockServiceDeps {
  repo: LivestockRepo;
  db: Executor;
  runTx: TransactionRunner;
  farmsSvc: FarmsService;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * BR-140 unit conversion, all exact. 1 ft = 0.3048 m by definition, so
 * 1 sq.ft = 0.09290304 sq.m = 9_290_304 / 100_000_000; 1 acre = 43,560 sq.ft.
 * Every value is compared in integer hundredths (numeric(10,2) on the column,
 * at most two decimals on the standard) with BigInt, so a value sitting exactly
 * on the threshold can never be pushed to the wrong side by float drift.
 */
const SQ_M_PER_SQ_FT_NUMERATOR = 9_290_304n;
const SQ_M_PER_SQ_FT_DENOMINATOR = 100_000_000n;
const SQ_FT_PER_ACRE = 43_560n;

/** The usable standard: exact hundredths of a square foot, plus the same value as a JSON number. */
interface IndoorSpaceStandard {
  hundredthsSqFt: bigint;
  sqFt: number;
}

function indoorSpaceStandardNotConfigured(): AppError {
  return new AppError('INTERNAL', {
    status: 503,
    detail:
      `Livestock housing standard is not configured: system_config.${MIN_INDOOR_SPACE_SQFT_KEY} must be a JSON number ` +
      'greater than 0 with at most two decimal places. BR-140 forbids a hard-coded fallback; an administrator must set it.',
    meta: { configKey: MIN_INDOOR_SPACE_SQFT_KEY },
  });
}

/**
 * Validates the raw JSON text of the standard (`value::text` from the repo).
 * Only a plain non-negative JSON number literal is accepted (no string, null,
 * boolean, object, sign or exponent); trailing zeros in the fraction are not
 * precision, so `12.500` is 12.5, but a third significant decimal is refused.
 */
function parseIndoorSpaceStandard(raw: string | undefined): IndoorSpaceStandard {
  const match = raw === undefined ? null : /^(0|[1-9]\d*)(?:\.(\d+))?$/.exec(raw);
  if (match === null) throw indoorSpaceStandardNotConfigured();
  const fraction = (match[2] ?? '').replace(/0+$/, '');
  if (fraction.length > 2) throw indoorSpaceStandardNotConfigured();
  const hundredthsSqFt = BigInt(match[1]!) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (hundredthsSqFt <= 0n || hundredthsSqFt > BigInt(Number.MAX_SAFE_INTEGER)) throw indoorSpaceStandardNotConfigured();
  // An exact integer divided by 100 is the correctly rounded double of the decimal, i.e. what JSON.parse would give.
  return { hundredthsSqFt, sqFt: Number(hundredthsSqFt) / 100 };
}

/**
 * Hundredths of a stored numeric(10,2) value. The repo hands it over as a JS
 * number; toFixed(2) recovers the exact two-decimal literal it was parsed from
 * (10 significant digits round-trip through a double without loss).
 */
function toHundredths(value: number): bigint {
  return BigInt(value.toFixed(2).replace('.', ''));
}

/** BR-140: does `space` (per animal, in its own unit) reach the standard in square feet? Exact; equality meets. */
export function meetsIndoorSpaceStandard(space: LivestockHousingRecord['indoorSpacePerAnimal'], standardHundredthsSqFt: bigint): boolean {
  const v = toHundredths(space.value);
  switch (space.unit) {
    case 'SQ_FT':
      return v >= standardHundredthsSqFt;
    case 'SQ_M':
      // v/100 sq.m >= t/100 sq.ft  <=>  v >= t * 0.09290304  <=>  v * 10^8 >= t * 9_290_304
      return v * SQ_M_PER_SQ_FT_DENOMINATOR >= standardHundredthsSqFt * SQ_M_PER_SQ_FT_NUMERATOR;
    case 'ACRES':
      return v * SQ_FT_PER_ACRE >= standardHundredthsSqFt;
  }
}

function ownFarmerId(scope: ResolvedScope): string {
  if (scope.farmerId === undefined) {
    throw new AppError('NOT_FOUND', { detail: 'No farmer profile for the current actor.' });
  }
  return scope.farmerId;
}

function animalNotFound(animalId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No animal with id ${animalId} is visible to you.` });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

/** A duplicate `(farm_id, tag)` — the farmer's own tag must be unique within their herd. */
function animalTagConflict(tag: string): AppError {
  return new AppError('CONFLICT', { detail: `An animal with tag "${tag}" already exists in your herd.` });
}

/** BR-47a: the database's unique index rejected a second lifecycle event for this animal. */
function livestockAlreadyExited(animalId: string): AppError {
  return new AppError('LIVESTOCK_ALREADY_EXITED', {
    detail: `Animal ${animalId} already has a lifecycle event recorded; it cannot leave the herd twice.`,
    meta: { animalId },
  });
}

/**
 * The list cursor is opaque base64url JSON of the last row's (createdAt, id),
 * the same shape crops.service.ts's list cursor uses for its own composite key.
 */
function encodeCursor(cursor: ListCursor): string {
  return Buffer.from(JSON.stringify([cursor.createdAt, cursor.id]), 'utf8').toString('base64url');
}

function decodeCursor(raw: string): ListCursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      !Number.isNaN(Date.parse(parsed[0])) &&
      typeof parsed[1] === 'string' &&
      /^[0-9a-f-]{36}$/i.test(parsed[1])
    ) {
      return { createdAt: parsed[0], id: parsed[1] };
    }
  } catch {
    // fall through to the typed error below
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

/**
 * Animal-record lists page by (record date, createdAt, id) — see DatedCursor
 * in livestock.repo.ts — so their cursor is a separate opaque triple rather
 * than an extension of the two-part one above.
 */
function encodeDatedCursor(cursor: DatedCursor): string {
  return Buffer.from(JSON.stringify([cursor.date, cursor.createdAt, cursor.id]), 'utf8').toString('base64url');
}

function decodeDatedCursor(raw: string): DatedCursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      typeof parsed[0] === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(parsed[0]) &&
      typeof parsed[1] === 'string' &&
      !Number.isNaN(Date.parse(parsed[1])) &&
      typeof parsed[2] === 'string' &&
      /^[0-9a-f-]{36}$/i.test(parsed[2])
    ) {
      return { date: parsed[0], createdAt: parsed[1], id: parsed[2] };
    }
  } catch {
    // fall through to the typed error below
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

function optionalDatedCursor(raw: string | undefined): DatedCursor | undefined {
  return raw !== undefined && raw.length > 0 ? decodeDatedCursor(raw) : undefined;
}

function toPage<T>(result: AnimalRecordsPage<T>): { items: T[]; page: { nextCursor: string | null; hasMore: boolean } } {
  return {
    items: result.items,
    page: { nextCursor: result.next === null ? null : encodeDatedCursor(result.next), hasMore: result.next !== null },
  };
}

/**
 * Today's calendar date for the farmers this platform serves (Nilgiris,
 * Asia/Kolkata) — the same derivation crop-inputs.service.ts uses. Used as
 * the default production-log date so BR-139 compares against the date that
 * is actually stored, not a server-timezone guess.
 */
function todayKolkata(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(),
  );
}

/** BR-138: breeding history only makes sense for a female animal. */
function breedingRequiresFemale(animalId: string): AppError {
  return new AppError('VALIDATION_FAILED', {
    detail: `Animal ${animalId} is not FEMALE; breeding records can only be added to female animals (BR-138).`,
  });
}

// ---------------------------------------------------------------------------
// Farmer-facing service
// ---------------------------------------------------------------------------

export interface LivestockService {
  createAnimal(scope: ResolvedScope, body: CreateAnimalBody): Promise<AnimalResponse>;
  listAnimals(scope: ResolvedScope, query: ListAnimalsQuery): Promise<ListAnimalsResponse>;
  getAnimal(scope: ResolvedScope, animalId: string): Promise<AnimalResponse>;
  updateAnimal(scope: ResolvedScope, animalId: string, body: UpdateAnimalBody): Promise<AnimalResponse>;
  recordLifecycleEvent(scope: ResolvedScope, animalId: string, body: RecordLifecycleEventBody): Promise<AnimalResponse>;
  createProductionLog(scope: ResolvedScope, body: CreateProductionLogBody): Promise<ProductionLogResponse>;
  listProductionLogs(scope: ResolvedScope, query: ListProductionLogsQuery): Promise<ListProductionLogsResponse>;

  // Animal records — GET lists never 404 (BR-136b); POST is 404 for a foreign animal (BR-136a).
  listHealthRecords(scope: ResolvedScope, animalId: string, query: ListHealthRecordsQuery): Promise<ListHealthRecordsResponse>;
  createHealthRecord(scope: ResolvedScope, animalId: string, body: CreateHealthRecordBody): Promise<LivestockHealthRecord>;
  listBreedingRecords(scope: ResolvedScope, animalId: string, query: ListBreedingRecordsQuery): Promise<ListBreedingRecordsResponse>;
  createBreedingRecord(scope: ResolvedScope, animalId: string, body: CreateBreedingRecordBody): Promise<LivestockBreedingRecord>;
  listFeedPlans(scope: ResolvedScope, animalId: string, query: ListFeedPlansQuery): Promise<ListFeedPlansResponse>;
  createFeedPlan(scope: ResolvedScope, animalId: string, body: CreateFeedPlanBody): Promise<LivestockFeedPlan>;
  listFeedLogs(scope: ResolvedScope, animalId: string, query: ListFeedLogsQuery): Promise<ListFeedLogsResponse>;
  createFeedLog(scope: ResolvedScope, animalId: string, body: CreateFeedLogBody): Promise<LivestockFeedLog>;
  listHousingRecords(scope: ResolvedScope, animalId: string, query: ListHousingRecordsQuery): Promise<ListHousingRecordsResponse>;
  createHousingRecord(scope: ResolvedScope, animalId: string, body: CreateHousingRecordBody): Promise<LivestockHousingRecord>;
  listHygieneLogs(scope: ResolvedScope, animalId: string, query: ListHygieneLogsQuery): Promise<ListHygieneLogsResponse>;
  createHygieneLog(scope: ResolvedScope, animalId: string, body: CreateHygieneLogBody): Promise<LivestockHygieneLog>;
}

export function createLivestockService(deps: Partial<LivestockServiceDeps> = {}): LivestockService {
  const repo = deps.repo ?? livestockRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;
  const farmsSvc: FarmsService = deps.farmsSvc ?? farmsService;

  /** The farm a new animal/production log attaches to — see the file-level "WHICH FARM" note. */
  async function ownPrimaryFarmId(scope: ResolvedScope): Promise<string> {
    const farms = await farmsSvc.list(scope);
    const primary = farms[0];
    if (primary === undefined) {
      throw new AppError('NOT_FOUND', { detail: 'No farm found for the current actor. Register a farm first.' });
    }
    return primary.id;
  }

  /**
   * An attachment must be an upload the caller made — the same semantics as
   * pest.service.ts#requireOwnUpload. 422, not 404: the path resource exists,
   * it is a body field that is invalid (BR-136c).
   */
  async function requireOwnUpload(tx: Executor, scope: ResolvedScope, uploadId: string): Promise<void> {
    const ownerId = await repo.findUploadOwner(tx, uploadId);
    if (ownerId === undefined) {
      throw new AppError('VALIDATION_FAILED', { status: 422, detail: 'attachmentUploadId does not reference an existing upload.' });
    }
    if (ownerId !== scope.userId) {
      throw new AppError('VALIDATION_FAILED', { status: 422, detail: 'attachmentUploadId does not reference an upload you own.' });
    }
  }

  /**
   * The shared create sequence for every animal record, in one transaction:
   * ownership (404) -> `check` (rule 422s, e.g. BR-138) -> attachment (422)
   * -> `insert` -> `after` (side effects such as BR-137). The insert itself
   * also re-checks ownership in SQL, so a null from it is still a 404.
   */
  async function createAnimalRecord<T>(
    scope: ResolvedScope,
    animalId: string,
    attachmentUploadId: string | undefined,
    insert: (tx: Executor, farmerId: string) => Promise<T | null>,
    hooks: { check?: (animal: AnimalResponse) => void; after?: (tx: Executor) => Promise<void> } = {},
  ): Promise<T> {
    const farmerId = ownFarmerId(scope);
    return runTx(async (tx) => {
      const animal = await repo.findAnimal(tx, farmerId, animalId);
      if (animal === null) throw animalNotFound(animalId);
      hooks.check?.(animal);
      if (attachmentUploadId !== undefined) await requireOwnUpload(tx, scope, attachmentUploadId);

      const created = await insert(tx, farmerId);
      if (created === null) throw animalNotFound(animalId);
      if (hooks.after !== undefined) await hooks.after(tx);
      return created;
    });
  }

  return {
    async createAnimal(scope, body) {
      const farmerId = ownFarmerId(scope);
      const farmId = await ownPrimaryFarmId(scope);

      return runTx(async (tx) => {
        const data: CreateAnimalData = { ...body, farmId };
        let animalId: string;
        try {
          animalId = await repo.createAnimal(tx, data);
        } catch (error) {
          if (isUniqueViolation(error)) throw animalTagConflict(body.tag);
          throw error;
        }

        const created = await repo.findAnimal(tx, farmerId, animalId);
        if (created === null) throw animalNotFound(animalId);
        return created;
      });
    },

    async listAnimals(scope, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = query.cursor !== undefined && query.cursor.length > 0 ? decodeCursor(query.cursor) : undefined;
      const { items, next } = await repo.listAnimals(db, {
        farmerId,
        species: query.species,
        lifecycleStatus: query.lifecycleStatus,
        cursor,
        limit: query.limit,
      });
      return {
        items,
        page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
      };
    },

    async getAnimal(scope, animalId) {
      const farmerId = ownFarmerId(scope);
      const animal = await repo.findAnimal(db, farmerId, animalId);
      if (animal === null) throw animalNotFound(animalId);
      return animal;
    },

    async updateAnimal(scope, animalId, body) {
      const farmerId = ownFarmerId(scope);

      return runTx(async (tx) => {
        // Existence/ownership first, so a foreign animal is NOT_FOUND before
        // any other error could hint that it exists.
        const existing = await repo.findAnimal(tx, farmerId, animalId);
        if (existing === null) throw animalNotFound(animalId);

        const patch: UpdateAnimalPatch = {};
        if (body.tag !== undefined) patch.tag = body.tag;
        if (body.name !== undefined) patch.name = body.name;
        if (body.species !== undefined) patch.species = body.species;
        if (body.breed !== undefined) patch.breed = body.breed;
        if (body.gender !== undefined) patch.gender = body.gender;
        if (body.dateOfBirth !== undefined) patch.dateOfBirth = body.dateOfBirth;
        if (body.source !== undefined) patch.source = body.source;
        if (body.purchasedOn !== undefined) patch.purchasedOn = body.purchasedOn;
        if (body.sourceFarm !== undefined) patch.sourceFarm = body.sourceFarm;
        if (body.organicStatus !== undefined) patch.organicStatus = body.organicStatus;
        if (body.withdrawalUntil !== undefined) patch.withdrawalUntil = body.withdrawalUntil;
        if (body.notes !== undefined) patch.notes = body.notes;

        let updated: boolean;
        try {
          updated = await repo.updateAnimal(tx, farmerId, animalId, patch);
        } catch (error) {
          if (isUniqueViolation(error)) throw animalTagConflict(body.tag ?? existing.tag);
          throw error;
        }
        if (!updated) throw animalNotFound(animalId);

        const after = await repo.findAnimal(tx, farmerId, animalId);
        if (after === null) throw animalNotFound(animalId);
        return after;
      });
    },

    async recordLifecycleEvent(scope, animalId, body) {
      const farmerId = ownFarmerId(scope);

      return runTx(async (tx) => {
        // Ownership check first (NOT_FOUND before BR-47's CONFLICT), the same
        // ordering crops.service.ts uses for BR-46.
        const existing = await repo.findAnimal(tx, farmerId, animalId);
        if (existing === null) throw animalNotFound(animalId);

        let inserted: boolean;
        try {
          inserted = await repo.insertLifecycleEvent(tx, farmerId, animalId, body);
        } catch (error) {
          if (isUniqueViolation(error)) throw livestockAlreadyExited(animalId); // BR-47a
          throw error;
        }
        if (!inserted) throw animalNotFound(animalId);

        // BR-47b: the event and the status flip happen in the same
        // transaction — an action that partially applies (event recorded but
        // the animal still shows ACTIVE, or vice versa) is a bug.
        await repo.setAnimalLifecycleStatus(tx, animalId, body.eventType);

        const after = await repo.findAnimal(tx, farmerId, animalId);
        if (after === null) throw animalNotFound(animalId);
        return after;
      });
    },

    async createProductionLog(scope, body) {
      const farmerId = ownFarmerId(scope);
      const farmId = await ownPrimaryFarmId(scope);

      // The date is resolved here, not by the column default, so BR-139 below
      // compares against exactly the date that gets stored.
      const loggedOn = body.loggedOn ?? todayKolkata();
      let restrictedFromSale = body.restrictedFromSale ?? false;

      // A production log naming an animalId must be one of the caller's own
      // — cross-farmer resolution here would let a farmer attribute produce
      // to livestock they do not own (root CLAUDE.md §2.1).
      if (body.animalId !== undefined) {
        const owned = await repo.findAnimal(db, farmerId, body.animalId);
        if (owned === null) throw animalNotFound(body.animalId);
        // BR-139: produce from an animal still under withdrawal on that day
        // (the end date inclusive) cannot be offered for sale. The client may
        // flag more produce as restricted, never less.
        if (owned.withdrawalUntil !== null && owned.withdrawalUntil >= loggedOn) restrictedFromSale = true;
      }

      const data: CreateProductionLogData = { ...body, farmId, loggedOn, restrictedFromSale };
      const id = await repo.createProductionLog(db, data);
      const created = await repo.findProductionLog(db, farmerId, id);
      if (created === null) {
        throw new AppError('NOT_FOUND', { detail: `Production log ${id} could not be re-read after insert.` });
      }
      return created;
    },

    async listProductionLogs(scope, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = query.cursor !== undefined && query.cursor.length > 0 ? decodeCursor(query.cursor) : undefined;
      const { items, next } = await repo.listProductionLogs(db, {
        farmerId,
        productType: query.productType,
        animalId: query.animalId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        cursor,
        limit: query.limit,
      });
      return {
        items,
        page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
      };
    },

    // --- animal records ------------------------------------------------------
    // Lists: farmerId first (an actor with no farmer profile is NOT_FOUND, as
    // on every /me endpoint), then the cursor (a bad one is 422 before any
    // query), then the repo, whose ownership join turns a foreign animal into
    // an empty page.

    async listHealthRecords(scope, animalId, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = optionalDatedCursor(query.cursor);
      return toPage(await repo.listHealthRecords(db, { farmerId, animalId, cursor, limit: query.limit, recordType: query.recordType }));
    },

    async createHealthRecord(scope, animalId, body) {
      // BR-137: the latest end date of whichever windows were supplied.
      const withdrawalEnds =
        body.recordType === 'TREATMENT'
          ? [body.milkWithdrawal?.endDate, body.meatWithdrawal?.endDate].filter((d): d is string => d !== undefined)
          : [];
      const withdrawalUntil = withdrawalEnds.length === 0 ? null : withdrawalEnds.reduce((a, b) => (a > b ? a : b));

      return createAnimalRecord(scope, animalId, body.attachmentUploadId, (tx, farmerId) => repo.insertHealthRecord(tx, farmerId, animalId, body), {
        after: async (tx) => {
          if (withdrawalUntil !== null) await repo.extendAnimalWithdrawal(tx, animalId, withdrawalUntil);
        },
      });
    },

    async listBreedingRecords(scope, animalId, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = optionalDatedCursor(query.cursor);
      return toPage(await repo.listBreedingRecords(db, { farmerId, animalId, cursor, limit: query.limit, recordType: query.recordType }));
    },

    async createBreedingRecord(scope, animalId, body) {
      return createAnimalRecord(scope, animalId, body.attachmentUploadId, (tx, farmerId) => repo.insertBreedingRecord(tx, farmerId, animalId, body), {
        check: (animal) => {
          if (animal.gender !== 'FEMALE') throw breedingRequiresFemale(animalId); // BR-138a
        },
      });
    },

    async listFeedPlans(scope, animalId, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = optionalDatedCursor(query.cursor);
      return toPage(await repo.listFeedPlans(db, { farmerId, animalId, cursor, limit: query.limit }));
    },

    async createFeedPlan(scope, animalId, body) {
      return createAnimalRecord(scope, animalId, body.attachmentUploadId, (tx, farmerId) => repo.insertFeedPlan(tx, farmerId, animalId, body));
    },

    async listFeedLogs(scope, animalId, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = optionalDatedCursor(query.cursor);
      return toPage(
        await repo.listFeedLogs(db, { farmerId, animalId, cursor, limit: query.limit, dateFrom: query.dateFrom, dateTo: query.dateTo }),
      );
    },

    async createFeedLog(scope, animalId, body) {
      return createAnimalRecord(scope, animalId, undefined, (tx, farmerId) => repo.insertFeedLog(tx, farmerId, animalId, body));
    },

    async listHousingRecords(scope, animalId, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = optionalDatedCursor(query.cursor);
      // BR-140: read (and fail closed on) the standard before the rows, and for every animal id,
      // so a foreign or missing animal answers exactly like an own animal with no housing yet.
      const standard = parseIndoorSpaceStandard(await repo.getMinIndoorSpaceSqFtPerAnimal(db));
      const { items, page } = toPage(await repo.listHousingRecords(db, { farmerId, animalId, cursor, limit: query.limit }));
      return listHousingRecordsResponse.parse({
        items: items.map((item) => ({
          ...item,
          meetsIndoorSpaceStandard: meetsIndoorSpaceStandard(item.indoorSpacePerAnimal, standard.hundredthsSqFt),
        })),
        page,
        spaceStandard: { minIndoorSqFtPerAnimal: standard.sqFt },
      });
    },

    async createHousingRecord(scope, animalId, body) {
      return createAnimalRecord(scope, animalId, body.attachmentUploadId, (tx, farmerId) =>
        repo.insertHousingRecord(tx, farmerId, animalId, body),
      );
    },

    async listHygieneLogs(scope, animalId, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = optionalDatedCursor(query.cursor);
      return toPage(
        await repo.listHygieneLogs(db, { farmerId, animalId, cursor, limit: query.limit, dateFrom: query.dateFrom, dateTo: query.dateTo }),
      );
    },

    async createHygieneLog(scope, animalId, body) {
      return createAnimalRecord(scope, animalId, undefined, (tx, farmerId) => repo.insertHygieneLog(tx, farmerId, animalId, body));
    },
  };
}

export const livestockService: LivestockService = createLivestockService();

// ---------------------------------------------------------------------------
// Admin service — read-only, `admin.livestock.view_all` (scope all)
// ---------------------------------------------------------------------------

export interface LivestockAdminService {
  listAnimalsForFarmer(scope: ResolvedScope, farmerId: string): Promise<ListAdminAnimalsResponse>;
}

export function createLivestockAdminService(
  deps: Partial<Pick<LivestockServiceDeps, 'repo' | 'db'>> = {},
): LivestockAdminService {
  const repo = deps.repo ?? livestockRepo;
  const db = deps.db ?? pool;

  return {
    async listAnimalsForFarmer(_scope, farmerId) {
      // No admin write path exists for this module (there is no admin-
      // manageable livestock taxonomy, unlike crop_master), so there is
      // nothing to audit-log here — this mirrors crops' read-only
      // `listCropMaster` admin path, which also writes no audit_log row.
      const items = await repo.listAnimalsForFarmer(db, farmerId);
      return { items };
    },
  };
}

export const livestockAdminService: LivestockAdminService = createLivestockAdminService();
