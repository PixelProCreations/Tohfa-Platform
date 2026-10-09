/**
 * Business thresholds the warehouse screens need before the server answers.
 *
 * WHY THIS FILE EXISTS: root CLAUDE.md §2.7 says business thresholds come from
 * `system_config`, never from a constant in a component. The API does not yet
 * expose `system_config` values to clients (spec gap, see SPEC_GAPS.md), so the
 * BR-19 default lives here, in ONE typed place, instead of inline in a screen.
 * When an endpoint exposes the cap, replace CASH_TOPUP_CAP_PAISE with the
 * fetched value; the screens already take the cap from this module.
 *
 * This is UX only. The server enforces BR-19 (topup.repo reads
 * system_config.cash_topup_cap and returns CASH_LIMIT_EXCEEDED) and is the
 * authority; this check just stops a cashier filling a form the server rejects.
 */
import { format, fromPaise, type Paise } from '@tohfa/shared-types';

/**
 * BR-19: maximum for a SINGLE cash top-up, in integer paise.
 * Mirrors system_config key `cash_topup_cap` (db/seed/001_reference.sql,
 * '10000.00' rupees). No per-day or per-customer cap exists; BR-19 forbids
 * inventing one. businessThresholds.test.ts fails if this drifts from the seed.
 */
export const CASH_TOPUP_CAP_PAISE: Paise = 1_000_000;

export type TopUpValidation =
  | { ok: true }
  | { ok: false; reason: 'INVALID_AMOUNT' | 'CASH_LIMIT_EXCEEDED' };

/** BR-19: a cash top-up must be a positive whole number of paise, at most the cap. */
export function validateTopUpAmount(
  amountPaise: Paise,
  capPaise: Paise = CASH_TOPUP_CAP_PAISE,
): TopUpValidation {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    return { ok: false, reason: 'INVALID_AMOUNT' };
  }
  if (amountPaise > capPaise) {
    return { ok: false, reason: 'CASH_LIMIT_EXCEEDED' };
  }
  return { ok: true };
}

/** The cap for display, e.g. "₹10,000" (whole rupees drop the ".00"). */
export function formatCashTopUpCap(capPaise: Paise = CASH_TOPUP_CAP_PAISE): string {
  return format(fromPaise(capPaise)).replace(/\.00$/, '');
}
