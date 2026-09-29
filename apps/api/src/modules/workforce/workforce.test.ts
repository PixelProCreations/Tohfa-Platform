/**
 * Two layers of test, always (see apps/api/CLAUDE.md), mirroring pest.test.ts:
 *
 *  1. PURE + SCHEMA + SERVICE tests with a fake repo. Fast, no I/O. This is
 *     where BR-36/BR-41e (a farm or worker belonging to a different farmer
 *     404s, never 403, and nothing is written), BR-41a/b (rate and hours
 *     validation), BR-41c (one shared pay function, every endpoint agrees)
 *     and BR-41d (no job writes attendance/payouts) are asserted.
 *
 *  2. describeIfDatabase-gated integration tests against a real pool,
 *     proving the 0025 tables (and 0026's idempotency key) round-trip
 *     through Postgres and that the DB CHECKs are the second layer of
 *     BR-41a/b. Each runs inside a transaction that rolls back.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { API_ROOT } from '../../paths.js';
import { JOB_REGISTRY } from '../../jobs/queue.js';
import {
  __testing,
  computeWorkerPay,
  createWorkforceService,
  localToday,
  monthBounds,
  type PayAttendanceInput,
} from './workforce.service.js';
import type {
  AttendanceRecord,
  CropAttendanceRow,
  InsertAdvanceParams,
  InsertPayoutParams,
  InsertWorkerParams,
  UpsertAttendanceParams,
  Worker,
  WorkerAdvance,
  WorkerPatch,
  WorkerPayout,
  WorkforceRepo,
} from './workforce.repo.js';
import {
  attendanceForDateQuery,
  createAdvanceBody,
  createPayoutBody,
  createWorkerBody,
  payrollSummaryQuery,
  updateWorkerBody,
  upsertAttendanceBody,
  type CreatePayoutBody,
} from './workforce.schema.js';
import { IDS, aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

const FARMER_A = IDS.farmer;
const USER_A = IDS.userFarmer;
const FARM_A = newId();
const FARM_B = newId(); // owned by someone else
const FARMER_B = newId();
const FIXED_NOW = '2026-09-29T10:00:00.000Z';
const TODAY = '2026-09-29';

function farmerScope(overrides: Partial<ResolvedScope> = {}): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    permission: 'farmer.workforce.manage_own',
    roleCode: RoleCode.FARMER,
    userId: USER_A,
    farmerId: FARMER_A,
    ...overrides,
  });
}

/** Farmer B, who owns FARM_B and nothing of A's. */
function otherFarmerScope(): ResolvedScope {
  return farmerScope({ farmerId: FARMER_B, userId: newId() });
}

function farmerScopeWithoutFarmerId(): ResolvedScope {
  const { farmerId: _farmerId, ...rest } = farmerScope();
  return rest as ResolvedScope;
}

function aWorker(overrides: Partial<Worker> = {}): Worker {
  return {
    id: newId(),
    farmId: FARM_A,
    name: 'Muthu Selvam',
    roleTitle: 'Field Worker',
    dateOfBirth: null,
    gender: null,
    idProofUploadId: null,
    photoUploadId: null,
    bankAccountNo: null,
    ifscCode: null,
    upiId: null,
    payType: 'daily',
    payRatePaise: 60_000,
    createdAt: FIXED_NOW,
    updatedAt: null,
    ...overrides,
  };
}

function anAttendance(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: newId(),
    workerId: newId(),
    farmCropId: null,
    workDate: '2026-09-10',
    present: true,
    activity: null,
    hoursWorked: 8,
    createdAt: FIXED_NOW,
    updatedAt: null,
    ...overrides,
  };
}

function anAdvance(overrides: Partial<WorkerAdvance> = {}): WorkerAdvance {
  return {
    id: newId(),
    workerId: newId(),
    amountPaise: 10_000,
    givenOn: '2026-09-15',
    notes: null,
    createdAt: FIXED_NOW,
    ...overrides,
  };
}

function payoutBody(overrides: Partial<CreatePayoutBody> = {}): CreatePayoutBody {
  return {
    periodStart: '2026-09-01',
    periodEnd: '2026-09-30',
    amountPaise: 60_000,
    paymentMethod: 'cash',
    ...overrides,
  };
}

interface StoredPayout {
  payout: WorkerPayout;
  key: string;
}

interface FakeRepoOptions {
  farms?: Array<{ farmId: string; farmerId: string }>;
  workers?: Worker[];
  deletedWorkerIds?: string[];
  uploads?: Map<string, string | null>;
  farmCrops?: Array<{ id: string; farmId: string; deleted?: boolean }>;
  attendance?: AttendanceRecord[];
  advances?: WorkerAdvance[];
  payouts?: StoredPayout[];
  /** Simulates a concurrent winner: insertPayout returns null once. */
  insertPayoutLosesRace?: boolean;
}

interface RepoCalls {
  insertWorker: InsertWorkerParams[];
  updateWorker: Array<{ workerId: string; patch: WorkerPatch }>;
  softDeleteWorker: string[];
  upsertAttendance: UpsertAttendanceParams[];
  insertAdvance: InsertAdvanceParams[];
  insertPayout: InsertPayoutParams[];
}

function writeCount(calls: RepoCalls): number {
  return (
    calls.insertWorker.length +
    calls.updateWorker.length +
    calls.softDeleteWorker.length +
    calls.upsertAttendance.length +
    calls.insertAdvance.length +
    calls.insertPayout.length
  );
}

