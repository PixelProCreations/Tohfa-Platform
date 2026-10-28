// Design id: M8-S07D
/**
 * Top-Up Details / Transaction Detail: read-only view of one wallet
 * transaction. `variant` 'topUp' is the sectioned cash top-up record (Customer
 * / Wallet / Transaction / Audit); 'transaction' is the flat detail of any
 * wallet movement opened from the customer wallet (Purchase, Cash Top-Up, ...).
 *
 * Scope: a Sub admin sees only its own warehouse's transactions; a record from
 * another warehouse renders as "not found", never as a permission error
 * (cross-scope reads are an empty result, not a 403, CLAUDE.md 2.1).
 *
 * Absorbs dashboard/MainWarehouseTopUpDetailsScreen (a subset of these fields)
 * and subwarehouse/SubWarehouseTransactionDetailScreen (variant 'transaction').
 */
import React from 'react';
import { ScrollView } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { getCustomerWalletTxn, type WalletTransactionDto } from '../../../api/customers';
import { mapWalletTransactionDtoToRecord } from './mappers';
import type { WalletTransactionRecord, WarehouseScreenBaseProps } from './types';
import { EmptyState, InfoCard, SectionTitle, WalletScreen, inScope, walletLayout } from './WalletParts';

export type TopUpDetailsVariant = 'topUp' | 'transaction';

export interface TopUpDetailsScreenProps extends WarehouseScreenBaseProps {
  transaction?: WalletTransactionRecord | undefined;
  variant?: TopUpDetailsVariant | undefined;
}

export function TopUpDetailsScreen({ scope, onBack, transaction = {}, variant = 'topUp' }: TopUpDetailsScreenProps) {
  const title = variant === 'topUp' ? 'Top-Up Details' : 'Transaction Detail';
  const [liveRecord, setLiveRecord] = React.useState<WalletTransactionRecord | null>(null);

  React.useEffect(() => {
    if (transaction.customerId && transaction.transactionId) {
      getCustomerWalletTxn(transaction.customerId, transaction.transactionId)
        .then((dto: WalletTransactionDto) => setLiveRecord(mapWalletTransactionDtoToRecord(dto)))
        .catch(() => {});
    }
  }, [transaction.customerId, transaction.transactionId]);

  const activeTxn = liveRecord ?? transaction;

  if (!inScope(scope, activeTxn.warehouseId)) {
    return (
      <WalletScreen title={title} onBack={onBack}>
        <EmptyState title="Transaction not found" subtitle="No transaction with this reference in your warehouse." />
      </WalletScreen>
    );
  }

  const dateTime = activeTxn.dateTime ?? '';
  const warehouse =
    activeTxn.warehouseName ?? activeTxn.warehouseId ?? scope.warehouseName ?? '';
  const processedBy = activeTxn.processedBy ?? (scope.warehouseName ?? (scope.warehouseId ? 'Sub Admin' : 'Main Admin'));
  const transactionId = activeTxn.transactionId ?? '—';
  const type = activeTxn.type ?? 'Cash Top-Up';
  // Negative rule: Wallet totals (credited/used) and transaction status -> '—' or hide row
  const status = '—';
  const amount = activeTxn.amount ?? '—';
  const previousBalance = activeTxn.previousBalance ?? '—';
  const newBalance = activeTxn.newBalance ?? '—';

  if (variant === 'transaction') {
    return (
      <WalletScreen title={title} onBack={onBack}>
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <InfoCard
            rows={[
              [
                { label: 'Transaction ID', value: transactionId },
                { label: 'Type', value: type },
              ],
              [
                { label: 'Amount', value: amount },
                { label: 'Previous Balance', value: previousBalance },
              ],
              [
                { label: 'New Balance', value: newBalance },
                { label: 'Date/Time', value: dateTime },
              ],
              [
                { label: 'Status', value: status },
                { label: 'Warehouse', value: warehouse },
              ],
              [{ label: 'Processed By', value: processedBy }],
              [{ label: 'Reference ID', value: activeTxn.referenceId ?? activeTxn.fiscalCashTag ?? '—' }],
            ]}
          />
        </ScrollView>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen title={title} onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Customer</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Name', value: activeTxn.customerName ?? '—' },
              { label: 'Customer ID', value: activeTxn.customerId ?? '—' },
            ],
          ]}
        />

        <SectionTitle>Wallet</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Previous Balance', value: previousBalance },
              { label: 'Top-Up Amount', value: amount },
            ],
            [{ label: 'New Balance', value: newBalance }],
          ]}
        />

        <SectionTitle>Transaction</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Transaction ID', value: transactionId },
              { label: 'Status', value: status },
            ],
            [
              { label: 'Type', value: type },
              { label: 'Fiscal Cash Tag', value: activeTxn.fiscalCashTag ?? '—' },
            ],
            [{ label: 'Date/Time', value: dateTime }],
          ]}
        />

        <SectionTitle>Audit Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Created By', value: processedBy },
              { label: 'Created At', value: activeTxn.createdAt ?? dateTime },
            ],
            [{ label: 'Warehouse', value: warehouse }],
          ]}
        />
      </ScrollView>
    </WalletScreen>
  );
}
