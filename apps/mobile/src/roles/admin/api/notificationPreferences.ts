/**
 * Admin notification settings — docs/openapi.yaml
 * `listAdminNotificationPreferences` (`GET /notification-preferences/admin`)
 * and `updateAdminNotificationPreference`
 * (`PATCH /notification-preferences/admin/{category}`), both
 * `notification.own.admin_preferences` (admin roles only), BR-82.
 *
 * The server always answers all 14 categories in screen order; a category
 * never changed is `enabled: true` (no stored row = enabled). The PATCH is
 * idempotent by nature (it sets a boolean) and the spec declares no
 * `Idempotency-Key`. There is no bulk "reset to default" endpoint.
 *
 * Contradiction 28 (docs/rules.md): no admin event maps to these categories
 * yet, so these are stored preferences the dispatcher does not consult.
 */
import { adminGet, adminPatch } from './http';

/** docs/openapi.yaml `AdminNotificationCategory`, in screen order. */
export const ADMIN_NOTIFICATION_CATEGORIES = [
  'IN_APP_MASTER',
  'GOODS_RECEIVING',
  'INVENTORY_ALERTS',
  'WAREHOUSE_OPERATIONS',
  'TASK_ALERTS',
  'EXCEPTION_ALERTS',
  'ORDER_CONFIRMED',
  'ORDER_DISPATCHED',
  'ORDER_DELIVERED',
  'WALLET_CREDITED',
  'PAYOUT_RELEASED',
  'SYSTEM_MESSAGES',
  'MAINTENANCE_MESSAGES',
  'SECURITY_ALERTS',
] as const;
export type AdminNotificationCategoryDto = (typeof ADMIN_NOTIFICATION_CATEGORIES)[number];

/** Problem codes these endpoints can answer with (docs/openapi.yaml responses). */
export const ERROR_CODES = ['UNAUTHENTICATED', 'FORBIDDEN', 'VALIDATION_FAILED', 'INTERNAL'] as const;

/** docs/openapi.yaml `AdminNotificationPreference`. */
export interface AdminNotificationPreferenceDto {
  category: AdminNotificationCategoryDto;
  enabled: boolean;
}

export interface AdminNotificationPreferenceList {
  items: AdminNotificationPreferenceDto[];
}

export function listAdminNotificationPreferences(
  signal?: AbortSignal,
): Promise<AdminNotificationPreferenceList> {
  return adminGet<AdminNotificationPreferenceList>('/notification-preferences/admin', { signal });
}

export function setAdminNotificationPreference(
  category: AdminNotificationCategoryDto,
  enabled: boolean,
): Promise<AdminNotificationPreferenceDto> {
  return adminPatch<AdminNotificationPreferenceDto>(
    `/notification-preferences/admin/${encodeURIComponent(category)}`,
    { enabled },
  );
}
