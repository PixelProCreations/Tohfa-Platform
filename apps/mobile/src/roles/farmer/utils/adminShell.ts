/**
 * Which admin shell a signed-in account opens, decided only from the role code
 * the SERVER returned. Pure (no react-native) so plain-Node vitest can pin it;
 * see ../tests/admin_login_signout.test.ts.
 *
 * Fail-closed on purpose: anything that is not exactly one of the five admin
 * role codes in docs/rbac.json is null, and null means "no admin shell". It used
 * to fall through to the Super Admin dashboard, so a typo, an alias or a role
 * added to rbac.json later opened the most privileged screen in the app. The
 * server still authorises every call (root CLAUDE.md 2.1); this only decides
 * which screens are worth rendering.
 */

/** The admin role codes in docs/rbac.json `roles` (everything but FARMER and CUSTOMER). */
export const ADMIN_SHELL_ROLES = [
  'SUPER_ADMIN',
  'TOHFA_ADMIN',
  'FARMER_ADMIN',
  'MAIN_WH_ADMIN',
  'SUB_WH_ADMIN',
] as const;

export type AdminShellRole = (typeof ADMIN_SHELL_ROLES)[number];

/** The shell for one server role code, or null. Exact match only: no aliases, no case folding. */
export function adminShellForRole(roleCode: unknown): AdminShellRole | null {
  return typeof roleCode === 'string' && (ADMIN_SHELL_ROLES as readonly string[]).includes(roleCode)
    ? (roleCode as AdminShellRole)
    : null;
}

/** The shell for the first admin role in a server role list, or null when it holds none. */
export function adminShellForRoles(
  roles: readonly { code?: unknown }[] | null | undefined,
): AdminShellRole | null {
  for (const role of roles ?? []) {
    const shell = adminShellForRole(role?.code);
    if (shell !== null) return shell;
  }
  return null;
}

/**
 * The role a password login completes with when the server asks for role
 * selection (`requiresRoleSelection`: the account holds more than one role and
 * no `roleCode` was sent). This app has no role picker for an existing login,
 * so the choice is deterministic: the first admin role the server listed,
 * otherwise the first role. Moved here unchanged from LoginScreen so it can be
 * tested; the dev seed gives admin users a FARMER role too, and this is what
 * sends them to their admin shell rather than the farmer tabs.
 *
 * Known limit: an account holding two admin roles (dev seed user 4: TOHFA_ADMIN
 * + FARMER_ADMIN) always gets the first one the server lists, and
 * /auth/login's role query has no ORDER BY. Choosing between them needs a role
 * picker, which has no design yet.
 */
export function preferredRoleForSelection(
  availableRoles: readonly { code?: unknown }[] | null | undefined,
): string | null {
  const admin = adminShellForRoles(availableRoles);
  if (admin !== null) return admin;
  const first = availableRoles?.[0]?.code;
  return typeof first === 'string' && first.length > 0 ? first : null;
}
