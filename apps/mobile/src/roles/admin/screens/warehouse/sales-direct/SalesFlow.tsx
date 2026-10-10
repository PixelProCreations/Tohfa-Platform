/**
 * In-module navigator for the direct sales screens (design module M6).
 *
 * The sale flow used to be stitched four times: `show*` state inside the
 * screens themselves (New Sale -> Select Products -> Summary -> Customer ->
 * Payment -> Confirmation, each rendering the next inline), ten App.tsx route
 * keys, the Sub shell, and Main's own slices in DirectSaleScreens.tsx. The
 * inline copies never received `scope` / `can`, so the shared billing screens
 * they opened hid View Invoice (W4 regression). The screens are now pure and
 * this flow owns the stack, so every step gets the viewer's scope and `can`.
 *
 *   Sales hub -> New Sale -> (Select Customer) -> Select Products -> Summary
 *             -> Select Customer (when none picked yet) -> Payment
 *             -> Confirmation -> Invoice (shared billing wizard)
 *   Sales hub / Market Day -> Sales History -> Sale Detail -> Invoice (detail)
 *   Sales hub -> Channel Sales (B2B / HORECA)
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { BillingFlow, type BillingRouteParams } from '../billing-invoices';
import { ChannelSalesScreen } from './ChannelSalesScreen';
import { MarketDaySalesScreen } from './MarketDaySalesScreen';
import { NewSaleScreen } from './NewSaleScreen';
import { PaymentScreen } from './PaymentScreen';
import { SaleConfirmationScreen } from './SaleConfirmationScreen';
import { SaleDetailScreen } from './SaleDetailScreen';
import { SaleSummaryScreen } from './SaleSummaryScreen';
import { SalesHistoryScreen } from './SalesHistoryScreen';
import { SalesScreen } from './SalesScreen';
import { SALE_WAREHOUSES } from './SalesParts';
import { SelectCustomerScreen } from './SelectCustomerScreen';
import { SelectProductsScreen } from './SelectProductsScreen';
import type {
  PermissionCheck,
  SaleCustomer,
  SalePaymentMethod,
  SaleProduct,
  SalesRoute,
  SalesRouteParams,
  WarehouseScope,
  WarehouseTab,
} from './types';

interface SalesStackEntry {
  screen: SalesRoute;
  params?: SalesRouteParams | undefined;
  /** Select Customer opened from New Sale only picks; from Summary it continues to Payment. */
  pickOnly?: boolean | undefined;
  invoice?: { mode: 'wizard' | 'detail'; params: BillingRouteParams } | undefined;
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

  // The sale being built. A Main admin picks the warehouse on New Sale; a Sub
  // admin's sale is always its own warehouse.
  const [saleWarehouseId, setSaleWarehouseId] = useState<string | undefined>(
    scope.warehouseId ?? SALE_WAREHOUSES[0]?.warehouseId,
  );
  const [cart, setCart] = useState<SaleProduct[]>([]);
  const [customer, setCustomer] = useState<SaleCustomer | null>(null);
  const [total, setTotal] = useState(320);
  const [itemsCount, setItemsCount] = useState(2);
  const [method, setMethod] = useState<SalePaymentMethod>('Cash');

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Keyed on the param values, not the object, so a host that
  // builds the params inline (Sub shell customer "New Sale") does not reset it.
  const presetKey = `${initialParams?.customerName ?? ''}|${initialParams?.customerCode ?? ''}|${initialParams?.sale?.id ?? ''}|${initialParams?.channel ?? ''}`;
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const saleWarehouse = useMemo<WarehouseScope>(
    () =>
      scope.warehouseId !== undefined
        ? scope
        : SALE_WAREHOUSES.find((w) => w.warehouseId === saleWarehouseId) ?? scope,
    [scope, saleWarehouseId],
  );

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: SalesRouteParams = current.params ?? {};
  const presetCustomer = initialParams?.customerName;

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
  const startNewSale = () => {
    setCart([]);
    setCustomer(null);
    // Back from a fresh sale returns to the hub (or the host), not to the finished one.
    setStack((prev) => [...prev.filter((e) => e.screen === 'Sales').slice(0, 1), { screen: 'NewSale' }]);
  };

  const common = { scope, can, onBack: back, onTabChange };
  const customerLabel = customer ? `${customer.name} (${customer.code})` : presetCustomer;

  switch (current.screen) {
    case 'Sales':
      return (
        <SalesScreen
          {...common}
          onNavigateToNotifications={onNavigateToNotifications}
          onNavigateToNewSale={startNewSale}
          onNavigateToSalesHistory={() => navigate('SalesHistory')}
          onNavigateToMarketDaySales={() => navigate('MarketDaySales')}
          onNavigateToChannelSales={(channel) => navigate('ChannelSales', { channel })}
          onNavigateToNeedsAttention={onNavigateToNeedsAttention}
          onNavigateToSaleDetail={() => navigate('SaleDetail')}
        />
      );
    case 'NewSale':
      return (
        <NewSaleScreen
          {...common}
          customerLabel={customerLabel}
          saleWarehouseId={saleWarehouseId}
          onSelectWarehouse={(id) => {
            setSaleWarehouseId(id);
            setCart([]);
          }}
          cartItems={cart}
          onSelectCustomer={() => push({ screen: 'SelectCustomer', pickOnly: true })}
          onSelectProducts={() => navigate('SelectProducts')}
        />
      );
    case 'SelectProducts':
      return (
        <SelectProductsScreen
          {...common}
          saleWarehouseId={saleWarehouse.warehouseId}
          onContinue={(items) => {
            setCart(items);
            navigate('SaleSummary');
          }}
        />
      );
    case 'SaleSummary':
      return (
        <SaleSummaryScreen
          {...common}
          items={cart}
          onContinueToCustomer={(nextTotal, count) => {
            setTotal(nextTotal);
            setItemsCount(count);
            // Customer already picked on New Sale: straight to payment.
            navigate(customer ? 'Payment' : 'SelectCustomer');
          }}
        />
      );
    case 'SelectCustomer':
      return (
        <SelectCustomerScreen
          {...common}
          continueLabel={current.pickOnly ? 'Use Customer' : undefined}
          onContinueToPayment={(picked) => {
            setCustomer(picked);
            if (current.pickOnly) back();
            else navigate('Payment');
          }}
        />
      );
    case 'Payment':
      return (
        <PaymentScreen
          {...common}
          amountDue={total}
          walletBalance={customer?.walletBalance}
          onPaymentConfirmed={(paid) => {
            setMethod(paid);
            navigate('SaleConfirmation');
          }}
        />
      );
    case 'SaleConfirmation':
      return (
        <SaleConfirmationScreen
          {...common}
          customerName={customer?.name ?? presetCustomer ?? 'Walk-in Customer'}
          customerCode={customer?.code ?? initialParams?.customerCode ?? 'CUS-WALKIN'}
          paymentMethod={method}
          totalAmount={total}
          itemsCount={itemsCount}
          saleWarehouse={saleWarehouse}
          onViewInvoice={() =>
            push({
              screen: 'Invoice',
              // Post-sale entry: the invoice wizard opens on its Review step (W4).
              invoice: {
                mode: 'wizard',
                params: {
                  review: {
                    invoiceType: 'Direct Sale',
                    customerName: customer?.name ?? presetCustomer ?? 'Walk-in Customer',
                    itemsCount,
                    subtotal: `₹${total}`,
                    gst: '₹0',
                    total: `₹${total}`,
                  },
                },
              },
            })
          }
          onNewSale={startNewSale}
        />
      );
    case 'SalesHistory':
      return <SalesHistoryScreen {...common} onSelectSale={(sale) => navigate('SaleDetail', { sale })} />;
    case 'SaleDetail':
      return (
        <SaleDetailScreen
          {...common}
          sale={params.sale}
          onViewInvoice={() =>
            push({
              screen: 'Invoice',
              invoice: { mode: 'detail', params: { invoiceId: params.sale?.invoiceNo ?? 'INV-00251' } },
            })
          }
        />
      );
    case 'MarketDaySales':
      return (
        <MarketDaySalesScreen
          {...common}
          onNavigateToNewMarketSale={startNewSale}
          onNavigateToSalesHistory={() => navigate('SalesHistory')}
          onSelectTransaction={(sale) => navigate('SaleDetail', { sale })}
        />
      );
    case 'ChannelSales':
      return <ChannelSalesScreen {...common} channel={params.channel ?? 'B2B'} />;
    case 'Invoice':
      return (
        <BillingFlow
          scope={scope}
          can={can}
          initialScreen={current.invoice?.mode === 'detail' ? 'InvoiceDetail' : 'InvoiceWizard'}
          initialParams={current.invoice?.params}
          onBack={back}
          onTabChange={onTabChange}
        />
      );
    default:
      return null;
  }
}
