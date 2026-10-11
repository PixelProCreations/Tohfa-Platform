/**
 * Module 14 (Warehouse Staff and Attendance): all business logic.
 *
 * Takes a `ResolvedScope`, never a `Request`. Throws `AppError` with a domain `ErrorCode`.
 *
 * BR-83 (staff roster): a staff member belongs to exactly one warehouse; a row outside the
 *   caller's warehouse scope is absent, so a by-id access is 404, never 403. Staff are not
 *   users (no login). Deactivation is the soft state: the row and its attendance stay.
 * BR-84 (attendance): one row per staff member per Asia/Kolkata calendar day, updated in place by
 *   a re-mark (every change is kept by the trigger in migration 0057); a future day is 422; a
 *   deactivated staff member cannot be marked (409); a bulk mark is all-or-nothing.
 *
 * Audit images are MASKED: ids, staff code, warehouse id, work date and statuses only. Never the
 * name, phone, designation or a note, which are free text or personal data.
 */
import { ScopeLevel } from '@tohfa/shared-types';
import { changedFields as diffFields, writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import { isCalendarDate } from '../certifications/certifications.schema.js';
import {
  warehouseStaffRepo,
  type AttendanceCursor,
  type AttendanceRecord,
  type AttendanceValues,
  type StaffCursor,
  type StaffPatch,
  type StaffRecord,
  type StatusCounts,
  type WarehouseStaffRepo,
} from './warehouse-staff.repo.js';
import type {
  AttendanceHistoryResponse,
  AttendanceResponse,
  AttendanceSummaryQuery,
  AttendanceSummaryResponse,
  BulkAttendanceBody,
  BulkAttendanceResponse,
  CreateStaffBody,
  ListAttendanceQuery,
  ListAttendanceResponse,
  ListStaffQuery,
  ListStaffResponse,
  MarkAttendanceBody,
  RollCallQuery,
  RollCallResponse,
  StaffResponse,
  UpdateStaffBody,
} from './warehouse-staff.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface WarehouseStaffServiceDeps {
  repo: WarehouseStaffRepo;
  db: Executor;
  runTx: TransactionRunner;
  /** The clock; injected so "today" and "future" are testable. */
  now: () => Date;
}

