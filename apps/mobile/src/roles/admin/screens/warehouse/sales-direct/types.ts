/**
 * Shared types for the B2B / HORECA channel sales screens.
 *
 * These screens used to exist twice (SubWarehouseB2B* and SubWarehouseHoreca*),
 * identical apart from mock data and labels. One screen per purpose now takes a
 * `channel` prop; the per-channel copy and mock data live in fixtures.ts.
 */

/** The direct-sales channel a screen is showing. */
export type SalesChannel = 'B2B' | 'HORECA';

/** One product line of a channel order. */
export interface ChannelOrderLine {
  name: string;
  grade: string;
  batch: string;
  qtyText: string;
  pricePerUnit: number;
  lineTotal: number;
  /** Paise-formatted unit price label (e.g. "₹100.10"). */
  unitPriceText?: string | undefined;
  /** Paise-formatted line total label (e.g. "₹300.30"). */
  lineTotalText?: string | undefined;
}

/** One B2B or HORECA order (mock data today; the real list returns the same shape). */
export interface ChannelOrderItem {
  id: string;
  /** Human-readable order number (e.g. "B2B-00124"), for display only. */
  orderNumber?: string | undefined;
  channel: SalesChannel;
  businessName: string;
  customerCode: string;
  status: 'Processing' | 'Pending' | 'Completed' | 'Confirmed' | 'Paid';
  itemCountText: string;
  dateText: string;
  amount: number;
  /** Warehouse id. */
  warehouseId?: string | undefined;
  /** Warehouse that fulfils the order. Falls back to the viewer's scope when absent. */
  warehouseName?: string | undefined;
  /** Integer paise total. */
  totalPaise?: number | undefined;
  /** Paise-formatted total label (e.g. "₹18,500.50"). */
  totalText?: string | undefined;
  items?: ChannelOrderLine[] | undefined;
}

// ─── Direct (walk-in) sale flow ──────────────────────────────────────────────
//
// The direct-sale screens used to exist twice: the SubWarehouse* survivors and
// Main's slices in admin/screens/warehouse/DirectSaleScreens.tsx. One set now
// serves both shells; the difference is carried by `scope` (warehouseId
// undefined = all four warehouses, the Main view) and `can`.

export type {
  PermissionCheck,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses';

/** One product line of a completed sale (same shape as a channel order line). */
export type SaleLine = ChannelOrderLine;

/** One completed sale: a Sales History row and the Sale Detail record. */
export interface SaleRecord {
  /** The sale UUID — used for navigation and API calls. */
  id: string;
  /** Human-readable sale number (e.g. "SAL-00124"), display only. */
  saleNumber?: string | undefined;
  customerName: string;
  customerCode?: string | undefined;
  /** i18n display label (e.g. "Direct Sale"). */
  channel: string;
  /** Raw API channel enum (e.g. "DIRECT"). */
  channelCode?: string | undefined;
  dateText: string;
  amount: number;
  /** i18n status label (e.g. "Completed"). */
  status: string;
  /** Raw API status enum (e.g. "PICKED_UP"). */
  statusCode?: string | undefined;
  /** i18n payment status label (e.g. "Paid"). */
  paymentStatus?: string | undefined;
  /** Raw API payment status enum (e.g. "PAID"). */
  paymentStatusCode?: string | undefined;
  itemCountText?: string | undefined;
  invoiceNo?: string | undefined;
  /** Invoice UUID (for the invoice detail screen). */
  invoiceId?: string | undefined;
  paymentMethod?: string | undefined;
  /** Integer paise total. */
  totalPaise?: number | undefined;
  /** Paise-formatted total label (e.g. "₹850.10"). */
  totalText?: string | undefined;
  /** Paise-formatted subtotal label (detail only). */
  subtotalText?: string | undefined;
  /** Paise-formatted GST label (detail only). */
  gstText?: string | undefined;
  /** Paise-formatted change given label (detail only). */
  changeGivenText?: string | undefined;
  /** Status timeline (detail only). */
  timeline?: { label: string; at: string }[] | undefined;
  /** Warehouse that made the sale; a Sub view only ever lists its own. */
  warehouseId?: string | undefined;
  warehouseName?: string | undefined;
  /** Inventory ledger movement reference (Main's Sale Details slice, M6-S09). */
  movementId?: string | undefined;
  items?: SaleLine[] | undefined;
}

/** A customer picked for a direct sale. */
export interface SaleCustomer {
  id: string;
  code: string;
  name: string;
  phone: string;
  orderCount: number;
  walletBalance: number;
}

/** A sellable stock batch of the sale's warehouse (Select Products). */
export interface SaleProduct {
  /** `${productId}|${grade}` key for cart and list deduplication. */
  key?: string | undefined;
  /** Screen navigation id — same as productId (legacy alias kept for screens). */
  id: string;
  /** The product UUID (from SaleProductDto.productId). */
  productId?: string | undefined;
  name: string;
  /** Raw API grade enum (e.g. "GRADE_1"). */
  grade: string;
  /** i18n grade display label (e.g. "Grade 1"). */
  gradeLabel?: string | undefined;
  /** API Money string (e.g. "100.10"), for building quote/sale requests. */
  unitPrice?: string | undefined;
  /** Integer paise price (derived from unitPrice). */
  unitPricePaise?: number | undefined;
  pricePerKg: number;
  availableKg: number;
  /** Integer grams available (derived from availableQtyKg). */
  availableGrams?: number | undefined;
  /**
   * Availability status — NOT set by the API mapper (CLAUDE.md 2.7 forbids a
   * hard-coded kg threshold). Screens that need it compute it from system_config.
   */
  status?: 'Available' | 'Low Stock' | undefined;
  batch?: string | undefined;
  location?: string | undefined;
  /** Warehouse holding the batch; Select Products lists only the sale warehouse's stock. */
  warehouseId?: string | undefined;
  selectedQty?: number | undefined;
}

export type SalePaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Wallet';

/**
 * Routes of SalesFlow: the old App.tsx keys without the 'SubWarehouse' prefix,
 * plus ChannelSales (B2B / HORECA list, `channel` param) and Invoice (the shared
 * billing flow opened from a confirmation or a sale detail).
 */
export type SalesRoute =
  | 'Sales'
  | 'NewSale'
  | 'SelectProducts'
  | 'SaleSummary'
  | 'SelectCustomer'
  | 'Payment'
  | 'SaleConfirmation'
  | 'SalesHistory'
  | 'SalesFilters'
  | 'SaleDetail'
  | 'MarketDaySales'
  | 'ChannelSales'
  | 'Invoice';

export interface SalesRouteParams {
  sale?: SaleRecord | undefined;
  channel?: SalesChannel | undefined;
  /** Customer preselected by the caller (e.g. a customer's "New Sale"). */
  customerName?: string | undefined;
  customerCode?: string | undefined;
}

