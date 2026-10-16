/**
 * Finance Reports (BR-63): revenue and expense totals for a date range.
 *
 * Live: GET /admin/finance/reports/revenue (finance.sales_income.view) and
 * GET /admin/finance/reports/expenses (finance.expense.log), each section only
 * for a viewer holding its code. Both need `from` and `to`; the default is
 * month to date (IST). The server scopes both to the caller (Sub = own
 * warehouse, Main = all) and takes no warehouse, so there is no Main
 * warehouse filter here. The longest span is a system_config value on the
 * server: a refused span is its 422, shown through adminErrorKey.
 *
 * No export: the CSV endpoints (GET /admin/exports/finance-revenue and
 * friends) answer text/csv, and the app has no file save or share mechanism
 * to hand that file to, so an Export button would only pretend.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t, type TranslationKey } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { ChipGroup, ScopeHeader, SectionTitle, WalletScreen, WarehouseTabBar, walletLayout } from '../wallet-cashtopup/WalletParts';
import { FINANCE_CODES, FinanceNotAvailable, TableRow, scopeLabel } from './FinanceParts';
import { formatSignedPaise, istToday, type FinanceReportTotals } from './mappers';
import { REPORT_RANGE_PRESETS, reportRange, type ReportRangePreset } from './reportRanges';
import type { WarehouseScreenBaseProps } from './types';
import { useFinanceReports, type LiveQueryState } from './useFinanceData';

export interface FinanceReportsScreenProps extends WarehouseScreenBaseProps {
  /** Open the combined revenue + expense history. */
  onNavigateToHistory?: (() => void) | undefined;
}

const PRESET_LABEL: Readonly<Record<ReportRangePreset, TranslationKey>> = {
  today: 'finance.reports.preset.today',
  last7: 'finance.reports.preset.last7',
  monthToDate: 'finance.reports.preset.monthToDate',
  lastMonth: 'finance.reports.preset.lastMonth',
};

export function FinanceReportsScreen(props: FinanceReportsScreenProps) {
  const canRevenue = props.can(FINANCE_CODES.salesIncome);
  const canExpenses = props.can(FINANCE_CODES.expenseLog);
  if (!canRevenue && !canExpenses) {
    return (
      <FinanceNotAvailable title={t('finance.reports.title')} message={t('finance.reports.notAvailable')} onBack={props.onBack} />
    );
  }
  return <ReportsBody {...props} canRevenue={canRevenue} canExpenses={canExpenses} />;
}

function ReportsBody({
  scope,
  onBack,
  onTabChange,
  onNavigateToHistory,
  canRevenue,
  canExpenses,
}: FinanceReportsScreenProps & { canRevenue: boolean; canExpenses: boolean }) {
  const [preset, setPreset] = useState<ReportRangePreset>('monthToDate');
  const range = reportRange(preset, istToday());
  const reports = useFinanceReports(scope.warehouseId, range, { revenue: canRevenue, expenses: canExpenses });
  const revenue = reports.revenue.report;
  const expenses = reports.expenses.report;

  return (
    <WalletScreen
      title={t('finance.reports.title')}
      subtitle={t('finance.reports.rangeLabel', { from: formatAdminDay(range.from), to: formatAdminDay(range.to) })}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={scopeLabel(scope)} />}
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <ChipGroup options={REPORT_RANGE_PRESETS} value={preset} onChange={setPreset} labelOf={(p) => t(PRESET_LABEL[p])} />

        {revenue && expenses ? (
          <>
            <SectionTitle>{t('finance.reports.net.title')}</SectionTitle>
            <View style={styles.card}>
              <TableRow label={t('finance.reports.net.revenue')} value={formatPaise(revenue.totalPaise)} />
              <TableRow label={t('finance.reports.net.expenses')} value={formatPaise(expenses.totalPaise)} divider />
              <TableRow
                label={t('finance.reports.net.total')}
                value={formatSignedPaise(revenue.totalPaise - expenses.totalPaise)}
                total
                divider
              />
            </View>
          </>
        ) : null}

        {canRevenue ? (
          <ReportSection
            title={t('finance.reports.revenue.title')}
            emptyTitle={t('finance.reports.revenue.empty')}
            groupTitle={t('finance.reports.byChannel')}
            state={reports.revenue}
            report={revenue}
          />
        ) : null}
        {canExpenses ? (
          <ReportSection
            title={t('finance.reports.expenses.title')}
            emptyTitle={t('finance.reports.expenses.empty')}
            groupTitle={t('finance.reports.byCategory')}
            state={reports.expenses}
            report={expenses}
          />
        ) : null}

        {onNavigateToHistory ? (
          <TouchableOpacity style={styles.link} onPress={onNavigateToHistory} accessibilityRole="button" activeOpacity={0.7}>
            <Text style={styles.linkText}>{t('finance.reports.viewHistory')}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

function ReportSection({
  title,
  emptyTitle,
  groupTitle,
  state,
  report,
}: {
  title: string;
  emptyTitle: string;
  groupTitle: string;
  state: LiveQueryState;
  report: FinanceReportTotals | undefined;
}) {
  let body: React.ReactNode;
  if (report === undefined) {
    body = state.isLoading ? (
      <AdminLoadingState />
    ) : state.error != null ? (
      <AdminErrorState error={state.error} onRetry={state.refresh} />
    ) : (
      <AdminEmptyState title={emptyTitle} />
    );
  } else if (report.count === 0) {
    body = <AdminEmptyState title={emptyTitle} />;
  } else {
    const amount = (row: { totalPaise: number; count: number }) =>
      t('finance.reports.amountWithCount', { amount: formatPaise(row.totalPaise), count: String(row.count) });
    body = (
      <>
        <View style={styles.card}>
          <TableRow label={t('finance.reports.total')} value={formatPaise(report.totalPaise)} total />
          <TableRow label={t('finance.reports.count')} value={String(report.count)} divider />
        </View>
        <Text style={styles.subhead}>{groupTitle}</Text>
        <View style={styles.card}>
          {report.byGroup.map((row, index) => (
            <TableRow key={row.label} label={row.label} value={amount(row)} divider={index > 0} />
          ))}
        </View>
        <Text style={styles.subhead}>{t('finance.reports.byPaymentMethod')}</Text>
        <View style={styles.card}>
          {report.byPaymentMethod.map((row, index) => (
            <TableRow key={row.label} label={row.label} value={amount(row)} divider={index > 0} />
          ))}
        </View>
        <Text style={styles.subhead}>{t('finance.reports.byDay')}</Text>
        <View style={styles.card}>
          {report.byDay.map((row, index) => (
            <TableRow key={row.date} label={formatAdminDay(row.date)} value={amount(row)} divider={index > 0} />
          ))}
        </View>
      </>
    );
  }
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      {body}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  subhead: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  link: { alignItems: 'center', paddingVertical: adminSpacing.md },
  linkText: { ...adminType.rowTitle, color: adminColors.brandDeep },
});
