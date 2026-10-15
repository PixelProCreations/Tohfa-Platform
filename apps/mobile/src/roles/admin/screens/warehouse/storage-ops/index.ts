// Warehouse storage-ops area (design module M4). Part A: material handling
// (list, detail, add; rbac inventory.material_handling.manage) and storage
// locations (detail: inventory.batch.view; assignment: inventory.batch.assign)
// and capacity (no view code; Manage Capacity Limits: warehouse.capacity.set),
// plus Warehouse Performance (warehouse.all.view). Part B (live): operational
// issues (warehouse.issue.view / .manage), Report an Issue (operational:
// ReportOperationalIssueScreen; support: ReportIssueScreen), Warehouse Activity
// + Activity Detail (warehouse.activity.view) and the Warehouse Operations hub.
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
export { StorageLocationsScreen, type StorageLocationsScreenProps } from './StorageLocationsScreen';
export { WarehouseCapacityScreen, type WarehouseCapacityScreenProps } from './WarehouseCapacityScreen';
export { WarehousePerformanceScreen, type WarehousePerformanceScreenProps } from './WarehousePerformanceScreen';
export { WarehouseActivityScreen, type WarehouseActivityScreenProps } from './WarehouseActivityScreen';
export { ActivityDetailScreen, type ActivityDetailScreenProps } from './ActivityDetailScreen';
export { WarehouseOperationsScreen, type WarehouseOperationsScreenProps } from './WarehouseOperationsScreen';
export { OperationalIssuesScreen, type OperationalIssuesScreenProps } from './OperationalIssuesScreen';
export { OperationalIssueDetailScreen, type OperationalIssueDetailScreenProps } from './OperationalIssueDetailScreen';
export { ReportIssueScreen, type ReportIssueScreenProps, type ReportIssueSubmission } from './ReportIssueScreen';
export { ReportOperationalIssueScreen, type ReportOperationalIssueScreenProps } from './ReportOperationalIssueScreen';
export { useStorageWarehouse, type StorageWarehouse } from './StorageWarehouse';
export { IssueSubmittedScreen, type IssueSubmittedScreenProps } from './IssueSubmittedScreen';
export { STORAGE_CODES } from './StorageParts';
export { STORAGE_WAREHOUSES } from './fixtures';
export type {
  ActivityModule,
  ActivityPreset,
  IssueSeverity,
  ReportIssueMode,
  MaterialFilter,
  MaterialHistoryEntry,
  MaterialItem,
  MaterialOption,
  MaterialStatus,
  StorageRoute,
  StorageRouteParams,
} from './types';
