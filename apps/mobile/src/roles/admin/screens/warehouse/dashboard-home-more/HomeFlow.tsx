/**
 * In-module navigator for the warehouse Home-tab screens the shells used to
 * stitch together with show* flags (Sub) or sub-view keys (Main).
 *
 *   Quick Actions (Main)      -> host targets (transfers, receiving, SWA, ...)
 *   Stock & Transfer (Main)   -> host targets (initiate, transfers, low stock)
 *
 * Screens of other modules are not re-implemented: the host opens them through
 * `onOpenTarget`, so their own gates apply. navigate() refuses a route without
 * its code and each screen renders a not-available note if opened directly.
 */
import React, { useEffect, useState } from 'react';

import { HOME_CODES } from './HomeParts';
import { QuickActionsOverviewScreen } from './QuickActionsOverviewScreen';
import { StockAndTransferOverviewScreen } from './StockAndTransferOverviewScreen';
import type { HomeRoute, HomeRouteParams, HomeTarget, PermissionCheck, WarehouseScope, WarehouseTab } from './types';

interface HomeStackEntry {
  screen: HomeRoute;
  params?: HomeRouteParams | undefined;
}

const ROUTE_CODE: Partial<Record<HomeRoute, string>> = {
  QuickActions: HOME_CODES.allView,
  StockAndTransfer: HOME_CODES.allView,
};

/** True when `can` allows opening `route`. */
export function canOpenHomeRoute(route: HomeRoute, can: PermissionCheck): boolean {
  const code = ROUTE_CODE[route];
  return code === undefined || can(code);
}

export interface HomeFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen: HomeRoute;
  initialParams?: HomeRouteParams | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  /** Host screens the flow does not own. */
  onOpenTarget?: ((target: HomeTarget) => void) | undefined;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
}

export function HomeFlow({ scope, can, initialScreen, initialParams, onBack, onOpenTarget, onTabChange }: HomeFlowProps) {
  const [stack, setStack] = useState<HomeStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);

  // A host that re-targets the open module restarts the stack (keyed on the value).
  const presetKey = initialParams?.id ?? '';
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };

  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };
  /** Handler for a host target, or undefined when the host does not offer targets. */
  const target = (t: HomeTarget) => (onOpenTarget !== undefined ? () => onOpenTarget(t) : undefined);

  switch (current.screen) {
    case 'QuickActions':
      return (
        <QuickActionsOverviewScreen
          scope={scope}
          can={can}
          onBack={back}
          onTabChange={onTabChange}
          onTransferStock={target('TransferList')}
          onReviewReceiving={target('ReceivingDashboard')}
          onWarehouseOverview={target('WarehouseOverview')}
          onViewInventory={target('Inventory')}
          onCreateSwa={target('CreateSwa')}
          onViewReports={target('Reports')}
          onWarehouseTargets={target('WarehouseTargets')}
          onReviewEscalations={target('Escalations')}
        />
      );
    case 'StockAndTransfer':
      return (
        <StockAndTransferOverviewScreen
          scope={scope}
          can={can}
          onBack={back}
          onTabChange={onTabChange}
          onInitiateTransfer={target('InitiateTransfer')}
          onViewConsolidatedStock={target('WarehouseOverview')}
          onViewLowStock={target('LowStock')}
          onViewTransfers={target('TransferList')}
        />
      );
    default:
      return null;
  }
}
