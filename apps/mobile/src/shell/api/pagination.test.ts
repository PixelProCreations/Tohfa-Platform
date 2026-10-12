/**
 * Cursor pagination helpers shared by every role (docs/openapi.yaml
 * `PageMeta`: `{ nextCursor: string | null, hasMore: boolean }`). Cursors are
 * opaque: these helpers only pass them back, never build or parse them.
 */
import { describe, expect, it, vi } from 'vitest';
import { buildQueryString, collectPages, nextPageParam, type Page } from './pagination';

describe('buildQueryString', () => {
  it('returns an empty string when there is nothing to send', () => {
    expect(buildQueryString({})).toBe('');
    expect(buildQueryString({ a: undefined, b: null })).toBe('');
  });

  it('drops undefined and null, keeps falsy values that mean something', () => {
    expect(buildQueryString({ status: 'OPEN', cursor: undefined, warehouseId: null, limit: 0, archived: false })).toBe(
      '?status=OPEN&limit=0&archived=false',
    );
  });

  it('encodes keys and values', () => {
    expect(buildQueryString({ q: 'a&b=c d', 'x y': '1' })).toBe('?q=a%26b%3Dc%20d&x%20y=1');
  });

  it('keeps insertion order so query keys are stable', () => {
    expect(buildQueryString({ b: 1, a: 2 })).toBe('?b=1&a=2');
  });
});

describe('nextPageParam', () => {
  it('returns the cursor while there are more pages', () => {
    expect(nextPageParam({ items: [], page: { nextCursor: 'c2', hasMore: true } })).toBe('c2');
  });

  it('returns undefined on the last page (TanStack Query stops on undefined)', () => {
    expect(nextPageParam({ items: [], page: { nextCursor: null, hasMore: false } })).toBeUndefined();
  });

  it('stops when hasMore is true but the server sent no cursor', () => {
    expect(nextPageParam({ items: [], page: { nextCursor: null, hasMore: true } })).toBeUndefined();
  });

  it('stops when hasMore is false even if a cursor is present', () => {
    expect(nextPageParam({ items: [], page: { nextCursor: 'c9', hasMore: false } })).toBeUndefined();
  });
});

describe('collectPages', () => {
  const pages: Page<number>[] = [
    { items: [1, 2], page: { nextCursor: 'c2', hasMore: true } },
    { items: [3], page: { nextCursor: 'c3', hasMore: true } },
    { items: [4], page: { nextCursor: null, hasMore: false } },
  ];

  it('walks the cursor to the end and reports complete', async () => {
    const fetchPage = vi.fn(async (cursor: string | undefined) => pages[cursor === undefined ? 0 : cursor === 'c2' ? 1 : 2]!);
    await expect(collectPages(fetchPage, 10)).resolves.toEqual({ items: [1, 2, 3, 4], complete: true });
    expect(fetchPage.mock.calls.map((c) => c[0])).toEqual([undefined, 'c2', 'c3']);
  });

  it('stops at maxPages and says the result is incomplete rather than passing it off as whole', async () => {
    const fetchPage = vi.fn(async (cursor: string | undefined) => ({
      items: [cursor ?? 'first'],
      page: { nextCursor: 'loop', hasMore: true },
    }));
    await expect(collectPages(fetchPage, 3)).resolves.toEqual({ items: ['first', 'loop', 'loop'], complete: false });
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('stops when the server says hasMore but sends no cursor', async () => {
    const fetchPage = vi.fn(async () => ({ items: ['x'], page: { nextCursor: null, hasMore: true } }));
    await expect(collectPages(fetchPage, 5)).resolves.toEqual({ items: ['x'], complete: true });
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('propagates a failed page instead of returning a partial list', async () => {
    const fetchPage = vi
      .fn<(cursor: string | undefined) => Promise<Page<number>>>()
      .mockResolvedValueOnce(pages[0]!)
      .mockRejectedValueOnce(new Error('boom'));
    await expect(collectPages(fetchPage, 5)).rejects.toThrow('boom');
  });
});
