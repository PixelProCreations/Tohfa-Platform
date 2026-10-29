/**
 * Pure rupee <-> integer-paise helpers for the admin screens (no react-native
 * import, so vitest can run them).
 *
 * WHY: root CLAUDE.md 2.2 forbids float money. Screens hold amounts as rupee
 * `number`s (fixtures, props) and as typed strings; everything that compares or
 * subtracts must go through integer paise first, via the shared-types Money
 * helpers, so `0.1 + 0.2` and `500.5 - 320.25` can never drift.
 */
import { format, fromPaise, MoneyError, parseMoney, toPaise, type Paise } from '@tohfa/shared-types';

export { fromPaise };

// Digits with optional Indian/western grouping commas, then at most 2 decimals.
// No sign, no bare ".5" / "5.": a cashier typing those is more likely mistyping.
const RUPEE_INPUT_RE = /^\d+(\.\d{1,2})?$/;

/**
 * Parse a typed rupee string ("500", "500.5", "₹1,250.25") into integer paise.
 * Returns null for empty, garbage, negative or more than 2 decimals, so callers
 * can tell "nothing valid typed" from a real zero.
 */
export function parseRupeesToPaise(input: string): Paise | null {
  const cleaned = input.replace(/₹/g, '').replace(/,/g, '').trim();
  if (!RUPEE_INPUT_RE.test(cleaned)) return null;
  const paise = toPaise(parseMoney(cleaned));
  return Number.isSafeInteger(paise) ? paise : null;
}

/**
 * Convert a rupee `number` (a fixture or a prop typed as number) to integer
 * paise. This is the one boundary where a float is allowed in; parseMoney
 * rounds to the nearest paisa and throws if the number is not a 2-dp amount.
 */
export function rupeesNumberToPaise(rupees: number): Paise {
  try {
    return toPaise(parseMoney(rupees));
  } catch (e) {
    if (e instanceof MoneyError) throw e;
    throw new MoneyError(`not a rupee amount: ${String(rupees)}`);
  }
}

/** "₹21,980.50"; whole-rupee amounts drop the ".00" ("₹300"), matching the old formatRupees look. */
export function formatPaise(paise: Paise): string {
  return format(fromPaise(paise)).replace(/\.00$/, '');
}
