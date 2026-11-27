/** UI strings for Farmers Management → Farmer Ratings list (root CLAUDE.md §2.7). */
export const FARMER_RATINGS_LIST_STRINGS = {
  TITLE: 'Farmer Ratings',
  BREADCRUMB_LABEL: 'Breadcrumb',
  CRUMB_DASHBOARD: 'Dashboard',
  CRUMB_FARMERS: 'Farmers Management',
  CRUMB_CURRENT: 'Farmer Ratings',

  COL_ID: 'Farmer ID',
  COL_NAME: 'Name',
  COL_ZONE: 'Zone',
  COL_RATING: 'Rating',
  COL_TIER: 'Tier',
  COL_ACTIONS: 'Actions',

  NO_RATING: '—',
  TIER_NONE: 'Unrated',
  ACTION_VIEW: 'View',
  EMPTY: 'No farmers found.',
  rating: (value: number): string => `${value.toFixed(1)}/5`,
  viewLabel: (name: string): string => `View rating for ${name}`,
} as const;
