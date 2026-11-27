/**
 * UI string catalogue for the Add Farm Records → Livestock form.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet (see farmers.strings.ts), so this catalogue is the single source of truth.
 */
export const FARM_RECORDS_LIVESTOCK_FORM_STRINGS = {
  CARD_TITLE: 'Livestock Records',
  STEPPER_LABEL: 'Livestock record steps',
  /**
   * The designs disagree on steps 4 and 5 (screen 67: "Health & Care" / "Additional Details";
   * screens 68–71: "Breeding Record" / "Health Record"). The later, majority labels are used.
   */
  STEPS: ['Basic Information', 'Feed Record', 'Production Record', 'Breeding Record', 'Health Record'] as readonly string[],
  stepStrip: (n: number, total: number, name: string): string => `Step ${n} of ${total}: ${name}`,
  STEP_DONE: 'completed',
  STEP_CURRENT: 'current step',
  STEP_UPCOMING: 'not started',
  stepStatus: (name: string, status: string): string => `${name}, ${status}`,
  goToStep: (name: string): string => `Go back to ${name}`,

  // Step 1 · Basic Information
  ADD_PHOTO: 'Add photo (optional)',
  chosenPhoto: (name: string): string => `Selected: ${name}`,
  LIVESTOCK_TYPE: 'Livestock Type',
  LIVESTOCK_ID: 'Livestock ID',
  SPECIES: 'Species',
  GENDER: 'Gender',
  SOURCE_FARM: 'Source Farm',
  ORGANIC_STATUS: 'Organic status',
  TAG: 'Tag (required)',
  NAME: 'Name',
  OPTIONAL: 'Optional',
  ACQUIRED_ON: 'Acquired on (required)',
  NOTES: 'Notes',
  NOTES_PLACEHOLDER: 'Enter notes (optional)',

  // Step 2 · Feed Record
  FEED_PLAN: 'Feed Plan',
  FEED_TYPE: 'Feed Type',
  FEED_SOURCE: 'Source',

  // Step 3 · Production Record
  PRODUCTION_TYPE: 'Production Type',
  PRODUCTION_SECTION: 'Production section',
  PRODUCTION_QUANTITY: 'Production Quantity',
  PRODUCTION_GENDER: 'Gender',
  FAT_PERCENT: 'Fat %',
  QUALITY_GRADE: 'Quality grade',
  APPEARANCE_TYPE: 'Appearance type',
  PERCENT: '%',

  // Step 4 · Breeding Record
  BREED_TYPE: 'Breed Type',
  SIRE: 'Sire / Bull',
  BREEDING_METHOD: 'Breeding Method',
  BREED_COLOR: 'Breed color',
  INSEMINATION_TYPE: 'Insemination type',
  PREGNANCY_CHECK_TYPE: 'Pregnancy check Type',
  PREGNANCY_RESULT: 'Pregnancy Result',
  EXAMINATION_METHOD: 'Examination method',
  CALVING: 'Calving',
  CALVING_OUTCOME: 'Calving Outcome',
  DELIVERY_TYPE: 'Delivery type',
  EXPECTED_DELIVERY_DAY: 'Expected Delivery Day',

  // Step 5 · Health Record
  CHECKUP_TYPE: 'Checkup Type',
  HEALTH_STATUS: 'Health status',
  TREATMENT_TYPE: 'Treatment type',
  MEDICINE_TYPE: 'Medicine type',
  FREQUENCY: 'Frequency',
  SYMPTOMS: 'Symptoms / Observations',
  EXAMINATION_FINDINGS: 'Examination findings',
  DIAGNOSIS: 'Diagnosis',
  TREATMENT_REQUIRED: 'Treatment required',
  TARGET_PARASITE: 'Target parasite',
  ADMINISTRATION_ROUTE: 'Administration route',

  SELECT_PLACEHOLDER: 'Select',
  BTN_ADD: 'Add',
  ADD_NOT_AVAILABLE: 'Adding a new option is not available yet',
  counter: (n: number, max: number): string => `${n} / ${max}`,
  counterAria: (n: number, max: number): string => `${n} of ${max} characters used`,

  BTN_BACK: 'Back',
  BTN_NEXT: 'Next',
  BTN_SAVE: 'Save Livestock',

  ERROR_REQUIRED: 'This field is required.',
  ERROR_POSITIVE: 'Enter a number greater than 0.',
  ERROR_PERCENT: 'Enter a percentage between 0 and 100.',
  ERROR_SUMMARY: 'Some fields need your attention.',
  SAVED_DEMO: 'Saved (demo — not stored)',
} as const;
