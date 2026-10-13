/**
 * Warehouse info DTO -> screen models (BR-30, BR-66), read-only.
 *
 * - The warehouse id always comes from the session scope (`scopedWarehouseId`),
 *   never from input (BR-30).
 * - kg strings become integer grams here, once; parsing is strict, so a value
 *   the API should never send surfaces as the screen's error state.
 * - Capacity is shown as the server derived it (BR-66): a negative available
 *   figure means over capacity and is NOT clamped; no capacity means null.
 * - Allow-lists: coordinates and `marketDayOfWeek` are not mapped. The spec
 *   gives `marketDayOfWeek` as 0..6 without saying which day 0 is, so showing
 *   a weekday would be a guess (reported as an open question).
 * - Operating hours: the only documented shape is BR-80's unconfirmed default
 *   (all seven weekdays, `closed` or `open`/`close` HH:MM). Anything else is
 *   shown as "not specified" rather than interpreted.
 */
import type {
  StorageLocationDto,
  WarehouseCapacityDto,
  WarehouseDto,
  WarehouseTypeDto,
} from '../../../api/warehouseInfo';
import type { TranslationKey } from '../../../i18n';
import { parseKgToGrams, type Grams } from '../../../money/quantity';
import type { AdminScope } from '../../../session/scope';

export type StatusTone = 'success' | 'danger' | 'warning' | 'info';

export interface StatusMeta {
  labelKey: TranslationKey;
  tone: StatusTone;
}

function has<K extends string>(map: Record<K, unknown>, key: string): key is K {
  return Object.prototype.hasOwnProperty.call(map, key);
}

/** BR-30: the only source of the warehouse id these screens request. */
export function scopedWarehouseId(scope: AdminScope): string | null {
  return scope.warehouseId;
}

const TYPE_LABEL: Record<WarehouseTypeDto, TranslationKey> = {
  MAIN: 'admin.warehouseInfo.type.MAIN',
  SUB: 'admin.warehouseInfo.type.SUB',
};
const UNKNOWN_TYPE: TranslationKey = 'admin.warehouseInfo.type.unknown';

export function warehouseTypeLabelKey(type: string): TranslationKey {
  return has(TYPE_LABEL, type) ? TYPE_LABEL[type] : UNKNOWN_TYPE;
}

const ACTIVE: StatusMeta = { labelKey: 'admin.warehouseInfo.status.active', tone: 'success' };
const INACTIVE: StatusMeta = { labelKey: 'admin.warehouseInfo.status.inactive', tone: 'danger' };

function activeMeta(isActive: boolean): StatusMeta {
  return isActive ? ACTIVE : INACTIVE;
}

function optionalGrams(kg: string | null | undefined): Grams | null {
  return kg === null || kg === undefined ? null : parseKgToGrams(kg);
}

/* --------------------------- operating hours -------------------------- */

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const DAY_LABEL: Record<Weekday, TranslationKey> = {
  mon: 'admin.warehouseInfo.day.mon',
  tue: 'admin.warehouseInfo.day.tue',
  wed: 'admin.warehouseInfo.day.wed',
  thu: 'admin.warehouseInfo.day.thu',
  fri: 'admin.warehouseInfo.day.fri',
  sat: 'admin.warehouseInfo.day.sat',
  sun: 'admin.warehouseInfo.day.sun',
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface OperatingHoursRow {
  day: Weekday;
  dayLabelKey: TranslationKey;
  closed: boolean;
  open: string | null;
  close: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The BR-80 shape as seven rows, or null when the stored JSON is anything else. */
export function parseOperatingHours(raw: unknown): OperatingHoursRow[] | null {
  if (!isRecord(raw)) return null;
  const rows: OperatingHoursRow[] = [];
  for (const day of WEEKDAYS) {
    const entry = raw[day];
    if (!isRecord(entry)) return null;
    if (entry['closed'] === true) {
      rows.push({ day, dayLabelKey: DAY_LABEL[day], closed: true, open: null, close: null });
      continue;
    }
    const open = entry['open'];
    const close = entry['close'];
    if (entry['closed'] !== false || typeof open !== 'string' || typeof close !== 'string') return null;
    if (!HHMM.test(open) || !HHMM.test(close)) return null;
    rows.push({ day, dayLabelKey: DAY_LABEL[day], closed: false, open, close });
  }
  return rows;
}

/* ------------------------------ warehouse ----------------------------- */

export interface WarehouseInfo {
  id: string;
  code: string;
  name: string;
  typeLabelKey: TranslationKey;
  address: string | null;
  city: string | null;
  pincode: string | null;
  contactPhone: string | null;
  operatingHours: OperatingHoursRow[] | null;
  capacityGrams: Grams | null;
  isMarketDayVenue: boolean;
  status: StatusMeta;
}

export function toWarehouseInfo(dto: WarehouseDto): WarehouseInfo {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    typeLabelKey: warehouseTypeLabelKey(dto.type),
    address: dto.address ?? null,
    city: dto.city ?? null,
    pincode: dto.pincode ?? null,
    contactPhone: dto.contactPhone ?? null,
    operatingHours: parseOperatingHours(dto.operatingHours),
    capacityGrams: optionalGrams(dto.capacityKg),
    isMarketDayVenue: dto.isMarketDayVenue ?? false,
    status: activeMeta(dto.isActive),
  };
}

/* ------------------------------- capacity ----------------------------- */

export interface CapacityModel {
  capacityGrams: Grams | null;
  usedGrams: Grams;
  /** Negative when over capacity (never clamped, BR-66). */
  availableGrams: Grams | null;
  /** As rounded by the server (2 decimals); display only, never summed. */
  utilizationPercent: number | null;
  overCapacity: boolean;
}

export function toCapacity(dto: WarehouseCapacityDto): CapacityModel {
  const availableGrams = optionalGrams(dto.availableKg);
  return {
    capacityGrams: optionalGrams(dto.capacityKg),
    usedGrams: parseKgToGrams(dto.usedKg),
    availableGrams,
    utilizationPercent: dto.utilizationPercent,
    overCapacity: availableGrams !== null && availableGrams < 0,
  };
}

/* --------------------------- storage locations ------------------------ */

/** `undefined` = All (no `isActive` param). */
export const STORAGE_ACTIVE_FILTERS: readonly (boolean | undefined)[] = [undefined, true, false];

export interface StorageLocationRow {
  id: string;
  code: string;
  name: string;
  /** Free text, not an enum (OpenAPI). */
  locationType: string | null;
  capacityGrams: Grams | null;
  status: StatusMeta;
}

export function toStorageLocationRow(dto: StorageLocationDto): StorageLocationRow {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    locationType: dto.locationType,
    capacityGrams: optionalGrams(dto.capacityKg),
    status: activeMeta(dto.isActive),
  };
}
