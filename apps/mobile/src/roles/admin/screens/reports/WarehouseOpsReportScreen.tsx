import { adminColors, adminOverlay } from '../../theme';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';
import { useAdminQuery } from '../../api/hooks';
import { getWarehouseCapacity, listWarehouses } from '../../api/warehouses';
import { getTransferStatusCounts } from '../../api/dashboardFeeds';
import { getInventoryReport } from '../../api/reports';
import { t } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';

const PALETTE = {
  titleRust:     adminColors.brandDeep,
  orange:        adminColors.brand,
  orangeLight:   adminColors.brandTint,
  pageBg:        adminColors.canvas,
  cardBg:        adminColors.card,
  ink:           adminColors.ink,
  labelMuted:    adminColors.muted,
  border:        adminColors.border,
  chipBorder:    adminColors.border,
  warningBg:     adminColors.warning.bg,
  warningText:   adminColors.warning.text,
  warningIcon:   adminColors.warning.text,
  auditBadgeBg:  adminColors.info.bg,
  auditBadgeText:adminColors.info.text,
  btnBorder:     adminColors.border,
  sliderTrack:   adminColors.muted,
  successBg:     adminColors.success.bg,
  successText:   adminColors.success.text,
  dangerBg:      adminColors.danger.bg,
  dangerText:    adminColors.danger.text,
  greenBar:      adminColors.success.text,
  greenSuccess:  adminColors.success.text,
  orangePrimary: adminColors.brand,
  textHeading:   adminColors.brandDeep,
  textSecondary: adminColors.muted,
  textPrimary:   adminColors.ink,
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
  } | undefined;
}

