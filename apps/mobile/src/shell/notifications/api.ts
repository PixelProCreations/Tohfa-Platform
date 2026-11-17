/**
 * Notification + device-token endpoints, for every role. Moved here from
 * roles/farmer/api/notifications.ts (which re-exports these, pinning
 * `app: 'farmer-mobile'`), so customer code can use them without crossing the
 * role import boundary.
 */
import { Platform } from 'react-native';
import { api } from '../api/client';

/** `app` enum of POST /notifications/device-tokens. */
export type PushApp = 'farmer-mobile' | 'customer-mobile' | 'admin-web';
export type PushLocale = 'en' | 'ta';

export interface NotificationItem {
  id: string;
  channel: 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';
  title: string | null;
  body: string;
  locale: 'en' | 'ta';
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface ListNotificationsParams {
  cursor?: string;
  limit?: number;
  unreadOnly?: boolean;
}

export interface ListNotificationsResponse {
  items: NotificationItem[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  unreadCount: number;
}

/**
 * Fetch the authenticated user's notifications.
 * x-permission: notification.own.view
 */
export async function listNotifications(
  params?: ListNotificationsParams,
  signal?: AbortSignal,
): Promise<ListNotificationsResponse> {
  const queryParts: string[] = [];
  if (params?.limit) queryParts.push(`limit=${params.limit}`);
  if (params?.cursor) queryParts.push(`cursor=${encodeURIComponent(params.cursor)}`);
  if (params?.unreadOnly !== undefined) queryParts.push(`unreadOnly=${params.unreadOnly}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const path = `/notifications${queryString}`;
  return signal === undefined ? api.get<ListNotificationsResponse>(path) : api.get<ListNotificationsResponse>(path, signal);
}

/**
 * Mark a single notification as read.
 * x-permission: notification.own.mark_read
 */
export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  return api.post<NotificationItem>(`/notifications/${encodeURIComponent(id)}/read`, {});
}

/** Mark every own notification read. */
export async function markAllNotificationsAsRead(): Promise<unknown> {
  return api.post<unknown>('/notifications/read-all', {});
}

export interface DeviceTokenRecord {
  id: string;
  token: string;
  platform?: string;
  app?: string;
  locale?: string;
  revoked?: boolean;
  lastSeen?: string;
}

/**
 * Register a device push token (FCM/APNs) for the signed-in user.
 * `POST /v1/notifications/device-tokens` `{token, platform, app, locale}`.
 */
export async function registerDeviceToken(input: {
  token: string;
  app: PushApp;
  locale?: PushLocale | undefined;
}): Promise<DeviceTokenRecord> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return api.post<DeviceTokenRecord>('/notifications/device-tokens', {
    token: input.token,
    platform,
    app: input.app,
    locale: input.locale ?? 'en',
  });
}

/** Revoke a device push token (on logout). `DELETE /v1/notifications/device-tokens/{token}`. */
export async function revokeDeviceToken(token: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/notifications/device-tokens/${encodeURIComponent(token)}`);
}
