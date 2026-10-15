/**
 * Module 14 (Warehouse Staff and Attendance): SQL only.
 *
 * Warehouse scoping uses `warehouseScopeFilter` (src/rbac/warehouseScope.ts), never `scopedWhere`:
 * `scopedWhere` fails closed for a Main Warehouse Admin, who has no warehouse dimension, and this
 * module's `own` grants include that role. The filter is applied inside every query that reads or
 * locks a staff row, so a row outside the caller's scope is simply absent (CLAUDE.md 2.1).
 *
 * `work_date` is a `date` column read back as `YYYY-MM-DD` text (never a JS Date, which would
 * shift it by the server's time zone). The history rows are written by the trigger in
 * db/migrations/0057_staff_attendance_history.sql, not by this file.
 */
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import type { AttendanceStatus, StaffStatus } from './warehouse-staff.schema.js';

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------
export interface StaffRecord {
  id: string;
  staffCode: string;
  warehouseId: string;
  fullName: string;
  designation: string;
  phone: string | null;
  joinedOn: string;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface NewStaffInput {
  warehouseId: string;
  fullName: string;
  designation: string;
  phone: string | null;
  joinedOn: string;
  status: StaffStatus;
}

export interface StaffPatch {
  fullName?: string;
  designation?: string;
  phone?: string | null;
  joinedOn?: string;
  status?: StaffStatus;
}

export interface StaffFilters {
  warehouseId?: string | undefined;
  status?: StaffStatus | undefined;
  q?: string | undefined;
}

export interface StaffCursor {
  fullName: string;
  id: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  designation: string;
  warehouseId: string;
  workDate: string;
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  note: string | null;
  markedBy: string;
  createdAt: string;
  updatedAt: string | null;
}

/** The mutable part of an attendance row; the same shape is compared to decide "no change". */
export interface AttendanceValues {
  status: AttendanceStatus;
  checkIn: string | null;
  checkOut: string | null;
  note: string | null;
}

export interface NewAttendanceInput extends AttendanceValues {
  staffId: string;
  warehouseId: string;
  workDate: string;
  markedBy: string;
}

export interface AttendanceFilters {
  staffId?: string | undefined;
  warehouseId?: string | undefined;
  status?: AttendanceStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export interface AttendanceCursor {
  workDate: string;
  id: string;
}

export interface StatusCounts {
  present: number;
  absent: number;
  leave: number;
  total: number;
}

export interface RollCallRecord {
  staffId: string;
  staffCode: string;
  staffName: string;
  designation: string;
  warehouseId: string;
  staffStatus: StaffStatus;
  attendance: { id: string; status: AttendanceStatus; checkIn: string | null; checkOut: string | null; note: string | null } | null;
}

export interface StaffSummaryRecord {
  staffId: string;
  staffCode: string;
  staffName: string;
  designation: string;
  warehouseId: string;
  present: number;
  absent: number;
  leave: number;
  marked: number;
}

export interface HistoryRecord {
  id: string;
  action: 'CREATED' | 'UPDATED';
  fromStatus: AttendanceStatus | null;
  fromCheckIn: string | null;
  fromCheckOut: string | null;
  fromNote: string | null;
  toStatus: AttendanceStatus;
  toCheckIn: string | null;
  toCheckOut: string | null;
  toNote: string | null;
  changedBy: string;
  createdAt: string;
}

export interface Page<T, C> {
  items: T[];
  next: C | null;
}

/** 366 is the one-year bound; it matches the row seeded by migration 0056. */
const DEFAULT_MAX_RANGE_DAYS = 366;

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------
interface StaffRow {
  id: string;
  staff_code: string;
  warehouse_id: string;
  full_name: string;
  designation: string;
  phone: string | null;
  joined_on: string;
  status: StaffStatus;
  created_at: Date;
  updated_at: Date | null;
}

interface AttendanceRow {
  id: string;
  staff_id: string;
  staff_code: string;
  staff_name: string;
  designation: string;
  warehouse_id: string;
  work_date: string;
  status: AttendanceStatus;
  check_in: Date | null;
  check_out: Date | null;
  note: string | null;
  marked_by: string;
  created_at: Date;
  updated_at: Date | null;
}

const STAFF_COLUMNS = `s.id, s.staff_code, s.warehouse_id, s.full_name, s.designation, s.phone,
       to_char(s.joined_on, 'YYYY-MM-DD') AS joined_on, s.status, s.created_at, s.updated_at`;

const ATTENDANCE_SELECT = `
  SELECT a.id, a.staff_id, s.staff_code, s.full_name AS staff_name, s.designation, a.warehouse_id,
         to_char(a.work_date, 'YYYY-MM-DD') AS work_date, a.status, a.check_in, a.check_out, a.note,
         a.marked_by, a.created_at, a.updated_at
    FROM staff_attendance a
    JOIN warehouse_staff s ON s.id = a.staff_id`;

const iso = (value: Date | null): string | null => (value === null ? null : value.toISOString());

function mapStaff(row: StaffRow): StaffRecord {
  return {
    id: row.id,
    staffCode: row.staff_code,
    warehouseId: row.warehouse_id,
    fullName: row.full_name,
    designation: row.designation,
    phone: row.phone,
    joinedOn: row.joined_on,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: iso(row.updated_at),
  };
}

function mapAttendance(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    staffId: row.staff_id,
    staffCode: row.staff_code,
    staffName: row.staff_name,
    designation: row.designation,
    warehouseId: row.warehouse_id,
    workDate: row.work_date,
    status: row.status,
    checkIn: iso(row.check_in),
    checkOut: iso(row.check_out),
    note: row.note,
    markedBy: row.marked_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: iso(row.updated_at),
  };
}

/** Escapes LIKE metacharacters so a search for "50%" finds "50%" and not everything. */
function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}

