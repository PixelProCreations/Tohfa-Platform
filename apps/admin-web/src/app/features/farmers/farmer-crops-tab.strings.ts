/**
 * UI string catalogue for Farmer Records → Plant & Crops (list, Edit Crop page, Record Harvest and
 * Update Crop Growth Stage dialogs).
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
import type { CropStageCodeMock, FarmCropStatusMock } from './farmer-crops.mock';

/** Character limits shown by the design's counters. */
export const CROPS_LIMITS = {
  harvestNotes: 300,
  stageNotes: 500,
  description: 300,
  cropNotes: 300,
  /** crop_master.name — docs/openapi.yaml `CropMaster` (max 120). */
  name: 120,
  localName: 120,
  /** "Upload up to 5 photos" — design copy. */
  stagePhotos: 5,
} as const;

export const FARMER_CROPS_STRINGS = {
  /* ---------- List ---------- */
  TITLE: 'Plant & Crops',
  SUBTITLE: "View and manage the farmer's crops and planting details.",
  SEARCH_PLACEHOLDER: 'Search crops…',
  SEARCH_LABEL: 'Search crops',
  FILTERS_LABEL: 'Filter crops',
  BTN_PLANT_CROP: 'Plant a crop',
  GROWTH_STAGE: 'Growth Stage',
  EXPECTED_HARVEST: 'Expected Harvest',
  CALCULATED: '(Calculated)',
  HARVESTED_ON: 'Harvested On',
  STATUS_HARVESTED: 'Status: Harvested',
  NO_STAGE: 'Not recorded',
  NO_DATE: '—',
  PHOTO_ALT: 'Crop photo placeholder',
  SEED_SOURCE: 'Seed Source:',
  GRADE: 'Grade:',
  HARVEST: 'Harvest:',
  SOURCE: 'Source:',
  NOT_HARVESTED: 'Not harvested',
  BTN_EDIT: 'Edit',
  BTN_UPDATE_STAGE: 'Update Stage',
  BTN_RECORD_HARVEST: 'Record Harvest',
  HARVESTED_CLOSED: 'Harvested records are closed and cannot be edited.',
  NO_CROPS: 'No crops have been recorded for this farmer yet.',
  NO_MATCHES: 'No crops match your search.',
  CROP_DETAILS_LABEL: 'Crop details',

  STATUS_LABEL: {
    PLANNED: 'Planned',
    GROWING: 'Growing',
    HARVESTED: 'Harvested',
    FAILED: 'Failed',
  } satisfies Record<FarmCropStatusMock, string>,

  STAGE_LABEL: {
    SEEDLING: 'Seedling',
    GERMINATION: 'Germination',
    VEGETATIVE: 'Vegetative',
    FLOWERING: 'Flowering',
    FRUIT_SETTING: 'Fruit-setting',
    RIPENING: 'Ripening',
    HARVEST: 'Harvest',
  } satisfies Record<CropStageCodeMock, string>,

  /** Placeholder guidance copy (design text for Flowering; the others follow the same pattern). */
  STAGE_GUIDANCE: {
    SEEDLING: 'The seedling stage covers sowing and early establishment. Keep the soil moist and protect young plants.',
    GERMINATION: 'The germination stage starts when seeds sprout. Maintain even moisture and watch for damping-off.',
    VEGETATIVE: 'The vegetative stage builds leaves and stems. Ensure steady nutrient supply and weed control.',
    FLOWERING:
      'The flowering stage starts when the plant develops flower buds. Ensure proper watering, nutrient supply and pest control during this stage.',
    FRUIT_SETTING: 'The fruit-setting stage starts when flowers turn into fruit. Keep watering regular and support heavy plants.',
    RIPENING: 'The ripening stage starts when produce changes colour or matures. Reduce watering and plan the harvest.',
    HARVEST: 'The harvest stage means the crop is ready to pick. Record the harvest once it is complete.',
  } satisfies Record<CropStageCodeMock, string>,

  /* ---------- Dialog chrome ---------- */
  BTN_CLOSE: 'Close',
  BTN_CANCEL: 'Cancel',
  REQUIRED: 'required',

  /* ---------- Record Harvest ---------- */
  HARVEST_TITLE: 'Record Harvest',
  CROP: 'Crop',
  CROP_ID: 'Crop ID',
  PLANTED: 'Planted',
  CURRENT_STAGE_SHORT: 'Current stage',
  EXPECTED_HARVEST_SHORT: 'Expected harvest',
  HARVEST_DATE: 'Harvest date (required)',
  HARVEST_QTY: 'Harvest quantity (whole kg) (required)',
  HARVEST_QTY_PLACEHOLDER: 'e.g. 250',
  HARVEST_GRADE: 'Grade (optional)',
  HARVEST_GRADE_PLACEHOLDER: 'Select grade',
  HARVEST_SOURCE: 'Harvest source (optional)',
  HARVEST_SOURCE_PLACEHOLDER: 'Select source',
  HARVEST_NOTES: 'Notes (optional)',
  HARVEST_NOTES_PLACEHOLDER: 'Enter notes about the harvest (e.g., quality, market, storage, etc.)',
  HARVEST_WARNING: 'Recording harvest closes this crop record. Harvested records cannot be edited afterward.',
  ERR_HARVEST_DATE: 'Enter a harvest date on or after the planting date.',
  ERR_HARVEST_QTY: 'Enter a whole number of kilograms, greater than zero.',

  /* ---------- Update Crop Growth Stage ---------- */
  STAGE_TITLE: 'Update Crop Growth Stage',
  STAGE_PROGRESS_LABEL: 'Growth stage progress',
  UPDATE_DETAILS: 'Update Stage Details',
  NEW_STAGE: 'Select New Stage',
  NEW_STAGE_PLACEHOLDER: 'Select stage',
  STAGE_DATE: 'Stage Date',
  STAGE_COMPLETION_DATE: 'Stage Completion Date',
  STAGE_NOTES: 'Notes (Optional)',
  STAGE_NOTES_PLACEHOLDER: 'Add observations about this stage',
  PHOTOS: 'Supporting Photos (Optional)',
  PHOTOS_HINT: 'Upload up to 5 photos. JPG, PNG or WEBP (Max 5 MB each).',
  ADD_PHOTO: 'Add Photo',
  REMOVE_PHOTO: 'Remove photo',
  CURRENT_DETAILS: 'Current Stage Details',
  CURRENT_STAGE: 'Current Stage',
  PLANTED_ON: 'Planted On',
  STAGE_DURATION: 'Stage Duration',
  DAYS_COMPLETED: 'Days Completed',
  NEXT_STAGE: 'Next Stage',
  STAGE_GUIDANCE_TITLE: 'Stage Guidance',
  STAGE_NOTE:
    "Moving to a later stage will update the crop's progress and expected harvest estimate. Do not mark the crop as harvested here.",
  BTN_SAVE_STAGE: 'Save Stage Update',
  STEP_CURRENT: '(Current)',
  STEP_UPCOMING: '(Upcoming)',
  STEP_SKIPPED: '(Skipped)',
  FINAL_STAGE: 'This crop is already at the final stage.',
  ERR_STAGE_DATE: 'The stage date cannot be before the current stage began.',
  ERR_COMPLETION_DATE: 'The completion date cannot be before the stage date.',

  /* ---------- Edit Crop ---------- */
  EDIT_TITLE: 'Edit Crop',
  EDIT_SUBTITLE: "Update the farmer's crop details and growing information.",
  BACK: 'Back to Plant & Crops',
  SECTION_BASIC: '1. Basic Crop Information',
  SECTION_BOTANICAL: '2. Botanical & Classification',
  SECTION_GROWING: '3. Growing Information',
  SECTION_STAGES: '4. Growth Stages',
  SECTION_NOTES: '5. Notes & Documents',
  CROP_NAME: 'Crop Name',
  CROP_CODE: 'Crop Code',
  CROP_CODE_HELP: 'The crop code is a permanent identifier and cannot be changed.',
  CROP_CATEGORY: 'Crop Category',
  LOCAL_NAME: 'Local / Alternative Name (optional)',
  DESCRIPTION: 'Crop Description',
  CROP_IMAGE: 'Crop Image',
  CROP_IMAGE_ALT: 'Crop image placeholder',
  NO_IMAGE: 'No image',
  REPLACE_IMAGE: 'Replace Image',
  REMOVE_IMAGE: 'Remove',
  IMAGE_HINT: 'JPG, PNG or WEBP (Max 5 MB)',
  SCIENTIFIC_NAME: 'Scientific Name',
  CROP_FAMILY: 'Crop Family',
  CROP_TYPE: 'Crop Type / Classification',
  SPECIES: 'Species / Variety',
  SEASON: 'Suitable Season',
  ZONE: 'Suitable Zone',
  SOIL: 'Suitable Soil',
  EXAM_HARVEST_DAYS: 'Examination harvest days',
  GRADES_SUPPORTED: 'Grades Supported',
  STAGES_HINT: 'Typical days spent in each of the 7 stages.',
  NOTES_LIMITED: 'Notes (up to 300 characters)',
  CROP_DOCUMENT: 'Crop Document',
  NO_DOCUMENT: 'No document attached.',
  PDF: 'PDF',
  DOWNLOAD_DOC: 'Download document',
  REPLACE_DOC: 'Replace document',
  BTN_SAVE: 'Save Changes',
  ERR_REQUIRED: 'This field is required.',
  ERR_WHOLE_DAYS: 'Enter a whole number of days.',
  ERR_POSITIVE_DAYS: 'Enter a whole number of days, greater than zero.',

  /* ---------- Formatters ---------- */
  /** "4 crop records" */
  cropCount: (n: number) => `${n} crop ${n === 1 ? 'record' : 'records'}`,
  /** "5 of 7 – Flowering" */
  stageOf: (n: number, total: number, label: string) => `${n} of ${total} – ${label}`,
  planted: (date: string) => `Planted: ${date}`,
  cropIdLine: (id: string) => `Crop ID: ${id}`,
  cropIdChip: (id: string) => `Crop ID: ${id}`,
  acres: (n: number) => `${n.toFixed(1)} ${n === 1 ? 'acre' : 'acres'}`,
  yieldKg: (kg: number) => `Yield: ${kg} kg`,
  gradeLine: (g: string) => `Grade: ${g}`,
  harvestedSummary: (kg: number, date: string) => `${kg} kg on ${date}`,
  /** "Carrot - Nantes (Plot A)" */
  cropWithPlot: (name: string, plot: string) => `${name} (${plot})`,
  editingFor: (name: string, code: string) =>
    name && code ? `Editing for ${name} (${code})` : name ? `Editing for ${name}` : code ? `Editing for ${code}` : 'Editing for this farmer',
  days: (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`,
  illustrativeDays: (n: number) => `${n} ${n === 1 ? 'day' : 'days'} (illustrative)`,
  stageDaysLabel: (index: number, label: string) => `${index}. ${label} (days)`,
  totalDuration: (n: number) => `Total Duration: ${n} days`,
  counter: (n: number, max: number) => `${n} / ${max}`,
  counterAria: (n: number, max: number) => `${n} of ${max} characters used`,
  lastUpdated: (date: string, by: string) => `Last updated ${date} by ${by}`,
  docMeta: (size: string) => `PDF · ${size}`,
  expandLabel: (name: string, open: boolean) => (open ? `Hide details for ${name}` : `Show details for ${name}`),
  editLabel: (name: string) => `Edit ${name}`,
  updateStageLabel: (name: string) => `Update stage for ${name}`,
  recordHarvestLabel: (name: string) => `Record harvest for ${name}`,
  stepLabel: (n: number, label: string, state: string) => `Stage ${n}, ${label}, ${state}`,
  photoLabel: (n: number) => `Supporting photo ${n}`,
  removePhotoLabel: (n: number) => `Remove supporting photo ${n}`,
  segmentsLabel: (done: number, total: number) => `${done} of ${total} stages reached`,
} as const;
