/**
 * workforce.repo — SQL only.
 *
 * No authorization decisions live here — the service verifies farm
 * ownership (`findOwnedFarmId`, the same `farms.farmer_id` check
 * pest.repo#findOwnedFarmId uses) BEFORE calling any per-table method below.
 * Every worker statement still filters on `farm_id`, and every attendance/
 * advance/payout statement filters on a `worker_id` the service has already
 * proved belongs to that farm, so a mutation can never silently touch a
 * different farm's data.
 *
 * Soft delete: `workers.deleted_at` hides a worker from the roster and from
 * every "who can I mark / pay today" query (`includeDeleted: false`), but
 * the worker's attendance/advance/payout history stays queryable — nothing
 * here filters history rows by the worker's `deleted_at`, and nothing ever
 * issues `DELETE FROM workers` (0025 header).
 *
 * BR-41c: there is no gross/net column anywhere in 0025, and no statement
 * here computes one. These queries return RAW rows; the one shared function
 * that turns them into pay is workforce.service.ts#computeWorkerPay.
 *
 * Row mappers live here so snake_case never leaves the repo.
 */
import type { Executor } from '../../db/pool.js';
import type { PayType, PaymentMethod } from './workforce.schema.js';

/**
 * `date` columns come back as JS Dates from `pg`, constructed at LOCAL
 * midnight of the stored calendar date (pg's default date parser). Read the
 * calendar date back with the LOCAL getters: `toISOString()` would convert
 * to UTC first and, in any timezone east of UTC (IST, +05:30), shift the
 * date back by one day. Copied from pest.repo.ts's fixed helper.
 */
