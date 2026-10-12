/**
 * Display glue shared by the listing screens: turns the pure helpers in
 * api/listings.ts into localized strings. Money is always rendered from its
 * string form via `formatMoneyAmount` (never parsed to a float), quantities via
 * `formatKg`, dates in IST.
 */
import { t, type TranslationKey } from '../../../../i18n/farmer';
import { formatMoneyAmount } from '../../api/wallet';
import {
  computeRemainingTime,
  countdownParts,
  formatKg,
  GRADE_LABEL_KEY,
  LISTING_STATUS_LABEL_KEY,
  listingDateParts,
  type Grade,
  type ListingStatus,
} from '../../api/listings';

/** The helpers in api/listings.ts type i18n keys as `string`; this narrows them for `t()`. */
export function tk(key: string): TranslationKey {
  return key as TranslationKey;
}

export function statusLabel(status: ListingStatus): string {
  return t(tk(LISTING_STATUS_LABEL_KEY[status]));
}

export function gradeLabel(grade: Grade): string {
  return t(tk(GRADE_LABEL_KEY[grade]));
}

/** "₹40.00/kg" */
export function pricePerKgLabel(price: string): string {
  return t('farmer.listings.common.perKg', { price: formatMoneyAmount(price) });
}

/** "150 kg" */
export function kgLabel(quantity: string): string {
  return t('farmer.listings.common.kg', { qty: formatKg(quantity) });
}

/** A Money total, or the neutral dash when it could not be computed. */
export function moneyOrDash(amount: string | null): string {
  return amount === null ? t('farmer.listings.common.dash') : formatMoneyAmount(amount);
}

/** "14 Jul" */
export function shortDateLabel(iso: string): string {
  const parts = listingDateParts(iso);
  if (parts === null) return t('farmer.listings.common.dash');
  return t('farmer.listings.common.shortDate', { day: parts.day, month: t(tk(parts.monthKey)) });
}

/** "09 Jul 2026" */
export function fullDateLabel(iso: string): string {
  const parts = listingDateParts(iso);
  if (parts === null) return t('farmer.listings.common.dash');
  return t('farmer.listings.common.fullDate', {
    day: parts.day,
    month: t(tk(parts.monthKey)),
    year: parts.year,
  });
}

/** "22h 30m" until a server `expiresAt` (BR-10: the window is the server's, not the device's). */
export function timeLeftLabel(expiresAt: string, nowMs: number): string {
  const { remainingMs } = computeRemainingTime(expiresAt, nowMs, 0, 0);
  const { hours, minutes } = countdownParts(remainingMs);
  return t('farmer.listings.common.hoursMinutes', { hours, minutes });
}
