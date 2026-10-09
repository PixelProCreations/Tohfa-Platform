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
import {
  HeaderIconButton,
  InfoNote,
  isAllWarehouses,
  ScopeHeader,
  SectionTitle,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  ActionGrid,
  BellIcon,
  DailyCashIcon,
  FINANCE_CODES,
  FinanceNotAvailable,
  GridIcon,
  LedgerIcon,
  ListDocIcon,
  PlusCircleIcon,
  ReportFileIcon,
  ShieldIcon,
  TableRow,
  TrendUpIcon,
  TruckIcon,
  VoucherIcon,
  WalletIcon,
  scopeLabel,
  type FinanceAction,
} from './FinanceParts';
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
  onOpen: (route: FinanceRoute) => void;
  /** Open the wallet & cash top-up module; without it the Wallet action is not shown. */
  onOpenWallet?: (() => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
}

export function FinanceHubScreen({
  scope,
  can,
  onBack,
  onOpen,
  onOpenWallet,
  onNavigateToNotifications,
}: FinanceHubScreenProps) {
  const [trendTab, setTrendTab] = useState<TrendTab>('Revenue');

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
  const opener = (route: FinanceRoute) => (allowed(route) ? () => onOpen(route) : undefined);

  const iconColor = adminColors.brandDeep;
  const candidates: (FinanceAction & { route?: FinanceRoute })[] = [
    { key: 'add', route: 'AddExpense', label: 'Add Expense', icon: <PlusCircleIcon color={iconColor} />, onPress: () => onOpen('AddExpense') },
    { key: 'revenue', route: 'Revenue', label: isMain ? 'Revenue' : 'View Revenue', icon: <TrendUpIcon color={iconColor} />, onPress: () => onOpen('Revenue') },
    { key: 'expenses', route: 'Expenses', label: isMain ? 'Expenses' : 'View Expenses', icon: <ListDocIcon color={iconColor} />, onPress: () => onOpen('Expenses') },
    { key: 'categories', route: 'ExpenseCategories', label: 'Categories', icon: <GridIcon color={iconColor} />, onPress: () => onOpen('ExpenseCategories') },
    { key: 'vouchers', route: 'Vouchers', label: 'Vouchers', icon: <VoucherIcon color={iconColor} />, onPress: () => onOpen('Vouchers') },
    { key: 'daily', route: 'DailyCash', label: 'Daily Cash', icon: <DailyCashIcon color={iconColor} />, onPress: () => onOpen('DailyCash') },
    { key: 'history', route: 'FinanceHistory', label: isMain ? 'History' : 'Finance History', icon: <LedgerIcon color={iconColor} />, onPress: () => onOpen('FinanceHistory') },
    { key: 'reports', route: 'FinanceReports', label: isMain ? 'Reports' : 'Finance Reports', icon: <ReportFileIcon color={iconColor} />, onPress: () => onOpen('FinanceReports') },
  ];
  if (onOpenWallet && can(FINANCE_CODES.cashTopUp)) {
    candidates.push({ key: 'wallet', label: 'Wallet', icon: <WalletIcon color={iconColor} />, onPress: onOpenWallet });
  }
  // Sub's hub led with expense/revenue/expenses then daily cash/history/reports; Main's grid is its own order.
  const SUB_ORDER = ['add', 'revenue', 'expenses', 'daily', 'history', 'reports', 'categories', 'vouchers', 'wallet'];
  const MAIN_ORDER = ['revenue', 'expenses', 'add', 'categories', 'vouchers', 'daily', 'history', 'reports', 'wallet'];
  const order = isMain ? MAIN_ORDER : SUB_ORDER;
  const actions = candidates
    .filter((a) => a.route === undefined || allowed(a.route))
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  const kpis: { label: string; value: string; tone?: 'success'; route?: FinanceRoute; delta?: string }[] = isMain
    ? [
        { label: 'REVENUE', value: '₹24,850', route: 'Revenue' },
        { label: 'EXPENSES', value: '₹6,420', route: 'Expenses' },
        { label: 'NET MOVEMENT', value: '₹18,430', tone: 'success' },
        { label: 'CASH BALANCE', value: '₹22,080' },
      ]
    : [
        { label: "TODAY'S REVENUE", value: '₹24,850', route: 'Revenue', delta: '↑ 8.4% vs yesterday' },
        { label: "TODAY'S EXPENSES", value: '₹6,420', route: 'Expenses' },
        { label: 'NET MOVEMENT', value: '₹18,430', tone: 'success' },
        { label: 'PENDING EXPENSES', value: '8', route: 'Expenses' },
        { label: 'CASH IN', value: '₹12,500' },
        { label: 'CASH OUT', value: '₹6,420', route: 'Expenses' },
      ];

  const expenseRows = [
    { label: 'Transport', value: '₹2,400' },
    { label: 'Loading / Unloading', value: '₹1,800' },
    { label: 'Warehouse Operations', value: '₹1,200' },
    { label: 'Utilities', value: '₹620' },
    { label: 'Maintenance', value: '₹400' },
  ];

  const revenuePress = opener('Revenue');
  const expensesPress = opener('Expenses');
  const historyPress = opener('FinanceHistory');
  const categoriesPress = opener('ExpenseCategories');

  return (
    <WalletScreen
      title="Warehouse Finance"
      onBack={onBack}
      headerRight={
        <HeaderIconButton
          accessibilityLabel="Notifications"
          onPress={() => {
            if (onNavigateToNotifications) onNavigateToNotifications();
            else Alert.alert('Notifications', '3 unread finance notifications.');
          }}
        >
          <BellIcon />
        </HeaderIconButton>
      }
      headerExtra={<ScopeHeader scope={scope} label={isMain ? 'All Warehouses' : `${scopeLabel(scope)} · Today`} />}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => {
            const onPress = kpi.route ? opener(kpi.route) : undefined;
            return (
              <TouchableOpacity
                key={kpi.label}
                style={styles.kpiCard}
                onPress={onPress}
                disabled={onPress === undefined}
                activeOpacity={0.75}
              >
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={[styles.kpiValue, kpi.tone === 'success' && styles.kpiValueSuccess]}>{kpi.value}</Text>
                {kpi.delta ? <Text style={styles.kpiDelta}>{kpi.delta}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {isMain && actions.length > 0 ? (
          <>
            <SectionTitle>Quick Actions</SectionTitle>
            <ActionGrid actions={actions} columns={2} />
          </>
        ) : null}

        {can(FINANCE_CODES.salesIncome) ? (
          <>
            <SectionTitle>Revenue Breakdown</SectionTitle>
            <TouchableOpacity style={styles.card} onPress={revenuePress} disabled={revenuePress === undefined} activeOpacity={0.8}>
              <TableRow label="Direct / Market Sales" value="₹9,850" />
              <TableRow label="Customer Orders" value="₹12,400" divider />
              <TableRow label="Other channels" value="₹2,600" divider />
              <TableRow label="Total Revenue" value="₹24,850" total divider />
            </TouchableOpacity>
          </>
        ) : null}

        {can(FINANCE_CODES.expenseLog) ? (
          <>
            <SectionTitle>Expense Breakdown</SectionTitle>
            <TouchableOpacity style={styles.card} onPress={expensesPress} disabled={expensesPress === undefined} activeOpacity={0.8}>
              {expenseRows.map((row, index) => (
                <TableRow key={row.label} label={row.label} value={row.value} divider={index > 0} />
              ))}
              <TableRow label="Total Expenses" value="₹6,420" total divider />
            </TouchableOpacity>

            <TouchableOpacity onPress={categoriesPress} disabled={categoriesPress === undefined} activeOpacity={0.8}>
              <InfoNote tone={isMain ? 'brandSoft' : 'info'}>
                {isMain
                  ? 'Categories mirror Expense Categories (S06) exactly; they are never invented independently on this dashboard.'
                  : 'Categories are sourced from the configurable Expense Categories screen (S06); tap to view them.'}
              </InfoNote>
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

        {isMain ? null : (
          <>
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

        <InfoNote tone="warning" icon={<ShieldIcon />}>
          Quick Actions shown here reflect your granted permissions: an action you are not granted is hidden, never
          shown active and blocked later.
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };
const CHART_HEIGHT = 108;
const CHART_AXIS_WIDTH = 36;

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.xs },
  kpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  kpiLabel: { ...adminType.caption, color: adminColors.muted, letterSpacing: 0.5, marginBottom: adminSpacing.xs },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  kpiValueSuccess: { color: adminColors.success.text },
  kpiDelta: { ...adminType.caption, color: adminColors.success.text, marginTop: 2 },

  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
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
  // The old light bars were #FCD9CE (a light orange off the palette): brandTint is
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