function toDateOnly(value: Date): string {
  const year = String(value.getFullYear()).padStart(4, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toIsoOrNull(value: Date | null): string | null {
  return value === null ? null : value.toISOString();
}

/**
 * `workers.pay_type` is free text with no CHECK (0025 column comment); the
 * API only ever writes 'daily'/'monthly' (Zod enum). A different value means
 * someone wrote the table outside the API, and guessing how to pay that
 * worker is worse than failing loudly.
 */
function toPayType(value: string): PayType {
  if (value === 'daily' || value === 'monthly') return value;
  throw new Error(`workers.pay_type holds unsupported value '${value}'`);
}

function toPaymentMethod(value: string): PaymentMethod {
  if (value === 'cash' || value === 'bank_transfer' || value === 'upi') return value;
  throw new Error(`worker_payouts.payment_method holds unsupported value '${value}'`);
}

/** numeric(4,2) comes back from pg as a string. */
function toHours(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}

// ---------------------------------------------------------------------------
// workers
// ---------------------------------------------------------------------------

interface WorkerRow {
  id: string;
  farm_id: string;
  name: string;
  role_title: string | null;
  date_of_birth: Date | null;
  gender: string | null;
  id_proof_upload_id: string | null;
  photo_upload_id: string | null;
  bank_account_no: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  pay_type: string;
  pay_rate_paise: number;
  created_at: Date;
  updated_at: Date | null;
}

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
  payType: PayType;
  payRatePaise: number;
  createdAt: string;
  updatedAt: string | null;
}

function toWorker(row: WorkerRow): Worker {
  return {
    id: row.id,
    farmId: row.farm_id,
    name: row.name,
    roleTitle: row.role_title,
    dateOfBirth: row.date_of_birth === null ? null : toDateOnly(row.date_of_birth),
    gender: row.gender,
    idProofUploadId: row.id_proof_upload_id,
    photoUploadId: row.photo_upload_id,
    bankAccountNo: row.bank_account_no,
    ifscCode: row.ifsc_code,
    upiId: row.upi_id,
    payType: toPayType(row.pay_type),
    payRatePaise: Number(row.pay_rate_paise),
    createdAt: row.created_at.toISOString(),
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

const WORKER_COLUMNS = `
  id, farm_id, name, role_title, date_of_birth, gender, id_proof_upload_id, photo_upload_id,
  bank_account_no, ifsc_code, upi_id, pay_type, pay_rate_paise, created_at, updated_at
`;

export interface InsertWorkerParams {
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
  payType: PayType;
  payRatePaise: number;
}

/** Only keys present change; `null` clears a nullable column. */
export interface WorkerPatch {
  name?: string;
  roleTitle?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  idProofUploadId?: string | null;
  photoUploadId?: string | null;
  bankAccountNo?: string | null;
  ifscCode?: string | null;
  upiId?: string | null;
  payType?: PayType;
  payRatePaise?: number;
}

const WORKER_PATCH_COLUMNS: ReadonlyArray<[keyof WorkerPatch, string]> = [
  ['name', 'name'],
  ['roleTitle', 'role_title'],
  ['dateOfBirth', 'date_of_birth'],
  ['gender', 'gender'],
  ['idProofUploadId', 'id_proof_upload_id'],
  ['photoUploadId', 'photo_upload_id'],
  ['bankAccountNo', 'bank_account_no'],
  ['ifscCode', 'ifsc_code'],
  ['upiId', 'upi_id'],
  ['payType', 'pay_type'],
  ['payRatePaise', 'pay_rate_paise'],
];

// ---------------------------------------------------------------------------
// worker_attendance
// ---------------------------------------------------------------------------

interface AttendanceRow {
  id: string;
  worker_id: string;
  farm_crop_id: string | null;
  work_date: Date;
  present: boolean;
  activity: string | null;
  hours_worked: string | number | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface AttendanceRecord {
  id: string;
  workerId: string;
  /** Only on the farm-wide one-day views. */
  workerName?: string;
  farmCropId: string | null;
  workDate: string;
  present: boolean;
  activity: string | null;
  hoursWorked: number | null;
  createdAt: string;
  updatedAt: string | null;
}

function toAttendanceRecord(row: AttendanceRow & { worker_name?: string }): AttendanceRecord {
  return {
    id: row.id,
    workerId: row.worker_id,
    ...(row.worker_name !== undefined ? { workerName: row.worker_name } : {}),
    farmCropId: row.farm_crop_id,
    workDate: toDateOnly(row.work_date),
    present: row.present,
    activity: row.activity,
    hoursWorked: toHours(row.hours_worked),
    createdAt: row.created_at.toISOString(),
    updatedAt: toIsoOrNull(row.updated_at),
  };
}

const ATTENDANCE_COLUMNS = `
  id, worker_id, farm_crop_id, work_date, present, activity, hours_worked, created_at, updated_at
`;

/** Same columns, qualified with the `a` alias for joins against `workers w`. */
const ATTENDANCE_COLUMNS_A = `
  a.id, a.worker_id, a.farm_crop_id, a.work_date, a.present, a.activity, a.hours_worked,
  a.created_at, a.updated_at
`;

export interface UpsertAttendanceParams {
  workerId: string;
  workDate: string;
  present: boolean;
  farmCropId: string | null;
  activity: string | null;
  hoursWorked: number | null;
}

export interface WorkerAttendanceFilters {
  /** Inclusive YYYY-MM-DD bounds of a calendar month, both or neither. */
  from?: string;
  to?: string;
  farmCropId?: string;
}

// ---------------------------------------------------------------------------
// worker_advances
// ---------------------------------------------------------------------------

interface AdvanceRow {
  id: string;
  worker_id: string;
  amount_paise: number;
  given_on: Date;
  notes: string | null;
  created_at: Date;
}

export interface WorkerAdvance {
  id: string;
  workerId: string;
  amountPaise: number;
  givenOn: string;
  notes: string | null;
  createdAt: string;
}

function toWorkerAdvance(row: AdvanceRow): WorkerAdvance {
  return {
    id: row.id,
    workerId: row.worker_id,
    amountPaise: Number(row.amount_paise),
    givenOn: toDateOnly(row.given_on),
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
  };
}

const ADVANCE_COLUMNS = `id, worker_id, amount_paise, given_on, notes, created_at`;

export interface InsertAdvanceParams {
  workerId: string;
  amountPaise: number;
  givenOn: string;
  notes: string | null;
}

// ---------------------------------------------------------------------------
// worker_payouts
// ---------------------------------------------------------------------------

interface PayoutRow {
  id: string;
  worker_id: string;
  period_start: Date;
  period_end: Date;
  amount_paise: number;
  payment_method: string;
  paid_at: Date;
  notes: string | null;
  created_at: Date;
}

export interface WorkerPayout {
  id: string;
  workerId: string;
  periodStart: string;
  periodEnd: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

function toWorkerPayout(row: PayoutRow): WorkerPayout {
  return {
    id: row.id,
    workerId: row.worker_id,
    periodStart: toDateOnly(row.period_start),
    periodEnd: toDateOnly(row.period_end),
    amountPaise: Number(row.amount_paise),
    paymentMethod: toPaymentMethod(row.payment_method),
    paidAt: row.paid_at.toISOString(),
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
  };
}

/** `idempotency_key` (0026) is deliberately not part of the response shape. */
const PAYOUT_COLUMNS = `
  id, worker_id, period_start, period_end, amount_paise, payment_method, paid_at, notes, created_at
`;

export interface InsertPayoutParams {
  workerId: string;
  periodStart: string;
  periodEnd: string;
  amountPaise: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  idempotencyKey: string;
}

/** A stored payout plus the worker/key it was recorded under, for replay comparison. */
export interface StoredPayoutWithKey {
  payout: WorkerPayout;
  idempotencyKey: string;
}

// ---------------------------------------------------------------------------
// crop-hours rows
// ---------------------------------------------------------------------------

/** One attendance row against a planting, with the paying worker's CURRENT rate. */
export interface CropAttendanceRow {
  workerId: string;
  payType: PayType;
  payRatePaise: number;
  workDate: string;
  present: boolean;
  hoursWorked: number | null;
}

// ---------------------------------------------------------------------------
// repo
// ---------------------------------------------------------------------------

export interface OwnedFarmArgs {
  farmerId: string;
  farmId: string;
}

export interface FindWorkerOptions {
  /** true = also match a soft-deleted worker (history reads). Default false. */
  includeDeleted?: boolean;
}

export interface WorkforceRepo {
  findOwnedFarmId(db: Executor, args: OwnedFarmArgs): Promise<string | null>;
  /** `undefined` = no such upload at all; `null`/a userId = its (possibly-null) owner. */
  findUploadOwner(db: Executor, uploadId: string): Promise<string | null | undefined>;
  /**
   * True when `farmCropId` is a planting on a plot of this farm
   * (`farm_crops -> plots -> farms`). `includeDeleted` also matches a
   * soft-deleted planting (a read over history); writes pass false.
   */
  farmCropExistsOnFarm(
    db: Executor,
    farmId: string,
    farmCropId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<boolean>;

  listActiveWorkers(db: Executor, farmId: string): Promise<Worker[]>;
  findWorker(db: Executor, farmId: string, workerId: string, options?: FindWorkerOptions): Promise<Worker | null>;
  insertWorker(db: Executor, params: InsertWorkerParams): Promise<Worker>;
  updateWorker(db: Executor, farmId: string, workerId: string, patch: WorkerPatch): Promise<Worker | null>;
  /** Sets `deleted_at = now()` on an active worker. False when nothing matched. */
  softDeleteWorker(db: Executor, farmId: string, workerId: string): Promise<boolean>;

  /** Existing rows only, for this farm's ACTIVE workers, with `workerName`. */
  listAttendanceForDate(db: Executor, farmId: string, workDate: string): Promise<AttendanceRecord[]>;
  upsertAttendance(db: Executor, params: UpsertAttendanceParams): Promise<AttendanceRecord>;
  listWorkerAttendance(db: Executor, workerId: string, filters: WorkerAttendanceFilters): Promise<AttendanceRecord[]>;
  /** Raw rows for several workers with `work_date` in [from, to]. */
  listAttendanceForWorkers(db: Executor, workerIds: string[], from: string, to: string): Promise<AttendanceRecord[]>;
  /** SUM(hours_worked) in [from, to] across every worker of the farm (including soft-deleted ones). */
  sumFarmHours(db: Executor, farmId: string, from: string, to: string): Promise<number>;
  listAttendanceForFarmCrop(db: Executor, farmId: string, farmCropId: string): Promise<CropAttendanceRow[]>;

  listAdvances(db: Executor, workerId: string): Promise<WorkerAdvance[]>;
  insertAdvance(db: Executor, params: InsertAdvanceParams): Promise<WorkerAdvance>;
  /** Raw rows for several workers with `given_on` in [from, to]. */
  listAdvancesForWorkers(db: Executor, workerIds: string[], from: string, to: string): Promise<WorkerAdvance[]>;

  listPayouts(db: Executor, workerId: string): Promise<WorkerPayout[]>;
  /** Payouts for several workers recorded for EXACTLY this (period_start, period_end). */
  listPayoutsForWorkersAndPeriod(
    db: Executor,
    workerIds: string[],
    periodStart: string,
    periodEnd: string,
  ): Promise<WorkerPayout[]>;
  findPayoutByIdempotencyKey(db: Executor, idempotencyKey: string): Promise<StoredPayoutWithKey | null>;
  /**
   * `INSERT ... ON CONFLICT DO NOTHING`: returns null instead of raising
   * 23505 when either unique constraint (the period, or the idempotency
   * key) already holds a row, so the caller can decide replay vs 409
   * without the unique violation aborting its transaction.
   */
  insertPayout(db: Executor, params: InsertPayoutParams): Promise<WorkerPayout | null>;
}

export const workforceRepo: WorkforceRepo = {
  async findOwnedFarmId(db, args) {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM farms WHERE id = $1 AND farmer_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [args.farmId, args.farmerId],
    );
    return result.rows[0]?.id ?? null;
  },

  async findUploadOwner(db, uploadId) {
    const result = await db.query<{ uploaded_by: string | null }>(
      `SELECT uploaded_by FROM uploads WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
      [uploadId],
    );
    if (result.rows.length === 0) return undefined;
    return result.rows[0]?.uploaded_by ?? null;
  },

  async farmCropExistsOnFarm(db, farmId, farmCropId, options = {}) {
    const deletedFilter = options.includeDeleted === true ? '' : 'AND fc.deleted_at IS NULL';
    const result = await db.query<{ id: string }>(
      `SELECT fc.id
         FROM farm_crops fc
         JOIN plots p ON p.id = fc.plot_id
        WHERE fc.id = $1 AND p.farm_id = $2 ${deletedFilter}
        LIMIT 1`,
      [farmCropId, farmId],
    );
    return result.rows.length > 0;
  },

  async listActiveWorkers(db, farmId) {
    const result = await db.query<WorkerRow>(
      `SELECT ${WORKER_COLUMNS} FROM workers
        WHERE farm_id = $1 AND deleted_at IS NULL
        ORDER BY name ASC, created_at ASC`,
      [farmId],
    );
    return result.rows.map(toWorker);
  },

  async findWorker(db, farmId, workerId, options = {}) {
    const deletedFilter = options.includeDeleted === true ? '' : 'AND deleted_at IS NULL';
    const result = await db.query<WorkerRow>(
      `SELECT ${WORKER_COLUMNS} FROM workers WHERE id = $1 AND farm_id = $2 ${deletedFilter} LIMIT 1`,
      [workerId, farmId],
    );
    const row = result.rows[0];
    return row === undefined ? null : toWorker(row);
  },

  async insertWorker(db, params) {
    const result = await db.query<WorkerRow>(
      `INSERT INTO workers (
         farm_id, name, role_title, date_of_birth, gender, id_proof_upload_id, photo_upload_id,
         bank_account_no, ifsc_code, upi_id, pay_type, pay_rate_paise
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING ${WORKER_COLUMNS}`,
      [
        params.farmId,
        params.name,
        params.roleTitle,
        params.dateOfBirth,
        params.gender,
        params.idProofUploadId,
        params.photoUploadId,
        params.bankAccountNo,
        params.ifscCode,
        params.upiId,
        params.payType,
        params.payRatePaise,
      ],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('workers insert returned no row');
    return toWorker(row);
  },

  async updateWorker(db, farmId, workerId, patch) {
    const setClauses: string[] = ['updated_at = now()'];
    const values: unknown[] = [workerId, farmId];
    for (const [key, column] of WORKER_PATCH_COLUMNS) {
      const value = patch[key];
      if (value === undefined) continue;
      values.push(value);
      setClauses.push(`${column} = $${values.length}`);
    }
    const result = await db.query<WorkerRow>(
      `UPDATE workers SET ${setClauses.join(', ')}
        WHERE id = $1 AND farm_id = $2 AND deleted_at IS NULL
        RETURNING ${WORKER_COLUMNS}`,
      values,
    );
    const row = result.rows[0];
    return row === undefined ? null : toWorker(row);
  },

  async softDeleteWorker(db, farmId, workerId) {
    const result = await db.query(
      `UPDATE workers SET deleted_at = now()
        WHERE id = $1 AND farm_id = $2 AND deleted_at IS NULL`,
      [workerId, farmId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async listAttendanceForDate(db, farmId, workDate) {
    const result = await db.query<AttendanceRow & { worker_name: string }>(
      `SELECT ${ATTENDANCE_COLUMNS_A}, w.name AS worker_name
         FROM worker_attendance a
         JOIN workers w ON w.id = a.worker_id
        WHERE w.farm_id = $1 AND w.deleted_at IS NULL AND a.work_date = $2
        ORDER BY w.name ASC, a.created_at ASC`,
      [farmId, workDate],
    );
    return result.rows.map(toAttendanceRecord);
  },

  async upsertAttendance(db, params) {
    const result = await db.query<AttendanceRow>(
      `INSERT INTO worker_attendance (worker_id, work_date, present, farm_crop_id, activity, hours_worked)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (worker_id, work_date) DO UPDATE
         SET present = EXCLUDED.present,
             farm_crop_id = EXCLUDED.farm_crop_id,
             activity = EXCLUDED.activity,
             hours_worked = EXCLUDED.hours_worked,
             updated_at = now()
       RETURNING ${ATTENDANCE_COLUMNS}`,
      [params.workerId, params.workDate, params.present, params.farmCropId, params.activity, params.hoursWorked],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('worker_attendance upsert returned no row');
    return toAttendanceRecord(row);
  },

  async listWorkerAttendance(db, workerId, filters) {
    const conditions: string[] = ['worker_id = $1'];
    const params: unknown[] = [workerId];
    if (filters.from !== undefined && filters.to !== undefined) {
      params.push(filters.from, filters.to);
      conditions.push(`work_date BETWEEN $${params.length - 1} AND $${params.length}`);
    }
    if (filters.farmCropId !== undefined) {
      params.push(filters.farmCropId);
      conditions.push(`farm_crop_id = $${params.length}`);
    }
    const result = await db.query<AttendanceRow>(
      `SELECT ${ATTENDANCE_COLUMNS} FROM worker_attendance
        WHERE ${conditions.join(' AND ')}
        ORDER BY work_date DESC`,
      params,
    );
    return result.rows.map(toAttendanceRecord);
  },

  async listAttendanceForWorkers(db, workerIds, from, to) {
    if (workerIds.length === 0) return [];
    const result = await db.query<AttendanceRow>(
      `SELECT ${ATTENDANCE_COLUMNS} FROM worker_attendance
        WHERE worker_id = ANY($1::uuid[]) AND work_date BETWEEN $2 AND $3
        ORDER BY work_date ASC`,
      [workerIds, from, to],
    );
    return result.rows.map(toAttendanceRecord);
  },

  async sumFarmHours(db, farmId, from, to) {
    // SUM over numeric is exact in Postgres; converting once at the end
    // avoids float accumulation (0.1 + 0.2) that summing in JS would add.
    const result = await db.query<{ hours: string | null }>(
      `SELECT COALESCE(SUM(a.hours_worked), 0)::text AS hours
         FROM worker_attendance a
         JOIN workers w ON w.id = a.worker_id
        WHERE w.farm_id = $1 AND a.work_date BETWEEN $2 AND $3`,
      [farmId, from, to],
    );
    return Number(result.rows[0]?.hours ?? 0);
  },

  async listAttendanceForFarmCrop(db, farmId, farmCropId) {
    // Soft-deleted workers are INCLUDED: the labour they put into this
    // planting happened, and a crop's cost must not shrink because a worker
    // later left the roster.
    const result = await db.query<{
      worker_id: string;
      pay_type: string;
      pay_rate_paise: number;
      work_date: Date;
      present: boolean;
      hours_worked: string | number | null;
    }>(
      `SELECT a.worker_id, w.pay_type, w.pay_rate_paise, a.work_date, a.present, a.hours_worked
         FROM worker_attendance a
         JOIN workers w ON w.id = a.worker_id
        WHERE w.farm_id = $1 AND a.farm_crop_id = $2
        ORDER BY a.work_date ASC`,
      [farmId, farmCropId],
    );
    return result.rows.map((row) => ({
      workerId: row.worker_id,
      payType: toPayType(row.pay_type),
      payRatePaise: Number(row.pay_rate_paise),
      workDate: toDateOnly(row.work_date),
      present: row.present,
      hoursWorked: toHours(row.hours_worked),
    }));
  },

  async listAdvances(db, workerId) {
    const result = await db.query<AdvanceRow>(
      `SELECT ${ADVANCE_COLUMNS} FROM worker_advances
        WHERE worker_id = $1
        ORDER BY given_on DESC, created_at DESC`,
      [workerId],
    );
    return result.rows.map(toWorkerAdvance);
  },

  async insertAdvance(db, params) {
    const result = await db.query<AdvanceRow>(
      `INSERT INTO worker_advances (worker_id, amount_paise, given_on, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING ${ADVANCE_COLUMNS}`,
      [params.workerId, params.amountPaise, params.givenOn, params.notes],
    );
    const row = result.rows[0];
    if (row === undefined) throw new Error('worker_advances insert returned no row');
    return toWorkerAdvance(row);
  },

  async listAdvancesForWorkers(db, workerIds, from, to) {
    if (workerIds.length === 0) return [];
    const result = await db.query<AdvanceRow>(
      `SELECT ${ADVANCE_COLUMNS} FROM worker_advances
        WHERE worker_id = ANY($1::uuid[]) AND given_on BETWEEN $2 AND $3
        ORDER BY given_on ASC`,
      [workerIds, from, to],
    );
    return result.rows.map(toWorkerAdvance);
  },

  async listPayouts(db, workerId) {
    const result = await db.query<PayoutRow>(
      `SELECT ${PAYOUT_COLUMNS} FROM worker_payouts
        WHERE worker_id = $1
        ORDER BY paid_at DESC, created_at DESC`,
      [workerId],
    );
    return result.rows.map(toWorkerPayout);
  },

  async listPayoutsForWorkersAndPeriod(db, workerIds, periodStart, periodEnd) {
    if (workerIds.length === 0) return [];
    const result = await db.query<PayoutRow>(
      `SELECT ${PAYOUT_COLUMNS} FROM worker_payouts
        WHERE worker_id = ANY($1::uuid[]) AND period_start = $2 AND period_end = $3`,
      [workerIds, periodStart, periodEnd],
    );
    return result.rows.map(toWorkerPayout);
  },

  async findPayoutByIdempotencyKey(db, idempotencyKey) {
    const result = await db.query<PayoutRow & { idempotency_key: string }>(
      `SELECT ${PAYOUT_COLUMNS}, idempotency_key FROM worker_payouts WHERE idempotency_key = $1 LIMIT 1`,
      [idempotencyKey],
    );
    const row = result.rows[0];
    return row === undefined ? null : { payout: toWorkerPayout(row), idempotencyKey: row.idempotency_key };
  },

  async insertPayout(db, params) {
    // paid_at is left to its DEFAULT now(): server-stamped, never a client value.
    const result = await db.query<PayoutRow>(
      `INSERT INTO worker_payouts (
         worker_id, period_start, period_end, amount_paise, payment_method, notes, idempotency_key
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING
       RETURNING ${PAYOUT_COLUMNS}`,
      [
        params.workerId,
        params.periodStart,
        params.periodEnd,
        params.amountPaise,
        params.paymentMethod,
        params.notes,
        params.idempotencyKey,
      ],
    );
    const row = result.rows[0];
    return row === undefined ? null : toWorkerPayout(row);
  },
};
