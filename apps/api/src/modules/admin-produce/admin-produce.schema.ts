/**
 * Admin Produce Control Calendar (BR-142): schemas, types, and allow-list serializers.
 */
import { z } from 'zod';

export const FARM_CROP_STATUSES = ['PLANNED', 'GROWING', 'HARVESTED', 'FAILED'] as const;
export type FarmCropStatus = (typeof FARM_CROP_STATUSES)[number];

export const MILESTONE_STATUSES = ['PENDING', 'COMPLETED', 'SKIPPED'] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const PRODUCE_EVENT_TYPES = ['PLANTING', 'GROWTH_STAGE', 'HARVEST'] as const;
export type ProduceEventType = (typeof PRODUCE_EVENT_TYPES)[number];

export const produceStatusFilterSchema = z.union([
  z.array(z.enum(FARM_CROP_STATUSES)),
  z.enum(FARM_CROP_STATUSES).transform((s) => [s]),
  z
    .string()
    .min(1)
    .transform((raw) => raw.split(',').map((part) => part.trim()))
    .pipe(z.array(z.enum(FARM_CROP_STATUSES)).min(1)),
]);

export const commonProduceFiltersSchema = z.object({
  farmerId: z.string().uuid().optional(),
  zoneId: z.string().uuid().optional(),
  cropId: z.string().uuid().optional(),
  q: z.string().trim().min(1).max(100).optional(),
  status: produceStatusFilterSchema.optional(),
});
export type CommonProduceFilters = z.infer<typeof commonProduceFiltersSchema>;

// ---------------------------------------------------------------------------
// 3.1 Records List
// ---------------------------------------------------------------------------
export const listProduceRecordsQuery = commonProduceFiltersSchema
  .extend({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    includeTotal: z
      .preprocess((val) => {
        if (typeof val === 'string') return val.toLowerCase() === 'true';
        return val === true;
      }, z.boolean())
      .optional(),
  })
  .strict();
export type ListProduceRecordsQuery = z.infer<typeof listProduceRecordsQuery>;

export const pageMetaSchema = z
  .object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
    total: z.number().int().nonnegative().optional(),
  })
  .strict();
export type PageMeta = z.infer<typeof pageMetaSchema>;

export const produceCropSummarySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    botanicalName: z.string().nullable(),
  })
  .strict();

export const produceFarmerSummarySchema = z
  .object({
    id: z.string().uuid(),
    tohfaFarmerId: z.string(),
    name: z.string(),
  })
  .strict();

export const produceFarmSummarySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .strict();

export const produceZoneSummarySchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
  })
  .strict();

export const producePlotSummarySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    areaAcres: z.number().nullable(),
  })
  .strict();

export const cropRecordSummarySchema = z
  .object({
    id: z.string().uuid(),
    crop: produceCropSummarySchema,
    variety: z.string().nullable(),
    farmer: produceFarmerSummarySchema,
    farm: produceFarmSummarySchema,
    zone: produceZoneSummarySchema.nullable(),
    plot: producePlotSummarySchema,
    status: z.enum(FARM_CROP_STATUSES),
    plantedOn: z.string().nullable(),
    expectedHarvestOn: z.string().nullable(),
    actualHarvestOn: z.string().nullable(),
    expectedYieldKg: z.number().nullable(),
    actualYieldKg: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
  })
  .strip();
export type CropRecordSummary = z.infer<typeof cropRecordSummarySchema>;

export const produceRecordsListResponse = z
  .object({
    items: z.array(cropRecordSummarySchema),
    page: pageMetaSchema,
  })
  .strict();
export type ProduceRecordsListResponse = z.infer<typeof produceRecordsListResponse>;

// ---------------------------------------------------------------------------
// 3.2 Record Detail
// ---------------------------------------------------------------------------
export const produceRecordIdParams = z
  .object({
    id: z.string().uuid('crop record id must be a UUID'),
  })
  .strict();
export type ProduceRecordIdParams = z.infer<typeof produceRecordIdParams>;

export const produceRecordStageSchema = z
  .object({
    id: z.string().uuid(),
    stageCode: z.string(),
    stageName: z.string(),
    sequence: z.number().int(),
    status: z.enum(MILESTONE_STATUSES),
    targetDate: z.string().nullable(),
    completedOn: z.string().nullable(),
  })
  .strict();
export type ProduceRecordStage = z.infer<typeof produceRecordStageSchema>;

export const produceRecordRelatedCountsSchema = z
  .object({
    diaryEntryCount: z.number().int().nonnegative(),
    inputLogCount: z.number().int().nonnegative(),
  })
  .strict();
