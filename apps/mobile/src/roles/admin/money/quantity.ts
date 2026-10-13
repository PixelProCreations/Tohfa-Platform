/**
 * Quantities: kilograms on the wire, integer grams in the app.
 *
 * docs/openapi.yaml Conventions: "Quantities are kilograms with 3 decimal
 * places", sent as decimal strings (e.g. `qtyKg: '-20.250'`). Like money, they
 * are converted to integers at the boundary so that summing stock lines never
 * drifts (0.1 + 0.2 kg is not 0.3 kg in floating point).
 */

export type Grams = number;

const KG_RE = /^-?\d+(\.\d{1,3})?$/;

export class QuantityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuantityError';
  }
}

/** Strict: `"12.345"` -> 12345. Throws on junk or more than 3 decimals. */
export function parseKgToGrams(input: string): Grams {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  if (!KG_RE.test(trimmed)) {
    throw new QuantityError(`malformed kg value: "${String(input)}"`);
  }
  const negative = trimmed.startsWith('-');
  const body = negative ? trimmed.slice(1) : trimmed;
  const [whole = '0', frac = ''] = body.split('.');
  const grams = Number(whole) * 1000 + Number(frac.padEnd(3, '0'));
  if (!Number.isSafeInteger(grams)) throw new QuantityError(`kg value out of range: "${input}"`);
  return negative ? -grams : grams;
}

/** Form-input variant: `null` instead of throwing; negatives refused. */
export function tryParseKgToGrams(input: string): Grams | null {
  try {
    const grams = parseKgToGrams(input);
    return grams < 0 ? null : grams;
  } catch {
    return null;
  }
}

/** Integer grams -> wire kg string with exactly 3 decimals. */
export function gramsToKgString(grams: Grams): string {
  if (!Number.isSafeInteger(grams)) {
    throw new QuantityError(`grams must be a safe integer, received ${String(grams)}`);
  }
  const negative = grams < 0;
  const abs = Math.abs(grams);
  const kg = `${Math.trunc(abs / 1000)}.${String(abs % 1000).padStart(3, '0')}`;
  return negative ? `-${kg}` : kg;
}

/** Display: trailing zeros trimmed (`2500` -> `"2.5"`, `3000` -> `"3"`). */
export function formatGramsAsKg(grams: Grams): string {
  return gramsToKgString(grams).replace(/\.?0+$/, '');
}
