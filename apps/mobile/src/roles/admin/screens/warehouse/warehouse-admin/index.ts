// Main warehouse-admin screens (W4): all-warehouses overview, city detail and
// Sub Warehouse Admin management. Explicit exports only (no `export *`).
export {
  WarehouseAdminFlow,
  canOpenWarehouseAdminRoute,
  type WarehouseAdminFlowProps,
} from './WarehouseAdminFlow';
export { WarehouseOverviewScreen, type WarehouseOverviewScreenProps } from './WarehouseOverviewScreen';
export { WarehouseCityDetailScreen, type WarehouseCityDetailScreenProps } from './WarehouseCityDetailScreen';
export {
  ManageSubWarehouseAdminsScreen,
  type ManageSubWarehouseAdminsScreenProps,
} from './ManageSubWarehouseAdminsScreen';
export { WAREHOUSE_ADMIN_CODES } from './WarehouseAdminParts';
export { ADMIN_WAREHOUSES, SUB_WAREHOUSE_ADMINS, WAREHOUSE_ADMIN_ROWS } from './fixtures';
export type {
  SubWarehouseAdminItem,
  WarehouseAdminRoute,
  WarehouseAdminRouteParams,
  WarehouseAdminRow,
} from './types';
