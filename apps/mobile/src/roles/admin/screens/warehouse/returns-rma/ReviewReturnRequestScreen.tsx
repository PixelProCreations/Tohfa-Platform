/**
 * Review Return — the inspection result and the decision (plan phase 10).
 *
 * Shows what the inspection recorded per item, then Approve and Reject.
 * BR-61: Approve exists only for an INSPECTED return with rma.refund.approve
 * (approveGate), and is drawn disabled, with the reason, when nothing was
 * accepted on any line: a Rs 0 approval would leave the return stuck in
 * APPROVED (wallet.move refuses a zero credit, and an APPROVED return cannot
 * be rejected). Reject stays offered (PENDING or INSPECTED, same code).
 *
 * Hidden, because the return carries no such field: the refund amount before
 * the refund (the server works it out from the order price), the inspection
 * notes and photos.
 */
// Design id: M10-S04
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import { approveGate, returnActions } from './mappers';
import { PermissionNote, ReturnDetailGate, ReturnItemsList, ReturnsButton, ReturnsFooter, ReturnsScreen, SectionTitle } from './ReturnsParts';
import type { ReturnDetailView, ReturnsLiveStateProps, WarehouseScreenBaseProps } from './types';

export interface ReviewReturnRequestScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps {
  detail: ReturnDetailView | undefined;
  notFound?: boolean | undefined;
  onApprove: () => void;
  onReject: () => void;
}

export function ReviewReturnRequestScreen({
  can,
  onBack,
  detail,
  notFound,
  onApprove,
  onReject,
  isLoading,
  error,
  onRetry,
}: ReviewReturnRequestScreenProps) {
  const gate = detail === undefined ? null : approveGate(detail.status, detail.items, can);
  const actions = detail === undefined ? null : returnActions(detail.status, can);

  const footer =
    gate === null || actions === null ? null : (
      <ReturnsFooter>
        {gate.visible ? (
          <ReturnsButton label={t('returns.action.approve')} variant="successOutline" disabled={!gate.enabled} onPress={onApprove} />
        ) : null}
        {gate.noteKey ? <PermissionNote>{t(gate.noteKey)}</PermissionNote> : null}
        {actions.reject ? <ReturnsButton label={t('returns.action.reject')} variant="dangerOutline" onPress={onReject} /> : null}
        {!gate.visible && !actions.reject ? <PermissionNote>{t('returns.detail.noAction')}</PermissionNote> : null}
      </ReturnsFooter>
    );

  return (
    <ReturnsScreen title={t('returns.review.title')} subtitle={detail?.reference} onBack={onBack} footer={footer}>
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <SectionTitle>{t('returns.detail.items')}</SectionTitle>
            <ReturnItemsList items={d.items} />
          </ScrollView>
        )}
      </ReturnDetailGate>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
});
