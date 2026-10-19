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
 *
 * Data is live and owned here (API integration plan, phase 7): each route's
 * container fetches through ./useBillingData.ts and passes the result to the
 * screen. No invoice route takes a warehouse; the server scopes the caller
 * (BR-36, BR-30), and the scope's warehouse only keys the cache. The detail
 * needs the invoice uuid (invoiceIdParam); a host still passing a sample
 * invoice number gets "not found", not a request.
 *
 * Invoice generation has no API (there is no create-invoice route; sales and
 * orders issue invoices). GenerateInvoice, InvoiceWizard and InvoiceGenerated
 * map to the 'invoiceGeneration' area (availability.ts billingRouteArea), which
 * is offered under the owner decision of 2026-10-14 (nothing is hidden for
 * having no API); they show sample data. If the area is ever withdrawn, a host
 * that opens one of them lands on the hub.
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';
import { isAreaAvailable, billingRouteArea } from '../availability';

import { BillingHubScreen } from './BillingHubScreen';
import { GenerateInvoiceScreen } from './GenerateInvoiceScreen';
import { InvoiceDetailScreen } from './InvoiceDetailScreen';
import { InvoiceFiltersScreen } from './InvoiceFiltersScreen';
import { InvoiceGeneratedScreen } from './InvoiceGeneratedScreen';
import { InvoiceListScreen } from './InvoiceListScreen';
import { InvoiceWizardScreen } from './InvoiceWizardScreen';
import { historyTypeFilter, invoiceIdParam } from './mappers';
import type {
  BillingRoute,
  BillingRouteParams,
  InvoiceHistoryChip,
  InvoiceListLayout,
  PermissionCheck,
  WarehouseScope,
  WarehouseScreenBaseProps,
  WarehouseTab,
} from './types';
import { useInvoice, useInvoiceDownload, useInvoiceList } from './useBillingData';

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
  /**
   * Main warehouse choices for the (deep-link only) invoice filters. Omitted =
   * the live GET /warehouses list, fetched by InvoiceFiltersScreen itself.
   */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

/** Where a refused route (invoice generation) lands. */
const HOME_SCREEN: BillingRoute = 'BillingHub';

// ─── Live routes ─────────────────────────────────────────────────────────────

interface LiveHubRouteProps {
  base: WarehouseScreenBaseProps;
  onOpenList: (layout: InvoiceListLayout) => void;
  onOpenDetail: (invoiceId: string) => void;
  onNavigateToNotifications?: (() => void) | undefined;
}

function LiveHubRoute({ base, onOpenList, onOpenDetail, onNavigateToNotifications }: LiveHubRouteProps) {
  const list = useInvoiceList(base.scope.warehouseId, undefined);
  const download = useInvoiceDownload();
  return (
    <BillingHubScreen
      {...base}
      onNavigateToInvoiceList={() => onOpenList('list')}
      onNavigateToInvoiceHistory={() => onOpenList('history')}
      onNavigateToInvoiceDetail={onOpenDetail}
      onNavigateToNotifications={onNavigateToNotifications}
      recent={list.items[0]}
      recentLoading={list.isLoading}
      recentError={list.error}
      onRetryRecent={list.refresh}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      onDownload={download.run}
      isDownloading={download.isPending}
      downloadError={download.error}
    />
  );
}

interface LiveListRouteProps {
  base: WarehouseScreenBaseProps;
  warehouseId: string | undefined;
  layout: InvoiceListLayout;
  onOpenDetail: (invoiceId: string) => void;
}

function LiveListRoute({ base, warehouseId, layout, onOpenDetail }: LiveListRouteProps) {
  const [chip, setChip] = useState<InvoiceHistoryChip>('All');
  // The history chips are the server's type filter; the list layout draws no chips, so it stays 'All'.
  const list = useInvoiceList(warehouseId, historyTypeFilter(chip));
  const download = useInvoiceDownload();
  return (
    <InvoiceListScreen
      {...base}
      initialLayout={layout}
      invoices={list.items}
      historyChip={chip}
      onHistoryChipChange={setChip}
      onNavigateToInvoiceDetail={onOpenDetail}
      onDownload={download.run}
      isDownloading={download.isPending}
      downloadError={download.error}
      isLoading={list.isLoading}
      error={list.error}
      onRetry={list.refresh}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      onLoadMore={list.loadMore}
      hasMore={list.hasMore}
    />
  );
}

