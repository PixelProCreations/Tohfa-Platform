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
import { SAMPLE_DATE, SAMPLE_FISCAL_TAG, SAMPLE_TIME, SAMPLE_WALLET_CUSTOMER, sampleProcessedBy } from './fixtures';
import type { CashTopUpDraft, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  Card,
  CheckIcon,
  InfoCard,
  InfoIcon,
  InfoNote,
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
  /** The server confirmed the top-up (mock: after a short delay). */
  onConfirmed: (draft: CashTopUpDraft) => void;
}

/** Mock round-trip until the top-up API is wired. */
const MOCK_SUBMIT_MS = 500;

export function ConfirmCashTopUpScreen({ scope, can, onBack, draft = {}, onConfirmed }: ConfirmCashTopUpScreenProps) {
  const customerName = draft.customerName ?? SAMPLE_WALLET_CUSTOMER.name;
  const customerCode = draft.customerCode ?? SAMPLE_WALLET_CUSTOMER.id;
  const [currentBalance, setCurrentBalance] = useState<number>(draft.currentBalance ?? 4500);
  const topUpAmount = draft.topUpAmount ?? 2000;
  const warehouseName = draft.warehouseName ?? scope.warehouseName ?? '';
  const processedBy = draft.processedBy ?? sampleProcessedBy(scope);
  const fiscalCashTag = draft.fiscalCashTag ?? SAMPLE_FISCAL_TAG;
  const dateStr = draft.dateStr ?? SAMPLE_DATE;
  const timeStr = draft.timeStr ?? SAMPLE_TIME;

  const [askFinalConfirm, setAskFinalConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const submitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (submitTimer.current !== null) clearTimeout(submitTimer.current);
    },
    [],
  );

  const canConfirm = can('wallet.cash_topup.process') && can('wallet.cash_topup.fiscal_tag');
  const newBalance = currentBalance + topUpAmount;

  const handleSimulateBalanceChanged = () => {
    const updated = 5200;
    setCurrentBalance(updated);
    setDemoNotice('Wallet balance changed to ₹5,200 by concurrent order! Preview updated.');
    Alert.alert(
      'Demo: Mid-flow Balance Update',
      `Another terminal updated customer wallet to ₹5,200.00.\n\nNew Balance recalculated to ${formatRupees(updated + topUpAmount, true)}.`,
    );
  };

  const handleSimulateFailedTopUp = () => {
    Alert.alert(
      'Demo: Top-Up Failed (Simulated)',
      'Transaction rejected by banking switch (ERR_AUTH_REJECTED).\n\nCash tag tagged for manual reconciliation.',
      [{ text: 'Dismiss' }],
    );
  };

  const handleConfirmTopUp = () => {
    if (!canConfirm || isSubmitting) return;
    setAskFinalConfirm(false);
    setIsSubmitting(true);
    // Real call: POST the draft with an Idempotency-Key (see the file header).
    submitTimer.current = setTimeout(() => {
      setIsSubmitting(false);
      onConfirmed({
        customerName,
        customerCode,
        currentBalance,
        topUpAmount,
        warehouseId: draft.warehouseId ?? scope.warehouseId,
        warehouseName,
        processedBy,
        channel: 'Cash',
        fiscalCashTag,
        dateStr,
        timeStr,
      });
    }, MOCK_SUBMIT_MS);
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
              {formatRupees(topUpAmount)} will be credited to {customerName}'s wallet.
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
          <AmountRow label="Current Balance" value={formatRupees(currentBalance, true)} />
          <AmountRow divider label="Top-Up Amount" value={formatRupees(topUpAmount, true)} emphasis="credit" />
          <AmountRow divider label="New Balance" value={formatRupees(newBalance, true)} emphasis="total" />
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

        <InfoNote tone="warning" icon={<InfoIcon color={adminColors.warning.text} />}>
          {formatRupees(topUpAmount)} cash will be credited to the customer's wallet. This action cannot be completed
          without server confirmation.
        </InfoNote>
        <InfoNote tone="info">
          Success is never shown before the server confirms the transaction — the balance is never simulated by editing
          the display.
        </InfoNote>

        <TouchableOpacity style={styles.demoButton} onPress={handleSimulateBalanceChanged} activeOpacity={0.75}>
          <Text style={styles.demoButtonText}>Simulate wallet changed mid-flow (demo)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.demoButton} onPress={handleSimulateFailedTopUp} activeOpacity={0.75}>
          <Text style={styles.demoButtonText}>Simulate failed top-up (demo)</Text>
        </TouchableOpacity>
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
  demoButton: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    marginTop: adminSpacing.md,
  },
  demoButtonText: { ...adminType.rowTitle, color: adminColors.brandDeep },
});
