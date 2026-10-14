// Direct sales area: the sales hub, the direct (walk-in) sale flow, market day,
// sales history / detail, and the B2B / HORECA channel screens (`channel` prop).
// Explicit exports only (no `export *`).
export { SalesFlow, type SalesFlowProps } from './SalesFlow';
export { SalesScreen, type SalesScreenProps } from './SalesScreen';
export { NewSaleScreen, type NewSaleScreenProps } from './NewSaleScreen';
export { SelectProductsScreen, type SelectProductsScreenProps } from './SelectProductsScreen';
export { SaleSummaryScreen, type SaleSummaryScreenProps } from './SaleSummaryScreen';
export { SelectCustomerScreen, type SelectCustomerScreenProps } from './SelectCustomerScreen';
export { PaymentScreen, type PaymentScreenProps } from './PaymentScreen';
export { SaleConfirmationScreen, type SaleConfirmationScreenProps } from './SaleConfirmationScreen';
export { SalesHistoryScreen, type SalesHistoryScreenProps } from './SalesHistoryScreen';
export { SaleDetailScreen, type SaleDetailScreenProps } from './SaleDetailScreen';
export { MarketDaySalesScreen, type MarketDaySalesScreenProps } from './MarketDaySalesScreen';
export { ChannelSalesScreen, type ChannelSalesScreenProps } from './ChannelSalesScreen';
export { ChannelOrderDetailScreen, type ChannelOrderDetailScreenProps } from './ChannelOrderDetailScreen';
export { invoiceIdForOrder } from './fixtures';
export { SALE_WAREHOUSES } from './SalesParts';
export type {
  ChannelOrderItem,
  ChannelOrderLine,
  SaleCustomer,
  SalePaymentMethod,
  SaleProduct,
  SaleRecord,
  SalesChannel,
  SalesRoute,
  SalesRouteParams,
} from './types';
