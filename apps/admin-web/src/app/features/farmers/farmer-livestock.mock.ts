/**
 * UI-only placeholder data — replace with API when this tab is integrated.
 *
 * Farmer Details → Farmer Records → Livestock (SA-M3-S12 list, S12a–e edit stepper, S12f saved
 * modal, S12h end-record modal). The only admin livestock route today is the read-only
 * `GET /admin/farmers/{farmerId}/livestock/animals` (docs/openapi.yaml, `admin.livestock.view_all`);
 * there is no admin write route for animals, feed, production, breeding, health or lifecycle
 * events. Everything here is therefore local to the tab.
 *
 * Option lists follow the farmer app flow wherever it has one. Sources, abbreviated below:
 *   SCHEMA = apps/api/src/modules/livestock/livestock.schema.ts (mirrors docs/openapi.yaml)
 *   EN     = apps/mobile/src/i18n/farmer.en.json (English labels used by the farmer app)
 *   FORMS  = apps/mobile/src/roles/farmer/screens/farm/livestock/animalRecordForms.ts
 *   DESIGN = apps/mobile/src/roles/admin/screens/farmers/AdminAddFarmRecordScreen.tsx
 *            (DEFAULT_FIELD_OPTIONS) and the admin-web design screens 40–47
 * Where a design field has no spec counterpart the design's own values are kept and the list says
 * so. Values are the spec enum codes where one exists; free-text API fields store the label itself.
 *
 * Photos are represented by a flag only; the UI renders a neutral placeholder tile, never an image.
 * All dates are ISO `yyyy-MM-dd` strings and are formatted in UTC by the components.
 */

/** Fixed "today" for the placeholder dataset, so the End-record date default is stable. */
export const LIVESTOCK_REFERENCE_DATE = '2026-10-28';

/** Design character counter on every Notes box (the API allows 2000; the design caps at 300). */
export const LIVESTOCK_NOTES_MAX = 300;
/** SCHEMA AnimalCreateRequest.tag: trim, 1..40 (also mobile animalForm/validation.ts ANIMAL_TAG_MAX). */
export const LIVESTOCK_TAG_MAX = 40;
/** SCHEMA AnimalCreateRequest.name: 1..120. */
export const LIVESTOCK_NAME_MAX = 120;
/** SCHEMA LifecycleEventCreateRequest.reason: 1..500 (mobile saleTransferCullValidation REASON_MAX). */
export const LIVESTOCK_END_REASON_MAX = 500;

export interface LivestockOption {
  readonly value: string;
  readonly label: string;
}

const free = (...labels: string[]): readonly LivestockOption[] => labels.map((label) => ({ value: label, label }));

// ---------------------------------------------------------------- Step 1 · Basic Information

/**
 * Livestock Type → SCHEMA `species` (CATTLE, BUFFALO, GOAT, POULTRY, SHEEP; DB CHECK in
 * db/migrations/0024_livestock.sql). The farmer app labels these Cattle / Poultry (EN 3456-3460);
 * the design names the animal ("Cow", "Hen"), so the design's labels are kept over the spec codes.
 */
export const LIVESTOCK_TYPE_OPTIONS: readonly LivestockOption[] = [
  { value: 'CATTLE', label: 'Cow' },
  { value: 'BUFFALO', label: 'Buffalo' },
  { value: 'GOAT', label: 'Goat' },
  { value: 'POULTRY', label: 'Hen' },
  { value: 'SHEEP', label: 'Sheep' },
];

/**
 * Species → SCHEMA `breed` (free text, 1..120 — not an enum). Suggestions per livestock type come
 * from the design (DESIGN breedType: Jersey, HF Cross, Sahiwal, Gir, Malabari; screen 40 adds
 * Country hens and Jamunapari goats). The remaining entries are placeholder suggestions.
 */
export const BREED_OPTIONS_BY_TYPE: Readonly<Record<string, readonly LivestockOption[]>> = {
  CATTLE: free('Jersey', 'HF Cross', 'Sahiwal', 'Gir', 'Malabari'),
  BUFFALO: free('Murrah', 'Surti', 'Toda'),
  GOAT: free('Jamunapari', 'Malabari', 'Boer'),
  POULTRY: free('Country', 'Aseel', 'Giriraja'),
  SHEEP: free('Nilgiri', 'Mecheri', 'Coimbatore'),
};

