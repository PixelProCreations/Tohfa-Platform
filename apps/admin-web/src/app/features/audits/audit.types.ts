/**
 * Local types for the Audit Management module (admin web). UI ONLY.
 *
 * These are deliberately NOT the API's types. docs/openapi.yaml models an audit as
 * `AuditSummary` with `status: AuditStatus` = SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED and
 * `auditType: AuditType` = INTERNAL | EXTERNAL (db/migrations/0027_audits.sql has the same enums).
 * The approved designs (74–90) additionally show Pending Review, Overdue, Upcoming and
 * "Post scheduled date". Those are display states the API does not return yet — when this module is
 * integrated they must either be derived client-side (e.g. Overdue = SCHEDULED and scheduledFor in
 * the past) or added to the spec first (root CLAUDE.md §1, "specification gap").
 */

/** Display status of an audit. The first four mirror the API's `AuditStatus`; the rest are design-only. */
export type AuditUiStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING_REVIEW'
  | 'OVERDUE'
  | 'UPCOMING'
  | 'POST_SCHEDULED_DATE';

/** Mirrors docs/openapi.yaml `AuditType`. */
export type AuditType = 'INTERNAL' | 'EXTERNAL';

/**
 * Pill tone. Each maps 1:1 onto a global theme.css badge class: `tohfa-badge tohfa-badge-<tone>`
 * (info = blue, warning = amber, success = green, danger = red, purple, neutral = grey).
 */
export type AuditTone = 'info' | 'warning' | 'success' | 'danger' | 'purple' | 'neutral';

/** Zone display names. Source: db/seed/005_zones.sql (ZONE-OOTY/COON/KOTA/GUDA, "<name> Zone"). */
export type AuditZone = 'Ooty' | 'Coonoor' | 'Kotagiri' | 'Gudalur';

export interface AuditStatusMeta {
  readonly label: string;
  readonly tone: AuditTone;
}

export interface AuditAuditor {
  readonly id: string;
  readonly name: string;
  /** External agencies are not users (API: `externalAgencyName` instead of `auditorUserId`). */
  readonly external: boolean;
}

/** One row of the Audit Schedule & Assignment table (design 75). */
export interface AuditListRow {
  readonly id: string;
  readonly farmerName: string;
  readonly farmName: string;
  readonly zone: AuditZone;
  readonly type: AuditType;
  /** ISO 8601, UTC. The wall-clock time is stored as UTC and formatted in UTC (see audit-format.ts). */
  readonly scheduledAt: string;
  readonly auditorName: string;
  readonly status: AuditUiStatus;
  /** ISO date (YYYY-MM-DD). */
  readonly updatedOn: string;
}

/** One audit shown in the dashboard calendar's day list (design 74). */
export interface AuditCalendarEvent {
  /** Calendar day the event is plotted on (YYYY-MM-DD). */
  readonly date: string;
  readonly auditId: string;
  readonly farmerName: string;
  readonly farmerCode: string;
  /** Second line under the farmer, as designed ("Coonoor farm"). */
  readonly farmLabel: string;
  /** As designed ("Zone A"). */
  readonly zoneLabel: string;
  readonly type: AuditType;
  /** ISO 8601, UTC wall-clock (see audit-format.ts). */
  readonly scheduledAt: string;
  readonly auditorName: string;
  readonly status: AuditUiStatus;
}

export interface AuditKpi {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  /** Material Symbols name. */
  readonly icon: string;
  readonly tone: AuditTone | 'amber';
}

export type AuditSectionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

/** One of the 12 inspection sections (design 78). */
export interface AuditInspectionSection {
  /** 1-based; also the `n` in AUDIT_ROUTES.step(id, n). */
  readonly step: number;
  readonly title: string;
  /** Material Symbols name for the step screen's header tile. */
  readonly icon: string;
  /** `null` = the card says "Not started" / shows `description` instead of a count. */
  readonly requiredFieldsLeft: number | null;
  /** Optional sub-line used instead of the count (section 12). */
  readonly description: string | null;
  readonly status: AuditSectionStatus;
}

/** Mirrors docs/openapi.yaml `RatingCategoryCode`. */
export type AuditRatingCategoryCode =
  | 'CERTIFICATION'
  | 'SOIL_LAND'
  | 'FARMING_PRACTICES'
  | 'ENVIRONMENTAL'
  | 'PRODUCE_QUALITY'
  | 'TRACEABILITY'
  | 'SOCIAL_LABOR'
  | 'FINANCIAL'
  | 'MARKET_RELATIONS'
  | 'INNOVATION';

export interface AuditRatingCategory {
  readonly code: AuditRatingCategoryCode;
  /** Long label (designs 90, mobile farmerDetail.en.json). */
  readonly label: string;
  /** Short label used in the findings table (design 77). */
  readonly shortLabel: string;
  readonly icon: string;
  /** Always 10 (BR-04 / BR-06). */
  readonly maxScore: number;
}

/** Mirrors docs/openapi.yaml `AuditFindingSeverity`. */
export type AuditFindingSeverity = 'MAJOR' | 'MINOR' | 'OBSERVATION';

/** Mirrors docs/openapi.yaml `AuditTier` (thresholds from db/seed/001_reference.sql, BR-04b). */
export type AuditTier = 'POOR' | 'MODERATE' | 'GOOD' | 'EXCELLENT';

export interface AuditTierBand {
  readonly tier: AuditTier;
  readonly label: string;
  readonly minScore: number;
  readonly maxScore: number;
  readonly tone: AuditTone;
}

/**
 * Everything a detail / inspection / step screen needs about one audit. Optional fields are `null`
 * rather than absent so templates never need `?.` chains.
 */
export interface AuditDetailRecord {
  readonly id: string;
  readonly farmerName: string;
  readonly farmerCode: string;
  readonly farmName: string;
  /** Farm record code ("FRM-00124-01") or null. */
  readonly farmCode: string | null;
  readonly plotIds: readonly string[];
  readonly zone: AuditZone;
  /** Free-text location ("Kotagiri, Nilgiris"). */
  readonly location: string;
  /** Acres as a display string ("2.4") — no float formatting. */
  readonly areaAcres: string | null;
  /** Display string ("11.3530° N, 76.7959° E") or null. */
  readonly gps: string | null;
  readonly phone: string | null;
  readonly address: string | null;
  readonly farmingType: string | null;
  readonly type: AuditType;
  readonly status: AuditUiStatus;
  /** ISO 8601, UTC wall-clock. */
  readonly scheduledAt: string;
  readonly auditorName: string;
  readonly purpose: string | null;
  readonly durationMinutes: number | null;
  /** Empty array renders as "None". */
  readonly supportingParticipants: readonly string[];
  /** ISO 8601, UTC wall-clock, or null. */
  readonly lastUpdatedAt: string | null;
  readonly lastUpdatedBy: string | null;
}
