/**
 * Pagination shapes and helpers shared by every role.
 *
 * Most list endpoints page by cursor (docs/openapi.yaml `PageMeta`). Cursors
 * are opaque: nothing here builds or parses one, it only passes back what the
 * server sent. A few endpoints (storage locations) page by number instead;
 * `OffsetPage` mirrors those.
 */

/** docs/openapi.yaml `PageMeta`. */
export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

/** One page of a cursor-paged list: `{ items, page }`. */
export interface Page<T> {
  items: T[];
  page: PageMeta;
}

/** One page of a number-paged list (e.g. `StorageLocationList`). */
export interface OffsetPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

/**
 * `?a=1&b=2` from `params`, in insertion order, or '' when nothing is left.
 * undefined and null are dropped (the filter is simply not sent); false, 0 and
 * '' are kept because they are real values.
 */
export function buildQueryString(params: QueryParams): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

/**
 * The cursor for the page after `lastPage`, or undefined when there is none
 * (TanStack Query's getNextPageParam stops on undefined). A page that says
 * `hasMore` but carries no cursor is treated as the last one.
 */
export function nextPageParam(lastPage: Page<unknown>): string | undefined {
  return lastPage.page.hasMore && lastPage.page.nextCursor !== null ? lastPage.page.nextCursor : undefined;
}

/** Every item of a cursor walk; `complete` is false only when `maxPages` stopped it early. */
export interface CollectedPages<T> {
  items: T[];
  complete: boolean;
}

/**
 * Walks a cursor list to the end. `maxPages` guards against a server bug
 * looping the cursor; it is not a business limit. When it trips, the result
 * says so (`complete: false`) rather than passing a partial list off as the
 * whole thing. A failed page rejects the whole walk.
 */
export async function collectPages<T>(
  fetchPage: (cursor: string | undefined) => Promise<Page<T>>,
  maxPages: number,
): Promise<CollectedPages<T>> {
  const items: T[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < maxPages; i += 1) {
    const page = await fetchPage(cursor);
    items.push(...page.items);
    const next = nextPageParam(page);
    if (next === undefined) return { items, complete: true };
    cursor = next;
  }
  return { items, complete: false };
}
