
const DMY_PATTERN = /^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2}|\d{4})$/;
const YMD_PATTERN = /^(\d{4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})$/;
const CENTURY_PREFIX = '20';
const TWO_DIGIT_YEAR_BASE = 2000;
const TWO_DIGIT_YEAR_LIMIT = 100;
const PAD = 2;
const YEAR_SUFFIX_LENGTH = -2;

/**
 * The date inputs on this screen are free-typed as `DD/MM/YY` (matching the
 * placeholder examples); the API wants `YYYY-MM-DD` (soil.schema.ts's
 * `dateSchema`). Returns null for anything that doesn't parse, which the save
 * handler treats as a validation failure exactly like an empty field.
 */
export function toIsoDate(value: string): string | null {
  const trimmed = value.trim();
  const slashMatch = trimmed.match(DMY_PATTERN);
  if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[3]) {
    const day = slashMatch[1].padStart(PAD, '0');
    const month = slashMatch[2].padStart(PAD, '0');
    const rawYear = slashMatch[3];
    const year = rawYear.length === PAD ? `${CENTURY_PREFIX}${rawYear}` : rawYear;
    return `${year}-${month}-${day}`;
  }
  const ymdMatch = trimmed.match(YMD_PATTERN);
  if (ymdMatch && ymdMatch[1] && ymdMatch[2] && ymdMatch[3]) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(PAD, '0');
    const day = ymdMatch[3].padStart(PAD, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

export function parseSoilDate(value: string): Date {
  const trimmed = value.trim();
  const match = trimmed.match(DMY_PATTERN);
  if (match && match[1] && match[2] && match[3]) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const rawYear = Number(match[3]);
    const year = rawYear < TWO_DIGIT_YEAR_LIMIT ? TWO_DIGIT_YEAR_BASE + rawYear : rawYear;
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Format a Date as the `DD/MM/YY` string the inputs hold. */
export function formatSoilDate(date: Date): string {
  const dd = String(date.getDate()).padStart(PAD, '0');
  const mm = String(date.getMonth() + 1).padStart(PAD, '0');
  const yy = String(date.getFullYear()).slice(YEAR_SUFFIX_LENGTH);
  return `${dd}/${mm}/${yy}`;
}

/** Suggested next-due date: the test date plus one year. */
export function addOneYear(date: Date): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + 1);
  return next;
}
