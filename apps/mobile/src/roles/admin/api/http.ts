/**
 * The one HTTP layer the admin API modules (roles/admin/api/<module>.ts) call.
 * It adds nothing but the query string and a request timeout on top of the
 * shared client (src/shell/api/client.ts), which already handles the bearer
 * token, the silent refresh on 401, correlation ids and problem+json errors
 * (`ApiError`, `NetworkError`).
 *
 * No UI imports, so the Main Warehouse admin can reuse every module later.
 */
import { request } from '../../../shell/api/client';
import { buildQueryString, type QueryParams } from '../../../shell/api/pagination';

/**
 * How long an admin request may take before it is abandoned and surfaces as
 * a NetworkError the screen can offer a retry for. A technical timeout on the
 * transport, NOT a business threshold (root CLAUDE.md 2.7 does not apply):
 * it only bounds how long a screen waits on a dead connection. It applies even
 * when a caller passes its own signal (TanStack Query always does).
 */
export const ADMIN_REQUEST_TIMEOUT_MS = 15_000;

export interface AdminWriteOptions {
  /** Required by the server on writes that move money (root CLAUDE.md 2.4). */
  idempotencyKey?: string | undefined;
  signal?: AbortSignal | undefined;
}

type WriteMethod = 'POST' | 'PATCH' | 'PUT';

function write<T>(method: WriteMethod, path: string, body: unknown, options: AdminWriteOptions): Promise<T> {
  return request<T>(path, {
    method,
    body,
    ...(options.idempotencyKey === undefined ? {} : { idempotencyKey: options.idempotencyKey }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
  });
}

/** GET `path` plus `query` (undefined and null values are not sent). */
export function adminGet<T>(path: string, query?: QueryParams, signal?: AbortSignal): Promise<T> {
  return request<T>(`${path}${query === undefined ? '' : buildQueryString(query)}`, {
    method: 'GET',
    ...(signal === undefined ? {} : { signal }),
    timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
  });
}

export function adminPost<T>(path: string, body: unknown, options: AdminWriteOptions = {}): Promise<T> {
  return write<T>('POST', path, body, options);
}

export function adminPatch<T>(path: string, body: unknown, options: AdminWriteOptions = {}): Promise<T> {
  return write<T>('PATCH', path, body, options);
}

export function adminPut<T>(path: string, body: unknown, options: AdminWriteOptions = {}): Promise<T> {
  return write<T>('PUT', path, body, options);
}
