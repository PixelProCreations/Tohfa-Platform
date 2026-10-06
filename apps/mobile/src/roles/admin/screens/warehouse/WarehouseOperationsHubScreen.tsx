import React from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerBg: '#F0562A',
  pageBg: '#F3EFE9',
  cardBg: '#FFFFFF',
  border: '#EEDCD3',
  textInk: '#1A1A1A',
  textSecondary: '#5F5E5A',
  orangeDeep: '#7A2E14',
  noticeBgOrange: '#FDF3F0',
  noticeBorderOrange: '#F7CFC4',
  greenBg: '#EAF3DE',
  greenText: '#1E8E5A',
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────
function Grid4SquaresIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  // Lucide LayoutDashboard (exact match to header icon)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="9" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="3" width="7" height="5" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="14" y="12" width="7" height="9" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3" y="16" width="7" height="5" rx="1.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BellOutlineIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  // Lucide Bell
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.3 21a1.94 1.94 0 0 0 3.4 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BuildingWarehouseIcon({ size = 15, color = '#FFFFFF' }: { size?: number; color?: string }) {
  // Lucide Building2
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 6h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 10h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 18h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownWhiteIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 22, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function StorageLocationsIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21v-8h6v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MaterialHandlingIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 13l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarehouseCapacityIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12A9 9 0 0 0 6 5.6L3 8M3 3v5h5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12a9 9 0 0 0 15 6.4l3-2.4M21 21v-5h-5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OperationalIssuesIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" />
      <Path d="M12 8v5M12 16h.01" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryLogIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StaffAttendanceIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface WarehouseOperationsHubScreenProps {
  showBack?: boolean;
  onBack?: () => void;
  selectedWarehouse?: string;
  onOpenWarehouseFilter?: () => void;
  onOpenNotifications?: () => void;
  onNavigateWarehouseOverview?: () => void;
  onNavigateTodaysOperations?: () => void;
  onNavigateNeedsAttention?: () => void;
  onNavigateStorageLocations?: () => void;
  onNavigateMaterialHandling?: () => void;
  onNavigateWarehouseCapacity?: () => void;
  onNavigateOperationalIssues?: () => void;
  onNavigateStaffAttendance?: () => void;
  onNavigateOperationsHistory?: () => void;
  onSelectWarehouseDetail?: (whName: string) => void;
}

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function WarehouseOperationsHubScreen({
  showBack = true,
  onBack,
  selectedWarehouse = 'All Warehouses',
  onOpenWarehouseFilter,
  onOpenNotifications,
  onNavigateWarehouseOverview,
  onNavigateTodaysOperations,
  onNavigateNeedsAttention,
  onNavigateStorageLocations,
  onNavigateMaterialHandling,
  onNavigateWarehouseCapacity,
  onNavigateOperationalIssues,
  onNavigateStaffAttendance,
  onNavigateOperationsHistory,
  onSelectWarehouseDetail,
}: WarehouseOperationsHubScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            {showBack && onBack && (
              <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={{ marginRight: 8, padding: 2 }}>
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <Grid4SquaresIcon size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Warehouse Operations</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
          >
            <BellOutlineIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Warehouse Filter Pill */}
        <TouchableOpacity
          style={styles.whFilterPill}
          onPress={onOpenWarehouseFilter}
          activeOpacity={0.8}
        >
          <BuildingWarehouseIcon size={15} color="#FFFFFF" />
          <Text style={styles.whFilterPillText}>{selectedWarehouse}</Text>
          <ChevronDownWhiteIcon size={13} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 6 KPI Cards (2 cols x 3 rows) */}
        <View style={styles.kpiGrid}>
          {/* 1. Storage Locations */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateStorageLocations}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>STORAGE LOCATIONS</Text>
            <Text style={styles.kpiValue}>4</Text>
            <Text style={styles.kpiSub}>warehouses</Text>
          </TouchableOpacity>

          {/* 2. Occupancy */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateWarehouseCapacity}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>OCCUPANCY</Text>
            <Text style={styles.kpiValue}>64%</Text>
            <Text style={styles.kpiSub}>avg</Text>
          </TouchableOpacity>

          {/* 3. Material Items */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateMaterialHandling}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>MATERIAL ITEMS</Text>
            <Text style={styles.kpiValue}>42</Text>
            <Text style={styles.kpiSub}>tracked</Text>
          </TouchableOpacity>

          {/* 4. Open Issues */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateOperationalIssues}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>OPEN ISSUES</Text>
            <Text style={styles.kpiValue}>9</Text>
            <Text style={styles.kpiSub}>requires attention</Text>
          </TouchableOpacity>

          {/* 5. Staff Present */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateStaffAttendance || onNavigateTodaysOperations}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>STAFF PRESENT</Text>
            <Text style={styles.kpiValue}>27/34</Text>
            <Text style={styles.kpiSub}>today</Text>
          </TouchableOpacity>

          {/* 6. Operations History */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={onNavigateOperationsHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.kpiLabel}>OPERATIONS HISTORY</Text>
            <Text style={styles.kpiValue}>84</Text>
            <Text style={styles.kpiSub}>searchable log →</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Warehouse Overview ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Warehouse Overview</Text>
          <TouchableOpacity onPress={onNavigateWarehouseOverview} activeOpacity={0.7}>
            <Text style={styles.viewLink}>View →</Text>
          </TouchableOpacity>
        </View>

        {/* Ooty Card */}
        <TouchableOpacity
          style={styles.overviewCard}
          onPress={() => (onSelectWarehouseDetail ? onSelectWarehouseDetail('Ooty') : onNavigateWarehouseOverview?.())}
          activeOpacity={0.8}
        >
          <View style={styles.overviewTopRow}>
            <Text style={styles.overviewName}>Ooty</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Operational</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Occupancy</Text>
              <Text style={styles.statValue}>68%</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Activities</Text>
              <Text style={styles.statValue}>24</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Issues</Text>
              <Text style={styles.statValue}>2</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Coonoor Card */}
        <TouchableOpacity
          style={styles.overviewCard}
          onPress={() => (onSelectWarehouseDetail ? onSelectWarehouseDetail('Coonoor') : onNavigateWarehouseOverview?.())}
          activeOpacity={0.8}
        >
          <View style={styles.overviewTopRow}>
            <Text style={styles.overviewName}>Coonoor</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Operational</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Occupancy</Text>
              <Text style={styles.statValue}>72%</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Activities</Text>
              <Text style={styles.statValue}>28</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Issues</Text>
              <Text style={styles.statValue}>3</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ─── Today's Operational Status ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Today's Operational Status</Text>
          <TouchableOpacity onPress={onNavigateTodaysOperations} activeOpacity={0.7}>
            <Text style={styles.viewLink}>View →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.statusCard}
          onPress={onNavigateTodaysOperations}
          activeOpacity={0.8}
        >
          <View style={styles.statusItemRow}>
            <Text style={styles.statusItemName}>Receiving</Text>
            <Text style={styles.statusItemValue}>3 shipments</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusItemRow}>
            <Text style={styles.statusItemName}>Storage</Text>
            <Text style={styles.statusItemValue}>8 activities</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusItemRow}>
            <Text style={styles.statusItemName}>Material Handling</Text>
            <Text style={styles.statusItemValue}>6 activities</Text>
          </View>
        </TouchableOpacity>

        {/* ─── Needs Attention ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Needs Attention</Text>
          <TouchableOpacity onPress={onNavigateNeedsAttention || onNavigateOperationalIssues} activeOpacity={0.7}>
            <Text style={styles.viewLink}>View →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.attentionCard}
          onPress={onNavigateNeedsAttention || onNavigateOperationalIssues}
          activeOpacity={0.8}
        >
          <View style={styles.attentionAccent} />
          <View style={styles.attentionContent}>
            <WarningTriangleIcon size={24} color="#F0562A" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.attentionTitle}>Storage Issue — Rack A-03</Text>
              <Text style={styles.attentionSub}>Coonoor · Requires attention</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ─── Operations History Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Operations History</Text>
          <TouchableOpacity onPress={onNavigateOperationsHistory} activeOpacity={0.7}>
            <Text style={styles.viewLink}>View All →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.attentionCard}
          onPress={onNavigateOperationsHistory}
          activeOpacity={0.8}
        >
          <View style={[styles.attentionAccent, { backgroundColor: PALETTE.primary }]} />
          <View style={styles.attentionContent}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#FDF3F0', alignItems: 'center', justifyContent: 'center' }}>
              <HistoryLogIcon size={20} color={PALETTE.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.attentionTitle}>Operations History & Log</Text>
              <Text style={styles.attentionSub}>
                Long-term searchable record · Stock verifications, material receipts & exports
              </Text>
            </View>
            <Text style={styles.viewLink}>Open →</Text>
          </View>
        </TouchableOpacity>

        {/* ─── Quick Actions ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          {/* Storage Locations */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={onNavigateStorageLocations}
            activeOpacity={0.8}
          >
            <StorageLocationsIcon size={26} color={PALETTE.primary} />
            <Text style={styles.quickActionText}>Storage Locations</Text>
          </TouchableOpacity>

          {/* Material Handling */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={onNavigateMaterialHandling}
            activeOpacity={0.8}
          >
            <MaterialHandlingIcon size={26} color={PALETTE.primary} />
            <Text style={styles.quickActionText}>Material Handling</Text>
          </TouchableOpacity>

          {/* Warehouse Capacity */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={onNavigateWarehouseCapacity}
            activeOpacity={0.8}
          >
            <WarehouseCapacityIcon size={26} color={PALETTE.primary} />
            <Text style={styles.quickActionText}>Warehouse Capacity</Text>
          </TouchableOpacity>

          {/* Operational Issues */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={onNavigateOperationalIssues}
            activeOpacity={0.8}
          >
            <OperationalIssuesIcon size={26} color={PALETTE.primary} />
            <Text style={styles.quickActionText}>Operational Issues</Text>
          </TouchableOpacity>

          {/* Staff Attendance */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={onNavigateStaffAttendance}
            activeOpacity={0.8}
          >
            <StaffAttendanceIcon size={26} color={PALETTE.primary} />
            <Text style={styles.quickActionText}>Staff Attendance</Text>
          </TouchableOpacity>

          {/* Operations History */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={onNavigateOperationsHistory}
            activeOpacity={0.8}
          >
            <HistoryLogIcon size={26} color={PALETTE.primary} />
            <Text style={styles.quickActionText}>Operations History</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Disclaimer Box */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Receive Goods and Stock Verification always deep-link to Modules 2 and 3 — this module never recreates those workflows.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 8,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 7,
  },
  whFilterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
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
    textAlign: 'left',
  },
  kpiSub: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'left',
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
  viewLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  overviewCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14, // LG 14px from Design System PDF
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  overviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewName: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusPill: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.border,
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  statusItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  statusItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  statusItemValue: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  attentionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  attentionAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: PALETTE.primary,
  },
  attentionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 18,
  },
  attentionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  attentionSub: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    textAlign: 'center',
  },
  disclaimerBox: {
    backgroundColor: PALETTE.noticeBgOrange,
    borderColor: PALETTE.noticeBorderOrange,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
    color: PALETTE.orangeDeep,
  },
});
