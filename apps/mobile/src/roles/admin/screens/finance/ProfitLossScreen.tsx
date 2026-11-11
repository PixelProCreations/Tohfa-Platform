import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
} from '../../theme';
import {
  BackArrowIcon,
  BuildingWarehouseIcon,
  CalendarIcon,
  CheckmarkIcon,
  ChevronDownIcon,
  DownloadIcon,
  TrendChartIcon,
} from '../../components/AdminIcons';
import {
  OverviewCardsGrid,
  OverviewDashboardCard,
} from '../../components/OverviewDashboardCard';

export interface ProfitLossScreenProps {
  can?: any;
  role?: string;
  onBack: () => void;
  onExport?: () => void;
}

interface WarehousePerformanceRow {
  warehouse: string;
  revenue: string;
  expenses: string;
  netProfit: string;
  margin: string;
  sale: string;
  otherIncome: string;
  cogs: string;
  opExpenses: string;
}

const WAREHOUSE_DATA: WarehousePerformanceRow[] = [
  {
    warehouse: 'Ooty',
    revenue: '₹ 5,20,000',
    expenses: '₹ 2,80,000',
    netProfit: '₹ 2,40,000',
    margin: '46.2%',
    sale: '3,50,000',
    otherIncome: '25,000',
    cogs: '1,10,000',
    opExpenses: '55,000',
  },
  {
    warehouse: 'Coonoor',
    revenue: '₹ 3,75,000',
    expenses: '₹ 1,95,000',
    netProfit: '₹ 1,80,000',
    margin: '48.0%',
    sale: '2,50,000',
    otherIncome: '20,000',
    cogs: '1,10,000',
    opExpenses: '55,000',
  },
  {
    warehouse: 'Nilgiri',
    revenue: '₹ 2,90,000',
    expenses: '₹ 1,50,000',
    netProfit: '₹ 1,40,000',
    margin: '48.3%',
    sale: '2,00,000',
    otherIncome: '25,000',
    cogs: '1,10,000',
    opExpenses: '55,000',
  },
  {
    warehouse: 'Kotagiri',
    revenue: '₹ 2,00,000',
    expenses: '₹ 1,20,000',
    netProfit: '₹ 80,000',
    margin: '40.2%',
    sale: '2,50,000',
    otherIncome: '25,000',
    cogs: '1,10,000',
    opExpenses: '55,000',
  },
];

/**
 * ProfitLossScreen (M13-S03 · Profit & Loss)
 * Exact design implementation matching Image 3 (Summary & By Warehouse tabs).
 */
