/**
 * Farm assets business logic.
 *
 * Two services live here, sharing one repo:
 *   - createFarmAssetsService       farmer-facing `/farmers/me/farm-assets*`
 *   - createFarmAssetsAdminService  admin read-only `/admin/farmers/:farmerId/farm-assets`
 *
 * OWNERSHIP. Every farmer-facing method resolves the owner from
 * `scope.farmerId` and nothing else — there is no client-supplied farmerId
 * anywhere in the request schemas. That holds even for a SUPER_ADMIN/
 * TOHFA_ADMIN whose rbac grant on `farmer.assets.*` is `all`: these are `/me`
 * endpoints, so "all" cannot mean "every farmer's assets" here — the same
 * doctrine crops.service.ts and farm-diary.service.ts document and test for
 * their own `/me` endpoints. A foreign `farmId` or `farm_assets` row is
 * NOT_FOUND, never 403 — a 403 would confirm the row exists for someone else.
 *
 * STATUS/DUE-NOTE. `status` (OK/DUE_SOON/OVERDUE) and `dueNote` ("12 days
 * overdue") are never stored (db/migrations/0025's header comment). They are
 * computed here, on every read, from the generated `next_service_due_on`
 * column vs "today" in Asia/Kolkata — the same timezone choice and day-count
 * arithmetic certifications.service.ts's getDaysToExpiry uses for certificate
 * expiry, because this is the same kind of "how many days until this date"
 * display problem. The DUE_SOON boundary is
 * `system_config.asset_service_due_soon_days` — a specification-gap
 * placeholder (see db/seed/001_reference.sql), read fresh via the repo, never
 * a literal in this file (root CLAUDE.md §2.7).
 */
import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { assertVisibleFarmer } from '../admin-farmers/admin-farmers.service.js';
import {
  farmAssetsRepo,
  type FarmAssetCursor,
  type FarmAssetRecord,
  type FarmAssetsRepo,
  type UpdateFarmAssetPatch,
} from './farm-assets.repo.js';
import type {
  CreateAdminFarmAssetBody,
  CreateFarmAssetBody,
  FarmAssetResponse,
  FarmAssetStatus,
  ListFarmAssetsQuery,
  ListFarmAssetsResponse,
  UpdateFarmAssetBody,
} from './farm-assets.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface FarmAssetsServiceDeps {
  repo: FarmAssetsRepo;
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

function farmAssetNotFound(assetId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No farm asset with id ${assetId} is visible to you.` });
}

function farmNotFound(farmId: string): AppError {
  return new AppError('NOT_FOUND', { detail: `No farm with id ${farmId} is visible to you.` });
}

/**
 * The list cursor is opaque base64url JSON of the last row's (createdAt, id),
 * the same shape crops'/farm-diary's own list cursors use.
 */
function encodeCursor(cursor: FarmAssetCursor): string {
  return Buffer.from(JSON.stringify([cursor.createdAt, cursor.id]), 'utf8').toString('base64url');
}

function decodeCursor(raw: string): FarmAssetCursor {
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
// status/dueNote — computed, never stored (see file header)
// ---------------------------------------------------------------------------

/**
 * Days from today (Asia/Kolkata) to `dateStr`; negative when `dateStr` is in
 * the past. Same timezone and arithmetic as
 * certifications.service.ts's getDaysToExpiry — this is the same "how many
 * days until this date" problem, applied to a service-due date instead of a
 * certificate expiry.
 */
export function daysUntil(dateStr: string): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayIst = formatter.format(new Date()); // YYYY-MM-DD

  const today = new Date(`${todayIst}T00:00:00Z`);
  const due = new Date(`${dateStr}T00:00:00Z`);

  const diffMs = due.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** "12 days overdue" / "Due today" / "5 days away" — mirrors the mock screens' own dueNote copy. */
function formatDueNote(days: number): string {
  if (days < 0) {
    const n = -days;
    return `${n} day${n === 1 ? '' : 's'} overdue`;
  }
  if (days === 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'} away`;
}

export function computeAssetStatus(
  nextServiceDueOn: string | null,
  dueSoonDays: number,
): { status: FarmAssetStatus; dueNote: string | null } {
  if (nextServiceDueOn === null) return { status: 'OK', dueNote: null };
  const days = daysUntil(nextServiceDueOn);
  const dueNote = formatDueNote(days);
  if (days < 0) return { status: 'OVERDUE', dueNote };
  if (days <= dueSoonDays) return { status: 'DUE_SOON', dueNote };
  return { status: 'OK', dueNote };
}

