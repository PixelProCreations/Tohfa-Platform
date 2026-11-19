/**
 * The /fair-prices and /retail-prices DTOs -> the Market & Pricing view-models
 * (./pricingTypes.ts). Pure (no React), so plain-Node vitest covers every rule
 * (../tests/mappers_pricing.test.ts).
 *
 * Every mapper is an allow-list: it copies named fields only, so a field a
 * future server adds can never reach a screen (BR-16's principle). What the
 * API does not send stays null, never a demo value.
 *
 * Money (root CLAUDE.md 2.2): amounts stay `Money` strings. Every comparison
 * and difference is done on integer paise from the shared-types helpers; no
 * parseFloat, no Number() on an amount. The retail-vs-ceiling comparison is
 * for display only; BR-09 is enforced by the server (422 PRICE_ABOVE_CEILING).
 */
import { fromPaise, isMoney, parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import { formatPaise, parseRupeesToPaise } from '../money/paise';
import type { CreateRetailPriceBody, FairPriceCreateBody, FairPriceDto, RetailPriceDto } from './pricing';
import type {
  BulkCeilingDraftRow,
  CeilingComparison,
  CeilingHistoryRowView,
  CeilingWindowStatus,
  FairPriceRowView,
  MarkupBreakdownView,
  RetailDraftCheck,
  FairPriceFormValues,
  RetailPriceFormValues,
  RetailPriceRowView,
} from './pricingTypes';

// ---------------------------------------------------------------------------
// Money and dates
// ---------------------------------------------------------------------------

/** A well-formed money string as normalised Money ("120" -> "120.00"); null for anything else. */
export function toPricingMoney(value: unknown): Money | null {
  return typeof value === 'string' && isMoney(value) ? parseMoney(value) : null;
}

/** `price` against `ceiling` in integer paise; null when either is unknown. */
export function compareToCeiling(price: Money | null, ceiling: Money | null): CeilingComparison | null {
  if (price === null || ceiling === null) return null;
  const delta = toPaise(price) - toPaise(ceiling);
  const differencePaise = Math.abs(delta);
  return {
    position: delta > 0 ? 'above' : delta < 0 ? 'below' : 'at',
    differencePaise,
    difference: fromPaise(differencePaise),
  };
}

/** "₹1,250.50" / "₹60" through the admin money format; null stays null (render "not available"). */
export function formatPrice(money: Money | null): string | null {
  return money === null ? null : formatPaise(toPaise(money));
}

/**
 * India Standard Time is UTC+05:30 all year (no daylight saving). A fact about
 * the timezone, not a business threshold. Used instead of Intl's timeZone
 * option so the result does not depend on the JS engine's ICU data.
 */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

/** Today's calendar date in Asia/Kolkata (YYYY-MM-DD), the zone the server dates ceilings in. */
export function todayInIndia(now: Date = new Date()): string {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Where a ceiling window sits relative to `today` (all YYYY-MM-DD, so string
 * order is date order). effectiveTo is the last day the window applies.
 */
export function ceilingWindowStatus(effectiveFrom: string, effectiveTo: string | null, today: string): CeilingWindowStatus {
  if (effectiveFrom > today) return 'scheduled';
  if (effectiveTo !== null && effectiveTo < today) return 'historical';
  return 'current';
}

function textOrNull(value: string | null | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

// ---------------------------------------------------------------------------
// Fair price ceilings
// ---------------------------------------------------------------------------

/** One ceiling card; `today` is todayInIndia() (passed in so the mapper stays pure). */
export function toFairPriceRow(dto: FairPriceDto, today: string): FairPriceRowView {
  const effectiveTo = textOrNull(dto.effectiveTo);
  return {
    id: dto.id,
    cropId: dto.cropId,
    cropName: textOrNull(dto.cropName),
    grade: dto.grade,
    ceilingPrice: toPricingMoney(dto.ceilingPrice),
    frequency: dto.frequency ?? null,
    effectiveFrom: dto.effectiveFrom,
    effectiveTo,
    windowStatus: ceilingWindowStatus(dto.effectiveFrom, effectiveTo, today),
    setById: textOrNull(dto.setBy),
    notes: textOrNull(dto.notes),
    category: null,
    setByName: null,
    lastUpdatedAt: null,
    recentChanges: null,
    hasRetailPrice: null,
  };
}

function toHistoryRow(dto: FairPriceDto, today: string): CeilingHistoryRowView {
  const effectiveTo = textOrNull(dto.effectiveTo);
  return {
    id: dto.id,
    cropId: dto.cropId,
    cropName: textOrNull(dto.cropName),
    grade: dto.grade,
    priceType: 'FAIR_PRICE_CEILING',
    newCeiling: toPricingMoney(dto.ceilingPrice),
    previousCeiling: null,
    effectiveFrom: dto.effectiveFrom,
    effectiveTo,
    windowStatus: ceilingWindowStatus(dto.effectiveFrom, effectiveTo, today),
    setById: textOrNull(dto.setBy),
    notes: textOrNull(dto.notes),
    changedByName: null,
    recordedAt: null,
    validation: null,
    auditRef: null,
  };
}

/**
 * The loaded history (newest first, as the server sends it) as price-change
 * records. Each row's previousCeiling is the next older loaded row for the same
 * crop and grade; the oldest loaded one keeps null (its predecessor may be on a
 * page not loaded yet).
 */
export function toCeilingHistory(dtos: readonly FairPriceDto[], today: string): CeilingHistoryRowView[] {
  const rows = dtos.map((dto) => toHistoryRow(dto, today));
  return rows.map((row, i) => {
    const older = rows.slice(i + 1).find((r) => r.cropId === row.cropId && r.grade === row.grade);
    return older === undefined ? row : { ...row, previousCeiling: older.newCeiling };
  });
}

// ---------------------------------------------------------------------------
// Retail prices
// ---------------------------------------------------------------------------

export function toRetailPriceRow(dto: RetailPriceDto): RetailPriceRowView {
  const retailPrice = toPricingMoney(dto.price);
  const ceilingPrice = toPricingMoney(dto.ceilingPrice);
  return {
    id: dto.id,
    cropId: dto.cropId,
    cropName: textOrNull(dto.cropName),
    grade: dto.grade,
    retailPrice,
    ceilingPrice,
    markupPct: typeof dto.markupPct === 'number' ? dto.markupPct : null,
    gstInclusive: typeof dto.gstInclusive === 'boolean' ? dto.gstInclusive : null,
    effectiveFrom: dto.effectiveFrom,
    effectiveTo: textOrNull(dto.effectiveTo),
    ceilingComparison: compareToCeiling(retailPrice, ceilingPrice),
    category: null,
    reviewStatus: null,
    actionNote: null,
  };
}

/** The markup breakdown of one retail price: retail, ceiling and markup % only (no cost model exists). */
export function toMarkupBreakdown(dto: RetailPriceDto): MarkupBreakdownView {
  const row = toRetailPriceRow(dto);
  return {
    cropName: row.cropName,
    grade: row.grade,
    retailPrice: row.retailPrice,
    ceilingPrice: row.ceilingPrice,
    markupPct: row.markupPct,
    ceilingComparison: row.ceilingComparison,
    purchasePrice: null,
    expenses: null,
    customerDiscount: null,
    finalCustomerPrice: null,
  };
}

// ---------------------------------------------------------------------------
// Retail price edit drawer (pricing.retail_price.set, SUPER_ADMIN only)
// ---------------------------------------------------------------------------

/**
 * The live "within / above ceiling" line under the typed price. `ceiling` is
 * the row's ceilingPrice (never a constant). Display only: the server decides.
 */
export function retailDraftCheck(input: string, ceiling: Money | null): RetailDraftCheck {
  if (input.trim() === '') return { kind: 'empty' };
  const paise = parseRupeesToPaise(input);
  if (paise === null) return { kind: 'invalid' };
  const proposed = fromPaise(paise);
  const comparison = compareToCeiling(proposed, ceiling);
  return comparison === null ? { kind: 'noCeiling', proposed } : { kind: 'checked', proposed, comparison };
}

/**
 * The POST /retail-prices body, or null when the typed price is not a positive
 * amount with at most 2 decimals (the server would refuse it with 422).
 * Optional fields are sent only when set, so the server defaults apply.
 */
export function buildRetailPriceBody(form: RetailPriceFormValues): CreateRetailPriceBody | null {
  const paise = parseRupeesToPaise(form.priceInput);
  if (paise === null || paise <= 0) return null;
  return {
    cropId: form.cropId,
    grade: form.grade,
    price: fromPaise(paise),
    effectiveFrom: form.effectiveFrom,
    ...(form.markupPct === undefined ? {} : { markupPct: form.markupPct }),
    ...(form.gstInclusive === undefined ? {} : { gstInclusive: form.gstInclusive }),
  };
}

// ---------------------------------------------------------------------------
// Fair price ceiling writes (pricing.fair_price.set / .bulk_update, SA only)
// ---------------------------------------------------------------------------

/**
 * The POST /fair-prices body, or null when the typed amount is not a positive
 * rupee amount with at most 2 decimals (the server would refuse it with 422).
 * The amount goes through integer paise, never parseFloat (root CLAUDE.md 2.2).
 */
export function buildFairPriceBody(form: FairPriceFormValues): FairPriceCreateBody | null {
  const paise = parseRupeesToPaise(form.ceilingInput);
  if (paise === null || paise <= 0) return null;
  const notes = form.notes === undefined ? undefined : form.notes.trim();
  return {
    cropId: form.cropId,
    grade: form.grade,
    ceilingPrice: fromPaise(paise),
    effectiveFrom: form.effectiveFrom,
    ...(form.frequency === undefined ? {} : { frequency: form.frequency }),
    ...(notes === undefined || notes === '' ? {} : { notes }),
  };
}

/**
 * `percent` is a percentage, not money: the arithmetic is on integer paise and
 * the result is rounded to the nearest paisa, so a bulk +5% can never drift the
 * way `price * 1.05` on a float would. Never negative.
 */
export function applyPercentToPaise(paise: number, percent: number): number {
  return Math.max(0, Math.round((paise * (100 + percent)) / 100));
}

/** `ceiling` after `percent`; null stays null (an unreadable ceiling is never guessed). */
export function applyPercentToCeiling(ceiling: Money | null, percent: number): Money | null {
  return ceiling === null ? null : fromPaise(applyPercentToPaise(toPaise(ceiling), percent));
}

/**
 * The selected ceilings with the percentage applied, ready for the bulk list.
 * Every loaded row is returned so the screen can draw the unselected ones too.
 */
export function toBulkDraftRows(
  rows: readonly FairPriceRowView[],
  selectedIds: readonly string[],
  percent: number,
): BulkCeilingDraftRow[] {
  const selected = new Set(selectedIds);
  return rows.map((row) => ({
    row,
    selected: selected.has(row.id),
    proposedCeiling: applyPercentToCeiling(row.ceilingPrice, percent),
  }));
}

/**
 * The POST /fair-prices/bulk items for the selected rows, or null when nothing
 * is selected or a selected row has no readable ceiling to change (sending a
 * guessed amount would move a farmer's price on a guess).
 */
export function buildBulkFairPriceItems(
  drafts: readonly BulkCeilingDraftRow[],
  effectiveFrom: string,
): FairPriceCreateBody[] | null {
  const chosen = drafts.filter((d) => d.selected);
  if (chosen.length === 0) return null;
  const items: FairPriceCreateBody[] = [];
  for (const draft of chosen) {
    if (draft.proposedCeiling === null) return null;
    items.push({
      cropId: draft.row.cropId,
      grade: draft.row.grade,
      ceilingPrice: draft.proposedCeiling,
      effectiveFrom,
      ...(draft.row.frequency === null ? {} : { frequency: draft.row.frequency }),
    });
  }
  return items;
}
