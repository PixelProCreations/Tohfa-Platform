/**
 * Typed API client methods for a farmer's farms (land locations) and their plots (zones).
 *
 * "Farm" here is the same concept as registration Step 3's "location": a farmer runs ONE
 * operation whose land sits in several physical places, and each labelled parcel with its own
 * boundary is a `Farm` row (see the docblock on Step3Location.tsx). A brand-new farmer already
 * has at least one `Farm`, created server-side from their approved application's Step 3
 * locations -- `getFarms()` returning `[]` is still a valid response (e.g. an
 * approved-before-this-feature-shipped farmer), not an error, and callers must handle it.
 */
import { api } from '../../../shell/api/client';

/** GeoJSON Polygon, matching `FarmLocationData.fmbPolygon` in storage/registrationDraft.ts. */
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Farm {
  id: string;
  name: string;
  surveyNumber: string | null;
  areaAcres: number | null;
  village: string | null;
  taluk: string | null;
  district: string;
  /** Server-controlled -- never sent by the client on create or update. */
  isPrimary: boolean;
  boundary: GeoPolygon | null;
  boundaryAreaAcres: number | null;
  boundaryDrawnBy: string | null;
  boundaryDrawnAt: string | null;
  boundaryVersion: number;
  address: string | null;
  centroidLat: number | null;
  centroidLng: number | null;
  waterSources: string[];
  landBoundaryContext: string[];
  notes: string | null;
  /**
   * Only present on `GET /farms` list rows (the API's `FarmListItem`, docs/openapi.yaml) --
   * `POST`/`PATCH` return the plain `Farm` shape with no `plotCount`.
   */
  plotCount?: number | undefined;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateFarmInput {
  name: string;
  areaAcres?: number | undefined;
  boundary?: GeoPolygon | undefined;
  village?: string | undefined;
  taluk?: string | undefined;
  district?: string | undefined;
}

export interface UpdateFarmInput {
  name?: string | undefined;
  areaAcres?: number | undefined;
  boundary?: GeoPolygon | null | undefined;
  /** Only meaningful alongside `boundary` -- the map-measured area for the same edit. */
  calculatedAreaAcres?: number | undefined;
  village?: string | undefined;
  taluk?: string | undefined;
  district?: string | undefined;
  waterSources?: string[] | undefined;
  landBoundaryContext?: string[] | undefined;
  notes?: string | undefined;
}

export interface Plot {
  id: string;
  farmId: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  sunExposure: string | null;
  irrigationType: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePlotInput {
  name: string;
  areaAcres?: number | undefined;
  soilType?: string | undefined;
  sunExposure?: string | undefined;
  irrigationType?: string | undefined;
}

export interface UpdatePlotInput {
  name?: string | undefined;
  areaAcres?: number | undefined;
  soilType?: string | undefined;
  sunExposure?: string | undefined;
  irrigationType?: string | undefined;
}

/**
 * Lists every farm (land location) belonging to the signed-in farmer.
 *
 * The wire response is `{ items: Farm[] }`, not a bare array (docs/openapi.yaml's
 * `listMyFarms` / `FarmListItem`) -- unwrapped here so every caller in this app just works
 * with `Farm[]`.
 */
export async function getFarms(): Promise<Farm[]> {
  const { items } = await api.get<{ items: Farm[] }>('/farms');
  return items;
}

export async function createFarm(input: CreateFarmInput): Promise<Farm> {
  return await api.post<Farm>('/farms', input);
}

export async function updateFarm(farmId: string, input: UpdateFarmInput): Promise<Farm> {
  return await api.patch<Farm>(`/farms/${farmId}`, input);
}

export async function deleteFarm(farmId: string): Promise<void> {
  await api.delete<void>(`/farms/${farmId}`);
}

/**
 * Lists the zones (subdivisions) marked out within one farm.
 *
 * Also wire-wrapped as `{ items: Plot[] }` (docs/openapi.yaml's `listMyFarmPlots`), unwrapped
 * here for the same reason as `getFarms()`.
 */
export async function getPlots(farmId: string): Promise<Plot[]> {
  const { items } = await api.get<{ items: Plot[] }>(`/farms/${farmId}/plots`);
  return items;
}

export async function createPlot(farmId: string, input: CreatePlotInput): Promise<Plot> {
  return await api.post<Plot>(`/farms/${farmId}/plots`, input);
}

export async function updatePlot(
  farmId: string,
  plotId: string,
  input: UpdatePlotInput,
): Promise<Plot> {
  return await api.patch<Plot>(`/farms/${farmId}/plots/${plotId}`, input);
}

export async function deletePlot(farmId: string, plotId: string): Promise<void> {
  await api.delete<void>(`/farms/${farmId}/plots/${plotId}`);
}
