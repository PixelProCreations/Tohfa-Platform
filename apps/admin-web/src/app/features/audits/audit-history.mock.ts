/**
 * UI-only placeholder data — replace with API when this screen is integrated.
 *
 * Completed audits for Audit Management → Audit History (design 96). Nothing here is fetched or sent.
 * When integrated, rows come from `GET /admin/audits?status=COMPLETED` (listAudits) and the score /
 * finding counts from the audit's scores and findings (docs/openapi.yaml); search, filters, sorting
 * and paging become query parameters.
 *
 * Sources:
 * - The first eight rows (AUD-2026-0042 … 0029) are design 96 verbatim.
 * - AUD-2026-0028 … 0009 are invented, reusing farmers / farms / zones already in the audit mocks.
 * - AUD-2026-0008 … 0005 match the Audit Records rows of design 100 (audit-reports.mock.ts) so the
 *   two screens agree on farmer, type, date and score.
 * - The invented scores and finding counts are chosen so that the computed KPIs equal design 96:
 *   32 audits, 32 completed, average score 85/100 (2720 / 32 = 85 exactly), 12 with findings.
 *
 * Known design inconsistencies, reproduced as designed (flag to design, do not "fix" silently):
 * - Design 96 dates AUD-2026-0034 "28 Oct 2026" (after the module's reference date 22 Oct 2026, and
 *   design 77 shows that audit as Scheduled for 28 Oct) and AUD-2026-0042 "15 Jul 2026" (designs
 *   74–90 show it In Progress on 15 Oct 2026). The completed-history row keeps design 96.
 * - Design 96 says "Showing 1–8 of 32 audits" with "Rows per page 10" and four pages. Eight rows per
 *   page would need the 10-row option to be 8; this screen offers 10 / 20 / 50 (default 10).
 */
import type { AuditType, AuditUiStatus, AuditZone } from './audit.types';

export interface AuditHistoryRow {
  readonly id: string;
  readonly farmerName: string;
  readonly farmName: string;
  readonly zone: AuditZone;
  readonly type: AuditType;
  /** ISO date (YYYY-MM-DD), formatted in UTC. */
  readonly auditDate: string;
  readonly majorFindings: number;
  readonly minorFindings: number;
  /** Out of AUDIT_HISTORY_SCORE_MAX. */
  readonly score: number;
  readonly status: AuditUiStatus;
}

/** Scores are out of 100 (10 categories × 10, BR-04 / BR-06). */
export const AUDIT_HISTORY_SCORE_MAX = 100;

/**
 * Design 96 colours a score green at 80 and above, amber below (80 green, 76 amber). This is a
 * DESIGN-DERIVED display threshold: it is not one of the BR-04b tier bands (Good starts at 70) and is
 * not in docs/rules.md or system_config. Specification gap — confirm with design / product and move it
 * to config before integration (root CLAUDE.md §2.7).
 */
export const AUDIT_HISTORY_SCORE_PILL_THRESHOLD = 80;

export const AUDIT_HISTORY_PAGE_SIZES: readonly number[] = [10, 20, 50];
export const AUDIT_HISTORY_DEFAULT_PAGE_SIZE = 10;

const C: AuditUiStatus = 'COMPLETED';

