import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  BuildingWarehouseIcon,
  CalendarIcon,
  ChevronDownIcon,
  DownloadIcon,
  TrendChartIcon,
} from '../../components/AdminIcons';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';
import { getFinanceExpenseReport, getFinanceRevenueReport } from '../../api/finance';
import { useAdminQuery } from '../../api/hooks';
import { listAllWarehouses } from '../../api/warehouseList';
import { t, type TranslationKey } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { moneyText } from '../dashboard/saOverviewFormat';
import { istToday } from '../warehouse/finance-expenses/mappers';
import { reportRange, type ReportRange } from '../warehouse/finance-expenses/reportRanges';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

export interface ProfitLossScreenProps {
  can?: Can | undefined;
  role?: string;
  onBack: () => void;
  onExport?: () => void;
}

type PeriodKey = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear';

const PERIOD_KEYS: readonly PeriodKey[] = ['thisMonth', 'lastMonth', 'thisQuarter', 'thisYear'];

/**
 * The report range a period label states, relative to `today` (IST,
 * YYYY-MM-DD). "This Quarter" starts on the 1st of the current calendar
 * quarter (Indian financial-year quarters start on the same days). "This
 * Year" is the calendar year, Jan 1 to today (owner decision 2026-11-25);
 * that span always fits finance_report_max_range_days (366).
 */
export function profitLossRange(period: PeriodKey, today: string): ReportRange | null {
  switch (period) {
    case 'thisMonth':
      return reportRange('monthToDate', today);
    case 'lastMonth':
      return reportRange('lastMonth', today);
    case 'thisQuarter': {
      const [year, month] = today.split('-');
      const quarterStartMonth = QUARTER_START[month ?? ''];
      return quarterStartMonth === undefined ? null : { from: `${year}-${quarterStartMonth}-01`, to: today };
    }
    case 'thisYear': {
      const [year] = today.split('-');
      return { from: `${year}-01-01`, to: today };
    }
  }
}

const QUARTER_START: Record<string, string> = {
  '01': '01', '02': '01', '03': '01',
  '04': '04', '05': '04', '06': '04',
  '07': '07', '08': '07', '09': '07',
  '10': '10', '11': '10', '12': '10',
};

/**
 * ProfitLossScreen (M13-S03 · Profit & Loss), on GET
 * /admin/finance/reports/{revenue,expenses} for the picked period. Reports
 * return raw sums and counts only (BR-63 clause 5), so cost of goods, gross
 * and net profit, margin and growth are dashed, never computed here (R6). The
 * reports take no warehouse, so the warehouse filter and the per-warehouse
 * figures are unavailable. There is no P&L export endpoint (R3).
 */