export interface MarkResult {
  attendance: AttendanceResponse;
  /** True when this request created the day's row (HTTP 201); false for an update or a no-op replay. */
  created: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The Asia/Kolkata calendar date of an instant, as YYYY-MM-DD (en-CA formats dates that way). */
function kolkataDate(at: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

function failValidation(errors: Record<string, string[]>): never {
  throw new AppError('VALIDATION_FAILED', { detail: 'One or more fields are invalid.', errors });
}

function notFound(what: string, id: string): AppError {
  return new AppError('NOT_FOUND', { detail: `${what} "${id}" not found.` });
}

/**
 * The warehouses the actor is confined to, or null when the scope is not confined to any (an
 * `all` grant, or an `own` grant on a role with no warehouse dimension: a Main Warehouse Admin
 * sees all four warehouses, confirmed by the owner 2026-10-11).
 */
function confinedWarehouses(scope: ResolvedScope): { first: string; all: string[] } | null {
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return null;
  const [first] = scope.warehouseIds;
  return first === undefined ? null : { first, all: scope.warehouseIds };
}

function encodeCursor(parts: string[]): string {
  return Buffer.from(JSON.stringify(parts), 'utf8').toString('base64url');
}

function decodeCursorParts(raw: string, length: number): string[] {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (Array.isArray(parsed) && parsed.length === length && parsed.every((part) => typeof part === 'string')) {
      return parsed as string[];
    }
  } catch {
    // fall through to the 422 below
  }
  return invalidCursor();
}

function invalidCursor(): never {
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.' });
}

function decodeStaffCursor(raw: string): StaffCursor {
  const [fullName, id] = decodeCursorParts(raw, 2);
  // A forged cursor is a 422 here, not a failed ::uuid cast (500) in SQL.
  if (fullName === undefined || !UUID.test(id ?? '')) return invalidCursor();
  return { fullName, id: id as string };
}

function decodeAttendanceCursor(raw: string): AttendanceCursor {
  const [workDate, id] = decodeCursorParts(raw, 2);
  if (!isCalendarDate(workDate ?? '') || !UUID.test(id ?? '')) return invalidCursor();
  return { workDate: workDate as string, id: id as string };
}

function pageOf<C>(next: C | null, encode: (cursor: C) => string): { nextCursor: string | null; hasMore: boolean } {
  return { nextCursor: next === null ? null : encode(next), hasMore: next !== null };
}

/** The masked audit image of a staff row: no name, phone or designation. */
function staffImage(staff: StaffRecord): Record<string, string> {
  return { id: staff.id, staffCode: staff.staffCode, warehouseId: staff.warehouseId, status: staff.status };
}

/** The masked audit image of an attendance row: no staff name and no note text. */
function attendanceImage(row: AttendanceRecord): Record<string, string> {
  return { id: row.id, staffId: row.staffId, warehouseId: row.warehouseId, workDate: row.workDate, status: row.status };
}

function valuesOf(body: { status: AttendanceValues['status']; checkIn?: string | undefined; checkOut?: string | undefined; note?: string | undefined }): AttendanceValues {
  return {
    status: body.status,
    checkIn: body.checkIn === undefined ? null : new Date(body.checkIn).toISOString(),
    checkOut: body.checkOut === undefined ? null : new Date(body.checkOut).toISOString(),
    note: body.note ?? null,
  };
}

function sameValues(row: AttendanceRecord, values: AttendanceValues): boolean {
  return (
    row.status === values.status &&
    row.checkIn === values.checkIn &&
    row.checkOut === values.checkOut &&
    row.note === values.note
  );
}

export interface WarehouseStaffService {
  createStaff(scope: ResolvedScope, body: CreateStaffBody): Promise<StaffResponse>;
  listStaff(scope: ResolvedScope, query: ListStaffQuery): Promise<ListStaffResponse>;
  getStaff(scope: ResolvedScope, id: string): Promise<StaffResponse>;
  updateStaff(scope: ResolvedScope, id: string, body: UpdateStaffBody): Promise<StaffResponse>;
  deactivateStaff(scope: ResolvedScope, id: string): Promise<StaffResponse>;
  markAttendance(scope: ResolvedScope, staffId: string, date: string, body: MarkAttendanceBody): Promise<MarkResult>;
  markAttendanceBulk(scope: ResolvedScope, date: string, body: BulkAttendanceBody): Promise<BulkAttendanceResponse>;
  rollCall(scope: ResolvedScope, query: RollCallQuery): Promise<RollCallResponse>;
  listAttendance(scope: ResolvedScope, query: ListAttendanceQuery): Promise<ListAttendanceResponse>;
  attendanceSummary(scope: ResolvedScope, query: AttendanceSummaryQuery): Promise<AttendanceSummaryResponse>;
  attendanceHistory(scope: ResolvedScope, staffId: string, date: string): Promise<AttendanceHistoryResponse>;
}

export function createWarehouseStaffService(
  deps: WarehouseStaffServiceDeps = { repo: warehouseStaffRepo, db: pool, runTx: withTransaction, now: () => new Date() },
): WarehouseStaffService {
  const { repo, db, runTx, now } = deps;

  /** A Sub admin works in their own warehouse; an unconfined actor must say which. */
  function targetWarehouse(scope: ResolvedScope, requested: string | undefined): string {
    const confined = confinedWarehouses(scope);
    if (confined !== null) {
      if (requested === undefined) return confined.first;
      // 404, not 403: a 403 would confirm the other warehouse exists.
      if (!confined.all.includes(requested)) throw notFound('Warehouse', requested);
      return requested;
    }
    if (requested === undefined) {
      return failValidation({ 'body.warehouseId': ['warehouseId is required for an actor not assigned to a warehouse.'] });
    }
    return requested;
  }

  /** A warehouse id used as a read filter: another warehouse's id is 404 for a confined actor. */
  function assertWarehouseVisible(scope: ResolvedScope, warehouseId: string | undefined): void {
    if (warehouseId !== undefined && !warehouseVisible(scope, warehouseId)) throw notFound('Warehouse', warehouseId);
  }

  /** A staff id used as a read filter names one row, so an unseen one is 404 like a by-id read. */
  async function assertStaffVisible(scope: ResolvedScope, staffId: string | undefined): Promise<void> {
    if (staffId !== undefined && (await repo.findStaffById(db, scope, staffId)) === null) {
      throw notFound('Staff member', staffId);
    }
  }

  function today(): string {
    return kolkataDate(now());
  }

  /** Whole days between two real calendar dates (exact: both are UTC midnights). */
  async function assertRangeWithinCap(from: string, to: string): Promise<void> {
    const maxDays = await repo.getMaxRangeDays(db);
    const spanDays = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / MS_PER_DAY;
    if (spanDays > maxDays) failValidation({ 'query.to': [`Date range cannot exceed ${maxDays} days.`] });
  }

  function assertNotFuture(date: string, path: string): void {
    if (date > today()) failValidation({ [path]: ['Attendance cannot be marked for a future date.'] });
  }

  /**
   * Upserts one staff member's attendance for one day, inside the caller's transaction.
   * Returns the row and whether anything was written: a replay of the same values writes nothing
   * (no update, no history row, no audit row).
   */
  async function upsert(
    tx: Executor,
    scope: ResolvedScope,
    staffId: string,
    date: string,
    body: Pick<MarkAttendanceBody, 'status' | 'checkIn' | 'checkOut' | 'note'>,
  ): Promise<{ row: AttendanceRecord; outcome: 'created' | 'updated' | 'unchanged' }> {
    // SHARE lock: a concurrent deactivation cannot commit between this check and the write.
    const staff = await repo.findStaffById(tx, scope, staffId, 'SHARE');
    if (staff === null) throw notFound('Staff member', staffId);
    if (staff.status !== 'ACTIVE') {
      throw new AppError('CONFLICT', { detail: 'This staff member is deactivated; attendance cannot be marked.' });
    }
    const values = valuesOf(body);

    let existing = await repo.findAttendanceForUpdate(tx, staffId, date);
    if (existing === null) {
      const inserted = await repo.insertAttendance(tx, {
        staffId,
        warehouseId: staff.warehouseId,
        workDate: date,
        markedBy: scope.userId,
        ...values,
      });
      if (inserted !== null) {
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'staff.attendance.mark',
          entityType: 'staff_attendance',
          entityId: inserted.id,
          warehouseId: staff.warehouseId,
          after: attendanceImage(inserted),
        });
        return { row: inserted, outcome: 'created' };
      }
      // A concurrent request created the day's row between the lookup and the insert: treat as a re-mark.
      existing = await repo.findAttendanceForUpdate(tx, staffId, date);
      if (existing === null) throw new Error('attendance insert reported a conflict but no row holds the day');
    }

