/**
 * Moved to src/shell/notifications/api.ts (shared by every role). Kept as a
 * re-export so farmer screens/tests are unchanged; the two device-token
 * helpers keep their farmer-specific signatures (`app: 'farmer-mobile'`).
 */
import {
  registerDeviceToken,
  revokeDeviceToken,
  type DeviceTokenRecord,
} from '../../../shell/notifications/api';

export {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type NotificationItem,
  type ListNotificationsParams,
  type ListNotificationsResponse,
} from '../../../shell/notifications/api';

/**
 * Register device push token (FCM/APNS) for push notifications.
 * x-permission: notification.own.view
 */
export async function registerDevicePushToken(
  token: string,
  locale: 'en' | 'ta' = 'en',
): Promise<DeviceTokenRecord> {
  return registerDeviceToken({ token, app: 'farmer-mobile', locale });
}

/**
 * Revoke device push token on logout.
 * x-permission: notification.own.view
 */
export async function revokeDevicePushToken(token: string): Promise<{ success: boolean }> {
  return revokeDeviceToken(token);
}
