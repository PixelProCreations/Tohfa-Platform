import { api } from '../../../shell/api/client';

// ---------------------------------------------------------------------------
// Enums — mirror apps/api/src/modules/livestock/livestock.schema.ts exactly.
// ---------------------------------------------------------------------------

export const animalSpecies = ['CATTLE', 'BUFFALO', 'GOAT', 'POULTRY', 'SHEEP'] as const;
export type AnimalSpecies = (typeof animalSpecies)[number];

export const animalGenders = ['FEMALE', 'MALE'] as const;
export type AnimalGender = (typeof animalGenders)[number];

export const animalSources = ['BORN_ON_FARM', 'PURCHASED'] as const;
export type AnimalSource = (typeof animalSources)[number];

export const organicStatuses = ['ORGANIC', 'TRANSITIONING', 'CONVENTIONAL'] as const;
export type OrganicStatus = (typeof organicStatuses)[number];

/** `ACTIVE` is the only status returned by a default (unfiltered) `listAnimals`
 *  call; the rest are terminal, each set exactly once by a lifecycle event. */
export const lifecycleStatuses = ['ACTIVE', 'SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED'] as const;
export type LifecycleStatus = (typeof lifecycleStatuses)[number];

/** The same four non-ACTIVE values as `lifecycleStatuses` — recording an
 *  event sets the animal's `lifecycleStatus` to match (BR-47b). */
export const lifecycleEventTypes = ['SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED'] as const;
export type LifecycleEventType = (typeof lifecycleEventTypes)[number];

export const dairyProductTypes = [
  'MILK',
  'CURD',
  'PANEER',
  'BUTTER',
  'GHEE',
  'BUTTERMILK',
  'CHEESE',
  'EGGS',
] as const;
export type DairyProductType = (typeof dairyProductTypes)[number];

export const productionUnits = ['LITERS', 'KG', 'COUNT'] as const;
export type ProductionUnit = (typeof productionUnits)[number];

/**
 * Each product type always logs in exactly one unit — the server cross-checks
 * `unit` against this same map (`VALIDATION_FAILED` on a mismatch, see
 * livestock.schema.ts's `createProductionLogBody`). Exported so
 * DairyProduceScreen's own `DAIRY_PRODUCTS` catalog can send the unit the
 * server actually expects instead of guessing.
 */
export const DAIRY_PRODUCT_UNITS: Record<DairyProductType, ProductionUnit> = {
  MILK: 'LITERS',
  CURD: 'KG',
  PANEER: 'KG',
  BUTTER: 'KG',
  GHEE: 'LITERS',
  BUTTERMILK: 'LITERS',
  CHEESE: 'KG',
  EGGS: 'COUNT',
};

// ---------------------------------------------------------------------------
// livestock_animals — create / update
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/livestock/animals
 *
 * There is deliberately no `farmId`/`lifecycleStatus` field: an animal
 * belongs to the farmer's operation as a whole (root CLAUDE.md's farm-land-
 * locations doctrine), and a new animal always starts `ACTIVE` — moving off
 * it only ever happens via `recordLifecycleEvent` (BR-47).
 */
export interface CreateAnimalBody {
  tag: string;
  name?: string;
  species: AnimalSpecies;
  breed?: string;
  gender: AnimalGender;
  dateOfBirth?: string;
  source?: AnimalSource;
  purchasedOn?: string;
  sourceFarm?: string;
  organicStatus?: OrganicStatus;
  withdrawalUntil?: string;
  notes?: string;
}

/**
 * PATCH /farmers/me/livestock/animals/:animalId
 *
 * `lifecycleStatus` is NOT editable here — it only ever changes as the side
 * effect of `recordLifecycleEvent` (BR-47). Nullable fields accept `null` to
 * clear them.
 */
export interface UpdateAnimalBody {
  tag?: string;
  name?: string | null;
  species?: AnimalSpecies;
  breed?: string | null;
  gender?: AnimalGender;
  dateOfBirth?: string | null;
  source?: AnimalSource;
  purchasedOn?: string | null;
  sourceFarm?: string | null;
  organicStatus?: OrganicStatus;
  withdrawalUntil?: string | null;
  notes?: string | null;
}

