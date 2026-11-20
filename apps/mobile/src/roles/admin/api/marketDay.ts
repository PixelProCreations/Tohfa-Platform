/**
 * The market-day schedule. Two sources, deliberately kept apart:
 *
 * 1. The DATED SCHEDULE (`/admin/market-days`, permission
 *    `market.schedule.manage`, enforced router-wide at
 *    apps/api/src/modules/market-days/market-days.routes.ts). One row per
 *    warehouse per calendar date, with opening hours, an active flag and
 *    notes:
 *      GET   /admin/market-days        list (optional warehouseId / from / to)
 *      POST  /admin/market-days        create
 *      PATCH /admin/market-days/{id}   change hours, active flag or notes
 *    The list answers a PLAIN ARRAY, not the `{ items, page }` envelope every
 *    other admin list uses (market-days.service.ts `list` returns
 *    `MarketDayResponse[]`), so there is nothing to page here.
 *
 * 2. The RECURRING VENUE FLAG on the warehouse itself (db/migrations/0005):
 *    `is_market_day_venue` and `market_day_of_week` (0-6), read through GET
 *    /warehouses (warehouse.all.view). That is "which warehouses hold a market
 *    day, and on which weekday" — a recurring fact, not a dated occurrence.
 *
 * The two do not substitute for each other: a venue flag says a warehouse
 * holds market days, a market-day row says one happens on a given date. A
 * screen that needs one must read that one, never infer it from the other.
 *
 * On a venue row, what the warehouse read does not carry stays null and
 * renders as the dash: the calendar date and the opening-hours range
 * (`operatingHours` is stored JSON whose read shape the spec does not define).
 *
 * Pure (no React, no UI imports), so vitest covers it.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import { adminGet, adminPatch, adminPost } from './http';
import type { WarehouseDto } from './warehouses';

/** One row of the market day schedule. Null means "the API has no value for this". */
export interface MarketDayVenueView {
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;
  /** 0 = Sunday … 6 = Saturday, as `market_day_of_week` stores it; null when unset. */
  dayOfWeek: number | null;
  /** Whether the warehouse is flagged as a market day venue. */
  isMarketDayVenue: boolean;
  isActive: boolean;
  /** Not in the API: the schedule is a recurring weekday, not dated occurrences. */
  calendarDate: null;
  /** Not in the API: no specified opening-hours shape on a warehouse read. */
  timeRange: null;
}

function toVenue(dto: WarehouseDto): MarketDayVenueView {
  const day = dto.marketDayOfWeek;
  return {
    warehouseId: dto.id,
    warehouseName: dto.name,
    warehouseCode: dto.code,
    dayOfWeek: typeof day === 'number' && Number.isInteger(day) && day >= 0 && day <= 6 ? day : null,
    isMarketDayVenue: dto.isMarketDayVenue === true,
    isActive: dto.isActive,
    calendarDate: null,
    timeRange: null,
  };
}

/**
 * The market day venues among `rows`, weekday first (unset weekdays last),
 * then by name. A warehouse that is not a market day venue is left out: it has
 * no market day to show.
 */
export function toMarketDayVenues(rows: readonly WarehouseDto[]): MarketDayVenueView[] {
  return rows
    .map(toVenue)
    .filter((v) => v.isMarketDayVenue)
    .sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        if (a.dayOfWeek === null) return 1;
        if (b.dayOfWeek === null) return -1;
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.warehouseName.localeCompare(b.warehouseName);
    });
}

// ---------------------------------------------------------------------------
// The dated schedule: /admin/market-days (market.schedule.manage, BR-162)
// ---------------------------------------------------------------------------

/**
 * docs/openapi.yaml `MarketDay` (apps/api market-days.schema.ts
 * `marketDayResponseSchema`). Optional members are optional in the spec.
 */
export interface MarketDayDto {
  id: string;
  warehouseId: string;
  warehouseName?: string | undefined;
  /** YYYY-MM-DD. */
  marketDate: string;
  /** HH:MM or HH:MM:SS. */
  startTime: string;
  endTime: string;
  isActive: boolean;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml `MarketDayCreate`. */
export interface MarketDayCreateBody {
  warehouseId: string;
  /** YYYY-MM-DD. */
  marketDate: string;
  /** HH:MM or HH:MM:SS; the server refuses startTime >= endTime with 422. */
  startTime: string;
  endTime: string;
  /** Server default true. */
  isActive?: boolean | undefined;
  /** At most 1000 characters; null clears it. */
  notes?: string | null | undefined;
}

/** docs/openapi.yaml `MarketDayPatch`: at least one field, or the server answers 422. */
export interface MarketDayPatchBody {
  startTime?: string | undefined;
  endTime?: string | undefined;
  isActive?: boolean | undefined;
  notes?: string | null | undefined;
}

export interface ListMarketDaysParams {
  warehouseId?: string | undefined;
  /** YYYY-MM-DD. */
  from?: string | undefined;
  /** YYYY-MM-DD. */
  to?: string | undefined;
}

/** Problem codes these routes document or the service throws. */
export const MARKET_DAY_ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'INTERNAL',
];

/**
 * The scheduled market days (200). A PLAIN ARRAY, not `{ items, page }`: the
 * route has no cursor, so every matching row comes back in one answer.
 */
export function listMarketDays(params: ListMarketDaysParams = {}, signal?: AbortSignal): Promise<MarketDayDto[]> {
  return adminGet<MarketDayDto[]>(
    '/admin/market-days',
    { warehouseId: params.warehouseId, from: params.from, to: params.to },
    signal,
  );
}

/**
 * Schedules a market day (201 with the MarketDay). 404 when the warehouse does
 * not exist, 422 when startTime is not before endTime or a field is malformed,
 * 403 without market.schedule.manage. The spec declares no Idempotency-Key on
 * this route (it moves no money), so none is sent.
 */
export function createMarketDay(body: MarketDayCreateBody): Promise<MarketDayDto> {
  return adminPost<MarketDayDto>('/admin/market-days', body);
}

/**
 * Changes an existing market day (200 with the MarketDay). 404 when the id is
 * unknown, 422 on an empty patch or when the resulting startTime is not before
 * endTime.
 */
export function patchMarketDay(id: string, body: MarketDayPatchBody): Promise<MarketDayDto> {
  return adminPatch<MarketDayDto>(`/admin/market-days/${encodeURIComponent(id)}`, body);
}
