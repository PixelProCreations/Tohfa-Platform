// Warehouse storage-ops area (design module M4). Part A: storage locations
// (detail: inventory.batch.view; assignment: inventory.batch.assign)
// and capacity (no view code; Manage Capacity Limits: warehouse.capacity.set),
// plus Main-only Warehouse Performance (warehouse.all.view). Part B: operational
// issues (no code), Report an Issue / Request Submitted (support.ticket.create_own),
// Warehouse Activity with the Today preset + Activity Detail (no code; CSV export
// report.export.file), and the Warehouse Operations hub (no code; Main parts
// need warehouse.all.view).
// Explicit exports only (no `export *`).
export { StorageFlow, canOpenStorageRoute, type StorageFlowProps } from './StorageFlow';
export { StorageLocationDetailScreen, type StorageLocationDetailScreenProps } from './StorageLocationDetailScreen';
export {
  StorageLocationAssignmentScreen,
  type StorageLocationAssignmentScreenProps,
} from './StorageLocationAssignmentScreen';
export { StorageLocationsScreen, type StorageLocationsScreenProps } from './StorageLocationsScreen';
export { WarehouseCapacityScreen, capacityStateOf, type WarehouseCapacityScreenProps } from './WarehouseCapacityScreen';
export { WarehousePerformanceScreen, type WarehousePerformanceScreenProps } from './WarehousePerformanceScreen';
export {
  WarehouseActivityScreen,
  ActivityCategoryIcon,
  ACTIVITY_STATUS_TONE,
  type WarehouseActivityScreenProps,
} from './WarehouseActivityScreen';
export { ActivityDetailScreen, type ActivityDetailScreenProps } from './ActivityDetailScreen';
export { WarehouseOperationsScreen, type WarehouseOperationsScreenProps } from './WarehouseOperationsScreen';
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
  AttentionItem,
  CapacityFilter,
  CapacityState,
  IssueFilter,
  IssueSeverity,
  IssueStatus,
  OperationalIssue,
  OperationsSummary,
  ReportIssueMode,
  PerformancePeriod,
  StorageRoute,
  StorageRouteParams,
} from './types';