/** SCHEMA `gender` (FEMALE, MALE); labels EN 3107-3108. */
export const GENDER_OPTIONS: readonly LivestockOption[] = [
  { value: 'FEMALE', label: 'Female' },
  { value: 'MALE', label: 'Male' },
];

/** Source Farm → SCHEMA `source` (BORN_ON_FARM, PURCHASED). "Own Farm" is the design's label. */
export const SOURCE_FARM_OPTIONS: readonly LivestockOption[] = [
  { value: 'BORN_ON_FARM', label: 'Own Farm' },
  { value: 'PURCHASED', label: 'Purchased' },
];

/** SCHEMA `organicStatus` (ORGANIC, TRANSITIONING, CONVENTIONAL); labels EN 1443-1444. */
export const ORGANIC_STATUS_OPTIONS: readonly LivestockOption[] = [
  { value: 'ORGANIC', label: 'Organic' },
  { value: 'TRANSITIONING', label: 'Transitioning' },
  { value: 'CONVENTIONAL', label: 'Conventional' },
];

// ---------------------------------------------------------------- Step 2 · Feed Record

/** Feed Plan → SCHEMA feed plan `planName` (free text 1..160). Values from the design (screen 42, DESIGN feedPlan). */
export const FEED_PLAN_OPTIONS: readonly LivestockOption[] = free(
  'Dairy maintenance plan',
  'Morning fodder + mineral mix',
  'Twice daily silage',
  'Free range + grain',
);

/** SCHEMA feed `feedType` enum; labels EN 3065-3070. */
export const FEED_TYPE_OPTIONS: readonly LivestockOption[] = [
  { value: 'GREEN_FODDER', label: 'Green fodder' },
  { value: 'DRY_FODDER', label: 'Dry fodder' },
  { value: 'CONCENTRATE_MIX', label: 'Concentrate mix' },
  { value: 'SILAGE', label: 'Silage' },
  { value: 'MINERAL_MIXTURE', label: 'Mineral mixture' },
  { value: 'PASTURE_GRAZING', label: 'Pasture grazing' },
];

/** Source → SCHEMA feed plan `source` (free text 1..160). Values from the design (screen 42, DESIGN feedSource). */
export const FEED_SOURCE_OPTIONS: readonly LivestockOption[] = free('Own farm', 'Local co-op', 'Organic supplier');

// ---------------------------------------------------------------- Step 3 · Production Record

export interface LivestockProductOption extends LivestockOption {
  /** Unit suffix on the Production Quantity field — SCHEMA fixes the unit per product. */
  readonly unit: string;
}

/**
 * SCHEMA `productType`; the picker offers the five raw products of the farmer app's production
 * modal (FORMS:1385). Units per SCHEMA: MILK → LITERS, EGGS → COUNT, MEAT/WOOL/MANURE → KG.
 */
export const PRODUCTION_TYPE_OPTIONS: readonly LivestockProductOption[] = [
  { value: 'MILK', label: 'Milk', unit: 'litres' },
  { value: 'EGGS', label: 'Eggs', unit: 'eggs' },
  { value: 'MEAT', label: 'Meat', unit: 'kg' },
  { value: 'WOOL', label: 'Wool', unit: 'kg' },
  { value: 'MANURE', label: 'Manure', unit: 'kg' },
];

/**
 * Production section → SCHEMA `session` (MORNING, AFTERNOON, EVENING, NIGHT). "Daily milk yield"
 * (screen 43) has no spec counterpart and is kept as the design's whole-day value.
 */
export const PRODUCTION_SECTION_OPTIONS: readonly LivestockOption[] = [
  { value: 'DAILY', label: 'Daily milk yield' },
  { value: 'MORNING', label: 'Morning' },
  { value: 'AFTERNOON', label: 'Afternoon' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'NIGHT', label: 'Night' },
];

