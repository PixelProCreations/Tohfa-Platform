/**
 * Admin date/time display, always in India Standard Time, in the formats the
 * warehouse screens already show: "25 Sep 2026 · 10:30 AM", "Today · 08:05 AM",
 * "Yesterday · 04:20 PM", "10 minutes ago". `now` is a parameter so callers
 * (and tests) decide the clock; nothing here reads Date.now().
 *
 * WHY a fixed +05:30 offset instead of Intl `timeZone: 'Asia/Kolkata'`: Hermes'
 * Intl support depends on the RN version and build flags, and when time-zone
 * data is missing it falls back to the device zone without an error, so a
 * phone set to another zone would show the wrong day. India has had a single
 * offset with no daylight saving since 1945, so shifting the instant by 330
 * minutes and reading UTC fields is exact and needs no Intl at all. Every
 * warehouse is in India; the API sends UTC instants.
 *
 * Words (month names, AM/PM, Today, "minutes ago") come from the admin i18n
 * catalogue, not from this file.
 */
import { t, type TranslationKey } from '../i18n';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
/** relativeTime shows "N days ago" below this many IST calendar days, then the date. */
const RELATIVE_DAYS_LIMIT = 7;

interface IstParts {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** Whole days since the epoch, counted in IST, for calendar-day comparisons. */
  dayNumber: number;
}

function parseInstant(value: string | Date): number | null {
  const ms = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function istParts(epochMs: number): IstParts {
  const shifted = new Date(epochMs + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    dayNumber: Math.floor((epochMs + IST_OFFSET_MS) / DAY_MS),
  };
}

function dayLabel(p: IstParts): string {
  return t('datetime.day', {
    day: p.day,
    month: t(`datetime.month.${p.month}` as TranslationKey),
    year: p.year,
  });
}

function timeLabel(p: IstParts): string {
  const hour12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  return t('datetime.time', {
    hour: String(hour12).padStart(2, '0'),
    minute: String(p.minute).padStart(2, '0'),
    period: p.hour < 12 ? t('datetime.am') : t('datetime.pm'),
  });
}

/** "25 Sep 2026" in IST, or '' when `iso` is not a date. */
export function formatAdminDay(iso: string | Date): string {
  const ms = parseInstant(iso);
  return ms === null ? '' : dayLabel(istParts(ms));
}

/**
 * "Today · 08:05 AM", "Yesterday · 04:20 PM" or "20 Sep 2026 · 10:30 AM", by
 * IST calendar day relative to `now`. '' when `iso` is not a date.
 */
export function formatAdminDate(iso: string | Date, now: Date): string {
  const ms = parseInstant(iso);
  if (ms === null) return '';
  const p = istParts(ms);
  const daysBack = istParts(now.getTime()).dayNumber - p.dayNumber;
  const day = daysBack === 0 ? t('datetime.today') : daysBack === 1 ? t('datetime.yesterday') : dayLabel(p);
  return t('datetime.dayAndTime', { day, time: timeLabel(p) });
}

/**
 * "Just now", "10 minutes ago", "3 hours ago", "Yesterday", "2 days ago", then
 * the IST date after a week. A time slightly in the future (device clock
 * behind the server) reads as "Just now". '' when `iso` is not a date.
 */
export function relativeTime(iso: string | Date, now: Date): string {
  const ms = parseInstant(iso);
  if (ms === null) return '';
  const elapsed = now.getTime() - ms;
  if (elapsed < MINUTE_MS) return t('datetime.justNow');
  if (elapsed < HOUR_MS) {
    const count = Math.floor(elapsed / MINUTE_MS);
    return count === 1 ? t('datetime.minuteAgo') : t('datetime.minutesAgo', { count });
  }
  if (elapsed < DAY_MS) {
    const count = Math.floor(elapsed / HOUR_MS);
    return count === 1 ? t('datetime.hourAgo') : t('datetime.hoursAgo', { count });
  }
  const p = istParts(ms);
  const daysBack = istParts(now.getTime()).dayNumber - p.dayNumber;
  if (daysBack <= 1) return t('datetime.yesterday');
  if (daysBack < RELATIVE_DAYS_LIMIT) return t('datetime.daysAgo', { count: daysBack });
  return dayLabel(p);
}

/** The IST weekday of `now`, 0 = Sunday ... 6 = Saturday (same fixed +05:30 shift as above). */
export function istWeekday(now: Date): number {
  return new Date(now.getTime() + IST_OFFSET_MS).getUTCDay();
}
