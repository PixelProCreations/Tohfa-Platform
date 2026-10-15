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
import { ApiError, NetworkError, configureTokenStorage, request, setAccessToken } from './client';

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

/**
 * request(): which endpoints skip the refresh-and-retry-on-401 path.
 *
 * A 401 normally means "your access token expired": the client refreshes once and resends.
 * For an auth endpoint a 401 means something else -- bad credentials, a bad OTP, a bad
 * refresh token -- and resending only repeats the failure. `POST /auth/me/change-password`
 * answers a wrong CURRENT password with 401 too; treating that as an expired token silently
 * resent the same wrong password (two strikes against the rate limiter for one typo) and could
 * sign the user out if the refresh then failed.
 */
describe('request() 401 refresh-and-retry exclusions', () => {
  const unauthorized = () =>
    new Response(
      JSON.stringify({ type: 'about:blank', title: 'Unauthorized', status: 401, code: 'UNAUTHORIZED' }),
      { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
    );

  function memoryStore() {
    let tokens: { accessToken: string; refreshToken: string } | null = {
      accessToken: 'old-access',
      refreshToken: 'refresh-1',
    };
    return {
      getTokens: async () => tokens,
      setTokens: async (next: { accessToken: string; refreshToken: string }) => {
        tokens = next;
      },
      clearTokens: async () => {
        tokens = null;
      },
    };
  }

  /** 401s every call made with the old token; the refresh itself succeeds. */
  function refreshingFetch() {
    return vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      if (String(url).endsWith('/v1/auth/refresh') && init?.method === 'POST') {
        return new Response(JSON.stringify({ accessToken: 'new-access', refreshToken: 'refresh-2' }), {
          status: 200,
        });
      }
      const headers = (init?.headers ?? {}) as Record<string, string>;
      if (headers['Authorization'] === 'Bearer new-access') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return unauthorized();
    });
  }

  const refreshCalls = (fetchMock: ReturnType<typeof refreshingFetch>) =>
    fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/v1/auth/refresh')).length;

  beforeEach(() => {
    vi.useRealTimers();
    configureTokenStorage(memoryStore());
    setAccessToken('old-access');
  });

  afterEach(() => {
    configureTokenStorage(null);
    setAccessToken(null);
  });

  it('does not refresh-and-resend when a wrong current password on /auth/me/change-password returns 401', async () => {
    const fetchMock = refreshingFetch();
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      request('/auth/me/change-password', {
        method: 'POST',
        body: { currentPassword: 'typo', newPassword: 'Str0ng!Passw0rd' },
      }),
    ).rejects.toBeInstanceOf(ApiError);

    // Exactly one attempt: no refresh, and the wrong password was not sent a second time.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(refreshCalls(fetchMock)).toBe(0);
  });

  it.each(['/auth/login', '/auth/refresh', '/auth/otp/verify'])(
    'still excludes the original auth endpoint %s from refresh-and-retry',
    async (path) => {
      // Always 401, so a refresh attempt (were one made) would show up as a second call.
      const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => unauthorized());
      global.fetch = fetchMock as unknown as typeof fetch;

      await expect(request(path, { method: 'POST', body: {} })).rejects.toBeInstanceOf(ApiError);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['/auth/me', '/auth/me/sessions', '/admin/orders'])(
    'still refreshes once and retries a 401 from the ordinary endpoint %s',
    async (path) => {
      const fetchMock = refreshingFetch();
      global.fetch = fetchMock as unknown as typeof fetch;

      await expect(request(path)).resolves.toEqual({ ok: true });
      expect(refreshCalls(fetchMock)).toBe(1);
      // the original 401, the refresh, and the successful retry
      expect(fetchMock).toHaveBeenCalledTimes(3);
    },
  );
});
