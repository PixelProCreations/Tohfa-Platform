import { describe, expect, it } from 'vitest';
import {
  extractSubWarehouseScope,
  resolveSubWarehouseState,
} from '../permissions/useSubWarehouseScope';

describe('BR-30: Sub Warehouse Scope Resolution from /auth/me', () => {
  it('passes through scope when SUB_WH_ADMIN has valid warehouseId and warehouseName', () => {
    const roles = [
      {
        code: 'SUB_WH_ADMIN',
        warehouseId: 'b3b8c4d5-8f6a-4d2b-9271-e737c1d1a610',
        warehouseName: 'Coonoor Warehouse',
      },
    ];
    const result = extractSubWarehouseScope(roles);
    expect(result).toEqual({
      status: 'ready',
      scope: {
        warehouseId: 'b3b8c4d5-8f6a-4d2b-9271-e737c1d1a610',
        warehouseName: 'Coonoor Warehouse',
      },
    });
  });

  it('returns none when no SUB_WH_ADMIN role is in roles list', () => {
    const roles = [
      {
        code: 'FARMER',
        warehouseId: 'b3b8c4d5-8f6a-4d2b-9271-e737c1d1a610',
        warehouseName: 'Coonoor Warehouse',
      },
    ];
    const result = extractSubWarehouseScope(roles);
    expect(result).toEqual({ status: 'none' });
  });

  it('returns none when SUB_WH_ADMIN warehouseId is null, undefined, or empty string', () => {
    expect(extractSubWarehouseScope([{ code: 'SUB_WH_ADMIN', warehouseId: null }])).toEqual({ status: 'none' });
    expect(extractSubWarehouseScope([{ code: 'SUB_WH_ADMIN', warehouseId: undefined }])).toEqual({ status: 'none' });
    expect(extractSubWarehouseScope([{ code: 'SUB_WH_ADMIN', warehouseId: '   ' }])).toEqual({ status: 'none' });
  });

  it('resolves error state when fetchMe throws', () => {
    const err = new Error('Network timeout');
    const state = resolveSubWarehouseState({ error: err, isLoading: false, data: undefined });
    expect(state).toEqual({ status: 'error', error: err });
  });

  it('resolves loading state while fetchMe is in flight', () => {
    const state = resolveSubWarehouseState({ error: null, isLoading: true, data: undefined });
    expect(state).toEqual({ status: 'loading' });
  });
});

