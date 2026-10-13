/**
 * Ending the admin session from inside the admin app.
 *
 * The admin app does not own navigation to the login screen — whatever mounts
 * TohfaAdminApp does (today roles/farmer/App.tsx's switcher, later
 * shell/auth/RootShell.tsx), and admin code must never import from another
 * role. So the host injects `onSignOut`, exactly as CustomerMainApp takes
 * one, and this module only does the admin-side part: forget the tokens the
 * shared client holds (shell `clearLocalAuth`), drop every cached admin row so
 * the next account on this device cannot see them (BR-30), then hand back.
 *
 * Two entry points:
 *  - `afterPasswordChange`: the server has ALREADY revoked every session of
 *    the account (POST /auth/me/change-password), so there is no logout call
 *    to make — it would only 401.
 *  - `signOut`: a manual sign-out. The logout call is best-effort; a dead
 *    network must not leave the user stuck signed in.
 */
export interface AdminSignOutDeps {
  logout: () => Promise<void>;
  clearLocalAuth: () => Promise<void>;
  clearCache: () => void;
  onSignOut: () => void;
}

export interface AdminSignOut {
  afterPasswordChange: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function createAdminSignOut(deps: AdminSignOutDeps): AdminSignOut {
  const finish = async (): Promise<void> => {
    await deps.clearLocalAuth();
    deps.clearCache();
    deps.onSignOut();
  };
  return {
    afterPasswordChange: finish,
    signOut: async () => {
      try {
        await deps.logout();
      } catch {
        // Best-effort — see header.
      }
      await finish();
    },
  };
}
