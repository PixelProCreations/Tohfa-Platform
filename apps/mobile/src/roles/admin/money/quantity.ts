/**
 * Weights as integer grams for the admin screens (no react-native import, so
 * vitest can run it).
 *
 * WHY: the API carries weight as `Quantity`, a kg decimal string with at most
 * 3 places (docs/openapi.yaml components.schemas.Quantity), for the same reason
 * Money is a string. 3 kg places is exactly 1 gram, so whole grams hold every
 * value the API can send. Converting once at the boundary means stock sums and
 * comparisons are integer maths and can never drift the way `0.1 + 0.2` does.
 * The parse is done on the digits as text, never through parseFloat.
 */
import { t } from '../i18n';

/** The API Quantity pattern, plus grouping commas a person may type. */
const KG_RE = /^(-?)(\d{1,9})(?:\.(\d{1,3}))?$/;

/**
 * "12.345" -> 12345. Accepts the API Quantity form (optionally signed, for
 * ledger deltas) and typed input with spaces or grouping commas. Returns null
 * for anything else (empty, more than 3 decimals, exponents, units), so a
 * caller can tell "nothing valid typed" from a real zero. Screens that take a
 * weight from a person must still check the result is greater than zero.
 */
export function parseKgToGrams(input: string): number | null {
  const match = KG_RE.exec(input.trim().replace(/,/g, ''));
  if (match === null) return null;
  const [, sign = '', whole = '0', fraction = ''] = match;
  const grams = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
  if (!Number.isSafeInteger(grams)) return null;
  return sign === '-' && grams !== 0 ? -grams : grams;
}

function assertGrams(grams: number): void {
  if (!Number.isSafeInteger(grams)) throw new RangeError(`not a whole number of grams: ${String(grams)}`);
}

function splitGrams(grams: number): { negative: boolean; kg: string; fraction: string } {
  assertGrams(grams);
  const abs = Math.abs(grams);
  return {
    negative: grams < 0,
    kg: String(Math.floor(abs / 1000)),
    fraction: String(abs % 1000).padStart(3, '0'),
  };
}

/** 12345 -> "12.345": the API Quantity form, always 3 decimals. Throws on a non-integer. */
export function gramsToKgString(grams: number): string {
  const { negative, kg, fraction } = splitGrams(grams);
  return `${negative ? '-' : ''}${kg}.${fraction}`;
}

/** Indian digit grouping: last 3 digits, then groups of 2 ("12,34,567"). */
function groupIndian(digits: string): string {
  if (digits.length <= 3) return digits;
  const head = digits.slice(0, -3);
  const tail = digits.slice(-3);
  return `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${tail}`;
}

/**
 * 1250000 -> "1,250 kg", 12350 -> "12.35 kg". The same look as the screens'
 * existing `kg.toLocaleString('en-IN') + ' kg'` (Indian grouping, up to 3
 * decimals, trailing zeros dropped), but from integer grams and without
 * relying on Intl, whose locale data varies on Hermes.
 */
export function formatKg(grams: number): string {
  return t('unit.kg', { value: formatKgNumber(grams) });
}

/** 1250000 -> "1,250", 12350 -> "12.35": formatKg without the unit, for a figure whose label already says kg. */
export function formatKgNumber(grams: number): string {
  const { negative, kg, fraction } = splitGrams(grams);
  const trimmed = fraction.replace(/0+$/, '');
  return `${negative ? '-' : ''}${groupIndian(kg)}${trimmed ? `.${trimmed}` : ''}`;
}
