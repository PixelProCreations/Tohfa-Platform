// Design id: M11-S01
/**
 * Finance Hub (Warehouse Finance dashboard) for both warehouse roles.
 *
 * Route guard: finance.dashboard.view (MAIN_WH_ADMIN view, SUB_WH_ADMIN own).
 *
 * Every figure has a live source; a figure without one was dropped:
 *   - Revenue / expenses month to date, and their by-channel / by-category
 *     breakdowns: GET /admin/finance/reports/revenue and /expenses (BR-63),
 *     each only when the viewer holds that endpoint's code. The server scopes
 *     them (Sub = own warehouse, Main = all); neither takes a warehouse.
 *   - Net movement: only when both reports are loaded.
 *   - Expected cash today: GET /admin/finance/daily-summary (BR-74), only for
 *     a Sub admin with finance.cash_close.manage. The endpoint needs one
 *     warehouse and Main has none in scope here, so Main does not show it.
 * The old mock trend chart, "pending expenses" (no such status, BR-62), the
 * vs-yesterday delta and the cash in/out tiles had no endpoint and are gone.
 *
 * Quick actions are gated by canOpenFinanceRoute, the same check FinanceFlow
 * applies; the server re-checks every code (CLAUDE.md 2.1).
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState } from '../shared/AsyncStates';
import {
  HeaderIconButton,
  PermissionNote,
  ScopeHeader,
  SectionTitle,
  WalletScreen,
  WarehouseTabBar,
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
  TableRow,
  TrendUpIcon,
  VoucherIcon,
  WalletIcon,
  canOpenFinanceRoute,
  scopeLabel,
  type FinanceAction,
} from './FinanceParts';
import { formatSignedPaise, istToday, monthStart, type FinanceReportTotals } from './mappers';
import type { FinanceRoute, WarehouseScreenBaseProps } from './types';
import { useDailyCashSummary, useFinanceReports, type LiveQueryState } from './useFinanceData';

export interface FinanceHubScreenProps extends WarehouseScreenBaseProps {
  /** Open a finance route (FinanceFlow pushes it). */
  onOpen: (route: FinanceRoute) => void;
  /** Open the wallet & cash top-up module; without it the Wallet action is not shown. */
  onOpenWallet?: (() => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
}

export function FinanceHubScreen(props: FinanceHubScreenProps) {
  if (!props.can(FINANCE_CODES.dashboard)) {
    return (
      <FinanceNotAvailable title={t('finance.hub.title')} message={t('finance.hub.notAvailable')} onBack={props.onBack} />
    );
  }
  // Hooks live in the body so a viewer without the code never fetches.
  return <FinanceHubBody {...props} />;
}

interface Kpi {
  key: string;
  label: string;
  state: LiveQueryState;
  /** undefined while loading or failed. */
  value: string | undefined;
  hint?: string | undefined;
  tone?: 'success' | 'danger' | undefined;
  onPress?: (() => void) | undefined;
}

