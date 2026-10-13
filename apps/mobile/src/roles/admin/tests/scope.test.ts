import { describe, expect, it } from 'vitest';
import type { CurrentUserProfile } from '@tohfa/shared-types';
import { resolveAdminScope, withWarehouseCode } from '../session/scope';
import { buildAdminSession } from '../session/AdminSession';

const WH = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';

function profile(roles: CurrentUserProfile['roles']): CurrentUserProfile {
  return {
    id: 'u1',
    mobile: '9800000006',
    fullName: 'Sub Admin',
    userType: 'ADMIN',
    preferredLocale: 'en',
    roles,
    permissions: [],
  };
}

describe('resolveAdminScope', () => {
  it('BR-30: a Sub Warehouse Admin is scoped to the warehouse on its assignment', () => {
    const scope = resolveAdminScope(
      profile([{ code: 'SUB_WH_ADMIN', warehouseId: WH, warehouseName: 'Coonoor' }]),
    );
    expect(scope).toEqual({
      kind: 'ok',
      scope: { roleCode: 'SUB_WH_ADMIN', warehouseId: WH, warehouseName: 'Coonoor', warehouseCode: null },
    });
  });

  it('BR-25: a Sub Warehouse Admin without a warehouse is an error, never an unscoped session', () => {
    expect(resolveAdminScope(profile([{ code: 'SUB_WH_ADMIN' }]))).toEqual({
      kind: 'error',
      reason: 'WAREHOUSE_REQUIRED',
    });
  });

  it('BR-30: a malformed warehouse id is rejected rather than sent to the server', () => {
    expect(
      resolveAdminScope(profile([{ code: 'SUB_WH_ADMIN', warehouseId: 'coonoor' }])),
    ).toEqual({ kind: 'error', reason: 'WAREHOUSE_REQUIRED' });
  });

  it('an HQ admin with no warehouse gets a null warehouseId (server decides what that sees)', () => {
    expect(resolveAdminScope(profile([{ code: 'TOHFA_ADMIN' }]))).toEqual({
      kind: 'ok',
      scope: { roleCode: 'TOHFA_ADMIN', warehouseId: null, warehouseName: null, warehouseCode: null },
    });
  });

  it('prefers the warehouse-scoped assignment when a user holds several admin roles', () => {
    const result = resolveAdminScope(
      profile([{ code: 'FARMER_ADMIN' }, { code: 'MAIN_WH_ADMIN', warehouseId: WH }]),
    );
    expect(result.kind === 'ok' && result.scope.warehouseId).toBe(WH);
  });

  it('a non-admin account has no admin scope', () => {
    expect(resolveAdminScope(profile([{ code: 'CUSTOMER' }]))).toEqual({
      kind: 'error',
      reason: 'NOT_ADMIN',
    });
  });

  it('buildAdminSession combines scope and can() from the same /auth/me payload', () => {
    const p = profile([{ code: 'SUB_WH_ADMIN', warehouseId: WH }]);
    p.permissions = ['wallet.cash_topup.process'];
    const result = buildAdminSession(p);
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.session.scope.warehouseId).toBe(WH);
    expect(result.session.can('wallet.cash_topup.process')).toBe(true);
    expect(result.session.can('rma.refund.bank_process')).toBe(false);
    expect(buildAdminSession(profile([{ code: 'SUB_WH_ADMIN' }])).kind).toBe('error');
  });

  it('withWarehouseCode fills the code from GET /warehouses/{id} only for the same warehouse', () => {
    const base = { roleCode: 'SUB_WH_ADMIN' as const, warehouseId: WH, warehouseName: 'Coonoor', warehouseCode: null };
    expect(withWarehouseCode(base, { id: WH, code: 'WH-CNR-SUB' }).warehouseCode).toBe('WH-CNR-SUB');
    expect(withWarehouseCode(base, { id: 'other', code: 'X' }).warehouseCode).toBeNull();
  });
});
