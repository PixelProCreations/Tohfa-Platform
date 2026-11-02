/**
 * BR-79 / BR-125: storage locations of a warehouse. Schemas must match docs/openapi.yaml
 * (/warehouses/{id}/storage-locations). Request bodies are `.strict()`; `capacityKg` is a decimal
 * STRING (never a JSON number) so a quantity is never rounded by a float on the way in or out.
 * `parentId` places a location in the warehouse's tree (BR-125); `level` and the usage figures are
 * derived at read time and never accepted in a request.
 */
import { z } from 'zod';

export const warehouseIdParams = z.object({ id: z.string().uuid('warehouse id must be a UUID') }).strict();
export const storageLocationParams = z
  .object({
    id: z.string().uuid('warehouse id must be a UUID'),
    locationId: z.string().uuid('storage location id must be a UUID'),
  })
  .strict();

const code = z.string().trim().min(1).max(40);
const name = z.string().trim().min(1).max(120);
const locationType = z.string().trim().min(1).max(40);

/** numeric(12,3): at most 9 integer digits and 3 decimals, strictly positive (the table CHECK). */
const capacityKg = z
  .string()
  .regex(/^\d{1,9}(\.\d{1,3})?$/, 'capacityKg must be a decimal string with at most 9 integer digits and 3 decimals')
  .refine((value) => /[1-9]/.test(value), 'capacityKg must be greater than 0');

/** POST /v1/warehouses/{id}/storage-locations */
export const createStorageLocationBody = z
  .object({
    code,
    name,
    locationType: locationType.nullable().optional(),
    capacityKg: capacityKg.nullable().optional(),
    /** BR-125: optional parent, a live active location of the same warehouse. */
    parentId: z.string().uuid('parentId must be a UUID').optional(),
  })
  .strict();
export type CreateStorageLocationBody = z.infer<typeof createStorageLocationBody>;

/** PATCH /v1/warehouses/{id}/storage-locations/{locationId}. The code is immutable and absent on purpose. */
export const updateStorageLocationBody = z
  .object({
    name: name.optional(),
    locationType: locationType.nullable().optional(),
    capacityKg: capacityKg.nullable().optional(),
    isActive: z.boolean().optional(),
    /** BR-125: move under another location of the same warehouse; null makes it a root. */
    parentId: z.string().uuid('parentId must be a UUID').nullable().optional(),
  })
  .strict()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one field must be provided',
  });
export type UpdateStorageLocationBody = z.infer<typeof updateStorageLocationBody>;

/** GET /v1/warehouses/{id}/storage-locations */
export const listStorageLocationsQuery = z
  .object({
    /** Free-text match on code, name or type. */
    q: z.string().trim().min(1).max(120).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListStorageLocationsQuery = z.infer<typeof listStorageLocationsQuery>;

/** Wire representation of one storage location. Keep aligned with docs/openapi.yaml. */
export const storageLocationResponse = z.object({
  id: z.string().uuid(),
  warehouseId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  locationType: z.string().nullable(),
  capacityKg: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  /** BR-125: the tree position, derived at read time (root = 0). */
  parentId: z.string().uuid().nullable(),
  level: z.number().int().min(0),
  /** BR-125: qty_available of the ACTIVE non-empty batches linked to this location itself. */
  usedKg: z.string(),
  batchCount: z.number().int().min(0),
  /** BR-125: the same figures for this location and all its descendants. */
  subtreeUsedKg: z.string(),
  subtreeBatchCount: z.number().int().min(0),
});
export type StorageLocation = z.infer<typeof storageLocationResponse>;

export const listStorageLocationsResponse = z.object({
  items: z.array(storageLocationResponse),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type ListStorageLocationsResponse = z.infer<typeof listStorageLocationsResponse>;

/** `numeric(12,3)::text` always has three decimals; a request value is padded the same way to compare. */
export function normaliseKg(value: string): string {
  const [whole = '0', fraction = ''] = value.split('.');
  return `${whole.replace(/^0+(?=\d)/, '')}.${fraction.padEnd(3, '0')}`;
}
