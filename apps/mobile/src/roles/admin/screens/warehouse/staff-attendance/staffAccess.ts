/**
 * Who may open the warehouse staff & attendance screens.
 *
 * The codes are exactly what the API routes require
 * (apps/api/src/modules/warehouse-staff/warehouse-staff.routes.ts), so a screen
 * is offered only to a role the server will answer:
 *   roster list / detail       admin.staff.list_view       SA/TOHFA all, MAIN own, SUB none
 *   create / edit / deactivate admin.staff.manage          SA/TOHFA all, MAIN own, SUB none
 *   roll call / history / sum  admin.staff.attendance.view SA/TOHFA all, MAIN own, SUB none
 *
 * A Sub Warehouse Admin holds none of them (owner decision 2026-10-11, docs/rbac.json
 * "Warehouse workforce roster"). The gate used to let in anyone with a warehouse
 * in scope or `warehouse.own.view`, which is every Sub admin, so every call they
 * made was a 403; it also checked `warehouse.staff.*` codes that rbac withdrew.
 * The server enforces all of this again (root CLAUDE.md 2.1); this only decides
 * what to render.
 *
 * Pure (no React Native), so plain-Node vitest covers it (tests/staff_access.test.ts).
 */
import type { PermissionCheck, StaffRoute } from './types';

export const STAFF_ROSTER_CODE = 'admin.staff.list_view';
export const STAFF_MANAGE_CODE = 'admin.staff.manage';
export const ATTENDANCE_VIEW_CODE = 'admin.staff.attendance.view';

export function hasStaffRosterAccess(can: PermissionCheck): boolean {
  return can(STAFF_ROSTER_CODE);
}

/** Editing starts from the roster, so it needs the read code as well. */
export function canManageStaff(can: PermissionCheck): boolean {
  return can(STAFF_ROSTER_CODE) && can(STAFF_MANAGE_CODE);
}

export function hasAttendanceAccess(can: PermissionCheck): boolean {
  return can(ATTENDANCE_VIEW_CODE);
}

/** True when `can` allows opening `route` of the staff flow. */
export function canOpenStaffRoute(route: StaffRoute, can: PermissionCheck): boolean {
  switch (route) {
    case 'Staff':
    case 'StaffDetail':
      return hasStaffRosterAccess(can);
    case 'EditStaffProfile':
      return canManageStaff(can);
    case 'Attendance':
    case 'AttendanceDetail':
    case 'AttendanceHistory':
      return hasAttendanceAccess(can);
    default:
      return false;
  }
}
