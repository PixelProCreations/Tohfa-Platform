/**
 * Pure display and query helpers for the Audit Schedule screen. No React, no
 * fetching: plain-Node vitest covers every branch (tests/audit_schedule_format.test.ts).
 *
 * Dates: the API sends UTC instants and filters by instants; the calendar is
 * drawn in India Standard Time. A fixed +05:30 shift is used for the same
 * reason as utils/datetime.ts (Hermes Intl may silently fall back to the
 * device zone), so an audit at 01:00 IST on the 5th sits on the 5th even on a
 * phone set to another zone.
 */
import type { AuditStatus, AuditSummaryDto, AuditType, ListAuditsParams } from '../../../api/audits';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

// ---------------------------------------------------------------------------
// Filter option ids (labels come from the i18n catalogue)
// ---------------------------------------------------------------------------

export const TYPE_FILTERS = ['all', 'internal', 'external', 'fieldVisit'] as const;
export type TypeFilter = (typeof TYPE_FILTERS)[number];

export const STATUS_FILTERS = ['all', 'upcoming', 'scheduled', 'inProgress'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const DATE_FILTERS = ['today', 'thisWeek', 'thisMonth', 'custom'] as const;
export type DateFilter = (typeof DATE_FILTERS)[number];

export const HISTORY_STATUS_FILTERS = ['all', 'completed', 'cancelled', 'rescheduled'] as const;
export type HistoryStatusFilter = (typeof HISTORY_STATUS_FILTERS)[number];

/** The schedule list's applied filters. */
export interface ScheduleFilters {
  type: TypeFilter;
  status: StatusFilter;
  date: DateFilter;
}

export interface HistoryFilters {
  type: TypeFilter;
  /** Calendar year, e.g. 2026. */
  year: number;
  status: HistoryStatusFilter;
}

// ---------------------------------------------------------------------------
// Status / type / text mapping
// ---------------------------------------------------------------------------

/** Which design badge an audit wears. The API has no "Rescheduled" or "Upcoming" status. */
export type BadgeKey = 'completed' | 'scheduled' | 'inProgress' | 'cancelled';

export function badgeKeyOf(status: AuditStatus): BadgeKey {
  switch (status) {
    case 'COMPLETED':
      return 'completed';
    case 'IN_PROGRESS':
      return 'inProgress';
    case 'CANCELLED':
      return 'cancelled';
    case 'SCHEDULED':
    default:
      return 'scheduled';
  }
}

export type TypeKey = 'internal' | 'external';

export function typeKeyOf(type: AuditType): TypeKey {
  return type === 'EXTERNAL' ? 'external' : 'internal';
}

/**
 * The short reference shown where the design prints a human audit code
 * ("AUD-2026-0042"). AuditSummary carries no human code, only the uuid, so
 * this is the uuid's first 8 hex digits, upper-cased (like a short git hash).
 */
export function auditCode(id: string): string {
  const head = id.replace(/-/g, '').slice(0, 8);
  return head === '' ? ADMIN_NO_VALUE : head.toUpperCase();
}

/** A trimmed string, or the shared dash. */
export function orDash(value: string | null | undefined): string {
  if (value === null || value === undefined) return ADMIN_NO_VALUE;
  const trimmed = value.trim();
  return trimmed === '' ? ADMIN_NO_VALUE : trimmed;
}

/** Internal audits name an auditor; external ones name an agency. */
export function auditorOf(a: Pick<AuditSummaryDto, 'auditorName' | 'externalAgencyName'>): string {
  return orDash(a.auditorName ?? a.externalAgencyName);
}

/** "78/100", or the dash before completion (totalScore is null until COMPLETED). */
export function scoreText(a: Pick<AuditSummaryDto, 'totalScore' | 'maxScore'>): string {
  return a.totalScore === null ? ADMIN_NO_VALUE : `${a.totalScore}/${a.maxScore}`;
}

/** The big score number and its "/100" denominator, each dashed when unknown. */
export function scoreParts(a: Pick<AuditSummaryDto, 'totalScore' | 'maxScore'>): { value: string; total: string } {
  return {
    value: a.totalScore === null ? ADMIN_NO_VALUE : String(a.totalScore),
    total: String(a.maxScore),
  };
}

/** Matches the design's search ("Farmer name, Farmer ID, Audit ID, Farm, Zone"). */
export function matchesSearch(a: AuditSummaryDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  const hay = [a.farmerName, a.tohfaFarmerId, a.id, auditCode(a.id), a.farmName ?? '', a.zoneName ?? ''];
  return hay.some((v) => v.toLowerCase().includes(q));
}

// ---------------------------------------------------------------------------
// IST calendar helpers
// ---------------------------------------------------------------------------

export interface IstDate {
  year: number;
  /** 0-11 */
  month: number;
  day: number;
}

export function istDateOf(value: string | Date): IstDate | null {
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms + IST_OFFSET_MS);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate() };
}

