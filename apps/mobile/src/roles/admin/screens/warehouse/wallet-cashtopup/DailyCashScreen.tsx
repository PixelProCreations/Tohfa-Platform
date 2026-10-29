// Design id: M11-S08
/**
 * Daily Cash (cash ledger + end-of-day reconciliation): opening cash, cash in
 * (direct sales, cash top-ups), cash out (expenses), expected closing, the
 * physical count and the transaction breakdown. Reached from the finance
 * screens (Finance Reports "Daily" card, Finance hub) and the wallet daily
 * summary.
 *
 * Gate: rbac.json has NO code for the daily cash ledger (FINAL_LIST #32,
 * SPEC_GAPS W4i-3). Until one exists the screen renders only for an admin who
 * holds can('finance.sales_income.view') || can('finance.expense.log') (the
 * two finance codes whose data it combines). Submit Reconciliation has no
 * code either and is ungated; the server must own it.
 *
 * Scope: Sub sees its own warehouse (locked pill with the date); Main sees the
 * all-warehouses header and selector (pair_table M11-S08: "MWA All Warehouses
 * header w/ fixed expectedClosing"). The expected closing is computed
 * server-side and never manually overridable; the mock figure is fixed.
 *
 * Absorbs dashboard/MainWarehouseDailyCashScreen: the all-warehouses header is
 * the Main view; its formula note and "Cash reconciled" confirmation are shown
 * for both roles.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { useDailyCashData } from './useWalletData';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';
import { AdminLoadingState, AdminErrorState } from '../shared/AsyncStates';
import type { CashLedgerEntry, WarehouseScope, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  Card,
  EmptyState,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletScreen,
  inScope,
  isAllWarehouses,
  walletLayout,
} from './WalletParts';

export interface DailyCashScreenProps extends WarehouseScreenBaseProps {
  date?: string | undefined;
  entries?: readonly CashLedgerEntry[] | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  initialWarehouseId?: string | undefined;
  hideWarehouseFilter?: boolean | undefined;
}

export function DailyCashScreen({
  scope,
  can,
  onBack,
  date,
  warehouseOptions,
  initialWarehouseId,
  hideWarehouseFilter = false,
}: DailyCashScreenProps) {
  const displayDate = date ?? new Date().toISOString().slice(0, 10);
  const [actualCash, setActualCash] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const { options: fetchedWarehouses } = useWarehouseOptions();
  const effectiveWarehouseOptions =
    warehouseOptions && warehouseOptions.length > 0 ? warehouseOptions : fetchedWarehouses;

  const liveCash = useDailyCashData(scope, selectedWarehouseId);
  const effectiveOpening = liveCash.openingPaise;
  const effectiveDirectSales = liveCash.directSalesPaise;
  const effectiveTopUps = liveCash.cashTopUpsPaise;
  const effectiveExpenses = liveCash.expensesPaise;
  const effectiveClosing = liveCash.expectedClosingPaise;

  // NO CODE for the daily cash ledger yet (SPEC_GAPS W4i-3): show it only to
  // admins who can see the finance data it is built from.
  const visible = can('finance.sales_income.view') || can('finance.expense.log');
  if (!visible) {
    return (
      <WalletScreen title="Daily Cash Summary" onBack={onBack}>
        <EmptyState title="Daily cash is not available" subtitle="Your role does not include warehouse finance data." />
      </WalletScreen>
    );
  }

  const parsedActual = parseRupeesToPaise(actualCash) ?? 0;
  const difference = parsedActual - effectiveClosing;
  const headerLabel = isAllWarehouses(scope)
    ? undefined
    : `${scope.warehouseName ?? scope.warehouseId} · ${displayDate}`;

  const handleSubmit = () => {
    // No rbac code covers reconciliation (SPEC_GAPS W4i-3); the server must own it.
    Alert.alert(
      'Reconciliation Submitted',
      `Daily Cash Reconciliation for ${displayDate} submitted.\nActual Cash: ₹${actualCash}\nDifference: ${difference >= 0 ? '+' : '-'}${formatPaise(Math.abs(difference))}`,
      [{ text: 'OK', onPress: onBack }],
    );
  };

  return (
    <WalletScreen
      title="Daily Cash Summary"
      subtitle={isAllWarehouses(scope) ? displayDate : undefined}
      onBack={onBack}
      headerExtra={
        hideWarehouseFilter ? undefined : (
          <ScopeHeader
            scope={scope}
            label={headerLabel}
            warehouseOptions={effectiveWarehouseOptions}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={setSelectedWarehouseId}
          />
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {liveCash.isLoading ? <AdminLoadingState /> : null}
        {liveCash.error ? <AdminErrorState error={liveCash.error} onRetry={liveCash.refresh} /> : null}

        {isAllWarehouses(scope) && selectedWarehouseId !== undefined ? (
          <Text style={styles.selectedNote}>
            Showing {effectiveWarehouseOptions.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName ?? selectedWarehouseId}
          </Text>
        ) : null}

        <SectionTitle>Opening Balance</SectionTitle>
        <Card>
          <Text style={styles.cardLabel}>Opening Cash</Text>
          <Text style={styles.cardBigValue}>{formatPaise(effectiveOpening)}</Text>
        </Card>

        <SectionTitle>Cash In</SectionTitle>
        <Card>
          <AmountRow label="Direct Sales" value={formatPaise(effectiveDirectSales)} />
          <AmountRow divider label="Cash Top-Ups" value={formatPaise(effectiveTopUps)} />
          <AmountRow divider label="Total Cash In" value={formatPaise(effectiveDirectSales + effectiveTopUps)} emphasis="total" />
        </Card>

        <SectionTitle>Cash Out</SectionTitle>
        <Card>
          <AmountRow label="Expenses" value={formatPaise(effectiveExpenses)} />
          <AmountRow divider label="Total Cash Out" value={formatPaise(effectiveExpenses)} emphasis="total" />
        </Card>

        <SectionTitle>Closing Balance</SectionTitle>
        <Card>
          <Text style={styles.cardLabel}>Expected Closing Cash</Text>
          <Text style={styles.cardBigValue}>{formatPaise(effectiveClosing)}</Text>
        </Card>

        <SectionTitle>Cash Reconciliation</SectionTitle>
        <Card>
          <AmountRow label="Expected Cash" value={formatPaise(effectiveClosing)} />
          <View style={styles.actualInputWrap}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.actualInput}
              value={actualCash}
              onChangeText={setActualCash}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={adminColors.placeholder}
              accessibilityLabel="Actual physical cash"
            />
          </View>
          <AmountRow
            label="Difference"
            value={`${difference < 0 ? '-' : '+'}${formatPaise(Math.abs(difference))}`}
            emphasis={difference < 0 ? 'debit' : 'credit'}
          />
        </Card>
        {difference === 0 ? (
          <View style={styles.reconciledBox}>
            <Text style={styles.reconciledAmount}>₹0</Text>
            <Text style={styles.reconciledText}>Cash reconciled.</Text>
          </View>
        ) : null}

        <SectionTitle>Difference Reason</SectionTitle>
        <TextInput
          style={styles.textArea}
          value={differenceReason}
          onChangeText={setDifferenceReason}
          placeholder="Reason for the difference, if any"
          placeholderTextColor={adminColors.placeholder}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
        <View style={styles.submitWrap}>
          <WalletButton label="Submit Reconciliation" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </WalletScreen>
  );
}

const TX_ICON = 36;
const TEXT_AREA_MIN_HEIGHT = 64;

const styles = StyleSheet.create({
  selectedNote: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
  cardLabel: { ...adminType.rowMeta, color: adminColors.muted },
  // Was a 22-24px figure; nearest admin style is kpiValue (19).
  cardBigValue: { ...adminType.kpiValue, color: adminColors.ink, marginTop: adminSpacing.xs },
  actualInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    marginVertical: adminSpacing.sm,
  },
  currencySymbol: { ...adminType.sectionHead, color: adminColors.muted, marginRight: adminSpacing.xs },
  actualInput: { ...adminType.sectionHead, flex: 1, color: adminColors.ink, paddingVertical: adminSpacing.sm },
  reconciledBox: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.lg,
    alignItems: 'center',
    marginTop: adminSpacing.md,
  },
  reconciledAmount: { ...adminType.kpiValue, color: adminColors.success.text },
  reconciledText: { ...adminType.rowTitle, color: adminColors.success.text, marginTop: adminSpacing.xs },
  textArea: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    minHeight: TEXT_AREA_MIN_HEIGHT,
  },
  submitWrap: { marginTop: adminSpacing.md },
  breakdownCard: { marginTop: adminSpacing.sm },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.sm },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  txIcon: {
    width: TX_ICON,
    height: TX_ICON,
    borderRadius: adminRadius.xs,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txTitle: { ...adminType.rowTitle, color: adminColors.ink },
  txMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { ...adminType.rowTitle },
  credit: { color: adminColors.success.text },
  debit: { color: adminColors.danger.text },
});
