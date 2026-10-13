import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAdminMutation, useCursorList, useIdempotencyKey } from '../api/hooks';
import type { Page } from '../../../shell/api/pagination';

function newClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
}

/** Renders `hook` inside a provider and exposes its latest return value. */
function renderHook<T>(hook: () => T, client = newClient()): { current: () => T; client: QueryClient } {
  let latest: T | undefined;
  function Probe(): null {
    latest = hook();
    return null;
  }
  act(() => {
    renderer.create(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
  });
  return { current: () => latest as T, client };
}

async function flush(): Promise<void> {
  // React Query batches notifications on a timer; give it a few ticks.
  for (let i = 0; i < 5; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 5));
    });
  }
}

describe('useIdempotencyKey', () => {
  it('BR-17b: an identical-body retry reuses the key; reset() starts a new operation', () => {
    const h = renderHook(() => useIdempotencyKey());
    const k1 = h.current().keyFor({ amount: '100.00' });
    expect(h.current().keyFor({ amount: '100.00' })).toBe(k1);
    expect(h.current().keyFor({ amount: '200.00' })).not.toBe(k1);
    h.current().reset();
    expect(h.current().keyFor({ amount: '100.00' })).not.toBe(k1);
  });
});

describe('useCursorList', () => {
  it('passes the previous nextCursor back and flattens pages; stops when hasMore is false', async () => {
    const pages: Record<string, Page<string>> = {
      first: { items: ['a', 'b'], page: { nextCursor: 'c2', hasMore: true } },
      c2: { items: ['c'], page: { nextCursor: null, hasMore: false } },
    };
    const fetchPage = vi.fn(async (cursor: string | undefined) => pages[cursor ?? 'first']!);
    const h = renderHook(() => useCursorList(['admin', 'test', 'list'], fetchPage));
    await flush();
    expect(h.current().items).toEqual(['a', 'b']);
    expect(h.current().hasMore).toBe(true);

    await act(async () => {
      h.current().loadMore();
    });
    await flush();
    expect(fetchPage.mock.calls.map((c) => c[0])).toEqual([undefined, 'c2']);
    expect(h.current().items).toEqual(['a', 'b', 'c']);
    expect(h.current().hasMore).toBe(false);

    // loadMore at the end is a no-op, not a refetch of the last page.
    await act(async () => {
      h.current().loadMore();
    });
    await flush();
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});

describe('useAdminMutation', () => {
  it('invalidates the given keys after success so lists refresh', async () => {
    const client = newClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const mutationFn = vi.fn(async (vars: { id: string }) => ({ ok: vars.id }));
    const h = renderHook(
      () => useAdminMutation(mutationFn, { invalidate: [['admin', 'wh', 'w1', 'returns']] }),
      client,
    );
    await act(async () => {
      await h.current().mutateAsync({ id: 'r1' });
    });
    expect(mutationFn).toHaveBeenCalledTimes(1);
    expect(mutationFn.mock.calls[0]![0]).toEqual({ id: 'r1' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'wh', 'w1', 'returns'] });
  });

  it('does not invalidate on failure', async () => {
    const client = newClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const h = renderHook(
      () =>
        useAdminMutation(async () => {
          throw new Error('nope');
        }, { invalidate: [['x']] }),
      client,
    );
    await act(async () => {
      await h.current().mutateAsync(undefined).catch(() => undefined);
    });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
