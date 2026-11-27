/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Farmer Records → Plant & Crops. The admin API has no write endpoints for a farmer's crops, so these
 * interfaces are local to the tab. Where the existing system defines a field or an option list, this
 * file reuses it and cites the source; where the approved design shows a value with no spec
 * counterpart, the design's value is kept and marked "SPEC GAP". When the tab is integrated the
 * shapes belong in docs/openapi.yaml first, and every route gets its own `requirePermission` code in
 * docs/rbac.json.
 *
 * Photos, crop images and documents are represented by flags / names only. The tab renders neutral
 * placeholder tiles, never an image.
 *
 * Every date is an ISO calendar date (`yyyy-MM-dd`) and is treated as a UTC calendar day by
 * `farmer-crops-shared.ts`, so "13 Oct 2026" never renders as the day before in a negative-offset
 * browser.
 */

/**
 * The fixed "today" the placeholder data is measured against (days completed in a stage, the default
 * harvest / stage dates). A fixed value keeps the screens identical whenever they are opened.
 */
export const CROPS_MOCK_TODAY = '2026-10-11';

/** farm_crops.status — db/migrations/0004_produce_pricing_marketing.sql, docs/openapi.yaml `FarmCropStatus`. */
export type FarmCropStatusMock = 'PLANNED' | 'GROWING' | 'HARVESTED' | 'FAILED';

/**
 * The seven growth stages of the admin farm-records flow:
 * apps/mobile/src/roles/admin/screens/farmers/FarmRecordsSection.tsx `CROP_GROWTH_STAGES` and the
 * "Section 4 · Growth stages" inputs of AdminAddFarmRecordScreen.tsx. The mobile list spells stage 1
 * "Seeding"; the approved design (and this tab) say "Seedling".
 *
 * SPEC GAP: the API's own milestone templates (BR-57, migration 0036) are a different, six-stage
 * list. This seven-stage list has no API counterpart yet.
 */
export type CropStageCodeMock = 'SEEDLING' | 'GERMINATION' | 'VEGETATIVE' | 'FLOWERING' | 'FRUIT_SETTING' | 'RIPENING' | 'HARVEST';

export interface CropStageDefMock {
  readonly code: CropStageCodeMock;
  /** Material Symbols glyph for the stepper. */
  readonly icon: string;
}

/** Ordered: index 0 is the first stage. Labels and guidance live in the strings catalogue. */
export const CROP_STAGES: readonly CropStageDefMock[] = [
  { code: 'SEEDLING', icon: 'grass' },
  { code: 'GERMINATION', icon: 'psychiatry' },
  { code: 'VEGETATIVE', icon: 'eco' },
  { code: 'FLOWERING', icon: 'local_florist' },
  { code: 'FRUIT_SETTING', icon: 'nutrition' },
  { code: 'RIPENING', icon: 'spa' },
  { code: 'HARVEST', icon: 'shopping_basket' },
];

/** farm_crops.expectedGrade — apps/api/src/modules/crops/crops.schema.ts; mobile labels "Grade A/B/C" (newCrop/constants.ts `UI_GRADES`). */
export type CropGradeMock = 'GRADE_A' | 'GRADE_B' | 'GRADE_C';
export const CROP_GRADE_OPTIONS: readonly { readonly value: CropGradeMock; readonly label: string; readonly short: string }[] = [
  { value: 'GRADE_A', label: 'Grade A', short: 'A' },
  { value: 'GRADE_B', label: 'Grade B', short: 'B' },
  { value: 'GRADE_C', label: 'Grade C', short: 'C' },
];

/**
 * SPEC GAP: the Record Harvest design has a "Harvest source" select but no spec or app list exists
 * (harvest is only `actualHarvestOn` + `actualYieldKg` on the planting). Placeholder values.
 */
export type HarvestSourceMock = 'FARMER_REPORTED' | 'ADMIN_FIELD_VISIT';
export const HARVEST_SOURCE_OPTIONS: readonly { readonly value: HarvestSourceMock; readonly label: string }[] = [
  { value: 'FARMER_REPORTED', label: 'Reported by the farmer' },
  { value: 'ADMIN_FIELD_VISIT', label: 'Admin field visit' },
];

/** Crop categories — db/seed/001_reference.sql `categories` (the design's "Vegetable" is the seeded "Vegetables"). */
export const CROP_CATEGORY_OPTIONS: readonly string[] = ['Vegetables', 'Fruits', 'Grains', 'Spices', 'Herbs & Greens', 'Dry Goods'];

/**
 * SPEC GAP (botanical lists): no API enum exists. Values from the mobile admin farm-record form
 * (apps/mobile/src/roles/admin/screens/farmers/AdminAddFarmRecordScreen.tsx `DEFAULT_FIELD_OPTIONS`),
 * plus the design's values that list lacks (Solanum tuberosum, Vegetable crop, Hybrid Tomato, Kufri Jyoti).
 */
