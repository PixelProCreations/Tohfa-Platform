// Warehouse storage-ops area, part A (design module M4): material handling
// (list, detail, add; rbac inventory.material_handling.manage) and storage
// locations (detail: inventory.batch.view; assignment: inventory.batch.assign)
// and capacity (no view code; Manage Capacity Limits: warehouse.capacity.set),
// plus Main-only Warehouse Performance (warehouse.all.view). Part B: operational
// issues (no code), Report an Issue / Request Submitted (support.ticket.create_own),
// Warehouse Activity with the Today preset + Activity Detail (no code; CSV export
// report.export.file).
// Explicit exports only (no `export *`).
export { StorageFlow, canOpenStorageRoute, type StorageFlowProps } from './StorageFlow';
export { MaterialHandlingScreen, type MaterialHandlingScreenProps } from './MaterialHandlingScreen';
export { MaterialDetailScreen, type MaterialDetailScreenProps } from './MaterialDetailScreen';
export { AddMaterialScreen, type AddMaterialScreenProps } from './AddMaterialScreen';
export { StorageLocationDetailScreen, type StorageLocationDetailScreenProps } from './StorageLocationDetailScreen';
export {
  StorageLocationAssignmentScreen,
  type StorageLocationAssignmentScreenProps,
} from './StorageLocationAssignmentScreen';
export { WarehouseCapacityScreen, capacityStateOf, type WarehouseCapacityScreenProps } from './WarehouseCapacityScreen';
export { WarehousePerformanceScreen, type WarehousePerformanceScreenProps } from './WarehousePerformanceScreen';
export {
  WarehouseActivityScreen,
  ActivityCategoryIcon,
  ACTIVITY_STATUS_TONE,
  type WarehouseActivityScreenProps,
} from './WarehouseActivityScreen';
export { ActivityDetailScreen, type ActivityDetailScreenProps } from './ActivityDetailScreen';
export { OperationalIssuesScreen, ISSUE_STATUS_TONE, type OperationalIssuesScreenProps } from './OperationalIssuesScreen';
export { OperationalIssueDetailScreen, type OperationalIssueDetailScreenProps } from './OperationalIssueDetailScreen';
export { ReportIssueScreen, type ReportIssueScreenProps, type ReportIssueSubmission } from './ReportIssueScreen';
export { IssueSubmittedScreen, type IssueSubmittedScreenProps } from './IssueSubmittedScreen';
export { STORAGE_CODES } from './StorageParts';
export { STORAGE_WAREHOUSES } from './fixtures';
export type {
  ActivityCategory,
  ActivityItem,
  ActivityModule,
  ActivityPreset,
  ActivityStatus,
  CapacityFilter,
  CapacityState,
  IssueFilter,
  IssueSeverity,
  IssueStatus,
  OperationalIssue,
  ReportIssueMode,
  MaterialFilter,
  MaterialHistoryEntry,
  MaterialItem,
  MaterialOption,
  MaterialStatus,
  PerformancePeriod,
  StorageRoute,
  StorageRouteParams,
} from './types';
