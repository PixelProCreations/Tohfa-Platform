import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

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
    quantity: z.number().positive('quantity must be greater than 0'),
    unit: inputUnitEnum,
    nitrogenPct: z.number().min(0).max(100).optional(),
    phosphorusPct: z.number().min(0).max(100).optional(),
    potassiumPct: z.number().min(0).max(100).optional(),
    applicationMethod: z.string().trim().max(100).optional(),
    costInr: z.number().min(0).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateCropInputBody = z.infer<typeof createCropInputBody>;

export const updateCropInputBody = z
  .object({
    inputType: inputTypeEnum.optional(),
    inputName: z.string().trim().min(1).max(200).optional(),
    appliedOn: isoDate.optional(),
    quantity: z.number().positive('quantity must be greater than 0').optional(),
    unit: inputUnitEnum.optional(),
    nitrogenPct: z.number().min(0).max(100).nullable().optional(),
    phosphorusPct: z.number().min(0).max(100).nullable().optional(),
    potassiumPct: z.number().min(0).max(100).nullable().optional(),
    applicationMethod: z.string().trim().max(100).nullable().optional(),
    costInr: z.number().min(0).nullable().optional(),
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
  costInr: z.number().nullable(),
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
  totalCostInr: z.number(),
});
export type CropNpkContributionResponse = z.infer<typeof cropNpkContributionResponse>;