/** GET /farmers/me/livestock/animals — cursor pagination, same envelope as crops. */
export interface ListAnimalsQuery {
  species?: AnimalSpecies;
  /** Omitted defaults to `ACTIVE` only — an animal that has left the herd
   *  drops off the default list. Pass explicitly to see history. */
  lifecycleStatus?: LifecycleStatus;
  cursor?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// livestock_lifecycle_events
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/livestock/animals/:animalId/lifecycle-events
 *
 * `salePricePaise` is integer paise, never a float (root CLAUDE.md §2.2) —
 * build it with `toPaise(parseMoney(input))`, never `parseFloat(input) * 100`.
 * `eventDate` defaults to today when omitted.
 */
export interface RecordLifecycleEventBody {
  eventType: LifecycleEventType;
  eventDate?: string;
  counterparty?: string;
  salePricePaise?: number;
  reason?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// livestock_production_logs — create
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/livestock/production-logs
 *
 * Covers all three of DairyProduceScreen's logging shapes: per-animal milk
 * yield (`animalId` + `sessions`), value-added produce batches (`batchInfo`),
 * and flock-level egg collection (`animalId` omitted, `productType: 'EGGS'`).
 * `unit` must match `productType`'s fixed unit in `DAIRY_PRODUCT_UNITS`.
 */
export interface CreateProductionLogBody {
  animalId?: string;
  productType: DairyProductType;
  quantity: number;
  unit: ProductionUnit;
  loggedOn?: string;
  batchInfo?: string;
  sessions?: number;
  notes?: string;
}

/** GET /farmers/me/livestock/production-logs */
export interface ListProductionLogsQuery {
  productType?: DairyProductType;
  animalId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/**
 * Allow-list, not a raw table dump: `farm_id`/`farmerId` never appear here —
 * the caller already knows it is asking about its own herd.
 */
export interface AnimalResponse {
  id: string;
  tag: string;
  name: string | null;
  species: AnimalSpecies;
  breed: string | null;
  gender: AnimalGender;
  dateOfBirth: string | null;
  source: AnimalSource;
  purchasedOn: string | null;
  sourceFarm: string | null;
  organicStatus: OrganicStatus;
  lifecycleStatus: LifecycleStatus;
  withdrawalUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListAnimalsResult {
  items: AnimalResponse[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface ProductionLogResponse {
  id: string;
  animalId: string | null;
  productType: DairyProductType;
  quantity: number;
  unit: ProductionUnit;
  loggedOn: string;
  batchInfo: string | null;
  sessions: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListProductionLogsResult {
  items: ProductionLogResponse[];
  page: { nextCursor: string | null; hasMore: boolean };
}

// ---------------------------------------------------------------------------
// livestock_animals
// ---------------------------------------------------------------------------

export async function listAnimals(
  query: ListAnimalsQuery = {},
  signal?: AbortSignal,
): Promise<ListAnimalsResult> {
  const params = new URLSearchParams();
  if (query.species !== undefined) params.append('species', query.species);
  if (query.lifecycleStatus !== undefined) params.append('lifecycleStatus', query.lifecycleStatus);
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  const path = `/farmers/me/livestock/animals${queryStr ? `?${queryStr}` : ''}`;
  return api.get<ListAnimalsResult>(path, signal);
}

export async function getAnimal(animalId: string, signal?: AbortSignal): Promise<AnimalResponse> {
  return api.get<AnimalResponse>(`/farmers/me/livestock/animals/${animalId}`, signal);
}

export async function createAnimal(input: CreateAnimalBody): Promise<AnimalResponse> {
  return api.post<AnimalResponse>('/farmers/me/livestock/animals', input);
}

export async function updateAnimal(
  animalId: string,
  input: UpdateAnimalBody,
): Promise<AnimalResponse> {
  return api.patch<AnimalResponse>(`/farmers/me/livestock/animals/${animalId}`, input);
}

// ---------------------------------------------------------------------------
// livestock_lifecycle_events
// ---------------------------------------------------------------------------

export async function recordLifecycleEvent(
  animalId: string,
  input: RecordLifecycleEventBody,
): Promise<AnimalResponse> {
  return api.post<AnimalResponse>(
    `/farmers/me/livestock/animals/${animalId}/lifecycle-events`,
    input,
  );
}

// ---------------------------------------------------------------------------
// livestock_production_logs
// ---------------------------------------------------------------------------

export async function listProductionLogs(
  query: ListProductionLogsQuery = {},
  signal?: AbortSignal,
): Promise<ListProductionLogsResult> {
  const params = new URLSearchParams();
  if (query.productType !== undefined) params.append('productType', query.productType);
  if (query.animalId !== undefined) params.append('animalId', query.animalId);
  if (query.dateFrom !== undefined) params.append('dateFrom', query.dateFrom);
  if (query.dateTo !== undefined) params.append('dateTo', query.dateTo);
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  const path = `/farmers/me/livestock/production-logs${queryStr ? `?${queryStr}` : ''}`;
  return api.get<ListProductionLogsResult>(path, signal);
}

export async function createProductionLog(
  input: CreateProductionLogBody,
): Promise<ProductionLogResponse> {
  return api.post<ProductionLogResponse>('/farmers/me/livestock/production-logs', input);
}
