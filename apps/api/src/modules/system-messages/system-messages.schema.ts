import { z } from 'zod';

export const systemMessageIdParam = z.object({ id: z.string().uuid() }).strict();
export type SystemMessageIdParam = z.infer<typeof systemMessageIdParam>;

export const SYSTEM_MESSAGE_STATUSES = ['unread', 'read', 'all'] as const;

export const listSystemMessagesQuery = z
  .object({
    cursor: z.string().min(1).max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(SYSTEM_MESSAGE_STATUSES).default('all'),
  })
  .strict();
export type ListSystemMessagesQuery = z.infer<typeof listSystemMessagesQuery>;

/**
 * BR-134: `announcements.type` (migration 0081). UNCONFIRMED value set: implementer proposal, the
 * owner has not defined the kinds. Keep aligned with `announcements_type_chk`.
 */
export const SYSTEM_MESSAGE_TYPES = ['GENERAL', 'MAINTENANCE', 'ALERT', 'PROMOTION'] as const;
export type SystemMessageType = (typeof SYSTEM_MESSAGE_TYPES)[number];

/** `ZONE` is a valid announcement scope in the table but the visibility query never returns it. */
export const systemMessageResponse = z
  .object({
    id: z.string().uuid(),
    scope: z.enum(['SYSTEM_WIDE', 'WAREHOUSE', 'ROLE']),
    type: z.enum(SYSTEM_MESSAGE_TYPES),
    title: z.string(),
    body: z.string(),
    locale: z.enum(['en', 'ta']),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    isRead: z.boolean(),
    readAt: z.string().datetime().nullable(),
  })
  .strict();
export type SystemMessageResponse = z.infer<typeof systemMessageResponse>;

export const systemMessageListResponse = z
  .object({
    items: z.array(systemMessageResponse),
    page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }).strict(),
  })
  .strict();
export type SystemMessageListResponse = z.infer<typeof systemMessageListResponse>;
