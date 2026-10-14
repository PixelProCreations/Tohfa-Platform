/**
 * workforce.service — business logic for the Farm Workforce feature: a
 * farm's worker roster, daily attendance, cash advances, payroll payouts and
 * three read-only payroll aggregates.
 *
 * AUTHORIZATION SHAPE. One `own`-scoped permission,
 * `farmer.workforce.manage_own`, covers all four 0025 tables — the same
 * one-permission-covers-several-tables pattern `farmer.pest.manage_own`
 * uses. Everything here is FARM-scoped, not plot-scoped (0025 header), so
 * the primary ownership gate is `requireOwnFarm` at the top of every method;
 * a `workerId` is then additionally checked against that same `farm_id`. A
 * farm or worker that exists but belongs to another farmer 404s, never 403
 * (root CLAUDE.md §2.1, BR-36, BR-41e): a 403 would confirm the row exists.
 *
 * BR-41c — PAY IS COMPUTED, NEVER STORED. `computeWorkerPay` below is the
 * ONE function that turns raw attendance/advance/payout rows into
 * gross/advances/net/paidStatus. The workforce summary, the payroll summary,
 * the crop-hours summary AND the payout guard all call it; none of them does
 * its own arithmetic. No column holds a gross or net figure.
 *
 * BR-41d / BR-38 boundary — nothing here is callable from a job, schedules
 * anything, or writes a row the farmer did not explicitly submit in the same
 * request. The only server-supplied values are timestamps (`deleted_at`,
 * `paid_at`, `updated_at` — the database clock, never a client value).
 */
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  workforceRepo,
  type AttendanceRecord,
  type Worker,
  type WorkerAdvance,
  type WorkerPatch,
  type WorkerPayout,
  type WorkforceRepo,
} from './workforce.repo.js';
import {
  idempotencyKeySchema,
  type CreateAdvanceBody,
  type CreatePayoutBody,
  type CreateWorkerBody,
  type CropHoursSummaryResponse,
  type PayType,
  type PayrollSummaryItemResponse,
  type UpdateWorkerBody,
  type UpsertAttendanceBody,
  type WorkerAttendanceQuery,
  type WorkforceSummaryResponse,
} from './workforce.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface WorkforceServiceDeps {
  repo: WorkforceRepo;
  runTx: TransactionRunner;
  db: Executor;
  /**
   * Today's calendar date as YYYY-MM-DD, for "this month" in the workforce
   * summary. Injected so tests are not at the mercy of the wall clock.
   */
  today: () => string;
}

// ---------------------------------------------------------------------------
// calendar helpers (pure, exported for tests)
// ---------------------------------------------------------------------------