function FinanceHubBody({ scope, can, onBack, onTabChange, onOpen, onOpenWallet, onNavigateToNotifications }: FinanceHubScreenProps) {
  const today = istToday();
  const canRevenue = can(FINANCE_CODES.salesIncome);
  const canExpenses = can(FINANCE_CODES.expenseLog);
  const showCash = can(FINANCE_CODES.cashClose) && scope.warehouseId !== undefined;

  const reports = useFinanceReports(
    scope.warehouseId,
    { from: monthStart(today), to: today },
    { revenue: canRevenue, expenses: canExpenses },
  );
  const daily = useDailyCashSummary(scope.warehouseId, today, showCash);

  const opener = (route: FinanceRoute) => (canOpenFinanceRoute(can, route) ? () => onOpen(route) : undefined);

  const revenue = reports.revenue.report;
  const expenses = reports.expenses.report;
  const kpis: Kpi[] = [];
  if (canRevenue) {
    kpis.push({
      key: 'revenue',
      label: t('finance.hub.kpi.revenue'),
      state: reports.revenue,
      value: revenue ? formatPaise(revenue.totalPaise) : undefined,
      hint: revenue ? t('finance.hub.kpi.count', { count: String(revenue.count) }) : undefined,
      onPress: opener('Revenue'),
    });
  }
  if (canExpenses) {
    kpis.push({
      key: 'expenses',
      label: t('finance.hub.kpi.expenses'),
      state: reports.expenses,
      value: expenses ? formatPaise(expenses.totalPaise) : undefined,
      hint: expenses ? t('finance.hub.kpi.count', { count: String(expenses.count) }) : undefined,
      onPress: opener('Expenses'),
    });
  }
  if (revenue && expenses) {
    const net = revenue.totalPaise - expenses.totalPaise;
    kpis.push({
      key: 'net',
      label: t('finance.hub.kpi.net'),
      state: reports.revenue,
      value: formatSignedPaise(net),
      hint: t('finance.hub.kpi.netHint'),
      tone: net < 0 ? 'danger' : 'success',
    });
  }
  if (showCash) {
    const summary = daily.summary;
    kpis.push({
      key: 'cash',
      label: t('finance.hub.kpi.expectedCash'),
      state: daily,
      value: summary ? formatPaise(summary.expectedClosingPaise) : undefined,
      hint: summary ? (summary.closed ? t('finance.hub.kpi.dayClosed') : t('finance.hub.kpi.dayOpen')) : undefined,
      onPress: opener('DailyCash'),
    });
  }

  const iconColor = adminColors.brandDeep;
  const candidates: (FinanceAction & { route?: FinanceRoute })[] = [
    { key: 'add', route: 'AddExpense', label: t('finance.hub.action.addExpense'), icon: <PlusCircleIcon color={iconColor} />, onPress: () => onOpen('AddExpense') },
    { key: 'revenue', route: 'Revenue', label: t('finance.hub.action.revenue'), icon: <TrendUpIcon color={iconColor} />, onPress: () => onOpen('Revenue') },
    { key: 'expenses', route: 'Expenses', label: t('finance.hub.action.expenses'), icon: <ListDocIcon color={iconColor} />, onPress: () => onOpen('Expenses') },
    { key: 'categories', route: 'ExpenseCategories', label: t('finance.hub.action.categories'), icon: <GridIcon color={iconColor} />, onPress: () => onOpen('ExpenseCategories') },
    { key: 'vouchers', route: 'Vouchers', label: t('finance.hub.action.vouchers'), icon: <VoucherIcon color={iconColor} />, onPress: () => onOpen('Vouchers') },
    { key: 'daily', route: 'DailyCash', label: t('finance.hub.action.dailyCash'), icon: <DailyCashIcon color={iconColor} />, onPress: () => onOpen('DailyCash') },
    { key: 'history', route: 'FinanceHistory', label: t('finance.hub.action.history'), icon: <LedgerIcon color={iconColor} />, onPress: () => onOpen('FinanceHistory') },
    { key: 'reports', route: 'FinanceReports', label: t('finance.hub.action.reports'), icon: <ReportFileIcon color={iconColor} />, onPress: () => onOpen('FinanceReports') },
  ];
  const actions: FinanceAction[] = candidates.filter((a) => a.route === undefined || canOpenFinanceRoute(can, a.route));
  if (onOpenWallet && can(FINANCE_CODES.cashTopUp)) {
    actions.push({ key: 'wallet', label: t('finance.hub.action.wallet'), icon: <WalletIcon color={iconColor} />, onPress: onOpenWallet });
  }

  return (
    <WalletScreen
      title={t('finance.hub.title')}
      onBack={onBack}
      headerRight={
        onNavigateToNotifications ? (
          <HeaderIconButton accessibilityLabel={t('finance.hub.notifications')} onPress={onNavigateToNotifications}>
            <BellIcon />
          </HeaderIconButton>
        ) : undefined
      }
      headerExtra={<ScopeHeader scope={scope} label={t('finance.hub.scopePill', { warehouse: scopeLabel(scope) })} />}
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {kpis.length === 0 ? (
          <AdminEmptyState title={t('finance.hub.empty.title')} subtitle={t('finance.hub.empty.subtitle')} />
        ) : (
          <>
            <SectionTitle>{t('finance.hub.figures')}</SectionTitle>
            <View style={styles.kpiGrid}>
              {kpis.map((kpi) => (
                <KpiTile key={kpi.key} kpi={kpi} />
              ))}
            </View>
          </>
        )}

        {actions.length > 0 ? (
          <>
            <SectionTitle>{t('finance.hub.quickActions')}</SectionTitle>
            <ActionGrid actions={actions} columns={scope.warehouseId === undefined ? 2 : 3} />
            <PermissionNote>{t('finance.hub.permissionNote')}</PermissionNote>
          </>
        ) : null}

        {revenue && revenue.byGroup.length > 0 ? (
          <Breakdown title={t('finance.reports.byChannel')} report={revenue} onPress={opener('Revenue')} />
        ) : null}
        {expenses && expenses.byGroup.length > 0 ? (
          <Breakdown title={t('finance.reports.byCategory')} report={expenses} onPress={opener('Expenses')} />
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

function KpiTile({ kpi }: { kpi: Kpi }) {
  const failed = kpi.value === undefined && !kpi.state.isLoading && kpi.state.error != null;
  const onPress = failed ? kpi.state.refresh : kpi.onPress;
  const value =
    kpi.value ?? (kpi.state.isLoading ? t('finance.hub.kpi.loading') : failed ? t('finance.hub.kpi.retry') : '');
  return (
    <TouchableOpacity
      style={styles.kpiCard}
      onPress={onPress}
      disabled={onPress === undefined}
      activeOpacity={0.75}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <Text style={styles.kpiLabel}>{kpi.label}</Text>
      <Text
        style={[
          kpi.value === undefined ? styles.kpiPending : styles.kpiValue,
          kpi.tone === 'success' && styles.kpiSuccess,
          kpi.tone === 'danger' && styles.kpiDanger,
        ]}
      >
        {value}
      </Text>
      {kpi.hint ? <Text style={styles.kpiHint}>{kpi.hint}</Text> : null}
    </TouchableOpacity>
  );
}

/** Month-to-date total per channel / category, straight from the report (no client sums). */
function Breakdown({ title, report, onPress }: { title: string; report: FinanceReportTotals; onPress?: (() => void) | undefined }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      <TouchableOpacity style={styles.card} onPress={onPress} disabled={onPress === undefined} activeOpacity={0.8}>
        {report.byGroup.map((row, index) => (
          <TableRow key={row.label} label={row.label} value={formatPaise(row.totalPaise)} divider={index > 0} />
        ))}
        <TableRow label={t('finance.reports.total')} value={formatPaise(report.totalPaise)} total divider />
      </TouchableOpacity>
    </>
  );
}

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
  kpiLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs },
  kpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  kpiPending: { ...adminType.body, color: adminColors.muted },
  kpiSuccess: { color: adminColors.success.text },
  kpiDanger: { color: adminColors.danger.text },
  kpiHint: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
});
