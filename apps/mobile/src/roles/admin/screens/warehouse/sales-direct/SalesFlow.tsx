/**
 * In-module navigator for the sales screens (design module M6). The screens
 * are pure; this flow owns the stack and the sale being built, so every step
 * gets the viewer's scope and `can`.
 *
 *   Sales hub -> New Sale -> (Select Customer) -> Select Products -> Summary (POST /quote)
 *             -> Select Customer (when none picked yet) -> Payment (POST /admin/sales,
 *                UPI confirm / cancel) -> Confirmation -> Invoice (only with a real invoice uuid)
 *   Sales hub / Market Day -> Sales History -> Sale Detail -> Invoice
 *   Sales hub -> Channel Sales (HORECA / B2B, read-only) -> Channel Order Detail
 *
 * Who may do what is docs/rbac.json: MAIN_WH_ADMIN holds the sales *.view
 * codes only (no sales.sale.create, no payment.record), so a Main admin never
 * reaches New Sale; SUB_WH_ADMIN sells at its own warehouse (BR-85f).
 */
import React, { useEffect, useState } from 'react';
import { LiveInvoiceDetail } from '../billing-invoices';
import { useFlowBack } from '../useFlowBack';
import { ChannelOrderDetailScreen } from './ChannelOrderDetailScreen';
import { ChannelSalesScreen } from './ChannelSalesScreen';
import { MarketDaySalesScreen } from './MarketDaySalesScreen';
import { NewSaleScreen } from './NewSaleScreen';
import { PaymentScreen } from './PaymentScreen';
import { SaleConfirmationScreen } from './SaleConfirmationScreen';
import { SaleDetailScreen } from './SaleDetailScreen';
import { SaleSummaryScreen } from './SaleSummaryScreen';
import { SalesHistoryScreen } from './SalesHistoryScreen';
import { SalesScreen } from './SalesScreen';
import { SelectCustomerScreen } from './SelectCustomerScreen';
import { SelectProductsScreen } from './SelectProductsScreen';
import type { CartLine, SaleBuyerInput, SaleDetailView, SaleQuoteView } from './mappers';
import type {
  PermissionCheck,
  SalesRoute,
  SalesRouteParams,
  WarehouseScope,
  WarehouseTab,
} from './types';
import { useSalesWarehouseOptions } from './useSalesData';

interface SalesStackEntry {
  screen: SalesRoute;
  params?: SalesRouteParams | undefined;
  /** Select Customer opened from New Sale only picks; from Summary it continues to Payment. */
  pickOnly?: boolean | undefined;
}

export interface SalesFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: SalesRoute | undefined;
  initialParams?: SalesRouteParams | undefined;
  /** Leave the sales module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Needs Attention is the shared dashboard-home-more queue (HomeFlow); the host opens it. */
  onNavigateToNeedsAttention?:
    | ((category?: 'all' | 'payment_pending' | 'stock_issue' | 'failed_sale' | 'invoice_issue') => void)
    | undefined;
}

