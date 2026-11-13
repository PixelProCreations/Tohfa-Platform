import { ts } from './i18n';

export function monthShort(monthIndex: number): string {
  return ts(`farmer.logPestTreatment.month.${monthIndex}`);
}

export function monthFull(monthIndex: number): string {
  return ts(`farmer.treatmentSchedule.month.${monthIndex}`);
}

export function formatDisplayDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  return `${day} ${monthShort(d.getMonth())} ${d.getFullYear()}`;
}

/** `Date` -> the `YYYY-MM-DD` the API's `dateSchema` requires (pest.schema.ts). */
export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** `YYYY-MM-DD` (or any ISO datetime) -> the `DD Mon YYYY` this screen displays. */
export function formatIsoDisplay(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (isNaN(d.getTime())) return iso;
  return formatDisplayDate(d);
}
