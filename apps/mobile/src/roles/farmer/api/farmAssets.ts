import { api } from '../../../shell/api/client';

// ---------------------------------------------------------------------------
// Enums — mirror apps/api/src/modules/farm-assets/farm-assets.schema.ts exactly.
// ---------------------------------------------------------------------------

export const farmAssetCategories = ['TOOL', 'EQUIPMENT', 'MACHINERY'] as const;
export type FarmAssetCategory = (typeof farmAssetCategories)[number];

/**
 * Display-only, computed server-side at read time from `nextServiceDueOn` vs
 * "today" — never sent back on create/update. See farm-assets.schema.ts.
 */
export const farmAssetStatuses = ['OK', 'DUE_SOON', 'OVERDUE'] as const;
export type FarmAssetStatus = (typeof farmAssetStatuses)[number];

// ---------------------------------------------------------------------------
// farm_assets — create / update
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/farm-assets
 *
 * There is deliberately no `farmerId` field: ownership is derived
 * server-side from `farms.farmer_id`. `farmId` DOES travel in the body
 * (this module has no `/farms/{farmId}/...` nesting, unlike crops' plots) —
 * the farm it names must be one of the caller's own (checked server-side).
 *
 * `serviceIntervalDays` is required, matching every Add screen's own
 * required-asterisk on "Service interval (days)".
 */
export interface CreateFarmAssetBody {
  farmId: string;
  category: FarmAssetCategory;
  name: string;
  makeModel?: string;
  fuelType?: string;
  coverageAreaAcres?: number;
  purchasedOn?: string;
  /** Integer paise (root CLAUDE.md §2.2) — use toPaise()/parseMoney(), never raw `* 100`. */
  costPaise?: number;
  serviceIntervalDays: number;
  lastServicedOn?: string;
  notes?: string;
}

/**
 * PATCH /farmers/me/farm-assets/{assetId}
 *
 * `farmId`/`category` are not editable — re-pointing an asset at a
 * different land location or re-categorising it is a delete-and-recreate,
 * not an edit. Nullable fields accept `null` to clear them.
 */
export interface UpdateFarmAssetBody {
  name?: string;
  makeModel?: string | null;
  fuelType?: string | null;
  coverageAreaAcres?: number | null;
  purchasedOn?: string | null;
  costPaise?: number | null;
  serviceIntervalDays?: number | null;
  lastServicedOn?: string | null;
  notes?: string | null;
}

/** GET /farmers/me/farm-assets — cursor pagination, same envelope as crops/farm-diary. */
export interface ListFarmAssetsQuery {
  category?: FarmAssetCategory;
  /** true returns DUE_SOON and OVERDUE only, never just OVERDUE alone. */
  dueOnly?: boolean;
  cursor?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export interface FarmAssetResponse {
  id: string;
  farmId: string;
  category: FarmAssetCategory;
  name: string;
  makeModel: string | null;
  fuelType: string | null;
  coverageAreaAcres: number | null;
  purchasedOn: string | null;
  /** Integer paise (root CLAUDE.md §2.2) — use fromPaise()/format() to render, never raw division. */
  costPaise: number | null;
  serviceIntervalDays: number | null;
  lastServicedOn: string | null;
  nextServiceDueOn: string | null;
  /** Computed at read time from nextServiceDueOn vs today — never sent on create/update. */
  status: FarmAssetStatus;
  /** e.g. "12 days overdue" / "5 days away". Computed, never sent on create/update. Null when nextServiceDueOn is null. */
  dueNote: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListFarmAssetsResult {
  items: FarmAssetResponse[];
  page: { nextCursor: string | null; hasMore: boolean };
}

// ---------------------------------------------------------------------------
// farm_assets
// ---------------------------------------------------------------------------

export async function listFarmAssets(
  query: ListFarmAssetsQuery = {},
  signal?: AbortSignal,
): Promise<ListFarmAssetsResult> {
  const params = new URLSearchParams();
  if (query.category !== undefined) params.append('category', query.category);
  if (query.dueOnly !== undefined) params.append('dueOnly', query.dueOnly ? 'true' : 'false');
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  const path = `/farmers/me/farm-assets${queryStr ? `?${queryStr}` : ''}`;
  return api.get<ListFarmAssetsResult>(path, signal);
}

export async function getFarmAsset(
  assetId: string,
  signal?: AbortSignal,
): Promise<FarmAssetResponse> {
  return api.get<FarmAssetResponse>(`/farmers/me/farm-assets/${assetId}`, signal);
}

export async function createFarmAsset(input: CreateFarmAssetBody): Promise<FarmAssetResponse> {
  return api.post<FarmAssetResponse>('/farmers/me/farm-assets', input);
}

export async function updateFarmAsset(
  assetId: string,
  input: UpdateFarmAssetBody,
): Promise<FarmAssetResponse> {
  return api.patch<FarmAssetResponse>(`/farmers/me/farm-assets/${assetId}`, input);
}

/** Soft delete (deleted_at) — e.g. a broken tool being retired. */
export async function deleteFarmAsset(assetId: string): Promise<void> {
  await api.delete<void>(`/farmers/me/farm-assets/${assetId}`);
}
