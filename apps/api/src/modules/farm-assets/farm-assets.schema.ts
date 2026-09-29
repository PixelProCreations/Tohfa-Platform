/**
 * Farm assets (farm_assets) — the maintenance-tracked tool/equipment/machinery
 * register behind MachineryListScreen/ToolsListScreen/EquipmentListScreen.tsx
 * (and their Add/Edit counterparts). Zod schemas and inferred types only —
 * no SQL, no HTTP, no business rules. See db/migrations/0025_farm_assets.sql
 * for the table.
 *
 * ONE table, one module, for all three mock screens: they are the same
 * concept (a maintenance-tracked farm asset) with a couple of category-
 * specific extra fields, exactly the consolidation root CLAUDE.md's
 * "three similar lines is better than a premature abstraction" principle
 * argues FOR here — three near-identical tables would be the actual
 * premature duplication.
 *
 * `status`/`dueNote` are NOT stored (see the migration's header comment and
 * `next_service_due_on`'s column comment) — they are computed in
 * farm-assets.service.ts from `next_service_due_on` vs `current_date`, the
 * same "computed at read time, never stored" doctrine
 * farm-diary.schema.ts documents for `totalLabourCostPaise`.
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const farmAssetCategories = ['TOOL', 'EQUIPMENT', 'MACHINERY'] as const;
export type FarmAssetCategory = (typeof farmAssetCategories)[number];

/**
 * Display-only, computed at read time from next_service_due_on vs
 * current_date (Asia/Kolkata) — never a database column. DUE_SOON's
 * threshold is `system_config.asset_service_due_soon_days` (a specification
 * gap placeholder, see db/seed/001_reference.sql), read the same way
 * certifications.service.ts reads cert_expiry_warning_days — never a literal
 * in this service.
 */
export const farmAssetStatuses = ['OK', 'DUE_SOON', 'OVERDUE'] as const;
export type FarmAssetStatus = (typeof farmAssetStatuses)[number];

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export const farmAssetIdParams = z.object({ assetId: z.string().uuid('assetId must be a UUID') }).strict();
export type FarmAssetIdParams = z.infer<typeof farmAssetIdParams>;

/** GET /v1/admin/farmers/{farmerId}/farm-assets */
export const farmerIdParams = z.object({ farmerId: z.string().uuid('farmerId must be a UUID') }).strict();
export type FarmerIdParams = z.infer<typeof farmerIdParams>;

// ---------------------------------------------------------------------------
// farm_assets — create / update
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/farm-assets
 *
 * There is deliberately no `farmerId` field: ownership is always derived
 * server-side from `farms.farmer_id` (root CLAUDE.md §2.1), and `.strict()`
 * rejects a client that tries to send one. `farmId` DOES travel in the body
 * (this module has no `/farms/{farmId}/...` nesting, unlike crops' plots) —
 * the farm it names must still be one of the caller's own, checked in the
 * service exactly as crops checks `plotId`.
 *
 * `serviceIntervalDays` is required here even though the database column is
 * nullable (see the migration): every one of AddToolScreen/AddMachineryScreen/
 * AddEquipmentScreen.tsx marks "Service interval (days)" with a required
 * asterisk, so the API matches the UI's own contract rather than being looser
 * than it.
 */
export const createFarmAssetBody = z
  .object({
    farmId: z.string().uuid('farmId must be a UUID'),
    category: z.enum(farmAssetCategories),
    name: z.string().trim().min(1).max(160),
    makeModel: z.string().trim().min(1).max(160).optional(),
    fuelType: z.string().trim().min(1).max(80).optional(),
    coverageAreaAcres: z.number().min(0).optional(),
    purchasedOn: isoDate.optional(),
    costPaise: z.number().int('costPaise must be a whole number').min(0).optional(),
    serviceIntervalDays: z.number().int('serviceIntervalDays must be a whole number').positive(),
    lastServicedOn: isoDate.optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();
export type CreateFarmAssetBody = z.infer<typeof createFarmAssetBody>;

/**
 * PATCH /v1/farmers/me/farm-assets/{assetId}
 *
 * `farmId` / `category` are NOT editable — re-pointing an asset at a
 * different land location or re-categorising it (TOOL -> MACHINERY) is a
 * delete-and-recreate, not an edit, the same reasoning crops.schema.ts
 * applies to `plotId`/`cropMasterId`. `lastServicedOn` is how a farmer
 * records that a service happened — `next_service_due_on` recomputes itself
 * (it is a generated column) the moment this write lands.
 */
export const updateFarmAssetBody = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    makeModel: z.string().trim().min(1).max(160).nullable().optional(),
    fuelType: z.string().trim().min(1).max(80).nullable().optional(),
    coverageAreaAcres: z.number().min(0).nullable().optional(),
    purchasedOn: isoDate.nullable().optional(),
    costPaise: z.number().int('costPaise must be a whole number').min(0).nullable().optional(),
    serviceIntervalDays: z.number().int('serviceIntervalDays must be a whole number').positive().nullable().optional(),
    lastServicedOn: isoDate.nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateFarmAssetBody = z.infer<typeof updateFarmAssetBody>;

/**
 * GET /v1/farmers/me/farm-assets — cursor pagination, same envelope as crops/
 * farm-diary. `dueOnly=true` returns DUE_SOON and OVERDUE only (both are
 * "due" in FarmInventoryScreen.tsx's per-category `dueCount` badge — that
 * screen's own subtitle reads "4 due soon · 4 overdue", one combined count),
 * never just OVERDUE alone.
 */
export const listFarmAssetsQuery = z
  .object({
    category: z.enum(farmAssetCategories).optional(),
    dueOnly: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListFarmAssetsQuery = z.infer<typeof listFarmAssetsQuery>;

// ---------------------------------------------------------------------------
// Responses — keep aligned with docs/openapi.yaml
// ---------------------------------------------------------------------------

export const farmAssetResponse = z.object({
  id: z.string().uuid(),
  farmId: z.string().uuid(),
  category: z.enum(farmAssetCategories),
  name: z.string(),
  makeModel: z.string().nullable(),
  fuelType: z.string().nullable(),
  coverageAreaAcres: z.number().nullable(),
  purchasedOn: z.string().nullable(),
  costPaise: z.number().int().nullable(),
  serviceIntervalDays: z.number().int().nullable(),
  lastServicedOn: z.string().nullable(),
  nextServiceDueOn: z.string().nullable(),
  /** Computed at read time from nextServiceDueOn vs today — never stored. */
  status: z.enum(farmAssetStatuses),
  /** e.g. "12 days overdue" / "5 days away". Computed, never stored. Null when nextServiceDueOn is null. */
  dueNote: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type FarmAssetResponse = z.infer<typeof farmAssetResponse>;

export const listFarmAssetsResponse = z.object({
  items: z.array(farmAssetResponse),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListFarmAssetsResponse = z.infer<typeof listFarmAssetsResponse>;
