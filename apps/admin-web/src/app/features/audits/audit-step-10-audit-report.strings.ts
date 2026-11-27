/**
 * Strings for inspection steps 10 "Schedule Upcoming Audit" (design 88) and 11 "Add External Audit"
 * (design 89). Both screens render AuditStepAuditReportFormComponent; only the title, pill and the
 * information card's heading differ.
 */
export const AUDIT_STEP_10_STRINGS = {
  TITLE_INTERNAL: 'Schedule Upcoming Audit',
  TITLE_EXTERNAL: 'Add External Audit',
  STEP_PILL_INTERNAL: 'Step 10 of 10',
  STEP_PILL_EXTERNAL: 'Step 11 of 11',

  CARD_FARM: 'Farmer & Farm Details',
  CARD_INFO_INTERNAL: 'Internal Audit Information',
  CARD_INFO_EXTERNAL: 'External Audit Information',
  CARD_UPLOAD: 'Audit Report Upload',
  CARD_ADDITIONAL: 'Additional Details',

  LABEL_FARMER_ID: 'Farmer ID',
  LABEL_FARMER_NAME: 'Farmer Name',
  LABEL_ZONE: 'Zone',
  LABEL_FARMS: 'Farms',
  LABEL_TOTAL_AREA: 'Total Area',
  LOCKED: 'Read-only',
  acres: (a: string): string => `${a} Acre`,

  LABEL_ORG: 'Issuing Organization',
  LABEL_AUDIT_DATE: 'Audit Date',
  LABEL_EXPIRY_DATE: 'Report Expiry Date',
  LABEL_NEXT_DATE: 'Next Audit Date',
  PLACEHOLDER_ORG: 'Enter organization name',
  /** Shown as the date fields' helper (native date inputs ignore `placeholder`). */
  HINT_AUDIT_DATE: 'Select audit date',
  HINT_EXPIRY_DATE: 'Select expiry date',
  HINT_NEXT_DATE: 'Select next audit date',

  UPLOAD_TITLE: 'Tap to upload audit report',
  UPLOAD_HINT: 'PDF, JPG, PNG (Max 10 MB)',
  REMOVE_FILE: 'Remove file',

  LABEL_REMARKS: 'Remarks / Notes',
  PLACEHOLDER_REMARKS: 'Enter any remarks or notes (optional)',
  counter: (n: number, max: number): string => `${n}/${max}`,

  ERROR_ORG_REQUIRED: 'Enter the issuing organization.',
  ERROR_AUDIT_DATE_REQUIRED: 'Select the audit date.',
  ERROR_EXPIRY_DATE_REQUIRED: 'Select the report expiry date.',
  ERROR_EXPIRY_BEFORE_AUDIT: 'The report expiry date must be after the audit date.',
  ERROR_NEXT_DATE_REQUIRED: 'Select the next audit date.',
  ERROR_NEXT_BEFORE_AUDIT: 'The next audit date must be after the audit date.',
  errorSummary: (n: number): string =>
    `${n} field${n === 1 ? ' needs' : 's need'} attention. Fix the highlighted field${n === 1 ? '' : 's'} to save.`,
} as const;
