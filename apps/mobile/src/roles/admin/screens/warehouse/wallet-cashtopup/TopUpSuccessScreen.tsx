// Design id: M8-S06S
/**
 * Top-Up Successful: result screen of the cash top-up wizard, opened by the
 * flow only after the server confirmed the top-up (no permission gate needed;
 * the route is unreachable without the confirm step's codes).
 *
 * Absorbs dashboard/MainWarehouseTopUpSuccessfulScreen (its "never shown
 * before the server confirms" note is kept for both roles).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { SAMPLE_DATE, SAMPLE_FISCAL_TAG, SAMPLE_TIME, SAMPLE_TRANSACTION_ID, SAMPLE_WALLET_CUSTOMER } from './fixtures';
import type { WalletTransactionRecord, WarehouseScreenBaseProps } from './types';
import {
  BellRingIcon,
  InfoCard,
  InfoNote,
  ReceiptIcon,
  SuccessCircleIcon,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from './WalletParts';

export interface TopUpSuccessScreenProps extends WarehouseScreenBaseProps {
  /** The confirmed top-up (demo values fill the gaps). */
  transaction?: WalletTransactionRecord | undefined;
  onDone: () => void;
  onViewTransaction: (transaction: WalletTransactionRecord) => void;
}

export function TopUpSuccessScreen({ scope, onBack, transaction = {}, onDone, onViewTransaction }: TopUpSuccessScreenProps) {
  const record: WalletTransactionRecord = {
    ...transaction,
    type: transaction.type ?? 'Cash Top-Up',
    status: transaction.status ?? 'Completed',
    newBalance: transaction.newBalance ?? '₹6,500.00',
    amount: transaction.amount ?? '₹2,000.00',
    transactionId: transaction.transactionId ?? SAMPLE_TRANSACTION_ID,
    customerName: transaction.customerName ?? SAMPLE_WALLET_CUSTOMER.name,
    fiscalCashTag: transaction.fiscalCashTag ?? SAMPLE_FISCAL_TAG,
    warehouseName: transaction.warehouseName ?? scope.warehouseName ?? '',
    dateTime: transaction.dateTime ?? `${SAMPLE_DATE}, ${SAMPLE_TIME}`,
  };

  return (
    <WalletScreen
      title="Top-Up Successful"
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label="View Transaction" icon={<ReceiptIcon />} onPress={() => onViewTransaction(record)} />
          <WalletButton label="Done" variant="outline" onPress={onDone} />
        </WalletFooter>
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <SuccessCircleIcon />
          </View>
          <Text style={styles.heroTitle}>Top-Up Successful</Text>
          <Text style={styles.heroAmount}>{record.amount}</Text>
        </View>

        <InfoCard
          rows={[
            [
              { label: 'Wallet Balance', value: record.newBalance ?? '' },
              { label: 'Transaction ID', value: record.transactionId ?? '' },
            ],
            [
              { label: 'Customer', value: record.customerName ?? '' },
              { label: 'Fiscal Cash Tag', value: record.fiscalCashTag ?? '' },
            ],
            [
              { label: 'Warehouse', value: record.warehouseName ?? '' },
              { label: 'Date & Time', value: record.dateTime ?? '' },
            ],
          ]}
        />

        <View style={styles.notificationRow}>
          <BellRingIcon />
          <Text style={styles.notificationText}>Customer notification sent</Text>
        </View>

        <InfoNote tone="info">
          Success is never shown before the server confirms the transaction — the balance is never simulated by editing
          the display.
        </InfoNote>
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
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
  },
  notificationText: { ...adminType.rowTitle, color: adminColors.ink },
});
