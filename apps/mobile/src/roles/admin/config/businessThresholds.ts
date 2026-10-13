/**
 * Business thresholds the admin UI needs BEFORE a submit.
 *
 * Root CLAUDE.md §2.7 / apps/mobile/CLAUDE.md: thresholds come from
 * `system_config`, not client constants. The cash top-up cap lives in
 * `system_config.cash_topup_cap` (db/seed/001_reference.sql, BR-19) and is
 * read server-side by apps/api/src/modules/topup — but NO endpoint exposes it
 * to clients (`GET /config/farmer` is farmer-only and does not carry it).
 *
 * SPECIFICATION GAP (reported, not invented): until an endpoint exposes it,
 * this constant is a UX-ONLY guard — it lets the form warn before submit.
 * It is never the enforcement: the server rejects above-cap top-ups with 422
 * `CASH_LIMIT_EXCEEDED` whatever this says, and the screen must still handle
 * that error. businessThresholds.test.ts fails if the seed value drifts.
 */
import type { Paise } from '../money/paise';

/** Rs 10,000.00 — mirror of `system_config.cash_topup_cap` (BR-19). */
export const CASH_TOPUP_CAP_PAISE: Paise = 1_000_000;

/** BR-19: the cap is inclusive — exactly Rs 10,000 is allowed. */
export function exceedsCashTopupCap(amountPaise: Paise): boolean {
  return amountPaise > CASH_TOPUP_CAP_PAISE;
}
