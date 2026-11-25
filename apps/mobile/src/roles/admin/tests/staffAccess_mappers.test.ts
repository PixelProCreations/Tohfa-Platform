/**
 * screens/warehouse/staff-attendance/accessMappers.ts and the new staff-flow
 * routes (Roles, Assign Access, Create account, Attendance Correction), checked
 * against the grants in docs/rbac.json (BR-28 account hierarchy, BR-83 staff,
 * BR-84 attendance, BR-109 role definitions, BR-112 account create).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RoleDefinitionDto } from '../api/roles';
import en from '../i18n/en.json';
import { makeCan } from '../permissions/can';
import {
  accessModuleRows,
  APPLICATION_ROLE_LABEL,
  applicationRoleSelectable,
  buildAccountRequest,
  buildCorrectionBody,
  canCreateAdminLogin,
  creatableLoginRoles,
  emptyAccountForm,
  filterRoles,
  fullNameOf,
  isoToIstHhMm,
  istTimeToIso,
  toE164,
  type AccountForm,
} from '../screens/warehouse/staff-attendance/accessMappers';
import { ACCOUNT_CREATE_CODES, canOpenStaffRoute, STAFF_CODES, staffRouteCode } from '../screens/warehouse/staff-attendance/mappers';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const rbac = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'rbac.json'), 'utf8')) as {
  permissions: { code: string; grants: Record<string, string> }[];
};
const canOf = (role: string) => makeCan(rbac.permissions.filter((p) => (p.grants[role] ?? 'none') !== 'none').map((p) => p.code));
const saCan = canOf('SUPER_ADMIN');
const tohfaCan = canOf('TOHFA_ADMIN');
const mainCan = canOf('MAIN_WH_ADMIN');
const subCan = canOf('SUB_WH_ADMIN');
const WH = '11111111-1111-4111-8111-111111111111';

function form(over: Partial<AccountForm> = {}): AccountForm {
  return { ...emptyAccountForm('2026-11-11'), firstName: 'Meena', lastName: 'V', mobile: '9876500001', ...over };
}

describe('codes and routes', () => {
  it('every account create code and the role view code exist in docs/rbac.json', () => {
    for (const code of [...Object.values(ACCOUNT_CREATE_CODES), STAFF_CODES.roleView]) {
      expect(rbac.permissions.some((p) => p.code === code), code).toBe(true);
    }
  });

  it('BR-109: Roles and Assign Access need role.definition.view; Correction needs attendance.mark', () => {
    expect(staffRouteCode('Roles')).toBe('role.definition.view');
    expect(staffRouteCode('AssignAccess')).toBe('role.definition.view');
    expect(staffRouteCode('AttendanceCorrection')).toBe('admin.staff.attendance.mark');
    expect(canOpenStaffRoute('Roles', makeCan([]))).toBe(false);
    expect(canOpenStaffRoute('Roles', subCan)).toBe(true);
  });

  it('BR-84: Tohfa Admin cannot open Attendance Correction, Main can', () => {
    expect(canOpenStaffRoute('AttendanceCorrection', tohfaCan)).toBe(false);
    expect(canOpenStaffRoute('AttendanceCorrection', mainCan)).toBe(true);
  });

  it('BR-28: Create account opens for SA, Tohfa and Main, not for Sub', () => {
    expect(canOpenStaffRoute('CreateStaffAccount', saCan)).toBe(true);
    expect(canOpenStaffRoute('CreateStaffAccount', tohfaCan)).toBe(true);
    expect(canOpenStaffRoute('CreateStaffAccount', mainCan)).toBe(true);
    expect(canOpenStaffRoute('CreateStaffAccount', subCan)).toBe(false);
  });

  it('every application role has an English label', () => {
    for (const key of Object.values(APPLICATION_ROLE_LABEL)) expect(key in en, key).toBe(true);
  });
});

describe('BR-28 creatable roles', () => {
  it('Super Admin may create every login role', () => {
    expect(creatableLoginRoles(saCan)).toEqual(['SUPER_ADMIN', 'TOHFA_ADMIN', 'FARMER_ADMIN', 'MAIN_WH_ADMIN', 'SUB_WH_ADMIN']);
    expect(canCreateAdminLogin(saCan)).toBe(true);
  });

  it('Main may create only a Sub login, so Add Staff keeps the plain form', () => {
    expect(creatableLoginRoles(mainCan)).toEqual(['SUB_WH_ADMIN']);
    expect(canCreateAdminLogin(mainCan)).toBe(false);
  });

  it('a login role is selectable only with a login and its code; Warehouse Staff only without; Driver never', () => {
    expect(applicationRoleSelectable('SUPER_ADMIN', 'login', saCan)).toBe(true);
    expect(applicationRoleSelectable('SUPER_ADMIN', 'login', tohfaCan)).toBe(false);
    expect(applicationRoleSelectable('SUPER_ADMIN', 'no_login', saCan)).toBe(false);
    expect(applicationRoleSelectable('WAREHOUSE_STAFF', 'no_login', mainCan)).toBe(true);
    expect(applicationRoleSelectable('WAREHOUSE_STAFF', 'login', mainCan)).toBe(false);
    expect(applicationRoleSelectable('DRIVER', 'no_login', saCan)).toBe(false);
  });
});

describe('BR-112 account request', () => {
  it('joins the name parts and adds the India prefix to a 10-digit mobile', () => {
    expect(fullNameOf({ firstName: ' Meena ', middleName: '', lastName: 'V' })).toBe('Meena V');
    expect(toE164('98765 00001')).toBe('+919876500001');
    expect(toE164('+447700900123')).toBe('+447700900123');
    expect(toE164('12345')).toBeNull();
  });

  it('a Main Warehouse Admin login goes to POST /admin/accounts with role, name and mobile only', () => {
    const result = buildAccountRequest(form({ role: 'MAIN_WH_ADMIN' }), WH);
    expect(result).toEqual({ ok: true, body: { kind: 'admin', body: { role: 'MAIN_WH_ADMIN', fullName: 'Meena V', mobile: '+919876500001' } } });
  });

  it('BR-81: a Sub login goes to the sub-admin endpoint and needs a warehouse', () => {
    expect(buildAccountRequest(form({ role: 'SUB_WH_ADMIN' }), undefined)).toEqual({ ok: false, errorKey: 'staff.form.error.warehouse' });
    expect(buildAccountRequest(form({ role: 'SUB_WH_ADMIN' }), WH)).toEqual({
      ok: true,
      body: { kind: 'subAdmin', body: { fullName: 'Meena V', mobile: '+919876500001', warehouseId: WH } },
    });
  });

  it('a Farmer Admin is refused client-side: it needs a zone the app cannot list', () => {
    expect(buildAccountRequest(form({ role: 'FARMER_ADMIN' }), WH)).toEqual({ ok: false, errorKey: 'staffAccess.create.error.zone' });
  });

  it('BR-83: a record without a login goes to POST /admin/warehouse-staff with its designation', () => {
    const result = buildAccountRequest(form({ access: 'no_login', role: 'WAREHOUSE_STAFF', designation: 'Loader' }), WH);
    expect(result).toEqual({
      ok: true,
      body: {
        kind: 'staff',
        body: { fullName: 'Meena V', designation: 'Loader', phone: '9876500001', joinedOn: '2026-11-11', warehouseId: WH, status: 'ACTIVE' },
      },
    });
  });

  it('refuses a missing first name, last name or role', () => {
    expect(buildAccountRequest(form({ firstName: ' ' }), WH)).toMatchObject({ ok: false, errorKey: 'staffAccess.create.error.firstName' });
    expect(buildAccountRequest(form({ lastName: '' }), WH)).toMatchObject({ ok: false, errorKey: 'staffAccess.create.error.lastName' });
    expect(buildAccountRequest(form(), WH)).toMatchObject({ ok: false, errorKey: 'staffAccess.create.error.role' });
  });
});

describe('BR-109 role definitions', () => {
  const roles: RoleDefinitionDto[] = [
    {
      code: 'MAIN_WH_ADMIN',
      name: 'Main Warehouse Admin',
      level: 4,
      scopeDimension: 'warehouse_id',
      summary: 'Runs the main warehouse',
      permissions: [{ code: 'admin.staff.list_view', module: 'Workforce & Staff', description: 'List staff', scope: 'own', predicate: null }],
    },
    {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      level: 1,
      scopeDimension: null,
      summary: null,
      permissions: [
        { code: 'farmer.profile.view_all', module: 'Farmers Management', description: 'View farmers', scope: 'all', predicate: null },
        { code: 'admin.staff.list_view', module: 'Workforce & Staff', description: 'List staff', scope: 'all', predicate: null },
      ],
    },
  ];

  it('lists every module any role holds, with access only where the selected role has grants', () => {
    const rows = accessModuleRows(roles, 'MAIN_WH_ADMIN');
    expect(rows.map((r) => [r.index, r.module, r.grants.length])).toEqual([
      [1, 'Workforce & Staff', 1],
      [2, 'Farmers Management', 0],
    ]);
    expect(accessModuleRows(roles, undefined).every((r) => r.grants.length === 0)).toBe(true);
  });

  it('searches name and summary', () => {
    expect(filterRoles(roles, 'main warehouse').map((r) => r.code)).toEqual(['MAIN_WH_ADMIN']);
    expect(filterRoles(roles, '  ').length).toBe(2);
  });
});

describe('BR-84 attendance correction body', () => {
  it('converts an IST HH:MM to an instant and back', () => {
    expect(istTimeToIso('2026-11-04', '09:15')).toBe('2026-11-04T03:45:00.000Z');
    expect(isoToIstHhMm('2026-11-04T03:45:00.000Z')).toBe('09:15');
    expect(istTimeToIso('2026-11-04', '9.15')).toBeNull();
  });

  it('needs a status and remarks; remarks become the note', () => {
    expect(buildCorrectionBody('2026-11-04', { status: null, checkIn: '', checkOut: '', remarks: 'x' })).toMatchObject({ ok: false });
    expect(buildCorrectionBody('2026-11-04', { status: 'ABSENT', checkIn: '', checkOut: '', remarks: ' ' })).toMatchObject({ ok: false });
    expect(buildCorrectionBody('2026-11-04', { status: 'ABSENT', checkIn: '09:00', checkOut: '', remarks: 'Sick' })).toEqual({
      ok: true,
      body: { status: 'ABSENT', note: 'Sick' },
    });
  });

  it('sends times only for Present, and a check-out needs an earlier check-in', () => {
    expect(buildCorrectionBody('2026-11-04', { status: 'PRESENT', checkIn: '09:15', checkOut: '18:05', remarks: 'Missed punch' })).toEqual({
      ok: true,
      body: { status: 'PRESENT', note: 'Missed punch', checkIn: '2026-11-04T03:45:00.000Z', checkOut: '2026-11-04T12:35:00.000Z' },
    });
    expect(buildCorrectionBody('2026-11-04', { status: 'PRESENT', checkIn: '', checkOut: '18:05', remarks: 'x' })).toMatchObject({
      ok: false,
      errorKey: 'staffAccess.correction.error.checkOut',
    });
    expect(buildCorrectionBody('2026-11-04', { status: 'PRESENT', checkIn: '18:00', checkOut: '09:00', remarks: 'x' })).toMatchObject({ ok: false });
  });
});
