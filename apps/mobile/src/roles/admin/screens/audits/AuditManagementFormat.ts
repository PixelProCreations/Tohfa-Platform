/**
 * Pure display helpers for AuditManagementScreen: the KPI tiles, the month
 * calendar (Monday first, IST calendar days), the day markers and the audit
 * rows. No react-native, so plain-Node vitest covers it
 * (./AuditManagementFormat.test.ts).
 *
 * Calendar days are IST days. The API sends UTC instants; a 23:30 UTC audit is
 * on the next IST day, so every day comparison goes through istDay
 * (utils/datetime.ts), and a month's query range is IST midnight to IST
 * midnight expressed as UTC instants.
 */
import type { AuditComplianceCountsDto, AuditStatus, AuditSummaryDto } from '../../api/audits';
import type { OverviewCardIcon } from '../../components/OverviewDashboardCard';
import type { OverviewCardTone } from '../../components/overviewDashboardCardStyle';
import { t, type TranslationKey } from '../../i18n';
import { formatAdminDay, formatAdminTime, istDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

/** Keys of i18n/auditsManagement.en.json. */
export type AuditMgmtKey = `admin.audits.management.${string}`;

/**
 * t() for this screen's catalogue. The catalogue is registered in i18n/index.ts
 * separately, so the key is widened to string first; an unknown key renders as
 * itself, never as a crash.
 */
export function tm(key: AuditMgmtKey, params?: Record<string, string | number>): string {
  return t(key as string as TranslationKey, params);
}

// ─── KPI tiles ────────────────────────────────────────────────────────────────

export type AuditKpiId = 'upcoming' | 'inProgress' | 'pendingReview' | 'completed' | 'correctiveOpen' | 'complianceAlerts';

export interface AuditKpiTile {
  id: AuditKpiId;
  labelKey: AuditMgmtKey;
  /** A built-in card icon, or 'clipboard' which the screen draws itself. */
  icon: OverviewCardIcon | 'clipboard';
  tone: OverviewCardTone;
  value: string;
}

/**
 * Which compliance count fills each tile; null = no backend figure (em-dash).
 *  - correctiveOpen: open (unresolved) MAJOR findings, the ones that carry a
 *    corrective action deadline. Open MINOR findings are not counted by the API.
 *  - complianceAlerts: red-flagged audits (BR-05b), the explicit admin alert.
 */
export const AUDIT_KPI_SOURCES: Record<AuditKpiId, keyof AuditComplianceCountsDto | null> = {
  upcoming: null,
  inProgress: null,
  pendingReview: null,
  completed: null,
  correctiveOpen: 'openMajorFindings',
  complianceAlerts: 'redFlaggedAudits',
};

const KPI_LAYOUT: ReadonlyArray<Omit<AuditKpiTile, 'value'>> = [
  { id: 'upcoming', labelKey: 'admin.audits.management.kpi.upcoming', icon: 'clipboard', tone: 'default' },
  { id: 'inProgress', labelKey: 'admin.audits.management.kpi.inProgress', icon: 'pickup', tone: 'default' },
  { id: 'pendingReview', labelKey: 'admin.audits.management.kpi.pendingReview', icon: 'orders', tone: 'warning' },
  { id: 'completed', labelKey: 'admin.audits.management.kpi.completed', icon: 'receiving', tone: 'success' },
  { id: 'correctiveOpen', labelKey: 'admin.audits.management.kpi.correctiveOpen', icon: 'alert', tone: 'danger' },
  { id: 'complianceAlerts', labelKey: 'admin.audits.management.kpi.complianceAlerts', icon: 'alert', tone: 'danger' },
];

/** The six designed tiles, in design order, valued from the compliance counts (em-dash when absent). */
export function auditKpiTiles(counts: AuditComplianceCountsDto | undefined): AuditKpiTile[] {
  return KPI_LAYOUT.map((tile) => {
    const source = AUDIT_KPI_SOURCES[tile.id];
    const raw = source !== null && counts !== undefined ? counts[source] : undefined;
    return { ...tile, value: typeof raw === 'number' && Number.isFinite(raw) ? String(raw) : ADMIN_NO_VALUE };
  });
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export interface CalendarMonth {
  year: number;
  /** 1-12 */
  month: number;
}

export interface CalendarDate extends CalendarMonth {
  day: number;
}

/** Today's IST date. */
export function istToday(now: Date): CalendarDate {
  const [y, m, d] = istDay(now).split('-').map(Number);
  return { year: y ?? 1970, month: m ?? 1, day: d ?? 1 };
}

export function shiftMonth({ year, month }: CalendarMonth, delta: number): CalendarMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function daysInMonth({ year, month }: CalendarMonth): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Monday-first grid: leading nulls, the days, trailing nulls to a full week. */
export function monthCells(m: CalendarMonth): Array<number | null> {
  const sundayFirst = new Date(Date.UTC(m.year, m.month - 1, 1)).getUTCDay();
  const lead = (sundayFirst + 6) % 7;
  const cells: Array<number | null> = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth(m); d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** GET /admin/audits scheduledFrom / scheduledTo for one IST month (inclusive instants). */
export function monthRange(m: CalendarMonth): { scheduledFrom: string; scheduledTo: string } {
  const start = Date.UTC(m.year, m.month - 1, 1) - IST_OFFSET_MS;
  const next = shiftMonth(m, 1);
  const end = Date.UTC(next.year, next.month - 1, 1) - IST_OFFSET_MS - 1;
  return { scheduledFrom: new Date(start).toISOString(), scheduledTo: new Date(end).toISOString() };
}

/** "YYYY-MM-DD" of a calendar date, the form istDay returns. */
export function dateKey({ year, month, day }: CalendarDate): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** The IST day an audit is scheduled on, or null for an unparsable instant. */
export function auditIstDay(audit: Pick<AuditSummaryDto, 'scheduledFor'>): string | null {
  const ms = Date.parse(audit.scheduledFor);
  return Number.isFinite(ms) ? istDay(new Date(ms)) : null;
}

export interface DayMarker {
  hasOrangeDot?: boolean;
  hasBlueDot?: boolean;
  hasGreenRing?: boolean;
}

/** Markers by day of month: orange = scheduled, blue = in progress, green ring = completed. */
export function dayMarkers(audits: readonly AuditSummaryDto[], m: CalendarMonth): Record<number, DayMarker> {
  const prefix = `${m.year}-${String(m.month).padStart(2, '0')}-`;
  const out: Record<number, DayMarker> = {};
  for (const audit of audits) {
    const key = auditIstDay(audit);
    if (key === null || !key.startsWith(prefix)) continue;
    const day = Number(key.slice(prefix.length));
    const marker = out[day] ?? {};
    if (audit.status === 'SCHEDULED') marker.hasOrangeDot = true;
    if (audit.status === 'IN_PROGRESS') marker.hasBlueDot = true;
    if (audit.status === 'COMPLETED') marker.hasGreenRing = true;
    out[day] = marker;
  }
  return out;
}

/** The audits on one IST day, earliest first. */
export function auditsOnDay(audits: readonly AuditSummaryDto[], date: CalendarDate): AuditSummaryDto[] {
  const key = dateKey(date);
  return audits
    .filter((a) => auditIstDay(a) === key)
    .sort((a, b) => Date.parse(a.scheduledFor) - Date.parse(b.scheduledFor));
}

export function monthTitle(m: CalendarMonth): string {
  return tm('admin.audits.management.calendar.monthTitle', {
    month: tm(`admin.audits.management.month.${m.month}`),
    year: m.year,
  });
}

/** "09 Oct 2026". */
export function dayHeading(date: CalendarDate): string {
  return tm('admin.audits.management.calendar.dayHeading', {
    day: String(date.day).padStart(2, '0'),
    month: tm(`admin.audits.management.monthShort.${date.month}`),
    year: date.year,
  });
}

// ─── Audit rows ───────────────────────────────────────────────────────────────

/** Statuses the calendar asks for; a cancelled audit is not on the schedule. */
export const CALENDAR_STATUSES: readonly AuditStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];

export type AuditBadgeTone = 'info' | 'danger' | 'warning' | 'success';

export interface AuditBadge {
  labelKey: AuditMgmtKey;
  tone: AuditBadgeTone;
}

/** Status chip; a SCHEDULED audit whose time has passed reads "Past scheduled date". */
export function auditBadge(audit: Pick<AuditSummaryDto, 'status' | 'scheduledFor'>, now: Date): AuditBadge {
  switch (audit.status) {
    case 'COMPLETED':
      return { labelKey: 'admin.audits.management.badge.completed', tone: 'success' };
    case 'IN_PROGRESS':
      return { labelKey: 'admin.audits.management.badge.inProgress', tone: 'warning' };
    case 'CANCELLED':
      return { labelKey: 'admin.audits.management.badge.cancelled', tone: 'danger' };
    default: {
      const ms = Date.parse(audit.scheduledFor);
      return Number.isFinite(ms) && ms < now.getTime()
        ? { labelKey: 'admin.audits.management.badge.pastScheduled', tone: 'danger' }
        : { labelKey: 'admin.audits.management.badge.scheduled', tone: 'info' };
    }
  }
}

function orDash(value: string | null | undefined): string {
  return value === null || value === undefined || value.trim() === '' ? ADMIN_NO_VALUE : value;
}

/** "<audit code> · Selvi (TOHFA-F-…)". The API has no human audit code, so it is the em-dash. */
export function auditRowTitle(audit: Pick<AuditSummaryDto, 'farmerName' | 'tohfaFarmerId'>): string {
  return tm('admin.audits.management.row.title', {
    code: ADMIN_NO_VALUE,
    farmer: orDash(audit.farmerName),
    farmerCode: orDash(audit.tohfaFarmerId),
  });
}

/** "Coonoor farm · Zone A · Internal · 15 Oct 2026, 10:00 AM · Auditor: S. Mohan". */
export function auditRowDetails(
  audit: Pick<AuditSummaryDto, 'farmName' | 'zoneName' | 'auditType' | 'scheduledFor' | 'auditorName' | 'externalAgencyName'>,
): string {
  const day = formatAdminDay(audit.scheduledFor);
  const when = day === ''
    ? ADMIN_NO_VALUE
    : tm('admin.audits.management.row.when', { day, time: formatAdminTime(audit.scheduledFor) });
  const auditor = audit.auditType === 'EXTERNAL' ? audit.externalAgencyName : audit.auditorName;
  return tm('admin.audits.management.row.details', {
    farm: orDash(audit.farmName),
    zone: orDash(audit.zoneName),
    type: tm(`admin.audits.management.type.${audit.auditType}`),
    when,
    auditor: tm('admin.audits.management.row.auditor', { name: orDash(auditor) }),
  });
}
