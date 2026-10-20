/**
 * screens/warehouse/staff-attendance/mappers.ts: the pure decisions behind the
 * staff & attendance screens. Permission gating is checked against the real
 * docs/rbac.json grants (BR-83: a Sub Warehouse Admin holds none of the four
 * staff codes), dates against the real Asia/Kolkata calendar, and the request
 * bodies against warehouse-staff.schema.ts's rules (BR-83, BR-84).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AttendanceSummaryDto, RollCallDto } from '../api/attendance';
import type { StaffDto } from '../api/staff';
import { t } from '../i18n';
import en from '../i18n/en.json';
import { makeCan } from '../permissions/can';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import {
  bulkPresentChunks,
  buildCreateStaffBody,
  buildUpdateStaffBody,
  calendarMonthOf,
  canDeactivateStaff,
  canMarkAttendance,
  canOpenStaffRoute,
  checkInNowBody,
  checkOutNowBody,
  clampToToday,
  emptyStaffForm,
  filterRollCall,
  formatIsoDate,
  groupHistoryByDate,
  historyRangeDates,
  istToday,
  makeWarehouseNameOf,
  markStatusBody,
  parseIsoDate,
  shiftIsoDate,
  STAFF_CODES,
  staffFormOf,
  staffRouteCode,
  staffWarehouseFilter,
  toHistoryEntry,
  toRollCallRows,
  toStaffMember,
  toSummaryRows,
} from '../screens/warehouse/staff-attendance/mappers';
import type { RollCallRow, StaffRoute } from '../screens/warehouse/staff-attendance/types';

const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const rbac = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs', 'rbac.json'), 'utf8')) as {
  permissions: { code: string; grants: Record<string, string> }[];
};
const subCan = makeCan(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN);
const mainCan = makeCan(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN);
const ROUTES: StaffRoute[] = ['Staff', 'StaffDetail', 'EditStaffProfile', 'Attendance', 'AttendanceDetail', 'AttendanceHistory'];

const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-10-14T20:00:00.000Z'); // 15 Oct 2026, 01:30 IST

const STAFF_DTO: StaffDto = {
  id: '33333333-3333-4333-8333-333333333333',
  staffCode: 'STF-0001',
  warehouseId: WH_A,
  fullName: 'Ravi Kumar',
  designation: 'Loader',
  phone: '+919876543210',
  joinedOn: '2026-08-12',
  status: 'ACTIVE',
  createdAt: '2026-08-12T04:00:00.000Z',
  updatedAt: null,
};
const nameOf = makeWarehouseNameOf({}, [{ warehouseId: WH_A, warehouseName: 'Coonoor' }]);
const member = toStaffMember(STAFF_DTO, nameOf);

function row(staffId: string, status: RollCallRow['status'], checkIn: string | null = null): RollCallRow {
  return {
    staffId,
    staffCode: `STF-${staffId}`,
    name: `Person ${staffId}`,
    designation: 'Loader',
    warehouseId: WH_A,
    warehouseName: 'Coonoor',
    status,
    checkIn,
    checkOut: null,
    checkInText: null,
    checkOutText: null,
    note: null,
  };
}

describe('permission gating', () => {
  it('every code the screens check exists in docs/rbac.json', () => {
    for (const code of Object.values(STAFF_CODES)) {
      expect(rbac.permissions.some((p) => p.code === code), code).toBe(true);
    }
  });

  it('BR-83: a Sub Warehouse Admin holds no staff code, so every staff and attendance route is refused', () => {
    for (const code of [STAFF_CODES.listView, STAFF_CODES.manage, STAFF_CODES.attendanceView, STAFF_CODES.attendanceMark]) {
      expect(rbac.permissions.find((p) => p.code === code)?.grants['SUB_WH_ADMIN']).toBe('none');
    }
    for (const route of ROUTES) expect(canOpenStaffRoute(route, subCan), route).toBe(false);
  });

  it('BR-83k: a Main Warehouse Admin opens every route and may mark attendance', () => {
    for (const route of ROUTES) expect(canOpenStaffRoute(route, mainCan), route).toBe(true);
    expect(canMarkAttendance(mainCan)).toBe(true);
  });

  it('BR-83k: Tohfa Admin reads attendance but cannot mark it', () => {
    const grants = (code: string) => rbac.permissions.find((p) => p.code === code)?.grants['TOHFA_ADMIN'];
    expect(grants(STAFF_CODES.attendanceView)).toBe('all');
    expect(grants(STAFF_CODES.attendanceMark)).toBe('none');
    const tohfaCan = makeCan(rbac.permissions.filter((p) => p.grants['TOHFA_ADMIN'] !== 'none').map((p) => p.code));
    expect(canOpenStaffRoute('Attendance', tohfaCan)).toBe(true);
    expect(canMarkAttendance(tohfaCan)).toBe(false);
  });

  it('routes map to their codes: roster on list_view, the form on manage, attendance on attendance.view', () => {
    expect(staffRouteCode('Staff')).toBe('admin.staff.list_view');
    expect(staffRouteCode('StaffDetail')).toBe('admin.staff.list_view');
    expect(staffRouteCode('EditStaffProfile')).toBe('admin.staff.manage');
    expect(staffRouteCode('AttendanceHistory')).toBe('admin.staff.attendance.view');
  });

  it('BR-83h: deactivate is offered only for an ACTIVE member and only with admin.staff.manage', () => {
    expect(canDeactivateStaff(mainCan, { status: 'ACTIVE' })).toBe(true);
    expect(canDeactivateStaff(mainCan, { status: 'INACTIVE' })).toBe(false);
    expect(canDeactivateStaff(subCan, { status: 'ACTIVE' })).toBe(false);
  });

  it('BR-83e: a confined scope always filters to its own warehouse; Main uses its selection', () => {
    expect(staffWarehouseFilter({ warehouseId: WH_A }, WH_B)).toBe(WH_A);
    expect(staffWarehouseFilter({}, WH_B)).toBe(WH_B);
    expect(staffWarehouseFilter({}, undefined)).toBeUndefined();
  });
});

describe('Asia/Kolkata dates', () => {
  it('BR-84f: today is the IST calendar date of the real instant, not the UTC date', () => {
    expect(istToday(NOW)).toBe('2026-10-15');
    expect(istToday(new Date('2026-10-14T18:29:00.000Z'))).toBe('2026-10-14');
  });

  it('BR-84f: a day after today is clamped to today', () => {
    expect(clampToToday('2026-10-16', '2026-10-15')).toBe('2026-10-15');
    expect(clampToToday('2026-10-01', '2026-10-15')).toBe('2026-10-01');
  });

  it('shifts across month and year ends and rejects impossible dates', () => {
    expect(shiftIsoDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftIsoDate('2026-12-31', 1)).toBe('2027-01-01');
    expect(parseIsoDate('2026-02-30')).toBeNull();
  });

  it('the history ranges end today', () => {
    expect(historyRangeDates('Today', '2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' });
    expect(historyRangeDates('7 Days', '2026-10-15')).toEqual({ from: '2026-10-09', to: '2026-10-15' });
    expect(historyRangeDates('30 Days', '2026-10-15')).toEqual({ from: '2026-09-16', to: '2026-10-15' });
    expect(historyRangeDates('This Month', '2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });

  it('builds the picker month from the date', () => {
    expect(calendarMonthOf('2026-02-10')).toMatchObject({ daysInMonth: 28, firstWeekday: 0, label: 'Feb 2026' });
    expect(formatIsoDate('2026-10-15')).toBe('15 Oct 2026');
  });
});

describe('mapping', () => {
  it('maps a staff record without inventing fields', () => {
    expect(member).toMatchObject({ staffCode: 'STF-0001', name: 'Ravi Kumar', warehouseName: 'Coonoor', joinedOnText: '12 Aug 2026' });
    expect(Object.keys(member)).not.toContain('vehicleDetails');
    expect(Object.keys(member)).not.toContain('email');
  });

  it('an unknown warehouse is "Another warehouse", never a fixture name', () => {
    expect(nameOf(WH_B)).toBe(t('staff.warehouse.other'));
  });

  it('BR-84k: the roll call keeps a null mark as "not marked" and filters by chip and search', () => {
    const dto: RollCallDto = {
      date: '2026-10-15',
      items: [
        { staffId: 'a', staffCode: 'STF-1', staffName: 'Asha', designation: 'Loader', warehouseId: WH_A, staffStatus: 'ACTIVE', attendance: null },
        {
          staffId: 'b',
          staffCode: 'STF-2',
          staffName: 'Bala',
          designation: 'Driver',
          warehouseId: WH_A,
          staffStatus: 'ACTIVE',
          attendance: { id: 'x', status: 'PRESENT', checkIn: '2026-10-15T03:30:00.000Z', checkOut: null, note: null },
        },
      ],
      summary: { present: 1, absent: 0, leave: 0, notMarked: 1, total: 2 },
    };
    const rows = toRollCallRows(dto, nameOf, NOW);
    expect(rows.map((r) => r.status)).toEqual([null, 'PRESENT']);
    expect(rows[1]?.checkInText).toContain('09:00 AM');
    expect(filterRollCall(rows, 'Not Marked', '').map((r) => r.staffId)).toEqual(['a']);
    expect(filterRollCall(rows, 'All', 'driver').map((r) => r.staffId)).toEqual(['b']);
  });

  it('BR-84h: summary rows carry the server counts as they are', () => {
    const dto: AttendanceSummaryDto = {
      from: '2026-10-01',
      to: '2026-10-15',
      totals: { present: 3, absent: 1, leave: 1, marked: 5 },
      byStaff: [{ staffId: 'a', staffCode: 'STF-1', staffName: 'Asha', designation: 'Loader', warehouseId: WH_A, present: 3, absent: 1, leave: 1, marked: 5 }],
    };
    expect(toSummaryRows(dto)).toEqual([{ staffId: 'a', name: 'Asha', designation: 'Loader', present: 3, absent: 1, leave: 1, marked: 5 }]);
  });

  it('BR-84l: history rows group by day in server order', () => {
    const base = {
      staffId: 'a',
      staffCode: 'STF-1',
      staffName: 'Asha',
      designation: 'Loader',
      warehouseId: WH_A,
      checkIn: null,
      checkOut: null,
      note: null,
      markedBy: 'u',
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: null,
    };
    const entries = [
      toHistoryEntry({ ...base, id: '1', workDate: '2026-10-15', status: 'PRESENT' }, NOW),
      toHistoryEntry({ ...base, id: '2', workDate: '2026-10-15', status: 'ABSENT' }, NOW),
      toHistoryEntry({ ...base, id: '3', workDate: '2026-10-14', status: 'LEAVE' }, NOW),
    ];
    expect(groupHistoryByDate(entries).map((g) => [g.date, g.entries.length])).toEqual([
      ['2026-10-15', 2],
      ['2026-10-14', 1],
    ]);
  });
});

describe('staff form bodies', () => {
  it('BR-83a: create trims, omits an empty phone and needs a warehouse', () => {
    const form = { ...emptyStaffForm('2026-10-15'), fullName: '  Ravi ', designation: ' Loader ' };
    expect(buildCreateStaffBody(form, undefined)).toEqual({ ok: false, errorKey: 'staff.form.error.warehouse' });
    expect(buildCreateStaffBody(form, WH_A)).toEqual({
      ok: true,
      body: { fullName: 'Ravi', designation: 'Loader', joinedOn: '2026-10-15', warehouseId: WH_A, status: 'ACTIVE' },
    });
  });

  it('BR-83a: create refuses a blank name, a bad phone and an impossible date', () => {
    const form = { ...emptyStaffForm('2026-10-15'), fullName: 'Ravi', designation: 'Loader' };
    expect(buildCreateStaffBody({ ...form, fullName: ' ' }, WH_A)).toMatchObject({ ok: false, errorKey: 'staff.form.error.name' });
    expect(buildCreateStaffBody({ ...form, phone: '12345' }, WH_A)).toMatchObject({ ok: false, errorKey: 'staff.form.error.phone' });
    expect(buildCreateStaffBody({ ...form, joinedOn: '2026-02-30' }, WH_A)).toMatchObject({ ok: false, errorKey: 'staff.form.error.joinedOn' });
  });

  it('BR-83g: update sends only changed fields; a cleared phone is null', () => {
    const form = { ...staffFormOf(member), phone: '', status: 'INACTIVE' as const };
    expect(buildUpdateStaffBody(member, form)).toEqual({ ok: true, body: { phone: null, status: 'INACTIVE' } });
  });

  it('BR-83b: an unchanged form sends nothing (the server needs at least one field)', () => {
    expect(buildUpdateStaffBody(member, staffFormOf(member))).toEqual({ ok: false, errorKey: 'staff.form.error.noChanges' });
  });

  it('every form error key exists in the catalogue', () => {
    for (const key of ['name', 'designation', 'phone', 'joinedOn', 'warehouse', 'noChanges']) {
      expect(Object.prototype.hasOwnProperty.call(en, `staff.form.error.${key}`), key).toBe(true);
    }
  });
});

describe('attendance bodies', () => {
  it('BR-84a: times are sent only for a PRESENT day', () => {
    const present = row('a', 'PRESENT', '2026-10-15T03:30:00.000Z');
    expect(markStatusBody('ABSENT', present)).toEqual({ status: 'ABSENT' });
    expect(markStatusBody('PRESENT', present)).toEqual({ status: 'PRESENT', checkIn: '2026-10-15T03:30:00.000Z' });
    expect(markStatusBody('LEAVE', null)).toEqual({ status: 'LEAVE' });
  });

  it('BR-84a: check-in now uses the real instant; check-out needs a check-in and keeps it', () => {
    const at = new Date('2026-10-15T12:00:00.000Z');
    expect(checkInNowBody(at)).toEqual({ status: 'PRESENT', checkIn: '2026-10-15T12:00:00.000Z' });
    expect(checkOutNowBody({ checkIn: null }, at)).toBeNull();
    expect(checkOutNowBody({ checkIn: '2026-10-15T13:00:00.000Z' }, at)).toBeNull();
    expect(checkOutNowBody({ checkIn: '2026-10-15T03:30:00.000Z' }, at)).toEqual({
      status: 'PRESENT',
      checkIn: '2026-10-15T03:30:00.000Z',
      checkOut: '2026-10-15T12:00:00.000Z',
    });
  });

  it('BR-84j: bulk marks only the unmarked, at most 200 per request, each staff once', () => {
    const rows = [row('marked', 'ABSENT'), ...Array.from({ length: 201 }, (_, i) => row(`s${i}`, null))];
    const chunks = bulkPresentChunks(rows);
    expect(chunks.map((c) => c.length)).toEqual([200, 1]);
    const ids = chunks.flat().map((e) => e.staffId);
    expect(ids).not.toContain('marked');
    expect(new Set(ids).size).toBe(ids.length);
    expect(chunks.flat().every((e) => e.status === 'PRESENT')).toBe(true);
    expect(bulkPresentChunks([row('x', 'LEAVE')])).toEqual([]);
  });
});
