/**
 * Accounts & Finance hub: the Tohfa Admin "Finance" tab of the design
 * (origin/tofhafarmfin-rbac TohfaAdminDashboardScreen, "FINANCE TAB (Accounts
 * & Finance Dashboard)"), as a standalone screen.
 *
 * Same layout, icons and order as the design: brand header (back, bank icon,
 * title, filter and download pills, "Last 30 Days"), last-updated line, eight
 * OverviewDashboardCard KPIs, the revenue/purchase/expense bars, payment
 * status bars, by-warehouse card, recent transactions, and the Go-to grid.
 *
 * Data (owner decision 2026-11-11): only Sales and Expenses have a real source
 * (the BR-63 revenue and expense reports for the last 30 IST days, each gated
 * by its route's code). Every other figure is the dash, and the by-warehouse
 * and recent-transaction lists show an empty state: no endpoint returns them.
 *
 * Navigation belongs to the host: a tile or header action renders only when
 * the host passed its callback AND `can` grants its code (financeHubLogic).
 */
import React, { useEffect, useMemo } from 'react';
import { Alert, BackHandler, ScrollView, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import type { Can } from '../../permissions/can';
import { t } from '../../i18n';
import { adminColors } from '../../theme';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../components/OverviewDashboardCard';
import { istToday } from '../warehouse/finance-expenses/mappers';
import { useFinanceReports } from '../warehouse/finance-expenses/useFinanceData';
import {
  BackArrowWhiteIcon,
  BankBuildingWhiteIcon,
  ClipboardCardIcon,
  DownloadWhiteIcon,
  FilterSlidersIcon,
  FINANCE_HUB_TILE_ICONS,
} from './financeHubIcons';
import {
  canAny,
  FINANCE_HUB_EXPENSE_CODE,
  FINANCE_HUB_EXPORT_CODE,
  FINANCE_HUB_FILTER_CODE,
  FINANCE_HUB_PAYMENT_ROWS,
  FINANCE_HUB_REVENUE_CODE,
  financeHubFigures,
  financeHubFlowBars,
  financeHubRange,
  visibleFinanceHubTiles,
  type FinanceHubActions,
  type FinanceHubBarId,
} from './financeHubLogic';
import { financeHubStyles as styles } from './financeHubStyles';

export interface FinanceHubScreenProps extends FinanceHubActions {
  /** Permission check from /auth/me. Missing denies every gated control and every read (fail closed). */
  can?: Can | undefined;
  /** Warehouse the host is scoped to; keys the report queries (the server decides the scope). */
  warehouseId?: string | undefined;
  /** Leave the hub (header back arrow and Android hardware back). No arrow when absent. */
  onBack?: (() => void) | undefined;
  /** Header filter pill (finance.dashboard.view). */
  onOpenFilter?: (() => void) | undefined;
  /** Header download pill (report.export.file). */
  onExport?: (() => void) | undefined;
}

const FILL_STYLE: Record<FinanceHubBarId, ViewStyle> = {
  revenue: styles.fillRevenue,
  purchase: styles.fillPurchase,
  expense: styles.fillExpense,
};

export function FinanceHubScreen(props: FinanceHubScreenProps) {
  const { can, warehouseId, onBack, onOpenFilter, onExport } = props;
  const dash = t('financeHub.figure.none');

  useEffect(() => {
    if (!onBack) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const range = useMemo(() => financeHubRange(istToday()), []);
  const reports = useFinanceReports(warehouseId, range, {
    revenue: canAny(can, [FINANCE_HUB_REVENUE_CODE]),
    expenses: canAny(can, [FINANCE_HUB_EXPENSE_CODE]),
  });
  const sources = { revenue: reports.revenue.report, expenses: reports.expenses.report };
  const figures = financeHubFigures(sources, dash);
  const bars = financeHubFlowBars(sources, dash);
  const tiles = visibleFinanceHubTiles(can, props);
  // Filter and export are always shown when the caller holds the code; toast when no callback.
  const showFilter = canAny(can, [FINANCE_HUB_FILTER_CODE]);
  const showExport = canAny(can, [FINANCE_HUB_EXPORT_CODE]);
  const notAvailable = () => Alert.alert(t('tohfaHome.notAvailable.title'), t('tohfaHome.notAvailable.body'));

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Header banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleGroup}>
              {onBack ? (
                <TouchableOpacity
                  testID="financeHub.back"
                  style={styles.backBtn}
                  onPress={onBack}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('financeHub.back')}
                >
                  <BackArrowWhiteIcon />
                </TouchableOpacity>
              ) : null}
              <BankBuildingWhiteIcon size={24} color={adminColors.onBrand} />
              <Text style={styles.headerTitle}>{t('financeHub.title')}</Text>
            </View>
            <View style={styles.headerActionsRow}>
              {showFilter ? (
                <TouchableOpacity
                  testID="financeHub.filter"
                  style={styles.headerPillBtn}
                  onPress={onOpenFilter ?? notAvailable}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('financeHub.filter')}
                >
                  <FilterSlidersIcon size={18} color={adminColors.onBrand} />
                </TouchableOpacity>
              ) : null}
              {showExport ? (
                <TouchableOpacity
                  testID="financeHub.export"
                  style={styles.headerPillBtn}
                  onPress={onExport ?? notAvailable}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('financeHub.export')}
                >
                  <DownloadWhiteIcon size={18} color={adminColors.onBrand} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={styles.headerSubtitle}>{t('financeHub.period.last30')}</Text>
        </View>

        {/* 2. Sub-header: no endpoint reports when these figures were computed. */}
        <View style={styles.subheaderRow}>
          <Text style={styles.lastUpdated}>{t('financeHub.lastUpdated', { when: dash })}</Text>
        </View>

        {/* 3. KPI cards (the shared OverviewDashboardCard, as the design uses it) */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard title={t('financeHub.kpi.sales')} value={figures.sales} icon="sales" />
          <OverviewDashboardCard title={t('financeHub.kpi.farmerPurchase')} value={figures.farmerPurchase} icon="truck" />
          <OverviewDashboardCard title={t('financeHub.kpi.outstandingDues')} value={figures.outstandingDues} icon="orders" />
          <OverviewDashboardCard title={t('financeHub.kpi.expenses')} value={figures.expenses} icon="cash" />
          {/* The design's 'wallet' glyph is the same path as Dev's 'cash'. */}
          <OverviewDashboardCard title={t('financeHub.kpi.walletLiability')} value={figures.walletLiability} icon="cash" />
          <OverviewDashboardCard title={t('financeHub.kpi.pendingPayouts')} value={figures.pendingPayouts} icon="pickup" />
          <OverviewDashboardCard title={t('financeHub.kpi.refunds')} value={figures.refunds} icon="alert" />
          <OverviewDashboardCard title={t('financeHub.kpi.netSummary')} value={figures.netSummary} icon={<ClipboardCardIcon />} />
        </OverviewCardsGrid>

        {/* 5. Revenue, expense & purchase */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{t('financeHub.flow.heading')}</Text>
          {bars.map((bar) => (
            <View key={bar.id} testID={`financeHub.row.${bar.id}`} style={styles.progressRow}>
              <Text style={styles.progressLabel}>{t(`financeHub.flow.${bar.id}`)}</Text>
              <View style={styles.progressTrack}>
                {bar.fillPercent !== null && bar.fillPercent > 0 ? (
                  <View style={[styles.progressFill, FILL_STYLE[bar.id], { width: `${bar.fillPercent}%` }]} />
                ) : null}
              </View>
              <Text style={styles.progressValue}>{bar.value}</Text>
            </View>
          ))}
        </View>

        {/* 6. Payment status: no endpoint returns these counts. */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{t('financeHub.payment.heading')}</Text>
          {FINANCE_HUB_PAYMENT_ROWS.map((id) => (
            <View key={id} testID={`financeHub.row.${id}`} style={styles.progressRow}>
              <Text style={styles.progressLabel}>{t(`financeHub.payment.${id}`)}</Text>
              <View style={styles.progressTrack} />
              <Text style={styles.progressValue}>{dash}</Text>
            </View>
          ))}
        </View>

        {/* 7. By warehouse: no per-warehouse finance endpoint. */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{t('financeHub.byWarehouse.heading')}</Text>
          <View style={styles.warehouseCard}>
            <Text style={styles.emptyText}>{t('financeHub.byWarehouse.empty')}</Text>
          </View>
        </View>

        {/* 8. Recent transactions: no transaction-history endpoint. */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>{t('financeHub.recent.heading')}</Text>
          <View style={styles.txnCard}>
            <Text style={styles.emptyText}>{t('financeHub.recent.empty')}</Text>
          </View>
        </View>

        {/* 9. Go to */}
        {tiles.length > 0 ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>{t('financeHub.goTo.heading')}</Text>
            <View style={styles.goToGrid}>
              {tiles.map((tile) => {
                const Icon = FINANCE_HUB_TILE_ICONS[tile.id];
                const label = t(tile.labelKey);
                return (
                  <TouchableOpacity
                    key={tile.id}
                    testID={`financeHub.tile.${tile.id}`}
                    style={styles.goToCard}
                    onPress={props[tile.callback] ?? notAvailable}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                  >
                    <Icon size={24} color={adminColors.brand} />
                    <Text style={styles.goToCardTitle}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}
