import type { AttendanceDto, RollCallItemDto, StaffAttendanceCounts } from '../../../api/attendance';
import type { StaffDto } from '../../../api/staff';
import { t } from '../../../i18n';
import type {
  AttendanceHistoryEntry,
  AttendanceRecord,
  AttendanceStatus,
  StaffMember,
  StaffMonthSummary,
  StaffType,
} from './types';

const MONTH_NAMES_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

export function formatDayMonthHeader(yyyyMmDd: string): string {
  const parts = yyyyMmDd.split('-');
  if (parts.length !== 3) return yyyyMmDd;
  const monthIdx = parseInt(parts[1] ?? '1', 10) - 1;
  const month = MONTH_NAMES_SHORT[monthIdx] ?? parts[1];
  const day = parts[2] ?? '01';
  return `${day} ${month}`;
}

export function formatIstTime(isoStr: string | null | undefined): string | undefined {
  if (!isoStr) return undefined;
  try {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoStr;
  }
}

function determineStaffType(designation: string): StaffType {
  const lower = designation.toLowerCase();
  return lower.includes('driver') ? 'driver' : 'warehouse';
}

function mapStatusToAttendanceStatus(statusCode?: string | null): AttendanceStatus {
  switch (statusCode) {
    case 'PRESENT':
      return 'Present';
    case 'ABSENT':
      return 'Absent';
    case 'LEAVE':
      return 'On Leave';
    default:
      return 'Not Checked In';
  }
}

/**
 * Today's status per staff id from the roll call (BR-84k): a marked day maps
 * its status, an unmarked active member is 'Not Checked In'. The staff record
 * itself carries no attendance, so this is the only source for the roster card.
 */
export function rollCallStatusByStaffId(items: readonly RollCallItemDto[]): ReadonlyMap<string, AttendanceStatus> {
  const out = new Map<string, AttendanceStatus>();
  for (const item of items) {
    out.set(item.staffId, item.attendance ? mapStatusToAttendanceStatus(item.attendance.status) : 'Not Checked In');
  }
  return out;
}

/** A roster card's attendance text: '—' when the roll call has no row for the member. */
export function attendanceLabel(status: AttendanceStatus | undefined): string {
  return status ?? t('staff.noValue');
}

/**
 * `attendanceByStaffId` is the roll call joined by staff id; a member without
 * a row (inactive, or the roll call not loaded / not permitted) has no
 * attendance rather than an assumed 'Present'.
 */
export function mapStaffDtoToMember(dto: StaffDto, attendanceByStaffId?: ReadonlyMap<string, AttendanceStatus>): StaffMember {
  return {
    id: dto.id,
    name: dto.fullName,
    staffId: dto.staffCode,
    type: determineStaffType(dto.designation),
    role: dto.designation,
    status: dto.status === 'ACTIVE' ? 'Active' : 'Inactive',
    attendance: attendanceByStaffId?.get(dto.id),
    phone: dto.phone ?? undefined,
    warehouseId: dto.warehouseId,
  };
}

export function mapRollCallItemDtoToRecord(item: RollCallItemDto): AttendanceRecord {
  const att = item.attendance;
  const status = att ? mapStatusToAttendanceStatus(att.status) : 'Not Checked In';
  const checkInTime = formatIstTime(att?.checkIn);
  const checkOutTime = formatIstTime(att?.checkOut);

  return {
    id: att?.id ?? item.staffId,
    name: item.staffName,
    role: item.designation,
    type: determineStaffType(item.designation),
    status,
    checkInTime,
    checkOutTime,
    warehouseId: item.warehouseId,
  };
}

export function mapAttendanceDtoToRecord(dto: AttendanceDto): AttendanceRecord {
  return {
    id: dto.id,
    name: dto.staffName,
    role: dto.designation,
    type: determineStaffType(dto.designation),
    status: mapStatusToAttendanceStatus(dto.status),
    dateText: dto.workDate,
    checkInTime: formatIstTime(dto.checkIn),
    checkOutTime: formatIstTime(dto.checkOut),
    warehouseId: dto.warehouseId,
  };
}

export function mapAttendanceDtoToHistoryEntry(dto: AttendanceDto): AttendanceHistoryEntry {
  const checkIn = formatIstTime(dto.checkIn);
  const checkOut = formatIstTime(dto.checkOut);
  let timeRange: string | undefined = undefined;
  if (checkIn && checkOut) {
    timeRange = `${checkIn} — ${checkOut}`;
  } else if (checkIn) {
    timeRange = checkIn;
  }

  const rawStatus = mapStatusToAttendanceStatus(dto.status);
  const status: 'Present' | 'Absent' | 'On Leave' =
    rawStatus === 'Not Checked In' ? 'Absent' : rawStatus;

  return {
    id: dto.id,
    dateHeader: formatDayMonthHeader(dto.workDate),
    name: dto.staffName,
    role: dto.designation,
    status,
    timeRange,
    warehouseId: dto.warehouseId,
  };
}

export function mapStaffAttendanceCountsToMonthSummary(
  counts: StaffAttendanceCounts,
  monthLabel: string,
): StaffMonthSummary {
  return {
    id: counts.staffId,
    staffName: counts.staffName,
    role: counts.designation,
    monthLabel,
    present: counts.present,
    absent: counts.absent,
    leave: counts.leave,
    warehouseId: counts.warehouseId,
  };
}
