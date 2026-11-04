import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EMPTY_COMMUNITY_PLANTING_QUERY,
  getCommunityPlantingFilters,
  getCommunityPlantingSummary,
  isCommunityPlantingUnavailable,
  type CommunityPlantingFilters,
  type CommunityPlantingQuery,
  type CommunityPlantingSummary,
} from '../../api/community';

export type CommunityLoadState = 'loading' | 'ready' | 'error';

/**
 * `unavailable`: the server refused the view (403, or 503
 * COMMUNITY_PLANTING_NOT_CONFIGURED) — it is switched off pending an owner
 * decision, so the screen says so instead of offering a Retry that cannot help.
 */
export type CommunitySummaryState = CommunityLoadState | 'unavailable';

export interface CommunityPlanting {
  query: CommunityPlantingQuery;
  setQuery: (next: CommunityPlantingQuery) => void;
  /** State of the summary for the current `query`. */
  state: CommunitySummaryState;
  summary: CommunityPlantingSummary | null;
  /** Filter options; null until loaded (or after a failed load). */
  filterOptions: CommunityPlantingFilters | null;
  filtersState: CommunityLoadState;
  /** Refetch after an error (shows the loading state again). */
  retry: () => void;
  /** Pull-to-refresh: keeps the current data on screen while refetching. */
  refreshing: boolean;
  refresh: () => void;
}

/**
 * Loads the BR-136 community planting summary for the selected filters, plus
 * the filter options, following the same abortable useEffect + reloadKey
 * pattern as `screens/farm/diary/diaryLookups.tsx`.
 *
 * A filter change aborts the in-flight request, so a slow response for an old
 * slice can never overwrite the newer one.
 */
export function useCommunityPlanting(): CommunityPlanting {
  const [query, setQuery] = useState<CommunityPlantingQuery>(EMPTY_COMMUNITY_PLANTING_QUERY);
  const [state, setState] = useState<CommunitySummaryState>('loading');
  const [summary, setSummary] = useState<CommunityPlantingSummary | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);

  const [filterOptions, setFilterOptions] = useState<CommunityPlantingFilters | null>(null);
  const [filtersState, setFiltersState] = useState<CommunityLoadState>('loading');
  const [filtersReloadKey, setFiltersReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // A pull-to-refresh keeps the current numbers visible; anything else
    // (first load, filter change, retry) shows the loading state.
    if (!refreshingRef.current) setState('loading');
    getCommunityPlantingSummary(query, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setSummary(result);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSummary(null);
        setState(isCommunityPlantingUnavailable(error) ? 'unavailable' : 'error');
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        refreshingRef.current = false;
        setRefreshing(false);
      });
    return () => controller.abort();
  }, [query, reloadKey]);

  useEffect(() => {
    const controller = new AbortController();
    setFiltersState('loading');
    getCommunityPlantingFilters(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setFilterOptions(result);
        setFiltersState('ready');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFiltersState('error');
      });
    return () => controller.abort();
  }, [filtersReloadKey]);

  const retry = useCallback(() => {
    refreshingRef.current = false;
    setReloadKey((k) => k + 1);
    if (filtersState === 'error') setFiltersReloadKey((k) => k + 1);
  }, [filtersState]);

  const refresh = useCallback(() => {
    refreshingRef.current = true;
    setRefreshing(true);
    setReloadKey((k) => k + 1);
    setFiltersReloadKey((k) => k + 1);
  }, []);

  return { query, setQuery, state, summary, filterOptions, filtersState, retry, refreshing, refresh };
}
