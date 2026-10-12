/**
 * request(): the opt-in `timeoutMs`.
 *
 * Before it existed, passing a `signal` switched off the client's 5-second
 * timeout entirely, so a caller that wanted to cancel a request (a screen
 * unmounting, TanStack Query's own signal) also lost the timeout and could
 * hang on a dead connection. `timeoutMs` keeps both: the request aborts after
 * `timeoutMs` OR when the caller's signal aborts, whichever comes first.
 * Callers that do not pass it keep the old behaviour exactly.
 *
 * The other client tests (silent refresh on 401) live in
 * roles/farmer/tests/token_refresh.test.ts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NetworkError, request, setAccessToken } from './client';

type FetchArgs = [RequestInfo | URL, RequestInit | undefined];

/** A fetch that never answers, and rejects like the real one when its signal aborts. */
function hangingFetch() {
  return vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) return;
      if (signal.aborted) reject(new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  });
}

function okFetch(body: unknown) {
  return vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify(body), { status: 200 }));
}

const realFetch = global.fetch;

beforeEach(() => {
  vi.useFakeTimers();
  setAccessToken(null);
});

afterEach(() => {
  vi.useRealTimers();
  global.fetch = realFetch;
});

describe('request() timeoutMs', () => {
  it('aborts after timeoutMs even when the caller passed its own signal', async () => {
    const fetchMock = hangingFetch();
    global.fetch = fetchMock as unknown as typeof fetch;
    const caller = new AbortController();

    const pending = request('/things', { signal: caller.signal, timeoutMs: 2000 });
    const assertion = expect(pending).rejects.toBeInstanceOf(NetworkError);
    await vi.advanceTimersByTimeAsync(1999);
    expect(caller.signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    // The caller's own signal is left alone: the timeout aborts a linked one.
    expect(caller.signal.aborted).toBe(false);
  });

  it('aborts when the caller aborts before the timeout', async () => {
    const fetchMock = hangingFetch();
    global.fetch = fetchMock as unknown as typeof fetch;
    const caller = new AbortController();

    const pending = request('/things', { signal: caller.signal, timeoutMs: 30_000 });
    const assertion = expect(pending).rejects.toBeInstanceOf(NetworkError);
    caller.abort();
    await assertion;
  });

  it('aborts at once when the caller signal is already aborted', async () => {
    const fetchMock = hangingFetch();
    global.fetch = fetchMock as unknown as typeof fetch;
    const caller = new AbortController();
    caller.abort();

    await expect(request('/things', { signal: caller.signal, timeoutMs: 30_000 })).rejects.toBeInstanceOf(NetworkError);
  });

  it('aborts after timeoutMs with no caller signal', async () => {
    const fetchMock = hangingFetch();
    global.fetch = fetchMock as unknown as typeof fetch;

    const pending = request('/things', { timeoutMs: 1500 });
    const assertion = expect(pending).rejects.toBeInstanceOf(NetworkError);
    await vi.advanceTimersByTimeAsync(1500);
    await assertion;
  });

  it('does not leave a timer or a listener behind once the request settles', async () => {
    const fetchMock = okFetch({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    const caller = new AbortController();
    const remove = vi.spyOn(caller.signal, 'removeEventListener');

    await expect(request('/things', { signal: caller.signal, timeoutMs: 2000 })).resolves.toEqual({ ok: true });
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});

describe('request() without timeoutMs (existing callers unchanged)', () => {
  it('still times out after the default 5 seconds when no signal is passed', async () => {
    const fetchMock = hangingFetch();
    global.fetch = fetchMock as unknown as typeof fetch;

    const pending = request('/things');
    const assertion = expect(pending).rejects.toBeInstanceOf(NetworkError);
    await vi.advanceTimersByTimeAsync(4999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
  });

  it('passes the caller signal straight through and adds no timeout of its own', async () => {
    const fetchMock = hangingFetch();
    global.fetch = fetchMock as unknown as typeof fetch;
    const caller = new AbortController();

    let settled = false;
    const pending = request('/things', { signal: caller.signal }).catch((e: unknown) => {
      settled = true;
      throw e;
    });
    const call = fetchMock.mock.calls[0] as FetchArgs | undefined;
    expect(call?.[1]?.signal).toBe(caller.signal);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(settled).toBe(false);
    caller.abort();
    await expect(pending).rejects.toBeInstanceOf(NetworkError);
  });
});