/** The UTC instant of IST midnight at the start of the given IST date. */
export function istMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
}

export interface InstantRange {
  scheduledFrom: string;
  scheduledTo: string;
}

/** [first IST midnight, last millisecond before the next IST midnight] as ISO instants. */
function range(start: Date, endExclusive: Date): InstantRange {
  return { scheduledFrom: start.toISOString(), scheduledTo: new Date(endExclusive.getTime() - 1).toISOString() };
}

export function dayRange(d: IstDate): InstantRange {
  return range(istMidnight(d.year, d.month, d.day), istMidnight(d.year, d.month, d.day + 1));
}

export function monthRange(year: number, month: number): InstantRange {
  return range(istMidnight(year, month, 1), istMidnight(year, month + 1, 1));
}

export function yearRange(year: number): InstantRange {
  return range(istMidnight(year, 0, 1), istMidnight(year + 1, 0, 1));
}

/** Monday-to-Sunday IST week containing `now`, matching the calendar's MON-first header. */
export function weekRange(now: Date): InstantRange {
  const today = istDateOf(now) as IstDate;
  const weekday = new Date(Date.UTC(today.year, today.month, today.day)).getUTCDay();
  const back = (weekday + 6) % 7;
  return range(
    istMidnight(today.year, today.month, today.day - back),
    istMidnight(today.year, today.month, today.day - back + 7),
  );
}

