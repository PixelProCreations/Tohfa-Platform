/**
 * UI string catalogue for Audit Management → Audit Reports & Tier Configuration (design 98). Per
 * root CLAUDE.md §2.7 strings do not live in components.
 */
import type {
  AuditReportExportType,
  AuditReportRedFlagFilter,
  AuditReportType,
} from './audit-reports.mock';

export const AUDIT_REPORTS_CONFIG_STRINGS = {
  TITLE: 'Audit Reports & Tier Configuration',
  SUBTITLE: 'Generate audit reports and configure audit tiers.',
  PAGE_HINT: 'Choose the report type and filters, then export the report.',
  BTN_OPEN: 'Generate report',
  BTN_HISTORY: 'Report History',

  DIALOG_DESCRIPTION: 'Choose a report type and optional filters, then export the report.',
  CLOSE: 'Close',
  SECTION_REPORTS: 'A · Audit reports',

  FIELD_REPORT_TYPE: 'Report type',
  FIELD_AUDIT_TYPE: 'Audit type',
  FIELD_DATE_FROM: 'Date from',
  FIELD_DATE_TO: 'Date to',
  FIELD_FARMER: 'Farmer',
  FIELD_FARM_ZONE: 'Farm / zone',
  FIELD_AUDITOR: 'Auditor',
  FIELD_AUDIT_STATUS: 'Audit status',
  FIELD_RED_FLAG: 'Red-flag status',
  FIELD_EXPORT_TYPE: 'Export type',
  SELECT_PLACEHOLDER: 'Select...',
  TIER_FILTER_HINT: 'The tier filter appears once tiers are configured.',
  zoneOption: (zone: string): string => `${zone} zone`,
  farmZoneOption: (farm: string, zone: string): string => `${farm} · ${zone}`,
  ZONES_GROUP: 'Zones',
  FARMS_GROUP: 'Farms',

  ERROR_REPORT_TYPE: 'Select a report type.',
  ERROR_DATE_ORDER: 'Date to must be on or after Date from.',

  BTN_CANCEL: 'Cancel',
  BTN_EXPORT: 'Export Report',
  EXPORT_STARTED_DEMO: 'Export started (demo — not stored)',

  REPORT_TYPE_LABEL: {
    AUDIT_SUMMARY: 'Audit Summary',
    FARMER_AUDIT_HISTORY: 'Farmer Audit History',
    QUARTERLY_COVERAGE: 'Quarterly Coverage',
    FINDINGS_VIOLATIONS: 'Findings & Violations',
    CORRECTIVE_ACTION: 'Corrective Action',
    COMPLIANCE_SUMMARY: 'Compliance Summary',
  } as Readonly<Record<AuditReportType, string>>,

  RED_FLAG_LABEL: {
    RED_FLAGGED: 'Red-flagged',
    NOT_RED_FLAGGED: 'Not red-flagged',
  } as Readonly<Record<AuditReportRedFlagFilter, string>>,

  EXPORT_TYPE_LABEL: {
    ALL: 'All',
    CSV: 'CSV',
  } as Readonly<Record<AuditReportExportType, string>>,
} as const;
