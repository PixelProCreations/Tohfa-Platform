/**
 * workforce.schema — Zod request/response schemas for the Farm Workforce
 * feature: a farm's worker roster, daily attendance, cash advances, payroll
 * payouts, and three read-only payroll aggregates. Shapes mirror
 * docs/openapi.yaml exactly (the "Farm Workforce" tag; the Worker*,
 * Attendance*, WorkerAdvance*, WorkerPayout*, WorkforceSummary,
 * PayrollSummaryItem and CropHoursSummary component schemas).
 *
 * Every money field is an integer number of paise (`*Paise`), NOT the
 * decimal-string `Money` schema — that is what the stage-1 contract
 * specifies, and it keeps the arithmetic in workforce.service.ts#
 * computeWorkerPay integer-only (root CLAUDE.md §2.2).
 *
 * `.strict()` on request bodies: an unexpected field is a client bug and we
 * would rather fail loudly than silently ignore it (same convention as
 * pest.schema.ts / soil.schema.ts). This is also what keeps server-owned
 * columns out of client control — a payout body carrying `paidAt`, or a
 * worker body carrying `deletedAt`, is rejected, never trusted.
 */
import { z } from 'zod';

/**
 * YYYY-MM-DD that is also a real calendar date. pest.schema.ts only checks
 * the shape; here '2026-02-30' would otherwise reach Postgres and come back
 * as a 500 (invalid date input), and a date is a pay-period boundary in this
 * module, so it is worth validating properly.
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number) as [number, number, number];
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }, 'Date must be a real calendar date');

/** YYYY-MM, matching the spec's `^\d{4}-(0[1-9]|1[0-2])$` pattern. */
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be YYYY-MM');

export const payTypeSchema = z.enum(['daily', 'monthly']);
export type PayType = z.infer<typeof payTypeSchema>;

export const paymentMethodSchema = z.enum(['cash', 'bank_transfer', 'upi']);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

/**
 * BR-41a: a positive integer number of paise, never a float. The DB CHECK on
 * workers.pay_rate_paise is the second layer; this one stays even so (belt
 * and braces). `.max` is Postgres `integer`'s ceiling, so an absurd value is
 * a 400 here rather than a 500 (22003 numeric out of range) from the insert.
 */
const PG_INT_MAX = 2_147_483_647;
const positivePaise = z.number().int('Must be an integer number of paise').positive().max(PG_INT_MAX);

/**
 * BR-41b: in (0, 24]. The DB CHECK (chk_worker_attendance_hours) is the
 * second layer. `hours_worked` is numeric(4,2); see the service for the
 * 23514 mapping when a sub-0.005 value rounds to 0.00 in Postgres.
 */
const hoursWorkedSchema = z.number().positive('hoursWorked must be greater than 0').max(24, 'hoursWorked must be at most 24');

// ---------------------------------------------------------------------------
// path params
// ---------------------------------------------------------------------------

export const farmOnlyParams = z
  .object({
    farmId: z.string().uuid('farm id must be a UUID'),
  })
  .strict();
export type FarmOnlyParams = z.infer<typeof farmOnlyParams>;

export const workerIdParams = farmOnlyParams.extend({
  workerId: z.string().uuid('worker id must be a UUID'),
});
export type WorkerIdParams = z.infer<typeof workerIdParams>;

// ---------------------------------------------------------------------------
// query strings
// ---------------------------------------------------------------------------

/** GET /farms/{farmId}/attendance */
export const attendanceForDateQuery = z.object({ date: dateSchema }).strict();
export type AttendanceForDateQuery = z.infer<typeof attendanceForDateQuery>;

/** GET /farms/{farmId}/workers/{workerId}/attendance */
export const workerAttendanceQuery = z
  .object({
    month: monthSchema.optional(),
    farmCropId: z.string().uuid('farmCropId must be a UUID').optional(),
  })
  .strict();
export type WorkerAttendanceQuery = z.infer<typeof workerAttendanceQuery>;

