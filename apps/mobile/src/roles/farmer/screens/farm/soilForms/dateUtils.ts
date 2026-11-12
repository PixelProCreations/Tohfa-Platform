/** DD/MM/YY for display and entry. */
export function formatDisplayDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** Parse a DD/MM/YY(YY) entry; falls back to today when it cannot be parsed. */
export function parseSoilDate(value: string): Date {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2}|\d{4})$/);
  if (match && match[1] && match[2] && match[3]) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const rawYear = Number(match[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const d = new Date(year, month - 1, day);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** DD/MM/YY(YY) or YYYY/MM/DD to an ISO calendar date; null when unrecognised. */
export function toIsoDate(value: string): string | null {
  const trimmed = value.trim();
  const slashMatch = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{2}|\d{4})$/);
  if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[3]) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const rawYear = slashMatch[3];
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return `${year}-${month}-${day}`;
  }
  const ymdMatch = trimmed.match(/^(\d{4})\s*[/-]\s*(\d{1,2})\s*[/-]\s*(\d{1,2})$/);
  if (ymdMatch && ymdMatch[1] && ymdMatch[2] && ymdMatch[3]) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

/** Full ISO timestamp for a DD/MM/YY entry (today when unparseable). */
export function toIsoTimestamp(value: string): string {
  return parseSoilDate(value).toISOString();
}
