/**
 * The decisions behind the warehouse profile and settings screens, kept out of
 * the components (no react-native import) so plain-Node vitest covers them:
 * ../../../tests/profile_warehouse_rules.test.ts.
 *
 *  - Gates: which docs/rbac.json code each write needs. A permission check,
 *    never a role-name compare; the server enforces it again (CLAUDE.md 2.1).
 *  - Role labels: one i18n label per role code, so a Super Admin is never
 *    shown as a Sub Warehouse admin.
 *  - Operating hours (BR-80b): the API holds a strict 7-day object, not a
 *    string. `operatingHoursLines` formats it for display, `buildOperatingHours`
 *    builds it back from the editor.
 *  - The edit body (BR-80a): PATCH /warehouses/{id} takes contactPhone and/or
 *    operatingHours and nothing else, so the body is built from those two keys
 *    only, and only the ones that changed.
 *  - Capacity (BR-66): kg decimal strings from GET /capacity, formatted through
 *    integer grams, never parseFloat.
 */
import { RoleCode } from '@tohfa/shared-types';
import {
  CAPACITY_KG_RE,
  E164_RE,
  HHMM_RE,
  WEEKDAYS,
  type OperatingDayDto,
  type OperatingHoursDto,
  type UpdateWarehouseProfileBody,
  type Weekday,
} from '../../../api/warehouseSettings';
import type { WarehouseCapacityDto } from '../../../api/warehouses';
import { t, type TranslationKey } from '../../../i18n';
import { formatKg, gramsToKgString, parseKgToGrams } from '../../../money/quantity';
import { istWeekday } from '../../../utils/datetime';
import type { PermissionCheck } from './types';

// ─── Gates ───────────────────────────────────────────────────────────────────

/** docs/rbac.json codes of the two warehouse writes (apps/api warehouse-profile / warehouses routes). */
export const WAREHOUSE_WRITE_CODES = {
  /** PATCH /warehouses/{id}: SA/TA/Main all, Sub none (BR-80c). */
  profileEdit: 'warehouse.profile.edit',
  /** PATCH /warehouses/{id}/capacity: SA/TA/Main all, Sub none (BR-66c). */
  capacitySet: 'warehouse.capacity.set',
} as const;

export function canEditWarehouseProfile(can: PermissionCheck): boolean {
  return can(WAREHOUSE_WRITE_CODES.profileEdit);
}

export function canSetWarehouseCapacity(can: PermissionCheck): boolean {
  return can(WAREHOUSE_WRITE_CODES.capacitySet);
}

// ─── Role labels ─────────────────────────────────────────────────────────────

type AdminRoleCode = 'SUPER_ADMIN' | 'TOHFA_ADMIN' | 'FARMER_ADMIN' | 'MAIN_WH_ADMIN' | 'SUB_WH_ADMIN';

const ROLE_LABEL_KEYS: Readonly<Record<AdminRoleCode, TranslationKey>> = {
  [RoleCode.SUPER_ADMIN]: 'profile.role.SUPER_ADMIN',
  [RoleCode.TOHFA_ADMIN]: 'profile.role.TOHFA_ADMIN',
  [RoleCode.FARMER_ADMIN]: 'profile.role.FARMER_ADMIN',
  [RoleCode.MAIN_WH_ADMIN]: 'profile.role.MAIN_WH_ADMIN',
  [RoleCode.SUB_WH_ADMIN]: 'profile.role.SUB_WH_ADMIN',
};

const ACCESS_LEVEL_KEYS: Readonly<Record<AdminRoleCode, TranslationKey>> = {
  [RoleCode.SUPER_ADMIN]: 'profile.accessLevel.SUPER_ADMIN',
  [RoleCode.TOHFA_ADMIN]: 'profile.accessLevel.TOHFA_ADMIN',
  [RoleCode.FARMER_ADMIN]: 'profile.accessLevel.FARMER_ADMIN',
  [RoleCode.MAIN_WH_ADMIN]: 'profile.accessLevel.MAIN_WH_ADMIN',
  [RoleCode.SUB_WH_ADMIN]: 'profile.accessLevel.SUB_WH_ADMIN',
};

function isAdminRole(code: string | null | undefined): code is AdminRoleCode {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(ROLE_LABEL_KEYS, code);
}

