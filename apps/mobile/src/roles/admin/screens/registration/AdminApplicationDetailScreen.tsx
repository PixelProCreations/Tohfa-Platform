/**
 * Application Review: one farmer application (GET /admin/farmer-applications/{id},
 * farmer.application.view), drawn as the design of record draws it
 * (origin/Superadmin-main screens/registration/AdminApplicationDetailScreen.tsx):
 * brand header, sections 01-07, sticky Approve / Reject bar. The design's
 * single file is split into ./detail/* sections; its styles are ported style by
 * style into ./detail/detailStyles.ts.
 *
 * Against the design:
 *   - Data comes from the application id through useApplication; nothing from
 *     the host's item but its `id`, and never the design's demo values. Values
 *     the API does not supply render ADMIN_NO_VALUE.
 *   - No audit: the design's two audit modes (waiting for, and scheduling,
 *     an audit), their 01/02/03 pill bar and its audit form screen are not
 *     ported (owner decision 2026-11-25 — audit work is a separate flow).
 *   - Approve opens the Approve Application screen (approval notes + Confirm &
 *     Onboard Farmer); only its Confirm calls the server. Once the server
 *     agreed, this screen shows its Approved state and tells the host
 *     (onApproved). Reject keeps the design's confirmation, then hands over to
 *     the host's Reject screen; this screen never claims a rejection itself.
 *   - Section 06's "Send Request for Information" opens the Request More Info
 *     screen, as the design's host did.
 *   - The Approve and Request More Info screens are held here (sub-views), so
 *     the hosts (FarmersFlow, FarmerManagementFlow) need no new route.
 *   - Controls whose backend is being built now (document / FMB verify, stage
 *     change, review notes, request send, approval note) are drawn as designed
 *     and disabled, each with a stable testID.
 *
 * Access fails closed: without farmer.application.view (or with no `can`)
 * nothing is fetched. Approve/Reject need approve AND reject (see
 * applicationLogic.ts).
 */
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import type { FarmerApplicationDto } from '../../api/farmerApplications';
import { useApplication } from '../../api/farmerHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { AdminApplicationApproveScreen } from './AdminApplicationApproveScreen';
import { AdminApplicationRequestInfoScreen } from './AdminApplicationRequestInfoScreen';
import { BackButtonCard, HeaderBanner } from './applications/ApplicationParts';
import { decisionStyles } from './applications/DecisionScreenParts';
import {
  applicationAccess,
  isNotFound,
  orDash,
  statusLabel,
  statusTone,
  type PendingApplicationItem,
} from './applications/applicationLogic';
import { ActionBar } from './detail/ActionBar';
import { ApplicantSection } from './detail/ApplicantSection';
import { DecisionSection, type DecisionState } from './detail/DecisionSection';
import { detailStyles } from './detail/detailStyles';
import { DocumentsSection } from './detail/DocumentsSection';
import { gateBlockerSummary } from './detail/documentReview';
import { FarmingSection } from './detail/FarmingSection';
import { FarmSection } from './detail/FarmSection';
import { MoreInfoSection } from './detail/MoreInfoSection';
import { TrackingSection } from './detail/TrackingSection';

export interface AdminApplicationDetailScreenProps {
  /** The application to review. */
  applicationId?: string | undefined;
  /** Legacy host item (roles/farmer/App.tsx); only its `id` is read, when applicationId is not given. */
  application?: PendingApplicationItem | undefined;
  /** Permission check from /auth/me. Missing = deny everything. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only (BR-30). */
  warehouseId?: string | undefined;
  onBack: () => void;
  /** Opens the Reject screen, after the admin confirmed. */
  onReject?: (() => void) | undefined;
  /** After the server approved; the screen already shows its Approved state. */
  onApproved?: ((result: FarmerApplicationDto) => void) | undefined;
  /**
   * @deprecated Ignored: Approve opens this screen's own Approve Application
   * view. A host (FarmerManagementFlow) still passes it; it is never called.
   */
  onApprove?: (() => void) | undefined;
  /** @deprecated Ignored: section 06 opens this screen's own Request More Info view. */
  onRequestMoreInfo?: (() => void) | undefined;
}

type SubView = 'review' | 'approve' | 'requestInfo';

function LightShell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <SafeAreaView style={decisionStyles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
      <View style={decisionStyles.header}>
        <BackButtonCard onPress={onBack} />
      </View>
      {children}
    </SafeAreaView>
  );
}

