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
import type { CashLedgerEntry, WarehouseScope, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  Card,
  CashIcon,
  ChipGroup,
  EmptyState,
  ScopeHeader,
  SectionTitle,
  StoreIcon,
  WalletButton,
  WalletScreen,
  formatRupees,
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

const EMPTY_ENTRIES: readonly CashLedgerEntry[] = [];

type Breakdown = 'Cash In' | 'Cash Out';
const BREAKDOWNS: readonly Breakdown[] = ['Cash In', 'Cash Out'];

export function DailyCashScreen({
  scope,
  can,
  onBack,
  date,
  entries = EMPTY_ENTRIES,
  warehouseOptions,
  initialWarehouseId,
  hideWarehouseFilter = false,
}: DailyCashScreenProps) {
  const displayDate = date ?? new Date().toISOString().slice(0, 10);
  const [actualCash, setActualCash] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');
  const [breakdown, setBreakdown] = useState<Breakdown>('Cash In');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const { options: fetchedWarehouses } = useWarehouseOptions();
  const effectiveWarehouseOptions =
    warehouseOptions && warehouseOptions.length > 0 ? warehouseOptions : fetchedWarehouses;

  const liveCash = useDailyCashData(scope, selectedWarehouseId);
  const effectiveOpening = liveCash.openingCash;
  const effectiveDirectSales = liveCash.directSales;
  const effectiveTopUps = liveCash.cashTopUps;
  const effectiveExpenses = liveCash.expenses;
  const effectiveClosing = liveCash.expectedClosing;

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

  const parsedActual = Number(actualCash.replace(/[^0-9]/g, '')) || 0;
  const difference = parsedActual - effectiveClosing;
  const rows =
    breakdown === 'Cash In'
      ? liveCash.cashInEntries.length > 0
        ? liveCash.cashInEntries
        : entries.filter((e) => e.type === 'Cash In' && inScope(scope, e.warehouseId, selectedWarehouseId))
      : liveCash.cashOutEntries.length > 0
        ? liveCash.cashOutEntries
        : entries.filter((e) => e.type === 'Cash Out' && inScope(scope, e.warehouseId, selectedWarehouseId));
  const headerLabel = isAllWarehouses(scope)
    ? undefined
    : `${scope.warehouseName ?? scope.warehouseId} · ${displayDate}`;

  const handleSubmit = () => {
    // No rbac code covers reconciliation (SPEC_GAPS W4i-3); the server must own it.
    Alert.alert(
      'Reconciliation Submitted',
      `Daily Cash Reconciliation for ${displayDate} submitted.\nActual Cash: ₹${actualCash}\nDifference: ${difference >= 0 ? '+' : '-'}${formatRupees(Math.abs(difference))}`,
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
        {isAllWarehouses(scope) && selectedWarehouseId !== undefined ? (
          <Text style={styles.selectedNote}>
            Showing {effectiveWarehouseOptions.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName ?? selectedWarehouseId}
          </Text>
        ) : null}

        <SectionTitle>Opening Balance</SectionTitle>
        <Card>
          <Text style={styles.cardLabel}>Opening Cash</Text>
          <Text style={styles.cardBigValue}>{formatRupees(effectiveOpening)}</Text>
        </Card>

        <SectionTitle>Cash In</SectionTitle>
        <Card>
          <AmountRow label="Direct Sales" value={formatRupees(effectiveDirectSales)} />
          <AmountRow divider label="Cash Top-Ups" value={formatRupees(effectiveTopUps)} />
          <AmountRow divider label="Total Cash In" value={formatRupees(effectiveDirectSales + effectiveTopUps)} emphasis="total" />
        </Card>

        <SectionTitle>Cash Out</SectionTitle>
        <Card>
          <AmountRow label="Expenses" value={formatRupees(effectiveExpenses)} />
          <AmountRow divider label="Total Cash Out" value={formatRupees(effectiveExpenses)} emphasis="total" />
        </Card>

        <SectionTitle>Closing Balance</SectionTitle>
        <Card>
          <Text style={styles.cardLabel}>Expected Closing Cash</Text>
          <Text style={styles.cardBigValue}>{formatRupees(effectiveClosing)}</Text>
        </Card>

        <SectionTitle>Cash Reconciliation</SectionTitle>
        <Card>
          <AmountRow label="Expected Cash" value={formatRupees(effectiveClosing)} />
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
            value={`${difference < 0 ? '-' : '+'}${formatRupees(Math.abs(difference))}`}
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

        <SectionTitle>Transaction Breakdown</SectionTitle>
        <ChipGroup options={BREAKDOWNS} value={breakdown} onChange={setBreakdown} />
        <View style={styles.breakdownCard}>
          <Card>
            {rows.length === 0 ? (
              <EmptyState title={`No ${breakdown.toLowerCase()}`} />
            ) : (
              rows.map((tx, index) => {
                const cashIn = tx.type === 'Cash In';
                return (
                  <React.Fragment key={tx.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <View style={styles.txRow}>
                      <View style={styles.txIcon}>
                        {cashIn ? <StoreIcon /> : <CashIcon size={18} color={adminColors.brandDeep} />}
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txTitle}>{tx.title}</Text>
                        <Text style={styles.txMeta}>{tx.ref}</Text>
                      </View>
                      <View style={styles.txAmountCol}>
                        <Text style={[styles.txAmount, cashIn ? styles.credit : styles.debit]}>
                          {cashIn ? '+' : '-'}
                          {formatRupees(tx.amount)}
                        </Text>
                        <Text style={styles.txMeta}>{tx.time}</Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })
            )}
          </Card>
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
