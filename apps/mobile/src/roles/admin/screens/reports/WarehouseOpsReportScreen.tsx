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
import Svg, { Path } from 'react-native-svg';

const PALETTE = {
  pageBg: '#FAF8F5',
  cardBg: '#FFFFFF',
  textHeading: '#6B230B',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#F0ECE6',
  orangePrimary: '#E85226',
  orangeLight: '#FFF1EB',
  greenSuccess: '#16A34A',
  greenBar: '#2E7D32',
};

export interface WarehouseOpsReportScreenProps {
  onBack: () => void;
}

interface WarehouseData {
  id: string;
  name: string;
  shortName: string;
  capacity: string;
  hubs: string;
  stockTurnover: string;
  turnoverTrend: string;
  turnoverTrendType: 'up' | 'down';
  receivingVolume: string;
  volumeTrend: string;
  volumeTrendType: 'up' | 'down';
  rejectionRate: string;
  rejectionTrend: string;
  rejectionTrendType: 'up' | 'down';
  pendingTransfers: string;
  transfersTrend: string;
  transfersTrendType: 'up' | 'down';
  stockTurnoverData: { label: string; value: number }[];
  comparisonRows: {
    name: string;
    stock: number;
    turnover: number;
    rejection: string;
    isHighlighted?: boolean;
  }[];
  details?: {
    currentStock: string;
    coldStorageTemp: string;
    lotsGraded: string;
    dispatchTurnaround: string;
  };
}

