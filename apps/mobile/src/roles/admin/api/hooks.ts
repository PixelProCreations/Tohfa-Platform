/**
 * Thin TanStack Query wrappers for the admin screens. No branching logic
 * lives here (hooks cannot be unit-tested in this app's plain-Node vitest);
 * every decision is in ./hookHelpers.ts. Keys come from ./queryKeys.ts, data
 * from the admin API modules (which call ./http.ts).
 *
 * Needs a QueryClientProvider above it: App.tsx mounts SessionQueryProvider
 * (src/shell/api/SessionQueryProvider.tsx), so the cache is per session.
 */
import { useMemo, useRef } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from '@tanstack/react-query';
import { createIdempotencyKeyCache, type IdempotencyKeyCache } from '../../../shell/api/idempotency';
import { nextPageParam, type Page } from '../../../shell/api/pagination';
import { bodyFingerprint, cursorListFlags, flattenPages } from './hookHelpers';

export interface AdminQueryOptions {
  enabled?: boolean | undefined;
}

/** One request, keyed by `key`; `fetcher` gets TanStack Query's abort signal. */
export function useAdminQuery<T>(key: QueryKey, fetcher: (signal: AbortSignal) => Promise<T>, options: AdminQueryOptions = {}) {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetcher(signal),
    enabled: options.enabled ?? true,
  });
}

export interface CursorList<U, P = unknown> {
  items: U[];
  /** The first loaded page as the server sent it (e.g. a list `summary`); undefined before it loads. */
  firstPage: P | undefined;
  loadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

/**
 * A cursor-paged list (docs/openapi.yaml PageMeta) with load-more and refresh.
 * With `enabled: false` nothing is fetched and the list is not loading (e.g.
 * no customer id to ask for yet).
 */
export function useCursorList<T, U, P extends Page<T> = Page<T>>(
  key: QueryKey,
  fetchPage: (cursor: string | undefined, signal: AbortSignal) => Promise<P>,
  map: (item: T) => U,
  options: AdminQueryOptions = {},
): CursorList<U, P> {
  const enabled = options.enabled ?? true;
  const query = useInfiniteQuery<P, Error, InfiniteData<P, string | undefined>, QueryKey, string | undefined>({
    queryKey: key,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: undefined,
    getNextPageParam: nextPageParam,
    enabled,
  });
  const items = useMemo(() => flattenPages(query.data?.pages, map), [query.data, map]);
  const flags = cursorListFlags(query);
  return {
    items,
    firstPage: query.data?.pages[0],
    loadMore: () => {
      if (flags.canLoadMore) void query.fetchNextPage();
    },
    hasMore: flags.hasMore,
    isLoading: enabled && flags.isLoading,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: flags.isRefreshing,
  };
}

export interface AdminMutationConfig<TVariables, TResult> {
  mutationFn: (variables: TVariables) => Promise<TResult>;
  /** Query-key prefixes to refetch after a success (e.g. adminKeys.module('orders')). */
  invalidates?: readonly QueryKey[] | undefined;
}

/** A write; on success the listed queries are invalidated so screens refetch. */
export function useAdminMutation<TVariables, TResult>({ mutationFn, invalidates = [] }: AdminMutationConfig<TVariables, TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const queryKey of invalidates) void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export interface IdempotencyKeyFor {
  /** The key for this body: the same body reuses its key, a changed body gets a new one. */
  keyFor: (body: unknown) => string;
  /** Forget the key after the operation is done, so the next one starts fresh. */
  reset: () => void;
}

/** One Idempotency-Key per logical write for the lifetime of the screen (root CLAUDE.md 2.4). */
export function useIdempotencyKey(): IdempotencyKeyFor {
  const cacheRef = useRef<IdempotencyKeyCache | null>(null);
  if (cacheRef.current === null) cacheRef.current = createIdempotencyKeyCache();
  const cache = cacheRef.current;
  return useMemo(
    () => ({
      keyFor: (body: unknown) => cache.keyFor(bodyFingerprint(body)),
      reset: () => cache.reset(),
    }),
    [cache],
  );
}
