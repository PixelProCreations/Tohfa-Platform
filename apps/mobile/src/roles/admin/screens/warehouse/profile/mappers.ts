/**
 * Profile & settings DTO -> screen models (BR-67, BR-82).
 *
 * - Allow-lists: only the fields below reach a screen. In particular a session
 *   row is exactly the `MySession` fields (BR-67) — no "current device" flag
 *   (the API cannot know it), no location, no failed-login history.
 * - Status/platform/category maps are exhaustive `Record`s over the OpenAPI
 *   enums, with a fallback so a value added server-side renders as "Unknown"
 *   (or is dropped, for a toggle the app cannot label) instead of crashing.
 * - No thresholds: name length and password policy are the server's (spec
 *   bounds are "unconfirmed defaults"); the client trims and checks presence
 *   and confirmation only, and shows the server's 422 otherwise.
 */
import { ApiError } from '../../../../../shell/api/client';
import { adminErrorKey } from '../../../api/errors';
import type { HelpResponseDto } from '../../../api/help';
import {
  ADMIN_NOTIFICATION_CATEGORIES,
  type AdminNotificationCategoryDto,
  type AdminNotificationPreferenceDto,
} from '../../../api/notificationPreferences';
import {
  ACCOUNT_STATUSES,
  LOCALES,
  type AccountStatusDto,
  type CurrentUserDto,
  type LocaleDto,
  type MySessionDto,
  type UpdateMeBody,
} from '../../../api/profile';
import type { TranslationKey } from '../../../i18n';
import { formatIstDateTime } from '../../../utils/datetime';

export type StatusTone = 'success' | 'danger' | 'warning' | 'info';

export interface StatusMeta {
  labelKey: TranslationKey;
  tone: StatusTone;
}

function has<K extends string>(map: Record<K, unknown>, key: string): key is K {
  return Object.prototype.hasOwnProperty.call(map, key);
}

function dateTimeLabel(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return formatIstDateTime(value) ?? value;
}

/* ---------------------------- own profile ---------------------------- */

export const PROFILE_STATUSES = ACCOUNT_STATUSES;

const STATUS_META: Record<AccountStatusDto, StatusMeta> = {
  PENDING: { labelKey: 'admin.profile.status.PENDING', tone: 'warning' },
  ACTIVE: { labelKey: 'admin.profile.status.ACTIVE', tone: 'success' },
  DISABLED: { labelKey: 'admin.profile.status.DISABLED', tone: 'danger' },
};
const UNKNOWN_STATUS: StatusMeta = { labelKey: 'admin.profile.status.unknown', tone: 'info' };

export function profileStatusMeta(status: string | undefined): StatusMeta {
  return status !== undefined && has(STATUS_META, status) ? STATUS_META[status] : UNKNOWN_STATUS;
}

const LOCALE_LABEL: Record<LocaleDto, TranslationKey> = {
  en: 'admin.profile.locale.en',
  ta: 'admin.profile.locale.ta',
};
const UNKNOWN_LOCALE: TranslationKey = 'admin.profile.locale.unknown';

export function localeLabelKey(locale: string | null | undefined): TranslationKey {
  return locale !== null && locale !== undefined && has(LOCALE_LABEL, locale)
    ? LOCALE_LABEL[locale]
    : UNKNOWN_LOCALE;
}

function asLocale(value: string | undefined): LocaleDto | null {
  return value !== undefined && (LOCALES as readonly string[]).includes(value)
    ? (value as LocaleDto)
    : null;
}

export interface ProfileModel {
  fullName: string;
  /** Locked identity field (BR-33): display only, never sent. */
  mobile: string | null;
  /** Locked identity field (BR-33): display only, never sent. */
  email: string | null;
  preferredLocale: LocaleDto | null;
  localeLabelKey: TranslationKey;
  status: StatusMeta;
  createdAtLabel: string | null;
  /** null = never logged in (BR-67g); the screen says so, never a made-up time. */
  lastLoginAtLabel: string | null;
}

export function toProfile(dto: CurrentUserDto): ProfileModel {
  const preferredLocale = asLocale(dto.preferredLocale);
  return {
    fullName: dto.fullName,
    mobile: dto.mobile ?? null,
    email: dto.email ?? null,
    preferredLocale,
    localeLabelKey: localeLabelKey(preferredLocale),
    status: profileStatusMeta(dto.status),
    createdAtLabel: dateTimeLabel(dto.createdAt),
    lastLoginAtLabel: dateTimeLabel(dto.lastLoginAt),
  };
}

