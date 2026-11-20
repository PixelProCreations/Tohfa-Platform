import { z } from 'zod';

/** docs/openapi.yaml HomeBanner / HomeSection and their Create/Update bodies (BR-152). */
export const bannerTargetTypes = ['NONE', 'CATEGORY', 'PRODUCT', 'URL'] as const;
export type BannerTargetType = (typeof bannerTargetTypes)[number];
export const sectionTargetTypes = ['CATEGORY', 'PRODUCTS'] as const;
export type SectionTargetType = (typeof sectionTargetTypes)[number];
export const homeContentStatuses = ['ACTIVE', 'SCHEDULED', 'EXPIRED', 'INACTIVE'] as const;
export type HomeContentStatus = (typeof homeContentStatuses)[number];

const url = z.string().url().max(2048);
const dateTime = z.string().datetime({ offset: true });

export const idParams = z.object({ id: z.string().uuid() }).strict();

export const listHomeContentQuery = z
  .object({ status: z.enum(homeContentStatuses).optional() })
  .strict();
export type ListHomeContentQuery = z.infer<typeof listHomeContentQuery>;

export const createBannerBody = z
  .object({
    title: z.string().trim().min(1).max(120),
    imageUrl: url,
    targetType: z.enum(bannerTargetTypes).default('NONE'),
    targetCategoryId: z.string().uuid().nullable().optional(),
    targetProductId: z.string().uuid().nullable().optional(),
    targetUrl: z.string().min(1).max(2048).nullable().optional(),
    sortOrder: z.number().int().min(0).max(100000).default(0),
    startsAt: dateTime.nullable().optional(),
    endsAt: dateTime.nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .strict();
export type CreateBannerBody = z.infer<typeof createBannerBody>;

export const updateBannerBody = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    imageUrl: url.optional(),
    targetType: z.enum(bannerTargetTypes).optional(),
    targetCategoryId: z.string().uuid().nullable().optional(),
    targetProductId: z.string().uuid().nullable().optional(),
    targetUrl: z.string().min(1).max(2048).nullable().optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    startsAt: dateTime.nullable().optional(),
    endsAt: dateTime.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required.' });
export type UpdateBannerBody = z.infer<typeof updateBannerBody>;

export const homeBannerSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    imageUrl: z.string(),
    targetType: z.enum(bannerTargetTypes),
    targetCategoryId: z.string().uuid().nullable(),
    targetProductId: z.string().uuid().nullable(),
    targetUrl: z.string().nullable(),
    sortOrder: z.number().int(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    isActive: z.boolean(),
    status: z.enum(homeContentStatuses),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
  })
  .strict();
export type HomeBanner = z.infer<typeof homeBannerSchema>;

export const createSectionBody = z
  .object({
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().trim().min(1).max(200).nullable().optional(),
    targetType: z.enum(sectionTargetTypes),
    targetCategoryId: z.string().uuid().nullable().optional(),
    productIds: z.array(z.string().uuid()).max(50).optional(),
    maxItems: z.number().int().min(1).max(50).default(10),
    sortOrder: z.number().int().min(0).max(100000).default(0),
    startsAt: dateTime.nullable().optional(),
    endsAt: dateTime.nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .strict();
export type CreateSectionBody = z.infer<typeof createSectionBody>;

export const updateSectionBody = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    subtitle: z.string().trim().min(1).max(200).nullable().optional(),
    targetType: z.enum(sectionTargetTypes).optional(),
    targetCategoryId: z.string().uuid().nullable().optional(),
    productIds: z.array(z.string().uuid()).max(50).optional(),
    maxItems: z.number().int().min(1).max(50).optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    startsAt: dateTime.nullable().optional(),
    endsAt: dateTime.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field is required.' });
export type UpdateSectionBody = z.infer<typeof updateSectionBody>;

export const homeSectionSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    subtitle: z.string().nullable(),
    targetType: z.enum(sectionTargetTypes),
    targetCategoryId: z.string().uuid().nullable(),
    productIds: z.array(z.string().uuid()),
    maxItems: z.number().int(),
    sortOrder: z.number().int(),
    startsAt: z.string().nullable(),
    endsAt: z.string().nullable(),
    isActive: z.boolean(),
    status: z.enum(homeContentStatuses),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
  })
  .strict();
export type HomeSection = z.infer<typeof homeSectionSchema>;
