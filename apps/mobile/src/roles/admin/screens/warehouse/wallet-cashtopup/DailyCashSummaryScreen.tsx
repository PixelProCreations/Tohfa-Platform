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
import { CASH_BREAKDOWN, SAMPLE_DATE, TOP_UP_HISTORY } from './fixtures';
import type { TopUpHistoryRow, WarehouseScreenBaseProps } from './types';
import {
  AmountRow,
  ArrowDownIcon,
  CalendarIcon,
  Card,
  ExportIcon,
  InfoNote,
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
  onViewTopUpHistory?: (() => void) | undefined;
  /** Open the full daily cash ledger (DailyCashScreen). */
  onNavigateToDailyCash?: (() => void) | undefined;
}

/** Mock system-recorded cash for the day (whole rupees). */
const SYSTEM_CASH = 18500;

export function DailyCashSummaryScreen({
  scope,
  can,
  onBack,
  onTabChange,
  date = SAMPLE_DATE,
  rows = TOP_UP_HISTORY,
  onViewTopUpHistory,
  onNavigateToDailyCash,
}: DailyCashSummaryScreenProps) {
  const [physicalCount, setPhysicalCount] = useState(String(SYSTEM_CASH));
  const canTopUps = can('wallet.cash_topup.process');

  const parsedPhysical = parseInt(physicalCount.replace(/[^0-9]/g, '') || '0', 10);
  const variance = parsedPhysical - SYSTEM_CASH;
  const todaysTopUps = rows.filter((row) => row.date === date && inScope(scope, row.warehouseId));

  const handleReconcile = () => {
    // No rbac code covers the physical count / variance save (SPEC_GAPS W4i-3).
    Alert.alert(
      'Reconcile Cash',
      variance === 0
        ? 'Physical cash matches system cash. Reconciliation submitted.'
        : `Variance of ${formatRupees(Math.abs(variance))} submitted for review. The wallet ledger is not changed.`,
    );
  };

  return (
    <WalletScreen
      title="Daily Cash Summary"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} />}
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.dateCard}
          onPress={() => Alert.alert('Select Date', 'Choose summary date to inspect.')}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.dateText}>Today · {date}</Text>
          <CalendarIcon />
        </TouchableOpacity>

        {canTopUps ? (
          <>
            <KpiRow
              items={[
                { value: '24', label: 'TRANSACTIONS' },
                { value: '23', label: 'COMPLETED' },
                { value: '1', label: 'PENDING' },
              ]}
            />
            <Card centered>
              <Text style={styles.totalLabel}>Total Cash Received</Text>
              <Text style={styles.bigValue}>{formatRupees(SYSTEM_CASH)}</Text>
            </Card>
          </>
        ) : null}

        <SectionTitle right={<SectionHint>Where recorded</SectionHint>}>Cash Breakdown</SectionTitle>
        <Card>
          {CASH_BREAKDOWN.map((line, index) => (
            <AmountRow key={line.label} divider={index > 0} label={line.label} value={line.amount} />
          ))}
        </Card>

        <SectionTitle>System vs. Physical Cash</SectionTitle>
        <Card centered>
          <Text style={styles.bigValue}>{formatRupees(SYSTEM_CASH)}</Text>
          <Text style={styles.stackLabel}>SYSTEM RECORDED</Text>
          <View style={styles.arrow}>
            <ArrowDownIcon />
          </View>
          <Text style={styles.bigValue}>{formatRupees(parsedPhysical)}</Text>
          <Text style={styles.stackLabel}>PHYSICAL COUNTED</Text>
          <View style={styles.arrow}>
            <ArrowDownIcon />
          </View>
          <Text style={[styles.bigValue, variance === 0 ? styles.ok : styles.off]}>{formatRupees(Math.abs(variance))}</Text>
          <Text style={styles.stackLabel}>VARIANCE</Text>
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
          <WalletButton label="Reconcile Cash" onPress={handleReconcile} />
        </View>

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

        {canTopUps ? (
          <>
            <SectionTitle>Transaction Breakdown</SectionTitle>
            <KpiRow
              items={[
                { value: '24', label: 'COMPLETED' },
                { value: '1', label: 'PENDING' },
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
