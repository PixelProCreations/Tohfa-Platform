/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * Add Farm Records → Livestock. Nothing here is sent anywhere. The option lists are reused from the
 * Farmer Records livestock tab (../farmers/farmer-livestock.mock.ts), which cites the source of each
 * list (the API enums in apps/api/src/modules/livestock/livestock.schema.ts where one exists, the
 * design's values otherwise). This file only adds the empty draft and the limits of the Add form.
 *
 * Dates are ISO `yyyy-MM-dd` calendar days. The default "Acquired on" is a fixed reference date,
 * never the real clock, so the screen is identical whenever it is opened.
 */
import { LIVESTOCK_REFERENCE_DATE } from '../farmers/farmer-livestock.mock';

export {
  ADMINISTRATION_ROUTE_OPTIONS,
  APPEARANCE_BY_PRODUCT,
  BREEDING_METHOD_OPTIONS,
  BREED_COLOR_OPTIONS,
  BREED_OPTIONS_BY_TYPE,
  CALVING_OPTIONS,
  CALVING_OUTCOME_OPTIONS,
  CHECKUP_TYPE_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  DIAGNOSIS_OPTIONS,
  EXAMINATION_METHOD_OPTIONS,
  FEED_PLAN_OPTIONS,
  FEED_SOURCE_OPTIONS,
  FEED_TYPE_OPTIONS,
  FINDINGS_OPTIONS,
  FREQUENCY_OPTIONS,
  GENDER_OPTIONS,
  HEALTH_STATUS_OPTIONS,
  INSEMINATION_TYPE_OPTIONS,
  LIVESTOCK_NAME_MAX,
  LIVESTOCK_TAG_MAX,
  LIVESTOCK_TYPE_OPTIONS,
  MEDICINE_TYPE_OPTIONS,
  ORGANIC_STATUS_OPTIONS,
  PREGNANCY_CHECK_TYPE_OPTIONS,
  PREGNANCY_RESULT_OPTIONS,
  PRODUCTION_SECTION_OPTIONS,
  PRODUCTION_TYPE_OPTIONS,
  QUALITY_GRADE_BY_PRODUCT,
  SIRE_OPTIONS,
  SOURCE_FARM_OPTIONS,
  SYMPTOM_OPTIONS,
  TARGET_PARASITE_OPTIONS,
  TREATMENT_REQUIRED_OPTIONS,
  TREATMENT_TYPE_OPTIONS,
  type LivestockOption,
} from '../farmers/farmer-livestock.mock';

/** Default "Acquired on" — the design shows 28 Oct 2026 (the livestock tab's fixed reference date). */
export const LIVESTOCK_ACQUIRED_DEFAULT = LIVESTOCK_REFERENCE_DATE;
/** Design: the Notes counters read "0 / 500". */
export const LIVESTOCK_FORM_NOTES_MAX = 500;
/** SPEC GAP: the API has no admin-entered livestock ID; the tag cap (1..40) is reused for it. */
export const LIVESTOCK_FORM_ID_MAX = 40;
export const LIVESTOCK_PHOTO_ACCEPT = 'image/jpeg,image/png';

/** Every field is a string so it binds straight to a form control; selects hold the option `value`. */
export interface LivestockFormDraft {
  // Basic Information
  livestockType: string;
  livestockId: string;
  /** Labelled "Species" in the design; the API calls it `breed`. */
  breed: string;
  gender: string;
  sourceFarm: string;
  organicStatus: string;
  tag: string;
  name: string;
  acquiredOn: string;
  basicNotes: string;
  // Feed Record
  feedPlan: string;
  feedType: string;
  feedSource: string;
  feedNotes: string;
  // Production Record
  productionType: string;
  productionSection: string;
  productionQuantity: string;
  productionGender: string;
  fatPercent: string;
  qualityGrade: string;
  appearanceType: string;
  productionNotes: string;
  // Breeding Record
  breedType: string;
  sire: string;
  breedingMethod: string;
  breedColor: string;
  inseminationType: string;
  pregnancyCheckType: string;
  pregnancyResult: string;
  examinationMethod: string;
  calving: string;
  calvingOutcome: string;
  deliveryType: string;
  expectedDeliveryDay: string;
  breedingNotes: string;
  // Health Record
  checkupType: string;
  healthStatus: string;
  treatmentType: string;
  medicineType: string;
  frequency: string;
  symptoms: string;
  examinationFindings: string;
  diagnosis: string;
  treatmentRequired: string;
  targetParasite: string;
  administrationRoute: string;
  healthNotes: string;
}

export function emptyLivestockDraft(): LivestockFormDraft {
  return {
    livestockType: '',
    livestockId: '',
    breed: '',
    gender: '',
    sourceFarm: '',
    organicStatus: '',
    tag: '',
    name: '',
    acquiredOn: LIVESTOCK_ACQUIRED_DEFAULT,
    basicNotes: '',
    feedPlan: '',
    feedType: '',
    feedSource: '',
    feedNotes: '',
    productionType: '',
    productionSection: '',
    productionQuantity: '',
    productionGender: '',
    fatPercent: '',
    qualityGrade: '',
    appearanceType: '',
    productionNotes: '',
    breedType: '',
    sire: '',
    breedingMethod: '',
    breedColor: '',
    inseminationType: '',
    pregnancyCheckType: '',
    pregnancyResult: '',
    examinationMethod: '',
    calving: '',
    calvingOutcome: '',
    deliveryType: '',
    expectedDeliveryDay: '',
    breedingNotes: '',
    checkupType: '',
    healthStatus: '',
    treatmentType: '',
    medicineType: '',
    frequency: '',
    symptoms: '',
    examinationFindings: '',
    diagnosis: '',
    treatmentRequired: '',
    targetParasite: '',
    administrationRoute: '',
    healthNotes: '',
  };
}
