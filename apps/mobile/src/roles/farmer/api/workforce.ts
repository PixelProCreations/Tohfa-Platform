/**
 * Typed API client methods for Farm Workforce (BR-41): a farmer's own worker
 * roster, daily attendance, cash advances, payroll payouts, and three
 * read-only payroll aggregates -- all farm-scoped, not plot-scoped (a worker
 * is hired by the farm as a whole).
 *
 * Mirrors pest.ts/soil.ts's shape exactly: typed interfaces + thin async
 * wrapper functions per endpoint, unwrapping `{ items }` envelopes so every
 * caller just works with plain arrays. Field names match
 * apps/api/src/modules/workforce/workforce.schema.ts and docs/openapi.yaml
 * verbatim -- do not rename anything here without updating both.
 *
 * Every money field is an integer number of paise (`*Paise`), NOT the
 * decimal-string `Money` type used elsewhere in this codebase (root
 * CLAUDE.md §2.2, workforce.schema.ts's docblock) -- this feature's stage-1
 * contract fixed that shape.
 */
import { api } from '../../../shell/api/client';
import { signUpload } from './registration';
import { uploadWithResume } from './uploader';

// ---------------------------------------------------------------------------
// workers
// ---------------------------------------------------------------------------

export type PayType = 'daily' | 'monthly';

