import { describe, expect, it } from 'vitest';
import type { AttendanceDto, RollCallItemDto, StaffAttendanceCounts } from '../api/attendance';
import type { StaffDto } from '../api/staff';
import {
  attendanceLabel,
  mapAttendanceDtoToHistoryEntry,
  mapAttendanceDtoToRecord,
  mapRollCallItemDtoToRecord,
  mapStaffAttendanceCountsToMonthSummary,
  mapStaffDtoToMember,
  rollCallStatusByStaffId,
} from '../screens/warehouse/staff-attendance/mappers';
import {
  clampDayToToday,
  historyRangeDates,
  istMonth,
  monthGridOf,
  shiftIstDay,
} from '../screens/warehouse/staff-attendance/attendanceDates';

describe('staff-attendance mappers', () => {
  it('maps StaffDto to StaffMember', () => {
    const dto: StaffDto = {
      id: 'stf-001',
      staffCode: 'STF-0024',
      warehouseId: 'WH-COON',
      fullName: 'Karthik Raja',
      designation: 'Warehouse Staff',
      phone: '+919876543210',
      joinedOn: '2026-01-15',
      status: 'ACTIVE',
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: null,
    };

    const member = mapStaffDtoToMember(dto);

    expect(member.id).toBe('stf-001');
    expect(member.name).toBe('Karthik Raja');
    expect(member.staffId).toBe('STF-0024');
    expect(member.type).toBe('warehouse');
    expect(member.role).toBe('Warehouse Staff');
    expect(member.status).toBe('Active');
    expect(member.phone).toBe('+919876543210');
    expect(member.warehouseId).toBe('WH-COON');
  });

  it('maps RollCallItemDto with attendance to AttendanceRecord', () => {
    const item: RollCallItemDto = {
      staffId: 'stf-001',
      staffCode: 'STF-0024',
      staffName: 'Karthik Raja',
      designation: 'Warehouse Staff',
      warehouseId: 'WH-COON',
      staffStatus: 'ACTIVE',
      attendance: {
        id: 'att-001',
        status: 'PRESENT',
        checkIn: '2026-09-25T03:32:00.000Z',
        checkOut: '2026-09-25T12:40:00.000Z',
        note: null,
      },
    };

    const record = mapRollCallItemDtoToRecord(item);

    expect(record.id).toBe('att-001');
    expect(record.name).toBe('Karthik Raja');
    expect(record.status).toBe('Present');
    expect(record.checkInTime).toBeDefined();
    expect(record.checkOutTime).toBeDefined();
    expect(record.warehouseId).toBe('WH-COON');
  });

  it('maps RollCallItemDto without attendance to Not Checked In', () => {
    const item: RollCallItemDto = {
      staffId: 'stf-002',
      staffCode: 'STF-0025',
      staffName: 'Manoj Kumar',
      designation: 'Driver',
      warehouseId: 'WH-COON',
      staffStatus: 'ACTIVE',
      attendance: null,
    };

    const record = mapRollCallItemDtoToRecord(item);

    expect(record.name).toBe('Manoj Kumar');
    expect(record.status).toBe('Not Checked In');
    expect(record.type).toBe('driver');
  });

  it('maps AttendanceDto to AttendanceHistoryEntry', () => {
    const dto: AttendanceDto = {
      id: 'att-100',
      staffId: 'stf-001',
      staffCode: 'DRV-0018',
      staffName: 'Arun Kumar',
      designation: 'Driver',
      warehouseId: 'WH-COON',
      workDate: '2026-09-25',
      status: 'PRESENT',
      checkIn: '2026-09-25T03:32:00.000Z',
      checkOut: '2026-09-25T12:40:00.000Z',
      note: null,
      markedBy: 'admin',
      createdAt: '2026-09-25T03:32:00.000Z',
      updatedAt: null,
    };

    const entry = mapAttendanceDtoToHistoryEntry(dto);

    expect(entry.id).toBe('att-100');
    expect(entry.name).toBe('Arun Kumar');
    expect(entry.status).toBe('Present');
    expect(entry.dateHeader).toBe('25 SEP');
  });

  it('maps StaffAttendanceCounts to StaffMonthSummary', () => {
    const counts: StaffAttendanceCounts = {
      staffId: 'stf-001',
      staffCode: 'DRV-0018',
      staffName: 'Arun Kumar',
      designation: 'Driver',
      warehouseId: 'WH-COON',
      present: 22,
      absent: 2,
      leave: 1,
      marked: 25,
    };

    const summary = mapStaffAttendanceCountsToMonthSummary(counts, 'September 2026');

    expect(summary.id).toBe('stf-001');
    expect(summary.staffName).toBe('Arun Kumar');
    expect(summary.present).toBe(22);
    expect(summary.absent).toBe(2);
    expect(summary.leave).toBe(1);
    expect(summary.monthLabel).toBe('September 2026');
  });
});

