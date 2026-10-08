import { api } from '../../../shell/api/client';

/** Mirrors `NotificationCategory` in docs/openapi.yaml (BR-48). */
export type NotificationCategory = 'WEATHER' | 'FARM' | 'MARKETING' | 'PAYROLL' | 'COMMUNITY';

export interface NotificationPreference {
  category: NotificationCategory;
  enabled: boolean;
}

/**
 * The caller's five category toggles, always all five (a category never
 * changed is reported enabled).
 * x-permission: notification.own.view
 */
export async function getMyNotificationPreferences(
  signal?: AbortSignal,
): Promise<NotificationPreference[]> {
  const { items } = await api.get<{ items: NotificationPreference[] }>(
    '/notification-preferences',
    signal,
  );
  return items;
}

/**
 * Turn one category on or off for the caller.
 * x-permission: notification.own.view
 */
export async function updateNotificationPreference(
  category: NotificationCategory,
  enabled: boolean,
): Promise<NotificationPreference> {
  return api.patch<NotificationPreference>(`/notification-preferences/${category}`, { enabled });
}
