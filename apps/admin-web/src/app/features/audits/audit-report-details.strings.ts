/**
 * UI string catalogue for Audit Management → Report Details (design 100). Per root CLAUDE.md §2.7
 * strings do not live in components.
 */
export const AUDIT_REPORT_DETAILS_STRINGS = {
  TITLE: 'Report Details',
  SUBTITLE: 'A - Audit reports',
  generatedAt: (when: string): string => `Generated ${when}`,

  KPI_REGION: 'Report summary',
  KPI_COUNT: 'Audit count',
  KPI_COMPLETED: 'Completed audits',
  KPI_AVERAGE: 'Average score',
  KPI_FINDINGS: 'Findings',
  KPI_COVERAGE: 'Missing audit coverage',

  MISSING_COVERAGE: 'Missing Coverage',
  COL_FARMER: 'Farmer',
  COL_QUARTER: 'Quarter',
  NO_MISSING_COVERAGE: 'No missing audit coverage in this report.',

  COMPLIANCE_INFO: 'Compliance Information',

  AUDIT_RECORDS: 'Audit Records',
  COL_AUDIT_ID: 'Audit ID',
  COL_TYPE: 'Type',
  COL_DATE: 'Date',
  COL_STATUS: 'Status',
  COL_SCORE: 'Score',
  NO_RECORDS: 'No audit records in this report.',
  auditAria: (id: string): string => `Open audit ${id}`,
  farmerAria: (name: string): string => `Show audit history for ${name}`,
  showingRows: (shown: number, total: number): string => `Showing ${shown} of ${total} rows.`,

  BTN_DOWNLOAD: 'Download Report',
  DOWNLOAD_INERT: 'Not available yet — no report file has been designed',
} as const;
