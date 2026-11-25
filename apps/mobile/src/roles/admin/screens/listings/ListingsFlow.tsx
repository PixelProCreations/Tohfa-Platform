/**
 * ListingsFlow: the Tohfa "Produce list" / listing approval flow any admin
 * host mounts (the design opens it from the Tohfa Admin Home quick action
 * "Produce list" -> dashboardSubScreen 'listingApproval'). Not mounted
 * anywhere yet; a later step wires it into the dashboards.
 *
 * In the design this flow is one screen, the Listing Approval Queue; the
 * other produce screens on the design branch (ProduceListings,
 * ProduceListingDetails, ReviewProduceListing, ListingHistory,
 * FarmerCounterOffer) are opened from the Farmer Admin dashboard and the
 * warehouse receiving flow, not from this queue.
 *
 * Who sees what is decided by `can` (rbac.json codes from GET /auth/me) and
 * by the server; no role name appears here. A missing `can` denies.
 *
 * The flow root hosts the one TohfaToast so a success toast survives the
 * sheet closing under it; toasts are raised only after the server answered.
 */
import React, { useState } from 'react';
import { TohfaToast, type ToastData } from '../../components/TohfaToast';
import type { Can } from '../../permissions/can';
import { ListingApprovalQueueScreen } from './ListingApprovalQueueScreen';

export interface ListingsFlowProps {
  /** The signed-in admin's permission check (makeCan(/auth/me permissions)). Required: no default grant exists. */
  can: Can;
  /** Leaves the flow (back from its root screen). */
  onBack: () => void;
  /**
   * The caller's warehouse: the query cache key (BR-30) and the approve
   * destination (POST /approve requires `warehouseId`; the design has no
   * picker). Without it Approve is drawn disabled.
   */
  warehouseId?: string | undefined;
}

export function ListingsFlow({ can, onBack, warehouseId }: ListingsFlowProps) {
  const [toast, setToast] = useState<ToastData | null>(null);
  return (
    <>
      <ListingApprovalQueueScreen can={can} onBack={onBack} warehouseId={warehouseId} showToast={setToast} />
      <TohfaToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
