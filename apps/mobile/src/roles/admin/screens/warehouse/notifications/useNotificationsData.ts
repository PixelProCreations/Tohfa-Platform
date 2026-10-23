/**
 * Live data for the notifications area: the admin's own notifications, the
 * unread count for the shells' bell, the system messages visible to them and
 * the warehouse alerts, with the read / dismiss writes. Thin wrappers over the admin hooks (../../../api/hooks.ts);
 * every decision lives in ./mappers.ts or the API modules, which are tested.
 *
 * Keys: notifications are the signed-in user's own, not a warehouse's, so they
 * use the 'all' warehouse slot of adminKeys.scoped; the query cache is
 * per session (SessionQueryProvider), so one admin's rows never reach the next.
 * Alerts are keyed by the Sub warehouse (BR-30).
 */
import { useCallback } from 'react';
import { dismissAlert, listAlerts, type AlertItemDto, type AlertListState } from '../../../api/alerts';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import {
  listNotifications,
  listSystemMessages,
  markAllNotificationsRead,
  markNotificationRead,
  markSystemMessageRead,
  type NotificationDto,
  type SystemMessageDto,
} from '../../../api/notifications';
import { adminKeys } from '../../../api/queryKeys';
import { toApprovalAlertItem, toNotificationItem, toSystemMessageRow } from './mappers';
import type { ApprovalAlertItem, NotificationItem, SystemMessageRow, WarehouseScope } from './types';

const NOTIFICATIONS = 'notifications';
const ALERTS = 'alerts';
const SYSTEM_MESSAGES = 'systemMessages';

/** The own notifications list; `unreadOnly` is the server filter behind the Unread tab. */
export function useNotificationList(unreadOnly: boolean): CursorList<NotificationItem> {
  // The clock is read when a page is mapped, so times are fresh after every fetch.
  const map = useCallback((dto: NotificationDto) => toNotificationItem(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(NOTIFICATIONS, undefined, { list: unreadOnly ? 'unread' : 'all' }),
    (cursor, signal) => listNotifications({ cursor, unreadOnly }, signal),
    map,
  );
}

/** The server's unread total for the bell badge (0 until it loads or when it fails). */
export function useUnreadNotificationCount(): number {
  const query = useAdminQuery(adminKeys.scoped(NOTIFICATIONS, undefined, { count: 'unread' }), (signal) =>
    listNotifications({ limit: 1, unreadOnly: true }, signal),
  );
  return query.data?.unreadCount ?? 0;
}

/** Mark one own notification read (BR-65); every notifications query refetches after. */
export function useMarkNotificationRead() {
  return useAdminMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    invalidates: [adminKeys.module(NOTIFICATIONS)],
  });
}

/** Mark all own notifications read (BR-65). */
export function useMarkAllNotificationsRead() {
  return useAdminMutation({
    mutationFn: () => markAllNotificationsRead(),
    invalidates: [adminKeys.module(NOTIFICATIONS)],
  });
}

/**
 * The system messages visible to the viewer (GET /system-messages, BR-65),
 * newest first, cursor paged. The server picks what is visible from the access
 * token (scope, role, warehouses), so nothing is sent but the cursor.
 */
export function useSystemMessageList(): CursorList<SystemMessageRow> {
  const map = useCallback((dto: SystemMessageDto) => toSystemMessageRow(dto), []);
  return useCursorList(
    adminKeys.scoped(SYSTEM_MESSAGES, undefined, { list: 'all' }),
    (cursor, signal) => listSystemMessages({ cursor }, signal),
    map,
  );
}

/**
 * Mark one visible system message read for this user (BR-65: per user, the
 * first readAt kept on a replay). Like the notification reads it moves no
 * money and is a server no-op on replay, so no Idempotency-Key is sent.
 */
export function useMarkSystemMessageRead() {
  return useAdminMutation({
    mutationFn: (id: string) => markSystemMessageRead(id),
    invalidates: [adminKeys.module(SYSTEM_MESSAGES)],
  });
}

/**
 * The live alerts in the viewer's scope: a Sub scope sends its own warehouse,
 * the Main view (no warehouseId) sends none and the server lists every
 * warehouse it may see.
 */
export function useAlertList(scope: WarehouseScope, state: AlertListState): CursorList<ApprovalAlertItem> {
  const warehouseId = scope.warehouseId;
  const map = useCallback((dto: AlertItemDto) => toApprovalAlertItem(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(ALERTS, warehouseId, { state }),
    (cursor, signal) => listAlerts({ warehouseId, state, cursor }, signal),
    map,
  );
}

/** Dismiss one alert in the viewer's own list (BR-78). */
export function useDismissAlert() {
  return useAdminMutation({
    mutationFn: (itemKey: string) => dismissAlert(itemKey),
    invalidates: [adminKeys.module(ALERTS)],
  });
}
