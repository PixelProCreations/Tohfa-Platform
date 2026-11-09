// Design id: M11-S01
/**
 * Finance Hub (Warehouse Finance dashboard). Serves both warehouse roles: it
 * was SubWarehouseFinanceScreen and absorbs MainWarehouseFinanceScreen.
 *
 * Route guard: finance.dashboard.view (rbac 1.2.0: MAIN_WH_ADMIN view,
 * SUB_WH_ADMIN own, owner decision 2026-10-09). Without it the hub renders a
 * "not available" state and nothing else.
 *
 * Scope: a Sub scope is locked to its own warehouse (the hard-wired 'Coonoor
 * Warehouse · Today' pill now reads scope.warehouseName); the server must
 * apply the warehouse_id filter for SUB. Main (warehouseId undefined) shows
 * the 'All Warehouses' pill and, ported from the Main hub, the cash-balance
 * tile, the two-column quick-action grid and the "categories mirror S06" note.
 *
 * Each quick action and each tappable KPI/breakdown is gated by the code of
 * the screen it opens (the old comment "actions reflect SWA's granted
 * permissions" is now true):
 *   Add Expense / Expenses / Categories   finance.expense.log
 *   Revenue                                finance.sales_income.view
 *   Vouchers, Daily Cash, History          expense.log OR sales_income.view
 *                                          (no own code; SPEC_GAPS)
 *   Reports                                report.export.file
 *   Wallet                                 wallet.cash_topup.process (and a host that opens it)
 * A hidden action is never shown active and blocked later; the server
 * re-checks every code anyway (CLAUDE.md 2.1).
 *
 * Navigation is FinanceFlow's job: this screen only reports which route the
 * viewer picked (`onOpen`).
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { OverviewDashboardCard } from '../../../components';
import { WarehouseSelector } from '../inventory/WarehouseSelector';
import {
  BellRingIcon,
  HeaderIconButton,
  InfoNote,
  isAllWarehouses,
  ScopeHeader,
  SectionTitle,
  WarehouseTabBar,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  ActionGrid,
  BellIcon,
  BuildingWarehouseIcon,
  CreditCardPlusIcon,
  DailyCashIcon,
  FINANCE_CODES,
  FinanceNotAvailable,
  GridIcon,
  HistoryClockIcon,
  LedgerIcon,
  ListDocIcon,
  PlusCircleIcon,
  ReportFileIcon,
  ScaleIcon,
  ShapesCategoryIcon,
  ShieldIcon,
  TableRow,
  TrendDownIcon,
  TrendUpIcon,
  TruckIcon,
  VoucherIcon,
  WalletIcon,
  scopeLabel,
  type FinanceAction,
} from './FinanceParts';
import { FINANCE_WAREHOUSES } from './fixtures';
import type { FinanceRoute, PermissionCheck, WarehouseScreenBaseProps } from './types';

type TrendTab = 'Revenue' | 'Expenses' | 'Net';

/** Bar heights (percent of the chart) of the mock 6-day trend. */
const TREND_BARS: Record<TrendTab, readonly number[]> = {
  Revenue: [55, 70, 60, 85, 75, 95],
  Expenses: [40, 50, 35, 45, 65, 75],
  Net: [65, 80, 45, 75, 85, 100],
};
const TREND_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const TREND_AXIS = ['30k', '20k', '10k', '0'] as const;
const TREND_CAPTION: Record<TrendTab, string> = {
  Revenue: 'Revenue trend chart: daily revenue for selected period',
  Expenses: 'Expense trend chart: daily expenses for selected period',
  Net: 'Net movement chart: daily net for selected period',
};

