import { t, type TranslationKey } from '../../../../../../i18n/farmer';
import type {
  AnimalGender,
  AnimalSource,
  AnimalSpecies,
  OrganicStatus,
} from '../../../../api/livestock';
import { af } from './i18n';

// ── Form data contract ───────────────────────────────────────────────────────
// `AnimalFormData` is the inter-screen contract (route params, AnimalDetail ->
// Register / Edit, onSave payloads). Its species / gender / organicStatus are
// canonical English identifiers and its dates are "02 Jun 2026" strings; they
// are data, never rendered directly -- the form translates them for display.

export type FormGender = 'Female' | 'Male';
export type FormSource = 'born_on_farm' | 'purchased';
export type FormOrganicStatus = 'Organic' | 'Transitioning' | 'Conventional';

export interface AnimalFormData {
  id?: string | undefined;
  tag: string;
  name?: string | undefined;
  species: string;
  gender: FormGender;
  breed: string;
  dob: string;
  source: FormSource;
  purchaseDate?: string | undefined;
  sourceFarm?: string | undefined;
  organicStatus: FormOrganicStatus;
}

export const SPECIES_OPTIONS = ['Cattle', 'Buffalo', 'Goat', 'Poultry', 'Sheep'];
export const GENDER_OPTIONS: FormGender[] = ['Female', 'Male'];
export const STATUS_OPTIONS: FormOrganicStatus[] = ['Organic', 'Transitioning', 'Conventional'];

// ── Display labels (form identifier -> i18n) ─────────────────────────────────

const SPECIES_LABEL_KEYS: Record<string, TranslationKey> = {
  Cattle: 'farmer.livestock.detail.species.CATTLE',
  Buffalo: 'farmer.livestock.detail.species.BUFFALO',
  Goat: 'farmer.livestock.detail.species.GOAT',
  Poultry: 'farmer.livestock.detail.species.POULTRY',
  Sheep: 'farmer.livestock.detail.species.SHEEP',
};

const GENDER_LABEL_KEYS: Record<FormGender, TranslationKey> = {
  Female: 'farmer.livestock.detail.gender.FEMALE',
  Male: 'farmer.livestock.detail.gender.MALE',
};

/** An unknown species (outside the five) is shown as-is, as it always was. */
export function speciesLabel(v: string): string {
  const key = SPECIES_LABEL_KEYS[v];
  return key ? t(key) : v;
}

export function genderLabel(v: FormGender): string {
  return t(GENDER_LABEL_KEYS[v]);
}

export function organicStatusLabel(v: FormOrganicStatus): string {
  switch (v) {
    case 'Organic':
      return af('organicStatus.organic');
    case 'Transitioning':
      return t('farmer.livestock.list.statusTransitioning');
    case 'Conventional':
      return t('farmer.livestock.list.statusConventional');
  }
}

/** Full month names for the calendar header, by `Date#getMonth()` index. */
const MONTH_NAME_KEYS: readonly TranslationKey[] = [
  'farmer.weather.month.jan',
  'farmer.weather.month.feb',
  'farmer.weather.month.mar',
  'farmer.weather.month.apr',
  'farmer.weather.month.may',
  'farmer.weather.month.jun',
  'farmer.weather.month.jul',
  'farmer.weather.month.aug',
  'farmer.weather.month.sep',
  'farmer.weather.month.oct',
  'farmer.weather.month.nov',
  'farmer.weather.month.dec',
];

export function monthName(monthIdx: number): string {
  const key = MONTH_NAME_KEYS[monthIdx];
  return key ? t(key) : '';
}

/** Sunday-first weekday initials for the calendar grid. */
export const WEEKDAY_LETTER_KEYS: readonly TranslationKey[] = [
  'farmer.farmDiary.common.weekdayLetter.sun',
  'farmer.farmDiary.common.weekdayLetter.mon',
  'farmer.farmDiary.common.weekdayLetter.tue',
  'farmer.farmDiary.common.weekdayLetter.wed',
  'farmer.farmDiary.common.weekdayLetter.thu',
  'farmer.farmDiary.common.weekdayLetter.fri',
  'farmer.farmDiary.common.weekdayLetter.sat',
];

