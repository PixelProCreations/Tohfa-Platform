/**
 * Crops business logic (BR-46).
 *
 * Two services live here, sharing one repo:
 *   - createCropsService              farmer-facing `/farmers/me/plots/*`, `/farmers/me/crops/*`, `/farmers/me/crop-master`
 *   - createCropTaxonomyAdminService  admin crop taxonomy management `/admin/crop-master/*`
 *
 * OWNERSHIP. Every farmer-facing method resolves the owner from
 * `scope.farmerId` and nothing else — there is no client-supplied farmerId
 * anywhere in the request schemas. That holds even for a SUPER_ADMIN/
 * TOHFA_ADMIN whose rbac grant on `farmer.crops.*` is `all`: these are `/me`
 * endpoints, so "all" cannot mean "every farmer's crops" here — exactly the
 * doctrine farm-diary.service.ts documents and tests for its own `/me`
 * endpoints. A foreign plot or farm_crops row is NOT_FOUND, never 403 — a 403
 * would confirm the row exists for someone else.
 *
 * BR-46. A plot cannot have two live crops in status GROWING at once. The
 * database enforces this with a partial unique index
 * (`uq_farm_crops_one_growing_per_plot`, db/migrations/0023); this service
 * only translates the resulting constraint violation into the domain error
 * `CROP_PLOT_ALREADY_GROWING`. It does not re-implement the check in
 * application code, because a check-then-write in the service would still
 * race two concurrent requests against the same plot.
 */
import { writeAuditLog, changedFields } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { assertVisibleFarmer } from '../admin-farmers/admin-farmers.service.js';
import {
  cropsRepo,
  type CropsRepo,
  type FarmCropCursor,
  type UpdateCropMasterPatch,
  type UpdateFarmCropPatch,
} from './crops.repo.js';
import type {
  CreateCropMasterBody,
  CreateFarmCropBody,
  CropMasterResponse,
  FarmCropResponse,
  ListCropMasterResponse,
  ListFarmCropsQuery,
  ListFarmCropsResponse,
  PlotRotationHistoryResponse,
  UpdateCropMasterBody,
  UpdateFarmCropBody,
} from './crops.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface CropsServiceDeps {
  repo: CropsRepo;
  db: Executor;
  runTx: TransactionRunner;
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

function farmCropNotFound(farmCropId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No crop with id ${farmCropId} is visible to you.` });
}

function plotNotFound(plotId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No plot with id ${plotId} is visible to you.` });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
}

/** BR-46: the database's partial unique index rejected a second live GROWING crop on the plot. */
function cropPlotAlreadyGrowing(plotId: string): AppError {
  return new AppError('CROP_PLOT_ALREADY_GROWING', {
    detail: `Plot ${plotId} already has another crop in status GROWING.`,
    meta: { plotId },
  });
}

/**
 * The list cursor is opaque base64url JSON of the last row's (createdAt, id),
 * the same shape farm-diary's list cursor uses for its own composite key.
 */
function encodeCursor(cursor: FarmCropCursor): string {
  return Buffer.from(JSON.stringify([cursor.createdAt, cursor.id]), 'utf8').toString('base64url');
}

