/**
 * Module 14 (Warehouse Staff and Attendance): staff roster and daily attendance.
 *
 * Schemas here must match docs/openapi.yaml (/admin/warehouse-staff, /admin/staff-attendance).
 * Request schemas are `.strict()` so a stray field is a 422, not silently ignored.
 *
 * Dates are Asia/Kolkata calendar dates ("YYYY-MM-DD"); instants are ISO 8601 strings.
 */
import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

// A real calendar date: a regex alone let 2026-02-30 through to Postgres, which answers 500.
export const isoDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

const uuid = (name: string) => z.string().uuid(`${name} must be a UUID`);

/** Must match the CHECK on warehouse_staff.phone (db/migrations/0056_warehouse_staff.sql). */
const PHONE = /^\+?[0-9]{10,15}$/;

export const staffStatuses = ['ACTIVE', 'INACTIVE'] as const;
export const staffStatusEnum = z.enum(staffStatuses);
export type StaffStatus = z.infer<typeof staffStatusEnum>;

/** Matches the staff_attendance.status CHECK: the three statuses the designed screens show. */
export const attendanceStatuses = ['PRESENT', 'ABSENT', 'LEAVE'] as const;
export const attendanceStatusEnum = z.enum(attendanceStatuses);
export type AttendanceStatus = z.infer<typeof attendanceStatusEnum>;

const dateRange = (value: { from?: string | undefined; to?: string | undefined }): boolean =>
  value.from === undefined || value.to === undefined || value.from <= value.to;
const DATE_RANGE_MESSAGE = { message: '"from" must be earlier than or equal to "to"', path: ['to'] };

const fullName = z.string().trim().min(1).max(120);
const designation = z.string().trim().min(1).max(80);
const phone = z.string().regex(PHONE, 'Must be 10 to 15 digits, with an optional leading +');

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------
export const staffIdParams = z.object({ id: uuid('id') }).strict();
export type StaffIdParams = z.infer<typeof staffIdParams>;

export const attendanceDateParams = z.object({ date: isoDate }).strict();
export type AttendanceDateParams = z.infer<typeof attendanceDateParams>;

export const staffDayParams = z.object({ staffId: uuid('staffId'), date: isoDate }).strict();
export type StaffDayParams = z.infer<typeof staffDayParams>;

// ---------------------------------------------------------------------------
// Staff: bodies and queries
// ---------------------------------------------------------------------------
export const createStaffBody = z
  .object({
    fullName,
    designation,
    phone: phone.optional(),
    joinedOn: isoDate,
    /** Required for an actor not assigned to a warehouse (Main, Super Admin, Tohfa Admin). */
    warehouseId: uuid('warehouseId').optional(),
    status: staffStatusEnum.default('ACTIVE'),
  })
  .strict();
export type CreateStaffBody = z.infer<typeof createStaffBody>;

export const updateStaffBody = z
  .object({
    fullName: fullName.optional(),
    designation: designation.optional(),
    /** `null` clears the phone number. */
    phone: phone.nullable().optional(),
    joinedOn: isoDate.optional(),
    status: staffStatusEnum.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field must be provided' });
export type UpdateStaffBody = z.infer<typeof updateStaffBody>;

export const listStaffQuery = z
  .object({
    warehouseId: uuid('warehouseId').optional(),
    status: staffStatusEnum.optional(),
    /** Case-insensitive match on name or staff code. */
    q: z.string().trim().min(1).max(100).optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListStaffQuery = z.infer<typeof listStaffQuery>;

// ---------------------------------------------------------------------------
// Attendance: bodies and queries
// ---------------------------------------------------------------------------
const instant = z.string().datetime({ offset: true, message: 'Must be an ISO 8601 date-time with an offset' });

const attendanceFields = {
  status: attendanceStatusEnum,
  checkIn: instant.optional(),
  checkOut: instant.optional(),
  note: z.string().trim().min(1).max(500).optional(),
};

type AttendanceFields = {
  status: AttendanceStatus;
  checkIn?: string | undefined;
  checkOut?: string | undefined;
};

/** Mirrors the three CHECKs on staff_attendance, so a bad body is a 422 and never a failed insert. */
function checkTimes(value: AttendanceFields, ctx: z.RefinementCtx): void {
  if (value.status !== 'PRESENT' && (value.checkIn !== undefined || value.checkOut !== undefined)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'checkIn and checkOut can only be given for a PRESENT day',
      path: [value.checkIn !== undefined ? 'checkIn' : 'checkOut'],
    });
    return;
  }
  if (value.checkOut !== undefined && value.checkIn === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'checkOut needs a checkIn', path: ['checkOut'] });
    return;
  }
  if (value.checkIn !== undefined && value.checkOut !== undefined && Date.parse(value.checkOut) < Date.parse(value.checkIn)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'checkOut cannot be before checkIn', path: ['checkOut'] });
  }
}

export const markAttendanceBody = z.object(attendanceFields).strict().superRefine(checkTimes);
export type MarkAttendanceBody = z.infer<typeof markAttendanceBody>;

/** Upper bound on one bulk request: a payload-size guard, not a business rule. */
const MAX_BULK_ENTRIES = 200;

export const bulkAttendanceBody = z
  .object({
    entries: z
      .array(z.object({ staffId: uuid('staffId'), ...attendanceFields }).strict().superRefine(checkTimes))
      .min(1)
      .max(MAX_BULK_ENTRIES)
      .refine((entries) => new Set(entries.map((entry) => entry.staffId)).size === entries.length, {
        message: 'A staff member can appear only once in one request',
      }),
  })
  .strict();
