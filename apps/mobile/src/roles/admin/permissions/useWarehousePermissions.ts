/**
 * Loads a warehouse admin's session (GET /auth/me `permissions` and `roles`)
 * and keeps retrying until it arrives. The pure rules (schedule, fallback,
 * scope) live in ./warehousePermissions.ts.
 *
 *   - No token yet (neither in the API client nor in the token store): do not
 *     call /auth/me at all — a tokenless /me 401s, and the client's failed
 *     refresh path clears the session, which could wipe the token the
 *     un-awaited demo login is about to store. Poll lightly instead.
 *   - /auth/me failed: retry after 1s / 2s / 4s, then every 10s while enabled.
 *   - Stop once a session arrives. A real list always wins over the dev fallback.
 *   - The Sub warehouse scope comes from the same /auth/me (BR-30), then one
 *     GET /warehouses/{id} adds its human code. The dev fallback covers
 *     permissions only; it never invents a scope.
 *
 * The loader and the token check are injected so this file stays inside
 * roles/admin (the callers pass fetchMe / hasSessionCredentials from
 * roles/farmer/api/auth).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../../shell/api/client';
import type { WarehouseScope } from '../screens/warehouse/finance-expenses/types';
import {
  nextPermissionRetryDelay,
  permissionAttemptsExhausted,
  permissionsForSession,
  resolveSubScope,
  resolveWarehousePermissions,
  subScopeForSession,
  subWarehouseScopeFromRoles,
  type PermissionFailure,
  type ResolvedWarehousePermissions,
  type SessionPermissions,
  type WarehouseCodeLookup,
  type WarehouseSessionSnapshot,
} from './warehousePermissions';

export interface UseWarehousePermissionsOptions {
  /** Load only while a warehouse admin surface is mounted. */
  enabled: boolean;
  /** The demo shell's role; only used for the dev fallback. */
  adminRole: unknown;
  /** Pass `__DEV__` from the call site; release builds never fall back. */
  isDev: boolean;
  /** GET /auth/me and return its `permissions` and `roles` (rejects on failure). */
  loadSession: () => Promise<WarehouseSessionSnapshot>;
  /** True when a token exists to authenticate /auth/me with. */
  hasCredentials: () => Promise<boolean>;
  /**
   * Changes on every sign-out. A session fetched under an older key is dropped
   * and fetched again, so one admin's permissions or warehouse never render
   * for the next. Callers that unmount on sign-out (the Main shell) can leave
   * it out.
   */
  sessionKey?: unknown;
}

export interface WarehouseSessionState extends ResolvedWarehousePermissions {
  /**
   * The Sub Warehouse Admin's own warehouse: undefined while loading, null
   * when the account has no SUB_WH_ADMIN warehouse assignment (fail closed).
   */
  subScope: WarehouseScope | null | undefined;
  /** True once every /auth/me attempt has failed (the loop keeps retrying). */
  subScopeFailed: boolean;
  /** Drop what was fetched and start again now (WarehouseScopeGate's Retry). */
  retry: () => void;
}

/** Only the field this hook needs from GET /warehouses/{id} (docs/openapi.yaml `Warehouse`). */
interface WarehouseCodeResponse {
  code?: unknown;
}

export function useWarehousePermissions(options: UseWarehousePermissionsOptions): WarehouseSessionState {
  const { enabled, adminRole, isDev, sessionKey } = options;
  const [fetchedForSession, setFetchedForSession] = useState<SessionPermissions | undefined>(undefined);
  const fetched = permissionsForSession(fetchedForSession, sessionKey);
  const fetchedScope = subScopeForSession(fetchedForSession, sessionKey);
  const [codeLookup, setCodeLookup] = useState<WarehouseCodeLookup | undefined>(undefined);
  const [failures, setFailures] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const failuresRef = useRef(0);
  // Callers pass inline functions; keep the latest without restarting the loop.
  const loadRef = useRef(options.loadSession);
  const credentialsRef = useRef(options.hasCredentials);
  loadRef.current = options.loadSession;
  credentialsRef.current = options.hasCredentials;

  // A new session starts its retry count (and the dev fallback) from zero.
  useEffect(() => {
    failuresRef.current = 0;
    setFailures(0);
  }, [sessionKey]);

  useEffect(() => {
    if (!enabled || fetched !== undefined) return undefined;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const attempt = async (): Promise<void> => {
      let reason: PermissionFailure = 'error';
      try {
        if (await credentialsRef.current()) {
          const session = await loadRef.current();
          if (!cancelled) {
            setFetchedForSession({
              sessionKey,
              list: session.permissions,
              subScope: subWarehouseScopeFromRoles(session.roles),
            });
          }
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
  }, [enabled, fetched, sessionKey, retryNonce]);

  // One lookup per (session, warehouse). A failure is recorded as `code: null`
  // so the scope still renders, just without its human code.
  const scopeWarehouseId = fetchedScope?.warehouseId;
  useEffect(() => {
    if (scopeWarehouseId === undefined) return undefined;
    let cancelled = false;
    const settle = (code: string | null): void => {
      if (!cancelled) setCodeLookup({ sessionKey, warehouseId: scopeWarehouseId, code });
    };
    api
      .get<WarehouseCodeResponse>(`/warehouses/${encodeURIComponent(scopeWarehouseId)}`)
      .then((warehouse) => settle(typeof warehouse?.code === 'string' && warehouse.code !== '' ? warehouse.code : null))
      .catch(() => settle(null));
    return () => {
      cancelled = true;
    };
  }, [scopeWarehouseId, sessionKey]);

  const retry = useCallback(() => {
    failuresRef.current = 0;
    setFailures(0);
    setFetchedForSession(undefined);
    setCodeLookup(undefined);
    setRetryNonce((n) => n + 1);
  }, []);

  // Memoised so the scope keeps its identity across App renders: the flows
  // take it as a prop and some key effects on it.
  const subScope = useMemo(
    () => resolveSubScope(fetchedScope, codeLookup, sessionKey),
    [fetchedScope, codeLookup, sessionKey],
  );
  const attemptsExhausted = permissionAttemptsExhausted(failures);
  return {
    ...resolveWarehousePermissions({
      fetched,
      adminRole,
      isDev,
      attemptsExhausted,
    }),
    subScope,
    subScopeFailed: fetched === undefined && attemptsExhausted,
    retry,
  };
}
