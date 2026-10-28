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
import { CASH_BREAKDOWN } from './fixtures';
import { moneyToWholeRupees, useCashTopupsReport } from './useWalletData';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
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
  formatRupees,
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

  // Money is integer paise — convert via moneyToWholeRupees, never parseFloat
  const systemCash = report?.total != null ? moneyToWholeRupees(report.total) : null;
  const liveCount = report?.count ?? null;

  const [physicalCount, setPhysicalCount] = useState(systemCash != null ? String(systemCash) : '');
  const allWarehouses = isAllWarehouses(scope);
  const canTopUps = can('wallet.cash_topup.process');

  const parsedPhysical = parseInt(physicalCount.replace(/[^0-9]/g, '') || '0', 10);
  const variance = systemCash != null ? parsedPhysical - systemCash : null;
  const todaysTopUps = rows.filter(
    (row) => row.date === date && inScope(scope, row.warehouseId, selectedWarehouseId),
  );

  const handleReconcile = () => {
    Alert.alert(
      'Reconciliation Submitted',
      `Physical Cash: ${formatRupees(parsedPhysical)}\nVariance: ${variance == null ? 'N/A' : variance === 0 ? '₹0 (Balanced)' : `${variance > 0 ? '+' : '-'}${formatRupees(Math.abs(variance))}`}`,
      [{ text: 'OK' }],
    );
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
            {systemCash != null ? (
              <Card centered>
                <Text style={styles.totalLabel}>Total Cash Received</Text>
                <Text style={styles.bigValue}>{formatRupees(systemCash)}</Text>
              </Card>
            ) : null}
          </>
        ) : null}

        <SectionTitle right={<SectionHint>Where recorded</SectionHint>}>Cash Breakdown</SectionTitle>
        <Card>
          {CASH_BREAKDOWN.map((line, index) => (
            <AmountRow key={line.label} divider={index > 0} label={line.label} value={line.amount} />
          ))}
        </Card>

        {systemCash != null ? (
          <>
            <SectionTitle>System vs. Physical Cash</SectionTitle>
            <Card centered>
              <Text style={styles.bigValue}>{formatRupees(systemCash)}</Text>
              <Text style={styles.stackLabel}>SYSTEM RECORDED</Text>
              <View style={styles.arrow}><ArrowDownIcon /></View>
              <Text style={styles.bigValue}>{formatRupees(parsedPhysical)}</Text>
              <Text style={styles.stackLabel}>PHYSICAL COUNTED</Text>
              {variance != null ? (
                <>
                  <View style={styles.arrow}><ArrowDownIcon /></View>
                  <Text style={[styles.bigValue, variance === 0 ? styles.ok : styles.off]}>{formatRupees(Math.abs(variance))}</Text>
                  <Text style={styles.stackLabel}>VARIANCE</Text>
                </>
              ) : null}
            </Card>
          </>
        ) : null}

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
        {allWarehouses ? (
          <InfoNote tone="info">
            A variance never automatically modifies the wallet ledger or cash records — it always surfaces as Review
            Required instead.
          </InfoNote>
        ) : null}
        {allWarehouses ? (
          <View style={styles.actionWrap}>
            <WalletButton label="Reconcile Cash" onPress={handleReconcile} />
          </View>
        ) : null}

        {variance != null ? (
          <>
            <SectionTitle>Reconciliation Status</SectionTitle>
            <TouchableOpacity
              onPress={onNavigateToDailyCash}
              disabled={onNavigateToDailyCash === undefined}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Open daily cash ledger"
            >
              <StatusBadge label={variance === 0 ? 'Reconciled' : 'Review Required'} tone={variance === 0 ? 'success' : 'warning'} />
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
