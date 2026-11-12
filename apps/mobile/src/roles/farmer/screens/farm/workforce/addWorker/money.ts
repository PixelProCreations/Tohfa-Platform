import { isMoney, toPaise, type Money } from '@tohfa/shared-types';

/**
 * Rupee text from the wage input -> integer paise, or null when not a
 * positive amount.
 *
 * Inputs with at most two decimals (the only valid money shape) go through the
 * shared `Money`/`toPaise` string arithmetic, so no float multiply is involved.
 * Anything else (e.g. "450.005") keeps the legacy `Math.round(rupees * 100)`
 * path so the value sent for such input is unchanged.
 */
export function rupeesToPaise(raw: string): number | null {
  if (!raw.trim()) return null;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const rupees = Number(cleaned);
  if (isNaN(rupees) || rupees <= 0) return null;
  if (isMoney(cleaned)) return toPaise(cleaned as Money);
  return Math.round(rupees * 100);
}
