/**
 * Crops (farm_crops + crop_master taxonomy; BR-46). Zod schemas and inferred
 * types only — no SQL, no HTTP, no business rules. See
 * db/migrations/0004_produce_pricing_marketing.sql (farm_crops, crop_master)
 * and db/migrations/0023_crops_extra_fields.sql (seed/grade detail, BR-46's
 * partial unique index) for the tables behind these shapes.
 *
 * WHY several numeric/enum fields are only type-checked here, not fully
 * range-checked: a zod failure always surfaces as the generic
 * `VALIDATION_FAILED` (errorHandler.ts's `zodToAppError` has no path to a
 * domain code), but BR-46's test contract names a specific code
 * (`CROP_PLOT_ALREADY_GROWING`). That check therefore lives in
 * crops.service.ts, exactly as farm-diary.schema.ts does for BR-42c/BR-44a/b.
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const farmCropStatuses = ['PLANNED', 'GROWING', 'HARVESTED', 'FAILED'] as const;
export type FarmCropStatus = (typeof farmCropStatuses)[number];

export const seedQuantityUnits = ['grams', 'kg', 'packets', 'units'] as const;
export type SeedQuantityUnit = (typeof seedQuantityUnits)[number];

export const expectedGrades = ['GRADE_A', 'GRADE_B', 'GRADE_C'] as const;
export type ExpectedGrade = (typeof expectedGrades)[number];

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export const plotIdParams = z.object({ plotId: z.string().uuid('plotId must be a UUID') }).strict();
export type PlotIdParams = z.infer<typeof plotIdParams>;

/** `farm_crops.id` — named distinctly from crop_master's id to avoid confusion. */
export const farmCropIdParams = z.object({ farmCropId: z.string().uuid('farmCropId must be a UUID') }).strict();
export type FarmCropIdParams = z.infer<typeof farmCropIdParams>;

export const cropMasterIdParams = z.object({ id: z.string().uuid('id must be a UUID') }).strict();
export type CropMasterIdParams = z.infer<typeof cropMasterIdParams>;

