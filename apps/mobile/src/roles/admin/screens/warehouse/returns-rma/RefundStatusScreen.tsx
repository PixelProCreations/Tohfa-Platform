/**
 * Refund Status — refund summary of an approved RMA and the wallet refund.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1), FINAL_LIST row 97:
 *   - "Process Wallet Refund" (and its "Confirm Refund") only with
 *     `rma.refund.wallet_process` (MAIN all, SUB own).
 *   - There is never a bank refund action: `rma.refund.bank_process` is
 *     none/none for both warehouse roles (SUPER_ADMIN / TOHFA_ADMIN only). The
 *     old static "Bank Refund Example" card is removed.
 *   - A Sub scope only processes RMAs of its own warehouse; the server must
 *     apply that filter (UI scope lock is not enough).
 *
 * Absorbs MainWarehouseRefundStatusScreen (pair M10-S05): its note that the
 * return-window eligibility is decided by the backend is rendered for the
 * Main view. Its confirm sheet matched the Sub confirm card.
 */
// Design id: M10-S05
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  InfoCard,
  inScope,
  isAllWarehouses,
  PermissionNote,
  ReturnsButton,
  ReturnsScreen,
  SectionTitle,
} from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface RefundStatusScreenProps extends RmaScreenBaseProps {
  refundAmount: string;
  onConfirmSuccess: (data: { rma: RmaRecord; refundAmount: string }) => void;
}

const REFUND_METHOD = 'TOHFA Wallet';
const REFUND_STATUS = 'Pending';

function WalletCardIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M16 12h4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="16" cy="12" r="1" fill={adminColors.onBrand} />
    </Svg>
  );
}

function ShieldCheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={adminColors.brandDeep}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 12l2 2 4-4" stroke={adminColors.brandDeep} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

export function RefundStatusScreen({ scope, can, rma, refundAmount, onBack, onConfirmSuccess }: RefundStatusScreenProps) {
  const [showConfirmRefund, setShowConfirmRefund] = useState(false);
  const canWalletRefund = can('rma.refund.wallet_process') && inScope(scope, rma.warehouseId);
  const cleanAmount = refundAmount.replace('.00', '');

  return (
    <ReturnsScreen title="Refund Status" subtitle={rma.rmaId} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                    { label: 'Customer', value: rma.customerName },
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
                label="Confirm Refund"
                icon={<CheckmarkIcon />}
                onPress={() => onConfirmSuccess({ rma, refundAmount })}
              />
              <ReturnsButton variant="neutralOutline" label="Cancel" onPress={() => setShowConfirmRefund(false)} />
            </View>
          </View>
        ) : (
          <>
            <SectionTitle>Refund Summary</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Customer', value: rma.customerName },
                  { label: 'Order', value: rma.orderId },
                ],
                [
                  { label: 'RMA', value: rma.rmaId },
                  { label: 'Refund Status', value: REFUND_STATUS },
                ],
              ]}
            />

            <SectionTitle>Refund Amount</SectionTitle>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Refund Amount</Text>
              <Text style={styles.amountValue}>{refundAmount}</Text>
            </View>

            <SectionTitle>Refund Method</SectionTitle>
            <InfoCard rows={[[{ label: 'Method', value: REFUND_METHOD }]]} />

            {isAllWarehouses(scope) ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Return-window eligibility is always determined by the backend — never a hard-coded rule in this UI.
                </Text>
              </View>
            ) : null}

            <SectionTitle>Wallet Refund</SectionTitle>
            {canWalletRefund ? (
              <View style={styles.walletActions}>
                <ReturnsButton
                  label="Process Wallet Refund"
                  icon={<WalletCardIcon />}
                  onPress={() => setShowConfirmRefund(true)}
                />
                <View style={styles.permissionBox}>
                  <ShieldCheckIcon />
                  <Text style={styles.permissionText}>
                    Available because you hold the wallet-refund permission and the RMA is approved and eligible for
                    refund.
                  </Text>
                </View>
              </View>
            ) : (
              <PermissionNote>Processing a wallet refund needs the wallet-refund permission.</PermissionNote>
            )}

            <Text style={styles.noBankNotice}>
              Bank refunds are handled by an authorized finance/admin role and cannot be processed from the warehouse
              app.
            </Text>
          </>
        )}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xxl },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  amountValue: { ...adminType.kpiValue, color: adminColors.ink },
  infoBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  infoText: { ...adminType.rowMeta, color: adminColors.brandDeep },
  walletActions: { gap: adminSpacing.sm },
  permissionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: adminColors.brandSoft.bg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  permissionText: { ...adminType.rowMeta, color: adminColors.brandDeep, flex: 1 },
  noBankNotice: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.md },

  confirmCard: {
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  confirmHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  confirmTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
  confirmInnerBox: { marginBottom: adminSpacing.md },
  confirmDisclaimer: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.lg },
  confirmActions: { gap: adminSpacing.sm },
});
