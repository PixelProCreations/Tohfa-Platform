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

/** `ZONE` is a valid announcement scope in the table but the visibility query never returns it. */
export const systemMessageResponse = z
  .object({
    id: z.string().uuid(),
    scope: z.enum(['SYSTEM_WIDE', 'WAREHOUSE', 'ROLE']),
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
