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

// ---------------------------------------------------------------------------
// Crop Inputs & NPK Contribution (BR-56)
// ---------------------------------------------------------------------------

export type CropInputType = 'FERTILIZER' | 'MANURE' | 'BIO_INPUT' | 'PESTICIDE' | 'OTHER';
export type CropInputUnit = 'KG' | 'LITRE' | 'GRAM' | 'ML' | 'BAG' | 'TONNE' | 'OTHER';

export interface CropInputResponse {
  id: string;
  farmerId: string;
  farmCropId: string;
  inputType: CropInputType;
  inputName: string;
  appliedOn: string;
  quantity: number;
  unit: CropInputUnit;
  nitrogenPct: number | null;
  phosphorusPct: number | null;
  potassiumPct: number | null;
  applicationMethod: string | null;
  costInr: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListCropInputsQuery {
  cursor?: string;
  limit?: number;
}

export interface ListCropInputsResult {
  items: CropInputResponse[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface CropNpkContributionResponse {
  farmCropId: string;
  totalInputsCount: number;
  totalQuantityKg: number;
  totalNitrogenKg: number;
  totalPhosphorusKg: number;
  totalPotassiumKg: number;
  totalCostInr: string;
}

/**
 * GET /farmers/me/crops/:farmCropId/npk-contribution (BR-56f)
 * Calculates cumulative nitrogen, phosphorus, and potassium nutrient mass (kg)
 * across all active input applications for a crop.
 */
export async function getNpkContribution(
  farmCropId: string,
  signal?: AbortSignal,
): Promise<CropNpkContributionResponse> {
  return api.get<CropNpkContributionResponse>(
    `/farmers/me/crops/${farmCropId}/npk-contribution`,
    signal,
  );
}

/**
 * GET /farmers/me/crops/:farmCropId/inputs (BR-56)
 * Returns paginated input applications for the specified crop.
 */
export async function listCropInputs(
  farmCropId: string,
  query: ListCropInputsQuery = {},
  signal?: AbortSignal,
): Promise<ListCropInputsResult> {
  const params = new URLSearchParams();
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  const path = `/farmers/me/crops/${farmCropId}/inputs${queryStr ? `?${queryStr}` : ''}`;
  return api.get<ListCropInputsResult>(path, signal);
}

export interface CreateCropInputRequest {
  inputType: CropInputType;
  inputName: string;
  appliedOn: string;
  quantity: number;
  unit: CropInputUnit;
  nitrogenPct?: number | undefined;
  phosphorusPct?: number | undefined;
  potassiumPct?: number | undefined;
  applicationMethod?: string | undefined;
  costInr?: string | undefined;
  notes?: string | undefined;
}

export interface UpdateCropInputRequest {
  inputType?: CropInputType | undefined;
  inputName?: string | undefined;
  appliedOn?: string | undefined;
  quantity?: number | undefined;
  unit?: CropInputUnit | undefined;
  nitrogenPct?: number | null | undefined;
  phosphorusPct?: number | null | undefined;
  potassiumPct?: number | null | undefined;
  applicationMethod?: string | null | undefined;
  costInr?: string | null | undefined;
  notes?: string | null | undefined;
}

/**
 * POST /farmers/me/crops/:farmCropId/inputs (BR-56)
 * Logs a fertilizer, manure, pesticide or bio-input application for an own crop.
 */
export async function createCropInput(
  farmCropId: string,
  body: CreateCropInputRequest,
  idempotencyKey?: string,
): Promise<CropInputResponse> {
  return api.post<CropInputResponse>(
    `/farmers/me/crops/${farmCropId}/inputs`,
    body,
    idempotencyKey,
  );
}

/**
 * GET /farmers/me/crops/:farmCropId/inputs/:id (BR-56)
 * Retrieves a single crop input application.
 */
export async function getCropInput(
  farmCropId: string,
  id: string,
  signal?: AbortSignal,
): Promise<CropInputResponse> {
  return api.get<CropInputResponse>(`/farmers/me/crops/${farmCropId}/inputs/${id}`, signal);
}

/**
 * PATCH /farmers/me/crops/:farmCropId/inputs/:id (BR-56)
 * Updates an existing crop input application.
 */
export async function updateCropInput(
  farmCropId: string,
  id: string,
  body: UpdateCropInputRequest,
): Promise<CropInputResponse> {
  return api.patch<CropInputResponse>(`/farmers/me/crops/${farmCropId}/inputs/${id}`, body);
}

/**
 * DELETE /farmers/me/crops/:farmCropId/inputs/:id (BR-56)
 * Soft-deletes a crop input application.
 */
export async function deleteCropInput(
  farmCropId: string,
  id: string,
): Promise<void> {
  return api.delete<void>(`/farmers/me/crops/${farmCropId}/inputs/${id}`);
}

export { ApiError } from '../../../shell/api/client';

// ─────────────────────────────────────────────
// Crop Milestones (BR-57)
// ─────────────────────────────────────────────

export type MilestoneStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';

export interface CropMilestoneResponse {
  id: string;
  farmerId: string;
  farmCropId: string;
  templateId: string | null;
  stageCode: string;
  stageName: string;
  sequenceOrder: number;
  status: MilestoneStatus;
  targetDate: string | null;
  completedOn: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CropMilestonesListResponse {
  items: CropMilestoneResponse[];
  totalCount: number;
  completedCount: number;
  progressPct: number;
}

export interface UpdateCropMilestoneRequest {
  status?: MilestoneStatus | undefined;
  completedOn?: string | null | undefined;
  targetDate?: string | null | undefined;
  notes?: string | null | undefined;
}

export interface CropMilestoneTemplateResponse {
  id: string;
  cropMasterId: string | null;
  stageCode: string;
  stageName: string;
  description: string | null;
  sequenceOrder: number;
  expectedDaysAfterPlanting: number | null;
}

/**
 * GET /farmers/me/crops/:farmCropId/milestones (BR-57b)
 * Returns ordered growth milestones and completion progress for a crop.
 * Auto-initializes from templates if uninitialized.
 */
export async function listCropMilestones(
  farmCropId: string,
  signal?: AbortSignal,
): Promise<CropMilestonesListResponse> {
  return api.get<CropMilestonesListResponse>(
    `/farmers/me/crops/${farmCropId}/milestones`,
    signal,
  );
}

/**
 * PATCH /farmers/me/crops/:farmCropId/milestones/:id (BR-57c)
 * Marks a milestone as COMPLETED or SKIPPED, recording completion date and notes.
 */
export async function updateCropMilestone(
  farmCropId: string,
  milestoneId: string,
  body: UpdateCropMilestoneRequest,
): Promise<CropMilestoneResponse> {
  return api.patch<CropMilestoneResponse>(
    `/farmers/me/crops/${farmCropId}/milestones/${milestoneId}`,
    body,
  );
}

/**
 * POST /farmers/me/crops/:farmCropId/milestones/initialize (BR-57b, BR-57e)
 * Explicitly populates growth milestones a crop is missing from reference templates.
 */
export async function initializeCropMilestones(
  farmCropId: string,
  idempotencyKey?: string,
): Promise<CropMilestonesListResponse> {
  return api.post<CropMilestonesListResponse>(
    `/farmers/me/crops/${farmCropId}/milestones/initialize`,
    {},
    idempotencyKey,
  );
}


/**
 * GET /farmers/me/crop-milestone-templates (BR-57b)
 * Returns reference growth milestone templates.
 */
export async function listCropMilestoneTemplates(
  cropMasterId?: string,
  signal?: AbortSignal,
): Promise<CropMilestoneTemplateResponse[]> {
  const path = cropMasterId
    ? `/farmers/me/crop-milestone-templates?cropMasterId=${encodeURIComponent(cropMasterId)}`
    : '/farmers/me/crop-milestone-templates';
  return api.get<CropMilestoneTemplateResponse[]>(path, signal);
}

