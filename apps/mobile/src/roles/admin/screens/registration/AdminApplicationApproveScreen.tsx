/**
 * Approve Application (POST /admin/farmer-applications/{id}/approve,
 * farmer.application.approve, Idempotency-Key), drawn as the design draws it
 * (origin/Superadmin-main AdminApplicationApproveScreen): back card, title,
 * sub-title, applicant card with its documents pill, "Approval Notes
 * (Optional)", and "Confirm & Onboard Farmer".
 *
 * Reached from the review screen's Approve button; it replaces the earlier
 * confirmation pop-up as the "are you sure" step. Against the design:
 *   - The applicant card comes from the API by id, never the design's fixture phone.
 *   - "All Documents Verified" is drawn only when the application says its
 *     documents were verified; it never does yet, so the pill keeps its shape
 *     and carries the dash (testID farmerApps.approve.docsPill).
 *   - Approval notes: the approve-with-note backend is being built now, so the
 *     box is drawn read-only and disabled (testID farmerApps.approve.notes) and
 *     the approval is sent with no note.
 *   - Confirm calls the real approval once; the host hears about it only after
 *     the server agreed, and the Idempotency-Key is then released. A refused
 *     approval (BR-69, BR-135, 403, 409 ...) is shown above the button, which
 *     stays so the admin can retry with the same key.
 *
 * Access fails closed: approve AND reject are needed (applicationLogic.ts).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Icon, SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { APPROVE_NOTE_MAX, type FarmerApplicationDto } from '../../api/farmerApplications';
import { useApplication, useApproveApplication } from '../../api/farmerHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors } from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState } from '../warehouse/shared/AsyncStates';
import { BackButtonCard } from './applications/ApplicationParts';
import { applicationAccess, applicationErrorKey } from './applications/applicationLogic';
import { ApplicantCard, applicantSummary, decisionStyles } from './applications/DecisionScreenParts';
import { FS, RAD, SP } from './designMetrics';
import { documentVerificationState, gateBlockerSummary } from './detail/documentReview';

export interface AdminApplicationApproveScreenProps {
  applicationId: string | undefined;
  /** Permission check from /auth/me. Missing = deny everything. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only (BR-30). */
  warehouseId?: string | undefined;
  onBack: () => void;
  /** After the server approved. */
  onApproved?: ((result: FarmerApplicationDto) => void) | undefined;
}

export const AdminApplicationApproveScreen: React.FC<AdminApplicationApproveScreenProps> = ({
  applicationId,
  can,
  warehouseId,
  onBack,
  onApproved,
}) => {
  const access = applicationAccess(can);
  const allowed = access.canView && access.canDecide;
  const live = useApplication(warehouseId, allowed ? applicationId : undefined);
  const approve = useApproveApplication(allowed ? applicationId : undefined);
  const [notes, setNotes] = useState('');
  const app = live.application;
  const summary = applicantSummary(app);
  const verified = app !== undefined && documentVerificationState(app) === 'verified';
  const gateReason =
    app === undefined
      ? null
      : gateBlockerSummary(app.reviewGates?.approval, {
          requireFarmVerificationStage: app.reviewGates !== undefined || app.status !== 'FARM_VERIFICATION',
          status: app.status,
        });
  const canConfirm = Boolean(allowed && app !== undefined && !approve.isPending && gateReason === null);
  const hasError = approve.error !== null && approve.error !== undefined;

  const confirm = () => {
    if (!canConfirm) return;
    const note = notes.trim();
    approve.run(note.length > 0 ? { note } : {}, (result) => {
      // The decision is done: the next one gets a fresh Idempotency-Key.
      approve.finish();
      onApproved?.(result);
    });
  };

  return (
    <SafeAreaView style={decisionStyles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={adminColors.canvas} />
      <View style={decisionStyles.header}>
        <BackButtonCard onPress={onBack} />
      </View>

      <ScrollView style={decisionStyles.container} contentContainerStyle={decisionStyles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={decisionStyles.title} accessibilityRole="header">
          {t('farmerApps.approve.title')}
        </Text>

        {!allowed ? (
          <AdminEmptyState title={t('farmerApps.approve.denied')} />
        ) : (
          <>
            <Text style={decisionStyles.subtitle}>{t('farmerApps.approve.subtitle', { name: summary.name })}</Text>

            <ApplicantCard summary={summary}>
              <View style={styles.badgeRow}>
                <View
                  style={[styles.verifiedPill, verified ? null : styles.unknownPill]}
                  testID="farmerApps.approve.docsPill"
                >
                  <Icon
                    name="check_circle"
                    size={SP.s16}
                    color={verified ? adminColors.success.text : adminColors.muted}
                    style={styles.verifiedPillIcon}
                  />
                  <Text style={[styles.verifiedPillText, verified ? null : styles.unknownPillText]}>
                    {verified ? t('farmerApps.approve.docsVerified') : t('farmerApps.approve.docsUnknown', { value: ADMIN_NO_VALUE })}
                  </Text>
                </View>
              </View>
            </ApplicantCard>

            <Text style={decisionStyles.fieldLabel}>{t('farmerApps.approve.notesLabel')}</Text>
            <TextInput
              style={decisionStyles.notesInput}
              editable={allowed && !approve.isPending}
              value={notes}
              onChangeText={setNotes}
              maxLength={APPROVE_NOTE_MAX}
              placeholder={t('farmerApps.approve.notesPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              multiline
              numberOfLines={3}
              testID="farmerApps.approve.notes"
            />

            {gateReason !== null ? (
              <View style={decisionStyles.errorBox} testID="farmerApps.approve.gateBlocked">
                <Text style={decisionStyles.errorText}>{t('farmerApps.approve.gateBlocked', { reason: gateReason })}</Text>
              </View>
            ) : null}

            {hasError ? (
              <View style={decisionStyles.errorBox} accessibilityLiveRegion="polite">
                <Text style={decisionStyles.errorText}>{t(applicationErrorKey(approve.error))}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[decisionStyles.primaryBtn, !canConfirm ? decisionStyles.busy : null]}
              activeOpacity={0.85}
              onPress={confirm}
              disabled={!canConfirm}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canConfirm, busy: approve.isPending }}
              testID="farmerApps.approve.confirm"
            >
              <Icon name="check_circle" size={SP.s20} color={adminColors.onBrand} style={decisionStyles.primaryBtnIcon} />
              <Text style={decisionStyles.primaryBtnText}>
                {approve.isPending ? t('farmerApps.action.approving') : t('farmerApps.approve.confirm')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={decisionStyles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row' },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.success.bg,
    borderRadius: RAD.r12,
    paddingHorizontal: SP.s12,
    paddingVertical: SP.s6,
  },
  /** Nothing reports a verification: the same pill, neutral, carrying the dash. */
  unknownPill: { backgroundColor: adminColors.warehouse.warmCanvas },
  verifiedPillIcon: { marginRight: SP.s6 },
  verifiedPillText: { fontSize: FS.s12_5, fontWeight: '700', color: adminColors.success.text },
  unknownPillText: { color: adminColors.muted },
});
