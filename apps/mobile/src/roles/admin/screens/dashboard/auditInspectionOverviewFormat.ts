/**
 * Pure display logic for the Audit Inspection overview
 * (./AuditInspectionOverviewScreen.tsx): the info card values, the section
 * progress and which of the two bottom actions may run. No React, so plain-Node
 * vitest covers it.
 *
 * Strings come from i18n/auditsInspectionOverview.en.json. `tr` reads them
 * through the admin `t()` once that catalogue is registered in i18n/index.ts
 * (so Tamil can override it), and from the catalogue's own English until then,
 * so the screen never shows a raw key.
 */
import type { AuditDetailDto, AuditStatus, AuditType } from '../../api/audits';
import overviewEn from '../../i18n/auditsInspectionOverview.en.json';
import { hasKey, t } from '../../i18n';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

export type OverviewKey = keyof typeof overviewEn;

const OVERVIEW_EN: Record<string, string> = overviewEn;

export function tr(key: OverviewKey, params: Record<string, string | number> = {}): string {
  if (hasKey(key)) return t(key, params);
  const template = OVERVIEW_EN[key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** docs/rbac.json codes this screen checks. */
export const OVERVIEW_CODES = {
  /** GET /admin/audits/{id}. */
  view: 'audit.view',
  /** POST /admin/audits/{id}/start and /complete. */
  conduct: 'audit.conduct',
} as const;

/** What the design's subtitle line under a section title says while the section is not done. */
export type SectionSubtitleKind = 'requiredLeft' | 'notStarted' | 'rating';

export interface AuditInspectionSectionItem {
  id: number;
  title: OverviewKey;
  subtitle: SectionSubtitleKind;
}

/** The design's 12 inspection sections, in order. */
export const AUDIT_12_SECTIONS: readonly AuditInspectionSectionItem[] = [
  { id: 1, title: 'admin.audits.inspectionOverview.section.1', subtitle: 'requiredLeft' },
  { id: 2, title: 'admin.audits.inspectionOverview.section.2', subtitle: 'requiredLeft' },
  { id: 3, title: 'admin.audits.inspectionOverview.section.3', subtitle: 'requiredLeft' },
  { id: 4, title: 'admin.audits.inspectionOverview.section.4', subtitle: 'requiredLeft' },
  { id: 5, title: 'admin.audits.inspectionOverview.section.5', subtitle: 'requiredLeft' },
  { id: 6, title: 'admin.audits.inspectionOverview.section.6', subtitle: 'requiredLeft' },
  { id: 7, title: 'admin.audits.inspectionOverview.section.7', subtitle: 'requiredLeft' },
  { id: 8, title: 'admin.audits.inspectionOverview.section.8', subtitle: 'notStarted' },
  { id: 9, title: 'admin.audits.inspectionOverview.section.9', subtitle: 'notStarted' },
  { id: 10, title: 'admin.audits.inspectionOverview.section.10', subtitle: 'requiredLeft' },
  { id: 11, title: 'admin.audits.inspectionOverview.section.11', subtitle: 'notStarted' },
  { id: 12, title: 'admin.audits.inspectionOverview.section.12', subtitle: 'rating' },
];

const TYPE_KEY: Record<AuditType, OverviewKey> = {
  INTERNAL: 'admin.audits.inspectionOverview.type.INTERNAL',
  EXTERNAL: 'admin.audits.inspectionOverview.type.EXTERNAL',
};

function textOrDash(value: string | null | undefined): string {
  return value === null || value === undefined || value.trim() === '' ? ADMIN_NO_VALUE : value;
}

export interface OverviewInfo {
  /** The human audit reference the design shows (e.g. AUD-2026-0042). The API has none, so always the dash. */
  auditCode: string;
  type: string;
  farmer: string;
  farm: string;
  date: string;
  auditor: string;
}

/** The info card and header values; every one is the dash when the audit has not loaded. */
export function overviewInfo(audit: AuditDetailDto | undefined): OverviewInfo {
  if (audit === undefined) {
    return {
      auditCode: ADMIN_NO_VALUE,
      type: ADMIN_NO_VALUE,
      farmer: ADMIN_NO_VALUE,
      farm: ADMIN_NO_VALUE,
      date: ADMIN_NO_VALUE,
      auditor: ADMIN_NO_VALUE,
    };
  }
  return {
    auditCode: ADMIN_NO_VALUE,
    type: tr(TYPE_KEY[audit.auditType]),
    farmer: textOrDash(audit.farmerName),
    farm: textOrDash(audit.farmName),
    date: textOrDash(formatAdminDay(audit.scheduledFor)),
    auditor: textOrDash(audit.auditorName ?? audit.externalAgencyName),
  };
}

/**
 * Which sections read as done. A COMPLETED audit was submitted, so every
 * section is done; otherwise the host's per-section state decides (the section
 * forms own it; the API keeps no per-section progress).
 */
export function completedSectionIds(status: AuditStatus | undefined, completedSections: Record<number, boolean>): Set<number> {
  const done = new Set<number>();
  for (const section of AUDIT_12_SECTIONS) {
    if (status === 'COMPLETED' || completedSections[section.id] === true) done.add(section.id);
  }
  return done;
}

export interface OverviewProgress {
  done: number;
  total: number;
  heading: string;
  subtext: string;
  /** Width of the bar fill, e.g. "42%"; at least 4% so the bar is visible, as in the design. */
  fillWidth: `${number}%`;
}

export function overviewProgress(done: Set<number>): OverviewProgress {
  const total = AUDIT_12_SECTIONS.length;
  const count = AUDIT_12_SECTIONS.filter((s) => done.has(s.id)).length;
  const ratio = total > 0 ? count / total : 0;
  return {
    done: count,
    total,
    heading: tr('admin.audits.inspectionOverview.progress.heading', { done: count, total }),
    subtext:
      count === total
        ? tr('admin.audits.inspectionOverview.progress.allDone')
        : tr('admin.audits.inspectionOverview.progress.missing', { count: ADMIN_NO_VALUE }),
    fillWidth: `${Math.max(4, Math.round(ratio * 100))}%`,
  };
}

/** The line under a section title. The required-field count belongs to the section forms; the API has none, so it is the dash. */
export function sectionSubtitle(section: AuditInspectionSectionItem, isDone: boolean): string {
  if (isDone) return tr('admin.audits.inspectionOverview.sub.done');
  switch (section.subtitle) {
    case 'requiredLeft':
      return tr('admin.audits.inspectionOverview.sub.requiredLeft', { count: ADMIN_NO_VALUE });
    case 'notStarted':
      return tr('admin.audits.inspectionOverview.sub.notStarted');
    case 'rating':
      return tr('admin.audits.inspectionOverview.sub.rating');
  }
}

export interface OverviewActions {
  /** Review & Submit runs POST /complete: IN_PROGRESS only. */
  canSubmit: boolean;
  /** Save Draft is usable on a live audit. */
  canSaveDraft: boolean;
  /** On a SCHEDULED audit, Save Draft first starts it (SCHEDULED -> IN_PROGRESS): a draft exists only on a started audit. */
  draftStartsAudit: boolean;
}

export function overviewActions(input: { status: AuditStatus | undefined; canConduct: boolean; busy: boolean }): OverviewActions {
  const { status, canConduct, busy } = input;
  const live = canConduct && !busy;
  return {
    canSubmit: live && status === 'IN_PROGRESS',
    canSaveDraft: live && (status === 'SCHEDULED' || status === 'IN_PROGRESS'),
    draftStartsAudit: status === 'SCHEDULED',
  };
}
