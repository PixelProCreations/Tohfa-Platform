/**
 * Live data for the listing approval queue. Thin wrappers over ./hooks.ts;
 * every decision lives in ./listings.ts or ./queryKeys.ts (tested), since
 * hooks cannot be rendered in this app's plain-Node vitest.
 *
 * Every hook takes `{ enabled }` so a screen can skip the fetch (or refuse the
 * write locally) when `can(...)` denies. The server still decides (root
 * CLAUDE.md 2.1); `enabled` only avoids a request that would be a 403.
 *
 * Idempotency: each write keeps one Idempotency-Key per (listing, body) until
 * `finish()`, so a retry of the same press replays the same key and the
 * server answers it once.
 */
import { useMemo } from 'react';
import {
  approveListing,
  listAdminListings,
  listingWriteFingerprint,
  QUEUE_STATUS,
  rejectListing,
  sendCounterOffer,
  toListingQueueRow,
  type AdminListingDto,
  type AdminListingPage,
  type ApproveListingBody,
  type CounterOfferBody,
  type ListingQueueRow,
  type RejectListingBody,
} from './listings';
import { useAdminMutation, useCursorList, useIdempotencyKey, type CursorList } from './hooks';
import { adminKeys, listingKeys, LISTINGS_MODULE } from './queryKeys';

export interface ListingsHookOptions {
  /** false: nothing is fetched (or sent) and nothing is loading. Default true. */
  enabled?: boolean | undefined;
}

function toRow(dto: AdminListingDto): ListingQueueRow {
  return toListingQueueRow(dto);
}

/** listing.queue.view_pending: the listings awaiting approval, page by page. */
export function useListingQueue(
  warehouseId: string | undefined,
  options: ListingsHookOptions = {},
): CursorList<ListingQueueRow, AdminListingPage> {
  return useCursorList<AdminListingDto, ListingQueueRow, AdminListingPage>(
    listingKeys.queue(warehouseId, { status: QUEUE_STATUS }),
    (cursor, signal) => listAdminListings({ status: QUEUE_STATUS, cursor }, signal),
    toRow,
    { enabled: options.enabled ?? true },
  );
}

export interface ListingWrite<B> {
  /** Sends the write; `onDone` fires after the server answered. Ignored while one is in flight. */
  run: (listingId: string, body: B, onDone?: (result: unknown) => void) => void;
  isPending: boolean;
  /** The last failure, for adminErrorKey. */
  error: unknown;
  /** Call when the action is done or abandoned, so the next one gets a fresh Idempotency-Key. */
  finish: () => void;
}

interface Vars<B> {
  listingId: string;
  body: B;
}

function notPermitted(): Promise<never> {
  return Promise.reject(new Error('Listing write is not enabled for this caller.'));
}

function useListingWrite<B>(
  send: (listingId: string, body: B, key: string) => Promise<unknown>,
  options: ListingsHookOptions,
): ListingWrite<B> {
  const enabled = options.enabled ?? true;
  const keys = useIdempotencyKey();
  const mutation = useAdminMutation<Vars<B>, unknown>({
    mutationFn: ({ listingId, body }) =>
      enabled ? send(listingId, body, keys.keyFor(listingWriteFingerprint(listingId, body))) : notPermitted(),
    invalidates: [adminKeys.module(LISTINGS_MODULE)],
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      run: (listingId: string, body: B, onDone?: (result: unknown) => void) => {
        if (isPending) return;
        if (onDone === undefined) mutate({ listingId, body });
        else mutate({ listingId, body }, { onSuccess: (result) => onDone(result) });
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

/** listing.approve: POST /admin/listings/{id}/approve. */
export function useApproveListing(options: ListingsHookOptions = {}): ListingWrite<ApproveListingBody> {
  return useListingWrite<ApproveListingBody>(approveListing, options);
}

/** listing.reject: POST /admin/listings/{id}/reject. */
export function useRejectListing(options: ListingsHookOptions = {}): ListingWrite<RejectListingBody> {
  return useListingWrite<RejectListingBody>(rejectListing, options);
}

/** listing.counter_offer.send: POST /admin/listings/{id}/counter-offers. */
export function useSendCounterOffer(options: ListingsHookOptions = {}): ListingWrite<CounterOfferBody> {
  return useListingWrite<CounterOfferBody>(sendCounterOffer, options);
}
