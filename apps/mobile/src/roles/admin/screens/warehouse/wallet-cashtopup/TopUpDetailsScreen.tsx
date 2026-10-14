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

import { t } from '../../../i18n';
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
import { EmptyState, InfoCard, SectionTitle, WalletScreen, inScope, walletLayout, type InfoField } from './WalletParts';

export type TopUpDetailsVariant = 'topUp' | 'transaction';

export interface TopUpDetailsScreenProps extends WarehouseScreenBaseProps {
  transaction?: WalletTransactionRecord | undefined;
  variant?: TopUpDetailsVariant | undefined;
  /**
   * A live ledger row (GET /admin/customers/{id}/wallet/transactions, plan
   * phase 6): only the fields the server sent are shown, never a sample, and
   * no warehouse filter applies (the server already scoped the customer).
   */
  live?: boolean | undefined;
}

/** The 'transaction' rows of a live ledger row: present fields only, two per row. */
function liveTransactionRows(transaction: WalletTransactionRecord, warehouseName: string | undefined): InfoField[][] {
  const fields: InfoField[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value !== undefined && value !== '') fields.push({ label, value });
  };
  add(t('customers.wallet.detail.id'), transaction.transactionId);
  add(t('customers.wallet.detail.type'), transaction.type);
  add(t('customers.wallet.detail.amount'), transaction.amount);
  add(t('customers.wallet.detail.previousBalance'), transaction.previousBalance);
  add(t('customers.wallet.detail.newBalance'), transaction.newBalance);
  add(t('customers.wallet.detail.dateTime'), transaction.dateTime);
  add(t('customers.wallet.detail.warehouse'), warehouseName);
  add(t('customers.wallet.detail.reference'), transaction.referenceId);
  const rows: InfoField[][] = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2));
  return rows;
}

export function TopUpDetailsScreen({ scope, onBack, transaction = {}, variant = 'topUp', live = false }: TopUpDetailsScreenProps) {
  const title = variant === 'topUp' ? 'Top-Up Details' : 'Transaction Detail';

  if (live) {
    // Only this warehouse's name is known here; another warehouse's row shows no name, not a code.
    const warehouseName =
      transaction.warehouseId !== undefined && transaction.warehouseId === scope.warehouseId ? scope.warehouseName : undefined;
    return (
      <WalletScreen title={t('customers.wallet.detail.title')} onBack={onBack}>
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <InfoCard rows={liveTransactionRows(transaction, warehouseName)} />
        </ScrollView>
      </WalletScreen>
    );
  }

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
