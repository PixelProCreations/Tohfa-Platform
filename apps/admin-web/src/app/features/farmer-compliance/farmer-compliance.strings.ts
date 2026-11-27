/** UI strings for Farmers Management → Verification & Compliance (root CLAUDE.md §2.7). */
export const FARMER_COMPLIANCE_STRINGS = {
  TITLE: 'Verification & Compliance',
  BREADCRUMB_LABEL: 'Breadcrumb',
  CRUMB_DASHBOARD: 'Dashboard',
  CRUMB_FARMERS: 'Farmers Management',
  CRUMB_CURRENT: 'Verification & Compliance',
  BTN_EXPORT: 'Export',
  NOT_AVAILABLE_YET: 'Not available yet',

  KPI_TOTAL: 'Total Certifications',
  KPI_VERIFIED: 'Verified',
  KPI_PENDING: 'Pending Verification',
  KPI_EXPIRED: 'Expired Certifications',

  COL_FARMER: 'Farmer Name',
  COL_TYPE: 'Certification Type',
  COL_NUMBER: 'Certificate No.',
  COL_AUTHORITY: 'Issuing Authority',
  COL_ISSUED: 'Issued Date',
  COL_EXPIRY: 'Expiry Date',
  COL_STATUS: 'Status',
  COL_ACTIONS: 'Actions',

  STATUS_EXPIRED: 'Expired',
  STATUS_VERIFIED: 'Verified',
  STATUS_PENDING: 'Pending',
  STATUS_EXPIRING_SOON: 'Expiring Soon',

  ACTION_VERIFY_PORTAL: 'Verify on Portal',
  ACTION_MARK_VERIFIED: 'Mark Verified',
  ACTION_MARK_UNVERIFIED: 'Mark Unverified',
  ACTION_BLOCK_LISTINGS: 'Block Listings',
  ACTION_MORE: 'More actions',

  EMPTY: 'No certifications found.',
  PREV: 'Previous',
  NEXT: 'Next',
  showing: (first: number, last: number, total: number): string =>
    total === 0 ? 'Showing 0 of 0 certifications' : `Showing ${first}–${last} of ${total} certifications`,
} as const;
