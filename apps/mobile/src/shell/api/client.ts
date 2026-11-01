/**
 * Typed API client — shared by every role flavour.
 *
 * One place that knows about base URLs, bearer tokens, correlation ids and
 * problem+json. Screens call `api.get<T>(path)` and catch `ApiError`, branching
 * on `error.problem.code` — never on the message text.
 *
 * This lives in src/shell/ because all three binaries ship it. That placement
 * is what forces the token-storage seam below: src/tests/cross_role_import_guard
 * .test.ts enforces that nothing under src/shell/ may import from src/roles/,
 * and shared transport code has no business hard-depending on one specific
 * role's copy of a token store anyway.
 */
import { NativeModules, Platform } from 'react-native';
import type { Problem, ProblemCode } from '@tohfa/shared-types';

export { formatErrorMessage, extractFieldErrors } from './errorService';

/**
 * Extracts the dev machine's host/IP from Metro's SourceCode bundle URL.
 * When running on a physical device over Wi-Fi or USB, NativeModules.SourceCode.scriptURL
 * contains the real IP (e.g., "http://10.210.219.253:8081/index.bundle?...").
 */
export function getMetroDevHost(): string | null {
  try {
    const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
    if (scriptURL && typeof scriptURL === 'string') {
      const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
      if (match && match[1] && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch {}
  return null;
}

/**
 * Builds candidate dev API base URLs in priority order.
 */
export function getDevCandidateBaseUrls(): string[] {
  const urls: string[] = [];
  const metroHost = getMetroDevHost();
  if (metroHost) {
    urls.push(`http://${metroHost}:3000`);
  }
  urls.push('http://localhost:3000');
  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:3000');
  }
  urls.push('http://10.210.219.253:3000');
  return Array.from(new Set(urls));
}

/**
 * In development, automatically detects Metro host, falling back to Android emulator (10.0.2.2)
 * or USB/localhost (3000).
 */
export let API_BASE_URL = (() => {
  const metroHost = getMetroDevHost();
  if (metroHost) return `http://${metroHost}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
})();

export function setApiBaseUrl(url: string): void {
  API_BASE_URL = url;
}

/**
 * True when `url` is a candidate for the Android host-loopback fallback:
 * it names `localhost` or `10.0.2.2` and we are running on Android.
 */
export function isAndroidLocalhostFallbackCandidate(url: string): boolean {
  return Platform.OS === 'android' && (url.includes('localhost') || url.includes('10.0.2.2'));
}

/**
 * Swaps between the Android emulator's special alias (10.0.2.2) and
 * localhost (for physical devices with adb reverse).
 */
export function toAndroidLocalhostFallbackUrl(url: string): string {
  if (url.includes('10.0.2.2')) {
    return url.replace('10.0.2.2', 'localhost');
  }
  return url.replace('localhost', '10.0.2.2');
}

export function resolveUrl(path: string, base: string = API_BASE_URL): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (base === API_BASE_URL && (API_BASE_URL.includes('10.0.2.2') || API_BASE_URL.includes('localhost'))) {
    const metroHost = getMetroDevHost();
    if (metroHost && metroHost !== '10.0.2.2' && metroHost !== 'localhost') {
      API_BASE_URL = `http://${metroHost}:3000`;
      base = API_BASE_URL;
    }
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath === '/healthz' || normalizedPath.startsWith('/v1/')) {
    return `${base}${normalizedPath}`;
  }
  return `${base}/v1${normalizedPath}`;
}

export class ApiError extends Error {
  constructor(readonly problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
  }

  /**
   * `code` narrowed to the full `ProblemCode` union (domain `ErrorCode`s plus the generic
   * transport-level codes -- `CONFLICT`, `NOT_FOUND`, etc. -- from
   * `packages/shared-types/src/errors.ts`). Previously typed to `ErrorCode` alone, which made
   * `err.is('CONFLICT')` a compile error even though this file's own docblock says screens
   * should branch on `error.problem.code` via this method, never by comparing `problem.code`
   * inline. Widening is source-compatible with every existing call site: `ErrorCode` is a
   * subset of `ProblemCode`.
   */
  is(code: ProblemCode): boolean {
    return this.problem.code === code;
  }
}

export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('The network is unavailable. Your work is saved on this device.');
    this.name = 'NetworkError';
    Object.defineProperty(this, 'cause', { value: cause, enumerable: false });
  }
}

export interface StoredAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * The slice of a role's token store that the refresh path needs. Each role's
 * own src/roles/<role>/storage/tokenStorage.ts already satisfies this
 * structurally, so no adapter is required at the call site.
 */
