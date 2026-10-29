// Design id: M12-S01
/**
 * Reports — the warehouse reports hub (M12-S01) and its inline report views
 * (Sales M12-S02, Inventory S03, Receiving S04, Customers S05, Cash Top-Up S06,
 * Expense S07, Revenue S08, Returns S09, Daily / Monthly Summary S10, Export
 * S11), shared by the Main and Sub warehouse admins. Converted in place from
 * subwarehouse/screens/SubWarehouseReportsScreen.tsx (W4); absorbs
 * MainWarehouseReportsScreen / ExportReportScreen / SummaryReportScreen and the
 * W3b ReportSummaryScreen / ReportDetailScreen.
 *
 * Scope: Sub is locked to `scope.warehouseName`; Main (`scope.warehouseId`
 * undefined) gets the All-warehouses selector (pair_table M12-S01).
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - each report card and hub KPI tile renders only when can() of its data
 *     code (REPORT_CODES in fixtures.ts): Sales order.list.view_all, Revenue
 *     finance.sales_income.view, Expense finance.expense.log, Cash Top-Up
 *     wallet.cash_topup.process, Returns rma.request.process, Customers
 *     customer.list.view, Inventory / Receiving inventory.batch.view; the Summary
 *     has no code and renders ungated.
 *   - Export card: report.export.file (any grant). Generate / Download: also
 *     `canExport` (MAIN's grant is `view`, so the Main shell passes false).
 *   - View Invoice (sales order detail): delegated to InvoiceDetailScreen.
 *   - HORECA / B2B channel chips: ungated, no per-channel code (SPEC_GAPS #5).
 */
import React, { useEffect, useState } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ActivityIndicator,
  Alert,
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
import { OverviewDashboardCard } from '../../../components';
import { InvoiceDetailScreen } from '../billing-invoices';
import type { WarehouseScope, WarehouseScreenBaseProps } from '../finance-expenses';
import { WarehouseSelector } from '../inventory';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { AdminEmptyState } from '../shared/AsyncStates';
import { formatMoney, formatKg } from './mappers';
import {
  useHubKpis,
  useSalesReport,
  useInventoryReport,
  useReceivingReport,
  useReturnsReport,
  useCustomersReport,
  useCashTopupsReport,
  useRevenueReportData,
  useExpenseReportData,
} from './useReportsData';
import { EXPORT_REPORT_OPTIONS, REPORT_CODES, REPORT_SECTIONS, reportVisible } from './fixtures';
import type { ReportCode, ReportScreenType } from './types';
import {
  TimelineDotIcon,
  ArrowBackIcon,
  RadioCircleIcon,
  ArrowRightIcon,
  ReportDocHeaderIcon,
  BellHeaderIcon,
  LockBadgeIcon,
  SearchIcon,
  FilterIcon,
  ChevronRightIcon,
  ShoppingBagIcon,
  InvoiceDocumentIcon,
  StorePickupIcon,
  DeliveryTruckIcon,
  ExcelFileIcon,
  CsvFileIcon,
  PdfFileIcon,
  SparklesIcon,
  DownloadIcon,
  ReadyCheckIcon,
} from './ReportsParts';

export interface ReportsScreenProps extends WarehouseScreenBaseProps {
  /**
   * Whether this viewer may Generate / Download an export. /auth/me drops the
   * grant scope, so `can('report.export.file')` alone cannot tell MAIN's `view`
   * grant from SUB's `own` (SPEC_GAPS.md W2a-1). The Main shell passes `false`;
   * when absent it falls back to `can('report.export.file')`.
   */
  canExport?: boolean | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Called for a report code that has no inline view (none today). */
  onSelectReport?: ((reportKey: string) => void) | undefined;
  /** Warehouses offered by the Main (all-warehouses) selector. */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
}

