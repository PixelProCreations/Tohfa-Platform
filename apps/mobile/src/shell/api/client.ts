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
import { Platform } from 'react-native';
import type { Problem, ProblemCode } from '@tohfa/shared-types';

export { formatErrorMessage, extractFieldErrors } from './errorService';

/**
 * In development, `http://localhost:3000` works via `adb reverse tcp:3000 tcp:3000`
 * on both physical Android devices and emulators, as well as iOS simulators.
 * If running on an Android emulator without adb reverse, it falls back to 10.0.2.2:3000.
 */
export let API_BASE_URL = 'http://localhost:3000';

export function setApiBaseUrl(url: string): void {
  API_BASE_URL = url;
}

/**
 * True when `url` is a plausible candidate for the Android-emulator
 * localhost workaround: it names `localhost` and we're actually running on
 * Android, where `localhost` means the emulator itself, not the dev machine
 * hosting the API. Shared by `request()`'s own retry below and by
 * `shell/uploads/uploader.ts`'s raw `fetch` of a presigned upload target
 * (`apps/api/src/storage/blobStorage.ts`'s dev-mode `LocalDiskBlobStorage`
 * bakes `http://localhost:3000` into every signed URL unconditionally), which
 * bypasses `request()` entirely and so cannot reuse the try/catch below.
 */
export function isAndroidLocalhostFallbackCandidate(url: string): boolean {
  return url.includes('localhost') && Platform.OS === 'android';
}

/** 10.0.2.2 is the Android emulator's special alias for the host loopback interface. */
export function toAndroidLocalhostFallbackUrl(url: string): string {
  return url.replace('localhost', '10.0.2.2');
}

export function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath === '/healthz' || normalizedPath.startsWith('/v1/')) {
    return `${API_BASE_URL}${normalizedPath}`;
  }
  return `${API_BASE_URL}/v1${normalizedPath}`;
}

/**
 * RFC 9457 extension members the API adds on top of `Problem` (shared-types
 * does not list them yet). All money values are decimal strings.
 * - `shortfall`/`balance`/`required`: `WALLET_INSUFFICIENT` only (BR-192;
 *   402 on transfers, 422 on checkout). `shortfall = required - balance`.
 * - `meta.topupLimits` `{min, max}`: `VALIDATION_FAILED` on POST /wallets/me/topups (BR-193).
 */
export interface ProblemExtensions {
  shortfall?: string | undefined;
  balance?: string | undefined;
  required?: string | undefined;
}

export interface WalletInsufficientDetails {
  shortfall: string;
  balance: string | null;
  required: string | null;
}

export interface TopupLimits {
  min: string;
  max: string;
}

/** Optional transport facts an `ApiError` carries next to the problem body. */
export interface ApiErrorInit {
  /**
   * Parsed `Retry-After` response header, in whole seconds (429 RATE_LIMITED,
   * OTP_RESEND_TOO_SOON, 503). `null` when the header was absent/unparseable.
   */
  retryAfterSeconds?: number | null | undefined;
}

export class ApiError extends Error {
  /** Seconds the server asked us to wait (`Retry-After`), or null. */
  readonly retryAfterSeconds: number | null;