function fakeRepo(options: FakeRepoOptions = {}): { repo: WorkforceRepo; calls: RepoCalls } {
  const farms = options.farms ?? [
    { farmId: FARM_A, farmerId: FARMER_A },
    { farmId: FARM_B, farmerId: FARMER_B },
  ];
  const workers = new Map((options.workers ?? []).map((w) => [w.id, w]));
  const deleted = new Set(options.deletedWorkerIds ?? []);
  const uploads = options.uploads ?? new Map<string, string | null>();
  const farmCrops = options.farmCrops ?? [];
  const attendance = [...(options.attendance ?? [])];
  const advances = [...(options.advances ?? [])];
  const payouts = [...(options.payouts ?? [])];
  let loseRace = options.insertPayoutLosesRace === true;

  const calls: RepoCalls = {
    insertWorker: [],
    updateWorker: [],
    softDeleteWorker: [],
    upsertAttendance: [],
    insertAdvance: [],
    insertPayout: [],
  };

  const between = (d: string, from: string, to: string): boolean => d >= from && d <= to;

  const repo: WorkforceRepo = {
    async findOwnedFarmId(_db, args) {
      return farms.find((f) => f.farmId === args.farmId && f.farmerId === args.farmerId)?.farmId ?? null;
    },
    async findUploadOwner(_db, uploadId) {
      if (!uploads.has(uploadId)) return undefined;
      return uploads.get(uploadId) ?? null;
    },
    async farmCropExistsOnFarm(_db, farmId, farmCropId, opts = {}) {
      return farmCrops.some(
        (fc) => fc.id === farmCropId && fc.farmId === farmId && (opts.includeDeleted === true || fc.deleted !== true),
      );
    },

    async listActiveWorkers(_db, farmId) {
      return [...workers.values()].filter((w) => w.farmId === farmId && !deleted.has(w.id));
    },
    async findWorker(_db, farmId, workerId, opts = {}) {
      const w = workers.get(workerId);
      if (w === undefined || w.farmId !== farmId) return null;
      if (deleted.has(workerId) && opts.includeDeleted !== true) return null;
      return w;
    },
    async insertWorker(_db, params) {
      calls.insertWorker.push(params);
      const worker = aWorker({ ...params, id: newId() });
      workers.set(worker.id, worker);
      return worker;
    },
    async updateWorker(_db, farmId, workerId, patch) {
      calls.updateWorker.push({ workerId, patch });
      const existing = workers.get(workerId);
      if (existing === undefined || existing.farmId !== farmId || deleted.has(workerId)) return null;
      const updated = { ...existing, ...patch, updatedAt: FIXED_NOW } as Worker;
      workers.set(workerId, updated);
      return updated;
    },
    async softDeleteWorker(_db, farmId, workerId) {
      calls.softDeleteWorker.push(workerId);
      const existing = workers.get(workerId);
      if (existing === undefined || existing.farmId !== farmId || deleted.has(workerId)) return false;
      deleted.add(workerId);
      return true;
    },

    async listAttendanceForDate(_db, farmId, workDate) {
      return attendance
        .filter((a) => {
          const w = workers.get(a.workerId);
          return w !== undefined && w.farmId === farmId && !deleted.has(w.id) && a.workDate === workDate;
        })
        .map((a) => ({ ...a, workerName: workers.get(a.workerId)!.name }));
    },
    async upsertAttendance(_db, params) {
      calls.upsertAttendance.push(params);
      const index = attendance.findIndex((a) => a.workerId === params.workerId && a.workDate === params.workDate);
      const record = anAttendance({
        ...(index >= 0 ? { id: attendance[index]!.id } : {}),
        workerId: params.workerId,
        workDate: params.workDate,
        present: params.present,
        farmCropId: params.farmCropId,
        activity: params.activity,
        hoursWorked: params.hoursWorked,
      });
      if (index >= 0) attendance[index] = record;
      else attendance.push(record);
      return record;
    },
    async listWorkerAttendance(_db, workerId, filters) {
      return attendance.filter(
        (a) =>
          a.workerId === workerId &&
          (filters.from === undefined || between(a.workDate, filters.from, filters.to!)) &&
          (filters.farmCropId === undefined || a.farmCropId === filters.farmCropId),
      );
    },
    async listAttendanceForWorkers(_db, workerIds, from, to) {
      return attendance.filter((a) => workerIds.includes(a.workerId) && between(a.workDate, from, to));
    },
    async sumFarmHours(_db, farmId, from, to) {
      return __testing.sumHours(
        attendance
          .filter((a) => workers.get(a.workerId)?.farmId === farmId && between(a.workDate, from, to))
          .map((a) => a.hoursWorked),
      );
    },
    async listAttendanceForFarmCrop(_db, farmId, farmCropId): Promise<CropAttendanceRow[]> {
      return attendance
        .filter((a) => a.farmCropId === farmCropId && workers.get(a.workerId)?.farmId === farmId)
        .map((a) => {
          const w = workers.get(a.workerId)!;
          return {
            workerId: a.workerId,
            payType: w.payType,
            payRatePaise: w.payRatePaise,
            workDate: a.workDate,
            present: a.present,
            hoursWorked: a.hoursWorked,
          };
        });
    },

    async listAdvances(_db, workerId) {
      return advances.filter((a) => a.workerId === workerId);
    },
    async insertAdvance(_db, params) {
      calls.insertAdvance.push(params);
      const advance = anAdvance({ ...params, id: newId() });
      advances.push(advance);
      return advance;
    },
    async listAdvancesForWorkers(_db, workerIds, from, to) {
      return advances.filter((a) => workerIds.includes(a.workerId) && between(a.givenOn, from, to));
    },

    async listPayouts(_db, workerId) {
      return payouts.filter((p) => p.payout.workerId === workerId).map((p) => p.payout);
    },
    async listPayoutsForWorkersAndPeriod(_db, workerIds, periodStart, periodEnd) {
      return payouts
        .map((p) => p.payout)
        .filter((p) => workerIds.includes(p.workerId) && p.periodStart === periodStart && p.periodEnd === periodEnd);
    },
    async findPayoutByIdempotencyKey(_db, key) {
      const stored = payouts.find((p) => p.key === key);
      return stored === undefined ? null : { payout: stored.payout, idempotencyKey: stored.key };
    },
    async insertPayout(_db, params) {
      calls.insertPayout.push(params);
      if (loseRace) {
        loseRace = false;
        return null;
      }
      const clash = payouts.some(
        (p) =>
          p.key === params.idempotencyKey ||
          (p.payout.workerId === params.workerId &&
            p.payout.periodStart === params.periodStart &&
            p.payout.periodEnd === params.periodEnd),
      );
      if (clash) return null;
      const payout: WorkerPayout = {
        id: newId(),
        workerId: params.workerId,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd,
        amountPaise: params.amountPaise,
        paymentMethod: params.paymentMethod,
        paidAt: FIXED_NOW,
        notes: params.notes,
        createdAt: FIXED_NOW,
      };
      payouts.push({ payout, key: params.idempotencyKey });
      return payout;
    },
  };

  return { repo, calls };
}

/** Stands in for writeAuditLog's raw INSERT; records the action codes written on the tx client. */
function auditRecorder(): { db: Executor; actionCodes: string[] } {
  const actionCodes: string[] = [];
  const db: Executor = {
    query: (async (_sql: string, params?: unknown[]) => {
      if (Array.isArray(params) && typeof params[3] === 'string') actionCodes.push(params[3]);
      return { rows: [{ id: newId() }], rowCount: 1 };
    }) as never,
  };
  return { db, actionCodes };
}

function service(options: FakeRepoOptions = {}) {
  const { repo, calls } = fakeRepo(options);
  const audit = auditRecorder();
  const svc = createWorkforceService({
    repo,
    db: audit.db,
    runTx: async (fn) => fn(audit.db),
    today: () => TODAY,
  });
  return { svc, calls, audit: audit.actionCodes };
}

async function expectAppError(promise: Promise<unknown>, code: string, status: number): Promise<AppError> {
  const error = await promise.then(
    () => {
      throw new Error(`expected ${code}, but the call succeeded`);
    },
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AppError);
  expect((error as AppError).code).toBe(code);
  expect((error as AppError).status).toBe(status);
  return error as AppError;
}

const expectNotFound = (p: Promise<unknown>) => expectAppError(p, 'NOT_FOUND', 404);
const expectUnprocessable = (p: Promise<unknown>) => expectAppError(p, 'VALIDATION_FAILED', 422);

// ---------------------------------------------------------------------------
// calendar helpers
// ---------------------------------------------------------------------------

