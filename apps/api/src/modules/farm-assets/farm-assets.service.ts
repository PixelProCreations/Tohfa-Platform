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
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  farmAssetsRepo,
  type FarmAssetCursor,
  type FarmAssetRecord,
  type FarmAssetsRepo,
  type UpdateFarmAssetPatch,
} from './farm-assets.repo.js';
import type {
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

export function createFarmAssetsService(deps: Partial<FarmAssetsServiceDeps> = {}): FarmAssetsService {
  const repo = deps.repo ?? farmAssetsRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? withTransaction;

  return {
    async createFarmAsset(scope, body) {
      const farmerId = ownFarmerId(scope);

      return runTx(async (tx) => {
        // Ownership is re-derived from farms.farmer_id. A farm that is not
        // the caller's is NOT_FOUND, not 403 (root CLAUDE.md §2.1).
        const owned = await repo.isFarmOwnedByFarmer(tx, body.farmId, farmerId);
        if (!owned) throw farmNotFound(body.farmId);

        const assetId = await repo.createFarmAsset(tx, body);

        const dueSoonDays = await repo.getAssetServiceDueSoonDays(tx);
        const created = await repo.findFarmAsset(tx, farmerId, assetId);
        if (created === null) throw farmAssetNotFound(assetId);
        return toResponse(created, dueSoonDays);
      });
    },

    async listFarmAssets(scope, query) {
      const farmerId = ownFarmerId(scope);
      const dueSoonDays = await repo.getAssetServiceDueSoonDays(db);

      const cursor = query.cursor !== undefined && query.cursor.length > 0 ? decodeCursor(query.cursor) : undefined;
      const { items, next } = await repo.listFarmAssets(db, {
        farmerId,
        category: query.category,
        // dueOnly reuses the SAME threshold the response's `status` field is
        // computed with, so a row marked DUE_SOON/OVERDUE in the payload is
        // always included when the caller asked for dueOnly=true.
        dueWithinDays: query.dueOnly === true ? dueSoonDays : undefined,
        cursor,
        limit: query.limit,
      });
      return {
        items: items.map((item) => toResponse(item, dueSoonDays)),
        page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
      };
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

      return runTx(async (tx) => {
        // Existence/ownership first, so a foreign asset is NOT_FOUND before
        // any other error could hint that it exists.
        const existing = await repo.findFarmAsset(tx, farmerId, assetId);
        if (existing === null) throw farmAssetNotFound(assetId);

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

        const dueSoonDays = await repo.getAssetServiceDueSoonDays(tx);
        const after = await repo.findFarmAsset(tx, farmerId, assetId);
        if (after === null) throw farmAssetNotFound(assetId);
        return toResponse(after, dueSoonDays);
      });
    },

    async deleteFarmAsset(scope, assetId) {
      const farmerId = ownFarmerId(scope);
      const deleted = await repo.softDeleteFarmAsset(db, farmerId, assetId);
      if (!deleted) throw farmAssetNotFound(assetId);
    },
  };
}

export const farmAssetsService: FarmAssetsService = createFarmAssetsService();

// ---------------------------------------------------------------------------
// Admin service — read-only, `/admin/farmers/{farmerId}/farm-assets`
// (`admin.assets.view_all`, scope `all`). Reuses the SAME repo.listFarmAssets
// as the farmer-facing service: the query is already "every farm_assets row
// across this farmerId's farms", which is exactly what an admin viewing one
// farmer's register needs — there is no separate SQL path to maintain.
// ---------------------------------------------------------------------------

export interface FarmAssetsAdminService {
  listForFarmer(scope: ResolvedScope, farmerId: string, query: ListFarmAssetsQuery): Promise<ListFarmAssetsResponse>;
}

export function createFarmAssetsAdminService(
  deps: Partial<Pick<FarmAssetsServiceDeps, 'repo' | 'db'>> = {},
): FarmAssetsAdminService {
  const repo = deps.repo ?? farmAssetsRepo;
  const db = deps.db ?? pool;

  return {
    async listForFarmer(_scope, farmerId, query) {
      const dueSoonDays = await repo.getAssetServiceDueSoonDays(db);
      const cursor = query.cursor !== undefined && query.cursor.length > 0 ? decodeCursor(query.cursor) : undefined;
      const { items, next } = await repo.listFarmAssets(db, {
        farmerId,
        category: query.category,
        dueWithinDays: query.dueOnly === true ? dueSoonDays : undefined,
        cursor,
        limit: query.limit,
      });
      return {
        items: items.map((item) => toResponse(item, dueSoonDays)),
        page: { nextCursor: next === null ? null : encodeCursor(next), hasMore: next !== null },
      };
    },
  };
}

export const farmAssetsAdminService: FarmAssetsAdminService = createFarmAssetsAdminService();
