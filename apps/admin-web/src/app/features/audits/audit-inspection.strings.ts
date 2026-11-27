/**
 * UI string catalogue for Audit Management → Audit Inspection overview (design 78). Section titles,
 * section statuses and "n required fields left" live in audit.strings.ts (shared with the step screens).
 */
export const AUDIT_INSPECTION_STRINGS = {
  TITLE: 'Audit Inspection',
  INFO_REGION: 'Audit information',
  AUDIT_ID: 'Audit ID',
  TYPE: 'Type',
  FARMER: 'Farmer',
  FARM: 'Farm',
  DATE: 'Date',
  AUDITOR: 'Auditor',

  PROGRESS_REGION: 'Inspection progress',
  percent: (pct: number): string => `${pct}%`,
  sectionsComplete: (done: number, total: number): string =>
    `${done} of ${total} section${total === 1 ? '' : 's'} complete`,
  requiredMissing: (n: number): string =>
    n === 0
      ? 'All required fields are filled'
      : `${n} required field${n === 1 ? ' is' : 's are'} still missing`,
  PROGRESS_BAR_LABEL: 'Sections complete',

  SECTIONS_TITLE: 'Inspection sections',
  /** Accessible name of a section card link. */
  sectionAria: (step: number, title: string, status: string, hint: string): string =>
    `Section ${step}: ${title}. ${status}. ${hint}`,

  FOOTER_LABEL: 'Inspection actions',
  SAVE_DRAFT: 'Save Draft',
  START_AUDIT: 'Start Audit',

  // Completed variant (design 93): shown when every section is complete.
  sectionsCompleted: (done: number, total: number): string =>
    `${done} of ${total} section${total === 1 ? '' : 's'} completed`,
  requiredRemaining: (n: number): string =>
    `${n} required field${n === 1 ? '' : 's'} remaining`,
  COMPLETED_PILL: 'Completed',
  SECTION_COMPLETED_HINT: 'Completed · All required fields filled',
  REVIEW_SUBMIT: 'Review & Submit',
  SUBMITTED_DEMO: 'Submitted (demo — not stored)',
} as const;
