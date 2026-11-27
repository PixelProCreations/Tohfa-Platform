/**
 * Shared UI string catalogue for the Audit Management module: status / type labels, the 12 inspection
 * section titles, rating categories, date parts and the AuditStepShellComponent's labels.
 *
 * Per root CLAUDE.md §2.7 user-facing strings do not live in components. The admin console has no
 * i18n framework yet, so — like the other modules — catalogues are the single source of truth.
 *
 * Convention for this module: strings used by more than one screen live here; strings for one screen
 * live in that screen's own `<screen>.strings.ts` (see audit-dashboard.strings.ts,
 * audit-schedule-list.strings.ts). Screens built in parallel should add their own catalogue rather
 * than edit this one, so they do not collide.
 */
export const AUDIT_STRINGS = {
  MODULE_TITLE: 'Audit Management',
  NOT_AVAILABLE_YET: 'Not available yet',
  NO_DESIGN_YET: 'Not available yet — no design for this action',
  NONE: 'None',
  DASH: '—',
  SEPARATOR_DOT: '·',

  // ---------- Statuses (pill labels) ----------
  STATUS_SCHEDULED: 'Scheduled',
  STATUS_IN_PROGRESS: 'In Progress',
  STATUS_COMPLETED: 'Completed',
  STATUS_CANCELLED: 'Cancelled',
  STATUS_PENDING_REVIEW: 'Pending Review',
  STATUS_OVERDUE: 'Overdue',
  STATUS_UPCOMING: 'Upcoming',
  STATUS_POST_SCHEDULED_DATE: 'Post scheduled date',

  // ---------- Section statuses ----------
  SECTION_NOT_STARTED: 'Not Started',
  SECTION_IN_PROGRESS: 'In Progress',
  SECTION_COMPLETED: 'Completed',
  SECTION_NOT_STARTED_HINT: 'Not started',
  requiredFieldsLeft: (n: number): string =>
    `${n} required field${n === 1 ? '' : 's'} left`,

  // ---------- Audit types ----------
  TYPE_INTERNAL: 'Internal',
  TYPE_EXTERNAL: 'External',
  TYPE_INTERNAL_LONG: 'Internal Audit',
  TYPE_EXTERNAL_LONG: 'External Audit',

  // ---------- Findings / tiers ----------
  SEVERITY_MAJOR: 'Major',
  SEVERITY_MINOR: 'Minor',
  SEVERITY_OBSERVATION: 'Observation',
  TIER_POOR: 'Poor',
  TIER_MODERATE: 'Moderate',
  TIER_GOOD: 'Good',
  TIER_EXCELLENT: 'Excellent',

  // ---------- The 12 inspection sections (design 78) ----------
  SECTION_1: 'Farmer Contact Verification',
  SECTION_2: 'FMB & Land Verification',
  SECTION_3: 'Farm Details Verification',
  SECTION_4: 'Certification Verification',
  SECTION_5: 'Soil Testing & Soil Report',
  SECTION_6: 'Water Source & Water pH Testing',
  SECTION_7: 'Farm Practices Checklist',
  SECTION_8: 'Documents & Evidence',
  SECTION_9: 'Farmer Admin Assessment',
  SECTION_10: 'Schedule upcoming audit',
  SECTION_11: 'Add External Audit',
  SECTION_12: 'Farmer Rating',
  SECTION_12_DESCRIPTION: 'Rate the farmer based on the audit inspection.',

  // ---------- Rating categories (long / short) ----------
  CAT_CERTIFICATION: 'Certification & Compliance',
  CAT_CERTIFICATION_SHORT: 'Certification',
  CAT_SOIL_LAND: 'Soil & Land Management',
  CAT_SOIL_LAND_SHORT: 'Soil & Land',
  CAT_FARMING_PRACTICES: 'Farming Practices',
  CAT_FARMING_PRACTICES_SHORT: 'Farming Practices',
  CAT_ENVIRONMENTAL: 'Environmental Sustainability',
  CAT_ENVIRONMENTAL_SHORT: 'Environmental',
  CAT_PRODUCE_QUALITY: 'Produce Quality & Yield',
  CAT_PRODUCE_QUALITY_SHORT: 'Produce Quality',
  CAT_TRACEABILITY: 'Traceability & Transparency',
  CAT_TRACEABILITY_SHORT: 'Traceability',
  CAT_SOCIAL_LABOR: 'Social & Labor Practices',
  CAT_SOCIAL_LABOR_SHORT: 'Social & Labor',
  CAT_FINANCIAL: 'Financial & Operational',
  CAT_FINANCIAL_SHORT: 'Financial',
  CAT_MARKET_RELATIONS: 'Market & Buyer Relations',
  CAT_MARKET_RELATIONS_SHORT: 'Market Relations',
  CAT_INNOVATION: 'Innovation & Improvement',
  CAT_INNOVATION_SHORT: 'Innovation',

  // ---------- Fallback record (mockAuditById for unknown ids) ----------
  FALLBACK_FARMER: 'Unknown farmer',
  FALLBACK_FARM: 'Unknown farm',

  // ---------- Date parts (formatted in UTC by audit-format.ts) ----------
  MONTHS_SHORT: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  MONTHS_LONG: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  /** Monday-first, as the dashboard calendar is laid out. */
  WEEKDAYS_NARROW: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  WEEKDAYS_LONG: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  AM: 'AM',
  PM: 'PM',
  minutes: (n: number): string => `${n} min`,

  // ---------- AuditStepShellComponent ----------
  SHELL_BACK: 'Back to Inspection',
  SHELL_DRAFT: 'Save as Draft',
  SHELL_SAVE: 'Save',
  SHELL_SAVE_NEXT: 'Save & Next',
  SHELL_SAVED_DEMO: 'Saved (demo — not stored)',
  SHELL_DRAFT_SAVED_DEMO: 'Draft saved (demo — not stored)',
  SHELL_ACTIONS_LABEL: 'Step actions',
  /** "AUD-2026-0042 · Ramesh Kumar" */
  shellSubtitle: (auditId: string, farmerName: string): string =>
    [auditId, farmerName].filter((p) => p !== '').join(' · '),
} as const;
