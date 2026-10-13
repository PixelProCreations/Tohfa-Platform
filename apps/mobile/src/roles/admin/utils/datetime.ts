/**
 * India Standard Time helpers.
 *
 * The API sends RFC 3339 UTC instants (docs/openapi.yaml Conventions) and
 * every TOHFA warehouse is in India, so "today", report day boundaries and
 * displayed times are IST. IST is a fixed +05:30 with no DST, so this is plain
 * offset arithmetic — deliberately not `toLocaleString`, whose output depends
 * on the device's timezone and on Hermes' (partial) Intl support.
 */

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

interface IstParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

function toIstParts(input: string | Date): IstParts | null {
  const ms = typeof input === 'string' ? (input === '' ? Number.NaN : Date.parse(input)) : input.getTime();
  if (!Number.isFinite(ms)) return null;
  const shifted = new Date(ms + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

/** IST calendar date as `YYYY-MM-DD` (the API's `format: date`). */
export function istDateString(input: string | Date): string | null {
  const p = toIstParts(input);
  return p === null ? null : `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** Today in IST as `YYYY-MM-DD`. */
export function istToday(now: Date = new Date()): string {
  return istDateString(now) as string;
}

/** Display: `DD/MM/YYYY` in IST. */
export function formatIstDate(input: string | Date): string | null {
  const p = toIstParts(input);
  return p === null ? null : `${pad2(p.day)}/${pad2(p.month)}/${p.year}`;
}

/** Display: `DD/MM/YYYY HH:mm` (24h) in IST. */
export function formatIstDateTime(input: string | Date): string | null {
  const p = toIstParts(input);
  return p === null
    ? null
    : `${pad2(p.day)}/${pad2(p.month)}/${p.year} ${pad2(p.hour)}:${pad2(p.minute)}`;
}

function istMidnightUtcMs(date: string): number | null {
  const m = DATE_RE.exec(date);
  if (m === null) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = Date.UTC(y, mo - 1, d);
  const check = new Date(utc);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return utc - IST_OFFSET_MS;
}

/** UTC instant of 00:00:00.000 IST on `date` (`YYYY-MM-DD`). */
export function istDayStartUtc(date: string): string | null {
  const ms = istMidnightUtcMs(date);
  return ms === null ? null : new Date(ms).toISOString();
}

/** UTC instant of 23:59:59.999 IST on `date` (`YYYY-MM-DD`). */
export function istDayEndUtc(date: string): string | null {
  const ms = istMidnightUtcMs(date);
  return ms === null ? null : new Date(ms + 24 * 60 * 60 * 1000 - 1).toISOString();
}