/** Which code(s) unlock a hub route: any one is enough. */
const ROUTE_CODES: Partial<Record<FinanceRoute, readonly string[]>> = {
  Revenue: [FINANCE_CODES.salesIncome],
  RevenueDetail: [FINANCE_CODES.salesIncome],
  Expenses: [FINANCE_CODES.expenseLog],
  AddExpense: [FINANCE_CODES.expenseLog],
  ExpenseDetail: [FINANCE_CODES.expenseLog],
  ExpenseCategories: [FINANCE_CODES.expenseLog],
  Vouchers: [FINANCE_CODES.expenseLog, FINANCE_CODES.salesIncome],
  VoucherDetail: [FINANCE_CODES.expenseLog, FINANCE_CODES.salesIncome],
  DailyCash: [FINANCE_CODES.salesIncome, FINANCE_CODES.expenseLog],
  FinanceHistory: [FINANCE_CODES.salesIncome, FINANCE_CODES.expenseLog],
  FinanceReports: [FINANCE_CODES.reportExport],
  FinanceHub: [FINANCE_CODES.dashboard],
};

/** True when the viewer may open `route` (FinanceFlow applies the same check). */
export function canOpenFinanceRoute(can: PermissionCheck, route: FinanceRoute): boolean {
  const codes = ROUTE_CODES[route];
  return codes === undefined || codes.some((code) => can(code));
}

