/**
 * UI string catalogue for the Farmer Details → Produce Listing tab.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has
 * no i18n framework yet (see listings-queue.strings.ts), so this catalogue is the single source
 * of truth until one exists.
 */
export const FARMER_LISTINGS_STRINGS = {
  TITLE: 'Produce Listing',
  SUBTITLE: "Manage the farmer's produce listings, review status and listing history.",

  STAT_TOTAL: 'Total Listings',
  STAT_PENDING: 'Pending Review',
  STAT_APPROVED: 'Approved',
  STAT_REJECTED: 'Rejected',
  STAT_TOTAL_QTY: 'Total Listed Qty',

  SEARCH_PLACEHOLDER: 'Search produce or listing ID…',
  FILTER_ALL_STATUS: 'All Status',
  FILTER_ALL_CROPS: 'All Crops',
  FILTER_ALL_GRADES: 'All Grades',
  FILTER_DATE_RANGE: 'Select date range',
  BTN_EXPORT: 'Export',

  COL_LISTING_ID: 'Listing ID',
  COL_PRODUCE: 'Produce',
  COL_GRADE: 'Grade',
  COL_QUANTITY: 'Quantity',
  COL_COUNTER_PRICE: 'Counter Price',
  COL_LISTED_DATE: 'Listed Date',
  COL_STATUS: 'Status',
  COL_ACTIONS: 'Actions',

  ACTION_VIEW: 'View',
  ACTION_EDIT: 'Edit',
  ACTION_MORE: 'More actions',
  PAGER_PREV: '‹',
  PAGER_NEXT: '›',

  /** ListingStatus (docs/openapi.yaml) → the label the design uses. */
  STATUS: {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Review',
    COUNTER_OFFERED: 'Counter Offered',
    ACCEPTED: 'Approved',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
    EXPIRED: 'Expired',
    FULFILLED: 'Sold',
  },
  /** Grade (docs/openapi.yaml). */
  GRADE: {
    GRADE_1: 'Grade 1',
    GRADE_2: 'Grade 2',
    GRADE_3: 'Grade 3',
    REJECT: 'Reject',
  },

  UNIT_KG: ' kg',
  PER_KG: ' / kg',

  SUMMARY_TITLE: 'Farmer Listing Summary',
  VIEW_ALL: 'View All',
  VIEW_ALL_HINT: 'Opens the admin listings queue (all farmers — the queue has no farmer filter)',
  RECENTLY_LISTED: 'Recently Listed',
  RECENT_EMPTY: 'No listings to show for this farmer yet.',

  ACTIVITY_TITLE: 'Listing Activity',
  ACTIVITY_EMPTY: 'Listing activity is not available yet.',

  TABLE_EMPTY: 'No listings to show for this farmer yet.',
  NOT_AVAILABLE_YET: 'Not available yet',
  /** Tooltip on everything the farmer-scoped listing API would feed (spec gap). */
  NO_FARMER_LISTINGS_API: 'Not available yet — the API has no farmer-scoped listing endpoint',

  listedMeta: (date: string, qty: string): string => `Listed ${date} · ${qty}`,
  produceTitle: (crop: string, grade: string): string => `${crop} · ${grade}`,
  /** Cursor paging: the API reports no total, so the footer names the visible range only. */
  showing: (first: number, last: number): string =>
    last === 0 ? 'Showing 0 listings' : `Showing ${first} – ${last} listings`,
} as const;
