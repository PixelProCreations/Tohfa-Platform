/**
 * Generated from the _example reference module. See CLAUDE.md.
 *
 * <name>.schema.ts holds ONLY Zod schemas and the types inferred from them.
 * Keep aligned with `docs/openapi.yaml` (`NotificationCategory`,
 * `NotificationPreference`).
 */
import { z } from 'zod';

/**
 * The five categories of the farmer-app Settings notification sheet
 * (screen 73). Matches the CHECK constraint on
 * `notification_preferences.category` in db/migrations/0027. The array order
 * is the order the API returns them in, which is the order the sheet shows.
 */
export const notificationCategories = [
  'WEATHER',
  'FARM',
  'MARKETING',
  'PAYROLL',
  'COMMUNITY',
] as const;
export const notificationCategory = z.enum(notificationCategories);
export type NotificationCategory = z.infer<typeof notificationCategory>;

/** Wire representation of one category preference. */
export const notificationPreferenceResponse = z.object({
  category: notificationCategory,
  enabled: z.boolean(),
});
export type NotificationPreferenceResponse = z.infer<typeof notificationPreferenceResponse>;

/** GET /v1/notification-preferences — always all five categories. */
export const listPreferencesResponse = z.object({
  items: z.array(notificationPreferenceResponse).length(notificationCategories.length),
});
export type ListPreferencesResponse = z.infer<typeof listPreferencesResponse>;

/** PATCH /v1/notification-preferences/:category */
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
