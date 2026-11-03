/**
 * Exact cost maths for LogFertigationScreen (BR-56f, root CLAUDE.md §2.2).
 *
 * The screen used to do `Math.round(parseFloat(qty) * pricePerUnit)`, which both
 * rounded to whole rupees (0.35 kg x Rs 12 = Rs 4.20 was sent as "4.00") and
 * inherited IEEE-754 drift (4.1 x Rs 123.45 = 506.145 lands on 506.14 in float
 * maths). Here the quantity never becomes a float: it is kept as a decimal string,
 * scaled to integer hundredths, multiplied by the price in integer paise using
 * BigInt, and rounded once, half-up, to the paisa.
 *
 * Rounding: rules.md has no rounding rule for crop input cost. Half-up to the
 * paisa is the convention BR-98 uses for GST and the one `multiply()` in
 * @tohfa/shared-types documents; it is used here as an ASSUMPTION pending owner
 * confirmation.
 */
import { toPaise, type Money } from '@tohfa/shared-types';

/**
 * A crop input quantity as the farmer types it: digits with at most 2 decimals and
 * at most 8 integer digits, because `crop_inputs.quantity` is numeric(10,2)
 * (BR-56a: anything larger is a 422 at the API schema). No sign, no exponent.
 */
const QUANTITY_RE = /^(\d{0,8})(?:\.(\d{1,2}))?$/;

/**
 * Largest `costInr` the API accepts: `CropInputCost` in docs/openapi.yaml allows at
 * most 8 integer digits because `crop_inputs.cost_inr` is numeric(10,2). This is a
 * column limit mirrored from the contract, not a business threshold.
 */
export const COST_INR_MAX = '99999999.99' as Money;

/** The trimmed quantity string when it is a valid, positive BR-56a quantity; otherwise null. */
export function parseQuantity(input: string): string | null {
  const trimmed = input.trim();
  const match = QUANTITY_RE.exec(trimmed);
  if (!match) return null;
  const whole = match[1] ?? '';
  const frac = match[2] ?? '';
  if (whole === '' && frac === '') return null;
  if (hundredths(whole, frac) <= 0n) return null;
  return trimmed;
}

/**
 * `quantity x pricePerUnit` as Money, exact to the paisa (half-up), or null when the
 * quantity is not a valid BR-56a quantity.
 */
export function computeCostInr(quantity: string, pricePerUnit: Money): Money | null {
  const parsed = parseQuantity(quantity);
  if (parsed === null) return null;
  const match = QUANTITY_RE.exec(parsed)!;
  const qtyHundredths = hundredths(match[1] ?? '', match[2] ?? '');
  // product is in (paise x 1/100); divide by 100 with half-up rounding (both operands are non-negative).
  const product = qtyHundredths * BigInt(toPaise(pricePerUnit));
  const paise = (product + 50n) / 100n;
  return formatPaise(paise);
}

/** True when `cost` fits the `costInr` column (see COST_INR_MAX). */
export function isWithinCostLimit(cost: Money): boolean {
  return toPaise(cost) <= toPaise(COST_INR_MAX);
}

/** A quantity's integer and fraction digits as exact integer hundredths. */
function hundredths(whole: string, frac: string): bigint {
  return BigInt(whole === '' ? '0' : whole) * 100n + BigInt(frac.padEnd(2, '0'));
}

/** Non-negative BigInt paise as a 2dp Money string (no safe-integer ceiling, unlike `fromPaise`). */
function formatPaise(paise: bigint): Money {
  const rupees = paise / 100n;
  const rest = paise % 100n;
  return `${rupees.toString()}.${rest.toString().padStart(2, '0')}` as Money;
}