export function WarehouseOpsReportScreen({ onBack }: WarehouseOpsReportScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const warehousesQuery = useAdminQuery(
    ['admin', 'warehouses', 'list'],
    (signal) => listWarehouses({}, signal),
  );

  const capacityQuery = useAdminQuery(
    ['admin', 'warehouses', selectedWarehouseId, 'capacity'],
    (signal) => getWarehouseCapacity(selectedWarehouseId, signal),
    { enabled: selectedWarehouseId !== 'all' },
  );

  const transfersCountQuery = useAdminQuery(
    ['admin', 'transfers', 'counts', selectedWarehouseId],
    (signal) => getTransferStatusCounts(selectedWarehouseId === 'all' ? undefined : selectedWarehouseId, signal),
  );

  const inventoryQuery = useAdminQuery(
    ['admin', 'reports', 'inventory', selectedWarehouseId],
    (signal) => getInventoryReport(selectedWarehouseId === 'all' ? {} : { warehouseId: selectedWarehouseId }, signal),
  );

  const dynamicWarehouseOptions = useMemo(() => {
    const items = warehousesQuery.data?.items ?? [];
    return [
      {
        id: 'all',
        name: 'All Warehouses',
        shortName: 'All Warehouses',
        capacity: ADMIN_NO_VALUE,
        hubs: items.length > 0 ? `${items.length} Warehouses` : ADMIN_NO_VALUE,
      },
      ...items.map((w) => ({
        id: w.id,
        name: w.name,
        shortName: w.code,
        capacity: w.capacityKg ? `${(Number(w.capacityKg) / 1000).toFixed(1)} MT` : ADMIN_NO_VALUE,
        hubs: w.code,
      })),
    ];
  }, [warehousesQuery.data?.items]);

  const warehouseOptions = dynamicWarehouseOptions;
  const selectedMeta =
    warehouseOptions.find((w) => w.id === selectedWarehouseId) ?? warehouseOptions[0]!;

  const pendingTransfersCount = transfersCountQuery.data
    ? String(transfersCountQuery.data.PENDING_APPROVAL + transfersCountQuery.data.IN_TRANSIT)
    : ADMIN_NO_VALUE;

  const inventoryBatchCount = inventoryQuery.data
    ? String(inventoryQuery.data.items.reduce((sum, item) => sum + item.batchCount, 0))
    : ADMIN_NO_VALUE;

  const liveCapacityDisplay = useMemo(() => {
    if (selectedWarehouseId !== 'all') {
      if (capacityQuery.data?.capacityKg) {
        return `${(Number(capacityQuery.data.capacityKg) / 1000).toFixed(1)} MT`;
      }
      return selectedMeta.capacity;
    }
    const items = warehousesQuery.data?.items ?? [];
    const withCap = items.filter((w) => w.capacityKg != null);
    if (withCap.length > 0 && warehousesQuery.data && items.length === warehousesQuery.data.total) {
      const totalKg = withCap.reduce((sum, w) => sum + Number(w.capacityKg), 0);
      return `${(totalKg / 1000).toFixed(1)} MT`;
    }
    return ADMIN_NO_VALUE;
  }, [selectedWarehouseId, capacityQuery.data?.capacityKg, selectedMeta.capacity, warehousesQuery.data]);

  const currentWarehouse: WarehouseData = {
    id: selectedMeta.id,
    name: selectedMeta.name,
    shortName: selectedMeta.shortName,
    capacity: liveCapacityDisplay,
    hubs: selectedMeta.hubs,
    stockTurnover: ADMIN_NO_VALUE,
    turnoverTrend: ADMIN_NO_VALUE,
    turnoverTrendType: 'up',
    receivingVolume: ADMIN_NO_VALUE,
    volumeTrend: ADMIN_NO_VALUE,
    volumeTrendType: 'up',
    rejectionRate: ADMIN_NO_VALUE,
    rejectionTrend: ADMIN_NO_VALUE,
    rejectionTrendType: 'down',
    pendingTransfers: pendingTransfersCount,
    transfersTrend: `Active batches: ${inventoryBatchCount}`,
    transfersTrendType: 'up',
    stockTurnoverData: [],
    comparisonRows: [],
    details: selectedWarehouseId !== 'all'
      ? {
          currentStock: capacityQuery.data
            ? `${capacityQuery.data.usedKg} kg (${
                capacityQuery.data.utilizationPercent !== null
                  ? `${capacityQuery.data.utilizationPercent}%`
                  : ADMIN_NO_VALUE
              })`
            : ADMIN_NO_VALUE,
          coldStorageTemp: ADMIN_NO_VALUE,
          lotsGraded: inventoryQuery.data ? `${inventoryQuery.data.items.length} Crops / ${inventoryBatchCount} Batches` : ADMIN_NO_VALUE,
          dispatchTurnaround: ADMIN_NO_VALUE,
        }
      : undefined,
  };

  const screenError = warehousesQuery.error ?? transfersCountQuery.error ?? inventoryQuery.error ?? capacityQuery.error;
  const isInitialLoading =
    warehousesQuery.isPending || transfersCountQuery.isPending || inventoryQuery.isPending;

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

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
                stroke={adminColors.ink}
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
        <OverviewCardsGrid style={{ marginBottom: 16 }}>
          <OverviewDashboardCard
            value={currentWarehouse.stockTurnover}
            title="Stock Turnover"
            subtitle={currentWarehouse.turnoverTrend}
            icon="inventory"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={currentWarehouse.receivingVolume}
            title="Receiving Volume"
            subtitle={currentWarehouse.volumeTrend}
            icon="receiving"
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={currentWarehouse.rejectionRate}
            title="Rejection Rate"
            subtitle={currentWarehouse.rejectionTrend}
            icon="alert"
            tone={currentWarehouse.rejectionTrendType === 'down' ? 'success' : 'danger'}
            titlePosition="bottom"
          />
          <OverviewDashboardCard
            value={currentWarehouse.pendingTransfers}
            title="Pending Transfers"
            subtitle={currentWarehouse.transfersTrend}
            icon="truck"
            tone={currentWarehouse.transfersTrendType === 'down' ? 'default' : 'warning'}
            titlePosition="bottom"
          />
        </OverviewCardsGrid>

        {/* Chart: Stock Turnover (Last 6 Months) */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Stock Turnover (Last 6 Months)</Text>
            <View style={styles.chartScopePill}>
              <Text style={styles.chartScopePillText}>{currentWarehouse.shortName}</Text>
            </View>
          </View>
          {currentWarehouse.stockTurnoverData.length === 0 ? (
            <AdminEmptyState
              title={t('wiringReports.common.noData')}
              subtitle="Historical turnover series has no endpoint."
            />
          ) : (
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
          )}
        </View>

        {isInitialLoading && <AdminLoadingState />}
        {screenError && (
          <AdminErrorState
            error={screenError}
            onRetry={() => {
              void warehousesQuery.refetch();
              void transfersCountQuery.refetch();
              void inventoryQuery.refetch();
            }}
          />
        )}

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
          {currentWarehouse.comparisonRows.length === 0 ? (
            <AdminEmptyState
              title={t('wiringReports.common.noData')}
              subtitle="Per-warehouse turnover and rejection comparison has no endpoint."
            />
          ) : (
            <>
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
            </>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={showExportModal} transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Export Warehouse Operations</Text>
            <Text style={styles.modalSub}>
              {t('wiringReports.reports.exportUnavailable')}
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, { opacity: 0.45 }]}
              disabled
              accessibilityState={{ disabled: true }}
            >
              <Text style={styles.modalBtnText}>Download PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { marginTop: 10 }]}
              onPress={() => setShowExportModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Close</Text>
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
    shadowColor: adminColors.shadow,
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
    color: adminColors.onBrand,
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
    shadowColor: adminColors.shadow,
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
    backgroundColor: adminColors.canvas,
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
    backgroundColor: adminColors.canvas,
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
    shadowColor: adminColors.shadow,
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
    shadowColor: adminColors.shadow,
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
    backgroundColor: adminColors.canvas,
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
    shadowColor: adminColors.shadow,
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
    backgroundColor: adminColors.canvas,
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
    shadowColor: adminColors.shadow,
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
    borderBottomColor: adminColors.border,
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
    borderBottomColor: adminColors.border,
  },
  tableRowHighlighted: {
    backgroundColor: adminColors.brandTint,
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
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: adminColors.card,
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
    color: adminColors.onBrand,
    fontSize: 14,
    fontWeight: '700',
  },
  dropdownBoxOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: adminColors.border,
    marginBottom: 0,
  },
  inlineDropdownMenu: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: PALETTE.border,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 12,
    shadowColor: adminColors.shadow,
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
    borderBottomColor: adminColors.border,
  },
  inlineDropdownItemActive: {
    backgroundColor: adminColors.brandTint,
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
