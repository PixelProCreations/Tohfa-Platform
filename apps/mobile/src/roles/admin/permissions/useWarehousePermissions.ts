/**
 * Loads a warehouse admin's permission list and keeps retrying until it
 * arrives. The pure rules (schedule, fallback) live in ./warehousePermissions.ts.
 *
 *   - No token yet (neither in the API client nor in the token store): do not
 *     call /auth/me at all — a tokenless /me 401s, and the client's failed
 *     refresh path clears the session, which could wipe the token the
 *     un-awaited demo login is about to store. Poll lightly instead.
 *   - /auth/me failed: retry after 1s / 2s / 4s, then every 10s while enabled.
 *   - Stop once a list arrives. A real list always wins over the dev fallback.
 *
 * The loader and the token check are injected so this file stays inside
 * roles/admin (the callers pass fetchMe / hasSessionCredentials from
 * roles/farmer/api/auth).
 */
import { useEffect, useRef, useState } from 'react';
import {
  nextPermissionRetryDelay,
  permissionAttemptsExhausted,
  resolveWarehousePermissions,
  type PermissionFailure,
  type ResolvedWarehousePermissions,
} from './warehousePermissions';

export interface UseWarehousePermissionsOptions {
  /** Load only while a warehouse admin surface is mounted. */
  enabled: boolean;
  /** The demo shell's role; only used for the dev fallback. */
  adminRole: unknown;
  /** Pass `__DEV__` from the call site; release builds never fall back. */
  isDev: boolean;
  /** GET /auth/me and return its `permissions` (rejects on failure). */
  loadPermissions: () => Promise<readonly string[]>;
  /** True when a token exists to authenticate /auth/me with. */
  hasCredentials: () => Promise<boolean>;
}

export function useWarehousePermissions(options: UseWarehousePermissionsOptions): ResolvedWarehousePermissions {
  const { enabled, adminRole, isDev } = options;
  const [fetched, setFetched] = useState<readonly string[] | undefined>(undefined);
  const [failures, setFailures] = useState(0);
  const failuresRef = useRef(0);
  // Callers pass inline functions; keep the latest without restarting the loop.
  const loadRef = useRef(options.loadPermissions);
  const credentialsRef = useRef(options.hasCredentials);
  loadRef.current = options.loadPermissions;
  credentialsRef.current = options.hasCredentials;

  useEffect(() => {
    if (!enabled || fetched !== undefined) return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const attempt = async (): Promise<void> => {
      let reason: PermissionFailure = 'error';
      try {
        if (await credentialsRef.current()) {
          const list = await loadRef.current();
          if (!cancelled) setFetched(list);
          return;
        }
        reason = 'no-credentials';
      } catch {
        reason = 'error';
      }
      if (cancelled) return;
      failuresRef.current += 1;
      setFailures(failuresRef.current);
      timer = setTimeout(() => {
        void attempt();
      }, nextPermissionRetryDelay(failuresRef.current, reason));
    };

    void attempt();
    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, [enabled, fetched]);

  return resolveWarehousePermissions({
    fetched,
    adminRole,
    isDev,
    attemptsExhausted: permissionAttemptsExhausted(failures),
  });
}
