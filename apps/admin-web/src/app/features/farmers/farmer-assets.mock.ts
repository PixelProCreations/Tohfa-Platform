/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Farmer Records → Assets (SA-M3-S13 and its Record Service / Edit Asset / Retire Asset modals).
 * The farmer-facing spec has farm assets (`apps/api/src/modules/farm-assets`, docs/openapi.yaml
 * `FarmAssetCreateRequest`, db/migrations/0025_farm_assets.sql) but no admin endpoints, no service
 * records, no asset type / source fields and no retirement reasons. Where the spec defines a value it is
 * used below and cited; where it does not, the approved design's value is kept and marked "design-only".
 * When the tab is integrated, the admin contract goes into docs/openapi.yaml first and each action gets
 * its own `requirePermission` code in docs/rbac.json (today only `admin.assets.view_all` exists).
 * Thumbnails are neutral placeholder tiles, never images.
 */

/** Spec `category`: 'TOOL' | 'EQUIPMENT' | 'MACHINERY' (farm-assets.schema.ts, 0025_farm_assets.sql CHECK). */
export type AssetCategoryCode = 'TOOL' | 'EQUIPMENT' | 'MACHINERY';

/** Design-only: the spec has no asset source / acquisition field. */
export type AssetSourceCode = 'FARMER' | 'ADMIN_ON_BEHALF';

export interface AssetOption<T extends string = string> {
  readonly code: T;
  readonly label: string;
}

export interface FarmerAssetMock {
  /** Display code as designed ("AST-0001"). The spec's asset id is a UUID; this is design-only. */
  readonly code: string;
  readonly name: string;
  /** Design-only "Asset Type" (the spec has free-text `name` only). */
  readonly typeCode: string;
  readonly category: AssetCategoryCode;
  readonly source: AssetSourceCode;
  /** ISO dates (yyyy-MM-dd), handled in UTC. Spec `purchasedOn`. */
  readonly purchasedOn: string;
  /** Spec `lastServicedOn`; null when never serviced. */
  readonly lastServicedOn: string | null;
  /** Spec `serviceIntervalDays` (int > 0). */
  readonly serviceIntervalDays: number;
}

/**
 * "Today" for the overdue calculation. A fixed date so the placeholder screen renders the same as the
 * design regardless of the real clock — 28 Oct 2026 is the default service date in the design's
 * Record Service modal.
 */
export const ASSETS_REFERENCE_DATE = '2026-10-28';

/** Farmer shown in the modal banners when the host does not pass one (the design's farmer). */
export const ASSETS_DEFAULT_FARMER = { name: 'Ramesh Kumar', code: 'FMR-00124' } as const;

/** Spec categories (farm-assets.schema.ts `category`), labelled as the design shows them. */
export const ASSET_CATEGORIES: readonly AssetOption<AssetCategoryCode>[] = [
  { code: 'TOOL', label: 'Tool' },
  { code: 'EQUIPMENT', label: 'Equipment' },
  { code: 'MACHINERY', label: 'Machinery' },
];

/**
 * Design-only asset types: the spec has no type field. Power tiller and Sprayer are the design's values;
 * the rest are placeholders so the select is usable.
 */
export const ASSET_TYPES: readonly AssetOption[] = [
  { code: 'POWER_TILLER', label: 'Power tiller' },
  { code: 'SPRAYER', label: 'Sprayer' },
  { code: 'TRACTOR', label: 'Tractor' },
  { code: 'WATER_PUMP', label: 'Water pump' },
  { code: 'HAND_TOOL', label: 'Hand tool' },
  { code: 'OTHER', label: 'Other' },
];

/** Design-only sources. "Added by the farmer" is the design's value. */
export const ASSET_SOURCES: readonly AssetOption<AssetSourceCode>[] = [
  { code: 'FARMER', label: 'Added by the farmer' },
  { code: 'ADMIN_ON_BEHALF', label: 'Added by admin on behalf of farmer' },
];

/**
 * Design-only service types: the spec has no service records. "Routine maintenance" is the design's
 * value; the rest are placeholders.
 */
export const ASSET_SERVICE_TYPES: readonly AssetOption[] = [
  { code: 'ROUTINE_MAINTENANCE', label: 'Routine maintenance' },
  { code: 'REPAIR', label: 'Repair' },
  { code: 'PART_REPLACEMENT', label: 'Part replacement' },
  { code: 'INSPECTION', label: 'Inspection' },
];

/**
 * Design-only retirement reasons: the spec retires an asset with a body-less soft delete
 * (`DELETE /farmers/me/farm-assets/{assetId}`), so it has no reason list. Placeholders.
 */
export const ASSET_RETIRE_REASONS: readonly AssetOption[] = [
  { code: 'SOLD', label: 'Sold' },
  { code: 'DAMAGED', label: 'Damaged beyond repair' },
  { code: 'LOST_STOLEN', label: 'Lost or stolen' },
  { code: 'REPLACED', label: 'Replaced / obsolete' },
  { code: 'OTHER', label: 'Other' },
];

/**
 * Limits.
 * - service notes 300, retirement remarks 250: design values (no spec counterpart).
 * - cost: whole rupees, at most 9 digits. Spec `costPaise` is a non-negative integer; the design's
 *   service cost has no spec counterpart, so the asset cost's integer rule is borrowed.
 * - attachment PDF/JPG/PNG up to 10 MB: design values; no upload happens in this UI.
 */
export const ASSET_LIMITS = {
  serviceNotesMax: 300,
  retireRemarksMax: 250,
  providerMax: 160,
  costMaxChars: 9,
  attachmentMaxBytes: 10 * 1024 * 1024,
  attachmentTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  attachmentAccept: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
} as const;

/** The two assets in the approved design. */
export const FARMER_ASSETS_MOCK: readonly FarmerAssetMock[] = [
  {
    code: 'AST-0001',
    name: 'Power tiller',
    typeCode: 'POWER_TILLER',
    category: 'MACHINERY',
    source: 'FARMER',
    purchasedOn: '2024-11-27',
    lastServicedOn: '2026-04-11',
    serviceIntervalDays: 180,
  },
  {
    code: 'AST-0002',
    name: 'Sprayer',
    typeCode: 'SPRAYER',
    category: 'EQUIPMENT',
    source: 'FARMER',
    purchasedOn: '2026-01-01',
    lastServicedOn: '2026-09-28',
    serviceIntervalDays: 90,
  },
];
