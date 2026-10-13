/**
 * Money at the admin boundary: API decimal strings -> integer paise, at once.
 *
 * Root CLAUDE.md §2.2: money is never a float. Every amount on the wire is a
 * decimal string (docs/openapi.yaml `Money`); screens convert it to integer
 * paise immediately and do all comparison/arithmetic on paise. These are thin
 * wrappers over `@tohfa/shared-types` money so there is one implementation of
 * the parsing rules, not two.
 */
import {
  format,
  fromPaise,
  MoneyError,
  parseMoney,
  toPaise,
  type Money,
  type Paise,
} from '@tohfa/shared-types';

export type { Money, Paise };

/**
 * Strict: `"1234.50"` -> 123450. Throws `MoneyError` on anything malformed or
 * with more than 2 decimals — an API value like that is a contract bug and
 * must surface, not be silently rounded.
 */
export function parseRupeesToPaise(input: string): Paise {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new MoneyError(`malformed money value: "${String(input)}"`);
  }
  return toPaise(parseMoney(input));
}

/**
 * Lenient form-input variant: trims, returns `null` instead of throwing, and
 * refuses negatives (no admin form takes a negative amount; direction is
 * always an explicit field such as CREDIT/DEBIT).
 */
export function tryParseRupeesToPaise(input: string): Paise | null {
  try {
    const paise = parseRupeesToPaise(input.trim());
    return paise < 0 ? null : paise;
  } catch {
    return null;
  }
}

/**
 * For the few payloads that carry money as a JSON number. Accepts it only when
 * it is exact to 2 decimals (`parseMoney` checks representability), so
 * `0.1 + 0.2` lands on exactly 30 paise and `1.234` throws.
 */
export function rupeesNumberToPaise(value: number): Paise {
  return toPaise(parseMoney(value));
}

/** Paise -> wire `Money` string, e.g. 500000 -> "5000.00". */
export function paiseToMoney(paise: Paise): Money {
  return fromPaise(paise);
}

/** Display only: `₹1,23,456.78`. Never parse the result back. */
export function formatPaise(paise: Paise): string {
  return format(fromPaise(paise));
}
