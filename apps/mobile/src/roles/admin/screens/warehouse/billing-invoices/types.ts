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
import type { InvoiceType } from '../../../api/invoices';

export type { InvoiceType };
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
  date?: string | undefined;
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

/**
 * Invoice status as the screens key it (badge tone, filter chip). One per API
 * InvoiceStatus: Generated = ISSUED, Pending = DRAFT, Cancelled = CANCELLED,
 * CreditNoted = CREDIT_NOTED (kept apart from Cancelled: a credit note is not
 * a cancellation). The text shown comes from `billing.status.*`.
 */
export type InvoiceStatus = 'Generated' | 'Pending' | 'Cancelled' | 'CreditNoted';

/** Display label of an invoice's type (`billing.type.<InvoiceType>`). */
export type InvoiceSaleType = string;

/**
 * One invoice row (list, history and hub "recent" card), from GET /invoices.
 * The list sends no buyer, warehouse or order number, so none is shown here.
 */
export interface InvoiceRecord {
  /** Invoice uuid: navigation and every API call (GET /invoices/{id} 422s anything else, BR-36). */
  id: string;
  /** Display only. */
  invoiceNumber: string;
  invoiceType: InvoiceType;
  /** Label of invoiceType. */
  saleType: InvoiceSaleType;
  /** The order's uuid, kept as a reference only: the invoice carries no order number. */
  orderId?: string | undefined;
  /** Always '' on the list: GET /invoices has no buyer field (BR-128 adds it to the detail only). */
  customerName: string;
  amount: string;
  /** Integer paise of the total, for the amount filter and sort; null when the API value is unparseable. */
  amountPaise: number | null;
  /** `YYYY-MM-DD` as the API sent it (sort and grouping key). */
  issueDate: string;
  /** Display date, e.g. '25 Sep 2026' (the history layout groups by it). */
  date: string;
  status: InvoiceStatus;
  statusLabel: string;
  /** No invoice response carries a warehouse; kept optional for the shared scope helpers. */
  warehouseId?: string | undefined;
}

/** One product line on an invoice. */
export interface InvoiceLineItem {
  name: string;
  /** 'HSN 0706', or '' when the line has no HSN code. */
  hsn: string;
  /** Quantity text as the API sent it, with its unit. */
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

/** Everything the invoice detail shows, from GET /invoices/{id}. Optional fields render only when present. */
export interface InvoiceDetailRecord {
  /** Invoice uuid, for the download call (BR-36). */
  id: string;
  /** Display only. */
  invoiceNumber: string;
  invoiceType: InvoiceType;
  typeLabel: string;
  date: string;
  status: InvoiceStatus;
  statusLabel: string;
  orderId?: string | undefined;
  /** BR-128 buyer; undefined for a farmer-side invoice (never a farmer name). */
  buyerName?: string | undefined;
  buyerGstin?: string | undefined;
  /** buyerName or '' (the Sub preview reads it). */
  customerName: string;
  placeOfSupply?: string | undefined;
  items: InvoiceLineItem[];
  taxable: string;
  cgst: string;
  sgst: string;
  igst: string;
  /** CGST + SGST + IGST, summed in integer paise. */
  gst: string;
  total: string;
  downloadAvailable: boolean;
}

/** Filter state of the invoice list (both layouts). */
export interface InvoiceFilterState {
  searchQuery: string;
  status: 'All' | InvoiceStatus;
  /** Sent to GET /invoices as `type`. */
  invoiceType: 'All' | InvoiceType;
  /** Sent to GET /invoices as `fromDate` / `toDate`. */
  datePreset: 'All Time' | 'Today' | 'Last 7 Days' | 'This Month' | 'Custom';
  /** Custom range, DD/MM/YYYY as typed. */
  startDate: string;
  endDate: string;
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