export interface TokenStorageLike {
  getTokens(): Promise<StoredAuthTokens | null>;
  setTokens(tokens: StoredAuthTokens): Promise<void>;
  clearTokens(): Promise<void>;
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onAuthFailureCallback: (() => void) | null = null;
let tokenStorage: TokenStorageLike | null = null;

/**
 * Injected once at app startup by each role's App.tsx. Until it is called the
 * client still works for every unauthenticated call; only the silent
 * refresh-on-401 path needs a store, and it degrades to "refresh failed"
 * rather than crashing when there is none.
 */
export function configureTokenStorage(storage: TokenStorageLike | null): void {
  tokenStorage = storage;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnAuthFailure(callback: (() => void) | null): void {
  onAuthFailureCallback = callback;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | undefined;
  body?: unknown | undefined;
  /** Required on every non-idempotent write. See docs/rules.md. */
  idempotencyKey?: string | undefined;
  signal?: AbortSignal | undefined;
  /**
   * Opt-in deadline (ms) for this request. When set, the request aborts after
   * `timeoutMs` OR when `signal` aborts, whichever comes first. Without it the
   * old rule stands: a 5 s timeout only when no `signal` is passed, none at
   * all when one is (so a caller's signal used to switch the timeout off).
   */
  timeoutMs?: number | undefined;
  _isRetry?: boolean | undefined;
}

/**
 * A signal that aborts after `timeoutMs` or when `outer` aborts. Linked by
 * hand with an 'abort' listener rather than `AbortSignal.any`/`.timeout`,
 * which Hermes does not ship. `outer` itself is never aborted by the timeout.
 * `dispose` clears the timer and the listener once the request settles.
 */
function linkedTimeoutSignal(
  outer: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onOuterAbort = (): void => controller.abort();
  if (outer !== undefined) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', onOuterAbort);
  }
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      outer?.removeEventListener('abort', onOuterAbort);
    },
  };
}

function correlationId(): string {
  // RN has no crypto.randomUUID on older Androids; this is only a log key.
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Collapses concurrent 401s into a single POST /auth/refresh call.
 * Other in-flight requests queue behind this promise.
 */
export async function refreshAuthTokens(): Promise<string | null> {
  if (refreshPromise !== null) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    // Read the store once, up front: a configureTokenStorage() call racing
    // this refresh must not swap the store out from under it halfway through.
    const storage = tokenStorage;
    try {
      if (storage === null) {
        // No store configured is not a crash, it is simply a refresh that
        // cannot happen — same fallthrough as a missing refresh token.
        throw new Error('No token storage configured');
      }

      const tokens = await storage.getTokens();
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const refreshUrl = resolveUrl('/auth/refresh');
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-correlation-id': correlationId(),
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh rejected with status ${response.status}`);
      }

      const payload = (await response.json()) as { accessToken: string; refreshToken: string };
      setAccessToken(payload.accessToken);
      await storage.setTokens({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      });
      return payload.accessToken;
    } catch {
      // Genuinely failed refresh: clear Keychain/tokens without clearing registration draft
      setAccessToken(null);
      await storage?.clearTokens();
      onAuthFailureCallback?.();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-correlation-id': correlationId(),
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken !== null) headers['Authorization'] = `Bearer ${accessToken}`;
  if (options.idempotencyKey !== undefined) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  let response!: Response;
  // Opt-in deadline (timeoutMs) covers the whole attempt, emulator fallback
  // included. Without it, the original behaviour below is unchanged.
  const deadline = options.timeoutMs === undefined ? null : linkedTimeoutSignal(options.signal, options.timeoutMs);
  const requestSignal = deadline?.signal ?? options.signal;
  const controller = deadline !== null || options.signal ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
  try {
    response = await fetch(resolveUrl(path), {
      method: options.method ?? 'GET',
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: requestSignal ?? controller?.signal,
    });
  } catch (error) {
    const primaryUrl = resolveUrl(path);
    const candidates = getDevCandidateBaseUrls().filter((c) => !primaryUrl.startsWith(c));
    let lastError: unknown = error;
    let succeeded = false;

    for (const candidate of candidates) {
      const fallbackUrl = resolveUrl(path, candidate);
      const fallbackController = deadline !== null || options.signal ? null : new AbortController();
      const fallbackTimeoutId = fallbackController ? setTimeout(() => fallbackController.abort(), 2500) : null;
      try {
        response = await fetch(fallbackUrl, {
          method: options.method ?? 'GET',
          headers,
          ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
          signal: requestSignal ?? fallbackController?.signal,
        });
        API_BASE_URL = candidate;
        succeeded = true;
        if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
        break;
      } catch (fbErr) {
        lastError = fbErr;
        if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
      }
    }

    if (!succeeded) {
      throw new NetworkError(lastError ?? error);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    deadline?.dispose();
  }

  // Handle mid-session 401 token expiry with collapsed refresh and single retry.
  // On these endpoints a 401 means bad credentials, not an expired token, so a refresh
  // and resend would only repeat the failure. change-password answers a wrong CURRENT
  // password with 401: retrying it resent the same wrong password (two rate-limiter
  // strikes for one typo) and could sign the user out if the refresh then failed.
  const isAuthEndpoint =
    path.includes('/auth/login') ||
    path.includes('/auth/refresh') ||
    path.includes('/auth/otp') ||
    path.includes('/auth/me/change-password');

  if (response.status === 401 && !options._isRetry && !isAuthEndpoint) {
    const newAccessToken = await refreshAuthTokens();
    if (newAccessToken !== null) {
      return request<T>(path, {
        ...options,
        _isRetry: true,
      });
    }
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload: unknown = text.length === 0 ? null : JSON.parse(text);

  if (!response.ok) {
    if (isProblem(payload)) throw new ApiError(payload);
    throw new ApiError({
      type: 'about:blank',
      title: 'Request failed',
      status: response.status,
      code: 'INTERNAL',
    });
  }

  return payload as T;
}

function isProblem(value: unknown): value is Problem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'status' in value &&
    'title' in value
  );
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal): Promise<T> =>
    request<T>(path, signal === undefined ? {} : { signal }),
  post: <T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> =>
    request<T>(path, {
      method: 'POST',
      body,
      ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
    }),
  patch: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body: unknown): Promise<T> =>
    request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string): Promise<T> =>
    request<T>(path, { method: 'DELETE' }),
};
