/**
 * Display helpers shared by the Super Admin overview screens (approvals inbox,
 * finance & business, warehouse & operations). No react-native import, so
 * plain-Node vitest can run it.
 *
 * Money arrives as the API decimal string and goes through integer paise
 * before it is formatted (root CLAUDE.md 2.2), never through a float. Anything
 * that is not a valid amount is the dash, not "0": an unknown figure must not
 * read as a real zero.
 */
import { isMoney, parseMoney, toPaise, type Paise } from '@tohfa/shared-types';
import { formatPaise } from '../../money/paise';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

/** "₹18,000" from an API Money string; the dash for anything that is not one. */
export function moneyText(value: unknown): string {
  if (typeof value !== 'string' || !isMoney(value)) return ADMIN_NO_VALUE;
  try {
    return formatPaise(toPaise(parseMoney(value)));
  } catch {
    return ADMIN_NO_VALUE;
  }
}

/** "₹18,000" from integer paise. */
export function paiseText(paise: Paise): string {
  return formatPaise(paise);
}

/** A whole count as text; the dash for anything that is not a count (never "0" for an unknown). */
export function countText(value: unknown): string {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? String(value) : ADMIN_NO_VALUE;
}