describe('calendar helpers', () => {
  it('monthBounds handles 30/31-day months and leap Februaries', () => {
    expect(monthBounds('2026-09')).toEqual({ start: '2026-09-01', end: '2026-09-30' });
    expect(monthBounds('2026-12')).toEqual({ start: '2026-12-01', end: '2026-12-31' });
    expect(monthBounds('2028-02')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
    expect(monthBounds('2026-02')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('localToday reads the LOCAL calendar date, not the UTC one', () => {
    const lateEvening = new Date(2026, 8, 29, 23, 30); // local 2026-09-29 23:30
    expect(localToday(lateEvening)).toBe('2026-09-29');
    const earlyMorning = new Date(2026, 8, 30, 0, 15);
    expect(localToday(earlyMorning)).toBe('2026-09-30');
  });
});

// ---------------------------------------------------------------------------
// BR-41c — the one shared pay function
// ---------------------------------------------------------------------------

describe('BR-41c — computeWorkerPay (the one shared payroll function)', () => {
  const daily = { id: 'w-daily', payType: 'daily' as const, payRatePaise: 60_000 };
  const monthly = { id: 'w-monthly', payType: 'monthly' as const, payRatePaise: 1_500_000 };
  const day = (workDate: string, present = true, workerId = daily.id): PayAttendanceInput => ({
    workerId,
    workDate,
    present,
  });

  it('BR-41c: daily gross = days present in the period * rate; absent days, other workers and out-of-period days do not count', () => {
    const pay = computeWorkerPay(
      daily,
      [
        day('2026-09-01'),
        day('2026-09-02'),
        day('2026-09-03', false),
        day('2026-09-04', true, 'someone-else'),
        day('2026-08-31'),
        day('2026-10-01'),
      ],
      [],
      [],
      '2026-09-01',
      '2026-09-30',
    );
    expect(pay).toEqual({ grossPaise: 120_000, advancesPaise: 0, netPayablePaise: 120_000, paidStatus: 'pending' });
  });

  it('BR-41c: monthly gross is exactly the rate for a full calendar month, regardless of attendance', () => {
    expect(computeWorkerPay(monthly, [], [], [], '2026-09-01', '2026-09-30').grossPaise).toBe(1_500_000);
    expect(computeWorkerPay(monthly, [], [], [], '2026-02-01', '2026-02-28').grossPaise).toBe(1_500_000);
  });

  it('BR-41c: monthly gross for a partial month is a floored calendar-day pro-rata share', () => {
    // 15 of 30 September days.
    expect(computeWorkerPay(monthly, [], [], [], '2026-09-01', '2026-09-15').grossPaise).toBe(750_000);
    // 10 of 31 October days: floor(1_500_000 * 10 / 31) = 483_870.
    expect(computeWorkerPay(monthly, [], [], [], '2026-10-01', '2026-10-10').grossPaise).toBe(483_870);
    // Sep 16 - Oct 31: half of Sep + all of Oct.
    expect(computeWorkerPay(monthly, [], [], [], '2026-09-16', '2026-10-31').grossPaise).toBe(750_000 + 1_500_000);
  });

  it('BR-41c: splitting a month into single-day periods never exceeds one month of salary', () => {
    let total = 0;
    for (let d = 1; d <= 30; d += 1) {
      const date = `2026-09-${String(d).padStart(2, '0')}`;
      total += computeWorkerPay(monthly, [], [], [], date, date).grossPaise;
    }
    expect(total).toBeLessThanOrEqual(1_500_000);
  });

  it('BR-41c: advances in the period are deducted; net may go negative and is NOT clamped', () => {
    const pay = computeWorkerPay(
      daily,
      [day('2026-09-01')],
      [
        { workerId: daily.id, givenOn: '2026-09-05', amountPaise: 50_000 },
        { workerId: daily.id, givenOn: '2026-09-20', amountPaise: 30_000 },
        { workerId: daily.id, givenOn: '2026-08-20', amountPaise: 99_999 }, // out of period
        { workerId: 'someone-else', givenOn: '2026-09-05', amountPaise: 99_999 },
      ],
      [],
      '2026-09-01',
      '2026-09-30',
    );
    expect(pay.grossPaise).toBe(60_000);
    expect(pay.advancesPaise).toBe(80_000);
    expect(pay.netPayablePaise).toBe(-20_000);
  });

  it('BR-41c: paidStatus is paid only for a payout with the EXACT same period', () => {
    const exact = [{ workerId: daily.id, periodStart: '2026-09-01', periodEnd: '2026-09-30' }];
    const overlapping = [{ workerId: daily.id, periodStart: '2026-09-01', periodEnd: '2026-09-15' }];
    expect(computeWorkerPay(daily, [], [], exact, '2026-09-01', '2026-09-30').paidStatus).toBe('paid');
    expect(computeWorkerPay(daily, [], [], overlapping, '2026-09-01', '2026-09-30').paidStatus).toBe('pending');
  });

  it('BR-41c: rejects an inverted period rather than guessing', () => {
    expect(() => computeWorkerPay(daily, [], [], [], '2026-09-30', '2026-09-01')).toThrow();
  });
});

// ---------------------------------------------------------------------------
// schemas
// ---------------------------------------------------------------------------

describe('BR-41a — payRatePaise is a positive integer', () => {
  const base = { name: 'Muthu', payType: 'daily' };

  it('BR-41a: rejects a non-integer, zero or negative payRatePaise on create', () => {
    for (const payRatePaise of [600.5, 0, -100]) {
      expect(createWorkerBody.safeParse({ ...base, payRatePaise }).success, `payRatePaise=${payRatePaise}`).toBe(false);
    }
  });

  it('BR-41a: rejects the same values on update, and a string amount', () => {
    for (const payRatePaise of [600.5, 0, -100, '60000']) {
      expect(updateWorkerBody.safeParse({ payRatePaise }).success, `payRatePaise=${String(payRatePaise)}`).toBe(false);
    }
  });

  it('BR-41a: accepts a positive integer', () => {
    expect(createWorkerBody.safeParse({ ...base, payRatePaise: 60_000 }).success).toBe(true);
  });

  it('advances and payouts carry positive integer paise too', () => {
    expect(createAdvanceBody.safeParse({ amountPaise: 10.5, givenOn: '2026-09-01' }).success).toBe(false);
    expect(createAdvanceBody.safeParse({ amountPaise: 0, givenOn: '2026-09-01' }).success).toBe(false);
    expect(createPayoutBody.safeParse(payoutBody({ amountPaise: -1 })).success).toBe(false);
  });

  it('payType must be daily or monthly', () => {
    expect(createWorkerBody.safeParse({ ...base, payType: 'hourly', payRatePaise: 1 }).success).toBe(false);
  });
});

describe('BR-41b — hoursWorked is in (0, 24]', () => {
  const body = (hoursWorked: number) => ({
    date: '2026-09-29',
    items: [{ workerId: newId(), present: true, hoursWorked }],
  });

  it('BR-41b: rejects 0, a negative value and anything above 24', () => {
    for (const h of [0, -1, 24.01, 25]) {
      expect(upsertAttendanceBody.safeParse(body(h)).success, `hoursWorked=${h}`).toBe(false);
    }
  });

  it('BR-41b: accepts exactly 24 and a value just above 0', () => {
    expect(upsertAttendanceBody.safeParse(body(24)).success).toBe(true);
    expect(upsertAttendanceBody.safeParse(body(0.01)).success).toBe(true);
  });
});

describe('request shapes', () => {
  it('upsert body is { date, items[] } with at least one item and no per-item date', () => {
    expect(upsertAttendanceBody.safeParse({ date: '2026-09-29', items: [] }).success).toBe(false);
    expect(upsertAttendanceBody.safeParse({ items: [{ workerId: newId(), present: true }] }).success).toBe(false);
    expect(
      upsertAttendanceBody.safeParse({
        date: '2026-09-29',
        items: [{ workerId: newId(), present: true, workDate: '2026-09-29' }],
      }).success,
    ).toBe(false);
  });

  it('a payout body carrying paidAt is rejected (.strict()), never trusted', () => {
    expect(createPayoutBody.safeParse({ ...payoutBody(), paidAt: FIXED_NOW }).success).toBe(false);
  });

  it('paymentMethod is cash / bank_transfer / upi', () => {
    expect(createPayoutBody.safeParse(payoutBody({ paymentMethod: 'cheque' as never })).success).toBe(false);
    expect(createPayoutBody.safeParse(payoutBody({ paymentMethod: 'upi' })).success).toBe(true);
  });

  it('dates must be real calendar dates; periods must be YYYY-MM', () => {
    expect(attendanceForDateQuery.safeParse({ date: '2026-02-30' }).success).toBe(false);
    expect(attendanceForDateQuery.safeParse({ date: '2026-02-28' }).success).toBe(true);
    expect(payrollSummaryQuery.safeParse({ period: '2026-13' }).success).toBe(false);
    expect(payrollSummaryQuery.safeParse({ period: '2026-09' }).success).toBe(true);
  });

  it('a worker create body carrying server-owned fields is rejected', () => {
    expect(
      createWorkerBody.safeParse({ name: 'x', payType: 'daily', payRatePaise: 1, deletedAt: FIXED_NOW }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BR-36 / BR-41e — cross-farmer access 404s, never 403, and writes nothing
// ---------------------------------------------------------------------------

describe('BR-36 / BR-41e — another farmer\'s farm, worker, attendance, advance or payout 404s', () => {
  const workerA = aWorker();
  const fixtures = (): FakeRepoOptions => ({
    workers: [workerA],
    attendance: [anAttendance({ workerId: workerA.id })],
    advances: [anAdvance({ workerId: workerA.id })],
  });

  it('BR-41e: Farmer B listing anything under Farmer A\'s farm id gets 404, not 403', async () => {
    const { svc, calls } = service(fixtures());
    const b = otherFarmerScope();
    await expectNotFound(svc.listWorkers(b, FARM_A));
    await expectNotFound(svc.listAttendanceForDate(b, FARM_A, '2026-09-10'));
    await expectNotFound(svc.getSummary(b, FARM_A));
    await expectNotFound(svc.getPayrollSummary(b, FARM_A, '2026-09'));
    await expectNotFound(svc.getCropHoursSummary(b, FARM_A, newId()));
    expect(writeCount(calls)).toBe(0);
  });

  it('BR-41e: Farmer B requesting Farmer A\'s worker, attendance, advances or payouts by id gets 404', async () => {
    const { svc } = service(fixtures());
    const b = otherFarmerScope();
    await expectNotFound(svc.getWorker(b, FARM_A, workerA.id));
    await expectNotFound(svc.listWorkerAttendance(b, FARM_A, workerA.id, {}));
    await expectNotFound(svc.listAdvances(b, FARM_A, workerA.id));
    await expectNotFound(svc.listPayouts(b, FARM_A, workerA.id));
  });

  it('BR-41e: Farmer B using their OWN farm id with Farmer A\'s worker id gets 404 (worker checked against the farm)', async () => {
    const { svc, calls } = service(fixtures());
    const b = otherFarmerScope();
    await expectNotFound(svc.getWorker(b, FARM_B, workerA.id));
    await expectNotFound(svc.listWorkerAttendance(b, FARM_B, workerA.id, {}));
    await expectNotFound(svc.updateWorker(b, FARM_B, workerA.id, { name: 'Hijacked' }));
    await expectNotFound(svc.deleteWorker(b, FARM_B, workerA.id));
    await expectNotFound(svc.createAdvance(b, FARM_B, workerA.id, { amountPaise: 1, givenOn: '2026-09-01' }));
    await expectNotFound(svc.createPayout(b, FARM_B, workerA.id, payoutBody(), newId()));
    expect(writeCount(calls)).toBe(0);
  });

  it('BR-36: every mutation under another farmer\'s farm 404s and attempts no write', async () => {
    const { svc, calls, audit } = service(fixtures());
    const b = otherFarmerScope();
    await expectNotFound(svc.createWorker(b, FARM_A, { name: 'X', payType: 'daily', payRatePaise: 1 }));
    await expectNotFound(svc.updateWorker(b, FARM_A, workerA.id, { payRatePaise: 1 }));
    await expectNotFound(svc.deleteWorker(b, FARM_A, workerA.id));
    await expectNotFound(
      svc.upsertAttendance(b, FARM_A, { date: '2026-09-10', items: [{ workerId: workerA.id, present: true }] }),
    );
    await expectNotFound(svc.createAdvance(b, FARM_A, workerA.id, { amountPaise: 1, givenOn: '2026-09-01' }));
    await expectNotFound(svc.createPayout(b, FARM_A, workerA.id, payoutBody(), newId()));
    expect(writeCount(calls)).toBe(0);
    expect(audit).toHaveLength(0);
  });

  it('BR-36: a scope with no farmerId 404s rather than leaking anything', async () => {
    const { svc } = service(fixtures());
    await expectNotFound(svc.listWorkers(farmerScopeWithoutFarmerId(), FARM_A));
  });
});

// ---------------------------------------------------------------------------
// workers
// ---------------------------------------------------------------------------

describe('workers — roster CRUD', () => {
  it('creates a worker and writes farmer.workforce.worker.create on the same tx client', async () => {
    const { svc, calls, audit } = service();
    const worker = await svc.createWorker(farmerScope(), FARM_A, {
      name: 'Muthu',
      payType: 'monthly',
      payRatePaise: 1_500_000,
    });
    expect(worker.farmId).toBe(FARM_A);
    expect(calls.insertWorker[0]).toMatchObject({ farmId: FARM_A, payType: 'monthly', payRatePaise: 1_500_000 });
    expect(audit).toEqual(['farmer.workforce.worker.create']);
  });

  it('an id-proof/photo upload that does not exist, or belongs to someone else, is 422 and nothing is written', async () => {
    const mine = newId();
    const theirs = newId();
    const { svc, calls } = service({ uploads: new Map([[mine, USER_A], [theirs, newId()]]) });
    const base = { name: 'Muthu', payType: 'daily' as const, payRatePaise: 60_000 };
    await expectUnprocessable(svc.createWorker(farmerScope(), FARM_A, { ...base, idProofUploadId: newId() }));
    await expectUnprocessable(svc.createWorker(farmerScope(), FARM_A, { ...base, photoUploadId: theirs }));
    expect(calls.insertWorker).toHaveLength(0);
    await svc.createWorker(farmerScope(), FARM_A, { ...base, photoUploadId: mine, idProofUploadId: mine });
    expect(calls.insertWorker).toHaveLength(1);
  });

  it('PATCH changes only the keys present; null clears a nullable field; a foreign upload is 422', async () => {
    const worker = aWorker({ roleTitle: 'Field Worker', upiId: 'muthu@upi' });
    const foreign = newId();
    const { svc, calls, audit } = service({ workers: [worker], uploads: new Map([[foreign, newId()]]) });
    const updated = await svc.updateWorker(farmerScope(), FARM_A, worker.id, { payRatePaise: 65_000, roleTitle: null });
    expect(calls.updateWorker[0]?.patch).toEqual({ payRatePaise: 65_000, roleTitle: null });
    expect(updated.upiId).toBe('muthu@upi');
    expect(audit).toEqual(['farmer.workforce.worker.update']);
    await expectUnprocessable(svc.updateWorker(farmerScope(), FARM_A, worker.id, { photoUploadId: foreign }));
    expect(calls.updateWorker).toHaveLength(1);
  });

  it('DELETE soft-deletes: gone from the roster and GET, history still listable, second delete 404s', async () => {
    const worker = aWorker();
    const { svc, calls, audit } = service({
      workers: [worker],
      attendance: [anAttendance({ workerId: worker.id })],
      advances: [anAdvance({ workerId: worker.id })],
    });
    await svc.deleteWorker(farmerScope(), FARM_A, worker.id);
    expect(calls.softDeleteWorker).toEqual([worker.id]);
    expect(audit).toEqual(['farmer.workforce.worker.delete']);

    expect(await svc.listWorkers(farmerScope(), FARM_A)).toEqual([]);
    await expectNotFound(svc.getWorker(farmerScope(), FARM_A, worker.id));
    expect(await svc.listWorkerAttendance(farmerScope(), FARM_A, worker.id, {})).toHaveLength(1);
    expect(await svc.listAdvances(farmerScope(), FARM_A, worker.id)).toHaveLength(1);

    await expectNotFound(svc.deleteWorker(farmerScope(), FARM_A, worker.id));
    await expectNotFound(svc.createAdvance(farmerScope(), FARM_A, worker.id, { amountPaise: 1, givenOn: '2026-09-01' }));
  });
});

// ---------------------------------------------------------------------------
// attendance
// ---------------------------------------------------------------------------

describe('attendance', () => {
  it('GET for a date returns only rows that exist (an unmarked worker is omitted, not synthesised)', async () => {
    const marked = aWorker({ name: 'Marked' });
    const unmarked = aWorker({ name: 'Unmarked' });
    const { svc } = service({
      workers: [marked, unmarked],
      attendance: [anAttendance({ workerId: marked.id, workDate: '2026-09-29' })],
    });
    const items = await svc.listAttendanceForDate(farmerScope(), FARM_A, '2026-09-29');
    expect(items.map((i) => i.workerId)).toEqual([marked.id]);
    expect(items[0]?.workerName).toBe('Marked');
  });

  it('upserts a day for several workers, one audit row per attendance row, returning workerName', async () => {
    const a = aWorker({ name: 'A' });
    const b = aWorker({ name: 'B' });
    const cropId = newId();
    const { svc, calls, audit } = service({ workers: [a, b], farmCrops: [{ id: cropId, farmId: FARM_A }] });
    const items = await svc.upsertAttendance(farmerScope(), FARM_A, {
      date: '2026-09-29',
      items: [
        { workerId: a.id, present: true, hoursWorked: 8, activity: 'Weeding', farmCropId: cropId },
        { workerId: b.id, present: false },
      ],
    });
    expect(calls.upsertAttendance.map((c) => c.workDate)).toEqual(['2026-09-29', '2026-09-29']);
    expect(calls.upsertAttendance[1]).toMatchObject({ present: false, hoursWorked: null, farmCropId: null });
    expect(items.map((i) => i.workerName)).toEqual(['A', 'B']);
    expect(audit).toEqual(['farmer.workforce.attendance.upsert', 'farmer.workforce.attendance.upsert']);
  });

  it('replaying the same day edits the same row instead of duplicating it', async () => {
    const a = aWorker();
    const { svc } = service({ workers: [a] });
    const first = await svc.upsertAttendance(farmerScope(), FARM_A, {
      date: '2026-09-29',
      items: [{ workerId: a.id, present: true, hoursWorked: 8 }],
    });
    const second = await svc.upsertAttendance(farmerScope(), FARM_A, {
      date: '2026-09-29',
      items: [{ workerId: a.id, present: true, hoursWorked: 6 }],
    });
    expect(second[0]?.id).toBe(first[0]?.id);
    expect(second[0]?.hoursWorked).toBe(6);
  });

  it('BR-36: one worker from another farm rejects the WHOLE batch (422) with nothing written', async () => {
    const mine = aWorker();
    const theirs = aWorker({ farmId: FARM_B });
    const { svc, calls, audit } = service({ workers: [mine, theirs] });
    await expectUnprocessable(
      svc.upsertAttendance(farmerScope(), FARM_A, {
        date: '2026-09-29',
        items: [
          { workerId: mine.id, present: true },
          { workerId: theirs.id, present: true },
        ],
      }),
    );
    expect(calls.upsertAttendance).toHaveLength(0);
    expect(audit).toHaveLength(0);
  });

  it('a soft-deleted worker cannot be marked', async () => {
    const gone = aWorker();
    const { svc, calls } = service({ workers: [gone], deletedWorkerIds: [gone.id] });
    await expectUnprocessable(
      svc.upsertAttendance(farmerScope(), FARM_A, { date: '2026-09-29', items: [{ workerId: gone.id, present: true }] }),
    );
    expect(calls.upsertAttendance).toHaveLength(0);
  });

  it('a farmCropId not on this farm (or soft-deleted) rejects the batch', async () => {
    const a = aWorker();
    const otherFarmCrop = newId();
    const deletedCrop = newId();
    const { svc, calls } = service({
      workers: [a],
      farmCrops: [
        { id: otherFarmCrop, farmId: FARM_B },
        { id: deletedCrop, farmId: FARM_A, deleted: true },
      ],
    });
    for (const farmCropId of [otherFarmCrop, deletedCrop, newId()]) {
      await expectUnprocessable(
        svc.upsertAttendance(farmerScope(), FARM_A, {
          date: '2026-09-29',
          items: [{ workerId: a.id, present: true, farmCropId }],
        }),
      );
    }
    expect(calls.upsertAttendance).toHaveLength(0);
  });

  it('a duplicate workerId, or hours on an absent row, is 422 with nothing written', async () => {
    const a = aWorker();
    const { svc, calls } = service({ workers: [a] });
    await expectUnprocessable(
      svc.upsertAttendance(farmerScope(), FARM_A, {
        date: '2026-09-29',
        items: [
          { workerId: a.id, present: true },
          { workerId: a.id, present: false },
        ],
      }),
    );
    await expectUnprocessable(
      svc.upsertAttendance(farmerScope(), FARM_A, {
        date: '2026-09-29',
        items: [{ workerId: a.id, present: false, hoursWorked: 4 }],
      }),
    );
    expect(calls.upsertAttendance).toHaveLength(0);
  });

  it('per-worker history filters by month and farmCropId', async () => {
    const a = aWorker();
    const crop = newId();
    const { svc } = service({
      workers: [a],
      attendance: [
        anAttendance({ workerId: a.id, workDate: '2026-09-02', farmCropId: crop }),
        anAttendance({ workerId: a.id, workDate: '2026-09-03' }),
        anAttendance({ workerId: a.id, workDate: '2026-08-30', farmCropId: crop }),
      ],
    });
    expect(await svc.listWorkerAttendance(farmerScope(), FARM_A, a.id, { month: '2026-09' })).toHaveLength(2);
    expect(await svc.listWorkerAttendance(farmerScope(), FARM_A, a.id, { farmCropId: crop })).toHaveLength(2);
    expect(await svc.listWorkerAttendance(farmerScope(), FARM_A, a.id, { month: '2026-09', farmCropId: crop })).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// advances
// ---------------------------------------------------------------------------

describe('advances', () => {
  it('logs an advance with an audit row', async () => {
    const a = aWorker();
    const { svc, calls, audit } = service({ workers: [a] });
    const advance = await svc.createAdvance(farmerScope(), FARM_A, a.id, { amountPaise: 50_000, givenOn: '2026-09-15' });
    expect(advance.amountPaise).toBe(50_000);
    expect(calls.insertAdvance[0]).toEqual({ workerId: a.id, amountPaise: 50_000, givenOn: '2026-09-15', notes: null });
    expect(audit).toEqual(['farmer.workforce.advance.create']);
  });
});

// ---------------------------------------------------------------------------
// payouts — the money-moving endpoint
// ---------------------------------------------------------------------------

describe('BR-41 — payouts (Idempotency-Key, net-payable guard, one payout per period)', () => {
  /** Daily worker with 3 present days in September (gross 180_000) and a 50_000 advance -> net 130_000. */
  function payrollFixture(extra: FakeRepoOptions = {}) {
    const worker = aWorker({ payRatePaise: 60_000 });
    const s = service({
      workers: [worker],
      attendance: ['2026-09-01', '2026-09-02', '2026-09-03'].map((workDate) =>
        anAttendance({ workerId: worker.id, workDate }),
      ),
      advances: [anAdvance({ workerId: worker.id, amountPaise: 50_000, givenOn: '2026-09-10' })],
      ...extra,
    });
    return { worker, ...s };
  }

  it('records a payout up to the computed net payable, server-stamping paidAt, with an audit row', async () => {
    const { svc, worker, calls, audit } = payrollFixture();
    const payout = await svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 130_000 }), newId());
    expect(payout.amountPaise).toBe(130_000);
    expect(payout.paidAt).toBe(FIXED_NOW);
    expect(calls.insertPayout).toHaveLength(1);
    expect(audit).toEqual(['farmer.workforce.payout.create']);
  });

  it('BR-41c: rejects (422) an amountPaise above computeWorkerPay netPayablePaise, and writes nothing', async () => {
    const { svc, worker, calls, audit } = payrollFixture();
    await expectUnprocessable(
      svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 130_001 }), newId()),
    );
    expect(calls.insertPayout).toHaveLength(0);
    expect(audit).toHaveLength(0);
  });

  it('BR-41c: a worker advanced more than they earned (negative net) cannot be paid anything', async () => {
    const worker = aWorker();
    const { svc, calls } = service({
      workers: [worker],
      attendance: [anAttendance({ workerId: worker.id, workDate: '2026-09-01' })],
      advances: [anAdvance({ workerId: worker.id, amountPaise: 100_000, givenOn: '2026-09-02' })],
    });
    await expectUnprocessable(svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 1 }), newId()));
    expect(calls.insertPayout).toHaveLength(0);
  });

  it('a missing or non-UUID Idempotency-Key is 400 before anything is read or written', async () => {
    const { svc, worker, calls } = payrollFixture();
    await expectAppError(svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody(), undefined), 'BAD_REQUEST', 400);
    await expectAppError(svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody(), 'not-a-uuid'), 'BAD_REQUEST', 400);
    expect(calls.insertPayout).toHaveLength(0);
  });

  it('replaying the same key with an identical body returns the original payout and moves money once', async () => {
    const { svc, worker, calls, audit } = payrollFixture();
    const key = newId();
    const first = await svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 100_000 }), key);
    const replay = await svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 100_000 }), key);
    expect(replay).toEqual(first);
    expect(calls.insertPayout).toHaveLength(1);
    expect(audit).toEqual(['farmer.workforce.payout.create']);
  });

  it('replaying the same key with a different body is 409 IDEMPOTENCY_KEY_REUSED', async () => {
    const { svc, worker, calls } = payrollFixture();
    const key = newId();
    await svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 100_000 }), key);
    await expectAppError(
      svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 90_000 }), key),
      'IDEMPOTENCY_KEY_REUSED',
      409,
    );
    expect(calls.insertPayout).toHaveLength(1);
  });

  it('a second payout for the same period under a NEW key is 409 CONFLICT', async () => {
    const { svc, worker, calls } = payrollFixture();
    await svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 100_000 }), newId());
    await expectAppError(
      svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 10_000 }), newId()),
      'CONFLICT',
      409,
    );
    expect(calls.insertPayout).toHaveLength(1);
  });

  it('losing a concurrent race on the unique constraint maps to 409 CONFLICT, not a raw Postgres error', async () => {
    const { svc, worker } = payrollFixture({ insertPayoutLosesRace: true });
    await expectAppError(
      svc.createPayout(farmerScope(), FARM_A, worker.id, payoutBody({ amountPaise: 100_000 }), newId()),
      'CONFLICT',
      409,
    );
  });

  it('an inverted period is 422', async () => {
    const { svc, worker } = payrollFixture();
    await expectUnprocessable(
      svc.createPayout(
        farmerScope(),
        FARM_A,
        worker.id,
        payoutBody({ periodStart: '2026-09-30', periodEnd: '2026-09-01' }),
        newId(),
      ),
    );
  });
});

