/**
 * Warehouse Settings (Main Warehouse admin) form rules: capacity (PATCH
 * /warehouses/{id}/capacity, BR-66), contact phone and operating hours (PATCH
 * /warehouses/{id}, BR-80). Pure (no React), so plain-Node vitest covers every
 * rule here (../../../tests/mappers_settings.test.ts).
 *
 * Only what the server stores is edited. The old screen's per-warehouse
 * low-stock threshold, escalation share, assigned-staff count and automation
 * switches had no endpoint, and business thresholds belong in system_config
 * (root CLAUDE.md 2.7), so they are gone rather than kept as local mock state.
 *
 * Capacity stays a decimal string end to end (no parseFloat): the input is
 * normalised and checked against the contract format, then sent as typed.
 */
import {
  CAPACITY_KG_RE,
  E164_RE,
  HHMM_RE,
  WEEKDAYS,
  type OperatingHoursDto,
  type Weekday,
} from '../../../api/warehouseSettings';
import type { TranslationKey } from '../../../i18n';

export type ParseResult<T> = { value: T } | { errorKey: TranslationKey };

// ─── Which warehouse ─────────────────────────────────────────────────────────

/**
 * The warehouse uuid the Documents and Warehouse Settings screens act on
 * (BR-30): a Sub scope is ALWAYS its own warehouse; Main uses its pick when the
 * pick is one of the real warehouses (GET /warehouses), else the first real
 * one. The flow's shared pick may still be a sample code from another screen's
 * fixture selector ('WH-OOTY'), which the server would reject, so it is never
 * sent. undefined = nothing to ask for yet.
 */
export function pickWarehouseId(
  scope: { warehouseId?: string | undefined },
  options: readonly { warehouseId?: string | undefined }[],
  selectedId: string | undefined,
): string | undefined {
  if (scope.warehouseId !== undefined) return scope.warehouseId;
  if (selectedId !== undefined && options.some((o) => o.warehouseId === selectedId)) return selectedId;
  return options[0]?.warehouseId;
}

// ─── Capacity ────────────────────────────────────────────────────────────────

/** '30000.000' -> '30000', '12.500' -> '12.5': the stored value as the admin would type it. */
export function capacityInputOf(capacityKg: string | null | undefined): string {
  if (capacityKg === null || capacityKg === undefined) return '';
  if (!/^\d+(\.\d+)?$/.test(capacityKg)) return capacityKg;
  return capacityKg.includes('.') ? capacityKg.replace(/0+$/, '').replace(/\.$/, '') : capacityKg;
}

/**
 * The typed capacity -> the decimal kg string PATCH accepts (at most 9 integer
 * digits and 3 decimals, greater than 0). Spaces and Indian/Western grouping
 * commas are dropped; nothing is rounded.
 */
export function parseCapacityInput(input: string): ParseResult<string> {
  const normalised = input.replace(/[\s,]/g, '');
  if (normalised === '') return { errorKey: 'warehouseSettings.capacity.error.required' };
  if (!CAPACITY_KG_RE.test(normalised)) return { errorKey: 'warehouseSettings.capacity.error.format' };
  if (!/[1-9]/.test(normalised)) return { errorKey: 'warehouseSettings.capacity.error.zero' };
  return { value: normalised };
}

// ─── Contact phone ───────────────────────────────────────────────────────────

/**
 * The typed phone -> E.164, or null (blank clears it). Spaces, dashes and
 * brackets are dropped; the country code must be typed (+91...).
 */
export function parsePhoneInput(input: string): ParseResult<string | null> {
  const compact = input.replace(/[\s\-()]/g, '');
  if (compact === '') return { value: null };
  if (!E164_RE.test(compact)) return { errorKey: 'warehouseSettings.phone.error.format' };
  return { value: compact };
}

// ─── Operating hours ─────────────────────────────────────────────────────────

const DAY_LABEL: Readonly<Record<Weekday, TranslationKey>> = {
  mon: 'profile.operating.day.mon',
  tue: 'profile.operating.day.tue',
  wed: 'profile.operating.day.wed',
  thu: 'profile.operating.day.thu',
  fri: 'profile.operating.day.fri',
  sat: 'profile.operating.day.sat',
  sun: 'profile.operating.day.sun',
};

export interface OperatingDayForm {
  day: Weekday;
  labelKey: TranslationKey;
  isOpen: boolean;
  /** HH:MM, or '' while not typed. */
  open: string;
  close: string;
}

export interface OperatingHoursForm {
  days: OperatingDayForm[];
  /** False when nothing usable is stored (the form then starts with every day closed). */
  configured: boolean;
}

function closedWeek(): OperatingDayForm[] {
  return WEEKDAYS.map((day) => ({ day, labelKey: DAY_LABEL[day], isOpen: false, open: '', close: '' }));
}

/**
 * The stored hours as an editable week. Anything but the one shape the API
 * accepts (all seven days, each closed or open with HH:MM times) starts from
 * an all-closed week marked not configured, rather than guessing.
 */
export function operatingHoursFormOf(stored: unknown): OperatingHoursForm {
  if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) return { days: closedWeek(), configured: false };
  const record = stored as Record<string, unknown>;
  const days: OperatingDayForm[] = [];
  for (const day of WEEKDAYS) {
    const value = record[day];
    if (value === null || typeof value !== 'object') return { days: closedWeek(), configured: false };
    const entry = value as Record<string, unknown>;
    if (entry['closed'] === true) {
      days.push({ day, labelKey: DAY_LABEL[day], isOpen: false, open: '', close: '' });
    } else if (
      entry['closed'] === false &&
      typeof entry['open'] === 'string' &&
      typeof entry['close'] === 'string' &&
      HHMM_RE.test(entry['open']) &&
      HHMM_RE.test(entry['close'])
    ) {
      days.push({ day, labelKey: DAY_LABEL[day], isOpen: true, open: entry['open'], close: entry['close'] });
    } else {
      return { days: closedWeek(), configured: false };
    }
  }
  return { days, configured: true };
}

/** '9:00' -> '09:00'; anything else is returned trimmed for the format check. */
function normaliseTime(value: string): string {
  const trimmed = value.trim();
  return /^\d:[0-5]\d$/.test(trimmed) ? `0${trimmed}` : trimmed;
}

export type HoursResult = { value: OperatingHoursDto } | { errorKey: TranslationKey; day: Weekday };

/** The edited week -> the PATCH body: every open day needs HH:MM times with open before close. */
export function operatingHoursBody(days: readonly OperatingDayForm[]): HoursResult | { errorKey: TranslationKey } {
  const out: Partial<OperatingHoursDto> = {};
  for (const weekday of WEEKDAYS) {
    const day = days.find((d) => d.day === weekday);
    if (day === undefined) return { errorKey: 'warehouseSettings.hours.error.incomplete' };
    if (!day.isOpen) {
      out[weekday] = { closed: true };
      continue;
    }
    const open = normaliseTime(day.open);
    const close = normaliseTime(day.close);
    if (!HHMM_RE.test(open) || !HHMM_RE.test(close)) return { errorKey: 'warehouseSettings.hours.error.format', day: weekday };
    // HH:MM strings of the same width compare correctly as text.
    if (!(open < close)) return { errorKey: 'warehouseSettings.hours.error.order', day: weekday };
    out[weekday] = { closed: false, open, close };
  }
  return { value: out as OperatingHoursDto };
}
