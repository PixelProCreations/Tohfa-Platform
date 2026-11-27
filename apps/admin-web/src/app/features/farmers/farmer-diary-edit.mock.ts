/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Option lists and limits for the Edit / Add Diary Entry screen (SA-M3-S10a). Where the farmer-facing
 * spec defines a value it is used here, with the source cited; where the approved design shows a value
 * the spec does not have, the design's value is kept and marked "design-only". There is no admin
 * (on-behalf) diary write endpoint yet — docs/openapi.yaml only has the farmer's own
 * `DiaryEntryCreateRequest` — so when this screen is integrated the admin contract goes into
 * docs/openapi.yaml first and the route gets its own `requirePermission` code in docs/rbac.json.
 */

/** One sub-activity. `key` is the spec's `category.sub_activity` key format. */
export interface DiaryActivityOption {
  readonly key: string;
  readonly label: string;
  /**
   * Labels that older placeholder data (farmer-records.mock.ts) uses for this activity, so an entry
   * from the Diary list can pre-select the matching option.
   */
  readonly aliases?: readonly string[];
}

export interface DiaryCategoryOption {
  readonly key: string;
  readonly label: string;
  /** Short labels used by farmer-records.mock.ts ("Nutrient", "Weed"). */
  readonly aliases?: readonly string[];
  readonly activities: readonly DiaryActivityOption[];
}

export interface DiaryPlotOption {
  readonly id: string;
  readonly name: string;
  readonly areaAcres: number;
}

export interface DiaryCropOption {
  readonly id: string;
  readonly name: string;
  /** The plot the crop is growing on. */
  readonly plotId: string;
}

export interface DiaryWorkerOption {
  readonly id: string;
  readonly name: string;
}

/** Per-entry detail the Diary list card does not carry (notes, worker lines, photos, audit line). */
export interface DiaryEntryDetailMock {
  readonly plotId: string;
  readonly categoryKey: string;
  readonly activityKey: string;
  readonly linkedCropId: string | null;
  readonly notes: string;
  readonly workers: readonly { readonly workerId: string; readonly hours: string; readonly wageRupees: string }[];
  readonly photoCount: number;
  /** ISO timestamp, formatted in UTC (the value is stored as the wall-clock time the design shows). */
  readonly lastUpdatedAt: string;
  readonly lastUpdatedBy: string;
}

/**
 * Validation limits.
 * - minutes 1–1,440: apps/api/src/modules/farm-diary/farm-diary.schema.ts (`minutes` max 1440) and
 *   BR-42c in docs/rules.md; the mobile app caps the input at 4 characters (diaryRules.ts).
 * - notes 500: design value. The spec allows 2,000 (`DIARY_NOTES_MAX_LENGTH`, mobile diaryRules.ts);
 *   the design's tighter limit is kept as instructed.
 * - photos 5: design-only. The spec has no per-entry photo cap.
 * - worker hours > 0 and ≤ 24, at most 2 decimals: farm-diary.schema.ts `hoursWorked`,
 *   db/migrations/0022_farm_diary_workforce.sql CHECK, BR-44a; 2 decimals from mobile attendanceHours.ts.
 * - wage: whole rupees, > 0, at most 8 digits (mobile input cap). The spec stores `wageRatePaise` as an
 *   integer per hour (BR-44b); the design labels the column "WAGE (₹)" without "/hr", so the screen keeps
 *   the design's label and the value stays an integer-rupee string — never a float.
 * - max 100 worker lines: farm-diary.schema.ts `workers` array max.
 */
export const DIARY_EDIT_LIMITS = {
  minutesMin: 1,
  minutesMax: 1440,
  minutesMaxChars: 4,
  notesMax: 500,
  photosMax: 5,
  hoursMax: 24,
  hoursMaxChars: 5,
  wageMaxChars: 8,
  workersMax: 100,
} as const;

