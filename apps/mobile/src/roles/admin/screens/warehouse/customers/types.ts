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

import type { Paise } from '@tohfa/shared-types';
import type { AdminTone } from '../../../theme';
import type { OrderUiStatus } from '../orders/types';

/** One customer row in the warehouse customer search (mock data today; the real search returns the same shape). */
export interface CustomerSearchItem {
  name: string;
  code: string;
  id?: string;
  phone: string;
  balance: string;
  status?: string;
}

/** A customer status as the screens show it; 'unknown' for a value the app does not know yet. */
export type CustomerUiStatus = 'active' | 'inactive' | 'unknown';

/**
 * A customer as listed (GET /admin/customers). `id` is the uuid, the only key
 * the API looks a customer up by; `code` ('CUS-…') is the human code.
 * `mobileMasked` is exactly what the server sent (BR-92): no full mobile or
 * e-mail is ever kept on a list row.
 */
export interface CustomerRow {
  id: string;
  code: string;
  name: string;
  mobileMasked: string;
  piiMasked: boolean;
  status: CustomerUiStatus;
  statusLabel: string;
  tone: AdminTone;
  isNew: boolean;
  customerTypeLabel: string;
  /** null when the server sent no count (shown as no value, never 0). */
  totalOrders: number | null;
  lastActivityLabel: string;
}

/** The list KPIs: the server's summary of the whole visible set (BR-91e). */
export interface CustomerSummary {
  total: number;
  active: number;
  new: number;
}

/** Full contact details, kept only when the server sent them unmasked (scope `all`, BR-92). */
export interface CustomerContact {
  mobile: string | null;
  email: string | null;
}

/** Which contact actions a profile may offer: none while PII is masked (BR-92). */
export interface CustomerContactActions {
  call: boolean;
  email: boolean;
}

/** One customer's profile (GET /admin/customers/{id}). Money in integer paise. */
export interface CustomerProfileView {
  id: string;
  code: string;
  name: string;
  mobileMasked: string;
  piiMasked: boolean;
  contact: CustomerContact;
  status: CustomerUiStatus;
  statusLabel: string;
  tone: AdminTone;
  isNew: boolean;
  customerTypeLabel: string;
  businessName: string | null;
  totalOrders: number | null;
  lifetimeValuePaise: Paise | null;
  lifetimeValueLabel: string;
  walletBalancePaise: Paise | null;
  walletBalanceLabel: string;
  lastOrderLabel: string;
  lastActivityLabel: string;
  registeredLabel: string;
}

/** Every field optional and explicitly `undefined`-able (deep-link params). */
export type Loose<T> = { [K in keyof T]?: T[K] | undefined };

/**
 * What a caller knows about the customer in focus: a list row, or a deep link
 * that may carry only a name or a code. Only a uuid `id` can be fetched.
 */
export type CustomerRef = Loose<Pick<CustomerRow, 'id' | 'code' | 'name' | 'mobileMasked' | 'piiMasked'>>;

/** Order status bucket used by the customer-order tabs. */
export type CustomerOrderCategory = 'Active' | 'Completed' | 'Cancelled';

/** One order of a customer (GET /admin/customers/{id}/orders). `id` is the order uuid. */
export interface CustomerOrderRow {
  id: string;
  orderNumber: string;
  status: OrderUiStatus;
  statusLabel: string;
  tone: AdminTone;
  /** null for a status the app does not know yet (listed under All only). */
  category: CustomerOrderCategory | null;
  channelLabel: string;
  paymentStatusLabel: string;
  itemsLabel: string;
  totalPaise: Paise | null;
  amountLabel: string;
  placedLabel: string;
  invoiceNumber: string | null;
  warehouseId: string;
}

/**
 * One purchased order LINE (GET /admin/customers/{id}/purchases). The API is
 * line level and so is this: there is no invoice-level purchase row.
 */
export interface PurchaseLineRow {
  /** Order, product, grade and time; the screen adds the position for a React key. */
  key: string;
  orderId: string;
  orderNumber: string;
  channelLabel: string;
  productName: string;
  /** "Tomato · Grade 1". */
  lineLabel: string;
  qtyGrams: number | null;
  /** "2.25 kg × ₹40.10". */
  qtyDetail: string;
  unitPricePaise: Paise | null;
  lineTotalPaise: Paise | null;
  amountLabel: string;
  purchasedLabel: string;
}

