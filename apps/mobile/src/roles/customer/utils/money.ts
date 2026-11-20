/**
 * Customer money and quantity helpers. All arithmetic is on integers (paise
 * for money, grams for kg) so a price times a quantity never drifts the way
 * `69.5 * 1.5` does in floating point. Rendering of money reuses the shared
 * `format()` from @tohfa/shared-types (Indian grouping, rupee sign).
 */
import { format, fromPaise, parseMoney, type Money } from '@tohfa/shared-types';

/**
 * docs/openapi.yaml `Quantity`: kilograms as a decimal string with up to 3
 * decimals (e.g. `"1.500"`). shared-types has no type for it, so it lives here.
 */
export type Quantity = string;

const QTY_RE = /^(\d{1,9})(?:\.(\d{1,3}))?$/;
const MONEY_RE = /^(-?)(\d+)(?:\.(\d{1,2}))?$/;

/** Integer paise of a decimal money string, or null when malformed. */
export function moneyToPaise(money: string): number | null {
  const m = MONEY_RE.exec(money.trim());
  if (m === null) return null;
  const paise = Number(m[2]) * 100 + Number((m[3] ?? '').padEnd(2, '0'));
  return m[1] === '-' ? -paise : paise;
}

/** Integer grams of a kg quantity string, or null when malformed / negative. */
export function qtyToGrams(qty: string): number | null {
  const m = QTY_RE.exec(qty.trim());
  if (m === null) return null;
  return Number(m[1]) * 1000 + Number((m[2] ?? '').padEnd(3, '0'));
}

/** `"1.500"` from 1500 grams (always 3 decimals, as the API sends quantities). */
export function gramsToQty(grams: number): Quantity {
  const g = Math.max(0, Math.round(grams));
  return `${Math.trunc(g / 1000)}.${String(g % 1000).padStart(3, '0')}`;
}

/**
 * `pricePerKg x qtyKg`, rounded half-up to the paisa (the server's rule).
 * Integer maths: paise * grams / 1000. Malformed input yields `0.00`.
 */
export function multiplyMoney(pricePerKg: string, qtyKg: string): Money {
  const paise = moneyToPaise(pricePerKg);
  const grams = qtyToGrams(qtyKg);
  if (paise === null || grams === null) return fromPaise(0);
  const negative = paise < 0;
  const absPaise = Math.abs(paise);
  const product = absPaise * grams;
  let rounded: number;
  if (Number.isSafeInteger(product)) {
    rounded = Math.floor((product + 500) / 1000);
  } else {
    rounded = Number((BigInt(absPaise) * BigInt(grams) + 500n) / 1000n);
  }
  return fromPaise(negative ? -rounded : rounded);
}

/** Sum of money strings in paise; malformed entries count as zero. */
export function sumMoney(values: readonly string[]): Money {
  return fromPaise(values.reduce((acc, v) => acc + (moneyToPaise(v) ?? 0), 0));
}

/** `a - b` in paise (malformed values count as zero). */
export function subtractMoney(a: string, b: string): Money {
  return fromPaise((moneyToPaise(a) ?? 0) - (moneyToPaise(b) ?? 0));
}

/** `"₹1,234.50"`. Falls back to `₹<raw>` for a value that is not a money string. */
export function formatRupees(money: string | null | undefined, options: { symbol?: boolean } = {}): string {
  if (money === null || money === undefined) return '';
  try {
    return format(parseMoney(money), { symbol: options.symbol ?? true });
  } catch {
    return `${options.symbol === false ? '' : '₹'}${money}`;
  }
}

/** `"1.5 kg"`, `"2 kg"`, `"0.25 kg"`: trailing zeros trimmed. */
export function formatKg(qty: string | null | undefined, unit = 'kg'): string {
  if (qty === null || qty === undefined) return '';
  const grams = qtyToGrams(qty);
  if (grams === null) return `${qty} ${unit}`;
  const whole = Math.trunc(grams / 1000);
  const frac = String(grams % 1000).padStart(3, '0').replace(/0+$/, '');
  return `${whole}${frac.length > 0 ? `.${frac}` : ''} ${unit}`;
}

export interface KgStepOptions {
  /** Step in kg (decimal string). Default `'0.5'`. */
  step?: string;
  /** Minimum in kg. Default = step. */
  min?: string;
  /** Maximum in kg (e.g. a cart line's `availableKg`). Default unbounded. */
  max?: string | null;
}

function stepBounds(options: KgStepOptions): { step: number; min: number; max: number | null } {
  const step = qtyToGrams(options.step ?? '0.5') ?? 500;
  const min = options.min === undefined ? step : (qtyToGrams(options.min) ?? step);
  const max = options.max === undefined || options.max === null ? null : qtyToGrams(options.max);
  return { step: Math.max(1, step), min, max };
}

/** Clamp `qty` into `[min, max]`; returns a 3-decimal string. */
export function clampKg(qty: string, options: KgStepOptions = {}): Quantity {
  const { min, max } = stepBounds(options);
  const grams = qtyToGrams(qty) ?? min;
  let out = Math.max(min, grams);
  if (max !== null) out = Math.min(out, max);
  return gramsToQty(out);
}

/** One step up (`+1`) or down (`-1`) from `qty`, clamped to `[min, max]`. */
export function stepKg(qty: string, direction: 1 | -1, options: KgStepOptions = {}): Quantity {
  const { step, min, max } = stepBounds(options);
  const grams = qtyToGrams(qty) ?? min;
  let next = grams + direction * step;
  next = Math.max(min, next);
  if (max !== null) next = Math.min(next, max);
  return gramsToQty(next);
}

/** True when another `+step` would still be within `max`. */
export function canStepUp(qty: string, options: KgStepOptions = {}): boolean {
  const { step, max } = stepBounds(options);
  const grams = qtyToGrams(qty);
  if (grams === null) return false;
  return max === null || grams + step <= max;
}

/** True when another `-step` would stay at or above `min`. */
export function canStepDown(qty: string, options: KgStepOptions = {}): boolean {
  const { step, min } = stepBounds(options);
  const grams = qtyToGrams(qty);
  if (grams === null) return false;
  return grams - step >= min;
}
