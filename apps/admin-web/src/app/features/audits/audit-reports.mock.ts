/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * Audit reports for Audit Management → Report History (design 99), Report Details (design 100) and
 * the Audit Reports & Tier Configuration dialog (design 98). Nothing here is fetched, generated or
 * sent. docs/openapi.yaml has no audit-report endpoints yet — generating, listing, previewing and
 * downloading reports is a SPECIFICATION GAP to add to the spec (and rbac.json, if reports need their
 * own permission) before integration (root CLAUDE.md §1).
 *
 * Sources:
 * - Report rows: design 99 verbatim (names, times, "Demo TOHFA Admin", filters, counts, statuses,
 *   the failure message). Report ids (RPT-…) are invented so rows can link to Report Details.
 * - Audit Summary Report details: design 100 verbatim (KPI tiles, missing coverage, the eight audit
 *   records, "Showing 8 of 42 rows"). The KPI values are the report's own summary of 42 audits, so
 *   they are NOT recomputed from the eight records shown.
 * - Farmer Audit History and Quarterly Coverage details: no design exists; invented in the same
 *   shape so their "Preview" links do not show the Audit Summary Report. Their records are subsets
 *   of design 100's records.
 * - Report types: the brief's list (Audit Summary, Farmer Audit History, Quarterly Coverage,
 *   Findings & Violations, Corrective Action, Compliance Summary).
 * - Red-flag status and export type options: no source; placeholders (see AUDIT_REPORT_* below).
 *
 * Known design inconsistencies, reproduced as designed:
 * - Design 100 dates AUD-2026-0001 … 0008 in Jan–Jul 2026 with ids that do not follow date order.
 * - Design 100's records use ISO dates ("2026-01-18") while every other audit screen uses
 *   "18 Jan 2026"; kept as drawn.
 */
import type { AuditType, AuditUiStatus } from './audit.types';

export type AuditReportStatus = 'READY' | 'GENERATING' | 'FAILED';

export type AuditReportType =
  | 'AUDIT_SUMMARY'
  | 'FARMER_AUDIT_HISTORY'
  | 'QUARTERLY_COVERAGE'
  | 'FINDINGS_VIOLATIONS'
  | 'CORRECTIVE_ACTION'
  | 'COMPLIANCE_SUMMARY';

export interface AuditReportRow {
  readonly id: string;
  readonly type: AuditReportType;
  readonly name: string;
  /** Material Symbols name for the row icon. */
  readonly icon: string;
  readonly status: AuditReportStatus;
  /**
   * ISO 8601, UTC wall-clock. "Generated" time when READY, otherwise the "Requested" time.
   */
  readonly timestamp: string;
  readonly generatedBy: string;
  /** Display text of the filters the report was requested with ("None" when unfiltered). */
  readonly filtersApplied: string;
  /** `null` renders "—" (still generating, or failed). */
  readonly auditCount: number | null;
}

export type AuditReportKpiKey = 'count' | 'completed' | 'average' | 'findings' | 'coverage';

/** Label and icon per key live in audit-report-details.strings.ts / the component. */
export interface AuditReportKpi {
  readonly key: AuditReportKpiKey;
  readonly value: string;
}

export interface AuditReportCoverageGap {
  readonly farmerName: string;
  readonly quarter: string;
}

export interface AuditReportRecord {
  readonly auditId: string;
  readonly farmerName: string;
  readonly type: AuditType;
  /** ISO date (YYYY-MM-DD), shown as drawn. */
  readonly date: string;
  readonly status: AuditUiStatus;
  readonly score: number;
}

export interface AuditReportDetail {
  readonly reportId: string;
  readonly name: string;
  /** ISO 8601, UTC wall-clock. */
  readonly generatedAt: string;
  readonly kpis: readonly AuditReportKpi[];
  readonly missingCoverage: readonly AuditReportCoverageGap[];
  /** Shown in the Compliance Information card. */
  readonly complianceNote: string;
  readonly records: readonly AuditReportRecord[];
  /** Total rows in the report (the table shows `records.length` of these). */
  readonly totalRecords: number;
}

