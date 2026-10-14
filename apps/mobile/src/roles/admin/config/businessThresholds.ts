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

/**
 * BR-26 / `transfer.high_value.approve` (SUPER_ADMIN only): quantity in kg at
 * or above which an inter-warehouse transfer needs Super Admin sign-off before
 * it dispatches.
 *
 * SPEC GAP (SPEC_GAPS W4w-1): the threshold is UNDEFINED in system_config.
 * rbac.json says "threshold undefined", docs/rules.md BR-26 defines none and
 * db/seed/001_reference.sql has no key for it, so this is NOT a mirrored
 * business value: it is the old screen literal (InitiateNewTransferScreen
 * `qty >= 1000`) moved here so no component holds it. The unit (kg vs rupee
 * value) is unconfirmed too. businessThresholds.test.ts fails once a seed key
 * appears, so it gets replaced by the seeded value. UX only: there is no
 * transfer endpoint yet (BR-26 scope: deferred); the server must decide.
 */
export const HIGH_VALUE_TRANSFER_THRESHOLD_KG = 1_000;

/**
 * True when a transfer of `quantityKg` must be routed to Super Admin approval:
 * it reaches the threshold and the initiator does not hold
 * `transfer.high_value.approve` (a Super Admin dispatches directly).
 */
export function transferNeedsApproval(
  quantityKg: number,
  canApproveHighValue: boolean,
  thresholdKg: number = HIGH_VALUE_TRANSFER_THRESHOLD_KG,
): boolean {
  return quantityKg >= thresholdKg && !canApproveHighValue;
}

/** The transfer threshold for display, e.g. "1,000 kg". */
export function formatTransferThreshold(thresholdKg: number = HIGH_VALUE_TRANSFER_THRESHOLD_KG): string {
  return `${thresholdKg.toLocaleString('en-IN')} kg`;
}
