/**
 * The cleared filter states of OrderFiltersScreen (defaults, not sample data),
 * which the order and purchase filters still use (the live customer screens no
 * longer open them: the API cannot filter by any of their fields). The old
 * sample warehouse list ('WH-OOTY'-style ids) is gone: warehouse pickers read
 * GET /warehouses through shared/useWarehouseOptions.ts.
 */
import type { OrderFilterState, PurchaseFilterState } from './types';

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
