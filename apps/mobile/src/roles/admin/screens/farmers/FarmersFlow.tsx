/**
 * FarmersFlow: the ONE Farmers Management flow every admin host mounts
 * (Super / Tohfa Farmers tab, Farmer Admin Farmers tab, the warehouse More
 * menu's "Farmers Management" row and the Sub warehouse Home "Farmers" tile).
 *
 *   list ──▶ farmer detail ──▶ edit
 *    │            └──▶ farm map / KYC review ──▶ cert verification / rating scorecard ──▶ compliance tiers
 *    └─(applications tab, or the pending queue entry)──▶ application review ──▶ reject
 *
 * Why one flow and not a copy per dashboard: a role's view differs only by
 * permission codes (`can`, from GET /auth/me) and by what the server returns
 * for the caller (BR-108a scoping is server-side), so there is nothing a
 * per-role copy could add except drift. No role name appears here.
 *
 * `can` is required: a host without the caller's permission list cannot mount
 * the flow at all, and the screens below fail closed on it anyway. Ids are the
 * live row ids; nothing falls back to a fixture farmer or application.
 *
 * The farm map, KYC review, cert verification, rating scorecard and
 * compliance tiers screens belong to other modules and still read the legacy
 * FarmerListItem (built from the live row: real id, name and code). They are
 * opened only when the caller holds the matching code (flow/farmersFlowNav.ts)
 * and are not rewritten here. Rating edit is not wired (BR-06e).
 *
 * Toasts: the flow root hosts the one TohfaToast, so a success toast stays up
 * while the stack changes under it (a rejection returns to the list, and the
 * toast must still be there). It is set only from the screens' success
 * callbacks, which fire after the server answered (flow/farmersFlowToast.ts).
 */
import React, { useReducer, useState } from 'react';
import { TohfaToast, type ToastData } from '../../components/TohfaToast';
import type { Can } from '../../permissions/can';
import { AdminCertVerificationScreen } from '../certifications/AdminCertVerificationScreen';
import { AdminComplianceTiersScreen } from '../certifications/AdminComplianceTiersScreen';
import { AdminKycReviewScreen } from '../certifications/AdminKycReviewScreen';
import { AdminApplicationDetailScreen } from '../registration/AdminApplicationDetailScreen';
import { AdminApplicationRejectScreen } from '../registration/AdminApplicationRejectScreen';
import { AdminPendingApplicationsScreen } from '../registration/AdminPendingApplicationsScreen';
import { AdminEditFarmerScreen } from './AdminEditFarmerScreen';
import { AdminFarmerDetailScreen } from './AdminFarmerDetailScreen';
import { AdminFarmMapScreen } from './AdminFarmMapScreen';
import { AdminRatingScorecardScreen } from './AdminRatingScorecardScreen';
import {
  farmersFlowReducer,
  farmersFlowSatellites,
  initialFarmersFlowState,
  type FarmersFlowEntry,
  type FarmersFlowRoute,
} from './flow/farmersFlowNav';
import { approvedToast, rejectedToast, savedToast } from './flow/farmersFlowToast';
import type { FarmersMainTab } from './list/farmersListLogic';
import type { FarmersListNavTab } from './list/FarmersListParts';
import { FarmersListScreen } from './list/FarmersListScreen';

export type { FarmersFlowEntry } from './flow/farmersFlowNav';

export interface FarmersFlowProps {
  /** The signed-in admin's permission check (makeCan(/auth/me permissions)). Required: no default grant exists. */
  can: Can;
  /** Leaves the flow (back from its root screen). */
  onBack: () => void;
  /** The caller's warehouse, for the query cache keys only (BR-30); scoping is server-side. */
  warehouseId?: string | undefined;
  /** 'pendingApplications' opens the review queue instead of the Farmers | Applications list. */
  entry?: FarmersFlowEntry | undefined;
  /** The list tab to open on. */
  initialTab?: FarmersMainTab | undefined;
  /** The list header title; defaults to the list's own. */
  title?: string | undefined;
  /** The list's design bottom nav; off unless the host maps every tab (onNavigateTab). */
  showBottomNav?: boolean | undefined;
  onNavigateTab?: ((tab: FarmersListNavTab) => void) | undefined;
}

