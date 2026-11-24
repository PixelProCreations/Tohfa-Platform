/**
 * The signed-in administrator's own account (GET /auth/me), for the screens
 * that have to RECORD who they are rather than merely show it.
 *
 * Why this exists: CreateLearningArticleRequest and CreateLearningVideoRequest
 * both require an `author` string (docs/openapi.yaml, BR-59d), and the designed
 * forms draw Author as a locked, system-set field. The only system value that
 * is true is the caller's own display name, so it is fetched rather than typed
 * — and rather than shipped as the hard-coded "Super Admin" these screens used
 * to print, which was a name no server had ever reported.
 *
 * `authorName` is undefined until the account has loaded. Absent is not a
 * placeholder: a screen with no author yet disables its save and says why,
 * because an article filed under a guessed author is a false record.
 *
 * The key is unscoped by warehouse (the caller's own account is the same row in
 * every scope), which is why it uses adminKeys.module rather than .scoped.
 */
import { adminKeys } from './queryKeys';
import { useAdminQuery, type AdminQueryOptions } from './hooks';
import { getMe, type CurrentUserDto } from './profile';

export const ADMIN_PROFILE_MODULE = 'adminProfile';

export interface MyAdminAccount {
  account: CurrentUserDto | undefined;
  /** The caller's display name, or undefined until the account has loaded. */
  authorName: string | undefined;
  isLoading: boolean;
  error: unknown;
}

/** The caller's own account (BR-67). */
export function useMyAdminAccount(options: AdminQueryOptions = {}): MyAdminAccount {
  const query = useAdminQuery(
    [...adminKeys.module(ADMIN_PROFILE_MODULE), 'me'],
    (signal) => getMe(signal),
    options,
  );
  const fullName = query.data?.fullName;
  const trimmed = typeof fullName === 'string' ? fullName.trim() : '';
  return {
    account: query.data,
    authorName: trimmed === '' ? undefined : trimmed,
    isLoading: query.isPending && (options.enabled ?? true),
    error: query.error,
  };
}
