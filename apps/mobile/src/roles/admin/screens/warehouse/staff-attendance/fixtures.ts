/**
 * Mock data for the staff & attendance screens until a roster / attendance API
 * exists (none in docs/openapi.yaml today). Rows carry the seeded warehouse ids
 * (seed 001_reference.sql) so a Sub scope filters to its own warehouse while the
 * Main scope sees all four; warehouse names are looked up from STAFF_WAREHOUSES
 * instead of being written into each row or screen.
 */
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import type { AttendanceHistoryEntry, AttendanceRecord, StaffMember, StaffMonthSummary, WarehouseScope } from './types';

/** The four warehouses (seed 001). Main's roster grant (`all`) covers all of them. */
export const STAFF_WAREHOUSES: readonly WarehouseScope[] = WALLET_WAREHOUSES;

/** Display name of a warehouse id (falls back to the id). */
export const staffWarehouseName = warehouseNameOf;

/** The day the mock attendance rows describe (demo; the API returns the date with the rows). */
export const ATTENDANCE_DATE_TEXT = '25 Sep 2026';
/** The same day as a history group header. */
export const ATTENDANCE_DATE_HEADER = '25 SEP';
/** Day-of-month of ATTENDANCE_DATE_TEXT, the date picker's initial selection. */
export const ATTENDANCE_DAY = 25;
/** Month shown in the date picker (demo). */
export const ATTENDANCE_MONTH_LABEL = 'September 2026';
export const ATTENDANCE_MONTH_SHORT = 'Sep 2026';
/** Days in the picker month and the weekday (0 = Sunday) of its first day. */
export const ATTENDANCE_MONTH_DAYS = 30;
export const ATTENDANCE_MONTH_FIRST_WEEKDAY = 2;

/** History range shown by the From / To header, per range chip (demo dates). */
export const HISTORY_RANGE_DATES: Readonly<Record<'Today' | '7 Days' | '30 Days' | 'This Month', { from: string; to: string }>> = {
  Today: { from: '25 Sep 2026', to: '25 Sep 2026' },
  '7 Days': { from: '19 Sep 2026', to: '25 Sep 2026' },
  '30 Days': { from: '26 Aug 2026', to: '25 Sep 2026' },
  'This Month': { from: '01 Sep 2026', to: '25 Sep 2026' },
};

export const STAFF_MEMBERS: readonly StaffMember[] = [
  {
    id: 'staff-1',
    name: 'Arun Kumar',
    staffId: 'DRV-0018',
    type: 'driver',
    role: 'Driver',
    status: 'Active',
    attendance: 'Present',
    deliveriesToday: 6,
    phone: 'XXXXXXXXXX',
    email: 'arun.k@email.com',
    vehicleDetails: 'TN 43 AB 1234',
    warehouseId: 'WH-COON',
  },
  {
    id: 'staff-2',
    name: 'Karthik',
    staffId: 'STF-0024',
    type: 'warehouse',
    role: 'Warehouse Staff',
    status: 'Active',
    attendance: 'Present',
    phone: 'XXXXXXXXXX',
    email: 'example@email.com',
    warehouseId: 'WH-COON',
  },
  {
    id: 'staff-3',
    name: 'Manoj',
    staffId: 'DRV-0022',
    type: 'driver',
    role: 'Driver',
    status: 'Active',
    attendance: 'Absent',
    deliveriesToday: 0,
    phone: 'XXXXXXXXXX',
    email: 'manoj.d@email.com',
    warehouseId: 'WH-COON',
  },
  {
    id: 'staff-4',
    name: 'Suresh',
    staffId: 'STF-0031',
    type: 'warehouse',
    role: 'Warehouse Staff',
    status: 'Active',
    attendance: 'On Leave',
    phone: 'XXXXXXXXXX',
    email: 'suresh.s@email.com',
    warehouseId: 'WH-OOTY',
  },
];

/** Staff Detail opened without a member (deep link): the first warehouse-staff row. */
export const DEFAULT_STAFF_MEMBER: StaffMember = STAFF_MEMBERS[1] ?? {
  id: 'staff-2',
  name: 'Karthik',
  staffId: 'STF-0024',
  type: 'warehouse',
  role: 'Warehouse Staff',
  status: 'Active',
  attendance: 'Present',
};

/** Attendance summary of the member on Staff Detail (demo month). */
export const STAFF_ATTENDANCE_SUMMARY = { present: 22, absent: 2, leave: 1 };

/** Delivery figures on a driver's Staff Detail (demo). */
export const DRIVER_DELIVERY_SUMMARY = { completedToday: 4, pendingToday: 2, completedTotal: 124, cancelled: 3, failed: 2 };

