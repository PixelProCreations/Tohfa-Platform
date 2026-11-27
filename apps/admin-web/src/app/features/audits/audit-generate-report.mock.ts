/**
 * UI-only placeholder data for the "Generate Audit Report" dialog (design 97). Replace with API when
 * the reports screens are integrated — docs/openapi.yaml has no audit-report endpoint yet (spec gap).
 *
 * The preview numbers are invented demo values, not derived from the other audit mocks:
 * - AUDIT_REPORT_PREVIEW_BASE holds one set of counts per report type for the DEFAULT filters
 *   (This quarter, all zones, all statuses, all types). Audit Summary is design 97 verbatim:
 *   12 audits, score 82 / 57 / 96, findings 3 / 9.
 * - Narrowing a filter scales the counts by a fixed share (AUDIT_REPORT_*_SHARE) and rounds, so the
 *   preview visibly reacts. Scores are averages, so they are not scaled; with no audits they show "—".
 */
import { AUDIT_FILTER_STATUSES, AUDIT_TYPES, AUDIT_ZONES } from './audit.mock';
import type { AuditType, AuditUiStatus, AuditZone } from './audit.types';

export type AuditReportTypeKey =
  | 'AUDIT_SUMMARY'
  | 'FARMER_AUDIT_HISTORY'
  | 'QUARTERLY_COVERAGE'
  | 'FINDINGS_VIOLATIONS'
  | 'CORRECTIVE_ACTION'
  | 'COMPLIANCE_SUMMARY';

export type AuditReportDateRange = 'THIS_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM';

/** `'ALL'` = no filter. */
export interface AuditReportFilters {
  readonly dateRange: AuditReportDateRange;
  readonly zone: AuditZone | 'ALL';
  readonly status: AuditUiStatus | 'ALL';
  readonly type: AuditType | 'ALL';
}

/** What the dialog emits on "Generate Report". */
export interface AuditReportRequest {
  readonly reportType: AuditReportTypeKey;
  readonly filters: AuditReportFilters;
}

export interface AuditReportTypeOption {
  readonly key: AuditReportTypeKey;
  /** Material Symbols name. */
  readonly icon: string;
}

/** Design 97 order: a 3 x 2 grid read row by row. */
export const AUDIT_REPORT_TYPES: readonly AuditReportTypeOption[] = [
  { key: 'AUDIT_SUMMARY', icon: 'description' },
  { key: 'FARMER_AUDIT_HISTORY', icon: 'agriculture' },
  { key: 'QUARTERLY_COVERAGE', icon: 'calendar_month' },
  { key: 'FINDINGS_VIOLATIONS', icon: 'warning' },
  { key: 'CORRECTIVE_ACTION', icon: 'check_circle' },
  { key: 'COMPLIANCE_SUMMARY', icon: 'verified' },
];

export const AUDIT_REPORT_DATE_RANGES: readonly AuditReportDateRange[] = [
  'THIS_MONTH',
  'THIS_QUARTER',
  'THIS_YEAR',
  'CUSTOM',
];

export const AUDIT_REPORT_ZONES: readonly AuditZone[] = AUDIT_ZONES;
export const AUDIT_REPORT_STATUSES: readonly AuditUiStatus[] = AUDIT_FILTER_STATUSES;
export const AUDIT_REPORT_AUDIT_TYPES: readonly AuditType[] = AUDIT_TYPES;

export const AUDIT_REPORT_DEFAULT_TYPE: AuditReportTypeKey = 'AUDIT_SUMMARY';

export const AUDIT_REPORT_DEFAULT_FILTERS: AuditReportFilters = {
  dateRange: 'THIS_QUARTER',
  zone: 'ALL',
  status: 'ALL',
  type: 'ALL',
};

/** Counts for the default filters, per report type. Only the fields a type's preview uses are read. */
export interface AuditReportPreviewBase {
  readonly audits: number;
  readonly scoreAvg: number;
  readonly scoreLow: number;
  readonly scoreHigh: number;
  readonly majorFindings: number;
  readonly minorFindings: number;
  readonly observations: number;
  readonly auditsWithFindings: number;
  readonly farmers: number;
  readonly repeatFarmers: number;
  readonly farmsDue: number;
  readonly caOpen: number;
  readonly caClosed: number;
  readonly caOverdue: number;
}

/** One shared base: every report type describes the same quarter of audits. */
export const AUDIT_REPORT_PREVIEW_BASE: AuditReportPreviewBase = {
  audits: 12,
  scoreAvg: 82,
  scoreLow: 57,
  scoreHigh: 96,
  majorFindings: 3,
  minorFindings: 9,
  observations: 5,
  auditsWithFindings: 7,
  farmers: 9,
  repeatFarmers: 3,
  farmsDue: 40,
  caOpen: 5,
  caClosed: 7,
  caOverdue: 2,
};

/** Relative size of each date range against "This quarter". Custom has no picker, so it is 1. */
export const AUDIT_REPORT_RANGE_SHARE: Readonly<Record<AuditReportDateRange, number>> = {
  THIS_MONTH: 1 / 3,
  THIS_QUARTER: 1,
  THIS_YEAR: 4,
  CUSTOM: 1,
};

/** Share of audits in each zone. */
export const AUDIT_REPORT_ZONE_SHARE: Readonly<Record<AuditZone, number>> = {
  Ooty: 0.35,
  Coonoor: 0.3,
  Kotagiri: 0.2,
  Gudalur: 0.15,
};

/** Share of audits in each status (only the statuses the filter offers are read). */
export const AUDIT_REPORT_STATUS_SHARE: Readonly<Partial<Record<AuditUiStatus, number>>> = {
  SCHEDULED: 0.25,
  IN_PROGRESS: 0.1,
  PENDING_REVIEW: 0.15,
  COMPLETED: 0.4,
  OVERDUE: 0.1,
};

export const AUDIT_REPORT_TYPE_SHARE: Readonly<Record<AuditType, number>> = {
  INTERNAL: 0.75,
  EXTERNAL: 0.25,
};

/**
 * Compliance tiers have not been configured (the Reports & Tier Configuration screen is UI-only), so
 * the Compliance Summary preview shows a "not configured" note instead of tier counts.
 */
export const AUDIT_REPORT_TIERS_CONFIGURED = false;
