/**
 * Wallet top-up via Razorpay, end to end (no UI):
 *
 *   1. `POST /wallets/me/topups` {amount, mode} + Idempotency-Key -> TopupIntent
 *      (`topupId`, `gatewayOrderId`, `razorpayKeyId`).
 *   2. Open the Razorpay checkout with that key/order (amount in integer paise,
 *      derived from the Money string -- no floats).
 *   3. The wallet is credited only by the server's signed `payment.captured`
 *      webhook; there is no client verify endpoint. So after the SDK reports
 *      success, poll `GET /wallets/me/topups/{topupId}` until SUCCESS/FAILED,
 *      or give up after `pollTimeoutMs` and report `pending` (the credit will
 *      still land; refetch the wallet later).
 *
 * Idempotency: one key per user action. A network retry of step 1 for the
 * same (amount, mode) reuses the key (the server replays the same intent);
 * once a flow reaches the SDK the key is released, so the next Pay tap is a
 * new top-up.
 *
 * Screen usage: `const topup = useWalletTopup(); topup.mutate({ amount, mode })`
 * then switch on `topup.data.status`; `topup.error` is an ApiError/NetworkError
 * from step 1 -> show with `mapProblem()` (./problem).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toPaise, type Money } from '@tohfa/shared-types';
import { openRazorpayCheckout, type RazorpayCheckoutInput, type RazorpayOutcome } from '../../../shell/payments/razorpay';
import {
  createTopup,
  fetchTopupReceipt,
  topupIdempotencyKeys,
  walletQueryKeys,
  type TopupIntent,
  type TopupMode,
  type TopupReceipt,
} from './wallet';

export type TopupOutcome =
  | { status: 'success'; intent: TopupIntent; receipt: TopupReceipt }
  /** Gateway or server said no. `receipt` present when the server marked it FAILED. */
  | { status: 'failed'; intent: TopupIntent; receipt?: TopupReceipt; reason: 'gateway' | 'server'; description?: string }
  | { status: 'cancelled'; intent: TopupIntent }
  /** SDK succeeded but the webhook has not landed within the poll window. */
  | { status: 'pending'; intent: TopupIntent; receipt?: TopupReceipt }
  /** The API returned no `razorpayKeyId` (payments not configured server-side). */
  | { status: 'unavailable'; intent: TopupIntent };

export interface StartTopupInput {
  amount: Money;
  mode: TopupMode;
  prefill?: RazorpayCheckoutInput['prefill'];
  /** Shown in the Razorpay sheet; pass a translated string. Defaults to 'TOHFA'. */
  merchantName?: string;
  description?: string;
}

export interface TopupDeps {
  createTopup: typeof createTopup;
  fetchTopupReceipt: typeof fetchTopupReceipt;
  openCheckout: (input: RazorpayCheckoutInput) => Promise<RazorpayOutcome>;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}

const defaultDeps: TopupDeps = {
  createTopup,
  fetchTopupReceipt,
  openCheckout: (input) => openRazorpayCheckout(input),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
  pollIntervalMs: 2000,
  pollTimeoutMs: 60000,
};

const METHOD_HINT: Record<TopupMode, string> = { UPI: 'upi', CARD: 'card', NETBANKING: 'netbanking' };

/**
 * Poll the receipt until it leaves PENDING or the window closes. A failed
 * poll request (offline blip) is retried on the next tick, not fatal.
 */
export async function pollTopupReceipt(
  topupId: string,
  deps: Pick<TopupDeps, 'fetchTopupReceipt' | 'sleep' | 'now' | 'pollIntervalMs' | 'pollTimeoutMs'>,
): Promise<{ final: boolean; receipt?: TopupReceipt }> {
  const deadline = deps.now() + deps.pollTimeoutMs;
  let last: TopupReceipt | undefined;
  for (;;) {
    try {
      last = await deps.fetchTopupReceipt(topupId);
      if (last.status !== 'PENDING') return { final: true, receipt: last };
    } catch {
      // transient; keep polling until the deadline
    }
    if (deps.now() + deps.pollIntervalMs > deadline) {
      return last === undefined ? { final: false } : { final: false, receipt: last };
    }
    await deps.sleep(deps.pollIntervalMs);
  }
}

export async function startWalletTopup(input: StartTopupInput, overrides: Partial<TopupDeps> = {}): Promise<TopupOutcome> {
  const deps: TopupDeps = { ...defaultDeps, ...overrides };
  const fingerprint = `${input.amount}|${input.mode}`;
  // Throws ApiError/NetworkError; the key stays cached so a retry replays it.
  const intent = await deps.createTopup(
    { amount: input.amount, mode: input.mode },
    topupIdempotencyKeys.keyFor(fingerprint),
  );
  // Intent exists server-side: this user action is done with its key.
  topupIdempotencyKeys.reset();

  if (intent.status === 'SUCCESS') {
    const receipt = await deps.fetchTopupReceipt(intent.topupId);
    return { status: 'success', intent, receipt };
  }
  if (intent.razorpayKeyId === undefined || intent.razorpayKeyId.length === 0) {
    return { status: 'unavailable', intent };
  }

  const sdkResult = await deps.openCheckout({
    keyId: intent.razorpayKeyId,
    orderId: intent.gatewayOrderId,
    amountPaise: toPaise(intent.amount),
    currency: intent.currency,
    name: input.merchantName ?? 'TOHFA',
    description: input.description,
    prefill: input.prefill,
    method: METHOD_HINT[input.mode],
  });

  if (sdkResult.status === 'cancelled') return { status: 'cancelled', intent };
  if (sdkResult.status === 'failed') {
    return { status: 'failed', intent, reason: 'gateway', description: sdkResult.description };
  }

  const polled = await pollTopupReceipt(intent.topupId, deps);
  if (!polled.final || polled.receipt === undefined) {
    return polled.receipt === undefined ? { status: 'pending', intent } : { status: 'pending', intent, receipt: polled.receipt };
  }
  return polled.receipt.status === 'SUCCESS'
    ? { status: 'success', intent, receipt: polled.receipt }
    : { status: 'failed', intent, receipt: polled.receipt, reason: 'server' };
}

/** TanStack mutation over `startWalletTopup`; refetches the wallet whatever the outcome. */
export const useWalletTopup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: StartTopupInput) => startWalletTopup(input),
    retry: 0,
    onSettled: () => queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallet }),
  });
};
