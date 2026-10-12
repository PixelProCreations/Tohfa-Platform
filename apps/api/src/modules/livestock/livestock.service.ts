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
 */
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { farmsService, type FarmsService } from '../farms/farms.service.js';
import {
  livestockRepo,
  type CreateAnimalData,
  type CreateProductionLogData,
  type ListCursor,
  type LivestockRepo,
  type UpdateAnimalPatch,
} from './livestock.repo.js';
import type {
  AnimalResponse,
  CreateAnimalBody,
  CreateProductionLogBody,
  ListAdminAnimalsResponse,
  ListAnimalsQuery,
  ListAnimalsResponse,
  ListProductionLogsQuery,
  ListProductionLogsResponse,
  ProductionLogResponse,
  RecordLifecycleEventBody,
  UpdateAnimalBody,
} from './livestock.schema.js';

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

      // A production log naming an animalId must be one of the caller's own
      // — cross-farmer resolution here would let a farmer attribute produce
      // to livestock they do not own (root CLAUDE.md §2.1).
      if (body.animalId !== undefined) {
        const owned = await repo.findAnimal(db, farmerId, body.animalId);
        if (owned === null) throw animalNotFound(body.animalId);
      }

      const data: CreateProductionLogData = { ...body, farmId };
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