/** Activity timeline on Staff Detail (Main's version carried the dates). */
export const STAFF_ACTIVITY: readonly { id: string; title: string; when: string }[] = [
  { id: 'a-1', title: 'Profile Created', when: '12 Aug 2026' },
  { id: 'a-2', title: 'Assigned to warehouse', when: '12 Aug 2026' },
  { id: 'a-3', title: 'Attendance Recorded', when: 'Today, 09:02 AM' },
];

/** Today's attendance rows (folded Today's Attendance set, plus a second warehouse for Main). */
export const ATTENDANCE_RECORDS: readonly AttendanceRecord[] = [
  {
    id: 'att-1',
    name: 'Arun Kumar',
    role: 'Driver',
    type: 'driver',
    status: 'Present',
    checkInTime: '09:02 AM',
    checkOutTime: '06:10 PM',
    warehouseId: 'WH-COON',
  },
  {
    id: 'att-2',
    name: 'Karthik',
    role: 'Warehouse Staff',
    type: 'warehouse',
    status: 'Present',
    checkInTime: '09:18 AM',
    warehouseId: 'WH-COON',
  },
  { id: 'att-3', name: 'Manoj', role: 'Driver', type: 'driver', status: 'Absent', warehouseId: 'WH-COON' },
  { id: 'att-4', name: 'Suresh', role: 'Warehouse Staff', type: 'warehouse', status: 'On Leave', warehouseId: 'WH-OOTY' },
];

/** Attendance Detail opened without a record (deep link from the old standalone screen). */
export const DEFAULT_ATTENDANCE_RECORD: AttendanceRecord = {
  id: 'att-default',
  name: 'Ramesh Kumar',
  role: 'Warehouse Staff',
  type: 'warehouse',
  status: 'Present',
  dateText: '24 Sep 2026',
  checkInTime: '08:42 AM',
  checkOutTime: '05:30 PM',
};

export const ATTENDANCE_HISTORY: readonly AttendanceHistoryEntry[] = [
  { id: 'h-1', dateHeader: '25 SEP', name: 'Arun Kumar', role: 'Driver', status: 'Present', timeRange: '09:02 AM — 06:10 PM', warehouseId: 'WH-COON' },
  { id: 'h-2', dateHeader: '24 SEP', name: 'Arun Kumar', role: 'Driver', status: 'Present', timeRange: '09:05 AM — 06:04 PM', warehouseId: 'WH-COON' },
  { id: 'h-3', dateHeader: '23 SEP', name: 'Arun Kumar', role: 'Driver', status: 'On Leave', warehouseId: 'WH-COON' },
  { id: 'h-4', dateHeader: '22 SEP', name: 'Arun Kumar', role: 'Driver', status: 'Present', timeRange: '09:00 AM — 06:00 PM', warehouseId: 'WH-COON' },
  { id: 'h-5', dateHeader: '22 SEP', name: 'Suresh', role: 'Warehouse Staff', status: 'Present', timeRange: '08:55 AM — 05:40 PM', warehouseId: 'WH-OOTY' },
  { id: 'h-6', dateHeader: '28 AUG', name: 'Arun Kumar', role: 'Driver', status: 'Present', timeRange: '09:12 AM — 06:02 PM', olderThanWeek: true, warehouseId: 'WH-COON' },
];

/** History grouped by staff: one card per person per month (Main's By Staff view). */
export const STAFF_MONTH_SUMMARIES: readonly StaffMonthSummary[] = [
  { id: 'm-1', staffName: 'Arun Kumar', role: 'Driver', monthLabel: 'September 2026', present: 22, absent: 2, leave: 1, warehouseId: 'WH-COON' },
  { id: 'm-2', staffName: 'Arun Kumar', role: 'Driver', monthLabel: 'August 2026', present: 25, absent: 0, leave: 1, olderThanWeek: true, warehouseId: 'WH-COON' },
  { id: 'm-3', staffName: 'Karthik', role: 'Warehouse Staff', monthLabel: 'September 2026', present: 24, absent: 1, leave: 0, warehouseId: 'WH-COON' },
  { id: 'm-4', staffName: 'Karthik', role: 'Warehouse Staff', monthLabel: 'August 2026', present: 26, absent: 0, leave: 0, olderThanWeek: true, warehouseId: 'WH-COON' },
  { id: 'm-5', staffName: 'Suresh', role: 'Warehouse Staff', monthLabel: 'September 2026', present: 20, absent: 1, leave: 3, warehouseId: 'WH-OOTY' },
];
