import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { fetchMe, logout, type UserMe } from '../../../farmer/api/auth';
import { AdminProfileScreen } from './AdminProfileScreen';
import { MainWarehouseMoreScreen } from './MainWarehouseMoreScreen';
import {
  WarehouseOverviewScreen,
  StockLedgerScreen,
  VerifyStockScreen,
  StockAdjustmentApprovalScreen,
  LowStockAlertsScreen,
  WarehouseSettingsScreen,
  InterWarehouseTransferScreen,
  InitiateNewTransferScreen,
  type StockBatchItem,
  type VerifyStockAdjustmentData,
  type InterWarehouseTransferItem,
  INITIAL_TRANSFERS,
} from '../warehouse';

// ─── Design Tokens (Matching D01 · Main Dashboard Mockup) ────────────────────
const PALETTE = {
  headerBg:      '#D96B27', // Rich warm header orange
  headerBgDark:  '#C25717',
  headerPillBg:  'rgba(255, 255, 255, 0.22)',
  headerText:    '#FFFFFF',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  border:        '#EDE8E0',
  borderLight:   '#F4EFE9',

  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',

  primary:       '#D96B27',
  primarySoft:   '#FEF3EC',
  primaryBorder: '#FCDCCE',

  amber:         '#C07D14',
  green:         '#0D6B4F',
  greenBg:       '#DCFCE7',
  greenText:     '#15803D',

  red:           '#DC2626',
  redBg:         '#FEE2E2',
  redBorder:     '#FCA5A5',

  tabInactive:   '#827A74',
  tabActive:     '#D96B27',
  tabBorder:     '#EDE8E0',
};

export type MainWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

type WarehouseSubView =
  | 'overview'
  | 'stock_ledger'
  | 'verify_stock'
  | 'stock_adjustment_approval'
  | 'low_stock_alerts'
  | 'inter_warehouse_transfer'
  | 'initiate_new_transfer'
  | 'warehouse_settings'
  | 'profile';

// ─── SVG Icons (Matching D01 Screenshots) ───────────────────────────────────

function Grid4SquaresIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" fill={color} />
    </Svg>
  );
}

