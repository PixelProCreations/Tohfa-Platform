import { describe, expect, it } from 'vitest';
import type { AttendanceDto, RollCallItemDto, StaffAttendanceCounts } from '../api/attendance';
import type { StaffDto } from '../api/staff';
import {
  mapAttendanceDtoToHistoryEntry,
  mapAttendanceDtoToRecord,
  mapRollCallItemDtoToRecord,
  mapStaffAttendanceCountsToMonthSummary,
  mapStaffDtoToMember,
} from '../screens/warehouse/staff-attendance/mappers';

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