export interface LiveInvoiceDetailProps extends WarehouseScreenBaseProps {
  /** An invoice uuid; anything else (a sample invoice number) shows "not found" without a request. */
  invoiceId: string | undefined;
}

/**
 * The live invoice detail, for any host that has an invoice uuid (the flow's
 * InvoiceDetail route; a sale or order screen can render it directly).
 */
export function LiveInvoiceDetail({ invoiceId: requested, ...base }: LiveInvoiceDetailProps) {
  const invoiceId = invoiceIdParam(requested);
  const live = useInvoice(base.scope.warehouseId, invoiceId);
  const download = useInvoiceDownload();
  return (
    <InvoiceDetailScreen
      {...base}
      invoiceId={requested ?? ''}
      invoice={live.invoice}
      notFound={invoiceId === undefined}
      isLoading={live.isLoading}
      error={live.error}
      onRetry={live.refresh}
      onRefresh={live.refresh}
      isRefreshing={live.isRefreshing}
      onDownload={download.run}
      isDownloading={download.isPending}
      downloadError={download.error}
    />
  );
}

// ─── Flow ────────────────────────────────────────────────────────────────────

export function BillingFlow({
  scope,
  can,
  initialScreen = 'BillingHub',
  initialParams,
  onBack,
  onTabChange,
  onNavigateToNotifications,
  warehouseOptions,
}: BillingFlowProps) {
  const [stack, setStack] = useState<BillingStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Hosts keep these props referentially stable.
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
  }, [initialScreen, initialParams]);

  /** False for a route of an area with no API (invoice generation). */
  const isRouteAvailable = (screen: BillingRoute): boolean => {
    const area = billingRouteArea(screen);
    return area === undefined || isAreaAvailable(area, can);
  };

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const screen = isRouteAvailable(current.screen) ? current.screen : HOME_SCREEN;
  const params: BillingRouteParams = current.params ?? {};

  const navigate = (screen: BillingRoute, nextParams?: BillingRouteParams) => {
    if (!isRouteAvailable(screen)) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  /** Replace the top entry (wizard -> generated: back from success must not re-open the wizard). */
  const replace = (screen: BillingRoute, nextParams?: BillingRouteParams) => {
    if (!isRouteAvailable(screen)) return;
    setStack((prev) => [...prev.slice(0, -1), { screen, params: nextParams }]);
  };
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

  const openList = (layout: InvoiceListLayout) => navigate('InvoiceList', { layout });
  const openDetail = (invoiceId: string) => navigate('InvoiceDetail', { invoiceId });

  const common = { scope, can, onBack: back, onTabChange };

  switch (screen) {
    case 'BillingHub':
      return (
        <LiveHubRoute
          base={common}
          onOpenList={openList}
          onOpenDetail={openDetail}
          onNavigateToNotifications={onNavigateToNotifications}
        />
      );
    case 'InvoiceList':
      return (
        <LiveListRoute
          base={common}
          warehouseId={scope.warehouseId}
          layout={params.layout ?? 'list'}
          onOpenDetail={openDetail}
        />
      );
    case 'InvoiceFilters':
      // Deep-link only: nothing on the live list opens it (see InvoiceFiltersScreen).
      return <InvoiceFiltersScreen {...common} warehouseOptions={warehouseOptions} onApplyFilters={() => back()} />;
    case 'InvoiceDetail':
      return <LiveInvoiceDetail {...common} invoiceId={params.invoiceId} />;
    // The three generation routes are refused above (isRouteAvailable); these
    // branches only keep the hidden screens compiled for when an API exists.
    case 'GenerateInvoice':
      return <GenerateInvoiceScreen {...common} onSelectTransaction={() => undefined} />;
    case 'InvoiceWizard':
      return params.transaction ? (
        <InvoiceWizardScreen
          {...common}
          transaction={params.transaction}
          review={params.review}
          onSuccess={(invoiceId) => replace('InvoiceGenerated', { invoiceId })}
        />
      ) : null;
    case 'InvoiceGenerated':
      return <InvoiceGeneratedScreen {...common} invoiceId={params.invoiceId ?? ''} onViewInvoice={openDetail} />;
    default:
      return null;
  }
}