/** Report types offered by the generate dialog (labels in audit-reports-config.strings.ts). */
export const AUDIT_REPORT_TYPES: readonly AuditReportType[] = [
  'AUDIT_SUMMARY',
  'FARMER_AUDIT_HISTORY',
  'QUARTERLY_COVERAGE',
  'FINDINGS_VIOLATIONS',
  'CORRECTIVE_ACTION',
  'COMPLIANCE_SUMMARY',
];

/** Placeholder: no red-flag model exists in the spec yet. */
export type AuditReportRedFlagFilter = 'RED_FLAGGED' | 'NOT_RED_FLAGGED';
export const AUDIT_REPORT_RED_FLAG_OPTIONS: readonly AuditReportRedFlagFilter[] = ['RED_FLAGGED', 'NOT_RED_FLAGGED'];

/** Placeholder: design 98 shows only "All"; design 99 only offers CSV downloads. */
export type AuditReportExportType = 'ALL' | 'CSV';
export const AUDIT_REPORT_EXPORT_TYPES: readonly AuditReportExportType[] = ['ALL', 'CSV'];

const COMPLIANCE_TIER_MISSING = 'Compliance-tier configuration is missing.';

/** Design 99, verbatim. */
export const AUDIT_REPORT_ROWS: readonly AuditReportRow[] = [
  { id: 'RPT-2026-0005', type: 'AUDIT_SUMMARY', name: 'Audit Summary Report', icon: 'description', status: 'READY', timestamp: '2026-10-14T10:00:00Z', generatedBy: 'Demo TOHFA Admin', filtersApplied: 'None', auditCount: 42 },
  { id: 'RPT-2026-0004', type: 'FARMER_AUDIT_HISTORY', name: 'Farmer Audit History', icon: 'agriculture', status: 'READY', timestamp: '2026-10-10T15:20:00Z', generatedBy: 'Demo TOHFA Admin', filtersApplied: 'Farmer = Ramesh Kumar', auditCount: 6 },
  { id: 'RPT-2026-0003', type: 'QUARTERLY_COVERAGE', name: 'Quarterly Coverage', icon: 'calendar_month', status: 'READY', timestamp: '2026-10-03T09:05:00Z', generatedBy: 'Demo TOHFA Admin', filtersApplied: 'Zone = Coonoor, Q3 2026', auditCount: 23 },
  { id: 'RPT-2026-0006', type: 'FINDINGS_VIOLATIONS', name: 'Findings & Violations', icon: 'warning', status: 'GENERATING', timestamp: '2026-10-14T11:42:00Z', generatedBy: 'Demo TOHFA Admin', filtersApplied: 'Status = Major findings', auditCount: null },
  { id: 'RPT-2026-0002', type: 'COMPLIANCE_SUMMARY', name: 'Compliance Summary', icon: 'verified_user', status: 'FAILED', timestamp: '2026-10-01T08:15:00Z', generatedBy: 'Demo TOHFA Admin', filtersApplied: COMPLIANCE_TIER_MISSING, auditCount: null },
];

