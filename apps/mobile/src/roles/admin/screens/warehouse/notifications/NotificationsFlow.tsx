/**
 * In-module navigator for the warehouse notifications & alerts screens (design
 * module M13 + M1-S06).
 *
 * The notification navigation (list -> detail -> routed target; list -> system
 * messages -> message history; list -> approval alerts -> record) used to be
 * stitched three times: App.tsx's five route keys, the Sub shell's
 * `showNotifications` / `selectedNotification` / `showSystemMessages` /
 * `showMessageHistory` / `showAlerts` state (two copies of the detail branch),
 * and the Main list drawing its own detail. It lives here now and takes
 * `scope` + `can`, so every host renders the same flow: App.tsx and the Sub
 * shell with the Sub warehouse scope, the Main shell with MAIN_WAREHOUSE_SCOPE.
 *
 * Action targets (Review / Receiving / Stock / Orders / Wallet / Returns) and
 * alert records live outside this module, so they go to the host through
 * `onOpenTarget` / `onOpenAlertRecord`; the screens offer them only when the
 * target's own code passes. The list is controlled when the host passes
 * `notifications` (the shells keep it for their bell badge); otherwise the flow
 * keeps the mock list for the scope itself.
 */
import React, { useEffect, useState } from 'react';
import { BackHandler } from 'react-native';

import { ApprovalAlertsScreen } from './ApprovalAlertsScreen';
import { defaultNotifications, NOTIFICATION_WAREHOUSES } from './fixtures';
import { NotificationDetailScreen } from './NotificationDetailScreen';
import { NotificationsScreen } from './NotificationsScreen';
import type {
  ApprovalAlertItem,
  NotificationItem,
  NotificationsRoute,
  NotificationsRouteParams,
  NotificationTarget,
  PermissionCheck,
  WarehouseScope,
  WarehouseTab,
} from './types';

/** One entry of the flow's back stack. */
export interface NotificationsStackEntry {
  screen: NotificationsRoute;
  params?: NotificationsRouteParams | undefined;
}

export interface NotificationsFlowProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  initialScreen?: NotificationsRoute | undefined;
  initialParams?: NotificationsRouteParams | undefined;
  /** Controlled list (the shells' bell badge reads it). Omit to let the flow keep the mock list. */
  notifications?: readonly NotificationItem[] | undefined;
  onMarkAsRead?: ((id: string) => void) | undefined;
  onMarkAllAsRead?: (() => void) | undefined;
  onClearAll?: (() => void) | undefined;
  /** Alert rows for the approval / exception alerts screen (defaults to the mock queue). */
  alerts?: readonly ApprovalAlertItem[] | undefined;
  /** Warehouses for the Main alerts selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Leave the module (pressed back on its first screen). */
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** Open a notification's action target (Review / Receiving / Stock / Orders / Wallet / Returns). */
  onOpenTarget?: ((target: NotificationTarget, item: NotificationItem) => void) | undefined;
  /** Open an alert's related record (expense, goods receipt, low stock, transfer). */
  onOpenAlertRecord?: ((alert: ApprovalAlertItem) => void) | undefined;
}

export function NotificationsFlow({
  scope,
  can,
  initialScreen = 'Notifications',
  initialParams,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  alerts,
  warehouseOptions = NOTIFICATION_WAREHOUSES,
  onBack,
  onTabChange,
  onOpenTarget,
  onOpenAlertRecord,
}: NotificationsFlowProps) {
  const [stack, setStack] = useState<NotificationsStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  const [localItems, setLocalItems] = useState<readonly NotificationItem[]>(() => defaultNotifications(scope));

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Params are compared by value (hosts build them inline).
  const paramsKey = JSON.stringify(initialParams ?? null);
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    // paramsKey stands in for initialParams (compared by value, see above).
  }, [initialScreen, paramsKey]);

  const controlled = notifications !== undefined;
  const items = notifications ?? localItems;
  const markAsRead = (id: string) => {
    if (controlled) onMarkAsRead?.(id);
    else setLocalItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };
  const markAllAsRead = () => {
    if (controlled) onMarkAllAsRead?.();
    else setLocalItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };
  const clearAll = controlled ? onClearAll : () => setLocalItems([]);

  const current = stack[stack.length - 1] ?? { screen: initialScreen, params: initialParams };
  const params: NotificationsRouteParams = current.params ?? {};

  const navigate = (screen: NotificationsRoute, nextParams?: NotificationsRouteParams) => {
    setStack((prev) => [...prev, { screen, params: nextParams }]);
  };
  const back = () => {
    if (stack.length > 1) setStack((prev) => prev.slice(0, -1));
    else onBack();
  };

  // Hardware back walks the flow's own stack.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  });

  const common = { scope, can, onBack: back, onTabChange };

  switch (current.screen) {
    case 'Notifications':
      return (
        <NotificationsScreen
          {...common}
          notifications={items}
          initialFilter={params.filter}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearAll}
          onSelectNotification={(item) => navigate('NotificationDetail', { notification: item })}
          onOpenTarget={onOpenTarget}
          onOpenAlerts={() => navigate('ApprovalAlerts')}
        />
      );
    case 'NotificationDetail':
      return <NotificationDetailScreen {...common} notification={params.notification} onOpenTarget={onOpenTarget} />;
    case 'ApprovalAlerts':
      return (
        <ApprovalAlertsScreen
          {...common}
          alerts={alerts}
          warehouseOptions={warehouseOptions}
          onOpenRecord={onOpenAlertRecord}
        />
      );
    default:
      return null;
  }
}
