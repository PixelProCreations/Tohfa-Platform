/**
 * The API liveness probe (docs/openapi.yaml /healthz, public, no permission):
 *   GET /healthz   -> { status: 'ok' }
 *
 * Liveness only: it touches no dependency, so "ok" means the process answers,
 * not that Postgres or Redis are healthy. The shell client sends /healthz to
 * the API root (it is the one unversioned path), so this module passes it as
 * is. `latencyMs` is the client-measured round trip of this one call, not a
 * server-side percentile.
 *
 * No UI imports, so any admin area can reuse it.
 */
import { adminGet } from './http';

/** The body the server sends; only `status` is relied on. */
export interface HealthzDto {
  status: string;
}

export interface HealthCheck {
  /** True when the probe answered with status 'ok'. */
  ok: boolean;
  /** Round trip of the probe in whole milliseconds. */
  latencyMs: number;
}

export async function checkHealth(signal?: AbortSignal): Promise<HealthCheck> {
  const startedAt = Date.now();
  const body = await adminGet<HealthzDto>('/healthz', undefined, signal);
  return { ok: body.status === 'ok', latencyMs: Math.max(0, Date.now() - startedAt) };
}
