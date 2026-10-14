/**
 * Pure navigation decisions App.tsx makes around the session: which screens
 * survive an auth failure, which screens start a fresh back stack, and where
 * "back" goes when the stack is empty. Kept out of App.tsx (which imports
 * react-native) so plain-Node vitest can pin them; see
 * ../tests/navigation_session.test.ts.
 */

/** The admin dashboards a signed-in admin lands on. */
const ADMIN_DASHBOARDS: readonly string[] = [
  'AdminMain',
  'SuperAdminDashboard',
  'TohfaAdminDashboard',
  'FarmerAdminDashboard',
  'MainWarehouseAdminDashboard',
  'SubWarehouseAdminDashboard',
];

/** Warehouse-admin routes: the same key test App.tsx uses to fetch warehouse permissions. */
export function isWarehouseAdminScreen(screen: string): boolean {
  return (
    screen.startsWith('SubWarehouse') ||
    screen.startsWith('MainWarehouse') ||
    screen.startsWith('Warehouse') ||
    screen === 'InterWarehouseTransfer' ||
    screen === 'InitiateNewTransfer'
  );
}

/** Admin roles whose AdminMain shell takes its `can` from App.tsx's warehouse permissions. */
const WAREHOUSE_SHELL_ROLES: readonly string[] = ['SUB_WH_ADMIN'];

/**
 * True when App.tsx must GET /auth/me for the warehouse permissions
 * (`warehouseCan`). That is every warehouse route AND the Sub warehouse shell,
 * which is rendered under 'AdminMain' with params.adminRole 'SUB_WH_ADMIN' and
 * gets `can={warehouseCan}`. Without the shell case the permissions were never
 * fetched while the admin stayed inside it, so `can` denied everything (bell
 * -> Notifications showed "not available"). The Main shell builds its own
 * `can` from its own useWarehousePermissions, so it is not listed. While this
 * is true App.tsx keeps retrying a failed fetch (useWarehousePermissions); a
 * failed fetch leaves `can` denying everything (dev builds aside: see
 * roles/admin/permissions/warehousePermissions.ts).
 */
export function shouldLoadWarehousePermissions(
  screen: string,
  params?: Readonly<Record<string, unknown>> | null,
): boolean {
  if (isWarehouseAdminScreen(screen)) return true;
  const role = params?.['adminRole'];
  return screen === 'AdminMain' && typeof role === 'string' && WAREHOUSE_SHELL_ROLES.includes(role);
}

/**
 * Where App.tsx sends the user when the shared client's token refresh fails
 * (the session is dead: the client has already cleared the tokens).
 *
 * Admin dashboards and warehouse routes go to 'Login'; everything else goes to
 * 'Welcome', as it always did. These routes used to stay on screen instead
 * (commit 01a3de5), because the demo admin sign-in opened them before any
 * token existed and their first GET /auth/me 401'd mid-session. That sign-in
 * is gone: every admin login is awaited, so a failed refresh here is a real
 * expiry, and leaving the admin on a screen whose every call is refused only
 * hides it.
 */
export function authFailureTarget(screen: string): 'Login' | 'Welcome' {
  return ADMIN_DASHBOARDS.includes(screen) || isWarehouseAdminScreen(screen) ? 'Login' : 'Welcome';
}

/**
 * Screens that start a fresh back stack. 'AdminMain' (where sign-in lands) and
 * 'Login' (where sign-out lands) are here so back after signing in never pops
 * to the Login screen, and back after signing out never re-enters the session.
 */
export function resetsHistoryOn(screen: string): boolean {
  return (
    screen === 'Splash' ||
    screen === 'Welcome' ||
    screen === 'MainTabs' ||
    screen === 'AdminMain' ||
    screen === 'Login'
  );
}

const AUTH_SCREENS: readonly string[] = [
  'Login',
  'RoleSelection',
  'Register',
  'Otp',
  'ForgotPassword',
  'ResetPassword',
  'PasswordChangedSuccess',
  'ApplicationStatus',
];

const ROOT_SCREENS: readonly string[] = ['MainTabs', 'Splash', 'Welcome', ...ADMIN_DASHBOARDS];

/**
 * Where back goes when the history stack is empty, or null to stay put. A
 * warehouse screen returns to its own dashboard rather than the farmer tabs.
 */
export function emptyHistoryBackTarget(screen: string): string | null {
  if (AUTH_SCREENS.includes(screen)) return 'Welcome';
  if (ROOT_SCREENS.includes(screen)) return null;
  if (screen.startsWith('MainWarehouse')) return 'MainWarehouseAdminDashboard';
  if (isWarehouseAdminScreen(screen)) return 'SubWarehouseAdminDashboard';
  return 'MainTabs';
}
