/**
 * screens/warehouse/profile-settings/mappers.ts (plan phase 8): the API shapes
 * of roles/admin/api/profile.ts and api/warehouses.ts turned into what the
 * account and warehouse-profile screens draw.
 *
 * Quantities become integer grams (never a float), status enums go through
 * exhaustive tables with a fallback, and nothing the API does not send is
 * invented: no "current session" flag (BR-67), no admin id, no access level,
 * no password-changed date, no failed-login history.
 */
import { describe, expect, it } from 'vitest';
import type { CurrentUserDto, HelpResponseDto, MySessionDto } from '../api/profile';
import type { StorageLocationDto, WarehouseCapacityDto, WarehouseDto } from '../api/warehouses';
import {
  ACCOUNT_STATUS_LABEL,
  NOTIFICATION_PREFERENCE_GROUPS,
  changedPreferences,
  defaultPreferenceState,
  nextStoragePage,
  passwordFormErrorKey,
  passwordChangeErrorKey,
  toAccountProfile,
  toCapacityView,
  toHelpView,
  toOperatingWeek,
  toPreferenceState,
  toSessionRow,
  toStorageLocation,
  toWarehouseProfile,
} from '../screens/warehouse/profile-settings/mappers';
import { ApiError, NetworkError } from '../../../shell/api/client';

const OWN = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const SUB_SCOPE = { warehouseId: OWN, warehouseName: 'Coonoor', warehouseCode: 'WH-COON' };
const MAIN_SCOPE = {};
// 2026-10-13 10:00 IST (a Tuesday).
const NOW = new Date('2026-10-13T04:30:00.000Z');

const ME: CurrentUserDto = {
  id: '2a9f0d1b-7c3e-4a55-9f0b-1e2d3c4b5a60',
  fullName: 'Suresh Kumar',
  mobile: '+919800000006',
  email: null,
  userType: 'admin',
  preferredLocale: 'ta',
  status: 'ACTIVE',
  createdAt: '2026-09-01T09:30:00.000Z',
  lastLoginAt: '2026-10-13T03:00:00.000Z',
  roles: [{ code: 'SUB_WH_ADMIN', warehouseId: OWN, warehouseName: 'Coonoor' }],
  permissions: ['auth.principal.view_own'],
};

describe('toAccountProfile (BR-67 additive fields, BR-82)', () => {
  it('shows the account as /auth/me sends it', () => {
    const profile = toAccountProfile(ME, SUB_SCOPE, NOW);
    expect(profile).toEqual({
      fullName: 'Suresh Kumar',
      roleLabel: 'Sub Warehouse Admin',
      warehouseLabel: 'Coonoor',
      mobileNumber: '+919800000006',
      email: null,
      preferredLocale: 'ta',
      status: 'Active',
      statusTone: 'success',
      createdDate: '1 Sep 2026',
      lastLogin: 'Today · 08:30 AM',
    });
  });

  it('BR-67g: lastLoginAt null (never logged in) stays null, it is not invented', () => {
    expect(toAccountProfile({ ...ME, lastLoginAt: null }, SUB_SCOPE, NOW).lastLogin).toBeNull();
  });

  it('carries no admin id, access level or password-changed date (the API has none)', () => {
    const profile = toAccountProfile(ME, SUB_SCOPE, NOW) as unknown as Record<string, unknown>;
    expect(Object.keys(profile)).not.toEqual(expect.arrayContaining(['adminId']));
    expect(profile).not.toHaveProperty('adminId');
    expect(profile).not.toHaveProperty('accessLevel');
    expect(profile).not.toHaveProperty('passwordChanged');
  });

  it('Main reads "All Warehouses"; the warehouse name falls back to the scope', () => {
    expect(toAccountProfile({ ...ME, roles: [{ code: 'MAIN_WH_ADMIN' }] }, MAIN_SCOPE, NOW).warehouseLabel).toBe('All Warehouses');
    expect(toAccountProfile({ ...ME, roles: [] }, SUB_SCOPE, NOW).warehouseLabel).toBe('Coonoor');
  });

  it('every account status has a label, with an explicit fallback for an unknown one', () => {
    expect(ACCOUNT_STATUS_LABEL).toEqual({
      PENDING: 'profile.account.status.PENDING',
      ACTIVE: 'profile.account.status.ACTIVE',
      DISABLED: 'profile.account.status.DISABLED',
    });
    expect(toAccountProfile({ ...ME, status: 'PENDING' }, SUB_SCOPE, NOW).status).toBe('Pending');
    const odd = toAccountProfile({ ...ME, status: 'SUSPENDED' as 'ACTIVE' }, SUB_SCOPE, NOW);
    expect(odd.status).toBe('Unknown');
    expect(odd.statusTone).toBe('warning');
    expect(toAccountProfile({ ...ME, status: 'DISABLED' }, SUB_SCOPE, NOW).statusTone).toBe('danger');
  });

  it('a missing or unknown locale reads as English (the API default)', () => {
    const { preferredLocale: _omit, ...noLocale } = ME;
    expect(toAccountProfile(noLocale, SUB_SCOPE, NOW).preferredLocale).toBe('en');
    expect(toAccountProfile({ ...ME, preferredLocale: 'fr' as 'en' }, SUB_SCOPE, NOW).preferredLocale).toBe('en');
  });
});

