/**
 * UI string catalogue for the "Audit submitted successfully" popup shown after Review & Submit
 * (design 93 completed variant). Per root CLAUDE.md §2.7 strings do not live in components.
 */
export const AUDIT_SUBMIT_SUCCESS_STRINGS = {
  TITLE: 'Audit submitted successfully',
  /** Interpolated with the audit id and farmer name from the audit. */
  message: (auditId: string, farmerName: string): string =>
    `Audit ${auditId} for ${farmerName} has been submitted for review.`,
  OK: 'OK',
} as const;
