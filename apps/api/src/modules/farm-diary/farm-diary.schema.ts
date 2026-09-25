/**
 * Farm Diary (BR-40..BR-45). Zod schemas and inferred types only — no SQL, no
 * HTTP, no business rules. See db/migrations/0020_farm_diary.sql and
 * 0021_farm_diary_workforce.sql for the tables behind these shapes.
 *
 * WHY several numeric fields are only type-checked here, not range-checked:
 * a zod failure always surfaces as the generic `VALIDATION_FAILED`
 * (errorHandler.ts's `zodToAppError` has no path to a domain code), but the
 * rule test contracts name specific codes — BR-42c `DIARY_MINUTES_REQUIRED`,
 * BR-44a `DIARY_WORKER_HOURS_INVALID`, BR-44b `DIARY_WAGE_RATE_INVALID`. Those
 * range checks therefore live in farm-diary.service.ts, exactly as
 * farm-ratings does for BR-06a's SCORE_OUT_OF_RANGE.
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');
const isoMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Must be a month in YYYY-MM format');

/** Taxonomy keys are admin-managed text PKs, e.g. `land_prep` / `land_prep.ploughing_tilling`. */
const taxonomyKey = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9_.]+$/, 'Keys use lowercase letters, digits, "_" and "."');

export const workerPaymentStatuses = ['PENDING', 'PAID'] as const;
export type WorkerPaymentStatus = (typeof workerPaymentStatuses)[number];

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export const plotIdParams = z.object({ plotId: z.string().uuid('plotId must be a UUID') }).strict();
export type PlotIdParams = z.infer<typeof plotIdParams>;

export const entryIdParams = z.object({ entryId: z.string().uuid('entryId must be a UUID') }).strict();
export type EntryIdParams = z.infer<typeof entryIdParams>;

export const entryPhotoParams = z
  .object({
    entryId: z.string().uuid('entryId must be a UUID'),
    photoId: z.string().uuid('photoId must be a UUID'),
  })
  .strict();
export type EntryPhotoParams = z.infer<typeof entryPhotoParams>;

export const categoryKeyParams = z.object({ key: taxonomyKey }).strict();
export type CategoryKeyParams = z.infer<typeof categoryKeyParams>;

export const categoryKeyForSubParams = z.object({ categoryKey: taxonomyKey }).strict();
export type CategoryKeyForSubParams = z.infer<typeof categoryKeyForSubParams>;

export const subActivityKeyParams = z.object({ key: taxonomyKey }).strict();
export type SubActivityKeyParams = z.infer<typeof subActivityKeyParams>;

// ---------------------------------------------------------------------------
// Workforce (BR-44)
// ---------------------------------------------------------------------------

/**
 * `hoursWorked` / `wageRatePaise` are plain finite numbers here on purpose —
 * see the file header. `wageRatePaise` is integer paise (root CLAUDE.md §2.2);
 * a non-integer is rejected by the service with DIARY_WAGE_RATE_INVALID.
 */
export const diaryWorkerInput = z
  .object({
    name: z.string().trim().min(1).max(120),
    role: z.string().trim().min(1).max(80).optional(),
    hoursWorked: z.number().finite(),
    wageRatePaise: z.number().finite(),
    paymentStatus: z.enum(workerPaymentStatuses).default('PENDING'),
  })
  .strict();
export type DiaryWorkerInput = z.infer<typeof diaryWorkerInput>;

// ---------------------------------------------------------------------------
// Entries
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/diary/entries
 *
 * There is deliberately no `farmerId` field: the owner is always
 * `scope.farmerId` (BR-40), and `.strict()` rejects a client that tries to
 * send one.
 *
 * `farmCropId` is optional: when omitted the service attaches the plot's most
 * recently planted GROWING crop (BR-42b). When supplied it must itself be a
 * GROWING crop on that plot.
 */
