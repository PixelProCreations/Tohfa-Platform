/**
 * UI string catalogue for Farmer Details → Farmer Records → Livestock: the animal list, the
 * five-step Edit Livestock Record stepper, the saved modal and the End record modal.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists. Option labels live beside their option lists in farmer-livestock.mock.ts.
 */
export const FARMER_LIVESTOCK_STRINGS = {
  DASH: '—',
  DEFAULT_FARMER_NAME: 'the farmer',

  // ---------- List ----------
  TITLE: 'Livestock',
  SUBTITLE: "View and manage the farmer's livestock records.",
  BTN_REGISTER: 'Register animal',
  SEARCH_PLACEHOLDER: 'Search livestock (e.g. animal ID, breed, name)…',
  SEARCH_LABEL: 'Search livestock',
  FILTERS_LABEL: 'Filter livestock',
  PHOTO_ALT: 'Animal photo placeholder',
  NO_PHOTO: 'No photo',
  STATUS_ACTIVE: 'Active',
  STATUS_ENDED: 'Ended',
  COL_BREED: 'Breed',
  COL_PRODUCTION_LOGS: 'Production logs',
  COL_LATEST: 'Latest',
  COL_SOURCE: 'Source',
  NO_PRODUCTION: 'No production logged',
  SOURCE_FARMER: 'Added by the farmer',
  SOURCE_ADMIN: 'Added by an admin on behalf',
  BTN_LOG_PRODUCTION: 'Log Production',
  BTN_EDIT: 'Edit',
  BTN_END_RECORD: 'End Record',
  NO_ANIMALS: 'No livestock has been recorded for this farmer yet.',
  NO_MATCHES: 'No livestock matches your search.',

  // ---------- Edit stepper ----------
  STEPPER_TITLE: 'Livestock Records',
  STEPPER_LABEL: 'Edit livestock record progress',
  STEP_DONE: 'completed',
  STEP_CURRENT: 'current step',
  STEP_UPCOMING: 'not started',
  STEPS: [
    { title: 'Basic Information', subtitle: 'Update the basic details of the livestock.' },
    { title: 'Feed Record', subtitle: 'Update the livestock feed details.' },
    { title: 'Production Record', subtitle: 'Update the livestock production details.' },
    { title: 'Breeding Record', subtitle: 'Update the breeding details of the livestock.' },
    { title: 'Health Record', subtitle: 'Update the livestock health details.' },
  ],
  BTN_CANCEL: 'Cancel',
  BTN_SAVE: 'Save Livestock Record',
  SELECT_PLACEHOLDER: 'Select',
  ERROR_REQUIRED: 'This field is required.',
  ERROR_POSITIVE: 'Enter a number greater than 0.',
  ERROR_PERCENT: 'Enter a percentage between 0 and 100.',
  ERROR_SUMMARY: 'Fill in the highlighted fields to continue.',

  // Step 1
  LIVESTOCK_TYPE: 'Livestock Type',
  LIVESTOCK_ID: 'Livestock ID',
  LIVESTOCK_ID_LOCKED: 'The livestock ID cannot be changed.',
  ANIMAL_PHOTO: 'Animal Photo',
  OPTIONAL: '(optional)',
  BTN_CHANGE_PHOTO: 'Change photo',
  BTN_REMOVE_PHOTO: 'Remove photo',
  SPECIES: 'Species',
  GENDER: 'Gender',
  SOURCE_FARM: 'Source Farm',
  ORGANIC_STATUS: 'Organic Status',
  TAG: 'Tag (required)',
  NAME: 'Name (optional)',
  ACQUIRED_ON: 'Acquired on (required)',
  NOTES: 'Notes (optional)',

  // Step 2
  FEED_PLAN: 'Feed Plan',
  FEED_TYPE: 'Feed Type',
  FEED_SOURCE: 'Source',
  FEED_SUMMARY: 'Current Feed Summary',

  // Step 3
  PRODUCTION_TYPE: 'Production Type',
  PRODUCTION_SECTION: 'Production section',
  PRODUCTION_QUANTITY: 'Production Quantity',
  PRODUCTION_GENDER: 'Gender',
  FAT_PERCENT: 'Fat %',
  PERCENT: '%',
  QUALITY_GRADE: 'Quality grade',
  APPEARANCE_TYPE: 'Appearance type',
  PRODUCTION_SUMMARY: 'Latest Production Summary',
  SUM_PRODUCTION_TYPE: 'Production Type',
  SUM_PRODUCTION_SECTION: 'Production Section',
  SUM_PRODUCTION_QUANTITY: 'Production Quantity',
  SUM_QUALITY_GRADE: 'Quality Grade',
  SUM_APPEARANCE_TYPE: 'Appearance Type',

  // Step 4
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
  BREEDING_SUMMARY: 'Breeding Summary',
  SUM_INSEMINATION_TYPE: 'Insemination Type',
  BREEDING_MALE_NOTE: 'Breeding records apply to female animals only, so these fields are optional for a male animal.',

  // Step 5
  CHECKUP_TYPE: 'Checkup Type',
  HEALTH_STATUS: 'Health Status',
  TREATMENT_TYPE: 'Treatment Type',
  MEDICINE_TYPE: 'Medicine Type',
  FREQUENCY: 'Frequency',
  SYMPTOMS: 'Symptoms / Observations',
  EXAMINATION_FINDINGS: 'Examination Findings',
  DIAGNOSIS: 'Diagnosis',
  TREATMENT_REQUIRED: 'Treatment Required',
  TARGET_PARASITE: 'Target Parasite',
  ADMINISTRATION_ROUTE: 'Administration Route',
  HEALTH_SUMMARY: 'Health Summary',
  SUM_CURRENT_CHECKUP: 'Current Checkup',
  SUM_TREATMENT: 'Treatment',
  SUM_MEDICINE: 'Medicine',
  SUM_NEXT_CHECKUP: 'Next Checkup',

  // Animal summary card
  ANIMAL_SUMMARY_LABEL: 'Animal summary',
  CARD_BREED: 'Breed',
  CARD_GENDER: 'Gender',
  CARD_ACQUIRED: 'Acquired',

  // ---------- Saved modal ----------
  SAVED_TITLE: 'Livestock Record Saved Successfully!',
  SAVED_BODY_BEFORE: 'The livestock details have been updated successfully for ',
  SAVED_BODY_AFTER: '.',
  SAVED_HISTORY: 'Record history retained',
  BTN_VIEW_RECORD: 'View Livestock Record',
  BTN_CLOSE: 'Close',

  // ---------- End record modal ----------
  END_TITLE: "End this animal's record?",
  END_ANIMAL: 'Animal',
  END_WHAT_HAPPENED: 'What happened?',
  END_DATE: 'Date (required)',
  END_REASON: 'Reason (required)',
  END_REASON_PLACEHOLDER: 'Enter reason...',
  END_WARNING: "This ends the animal's active life. It cannot be undone, and no more production can be logged.",

  // ---------- Log production modal ----------
  LOG_TITLE: 'Log Production',
  LOG_SUBTITLE: 'Add a production entry (e.g., milk, egg, etc.) for the selected animal.',
  LOG_ANIMAL: 'Animal',
  LOG_PRODUCT: 'Product',
  LOG_DATE: 'Date (required)',
  LOG_QUANTITY: 'Quantity (whole number)',
  LOG_QUANTITY_PLACEHOLDER: 'e.g. 12',
  LOG_NOTES: 'Notes (optional)',
  LOG_NOTES_PLACEHOLDER: 'Add any additional details about this production entry...',
  LOG_INFO: "This entry will be added to the animal's production history.",
  LOG_ERROR_DATE: 'Enter a valid date that is not in the future.',
  LOG_ERROR_QUANTITY: 'Enter a whole number greater than 0.',

  // ---------- Functions ----------
  /** "Cow COW-01 – Lakshmi" — the name segment is dropped when the animal has none. */
  logAnimal: (type: string, livestockId: string, name: string) =>
    name ? `${type} ${livestockId} – ${name}` : `${type} ${livestockId}`,
  /** "Milk (litres)" */
  productOption: (product: string, unit: string) => `${product} (${unit})`,
  addingFor: (name: string, code: string) => (code ? `Adding for ${name} (${code})` : `Adding for ${name}`),
  /** "Cow · COW-01 · Lakshmi" — the name segment is dropped when the animal has none. */
  animalTitle: (type: string, livestockId: string, name: string) =>
    name ? `${type} · ${livestockId} · ${name}` : `${type} · ${livestockId}`,
  /** "Cow COW-01" in the End-record modal. */
  animalShort: (type: string, livestockId: string) => `${type} ${livestockId}`,
  animalIdLine: (id: string) => `Animal ID: ${id}`,
  acquiredLine: (date: string) => `Acquired: ${date}`,
  /** "4 livestock" */
  count: (n: number) => `${n} livestock`,
  /** "12 litres of milk" / "6 eggs" / "3 kg of wool" */
  productionAmount: (quantity: string, unit: string, product: string) =>
    unit === 'eggs' ? `${quantity} ${unit}` : `${quantity} ${unit} of ${product.toLowerCase()}`,
  /** "12 litres of milk, 27 Oct 2026" */
  latestLine: (amount: string, date: string) => `${amount}, ${date}`,
  quantityWithUnit: (quantity: string, unit: string) => `${quantity} ${unit}`,
  percent: (value: string) => `${value} %`,
  stepHeading: (n: number, title: string) => `Step ${n}: ${title}`,
  stepStatus: (title: string, status: string) => `${title}, ${status}`,
  back: (title: string) => `Back: ${title}`,
  next: (title: string) => `Next: ${title}`,
  counter: (n: number, max: number) => `${n} / ${max}`,
  counterAria: (n: number, max: number) => `${n} of ${max} characters used`,
  sectionsUpdated: (n: number) => `${n} sections updated`,
  editingFor: (name: string, code: string) => (code ? `Editing for ${name} (${code})` : `Editing for ${name}`),
  actionLabel: (action: string, title: string) => `${action}: ${title}`,
} as const;
