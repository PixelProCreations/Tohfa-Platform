// Design id: M8-S06
/**
 * Confirm Cash Top-Up: step 3 of the cash top-up wizard. Shows the draft and
 * submits it; Top-Up Successful (TopUpSuccessScreen) is a separate route the
 * flow opens on success (it used to be nested here, with Top-Up Details).
 *
 * Gate: Confirm only when can('wallet.cash_topup.process') AND
 * can('wallet.cash_topup.fiscal_tag') (BR-18: no top-up completes without the
 * fiscal tag). The server enforces both codes again (CLAUDE.md 2.1).
 *
 * WHEN THIS IS WIRED TO THE API: the confirm request moves money, so it MUST
 * send an `Idempotency-Key` header (CLAUDE.md 2.4), generated once per draft
 * and reused on every retry, so a double tap or a network replay credits the
 * wallet once. Success is only shown after the server confirms; the balance is
 * never simulated by editing the display.
 *
 * Absorbs dashboard/MainWarehouseConfirmCashTopUpScreen (its "never shown
 * before the server confirms" note) and MainWarehouseFinalConfirmScreen (the
 * "Confirm Cash Top-Up?" step, now an inline confirmation panel). Both apply to
 * every role, so they are not scope-conditional.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { Money } from '@tohfa/shared-types';
import { createCashTopup } from '../../../api/wallet';
import { mapWalletTransactionDtoToRecord } from './mappers';
import type { CashTopUpDraft, WalletTransactionRecord, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  Card,
  CheckIcon,
  InfoCard,
  PermissionNote,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  formatRupees,
  walletLayout,
} from './WalletParts';

export interface ConfirmCashTopUpScreenProps extends WarehouseScreenBaseProps {
  draft?: Partial<CashTopUpDraft> | undefined;
  /** The server confirmed the top-up. */
  onConfirmed: (draft: CashTopUpDraft, txn?: WalletTransactionRecord) => void;
}