export interface ProfileDraft {
  fullName: string;
  preferredLocale: LocaleDto | null;
}

/**
 * The PATCH /auth/me body: only changed fields, name trimmed (the server
 * trims too). `null` when nothing changed — an empty body would be a 422, and
 * a no-op request is pointless. Never carries mobile/email (BR-33).
 */
export function buildProfilePatch(original: ProfileDraft, draft: ProfileDraft): UpdateMeBody | null {
  const patch: UpdateMeBody = {};
  const name = draft.fullName.trim();
  if (name !== original.fullName.trim()) patch.fullName = name;
  if (draft.preferredLocale !== null && draft.preferredLocale !== original.preferredLocale) {
    patch.preferredLocale = draft.preferredLocale;
  }
  return Object.keys(patch).length === 0 ? null : patch;
}

/* --------------------------- change password -------------------------- */

export interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordFormErrors = Partial<Record<keyof PasswordForm, TranslationKey>>;

/** Presence + confirmation only; length/complexity are the server's (422). */
export function validatePasswordForm(form: PasswordForm): PasswordFormErrors {
  const errors: PasswordFormErrors = {};
  if (form.currentPassword.length === 0) errors.currentPassword = 'admin.profile.password.required';
  if (form.newPassword.length === 0) errors.newPassword = 'admin.profile.password.required';
  if (form.confirmPassword.length === 0) {
    errors.confirmPassword = 'admin.profile.password.required';
  } else if (form.newPassword.length > 0 && form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = 'admin.profile.password.mismatch';
  }
  return errors;
}

export function isPasswordFormValid(errors: PasswordFormErrors): boolean {
  return Object.keys(errors).length === 0;
}

/**
 * The server answers a wrong current password (or an account with no
 * password yet) with 401 `UNAUTHENTICATED`, and a policy failure with 422.
 * The generic copy for those ("session expired", "details invalid") would
 * mislead here, so this screen has its own; everything else is generic.
 */
export function changePasswordErrorKey(error: unknown): TranslationKey {
  if (error instanceof ApiError) {
    const code = error.problem.code as string;
    if (code === 'UNAUTHENTICATED') return 'admin.profile.password.errors.UNAUTHENTICATED';
    if (code === 'VALIDATION_FAILED') return 'admin.profile.password.errors.VALIDATION_FAILED';
  }
  return adminErrorKey(error);
}

/* ------------------------------ sessions ------------------------------ */

export const SESSION_PLATFORMS = ['ios', 'android', 'web'] as const;
type SessionPlatform = (typeof SESSION_PLATFORMS)[number];

const PLATFORM_LABEL: Record<SessionPlatform, TranslationKey> = {
  ios: 'admin.profile.sessions.platform.ios',
  android: 'admin.profile.sessions.platform.android',
  web: 'admin.profile.sessions.platform.web',
};
const UNKNOWN_PLATFORM: TranslationKey = 'admin.profile.sessions.platform.unknown';

export function sessionPlatformLabelKey(platform: string | null): TranslationKey {
  return platform !== null && has(PLATFORM_LABEL, platform) ? PLATFORM_LABEL[platform] : UNKNOWN_PLATFORM;
}

/** Exactly the MySession fields (BR-67), formatted. */
export interface SessionRow {
  id: string;
  platformLabelKey: TranslationKey;
  userAgent: string | null;
  issuedAtLabel: string;
  lastSeenAtLabel: string | null;
  lastSeenIp: string | null;
  expiresAtLabel: string;
}

export function toSessionRow(dto: MySessionDto): SessionRow {
  return {
    id: dto.id,
    platformLabelKey: sessionPlatformLabelKey(dto.platform),
    userAgent: dto.userAgent,
    issuedAtLabel: dateTimeLabel(dto.issuedAt) ?? dto.issuedAt,
    lastSeenAtLabel: dateTimeLabel(dto.lastSeenAt),
    lastSeenIp: dto.lastSeenIp,
    expiresAtLabel: dateTimeLabel(dto.expiresAt) ?? dto.expiresAt,
  };
}

/* ----------------------- notification preferences --------------------- */