// ---------------------------------------------------------------------------
// aggregates
// ---------------------------------------------------------------------------

describe('BR-41c — every endpoint agrees on the same worker and period', () => {
  function farmFixture() {
    const daily = aWorker({ name: 'Daily', payType: 'daily', payRatePaise: 60_000 });
    const monthly = aWorker({ name: 'Monthly', payType: 'monthly', payRatePaise: 1_500_000 });
    const overAdvanced = aWorker({ name: 'Over', payType: 'daily', payRatePaise: 50_000 });
    const removed = aWorker({ name: 'Removed', payType: 'daily', payRatePaise: 40_000 });
    const crop = newId();
    const s = service({
      workers: [daily, monthly, overAdvanced, removed],
      deletedWorkerIds: [removed.id],
      farmCrops: [{ id: crop, farmId: FARM_A }],
      attendance: [
        anAttendance({ workerId: daily.id, workDate: '2026-09-01', hoursWorked: 8, farmCropId: crop }),
        anAttendance({ workerId: daily.id, workDate: '2026-09-02', hoursWorked: 7.5, farmCropId: crop }),
        anAttendance({ workerId: daily.id, workDate: '2026-09-03', present: false, hoursWorked: null, farmCropId: crop }),
        anAttendance({ workerId: monthly.id, workDate: '2026-09-01', hoursWorked: 6, farmCropId: crop }),
        anAttendance({ workerId: overAdvanced.id, workDate: '2026-09-04', hoursWorked: 0.1 }),
        anAttendance({ workerId: removed.id, workDate: '2026-09-05', hoursWorked: 0.2, farmCropId: crop }),
        anAttendance({ workerId: daily.id, workDate: '2026-08-31', hoursWorked: 9 }), // previous month
      ],
      advances: [
        anAdvance({ workerId: daily.id, amountPaise: 20_000, givenOn: '2026-09-10' }),
        anAdvance({ workerId: overAdvanced.id, amountPaise: 80_000, givenOn: '2026-09-11' }),
      ],
    });
    return { ...s, daily, monthly, overAdvanced, removed, crop };
  }

  it('BR-41c: payroll-summary items are computeWorkerPay over the month, one per ACTIVE worker', async () => {
    const { svc, daily, monthly, overAdvanced } = farmFixture();
    const items = await svc.getPayrollSummary(farmerScope(), FARM_A, '2026-09');
    const byId = new Map(items.map((i) => [i.workerId, i]));
    expect(items).toHaveLength(3);
    expect(byId.get(daily.id)).toMatchObject({ grossPaise: 120_000, advancesPaise: 20_000, netPayablePaise: 100_000, paidStatus: 'pending' });
    expect(byId.get(monthly.id)).toMatchObject({ grossPaise: 1_500_000, advancesPaise: 0, netPayablePaise: 1_500_000 });
    expect(byId.get(overAdvanced.id)).toMatchObject({ grossPaise: 50_000, advancesPaise: 80_000, netPayablePaise: -30_000 });
  });

  it('BR-41c: the workforce summary\'s payroll due equals the payroll-summary nets for this month (pending, floored at 0)', async () => {
    const { svc } = farmFixture();
    const [summary, items] = await Promise.all([
      svc.getSummary(farmerScope(), FARM_A),
      svc.getPayrollSummary(farmerScope(), FARM_A, TODAY.slice(0, 7)),
    ]);
    const expectedDue = items
      .filter((i) => i.paidStatus === 'pending')
      .reduce((sum, i) => sum + Math.max(0, i.netPayablePaise), 0);
    expect(summary.payrollDueThisMonthPaise).toBe(expectedDue);
    expect(summary.payrollDueThisMonthPaise).toBe(100_000 + 1_500_000);
    expect(summary.workerCount).toBe(3);
    // Every September hour on the farm, including the removed worker's; no August hours; no float drift.
    expect(summary.hoursThisMonth).toBe(8 + 7.5 + 6 + 0.1 + 0.2);
  });

  it('BR-41c: recording a payout flips payroll-summary to paid and drops that worker from payroll due', async () => {
    const { svc, daily } = farmFixture();
    await svc.createPayout(farmerScope(), FARM_A, daily.id, payoutBody({ amountPaise: 100_000 }), newId());
    const items = await svc.getPayrollSummary(farmerScope(), FARM_A, '2026-09');
    expect(items.find((i) => i.workerId === daily.id)?.paidStatus).toBe('paid');
    const summary = await svc.getSummary(farmerScope(), FARM_A);
    expect(summary.payrollDueThisMonthPaise).toBe(1_500_000);
  });

  it('BR-41c: crop-hours cost for a daily worker equals computeWorkerPay gross over their crop days', async () => {
    const { svc, daily, crop } = farmFixture();
    const summary = await svc.getCropHoursSummary(farmerScope(), FARM_A, crop);
    const dailyGross = computeWorkerPay(
      daily,
      [
        { workerId: daily.id, workDate: '2026-09-01', present: true },
        { workerId: daily.id, workDate: '2026-09-02', present: true },
      ],
      [],
      [],
      '2026-09-01',
      '2026-09-02',
    ).grossPaise;
    // Daily worker: 2 present days * 60_000; removed daily worker: 1 day * 40_000; monthly worker excluded.
    expect(summary.totalCostPaise).toBe(dailyGross + 40_000);
    expect(summary.hoursLogged).toBe(8 + 7.5 + 6 + 0.2);
    expect(summary.workersInvolved).toBe(3);
    // Denominator = 3 costed daily-worker-days (monthly worker's day excluded).
    expect(summary.avgRatePaise).toBe(Math.floor((120_000 + 40_000) / 3));
  });

  it('crop-hours: a farmCropId not reachable from this farm 404s; one with no rows is all zeros', async () => {
    const { svc } = service({ farmCrops: [{ id: 'empty-crop', farmId: FARM_A }, { id: 'b-crop', farmId: FARM_B }] });
    await expectNotFound(svc.getCropHoursSummary(farmerScope(), FARM_A, 'b-crop'));
    expect(await svc.getCropHoursSummary(farmerScope(), FARM_A, 'empty-crop')).toEqual({
      totalCostPaise: 0,
      hoursLogged: 0,
      workersInvolved: 0,
      avgRatePaise: 0,
    });
  });

  it('reads write nothing', async () => {
    const { svc, calls, audit, crop } = farmFixture();
    await svc.getSummary(farmerScope(), FARM_A);
    await svc.getPayrollSummary(farmerScope(), FARM_A, '2026-09');
    await svc.getCropHoursSummary(farmerScope(), FARM_A, crop);
    expect(writeCount(calls)).toBe(0);
    expect(audit).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// BR-41d — no job writes attendance or payouts
// ---------------------------------------------------------------------------

describe('BR-41d — attendance and payouts are farmer-initiated only', () => {
  it('BR-41d: no job in JOB_REGISTRY is a workforce job', () => {
    for (const name of Object.keys(JOB_REGISTRY)) {
      expect(name).not.toMatch(/workforce|attendance|payroll|worker-payout/i);
    }
  });

  it('BR-41d: no job source references the workforce module or writes worker_attendance / worker_payouts', () => {
    const jobsDir = join(API_ROOT, 'src', 'jobs');
    const sources = readdirSync(jobsDir)
      .filter((f) => f.endsWith('.ts'))
      .map((f) => readFileSync(join(jobsDir, f), 'utf8'));
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).not.toMatch(/modules\/workforce\//);
      expect(source).not.toMatch(/worker_attendance|worker_payouts|worker_advances/);
    }
  });
});

// ---------------------------------------------------------------------------
// integration — real Postgres round-trip
// ---------------------------------------------------------------------------

const WORKFORCE_TABLES = ['farms', 'plots', 'farm_crops', 'workers', 'worker_attendance', 'worker_advances', 'worker_payouts'];

async function workforceTablesReady(): Promise<boolean> {
  const ready = await Promise.all(WORKFORCE_TABLES.map(databaseReady));
  if (ready.some((r) => !r)) {
    console.warn('[skip] workforce tables not reachable — run `docker compose up -d && pnpm db:migrate && pnpm db:seed`');
    return false;
  }
  return true;
}

/** 0026 adds worker_payouts.idempotency_key; payout round-trips need it. */
async function payoutIdempotencyColumnReady(): Promise<boolean> {
  if (!(await workforceTablesReady())) return false;
  const { pool } = await import('../../db/pool.js');
  const result = await pool.query<{ present: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'worker_payouts' AND column_name = 'idempotency_key'
     ) AS present`,
  );
  if (result.rows[0]?.present !== true) {
    console.warn('[skip] worker_payouts.idempotency_key missing — run `pnpm db:migrate` to apply 0026');
    return false;
  }
  return true;
}

async function withFarmerFixture(
  fn: (ctx: {
    client: Executor;
    scope: ResolvedScope;
    farmId: string;
    plotId: string;
    svc: ReturnType<typeof createWorkforceService>;
  }) => Promise<void>,
): Promise<void> {
  const { pool } = await import('../../db/pool.js');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userId = newId();
    const mobile = `+9196${Math.floor(10000000 + Math.random() * 89999999)}`;
    await client.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')`,
      [userId, mobile, 'Workforce Integration Farmer'],
    );
    const farmerId = newId();
    await client.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
      farmerId,
      userId,
      `TOHFA-WF-${farmerId.slice(0, 8)}`,
    ]);
    const farmId = newId();
    await client.query(
      `INSERT INTO farms (id, farmer_id, name, district) VALUES ($1, $2, 'Workforce Farm', 'The Nilgiris')`,
      [farmId, farmerId],
    );
    const plotId = newId();
    await client.query(`INSERT INTO plots (id, farm_id, name) VALUES ($1, $2, 'Zone A')`, [plotId, farmId]);

    const scope = farmerScope({ farmerId, userId });
    const svc = createWorkforceService({ db: client, runTx: async (inner) => inner(client), today: () => TODAY });
    await fn({ client, scope, farmId, plotId, svc });
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}