/**
 * Quality grade → SCHEMA `qualityGrade` (free text 1..60). The farmer app offers a picker per
 * product (FORMS:735-817: MILK_GRADE, EGG_GRADE, MEAT_GRADE, WOOL_GRADE, MANURE_COMPOST); its
 * English labels are not in EN, so they are spelled out from the codes here.
 */
export const QUALITY_GRADE_BY_PRODUCT: Readonly<Record<string, readonly LivestockOption[]>> = {
  MILK: free('Grade A', 'Grade B', 'Grade C', 'Premium'),
  EGGS: free('A – Large', 'A – Medium', 'B', 'Small / pullet'),
  MEAT: free('Prime', 'Choice', 'Standard', 'Organic certified'),
  WOOL: free('Fine', 'Medium', 'Coarse', 'Crossbred'),
  MANURE: free('Raw', 'Partially composted', 'Cured', 'Vermicompost'),
};

/**
 * Appearance type — no API field. The farmer app's per-product appearance pickers are used
 * (FORMS: MILK_APPEARANCE, EGG_SHELL, MEAT_CUT, WOOL_CONDITION, MANURE_MOISTURE).
 */
export const APPEARANCE_BY_PRODUCT: Readonly<Record<string, readonly LivestockOption[]>> = {
  MILK: free('Normal', 'Yellowish', 'Watery', 'Blood-tinged', 'Clots / flakes'),
  EGGS: free('Clean / normal', 'Dirty', 'Thin', 'Cracked', 'Rough / misshapen'),
  MEAT: free('Whole carcass', 'Primal', 'Boneless', 'Ground / mince'),
  WOOL: free('Clean and sound', 'Vegetable matter', 'Stained / tender', 'Greasy'),
  MANURE: free('Dry', 'Semi-dry', 'Wet'),
};

// ---------------------------------------------------------------- Step 4 · Breeding Record

/** Sire / Bull → SCHEMA `sire` (free text 1..160). Placeholder sires; the design format is "<tag> (<breed>)". */
export const SIRE_OPTIONS: readonly LivestockOption[] = free(
  'JER-BULL-102 (Jersey)',
  'GIR-BULL-014 (Gir)',
  'SAH-BULL-031 (Sahiwal)',
  'HF-BULL-221 (HF Cross)',
  'JAM-BUCK-07 (Jamunapari)',
);

/** SCHEMA `breedingMethod`; labels EN 3098-3100, with the design's spelled-out AI label (screen 44). */
export const BREEDING_METHOD_OPTIONS: readonly LivestockOption[] = [
  { value: 'ARTIFICIAL_INSEMINATION', label: 'Artificial insemination (AI)' },
  { value: 'NATURAL_SERVICE', label: 'Natural service' },
  { value: 'EMBRYO_TRANSFER', label: 'Embryo transfer' },
];

/** Breed color — no spec counterpart; design values (screen 44, DESIGN breedColor). */
export const BREED_COLOR_OPTIONS: readonly LivestockOption[] = free('Black & White', 'Brown & White', 'Dark Red');

/** SCHEMA `inseminationType` (ARTIFICIAL, NATURAL); labels EN 3313-3314. */
export const INSEMINATION_TYPE_OPTIONS: readonly LivestockOption[] = [
  { value: 'ARTIFICIAL', label: 'Artificial' },
  { value: 'NATURAL', label: 'Natural' },
];

/** Pregnancy check type → SCHEMA pregnancy-check `checkType` (ROUTINE, CONFIRMATION). */
export const PREGNANCY_CHECK_TYPE_OPTIONS: readonly LivestockOption[] = [
  { value: 'ROUTINE', label: 'Routine' },
  { value: 'CONFIRMATION', label: 'Confirmation' },
];

/** SCHEMA pregnancy-check `result`; labels EN 3095-3097. */
export const PREGNANCY_RESULT_OPTIONS: readonly LivestockOption[] = [
  { value: 'POSITIVE', label: 'Confirmed pregnant' },
  { value: 'NEGATIVE', label: 'Not pregnant' },
  { value: 'INCONCLUSIVE', label: 'Inconclusive' },
];

