/**
 * Cart arithmetic (BR-22, root CLAUDE.md 2.2, D-01). Pure, no I/O, no float ever touches money.
 *
 *  - Quantities are INTEGER GRAMS (Quantity has at most 3 decimals, so 1 g is exact).
 *  - Prices are INTEGER PAISE per kg, through the shared Money helpers.
 *  - line total = round_half_up(unit_paise * grams / 1000), via BigInt in sales.math, the same
 *    formula the counter sale uses, so a line never drifts by a paisa.
 *  - subtotal = the integer sum of the line totals; checkout (orders.pricing) sums the very same
 *    stored line totals, so the cart subtotal and the order subtotal are equal by construction.
 */
import { fromPaise, parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import { amountForGramsPaise, kgToGrams } from '../sales/sales.math.js';

/** Grams for a kg decimal string ("1.25" -> 1250), or null when it is not a valid quantity. */
export function qtyGrams(qtyKg: string): number | null {
  try {
    return kgToGrams(qtyKg);
  } catch {
    return null;
  }
}

/** Line total for `qtyKg` of a product priced `unitPrice` (per kg), rounded half-up to the paisa. */
export function cartLineTotal(unitPrice: string, qtyKg: string): Money {
  const grams = kgToGrams(qtyKg);
  return fromPaise(amountForGramsPaise(toPaise(parseMoney(unitPrice)), grams));
}

/** Sum of line totals in integer paise. */
export function cartSubtotal(lineTotals: readonly string[]): Money {
  return fromPaise(lineTotals.reduce((acc, line) => acc + toPaise(parseMoney(line)), 0));
}
