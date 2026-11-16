/**
 * Pure decisions behind the listing approval queue (no react-native import,
 * so plain-Node vitest covers them: tests/listings_admin_logic.test.ts).
 *
 * Access is by rbac.json code only (root CLAUDE.md 2.1); a missing `can`
 * denies everything. Money is Money from integer paise (root CLAUDE.md 2.2):
 * a typed price goes through parseRupeesToPaise -> fromPaise, never a float.
 */
import { fromPaise, toPaise, type Money } from '@tohfa/shared-types';
import {
  COUNTER_MESSAGE_MAX,
  REJECT_REASON_MAX,
  REJECT_REASON_MIN,
  type ApproveListingBody,
  type CounterOfferBody,
  type ListingGrade,
  type ListingQueueRow,
  type RejectListingBody,
  type RejectReasonCode,
} from '../../api/listings';
import { formatPaise, parseRupeesToPaise } from '../../money/paise';
import type { Can } from '../../permissions/can';

export const LISTING_CODES = {
  view: 'listing.queue.view_pending',
  approve: 'listing.approve',
  reject: 'listing.reject',
  counter: 'listing.counter_offer.send',
} as const;

export interface ListingAccess {
  view: boolean;
  approve: boolean;
  reject: boolean;
  counter: boolean;
}

export function listingAccess(can: Can | undefined): ListingAccess {
  const has = (code: string) => typeof can === 'function' && can(code);
  return {
    view: has(LISTING_CODES.view),
    approve: has(LISTING_CODES.approve),
    reject: has(LISTING_CODES.reject),
    counter: has(LISTING_CODES.counter),
  };
}

/** The design's grade tabs: All, Grade 1, Grade 2, Grade 3. */
export const GRADE_TABS = ['ALL', 'GRADE_1', 'GRADE_2', 'GRADE_3'] as const;
export type GradeTab = (typeof GRADE_TABS)[number];

/**
 * The API has no grade filter on GET /admin/listings, so the tabs filter the
 * rows loaded so far (as the design's tabs filtered its list).
 */
export function filterByGrade(rows: readonly ListingQueueRow[], tab: GradeTab): ListingQueueRow[] {
  return tab === 'ALL' ? [...rows] : rows.filter((r) => r.grade === tab);
}

/** "80.000" -> "80", "12.500" -> "12.5": trims zeros as text. */
export function formatQuantityKg(quantity: string | null): string | null {
  if (quantity === null) return null;
  if (!/^\d+(\.\d+)?$/.test(quantity)) return quantity;
  return quantity.includes('.') ? quantity.replace(/0+$/, '').replace(/\.$/, '') : quantity;
}

/** "₹41.50" / "₹40" (whole rupees drop .00, the admin money format); null stays null. */
export function formatPerKg(money: Money | null): string | null {
  return money === null ? null : formatPaise(toPaise(money));
}

/** The spec requires a destination warehouse; without one there is nothing to send. */
export function approveBody(warehouseId: string | undefined): ApproveListingBody | null {
  return typeof warehouseId === 'string' && warehouseId.trim() !== '' ? { warehouseId: warehouseId.trim() } : null;
}

export interface RejectDraft {
  reasonCode: RejectReasonCode | null;
  reason: string;
}

export type RejectCheck =
  | { ok: true; body: RejectListingBody }
  | { ok: false; errors: { reasonCode?: true; reason?: true } };

export function validateRejectDraft(draft: RejectDraft): RejectCheck {
  const reason = draft.reason.trim();
  const errors: { reasonCode?: true; reason?: true } = {};
  if (draft.reasonCode === null) errors.reasonCode = true;
  if (reason.length < REJECT_REASON_MIN || reason.length > REJECT_REASON_MAX) errors.reason = true;
  if (draft.reasonCode === null || errors.reason) return { ok: false, errors };
  return { ok: true, body: { reasonCode: draft.reasonCode, reason } };
}

export interface CounterDraft {
  price: string;
  quantity: string;
  message: string;
}

export type CounterCheck =
  | { ok: true; body: CounterOfferBody }
  | { ok: false; errors: { price?: true; quantity?: true; message?: true } };

const QUANTITY_RE = /^\d+(\.\d{1,3})?$/;

export function validateCounterDraft(draft: CounterDraft): CounterCheck {
  const paise = parseRupeesToPaise(draft.price);
  const quantity = draft.quantity.trim();
  const message = draft.message.trim();
  const errors: { price?: true; quantity?: true; message?: true } = {};
  if (paise === null || paise <= 0) errors.price = true;
  if (!QUANTITY_RE.test(quantity) || !/[1-9]/.test(quantity)) errors.quantity = true;
  if (message.length > COUNTER_MESSAGE_MAX) errors.message = true;
  if (paise === null || paise <= 0 || errors.quantity || errors.message) return { ok: false, errors };
  const body: CounterOfferBody = { pricePerKg: fromPaise(paise), quantityKg: quantity };
  if (message !== '') body.message = message;
  return { ok: true, body };
}

export type { ListingGrade };
