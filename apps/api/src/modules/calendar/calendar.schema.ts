import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const eventTypeEnum = z.enum(['WORKSHOP', 'TRAINING', 'COMMUNITY_MEET', 'MARKET_DAY', 'OTHER']);
export type EventType = z.infer<typeof eventTypeEnum>;

export const targetAudienceEnum = z.enum(['ALL', 'FARMER', 'CUSTOMER']);
export type TargetAudience = z.infer<typeof targetAudienceEnum>;

export const calendarItemCategoryEnum = z.enum(['PLATFORM_EVENT', 'AUDIT', 'CERTIFICATE_EXPIRY', 'CROP_HARVEST']);
export type CalendarItemCategory = z.infer<typeof calendarItemCategoryEnum>;

export const calendarQuery = z
  .object({
    from: isoDate,
    to: isoDate,
  })
  .strict()
  .refine(
    (q) => q.from <= q.to,
    { message: '"from" date must be earlier than or equal to "to" date' },
  )
  .refine(
    (q) => {
      const diffMs = new Date(`${q.to}T00:00:00Z`).getTime() - new Date(`${q.from}T00:00:00Z`).getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 366;
    },
    { message: 'Date range cannot exceed 366 days (1 year)' },
  );
export type CalendarQuery = z.infer<typeof calendarQuery>;

export const calendarItemResponse = z.object({
  id: z.string(),
  category: calendarItemCategoryEnum,
  title: z.string(),
  description: z.string().nullable(),
  date: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
export type CalendarItemResponse = z.infer<typeof calendarItemResponse>;

export const calendarResponse = z.object({
  from: z.string(),
  to: z.string(),
  items: z.array(calendarItemResponse),
});
export type CalendarResponse = z.infer<typeof calendarResponse>;

export const platformEventIdParams = z
  .object({
    id: z.string().uuid('id must be a UUID'),
  })
  .strict();
export type PlatformEventIdParams = z.infer<typeof platformEventIdParams>;

export const createPlatformEventBody = z
  .object({
    title: z.string().trim().min(1, 'title is required').max(200),
    description: z.string().trim().max(2000).optional(),
    eventType: eventTypeEnum,
    eventDate: isoDate,
    startTime: z.string().trim().max(20).optional(),
    endTime: z.string().trim().max(20).optional(),
    locationName: z.string().trim().max(200).optional(),
    targetAudience: targetAudienceEnum.default('ALL'),
    isPublished: z.boolean().default(true),
  })
  .strict();
export type CreatePlatformEventBody = z.infer<typeof createPlatformEventBody>;

export const updatePlatformEventBody = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    eventType: eventTypeEnum.optional(),
    eventDate: isoDate.optional(),
    startTime: z.string().trim().max(20).nullable().optional(),
    endTime: z.string().trim().max(20).nullable().optional(),
    locationName: z.string().trim().max(200).nullable().optional(),
    targetAudience: targetAudienceEnum.optional(),
    isPublished: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field must be supplied' });
export type UpdatePlatformEventBody = z.infer<typeof updatePlatformEventBody>;

export const platformEventResponse = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  eventType: eventTypeEnum,
  eventDate: z.string(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  locationName: z.string().nullable(),
  targetAudience: targetAudienceEnum,
  isPublished: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type PlatformEventResponse = z.infer<typeof platformEventResponse>;

export const listPlatformEventsResponse = z.object({
  items: z.array(platformEventResponse),
});
export type ListPlatformEventsResponse = z.infer<typeof listPlatformEventsResponse>;