describe('toSessionRow (BR-67)', () => {
  const SESSION: MySessionDto = {
    id: '5a5a5a5a-5a5a-45a5-85a5-5a5a5a5a5a5a',
    platform: 'android',
    userAgent: 'okhttp/4.9.2',
    issuedAt: '2026-10-13T03:00:00.000Z',
    lastSeenAt: '2026-10-13T04:20:00.000Z',
    lastSeenIp: '10.0.2.2',
    expiresAt: '2026-11-12T03:00:00.000Z',
  };

  it('BR-67c: shows exactly the allow-listed fields and never claims which session is current', () => {
    const row = toSessionRow(SESSION, NOW);
    expect(row).toEqual({
      id: SESSION.id,
      device: 'Android',
      userAgent: 'okhttp/4.9.2',
      started: 'Today · 08:30 AM',
      lastActive: '10 minutes ago',
      ip: '10.0.2.2',
      expires: '12 Nov 2026',
    });
    expect(row).not.toHaveProperty('isCurrent');
  });

  it('null platform, user agent, last-seen time and IP stay empty, not invented', () => {
    const row = toSessionRow({ ...SESSION, platform: null, userAgent: null, lastSeenAt: null, lastSeenIp: null }, NOW);
    expect(row.device).toBe('Unknown device');
    expect(row.userAgent).toBeNull();
    expect(row.lastActive).toBeNull();
    expect(row.ip).toBeNull();
  });

  it('every platform has a label, with a fallback for one the app does not know', () => {
    expect(toSessionRow({ ...SESSION, platform: 'ios' }, NOW).device).toBe('iPhone / iPad');
    expect(toSessionRow({ ...SESSION, platform: 'web' }, NOW).device).toBe('Web browser');
    expect(toSessionRow({ ...SESSION, platform: 'tv' as 'web' }, NOW).device).toBe('Unknown device');
  });
});

