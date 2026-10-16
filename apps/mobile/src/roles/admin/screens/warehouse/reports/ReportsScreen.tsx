/**
 * ReportsScreen (design module M12): the warehouse reports hub and its inline
 * report views, for the Main and Sub Warehouse Admins.
 *
 * Every number comes from a live endpoint through ./useReportsData.ts:
 *   GET /admin/reports/{sales,inventory,receiving,customers,cash-topups,returns}
 *   GET /admin/finance/reports/{revenue,expenses}
 * The summary view only re-reads those same queries.
 *
 * Rules:
 *   - Scope: a Sub admin is pinned to its warehouse (BR-30, BR-64a); a Main
 *     admin picks one warehouse from GET /warehouses or all (BR-64b). Only a
 *     uuid is ever sent (mappers.ts reportsWarehouseFilter).
 *   - from and to are always both sent, from the preset chips (BR-64e).
 *   - Money is integer paise, quantities integer grams (BR-64g).
 *   - The customer report is counts only (BR-64d, BR-16).
 *   - Each card is gated on the code its route requires (constants.ts).
 *   - No CSV export: GET /admin/exports/<report> answers text/csv and the app
 *     has no file save / share mechanism (see constants.ts).
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { ReportChannel } from '../../../api/reports';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScope, WarehouseScreenBaseProps } from '../finance-expenses';
import { AdminEmptyState, AdminErrorState } from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { visibleReportSections } from './constants';
import { reportChannelLabel, reportStatusLabel } from './mappers';
import {
  ArrowBackIcon,
  BellHeaderIcon,
  ChevronRightIcon,
  ChipRow,
  DataRow,
  KpiGrid,
  KpiTile,
  LockBadgeIcon,
  ReportDocHeaderIcon,
  ReportView,
  RowStack,
  SearchIcon,
  SectionTitle,
  reportStyles,
  type ChipOption,
} from './ReportsParts';
import type { ReportCode, ReportPreset, ReportScreenType } from './types';
import { enabledReports, useReportsData, type ReportsData } from './useReportsData';

export interface ReportsScreenProps extends WarehouseScreenBaseProps {
  /** Kept for hosts that still pass it; there is no export in the app (see constants.ts). */
  canExport?: boolean | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Kept for hosts that still pass it; the hub opens its own views. */
  onSelectReport?: ((reportKey: string) => void) | undefined;
  /**
   * Main warehouse choices. Omitted (the normal case) = the live GET /warehouses
   * list. Ignored for a Sub scope (BR-30).
   */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

const PRESETS: readonly ReportPreset[] = ['Today', 'Week', 'Month'];
/** GET /admin/reports/sales `channel` values (reports.schema.ts orderChannels). */
const SALES_CHANNELS: readonly ReportChannel[] = ['ONLINE', 'MARKET', 'HORECA', 'B2B'];
const ALL = 'ALL';
type ChannelChoice = ReportChannel | typeof ALL;

const VIEW_OF: Record<ReportCode, ReportScreenType> = {
  SALES_REPORT: 'sales_report',
  INVENTORY_REPORT: 'inventory_report',
  RECEIVING_REPORT: 'receiving_report',
  CUSTOMER_REPORT: 'customer_report',
  REVENUE_REPORT: 'revenue_report',
  EXPENSE_REPORT: 'expense_report',
  CASH_TOPUP_REPORT: 'cash_topup_report',
  RETURNS_REPORT: 'returns_report',
  SUMMARY_REPORT: 'summary_report',
};

const count = (key: Parameters<typeof t>[0], n: number) => t(key, { count: n });
const kg = (qty: string) => t('reports.unit.kg', { qty });