/**
 * Activity categories and sub-activities: db/seed/001_reference.sql (12 categories, 43 sub-activities),
 * keys in the spec's `category.sub_activity` format (farm-diary.schema.ts). Labels are the seed `name`s.
 * The one design-only entry is `nutrient_mgmt.compost_application` ("Compost application"), which the
 * approved design shows and the seed does not have.
 */
export const DIARY_CATEGORIES: readonly DiaryCategoryOption[] = [
  {
    key: 'land_prep',
    label: 'Land Preparation',
    activities: [
      { key: 'land_prep.ploughing_tilling', label: 'Ploughing/Tilling' },
      { key: 'land_prep.bunding_leveling', label: 'Bunding/Land leveling' },
      { key: 'land_prep.soil_testing', label: 'Soil testing' },
      { key: 'land_prep.bed_formation', label: 'Bed Formation' },
    ],
  },
  {
    key: 'sowing_planting',
    label: 'Sowing / Planting',
    activities: [
      { key: 'sowing_planting.seed_sowing', label: 'Seed sowing' },
      { key: 'sowing_planting.transplanting', label: 'Transplanting (nursery to field)' },
      { key: 'sowing_planting.seed_treatment', label: 'Seed treatment' },
    ],
  },
  {
    key: 'nutrient_mgmt',
    label: 'Nutrient Management',
    aliases: ['Nutrient'],
    activities: [
      // Design-only: shown in the approved design, not in the seed.
      { key: 'nutrient_mgmt.compost_application', label: 'Compost application' },
      { key: 'nutrient_mgmt.composting', label: 'Composting (preparation)' },
      { key: 'nutrient_mgmt.manure_application', label: 'Manure application' },
      { key: 'nutrient_mgmt.biofertilizer_application', label: 'Bio-fertilizer application' },
      { key: 'nutrient_mgmt.green_manuring', label: 'Green manuring/Cover cropping' },
      { key: 'nutrient_mgmt.chemical_fertilizer_application', label: 'Fertilizer Application (Chemical)' },
      { key: 'nutrient_mgmt.foliar_spray', label: 'Foliar Spray' },
    ],
  },
  {
    key: 'water_mgmt',
    label: 'Water Management',
    activities: [
      { key: 'water_mgmt.irrigation', label: 'Irrigation (drip/sprinkler/flood)' },
      { key: 'water_mgmt.water_source_check', label: 'Water source check' },
      { key: 'water_mgmt.rainwater_harvesting', label: 'Rainwater harvesting activity' },
    ],
  },
  {
    key: 'weed_mgmt',
    label: 'Weed Management',
    aliases: ['Weed'],
    activities: [
      { key: 'weed_mgmt.weeding', label: 'Weeding (manual/mechanical)', aliases: ['Hand weeding'] },
      { key: 'weed_mgmt.mulching', label: 'Mulching' },
      { key: 'weed_mgmt.herbicide_application', label: 'Herbicide Application' },
    ],
  },
  {
    key: 'pest_mgmt',
    label: 'Pest Management',
    activities: [
      { key: 'pest_mgmt.pest_scouting', label: 'Pest scouting/monitoring' },
      { key: 'pest_mgmt.biopesticide_application', label: 'Bio-pesticide/botanical spray application' },
      { key: 'pest_mgmt.trap_installation', label: 'Trap installation' },
    ],
  },
  {
    key: 'crop_care',
    label: 'Crop Care',
    activities: [
      { key: 'crop_care.pruning', label: 'Pruning' },
      { key: 'crop_care.staking_trellising', label: 'Staking/Trellising' },
      { key: 'crop_care.thinning', label: 'Thinning' },
      { key: 'crop_care.intercultural_operations', label: 'Intercultural operations' },
    ],
  },
  {
    key: 'monitoring',
    label: 'Monitoring & Inspection',
    activities: [
      { key: 'monitoring.growth_stage_check', label: 'Growth stage check' },
      { key: 'monitoring.disease_pest_inspection', label: 'Disease/pest inspection' },
      { key: 'monitoring.soil_moisture_check', label: 'Soil moisture check' },
      { key: 'monitoring.germination_check', label: 'Germination Check' },
    ],
  },
  {
    key: 'harvesting',
    label: 'Harvesting',
    activities: [
      { key: 'harvesting.harvesting', label: 'Harvesting (quantity, method)' },
      { key: 'harvesting.sorting_grading', label: 'Sorting/Grading' },
    ],
  },
  {
    key: 'post_harvest',
    label: 'Post-Harvest & Storage',
    activities: [
      { key: 'post_harvest.drying', label: 'Drying' },
      { key: 'post_harvest.packing', label: 'Packing' },
      { key: 'post_harvest.storage_transfer', label: 'Storage transfer' },
      { key: 'post_harvest.cleaning_washing', label: 'Cleaning/Washing' },
    ],
  },
  {
    key: 'farm_maintenance',
    label: 'Farm Maintenance',
    activities: [
      { key: 'farm_maintenance.equipment_maintenance', label: 'Equipment/tool maintenance' },
      { key: 'farm_maintenance.fencing_boundary_work', label: 'Fencing/boundary work' },
      { key: 'farm_maintenance.compost_pit_maintenance', label: 'Compost pit maintenance' },
      { key: 'farm_maintenance.irrigation_system_check', label: 'Irrigation System Check' },
    ],
  },
  {
    key: 'livestock',
    label: 'Livestock',
    activities: [
      { key: 'livestock.feeding', label: 'Feeding' },
      { key: 'livestock.health_check_vaccination', label: 'Health check/vaccination' },
      { key: 'livestock.manure_collection', label: 'Manure collection' },
    ],
  },
];

