/**
 * Live data for the payout approval screens. Thin wrappers over ./hooks.ts;
 * every decision lives in ./payouts.ts (tested).
 *
 * Idempotency (root CLAUDE.md 2.4): one Idempotency-Key per (payout, note)
 * until `finish()`, so a retry after a dropped response replays the same key
 * and the server records the approval once. `finish()` runs after a success so
 * the next approval starts fresh; a failure keeps the key on purpose.
 *
 * Every hook takes `{ enabled }` so a screen can skip the fetch (or refuse the
 * write locally) when `can(...)` denies. The server still decides (root
 * CLAUDE.md 2.1).
 */
import { useMemo } from 'react';
import {
  approvePayout,
  listPayouts,
  PAYOUT_AWAITING_STATUS,
  payoutApproveFingerprint,
  type ApprovePayoutBody,
  type PayoutDto,
  type PayoutListPage,
} from './payouts';
import { useAdminMutation, useAdminQuery, useIdempotencyKey } from './hooks';
import { adminKeys } from './queryKeys';

export const PAYOUTS_MODULE = 'payouts';
/** The Finance & Business overview's own module key (its dues tile and payout card). */
const SA_FINANCE_MODULE = 'saFinance';

export interface PayoutsHookOptions {
  /** false: nothing is fetched (or sent). Default true. */
  enabled?: boolean | undefined;
}

/** payout.view: the payout waiting longest for its second approval, or undefined when none is. */
export function useAwaitingPayout(options: PayoutsHookOptions = {}) {
  const enabled = options.enabled ?? true;
  const query = useAdminQuery<PayoutListPage>(
    adminKeys.scoped(PAYOUTS_MODULE, undefined, { resource: 'awaiting' }),
    (signal) => listPayouts({ status: PAYOUT_AWAITING_STATUS, limit: 1 }, signal),
    { enabled },
  );
  return { payout: query.data?.items[0], isLoading: enabled && query.isPending, error: query.error };
}

export interface PayoutApproval {
  /** Sends the approval; `onDone` gets the server's `Payout`. Ignored while one is in flight. */
  run: (payoutId: string, body: ApprovePayoutBody, onDone?: (payout: PayoutDto) => void) => void;
  isPending: boolean;
  /** The last failure, for adminErrorKey; null after a success or finish(). */
  error: unknown;
  /** Call when the action is done or abandoned, so the next one gets a fresh Idempotency-Key. */
  finish: () => void;
}

interface Vars {
  payoutId: string;
  body: ApprovePayoutBody;
}

/** payout.approve_above_10k: POST /admin/payouts/{id}/approve. Refetches every payout and finance read. */
export function useApprovePayout(options: PayoutsHookOptions = {}): PayoutApproval {
  const enabled = options.enabled ?? true;
  const keys = useIdempotencyKey();
  const mutation = useAdminMutation<Vars, PayoutDto>({
    mutationFn: ({ payoutId, body }) =>
      enabled
        ? approvePayout(payoutId, body, keys.keyFor(payoutApproveFingerprint(payoutId, body)))
        : Promise.reject(new Error('Payout approval is not enabled for this caller.')),
    invalidates: [adminKeys.module(PAYOUTS_MODULE), adminKeys.module(SA_FINANCE_MODULE)],
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      run: (payoutId: string, body: ApprovePayoutBody, onDone?: (payout: PayoutDto) => void) => {
        if (isPending) return;
        mutate(
          { payoutId, body },
          {
            onSuccess: (payout) => {
              keys.reset();
              onDone?.(payout);
            },
          },
        );
      },
      isPending,
      error,
      finish: () => {
        keys.reset();
        reset();
      },
    }),
    [mutate, isPending, error, reset, keys],
  );
}
