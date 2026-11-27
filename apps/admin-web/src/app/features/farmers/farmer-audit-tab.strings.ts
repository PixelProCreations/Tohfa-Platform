/**
 * UI string catalogue for the Farmer Details → Audit tab.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other farmer catalogues — this file is the single source of
 * truth until one exists.
 */
export const FARMER_AUDIT_STRINGS = {
  // ---------- Tab heading ----------
  TITLE: 'Audit',
  SUBTITLE: 'View audit status, certification validity and corrective actions for the farmer.',
  regionLabel: (farmer: string): string => `Audit for ${farmer}`,

  // ---------- Audit Summary ----------
  SUMMARY_TITLE: 'Audit Summary',
  SUMMARY_CERTIFICATION: 'Certification',
  SUMMARY_EXPIRY: 'Expiry',
  SUMMARY_LATEST_AUDIT: 'Latest audit',
  SUMMARY_NEXT_AUDIT: 'Next audit',
  SUMMARY_OPEN_ACTIONS: 'Open corrective actions',
  latestAudit: (id: string, status: string): string => `${id} · ${status}`,

  // ---------- Audit Overview ----------
  OVERVIEW_TITLE: 'Audit Overview',
  OVERVIEW_LATEST_AUDIT: 'Latest Audit',
  OVERVIEW_AUDIT_STATUS: 'Audit Status',
  OVERVIEW_NEXT_AUDIT: 'Next Audit',
  OVERVIEW_CERTIFICATION: 'Certification',
  OVERVIEW_OPEN_ACTIONS: 'Open Corrective Actions',
  certificationOn: (status: string, date: string): string => `${status} (${date})`,

  // ---------- Status labels ----------
  CERTIFICATION_LABEL: { VALID: 'Valid', EXPIRING: 'Expiring soon', EXPIRED: 'Expired' } as const,
  AUDIT_STATUS_LABEL: {
    PASSED: 'Passed',
    CORRECTIVE_ACTION_REQUIRED: 'Corrective action required',
    FAILED: 'Failed',
  } as const,

  // ---------- Corrective Actions ----------
  ACTIONS_TITLE: 'Corrective Actions',
  ACTIONS_EMPTY: 'No open corrective actions.',
  BTN_VIEW_DETAILS: 'View Details',
  viewDetailsLabel: (title: string): string => `View details: ${title}`,
} as const;
