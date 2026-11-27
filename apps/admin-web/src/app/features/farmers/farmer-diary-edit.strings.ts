/**
 * UI string catalogue for Farmer Records → Diary → Edit / Add Diary Entry (SA-M3-S10a).
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of truth
 * until one exists.
 */
export const FARMER_DIARY_EDIT_STRINGS = {
  TITLE_EDIT: 'Edit Diary Entry',
  TITLE_ADD: 'Add Diary Entry',
  SUBTITLE: "Update the farmer's farm activity record.",
  BTN_BACK: 'Back to diary',

  DATE: 'Date',
  PLOT: 'Plot',
  PLOT_PLACEHOLDER: 'Select a plot',
  CATEGORY: 'Activity category',
  CATEGORY_PLACEHOLDER: 'Select a category',
  ACTIVITY: 'Activity',
  ACTIVITY_PLACEHOLDER: 'Select an activity',
  ACTIVITY_PLACEHOLDER_NO_CATEGORY: 'Select a category first',
  MINUTES: 'Time spent (minutes, 1–1,440)',
  MINUTES_SUFFIX: 'minutes',
  MINUTES_PLACEHOLDER: 'Enter minutes',
  LINKED_CROP: 'Linked crop (optional)',
  LINKED_CROP_NONE: 'No linked crop',

  WORKFORCE: 'Workforce lines (optional)',
  BTN_ADD_WORKER: 'Add Worker',
  COL_WORKER: 'Worker',
  COL_HOURS: 'Hours',
  COL_WAGE: 'Wage (₹)',
  COL_REMOVE: 'Remove',
  WORKER_PLACEHOLDER: 'Select worker',
  NO_WORKERS: 'No workers added.',

  NOTES: 'Notes (up to 500 characters)',
  NOTES_PLACEHOLDER: 'Add notes about this activity…',
  PHOTOS: 'Photos (up to 5)',
  BTN_ADD_PHOTO: 'Add Photo',

  BTN_CANCEL: 'Cancel',
  BTN_SAVE: 'Save Changes',

  ERR_REQUIRED: 'This field is required.',
  ERR_SELECT_WORKER: 'Select a worker.',
  ERR_FORM: 'Please fix the highlighted fields.',

  minutesRange: (min: number, max: number) => `Enter whole minutes between ${min} and ${max.toLocaleString('en-IN')}.`,
  hoursRange: (max: number) => `Hours must be more than 0 and at most ${max}, with up to 2 decimals.`,
  wageWhole: 'Enter the wage in whole rupees, more than 0.',

  /** "Plot 2 · 1.2 acre" */
  plotOption: (name: string, acres: number) => `${name} · ${acres} acre`,
  /** "Tomato · same plot" */
  cropOption: (name: string) => `${name} · same plot`,
  counter: (n: number, max: number) => `${n} / ${max}`,
  counterAria: (n: number, max: number) => `${n} of ${max} characters used`,
  photoLabel: (n: number) => `Photo ${n} (placeholder)`,
  removePhoto: (n: number) => `Remove photo ${n}`,
  workerRowLabel: (n: number) => `Worker line ${n}`,
  workerSelectLabel: (n: number) => `Worker for line ${n}`,
  hoursLabel: (n: number) => `Hours for line ${n}`,
  wageLabel: (n: number) => `Wage in rupees for line ${n}`,
  removeWorker: (n: number) => `Remove worker line ${n}`,
  photosRemaining: (n: number, max: number) => `${n} of ${max} photos added`,

  addedBy: (name: string, onBehalf: boolean) => (onBehalf ? `Added by ${name} on behalf of farmer` : `Added by ${name}`),
  /** "Last updated on 26 Oct 2026, 04:30 PM by Super Admin" */
  lastUpdated: (when: string, by: string) => `Last updated on ${when} by ${by}`,
} as const;
