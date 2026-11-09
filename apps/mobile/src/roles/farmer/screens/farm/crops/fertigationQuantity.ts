/**
 * Client-side quantity check for LogFertigationScreen (BR-56a).
 *
 * The quantity stays the decimal string the farmer typed; it is only turned
 * into a JSON number at the POST, because the API contract types `quantity`
 * as a number (numeric(10,2), not money). Validating the string first means
 * nothing that the column would reject (more than 2 decimals, more than 8
 * integer digits, zero, a sign or an exponent) is ever sent.
 */

/** Digits with at most 2 decimals and at most 8 integer digits: `crop_inputs.quantity` is numeric(10,2). */
const QUANTITY_RE = /^(\d{0,8})(?:\.(\d{1,2}))?$/;

/** The trimmed quantity string when it is a valid, positive BR-56a quantity; otherwise null. */
export function parseQuantity(input: string): string | null {
  const trimmed = input.trim();
  const match = QUANTITY_RE.exec(trimmed);
  if (!match) return null;
  const whole = match[1] ?? '';
  const frac = match[2] ?? '';
  if (whole === '' && frac === '') return null;
  // Positive check on the digits themselves, so no float is involved.
  if (/^0*$/.test(whole) && /^0*$/.test(frac)) return null;
  return trimmed;
}