const CATEGORY_LABEL: Record<AdminNotificationCategoryDto, TranslationKey> = {
  IN_APP_MASTER: 'admin.notifications.category.IN_APP_MASTER',
  GOODS_RECEIVING: 'admin.notifications.category.GOODS_RECEIVING',
  INVENTORY_ALERTS: 'admin.notifications.category.INVENTORY_ALERTS',
  WAREHOUSE_OPERATIONS: 'admin.notifications.category.WAREHOUSE_OPERATIONS',
  TASK_ALERTS: 'admin.notifications.category.TASK_ALERTS',
  EXCEPTION_ALERTS: 'admin.notifications.category.EXCEPTION_ALERTS',
  ORDER_CONFIRMED: 'admin.notifications.category.ORDER_CONFIRMED',
  ORDER_DISPATCHED: 'admin.notifications.category.ORDER_DISPATCHED',
  ORDER_DELIVERED: 'admin.notifications.category.ORDER_DELIVERED',
  WALLET_CREDITED: 'admin.notifications.category.WALLET_CREDITED',
  PAYOUT_RELEASED: 'admin.notifications.category.PAYOUT_RELEASED',
  SYSTEM_MESSAGES: 'admin.notifications.category.SYSTEM_MESSAGES',
  MAINTENANCE_MESSAGES: 'admin.notifications.category.MAINTENANCE_MESSAGES',
  SECURITY_ALERTS: 'admin.notifications.category.SECURITY_ALERTS',
};

/**
 * Screen sections, from the OpenAPI description: "the master in-app switch
 * (`IN_APP_MASTER`), then Operational, Order, Wallet & Payout and System
 * categories". Every category is in exactly one group (tested).
 */
const GROUPS: readonly { titleKey: TranslationKey; categories: readonly AdminNotificationCategoryDto[] }[] = [
  { titleKey: 'admin.notifications.group.master', categories: ['IN_APP_MASTER'] },
  {
    titleKey: 'admin.notifications.group.operational',
    categories: [
      'GOODS_RECEIVING',
      'INVENTORY_ALERTS',
      'WAREHOUSE_OPERATIONS',
      'TASK_ALERTS',
      'EXCEPTION_ALERTS',
    ],
  },
  {
    titleKey: 'admin.notifications.group.orders',
    categories: ['ORDER_CONFIRMED', 'ORDER_DISPATCHED', 'ORDER_DELIVERED'],
  },
  { titleKey: 'admin.notifications.group.wallet', categories: ['WALLET_CREDITED', 'PAYOUT_RELEASED'] },
  {
    titleKey: 'admin.notifications.group.system',
    categories: ['SYSTEM_MESSAGES', 'MAINTENANCE_MESSAGES', 'SECURITY_ALERTS'],
  },
];

export interface PreferenceItem {
  category: AdminNotificationCategoryDto;
  labelKey: TranslationKey;
  enabled: boolean;
  /** Greyed because the master switch is off (the stored value is kept). */
  disabled: boolean;
}

export interface PreferenceGroup {
  titleKey: TranslationKey;
  items: PreferenceItem[];
}

export function groupAdminPreferences(
  prefs: readonly AdminNotificationPreferenceDto[],
): PreferenceGroup[] {
  const known = new Set<string>(ADMIN_NOTIFICATION_CATEGORIES);
  const stored = new Map<AdminNotificationCategoryDto, boolean>();
  for (const p of prefs) {
    if (known.has(p.category)) stored.set(p.category, p.enabled);
  }
  // No stored row = enabled (BR-82 / BR-52).
  const enabled = (c: AdminNotificationCategoryDto): boolean => stored.get(c) ?? true;
  const masterOn = enabled('IN_APP_MASTER');
  return GROUPS.map((g) => ({
    titleKey: g.titleKey,
    items: g.categories.map((category) => ({
      category,
      labelKey: CATEGORY_LABEL[category],
      enabled: enabled(category),
      disabled: category !== 'IN_APP_MASTER' && !masterOn,
    })),
  }));
}

/* -------------------------------- help -------------------------------- */

export interface HelpArticle {
  id: string;
  category: string;
  title: string;
  body: string;
}

export interface HelpModel {
  articles: HelpArticle[];
  categories: string[];
  contact: { phone: string | null; email: string | null };
  hasContact: boolean;
}

function channel(value: string | null): string | null {
  return value === null || value.trim().length === 0 ? null : value.trim();
}

export function toHelpModel(dto: HelpResponseDto): HelpModel {
  const contact = { phone: channel(dto.contact.phone), email: channel(dto.contact.email) };
  return {
    articles: dto.items.map((a) => ({ id: a.id, category: a.category, title: a.title, body: a.body })),
    categories: [...dto.categories],
    contact,
    hasContact: contact.phone !== null || contact.email !== null,
  };
}