const WAREHOUSES_DATA: Record<string, WarehouseData> = {
  all: {
    id: 'all',
    name: 'All Warehouses',
    shortName: 'Network Aggregate',
    capacity: '225 MT',
    hubs: 'All 4 Regional Hubs',
    stockTurnover: '4.2',
    turnoverTrend: '↑ 12%',
    turnoverTrendType: 'up',
    receivingVolume: '280 MT',
    volumeTrend: '↑ 8%',
    volumeTrendType: 'up',
    rejectionRate: '2.1%',
    rejectionTrend: '↓ 3%',
    rejectionTrendType: 'down',
    pendingTransfers: '12',
    transfersTrend: '↓ 5%',
    transfersTrendType: 'down',
    stockTurnoverData: [
      { label: 'Apr', value: 48 },
      { label: 'May', value: 55 },
      { label: 'Jun', value: 68 },
      { label: 'Jul', value: 64 },
      { label: 'Aug', value: 78 },
      { label: 'Sep', value: 84 },
    ],
    comparisonRows: [
      { name: 'Ooty', stock: 420, turnover: 4.8, rejection: '1.8%' },
      { name: 'Coonoor', stock: 380, turnover: 4.2, rejection: '2.3%' },
      { name: 'Kotagiri', stock: 290, turnover: 3.9, rejection: '2.8%' },
      { name: 'Gudalur', stock: 260, turnover: 3.5, rejection: '3.1%' },
    ],
  },
  ooty: {
    id: 'ooty',
    name: 'Ooty Sub-Zero Cold Storage Facility',
    shortName: 'Ooty Hub',
    capacity: '60 MT',
    hubs: 'Hub WH-OTY-02',
    stockTurnover: '4.8',
    turnoverTrend: '↑ 18%',
    turnoverTrendType: 'up',
    receivingVolume: '78 MT',
    volumeTrend: '↑ 6%',
    volumeTrendType: 'up',
    rejectionRate: '1.8%',
    rejectionTrend: '↓ 4.5%',
    rejectionTrendType: 'down',
    pendingTransfers: '3',
    transfersTrend: '↓ 8%',
    transfersTrendType: 'down',
    stockTurnoverData: [
      { label: 'Apr', value: 52 },
      { label: 'May', value: 60 },
      { label: 'Jun', value: 74 },
      { label: 'Jul', value: 70 },
      { label: 'Aug', value: 86 },
      { label: 'Sep', value: 92 },
    ],
    comparisonRows: [
      { name: 'Ooty', stock: 420, turnover: 4.8, rejection: '1.8%', isHighlighted: true },
      { name: 'Coonoor', stock: 380, turnover: 4.2, rejection: '2.3%' },
      { name: 'Kotagiri', stock: 290, turnover: 3.9, rejection: '2.8%' },
      { name: 'Gudalur', stock: 260, turnover: 3.5, rejection: '3.1%' },
    ],
    details: {
      currentStock: '52 MT (86.6% capacity)',
      coldStorageTemp: '-2°C to 4°C (Optimal)',
      lotsGraded: '310 Lots (76% Grade A)',
      dispatchTurnaround: '1.8 Hours',
    },
  },
  coonoor: {
    id: 'coonoor',
    name: 'Coonoor Transit & Dry Storage Depot',
    shortName: 'Coonoor Depot',
    capacity: '40 MT',
    hubs: 'Hub WH-CNR-03',
    stockTurnover: '4.2',
    turnoverTrend: '↑ 10%',
    turnoverTrendType: 'up',
    receivingVolume: '52 MT',
    volumeTrend: '↑ 4%',
    volumeTrendType: 'up',
    rejectionRate: '2.3%',
    rejectionTrend: '↓ 2.1%',
    rejectionTrendType: 'down',
    pendingTransfers: '4',
    transfersTrend: '↓ 4%',
    transfersTrendType: 'down',
    stockTurnoverData: [
      { label: 'Apr', value: 44 },
      { label: 'May', value: 50 },
      { label: 'Jun', value: 62 },
      { label: 'Jul', value: 58 },
      { label: 'Aug', value: 72 },
      { label: 'Sep', value: 78 },
    ],
    comparisonRows: [
      { name: 'Ooty', stock: 420, turnover: 4.8, rejection: '1.8%' },
      { name: 'Coonoor', stock: 380, turnover: 4.2, rejection: '2.3%', isHighlighted: true },
      { name: 'Kotagiri', stock: 290, turnover: 3.9, rejection: '2.8%' },
      { name: 'Gudalur', stock: 260, turnover: 3.5, rejection: '3.1%' },
    ],
    details: {
      currentStock: '34 MT (85.0% capacity)',
      coldStorageTemp: 'Ambient Dry (Ventilated)',
      lotsGraded: '195 Lots (70% Grade A)',
      dispatchTurnaround: '2.1 Hours',
    },
  },
  kotagiri: {
    id: 'kotagiri',
    name: 'Kotagiri Central Grading & Aggregation',
    shortName: 'Kotagiri Hub',
    capacity: '85 MT',
    hubs: 'Hub WH-KTG-01',
    stockTurnover: '3.9',
    turnoverTrend: '↑ 7%',
    turnoverTrendType: 'up',
    receivingVolume: '110 MT',
    volumeTrend: '↑ 14%',
    volumeTrendType: 'up',
    rejectionRate: '2.8%',
    rejectionTrend: '↑ 1.2%',
    rejectionTrendType: 'up',
    pendingTransfers: '5',
    transfersTrend: '↓ 2%',
    transfersTrendType: 'down',
    stockTurnoverData: [
      { label: 'Apr', value: 38 },
      { label: 'May', value: 42 },
      { label: 'Jun', value: 58 },
      { label: 'Jul', value: 52 },
      { label: 'Aug', value: 66 },
      { label: 'Sep', value: 72 },
    ],
    comparisonRows: [
      { name: 'Ooty', stock: 420, turnover: 4.8, rejection: '1.8%' },
      { name: 'Coonoor', stock: 380, turnover: 4.2, rejection: '2.3%' },
      { name: 'Kotagiri', stock: 290, turnover: 3.9, rejection: '2.8%', isHighlighted: true },
      { name: 'Gudalur', stock: 260, turnover: 3.5, rejection: '3.1%' },
    ],
    details: {
      currentStock: '74 MT (87.0% capacity)',
      coldStorageTemp: '2°C to 6°C Pre-Cooling',
      lotsGraded: '420 Lots (68% Grade A)',
      dispatchTurnaround: '2.4 Hours',
    },
  },
  gudalur: {
    id: 'gudalur',
    name: 'Gudalur Market Aggregation Center',
    shortName: 'Gudalur Market',
    capacity: '40 MT',
    hubs: 'Hub WH-GDL-04',
    stockTurnover: '3.5',
    turnoverTrend: '↑ 5%',
    turnoverTrendType: 'up',
    receivingVolume: '40 MT',
    volumeTrend: '↑ 9%',
    volumeTrendType: 'up',
    rejectionRate: '3.1%',
    rejectionTrend: '↓ 1.0%',
    rejectionTrendType: 'down',
    pendingTransfers: '2',
    transfersTrend: '↓ 6%',
    transfersTrendType: 'down',
    stockTurnoverData: [
      { label: 'Apr', value: 32 },
      { label: 'May', value: 38 },
      { label: 'Jun', value: 48 },
      { label: 'Jul', value: 44 },
      { label: 'Aug', value: 56 },
      { label: 'Sep', value: 64 },
    ],
    comparisonRows: [
      { name: 'Ooty', stock: 420, turnover: 4.8, rejection: '1.8%' },
      { name: 'Coonoor', stock: 380, turnover: 4.2, rejection: '2.3%' },
      { name: 'Kotagiri', stock: 290, turnover: 3.9, rejection: '2.8%' },
      { name: 'Gudalur', stock: 260, turnover: 3.5, rejection: '3.1%', isHighlighted: true },
    ],
    details: {
      currentStock: '28 MT (70.0% capacity)',
      coldStorageTemp: 'Fresh Mandi Ambient',
      lotsGraded: '160 Lots (64% Grade A)',
      dispatchTurnaround: '2.9 Hours',
    },
  },
};

