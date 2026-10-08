import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const treePlantingIdParams = z
  .object({
    id: z.string().uuid('id must be a UUID'),
  })
  .strict();
export type TreePlantingIdParams = z.infer<typeof treePlantingIdParams>;

export const createTreePlantingBody = z
  .object({
    farmId: z.string().uuid('farmId must be a UUID').optional(),
    plotId: z.string().uuid('plotId must be a UUID').optional(),
    speciesName: z.string().trim().min(1, 'speciesName is required').max(200),
    treeCount: z.number().int('treeCount must be an integer').min(1, 'treeCount must be greater than 0'),
    plantedOn: isoDate.optional(),
    zoneName: z.string().trim().max(200).optional(),
    purpose: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateTreePlantingBody = z.infer<typeof createTreePlantingBody>;

export const updateTreePlantingBody = z
  .object({
    farmId: z.string().uuid('farmId must be a UUID').nullable().optional(),
    plotId: z.string().uuid('plotId must be a UUID').nullable().optional(),
    speciesName: z.string().trim().min(1).max(200).optional(),
    treeCount: z.number().int('treeCount must be an integer').min(1, 'treeCount must be greater than 0').optional(),
    plantedOn: isoDate.nullable().optional(),
    zoneName: z.string().trim().max(200).nullable().optional(),
    purpose: z.string().trim().max(500).nullable().optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateTreePlantingBody = z.infer<typeof updateTreePlantingBody>;

export const listTreePlantingsQuery = z
  .object({
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListTreePlantingsQuery = z.infer<typeof listTreePlantingsQuery>;

export const treePlantingResponse = z.object({
  id: z.string().uuid(),
  farmerId: z.string().uuid(),
  farmId: z.string().uuid().nullable(),
  plotId: z.string().uuid().nullable(),
  speciesName: z.string(),
  treeCount: z.number().int(),
  plantedOn: z.string().nullable(),
  zoneName: z.string().nullable(),
  purpose: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type TreePlantingResponse = z.infer<typeof treePlantingResponse>;

export const listTreePlantingsResponse = z.object({
  items: z.array(treePlantingResponse),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
export type ListTreePlantingsResponse = z.infer<typeof listTreePlantingsResponse>;
