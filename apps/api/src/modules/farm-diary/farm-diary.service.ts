/**
 * Farm Diary business logic (BR-40..BR-45).
 *
 * Two services live here, sharing one repo:
 *   - createFarmDiaryService          farmer-facing `/farmers/me/diary/*`
 *   - createDiaryTaxonomyAdminService admin taxonomy management `/admin/diary/*`
 *
 * OWNERSHIP (BR-40 / BR-43). Every farmer-facing method resolves the owner
 * from `scope.farmerId` and nothing else — there is no client-supplied
 * farmerId anywhere in the request schemas. That holds even for a
 * SUPER_ADMIN/TOHFA_ADMIN whose rbac grant on `farmer.diary.*` is `all`: these
 * are `/me` endpoints, so "all" cannot mean "every farmer's diary" here. An
 * actor with no farmer profile gets NOT_FOUND, the same as farm-ratings'
 * getMyRating. The owner id goes into the repo's WHERE clause, so a foreign
 * entry is simply not matched and the caller sees NOT_FOUND / an empty list,
 * never a 403 that would confirm the row exists (requirePermission.ts, §4).
 */
import { writeAuditLog, changedFields } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { farmDiaryRepo, type EntryCursor, type FarmDiaryRepo, type UpdateEntryPatch, type WorkerRowInput } from './farm-diary.repo.js';
import type {
  AttachDiaryPhotoBody,
  CreateDiaryCategoryBody,
  CreateDiaryEntryBody,
  CreateDiarySubActivityBody,
  DiaryActiveCropResponse,
  DiaryCalendarQuery,
  DiaryCalendarResponse,
  DiaryCategoryResponse,
  DiaryEntryResponse,
  DiaryPhotoResponse,
  DiaryPlotResponse,
  DiarySubActivityResponse,
  DiaryTaxonomyResponse,
  DiaryWorkerInput,
  ListDiaryEntriesQuery,
  ListDiaryEntriesResponse,
  UpdateDiaryCategoryBody,
  UpdateDiaryEntryBody,
  UpdateDiarySubActivityBody,
} from './farm-diary.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface FarmDiaryServiceDeps {
  repo: FarmDiaryRepo;
  db: Executor;
  runTx: TransactionRunner;
}

/**
 * Upper bound of the Postgres `integer` column behind wage_rate_paise. A value
 * above it is not a plausible hourly wage and would otherwise surface as a raw
 * database overflow instead of the BR-44b domain error.
 */
const PG_INTEGER_MAX = 2_147_483_647;

/** Storage-key prefix the uploads module issues for purpose DIARY_PHOTO (`<purpose lowercased>/<uuid><ext>`). */
const DIARY_PHOTO_KEY_PREFIX = 'diary_photo/';

// ---------------------------------------------------------------------------
// DELIBERATE STUBS — not bugs.
//
// No module in this codebase reads `plots` or `farm_crops` for a farmer yet:
// there is no plots/farms API and no farm_crops write path. Until that
// separate plots/farms module exists, the two picker endpoints below return
// fixed fixtures so the mobile diary form can be built against a stable
// contract. They are the SAME for every farmer, which is only acceptable
// because they contain no real farm data.
//
// Entry creation does NOT use these fixtures: POST /entries validates plot
// ownership and BR-42b's GROWING crop against the real `plots`/`farms`/
// `farm_crops` tables, so a fixture plot id is (correctly) rejected there.
// Replace both methods with real repo reads when the plots module lands.
// ---------------------------------------------------------------------------
const STUB_PLOTS: readonly DiaryPlotResponse[] = [
  { id: '5d1a0000-0000-4000-8000-000000000001', name: 'Field A', areaAcres: 1.5 },
  { id: '5d1a0000-0000-4000-8000-000000000002', name: 'Field B', areaAcres: 0.75 },
  { id: '5d1a0000-0000-4000-8000-000000000003', name: 'Greenhouse 1', areaAcres: 0.25 },
];

const STUB_ACTIVE_CROP: DiaryActiveCropResponse = {
  id: '5d1ac000-0000-4000-8000-000000000001',
  cropName: 'Carrot',
  plantedOn: '2026-08-01',
};

// ---------------------------------------------------------------------------
// Shared validation helpers
// ---------------------------------------------------------------------------

function ownFarmerId(scope: ResolvedScope): string {
  if (scope.farmerId === undefined) {
    throw new AppError('NOT_FOUND', { detail: 'No farmer profile for the current actor.' });
  }
  return scope.farmerId;
}

