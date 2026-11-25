/**
 * Market & Pricing reads, plus the one write the ported design needs
 * (docs/openapi.yaml, apps/api/src/modules/pricing):
 *   GET  /fair-prices            pricing.fair_price.view    (BR-07, BR-08)
 *   GET  /fair-prices/history    pricing.fair_price.view    (cropId required, BR-08)
 *   GET  /retail-prices          pricing.retail_price.view  (BR-09)
 *   POST /retail-prices          pricing.retail_price.set   (SUPER_ADMIN only, BR-09)
 *
 *   POST /fair-prices            pricing.fair_price.set         (BR-08)
 *   POST /fair-prices/bulk       pricing.fair_price.bulk_update (BR-08)
 *
 * The two ceiling writes are SUPER_ADMIN only in docs/rbac.json; the screens
 * that use them (Update Fair Price, Bulk Price Update) now exist, so the
 * clients live here with the reads rather than beside one screen.
 *
 * Every list is cursor paged (`{ items, page }`), default 20, max 100.
 * Money arrives as a 2-dp decimal string (`Money`) and is never turned into a
 * float here (root CLAUDE.md 2.2).
 *
 * Idempotency: the spec declares a required Idempotency-Key on POST
 * /retail-prices, POST /fair-prices and POST /fair-prices/bulk, so the client
 * always sends one. As of this writing the pricing route does not read it
 * (pricing.routes.ts has no idempotency handling); sending it costs nothing
 * and is correct once the server honours it.
 *
 * No UI imports, so any admin area can reuse it.
 */
import { isMoney, parseMoney, type ErrorCode, type GenericProblemCode, type Money } from '@tohfa/shared-types';
import { ApiError } from '../../../shell/api/client';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

/**
 * pricing.schema.ts `gradeEnum`. NOT the shared-types `Grade` enum (A/B/C/REJECT),
 * which does not match what the pricing API accepts.
 */
export const PRICING_GRADES = ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'] as const;
export type PricingGrade = (typeof PRICING_GRADES)[number];

/** BR-08: how often a ceiling is meant to be reviewed; stored, not enforced. */
export const FAIR_PRICE_FREQUENCIES = ['DAILY', 'WEEKLY'] as const;
export type FairPriceFrequency = (typeof FAIR_PRICE_FREQUENCIES)[number];

/** docs/openapi.yaml `FairPrice`. Optional members are optional in the spec. */
export interface FairPriceDto {
  id: string;
  cropId: string;
  cropName?: string | undefined;
  grade: PricingGrade;
  ceilingPrice: Money | string;
  frequency?: FairPriceFrequency | undefined;
  /** YYYY-MM-DD. */
  effectiveFrom: string;
  /** YYYY-MM-DD; null while the window is open. */
  effectiveTo?: string | null | undefined;
  /** The setter's user id (a uuid, not a name). */
  setBy?: string | null | undefined;
  notes?: string | null | undefined;
}

export type FairPricePage = Page<FairPriceDto>;

/**
 * docs/openapi.yaml `FairPriceCreate`. Build it with buildFairPriceBody
 * (pricingMappers.ts) so the amount is never a float (root CLAUDE.md 2.2).
 */
export interface FairPriceCreateBody {
  cropId: string;
  grade: PricingGrade;
  /** > 0, at most 2 decimals. BR-07: every listing is bounded by this. */
  ceilingPrice: Money | string;
  /** Server default WEEKLY (BR-08). */
  frequency?: FairPriceFrequency | undefined;
  /** YYYY-MM-DD. Posting a window closes the open one the day before (BR-08). */
  effectiveFrom: string;
  /** At most 300 characters. */
  notes?: string | undefined;
}

/** docs/openapi.yaml: the 200 body of POST /fair-prices/bulk. */
export interface BulkFairPriceResult {
  applied: number;
  items: FairPriceDto[];
}

/** docs/openapi.yaml `RetailPrice`. */
export interface RetailPriceDto {
  id: string;
  cropId: string;
  cropName?: string | undefined;
  grade: PricingGrade;
  price: Money | string;
  /** The ceiling in force for the crop and grade (BR-09). */
  ceilingPrice?: Money | string | undefined;
  markupPct?: number | null | undefined;
  gstInclusive?: boolean | undefined;
  effectiveFrom: string;
  effectiveTo?: string | null | undefined;
}

export type RetailPricePage = Page<RetailPriceDto>;