/** YYYY-MM-DD -> whole days since the epoch, in UTC so no DST/timezone shift applies. */
function toDayNumber(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** '2026-09' -> { start: '2026-09-01', end: '2026-09-30' }. */
export function monthBounds(yearMonth: string): { start: string; end: string } {
  const [year, month] = yearMonth.split('-').map(Number) as [number, number];
  const mm = String(month).padStart(2, '0');
  return {
    start: `${yearMonth.slice(0, 4)}-${mm}-01`,
    end: `${yearMonth.slice(0, 4)}-${mm}-${String(daysInMonth(year, month)).padStart(2, '0')}`,
  };
}

/**
 * The server's local calendar date (IST on every box for this client), read
 * with local getters — the same reasoning as workforce.repo.ts#toDateOnly:
 * `toISOString()` would give the UTC date, which is "yesterday" for the
 * first 5h30m of every IST day.
 */
export function localToday(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gross pay for a MONTHLY-salaried worker over [periodStart, periodEnd].
 *
 * JUDGMENT CALL (flagged in the stage-2 brief; no rule in docs/rules.md pins
 * it down): a monthly worker earns `payRatePaise` for each calendar month
 * the period FULLY covers, and a calendar-day pro-rata share
 * (floor(rate * daysCovered / daysInThatMonth)) of any month it only
 * partly covers. So:
 *   - '2026-09-01'..'2026-09-30' (the payroll-summary period) = exactly the
 *     monthly rate, which is the "one period = one month's pay" case;
 *   - a mid-month exit ('2026-09-01'..'2026-09-15') = 15/30 of the rate;
 *   - splitting a month into several payout periods can never add up to
 *     more than the whole month, because each part is floored.
 * The alternative ("any period touching the worker earns the flat rate
 * once") was rejected because it lets a farmer — or a client bug — record a
 * full month's salary for each of several one-day periods: the payout guard
 * (amountPaise <= netPayablePaise) would then be no guard at all.
 * Attendance is deliberately NOT consulted for monthly workers: their pay is
 * not tied to specific days.
 * Integer-only: rate <= 2^31 and days <= 31, so rate * days stays far inside
 * Number.MAX_SAFE_INTEGER.
 */
function monthlyGrossPaise(payRatePaise: number, periodStart: string, periodEnd: string): number {
  const startDay = toDayNumber(periodStart);
  const endDay = toDayNumber(periodEnd);
  let total = 0;
  let [year, month] = periodStart.split('-').map(Number) as [number, number];
  for (;;) {
    const mm = String(month).padStart(2, '0');
    const dim = daysInMonth(year, month);
    const monthStart = toDayNumber(`${year}-${mm}-01`);
    const monthEnd = monthStart + dim - 1;
    if (monthStart > endDay) break;
    const covered = Math.min(endDay, monthEnd) - Math.max(startDay, monthStart) + 1;
    if (covered > 0) {
      total += covered === dim ? payRatePaise : Math.floor((payRatePaise * covered) / dim);
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return total;
}

// ---------------------------------------------------------------------------
// BR-41c: the ONE shared payroll-computation function
// ---------------------------------------------------------------------------

export interface PayWorkerInput {
  id: string;
  payType: PayType;
  payRatePaise: number;
}

export interface PayAttendanceInput {
  workerId: string;
  workDate: string;
  present: boolean;
}

export interface PayAdvanceInput {
  workerId: string;
  givenOn: string;
  amountPaise: number;
}

export interface PayPayoutInput {
  workerId: string;
  periodStart: string;
  periodEnd: string;
}

export interface WorkerPay {
  grossPaise: number;
  advancesPaise: number;
  /** grossPaise - advancesPaise. May be negative — see below. */
  netPayablePaise: number;
  paidStatus: 'pending' | 'paid';
}

/**
 * BR-41c. Every endpoint that surfaces a pay figure calls this; nothing
 * computes pay inline. Pure: callers may pass unfiltered rows — only rows for
 * THIS worker and inside [periodStart, periodEnd] (inclusive) are counted.
 *
 *  - daily:   gross = (days in the period marked present) * payRatePaise.
 *             hoursWorked does not scale a daily wage: one present row is
 *             one day's pay (0025 stores one row per worker per day).
 *  - monthly: gross = monthlyGrossPaise (calendar-day pro-rata; see there).
 *  - advancesPaise = SUM(amountPaise) of advances with givenOn in the period.
 *  - netPayablePaise = gross - advances, NOT floored at zero: a negative net
 *    means the worker was advanced more than they earned in the period, and
 *    hiding that would misstate what they owe the farmer. The spec's
 *    PayrollSummaryItem.netPayablePaise has no minimum for exactly this
 *    reason. (The workforce summary's "payroll due" total, which the spec
 *    does floor at 0, handles that at its own level.)
 *  - paidStatus = 'paid' iff a payout exists for this worker with EXACTLY
 *    this periodStart AND periodEnd (0025's uq_worker_payouts_worker_period
 *    key); an overlapping-but-different period does not count.
 *
 * Uses the worker's CURRENT payRatePaise for every day in the period —
 * 0025 keeps no rate history (flagged in the stage-2 report).
 */
export function computeWorkerPay(
  worker: PayWorkerInput,
  attendance: readonly PayAttendanceInput[],
  advances: readonly PayAdvanceInput[],
  payouts: readonly PayPayoutInput[],
  periodStart: string,
  periodEnd: string,
): WorkerPay {
  if (periodStart > periodEnd) {
    throw new Error(`computeWorkerPay: periodStart ${periodStart} is after periodEnd ${periodEnd}`);
  }
  const inPeriod = (date: string): boolean => date >= periodStart && date <= periodEnd;

  let grossPaise: number;
  if (worker.payType === 'daily') {
    const daysPresent = new Set(
      attendance
        .filter((row) => row.workerId === worker.id && row.present && inPeriod(row.workDate))
        .map((row) => row.workDate),
    ).size;
    grossPaise = daysPresent * worker.payRatePaise;
  } else {
    grossPaise = monthlyGrossPaise(worker.payRatePaise, periodStart, periodEnd);
  }

  const advancesPaise = advances
    .filter((row) => row.workerId === worker.id && inPeriod(row.givenOn))
    .reduce((sum, row) => sum + row.amountPaise, 0);

  const paid = payouts.some(
    (row) => row.workerId === worker.id && row.periodStart === periodStart && row.periodEnd === periodEnd,
  );

  return {
    grossPaise,
    advancesPaise,
    netPayablePaise: grossPaise - advancesPaise,
    paidStatus: paid ? 'paid' : 'pending',
  };
}

/** Sum of hours at numeric(4,2) precision, in integer hundredths, so 0.1 + 0.2 stays 0.3. */
function sumHours(values: ReadonlyArray<number | null>): number {
  const hundredths = values.reduce<number>((sum, value) => sum + (value === null ? 0 : Math.round(value * 100)), 0);
  return hundredths / 100;
}

// ---------------------------------------------------------------------------
// service
// ---------------------------------------------------------------------------

/**
 * Dependencies are injected with defaults. Production code calls
 * `workforceService`; tests call `createWorkforceService({ repo: fake })`.
 */
export function createWorkforceService(deps: Partial<WorkforceServiceDeps> = {}): WorkforceService {
  const repo = deps.repo ?? workforceRepo;
  const runTx = deps.runTx ?? withTransaction;
  const db = deps.db ?? pool;
  const today = deps.today ?? (() => localToday());

  /**
   * A `FARMER` role always carries `scope.farmerId` once `own` scope resolves
   * (see requirePermission.ts#resolveScope) — this only trips if a token was
   * minted before farmer approval finished. Mirrors pest.service.ts.
   */
  function requireFarmerId(scope: ResolvedScope): string {
    if (scope.farmerId === undefined) {
      throw new AppError('NOT_FOUND', { detail: 'Farmer profile not found for actor.' });
    }
    return scope.farmerId;
  }

  /** The primary ownership gate. Cross-scope -> 404, never 403 (BR-36, BR-41e). */
  async function requireOwnFarm(tx: Executor, scope: ResolvedScope, farmId: string): Promise<string> {
    const farmerId = requireFarmerId(scope);
    const ownedFarmId = await repo.findOwnedFarmId(tx, { farmerId, farmId });
    if (ownedFarmId === null) {
      throw new AppError('NOT_FOUND', { detail: 'Farm not found.' });
    }
    return ownedFarmId;
  }

  /**
   * A worker on THIS (already owned) farm. `includeDeleted` is for history
   * reads only (attendance/advance/payout lists): a removed worker's history
   * stays reachable, but a removed worker cannot be fetched, edited, marked
   * present, advanced or paid. Another farm's worker is the same 404 as a
   * missing one.
   */
  async function requireFarmWorker(
    tx: Executor,
    farmId: string,
    workerId: string,
    options: { includeDeleted?: boolean } = {},
  ): Promise<Worker> {
    const worker = await repo.findWorker(tx, farmId, workerId, options);
    if (worker === null) {
      throw new AppError('NOT_FOUND', { detail: 'Worker not found.' });
    }
    return worker;
  }

  /** Mirrors pest.service.ts#requireOwnUpload; `field` names the offending body key. */
  async function requireOwnUpload(
    tx: Executor,
    scope: ResolvedScope,
    uploadId: string,
    field: 'idProofUploadId' | 'photoUploadId',
  ): Promise<void> {
    const ownerId = await repo.findUploadOwner(tx, uploadId);
    if (ownerId === undefined) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: `${field} does not reference an existing upload.`,
      });
    }
    if (ownerId !== scope.userId) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: `${field} does not reference an upload you own.`,
      });
    }
  }

  /**
   * Runs the BR-41c function for several workers over one period, with ONE
   * batched read per raw table. Every pay figure the service returns comes
   * out of here, so the summary, payroll summary and payout guard cannot
   * disagree for the same worker and period.
   */
  async function payForWorkers(
    exec: Executor,
    workers: readonly Worker[],
    periodStart: string,
    periodEnd: string,
  ): Promise<Array<{ worker: Worker; pay: WorkerPay }>> {
    const ids = workers.map((w) => w.id);
    const [attendance, advances, payouts] = await Promise.all([
      repo.listAttendanceForWorkers(exec, ids, periodStart, periodEnd),
      repo.listAdvancesForWorkers(exec, ids, periodStart, periodEnd),
      repo.listPayoutsForWorkersAndPeriod(exec, ids, periodStart, periodEnd),
    ]);
    return workers.map((worker) => ({
      worker,
      pay: computeWorkerPay(worker, attendance, advances, payouts, periodStart, periodEnd),
    }));
  }

  function samePayoutRequest(stored: WorkerPayout, workerId: string, body: CreatePayoutBody): boolean {
    return (
      stored.workerId === workerId &&
      stored.periodStart === body.periodStart &&
      stored.periodEnd === body.periodEnd &&
      stored.amountPaise === body.amountPaise &&
      stored.paymentMethod === body.paymentMethod &&
      stored.notes === (body.notes ?? null)
    );
  }

  /**
   * Idempotent replay, the wallet_transactions mechanism
   * (wallet.service.ts#move): same key + identical request -> the original
   * row; same key + anything different -> 409 IDEMPOTENCY_KEY_REUSED. A key
   * used for a different worker (even another farmer's) is the same 409,
   * which reveals nothing about that other payout.
   */
  async function replayPayout(
    tx: Executor,
    idempotencyKey: string,
    workerId: string,
    body: CreatePayoutBody,
  ): Promise<WorkerPayout | null> {
    const stored = await repo.findPayoutByIdempotencyKey(tx, idempotencyKey);
    if (stored === null) return null;
    if (!samePayoutRequest(stored.payout, workerId, body)) {
      throw new AppError('IDEMPOTENCY_KEY_REUSED', {
        status: 409,
        detail: 'Idempotency-Key was already used for a different payout request.',
      });
    }
    return stored.payout;
  }

  return {
    // -----------------------------------------------------------------------
    // workers
    // -----------------------------------------------------------------------

    async listWorkers(scope, farmId) {
      await requireOwnFarm(db, scope, farmId);
      return repo.listActiveWorkers(db, farmId);
    },

    async getWorker(scope, farmId, workerId) {
      await requireOwnFarm(db, scope, farmId);
      return requireFarmWorker(db, farmId, workerId);
    },

    async createWorker(scope, farmId, body) {
      return runTx(async (tx) => {
        await requireOwnFarm(tx, scope, farmId);
        if (body.idProofUploadId !== undefined) {
          await requireOwnUpload(tx, scope, body.idProofUploadId, 'idProofUploadId');
        }
        if (body.photoUploadId !== undefined) {
          await requireOwnUpload(tx, scope, body.photoUploadId, 'photoUploadId');
        }

        const worker = await repo.insertWorker(tx, {
          farmId,
          name: body.name,
          roleTitle: body.roleTitle ?? null,
          dateOfBirth: body.dateOfBirth ?? null,
          gender: body.gender ?? null,
          idProofUploadId: body.idProofUploadId ?? null,
          photoUploadId: body.photoUploadId ?? null,
          bankAccountNo: body.bankAccountNo ?? null,
          ifscCode: body.ifscCode ?? null,
          upiId: body.upiId ?? null,
          payType: body.payType,
          payRatePaise: body.payRatePaise,
        });

        // Bank/UPI details are deliberately left out of the audit payload:
        // audit_log is readable by admins who have no need for a worker's
        // account number.
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.workforce.worker.create',
          entityType: 'worker',
          entityId: worker.id,
          after: { farmId, name: worker.name, payType: worker.payType, payRatePaise: worker.payRatePaise },
        });
        return worker;
      });
    },

    async updateWorker(scope, farmId, workerId, body) {
      return runTx(async (tx) => {
        await requireOwnFarm(tx, scope, farmId);
        const existing = await requireFarmWorker(tx, farmId, workerId);

        // Only a NEW upload id is checked; `null` (clear) needs no check.
        if (typeof body.idProofUploadId === 'string') {
          await requireOwnUpload(tx, scope, body.idProofUploadId, 'idProofUploadId');
        }
        if (typeof body.photoUploadId === 'string') {
          await requireOwnUpload(tx, scope, body.photoUploadId, 'photoUploadId');
        }

        // PATCH: a key present in the body changes (null clears); an absent
        // key is untouched. Zod already strips nothing (`.strict()`), so the
        // body's own keys are exactly what the client sent.
        const patch: WorkerPatch = {};
        const has = (key: keyof UpdateWorkerBody): boolean => Object.prototype.hasOwnProperty.call(body, key);
        if (body.name !== undefined) patch.name = body.name;
        if (body.payType !== undefined) patch.payType = body.payType;
        if (body.payRatePaise !== undefined) patch.payRatePaise = body.payRatePaise;
        if (has('roleTitle')) patch.roleTitle = body.roleTitle ?? null;
        if (has('dateOfBirth')) patch.dateOfBirth = body.dateOfBirth ?? null;
        if (has('gender')) patch.gender = body.gender ?? null;
        if (has('idProofUploadId')) patch.idProofUploadId = body.idProofUploadId ?? null;
        if (has('photoUploadId')) patch.photoUploadId = body.photoUploadId ?? null;
        if (has('bankAccountNo')) patch.bankAccountNo = body.bankAccountNo ?? null;
        if (has('ifscCode')) patch.ifscCode = body.ifscCode ?? null;
        if (has('upiId')) patch.upiId = body.upiId ?? null;

        const updated = await repo.updateWorker(tx, farmId, workerId, patch);
        if (updated === null) {
          throw new AppError('NOT_FOUND', { detail: 'Worker not found.' });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.workforce.worker.update',
          entityType: 'worker',
          entityId: workerId,
          before: { name: existing.name, payType: existing.payType, payRatePaise: existing.payRatePaise },
          after: { name: updated.name, payType: updated.payType, payRatePaise: updated.payRatePaise },
          changedFields: Object.keys(patch),
        });
        return updated;
      });
    },

    /**
     * Soft delete: `deleted_at = now()` (database clock, never a client
     * value). The row and its history stay; an already-removed worker is a
     * 404, the same as one that never existed.
     */
    async deleteWorker(scope, farmId, workerId) {
      await runTx(async (tx) => {
        await requireOwnFarm(tx, scope, farmId);
        const existing = await requireFarmWorker(tx, farmId, workerId);
        if (!(await repo.softDeleteWorker(tx, farmId, workerId))) {
          throw new AppError('NOT_FOUND', { detail: 'Worker not found.' });
        }
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.workforce.worker.delete',
          entityType: 'worker',
          entityId: workerId,
          before: { farmId, name: existing.name },
        });
      });
    },

    // -----------------------------------------------------------------------
    // attendance
    // -----------------------------------------------------------------------

    /**
     * Existing rows only. docs/openapi.yaml listMyFarmAttendanceForDate:
     * "Workers with no logged row for that date are omitted, not backfilled
     * with a synthetic absent record" — and AttendanceRecord requires a
     * non-null `id`, `present` and `createdAt`, none of which an unmarked
     * worker has. The client pairs this with GET /workers to show
     * "not yet marked". Soft-deleted workers' rows are excluded here (this
     * is the roster screen); they remain in the per-worker history.
     */
    async listAttendanceForDate(scope, farmId, date) {
      await requireOwnFarm(db, scope, farmId);
      return repo.listAttendanceForDate(db, farmId, date);
    },

    /**
     * All-or-nothing: every item is validated before the first write, and
     * everything runs in one transaction, so a bad item rejects the whole
     * batch with nothing applied.
     *
     * Audit: ONE audit_log row PER UPSERTED ATTENDANCE ROW (entity =
     * worker_attendance id), not one batch row — so a single day's record can
     * be traced from its own id, the way every other entity in this repo is.
     */
    async upsertAttendance(scope, farmId, body) {
      return runTx(async (tx) => {
        await requireOwnFarm(tx, scope, farmId);

        const seen = new Set<string>();
        for (const item of body.items) {
          if (seen.has(item.workerId)) {
            throw new AppError('VALIDATION_FAILED', {
              status: 422,
              detail: `workerId ${item.workerId} appears more than once; one entry per worker per day.`,
            });
          }
          seen.add(item.workerId);
          // 0025 column comment: hours_worked is "Null when the worker was
          // marked absent". Hours on an absent row are contradictory.
          if (!item.present && item.hoursWorked !== undefined) {
            throw new AppError('VALIDATION_FAILED', {
              status: 422,
              detail: `hoursWorked cannot be set for workerId ${item.workerId}, who is marked absent.`,
            });
          }
        }

        // One message for "no such worker" and "another farm's worker", so the
        // check cannot be used to probe for other farmers' worker ids.
        const roster = new Map((await repo.listActiveWorkers(tx, farmId)).map((w) => [w.id, w]));
        for (const item of body.items) {
          if (!roster.has(item.workerId)) {
            throw new AppError('VALIDATION_FAILED', {
              status: 422,
              detail: `workerId ${item.workerId} is not on this farm's active roster.`,
            });
          }
        }

        const farmCropIds = [...new Set(body.items.flatMap((i) => (i.farmCropId === undefined ? [] : [i.farmCropId])))];
        for (const farmCropId of farmCropIds) {
          if (!(await repo.farmCropExistsOnFarm(tx, farmId, farmCropId))) {
            throw new AppError('VALIDATION_FAILED', {
              status: 422,
              detail: `farmCropId ${farmCropId} does not reference a crop on this farm.`,
            });
          }
        }

        const saved: AttendanceRecord[] = [];
        for (const item of body.items) {
          let record: AttendanceRecord;
          try {
            record = await repo.upsertAttendance(tx, {
              workerId: item.workerId,
              workDate: body.date,
              present: item.present,
              farmCropId: item.farmCropId ?? null,
              activity: item.activity ?? null,
              hoursWorked: item.hoursWorked ?? null,
            });
          } catch (error: unknown) {
            // BR-41b second layer: a value Zod accepts (> 0) but numeric(4,2)
            // rounds to 0.00 trips chk_worker_attendance_hours. That is the
            // client's bad input, not a server fault.
            if ((error as { code?: string }).code === '23514') {
              throw new AppError('VALIDATION_FAILED', {
                status: 422,
                detail: `hoursWorked for workerId ${item.workerId} must be in (0, 24].`,
                cause: error,
              });
            }
            throw error;
          }
          await writeAuditLog(tx, {
            actorId: scope.userId,
            actorRole: scope.roleCode,
            actionCode: 'farmer.workforce.attendance.upsert',
            entityType: 'worker_attendance',
            entityId: record.id,
            after: {
              workerId: record.workerId,
              workDate: record.workDate,
              present: record.present,
              hoursWorked: record.hoursWorked,
              farmCropId: record.farmCropId,
            },
          });
          saved.push({ ...record, workerName: roster.get(item.workerId)!.name });
        }
        return saved;
      });
    },

    async listWorkerAttendance(scope, farmId, workerId, query) {
      await requireOwnFarm(db, scope, farmId);
      await requireFarmWorker(db, farmId, workerId, { includeDeleted: true });
      const bounds = query.month === undefined ? undefined : monthBounds(query.month);
      return repo.listWorkerAttendance(db, workerId, {
        ...(bounds !== undefined ? { from: bounds.start, to: bounds.end } : {}),
        ...(query.farmCropId !== undefined ? { farmCropId: query.farmCropId } : {}),
      });
    },

    // -----------------------------------------------------------------------
    // advances (insert-only — there is deliberately no update/delete)
    // -----------------------------------------------------------------------

    async listAdvances(scope, farmId, workerId) {
      await requireOwnFarm(db, scope, farmId);
      await requireFarmWorker(db, farmId, workerId, { includeDeleted: true });
      return repo.listAdvances(db, workerId);
    },

    async createAdvance(scope, farmId, workerId, body) {
      return runTx(async (tx) => {
        await requireOwnFarm(tx, scope, farmId);
        await requireFarmWorker(tx, farmId, workerId);
        const advance = await repo.insertAdvance(tx, {
          workerId,
          amountPaise: body.amountPaise,
          givenOn: body.givenOn,
          notes: body.notes ?? null,
        });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.workforce.advance.create',
          entityType: 'worker_advance',
          entityId: advance.id,
          after: { workerId, amountPaise: advance.amountPaise, givenOn: advance.givenOn },
        });
        return advance;
      });
    },

    // -----------------------------------------------------------------------
    // payouts (money-moving: Idempotency-Key required, root CLAUDE.md §2.4)
    // -----------------------------------------------------------------------

    async listPayouts(scope, farmId, workerId) {
      await requireOwnFarm(db, scope, farmId);
      await requireFarmWorker(db, farmId, workerId, { includeDeleted: true });
      return repo.listPayouts(db, workerId);
    },

    /**
     * Order matters:
     *  1. Idempotency-Key present and a UUID (400 otherwise — a malformed
     *     request, before any lookup).
     *  2. Farm, then worker, ownership (404, never 403).
     *  3. periodStart <= periodEnd (422).
     *  4. Replay check BEFORE the pay guard, so a retried request returns the
     *     original payout even if an advance logged since would now make the
     *     guard fail.
     *  5. Period already paid -> 409 CONFLICT (the spec's declared 409).
     *  6. amountPaise > computeWorkerPay(...).netPayablePaise -> 422: an
     *     impossible payout (more than earned, net of advances) is refused
     *     rather than recorded.
     *  7. INSERT ... ON CONFLICT DO NOTHING. A null result means a concurrent
     *     request won one of the two unique constraints between steps 4-5 and
     *     here: same key -> replay it; otherwise -> 409 CONFLICT. Using DO
     *     NOTHING instead of catching 23505 keeps the transaction usable for
     *     that follow-up read (a raised unique violation aborts it).
     */
    async createPayout(scope, farmId, workerId, body, idempotencyKey) {
      const parsedKey = idempotencyKeySchema.safeParse(idempotencyKey);
      if (!parsedKey.success) {
        throw new AppError('BAD_REQUEST', {
          status: 400,
          detail: 'An Idempotency-Key header (UUID) is required to record a payout.',
        });
      }
      const key = parsedKey.data;

      return runTx(async (tx) => {
        await requireOwnFarm(tx, scope, farmId);
        const worker = await requireFarmWorker(tx, farmId, workerId);

        if (body.periodStart > body.periodEnd) {
          throw new AppError('VALIDATION_FAILED', {
            status: 422,
            detail: 'periodStart must be on or before periodEnd.',
          });
        }

        const replayed = await replayPayout(tx, key, workerId, body);
        if (replayed !== null) return replayed;

        const [computed] = await payForWorkers(tx, [worker], body.periodStart, body.periodEnd);
        const pay = computed!.pay;
        if (pay.paidStatus === 'paid') {
          throw new AppError('CONFLICT', {
            status: 409,
            detail: 'A payout has already been recorded for this worker and period.',
          });
        }
        if (body.amountPaise > pay.netPayablePaise) {
          throw new AppError('VALIDATION_FAILED', {
            status: 422,
            detail: `amountPaise ${body.amountPaise} exceeds the net payable ${pay.netPayablePaise} for this period.`,
            meta: { netPayablePaise: pay.netPayablePaise },
          });
        }

        const payout = await repo.insertPayout(tx, {
          workerId,
          periodStart: body.periodStart,
          periodEnd: body.periodEnd,
          amountPaise: body.amountPaise,
          paymentMethod: body.paymentMethod,
          notes: body.notes ?? null,
          idempotencyKey: key,
        });
        if (payout === null) {
          const raced = await replayPayout(tx, key, workerId, body);
          if (raced !== null) return raced;
          throw new AppError('CONFLICT', {
            status: 409,
            detail: 'A payout has already been recorded for this worker and period.',
          });
        }

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'farmer.workforce.payout.create',
          entityType: 'worker_payout',
          entityId: payout.id,
          after: {
            workerId,
            periodStart: payout.periodStart,
            periodEnd: payout.periodEnd,
            amountPaise: payout.amountPaise,
            paymentMethod: payout.paymentMethod,
            grossPaise: pay.grossPaise,
            advancesPaise: pay.advancesPaise,
            netPayablePaise: pay.netPayablePaise,
          },
        });
        return payout;
      });
    },

    // -----------------------------------------------------------------------
    // read-only aggregates (BR-41c)
    // -----------------------------------------------------------------------

    /**
     * - workerCount: active (non-deleted) workers.
     * - hoursThisMonth: SUM(hours_worked) this calendar month across ALL of
     *   the farm's workers, including ones since removed — those hours were
     *   worked on this farm this month.
     * - payrollDueThisMonthPaise: the SAME per-worker figures
     *   getPayrollSummary returns for this month (one call to payForWorkers
     *   over the same active roster), summed over workers still `pending`,
     *   each floored at 0. Two deviations from a raw SUM(netPayablePaise),
     *   both forced by the contract: the spec declares this field
     *   `minimum: 0`, and a worker who was over-advanced (negative net) does
     *   not reduce what is due to everyone else; and "due" excludes a worker
     *   whose period payout is already recorded (paying them must not leave
     *   them counted as still owed).
     */
    async getSummary(scope, farmId): Promise<WorkforceSummaryResponse> {
      await requireOwnFarm(db, scope, farmId);
      const { start, end } = monthBounds(today().slice(0, 7));
      const workers = await repo.listActiveWorkers(db, farmId);
      const [payroll, hoursThisMonth] = await Promise.all([
        payForWorkers(db, workers, start, end),
        repo.sumFarmHours(db, farmId, start, end),
      ]);
      const payrollDueThisMonthPaise = payroll
        .filter(({ pay }) => pay.paidStatus === 'pending')
        .reduce((sum, { pay }) => sum + Math.max(0, pay.netPayablePaise), 0);
      return { workerCount: workers.length, hoursThisMonth, payrollDueThisMonthPaise };
    },

    /** One item per ACTIVE worker, for the calendar month `period` (YYYY-MM). */
    async getPayrollSummary(scope, farmId, period): Promise<PayrollSummaryItemResponse[]> {
      await requireOwnFarm(db, scope, farmId);
      const { start, end } = monthBounds(period);
      const workers = await repo.listActiveWorkers(db, farmId);
      const payroll = await payForWorkers(db, workers, start, end);
      return payroll.map(({ worker, pay }) => ({
        workerId: worker.id,
        workerName: worker.name,
        grossPaise: pay.grossPaise,
        advancesPaise: pay.advancesPaise,
        netPayablePaise: pay.netPayablePaise,
        paidStatus: pay.paidStatus,
      }));
    },

    /**
     * Labour attributed to one planting. Only PRESENT rows count (an absent
     * row tagged to a crop records no work on it). Soft-deleted workers are
     * included (the work happened).
     *
     * - totalCostPaise: for each DAILY worker, computeWorkerPay over their
     *   rows against this crop (so: days present * payRatePaise — one row is
     *   one worker-day on one crop, no hourly split). MONTHLY workers are
     *   EXCLUDED from cost: their salary is not tied to specific days, so
     *   no per-day share can be attributed without inventing a rule.
     * - hoursLogged: SUM(hoursWorked) over all present rows, BOTH pay types.
     * - workersInvolved: distinct workers (both pay types) with >= 1 present
     *   row against this crop.
     * - avgRatePaise: totalCostPaise / (number of daily-worker-days counted
     *   in totalCostPaise), floored; 0 when there are none. I.e. the
     *   day-weighted average daily wage of the cost that WAS attributed.
     *   Monthly workers are in neither numerator nor denominator, so the
     *   figure stays "average cost of a costed labour-day" rather than being
     *   diluted by days that carry no cost.
     */
    async getCropHoursSummary(scope, farmId, farmCropId): Promise<CropHoursSummaryResponse> {
      await requireOwnFarm(db, scope, farmId);
      // Spec: a farmCropId not reachable from this farm's own plots 404s.
      // A soft-deleted planting still has history, so it is allowed here.
      if (!(await repo.farmCropExistsOnFarm(db, farmId, farmCropId, { includeDeleted: true }))) {
        throw new AppError('NOT_FOUND', { detail: 'Farm crop not found.' });
      }
      const rows = (await repo.listAttendanceForFarmCrop(db, farmId, farmCropId)).filter((r) => r.present);
      if (rows.length === 0) {
        return { totalCostPaise: 0, hoursLogged: 0, workersInvolved: 0, avgRatePaise: 0 };
      }

      const byWorker = new Map<string, { worker: PayWorkerInput; rows: typeof rows }>();
      for (const row of rows) {
        const entry = byWorker.get(row.workerId);
        if (entry === undefined) {
          byWorker.set(row.workerId, {
            worker: { id: row.workerId, payType: row.payType, payRatePaise: row.payRatePaise },
            rows: [row],
          });
        } else {
          entry.rows.push(row);
        }
      }

      const firstDate = rows.reduce((min, r) => (r.workDate < min ? r.workDate : min), rows[0]!.workDate);
      const lastDate = rows.reduce((max, r) => (r.workDate > max ? r.workDate : max), rows[0]!.workDate);

      let totalCostPaise = 0;
      let costedDays = 0;
      for (const { worker, rows: workerRows } of byWorker.values()) {
        if (worker.payType !== 'daily') continue;
        const pay = computeWorkerPay(worker, workerRows, [], [], firstDate, lastDate);
        totalCostPaise += pay.grossPaise;
        costedDays += pay.grossPaise / worker.payRatePaise;
      }

      return {
        totalCostPaise,
        hoursLogged: sumHours(rows.map((r) => r.hoursWorked)),
        workersInvolved: byWorker.size,
        avgRatePaise: costedDays === 0 ? 0 : Math.floor(totalCostPaise / costedDays),
      };
    },
  };
}

