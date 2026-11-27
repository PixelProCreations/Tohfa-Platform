/**
 * Strings for inspection step 7, "Farm Practices Checklist" (design 85). Shared shell labels (Back to
 * Inspection, Save as Draft, Save & Next) come from audit.strings.ts.
 */
export const AUDIT_STEP_7_STRINGS = {
  /** Pill as drawn in design 85 (the other steps say "Step n of 10"). */
  STEP_PILL: '7 of 10',

  SECTION_FARM_DOCUMENTATION: 'FARM DOCUMENTATION',
  SECTION_ORGANIC_PRACTICES: 'ORGANIC PRACTICES',
  SECTION_CROP_MANAGEMENT: 'CROP MANAGEMENT',
  SECTION_INPUT_USAGE: 'INPUT USAGE',

  /** Long names used in error messages and aria-labels (the headers are drawn upper-case). */
  SECTION_FARM_DOCUMENTATION_NAME: 'Farm Documentation',
  SECTION_ORGANIC_PRACTICES_NAME: 'Organic Practices',
  SECTION_CROP_MANAGEMENT_NAME: 'Crop Management',
  SECTION_INPUT_USAGE_NAME: 'Input Usage',

  LABEL_RESULT: 'Inspection Result',
  LABEL_NOTES: 'Notes',
  LABEL_EVIDENCE_EXISTING: 'Evidence (existing)',
  LABEL_UPLOAD: 'Upload evidence',

  PLACEHOLDER_SELECT: 'Select…',
  PLACEHOLDER_NOTES: 'Enter notes…',
  PLACEHOLDER_EVIDENCE: 'Select…',
  UPLOAD_BUTTON: 'Upload file',
  REMOVE_FILE: 'Remove file',

  RESULT_COMPLIANT: 'Compliant',
  RESULT_PARTIALLY_COMPLIANT: 'Partially compliant',
  RESULT_NON_COMPLIANT: 'Non-compliant',
  RESULT_NOT_APPLICABLE: 'Not applicable',

  ERROR_RESULT_REQUIRED: 'Select an inspection result.',
  ERROR_EVIDENCE_UNKNOWN: 'Choose evidence from the list.',
  errorSummary: (n: number): string =>
    `${n} required field${n === 1 ? ' is' : 's are'} missing. Fix the highlighted field${n === 1 ? '' : 's'} to continue.`,
  /** "Farm Documentation: Select an inspection result." */
  errorLine: (section: string, message: string): string => `${section}: ${message}`,
  /** aria-label of a control inside one section card. */
  fieldAria: (section: string, field: string): string => `${section} — ${field}`,
} as const;
