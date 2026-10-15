/**
 * Pure decisions behind the staff & attendance screens (no React, no
 * react-native), so plain-Node vitest covers them: permission gating, the
 * Asia/Kolkata calendar arithmetic the date pickers and ranges use, API -> view
 * mapping, and the request bodies (create / update staff, mark attendance,
 * bulk mark) with their client-side checks.
 *
 * The client checks only stop a form the server would refuse with 422; the
 * server (warehouse-staff.schema.ts / .service.ts) is the authority on every
 * one of them, and on scope (404 outside it) and deactivated staff (409).
 *
 * Dates: the API speaks Asia/Kolkata calendar dates ("YYYY-MM-DD"). "Today" is
 * computed from the real clock with the same fixed +05:30 shift as
 * utils/datetime.ts (India has no daylight saving), never from a fixed date.
 */
import {
  MAX_BULK_ATTENDANCE,
  type AttendanceDto,
  type AttendanceHistoryDto,
  type AttendanceStatusCode,
  type AttendanceSummaryDto,
  type BulkAttendanceEntry,
  type MarkAttendanceBody,
  type RollCallDto,
} from '../../../api/attendance';
import {
  STAFF_DESIGNATION_MAX,
  STAFF_NAME_MAX,
  STAFF_PHONE_PATTERN,
  type CreateStaffBody,
  type StaffDto,
  type StaffStatus,
  type UpdateStaffBody,
} from '../../../api/staff';
import { t, type TranslationKey } from '../../../i18n';
import type { AdminTone } from '../../../theme';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import type {
  AttendanceChange,
  AttendanceFilter,
  AttendanceHistoryEntry,
  PermissionCheck,
  RollCallRow,
  StaffAttendanceSummaryRow,
  StaffMember,
  StaffRoute,
  WarehouseScope,
} from './types';

/** docs/rbac.json codes the staff & attendance screens check. */
export const STAFF_CODES = {
  /** Roster list and detail. SA/TOHFA all, MAIN own, SUB none. */
  listView: 'admin.staff.list_view',
  /** Create, edit, deactivate. SA/TOHFA all, MAIN own, SUB none. */
  manage: 'admin.staff.manage',
  /** Roll call, history, summary. SA/TOHFA all, MAIN own, SUB none. */
  attendanceView: 'admin.staff.attendance.view',
  /** Mark one or many. SA all, MAIN own, TOHFA none, SUB none. */
  attendanceMark: 'admin.staff.attendance.mark',
  /** The warehouse master list (Main picker and names). SUB none. */
  warehouseList: 'warehouse.all.view',
} as const;

// ─── Permission gating (display only; the server enforces every action) ──────

const ROUTE_CODE: Record<StaffRoute, string> = {
  Staff: STAFF_CODES.listView,
  StaffDetail: STAFF_CODES.listView,
  EditStaffProfile: STAFF_CODES.manage,
  Attendance: STAFF_CODES.attendanceView,
  AttendanceDetail: STAFF_CODES.attendanceView,
  AttendanceHistory: STAFF_CODES.attendanceView,
};

/** The code a route needs. Every staff and attendance route needs one (BR-83: Sub holds none). */
export function staffRouteCode(route: StaffRoute): string {
  return ROUTE_CODE[route];
}

export function canOpenStaffRoute(route: StaffRoute, can: PermissionCheck): boolean {
  return can(ROUTE_CODE[route]);
}

export function canManageStaff(can: PermissionCheck): boolean {
  return can(STAFF_CODES.manage);
}

/** Deactivate is offered only for an ACTIVE member (a repeat is a server no-op anyway). */
export function canDeactivateStaff(can: PermissionCheck, member: Pick<StaffMember, 'status'>): boolean {
  return can(STAFF_CODES.manage) && member.status === 'ACTIVE';
}

export function canViewAttendance(can: PermissionCheck): boolean {
  return can(STAFF_CODES.attendanceView);
}

export function canMarkAttendance(can: PermissionCheck): boolean {
  return can(STAFF_CODES.attendanceMark);
}

/**
 * The warehouse a read or write is narrowed to: the one picked in Main's
 * selector, else the scope's own (undefined = all the caller may see).
 */
