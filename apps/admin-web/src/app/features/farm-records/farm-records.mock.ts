/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * Farmers Management → Farm Records (list) and Add Farm Records (Diary / Plant / Assets tabs).
 * docs/openapi.yaml has no admin farm-records list and no admin (on-behalf) diary / plant / asset write
 * endpoints, so nothing here is fetched or sent. When the screens are integrated, the contracts go into
 * docs/openapi.yaml first and each route gets its own `requirePermission` code in docs/rbac.json.
 *
 * Diary and asset option lists are reused from the Farmer Records mocks in ../farmers/ (which cite their
 * own sources); plant options are built here from db/seed/001_reference.sql where the seed has them.
 */
import { DIARY_EDIT_LIMITS } from '../farmers/farmer-diary-edit.mock';

export type FarmRecordStatus = 'ACTIVE' | 'INACTIVE';

export interface FarmRecordRow {
  readonly id: string;
  readonly farmName: string;
  readonly farmerName: string;
  /** Display code as designed ("FMR-00124"). */
  readonly farmerCode: string;
  /** Display-formatted mobile, as the design shows it. */
  readonly mobile: string;
  /** Zone / location name. The design's "Location" column doubles as the Zone filter's value. */
  readonly location: string;
  readonly farmingType: string;
  /** Acres as a one-decimal string ("2.0") so no float formatting is involved. */
  readonly landAreaAcres: string;
  readonly status: FarmRecordStatus;
}

export interface PlantTypeOption {
  readonly code: string;
  readonly label: string;
  readonly variants: readonly { readonly code: string; readonly label: string }[];
}

export interface PlantGradeOption {
  readonly code: string;
  readonly label: string;
}

/**
 * "Today" for the Add Farm Records forms — the Diary date defaults to it. A fixed UTC date (the value
 * shown in the approved design) so the placeholder renders the same regardless of the real clock.
 */
export const FARM_RECORDS_REFERENCE_DATE = '2026-10-20';

/** The ten rows in the approved design (all Active). */
export const FARM_RECORDS_MOCK: readonly FarmRecordRow[] = [
  { id: 'fr-1', farmName: 'Ramesh Kumar Farm', farmerName: 'Ramesh Kumar', farmerCode: 'FMR-00124', mobile: '+91 90000 20000', location: 'Coonoor', farmingType: 'Natural Farming', landAreaAcres: '2.0', status: 'ACTIVE' },
  { id: 'fr-2', farmName: 'Kumar Farming', farmerName: 'Kumar', farmerCode: 'FMR-00125', mobile: '+91 90000 20001', location: 'Ooty', farmingType: 'Organic', landAreaAcres: '1.5', status: 'ACTIVE' },
  { id: 'fr-3', farmName: 'John Farm house', farmerName: 'John', farmerCode: 'FMR-00126', mobile: '+91 90000 20002', location: 'Kotagiri', farmingType: 'Natural Farming', landAreaAcres: '3.2', status: 'ACTIVE' },
  { id: 'fr-4', farmName: 'Rani Farm village', farmerName: 'Rani', farmerCode: 'FMR-00127', mobile: '+91 90000 20003', location: 'Gudalur', farmingType: 'Organic', landAreaAcres: '2.4', status: 'ACTIVE' },
  { id: 'fr-5', farmName: 'Velu Farm plot', farmerName: 'Velu', farmerCode: 'FMR-00128', mobile: '+91 90000 20004', location: 'Ooty', farmingType: 'Organic', landAreaAcres: '1.8', status: 'ACTIVE' },
  { id: 'fr-6', farmName: 'Shanthi Farms', farmerName: 'Shanthi', farmerCode: 'FMR-00129', mobile: '+91 90000 20005', location: 'Coonoor', farmingType: 'Natural Farming', landAreaAcres: '2.6', status: 'ACTIVE' },
  { id: 'fr-7', farmName: 'Murugan Fields', farmerName: 'Murugan', farmerCode: 'FMR-00130', mobile: '+91 90000 20006', location: 'Kotagiri', farmingType: 'Biodynamic', landAreaAcres: '3.0', status: 'ACTIVE' },
  { id: 'fr-8', farmName: 'Priya Plantation', farmerName: 'Priya', farmerCode: 'FMR-00131', mobile: '+91 90000 20007', location: 'Gudalur', farmingType: 'Organic', landAreaAcres: '1.2', status: 'ACTIVE' },
  { id: 'fr-9', farmName: 'Anand Agro Farm', farmerName: 'Anand', farmerCode: 'FMR-00132', mobile: '+91 90000 20008', location: 'Ooty', farmingType: 'Natural Farming', landAreaAcres: '2.1', status: 'ACTIVE' },
  { id: 'fr-10', farmName: 'Devi Green Farm', farmerName: 'Devi', farmerCode: 'FMR-00133', mobile: '+91 90000 20009', location: 'Coonoor', farmingType: 'Organic', landAreaAcres: '1.9', status: 'ACTIVE' },
];

