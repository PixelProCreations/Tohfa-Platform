/**
 * Admin transport: the shared client plus a timeout and query-string support.
 *
 * Every admin `api/<module>.ts` calls these instead of `api.*` so that:
 *  - requests time out visibly (apps/mobile/CLAUDE.md "Offline": handle a
 *    timed-out request with a retry the user can understand) instead of
 *    hanging on a dead warehouse Wi-Fi;
 *  - writes can carry an `Idempotency-Key` on any verb, not just POST
 *    (root CLAUDE.md §2.4);
 *  - tests have one seam: this file calls the client's exported `request`,
 *    which `vi.mock('shell/api/client')` can intercept (see the comment in
 *    shell/auth/api.ts on why `api.*` cannot be spied on).
 *
 * No UI imports here; errors are the client's `ApiError`/`NetworkError`, plus
 * `AdminTimeoutError`. Mapping them to copy is api/errors.ts' job.
 */
import { request } from '../../../shell/api/client';
import { buildQueryString, type QueryParams } from '../../../shell/api/pagination';

/** Transport setting, not a business threshold. */
export const DEFAULT_TIMEOUT_MS = 20_000;

export class AdminTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Request timed out after ${timeoutMs} ms`);
    this.name = 'AdminTimeoutError';
  }
}

interface BaseOptions {
  /** Caller cancellation, e.g. React Query's `signal`. */
  signal?: AbortSignal | undefined;
  timeoutMs?: number | undefined;
}

export interface GetOptions extends BaseOptions {
  query?: QueryParams | undefined;
}

export interface WriteOptions extends BaseOptions {
  idempotencyKey?: string | undefined;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function withTimeout<T>(
  path: string,
  method: Method,
  body: unknown,
  opts: WriteOptions,
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onCallerAbort = (): void => controller.abort();
  if (opts.signal?.aborted === true) controller.abort();
  opts.signal?.addEventListener('abort', onCallerAbort);

  try {
    return await request<T>(path, {
      method,
      ...(body === undefined ? {} : { body }),
      ...(opts.idempotencyKey === undefined ? {} : { idempotencyKey: opts.idempotencyKey }),
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) throw new AdminTimeoutError(timeoutMs);
    throw error;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', onCallerAbort);
  }
}

export function adminGet<T>(path: string, opts: GetOptions = {}): Promise<T> {
  const qs = opts.query === undefined ? '' : buildQueryString(opts.query);
  return withTimeout<T>(`${path}${qs}`, 'GET', undefined, opts);
}

export function adminPost<T>(path: string, body: unknown, opts: WriteOptions = {}): Promise<T> {
  return withTimeout<T>(path, 'POST', body, opts);
}

export function adminPatch<T>(path: string, body: unknown, opts: WriteOptions = {}): Promise<T> {
  return withTimeout<T>(path, 'PATCH', body, opts);
}

export function adminPut<T>(path: string, body: unknown, opts: WriteOptions = {}): Promise<T> {
  return withTimeout<T>(path, 'PUT', body, opts);
}
