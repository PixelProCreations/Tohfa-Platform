/**
 * UI string catalogue for the Farmer Details → History tab.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
export const FARMER_HISTORY_STRINGS = {
  // ---------- Tab heading ----------
  TITLE: 'Farmer History',
  SUBTITLE: 'View a chronological record of farmer activities and updates.',
  regionLabel: (farmer: string): string => `History for ${farmer}`,

  // ---------- Toolbar ----------
  YEAR_LABEL: 'Year',
  SEARCH_LABEL: 'Search history',
  SEARCH_PLACEHOLDER: 'Search history (e.g. produce listing, audit, rating...)',
  BTN_FILTER: 'Filter history',

  // ---------- Timeline ----------
  timelineLabel: (year: string): string => `History entries for ${year}`,
  EMPTY: 'No history entries match.',
} as const;
