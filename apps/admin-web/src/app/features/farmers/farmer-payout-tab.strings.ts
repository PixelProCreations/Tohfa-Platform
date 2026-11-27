/**
 * UI string catalogue for the Farmer Details → Payout tab.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
export const FARMER_PAYOUT_STRINGS = {
  // ---------- Tab heading ----------
  TITLE: 'Payout',
  SUBTITLE: "View the farmer's payout summary and transaction history.",

  // ---------- Summary cards ----------
  STAT_TOTAL_PAID: 'Total Paid',
  STAT_PENDING: 'Pending Payout',
  STAT_FAILED: 'Failed Payout',
  STAT_LAST: 'Last Payout',

  // ---------- Payout history ----------
  HISTORY_TITLE: 'Payout History',
  HISTORY_SUBTITLE: 'A record of payouts made to this farmer.',
  SEARCH_PLACEHOLDER: 'Search by Payout ID, Purchase Reference...',
  SEARCH_LABEL: 'Search payouts by payout ID or purchase reference',
  DATE_FILTER_LABEL: 'Filter payouts by date',
  STATUS_FILTER_LABEL: 'Filter payouts by status',
  DATE_RANGE: {
    ALL: 'All Dates',
    LAST_30: 'Last 30 days',
    LAST_90: 'Last 90 days',
    THIS_YEAR: 'This year',
  } as const,
  STATUS_ALL: 'All Status',
  STATUS: {
    SETTLED: 'Settled',
    PAID: 'Paid',
    FAILED: 'Failed',
    PENDING: 'Pending',
  } as const,

  // ---------- Table ----------
  COL_PAYOUT_ID: 'Payout ID',
  COL_PURCHASE_REF: 'Purchase Reference',
  COL_DATE: 'Date',
  COL_AMOUNT: 'Amount',
  COL_METHOD: 'Payment Method',
  COL_STATUS: 'Status',
  COL_ACTION: 'Action',
  ACTION_VIEW: 'View Details',
  NOT_AVAILABLE_YET: 'Not available yet',
  viewDetailsLabel: (payoutId: string): string => `View details for ${payoutId} (not available yet)`,
  TABLE_EMPTY: 'No payouts match your search or filters.',
  resultCount: (n: number): string => (n === 1 ? '1 payout shown' : `${n} payouts shown`),
} as const;
