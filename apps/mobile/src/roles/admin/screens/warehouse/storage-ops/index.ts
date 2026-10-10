// Warehouse storage-ops area, part A (design module M4): material handling
// (list, detail, add; rbac inventory.material_handling.manage) and storage
// locations (detail: inventory.batch.view; assignment: inventory.batch.assign)
// and capacity (no view code; Manage Capacity Limits: warehouse.capacity.set).
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
export { STORAGE_CODES } from './StorageParts';
export { STORAGE_WAREHOUSES } from './fixtures';
export type {
  CapacityFilter,
  CapacityState,
  MaterialFilter,
  MaterialHistoryEntry,
  MaterialItem,
  MaterialOption,
  MaterialStatus,
  StorageRoute,
  StorageRouteParams,
} from './types';
