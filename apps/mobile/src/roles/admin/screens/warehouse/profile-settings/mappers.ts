/**
 * API shapes -> what the account and warehouse-profile screens draw (plan
 * phase 8). Pure (no React), so plain-Node vitest covers every rule here
 * (../../../tests/mappers_profile.test.ts).
 *
 * Nothing the API does not send is invented: no admin id, access level or
 * password-changed date on the account; no "this device" flag, location or
 * failed-login history on the sessions (BR-67); no occupancy per storage
 * location (batches are not linked to locations, BR-79). Quantities become
 * integer grams through parseKgToGrams (never parseFloat), and every enum goes
 * through an exhaustive table with an explicit fallback.
 */
import { ApiError } from '../../../../../shell/api/client';
import type { OffsetPage } from '../../../../../shell/api/pagination';
import { adminErrorKey } from '../../../api/errors';
import {
  ADMIN_NOTIFICATION_CATEGORIES,
  NEW_PASSWORD_MAX_LENGTH,
  NEW_PASSWORD_MIN_LENGTH,
  isAdminNotificationCategory,
  type AdminLocale,
  type AdminNotificationCategory,
  type AdminNotificationPreferencesDto,
  type CurrentUserDto,
  type HelpResponseDto,
  type MySessionDto,
} from '../../../api/profile';
import type { StorageLocationDto, WarehouseCapacityDto, WarehouseDto } from '../../../api/warehouses';
import { t, type TranslationKey } from '../../../i18n';
import { parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate, formatAdminDay, istWeekday, relativeTime } from '../../../utils/datetime';
import type {
  AccountProfileView,
  CapacityView,
  HelpView,
  OperatingDayView,
  SessionRowView,
  StorageLocationView,
  WarehouseProfileView,
  WarehouseScope,
} from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Scope ───────────────────────────────────────────────────────────────────

/** Main Warehouse view: no warehouseId means every warehouse. */
export function isMainScope(scope: WarehouseScope): boolean {
  return scope.warehouseId === undefined;
}

/**
 * The warehouse uuid a warehouse-profile screen reads (BR-30): a Sub scope is
 * ALWAYS its own warehouse, whatever was selected; Main reads its pick only
 * when the pick is a warehouse uuid (the old selector still offers sample
 * codes, which the API does not know). undefined = nothing to ask for.
 */
export function profileWarehouseId(scope: WarehouseScope, selectedId: string | undefined): string | undefined {
  if (scope.warehouseId !== undefined) return scope.warehouseId;
  return selectedId !== undefined && UUID_RE.test(selectedId) ? selectedId : undefined;
}

// ─── Account (GET /auth/me) ──────────────────────────────────────────────────

type AccountStatus = NonNullable<CurrentUserDto['status']>;

/** Every account status of docs/openapi.yaml CurrentUser.status, as an i18n key. */
export const ACCOUNT_STATUS_LABEL: Readonly<Record<AccountStatus, TranslationKey>> = {
  PENDING: 'profile.account.status.PENDING',
  ACTIVE: 'profile.account.status.ACTIVE',
  DISABLED: 'profile.account.status.DISABLED',
};

const ACCOUNT_STATUS_TONE: Readonly<Record<AccountStatus, AccountProfileView['statusTone']>> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  DISABLED: 'danger',
};

function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ACCOUNT_STATUS_LABEL, value);
}

function localeOf(value: unknown): AdminLocale {
  return value === 'ta' ? 'ta' : 'en';
}

/** 'Sub Warehouse Admin' / 'Main Warehouse Admin' for the scope the account runs in. */
export function roleLabelFor(scope: WarehouseScope): string {
  return t(isMainScope(scope) ? 'profile.role.MAIN_WH_ADMIN' : 'profile.role.SUB_WH_ADMIN');
}

/** 'All Warehouses' for Main, else the scope's warehouse name. */
export function scopeLabelFor(scope: WarehouseScope): string {
  return isMainScope(scope) ? t('profile.scope.allWarehouses') : (scope.warehouseName ?? '');
}

/** 'All Warehouses' for Main, else the account's warehouse (from /auth/me, then the scope). */
function warehouseLabelFor(me: CurrentUserDto, scope: WarehouseScope): string {
  if (isMainScope(scope)) return t('profile.scope.allWarehouses');
  const assignment = me.roles?.find((role) => role.code === 'SUB_WH_ADMIN' && role.warehouseId === scope.warehouseId);
  return assignment?.warehouseName ?? scope.warehouseName ?? '';
}

