/**
 * UI string catalogue for the Add Farm Records → Crops form.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet (see farmers.strings.ts), so this catalogue is the single source of truth.
 */
export const FARM_RECORDS_CROP_FORM_STRINGS = {
  FORM_LABEL: 'Add crop record',

  SECTION_BASIC: 'Section 1 – Basic crop information',
  SECTION_BOTANICAL: 'Section 2 – Botanical & classification',
  SECTION_GROWING: 'Section 3 – Growing information',
  SECTION_STAGES: 'Section 4 – Growth stages',
  SECTION_NOTES: 'Notes and files',

  CROP_NAME: 'Crop Name',
  CROP_CODE: 'Crop Code',
  CROP_CODE_HELP: 'The code is a permanent identifier and cannot be changed.',
  BTN_GENERATE: 'Generate',
  CROP_CATEGORY: 'Crop Category',
  LOCAL_NAME: 'Local / Alternative Name',
  DESCRIPTION: 'Crop Description',
  UPLOAD_CROP_IMAGE: 'Upload Crop Image',
  UPLOAD_CROP_DOCUMENT: 'Upload Crop Document',
  BTN_UPLOAD: 'Upload',
  UPLOAD_HELP: 'JPG, PNG or PDF, up to 5 MB. Replacing a verified document creates a new version; the previous version stays in history.',

  SCIENTIFIC_NAME: 'Scientific Name',
  CROP_FAMILY: 'Crop Family',
  CROP_TYPE: 'Crop Type / Classification',
  SPECIES: 'Species / Variety',

  SEASON: 'Suitable Season',
  ZONE: 'Suitable Zone',
  SOIL: 'Suitable Soil',
  EXAM_HARVEST_DAYS: 'Examination Harvest Days',
  GRADES_SUPPORTED: 'Grades Supported',

  STAGES_HINT: 'Typical days spent in each of the 7 stages. All optional.',
  STAGE_LABEL: {
    SEEDLING: 'Seedling',
    GERMINATION: 'Germination',
    VEGETATIVE: 'Vegetative',
    FLOWERING: 'Flowering',
    FRUIT_SETTING: 'Fruit-setting',
    RIPENING: 'Ripening',
    HARVEST: 'Harvest',
  } as Readonly<Record<string, string>>,
  stageDaysLabel: (n: number, stage: string): string => `${n}. ${stage} (days)`,
  ENTER_DAYS: 'Enter days',
  totalDays: (n: number): string => `Total: ${n} ${n === 1 ? 'day' : 'days'}`,

  NOTES: 'Notes',
  NOTES_PLACEHOLDER: 'Enter notes (up to 300 characters)',
  NOTES_HELP: 'Up to 300 characters.',

  SELECT_PLACEHOLDER: 'Select',
  BTN_ADD: 'Add',
  ADD_NOT_AVAILABLE: 'Adding a new option is not available yet',

  BTN_CANCEL: 'Cancel',
  BTN_SAVE: 'Save Crop',

  chosenFile: (name: string): string => `Selected: ${name}`,
  NO_FILE: 'No file selected',
  ERR_REQUIRED: 'This field is required.',
  ERR_CODE_REQUIRED: 'Generate a crop code.',
  ERR_WHOLE_DAYS: 'Enter whole days (0 or more).',
  ERR_POSITIVE_DAYS: 'Enter a whole number of days greater than 0.',
  ERR_FILE_TOO_LARGE: 'The file is larger than 5 MB.',
  ERR_FILE_TYPE: 'Choose a JPG, PNG or PDF file.',
  ERROR_SUMMARY: 'Some fields need your attention.',
  SAVED_DEMO: 'Saved (demo — not stored)',
} as const;
