/**
 * UI string catalogue for the Farmer Details → Ratings tab, its edit view and the Save Rating
 * confirmation dialog.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
export const FARMER_RATINGS_STRINGS = {
  DASH: '—',
  OUT_OF_100: '/ 100',
  OUT_OF_10: '/10',
  OUT_OF_10_SPACED: ' /10',
  DEFAULT_FARMER_NAME: 'the farmer',

  // ---------- Ratings view ----------
  VIEW_TITLE: 'Farmer Ratings',
  VIEW_SUBTITLE: "Review the farmer's overall performance and category-wise assessment.",
  BTN_EDIT_RATING: 'Edit Rating',
  NEW_OVERALL_RATING: 'New Overall Rating',
  CATEGORIES_TITLE: 'Rating Categories',
  COL_INDEX: '#',
  COL_CATEGORY: 'Category',
  COL_SCORE: 'Score',
  HISTORY_TITLE: 'Rating History',
  HISTORY_EMPTY: 'No ratings have been recorded for this farmer yet.',
  HISTORY_FIRST_RATING: '— (first rating)',
  OVERALL_PROGRESS_LABEL: 'Overall rating',

  // ---------- Edit view ----------
  EDIT_TITLE: 'Edit Farmer Rating',
  EDIT_SUBTITLE: 'Update the category-wise scores and remarks for the farmer.',
  PREVIOUS_RATING: 'Previous Rating',
  CURRENT_RATING_NEW: 'Current Rating (New)',
  UPDATED_OVERALL_RATING: 'Updated Overall Rating',
  RATING_RANGE_LABEL: 'Rating (1 – 10)',
  REMARKS_OPTIONAL: 'Remarks (optional)',
  CATEGORY_REMARKS_PLACEHOLDER: 'Add remarks for this category',
  DETAILS_TITLE: 'Rating Update Details',
  RATING_DATE: 'Rating Date',
  SOURCE: 'Source',
  SOURCE_PLACEHOLDER: 'Select a source',
  RATED_BY: 'Rated By',
  RATED_BY_PLACEHOLDER: 'Name of the person rating',
  UPDATE_REMARKS_PLACEHOLDER: 'Add remarks for this rating update',
  BTN_CANCEL: 'Cancel',
  BTN_SAVE_RATING: 'Save Rating',
  REQUIRED_DATE: 'Rating date is required.',
  REQUIRED_SOURCE: 'Source is required.',
  REQUIRED_RATED_BY: 'Rated by is required.',

  // ---------- Save Rating dialog ----------
  DIALOG_TITLE: 'Save Rating?',
  NEW_RATING: 'New Rating',
  REMARKS: 'Remarks',
  DIALOG_NOTE: "This update will be recorded in the farmer's rating history.",
  BTN_CONFIRM_SAVE: 'Confirm & Save Rating',
  BTN_CLOSE: 'Close',
  CHANGE_UP: 'Improvement',
  CHANGE_DOWN: 'Decline',
  CHANGE_NONE: 'No change',

  outOf100: (score: number) => `${score} / 100`,
  outOf10: (score: number) => `${score}/10`,
  percent: (value: number) => `${value}%`,
  /** "+10", "-5", "0" — the sign is always shown for a non-zero change. */
  signed: (delta: number) => (delta > 0 ? `+${delta}` : `${delta}`),
  previousLine: (score: number) => `Previous: ${score} / 100`,
  changeLine: (signed: string) => `Change: ${signed}`,
  historyPrevious: (previous: string) => `Previous ${previous}`,
  historySource: (source: string) => `Source: ${source}`,
  historyBy: (name: string) => `By ${name}`,
  counter: (used: number, max: number) => `${used} / ${max}`,
  scoreButtonLabel: (category: string, score: number) => `${category}: ${score} out of 10`,
  aboutToUpdate: (name: string) => `You're about to update ${name}'s farmer rating.`,
} as const;
