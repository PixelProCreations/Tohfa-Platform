/**
 * UI string catalogue for Audit Details & Farmer Records — FULL RECORD layout (design 94). Strings
 * shared with the upcoming layout (title, tabs, Audit Information labels) are reused from
 * audit-detail.strings.ts; shared audit strings (statuses, types, categories) from audit.strings.ts.
 * Per root CLAUDE.md §2.7 strings do not live in components.
 */
export const AUDIT_DETAIL_FULL_STRINGS = {
  // ---------- Audit Information (labels not in audit-detail.strings.ts) ----------
  SCHEDULED: 'Scheduled',
  FARMER: 'Farmer',
  FARM_ZONE: 'Farm / Zone',
  /** "Meena - FMR-00177" */
  farmerWithCode: (name: string, code: string): string => `${name} - ${code}`,
  /** "PLT-00177-1 - Coonoor" */
  farmWithZone: (farm: string, zone: string): string => `${farm} - ${zone}`,

  // ---------- Overview ----------
  CARD_OVERVIEW: 'Overview',
  SCHEDULE: 'Schedule',
  AUDIT_TYPE: 'Audit Type',
  STATUS: 'Status',
  PURPOSE: 'Purpose',
  QUARTER: 'Quarter',
  LEAD_AUDITOR: 'Lead auditor',
  UPCOMING_AUDIT: 'Upcoming audit',
  EXTERNAL_ORGANIZATION: 'External organization',
  NOTES: 'Notes',
  /** "16 Oct 2026, 10:00 · 120 min" */
  scheduleWithDuration: (when: string, duration: string | null): string =>
    duration === null ? when : `${when} · ${duration}`,
  /** "Q4 2026" */
  quarter: (q: number, year: number): string => `Q${q} ${year}`,

  // ---------- Farmer ----------
  CARD_FARMER: 'Farmer',
  FARMING_TYPE: 'Farming Type',
  EXTERNAL_AUDIT_RECORDS: 'External audit records',

  // ---------- Certifications ----------
  CARD_CERTIFICATIONS: 'Certifications',
  CERT_TYPE: 'Certification type',
  CERT_STATUS: 'Status',
  CERT_CERTIFIED_DATE: 'Certified date',
  CERT_EXPIRY_DATE: 'Renewal / expiry date',
  CERT_DOCUMENT_REF: 'Document reference',
  CERT_VERIFICATION: 'Verification status',
  CERT_ACTIVE: 'Active',
  CERT_EXPIRED: 'Expired',
  VERIFICATION_VERIFIED: 'Verified',
  VERIFICATION_PENDING: 'Pending',
  VERIFICATION_REJECTED: 'Rejected',
  OPEN_CERTIFICATION_RECORD: 'Open certification record',
  CERTIFICATIONS_EMPTY: 'No certification on record.',

  // ---------- Documents ----------
  CARD_DOCUMENTS: 'Documents',
  DOC_SOURCE_FARMER_RECORD: 'Farmer record',
  DOC_IDENTITY_PROOF: 'Identity proof',
  DOC_LAND_OWNERSHIP_PROOF: 'Land ownership proof',
  DOC_SOIL_REPORT: 'Soil report',
  DOCUMENTS_EMPTY: 'No documents on record.',

  // ---------- Farm & Land ----------
  CARD_FARM_LAND: 'Farm & Land',
  FARM_LOCATION: 'Farm location',
  FMB_SKETCH: 'FMB sketch',
  /** "Plot PT-00124-1" */
  plot: (id: string): string => `Plot ${id}`,
  /** "1 acre" / "0.5 acre" (design 94 uses the singular for both). */
  acre: (a: string): string => `${a} acre`,
  LAND_HELPER: 'Land information is as drawn as recorded in Farmers Management.',
  PLOTS_EMPTY: 'No plots on record.',

  // ---------- Previous audits ----------
  CARD_PREVIOUS_AUDITS: 'Previous Audits',
  /** "AUD-2026-0003 · External" */
  previousTitle: (id: string, type: string): string => `${id} · ${type}`,
  /** "24 Jul 2026 | Major: 1, Minor: 1" */
  previousMeta: (date: string, major: number, minor: number): string =>
    `${date} | Major: ${major}, Minor: ${minor}`,
  /** "87/100" */
  previousScore: (score: number, max: number): string => `${score}/${max}`,
  /** "Audit completion: Not scheduled." */
  previousCompletion: (date: string | null): string =>
    `Audit completion: ${date === null ? 'Not scheduled.' : date}`,
  PREVIOUS_EMPTY: 'No previous audits.',

  // ---------- Supporting evidence ----------
  CARD_EVIDENCE: 'Supporting Evidence',
  EVIDENCE_FMB_SKETCH: 'FMB Sketch',
  /** "PGS Organic Certificate" */
  evidenceCertificate: (type: string | null): string =>
    type === null ? 'Certificate' : `${type} Certificate`,
  ON_FILE: 'On file',
  NOT_ON_FILE: 'Not on file',
  VIEW: 'View',
  /** aria-label for a View button: "View FMB Sketch" */
  viewLabel: (what: string): string => `View ${what}`,
  EVIDENCE_EMPTY: 'No supporting evidence on file.',

  // ---------- Category scores ----------
  CARD_CATEGORY_SCORES: 'Category Scores',
  COL_CATEGORY: 'Category',
  COL_SCORE: 'Score',
  /** "8/10" */
  categoryScore: (score: number, max: number): string => `${score}/${max}`,
  NOT_SCORED: 'Not scored',

  // ---------- Corrective actions ----------
  CARD_CORRECTIVE_ACTIONS: 'Corrective actions',
  CA_OPEN: 'Open',
  CA_CLOSED: 'Closed',
  REVIEW_ACCEPTED: 'Accepted',
  REVIEW_REJECTED: 'Rejected',
  /** "Audit: AUD-2026-0001 · Finding: FND-2026-0002" */
  caSource: (auditId: string, findingId: string): string => `Audit: ${auditId} · Finding: ${findingId}`,
  /** "Correct: produce quality" */
  caCorrection: (text: string): string => `Correct: ${text}`,
  /** "Responsible: Ramesh Kumar · Due: 17 Feb 2026" */
  caResponsible: (who: string, due: string): string => `Responsible: ${who} · Due: ${due}`,
  /** "Completion evidence: completion-1.jpeg" */
  caEvidence: (file: string): string => `Completion evidence: ${file}`,
  /** "Review outcome: Accepted · Closed: 14 Feb 2026" */
  caReview: (outcome: string, closed: string | null): string =>
    closed === null ? `Review outcome: ${outcome}` : `Review outcome: ${outcome} · Closed: ${closed}`,
  CORRECTIVE_EMPTY: 'No corrective actions.',

  // ---------- Red flag ----------
  CARD_RED_FLAG: 'Red flag',
  RF_STATUS: 'Status',
  RF_REASON: 'Reason',
  RF_ACTION_BY: 'Action taken by',
  RF_TIMESTAMP: 'Timestamp',
  RF_MINOR: 'Minor Findings',
  RF_MAJOR: 'Major Findings',
  RF_FLAGGED: 'Flagged',
  RF_NOT_FLAGGED: 'Not flagged',
  RF_ACTION: 'Red-flag Audit',
  /** Announced (and shown) after a local red-flag in the dialog (design 95). */
  RF_DONE_DEMO: 'Audit red-flagged (demo — not stored)',
  /** Activity entry title for a local red-flag. */
  RF_ACTIVITY_TITLE: 'Red-flagged',
  RF_FINDING_MINOR: 'Minor findings',
  RF_FINDING_MAJOR: 'Major findings',
  /** "Minor findings, Major findings · Reason text" */
  rfActivityDescription: (findings: readonly string[], reason: string): string =>
    `${findings.join(', ')} · ${reason}`,

  // ---------- Activity ----------
  CARD_ACTIVITY: 'Activity',
  /** "14 Oct 2026, 10:00 · Demo TOHFA Admin" */
  activityWhen: (when: string, who: string): string => `${when} · ${who}`,
  /** "Audit scheduled for 16 Oct 2026" */
  activityScheduledFor: (date: string): string => `Audit scheduled for ${date}`,
  ACTIVITY_EMPTY: 'No activity recorded yet.',

  // ---------- Footer ----------
  CANCEL: 'Cancel',
  EDIT_UPCOMING_SCHEDULE: 'Edit upcoming audit schedule',
} as const;