export const SCIENTIFIC_NAME_OPTIONS: readonly string[] = [
  'Daucus carota',
  'Solanum lycopersicum',
  'Solanum tuberosum',
  'Phaseolus vulgaris',
  'Brassica oleracea',
];
export const CROP_FAMILY_OPTIONS: readonly string[] = ['Apiaceae', 'Solanaceae', 'Fabaceae', 'Brassicaceae'];
export const CROP_CLASSIFICATION_OPTIONS: readonly string[] = [
  'Vegetable crop',
  'Root Crop',
  'Fruiting Vegetable',
  'Legume',
  'Leafy Vegetable',
];
export const SPECIES_VARIETY_OPTIONS: readonly string[] = ['Hybrid Tomato', 'Roma', 'Ooty Carrot', 'Nantes', 'Pusa Kesar', 'Kufri Jyoti'];

/** Suitable season — AdminAddFarmRecordScreen.tsx `suitableSeason` (crop_master has only `seasonMonths`). */
export const SEASON_OPTIONS: readonly string[] = ['Kharif', 'Rabi', 'Zaid', 'All Seasons'];

/** SPEC GAP: zones come from the farmer's plots in the app; these are the design's values. */
export const ZONE_OPTIONS: readonly string[] = ['Nilgiris', 'Coonoor'];

/** Soil types — farmer app zone form, apps/mobile/src/roles/farmer/screens/profile/zoneMap.ts `SOIL_OPTIONS`. */
export const SOIL_OPTIONS: readonly string[] = ['Red soil', 'Loamy', 'Sandy', 'Clay', 'Black soil', 'Alluvial'];

/** Grades supported — `produce_grade` sellable grades, db/seed/001_reference.sql (the design writes "Grade G1"). */
export const SUPPORTED_GRADE_OPTIONS: readonly string[] = ['Grade 1', 'Grade 2', 'Grade 3'];

/** Crop-type (crop_master-like) details edited on the Edit Crop page. */
export interface CropMasterMock {
  /** Server-generated, never editable — format `CRP-` + 3-digit sequence (BR-150, migration 0090). */
  readonly code: string;
  readonly category: string;
  readonly localName: string;
  readonly description: string;
  readonly scientificName: string;
  readonly family: string;
  readonly classification: string;
  readonly variety: string;
  readonly season: string;
  readonly zone: string;
  readonly soil: string;
  /** "Examination harvest days" (mobile admin form label, kept verbatim). */
  readonly examHarvestDays: number;
  readonly gradeSupported: string;
  /** Typical days in each of the seven stages, same order as CROP_STAGES. */
  readonly stageDays: readonly number[];
  readonly notes: string;
  readonly hasImage: boolean;
  readonly document: { readonly name: string; readonly sizeLabel: string } | null;
  readonly lastUpdatedOn: string;
  readonly lastUpdatedBy: string;
}

export interface FarmerCropRecordMock {
  readonly id: string;
  /**
   * Display ID from the design ("CRP-0001"). SPEC GAP: a planting (farm_crops row) has only a UUID;
   * the CRP- code belongs to the crop type. Shown only where the design shows it.
   */
  readonly displayId: string;
  readonly name: string;
  readonly zone: string;
  readonly plot: string;
  readonly areaAcres: number;
  readonly status: FarmCropStatusMock;
  readonly plantedOn: string;
  readonly expectedHarvestOn: string | null;
  /** Index into CROP_STAGES of the stage the crop is in; null when no stage has been recorded. */
  readonly stageIndex: number | null;
  /** The date each stage was entered, same order as CROP_STAGES; null for stages not reached / skipped. */
  readonly stageDates: readonly (string | null)[];
  readonly seedSource: string;
  readonly grade: CropGradeMock | null;
  readonly harvestedOn: string | null;
  /** Whole kilograms. */
  readonly yieldKg: number | null;
  readonly harvestSource: HarvestSourceMock | null;
  readonly harvestNotes: string;
  /** Who created the record, as shown in the design's "Source" field. */
  readonly addedBy: string;
  readonly master: CropMasterMock;
}

const TOMATO_MASTER: CropMasterMock = {
  code: 'CRP-003',
  category: 'Vegetables',
  localName: 'Tomato',
  description: 'High-yielding tomato variety suitable for hilly regions. Grown using natural and organic practices.',
  scientificName: 'Solanum lycopersicum',
  family: 'Solanaceae',
  classification: 'Vegetable crop',
  variety: 'Hybrid Tomato',
  season: 'Kharif',
  zone: 'Nilgiris',
  soil: 'Loamy',
  examHarvestDays: 110,
  gradeSupported: 'Grade 1',
  stageDays: [15, 7, 25, 20, 15, 18, 10],
  notes: 'Regular pruning and staking done. Good fruit set and uniform size. Suitable for local market and processing.',
  hasImage: true,
  document: { name: 'Tomato_Crop_Guide.pdf', sizeLabel: '1.2 MB' },
  lastUpdatedOn: '2026-11-18',
  lastUpdatedBy: 'Super Admin',
};

