/**
 * Shared types of the direct / market / channel sales screens. The view models
 * themselves live in ./mappers.ts (built from the API); this file holds the
 * route params and the names other modules import.
 *
 * One set of screens serves both shells; the difference is carried by `scope`
 * (warehouseId undefined = every warehouse in the caller's scope, the Main
 * view) and `can`.
 */
import type { SalePaymentMethod as ApiSalePaymentMethod } from '../../../api/sales';
import type {
  ChannelOrderRow,
  SaleCustomerView,
  SaleLineView,
  SaleProductView,
} from './mappers';

export type {
  PermissionCheck,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from '../finance-expenses';

/** The read-only channel a ChannelSales screen is showing. */
export type SalesChannel = 'B2B' | 'HORECA';

/** One HORECA / B2B list row (GET /admin/sales/horeca | /b2b). */
export type ChannelOrderItem = ChannelOrderRow;
/** One product line of a sale or channel order. */
export type ChannelOrderLine = SaleLineView;
export type SaleLine = SaleLineView;
export type SaleCustomer = SaleCustomerView;
export type SaleProduct = SaleProductView;
export type SalePaymentMethod = ApiSalePaymentMethod;

/**
 * A sale a host asks the flow to open. Only `id` (the sale uuid) is used: the
 * detail is always fetched from GET /admin/sales/{saleId}. The other fields
 * are accepted for hosts that still build the old deep-link shape and are
 * ignored.
 */
export interface SaleRecord {
  id: string;
  [legacyField: string]: unknown;
}

/**
 * Routes of SalesFlow: the old App.tsx keys without the 'SubWarehouse' prefix,
 * plus ChannelSales / ChannelOrderDetail (B2B / HORECA, read-only) and Invoice
 * (the shared invoice detail, opened only with a real invoice uuid).
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
  | 'ChannelOrderDetail'
  | 'Invoice';

export interface SalesRouteParams {
  /** Sale to open on SaleDetail (its uuid). */
  saleId?: string | undefined;
  /** Legacy deep-link shape; `sale.id` is used as saleId. */
  sale?: SaleRecord | undefined;
  channel?: SalesChannel | undefined;
  /** Channel order picked on ChannelSales. */
  order?: ChannelOrderItem | undefined;
  /** Invoice uuid for the Invoice route. */
  invoiceId?: string | undefined;
  /** Customer preselected by the caller (e.g. a customer's "New Sale"): shown, then looked up by code. */
  customerName?: string | undefined;
  customerCode?: string | undefined;
}
