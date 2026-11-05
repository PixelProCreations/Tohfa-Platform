import { api, ApiError } from '../../../shell/api/client';
import { t } from '../../../i18n/farmer';
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

/** The API's maximum page size (`LimitParam` in docs/openapi.yaml). */
const MAX_PAGE_SIZE = 100;

/**
 * Every own planting, following `nextCursor` page by page (BR-55g). A single
 * capped request would silently drop the farmer's 101st planting from the list.
 */
export async function listAllTreePlantings(signal?: AbortSignal): Promise<TreePlantingResponse[]> {
  const items: TreePlantingResponse[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = await listTreePlantings({ cursor, limit: MAX_PAGE_SIZE }, signal);
    items.push(...page.items);
    // A repeated cursor would loop forever; stop rather than hang the screen.
    if (!page.page.hasMore || !page.page.nextCursor || page.page.nextCursor === cursor) return items;
    cursor = page.page.nextCursor;
  }
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
 * POST /farmers/me/tree-plantings (BR-55, BR-55h)
 * Creates a new tree planting record. Validates treeCount > 0 and plantedOn <= today.
 * The optional Idempotency-Key makes a retried POST create one planting; the same
 * key with a different body is 409 IDEMPOTENCY_KEY_REUSED.
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

/**
 * The badge values the Trees list can show. The API has no status, growth
 * stage or care-schedule field, so `toTreePlantingItem` never derives one: a
 * planting's status is `null` (no badge) until the API supplies a real value.
 * Guessing "Young" from age, or "Fruit-bearing" from words in the free-text
 * purpose, would show the farmer a fact about their own trees that nobody
 * recorded.
 */
export type TreeStatus = 'Mature' | 'Young' | 'Fruit-bearing';

export interface TreePlantingItem {
  id: string;
  name: string;
  species?: string | undefined;
  treeCount?: number | undefined;
  plantedDate: string;
  zoneInfo?: string | undefined;
  status: TreeStatus | null;
  hasPruningAlert?: boolean | undefined;
  alertText?: string | undefined;
  ageText?: string | undefined;
  purposeText?: string | undefined;
  isFruitBearing?: boolean | undefined;
}

/**
 * `plantedOn` (`YYYY-MM-DD`) → a local `Date` at midnight, or `null`.
 *
 * Built from the date parts rather than `new Date('YYYY-MM-DD')`, which parses
 * as UTC midnight; also rejects non-calendar dates such as 2026-02-30 that
 * `Date` would silently roll over into March (BR-55b).
 */
export function parsePlantedOn(plantedOn: string | null | undefined): Date | null {
  if (!plantedOn) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(plantedOn);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/**
 * Age since `planted`, in whole calendar years, else months, else days — a
 * plain fact derived from the recorded planting date. `undefined` for a date in
 * the future (the API rejects those, BR-55b, so it can only be clock skew).
 */
function ageTextSince(planted: Date, now: Date): string | undefined {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (planted.getTime() > today.getTime()) return undefined;

  let months =
    (today.getFullYear() - planted.getFullYear()) * 12 + (today.getMonth() - planted.getMonth());
  if (today.getDate() < planted.getDate()) months -= 1;
  const years = Math.floor(months / 12);

  if (years >= 1) {
    return t(years === 1 ? 'farmer.trees.age.years.one' : 'farmer.trees.age.years', { count: years });
  }
  if (months >= 1) {
    return t(months === 1 ? 'farmer.trees.age.months.one' : 'farmer.trees.age.months', { count: months });
  }
  const days = Math.round((today.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  return t(days === 1 ? 'farmer.trees.age.days.one' : 'farmer.trees.age.days', { count: days });
}

/**
 * API record → Trees list card. Only real fields are shown; nothing is
 * inferred (see `TreeStatus`). `now` is injectable so tests can pin it.
 */
export function toTreePlantingItem(tree: TreePlantingResponse, now: Date = new Date()): TreePlantingItem {
  const planted = parsePlantedOn(tree.plantedOn);
  return {
    id: tree.id,
    name: t(tree.treeCount === 1 ? 'farmer.trees.nameWithCount.one' : 'farmer.trees.nameWithCount.other', {
      species: tree.speciesName,
      count: tree.treeCount,
    }),
    species: tree.speciesName,
    treeCount: tree.treeCount,
    plantedDate: planted
      ? t('farmer.trees.plantedOn', { date: formatSafeDate(planted) })
      : t('farmer.trees.plantedDateUnknown'),
    zoneInfo: tree.zoneName || undefined,
    status: null,
    ageText: planted ? ageTextSince(planted, now) : undefined,
    purposeText: tree.purpose || undefined,
  };
}
