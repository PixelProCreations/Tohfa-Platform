/**
 * usePagedRecords: a page-one reload (refresh / retry / new animal) aborts an
 * in-flight load-more. The aborted load-more skips its own `finally`, so the
 * reload itself must clear `loadingMore`; otherwise the "show more" control
 * stays stuck in its spinner and `loadMore` refuses every later call.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

vi.mock('../../../shell/api/client', () => ({ api: { get: vi.fn(), post: vi.fn() } }));

import { usePagedRecords, type PagedRecords } from '../screens/farm/livestock/useAnimalRecords';
import type { RecordsPage } from '../api/livestock';

type Row = { id: string };

function page(ids: string[], nextCursor: string | null): RecordsPage<Row> {
  return { items: ids.map((id) => ({ id })), page: { nextCursor, hasMore: nextCursor !== null } };
}

describe('usePagedRecords', () => {
  it('a page-one reload that aborts an in-flight load-more clears loadingMore', async () => {
    let resolvePageOne: ((p: RecordsPage<Row>) => void) | null = null;
    const fetchPage = vi.fn((_id: string, cursor: string | undefined, signal: AbortSignal) => {
      if (cursor === undefined) {
        if (fetchPage.mock.calls.length === 1) return Promise.resolve(page(['r1'], 'c1'));
        return new Promise<RecordsPage<Row>>((resolve) => {
          resolvePageOne = resolve;
        });
      }
      // The load-more only ever settles by being aborted.
      return new Promise<RecordsPage<Row>>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    });

    let latest!: PagedRecords<Row>;
    function Harness(): null {
      latest = usePagedRecords<Row>('animal-1', fetchPage, true);
      return null;
    }

    await act(async () => {
      renderer.create(<Harness />);
    });
    expect(latest.state).toBe('ready');
    expect(latest.hasMore).toBe(true);

    await act(async () => {
      latest.loadMore();
    });
    expect(latest.loadingMore).toBe(true);

    await act(async () => {
      latest.refresh();
    });
    await act(async () => {
      resolvePageOne!(page(['r1', 'r2'], 'c2'));
    });

    expect(latest.items.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(latest.loadingMore).toBe(false);

    // And load-more works again afterwards.
    await act(async () => {
      latest.loadMore();
    });
    expect(fetchPage.mock.calls.filter((c) => c[1] === 'c2')).toHaveLength(1);
  });
});