export interface ListFairPricesParams {
  cropId?: string | undefined;
  grade?: PricingGrade | undefined;
  /** YYYY-MM-DD; the server defaults to today (Asia/Kolkata). */
  effectiveOn?: string | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

export interface FairPriceHistoryParams {
  /** Required by the server: there is no cross-crop history. */
  cropId: string;
  grade?: PricingGrade | undefined;
  /** YYYY-MM-DD. */
  from?: string | undefined;
  /** YYYY-MM-DD. */
  to?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListRetailPricesParams {
  cropId?: string | undefined;
  grade?: PricingGrade | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/** docs/openapi.yaml `RetailPriceCreate`. Build it with buildRetailPriceBody (pricingMappers.ts). */
export interface CreateRetailPriceBody {
  cropId: string;
  grade: PricingGrade;
  /** > 0, at most 2 decimals, at or below the ceiling in force on effectiveFrom (BR-09a). */
  price: Money | string;
  /** 0-200; a percentage, not money. */
  markupPct?: number | undefined;
  /** Server default true. */
  gstInclusive?: boolean | undefined;
  /** YYYY-MM-DD. */
  effectiveFrom: string;
}

/** API validation limit (pricing.schema.ts), not a business threshold. */
export const PRICING_LIST_MAX_LIMIT = 100;

/** docs/openapi.yaml `maxItems` on POST /fair-prices/bulk: a request-size limit, not a business threshold. */
export const FAIR_PRICE_BULK_MAX_ITEMS = 500;

/** Problem codes these routes document or the service throws. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'PRICE_ABOVE_CEILING',
  'INTERNAL',
];

/** The current ceilings (effective on `effectiveOn`, default today), cursor paged. */
export function listFairPrices(params: ListFairPricesParams = {}, signal?: AbortSignal): Promise<FairPricePage> {
  return adminGet<FairPricePage>(
    '/fair-prices',
    {
      cropId: params.cropId,
      grade: params.grade,
      effectiveOn: params.effectiveOn,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

/** Every ceiling window for one crop (and grade), newest first. */
export function getFairPriceHistory(params: FairPriceHistoryParams, signal?: AbortSignal): Promise<FairPricePage> {
  return adminGet<FairPricePage>(
    '/fair-prices/history',
    {
      cropId: params.cropId,
      grade: params.grade,
      from: params.from,
      to: params.to,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

/** The retail prices in force today, each with its ceiling, cursor paged. */
export function listRetailPrices(params: ListRetailPricesParams = {}, signal?: AbortSignal): Promise<RetailPricePage> {
  return adminGet<RetailPricePage>(
    '/retail-prices',
    { cropId: params.cropId, grade: params.grade, cursor: params.cursor, limit: params.limit },
    signal,
  );
}

/**
 * Sets a retail price (201 with the RetailPrice). 422 PRICE_ABOVE_CEILING when
 * it exceeds the ceiling (BR-09a; read the reported ceiling with
 * priceAboveCeilingDetails), 404 when no ceiling is in force on effectiveFrom,
 * 403 for anyone without pricing.retail_price.set.
 */
export function createRetailPrice(body: CreateRetailPriceBody, idempotencyKey: string): Promise<RetailPriceDto> {
  return adminPost<RetailPriceDto>('/retail-prices', body, { idempotencyKey });
}

/**
 * Sets a fair price ceiling (201 with the FairPrice). BR-08: SUPER_ADMIN only,
 * so anyone else is 403; an overlapping window for the same crop and grade is
 * 409, and a malformed amount or date 422.
 */
export function createFairPrice(body: FairPriceCreateBody, idempotencyKey: string): Promise<FairPriceDto> {
  return adminPost<FairPriceDto>('/fair-prices', body, { idempotencyKey });
}

/**
 * Bulk ceiling update (200 with `applied` and the stored rows). All-or-nothing:
 * one invalid row rejects the whole batch and the server reports it per index
 * in `Problem.errors`. BR-08: SUPER_ADMIN only (pricing.fair_price.bulk_update).
 */
export function bulkUpsertFairPrices(
  items: readonly FairPriceCreateBody[],
  idempotencyKey: string,
): Promise<BulkFairPriceResult> {
  return adminPost<BulkFairPriceResult>('/fair-prices/bulk', { items }, { idempotencyKey });
}

export interface PriceAboveCeilingDetails {
  ceilingPrice: Money;
  attemptedPrice: Money;
}

/**
 * The ceiling and the refused price from a 422 PRICE_ABOVE_CEILING
 * (pricing.service.ts puts both in `meta`), so the drawer can show the real
 * ceiling. Null for any other failure, or when either value is malformed.
 */
export function priceAboveCeilingDetails(err: unknown): PriceAboveCeilingDetails | null {
  if (!(err instanceof ApiError) || err.problem.code !== 'PRICE_ABOVE_CEILING') return null;
  const ceiling = err.problem.meta?.['ceilingPrice'];
  const attempted = err.problem.meta?.['attemptedPrice'];
  if (!isMoney(ceiling) || !isMoney(attempted)) return null;
  return { ceilingPrice: parseMoney(ceiling), attemptedPrice: parseMoney(attempted) };
}