function BellOutlineIcon({ size = 20, color = '#1E1612' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BuildingWarehouseIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownWhiteIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightGrayIcon({ size = 16, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InfoCircleIcon({ size = 16, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M12 8h.01M12 12v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 20, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function TruckIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function InboxReceiveIcon({ size = 20, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13h4l2 3h4l2-3h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 7v5M9 9.5l3 3 3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TransferArrowsIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ClipboardChecklistIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.8" />
      <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BuildingLargeIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StaffBadgeIcon({ size = 24, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
      <Path d="M8 17a4 4 0 0 1 8 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ProhibitedSlashIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Bottom Navigation Tab Icons ─────────────────────────────────────────────

function HomeTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21v-7h6v7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 13h4l2 3h4l2-3h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 7v5M9 9.5l3 3 3-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

export interface MainWarehouseAdminDashboardScreenProps {
  onSignOut: () => void;
  onNavigate?: (screen: string) => void;
}

export function MainWarehouseAdminDashboardScreen({
  onSignOut,
  onNavigate,
}: MainWarehouseAdminDashboardScreenProps) {
  const [activeTab, setActiveTab] = useState<MainWHTab>('Home');
  const [whSubView, setWhSubView] = useState<WarehouseSubView>('overview');
  const [whHistory, setWhHistory] = useState<WarehouseSubView[]>([]);
  const [selectedWHFilter, setSelectedWHFilter] = useState('All Warehouses');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedWHName, setSelectedWHName] = useState('Ooty Warehouse');
  const [selectedBatch, setSelectedBatch] = useState<StockBatchItem | null>(null);
  const [adjustmentRecord, setAdjustmentRecord] = useState<VerifyStockAdjustmentData | null>(null);
  const [transferList, setTransferList] = useState<InterWarehouseTransferItem[]>(INITIAL_TRANSFERS);
  const [user, setUser] = useState<UserMe | null>(null);

  const WAREHOUSE_OPTIONS = ['All Warehouses', 'Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'];

  const navigateWh = (view: WarehouseSubView) => {
    setWhHistory((prev) => [...prev, whSubView]);
    setWhSubView(view);
  };

  const goBackWh = () => {
    if (whHistory.length > 0) {
      setWhHistory((prev) => {
        const next = [...prev];
        const last = next.pop();
        if (last) setWhSubView(last);
        return next;
      });
    } else {
      setActiveTab('Home');
      setWhSubView('overview');
    }
  };

  useEffect(() => {
    fetchMe()
      .then((me) => setUser(me))
      .catch(() => {});
  }, []);

  const displayName = user?.fullName ?? 'Suresh';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      <View style={{ flex: 1 }}>
        {/* ─── Main Dashboard View (Home Tab) ─── */}
        {activeTab === 'Home' && whSubView === 'overview' && (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollPad}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Orange Header Section */}
            <View style={styles.headerBanner}>
              {/* Top Greeting Row */}
              <View style={styles.headerTopRow}>
                <View style={styles.headerTitleWrap}>
                  <Grid4SquaresIcon size={18} color="#FFFFFF" />
                  <Text style={styles.headerGreetingText}>Good morning, {displayName}</Text>
                </View>

                {/* Notification Bell Button */}
                <TouchableOpacity
                  style={styles.notificationBellBtn}
                  onPress={() => {
                    navigateWh('low_stock_alerts');
                  }}
                  activeOpacity={0.8}
                >
                  <BellOutlineIcon size={18} color="#1E1612" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>6</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Subtitle */}
              <Text style={styles.headerSubtitle}>Main Warehouse Admin · Today</Text>

              {/* Warehouse Dropdown Filter Pill */}
              <TouchableOpacity
                style={styles.whFilterPill}
                onPress={() => setShowFilterModal(true)}
                activeOpacity={0.8}
              >
                <BuildingWarehouseIcon size={15} color="#FFFFFF" />
                <Text style={styles.whFilterPillText}>{selectedWHFilter}</Text>
                <ChevronDownWhiteIcon size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Content Container */}
            <View style={styles.contentBody}>
              {/* ─── 1. Today's Overview (KPI Grid) ─── */}
              <Text style={styles.sectionHeading}>Today's Overview</Text>
              <View style={styles.kpiGrid}>
                {/* Total Stock */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>TOTAL STOCK</Text>
                  <Text style={styles.kpiValue}>12,840</Text>
                  <Text style={styles.kpiSub}>KG</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Incoming Goods */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>INCOMING GOODS</Text>
                  <Text style={styles.kpiValue}>1,240</Text>
                  <Text style={styles.kpiSub}>KG today</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Pending Transfers */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>PENDING TRANSFERS</Text>
                  <Text style={styles.kpiValue}>5</Text>
                  <Text style={styles.kpiSub}>transfers</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Today's Orders */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    if (onNavigate) onNavigate('SubWarehouseCustomerOrders');
                    else navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>TODAY'S ORDERS</Text>
                  <Text style={styles.kpiValue}>312</Text>
                  <Text style={styles.kpiSub}>orders</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Sales */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => {
                    if (onNavigate) onNavigate('SubWarehouseSales');
                    else navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>SALES</Text>
                  <Text style={styles.kpiValue}>₹1,45,100</Text>
                  <Text style={styles.kpiSub}>today</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>

                {/* Open Issues */}
                <TouchableOpacity
                  style={styles.kpiCard}
                  onPress={() => navigateWh('low_stock_alerts')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.kpiLabel}>OPEN ISSUES</Text>
                  <Text style={styles.kpiValue}>7</Text>
                  <Text style={styles.kpiSub}>issues</Text>
                  <Text style={styles.kpiLink}>View details →</Text>
                </TouchableOpacity>
              </View>

              {/* KPI Info Notice Banner */}
              <View style={styles.kpiInfoBanner}>
                <InfoCircleIcon size={16} color={PALETTE.primary} />
                <Text style={styles.kpiInfoText}>
                  Every KPI shows its own unit — KG, order counts, and currency are never added together into one blended figure.
                </Text>
              </View>

              {/* ─── 2. Warehouse Overview ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Warehouse Overview</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>

              {/* Ooty Progress Card */}
              <TouchableOpacity
                style={styles.whProgressCard}
                onPress={() => {
                  setSelectedWHName('Ooty Warehouse');
                  navigateWh('stock_ledger');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.whProgressTopRow}>
                  <Text style={styles.whProgressTitle}>Ooty</Text>
                  <ChevronRightGrayIcon size={16} />
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '75%', backgroundColor: PALETTE.amber }]} />
                </View>
              </TouchableOpacity>

              {/* Coonoor Progress Card */}
              <TouchableOpacity
                style={styles.whProgressCard}
                onPress={() => {
                  setSelectedWHName('Coonoor Warehouse');
                  navigateWh('stock_ledger');
                }}
                activeOpacity={0.8}
              >
                <View style={styles.whProgressTopRow}>
                  <Text style={styles.whProgressTitle}>Coonoor</Text>
                  <ChevronRightGrayIcon size={16} />
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: '58%', backgroundColor: PALETTE.green }]} />
                </View>
              </TouchableOpacity>

              {/* ─── 3. Today's Operations ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Today's Operations</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('stock_ledger')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.operationsCard}>
                <Text style={styles.operationsText}>Receiving · Orders · Quality · Dispatch</Text>
              </View>

              {/* ─── 4. Alerts & Pending Actions ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Alerts & Pending Actions</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('low_stock_alerts')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.alertCard}
                onPress={() => navigateWh('low_stock_alerts')}
                activeOpacity={0.8}
              >
                <View style={styles.alertIconWrap}>
                  <WarningTriangleIcon size={22} color="#EF4444" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.alertTitle}>Coonoor stock below target</Text>
                  <Text style={styles.alertSub}>Warehouse exceptions, escalations and transfer issues</Text>
                </View>
              </TouchableOpacity>

              {/* ─── 5. Recent Activity ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Recent Activity</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentActivityCard}>
                {/* Activity 1 */}
                <TouchableOpacity
                  style={styles.activityItemRow}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityIconBox}>
                    <TruckIcon size={18} color={PALETTE.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activityTitle}>Transfer TRF-00284 in transit</Text>
                    <Text style={styles.activitySub}>Coonoor → Ooty</Text>
                  </View>
                  <Text style={styles.activityTime}>10:20 AM</Text>
                </TouchableOpacity>

                <View style={styles.activityDivider} />

                {/* Activity 2 */}
                <TouchableOpacity
                  style={styles.activityItemRow}
                  onPress={() => {
                    setSelectedWHName('Kotagiri Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.activityIconBox}>
                    <InboxReceiveIcon size={18} color={PALETTE.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activityTitle}>Goods received</Text>
                    <Text style={styles.activitySub}>Kotagiri warehouse</Text>
                  </View>
                  <Text style={styles.activityTime}>09:45 AM</Text>
                </TouchableOpacity>
              </View>

              {/* ─── 6. Quick Actions ─── */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Quick Actions</Text>
                <TouchableOpacity
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllLink}>View All →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.quickActionsGrid}>
                {/* 1. Transfer Stock */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => navigateWh('inter_warehouse_transfer')}
                  activeOpacity={0.8}
                >
                  <TransferArrowsIcon size={24} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>Transfer Stock</Text>
                </TouchableOpacity>

                {/* 2. Review Receiving */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <ClipboardChecklistIcon size={24} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>Review Receiving</Text>
                </TouchableOpacity>

                {/* 3. View Warehouses */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    setSelectedWHName('Ooty Warehouse');
                    navigateWh('stock_ledger');
                  }}
                  activeOpacity={0.8}
                >
                  <BuildingLargeIcon size={24} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>View Warehouses</Text>
                </TouchableOpacity>

                {/* 4. Manage SWAs */}
                <TouchableOpacity
                  style={styles.quickActionCard}
                  onPress={() => {
                    if (onNavigate) onNavigate('SubWarehouseStaff');
                    else navigateWh('warehouse_settings');
                  }}
                  activeOpacity={0.8}
                >
                  <StaffBadgeIcon size={24} color={PALETTE.primary} />
                  <Text style={styles.quickActionLabel}>Manage SWAs</Text>
                </TouchableOpacity>
              </View>

              {/* Disclaimer Notice */}
              <View style={styles.disclaimerBox}>
                <ProhibitedSlashIcon size={16} color={PALETTE.textSecondary} />
                <Text style={styles.disclaimerText}>
                  Conceptual layout with mock data only — no live operational figures are implied, and no control here does anything but navigate through prototype views.
                </Text>
              </View>

              <View style={{ height: 16 }} />
            </View>
          </ScrollView>
        )}

        {/* ─── Receiving Tab ─── */}
        {activeTab === 'Receiving' && (
          <StockLedgerScreen
            warehouseName={selectedWHName}
            onBack={() => setActiveTab('Home')}
            onVerifyBatch={(batch) => {
              if (batch) setSelectedBatch(batch);
              navigateWh('verify_stock');
            }}
          />
        )}

        {/* ─── Inventory Tab ─── */}
        {activeTab === 'Inventory' && (
          <WarehouseOverviewScreen
            onBack={() => setActiveTab('Home')}
            onSelectWarehouse={(whName) => {
              setSelectedWHName(whName);
              navigateWh('stock_ledger');
            }}
            onViewLowStock={() => {
              navigateWh('low_stock_alerts');
            }}
            onOpenSettings={() => {
              navigateWh('warehouse_settings');
            }}
          />
        )}

        {/* ─── More Tab ─── */}
        {activeTab === 'More' && (
          <MainWarehouseMoreScreen
            onBack={() => setActiveTab('Home')}
            onLogout={onSignOut}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        )}

        {/* ─── Sub Views for Interactive Navigation ─── */}
        {activeTab === 'Home' && whSubView !== 'overview' && (
          whSubView === 'stock_ledger' ? (
            <StockLedgerScreen
              warehouseName={selectedWHName}
              onBack={goBackWh}
              onVerifyBatch={(batch) => {
                if (batch) setSelectedBatch(batch);
                navigateWh('verify_stock');
              }}
            />
          ) : whSubView === 'verify_stock' ? (
            <VerifyStockScreen
              produceName={selectedBatch?.name ?? 'Carrots'}
              batchId={selectedBatch?.batchId ?? 'BT-4471'}
              zone={selectedBatch?.zone ?? 'Zone A-2'}
              systemCount={selectedBatch?.quantityKg ?? 240}
              initialPhysicalCount={selectedBatch?.name === 'Carrots' ? 225 : (selectedBatch?.quantityKg ? selectedBatch.quantityKg - 5 : 225)}
              onBack={goBackWh}
              onSubmitApproval={(data) => {
                setAdjustmentRecord(data);
                navigateWh('stock_adjustment_approval');
              }}
            />
          ) : whSubView === 'stock_adjustment_approval' ? (
            <StockAdjustmentApprovalScreen
              produceName={adjustmentRecord?.produceName ?? selectedBatch?.name ?? 'Carrots'}
              batchId={adjustmentRecord?.batchId ?? selectedBatch?.batchId ?? 'BT-4471'}
              zone={adjustmentRecord?.zone ?? selectedBatch?.zone ?? 'Zone A-2'}
              systemCount={adjustmentRecord?.systemCount ?? selectedBatch?.quantityKg ?? 240}
              physicalCount={adjustmentRecord?.physicalCount ?? 225}
              varianceKg={adjustmentRecord?.varianceKg ?? -15}
              variancePct={adjustmentRecord?.variancePct ?? -6.25}
              reason={adjustmentRecord?.reason ?? 'Spoilage during storage.'}
              onBack={goBackWh}
              onReturnToLedger={() => {
                setWhSubView('stock_ledger');
                setWhHistory(['overview']);
              }}
            />
          ) : whSubView === 'low_stock_alerts' ? (
            <LowStockAlertsScreen
              onBack={goBackWh}
              onInitiateTransfer={() => {
                navigateWh('inter_warehouse_transfer');
              }}
              onAdjustThresholds={() => {
                navigateWh('warehouse_settings');
              }}
            />
          ) : whSubView === 'inter_warehouse_transfer' ? (
            <InterWarehouseTransferScreen
              transfers={transferList}
              onBack={goBackWh}
              onNewTransfer={() => navigateWh('initiate_new_transfer')}
            />
          ) : whSubView === 'initiate_new_transfer' ? (
            <InitiateNewTransferScreen
              onBack={goBackWh}
              onSubmitTransfer={(newTransfer) => {
                setTransferList((prev) => [newTransfer, ...prev]);
                goBackWh();
              }}
            />
          ) : whSubView === 'warehouse_settings' ? (
            <WarehouseSettingsScreen
              warehouseName={selectedWHName}
              onBack={goBackWh}
            />
          ) : null
        )}
      </View>

      {/* ─── Bottom Navigation Tab Bar (Home, Receiving, Inventory, More) ─── */}
      {activeTab !== 'More' && (whSubView === 'overview' || activeTab !== 'Home') && (
        <View style={styles.bottomTabBar}>
          {/* Home */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setActiveTab('Home');
              setWhSubView('overview');
              setWhHistory([]);
            }}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <HomeTabNavIcon active={activeTab === 'Home'} />
            <Text style={[styles.tabLabel, activeTab === 'Home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          {/* Receiving */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setActiveTab('Receiving');
              setWhSubView('overview');
              setWhHistory([]);
            }}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <ReceivingTabNavIcon active={activeTab === 'Receiving'} />
            <Text style={[styles.tabLabel, activeTab === 'Receiving' && styles.tabLabelActive]}>Receiving</Text>
          </TouchableOpacity>

          {/* Inventory */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setActiveTab('Inventory');
              setWhSubView('overview');
              setWhHistory([]);
            }}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <InventoryTabNavIcon active={activeTab === 'Inventory'} />
            <Text style={[styles.tabLabel, activeTab === 'Inventory' && styles.tabLabelActive]}>Inventory</Text>
          </TouchableOpacity>

          {/* More */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => {
              setActiveTab('More');
              setWhSubView('overview');
              setWhHistory([]);
            }}
            accessibilityRole="tab"
            activeOpacity={0.7}
          >
            <MoreTabNavIcon active={false} />
            <Text style={styles.tabLabel}>More</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Warehouse Filter Dropdown Modal ─── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.filterModalCard}>
            <Text style={styles.filterModalTitle}>Select Warehouse Scope</Text>
            {WAREHOUSE_OPTIONS.map((wh) => {
              const isSelected = selectedWHFilter === wh;
              return (
                <TouchableOpacity
                  key={wh}
                  style={[styles.filterOptionRow, isSelected && styles.filterOptionRowActive]}
                  onPress={() => {
                    setSelectedWHFilter(wh);
                    if (wh !== 'All Warehouses') {
                      setSelectedWHName(`${wh} Warehouse`);
                    }
                    setShowFilterModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextActive]}>
                    {wh}
                  </Text>
                  {isSelected && <Text style={styles.filterCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.headerBg,
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollPad: {
    paddingBottom: 24,
  },

  // ─── Header Banner ───
  headerBanner: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerGreetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  notificationBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 6,
  },
  whFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PALETTE.headerPillBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 12,
  },
  whFilterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Content Body ───
  contentBody: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeading: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    marginBottom: 10,
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  // ─── KPI Grid (Today's Overview) ───
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: PALETTE.textInk,
    marginTop: 6,
    letterSpacing: -0.4,
  },
  kpiSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  kpiLink: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
    marginTop: 8,
  },
  kpiInfoBanner: {
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
  },
  kpiInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#5C4E46',
    lineHeight: 17,
    fontWeight: '500',
  },

  // ─── Warehouse Progress Cards ───
  whProgressCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginBottom: 8,
  },
  whProgressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  whProgressTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#EBE5DC',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // ─── Operations Card ───
  operationsCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  operationsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A3E38',
  },

  // ─── Alert Card ───
  alertCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  alertSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },

  // ─── Recent Activity ───
  recentActivityCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  activitySub: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    fontWeight: '500',
  },
  activityDivider: {
    height: 1,
    backgroundColor: PALETTE.borderLight,
  },

  // ─── Quick Actions ───
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  quickActionCard: {
    width: '48.5%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    textAlign: 'center',
  },

  // ─── Disclaimer ───
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    lineHeight: 16,
    fontWeight: '500',
  },

  // ─── Bottom Tab Bar ───
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  tabLabelActive: {
    color: PALETTE.tabActive,
    fontWeight: '700',
  },

  // ─── Filter Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  filterModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 14,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  filterOptionRowActive: {
    backgroundColor: PALETTE.primarySoft,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  filterOptionTextActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  filterCheckmark: {
    fontSize: 15,
    fontWeight: '900',
    color: PALETTE.primary,
  },
});
