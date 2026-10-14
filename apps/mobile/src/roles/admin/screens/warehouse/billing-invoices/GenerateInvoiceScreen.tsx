/**
 * Generate Invoice: pick the completed sale to invoice, then continue in the
 * invoice wizard.
 *
 * Gate (FINAL_LIST row 2): the whole screen requires invoice.generate. The hub
 * hides its entry without it; a deep link without it gets a notice, not the
 * picker. The server re-checks on generate (CLAUDE.md 2.1).
 *
 * Scope: the transaction list is limited to the own warehouse when
 * scope.warehouseId is set; Main sees every warehouse's sales.
 *
 * A sale that already has an invoice cannot be selected. The old Sub screen
 * sent B2B sales and "Invoice Exists" rows to the GST Invoice restricted
 * notice; that screen is dropped (invoice.gst.generate none/none, SPEC_GAPS W4g).
 *
 * Absorbs the Main GenerateInvoiceScreen (pair M9-S04). Its two backend-rule
 * notes are ported for the Main view (scope.warehouseId undefined).
 */
// Design id: M9-S04
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  BillingButton,
  BillingScreen,
  InfoNote,
  inScope,
  isAllWarehouses,
  PermissionNote,
  SearchBar,
  SectionTitle,
  StatusBadge,
} from './BillingParts';
import { INITIAL_INVOICE_TRANSACTIONS } from './fixtures';
import type { InvoiceTransactionRecord, WarehouseScreenBaseProps } from './types';

export interface GenerateInvoiceScreenProps extends WarehouseScreenBaseProps {
  onSelectTransaction: (transaction: InvoiceTransactionRecord) => void;
  /** Eligible sales; defaults to the mock set until the invoice API is wired. */
  transactions?: readonly InvoiceTransactionRecord[] | undefined;
}

export function GenerateInvoiceScreen({
  scope,
  can,
  onBack,
  onSelectTransaction,
  transactions = INITIAL_INVOICE_TRANSACTIONS,
}: GenerateInvoiceScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!can('invoice.generate')) {
    return (
      <BillingScreen title="Generate Invoice" onBack={onBack}>
        <View style={styles.scrollContent}>
          <PermissionNote>You do not have permission to generate invoices.</PermissionNote>
        </View>
      </BillingScreen>
    );
  }

  const q = searchQuery.trim().toLowerCase();
  const filtered = transactions.filter(
    (tx) =>
      inScope(scope, tx.warehouseId) &&
      (!q || tx.id.toLowerCase().includes(q) || tx.customerName.toLowerCase().includes(q)),
  );

  return (
    <BillingScreen title="Generate Invoice" onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionTitle>Select Transaction</SectionTitle>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search Order ID / Sale ID" />

        {filtered.map((tx) => {
          const eligible = tx.status === 'Completed';
          return (
            <View key={tx.id} style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardTitleCol}>
                  <Text style={styles.orderIdText}>{tx.id}</Text>
                  <Text style={styles.customerText}>
                    {tx.customerName} · {tx.saleType}
                  </Text>
                </View>
                <StatusBadge status={tx.status} />
              </View>
              <Text style={styles.amountText}>{tx.amount}</Text>
              <BillingButton
                label={eligible ? 'Select' : 'Invoice already generated'}
                variant="tint"
                compact
                disabled={!eligible}
                onPress={() => onSelectTransaction(tx)}
              />
            </View>
          );
        })}
        {filtered.length === 0 ? <Text style={styles.emptyText}>No eligible transactions.</Text> : null}

        {isAllWarehouses(scope) ? (
          <>
            <InfoNote>Only completed/eligible transactions returned by the backend appear here.</InfoNote>
            <InfoNote>
              Invoice Generated is never shown until the server confirms generation — duplicate submission is
              blocked while processing.
            </InfoNote>
          </>
        ) : null}
      </ScrollView>
    </BillingScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitleCol: { flex: 1 },
  orderIdText: { ...adminType.rowTitle, color: adminColors.ink },
  customerText: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  amountText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    textAlign: 'right',
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  emptyText: { ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.lg },
});
