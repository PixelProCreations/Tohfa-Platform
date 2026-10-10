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
}

/** One B2B or HORECA order (mock data today; the real list returns the same shape). */
export interface ChannelOrderItem {
  id: string;
  channel: SalesChannel;
  businessName: string;
  customerCode: string;
  status: 'Processing' | 'Pending' | 'Completed' | 'Confirmed';
  itemCountText: string;
  dateText: string;
  amount: number;
  /** Warehouse that fulfils the order. Falls back to the viewer's scope when absent. */
  warehouseName?: string | undefined;
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
  id: string;
  customerName: string;
  customerCode?: string | undefined;
  /** 'Direct Sale' | 'Market Sale' | ... (display label). */
  channel: string;
  dateText: string;
  amount: number;
  status: string;
  itemCountText?: string | undefined;
  invoiceNo?: string | undefined;
  paymentMethod?: string | undefined;
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
  id: string;
  name: string;
  grade: string;
  pricePerKg: number;
  availableKg: number;
  status: 'Available' | 'Low Stock';
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
