/**
 * The signed-in admin's own account, as the profile and settings screens read
 * and change it (docs/openapi.yaml tags Auth and Platform):
 *   GET   /auth/me                                   auth.principal.view_own      (BR-67)
 *   PATCH /auth/me                                   auth.profile.edit_own        (BR-82, BR-33)
 *   GET   /auth/me/sessions                          auth.principal.view_own      (BR-67)
 *   POST  /auth/me/change-password                   auth.password.change_own
 *   GET   /notification-preferences/admin            notification.own.admin_preferences (BR-82)
 *   PATCH /notification-preferences/admin/{category} notification.own.admin_preferences (BR-82)
 *   GET   /admin/help                                help.article.view            (BR-82)
 *
 * Every route acts on the caller from the access token: none takes a user id
 * or a warehouse, so this module never sends one.
 *
 * BR-33 / BR-82: the profile edit sends ONLY fullName and preferredLocale.
 * mobile and email are locked identity fields (403 FIELD_LOCKED, and nothing in
 * the request is applied), so updateMe builds its body from an allow-list and
 * a caller cannot leak either key onto the wire.
 *
 * A successful password change ends EVERY session of the account on the
 * server, the caller's own included (docs/openapi.yaml changeOwnPassword); the
 * screen must sign out right after it. A wrong current password is 401
 * UNAUTHENTICATED (the shared client first tries one silent token refresh and
 * repeats the request, then throws).
 *
 * POST /auth/sessions/{id}/terminate (ending ANOTHER session) is
 * auth.session.terminate_other, `none` for both warehouse roles: not exported.
 *
 * None of these routes declares an Idempotency-Key (they move no money, and
 * the PATCHes are idempotent by value), so none is sent.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import { adminGet, adminPatch, adminPost } from './http';

/** docs/openapi.yaml Locale. */
export type AdminLocale = 'en' | 'ta';

/** docs/openapi.yaml RoleAssignment. */
export interface RoleAssignmentDto {
  code: 'SUPER_ADMIN' | 'TOHFA_ADMIN' | 'FARMER_ADMIN' | 'MAIN_WH_ADMIN' | 'SUB_WH_ADMIN';
  warehouseId?: string | null;
  warehouseName?: string | null;
  zoneId?: string | null;
}

/** docs/openapi.yaml CurrentUser. */
export interface CurrentUserDto {
  id: string;
  fullName: string;
  mobile?: string;
  email?: string | null;
  userType: 'farmer' | 'customer' | 'admin' | 'delivery_partner';
  preferredLocale?: AdminLocale;
  status?: 'PENDING' | 'ACTIVE' | 'DISABLED';
  createdAt?: string;
  /** null when the user has never logged in (BR-67g). */
  lastLoginAt?: string | null;
  roles?: RoleAssignmentDto[];
  permissions?: string[];
}

/** docs/openapi.yaml UpdateCurrentUserRequest, without the two locked keys. */
export interface UpdateMeBody {
  fullName?: string | undefined;
  preferredLocale?: AdminLocale | undefined;
}

/**
 * docs/openapi.yaml MySession: one of the caller's LIVE sessions. There is no
 * `isCurrent` (the access token carries no session id), no location and no
 * failed-login history (BR-67).
 */
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

/** docs/openapi.yaml AdminNotificationCategory, in screen order (BR-82). */
export const ADMIN_NOTIFICATION_CATEGORIES = [
  'IN_APP_MASTER',
  'GOODS_RECEIVING',
  'INVENTORY_ALERTS',
  'WAREHOUSE_OPERATIONS',
  'TASK_ALERTS',
  'EXCEPTION_ALERTS',
  'ORDER_CONFIRMED',
  'ORDER_DISPATCHED',
  'ORDER_DELIVERED',
  'WALLET_CREDITED',
  'PAYOUT_RELEASED',
  'SYSTEM_MESSAGES',
  'MAINTENANCE_MESSAGES',
  'SECURITY_ALERTS',
] as const;

export type AdminNotificationCategory = (typeof ADMIN_NOTIFICATION_CATEGORIES)[number];

/** docs/openapi.yaml AdminNotificationPreference. */
export interface AdminNotificationPreferenceDto {
  category: AdminNotificationCategory;
  enabled: boolean;
}

