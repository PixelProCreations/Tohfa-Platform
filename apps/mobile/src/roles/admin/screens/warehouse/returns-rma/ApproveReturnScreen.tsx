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
import { ScrollView, StyleSheet, Text } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { approveGate, returnWriteErrorKey } from './mappers';
import { ActionError, PermissionNote, ReturnDetailGate, ReturnItemsList, ReturnsButton, ReturnsFooter, ReturnsScreen, SectionTitle } from './ReturnsParts';
import type { ReturnDetailView, ReturnsLiveStateProps, ReturnsWriteStateProps, WarehouseScreenBaseProps } from './types';

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
              disabled={!gate.enabled || isSubmitting}
              onPress={onConfirmApprove}
            />
            {gate.enabled ? null : <PermissionNote>{t(gate.noteKey ?? 'returns.detail.noAction')}</PermissionNote>}
          </ReturnsFooter>
        )
      }
    >
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {submitError !== null && submitError !== undefined ? <ActionError messageKey={returnWriteErrorKey(submitError)} /> : null}
            <Text style={styles.body}>{t('returns.approve.body')}</Text>
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
});
