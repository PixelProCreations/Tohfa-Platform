// Shared Main/Sub warehouse customer screens (design module M7). Explicit
// exports only (no `export *`), mirroring finance-expenses/index.ts so type
// names can never clash across barrels.
export { CustomerDetailsScreen, type CustomerDetailsScreenProps } from './CustomerDetailsScreen';
export { CustomerIssueDetailScreen, type CustomerIssueDetailScreenProps } from './CustomerIssueDetailScreen';
export { CustomerIssuesScreen, type CustomerIssuesScreenProps } from './CustomerIssuesScreen';
export { CustomerOrdersScreen, type CustomerOrdersScreenProps } from './CustomerOrdersScreen';
export { CustomerSearchScreen, type CustomerSearchScreenProps } from './CustomerSearchScreen';
export { CustomersListScreen, type CustomersListScreenProps } from './CustomersListScreen';
export { CustomerSupportDetailScreen, type CustomerSupportDetailScreenProps } from './CustomerSupportDetailScreen';
export { OrderFiltersScreen, type OrderFiltersScreenProps } from './OrderFiltersScreen';
export { PurchaseHistoryScreen, type PurchaseHistoryScreenProps } from './PurchaseHistoryScreen';
export { SupportHistoryScreen, type SupportHistoryScreenProps } from './SupportHistoryScreen';
export {
  CustomersFlow,
  type CustomersFlowNavigation,
  type CustomersFlowProps,
  type CustomersStackEntry,
} from './CustomersFlow';
export { CUSTOMER_WAREHOUSES, DEFAULT_ORDER_FILTERS, DEFAULT_PURCHASE_FILTERS } from './fixtures';
export type {
  CustomerIssueRecord,
  CustomerOrderRecord,
  CustomerRecord,
  CustomerRef,
  CustomersExternalRoute,
  CustomersRoute,
  CustomersRouteParams,
  CustomerSearchItem,
  FiltersConfig,
  OrderFiltersVariant,
  OrderFilterState,
  PurchaseFilterState,
  PurchaseRecord,
  SupportTicketRecord,
} from './types';