export const AdminApplicationDetailScreen: React.FC<AdminApplicationDetailScreenProps> = ({
  applicationId,
  application,
  can,
  warehouseId,
  onBack,
  onReject,
  onApproved,
}) => {
  const access = applicationAccess(can);
  const id = applicationId ?? application?.id;
  const live = useApplication(warehouseId, access.canView ? id : undefined);
  const [approvedResult, setApprovedResult] = useState<FarmerApplicationDto | null>(null);
  const [subView, setSubView] = useState<SubView>('review');

  if (!access.canView) {
    return (
      <LightShell onBack={onBack}>
        <AdminEmptyState title={t('farmerApps.detail.denied')} />
      </LightShell>
    );
  }

  const app = live.application;
  if (app === undefined) {
    return (
      <LightShell onBack={onBack}>
        {id === undefined || isNotFound(live.error) ? (
          <AdminEmptyState title={t('farmerApps.detail.notFound')} />
        ) : live.isLoading ? (
          <AdminLoadingState />
        ) : live.error !== null && live.error !== undefined ? (
          <AdminErrorState error={live.error} onRetry={live.refresh} />
        ) : (
          <AdminLoadingState />
        )}
      </LightShell>
    );
  }

  const state: DecisionState =
    approvedResult !== null || app.status === 'APPROVED' ? 'approved' : app.status === 'REJECTED' ? 'rejected' : 'pending';
  const status = state === 'approved' ? 'APPROVED' : app.status;
  const canRequestNow = access.canRequestInfo && (status === 'DOCS_REVIEW' || status === 'FARM_VERIFICATION');
  const approveGateReason = gateBlockerSummary(app.reviewGates?.approval, {
    requireFarmVerificationStage: app.reviewGates !== undefined || status !== 'FARM_VERIFICATION',
    status,
  });

  if (subView === 'approve' && state === 'pending') {
    return (
      <AdminApplicationApproveScreen
        applicationId={id}
        can={can}
        warehouseId={warehouseId}
        onBack={() => setSubView('review')}
        onApproved={(result) => {
          setApprovedResult(result);
          setSubView('review');
          // The host's "Application Approved" toast: only now, after the server agreed.
          onApproved?.(result);
        }}
      />
    );
  }

  if (subView === 'requestInfo') {
    return (
      <AdminApplicationRequestInfoScreen
        applicationId={id}
        can={can}
        warehouseId={warehouseId}
        onBack={() => setSubView('review')}
        onSent={() => setSubView('review')}
      />
    );
  }

  const handleReject = () => {
    if (!access.canDecide) return;
    Alert.alert(t('farmerApps.rejectConfirm.title'), t('farmerApps.rejectConfirm.message', { name: orDash(app.applicant.name) }), [
      { text: t('farmerApps.rejectConfirm.cancel'), style: 'cancel' },
      { text: t('farmerApps.rejectConfirm.confirm'), style: 'destructive', onPress: () => onReject?.() },
    ]);
  };

  return (
    <SafeAreaView style={detailStyles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <HeaderBanner
        title={orDash(app.applicant.name)}
        subtitle={t('farmerApps.detail.codeSeparator', { code: orDash(app.applicationCode) })}
        onBack={onBack}
        status={{ label: statusLabel(status), tone: statusTone(status), pill: state !== 'pending' }}
      />

      <ScrollView
        style={detailStyles.scroll}
        contentContainerStyle={detailStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={live.isRefreshing} onRefresh={live.refresh} tintColor={adminColors.brand} />}
      >
        <ApplicantSection app={app} />
        <FarmingSection app={app} />
        <FarmSection app={app} applicationId={id} canVerifyFmb={access.canVerifyFmb} />
        <DocumentsSection app={app} applicationId={id} canVerifyDocument={access.canVerifyDocument} />
        <TrackingSection app={app} status={status} applicationId={id} canAdvance={access.canAdvance} />
        <MoreInfoSection app={app} onOpenRequestInfo={canRequestNow ? () => setSubView('requestInfo') : undefined} />
        <DecisionSection app={app} state={state} applicationId={id} canAddNote={access.canAddNote} />
        <View style={detailStyles.bottomSpacer} />
      </ScrollView>

      {state === 'pending' ? (
        <ActionBar
          canDecide={access.canDecide}
          approveBlockedReason={approveGateReason}
          onApprove={() => setSubView('approve')}
          onReject={handleReject}
        />
      ) : null}
    </SafeAreaView>
  );
};