export function staffWarehouseFilter(scope: WarehouseScope, selectedWarehouseId: string | undefined): string | undefined {
  return scope.warehouseId ?? selectedWarehouseId;
}

// ─── Calendar dates (Asia/Kolkata) ───────────────────────────────────────────

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** [year, month 1-12, day] of a YYYY-MM-DD, or null when it is not one. */
export function parseIsoDate(date: string): [number, number, number] | null {
  const m = ISO_DATE.exec(date);
  if (m === null) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return [year, month, day];
}

/** Today's Asia/Kolkata calendar date for the instant `now`. */
export function istToday(now: Date): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  return toIso(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
}

/** `date` moved by `days` calendar days. */
export function shiftIsoDate(date: string, days: number): string {
  const parts = parseIsoDate(date);
  if (parts === null) return date;
  const ms = Date.UTC(parts[0], parts[1] - 1, parts[2]) + days * DAY_MS;
  const d = new Date(ms);
  return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** YYYY-MM-DD strings compare in calendar order. */
export function isAfterDate(date: string, other: string): boolean {
  return date > other;
}

/** A day after today cannot be marked or viewed (the server answers 422, BR-84f). */
export function clampToToday(date: string, today: string): string {
  return isAfterDate(date, today) ? today : date;
}

/** "25 Sep 2026" for a calendar date ('' when it is not one). */
export function formatIsoDate(date: string): string {
  const parts = parseIsoDate(date);
  if (parts === null) return '';
  return t('datetime.day', { day: parts[2], month: t(`datetime.month.${parts[1]}` as TranslationKey), year: parts[0] });
}

/** The month a date falls in, for the date picker sheet. */
export interface CalendarMonth {
  year: number;
  month: number;
  daysInMonth: number;
  /** 0 = Sunday. */
  firstWeekday: number;
  /** "Sep 2026". */
  label: string;
}

export function calendarMonthOf(date: string): CalendarMonth {
  const parts = parseIsoDate(date) ?? [1970, 1, 1];
  const [year, month] = parts;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  return { year, month, daysInMonth, firstWeekday, label: t('staff.date.month', { month: t(`datetime.month.${month}` as TranslationKey), year }) };
}

/** The same month as `date`, on `day` (clamped to the month). */
export function withDay(date: string, day: number): string {
  const cal = calendarMonthOf(date);
  return toIso(cal.year, cal.month, Math.min(Math.max(1, day), cal.daysInMonth));
}

export function dayOf(date: string): number {
  return parseIsoDate(date)?.[2] ?? 1;
}

/** YYYY-MM of a date (the summary's `month` query). */
export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export type HistoryRange = 'Today' | '7 Days' | '30 Days' | 'This Month';
export const HISTORY_RANGES: readonly HistoryRange[] = ['Today', '7 Days', '30 Days', 'This Month'];

/** The inclusive from/to of a history range ending today. */
export function historyRangeDates(range: HistoryRange, today: string): { from: string; to: string } {
  switch (range) {
    case 'Today':
      return { from: today, to: today };
    case '7 Days':
      return { from: shiftIsoDate(today, -6), to: today };
    case '30 Days':
      return { from: shiftIsoDate(today, -29), to: today };
    case 'This Month':
    default:
      return { from: `${monthOf(today)}-01`, to: today };
  }
}

const RANGE_LABEL: Record<HistoryRange, TranslationKey> = {
  Today: 'staff.history.range.today',
  '7 Days': 'staff.history.range.week',
  '30 Days': 'staff.history.range.month30',
  'This Month': 'staff.history.range.thisMonth',
};

export function historyRangeLabel(range: HistoryRange): string {
  return t(RANGE_LABEL[range]);
}

// ─── Status ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AttendanceStatusCode, TranslationKey> = {
  PRESENT: 'staff.attendance.status.PRESENT',
  ABSENT: 'staff.attendance.status.ABSENT',
  LEAVE: 'staff.attendance.status.LEAVE',
};

const STATUS_TONE: Record<AttendanceStatusCode, AdminTone> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  LEAVE: 'warning',
};

/** null is the roll call's "not marked yet". */
export function attendanceStatusLabel(status: AttendanceStatusCode | null): string {
  return status === null ? t('staff.attendance.status.notMarked') : t(STATUS_LABEL[status]);
}