/** SCHEMA pregnancy-check `examinationMethod`; labels EN 3317-3320. */
export const EXAMINATION_METHOD_OPTIONS: readonly LivestockOption[] = [
  { value: 'ULTRASOUND', label: 'Ultrasound' },
  { value: 'RECTAL_PALPATION', label: 'Rectal palpation' },
  { value: 'BLOOD_TEST', label: 'Blood test' },
  { value: 'MILK_PROGESTERONE', label: 'Milk progesterone' },
];

/** Calving — no separate spec field (the API only has `deliveryType`); design values (DESIGN calving). */
export const CALVING_OPTIONS: readonly LivestockOption[] = free('Normal calving', 'Assisted calving');

/** SCHEMA calving `outcome`; labels EN 3104-3106. */
export const CALVING_OUTCOME_OPTIONS: readonly LivestockOption[] = [
  { value: 'LIVE_BIRTH', label: 'Live birth' },
  { value: 'STILLBIRTH', label: 'Stillbirth' },
  { value: 'OTHER', label: 'Other' },
];

/** SCHEMA calving `deliveryType`; labels EN 3321-3323. */
export const DELIVERY_TYPE_OPTIONS: readonly LivestockOption[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ASSISTED', label: 'Assisted' },
  { value: 'CAESAREAN', label: 'Caesarean' },
];

// ---------------------------------------------------------------- Step 5 · Health Record

/** SCHEMA checkup `checkupType`; labels EN 3050-3054. */
export const CHECKUP_TYPE_OPTIONS: readonly LivestockOption[] = [
  { value: 'ROUTINE', label: 'Checkup' },
  { value: 'EMERGENCY', label: 'Emergency checkup' },
  { value: 'PRE_BREEDING', label: 'Pre-breeding checkup' },
  { value: 'POST_CALVING', label: 'Post-calving checkup' },
  { value: 'FOLLOW_UP', label: 'Follow-up' },
];

export type LivestockHealthTone = 'success' | 'warning' | 'danger';

export interface LivestockHealthOption extends LivestockOption {
  /** Pill tone in the Health Summary card. */
  readonly tone: LivestockHealthTone;
}

/** SCHEMA checkup `healthStatus`; labels EN 3295-3299. */
export const HEALTH_STATUS_OPTIONS: readonly LivestockHealthOption[] = [
  { value: 'NORMAL', label: 'Normal', tone: 'success' },
  { value: 'MILD_ILLNESS', label: 'Mild illness', tone: 'warning' },
  { value: 'MODERATE_ILLNESS', label: 'Moderate illness', tone: 'warning' },
  { value: 'SEVERE', label: 'Severe', tone: 'danger' },
  { value: 'CRITICAL', label: 'Critical', tone: 'danger' },
];

/** SCHEMA treatment `treatmentType`; labels EN 3300-3305. */
export const TREATMENT_TYPE_OPTIONS: readonly LivestockOption[] = [
  { value: 'MEDICATION', label: 'Medication' },
  { value: 'SURGICAL', label: 'Surgical' },
  { value: 'THERAPY', label: 'Therapy' },
  { value: 'FIRST_AID', label: 'First aid' },
  { value: 'SUPPORTIVE', label: 'Supportive care' },
  { value: 'OTHER', label: 'Other' },
];

/** Medicine type — no spec counterpart; design values (screen 45 "Dewormer", DESIGN medicineType). */
export const MEDICINE_TYPE_OPTIONS: readonly LivestockOption[] = free(
  'Dewormer',
  'Vaccine',
  'Oral suspension',
  'Injectable',
  'Herbal supplement',
);

/** SCHEMA treatment `frequency`; labels EN 3306-3312. */
export const FREQUENCY_OPTIONS: readonly LivestockOption[] = [
  { value: 'ONCE_DAILY', label: 'Once a day' },
  { value: 'TWICE_DAILY', label: 'Twice a day' },
  { value: 'THRICE_DAILY', label: 'Three times a day' },
  { value: 'EVERY_6_HOURS', label: 'Every 6 hours' },
  { value: 'EVERY_8_HOURS', label: 'Every 8 hours' },
  { value: 'EVERY_12_HOURS', label: 'Every 12 hours' },
  { value: 'AS_NEEDED', label: 'As needed' },
];

