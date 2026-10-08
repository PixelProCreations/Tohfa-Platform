
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