/** Zone filter options: the locations the design's rows use (Nilgiris zones). */
export const FARM_RECORD_ZONES: readonly string[] = ['Coonoor', 'Ooty', 'Kotagiri', 'Gudalur'];

/** Page size of the list (the design shows 10 rows per page). */
export const FARM_RECORDS_PAGE_SIZE = 10;

/**
 * Plant types: a subset of db/seed/001_reference.sql `crop_master` (Nilgiris-appropriate perennials and
 * plantation crops). The spec has no plant-variant field, so every variant below is a placeholder.
 */
export const PLANT_TYPES: readonly PlantTypeOption[] = [
  {
    code: 'tea',
    label: 'Tea',
    variants: [
      { code: 'tea-clonal', label: 'Clonal (placeholder)' },
      { code: 'tea-seedling', label: 'Seedling (placeholder)' },
    ],
  },
  {
    code: 'coffee',
    label: 'Coffee',
    variants: [
      { code: 'coffee-arabica', label: 'Arabica (placeholder)' },
      { code: 'coffee-robusta', label: 'Robusta (placeholder)' },
    ],
  },
  {
    code: 'pepper',
    label: 'Black Pepper',
    variants: [
      { code: 'pepper-local', label: 'Local (placeholder)' },
      { code: 'pepper-hybrid', label: 'Hybrid (placeholder)' },
    ],
  },
  {
    code: 'cardamom',
    label: 'Cardamom',
    variants: [
      { code: 'cardamom-malabar', label: 'Malabar (placeholder)' },
      { code: 'cardamom-mysore', label: 'Mysore (placeholder)' },
    ],
  },
  {
    code: 'avocado',
    label: 'Avocado',
    variants: [
      { code: 'avocado-hass', label: 'Hass (placeholder)' },
      { code: 'avocado-local', label: 'Local (placeholder)' },
    ],
  },
  {
    code: 'plum',
    label: 'Plum',
    variants: [{ code: 'plum-local', label: 'Local (placeholder)' }],
  },
  {
    code: 'pear',
    label: 'Pear',
    variants: [{ code: 'pear-local', label: 'Local (placeholder)' }],
  },
  {
    code: 'orange',
    label: 'Orange',
    variants: [{ code: 'orange-local', label: 'Local (placeholder)' }],
  },
];

/**
 * Grades: db/seed/001_reference.sql `grades`, sellable grades only (Grade 1 / 2 / 3). The seed's
 * `REJECT` grade is not offered for a planted record.
 */
export const PLANT_GRADES: readonly PlantGradeOption[] = [
  { code: 'GRADE_1', label: 'Grade 1' },
  { code: 'GRADE_2', label: 'Grade 2' },
  { code: 'GRADE_3', label: 'Grade 3' },
];

/**
 * Limits for the Diary and Plant forms.
 * - Diary limits reuse farmer-diary-edit.mock.ts (minutes 1–1,440, notes 500, photos 5, hours ≤ 24,
 *   whole-rupee wage up to 8 digits). The design defaults minutes to 0, which is below the minimum, so
 *   Save rejects 0 — the field is required, and 0 minutes is not a recorded activity.
 * - Plant area: > 0, one decimal (the design's label), at most 9,999.9 acres — placeholder cap.
 * - Plant expected harvest days 1–3,650 and notes 500: placeholders; the spec has no plant record.
 */
export const FARM_RECORDS_LIMITS = {
  diary: DIARY_EDIT_LIMITS,
  plantAreaMax: 9999.9,
  plantAreaMaxChars: 6,
  harvestDaysMin: 1,
  harvestDaysMax: 3650,
  harvestDaysMaxChars: 4,
  plantNotesMax: 500,
} as const;