export function toAccountProfile(me: CurrentUserDto, scope: WarehouseScope, now: Date): AccountProfileView {
  const status = isAccountStatus(me.status) ? me.status : null;
  return {
    fullName: me.fullName,
    roleLabel: roleLabelFor(scope),
    warehouseLabel: warehouseLabelFor(me, scope),
    mobileNumber: me.mobile ?? null,
    email: me.email ?? null,
    preferredLocale: localeOf(me.preferredLocale),
    status: status === null ? t('profile.account.status.unknown') : t(ACCOUNT_STATUS_LABEL[status]),
    statusTone: status === null ? 'warning' : ACCOUNT_STATUS_TONE[status],
    createdDate: me.createdAt === undefined ? null : formatAdminDay(me.createdAt) || null,
    lastLogin: me.lastLoginAt === undefined || me.lastLoginAt === null ? null : formatAdminDate(me.lastLoginAt, now) || null,
  };
}

// ─── Sessions (GET /auth/me/sessions, BR-67) ─────────────────────────────────

type Platform = NonNullable<MySessionDto['platform']>;

const PLATFORM_LABEL: Readonly<Record<Platform, TranslationKey>> = {
  android: 'profile.session.platform.android',
  ios: 'profile.session.platform.ios',
  web: 'profile.session.platform.web',
};

function platformLabel(platform: unknown): string {
  return typeof platform === 'string' && Object.prototype.hasOwnProperty.call(PLATFORM_LABEL, platform)
    ? t(PLATFORM_LABEL[platform as Platform])
    : t('profile.session.platform.unknown');
}

function nonBlank(value: string | null | undefined): string | null {
  return value === null || value === undefined || value.trim() === '' ? null : value;
}

/** Only the allow-listed fields (BR-67c); no session is claimed to be this device. */
export function toSessionRow(session: MySessionDto, now: Date): SessionRowView {
  return {
    id: session.id,
    device: platformLabel(session.platform),
    userAgent: nonBlank(session.userAgent),
    started: formatAdminDate(session.issuedAt, now),
    lastActive: session.lastSeenAt === null ? null : relativeTime(session.lastSeenAt, now) || null,
    ip: nonBlank(session.lastSeenIp),
    expires: formatAdminDay(session.expiresAt),
  };
}

// ─── Admin notification preferences (BR-82) ──────────────────────────────────

export type PreferenceState = Record<AdminNotificationCategory, boolean>;

/** The screen's groups under the master switch (IN_APP_MASTER), in screen order. Every other category is in exactly one. */
export const NOTIFICATION_PREFERENCE_GROUPS: readonly {
  titleKey: TranslationKey;
  items: readonly { category: Exclude<AdminNotificationCategory, 'IN_APP_MASTER'>; labelKey: TranslationKey }[];
}[] = [
  {
    titleKey: 'profile.notifications.group.operational',
    items: [
      { category: 'GOODS_RECEIVING', labelKey: 'profile.notifications.GOODS_RECEIVING' },
      { category: 'INVENTORY_ALERTS', labelKey: 'profile.notifications.INVENTORY_ALERTS' },
      { category: 'WAREHOUSE_OPERATIONS', labelKey: 'profile.notifications.WAREHOUSE_OPERATIONS' },
      { category: 'TASK_ALERTS', labelKey: 'profile.notifications.TASK_ALERTS' },
      { category: 'EXCEPTION_ALERTS', labelKey: 'profile.notifications.EXCEPTION_ALERTS' },
    ],
  },
  {
    titleKey: 'profile.notifications.group.orders',
    items: [
      { category: 'ORDER_CONFIRMED', labelKey: 'profile.notifications.ORDER_CONFIRMED' },
      { category: 'ORDER_DISPATCHED', labelKey: 'profile.notifications.ORDER_DISPATCHED' },
      { category: 'ORDER_DELIVERED', labelKey: 'profile.notifications.ORDER_DELIVERED' },
    ],
  },
  {
    titleKey: 'profile.notifications.group.wallet',
    items: [
      { category: 'WALLET_CREDITED', labelKey: 'profile.notifications.WALLET_CREDITED' },
      { category: 'PAYOUT_RELEASED', labelKey: 'profile.notifications.PAYOUT_RELEASED' },
    ],
  },
  {
    titleKey: 'profile.notifications.group.system',
    items: [
      { category: 'SYSTEM_MESSAGES', labelKey: 'profile.notifications.SYSTEM_MESSAGES' },
      { category: 'MAINTENANCE_MESSAGES', labelKey: 'profile.notifications.MAINTENANCE_MESSAGES' },
      { category: 'SECURITY_ALERTS', labelKey: 'profile.notifications.SECURITY_ALERTS' },
    ],
  },
];