export interface FinanceHubScreenProps extends WarehouseScreenBaseProps {
  /** Open a finance route (FinanceFlow pushes it). */
  onOpen: (route: FinanceRoute, warehouseId?: string | undefined) => void;
  /** Open the wallet & cash top-up module; without it the Wallet action is not shown. */
  onOpenWallet?: (() => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
}

export function FinanceHubScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onOpen,
  onOpenWallet,
  onNavigateToNotifications,
}: FinanceHubScreenProps) {
  const [trendTab, setTrendTab] = useState<TrendTab>('Revenue');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  if (!can(FINANCE_CODES.dashboard)) {
    return (
      <FinanceNotAvailable
        title="Warehouse Finance"
        message="Your role does not include the finance dashboard."
        onBack={onBack}
      />
    );
  }

  const isMain = isAllWarehouses(scope);
  const allowed = (route: FinanceRoute) => canOpenFinanceRoute(can, route);
  /** onPress for a tappable tile: undefined (not tappable) when the viewer may not open it. */
  const opener = (route: FinanceRoute) =>
    allowed(route) ? () => onOpen(route, selectedWarehouseId) : undefined;

  const iconColor = adminColors.brandDeep;
  const candidates: (FinanceAction & { route?: FinanceRoute })[] = [
    { key: 'add', route: 'AddExpense', label: 'Add Expense', icon: isMain ? <CreditCardPlusIcon color={iconColor} /> : <PlusCircleIcon color={iconColor} />, onPress: () => onOpen('AddExpense', selectedWarehouseId) },
    { key: 'revenue', route: 'Revenue', label: isMain ? 'Revenue' : 'View Revenue', icon: <TrendUpIcon color={iconColor} />, onPress: () => onOpen('Revenue', selectedWarehouseId) },
    { key: 'expenses', route: 'Expenses', label: isMain ? 'Expenses' : 'View Expenses', icon: isMain ? <TrendDownIcon color={iconColor} /> : <ListDocIcon color={iconColor} />, onPress: () => onOpen('Expenses', selectedWarehouseId) },
    { key: 'categories', route: 'ExpenseCategories', label: 'Categories', icon: <ShapesCategoryIcon color={iconColor} />, onPress: () => onOpen('ExpenseCategories', selectedWarehouseId) },
    { key: 'vouchers', route: 'Vouchers', label: 'Vouchers', icon: <VoucherIcon color={iconColor} />, onPress: () => onOpen('Vouchers', selectedWarehouseId) },
    { key: 'daily', route: 'DailyCash', label: 'Daily Cash', icon: isMain ? <ScaleIcon color={iconColor} /> : <DailyCashIcon color={iconColor} />, onPress: () => onOpen('DailyCash', selectedWarehouseId) },
    { key: 'history', route: 'FinanceHistory', label: isMain ? 'History' : 'Finance History', icon: isMain ? <HistoryClockIcon color={iconColor} /> : <LedgerIcon color={iconColor} />, onPress: () => onOpen('FinanceHistory', selectedWarehouseId) },
    { key: 'reports', route: 'FinanceReports', label: isMain ? 'Reports' : 'Finance Reports', icon: <ReportFileIcon color={iconColor} />, onPress: () => onOpen('FinanceReports', selectedWarehouseId) },
  ];
  const SUB_ORDER = ['add', 'revenue', 'expenses', 'daily', 'reports', 'history'];
  const MAIN_ORDER = ['revenue', 'expenses', 'add', 'categories', 'vouchers', 'daily', 'history', 'reports'];
  const order = isMain ? MAIN_ORDER : SUB_ORDER;
  const actions = candidates
    .filter((a) => (isMain ? MAIN_ORDER.includes(a.key) : SUB_ORDER.includes(a.key)))
    .filter((a) => a.route === undefined || allowed(a.route))
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  // Per-warehouse calculations for Main Warehouse
  const WAREHOUSE_FINANCE_METRICS: Record<
    string,
    {
      revenue: string;
      expenses: string;
      net: string;
      cashBalance: string;
      revenueBreakdown: { direct: string; orders: string; other: string; total: string };
      expenseBreakdown: { label: string; value: string }[];
      totalExpenses: string;
    }
  > = {
    All: {
      revenue: '₹24,850',
      expenses: '₹6,420',
      net: '₹18,430',
      cashBalance: '₹22,080',
      revenueBreakdown: { direct: '₹9,850', orders: '₹12,400', other: '₹2,600', total: '₹24,850' },
      expenseBreakdown: [
        { label: 'Transport', value: '₹2,400' },
        { label: 'Loading / Unloading', value: '₹1,800' },
        { label: 'Warehouse Operations', value: '₹1,200' },
        { label: 'Utilities', value: '₹620' },
        { label: 'Maintenance', value: '₹400' },
      ],
      totalExpenses: '₹6,420',
    },
    'WH-OOTY': {
      revenue: '₹10,800',
      expenses: '₹2,400',
      net: '₹8,400',
      cashBalance: '₹9,500',
      revenueBreakdown: { direct: '₹4,200', orders: '₹6,600', other: '₹0', total: '₹10,800' },
      expenseBreakdown: [
        { label: 'Transport', value: '₹1,200' },
        { label: 'Loading / Unloading', value: '₹700' },
        { label: 'Utilities', value: '₹500' },
      ],
      totalExpenses: '₹2,400',
    },
    'WH-COON': {
      revenue: '₹8,200',
      expenses: '₹2,420',
      net: '₹5,780',
      cashBalance: '₹7,180',
      revenueBreakdown: { direct: '₹6,300', orders: '₹1,900', other: '₹0', total: '₹8,200' },
      expenseBreakdown: [
        { label: 'Transport', value: '₹1,200' },
        { label: 'Loading / Unloading', value: '₹600' },
        { label: 'Utilities', value: '₹620' },
      ],
      totalExpenses: '₹2,420',
    },
    'WH-KOTA': {
      revenue: '₹2,600',
      expenses: '₹800',
      net: '₹1,800',
      cashBalance: '₹3,000',
      revenueBreakdown: { direct: '₹0', orders: '₹0', other: '₹2,600', total: '₹2,600' },
      expenseBreakdown: [
        { label: 'Warehouse Operations', value: '₹500' },
        { label: 'Maintenance', value: '₹300' },
      ],
      totalExpenses: '₹800',
    },
    'WH-GUDA': {
      revenue: '₹3,250',
      expenses: '₹800',
      net: '₹2,450',
      cashBalance: '₹2,400',
      revenueBreakdown: { direct: '₹3,250', orders: '₹0', other: '₹0', total: '₹3,250' },
      expenseBreakdown: [
        { label: 'Loading / Unloading', value: '₹500' },
        { label: 'Maintenance', value: '₹100' },
        { label: 'Utilities', value: '₹200' },
      ],
      totalExpenses: '₹800',
    },
  };

  const DEFAULT_METRICS = WAREHOUSE_FINANCE_METRICS.All!;
  const selectedMetrics =
    (selectedWarehouseId && WAREHOUSE_FINANCE_METRICS[selectedWarehouseId]) ||
    DEFAULT_METRICS;

  const kpiItems: { label: string; value: string; tone?: 'success'; delta?: string }[] = isMain
    ? [
        { label: 'REVENUE', value: selectedMetrics.revenue },
        { label: 'EXPENSES', value: selectedMetrics.expenses },
        { label: 'NET MOVEMENT', value: selectedMetrics.net, tone: 'success' },
        { label: 'CASH BALANCE', value: selectedMetrics.cashBalance },
      ]
    : [
        { label: "TODAY'S REVENUE", value: '₹24,850', delta: '↑ 8.4% vs yesterday' },
        { label: "TODAY'S EXPENSES", value: '₹6,420' },
        { label: 'NET MOVEMENT', value: '₹18,430', tone: 'success' },
        { label: 'PENDING EXPENSES', value: '8' },
        { label: 'CASH IN', value: '₹12,500' },
        { label: 'CASH OUT', value: '₹6,420' },
      ];

  const expenseRows = isMain
    ? selectedMetrics.expenseBreakdown
    : [
        { label: 'Transport', value: '₹2,400' },
        { label: 'Loading / Unloading', value: '₹1,800' },
        { label: 'Warehouse Operations', value: '₹1,200' },
        { label: 'Utilities', value: '₹620' },
        { label: 'Maintenance', value: '₹400' },
      ];

  const revenueBreakdown = isMain
    ? selectedMetrics.revenueBreakdown
    : { direct: '₹9,850', orders: '₹12,400', other: '₹2,600', total: '₹24,850' };

  const revenuePress = opener('Revenue');
  const expensesPress = opener('Expenses');
  const historyPress = opener('FinanceHistory');
  const categoriesPress = opener('ExpenseCategories');

  return (
    <WalletScreen
      title={
        <View style={styles.headerTitleRow}>
          {isMain ? (
            <BuildingWarehouseIcon size={20} color={adminColors.onBrand} />
          ) : (
            <GridIcon size={20} color={adminColors.onBrand} />
          )}
          <Text style={styles.headerTitleText}>Warehouse Finance</Text>
        </View>
      }
      onBack={onBack}
      headerRight={
        <HeaderIconButton
          accessibilityLabel="Notifications"
          onPress={() => {
            if (onNavigateToNotifications) onNavigateToNotifications();
            else Alert.alert('Notifications', '3 unread finance notifications.');
          }}
        >
          <BellRingIcon size={20} color={adminColors.onBrand} />
        </HeaderIconButton>
      }
      headerExtra={
        isMain ? (
          <WarehouseSelector
            scope={scope}
            options={FINANCE_WAREHOUSES}
            selectedId={selectedWarehouseId}
            onSelect={setSelectedWarehouseId}
          />
        ) : (
          <ScopeHeader scope={scope} label={`${scopeLabel(scope)} · Today`} />
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiGrid}>
          {kpiItems.map((item) => (
            <View key={item.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{item.label}</Text>
              <Text style={[styles.kpiValue, item.tone === 'success' && styles.kpiValueSuccess]}>
                {item.value}
              </Text>
              {item.delta ? <Text style={styles.kpiDelta}>{item.delta}</Text> : null}
            </View>
          ))}
        </View>

        {!isMain ? (
          <View style={{ marginBottom: adminSpacing.md }}>
            <InfoNote tone="info">
              Net Movement is calculated from backend financial records — never manually entered.
            </InfoNote>
          </View>
        ) : null}

        {isMain ? (
          <>
            {actions.length > 0 ? (
              <>
                <SectionTitle>Quick Actions</SectionTitle>
                <ActionGrid actions={actions} columns={2} />
              </>
            ) : null}

            {can(FINANCE_CODES.expenseLog) ? (
              <>
                <Text style={styles.sectionHeading}>Expense Breakdown</Text>
                <TouchableOpacity style={styles.card} onPress={expensesPress} disabled={expensesPress === undefined} activeOpacity={0.8}>
                  <TableRow label="Transport" value={selectedMetrics.expenseBreakdown[0]?.value ?? '₹2,400'} />
                  <TableRow label="Loading / Unloading" value={selectedMetrics.expenseBreakdown[1]?.value ?? '₹1,800'} divider />
                  <TableRow label="Total Expenses" value={selectedMetrics.totalExpenses} total divider />
                </TouchableOpacity>
              </>
            ) : null}
          </>
        ) : (
          <>
            {can(FINANCE_CODES.salesIncome) ? (
              <>
                <Text style={styles.sectionHeading}>Revenue Breakdown</Text>
                <TouchableOpacity style={styles.card} onPress={revenuePress} disabled={revenuePress === undefined} activeOpacity={0.8}>
                  <TableRow label="Direct / Market Sales" value={revenueBreakdown.direct} />
                  <TableRow label="Customer Orders" value={revenueBreakdown.orders} divider />
                  <TableRow label="Other channels" value={revenueBreakdown.other} divider />
                  <TableRow label="Total Revenue" value={revenueBreakdown.total} total divider />
                </TouchableOpacity>
              </>
            ) : null}

            {can(FINANCE_CODES.expenseLog) ? (
              <>
                <Text style={styles.sectionHeading}>Expense Breakdown</Text>
                <TouchableOpacity style={styles.card} onPress={expensesPress} disabled={expensesPress === undefined} activeOpacity={0.8}>
                  {expenseRows.map((row, index) => (
                    <TableRow key={row.label} label={row.label} value={row.value} divider={index > 0} />
                  ))}
                  <TableRow label="Total Expenses" value="₹6,420" total divider />
                </TouchableOpacity>
              </>
            ) : null}

            <SectionTitle
              right={
                historyPress ? (
                  <TouchableOpacity onPress={historyPress} activeOpacity={0.7} hitSlop={HIT_SLOP}>
                    <Text style={styles.sectionAction}>History ›</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            >
              Financial Trend
            </SectionTitle>
            <View style={styles.trendPills}>
              {(Object.keys(TREND_BARS) as TrendTab[]).map((tab) => {
                const active = tab === trendTab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.trendPill, active && styles.trendPillActive]}
                    onPress={() => setTrendTab(tab)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.trendPillText, active && styles.trendPillTextActive]}>{tab}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={styles.card} onPress={historyPress} disabled={historyPress === undefined} activeOpacity={0.85}>
              <View style={styles.chartRow}>
                <View style={styles.chartAxis}>
                  {TREND_AXIS.map((label) => (
                    <Text key={label} style={styles.chartAxisText}>
                      {label}
                    </Text>
                  ))}
                </View>
                <View style={styles.chartBody}>
                  <View style={styles.chartBars}>
                    {TREND_BARS[trendTab].map((height, index) => (
                      <View
                        key={TREND_DAYS[index]}
                        style={[
                          styles.bar,
                          { height: `${height}%` },
                          index === TREND_DAYS.length - 1 && styles.barToday,
                        ]}
                      />
                    ))}
                  </View>
                  <View style={styles.chartDays}>
                    {TREND_DAYS.map((day, index) => (
                      <Text key={day} style={[styles.chartAxisText, index === TREND_DAYS.length - 1 && styles.chartDayToday]}>
                        {day}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
              <Text style={styles.chartCaption}>{TREND_CAPTION[trendTab]}</Text>
            </TouchableOpacity>

            <SectionTitle
              right={
                historyPress ? (
                  <TouchableOpacity onPress={historyPress} activeOpacity={0.7} hitSlop={HIT_SLOP}>
                    <Text style={styles.sectionAction}>View All ›</Text>
                  </TouchableOpacity>
                ) : undefined
              }
            >
              Recent Finance Activity
            </SectionTitle>
            <TouchableOpacity style={styles.card} onPress={historyPress} disabled={historyPress === undefined} activeOpacity={0.8}>
              {can(FINANCE_CODES.salesIncome) ? (
                <View style={styles.activityRow}>
                  <View style={[styles.activityIcon, styles.activityIconRevenue]}>
                    <TrendUpIcon size={18} color={adminColors.success.text} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityCode}>REV-000845</Text>
                    <Text style={styles.activityMeta}>Market Sale</Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={[styles.activityAmount, styles.amountCredit]}>+₹3,450</Text>
                    <Text style={styles.activityMeta}>Today, 11:20 AM</Text>
                  </View>
                </View>
              ) : null}
              {can(FINANCE_CODES.expenseLog) ? (
                <View style={[styles.activityRow, can(FINANCE_CODES.salesIncome) && styles.activityDivided]}>
                  <View style={[styles.activityIcon, styles.activityIconExpense]}>
                    <TruckIcon size={18} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityCode}>EXP-000124</Text>
                    <Text style={styles.activityMeta}>Transport Expense</Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={[styles.activityAmount, styles.amountDebit]}>-₹1,200</Text>
                    <Text style={styles.activityMeta}>Today, 10:42 AM</Text>
                  </View>
                </View>
              ) : null}
            </TouchableOpacity>

            {actions.length > 0 ? (
              <>
                <SectionTitle>Quick Actions</SectionTitle>
                <ActionGrid actions={actions} columns={3} />
              </>
            ) : null}
          </>
        )}

        {isMain ? (
          <InfoNote tone="warning" icon={<ShieldIcon />}>
            Quick Actions shown here reflect your granted permissions: an action you are not granted is hidden, never
            shown active and blocked later.
          </InfoNote>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
const CHART_HEIGHT = 108;
const CHART_AXIS_WIDTH = 36;

const styles = StyleSheet.create({
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitleText: { ...adminType.title, color: adminColors.onBrand, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: adminSpacing.md },
  kpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  kpiLabel: { ...adminType.caption, color: adminColors.muted, letterSpacing: 0.5, marginBottom: adminSpacing.xs, fontWeight: '700' },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  kpiValueSuccess: { color: adminColors.success.text },
  kpiDelta: { ...adminType.caption, color: adminColors.success.text, marginTop: 2, fontWeight: '700' },

  sectionHeading: {
    ...adminType.title,
    color: adminColors.ink,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
  },
  sectionAction: { ...adminType.rowTitle, color: adminColors.brand },

  trendPills: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.sm },
  trendPill: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
  },
  trendPillActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  trendPillText: { ...adminType.caption, color: adminColors.muted },
  trendPillTextActive: { color: adminColors.brandDeep },
  chartRow: { flexDirection: 'row', height: CHART_HEIGHT + 30, paddingTop: adminSpacing.md },
  chartAxis: { width: CHART_AXIS_WIDTH, justifyContent: 'space-between', paddingBottom: 22 },
  chartAxisText: { ...adminType.caption, color: adminColors.muted },
  chartBody: { flex: 1 },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  // The old light bars used a hardcoded light orange: brandTint is
  // too close to the card, so the bars use the border tone and today's bar the brand.
  bar: { flex: 1, backgroundColor: adminColors.border, borderRadius: adminRadius.xs },
  barToday: { backgroundColor: adminColors.brand },
  chartDays: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6 },
  chartDayToday: { color: adminColors.brandDeep },
  chartCaption: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    textAlign: 'center',
    marginVertical: adminSpacing.sm,
  },

  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: adminSpacing.sm },
  activityDivided: { borderTopWidth: 1, borderTopColor: adminColors.border },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  activityIconRevenue: { backgroundColor: adminColors.success.bg },
  activityIconExpense: { backgroundColor: adminColors.brandTint },
  activityInfo: { flex: 1 },
  activityCode: { ...adminType.rowTitle, color: adminColors.ink },
  activityMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  activityRight: { alignItems: 'flex-end' },
  activityAmount: { ...adminType.rowTitle },
  amountCredit: { color: adminColors.success.text },
  amountDebit: { color: adminColors.danger.text },
});
