/**
 * Approve Return — the confirmation before POST /admin/returns/{id}/approve
 * (plan phase 10).
 *
 * BR-61: INSPECTED -> APPROVED only. Confirm is enabled by the same
 * approveGate as the review step (INSPECTED, rma.refund.approve, something
 * accepted), so a deep link to this route cannot approve what the review
 * would not. The server re-checks (409 INVALID_STATE_TRANSITION).
 */
// Design id: M10-S05
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { approveGate, returnWriteErrorKey } from './mappers';
import { ActionError, PermissionNote, ReturnDetailGate, ReturnItemsList, ReturnsButton, ReturnsFooter, ReturnsScreen, SectionTitle } from './ReturnsParts';
import type { ReturnDetailView, ReturnsLiveStateProps, ReturnsWriteStateProps, WarehouseScreenBaseProps } from './types';

function QuestionCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.success.text} strokeWidth="1.8" />
      <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke={adminColors.success.text} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export interface ApproveReturnScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps, ReturnsWriteStateProps {
  detail: ReturnDetailView | undefined;
  notFound?: boolean | undefined;
  onConfirmApprove: () => void;
}

export function ApproveReturnScreen({
  can,
  onBack,
  detail,
  notFound,
  onConfirmApprove,
  isSubmitting = false,
  submitError,
  isLoading,
  error,
  onRetry,
}: ApproveReturnScreenProps) {
  const gate = detail === undefined ? null : approveGate(detail.status, detail.items, can);

  return (
    <ReturnsScreen
      title={t('returns.approve.title')}
      subtitle={detail?.reference}
      onBack={onBack}
      footer={
        gate === null ? null : (
          <ReturnsFooter>
            <ReturnsButton
              label={t(isSubmitting ? 'returns.approve.pending' : 'returns.approve.confirm')}
              variant="successOutline"
              disabled={!gate.enabled || isSubmitting}
              onPress={onConfirmApprove}
            />
            <ReturnsButton label={t('returns.approve.cancel')} variant="neutralOutline" onPress={onBack} />
            {gate.enabled ? null : <PermissionNote>{t(gate.noteKey ?? 'returns.detail.noAction')}</PermissionNote>}
          </ReturnsFooter>
        )
      }
    >
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {submitError !== null && submitError !== undefined ? <ActionError messageKey={returnWriteErrorKey(submitError)} /> : null}
            <View style={styles.confirmCard}>
              <View style={styles.cardHeaderRow}>
                <QuestionCircleIcon />
                <Text style={styles.cardHeaderTitle}>{t('returns.approve.question')}</Text>
              </View>
              <View style={styles.noteBox}>
                <Text style={styles.body}>{t('returns.approve.body')}</Text>
              </View>
            </View>
            <SectionTitle>{t('returns.detail.items')}</SectionTitle>
            <ReturnItemsList items={d.items} />
          </ScrollView>
        )}
      </ReturnDetailGate>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  body: { ...adminType.body, color: adminColors.ink },
  confirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.success.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  cardHeaderTitle: { ...adminType.sectionHead, color: adminColors.success.text },
  noteBox: { backgroundColor: adminColors.canvas, borderRadius: adminRadius.md, padding: adminSpacing.md },
});