/** Symptoms / Observations → SCHEMA `symptoms` (free text 1..2000). Suggestions from screen 45 and DESIGN. */
export const SYMPTOM_OPTIONS: readonly LivestockOption[] = free(
  'No visible symptoms',
  'Mild fever',
  'Reduced appetite',
  'Skin rash',
);

/** Examination Findings → SCHEMA `findings` (free text 1..2000). Suggestions from screen 45 and DESIGN. */
export const FINDINGS_OPTIONS: readonly LivestockOption[] = free(
  'Normal temperature and appetite',
  'Elevated temperature',
  'Dehydration',
);

/** Diagnosis → SCHEMA `diagnosis` (free text 1..2000). Suggestions from screen 45 and DESIGN. */
export const DIAGNOSIS_OPTIONS: readonly LivestockOption[] = free(
  'No illness detected',
  'Seasonal fever',
  'Parasite infection',
  'Nutritional deficiency',
);

/** Treatment Required → SCHEMA checkup `treatmentRequired` (boolean). */
export const TREATMENT_REQUIRED_OPTIONS: readonly LivestockOption[] = [
  { value: 'YES', label: 'Yes' },
  { value: 'NO', label: 'No' },
];

/** SCHEMA deworming `targetParasite`; labels EN 3289-3294. "None" (DESIGN) means the field is omitted. */
export const TARGET_PARASITE_OPTIONS: readonly LivestockOption[] = [
  { value: 'NONE', label: 'None' },
  { value: 'INTERNAL_WORMS', label: 'Internal worms' },
  { value: 'EXTERNAL_PARASITES', label: 'External parasites' },
  { value: 'LIVER_FLUKES', label: 'Liver flukes' },
  { value: 'TAPEWORMS', label: 'Tapeworms' },
  { value: 'ROUNDWORMS', label: 'Roundworms' },
  { value: 'TICKS_AND_LICE', label: 'Ticks and lice' },
];

/** Administration Route → SCHEMA treatment `route`; labels EN 3280-3288. */
export const ADMINISTRATION_ROUTE_OPTIONS: readonly LivestockOption[] = [
  { value: 'ORAL', label: 'Oral' },
  { value: 'TOPICAL', label: 'On the skin' },
  { value: 'INJECTION_IM', label: 'Injection (muscle)' },
  { value: 'INJECTION_SC', label: 'Injection (under skin)' },
  { value: 'INTRA_MAMMARY', label: 'Into the udder' },
  { value: 'EYE_DROPS', label: 'Eye drops' },
];

// ---------------------------------------------------------------- End record

/**
 * What happened? → SCHEMA lifecycle `eventType` (SOLD, TRANSFERRED, CULLED, DECEASED); the design
 * modal (mobile FarmRecordsSection.tsx) uses the same four. Ending is terminal (BR-47).
 */
export const END_REASON_OPTIONS: readonly LivestockOption[] = [
  { value: 'SOLD', label: 'Sold' },
  { value: 'TRANSFERRED', label: 'Transferred' },
  { value: 'CULLED', label: 'Culled' },
  { value: 'DECEASED', label: 'Deceased' },
];

// ---------------------------------------------------------------- Records

/**
 * One animal's editable record, all five stepper sections. Every field is a string so it can bind
 * straight to a form control: select fields hold the option `value`, dates are ISO `yyyy-MM-dd`,
 * numbers are their typed text.
 */
export interface LivestockRecordDraft {
  // Basic Information
  livestockType: string;
  /** Read-only Livestock ID shown with a lock, e.g. "COW-01". */
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
  /** Whether the record has a photo. The UI only ever shows a placeholder tile. */
  hasPhoto: boolean;
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
  /** Shown as the "Next Checkup" chip; there is no input for it in the design. */
  nextCheckupOn: string;
}

export interface LivestockLatestProduction {
  /** PRODUCTION_TYPE_OPTIONS value. */
  readonly product: string;
  readonly quantity: number;
  readonly date: string;
}

export interface LivestockEndEvent {
  readonly eventType: string;
  readonly date: string;
  readonly reason: string;
}

