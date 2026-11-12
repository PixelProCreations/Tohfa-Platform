// Canonical English short month names. The `dob` display string is part of the
// `onSave` payload, so it must stay locale-independent; only the calendar's
// on-screen month/weekday labels are translated (see calendar modal).
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function parseDisplayDate(str: string): Date {
  if (!str) return new Date();
  const parts = str.trim().split(/\s+/);
  const part0 = parts[0];
  const part1 = parts[1];
  const part2 = parts[2];
  if (parts.length === 3 && part0 && part1 && part2) {
    const day = parseInt(part0, 10);
    const monthIdx = MONTHS_SHORT.findIndex((m) => m.toLowerCase() === part1.toLowerCase().slice(0, 3));
    const year = parseInt(part2, 10);
    if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
      return new Date(year, monthIdx, day);
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

export function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTHS_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** `Date` -> the `YYYY-MM-DD` workforce.schema.ts's `dateSchema` requires. */
export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
