/**
 * Live data for Market & Pricing. Thin wrappers over ./hooks.ts; every
 * decision lives in ./pricing.ts, ./pricingMappers.ts or ./queryKeys.ts, which
 * are tested (hooks cannot be rendered in this app's plain-Node vitest).
 *
 * Every hook takes `{ enabled }` so a screen can skip the fetch (or the write)
 * when `can('pricing.fair_price.view')`, `can('pricing.retail_price.view')` or
 * `can('pricing.retail_price.set')` denies. The server still decides
 * (root CLAUDE.md 2.1); `enabled` only avoids a request that would be a 403.
 *
 * Idempotency: POST /retail-prices declares a required Idempotency-Key; one key
 * per logical write (same body), released by `finish()`.
 */
import { useMemo } from 'react';
import {
  createRetailPrice,
  getFairPriceHistory,
  listFairPrices,
  listRetailPrices,
  type CreateRetailPriceBody,
  type FairPriceDto,
  type FairPricePage,
  type PricingGrade,
  type RetailPriceDto,
  type RetailPricePage,
} from './pricing';
import { toCeilingHistory, toFairPriceRow, toRetailPriceRow, todayInIndia } from './pricingMappers';
import type { CeilingHistoryRowView, FairPriceRowView, RetailPriceRowView } from './pricingTypes';
import { useAdminMutation, useCursorList, useIdempotencyKey, type CursorList } from './hooks';
import { adminKeys, pricingKeys, PRICING_RETAIL_MODULE } from './queryKeys';

export interface PricingHookOptions {
  /** false: nothing is fetched (or sent) and nothing is loading. Default true. */
  enabled?: boolean | undefined;
}

function keepDto(dto: FairPriceDto): FairPriceDto {
  return dto;
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface FairPriceListFilters {
  cropId?: string | undefined;
  grade?: PricingGrade | undefined;
  /** YYYY-MM-DD; the server defaults to today. */
  effectiveOn?: string | undefined;
}

/** pricing.fair_price.view: the ceilings in force, page by page (BR-08). */
export function useFairPriceList(
  warehouseId: string | undefined,
  filters: FairPriceListFilters = {},
  options: PricingHookOptions = {},
): CursorList<FairPriceRowView, FairPricePage> {
  // The window status is relative to the day the screen opened; a refresh after
  // midnight keeps that day until the screen is reopened.
  const today = useMemo(() => todayInIndia(), []);
  const map = useMemo(() => (dto: FairPriceDto) => toFairPriceRow(dto, today), [today]);
  return useCursorList<FairPriceDto, FairPriceRowView, FairPricePage>(
    pricingKeys.fairList(warehouseId, filters),
    (cursor, signal) => listFairPrices({ ...filters, cursor }, signal),
    map,
    { enabled: options.enabled ?? true },
  );
}

export interface FairPriceHistoryFilters {
  grade?: PricingGrade | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

/**
 * pricing.fair_price.view: every ceiling window for one crop (and grade),
 * newest first. Without a cropId nothing is fetched: the server has no
 * cross-crop history.
 */
export function useFairPriceHistory(
  warehouseId: string | undefined,
  cropId: string | undefined,
  filters: FairPriceHistoryFilters = {},
  options: PricingHookOptions = {},
): CursorList<CeilingHistoryRowView, FairPricePage> {
  const enabled = cropId !== undefined && (options.enabled ?? true);
  const today = useMemo(() => todayInIndia(), []);
  const list = useCursorList<FairPriceDto, FairPriceDto, FairPricePage>(
    pricingKeys.fairHistory(warehouseId, { cropId, ...filters }),
    (cursor, signal) => getFairPriceHistory({ cropId: cropId ?? '', ...filters, cursor }, signal),
    keepDto,
    { enabled },
  );
  // previousCeiling needs the neighbouring rows, so the whole loaded list is mapped at once.
  const items = useMemo(() => toCeilingHistory(list.items, today), [list.items, today]);
  return { ...list, items };
}

export interface RetailPriceListFilters {
  cropId?: string | undefined;
  grade?: PricingGrade | undefined;
}

/** pricing.retail_price.view: the retail prices in force today, each with its ceiling (BR-09). */
export function useRetailPriceList(
  warehouseId: string | undefined,
  filters: RetailPriceListFilters = {},
  options: PricingHookOptions = {},
): CursorList<RetailPriceRowView, RetailPricePage> {
  return useCursorList<RetailPriceDto, RetailPriceRowView, RetailPricePage>(
    pricingKeys.retailList(warehouseId, filters),
    (cursor, signal) => listRetailPrices({ ...filters, cursor }, signal),
    toRetailPriceRow,
    { enabled: options.enabled ?? true },
  );
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

export interface LiveRetailPriceWrite {
  /** Runs the write; `onDone` fires after the server stored it. Ignored while one is in flight. */
  run: (body: CreateRetailPriceBody, onDone?: (result: RetailPriceDto) => void) => void;
  isPending: boolean;
  /**
   * The last failure, for adminErrorKey: PRICE_ABOVE_CEILING (BR-09a; read the
   * reported ceiling with priceAboveCeilingDetails), NOT_FOUND (no ceiling in
   * force), FORBIDDEN, VALIDATION_FAILED, CONFLICT.
   */
  error: unknown;
  /** Call once the edit is done (or abandoned), so the next one gets a fresh Idempotency-Key. */
  finish: () => void;
}

function notPermitted(): Promise<never> {
  return Promise.reject(new Error('Retail price write is not enabled for this caller.'));
}

/**
 * POST /retail-prices (pricing.retail_price.set, SUPER_ADMIN only). Build the
 * body with buildRetailPriceBody. A success refetches the retail list only.
 * With enabled=false the write is refused locally and nothing is sent.
 */
export function useCreateRetailPrice(options: PricingHookOptions = {}): LiveRetailPriceWrite {
  const enabled = options.enabled ?? true;
  const keys = useIdempotencyKey();
  const mutation = useAdminMutation<CreateRetailPriceBody, RetailPriceDto>({
    mutationFn: (body) => (enabled ? createRetailPrice(body, keys.keyFor(body)) : notPermitted()),
    invalidates: [adminKeys.module(PRICING_RETAIL_MODULE)],
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      run: (body: CreateRetailPriceBody, onDone?: (result: RetailPriceDto) => void) => {
        if (isPending) return;
        if (onDone === undefined) mutate(body);
        else mutate(body, { onSuccess: (result) => onDone(result) });
      },
      isPending,
      error,
      finish: () => {
        keys.reset();
        reset();
      },
    }),
    [mutate, isPending, error, reset, keys],
  );
}
