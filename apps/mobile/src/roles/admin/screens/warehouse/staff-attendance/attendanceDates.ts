/**
 * Calendar-day arithmetic for the attendance screens. Attendance days are
 * Asia/Kolkata calendar dates (BR-84f: "today" is the IST date), so "today" and
 * "this month" come from the IST helpers in utils/datetime.ts, never from
 * `toISOString()` (UTC, which is still yesterday until 05:30 IST).
 *
 * Days are "YYYY-MM-DD" strings; the arithmetic runs on UTC midnights, which
 * have no daylight saving and so step exactly one calendar day at a time.
 * Pure, so plain-Node vitest covers it (tests/mappers_staff_attendance.test.ts).
 */
import { istDay } from '../../../utils/datetime';

const DAY_MS = 24 * 60 * 60 * 1000;

export type HistoryRange = 'Today' | '7 Days' | '30 Days' | 'This Month';

/** Days a ranged chip covers, today included. Display ranges, not business thresholds. */
const RANGE_DAYS: Readonly<Record<Exclude<HistoryRange, 'This Month'>, number>> = {
  Today: 1,
  '7 Days': 7,
  '30 Days': 30,
};

function utcMidnight(day: string): Date {
  const [y, m, d] = day.split('-').map((part) => parseInt(part, 10));
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function dayOf(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

/** The IST month of `now` as "YYYY-MM" (the summary endpoint's `month`). */
export function istMonth(now: Date): string {
  return istDay(now).slice(0, 7);
}

/** `day` moved by `delta` calendar days. */
export function shiftIstDay(day: string, delta: number): string {
  return dayOf(new Date(utcMidnight(day).getTime() + delta * DAY_MS));
}

/** `day`, or `today` when `day` is later (there is no attendance for a future day). */
export function clampDayToToday(day: string, today: string): string {
  return day > today ? today : day;
}

export interface MonthGrid {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
  daysInMonth: number;
  /** Weekday of the 1st, 0 = Sunday. */
  firstWeekday: number;
}

/** The month around `day`, as the date picker draws it. */
export function monthGridOf(day: string): MonthGrid {
  const date = utcMidnight(day);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return {
    year,
    month,
    day: date.getUTCDate(),
    daysInMonth: new Date(Date.UTC(year, month, 0)).getUTCDate(),
    firstWeekday: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
  };
}

/** `day` with its day of month replaced. */
export function withDayOfMonth(day: string, dayOfMonth: number): string {
  return `${day.slice(0, 8)}${String(dayOfMonth).padStart(2, '0')}`;
}

/** The from / to (inclusive) the history list and summary ask for, ending `today`. */
export function historyRangeDates(range: HistoryRange, today: string): { from: string; to: string } {
  if (range === 'This Month') return { from: `${today.slice(0, 7)}-01`, to: today };
  return { from: shiftIstDay(today, 1 - RANGE_DAYS[range]), to: today };
}
