/**
 * Who may open the warehouse staff & attendance screens. The codes are the ones
 * the API routes require (apps/api/src/modules/warehouse-staff/warehouse-staff.routes.ts)
 * and the grants are read from docs/rbac.json itself, so the gate cannot drift
 * from the server: a role the gate lets in must be a role the API answers.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { makeCan } from '../permissions/can';
import {
  ATTENDANCE_VIEW_CODE,
  STAFF_MANAGE_CODE,
  STAFF_ROSTER_CODE,
  canManageStaff,
  canOpenStaffRoute,
  hasAttendanceAccess,
  hasStaffRosterAccess,
} from '../screens/warehouse/staff-attendance/staffAccess';

const REPO_ROOT = path.resolve(__dirname, '../../../../../../');
const RBAC_PATH = path.join(REPO_ROOT, 'docs/rbac.json');
const ROUTES_PATH = path.join(REPO_ROOT, 'apps/api/src/modules/warehouse-staff/warehouse-staff.routes.ts');

interface RbacPermission {
  code: string;
  grants: Record<string, string>;
}

function grantsOf(role: string): string[] {
  const rbac = JSON.parse(fs.readFileSync(RBAC_PATH, 'utf8')) as { permissions: RbacPermission[] };
  // Same filter as the API's getUserPermissions: scope <> 'none'.
  return rbac.permissions.filter((p) => (p.grants[role] ?? 'none') !== 'none').map((p) => p.code);
}

const subCan = () => makeCan(grantsOf('SUB_WH_ADMIN'));
const mainCan = () => makeCan(grantsOf('MAIN_WH_ADMIN'));
const tohfaCan = () => makeCan(grantsOf('TOHFA_ADMIN'));

describe('staff & attendance gate (docs/rbac.json + warehouse-staff routes)', () => {
  it('RBAC: the gate codes are exactly the codes the warehouse-staff routes require', () => {
    const routes = fs.readFileSync(ROUTES_PATH, 'utf8');
    const required = new Set(Array.from(routes.matchAll(/requirePermission\('([^']+)'\)/g), (m) => m[1]));
    expect(required.has(STAFF_ROSTER_CODE)).toBe(true);
    expect(required.has(STAFF_MANAGE_CODE)).toBe(true);
    expect(required.has(ATTENDANCE_VIEW_CODE)).toBe(true);
  });

  it('BR-83/RBAC: Sub warehouse admin has no staff roster access', () => {
    expect(hasStaffRosterAccess(subCan())).toBe(false);
    expect(canManageStaff(subCan())).toBe(false);
  });

  it('BR-84/RBAC: Sub warehouse admin has no attendance access', () => {
    expect(hasAttendanceAccess(subCan())).toBe(false);
  });

  it('BR-83/RBAC: Sub warehouse admin can open no staff or attendance route', () => {
    for (const route of ['Staff', 'StaffDetail', 'EditStaffProfile', 'Attendance', 'AttendanceDetail', 'AttendanceHistory'] as const) {
      expect(canOpenStaffRoute(route, subCan())).toBe(false);
    }
  });

  it('RBAC: a warehouse id in scope or own-warehouse view does not grant the roster', () => {
    // The old gate let `warehouse.own.view` / `warehouse.activity.view` and any
    // scoped warehouse in, which is every Sub admin: each call was then a 403.
    expect(hasStaffRosterAccess(makeCan(['warehouse.own.view', 'warehouse.activity.view']))).toBe(false);
    // Withdrawn codes that are not in docs/rbac.json grant nothing either.
    expect(hasStaffRosterAccess(makeCan(['warehouse.staff.list_view', 'warehouse.staff.view']))).toBe(false);
  });

  it('BR-83k/RBAC: Main warehouse admin reads, edits and sees attendance', () => {
    expect(hasStaffRosterAccess(mainCan())).toBe(true);
    expect(canManageStaff(mainCan())).toBe(true);
    expect(hasAttendanceAccess(mainCan())).toBe(true);
    for (const route of ['Staff', 'StaffDetail', 'EditStaffProfile', 'Attendance', 'AttendanceDetail', 'AttendanceHistory'] as const) {
      expect(canOpenStaffRoute(route, mainCan())).toBe(true);
    }
  });

  it('BR-83k/RBAC: Tohfa Admin reads the roster and attendance', () => {
    expect(hasStaffRosterAccess(tohfaCan())).toBe(true);
    expect(hasAttendanceAccess(tohfaCan())).toBe(true);
  });

  it('RBAC: roster read without manage cannot open Edit Staff Profile', () => {
    const readOnly = makeCan([STAFF_ROSTER_CODE]);
    expect(canOpenStaffRoute('Staff', readOnly)).toBe(true);
    expect(canOpenStaffRoute('StaffDetail', readOnly)).toBe(true);
    expect(canOpenStaffRoute('EditStaffProfile', readOnly)).toBe(false);
    expect(canOpenStaffRoute('Attendance', readOnly)).toBe(false);
  });
});
