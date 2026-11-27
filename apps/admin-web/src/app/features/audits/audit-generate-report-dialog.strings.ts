/**
 * UI string catalogue for the "Generate Audit Report" dialog (design 97). Per root CLAUDE.md §2.7
 * strings do not live in components. Status / type option labels reuse audit-presentation.ts.
 */
import type { AuditReportDateRange, AuditReportTypeKey } from './audit-generate-report.mock';

export const AUDIT_GENERATE_REPORT_STRINGS = {
  TITLE: 'Generate Audit Report',
  /** Screen-reader description (design 97 draws no subtitle). */
  DESCRIPTION: 'Choose a report and its filters. The preview updates as you change them.',
  CLOSE: 'Close',

  REPORTS: 'Reports',
  REPORT_LABELS: {
    AUDIT_SUMMARY: 'Audit Summary',
    FARMER_AUDIT_HISTORY: 'Farmer Audit History',
    QUARTERLY_COVERAGE: 'Quarterly Coverage',
    FINDINGS_VIOLATIONS: 'Findings & Violations',
    CORRECTIVE_ACTION: 'Corrective Action',
    COMPLIANCE_SUMMARY: 'Compliance Summary',
  } satisfies Record<AuditReportTypeKey, string>,

  DATE_RANGE: 'Date Range',
  DATE_RANGE_LABELS: {
    THIS_MONTH: 'This month',
    THIS_QUARTER: 'This quarter',
    THIS_YEAR: 'This year',
    CUSTOM: 'Custom',
  } satisfies Record<AuditReportDateRange, string>,
  ZONE: 'Zone',
  ALL_ZONES: 'All zones',
  AUDIT_STATUS: 'Audit Status',
  ALL_STATUSES: 'All statuses',
  AUDIT_TYPE: 'Audit Type',
  ALL_TYPES: 'All types',

  /** "Audit Summary - Preview" */
  previewTitle: (report: string): string => `${report} - Preview`,
  PREVIEW_FILTERS: 'Filters applied',
  /** "This quarter · All zones" */
  filtersApplied: (parts: readonly string[]): string => parts.join(' · '),
  PREVIEW_AUDIT_COUNT: 'Audit count',
  PREVIEW_SCORE: 'Score (avg / low / high)',
  PREVIEW_FINDINGS: 'Findings (major / minor)',
  PREVIEW_FARMERS: 'Farmers covered',
  PREVIEW_REPEAT_FARMERS: 'Farmers audited more than once',
  PREVIEW_FARMS_DUE: 'Farms due for audit',
  PREVIEW_FARMS_AUDITED: 'Farms audited',
  PREVIEW_COVERAGE: 'Coverage',
  PREVIEW_OBSERVATIONS: 'Observations',
  PREVIEW_AUDITS_WITH_FINDINGS: 'Audits with findings',
  PREVIEW_CA_OPEN_CLOSED: 'Corrective actions (open / closed)',
  PREVIEW_CA_OVERDUE: 'Overdue corrective actions',
  PREVIEW_TIER_CONFIG: 'Tier configuration',
  PREVIEW_TIER_MISSING: 'Not configured',
  PREVIEW_TIER_NOTE:
    'Compliance tiers are not configured yet. Set them up in Reports & Tier Configuration for tier counts to appear.',
  /** "82 / 57 / 96" */
  slash: (...parts: readonly (number | string)[]): string => parts.join(' / '),
  /** "30%" */
  percent: (n: number): string => `${n}%`,

  CANCEL: 'Cancel',
  GENERATE: 'Generate Report',
} as const;