export function attendanceStatusTone(status: AttendanceStatusCode | null): AdminTone {
  return status === null ? 'info' : STATUS_TONE[status];
}

export function staffStatusLabel(status: StaffStatus): string {
  return status === 'ACTIVE' ? t('staff.status.ACTIVE') : t('staff.status.INACTIVE');
}

export function staffStatusTone(status: StaffStatus): AdminTone {
  return status === 'ACTIVE' ? 'success' : 'danger';
}

export const ATTENDANCE_FILTERS: readonly AttendanceFilter[] = ['All', 'Present', 'Absent', 'On Leave', 'Not Marked'];

const FILTER_LABEL: Record<AttendanceFilter, TranslationKey> = {
  All: 'staff.filter.all',
  Present: 'staff.attendance.status.PRESENT',
  Absent: 'staff.attendance.status.ABSENT',
  'On Leave': 'staff.attendance.status.LEAVE',
  'Not Marked': 'staff.attendance.status.notMarked',
};

export function attendanceFilterLabel(filter: AttendanceFilter): string {
  return t(FILTER_LABEL[filter]);
}

const FILTER_STATUS: Record<Exclude<AttendanceFilter, 'All'>, AttendanceStatusCode | null> = {
  Present: 'PRESENT',
  Absent: 'ABSENT',
  'On Leave': 'LEAVE',
  'Not Marked': null,
};

// ─── Mapping ─────────────────────────────────────────────────────────────────

export type WarehouseNameOf = (warehouseId: string) => string;

/**
 * Main reads every warehouse's name from GET /warehouses; a confined admin
 * knows only its own. An unknown id reads "Another warehouse", never a fixture name.
 */
export function makeWarehouseNameOf(
  scope: WarehouseScope,
  options: readonly { warehouseId: string; warehouseName: string }[],
): WarehouseNameOf {
  const byId = new Map(options.map((o) => [o.warehouseId, o.warehouseName]));
  return (warehouseId) => {
    const known = byId.get(warehouseId);
    if (known !== undefined) return known;
    if (scope.warehouseId !== undefined && warehouseId === scope.warehouseId && scope.warehouseName) return scope.warehouseName;
    return t('staff.warehouse.other');
  };
}

export function toStaffMember(dto: StaffDto, nameOf: WarehouseNameOf): StaffMember {
  return {
    id: dto.id,
    staffCode: dto.staffCode,
    name: dto.fullName,
    designation: dto.designation,
    phone: dto.phone,
    joinedOn: dto.joinedOn,
    joinedOnText: formatIsoDate(dto.joinedOn),
    status: dto.status,
    warehouseId: dto.warehouseId,
    warehouseName: nameOf(dto.warehouseId),
    createdAtText: formatAdminDay(dto.createdAt),
    updatedAtText: dto.updatedAt === null ? null : formatAdminDay(dto.updatedAt),
  };
}

function timeText(iso: string | null, now: Date): string | null {
  if (iso === null) return null;
  const text = formatAdminDate(iso, now);
  return text === '' ? null : text;
}

export function toRollCallRows(dto: RollCallDto, nameOf: WarehouseNameOf, now: Date): RollCallRow[] {
  return dto.items.map((item) => ({
    staffId: item.staffId,
    staffCode: item.staffCode,
    name: item.staffName,
    designation: item.designation,
    warehouseId: item.warehouseId,
    warehouseName: nameOf(item.warehouseId),
    status: item.attendance?.status ?? null,
    checkIn: item.attendance?.checkIn ?? null,
    checkOut: item.attendance?.checkOut ?? null,
    checkInText: timeText(item.attendance?.checkIn ?? null, now),
    checkOutText: timeText(item.attendance?.checkOut ?? null, now),
    note: item.attendance?.note ?? null,
  }));
}

/** The roll-call rows a chip and a search box leave (search: name, staff code or designation). */
export function filterRollCall(rows: readonly RollCallRow[], filter: AttendanceFilter, query: string): RollCallRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter !== 'All' && row.status !== FILTER_STATUS[filter]) return false;
    if (q === '') return true;
    return (
      row.name.toLowerCase().includes(q) || row.staffCode.toLowerCase().includes(q) || row.designation.toLowerCase().includes(q)
    );
  });
}

