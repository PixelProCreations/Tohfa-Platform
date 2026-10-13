/**
 * React Query hooks every admin flow uses, so loading/paging/retry/write
 * behaviour is the same on every screen.
 *
 *  - useAdminQuery: a plain query with the caller's signal threaded through.
 *  - useCursorList: cursor-paged lists (docs/openapi.yaml `PageMeta`) with
 *    pull-to-refresh and load-more; the cursor is passed back verbatim.
 *  - useOffsetList: the same for the older offset envelope (`OffsetPage`,
 *    e.g. storage locations): `page` 1, 2, ... until `total` is reached.
 *  - useAdminMutation: a write that invalidates the given key prefixes on
 *    success only (a failed write changed nothing server-side).
 *  - useIdempotencyKey: the per-screen key for money-moving writes. Same body
 *    -> same key, so a retry after a timeout replays instead of moving money
 *    twice (root CLAUDE.md §2.4); call reset() once the write succeeded.
 */
import { useCallback, useMemo, useRef } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import {
  flattenOffsetPages,
  flattenPages,
  nextCursorOf,
  nextOffsetPageOf,
  type OffsetPage,
  type Page,
} from '../../../shell/api/pagination';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';

export interface AdminQueryOptions {
  enabled?: boolean | undefined;
}

export function useAdminQuery<T>(
  key: QueryKey,
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: AdminQueryOptions = {},
) {
  return useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetcher(signal),
    enabled: options.enabled ?? true,
  });
}

export function useCursorList<T>(
  key: QueryKey,
  fetchPage: (cursor: string | undefined, signal: AbortSignal) => Promise<Page<T>>,
  options: AdminQueryOptions = {},
) {
  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<T>) => nextCursorOf(last),
    enabled: options.enabled ?? true,
  });

  const items = useMemo(() => flattenPages(query.data?.pages), [query.data]);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    ...query,
    items,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    isRefreshing: query.isRefetching && !isFetchingNextPage,
    loadMore,
    refresh,
  };
}

export function useOffsetList<T>(
  key: QueryKey,
  fetchPage: (page: number, signal: AbortSignal) => Promise<OffsetPage<T>>,
  options: AdminQueryOptions = {},
) {
  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last: OffsetPage<T>) => nextOffsetPageOf(last),
    enabled: options.enabled ?? true,
  });

  const items = useMemo(() => flattenOffsetPages(query.data?.pages), [query.data]);
  const { hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    ...query,
    items,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    isRefreshing: query.isRefetching && !isFetchingNextPage,
    loadMore,
    refresh,
  };
}

export interface AdminMutationOptions<TResult> {
  /** Key prefixes to invalidate after a successful write. */
  invalidate?: readonly QueryKey[] | undefined;
  onSuccess?: ((result: TResult) => void) | undefined;
}

export function useAdminMutation<TVars, TResult>(
  mutationFn: (vars: TVars) => Promise<TResult>,
  options: AdminMutationOptions<TResult> = {},
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (result: TResult) => {
      await Promise.all(
        (options.invalidate ?? []).map((queryKey) => client.invalidateQueries({ queryKey })),
      );
      options.onSuccess?.(result);
    },
  });
}

export interface IdempotencyKeyHandle {
  keyFor(body: unknown): string;
  reset(): void;
}

const OPERATION = 'screen';

export function useIdempotencyKey(): IdempotencyKeyHandle {
  const cache = useRef(createIdempotencyKeyCache());
  return useMemo(
    () => ({
      keyFor: (body: unknown) => cache.current.keyFor(OPERATION, body),
      reset: () => cache.current.release(OPERATION),
    }),
    [],
  );
}