describe('staff roster attendance (BR-84k roll-call join)', () => {
  const staffDto = (id: string): StaffDto => ({
    id,
    staffCode: `STF-${id}`,
    warehouseId: 'WH-COON',
    fullName: `Staff ${id}`,
    designation: 'Warehouse Staff',
    phone: null,
    joinedOn: '2026-01-15',
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: null,
  });
  const rollCallItem = (staffId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE' | null): RollCallItemDto => ({
    staffId,
    staffCode: `STF-${staffId}`,
    staffName: `Staff ${staffId}`,
    designation: 'Warehouse Staff',
    warehouseId: 'WH-COON',
    staffStatus: 'ACTIVE',
    attendance: status === null ? null : { id: `att-${staffId}`, status, checkIn: null, checkOut: null, note: null },
  });

  it('BR-84k: a roster card takes its attendance from the roll call joined by staff id', () => {
    const byStaff = rollCallStatusByStaffId([
      rollCallItem('a', 'ABSENT'),
      rollCallItem('b', 'LEAVE'),
      rollCallItem('c', null),
      rollCallItem('d', 'PRESENT'),
    ]);
    expect(mapStaffDtoToMember(staffDto('a'), byStaff).attendance).toBe('Absent');
    expect(mapStaffDtoToMember(staffDto('b'), byStaff).attendance).toBe('On Leave');
    expect(mapStaffDtoToMember(staffDto('c'), byStaff).attendance).toBe('Not Checked In');
    expect(mapStaffDtoToMember(staffDto('d'), byStaff).attendance).toBe('Present');
  });

  it('BR-84k: a member with no roll-call row (or no roll call) has no attendance, never a default Present', () => {
    const byStaff = rollCallStatusByStaffId([rollCallItem('a', 'PRESENT')]);
    expect(mapStaffDtoToMember(staffDto('z'), byStaff).attendance).toBeUndefined();
    expect(mapStaffDtoToMember(staffDto('a')).attendance).toBeUndefined();
  });

  it('shows the em dash for a member with no attendance', () => {
    expect(attendanceLabel(undefined)).toBe('—');
    expect(attendanceLabel('Absent')).toBe('Absent');
  });
});

describe('attendance dates are IST calendar days (BR-84f)', () => {
  it('BR-84f: the current month is the IST month, not the UTC month', () => {
    // 31 Oct 2026 20:00 UTC is already 1 Nov 2026 01:30 in IST.
    expect(istMonth(new Date('2026-10-31T20:00:00.000Z'))).toBe('2026-11');
    expect(istMonth(new Date('2026-10-31T18:00:00.000Z'))).toBe('2026-10');
  });

  it('shifts a calendar day across month and year ends', () => {
    expect(shiftIstDay('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftIstDay('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftIstDay('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('BR-84f: never moves past today (a future day has no attendance)', () => {
    expect(clampDayToToday('2026-10-30', '2026-10-29')).toBe('2026-10-29');
    expect(clampDayToToday('2026-10-28', '2026-10-29')).toBe('2026-10-28');
  });

  it('describes the month grid of a day for the date picker', () => {
    // 1 Sep 2026 is a Tuesday.
    expect(monthGridOf('2026-09-25')).toEqual({ year: 2026, month: 9, day: 25, daysInMonth: 30, firstWeekday: 2 });
    expect(monthGridOf('2024-02-10').daysInMonth).toBe(29);
  });

  it('BR-84i: history ranges end today and start inside the range', () => {
    expect(historyRangeDates('Today', '2026-10-29')).toEqual({ from: '2026-10-29', to: '2026-10-29' });
    expect(historyRangeDates('7 Days', '2026-10-29')).toEqual({ from: '2026-10-23', to: '2026-10-29' });
    expect(historyRangeDates('30 Days', '2026-10-29')).toEqual({ from: '2026-09-30', to: '2026-10-29' });
    expect(historyRangeDates('This Month', '2026-10-29')).toEqual({ from: '2026-10-01', to: '2026-10-29' });
  });
});