  constructor(
    readonly problem: Problem & ProblemExtensions,
    init: ApiErrorInit = {},
  ) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.retryAfterSeconds = init.retryAfterSeconds ?? null;
  }

  /** HTTP status of the problem (mirrors `problem.status`). */
  get status(): number {
    return this.problem.status;
  }

  /**
   * TOHFA machine code -- THE field to branch on. Typed to the shared union,
   * but the server may add codes before shared-types learns them (e.g.
   * `SLOT_FULL`), so compare with `is()` or treat unknown strings as generic.
   */
  get code(): ProblemCode {
    return this.problem.code;
  }

  get detail(): string | undefined {
    return this.problem.detail;
  }

  /** Problem-specific context (`problem.meta`), never undefined. */
  get meta(): Record<string, unknown> {
    return this.problem.meta ?? {};
  }

  /**
   * `WALLET_INSUFFICIENT` details (top-level `shortfall`/`balance`/`required`,
   * falling back to `meta.shortfall`), or null for any other problem / when
   * the server sent no shortfall. Use `shortfall` to pre-fill the top-up.
   */
  get walletShortfall(): WalletInsufficientDetails | null {
    if (this.problem.code !== 'WALLET_INSUFFICIENT') return null;
    const money = (v: unknown): string | null => (typeof v === 'string' && /^\d+(\.\d{1,2})?$/.test(v) ? v : null);
    const shortfall = money(this.problem.shortfall) ?? money(this.meta['shortfall']);
    if (shortfall === null) return null;
    return {
      shortfall,
      balance: money(this.problem.balance) ?? money(this.meta['balance']),
      required: money(this.problem.required) ?? money(this.meta['required']),
    };
  }

  /** `meta.topupLimits` on a rejected top-up amount (BR-193), else null. */
  get topupLimits(): TopupLimits | null {
    const raw = this.meta['topupLimits'];
    if (typeof raw !== 'object' || raw === null) return null;
    const { min, max } = raw as { min?: unknown; max?: unknown };
    return typeof min === 'string' && typeof max === 'string' ? { min, max } : null;
  }

  /**
   * Field validation errors keyed by field name with the `body.`/`query.`/
   * `params.` prefix stripped, first message per field -- ready to bind to a
   * form input. Empty object when the problem has none.
   */
  get fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, messages] of Object.entries(this.problem.errors ?? {})) {
      const first = messages?.[0];
      if (first !== undefined) out[key.replace(/^(body|query|params)\./, '')] = first;
    }
    return out;
  }

  /**
   * `code` narrowed to the full `ProblemCode` union (domain `ErrorCode`s plus the generic
   * transport-level codes -- `CONFLICT`, `NOT_FOUND`, etc. -- from
   * `packages/shared-types/src/errors.ts`). Previously typed to `ErrorCode` alone, which made
   * `err.is('CONFLICT')` a compile error even though this file's own docblock says screens
   * should branch on `error.problem.code` via this method, never by comparing `problem.code`
   * inline. Also accepts any string, so a code the server sends before shared-types lists
   * it (e.g. `SLOT_FULL`) can still be matched.
   */
  is(code: ProblemCode | (string & {})): boolean {
    return this.problem.code === code;
  }
}

/**
 * Why a request never got an HTTP answer:
 * - `offline`: fetch itself failed (no connectivity, DNS, server down);
 * - `timeout`: our own deadline (`timeoutMs`, or the default 5 s) fired;
 * - `aborted`: the CALLER's signal aborted it (screen unmounted, query
 *   cancelled) -- not something to show the user.
 */
export type NetworkErrorReason = 'offline' | 'timeout' | 'aborted';

export class NetworkError extends Error {
  readonly reason: NetworkErrorReason;

  constructor(cause: unknown, reason: NetworkErrorReason = 'offline') {
    super('The network is unavailable. Your work is saved on this device.');
    this.name = 'NetworkError';
    this.reason = reason;
    Object.defineProperty(this, 'cause', { value: cause, enumerable: false });
  }
}

/** True for a transport failure the user should see ("offline / timed out, retry"). */
export function isNetworkError(err: unknown): err is NetworkError {
  return err instanceof NetworkError && err.reason !== 'aborted';
}

/**
 * `Retry-After` is either delta-seconds or an HTTP-date (RFC 9110 10.2.3).
 * Returns whole seconds >= 0, or null when absent/unparseable.
 */
export function parseRetryAfter(value: string | null | undefined, now: number = Date.now()): number | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const at = Date.parse(trimmed);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.ceil((at - now) / 1000));
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

/**
 * Paths where a 401 means "bad credentials", not "expired token": a refresh
 * and resend would only repeat the failure (and could sign the user out).
 * `/auth/customer/otp/*` is the passwordless customer login (BR-153): a wrong
 * OTP there is 401 OTP_INVALID and must never trigger refresh/sign-out.
 */
export const AUTH_SKIP_REFRESH_PATHS: readonly string[] = [
  '/auth/login',
  '/auth/refresh',
  '/auth/otp',
  '/auth/customer/otp',
  '/auth/me/change-password',
];

export function isAuthEndpoint(path: string): boolean {
  return AUTH_SKIP_REFRESH_PATHS.some((p) => path.includes(p));
}

/** Default deadline when the caller passes neither `signal` nor `timeoutMs`. */
export const DEFAULT_TIMEOUT_MS = 5000;

export interface RequestOptions {
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

