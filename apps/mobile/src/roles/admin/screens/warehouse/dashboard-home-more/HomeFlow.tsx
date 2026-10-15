/**
 * In-module navigator for the warehouse Home-tab screens the shells used to
 * stitch together with show* flags (Sub) or sub-view keys (Main).
 *
 *   Quick Actions (Main)      -> host targets (transfers, receiving, SWA, ...)
 *   Stock & Transfer (Main)   -> host targets (initiate, transfers, low stock)
 *   Needs Attention (shared)  live alerts (GET /admin/alerts) with dismiss / snooze, scope-filtered
 *   Warehouse Snapshot (shared, one warehouse) -> host targets (inventory, receiving, orders, operations)
 *   Task / Action Center (shared) -> Task Details (GET /admin/tasks, mark done); Task Details
 *   opens the order ('OrderDetail', order uuid) or receiving the task is about
 *   (task.own.view / alert.own.view are checked by the server, BR-77/78)
 *
 * Screens of other modules are not re-implemented: the host opens them through
 * `onOpenTarget`, so their own gates apply. navigate() refuses a route without
 * its code and each screen renders a not-available note if opened directly.
 */
import React, { useEffect, useState } from 'react';
import { useFlowBack } from '../useFlowBack';

import { HOME_CODES } from './HomeParts';
import { NeedsAttentionScreen } from './NeedsAttentionScreen';
import { QuickActionsOverviewScreen } from './QuickActionsOverviewScreen';
import { StockAndTransferOverviewScreen } from './StockAndTransferOverviewScreen';
import { TaskActionCenterScreen } from './TaskActionCenterScreen';
import { TaskDetailScreen } from './TaskDetailScreen';
import { WarehouseSnapshotScreen } from './WarehouseSnapshotScreen';
import type { TaskRow } from './mappers_dashboardHome';
import type {
  HomeRoute,
  HomeRouteParams,
  HomeTarget,
  PermissionCheck,
  WarehouseScope,
  WarehouseTab,
} from './types';

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
  /** Host screens the flow does not own; `ref` is the record to open (an order id for 'OrderDetail'). */
  onOpenTarget?: ((target: HomeTarget, ref?: string) => void) | undefined;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
}

export function HomeFlow({
  scope,
  can,
  initialScreen,
  initialParams,
  onBack,
  onOpenTarget,
  onTabChange,
}: HomeFlowProps) {
  const [stack, setStack] = useState<HomeStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  // The row the list opened, so the detail needs no second fetch (there is no GET for one task).
  const [openedTask, setOpenedTask] = useState<TaskRow | undefined>(undefined);

  // A host that re-targets the open module restarts the stack (keyed on the value).
  const presetKey = `${initialParams?.id ?? ''}|${initialParams?.category ?? ''}`;
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // initialParams is read through presetKey on purpose (see above).
  }, [initialScreen, presetKey]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };

  const navigate = (screen: HomeRoute, nextParams?: HomeRouteParams) => {
    if (!canOpenHomeRoute(screen, can)) return;
    setStack((prev) => [...prev, { screen, params: nextParams }]);
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
  /** A task opens its detail. */
  const openTask = (task: TaskRow) => {
    setOpenedTask(task);
    navigate('TaskDetail', { id: task.itemKey });
  };
  /** The record a task is about, in the host: an order by uuid, or the receiving screens. */
  const openTaskRecord = (task: TaskRow) => {
    if (task.destination.module === 'orders') onOpenTarget?.('OrderDetail', task.refId);
    else if (task.destination.module === 'receiving') onOpenTarget?.('ReceivingDashboard', task.refId);
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
    case 'NeedsAttention':
      return (
        <NeedsAttentionScreen
          key={current.params?.category ?? 'all'}
          scope={scope}
          can={can}
          onBack={back}
          onTabChange={onTabChange}
          initialCategory={current.params?.category}
        />
      );
    case 'WarehouseSnapshot':
      return (
        <WarehouseSnapshotScreen
          scope={scope}
          can={can}
          onBack={back}
          onTabChange={onTabChange}
          onNavigateToInventory={target('Inventory')}
          onNavigateToReceiving={target('ReceivingDashboard')}
          onNavigateToOrders={target('Orders')}
          onNavigateToOperations={target('Operations')}
        />
      );
    case 'TaskActionCenter':
      return <TaskActionCenterScreen scope={scope} can={can} onBack={back} onOpenTask={openTask} />;
    case 'TaskDetail': {
      const id = current.params?.id;
      return (
        <TaskDetailScreen
          scope={scope}
          can={can}
          onBack={back}
          task={openedTask !== undefined && openedTask.itemKey === id ? openedTask : undefined}
          itemKey={id}
          onOpenRecord={onOpenTarget !== undefined ? openTaskRecord : undefined}
        />
      );
    }
    default:
      return null;
  }
}
