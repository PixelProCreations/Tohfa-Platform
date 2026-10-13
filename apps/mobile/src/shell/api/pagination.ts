/**
 * List-envelope types and query-string building, shared by every role.
 *
 * docs/openapi.yaml has two list shapes:
 *  - cursor (`Page<T>`): `{ items, page: PageMeta }` — "All list endpoints are
 *    cursor-paginated" (Conventions). `PageMeta.nextCursor` is OPAQUE: clients
 *    pass it back verbatim as `?cursor=` and never parse or construct it.
 *  - offset (`OffsetPage<T>`): `{ items, page, pageSize, total }` — the older
 *    shape still used by e.g. `GET /warehouses`.
 */

/** docs/openapi.yaml `components.schemas.PageMeta`. */
export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
}

/** A cursor-paginated list response. */
export interface Page<T> {
  items: T[];
  page: PageMeta;
}

/** An offset-paginated list response (`page` is 1-based). */
export interface OffsetPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type QueryScalar = string | number | boolean;
export type QueryValue = QueryScalar | readonly QueryScalar[] | null | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

/**
 * `?a=1&b=2`, or `''` when nothing is set. `undefined`, `null` and `''` are
 * dropped so an unset filter is omitted rather than sent as an empty value the
 * server's Zod schema would reject. Arrays repeat the key.
 */
export function buildQueryString(params: QueryParams): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    const values: readonly QueryValue[] = Array.isArray(value) ? value : [value as QueryValue];
    for (const v of values) {
      if (v === undefined || v === null || v === '') continue;
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

/** The cursor for the page after `page`, or `undefined` when it was the last. */
export function nextCursorOf<T>(page: Page<T>): string | undefined {
  return page.page.hasMore && page.page.nextCursor !== null ? page.page.nextCursor : undefined;
}

export function flattenPages<T>(pages: readonly Page<T>[] | undefined): T[] {
  if (pages === undefined) return [];
  return pages.flatMap((p) => p.items);
}