function toResponse(record: FarmAssetRecord, dueSoonDays: number): FarmAssetResponse {
  const { status, dueNote } = computeAssetStatus(record.nextServiceDueOn, dueSoonDays);
  return {
    id: record.id,
    farmId: record.farmId,
    category: record.category,
    name: record.name,
    makeModel: record.makeModel,
    fuelType: record.fuelType,
    coverageAreaAcres: record.coverageAreaAcres,
    purchasedOn: record.purchasedOn,
    costPaise: record.costPaise,
    serviceIntervalDays: record.serviceIntervalDays,
    lastServicedOn: record.lastServicedOn,
    nextServiceDueOn: record.nextServiceDueOn,
    status,
    dueNote,
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    createdByAdminId: record.createdByAdminId,
    createdByAdminName: record.createdByAdminName,
    addedOnBehalf: record.addedOnBehalf,
  };
}

// ---------------------------------------------------------------------------
// Farmer-facing service
// ---------------------------------------------------------------------------

export interface FarmAssetsService {
  createFarmAsset(scope: ResolvedScope, body: CreateFarmAssetBody): Promise<FarmAssetResponse>;
  listFarmAssets(scope: ResolvedScope, query: ListFarmAssetsQuery): Promise<ListFarmAssetsResponse>;
  getFarmAsset(scope: ResolvedScope, assetId: string): Promise<FarmAssetResponse>;
  updateFarmAsset(scope: ResolvedScope, assetId: string, body: UpdateFarmAssetBody): Promise<FarmAssetResponse>;
  deleteFarmAsset(scope: ResolvedScope, assetId: string): Promise<void>;
}

async function createAssetForFarmer(
  repo: FarmAssetsRepo,
  tx: Executor,
  farmerId: string,
  body: CreateFarmAssetBody,
  createdByAdminId: string | null = null,
): Promise<FarmAssetResponse> {
  const owned = await repo.isFarmOwnedByFarmer(tx, body.farmId, farmerId);
  if (!owned) throw farmNotFound(body.farmId);

  const assetId = await repo.createFarmAsset(tx, { ...body, createdByAdminId });
  const dueSoonDays = await repo.getAssetServiceDueSoonDays(tx);
  const created = await repo.findFarmAsset(tx, farmerId, assetId);
  if (created === null) throw farmAssetNotFound(assetId);
  return toResponse(created, dueSoonDays);
}

async function updateAssetForFarmer(
  repo: FarmAssetsRepo,
  tx: Executor,
  farmerId: string,
  assetId: string,
  body: UpdateFarmAssetBody,
): Promise<{ before: FarmAssetResponse; after: FarmAssetResponse }> {
  const existing = await repo.findFarmAsset(tx, farmerId, assetId);
  if (existing === null) throw farmAssetNotFound(assetId);

  const dueSoonDays = await repo.getAssetServiceDueSoonDays(tx);
  const before = toResponse(existing, dueSoonDays);

  const patch: UpdateFarmAssetPatch = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.makeModel !== undefined) patch.makeModel = body.makeModel;
  if (body.fuelType !== undefined) patch.fuelType = body.fuelType;
  if (body.coverageAreaAcres !== undefined) patch.coverageAreaAcres = body.coverageAreaAcres;
  if (body.purchasedOn !== undefined) patch.purchasedOn = body.purchasedOn;
  if (body.costPaise !== undefined) patch.costPaise = body.costPaise;
  if (body.serviceIntervalDays !== undefined) patch.serviceIntervalDays = body.serviceIntervalDays;
  if (body.lastServicedOn !== undefined) patch.lastServicedOn = body.lastServicedOn;
  if (body.notes !== undefined) patch.notes = body.notes;

  const updated = await repo.updateFarmAsset(tx, farmerId, assetId, patch);
  if (!updated) throw farmAssetNotFound(assetId);

  const afterRecord = await repo.findFarmAsset(tx, farmerId, assetId);
  if (afterRecord === null) throw farmAssetNotFound(assetId);
  return { before, after: toResponse(afterRecord, dueSoonDays) };
}

async function listAssetsForFarmer(
  repo: FarmAssetsRepo,
  db: Executor,
  farmerId: string,
  query: ListFarmAssetsQuery,
): Promise<ListFarmAssetsResponse> {
  const dueSoonDays = await repo.getAssetServiceDueSoonDays(db);
  const cursor = query.cursor !== undefined && query.cursor.length > 0 ? decodeCursor(query.cursor) : undefined;
  const { items, next } = await repo.listFarmAssets(db, {
    farmerId,
    category: query.category,
    dueWithinDays: query.dueOnly === true ? dueSoonDays : undefined,
    addedOnBehalf: query.addedOnBehalf,
    cursor,
    limit: query.limit,
  });
  return {
    items: items.map((item) => toResponse(item, dueSoonDays)),
    page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
  };
}