/** Weeks of the month, Monday first; null pads the days of neighbouring months. */
export function mondayFirstWeeks(year: number, month: number): (number | null)[][] {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const lead = (first + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** The month before / after, rolling the year. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

/** The audits of one IST day of the given month, in list order. */
export function auditsOnDay(items: readonly AuditSummaryDto[], year: number, month: number, day: number): AuditSummaryDto[] {
  return items.filter((a) => {
    const d = istDateOf(a.scheduledFor);
    return d !== null && d.year === year && d.month === month && d.day === day;
  });
}

/** The dot under a calendar day: several audits, or one coloured by its status. */
export type DayMarker = 'none' | 'multi' | 'completed' | 'active' | 'cancelled';

export function dayMarker(onDay: readonly AuditSummaryDto[]): DayMarker {
  if (onDay.length === 0) return 'none';
  if (onDay.length > 1) return 'multi';
  const only = onDay[0] as AuditSummaryDto;
  if (only.status === 'COMPLETED') return 'completed';
  if (only.status === 'CANCELLED') return 'cancelled';
  return 'active';
}

/** Distinct zones seen in the loaded audits, for the calendar's ZONE card. */
export function distinctZones(items: readonly AuditSummaryDto[]): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  for (const a of items) {
    if (a.zoneId !== null && !seen.has(a.zoneId)) seen.set(a.zoneId, a.zoneName ?? a.zoneId);
  }
  return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((x, y) => x.name.localeCompare(y.name));
}

/** The next value of a tap-to-cycle filter card. */
export function cycle<T>(options: readonly T[], current: T): T {
  const index = options.indexOf(current);
  return options[(index + 1) % options.length] as T;
}

// ---------------------------------------------------------------------------
// Query parameters
// ---------------------------------------------------------------------------

/**
 * A list query, or null when the filter has no backend equivalent (the
 * "Field Visit" type and the "Rescheduled" status do not exist in the API):
 * the screen then shows the empty result instead of an unfiltered one.
 */
export type ListQuery = Omit<ListAuditsParams, 'cursor'> | null;

function typeParam(type: TypeFilter): AuditType | undefined | null {
  if (type === 'fieldVisit') return null;
  if (type === 'internal') return 'INTERNAL';
  if (type === 'external') return 'EXTERNAL';
  return undefined;
}

/** Upcoming = still SCHEDULED and not yet due; Scheduled = SCHEDULED; In Progress = IN_PROGRESS. */
function statusParams(status: StatusFilter, now: Date): Pick<ListAuditsParams, 'status' | 'scheduledFrom'> {
  if (status === 'upcoming') return { status: ['SCHEDULED'], scheduledFrom: now.toISOString() };
  if (status === 'scheduled') return { status: ['SCHEDULED'] };
  if (status === 'inProgress') return { status: ['IN_PROGRESS'] };
  return {};
}

/** Later of two ISO instants (both bounds may constrain scheduledFrom). */
function laterIso(a: string | undefined, b: string | undefined): string | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export const LIST_PAGE_LIMIT = 50;

export function scheduleListQuery(filters: ScheduleFilters, now: Date): ListQuery {
  const type = typeParam(filters.type);
  if (type === null) return null;
  const status = statusParams(filters.status, now);
  let dates: Partial<InstantRange> = {};
  if (filters.date === 'today') dates = dayRange(istDateOf(now) as IstDate);
  else if (filters.date === 'thisWeek') dates = weekRange(now);
  else if (filters.date === 'thisMonth') {
    const today = istDateOf(now) as IstDate;
    dates = monthRange(today.year, today.month);
  }
  const scheduledFrom = laterIso(status.scheduledFrom, dates.scheduledFrom);
  return {
    sort: 'scheduledFor',
    limit: LIST_PAGE_LIMIT,
    ...(type !== undefined ? { type } : {}),
    ...(status.status !== undefined ? { status: status.status } : {}),
    ...(scheduledFrom !== undefined ? { scheduledFrom } : {}),
    ...(dates.scheduledTo !== undefined ? { scheduledTo: dates.scheduledTo } : {}),
  };
}

export function historyListQuery(filters: HistoryFilters): ListQuery {
  const type = typeParam(filters.type);
  if (type === null || filters.status === 'rescheduled') return null;
  const status: AuditStatus[] | undefined =
    filters.status === 'completed' ? ['COMPLETED'] : filters.status === 'cancelled' ? ['CANCELLED'] : undefined;
  return {
    sort: '-scheduledFor',
    limit: LIST_PAGE_LIMIT,
    ...yearRange(filters.year),
    ...(type !== undefined ? { type } : {}),
    ...(status !== undefined ? { status } : {}),
  };
}

/** The calendar month's query: the card filters narrow it like the list's. Zone is filtered client-side. */
export function monthListQuery(year: number, month: number, type: TypeFilter, status: StatusFilter, now: Date): ListQuery {
  const t = typeParam(type);
  if (t === null) return null;
  const s = statusParams(status, now);
  const r = monthRange(year, month);
  const scheduledFrom = laterIso(s.scheduledFrom, r.scheduledFrom) as string;
  return {
    sort: 'scheduledFor',
    limit: 100,
    scheduledFrom,
    scheduledTo: r.scheduledTo,
    ...(t !== undefined ? { type: t } : {}),
    ...(s.status !== undefined ? { status: s.status } : {}),
  };
}

/** Years offered by the history filter: this IST year and the two before (the design shows three). */
export function historyYears(now: Date): number[] {
  const y = (istDateOf(now) as IstDate).year;
  return [y, y - 1, y - 2];
}

/**
 * A count read off a fully loaded list: exact only when every page is in.
 * While loading, on error, or when more pages exist, null (the KPI shows the dash).
 */
export function exactCount(list: { items: readonly unknown[]; hasMore: boolean; isLoading: boolean; error: unknown }): number | null {
  if (list.isLoading || list.hasMore || (list.error !== null && list.error !== undefined)) return null;
  return list.items.length;
}

/** "Day of the IST calendar" for timeline instants; '' handling is the caller's. */
export function isSameIstDay(a: IstDate, b: IstDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

