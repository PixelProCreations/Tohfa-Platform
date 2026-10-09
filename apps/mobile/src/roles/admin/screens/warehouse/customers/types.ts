/**
 * Shared types for the warehouse customer screens (design module M7).
 *
 * One set of screens serves both warehouse roles. As in finance-expenses,
 * orders, returns-rma and billing-invoices, the role difference is carried by
 * `scope` (warehouseId undefined = all warehouses, the Main Warehouse view) and
 * `can` (a docs/rbac.json code check that only decides what to render; the
 * server enforces every action again, CLAUDE.md 2.1).
 *
 * customer.list.view is `own` for both MAIN_WH_ADMIN and SUB_WH_ADMIN. Main's
 * `own` is every warehouse (owner decision 2026-10-09: Main holds `all`), so a
 * Main scope lists rows across the four warehouses and a Sub scope only its own.
 *
 * Several Sub screens used to declare their own record types (CustomerItem,
 * CustomerIssueRecord, SupportTicketRecord, PurchaseItem, OrderFilterState,
 * PurchaseFilterState) and the dashboard barrel re-exported them with
 * `export *`; they live here now, once.
 *
 * Folded designs (W4, owner decision 2026-10-09):
 *   - Main CustomerListScreen / CustomerDetailScreen / CustomerIssuesScreen /
 *     PurchaseHistoryScreen / SupportHistoryScreen are absorbed by the shared
 *     screens (Main-only content is scope-conditional).
 *   - SubWarehousePurchaseFiltersScreen and the order-queue filters (M5S03) are
 *     OrderFiltersScreen with a `config` ('order' | 'purchase').
 *   - Customer Actions (SubWarehouseCustomerActionsScreen) is dropped:
 *     customer.profile.edit is none/none for both warehouse roles and no
 *     credit-limit / suspend code exists (SPEC_GAPS W4h-1).
 */
export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** One customer row in the warehouse customer search (mock data today; the real search returns the same shape). */
export interface CustomerSearchItem {
  name: string;
  code: string;
  id?: string;
  phone: string;
  balance: string;
  status?: string;
}

/** A customer as listed and shown on the details hub. */
export interface CustomerRecord {
  id: string;
  name: string;
  code: string;
  phone: string;
  email?: string | undefined;
  status: 'Active' | 'Inactive';
  /** Primary warehouse. The list filters on it for a Sub scope; Main shows it per row. */
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
  ordersCount: number;
  lastPurchase: string;
  totalPurchases?: string | undefined;
  walletBalance?: string | undefined;
  openIssues?: number | undefined;
  completedOrders?: number | undefined;
  cancelledOrders?: number | undefined;
  regDate?: string | undefined;
}

/** Every field optional and explicitly `undefined`-able (deep-link params). */
export type Loose<T> = { [K in keyof T]?: T[K] | undefined };

/** What a caller knows about the customer in focus (deep links carry only some fields). */
export type CustomerRef = Loose<CustomerRecord>;

/** Order status bucket used by the customer-order tabs and filters. */
export type CustomerOrderCategory = 'Active' | 'Completed' | 'Cancelled';

/** One order of a customer. */
export interface CustomerOrderRecord {
  id: string;
  orderNo: string;
  date: string;
  items: string;
  products?: string | undefined;
  type: 'Pickup' | 'Delivery';
  paymentStatus: string;
  price: string;
  status: string;
  statusCategory: CustomerOrderCategory;
  /** Warehouse that fulfils the order; a Sub scope lists only its own. */
  warehouseId?: string | undefined;
}

/** One issue a customer raised. */
export interface CustomerIssueRecord {
  id: string;
  issueNo: string;
  category: string;
  orderNo: string;
  dateText: string;
  status: 'In Review' | 'Open' | 'Resolved';
  product?: string | undefined;
  quantity?: string | undefined;
  description?: string | undefined;
}

