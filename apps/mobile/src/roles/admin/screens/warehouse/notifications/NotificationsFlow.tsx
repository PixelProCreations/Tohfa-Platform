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
 * target's own code passes.
 *
 * Data is live and owned here, not by the hosts: the list is GET /notifications
 * (All / Unread, server-filtered), the reads are real writes that refetch every
 * notifications query (including the hosts' bell count, which reads
 * useUnreadNotificationCount), and the alerts are GET /admin/alerts with a real
 * dismiss. Each route's container fetches only its own data. Clear-all and
 * snooze have no control: there is no clear endpoint, and the spec gives no
 * snooze length (only a server maximum), so the app cannot pick one.
 */
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { adminErrorKey } from '../../../api/errors';
import { t } from '../../../i18n';
import { useFlowBack } from '../useFlowBack';

import { ApprovalAlertsScreen, type AlertStateFilter } from './ApprovalAlertsScreen';
import { NotificationDetailScreen } from './NotificationDetailScreen';
import { NOTIFICATION_CODES, liveFilterOf, type LiveNotificationFilter } from './NotificationParts';
import { NotificationsScreen } from './NotificationsScreen';
import {
  useAlertList,
  useDismissAlert,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
} from './useNotificationsData';
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
  onBack,
  onTabChange,
  onOpenTarget,
  onOpenAlertRecord,
}: NotificationsFlowProps) {
  const [stack, setStack] = useState<NotificationsStackEntry[]>(() => [{ screen: initialScreen, params: initialParams }]);
  // Kept here, not in the list screen, so the tab survives a visit to the detail.
  const [filter, setFilter] = useState<LiveNotificationFilter>(() => liveFilterOf(initialParams?.filter));
  const [alertState, setAlertState] = useState<AlertStateFilter>('active');

  // A host that re-targets the open module restarts the stack, as the other
  // area flows do. Params are compared by value (hosts build them inline).
  const paramsKey = JSON.stringify(initialParams ?? null);
  useEffect(() => {
    setStack([{ screen: initialScreen, params: initialParams }]);
    setFilter(liveFilterOf(initialParams?.filter));
    // paramsKey stands in for initialParams (compared by value, see above).
  }, [initialScreen, paramsKey]);

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
  // Always handled: at the root back() hands over to the host through onBack.
  useFlowBack(() => {
    back();
    return true;
  });

  const common = { scope, can, onBack: back, onTabChange };

  switch (current.screen) {
    case 'Notifications':
      return (
        <LiveNotificationsRoute
          {...common}
          filter={filter}
          onFilterChange={setFilter}
          onSelectNotification={(item) => navigate('NotificationDetail', { notification: item })}
          onOpenTarget={onOpenTarget}
        />
      );
    case 'NotificationDetail':
      return <NotificationDetailScreen {...common} notification={params.notification} onOpenTarget={onOpenTarget} />;
    case 'ApprovalAlerts':
      return (
        <LiveAlertsRoute
          {...common}
          state={alertState}
          onStateChange={setAlertState}
          onOpenRecord={onOpenAlertRecord}
        />
      );
    default:
      return null;
  }
}

interface RouteCommon {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
}

function showWriteError(titleKey: 'notifications.actionFailed.title' | 'alerts.actionFailed.title', err: unknown) {
  Alert.alert(t(titleKey), t(adminErrorKey(err)));
}

/** The list route: GET /notifications for the open tab, plus the read writes (BR-65). */
function LiveNotificationsRoute({
  filter,
  onFilterChange,
  onSelectNotification,
  onOpenTarget,
  ...common
}: RouteCommon & {
  filter: LiveNotificationFilter;
  onFilterChange: (filter: LiveNotificationFilter) => void;
  onSelectNotification: (item: NotificationItem) => void;
  onOpenTarget?: ((target: NotificationTarget, item: NotificationItem) => void) | undefined;
}) {
  const list = useNotificationList(filter === 'Unread');
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  return (
    <NotificationsScreen
      {...common}
      notifications={list.items}
      filter={filter}
      onFilterChange={onFilterChange}
      // A failed single read is not worth an interruption: the row stays
      // unread and the next refresh shows the server's state.
      onMarkAsRead={(id) => markRead.mutate(id)}
      onMarkAllAsRead={() => markAll.mutate(undefined, { onError: (err) => showWriteError('notifications.actionFailed.title', err) })}
      markAllPending={markAll.isPending}
      onSelectNotification={onSelectNotification}
      onOpenTarget={onOpenTarget}
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

/** The alerts route: GET /admin/alerts in the viewer's scope, plus dismiss (BR-78). */
function LiveAlertsRoute({
  state,
  onStateChange,
  onOpenRecord,
  ...common
}: RouteCommon & {
  state: AlertStateFilter;
  onStateChange: (state: AlertStateFilter) => void;
  onOpenRecord?: ((alert: ApprovalAlertItem) => void) | undefined;
}) {
  const list = useAlertList(common.scope, state);
  const dismiss = useDismissAlert();
  // alert.own.view also covers dismiss in one's own list (docs/rbac.json); the
  // server checks it again. Without it there is nothing to dismiss anyway.
  const canDismiss = common.can(NOTIFICATION_CODES.alerts);
  return (
    <ApprovalAlertsScreen
      {...common}
      alerts={list.items}
      state={state}
      onStateChange={onStateChange}
      onOpenRecord={onOpenRecord}
      onDismiss={
        canDismiss
          ? (alert) => dismiss.mutate(alert.id, { onError: (err) => showWriteError('alerts.actionFailed.title', err) })
          : undefined
      }
      dismissingId={dismiss.isPending ? dismiss.variables : undefined}
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