describe('admin notification preferences (BR-82)', () => {
  it('BR-82: every one of the 14 categories is in exactly one screen group, in screen order', () => {
    const flat = NOTIFICATION_PREFERENCE_GROUPS.flatMap((g) => g.items.map((i) => i.category));
    expect(['IN_APP_MASTER', ...flat]).toEqual([
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
    ]);
  });

  it('BR-82: maps the server rows; a category the server did not send defaults to enabled; unknown rows are ignored', () => {
    const state = toPreferenceState({
      items: [
        { category: 'IN_APP_MASTER', enabled: false },
        { category: 'ORDER_DELIVERED', enabled: false },
        { category: 'NOT_A_CATEGORY' as 'IN_APP_MASTER', enabled: false },
      ],
    });
    expect(state.IN_APP_MASTER).toBe(false);
    expect(state.ORDER_DELIVERED).toBe(false);
    expect(state.SECURITY_ALERTS).toBe(true);
    expect(Object.keys(state)).toHaveLength(14);
    expect(state).not.toHaveProperty('NOT_A_CATEGORY');
  });

  it('Reset to default is every category enabled (there is no bulk reset endpoint)', () => {
    const all = defaultPreferenceState();
    expect(Object.values(all).every((v) => v === true)).toBe(true);
    expect(Object.keys(all)).toHaveLength(14);
  });

  it('Save sends only the categories that changed, in screen order', () => {
    const saved = defaultPreferenceState();
    const draft = { ...saved, SECURITY_ALERTS: false, IN_APP_MASTER: false, GOODS_RECEIVING: true };
    expect(changedPreferences(saved, draft)).toEqual([
      { category: 'IN_APP_MASTER', enabled: false },
      { category: 'SECURITY_ALERTS', enabled: false },
    ]);
    expect(changedPreferences(saved, saved)).toEqual([]);
  });
});

describe('toHelpView (BR-82)', () => {
  const HELP: HelpResponseDto = {
    items: [
      { id: 'a1', category: 'Orders', locale: 'en', title: 'How do I pack?', body: 'Open the order.', sortOrder: 1 },
      { id: 'a2', category: 'Wallet', locale: 'en', title: 'Top-up?', body: 'Search the customer.', sortOrder: 1 },
    ],
    categories: ['Orders', 'Wallet'],
    contact: { phone: null, email: 'help@example.org' },
  };

  it('keeps the server order and the server categories; no question is invented', () => {
    const view = toHelpView(HELP);
    expect(view.articles).toEqual([
      { id: 'a1', category: 'Orders', question: 'How do I pack?', answer: 'Open the order.' },
      { id: 'a2', category: 'Wallet', question: 'Top-up?', answer: 'Search the customer.' },
    ]);
    expect(view.categories).toEqual(['Orders', 'Wallet']);
  });

  it('BR-82i: a contact channel not configured stays null (the screen hides it)', () => {
    expect(toHelpView(HELP).contact).toEqual({ phone: null, email: 'help@example.org' });
    expect(toHelpView({ items: [], categories: [], contact: { phone: '  ', email: null } }).contact).toEqual({ phone: null, email: null });
  });
});

