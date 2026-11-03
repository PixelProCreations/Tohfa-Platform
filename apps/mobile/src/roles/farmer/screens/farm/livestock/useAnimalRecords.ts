/**
 * Data hooks behind AnimalDetailScreen's tabs. Same abortable useEffect +
 * reload-counter pattern as screens/dashboard/useCommunityPlanting.ts: a new
 * animal id / retry / refresh aborts the in-flight request, so a slow response
 * for an old request can never overwrite a newer one.
 *
 * Each tab's hooks take an `enabled` flag so a tab's records are only fetched
 * once the farmer opens it (and stay loaded afterwards).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAnimal,
  listAnimals,
  listBreedingRecords,
  listFeedLogs,
  listFeedPlans,
  listHealthRecords,
  listHousingRecords,
  listHygieneLogs,
  listProductionLogs,
  type AnimalResponse,
  type LivestockBreedingRecord,
  type LivestockFeedLog,
  type LivestockFeedPlan,
  type LivestockHealthRecord,
  type HousingRecordsPage,
  type LivestockHousingListItem,
  type LivestockHygieneLog,
  type ProductionLogResponse,
  type RecordsPage,
} from '../../../api/livestock';
import { addDaysIso, localTodayIso } from './animalRecordView';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

// ── The animal itself ───────────────────────────────────────────────────────

export interface AnimalState {
  state: LoadState;
  animal: AnimalResponse | null;
  error: unknown;
  /** Full reload with the loading state (after an error). */
  retry: () => void;
  /** Re-fetch keeping the current animal on screen (pull-to-refresh, after a withdrawal-moving save). */
  refresh: () => void;
}

export class MissingAnimalIdError extends Error {
  constructor() {
    super('missing animal id');
    this.name = 'MissingAnimalIdError';
  }
}

export function useAnimal(animalId: string | undefined): AnimalState {
  const [state, setState] = useState<LoadState>('loading');
  const [animal, setAnimal] = useState<AnimalResponse | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const silentRef = useRef(false);

  useEffect(() => {
    if (!animalId) {
      setAnimal(null);
      setError(new MissingAnimalIdError());
      setState('error');
      return undefined;
    }
    const controller = new AbortController();
    if (!silentRef.current) setState('loading');
    getAnimal(animalId, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setAnimal(result);
        setError(null);
        setState('ready');
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        // A failed silent refresh keeps the animal already on screen.
        if (!silentRef.current) {
          setAnimal(null);
          setError(err);
          setState('error');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) silentRef.current = false;
      });
    return () => controller.abort();
  }, [animalId, reloadKey]);

  const retry = useCallback(() => {
    silentRef.current = false;
    setReloadKey((k) => k + 1);
  }, []);
  const refresh = useCallback(() => {
    silentRef.current = true;
    setReloadKey((k) => k + 1);
  }, []);

  return { state, animal, error, retry, refresh };
}

// ── Generic paged list ──────────────────────────────────────────────────────

export interface PagedRecords<T, R extends RecordsPage<T> = RecordsPage<T>> {
  state: LoadState;
  items: T[];
  /**
   * The latest page-one response as received, for fields the server sends
   * beside the page (the housing list's BR-140 `spaceStandard`). Null until
   * page one loads and after it fails.
   */
  firstPage: R | null;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreError: boolean;
  loadMore: () => void;
  retry: () => void;
  /** Pull-to-refresh / after a save: refetch page one, keeping the current rows visible. */
  refresh: () => void;
  refreshing: boolean;
}

type PageFetcher<T, R extends RecordsPage<T> = RecordsPage<T>> = (
  animalId: string,
  cursor: string | undefined,
  signal: AbortSignal,
) => Promise<R>;

/**
 * `fetchPage` must be a stable (module-level) function: it is a dependency of
 * the load effect.
 */
export function usePagedRecords<T, R extends RecordsPage<T> = RecordsPage<T>>(
  animalId: string | undefined,
  fetchPage: PageFetcher<T, R>,
  enabled: boolean,
): PagedRecords<T, R> {
  const [state, setState] = useState<LoadState>('idle');
  const [items, setItems] = useState<T[]>([]);
  const [firstPage, setFirstPage] = useState<R | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const refreshingRef = useRef(false);
  const startedRef = useRef(false);
  const moreControllerRef = useRef<AbortController | null>(null);

  if (enabled) startedRef.current = true;
  const active = startedRef.current;

  useEffect(() => {
    if (!active || !animalId) return undefined;
    const controller = new AbortController();
    moreControllerRef.current?.abort();
    if (!refreshingRef.current) setState('loading');
    fetchPage(animalId, undefined, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setItems(page.items);
        setFirstPage(page);
        setCursor(page.page.nextCursor);
        setHasMore(page.page.hasMore);
        setLoadMoreError(false);
        setState('ready');
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        if (!refreshingRef.current) {
          setItems([]);
          setFirstPage(null);
          setHasMore(false);
          setState('error');
        }
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        refreshingRef.current = false;
        setRefreshing(false);
      });
    return () => controller.abort();
  }, [active, animalId, fetchPage, reloadKey]);

  useEffect(() => () => moreControllerRef.current?.abort(), []);

  const loadMore = useCallback(() => {
    if (!animalId || !hasMore || cursor === null || loadingMore) return;
    const controller = new AbortController();
    moreControllerRef.current = controller;
    setLoadingMore(true);
    setLoadMoreError(false);
    fetchPage(animalId, cursor, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setItems((prev) => [...prev, ...page.items]);
        setCursor(page.page.nextCursor);
        setHasMore(page.page.hasMore);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadMoreError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingMore(false);
      });
  }, [animalId, cursor, fetchPage, hasMore, loadingMore]);

  const retry = useCallback(() => {
    refreshingRef.current = false;
    setReloadKey((k) => k + 1);
  }, []);

  const refresh = useCallback(() => {
    if (!startedRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    setReloadKey((k) => k + 1);
  }, []);

  return { state, items, firstPage, hasMore, loadingMore, loadMoreError, loadMore, retry, refresh, refreshing };
}