// ── Date helpers ─────────────────────────────────────────────────────────────
// Month abbreviations here are the form's date-string data format (see the
// contract above), used for parsing / formatting only, never translated.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

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

/** `YYYY-MM-DD` for the API from the form's `"2 Jun 2026"` date strings. */
export function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** `YYYY-MM-DD` parsed as a LOCAL calendar date, never `new Date(iso)` (which
 *  reads it as UTC midnight and can roll back a day west of Greenwich). */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map((part) => parseInt(part, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function isoToDisplay(iso: string): string {
  return formatDisplayDate(parseIsoDate(iso));
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_WEEK = 7;
const MONTHS_PER_YEAR = 12;

export function computeAgeLabel(dateStr: string): string {
  const birth = parseDisplayDate(dateStr);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * MONTHS_PER_YEAR + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    return af('age.upcoming');
  }
  if (months === 0) {
    const msDiff = now.getTime() - birth.getTime();
    const days = Math.max(0, Math.floor(msDiff / MS_PER_DAY));
    if (days <= 0) return af('age.bornToday');
    if (days === 1) return af('age.oneDay');
    if (days < DAYS_PER_WEEK) return af('age.days', { count: days });
    const weeks = Math.floor(days / DAYS_PER_WEEK);
    return weeks === 1 ? af('age.oneWeek') : af('age.weeks', { count: weeks });
  }
  if (months < MONTHS_PER_YEAR) {
    return months === 1 ? af('age.oneMonth') : af('age.months', { count: months });
  }
  const years = Math.floor(months / MONTHS_PER_YEAR);
  const remMonths = months % MONTHS_PER_YEAR;
  if (remMonths === 0) {
    return years === 1 ? af('age.oneYear') : af('age.years', { count: years });
  }
  return af('age.yearsMonths', { years, months: remMonths });
}

// ── Enum mapping (form <-> API) ──────────────────────────────────────────────
// The form identifiers map 1:1 onto the real backend enums (livestock.schema.ts)
// -- written as explicit switches (not `.toUpperCase() as X`) so a future enum
// addition on either side fails to compile instead of silently mismatching.

export function speciesToApi(v: string): AnimalSpecies {
  switch (v) {
    case 'Buffalo':
      return 'BUFFALO';
    case 'Goat':
      return 'GOAT';
    case 'Poultry':
      return 'POULTRY';
    case 'Sheep':
      return 'SHEEP';
    case 'Cattle':
    default:
      return 'CATTLE';
  }
}

export function speciesFromApi(v: AnimalSpecies): string {
  switch (v) {
    case 'CATTLE':
      return 'Cattle';
    case 'BUFFALO':
      return 'Buffalo';
    case 'GOAT':
      return 'Goat';
    case 'POULTRY':
      return 'Poultry';
    case 'SHEEP':
      return 'Sheep';
  }
}

export function genderToApi(v: FormGender): AnimalGender {
  return v === 'Male' ? 'MALE' : 'FEMALE';
}

export function genderFromApi(v: AnimalGender): FormGender {
  return v === 'MALE' ? 'Male' : 'Female';
}

export function sourceToApi(v: FormSource): AnimalSource {
  return v === 'purchased' ? 'PURCHASED' : 'BORN_ON_FARM';
}

export function sourceFromApi(v: AnimalSource): FormSource {
  return v === 'PURCHASED' ? 'purchased' : 'born_on_farm';
}

export function organicStatusToApi(v: FormOrganicStatus): OrganicStatus {
  switch (v) {
    case 'Organic':
      return 'ORGANIC';
    case 'Conventional':
      return 'CONVENTIONAL';
    case 'Transitioning':
    default:
      return 'TRANSITIONING';
  }
}

export function organicStatusFromApi(v: OrganicStatus): FormOrganicStatus {
  switch (v) {
    case 'ORGANIC':
      return 'Organic';
    case 'TRANSITIONING':
      return 'Transitioning';
    case 'CONVENTIONAL':
      return 'Conventional';
  }
}