export interface AdminNotificationPreferencesDto {
  items: AdminNotificationPreferenceDto[];
}

/** docs/openapi.yaml HelpArticleReader. */
export interface HelpArticleDto {
  id: string;
  category: string;
  locale: AdminLocale;
  title: string;
  /** Plain text. */
  body: string;
  sortOrder: number;
}

/** docs/openapi.yaml HelpResponse. */
export interface HelpResponseDto {
  items: HelpArticleDto[];
  /** Categories with a published article in the requested locale. */
  categories: string[];
  /** null while a Super Admin or TOHFA Admin has not set them (BR-82i). */
  contact: { phone: string | null; email: string | null };
}

export interface AdminHelpParams {
  locale: AdminLocale;
  category?: string | undefined;
}

/**
 * docs/openapi.yaml changeOwnPassword `newPassword` bounds (minLength 10,
 * maxLength 128). A contract bound of the request schema, not a business
 * threshold: the server rejects anything outside it with 422.
 */
export const NEW_PASSWORD_MIN_LENGTH = 10;
export const NEW_PASSWORD_MAX_LENGTH = 128;

/** Thrown before any request when the change-password body would be a 422. */
export class PasswordPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordPolicyError';
  }
}

/** Every problem code the profile routes document (401, 403 incl. FIELD_LOCKED, 400, 422, 429, 500). */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'FIELD_LOCKED',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'INTERNAL',
];

export function getMe(signal?: AbortSignal): Promise<CurrentUserDto> {
  return adminGet<CurrentUserDto>('/auth/me', undefined, signal);
}

/** Own display name and/or language. Only those two keys are ever sent (BR-33). */
export function updateMe(body: UpdateMeBody): Promise<CurrentUserDto> {
  const allowed: UpdateMeBody = {};
  if (body.fullName !== undefined) allowed.fullName = body.fullName;
  if (body.preferredLocale !== undefined) allowed.preferredLocale = body.preferredLocale;
  return adminPatch<CurrentUserDto>('/auth/me', allowed);
}

/** The caller's own live sessions, newest first (BR-67). */
export function listMySessions(signal?: AbortSignal): Promise<MySessionDto[]> {
  return adminGet<MySessionDto[]>('/auth/me/sessions', undefined, signal);
}

/**
 * Changes the caller's password. On success (204) every session of the
 * account, this one included, is revoked server-side; the caller must sign out.
 */
export async function changeOwnPassword(body: ChangePasswordBody): Promise<void> {
  if (body.currentPassword.length === 0) throw new PasswordPolicyError('currentPassword is required');
  if (body.newPassword.length < NEW_PASSWORD_MIN_LENGTH || body.newPassword.length > NEW_PASSWORD_MAX_LENGTH) {
    throw new PasswordPolicyError(`newPassword must be ${NEW_PASSWORD_MIN_LENGTH}-${NEW_PASSWORD_MAX_LENGTH} characters`);
  }
  await adminPost<void>('/auth/me/change-password', { currentPassword: body.currentPassword, newPassword: body.newPassword });
}

export function listAdminNotificationPreferences(signal?: AbortSignal): Promise<AdminNotificationPreferencesDto> {
  return adminGet<AdminNotificationPreferencesDto>('/notification-preferences/admin', undefined, signal);
}

export function isAdminNotificationCategory(value: unknown): value is AdminNotificationCategory {
  return typeof value === 'string' && (ADMIN_NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

/** Turns one admin category on or off (BR-82). A category outside the 14 is refused here, before a 422. */
export async function updateAdminNotificationPreference(
  category: AdminNotificationCategory,
  enabled: boolean,
): Promise<AdminNotificationPreferenceDto> {
  if (!isAdminNotificationCategory(category)) throw new RangeError(`not an admin notification category: ${String(category)}`);
  return adminPatch<AdminNotificationPreferenceDto>(`/notification-preferences/admin/${category}`, { enabled });
}

/** Published help articles, their categories and the contact card (BR-82). */
export function getAdminHelp(params: AdminHelpParams, signal?: AbortSignal): Promise<HelpResponseDto> {
  return adminGet<HelpResponseDto>('/admin/help', { locale: params.locale, category: params.category }, signal);
}