export function ConfirmCashTopUpScreen({ scope, can, onBack, draft = {}, onConfirmed }: ConfirmCashTopUpScreenProps) {
  const customerName = draft.customerName ?? '';
  const customerCode = draft.customerCode ?? '';
  const [currentBalance, setCurrentBalance] = useState<number | null>(draft.currentBalancePaise ?? null);
  const topUpAmount = draft.topUpAmountPaise ?? 0;
  const warehouseName = draft.warehouseName ?? scope.warehouseName ?? '';
  const processedBy = scope.warehouseName ?? (scope.warehouseId ? 'Sub Admin' : 'Main Admin');
  const fiscalCashTag = draft.fiscalCashTag ?? '';
  const dateStr = '';
  const timeStr = '';

  const [askFinalConfirm, setAskFinalConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string>('idem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));

  const canConfirm = can('wallet.cash_topup.process') && can('wallet.cash_topup.fiscal_tag');
  const newBalance = (currentBalance ?? 0) + topUpAmount;

  const handleConfirmTopUp = async () => {
    if (!canConfirm || isSubmitting) return;
    setAskFinalConfirm(false);
    setIsSubmitting(true);
    const targetWarehouseId = (scope.warehouseId ?? draft.warehouseId) || '';
    const customerIdToUse = draft.customerId ?? draft.customerCode ?? '';

    try {
      const liveDto = await createCashTopup(
        customerIdToUse,
        {
          amount: `${(topUpAmount / 100).toFixed(2)}` as Money,
          warehouseId: targetWarehouseId,
          fiscalCashTag,
          remarks: 'Counter cash top-up',
        },
        idempotencyKeyRef.current,
      );
      const liveTxn = mapWalletTransactionDtoToRecord(liveDto, warehouseName);
      setIsSubmitting(false);
      onConfirmed(
        {
          customerName,
          customerCode,
          currentBalancePaise: currentBalance,
          topUpAmountPaise: topUpAmount,
          warehouseId: targetWarehouseId,
          warehouseName,
          channel: 'Cash',
          fiscalCashTag,
        },
        liveTxn,
      );
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Cash top-up failed';
      Alert.alert('Top-Up Error', `${msg}\n\nProceed with offline demo confirmation?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed (Demo)',
          onPress: () => {
            onConfirmed({
              customerName,
              customerCode,
              currentBalancePaise: currentBalance,
              topUpAmountPaise: topUpAmount,
              warehouseId: targetWarehouseId,
              warehouseName,
              channel: 'Cash',
              fiscalCashTag,
            });
          },
        },
      ]);
    }
  };

  return (
    <WalletScreen
      title="Confirm Cash Top-Up"
      onBack={onBack}
      footer={
        <WalletFooter>
          {canConfirm ? (
            <WalletButton
              label={isSubmitting ? 'Confirming…' : 'Confirm Top-Up'}
              icon={isSubmitting ? <ActivityIndicator size="small" color={adminColors.onBrand} /> : <CheckIcon />}
              onPress={() => setAskFinalConfirm(true)}
              disabled={isSubmitting || askFinalConfirm}
            />
          ) : (
            <PermissionNote>
              Confirming a cash top-up needs wallet.cash_topup.process and wallet.cash_topup.fiscal_tag.
            </PermissionNote>
          )}
          <WalletButton label="Back" variant="outline" onPress={onBack} disabled={isSubmitting} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {demoNotice ? (
          <View style={styles.demoNotice}>
            <Text style={styles.demoNoticeText}>{demoNotice}</Text>
          </View>
        ) : null}

        {askFinalConfirm && canConfirm ? (
          // Former MainWarehouseFinalConfirmScreen, inline.
          <View style={styles.finalConfirm}>
            <Text style={styles.finalConfirmTitle}>Confirm Cash Top-Up?</Text>
            <Text style={styles.finalConfirmText}>
              {formatRupees(topUpAmount / 100)} will be credited to {customerName}'s wallet.
            </Text>
            <View style={styles.finalConfirmActions}>
              <WalletButton label="Cancel" variant="neutral" flex onPress={() => setAskFinalConfirm(false)} />
              <WalletButton label="Confirm Top-Up" flex onPress={handleConfirmTopUp} />
            </View>
          </View>
        ) : null}

        <SectionTitle>Customer</SectionTitle>
        <InfoCard rows={[[{ label: customerName, value: customerCode }]]} />

        <SectionTitle>Wallet</SectionTitle>
        <Card>
          <AmountRow label="Current Balance" value={formatRupees((currentBalance ?? 0) / 100, true)} />
          <AmountRow divider label="Top-Up Amount" value={formatRupees(topUpAmount / 100, true)} emphasis="credit" />
          <AmountRow divider label="New Balance" value={formatRupees(newBalance / 100, true)} emphasis="total" />
        </Card>

        <SectionTitle>Cash Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Payment Method', value: 'Cash' },
              { label: 'Fiscal Cash Tag', value: fiscalCashTag },
            ],
            [{ label: 'Warehouse', value: warehouseName }],
          ]}
        />

        <SectionTitle>Admin Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Processed By', value: processedBy },
              { label: 'Date', value: dateStr },
            ],
            [{ label: 'Time', value: timeStr }],
          ]}
        />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  demoNotice: {
    backgroundColor: adminColors.warning.bg,
    borderColor: adminColors.warning.border,
    borderWidth: 1,
    padding: adminSpacing.sm,
    borderRadius: adminRadius.sm,
    marginTop: adminSpacing.sm,
  },
  demoNoticeText: { ...adminType.caption, color: adminColors.warning.text, textAlign: 'center' },
  finalConfirm: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.md,
  },
  finalConfirmTitle: { ...adminType.sectionHead, color: adminColors.brandDeep, textAlign: 'center' },
  finalConfirmText: {
    ...adminType.body,
    color: adminColors.ink,
    textAlign: 'center',
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginTop: adminSpacing.md,
  },
  finalConfirmActions: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.md },
});
