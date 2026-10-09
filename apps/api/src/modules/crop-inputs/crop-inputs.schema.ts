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

export const inputTypeEnum = z.enum(['FERTILIZER', 'MANURE', 'BIO_INPUT', 'PESTICIDE', 'OTHER']);
export type InputType = z.infer<typeof inputTypeEnum>;

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
