// Warehouse staff & attendance area (design module M14), live against
// /admin/warehouse-staff and /admin/staff-attendance (BR-83, BR-84): the roster
// (Staff, Staff Detail, Add / Edit Staff Profile) and attendance (overview,
// detail, history). Explicit exports only (no `export *`).
export { StaffFlow, canOpenStaffRoute, type StaffFlowProps } from './StaffFlow';
export { StaffScreen, STAFF_ROSTER_CODE, type StaffScreenProps } from './StaffScreen';
export {
  StaffFiltersScreen,
  type StaffFiltersScreenProps,
  type StaffFilterValues,
  type StaffStatusFilter,
} from './StaffFiltersScreen';
export { StaffDetailScreen, type StaffDetailScreenProps } from './StaffDetailScreen';
export { EditStaffProfileScreen, type EditStaffProfileScreenProps } from './EditStaffProfileScreen';
export { AttendanceScreen, type AttendanceScreenProps } from './AttendanceScreen';
export { AttendanceDetailScreen, type AttendanceDetailScreenProps } from './AttendanceDetailScreen';
export { AttendanceHistoryScreen, type AttendanceHistoryScreenProps } from './AttendanceHistoryScreen';
export { STAFF_CODES } from './mappers';
export type {
  AttendanceFilter,
  AttendanceHistoryEntry,
  AttendanceRecordRef,
  RollCallRow,
  StaffAttendanceSummaryRow,
  StaffMember,
  StaffRoute,
  StaffRouteParams,
} from './types';
