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
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminColors, adminShadow, adminType } from '../../../theme';
import { InvoiceDetailScreen } from '../billing-invoices';
import type { WarehouseScope, WarehouseScreenBaseProps } from '../finance-expenses';
import { EXPORT_REPORT_OPTIONS, REPORT_CODES, REPORT_SECTIONS, REPORT_WAREHOUSES, reportVisible } from './fixtures';
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
  warehouseOptions = REPORT_WAREHOUSES,
}: ReportsScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<ReportScreenType>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'Today' | 'Week' | 'Month'>('Today');

  // Scope. Sub is locked to its own warehouse; Main (no warehouseId) gets the
  // All-warehouses selector absorbed from MainWarehouseReportsScreen. The
  // server scopes every report again (CLAUDE.md 2.1).
  const isMain = scope.warehouseId === undefined;
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [pendingWarehouseId, setPendingWarehouseId] = useState<string | undefined>(undefined);
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

  // Export report states (5 Steps + Generating + Ready)
  const [exportStep, setExportStep] = useState<1 | 2 | 3 | 4 | 5 | 'generating' | 'ready'>(1);
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

  // Selected Order for Sales Report Details
  const [selectedOrder, setSelectedOrder] = useState({
    orderId: 'ORD-10284',
    date: '25 Sep, 11:20 AM',
    channel: 'Online',
    customerRef: 'C1024',
    warehouse: rowWarehouse,
    product: 'Tomato',
    grade: 'Grade 1',
    quantity: '4 KG',
    unitPrice: '₹100',
    amount: '₹1,240',
    paymentMethod: 'Wallet',
    paymentStatus: 'Completed',
    txnRef: 'TXN-882145',
    invoiceNumber: 'INV-2026-010284',
    invoiceStatus: 'Generated',
  });

  // Selected Inventory Item Details
  const [selectedInventoryItem, setSelectedInventoryItem] = useState({
    productName: 'Carrot',
    productCode: 'CRT-001',
    crop: 'Carrot',
    grade: 'Grade 1',
    availableQty: '420 kg',
    reservedQty: '35 kg',
    allocatedQty: '20 kg',
    consumedQty: '—',
    batchCode: 'BAT-CR-0245',
    receivedDate: '23 Sep 2026',
    storageLocation: 'Cold Storage A',
    status: 'Available',
    movementReceived: '475 kg',
    movementAvailable: '420 kg',
    movementReserved: '35 kg',
    movementSold: '20 kg',
    lastVerification: '20 Sep 2026',
    verifiedQty: '418 kg',
    difference: '-2 kg',
    verificationStatus: 'Reconciled',
  });

  // Selected Receiving Item Details
  const [selectedReceivingItem, setSelectedReceivingItem] = useState({
    receiptId: 'GR-00245',
    dateTime: '25 Sep, 10:20 AM',
    warehouse: rowWarehouse,
    sourceRef: 'Farmer #FRM-0842',
    product: 'Carrot',
    grade: 'Grade 1',
    qtyReceived: '420 kg',
    qualityStatus: 'Accepted',
    acceptedQty: '400 kg',
    partialQty: '15 kg',
    rejectedQty: '5 kg',
    qcNotes: 'Minor surface blemish on rejected portion.',
    timeline: [
      { title: 'Goods Received', time: '10:20 AM' },
      { title: 'QC Started', time: '10:25 AM' },
      { title: 'QC Completed', time: '10:40 AM' },
    ],
  });

  // Selected Customer Item Details
  const [selectedCustomerItem, setSelectedCustomerItem] = useState({
    customerId: 'CUS-10284',
    name: 'Customer #10284',
    contact: '+91 XXXXX XXXXX',
    category: 'Online',
    totalOrders: '12',
    completedOrders: '11',
    cancelledOrders: '1',
    totalPurchaseValue: '₹8,450',
    orderHistory: [
      { orderId: 'ORD-1001', amount: '₹850', status: 'Completed' },
      { orderId: 'ORD-1008', amount: '₹1,240', status: 'Completed' },
    ],
    orderFrequency: '~2/month',
    purchaseAmount: '₹8,450',
    lastActivity: '24 Sep 2026',
  });

  // Selected Revenue Item Details
  const [selectedRevenueItem, setSelectedRevenueItem] = useState({
    revenueId: 'REV-000845',
    orderId: 'ORD-10284',
    invoice: 'INV-2026-000845',
    channel: 'Market Sale',
    product: 'Tomato',
    quantity: '3 KG',
    amount: '₹3,450',
    paymentMethod: 'Wallet',
    status: 'Completed',
    dateTime: '25 Sep, 11:20 AM',
    warehouse: rowWarehouse,
  });

  // Selected Cash Top-Up Details
  const [selectedCashTopupItem, setSelectedCashTopupItem] = useState({
    topupId: 'TOP-002845',
    customerId: 'CUS-1024',
    amount: '₹2,000',
    paymentMethod: 'Cash',
    dateTime: '25 Sep, 10:24 AM',
    processedBy: 'SWA – Suresh',
    status: 'Completed',
    referenceId: 'TOP-002845',
    cashTagFiscalRef: 'FT-2026-004512',
  });

  // Selected Expense Details
  const [selectedExpenseItem, setSelectedExpenseItem] = useState({
    expenseId: 'EXP-001245',
    category: 'Transport',
    amount: '₹2,400',
    date: '25 Sep 2026',
    paymentMethod: 'Cash',
    vendorPayee: 'Local Transport Co.',
    voucher: 'VCH-000821',
    status: 'Recorded',
    description: 'Transport from the collection point to the warehouse',
    createdBy: 'SWA – Suresh',
    timeline: [
      { title: 'Expense Created' },
      { title: 'Recorded' },
    ],
  });

  // Selected Return Item Details
  const [selectedReturnItem, setSelectedReturnItem] = useState({
    rmaId: 'RMA-00245',
    orderId: 'ORD-10284',
    customer: 'Ravi Kumar',
    product: 'Tomato',
    affectedQuantity: '2 KG',
    issueCategory: 'Damaged',
    customerPhotos: '2',
    issueDescription: 'Customer reported damaged produce after pickup.',
    inspectionStatus: 'Completed',
    inspectionResult: 'Confirmed',
    inspectionNotes: '2 KG received, 0.5 KG visibly damaged.',
    decision: 'Approved',
    refundStatus: 'Completed',
    refundMethod: 'TOHFA Wallet',
    refundAmount: '₹200',
    resolutionDate: '25 Sep 2026',
    timeline: [
      { title: 'Issue Raised' },
      { title: 'RMA Created' },
      { title: 'Inspection' },
      { title: 'Decision' },
      { title: 'Refund / Resolution' },
      { title: 'Completed' },
    ],
  });


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
      if (onSelectReport) {
        onSelectReport(code);
      } else {
        Alert.alert('Report', `Opening report ${code} for ${warehouseLabel}...`);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1: SALES REPORT (M12-S02)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'sales_report') {
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
              <Text style={styles.kpiValue}>₹1,84,500</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ORDERS</Text>
              <Text style={styles.kpiValue}>284</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ITEMS SOLD</Text>
              <Text style={styles.kpiValue}>1,248</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG ORDER</Text>
              <Text style={styles.kpiValue}>₹649</Text>
            </View>
          </View>

          {/* Channel Filters. HORECA / B2B stay ungated: rbac.json has no per-channel
              view code (SPEC_GAPS.md #5, W3a-1; matrix says MW=view, SW=none). */}
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
            <FilterIcon size={16} color={adminColors.muted} />
          </View>

          {/* Sales Transaction Cards */}
          <View style={styles.recordsStack}>
            <TouchableOpacity
              style={styles.recordCard}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedOrder({
                  orderId: 'ORD-10284',
                  date: '25 Sep, 11:20 AM',
                  channel: 'Online',
                  customerRef: 'C1024',
                  warehouse: rowWarehouse,
                  product: 'Tomato',
                  grade: 'Grade 1',
                  quantity: '4 KG',
                  unitPrice: '₹100',
                  amount: '₹1,240',
                  paymentMethod: 'Wallet',
                  paymentStatus: 'Completed',
                  txnRef: 'TXN-882145',
                  invoiceNumber: 'INV-2026-010284',
                  invoiceStatus: 'Generated',
                });
                setCurrentScreen('sales_order_detail');
              }}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>ORD-10284</Text>
                <View style={styles.greenBadgePill}>
                  <Text style={styles.greenBadgeText}>Completed</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Customer #C1024 · Online · 4 items</Text>
              <Text style={styles.recordAmountText}>₹1,240</Text>
              <Text style={styles.recordDateText}>25 Sep · 11:20 AM</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordCard}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedOrder({
                  orderId: 'ORD-10283',
                  date: '25 Sep, 10:45 AM',
                  channel: 'Market',
                  customerRef: 'Walk-in Buyer',
                  warehouse: rowWarehouse,
                  product: 'Potato',
                  grade: 'Grade 1',
                  quantity: '2 KG',
                  unitPrice: '₹425',
                  amount: '₹850',
                  paymentMethod: 'Cash',
                  paymentStatus: 'Completed',
                  txnRef: 'TXN-882144',
                  invoiceNumber: 'INV-2026-010283',
                  invoiceStatus: 'Generated',
                });
                setCurrentScreen('sales_order_detail');
              }}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>ORD-10283</Text>
                <View style={styles.greenBadgePill}>
                  <Text style={styles.greenBadgeText}>Completed</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Walk-in Buyer · Market · 2 items</Text>
              <Text style={styles.recordAmountText}>₹850</Text>
              <Text style={styles.recordDateText}>25 Sep · 10:45 AM</Text>
            </TouchableOpacity>
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


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: SALES ORDER DETAILS (M12-S02-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'sales_order_detail') {
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
              <Text style={styles.headerTitleText}>Sales Order Detail</Text>
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
        invoiceId={selectedOrder.invoiceNumber || 'INV-2026-010284'}
        onBack={() => setCurrentScreen('sales_order_detail')}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: ORDERS LIST (M12-S02-ORDERS)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'orders_list') {
    const ordersData = [
      {
        orderId: 'ORD-1024',
        customerName: 'Arun Kumar',
        itemsCount: '3 Items',
        amount: '₹850',
        type: 'Pickup',
        time: 'Today · 10:32 AM',
        status: 'Confirmed',
        statusBg: adminColors.warning.bg,
        statusColor: adminColors.warning.text,
        channel: 'Market',
        customerRef: 'C1024',
        warehouse: rowWarehouse,
        product: 'Tomato',
        grade: 'Grade 1',
        quantity: '3 KG',
        unitPrice: '₹100',
        paymentMethod: 'Wallet',
        paymentStatus: 'Completed',
        txnRef: 'TXN-882145',
        invoiceNumber: 'INV-2026-01024',
        invoiceStatus: 'Generated',
      },
      {
        orderId: 'ORD-1023',
        customerName: 'Priya',
        itemsCount: '5 Items',
        amount: '₹1,240',
        type: 'Pickup',
        time: 'Today · 09:45 AM',
        status: 'Ready for Pickup',
        statusBg: adminColors.success.bg,
        statusColor: adminColors.success.text,
        channel: 'Online',
        customerRef: 'C1023',
        warehouse: rowWarehouse,
        product: 'Capsicum & Beans',
        grade: 'Grade 1',
        quantity: '5 KG',
        unitPrice: '₹120',
        paymentMethod: 'Wallet',
        paymentStatus: 'Completed',
        txnRef: 'TXN-882144',
        invoiceNumber: 'INV-2026-01023',
        invoiceStatus: 'Generated',
      },
      {
        orderId: 'ORD-1022',
        customerName: 'Ganesh K.',
        itemsCount: '2 Items',
        amount: '₹420',
        type: 'Pickup',
        time: 'Today · 09:10 AM',
        status: 'Packing',
        statusBg: adminColors.warning.bg,
        statusColor: adminColors.warning.text,
        channel: 'Market',
        customerRef: 'C1022',
        warehouse: rowWarehouse,
        product: 'Potato',
        grade: 'Grade 1',
        quantity: '2 KG',
        unitPrice: '₹210',
        paymentMethod: 'Cash',
        paymentStatus: 'Completed',
        txnRef: 'TXN-882143',
        invoiceNumber: 'INV-2026-01022',
        invoiceStatus: 'Generated',
      },
      {
        orderId: 'ORD-1021',
        customerName: 'Divya R.',
        itemsCount: '4 Items',
        amount: '₹960',
        type: 'Delivery',
        time: 'Today · 08:55 AM',
        status: 'Confirmed',
        statusBg: adminColors.warning.bg,
        statusColor: adminColors.warning.text,
        channel: 'Online',
        customerRef: 'C1021',
        warehouse: rowWarehouse,
        product: 'Onion & Garlic',
        grade: 'Grade 1',
        quantity: '4 KG',
        unitPrice: '₹240',
        paymentMethod: 'Wallet',
        paymentStatus: 'Completed',
        txnRef: 'TXN-882142',
        invoiceNumber: 'INV-2026-01021',
        invoiceStatus: 'Generated',
      },
      {
        orderId: 'ORD-1018',
        customerName: 'Meena S.',
        itemsCount: '2 Items',
        amount: '₹310',
        type: 'Pickup',
        time: 'Yesterday · 4:20 PM',
        status: 'Quantity Issue',
        statusBg: adminColors.danger.bg,
        statusColor: adminColors.danger.text,
        channel: 'Market',
        customerRef: 'C1018',
        warehouse: rowWarehouse,
        product: 'Carrot',
        grade: 'Grade 2',
        quantity: '2 KG',
        unitPrice: '₹155',
        paymentMethod: 'Wallet',
        paymentStatus: 'Completed',
        txnRef: 'TXN-882141',
        invoiceNumber: 'INV-2026-01018',
        invoiceStatus: 'Generated',
      },
    ];

    const filteredOrders = ordersData.filter((o) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return o.orderId.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q);
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
                onPress={() => setCurrentScreen('sales_order_detail')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Orders</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => Alert.alert('Filter', 'Filter order list')}
              activeOpacity={0.8}
            >
              <FilterIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Orders Count */}
          <Text style={styles.ordersCountText}>24 Orders</Text>

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
                  setSelectedOrder({
                    orderId: ord.orderId,
                    date: ord.time,
                    channel: ord.channel,
                    customerRef: ord.customerRef,
                    warehouse: ord.warehouse,
                    product: ord.product,
                    grade: ord.grade,
                    quantity: ord.quantity,
                    unitPrice: ord.unitPrice,
                    amount: ord.amount,
                    paymentMethod: ord.paymentMethod,
                    paymentStatus: ord.paymentStatus,
                    txnRef: ord.txnRef,
                    invoiceNumber: ord.invoiceNumber,
                    invoiceStatus: ord.invoiceStatus,
                  });
                  setCurrentScreen('sales_order_detail');
                }}
              >
                <View style={styles.orderCardTopRow}>
                  <Text style={styles.orderCardId}>{ord.orderId}</Text>
                  <View style={[styles.orderStatusBadge, { backgroundColor: ord.statusBg }]}>
                    <Text style={[styles.orderStatusText, { color: ord.statusColor }]}>{ord.status}</Text>
                  </View>
                </View>

                <Text style={styles.orderCustomerName}>{ord.customerName}</Text>

                <View style={styles.orderItemsPriceRow}>
                  <Text style={styles.orderItemsCount}>{ord.itemsCount}</Text>
                  <Text style={styles.orderAmountBold}>{ord.amount}</Text>
                </View>

                <View style={styles.orderMetaRow}>
                  <View style={styles.orderTypeGroup}>
                    {ord.type === 'Pickup' ? (
                      <StorePickupIcon size={14} color={adminColors.muted} />
                    ) : (
                      <DeliveryTruckIcon size={14} color={adminColors.muted} />
                    )}
                    <Text style={styles.orderTypeText}>{ord.type}</Text>
                  </View>
                  <Text style={styles.orderTimeText}>{ord.time}</Text>
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
              <Text style={styles.kpiValue}>84</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVAILABLE STOCK</Text>
              <Text style={styles.kpiValue}>12,480 kg</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>LOW STOCK</Text>
              <Text style={styles.kpiValue}>12</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>OUT OF STOCK</Text>
              <Text style={styles.kpiValue}>4</Text>
            </View>
          </View>


          {/* Stock Filters */}
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
            <FilterIcon size={16} color={adminColors.muted} />
          </View>

          {/* Produce Inventory Items */}
          <View style={styles.recordsStack}>
            <TouchableOpacity
              style={styles.recordCard}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedInventoryItem({
                  productName: 'Carrot',
                  productCode: 'CRT-001',
                  crop: 'Carrot',
                  grade: 'Grade 1',
                  availableQty: '420 kg',
                  reservedQty: '35 kg',
                  allocatedQty: '20 kg',
                  consumedQty: '—',
                  batchCode: 'BAT-CR-0245',
                  receivedDate: '23 Sep 2026',
                  storageLocation: 'Cold Storage A',
                  status: 'Available',
                  movementReceived: '475 kg',
                  movementAvailable: '420 kg',
                  movementReserved: '35 kg',
                  movementSold: '20 kg',
                  lastVerification: '20 Sep 2026',
                  verifiedQty: '418 kg',
                  difference: '-2 kg',
                  verificationStatus: 'Reconciled',
                });
                setCurrentScreen('inventory_item_detail');
              }}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>Carrot — Grade 1</Text>
                <View style={styles.greenBadgePill}>
                  <Text style={styles.greenBadgeText}>Available</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Cold Storage A · Batch BAT-CR-0245</Text>
              <Text style={styles.recordAmountText}>420 kg</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordCard}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedInventoryItem({
                  productName: 'Nilgiris Potato',
                  productCode: 'POT-002',
                  crop: 'Potato',
                  grade: 'Grade 1',
                  availableQty: '1,250 kg',
                  reservedQty: '150 kg',
                  allocatedQty: '80 kg',
                  consumedQty: '—',
                  batchCode: 'BAT-PT-0189',
                  receivedDate: '22 Sep 2026',
                  storageLocation: 'Zone 2 - Bay 4',
                  status: 'Available',
                  movementReceived: '1,480 kg',
                  movementAvailable: '1,250 kg',
                  movementReserved: '150 kg',
                  movementSold: '80 kg',
                  lastVerification: '19 Sep 2026',
                  verifiedQty: '1,250 kg',
                  difference: '0 kg',
                  verificationStatus: 'Reconciled',
                });
                setCurrentScreen('inventory_item_detail');
              }}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>Nilgiris Potato</Text>
                <View style={styles.greenBadgePill}>
                  <Text style={styles.greenBadgeText}>Available</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Zone 2 - Bay 4 · Batch BAT-PT-0189</Text>
              <Text style={styles.recordAmountText}>1,250 kg</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordCard}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedInventoryItem({
                  productName: 'Tomato',
                  productCode: 'TOM-003',
                  crop: 'Tomato',
                  grade: 'Grade 1',
                  availableQty: '45 kg',
                  reservedQty: '10 kg',
                  allocatedQty: '5 kg',
                  consumedQty: '—',
                  batchCode: 'BAT-TM-0312',
                  receivedDate: '24 Sep 2026',
                  storageLocation: 'Cold Storage B',
                  status: 'Low Stock',
                  movementReceived: '120 kg',
                  movementAvailable: '45 kg',
                  movementReserved: '10 kg',
                  movementSold: '65 kg',
                  lastVerification: '23 Sep 2026',
                  verifiedQty: '45 kg',
                  difference: '0 kg',
                  verificationStatus: 'Reconciled',
                });
                setCurrentScreen('inventory_item_detail');
              }}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>Tomato — Grade 1</Text>
                <View style={[styles.badgePillBase, { backgroundColor: adminColors.warning.bg }]}>
                  <Text style={[styles.badgeTextBase, { color: adminColors.warning.text }]}>Low Stock</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Cold Storage B · Batch BAT-TM-0312</Text>
              <Text style={[styles.recordAmountText, { color: adminColors.warning.text }]}>45 kg</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: INVENTORY ITEM DETAILS (M12-S03-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'inventory_item_detail') {
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
              <Text style={styles.kpiValue}>24</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>QTY RECEIVED</Text>
              <Text style={styles.kpiValue}>8,420 kg</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ACCEPTED</Text>
              <Text style={styles.kpiValue}>7,950 kg</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>REJECTED</Text>
              <Text style={styles.kpiValue}>320 kg</Text>
            </View>
            <View style={[styles.kpiCard, styles.kpiCardFull]}>
              <Text style={styles.kpiLabel}>PARTIAL</Text>
              <Text style={styles.kpiValue}>150 kg</Text>
            </View>
          </View>

          {/* Receiving Filters */}
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
            <FilterIcon size={16} color={adminColors.muted} />
          </View>


          {/* Receiving Report Items */}
          <View style={styles.recordsStack}>
            <TouchableOpacity
              style={styles.recordCard}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedReceivingItem({
                  receiptId: 'GR-00245',
                  dateTime: '25 Sep, 10:20 AM',
                  warehouse: rowWarehouse,
                  sourceRef: 'Farmer #FRM-0842',
                  product: 'Carrot',
                  grade: 'Grade 1',
                  qtyReceived: '420 kg',
                  qualityStatus: 'Accepted',
                  acceptedQty: '400 kg',
                  partialQty: '15 kg',
                  rejectedQty: '5 kg',
                  qcNotes: 'Minor surface blemish on rejected portion.',
                  timeline: [
                    { title: 'Goods Received', time: '10:20 AM' },
                    { title: 'QC Started', time: '10:25 AM' },
                    { title: 'QC Completed', time: '10:40 AM' },
                  ],
                });
                setCurrentScreen('receiving_item_detail');
              }}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>GR-00245</Text>
                <View style={styles.greenBadgePill}>
                  <Text style={styles.greenBadgeText}>QC Accepted</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Carrot — Grade 1</Text>
              <View style={styles.receivingAmountRow}>
                <Text style={styles.receivedQtyMuted}>Received 420 kg</Text>
                <Text style={styles.acceptedQtyBold}>Accepted 400 kg</Text>
              </View>
              <Text style={styles.recordDateText}>25 Sep 2026 · 10:20 AM</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordCard}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedReceivingItem({
                  receiptId: 'GR-00244',
                  dateTime: '25 Sep, 09:15 AM',
                  warehouse: rowWarehouse,
                  sourceRef: 'Farmer #FRM-0714',
                  product: 'Nilgiris Potato',
                  grade: 'Grade 1',
                  qtyReceived: '1,250 kg',
                  qualityStatus: 'Accepted',
                  acceptedQty: '1,250 kg',
                  partialQty: '0 kg',
                  rejectedQty: '0 kg',
                  qcNotes: 'Full batch verified and meets grade 1 quality standards.',
                  timeline: [
                    { title: 'Goods Received', time: '09:15 AM' },
                    { title: 'QC Started', time: '09:20 AM' },
                    { title: 'QC Completed', time: '09:35 AM' },
                  ],
                });
                setCurrentScreen('receiving_item_detail');
              }}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>GR-00244</Text>
                <View style={styles.greenBadgePill}>
                  <Text style={styles.greenBadgeText}>QC Accepted</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Nilgiris Potato</Text>
              <View style={styles.receivingAmountRow}>
                <Text style={styles.receivedQtyMuted}>Received 1,250 kg</Text>
                <Text style={styles.acceptedQtyBold}>Accepted 1,250 kg</Text>
              </View>
              <Text style={styles.recordDateText}>25 Sep 2026 · 09:15 AM</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordCard}
              activeOpacity={0.75}
              onPress={() => {
                setSelectedReceivingItem({
                  receiptId: 'GR-00243',
                  dateTime: '24 Sep, 04:45 PM',
                  warehouse: rowWarehouse,
                  sourceRef: 'Farmer #FRM-0690',
                  product: 'Tomato',
                  grade: 'Grade 2',
                  qtyReceived: '320 kg',
                  qualityStatus: 'QC Rejected',
                  acceptedQty: '0 kg',
                  partialQty: '0 kg',
                  rejectedQty: '320 kg',
                  qcNotes: 'Excessive moisture and rot detected — rejected per quality threshold.',
                  timeline: [
                    { title: 'Goods Received', time: '04:45 PM' },
                    { title: 'QC Started', time: '04:50 PM' },
                    { title: 'QC Completed', time: '05:05 PM' },
                  ],
                });
                setCurrentScreen('receiving_item_detail');
              }}
            >
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>GR-00243</Text>
                <View style={[styles.badgePillBase, { backgroundColor: adminColors.danger.bg }]}>
                  <Text style={[styles.badgeTextBase, { color: adminColors.danger.text }]}>QC Rejected</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Tomato — Grade 2</Text>
              <View style={styles.receivingAmountRow}>
                <Text style={styles.receivedQtyMuted}>Received 320 kg</Text>
                <Text style={[styles.acceptedQtyBold, { color: adminColors.danger.text }]}>Rejected 320 kg</Text>
              </View>
              <Text style={styles.recordDateText}>24 Sep 2026 · 04:45 PM</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: RECEIVING ITEM DETAILS (M12-S04-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'receiving_item_detail') {
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
              {selectedReceivingItem.timeline.map((step, idx) => (
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
    const CUSTOMER_DATA = [
      {
        id: 'CUS-10284',
        name: 'Customer #10284',
        channel: 'Online',
        orders: 12,
        completedOrders: 11,
        cancelledOrders: 1,
        lastOrder: '24 Sep 2026',
        totalSpent: '₹8,450',
        mobile: '+91 XXXXX XXXXX',
        frequency: '~2/month',
        orderHistory: [
          { orderId: 'ORD-1001', amount: '₹850', status: 'Completed' },
          { orderId: 'ORD-1008', amount: '₹1,240', status: 'Completed' },
        ],
      },
      {
        id: 'CUS-10283',
        name: 'Customer #10283',
        channel: 'Market',
        orders: 8,
        completedOrders: 8,
        cancelledOrders: 0,
        lastOrder: '24 Sep 2026',
        totalSpent: '₹5,120',
        mobile: '+91 XXXXX XXXXX',
        frequency: '~3/month',
        orderHistory: [
          { orderId: 'ORD-0995', amount: '₹1,450', status: 'Completed' },
          { orderId: 'ORD-0980', amount: '₹980', status: 'Completed' },
        ],
      },
      {
        id: 'CUS-10280',
        name: 'Customer #10280',
        channel: 'B2B',
        orders: 24,
        completedOrders: 23,
        cancelledOrders: 1,
        lastOrder: '23 Sep 2026',
        totalSpent: '₹22,800',
        mobile: '+91 XXXXX XXXXX',
        frequency: '~6/month',
        orderHistory: [
          { orderId: 'ORD-1015', amount: '₹4,800', status: 'Completed' },
          { orderId: 'ORD-0952', amount: '₹6,200', status: 'Completed' },
        ],
      },
      {
        id: 'CUS-10275',
        name: 'Customer #10275',
        channel: 'Online',
        orders: 5,
        completedOrders: 5,
        cancelledOrders: 0,
        lastOrder: '22 Sep 2026',
        totalSpent: '₹3,450',
        mobile: '+91 XXXXX XXXXX',
        frequency: '~1/month',
        orderHistory: [
          { orderId: 'ORD-0965', amount: '₹750', status: 'Completed' },
          { orderId: 'ORD-0920', amount: '₹1,200', status: 'Completed' },
        ],
      },
      {
        id: 'CUS-10268',
        name: 'Customer #10268',
        channel: 'Market',
        orders: 19,
        completedOrders: 18,
        cancelledOrders: 1,
        lastOrder: '21 Sep 2026',
        totalSpent: '₹14,200',
        mobile: '+91 XXXXX XXXXX',
        frequency: '~4/month',
        orderHistory: [
          { orderId: 'ORD-0988', amount: '₹2,100', status: 'Completed' },
          { orderId: 'ORD-0945', amount: '₹1,650', status: 'Completed' },
        ],
      },
      {
        id: 'CUS-10260',
        name: 'Customer #10260',
        channel: 'B2B',
        orders: 31,
        completedOrders: 30,
        cancelledOrders: 1,
        lastOrder: '20 Sep 2026',
        totalSpent: '₹38,900',
        mobile: '+91 XXXXX XXXXX',
        frequency: '~8/month',
        orderHistory: [
          { orderId: 'ORD-1005', amount: '₹8,900', status: 'Completed' },
          { orderId: 'ORD-0972', amount: '₹7,400', status: 'Completed' },
        ],
      },
    ];

    const filteredCustomers = CUSTOMER_DATA.filter((cust) => {
      const matchQuery =
        !searchQuery ||
        cust.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cust.mobile.includes(searchQuery);
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
              <Text style={styles.kpiValue}>1,248</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ACTIVE CUSTOMERS</Text>
              <Text style={styles.kpiValue}>986</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>NEW CUSTOMERS</Text>
              <Text style={styles.kpiValue}>42</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ORDERS</Text>
              <Text style={styles.kpiValue}>284</Text>
            </View>
          </View>

          {/* Customer Channel Filters */}
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
            <FilterIcon size={16} color={adminColors.muted} />
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
                <Text style={styles.recordSubText}>{cust.name}</Text>
                <Text style={styles.custOrdersText}>{cust.orders} orders</Text>
                <Text style={styles.recordDateText}>Last order {cust.lastOrder}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: CUSTOMER ITEM DETAILS (M12-S05-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'customer_item_detail') {
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
            {selectedCustomerItem.orderHistory.map((item, idx) => (
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
    const TOPUP_DATA = [
      {
        id: 'TOP-002845',
        customerId: 'CUS-1024',
        customer: 'Customer CUS-1024 · Cash',
        amount: '₹2,000',
        paymentMethod: 'Cash',
        auth: 'SWA',
        processedBy: 'SWA – Suresh',
        status: 'Completed',
        referenceId: 'TOP-002845',
        cashTagFiscalRef: 'FT-2026-004512',
        time: '10:24 AM',
        dateTime: '25 Sep, 10:24 AM',
        period: 'Today',
      },
      {
        id: 'TOP-002844',
        customerId: 'CUS-1018',
        customer: 'Customer CUS-1018 · Cash',
        amount: '₹1,500',
        paymentMethod: 'Cash',
        auth: 'SWA',
        processedBy: 'SWA – Suresh',
        status: 'Completed',
        referenceId: 'TOP-002844',
        cashTagFiscalRef: 'FT-2026-004511',
        time: '09:40 AM',
        dateTime: '25 Sep, 09:40 AM',
        period: 'Today',
      },
      {
        id: 'TOP-002843',
        customerId: 'CUS-1092',
        customer: 'Customer CUS-1092 · Cash',
        amount: '₹5,000',
        paymentMethod: 'Cash',
        auth: 'SWA',
        processedBy: 'SWA – Suresh',
        status: 'Completed',
        referenceId: 'TOP-002843',
        cashTagFiscalRef: 'FT-2026-004510',
        time: '08:15 AM',
        dateTime: '25 Sep, 08:15 AM',
        period: 'Today',
      },
      {
        id: 'TOP-002840',
        customerId: 'CUS-0984',
        customer: 'Customer CUS-0984 · Cash',
        amount: '₹3,000',
        paymentMethod: 'Cash',
        auth: 'SWA',
        processedBy: 'SWA – Suresh',
        status: 'Completed',
        referenceId: 'TOP-002840',
        cashTagFiscalRef: 'FT-2026-004505',
        time: '24 Sep 2026 · 05:10 PM',
        dateTime: '24 Sep, 05:10 PM',
        period: 'This Month',
      },
      {
        id: 'TOP-002838',
        customerId: 'CUS-1002',
        customer: 'Customer CUS-1002 · Cash',
        amount: '₹7,000',
        paymentMethod: 'Cash',
        auth: 'SWA',
        processedBy: 'SWA – Suresh',
        status: 'Completed',
        referenceId: 'TOP-002838',
        cashTagFiscalRef: 'FT-2026-004502',
        time: '24 Sep 2026 · 02:30 PM',
        dateTime: '24 Sep, 02:30 PM',
        period: 'This Month',
      },
      {
        id: 'TOP-002835',
        customerId: 'CUS-0950',
        customer: 'Customer CUS-0950 · Cash',
        amount: '₹10,000',
        paymentMethod: 'Cash',
        auth: 'SWA',
        processedBy: 'SWA – Suresh',
        status: 'Completed',
        referenceId: 'TOP-002835',
        cashTagFiscalRef: 'FT-2026-004498',
        time: '23 Sep 2026 · 11:00 AM',
        dateTime: '23 Sep, 11:00 AM',
        period: 'This Month',
      },
    ];

    const filteredTopups = TOPUP_DATA.filter((item) => {
      const matchQuery =
        !searchQuery ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPeriod = topupPeriod === 'All' || item.period === topupPeriod || (topupPeriod === 'This Month');
      return matchQuery && matchPeriod;
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
              <Text style={styles.headerTitleText}>Cash Top-Up Report</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards (2x2 Grid) */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S TOP-UPS</Text>
              <Text style={styles.kpiValue}>₹18,500</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
              <Text style={styles.kpiValue}>26</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG TOP-UP</Text>
              <Text style={styles.kpiValue}>₹712</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>THIS MONTH</Text>
              <Text style={styles.kpiValue}>₹2,84,500</Text>
            </View>
          </View>


          {/* Filter Chips */}
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
            <FilterIcon size={16} color={adminColors.muted} />
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
                <Text style={styles.recordSubText}>{item.customer}</Text>
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


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: CASH TOP-UP ITEM DETAILS (M12-S06-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'cash_topup_item_detail') {
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
    const REVENUE_DATA = [
      {
        id: 'REV-000845',
        orderId: 'ORD-10284',
        invoice: 'INV-2026-000845',
        type: 'Market Sale',
        product: 'Tomato',
        quantity: '3 KG',
        order: 'Order ORD-10284',
        amount: '₹3,450',
        paymentMethod: 'Wallet',
        status: 'Completed',
        dateTime: '25 Sep, 11:20 AM',
        warehouse: rowWarehouse,
      },
      {
        id: 'REV-000844',
        orderId: 'ORD-10280',
        invoice: 'INV-2026-000844',
        type: 'Online Order',
        product: 'Carrot & Beans',
        quantity: '4 KG',
        order: 'Order ORD-10280',
        amount: '₹1,850',
        paymentMethod: 'UPI',
        status: 'Completed',
        dateTime: '25 Sep, 10:45 AM',
        warehouse: rowWarehouse,
      },
      {
        id: 'REV-000842',
        orderId: 'ORD-10275',
        invoice: 'INV-2026-000842',
        type: 'Market Sale',
        product: 'Potato',
        quantity: '6 KG',
        order: 'Order ORD-10275',
        amount: '₹4,200',
        paymentMethod: 'Card',
        status: 'Completed',
        dateTime: '24 Sep, 04:30 PM',
        warehouse: rowWarehouse,
      },
      {
        id: 'REV-000840',
        orderId: 'ORD-10268',
        invoice: 'INV-2026-000840',
        type: 'Online Order',
        product: 'Capsicum & Tomato',
        quantity: '5 KG',
        order: 'Order ORD-10268',
        amount: '₹6,100',
        paymentMethod: 'Cash',
        status: 'Completed',
        dateTime: '24 Sep, 02:15 PM',
        warehouse: rowWarehouse,
      },
    ];

    const filteredRevenue = REVENUE_DATA.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.order.toLowerCase().includes(q) ||
        item.paymentMethod.toLowerCase().includes(q)
      );
    });

    const REVENUE_SOURCES = [
      { channel: 'Online Orders', value: '₹2,80,000' },
      { channel: 'Market Sales', value: '₹2,40,000' },
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
              <Text style={styles.kpiValue}>₹5,84,200</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY</Text>
              <Text style={styles.kpiValue}>₹24,850</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ORDERS</Text>
              <Text style={styles.kpiValue}>284</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG SALE</Text>
              <Text style={styles.kpiValue}>₹2,057</Text>
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
            <FilterIcon size={16} color={adminColors.muted} />
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
                <Text style={styles.recordSubText}>{item.type} · {item.order}</Text>
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


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: REVENUE ITEM DETAILS (M12-S08-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'revenue_item_detail') {
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
    const EXPENSE_DATA = [
      {
        id: 'EXP-001245',
        category: 'Transport',
        voucher: 'Voucher VCH-000821',
        amount: '₹2,400',
        status: 'Recorded',
        date: '25 Sep 2026',
        paymentMethod: 'Cash',
        vendorPayee: 'Local Transport Co.',
        description: 'Transport from the collection point to the warehouse',
        createdBy: 'SWA – Suresh',
        timeline: [
          { title: 'Expense Created' },
          { title: 'Recorded' },
        ],
      },
      {
        id: 'EXP-001244',
        category: 'Loading',
        voucher: 'VCH-000820',
        amount: '₹1,800',
        status: 'Recorded',
        date: '25 Sep 2026',
        paymentMethod: 'Cash',
        vendorPayee: 'Local Handlers',
        description: 'Unloading & stacking produce crates at dock 2',
        createdBy: 'SWA – Suresh',
        timeline: [
          { title: 'Expense Created' },
          { title: 'Recorded' },
        ],
      },
      {
        id: 'EXP-001243',
        category: 'Maintenance',
        voucher: 'VCH-000818',
        amount: '₹4,200',
        status: 'Recorded',
        date: '24 Sep 2026',
        paymentMethod: 'UPI',
        vendorPayee: 'CoolTech Ref Services',
        description: 'Chiller room condenser maintenance and refilling',
        createdBy: 'SWA – Suresh',
        timeline: [
          { title: 'Expense Created' },
          { title: 'Recorded' },
        ],
      },
      {
        id: 'EXP-001240',
        category: 'Other',
        voucher: 'VCH-000815',
        amount: '₹3,500',
        status: 'Pending',
        date: '24 Sep 2026',
        paymentMethod: 'Card',
        vendorPayee: 'Nilgiris Packaging Supplies',
        description: 'Purchase of carton boxes and barcode roll labels',
        createdBy: 'SWA – Suresh',
        timeline: [
          { title: 'Expense Created' },
          { title: 'Pending Approval' },
        ],
      },
    ];

    const filteredExpenses = EXPENSE_DATA.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.voucher.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.vendorPayee.toLowerCase().includes(q)
      );
    });

    const BREAKDOWN_CATEGORIES = [
      { name: 'Transport', amount: '₹42,500' },
      { name: 'Loading', amount: '₹18,400' },
      { name: 'Unloading', amount: '₹12,600' },
      { name: 'Maintenance', amount: '₹21,800' },
      { name: 'Other', amount: '₹53,300' },
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
              <Text style={styles.kpiValue}>₹1,48,600</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
              <Text style={styles.kpiValue}>82</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>AVG EXPENSE</Text>
              <Text style={styles.kpiValue}>₹1,812</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PENDING</Text>
              <Text style={styles.kpiValue}>8</Text>
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
            <FilterIcon size={16} color={adminColors.muted} />
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
                <Text style={styles.recordSubText}>{item.category} · {item.voucher}</Text>
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


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: EXPENSE ITEM DETAILS (M12-S07-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'expense_item_detail') {
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
              {selectedExpenseItem.timeline.map((step, idx) => (
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
      if (exportStep === 'generating') {
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
              <Text style={styles.headerTitleText}>Export Report</Text>
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

            {/* Bottom Download Button (+ Generate Another, from MainWarehouseExportReportScreen) */}
            <View style={styles.exportBottomBarDual}>
              <TouchableOpacity
                style={[styles.nextActionButton, !exportAllowed && styles.buttonDisabled]}
                activeOpacity={0.8}
                disabled={!exportAllowed}
                accessibilityState={{ disabled: !exportAllowed }}
                onPress={() => {
                  if (!exportAllowed) return;
                  Alert.alert(
                    'Download Complete',
                    `${selectedExportReport} (${exportFormat}) downloaded successfully to your device.`,
                    [
                      {
                        text: 'Done',
                        onPress: () => {
                          setExportStep(1);
                          setCurrentScreen('main');
                        },
                      },
                    ]
                  );
                }}
              >
                <DownloadIcon size={18} color={adminColors.onBrand} />
                <Text style={styles.nextActionButtonText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backStepBtn} activeOpacity={0.8} onPress={() => setExportStep(1)}>
                <Text style={styles.backStepBtnText}>Generate Another</Text>
              </TouchableOpacity>
            </View>
          </>
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
                      <Text style={styles.previewMetricVal}>₹5,84,200</Text>
                    </View>
                    <View style={styles.exportRowDivider} />
                    <View style={styles.previewMetricRow}>
                      <Text style={styles.previewMetricLabel}>Orders</Text>
                      <Text style={styles.previewMetricVal}>842</Text>
                    </View>
                    <View style={styles.exportRowDivider} />
                    <View style={styles.previewMetricRow}>
                      <Text style={styles.previewMetricLabel}>Items</Text>
                      <Text style={styles.previewMetricVal}>4,850</Text>
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
                <Text style={styles.summaryItemValue}>{isDaily ? '84' : '1,840'}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Sales</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '₹24,850' : '₹5,48,200'}</Text>
              </View>
            </View>
            <View style={[styles.summaryCardRow, { marginTop: 12 }]}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Items Sold</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '420' : '9,250'}</Text>
              </View>
            </View>
          </View>

          {/* 2. Receiving Card */}
          <Text style={styles.summarySectionTitle}>Receiving</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Receipts</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '12' : '280'}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Quantity Received</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '2,850 kg' : '64,800 kg'}</Text>
              </View>
            </View>
          </View>

          {/* 3. Inventory Card */}
          <Text style={styles.summarySectionTitle}>Inventory</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Available Stock</Text>
                <Text style={styles.summaryItemValue}>12,480 kg</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Low Stock</Text>
                <Text style={styles.summaryItemValue}>12</Text>
              </View>
            </View>
          </View>

          {/* 4. Customers Card */}
          <Text style={styles.summarySectionTitle}>Customers</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Customers Served</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '126' : '1,248'}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>New Customers</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '8' : '42'}</Text>
              </View>
            </View>
          </View>

          {/* 5. Wallet Card */}
          <Text style={styles.summarySectionTitle}>Wallet</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Cash Top-Ups</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '₹18,500' : '₹2,84,500'}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Transactions</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '26' : '384'}</Text>
              </View>
            </View>
          </View>

          {/* 6. Finance Card */}
          <Text style={styles.summarySectionTitle}>Finance</Text>
          <View style={styles.summaryCard}>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Revenue</Text>
              <Text style={styles.financeVal}>{isDaily ? '₹24,850' : '₹5,48,200'}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Expenses</Text>
              <Text style={styles.financeVal}>{isDaily ? '₹6,420' : '₹1,48,600'}</Text>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.financeRow}>
              <Text style={styles.financeNetLabel}>Net</Text>
              <Text style={styles.financeNetVal}>{isDaily ? '₹18,430' : '₹3,99,600'}</Text>
            </View>
          </View>

          {/* 7. Returns Card */}
          <Text style={styles.summarySectionTitle}>Returns</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryCardRow}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>New Returns</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '8' : '46'}</Text>
              </View>
              <View style={styles.summaryColRight}>
                <Text style={styles.summaryItemLabel}>Resolved</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '5' : '38'}</Text>
              </View>
            </View>
            <View style={[styles.summaryCardRow, { marginTop: 12 }]}>
              <View style={styles.summaryCol}>
                <Text style={styles.summaryItemLabel}>Pending</Text>
                <Text style={styles.summaryItemValue}>{isDaily ? '3' : '8'}</Text>
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
            <View style={styles.barGraphArea}>
              <View style={styles.barColumn}>
                <Text style={styles.barValueText}>₹18k</Text>
                <View style={[styles.barVisual, { height: 60 }]} />
                <Text style={styles.barDayText}>Mon</Text>
              </View>
              <View style={styles.barColumn}>
                <Text style={styles.barValueText}>₹22k</Text>
                <View style={[styles.barVisual, { height: 74 }]} />
                <Text style={styles.barDayText}>Tue</Text>
              </View>
              <View style={styles.barColumn}>
                <Text style={styles.barValueText}>₹20k</Text>
                <View style={[styles.barVisual, { height: 68 }]} />
                <Text style={styles.barDayText}>Wed</Text>
              </View>
              <View style={styles.barColumn}>
                <Text style={styles.barValueText}>₹26k</Text>
                <View style={[styles.barVisual, { height: 86 }]} />
                <Text style={styles.barDayText}>Thu</Text>
              </View>
              <View style={styles.barColumn}>
                <Text style={styles.barValueText}>₹24.8k</Text>
                <View style={[styles.barVisual, { height: 80 }]} />
                <Text style={styles.barDayText}>Fri</Text>
              </View>
            </View>
            <Text style={styles.chartDescText}>Daily trend — Mon Tue Wed Thu Fri bars</Text>
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
    const RETURN_DATA = [
      {
        id: 'RMA-00245',
        orderId: 'ORD-10284',
        order: 'Order ORD-10284',
        customer: 'Ravi Kumar',
        product: 'Tomato',
        affectedQty: 'Affected Qty 2',
        affectedQuantity: '2 KG',
        category: 'Damaged',
        customerPhotos: '2',
        issueDescription: 'Customer reported damaged produce after pickup.',
        inspectionStatus: 'Completed',
        inspectionResult: 'Confirmed',
        inspectionNotes: '2 KG received, 0.5 KG visibly damaged.',
        decision: 'Approved',
        refundStatus: 'Completed',
        refundMethod: 'TOHFA Wallet',
        refundAmount: '₹200',
        resolutionDate: '25 Sep 2026',
        status: 'Approved',
        resolution: 'Refund Completed',
        resolutionColor: adminColors.success.text,
        timeline: [
          { title: 'Issue Raised' },
          { title: 'RMA Created' },
          { title: 'Inspection' },
          { title: 'Decision' },
          { title: 'Refund / Resolution' },
          { title: 'Completed' },
        ],
      },
      {
        id: 'RMA-00244',
        orderId: 'ORD-10279',
        order: 'Order ORD-10279',
        customer: 'Priya Sundaram',
        product: 'Carrot',
        affectedQty: 'Affected Qty 5 kg',
        affectedQuantity: '5 KG',
        category: 'Quality',
        customerPhotos: '1',
        issueDescription: 'Carrots soft and discolored upon delivery.',
        inspectionStatus: 'Completed',
        inspectionResult: 'Confirmed',
        inspectionNotes: '5 KG produce decayed.',
        decision: 'Approved',
        refundStatus: 'Completed',
        refundMethod: 'Replacement Dispatched',
        refundAmount: '5 KG Produce',
        resolutionDate: '25 Sep 2026',
        status: 'Approved',
        resolution: 'Replacement Dispatched',
        resolutionColor: adminColors.success.text,
        timeline: [
          { title: 'Issue Raised' },
          { title: 'RMA Created' },
          { title: 'Inspection' },
          { title: 'Decision' },
          { title: 'Refund / Resolution' },
          { title: 'Completed' },
        ],
      },
      {
        id: 'RMA-00243',
        orderId: 'ORD-10265',
        order: 'Order ORD-10265',
        customer: 'Karthik Raj',
        product: 'Beans',
        affectedQty: 'Affected Qty 1',
        affectedQuantity: '1 KG',
        category: 'Missing',
        customerPhotos: '0',
        issueDescription: '1 KG Beans item missing from packet.',
        inspectionStatus: 'Pending',
        inspectionResult: 'Under Review',
        inspectionNotes: 'Verifying dispatch checklist.',
        decision: 'Pending',
        refundStatus: 'Under Review',
        refundMethod: 'TOHFA Wallet',
        refundAmount: '₹80',
        resolutionDate: '24 Sep 2026',
        status: 'Pending',
        resolution: 'Under Review',
        resolutionColor: adminColors.warning.text,
        timeline: [
          { title: 'Issue Raised' },
          { title: 'RMA Created' },
          { title: 'Inspection' },
        ],
      },
      {
        id: 'RMA-00240',
        orderId: 'ORD-10250',
        order: 'Order ORD-10250',
        customer: 'Ananya Sharma',
        product: 'Potato',
        affectedQty: 'Affected Qty 3 kg',
        affectedQuantity: '3 KG',
        category: 'Wrong',
        customerPhotos: '1',
        issueDescription: 'Customer claimed wrong size received.',
        inspectionStatus: 'Completed',
        inspectionResult: 'Not Confirmed',
        inspectionNotes: 'Produce matches standard size grade specified.',
        decision: 'Rejected',
        refundStatus: 'Dispute Closed',
        refundMethod: 'None',
        refundAmount: '₹0',
        resolutionDate: '24 Sep 2026',
        status: 'Rejected',
        resolution: 'Dispute Closed',
        resolutionColor: adminColors.danger.text,
        timeline: [
          { title: 'Issue Raised' },
          { title: 'RMA Created' },
          { title: 'Inspection' },
          { title: 'Decision' },
          { title: 'Completed' },
        ],
      },
      {
        id: 'RMA-00238',
        orderId: 'ORD-10242',
        order: 'Order ORD-10242',
        customer: 'Selvamurugan M',
        product: 'Cabbage',
        affectedQty: 'Affected Qty 4 kg',
        affectedQuantity: '4 KG',
        category: 'Quantity',
        customerPhotos: '1',
        issueDescription: 'Short weight by 1 KG.',
        inspectionStatus: 'Completed',
        inspectionResult: 'Confirmed',
        inspectionNotes: 'Weight discrepancy confirmed at scale.',
        decision: 'Approved',
        refundStatus: 'Completed',
        refundMethod: 'TOHFA Wallet',
        refundAmount: '₹120',
        resolutionDate: '24 Sep 2026',
        status: 'Approved',
        resolution: 'Wallet Credited',
        resolutionColor: adminColors.success.text,
        timeline: [
          { title: 'Issue Raised' },
          { title: 'RMA Created' },
          { title: 'Inspection' },
          { title: 'Decision' },
          { title: 'Refund / Resolution' },
          { title: 'Completed' },
        ],
      },
      {
        id: 'RMA-00235',
        orderId: 'ORD-10231',
        order: 'Order ORD-10231',
        customer: 'Deepa Natarajan',
        product: 'Onion',
        affectedQty: 'Affected Qty 10 kg',
        affectedQuantity: '10 KG',
        category: 'Late',
        customerPhotos: '0',
        issueDescription: 'Delivery delayed past evening slot.',
        inspectionStatus: 'In Progress',
        inspectionResult: 'Carrier Tracing',
        inspectionNotes: 'Carrier transit delay being verified.',
        decision: 'Pending',
        refundStatus: 'Carrier Tracing',
        refundMethod: 'TOHFA Wallet',
        refundAmount: '₹350',
        resolutionDate: '23 Sep 2026',
        status: 'Pending',
        resolution: 'Carrier Tracing',
        resolutionColor: adminColors.warning.text,
        timeline: [
          { title: 'Issue Raised' },
          { title: 'RMA Created' },
          { title: 'Carrier Tracing' },
        ],
      },
    ];

    const filteredReturns = RETURN_DATA.filter((item) => {
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
              <Text style={styles.kpiValue}>42</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PENDING</Text>
              <Text style={styles.kpiValue}>8</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>APPROVED</Text>
              <Text style={styles.kpiValue}>26</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>REJECTED</Text>
              <Text style={styles.kpiValue}>8</Text>
            </View>
          </View>

          {/* Issue Category Filter Chips */}
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
            <FilterIcon size={16} color={adminColors.muted} />
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
                <Text style={styles.recordSubText}>{item.order} · {item.category}</Text>
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


      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN: RETURNS ITEM DETAILS (M12-S09-DETAIL)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'returns_item_detail') {
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
              {selectedReturnItem.timeline.map((step, idx) => (
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
    { label: "TODAY'S SALES", value: '₹24,850', permission: REPORT_CODES.sales },
    { label: 'INVENTORY', value: '12,480 kg', permission: REPORT_CODES.inventory },
    { label: 'RECEIVED TODAY', value: '2,850 kg', permission: REPORT_CODES.inventory },
    { label: 'CUSTOMERS SERVED', value: '126', permission: REPORT_CODES.customers },
    { label: 'CASH TOP-UP', value: '₹18,500', permission: REPORT_CODES.cashTopUp },
    { label: 'EXPENSES', value: '₹6,420', permission: REPORT_CODES.expense },
    { label: 'RETURNS', value: '8', permission: REPORT_CODES.returns },
  ].filter((k) => can(k.permission));

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
              if (onNavigateToNotifications) {
                onNavigateToNotifications();
              } else {
                Alert.alert('Notifications', 'You have 3 unread warehouse notifications.');
              }
            }}
            activeOpacity={0.8}
          >
            <BellHeaderIcon />
          </TouchableOpacity>
        </View>

        {/* Warehouse & Date Scope Pill: Sub is locked and cycles the period;
            Main opens the all-warehouses selector (from MainWarehouseReportsScreen). */}
        <TouchableOpacity
          style={styles.warehouseBadgeRow}
          onPress={() => {
            if (isMain) {
              setPendingWarehouseId(selectedWarehouseId);
              setShowWarehousePicker((open) => !open);
              return;
            }
            const next = timeFilter === 'Today' ? 'Week' : timeFilter === 'Week' ? 'Month' : 'Today';
            setTimeFilter(next);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.warehouseBadge}>
            {isMain ? null : <LockBadgeIcon />}
            <Text style={styles.warehouseBadgeText}>{warehouseLabel} · {timeFilter} ▾</Text>
          </View>
        </TouchableOpacity>
      </View>

      {isMain && showWarehousePicker ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.exportFilterGroupTitle}>Warehouse</Text>
          <View style={styles.filterChipRow}>
            {[{ warehouseId: undefined, warehouseName: 'All Warehouses' }, ...warehouseOptions].map((wh) => {
              const active = pendingWarehouseId === wh.warehouseId;
              return (
                <TouchableOpacity
                  key={wh.warehouseId ?? 'all'}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setPendingWarehouseId(wh.warehouseId)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{wh.warehouseName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.exportFilterGroupTitle, styles.pickerGroupGap]}>Period</Text>
          <View style={styles.filterChipRow}>
            {(['Today', 'Week', 'Month'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.filterChip, timeFilter === p && styles.filterChipActive]}
                onPress={() => setTimeFilter(p)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, timeFilter === p && styles.filterChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.nextActionButton, styles.pickerApplyGap]}
            activeOpacity={0.8}
            onPress={() => {
              setSelectedWarehouseId(pendingWarehouseId);
              setShowWarehousePicker(false);
            }}
          >
            <Text style={styles.nextActionButtonText}>Apply</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── 1. KPI Metric Cards (2 Columns Grid) ─── */}
          {hubKpis.length > 0 ? (
            <View style={styles.kpiGrid}>
              {hubKpis.map((k, idx) => (
                <View
                  key={k.label}
                  style={[styles.kpiCard, idx === hubKpis.length - 1 && hubKpis.length % 2 === 1 && styles.kpiCardFull]}
                >
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={styles.kpiValue}>{k.value}</Text>
                </View>
              ))}
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
      )}
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...adminShadow.md,
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
    borderRadius: 18,
    // Was white at 0.22 on the orange header; no overlay token exists, so a solid deep-orange fill.
    backgroundColor: adminColors.brandDeep,
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
    // Was white at 0.2 on the orange header; no overlay token exists, so a solid deep-orange fill.
    backgroundColor: adminColors.brandDeep,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    // Was white at 0.25 on the orange header; no overlay token exists, so a solid deep-orange fill.
    borderColor: adminColors.brandDeep,
  },
  warehouseBadgeText: {
    color: adminColors.onBrand,
    ...adminType.caption,
    letterSpacing: 0.1,
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    // Was white at 0.22 on the orange header; no overlay token exists, so a solid deep-orange fill.
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
    // Was white at 0.2 on the orange header; no overlay token exists, so a solid deep-orange fill.
    backgroundColor: adminColors.brandDeep,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    // Was white at 0.25 on the orange header; no overlay token exists, so a solid deep-orange fill.
    borderColor: adminColors.brandDeep,
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
});
