/**
 * The admin's own account — docs/openapi.yaml:
 *  - `GET /auth/me` (`getCurrentUser`, `auth.principal.view_own`)
 *  - `PATCH /auth/me` (`updateCurrentUserProfile`, `auth.profile.edit_own`, BR-82)
 *  - `GET /auth/me/sessions` (`listMySessions`, `auth.principal.view_own`, BR-67)
 *  - `POST /auth/me/change-password` (`changeOwnPassword`, `auth.password.change_own`)
 *
 * The user is always the bearer token's: nothing here sends a user id.
 *
 * BR-82 / BR-33: only `fullName` and `preferredLocale` are editable. `mobile`
 * and `email` are locked (sending either is 403 `FIELD_LOCKED` and nothing is
 * applied) and any other key is 422, so `updateMe` builds its body from an
 * explicit allow-list and a stray key can never reach the wire.
 *
 * None of these is a money-moving write and the spec declares no
 * `Idempotency-Key` on them, so none is sent (root CLAUDE.md §2.4 covers money).
 *
 * Password policy: the spec bounds `newPassword` to 10..128 characters. Those
 * are server-validated; the client deliberately does not duplicate them
 * (root CLAUDE.md §2.7 — no thresholds in the app) and shows the server's 422.
 */
import { clearLocalAuth } from '../../../shell/api/client';
import { adminGet, adminPatch, adminPost } from './http';

/** docs/openapi.yaml `Locale`. */
export const LOCALES = ['en', 'ta'] as const;
export type LocaleDto = (typeof LOCALES)[number];

/** docs/openapi.yaml `CurrentUser.status`. */
export const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'DISABLED'] as const;
export type AccountStatusDto = (typeof ACCOUNT_STATUSES)[number];

/** Problem codes these endpoints can answer with (docs/openapi.yaml responses). */
export const ERROR_CODES = [
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'FIELD_LOCKED',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'INTERNAL',
] as const;

/** docs/openapi.yaml `RoleAssignment`. */
export interface RoleAssignmentDto {
  code: string;
  warehouseId?: string | null | undefined;
  warehouseName?: string | null | undefined;
  zoneId?: string | null | undefined;
}

/** docs/openapi.yaml `CurrentUser`. */
export interface CurrentUserDto {
  id: string;
  fullName: string;
  mobile?: string | undefined;
  email?: string | null | undefined;
  userType: string;
  preferredLocale?: LocaleDto | undefined;
  status?: AccountStatusDto | undefined;
  createdAt?: string | undefined;
  /** null (not omitted) for a user who has never logged in (BR-67g). */
  lastLoginAt?: string | null | undefined;
  roles?: RoleAssignmentDto[] | undefined;
  permissions?: string[] | undefined;
}

/** docs/openapi.yaml `UpdateCurrentUserRequest`, minus the locked fields. */
export interface UpdateMeBody {
  fullName?: string | undefined;
  preferredLocale?: LocaleDto | undefined;
}

/** docs/openapi.yaml `MySession` (BR-67: exactly these keys). */
export interface MySessionDto {
  id: string;
  platform: 'ios' | 'android' | 'web' | null;
  userAgent: string | null;
  issuedAt: string;
  lastSeenAt: string | null;
  lastSeenIp: string | null;
  expiresAt: string;
}

export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

export function getMe(signal?: AbortSignal): Promise<CurrentUserDto> {
  return adminGet<CurrentUserDto>('/auth/me', { signal });
}

export function updateMe(body: UpdateMeBody): Promise<CurrentUserDto> {
  const wire: UpdateMeBody = {};
  if (body.fullName !== undefined) wire.fullName = body.fullName;
  if (body.preferredLocale !== undefined) wire.preferredLocale = body.preferredLocale;
  return adminPatch<CurrentUserDto>('/auth/me', wire);
}

/** A bare array (not a page envelope), newest first, capped at 50 by the server. */
export function listMySessions(signal?: AbortSignal): Promise<MySessionDto[]> {
  return adminGet<MySessionDto[]>('/auth/me/sessions', { signal });
}

/**
 * Changes the password, then forgets this device's tokens.
 *
 * A 204 means the server has revoked EVERY session of this account, this
 * one included, so the held tokens are already dead: clearing them is the
 * client catching up, not optional cleanup. The caller must then send the
 * user to sign in again. On failure nothing is cleared — the old password
 * and session are still active.
 */
export async function changePassword(body: ChangePasswordBody): Promise<void> {
  await adminPost<void>('/auth/me/change-password', {
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
  });
  await clearLocalAuth();
}