// `onTabChange` (WarehouseScreenBaseProps) is accepted but unused: the screen
// renders no bottom tab bar of its own (the old handleTabPress was dead code).
export function ReportsScreen({
  onBack,
  onNavigateToNotifications,
  onSelectReport,
  scope,
  can,
  canExport,
  warehouseOptions: customWarehouseOptions,
}: ReportsScreenProps) {
  const { scopes: fetchedWarehouseOptions } = useWarehouseOptions();
  const warehouseOptions = customWarehouseOptions ?? fetchedWarehouseOptions;

  const [currentScreen, setCurrentScreen] = useState<ReportScreenType>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'Today' | 'Week' | 'Month'>('Today');

  // Scope. Sub is locked to its own warehouse; Main (no warehouseId) gets the
  // All-warehouses selector absorbed from MainWarehouseReportsScreen. The
  // server scopes every report again (CLAUDE.md 2.1).
  const isMain = scope.warehouseId === undefined;
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const warehouseLabel = isMain
    ? (warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName ?? 'All Warehouses')
    : (scope.warehouseName ?? 'My warehouse');
  // Mock rows carry the warehouse they belong to; with no real data yet they
  // take the viewer's current warehouse label instead of a hard-coded name.
  const rowWarehouse = warehouseLabel;
  // Export: MAIN holds report.export.file only as `view` (SPEC_GAPS.md #11,
  // W2a-1), so the Main shell passes canExport={false}.
  const exportAllowed = (canExport ?? true) && can(REPORT_CODES.export);
  const visibleSections = REPORT_SECTIONS.map((sec) => ({
    ...sec,
    reports: sec.reports.filter((r) => reportVisible(r, can)),
  })).filter((sec) => sec.reports.length > 0);
  const visibleTitles = new Set(visibleSections.flatMap((s) => s.reports.map((r) => r.title)));
  // Only reports the viewer may open can be exported.
  const exportOptions = EXPORT_REPORT_OPTIONS.filter((o) => visibleTitles.has(o.cardTitle)).map((o) => o.label);

  // Sales filter
  const [salesChannel, setSalesChannel] = useState<'All' | 'Online' | 'Market' | 'HORECA' | 'B2B'>('All');
  const [chartTab, setChartTab] = useState<'Sales Amount' | 'Orders' | 'Quantity'>('Sales Amount');

  // Inventory filter
  const [invFilter, setInvFilter] = useState<'All' | 'Available' | 'Low Stock' | 'Out of Stock'>('All');

  // Receiving filter
  const [recFilter, setRecFilter] = useState<'All' | 'Accepted' | 'Partial' | 'Rejected'>('All');

  // Customer filter
  const [custChannel, setCustChannel] = useState<'All' | 'Online' | 'Market' | 'B2B'>('All');

  // Cash Top-Up filter
  const [topupPeriod, setTopupPeriod] = useState<'All' | 'Today' | 'This Month'>('All');

  // Revenue filter (the unused revFilter state was dropped; the view has no filter chips)
  const [revChartPeriod, setRevChartPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Export report states (5 Steps + Generating + Ready + Downloaded)
  const [exportStep, setExportStep] = useState<1 | 2 | 3 | 4 | 5 | 'generating' | 'ready' | 'downloaded'>(1);
  const [selectedExportReport, setSelectedExportReport] = useState<string>('Revenue Report');
  const [exportPeriod, setExportPeriod] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('This Month');
  const [exportChannel, setExportChannel] = useState<'All' | 'Online' | 'Market'>('All');
  const [exportStatus, setExportStatus] = useState<'All' | 'Completed' | 'Cancelled'>('All');
  const [exportFormat, setExportFormat] = useState<'Excel' | 'CSV' | 'PDF'>('Excel');

  useEffect(() => {
    if (exportStep === 'generating') {
      const timer = setTimeout(() => {
        setExportStep('ready');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [exportStep]);

  // Daily / Monthly Summary filter
  const [summaryMode, setSummaryMode] = useState<'Daily' | 'Monthly'>('Daily');
  const [summaryMetric, setSummaryMetric] = useState<'Sales' | 'Orders' | 'Revenue' | 'Expenses' | 'Returns'>('Sales');

  // Returns filter
  const [returnCategory, setReturnCategory] = useState<'All' | 'Quality' | 'Quantity' | 'Missing' | 'Wrong' | 'Damaged' | 'Late'>('All');

  // Reports Filter Modal State & Warehouse Scoping (matches Warehouse Finance logic)
  const [showReportFilterModal, setShowReportFilterModal] = useState(false);
  const [reportWarehouseId, setReportWarehouseId] = useState<string | undefined>(undefined);
  const [tempReportWarehouseId, setTempReportWarehouseId] = useState<string | undefined>(undefined);

  const [revChannel, setRevChannel] = useState<string>('All');
  const [expenseCategory, setExpenseCategory] = useState<string>('All');

  // Temp states for inside the filter modal
  const [tempSalesChannel, setTempSalesChannel] = useState<'All' | 'Online' | 'Market' | 'HORECA' | 'B2B'>('All');
  const [tempInvFilter, setTempInvFilter] = useState<'All' | 'Available' | 'Low Stock' | 'Out of Stock'>('All');
  const [tempRecFilter, setTempRecFilter] = useState<'All' | 'Accepted' | 'Partial' | 'Rejected'>('All');
  const [tempCustChannel, setTempCustChannel] = useState<'All' | 'Online' | 'Market' | 'B2B'>('All');
  const [tempTopupPeriod, setTempTopupPeriod] = useState<'All' | 'Today' | 'This Month'>('All');
  const [tempRevChannel, setTempRevChannel] = useState<string>('All');
  const [tempExpenseCategory, setTempExpenseCategory] = useState<string>('All');
  const [tempReturnCategory, setTempReturnCategory] = useState<'All' | 'Quality' | 'Quantity' | 'Missing' | 'Wrong' | 'Damaged' | 'Late'>('All');

  const isSpecificWarehouseChosen = isMain && Boolean(selectedWarehouseId && selectedWarehouseId !== 'all');
  const effectiveWarehouseId = isSpecificWarehouseChosen ? selectedWarehouseId : reportWarehouseId;

  const normalizeWh = (val?: string) => {
    if (!val) return '';
    const v = val.toLowerCase().trim();
    if (v.includes('ooty')) return 'ooty';
    if (v.includes('coon')) return 'coonoor';
    if (v.includes('kota')) return 'kotagiri';
    if (v.includes('guda')) return 'gudalur';
    return v.replace(/^wh[-_]?/, '').replace(/\s+warehouse$/, '').replace(/[^a-z0-9]/g, '');
  };

  const matchWarehouse = (itemWarehouse?: string, itemWarehouseId?: string) => {
    if (!isMain) return true;
    const target = effectiveWarehouseId;
    if (!target || target === 'all') return true;

    const normTarget = normalizeWh(target);
    const normItemWh = normalizeWh(itemWarehouse);
    const normItemId = normalizeWh(itemWarehouseId);

    if (normTarget && (normTarget === normItemWh || normTarget === normItemId)) {
      return true;
    }

    const targetLower = target.toLowerCase();
    if (itemWarehouseId && itemWarehouseId.toLowerCase() === targetLower) return true;
    if (itemWarehouse && itemWarehouse.toLowerCase() === targetLower) return true;

    const targetObj = warehouseOptions.find(
      (w) =>
        w.warehouseId?.toLowerCase() === targetLower ||
        w.warehouseName?.toLowerCase() === targetLower ||
        normalizeWh(w.warehouseId) === normTarget ||
        normalizeWh(w.warehouseName) === normTarget
    );

    if (targetObj) {
      if (normalizeWh(targetObj.warehouseId) === normItemWh || normalizeWh(targetObj.warehouseId) === normItemId) return true;
      if (normalizeWh(targetObj.warehouseName) === normItemWh || normalizeWh(targetObj.warehouseName) === normItemId) return true;

      const objName = (targetObj.warehouseName ?? '').toLowerCase();
      const objId = (targetObj.warehouseId ?? '').toLowerCase();
      if (itemWarehouse && objName.includes(itemWarehouse.toLowerCase())) return true;
      if (itemWarehouseId && objId.includes(itemWarehouseId.toLowerCase())) return true;
    }

    return false;
  };

  const { kpis: liveKpis } = useHubKpis(scope, effectiveWarehouseId);
  const { data: salesData } = useSalesReport(scope, effectiveWarehouseId, timeFilter);
  const { items: inventoryRows } = useInventoryReport(scope, effectiveWarehouseId);
  const { items: receivingRows } = useReceivingReport(scope, effectiveWarehouseId);
  const { items: customerRows } = useCustomersReport(scope, effectiveWarehouseId);
  const { items: topupRows, report: topupReport } = useCashTopupsReport(scope, effectiveWarehouseId, topupPeriod);
  const { items: returnRows, report: returnReport } = useReturnsReport(scope, effectiveWarehouseId, timeFilter);
  const { items: revenueRows } = useRevenueReportData(scope, effectiveWarehouseId, timeFilter);
  const { items: expenseRows } = useExpenseReportData(scope, effectiveWarehouseId, timeFilter);

  const openFilterModal = () => {
    setTempReportWarehouseId(reportWarehouseId);
    setTempSalesChannel(salesChannel);
    setTempInvFilter(invFilter);
    setTempRecFilter(recFilter);
    setTempCustChannel(custChannel);
    setTempTopupPeriod(topupPeriod);
    setTempRevChannel(revChannel);
    setTempExpenseCategory(expenseCategory);
    setTempReturnCategory(returnCategory);
    setShowReportFilterModal(true);
  };

  // Selected Order for Sales Report Details
  const [selectedOrder, setSelectedOrder] = useState<any | undefined>(undefined);

  // Selected Inventory Item Details
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any | undefined>(undefined);

  // Selected Receiving Item Details
  const [selectedReceivingItem, setSelectedReceivingItem] = useState<any | undefined>(undefined);

  // Selected Customer Item Details
  const [selectedCustomerItem, setSelectedCustomerItem] = useState<any | undefined>(undefined);

  // Selected Revenue Item Details
  const [selectedRevenueItem, setSelectedRevenueItem] = useState<any | undefined>(undefined);

  // Selected Cash Top-Up Details
  const [selectedCashTopupItem, setSelectedCashTopupItem] = useState<any | undefined>(undefined);

  // Selected Expense Details
  const [selectedExpenseItem, setSelectedExpenseItem] = useState<any | undefined>(undefined);

  // Selected Return Item Details
  const [selectedReturnItem, setSelectedReturnItem] = useState<any | undefined>(undefined);


  const handleReportClick = (code: ReportCode) => {
    // Fail closed: a card the viewer may not see never opens (the hub hides it anyway).
    const card = REPORT_SECTIONS.flatMap((s) => s.reports).find((r) => r.code === code);
    if (card && !reportVisible(card, can)) return;
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
    } else if (code === 'EXPORT_REPORT') {
      setExportStep(1);
      setSelectedExportReport((cur) => (exportOptions.includes(cur) ? cur : (exportOptions[0] ?? cur)));
      setCurrentScreen('export_report');
      setSearchQuery('');
    } else if (code === 'SUMMARY_REPORT') {
      setCurrentScreen('summary_report');
      setSearchQuery('');
    } else if (code === 'RETURNS_REPORT') {
      setCurrentScreen('returns_report');
      setSearchQuery('');
    } else {
      onSelectReport?.(code);
    }
  };

  const renderReportFilterModal = () => (
    <Modal
      visible={showReportFilterModal}
      animationType="slide"
      onRequestClose={() => setShowReportFilterModal(false)}
    >
      <SafeAreaView style={styles.fullScreenFilterModal}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Top Header */}
        <View style={styles.filterModalHeader}>
          <TouchableOpacity
            onPress={() => setShowReportFilterModal(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
          >
            <ArrowBackIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.filterModalTitle}>Filter Report</Text>
          <TouchableOpacity
            onPress={() => setShowReportFilterModal(false)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
          >
            <Text style={styles.filterCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.filterModalScroll}
          contentContainerStyle={styles.filterModalScrollContent}
        >
          {/* Section 1: Warehouse (only for Main Warehouse when not fixed from hub) */}
          {isMain && !isSpecificWarehouseChosen ? (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Warehouses</Text>
              <View style={styles.chipWrap}>
                <TouchableOpacity
                  style={[styles.filterModalChip, tempReportWarehouseId === undefined && styles.filterModalChipActive]}
                  onPress={() => setTempReportWarehouseId(undefined)}
                >
                  <Text style={[styles.filterModalChipText, tempReportWarehouseId === undefined && styles.filterModalChipTextActive]}>
                    All Warehouses
                  </Text>
                </TouchableOpacity>
                {warehouseOptions.map((wh) => {
                  if (!wh.warehouseId) return null;
                  const active = tempReportWarehouseId === wh.warehouseId;
                  return (
                    <TouchableOpacity
                      key={wh.warehouseId}
                      style={[styles.filterModalChip, active && styles.filterModalChipActive]}
                      onPress={() => setTempReportWarehouseId(wh.warehouseId)}
                    >
                      <Text style={[styles.filterModalChipText, active && styles.filterModalChipTextActive]}>
                        {wh.warehouseName ?? wh.warehouseId}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Section 2: Report-specific categories */}
          {currentScreen === 'sales_report' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sales Channel</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Online', 'Market', 'HORECA', 'B2B'] as const).map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={[styles.filterModalChip, tempSalesChannel === ch && styles.filterModalChipActive]}
                    onPress={() => setTempSalesChannel(ch)}
                  >
                    <Text style={[styles.filterModalChipText, tempSalesChannel === ch && styles.filterModalChipTextActive]}>
                      {ch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentScreen === 'inventory_report' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Stock Status</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Available', 'Low Stock', 'Out of Stock'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterModalChip, tempInvFilter === st && styles.filterModalChipActive]}
                    onPress={() => setTempInvFilter(st)}
                  >
                    <Text style={[styles.filterModalChipText, tempInvFilter === st && styles.filterModalChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentScreen === 'receiving_report' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Receiving QC Status</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Accepted', 'Partial', 'Rejected'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.filterModalChip, tempRecFilter === st && styles.filterModalChipActive]}
                    onPress={() => setTempRecFilter(st)}
                  >
                    <Text style={[styles.filterModalChipText, tempRecFilter === st && styles.filterModalChipTextActive]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentScreen === 'customer_report' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Customer Channel</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Online', 'Market', 'B2B'] as const).map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={[styles.filterModalChip, tempCustChannel === ch && styles.filterModalChipActive]}
                    onPress={() => setTempCustChannel(ch)}
                  >
                    <Text style={[styles.filterModalChipText, tempCustChannel === ch && styles.filterModalChipTextActive]}>
                      {ch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentScreen === 'cash_topup_report' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Period</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Today', 'This Month'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.filterModalChip, tempTopupPeriod === p && styles.filterModalChipActive]}
                    onPress={() => setTempTopupPeriod(p)}
                  >
                    <Text style={[styles.filterModalChipText, tempTopupPeriod === p && styles.filterModalChipTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentScreen === 'revenue_report' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Revenue Channel</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Online Order', 'Market Sale'] as const).map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    style={[styles.filterModalChip, tempRevChannel === ch && styles.filterModalChipActive]}
                    onPress={() => setTempRevChannel(ch)}
                  >
                    <Text style={[styles.filterModalChipText, tempRevChannel === ch && styles.filterModalChipTextActive]}>
                      {ch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentScreen === 'expense_report' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Expense Category</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Transport', 'Loading', 'Unloading', 'Maintenance', 'Other'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterModalChip, tempExpenseCategory === cat && styles.filterModalChipActive]}
                    onPress={() => setTempExpenseCategory(cat)}
                  >
                    <Text style={[styles.filterModalChipText, tempExpenseCategory === cat && styles.filterModalChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {currentScreen === 'returns_report' && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Issue Category</Text>
              <View style={styles.chipWrap}>
                {(['All', 'Quality', 'Quantity', 'Missing', 'Wrong', 'Damaged', 'Late'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterModalChip, tempReturnCategory === cat && styles.filterModalChipActive]}
                    onPress={() => setTempReturnCategory(cat)}
                  >
                    <Text style={[styles.filterModalChipText, tempReturnCategory === cat && styles.filterModalChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.filterFooter}>
          <TouchableOpacity
            style={styles.modalResetBtn}
            onPress={() => {
              setTempReportWarehouseId(undefined);
              setTempSalesChannel('All');
              setTempInvFilter('All');
              setTempRecFilter('All');
              setTempCustChannel('All');
              setTempTopupPeriod('All');
              setTempRevChannel('All');
              setTempExpenseCategory('All');
              setTempReturnCategory('All');
            }}
          >
            <Text style={styles.modalResetBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalApplyBtn}
            onPress={() => {
              setReportWarehouseId(tempReportWarehouseId);
              setSalesChannel(tempSalesChannel);
              setInvFilter(tempInvFilter);
              setRecFilter(tempRecFilter);
              setCustChannel(tempCustChannel);
              setTopupPeriod(tempTopupPeriod);
              setRevChannel(tempRevChannel);
              setExpenseCategory(tempExpenseCategory);
              setReturnCategory(tempReturnCategory);
              setShowReportFilterModal(false);
            }}
          >
            <Text style={styles.modalApplyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1: SALES REPORT (M12-S02)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'sales_report') {
    const SALES_REPORTS_DATA = salesData?.orders ?? [];

    const filteredSales = SALES_REPORTS_DATA.filter((item) => {
      if (!matchWarehouse(item.warehouse, item.warehouseId)) return false;
      if (salesChannel !== 'All' && item.channel !== salesChannel) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.orderId.toLowerCase().includes(q) ||
        item.customerRef.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q) ||
        item.invoiceNumber.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q)
      );
    });

    const totalSalesAmount = filteredSales.reduce((a, b) => a + b.amountNum, 0);
    const totalOrdersCount = filteredSales.length;
    const totalItemsCount = filteredSales.reduce((a, b) => a + b.items, 0);

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Sales Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards (2x2 Grid) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL SALES</Text>
              <Text style={styles.kpiValue}>
                {salesData?.summary?.totalSales ?? formatMoney(String(totalSalesAmount))}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ORDERS</Text>
              <Text style={styles.kpiValue}>{salesData?.summary?.ordersCount ?? totalOrdersCount}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG ORDER</Text>
              <Text style={styles.kpiValue}>
                {salesData?.summary?.avgOrder ?? (filteredSales.length > 0 ? formatMoney(String(Math.round(totalSalesAmount / filteredSales.length))) : '—')}
              </Text>
            </View>
          </View>

          {/* Channel Filters: Subwarehouse only (for Main Warehouse, removed from top of search bar) */}
          {!isMain && (
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
          )}

          {/* Search Input with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Order ID, Invoice, Customer, Product"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Filter"
            >
              <FilterIcon size={16} color={reportWarehouseId || salesChannel !== 'All' ? adminColors.brand : adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Sales Transaction Cards */}
          <View style={styles.recordsStack}>
            {filteredSales.map((item) => (
              <TouchableOpacity
                key={item.orderId}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedOrder({
                    orderId: item.orderId,
                    date: item.date,
                    channel: item.channel,
                    customerRef: item.customerRef,
                    warehouse: item.warehouse,
                    product: item.product,
                    grade: item.grade,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.amount,
                    paymentMethod: item.paymentMethod,
                    paymentStatus: item.paymentStatus,
                    txnRef: item.txnRef,
                    invoiceNumber: item.invoiceNumber,
                    invoiceStatus: item.invoiceStatus,
                  });
                  setCurrentScreen('sales_order_detail');
                }}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.orderId}</Text>
                  <View style={styles.greenBadgePill}>
                    <Text style={styles.greenBadgeText}>Completed</Text>
                  </View>
                </View>
                <Text style={styles.recordSubText}>
                  {item.customerRef} · {item.channel} · {item.items} items{isMain && !isSpecificWarehouseChosen && !reportWarehouseId ? ` · ${item.warehouse}` : ''}
                </Text>
                <Text style={styles.recordAmountText}>{item.amount}</Text>
                <Text style={styles.recordDateText}>{item.date}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sales Chart Section */}
          <Text style={styles.chartSectionTitle}>Sales Chart</Text>
          <View style={styles.chartTabRow}>
            {(['Sales Amount', 'Orders', 'Quantity'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.chartTabBtn, chartTab === tab && styles.chartTabBtnActive]}
                onPress={() => setChartTab(tab)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chartTabText, chartTab === tab && styles.chartTabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chartContainerCard}>
            <View style={styles.barGraphArea}>
              {[
                { day: 'Mon', val: '38k', height: 50 },
                { day: 'Tue', val: '45k', height: 70 },
                { day: 'Wed', val: '52k', height: 95 },
                { day: 'Thu', val: '49k', height: 82 },
              ].map((b) => (
                <View key={b.day} style={styles.barColumn}>
                  <Text style={styles.barValueText}>₹{b.val}</Text>
                  <View style={[styles.barVisual, { height: b.height }]} />
                  <Text style={styles.barDayText}>{b.day}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.chartDescText}>Sales trend chart — Mon–Thu revenue bars</Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {renderReportFilterModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: SALES ORDER DETAILS (M12-S02-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'sales_order_detail') {
    if (!selectedOrder) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('sales_report')} activeOpacity={0.75}>
                  <ArrowBackIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>{isMain ? 'Sales Order Detail' : 'Sales detail'}</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <AdminEmptyState title="No order selected" subtitle="Select an order from the list." />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('sales_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>{isMain ? 'Sales Order Detail' : 'Sales detail'}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Order Information Section */}
          <Text style={styles.detailSectionTitle}>Order Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.orderId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.date}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Sales Channel</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.channel}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Customer Reference</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.customerRef}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Warehouse</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.warehouse}</Text>
              </View>
            </View>
          </View>

          {/* Product Information Section */}
          <Text style={styles.detailSectionTitle}>Product Information</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Product</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.product}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Grade</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.grade}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.quantity}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Unit Price</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.unitPrice}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.amount}</Text>
              </View>
            </View>
          </View>

          {/* Payment Section */}
          <Text style={styles.detailSectionTitle}>Payment</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.paymentMethod}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.paymentStatus}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Transaction Reference</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.txnRef}</Text>
              </View>
            </View>
          </View>

          {/* Billing Section */}
          <Text style={styles.detailSectionTitle}>Billing</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Invoice Number</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.invoiceNumber}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Invoice Status</Text>
                <Text style={styles.detailValueBold}>{selectedOrder.invoiceStatus}</Text>
              </View>
            </View>
          </View>

          {/* Actions Section */}
          <Text style={styles.detailSectionTitle}>Actions</Text>
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.actionCardBtn}
              activeOpacity={0.75}
              onPress={() => {
                setSearchQuery('');
                setCurrentScreen('orders_list');
              }}
            >
              <ShoppingBagIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.actionCardBtnText}>View Order</Text>
            </TouchableOpacity>

            {can('invoice.view_own') ? (
              <TouchableOpacity
                style={styles.actionCardBtn}
                activeOpacity={0.75}
                onPress={() => setCurrentScreen('invoice_detail')}
              >
                <InvoiceDocumentIcon size={18} color={adminColors.brandDeep} />
                <Text style={styles.actionCardBtnText}>View Invoice</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {isMain ? (
            // Ported from the W3b ReportDetailScreen (Main sales/returns record detail).
            <View style={[styles.orangeInfoBox, styles.pickerGroupGap]}>
              <Text style={styles.orangeInfoText}>
                Deep-links to the owning module for the actual record — never a duplicate workflow.
              </Text>
            </View>
          ) : null}

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: INVOICE DETAIL
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'invoice_detail') {
    return (
      <InvoiceDetailScreen
        scope={scope}
        can={can}
        invoiceId={selectedOrder?.invoiceNumber || ''}
        onBack={() => setCurrentScreen('sales_order_detail')}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: ORDERS LIST (M12-S02-ORDERS)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'orders_list') {
    const ordersData = salesData?.orders ?? [];

    const filteredOrders = ordersData.filter((o) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return o.orderId.toLowerCase().includes(q) || (o.customerRef && o.customerRef.toLowerCase().includes(q));
    });

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('sales_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Orders</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Orders Count */}
          <Text style={styles.ordersCountText}>{filteredOrders.length} Orders</Text>

          {/* Search Bar */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search order / customer / phone"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Orders List */}
          <View style={{ gap: 12 }}>
            {filteredOrders.map((ord) => (
              <TouchableOpacity
                key={ord.orderId}
                style={styles.orderListCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedOrder(ord);
                  setCurrentScreen('sales_order_detail');
                }}
              >
                <View style={styles.orderCardTopRow}>
                  <Text style={styles.orderCardId}>{ord.orderId}</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: adminColors.brandTint }]}>
                    <Text style={[styles.orderStatusText, { color: adminColors.brandDeep }]}>{ord.status}</Text>
                  </View>
                </View>

                <Text style={styles.orderCustomerName}>{ord.customerRef || '—'}</Text>

                <View style={styles.orderItemsPriceRow}>
                  <Text style={styles.orderItemsCount}>{ord.quantity}</Text>
                  <Text style={styles.orderAmountBold}>{ord.amount}</Text>
                </View>

                <View style={styles.orderMetaRow}>
                  <View style={styles.orderTypeGroup}>
                    <StorePickupIcon size={14} color={adminColors.muted} />
                    <Text style={styles.orderTypeText}>{ord.channel}</Text>
                  </View>
                  <Text style={styles.orderTimeText}>{ord.date}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2: INVENTORY REPORT (M12-S03)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'inventory_report') {
    const INVENTORY_REPORTS_DATA = inventoryRows;

    const filteredInventory = INVENTORY_REPORTS_DATA.filter((item) => {
      if (!matchWarehouse(item.warehouse, item.warehouseId)) return false;
      if (invFilter !== 'All' && item.status !== invFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.productCode.toLowerCase().includes(q) ||
        item.crop.toLowerCase().includes(q) ||
        item.batchCode.toLowerCase().includes(q) ||
        item.storageLocation.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q)
      );
    });

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Inventory Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards (2x2 Grid) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL PRODUCTS</Text>
              <Text style={styles.kpiValue}>
                {filteredInventory.length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVAILABLE STOCK</Text>
              <Text style={styles.kpiValue}>
                {`${filteredInventory.reduce((sum, item) => sum + (parseInt(item.availableQty.replace(/[^0-9]/g, ''), 10) || 0), 0).toLocaleString('en-IN')} kg`}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>LOW STOCK</Text>
              <Text style={styles.kpiValue}>
                {filteredInventory.filter((i) => i.status === 'Low Stock').length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>OUT OF STOCK</Text>
              <Text style={styles.kpiValue}>
                {filteredInventory.filter((i) => i.status === 'Out of Stock').length}
              </Text>
            </View>
          </View>

          {/* Stock Filters: Subwarehouse only (for Main Warehouse, removed from top of search bar) */}
          {!isMain && (
            <View style={styles.filterChipRow}>
              {(['All', 'Available', 'Low Stock', 'Out of Stock'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, invFilter === st && styles.filterChipActive]}
                  onPress={() => setInvFilter(st)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, invFilter === st && styles.filterChipTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Product, code, batch, location"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Filter"
            >
              <FilterIcon size={16} color={reportWarehouseId || invFilter !== 'All' ? adminColors.brand : adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Produce Inventory Items */}
          <View style={styles.recordsStack}>
            {filteredInventory.map((item) => (
              <TouchableOpacity
                key={item.productCode}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedInventoryItem({
                    productName: item.productName,
                    productCode: item.productCode,
                    crop: item.crop,
                    grade: item.grade,
                    availableQty: item.availableQty,
                    reservedQty: item.reservedQty,
                    allocatedQty: item.allocatedQty,
                    consumedQty: item.consumedQty,
                    batchCode: item.batchCode,
                    receivedDate: item.receivedDate,
                    storageLocation: item.storageLocation,
                    status: item.status,
                    movementReceived: item.movementReceived,
                    movementAvailable: item.movementAvailable,
                    movementReserved: item.movementReserved,
                    movementSold: item.movementSold,
                    lastVerification: item.lastVerification,
                    verifiedQty: item.verifiedQty,
                    difference: item.difference,
                    verificationStatus: item.verificationStatus,
                  });
                  setCurrentScreen('inventory_item_detail');
                }}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.productName} — {item.grade}</Text>
                  <View style={item.status === 'Available' ? styles.greenBadgePill : item.status === 'Low Stock' ? [styles.badgePillBase, { backgroundColor: adminColors.warning.bg }] : [styles.badgePillBase, { backgroundColor: adminColors.danger.bg }]}>
                    <Text style={item.status === 'Available' ? styles.greenBadgeText : item.status === 'Low Stock' ? [styles.badgeTextBase, { color: adminColors.warning.text }] : [styles.badgeTextBase, { color: adminColors.danger.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recordSubText}>
                  {item.storageLocation} · Batch {item.batchCode}{isMain && !isSpecificWarehouseChosen && !reportWarehouseId ? ` · ${item.warehouse}` : ''}
                </Text>
                <Text style={[styles.recordAmountText, item.status !== 'Available' ? { color: adminColors.warning.text } : undefined]}>
                  {item.availableQty}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {renderReportFilterModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: INVENTORY ITEM DETAILS (M12-S03-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'inventory_item_detail') {
    if (!selectedInventoryItem) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('inventory_report')} activeOpacity={0.75}>
                  <ArrowBackIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Inventory Item Detail</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <AdminEmptyState title="No inventory item selected" subtitle="Select an item from the list." />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('inventory_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Inventory Detail</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Product Section */}
          <Text style={styles.detailSectionTitle}>Product</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Product Name</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.productName}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Product Code</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.productCode}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Crop</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.crop}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Grade</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.grade}</Text>
              </View>
            </View>
          </View>

          {/* Stock Section */}
          <Text style={styles.detailSectionTitle}>Stock</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Available Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.availableQty}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Reserved Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.reservedQty}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Allocated Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.allocatedQty}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Consumed Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.consumedQty}</Text>
              </View>
            </View>
          </View>

          {/* Batch Section */}
          <Text style={styles.detailSectionTitle}>Batch</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Batch Code</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.batchCode}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Received Date</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.receivedDate}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Storage Location</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.storageLocation}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Current Status</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.status}</Text>
              </View>
            </View>
          </View>

          {/* Stock Movement Section */}
          <Text style={styles.detailSectionTitle}>Stock Movement</Text>
          <View style={styles.detailCard}>
            <View style={styles.movementFlowRow}>
              <View style={styles.movementStep}>
                <Text style={styles.movementLabel}>RECEIVED</Text>
                <Text style={styles.movementVal}>{selectedInventoryItem.movementReceived}</Text>
              </View>
              <Text style={styles.movementArrow}>→</Text>
              <View style={styles.movementStep}>
                <Text style={styles.movementLabel}>AVAILABLE</Text>
                <Text style={styles.movementVal}>{selectedInventoryItem.movementAvailable}</Text>
              </View>
              <Text style={styles.movementArrow}>→</Text>
              <View style={styles.movementStep}>
                <Text style={styles.movementLabel}>RESERVED</Text>
                <Text style={styles.movementVal}>{selectedInventoryItem.movementReserved}</Text>
              </View>
              <Text style={styles.movementArrow}>→</Text>
              <View style={styles.movementStep}>
                <Text style={styles.movementLabel}>SOLD</Text>
                <Text style={styles.movementVal}>{selectedInventoryItem.movementSold}</Text>
              </View>
            </View>
          </View>

          {/* Stock Verification Summary Section */}
          <Text style={styles.detailSectionTitle}>Stock Verification Summary</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Last Verification</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.lastVerification}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Verified Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.verifiedQty}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Difference</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.difference}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Verification Status</Text>
                <Text style={styles.detailValueBold}>{selectedInventoryItem.verificationStatus}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 3: RECEIVING REPORT (M12-S04)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'receiving_report') {
    const RECEIVING_REPORTS_DATA = receivingRows;

    const filteredReceiving = RECEIVING_REPORTS_DATA.filter((item) => {
      if (!matchWarehouse(item.warehouse, item.warehouseId)) return false;
      if (recFilter !== 'All' && item.qualityStatus !== recFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.receiptId.toLowerCase().includes(q) ||
        item.sourceRef.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q)
      );
    });

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Receiving Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 5 KPI Cards (2x2 + 1 Full Width) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>RECEIPTS</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId ? filteredReceiving.length : 24}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>QTY RECEIVED</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId
                  ? `${filteredReceiving.reduce((sum, item) => sum + item.qtyNum, 0)} kg`
                  : '8,420 kg'}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ACCEPTED</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId
                  ? `${filteredReceiving.reduce((sum, item) => sum + item.acceptedNum, 0)} kg`
                  : '7,950 kg'}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>REJECTED</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId
                  ? `${filteredReceiving.reduce((sum, item) => sum + item.rejectedNum, 0)} kg`
                  : '320 kg'}
              </Text>
            </View>
            <View style={[styles.kpiCard, styles.kpiCardFull]}>
              <Text style={styles.kpiLabel}>PARTIAL</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId
                  ? `${filteredReceiving.reduce((sum, item) => sum + item.partialNum, 0)} kg`
                  : '150 kg'}
              </Text>
            </View>
          </View>

          {/* Receiving Filters: Subwarehouse only (for Main Warehouse, removed from top of search bar) */}
          {!isMain && (
            <View style={styles.filterChipRow}>
              {(['All', 'Accepted', 'Partial', 'Rejected'] as const).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, recFilter === st && styles.filterChipActive]}
                  onPress={() => setRecFilter(st)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, recFilter === st && styles.filterChipTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Input with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="GR ID, Farmer ref, Product, Batch"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Filter"
            >
              <FilterIcon size={16} color={reportWarehouseId || recFilter !== 'All' ? adminColors.brand : adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Receiving Report Items */}
          <View style={styles.recordsStack}>
            {filteredReceiving.map((item) => (
              <TouchableOpacity
                key={item.receiptId}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedReceivingItem({
                    receiptId: item.receiptId,
                    dateTime: item.dateTime,
                    warehouse: item.warehouse,
                    sourceRef: item.sourceRef,
                    product: item.product,
                    grade: item.grade,
                    qtyReceived: item.qtyReceived,
                    qualityStatus: item.qualityStatus === 'Accepted' ? 'Accepted' : item.qualityStatus === 'Rejected' ? 'QC Rejected' : 'QC Partial',
                    acceptedQty: item.acceptedQty,
                    partialQty: item.partialQty,
                    rejectedQty: item.rejectedQty,
                    qcNotes: item.qcNotes,
                    timeline: item.timeline,
                  });
                  setCurrentScreen('receiving_item_detail');
                }}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.receiptId}</Text>
                  <View style={item.qualityStatus === 'Accepted' ? styles.greenBadgePill : item.qualityStatus === 'Rejected' ? [styles.badgePillBase, { backgroundColor: adminColors.danger.bg }] : [styles.badgePillBase, { backgroundColor: adminColors.warning.bg }]}>
                    <Text style={item.qualityStatus === 'Accepted' ? styles.greenBadgeText : item.qualityStatus === 'Rejected' ? [styles.badgeTextBase, { color: adminColors.danger.text }] : [styles.badgeTextBase, { color: adminColors.warning.text }]}>
                      {item.qualityStatus === 'Accepted' ? 'QC Accepted' : item.qualityStatus === 'Rejected' ? 'QC Rejected' : 'QC Partial'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recordSubText}>{item.product} — {item.grade}{isMain && !isSpecificWarehouseChosen && !reportWarehouseId ? ` · ${item.warehouse}` : ''}</Text>
                <View style={styles.receivingAmountRow}>
                  <Text style={styles.receivedQtyMuted}>Received {item.qtyReceived}</Text>
                  <Text style={[styles.acceptedQtyBold, item.qualityStatus === 'Rejected' ? { color: adminColors.danger.text } : undefined]}>
                    {item.qualityStatus === 'Rejected' ? `Rejected ${item.rejectedQty}` : `Accepted ${item.acceptedQty}`}
                  </Text>
                </View>
                <Text style={styles.recordDateText}>{item.dateTime}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {renderReportFilterModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: RECEIVING ITEM DETAILS (M12-S04-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'receiving_item_detail') {
    if (!selectedReceivingItem) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('receiving_report')} activeOpacity={0.75}>
                  <ArrowBackIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Receiving Item Detail</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <AdminEmptyState title="No receiving item selected" subtitle="Select an item from the list." />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('receiving_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Receiving Detail</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Receipt Section */}
          <Text style={styles.detailSectionTitle}>Receipt</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Goods Receipt ID</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.receiptId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Date/Time</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.dateTime}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Warehouse</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.warehouse}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Source/Reference</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.sourceRef}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Product</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.product}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Grade</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.grade}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Quantity Received</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.qtyReceived}</Text>
              </View>
              <View style={styles.detailCol} />
            </View>
          </View>

          {/* QC Section */}
          <Text style={styles.detailSectionTitle}>QC</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Quality Status</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.qualityStatus}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Accepted Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.acceptedQty}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Partial Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.partialQty}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Rejected Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedReceivingItem.rejectedQty}</Text>
              </View>
            </View>

            <View style={{ marginTop: 2 }}>
              <Text style={styles.detailLabel}>QC Notes</Text>
              <Text style={styles.detailValueBold}>{selectedReceivingItem.qcNotes}</Text>
            </View>
          </View>

          {/* Timeline Section */}
          <Text style={styles.detailSectionTitle}>Timeline</Text>
          <View style={styles.detailCard}>
            <View style={styles.timelineList}>
              {selectedReceivingItem.timeline?.map((step: any, idx: number) => (
                <View key={step.title} style={styles.timelineItem}>
                  <View style={styles.timelineLeftCol}>
                    <TimelineDotIcon />
                    {idx < selectedReceivingItem.timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{step.title}</Text>
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 4: CUSTOMER REPORT (M12-S05)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'customer_report') {
    const CUSTOMER_DATA = customerRows;

    const filteredCustomers = CUSTOMER_DATA.filter((cust) => {
      if (!matchWarehouse(cust.warehouse, cust.warehouseId)) return false;
      const matchQuery =
        !searchQuery ||
        cust.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.mobile.includes(searchQuery) ||
        cust.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
      const matchChannel = custChannel === 'All' || cust.channel === custChannel;
      return matchQuery && matchChannel;
    });

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Customer Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards (2x2 Grid) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL CUSTOMERS</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId ? filteredCustomers.length : 1248}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ACTIVE CUSTOMERS</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId ? filteredCustomers.length : 986}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>NEW CUSTOMERS</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId ? Math.min(filteredCustomers.length, 2) : 42}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ORDERS</Text>
              <Text style={styles.kpiValue}>
                {isSpecificWarehouseChosen || reportWarehouseId
                  ? filteredCustomers.reduce((sum, c) => sum + c.orders, 0)
                  : 284}
              </Text>
            </View>
          </View>

          {/* Customer Channel Filters: Subwarehouse only (for Main Warehouse, removed from top of search bar) */}
          {!isMain && (
            <View style={styles.filterChipRow}>
              {(['All', 'Online', 'Market', 'B2B'] as const).map((ch) => (
                <TouchableOpacity
                  key={ch}
                  style={[styles.filterChip, custChannel === ch && styles.filterChipActive]}
                  onPress={() => setCustChannel(ch)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, custChannel === ch && styles.filterChipTextActive]}>{ch}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Customer ID, name, mobile"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Filter"
            >
              <FilterIcon size={16} color={reportWarehouseId || custChannel !== 'All' ? adminColors.brand : adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Customer Records Stack */}
          <View style={styles.recordsStack}>
            {filteredCustomers.map((cust) => (
              <TouchableOpacity
                key={cust.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedCustomerItem({
                    customerId: cust.id,
                    name: cust.name,
                    contact: cust.mobile,
                    category: cust.channel,
                    totalOrders: String(cust.orders),
                    completedOrders: String(cust.completedOrders),
                    cancelledOrders: String(cust.cancelledOrders),
                    totalPurchaseValue: cust.totalSpent,
                    orderHistory: cust.orderHistory,
                    orderFrequency: cust.frequency,
                    purchaseAmount: cust.totalSpent,
                    lastActivity: cust.lastOrder,
                  });
                  setCurrentScreen('customer_item_detail');
                }}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{cust.id}</Text>
                  <Text style={styles.recordAmountText}>{cust.totalSpent}</Text>
                </View>
                <Text style={styles.recordSubText}>
                  {cust.name}{isMain && !isSpecificWarehouseChosen && !reportWarehouseId ? ` · ${cust.warehouse}` : ''}
                </Text>
                <Text style={styles.custOrdersText}>{cust.orders} orders</Text>
                <Text style={styles.recordDateText}>Last order {cust.lastOrder}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {renderReportFilterModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: CUSTOMER ITEM DETAILS (M12-S05-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'customer_item_detail') {
    if (!selectedCustomerItem) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('customer_report')} activeOpacity={0.75}>
                  <ArrowBackIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Customer Detail</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <AdminEmptyState title="No customer selected" subtitle="Select a customer from the list." />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('customer_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Customer Detail</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Basic Section */}
          <Text style={styles.detailSectionTitle}>Basic</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Customer ID</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.customerId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.name}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Contact</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.contact}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.category}</Text>
              </View>
            </View>
          </View>

          {/* Purchase Summary Section */}
          <Text style={styles.detailSectionTitle}>Purchase Summary</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Total Orders</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.totalOrders}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Completed Orders</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.completedOrders}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Cancelled Orders</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.cancelledOrders}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Total Purchase Value</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.totalPurchaseValue}</Text>
              </View>
            </View>
          </View>

          {/* Order History Section */}
          <Text style={styles.detailSectionTitle}>Order History</Text>
          <View style={styles.detailCard}>
            {selectedCustomerItem.orderHistory.map((item: any, idx: number) => (
              <React.Fragment key={item.orderId}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyOrderId}>{item.orderId}</Text>
                  <Text style={styles.historyOrderDetails}>
                    {item.amount} · {item.status}
                  </Text>
                </View>
                {idx < selectedCustomerItem.orderHistory.length - 1 && <View style={styles.breakdownDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Report Metrics Section */}
          <Text style={styles.detailSectionTitle}>Report Metrics</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Order Frequency</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.orderFrequency}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Purchase Amount</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.purchaseAmount}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Last Activity</Text>
                <Text style={styles.detailValueBold}>{selectedCustomerItem.lastActivity}</Text>
              </View>
              <View style={styles.detailCol} />
            </View>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 5: CASH TOP-UP REPORT (M12-S06)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'cash_topup_report') {
    const TOPUP_DATA = topupRows;

    const filteredTopups = TOPUP_DATA.filter((item) => {
      if (!matchWarehouse(item.warehouse, item.warehouseId)) return false;
      const matchQuery =
        !searchQuery ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPeriod = topupPeriod === 'All' || item.period === topupPeriod || (topupPeriod === 'This Month');
      return matchQuery && matchPeriod;
    });

    const topupsSum = filteredTopups.reduce((sum, item) => sum + item.amountNum, 0);

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Cash Top-Up Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards (2x2 Grid) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S TOP-UPS</Text>
              <Text style={styles.kpiValue}>
                {topupReport ? formatMoney(topupReport.total) : formatMoney(String(topupsSum))}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
              <Text style={styles.kpiValue}>
                {topupReport ? topupReport.count : filteredTopups.length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG TOP-UP</Text>
              <Text style={styles.kpiValue}>
                {filteredTopups.length > 0
                  ? formatMoney(String(Math.round(topupsSum / filteredTopups.length)))
                  : (topupReport && topupReport.count > 0 ? formatMoney(String(Math.round(Number(topupReport.total) / topupReport.count))) : '—')}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>THIS MONTH</Text>
              <Text style={styles.kpiValue}>{topupReport ? formatMoney(topupReport.total) : '—'}</Text>
            </View>
          </View>

          {/* Filter Chips: Subwarehouse only (for Main Warehouse, removed from top of search bar) */}
          {!isMain && (
            <View style={styles.filterChipRow}>
              {(['All', 'Today', 'This Month'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.filterChip, topupPeriod === p && styles.filterChipActive]}
                  onPress={() => setTopupPeriod(p)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, topupPeriod === p && styles.filterChipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Top-up ID, Customer ID, Reference"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Filter"
            >
              <FilterIcon size={16} color={reportWarehouseId || topupPeriod !== 'All' ? adminColors.brand : adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Top-Up Record Cards */}
          <View style={styles.recordsStack}>
            {filteredTopups.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedCashTopupItem({
                    topupId: item.id,
                    customerId: item.customerId,
                    amount: item.amount,
                    paymentMethod: item.paymentMethod,
                    dateTime: item.dateTime,
                    processedBy: item.processedBy,
                    status: item.status,
                    referenceId: item.referenceId,
                    cashTagFiscalRef: item.cashTagFiscalRef,
                  });
                  setCurrentScreen('cash_topup_item_detail');
                }}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.id}</Text>
                  <View style={styles.greenBadgePill}>
                    <Text style={styles.greenBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.recordSubText}>
                  {item.customer}{isMain && !isSpecificWarehouseChosen && !reportWarehouseId ? ` · ${item.warehouse}` : ''}
                </Text>
                <View style={styles.topupAmountRow}>
                  <Text style={styles.topupAmountBold}>{item.amount}</Text>
                  <Text style={styles.swaTagText}>{item.auth}</Text>
                </View>
                <Text style={styles.recordDateText}>{item.time}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {renderReportFilterModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: CASH TOP-UP ITEM DETAILS (M12-S06-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'cash_topup_item_detail') {
    if (!selectedCashTopupItem) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('cash_topup_report')} activeOpacity={0.75}>
                  <ArrowBackIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Top-Up Detail</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <AdminEmptyState title="No top-up selected" subtitle="Select a top-up from the list." />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('cash_topup_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Top-Up Detail</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top-Up Detail Section */}
          <Text style={styles.detailSectionTitle}>Top-Up Detail</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Top-Up ID</Text>
                <Text style={styles.detailValueBold}>{selectedCashTopupItem.topupId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Customer ID</Text>
                <Text style={styles.detailValueBold}>{selectedCashTopupItem.customerId}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValueBold}>{selectedCashTopupItem.amount}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValueBold}>{selectedCashTopupItem.paymentMethod}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Date/Time</Text>
                <Text style={styles.detailValueBold}>{selectedCashTopupItem.dateTime}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Processed By</Text>
                <Text style={styles.detailValueBold}>{selectedCashTopupItem.processedBy}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Transaction Status</Text>
                <Text style={styles.detailValueBold}>{selectedCashTopupItem.status}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Reference ID</Text>
                <Text style={styles.detailValueBold}>{selectedCashTopupItem.referenceId}</Text>
              </View>
            </View>

            <View style={{ marginTop: 2 }}>
              <Text style={styles.detailLabel}>Cash Tag / Fiscal Reference</Text>
              <Text style={styles.detailValueBold}>{selectedCashTopupItem.cashTagFiscalRef}</Text>
            </View>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 6: REVENUE REPORT (M12-S08)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'revenue_report') {
    const REVENUE_DATA = revenueRows;

    const filteredRevenue = REVENUE_DATA.filter((item) => {
      if (!matchWarehouse(item.warehouse, item.warehouseId)) return false;
      if (revChannel !== 'All' && !item.type.toLowerCase().includes(revChannel.toLowerCase())) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.order.toLowerCase().includes(q) ||
        item.paymentMethod.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q)
      );
    });

    const revSum = filteredRevenue.reduce((sum, item) => sum + item.amountNum, 0);

    const onlineSum = filteredRevenue.filter((i) => i.type === 'Online Order').reduce((s, i) => s + i.amountNum, 0);
    const marketSum = filteredRevenue.filter((i) => i.type === 'Market Sale').reduce((s, i) => s + i.amountNum, 0);
    const REVENUE_SOURCES = [
      { channel: 'Online Orders', value: formatMoney(String(onlineSum)) },
      { channel: 'Market Sales', value: formatMoney(String(marketSum)) },
      { channel: 'HORECA', value: '—' },
      { channel: 'B2B', value: '—' },
    ];

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Revenue Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards (2x2 Grid) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
              <Text style={styles.kpiValue}>
                {formatMoney(String(revSum))}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY</Text>
              <Text style={styles.kpiValue}>
                {formatMoney(String(revSum))}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ORDERS</Text>
              <Text style={styles.kpiValue}>
                {filteredRevenue.length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG SALE</Text>
              <Text style={styles.kpiValue}>
                {filteredRevenue.length > 0
                  ? formatMoney(String(Math.round(revSum / filteredRevenue.length)))
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Revenue Sources Section */}
          <Text style={styles.summarySectionTitle}>Revenue Sources</Text>
          <View style={styles.breakdownCard}>
            {REVENUE_SOURCES.map((src, idx) => (
              <React.Fragment key={src.channel}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{src.channel}</Text>
                  <Text style={styles.breakdownValue}>{src.value}</Text>
                </View>
                {idx < REVENUE_SOURCES.length - 1 && <View style={styles.breakdownDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Revenue ID, Order ID..."
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Filter"
            >
              <FilterIcon size={16} color={reportWarehouseId || revChannel !== 'All' ? adminColors.brand : adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Revenue Records Stack */}
          <View style={styles.recordsStack}>
            {filteredRevenue.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedRevenueItem({
                    revenueId: item.id,
                    orderId: item.orderId,
                    invoice: item.invoice,
                    channel: item.type,
                    product: item.product,
                    quantity: item.quantity,
                    amount: item.amount,
                    paymentMethod: item.paymentMethod,
                    status: item.status,
                    dateTime: item.dateTime,
                    warehouse: item.warehouse,
                  });
                  setCurrentScreen('revenue_item_detail');
                }}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.id}</Text>
                  <View style={styles.greenBadgePill}>
                    <Text style={styles.greenBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.recordSubText}>
                  {item.type} · {item.order}{isMain && !isSpecificWarehouseChosen && !reportWarehouseId ? ` · ${item.warehouse}` : ''}
                </Text>
                <View style={styles.topupAmountRow}>
                  <Text style={[styles.topupAmountBold, { color: adminColors.success.text }]}>{item.amount}</Text>
                  <Text style={styles.swaTagText}>{item.paymentMethod}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Revenue Chart Section */}
          <Text style={styles.summarySectionTitle}>Revenue Chart</Text>
          <View style={styles.filterChipRow}>
            {(['Daily', 'Weekly', 'Monthly'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.filterChip, revChartPeriod === period && styles.filterChipActive]}
                onPress={() => setRevChartPeriod(period)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, revChartPeriod === period && styles.filterChipTextActive]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chartBoxContainer}>
            <Text style={styles.chartSubtitle}>
              Revenue trend — Revenue / Orders / Quantity
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {renderReportFilterModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: REVENUE ITEM DETAILS (M12-S08-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'revenue_item_detail') {
    if (!selectedRevenueItem) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('revenue_report')} activeOpacity={0.75}>
                  <ArrowBackIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Revenue Detail</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <AdminEmptyState title="No revenue item selected" subtitle="Select a revenue record from the list." />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('revenue_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Revenue Detail</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Revenue Detail Section */}
          <Text style={styles.detailSectionTitle}>Revenue Detail</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Revenue ID</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.revenueId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.orderId}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Invoice</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.invoice}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Channel</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.channel}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Products</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.product}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.quantity}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.amount}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.paymentMethod}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Transaction Status</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.status}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Date/Time</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.dateTime}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Warehouse</Text>
                <Text style={styles.detailValueBold}>{selectedRevenueItem.warehouse}</Text>
              </View>
              <View style={styles.detailCol} />
            </View>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 7: EXPENSE REPORT (M12-S07)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'expense_report') {
    const EXPENSE_DATA = expenseRows;

    const filteredExpenses = EXPENSE_DATA.filter((item) => {
      if (!matchWarehouse(item.warehouse ?? undefined, item.warehouseId ?? undefined)) return false;
      if (expenseCategory !== 'All' && item.category !== expenseCategory) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.voucher.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.vendorPayee.toLowerCase().includes(q) ||
        (item.warehouse ?? '').toLowerCase().includes(q)
      );
    });

    const expSum = filteredExpenses.reduce((sum, item) => sum + item.amountNum, 0);

    const BREAKDOWN_CATEGORIES = [
      { name: 'Transport', amount: formatMoney(String(filteredExpenses.filter((i) => i.category === 'Transport').reduce((s, i) => s + i.amountNum, 0))) },
      { name: 'Loading', amount: formatMoney(String(filteredExpenses.filter((i) => i.category === 'Loading').reduce((s, i) => s + i.amountNum, 0))) },
      { name: 'Unloading', amount: formatMoney(String(filteredExpenses.filter((i) => i.category === 'Unloading').reduce((s, i) => s + i.amountNum, 0))) },
      { name: 'Maintenance', amount: formatMoney(String(filteredExpenses.filter((i) => i.category === 'Maintenance').reduce((s, i) => s + i.amountNum, 0))) },
      { name: 'Other', amount: formatMoney(String(filteredExpenses.filter((i) => i.category === 'Other').reduce((s, i) => s + i.amountNum, 0))) },
    ];

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Expense Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards (2x2 Grid) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL EXPENSES</Text>
              <Text style={styles.kpiValue}>
                {formatMoney(String(expSum))}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
              <Text style={styles.kpiValue}>
                {filteredExpenses.length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG EXPENSE</Text>
              <Text style={styles.kpiValue}>
                {filteredExpenses.length > 0
                  ? formatMoney(String(Math.round(expSum / filteredExpenses.length)))
                  : '—'}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PENDING</Text>
              <Text style={styles.kpiValue}>
                {filteredExpenses.filter((i) => i.status === 'Pending').length}
              </Text>
            </View>
          </View>

          {/* Expense Breakdown Section */}
          <Text style={styles.breakdownSectionTitle}>Expense Breakdown</Text>
          <View style={styles.breakdownCard}>
            {BREAKDOWN_CATEGORIES.map((cat, idx) => (
              <React.Fragment key={cat.name}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{cat.name}</Text>
                  <Text style={styles.breakdownValue}>{cat.amount}</Text>
                </View>
                {idx < BREAKDOWN_CATEGORIES.length - 1 && <View style={styles.breakdownDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Expense ID, Voucher ID, Vendor"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Filter"
            >
              <FilterIcon size={16} color={reportWarehouseId || expenseCategory !== 'All' ? adminColors.brand : adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Expense Records Stack */}
          <View style={styles.recordsStack}>
            {filteredExpenses.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedExpenseItem({
                    expenseId: item.id,
                    category: item.category,
                    amount: item.amount,
                    date: item.date,
                    paymentMethod: item.paymentMethod,
                    vendorPayee: item.vendorPayee,
                    voucher: item.voucher,
                    status: item.status,
                    description: item.description,
                    createdBy: item.createdBy,
                    timeline: item.timeline,
                  });
                  setCurrentScreen('expense_item_detail');
                }}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.id}</Text>
                  <View
                    style={
                      item.status === 'Recorded'
                        ? styles.expenseRecordedBadge
                        : [styles.badgePillBase, { backgroundColor: adminColors.warning.bg }]
                    }
                  >
                    <Text
                      style={
                        item.status === 'Recorded'
                          ? styles.expenseRecordedText
                          : [styles.badgeTextBase, { color: adminColors.warning.text }]
                      }
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recordSubText}>
                  {item.category} · {item.voucher}{isMain && !isSpecificWarehouseChosen && !reportWarehouseId ? ` · ${item.warehouse}` : ''}
                </Text>
                <Text style={styles.expenseAmountRed}>{item.amount}</Text>
                <Text style={styles.recordDateText}>{item.date}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Chart Section */}
          <Text style={styles.breakdownSectionTitle}>Chart</Text>
          <View style={styles.chartBoxContainer}>
            <Text style={styles.chartSubtitle}>
              Expense by Category — Transport / Loading / Unloading / Maintenance / Other
            </Text>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {renderReportFilterModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: EXPENSE ITEM DETAILS (M12-S07-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'expense_item_detail') {
    if (!selectedExpenseItem) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('expense_report')} activeOpacity={0.75}>
                  <ArrowBackIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Expense Detail</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <AdminEmptyState title="No expense selected" subtitle="Select an expense from the list." />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('expense_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Expense Detail</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Expense Detail Section */}
          <Text style={styles.detailSectionTitle}>Expense Detail</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Expense ID</Text>
                <Text style={styles.detailValueBold}>{selectedExpenseItem.expenseId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValueBold}>{selectedExpenseItem.category}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValueBold}>{selectedExpenseItem.amount}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValueBold}>{selectedExpenseItem.date}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValueBold}>{selectedExpenseItem.paymentMethod}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Vendor/Payee</Text>
                <Text style={styles.detailValueBold}>{selectedExpenseItem.vendorPayee}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Voucher</Text>
                <Text style={styles.detailValueBold}>{selectedExpenseItem.voucher}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValueBold}>{selectedExpenseItem.status}</Text>
              </View>
            </View>

            <View style={{ marginTop: 2 }}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={[styles.detailValueBold, { lineHeight: 20 }]}>{selectedExpenseItem.description}</Text>
            </View>

            <View style={{ marginTop: 2 }}>
              <Text style={styles.detailLabel}>Created By</Text>
              <Text style={styles.detailValueBold}>{selectedExpenseItem.createdBy}</Text>
            </View>
          </View>

          {/* Timeline Section */}
          <Text style={styles.detailSectionTitle}>Timeline</Text>
          <View style={[styles.detailCard, { paddingVertical: 14 }]}>
            <View style={styles.timelineList}>
              {selectedExpenseItem.timeline.map((step: any, idx: number) => (
                <View key={step.title} style={[styles.timelineItem, idx === selectedExpenseItem.timeline.length - 1 ? { minHeight: 28 } : null]}>
                  <View style={styles.timelineLeftCol}>
                    <TimelineDotIcon />
                    {idx < selectedExpenseItem.timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{step.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 8: EXPORT REPORT (M12-S11) - 5 STEPS FLOW
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'export_report') {
    const EXPORT_OPTIONS = exportOptions;

    const handleBackStep = () => {
      if (exportStep === 'downloaded') {
        setExportStep('ready');
      } else if (exportStep === 'generating') {
        setExportStep(5);
      } else if (exportStep === 'ready') {
        setExportStep(1);
        setCurrentScreen('main');
      } else if (typeof exportStep === 'number' && exportStep > 1) {
        setExportStep((prev) => (Number(prev) - 1) as 1 | 2 | 3 | 4 | 5);
      } else {
        setCurrentScreen('main');
      }
    };

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackStep}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitleText}>Export Report</Text>
                {exportStep === 'downloaded' && (
                  <Text style={{ ...adminType.body, color: adminColors.onBrand, marginTop: 2, fontWeight: '500' }}>
                    Generating your report
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Warehouse Lock Sub-pill */}
          {exportStep !== 'downloaded' && (
            <View style={styles.warehouseLockSubRow}>
              <View style={styles.warehouseLockPill}>
                {isMain ? null : <LockBadgeIcon />}
                <Text style={styles.warehouseLockPillText}>{warehouseLabel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* GENERATING REPORT SCREEN */}
        {exportStep === 'generating' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.exportScrollContent, { flex: 1, justifyContent: 'center' }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.generatingContainer}>
              <ActivityIndicator size="large" color={adminColors.brand} style={{ transform: [{ scale: 1.2 }], marginBottom: 24 }} />
              <Text style={styles.generatingTitle}>Generating Report...</Text>
              <Text style={styles.generatingSubtitle}>Preparing 1,284 records. Please wait.</Text>
            </View>
          </ScrollView>
        )}

        {/* REPORT READY SCREEN */}
        {exportStep === 'ready' && (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.exportScrollContent, { flex: 1, justifyContent: 'center' }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.readyContainer}>
                <View style={styles.readyBadgeCircle}>
                  <ReadyCheckIcon size={32} color={adminColors.success.text} />
                </View>
                <Text style={styles.readyTitle}>Report Ready</Text>
                <Text style={styles.readySubtitle}>
                  {selectedExportReport} · {warehouseLabel} · 01 Sep – 25 Sep
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Download Button */}
            <View style={styles.exportBottomBarDual}>
              <TouchableOpacity
                style={[styles.nextActionButton, !exportAllowed && styles.buttonDisabled]}
                activeOpacity={0.8}
                disabled={!exportAllowed}
                accessibilityState={{ disabled: !exportAllowed }}
                onPress={() => {
                  if (!exportAllowed) return;
                  setExportStep('downloaded');
                }}
              >
                <DownloadIcon size={18} color={adminColors.onBrand} />
                <Text style={styles.nextActionButtonText}>Download</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* DOWNLOADED / PROGRESS & SUMMARY SCREEN */}
        {exportStep === 'downloaded' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.xxl }}
            showsVerticalScrollIndicator={false}
          >
            {/* Card 1: Preparing report... with donut chart & checklist */}
            <View
              style={{
                backgroundColor: adminColors.card,
                borderRadius: adminRadius.xl,
                paddingVertical: adminSpacing.xl,
                paddingHorizontal: adminSpacing.lg,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: adminColors.border,
                ...adminShadow.sm,
              }}
            >
              {/* Donut progress ring */}
              <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={120} height={120} viewBox="0 0 120 120">
                  <Circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke={adminColors.border}
                    strokeWidth="12"
                    fill="none"
                  />
                  <Circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke={adminColors.success.text}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray="196 105.59"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                </Svg>
                <View style={{ position: 'absolute' }}>
                  <Text style={{ ...adminType.kpiValue, color: adminColors.ink }}>65%</Text>
                </View>
              </View>

              <Text style={{ ...adminType.title, color: adminColors.ink, marginTop: adminSpacing.lg }}>
                Preparing report...
              </Text>
              <Text style={{ ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.xs, lineHeight: 18 }}>
                {'This may take a few moments.\nPlease do not close this page.'}
              </Text>

              {/* Checklist */}
              <View style={{ width: '100%', marginTop: adminSpacing.lg, gap: adminSpacing.md }}>
                {/* 1. Fetching data */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md }}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="11" fill={adminColors.success.text} />
                    <Path d="M7 12.5l3.5 3.5 6.5-7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>Fetching data</Text>
                </View>

                {/* 2. Applying filters */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md }}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="11" fill={adminColors.success.text} />
                    <Path d="M7 12.5l3.5 3.5 6.5-7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>Applying filters</Text>
                </View>

                {/* 3. Generating file */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md }}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2.4" />
                  </Svg>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>Generating file</Text>
                </View>

                {/* 4. Finalizing report */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md }}>
                  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="12" r="10" stroke={adminColors.border} strokeWidth="2" />
                  </Svg>
                  <Text style={{ ...adminType.rowTitle, fontWeight: '600', color: adminColors.muted }}>Finalizing report</Text>
                </View>
              </View>
            </View>

            {/* Card 2: Export Completed Card */}
            <View
              style={{
                backgroundColor: adminColors.success.bg,
                borderWidth: 1.5,
                borderColor: adminColors.success.border,
                borderRadius: adminRadius.xl,
                padding: adminSpacing.lg,
                marginTop: adminSpacing.lg,
                alignItems: 'center',
              }}
            >
              {/* Badge */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: adminRadius.full,
                  backgroundColor: adminColors.success.text,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 13l4.5 4.5L19 7.5" stroke={adminColors.onBrand} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>

              <Text style={{ ...adminType.title, color: adminColors.ink, marginTop: adminSpacing.md }}>
                Export Completed!
              </Text>
              <Text style={{ ...adminType.body, color: adminColors.muted, textAlign: 'center', marginTop: adminSpacing.xs }}>
                Your report has been generated successfully.
              </Text>

              {/* White Summary Table */}
              <View
                style={{
                  backgroundColor: adminColors.card,
                  borderRadius: adminRadius.md,
                  paddingHorizontal: adminSpacing.lg,
                  paddingVertical: adminSpacing.md,
                  width: '100%',
                  marginTop: adminSpacing.lg,
                  borderWidth: 1,
                  borderColor: adminColors.border,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>Report Type</Text>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>
                    {selectedExportReport || 'Inventory & Stock Report'}
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>Date Range</Text>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>
                    01 Oct 2026 – 31 Oct 2026
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>Format</Text>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>
                    {exportFormat === 'Excel' ? 'Excel (.xlsx)' : exportFormat === 'PDF' ? 'PDF (.pdf)' : 'CSV (.csv)'}
                  </Text>
                </View>

                <View style={{ height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md }} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...adminType.body, color: adminColors.muted, fontWeight: '500' }}>Total Records</Text>
                  <Text style={{ ...adminType.rowTitle, color: adminColors.ink }}>1,248</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {/* STEPS 1 TO 5 */}
        {typeof exportStep === 'number' && (
          <>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.exportScrollContent} showsVerticalScrollIndicator={false}>
              {/* Step Indicator Dots (5 dots) */}
              <View style={styles.stepDotsRow}>
                <View style={[styles.stepDot, exportStep >= 1 && styles.stepDotActive]} />
                <View style={[styles.stepDot, exportStep >= 2 && styles.stepDotActive]} />
                <View style={[styles.stepDot, exportStep >= 3 && styles.stepDotActive]} />
                <View style={[styles.stepDot, exportStep >= 4 && styles.stepDotActive]} />
                <View style={[styles.stepDot, exportStep >= 5 && styles.stepDotActive]} />
              </View>

              {/* STEP 1: Select Report */}
              {exportStep === 1 && (
                <>
                  <Text style={styles.stepHeaderTitle}>Step 1 — Select Report</Text>
                  <View style={styles.exportCardContainer}>
                    {EXPORT_OPTIONS.map((option, index) => {
                      const isSelected = selectedExportReport === option;
                      return (
                        <React.Fragment key={option}>
                          <TouchableOpacity
                            style={styles.exportOptionRow}
                            activeOpacity={0.75}
                            onPress={() => setSelectedExportReport(option)}
                          >
                            <RadioCircleIcon selected={isSelected} />
                            <Text style={[styles.exportOptionText, isSelected && styles.exportOptionTextSelected]}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                          {index < EXPORT_OPTIONS.length - 1 && <View style={styles.exportRowDivider} />}
                        </React.Fragment>
                      );
                    })}
                  </View>
                </>
              )}

              {/* STEP 2: Select Period */}
              {exportStep === 2 && (
                <>
                  <Text style={styles.stepHeaderTitle}>Step 2 — Select Period</Text>

                  {/* From / To Date Display */}
                  <View style={styles.exportPeriodRow}>
                    <View style={styles.exportPeriodCol}>
                      <Text style={styles.exportPeriodLabel}>From</Text>
                      <Text style={styles.exportPeriodDateText}>01 Sep 2026</Text>
                    </View>
                    <View style={styles.exportPeriodCol}>
                      <Text style={styles.exportPeriodLabel}>To</Text>
                      <Text style={styles.exportPeriodDateText}>25 Sep 2026</Text>
                    </View>
                  </View>

                  {/* Period Quick Select Chips */}
                  <View style={styles.filterChipRow}>
                    {(['Today', 'This Week', 'This Month', 'Custom'] as const).map((p) => {
                      const isSelected = exportPeriod === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.filterChip,
                            isSelected && {
                              borderColor: adminColors.brand,
                              backgroundColor: adminColors.brandTint,
                            },
                          ]}
                          onPress={() => setExportPeriod(p)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              isSelected && { color: adminColors.brand, fontWeight: '700' },
                            ]}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* STEP 3: Filters (No extra info box) */}
              {exportStep === 3 && (
                <>
                  <Text style={styles.stepHeaderTitle}>Step 3 — Filters</Text>
                  {isMain ? (
                    // Ported from MainWarehouseExportReportScreen (step 3).
                    <View style={styles.blueInfoBox}>
                      <Text style={styles.blueInfoText}>Only filters relevant to the selected report type are shown.</Text>
                    </View>
                  ) : null}

                  {/* Channel Filter */}
                  <Text style={styles.exportFilterGroupTitle}>Channel</Text>
                  <View style={styles.filterChipRow}>
                    {(['All', 'Online', 'Market'] as const).map((ch) => {
                      const isSelected = exportChannel === ch;
                      return (
                        <TouchableOpacity
                          key={ch}
                          style={[
                            styles.filterChip,
                            isSelected && {
                              borderColor: adminColors.brand,
                              backgroundColor: adminColors.brandTint,
                            },
                          ]}
                          onPress={() => setExportChannel(ch)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              isSelected && { color: adminColors.brand, fontWeight: '700' },
                            ]}
                          >
                            {ch}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Status Filter */}
                  <Text style={[styles.exportFilterGroupTitle, { marginTop: 14 }]}>Status</Text>
                  <View style={styles.filterChipRow}>
                    {(['All', 'Completed', 'Cancelled'] as const).map((st) => {
                      const isSelected = exportStatus === st;
                      return (
                        <TouchableOpacity
                          key={st}
                          style={[
                            styles.filterChip,
                            isSelected && {
                              borderColor: adminColors.brand,
                              backgroundColor: adminColors.brandTint,
                            },
                          ]}
                          onPress={() => setExportStatus(st)}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              isSelected && { color: adminColors.brand, fontWeight: '700' },
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* STEP 4: File Format (No extra info box) */}
              {exportStep === 4 && (
                <>
                  <Text style={styles.stepHeaderTitle}>Step 4 — File Format</Text>
                  <View style={styles.exportFormatRow}>
                    {(['Excel', 'CSV', 'PDF'] as const).map((fmt) => {
                      const isSelected = exportFormat === fmt;
                      return (
                        <TouchableOpacity
                          key={fmt}
                          style={[
                            styles.exportFormatCard,
                            isSelected && styles.exportFormatCardActive,
                          ]}
                          onPress={() => setExportFormat(fmt)}
                          activeOpacity={0.75}
                        >
                          {fmt === 'Excel' && <ExcelFileIcon size={28} color={isSelected ? adminColors.brand : adminColors.brandDeep} />}
                          {fmt === 'CSV' && <CsvFileIcon size={28} color={isSelected ? adminColors.brand : adminColors.brandDeep} />}
                          {fmt === 'PDF' && <PdfFileIcon size={28} color={isSelected ? adminColors.brand : adminColors.brandDeep} />}
                          <Text
                            style={[
                              styles.exportFormatName,
                              isSelected && styles.exportFormatNameActive,
                            ]}
                          >
                            {fmt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* STEP 5: Report Preview (No warning box, No simulation buttons) */}
              {exportStep === 5 && (
                <>
                  <Text style={styles.stepHeaderTitle}>Step 5 — Report Preview</Text>

                  {/* Summary Card */}
                  <View style={styles.detailCard}>
                    <View style={styles.detailRowGrid}>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Report</Text>
                        <Text style={styles.detailValueBold}>{selectedExportReport}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Warehouse</Text>
                        <Text style={styles.detailValueBold}>{warehouseLabel}</Text>
                      </View>
                    </View>

                    <View style={[styles.detailRowGrid, { marginTop: 14 }]}>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Period</Text>
                        <Text style={styles.detailValueBold}>01 Sep – 25 Sep</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={styles.detailLabel}>Records</Text>
                        <Text style={styles.detailValueBold}>1,284</Text>
                      </View>
                    </View>
                  </View>

                  {/* Preview Metrics Title */}
                  <Text style={[styles.stepHeaderTitle, { marginTop: 16, marginBottom: 10 }]}>Preview Metrics</Text>
                  <View style={styles.detailCard}>
                    <View style={styles.previewMetricRow}>
                      <Text style={styles.previewMetricLabel}>Total Sales</Text>
                      <Text style={styles.previewMetricVal}>{salesData?.summary?.totalSales ?? '—'}</Text>
                    </View>
                    <View style={styles.exportRowDivider} />
                    <View style={styles.previewMetricRow}>
                      <Text style={styles.previewMetricLabel}>Orders</Text>
                      <Text style={styles.previewMetricVal}>{salesData?.summary?.ordersCount !== undefined ? String(salesData.summary.ordersCount) : '—'}</Text>
                    </View>
                  </View>

                  {exportAllowed ? null : (
                    // MAIN holds report.export.file as `view` only (SPEC_GAPS.md #11).
                    <View style={styles.exportViewOnlyBox}>
                      <Text style={styles.exportViewOnlyText}>
                        View-only access: your role can preview this export but cannot generate or download it.
                      </Text>
                    </View>
                  )}
                </>
              )}

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Bottom Actions Bar */}
            {exportStep < 5 ? (
              <View style={styles.exportBottomBar}>
                <TouchableOpacity
                  style={styles.nextActionButton}
                  activeOpacity={0.8}
                  onPress={() => setExportStep((prev) => (Number(prev) + 1) as 1 | 2 | 3 | 4 | 5)}
                >
                  <ArrowRightIcon size={18} color={adminColors.onBrand} />
                  <Text style={styles.nextActionButtonText}>Next</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.exportBottomBarDual}>
                <TouchableOpacity
                  style={[styles.generateReportBtn, !exportAllowed && styles.buttonDisabled]}
                  activeOpacity={0.8}
                  disabled={!exportAllowed}
                  accessibilityState={{ disabled: !exportAllowed }}
                  onPress={() => {
                    if (exportAllowed) setExportStep('generating');
                  }}
                >
                  <SparklesIcon size={18} color={adminColors.onBrand} />
                  <Text style={styles.generateReportBtnText}>Generate Report</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backStepBtn}
                  activeOpacity={0.8}
                  onPress={() => setExportStep(4)}
                >
                  <Text style={styles.backStepBtnText}>Back</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 9: DAILY / MONTHLY SUMMARY (M12-S10)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'summary_report') {
    const isDaily = summaryMode === 'Daily';
    const summaryRevSum = revenueRows.reduce((sum, item) => sum + (Number(item.amountNum) || 0), 0);
    const summaryExpSum = expenseRows.reduce((sum, item) => sum + (Number(item.amountNum) || 0), 0);

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Daily / Monthly Summary</Text>
            </View>
          </View>

          {/* Warehouse Lock Sub-pill */}
          <View style={styles.warehouseLockSubRow}>
            <View style={styles.warehouseLockPill}>
              {isMain ? null : <LockBadgeIcon />}
              <Text style={styles.warehouseLockPillText}>{warehouseLabel}</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Daily / Monthly Toggle Switch */}
          <View style={styles.summaryToggleWrap}>
            <TouchableOpacity
              style={[styles.summaryToggleBtn, isDaily && styles.summaryToggleBtnActive]}
              activeOpacity={0.8}
              onPress={() => setSummaryMode('Daily')}
            >
              <Text style={[styles.summaryToggleText, isDaily && styles.summaryToggleTextActive]}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.summaryToggleBtn, !isDaily && styles.summaryToggleBtnActive]}
              activeOpacity={0.8}
              onPress={() => setSummaryMode('Monthly')}
            >
              <Text style={[styles.summaryToggleText, !isDaily && styles.summaryToggleTextActive]}>Monthly</Text>
            </TouchableOpacity>
          </View>

          {/* Date / Month Selection Pill */}
          <TouchableOpacity
            style={styles.summaryDateBox}
            activeOpacity={0.8}
            onPress={() =>
              Alert.alert('Date Range', isDaily ? 'Select Date: 25 Sep 2026' : 'Select Month: September 2026')
            }
          >
            <Text style={styles.summaryDateBoxText}>{isDaily ? '25 Sep 2026' : 'September 2026'}</Text>
          </TouchableOpacity>

          {/* 1. Sales Card */}
          <Text style={styles.summarySectionTitle}>Sales</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Orders</Text>
                <Text style={styles.summaryItemValue}>{salesData?.summary?.ordersCount !== undefined ? String(salesData.summary.ordersCount) : '—'}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Sales</Text>
                <Text style={styles.summaryItemValue}>{salesData?.summary?.totalSales ?? '—'}</Text>
              </View>
            </View>
          </View>

          {/* 2. Receiving Card */}
          <Text style={styles.summarySectionTitle}>Receiving</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Receipts</Text>
                <Text style={styles.summaryItemValue}>{receivingRows.length}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Quantity Received</Text>
                <Text style={styles.summaryItemValue}>
                  {formatKg(receivingRows.reduce((s, r) => s + (r.acceptedNum + r.rejectedNum) * 1000, 0))}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Inventory Card */}
          <Text style={styles.summarySectionTitle}>Inventory</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Available Stock</Text>
                <Text style={styles.summaryItemValue}>
                  {formatKg(inventoryRows.reduce((s, r) => s + (parseFloat(r.availableQty) || 0) * 1000, 0))}
                </Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Low Stock</Text>
                <Text style={styles.summaryItemValue}>{inventoryRows.filter((r) => r.status === 'Low Stock').length}</Text>
              </View>
            </View>
          </View>

          {/* 4. Customers Card */}
          <Text style={styles.summarySectionTitle}>Customers</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Customers Served</Text>
                <Text style={styles.summaryItemValue}>{customerRows.length}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>New Customers</Text>
                <Text style={styles.summaryItemValue}>{customerRows.filter((r: any) => r.isNew).length}</Text>
              </View>
            </View>
          </View>

          {/* 5. Wallet Card */}
          <Text style={styles.summarySectionTitle}>Wallet</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Cash Top-Ups</Text>
                <Text style={styles.summaryItemValue}>{topupReport ? formatMoney(topupReport.total) : '—'}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Transactions</Text>
                <Text style={styles.summaryItemValue}>{topupReport?.count ?? topupRows.length}</Text>
              </View>
            </View>
          </View>

          {/* 6. Finance Card */}
          <Text style={styles.summarySectionTitle}>Finance</Text>
          <View style={styles.summaryCard}>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Revenue</Text>
              <Text style={styles.financeVal}>{formatMoney(String(summaryRevSum))}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Expenses</Text>
              <Text style={styles.financeVal}>{formatMoney(String(summaryExpSum))}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.financeRow}>
              <Text style={styles.financeNetLabel}>Net</Text>
              <Text style={styles.financeNetVal}>{formatMoney(String(summaryRevSum - summaryExpSum))}</Text>
            </View>
          </View>

          {/* 7. Returns Card */}
          <Text style={styles.summarySectionTitle}>Returns</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>New Returns</Text>
                <Text style={styles.summaryItemValue}>{returnRows.length}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Resolved</Text>
                <Text style={styles.summaryItemValue}>
                  {returnRows.filter((r) => r.status === 'Approved' || r.status === 'Resolved').length}
                </Text>
              </View>
            </View>
            <View style={[styles.summaryCardRow, { marginTop: 12 }]}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Pending</Text>
                <Text style={styles.summaryItemValue}>
                  {returnRows.filter((r) => r.status === 'Pending').length}
                </Text>
              </View>
            </View>
          </View>

          {/* 8. Summary Chart Section */}
          <Text style={styles.summarySectionTitle}>Summary Chart</Text>
          <View style={styles.filterChipRow}>
            {(['Sales', 'Orders', 'Revenue', 'Expenses', 'Returns'] as const).map((metric) => (
              <TouchableOpacity
                key={metric}
                style={[styles.filterChip, summaryMetric === metric && styles.filterChipActive]}
                onPress={() => setSummaryMetric(metric)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, summaryMetric === metric && styles.filterChipTextActive]}>
                  {metric}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.chartContainerCard}>
            <Text style={styles.chartDescText}>Summary breakdown for {summaryMetric}</Text>
          </View>

          {isMain && !isDaily ? (
            // Ported from MainWarehouseSummaryReportScreen (monthly tab).
            <View style={[styles.orangeInfoBox, styles.pickerGroupGap]}>
              <Text style={styles.orangeInfoText}>
                Monthly totals and trends only — individual transaction screens are never duplicated here.
              </Text>
            </View>
          ) : null}

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 10: RETURNS & ISSUES REPORT (M12-S09)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'returns_report') {
    const RETURN_DATA = returnRows;

    const filteredReturns = RETURN_DATA.filter((item) => {
      if (!matchWarehouse(item.warehouse, item.warehouseId)) return false;
      const matchQuery =
        !searchQuery ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.order.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = returnCategory === 'All' || item.category === returnCategory;
      return matchQuery && matchCat;
    });

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Returns Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards (2x2 Grid) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL RETURNS</Text>
              <Text style={styles.kpiValue}>
                {returnReport ? returnReport.byStatus.reduce((s, r) => s + r.count, 0) : filteredReturns.length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PENDING</Text>
              <Text style={styles.kpiValue}>
                {returnReport
                  ? (returnReport.byStatus.find((r) => r.status === 'PENDING')?.count ?? 0)
                  : filteredReturns.filter((r) => r.status === 'Pending').length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>APPROVED</Text>
              <Text style={styles.kpiValue}>
                {returnReport
                  ? (returnReport.byStatus.find((r) => r.status === 'APPROVED')?.count ?? 0)
                  : filteredReturns.filter((r) => r.status === 'Approved').length}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>REJECTED</Text>
              <Text style={styles.kpiValue}>
                {returnReport
                  ? (returnReport.byStatus.find((r) => r.status === 'REJECTED')?.count ?? 0)
                  : filteredReturns.filter((r) => r.status === 'Rejected').length}
              </Text>
            </View>
          </View>

          {/* Issue Category Filter Chips - Only for Subwarehouse */}
          {!isMain && (
            <View style={styles.filterChipRow}>
              {(['All', 'Quality', 'Quantity', 'Missing', 'Wrong', 'Damaged', 'Late'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, returnCategory === cat && styles.filterChipActive]}
                  onPress={() => setReturnCategory(cat)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, returnCategory === cat && styles.filterChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="RMA ID, Order ID, Customer ID, Ticket ID"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={openFilterModal} activeOpacity={0.7}>
              <FilterIcon size={16} color={adminColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Returns Records Stack */}
          <View style={styles.recordsStack}>
            {filteredReturns.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() => {
                  setSelectedReturnItem({
                    rmaId: item.id,
                    orderId: item.orderId,
                    customer: item.customer,
                    product: item.product,
                    affectedQuantity: item.affectedQuantity,
                    issueCategory: item.category,
                    customerPhotos: item.customerPhotos,
                    issueDescription: item.issueDescription,
                    inspectionStatus: item.inspectionStatus,
                    inspectionResult: item.inspectionResult,
                    inspectionNotes: item.inspectionNotes,
                    decision: item.decision,
                    refundStatus: item.refundStatus,
                    refundMethod: item.refundMethod,
                    refundAmount: item.refundAmount,
                    resolutionDate: item.resolutionDate,
                    timeline: item.timeline,
                  });
                  setCurrentScreen('returns_item_detail');
                }}
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.id}</Text>
                  <View
                    style={[
                      styles.badgePillBase,
                      {
                        backgroundColor:
                          item.status === 'Approved'
                            ? adminColors.success.bg
                            : item.status === 'Pending'
                            ? adminColors.warning.bg
                            : adminColors.danger.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeTextBase,
                        {
                          color:
                            item.status === 'Approved'
                              ? adminColors.success.text
                              : item.status === 'Pending'
                              ? adminColors.warning.text
                              : adminColors.danger.text,
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recordSubText}>
                  {item.order} · {item.category}
                  {isMain && !isSpecificWarehouseChosen && !reportWarehouseId && item.warehouse ? ` · ${item.warehouse}` : ''}
                </Text>
                <View style={styles.returnResolutionRow}>
                  <Text style={styles.returnQtyText}>{item.affectedQty}</Text>
                  <Text style={[styles.returnResolutionText, { color: item.resolutionColor }]}>
                    {item.resolution}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {renderReportFilterModal()}
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: RETURNS ITEM DETAILS (M12-S09-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'returns_item_detail') {
    if (!selectedReturnItem) {
      return (
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
          <View style={styles.headerBanner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('returns_report')} activeOpacity={0.75}>
                  <ArrowBackIcon size={22} color={adminColors.onBrand} />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Return Detail</Text>
              </View>
            </View>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <AdminEmptyState title="No return item selected" subtitle="Select a return from the list." />
          </ScrollView>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('returns_report')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Return Detail</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* RMA Section */}
          <Text style={styles.detailSectionTitle}>RMA</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>RMA ID</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.rmaId}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Order ID</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.orderId}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Customer</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.customer}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Product</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.product}</Text>
              </View>
            </View>

            <View style={{ marginTop: 2 }}>
              <Text style={styles.detailLabel}>Affected Quantity</Text>
              <Text style={styles.detailValueBold}>{selectedReturnItem.affectedQuantity}</Text>
            </View>
          </View>

          {/* Issue Section */}
          <Text style={styles.detailSectionTitle}>Issue</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.issueCategory}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Customer Photos</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.customerPhotos}</Text>
              </View>
            </View>

            <View style={{ marginTop: 2 }}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={[styles.detailValueBold, { lineHeight: 20 }]}>{selectedReturnItem.issueDescription}</Text>
            </View>
          </View>

          {/* Inspection Section */}
          <Text style={styles.detailSectionTitle}>Inspection</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Inspection Status</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.inspectionStatus}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Inspection Result</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.inspectionResult}</Text>
              </View>
            </View>

            <View style={{ marginTop: 2 }}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={[styles.detailValueBold, { lineHeight: 20 }]}>{selectedReturnItem.inspectionNotes}</Text>
            </View>
          </View>

          {/* Resolution Section */}
          <Text style={styles.detailSectionTitle}>Resolution</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Decision</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.decision}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Refund Status</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.refundStatus}</Text>
              </View>
            </View>

            <View style={styles.detailRowGrid}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Refund Method</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.refundMethod}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Refund Amount</Text>
                <Text style={styles.detailValueBold}>{selectedReturnItem.refundAmount}</Text>
              </View>
            </View>

            <View style={{ marginTop: 2 }}>
              <Text style={styles.detailLabel}>Resolution Date</Text>
              <Text style={styles.detailValueBold}>{selectedReturnItem.resolutionDate}</Text>
            </View>
          </View>

          {/* Timeline Section */}
          <Text style={styles.detailSectionTitle}>Timeline</Text>
          <View style={[styles.detailCard, { paddingVertical: 14 }]}>
            <View style={styles.timelineList}>
              {selectedReturnItem.timeline.map((step: any, idx: number) => (
                <View key={step.title} style={[styles.timelineItem, idx === selectedReturnItem.timeline.length - 1 ? { minHeight: 28 } : null]}>
                  <View style={styles.timelineLeftCol}>
                    <TimelineDotIcon />
                    {idx < selectedReturnItem.timeline.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{step.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {isMain ? (
            // Ported from the W3b ReportDetailScreen (Main sales/returns record detail).
            <View style={[styles.orangeInfoBox, styles.pickerGroupGap]}>
              <Text style={styles.orangeInfoText}>
                Deep-links to the owning module for the actual record — never a duplicate workflow.
              </Text>
            </View>
          ) : null}

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT: REPORTS HUB (M12-S01), Sub locked / Main all-warehouses selector
  // ═══════════════════════════════════════════════════════════════════════════

  const query = searchQuery.trim().toLowerCase();

  // Hub KPI tiles, each shown only when the viewer may see the data behind it.
  const hubKpis = [
    { label: "Today's Sales", value: liveKpis?.todaySales.amount ?? null, permission: REPORT_CODES.sales },
    { label: 'Inventory', value: liveKpis?.inventory.total ?? null, permission: REPORT_CODES.inventory },
    { label: 'Received Today', value: liveKpis?.receivedToday.count ?? null, permission: REPORT_CODES.inventory },
    { label: 'Customers Served', value: liveKpis?.customersServed.count ?? null, permission: REPORT_CODES.customers },
    { label: 'Cash Top-Up', value: liveKpis?.cashTopUp.amount ?? null, permission: REPORT_CODES.cashTopUp },
    { label: 'Expenses', value: liveKpis?.expenses.amount ?? null, permission: REPORT_CODES.expense },
    { label: 'Returns', value: liveKpis?.returns.count ?? null, permission: REPORT_CODES.returns },
  ].filter((k) => can(k.permission) && k.value !== null);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={20} color={adminColors.onBrand} />
            </TouchableOpacity>
            <ReportDocHeaderIcon size={24} color={adminColors.onBrand} />
            <Text style={styles.headerTitleText}>Reports</Text>
          </View>

          <TouchableOpacity
            style={styles.headerBellBtn}
            onPress={() => {
              onNavigateToNotifications?.();
            }}
            activeOpacity={0.8}
          >
            <BellHeaderIcon />
          </TouchableOpacity>
        </View>

        {/* Warehouse Scope Selector: Sub is locked and cycles the period;
            Main opens the inline warehouse dropdown selector. */}
        <View style={styles.warehouseBadgeRow}>
          {isMain ? (
            <WarehouseSelector
              scope={scope}
              options={warehouseOptions}
              selectedId={selectedWarehouseId}
              onSelect={(id) => {
                setSelectedWarehouseId(id);
                setReportWarehouseId(id);
              }}
            />
          ) : (
            <TouchableOpacity
              onPress={() => {
                const next = timeFilter === 'Today' ? 'Week' : timeFilter === 'Week' ? 'Month' : 'Today';
                setTimeFilter(next);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.warehouseBadge}>
                <LockBadgeIcon />
                <Text style={styles.warehouseBadgeText}>{warehouseLabel} · {timeFilter}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          {/* ─── 1. KPI Metric Cards (2 Columns Grid) ─── */}
          {hubKpis.length > 0 ? (
            <View style={styles.kpiGrid}>
              {hubKpis.map((k, idx) => {
                const getIcon = (label: string): 'sales' | 'box' | 'receiving' | 'orders' | 'cash' | 'alert' => {
                  const lower = label.toLowerCase();
                  if (lower.includes('sales')) return 'sales';
                  if (lower.includes('inventory')) return 'box';
                  if (lower.includes('received')) return 'receiving';
                  if (lower.includes('customer')) return 'orders';
                  if (lower.includes('cash') || lower.includes('expense')) return 'cash';
                  if (lower.includes('return')) return 'alert';
                  return 'orders';
                };
                const isOddLast = idx === hubKpis.length - 1 && hubKpis.length % 2 === 1;
                return (
                  <OverviewDashboardCard
                    key={k.label}
                    value={k.value ?? '—'}
                    title={k.label}
                    subtitle="Report Metric"
                    icon={getIcon(k.label)}
                    style={isOddLast ? { width: '100%' } : undefined}
                  />
                );
              })}
            </View>
          ) : null}

          {/* ─── 2. Search Reports Input ─── */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color={adminColors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reports..."
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* ─── 3. Categorized Reports List (each card gated on its data code) ─── */}
          {visibleSections.map((sec) => {
            const filteredReports = sec.reports.filter(
              (r) => !query || r.title.toLowerCase().includes(query) || r.subtitle.toLowerCase().includes(query)
            );

            if (filteredReports.length === 0) return null;

            return (
              <View key={sec.category} style={styles.sectionBlock}>
                <Text style={styles.categoryHeading}>{sec.category}</Text>

                <View style={styles.reportsStack}>
                  {filteredReports.map((report) => (
                    <TouchableOpacity
                      key={report.code}
                      style={styles.reportRowCard}
                      onPress={() => handleReportClick(report.code)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reportName}>{report.title}</Text>
                      <ChevronRightIcon size={16} color={adminColors.brandDeep} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}

          {isMain ? (
            // Ported from MainWarehouseReportsScreen (Main hub).
            <View style={styles.orangeInfoBox}>
              <Text style={styles.orangeInfoText}>
                Reports use server-side scoping and pagination — unrestricted warehouse data is never loaded to the client.
              </Text>
            </View>
          ) : null}

          <View style={styles.hubBottomSpacer} />
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  warehouseBadgeRow: {
    marginTop: 2,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandDeep,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: adminRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: adminColors.brandTint,
  },
  warehouseBadgeText: {
    color: adminColors.onBrand,
    ...adminType.caption,
    letterSpacing: 0.1,
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: adminColors.card,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.3%',
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  kpiCardFull: {
    width: '100%',
  },
  kpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  kpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.3,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
    ...adminShadow.sm,
  },
  filterChipText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  blueInfoBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  blueInfoText: {
    ...adminType.body,
    color: adminColors.info.text,
  },
  orangeInfoBox: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  orangeInfoText: {
    ...adminType.body,
    color: adminColors.brandDeep,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 10,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
    margin: 0,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  categoryHeading: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  reportsStack: {
    gap: 8,
  },
  reportRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  reportName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  lockNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.info.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    gap: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  lockNoticeText: {
    flex: 1,
    ...adminType.rowTitle,
    color: adminColors.info.text,
  },
  detailSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 2,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 16,
    gap: 14,
  },
  detailRowGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  detailValueBold: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  movementFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  movementStep: {
    alignItems: 'center',
    flex: 1,
  },
  movementLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  movementVal: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  movementArrow: {
    ...adminType.sectionHead,
    color: adminColors.muted,
    marginHorizontal: 2,
    alignSelf: 'center',
  },
  timelineList: {
    paddingTop: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 20,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: adminColors.success.bg,
    marginVertical: 3,
  },
  timelineContent: {
    paddingBottom: 14,
    flex: 1,
  },
  timelineTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 2,
  },
  timelineTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  historyOrderId: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  historyOrderDetails: {
    ...adminType.sectionHead,
    color: adminColors.muted,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  actionCardBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  ordersCountText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 10,
    marginLeft: 2,
  },
  orderListCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  orderCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderCardId: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    ...adminType.caption,
  },
  orderCustomerName: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 8,
  },
  orderItemsPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderItemsCount: {
    ...adminType.body,
    color: adminColors.muted,
  },
  orderAmountBold: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  orderTypeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderTypeText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  orderTimeText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  recordsStack: {
    gap: 10,
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordIdText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  recordSubText: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 6,
  },
  recordAmountText: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  recordDateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },
  receivingAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 4,
  },
  receivedQtyMuted: {
    ...adminType.body,
    color: adminColors.muted,
  },
  acceptedQtyBold: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  returnResolutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 2,
  },
  returnQtyText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  returnResolutionText: {
    ...adminType.sectionHead,
  },
  custOrdersText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 2,
  },
  topupAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 4,
  },
  topupAmountBold: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  swaTagText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  badgePillBase: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeTextBase: {
    ...adminType.caption,
    letterSpacing: 0.1,
  },
  greenBadgePill: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.border,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  greenBadgeText: {
    color: adminColors.success.text,
    ...adminType.caption,
    letterSpacing: 0.1,
  },
  breakdownSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 2,
    letterSpacing: -0.2,
  },
  breakdownCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  breakdownLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  breakdownValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  expenseRecordedBadge: {
    backgroundColor: adminColors.warning.bg,
    borderColor: adminColors.border,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  expenseRecordedText: {
    color: adminColors.warning.text,
    ...adminType.caption,
  },
  expenseAmountRed: {
    ...adminType.kpiValue,
    color: adminColors.danger.text,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  chartBoxContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  chartSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  summaryToggleWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    backgroundColor: adminColors.border,
    borderRadius: 14,
    padding: 4,
  },
  summaryToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryToggleBtnActive: {
    backgroundColor: adminColors.card,
    ...adminShadow.sm,
  },
  summaryToggleText: {
    ...adminType.sectionHead,
    color: adminColors.muted,
  },
  summaryToggleTextActive: {
    color: adminColors.ink,
    fontWeight: '700',
  },
  summaryDateBox: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  summaryDateBoxText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  summarySectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 2,
    letterSpacing: -0.2,
  },
  summaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  summaryCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryCol: {
    flex: 1,
  },
  summaryColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  summaryItemLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  summaryItemValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  financeLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  financeVal: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  financeNetLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  financeNetVal: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  chartSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  chartTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chartTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chartTabBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chartTabText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  chartTabTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  chartContainerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    marginBottom: 16,
  },
  barGraphArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    marginBottom: 10,
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
  },
  barValueText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  barVisual: {
    width: 28,
    borderRadius: 6,
    backgroundColor: adminColors.brand,
  },
  barDayText: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  chartDescText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    textAlign: 'center',
  },
  warehouseLockSubRow: {
    marginTop: 4,
  },
  warehouseLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brandDeep,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: adminRadius.full,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderColor: adminColors.brandTint,
  },
  warehouseLockPillText: {
    color: adminColors.onBrand,
    ...adminType.caption,
  },
  exportScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
    marginLeft: 2,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.border,
  },
  stepDotActive: {
    backgroundColor: adminColors.brand,
  },
  stepHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 14,
    marginLeft: 2,
    letterSpacing: -0.2,
  },
  exportCardContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
    overflow: 'hidden',
    marginBottom: 16,
  },
  exportOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  exportOptionText: {
    ...adminType.sectionHead,
    color: adminColors.muted,
    flex: 1,
  },
  exportOptionTextSelected: {
    fontWeight: '700',
    color: adminColors.ink,
  },
  exportRowDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  exportPeriodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 2,
    gap: 16,
  },
  exportPeriodCol: {
    flex: 1,
  },
  exportPeriodLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  exportPeriodDateText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    letterSpacing: -0.2,
  },
  exportFilterGroupTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 8,
    marginLeft: 2,
  },
  exportFormatRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  exportFormatCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportFormatCardActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  exportFormatName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  exportFormatNameActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  previewMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  previewMetricLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  previewMetricVal: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  exportBottomBar: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 20,
  },
  nextActionButton: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    ...adminShadow.md,
  },
  nextActionButtonText: {
    color: adminColors.onBrand,
    ...adminType.sectionHead,
  },
  exportBottomBarDual: {
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 10,
  },
  generateReportBtn: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    ...adminShadow.md,
  },
  generateReportBtnText: {
    color: adminColors.onBrand,
    ...adminType.sectionHead,
  },
  backStepBtn: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
  },
  backStepBtnText: {
    color: adminColors.ink,
    ...adminType.sectionHead,
  },
  generatingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  generatingTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  generatingSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  readyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  readyBadgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: adminColors.border,
  },
  readyTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  readySubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  pickerGroupGap: {
    marginTop: 14,
  },
  pickerApplyGap: {
    marginTop: 8,
  },
  hubBottomSpacer: {
    height: 16,
  },
  exportViewOnlyBox: {
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  exportViewOnlyText: {
    ...adminType.body,
    color: adminColors.warning.text,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Filter Full Screen Modal Styles
  fullScreenFilterModal: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  filterModalHeader: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 14,
  },
  filterModalTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  filterCloseText: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  filterModalScroll: {
    flex: 1,
  },
  filterModalScrollContent: {
    padding: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  filterSection: {
    marginBottom: adminSpacing.lg,
  },
  filterSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
    textTransform: 'uppercase',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  filterModalChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  filterModalChipActive: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  filterModalChipText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '500',
  },
  filterModalChipTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  filterFooter: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  modalResetBtn: {
    flex: 1,
    height: 48,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalResetBtnText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  modalApplyBtn: {
    flex: 2,
    height: 48,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
});
