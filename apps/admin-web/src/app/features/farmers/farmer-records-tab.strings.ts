/**
 * UI string catalogue for the Farmer Details → Farmer Records tab (Diary, Plant & Crops, Livestock,
 * Assets sub-tabs).
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
export const FARMER_RECORDS_STRINGS = {
  TITLE: 'Farmer Records',
  SUBTITLE: "View and manage the farmer's diary, plant & crops, livestock and assets records.",
  BTN_ADD_DIARY_ENTRY: 'Add Diary Entry',
  BTN_EDIT: 'Edit',
  SUB_TABS_LABEL: 'Farmer record types',

  SUB_TAB_DIARY: 'Diary',
  SUB_TAB_CROPS: 'Plant & Crops',
  SUB_TAB_LIVESTOCK: 'Livestock',
  SUB_TAB_ASSETS: 'Assets',

  SEARCH_PLACEHOLDER: 'Search...',
  SEARCH_LABEL: 'Search diary entries',
  FILTERS_LABEL: 'Filter diary entries',

  BADGE_ON_BEHALF: 'Added on behalf',
  BADGE_FARMER_OWN: "Farmer's own",
  NO_WORKFORCE: 'No workforce logged',
  NO_LINKED_CROP: 'No linked crop',
  PHOTO_ALT: 'Diary entry photo',
  ENTRY_META_LABEL: 'Entry details',

  NO_ENTRIES: 'No diary entries have been recorded for this farmer yet.',
  NO_MATCHES: 'No diary entries match your search.',

  /** Author of entries added from this screen (placeholder until the signed-in admin is wired). */
  ADDED_BY_SELF: 'Demo Super Admin',

  /** "Nutrient · Compost application" */
  entryTitle: (category: string, activity: string) => `${category} · ${activity}`,
  /** "Plot 2 (1.2 acre)" */
  plot: (name: string, acres: number) => `${name} (${acres} acre)`,
  minutes: (n: number) => `${n} minutes`,
  linkedCrop: (crop: string) => `Linked crop: ${crop}`,
  /** "Workforce: 2 workers, 4 hrs each" */
  workforce: (workers: number, hoursEach: number) =>
    `Workforce: ${workers} ${workers === 1 ? 'worker' : 'workers'}, ${hoursEach} ${hoursEach === 1 ? 'hr' : 'hrs'} each`,
  photos: (n: number) => `${n} ${n === 1 ? 'photo' : 'photos'}`,
  addedBy: (name: string, onBehalf: boolean) => (onBehalf ? `Added by ${name} on behalf` : `Added by ${name}`),
  /** "2 diary entries" */
  entryCount: (n: number) => `${n} diary ${n === 1 ? 'entry' : 'entries'}`,
  editEntryLabel: (title: string) => `Edit ${title}`,
} as const;