// ── Per-resource fetchers (module-level so they are stable) ─────────────────

/** Page sizes: the tab shows the newest rows and a "show more" for the rest. */
export const HEALTH_PAGE_SIZE = 20;
export const BREEDING_PAGE_SIZE = 50;
export const LOG_PAGE_SIZE = 20;

const fetchHealth: PageFetcher<LivestockHealthRecord> = (id, cursor, signal) =>
  listHealthRecords(id, { limit: HEALTH_PAGE_SIZE, ...(cursor ? { cursor } : {}) }, signal);
const fetchBreeding: PageFetcher<LivestockBreedingRecord> = (id, cursor, signal) =>
  listBreedingRecords(id, { limit: BREEDING_PAGE_SIZE, ...(cursor ? { cursor } : {}) }, signal);
/** Only the newest plan is shown ("the newest is current"). */
const fetchFeedPlans: PageFetcher<LivestockFeedPlan> = (id, cursor, signal) =>
  listFeedPlans(id, { limit: 1, ...(cursor ? { cursor } : {}) }, signal);
const fetchFeedLogs: PageFetcher<LivestockFeedLog> = (id, cursor, signal) =>
  listFeedLogs(id, { limit: LOG_PAGE_SIZE, ...(cursor ? { cursor } : {}) }, signal);
/**
 * Only the current housing is shown: the list is ordered startDate DESC, so
 * the single row of page one is the newest startDate. The page also carries
 * the BR-140 `spaceStandard` (read via `firstPage`).
 */
const fetchHousing: PageFetcher<LivestockHousingListItem, HousingRecordsPage> = (id, cursor, signal) =>
  listHousingRecords(id, { limit: 1, ...(cursor ? { cursor } : {}) }, signal);
const fetchHygiene: PageFetcher<LivestockHygieneLog> = (id, cursor, signal) =>
  listHygieneLogs(id, { limit: LOG_PAGE_SIZE, ...(cursor ? { cursor } : {}) }, signal);
const fetchProduction: PageFetcher<ProductionLogResponse> = (id, cursor, signal) =>
  listProductionLogs({ animalId: id, limit: LOG_PAGE_SIZE, ...(cursor ? { cursor } : {}) }, signal);

export const useAnimalHealthRecords = (animalId: string | undefined, enabled: boolean) =>
  usePagedRecords(animalId, fetchHealth, enabled);
export const useAnimalBreedingRecords = (animalId: string | undefined, enabled: boolean) =>
  usePagedRecords(animalId, fetchBreeding, enabled);
export const useAnimalFeedPlan = (animalId: string | undefined, enabled: boolean) =>
  usePagedRecords(animalId, fetchFeedPlans, enabled);
export const useAnimalFeedLogs = (animalId: string | undefined, enabled: boolean) =>
  usePagedRecords(animalId, fetchFeedLogs, enabled);
export const useAnimalHousing = (animalId: string | undefined, enabled: boolean) =>
  usePagedRecords(animalId, fetchHousing, enabled);
export const useAnimalHygieneLogs = (animalId: string | undefined, enabled: boolean) =>
  usePagedRecords(animalId, fetchHygiene, enabled);
export const useAnimalProductionLogs = (animalId: string | undefined, enabled: boolean) =>
  usePagedRecords(animalId, fetchProduction, enabled);

/** Milk logs for the 7 days ending today (sparkline + today's yield). Follows every page. */
export const MILK_SERIES_DAYS = 7;

const fetchMilkWindow: PageFetcher<ProductionLogResponse> = async (id, _cursor, signal) => {
  const today = localTodayIso();
  const items: ProductionLogResponse[] = [];
  let cursor: string | undefined;
  // Bounded: 7 days of per-animal milk logs fit in one 100-row page in practice;
  // the cap only stops a runaway loop.
  for (let page = 0; page < 10; page += 1) {
    const result = await listProductionLogs(
      {
        animalId: id,
        productType: 'MILK',
        dateFrom: addDaysIso(today, -(MILK_SERIES_DAYS - 1)),
        dateTo: today,
        limit: 100,
        ...(cursor ? { cursor } : {}),
      },
      signal,
    );
    items.push(...result.items);
    if (!result.page.hasMore || result.page.nextCursor === null) break;
    cursor = result.page.nextCursor;
  }
  return { items, page: { nextCursor: null, hasMore: false } };
};

export const useAnimalMilkWindow = (animalId: string | undefined, enabled: boolean) =>
  usePagedRecords(animalId, fetchMilkWindow, enabled);

// ── Sire options (HEAT form) ────────────────────────────────────────────────

/**
 * Male animals of the herd, offered as the sire for a heat record. Replaces a
 * hard-coded "Bull #01 (Sahiwal)" list. Same species only. Loaded when the
 * breeding modal opens; a failure leaves just the "external" option.
 */
export function useSireOptions(species: AnimalResponse['species'] | undefined, enabled: boolean): string[] {
  const [options, setOptions] = useState<string[]>([]);
  useEffect(() => {
    if (!enabled || species === undefined) return undefined;
    const controller = new AbortController();
    listAnimals({ species, limit: 100 }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setOptions(
          result.items
            .filter((a) => a.gender === 'MALE')
            .map((a) => (a.name ? `${a.name} (${a.tag})` : a.tag)),
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setOptions([]);
      });
    return () => controller.abort();
  }, [enabled, species]);
  return options;
}