/** Design 100, verbatim. */
const SUMMARY_RECORDS: readonly AuditReportRecord[] = [
  { auditId: 'AUD-2026-0001', farmerName: 'Ramesh Kumar', type: 'EXTERNAL', date: '2026-01-18', status: 'COMPLETED', score: 88 },
  { auditId: 'AUD-2026-0002', farmerName: 'Ramesh Kumar', type: 'INTERNAL', date: '2026-04-21', status: 'COMPLETED', score: 87 },
  { auditId: 'AUD-2026-0003', farmerName: 'Ramesh Kumar', type: 'EXTERNAL', date: '2026-07-24', status: 'COMPLETED', score: 88 },
  { auditId: 'AUD-2026-0004', farmerName: 'Selvi', type: 'INTERNAL', date: '2026-01-25', status: 'COMPLETED', score: 90 },
  { auditId: 'AUD-2026-0005', farmerName: 'Selvi', type: 'EXTERNAL', date: '2026-04-28', status: 'COMPLETED', score: 88 },
  { auditId: 'AUD-2026-0006', farmerName: 'Selvi', type: 'INTERNAL', date: '2026-07-31', status: 'COMPLETED', score: 91 },
  { auditId: 'AUD-2026-0007', farmerName: 'Meena', type: 'EXTERNAL', date: '2026-02-01', status: 'COMPLETED', score: 81 },
  { auditId: 'AUD-2026-0008', farmerName: 'Meena', type: 'INTERNAL', date: '2026-05-05', status: 'COMPLETED', score: 82 },
];

const COMPLIANCE_NOTE = 'Compliance-tier configuration is missing. No tier is calculated or invented.';

const AUDIT_REPORT_DETAILS: readonly AuditReportDetail[] = [
  {
    // Design 100, verbatim.
    reportId: 'RPT-2026-0005',
    name: 'Audit Summary Report',
    generatedAt: '2026-10-14T10:00:00Z',
    kpis: [
      { key: 'count', value: '42' },
      { key: 'completed', value: '32' },
      { key: 'average', value: '86.7/100' },
      { key: 'findings', value: '36 major / 25 minor' },
      { key: 'coverage', value: '4 farmer-quarters' },
    ],
    missingCoverage: [
      { farmerName: 'Kumar', quarter: 'Q3 2026' },
      { farmerName: 'Arun', quarter: 'Q2 2026' },
      { farmerName: 'Vijay', quarter: 'Q1 2026' },
      { farmerName: 'Sundar', quarter: 'Q3 2026' },
    ],
    complianceNote: COMPLIANCE_NOTE,
    records: SUMMARY_RECORDS,
    totalRecords: 42,
  },
  {
    // Invented (no design): Ramesh Kumar's records from design 100.
    reportId: 'RPT-2026-0004',
    name: 'Farmer Audit History',
    generatedAt: '2026-10-10T15:20:00Z',
    kpis: [
      { key: 'count', value: '6' },
      { key: 'completed', value: '6' },
      { key: 'average', value: '86.0/100' },
      { key: 'findings', value: '1 major / 3 minor' },
      { key: 'coverage', value: '0 farmer-quarters' },
    ],
    missingCoverage: [],
    complianceNote: COMPLIANCE_NOTE,
    records: SUMMARY_RECORDS.filter((r) => r.farmerName === 'Ramesh Kumar'),
    totalRecords: 6,
  },
  {
    // Invented (no design): the Q3 2026 records from design 100.
    reportId: 'RPT-2026-0003',
    name: 'Quarterly Coverage',
    generatedAt: '2026-10-03T09:05:00Z',
    kpis: [
      { key: 'count', value: '23' },
      { key: 'completed', value: '18' },
      { key: 'average', value: '85.2/100' },
      { key: 'findings', value: '9 major / 14 minor' },
      { key: 'coverage', value: '2 farmer-quarters' },
    ],
    missingCoverage: [
      { farmerName: 'Kumar', quarter: 'Q3 2026' },
      { farmerName: 'Sundar', quarter: 'Q3 2026' },
    ],
    complianceNote: COMPLIANCE_NOTE,
    records: SUMMARY_RECORDS.filter((r) => r.date >= '2026-07-01' && r.date <= '2026-09-30'),
    totalRecords: 23,
  },
];

/** The report a route id points at; unknown (or not-yet-ready) ids fall back to the Audit Summary Report. */
export function mockAuditReportDetail(reportId: string): AuditReportDetail {
  const fallback = AUDIT_REPORT_DETAILS[0]!;
  return AUDIT_REPORT_DETAILS.find((d) => d.reportId === reportId) ?? fallback;
}
