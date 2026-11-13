import { useEffect, useState } from 'react';
import type { NavParams } from '../routes/routeParams';

/**
 * State keyed to the signed-in account, which App.tsx must drop explicitly on
 * sign-out because the app root never unmounts.
 */
export function useSessionState(params: NavParams) {
  // The admin role the last admin sign-in opened (params.adminRole). Warehouse
  // routes reached from the Sub shell do not all carry it, so remember it for
  // the dev-only demo fallback in useWarehousePermissions.
  const [lastAdminRole, setLastAdminRole] = useState<string | undefined>(undefined);
  // Bumped on every sign-out and every dead session (failed refresh). App never
  // unmounts, so state keyed to the signed-in account (the warehouse permission
  // list, lastAdminRole) must be dropped explicitly or the next admin to
  // sign in on this device would render with the previous one's.
  const [sessionEpoch, setSessionEpoch] = useState(0);
  useEffect(() => {
    const role = params['adminRole'];
    if (typeof role === 'string') setLastAdminRole(role);
  }, [params]);
  return { lastAdminRole, setLastAdminRole, sessionEpoch, setSessionEpoch };
}
