/**
 * Pure decisions behind the produce screens: calendar grid, form parsing and
 * the KPI counts. No React, no react-native, so it is unit-tested in plain
 * Node (tests/produce_logic.test.ts).
 */
import type { CropMasterDto, PlatformEventListDto, ProduceCalendarDto } from '../../api/produce';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

/** The one placeholder for a value the backend does not supply yet. */
export const PRODUCE_DASH = ADMIN_NO_VALUE;

export interface YearMonth {
  year: number;
  /** 1..12 */
  month: number;
}

export function monthParam({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function dayParam({ year, month }: YearMonth, day: number): string {
  return `${monthParam({ year, month })}-${String(day).padStart(2, '0')}`;
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const zeroBased = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

export function yearMonthOf(isoDate: string): YearMonth {
  return { year: Number(isoDate.slice(0, 4)), month: Number(isoDate.slice(5, 7)) };
}

export function daysInMonth({ year, month }: YearMonth): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Monday-first grid cells: leading blanks, the days, trailing blanks to a full week. */
export function monthCells(ym: YearMonth): (number | null)[] {
  const firstWeekday = new Date(Date.UTC(ym.year, ym.month - 1, 1)).getUTCDay(); // 0 = Sunday
  const lead = (firstWeekday + 6) % 7;
  const cells: (number | null)[] = Array.from({ length: lead }, () => null);
  const total = daysInMonth(ym);
  for (let d = 1; d <= total; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export interface DayMarks {
  planting: boolean;
  growthStage: boolean;
  harvest: boolean;
}

/** Which recorded events fall on `isoDate` (harvest = a RECORDED harvest, never a forecast). */
export function dayMarks(calendar: ProduceCalendarDto | undefined, isoDate: string): DayMarks {
  const day = calendar?.days.find((d) => d.date === isoDate);
  return {
    planting: (day?.planting ?? 0) > 0,
    growthStage: (day?.growthStage ?? 0) > 0,
    harvest: (day?.harvest ?? 0) > 0,
  };
}

/** Cycle a dropdown: All (undefined) -> first option -> ... -> last -> All. */
export function nextOption<T extends string>(ids: readonly T[], current: T | undefined): T | undefined {
  if (ids.length === 0) return undefined;
  if (current === undefined) return ids[0];
  const idx = ids.indexOf(current);
  return idx < 0 || idx === ids.length - 1 ? undefined : ids[idx + 1];
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

function isRealDay(y: number, m: number, d: number): boolean {
  if (y < 1 || m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth({ year: y, month: m });
}

/** DD-MM-YYYY (the design's date format) to YYYY-MM-DD, or null when not a real day. */
export function parseDdMmYyyy(input: string): string | null {
  const m = /^\s*(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s*$/.exec(input);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (!isRealDay(y, mo, d)) return null;
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** "10:00", "10:00 AM", "1:30 pm" to 24-hour HH:MM, or null. */
export function parseClock(input: string): string | null {
  const m = /^\s*(\d{1,2}):(\d{2})\s*([AaPp][Mm])?\s*$/.exec(input);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const meridiem = m[3]?.toUpperCase();
  if (min > 59) return null;
  if (meridiem !== undefined) {
    if (h < 1 || h > 12) return null;
    if (meridiem === 'AM' && h === 12) h = 0;
    if (meridiem === 'PM' && h !== 12) h += 12;
  } else if (h > 23) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** A diary taxonomy key from a display name: lowercase letters, digits and "_" (farm-diary.schema.ts). */
export function taxonomyKeyFrom(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);
}

/** A crop_master slug from what was typed: lowercase letters, digits and "-" (crops.schema.ts). */
export function cropSlugFrom(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ---------------------------------------------------------------------------
// Crop taxonomy
// ---------------------------------------------------------------------------

/** The design's three category chips, and the seeded catalog slug each one means (db/seed/001_reference.sql). */
export const DESIGN_CROP_CATEGORIES = ['Vegetable', 'Fruit', 'Spice'] as const;
export type DesignCropCategory = (typeof DESIGN_CROP_CATEGORIES)[number];

export const CATEGORY_SLUG: Record<DesignCropCategory, string> = {
  Vegetable: 'vegetables',
  Fruit: 'fruits',
  Spice: 'spices',
};

export function designCategoryForSlug(slug: string | undefined): DesignCropCategory | undefined {
  return DESIGN_CROP_CATEGORIES.find((c) => CATEGORY_SLUG[c] === slug);
}

/** A category the crop filter offers: one per fetched catalog category, never a hardcoded list. */
export interface CropCategoryOption {
  id: string;
  slug: string;
  /** The category's own name, shown when it has no design label. */
  name: string;
  /** The design's label for the three seeded slugs, undefined for any other category. */
  design: DesignCropCategory | undefined;
}

/**
 * Filter options from GET /catalog/categories, in the API's order. Every
 * category is kept: the design's three are only the ones with a design label,
 * not the only ones that exist. Undefined (not loaded yet) gives no options.
 */
export function cropCategoryOptions(
  items: readonly { id: string; name: string; slug: string }[] | undefined,
): CropCategoryOption[] {
  return (items ?? []).map((c) => ({ id: c.id, slug: c.slug, name: c.name, design: designCategoryForSlug(c.slug) }));
}

export interface CropKpis {
  total: number;
  active: number;
  inactive: number;
}

export function cropKpis(items: readonly CropMasterDto[]): CropKpis {
  const active = items.filter((c) => c.isActive).length;
  return { total: items.length, active, inactive: items.length - active };
}

export function matchesSearch(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  return fields.some((f) => typeof f === 'string' && f.toLowerCase().includes(q));
}

// ---------------------------------------------------------------------------
// Platform events
// ---------------------------------------------------------------------------

export interface EventKpis {
  total: number;
  /** null when not every event is loaded, so a count would be a partial one. */
  upcoming: number | null;
  published: number | null;
  draft: number | null;
}

export function eventKpis(list: PlatformEventListDto, today: string): EventKpis {
  const complete = list.items.length >= list.total;
  if (!complete) return { total: list.total, upcoming: null, published: null, draft: null };
  const published = list.items.filter((e) => e.isPublished).length;
  return {
    total: list.total,
    upcoming: list.items.filter((e) => e.eventDate >= today).length,
    published,
    draft: list.items.length - published,
  };
}

export function countText(n: number | null | undefined): string {
  return typeof n === 'number' ? String(n) : PRODUCE_DASH;
}
