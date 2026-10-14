// Design id: M8-S06S
/**
 * Top-Up Successful: result screen of the cash top-up wizard, opened by the
 * flow only after the server answered 201 (no permission gate needed; the
 * route is unreachable without the confirm step's codes).
 *
 * Live (plan phase 9, BR-18): everything shown is the server's ledger row
 * (mappers.toTopUpReceipt): the amount, the new balance, the transaction id,
 * the fiscal tag and the time. Nothing comes from the draft or a sample. The
 * old "Customer notification sent" line is gone: the 201 does not say whether
 * the SMS went out.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { WalletTransactionRecord, WarehouseScreenBaseProps } from './types';
import {
  EmptyState,
  InfoCard,
  ReceiptIcon,
  SuccessCircleIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
  type InfoField,
} from './WalletParts';

export interface TopUpSuccessScreenProps extends WarehouseScreenBaseProps {
  /** The server's ledger row for the top-up; undefined when the route was opened without one. */
  transaction?: WalletTransactionRecord | undefined;
  onDone: () => void;
  onViewTransaction: (transaction: WalletTransactionRecord) => void;
}

/** Present fields only, two per row. */
function receiptRows(record: WalletTransactionRecord): InfoField[][] {
  const fields: InfoField[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value !== undefined && value !== '') fields.push({ label, value });
  };
  add(t('wallet.topup.success.balance'), record.newBalance);
  add(t('wallet.topup.success.transactionId'), record.transactionId);
  add(t('wallet.topup.customer'), record.customerName);
  add(t('wallet.topup.fiscal.title'), record.fiscalCashTag);
  add(t('wallet.topup.warehouse'), record.warehouseName);
  add(t('wallet.topup.success.dateTime'), record.dateTime);
  const rows: InfoField[][] = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2));
  return rows;
}

export function TopUpSuccessScreen({ onBack, transaction, onDone, onViewTransaction }: TopUpSuccessScreenProps) {
  if (transaction === undefined) {
    return (
      <WalletScreen title={t('wallet.topup.success.title')} onBack={onBack}>
        <EmptyState title={t('wallet.topup.startAgain')} />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title={t('wallet.topup.success.title')}
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label={t('wallet.topup.success.view')} icon={<ReceiptIcon />} onPress={() => onViewTransaction(transaction)} />
          <WalletButton label={t('wallet.topup.success.done')} variant="outline" onPress={onDone} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <SuccessCircleIcon />
          </View>
          <Text style={styles.heroTitle}>{t('wallet.topup.success.title')}</Text>
          {transaction.amount === undefined ? null : <Text style={styles.heroAmount}>{transaction.amount}</Text>}
        </View>

        <InfoCard rows={receiptRows(transaction)} />
      </ScrollView>
    </WalletScreen>
  );
}

const HERO_ICON = 72;

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: adminSpacing.xl },
  heroIcon: {
    width: HERO_ICON,
    height: HERO_ICON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { ...adminType.title, color: adminColors.ink, marginTop: adminSpacing.md },
  heroAmount: { ...adminType.kpiValue, color: adminColors.brandDeep, marginTop: adminSpacing.xs },
});