export interface LivestockAnimal {
  readonly id: string;
  /** System animal ID, e.g. "ANM-0001". */
  readonly animalId: string;
  readonly status: 'ACTIVE' | 'ENDED';
  readonly productionLogCount: number;
  readonly latest: LivestockLatestProduction | null;
  /** True when the farmer added the animal; false when an admin added it on their behalf. */
  readonly addedByFarmer: boolean;
  readonly record: LivestockRecordDraft;
  readonly ended: LivestockEndEvent | null;
}

const EMPTY_BREEDING: Pick<
  LivestockRecordDraft,
  | 'breedType'
  | 'sire'
  | 'breedingMethod'
  | 'breedColor'
  | 'inseminationType'
  | 'pregnancyCheckType'
  | 'pregnancyResult'
  | 'examinationMethod'
  | 'calving'
  | 'calvingOutcome'
  | 'deliveryType'
  | 'expectedDeliveryDay'
  | 'breedingNotes'
> = {
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
};

/** Routine-checkup defaults for the animals whose screens were not designed in full. */
const ROUTINE_HEALTH: Pick<
  LivestockRecordDraft,
  | 'checkupType'
  | 'healthStatus'
  | 'treatmentType'
  | 'medicineType'
  | 'frequency'
  | 'symptoms'
  | 'examinationFindings'
  | 'diagnosis'
  | 'treatmentRequired'
  | 'targetParasite'
  | 'administrationRoute'
  | 'healthNotes'
> = {
  checkupType: 'ROUTINE',
  healthStatus: 'NORMAL',
  treatmentType: 'SUPPORTIVE',
  medicineType: 'Herbal supplement',
  frequency: 'ONCE_DAILY',
  symptoms: 'No visible symptoms',
  examinationFindings: 'Normal temperature and appetite',
  diagnosis: 'No illness detected',
  treatmentRequired: 'NO',
  targetParasite: 'NONE',
  administrationRoute: 'ORAL',
  healthNotes: '',
};