/** i18n key of a role's title; an unknown or missing code is "unknown", never a guessed role. */
export function roleLabelKey(code: string | null | undefined): TranslationKey {
  return isAdminRole(code) ? ROLE_LABEL_KEYS[code] : 'profile.role.unknown';
}

/** i18n key of a role's access-level description. */
export function accessLevelKey(code: string | null | undefined): TranslationKey {
  return isAdminRole(code) ? ACCESS_LEVEL_KEYS[code] : 'profile.accessLevel.unknown';
}

// ─── Operating hours (BR-80b) ────────────────────────────────────────────────

const DAY_LABEL_KEYS: Readonly<Record<Weekday, TranslationKey>> = {
  mon: 'profile.operating.day.mon',
  tue: 'profile.operating.day.tue',
  wed: 'profile.operating.day.wed',
  thu: 'profile.operating.day.thu',
  fri: 'profile.operating.day.fri',
  sat: 'profile.operating.day.sat',
  sun: 'profile.operating.day.sun',
};

export function dayLabel(day: Weekday): string {
  return t(DAY_LABEL_KEYS[day]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDay(value: unknown): OperatingDayDto | null {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value).sort().join(',');
  if (value['closed'] === true && keys === 'closed') return { closed: true };
  const open = value['open'];
  const close = value['close'];
  if (
    value['closed'] === false &&
    keys === 'close,closed,open' &&
    typeof open === 'string' &&
    typeof close === 'string' &&
    HHMM_RE.test(open) &&
    HHMM_RE.test(close) &&
    // Same-width HH:MM strings compare correctly as text (the server's own check).
    open < close
  ) {
    return { closed: false, open, close };
  }
  return null;
}

/**
 * The warehouse's `operatingHours` (raw jsonb on the wire) as the strict API
 * shape, or null when it is unset or not that shape. Monday-first key order.
 */
export function parseOperatingHours(raw: unknown): OperatingHoursDto | null {
  if (!isRecord(raw)) return null;
  if (Object.keys(raw).length !== WEEKDAYS.length) return null;
  const week: Partial<Record<Weekday, OperatingDayDto>> = {};
  for (const day of WEEKDAYS) {
    const parsed = parseDay(raw[day]);
    if (parsed === null) return null;
    week[day] = parsed;
  }
  return week as OperatingHoursDto;
}

export interface OperatingHoursLine {
  day: Weekday;
  dayLabel: string;
  closed: boolean;
  /** "09:00 – 18:00", or the "Closed" label. */
  text: string;
}

/** Seven display lines, Monday first; null when no valid hours are set (the screen says "not configured"). */
export function operatingHoursLines(raw: unknown): OperatingHoursLine[] | null {
  const week = parseOperatingHours(raw);
  if (week === null) return null;
  return WEEKDAYS.map((day) => {
    const value = week[day];
    return value.closed
      ? { day, dayLabel: dayLabel(day), closed: true, text: t('profile.operating.closed') }
      : { day, dayLabel: dayLabel(day), closed: false, text: t('profile.operating.hours', { open: value.open, close: value.close }) };
  });
}

// istWeekday is 0 = Sunday; the API week starts on Monday.
const API_DAY_BY_JS_DAY: readonly Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Today's API weekday on the IST business day (Date#getDay would use the device zone). */
export function todayWeekday(now: Date): Weekday {
  return API_DAY_BY_JS_DAY[istWeekday(now)] ?? 'mon';
}

/** One day in the hours editor. Times are typed as 24-hour HH:MM, the contract format. */
export interface DayEdit {
  open: boolean;
  openTime: string;
  closeTime: string;
}

export type OperatingHoursEdit = Record<Weekday, DayEdit>;

/** Editor state from the warehouse's hours; with none set every day starts closed (no invented hours). */
export function operatingHoursToEdit(raw: unknown): OperatingHoursEdit {
  const week = parseOperatingHours(raw);
  const edit = {} as OperatingHoursEdit;
  for (const day of WEEKDAYS) {
    const value = week?.[day];
    edit[day] =
      value === undefined || value.closed
        ? { open: false, openTime: '', closeTime: '' }
        : { open: true, openTime: value.open, closeTime: value.close };
  }
  return edit;
}

export type RuleResult<T> = { ok: true; value: T } | { ok: false; errorKey: TranslationKey; day?: Weekday };

/** The editor's week as the API's strict object, or the first day that would be a 422. */
export function buildOperatingHours(edit: OperatingHoursEdit): RuleResult<OperatingHoursDto> {
  const week: Partial<Record<Weekday, OperatingDayDto>> = {};
  for (const day of WEEKDAYS) {
    const value = edit[day];
    if (!value.open) {
      week[day] = { closed: true };
      continue;
    }
    const open = value.openTime.trim();
    const close = value.closeTime.trim();
    if (!HHMM_RE.test(open) || !HHMM_RE.test(close)) return { ok: false, errorKey: 'profile.edit.error.hoursFormat', day };
    if (!(open < close)) return { ok: false, errorKey: 'profile.edit.error.hoursOrder', day };
    week[day] = { closed: false, open, close };
  }
  return { ok: true, value: week as OperatingHoursDto };
}

function sameEdit(a: OperatingHoursEdit, b: OperatingHoursEdit): boolean {
  return WEEKDAYS.every((day) => {
    const x = a[day];
    const y = b[day];
    if (x.open !== y.open) return false;
    // A closed day's leftover times are never sent, so they are not a change.
    return !x.open || (x.openTime.trim() === y.openTime.trim() && x.closeTime.trim() === y.closeTime.trim());
  });
}

// ─── Edit body (BR-80a) ──────────────────────────────────────────────────────

/** Typed phone as E.164 ('' = clear). Spaces, dashes and brackets a person types are dropped. */
export function normalisePhoneInput(input: string): string {
  return input.replace(/[\s\-()]/g, '');
}

export interface WarehouseProfileCurrent {
  contactPhone?: string | null | undefined;
  operatingHours?: unknown;
}

export interface WarehouseProfileForm {
  contactPhone: string;
  hours: OperatingHoursEdit;
}

/**
 * The PATCH /warehouses/{id} body: only contactPhone and operatingHours, only
 * the ones that changed. Untouched hours are not sent, so a warehouse with no
 * hours set is never silently given an all-closed week.
 */
export function buildWarehouseProfileEditBody(
  current: WarehouseProfileCurrent,
  form: WarehouseProfileForm,
): RuleResult<UpdateWarehouseProfileBody> {
  const body: UpdateWarehouseProfileBody = {};

  const phone = normalisePhoneInput(form.contactPhone);
  const currentPhone = current.contactPhone ?? '';
  if (phone !== currentPhone) {
    if (phone !== '' && !E164_RE.test(phone)) return { ok: false, errorKey: 'profile.edit.error.phone' };
    body.contactPhone = phone === '' ? null : phone;
  }

  if (!sameEdit(form.hours, operatingHoursToEdit(current.operatingHours))) {
    const built = buildOperatingHours(form.hours);
    if (!built.ok) return built;
    body.operatingHours = built.value;
  }

  if (body.contactPhone === undefined && body.operatingHours === undefined) {
    return { ok: false, errorKey: 'profile.edit.error.noChanges' };
  }
  return { ok: true, value: body };
}

// ─── Capacity (BR-66) ────────────────────────────────────────────────────────

/** A typed capacity as the API's decimal kg string (> 0, at most 3 decimals), or null. */
export function parseCapacityInput(input: string): string | null {
  const grams = parseKgToGrams(input);
  if (grams === null || grams <= 0) return null;
  const kg = gramsToKgString(grams);
  return CAPACITY_KG_RE.test(kg) ? kg : null;
}

/** An API kg string as "12,480.5 kg"; '—' when absent or not a kg string. */
export function kgText(value: string | null | undefined): string {
  if (value === null || value === undefined) return t('profile.noValue');
  const grams = parseKgToGrams(value);
  return grams === null ? t('profile.noValue') : formatKg(grams);
}

export interface CapacityFigures {
  total: string;
  used: string;
  available: string;
  utilization: string;
  /** For a fill bar; null without a capacity. Not clamped here (over capacity is real). */
  fillPercent: number | null;
}

export function capacityFigures(dto: WarehouseCapacityDto | null | undefined): CapacityFigures {
  const none = t('profile.noValue');
  if (dto === null || dto === undefined) return { total: none, used: none, available: none, utilization: none, fillPercent: null };
  const percent = dto.utilizationPercent;
  return {
    total: kgText(dto.capacityKg),
    used: kgText(dto.usedKg),
    available: kgText(dto.availableKg),
    utilization: percent === null ? none : t('profile.capacity.percent', { value: String(percent) }),
    fillPercent: percent,
  };
}
