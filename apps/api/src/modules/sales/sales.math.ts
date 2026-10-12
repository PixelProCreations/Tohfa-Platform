/**
 * SWA Module 6: the pure arithmetic of a sale. No I/O, no floats on money.
 *
 *  - Weights are handled as INTEGER GRAMS (Quantity has at most 3 decimals, so 1 g is exact).
 *  - Money is handled as INTEGER PAISE through the shared `Money` helpers (CLAUDE.md 2.2).
 *  - Products of two integers that can exceed 2^53 (grams x paise) go through BigInt.
 *  - GST is computed ONCE per invoice on the subtotal, rounded half up (BR-98, BR-98c).
 */
import { fromPaise, toPaise, type Money } from '@tohfa/shared-types';

const KG_RE = /^(\d{1,9})(?:\.(\d{1,3}))?$/;

/** "1.25" -> 1250. Throws on anything that is not a non-negative kg decimal with <= 3 places. */
export function kgToGrams(kg: string): number {
  const match = KG_RE.exec(kg.trim());
  if (match === null) throw new Error(`not a kg quantity: "${kg}"`);
  const whole = Number(match[1]);
  const frac = Number((match[2] ?? '').padEnd(3, '0'));
  return whole * 1000 + frac;
}

/** 1250 -> "1.250". */
export function gramsToKg(grams: number): string {
  if (!Number.isSafeInteger(grams) || grams < 0) throw new Error(`grams must be a non-negative integer, got ${grams}`);
  return `${Math.trunc(grams / 1000)}.${String(grams % 1000).padStart(3, '0')}`;
}

/** round_half_up(numerator / denominator) for non-negative BigInts. */
function divHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

/** Paise for `grams` of a product priced `unitPaise` per kg, rounded half up to the paisa. */
export function amountForGramsPaise(unitPaise: number, grams: number): number {
  const result = divHalfUp(BigInt(unitPaise) * BigInt(grams), 1000n);
  return Number(result);
}

/**
 * The GST rate as integer basis points of a percent (5 -> 500, 2.5 -> 250), read from the
 * system_config jsonb value. Returns null for anything that is not a rate in [0, 100) with at most
 * 2 decimals, so the caller can fall back to the documented default and log it (BR-98i).
 */
export function parseRateBasisPoints(value: unknown): number | null {
  let text: string;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    text = String(value);
  } else if (typeof value === 'string') {
    text = value.trim();
  } else {
    return null;
  }
  const match = /^(\d{1,2})(?:\.(\d{1,2}))?$/.exec(text);
  if (match === null) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

/** 500 -> "5", 250 -> "2.5", 1234 -> "12.34", 0 -> "0" (docs/openapi.yaml SaleQuote.gstRatePercent). */
export function formatRate(basisPoints: number): string {
  const whole = Math.trunc(basisPoints / 100);
  const frac = basisPoints % 100;
  if (frac === 0) return String(whole);
  return `${whole}.${String(frac).padStart(2, '0').replace(/0$/, '')}`;
}

/**
 * BR-98: gst = round_half_up(subtotal_paise * rate_percent / 100), once per invoice.
 * With the rate in basis points of a percent that is round_half_up(subtotal * bp / 10000).
 */
export function gstPaise(subtotalPaise: number, rateBasisPoints: number): number {
  return Number(divHalfUp(BigInt(subtotalPaise) * BigInt(rateBasisPoints), 10000n));
}

export interface PricedLineInput {
  unitPrice: Money;
  grams: number;
}

export interface Totals {
  lineTotals: Money[];
  subtotal: Money;
  gst: Money;
  total: Money;
}

/** Line totals (informational, they sum to the subtotal exactly), subtotal, GST and total. */
export function computeTotals(lines: readonly PricedLineInput[], rateBasisPoints: number): Totals {
  const linePaise = lines.map((line) => amountForGramsPaise(toPaise(line.unitPrice), line.grams));
  const subtotalPaise = linePaise.reduce((acc, p) => acc + p, 0);
  const gst = gstPaise(subtotalPaise, rateBasisPoints);
  return {
    lineTotals: linePaise.map(fromPaise),
    subtotal: fromPaise(subtotalPaise),
    gst: fromPaise(gst),
    total: fromPaise(subtotalPaise + gst),
  };
}

export interface SellableBatch {
  batchId: string;
  allocationId: string | null;
  sellableGrams: number;
}

export interface Draw {
  batchId: string;
  allocationId: string | null;
  grams: number;
}

/**
 * FEFO draw (BR-95e): `batches` MUST already be in FEFO order (earliest expiry first). Takes
 * from each in turn until `requestedGrams` is covered. Returns null when the batches cannot
 * cover it, so the caller can refuse with SALE_STOCK_CHANGED.
 */
export function drawFefo(batches: readonly SellableBatch[], requestedGrams: number): Draw[] | null {
  const draws: Draw[] = [];
  let remaining = requestedGrams;
  for (const batch of batches) {
    if (remaining === 0) break;
    if (batch.sellableGrams <= 0) continue;
    const take = Math.min(batch.sellableGrams, remaining);
    draws.push({ batchId: batch.batchId, allocationId: batch.allocationId, grams: take });
    remaining -= take;
  }
  return remaining === 0 ? draws : null;
}

/**
 * Splits a line total across its draws so the parts sum to the line total exactly: each part is
 * the price of the cumulative weight up to and including it minus the price of the weight before
 * it. No paisa is lost or invented however the line spans batches.
 */
export function splitLineAcrossDraws(unitPrice: Money, draws: readonly Draw[]): Money[] {
  const unitPaise = toPaise(unitPrice);
  let cumulative = 0;
  let previousPaise = 0;
  return draws.map((draw) => {
    cumulative += draw.grams;
    const upTo = amountForGramsPaise(unitPaise, cumulative);
    const part = upTo - previousPaise;
    previousPaise = upTo;
    return fromPaise(part);
  });
}

/**
 * BR-92: `*` for every character but the last four digits. A value of four characters or fewer
 * is masked fully (docs/openapi.yaml MaskedMobile).
 */
export function maskMobile(mobile: string): string {
  if (mobile.length <= 4) return '*'.repeat(Math.max(mobile.length, 1));
  return `${'*'.repeat(mobile.length - 4)}${mobile.slice(-4)}`;
}