/** Runs `sql` inside a savepoint so an expected constraint failure does not abort the fixture tx. */
async function expectDbRejects(client: Executor, sql: string, params: unknown[], pgCode: string): Promise<void> {
  await client.query('SAVEPOINT expect_reject');
  const error = await client.query(sql, params).then(
    () => null,
    (e: unknown) => e as { code?: string },
  );
  await client.query('ROLLBACK TO SAVEPOINT expect_reject');
  expect(error, `expected Postgres ${pgCode}`).not.toBeNull();
  expect(error?.code).toBe(pgCode);
}

describeIfDatabase('workforceService (integration against PostgreSQL)', () => {
  it('workers: create -> patch -> soft delete round-trips; dates survive IST; audit rows written', async () => {
    if (!(await workforceTablesReady())) return;
    await withFarmerFixture(async ({ client, scope, farmId, svc }) => {
      const created = await svc.createWorker(scope, farmId, {
        name: 'Muthu',
        payType: 'daily',
        payRatePaise: 60_000,
        dateOfBirth: '1990-01-01',
      });
      expect(created.dateOfBirth).toBe('1990-01-01');
      const patched = await svc.updateWorker(scope, farmId, created.id, { payRatePaise: 65_000, roleTitle: 'Lead' });
      expect(patched.payRatePaise).toBe(65_000);
      expect(patched.updatedAt).not.toBeNull();
      await svc.deleteWorker(scope, farmId, created.id);
      expect(await svc.listWorkers(scope, farmId)).toEqual([]);
      const row = await client.query<{ deleted_at: Date | null }>(`SELECT deleted_at FROM workers WHERE id = $1`, [
        created.id,
      ]);
      expect(row.rows[0]?.deleted_at).not.toBeNull();
      const audit = await client.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM audit_log WHERE entity_id = $1 AND action_code LIKE 'farmer.workforce.worker.%'`,
        [created.id],
      );
      expect(audit.rows[0]?.n).toBe(3);

      // BR-41e: another farmer sees 404 for the same farm.
      await expectNotFound(svc.listWorkers(farmerScope({ farmerId: newId() }), farmId));
    });
  });

  it('BR-41a: the DB CHECK rejects a non-positive pay_rate_paise that bypasses the service', async () => {
    if (!(await workforceTablesReady())) return;
    await withFarmerFixture(async ({ client, farmId }) => {
      await expectDbRejects(
        client,
        `INSERT INTO workers (farm_id, name, pay_type, pay_rate_paise) VALUES ($1, 'X', 'daily', 0)`,
        [farmId],
        '23514',
      );
    });
  });

  it('BR-41b: the DB CHECK rejects hours_worked of 0 and above 24, and accepts exactly 24', async () => {
    if (!(await workforceTablesReady())) return;
    await withFarmerFixture(async ({ client, scope, farmId, svc }) => {
      const w = await svc.createWorker(scope, farmId, { name: 'H', payType: 'daily', payRatePaise: 1 });
      for (const hours of [0, 24.5, -1]) {
        await expectDbRejects(
          client,
          `INSERT INTO worker_attendance (worker_id, work_date, hours_worked) VALUES ($1, '2026-09-01', $2)`,
          [w.id, hours],
          '23514',
        );
      }
      const saved = await svc.upsertAttendance(scope, farmId, {
        date: '2026-09-01',
        items: [{ workerId: w.id, present: true, hoursWorked: 24 }],
      });
      expect(saved[0]?.hoursWorked).toBe(24);
    });
  });

  it('attendance: bulk upsert is idempotent per day and the per-date list round-trips workDate in IST', async () => {
    if (!(await workforceTablesReady())) return;
    await withFarmerFixture(async ({ client, scope, farmId, plotId, svc }) => {
      const crop = await client.query<{ id: string }>(
        `SELECT id FROM crop_master WHERE deleted_at IS NULL ORDER BY name LIMIT 1`,
      );
      const farmCropId = newId();
      await client.query(`INSERT INTO farm_crops (id, plot_id, crop_id) VALUES ($1, $2, $3)`, [
        farmCropId,
        plotId,
        crop.rows[0]!.id,
      ]);
      const a = await svc.createWorker(scope, farmId, { name: 'A', payType: 'daily', payRatePaise: 60_000 });
      const b = await svc.createWorker(scope, farmId, { name: 'B', payType: 'monthly', payRatePaise: 1_500_000 });

      await svc.upsertAttendance(scope, farmId, {
        date: '2026-09-20',
        items: [{ workerId: a.id, present: true, hoursWorked: 8, farmCropId }],
      });
      const second = await svc.upsertAttendance(scope, farmId, {
        date: '2026-09-20',
        items: [
          { workerId: a.id, present: true, hoursWorked: 7.25, farmCropId },
          { workerId: b.id, present: true, hoursWorked: 5, farmCropId },
        ],
      });
      expect(second.map((r) => r.workDate)).toEqual(['2026-09-20', '2026-09-20']);

      const day = await svc.listAttendanceForDate(scope, farmId, '2026-09-20');
      expect(day.map((r) => [r.workerName, r.hoursWorked])).toEqual([
        ['A', 7.25],
        ['B', 5],
      ]);
      const count = await client.query<{ n: number }>(
        `SELECT COUNT(*)::int AS n FROM worker_attendance WHERE worker_id = ANY($1::uuid[])`,
        [[a.id, b.id]],
      );
      expect(count.rows[0]?.n).toBe(2);

      const cropSummary = await svc.getCropHoursSummary(scope, farmId, farmCropId);
      expect(cropSummary).toEqual({ totalCostPaise: 60_000, hoursLogged: 12.25, workersInvolved: 2, avgRatePaise: 60_000 });

      const history = await svc.listWorkerAttendance(scope, farmId, a.id, { month: '2026-09', farmCropId });
      expect(history).toHaveLength(1);
    });
  });

  it('payroll + payout: guard, idempotent replay, one payout per period, and all three endpoints agree', async () => {
    if (!(await payoutIdempotencyColumnReady())) return;
    await withFarmerFixture(async ({ client, scope, farmId, svc }) => {
      const w = await svc.createWorker(scope, farmId, { name: 'P', payType: 'daily', payRatePaise: 60_000 });
      await svc.upsertAttendance(scope, farmId, { date: '2026-09-01', items: [{ workerId: w.id, present: true }] });
      await svc.upsertAttendance(scope, farmId, { date: '2026-09-02', items: [{ workerId: w.id, present: true }] });
      await svc.createAdvance(scope, farmId, w.id, { amountPaise: 20_000, givenOn: '2026-09-05' });

      const [item] = await svc.getPayrollSummary(scope, farmId, '2026-09');
      expect(item).toMatchObject({ grossPaise: 120_000, advancesPaise: 20_000, netPayablePaise: 100_000, paidStatus: 'pending' });
      expect((await svc.getSummary(scope, farmId)).payrollDueThisMonthPaise).toBe(100_000);

      await expectUnprocessable(svc.createPayout(scope, farmId, w.id, payoutBody({ amountPaise: 100_001 }), newId()));

      const key = newId();
      const payout = await svc.createPayout(scope, farmId, w.id, payoutBody({ amountPaise: 100_000 }), key);
      const replay = await svc.createPayout(scope, farmId, w.id, payoutBody({ amountPaise: 100_000 }), key);
      expect(replay.id).toBe(payout.id);
      await expectAppError(
        svc.createPayout(scope, farmId, w.id, payoutBody({ amountPaise: 1 }), newId()),
        'CONFLICT',
        409,
      );
      const rows = await client.query<{ n: number }>(`SELECT COUNT(*)::int AS n FROM worker_payouts WHERE worker_id = $1`, [
        w.id,
      ]);
      expect(rows.rows[0]?.n).toBe(1);

      const [after] = await svc.getPayrollSummary(scope, farmId, '2026-09');
      expect(after?.paidStatus).toBe('paid');
      expect((await svc.getSummary(scope, farmId)).payrollDueThisMonthPaise).toBe(0);
      expect((await svc.listPayouts(scope, farmId, w.id)).map((p) => p.periodStart)).toEqual(['2026-09-01']);
    });
  });
});
