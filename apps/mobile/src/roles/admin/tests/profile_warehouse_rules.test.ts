/**
 * Warehouse profile / settings rules the screens delegate to
 * ../screens/warehouse/profile-settings/warehouseProfileRules.ts (pure, so
 * plain-Node vitest covers them):
 *
 *  - BR-80a  the PATCH /warehouses/{id} body carries contactPhone and/or
 *            operatingHours and nothing else, only what changed;
 *  - BR-80b  operatingHours is the API's strict 7-day object, built from the
 *            editor and formatted back to display lines;
 *  - BR-80c  the edit gate is the warehouse.profile.edit code (Sub none);
 *  - BR-66b/c capacity is shown from GET /capacity (never a constant) and
 *            sent as a decimal kg string; the gate is warehouse.capacity.set.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { WEEKDAYS, type OperatingHoursDto } from '../api/warehouseSettings';
import { makeCan } from '../permissions/can';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import { t } from '../i18n';
import {
  accessLevelKey,
  buildOperatingHours,
  buildWarehouseProfileEditBody,
  canEditWarehouseProfile,
  canSetWarehouseCapacity,
  capacityFigures,
  operatingHoursLines,
  operatingHoursToEdit,
  parseCapacityInput,
  parseOperatingHours,
  roleLabelKey,
} from '../screens/warehouse/profile-settings/warehouseProfileRules';

const NINE_TO_SIX = { closed: false, open: '09:00', close: '18:00' } as const;
const WEEK: OperatingHoursDto = {
  mon: NINE_TO_SIX,
  tue: NINE_TO_SIX,
  wed: NINE_TO_SIX,
  thu: NINE_TO_SIX,
  fri: NINE_TO_SIX,
  sat: { closed: false, open: '09:00', close: '13:00' },
  sun: { closed: true },
};

const mainCan = makeCan(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN);
const subCan = makeCan(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN);

describe('RBAC: role labels come from the role code, one label per role', () => {
  const adminRoles = [
    RoleCode.SUPER_ADMIN,
    RoleCode.TOHFA_ADMIN,
    RoleCode.FARMER_ADMIN,
    RoleCode.MAIN_WH_ADMIN,
    RoleCode.SUB_WH_ADMIN,
  ];

  it('gives every admin role its own, distinct label', () => {
    const labels = adminRoles.map((code) => t(roleLabelKey(code)));
    expect(new Set(labels).size).toBe(adminRoles.length);
    for (const [i, code] of adminRoles.entries()) expect(labels[i]).not.toBe(roleLabelKey(code));
  });

  it('never calls a Super Admin or a Main admin a Sub Warehouse admin', () => {
    const sub = t(roleLabelKey(RoleCode.SUB_WH_ADMIN));
    expect(t(roleLabelKey(RoleCode.SUPER_ADMIN))).not.toBe(sub);
    expect(t(roleLabelKey(RoleCode.MAIN_WH_ADMIN))).not.toBe(sub);
    expect(t(accessLevelKey(RoleCode.SUPER_ADMIN))).not.toBe(t(accessLevelKey(RoleCode.SUB_WH_ADMIN)));
  });

  it('an unknown or missing role is an honest unknown label, not a guessed role', () => {
    expect(roleLabelKey(undefined)).toBe('profile.role.unknown');
    expect(roleLabelKey('NOT_A_ROLE')).toBe('profile.role.unknown');
    expect(accessLevelKey(undefined)).toBe('profile.accessLevel.unknown');
  });
});

describe('BR-80c: the warehouse profile edit gate is warehouse.profile.edit (Sub none)', () => {
  it('BR-80c: Main may edit, Sub may not (docs/rbac.json grants)', () => {
    expect(canEditWarehouseProfile(mainCan)).toBe(true);
    expect(canEditWarehouseProfile(subCan)).toBe(false);
  });

  it('BR-80c: fails closed without a permission list', () => {
    expect(canEditWarehouseProfile(makeCan(undefined))).toBe(false);
  });

  it('BR-66c: capacity is gated on warehouse.capacity.set (Sub none)', () => {
    expect(canSetWarehouseCapacity(mainCan)).toBe(true);
    expect(canSetWarehouseCapacity(subCan)).toBe(false);
  });
});

describe('BR-80b: operatingHours format and build', () => {
  it('BR-80b: parses the strict 7-day object and rejects anything else', () => {
    expect(parseOperatingHours(WEEK)).toEqual(WEEK);
    expect(parseOperatingHours(null)).toBeNull();
    expect(parseOperatingHours('9 AM - 6 PM')).toBeNull();
    const { sun: _sun, ...sixDays } = WEEK;
    expect(parseOperatingHours(sixDays)).toBeNull();
    expect(parseOperatingHours({ ...WEEK, mon: { closed: false, open: '9:00', close: '18:00' } })).toBeNull();
    expect(parseOperatingHours({ ...WEEK, holiday: { closed: true } })).toBeNull();
  });

  it('BR-80b: formats the object as seven display lines, Monday first', () => {
    const lines = operatingHoursLines(WEEK);
    expect(lines).not.toBeNull();
    expect(lines?.map((l) => l.day)).toEqual([...WEEKDAYS]);
    expect(lines?.[0]).toMatchObject({ day: 'mon', closed: false, dayLabel: t('profile.operating.day.mon') });
    expect(lines?.[0]?.text).toBe(t('profile.operating.hours', { open: '09:00', close: '18:00' }));
    expect(lines?.[6]).toMatchObject({ day: 'sun', closed: true, text: t('profile.operating.closed') });
  });

  it('BR-80b: an unset or malformed value formats to null (screen shows "not configured")', () => {
    expect(operatingHoursLines(null)).toBeNull();
    expect(operatingHoursLines('6:00 AM – 6:00 PM')).toBeNull();
  });

  it('BR-80b: the editor round-trips to exactly the API shape', () => {
    const built = buildOperatingHours(operatingHoursToEdit(WEEK));
    expect(built).toEqual({ ok: true, value: WEEK });
  });

  it('BR-80b: a closed day carries no times on the wire', () => {
    const edit = operatingHoursToEdit(WEEK);
    edit.mon = { open: false, openTime: '09:00', closeTime: '18:00' };
    const built = buildOperatingHours(edit);
    expect(built.ok && built.value.mon).toEqual({ closed: true });
  });

  it('BR-80b: rejects a malformed time and an open time not before the close time', () => {
    const bad = operatingHoursToEdit(WEEK);
    bad.tue = { open: true, openTime: '9am', closeTime: '18:00' };
    expect(buildOperatingHours(bad)).toEqual({ ok: false, errorKey: 'profile.edit.error.hoursFormat', day: 'tue' });
    const order = operatingHoursToEdit(WEEK);
    order.wed = { open: true, openTime: '18:00', closeTime: '09:00' };
    expect(buildOperatingHours(order)).toEqual({ ok: false, errorKey: 'profile.edit.error.hoursOrder', day: 'wed' });
  });

  it('BR-80b: with no hours set, the editor starts with every day closed (no invented hours)', () => {
    const edit = operatingHoursToEdit(null);
    for (const day of WEEKDAYS) expect(edit[day]).toEqual({ open: false, openTime: '', closeTime: '' });
  });
});

describe('BR-80a: the edit body holds only the schema-allowed fields that changed', () => {
  const current = { contactPhone: '+919876543210', operatingHours: WEEK };

  it('BR-80a: an unchanged form is refused before any request', () => {
    const result = buildWarehouseProfileEditBody(current, {
      contactPhone: '+919876543210',
      hours: operatingHoursToEdit(WEEK),
    });
    expect(result).toEqual({ ok: false, errorKey: 'profile.edit.error.noChanges' });
  });

  it('BR-80a: a phone change sends contactPhone only', () => {
    const result = buildWarehouseProfileEditBody(current, {
      contactPhone: '+91 94421 88210',
      hours: operatingHoursToEdit(WEEK),
    });
    expect(result).toEqual({ ok: true, value: { contactPhone: '+919442188210' } });
    expect(result.ok && Object.keys(result.value)).toEqual(['contactPhone']);
  });

  it('BR-80a: an hours change sends the full 7-day operatingHours only', () => {
    const hours = operatingHoursToEdit(WEEK);
    hours.sun = { open: true, openTime: '10:00', closeTime: '12:00' };
    const result = buildWarehouseProfileEditBody(current, { contactPhone: '+919876543210', hours });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.value)).toEqual(['operatingHours']);
    expect(result.value.operatingHours?.sun).toEqual({ closed: false, open: '10:00', close: '12:00' });
    expect(Object.keys(result.value.operatingHours ?? {})).toEqual([...WEEKDAYS]);
  });

  it('BR-80a: never carries name, code, address or capacity keys', () => {
    const hours = operatingHoursToEdit(WEEK);
    hours.mon = { open: false, openTime: '', closeTime: '' };
    const result = buildWarehouseProfileEditBody(current, { contactPhone: '+919000000001', hours });
    expect(result.ok && Object.keys(result.value).sort()).toEqual(['contactPhone', 'operatingHours']);
  });

  it('BR-80a: an emptied phone clears it with null; a non-E.164 phone is refused', () => {
    expect(buildWarehouseProfileEditBody(current, { contactPhone: '  ', hours: operatingHoursToEdit(WEEK) })).toEqual({
      ok: true,
      value: { contactPhone: null },
    });
    expect(buildWarehouseProfileEditBody(current, { contactPhone: '98765 43210', hours: operatingHoursToEdit(WEEK) })).toEqual({
      ok: false,
      errorKey: 'profile.edit.error.phone',
    });
  });

  it('BR-80a: untouched hours on a warehouse with none set are not sent as an all-closed week', () => {
    const result = buildWarehouseProfileEditBody(
      { contactPhone: null, operatingHours: null },
      { contactPhone: '+919876543210', hours: operatingHoursToEdit(null) },
    );
    expect(result).toEqual({ ok: true, value: { contactPhone: '+919876543210' } });
  });
});

describe('BR-66: capacity figures and input', () => {
  it('BR-66b: figures come from GET /capacity, grouped, never a constant', () => {
    const figures = capacityFigures({
      warehouseId: 'w',
      capacityKg: '50000.000',
      usedKg: '32450.500',
      availableKg: '17549.500',
      utilizationPercent: 64.9,
    });
    expect(figures.total).toBe(t('unit.kg', { value: '50,000' }));
    expect(figures.used).toBe(t('unit.kg', { value: '32,450.5' }));
    expect(figures.available).toBe(t('unit.kg', { value: '17,549.5' }));
    expect(figures.utilization).toBe(t('profile.capacity.percent', { value: '64.9' }));
    expect(figures.fillPercent).toBe(64.9);
  });

  it('BR-66b: no capacity set (or not loaded) is an honest dash', () => {
    const none = t('profile.noValue');
    expect(capacityFigures(null)).toEqual({ total: none, used: none, available: none, utilization: none, fillPercent: null });
    const unset = capacityFigures({ warehouseId: 'w', capacityKg: null, usedKg: '10.000', availableKg: null, utilizationPercent: null });
    expect(unset.total).toBe(none);
    expect(unset.used).toBe(t('unit.kg', { value: '10' }));
    expect(unset.fillPercent).toBeNull();
  });

  it('BR-66c: typed capacity becomes the API decimal kg string, never a float', () => {
    expect(parseCapacityInput('50,000')).toBe('50000.000');
    expect(parseCapacityInput(' 1250.5 ')).toBe('1250.500');
    expect(parseCapacityInput('0')).toBeNull();
    expect(parseCapacityInput('-5')).toBeNull();
    expect(parseCapacityInput('12.3456')).toBeNull();
    expect(parseCapacityInput('1e5')).toBeNull();
    expect(parseCapacityInput('')).toBeNull();
  });
});
