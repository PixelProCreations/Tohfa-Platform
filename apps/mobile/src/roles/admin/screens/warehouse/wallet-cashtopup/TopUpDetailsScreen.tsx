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

import {
  SAMPLE_DATE,
  SAMPLE_FISCAL_TAG,
  SAMPLE_TIME,
  SAMPLE_TRANSACTION_ID,
  SAMPLE_WALLET_CUSTOMER,
  sampleProcessedBy,
  warehouseNameOf,
} from './fixtures';
import type { WalletTransactionRecord, WarehouseScreenBaseProps } from './types';
import { EmptyState, InfoCard, SectionTitle, WalletScreen, inScope, walletLayout } from './WalletParts';

export type TopUpDetailsVariant = 'topUp' | 'transaction';

export interface TopUpDetailsScreenProps extends WarehouseScreenBaseProps {
  transaction?: WalletTransactionRecord | undefined;
  variant?: TopUpDetailsVariant | undefined;
}

export function TopUpDetailsScreen({ scope, onBack, transaction = {}, variant = 'topUp' }: TopUpDetailsScreenProps) {
  const title = variant === 'topUp' ? 'Top-Up Details' : 'Transaction Detail';

  if (!inScope(scope, transaction.warehouseId)) {
    return (
      <WalletScreen title={title} onBack={onBack}>
        <EmptyState title="Transaction not found" subtitle="No transaction with this reference in your warehouse." />
      </WalletScreen>
    );
  }

  const dateTime = transaction.dateTime ?? `${SAMPLE_DATE}, ${SAMPLE_TIME}`;
  const warehouse =
    transaction.warehouseName ?? (transaction.warehouseId ? warehouseNameOf(transaction.warehouseId) : scope.warehouseName ?? '');
  const processedBy = transaction.processedBy ?? sampleProcessedBy(scope);
  const transactionId = transaction.transactionId ?? SAMPLE_TRANSACTION_ID;
  const type = transaction.type ?? 'Cash Top-Up';
  const status = transaction.status ?? 'Completed';
  const amount = transaction.amount ?? '₹2,000';
  const previousBalance = transaction.previousBalance ?? '₹2,500';
  const newBalance = transaction.newBalance ?? '₹4,500';

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
              [{ label: 'Reference ID', value: transaction.referenceId ?? transaction.fiscalCashTag ?? SAMPLE_FISCAL_TAG }],
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
              { label: 'Name', value: transaction.customerName ?? SAMPLE_WALLET_CUSTOMER.name },
              { label: 'Customer ID', value: transaction.customerId ?? SAMPLE_WALLET_CUSTOMER.id },
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
              { label: 'Fiscal Cash Tag', value: transaction.fiscalCashTag ?? SAMPLE_FISCAL_TAG },
            ],
            [{ label: 'Date/Time', value: dateTime }],
          ]}
        />

        <SectionTitle>Audit Information</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Created By', value: processedBy },
              { label: 'Created At', value: transaction.createdAt ?? dateTime },
            ],
            [{ label: 'Warehouse', value: warehouse }],
          ]}
        />
      </ScrollView>
    </WalletScreen>
  );
}