// ---------------------------------------------------------------------------
// farm_crops — create / update
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/plots/{plotId}/crops
 *
 * There is deliberately no `farmerId` field: ownership is always derived
 * server-side from `plots -> farms.farmer_id`, the same as farm-diary
 * (root CLAUDE.md §2.1 / BR-40's doctrine), and `.strict()` rejects a client
 * that tries to send one. `plotId` itself travels in the URL, not the body,
 * matching the farms module's own nested-under-plot convention.
 */
export const createFarmCropBody = z
  .object({
    cropMasterId: z.string().uuid('cropMasterId must be a UUID'),
    plantedOn: isoDate.optional(),
    expectedHarvestOn: isoDate.optional(),
    expectedYieldKg: z.number().min(0).optional(),
    seedVariety: z.string().trim().min(1).max(160).optional(),
    seedCompany: z.string().trim().min(1).max(160).optional(),
    seedQuantity: z.number().min(0).optional(),
    seedQuantityUnit: z.enum(seedQuantityUnits).optional(),
    seedCostPaise: z.number().int('seedCostPaise must be a whole number').min(0).optional(),
    expectedGrade: z.enum(expectedGrades).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();
export type CreateFarmCropBody = z.infer<typeof createFarmCropBody>;

/**
 * PATCH /v1/farmers/me/crops/{farmCropId}
 *
 * `plotId` / `cropMasterId` are NOT editable — re-pointing a planting record
 * at a different plot or crop type is a delete-and-recreate, not an edit,
 * the same reasoning farm-diary's updateDiaryEntryBody applies to `plotId` /
 * `farmCropId`. `status` drives BR-46 (moving into `GROWING` is re-checked
 * against the plot's other live crops); `actualHarvestOn`/`actualYieldKg`
 * record a real harvest.
 */
export const updateFarmCropBody = z
  .object({
    status: z.enum(farmCropStatuses).optional(),
    plantedOn: isoDate.nullable().optional(),
    expectedHarvestOn: isoDate.nullable().optional(),
    actualHarvestOn: isoDate.nullable().optional(),
    expectedYieldKg: z.number().min(0).nullable().optional(),
    actualYieldKg: z.number().min(0).nullable().optional(),
    seedVariety: z.string().trim().min(1).max(160).nullable().optional(),
    seedCompany: z.string().trim().min(1).max(160).nullable().optional(),
    seedQuantity: z.number().min(0).nullable().optional(),
    seedQuantityUnit: z.enum(seedQuantityUnits).nullable().optional(),
    seedCostPaise: z.number().int('seedCostPaise must be a whole number').min(0).nullable().optional(),
    expectedGrade: z.enum(expectedGrades).nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateFarmCropBody = z.infer<typeof updateFarmCropBody>;

/** GET /v1/farmers/me/plots/{plotId}/crops — cursor pagination, same envelope as farm-diary. */
export const listFarmCropsQuery = z
  .object({
    status: z.enum(farmCropStatuses).optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListFarmCropsQuery = z.infer<typeof listFarmCropsQuery>;

// ---------------------------------------------------------------------------
// Admin crop taxonomy (crop_master)
// ---------------------------------------------------------------------------

export const createCropMasterBody = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, digits and "-"'),
    name: z.string().trim().min(1).max(120),
    nameTa: z.string().trim().min(1).max(120).optional(),
    categoryId: z.string().uuid('categoryId must be a UUID'),
    botanicalName: z.string().trim().min(1).max(160).optional(),
    defaultUnit: z.literal('kg').default('kg'),
    seasonMonths: z.array(z.number().int().min(1).max(12)).max(12).optional(),
    shelfLifeDays: z.number().int().positive().optional(),
    iconKey: z.string().trim().min(1).max(80).optional(),
  })
  .strict();
export type CreateCropMasterBody = z.infer<typeof createCropMasterBody>;

export const updateCropMasterBody = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    nameTa: z.string().trim().min(1).max(120).nullable().optional(),
    categoryId: z.string().uuid('categoryId must be a UUID').optional(),
    botanicalName: z.string().trim().min(1).max(160).nullable().optional(),
    seasonMonths: z.array(z.number().int().min(1).max(12)).max(12).nullable().optional(),
    shelfLifeDays: z.number().int().positive().nullable().optional(),
    iconKey: z.string().trim().min(1).max(80).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateCropMasterBody = z.infer<typeof updateCropMasterBody>;

// ---------------------------------------------------------------------------
// Responses — keep aligned with docs/openapi.yaml
// ---------------------------------------------------------------------------

/**
 * Allow-list, not a raw table dump: `crop_master.hsn_code` and
 * `crop_master.category_id`'s internal joins are not needed by the mobile
 * crop screens (NewCropScreen / ActiveCropsScreen / CropDetailScreen only
 * read name/nameTa/iconKey/defaultUnit for display and picking), so they are
 * left out here the same way the diary taxonomy response only ever exposes
 * what the entry form needs.
 */
export const cropMasterResponse = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  nameTa: z.string().nullable(),
  categoryId: z.string().uuid(),
  botanicalName: z.string().nullable(),
  defaultUnit: z.string(),
  seasonMonths: z.array(z.number().int()).nullable(),
  shelfLifeDays: z.number().int().nullable(),
  iconKey: z.string().nullable(),
  isActive: z.boolean(),
});
export type CropMasterResponse = z.infer<typeof cropMasterResponse>;

export const listCropMasterResponse = z.object({ items: z.array(cropMasterResponse) });
export type ListCropMasterResponse = z.infer<typeof listCropMasterResponse>;

/**
 * A farm_crops row plus the crop_master fields the mobile crop screens
 * render for display (cropName/cropNameTa/cropIconKey) — never crop_master's
 * hsnCode or its internal categoryId.
 */
export const farmCropResponse = z.object({
  id: z.string().uuid(),
  plotId: z.string().uuid(),
  cropMasterId: z.string().uuid(),
  cropName: z.string(),
  cropNameTa: z.string().nullable(),
  cropIconKey: z.string().nullable(),
  status: z.enum(farmCropStatuses),
  plantedOn: z.string().nullable(),
  expectedHarvestOn: z.string().nullable(),
  actualHarvestOn: z.string().nullable(),
  expectedYieldKg: z.number().nullable(),
  actualYieldKg: z.number().nullable(),
  seedVariety: z.string().nullable(),
  seedCompany: z.string().nullable(),
  seedQuantity: z.number().nullable(),
  seedQuantityUnit: z.enum(seedQuantityUnits).nullable(),
  seedCostPaise: z.number().int().nullable(),
  expectedGrade: z.enum(expectedGrades).nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type FarmCropResponse = z.infer<typeof farmCropResponse>;

export const listFarmCropsResponse = z.object({
  items: z.array(farmCropResponse),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListFarmCropsResponse = z.infer<typeof listFarmCropsResponse>;

/**
 * GET /v1/farmers/me/plots/{plotId}/crop-rotation — most-recent-first, for
 * CropRotationScreen.tsx's zone rotation timeline ("Now" / "Next" / "Then").
 */
export const plotRotationHistoryResponse = z.object({
  plotId: z.string().uuid(),
  history: z.array(
    z.object({
      farmCropId: z.string().uuid(),
      cropName: z.string(),
      cropIconKey: z.string().nullable(),
      plantedOn: z.string().nullable(),
      actualHarvestOn: z.string().nullable(),
      status: z.enum(farmCropStatuses),
    }),
  ),
});
export type PlotRotationHistoryResponse = z.infer<typeof plotRotationHistoryResponse>;
