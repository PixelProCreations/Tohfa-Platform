/**
 * Shared types for the warehouse billing & invoice screens (design module M9).
 *
 * One set of screens serves both warehouse roles. As in finance-expenses,
 * orders and returns-rma, the role difference is carried by `scope`
 * (warehouseId undefined = all warehouses, the Main Warehouse view) and `can`
 * (a docs/rbac.json code check that only decides what to render; the server
 * enforces every action again, CLAUDE.md 2.1).
 *
 * SubWarehouseGenerateInvoiceScreen and SubWarehouseInvoiceWizardScreen each
 * declared their own `TransactionRecord` with different shapes, and the
 * dashboard barrel re-exported both with `export *`, so the name clashed
 * (TS2308). Each shape has its own name here (W3b), unchanged.
 *
 * Folded designs (W4, owner decision 2026-10-09):
 *   - Invoice History (SubWarehouseInvoiceHistoryScreen, Main InvoiceHistoryScreen)
 *     is InvoiceListScreen layout 'history'; its filter screen
 *     (SubWarehouseInvoiceHistoryFiltersScreen) is InvoiceFiltersScreen, so the
 *     two filter states are one InvoiceFilterState.
 *   - Review Invoice (SubWarehouseReviewInvoiceScreen) is the Review step of
 *     InvoiceWizardScreen; the post-sale entry passes `review` (InvoiceReviewData).
 *   - Invoice Preview / History Detail / Main Download Invoice are InvoiceDetailScreen.
 *   - The GST Invoice restricted notice is dropped (invoice.gst.generate is
 *     none/none for both warehouse roles, SPEC_GAPS W4g).
 */
export type {
  PermissionCheck,
  WarehouseNavigate,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses/types';

/** One completed sale on the Generate Invoice picker list. */
export interface InvoiceTransactionRecord {
  id: string;
  customerName: string;
  amount: string;
  status: 'Completed' | 'Invoice Exists';
  saleType: string;
  /** Warehouse that made the sale. Optional until the API returns it. */
  warehouseId?: string | undefined;
}

/** The sale the invoice wizard is generating an invoice for. */
export interface WizardTransactionRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  amount: string;
  saleType: string;
  status: string;
  date: string;
}

/** Invoice workflow status. */
export type InvoiceStatus = 'Generated' | 'Pending' | 'Cancelled';

/** Sale type an invoice derives from its source transaction. */
export type InvoiceSaleType = 'Retail Sale' | 'Market Sale' | 'B2B Sale';

/** One invoice row (list, history and hub "recent" card). Mock until the invoice API is wired. */
export interface InvoiceRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  saleType: InvoiceSaleType;
  amount: string;
  /** Display date, e.g. '25 Sep 2026' (the history layout groups by it). */
  date: string;
  /** Display time, e.g. '10:42 AM'. */
  time: string;
  status: InvoiceStatus;
  /** Warehouse that issued the invoice. Optional until the API returns it. */
  warehouseId?: string | undefined;
}

/** One product line on an invoice. */
export interface InvoiceLineItem {
  name: string;
  grade: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

/** Everything the invoice detail shows. Optional fields render only when present. */
export interface InvoiceDetailRecord {
  invoiceId: string;
  orderNumber: string;
  date: string;
  salesChannel: string;
  invoiceType: string;
  status: InvoiceStatus;
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
  customerName: string;
  customerId: string;
  customerPhone: string;
  items: InvoiceLineItem[];
  subtotal: string;
  discount: string;
  gst: string;
  total: string;
  paymentStatus: string;
  paymentMethod: string;
  generatedBy?: string | undefined;
  generatedAt?: string | undefined;
  linkedAt?: string | undefined;
  downloadAvailable?: boolean | undefined;
}

/** Filter state of the invoice list (both layouts). */
export interface InvoiceFilterState {
  searchQuery: string;
  status: 'All' | InvoiceStatus;
  invoiceType: 'All' | InvoiceSaleType;
  datePreset: 'All Time' | 'Today' | 'Last 7 Days' | 'This Month' | 'Custom';
  startDate: string;
  endDate: string;
  customer: string;
  orderId: string;
  minAmount: string;
  maxAmount: string;
  sortBy: 'Newest First' | 'Oldest First' | 'Highest Amount' | 'Lowest Amount';
  /** Main view only: one warehouse, or undefined for all. Ignored for a Sub scope. */
  warehouseId?: string | undefined;
}

/** Invoice list layouts: card list (M9-S02) or date-grouped history (M9-S07). */
export type InvoiceListLayout = 'list' | 'history';

/** Summary the wizard's Review step shows; prefilled when launched from a completed sale. */
export interface InvoiceReviewData {
  invoiceType: string;
  customerName: string;
  itemsCount: number;
  subtotal: string;
  gst: string;
  total: string;
}

/** Wizard steps, in order. */
export type InvoiceWizardStep = 'summary' | 'items' | 'customer' | 'review';

/**
 * Route keys of BillingFlow. They are the old App.tsx keys without the
 * 'SubWarehouse' prefix, so App.tsx maps a legacy key by stripping it.
 */
export type BillingRoute =
  | 'BillingHub'
  | 'InvoiceList'
  | 'InvoiceFilters'
  | 'InvoiceDetail'
  | 'GenerateInvoice'
  | 'InvoiceWizard'
  | 'InvoiceGenerated';

/** Params carried between BillingFlow routes. All optional: a deep link may carry none. */
export interface BillingRouteParams {
  invoiceId?: string | undefined;
  transaction?: WizardTransactionRecord | undefined;
  /** Post-sale entry: open the wizard on its Review step with this summary. */
  review?: InvoiceReviewData | undefined;
  layout?: InvoiceListLayout | undefined;
}
