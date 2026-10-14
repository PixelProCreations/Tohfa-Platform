/**
 * Client-side permission check for admin screens.
 *
 * `permissions` is the list of docs/rbac.json codes the server returns on
 * GET /v1/auth/me (`UserMe.permissions`), already filtered to grants whose
 * scope is not 'none' (apps/api auth.repo `getUserPermissions`).
 *
 * This only decides what is worth RENDERING. Every action is authorised again
 * on the server (root CLAUDE.md 2.1: a hidden button is not a permission), so
 * the failure mode we guard against here is showing a control that will 403,
 * not a security hole.
 *
 * Deliberate choices:
 *   - Fail closed. No list (not signed in, /me failed, not loaded yet) means
 *     no permissions. There is no fallback identity — see the removed fake
 *     SUPER_ADMIN in roles/farmer/api/auth.ts `fetchMe`.
 *   - Exact code match only. No '*' wildcard: the server never sends one, and
 *     honouring it would let a fabricated list unlock every control.
 *   - Code only, no scope. /auth/me drops the grant scope (own/all/view), so a
 *     check like "report.export.file AND grant is own/all" cannot be made here.
 *     Screens that need it take an explicit extra prop (e.g. `canExport`).
 */
export type Can = (code: string) => boolean;

export function makeCan(permissions?: readonly string[] | null): Can {
  const granted = new Set(permissions ?? []);
  return (code: string) => granted.has(code);
}
