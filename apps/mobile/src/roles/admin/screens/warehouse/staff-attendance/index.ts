// Warehouse staff & attendance area (design module M14): the workforce roster
// (Staff, Staff Detail, Edit Staff Profile; rbac warehouse.staff.list_view) and
// attendance (overview, detail, history; no code). Explicit exports only (no `export *`).
export { StaffFlow, canOpenStaffRoute, type StaffFlowProps } from './StaffFlow';
export { StaffScreen, STAFF_ROSTER_CODE, type StaffScreenProps } from './StaffScreen';
export { StaffDetailScreen, type StaffDetailScreenProps } from './StaffDetailScreen';
export { EditStaffProfileScreen, type EditStaffProfileScreenProps } from './EditStaffProfileScreen';
export { AttendanceScreen, type AttendanceScreenProps } from './AttendanceScreen';
export { AttendanceDetailScreen, type AttendanceDetailScreenProps } from './AttendanceDetailScreen';
export { AttendanceHistoryScreen, type AttendanceHistoryScreenProps } from './AttendanceHistoryScreen';
export { STAFF_WAREHOUSES } from './fixtures';
export type {
  AttendanceFilter,
  AttendanceHistoryEntry,
  AttendanceRecord,
  AttendanceStatus,
  StaffMember,
  StaffMonthSummary,
  StaffRoute,
  StaffRouteParams,
  StaffType,
} from './types';
