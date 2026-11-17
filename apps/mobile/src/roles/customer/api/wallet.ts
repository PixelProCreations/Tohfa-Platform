/**
 * Customer wallet endpoints (docs/openapi.yaml `Wallet`, `TopupIntent`,
 * `TopupReceipt`). Money is always the decimal-string `Money` type, never a
 * float; the wallet is never credited client-side (only the server's
 * Razorpay `payment.captured` webhook credits it).
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { Money } from '@tohfa/shared-types';
import { api } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';

export const walletQueryKeys = {
  wallet: ['wallet'] as const,
  topup: (topupId: string) => ['wallet', 'topups', topupId] as const,
};

/** `GET /wallets/me`. */
export interface WalletResponse {
  id: string;
  ownerType?: 'CUSTOMER' | 'FARMER';
  balance: Money;
  currency?: 'INR';
  status: string;
  updatedAt?: string;
  /** Per digital top-up min/max (BR-193); only on GET /wallets/me. Validate the amount against it. */
  topupLimits?: { min: Money; max: Money };
}

export type TopupMode = 'UPI' | 'CARD' | 'NETBANKING';
export type TopupStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

/** `POST /wallets/me/topups` 201 (`TopupIntent`). Note: `topupId`, not `id`. */
export interface TopupIntent {
  topupId: string;
  gateway: 'RAZORPAY';
  gatewayOrderId: string;
  amount: Money;
  currency: 'INR';
  status: TopupStatus;
  /** Publishable key for the SDK -- delivered by the API, never hardcoded. */
  razorpayKeyId?: string;
}

/** @deprecated old name; the shape is `TopupIntent` (`topupId`, not `id`). */
export type TopupResponse = TopupIntent;

/** `GET /wallets/me/topups/{topupId}` (`TopupReceipt`). */
export interface TopupReceipt {
  topupId: string;
  status: TopupStatus;
  amount: Money;
  currency: 'INR';
  mode: string;
  /** Wallet ledger row of the credit; null until SUCCESS. */
  transactionId: string | null;
  /** Wallet balance right after the credit; null until SUCCESS. */
  balanceAfter: Money | null;
  createdAt: string;
  completedAt: string | null;
}

export function fetchWallet(signal?: AbortSignal): Promise<WalletResponse> {
  return signal === undefined ? api.get<WalletResponse>('/wallets/me') : api.get<WalletResponse>('/wallets/me', signal);
}

/** Money-moving: `idempotencyKey` is required (the API answers 422 without one). */
export function createTopup(input: { amount: Money; mode: TopupMode }, idempotencyKey: string): Promise<TopupIntent> {
  return api.post<TopupIntent>('/wallets/me/topups', { amount: input.amount, mode: input.mode }, idempotencyKey, {
    timeoutMs: 15000,
  });
}

export function fetchTopupReceipt(topupId: string, signal?: AbortSignal): Promise<TopupReceipt> {
  const path = `/wallets/me/topups/${encodeURIComponent(topupId)}`;
  return signal === undefined ? api.get<TopupReceipt>(path) : api.get<TopupReceipt>(path, signal);
}

export const useWallet = () =>
  useQuery({
    queryKey: walletQueryKeys.wallet,
    queryFn: ({ signal }) => fetchWallet(signal),
  });

/**
 * One Idempotency-Key per `(amount, mode)` fingerprint: a retry of the same
 * request replays the same key (the server returns the original intent), a
 * changed amount/mode gets a new key. Reset after a flow finishes so the next
 * Pay tap is a new top-up. Normally use `startWalletTopup()` (./topup.ts),
 * which does this plus Razorpay and polling.
 */
export const topupIdempotencyKeys = createIdempotencyKeyCache();

export const useCreateTopup = () =>
  useMutation({
    mutationFn: ({ amount, mode }: { amount: Money; mode: TopupMode }) =>
      createTopup({ amount, mode }, topupIdempotencyKeys.keyFor(`${amount}|${mode}`)),
  });

/** @deprecated kept for existing imports; use `useCreateTopup`. */
export const useTopup = useCreateTopup;
