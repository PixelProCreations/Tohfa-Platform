import { z } from 'zod';
import { isCalendarDate } from '../certifications/certifications.schema.js';

// Real calendar dates only: the regex alone let 2026-02-30 through to Postgres, which answered 500.
const isoDate = z
  .string()
  .refine(isCalendarDate, { message: 'Must be a real calendar date in YYYY-MM-DD format' });

/** Largest value numeric(10,2) holds; anything above is a Postgres 22003 (a 500) if it reaches the insert. */
export const QUANTITY_MAX = 99_999_999.99;

/**
 * A cost is a decimal STRING (BR-56f, CLAUDE.md 2.2): never a JSON number, at most 2 decimals, and at most
 * 8 integer digits because crop_inputs.cost_inr is numeric(10,2). Same shape as the Money pattern, minus
 * the sign (a cost is never negative) and capped to the column.
 */
const costSchema = z.string().regex(/^[0-9]{1,8}(\.[0-9]{1,2})?$/, 'Must be a decimal string with at most 2 decimals');
/** A stored or summed amount, as the API returns it. Same pattern as `Money` in docs/openapi.yaml. */
const moneyResponse = z.string().regex(/^-?[0-9]{1,10}(\.[0-9]{1,2})?$/);

/**
 * FERTIGATION (BR-56j, migration 0085) is nutrients delivered through irrigation. Rows logged before it
 * existed were stored as OTHER and are left as they are: OTHER stays a valid value on read and write.
 */
export const inputTypeEnum = z.enum(['FERTILIZER', 'MANURE', 'BIO_INPUT', 'PESTICIDE', 'FERTIGATION', 'OTHER']);
export type InputType = z.infer<typeof inputTypeEnum>;

/** Column caps for the BR-56k fields (migration 0085 CHECKs match these). */
export const PURPOSE_MAX = 100;
export const TARGET_PEST_MAX = 200;
export const APPLIED_BY_MAX = 200;

export const inputUnitEnum = z.enum(['KG', 'LITRE', 'GRAM', 'ML', 'BAG', 'TONNE', 'OTHER']);
export type InputUnit = z.infer<typeof inputUnitEnum>;

export const farmCropIdParams = z
  .object({
    farmCropId: z.string().uuid('farmCropId must be a UUID'),
  })
  .strict();
export type FarmCropIdParams = z.infer<typeof farmCropIdParams>;

export const cropInputIdParams = z
  .object({
    farmCropId: z.string().uuid('farmCropId must be a UUID'),
    id: z.string().uuid('id must be a UUID'),
  })
  .strict();
export type CropInputIdParams = z.infer<typeof cropInputIdParams>;

export const createCropInputBody = z
  .object({
    inputType: inputTypeEnum,
    inputName: z.string().trim().min(1, 'inputName is required').max(200),
    appliedOn: isoDate,
    quantity: z.number().positive('quantity must be greater than 0').max(QUANTITY_MAX),
    unit: inputUnitEnum,
    nitrogenPct: z.number().min(0).max(100).optional(),
    phosphorusPct: z.number().min(0).max(100).optional(),
    potassiumPct: z.number().min(0).max(100).optional(),
    applicationMethod: z.string().trim().max(100).optional(),
    costInr: costSchema.optional(),
    notes: z.string().trim().max(2000).optional(),
    // BR-56k: free text, so a stable code from the app's option list or the farmer's own words both fit.
    purpose: z.string().trim().min(1).max(PURPOSE_MAX).optional(),
    targetPest: z.string().trim().min(1).max(TARGET_PEST_MAX).optional(),
    appliedBy: z.string().trim().min(1).max(APPLIED_BY_MAX).optional(),
  })
  .strict();
export type CreateCropInputBody = z.infer<typeof createCropInputBody>;

export const updateCropInputBody = z
  .object({
    inputType: inputTypeEnum.optional(),
    inputName: z.string().trim().min(1).max(200).optional(),
    appliedOn: isoDate.optional(),
    quantity: z.number().positive('quantity must be greater than 0').max(QUANTITY_MAX).optional(),
    unit: inputUnitEnum.optional(),
    nitrogenPct: z.number().min(0).max(100).nullable().optional(),
    phosphorusPct: z.number().min(0).max(100).nullable().optional(),
    potassiumPct: z.number().min(0).max(100).nullable().optional(),
    applicationMethod: z.string().trim().max(100).nullable().optional(),
    costInr: costSchema.nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    purpose: z.string().trim().min(1).max(PURPOSE_MAX).nullable().optional(),
    targetPest: z.string().trim().min(1).max(TARGET_PEST_MAX).nullable().optional(),
    appliedBy: z.string().trim().min(1).max(APPLIED_BY_MAX).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateCropInputBody = z.infer<typeof updateCropInputBody>;

export const listCropInputsQuery = z
  .object({
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListCropInputsQuery = z.infer<typeof listCropInputsQuery>;

/**
 * GET /farmers/me/crop-inputs (BR-56h). Strict, so a `farmerId` parameter is a 422 rather than silently
 * ignored: the farmer always comes from the resolved scope. `from`/`to` bound `appliedOn`, both inclusive.
 */
export const listFarmCropInputsQuery = z
  .object({
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    inputType: inputTypeEnum.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .strict()
  .refine((q) => q.from === undefined || q.to === undefined || q.from <= q.to, {
    message: 'from must be on or before to',
    path: ['from'],
  });
export type ListFarmCropInputsQuery = z.infer<typeof listFarmCropInputsQuery>;

export const cropInputResponse = z.object({
  id: z.string().uuid(),
  farmerId: z.string().uuid(),
  farmCropId: z.string().uuid(),
  inputType: inputTypeEnum,
  inputName: z.string(),
  appliedOn: z.string(),
  quantity: z.number(),
  unit: inputUnitEnum,
  nitrogenPct: z.number().nullable(),
  phosphorusPct: z.number().nullable(),
  potassiumPct: z.number().nullable(),
  applicationMethod: z.string().nullable(),
  costInr: moneyResponse.nullable(),
  notes: z.string().nullable(),
  purpose: z.string().nullable(),
  targetPest: z.string().nullable(),
  appliedBy: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type CropInputResponse = z.infer<typeof cropInputResponse>;

export const listCropInputsResponse = z.object({
  items: z.array(cropInputResponse),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListCropInputsResponse = z.infer<typeof listCropInputsResponse>;

/** One row of the farm-wide list: the per-crop item plus the crop and plot it was applied to. */
export const farmCropInputResponse = cropInputResponse.extend({
  cropName: z.string(),
  plotName: z.string(),
});
export type FarmCropInputResponse = z.infer<typeof farmCropInputResponse>;

export const listFarmCropInputsResponse = z.object({
  items: z.array(farmCropInputResponse),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListFarmCropInputsResponse = z.infer<typeof listFarmCropInputsResponse>;

export const cropNpkContributionResponse = z.object({
  farmCropId: z.string().uuid(),
  totalInputsCount: z.number().int(),
  totalQuantityKg: z.number(),
  totalNitrogenKg: z.number(),
  totalPhosphorusKg: z.number(),
  totalPotassiumKg: z.number(),
  totalCostInr: moneyResponse,
});
export type CropNpkContributionResponse = z.infer<typeof cropNpkContributionResponse>;
