/**
 * In-module navigator for the billing & invoice screens (design module M9).
 *
 * The invoice flows (hub -> list -> filters / detail, and generate -> wizard
 * -> generated -> detail) used to be stitched three times: fourteen `show*`
 * state branches in the Sub shell, twelve App.tsx route keys, and seven
 * `whSubView` values in the Main shell. They live next to the screens now and
 * take `scope` + `can`, so both shells render the same flow: the Sub shell /
 * App.tsx with the Sub warehouse scope, the Main shell with
 * MAIN_WAREHOUSE_SCOPE (all warehouses).
 *
 * Route keys are the old App.tsx keys without the 'SubWarehouse' prefix
 * (BillingRoute). Removed with their folded screens: InvoiceHistory (-> list
 * layout 'history'), InvoiceHistoryFilters (-> InvoiceFilters),
 * InvoiceHistoryDetail and InvoicePreview (-> InvoiceDetail), ReviewInvoice
 * (-> InvoiceWizard with `review`), and the dropped GSTInvoice.
 */
import React, { useEffect, useState } from 'react';

import { BillingHubScreen } from './BillingHubScreen';
import { BILLING_WAREHOUSES, SAMPLE_GENERATED_INVOICE_ID, SAMPLE_WIZARD_TRANSACTION } from './fixtures';
import { GenerateInvoiceScreen } from './GenerateInvoiceScreen';
import { InvoiceDetailScreen } from './InvoiceDetailScreen';
import { InvoiceFiltersScreen } from './InvoiceFiltersScreen';
import { InvoiceGeneratedScreen } from './InvoiceGeneratedScreen';
import { InvoiceListScreen } from './InvoiceListScreen';
import { InvoiceWizardScreen } from './InvoiceWizardScreen';
import type {
  BillingRoute,
  BillingRouteParams,
  InvoiceFilterState,
  InvoiceListLayout,
  PermissionCheck,
  WarehouseScope,
  WarehouseTab,
  WizardTransactionRecord,
} from './types';

/** One entry of the flow's back stack. */
export interface BillingStackEntry {
  screen: BillingRoute;
  params?: BillingRouteParams | undefined;
}

export interface BillingFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: BillingRoute | undefined;
  initialParams?: BillingRouteParams | undefined;
  /** Leave the billing module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

export function BillingFlow({
  scope,
  can,
  initialScreen = 'BillingHub',
  initialParams,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  warehouseOptions = BILLING_WAREHOUSES,
}: BillingFlowProps) {
  const [stack, setStack] = useState<BillingStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  // List filters and layout survive the trip to the filters screen and back.
  const [filters, setFilters] = useState<InvoiceFilterState | undefined>(undefined);
  const [listLayout, setListLayout] = useState<InvoiceListLayout | undefined>(undefined);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Hosts keep these props referentially stable.
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: BillingRouteParams = current.params ?? {};

  const navigate = (screen: BillingRoute, nextParams?: BillingRouteParams) => {
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  /** Replace the top entry (wizard -> generated: back from success must not re-open the wizard). */
  const replace = (screen: BillingRoute, nextParams?: BillingRouteParams) => {
    setStack((prev) => [...prev.slice(0, -1), { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };

  const openList = (layout: InvoiceListLayout) => {
    setListLayout(layout);
    navigate('InvoiceList', { layout });
  };
  const openDetail = (invoiceId: string) => navigate('InvoiceDetail', { invoiceId });
  const openWizard = (transaction: WizardTransactionRecord) => navigate('InvoiceWizard', { transaction });

  const common = { scope, can, onBack: back, onTabChange };

  switch (current.screen) {
    case 'BillingHub':
      return (
        <BillingHubScreen
          {...common}
          warehouseOptions={warehouseOptions}
          onNavigateToInvoiceList={() => openList('list')}
          onNavigateToInvoiceHistory={() => openList('history')}
          onNavigateToInvoiceDetail={openDetail}
          onGenerateInvoice={(transaction) =>
            transaction ? openWizard(transaction) : navigate('GenerateInvoice')
          }
          onNavigateToNotifications={onNavigateToNotifications}
        />
      );
    case 'InvoiceList':
      return (
        <InvoiceListScreen
          {...common}
          initialLayout={listLayout ?? params.layout}
          onLayoutChange={setListLayout}
          warehouseOptions={warehouseOptions}
          appliedFilters={filters}
          onOpenFilters={() => navigate('InvoiceFilters')}
          onNavigateToInvoiceDetail={openDetail}
        />
      );
    case 'InvoiceFilters':
      return (
        <InvoiceFiltersScreen
          {...common}
          warehouseOptions={warehouseOptions}
          initialFilters={filters}
          onApplyFilters={(next) => {
            setFilters(next);
            back();
          }}
        />
      );
    case 'InvoiceDetail':
      return <InvoiceDetailScreen {...common} invoiceId={params.invoiceId ?? SAMPLE_GENERATED_INVOICE_ID} />;
    case 'GenerateInvoice':
      return (
        <GenerateInvoiceScreen
          {...common}
          onSelectTransaction={(tx) =>
            openWizard({
              id: tx.id,
              orderNumber: tx.id,
              customerName: tx.customerName,
              amount: tx.amount,
              saleType: tx.saleType,
              status: tx.status,
              date: SAMPLE_WIZARD_TRANSACTION.date,
            })
          }
        />
      );
    case 'InvoiceWizard':
      return (
        <InvoiceWizardScreen
          {...common}
          transaction={params.transaction ?? SAMPLE_WIZARD_TRANSACTION}
          review={params.review}
          onSuccess={(invoiceId) => replace('InvoiceGenerated', { invoiceId })}
        />
      );
    case 'InvoiceGenerated':
      return (
        <InvoiceGeneratedScreen
          {...common}
          invoiceId={params.invoiceId ?? SAMPLE_GENERATED_INVOICE_ID}
          onViewInvoice={openDetail}
        />
      );
    default:
      return null;
  }
}
