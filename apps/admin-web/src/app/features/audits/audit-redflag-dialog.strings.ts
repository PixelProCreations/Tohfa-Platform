/**
 * UI string catalogue for the "Red-flag this audit?" dialog (design 95, SA-M5-S05a). Per root
 * CLAUDE.md §2.7 strings do not live in components.
 */
export const AUDIT_REDFLAG_DIALOG_STRINGS = {
  TITLE: 'Red-flag this audit?',
  /** Screen-reader description of the dialog (design 95 draws no subtitle). */
  DESCRIPTION:
    'Red-flagging marks this audit for follow-up. Select at least one finding type and enter a reason.',
  CLOSE: 'Close',

  SUMMARY_LABEL: 'Audit summary',
  ROW_AUDIT: 'Audit',
  ROW_FARM: 'Farm',
  ROW_MINOR: 'Minor Findings',
  ROW_MAJOR: 'Major Findings',

  FINDING_TYPES: 'Finding types',
  CHECK_MINOR: 'Minor Findings',
  CHECK_MAJOR: 'Major Findings',

  REASON: 'Reason',
  REASON_PLACEHOLDER: 'Why is this audit being red-flagged?',

  CANCEL: 'Cancel',
  CONFIRM: 'Red-flag Audit',
  /** Read with the disabled confirm button so it is clear what is missing. */
  CONFIRM_HINT: 'Select at least one finding type and enter a reason to red-flag this audit.',
} as const;
