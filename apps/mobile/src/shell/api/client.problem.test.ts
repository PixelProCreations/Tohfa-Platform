/**
 * Shared client: RFC 9457 problem+json parsing into ApiError, Retry-After,
 * the customer OTP refresh skip-list, NetworkError reasons, refresh-on-401
 * single-flight against the shared secure store, and Idempotency-Key reuse.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  NetworkError,
  api,
  configureTokenStorage,
  isAuthEndpoint,
  isNetworkError,
  parseRetryAfter,
  request,
  setAccessToken,
  setOnAuthFailure,
} from './client';
import { createIdempotencyKeyCache } from './idempotency';
import { __resetTokenCacheForTests, tokenStorage } from '../storage/secureTokenStorage';

const realFetch = global.fetch;

function problemResponse(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/problem+json', ...headers },
  });
}

afterEach(() => {
  global.fetch = realFetch;
  setAccessToken(null);
  configureTokenStorage(null);
  setOnAuthFailure(null);
  vi.useRealTimers();
});

describe('problem+json -> ApiError', () => {
  it('exposes status, code, detail, meta, fieldErrors and retryAfterSeconds', async () => {
    global.fetch = vi.fn(async () =>
      problemResponse(
        422,
        {
          type: 'about:blank',
          title: 'Validation failed',
          status: 422,
          code: 'VALIDATION_FAILED',
          detail: 'Bad body',
          errors: { 'body.amount': ['Must be positive', 'second'], 'query.limit': ['Too big'] },
          meta: { hint: 1 },
        },
        { 'Retry-After': '7' },
      ),
    ) as unknown as typeof fetch;

    const err = await request('/wallets/me/topups', { method: 'POST', body: {} }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const apiErr = err as ApiError;
    expect(apiErr.status).toBe(422);
    expect(apiErr.code).toBe('VALIDATION_FAILED');
    expect(apiErr.detail).toBe('Bad body');
    expect(apiErr.meta).toEqual({ hint: 1 });
    expect(apiErr.fieldErrors).toEqual({ amount: 'Must be positive', limit: 'Too big' });
    expect(apiErr.retryAfterSeconds).toBe(7);
    expect(apiErr.is('VALIDATION_FAILED')).toBe(true);
  });

  it('RATE_LIMITED 429 carries Retry-After seconds', async () => {
    global.fetch = vi.fn(async () =>
      problemResponse(
        429,
        { type: 'about:blank', title: 'Too many', status: 429, code: 'RATE_LIMITED' },
        { 'Retry-After': '42' },
      ),
    ) as unknown as typeof fetch;
    const err = (await api.get('/catalog').catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.retryAfterSeconds).toBe(42);
  });

  it('a non-JSON error body (gateway HTML) still becomes a typed ApiError with a status-derived code', async () => {
    global.fetch = vi.fn(async () => new Response('<html>Bad gateway</html>', { status: 502 })) as unknown as typeof fetch;
    const err = (await api.get('/catalog').catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(502);
    expect(err.code).toBe('INTERNAL');
    expect(err.retryAfterSeconds).toBeNull();
    expect(err.fieldErrors).toEqual({});
  });

  it('parseRetryAfter handles seconds, HTTP-dates and junk', () => {
    expect(parseRetryAfter('120')).toBe(120);
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('soon')).toBeNull();
    const now = Date.parse('2026-11-17T10:00:00Z');
    expect(parseRetryAfter('Tue, 17 Nov 2026 10:00:30 GMT', now)).toBe(30);
  });
});

describe('NetworkError reasons', () => {
  it('fetch failure is offline; caller abort is aborted (not user-visible)', async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    const offline = (await api.get('/catalog').catch((e: unknown) => e)) as NetworkError;
    expect(offline).toBeInstanceOf(NetworkError);
    expect(offline.reason).toBe('offline');
    expect(isNetworkError(offline)).toBe(true);

    const controller = new AbortController();
    global.fetch = vi.fn(async () => {
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    }) as unknown as typeof fetch;
    const aborted = (await api.get('/catalog', controller.signal).catch((e: unknown) => e)) as NetworkError;
    expect(aborted.reason).toBe('aborted');
    expect(isNetworkError(aborted)).toBe(false);
  });

  it('our own deadline firing is a timeout', async () => {
    vi.useFakeTimers();
    global.fetch = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    ) as unknown as typeof fetch;
    const pending = request('/catalog', { timeoutMs: 1000 }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1000);
    const err = (await pending) as NetworkError;
    expect(err.reason).toBe('timeout');
  });
});

describe('refresh skip-list', () => {
  it.each(['/auth/customer/otp/send', '/auth/customer/otp/verify', '/auth/refresh', '/auth/otp/verify'])(
    '%s is an auth endpoint (a 401 there is bad credentials, never refresh)',
    (path) => {
      expect(isAuthEndpoint(path)).toBe(true);
    },
  );

  it('a wrong customer OTP (401 OTP_INVALID) neither refreshes nor signs the user out', async () => {
    const onAuthFailure = vi.fn();
    setOnAuthFailure(onAuthFailure);
    const fetchMock = vi.fn(async () =>
      problemResponse(401, { type: 'about:blank', title: 'Bad code', status: 401, code: 'OTP_INVALID' }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const err = (await request('/auth/customer/otp/verify', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    )) as ApiError;
    expect(err.code).toBe('OTP_INVALID');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onAuthFailure).not.toHaveBeenCalled();
  });

  it('/auth/me is not on the skip-list', () => {
    expect(isAuthEndpoint('/auth/me')).toBe(false);
    expect(isAuthEndpoint('/customers/me')).toBe(false);
  });
});

describe('refresh-on-401 single-flight against THE shared secure store', () => {
  beforeEach(async () => {
    __resetTokenCacheForTests();
    await tokenStorage.clearTokens();
  });

  it('collapses concurrent 401s into one /auth/refresh and retries each with the new token', async () => {
    // What customer OTP login writes (roles/customer/storage re-exports this store).
    await tokenStorage.setTokens({ accessToken: 'old', refreshToken: 'r1' });
    configureTokenStorage(tokenStorage);
    setAccessToken('old');

    let refreshCalls = 0;
    global.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.endsWith('/v1/auth/refresh')) {
        refreshCalls += 1;
        await new Promise((r) => setTimeout(r, 5));
        return new Response(JSON.stringify({ accessToken: 'new', refreshToken: 'r2' }), { status: 200 });
      }
      const auth = (init?.headers as Record<string, string>)['Authorization'];
      if (auth === 'Bearer new') return new Response(JSON.stringify({ ok: u }), { status: 200 });
      return problemResponse(401, { type: 'about:blank', title: 'Expired', status: 401, code: 'UNAUTHENTICATED' });
    }) as unknown as typeof fetch;

    const results = await Promise.all([api.get('/wallets/me'), api.get('/cart'), api.get('/orders')]);
    expect(refreshCalls).toBe(1);
    expect(results).toHaveLength(3);
    expect(await tokenStorage.getTokens()).toEqual({ accessToken: 'new', refreshToken: 'r2' });
  });
});

describe('Idempotency-Key', () => {
  it('the same user action retried sends the same key; a changed body gets a new key', async () => {
    const seen: string[] = [];
    global.fetch = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      seen.push((init?.headers as Record<string, string>)['Idempotency-Key'] ?? '');
      return seen.length === 1
        ? problemResponse(500, { type: 'about:blank', title: 'boom', status: 500, code: 'INTERNAL' })
        : new Response(JSON.stringify({ ok: true }), { status: 201 });
    }) as unknown as typeof fetch;

    let n = 0;
    const cache = createIdempotencyKeyCache(() => `key-${++n}`);
    const send = (amount: string) =>
      api.post('/wallets/me/topups', { amount, mode: 'UPI' }, cache.keyFor(`${amount}|UPI`));

    await expect(send('100.00')).rejects.toBeInstanceOf(ApiError);
    await send('100.00'); // retry
    await send('200.00'); // edited amount
    expect(seen).toEqual(['key-1', 'key-1', 'key-2']);
  });
});