export interface WorkforceService {
  listWorkers(scope: ResolvedScope, farmId: string): Promise<Worker[]>;
  getWorker(scope: ResolvedScope, farmId: string, workerId: string): Promise<Worker>;
  createWorker(scope: ResolvedScope, farmId: string, body: CreateWorkerBody): Promise<Worker>;
  updateWorker(scope: ResolvedScope, farmId: string, workerId: string, body: UpdateWorkerBody): Promise<Worker>;
  deleteWorker(scope: ResolvedScope, farmId: string, workerId: string): Promise<void>;

  listAttendanceForDate(scope: ResolvedScope, farmId: string, date: string): Promise<AttendanceRecord[]>;
  upsertAttendance(scope: ResolvedScope, farmId: string, body: UpsertAttendanceBody): Promise<AttendanceRecord[]>;
  listWorkerAttendance(
    scope: ResolvedScope,
    farmId: string,
    workerId: string,
    query: WorkerAttendanceQuery,
  ): Promise<AttendanceRecord[]>;

  listAdvances(scope: ResolvedScope, farmId: string, workerId: string): Promise<WorkerAdvance[]>;
  createAdvance(scope: ResolvedScope, farmId: string, workerId: string, body: CreateAdvanceBody): Promise<WorkerAdvance>;

  listPayouts(scope: ResolvedScope, farmId: string, workerId: string): Promise<WorkerPayout[]>;
  createPayout(
    scope: ResolvedScope,
    farmId: string,
    workerId: string,
    body: CreatePayoutBody,
    idempotencyKey: string | undefined,
  ): Promise<WorkerPayout>;

  getSummary(scope: ResolvedScope, farmId: string): Promise<WorkforceSummaryResponse>;
  getPayrollSummary(scope: ResolvedScope, farmId: string, period: string): Promise<PayrollSummaryItemResponse[]>;
  getCropHoursSummary(scope: ResolvedScope, farmId: string, farmCropId: string): Promise<CropHoursSummaryResponse>;
}

/** The production instance. */
export const workforceService: WorkforceService = createWorkforceService();

// Exported for tests only: keeps the pure calendar helper reachable without
// widening the service interface.
export const __testing = { monthlyGrossPaise, sumHours };
