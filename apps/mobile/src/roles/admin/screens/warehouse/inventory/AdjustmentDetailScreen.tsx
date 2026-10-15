/**
 * Adjustment Detail (design M3S17): one stock adjustment
 * (GET /admin/stock-adjustments/{id}, BR-37), with Approve and Reject.
 *
 * Gate: inventory.stock_adjustment.create to open it (the server reuses it
 * for reads); an id outside the scope is the server's 404, shown as "not
 * found", never a 403 leak.
 *
 * Approve / Reject (display only; the server enforces each again):
 *   - drawn only for a PENDING adjustment and only with
 *     inventory.stock_adjustment.approve, which a Sub admin never holds
 *     (BR-37a); see adjustmentActions.
 *   - Approve sends an Idempotency-Key and writes the ledger row (BR-37b).
 *   - Reject needs a reason (1-500 characters) and moves no stock.
 *   - The adjustment's own creator is refused by the server with 403
 *     SELF_APPROVAL_FORBIDDEN; the screen says so in words
 *     (stockActionErrorKey), and the adjustment stays PENDING. A decided
 *     adjustment is 409 INVALID_STATE_TRANSITION; a removal the batch can no
 *     longer cover is 409 STOCK_UNAVAILABLE.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ApiError } from '../../../../../shell/api/client';
import { useIdempotencyKey } from '../../../api/hooks';
import { REJECT_REASON_MAX } from '../../../api/stockAdjustments';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  EmptyState,
  InfoCard,
  InfoNote,
  PermissionNote,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { adjustmentActions, rejectReasonOf, stockActionErrorKey, type AdjustmentView } from './adjustmentMappers';
import { stockStyles } from './StockParts';
import type { InventoryScreenBaseProps } from './types';
import { useAdjustmentDetail, useApproveAdjustmentMutation, useRejectAdjustmentMutation } from './useStockAdjustmentData';

export interface AdjustmentDetailScreenProps extends InventoryScreenBaseProps {
  /** The warehouse every request sends (InventoryFlow, BR-30). */
  warehouseId: string | undefined;
  adjustmentId: string | undefined;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.problem.code === 'NOT_FOUND';
}

function Body({ adjustment }: { adjustment: AdjustmentView }) {
  const none = t('inventory.noValue');
  return (
    <>
      <SectionTitle right={<StatusBadge label={adjustment.statusLabel} tone={adjustment.statusTone} />}>
        {t('stockAdj.detail.summary')}
      </SectionTitle>
      <InfoCard
        rows={[
          [
            { label: t('stockShared.field.reference'), value: adjustment.ref },
            { label: t('stockAdj.detail.type'), value: adjustment.typeLabel },
          ],
          [
            { label: t('stockShared.field.batch'), value: adjustment.batchCode },
            { label: t('stockShared.field.product'), value: adjustment.productLabel },
          ],
          [
            { label: t('stockAdj.detail.quantity'), value: adjustment.deltaText || none },
            { label: t('stockAdj.detail.created'), value: adjustment.createdAt },
          ],
          [{ label: t('stockAdj.detail.decided'), value: adjustment.decidedAt ?? none }],
        ]}
      />
      <SectionTitle>{t('stockAdj.detail.reason')}</SectionTitle>
      <InfoNote tone="info">{adjustment.reason}</InfoNote>
      {adjustment.rejectionReason ? (
        <InfoNote tone="danger">{t('stockAdj.detail.rejectionReason', { text: adjustment.rejectionReason })}</InfoNote>
      ) : null}
      {adjustment.status === 'PENDING' ? <InfoNote tone="warning">{t('stockAdj.detail.pendingNote')}</InfoNote> : null}
      {adjustment.status === 'APPROVED' ? <InfoNote tone="success">{t('stockAdj.detail.approvedNote')}</InfoNote> : null}
    </>
  );
}

