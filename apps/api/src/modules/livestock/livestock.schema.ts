/**
 * Livestock (livestock_animals + livestock_production_logs +
 * livestock_lifecycle_events; BR-47). Zod schemas and inferred types only —
 * no SQL, no HTTP, no business rules. See db/migrations/0024_livestock.sql
 * for the tables behind these shapes.
 *
 * Backs the farmer app's mock livestock screens: LivestockScreen (animal
 * list), RegisterAnimalScreen (create/edit form), AnimalDetailScreen,
 * DairyProduceScreen (production logging) and SaleTransferCullScreen
 * (lifecycle events). Mobile wiring itself is a separate follow-up task —
 * these shapes only need to be stable enough for that task to consume.
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const animalSpecies = ['CATTLE', 'BUFFALO', 'GOAT', 'POULTRY', 'SHEEP'] as const;
export type AnimalSpecies = (typeof animalSpecies)[number];

export const animalGenders = ['FEMALE', 'MALE'] as const;
export type AnimalGender = (typeof animalGenders)[number];

export const animalSources = ['BORN_ON_FARM', 'PURCHASED'] as const;
export type AnimalSource = (typeof animalSources)[number];

export const organicStatuses = ['ORGANIC', 'TRANSITIONING', 'CONVENTIONAL'] as const;
export type OrganicStatus = (typeof organicStatuses)[number];

/** `ACTIVE` is the only status an animal can return to `farmer.livestock.view_own`'s
 *  default list; the rest are terminal, each set exactly once by a lifecycle event (BR-47). */
export const lifecycleStatuses = ['ACTIVE', 'SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED'] as const;
export type LifecycleStatus = (typeof lifecycleStatuses)[number];

/** livestock_lifecycle_events.event_type. Deliberately the same four non-ACTIVE
 *  values as lifecycleStatuses — recording an event sets the animal's status
 *  to match (BR-47b). */
export const lifecycleEventTypes = ['SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED'] as const;
export type LifecycleEventType = (typeof lifecycleEventTypes)[number];

export const dairyProductTypes = ['MILK', 'CURD', 'PANEER', 'BUTTER', 'GHEE', 'BUTTERMILK', 'CHEESE', 'EGGS'] as const;
export type DairyProductType = (typeof dairyProductTypes)[number];

export const productionUnits = ['LITERS', 'KG', 'COUNT'] as const;
export type ProductionUnit = (typeof productionUnits)[number];

/**
 * The mock's fixed `DAIRY_PRODUCTS` catalog: each product type always logs in
 * exactly one unit. `createProductionLogBody` cross-checks the client's
 * `unit` against this map (`VALIDATION_FAILED` on a mismatch) rather than
 * silently trusting whichever unit the client sends — a MILK entry logged in
 * KG would corrupt every yield rollup the produce history view computes.
 */
export const DAIRY_PRODUCT_UNITS: Record<DairyProductType, ProductionUnit> = {
  MILK: 'LITERS',
  CURD: 'KG',
  PANEER: 'KG',
  BUTTER: 'KG',
  GHEE: 'LITERS',
  BUTTERMILK: 'LITERS',
  CHEESE: 'KG',
  EGGS: 'COUNT',
};

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export const animalIdParams = z.object({ animalId: z.string().uuid('animalId must be a UUID') }).strict();
export type AnimalIdParams = z.infer<typeof animalIdParams>;

/** Admin route only: GET /admin/farmers/{farmerId}/livestock/animals */
export const farmerIdParams = z.object({ farmerId: z.string().uuid('farmerId must be a UUID') }).strict();
export type FarmerIdParams = z.infer<typeof farmerIdParams>;

// ---------------------------------------------------------------------------
// livestock_animals — create / update
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/livestock/animals
 *
 * There is deliberately no `farmId` field: an animal belongs to the farmer's
 * operation as a whole, not one plot (root CLAUDE.md's farm-land-locations
 * doctrine — one operation, land in multiple locations), so the service picks
 * the caller's own farm the same way farm-diary.service.ts's `listPlots`
 * aggregates across every farm the scope owns. There is also no
 * `lifecycleStatus` field — new animals always start `ACTIVE`, and moving off
 * it only ever happens via `recordLifecycleEventBody` (BR-47).
 */