export function WarehouseOpsReportScreen({ onBack }: WarehouseOpsReportScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const currentWarehouse: WarehouseData =
    WAREHOUSES_DATA[selectedWarehouseId] ?? WAREHOUSES_DATA['all']!;

  const warehouseOptions = [
    { id: 'all', name: 'All Warehouses', capacity: '225 MT', hubs: 'All 4 Regional Hubs' },
    { id: 'ooty', name: 'Ooty Sub-Zero Cold Storage Facility', capacity: '60 MT', hubs: 'Hub WH-OTY-02' },
    { id: 'coonoor', name: 'Coonoor Transit & Dry Storage Depot', capacity: '40 MT', hubs: 'Hub WH-CNR-03' },
    { id: 'kotagiri', name: 'Kotagiri Central Grading & Aggregation', capacity: '85 MT', hubs: 'Hub WH-KTG-01' },
    { id: 'gudalur', name: 'Gudalur Market Aggregation Center', capacity: '40 MT', hubs: 'Hub WH-GDL-04' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 19L8 12L15 5"
                stroke="#2B2523"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportHeaderBtn}
            onPress={() => setShowExportModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.exportHeaderBtnText}>⬆ Export</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.headerBlock}>
          <Text style={styles.pageTitle}>Warehouse Operations</Text>
          <Text style={styles.pageSubtitle}>Warehouse stock & movement summary</Text>
        </View>

        {/* Dropdown Scope Selector - Directly controls the content */}
        <TouchableOpacity
          style={[styles.dropdownBox, showWarehouseDropdown && styles.dropdownBoxOpen]}
          onPress={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownLeftCol}>
            <Text style={styles.dropdownLabel}>Selected Facility</Text>
            <Text style={styles.dropdownText} numberOfLines={1}>
              {currentWarehouse.name}
            </Text>
          </View>
          <View style={styles.dropdownArrowWrap}>
            <Text style={styles.dropdownArrow}>{showWarehouseDropdown ? '▴' : '▾'}</Text>
          </View>
        </TouchableOpacity>

        {/* Inline Facility Dropdown (under input box with top heading only, no description) */}
        {showWarehouseDropdown && (
          <View style={styles.inlineDropdownMenu}>
            {warehouseOptions.map((item, index) => {
              const isSelected = selectedWarehouseId === item.id;
              const isLast = index === warehouseOptions.length - 1;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.inlineDropdownItem,
                    isSelected && styles.inlineDropdownItemActive,
                    isLast && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => {
                    setSelectedWarehouseId(item.id);
                    setShowWarehouseDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.inlineDropdownText,
                      isSelected && styles.inlineDropdownTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {isSelected && <Text style={styles.inlineDropdownCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Facility Meta Banner */}
        <View style={styles.scopeInfoRow}>
          <View style={styles.scopeBadge}>
            <Text style={styles.scopeBadgeText}>{currentWarehouse.hubs}</Text>
          </View>
          <Text style={styles.scopeInfoText}>Total Capacity: {currentWarehouse.capacity}</Text>
        </View>

        {/* 4 Metric Cards dynamically matching selected warehouse */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Stock Turnover</Text>
            <Text style={styles.kpiNumber}>{currentWarehouse.stockTurnover}</Text>
            <Text
              style={[
                styles.kpiTrend,
                currentWarehouse.turnoverTrendType === 'up' ? styles.trendUp : styles.trendDown,
              ]}
            >
              {currentWarehouse.turnoverTrend}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Receiving Volume</Text>
            <Text style={styles.kpiNumber}>{currentWarehouse.receivingVolume}</Text>
            <Text
              style={[
                styles.kpiTrend,
                currentWarehouse.volumeTrendType === 'up' ? styles.trendUp : styles.trendDown,
              ]}
            >
              {currentWarehouse.volumeTrend}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Rejection Rate</Text>
            <Text style={styles.kpiNumber}>{currentWarehouse.rejectionRate}</Text>
            <Text
              style={[
                styles.kpiTrend,
                currentWarehouse.rejectionTrendType === 'down' ? styles.trendUp : styles.trendDownAlert,
              ]}
            >
              {currentWarehouse.rejectionTrend}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Pending Transfers</Text>
            <Text style={styles.kpiNumber}>{currentWarehouse.pendingTransfers}</Text>
            <Text
              style={[
                styles.kpiTrend,
                currentWarehouse.transfersTrendType === 'down' ? styles.trendUp : styles.trendDownAlert,
              ]}
            >
              {currentWarehouse.transfersTrend}
            </Text>
          </View>
        </View>

        {/* Chart: Stock Turnover (Last 6 Months) */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Stock Turnover (Last 6 Months)</Text>
            <View style={styles.chartScopePill}>
              <Text style={styles.chartScopePillText}>{currentWarehouse.shortName}</Text>
            </View>
          </View>
          <View style={styles.barChartContainer}>
            {currentWarehouse.stockTurnoverData.map((d, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: d.value, backgroundColor: PALETTE.greenBar }]} />
                </View>
                <Text style={styles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Detailed Facility Breakdown when a specific warehouse is selected */}
        {currentWarehouse.details && (
          <View style={styles.facilityCard}>
            <Text style={styles.facilityTitle}>{currentWarehouse.shortName} Live Hub Telemetry</Text>
            <View style={styles.facilityGrid}>
              <View style={styles.facilityMetric}>
                <Text style={styles.facilityMetricLabel}>Current Stock</Text>
                <Text style={styles.facilityMetricVal}>{currentWarehouse.details.currentStock}</Text>
              </View>
              <View style={styles.facilityMetric}>
                <Text style={styles.facilityMetricLabel}>Storage Condition</Text>
                <Text style={styles.facilityMetricVal}>{currentWarehouse.details.coldStorageTemp}</Text>
              </View>
              <View style={styles.facilityMetric}>
                <Text style={styles.facilityMetricLabel}>Graded Lots</Text>
                <Text style={styles.facilityMetricVal}>{currentWarehouse.details.lotsGraded}</Text>
              </View>
              <View style={styles.facilityMetric}>
                <Text style={styles.facilityMetricLabel}>Dispatch Turnaround</Text>
                <Text style={styles.facilityMetricVal}>{currentWarehouse.details.dispatchTurnaround}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Table: Warehouse Comparison */}
        <View style={styles.tableCard}>
          <Text style={styles.tableTitle}>Warehouse Comparison</Text>

          <View style={styles.columnHeaderRow}>
            <Text style={[styles.colLabel, { flex: 2 }]}>Warehouse</Text>
            <Text style={[styles.colLabel, { flex: 1.5, textAlign: 'center' }]}>Stock (MT)</Text>
            <Text style={[styles.colLabel, { flex: 1.2, textAlign: 'center' }]}>Turnover</Text>
            <Text style={[styles.colLabel, { flex: 1.2, textAlign: 'right' }]}>Rejection</Text>
          </View>

          {currentWarehouse.comparisonRows.map((r, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                r.isHighlighted && styles.tableRowHighlighted,
              ]}
            >
              <Text style={[styles.cellTextBold, { flex: 2 }, r.isHighlighted && styles.cellTextHighlight]}>
                {r.name}
              </Text>
              <Text style={[styles.cellTextNormal, { flex: 1.5, textAlign: 'center' }]}>{r.stock}</Text>
              <Text style={[styles.cellTextNormal, { flex: 1.2, textAlign: 'center' }]}>{r.turnover}</Text>
              <Text style={[styles.cellTextRejection, { flex: 1.2, textAlign: 'right' }]}>{r.rejection}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Export Warehouse Operations</Text>
            <Text style={styles.modalSub}>
              Download complete turnover, capacity, and receiving logs for {currentWarehouse.name}.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => {
                setShowExportModal(false);
                Alert.alert('Downloaded', 'Warehouse_Operations_Report.pdf saved to files.');
              }}
            >
              <Text style={styles.modalBtnText}>Download PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 80,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  exportHeaderBtn: {
    backgroundColor: PALETTE.orangePrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  exportHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerBlock: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.textHeading,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: PALETTE.textSecondary,
  },
  dropdownBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownLeftCol: {
    flex: 1,
    marginRight: 10,
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.orangePrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  dropdownText: {
    fontSize: 14,
    color: PALETTE.textPrimary,
    fontWeight: '700',
  },
  dropdownArrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownArrow: {
    fontSize: 14,
    color: PALETTE.textHeading,
    fontWeight: '700',
  },
  scopeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  scopeBadge: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scopeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textHeading,
  },
  scopeInfoText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    marginBottom: 2,
  },
  kpiTrend: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  trendUp: {
    color: PALETTE.greenSuccess,
  },
  trendDown: {
    color: PALETTE.greenSuccess,
  },
  trendDownAlert: {
    color: PALETTE.orangePrimary,
  },
  chartCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  chartScopePill: {
    backgroundColor: '#FAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chartScopePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    width: '75%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  facilityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  facilityTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textHeading,
    marginBottom: 12,
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  facilityMetric: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FAF8F5',
    padding: 10,
    borderRadius: 10,
  },
  facilityMetricLabel: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginBottom: 2,
  },
  facilityMetricVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  tableCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tableTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textHeading,
    marginBottom: 14,
  },
  columnHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0E8',
    marginBottom: 8,
  },
  colLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F5',
  },
  tableRowHighlighted: {
    backgroundColor: '#FFF7F3',
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  cellTextBold: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  cellTextHighlight: {
    color: PALETTE.orangePrimary,
  },
  cellTextNormal: {
    fontSize: 13,
    color: PALETTE.textPrimary,
  },
  cellTextRejection: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.orangePrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textPrimary,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalBtn: {
    backgroundColor: PALETTE.orangePrimary,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownBoxOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: '#F0EBE1',
    marginBottom: 0,
  },
  inlineDropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: PALETTE.border,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  inlineDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF6F0',
  },
  inlineDropdownItemActive: {
    backgroundColor: '#FFF8F4',
  },
  inlineDropdownText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  inlineDropdownTextActive: {
    color: PALETTE.orangePrimary,
    fontWeight: '700',
  },
  inlineDropdownCheckmark: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.orangePrimary,
  },
});