export function AdjustmentDetailScreen({ scope, can, onNavigate, onBack, warehouseId, adjustmentId }: AdjustmentDetailScreenProps) {
  const detail = useAdjustmentDetail(warehouseId, adjustmentId);
  const approve = useApproveAdjustmentMutation();
  const reject = useRejectAdjustmentMutation();
  const approveKey = useIdempotencyKey();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectText, setRejectText] = useState('');
  const [actionError, setActionError] = useState<unknown>(null);

  const adjustment = detail.item;
  const header = <ScopeHeader scope={scope} />;

  if (adjustment === undefined) {
    const notFound = adjustmentId === undefined || isNotFound(detail.error);
    return (
      <WalletScreen title={t('stockAdj.detail.title')} onBack={onBack} headerExtra={header}>
        {detail.isLoading ? <AdminLoadingState /> : null}
        {!detail.isLoading && notFound ? <EmptyState title={t('stockAdj.detail.notFound')} /> : null}
        {!detail.isLoading && !notFound && detail.error ? <AdminErrorState error={detail.error} onRetry={detail.refresh} /> : null}
      </WalletScreen>
    );
  }

  const actions = adjustmentActions(can, adjustment);
  const busy = approve.isPending || reject.isPending;
  const validReason = rejectReasonOf(rejectText);

  const runApprove = () => {
    setActionError(null);
    approve.mutate(
      { id: adjustment.id, idempotencyKey: approveKey.keyFor({ action: 'approve', id: adjustment.id }) },
      {
        onSuccess: () => approveKey.reset(),
        onError: setActionError,
      },
    );
  };

  const confirmApprove = () => {
    Alert.alert(
      t('stockAdj.detail.approveConfirmTitle'),
      t('stockAdj.detail.approveConfirmBody', { qty: adjustment.deltaText, batch: adjustment.batchCode }),
      [
        { text: t('stockShared.keep'), style: 'cancel' },
        { text: t('stockAdj.detail.approve'), onPress: runApprove },
      ],
    );
  };

  const submitReject = () => {
    if (validReason === null) return;
    setActionError(null);
    reject.mutate(
      { id: adjustment.id, body: { reason: validReason } },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setRejectText('');
        },
        onError: setActionError,
      },
    );
  };

  const showFooter = actions.approve || (actions.reject && !rejectOpen) || adjustment.verificationId !== null || adjustment.status === 'APPROVED';

  return (
    <WalletScreen
      title={t('stockAdj.detail.title')}
      subtitle={adjustment.batchCode}
      onBack={onBack}
      headerExtra={header}
      footer={
        showFooter ? (
          <WalletFooter>
            {actions.approve ? (
              <WalletButton label={t('stockAdj.detail.approve')} disabled={busy} onPress={confirmApprove} />
            ) : null}
            {actions.reject && !rejectOpen ? (
              <WalletButton label={t('stockAdj.detail.reject')} variant="outline" disabled={busy} onPress={() => setRejectOpen(true)} />
            ) : null}
            {adjustment.verificationId !== null ? (
              <WalletButton
                label={t('stockAdj.detail.viewCount')}
                variant="neutral"
                onPress={() => onNavigate?.('M3S12', { verificationId: adjustment.verificationId })}
              />
            ) : null}
            {adjustment.status === 'APPROVED' ? (
              <WalletButton
                label={t('stockAdj.detail.viewLedger')}
                variant="neutral"
                onPress={() => onNavigate?.('M3S06', { batchId: adjustment.batchId })}
              />
            ) : null}
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} keyboardShouldPersistTaps="handled">
        {actionError ? <InfoNote tone="danger">{t(stockActionErrorKey(actionError))}</InfoNote> : null}
        {actions.reject && rejectOpen ? (
          <View>
            <Text style={stockStyles.fieldLabel}>{t('stockAdj.detail.rejectReasonLabel')}</Text>
            <TextInput
              style={[stockStyles.input, stockStyles.multiline]}
              value={rejectText}
              onChangeText={setRejectText}
              maxLength={REJECT_REASON_MAX}
              multiline
              placeholder={t('stockAdj.detail.rejectReasonPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              accessibilityLabel={t('stockAdj.detail.rejectReasonLabel')}
            />
            <View style={stockStyles.actionsRow}>
              <WalletButton label={t('stockShared.keep')} variant="outline" flex onPress={() => setRejectOpen(false)} />
              <WalletButton
                label={t('stockAdj.detail.rejectConfirm')}
                flex
                disabled={validReason === null || busy}
                onPress={submitReject}
              />
            </View>
          </View>
        ) : null}
        <Body adjustment={adjustment} />
        {adjustment.status === 'PENDING' && !actions.approve ? (
          <PermissionNote>{t('stockAdj.detail.noApprovePermission')}</PermissionNote>
        ) : null}
        {/* Opens the history so a reader can move to other adjustments of the scope. */}
        <TouchableOpacity style={stockStyles.linkRow} onPress={() => onNavigate?.('M3S14')} accessibilityRole="button">
          <Text style={stockStyles.linkText}>{t('stockCount.hub.historyLink')}</Text>
          <Text style={stockStyles.link}>{t('stockShared.open')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </WalletScreen>
  );
}
