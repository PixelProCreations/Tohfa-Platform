/**
 * ReportsScreen (design module M12).
 * Warehouse reports hub and live report views for Main and Sub Warehouse Admins.
 *
 * Rules:
 *   - Scope: Sub Warehouse Admin is pinned to its assigned warehouse (BR-30, BR-64).
 *   - Money is integer paise, quantities are integer grams (BR-64).
 *   - Date filters: from and to are required for all date-bounded reports (BR-64).
 *   - Customer report is COUNTS ONLY (BR-64d, BR-16).
 *   - CSV/file export is hidden entirely (no in-app file-share mechanism yet).
 *   - Permission gated: each report card and action is gated by can('<code-from-rbac>').
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScope, WarehouseScreenBaseProps } from '../finance-expenses';
import type { ReportChannel } from '../../../api/reports';
import { REPORT_CODES, REPORT_SECTIONS, REPORT_WAREHOUSES, reportVisible } from './constants';
import { getReportPresetDates, reportsWarehouseFilter } from './mappers';
import type { ReportCode, ReportScreenType } from './types';
import {
  useCashTopupsReportData,
  useCustomersReportData,
  useExpenseReportData,
  useInventoryReportData,
  useReceivingReportData,
  useReportsHubData,
  useReturnsReportData,
  useRevenueReportData,
  useSalesReportData,
} from './useReportsData';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from '../shared/AsyncStates';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';
import {
  ArrowBackIcon,
  BellHeaderIcon,
  ChevronRightIcon,
  FilterIcon,
  LockBadgeIcon,
  ReportDocHeaderIcon,
  SearchIcon,
} from './ReportsParts';

export interface ReportsScreenProps extends WarehouseScreenBaseProps {
  canExport?: boolean | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onSelectReport?: ((reportKey: string) => void) | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

export function ReportsScreen({
  onBack,
  onNavigateToNotifications,
  scope,
  can,
  warehouseOptions = REPORT_WAREHOUSES,
}: ReportsScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<ReportScreenType>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'Today' | 'Week' | 'Month'>('Today');

  const isMain = scope.warehouseId === undefined;
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [pendingWarehouseId, setPendingWarehouseId] = useState<string | undefined>(undefined);

  const warehouseLabel = isMain
    ? (warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName ?? 'All Warehouses')
    : (scope.warehouseName ?? 'My warehouse');

  const visibleSections = useMemo(() => {
    return REPORT_SECTIONS.map((sec) => ({
      ...sec,
      reports: sec.reports.filter((r) => r.code !== 'EXPORT_REPORT' && reportVisible(r, can)),
    })).filter((sec) => sec.reports.length > 0);
  }, [can]);

  const effectiveWarehouseId = reportsWarehouseFilter(scope, selectedWarehouseId);
  const { from: reportFrom, to: reportTo } = useMemo(() => getReportPresetDates(timeFilter), [timeFilter]);

  const {
    hubKpis: liveHubKpis,
    isLoading: hubLoading,
    error: hubError,
    refresh: hubRefresh,
  } = useReportsHubData(scope, selectedWarehouseId, timeFilter, can);

  // Sales filter
  const [salesChannel, setSalesChannel] = useState<'All' | 'Online' | 'Market' | 'HORECA' | 'B2B'>('All');

  const mappedSalesChannel: ReportChannel | undefined =
    salesChannel === 'Online'
      ? 'ONLINE'
      : salesChannel === 'Market'
        ? 'MARKET'
        : salesChannel === 'HORECA'
          ? 'HORECA'
          : salesChannel === 'B2B'
            ? 'B2B'
            : undefined;

  const {
    sales: liveSales,
    isLoading: salesLoading,
    error: salesError,
    refresh: salesRefresh,
  } = useSalesReportData(effectiveWarehouseId, reportFrom, reportTo, mappedSalesChannel);

  const {
    inventory: liveInventory,
    isLoading: invLoading,
    error: invError,
    refresh: invRefresh,
  } = useInventoryReportData(effectiveWarehouseId, reportFrom, reportTo);

  const {
    receiving: liveReceiving,
    isLoading: recLoading,
    error: recError,
    refresh: recRefresh,
  } = useReceivingReportData(effectiveWarehouseId, reportFrom, reportTo);

  const {
    customers: liveCustomers,
    isLoading: custLoading,
    error: custError,
    refresh: custRefresh,
  } = useCustomersReportData(effectiveWarehouseId, reportFrom, reportTo);

  const {
    cashTopups: liveCashTopups,
    isLoading: topupLoading,
    error: topupError,
    refresh: topupRefresh,
  } = useCashTopupsReportData(effectiveWarehouseId, reportFrom, reportTo);

  const {
    returns: liveReturns,
    isLoading: retLoading,
    error: retError,
    refresh: retRefresh,
  } = useReturnsReportData(effectiveWarehouseId, reportFrom, reportTo);

  const {
    revenue: liveRevenue,
    isLoading: revLoading,
    error: revError,
    refresh: revRefresh,
  } = useRevenueReportData(reportFrom, reportTo);

  const {
    expense: liveExpense,
    isLoading: expLoading,
    error: expError,
    refresh: expRefresh,
  } = useExpenseReportData(reportFrom, reportTo);

  const handleOpenReport = (code: ReportCode) => {
    if (code === 'SALES_REPORT') {
      setCurrentScreen('sales_report');
      setSearchQuery('');
    } else if (code === 'INVENTORY_REPORT') {
      setCurrentScreen('inventory_report');
      setSearchQuery('');
    } else if (code === 'RECEIVING_REPORT') {
      setCurrentScreen('receiving_report');
      setSearchQuery('');
    } else if (code === 'CUSTOMER_REPORT') {
      setCurrentScreen('customer_report');
      setSearchQuery('');
    } else if (code === 'CASH_TOPUP_REPORT') {
      setCurrentScreen('cash_topup_report');
      setSearchQuery('');
    } else if (code === 'REVENUE_REPORT') {
      setCurrentScreen('revenue_report');
      setSearchQuery('');
    } else if (code === 'EXPENSE_REPORT') {
      setCurrentScreen('expense_report');
      setSearchQuery('');
    } else if (code === 'RETURNS_REPORT') {
      setCurrentScreen('returns_report');
      setSearchQuery('');
    } else if (code === 'SUMMARY_REPORT') {
      setCurrentScreen('summary_report');
      setSearchQuery('');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SALES REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'sales_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Sales Report</Text>
          </View>
          <Text style={styles.headerSubtitleText}>
            {warehouseLabel} · {reportFrom} to {reportTo}
          </Text>
        </View>

        <View style={styles.filterChipRow}>
          {(['All', 'Online', 'Market', 'HORECA', 'B2B'] as const).map((ch) => (
            <TouchableOpacity
              key={ch}
              style={[styles.filterChip, salesChannel === ch && styles.filterChipActive]}
              onPress={() => setSalesChannel(ch)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterChipText, salesChannel === ch && styles.filterChipTextActive]}>{ch}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {salesLoading ? (
          <AdminLoadingState />
        ) : salesError ? (
          <AdminErrorState error={salesError} onRetry={salesRefresh} />
        ) : !liveSales || liveSales.count === 0 ? (
          <AdminEmptyState title="No sales found" subtitle="No sales orders found in the selected date range." />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL SALES</Text>
                <Text style={styles.kpiValue}>{liveSales.totalFormatted}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>ORDERS</Text>
                <Text style={styles.kpiValue}>{liveSales.count}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>AVG ORDER</Text>
                <Text style={styles.kpiValue}>{liveSales.averageOrderValueFormatted}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>CHANNEL</Text>
                <Text style={styles.kpiValue}>{salesChannel}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Sales by Channel</Text>
            <View style={styles.cardStack}>
              {liveSales.byChannel.map((c) => (
                <View key={c.channel} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{c.channel}</Text>
                    <Text style={styles.rowAmountText}>{c.totalFormatted}</Text>
                  </View>
                  <Text style={styles.rowMetaText}>{c.count} orders</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeaderTitle}>Sales by Status</Text>
            <View style={styles.cardStack}>
              {liveSales.byStatus.map((s) => (
                <View key={s.status} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{s.status}</Text>
                    <Text style={styles.rowValueBadge}>{s.count}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeaderTitle}>Daily Trend</Text>
            <View style={styles.cardStack}>
              {liveSales.byDay.map((d) => (
                <View key={d.date} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{d.date}</Text>
                    <Text style={styles.rowAmountText}>{d.totalFormatted}</Text>
                  </View>
                  <Text style={styles.rowMetaText}>{d.count} orders</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. INVENTORY REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'inventory_report') {
    const filteredItems = (liveInventory?.items ?? []).filter((it) =>
      searchQuery ? it.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
    );

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Inventory Report</Text>
          </View>
          <Text style={styles.headerSubtitleText}>{warehouseLabel} · Current snapshot</Text>
        </View>

        <View style={styles.searchBarWrap}>
          <SearchIcon size={16} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search crop name..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {invLoading ? (
          <AdminLoadingState />
        ) : invError ? (
          <AdminErrorState error={invError} onRetry={invRefresh} />
        ) : !liveInventory || liveInventory.items.length === 0 ? (
          <AdminEmptyState title="No inventory data" subtitle="No active stock batches found." />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL CROPS</Text>
                <Text style={styles.kpiValue}>{liveInventory.items.length}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL BATCHES</Text>
                <Text style={styles.kpiValue}>{liveInventory.totalBatchCount}</Text>
              </View>
              <View style={styles.kpiCardFull}>
                <Text style={styles.kpiLabel}>AVAILABLE QUANTITY</Text>
                <Text style={styles.kpiValue}>{liveInventory.totalQtyKg} kg</Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Stock by Crop</Text>
            <View style={styles.cardStack}>
              {filteredItems.map((item) => (
                <View key={item.cropId} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{item.name}</Text>
                    <Text style={styles.rowAmountText}>{item.totalQtyKg} kg</Text>
                  </View>
                  <Text style={styles.rowMetaText}>{item.batchCount} batches</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. RECEIVING REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'receiving_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Receiving Report</Text>
          </View>
          <Text style={styles.headerSubtitleText}>
            {warehouseLabel} · {reportFrom} to {reportTo}
          </Text>
        </View>

        {recLoading ? (
          <AdminLoadingState />
        ) : recError ? (
          <AdminErrorState error={recError} onRetry={recRefresh} />
        ) : !liveReceiving || liveReceiving.totalReceipts === 0 ? (
          <AdminEmptyState title="No receiving records" subtitle="No goods receipts in the selected date range." />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL RECEIPTS</Text>
                <Text style={styles.kpiValue}>{liveReceiving.totalReceipts}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>QC ACCEPTED</Text>
                <Text style={styles.kpiValue}>
                  {liveReceiving.byStatusCounts['ACCEPTED'] ?? liveReceiving.byStatusCounts['QC_ACCEPTED'] ?? 0}
                </Text>
              </View>
              <View style={styles.kpiCardFull}>
                <Text style={styles.kpiLabel}>QC REJECTED</Text>
                <Text style={styles.kpiValue}>
                  {liveReceiving.byStatusCounts['REJECTED'] ?? liveReceiving.byStatusCounts['QC_REJECTED'] ?? 0}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Receipts by Day & Status</Text>
            <View style={styles.cardStack}>
              {liveReceiving.byDay.map((row, idx) => (
                <View key={`${row.date}-${row.status}-${idx}`} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{row.date}</Text>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagPillText}>{row.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.rowMetaText}>{row.count} receipts</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. CUSTOMER REPORT (COUNTS ONLY, BR-64d)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'customer_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Customer Report</Text>
          </View>
          <Text style={styles.headerSubtitleText}>
            {warehouseLabel} · {reportFrom} to {reportTo}
          </Text>
        </View>

        {custLoading ? (
          <AdminLoadingState />
        ) : custError ? (
          <AdminErrorState error={custError} onRetry={custRefresh} />
        ) : !liveCustomers || (liveCustomers.customersWithOrders === 0 && liveCustomers.newCustomers === 0) ? (
          <AdminEmptyState title="No customer activity" subtitle="No customer records in the selected date range." />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>ORDERING CUSTOMERS</Text>
                <Text style={styles.kpiValue}>{liveCustomers.customersWithOrders}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>NEW CUSTOMERS</Text>
                <Text style={styles.kpiValue}>{liveCustomers.newCustomers}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Ordering Customers by Day</Text>
            <View style={styles.cardStack}>
              {liveCustomers.byDay.map((d) => (
                <View key={d.date} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{d.date}</Text>
                    <Text style={styles.rowAmountText}>{d.count} customers</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. CASH TOP-UP REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'cash_topup_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Cash Top-Up Report</Text>
          </View>
          <Text style={styles.headerSubtitleText}>
            {warehouseLabel} · {reportFrom} to {reportTo}
          </Text>
        </View>

        {topupLoading ? (
          <AdminLoadingState />
        ) : topupError ? (
          <AdminErrorState error={topupError} onRetry={topupRefresh} />
        ) : !liveCashTopups || liveCashTopups.count === 0 ? (
          <AdminEmptyState title="No cash top-ups" subtitle="No cash wallet top-ups in the selected range." />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL TOP-UPS</Text>
                <Text style={styles.kpiValue}>{liveCashTopups.count}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.kpiValue}>{liveCashTopups.totalFormatted}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Daily Top-Ups</Text>
            <View style={styles.cardStack}>
              {liveCashTopups.byDay.map((d) => (
                <View key={d.date} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{d.date}</Text>
                    <Text style={styles.rowAmountText}>{d.totalFormatted}</Text>
                  </View>
                  <Text style={styles.rowMetaText}>{d.count} top-ups</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. REVENUE REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'revenue_report') {
    const revTotalFormatted = liveRevenue
      ? formatPaise(parseRupeesToPaise(String(liveRevenue.totalAmount)) ?? 0)
      : '₹0';

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Revenue Report</Text>
          </View>
          <Text style={styles.headerSubtitleText}>
            {warehouseLabel} · {reportFrom} to {reportTo}
          </Text>
        </View>

        {revLoading ? (
          <AdminLoadingState />
        ) : revError ? (
          <AdminErrorState error={revError} onRetry={revRefresh} />
        ) : !liveRevenue || liveRevenue.count === 0 ? (
          <AdminEmptyState title="No revenue records" subtitle="No revenue recorded in this date range." />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
                <Text style={styles.kpiValue}>{revTotalFormatted}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
                <Text style={styles.kpiValue}>{liveRevenue.count}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Revenue by Channel</Text>
            <View style={styles.cardStack}>
              {liveRevenue.byChannel.map((c) => (
                <View key={c.channel} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{c.channel}</Text>
                    <Text style={styles.rowAmountText}>
                      {formatPaise(parseRupeesToPaise(String(c.totalAmount)) ?? 0)}
                    </Text>
                  </View>
                  <Text style={styles.rowMetaText}>{c.count} orders</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeaderTitle}>Revenue by Payment Method</Text>
            <View style={styles.cardStack}>
              {liveRevenue.byPaymentMethod.map((pm) => (
                <View key={pm.paymentMethod} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{pm.paymentMethod}</Text>
                    <Text style={styles.rowAmountText}>
                      {formatPaise(parseRupeesToPaise(String(pm.totalAmount)) ?? 0)}
                    </Text>
                  </View>
                  <Text style={styles.rowMetaText}>{pm.count} transactions</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EXPENSE REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'expense_report') {
    const expTotalFormatted = liveExpense
      ? formatPaise(parseRupeesToPaise(String(liveExpense.totalAmount)) ?? 0)
      : '₹0';

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Expense Report</Text>
          </View>
          <Text style={styles.headerSubtitleText}>
            {warehouseLabel} · {reportFrom} to {reportTo}
          </Text>
        </View>

        {expLoading ? (
          <AdminLoadingState />
        ) : expError ? (
          <AdminErrorState error={expError} onRetry={expRefresh} />
        ) : !liveExpense || liveExpense.count === 0 ? (
          <AdminEmptyState title="No expenses recorded" subtitle="No expense vouchers in this date range." />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL EXPENSES</Text>
                <Text style={styles.kpiValue}>{expTotalFormatted}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>VOUCHERS</Text>
                <Text style={styles.kpiValue}>{liveExpense.count}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Expenses by Category</Text>
            <View style={styles.cardStack}>
              {liveExpense.byCategory.map((cat) => (
                <View key={cat.categoryId} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{cat.categoryName}</Text>
                    <Text style={styles.rowAmountText}>
                      {formatPaise(parseRupeesToPaise(String(cat.totalAmount)) ?? 0)}
                    </Text>
                  </View>
                  <Text style={styles.rowMetaText}>{cat.count} vouchers</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. RETURNS REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'returns_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Returns Report</Text>
          </View>
          <Text style={styles.headerSubtitleText}>
            {warehouseLabel} · {reportFrom} to {reportTo}
          </Text>
        </View>

        {retLoading ? (
          <AdminLoadingState />
        ) : retError ? (
          <AdminErrorState error={retError} onRetry={retRefresh} />
        ) : !liveReturns || liveReturns.totalReturns === 0 ? (
          <AdminEmptyState title="No returns found" subtitle="No return requests recorded in this range." />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>TOTAL RETURNS</Text>
                <Text style={styles.kpiValue}>{liveReturns.totalReturns}</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>REFUNDED AMOUNT</Text>
                <Text style={styles.kpiValue}>{liveReturns.refundedTotalFormatted}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Returns by Status</Text>
            <View style={styles.cardStack}>
              {liveReturns.byStatus.map((s) => (
                <View key={s.status} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{s.status}</Text>
                    <Text style={styles.rowValueBadge}>{s.count}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeaderTitle}>Daily Returns</Text>
            <View style={styles.cardStack}>
              {liveReturns.byDay.map((d) => (
                <View key={d.date} style={styles.dataRowCard}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.rowTitleText}>{d.date}</Text>
                    <Text style={styles.rowAmountText}>{d.count} returns</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. SUMMARY REPORT
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'summary_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')} activeOpacity={0.75}>
              <ArrowBackIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitleText}>Daily / Monthly Summary</Text>
          </View>
          <Text style={styles.headerSubtitleText}>
            {warehouseLabel} · {reportFrom} to {reportTo}
          </Text>
        </View>

        {hubLoading ? (
          <AdminLoadingState />
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionHeaderTitle}>Sales</Text>
            <View style={styles.dataRowCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.rowTitleText}>Total Sales</Text>
                <Text style={styles.rowAmountText}>{liveSales?.totalFormatted ?? '₹0'}</Text>
              </View>
              <Text style={styles.rowMetaText}>
                {liveSales?.count ?? 0} orders · Avg {liveSales?.averageOrderValueFormatted ?? '₹0'}
              </Text>
            </View>

            <Text style={styles.sectionHeaderTitle}>Stock & Receiving</Text>
            <View style={styles.dataRowCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.rowTitleText}>Inventory Balance</Text>
                <Text style={styles.rowAmountText}>{liveInventory?.totalQtyKg ?? '0'} kg</Text>
              </View>
              <Text style={styles.rowMetaText}>{liveInventory?.totalBatchCount ?? 0} active batches</Text>
            </View>
            <View style={styles.dataRowCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.rowTitleText}>Goods Received</Text>
                <Text style={styles.rowAmountText}>{liveReceiving?.totalReceipts ?? 0} receipts</Text>
              </View>
            </View>

            <Text style={styles.sectionHeaderTitle}>Cash & Returns</Text>
            <View style={styles.dataRowCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.rowTitleText}>Cash Top-Ups</Text>
                <Text style={styles.rowAmountText}>{liveCashTopups?.totalFormatted ?? '₹0'}</Text>
              </View>
              <Text style={styles.rowMetaText}>{liveCashTopups?.count ?? 0} top-ups</Text>
            </View>
            <View style={styles.dataRowCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.rowTitleText}>Returns</Text>
                <Text style={styles.rowAmountText}>{liveReturns?.refundedTotalFormatted ?? '₹0'}</Text>
              </View>
              <Text style={styles.rowMetaText}>{liveReturns?.totalReturns ?? 0} returns</Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. MAIN REPORTS HUB
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            {onBack ? (
              <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.75}>
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : null}
            <ReportDocHeaderIcon />
            <Text style={styles.headerTitleText}>Reports</Text>
          </View>
          {onNavigateToNotifications ? (
            <TouchableOpacity style={styles.headerBellBtn} onPress={onNavigateToNotifications} activeOpacity={0.75}>
              <BellHeaderIcon />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.warehouseBadgeRow}>
          {isMain ? (
            <TouchableOpacity
              style={styles.warehouseBadge}
              onPress={() => {
                setPendingWarehouseId(selectedWarehouseId);
                setShowWarehousePicker(true);
              }}
              activeOpacity={0.75}
            >
              <Text style={styles.warehouseBadgeText}>{warehouseLabel} ▾</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.warehouseBadge}>
              <LockBadgeIcon />
              <Text style={styles.warehouseBadgeText}>{warehouseLabel}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.timeFilterRow}>
        {(['Today', 'Week', 'Month'] as const).map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.filterChip, timeFilter === preset && styles.filterChipActive]}
            onPress={() => setTimeFilter(preset)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, timeFilter === preset && styles.filterChipTextActive]}>
              {preset}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {hubError ? (
        <AdminErrorState error={hubError} onRetry={hubRefresh} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.kpiHorizontalScroll}>
            {hubLoading ? (
              <View style={styles.hubLoadingWrap}>
                <ActivityIndicator size="small" color={adminColors.brand} />
              </View>
            ) : (
              liveHubKpis.map((kpi) => (
                <View key={kpi.label} style={styles.hubKpiTile}>
                  <Text style={styles.hubKpiLabel}>{kpi.label}</Text>
                  <Text style={styles.hubKpiValue}>{kpi.value}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {visibleSections.map((section) => (
            <View key={section.category} style={styles.sectionWrap}>
              <Text style={styles.sectionHeading}>{section.category}</Text>
              <View style={styles.cardStack}>
                {section.reports.map((report) => (
                  <TouchableOpacity
                    key={report.code}
                    style={styles.reportCardBtn}
                    onPress={() => handleOpenReport(report.code)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.reportCardTextWrap}>
                      <Text style={styles.reportCardTitle}>{report.title}</Text>
                      <Text style={styles.reportCardSubtitle}>{report.subtitle}</Text>
                    </View>
                    <ChevronRightIcon size={20} color={adminColors.muted} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Warehouse Selector Modal for Main Admin */}
      {isMain ? (
        <Modal
          visible={showWarehousePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWarehousePicker(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Select Warehouse</Text>
              <TouchableOpacity
                style={[styles.modalOption, pendingWarehouseId === undefined && styles.modalOptionActive]}
                onPress={() => setPendingWarehouseId(undefined)}
              >
                <Text style={styles.modalOptionText}>All Warehouses</Text>
              </TouchableOpacity>
              {warehouseOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.warehouseId}
                  style={[styles.modalOption, pendingWarehouseId === opt.warehouseId && styles.modalOptionActive]}
                  onPress={() => setPendingWarehouseId(opt.warehouseId)}
                >
                  <Text style={styles.modalOptionText}>{opt.warehouseName}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowWarehousePicker(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={() => {
                    setSelectedWarehouseId(pendingWarehouseId);
                    setShowWarehousePicker(false);
                  }}
                >
                  <Text style={styles.modalConfirmText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backButton: {
    padding: adminSpacing.xs,
    marginRight: adminSpacing.xs,
  },
  headerTitleText: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerSubtitleText: {
    ...adminType.caption,
    color: adminColors.brandTint,
    marginTop: adminSpacing.xs,
  },
  headerBellBtn: {
    padding: adminSpacing.sm,
  },
  warehouseBadgeRow: {
    marginTop: adminSpacing.sm,
  },
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
  warehouseBadgeText: {
    ...adminType.caption,
    color: adminColors.onBrand,
  },
  timeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    gap: adminSpacing.sm,
  },
  filterChipRow: {
    flexDirection: 'row',
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  filterChipTextActive: {
    color: adminColors.brandDeep,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.lg,
    marginTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    height: 42,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  kpiHorizontalScroll: {
    flexDirection: 'row',
    marginBottom: adminSpacing.lg,
  },
  hubLoadingWrap: {
    padding: adminSpacing.lg,
  },
  hubKpiTile: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginRight: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    minWidth: 120,
    ...adminShadow.sm,
  },
  hubKpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  hubKpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  sectionWrap: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    textTransform: 'uppercase',
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  cardStack: {
    gap: adminSpacing.sm,
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
  reportCardTextWrap: {
    flex: 1,
  },
  reportCardTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
  },
  reportCardSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  kpiCardFull: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  dataRowCard: {
    backgroundColor: adminColors.card,
    padding: adminSpacing.md,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowTitleText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  rowAmountText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  rowMetaText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  rowValueBadge: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  tagPill: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandTint,
  },
  tagPillText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminColors.ink,
    justifyContent: 'center',
    padding: adminSpacing.lg,
  },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  modalOption: {
    paddingVertical: adminSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  modalOptionActive: {
    backgroundColor: adminColors.brandTint,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: adminSpacing.sm,
    marginTop: adminSpacing.lg,
  },
  modalCancelBtn: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
  },
  modalCancelText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  modalConfirmBtn: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.md,
  },
  modalConfirmText: {
    ...adminType.body,
    color: adminColors.onBrand,
  },
});