export function ProfitLossScreen({
  onBack,
  onExport,
}: ProfitLossScreenProps): React.JSX.Element {
  const [activeSegment, setActiveSegment] = useState<'summary' | 'warehouse'>('summary');
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('All warehouses');
  const [showExportModal, setShowExportModal] = useState(false);

  const handleExport = () => {
    if (onExport) {
      onExport();
      return;
    }
    setShowExportModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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
            onPress={() => {
              Alert.alert('Filter Period', 'Select period:', [
                { text: 'This Month', onPress: () => setSelectedMonth('This Month') },
                { text: 'Last Month', onPress: () => setSelectedMonth('Last Month') },
                { text: 'This Quarter', onPress: () => setSelectedMonth('This Quarter') },
                { text: 'This Year', onPress: () => setSelectedMonth('This Year') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            <CalendarIcon size={16} color={adminColors.muted} />
            <Text style={styles.filterChipText}>{selectedMonth}</Text>
            <ChevronDownIcon size={14} color={adminColors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterChip}
            activeOpacity={0.7}
            onPress={() => {
              Alert.alert('Filter Warehouse', 'Select warehouse:', [
                { text: 'All warehouses', onPress: () => setSelectedWarehouseFilter('All warehouses') },
                { text: 'Ooty (Main)', onPress: () => setSelectedWarehouseFilter('Ooty') },
                { text: 'Coonoor', onPress: () => setSelectedWarehouseFilter('Coonoor') },
                { text: 'Kotagiri', onPress: () => setSelectedWarehouseFilter('Kotagiri') },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            <BuildingWarehouseIcon size={16} color={adminColors.muted} />
            <Text style={styles.filterChipText}>{selectedWarehouseFilter}</Text>
            <ChevronDownIcon size={14} color={adminColors.muted} />
          </TouchableOpacity>
        </View>

        {/* 6 Top KPI Cards */}
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            title="TOTAL REVENUE"
            value="₹1,84,500"
            titlePosition="top"
            preserveCase
          />
          <OverviewDashboardCard
            title="Cost of goods sold"
            value="₹7,60,000"
            titlePosition="top"
            preserveCase
          />
          <OverviewDashboardCard
            title="Gross Profit"
            value="₹5,25,000"
            titlePosition="top"
            preserveCase
          />
          <OverviewDashboardCard
            title="Operating Expenses"
            value="₹2,10,000"
            titlePosition="top"
            preserveCase
          />
          <OverviewDashboardCard
            title="Net Profit"
            value="₹3,15,000"
            titlePosition="top"
            preserveCase
          />
          <OverviewDashboardCard
            title="Profit Margin"
            value="24.5%"
            titlePosition="top"
            preserveCase
          />
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
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExport}
                activeOpacity={0.7}
              >
                <DownloadIcon size={14} color={adminColors.onBrand} />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tableCard}>
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Sales Revenue</Text>
                <Text style={styles.tableValue}>₹ 12,85,000</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Other Income</Text>
                <Text style={styles.tableValue}>₹ 25,000</Text>
              </View>
              <View style={styles.divider} />

              {/* Total Revenue Highlight Row */}
              <View style={[styles.tableRow, styles.highlightGreenRow]}>
                <Text style={[styles.tableLabel, styles.boldText]}>Total Revenue</Text>
                <Text style={[styles.tableValue, styles.boldText]}>₹ 12,85,000</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Cost of Goods Sold</Text>
                <Text style={[styles.tableValue, styles.negativeValue]}>(&#8377; 7,60,000)</Text>
              </View>
              <View style={styles.divider} />

              {/* Gross Profit Highlight Row */}
              <View style={[styles.tableRow, styles.highlightGreenRow]}>
                <Text style={[styles.tableLabel, styles.boldText]}>Gross Profit</Text>
                <Text style={[styles.tableValue, styles.boldText]}>₹ 5,50,000</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Operating Expenses</Text>
                <Text style={[styles.tableValue, styles.negativeValue]}>(&#8377; 2,10,000)</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Other Expenses</Text>
                <Text style={[styles.tableValue, styles.negativeValue]}>(&#8377; 25,000)</Text>
              </View>
              <View style={styles.divider} />

              {/* Net Profit Highlight Row */}
              <View style={[styles.tableRow, styles.highlightGreenRow]}>
                <Text style={[styles.tableLabel, styles.boldText]}>Net Profit</Text>
                <Text style={[styles.tableValue, styles.boldText]}>₹ 3,15,000</Text>
              </View>
            </View>

            {/* Period Comparison Card */}
            <Text style={[styles.sectionTitle, { marginTop: adminSpacing.md }]}>
              Period Comparison
            </Text>
            <View style={styles.comparisonCard}>
              <View style={styles.comparisonCol}>
                <Text style={styles.comparisonLabel}>This Month</Text>
                <Text style={styles.comparisonVal}>₹ 12,85,000</Text>
              </View>

              <View style={styles.vsBadge}>
                <Text style={styles.vsText}>VS</Text>
              </View>

              <View style={styles.comparisonCol}>
                <Text style={styles.comparisonLabel}>Previous Month</Text>
                <Text style={styles.comparisonVal}>₹ 2,48,000</Text>
              </View>

              <View style={styles.growthBadge}>
                <TrendChartIcon size={14} color={adminColors.success.text} />
                <Text style={styles.growthText}>+26.6%</Text>
                <Text style={styles.growthSub}>vs Previous period</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── TAB 2: Warehouse-wise Performance (Image 3 Right) ─── */}
        {activeSegment === 'warehouse' && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Warehouse-wise Performance</Text>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={handleExport}
                activeOpacity={0.7}
              >
                <DownloadIcon size={14} color={adminColors.onBrand} />
                <Text style={styles.exportBtnText}>Export</Text>
              </TouchableOpacity>
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

              {WAREHOUSE_DATA.map((item, idx) => (
                <View key={item.warehouse} style={styles.whRowContainer}>
                  <View style={styles.whDataRow}>
                    <Text style={[styles.whCellBold, { flex: 1.4 }]}>{item.warehouse}</Text>
                    <Text style={[styles.whCell, { flex: 1.3, textAlign: 'right' }]}>{item.revenue}</Text>
                    <Text style={[styles.whCell, { flex: 1.3, textAlign: 'right' }]}>{item.expenses}</Text>
                    <Text style={[styles.whCellGreen, { flex: 1.3, textAlign: 'right' }]}>{item.netProfit}</Text>
                    <Text style={[styles.whCellGreen, { flex: 1.1, textAlign: 'right' }]}>{item.margin}</Text>
                  </View>
                  <View style={styles.whSubGrid}>
                    <View style={styles.whSubCol}>
                      <Text style={styles.whSubText}>Sale: {item.sale}</Text>
                    </View>
                    <View style={styles.whSubDivider} />
                    <View style={styles.whSubCol}>
                      <Text style={styles.whSubText}>Other Income: {item.otherIncome}</Text>
                    </View>
                    <View style={styles.whSubDivider} />
                    <View style={styles.whSubCol}>
                      <Text style={styles.whSubText}>COGS: {item.cogs}</Text>
                    </View>
                    <View style={styles.whSubDivider} />
                    <View style={styles.whSubCol}>
                      <Text style={styles.whSubText}>Op. Expenses: {item.opExpenses}</Text>
                    </View>
                  </View>
                  {idx < WAREHOUSE_DATA.length - 1 && <View style={styles.whDivider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Export Success Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalCheckCircle}>
              <CheckmarkIcon size={24} color={adminColors.onBrand} />
            </View>
            <Text style={styles.modalTitle}>Report Exported</Text>
            <Text style={styles.modalBody}>
              Profit & Loss statement for {selectedMonth} has been exported in PDF and CSV formats.
            </Text>
            <TouchableOpacity
              style={styles.modalDismissBtn}
              onPress={() => setShowExportModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalDismissBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#E8F5E9',
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
    fontSize: 10,
    color: adminColors.muted,
    fontWeight: '700',
  },
  growthBadge: {
    backgroundColor: '#E8F5E9',
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
    fontSize: 9,
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
    backgroundColor: adminColors.brandTintWarm || adminColors.brandTint,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  whColHeader: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '700',
    fontSize: 11,
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
    fontSize: 11.5,
  },
  whCellBold: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    fontSize: 12,
  },
  whCellGreen: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
    fontSize: 11.5,
  },
  whSubContainer: {
    backgroundColor: adminColors.success.bg,
    borderWidth: 0.8,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    marginBottom: 4,
  },
  whSubGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 0.8,
    borderColor: '#C8E6C9',
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
    backgroundColor: '#A5D6A7',
  },
  whSubText: {
    fontSize: 9,
    color: '#2E7D32',
    fontWeight: '500',
    includeFontPadding: false,
    textAlign: 'center',
  },
  whDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginTop: adminSpacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
});

