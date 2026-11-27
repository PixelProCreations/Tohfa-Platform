/**
 * Date formatting for the Audit Management module.
 *
 * Every date in the audit mocks is an ISO string. Calendar days are `YYYY-MM-DD`; date-times are
 * `YYYY-MM-DDTHH:mm:00Z` holding the designed wall-clock time *as UTC*. All formatting below reads the
 * UTC fields, so the output never shifts by a day or an hour with the viewer's time zone. When the
 * screens are integrated, the API's `scheduledFor` (a real instant) must be converted to the farm's
 * local time (Asia/Kolkata) first — that is an integration task, not done here.
 *
 * No function here reads the real clock.
 */
import { AUDIT_STRINGS as S } from './audit.strings';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Accepts `YYYY-MM-DD` or a full ISO string; `YYYY-MM-DD` is parsed as UTC midnight. */
export function parseAuditDate(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
}

/** "15 Oct 2026" (day zero-padded, as design 75 shows "02 Oct 2026"). */
export function formatAuditDate(iso: string): string {
  const d = parseAuditDate(iso);
  return `${pad2(d.getUTCDate())} ${S.MONTHS_SHORT[d.getUTCMonth()] ?? ''} ${d.getUTCFullYear()}`;
}

/** "10:00 AM" / "02:00 PM" — 12-hour, hour zero-padded, as design 75. */
export function formatAuditTime12(iso: string): string {
  const d = parseAuditDate(iso);
  const h = d.getUTCHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${pad2(h12)}:${pad2(d.getUTCMinutes())} ${h < 12 ? S.AM : S.PM}`;
}

/** "10:00" / "09:30" — 24-hour, as designs 74 and 76. */
export function formatAuditTime24(iso: string): string {
  const d = parseAuditDate(iso);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

/** "15 Oct 2026, 10:00 AM" (design 75). */
export function formatAuditDateTime12(iso: string): string {
  return `${formatAuditDate(iso)}, ${formatAuditTime12(iso)}`;
}

/** "15 Oct 2026, 10:00" (designs 74, 76, 77). */
export function formatAuditDateTime24(iso: string): string {
  return `${formatAuditDate(iso)}, ${formatAuditTime24(iso)}`;
}

/** "Thursday, 15 October 2026" — for aria-labels. */
export function formatAuditDateLong(iso: string): string {
  const d = parseAuditDate(iso);
  // getUTCDay(): 0 = Sunday. The weekday list is Monday-first.
  const weekday = S.WEEKDAYS_LONG[(d.getUTCDay() + 6) % 7] ?? '';
  return `${weekday}, ${pad2(d.getUTCDate())} ${S.MONTHS_LONG[d.getUTCMonth()] ?? ''} ${d.getUTCFullYear()}`;
}

/** "October 2026" for a 0-based month. */
export function formatAuditMonth(year: number, month0: number): string {
  return `${S.MONTHS_LONG[month0] ?? ''} ${year}`;
}

/** `YYYY-MM-DD` for a UTC year / 0-based month / day (handles overflow, e.g. day 0 or 32). */
export function auditIsoDay(year: number, month0: number, day: number): string {
  const d = new Date(Date.UTC(year, month0, day));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** `YYYY-MM-DD` prefix of an ISO date or date-time. */
export function auditDayOf(iso: string): string {
  return iso.slice(0, 10);
}
