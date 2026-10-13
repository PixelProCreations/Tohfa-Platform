import { describe, expect, it } from 'vitest';
import type { StorageLocationDto, WarehouseCapacityDto, WarehouseDto } from '../api/warehouseInfo';
import { WAREHOUSE_TYPES } from '../api/warehouseInfo';
import { isTranslationKey } from '../i18n';
import type { AdminScope } from '../session/scope';
import {
  STORAGE_ACTIVE_FILTERS,
  WEEKDAYS,
  parseOperatingHours,
  scopedWarehouseId,
  toCapacity,
  toStorageLocationRow,
  toWarehouseInfo,
  warehouseTypeLabelKey,
} from '../screens/warehouse/warehouse-info/mappers';

const WH = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';

const hours = {
  mon: { closed: false, open: '09:00', close: '18:00' },
  tue: { closed: false, open: '09:00', close: '18:00' },
  wed: { closed: false, open: '09:00', close: '18:00' },
  thu: { closed: false, open: '09:00', close: '18:00' },
  fri: { closed: false, open: '09:00', close: '18:00' },
  sat: { closed: false, open: '09:00', close: '13:00' },
  sun: { closed: true },
};

const warehouse: WarehouseDto = {
  id: WH,
  code: 'WH-CNR-SUB',
  name: 'Coonoor Sub Warehouse',
  type: 'SUB',
  address: '12 Mount Road',
  city: 'Coonoor',
  pincode: '643101',
  latitude: 11.353,
  longitude: 76.795,
  capacityKg: '30000.000',
  contactPhone: '+919812345678',
  operatingHours: hours,
  isMarketDayVenue: true,
  marketDayOfWeek: 3,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const scope = (warehouseId: string | null): AdminScope => ({
  roleCode: 'SUB_WH_ADMIN',
  warehouseId,
  warehouseName: 'Coonoor',
  warehouseCode: null,
});

describe('warehouse-info mappers — warehouse (BR-66)', () => {
  it('BR-30: the warehouse id always comes from the session scope', () => {
    expect(scopedWarehouseId(scope(WH))).toBe(WH);
    expect(scopedWarehouseId(scope(null))).toBeNull();
  });

  it('maps an allow-list: coordinates, timestamps and raw market-day index never reach the screen', () => {
    const info = toWarehouseInfo(warehouse);
    expect(Object.keys(info).sort()).toEqual(
      [
        'address',
        'capacityGrams',
        'city',
        'code',
        'contactPhone',
        'id',
        'isMarketDayVenue',
        'name',
        'operatingHours',
        'pincode',
        'status',
        'typeLabelKey',
      ].sort(),
    );
    expect(info.capacityGrams).toBe(30_000_000);
    expect(info.typeLabelKey).toBe('admin.warehouseInfo.type.SUB');
    expect(info.status.labelKey).toBe('admin.warehouseInfo.status.active');
  });

  it('nullable fields stay null', () => {
    const info = toWarehouseInfo({
      ...warehouse,
      address: null,
      city: null,
      pincode: null,
      capacityKg: null,
      contactPhone: null,
      operatingHours: null,
      isActive: false,
    });
    expect(info.address).toBeNull();
    expect(info.capacityGrams).toBeNull();
    expect(info.contactPhone).toBeNull();
    expect(info.operatingHours).toBeNull();
    expect(info.status.labelKey).toBe('admin.warehouseInfo.status.inactive');
  });

  it('every warehouse type has a real catalogue key, and unknown falls back', () => {
    for (const type of WAREHOUSE_TYPES) expect(isTranslationKey(warehouseTypeLabelKey(type))).toBe(true);
    expect(warehouseTypeLabelKey('HUB')).toBe('admin.warehouseInfo.type.unknown');
  });
});

describe('warehouse-info mappers — operating hours (BR-80 unconfirmed format)', () => {
  it('parses the one documented shape into seven weekday rows', () => {
    const rows = parseOperatingHours(hours);
    expect(rows?.map((r) => r.day)).toEqual([...WEEKDAYS]);
    expect(rows?.[0]).toEqual({ day: 'mon', dayLabelKey: 'admin.warehouseInfo.day.mon', closed: false, open: '09:00', close: '18:00' });
    expect(rows?.[6]).toEqual({ day: 'sun', dayLabelKey: 'admin.warehouseInfo.day.sun', closed: true, open: null, close: null });
    for (const r of rows ?? []) expect(isTranslationKey(r.dayLabelKey)).toBe(true);
  });

  it('anything else (legacy stored JSON, missing day, bad time) is "not specified", never guessed', () => {
    expect(parseOperatingHours(null)).toBeNull();
    expect(parseOperatingHours('9 to 6')).toBeNull();
    const { sun: _sun, ...missingSunday } = hours;
    expect(parseOperatingHours(missingSunday)).toBeNull();
    expect(parseOperatingHours({ ...hours, mon: { closed: false, open: '9am', close: '18:00' } })).toBeNull();
  });
});

describe('warehouse-info mappers — capacity (BR-66)', () => {
  const cap: WarehouseCapacityDto = {
    warehouseId: WH,
    capacityKg: '30000.000',
    usedKg: '12500.250',
    availableKg: '17499.750',
    utilizationPercent: 41.67,
  };

  it('BR-66: kg strings become integer grams; utilization is shown as the server rounded it', () => {
    expect(toCapacity(cap)).toEqual({
      capacityGrams: 30_000_000,
      usedGrams: 12_500_250,
      availableGrams: 17_499_750,
      utilizationPercent: 41.67,
      overCapacity: false,
    });
  });

  it('BR-66: over capacity is reported as negative available — never clamped', () => {
    const over = toCapacity({ ...cap, usedKg: '31000.000', availableKg: '-1000.000', utilizationPercent: 103.33 });
    expect(over.availableGrams).toBe(-1_000_000);
    expect(over.overCapacity).toBe(true);
  });

  it('BR-66: no capacity set means null derived fields, not zero', () => {
    const none = toCapacity({ ...cap, capacityKg: null, availableKg: null, utilizationPercent: null });
    expect(none).toEqual({
      capacityGrams: null,
      usedGrams: 12_500_250,
      availableGrams: null,
      utilizationPercent: null,
      overCapacity: false,
    });
  });
});

describe('warehouse-info mappers — storage locations', () => {
  const loc: StorageLocationDto = {
    id: 'l1',
    warehouseId: WH,
    code: 'CS-A01',
    name: 'Cold Storage A',
    locationType: 'Cold Storage',
    capacityKg: '2000.000',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
  };

  it('maps an allow-list with integer grams', () => {
    const row = toStorageLocationRow(loc);
    expect(row).toEqual({
      id: 'l1',
      code: 'CS-A01',
      name: 'Cold Storage A',
      locationType: 'Cold Storage',
      capacityGrams: 2_000_000,
      status: { labelKey: 'admin.warehouseInfo.status.active', tone: 'success' },
    });
  });

  it('a location with no capacity or type keeps nulls', () => {
    const row = toStorageLocationRow({ ...loc, capacityKg: null, locationType: null, isActive: false });
    expect(row.capacityGrams).toBeNull();
    expect(row.locationType).toBeNull();
    expect(row.status.labelKey).toBe('admin.warehouseInfo.status.inactive');
  });

  it('the active filter offers All / Active / Inactive only (the API isActive param)', () => {
    expect([...STORAGE_ACTIVE_FILTERS]).toEqual([undefined, true, false]);
  });
});
