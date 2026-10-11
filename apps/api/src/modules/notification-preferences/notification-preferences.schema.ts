
import { z } from 'zod';


export const notificationCategories = [
  'WEATHER',
  'FARM',
  'MARKETING',
  'PAYROLL',
  'COMMUNITY',
] as const;
export const notificationCategory = z.enum(notificationCategories);
export type NotificationCategory = z.infer<typeof notificationCategory>;

export const notificationPreferenceResponse = z.object({
  category: notificationCategory,
  enabled: z.boolean(),
});
export type NotificationPreferenceResponse = z.infer<typeof notificationPreferenceResponse>;

export const listPreferencesResponse = z.object({
  items: z.array(notificationPreferenceResponse).length(notificationCategories.length),
});
export type ListPreferencesResponse = z.infer<typeof listPreferencesResponse>;

export const updatePreferenceParam = z
  .object({
    category: notificationCategory,
  })
  .strict();
export type UpdatePreferenceParam = z.infer<typeof updatePreferenceParam>;

export const updatePreferenceBody = z
  .object({
    enabled: z.boolean(),
  })
  .strict();
export type UpdatePreferenceBody = z.infer<typeof updatePreferenceBody>;

/**
 * BR-82: the categories of the ADMIN Notification Settings screen, in screen
 * order: the master in-app switch, then the Operational, Order, Wallet &
 * Payout and System groups. They are a separate list from
 * `notificationCategories` on purpose: that list (and the farmer/customer
 * endpoints built on it) must never change shape, and a farmer or customer
 * must never be offered one of these. The same names are in the CHECK
 * constraint of migration 0055.
 *
 * Same sparse rule as BR-52: no stored row means enabled. Nothing consults
 * these yet when dispatching (no admin domain event maps to a category), so
 * for now they are stored preferences only.
 */
export const adminNotificationCategories = [
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
export const adminNotificationCategory = z.enum(adminNotificationCategories);
export type AdminNotificationCategory = z.infer<typeof adminNotificationCategory>;

export const adminNotificationPreferenceResponse = z.object({
  category: adminNotificationCategory,
  enabled: z.boolean(),
});
export type AdminNotificationPreferenceResponse = z.infer<typeof adminNotificationPreferenceResponse>;

export const listAdminPreferencesResponse = z.object({
  items: z.array(adminNotificationPreferenceResponse).length(adminNotificationCategories.length),
});
export type ListAdminPreferencesResponse = z.infer<typeof listAdminPreferencesResponse>;

export const updateAdminPreferenceParam = z.object({ category: adminNotificationCategory }).strict();
export type UpdateAdminPreferenceParam = z.infer<typeof updateAdminPreferenceParam>;
