/**
 * Typed API client methods for a farmer's soil diary (FR-F06): lab test records,
 * amendments, moisture/erosion observations and the crop rotation plan, all scoped
 * to a single plot within a farm.
 *
 * Mirrors farms.ts's shape exactly: typed interfaces + thin async wrapper
 * functions per endpoint, unwrapping `{ items }` envelopes so every caller just
 * works with plain arrays. Field names match apps/api/src/modules/soil/soil.schema.ts
 * and docs/openapi.yaml verbatim -- do not rename anything here without updating
 * both.
 */
import { api } from '../../../shell/api/client';

// ---------------------------------------------------------------------------
// soil_test_records
// ---------------------------------------------------------------------------

export type LimeStatus = 'Harmless' | 'Slight' | 'Moderate' | 'Severe';

export interface SoilTestRecord {
  id: string;
  plotId: string;
  testDate: string;
  nextDueDate: string;
  organicCarbonPct: number;
  ph: number;
  ecDsPerM: number;
  tdsPpm: number | null;
  nitrogenKgPerHa: number | null;
  phosphorusKgPerHa: number | null;
  potassiumKgPerHa: number | null;
  limeStatus: string | null;
  labReportUploadId: string | null;
  /** Server-computed classification labels (BR-40) -- show directly, never recompute. */
  organicCarbonLabel: string;
  phLabel: string;
  ecLabel: string;
  tdsLabel: string | null;
  nitrogenLabel: string | null;
  phosphorusLabel: string | null;
  potassiumLabel: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateSoilTestInput {
  testDate: string;
  nextDueDate: string;
  organicCarbonPct: number;
  ph: number;
  ecDsPerM: number;
  tdsPpm?: number | undefined;
  nitrogenKgPerHa?: number | undefined;
  phosphorusKgPerHa?: number | undefined;
  potassiumKgPerHa?: number | undefined;
  limeStatus?: LimeStatus | undefined;
  labReportUploadId?: string | undefined;
}

export interface SoilHealthMetric {
  currentValue: number | null;
  previousValue: number | null;
  deltaValue: number | null;
  trendDirection: 'improving' | 'declining' | 'flat' | null;
  chartPoints: { month: string; value: number }[];
}

export interface SoilHealthSummary {
  ph: SoilHealthMetric;
  organicCarbon: SoilHealthMetric;
  tds: SoilHealthMetric;
}

export async function listSoilTests(farmId: string, plotId: string): Promise<SoilTestRecord[]> {
  const { items } = await api.get<{ items: SoilTestRecord[] }>(
    `/farms/${farmId}/plots/${plotId}/soil-tests`,
  );
  return items;
}

export async function createSoilTest(
  farmId: string,
  plotId: string,
  input: CreateSoilTestInput,
  idempotencyKey?: string,
): Promise<SoilTestRecord> {
  return await api.post<SoilTestRecord>(
    `/farms/${farmId}/plots/${plotId}/soil-tests`,
    input,
    idempotencyKey,
  );
}

export async function getSoilTest(
  farmId: string,
  plotId: string,
  testId: string,
): Promise<SoilTestRecord> {
  return await api.get<SoilTestRecord>(`/farms/${farmId}/plots/${plotId}/soil-tests/${testId}`);
}

export async function getSoilHealthSummary(
  farmId: string,
  plotId: string,
): Promise<SoilHealthSummary> {
  return await api.get<SoilHealthSummary>(
    `/farms/${farmId}/plots/${plotId}/soil-tests/health-summary`,
  );
}

// ---------------------------------------------------------------------------
// soil_amendments
// ---------------------------------------------------------------------------

export interface SoilAmendment {
  id: string;
  plotId: string;
  amendmentType: string;
  quantityKg: number;
  appliedDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateSoilAmendmentInput {
  amendmentType: string;
  quantityKg: number;
  appliedDate: string;
  notes?: string | undefined;
}

export async function listSoilAmendments(farmId: string, plotId: string): Promise<SoilAmendment[]> {
  const { items } = await api.get<{ items: SoilAmendment[] }>(
    `/farms/${farmId}/plots/${plotId}/soil-amendments`,
  );
  return items;
}

export async function createSoilAmendment(
  farmId: string,
  plotId: string,
  input: CreateSoilAmendmentInput,
  idempotencyKey?: string,
): Promise<SoilAmendment> {
  return await api.post<SoilAmendment>(
    `/farms/${farmId}/plots/${plotId}/soil-amendments`,
    input,
    idempotencyKey,
  );
}

// ---------------------------------------------------------------------------
// soil_moisture_observations
// ---------------------------------------------------------------------------

export type MoistureLevel = 'Dry' | 'Moist' | 'Wet';

export interface SoilMoisture {
  id: string;
  plotId: string;
  level: string;
  observedAt: string;
  observedBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateSoilMoistureInput {
  level: MoistureLevel;
  observedAt?: string | undefined;
}

export async function listSoilMoisture(farmId: string, plotId: string): Promise<SoilMoisture[]> {
  const { items } = await api.get<{ items: SoilMoisture[] }>(
    `/farms/${farmId}/plots/${plotId}/soil-moisture`,
  );
  return items;
}

export async function createSoilMoisture(
  farmId: string,
  plotId: string,
  input: CreateSoilMoistureInput,
  idempotencyKey?: string,
): Promise<SoilMoisture> {
  return await api.post<SoilMoisture>(
    `/farms/${farmId}/plots/${plotId}/soil-moisture`,
    input,
    idempotencyKey,
  );
}

// ---------------------------------------------------------------------------
// erosion_conservation_notes
// ---------------------------------------------------------------------------

export type ErosionRiskLevel = 'Low Risk' | 'Moderate Risk' | 'High Risk';

export interface ErosionNote {
  id: string;
  plotId: string;
  riskLevel: string;
  practiceNotes: string | null;
  loggedAt: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateErosionNoteInput {
  riskLevel: ErosionRiskLevel;
  practiceNotes?: string | undefined;
  loggedAt?: string | undefined;
}

export async function listErosionNotes(farmId: string, plotId: string): Promise<ErosionNote[]> {
  const { items } = await api.get<{ items: ErosionNote[] }>(
    `/farms/${farmId}/plots/${plotId}/erosion-notes`,
  );
  return items;
}

export async function createErosionNote(
  farmId: string,
  plotId: string,
  input: CreateErosionNoteInput,
  idempotencyKey?: string,
): Promise<ErosionNote> {
  return await api.post<ErosionNote>(
    `/farms/${farmId}/plots/${plotId}/erosion-notes`,
    input,
    idempotencyKey,
  );
}

// ---------------------------------------------------------------------------
// crop_rotation_entries + cover_crop_windows
// ---------------------------------------------------------------------------

export type CropRotationStatus = 'CURRENT' | 'NEXT' | 'PLANNED';

export interface CropRotationEntry {
  id: string;
  plotId: string;
  sequenceOrder: number;
  cropName: string;
  plannedDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CoverCropWindow {
  id: string;
  plotId: string;
  coverCropType: string;
  windowStart: string;
  windowEnd: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CropRotationPlan {
  sequence: CropRotationEntry[];
  coverCropWindow: CoverCropWindow | null;
}

export interface CropRotationEntryInput {
  sequenceOrder: number;
  cropName: string;
  plannedDate?: string | undefined;
  status: CropRotationStatus;
}

export async function getCropRotation(farmId: string, plotId: string): Promise<CropRotationPlan> {
  return await api.get<CropRotationPlan>(`/farms/${farmId}/plots/${plotId}/crop-rotation`);
}

export async function putCropRotation(
  farmId: string,
  plotId: string,
  sequence: CropRotationEntryInput[],
): Promise<CropRotationPlan> {
  return await api.put<CropRotationPlan>(`/farms/${farmId}/plots/${plotId}/crop-rotation`, {
    sequence,
  });
}

export interface CreateCoverCropWindowInput {
  coverCropType: string;
  windowStart: string;
  windowEnd: string;
}

export async function createCoverCropWindow(
  farmId: string,
  plotId: string,
  input: CreateCoverCropWindowInput,
  idempotencyKey?: string,
): Promise<CoverCropWindow> {
  return await api.post<CoverCropWindow>(
    `/farms/${farmId}/plots/${plotId}/cover-crop-windows`,
    input,
    idempotencyKey,
  );
}

// ---------------------------------------------------------------------------
// Soil Report PDF Export (FR-F06)
// ---------------------------------------------------------------------------

export interface ExportSoilReportOptions {
  period: '3 months' | '6 months' | 'All time';
  include?: string;
  plotId?: string;
}

export interface SoilReportDownloadLink {
  downloadUrl: string;
  fileName: string;
  expiresAt: number;
}

export async function getSoilReportDownloadLink(
  farmId: string,
  options: ExportSoilReportOptions,
): Promise<SoilReportDownloadLink> {
  const queryParts: string[] = [`period=${encodeURIComponent(options.period)}`];
  if (options.include) queryParts.push(`include=${encodeURIComponent(options.include)}`);
  if (options.plotId) queryParts.push(`plotId=${encodeURIComponent(options.plotId)}`);

  return await api.get<SoilReportDownloadLink>(
    `/farms/${farmId}/soil-reports/download-link?${queryParts.join('&')}`,
  );
}