/**
 * Plots: shape from the diary plot picker `{id, name, areaAcres}` (farm-diary.schema.ts); the values
 * match farmer-records.mock.ts (Plot 1 · 1.8 acre, Plot 2 · 1.2 acre).
 */
export const DIARY_PLOTS: readonly DiaryPlotOption[] = [
  { id: 'plot-1', name: 'Plot 1', areaAcres: 1.8 },
  { id: 'plot-2', name: 'Plot 2', areaAcres: 1.2 },
];

/**
 * Linked crop: spec `farmCropId` must be a GROWING crop on the selected plot (BR-42b), so the picker
 * only lists crops on the chosen plot ("· same plot" is the design's label).
 */
export const DIARY_CROPS: readonly DiaryCropOption[] = [
  { id: 'crop-tomato', name: 'Tomato', plotId: 'plot-2' },
  { id: 'crop-beans', name: 'Beans', plotId: 'plot-1' },
];

/**
 * Workers: design-only. The design renders WORKER as a select; the spec's worker line carries a free-text
 * `name` (1–120 chars) with no roster link. These names are placeholders.
 */
export const DIARY_WORKERS: readonly DiaryWorkerOption[] = [
  { id: 'worker-1', name: 'Worker 1' },
  { id: 'worker-2', name: 'Worker 2' },
  { id: 'worker-3', name: 'Worker 3' },
];

/** Detail for the entries in farmer-records.mock.ts, keyed by entry id. */
export const DIARY_ENTRY_DETAILS: Readonly<Record<string, DiaryEntryDetailMock>> = {
  'diary-2': {
    plotId: 'plot-2',
    categoryKey: 'nutrient_mgmt',
    activityKey: 'nutrient_mgmt.compost_application',
    linkedCropId: 'crop-tomato',
    notes: 'Applied compost before the next rain.',
    workers: [{ workerId: 'worker-1', hours: '4', wageRupees: '600' }],
    photoCount: 1,
    lastUpdatedAt: '2026-10-26T16:30:00Z',
    lastUpdatedBy: 'Super Admin',
  },
  'diary-1': {
    plotId: 'plot-1',
    categoryKey: 'weed_mgmt',
    activityKey: 'weed_mgmt.weeding',
    linkedCropId: null,
    notes: '',
    workers: [],
    photoCount: 0,
    lastUpdatedAt: '2026-10-24T10:15:00Z',
    lastUpdatedBy: 'Ramesh Kumar',
  },
};
