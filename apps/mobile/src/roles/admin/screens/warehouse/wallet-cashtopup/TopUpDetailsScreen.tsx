// Design id: M8-S07D
/**
 * Transaction Detail: read-only view of one wallet ledger row, opened from the
 * live Customer Wallet (GET /admin/customers/{id}/wallet/transactions) or
 * from Top-Up Successful (the POST /admin/wallets/{id}/cash-topup 201 row,
 * mappers.toTopUpReceipt). Only the fields the server sent are shown, never a
 * sample: a field the row does not carry is left out.
 *
 * The old 'topUp' variant (the sectioned cash top-up record opened from Top-Up
 * History, with Processed By / Status / Audit filled from samples) is gone with
 * Top-Up History: no endpoint lists top-up rows or returns who processed one.
 *
 * Scope: no warehouse filter applies here; the server already scoped the
 * customer and its ledger (BR-91, BR-93). The warehouse is named only when the
 * row says which one and that name is known (the top-up's own pick, or the Sub
 * admin's own warehouse); otherwise it is left out, never shown as a raw id.
 */
import React from 'react';
import { ScrollView } from 'react-native';

import { t } from '../../../i18n';
import type { WalletTransactionRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { EmptyState, InfoCard, WalletScreen, walletLayout, type InfoField } from './WalletParts';

export interface TopUpDetailsScreenProps extends WarehouseScreenBaseProps {
  /** The server's ledger row as the wallet screens carry it; undefined when the route was opened without one. */
  transaction?: WalletTransactionRecord | undefined;
}

/** The warehouse name of a row, when it is known; never a raw id. */
export function transactionWarehouseName(transaction: WalletTransactionRecord, scope: WarehouseScope): string | undefined {
  if (transaction.warehouseName !== undefined && transaction.warehouseName !== '') return transaction.warehouseName;
  if (transaction.warehouseId !== undefined && transaction.warehouseId === scope.warehouseId) return scope.warehouseName;
  return undefined;
}

/** Present fields only, two per row. */
function transactionRows(transaction: WalletTransactionRecord, warehouseName: string | undefined): InfoField[][] {
  const fields: InfoField[] = [];
  const add = (label: string, value: string | undefined) => {
    if (value !== undefined && value !== '') fields.push({ label, value });
  };
  add(t('customers.wallet.detail.id'), transaction.transactionId);
  add(t('customers.wallet.detail.type'), transaction.type);
  add(t('wallet.topup.customer'), transaction.customerName);
  add(t('wallet.topup.customerId'), transaction.customerId);
  add(t('customers.wallet.detail.amount'), transaction.amount);
  add(t('customers.wallet.detail.previousBalance'), transaction.previousBalance);
  add(t('customers.wallet.detail.newBalance'), transaction.newBalance);
  add(t('customers.wallet.detail.dateTime'), transaction.dateTime);
  add(t('customers.wallet.detail.warehouse'), warehouseName);
  add(t('wallet.topup.fiscal.title'), transaction.fiscalCashTag);
  if (transaction.referenceId !== transaction.fiscalCashTag) add(t('customers.wallet.detail.reference'), transaction.referenceId);
  const rows: InfoField[][] = [];
  for (let i = 0; i < fields.length; i += 2) rows.push(fields.slice(i, i + 2));
  return rows;
}

export function TopUpDetailsScreen({ scope, onBack, transaction }: TopUpDetailsScreenProps) {
  if (transaction === undefined) {
    return (
      <WalletScreen title={t('customers.wallet.detail.title')} onBack={onBack}>
        <EmptyState title={t('wallet.detail.missing')} />
      </WalletScreen>
    );
  }
  return (
    <WalletScreen title={t('customers.wallet.detail.title')} onBack={onBack}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <InfoCard rows={transactionRows(transaction, transactionWarehouseName(transaction, scope))} />
      </ScrollView>
    </WalletScreen>
  );
}