export const createDiaryEntryBody = z
  .object({
    plotId: z.string().uuid('plotId must be a UUID'),
    farmCropId: z.string().uuid('farmCropId must be a UUID').optional(),
    categoryKey: taxonomyKey,
    subActivityKey: taxonomyKey,
    /** Optional in zod so a missing value reaches the service's BR-42c check. */
    minutes: z.number().int('minutes must be a whole number').max(1440).optional(),
    activityFields: z.record(z.unknown()).default({}),
    notes: z.string().max(2000).optional(),
    activityOn: isoDate.optional(),
    voiceNoteKey: z.string().min(1).max(512).optional(),
    voiceNoteDurationS: z.number().int().min(1).max(32767).optional(),
    workers: z.array(diaryWorkerInput).max(100).default([]),
  })
  .strict();
export type CreateDiaryEntryBody = z.infer<typeof createDiaryEntryBody>;

/**
 * PATCH /v1/farmers/me/diary/entries/:entryId
 *
 * `plotId` / `farmCropId` are NOT editable: moving an entry to a different
 * plot or crop cycle would re-attribute it to a different harvest, which is a
 * delete-and-recreate, not an edit. `workers`, when present, REPLACES the
 * whole workforce set (BR-44c); when absent the set is left untouched.
 * Nullable fields accept `null` to clear them.
 */