export const FARMER_LIVESTOCK_MOCK: readonly LivestockAnimal[] = [
  {
    // Values reproduce design screens 41–45 for this animal, mapped onto the option lists above.
    id: 'lv-1',
    animalId: 'ANM-0001',
    status: 'ACTIVE',
    productionLogCount: 2,
    latest: { product: 'MILK', quantity: 12, date: '2026-10-27' },
    addedByFarmer: true,
    ended: null,
    record: {
      livestockType: 'CATTLE',
      livestockId: 'COW-01',
      breed: 'Jersey',
      gender: 'FEMALE',
      sourceFarm: 'BORN_ON_FARM',
      organicStatus: 'ORGANIC',
      tag: 'COW-01-LAK',
      name: 'Lakshmi',
      acquiredOn: '2025-09-23',
      basicNotes: 'High yielding dairy cow.',
      hasPhoto: true,
      feedPlan: 'Dairy maintenance plan',
      feedType: 'GREEN_FODDER',
      feedSource: 'Own farm',
      feedNotes: 'Fresh fodder supplied daily.',
      productionType: 'MILK',
      productionSection: 'DAILY',
      productionQuantity: '12',
      productionGender: 'FEMALE',
      fatPercent: '4.2',
      qualityGrade: 'Grade A',
      appearanceType: 'Normal',
      productionNotes: 'Healthy milk production observed.',
      breedType: 'Jersey',
      sire: 'JER-BULL-102 (Jersey)',
      breedingMethod: 'ARTIFICIAL_INSEMINATION',
      breedColor: 'Black & White',
      inseminationType: 'ARTIFICIAL',
      pregnancyCheckType: 'CONFIRMATION',
      pregnancyResult: 'POSITIVE',
      examinationMethod: 'ULTRASOUND',
      calving: 'Normal calving',
      calvingOutcome: 'LIVE_BIRTH',
      deliveryType: 'NORMAL',
      expectedDeliveryDay: '2026-10-27',
      breedingNotes: 'AI on 18 Jan 2026. Pregnancy confirmed by ultrasound on 20 Feb 2026. Animal is healthy.',
      checkupType: 'ROUTINE',
      healthStatus: 'NORMAL',
      treatmentType: 'MEDICATION',
      medicineType: 'Dewormer',
      frequency: 'AS_NEEDED',
      symptoms: 'No visible symptoms',
      examinationFindings: 'Normal temperature and appetite',
      diagnosis: 'No illness detected',
      treatmentRequired: 'YES',
      targetParasite: 'INTERNAL_WORMS',
      administrationRoute: 'ORAL',
      healthNotes: 'Routine checkup completed; animal is healthy.',
      nextCheckupOn: '2025-12-23',
    },
  },
  {
    id: 'lv-2',
    animalId: 'ANM-0002',
    status: 'ACTIVE',
    productionLogCount: 1,
    latest: { product: 'EGGS', quantity: 6, date: '2026-10-27' },
    addedByFarmer: true,
    ended: null,
    record: {
      livestockType: 'POULTRY',
      livestockId: 'HEN-07',
      breed: 'Country',
      gender: 'FEMALE',
      sourceFarm: 'BORN_ON_FARM',
      organicStatus: 'ORGANIC',
      tag: 'HEN-07',
      name: '',
      acquiredOn: '2026-04-11',
      basicNotes: '',
      hasPhoto: true,
      feedPlan: 'Free range + grain',
      feedType: 'PASTURE_GRAZING',
      feedSource: 'Own farm',
      feedNotes: '',
      productionType: 'EGGS',
      productionSection: 'MORNING',
      productionQuantity: '6',
      productionGender: 'FEMALE',
      fatPercent: '',
      qualityGrade: 'A – Medium',
      appearanceType: 'Clean / normal',
      productionNotes: '',
      ...EMPTY_BREEDING,
      ...ROUTINE_HEALTH,
      nextCheckupOn: '2026-12-11',
    },
  },
  {
    id: 'lv-3',
    animalId: 'ANM-0003',
    status: 'ACTIVE',
    productionLogCount: 5,
    latest: { product: 'MILK', quantity: 2.8, date: '2026-10-26' },
    addedByFarmer: true,
    ended: null,
    record: {
      livestockType: 'GOAT',
      livestockId: 'GOAT-03',
      breed: 'Jamunapari',
      gender: 'FEMALE',
      sourceFarm: 'PURCHASED',
      organicStatus: 'TRANSITIONING',
      tag: 'GOAT-03-MEE',
      name: 'Meena',
      acquiredOn: '2026-02-05',
      basicNotes: '',
      hasPhoto: true,
      feedPlan: 'Morning fodder + mineral mix',
      feedType: 'GREEN_FODDER',
      feedSource: 'Local co-op',
      feedNotes: '',
      productionType: 'MILK',
      productionSection: 'MORNING',
      productionQuantity: '2.8',
      productionGender: 'FEMALE',
      fatPercent: '4.5',
      qualityGrade: 'Grade A',
      appearanceType: 'Normal',
      productionNotes: '',
      ...EMPTY_BREEDING,
      ...ROUTINE_HEALTH,
      nextCheckupOn: '2026-11-05',
    },
  },
  {
    id: 'lv-4',
    animalId: 'ANM-0004',
    status: 'ACTIVE',
    productionLogCount: 3,
    latest: { product: 'MILK', quantity: 10, date: '2026-10-25' },
    addedByFarmer: true,
    ended: null,
    record: {
      livestockType: 'CATTLE',
      livestockId: 'COW-04',
      breed: 'Gir',
      gender: 'FEMALE',
      sourceFarm: 'PURCHASED',
      organicStatus: 'ORGANIC',
      tag: 'COW-04-GAN',
      name: 'Ganga',
      acquiredOn: '2026-01-18',
      basicNotes: '',
      hasPhoto: true,
      feedPlan: 'Twice daily silage',
      feedType: 'SILAGE',
      feedSource: 'Own farm',
      feedNotes: '',
      productionType: 'MILK',
      productionSection: 'EVENING',
      productionQuantity: '10',
      productionGender: 'FEMALE',
      fatPercent: '4.8',
      qualityGrade: 'Grade B',
      appearanceType: 'Normal',
      productionNotes: '',
      ...EMPTY_BREEDING,
      ...ROUTINE_HEALTH,
      nextCheckupOn: '2026-12-18',
    },
  },
];
