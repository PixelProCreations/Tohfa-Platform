/**
 * screens/warehouse/warehouse-admin/mappers.ts: capacity (BR-66b), filters,
 * SWA assignment (BR-25, BR-81), create-form validation and error mapping.
 */
import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type { SubAdminDto } from '../api/subAdmins';
import type { WarehouseOption } from '../api/warehouseList';
import {
  createSubAdminErrorKey,
  figureLabel,
  filterWarehouses,
  formatWarehouseAddress,
  hasDraftErrors,
  normalizeMobile,
  subAdminNamesByWarehouse,
  toCapacitySummary,
  toCreateSubAdminBody,
  validateSubAdminDraft,
  warehouseIdForName,
  warehouseMetaLine,
  warehousesWithoutSubAdmin,
} from '../screens/warehouse/warehouse-admin/mappers';

const OOTY = '11111111-1111-4111-8111-111111111111';
const COON = '22222222-2222-4222-8222-222222222222';
const KOTA = '33333333-3333-4333-8333-333333333333';

function opt(over: Partial<WarehouseOption>): WarehouseOption {
  return { warehouseId: OOTY, warehouseName: 'Ooty Warehouse', warehouseCode: 'WH-OOT', type: 'MAIN', city: 'Ooty', isActive: true, ...over };
}

const OPTIONS: WarehouseOption[] = [
  opt({}),
  opt({ warehouseId: COON, warehouseName: 'Coonoor Warehouse', warehouseCode: 'WH-COO', type: 'SUB', city: 'Coonoor' }),
  opt({ warehouseId: KOTA, warehouseName: 'Kotagiri Warehouse', warehouseCode: 'WH-KOT', type: 'SUB', city: null, isActive: false }),
];

function swa(over: Partial<SubAdminDto>): SubAdminDto {
  return { userId: 'u1', adminCode: 'SWA-1', fullName: 'Arun', status: 'ACTIVE', warehouseId: COON, assignedAt: '2026-10-01T00:00:00Z', ...over };
}

function apiError(code: string, errors?: Record<string, string[]>): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status: 409, code, ...(errors ? { errors } : {}) } as never);
}

describe('toCapacitySummary (BR-66b)', () => {
  it('formats kg strings via integer grams and passes the server percent through', () => {
    const s = toCapacitySummary({ warehouseId: OOTY, capacityKg: '4200.000', usedKg: '3420.500', availableKg: '779.500', utilizationPercent: 81.44 });
    expect(s.usedLabel).toBe('3,420.5 kg');
    expect(s.capacityLabel).toBe('4,200 kg');
    expect(s.availableLabel).toBe('779.5 kg');
    expect(s.percentLabel).toBe('81.44%');
    expect(s.fillPercent).toBe(81.44);
    expect(s.overCapacity).toBe(false);
  });

  it('BR-66b: over capacity is flagged from a negative available and the bar clamps at 100', () => {
    const s = toCapacitySummary({ warehouseId: OOTY, capacityKg: '100.000', usedKg: '100.300', availableKg: '-0.300', utilizationPercent: 100.3 });
    expect(s.overCapacity).toBe(true);
    expect(s.fillPercent).toBe(100);
    expect(s.availableLabel).toBe('-0.3 kg');
  });

  it('no capacity set: no percent, no capacity label, empty bar, not over', () => {
    const s = toCapacitySummary({ warehouseId: OOTY, capacityKg: null, usedKg: '12.000', availableKg: null, utilizationPercent: null });
    expect(s).toMatchObject({ capacityLabel: null, percentLabel: null, availableLabel: null, fillPercent: 0, overCapacity: false });
    expect(s.usedLabel).toBe('12 kg');
  });
});

describe('warehouse identity', () => {
  it('joins the set address parts and returns null when none is set', () => {
    expect(formatWarehouseAddress({ address: ' Charing Cross ', city: 'Ooty', pincode: '' })).toBe('Charing Cross, Ooty');
    expect(formatWarehouseAddress({ address: null, pincode: '  ' })).toBeNull();
  });

  it('meta line skips a missing city', () => {
    expect(warehouseMetaLine(OPTIONS[0]!)).toBe('WH-OOT · Ooty · Main Warehouse');
    expect(warehouseMetaLine(OPTIONS[2]!)).toBe('WH-KOT · Sub Warehouse');
  });
});

describe('filterWarehouses', () => {
  it('matches name, code or city case-insensitively', () => {
    expect(filterWarehouses(OPTIONS, 'coon', 'all').map((o) => o.warehouseId)).toEqual([COON]);
    expect(filterWarehouses(OPTIONS, 'wh-kot', 'all').map((o) => o.warehouseId)).toEqual([KOTA]);
    expect(filterWarehouses(OPTIONS, '  ', 'all')).toHaveLength(3);
  });

  it('filters on isActive', () => {
    expect(filterWarehouses(OPTIONS, '', 'active').map((o) => o.warehouseId)).toEqual([OOTY, COON]);
    expect(filterWarehouses(OPTIONS, '', 'inactive').map((o) => o.warehouseId)).toEqual([KOTA]);
  });
});

