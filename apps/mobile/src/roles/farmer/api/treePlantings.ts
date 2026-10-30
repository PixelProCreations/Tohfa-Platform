import { api, ApiError } from '../../../shell/api/client';
import { formatSafeDate } from '../polyfills';

export { ApiError };

// ---------------------------------------------------------------------------
// Tree & Perennial Plantings (BR-55)
// ---------------------------------------------------------------------------

export interface TreePlantingResponse {
  id: string;
  farmerId: string;
  farmId: string | null;
  plotId: string | null;
  speciesName: string;
  treeCount: number;
  plantedOn: string | null;
  zoneName: string | null;
  purpose: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListTreePlantingsQuery {
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListTreePlantingsResponse {
  items: TreePlantingResponse[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface CreateTreePlantingRequest {
  farmId?: string | undefined;
  plotId?: string | undefined;
  speciesName: string;
  treeCount: number;
  plantedOn?: string | undefined;
  zoneName?: string | undefined;
  purpose?: string | undefined;
  notes?: string | undefined;
}

export interface UpdateTreePlantingRequest {
  farmId?: string | null | undefined;
  plotId?: string | null | undefined;
  speciesName?: string | undefined;
  treeCount?: number | undefined;
  plantedOn?: string | null | undefined;
  zoneName?: string | null | undefined;
  purpose?: string | null | undefined;
  notes?: string | null | undefined;
}

/**
 * GET /farmers/me/tree-plantings (BR-55)
 * Returns paginated tree and perennial planting records for the authenticated farmer.
 */
export async function listTreePlantings(
  query: ListTreePlantingsQuery = {},
  signal?: AbortSignal,
): Promise<ListTreePlantingsResponse> {
  const params = new URLSearchParams();
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', String(query.limit));
  const qs = params.toString();
  const path = `/farmers/me/tree-plantings${qs ? `?${qs}` : ''}`;
  return api.get<ListTreePlantingsResponse>(path, signal);
}

/**
 * GET /farmers/me/tree-plantings/:id (BR-55)
 * Retrieves details of an own tree planting by ID.
 */
export async function getTreePlanting(
  id: string,
  signal?: AbortSignal,
): Promise<TreePlantingResponse> {
  return api.get<TreePlantingResponse>(`/farmers/me/tree-plantings/${id}`, signal);
}

/**
 * POST /farmers/me/tree-plantings (BR-55)
 * Creates a new tree planting record. Validates treeCount > 0 and plantedOn <= today.
 */
export async function createTreePlanting(
  body: CreateTreePlantingRequest,
  idempotencyKey?: string,
): Promise<TreePlantingResponse> {
  return api.post<TreePlantingResponse>(
    '/farmers/me/tree-plantings',
    body,
    idempotencyKey,
  );
}

/**
 * PATCH /farmers/me/tree-plantings/:id (BR-55)
 * Updates fields of an own tree planting record.
 */
export async function updateTreePlanting(
  id: string,
  body: UpdateTreePlantingRequest,
): Promise<TreePlantingResponse> {
  return api.patch<TreePlantingResponse>(`/farmers/me/tree-plantings/${id}`, body);
}

/**
 * DELETE /farmers/me/tree-plantings/:id (BR-55d)
 * Soft-deletes a tree planting record.
 */
export async function deleteTreePlanting(id: string): Promise<void> {
  return api.delete<void>(`/farmers/me/tree-plantings/${id}`);
}

// ---------------------------------------------------------------------------
// UI Mapping Helpers
// ---------------------------------------------------------------------------

export type TreeStatus = 'Mature' | 'Young' | 'Fruit-bearing';

export interface TreePlantingItem {
  id: string;
  name: string;
  species?: string | undefined;
  treeCount?: number | undefined;
  plantedDate: string;
  zoneInfo: string;
  status: TreeStatus;
  hasPruningAlert?: boolean | undefined;
  alertText?: string | undefined;
  ageText?: string | undefined;
  purposeText?: string | undefined;
  isFruitBearing?: boolean | undefined;
}

export function toTreePlantingItem(tree: TreePlantingResponse): TreePlantingItem {
  const purposeLower = (tree.purpose ?? '').toLowerCase();
  const isFruitBearing =
    purposeLower.includes('fruit') ||
    purposeLower.includes('yield') ||
    purposeLower.includes('harvest');

  let ageText: string | undefined;
  let isYoung = false;
  if (tree.plantedOn) {
    const plantedMs = new Date(tree.plantedOn).getTime();
    if (!Number.isNaN(plantedMs)) {
      const diffDays = Math.max(0, Math.floor((Date.now() - plantedMs) / (1000 * 60 * 60 * 24)));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor(diffDays / 30);
      if (years >= 1) {
        ageText = `≈ ${years} ${years === 1 ? 'year' : 'years'} old`;
      } else if (months >= 1) {
        ageText = `≈ ${months} ${months === 1 ? 'month' : 'months'} old`;
      } else {
        ageText = `≈ ${diffDays} ${diffDays === 1 ? 'day' : 'days'} old`;
      }
      if (years < 2) {
        isYoung = true;
      }
    }
  }

  let status: TreeStatus = 'Mature';
  if (isFruitBearing) {
    status = 'Fruit-bearing';
  } else if (isYoung) {
    status = 'Young';
  }

  return {
    id: tree.id,
    name: `${tree.speciesName} (${tree.treeCount} ${tree.treeCount === 1 ? 'tree' : 'trees'})`,
    species: tree.speciesName,
    treeCount: tree.treeCount,
    plantedDate: tree.plantedOn ? `Planted ${formatSafeDate(tree.plantedOn)}` : 'Planting date not recorded',
    zoneInfo: tree.zoneName || 'Farm zone',
    status,
    ageText,
    purposeText: tree.purpose ?? undefined,
    isFruitBearing,
    hasPruningAlert: status === 'Young',
    alertText: status === 'Young' ? 'Pruning check recommended' : undefined,
  };
}

