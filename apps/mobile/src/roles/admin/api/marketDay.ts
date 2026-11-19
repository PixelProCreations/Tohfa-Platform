/**
 * The market-day schedule, as far as the server actually models one.
 *
 * SPEC GAP, deliberately not papered over: docs/openapi.yaml has exactly one
 * market-day route, GET /admin/sales/market-day (sales.market_day.view), and
 * it is a read of ONE day's LIVE_MARKET allocation and sales (BR-95, BR-96) —
 * not a schedule. There is no endpoint that creates a market day, that turns
 * one on or off, or that lists scheduled market days with a date and opening
 * hours.
 *
 * What the server does hold is on the warehouse itself (db/migrations/0005):
 * `is_market_day_venue` and `market_day_of_week` (0-6), both readable through
 * GET /warehouses (warehouse.all.view). That is the real, live source for
 * "which warehouses hold a market day, and on which weekday", so the schedule
 * screen reads it instead of a fixture.
 *
 * Everything the design shows that has no source stays null here and renders
 * as the dash: the calendar date (there is only a recurring weekday), the
 * opening-hours range (`operatingHours` is stored JSON whose read shape the
 * spec does not define), and an enable/disable switch (no write exists).
 *
 * Pure (no React, no UI imports), so vitest covers it.
 */
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
