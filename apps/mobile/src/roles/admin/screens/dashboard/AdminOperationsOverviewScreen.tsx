import React, { useMemo, useState } from 'react';
import {
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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  ADMIN_BUTTON_HEIGHT,
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

export interface AdminOperationsOverviewScreenProps {
  initialViewMode?: 'overview' | 'warehouses';
  onBack?: () => void;
  onExportReports?: () => void;
  onNavigateToFarmers?: () => void;
  onNavigateToApplications?: () => void;
  onNavigateToProduce?: () => void;
  onNavigateToStockLedger?: () => void;
  onNavigateToStockVerification?: () => void;
  onNavigateToTransfers?: () => void;
  onNotifications?: () => void;
  onPlusAction?: () => void;
  onSelectWarehouse?: (warehouseId: string) => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersWhiteIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ClockOrangeIcon({ size = 16, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarehouseHeaderIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 21V13.5h7V21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="9.8" y="17" width="2" height="2" rx="0.3" fill={color} />
      <Rect x="12.2" y="17" width="2" height="2" rx="0.3" fill={color} />
      <Rect x="11" y="14.5" width="2" height="2" rx="0.3" fill={color} />
    </Svg>
  );
}

function PlusHeaderIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function BellHeaderIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15V10a6 6 0 0 0-12 0v5l-2 3h16l-2-3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 18v1a2 2 0 0 0 4 0v-1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchGrayIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth="2" />
      <Line x1="16" y1="16" x2="21" y2="21" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersOrangeIcon({ size = 18, color = '#D97736' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="6.5" x2="21" y2="6.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="15" y1="4" x2="15" y2="9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="8" y1="9.5" x2="8" y2="14.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3" y1="17.5" x2="21" y2="17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="16" y1="15" x2="16" y2="20" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function StockLedgerBoxIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4.5" width="16" height="4.5" rx="1.2" stroke={color} strokeWidth="2" fill="none" />
      <Rect x="5" y="9" width="14" height="11" rx="1.2" stroke={color} strokeWidth="2" fill="none" />
      <Line x1="10" y1="13" x2="14" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockVerificationCheckIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="4" width="17" height="15.5" rx="2.5" stroke={color} strokeWidth="1.8" fill="none" />
      <Line x1="6.5" y1="9" x2="10" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="6.5" y1="13.5" x2="10" y2="13.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path
        d="M13 11.5L15 13.5L18.8 9.2"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InterWarehouseArrowsIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="7" y1="8.5" x2="17" y2="8.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M13.5 5.2L17 8.5L13.5 11.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="17" y1="15.5" x2="7" y2="15.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M10.5 12.2L7 15.5L10.5 18.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminOperationsOverviewScreen({
  initialViewMode = 'warehouses',
  onBack,
  onExportReports,
  onNavigateToFarmers,
  onNavigateToApplications,
  onNavigateToProduce,
  onNavigateToStockLedger,
  onNavigateToStockVerification,
  onNavigateToTransfers,
  onNotifications,
  onPlusAction,
  onSelectWarehouse,
}: AdminOperationsOverviewScreenProps) {
  const [viewMode, setViewMode] = useState<'overview' | 'warehouses'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('All Warehouses');

  // Warehouse items fixture in state for interactive actions
  const [warehouseList, setWarehouseList] = useState([
    {
      id: 'wh-ooty',
      title: 'Ooty (WH-MAIN)',
      status: 'Active' as 'Active' | 'Pending',
      failedLoad: false,
      line1: 'Capacity/utilization: 50,000 kg · 42% · Products 5 · Batches 4',
      line2: 'Available 1,980 kg · Pending receipts 1 · Transfers 1',
      line3: 'Open discrepancies 0 · Updated 13 Oct 2026, 09:00',
    },
    {
      id: 'wh-coonoor',
      title: 'Coonoor (WH-SUB1)',
      status: 'Active' as 'Active' | 'Pending',
      failedLoad: false,
      line1: 'Capacity/utilization: 40,000 kg · 38% · Products 4 · Batches 3',
      line2: 'Available 1,520 kg · Pending receipts 1 · Transfers 0',
      line3: 'Open discrepancies 1 · Updated 13 Oct 2026, 09:00',
    },
    {
      id: 'wh-kotagiri',
      title: 'Kotagiri (WH-SUB2)',
      status: 'Pending' as 'Active' | 'Pending',
      failedLoad: true,
      line1: 'Capacity/utilization: failed to load',
      line2: 'Products 0 · Batches 0 · Available 0 kg',
      line3: 'Pending receipts 0 · Transfers 0 · Open discrepancies 0',
    },
    {
      id: 'wh-sholur',
      title: 'Sholur Market (WH-SUB3)',
      status: 'Active' as 'Active' | 'Pending',
      failedLoad: false,
      line1: 'Capacity/utilization: 20,000 kg · 28% · Products 3 · Batches 2',
      line2: 'Available 650 kg · Pending receipts 0 · Transfers 2',
      line3: 'Open discrepancies 0 · Updated 13 Oct 2026, 09:00',
    },
  ]);

  const handleActivateKotagiri = () => {
    setWarehouseList((prev) =>
      prev.map((w) =>
        w.id === 'wh-kotagiri'
          ? {
              ...w,
              status: 'Active' as const,
              failedLoad: false,
              line1: 'Capacity/utilization: 35,000 kg · 30% · Products 3 · Batches 2',
              line2: 'Available 1,100 kg · Pending receipts 0 · Transfers 0',
              line3: 'Open discrepancies 0 · Updated Just now',
            }
          : w
      )
    );
    Alert.alert(
      'Warehouse Activated',
      'Kotagiri (WH-SUB2) has been activated successfully and is now operational.'
    );
  };

  const handleExport = () => {
    if (onExportReports) {
      onExportReports();
    } else {
      Alert.alert(
        'Export Reports',
        'Operational overview reports exported successfully in PDF and Excel formats.'
      );
    }
  };

  const filteredWarehouses = useMemo(() => {
    let list = warehouseList;
    if (selectedWarehouseFilter !== 'All Warehouses') {
      list = list.filter((w) => w.title === selectedWarehouseFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (w) =>
        w.title.toLowerCase().includes(q) ||
        w.line1.toLowerCase().includes(q) ||
        w.line2.toLowerCase().includes(q)
    );
  }, [searchQuery, warehouseList, selectedWarehouseFilter]);

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 1: OPERATIONS OVERVIEW (M1-S04, exact match to Image 1 Left)
  // ══════════════════════════════════════════════════════════════════════════
  if (viewMode === 'overview') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header Banner matching Image 1 Left */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={onBack}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Back to Home"
            >
              <BackArrowWhiteIcon />
              <Text style={styles.headerTitle}>Operations Overview</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerFilterBtn}
              onPress={() => setShowFilterModal(true)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Filter operations"
            >
              <FilterSlidersWhiteIcon />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Section A: Farmers and compliance ── */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>A · Farmers and compliance</Text>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                onPress={onNavigateToFarmers}
                activeOpacity={0.7}
              >
                <Text style={styles.rowLabel}>Total farmers</Text>
                <Text style={styles.rowValue}>24</Text>
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                onPress={onNavigateToFarmers}
                activeOpacity={0.7}
              >
                <Text style={styles.rowLabel}>Active / inactive / terminated</Text>
                <Text style={styles.rowValue}>20 / 2 / 2</Text>
              </TouchableOpacity>
              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.row}
                onPress={onNavigateToApplications}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowLabel, { color: adminColors.brand, fontWeight: '600' }]}>
                  Applications awaiting decision
                </Text>
                <Text style={[styles.rowValue, { color: adminColors.brand }]}>4 →</Text>
              </TouchableOpacity>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>KYC verified / review required</Text>
                <Text style={styles.rowValue}>22 / 2</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Audits upcoming / overdue</Text>
                <Text style={styles.rowValue}>2 / 1</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Certification expired / expiring soon</Text>
                <Text style={styles.rowValue}>1 / 3</Text>
              </View>
            </View>
          </View>

          {/* ── Section B: Produce and crop operations ── */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>B · Produce and crop operations</Text>

            {/* Listings Card */}
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                onPress={onNavigateToProduce}
                activeOpacity={0.7}
              >
                <Text style={styles.rowLabel}>Listings (all statuses)</Text>
                <Text style={styles.rowValue}>10</Text>
              </TouchableOpacity>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Pending Review</Text>
                <Text style={styles.rowValue}>5</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Approved</Text>
                <Text style={styles.rowValue}>4</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Rejected</Text>
                <Text style={styles.rowValue}>1</Text>
              </View>
            </View>

            {/* By Crop */}
            <Text style={styles.subHeading}>By crop</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Beans</Text>
                <Text style={styles.rowValue}>2</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Cabbage</Text>
                <Text style={styles.rowValue}>2</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Carrot</Text>
                <Text style={styles.rowValue}>2</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Garlic</Text>
                <Text style={styles.rowValue}>1</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Potato</Text>
                <Text style={styles.rowValue}>1</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Tomato</Text>
                <Text style={styles.rowValue}>2</Text>
              </View>
            </View>

            {/* By Zone */}
            <Text style={styles.subHeading}>By zone</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Coonoor</Text>
                <Text style={styles.rowValue}>4</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Gudalur</Text>
                <Text style={styles.rowValue}>1</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Kotagiri</Text>
                <Text style={styles.rowValue}>2</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Ooty</Text>
                <Text style={styles.rowValue}>3</Text>
              </View>
            </View>

            <Text style={styles.subNote}>
              Filters applied here: Zone, Farmer, Crop. Listings are current, so the date range does not apply.
            </Text>
          </View>

          {/* ── Section C: Purchase and receiving ── */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>C · Purchase and receiving</Text>

            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Purchase orders in the selection</Text>
                <Text style={styles.rowValue}>3</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Awaiting Processing</Text>
                <Text style={styles.rowValue}>1</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Awaiting Receipt</Text>
                <Text style={styles.rowValue}>1</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Received</Text>
                <Text style={styles.rowValue}>0</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Quality Approved</Text>
                <Text style={styles.rowValue}>1</Text>
              </View>
            </View>
          </View>

          {/* ── Section D: Warehouse overview ── */}
          <View style={styles.sectionContainer}>
            <View style={styles.warehouseSectionTitleRow}>
              <Text style={styles.sectionHeading}>D · Warehouse overview</Text>
              <TouchableOpacity
                onPress={() => setViewMode('warehouses')}
                activeOpacity={0.7}
                style={styles.manageWarehousesBtn}
              >
                <Text style={styles.manageWarehousesBtnText}>Manage Warehouses →</Text>
              </TouchableOpacity>
            </View>

            {/* Ooty */}
            <TouchableOpacity
              style={styles.card}
              onPress={() => setViewMode('warehouses')}
              activeOpacity={0.8}
            >
              <View style={styles.warehouseTopRow}>
                <Text style={styles.warehouseTitle}>Ooty (WH-MAIN)</Text>
                <View style={styles.badgeActive}>
                  <Text style={styles.badgeActiveText}>Active</Text>
                </View>
              </View>

              <View style={styles.warehouseStatsGrid}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Available stock</Text>
                  <Text style={styles.statValue}>1,980 KG</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Incoming goods</Text>
                  <Text style={styles.statValue}>1</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Coonoor */}
            <TouchableOpacity
              style={[styles.card, { marginTop: adminSpacing.sm }]}
              onPress={() => setViewMode('warehouses')}
              activeOpacity={0.8}
            >
              <View style={styles.warehouseTopRow}>
                <Text style={styles.warehouseTitle}>Coonoor (WH-SUB1)</Text>
                <View style={styles.badgeActive}>
                  <Text style={styles.badgeActiveText}>Active</Text>
                </View>
              </View>

              <View style={styles.warehouseStatsGrid}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Available stock</Text>
                  <Text style={styles.statValue}>1,520 KG</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Incoming goods</Text>
                  <Text style={styles.statValue}>1</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Section E: Recent administrative activity ── */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>E · Recent administrative activity</Text>

            {[
              {
                id: '1',
                title: 'Quality check completed',
                meta: 'Ooty · Lot PO-2026-00307',
                actor: 'Ramesh K. · Approved',
              },
              {
                id: '2',
                title: 'Audit completed',
                meta: 'AUD-2026-0056 · 8 Oct 2026',
                actor: 'Auditor · Completed',
              },
              {
                id: '3',
                title: 'Farmer application reviewed',
                meta: 'APP-2026-0101 · 5 Oct 2026',
                actor: 'Priya Nair · Pending',
              },
            ].map((item) => (
              <View key={item.id} style={styles.activityItemRow}>
                <ClockOrangeIcon />
                <View style={styles.activityContentCol}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityMeta}>{item.meta}</Text>
                  <Text style={styles.activityActor}>{item.actor}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Export Reports Button in Brand Orange #F0562A ── */}
          <View style={styles.exportButtonContainer}>
            <TouchableOpacity style={styles.exportButton} onPress={handleExport} activeOpacity={0.8}>
              <Text style={styles.exportButtonText}>Export reports</Text>
            </TouchableOpacity>
            <Text style={styles.footerCaption}>M1-S04 · Operations Overview</Text>
          </View>

          <View style={{ height: adminSpacing.xxxl }} />
        </ScrollView>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Filter Operations</Text>
              {['All Warehouses', 'Ooty Warehouse', 'Coonoor Warehouse', 'Kotagiri Warehouse', 'Gudalur Market'].map((wh) => (
                <TouchableOpacity
                  key={wh}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedWarehouseFilter(wh);
                    setShowFilterModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, selectedWarehouseFilter === wh && styles.modalOptionTextSelected]}>
                    {wh}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VIEW 2: WAREHOUSES & INVENTORY MANAGEMENT VIEW
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header Banner matching Screenshot 1 */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleGroup}>
            <WarehouseHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>Inventory & Warehouse</Text>
          </View>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={styles.headerCircleBtn}
              onPress={() => {
                if (onPlusAction) onPlusAction();
                else Alert.alert('Add', 'New warehouse or inventory transaction.');
              }}
              activeOpacity={0.8}
              accessibilityLabel="Add"
            >
              <PlusHeaderIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerCircleBtn}
              onPress={() => {
                if (onNotifications) onNotifications();
                else Alert.alert('Notifications', 'No new warehouse notifications.');
              }}
              activeOpacity={0.8}
              accessibilityLabel="Notifications"
            >
              <BellHeaderIcon size={18} color={adminColors.onBrand} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <SearchGrayIcon size={18} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.searchFilterBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <FilterSlidersOrangeIcon size={18} />
          </TouchableOpacity>
        </View>

        {/* 6 Metric Cards in 2x3 Grid */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToStockLedger}
            activeOpacity={0.75}
          >
            <Text style={styles.metricValue}>4,810 kg</Text>
            <Text style={styles.metricLabel}>Total Available Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToStockLedger}
            activeOpacity={0.75}
          >
            <Text style={styles.metricValue}>11</Text>
            <Text style={styles.metricLabel}>Inventory Batches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToStockLedger}
            activeOpacity={0.75}
          >
            <Text style={styles.metricValue}>Not configured</Text>
            <Text style={styles.metricLabel}>Low-Stock Items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToStockVerification}
            activeOpacity={0.75}
          >
            <Text style={styles.metricValue}>5</Text>
            <Text style={styles.metricLabel}>Pending Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToTransfers}
            activeOpacity={0.75}
          >
            <Text style={styles.metricValue}>2</Text>
            <Text style={styles.metricLabel}>Pending Transfer Receipts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={onNavigateToStockVerification}
            activeOpacity={0.75}
          >
            <Text style={styles.metricValue}>1</Text>
            <Text style={styles.metricLabel}>Stock Discrepancies</Text>
          </TouchableOpacity>
        </View>

        {/* Warehouse comparison Section Heading */}
        <Text style={styles.sectionTitleBrown}>Warehouse comparison</Text>

        {/* Active Warehouse Cards */}
        <View style={styles.whListSection}>
          {filteredWarehouses.map((wh) => (
            <TouchableOpacity
              key={wh.id}
              style={[styles.whCard, wh.failedLoad && styles.whCardPending]}
              onPress={() => {
                if (onSelectWarehouse) onSelectWarehouse(wh.id);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.whCardHeader}>
                <Text style={styles.whCardTitle}>{wh.title}</Text>
                <View
                  style={[
                    styles.whStatusBadge,
                    wh.status === 'Active' ? styles.whStatusActive : styles.whStatusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.whStatusText,
                      wh.status === 'Active' ? styles.whStatusTextActive : styles.whStatusTextPending,
                    ]}
                  >
                    {wh.status}
                  </Text>
                </View>
              </View>

              <Text style={[styles.whCardLine, wh.failedLoad && styles.whCardLineFailed]}>
                {wh.line1}
              </Text>
              <Text style={styles.whCardLine}>{wh.line2}</Text>
              <Text style={styles.whCardLine}>{wh.line3}</Text>

              {wh.failedLoad && (
                <View style={styles.whActionButtonsRow}>
                  <TouchableOpacity
                    style={styles.activeWhBtn}
                    onPress={handleActivateKotagiri}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.activeWhBtnText}>Active warehouse</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelWhBtn}
                    onPress={() => Alert.alert('Cancelled', 'No action performed.')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelWhBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick links Section (Screenshot 2) */}
        <Text style={styles.sectionTitleBrown}>Quick links</Text>

        <View style={styles.quickNavGrid}>
          <TouchableOpacity
            style={styles.quickNavTile}
            onPress={onNavigateToStockLedger}
            activeOpacity={0.75}
          >
            <View style={styles.tileIconContainer}>
              <StockLedgerBoxIcon />
            </View>
            <Text style={styles.tileLabel}>Stock Ledger & Batches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavTile}
            onPress={onNavigateToStockVerification}
            activeOpacity={0.75}
          >
            <View style={styles.tileIconContainer}>
              <StockVerificationCheckIcon />
            </View>
            <Text style={styles.tileLabel}>Stock Verification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavTile}
            onPress={onNavigateToTransfers}
            activeOpacity={0.75}
          >
            <View style={styles.tileIconContainer}>
              <InterWarehouseArrowsIcon />
            </View>
            <Text style={styles.tileLabel}>Inter-Warehouse Transfers</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter Warehouses</Text>
            {['All Warehouses', 'Ooty (WH-MAIN)', 'Coonoor (WH-SUB1)', 'Kotagiri (WH-SUB2)', 'Sholur Market (WH-SUB3)'].map((wh) => (
              <TouchableOpacity
                key={wh}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedWarehouseFilter(wh);
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.modalOptionText, selectedWarehouseFilter === wh && styles.modalOptionTextSelected]}>
                  {wh}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 6,
    paddingBottom: adminSpacing.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  headerCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFilterBtn: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionContainer: {
    marginBottom: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  subHeading: {
    ...adminType.caption,
    color: adminColors.ink,
    fontWeight: '700',
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
  },
  rowLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  rowValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  subNote: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: adminSpacing.sm,
    lineHeight: 15,
  },

  // Warehouse Overview Card inside Section D
  warehouseSectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  manageWarehousesBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  manageWarehousesBtnText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  warehouseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  warehouseTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 15,
  },
  badgeActive: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgeActiveText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
  },
  badgePendingText: {
    ...adminType.caption,
    color: adminColors.warning.text,
    fontWeight: '700',
  },
  warehouseStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: adminSpacing.sm,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  statValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
  },

  // Activity Timeline
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
    backgroundColor: adminColors.card,
    padding: adminSpacing.md,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  activityContentCol: {
    flex: 1,
  },
  activityTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 2,
    fontSize: 14,
  },
  activityMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  activityActor: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },

  // Export Reports Button
  exportButtonContainer: {
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  exportButton: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  exportButtonText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
  },
  footerCaption: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.md,
  },

  // Search Bar in Warehouses view
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2DC',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: adminSpacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1412',
    paddingHorizontal: 8,
  },
  searchFilterBtn: {
    padding: 6,
  },

  // Quick Nav Grid in Warehouses view
  quickNavGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: adminSpacing.lg,
  },
  quickNavTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E2DC',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
  },
  tileIconContainer: {
    marginBottom: 6,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A1412',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Warehouse Cards in Warehouses view
  whListSection: {
    gap: 12,
    marginBottom: adminSpacing.lg,
  },
  whCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2DC',
    padding: 14,
  },
  whCardPending: {
    borderColor: '#F0ECE6',
  },
  whCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  whCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1412',
  },
  whStatusBadge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  whStatusActive: {
    backgroundColor: '#E8F5E9',
  },
  whStatusPending: {
    backgroundColor: '#FFF3E0',
  },
  whStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  whStatusTextActive: {
    color: '#2E7D32',
  },
  whStatusTextPending: {
    color: '#B25E00',
  },
  whCardLine: {
    fontSize: 12,
    color: '#78736E',
    lineHeight: 18,
  },
  whCardLineFailed: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  whActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  activeWhBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6CE',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeWhBtnText: {
    color: '#7C3411',
    fontSize: 12.5,
    fontWeight: '700',
  },
  cancelWhBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDD6CE',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelWhBtnText: {
    color: '#78736E',
    fontSize: 12.5,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: adminSpacing.md,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E2DC',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1412',
  },
  metricLabel: {
    fontSize: 11,
    color: '#8A827B',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitleBrown: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8A5835',
    marginTop: 10,
    marginBottom: 10,
  },

  // Filter Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  modalContent: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  modalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    borderRadius: adminRadius.md,
  },
  modalOptionText: {
    ...adminType.body,
    color: adminColors.ink,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: adminColors.brand,
  },
});
