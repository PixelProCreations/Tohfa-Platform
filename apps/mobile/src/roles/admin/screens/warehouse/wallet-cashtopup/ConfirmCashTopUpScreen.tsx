// Design id: M8-S06
/**
 * Confirm Cash Top-Up: step 3 of the cash top-up wizard. Shows the draft and
 * submits it; Top-Up Successful (TopUpSuccessScreen) is a separate route the
 * flow opens only after the server confirmed.
 *
 * Live (plan phase 9): Confirm calls `onConfirm`, which the flow turns into
 * POST /admin/wallets/{id}/cash-topup with an Idempotency-Key held by the
 * flow (useWalletData.useCashTopupSubmit): a retry of the same draft reuses
 * the key, an edited draft gets a new one (root CLAUDE.md 2.4). This screen
 * draws the pending state and the failure the flow maps (cashTopupErrorKey).
 * When the outcome is unknown (a timeout, or the server's 409 on a replay) it
 * offers "Check Wallet Balance" next to the retry, because the money may
 * already have moved.
 *
 * Gate: Confirm only when can('wallet.cash_topup.process') AND
 * can('wallet.cash_topup.fiscal_tag') (BR-18: no top-up completes without the
 * fiscal tag). The server enforces both codes again (CLAUDE.md 2.1).
 */
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { t, type TranslationKey } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { CashTopUpDraft, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  Card,
  CheckIcon,
  InfoCard,
  InfoNote,
  PermissionNote,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from './WalletParts';

export interface ConfirmCashTopUpScreenProps extends WarehouseScreenBaseProps {
  /** The full draft, with its fiscal cash tag. */
  draft: CashTopUpDraft & { fiscalCashTag: string };
  /** Send the top-up (the flow holds the key and the request). */
  onConfirm: () => void;
  isSubmitting: boolean;
  /** The last failure's message key; null when there is none. */
  errorKey: TranslationKey | null;
  /** The failure may still have credited the wallet: offer a balance check. */
  outcomeUnknown: boolean;
  /** Open the customer's live wallet (shown with an unknown outcome). */
  onCheckWallet?: (() => void) | undefined;
}

export function ConfirmCashTopUpScreen({
  can,
  onBack,
  draft,
  onConfirm,
  isSubmitting,
  errorKey,
  outcomeUnknown,
  onCheckWallet,
}: ConfirmCashTopUpScreenProps) {
  const [askFinalConfirm, setAskFinalConfirm] = useState(false);
  const canConfirm = can('wallet.cash_topup.process') && can('wallet.cash_topup.fiscal_tag');
  const noValue = t('customers.noValue');
  const newBalance = draft.currentBalancePaise === null ? null : draft.currentBalancePaise + draft.amountPaise;
  const amountLabel = formatPaise(draft.amountPaise);

  const handleConfirmTopUp = () => {
    if (!canConfirm || isSubmitting) return;
    setAskFinalConfirm(false);
    onConfirm();
  };

  return (
    <WalletScreen
      title={t('wallet.topup.confirm.title')}
      onBack={onBack}
      footer={
        <WalletFooter>
          {canConfirm ? (
            <WalletButton
              label={isSubmitting ? t('wallet.topup.confirm.sending') : errorKey === null ? t('wallet.topup.confirm.button') : t('wallet.topup.confirm.retry')}
              icon={isSubmitting ? <ActivityIndicator size="small" color={adminColors.onBrand} /> : <CheckIcon />}
              onPress={() => setAskFinalConfirm(true)}
              disabled={isSubmitting || askFinalConfirm}
            />
          ) : (
            <PermissionNote>{t('wallet.topup.confirm.permission')}</PermissionNote>
          )}
          {outcomeUnknown && onCheckWallet !== undefined ? (
            <WalletButton label={t('wallet.topup.confirm.checkWallet')} variant="outline" onPress={onCheckWallet} disabled={isSubmitting} />
          ) : null}
          <WalletButton label={t('wallet.topup.confirm.back')} variant="outline" onPress={onBack} disabled={isSubmitting} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {errorKey !== null && !isSubmitting ? (
          <View style={styles.errorPanel}>
            <InfoNote tone={outcomeUnknown ? 'warning' : 'danger'}>{t(errorKey)}</InfoNote>
          </View>
        ) : null}

        {askFinalConfirm && canConfirm ? (
          // Former MainWarehouseFinalConfirmScreen, inline.
          <View style={styles.finalConfirm}>
            <Text style={styles.finalConfirmTitle}>{t('wallet.topup.confirm.question')}</Text>
            <Text style={styles.finalConfirmText}>{t('wallet.topup.confirm.body', { amount: amountLabel, name: draft.customer.name })}</Text>
            <View style={styles.finalConfirmActions}>
              <WalletButton label={t('wallet.topup.confirm.cancel')} variant="neutral" flex onPress={() => setAskFinalConfirm(false)} />
              <WalletButton label={t('wallet.topup.confirm.button')} flex onPress={handleConfirmTopUp} />
            </View>
          </View>
        ) : null}

        <SectionTitle>{t('wallet.topup.customer')}</SectionTitle>
        <InfoCard rows={[[{ label: draft.customer.name, value: `${draft.customer.code} · ${draft.customer.mobileMasked}` }]]} />

        <SectionTitle>{t('wallet.topup.confirm.wallet')}</SectionTitle>
        <Card>
          <AmountRow label={t('wallet.topup.previewCurrent')} value={draft.currentBalancePaise === null ? noValue : formatPaise(draft.currentBalancePaise)} />
          <AmountRow divider label={t('wallet.topup.amount')} value={amountLabel} emphasis="credit" />
          <AmountRow divider label={t('wallet.topup.previewNew')} value={newBalance === null ? noValue : formatPaise(newBalance)} emphasis="total" />
        </Card>

        <SectionTitle>{t('wallet.topup.confirm.cashInfo')}</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: t('wallet.topup.confirm.paymentMethod'), value: t('wallet.topup.channelCash') },
              { label: t('wallet.topup.fiscal.title'), value: draft.fiscalCashTag },
            ],
            [{ label: t('wallet.topup.warehouse'), value: draft.warehouseName }],
          ]}
        />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  errorPanel: { marginTop: adminSpacing.sm },
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
