/**
 * The Review step before a capacity change (design M15-05: Current / New /
 * Difference, then "Update warehouse capacity?"). Pure, so plain-Node vitest
 * covers it (tests/warehouse_management_m15.test.ts).
 *
 * Both capacity editors use it: Storage Capacity (storage-ops) and the Edit
 * capacity dialog of Warehouse Settings (profile-settings); each still parses
 * its own input and hands the parsed kg string in. Everything is integer grams
 * (money/quantity.ts), never a float. Nothing here compares the new capacity
 * with the stock: the server does not either (rules.md BR-66, "the new
 * capacity is not checked against current stock"), and BR-66e is why the
 * screens say a change never modifies inventory.
 */
import { t } from '../../../i18n';
import { formatKg, gramsToKgString, parseKgToGrams } from '../../../money/quantity';

export interface CapacityReview {
  currentLabel: string;
  newLabel: string;
  /** "+2,000 kg", "−2,580.5 kg", "No change", or the dash when there is nothing to compare with. */
  differenceLabel: string;
  /** The value to PATCH, in the API Quantity form (3 decimals). */
  newKg: string;
  /** The new value equals the current one: there is nothing to update. */
  unchanged: boolean;
}

/**
 * @param currentGrams the stored capacity: a number, null when none is set,
 *   undefined when it has not been read (shown as the dash, never as 0).
 * @param newKg the typed capacity after the screen's own parsing.
 * @returns null when `newKg` is not a weight above zero.
 */
export function capacityChangeReview(currentGrams: number | null | undefined, newKg: string): CapacityReview | null {
  const next = parseKgToGrams(newKg);
  if (next === null || next <= 0) return null;
  const unknown = t('capacityChange.review.unknown');
  const currentLabel =
    currentGrams === undefined ? unknown : currentGrams === null ? t('capacityChange.review.notSet') : formatKg(currentGrams);
  let differenceLabel = unknown;
  let unchanged = false;
  if (typeof currentGrams === 'number') {
    const diff = next - currentGrams;
    unchanged = diff === 0;
    differenceLabel =
      diff === 0
        ? t('capacityChange.review.noChange')
        : t(diff > 0 ? 'capacityChange.review.increase' : 'capacityChange.review.decrease', { kg: formatKg(Math.abs(diff)) });
  }
  return { currentLabel, newLabel: formatKg(next), differenceLabel, newKg: gramsToKgString(next), unchanged };
}
