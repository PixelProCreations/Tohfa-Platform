import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

// BR-58: `2026-02-30` matched the old YYYY-MM-DD regex and reached Postgres as a 500.
const isoDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

// 24-hour HH:MM, zero-padded, so a plain string comparison orders times correctly.
const clockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be a 24-hour time in HH:MM format');

const endAfterStartMessage = 'endTime must be later than startTime';

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
  // The span cap is system_config.calendar_max_range_days, enforced by the service.
  .refine(
    (q) => q.from <= q.to,
    { message: '"from" date must be earlier than or equal to "to" date' },
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
    startTime: clockTime.optional(),
    endTime: clockTime.optional(),
    locationName: z.string().trim().max(200).optional(),
    targetAudience: targetAudienceEnum.default('ALL'),
    isPublished: z.boolean().default(true),
  })
  .strict()
  .refine((b) => b.startTime === undefined || b.endTime === undefined || b.endTime > b.startTime, {
    message: endAfterStartMessage,
    path: ['endTime'],
  });
export type CreatePlatformEventBody = z.infer<typeof createPlatformEventBody>;

export const updatePlatformEventBody = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    eventType: eventTypeEnum.optional(),
    eventDate: isoDate.optional(),
    startTime: clockTime.nullable().optional(),
    endTime: clockTime.nullable().optional(),
    locationName: z.string().trim().max(200).nullable().optional(),
    targetAudience: targetAudienceEnum.optional(),
    isPublished: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field must be supplied' })
  // Both times in one patch can be checked here; a patch that moves only one is
  // checked against the stored row by the service.
  .refine(
    (b) =>
      b.startTime === undefined ||
      b.startTime === null ||
      b.endTime === undefined ||
      b.endTime === null ||
      b.endTime > b.startTime,
    { message: endAfterStartMessage, path: ['endTime'] },
  );
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

export const listPlatformEventsQuery = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListPlatformEventsQuery = z.infer<typeof listPlatformEventsQuery>;

export const listPlatformEventsResponse = z.object({
  items: z.array(platformEventResponse),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});
export type ListPlatformEventsResponse = z.infer<typeof listPlatformEventsResponse>;