/** GET /farms/{farmId}/workforce/payroll-summary */
export const payrollSummaryQuery = z.object({ period: monthSchema }).strict();
export type PayrollSummaryQuery = z.infer<typeof payrollSummaryQuery>;

/** GET /farms/{farmId}/workforce/crop-hours-summary */
export const cropHoursSummaryQuery = z
  .object({ farmCropId: z.string().uuid('farmCropId must be a UUID') })
  .strict();
export type CropHoursSummaryQuery = z.infer<typeof cropHoursSummaryQuery>;

// ---------------------------------------------------------------------------
// workers
// ---------------------------------------------------------------------------

/** POST /farms/{farmId}/workers — docs/openapi.yaml `WorkerCreate`. */
export const createWorkerBody = z
  .object({
    name: z.string().trim().min(1).max(200),
    roleTitle: z.string().trim().max(120).optional(),
    dateOfBirth: dateSchema.optional(),
    gender: z.string().trim().optional(),
    /** Must reference an upload the caller owns — validated in the service, not just trusted. */
    idProofUploadId: z.string().uuid().optional(),
    /** Must reference an upload the caller owns — validated in the service, not just trusted. */
    photoUploadId: z.string().uuid().optional(),
    bankAccountNo: z.string().trim().max(40).optional(),
    ifscCode: z.string().trim().max(20).optional(),
    upiId: z.string().trim().max(120).optional(),
    payType: payTypeSchema,
    payRatePaise: positivePaise,
  })
  .strict();
export type CreateWorkerBody = z.infer<typeof createWorkerBody>;

/**
 * PATCH /farms/{farmId}/workers/{workerId} — docs/openapi.yaml `WorkerUpdate`.
 * Every key optional; nullable keys may be sent as `null` to clear them.
 * `name`, `payType` and `payRatePaise` are NOT NULL columns and not nullable
 * in the spec, so `null` is rejected for them.
 */
export const updateWorkerBody = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    roleTitle: z.string().trim().max(120).nullable().optional(),
    dateOfBirth: dateSchema.nullable().optional(),
    gender: z.string().trim().nullable().optional(),
    idProofUploadId: z.string().uuid().nullable().optional(),
    photoUploadId: z.string().uuid().nullable().optional(),
    bankAccountNo: z.string().trim().max(40).nullable().optional(),
    ifscCode: z.string().trim().max(20).nullable().optional(),
    upiId: z.string().trim().max(120).nullable().optional(),
    payType: payTypeSchema.optional(),
    payRatePaise: positivePaise.optional(),
  })
  .strict();
export type UpdateWorkerBody = z.infer<typeof updateWorkerBody>;

/** Keep aligned with docs/openapi.yaml `Worker`. */
export const workerResponse = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  name: z.string(),
  roleTitle: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  gender: z.string().nullable(),
  idProofUploadId: z.string().uuid().nullable(),
  photoUploadId: z.string().uuid().nullable(),
  bankAccountNo: z.string().nullable(),
  ifscCode: z.string().nullable(),
  upiId: z.string().nullable(),
  payType: payTypeSchema,
  payRatePaise: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type WorkerResponse = z.infer<typeof workerResponse>;

// ---------------------------------------------------------------------------
// attendance
// ---------------------------------------------------------------------------

/** docs/openapi.yaml `AttendanceUpsertItem`. */
export const attendanceUpsertItem = z
  .object({
    workerId: z.string().uuid(),
    present: z.boolean(),
    farmCropId: z.string().uuid().optional(),
    activity: z.string().trim().max(200).optional(),
    hoursWorked: hoursWorkedSchema.optional(),
  })
  .strict();
export type AttendanceUpsertItem = z.infer<typeof attendanceUpsertItem>;

/**
 * POST /farms/{farmId}/attendance — the inline request body in
 * docs/openapi.yaml `upsertMyFarmAttendance`: `{ date, items[] }`, with
 * `items` minItems 1. `date` is ONE top-level field for the whole batch; the
 * items carry no date of their own.
 */
export const upsertAttendanceBody = z
  .object({
    date: dateSchema,
    items: z.array(attendanceUpsertItem).min(1),
  })
  .strict();
