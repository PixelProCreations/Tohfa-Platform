/**
 * UI string catalogue for the Farmer Details → Subscription tab and its success dialogs.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
export const FARMER_SUBSCRIPTION_STRINGS = {
  // ---------- Tab heading ----------
  TITLE: 'Subscription',
  SUBTITLE: "Manage the farmer's subscription plan, free-tier limits, extensions and fee waivers.",

  // ---------- Current Plan ----------
  CURRENT_PLAN_TITLE: 'Current Plan',
  PLAN: 'Plan',
  STATUS: 'Status',
  PERIOD: 'Period',
  AMOUNT: 'Amount',
  STATUS_LABEL: { ACTIVE: 'Active', EXPIRED: 'Expired', SUSPENDED: 'Suspended' } as const,
  period: (start: string, end: string): string => `${start} to ${end}`,
  amountPer: (amount: string, cycle: 'YEAR' | 'MONTH'): string => `${amount} per ${cycle === 'YEAR' ? 'year' : 'month'}`,

  // ---------- Free-tier Limits ----------
  FREE_TIER_TITLE: 'Free-tier Limits',
  FREE_LISTINGS: 'Free listings per month',
  FREE_STORAGE: 'Free storage days',
  RESETS: 'Resets',
  usedOf: (used: number, limit: number): string => `${used} of ${limit} used`,

  // ---------- Extend Subscription ----------
  EXTEND_TITLE: 'Extend Subscription',
  EXTEND_BY: 'Extend by',
  DURATION_30: '30 days',
  DURATION_90: '90 days',
  DURATION_365: '1 year',
  NEW_EXPIRY: 'New expiry date',
  REQUIRED_PAREN: '(required)',
  REASON: 'Reason',
  BTN_EXTEND: 'Extend Subscription',
  days: (n: number): string => (n === 1 ? '1 day' : `${n} days`),

  // ---------- Waive Fee ----------
  WAIVE_TITLE: 'Waive Fee',
  WAIVE: 'Waive',
  waiveCurrentRenewal: (amount: string): string => `Current renewal (${amount})`,
  WAIVE_FULL_PLAN: 'Full plan',
  BTN_WAIVE: 'Waive Fee',

  // ---------- Success dialogs ----------
  BTN_OKAY: 'Okay',
  BTN_CLOSE: 'Close',
  EXTEND_SUCCESS_TITLE: 'Extend Subscription Successful!',
  extendSuccessSubtitle: (farmer: string): string => `${farmer}'s subscription has been extended successfully.`,
  EXTENDED_BY: 'Extended By',
  NEW_EXPIRY_DATE: 'New Expiry Date',
  WAIVE_SUCCESS_TITLE: 'Fee Waived Successfully!',
  waiveSuccessSubtitle: (farmer: string): string => `${farmer}'s subscription fee has been waived successfully.`,
  WAIVED: 'Waived',
} as const;
