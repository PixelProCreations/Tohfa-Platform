import { api } from '../../../shell/api/client';
import { Platform } from 'react-native';

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
): Promise<ListNotificationsResponse> {
  const queryParts: string[] = [];
  if (params?.limit) queryParts.push(`limit=${params.limit}`);
  if (params?.cursor) queryParts.push(`cursor=${encodeURIComponent(params.cursor)}`);
  if (params?.unreadOnly !== undefined) queryParts.push(`unreadOnly=${params.unreadOnly}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return api.get<ListNotificationsResponse>(`/notifications${queryString}`);
}

/**
 * Mark a single notification as read.
 * x-permission: notification.own.mark_read
 */
export async function markNotificationAsRead(id: string): Promise<NotificationItem> {
  return api.post<NotificationItem>(`/notifications/${id}/read`, {});
}

/**
 * Register device push token (FCM/APNS) for push notifications.
 * x-permission: notification.own.view
 */
export async function registerDevicePushToken(
  token: string,
  locale: 'en' | 'ta' = 'en',
): Promise<{ id: string; token: string }> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return api.post<{ id: string; token: string }>('/notifications/device-tokens', {
    token,
    platform,
    app: 'farmer-mobile',
    locale,
  });
}

/**
 * Revoke device push token on logout.
 * x-permission: notification.own.view
 */
export async function revokeDevicePushToken(token: string): Promise<{ success: boolean }> {
  return api.delete<{ success: boolean }>(`/notifications/device-tokens/${encodeURIComponent(token)}`);
}
