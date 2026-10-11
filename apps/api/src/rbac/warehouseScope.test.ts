import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { ResolvedScope } from './requirePermission.js';
import { warehouseScopeFilter, warehouseVisible } from './warehouseScope.js';

const W1 = '11111111-1111-4111-8111-111111111111';
const W2 = '22222222-2222-4222-8222-222222222222';

function scope(overrides: Partial<ResolvedScope>): ResolvedScope {
  return {
    level: ScopeLevel.OWN,
    permission: 'finance.sales_income.view',
    roleCode: RoleCode.SUB_WH_ADMIN,
    warehouseIds: [],
    zoneIds: [],
    userId: '33333333-3333-4333-8333-333333333333',
    ...overrides,
  };
}

describe('warehouseScopeFilter / warehouseVisible', () => {
  it('BR-30: a Sub Warehouse admin is confined to its assigned warehouse', () => {
    const s = scope({ warehouseIds: [W1] });
    const f = warehouseScopeFilter(s, 'o.warehouse_id', 3);
    expect(f.sql).toBe('o.warehouse_id = ANY($3::uuid[])');
    expect(f.params).toEqual([[W1]]);
    expect(f.nextIndex).toBe(4);
    expect(warehouseVisible(s, W1)).toBe(true);
    expect(warehouseVisible(s, W2)).toBe(false);
    expect(warehouseVisible(s, null)).toBe(false);
  });

  it('BR-30: an `all` grant is unfiltered', () => {
    const s = scope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN });
    expect(warehouseScopeFilter(s, 'w.id').sql).toBe('TRUE');
    expect(warehouseVisible(s, W2)).toBe(true);
  });

  it('BR-30: an `own` grant on a role with no warehouse dimension (Main) means all four warehouses (confirmed by the owner 2026-10-11)', () => {
    const s = scope({ roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [] });
    expect(warehouseScopeFilter(s, 'w.id').sql).toBe('TRUE');
    expect(warehouseVisible(s, W1)).toBe(true);
  });

  it('BR-36: a scope that carries a farmer or customer id is never widened', () => {
    const farmer = scope({ roleCode: RoleCode.FARMER, farmerId: '44444444-4444-4444-8444-444444444444' });
    const customer = scope({ roleCode: RoleCode.CUSTOMER, customerId: '55555555-5555-4555-8555-555555555555' });
    expect(warehouseScopeFilter(farmer, 'w.id').sql).toBe('FALSE');
    expect(warehouseScopeFilter(customer, 'w.id').sql).toBe('FALSE');
    expect(warehouseVisible(farmer, W1)).toBe(false);
    expect(warehouseVisible(customer, W1)).toBe(false);
  });

  it('BR-30: a Main Warehouse admin assigned to one warehouse is still confined to it', () => {
    const s = scope({ roleCode: RoleCode.MAIN_WH_ADMIN, warehouseIds: [W1, W2] });
    const f = warehouseScopeFilter(s, 'w.id');
    expect(f.params).toEqual([[W1, W2]]);
    expect(warehouseVisible(s, W2)).toBe(true);
  });
});