export type UpsertAttendanceBody = z.infer<typeof upsertAttendanceBody>;

/** Keep aligned with docs/openapi.yaml `AttendanceRecord`. */
export const attendanceRecordResponse = z.object({
  id: z.string().uuid(),
  workerId: z.string().uuid(),
  /** Present only on the farm-wide one-day views (GET/POST /farms/{farmId}/attendance). */
  workerName: z.string().optional(),
  farmCropId: z.string().uuid().nullable(),
  workDate: z.string(),
  present: z.boolean(),
  activity: z.string().nullable(),
  hoursWorked: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type AttendanceRecordResponse = z.infer<typeof attendanceRecordResponse>;

// ---------------------------------------------------------------------------
// advances
// ---------------------------------------------------------------------------

/** POST .../advances — docs/openapi.yaml `WorkerAdvanceCreate`. */
export const createAdvanceBody = z
  .object({
    amountPaise: positivePaise,
    givenOn: dateSchema,
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateAdvanceBody = z.infer<typeof createAdvanceBody>;

/** Keep aligned with docs/openapi.yaml `WorkerAdvance`. */
export const workerAdvanceResponse = z.object({
  id: z.string().uuid(),
  workerId: z.string().uuid(),
  amountPaise: z.number().int().positive(),
  givenOn: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type WorkerAdvanceResponse = z.infer<typeof workerAdvanceResponse>;

// ---------------------------------------------------------------------------
// payouts
// ---------------------------------------------------------------------------

/**
 * POST .../payouts — docs/openapi.yaml `WorkerPayoutCreate`. No `paidAt`:
 * the server stamps `paid_at = now()`, and `.strict()` rejects a client
 * value rather than silently dropping it.
 */
export const createPayoutBody = z
  .object({
    periodStart: dateSchema,
    periodEnd: dateSchema,
    amountPaise: positivePaise,
    paymentMethod: paymentMethodSchema,
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreatePayoutBody = z.infer<typeof createPayoutBody>;

/** docs/openapi.yaml components/parameters/IdempotencyKeyHeader: a UUID, required. */
export const idempotencyKeySchema = z.string().uuid('Idempotency-Key must be a UUID');

/** Keep aligned with docs/openapi.yaml `WorkerPayout`. */
export const workerPayoutResponse = z.object({
  id: z.string().uuid(),
  workerId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  amountPaise: z.number().int().positive(),
  paymentMethod: paymentMethodSchema,
  paidAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type WorkerPayoutResponse = z.infer<typeof workerPayoutResponse>;

// ---------------------------------------------------------------------------
// read-only aggregates (BR-41c: computed at read time, never stored)
// ---------------------------------------------------------------------------

/** Keep aligned with docs/openapi.yaml `WorkforceSummary`. */
export const workforceSummaryResponse = z.object({
  workerCount: z.number().int().min(0),
  hoursThisMonth: z.number().min(0),
  payrollDueThisMonthPaise: z.number().int().min(0),
});
export type WorkforceSummaryResponse = z.infer<typeof workforceSummaryResponse>;

/** Keep aligned with docs/openapi.yaml `PayrollSummaryItem`. */
export const payrollSummaryItemResponse = z.object({
  workerId: z.string().uuid(),
  workerName: z.string(),
  grossPaise: z.number().int().min(0),
  advancesPaise: z.number().int().min(0),
  /** grossPaise - advancesPaise; may be negative (see computeWorkerPay). */
  netPayablePaise: z.number().int(),
  paidStatus: z.enum(['pending', 'paid']),
});
export type PayrollSummaryItemResponse = z.infer<typeof payrollSummaryItemResponse>;

/** Keep aligned with docs/openapi.yaml `CropHoursSummary`. */
export const cropHoursSummaryResponse = z.object({
  totalCostPaise: z.number().int().min(0),
  hoursLogged: z.number().min(0),
  workersInvolved: z.number().int().min(0),
  avgRatePaise: z.number().int().min(0),
});
export type CropHoursSummaryResponse = z.infer<typeof cropHoursSummaryResponse>;