const CARROT_MASTER: CropMasterMock = {
  code: 'CRP-001',
  category: 'Vegetables',
  localName: 'Carrot',
  description: 'Sweet, cylindrical carrot suited to cool hill climates.',
  scientificName: 'Daucus carota',
  family: 'Apiaceae',
  classification: 'Root Crop',
  variety: 'Nantes',
  season: 'Rabi',
  zone: 'Nilgiris',
  soil: 'Loamy',
  examHarvestDays: 90,
  gradeSupported: 'Grade 1',
  stageDays: [7, 7, 25, 15, 12, 14, 10],
  notes: '',
  hasImage: true,
  document: null,
  lastUpdatedOn: '2026-09-20',
  lastUpdatedBy: 'Super Admin',
};

const POTATO_MASTER: CropMasterMock = {
  code: 'CRP-004',
  category: 'Vegetables',
  localName: 'Potato',
  description: 'Kufri variety bred for the Nilgiris.',
  scientificName: 'Solanum tuberosum',
  family: 'Solanaceae',
  classification: 'Root Crop',
  variety: 'Kufri Jyoti',
  season: 'Rabi',
  zone: 'Nilgiris',
  soil: 'Loamy',
  examHarvestDays: 100,
  gradeSupported: 'Grade 1',
  stageDays: [10, 10, 30, 15, 15, 12, 8],
  notes: '',
  hasImage: true,
  document: null,
  lastUpdatedOn: '2026-08-26',
  lastUpdatedBy: 'Super Admin',
};

/** The four crops of the approved design screen, in its order. */
export const FARMER_CROPS_MOCK: readonly FarmerCropRecordMock[] = [
  {
    id: 'crop-1',
    displayId: 'CRP-0003',
    name: 'Tomato',
    zone: 'Coonoor',
    plot: 'Plot 1',
    areaAcres: 1.5,
    status: 'PLANNED',
    plantedOn: '2026-07-15',
    expectedHarvestOn: '2026-10-13',
    stageIndex: 3,
    stageDates: ['2026-07-15', '2026-07-30', '2026-08-06', '2026-08-31', null, null, null],
    seedSource: 'Own saved seed',
    grade: 'GRADE_A',
    harvestedOn: null,
    yieldKg: null,
    harvestSource: null,
    harvestNotes: '',
    addedBy: 'Added by the farmer',
    master: TOMATO_MASTER,
  },
  {
    id: 'crop-2',
    displayId: 'CRP-0001',
    name: 'Carrot - Nantes',
    zone: 'Coonoor',
    plot: 'Plot A',
    areaAcres: 1.0,
    status: 'GROWING',
    plantedOn: '2026-09-18',
    expectedHarvestOn: '2026-11-27',
    stageIndex: 2,
    stageDates: ['2026-09-18', '2026-09-25', '2026-10-02', null, null, null, null],
    seedSource: 'Own saved seed',
    grade: 'GRADE_A',
    harvestedOn: null,
    yieldKg: null,
    harvestSource: null,
    harvestNotes: '',
    addedBy: 'Added by the farmer',
    master: CARROT_MASTER,
  },
  {
    id: 'crop-3',
    displayId: 'CRP-0002',
    name: 'Carrot',
    zone: 'Coonoor',
    plot: 'Plot 2',
    areaAcres: 0.8,
    status: 'GROWING',
    plantedOn: '2026-07-02',
    expectedHarvestOn: '2026-10-10',
    stageIndex: 3,
    stageDates: ['2026-07-02', '2026-07-09', '2026-07-16', '2026-08-10', null, null, null],
    seedSource: 'Purchased seed',
    grade: 'GRADE_B',
    harvestedOn: null,
    yieldKg: null,
    harvestSource: null,
    harvestNotes: '',
    addedBy: 'Added by the farmer',
    master: { ...CARROT_MASTER, code: 'CRP-002', variety: 'Ooty Carrot' },
  },
  {
    id: 'crop-4',
    displayId: 'CRP-0004',
    name: 'Potato - Kufri',
    zone: 'Coonoor',
    plot: 'Plot 3',
    areaAcres: 2.0,
    status: 'HARVESTED',
    plantedOn: '2026-05-10',
    expectedHarvestOn: '2026-08-18',
    stageIndex: 6,
    stageDates: ['2026-05-10', '2026-05-20', '2026-05-30', '2026-06-29', '2026-07-14', '2026-07-29', '2026-08-10'],
    seedSource: 'Purchased seed',
    grade: 'GRADE_A',
    harvestedOn: '2026-08-25',
    yieldKg: 850,
    harvestSource: 'FARMER_REPORTED',
    harvestNotes: '',
    addedBy: 'Added by the farmer',
    master: POTATO_MASTER,
  },
];
