import type { ExpectedGrade, SeedQuantityUnit } from '../../../../api/crops';

/** Backend enum values accepted by CreateFarmCropBody.seedQuantityUnit. */
export const SEED_QUANTITY_UNITS: SeedQuantityUnit[] = ['grams', 'kg', 'packets', 'units'];

/**
 * crop_master has no "days to maturity" field (only shelfLifeDays, which is
 * POST-harvest shelf life, a different concept). There is no real per-crop
 * source for the harvest-date auto-suggestion the mock version faked with
 * `CROP_CATALOG[cropName].defaultDays`, so every crop now falls back to the
 * same constant. SPECIFICATION GAP — flagged for the team, not invented as
 * a per-crop table here.
 */
export const DEFAULT_MATURITY_DAYS = 75;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type UiGrade = 'Grade A' | 'Grade B' | 'Grade C';
export const UI_GRADES: readonly UiGrade[] = ['Grade A', 'Grade B', 'Grade C'];

export const GRADE_TO_API: Record<UiGrade, ExpectedGrade> = {
  'Grade A': 'GRADE_A',
  'Grade B': 'GRADE_B',
  'Grade C': 'GRADE_C',
};

/** Fallback display date when a stored display string cannot be parsed. */
const FALLBACK_YEAR = 2026;
const FALLBACK_MONTH_INDEX = 5;
const FALLBACK_DAY = 2;

/**
 * Short month names are the DISPLAY-DATE FORMAT ("2 Jun 2026") that
 * parseDisplayDate round-trips; they are a data format, not UI copy.
 */
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function parseDisplayDate(dateStr: string): Date {
  const parts = dateStr.trim().split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0] ?? '1', 10);
    const monthIndex = MONTHS_SHORT.findIndex((m) => m.toLowerCase() === parts[1]?.toLowerCase());
    const year = parseInt(parts[2] ?? String(FALLBACK_YEAR), 10);
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      return new Date(year, monthIndex, day);
    }
  }
  return new Date(FALLBACK_YEAR, FALLBACK_MONTH_INDEX, FALLBACK_DAY);
}

export function formatDisplayDate(date: Date): string {
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/** `YYYY-MM-DD` for the API from this screen's `"2 Jun 2026"` display strings. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addMaturityDays(date: Date): Date {
  return new Date(date.getTime() + DEFAULT_MATURITY_DAYS * MS_PER_DAY);
}