export interface Worker {
  id: string;
  farmId: string;
  name: string;
  roleTitle: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  idProofUploadId: string | null;
  photoUploadId: string | null;
  bankAccountNo: string | null;
  ifscCode: string | null;
  upiId: string | null;
  /** 'daily' | 'monthly' -- loose string on the response, same convention as pest.ts/soil.ts. */
  payType: string;
  /** Integer paise, never a float (BR-41a). */
  payRatePaise: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateWorkerInput {
  name: string;
  roleTitle?: string | undefined;
  dateOfBirth?: string | undefined;
  gender?: string | undefined;
  /** Must reference an upload (`purpose: WORKER_ID_PROOF`) the caller themself created. */
  idProofUploadId?: string | undefined;
  /** Must reference an upload (`purpose: WORKER_PHOTO`) the caller themself created. */
  photoUploadId?: string | undefined;
  bankAccountNo?: string | undefined;
  ifscCode?: string | undefined;
  upiId?: string | undefined;
  payType: PayType;
  /** Integer paise, never a float (BR-41a). */
  payRatePaise: number;
}

export interface UpdateWorkerInput {
  name?: string | undefined;
  roleTitle?: string | null | undefined;
  dateOfBirth?: string | null | undefined;
  gender?: string | null | undefined;
  idProofUploadId?: string | null | undefined;
  photoUploadId?: string | null | undefined;
  bankAccountNo?: string | null | undefined;
  ifscCode?: string | null | undefined;
  upiId?: string | null | undefined;
  payType?: PayType | undefined;
  payRatePaise?: number | undefined;
}

export async function listMyWorkers(farmId: string): Promise<Worker[]> {
  const { items } = await api.get<{ items: Worker[] }>(`/farms/${farmId}/workers`);
  return items;
}

export async function createMyWorker(
  farmId: string,
  input: CreateWorkerInput,
  idempotencyKey?: string,
): Promise<Worker> {
  return await api.post<Worker>(`/farms/${farmId}/workers`, input, idempotencyKey);
}

export async function getMyWorker(farmId: string, workerId: string): Promise<Worker> {
  return await api.get<Worker>(`/farms/${farmId}/workers/${workerId}`);
}

export async function updateMyWorker(
  farmId: string,
  workerId: string,
  input: UpdateWorkerInput,
): Promise<Worker> {
  return await api.patch<Worker>(`/farms/${farmId}/workers/${workerId}`, input);
}

export async function deleteMyWorker(farmId: string, workerId: string): Promise<void> {
  await api.delete<void>(`/farms/${farmId}/workers/${workerId}`);
}

// ---------------------------------------------------------------------------
// attendance
// ---------------------------------------------------------------------------

export interface AttendanceRecord {
  id: string;
  workerId: string;
  /** Present only on the farm-wide one-day views (listMyFarmAttendanceForDate/upsertMyFarmAttendance). */
  workerName?: string | undefined;
  farmCropId: string | null;
  workDate: string;
  present: boolean;
  activity: string | null;
  hoursWorked: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AttendanceUpsertItem {
  workerId: string;
  present: boolean;
  farmCropId?: string | undefined;
  activity?: string | undefined;
  /** Must fall in (0, 24] (BR-41b). */
  hoursWorked?: number | undefined;
}

export async function listMyFarmAttendanceForDate(
  farmId: string,
  date: string,
): Promise<AttendanceRecord[]> {
  const { items } = await api.get<{ items: AttendanceRecord[] }>(
    `/farms/${farmId}/attendance?date=${encodeURIComponent(date)}`,
  );
  return items;
}

/**
 * Bulk upserts one day's attendance across the farm's roster in a single
 * call. `date` is ONE top-level field for the whole batch -- the items carry
 * no date of their own (docs/openapi.yaml `upsertMyFarmAttendance` request
 * body: `{ date, items[] }`, not a date per item).
 */
export async function upsertMyFarmAttendance(
  farmId: string,
  date: string,
  items: AttendanceUpsertItem[],
  idempotencyKey?: string,
): Promise<AttendanceRecord[]> {
  const { items: result } = await api.post<{ items: AttendanceRecord[] }>(
    `/farms/${farmId}/attendance`,
    { date, items },
    idempotencyKey,
  );
  return result;
}

export interface ListWorkerAttendanceQuery {
  /** YYYY-MM. Narrows results to workDate within that calendar month. */
  month?: string | undefined;
  farmCropId?: string | undefined;
}

export async function listMyWorkerAttendance(
  farmId: string,
  workerId: string,
  query?: ListWorkerAttendanceQuery,
): Promise<AttendanceRecord[]> {
  const search = new URLSearchParams();
  if (query?.month) search.set('month', query.month);
  if (query?.farmCropId) search.set('farmCropId', query.farmCropId);
  const qs = search.toString();
  const { items } = await api.get<{ items: AttendanceRecord[] }>(
    `/farms/${farmId}/workers/${workerId}/attendance${qs ? `?${qs}` : ''}`,
  );
  return items;
}

// ---------------------------------------------------------------------------
// advances (insert-only history -- nothing here is ever edited)
// ---------------------------------------------------------------------------

export interface WorkerAdvance {
  id: string;
  workerId: string;
  /** Integer paise, never a float. */
  amountPaise: number;
  givenOn: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateWorkerAdvanceInput {
  amountPaise: number;
  givenOn: string;
  notes?: string | undefined;
}

export async function listMyWorkerAdvances(
  farmId: string,
  workerId: string,
): Promise<WorkerAdvance[]> {
  const { items } = await api.get<{ items: WorkerAdvance[] }>(
    `/farms/${farmId}/workers/${workerId}/advances`,
  );
  return items;
}

export async function createMyWorkerAdvance(
  farmId: string,
  workerId: string,
  input: CreateWorkerAdvanceInput,
  idempotencyKey?: string,
): Promise<WorkerAdvance> {
  return await api.post<WorkerAdvance>(
    `/farms/${farmId}/workers/${workerId}/advances`,
    input,
    idempotencyKey,
  );
}

// ---------------------------------------------------------------------------
// payouts
// ---------------------------------------------------------------------------

export type PaymentMethod = 'cash' | 'bank_transfer' | 'upi';

export interface WorkerPayout {
  id: string;
  workerId: string;
  periodStart: string;
  periodEnd: string;
  /** Integer paise, never a float. */
  amountPaise: number;
  /** 'cash' | 'bank_transfer' | 'upi' -- loose string on the response, same convention as elsewhere. */
  paymentMethod: string;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export interface CreateWorkerPayoutInput {
  periodStart: string;
  periodEnd: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  notes?: string | undefined;
}

export async function listMyWorkerPayouts(
  farmId: string,
  workerId: string,
): Promise<WorkerPayout[]> {
  const { items } = await api.get<{ items: WorkerPayout[] }>(
    `/farms/${farmId}/workers/${workerId}/payouts`,
  );
  return items;
}

/**
 * Records a payroll payout. Unlike every other create in this module,
 * `Idempotency-Key` is REQUIRED here, not optional -- this is a money-moving
 * write (root CLAUDE.md §2.4, docs/openapi.yaml `components/parameters/
 * IdempotencyKeyHeader`, `x-business-rules: [BR-36, BR-41]` on
 * `createMyWorkerPayout`). The `UNIQUE (worker_id, period_start, period_end)`
 * DB constraint is defense in depth alongside it; replaying the same key
 * returns the original payout rather than creating a second one.
 *
 * The caller is responsible for generating the key. There is no dedicated
 * UUID-generator helper anywhere in apps/mobile/src (confirmed by grepping
 * for `uuid`/`randomUUID` across the tree) -- every existing required-
 * idempotency-key call site (registration.ts's `submitFarmerApplication`,
 * listings.ts's `createListing`) takes the key as a plain required `string`
 * parameter and leaves generation to the screen, e.g. Step5Review.tsx's
 * `` `sub-${draft.applicationId}-${Date.now()}` ``. This function follows
 * that same convention rather than generating one internally.
 */
export async function createMyWorkerPayout(
  farmId: string,
  workerId: string,
  input: CreateWorkerPayoutInput,
  idempotencyKey: string,
): Promise<WorkerPayout> {
  return await api.post<WorkerPayout>(
    `/farms/${farmId}/workers/${workerId}/payouts`,
    input,
    idempotencyKey,
  );
}

// ---------------------------------------------------------------------------
// read-only aggregates (BR-41c: computed at read time, never a stored column)
// ---------------------------------------------------------------------------

export interface WorkforceSummary {
  workerCount: number;
  hoursThisMonth: number;
  payrollDueThisMonthPaise: number;
}

export async function getMyWorkforceSummary(farmId: string): Promise<WorkforceSummary> {
  return await api.get<WorkforceSummary>(`/farms/${farmId}/workforce/summary`);
}

export interface PayrollSummaryItem {
  workerId: string;
  workerName: string;
  grossPaise: number;
  advancesPaise: number;
  /** grossPaise - advancesPaise; may be negative. */
  netPayablePaise: number;
  /** 'pending' | 'paid' -- loose string on the response, same convention as elsewhere. */
  paidStatus: string;
}

export async function getMyWorkforcePayrollSummary(
  farmId: string,
  period: string,
): Promise<PayrollSummaryItem[]> {
  const { items } = await api.get<{ items: PayrollSummaryItem[] }>(
    `/farms/${farmId}/workforce/payroll-summary?period=${encodeURIComponent(period)}`,
  );
  return items;
}

export interface CropHoursSummary {
  totalCostPaise: number;
  hoursLogged: number;
  workersInvolved: number;
  avgRatePaise: number;
}

export async function getMyWorkforceCropHoursSummary(
  farmId: string,
  farmCropId: string,
): Promise<CropHoursSummary> {
  return await api.get<CropHoursSummary>(
    `/farms/${farmId}/workforce/crop-hours-summary?farmCropId=${encodeURIComponent(farmCropId)}`,
  );
}

// ---------------------------------------------------------------------------
// Worker photo / ID proof upload
// ---------------------------------------------------------------------------

export interface UploadWorkerFileResult {
  fileUrl: string;
}

/**
 * Uploads a worker's photo via the real sign+PUT flow (`POST /uploads/sign`
 * with `purpose: 'WORKER_PHOTO'`, then a PUT to the signed target), reusing
 * `signUpload`/`uploadWithResume` -- the same helpers pest.ts's
 * `uploadPestPhoto` and UploadNewSoilTestScreen.tsx already use.
 *
 * Spec gap (identical to the one pest.ts flags for `uploadPestPhoto`, and
 * UploadNewSoilTestScreen.tsx flags for `labReportUploadId`): `POST
 * /uploads/sign` only ever returns `{uploadUrl, fileUrl, method, headers,
 * expiresAt, resumable}` -- never the `uploads` table row id that
 * `photoUploadId` (workforce.schema.ts's `requireOwnUpload`, which looks the
 * id up by primary key) actually requires. The photo is still uploaded to
 * blob storage for safekeeping, but callers of this function cannot obtain a
 * `photoUploadId` to attach to a worker from it -- there isn't one to give
 * them. Do not guess one.
 */
export async function uploadWorkerPhoto(
  uri: string,
  fileName: string,
  contentType: string,
): Promise<UploadWorkerFileResult> {
  const fileResp = await fetch(uri);
  const buffer = await fileResp.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const signed = await signUpload({
    purpose: 'WORKER_PHOTO',
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
  return { fileUrl: signed.fileUrl };
}

/**
 * Uploads a worker's ID proof document via the same sign+PUT flow, with
 * `purpose: 'WORKER_ID_PROOF'`. Same `idProofUploadId` linkage gap as
 * `uploadWorkerPhoto` above -- see that function's docblock.
 */
export async function uploadWorkerIdProof(
  uri: string,
  fileName: string,
  contentType: string,
): Promise<UploadWorkerFileResult> {
  const fileResp = await fetch(uri);
  const buffer = await fileResp.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const signed = await signUpload({
    purpose: 'WORKER_ID_PROOF',
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
  return { fileUrl: signed.fileUrl };
}