export type ProduceRecordRelatedCounts = z.infer<typeof produceRecordRelatedCountsSchema>;

export const produceRecordDetailPlotSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    areaAcres: z.number().nullable(),
    soilType: z.string().nullable(),
    irrigationType: z.string().nullable(),
    sunExposure: z.string().nullable(),
  })
  .strict();

export const produceRecordDetailResponse = z
  .object({
    id: z.string().uuid(),
    crop: produceCropSummarySchema,
    variety: z.string().nullable(),
    farmer: produceFarmerSummarySchema,
    farm: produceFarmSummarySchema,
    zone: produceZoneSummarySchema.nullable(),
    plot: produceRecordDetailPlotSchema,
    status: z.enum(FARM_CROP_STATUSES),
    plantedOn: z.string().nullable(),
    expectedHarvestOn: z.string().nullable(),
    actualHarvestOn: z.string().nullable(),
    expectedYieldKg: z.number().nullable(),
    actualYieldKg: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
    stages: z.array(produceRecordStageSchema),
    related: produceRecordRelatedCountsSchema,
  })
  .strip();
export type ProduceRecordDetailResponse = z.infer<typeof produceRecordDetailResponse>;

// ---------------------------------------------------------------------------
// 3.3 Month Calendar Grid
// ---------------------------------------------------------------------------
export const produceCalendarQuery = commonProduceFiltersSchema
  .extend({
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be in YYYY-MM format'),
  })
  .strict();
export type ProduceCalendarQuery = z.infer<typeof produceCalendarQuery>;

export const produceCalendarDaySchema = z
  .object({
    date: z.string(),
    planting: z.number().int().nonnegative(),
    growthStage: z.number().int().nonnegative(),
    harvest: z.number().int().nonnegative(),
  })
  .strict();
export type ProduceCalendarDay = z.infer<typeof produceCalendarDaySchema>;

export const produceCalendarResponse = z
  .object({
    month: z.string(),
    days: z.array(produceCalendarDaySchema),
  })
  .strict();
export type ProduceCalendarResponse = z.infer<typeof produceCalendarResponse>;

// ---------------------------------------------------------------------------
// 3.4 Selected-Day Calendar Events
// ---------------------------------------------------------------------------
export const produceCalendarEventsQuery = commonProduceFiltersSchema
  .extend({
    date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'date must be in YYYY-MM-DD format'),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ProduceCalendarEventsQuery = z.infer<typeof produceCalendarEventsQuery>;

export const produceEventStageSchema = z
  .object({
    code: z.string(),
    name: z.string(),
  })
  .strict();

export const produceEventCropSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .strict();

export const produceEventFarmerSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .strict();

export const produceEventZoneSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .strict();

export const produceEventPlotSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
  })
  .strict();

export const produceEventRecordSchema = z
  .object({
    id: z.string().uuid(),
    crop: produceEventCropSchema,
    farmer: produceEventFarmerSchema,
    zone: produceEventZoneSchema.nullable(),
    plot: produceEventPlotSchema,
  })
  .strict();

export const produceCalendarEventItemSchema = z
  .object({
    eventType: z.enum(PRODUCE_EVENT_TYPES),
    date: z.string(),
    stage: produceEventStageSchema.nullable(),
    record: produceEventRecordSchema,
  })
  .strict();
export type ProduceCalendarEventItem = z.infer<typeof produceCalendarEventItemSchema>;

export const produceCalendarEventsResponse = z
  .object({
    items: z.array(produceCalendarEventItemSchema),
    page: pageMetaSchema,
  })
  .strict();
export type ProduceCalendarEventsResponse = z.infer<typeof produceCalendarEventsResponse>;

// ---------------------------------------------------------------------------
// 3.5 Filter Options
// ---------------------------------------------------------------------------
export const produceFilterZoneOptionSchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
  })
  .strict();
export type ProduceFilterZoneOption = z.infer<typeof produceFilterZoneOptionSchema>;

export const produceFilterCropOptionSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    botanicalName: z.string().nullable(),
  })
  .strict();
export type ProduceFilterCropOption = z.infer<typeof produceFilterCropOptionSchema>;

export const produceFilterOptionsResponse = z
  .object({
    zones: z.array(produceFilterZoneOptionSchema),
    crops: z.array(produceFilterCropOptionSchema),
  })
  .strict();
export type ProduceFilterOptionsResponse = z.infer<typeof produceFilterOptionsResponse>;
