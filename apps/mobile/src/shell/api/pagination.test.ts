import { describe, expect, it } from 'vitest';
import { buildQueryString, flattenPages, nextCursorOf, type Page } from './pagination';

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
