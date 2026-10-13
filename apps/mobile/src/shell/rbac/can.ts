/**
 * Client-side permission check, driven by the codes `GET /auth/me` returns.
 *
 * This only decides what to SHOW. A hidden button is not a permission (root
 * CLAUDE.md §2.1): the server re-checks every call with `requirePermission`.
 * `/auth/me.permissions` is the set of `docs/rbac.json` codes the user holds at
 * any scope other than `none` (apps/api/src/modules/auth/auth.repo.ts
 * `getUserPermissions`), so membership is the whole test — no prefix or
 * wildcard matching, which would grant codes rbac.json never granted.
 *
 * Generic over the code type so each role can narrow it to the codes it
 * actually gates on (see roles/admin/rbac/permissions.ts).
 */
export type Can<Code extends string = string> = (code: Code) => boolean;

export function createCan<Code extends string = string>(
  permissions: readonly string[] | undefined,
): Can<Code> {
  const granted = new Set(permissions ?? []);
  return (code) => granted.has(code);
}
