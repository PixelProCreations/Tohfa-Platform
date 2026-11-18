/**
 * Wallet-to-wallet transfers (BR-150). The API takes the recipient's MOBILE
 * (E.164) only: lookup returns a masked name + masked mobile, never a wallet id
 * or a directory. No OTP step exists on the API.
 *
 * Idempotency: one key per `(mobile, amount, note)` fingerprint, reused on a
 * network retry of the same send and reset after success (or when the user
 * edits any field, which changes the fingerprint).
 */
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Money } from '@tohfa/shared-types';
import { api } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import type { PageMeta } from './wallet';
import { walletQueryKeys } from './wallet';

export interface TransferRecipient {
  /** Masked, e.g. `B*** K***`. */
  displayName: string;
  /** Masked, e.g. `******3210`. */
  mobileMasked: string;
}

export interface WalletTransfer {
  id: string;
  direction: 'SENT' | 'RECEIVED';
  amount: Money;
  counterparty: TransferRecipient;
  note: string | null;
  status: 'COMPLETED';
  createdAt: string;
}

export interface CreatedTransfer extends WalletTransfer {
  balanceAfter: Money;
}

export function lookupRecipient(mobile: string): Promise<TransferRecipient> {
  return api.post<TransferRecipient>('/wallets/me/transfers/lookup', { mobile });
}

export function createTransfer(
  input: { recipientMobile: string; amount: Money; note?: string | undefined },
  idempotencyKey: string,
): Promise<CreatedTransfer> {
  const body: Record<string, unknown> = { recipientMobile: input.recipientMobile, amount: input.amount };
  if (input.note !== undefined && input.note.trim() !== '') body['note'] = input.note.trim();
  return api.post<CreatedTransfer>('/wallets/me/transfers', body, idempotencyKey, { timeoutMs: 15000 });
}

export const transferIdempotencyKeys = createIdempotencyKeyCache();

export const transferFingerprint = (mobile: string, amount: string, note: string): string =>
  `${mobile}|${amount}|${note.trim()}`;

export const useLookupRecipient = () => useMutation({ mutationFn: (mobile: string) => lookupRecipient(mobile), retry: 0 });

export const useSendTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { recipientMobile: string; amount: Money; note?: string | undefined }) =>
      createTransfer(
        input,
        transferIdempotencyKeys.keyFor(transferFingerprint(input.recipientMobile, input.amount, input.note ?? '')),
      ),
    retry: 0,
    onSuccess: () => transferIdempotencyKeys.reset(),
    // Whatever the outcome the balance may have changed (or be stale on a 402).
    onSettled: () => queryClient.invalidateQueries({ queryKey: walletQueryKeys.wallet }),
  });
};

interface TransfersPage {
  items: WalletTransfer[];
  page: PageMeta;
}

/** Transfer history (sent + received), keyset-paged. */
export const useTransfers = () =>
  useInfiniteQuery({
    queryKey: [...walletQueryKeys.wallet, 'transfers'] as const,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => {
      const path = `/wallets/me/transfers?limit=20${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ''}`;
      return api.get<TransfersPage>(path, signal);
    },
    getNextPageParam: (last) => (last.page.hasMore && last.page.nextCursor ? last.page.nextCursor : undefined),
  });
