/**
 * Wallet Refund — the refund step of an APPROVED return, on
 * POST /admin/returns/{id}/refund/wallet (plan phase 10).
 *
 * BR-61: APPROVED -> REFUNDED with an instant wallet credit. The button is
 * offered only when returnActions allows it (APPROVED, with
 * rma.refund.wallet_process); the server re-checks (409
 * INVALID_STATE_TRANSITION, CLAUDE.md 2.1). The amount is the server's (the
 * accepted quantity at the order price) and is only known once the refund is
 * made, so "Refund Amount" is drawn with a dash here; the Refund Completed
 * page shows what the server confirmed. Customer and order come from the order
 * detail when the caller can read it.
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
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { returnActions } from './mappers';
import {
  InfoCard,
  isAllWarehouses,
  NoticeBox,
  PermissionNote,
  ReturnDetailGate,
  ReturnItemsList,
  ReturnsButton,
  ReturnsFooter,
  ReturnsScreen,
  SectionTitle,
  StatusBadge,
} from './ReturnsParts';
import type { ReturnDetailView, ReturnOrderView, ReturnsLiveStateProps, WarehouseScreenBaseProps } from './types';

export interface RefundStatusScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps {
  detail: ReturnDetailView | undefined;
  /** The linked order's facts, once loaded (and only when the caller can read orders). */
  order?: ReturnOrderView | undefined;
  notFound?: boolean | undefined;
  onConfirmRefund: () => void;
  isSubmitting?: boolean | undefined;
}

export function RefundStatusScreen({
  scope,
  can,
  onBack,
  detail,
  order,
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
            <SectionTitle>{t('returns.refund.summary')}</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: t('returns.detail.customer'), value: order?.buyerName ?? ADMIN_NO_VALUE },
                  { label: t('returns.detail.order'), value: order?.orderNumber ?? ADMIN_NO_VALUE },
                ],
                [
                  { label: t('returns.detail.reference'), value: d.reference },
                  { label: t('returns.refund.statusLabel'), value: <StatusBadge label={d.statusLabel} tone={d.statusTone} /> },
                ],
              ]}
            />

            <SectionTitle>{t('returns.refund.amountSection')}</SectionTitle>
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>{t('returns.detail.refundAmount')}</Text>
              <Text style={styles.amountValue}>{ADMIN_NO_VALUE}</Text>
            </View>

            <SectionTitle>{t('returns.detail.refundMethod')}</SectionTitle>
            <InfoCard rows={[[{ label: t('returns.refund.method'), value: t('returns.refund.methodWallet') }]]} />

            {isAllWarehouses(scope) ? <NoticeBox>{t('returns.refund.eligibilityNote')}</NoticeBox> : null}

            <Text style={styles.body}>{t('returns.refund.body')}</Text>
            {canRefund ? <NoticeBox>{t('returns.refund.permissionNote')}</NoticeBox> : null}
            <Text style={styles.noBankNotice}>{t('returns.refund.noBankNotice')}</Text>
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
  amountCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  amountLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  amountValue: { ...adminType.kpiValue, color: adminColors.ink },
  noBankNotice: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.md },
});
