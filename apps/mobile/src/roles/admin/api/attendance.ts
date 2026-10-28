/**
 * Warehouse staff attendance (docs/openapi.yaml /admin/staff-attendance, BR-84):
 *   GET /admin/staff-attendance/roll-call                        admin.staff.attendance.view
 *   GET /admin/staff-attendance/summary                          admin.staff.attendance.view
 *   GET /admin/staff-attendance                                  admin.staff.attendance.view
 *   GET /admin/staff-attendance/staff/{staffId}/{date}/history   admin.staff.attendance.view
 *   PUT /admin/staff-attendance/staff/{staffId}/{date}           admin.staff.attendance.mark
 *   PUT /admin/staff-attendance/dates/{date}                     admin.staff.attendance.mark
 *
 * view: SA/TOHFA all, MAIN own, SUB none. mark: SA all, MAIN own, TOHFA and SUB none.
 *
 * Shapes mirror apps/api/src/modules/warehouse-staff/warehouse-staff.schema.ts.
 * Dates are Asia/Kolkata calendar dates (YYYY-MM-DD); check-in / check-out are
 * ISO instants. Both marks are upserts keyed by (staff, day): the spec says a
 * replay is safe and declares no Idempotency-Key, so none is sent (BR-84d).
 * There are only three statuses (PRESENT, ABSENT, LEAVE); "not checked in" is
 * the roll call's `attendance: null`, never a status.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { PageMeta } from '../../../shell/api/pagination';
import { adminGet, adminPut } from './http';
import type { StaffStatus } from './staff';

/** warehouse-staff.schema.ts attendanceStatuses. */
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LEAVE'] as const;
export type AttendanceStatusCode = (typeof ATTENDANCE_STATUSES)[number];

/** One bulk request carries at most this many entries (schema MAX_BULK_ENTRIES, a payload guard). */
export const MAX_BULK_ATTENDANCE = 200;