/** Every category on: "no stored row = enabled" (BR-82), and what Reset to Default sets. */
export function defaultPreferenceState(): PreferenceState {
  const state = {} as PreferenceState;
  for (const category of ADMIN_NOTIFICATION_CATEGORIES) state[category] = true;
  return state;
}

/** The server rows over the all-enabled default; a row for an unknown category is ignored. */
export function toPreferenceState(dto: AdminNotificationPreferencesDto): PreferenceState {
  const state = defaultPreferenceState();
  for (const row of dto.items) {
    if (isAdminNotificationCategory(row.category) && typeof row.enabled === 'boolean') state[row.category] = row.enabled;
  }
  return state;
}

/** What Save must PATCH: the categories whose value differs from the saved one, in screen order. */
export function changedPreferences(
  saved: PreferenceState,
  draft: PreferenceState,
): { category: AdminNotificationCategory; enabled: boolean }[] {
  return ADMIN_NOTIFICATION_CATEGORIES.filter((category) => saved[category] !== draft[category]).map((category) => ({
    category,
    enabled: draft[category],
  }));
}

// ─── Help (GET /admin/help, BR-82) ───────────────────────────────────────────

export function toHelpView(dto: HelpResponseDto): HelpView {
  return {
    articles: dto.items.map((item) => ({ id: item.id, category: item.category, question: item.title, answer: item.body })),
    categories: [...dto.categories],
    contact: { phone: nonBlank(dto.contact.phone), email: nonBlank(dto.contact.email) },
  };
}

// ─── Change password ─────────────────────────────────────────────────────────

export interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

/** The form check before any request (the bounds are docs/openapi.yaml's 10..128); null when it may be sent. */
export function passwordFormErrorKey(form: PasswordForm): TranslationKey | null {
  if (form.current === '' || form.next === '' || form.confirm === '') return 'profile.password.error.required';
  if (form.next.length < NEW_PASSWORD_MIN_LENGTH) return 'profile.password.error.tooShort';
  if (form.next.length > NEW_PASSWORD_MAX_LENGTH) return 'profile.password.error.tooLong';
  if (form.next !== form.confirm) return 'profile.password.error.mismatch';
  if (form.next === form.current) return 'profile.password.error.same';
  return null;
}

/**
 * The message for a failed change. A wrong current password is 401
 * UNAUTHENTICATED on this route; the generic "your session has ended" would be
 * wrong (the session is fine), so it gets its own message.
 */
export function passwordChangeErrorKey(err: unknown): TranslationKey {
  if (err instanceof ApiError && err.problem.code === 'UNAUTHENTICATED') return 'profile.password.error.currentIncorrect';
  return adminErrorKey(err);
}

// ─── Warehouse (GET /warehouses/{id}, BR-66) ─────────────────────────────────

const WAREHOUSE_KIND_LABEL: Readonly<Record<WarehouseDto['type'], TranslationKey>> = {
  MAIN: 'profile.warehouse.kind.MAIN',
  SUB: 'profile.warehouse.kind.SUB',
};

function kindLabel(type: unknown): string {
  return typeof type === 'string' && Object.prototype.hasOwnProperty.call(WAREHOUSE_KIND_LABEL, type)
    ? t(WAREHOUSE_KIND_LABEL[type as WarehouseDto['type']])
    : t('profile.warehouse.kind.unknown');
}

function activeLabel(isActive: boolean): string {
  return t(isActive ? 'profile.status.active' : 'profile.status.inactive');
}

function coordinatesOf(latitude: number | null | undefined, longitude: number | null | undefined): string | null {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return t('profile.warehouse.coordinates', {
    lat: String(Math.abs(latitude)),
    ns: t(latitude < 0 ? 'profile.warehouse.south' : 'profile.warehouse.north'),
    lon: String(Math.abs(longitude)),
    ew: t(longitude < 0 ? 'profile.warehouse.west' : 'profile.warehouse.east'),
  });
}

