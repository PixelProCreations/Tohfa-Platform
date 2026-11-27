/**
 * UI string catalogue for the Farmer Directory screen (SA-M3-S01).
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin
 * console has no i18n framework yet (see listings-queue.strings.ts), so — like the
 * other modules — this catalogue is the single source of truth until one exists.
 */
export const FARMERS_STRINGS = {
  TITLE: 'Farmers Management',
  BREADCRUMB_DASHBOARD: 'Dashboard',
  BREADCRUMB_MODULE: 'Farmers Management',
  BREADCRUMB_CURRENT: 'Farmer Directory',

  BTN_EXPORT: 'Export',
  NOT_AVAILABLE_YET: 'Not available yet',

  KPI_TOTAL: 'Total Farmers',
  KPI_ACTIVE: 'Active Farmers',
  KPI_PENDING_APPLICATIONS: 'Pending Applications',
  KPI_INACTIVE: 'Inactive Farmers',
  KPI_EXPIRED_CERTIFICATIONS: 'Expired Certifications',

  QUICK_ACTIONS: 'Quick Actions',
  QA_FARM_RECORDS: 'Farm Records',
  QA_APPROVALS_INBOX: 'Approvals Inbox',
  QA_FARMERS_APPLICATIONS: "Farmer's & Applications",
  QA_ADD_FARMER: 'Add Farmer',

  // The list API's `q` matches name or mobile only (docs/openapi.yaml listAdminFarmers),
  // so the placeholder does not promise a Farmer ID search.
  SEARCH_PLACEHOLDER: 'Search by name or mobile number',
  FILTER_ZONE: 'Zone:',
  FILTER_STATUS: 'Status:',
  FILTER_FARMING_METHOD: 'Farming Method:',
  FILTER_KYC: 'KYC:',
  FILTER_CERTIFICATION: 'Certification:',
  FILTER_ALL: 'All',
  FILTER_NOT_IN_SPEC: 'Not yet supported by the farmer directory API',
  CLEAR_FILTERS: 'Clear filters',

  COL_FARMER_ID: 'Farmer ID',
  COL_FARMER_NAME: 'Farmer Name',
  COL_MOBILE: 'Mobile',
  COL_ZONE: 'Zone',
  COL_FARMING_METHOD: 'Farming Method',
  COL_KYC: 'KYC',
  COL_CERTIFICATION: 'Certification',
  COL_RATING: 'Rating',
  COL_STATUS: 'Status',
  COL_ACTIONS: 'Actions',

  STATUS_ACTIVE: 'Active',
  STATUS_PENDING: 'Pending',
  STATUS_DISABLED: 'Inactive',
  KYC_VERIFIED: 'Verified',
  KYC_PENDING: 'Pending',
  KYC_REJECTED: 'Rejected',

  /** `overallRating` is 0–100 per docs/openapi.yaml AdminFarmerListItem. */
  RATING_SUFFIX: ' / 100',

  ACTION_VIEW: 'View farmer',
  ACTION_EDIT: 'Edit farmer',
  ACTION_EDIT_NOT_PERMITTED: 'Your role cannot edit farmer profiles',
  ACTION_MORE: 'More actions',

  EMPTY: 'No farmers match the selected filters.',
  LOAD_ERROR: 'Could not load the farmer directory. Please try again.',
  PREV: 'Prev',
  NEXT: 'Next',
  showing: (first: number, last: number, total: number | null): string =>
    total === null
      ? `Showing ${first}–${last} farmers`
      : `Showing ${first}–${last} of ${total} farmers`,
} as const;