function entryNotFound(entryId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No diary entry with id ${entryId} is visible to you.` });
}

/** BR-42c. `minutes` is optional in zod so that a missing value reaches this check. */
function assertMinutes(minutes: number | undefined): number {
  if (minutes === undefined || minutes <= 0) {
    throw new AppError('DIARY_MINUTES_REQUIRED', {
      detail: 'minutes is required and must be greater than zero.',
      meta: { minutes: minutes ?? null },
    });
  }
  return minutes;
}

/** BR-44a / BR-44b, per worker. Returns the rows ready for the repo. */
function validateWorkers(workers: readonly DiaryWorkerInput[]): WorkerRowInput[] {
  return workers.map((worker, index) => {
    if (!(worker.hoursWorked > 0 && worker.hoursWorked <= 24)) {
      throw new AppError('DIARY_WORKER_HOURS_INVALID', {
        detail: `workers[${index}].hoursWorked must be greater than 0 and at most 24.`,
        meta: { index, hoursWorked: worker.hoursWorked },
      });
    }
    // Integer paise only (root CLAUDE.md §2.2): 250.5 paise is a float
    // pretending to be money.
    if (!Number.isInteger(worker.wageRatePaise) || worker.wageRatePaise <= 0 || worker.wageRatePaise > PG_INTEGER_MAX) {
      throw new AppError('DIARY_WAGE_RATE_INVALID', {
        detail: `workers[${index}].wageRatePaise must be a positive whole number of paise.`,
        meta: { index, wageRatePaise: worker.wageRatePaise },
      });
    }
    return {
      name: worker.name,
      role: worker.role ?? null,
      hoursWorked: worker.hoursWorked,
      wageRatePaise: worker.wageRatePaise,
      paymentStatus: worker.paymentStatus,
    };
  });
}

/** BR-42a / BR-45b: checked against the live taxonomy tables, inactive rows excluded. */
async function assertActiveSubActivity(
  repo: FarmDiaryRepo,
  db: Executor,
  categoryKey: string,
  subActivityKey: string,
): Promise<void> {
  const ok = await repo.isActiveSubActivityOfCategory(db, categoryKey, subActivityKey);
  if (!ok) {
    throw new AppError('DIARY_INVALID_SUB_ACTIVITY', {
      detail: `"${subActivityKey}" is not an active sub-activity of category "${categoryKey}".`,
      meta: { categoryKey, subActivityKey },
    });
  }
}

/**
 * The list cursor is opaque base64url JSON of the last row's
 * (activityOn, loggedAt, id). The response envelope `{ items, page: {
 * nextCursor, hasMore } }` matches certifications/allocations; the cursor
 * itself is a composite rather than their bare `id < cursor`, because entries
 * are ordered by activity date and random UUIDs do not sort by date.
 */
function encodeCursor(cursor: EntryCursor): string {
  return Buffer.from(JSON.stringify([cursor.activityOn, cursor.loggedAt, cursor.id]), 'utf8').toString('base64url');
}

function decodeCursor(raw: string): EntryCursor {
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
      return { activityOn: parsed[0], loggedAt: parsed[1], id: parsed[2] };
    }
  } catch {
    // fall through to the typed error below
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

// ---------------------------------------------------------------------------
// Farmer-facing service
// ---------------------------------------------------------------------------

export interface FarmDiaryService {
  listPlots(scope: ResolvedScope): Promise<{ items: DiaryPlotResponse[] }>;
  listActiveCrops(scope: ResolvedScope, plotId: string): Promise<{ items: DiaryActiveCropResponse[] }>;
  getTaxonomy(scope: ResolvedScope): Promise<DiaryTaxonomyResponse>;
  createEntry(scope: ResolvedScope, body: CreateDiaryEntryBody): Promise<DiaryEntryResponse>;
  listEntries(scope: ResolvedScope, query: ListDiaryEntriesQuery): Promise<ListDiaryEntriesResponse>;
  getCalendar(scope: ResolvedScope, query: DiaryCalendarQuery): Promise<DiaryCalendarResponse>;
  getEntry(scope: ResolvedScope, entryId: string): Promise<DiaryEntryResponse>;
  updateEntry(scope: ResolvedScope, entryId: string, body: UpdateDiaryEntryBody): Promise<DiaryEntryResponse>;
  deleteEntry(scope: ResolvedScope, entryId: string): Promise<void>;
  attachPhoto(scope: ResolvedScope, entryId: string, body: AttachDiaryPhotoBody): Promise<DiaryPhotoResponse>;
  deletePhoto(scope: ResolvedScope, entryId: string, photoId: string): Promise<void>;
}

export function createFarmDiaryService(deps: Partial<FarmDiaryServiceDeps> = {}): FarmDiaryService {
  const repo = deps.repo ?? farmDiaryRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;

  return {
    async listPlots(scope) {
      ownFarmerId(scope);
      // STUB — see STUB_PLOTS above.
      return { items: STUB_PLOTS.map((plot) => ({ ...plot })) };
    },

    async listActiveCrops(scope, _plotId) {
      ownFarmerId(scope);
      // STUB — see STUB_PLOTS above. Returns the same single fixture for any
      // plot id; the real version must filter by plot ownership (BR-40) and
      // farm_crops.status = 'GROWING'.
      return { items: [{ ...STUB_ACTIVE_CROP }] };
    },

    async getTaxonomy(scope) {
      ownFarmerId(scope);
      const { categories, subActivities } = await repo.listActiveTaxonomy(db);
      return {
        categories: categories.map((category) => ({
          ...category,
          subActivities: subActivities.filter((sub) => sub.categoryKey === category.key),
        })),
      };
    },

    async createEntry(scope, body) {
      const farmerId = ownFarmerId(scope);

      // Pure-input rules first: they need no database and no ownership.
      const minutes = assertMinutes(body.minutes); // BR-42c
      const workers = validateWorkers(body.workers); // BR-44a/b

      return runTx(async (tx) => {
        await assertActiveSubActivity(repo, tx, body.categoryKey, body.subActivityKey); // BR-42a

        // Ownership is re-derived from plots -> farms.farmer_id. A plot that
        // is not the caller's is NOT_FOUND, not 403 (BR-40).
        const owned = await repo.isPlotOwnedByFarmer(tx, body.plotId, farmerId);
        if (!owned) {
          throw new AppError('NOT_FOUND', { detail: `No plot with id ${body.plotId} is visible to you.` });
        }

        // BR-42b: against the real farm_crops table. Zero GROWING rows is a
        // correct rejection, not something to stub around.
        const farmCropId = await repo.findGrowingCropOnPlot(tx, body.plotId, body.farmCropId);
        if (farmCropId === null) {
          throw new AppError('DIARY_NO_ACTIVE_CROP', {
            detail: `Plot ${body.plotId} has no crop in status GROWING${body.farmCropId === undefined ? '' : ` with id ${body.farmCropId}`}.`,
            meta: { plotId: body.plotId },
          });
        }

        const entryId = await repo.createEntry(tx, {
          farmerId,
          plotId: body.plotId,
          farmCropId,
          categoryKey: body.categoryKey,
          subActivityKey: body.subActivityKey,
          activityFields: body.activityFields,
          minutes,
          notes: body.notes ?? null,
          activityOn: body.activityOn ?? null,
          voiceNoteKey: body.voiceNoteKey ?? null,
          voiceNoteDurationS: body.voiceNoteDurationS ?? null,
        });

        // Same transaction as the entry insert: an entry never exists without
        // the workforce the farmer submitted with it.
        if (workers.length > 0) {
          await repo.replaceWorkers(tx, entryId, workers);
        }

        const created = await repo.findEntry(tx, farmerId, entryId);
        if (created === null) throw entryNotFound(entryId);
        return created;
      });
    },

    async listEntries(scope, query) {
      const farmerId = ownFarmerId(scope);
      const cursor = query.cursor !== undefined && query.cursor.length > 0 ? decodeCursor(query.cursor) : undefined;

      const { items, next } = await repo.listEntries(db, {
        farmerId,
        date: query.date,
        monthStart: query.month === undefined ? undefined : `${query.month}-01`,
        plotId: query.plotId,
        categoryKey: query.categoryKey,
        cursor,
        limit: query.limit,
      });

      return {
        items,
        page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
      };
    },

    async getCalendar(scope, query) {
      const farmerId = ownFarmerId(scope);
      const days = await repo.calendarDays(db, farmerId, `${query.month}-01`);
      return { month: query.month, days };
    },

    async getEntry(scope, entryId) {
      const farmerId = ownFarmerId(scope);
      const entry = await repo.findEntry(db, farmerId, entryId);
      if (entry === null) throw entryNotFound(entryId); // BR-40a: foreign == absent
      return entry;
    },

    async updateEntry(scope, entryId, body) {
      const farmerId = ownFarmerId(scope);

      if (body.minutes !== undefined) assertMinutes(body.minutes); // BR-42c
      const workers = body.workers === undefined ? undefined : validateWorkers(body.workers); // BR-44a/b

      return runTx(async (tx) => {
        // Existence/ownership first, so a foreign entry is NOT_FOUND before
        // any validation error could hint that it exists (BR-43a). There is
        // deliberately no age check on activity_on (BR-43c).
        const existing = await repo.findEntry(tx, farmerId, entryId);
        if (existing === null) throw entryNotFound(entryId);

        // BR-42a is re-applied only when the pair changes. An untouched entry
        // filed under a since-deactivated sub-activity stays editable
        // (BR-45b: deactivation never invalidates existing entries).
        if (body.categoryKey !== undefined || body.subActivityKey !== undefined) {
          await assertActiveSubActivity(
            repo,
            tx,
            body.categoryKey ?? existing.categoryKey,
            body.subActivityKey ?? existing.subActivityKey,
          );
        }

        const patch: UpdateEntryPatch = {};
        if (body.categoryKey !== undefined) patch.categoryKey = body.categoryKey;
        if (body.subActivityKey !== undefined) patch.subActivityKey = body.subActivityKey;
        if (body.minutes !== undefined) patch.minutes = body.minutes;
        if (body.activityFields !== undefined) patch.activityFields = body.activityFields;
        if (body.notes !== undefined) patch.notes = body.notes;
        if (body.activityOn !== undefined) patch.activityOn = body.activityOn;
        if (body.voiceNoteKey !== undefined) patch.voiceNoteKey = body.voiceNoteKey;
        if (body.voiceNoteDurationS !== undefined) patch.voiceNoteDurationS = body.voiceNoteDurationS;

        const updated = await repo.updateEntry(tx, farmerId, entryId, patch);
        if (!updated) throw entryNotFound(entryId);

        // BR-44c: present => full replace in this transaction; absent => untouched.
        if (workers !== undefined) {
          await repo.replaceWorkers(tx, entryId, workers);
        }

        const after = await repo.findEntry(tx, farmerId, entryId);
        if (after === null) throw entryNotFound(entryId);
        return after;
      });
    },

    async deleteEntry(scope, entryId) {
      const farmerId = ownFarmerId(scope);
      // BR-43b: soft delete only. BR-43a: foreign entry matches nothing -> 404.
      const deleted = await repo.softDeleteEntry(db, farmerId, entryId);
      if (!deleted) throw entryNotFound(entryId);
    },

    async attachPhoto(scope, entryId, body) {
      const farmerId = ownFarmerId(scope);

      // Only keys the uploads module issued for purpose DIARY_PHOTO are
      // accepted. EXIF/GPS stripping (BR-16/BR-41) belongs to the uploads
      // pipeline (uploadsService.processAndSanitizeImage); this endpoint only
      // attaches the resulting key, like listings/goods-receipts do.
      if (!body.storageKey.startsWith(DIARY_PHOTO_KEY_PREFIX)) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `storageKey must be issued by POST /uploads/sign with purpose DIARY_PHOTO.`,
          errors: { 'body.storageKey': [`must start with "${DIARY_PHOTO_KEY_PREFIX}"`] },
        });
      }

      return runTx(async (tx) => {
        const entry = await repo.findEntry(tx, farmerId, entryId);
        if (entry === null) throw entryNotFound(entryId);
        return repo.addPhoto(tx, entryId, body);
      });
    },

    async deletePhoto(scope, entryId, photoId) {
      const farmerId = ownFarmerId(scope);
      const deleted = await repo.deletePhoto(db, farmerId, entryId, photoId);
      if (!deleted) {
        throw new AppError('NOT_FOUND', { detail: `No photo with id ${photoId} is visible to you.` });
      }
    },
  };
}

export const farmDiaryService: FarmDiaryService = createFarmDiaryService();

// ---------------------------------------------------------------------------
// Admin taxonomy service (BR-45)
//
// Every mutation writes exactly one audit_log row through the SAME transaction
// client as the change (apps/api/CLAUDE.md "Transactions"). audit_log.entity_id
// is a uuid column and taxonomy rows are keyed by text, so entity_id is null
// and the key travels in the before/after snapshots instead.
// ---------------------------------------------------------------------------

export interface DiaryTaxonomyAdminService {
  createCategory(scope: ResolvedScope, body: CreateDiaryCategoryBody): Promise<DiaryCategoryResponse>;
  updateCategory(scope: ResolvedScope, key: string, body: UpdateDiaryCategoryBody): Promise<DiaryCategoryResponse>;
  createSubActivity(
    scope: ResolvedScope,
    categoryKey: string,
    body: CreateDiarySubActivityBody,
  ): Promise<DiarySubActivityResponse>;
  updateSubActivity(
    scope: ResolvedScope,
    key: string,
    body: UpdateDiarySubActivityBody,
  ): Promise<DiarySubActivityResponse>;
}

export function createDiaryTaxonomyAdminService(
  deps: Partial<Pick<FarmDiaryServiceDeps, 'repo' | 'runTx'>> = {},
): DiaryTaxonomyAdminService {
  const repo = deps.repo ?? farmDiaryRepo;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;

  function conflict(what: string, key: string): AppError {
    return new AppError('CONFLICT', { detail: `A diary ${what} with key "${key}" already exists.` });
  }

  return {
    async createCategory(scope, body) {
      return runTx(async (tx) => {
        if ((await repo.findCategory(tx, body.key)) !== null) throw conflict('category', body.key);
        let created: DiaryCategoryResponse;
        try {
          created = await repo.createCategory(tx, body);
        } catch (error) {
          if (isUniqueViolation(error)) throw conflict('category', body.key);
          throw error;
        }
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'diary_taxonomy.category.create',
          entityType: 'diary_activity_category',
          entityId: null,
          after: created,
        });
        return created;
      });
    },

    async updateCategory(scope, key, body) {
      return runTx(async (tx) => {
        const before = await repo.findCategory(tx, key);
        if (before === null) throw new AppError('NOT_FOUND', { detail: `No diary category with key "${key}".` });

        // Deactivation is `isActive: false` — an UPDATE, never a DELETE, so
        // entries already filed under it stay valid (BR-45).
        const after = await repo.updateCategory(tx, key, body);
        if (after === null) throw new AppError('NOT_FOUND', { detail: `No diary category with key "${key}".` });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'diary_taxonomy.category.update',
          entityType: 'diary_activity_category',
          entityId: null,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return after;
      });
    },

    async createSubActivity(scope, categoryKey, body) {
      // Sub-activity keys are dotted under their category
      // (0020_farm_diary.sql: "land_prep" -> "land_prep.ploughing_tilling").
      if (!body.key.startsWith(`${categoryKey}.`) || body.key.length <= categoryKey.length + 1) {
        throw new AppError('VALIDATION_FAILED', {
          detail: `Sub-activity key must be "${categoryKey}.<name>".`,
          errors: { 'body.key': [`must start with "${categoryKey}."`] },
        });
      }

      return runTx(async (tx) => {
        const category = await repo.findCategory(tx, categoryKey);
        if (category === null) {
          throw new AppError('NOT_FOUND', { detail: `No diary category with key "${categoryKey}".` });
        }
        if ((await repo.findSubActivity(tx, body.key)) !== null) throw conflict('sub-activity', body.key);

        let created: DiarySubActivityResponse;
        try {
          created = await repo.createSubActivity(tx, categoryKey, body);
        } catch (error) {
          if (isUniqueViolation(error)) throw conflict('sub-activity', body.key);
          throw error;
        }
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'diary_taxonomy.sub_activity.create',
          entityType: 'diary_sub_activity',
          entityId: null,
          after: created,
        });
        return created;
      });
    },

    async updateSubActivity(scope, key, body) {
      return runTx(async (tx) => {
        const before = await repo.findSubActivity(tx, key);
        if (before === null) throw new AppError('NOT_FOUND', { detail: `No diary sub-activity with key "${key}".` });

        const after = await repo.updateSubActivity(tx, key, body);
        if (after === null) throw new AppError('NOT_FOUND', { detail: `No diary sub-activity with key "${key}".` });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'diary_taxonomy.sub_activity.update',
          entityType: 'diary_sub_activity',
          entityId: null,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return after;
      });
    },
  };
}

export const diaryTaxonomyAdminService: DiaryTaxonomyAdminService = createDiaryTaxonomyAdminService();
