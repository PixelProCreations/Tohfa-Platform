/**
 * Shared types for the warehouse staff & attendance screens (design module M14).
 *
 * One set of screens serves both warehouse roles. As in the other warehouse
 * areas, the role difference is carried by `scope` (warehouseId undefined = all
 * four warehouses, the Main Warehouse view) and `can` (a docs/rbac.json code
 * check that only decides what to render; the server enforces every action
 * again, CLAUDE.md 2.1).
 *
 * Permissions: see ./staffAccess.ts (admin.staff.list_view / admin.staff.manage /
 * admin.staff.attendance.view, the codes the API routes require; a Sub
 * Warehouse Admin holds none of them).
 *
 * The Sub screens used to declare their own StaffMember, two different
 * AttendanceRecord shapes (Attendance and Today's Attendance) and
 * HistoryDateEntry, re-exported through the dashboard barrel with `export *`.
 * They live here now, once.
 */
export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** Roster member kind: the two sections of the Main list (DRIVERS / WAREHOUSE STAFF). */
export type StaffType = 'driver' | 'warehouse';

/** Attendance state of one person on one day. */
export type AttendanceStatus = 'Present' | 'Absent' | 'On Leave' | 'Not Checked In';

/** Filter chips of the Attendance overview (folded Today's Attendance). */
export type AttendanceFilter = 'All' | 'Present' | 'Absent' | 'On Leave';

/** One warehouse workforce roster member (docs/openapi.yaml WarehouseStaff, mapped in ./mappers.ts). */
export interface StaffMember {
  id: string;
  name: string;
  /** Staff ID or Driver ID shown on the card. */
  staffId: string;
  type: StaffType;
  role: string;
  status: 'Active' | 'Inactive';
  /** Today's roll-call status; undefined when the roll call has no row for the member (shown as '—'). */
  attendance?: AttendanceStatus | undefined;
  /** No API carries delivery figures for a staff member; always undefined (shown as '—'). */
  deliveriesToday?: number | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  vehicleDetails?: string | undefined;
  /** Assigned warehouse; a Sub scope only ever lists its own. */
  warehouseId?: string | undefined;
}

/** One person's attendance on one day: an Attendance row and the Attendance Detail record. */
export interface AttendanceRecord {
  id: string;
  name: string;
  role: string;
  type?: StaffType | undefined;
  status: AttendanceStatus;
  dateText?: string | undefined;
  checkInTime?: string | undefined;
  checkOutTime?: string | undefined;
  warehouseId?: string | undefined;
}

/** One row of Attendance History grouped by date. */
export interface AttendanceHistoryEntry {
  id: string;
  /** '25 SEP' */
  dateHeader: string;
  name: string;
  role?: string | undefined;
  status: 'Present' | 'Absent' | 'On Leave';
  timeRange?: string | undefined;
  /** Rows older than seven days only show in the longer ranges (Main's 30 Days view). */
  olderThanWeek?: boolean | undefined;
  warehouseId?: string | undefined;
}

/** One month of one person's attendance: History grouped by staff (absorbed from Main, M14-S03). */
export interface StaffMonthSummary {
  id: string;
  staffName: string;
  role: string;
  monthLabel: string;
  present: number;
  absent: number;
  leave: number;
  olderThanWeek?: boolean | undefined;
  warehouseId?: string | undefined;
}

/** Screens of the staff & attendance flow (old App.tsx keys without the 'SubWarehouse' prefix). */
export type StaffRoute = 'Staff' | 'StaffDetail' | 'EditStaffProfile' | 'Attendance' | 'AttendanceDetail' | 'AttendanceHistory';

export interface StaffRouteParams {
  staff?: StaffMember | undefined;
  record?: AttendanceRecord | undefined;
  /** Attendance opened on a filter chip (the old Today's Attendance key opens 'All'). */
  attendanceFilter?: AttendanceFilter | undefined;
  warehouseId?: string | undefined;
}
