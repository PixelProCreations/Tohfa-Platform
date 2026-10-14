/**
 * The logic behind roles/admin/api/hooks.ts. Hooks cannot be rendered in this
 * plain-Node vitest setup (apps/mobile/CLAUDE.md "Testing"), so the hooks stay
 * thin wrappers over TanStack Query and every decision they make lives in
 * ../api/hookHelpers.ts, tested here.
 */
import { describe, expect, it } from 'vitest';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import { bodyFingerprint, cursorListFlags, flattenPages } from '../api/hookHelpers';

describe('flattenPages', () => {
  it('maps every item of every page, in order', () => {
    const pages = [
      { items: [1, 2], page: { nextCursor: 'c2', hasMore: true } },
      { items: [3], page: { nextCursor: null, hasMore: false } },
    ];
    expect(flattenPages(pages, (n: number) => `#${n}`)).toEqual(['#1', '#2', '#3']);
  });

  it('is empty before the first page arrives', () => {
    expect(flattenPages(undefined, (n: number) => n)).toEqual([]);
  });
});

describe('cursorListFlags', () => {
  const base = {
    hasNextPage: false,
    isPending: false,
    isFetchingNextPage: false,
    isRefetching: false,
  };

  it('hasMore follows hasNextPage', () => {
    expect(cursorListFlags({ ...base, hasNextPage: true }).hasMore).toBe(true);
    expect(cursorListFlags(base).hasMore).toBe(false);
  });

  it('isLoading only for the very first load', () => {
    expect(cursorListFlags({ ...base, isPending: true }).isLoading).toBe(true);
    expect(cursorListFlags({ ...base, isRefetching: true }).isLoading).toBe(false);
  });

  it('a pull-to-refresh is refreshing; loading the next page is not', () => {
    expect(cursorListFlags({ ...base, isRefetching: true }).isRefreshing).toBe(true);
    expect(cursorListFlags({ ...base, isRefetching: true, isFetchingNextPage: true }).isRefreshing).toBe(false);
  });

  it('canLoadMore is false while a page is already loading (no double fetch)', () => {
    expect(cursorListFlags({ ...base, hasNextPage: true }).canLoadMore).toBe(true);
    expect(cursorListFlags({ ...base, hasNextPage: true, isFetchingNextPage: true }).canLoadMore).toBe(false);
    expect(cursorListFlags({ ...base, hasNextPage: false }).canLoadMore).toBe(false);
  });
});

describe('bodyFingerprint (what useIdempotencyKey keys on)', () => {
  it('the same body in a different key order is the same operation', () => {
    expect(bodyFingerprint({ amount: '500.00', customerId: 'c1' })).toBe(
      bodyFingerprint({ customerId: 'c1', amount: '500.00' }),
    );
  });

  it('nested objects are ordered too; arrays keep their order', () => {
    expect(bodyFingerprint({ a: { y: 1, x: 2 }, l: [2, 1] })).toBe(bodyFingerprint({ l: [2, 1], a: { x: 2, y: 1 } }));
    expect(bodyFingerprint({ l: [1, 2] })).not.toBe(bodyFingerprint({ l: [2, 1] }));
  });

  it('a changed value is a different operation', () => {
    expect(bodyFingerprint({ amount: '500.00' })).not.toBe(bodyFingerprint({ amount: '500.01' }));
  });

  it('undefined fields are ignored, as they are on the wire', () => {
    expect(bodyFingerprint({ amount: '1.00', note: undefined })).toBe(bodyFingerprint({ amount: '1.00' }));
  });

  it('with the key cache: same body reuses the key, a changed body gets a new one', () => {
    let n = 0;
    const cache = createIdempotencyKeyCache(() => `k-${++n}`);
    const keyFor = (body: unknown) => cache.keyFor(bodyFingerprint(body));
    expect(keyFor({ amount: '500.00', customerId: 'c1' })).toBe('k-1');
    expect(keyFor({ customerId: 'c1', amount: '500.00' })).toBe('k-1');
    expect(keyFor({ customerId: 'c1', amount: '600.00' })).toBe('k-2');
  });
});