export type BulkAttendanceBody = z.infer<typeof bulkAttendanceBody>;

export const rollCallQuery = z
  .object({ date: isoDate.optional(), warehouseId: uuid('warehouseId').optional() })
  .strict();
export type RollCallQuery = z.infer<typeof rollCallQuery>;

export const listAttendanceQuery = z
  .object({
    staffId: uuid('staffId').optional(),
    warehouseId: uuid('warehouseId').optional(),
    status: attendanceStatusEnum.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(dateRange, DATE_RANGE_MESSAGE);
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuery>;

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Either `month` (YYYY-MM) or `from` and `to`; the span cap is system_config, enforced by the service. */
export const attendanceSummaryQuery = z
  .object({
    staffId: uuid('staffId').optional(),
    warehouseId: uuid('warehouseId').optional(),
    month: z.string().regex(MONTH, 'Must be YYYY-MM').optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .strict()
  .refine(
    (value) => (value.month !== undefined) !== (value.from !== undefined || value.to !== undefined),
    { message: 'Give either month, or both from and to' },
  )
  .refine((value) => value.month !== undefined || (value.from !== undefined && value.to !== undefined), {
    message: 'from and to must be given together',
    path: ['to'],
  })
  .refine(dateRange, DATE_RANGE_MESSAGE);
export type AttendanceSummaryQuery = z.infer<typeof attendanceSummaryQuery>;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------
const pageMeta = z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() });

export const staffResponse = z.object({
  id: z.string().uuid(),
  staffCode: z.string(),
  warehouseId: z.string().uuid(),
  fullName: z.string(),
  designation: z.string(),
  phone: z.string().nullable(),
  joinedOn: z.string(),
  status: staffStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type StaffResponse = z.infer<typeof staffResponse>;

export const listStaffResponse = z.object({ items: z.array(staffResponse), page: pageMeta });
export type ListStaffResponse = z.infer<typeof listStaffResponse>;

export const attendanceResponse = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid(),
  staffCode: z.string(),
  staffName: z.string(),
  designation: z.string(),
  warehouseId: z.string().uuid(),
  workDate: z.string(),
  status: attendanceStatusEnum,
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(),
  note: z.string().nullable(),
  markedBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type AttendanceResponse = z.infer<typeof attendanceResponse>;

export const listAttendanceResponse = z.object({
  items: z.array(attendanceResponse),
  /** Exact counts over EVERY row matching the filters, not only this page. */
  summary: z.object({
    present: z.number().int(),
    absent: z.number().int(),
    leave: z.number().int(),
    total: z.number().int(),
  }),
  page: pageMeta,
});
export type ListAttendanceResponse = z.infer<typeof listAttendanceResponse>;

export const bulkAttendanceResponse = z.object({
  date: z.string(),
  items: z.array(attendanceResponse),
  created: z.number().int(),
  updated: z.number().int(),
  unchanged: z.number().int(),
});
export type BulkAttendanceResponse = z.infer<typeof bulkAttendanceResponse>;

export const rollCallResponse = z.object({
  date: z.string(),
  items: z.array(
    z.object({
      staffId: z.string().uuid(),
      staffCode: z.string(),
      staffName: z.string(),
      designation: z.string(),
      warehouseId: z.string().uuid(),
      staffStatus: staffStatusEnum,
      /** Null: not marked yet ("Not Checked In" in the design). */
      attendance: z
        .object({
          id: z.string().uuid(),
          status: attendanceStatusEnum,
          checkIn: z.string().nullable(),
          checkOut: z.string().nullable(),
          note: z.string().nullable(),
        })
        .nullable(),
    }),
  ),
  summary: z.object({
    present: z.number().int(),
    absent: z.number().int(),
    leave: z.number().int(),
    notMarked: z.number().int(),
    total: z.number().int(),
  }),
});
export type RollCallResponse = z.infer<typeof rollCallResponse>;

const staffCounts = z.object({
  present: z.number().int(),
  absent: z.number().int(),
  leave: z.number().int(),
  /** present + absent + leave: the days that have a row. Unmarked days are not counted. */
  marked: z.number().int(),
});

export const attendanceSummaryResponse = z.object({
  from: z.string(),
  to: z.string(),
  totals: staffCounts,
  byStaff: z.array(
    staffCounts.extend({
      staffId: z.string().uuid(),
      staffCode: z.string(),
      staffName: z.string(),
      designation: z.string(),
      warehouseId: z.string().uuid(),
    }),
  ),
});
export type AttendanceSummaryResponse = z.infer<typeof attendanceSummaryResponse>;

export const attendanceHistoryResponse = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      action: z.enum(['CREATED', 'UPDATED']),
      fromStatus: attendanceStatusEnum.nullable(),
      fromCheckIn: z.string().nullable(),
      fromCheckOut: z.string().nullable(),
      fromNote: z.string().nullable(),
      toStatus: attendanceStatusEnum,
      toCheckIn: z.string().nullable(),
      toCheckOut: z.string().nullable(),
      toNote: z.string().nullable(),
      changedBy: z.string().uuid(),
      createdAt: z.string(),
    }),
  ),
});
export type AttendanceHistoryResponse = z.infer<typeof attendanceHistoryResponse>;
