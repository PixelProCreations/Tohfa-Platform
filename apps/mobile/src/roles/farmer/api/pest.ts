/**
 * Typed API client methods for Pest Management (FR-F07): the global pest reference
 * library, admin-authored weather risk notes, and a farmer's own per-plot pest
 * detections, treatment logs and treatment reminders, plus a farm-wide read-only
 * analytics summary.
 *
 * Mirrors soil.ts's shape exactly: typed interfaces + thin async wrapper functions
 * per endpoint, unwrapping `{ items }` envelopes so every caller just works with
 * plain arrays. Field names match apps/api/src/modules/pest/pest.schema.ts and
 * docs/openapi.yaml verbatim -- do not rename anything here without updating both.
 */
import { api } from '../../../shell/api/client';
import { signUpload } from './registration';
import { uploadWithResume } from './uploader';

// ---------------------------------------------------------------------------
// pest_library (global reference catalog)
// ---------------------------------------------------------------------------

export interface PestLibraryEntry {
  id: string;
  name: string;
  scientificName: string | null;
  category: string;
  riskLevel: string;
  crops: string[];
  season: string | null;
  symptoms: string[];
  organicTreatments: string[];
  prevention: string[];
  recommendedTreatment: string | null;
  intervalDays: number | null;
  phiDays: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListPestLibraryQuery {
  /** Case-insensitive substring match against name and scientificName. */
  q?: string | undefined;
  /** Case-insensitive exact match against one element of the crops array. */
  crop?: string | undefined;
}

export async function listPestLibrary(query?: ListPestLibraryQuery): Promise<PestLibraryEntry[]> {
  const search = new URLSearchParams();
  if (query?.q) search.set('q', query.q);
  if (query?.crop) search.set('crop', query.crop);
  const qs = search.toString();
  const { items } = await api.get<{ items: PestLibraryEntry[] }>(
    `/pest-library${qs ? `?${qs}` : ''}`,
  );
  return items;
}

export async function getPestLibraryEntry(pestLibraryId: string): Promise<PestLibraryEntry> {
  return await api.get<PestLibraryEntry>(`/pest-library/${pestLibraryId}`);
}

// ---------------------------------------------------------------------------
// weather_risk_notes (admin-authored, region-scoped static content)
// ---------------------------------------------------------------------------

export interface WeatherRiskNote {
  id: string;
  region: string;
  note: string;
  riskLevel: string | null;
  validFrom: string | null;
  validUntil: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export async function listWeatherRiskNotes(): Promise<WeatherRiskNote[]> {
  const { items } = await api.get<{ items: WeatherRiskNote[] }>('/weather-risk-notes');
  return items;
}

// ---------------------------------------------------------------------------
// pest_detections
// ---------------------------------------------------------------------------

export type PestSeverity = 'High' | 'Medium' | 'Low';
export type PestDetectionStatus = 'Ongoing' | 'Resolved' | 'Recurring';

export interface PestDetection {
  id: string;
  plotId: string;
  farmCropId: string | null;
  pestLibraryId: string | null;
  pestName: string;
  scientificName: string | null;
  cropLabel: string | null;
  severity: string;
  status: string;
  detectedOn: string;
  notes: string | null;
  photoUploadId: string | null;
  resolvedAt: string | null;
  resolutionEffective: boolean | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePestDetectionInput {
  farmCropId?: string | undefined;
  pestLibraryId?: string | undefined;
  pestName: string;
  scientificName?: string | undefined;
  cropLabel?: string | undefined;
  severity: PestSeverity;
  detectedOn: string;
  notes?: string | undefined;
  photoUploadId?: string | undefined;
}

export interface UpdatePestDetectionInput {
  status?: PestDetectionStatus | undefined;
  resolutionEffective?: boolean | null | undefined;
  notes?: string | null | undefined;
}

export async function listPestDetections(farmId: string, plotId: string): Promise<PestDetection[]> {
  const { items } = await api.get<{ items: PestDetection[] }>(
    `/farms/${farmId}/plots/${plotId}/pest-detections`,
  );
  return items;
}

export async function getPestDetection(
  farmId: string,
  plotId: string,
  detectionId: string,
): Promise<PestDetection> {
  return await api.get<PestDetection>(
    `/farms/${farmId}/plots/${plotId}/pest-detections/${detectionId}`,
  );
}

export async function createPestDetection(
  farmId: string,
  plotId: string,
  input: CreatePestDetectionInput,
  idempotencyKey?: string,
): Promise<PestDetection> {
  return await api.post<PestDetection>(
    `/farms/${farmId}/plots/${plotId}/pest-detections`,
    input,
    idempotencyKey,
  );
}

export async function updatePestDetection(
  farmId: string,
  plotId: string,
  detectionId: string,
  input: UpdatePestDetectionInput,
): Promise<PestDetection> {
  return await api.patch<PestDetection>(
    `/farms/${farmId}/plots/${plotId}/pest-detections/${detectionId}`,
    input,
  );
}

// ---------------------------------------------------------------------------
// pest_treatment_logs
// ---------------------------------------------------------------------------

export type PestCategory = 'Disease' | 'Pest' | 'Weed' | 'Deficiency';

export interface PestTreatmentLog {
  id: string;
  plotId: string;
  farmCropId: string | null;
  detectionId: string | null;
  pestLibraryId: string | null;
  pestName: string;
  category: string;
  severity: string;
  treatment: string;
  intervalDays: number | null;
  phiDays: number | null;
  appliedOn: string;
  nextApplicationDate: string | null;
  photoUploadId: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePestTreatmentLogInput {
  farmCropId?: string | undefined;
  detectionId?: string | undefined;
  pestLibraryId?: string | undefined;
  pestName: string;
  category: PestCategory;
  severity: PestSeverity;
  treatment: string;
  intervalDays?: number | undefined;
  phiDays?: number | undefined;
  appliedOn: string;
  nextApplicationDate?: string | undefined;
  photoUploadId?: string | undefined;
}

export async function listPestTreatmentLogs(
  farmId: string,
  plotId: string,
): Promise<PestTreatmentLog[]> {
  const { items } = await api.get<{ items: PestTreatmentLog[] }>(
    `/farms/${farmId}/plots/${plotId}/pest-treatment-logs`,
  );
  return items;
}

export async function createPestTreatmentLog(
  farmId: string,
  plotId: string,
  input: CreatePestTreatmentLogInput,
  idempotencyKey?: string,
): Promise<PestTreatmentLog> {
  return await api.post<PestTreatmentLog>(
    `/farms/${farmId}/plots/${plotId}/pest-treatment-logs`,
    input,
    idempotencyKey,
  );
}

// ---------------------------------------------------------------------------
// pest_treatment_reminders
// ---------------------------------------------------------------------------

export type PestReminderStatus = 'Upcoming' | 'Completed';
export type PestRepeatInterval = 'ONE_TIME' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface PestTreatmentReminder {
  id: string;
  plotId: string;
  detectionId: string | null;
  title: string;
  targetPest: string | null;
  dueDate: string;
  repeatInterval: string;
  status: string;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePestTreatmentReminderInput {
  detectionId?: string | undefined;
  title: string;
  targetPest?: string | undefined;
  dueDate: string;
  repeatInterval?: PestRepeatInterval | undefined;
  notes?: string | undefined;
}

export interface UpdatePestTreatmentReminderInput {
  title?: string | undefined;
  dueDate?: string | undefined;
  status?: PestReminderStatus | undefined;
  notes?: string | null | undefined;
}

export async function listPestTreatmentReminders(
  farmId: string,
  plotId: string,
): Promise<PestTreatmentReminder[]> {
  const { items } = await api.get<{ items: PestTreatmentReminder[] }>(
    `/farms/${farmId}/plots/${plotId}/pest-treatment-reminders`,
  );
  return items;
}

export async function createPestTreatmentReminder(
  farmId: string,
  plotId: string,
  input: CreatePestTreatmentReminderInput,
  idempotencyKey?: string,
): Promise<PestTreatmentReminder> {
  return await api.post<PestTreatmentReminder>(
    `/farms/${farmId}/plots/${plotId}/pest-treatment-reminders`,
    input,
    idempotencyKey,
  );
}

export async function updatePestTreatmentReminder(
  farmId: string,
  plotId: string,
  reminderId: string,
  input: UpdatePestTreatmentReminderInput,
): Promise<PestTreatmentReminder> {
  return await api.patch<PestTreatmentReminder>(
    `/farms/${farmId}/plots/${plotId}/pest-treatment-reminders/${reminderId}`,
    input,
  );
}

// ---------------------------------------------------------------------------
// pest analytics (read-only aggregate)
// ---------------------------------------------------------------------------

export interface PestAnalyticsSummary {
  detectionsBySeason: { season: string; count: number }[];
  mostAffectedCrops: { crop: string; count: number }[];
  treatmentEffectiveness: {
    treatment: string;
    timesUsed: number;
    timesEffective: number;
  }[];
}

export async function getPestAnalyticsSummary(farmId: string): Promise<PestAnalyticsSummary> {
  return await api.get<PestAnalyticsSummary>(`/farms/${farmId}/pest-analytics/summary`);
}

// ---------------------------------------------------------------------------
// Pest photo upload (detection / treatment log identification photos)
// ---------------------------------------------------------------------------

export interface UploadPestPhotoResult {
  fileUrl: string;
  /**
   * The `uploads` table row id this photo was recorded against (now returned by
   * `POST /uploads/sign` -- see `SignedUploadTarget` in docs/openapi.yaml). Pass
   * this back as `photoUploadId` when creating/updating the pest detection or
   * treatment log this photo is for; pest.schema.ts's `requireOwnUpload` looks it
   * up by primary key and rejects anything the caller doesn't own.
   */
  uploadId: string;
}

/**
 * Uploads a pest detection/treatment identification photo via the real sign+PUT
 * flow (`POST /uploads/sign` with `purpose: 'PEST_PHOTO'`, then a PUT to the signed
 * target), reusing `signUpload`/`uploadWithResume` -- the same helpers
 * UploadNewSoilTestScreen.tsx already uses for lab report uploads. There is no
 * pest-specific upload endpoint; this is the one general-purpose sign flow with a
 * different `purpose` value.
 */
export async function uploadPestPhoto(
  uri: string,
  fileName: string,
  contentType: string,
): Promise<UploadPestPhotoResult> {
  const fileResp = await fetch(uri);
  const buffer = await fileResp.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const signed = await signUpload({
    purpose: 'PEST_PHOTO',
    fileName,
    contentType,
    sizeBytes: bytes.length,
  });
  await uploadWithResume({
    uploadUrl: signed.uploadUrl,
    fileUrl: signed.fileUrl,
    resumable: signed.resumable ?? false,
    data: bytes,
    contentType,
    headers: signed.headers,
    method: signed.method,
  });
  return { fileUrl: signed.fileUrl, uploadId: signed.id };
}