/** Today's mark of each staff id (from the roll call), for the roster badges. */
export function attendanceByStaff(rows: readonly RollCallRow[]): ReadonlyMap<string, AttendanceStatusCode | null> {
  return new Map(rows.map((row) => [row.staffId, row.status]));
}

export function toHistoryEntry(dto: AttendanceDto, now: Date): AttendanceHistoryEntry {
  const checkIn = timeText(dto.checkIn, now);
  const checkOut = timeText(dto.checkOut, now);
  let timeRange: string | null = null;
  if (checkIn !== null && checkOut !== null) timeRange = t('staff.attendance.timeRange', { from: checkIn, to: checkOut });
  else if (checkIn !== null) timeRange = t('staff.attendance.checkedInAt', { time: checkIn });
  return {
    id: dto.id,
    staffId: dto.staffId,
    date: dto.workDate,
    dateText: formatIsoDate(dto.workDate),
    name: dto.staffName,
    designation: dto.designation,
    status: dto.status,
    timeRange,
  };
}

/** History rows grouped by day, in the order the server sent them (newest day first). */
export function groupHistoryByDate(entries: readonly AttendanceHistoryEntry[]): { date: string; dateText: string; entries: AttendanceHistoryEntry[] }[] {
  const groups: { date: string; dateText: string; entries: AttendanceHistoryEntry[] }[] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.date === entry.date) last.entries.push(entry);
    else groups.push({ date: entry.date, dateText: entry.dateText, entries: [entry] });
  }
  return groups;
}

export function toSummaryRows(dto: AttendanceSummaryDto): StaffAttendanceSummaryRow[] {
  return dto.byStaff.map((row) => ({
    staffId: row.staffId,
    name: row.staffName,
    designation: row.designation,
    present: row.present,
    absent: row.absent,
    leave: row.leave,
    marked: row.marked,
  }));
}

export function toAttendanceChanges(dto: AttendanceHistoryDto, now: Date): AttendanceChange[] {
  return dto.items.map((item) => ({
    id: item.id,
    action: item.action,
    fromStatus: item.fromStatus,
    toStatus: item.toStatus,
    whenText: formatAdminDate(item.createdAt, now),
  }));
}

/** One line of a change: "Marked Present" or "Absent → Present". */
export function attendanceChangeTitle(change: AttendanceChange): string {
  if (change.action === 'CREATED' || change.fromStatus === null) {
    return t('staff.attendance.change.created', { status: attendanceStatusLabel(change.toStatus) });
  }
  if (change.fromStatus === change.toStatus) {
    return t('staff.attendance.change.timesUpdated', { status: attendanceStatusLabel(change.toStatus) });
  }
  return t('staff.attendance.change.updated', {
    from: attendanceStatusLabel(change.fromStatus),
    to: attendanceStatusLabel(change.toStatus),
  });
}

// ─── Staff form ──────────────────────────────────────────────────────────────

export interface StaffForm {
  fullName: string;
  designation: string;
  /** '' = none. */
  phone: string;
  /** YYYY-MM-DD. */
  joinedOn: string;
  status: StaffStatus;
}

export type FormResult<B> = { ok: true; body: B } | { ok: false; errorKey: TranslationKey };

export function emptyStaffForm(today: string): StaffForm {
  return { fullName: '', designation: '', phone: '', joinedOn: today, status: 'ACTIVE' };
}

export function staffFormOf(member: StaffMember): StaffForm {
  return {
    fullName: member.name,
    designation: member.designation,
    phone: member.phone ?? '',
    joinedOn: member.joinedOn,
    status: member.status,
  };
}

function checkForm(form: StaffForm): TranslationKey | null {
  const name = form.fullName.trim();
  if (name === '' || name.length > STAFF_NAME_MAX) return 'staff.form.error.name';
  const designation = form.designation.trim();
  if (designation === '' || designation.length > STAFF_DESIGNATION_MAX) return 'staff.form.error.designation';
  const phone = form.phone.trim();
  if (phone !== '' && !STAFF_PHONE_PATTERN.test(phone)) return 'staff.form.error.phone';
  if (parseIsoDate(form.joinedOn) === null) return 'staff.form.error.joinedOn';
  return null;
}

