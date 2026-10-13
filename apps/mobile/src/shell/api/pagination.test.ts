import { describe, expect, it } from 'vitest';
import {
  buildQueryString,
  flattenOffsetPages,
  flattenPages,
  nextCursorOf,
  nextOffsetPageOf,
  type Page,
} from './pagination';

describe('buildQueryString', () => {
  it('returns an empty string when there is nothing to send', () => {
    expect(buildQueryString({})).toBe('');
    expect(buildQueryString({ a: undefined, b: null, c: '' })).toBe('');
  });

  it('keeps insertion order and encodes values', () => {
    expect(buildQueryString({ status: 'PENDING', q: 'a b&c', limit: 20 })).toBe(
      '?status=PENDING&q=a%20b%26c&limit=20',
    );
  });

  it('serialises booleans as the strings the API Zod schemas expect', () => {
    expect(buildQueryString({ isActive: false })).toBe('?isActive=false');
  });

  it('repeats a key for array values and skips empty arrays', () => {
    expect(buildQueryString({ status: ['A', 'B'], other: [] })).toBe('?status=A&status=B');
  });

  it('passes an opaque cursor through untouched apart from encoding', () => {
    // docs/openapi.yaml PageMeta: cursors are opaque and must not be parsed by clients.
    expect(buildQueryString({ cursor: 'WyIy=+/' })).toBe('?cursor=WyIy%3D%2B%2F');
  });
});

describe('cursor page helpers', () => {
  const p1: Page<number> = { items: [1, 2], page: { nextCursor: 'c2', hasMore: true } };
  const p2: Page<number> = { items: [3], page: { nextCursor: null, hasMore: false } };

  it('nextCursorOf returns the cursor only while hasMore is true', () => {
    expect(nextCursorOf(p1)).toBe('c2');
    expect(nextCursorOf(p2)).toBeUndefined();
    expect(nextCursorOf({ items: [], page: { nextCursor: 'x', hasMore: false } })).toBeUndefined();
  });

  it('flattenPages concatenates items in page order', () => {
    expect(flattenPages([p1, p2])).toEqual([1, 2, 3]);
    expect(flattenPages(undefined)).toEqual([]);
  });
});

describe('offset page helpers', () => {
  it('asks for the next page only while rows remain', () => {
    expect(nextOffsetPageOf({ items: [1, 2], page: 1, pageSize: 2, total: 5 })).toBe(2);
    expect(nextOffsetPageOf({ items: [5], page: 3, pageSize: 2, total: 5 })).toBeUndefined();
    expect(nextOffsetPageOf({ items: [], page: 1, pageSize: 20, total: 0 })).toBeUndefined();
  });

  it('stops on an empty page even if total claims more (rows deleted meanwhile)', () => {
    expect(nextOffsetPageOf({ items: [], page: 2, pageSize: 20, total: 50 })).toBeUndefined();
  });

  it('flattens pages in order', () => {
    expect(
      flattenOffsetPages([
        { items: ['a'], page: 1, pageSize: 1, total: 2 },
        { items: ['b'], page: 2, pageSize: 1, total: 2 },
      ]),
    ).toEqual(['a', 'b']);
    expect(flattenOffsetPages(undefined)).toEqual([]);
  });
});
