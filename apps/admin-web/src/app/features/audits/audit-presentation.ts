/**
 * Presentation mappings for the Audit Management module — not placeholder data. These stay when the
 * screens are integrated: they turn a status / type / tier code into its label and pill tone.
 *
 * Pills are the global theme.css badges: `tohfa-badge tohfa-badge-<tone>` (optionally
 * `tohfa-badge-sm` for dense rows). Use `auditStatusPillClass()` so every screen colours a status the
 * same way:
 *
 *   Scheduled → info (blue)        In Progress → warning (amber)    Completed → success (green)
 *   Overdue → danger (red)         Pending Review → purple          Upcoming → purple
 *   Post scheduled date → danger   Cancelled → neutral (grey)
 */
import { AUDIT_STRINGS as S } from './audit.strings';
import type {
  AuditFindingSeverity,
  AuditSectionStatus,
  AuditStatusMeta,
  AuditTone,
  AuditType,
  AuditUiStatus,
} from './audit.types';

export const AUDIT_STATUS_META: Readonly<Record<AuditUiStatus, AuditStatusMeta>> = {
  SCHEDULED: { label: S.STATUS_SCHEDULED, tone: 'info' },
  IN_PROGRESS: { label: S.STATUS_IN_PROGRESS, tone: 'warning' },
  COMPLETED: { label: S.STATUS_COMPLETED, tone: 'success' },
  CANCELLED: { label: S.STATUS_CANCELLED, tone: 'neutral' },
  PENDING_REVIEW: { label: S.STATUS_PENDING_REVIEW, tone: 'purple' },
  OVERDUE: { label: S.STATUS_OVERDUE, tone: 'danger' },
  UPCOMING: { label: S.STATUS_UPCOMING, tone: 'purple' },
  POST_SCHEDULED_DATE: { label: S.STATUS_POST_SCHEDULED_DATE, tone: 'danger' },
};

export const AUDIT_SECTION_STATUS_META: Readonly<Record<AuditSectionStatus, AuditStatusMeta>> = {
  NOT_STARTED: { label: S.SECTION_NOT_STARTED, tone: 'neutral' },
  IN_PROGRESS: { label: S.SECTION_IN_PROGRESS, tone: 'warning' },
  COMPLETED: { label: S.SECTION_COMPLETED, tone: 'success' },
};

export const AUDIT_TYPE_LABEL: Readonly<Record<AuditType, string>> = {
  INTERNAL: S.TYPE_INTERNAL,
  EXTERNAL: S.TYPE_EXTERNAL,
};

/** "Internal Audit" / "External Audit" (designs 77, 78). */
export const AUDIT_TYPE_LABEL_LONG: Readonly<Record<AuditType, string>> = {
  INTERNAL: S.TYPE_INTERNAL_LONG,
  EXTERNAL: S.TYPE_EXTERNAL_LONG,
};

export const AUDIT_SEVERITY_META: Readonly<Record<AuditFindingSeverity, AuditStatusMeta>> = {
  MAJOR: { label: S.SEVERITY_MAJOR, tone: 'danger' },
  MINOR: { label: S.SEVERITY_MINOR, tone: 'warning' },
  OBSERVATION: { label: S.SEVERITY_OBSERVATION, tone: 'info' },
};

/** `"tohfa-badge tohfa-badge-<tone>"` for a tone; add `dense` for the small badge size. */
export function auditToneClass(tone: AuditTone, dense = false): string {
  return `tohfa-badge tohfa-badge-${tone}${dense ? ' tohfa-badge-sm' : ''}`;
}

/** Full class string for a status pill, e.g. `[class]="pill(row.status)"`. */
export function auditStatusPillClass(status: AuditUiStatus, dense = false): string {
  return auditToneClass(AUDIT_STATUS_META[status].tone, dense);
}

export function auditStatusLabel(status: AuditUiStatus): string {
  return AUDIT_STATUS_META[status].label;
}
