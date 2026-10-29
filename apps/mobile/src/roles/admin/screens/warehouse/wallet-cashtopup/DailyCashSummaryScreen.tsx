// Design id: M8-S08
/**
 * Daily Cash Summary (wallet view): today's cash top-up count, cash received,
 * denomination breakdown, system vs physical cash and the top-up list.
 *
 * Gates (FINAL_LIST #33):
 *   - The top-up figures, the top-up list and the link to the full top-up
 *     history render only when can('wallet.cash_topup.process').
 *   - The physical count / variance save ("Reconcile Cash") has no rbac code:
 *     ungated, SPEC_GAPS W4i-3. A variance never modifies the wallet ledger or
 *     cash records; it surfaces as Review Required (server-side).
 * Scope: Sub sees its own warehouse (locked pill); Main sees all warehouses.
 *
 * Absorbs dashboard/MainWarehouseDailyCashSummaryScreen: its variance note and
 * the Reconcile Cash action are shown for both roles; its "date · warehouse"
 * header is the scope pill.
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { useCashTopupsReport, useDailyCashData } from './useWalletData';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { useIdempotencyKey } from '../../../api/hooks';
import { formatPaise, parseRupeesToPaise, fromPaise } from '../../../money/paise';
import { createCashClose, type CashCloseDto } from '../../../api/finance';
import { moneyToPaise } from './mappers';
import { AdminLoadingState, AdminErrorState } from '../shared/AsyncStates';
import type { Money } from '@tohfa/shared-types';
import type { TopUpHistoryRow, WarehouseScope, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  ArrowDownIcon,
  CalendarIcon,
  Card,
  ExportIcon,
  InfoNote,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SectionHint,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WarehouseTabBar,
  WalletScreen,
  inScope,
  walletLayout,
} from './WalletParts';

export interface DailyCashSummaryScreenProps extends WarehouseScreenBaseProps {
  date?: string | undefined;
  rows?: readonly TopUpHistoryRow[] | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  initialWarehouseId?: string | undefined;
  onViewTopUpHistory?: (() => void) | undefined;
  /** Open the full daily cash ledger (DailyCashScreen). */
  onNavigateToDailyCash?: (() => void) | undefined;
}

