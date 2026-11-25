import { z } from 'zod';

export const notificationIdParam = z.object({
  id: z.string().uuid(),
});
export type NotificationIdParam = z.infer<typeof notificationIdParam>;

export const listNotificationsQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;

export const notificationResponse = z.object({
  id: z.string().uuid(),
  channel: z.enum(['PUSH', 'SMS', 'EMAIL', 'IN_APP']),
  title: z.string().nullable(),
  body: z.string(),
  locale: z.enum(['en', 'ta']),
  data: z.record(z.unknown()),
  readAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type NotificationResponse = z.infer<typeof notificationResponse>;

export const registerDeviceTokenBody = z.object({
  token: z.string().min(1).max(512),
  platform: z.enum(['android', 'ios', 'web']),
  app: z.enum(['farmer-mobile', 'customer-mobile', 'admin-web']),
  locale: z.enum(['en', 'ta']).default('en'),
});
export type RegisterDeviceTokenBody = z.infer<typeof registerDeviceTokenBody>;

export const revokeDeviceTokenParam = z.object({
  token: z.string().min(1),
});
export type RevokeDeviceTokenParam = z.infer<typeof revokeDeviceTokenParam>;

export const NOTIFICATION_CHANNELS = ['PUSH', 'SMS', 'EMAIL', 'IN_APP'] as const;
export const NOTIFICATION_LOCALES = ['en', 'ta'] as const;

export const notificationTemplateIdParam = z
  .object({
    id: z.string().uuid('id must be a UUID'),
  })
  .strict();
export type NotificationTemplateIdParam = z.infer<typeof notificationTemplateIdParam>;

export const listNotificationTemplatesQuery = z
  .object({
    code: z.string().trim().min(1).max(80).optional(),
    channel: z.enum(NOTIFICATION_CHANNELS).optional(),
    locale: z.enum(NOTIFICATION_LOCALES).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  })
  .strict();
export type ListNotificationTemplatesQuery = z.infer<typeof listNotificationTemplatesQuery>;

export const updateNotificationTemplateBody = z
  .object({
    subject: z.string().trim().max(200).nullable().optional(),
    bodyTemplate: z.string().trim().min(1).max(2000).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field must be supplied' });
export type UpdateNotificationTemplateBody = z.infer<typeof updateNotificationTemplateBody>;

