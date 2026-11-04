import { z } from 'zod';

/**
 * Community planting summary (BR-136): the TOHFA Calendar "What the community is growing" view.
 *
 * Every RESPONSE schema below is an allow-list. The service builds each object field by field
 * and parses it through these schemas, whose default (strip) mode drops any key that is not
 * listed here. So a column added to a repo row later (a farmer id, a farm name, a village) can
 * never reach the wire by accident. Do NOT switch these to `.passthrough()`.
 */

export const plantingSummaryQuery = z
  .object({
    crop: z.string().uuid('crop must be a crop_master id (UUID)').optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    region: z.string().trim().min(1).max(100).optional(),
  })
  .strict();
export type PlantingSummaryQuery = z.infer<typeof plantingSummaryQuery>;

/** The filters endpoint takes no parameters; an unknown one is 422, as everywhere else. */
export const plantingFiltersQuery = z.object({}).strict();

export const plantingSummaryFilters = z.object({
  crop: z.string().uuid().nullable(),
  month: z.number().int().min(1).max(12).nullable(),
  region: z.string().nullable(),
});

export const plantingSummaryTotals = z.object({
  farmers: z.number().int().nonnegative(),
  totalPlantedKg: z.number().nonnegative(),
  crops: z.number().int().nonnegative(),
});

export const plantingSummaryCrop = z.object({
  cropMasterId: z.string().uuid(),
  cropName: z.string(),
  farmers: z.number().int().nonnegative(),
  quantityKg: z.number().nonnegative(),
});
export type PlantingSummaryCrop = z.infer<typeof plantingSummaryCrop>;

export const plantingSummaryOther = z.object({
  crops: z.number().int().positive(),
  farmers: z.number().int().positive(),
  quantityKg: z.number().nonnegative(),
});

export const plantingSummaryResponse = z.object({
  generatedAt: z.string(),
  filters: plantingSummaryFilters,
  minGroupSize: z.number().int().min(2),
  totals: plantingSummaryTotals,
  byCrop: z.array(plantingSummaryCrop),
  other: plantingSummaryOther.nullable(),
});
export type PlantingSummaryResponse = z.infer<typeof plantingSummaryResponse>;

export const plantingFilterCrop = z.object({
  cropMasterId: z.string().uuid(),
  cropName: z.string(),
});

export const plantingFiltersResponse = z.object({
  minGroupSize: z.number().int().min(2),
  crops: z.array(plantingFilterCrop),
  months: z.array(z.number().int().min(1).max(12)),
  regions: z.array(z.string()),
});
export type PlantingFiltersResponse = z.infer<typeof plantingFiltersResponse>;