    if (sameValues(existing, values)) return { row: existing, outcome: 'unchanged' };
    const updated = await repo.updateAttendance(tx, existing.id, values, scope.userId);
    await writeAuditLog(tx, {
      actorId: scope.userId,
      actorRole: scope.roleCode,
      actionCode: 'staff.attendance.mark',
      entityType: 'staff_attendance',
      entityId: updated.id,
      warehouseId: staff.warehouseId,
      before: attendanceImage(existing),
      after: attendanceImage(updated),
      changedFields: diffFields(
        { status: existing.status, checkIn: existing.checkIn, checkOut: existing.checkOut, note: existing.note },
        { status: updated.status, checkIn: updated.checkIn, checkOut: updated.checkOut, note: updated.note },
      ),
    });
    return { row: updated, outcome: 'updated' };
  }

  function summaryOf(rows: ReadonlyArray<{ present: number; absent: number; leave: number }>): StatusCounts {
    const present = rows.reduce((sum, row) => sum + row.present, 0);
    const absent = rows.reduce((sum, row) => sum + row.absent, 0);
    const leave = rows.reduce((sum, row) => sum + row.leave, 0);
    return { present, absent, leave, total: present + absent + leave };
  }

  return {
    async createStaff(scope, body) {
      const warehouseId = targetWarehouse(scope, body.warehouseId);
      return runTx(async (tx) => {
        if (!(await repo.activeWarehouseExists(tx, warehouseId))) {
          failValidation({ 'body.warehouseId': ['warehouseId is not an existing active warehouse.'] });
        }
        const created = await repo.insertStaff(tx, {
          warehouseId,
          fullName: body.fullName,
          designation: body.designation,
          phone: body.phone ?? null,
          joinedOn: body.joinedOn,
          status: body.status,
        });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'staff.create',
          entityType: 'warehouse_staff',
          entityId: created.id,
          warehouseId,
          after: staffImage(created),
        });
        return created;
      });
    },

    async listStaff(scope, query) {
      assertWarehouseVisible(scope, query.warehouseId);
      const cursor = query.cursor === undefined ? undefined : decodeStaffCursor(query.cursor);
      const { items, next } = await repo.listStaff(
        db,
        scope,
        { warehouseId: query.warehouseId, status: query.status, q: query.q },
        query.limit,
        cursor,
      );
      return { items, page: pageOf(next, (c) => encodeCursor([c.fullName, c.id])) };
    },

    async getStaff(scope, id) {
      const staff = await repo.findStaffById(db, scope, id);
      if (staff === null) throw notFound('Staff member', id);
      return staff;
    },

    async updateStaff(scope, id, body) {
      return runTx(async (tx) => {
        const current = await repo.findStaffById(tx, scope, id, 'UPDATE');
        if (current === null) throw notFound('Staff member', id);

        // Only the fields that really differ: replaying the same PATCH is a no-op with no audit row.
        const patch: StaffPatch = {};
        if (body.fullName !== undefined && body.fullName !== current.fullName) patch.fullName = body.fullName;
        if (body.designation !== undefined && body.designation !== current.designation) patch.designation = body.designation;
        if (body.phone !== undefined && body.phone !== current.phone) patch.phone = body.phone;
        if (body.joinedOn !== undefined && body.joinedOn !== current.joinedOn) patch.joinedOn = body.joinedOn;
        if (body.status !== undefined && body.status !== current.status) patch.status = body.status;
        if (Object.keys(patch).length === 0) return current;

        const updated = await repo.updateStaff(tx, id, patch);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'staff.update',
          entityType: 'warehouse_staff',
          entityId: id,
          warehouseId: updated.warehouseId,
          before: staffImage(current),
          after: staffImage(updated),
          // Field NAMES only: they say what changed, not the personal data it changed to.
          changedFields: Object.keys(patch),
        });
        return updated;
      });
    },

    async deactivateStaff(scope, id) {
      return runTx(async (tx) => {
        const current = await repo.findStaffById(tx, scope, id, 'UPDATE');
        if (current === null) throw notFound('Staff member', id);
        if (current.status === 'INACTIVE') return current;
        const updated = await repo.updateStaff(tx, id, { status: 'INACTIVE' });
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'staff.deactivate',
          entityType: 'warehouse_staff',
          entityId: id,
          warehouseId: updated.warehouseId,
          before: staffImage(current),
          after: staffImage(updated),
          changedFields: ['status'],
        });
        return updated;
      });
    },

    async markAttendance(scope, staffId, date, body) {
      assertNotFuture(date, 'params.date');
      return runTx(async (tx) => {
        const { row, outcome } = await upsert(tx, scope, staffId, date, body);
        return { attendance: row, created: outcome === 'created' };
      });
    },

    async markAttendanceBulk(scope, date, body) {
      assertNotFuture(date, 'params.date');
      // One transaction: the first entry that fails (unknown staff 404, deactivated staff 409)
      // rolls every earlier entry back, so a request is applied entirely or not at all.
      return runTx(async (tx) => {
        const items: AttendanceResponse[] = [];
        const counts = { created: 0, updated: 0, unchanged: 0 };
        for (const entry of body.entries) {
          const { row, outcome } = await upsert(tx, scope, entry.staffId, date, entry);
          items.push(row);
          counts[outcome] += 1;
        }
        return { date, items, ...counts };
      });
    },

    async rollCall(scope, query) {
      assertWarehouseVisible(scope, query.warehouseId);
      const date = query.date ?? today();
      const rows = await repo.rollCall(db, scope, date, query.warehouseId);
      const count = (status: 'PRESENT' | 'ABSENT' | 'LEAVE'): number =>
        rows.filter((row) => row.attendance?.status === status).length;
      const present = count('PRESENT');
      const absent = count('ABSENT');
      const leave = count('LEAVE');
      return {
        date,
        items: rows,
        summary: { present, absent, leave, notMarked: rows.length - present - absent - leave, total: rows.length },
      };
    },

    async listAttendance(scope, query) {
      assertWarehouseVisible(scope, query.warehouseId);
      await assertStaffVisible(scope, query.staffId);
      if (query.from !== undefined && query.to !== undefined) await assertRangeWithinCap(query.from, query.to);
      const filters = {
        staffId: query.staffId,
        warehouseId: query.warehouseId,
        status: query.status,
        from: query.from,
        to: query.to,
      };
      const cursor = query.cursor === undefined ? undefined : decodeAttendanceCursor(query.cursor);
      const { items, next } = await repo.listAttendance(db, scope, filters, query.limit, cursor);
      const summary = await repo.countAttendance(db, scope, filters);
      return { items, summary, page: pageOf(next, (c) => encodeCursor([c.workDate, c.id])) };
    },

    async attendanceSummary(scope, query) {
      assertWarehouseVisible(scope, query.warehouseId);
      await assertStaffVisible(scope, query.staffId);
      let from: string;
      let to: string;
      if (query.month !== undefined) {
        const [year, month] = query.month.split('-').map(Number) as [number, number];
        from = `${query.month}-01`;
        // Day 0 of the next month is the last day of this one.
        to = `${query.month}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, '0')}`;
      } else {
        from = query.from as string;
        to = query.to as string;
        await assertRangeWithinCap(from, to);
      }
      const byStaff = await repo.summaryByStaff(db, scope, from, to, {
        staffId: query.staffId,
        warehouseId: query.warehouseId,
      });
      const totals = summaryOf(byStaff);
      return { from, to, totals: { present: totals.present, absent: totals.absent, leave: totals.leave, marked: totals.total }, byStaff };
    },

    async attendanceHistory(scope, staffId, date) {
      const attendance = await repo.findAttendanceByStaffDay(db, scope, staffId, date);
      if (attendance === null) throw notFound('Attendance record', `${staffId}/${date}`);
      return { items: await repo.listHistory(db, attendance.id) };
    },
  };
}

export const warehouseStaffService: WarehouseStaffService = createWarehouseStaffService();