export function SalesFlow({
  scope,
  can,
  initialScreen = 'Sales',
  initialParams,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onNavigateToNeedsAttention,
}: SalesFlowProps) {
  const [stack, setStack] = useState<SalesStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // The sale being built. A Sub admin always sells at its own warehouse; an
  // all-scope actor holding sales.sale.create picks a real warehouse uuid.
  const warehouses = useSalesWarehouseOptions(scope, can);
  const [pickedWarehouseId, setPickedWarehouseId] = useState<string | undefined>(undefined);
  const saleWarehouseId = scope.warehouseId ?? pickedWarehouseId;
  const [channel, setChannel] = useState<'DIRECT' | 'MARKET'>('DIRECT');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [quote, setQuote] = useState<SaleQuoteView | null>(null);
  const [buyer, setBuyer] = useState<SaleBuyerInput | null>(null);
  const [createdSale, setCreatedSale] = useState<SaleDetailView | null>(null);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Keyed on the param values, not the object, so a host that
  // builds the params inline does not reset it.
  const presetKey = `${initialParams?.customerCode ?? ''}|${initialParams?.saleId ?? initialParams?.sale?.id ?? ''}|${initialParams?.channel ?? ''}`;
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: SalesRouteParams = current.params ?? {};

  const push = (entry: SalesStackEntry) => setStack((prev) => [...prev, entry]);
  const navigate = (screen: SalesRoute, nextParams?: SalesRouteParams) => push({ screen, params: nextParams });
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };

  // Hardware back pops this flow's stack; at its root the host's listener handles it.
  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });

  const startNewSale = (nextChannel: 'DIRECT' | 'MARKET' = 'DIRECT') => {
    setChannel(nextChannel);
    setCart([]);
    setQuote(null);
    setBuyer(null);
    setCreatedSale(null);
    // Back from a fresh sale returns to the hub (or the host), not to the finished one.
    setStack((prev) => [...prev.filter((e) => e.screen === 'Sales').slice(0, 1), { screen: 'NewSale' }]);
  };

  const canViewInvoice = can('invoice.view_own');
  const openInvoice = (invoiceId: string) => navigate('Invoice', { invoiceId });
  const common = { scope, can, onBack: back, onTabChange };
  const presetCustomerCode = initialParams?.customerCode;

  switch (current.screen) {
    case 'Sales':
      return (
        <SalesScreen
          {...common}
          onNavigateToNotifications={onNavigateToNotifications}
          onNavigateToNewSale={startNewSale}
          onNavigateToSalesHistory={() => navigate('SalesHistory')}
          onNavigateToMarketDaySales={() => navigate('MarketDaySales')}
          onNavigateToChannelSales={(next) => navigate('ChannelSales', { channel: next })}
          onNavigateToNeedsAttention={onNavigateToNeedsAttention}
          onSelectSale={(saleId) => navigate('SaleDetail', { saleId })}
        />
      );
    case 'NewSale':
      return (
        <NewSaleScreen
          {...common}
          channel={channel}
          onChangeChannel={(next) => {
            setChannel(next);
            setCart([]);
            setQuote(null);
          }}
          saleWarehouseId={saleWarehouseId}
          warehouseOptions={warehouses.options}
          warehousesLoading={warehouses.isLoading}
          warehousesError={warehouses.error}
          onRetryWarehouses={warehouses.refresh}
          onSelectWarehouse={(id) => {
            setPickedWarehouseId(id);
            setCart([]);
            setQuote(null);
          }}
          buyer={buyer}
          presetCustomerName={initialParams?.customerName}
          cart={cart}
          onSelectCustomer={() => push({ screen: 'SelectCustomer', pickOnly: true })}
          onSelectProducts={() => navigate('SelectProducts')}
        />
      );
    case 'SelectProducts':
      return (
        <SelectProductsScreen
          {...common}
          channel={channel}
          saleWarehouseId={saleWarehouseId}
          cart={cart}
          onContinue={(next) => {
            setCart(next);
            setQuote(null);
            navigate('SaleSummary');
          }}
        />
      );
    case 'SaleSummary':
      return (
        <SaleSummaryScreen
          {...common}
          channel={channel}
          saleWarehouseId={saleWarehouseId}
          cart={cart}
          onChangeCart={(next) => {
            setCart(next);
            setQuote(null);
          }}
          onContinue={(priced) => {
            setQuote(priced);
            // Customer already picked on New Sale: straight to payment.
            navigate(buyer ? 'Payment' : 'SelectCustomer');
          }}
        />
      );
    case 'SelectCustomer':
      return (
        <SelectCustomerScreen
          {...common}
          pickOnly={current.pickOnly === true}
          initialQuery={presetCustomerCode}
          onPick={(picked) => {
            setBuyer(picked);
            if (current.pickOnly) back();
            else navigate('Payment');
          }}
        />
      );
    case 'Payment':
      return (
        <PaymentScreen
          {...common}
          channel={channel}
          saleWarehouseId={saleWarehouseId}
          cart={cart}
          quote={quote}
          buyer={buyer}
          onChangeBuyer={() => push({ screen: 'SelectCustomer', pickOnly: true })}
          onCompleted={(sale) => {
            setCreatedSale(sale);
            // The confirmation replaces the payment step: back from it goes to the hub.
            setStack((prev) => [...prev.filter((e) => e.screen === 'Sales').slice(0, 1), { screen: 'SaleConfirmation' }]);
          }}
        />
      );
    case 'SaleConfirmation':
      return createdSale ? (
        <SaleConfirmationScreen
          {...common}
          sale={createdSale}
          warehouseName={warehouses.nameOf(createdSale.warehouseId)}
          onViewInvoice={createdSale.invoiceId && canViewInvoice ? openInvoice : undefined}
          onViewSale={(saleId) => navigate('SaleDetail', { saleId })}
          onNewSale={() => startNewSale(channel)}
        />
      ) : (
        <SalesHistoryScreen {...common} onSelectSale={(saleId) => navigate('SaleDetail', { saleId })} />
      );
    case 'SalesHistory':
      return <SalesHistoryScreen {...common} onSelectSale={(saleId) => navigate('SaleDetail', { saleId })} />;
    case 'SaleDetail':
      return (
        <SaleDetailScreen
          {...common}
          saleId={params.saleId ?? params.sale?.id}
          warehouseNameOf={warehouses.nameOf}
          onViewInvoice={canViewInvoice ? openInvoice : undefined}
        />
      );
    case 'MarketDaySales':
      return (
        <MarketDaySalesScreen
          {...common}
          onNavigateToNewMarketSale={() => startNewSale('MARKET')}
          onNavigateToSalesHistory={() => navigate('SalesHistory')}
          onSelectSale={(saleId) => navigate('SaleDetail', { saleId })}
        />
      );
    case 'ChannelSales':
      return (
        <ChannelSalesScreen
          {...common}
          channel={params.channel ?? 'B2B'}
          onSelectOrder={(order) => navigate('ChannelOrderDetail', { channel: order.channel, order })}
        />
      );
    case 'ChannelOrderDetail':
      return (
        <ChannelOrderDetailScreen
          {...common}
          channel={params.channel ?? params.order?.channel ?? 'B2B'}
          order={params.order}
          onViewInvoice={canViewInvoice ? openInvoice : undefined}
        />
      );
    case 'Invoice':
      return <LiveInvoiceDetail scope={scope} can={can} invoiceId={params.invoiceId} onBack={back} onTabChange={onTabChange} />;
    default:
      return null;
  }
}
