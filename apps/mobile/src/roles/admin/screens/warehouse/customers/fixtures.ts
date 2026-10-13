/**
 * What is left of the customer screens' design samples now that they read the
 * customers API (plan phase 6): the sample warehouse list and the default
 * filter states of OrderFiltersScreen, which the order and purchase filters
 * still use (the live customer screens no longer open them: the API cannot
 * filter by any of their fields). Rows carry the seeded warehouse codes (seed
 * 001_reference.sql).
 */
import type { OrderFilterState, PurchaseFilterState, WarehouseScope } from './types';

/** The four warehouses (seed 001). Main's customer.list.view `own` covers all of them. */
export const CUSTOMER_WAREHOUSES: readonly WarehouseScope[] = [
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty Warehouse' },
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' },
  { warehouseId: 'WH-KOTA', warehouseName: 'Kotagiri Warehouse' },
  { warehouseId: 'WH-GUDA', warehouseName: 'Gudalur Market Warehouse' },
];

export const DEFAULT_ORDER_FILTERS: OrderFilterState = {
  searchQuery: '',
  orderStatus: 'All',
  orderType: 'All',
  channel: 'All',
  paymentStatus: 'All',
  datePreset: 'All Time',
  startDate: '',
  endDate: '',
  customer: '',
  warehouseId: undefined,
};

export const DEFAULT_PURCHASE_FILTERS: PurchaseFilterState = {
  searchQuery: '',
  datePreset: 'All Time',
  startDate: '',
  endDate: '',
  purchaseStatus: 'All',
  productCrop: '',
  grade: 'All',
  sortBy: 'Newest First',
  warehouseId: undefined,
};
