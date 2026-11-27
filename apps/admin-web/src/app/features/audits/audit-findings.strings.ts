/**
 * UI string catalogue for Audit Management → Audit Inspection & Findings (design 77). The tab labels
 * and footer buttons come from audit-detail.strings.ts so both screens name them identically; shared
 * audit strings (statuses, types, categories, severities) live in audit.strings.ts.
 */
export const AUDIT_FINDINGS_STRINGS = {
  TITLE: 'Audit Inspection & Findings',
  INFO_REGION: 'Audit information',

  AUDIT_ID: 'Audit ID',
  AUDIT_TYPE: 'Audit Type',
  SCHEDULED: 'Scheduled',
  FARMER: 'Farmer',
  FARM_ZONE: 'Farm / Zone',
  ASSIGNED_AUDITOR: 'Assigned Auditor',
  SUPPORTING_PARTICIPANTS: 'Supporting Participants',
  AUDIT_PURPOSE: 'Audit Purpose',
  LAST_UPDATED: 'Last Updated',
  /** "Meena - FMR-00177" / "PLT-00177-1 - Coonoor" (the design's hyphen separator). */
  pair: (a: string, b: string): string => [a, b].filter((p) => p !== '').join(' - '),
  lastUpdated: (when: string, by: string | null): string => (by === null ? when : `${when} · ${by}`),

  // ---------- Audit context strip ----------
  CONTEXT_TITLE: 'Audit Context',
  CONTEXT_AUDIT: 'Audit',
  CONTEXT_FARMER_FARM: 'Farmer and farm',
  CONTEXT_AUDIT_TYPE: 'Audit type',
  CONTEXT_AUDIT_DATE: 'Audit date',
  CONTEXT_LEAD_AUDITOR: 'Lead auditor',
  CONTEXT_STATUS: 'Status',

  // ---------- Categories table ----------
  CATEGORIES_TITLE: 'Categories (10 x 10 points)',
  CATEGORIES_INFO:
    'Checklist questions come from the approved checklist, and scores are not entered until the inspection is completed. No questions are invented or shown here.',
  COL_INDEX: '#',
  COL_CATEGORY: 'Category',
  COL_SCORE: 'Score (max 10)',
  COL_REMARKS: 'Remarks',
  COL_EVIDENCE: 'Evidence',
  NOT_SCORED: 'Not scored',
  score: (score: number, max: number): string => `${score} / ${max}`,
  NONE_ATTACHED: 'None attached',
  evidenceCount: (n: number): string => `${n} file${n === 1 ? '' : 's'} attached`,
  CATEGORIES_EMPTY: 'No rating categories configured.',

  // ---------- Findings ----------
  FINDINGS_TITLE: 'Findings and violations',
  FINDINGS_EMPTY: 'No finding is logged.',
  MAJOR_FINDINGS: 'Major findings',
  MINOR_FINDINGS: 'Minor findings',
  findingDue: (date: string): string => `Due ${date}`,

  // ---------- Summary ----------
  SUMMARY_TITLE: 'Audit summary',
  TOTAL_SCORE: 'Total score',
  totalScore: (score: number, max: number): string => `${score} / ${max}`,
  CATEGORIES_SCORED: 'Categories scored',
  categoriesScored: (n: number, total: number): string => `${n} of ${total}`,
  EVIDENCE_COUNT: 'Evidence count',
  COMPLIANCE_TIER: 'Compliance tier',
  TIER_AFTER_FINALIZING: 'After finalizing',
} as const;