export const updateDiaryEntryBody = z
  .object({
    categoryKey: taxonomyKey.optional(),
    subActivityKey: taxonomyKey.optional(),
    minutes: z.number().int('minutes must be a whole number').max(1440).optional(),
    activityFields: z.record(z.unknown()).optional(),
    notes: z.string().max(2000).nullable().optional(),
    activityOn: isoDate.optional(),
    voiceNoteKey: z.string().min(1).max(512).nullable().optional(),
    voiceNoteDurationS: z.number().int().min(1).max(32767).nullable().optional(),
    workers: z.array(diaryWorkerInput).max(100).optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateDiaryEntryBody = z.infer<typeof updateDiaryEntryBody>;

/** GET /v1/farmers/me/diary/entries — cursor pagination, same envelope as certifications. */
export const listDiaryEntriesQuery = z
  .object({
    date: isoDate.optional(),
    month: isoMonth.optional(),
    plotId: z.string().uuid('plotId must be a UUID').optional(),
    categoryKey: taxonomyKey.optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListDiaryEntriesQuery = z.infer<typeof listDiaryEntriesQuery>;

/** GET /v1/farmers/me/diary/entries/calendar?month=YYYY-MM */
export const diaryCalendarQuery = z.object({ month: isoMonth }).strict();
export type DiaryCalendarQuery = z.infer<typeof diaryCalendarQuery>;

/**
 * POST /v1/farmers/me/diary/entries/:entryId/photos
 *
 * `storageKey` is the key the uploads module issued from `POST /uploads/sign`
 * (purpose DIARY_PHOTO). EXIF/GPS stripping (BR-16/BR-41) is the uploads
 * module's job, not this endpoint's — this only attaches the key, the same way
 * listings/goods-receipts accept already-uploaded photo keys.
 */
export const attachDiaryPhotoBody = z
  .object({
    storageKey: z
      .string()
      .min(1)
      .max(512)
      .regex(/^[a-z0-9_]+\/[A-Za-z0-9._-]+$/, 'storageKey must be a key issued by POST /uploads/sign'),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    sizeBytes: z.number().int().min(1).max(26_214_400),
  })
  .strict();
export type AttachDiaryPhotoBody = z.infer<typeof attachDiaryPhotoBody>;

// ---------------------------------------------------------------------------
// Admin taxonomy (BR-45)
// ---------------------------------------------------------------------------

export const createDiaryCategoryBody = z
  .object({
    key: taxonomyKey,
    name: z.string().trim().min(1).max(120),
    nameTa: z.string().trim().min(1).max(120).optional(),
    iconKey: z.string().trim().min(1).max(80).optional(),
    sortOrder: z.number().int().min(0).max(32767),
  })
  .strict();
export type CreateDiaryCategoryBody = z.infer<typeof createDiaryCategoryBody>;

export const updateDiaryCategoryBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    nameTa: z.string().trim().min(1).max(120).nullable().optional(),
    iconKey: z.string().trim().min(1).max(80).nullable().optional(),
    sortOrder: z.number().int().min(0).max(32767).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateDiaryCategoryBody = z.infer<typeof updateDiaryCategoryBody>;

export const createDiarySubActivityBody = z
  .object({
    key: taxonomyKey,
    name: z.string().trim().min(1).max(120),
    nameTa: z.string().trim().min(1).max(120).optional(),
    sortOrder: z.number().int().min(0).max(32767),
  })
  .strict();
export type CreateDiarySubActivityBody = z.infer<typeof createDiarySubActivityBody>;

export const updateDiarySubActivityBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    nameTa: z.string().trim().min(1).max(120).nullable().optional(),
    sortOrder: z.number().int().min(0).max(32767).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateDiarySubActivityBody = z.infer<typeof updateDiarySubActivityBody>;

// ---------------------------------------------------------------------------
// Responses — keep aligned with docs/openapi.yaml
// ---------------------------------------------------------------------------

export const diaryPlotResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  areaAcres: z.number().nullable(),
});
export type DiaryPlotResponse = z.infer<typeof diaryPlotResponse>;

export const diaryActiveCropResponse = z.object({
  id: z.string().uuid(),
  cropName: z.string(),
  plantedOn: z.string().nullable(),
});
export type DiaryActiveCropResponse = z.infer<typeof diaryActiveCropResponse>;

export const diarySubActivityResponse = z.object({
  key: z.string(),
  categoryKey: z.string(),
  name: z.string(),
  nameTa: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type DiarySubActivityResponse = z.infer<typeof diarySubActivityResponse>;

export const diaryCategoryResponse = z.object({
  key: z.string(),
  name: z.string(),
  nameTa: z.string().nullable(),
  iconKey: z.string().nullable(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export type DiaryCategoryResponse = z.infer<typeof diaryCategoryResponse>;

export const diaryTaxonomyResponse = z.object({
  categories: z.array(
    diaryCategoryResponse.extend({ subActivities: z.array(diarySubActivityResponse) }),
  ),
});
export type DiaryTaxonomyResponse = z.infer<typeof diaryTaxonomyResponse>;

export const diaryWorkerResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  role: z.string().nullable(),
  hoursWorked: z.number(),
  wageRatePaise: z.number().int(),
  paymentStatus: z.enum(workerPaymentStatuses),
});
export type DiaryWorkerResponse = z.infer<typeof diaryWorkerResponse>;

export const diaryPhotoResponse = z.object({
  id: z.string().uuid(),
  storageKey: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  createdAt: z.string(),
});
export type DiaryPhotoResponse = z.infer<typeof diaryPhotoResponse>;

/** Fields shared by the list summary and the full entry. */
const diaryEntryBase = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  farmCropId: z.string().uuid(),
  categoryKey: z.string(),
  subActivityKey: z.string(),
  minutes: z.number().int(),
  notes: z.string().nullable(),
  activityOn: z.string(),
  loggedAt: z.string(),
  /**
   * Integer paise, computed at read time as ROUND(SUM(hours_worked *
   * wage_rate_paise)) — never stored (BR-44).
   */
  totalLabourCostPaise: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const diaryEntrySummaryResponse = diaryEntryBase.extend({
  workerCount: z.number().int(),
  photoCount: z.number().int(),
});
export type DiaryEntrySummaryResponse = z.infer<typeof diaryEntrySummaryResponse>;

export const diaryEntryResponse = diaryEntryBase.extend({
  activityFields: z.record(z.unknown()),
  voiceNoteKey: z.string().nullable(),
  voiceNoteDurationS: z.number().int().nullable(),
  workers: z.array(diaryWorkerResponse),
  photos: z.array(diaryPhotoResponse),
});
export type DiaryEntryResponse = z.infer<typeof diaryEntryResponse>;

export const listDiaryEntriesResponse = z.object({
  items: z.array(diaryEntrySummaryResponse),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListDiaryEntriesResponse = z.infer<typeof listDiaryEntriesResponse>;

export const diaryCalendarResponse = z.object({
  month: z.string(),
  days: z.array(z.object({ date: z.string(), entryCount: z.number().int() })),
});
export type DiaryCalendarResponse = z.infer<typeof diaryCalendarResponse>;