describe('Sub Warehouse Admin assignments', () => {
  it('groups live SWA names per warehouse', () => {
    const map = subAdminNamesByWarehouse([swa({}), swa({ userId: 'u2', fullName: 'Karthik' })]);
    expect(map.get(COON)).toEqual(['Arun', 'Karthik']);
    expect(map.get(OOTY)).toBeUndefined();
  });

  it('BR-25: lists active SUB warehouses with no SWA (not MAIN, not inactive)', () => {
    expect(warehousesWithoutSubAdmin(OPTIONS, [])).toEqual([OPTIONS[1]]);
    expect(warehousesWithoutSubAdmin(OPTIONS, [swa({})])).toEqual([]);
  });
});

describe('create Sub Warehouse Admin draft', () => {
  it('normalizes typed mobiles', () => {
    expect(normalizeMobile('+91 98765-43210')).toBe('+919876543210');
    expect(normalizeMobile('(+91) 98765.43210')).toBe('+919876543210');
  });

  it('BR-25: a draft without a warehouse is invalid', () => {
    const errors = validateSubAdminDraft({ fullName: 'Arun', mobile: '+919876543210', warehouseId: '' });
    expect(errors).toEqual({ warehouseId: 'warehouseAdmin.swa.validation.warehouseRequired' });
    expect(hasDraftErrors(errors, ['fullName', 'mobile'])).toBe(false);
    expect(hasDraftErrors(errors, ['warehouseId'])).toBe(true);
  });

  it('rejects a blank name, an over-long name and a non-E.164 mobile', () => {
    expect(validateSubAdminDraft({ fullName: '  ', mobile: '9876543210', warehouseId: OOTY })).toEqual({
      fullName: 'warehouseAdmin.swa.validation.nameRequired',
      mobile: 'warehouseAdmin.swa.validation.mobileFormat',
    });
    expect(validateSubAdminDraft({ fullName: 'x'.repeat(121), mobile: '+0123456789', warehouseId: OOTY })).toEqual({
      fullName: 'warehouseAdmin.swa.validation.nameTooLong',
      mobile: 'warehouseAdmin.swa.validation.mobileFormat',
    });
    expect(validateSubAdminDraft({ fullName: 'Arun', mobile: '+91 98765 43210', warehouseId: OOTY })).toEqual({});
  });

  it('builds the strict body: trimmed name, normalized mobile, warehouse uuid', () => {
    expect(toCreateSubAdminBody({ fullName: ' Arun ', mobile: '+91 98765 43210', warehouseId: COON })).toEqual({
      fullName: 'Arun',
      mobile: '+919876543210',
      warehouseId: COON,
    });
  });
});

describe('createSubAdminErrorKey', () => {
  it('tells a taken mobile from a full warehouse (both 409 CONFLICT)', () => {
    expect(createSubAdminErrorKey(apiError('CONFLICT', { 'body.mobile': ['Already registered.'] }))).toBe(
      'warehouseAdmin.swa.error.mobileTaken',
    );
    expect(createSubAdminErrorKey(apiError('CONFLICT'))).toBe('warehouseAdmin.swa.error.warehouseFull');
  });

  it('maps an invalid warehouse field and falls back to adminErrorKey otherwise', () => {
    expect(createSubAdminErrorKey(apiError('VALIDATION_FAILED', { 'body.warehouseId': ['No such warehouse.'] }))).toBe(
      'warehouseAdmin.swa.error.warehouseInvalid',
    );
    expect(createSubAdminErrorKey(apiError('WAREHOUSE_REQUIRED'))).toBe('admin.error.WAREHOUSE_REQUIRED');
    expect(createSubAdminErrorKey(new NetworkError('offline'))).toBe('admin.error.network');
  });
});

describe('figureLabel', () => {
  it('shows the value, a loading mark, or a dash; never a made-up zero', () => {
    expect(figureLabel({ data: 3, isLoading: false, error: null }, String)).toBe('3');
    expect(figureLabel({ data: undefined, isLoading: true, error: null }, String)).toBe('…');
    expect(figureLabel({ data: undefined, isLoading: false, error: new Error('x') }, String)).toBe('—');
    expect(figureLabel(undefined, String)).toBe('—');
  });
});

describe('warehouseIdForName', () => {
  it('maps a display name (with or without " Warehouse") to the live uuid', () => {
    expect(warehouseIdForName(OPTIONS, 'Coonoor Warehouse')).toBe(COON);
    expect(warehouseIdForName(OPTIONS, 'kotagiri')).toBe(KOTA);
    expect(warehouseIdForName(OPTIONS, 'Gudalur')).toBeUndefined();
    expect(warehouseIdForName(OPTIONS, ' ')).toBeUndefined();
  });
});
