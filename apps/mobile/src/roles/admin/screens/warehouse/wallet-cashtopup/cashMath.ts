/**
 * Pure money logic for the Daily Cash reconciliation (no react-native import so
 * vitest can run it). All arithmetic is in integer paise.
 */
import type { Paise } from '@tohfa/shared-types';
import { parseRupeesToPaise, rupeesNumberToPaise } from '../../../money/paise';

/**
 * Expected closing cash. The day figures are whole-rupee mock fixtures
 * (DailyCashScreen); they are converted to paise here, at the boundary, and
 * summed as integers.
 */
export function expectedClosingPaise(a: {
  openingRupees: number;
  directSalesRupees: number;
  cashTopUpsRupees: number;
  expensesRupees: number;
}): Paise {
  return (
    rupeesNumberToPaise(a.openingRupees) +
    rupeesNumberToPaise(a.directSalesRupees) +
    rupeesNumberToPaise(a.cashTopUpsRupees) -
    rupeesNumberToPaise(a.expensesRupees)
  );
}

/**
 * Counted cash vs expected, in paise. The typed value is decimal rupees
 * ("21,980.50" is 2,198,050 paise). Unparseable input counts as zero, as it did
 * before, but `valid` is false so the caller can tell it from a real count of 0.
 */
export function reconcileCash(
  actualInput: string,
  expectedPaise: Paise,
): { actualPaise: Paise; differencePaise: Paise; valid: boolean } {
  const parsed = parseRupeesToPaise(actualInput);
  const actualPaise = parsed ?? 0;
  return { actualPaise, differencePaise: actualPaise - expectedPaise, valid: parsed !== null };
}
