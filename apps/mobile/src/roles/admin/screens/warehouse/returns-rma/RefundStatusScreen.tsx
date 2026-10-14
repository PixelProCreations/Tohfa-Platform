/**
 * Wallet Refund — the refund step of an APPROVED return, on
 * POST /admin/returns/{id}/refund/wallet (plan phase 10).
 *
 * BR-61: APPROVED -> REFUNDED with an instant wallet credit. The button is
 * offered only when returnActions allows it (APPROVED, with
 * rma.refund.wallet_process); the server re-checks (409
 * INVALID_STATE_TRANSITION, CLAUDE.md 2.1). The amount is the server's (the
 * accepted quantity at the order price), so none is shown before the refund.
 *
 * There is no bank refund here: rma.refund.bank_process is `none` for both
 * warehouse roles.
 *
 * A failed attempt is not handled here: ReturnsFlow's LiveRefundRoute shows
 * RefundFailedScreen in place and retries through the same hook and
 * Idempotency-Key (BR-61d).
 */
// Design id: M10-S05
import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { returnActions } from './mappers';
import { InfoCard, PermissionNote, ReturnDetailGate, ReturnItemsList, ReturnsButton, ReturnsFooter, ReturnsScreen, SectionTitle, StatusBadge } from './ReturnsParts';
import type { ReturnDetailView, ReturnsLiveStateProps, WarehouseScreenBaseProps } from './types';

export interface RefundStatusScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps {
  detail: ReturnDetailView | undefined;
  notFound?: boolean | undefined;
  onConfirmRefund: () => void;
  isSubmitting?: boolean | undefined;
}

export function RefundStatusScreen({
  can,
  onBack,
  detail,
  notFound,
  onConfirmRefund,
  isSubmitting = false,
  isLoading,
  error,
  onRetry,
}: RefundStatusScreenProps) {
  const canRefund = detail !== undefined && returnActions(detail.status, can).refundWallet;

  return (
    <ReturnsScreen
      title={t('returns.refund.title')}
      subtitle={detail?.reference}
      onBack={onBack}
      footer={
        detail === undefined ? null : (
          <ReturnsFooter>
            <ReturnsButton
              label={t(isSubmitting ? 'returns.refund.pending' : 'returns.refund.confirm')}
              disabled={!canRefund || isSubmitting}
              onPress={onConfirmRefund}
            />
            {canRefund ? null : <PermissionNote>{t('returns.detail.noAction')}</PermissionNote>}
          </ReturnsFooter>
        )
      }
    >
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.reference'), value: d.reference },
                  { label: t('returns.detail.status'), value: <StatusBadge label={d.statusLabel} tone={d.statusTone} /> },
                ],
                [{ label: t('returns.refund.method'), value: t('returns.refund.methodWallet') }],
              ]}
            />
            <Text style={styles.body}>{t('returns.refund.body')}</Text>
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
  body: { ...adminType.body, color: adminColors.ink, marginTop: adminSpacing.md },
});
