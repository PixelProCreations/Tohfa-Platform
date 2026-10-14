/**
 * BR-30: a Sub Warehouse Admin sees only its own warehouse.
 *
 * The scope used to be a hard-coded `{ warehouseId: 'WH-COON' }` in
 * roles/farmer/App.tsx, so every Sub admin was shown Coonoor whatever warehouse
 * the server had assigned them. It now comes from GET /auth/me `roles[]` (the
 * SUB_WH_ADMIN assignment's `warehouseId` / `warehouseName`). These tests pin
 * the pure decisions in ../permissions/warehousePermissions that the hook
 * (useWarehousePermissions) and WarehouseScopeGate render from.
 *
 * None of this is authority: the server filters every Sub request to the
 * caller's own warehouse (BR-30). The client scope only decides what to ask
 * for and what to label, so it must fail closed (no assignment = no scope),
 * never fall back to a demo warehouse.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  resolveSubScope,
  scopeGateState,
  subScopeForSession,
  subWarehouseScopeFromRoles,
  type SessionPermissions,
  type WarehouseCodeLookup,
} from '../permissions/warehousePermissions';

const COONOOR_ID = '6f1c2a40-8b5e-4d7a-9c3f-1e2d3c4b5a69';
const OOTY_ID = '0b7d9e21-3c4f-4a8b-8d6e-5f4a3b2c1d0e';

describe('subWarehouseScopeFromRoles', () => {
  it('BR-30: the SUB_WH_ADMIN assignment gives the warehouse uuid and name', () => {
    expect(
      subWarehouseScopeFromRoles([
        { code: 'SUB_WH_ADMIN', warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' },
      ]),
    ).toEqual({ warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' });
  });

  it('BR-30: picks the SUB_WH_ADMIN assignment even when another role is listed first', () => {
    expect(
      subWarehouseScopeFromRoles([
        { code: 'FARMER' },
        { code: 'MAIN_WH_ADMIN', warehouseId: OOTY_ID, warehouseName: 'Ooty Main' },
        { code: 'SUB_WH_ADMIN', warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' },
      ]),
    ).toEqual({ warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' });
  });

  it('BR-30: skips a SUB_WH_ADMIN row without a warehouse and takes the one that has it', () => {
    expect(
      subWarehouseScopeFromRoles([
        { code: 'SUB_WH_ADMIN', warehouseId: null },
        { code: 'SUB_WH_ADMIN', warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' },
      ]),
    ).toEqual({ warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' });
  });

  it('BR-30: a missing or null warehouseName keeps the id and leaves the name out', () => {
    expect(subWarehouseScopeFromRoles([{ code: 'SUB_WH_ADMIN', warehouseId: COONOOR_ID, warehouseName: null }])).toEqual({
      warehouseId: COONOOR_ID,
    });
    expect(subWarehouseScopeFromRoles([{ code: 'SUB_WH_ADMIN', warehouseId: COONOOR_ID }])).toEqual({
      warehouseId: COONOOR_ID,
    });
  });

  it('BR-30: an account with only FARMER gives null (fail closed)', () => {
    expect(subWarehouseScopeFromRoles([{ code: 'FARMER' }])).toBeNull();
  });

  it('BR-30: SUB_WH_ADMIN with no warehouse (absent, null or empty) gives null', () => {
    expect(subWarehouseScopeFromRoles([{ code: 'SUB_WH_ADMIN' }])).toBeNull();
    expect(subWarehouseScopeFromRoles([{ code: 'SUB_WH_ADMIN', warehouseId: null }])).toBeNull();
    expect(subWarehouseScopeFromRoles([{ code: 'SUB_WH_ADMIN', warehouseId: '' }])).toBeNull();
  });

  it('BR-30: another role holding a warehouse never becomes the Sub scope', () => {
    expect(subWarehouseScopeFromRoles([{ code: 'MAIN_WH_ADMIN', warehouseId: OOTY_ID }])).toBeNull();
  });

  it('BR-30: no roles at all gives null', () => {
    expect(subWarehouseScopeFromRoles([])).toBeNull();
    expect(subWarehouseScopeFromRoles(undefined)).toBeNull();
  });
});

describe('subScopeForSession', () => {
  const fetched: SessionPermissions = {
    sessionKey: 1,
    list: ['receiving.grn.view'],
    subScope: { warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' },
  };

  it('BR-30: returns the scope fetched in the current session', () => {
    expect(subScopeForSession(fetched, 1)).toEqual({ warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' });
  });

  it('BR-30: a scope from a stale sessionKey is dropped', () => {
    // App never unmounts: after sign-out (sessionEpoch 1 -> 2) the previous
    // admin's warehouse must not render for the next admin on the device.
    expect(subScopeForSession(fetched, 2)).toBeUndefined();
  });

  it('BR-30: nothing fetched yet is still loading (undefined), not "no warehouse" (null)', () => {
    expect(subScopeForSession(undefined, 1)).toBeUndefined();
  });

  it('BR-30: a fetched "no assignment" stays null for its own session', () => {
    expect(subScopeForSession({ sessionKey: 1, list: [], subScope: null }, 1)).toBeNull();
  });

  it('BR-30: a permissions-only record reads as no warehouse (null), never as loading', () => {
    expect(subScopeForSession({ sessionKey: 1, list: [] }, 1)).toBeNull();
  });
});

describe('resolveSubScope (adds the human warehouse code from GET /warehouses/{id})', () => {
  const scope = { warehouseId: COONOOR_ID, warehouseName: 'Coonoor Warehouse' };
  const lookup = (over: Partial<WarehouseCodeLookup> = {}): WarehouseCodeLookup => ({
    sessionKey: 1,
    warehouseId: COONOOR_ID,
    code: 'WH-COON',
    ...over,
  });

  it('BR-30: adds warehouseCode once the lookup for this warehouse lands', () => {
    expect(resolveSubScope(scope, lookup(), 1)).toEqual({ ...scope, warehouseCode: 'WH-COON' });
  });

  it('BR-30: a failed lookup keeps the scope without a code', () => {
    expect(resolveSubScope(scope, lookup({ code: null }), 1)).toEqual(scope);
  });

  it('BR-30: waits (undefined) until the lookup for this warehouse has settled', () => {
    expect(resolveSubScope(scope, undefined, 1)).toBeUndefined();
  });

  it('BR-30: a lookup from a stale session or for another warehouse is ignored', () => {
    expect(resolveSubScope(scope, lookup({ sessionKey: 0 }), 1)).toBeUndefined();
    expect(resolveSubScope(scope, lookup({ warehouseId: OOTY_ID }), 1)).toBeUndefined();
  });

  it('BR-30: passes loading (undefined) and no assignment (null) straight through', () => {
    expect(resolveSubScope(undefined, lookup(), 1)).toBeUndefined();
    expect(resolveSubScope(null, lookup(), 1)).toBeNull();
  });
});

describe('scopeGateState', () => {
  const scope = { warehouseId: COONOOR_ID };

  it('BR-30: loading while the scope is undefined and attempts are still running', () => {
    expect(scopeGateState(undefined, false)).toBe('loading');
  });

  it('BR-30: error when the account has no Sub warehouse (null): fail closed, no demo scope', () => {
    expect(scopeGateState(null, false)).toBe('error');
  });

  it('BR-30: error once every /auth/me attempt has failed, even in dev', () => {
    expect(scopeGateState(undefined, true)).toBe('error');
  });

  it('BR-30: ready with a scope', () => {
    expect(scopeGateState(scope, false)).toBe('ready');
  });
});

describe('App.tsx wiring (static source check)', () => {
  const app = fs.readFileSync(path.resolve(__dirname, '../../farmer/App.tsx'), 'utf8');

  it('BR-30: no hard-coded Sub warehouse scope is left in App.tsx', () => {
    expect(app).not.toMatch(/SUB_WAREHOUSE_SCOPE/);
    expect(app).not.toMatch(/warehouseId:\s*'WH-COON'/);
  });

  it('BR-30: the Sub shell renders through WarehouseScopeGate with the scope from /auth/me roles', () => {
    expect(app).toMatch(/<WarehouseScopeGate/);
    expect(app).toMatch(/roles:\s*me\.roles/);
    expect(app).toMatch(/renderWithSubScope\(\(subScope\) => \(\s*<SubWarehouseAdminDashboardScreen/);
  });
});
