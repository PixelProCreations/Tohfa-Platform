/**
 * Application Review: one farmer application, sections 01-05, with the
 * Approve / Reject bar (GET /admin/farmer-applications/{id},
 * farmer.application.view; POST .../approve).
 *
 * Look and flow: team design (tofhafarmfin-rbac AdminApplicationDetailScreen),
 * split into ./detail/*. Against the design:
 *   - Data comes from the application id through useApplication; nothing from
 *     the host's item but its `id`, and never the design's demo values. Fields
 *     the API cannot supply show the "not available" dash.
 *   - Approve replaces the old separate Approve screen with the design's
 *     in-place Approved state, but only after the server agreed; the
 *     Idempotency-Key is then released (finish()). No approval notes (the
 *     design has none). Approve asks for confirmation first (owner request,
 *     like Reject): only the pop-up's Approve button calls the server.
 *   - Reject keeps the design's confirmation, then hands over to the Reject
 *     screen; this screen never claims "Application Rejected" itself.
 *   - Request More Info is dropped (owner decision); `onRequestMoreInfo` is
 *     still accepted so the current host compiles, and is never called.
 *   - No cosmetic "approval blocked" banner (BR-69 is the server's), no role
 *     names, no visible design spec caption.
 *
 * Access fails closed: without farmer.application.view (or with no `can`)
 * nothing is fetched. Approve/Reject need approve AND reject (see
 * applicationLogic.ts).
 */
import React, { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import type { FarmerApplicationDto } from '../../api/farmerApplications';
import { useApplication, useApproveApplication } from '../../api/farmerHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminSpacing } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { BackButtonCard, HeaderBanner } from './applications/ApplicationParts';
import {
  applicationAccess,
  isNotFound,
  notAvailable,
  orDash,
  statusLabel,
  statusTone,
  type PendingApplicationItem,
} from './applications/applicationLogic';
import { ActionBar } from './detail/ActionBar';
import { ApplicantSection } from './detail/ApplicantSection';
import { DecisionSection, type DecisionState } from './detail/DecisionSection';
import { DocumentsSection } from './detail/DocumentsSection';
import { FarmingSection } from './detail/FarmingSection';
import { FarmSection } from './detail/FarmSection';

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
   * @deprecated Ignored. The host used it to open the old Approve screen, which
   * the design replaced with the in-place Approved state. Phase 3 drops it.
   */
  onApprove?: (() => void) | undefined;
  /** @deprecated Ignored: Request More Info was dropped (owner decision). Phase 3 drops it. */
  onRequestMoreInfo?: (() => void) | undefined;
}

function LightShell({ onBack, children }: { onBack: () => void; children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
      <View style={styles.lightHeader}>
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
  const approve = useApproveApplication(access.canView && access.canDecide ? id : undefined);
  const [approvedResult, setApprovedResult] = useState<FarmerApplicationDto | null>(null);

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
  const decidedAt = approvedResult?.decidedAt ?? app.decidedAt;

  const runApprove = () => {
    if (!access.canDecide || approve.isPending) return;
    approve.run({}, (result) => {
      setApprovedResult(result);
      // The decision is done: the next one gets a fresh Idempotency-Key.
      approve.finish();
      // The host's "Application Approved" toast: only now, after the server agreed.
      onApproved?.(result);
    });
  };

  const handleApprove = () => {
    if (!access.canDecide || approve.isPending) return;
    Alert.alert(t('farmerApps.approveConfirm.title'), t('farmerApps.approveConfirm.message', { name: orDash(app.applicant.name) }), [
      { text: t('farmerApps.approveConfirm.cancel'), style: 'cancel' },
      { text: t('farmerApps.approveConfirm.confirm'), onPress: runApprove },
    ]);
  };

  const handleReject = () => {
    if (!access.canDecide) return;
    Alert.alert(t('farmerApps.rejectConfirm.title'), t('farmerApps.rejectConfirm.message', { name: orDash(app.applicant.name) }), [
      { text: t('farmerApps.rejectConfirm.cancel'), style: 'cancel' },
      { text: t('farmerApps.rejectConfirm.confirm'), style: 'destructive', onPress: () => onReject?.() },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <HeaderBanner
        title={orDash(app.applicant.name)}
        // No human application code exists ("APP-2026-…" in the design).
        subtitle={`${notAvailable()} · `}
        onBack={onBack}
        status={{ label: statusLabel(status), tone: statusTone(status), pill: state !== 'pending' }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={state === 'pending' ? styles.contentWithBar : styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={live.isRefreshing} onRefresh={live.refresh} tintColor={adminColors.brand} />}
      >
        <ApplicantSection app={app} status={status} decidedAt={decidedAt ?? null} />
        <FarmSection app={app} />
        <DocumentsSection app={app} reviewing={state === 'pending'} />
        <FarmingSection app={app} approved={state === 'approved'} />
        <DecisionSection app={app} state={state} />
      </ScrollView>

      {state === 'pending' ? (
        <ActionBar
          canDecide={access.canDecide}
          isApproving={approve.isPending}
          approveError={approve.error}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminColors.canvas },
  lightHeader: {
    paddingHorizontal: adminSpacing.input,
    paddingTop: adminSpacing.mdLg,
    paddingBottom: adminSpacing.xs,
  },
  scroll: { flex: 1, backgroundColor: adminColors.canvas },
  content: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxxl,
  },
  contentWithBar: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    // Room for the sticky action bar (and its error line).
    paddingBottom: adminSpacing.pageMargin + adminSpacing.largeSection,
  },
});