function decodeCursor(raw: string): FarmCropCursor {
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

export interface CropsService {
  listCropMaster(scope: ResolvedScope): Promise<ListCropMasterResponse>;
  createFarmCrop(scope: ResolvedScope, plotId: string, body: CreateFarmCropBody): Promise<FarmCropResponse>;
  listFarmCrops(scope: ResolvedScope, plotId: string, query: ListFarmCropsQuery): Promise<ListFarmCropsResponse>;
  getFarmCrop(scope: ResolvedScope, farmCropId: string): Promise<FarmCropResponse>;
  updateFarmCrop(scope: ResolvedScope, farmCropId: string, body: UpdateFarmCropBody): Promise<FarmCropResponse>;
  getPlotRotationHistory(scope: ResolvedScope, plotId: string): Promise<PlotRotationHistoryResponse>;
}

async function createFarmCropForFarmer(
  repo: CropsRepo,
  tx: Executor,
  farmerId: string,
  plotId: string,
  body: CreateFarmCropBody,
  createdByAdminId: string | null = null,
): Promise<FarmCropResponse> {
  const owned = await repo.isPlotOwnedByFarmer(tx, plotId, farmerId);
  if (!owned) throw plotNotFound(plotId);

  const cropMaster = await repo.findCropMaster(tx, body.cropMasterId);
  if (cropMaster === null) {
    throw new AppError('NOT_FOUND', { detail: `No crop type with id ${body.cropMasterId}.` });
  }

  const farmCropId = await repo.createFarmCrop(tx, { ...body, plotId, createdByAdminId });
  const created = await repo.findFarmCrop(tx, farmerId, farmCropId);
  if (created === null) throw farmCropNotFound(farmCropId);
  return created;
}

async function listFarmCropsForFarmer(
  repo: CropsRepo,
  db: Executor,
  farmerId: string,
  plotId: string,
  query: ListFarmCropsQuery,
): Promise<ListFarmCropsResponse> {
  const owned = await repo.isPlotOwnedByFarmer(db, plotId, farmerId);
  if (!owned) return { items: [], page: { nextCursor: null, hasMore: false } };

  const cursor = query.cursor !== undefined && query.cursor.length > 0 ? decodeCursor(query.cursor) : undefined;
  const { items, next } = await repo.listFarmCrops(db, {
    plotId,
    status: query.status,
    addedOnBehalf: query.addedOnBehalf,
    cursor,
    limit: query.limit,
  });
  return {
    items,
    page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
  };
}

async function updateFarmCropForFarmer(
  repo: CropsRepo,
  tx: Executor,
  farmerId: string,
  farmCropId: string,
  body: UpdateFarmCropBody,
): Promise<{ before: FarmCropResponse; after: FarmCropResponse }> {
  const before = await repo.findFarmCrop(tx, farmerId, farmCropId);
  if (before === null) throw farmCropNotFound(farmCropId);

  const patch: UpdateFarmCropPatch = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.plantedOn !== undefined) patch.plantedOn = body.plantedOn;
  if (body.expectedHarvestOn !== undefined) patch.expectedHarvestOn = body.expectedHarvestOn;
  if (body.actualHarvestOn !== undefined) patch.actualHarvestOn = body.actualHarvestOn;
  if (body.expectedYieldKg !== undefined) patch.expectedYieldKg = body.expectedYieldKg;
  if (body.actualYieldKg !== undefined) patch.actualYieldKg = body.actualYieldKg;
  if (body.seedVariety !== undefined) patch.seedVariety = body.seedVariety;
  if (body.seedCompany !== undefined) patch.seedCompany = body.seedCompany;
  if (body.seedQuantity !== undefined) patch.seedQuantity = body.seedQuantity;
  if (body.seedQuantityUnit !== undefined) patch.seedQuantityUnit = body.seedQuantityUnit;
  if (body.seedCostPaise !== undefined) patch.seedCostPaise = body.seedCostPaise;
  if (body.expectedGrade !== undefined) patch.expectedGrade = body.expectedGrade;
  if (body.notes !== undefined) patch.notes = body.notes;

  let updated: boolean;
  try {
    updated = await repo.updateFarmCrop(tx, farmerId, farmCropId, patch);
  } catch (error) {
    if (isUniqueViolation(error)) throw cropPlotAlreadyGrowing(before.plotId); // BR-46
    throw error;
  }
  if (!updated) throw farmCropNotFound(farmCropId);

  const after = await repo.findFarmCrop(tx, farmerId, farmCropId);
  if (after === null) throw farmCropNotFound(farmCropId);
  return { before, after };
}

export function createCropsService(deps: Partial<CropsServiceDeps> = {}): CropsService {
  const repo = deps.repo ?? cropsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;

  return {
    async listCropMaster(scope) {
      ownFarmerId(scope);
      const rows = await repo.listCropMaster(db, true);
      // A farmer picking a crop type has no need of which admin created it.
      const items = rows.map(({ createdByName: _createdByName, ...rest }) => rest);
      return { items };
    },

    async createFarmCrop(scope, plotId, body) {
      const farmerId = ownFarmerId(scope);
      return runTx((tx) => createFarmCropForFarmer(repo, tx, farmerId, plotId, body, null));
    },

    async listFarmCrops(scope, plotId, query) {
      const farmerId = ownFarmerId(scope);
      return listFarmCropsForFarmer(repo, db, farmerId, plotId, query);
    },

    async getFarmCrop(scope, farmCropId) {
      const farmerId = ownFarmerId(scope);
      const crop = await repo.findFarmCrop(db, farmerId, farmCropId);
      if (crop === null) throw farmCropNotFound(farmCropId);
      return crop;
    },

    async updateFarmCrop(scope, farmCropId, body) {
      const farmerId = ownFarmerId(scope);
      return runTx(async (tx) => (await updateFarmCropForFarmer(repo, tx, farmerId, farmCropId, body)).after);
    },

    async getPlotRotationHistory(scope, plotId) {
      const farmerId = ownFarmerId(scope);
      const owned = await repo.isPlotOwnedByFarmer(db, plotId, farmerId);
      if (!owned) return { plotId, history: [] };
      const history = await repo.getPlotRotationHistory(db, plotId);
      return { plotId, history };
    },
  };
}

export const cropsService: CropsService = createCropsService();

// ---------------------------------------------------------------------------
// Admin crop taxonomy service
//
// Every mutation writes exactly one audit_log row through the SAME
// transaction client as the change (apps/api/CLAUDE.md "Transactions"),
// mirroring diaryTaxonomyAdminService. Unlike the diary taxonomy,
// crop_master is keyed by uuid, so entityId carries the real id instead of
// travelling only in the before/after snapshots.
// ---------------------------------------------------------------------------

