/**
 * PurchaseOrdersFlow: the admin Purchase Orders screens from the design branch
 * (origin/tofhafarmfin-rbac screens/dashboard/PurchaseOrders*), on the real
 * read-only API.
 *
 *   list ──▶ filter page (inside the list)
 *    └───▶ detail (card tap) ──▶ back to list
 *   history (initialView="history") ──▶ detail ──▶ back to history
 *
 * In the design the history screen is reached from the collection
 * confirmation step, not from the list (the list renders no history control),
 * so no history button is added here; a host opens it with
 * `initialView="history"`. ConfirmPurchaseTermsScreen is exported but not
 * routed (see its docblock).
 *
 * Access is by permission code only (`purchase.order.view`, docs/rbac.json),
 * fail closed: a missing or denying `can` draws the not-available state and
 * makes no request. No role strings.
 *
 * Not mounted anywhere yet.
 */
import React, { useState } from 'react';
import type { Can } from '../../permissions/can';
import { PurchaseOrderDetailScreen } from './PurchaseOrderDetailScreen';
import { PurchaseOrdersListScreen, type PurchaseOrdersListMode } from './PurchaseOrdersListScreen';

export interface PurchaseOrdersFlowProps {
  /** The signed-in admin's permission check (makeCan(/auth/me permissions)). Required: no default grant exists. */
  can: Can;
  /** Leaves the flow (back from its root screen). */
  onBack: () => void;
  /** The caller's warehouse; sent as the list's `warehouseId` and used in the cache keys. Scoping is server-side (BR-30). */
  warehouseId?: string | undefined;
  /** Which list the flow opens on. Default 'orders'. */
  initialView?: PurchaseOrdersListMode | undefined;
}

type Route = { screen: 'list' } | { screen: 'detail'; id: string };

export function PurchaseOrdersFlow({ can, onBack, warehouseId, initialView = 'orders' }: PurchaseOrdersFlowProps) {
  const [route, setRoute] = useState<Route>({ screen: 'list' });

  if (route.screen === 'detail') {
    return (
      <PurchaseOrderDetailScreen can={can} orderId={route.id} warehouseId={warehouseId} onBack={() => setRoute({ screen: 'list' })} />
    );
  }

  return (
    <PurchaseOrdersListScreen
      mode={initialView}
      can={can}
      warehouseId={warehouseId}
      onBack={onBack}
      onViewOrder={(id) => setRoute({ screen: 'detail', id })}
    />
  );
}