  let response: Response;
  // Opt-in deadline (timeoutMs) covers the whole attempt, emulator fallback
  // included. Without it, the original behaviour below is unchanged.
  const deadline = options.timeoutMs === undefined ? null : linkedTimeoutSignal(options.signal, options.timeoutMs);
  const requestSignal = deadline?.signal ?? options.signal;
  const controller = deadline !== null || options.signal ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS) : null;
  const failureReason = (): NetworkErrorReason => {
    if (options.signal?.aborted === true) return 'aborted';
    if (deadline?.signal.aborted === true || controller?.signal.aborted === true) return 'timeout';
    return 'offline';
  };
  try {
    response = await fetch(resolveUrl(path), {
      method: options.method ?? 'GET',
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      signal: requestSignal ?? controller?.signal,
    });
  } catch (error) {
    const reason = failureReason();
    if (reason !== 'aborted' && isAndroidLocalhostFallbackCandidate(API_BASE_URL)) {
      try {
        const fallbackUrl = toAndroidLocalhostFallbackUrl(resolveUrl(path));
        response = await fetch(fallbackUrl, {
          method: options.method ?? 'GET',
          headers,
          ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
          ...(requestSignal === undefined ? {} : { signal: requestSignal }),
        });
        API_BASE_URL = 'http://10.0.2.2:3000';
      } catch {
        throw new NetworkError(error, failureReason());
      }
    } else {
      throw new NetworkError(error, reason);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    deadline?.dispose();
  }

  // Handle mid-session 401 token expiry with collapsed refresh and single retry.
  // On the AUTH_SKIP_REFRESH_PATHS endpoints a 401 means bad credentials, not an
  // expired token, so a refresh and resend would only repeat the failure.
  // change-password answers a wrong CURRENT password with 401: retrying it resent
  // the same wrong password (two rate-limiter strikes for one typo) and could sign
  // the user out if the refresh then failed.
  if (response.status === 401 && !options._isRetry && !isAuthEndpoint(path)) {
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
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      // A proxy/gateway HTML error page, or a truncated body: not JSON.
      payload = response.ok ? text : null;
    }
  }

  if (!response.ok) {
    const retryAfterSeconds = parseRetryAfter(readHeader(response, 'Retry-After'));
    if (isProblem(payload)) throw new ApiError(payload, { retryAfterSeconds });
    throw new ApiError(
      {
        type: 'about:blank',
        title: 'Request failed',
        status: response.status,
        code: fallbackCodeForStatus(response.status),
      },
      { retryAfterSeconds },
    );
  }

  return payload as T;
}

function readHeader(response: Response, name: string): string | null {
  // Test doubles sometimes hand back a bare object without a Headers instance.
  const headers = (response as { headers?: { get?: (n: string) => string | null } }).headers;
  return typeof headers?.get === 'function' ? headers.get(name) : null;
}

/** Best generic code for a non-problem error body, so callers can still branch. */
function fallbackCodeForStatus(status: number): ProblemCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 413:
      return 'PAYLOAD_TOO_LARGE';
    case 422:
      return 'VALIDATION_FAILED';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL';
  }
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

/** Per-call extras the `api.*` helpers accept (all optional). */
export type ApiCallOptions = Pick<RequestOptions, 'signal' | 'timeoutMs' | 'idempotencyKey'>;

function callOptions(extra: ApiCallOptions | undefined): RequestOptions {
  const out: RequestOptions = {};
  if (extra?.signal !== undefined) out.signal = extra.signal;
  if (extra?.timeoutMs !== undefined) out.timeoutMs = extra.timeoutMs;
  if (extra?.idempotencyKey !== undefined) out.idempotencyKey = extra.idempotencyKey;
  return out;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal, extra?: ApiCallOptions): Promise<T> =>
    request<T>(path, { ...callOptions(extra), ...(signal === undefined ? {} : { signal }) }),
  post: <T>(path: string, body: unknown, idempotencyKey?: string, extra?: ApiCallOptions): Promise<T> =>
    request<T>(path, {
      ...callOptions(extra),
      method: 'POST',
      body,
      ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
    }),
  patch: <T>(path: string, body: unknown, extra?: ApiCallOptions): Promise<T> =>
    request<T>(path, { ...callOptions(extra), method: 'PATCH', body }),
  put: <T>(path: string, body: unknown, extra?: ApiCallOptions): Promise<T> =>
    request<T>(path, { ...callOptions(extra), method: 'PUT', body }),
  delete: <T>(path: string, extra?: ApiCallOptions): Promise<T> =>
    request<T>(path, { ...callOptions(extra), method: 'DELETE' }),
};