export function ReportsScreen({ onBack, onNavigateToNotifications, scope, can, warehouseOptions }: ReportsScreenProps) {
  const [view, setView] = useState<ReportScreenType>('main');
  const [preset, setPreset] = useState<ReportPreset>('Today');
  const [searchQuery, setSearchQuery] = useState('');
  const [channel, setChannel] = useState<ChannelChoice>(ALL);

  const isMain = scope.warehouseId === undefined;
  const pickerAllowed = isMain && can('warehouse.all.view');
  const live = useWarehouseOptions({ enabled: pickerAllowed && warehouseOptions === undefined });
  const options: readonly WarehouseScope[] = useMemo(
    () =>
      warehouseOptions ??
      live.options.map((o) => ({ warehouseId: o.warehouseId, warehouseName: o.warehouseName, warehouseCode: o.warehouseCode })),
    [warehouseOptions, live.options],
  );
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(ALL);

  const data = useReportsData(
    scope,
    selectedWarehouseId === ALL ? undefined : selectedWarehouseId,
    preset,
    can,
    channel === ALL ? undefined : channel,
  );

  const allLabel = t('reports.scope.allWarehouses');
  const warehouseLabel = isMain
    ? (options.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName ?? allLabel)
    : (scope.warehouseName ?? t('reports.scope.myWarehouse'));
  const rangeSubtitle = t('reports.rangeSubtitle', { warehouse: warehouseLabel, from: data.from, to: data.to });
  // The finance reports take no warehouseId: the server scopes them to the caller.
  const financeSubtitle = isMain
    ? t('reports.finance.scopeSubtitle', { from: data.from, to: data.to })
    : rangeSubtitle;

  const sections = useMemo(() => visibleReportSections(can), [can]);
  const openReport = (code: ReportCode) => {
    setSearchQuery('');
    setView(VIEW_OF[code]);
  };
  const toMain = () => setView('main');

  // ─── Report views ─────────────────────────────────────────────────────────

  if (view === 'sales_report') {
    const r = data.sales;
    const channelOptions: ChipOption<ChannelChoice>[] = [
      { value: ALL, label: t('reports.channel.all') },
      ...SALES_CHANNELS.map((c) => ({ value: c, label: reportChannelLabel(c) })),
    ];
    return (
      <ReportView
        title={t('reports.card.sales.title')}
        subtitle={rangeSubtitle}
        onBack={toMain}
        toolbar={<ChipRow options={channelOptions} value={channel} onChange={setChannel} />}
        isLoading={r.isLoading}
        error={r.error}
        onRetry={r.refresh}
        hasData={r.data !== null && r.data.count > 0}
        emptyTitle={t('reports.sales.empty.title')}
        emptySubtitle={t('reports.sales.empty.subtitle')}
      >
        {r.data ? (
          <>
            <KpiGrid>
              <KpiTile label={t('reports.sales.kpi.total')} value={r.data.totalFormatted} />
              <KpiTile label={t('reports.sales.kpi.orders')} value={String(r.data.count)} />
              <KpiTile label={t('reports.sales.kpi.average')} value={r.data.averageOrderValueFormatted} />
              <KpiTile
                label={t('reports.sales.kpi.channel')}
                value={channel === ALL ? t('reports.channel.all') : reportChannelLabel(channel)}
              />
            </KpiGrid>
            <SectionTitle>{t('reports.sales.byChannel')}</SectionTitle>
            <RowStack>
              {r.data.byChannel.map((c) => (
                <DataRow
                  key={c.channel}
                  title={reportChannelLabel(c.channel)}
                  value={c.totalFormatted}
                  meta={count('reports.count.orders', c.count)}
                />
              ))}
            </RowStack>
            <SectionTitle>{t('reports.sales.byStatus')}</SectionTitle>
            <RowStack>
              {r.data.byStatus.map((s) => (
                <DataRow key={s.status} title={reportStatusLabel('order', s.status)} value={String(s.count)} />
              ))}
            </RowStack>
            <SectionTitle>{t('reports.sales.byDay')}</SectionTitle>
            <RowStack>
              {r.data.byDay.map((d) => (
                <DataRow key={d.date} title={d.date} value={d.totalFormatted} meta={count('reports.count.orders', d.count)} />
              ))}
            </RowStack>
          </>
        ) : null}
      </ReportView>
    );
  }

  if (view === 'inventory_report') {
    const r = data.inventory;
    const needle = searchQuery.trim().toLowerCase();
    const items = (r.data?.items ?? []).filter((it) => (needle ? it.name.toLowerCase().includes(needle) : true));
    return (
      <ReportView
        title={t('reports.card.inventory.title')}
        subtitle={t('reports.inventory.snapshotSubtitle', { warehouse: warehouseLabel })}
        onBack={toMain}
        toolbar={
          <View style={styles.searchBarWrap}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder={t('reports.inventory.searchPlaceholder')}
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        }
        isLoading={r.isLoading}
        error={r.error}
        onRetry={r.refresh}
        hasData={r.data !== null && r.data.items.length > 0}
        emptyTitle={t('reports.inventory.empty.title')}
        emptySubtitle={t('reports.inventory.empty.subtitle')}
      >
        {r.data ? (
          <>
            <KpiGrid>
              <KpiTile label={t('reports.inventory.kpi.crops')} value={String(r.data.items.length)} />
              <KpiTile label={t('reports.inventory.kpi.batches')} value={String(r.data.totalBatchCount)} />
              <KpiTile label={t('reports.inventory.kpi.quantity')} value={kg(r.data.totalQtyKg)} />
            </KpiGrid>
            <SectionTitle>{t('reports.inventory.byCrop')}</SectionTitle>
            {items.length === 0 ? (
              <Text style={styles.noMatch}>{t('reports.inventory.noMatch')}</Text>
            ) : (
              <RowStack>
                {items.map((item) => (
                  <DataRow
                    key={item.cropId}
                    title={item.name}
                    value={kg(item.totalQtyKg)}
                    meta={count('reports.count.batches', item.batchCount)}
                  />
                ))}
              </RowStack>
            )}
          </>
        ) : null}
      </ReportView>
    );
  }

  if (view === 'receiving_report') {
    const r = data.receiving;
    return (
      <ReportView
        title={t('reports.card.receiving.title')}
        subtitle={rangeSubtitle}
        onBack={toMain}
        isLoading={r.isLoading}
        error={r.error}
        onRetry={r.refresh}
        hasData={r.data !== null && r.data.totalReceipts > 0}
        emptyTitle={t('reports.receiving.empty.title')}
        emptySubtitle={t('reports.receiving.empty.subtitle')}
      >
        {r.data ? (
          <>
            <KpiGrid>
              <KpiTile label={t('reports.receiving.kpi.total')} value={String(r.data.totalReceipts)} />
              <KpiTile label={t('reports.receiving.kpi.accepted')} value={String(r.data.acceptedCount)} />
              <KpiTile label={t('reports.receiving.kpi.rejected')} value={String(r.data.rejectedCount)} />
            </KpiGrid>
            <SectionTitle>{t('reports.receiving.byDay')}</SectionTitle>
            <RowStack>
              {r.data.byDay.map((row) => (
                <DataRow
                  key={`${row.date}-${row.status}`}
                  title={row.date}
                  value={reportStatusLabel('grn', row.status)}
                  meta={count('reports.count.receipts', row.count)}
                />
              ))}
            </RowStack>
          </>
        ) : null}
      </ReportView>
    );
  }

  if (view === 'customer_report') {
    const r = data.customers;
    return (
      <ReportView
        title={t('reports.card.customers.title')}
        subtitle={rangeSubtitle}
        onBack={toMain}
        isLoading={r.isLoading}
        error={r.error}
        onRetry={r.refresh}
        hasData={r.data !== null && (r.data.customersWithOrders > 0 || r.data.newCustomers > 0)}
        emptyTitle={t('reports.customers.empty.title')}
        emptySubtitle={t('reports.customers.empty.subtitle')}
      >
        {r.data ? (
          <>
            <KpiGrid>
              <KpiTile label={t('reports.customers.kpi.ordering')} value={String(r.data.customersWithOrders)} />
              <KpiTile label={t('reports.customers.kpi.new')} value={String(r.data.newCustomers)} />
            </KpiGrid>
            <SectionTitle>{t('reports.customers.byDay')}</SectionTitle>
            <RowStack>
              {r.data.byDay.map((d) => (
                <DataRow key={d.date} title={d.date} value={count('reports.count.customers', d.count)} />
              ))}
            </RowStack>
          </>
        ) : null}
      </ReportView>
    );
  }

  if (view === 'cash_topup_report') {
    const r = data.cashTopups;
    return (
      <ReportView
        title={t('reports.card.cashTopup.title')}
        subtitle={rangeSubtitle}
        onBack={toMain}
        isLoading={r.isLoading}
        error={r.error}
        onRetry={r.refresh}
        hasData={r.data !== null && r.data.count > 0}
        emptyTitle={t('reports.cashTopup.empty.title')}
        emptySubtitle={t('reports.cashTopup.empty.subtitle')}
      >
        {r.data ? (
          <>
            <KpiGrid>
              <KpiTile label={t('reports.cashTopup.kpi.count')} value={String(r.data.count)} />
              <KpiTile label={t('reports.cashTopup.kpi.amount')} value={r.data.totalFormatted} />
            </KpiGrid>
            <SectionTitle>{t('reports.cashTopup.byDay')}</SectionTitle>
            <RowStack>
              {r.data.byDay.map((d) => (
                <DataRow key={d.date} title={d.date} value={d.totalFormatted} meta={count('reports.count.topups', d.count)} />
              ))}
            </RowStack>
          </>
        ) : null}
      </ReportView>
    );
  }

  if (view === 'revenue_report' || view === 'expense_report') {
    const isRevenue = view === 'revenue_report';
    const r = isRevenue ? data.revenue : data.expense;
    const countKey = isRevenue ? 'reports.count.transactions' : 'reports.count.expenses';
    return (
      <ReportView
        title={t(isRevenue ? 'reports.card.revenue.title' : 'reports.card.expense.title')}
        subtitle={financeSubtitle}
        onBack={toMain}
        isLoading={r.isLoading}
        error={r.error}
        onRetry={r.refresh}
        hasData={r.data !== null && r.data.count > 0}
        emptyTitle={t(isRevenue ? 'reports.revenue.empty.title' : 'reports.expense.empty.title')}
        emptySubtitle={t(isRevenue ? 'reports.revenue.empty.subtitle' : 'reports.expense.empty.subtitle')}
      >
        {r.data ? (
          <>
            <KpiGrid>
              <KpiTile
                label={t(isRevenue ? 'reports.revenue.kpi.total' : 'reports.expense.kpi.total')}
                value={formatPaise(r.data.totalPaise)}
              />
              <KpiTile label={t(isRevenue ? 'reports.revenue.kpi.count' : 'reports.expense.kpi.count')} value={String(r.data.count)} />
            </KpiGrid>
            <SectionTitle>{t(isRevenue ? 'reports.revenue.byChannel' : 'reports.expense.byCategory')}</SectionTitle>
            <RowStack>
              {r.data.byGroup.map((g) => (
                <DataRow key={g.label} title={g.label} value={formatPaise(g.totalPaise)} meta={count(countKey, g.count)} />
              ))}
            </RowStack>
            <SectionTitle>{t(isRevenue ? 'reports.revenue.byPayment' : 'reports.expense.byPayment')}</SectionTitle>
            <RowStack>
              {r.data.byPaymentMethod.map((p) => (
                <DataRow key={p.label} title={p.label} value={formatPaise(p.totalPaise)} meta={count(countKey, p.count)} />
              ))}
            </RowStack>
            <SectionTitle>{t(isRevenue ? 'reports.revenue.byDay' : 'reports.expense.byDay')}</SectionTitle>
            <RowStack>
              {r.data.byDay.map((d) => (
                <DataRow key={d.date} title={d.date} value={formatPaise(d.totalPaise)} meta={count(countKey, d.count)} />
              ))}
            </RowStack>
          </>
        ) : null}
      </ReportView>
    );
  }

  if (view === 'returns_report') {
    const r = data.returns;
    return (
      <ReportView
        title={t('reports.card.returns.title')}
        subtitle={rangeSubtitle}
        onBack={toMain}
        isLoading={r.isLoading}
        error={r.error}
        onRetry={r.refresh}
        hasData={r.data !== null && r.data.totalReturns > 0}
        emptyTitle={t('reports.returns.empty.title')}
        emptySubtitle={t('reports.returns.empty.subtitle')}
      >
        {r.data ? (
          <>
            <KpiGrid>
              <KpiTile label={t('reports.returns.kpi.total')} value={String(r.data.totalReturns)} />
              <KpiTile label={t('reports.returns.kpi.refunded')} value={r.data.refundedTotalFormatted} />
            </KpiGrid>
            <SectionTitle>{t('reports.returns.byStatus')}</SectionTitle>
            <RowStack>
              {r.data.byStatus.map((s) => (
                <DataRow key={s.status} title={reportStatusLabel('return', s.status)} value={String(s.count)} />
              ))}
            </RowStack>
            <SectionTitle>{t('reports.returns.byDay')}</SectionTitle>
            <RowStack>
              {r.data.byDay.map((d) => (
                <DataRow key={d.date} title={d.date} value={count('reports.count.returns', d.count)} />
              ))}
            </RowStack>
          </>
        ) : null}
      </ReportView>
    );
  }

  if (view === 'summary_report') {
    return <SummaryView data={data} subtitle={rangeSubtitle} onBack={toMain} />;
  }

  // ─── Hub ──────────────────────────────────────────────────────────────────

  const hubParts = enabledReports(data, ['sales', 'inventory', 'receiving', 'customers', 'cashTopups', 'revenue', 'expense', 'returns']);
  const hubLoading = hubParts.some((p) => p.isLoading);
  const kpis = hubKpis(data);
  const warehouseChoices: ChipOption<string>[] = [
    { value: ALL, label: allLabel },
    ...options
      .filter((o): o is WarehouseScope & { warehouseId: string } => o.warehouseId !== undefined)
      .map((o) => ({ value: o.warehouseId, label: o.warehouseName ?? o.warehouseCode ?? o.warehouseId })),
  ];

  return (
    <SafeAreaView style={reportStyles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={reportStyles.headerBanner}>
        <View style={reportStyles.headerTopRow}>
          <View style={reportStyles.headerLeftGroup}>
            {onBack ? (
              <TouchableOpacity
                style={reportStyles.backButton}
                onPress={onBack}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('reports.a11y.back')}
              >
                <ArrowBackIcon />
              </TouchableOpacity>
            ) : null}
            <ReportDocHeaderIcon />
            <Text style={reportStyles.headerTitleText}>{t('reports.title')}</Text>
          </View>
          {onNavigateToNotifications ? (
            <TouchableOpacity
              style={reportStyles.headerBellBtn}
              onPress={onNavigateToNotifications}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('reports.a11y.notifications')}
            >
              <BellHeaderIcon />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.warehouseBadgeRow}>
          <View style={styles.warehouseBadge}>
            {isMain ? null : <LockBadgeIcon />}
            <Text style={styles.warehouseBadgeText}>{warehouseLabel}</Text>
          </View>
        </View>
      </View>

      {pickerAllowed ? (
        live.isLoading ? (
          <View style={styles.pickerLoading}>
            <ActivityIndicator size="small" color={adminColors.brand} />
          </View>
        ) : live.error ? (
          <AdminErrorState error={live.error} onRetry={live.refresh} />
        ) : (
          <ChipRow options={warehouseChoices} value={selectedWarehouseId} onChange={setSelectedWarehouseId} />
        )
      ) : null}

      <ChipRow
        options={PRESETS.map((p) => ({ value: p, label: t(`reports.preset.${p}`) }))}
        value={preset}
        onChange={setPreset}
      />

      {sections.length === 0 ? (
        <AdminEmptyState title={t('reports.hub.empty.title')} subtitle={t('reports.hub.empty.subtitle')} />
      ) : (
        <ScrollView style={reportStyles.scroll} contentContainerStyle={reportStyles.scrollContent}>
          {kpis.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiStrip}>
              {hubLoading ? (
                <View style={styles.pickerLoading}>
                  <ActivityIndicator size="small" color={adminColors.brand} />
                </View>
              ) : (
                kpis.map((kpi) => (
                  <View key={kpi.label} style={styles.hubKpiTile}>
                    <Text style={styles.hubKpiLabel}>{kpi.label}</Text>
                    <Text style={styles.hubKpiValue}>{kpi.value}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          ) : null}

          {sections.map((section) => (
            <View key={section.category} style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>{t(section.labelKey)}</Text>
              <RowStack>
                {section.reports.map((report) => (
                  <TouchableOpacity
                    key={report.code}
                    style={styles.reportCardBtn}
                    onPress={() => openReport(report.code)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <View style={styles.reportCardTextWrap}>
                      <Text style={styles.reportCardTitle}>{t(report.titleKey)}</Text>
                      <Text style={styles.reportCardSubtitle}>{t(report.subtitleKey)}</Text>
                    </View>
                    <ChevronRightIcon size={20} />
                  </TouchableOpacity>
                ))}
              </RowStack>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/** Hub KPI tiles: one per report the viewer may read and that has answered. */
function hubKpis(data: ReportsData): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  if (data.sales.data) out.push({ label: t('reports.hub.kpi.sales'), value: data.sales.data.totalFormatted });
  if (data.inventory.data) out.push({ label: t('reports.hub.kpi.inventory'), value: kg(data.inventory.data.totalQtyKg) });
  if (data.receiving.data) out.push({ label: t('reports.hub.kpi.received'), value: String(data.receiving.data.totalReceipts) });
  if (data.customers.data) out.push({ label: t('reports.hub.kpi.customers'), value: String(data.customers.data.customersWithOrders) });
  if (data.cashTopups.data) out.push({ label: t('reports.hub.kpi.cashTopup'), value: data.cashTopups.data.totalFormatted });
  if (data.revenue.data) out.push({ label: t('reports.hub.kpi.revenue'), value: formatPaise(data.revenue.data.totalPaise) });
  if (data.expense.data) out.push({ label: t('reports.hub.kpi.expenses'), value: formatPaise(data.expense.data.totalPaise) });
  if (data.returns.data) out.push({ label: t('reports.hub.kpi.returns'), value: String(data.returns.data.totalReturns) });
  return out;
}

/** The summary: totals of the reports the viewer may read, from the same queries. */
function SummaryView({ data, subtitle, onBack }: { data: ReportsData; subtitle: string; onBack: () => void }) {
  const parts = enabledReports(data, ['sales', 'inventory', 'receiving', 'revenue', 'expense', 'cashTopups', 'returns']);
  const isLoading = parts.some((p) => p.isLoading);
  const failed = parts.find((p) => p.error !== null && p.error !== undefined);
  const { sales, inventory, receiving, revenue, expense, cashTopups, returns } = data;
  const hasData = parts.length > 0 && !isLoading && failed === undefined;
  return (
    <ReportView
      title={t('reports.card.summary.title')}
      subtitle={subtitle}
      onBack={onBack}
      isLoading={isLoading}
      error={failed?.error}
      onRetry={() => parts.forEach((p) => p.refresh())}
      hasData={hasData}
      emptyTitle={t('reports.hub.empty.title')}
      emptySubtitle={t('reports.hub.empty.subtitle')}
    >
      {sales.data ? (
        <>
          <SectionTitle>{t('reports.summary.section.sales')}</SectionTitle>
          <DataRow
            title={t('reports.summary.totalSales')}
            value={sales.data.totalFormatted}
            meta={t('reports.summary.salesMeta', { count: sales.data.count, average: sales.data.averageOrderValueFormatted })}
          />
        </>
      ) : null}
      {inventory.data || receiving.data ? (
        <>
          <SectionTitle>{t('reports.summary.section.stock')}</SectionTitle>
          <RowStack>
            {inventory.data ? (
              <DataRow
                title={t('reports.summary.inventory')}
                value={kg(inventory.data.totalQtyKg)}
                meta={count('reports.count.batches', inventory.data.totalBatchCount)}
              />
            ) : null}
            {receiving.data ? (
              <DataRow title={t('reports.summary.received')} value={count('reports.count.receipts', receiving.data.totalReceipts)} />
            ) : null}
          </RowStack>
        </>
      ) : null}
      {revenue.data || expense.data ? (
        <>
          <SectionTitle>{t('reports.summary.section.finance')}</SectionTitle>
          <RowStack>
            {revenue.data ? (
              <DataRow
                title={t('reports.summary.revenue')}
                value={formatPaise(revenue.data.totalPaise)}
                meta={count('reports.count.transactions', revenue.data.count)}
              />
            ) : null}
            {expense.data ? (
              <DataRow
                title={t('reports.summary.expenses')}
                value={formatPaise(expense.data.totalPaise)}
                meta={count('reports.count.expenses', expense.data.count)}
              />
            ) : null}
          </RowStack>
        </>
      ) : null}
      {cashTopups.data || returns.data ? (
        <>
          <SectionTitle>{t('reports.summary.section.cashReturns')}</SectionTitle>
          <RowStack>
            {cashTopups.data ? (
              <DataRow
                title={t('reports.summary.cashTopups')}
                value={cashTopups.data.totalFormatted}
                meta={count('reports.count.topups', cashTopups.data.count)}
              />
            ) : null}
            {returns.data ? (
              <DataRow
                title={t('reports.summary.returns')}
                value={returns.data.refundedTotalFormatted}
                meta={count('reports.count.returns', returns.data.totalReturns)}
              />
            ) : null}
          </RowStack>
        </>
      ) : null}
    </ReportView>
  );
}

const styles = StyleSheet.create({
  warehouseBadgeRow: { marginTop: adminSpacing.sm },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandDeep,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    alignSelf: 'flex-start',
    gap: adminSpacing.xs,
  },
  warehouseBadgeText: { ...adminType.caption, color: adminColors.onBrand },
  pickerLoading: { padding: adminSpacing.md, alignItems: 'center' },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.sm,
  },
  searchInput: { flex: 1, ...adminType.body, color: adminColors.ink, paddingVertical: 0 },
  noMatch: { ...adminType.rowMeta, color: adminColors.muted },
  kpiStrip: { flexDirection: 'row', marginBottom: adminSpacing.lg },
  hubKpiTile: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginRight: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  hubKpiLabel: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.xs },
  hubKpiValue: { ...adminType.kpiValue, color: adminColors.ink },
  sectionWrap: { marginBottom: adminSpacing.lg },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    textTransform: 'uppercase',
  },
  reportCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    padding: adminSpacing.md,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  reportCardTextWrap: { flex: 1 },
  reportCardTitle: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs },
  reportCardSubtitle: { ...adminType.rowMeta, color: adminColors.muted },
});
