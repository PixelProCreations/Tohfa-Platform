/**
 * Catalog search (docs/openapi.yaml tag Catalog, BR-151):
 *   GET /catalog/search?q&cursor&limit (cursor paged Products),
 *   GET /catalog/search/suggestions?q&limit<=20 -> { items: [{type PRODUCT|CATEGORY, id, name}] },
 *   GET/POST/DELETE /catalog/search/recent (auth; own history),
 *   GET /catalog/search/trending?limit -> { queries: [{query, searchers}], products: Product[] }.
 * `q` is 1..80 chars; a blank query is 422, so hooks stay disabled for it.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, getAccessToken } from '../../../shell/api/client';
import { buildQueryString, nextPageParam, type Page } from '../../../shell/api/pagination';
import type { Product } from './catalog';

export const SEARCH_MAX_LENGTH = 80;

export interface SearchSuggestion {
  type: 'PRODUCT' | 'CATEGORY';
  id: string;
  name: string;
}

export interface RecentSearch {
  query: string;
  searchedAt: string;
}

export interface TrendingSearches {
  queries: { query: string; searchers: number }[];
  products: Product[];
}

/** Trimmed, capped query; '' when unusable. */
export function normalizeSearchQuery(q: string | null | undefined): string {
  return (q ?? '').trim().slice(0, SEARCH_MAX_LENGTH);
}

export const searchQueryKeys = {
  suggestions: (q: string) => ['search', 'suggest', q] as const,
  results: (q: string) => ['search', 'results', q] as const,
  recent: ['search', 'recent'] as const,
  trending: ['search', 'trending'] as const,
};

export async function fetchSuggestions(q: string, signal?: AbortSignal, limit = 8): Promise<SearchSuggestion[]> {
  const res = await api.get<{ items: SearchSuggestion[] }>(`/catalog/search/suggestions${buildQueryString({ q, limit })}`, signal);
  return res.items;
}

export function fetchSearch(q: string, cursor?: string, signal?: AbortSignal, limit = 20): Promise<Page<Product>> {
  return api.get<Page<Product>>(`/catalog/search${buildQueryString({ q, cursor, limit })}`, signal);
}

export async function fetchRecentSearches(signal?: AbortSignal): Promise<RecentSearch[]> {
  const res = await api.get<{ items: RecentSearch[] }>('/catalog/search/recent', signal);
  return res.items;
}

export function recordRecentSearch(query: string): Promise<RecentSearch> {
  return api.post<RecentSearch>('/catalog/search/recent', { query });
}

/** With `q`: remove that one entry; without: clear all. */
export function deleteRecentSearches(q?: string): Promise<void> {
  return api.delete<void>(`/catalog/search/recent${buildQueryString({ q: q || undefined })}`);
}

export function fetchTrending(signal?: AbortSignal, limit = 10): Promise<TrendingSearches> {
  return api.get<TrendingSearches>(`/catalog/search/trending${buildQueryString({ limit })}`, signal);
}

/** Type-ahead suggestions; pass an already debounced query. Errors are for the caller to ignore. */
export const useSearchSuggestions = (q: string) => {
  const query = normalizeSearchQuery(q);
  return useQuery({
    queryKey: searchQueryKeys.suggestions(query),
    queryFn: ({ signal }) => fetchSuggestions(query, signal),
    enabled: query.length > 0,
    staleTime: 60_000,
    retry: false,
  });
};

/** Submitted search results (cursor paged). */
export const useSearchResults = (q: string) => {
  const query = normalizeSearchQuery(q);
  return useInfiniteQuery({
    queryKey: searchQueryKeys.results(query),
    queryFn: ({ pageParam, signal }) => fetchSearch(query, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<Product>) => nextPageParam(last),
    enabled: query.length > 0,
  });
};
/** @deprecated old name. */
export const useSearch = useSearchResults;

/** Own recent searches; signed-out or forbidden callers just get no section. */
export const useRecentSearches = () =>
  useQuery({
    queryKey: searchQueryKeys.recent,
    queryFn: ({ signal }) => fetchRecentSearches(signal),
    enabled: !!getAccessToken(),
    retry: false,
  });

/** Fire-and-forget record of a submitted query; 401/403 are ignored. */
export const useRecordRecentSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (query: string) => {
      const q = normalizeSearchQuery(query);
      if (q.length === 0 || !getAccessToken()) return null;
      try {
        return await recordRecentSearch(q);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
        throw err;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: searchQueryKeys.recent });
    },
  });
};

/** Remove one recent search (`q`) or all (no argument); optimistic. */
export const useDeleteRecentSearch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (q?: string) => deleteRecentSearches(q),
    onMutate: async (q) => {
      await qc.cancelQueries({ queryKey: searchQueryKeys.recent });
      const previous = qc.getQueryData<RecentSearch[]>(searchQueryKeys.recent);
      const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
      qc.setQueryData<RecentSearch[]>(searchQueryKeys.recent, q ? (previous ?? []).filter((r) => norm(r.query) !== norm(q)) : []);
      return { previous };
    },
    onError: (_e, _q, ctx) => {
      if (ctx) qc.setQueryData(searchQueryKeys.recent, ctx.previous);
    },
  });
};

export const useTrending = () =>
  useQuery({
    queryKey: searchQueryKeys.trending,
    queryFn: ({ signal }) => fetchTrending(signal),
    staleTime: 5 * 60_000,
  });
