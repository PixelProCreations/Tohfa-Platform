/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * Add Farm Records → Crops. Nothing here is sent anywhere. The option lists are reused from the
 * Farmer Records crop tab (../farmers/farmer-crops.mock.ts), which cites the source of each list and
 * marks its spec gaps; this file only adds what the Add form needs on top of them.
 *
 * The crop code is server-generated in the real system (BR-150: `CRP-` + a sequence padded to at
 * least 3 digits, migration 0090). Here "Generate" only reads a local counter, so the code shown is
 * a placeholder that the API will replace when the screen is integrated.
 */
export {
  CROP_CATEGORY_OPTIONS,
  CROP_CLASSIFICATION_OPTIONS,
  CROP_FAMILY_OPTIONS,
  CROP_STAGES,
  SCIENTIFIC_NAME_OPTIONS,
  SEASON_OPTIONS,
  SOIL_OPTIONS,
  SPECIES_VARIETY_OPTIONS,
  SUPPORTED_GRADE_OPTIONS,
  ZONE_OPTIONS,
} from '../farmers/farmer-crops.mock';

/** BR-150 code prefix. */
export const CROP_CODE_PREFIX = 'CRP-';
/** BR-150: the sequence part is padded to at least 3 digits. */
export const CROP_CODE_MIN_DIGITS = 3;
/**
 * First placeholder sequence number "Generate" hands out. The crop-tab placeholder data already uses
 * CRP-001 … CRP-004, so the local counter starts after them.
 */
export const CROP_CODE_NEXT_SEQUENCE = 5;

export function formatCropCode(sequence: number): string {
  return CROP_CODE_PREFIX + String(sequence).padStart(CROP_CODE_MIN_DIGITS, '0');
}

/** Design: "Up to 300 characters." on the Notes box. */
export const CROP_NOTES_MAX = 300;
/** Design: "JPG, PNG or PDF, up to 5 MB." */
export const CROP_FILE_MAX_BYTES = 5 * 1024 * 1024;
export const CROP_FILE_ACCEPT = '.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf';
export const CROP_FILE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'application/pdf'];
/** SCHEMA-like caps borrowed from the crop tab's limits; the add design shows no counters for these. */
export const CROP_NAME_MAX = 120;
export const CROP_LOCAL_NAME_MAX = 120;
export const CROP_DESCRIPTION_MAX = 1000;

/** Every field is a string so it binds straight to a form control; selects hold the option text. */
export interface CropFormDraft {
  name: string;
  code: string;
  category: string;
  localName: string;
  description: string;
  scientificName: string;
  family: string;
  classification: string;
  variety: string;
  season: string;
  zone: string;
  soil: string;
  examHarvestDays: string;
  gradeSupported: string;
  /** Digit strings, one per stage, same order as CROP_STAGES; '' when not entered. */
  stageDays: string[];
  notes: string;
}

export function emptyCropDraft(stageCount: number): CropFormDraft {
  return {
    name: '',
    code: '',
    category: '',
    localName: '',
    description: '',
    scientificName: '',
    family: '',
    classification: '',
    variety: '',
    season: '',
    zone: '',
    soil: '',
    examHarvestDays: '',
    gradeSupported: '',
    stageDays: Array.from({ length: stageCount }, () => ''),
    notes: '',
  };
}
