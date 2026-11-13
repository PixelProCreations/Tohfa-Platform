import { t } from '../../../../../../i18n/farmer';
import type { FarmCropResponse } from '../../../../api/crops';

// Real-data helpers (dates, diary summaries). Moved out of CropDetailScreen.tsx.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MS_PER_DAY = 86_400_000;
const NOON = 12;
const MINUTES_PER_HOUR = 60;

/** Whole-day difference, `b - a`, ignoring time-of-day. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** `"YYYY-MM-DD"` -> `"15 Jul 2026"`; `null` -> a translated placeholder. */
export function formatIsoDisplay(iso: string | null): string {
  if (!iso) return t('farmer.crops.detail.notSet');
  const parts = iso.split('-').map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS_SHORT[month - 1] ?? ''} ${year}`;
}

/** `"2026-07-15T06:45:00Z"` -> `"15 Jul · 06:45 AM"`, matching this screen's existing diary-entry format. */
export function formatDiaryTimestamp(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()] ?? '';
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= NOON ? 'PM' : 'AM';
  hours = hours % NOON;
  if (hours === 0) hours = NOON;
  return `${day} ${month} · ${String(hours).padStart(2, '0')}:${minutes} ${suffix}`;
}

/** `95` -> `"1h 35m"`, `50` -> `"50m"`. */
export function formatMinutesDuration(minutes: number): string {
  const h = Math.floor(minutes / MINUTES_PER_HOUR);
  const m = minutes % MINUTES_PER_HOUR;
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** `GRADE_A` -> `"Grade A"`; anything unrecognised is returned as-is. */
export function formatGradeLabel(grade: string): string {
  switch (grade) {
    case 'GRADE_A':
      return t('farmer.cropDetail.grade', { grade: 'A' });
    case 'GRADE_B':
      return t('farmer.cropDetail.grade', { grade: 'B' });
    case 'GRADE_C':
      return t('farmer.cropDetail.grade', { grade: 'C' });
    default:
      return grade;
  }
}

/** `"manure_application"` -> `"Manure application"`. No taxonomy lookup is fetched
 * just for this display label — see the diary-entries docblock above. */
export function formatActivityTitle(key: string): string {
  const spaced = key.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * t()'s key parameter is a literal string union, so a template-built key
 * (`` `farmer.crops.status.${status.toLowerCase()}` ``) doesn't type-check —
 * this maps the four real enum values to the literal keys added alongside it
 * in farmer.en.json/farmer.ta.json.
 */
export function cropStatusLabelKey(
  status: FarmCropResponse['status'],
): 'farmer.crops.status.planned' | 'farmer.crops.status.growing' | 'farmer.crops.status.harvested' | 'farmer.crops.status.failed' {
  switch (status) {
    case 'PLANNED':
      return 'farmer.crops.status.planned';
    case 'GROWING':
      return 'farmer.crops.status.growing';
    case 'HARVESTED':
      return 'farmer.crops.status.harvested';
    case 'FAILED':
      return 'farmer.crops.status.failed';
  }
}