describe('warehouse profile (BR-66)', () => {
  const WAREHOUSE: WarehouseDto = {
    id: OWN,
    code: 'WH-COON',
    name: 'Coonoor Warehouse',
    type: 'SUB',
    address: 'Bedford',
    city: 'Coonoor',
    pincode: '643101',
    latitude: 11.353,
    longitude: 76.7959,
    capacityKg: '30000.000',
    contactPhone: '+914232000000',
    operatingHours: null,
    isMarketDayVenue: false,
    marketDayOfWeek: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('maps the record; the address joins only the parts that are set', () => {
    expect(toWarehouseProfile(WAREHOUSE)).toEqual({
      warehouseId: OWN,
      name: 'Coonoor Warehouse',
      code: 'WH-COON',
      isActive: true,
      statusLabel: 'Active',
      kindLabel: 'Sub Warehouse',
      address: 'Bedford, Coonoor, 643101',
      coordinates: '11.353° N, 76.7959° E',
      contactPhone: '+914232000000',
    });
    const bare = toWarehouseProfile({ ...WAREHOUSE, address: null, city: null, pincode: null, latitude: null, longitude: null, contactPhone: null, isActive: false });
    expect(bare.address).toBeNull();
    expect(bare.coordinates).toBeNull();
    expect(bare.contactPhone).toBeNull();
    expect(bare.statusLabel).toBe('Inactive');
  });

  it('every warehouse type has a label, with a fallback', () => {
    expect(toWarehouseProfile({ ...WAREHOUSE, type: 'MAIN' }).kindLabel).toBe('Main Warehouse');
    expect(toWarehouseProfile({ ...WAREHOUSE, type: 'HUB' as 'MAIN' }).kindLabel).toBe('Warehouse');
  });

  it('southern / western coordinates read S / W', () => {
    expect(toWarehouseProfile({ ...WAREHOUSE, latitude: -1.5, longitude: -0.25 }).coordinates).toBe('1.5° S, 0.25° W');
  });

  it('BR-66b: capacity as integer grams, exactly, with the server utilisation as given', () => {
    const capacity: WarehouseCapacityDto = {
      warehouseId: OWN,
      capacityKg: '30000.000',
      usedKg: '12500.250',
      availableKg: '17499.750',
      utilizationPercent: 41.67,
    };
    expect(toCapacityView(capacity)).toEqual({
      capacityGrams: 30_000_000,
      usedGrams: 12_500_250,
      availableGrams: 17_499_750,
      utilizationLabel: '41.67%',
      fillPercent: 41.67,
    });
  });

  it('BR-66b: over capacity is not clamped (negative available, over 100%); the bar alone is capped', () => {
    const over = toCapacityView({ warehouseId: OWN, capacityKg: '100.000', usedKg: '100.300', availableKg: '-0.300', utilizationPercent: 100.3 });
    expect(over.availableGrams).toBe(-300);
    expect(over.utilizationLabel).toBe('100.3%');
    expect(over.fillPercent).toBe(100);
  });

  it('BR-66b: no capacity set means null capacity, available and utilisation (not 0)', () => {
    expect(toCapacityView({ warehouseId: OWN, capacityKg: null, usedKg: '0.000', availableKg: null, utilizationPercent: null })).toEqual({
      capacityGrams: null,
      usedGrams: 0,
      availableGrams: null,
      utilizationLabel: null,
      fillPercent: 0,
    });
  });

  it('grams never drift: 0.1 + 0.2 kg is exactly 300 g', () => {
    const view = toCapacityView({ warehouseId: OWN, capacityKg: '0.300', usedKg: '0.100', availableKg: '0.200', utilizationPercent: 33.33 });
    expect((view.usedGrams ?? 0) + (view.availableGrams ?? 0)).toBe(view.capacityGrams);
  });
});

describe('toStorageLocation (BR-79)', () => {
  const LOCATION: StorageLocationDto = {
    id: 'loc-1',
    warehouseId: OWN,
    code: 'CS-A',
    name: 'Cold Storage A',
    locationType: 'Cold Storage',
    capacityKg: '1250.500',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
  };

  it('maps code, name, the free-text type and the display capacity in grams', () => {
    expect(toStorageLocation(LOCATION)).toEqual({
      id: 'loc-1',
      code: 'CS-A',
      name: 'Cold Storage A',
      type: 'Cold Storage',
      isActive: true,
      statusLabel: 'Active',
      capacityGrams: 1_250_500,
    });
  });

  it('a missing type or capacity stays null (no occupancy is invented: batches are not linked)', () => {
    const view = toStorageLocation({ ...LOCATION, locationType: null, capacityKg: null, isActive: false });
    expect(view.type).toBeNull();
    expect(view.capacityGrams).toBeNull();
    expect(view.statusLabel).toBe('Inactive');
    expect(view).not.toHaveProperty('currentKg');
  });
});

describe('nextStoragePage (OffsetPage paging, storage locations only)', () => {
  it('asks for the next page number while page x pageSize is below the total', () => {
    expect(nextStoragePage({ items: [], page: 1, pageSize: 20, total: 45 })).toBe(2);
    expect(nextStoragePage({ items: [], page: 2, pageSize: 20, total: 45 })).toBe(3);
    expect(nextStoragePage({ items: [], page: 3, pageSize: 20, total: 45 })).toBeUndefined();
    expect(nextStoragePage({ items: [], page: 1, pageSize: 20, total: 20 })).toBeUndefined();
    expect(nextStoragePage({ items: [], page: 1, pageSize: 20, total: 0 })).toBeUndefined();
  });
});

describe('toOperatingWeek', () => {
  const HOURS = {
    mon: { closed: false, open: '08:00', close: '18:00' },
    tue: { closed: false, open: '08:00', close: '18:00' },
    wed: { closed: false, open: '08:00', close: '18:00' },
    thu: { closed: false, open: '08:00', close: '18:00' },
    fri: { closed: false, open: '08:00', close: '18:00' },
    sat: { closed: false, open: '09:00', close: '13:00' },
    sun: { closed: true },
  };

  it('reads the stored week (Monday first) and marks today in IST', () => {
    const week = toOperatingWeek(HOURS, NOW);
    expect(week?.map((d) => [d.day, d.hours, d.isToday])).toEqual([
      ['Monday', '08:00 – 18:00', false],
      ['Tuesday', '08:00 – 18:00', true],
      ['Wednesday', '08:00 – 18:00', false],
      ['Thursday', '08:00 – 18:00', false],
      ['Friday', '08:00 – 18:00', false],
      ['Saturday', '09:00 – 13:00', false],
      ['Sunday', null, false],
    ]);
  });

  it('today follows IST, not the device zone: 23:00 UTC Monday is already Tuesday in India', () => {
    const lateMondayUtc = new Date('2026-10-12T23:00:00.000Z');
    expect(toOperatingWeek(HOURS, lateMondayUtc)?.find((d) => d.isToday)?.day).toBe('Tuesday');
  });

  it('nothing stored, or a shape the spec does not define, is "not configured" (null), never guessed', () => {
    expect(toOperatingWeek(null, NOW)).toBeNull();
    expect(toOperatingWeek('Mon-Sat 8 to 6', NOW)).toBeNull();
    expect(toOperatingWeek({ ...HOURS, sun: undefined }, NOW)).toBeNull();
    expect(toOperatingWeek({ ...HOURS, mon: { closed: false, open: '8am', close: '18:00' } }, NOW)).toBeNull();
  });
});

describe('the change-password form', () => {
  it('checks the form before any request: all fields, 10..128 characters, confirmation, a different password', () => {
    expect(passwordFormErrorKey({ current: '', next: 'NewPassword@1', confirm: 'NewPassword@1' })).toBe('profile.password.error.required');
    expect(passwordFormErrorKey({ current: 'old', next: 'short', confirm: 'short' })).toBe('profile.password.error.tooShort');
    expect(passwordFormErrorKey({ current: 'old', next: 'x'.repeat(129), confirm: 'x'.repeat(129) })).toBe('profile.password.error.tooLong');
    expect(passwordFormErrorKey({ current: 'old', next: 'NewPassword@1', confirm: 'NewPassword@2' })).toBe('profile.password.error.mismatch');
    expect(passwordFormErrorKey({ current: 'NewPassword@1', next: 'NewPassword@1', confirm: 'NewPassword@1' })).toBe('profile.password.error.same');
    expect(passwordFormErrorKey({ current: 'old', next: 'NewPassword@1', confirm: 'NewPassword@1' })).toBeNull();
  });

  it('a wrong current password (401 UNAUTHENTICATED) says so, not "your session has ended"', () => {
    const wrong = new ApiError({ type: 'about:blank', title: 'Unauthorized', status: 401, code: 'UNAUTHENTICATED' });
    expect(passwordChangeErrorKey(wrong)).toBe('profile.password.error.currentIncorrect');
  });

  it('any other failure uses the shared admin error message', () => {
    expect(passwordChangeErrorKey(new ApiError({ type: 'about:blank', title: 'x', status: 429, code: 'RATE_LIMITED' }))).toBe('admin.error.RATE_LIMITED');
    expect(passwordChangeErrorKey(new NetworkError(new Error('offline')))).toBe('admin.error.network');
  });
});