/** docs/openapi.yaml `StaffAttendance`. */
export interface AttendanceDto {
  id: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  designation: string;
  warehouseId: string;
  workDate: string;
  status: AttendanceStatusCode;
  checkIn: string | null;
  checkOut: string | null;
  note: string | null;
  markedBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface RollCallMarkDto {
  id: string;
  status: AttendanceStatusCode;
  checkIn: string | null;
  checkOut: string | null;
  note: string | null;
}

export interface RollCallItemDto {
  staffId: string;
  staffCode: string;
  staffName: string;
  designation: string;
  warehouseId: string;
  staffStatus: StaffStatus;
  /** null: not marked yet ("Not Checked In"). */
  attendance: RollCallMarkDto | null;
}

/** docs/openapi.yaml `StaffRollCall`. */
export interface RollCallDto {
  date: string;
  items: RollCallItemDto[];
  summary: { present: number; absent: number; leave: number; notMarked: number; total: number };
}

export interface AttendanceCounts {
  present: number;
  absent: number;
  leave: number;
  /** present + absent + leave; unmarked days are not counted. */
  marked: number;
}

export interface StaffAttendanceCounts extends AttendanceCounts {
  staffId: string;
  staffCode: string;
  staffName: string;
  designation: string;
  warehouseId: string;
}

/** docs/openapi.yaml `StaffAttendanceSummary`. */
export interface AttendanceSummaryDto {
  from: string;
  to: string;
  totals: AttendanceCounts;
  byStaff: StaffAttendanceCounts[];
}

/** GET /admin/staff-attendance: a page plus exact counts over every matching row. */
export interface AttendanceListDto {
  items: AttendanceDto[];
  summary: { present: number; absent: number; leave: number; total: number };
  page: PageMeta;
}

export interface AttendanceHistoryItemDto {
  id: string;
  action: 'CREATED' | 'UPDATED';
  fromStatus: AttendanceStatusCode | null;
  fromCheckIn: string | null;
  fromCheckOut: string | null;
  fromNote: string | null;
  toStatus: AttendanceStatusCode;
  toCheckIn: string | null;
  toCheckOut: string | null;
  toNote: string | null;
  changedBy: string;
  createdAt: string;
}

export interface AttendanceHistoryDto {
  items: AttendanceHistoryItemDto[];
}

/** docs/openapi.yaml `StaffAttendanceMark`. Times only on a PRESENT day; checkOut needs checkIn. */
export interface MarkAttendanceBody {
  status: AttendanceStatusCode;
  checkIn?: string;
  checkOut?: string;
  /** 1-500 chars. */
  note?: string;
}

export interface BulkAttendanceEntry extends MarkAttendanceBody {
  staffId: string;
}

export interface BulkAttendanceBody {
  /** 1-200 entries, each staff member at most once. */
  entries: BulkAttendanceEntry[];
}

export interface BulkAttendanceResultDto {
  date: string;
  items: AttendanceDto[];
  created: number;
  updated: number;
  unchanged: number;
}

export interface RollCallParams {
  /** Defaults to today (Asia/Kolkata) on the server. */
  date?: string | undefined;
  warehouseId?: string | undefined;
}

/** Either `month` (YYYY-MM), or both `from` and `to`. */
export interface AttendanceSummaryParams {
  staffId?: string | undefined;
  warehouseId?: string | undefined;
  month?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export interface ListAttendanceParams {
  staffId?: string | undefined;
  warehouseId?: string | undefined;
  status?: AttendanceStatusCode | undefined;
  from?: string | undefined;
  to?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/** Problem codes these routes document: 409 is a deactivated staff member (BR-84g). */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
];

const BASE = '/admin/staff-attendance';

function staffDayPath(staffId: string, date: string): string {
  return `${BASE}/staff/${encodeURIComponent(staffId)}/${encodeURIComponent(date)}`;
}

/** Every active staff member with that day's mark or null. */
export function getRollCall(params: RollCallParams = {}, signal?: AbortSignal): Promise<RollCallDto> {
  return adminGet<RollCallDto>(`${BASE}/roll-call`, { date: params.date, warehouseId: params.warehouseId }, signal);
}

/**
 * Per-staff counts over a month or a from/to span. A month wins over a span so
 * the request never carries both (the server answers 422 to that).
 */
export function getAttendanceSummary(params: AttendanceSummaryParams, signal?: AbortSignal): Promise<AttendanceSummaryDto> {
  const byMonth = params.month !== undefined;
  return adminGet<AttendanceSummaryDto>(
    `${BASE}/summary`,
    {
      staffId: params.staffId,
      warehouseId: params.warehouseId,
      month: params.month,
      from: byMonth ? undefined : params.from,
      to: byMonth ? undefined : params.to,
    },
    signal,
  );
}

/** Attendance rows, newest day first, cursor paged. */
export function listAttendance(params: ListAttendanceParams = {}, signal?: AbortSignal): Promise<AttendanceListDto> {
  return adminGet<AttendanceListDto>(
    BASE,
    {
      staffId: params.staffId,
      warehouseId: params.warehouseId,
      status: params.status,
      from: params.from,
      to: params.to,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

/** The append-only change history of one staff member's day. */
export function getAttendanceHistory(staffId: string, date: string, signal?: AbortSignal): Promise<AttendanceHistoryDto> {
  return adminGet<AttendanceHistoryDto>(`${staffDayPath(staffId, date)}/history`, undefined, signal);
}

/** Mark or correct one staff member's day (201 created, 200 updated or unchanged). */
export function markAttendance(staffId: string, date: string, body: MarkAttendanceBody): Promise<AttendanceDto> {
  return adminPut<AttendanceDto>(staffDayPath(staffId, date), body);
}

/** Mark many staff members for one day, all or nothing. */
export function markAttendanceBulk(date: string, body: BulkAttendanceBody): Promise<BulkAttendanceResultDto> {
  return adminPut<BulkAttendanceResultDto>(`${BASE}/dates/${encodeURIComponent(date)}`, body);
}
