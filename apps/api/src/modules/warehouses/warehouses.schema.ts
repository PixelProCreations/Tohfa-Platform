/**
 * REFERENCE PATTERN — copy this structure for every new module. See CLAUDE.md.
 *
 * <name>.schema.ts holds ONLY Zod schemas and the types inferred from them.
 * Rules:
 *  - Request schemas are the single source of truth for input types; never
 *    hand-write an interface that duplicates one.
 *  - Response schemas exist so the shape stays in step with docs/openapi.yaml.
 *  - `.strict()` on request bodies: an unexpected field is a client bug and we
 *    would rather fail loudly than silently ignore it.
 *  - Never put SQL, HTTP or business logic in this file.
 */
import { z } from 'zod';

/** Matches the CHECK constraint on `warehouses.type` in db/migrations/0005. */
export const warehouseTypes = ['MAIN', 'SUB'] as const;
export type WarehouseType = (typeof warehouseTypes)[number];

/** GET /v1/warehouses/:id */
export const warehouseIdParams = z
  .object({
    id: z.string().uuid('warehouse id must be a UUID'),
  })
  .strict();
export type WarehouseIdParams = z.infer<typeof warehouseIdParams>;

/** GET /v1/warehouses */
export const listWarehousesQuery = z
  .object({
    /** Free-text match on name or code. */
    q: z.string().trim().min(1).max(120).optional(),
    type: z.enum(warehouseTypes).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListWarehousesQuery = z.infer<typeof listWarehousesQuery>;

/** Wire representation of one warehouse. Keep aligned with docs/openapi.yaml. */
export const warehouseResponse = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  type: z.enum(warehouseTypes),
  city: z.string().nullable(),
  capacityKg: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type WarehouseResponse = z.infer<typeof warehouseResponse>;

/**
 * Full wire representation (list and detail share it). It extends the original
 * summary: `capacityKg` becomes a 3-decimal string, like every other quantity in
 * the API, and the columns the table already holds are exposed.
 * `operatingHours` is the raw jsonb — its format is not specified anywhere yet,
 * so it is passed through untouched.
 */
export const warehouseDetailResponse = warehouseResponse.extend({
  capacityKg: z.string().nullable(),
  address: z.string().nullable(),
  pincode: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  contactPhone: z.string().nullable(),
  operatingHours: z.unknown(),
  isMarketDayVenue: z.boolean(),
  marketDayOfWeek: z.number().int().nullable(),
});
export type WarehouseDetail = z.infer<typeof warehouseDetailResponse>;

export const listWarehousesResponse = z.object({
  items: z.array(warehouseDetailResponse),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});
export type ListWarehousesResponse = z.infer<typeof listWarehousesResponse>;

/**
 * Decimal string for `numeric(12,3)`: at most 9 integer digits and 3 decimals,
 * strictly positive (the table's CHECK is `capacity_kg > 0`). A JSON number is
 * refused on purpose, so the value is never rounded by a float on the way in.
 */
const capacityKgString = z
  .string()
  .regex(/^\d{1,9}(\.\d{1,3})?$/, 'capacityKg must be a decimal string with at most 9 integer digits and 3 decimals')
  .refine((value) => /[1-9]/.test(value), 'capacityKg must be greater than 0');

/** PATCH /v1/warehouses/:id/capacity */
export const updateCapacityBody = z.object({ capacityKg: capacityKgString }).strict();
export type UpdateCapacityBody = z.infer<typeof updateCapacityBody>;

/**
 * GET and PATCH /v1/warehouses/:id/capacity. `usedKg` is a read-only derivation
 * (the sum of ACTIVE batch `qty_available`), not a business rule. `capacityKg`
 * is null while no capacity has been set, and so are the two values that depend
 * on it. Nothing is clamped: `availableKg` is negative when over capacity.
 */
export const warehouseCapacityResponse = z.object({
  warehouseId: z.string().uuid(),
  capacityKg: z.string().nullable(),
  usedKg: z.string(),
  availableKg: z.string().nullable(),
  utilizationPercent: z.number().nullable(),
});
/** The capacity derivation as the repo reads it (BR-66), before the threshold is attached. */
export type WarehouseCapacityResponse = z.infer<typeof warehouseCapacityResponse>;

/**
 * BR-131: the response adds `thresholdPercent`, `system_config.alert_capacity_utilization_percent`
 * as the CAPACITY_NEAR_FULL alert reads it (BR-77f); null when missing or unusable.
 */
export const warehouseCapacityViewResponse = warehouseCapacityResponse.extend({
  thresholdPercent: z.number().min(0).max(100).nullable(),
});
export type WarehouseCapacityView = z.infer<typeof warehouseCapacityViewResponse>;