export function ProfitLossScreen({
  onBack,
}: ProfitLossScreenProps): React.JSX.Element {
  const [activeSegment, setActiveSegment] = useState<'summary' | 'warehouse'>('summary');
  const [period, setPeriod] = useState<PeriodKey>('thisMonth');

  const range = profitLossRange(period, istToday());
  const revenueQuery = useAdminQuery(
    ['admin', 'finance', 'revenue-report', range?.from, range?.to],
    (signal) => getFinanceRevenueReport(range as ReportRange, signal),
    { enabled: range !== null },
  );
  const expenseQuery = useAdminQuery(
    ['admin', 'finance', 'expense-report', range?.from, range?.to],
    (signal) => getFinanceExpenseReport(range as ReportRange, signal),
    { enabled: range !== null },
  );
  const warehousesQuery = useAdminQuery(['admin', 'warehouses', 'all'], (signal) => listAllWarehouses({}, signal));

  const revenueText = range === null ? ADMIN_NO_VALUE : moneyText(revenueQuery.data?.summary.total);
  const expensesText = range === null ? ADMIN_NO_VALUE : moneyText(expenseQuery.data?.summary.total);
  const isPending = range !== null && (revenueQuery.isPending || expenseQuery.isPending);
  const error = range === null ? null : (revenueQuery.error ?? expenseQuery.error);
  const periodLabel = t(`wiringFinance.profitLoss.period.${period}` as TranslationKey);
  const warehouses = warehousesQuery.data ?? [];

  const exportButton = (
    <TouchableOpacity
      style={[styles.exportBtn, styles.actionUnavailable]}
      disabled
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      testID="finance.profitLoss.export"
    >
      <DownloadIcon size={14} color={adminColors.onBrand} />
      <Text style={styles.exportBtnText}>Export</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Terracotta Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <BackArrowIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profit & Loss</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filters Row */}
        <View style={styles.filtersRow}>
          <TouchableOpacity
            style={styles.filterChip}
            activeOpacity={0.7}
            testID="finance.profitLoss.period"
            onPress={() => {
              Alert.alert(t('wiringFinance.profitLoss.periodTitle'), t('wiringFinance.profitLoss.periodPrompt'), [
                ...PERIOD_KEYS.map((key) => ({
                  text: t(`wiringFinance.profitLoss.period.${key}` as TranslationKey),
                  onPress: () => setPeriod(key),
                })),
                { text: t('wiringFinance.cancel'), style: 'cancel' as const },
              ]);
            }}
          >
            <CalendarIcon size={16} color={adminColors.muted} />
            <Text style={styles.filterChipText}>{periodLabel}</Text>
            <ChevronDownIcon size={14} color={adminColors.muted} />
          </TouchableOpacity>

          {/* The finance reports take no warehouse, so this filter cannot narrow anything (P2). */}
          <TouchableOpacity
            style={[styles.filterChip, styles.actionUnavailable]}
            disabled
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="finance.profitLoss.warehouse"
          >
            <BuildingWarehouseIcon size={16} color={adminColors.muted} />
            <Text style={styles.filterChipText}>{t('wiringFinance.profitLoss.allWarehouses')}</Text>
            <ChevronDownIcon size={14} color={adminColors.muted} />
          </TouchableOpacity>
        </View>

        {/* 6 Top KPI Cards */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard title="TOTAL REVENUE" value={revenueText} titlePosition="top" />
          <OverviewDashboardCard title="Cost of goods sold" value={ADMIN_NO_VALUE} titlePosition="top" />
          <OverviewDashboardCard title="Gross Profit" value={ADMIN_NO_VALUE} titlePosition="top" />
          <OverviewDashboardCard title="Operating Expenses" value={expensesText} titlePosition="top" />
          <OverviewDashboardCard title="Net Profit" value={ADMIN_NO_VALUE} titlePosition="top" />
          <OverviewDashboardCard title="Profit Margin" value={ADMIN_NO_VALUE} titlePosition="top" />
        </OverviewCardsGrid>

        {/* Segmented Buttons: [Summary] [By Warehouse] */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'summary' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('summary')}
            activeOpacity={0.8}
            testID="finance.profitLoss.segment.summary"
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSegment === 'summary' && styles.segmentBtnTextActive,
              ]}
            >
              Summary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSegment === 'warehouse' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveSegment('warehouse')}
            activeOpacity={0.8}
            testID="finance.profitLoss.segment.warehouse"
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeSegment === 'warehouse' && styles.segmentBtnTextActive,
              ]}
            >
              By Warehouse
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── TAB 1: P&L Summary (Image 3 Left) ─── */}
        {activeSegment === 'summary' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>P&L Summary</Text>
              {exportButton}
            </View>

            {isPending ? (
              <AdminLoadingState />
            ) : error ? (
              <AdminErrorState
                error={error}
                onRetry={() => {
                  void revenueQuery.refetch();
                  void expenseQuery.refetch();
                }}
              />
            ) : (
              <View style={styles.tableCard}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Sales Revenue</Text>
                  <Text style={styles.tableValue}>{revenueText}</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Other Income</Text>
                  <Text style={styles.tableValue}>{ADMIN_NO_VALUE}</Text>
                </View>
                <View style={styles.divider} />

                {/* Total Revenue Highlight Row: the server's revenue total (no other income is reported). */}
                <View style={[styles.tableRow, styles.highlightGreenRow]}>
                  <Text style={[styles.tableLabel, styles.boldText]}>Total Revenue</Text>
                  <Text style={[styles.tableValue, styles.boldText]}>{revenueText}</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Cost of Goods Sold</Text>
                  <Text style={[styles.tableValue, styles.negativeValue]}>{ADMIN_NO_VALUE}</Text>
                </View>
                <View style={styles.divider} />

                {/* Gross Profit Highlight Row */}
                <View style={[styles.tableRow, styles.highlightGreenRow]}>
                  <Text style={[styles.tableLabel, styles.boldText]}>Gross Profit</Text>
                  <Text style={[styles.tableValue, styles.boldText]}>{ADMIN_NO_VALUE}</Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Operating Expenses</Text>
                  <Text style={[styles.tableValue, styles.negativeValue]}>
                    {expensesText === ADMIN_NO_VALUE ? ADMIN_NO_VALUE : t('wiringFinance.profitLoss.negative', { amount: expensesText })}
                  </Text>
                </View>
                <View style={styles.divider} />

                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Other Expenses</Text>
                  <Text style={[styles.tableValue, styles.negativeValue]}>{ADMIN_NO_VALUE}</Text>
                </View>
                <View style={styles.divider} />

                {/* Net Profit Highlight Row */}
                <View style={[styles.tableRow, styles.highlightGreenRow]}>
                  <Text style={[styles.tableLabel, styles.boldText]}>Net Profit</Text>
                  <Text style={[styles.tableValue, styles.boldText]}>{ADMIN_NO_VALUE}</Text>
                </View>
              </View>
            )}

            {/* Period Comparison Card: the previous period and growth would be a second report and a division; dashed. */}
            <Text style={[styles.sectionTitle, { marginTop: adminSpacing.md }]}>
              Period Comparison
            </Text>
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonCol}>
                <Text style={styles.comparisonLabel}>{periodLabel}</Text>
                <Text style={styles.comparisonVal}>{revenueText}</Text>
              </View>

              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.comparisonCol}>
                <Text style={styles.comparisonLabel}>Previous Month</Text>
                <Text style={styles.comparisonVal}>{ADMIN_NO_VALUE}</Text>
              </View>

              <View style={styles.growthBadge}>
                <TrendChartIcon size={14} color={adminColors.success.text} />
                <Text style={styles.growthText}>{ADMIN_NO_VALUE}</Text>
                <Text style={styles.growthSub}>vs Previous period</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── TAB 2: Warehouse-wise Performance (Image 3 Right): no per-warehouse report, every figure dashed ─── */}
        {activeSegment === 'warehouse' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Warehouse-wise Performance</Text>
              {exportButton}
            </View>

            <View style={styles.warehouseTableCard}>
              {/* Header Row */}
              <View style={styles.whTableHeader}>
                <Text style={[styles.whColHeader, { flex: 1.5 }]}>Warehouse</Text>
                <Text style={[styles.whColHeader, { flex: 1.5, textAlign: 'right' }]}>Revenue</Text>
                <Text style={[styles.whColHeader, { flex: 1.5, textAlign: 'right' }]}>Expenses</Text>
                <Text style={[styles.whColHeader, { flex: 1.5, textAlign: 'right' }]}>Net Profit</Text>
                <Text style={[styles.whColHeader, { flex: 1.2, textAlign: 'right' }]}>Margin</Text>
              </View>

              {warehousesQuery.isPending ? (
                <AdminLoadingState />
              ) : warehousesQuery.error ? (
                <AdminErrorState error={warehousesQuery.error} onRetry={() => void warehousesQuery.refetch()} />
              ) : warehouses.length === 0 ? (
                <AdminEmptyState title={t('wiringFinance.warehouses.empty')} />
              ) : (
                warehouses.map((wh, idx) => (
                  <View key={wh.id} style={styles.whRowContainer}>
                    <View style={styles.whDataRow}>
                      <Text style={[styles.whCellBold, { flex: 1.4 }]}>{wh.name}</Text>
                      <Text style={[styles.whCell, { flex: 1.3, textAlign: 'right' }]}>{ADMIN_NO_VALUE}</Text>
                      <Text style={[styles.whCell, { flex: 1.3, textAlign: 'right' }]}>{ADMIN_NO_VALUE}</Text>
                      <Text style={[styles.whCellGreen, { flex: 1.3, textAlign: 'right' }]}>{ADMIN_NO_VALUE}</Text>
                      <Text style={[styles.whCellGreen, { flex: 1.1, textAlign: 'right' }]}>{ADMIN_NO_VALUE}</Text>
                    </View>
                    <View style={styles.whSubGrid}>
                      <View style={styles.whSubCol}>
                        <Text style={styles.whSubText}>Sale: {ADMIN_NO_VALUE}</Text>
                      </View>
                      <View style={styles.whSubDivider} />
                      <View style={styles.whSubCol}>
                        <Text style={styles.whSubText}>Other Income: {ADMIN_NO_VALUE}</Text>
                      </View>
                      <View style={styles.whSubDivider} />
                      <View style={styles.whSubCol}>
                        <Text style={styles.whSubText}>COGS: {ADMIN_NO_VALUE}</Text>
                      </View>
                      <View style={styles.whSubDivider} />
                      <View style={styles.whSubCol}>
                        <Text style={styles.whSubText}>Op. Expenses: {ADMIN_NO_VALUE}</Text>
                      </View>
                    </View>
                    {idx < warehouses.length - 1 && <View style={styles.whDivider} />}
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backBtn: {
    padding: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.sm,
  },
  filterChipText: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '600',
  },
  kpiGrid: {
    marginBottom: adminSpacing.md,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 3,
    marginBottom: adminSpacing.md,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: adminColors.brand,
  },
  segmentBtnText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  sectionWrap: {
    gap: adminSpacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
  },
  exportBtnText: {
    ...adminType.caption,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  tableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm + 2,
  },
  highlightGreenRow: {
    backgroundColor: adminColors.success.bg,
  },
  tableLabel: {
    ...adminType.body,
    color: adminColors.ink,
  },
  tableValue: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
  },
  negativeValue: {
    color: adminColors.danger.text,
  },
  boldText: {
    fontWeight: '700',
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  comparisonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  comparisonCol: {
    flex: 1,
  },
  comparisonLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  comparisonVal: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
    marginTop: 2,
  },
  vsBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '700',
  },
  growthBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    alignItems: 'center',
  },
  growthText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '800',
  },
  growthSub: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  warehouseTableCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  whTableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.sm + 4,
    paddingVertical: adminSpacing.sm,
    backgroundColor: adminColors.brandTint,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  whColHeader: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  whRowContainer: {
    paddingHorizontal: adminSpacing.sm + 4,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.xs,
  },
  whDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  whCell: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  whCellBold: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
  },
  whCellGreen: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  whSubGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.success.bg,
    borderWidth: 0.8,
    borderColor: adminColors.success.border,
    borderRadius: 6,
    paddingVertical: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  whSubCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  whSubDivider: {
    width: 1,
    height: 12,
    backgroundColor: adminColors.success.border,
  },
  whSubText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  whDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginTop: adminSpacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  modalCheckCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: adminColors.success.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  modalBody: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  modalDismissBtn: {
    marginTop: adminSpacing.md,
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.xl,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    width: '100%',
    alignItems: 'center',
  },
  modalDismissBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  /** The designed control, kept visible, drawn as unavailable (screens/community/ pattern). */
  actionUnavailable: {
    opacity: 0.5,
  },
  unavailableNote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
});
