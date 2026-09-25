import { api } from '../../../shell/api/client';

// ---------------------------------------------------------------------------
// Plots / active crops (STUB backend responses — see farm-diary.service.ts)
// ---------------------------------------------------------------------------

export interface DiaryPlot {
  id: string;
  name: string;
  areaAcres: number | null;
}

export interface DiaryActiveCrop {
  id: string;
  cropName: string;
  plantedOn: string | null;
}

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

export interface DiarySubActivity {
  key: string;
  categoryKey: string;
  name: string;
  nameTa: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface DiaryCategory {
  key: string;
  name: string;
  nameTa: string | null;
  iconKey: string | null;
  sortOrder: number;
  isActive: boolean;
  subActivities: DiarySubActivity[];
}

export interface DiaryTaxonomy {
  categories: DiaryCategory[];
}

// ---------------------------------------------------------------------------
// Workforce (BR-44)
// ---------------------------------------------------------------------------

export interface DiaryWorkerInput {
  name: string;
  role?: string;
  hoursWorked: number;
  wageRatePaise: number;
  paymentStatus?: 'PENDING' | 'PAID';
}

export interface DiaryWorker {
  id: string;
  name: string;
  role: string | null;
  hoursWorked: number;
  wageRatePaise: number;
  paymentStatus: 'PENDING' | 'PAID';
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export interface DiaryPhoto {
  id: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface AttachDiaryPhotoInput {
  storageKey: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
}

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/diary/entries
 *
 * There is deliberately no `farmerId` field: the owner is always the
 * authenticated farmer (BR-40). `plotId`/`farmCropId` are only settable at
 * creation — see UpdateDiaryEntryInput.
 */
export interface CreateDiaryEntryInput {
  plotId: string;
  farmCropId?: string;
  categoryKey: string;
  subActivityKey: string;
  minutes: number;
  activityFields?: Record<string, unknown>;
  notes?: string;
  activityOn?: string;
  voiceNoteKey?: string;
  voiceNoteDurationS?: number;
  workers?: DiaryWorkerInput[];
}

/**
 * PATCH /farmers/me/diary/entries/:entryId
 *
 * `plotId`/`farmCropId` are not editable (moving an entry to a different plot
 * or crop cycle is a delete-and-recreate, not an edit). `workers`, when
 * present, replaces the whole workforce set (BR-44c). Nullable fields accept
 * `null` to clear them.
 */
export interface UpdateDiaryEntryInput {
  categoryKey?: string;
  subActivityKey?: string;
  minutes?: number;
  activityFields?: Record<string, unknown>;
  notes?: string | null;
  activityOn?: string;
  voiceNoteKey?: string | null;
  voiceNoteDurationS?: number | null;
  workers?: DiaryWorkerInput[];
}

/** Fields shared by the list summary and the full entry. */
export interface DiaryEntrySummary {
  id: string;
  plotId: string;
  farmCropId: string;
  categoryKey: string;
  subActivityKey: string;
  minutes: number;
  notes: string | null;
  activityOn: string;
  loggedAt: string;
  /**
   * Integer paise, computed at read time as ROUND(SUM(hours_worked *
   * wage_rate_paise)) — never stored (BR-44).
   */
  totalLabourCostPaise: number;
  createdAt: string;
  updatedAt: string | null;
  workerCount: number;
  photoCount: number;
}

export interface DiaryEntry extends DiaryEntrySummary {
  activityFields: Record<string, unknown>;
  voiceNoteKey: string | null;
  voiceNoteDurationS: number | null;
  workers: DiaryWorker[];
  photos: DiaryPhoto[];
}

/** GET /farmers/me/diary/entries — cursor pagination, same envelope as certifications. */
export interface ListDiaryEntriesQuery {
  date?: string;
  month?: string;
  plotId?: string;
  categoryKey?: string;
  cursor?: string;
  limit?: number;
}

export interface ListDiaryEntriesResult {
  items: DiaryEntrySummary[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface DiaryCalendar {
  month: string;
  days: { date: string; entryCount: number }[];
}

// ---------------------------------------------------------------------------
// Plots / active crops
// ---------------------------------------------------------------------------

export async function listDiaryPlots(signal?: AbortSignal): Promise<DiaryPlot[]> {
  const { items } = await api.get<{ items: DiaryPlot[] }>('/farmers/me/diary/plots', signal);
  return items;
}

export async function listActiveCrops(
  plotId: string,
  signal?: AbortSignal,
): Promise<DiaryActiveCrop[]> {
  const { items } = await api.get<{ items: DiaryActiveCrop[] }>(
    `/farmers/me/diary/plots/${plotId}/active-crops`,
    signal,
  );
  return items;
}

// ---------------------------------------------------------------------------
// Taxonomy
// ---------------------------------------------------------------------------

export async function getDiaryTaxonomy(signal?: AbortSignal): Promise<DiaryTaxonomy> {
  return api.get<DiaryTaxonomy>('/farmers/me/diary/taxonomy', signal);
}

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

export async function createDiaryEntry(input: CreateDiaryEntryInput): Promise<DiaryEntry> {
  return api.post<DiaryEntry>('/farmers/me/diary/entries', input);
}

export async function listDiaryEntries(
  query: ListDiaryEntriesQuery,
  signal?: AbortSignal,
): Promise<ListDiaryEntriesResult> {
  const params = new URLSearchParams();
  if (query.date !== undefined) params.append('date', query.date);
  if (query.month !== undefined) params.append('month', query.month);
  if (query.plotId !== undefined) params.append('plotId', query.plotId);
  if (query.categoryKey !== undefined) params.append('categoryKey', query.categoryKey);
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  const path = `/farmers/me/diary/entries${queryStr ? `?${queryStr}` : ''}`;
  return api.get<ListDiaryEntriesResult>(path, signal);
}

export async function getDiaryCalendar(month: string, signal?: AbortSignal): Promise<DiaryCalendar> {
  return api.get<DiaryCalendar>(
    `/farmers/me/diary/entries/calendar?month=${encodeURIComponent(month)}`,
    signal,
  );
}

export async function getDiaryEntry(entryId: string, signal?: AbortSignal): Promise<DiaryEntry> {
  return api.get<DiaryEntry>(`/farmers/me/diary/entries/${entryId}`, signal);
}

export async function updateDiaryEntry(
  entryId: string,
  input: UpdateDiaryEntryInput,
): Promise<DiaryEntry> {
  return api.patch<DiaryEntry>(`/farmers/me/diary/entries/${entryId}`, input);
}

export async function deleteDiaryEntry(entryId: string): Promise<void> {
  await api.delete<void>(`/farmers/me/diary/entries/${entryId}`);
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export async function attachDiaryPhoto(
  entryId: string,
  input: AttachDiaryPhotoInput,
): Promise<DiaryPhoto> {
  return api.post<DiaryPhoto>(`/farmers/me/diary/entries/${entryId}/photos`, input);
}

export async function deleteDiaryPhoto(entryId: string, photoId: string): Promise<void> {
  await api.delete<void>(`/farmers/me/diary/entries/${entryId}/photos/${photoId}`);
}