/** Tiny positional-parameter builder: `add(value)` returns the `$n` placeholder. */
class Params {
  readonly values: unknown[] = [];
  add(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

function staffWhere(scope: ResolvedScope, filters: StaffFilters, params: Params): string[] {
  const filter = warehouseScopeFilter(scope, 's.warehouse_id', params.values.length + 1);
  params.values.push(...filter.params);
  const clauses = [filter.sql];
  if (filters.warehouseId !== undefined) clauses.push(`s.warehouse_id = ${params.add(filters.warehouseId)}::uuid`);
  if (filters.status !== undefined) clauses.push(`s.status = ${params.add(filters.status)}`);
  if (filters.q !== undefined) {
    const pattern = params.add(likePattern(filters.q));
    clauses.push(`(s.full_name ILIKE ${pattern} OR s.staff_code ILIKE ${pattern})`);
  }
  return clauses;
}

function attendanceWhere(scope: ResolvedScope, filters: AttendanceFilters, params: Params): string[] {
  const filter = warehouseScopeFilter(scope, 'a.warehouse_id', params.values.length + 1);
  params.values.push(...filter.params);
  const clauses = [filter.sql];
  if (filters.staffId !== undefined) clauses.push(`a.staff_id = ${params.add(filters.staffId)}::uuid`);
  if (filters.warehouseId !== undefined) clauses.push(`a.warehouse_id = ${params.add(filters.warehouseId)}::uuid`);
  if (filters.status !== undefined) clauses.push(`a.status = ${params.add(filters.status)}`);
  if (filters.from !== undefined) clauses.push(`a.work_date >= ${params.add(filters.from)}::date`);
  if (filters.to !== undefined) clauses.push(`a.work_date <= ${params.add(filters.to)}::date`);
  return clauses;
}

// ---------------------------------------------------------------------------
// Repo
// ---------------------------------------------------------------------------
export interface WarehouseStaffRepo {
  activeWarehouseExists(db: Executor, id: string): Promise<boolean>;
  insertStaff(db: Executor, input: NewStaffInput): Promise<StaffRecord>;
  /** `lock` takes a row lock inside the caller's transaction: SHARE to mark, UPDATE to change the staff row. */
  findStaffById(db: Executor, scope: ResolvedScope, id: string, lock?: 'SHARE' | 'UPDATE'): Promise<StaffRecord | null>;
  listStaff(
    db: Executor,
    scope: ResolvedScope,
    filters: StaffFilters,
    limit: number,
    cursor?: StaffCursor,
  ): Promise<Page<StaffRecord, StaffCursor>>;
  updateStaff(db: Executor, id: string, patch: StaffPatch): Promise<StaffRecord>;
  findAttendanceForUpdate(db: Executor, staffId: string, workDate: string): Promise<AttendanceRecord | null>;
  /** Null when a concurrent request inserted the same (staff, day) first. */
  insertAttendance(db: Executor, input: NewAttendanceInput): Promise<AttendanceRecord | null>;
  updateAttendance(db: Executor, id: string, values: AttendanceValues, markedBy: string): Promise<AttendanceRecord>;
  listAttendance(
    db: Executor,
    scope: ResolvedScope,
    filters: AttendanceFilters,
    limit: number,
    cursor?: AttendanceCursor,
  ): Promise<Page<AttendanceRecord, AttendanceCursor>>;
  countAttendance(db: Executor, scope: ResolvedScope, filters: AttendanceFilters): Promise<StatusCounts>;
  rollCall(db: Executor, scope: ResolvedScope, workDate: string, warehouseId?: string): Promise<RollCallRecord[]>;
  summaryByStaff(
    db: Executor,
    scope: ResolvedScope,
    from: string,
    to: string,
    filters: { staffId?: string | undefined; warehouseId?: string | undefined },
  ): Promise<StaffSummaryRecord[]>;
  listHistory(db: Executor, attendanceId: string): Promise<HistoryRecord[]>;
  findAttendanceByStaffDay(db: Executor, scope: ResolvedScope, staffId: string, workDate: string): Promise<AttendanceRecord | null>;
  getMaxRangeDays(db: Executor): Promise<number>;
}

export const warehouseStaffRepo: WarehouseStaffRepo = {
  async activeWarehouseExists(db, id) {
    const result = await db.query(`SELECT 1 FROM warehouses WHERE id = $1 AND is_active AND deleted_at IS NULL`, [id]);
    return result.rowCount === 1;
  },

  async insertStaff(db, input) {
    const result = await db.query<StaffRow>(
      `INSERT INTO warehouse_staff (warehouse_id, full_name, designation, phone, joined_on, status)
       VALUES ($1, $2, $3, $4, $5::date, $6)
    RETURNING id, staff_code, warehouse_id, full_name, designation, phone,
              to_char(joined_on, 'YYYY-MM-DD') AS joined_on, status, created_at, updated_at`,
      [input.warehouseId, input.fullName, input.designation, input.phone, input.joinedOn, input.status],
    );
    return mapStaff(result.rows[0]!);
  },

  async findStaffById(db, scope, id, lock) {
    const params = new Params();
    const idParam = params.add(id);
    const where = staffWhere(scope, {}, params);
    const result = await db.query<StaffRow>(
      `SELECT ${STAFF_COLUMNS}
         FROM warehouse_staff s
        WHERE s.id = ${idParam}::uuid AND ${where.join(' AND ')}
        ${lock === undefined ? '' : `FOR ${lock} OF s`}`,
      params.values,
    );
    const row = result.rows[0];
    return row === undefined ? null : mapStaff(row);
  },

  async listStaff(db, scope, filters, limit, cursor) {
    const params = new Params();
    const clauses = staffWhere(scope, filters, params);
    if (cursor !== undefined) {
      clauses.push(`(s.full_name, s.id) > (${params.add(cursor.fullName)}, ${params.add(cursor.id)}::uuid)`);
    }
    const result = await db.query<StaffRow>(
      `SELECT ${STAFF_COLUMNS}
         FROM warehouse_staff s
        WHERE ${clauses.join(' AND ')}
     ORDER BY s.full_name, s.id
        LIMIT ${params.add(limit + 1)}`,
      params.values,
    );
    const rows = result.rows.slice(0, limit).map(mapStaff);
    const last = rows[rows.length - 1];
    const next = result.rows.length > limit && last !== undefined ? { fullName: last.fullName, id: last.id } : null;
    return { items: rows, next };
  },

  async updateStaff(db, id, patch) {
    const params = new Params();
    const sets: string[] = [];
    if (patch.fullName !== undefined) sets.push(`full_name = ${params.add(patch.fullName)}`);
    if (patch.designation !== undefined) sets.push(`designation = ${params.add(patch.designation)}`);
    if (patch.phone !== undefined) sets.push(`phone = ${params.add(patch.phone)}`);
    if (patch.joinedOn !== undefined) sets.push(`joined_on = ${params.add(patch.joinedOn)}::date`);
    if (patch.status !== undefined) sets.push(`status = ${params.add(patch.status)}`);
    if (sets.length === 0) throw new Error('updateStaff called with an empty patch');
    const result = await db.query<StaffRow>(
      `UPDATE warehouse_staff s
          SET ${sets.join(', ')}
        WHERE s.id = ${params.add(id)}::uuid
    RETURNING ${STAFF_COLUMNS}`,
      params.values,
    );
    return mapStaff(result.rows[0]!);
  },

  async findAttendanceForUpdate(db, staffId, workDate) {
    const result = await db.query<{ id: string }>(
      `SELECT id FROM staff_attendance WHERE staff_id = $1 AND work_date = $2::date FOR UPDATE`,
      [staffId, workDate],
    );
    const found = result.rows[0];
    if (found === undefined) return null;
    const row = await db.query<AttendanceRow>(`${ATTENDANCE_SELECT} WHERE a.id = $1`, [found.id]);
    return mapAttendance(row.rows[0]!);
  },

  async insertAttendance(db, input) {
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO staff_attendance (staff_id, warehouse_id, work_date, status, check_in, check_out, note, marked_by)
       VALUES ($1, $2, $3::date, $4, $5::timestamptz, $6::timestamptz, $7, $8)
       ON CONFLICT (staff_id, work_date) DO NOTHING
    RETURNING id`,
      [input.staffId, input.warehouseId, input.workDate, input.status, input.checkIn, input.checkOut, input.note, input.markedBy],
    );
    const id = inserted.rows[0]?.id;
    if (id === undefined) return null;
    const row = await db.query<AttendanceRow>(`${ATTENDANCE_SELECT} WHERE a.id = $1`, [id]);
    return mapAttendance(row.rows[0]!);
  },

  async updateAttendance(db, id, values, markedBy) {
    await db.query(
      `UPDATE staff_attendance
          SET status = $2, check_in = $3::timestamptz, check_out = $4::timestamptz, note = $5, marked_by = $6
        WHERE id = $1`,
      [id, values.status, values.checkIn, values.checkOut, values.note, markedBy],
    );
    const row = await db.query<AttendanceRow>(`${ATTENDANCE_SELECT} WHERE a.id = $1`, [id]);
    return mapAttendance(row.rows[0]!);
  },

  async listAttendance(db, scope, filters, limit, cursor) {
    const params = new Params();
    const clauses = attendanceWhere(scope, filters, params);
    if (cursor !== undefined) {
      // work_date DESC, id ASC: the next page is "earlier day, or the same day with a later id".
      const date = params.add(cursor.workDate);
      const id = params.add(cursor.id);
      clauses.push(`(a.work_date < ${date}::date OR (a.work_date = ${date}::date AND a.id > ${id}::uuid))`);
    }
    const result = await db.query<AttendanceRow>(
      `${ATTENDANCE_SELECT}
        WHERE ${clauses.join(' AND ')}
     ORDER BY a.work_date DESC, a.id
        LIMIT ${params.add(limit + 1)}`,
      params.values,
    );
    const items = result.rows.slice(0, limit).map(mapAttendance);
    const last = items[items.length - 1];
    const next = result.rows.length > limit && last !== undefined ? { workDate: last.workDate, id: last.id } : null;
    return { items, next };
  },

  async countAttendance(db, scope, filters) {
    const params = new Params();
    const clauses = attendanceWhere(scope, filters, params);
    const result = await db.query<{ present: number; absent: number; leave: number; total: number }>(
      `SELECT count(*) FILTER (WHERE a.status = 'PRESENT')::int AS present,
              count(*) FILTER (WHERE a.status = 'ABSENT')::int AS absent,
              count(*) FILTER (WHERE a.status = 'LEAVE')::int AS leave,
              count(*)::int AS total
         FROM staff_attendance a
        WHERE ${clauses.join(' AND ')}`,
      params.values,
    );
    return result.rows[0]!;
  },

  async rollCall(db, scope, workDate, warehouseId) {
    const params = new Params();
    const date = params.add(workDate);
    const filter = warehouseScopeFilter(scope, 's.warehouse_id', params.values.length + 1);
    params.values.push(...filter.params);
    const clauses = [filter.sql];
    if (warehouseId !== undefined) clauses.push(`s.warehouse_id = ${params.add(warehouseId)}::uuid`);
    // A staff member deactivated later still appears on a day they have a record for.
    clauses.push(`(s.status = 'ACTIVE' OR a.id IS NOT NULL)`);
    const result = await db.query<{
      staff_id: string;
      staff_code: string;
      staff_name: string;
      designation: string;
      warehouse_id: string;
      staff_status: StaffStatus;
      a_id: string | null;
      a_status: AttendanceStatus | null;
      check_in: Date | null;
      check_out: Date | null;
      note: string | null;
    }>(
      `SELECT s.id AS staff_id, s.staff_code, s.full_name AS staff_name, s.designation, s.warehouse_id,
              s.status AS staff_status, a.id AS a_id, a.status AS a_status, a.check_in, a.check_out, a.note
         FROM warehouse_staff s
    LEFT JOIN staff_attendance a ON a.staff_id = s.id AND a.work_date = ${date}::date
        WHERE ${clauses.join(' AND ')}
     ORDER BY s.full_name, s.id`,
      params.values,
    );
    return result.rows.map((row) => ({
      staffId: row.staff_id,
      staffCode: row.staff_code,
      staffName: row.staff_name,
      designation: row.designation,
      warehouseId: row.warehouse_id,
      staffStatus: row.staff_status,
      attendance:
        row.a_id === null || row.a_status === null
          ? null
          : { id: row.a_id, status: row.a_status, checkIn: iso(row.check_in), checkOut: iso(row.check_out), note: row.note },
    }));
  },

  async summaryByStaff(db, scope, from, to, filters) {
    const params = new Params();
    const fromParam = params.add(from);
    const toParam = params.add(to);
    const filter = warehouseScopeFilter(scope, 's.warehouse_id', params.values.length + 1);
    params.values.push(...filter.params);
    const clauses = [filter.sql];
    if (filters.staffId !== undefined) clauses.push(`s.id = ${params.add(filters.staffId)}::uuid`);
    if (filters.warehouseId !== undefined) clauses.push(`s.warehouse_id = ${params.add(filters.warehouseId)}::uuid`);
    const result = await db.query<{
      staff_id: string;
      staff_code: string;
      staff_name: string;
      designation: string;
      warehouse_id: string;
      present: number;
      absent: number;
      leave: number;
      marked: number;
    }>(
      `SELECT s.id AS staff_id, s.staff_code, s.full_name AS staff_name, s.designation, s.warehouse_id,
              count(a.id) FILTER (WHERE a.status = 'PRESENT')::int AS present,
              count(a.id) FILTER (WHERE a.status = 'ABSENT')::int AS absent,
              count(a.id) FILTER (WHERE a.status = 'LEAVE')::int AS leave,
              count(a.id)::int AS marked
         FROM warehouse_staff s
    LEFT JOIN staff_attendance a
           ON a.staff_id = s.id AND a.work_date >= ${fromParam}::date AND a.work_date <= ${toParam}::date
        WHERE ${clauses.join(' AND ')}
     GROUP BY s.id
       HAVING s.status = 'ACTIVE' OR count(a.id) > 0
     ORDER BY s.full_name, s.id`,
      params.values,
    );
    return result.rows.map((row) => ({
      staffId: row.staff_id,
      staffCode: row.staff_code,
      staffName: row.staff_name,
      designation: row.designation,
      warehouseId: row.warehouse_id,
      present: row.present,
      absent: row.absent,
      leave: row.leave,
      marked: row.marked,
    }));
  },

  async listHistory(db, attendanceId) {
    const result = await db.query<{
      id: string;
      action: 'CREATED' | 'UPDATED';
      from_status: AttendanceStatus | null;
      from_check_in: Date | null;
      from_check_out: Date | null;
      from_note: string | null;
      to_status: AttendanceStatus;
      to_check_in: Date | null;
      to_check_out: Date | null;
      to_note: string | null;
      changed_by: string;
      created_at: Date;
    }>(
      `SELECT id, action, from_status, from_check_in, from_check_out, from_note,
              to_status, to_check_in, to_check_out, to_note, changed_by, created_at
         FROM staff_attendance_history
        WHERE attendance_id = $1
     ORDER BY created_at, id`,
      [attendanceId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      action: row.action,
      fromStatus: row.from_status,
      fromCheckIn: iso(row.from_check_in),
      fromCheckOut: iso(row.from_check_out),
      fromNote: row.from_note,
      toStatus: row.to_status,
      toCheckIn: iso(row.to_check_in),
      toCheckOut: iso(row.to_check_out),
      toNote: row.to_note,
      changedBy: row.changed_by,
      createdAt: row.created_at.toISOString(),
    }));
  },

  async findAttendanceByStaffDay(db, scope, staffId, workDate) {
    const params = new Params();
    const staff = params.add(staffId);
    const date = params.add(workDate);
    const filter = warehouseScopeFilter(scope, 'a.warehouse_id', params.values.length + 1);
    params.values.push(...filter.params);
    const result = await db.query<AttendanceRow>(
      `${ATTENDANCE_SELECT}
        WHERE a.staff_id = ${staff}::uuid AND a.work_date = ${date}::date AND ${filter.sql}`,
      params.values,
    );
    const row = result.rows[0];
    return row === undefined ? null : mapAttendance(row);
  },

  async getMaxRangeDays(db) {
    const result = await db.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'staff_attendance_max_range_days' LIMIT 1`,
    );
    const value = result.rows[0]?.value;
    const parsed =
      typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_MAX_RANGE_DAYS;
  },
};