/**
 * The POST body. `warehouseId` is the one picked (or the scope's own); an
 * unconfined caller (Main, Super Admin) must name one or the server answers
 * 422 (BR-83d), so the form refuses without it.
 */
export function buildCreateStaffBody(form: StaffForm, warehouseId: string | undefined): FormResult<CreateStaffBody> {
  const error = checkForm(form);
  if (error !== null) return { ok: false, errorKey: error };
  if (warehouseId === undefined) return { ok: false, errorKey: 'staff.form.error.warehouse' };
  const phone = form.phone.trim();
  return {
    ok: true,
    body: {
      fullName: form.fullName.trim(),
      designation: form.designation.trim(),
      ...(phone === '' ? {} : { phone }),
      joinedOn: form.joinedOn,
      warehouseId,
      status: form.status,
    },
  };
}

/**
 * The PATCH body: only the fields that changed (the server needs at least one
 * and audits field names, BR-83g). A cleared phone is sent as null. Nothing
 * changed -> 'staff.form.error.noChanges'.
 */
export function buildUpdateStaffBody(member: StaffMember, form: StaffForm): FormResult<UpdateStaffBody> {
  const error = checkForm(form);
  if (error !== null) return { ok: false, errorKey: error };
  const body: UpdateStaffBody = {};
  const name = form.fullName.trim();
  const designation = form.designation.trim();
  const phone = form.phone.trim();
  if (name !== member.name) body.fullName = name;
  if (designation !== member.designation) body.designation = designation;
  if (phone !== (member.phone ?? '')) body.phone = phone === '' ? null : phone;
  if (form.joinedOn !== member.joinedOn) body.joinedOn = form.joinedOn;
  if (form.status !== member.status) body.status = form.status;
  if (Object.keys(body).length === 0) return { ok: false, errorKey: 'staff.form.error.noChanges' };
  return { ok: true, body };
}

// ─── Attendance bodies ───────────────────────────────────────────────────────

/** A plain status mark. Times are only allowed on a PRESENT day, so an existing check-in is kept only then. */
export function markStatusBody(status: AttendanceStatusCode, row: Pick<RollCallRow, 'checkIn' | 'checkOut' | 'status'> | null): MarkAttendanceBody {
  if (status === 'PRESENT' && row !== null && row.status === 'PRESENT' && row.checkIn !== null) {
    return { status, checkIn: row.checkIn, ...(row.checkOut === null ? {} : { checkOut: row.checkOut }) };
  }
  return { status };
}

/** "Check in now": PRESENT with the real current instant. */
export function checkInNowBody(now: Date): MarkAttendanceBody {
  return { status: 'PRESENT', checkIn: now.toISOString() };
}

/** "Check out now": keeps the check-in (a check-out needs one and cannot precede it). Null when there is no check-in. */
export function checkOutNowBody(row: Pick<RollCallRow, 'checkIn'>, now: Date): MarkAttendanceBody | null {
  if (row.checkIn === null) return null;
  const checkInMs = Date.parse(row.checkIn);
  if (!Number.isFinite(checkInMs) || now.getTime() < checkInMs) return null;
  return { status: 'PRESENT', checkIn: row.checkIn, checkOut: now.toISOString() };
}

/**
 * "Mark unmarked as present": one PRESENT entry for every roll-call row with
 * no mark, split into requests of at most MAX_BULK_ATTENDANCE (each request is
 * all-or-nothing on the server, BR-84j). Rows already marked are left alone so
 * a bulk never overwrites someone's Absent or Leave.
 */
export function bulkPresentChunks(rows: readonly RollCallRow[]): BulkAttendanceEntry[][] {
  const entries: BulkAttendanceEntry[] = rows.filter((row) => row.status === null).map((row) => ({ staffId: row.staffId, status: 'PRESENT' }));
  const chunks: BulkAttendanceEntry[][] = [];
  for (let i = 0; i < entries.length; i += MAX_BULK_ATTENDANCE) chunks.push(entries.slice(i, i + MAX_BULK_ATTENDANCE));
  return chunks;
}