export const createAnimalBody = z
  .object({
    tag: z.string().trim().min(1).max(40),
    name: z.string().trim().min(1).max(120).optional(),
    species: z.enum(animalSpecies),
    breed: z.string().trim().min(1).max(120).optional(),
    gender: z.enum(animalGenders),
    dateOfBirth: isoDate.optional(),
    source: z.enum(animalSources).default('BORN_ON_FARM'),
    purchasedOn: isoDate.optional(),
    sourceFarm: z.string().trim().min(1).max(160).optional(),
    organicStatus: z.enum(organicStatuses).default('CONVENTIONAL'),
    withdrawalUntil: isoDate.optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict()
  .refine((body) => body.source === 'PURCHASED' || (body.purchasedOn === undefined && body.sourceFarm === undefined), {
    message: 'purchasedOn/sourceFarm only apply when source is PURCHASED',
    path: ['source'],
  });
export type CreateAnimalBody = z.infer<typeof createAnimalBody>;

/**
 * PATCH /v1/farmers/me/livestock/animals/{animalId}
 *
 * `lifecycleStatus` is NOT editable here — it only ever changes as the side
 * effect of `POST .../lifecycle-events` (BR-47), the same way farm_crops'
 * `status` field can only move into `GROWING` through a dedicated,
 * constraint-checked path rather than a free-form PATCH.
 */
export const updateAnimalBody = z
  .object({
    tag: z.string().trim().min(1).max(40).optional(),
    name: z.string().trim().min(1).max(120).nullable().optional(),
    species: z.enum(animalSpecies).optional(),
    breed: z.string().trim().min(1).max(120).nullable().optional(),
    gender: z.enum(animalGenders).optional(),
    dateOfBirth: isoDate.nullable().optional(),
    source: z.enum(animalSources).optional(),
    purchasedOn: isoDate.nullable().optional(),
    sourceFarm: z.string().trim().min(1).max(160).nullable().optional(),
    organicStatus: z.enum(organicStatuses).optional(),
    withdrawalUntil: isoDate.nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateAnimalBody = z.infer<typeof updateAnimalBody>;

/** GET /v1/farmers/me/livestock/animals — cursor pagination, same envelope as crops. */
export const listAnimalsQuery = z
  .object({
    species: z.enum(animalSpecies).optional(),
    /** Omitted defaults to `ACTIVE` only (root CLAUDE.md task doctrine: an
     *  animal that has left the herd drops off the default list). Pass
     *  explicitly to see history, e.g. `lifecycleStatus=SOLD`. */
    lifecycleStatus: z.enum(lifecycleStatuses).optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListAnimalsQuery = z.infer<typeof listAnimalsQuery>;

// ---------------------------------------------------------------------------
// livestock_lifecycle_events
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/livestock/animals/{animalId}/lifecycle-events
 *
 * `salePricePaise` is integer paise, never a float (root CLAUDE.md §2.2).
 * `eventDate` defaults to today when omitted, the same as
 * `livestock_lifecycle_events.event_date`'s column default.
 */
export const recordLifecycleEventBody = z
  .object({
    eventType: z.enum(lifecycleEventTypes),
    eventDate: isoDate.optional(),
    counterparty: z.string().trim().min(1).max(160).optional(),
    salePricePaise: z.number().int('salePricePaise must be a whole number').min(0).optional(),
    reason: z.string().trim().min(1).max(500).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();
export type RecordLifecycleEventBody = z.infer<typeof recordLifecycleEventBody>;

// ---------------------------------------------------------------------------
// livestock_production_logs — create
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/livestock/production-logs
 *
 * Covers all three of DairyProduceScreen's logging shapes: per-animal milk
 * yield (`animalId` + `sessions`), value-added produce batches (`batchInfo`),
 * and flock-level egg collection (`animalId` omitted, `productType: 'EGGS'`).
 * `unit` must match `productType`'s fixed unit in `DAIRY_PRODUCT_UNITS` — a
 * mismatch is `VALIDATION_FAILED`, not silently accepted.
 */
export const createProductionLogBody = z
  .object({
    animalId: z.string().uuid('animalId must be a UUID').optional(),
    productType: z.enum(dairyProductTypes),
    quantity: z.number().positive(),
    unit: z.enum(productionUnits),
    loggedOn: isoDate.optional(),
    batchInfo: z.string().trim().min(1).max(500).optional(),
    sessions: z.number().int().positive().optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict()
  .refine((body) => DAIRY_PRODUCT_UNITS[body.productType] === body.unit, {
    message: 'unit does not match this productType\'s fixed unit (see DAIRY_PRODUCT_UNITS)',
    path: ['unit'],
  });
export type CreateProductionLogBody = z.infer<typeof createProductionLogBody>;

/** GET /v1/farmers/me/livestock/production-logs */
export const listProductionLogsQuery = z
  .object({
    productType: z.enum(dairyProductTypes).optional(),
    animalId: z.string().uuid('animalId must be a UUID').optional(),
    dateFrom: isoDate.optional(),
    dateTo: isoDate.optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListProductionLogsQuery = z.infer<typeof listProductionLogsQuery>;

// ---------------------------------------------------------------------------
// Responses — keep aligned with docs/openapi.yaml
// ---------------------------------------------------------------------------

/**
 * Allow-list, not a raw table dump: `farm_id` never leaves this file — the
 * caller already knows it is asking about their own herd (or, on the admin
 * route, a specific `farmerId` passed in the URL), so echoing the internal
 * `farm_id` back would give the client an id it has no other use for.
 */
export const animalResponse = z.object({
  id: z.string().uuid(),
  tag: z.string(),
  name: z.string().nullable(),
  species: z.enum(animalSpecies),
  breed: z.string().nullable(),
  gender: z.enum(animalGenders),
  dateOfBirth: z.string().nullable(),
  source: z.enum(animalSources),
  purchasedOn: z.string().nullable(),
  sourceFarm: z.string().nullable(),
  organicStatus: z.enum(organicStatuses),
  lifecycleStatus: z.enum(lifecycleStatuses),
  withdrawalUntil: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type AnimalResponse = z.infer<typeof animalResponse>;

export const listAnimalsResponse = z.object({
  items: z.array(animalResponse),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListAnimalsResponse = z.infer<typeof listAnimalsResponse>;

export const productionLogResponse = z.object({
  id: z.string().uuid(),
  animalId: z.string().uuid().nullable(),
  productType: z.enum(dairyProductTypes),
  quantity: z.number(),
  unit: z.enum(productionUnits),
  loggedOn: z.string(),
  batchInfo: z.string().nullable(),
  sessions: z.number().int().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type ProductionLogResponse = z.infer<typeof productionLogResponse>;

export const listProductionLogsResponse = z.object({
  items: z.array(productionLogResponse),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListProductionLogsResponse = z.infer<typeof listProductionLogsResponse>;

/** GET /v1/admin/farmers/{farmerId}/livestock/animals — same allow-list as the farmer-facing response. */
export const listAdminAnimalsResponse = z.object({ items: z.array(animalResponse) });
export type ListAdminAnimalsResponse = z.infer<typeof listAdminAnimalsResponse>;