export interface CropTaxonomyAdminService {
  list(scope: ResolvedScope): Promise<ListCropMasterResponse>;
  create(scope: ResolvedScope, body: CreateCropMasterBody): Promise<CropMasterResponse>;
  update(scope: ResolvedScope, id: string, body: UpdateCropMasterBody): Promise<CropMasterResponse>;
}

export function createCropTaxonomyAdminService(
  deps: Partial<Pick<CropsServiceDeps, 'repo' | 'runTx' | 'db'>> = {},
): CropTaxonomyAdminService {
  const repo = deps.repo ?? cropsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;

  function conflict(slug: string): AppError {
    return new AppError('CONFLICT', { detail: `A crop with slug "${slug}" already exists.` });
  }

  return {
    async list(_scope) {
      const items = await repo.listCropMaster(db, false);
      return { items };
    },

    async create(scope, body) {
      return runTx(async (tx) => {
        if ((await repo.findCropMasterBySlug(tx, body.slug)) !== null) throw conflict(body.slug);

        let created: CropMasterResponse;
        try {
          created = await repo.createCropMaster(tx, { ...body, createdBy: scope.userId });
        } catch (error) {
          if (isUniqueViolation(error)) {
            const constraint =
              typeof error === 'object' && error !== null && 'constraint' in error
                ? (error as { constraint?: string }).constraint
                : undefined;
            if (constraint === 'crop_master_code_key') {
              throw new AppError('CONFLICT', { detail: 'Generated crop code already exists. Please retry.' });
            }
            throw conflict(body.slug);
          }
          throw error;
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'crop_taxonomy.crop_master.create',
          entityType: 'crop_master',
          entityId: created.id,
          after: created,
        });
        return created;
      });
    },

    async update(scope, id, body) {
      const patch: UpdateCropMasterPatch = { ...body };

      return runTx(async (tx) => {
        const before = await repo.findCropMaster(tx, id);
        if (before === null) throw new AppError('NOT_FOUND', { detail: `No crop with id ${id}.` });

        // Deactivation is `isActive: false` — an UPDATE, never a DELETE, so
        // listings/farm_crops rows already referencing this crop stay valid,
        // exactly as diary_activity_categories.is_active does (BR-45).
        const after = await repo.updateCropMaster(tx, id, patch);
        if (after === null) throw new AppError('NOT_FOUND', { detail: `No crop with id ${id}.` });

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'crop_taxonomy.crop_master.update',
          entityType: 'crop_master',
          entityId: id,
          before,
          // BR-181: the response omits the display metadata, so audit the requested patch too.
          after: { ...after, ...patch },
          changedFields: changedFields(before, { ...after, ...patch }),
        });
        return after;
      });
    },
  };
}

export const cropTaxonomyAdminService: CropTaxonomyAdminService = createCropTaxonomyAdminService();

export interface AdminFarmerCropsService {
  listFarmCrops(
    scope: ResolvedScope,
    farmerId: string,
    plotId: string,
    query: ListFarmCropsQuery,
  ): Promise<ListFarmCropsResponse>;
  createFarmCrop(
    scope: ResolvedScope,
    farmerId: string,
    plotId: string,
    body: CreateFarmCropBody,
  ): Promise<FarmCropResponse>;
  updateFarmCrop(
    scope: ResolvedScope,
    farmerId: string,
    farmCropId: string,
    body: UpdateFarmCropBody,
  ): Promise<FarmCropResponse>;
}

export function createAdminFarmerCropsService(
  deps: Partial<Pick<CropsServiceDeps, 'repo' | 'db' | 'runTx'>> = {},
): AdminFarmerCropsService {
  const repo = deps.repo ?? cropsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;

  return {
    async listFarmCrops(scope, farmerId, plotId, query) {
      await assertVisibleFarmer(db, scope, farmerId);
      return listFarmCropsForFarmer(repo, db, farmerId, plotId, query);
    },

    async createFarmCrop(scope, farmerId, plotId, body) {
      return runTx(async (tx) => {
        await assertVisibleFarmer(tx, scope, farmerId);
        const created = await createFarmCropForFarmer(repo, tx, farmerId, plotId, body, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.crops.admin_create',
          entityType: 'farm_crop',
          entityId: created.id,
          after: created,
        });
        return created;
      });
    },

    async updateFarmCrop(scope, farmerId, farmCropId, body) {
      return runTx(async (tx) => {
        await assertVisibleFarmer(tx, scope, farmerId);
        const { before, after } = await updateFarmCropForFarmer(repo, tx, farmerId, farmCropId, body);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.crops.admin_update',
          entityType: 'farm_crop',
          entityId: after.id,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return after;
      });
    },
  };
}

export const adminFarmerCropsService: AdminFarmerCropsService = createAdminFarmerCropsService();