/** A wallet status as the screens show it. */
export type WalletUiStatus = 'active' | 'frozen' | 'closed' | 'unknown';

/** The wallet summary (GET /admin/customers/{id}/wallet): read-only (BR-93). */
export interface CustomerWalletView {
  walletId: string;
  status: WalletUiStatus;
  statusLabel: string;
  balancePaise: Paise | null;
  balanceLabel: string;
  transactionCount: number | null;
  lastTransactionLabel: string;
}

/** A wallet transaction type as the screens show it. */
export type WalletTxnUiType =
  | 'topupCash'
  | 'topupDigital'
  | 'orderDebit'
  | 'orderRefund'
  | 'payoutDebit'
  | 'saleCredit'
  | 'subscriptionDebit'
  | 'adjustment'
  | 'unknown';

/** One wallet ledger row, with the server's own sign on the amount. */
export interface WalletTxnRow {
  id: string;
  type: WalletTxnUiType;
  typeLabel: string;
  direction: 'credit' | 'debit';
  amountPaise: Paise | null;
  amountLabel: string;
  balanceAfterPaise: Paise | null;
  balanceAfterLabel: string;
  /** balanceAfter - amount, exact in paise; null when either is missing. */
  previousBalancePaise: Paise | null;
  previousBalanceLabel: string;
  performedLabel: string;
  warehouseId: string | null;
  /** The fiscal cash tag of a cash top-up, else the remarks; null when neither. */
  reference: string | null;
}

/** A return-request status as the screens show it. */
export type IssueUiStatus = 'pending' | 'inspected' | 'approved' | 'rejected' | 'refundPendingBank' | 'refunded' | 'unknown';

/** One issue a customer raised (a return request). `id` is the key; `reference` is a label only (BR-91h). */
export interface CustomerIssueRow {
  id: string;
  reference: string;
  orderId: string | null;
  orderNumber: string | null;
  status: IssueUiStatus;
  statusLabel: string;
  tone: AdminTone;
  reason: string | null;
  /** null until an inspection recorded an accepted quantity. */
  refundPaise: Paise | null;
  refundLabel: string | null;
  createdLabel: string;
  /** null while the request is open. */
  resolvedLabel: string | null;
}

/** A support ticket status as the screens show it. */
export type TicketUiStatus = 'open' | 'inProgress' | 'resolved' | 'closed' | 'unknown';

/** One support ticket of a customer (no farmer field and no customer contact, BR-97). */
export interface SupportTicketRow {
  id: string;
  ticketNumber: string;
  subject: string;
  categoryLabel: string;
  priorityLabel: string;
  status: TicketUiStatus;
  statusLabel: string;
  tone: AdminTone;
  createdLabel: string;
  resolvedLabel: string | null;
}

/** One message of a ticket thread, oldest first. */
export interface SupportMessageView {
  id: string;
  senderLabel: string;
  fromCustomer: boolean;
  body: string;
  isInternal: boolean;
  /** The server replaced farmer-identifying text in it (BR-97). */
  redacted: boolean;
  hasAttachment: boolean;
  atLabel: string;
}

/** A ticket with its thread. */
export interface SupportTicketDetailView extends SupportTicketRow {
  description: string;
  messages: SupportMessageView[];
  /** A CLOSED ticket refuses replies (BR-97i). */
  canReply: boolean;
}

/** What a live customer screen needs to pick an AsyncState and to refresh or page. */
export interface CustomersLiveStateProps {
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
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
  order?: CustomerOrderRow | undefined;
  /** Order uuid for 'OrderDetail' (the order detail looks orders up by id). */
  orderId?: string | undefined;
  /** Order number, for a host that shows it while the detail loads. */
  orderNo?: string | undefined;
  issue?: CustomerIssueRow | undefined;
  ticket?: SupportTicketRow | undefined;
  /** CustomerOrders: open on a status bucket tab ('Active', 'Completed', 'Cancelled'). */
  defaultFilter?: string | undefined;
}