export function FarmersFlow(props: FarmersFlowProps) {
  const [toast, setToast] = useState<ToastData | null>(null);
  return (
    <>
      <FarmersFlowScreens {...props} showToast={setToast} />
      <TohfaToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

function FarmersFlowScreens({
  can,
  onBack,
  warehouseId,
  entry = 'list',
  initialTab,
  title,
  showBottomNav = false,
  onNavigateTab,
  showToast,
}: FarmersFlowProps & { showToast: (toast: ToastData) => void }) {
  const [state, dispatch] = useReducer(farmersFlowReducer, initialTab, initialFarmersFlowState);
  const satellites = farmersFlowSatellites(can);
  const top = state.stack[state.stack.length - 1];
  const back = () => dispatch({ type: 'back' });
  const push = (route: FarmersFlowRoute) => dispatch({ type: 'push', route });
  const openApplication = (applicationId: string) => dispatch({ type: 'openApplication', applicationId });

  if (top === undefined) {
    return entry === 'pendingApplications' ? (
      <AdminPendingApplicationsScreen
        can={can}
        warehouseId={warehouseId}
        onBack={onBack}
        onSelectApplication={(item) => openApplication(item.id)}
      />
    ) : (
      <FarmersListScreen
        can={can}
        warehouseId={warehouseId}
        title={title}
        initialTab={state.listTab}
        showBottomNav={showBottomNav}
        onNavigateTab={onNavigateTab}
        onBack={onBack}
        onSelectFarmer={(farmer, row) => dispatch({ type: 'openFarmer', farmerId: row.id, farmer })}
        onReviewApplication={(application) => openApplication(application.id)}
      />
    );
  }

  switch (top.name) {
    case 'detail': {
      const { farmer, farmerId } = top;
      return (
        <AdminFarmerDetailScreen
          farmerId={farmerId}
          warehouseId={warehouseId}
          can={can}
          initialTab={top.tab}
          onTabChange={(tab) => dispatch({ type: 'detailTab', tab })}
          onBack={back}
          onEdit={(tab) => push({ name: 'edit', farmerId, tab })}
          onOpenFarmMap={satellites.farmMap ? () => push({ name: 'farmMap', farmer }) : undefined}
          onOpenKycReview={satellites.kycReview ? () => push({ name: 'kycReview', farmer }) : undefined}
          onOpenRatingScorecard={satellites.scorecard ? () => push({ name: 'scorecard', farmer }) : undefined}
        />
      );
    }
    case 'edit':
      return (
        <AdminEditFarmerScreen
          farmerId={top.farmerId}
          warehouseId={warehouseId}
          can={can}
          initialTab={top.tab}
          onBack={back}
          onSaved={(saved, tab) => {
            dispatch({ type: 'edited', tab });
            showToast(savedToast(saved.name));
          }}
        />
      );
    case 'farmMap':
      return <AdminFarmMapScreen farmer={top.farmer} onBack={back} />;
    case 'kycReview': {
      const { farmer } = top;
      return (
        <AdminKycReviewScreen
          farmer={farmer}
          onBack={back}
          // Required by the screen; without certification.view the button stays inert (reported gap).
          onGoToCertificationVerification={() => {
            if (satellites.certVerification) push({ name: 'certVerification', farmer });
          }}
        />
      );
    }
    case 'certVerification':
      return <AdminCertVerificationScreen farmer={top.farmer} onBack={back} onVerified={back} onUnverified={back} />;
    case 'scorecard':
      return (
        <AdminRatingScorecardScreen
          farmer={top.farmer}
          onBack={back}
          onOpenComplianceTiers={() => {
            if (satellites.complianceTiers) push({ name: 'complianceTiers' });
          }}
        />
      );
    case 'complianceTiers':
      return <AdminComplianceTiersScreen onBack={back} />;
    case 'application': {
      const { applicationId } = top;
      return (
        <AdminApplicationDetailScreen
          applicationId={applicationId}
          warehouseId={warehouseId}
          can={can}
          onBack={back}
          onReject={() => push({ name: 'reject', applicationId })}
          onApproved={(result) => showToast(approvedToast(result.fullName))}
        />
      );
    }
    case 'reject':
      return (
        <AdminApplicationRejectScreen
          applicationId={top.applicationId}
          warehouseId={warehouseId}
          can={can}
          onBack={back}
          onConfirmReject={(reasonLabel, _details, result) => {
            dispatch({ type: 'decided' });
            showToast(rejectedToast(result.fullName, reasonLabel));
          }}
        />
      );
    default:
      return null;
  }
}
