import { api } from '../../../shell/api/client';
import { listDiaryPlots, type DiaryPlot } from './farmDiary';

// ---------------------------------------------------------------------------
// Enums — mirror apps/api/src/modules/crops/crops.schema.ts exactly.
// ---------------------------------------------------------------------------

export type FarmCropStatus = 'PLANNED' | 'GROWING' | 'HARVESTED' | 'FAILED';
export type SeedQuantityUnit = 'grams' | 'kg' | 'packets' | 'units';
export type ExpectedGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C';

// ---------------------------------------------------------------------------
// farm_crops — create / update
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/plots/:plotId/crops
 *
 * There is deliberately no `farmerId`/`plotId`/`status` field: ownership is
 * derived server-side, `plotId` travels in the URL, and a new planting always
 * starts `PLANNED` (BR-46's test contract) — the server rejects any attempt
 * to set status at creation via `.strict()`.
 */
export interface CreateFarmCropBody {
  cropMasterId: string;
  plantedOn?: string;
  expectedHarvestOn?: string;
  expectedYieldKg?: number;
  seedVariety?: string;
  seedCompany?: string;
  seedQuantity?: number;
  seedQuantityUnit?: SeedQuantityUnit;
  seedCostPaise?: number;
  expectedGrade?: ExpectedGrade;
  notes?: string;
}

/**
 * PATCH /farmers/me/crops/:farmCropId
 *
 * `plotId`/`cropMasterId` are not editable — see crops.schema.ts's
 * updateFarmCropBody docblock. `status` drives BR-46 (moving into `GROWING`
 * is re-checked against the plot's other live crops server-side);
 * `actualHarvestOn`/`actualYieldKg` record a real harvest. Nullable fields
 * accept `null` to clear them.
 */
export interface UpdateFarmCropBody {
  status?: FarmCropStatus;
  plantedOn?: string | null;
  expectedHarvestOn?: string | null;
  actualHarvestOn?: string | null;
  expectedYieldKg?: number | null;
  actualYieldKg?: number | null;
  seedVariety?: string | null;
  seedCompany?: string | null;
  seedQuantity?: number | null;
  seedQuantityUnit?: SeedQuantityUnit | null;
  seedCostPaise?: number | null;
  expectedGrade?: ExpectedGrade | null;
  notes?: string | null;
}

/** GET /farmers/me/plots/:plotId/crops — cursor pagination, same envelope as farm-diary. */
export interface ListFarmCropsQuery {
  status?: FarmCropStatus;
  cursor?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/**
 * A farm_crops row plus the crop_master fields the mobile crop screens render
 * for display (cropName/cropNameTa/cropIconKey) — never crop_master's
 * hsnCode or its internal categoryId (allow-list, same doctrine as BR-16).
 */
export interface FarmCropResponse {
  id: string;
  plotId: string;
  cropMasterId: string;
  cropName: string;
  cropNameTa: string | null;
  cropIconKey: string | null;
  status: FarmCropStatus;
  plantedOn: string | null;
  expectedHarvestOn: string | null;
  actualHarvestOn: string | null;
  expectedYieldKg: number | null;
  actualYieldKg: number | null;
  seedVariety: string | null;
  seedCompany: string | null;
  seedQuantity: number | null;
  seedQuantityUnit: SeedQuantityUnit | null;
  /** Integer paise (root CLAUDE.md §2.2) — use fromPaise()/format() to render, never raw division. */
  seedCostPaise: number | null;
  expectedGrade: ExpectedGrade | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListFarmCropsResult {
  items: FarmCropResponse[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface CropMasterResponse {
  id: string;
  slug: string;
  name: string;
  nameTa: string | null;
  categoryId: string;
  botanicalName: string | null;
  defaultUnit: string;
  seasonMonths: number[] | null;
  shelfLifeDays: number | null;
  iconKey: string | null;
  isActive: boolean;
}

/**
 * GET /farmers/me/plots/:plotId/crop-rotation — most-recent-first, for
 * CropRotationScreen.tsx's zone rotation timeline ("Now" / "Next" / "Then").
 */
export interface PlotRotationHistoryEntry {
  farmCropId: string;
  cropName: string;
  cropIconKey: string | null;
  plantedOn: string | null;
  actualHarvestOn: string | null;
  status: FarmCropStatus;
}

export interface PlotRotationHistoryResponse {
  plotId: string;
  history: PlotRotationHistoryEntry[];
}

// ---------------------------------------------------------------------------
// farm_crops
// ---------------------------------------------------------------------------

export async function listFarmCrops(
  plotId: string,
  query: ListFarmCropsQuery = {},
  signal?: AbortSignal,
): Promise<ListFarmCropsResult> {
  const params = new URLSearchParams();
  if (query.status !== undefined) params.append('status', query.status);
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  const path = `/farmers/me/plots/${plotId}/crops${queryStr ? `?${queryStr}` : ''}`;
  return api.get<ListFarmCropsResult>(path, signal);
}

export async function getFarmCrop(
  farmCropId: string,
  signal?: AbortSignal,
): Promise<FarmCropResponse> {
  return api.get<FarmCropResponse>(`/farmers/me/crops/${farmCropId}`, signal);
}

export async function createFarmCrop(
  plotId: string,
  input: CreateFarmCropBody,
): Promise<FarmCropResponse> {
  return api.post<FarmCropResponse>(`/farmers/me/plots/${plotId}/crops`, input);
}

export async function updateFarmCrop(
  farmCropId: string,
  input: UpdateFarmCropBody,
): Promise<FarmCropResponse> {
  return api.patch<FarmCropResponse>(`/farmers/me/crops/${farmCropId}`, input);
}

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

export async function listCropMaster(signal?: AbortSignal): Promise<CropMasterResponse[]> {
  const { items } = await api.get<{ items: CropMasterResponse[] }>(
    '/farmers/me/crop-master',
    signal,
  );
  return items;
}

// ---------------------------------------------------------------------------
// Rotation history
// ---------------------------------------------------------------------------

export async function getPlotRotationHistory(
  plotId: string,
  signal?: AbortSignal,
): Promise<PlotRotationHistoryResponse> {
  return api.get<PlotRotationHistoryResponse>(`/farmers/me/plots/${plotId}/crop-rotation`, signal);
}

// ---------------------------------------------------------------------------
// Farm-wide active crops
// ---------------------------------------------------------------------------

/** The statuses that make a planting "active": in the ground, or planned for a plot. */
export const ACTIVE_FARM_CROP_STATUSES: readonly FarmCropStatus[] = ['GROWING', 'PLANNED'];

/**
 * A guard against a server bug looping the cursor, not a business limit:
 * BR-46 allows one GROWING crop per plot, so a real plot has a handful of
 * active rows. If it is ever hit, the result says so (`complete: false`).
 */
const MAX_CROP_PAGES = 20;
const CROP_PAGE_SIZE = 100; // LimitParam maximum in docs/openapi.yaml

export interface PlotFarmCrop {
  plot: DiaryPlot;
  crop: FarmCropResponse;
}

export interface ActiveFarmCropsResult {
  plots: DiaryPlot[];
  /** Every active crop across every plot, once each. */
  items: PlotFarmCrop[];
  /** False only when a plot's cursor had to be abandoned at MAX_CROP_PAGES. */
  complete: boolean;
}

async function listAllFarmCropsWithStatus(
  plotId: string,
  status: FarmCropStatus,
  signal?: AbortSignal,
): Promise<{ items: FarmCropResponse[]; complete: boolean }> {
  const items: FarmCropResponse[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < MAX_CROP_PAGES; i += 1) {
    const page = await listFarmCrops(
      plotId,
      { status, limit: CROP_PAGE_SIZE, ...(cursor === undefined ? {} : { cursor }) },
      signal,
    );
    items.push(...page.items);
    if (!page.page.hasMore || page.page.nextCursor === null) return { items, complete: true };
    cursor = page.page.nextCursor;
  }
  return { items, complete: false };
}

/**
 * The farmer's active crops across the whole farm. The crops endpoint is
 * per-plot and takes a single `status`, so this asks each plot once per
 * active status (never an unfiltered list that would page through years of
 * HARVESTED history) and walks each cursor to the end.
 */
export async function listAllActiveFarmCrops(signal?: AbortSignal): Promise<ActiveFarmCropsResult> {
  const plots = await listDiaryPlots(signal);
  const perQuery = await Promise.all(
    plots.flatMap((plot) =>
      ACTIVE_FARM_CROP_STATUSES.map(async (status) => ({
        plot,
        ...(await listAllFarmCropsWithStatus(plot.id, status, signal)),
      })),
    ),
  );

  // A crop whose status changes between the two status queries could come
  // back from both; it is shown once.
  const seen = new Set<string>();
  const items: PlotFarmCrop[] = [];
  let complete = true;
  for (const result of perQuery) {
    if (!result.complete) complete = false;
    for (const crop of result.items) {
      if (seen.has(crop.id)) continue;
      seen.add(crop.id);
      items.push({ plot: result.plot, crop });
    }
  }
  return { plots, items, complete };
}
