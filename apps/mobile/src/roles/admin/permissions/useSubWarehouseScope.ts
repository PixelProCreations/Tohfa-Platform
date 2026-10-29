import { useCallback, useEffect, useState } from 'react';
import type { WarehouseScope } from '../screens/warehouse/finance-expenses/types';
import { fetchMe, type UserRole } from '../../farmer/api/auth';

export type SubWarehouseScopeStatus = 'loading' | 'ready' | 'none' | 'error';

export interface SubWarehouseScopeResult {
  status: SubWarehouseScopeStatus;
  scope?: WarehouseScope | undefined;
  error?: unknown;
  refetch: () => void;
}

export function extractSubWarehouseScope(
  roles: readonly { code: string; warehouseId?: string | null | undefined; warehouseName?: string | null | undefined }[]
): { status: 'ready'; scope: WarehouseScope } | { status: 'none' } {
  const role = roles.find((r) => r.code === 'SUB_WH_ADMIN');
  if (role && typeof role.warehouseId === 'string' && role.warehouseId.trim().length > 0) {
    return {
      status: 'ready',
      scope: {
        warehouseId: role.warehouseId.trim(),
        warehouseName: role.warehouseName ?? undefined,
      },
    };
  }
  return { status: 'none' };
}

export function resolveSubWarehouseState(input: {
  error: unknown;
  isLoading: boolean;
  data: { roles?: readonly UserRole[] } | undefined;
}): { status: SubWarehouseScopeStatus; scope?: WarehouseScope | undefined; error?: unknown } {
  if (input.isLoading) {
    return { status: 'loading' };
  }
  if (input.error) {
    return { status: 'error', error: input.error };
  }
  if (!input.data?.roles) {
    return { status: 'none' };
  }
  return extractSubWarehouseScope(input.data.roles);
}

export function useSubWarehouseScope(enabled: boolean = true): SubWarehouseScopeResult {
  const [data, setData] = useState<{ roles?: readonly UserRole[] } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<unknown>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchMe()
      .then((me) => {
        if (!cancelled) {
          setData(me);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, nonce]);

  const state = resolveSubWarehouseState({ error, isLoading, data });

  return {
    ...state,
    refetch,
  };
}