/** One support ticket of a customer. */
export interface SupportTicketRecord {
  id: string;
  ticketNo: string;
  subject: string;
  orderRef: string;
  dateText: string;
  status: 'Resolved' | 'Open';
  resolvedBy?: string | undefined;
}

/** One purchase (invoiced sale) of a customer. */
export interface PurchaseRecord {
  id: string;
  invoiceNo: string;
  dateText: string;
  itemsSummary: string;
  items?: readonly string[] | undefined;
  amount: string;
  status: 'Paid' | 'Pending';
  /** Sales channel (Main twin showed it, e.g. "Direct Sale"). */
  channel?: string | undefined;
  /** Order the purchase belongs to; tapping the purchase opens that order. */
  orderNo?: string | undefined;
}

/** Filter state of the order filters ('order' config): customer orders and the warehouse order queue. */
export interface OrderFilterState {
  searchQuery: string;
  /** 'All', a customer-order bucket (Active/Completed/Cancelled) or a queue status (Confirmed, Packing, ...). */
  orderStatus: string;
  orderType: 'All' | 'Pickup' | 'Delivery';
  /** Order-queue variant only. */
  channel: 'All' | 'Online' | 'Live Market' | 'HORECA' | 'B2B';
  paymentStatus: 'All' | 'Paid' | 'Pending' | 'Failed';
  datePreset: 'All Time' | 'Today' | 'Yesterday' | 'Last 7 Days' | 'This Month' | 'Custom';
  startDate: string;
  endDate: string;
  /** Customer-order variant only. */
  customer: string;
  /** Main view only (scope.warehouseId undefined); undefined = all warehouses. */
  warehouseId?: string | undefined;
}

/** Filter state of the purchase filters ('purchase' config). */
export interface PurchaseFilterState {
  searchQuery: string;
  datePreset: 'All Time' | 'Today' | 'Last 7 Days' | 'This Month' | 'Custom';
  startDate: string;
  endDate: string;
  purchaseStatus: 'All' | 'Paid' | 'Pending' | 'Cancelled';
  productCrop: string;
  grade: 'All' | 'Grade 1' | 'Grade 2' | 'Grade 3';
  sortBy: 'Newest First' | 'Oldest First' | 'Highest Amount' | 'Lowest Amount';
  /** Main view only (scope.warehouseId undefined); undefined = all warehouses. */
  warehouseId?: string | undefined;
}

/** Which field set OrderFiltersScreen renders. */
export type FiltersConfig = 'order' | 'purchase';

/** 'order' config variants: a customer's orders, or the warehouse order queue (old M5S03). */
export type OrderFiltersVariant = 'customer' | 'queue';

/** Route keys of CustomersFlow. */
export type CustomersRoute =
  | 'CustomersList'
  | 'CustomerSearch'
  | 'CustomerDetails'
  | 'CustomerOrders'
  | 'OrderFilters'
  | 'PurchaseHistory'
  | 'PurchaseFilters'
  | 'CustomerIssues'
  | 'CustomerIssueDetail'
  | 'SupportHistory'
  | 'SupportDetail';

/**
 * Screens outside the customer area that a customer screen opens (the bell is
 * a plain `onNavigateToNotifications` callback instead). The host
 * either renders them inside the flow (`renderExternalScreen`) or navigates
 * to its own route (`onOpenExternal`).
 */
export type CustomersExternalRoute = 'CustomerWallet' | 'CashTopUp' | 'NewSale' | 'OrderDetail' | 'RmaDetail';

/** Params carried between customer routes and to external routes. */
export interface CustomersRouteParams {
  customer?: CustomerRef | undefined;
  order?: CustomerOrderRecord | undefined;
  /** Order number for 'OrderDetail' (a purchase knows only the number). */
  orderNo?: string | undefined;
  issue?: Loose<CustomerIssueRecord> | undefined;
  ticket?: Loose<SupportTicketRecord> | undefined;
  /** CustomerOrders: open pre-filtered (status bucket or order type). */
  defaultFilter?: string | undefined;
}