export function createFarmAssetsService(deps: Partial<FarmAssetsServiceDeps> = {}): FarmAssetsService {
  const repo = deps.repo ?? farmAssetsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;

  return {
    async createFarmAsset(scope, body) {
      const farmerId = ownFarmerId(scope);
      return runTx((tx) => createAssetForFarmer(repo, tx, farmerId, body, null));
    },

    async listFarmAssets(scope, query) {
      return listAssetsForFarmer(repo, db, ownFarmerId(scope), query);
    },

    async getFarmAsset(scope, assetId) {
      const farmerId = ownFarmerId(scope);
      const [asset, dueSoonDays] = await Promise.all([
        repo.findFarmAsset(db, farmerId, assetId),
        repo.getAssetServiceDueSoonDays(db),
      ]);
      if (asset === null) throw farmAssetNotFound(assetId);
      return toResponse(asset, dueSoonDays);
    },

    async updateFarmAsset(scope, assetId, body) {
      const farmerId = ownFarmerId(scope);
      return runTx(async (tx) => (await updateAssetForFarmer(repo, tx, farmerId, assetId, body)).after);
    },

    async deleteFarmAsset(scope, assetId) {
      const farmerId = ownFarmerId(scope);
      const deleted = await repo.softDeleteFarmAsset(db, farmerId, assetId);
      if (!deleted) throw farmAssetNotFound(assetId);
    },
  };
}

export const farmAssetsService: FarmAssetsService = createFarmAssetsService();

export interface FarmAssetsAdminService {
  listForFarmer(scope: ResolvedScope, farmerId: string, query: ListFarmAssetsQuery): Promise<ListFarmAssetsResponse>;
  createForFarmer(scope: ResolvedScope, farmerId: string, body: CreateAdminFarmAssetBody): Promise<FarmAssetResponse>;
  updateForFarmer(
    scope: ResolvedScope,
    farmerId: string,
    assetId: string,
    body: UpdateFarmAssetBody,
  ): Promise<FarmAssetResponse>;
  deleteForFarmer(scope: ResolvedScope, farmerId: string, assetId: string): Promise<void>;
}

export function createFarmAssetsAdminService(
  deps: Partial<Pick<FarmAssetsServiceDeps, 'repo' | 'db' | 'runTx'>> = {},
): FarmAssetsAdminService {
  const repo = deps.repo ?? farmAssetsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;

  return {
    async listForFarmer(_scope, farmerId, query) {
      return listAssetsForFarmer(repo, db, farmerId, query);
    },

    async createForFarmer(scope, farmerId, body) {
      return runTx(async (tx) => {
        await assertVisibleFarmer(tx, scope, farmerId);
        let farmId = body.farmId;
        if (farmId === undefined) {
          const primary = repo.findPrimaryFarmIdByFarmer
            ? await repo.findPrimaryFarmIdByFarmer(tx, farmerId)
            : null;
          if (primary === null) {
            throw new AppError('NOT_FOUND', { detail: `No farm registered for farmer ${farmerId}.` });
          }
          farmId = primary;
        }
        const created = await createAssetForFarmer(repo, tx, farmerId, { ...body, farmId }, scope.userId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.farm_assets.admin_create',
          entityType: 'farm_asset',
          entityId: created.id,
          after: created,
        });
        return created;
      });
    },

    async updateForFarmer(scope, farmerId, assetId, body) {
      return runTx(async (tx) => {
        await assertVisibleFarmer(tx, scope, farmerId);
        const { before, after } = await updateAssetForFarmer(repo, tx, farmerId, assetId, body);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.farm_assets.admin_update',
          entityType: 'farm_asset',
          entityId: assetId,
          before,
          after,
          changedFields: changedFields(before, after),
        });
        return after;
      });
    },

    async deleteForFarmer(scope, farmerId, assetId) {
      await runTx(async (tx) => {
        await assertVisibleFarmer(tx, scope, farmerId);
        const before = await repo.findFarmAsset(tx, farmerId, assetId);
        if (before === null) throw farmAssetNotFound(assetId);
        const deleted = await repo.softDeleteFarmAsset(tx, farmerId, assetId);
        if (!deleted) throw farmAssetNotFound(assetId);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.farm_assets.admin_delete',
          entityType: 'farm_asset',
          entityId: assetId,
          before,
        });
      });
    },
  };
}

export const farmAssetsAdminService: FarmAssetsAdminService = createFarmAssetsAdminService();