export function toWarehouseProfile(dto: WarehouseDto): WarehouseProfileView {
  const parts = [dto.address, dto.city, dto.pincode].map((part) => nonBlank(part)).filter((part): part is string => part !== null);
  return {
    warehouseId: dto.id,
    name: dto.name,
    code: dto.code,
    isActive: dto.isActive,
    statusLabel: activeLabel(dto.isActive),
    kindLabel: kindLabel(dto.type),
    address: parts.length === 0 ? null : parts.join(', '),
    coordinates: coordinatesOf(dto.latitude, dto.longitude),
    contactPhone: nonBlank(dto.contactPhone),
  };
}

function gramsOrNull(kg: string | null | undefined): number | null {
  return kg === null || kg === undefined ? null : parseKgToGrams(kg);
}

/** BR-66b: the server's figures in grams, as sent: over capacity stays negative / above 100%. */
export function toCapacityView(dto: WarehouseCapacityDto): CapacityView {
  const percent = typeof dto.utilizationPercent === 'number' && Number.isFinite(dto.utilizationPercent) ? dto.utilizationPercent : null;
  return {
    capacityGrams: gramsOrNull(dto.capacityKg),
    usedGrams: parseKgToGrams(dto.usedKg) ?? 0,
    availableGrams: gramsOrNull(dto.availableKg),
    utilizationLabel: percent === null ? null : t('profile.capacity.percent', { value: String(percent) }),
    fillPercent: percent === null ? 0 : Math.min(100, Math.max(0, percent)),
  };
}

/**
 * The next page number of GET /warehouses/{id}/storage-locations, which pages
 * by number (OffsetPage), not by cursor; undefined once every row is loaded.
 */
export function nextStoragePage(lastPage: OffsetPage<unknown>): number | undefined {
  return lastPage.page * lastPage.pageSize < lastPage.total ? lastPage.page + 1 : undefined;
}

export function toStorageLocation(dto: StorageLocationDto): StorageLocationView {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    type: nonBlank(dto.locationType),
    isActive: dto.isActive,
    statusLabel: activeLabel(dto.isActive),
    capacityGrams: gramsOrNull(dto.capacityKg),
  };
}

// ─── Operating hours ─────────────────────────────────────────────────────────

/** The week of PATCH /warehouses/{id} `operatingHours`, Monday first, with the IST weekday number of each. */
const WEEK: readonly { key: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'; weekday: number; labelKey: TranslationKey }[] = [
  { key: 'mon', weekday: 1, labelKey: 'profile.operating.day.mon' },
  { key: 'tue', weekday: 2, labelKey: 'profile.operating.day.tue' },
  { key: 'wed', weekday: 3, labelKey: 'profile.operating.day.wed' },
  { key: 'thu', weekday: 4, labelKey: 'profile.operating.day.thu' },
  { key: 'fri', weekday: 5, labelKey: 'profile.operating.day.fri' },
  { key: 'sat', weekday: 6, labelKey: 'profile.operating.day.sat' },
  { key: 'sun', weekday: 0, labelKey: 'profile.operating.day.sun' },
];

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * The stored hours, or null when nothing is stored or the stored value is not
 * the one shape docs/openapi.yaml defines (all seven days, each
 * `{closed: true}` or `{closed: false, open: 'HH:MM', close: 'HH:MM'}`). The
 * read format is otherwise unspecified, so anything else is shown as "not
 * configured" rather than guessed at. Today is the IST weekday.
 */
export function toOperatingWeek(operatingHours: unknown, now: Date): OperatingDayView[] | null {
  if (operatingHours === null || typeof operatingHours !== 'object' || Array.isArray(operatingHours)) return null;
  const record = operatingHours as Record<string, unknown>;
  const today = istWeekday(now);
  const days: OperatingDayView[] = [];
  for (const { key, weekday, labelKey } of WEEK) {
    const value = record[key];
    if (value === null || typeof value !== 'object') return null;
    const day = value as Record<string, unknown>;
    let hours: string | null;
    if (day['closed'] === true) {
      hours = null;
    } else if (
      day['closed'] === false &&
      typeof day['open'] === 'string' &&
      typeof day['close'] === 'string' &&
      HHMM_RE.test(day['open']) &&
      HHMM_RE.test(day['close'])
    ) {
      hours = t('profile.operating.hours', { open: day['open'], close: day['close'] });
    } else {
      return null;
    }
    days.push({ day: t(labelKey), hours, isToday: weekday === today });
  }
  return days;
}