export const AUDIT_HISTORY_MOCK: readonly AuditHistoryRow[] = [
  // Design 96, verbatim.
  { id: 'AUD-2026-0042', farmerName: 'Ramesh Kumar', farmName: 'Ramesh Organic Farm', zone: 'Coonoor', type: 'INTERNAL', auditDate: '2026-07-15', majorFindings: 0, minorFindings: 1, score: 80, status: C },
  { id: 'AUD-2026-0035', farmerName: 'Selvi', farmName: 'Selvi Village Farm', zone: 'Coonoor', type: 'EXTERNAL', auditDate: '2026-04-10', majorFindings: 0, minorFindings: 0, score: 91, status: C },
  { id: 'AUD-2026-0034', farmerName: 'Meena', farmName: 'Meena Farm', zone: 'Coonoor', type: 'INTERNAL', auditDate: '2026-10-28', majorFindings: 0, minorFindings: 1, score: 84, status: C },
  { id: 'AUD-2026-0033', farmerName: 'Vijay', farmName: 'Kotagiri Farm', zone: 'Kotagiri', type: 'INTERNAL', auditDate: '2026-09-22', majorFindings: 1, minorFindings: 2, score: 72, status: C },
  { id: 'AUD-2026-0032', farmerName: 'Priya', farmName: 'Green Valley Farm', zone: 'Ooty', type: 'EXTERNAL', auditDate: '2026-09-18', majorFindings: 0, minorFindings: 1, score: 88, status: C },
  { id: 'AUD-2026-0031', farmerName: 'Lakshmi', farmName: 'Lakshmi Farm', zone: 'Gudalur', type: 'INTERNAL', auditDate: '2026-09-12', majorFindings: 0, minorFindings: 0, score: 94, status: C },
  { id: 'AUD-2026-0030', farmerName: 'Ganesan', farmName: 'Hilltop Farm', zone: 'Kotagiri', type: 'INTERNAL', auditDate: '2026-09-05', majorFindings: 1, minorFindings: 1, score: 76, status: C },
  { id: 'AUD-2026-0029', farmerName: 'Kavitha', farmName: 'Kavitha Organic Farm', zone: 'Ooty', type: 'EXTERNAL', auditDate: '2026-08-28', majorFindings: 0, minorFindings: 2, score: 86, status: C },
  // Invented.
  { id: 'AUD-2026-0028', farmerName: 'Senthil', farmName: 'Senthil Farm', zone: 'Gudalur', type: 'INTERNAL', auditDate: '2026-08-20', majorFindings: 0, minorFindings: 0, score: 90, status: C },
  { id: 'AUD-2026-0027', farmerName: 'Anand', farmName: 'Anand Farm', zone: 'Ooty', type: 'INTERNAL', auditDate: '2026-08-12', majorFindings: 0, minorFindings: 1, score: 82, status: C },
  { id: 'AUD-2026-0026', farmerName: 'Devi', farmName: 'Devi Organic Farm', zone: 'Coonoor', type: 'EXTERNAL', auditDate: '2026-08-04', majorFindings: 0, minorFindings: 0, score: 89, status: C },
  { id: 'AUD-2026-0025', farmerName: 'Murugan', farmName: 'Murugan Farm', zone: 'Kotagiri', type: 'INTERNAL', auditDate: '2026-07-28', majorFindings: 1, minorFindings: 1, score: 74, status: C },
  { id: 'AUD-2026-0024', farmerName: 'Rani', farmName: 'Rani Farm', zone: 'Gudalur', type: 'INTERNAL', auditDate: '2026-07-20', majorFindings: 0, minorFindings: 0, score: 87, status: C },
  { id: 'AUD-2026-0023', farmerName: 'Velu', farmName: 'Velu Farm', zone: 'Ooty', type: 'EXTERNAL', auditDate: '2026-07-11', majorFindings: 0, minorFindings: 0, score: 92, status: C },
  { id: 'AUD-2026-0022', farmerName: 'Shanthi', farmName: 'Shanthi Farm', zone: 'Coonoor', type: 'INTERNAL', auditDate: '2026-07-03', majorFindings: 0, minorFindings: 1, score: 81, status: C },
  { id: 'AUD-2026-0021', farmerName: 'John', farmName: 'John Estate Farm', zone: 'Kotagiri', type: 'INTERNAL', auditDate: '2026-06-25', majorFindings: 0, minorFindings: 0, score: 88, status: C },
  { id: 'AUD-2026-0020', farmerName: 'Kumar', farmName: 'Kumar Farm', zone: 'Ooty', type: 'INTERNAL', auditDate: '2026-06-17', majorFindings: 0, minorFindings: 0, score: 85, status: C },
  { id: 'AUD-2026-0019', farmerName: 'Arun Kumar', farmName: 'Arun Organic Farm', zone: 'Kotagiri', type: 'EXTERNAL', auditDate: '2026-06-09', majorFindings: 1, minorFindings: 2, score: 70, status: C },
  { id: 'AUD-2026-0018', farmerName: 'Sundar', farmName: 'Sundar Farm', zone: 'Gudalur', type: 'INTERNAL', auditDate: '2026-06-01', majorFindings: 0, minorFindings: 0, score: 86, status: C },
  { id: 'AUD-2026-0017', farmerName: 'Ramesh Kumar', farmName: 'Ramesh Organic Farm', zone: 'Coonoor', type: 'INTERNAL', auditDate: '2026-05-22', majorFindings: 0, minorFindings: 0, score: 90, status: C },
  { id: 'AUD-2026-0016', farmerName: 'Selvi', farmName: 'Selvi Village Farm', zone: 'Coonoor', type: 'INTERNAL', auditDate: '2026-05-14', majorFindings: 0, minorFindings: 0, score: 88, status: C },
  { id: 'AUD-2026-0015', farmerName: 'Meena', farmName: 'Meena Farm', zone: 'Coonoor', type: 'EXTERNAL', auditDate: '2026-05-06', majorFindings: 0, minorFindings: 1, score: 79, status: C },
  { id: 'AUD-2026-0014', farmerName: 'Vijay', farmName: 'Kotagiri Farm', zone: 'Kotagiri', type: 'INTERNAL', auditDate: '2026-04-28', majorFindings: 0, minorFindings: 0, score: 84, status: C },
  { id: 'AUD-2026-0013', farmerName: 'Priya', farmName: 'Green Valley Farm', zone: 'Ooty', type: 'INTERNAL', auditDate: '2026-04-20', majorFindings: 0, minorFindings: 0, score: 89, status: C },
  { id: 'AUD-2026-0012', farmerName: 'Lakshmi', farmName: 'Lakshmi Farm', zone: 'Gudalur', type: 'EXTERNAL', auditDate: '2026-04-12', majorFindings: 0, minorFindings: 0, score: 93, status: C },
  { id: 'AUD-2026-0011', farmerName: 'Ganesan', farmName: 'Hilltop Farm', zone: 'Kotagiri', type: 'INTERNAL', auditDate: '2026-04-03', majorFindings: 0, minorFindings: 0, score: 90, status: C },
  { id: 'AUD-2026-0010', farmerName: 'Kavitha', farmName: 'Kavitha Organic Farm', zone: 'Ooty', type: 'INTERNAL', auditDate: '2026-03-26', majorFindings: 0, minorFindings: 0, score: 87, status: C },
  { id: 'AUD-2026-0009', farmerName: 'Senthil', farmName: 'Senthil Farm', zone: 'Gudalur', type: 'EXTERNAL', auditDate: '2026-03-17', majorFindings: 0, minorFindings: 1, score: 83, status: C },
  // Match design 100's Audit Records rows (audit-reports.mock.ts).
  { id: 'AUD-2026-0008', farmerName: 'Meena', farmName: 'Meena Farm', zone: 'Coonoor', type: 'INTERNAL', auditDate: '2026-05-05', majorFindings: 0, minorFindings: 0, score: 82, status: C },
  { id: 'AUD-2026-0007', farmerName: 'Meena', farmName: 'Meena Farm', zone: 'Coonoor', type: 'EXTERNAL', auditDate: '2026-02-01', majorFindings: 0, minorFindings: 0, score: 81, status: C },
  { id: 'AUD-2026-0006', farmerName: 'Selvi', farmName: 'Selvi Village Farm', zone: 'Coonoor', type: 'INTERNAL', auditDate: '2026-07-31', majorFindings: 0, minorFindings: 0, score: 91, status: C },
  { id: 'AUD-2026-0005', farmerName: 'Selvi', farmName: 'Selvi Village Farm', zone: 'Coonoor', type: 'EXTERNAL', auditDate: '2026-04-28', majorFindings: 0, minorFindings: 0, score: 88, status: C },
];
