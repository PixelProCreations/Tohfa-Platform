import React from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary:       '#F0562A', // Brand Orange
  headerBg:      '#F0562A',
  headerPillBg:  'rgba(255, 255, 255, 0.22)',
  headerText:    '#FFFFFF',

  orangeDeep:    '#7A2E14', // Section headings
  primarySoft:   '#FDF3F0',
  pageBg:        '#F3EFE9', // App canvas soft cream

  textInk:       '#1A1A1A', // Primary text
  textSecondary: '#5F5E5A', // Secondary text
  border:        '#EEDCD3', // Card and input borders
  borderRow:     '#F2ECE5', // Table divider lines
  cardBg:        '#FFFFFF',
};

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function CrateDownloadIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M3 13h4.5l1.5 2.5h6l1.5-2.5H21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7v4.5M9.5 9.5l2.5 2.5 2.5-2.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RefreshIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WarehouseBuildingIcon({ size = 15, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface ReceivingDashboardScreenProps {
  warehouseName?: string;
  onBack?: () => void;
  onOpenWarehouseSelector?: () => void;
  onRefresh?: () => void;
  onViewIncomingShipments?: () => void;
  onViewTransferReceiving?: () => void;
  onViewDetails?: (kpiKey: string) => void;
  onViewActivity?: () => void;
  onViewPendingQueue?: () => void;
}

export function ReceivingDashboardScreen({
  warehouseName = 'All Warehouses',
  onBack,
  onOpenWarehouseSelector,
  onRefresh,
  onViewIncomingShipments,
  onViewTransferReceiving,
  onViewDetails,
  onViewActivity,
  onViewPendingQueue,
}: ReceivingDashboardScreenProps) {
  const KPIS_ROW_1 = [
    { key: 'expected', label: 'EXPECTED TODAY', value: '24', unit: 'shipments' },
    { key: 'arrived', label: 'ARRIVED', value: '19', unit: 'shipments' },
  ];

  const KPIS_ROW_2 = [
    { key: 'in_progress', label: 'IN PROGRESS', value: '5', unit: 'receiving' },
    { key: 'completed', label: 'COMPLETED', value: '14', unit: 'today' },
  ];

  const KPIS_ROW_3 = [
    { key: 'discrepancies', label: 'DISCREPANCIES', value: '2', unit: 'flagged' },
    { key: 'turnaround', label: 'AVG TURNAROUND', value: '38', unit: 'minutes' },
  ];

  const QUEUE_ITEMS = [
    { label: 'Arrived', count: 19 },
    { label: 'In Progress', count: 6 },
    { label: 'QC Pending', count: 5 },
    { label: 'Decision Pending', count: 3 },
    { label: 'Batch Pending', count: 2 },
    { label: 'Storage Pending', count: 1 },
  ];

  const renderKpiCard = (kpi: { key: string; label: string; value: string; unit: string }) => (
    <TouchableOpacity
      key={kpi.key}
      style={styles.kpiCard}
      onPress={() => (onViewDetails ? onViewDetails(kpi.key) : onViewIncomingShipments?.())}
      activeOpacity={0.8}
    >
      <Text style={styles.kpiLabel}>{kpi.label}</Text>
      <Text style={styles.kpiValue}>{kpi.value}</Text>
      <Text style={styles.kpiUnit}>{kpi.unit}</Text>
      <View style={styles.kpiLink}>
        <Text style={styles.kpiLinkText}>View details →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Top Header Banner (Exact match to Left Design) ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            {onBack && (
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={{ marginRight: 8, padding: 2 }}
                accessibilityLabel="Go back"
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <CrateDownloadIcon size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Receiving Dashboard</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
            accessibilityLabel="Refresh Receiving Dashboard"
          >
            <RefreshIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Warehouse Selector Pill */}
        <TouchableOpacity
          style={styles.warehousePill}
          onPress={onOpenWarehouseSelector}
          activeOpacity={0.8}
        >
          <WarehouseBuildingIcon size={14} color="#FFFFFF" />
          <Text style={styles.warehousePillText}>{warehouseName}</Text>
          <ChevronDownIcon size={11} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ─── Body Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 6 KPI Cards in 3 Rows with Exact Rounded Corners & Proportions ─── */}
        <View style={styles.kpiSection}>
          <View style={styles.kpiRow}>
            {KPIS_ROW_1.map(renderKpiCard)}
          </View>
          <View style={styles.kpiRow}>
            {KPIS_ROW_2.map(renderKpiCard)}
          </View>
          <View style={styles.kpiRow}>
            {KPIS_ROW_3.map(renderKpiCard)}
          </View>
        </View>

        {/* ─── Inter-Warehouse Transfer Receiving Banner Card ─── */}
        <TouchableOpacity
          style={styles.transferBannerCard}
          onPress={onViewTransferReceiving ?? onViewIncomingShipments}
          activeOpacity={0.8}
        >
          <View style={styles.transferBannerLeft}>
            <View style={styles.transferIconCircle}>
              <TruckIcon size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.transferBannerTitle}>Transfer Receiving</Text>
              <Text style={styles.transferBannerSub}>Coonoor ← Kotagiri arrivals</Text>
            </View>
          </View>
          <Text style={styles.transferBannerLink}>View →</Text>
        </TouchableOpacity>

        {/* ─── Receiving Activity Pipeline ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Receiving Activity</Text>
          <TouchableOpacity
            onPress={onViewActivity ?? onViewIncomingShipments}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          <Text style={styles.activityPipelineText}>
            Shipment Created → Arrived → Receiving Started → Quantity Checked → Quality Checked → Decision → Batch Assigned → Storage Assigned → Receipt Completed
          </Text>
        </View>

        {/* ─── Pending Receiving Queue ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Pending Receiving Queue</Text>
          <TouchableOpacity
            onPress={onViewPendingQueue ?? onViewIncomingShipments}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.queueCard}>
          {QUEUE_ITEMS.map((item, index) => {
            const isLast = index === QUEUE_ITEMS.length - 1;
            return (
              <View
                key={item.label}
                style={[styles.queueRow, !isLast && styles.queueRowBorder]}
              >
                <Text style={styles.queueLabel}>{item.label}</Text>
                <Text style={styles.queueCount}>{item.count}</Text>
              </View>
            );
          })}
        </View>

        {/* ─── View Incoming Shipments Big Button ─── */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onViewIncomingShipments}
          activeOpacity={0.8}
        >
          <TruckIcon size={20} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>View Incoming Shipments</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingTop: Platform.OS === 'ios' ? 8 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: PALETTE.headerPillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.headerPillBg,
    paddingVertical: 5.5,
    paddingHorizontal: 12,
    borderRadius: 100,
    gap: 7,
  },
  warehousePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  kpiSection: {
    marginBottom: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'left',
  },
  kpiValue: {
    fontSize: 19,
    fontWeight: '800', // Bold in all dashboards
    color: PALETTE.textInk,
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 1,
    textAlign: 'left',
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 6,
    textAlign: 'left',
  },
  kpiLink: {
    marginTop: 2,
  },
  kpiLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  activityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  activityPipelineText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#3D3833',
    lineHeight: 20,
  },
  queueCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  queueRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderRow,
  },
  queueLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  queueCount: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  transferBannerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  transferBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transferIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  transferBannerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  transferBannerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
    marginLeft: 8,
  },
  actionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
