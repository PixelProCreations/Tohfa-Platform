/**
 * Date-range presets for the finance reports (GET /admin/finance/reports/*,
 * BR-63): `from` and `to` are IST calendar days, YYYY-MM-DD, both inclusive.
 *
 * Pure string/UTC arithmetic: no react-native import and no local-timezone
 * Date maths, so plain-Node vitest covers it and a phone set to another zone
 * still asks for the same days. `today` is passed in (istToday() at the call
 * site) so tests can pin it.
 *
 * The longest span the server accepts is a system_config value; the client
 * never caps it (CLAUDE.md 2.7). A span the server refuses comes back as a 422
 * the screen renders through adminErrorKey.
 */
import { monthStart } from './mappers';

export type ReportRangePreset = 'today' | 'last7' | 'monthToDate' | 'lastMonth';

/** The presets in the order the screen offers them. */
export const REPORT_RANGE_PRESETS: readonly ReportRangePreset[] = ['today', 'last7', 'monthToDate', 'lastMonth'];

export interface ReportRange {
  from: string;
  to: string;
}

const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseDay(day: string): number {
  if (!ISO_DAY_RE.test(day)) throw new Error(`not a YYYY-MM-DD day: ${day}`);
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function formatDay(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

/** `day` moved by `days` calendar days (negative goes back), across month and year ends. */
export function addDays(day: string, days: number): string {
  return formatDay(parseDay(day) + days * DAY_MS);
}

/** The whole calendar month before `today`'s month. */
export function previousMonth(today: string): ReportRange {
  const firstOfThisMonth = monthStart(today);
  const to = addDays(firstOfThisMonth, -1);
  return { from: monthStart(to), to };
}

/** The range a preset stands for, relative to `today` (YYYY-MM-DD, IST). */
export function reportRange(preset: ReportRangePreset, today: string): ReportRange {
  parseDay(today);
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'last7':
      // Seven days including today.
      return { from: addDays(today, -6), to: today };
    case 'monthToDate':
      return { from: monthStart(today), to: today };
    case 'lastMonth':
      return previousMonth(today);
  }
}
