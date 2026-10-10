/**
 * In-module navigator for the warehouse Home-tab screens the shells used to
 * stitch together with show* flags (Sub) or sub-view keys (Main).
 *
 *   Quick Actions (Main)      -> host targets (transfers, receiving, SWA, ...)
 *   Stock & Transfer (Main)   -> host targets (initiate, transfers, low stock)
 *   Needs Attention (shared)  sales & order resolution queue, scope-filtered
 *   Warehouse Snapshot (shared, one warehouse) -> host targets (inventory, receiving, orders, operations)
 *   Task / Action Center (shared) -> Task Details, or host 'OrderDetail' for an order task
 *   (tasks have no rbac code: ungated, scope-locked; SPEC_GAPS W4z-3)
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
import { TASKS } from './fixtures';
import type {
  HomeRoute,
  HomeRouteParams,
  HomeTarget,
  PermissionCheck,
  TaskRecord,
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
  /** Task list (mock); defaults to the seeded TASKS. */
  tasks?: readonly TaskRecord[] | undefined;
}

export function HomeFlow({
  scope,
  can,
  initialScreen,
  initialParams,
  onBack,
  onOpenTarget,
  onTabChange,
  tasks: initialTasks = TASKS,
}: HomeFlowProps) {
  const [stack, setStack] = useState<HomeStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  // Mock task list owned by the flow so Mark as In Progress shows up in the list.
  const [tasks, setTasks] = useState<readonly TaskRecord[]>(initialTasks);

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
  /** A task opens its detail, or the order it is about in the host's order detail. */
  const openTask = (task: TaskRecord) => {
    if (task.opens === 'OrderDetail') onOpenTarget?.('OrderDetail', task.referenceId);
    else navigate('TaskDetail', { id: task.id });
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
      return <TaskActionCenterScreen scope={scope} can={can} onBack={back} tasks={tasks} onOpenTask={openTask} />;
    case 'TaskDetail':
      return (
        <TaskDetailScreen
          scope={scope}
          can={can}
          onBack={back}
          task={tasks.find((t) => t.id === current.params?.id)}
          onMarkInProgress={(id) =>
            setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'In Progress' } : t)))
          }
        />
      );
    default:
      return null;
  }
}