export function DailyCashSummaryScreen({
  scope,
  can,
  onBack,
  onTabChange,
  date,
  rows = [],
  warehouseOptions,
  initialWarehouseId,
  onViewTopUpHistory,
  onNavigateToDailyCash,
}: DailyCashSummaryScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);
  const { options: fetchedWarehouses } = useWarehouseOptions();
  const effectiveWarehouseOptions =
    warehouseOptions && warehouseOptions.length > 0 ? warehouseOptions : fetchedWarehouses;
  const { report } = useCashTopupsReport(scope, selectedWarehouseId);
  const dailyCash = useDailyCashData(scope, selectedWarehouseId);

  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const isMainAll = !effectiveWarehouseId;
  const isClosed = dailyCash.closed !== null;

  const [reconcileResult, setReconcileResult] = useState<CashCloseDto | null>(null);
  const [reconcileError, setReconcileError] = useState<unknown>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const keyCache = useIdempotencyKey();

  const cashBreakdown = [
    { label: 'Opening Cash', amount: formatPaise(dailyCash.openingPaise) },
    { label: 'Direct Cash Sales', amount: formatPaise(dailyCash.directSalesPaise) },
    { label: 'Cash Top-Ups', amount: formatPaise(dailyCash.cashTopUpsPaise) },
    { label: 'Cash Expenses', amount: formatPaise(dailyCash.expensesPaise) },
    { label: 'Expected Closing', amount: formatPaise(dailyCash.expectedClosingPaise) },
  ];

  const systemCashPaise = dailyCash.expectedClosingPaise;
  const liveCount = report?.count ?? null;

  const [physicalCount, setPhysicalCount] = useState('');
  const canTopUps = can('wallet.cash_topup.process');
  const canManageClose = can('finance.cash_close.manage');

  const parsedPhysicalPaise = parseRupeesToPaise(physicalCount);
  const currentVariance = reconcileResult
    ? (moneyToPaise(reconcileResult.difference) ?? 0)
    : parsedPhysicalPaise !== null
      ? parsedPhysicalPaise - systemCashPaise
      : null;

  const canReconcile = !isMainAll && !isClosed && canManageClose && parsedPhysicalPaise !== null && !isReconciling;

  const todaysTopUps = rows.filter(
    (row) => row.date === date && inScope(scope, row.warehouseId, selectedWarehouseId),
  );

  const handleReconcile = async () => {
    if (!canReconcile || parsedPhysicalPaise === null || !effectiveWarehouseId) return;
    setIsReconciling(true);
    setReconcileError(null);
    const today = date ?? new Date().toISOString().slice(0, 10);
    const body = {
      date: today,
      warehouseId: effectiveWarehouseId,
      countedCash: fromPaise(parsedPhysicalPaise) as Money,
    };
    try {
      const res = await createCashClose(body, keyCache.keyFor(body));
      keyCache.reset();
      setReconcileResult(res);
      dailyCash.refresh();
      Alert.alert(
        'Reconciliation Recorded',
        `Physical Cash: ${formatPaise(parsedPhysicalPaise)}\nVariance: ${res.difference}`,
      );
    } catch (err) {
      setReconcileError(err);
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <WalletScreen
      title="Daily Cash Summary"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={effectiveWarehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {dailyCash.isLoading ? <AdminLoadingState /> : null}
        {dailyCash.error ? <AdminErrorState error={dailyCash.error} onRetry={dailyCash.refresh} /> : null}
        {reconcileError ? <AdminErrorState error={reconcileError} onRetry={handleReconcile} /> : null}

        {dailyCash.warehouseCount !== undefined ? (
          <Text style={styles.selectedNote}>
            {dailyCash.warehouseCount} Warehouses Combined
          </Text>
        ) : null}

        {date ? (
          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => Alert.alert('Select Date', 'Choose summary date to inspect.')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.dateText}>Today · {date}</Text>
            <CalendarIcon />
          </TouchableOpacity>
        ) : null}

        {canTopUps ? (
          <>
            {liveCount != null ? (
              <KpiRow
                items={[
                  { value: String(liveCount), label: 'TRANSACTIONS' },
                  { value: String(liveCount), label: 'COMPLETED' },
                  { value: '0', label: 'PENDING' },
                ]}
              />
            ) : null}
            <Card centered>
              <Text style={styles.totalLabel}>Total Expected Cash</Text>
              <Text style={styles.bigValue}>{formatPaise(systemCashPaise)}</Text>
            </Card>
          </>
        ) : null}

        <SectionTitle right={<SectionHint>Where recorded</SectionHint>}>Cash Breakdown</SectionTitle>
        <Card>
          {cashBreakdown.map((line, index) => (
            <AmountRow key={line.label} divider={index > 0} label={line.label} value={line.amount} />
          ))}
        </Card>

        <SectionTitle>System vs. Physical Cash</SectionTitle>
        <Card centered>
          <Text style={styles.bigValue}>{formatPaise(systemCashPaise)}</Text>
          <Text style={styles.stackLabel}>SYSTEM RECORDED</Text>
          <View style={styles.arrow}><ArrowDownIcon /></View>
          <Text style={styles.bigValue}>{parsedPhysicalPaise !== null ? formatPaise(parsedPhysicalPaise) : '—'}</Text>
          <Text style={styles.stackLabel}>PHYSICAL COUNTED</Text>
          {currentVariance != null ? (
            <>
              <View style={styles.arrow}><ArrowDownIcon /></View>
              <Text style={[styles.bigValue, currentVariance === 0 ? styles.ok : styles.off]}>{formatPaise(Math.abs(currentVariance))}</Text>
              <Text style={styles.stackLabel}>VARIANCE</Text>
            </>
          ) : null}
        </Card>

        <SectionTitle right={<SectionHint>If supported</SectionHint>}>Physical Cash Counted</SectionTitle>
        <View style={styles.physicalBox}>
          <Text style={styles.rupee}>₹</Text>
          <TextInput
            style={styles.physicalInput}
            value={physicalCount}
            onChangeText={setPhysicalCount}
            keyboardType="numeric"
            accessibilityLabel="Physical cash counted"
          />
        </View>
        <InfoNote tone="info">
          A variance never automatically modifies the wallet ledger or cash records — it always surfaces as Review
          Required instead.
        </InfoNote>

        <View style={styles.actionWrap}>
          <WalletButton
            label={isClosed ? 'Reconciliation Closed' : isReconciling ? 'Submitting…' : 'Reconcile Cash'}
            onPress={handleReconcile}
            disabled={!canReconcile}
          />
        </View>

        {currentVariance != null || isClosed ? (
          <>
            <SectionTitle>Reconciliation Status</SectionTitle>
            <TouchableOpacity
              onPress={onNavigateToDailyCash}
              disabled={onNavigateToDailyCash === undefined}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Open daily cash ledger"
            >
              <StatusBadge
                label={isClosed ? 'Reconciled' : currentVariance === 0 ? 'Reconciled' : 'Review Required'}
                tone={isClosed || currentVariance === 0 ? 'success' : 'warning'}
              />
            </TouchableOpacity>
          </>
        ) : null}

        {canTopUps && liveCount != null ? (
          <>
            <SectionTitle>Transaction Breakdown</SectionTitle>
            <KpiRow
              items={[
                { value: String(liveCount), label: 'COMPLETED' },
                { value: '0', label: 'PENDING' },
                { value: '0', label: 'FAILED' },
              ]}
            />

            <SectionTitle>Top-Up List</SectionTitle>
            {todaysTopUps.slice(0, 1).map((row) => (
              <Card key={row.id}>
                <View style={styles.topUpRow}>
                  <View>
                    <Text style={styles.topUpTitle}>
                      {row.time} · {row.customerName}
                    </Text>
                    <Text style={styles.topUpMeta}>{row.fiscalTag}</Text>
                  </View>
                  <StatusBadge label={row.status} tone={row.status === 'Completed' ? 'success' : 'warning'} />
                </View>
                <Text style={styles.topUpAmount}>{row.amount}</Text>
              </Card>
            ))}
            {onViewTopUpHistory ? (
              <TouchableOpacity style={styles.link} onPress={onViewTopUpHistory} activeOpacity={0.7} accessibilityRole="button">
                <Text style={styles.linkText}>View Full Top-Up History →</Text>
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}

        <SectionTitle>Export</SectionTitle>
        <WalletButton
          label="Export Summary"
          variant="outline"
          icon={<ExportIcon />}
          onPress={() => Alert.alert('Export Summary', 'Exporting daily cash settlement report (PDF/CSV)...')}
        />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  selectedNote: { ...adminType.rowMeta, color: adminColors.muted, marginVertical: adminSpacing.xs },
  dateCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: adminSpacing.md,
  },
  dateText: { ...adminType.rowTitle, color: adminColors.ink },
  totalLabel: { ...adminType.rowMeta, color: adminColors.muted },
  bigValue: { ...adminType.kpiValue, color: adminColors.ink, marginTop: adminSpacing.xs },
  stackLabel: { ...adminType.caption, color: adminColors.muted, marginTop: 2 },
  arrow: { marginVertical: adminSpacing.sm },
  ok: { color: adminColors.success.text },
  off: { color: adminColors.danger.text },
  physicalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
  },
  rupee: { ...adminType.sectionHead, color: adminColors.muted, marginRight: adminSpacing.xs },
  physicalInput: { ...adminType.sectionHead, flex: 1, color: adminColors.ink, paddingVertical: adminSpacing.md },
  actionWrap: { marginTop: adminSpacing.md },
  topUpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  topUpTitle: { ...adminType.rowTitle, color: adminColors.ink },
  topUpMeta: { ...adminType.rowMeta, color: adminColors.brandDeep, marginTop: 2 },
  topUpAmount: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.sm },
  link: { alignItems: 'center', paddingVertical: adminSpacing.md },
  linkText: { ...adminType.rowTitle, color: adminColors.brand },
});
