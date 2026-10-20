/**
 * Shared types for the warehouse staff & attendance screens (design module M14),
 * backed by /admin/warehouse-staff and /admin/staff-attendance (BR-83, BR-84).
 *
 * One set of screens serves every warehouse admin. The role difference is
 * carried by `scope` (warehouseId undefined = all warehouses, the Main view)
 * and `can` (a docs/rbac.json code check that only decides what to render; the
 * server enforces every action again, CLAUDE.md 2.1).
 *
 * Permissions (docs/rbac.json, owner decision 2026-10-11):
 *   - admin.staff.list_view       roster list and detail   (SA/TOHFA all, MAIN own, SUB none)
 *   - admin.staff.manage          create, edit, deactivate (SA/TOHFA all, MAIN own, SUB none)
 *   - admin.staff.attendance.view roll call, history, summary (SA/TOHFA all, MAIN own, SUB none)
 *   - admin.staff.attendance.mark mark one / bulk          (SA all, MAIN own, TOHFA none, SUB none)
 * A Sub Warehouse Admin holds none of them: it cannot list staff (BR-83).
 *
 * The staff record has no type (driver / warehouse staff), email, vehicle or
 * delivery figures, so none of those exist here; `designation` is the free-text
 * role the server stores.
 */
import type { AttendanceStatusCode } from '../../../api/attendance';
import type { StaffStatus } from '../../../api/staff';

export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';
export type { AttendanceStatusCode, StaffStatus };

/** One roster member, ready to render. */
export interface StaffMember {
  id: string;
  /** STF-nnnn. */
  staffCode: string;
  name: string;
  designation: string;
  phone: string | null;
  /** YYYY-MM-DD, for the edit form. */
  joinedOn: string;
  /** "12 Aug 2026". */
  joinedOnText: string;
  status: StaffStatus;
  warehouseId: string;
  warehouseName: string;
  createdAtText: string;
  updatedAtText: string | null;
}

/** Filter chips of the Attendance overview. 'NotMarked' is the roll call's null mark. */
export type AttendanceFilter = 'All' | 'Present' | 'Absent' | 'On Leave' | 'Not Marked';

/** One roll-call row: an active staff member and their mark for the day (null = not marked). */
export interface RollCallRow {
  staffId: string;
  staffCode: string;
  name: string;
  designation: string;
  warehouseId: string;
  warehouseName: string;
  status: AttendanceStatusCode | null;
  /** ISO instants, kept for a correction that must not drop them. */
  checkIn: string | null;
  checkOut: string | null;
  checkInText: string | null;
  checkOutText: string | null;
  note: string | null;
}

/** What Attendance Detail needs: whose day, which day, and the name to show while loading. */
export interface AttendanceRecordRef {
  staffId: string;
  /** YYYY-MM-DD (Asia/Kolkata). */
  date: string;
  name?: string | undefined;
  designation?: string | undefined;
}

/** One attendance row of the history list. */
export interface AttendanceHistoryEntry {
  id: string;
  staffId: string;
  /** YYYY-MM-DD. */
  date: string;
  /** "25 Sep 2026", the group header. */
  dateText: string;
  name: string;
  designation: string;
  status: AttendanceStatusCode;
  timeRange: string | null;
}

/** One staff member's counts over the history range (GET /summary byStaff). */
export interface StaffAttendanceSummaryRow {
  staffId: string;
  name: string;
  designation: string;
  present: number;
  absent: number;
  leave: number;
  marked: number;
}

/** One change of a day's attendance (GET .../history). */
export interface AttendanceChange {
  id: string;
  action: 'CREATED' | 'UPDATED';
  fromStatus: AttendanceStatusCode | null;
  toStatus: AttendanceStatusCode;
  whenText: string;
}

/** Screens of the staff & attendance flow (old App.tsx keys without the 'SubWarehouse' prefix). */
export type StaffRoute = 'Staff' | 'StaffDetail' | 'EditStaffProfile' | 'Attendance' | 'AttendanceDetail' | 'AttendanceHistory';

export interface StaffRouteParams {
  /** Staff Detail / Edit: the member tapped (Edit without one is "Add staff"). */
  staff?: StaffMember | undefined;
  /** Attendance Detail: whose day. */
  record?: AttendanceRecordRef | undefined;
  /** Attendance opened on a filter chip (the old Today's Attendance key opens 'All'). */
  attendanceFilter?: AttendanceFilter | undefined;
  /** Attendance History narrowed to one staff member (from Staff Detail). */
  historyStaffId?: string | undefined;
  historyStaffName?: string | undefined;
}
