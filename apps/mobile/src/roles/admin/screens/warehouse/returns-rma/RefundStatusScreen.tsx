/**
 * Refund Status — refund summary of an approved RMA and the wallet refund.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1), FINAL_LIST row 97:
 *   - "Process Wallet Refund" (and its "Confirm Refund") only with
 *     `rma.refund.wallet_process` (MAIN all, SUB own).
 */
// Design id: M10-S05
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { useAdminQuery, useIdempotencyKey } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getCustomer } from '../../../api/customers';
import { formatMoney } from '../orders/mappers';
import { AdminErrorState } from '../shared/AsyncStates';
import { toRmaRecord } from './mappers';
import { useRefundReturnToWallet, useReturn } from './useReturnData';
import {
  InfoCard,
  inScope,
  PermissionNote,
  ReturnsButton,
  ReturnsScreen,
  SectionTitle,
} from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface RefundStatusScreenProps extends RmaScreenBaseProps {
  refundAmount?: string | undefined;
  onConfirmSuccess: (data: { rma: RmaRecord; refundAmount: string; transactionId?: string | undefined }) => void;
  onConfirmFailed?: ((data: { rma: RmaRecord; error: unknown }) => void) | undefined;
}

const REFUND_METHOD = 'TOHFA Wallet';

function WalletCardIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M16 12h4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="16" cy="12" r="1" fill={adminColors.onBrand} />
    </Svg>
  );
}

function QuestionCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.brandDeep} strokeWidth="1.8" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={adminColors.brandDeep}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={adminColors.success.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RefundStatusScreen({
  scope,
  can,
  returnId,
  rma: initialRma,
  refundAmount = '—',
  onBack,
  onConfirmSuccess,
  onConfirmFailed,
}: RefundStatusScreenProps) {
  const effectiveId = returnId ?? initialRma?.id;
  const returnQuery = useReturn(effectiveId);
  const rma = returnQuery.data ? toRmaRecord(returnQuery.data) : initialRma;

  const [showConfirmRefund, setShowConfirmRefund] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const canWalletRefund =
    can('rma.refund.wallet_process') && inScope(scope, rma?.warehouseId);

  const customerId = rma?.customerId;
  const customerQuery = useAdminQuery(
    adminKeys.detail('customers', customerId ?? ''),
    (signal) => getCustomer(customerId!, signal),
    { enabled: can('customer.detail.view') && Boolean(customerId && customerId !== '—') },
  );
  const customerName = customerQuery.data?.name ?? rma?.customerName;

  const refundMutation = useRefundReturnToWallet();
  const keyCache = useIdempotencyKey();

  const handleProcessRefund = async () => {
    if (!effectiveId || !canWalletRefund) return;
    setSubmitError(null);
    const key = keyCache.keyFor({ returnId: effectiveId });
    try {
      const result = await refundMutation.mutateAsync({ id: effectiveId, idempotencyKey: key });
      keyCache.reset();
      const formattedAmount = formatMoney(result.amount);
      onConfirmSuccess({
        rma: toRmaRecord(result.returnRequest),
        refundAmount: formattedAmount,
        transactionId: result.walletTransactionId ?? undefined,
      });
    } catch (err) {
      setSubmitError(err);
      if (onConfirmFailed && rma) {
        onConfirmFailed({ rma, error: err });
      }
    }
  };

  if (!rma) {
    return (
      <ReturnsScreen title="Refund Status" onBack={onBack}>
        <View style={styles.scrollContent}>
          <Text style={{ ...adminType.body, color: adminColors.muted }}>Return not found</Text>
        </View>
      </ReturnsScreen>
    );
  }

  const cleanAmount = refundAmount !== '—' ? refundAmount.replace('.00', '') : '—';

  return (
    <ReturnsScreen title="Refund Status" subtitle={rma.rmaId} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {submitError ? (
          <View style={{ marginBottom: adminSpacing.md }}>
            <AdminErrorState error={submitError} onRetry={handleProcessRefund} />
          </View>
        ) : null}

        {showConfirmRefund && canWalletRefund ? (
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeaderRow}>
              <QuestionCircleIcon />
              <Text style={styles.confirmTitle}>Confirm Wallet Refund</Text>
            </View>
            <View style={styles.confirmInnerBox}>
              <InfoCard
                rows={[
                  [
                    { label: 'Customer', value: customerName ?? rma.customerName },
                    { label: 'Refund Amount', value: cleanAmount },
                  ],
                  [{ label: 'Refund Method', value: REFUND_METHOD }],
                ]}
              />
            </View>
            <Text style={styles.confirmDisclaimer}>This will credit the customer's wallet after server confirmation.</Text>
            <View style={styles.confirmActions}>
              <ReturnsButton
                variant="successOutline"
                label={refundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
                icon={<CheckmarkIcon />}
                disabled={refundMutation.isPending}
                onPress={handleProcessRefund}
              />
              <ReturnsButton
                variant="neutralOutline"
                label="Cancel"
                disabled={refundMutation.isPending}
                onPress={() => setShowConfirmRefund(false)}
              />
            </View>
          </View>
        ) : (
          <>
            <SectionTitle>Refund Summary</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Customer', value: customerName ?? rma.customerName },
                  { label: 'Order', value: rma.orderId },
                ],
                [
                  { label: 'RMA', value: rma.rmaId },
                  { label: 'Refund Amount', value: cleanAmount },
                ],
                [
                  { label: 'Refund Method', value: REFUND_METHOD },
                  { label: 'Refund Status', value: rma.status === 'Approved' ? 'Pending' : rma.status },
                ],
              ]}
            />

            <View style={styles.actions}>
              {canWalletRefund ? (
                <ReturnsButton
                  label="Process Wallet Refund"
                  icon={<WalletCardIcon />}
                  onPress={() => setShowConfirmRefund(true)}
                />
              ) : (
                <PermissionNote>Wallet refund processing needs the wallet refund permission.</PermissionNote>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  actions: { marginTop: adminSpacing.lg, gap: adminSpacing.md },
  confirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    padding: adminSpacing.lg,
  },
  confirmHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  confirmTitle: { ...adminType.title, color: adminColors.ink },
  confirmInnerBox: { marginBottom: adminSpacing.md },
  confirmDisclaimer: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.lg },
  confirmActions: { gap: adminSpacing.md },
});
