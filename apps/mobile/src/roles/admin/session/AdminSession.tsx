/**
 * The admin session every admin screen reads: scope + can().
 *
 * Built once from `GET /auth/me` (shell/auth/api.ts `fetchCurrentUser`) by
 * whatever mounts the admin app, then provided via context so screens never
 * re-derive scope or read a warehouse id from anywhere else (BR-30).
 */
import React, { createContext, useContext } from 'react';
import type { CurrentUserProfile } from '@tohfa/shared-types';
import { createAdminCan, type AdminCan } from '../rbac/permissions';
import { resolveAdminScope, type AdminScope, type AdminScopeResult } from './scope';

export interface AdminSession {
  userId: string;
  fullName: string;
  scope: AdminScope;
  can: AdminCan;
}

export type AdminSessionResult =
  | { kind: 'ok'; session: AdminSession }
  | Extract<AdminScopeResult, { kind: 'error' }>;

export function buildAdminSession(profile: CurrentUserProfile): AdminSessionResult {
  const scope = resolveAdminScope(profile);
  if (scope.kind === 'error') return scope;
  return {
    kind: 'ok',
    session: {
      userId: profile.id,
      fullName: profile.fullName,
      scope: scope.scope,
      can: createAdminCan(profile.permissions),
    },
  };
}

const AdminSessionContext = createContext<AdminSession | null>(null);

export function AdminSessionProvider(props: {
  session: AdminSession;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <AdminSessionContext.Provider value={props.session}>{props.children}</AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminSession {
  const session = useContext(AdminSessionContext);
  if (session === null) {
    throw new Error('useAdminSession must be used inside <AdminSessionProvider>');
  }
  return session;
}
