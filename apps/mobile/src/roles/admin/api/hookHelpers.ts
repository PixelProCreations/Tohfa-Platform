/**
 * The decisions behind ./hooks.ts, kept pure so plain-Node vitest can test
 * them (hooks cannot be rendered here; see ../tests/api_hooks.test.ts).
 */
import type { NumberedPage, Page } from '../../../shell/api/pagination';

/** Every item of every loaded page, mapped, in order. Empty before the first page. */
export function flattenPages<T, U>(pages: readonly Page<T>[] | undefined, map: (item: T) => U): U[] {
  if (pages === undefined) return [];
  const out: U[] = [];
  for (const page of pages) for (const item of page.items) out.push(map(item));
  return out;
}

/** flattenPages for a `page`/`limit` list (NumberedPage). */
export function flattenNumberedPages<T, U>(pages: readonly NumberedPage<T>[] | undefined, map: (item: T) => U): U[] {
  if (pages === undefined) return [];
  const out: U[] = [];
  for (const page of pages) for (const item of page.items) out.push(map(item));
  return out;
}

/**
 * How many loaded rows match `predicate`, or null when pages are still missing.
 *
 * A screen that says "4 unpublished" from the first page of fifty is stating a
 * number it cannot know. Null is the honest answer there, and the screen shows
 * an em-dash for it. Only a count the server itself reports (`total`) is safe
 * on a partially loaded list.
 */
export function countLoadedWhere<T>(items: readonly T[], predicate: (item: T) => boolean, allPagesLoaded: boolean): number | null {
  if (!allPagesLoaded) return null;
  let count = 0;
  for (const item of items) if (predicate(item)) count += 1;
  return count;
}

export interface CursorQueryStatus {
  hasNextPage: boolean;
  isPending: boolean;
  isFetchingNextPage: boolean;
  isRefetching: boolean;
}

export interface CursorListFlags {
  hasMore: boolean;
  /** First load only (nothing to show yet). */
  isLoading: boolean;
  /** A refresh of what is shown, not the next page. */
  isRefreshing: boolean;
  /** True when loadMore() should fetch: more exists and none is in flight. */
  canLoadMore: boolean;
}

export function cursorListFlags(status: CursorQueryStatus): CursorListFlags {
  return {
    hasMore: status.hasNextPage,
    isLoading: status.isPending,
    isRefreshing: status.isRefetching && !status.isFetchingNextPage,
    canLoadMore: status.hasNextPage && !status.isFetchingNextPage,
  };
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) out[key] = sortKeys((value as Record<string, unknown>)[key]);
    return out;
  }
  return value;
}

/**
 * A stable string for a request body: object keys sorted at every level, so
 * the same logical body always maps to the same Idempotency-Key whatever order
 * a screen built it in. undefined fields drop out, as they do in JSON.
 */
export function bodyFingerprint(body: unknown): string {
  return JSON.stringify(sortKeys(body)) ?? 'undefined';
}
