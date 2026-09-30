import React, { useState } from 'react';
import {
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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (Primary Brand Color: #F0562A) ────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  categoryTitle: '#8B5E3C',
  infoBg:        '#EFF6FF',
  infoBorder:    '#BFDBFE',
  infoText:      '#1E40AF',

  amberBg:       '#FEF3C7',
  amberBorder:   '#FDE68A',
  amberText:     '#B45309',

  greenBadge:    '#DCFCE7',
  greenText:     '#15803D',
  redBadge:      '#FEE2E2',
  redText:       '#DC2626',
  blueBadge:     '#DBEAFE',
  blueText:      '#1D4ED8',

  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';
type ReportScreenType =
  | 'main'
  | 'sales_report'
  | 'inventory_report'
  | 'receiving_report'
  | 'customer_report'
  | 'cash_topup_report'
  | 'revenue_report'
  | 'expense_report'
  | 'export_report'
  | 'summary_report'
  | 'returns_report';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function RadioCircleIcon({ selected }: { selected: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="9"
        stroke={selected ? PALETTE.primary : '#D1D5DB'}
        strokeWidth="2"
        fill={selected ? PALETTE.primary : 'none'}
      />
      {selected && <Circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />}
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReportDocHeaderIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellHeaderIcon() {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockBadgeIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" stroke="#FFFFFF" strokeWidth="2.2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ShieldInfoIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="#1E40AF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 16, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterIcon({ size = 16, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

export interface SubWarehouseReportsScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onSelectReport?: ((reportKey: string) => void) | undefined;
}

export function SubWarehouseReportsScreen({
  onBack,
  onTabChange,
  onNavigateToNotifications,
  onSelectReport,
}: SubWarehouseReportsScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<ReportScreenType>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'Today' | 'Week' | 'Month'>('Today');

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

  // Revenue filter
  const [revFilter, setRevFilter] = useState<'All' | 'Sales' | 'Top-Ups' | 'Refunds'>('All');
  const [revChartPeriod, setRevChartPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Export report selection
  const [selectedExportReport, setSelectedExportReport] = useState<string>('Sales Report');

  // Daily / Monthly Summary filter
  const [summaryMode, setSummaryMode] = useState<'Daily' | 'Monthly'>('Daily');
  const [summaryMetric, setSummaryMetric] = useState<'Sales' | 'Orders' | 'Revenue' | 'Expenses' | 'Returns'>('Sales');

  // Returns filter
  const [returnCategory, setReturnCategory] = useState<'All' | 'Quality' | 'Quantity' | 'Missing' | 'Wrong' | 'Damaged' | 'Late'>('All');

  const handleTabPress = (tab: SubWHTab) => {
    if (tab === 'More' && onBack) {
      if (currentScreen !== 'main') {
        setCurrentScreen('main');
      } else {
        onBack();
      }
      return;
    }
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const handleReportClick = (code: string) => {
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
        Alert.alert('Report', `Opening report ${code} for Coonoor Warehouse...`);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 1: SALES REPORT (M12-S02)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'sales_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'You have 3 unread notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellHeaderIcon />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
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

          {/* Channel Filters */}
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

          {/* Info Notice Box */}
          <View style={styles.blueInfoBox}>
            <Text style={styles.blueInfoText}>
              A channel unavailable to SWA for the selected period shows zero/empty — records are never invented to fill a gap.
            </Text>
          </View>

          {/* Search Input with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color="#9E9690" />
            <TextInput
              style={styles.searchInput}
              placeholder="Order ID, Invoice, Customer, Product"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterIcon size={16} color="#9E9690" />
          </View>

          {/* Sales Transaction Cards */}
          <View style={styles.recordsStack}>
            <TouchableOpacity style={styles.recordCard} activeOpacity={0.75} onPress={() => Alert.alert('Order ORD-10284', 'Customer #C1024 · Online · 4 items · ₹1,240')}>
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

            <TouchableOpacity style={styles.recordCard} activeOpacity={0.75} onPress={() => Alert.alert('Order ORD-10283', 'Walk-in Buyer · Market · 2 items · ₹850')}>
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

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 2: INVENTORY REPORT (M12-S03)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'inventory_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'You have 3 unread notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellHeaderIcon />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
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

          {/* Blue Info Notice Box */}
          <View style={styles.blueInfoBox}>
            <Text style={styles.blueInfoText}>
              Low/out-of-stock thresholds come from backend configuration — never hard-coded business thresholds.
            </Text>
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
            <SearchIcon size={16} color="#9E9690" />
            <TextInput
              style={styles.searchInput}
              placeholder="Product, code, batch, location"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterIcon size={16} color="#9E9690" />
          </View>

          {/* Produce Inventory Items */}
          <View style={styles.recordsStack}>
            <TouchableOpacity style={styles.recordCard} activeOpacity={0.75} onPress={() => Alert.alert('Carrot — Grade 1', 'Cold Storage A · Batch BAT-CR-0245 · 420 kg Available')}>
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>Carrot — Grade 1</Text>
                <View style={styles.greenBadgePill}>
                  <Text style={styles.greenBadgeText}>Available</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Cold Storage A · Batch BAT-CR-0245</Text>
              <Text style={styles.recordAmountText}>420 kg</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.recordCard} activeOpacity={0.75} onPress={() => Alert.alert('Nilgiris Potato', 'Zone 2 - Bay 4 · Batch BAT-PT-0189 · 1,250 kg Available')}>
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>Nilgiris Potato</Text>
                <View style={styles.greenBadgePill}>
                  <Text style={styles.greenBadgeText}>Available</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Zone 2 - Bay 4 · Batch BAT-PT-0189</Text>
              <Text style={styles.recordAmountText}>1,250 kg</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.recordCard} activeOpacity={0.75} onPress={() => Alert.alert('Tomato — Grade 1', 'Cold Storage B · Batch BAT-TM-0312 · 45 kg Low Stock')}>
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>Tomato — Grade 1</Text>
                <View style={[styles.badgePillBase, { backgroundColor: PALETTE.amberBg }]}>
                  <Text style={[styles.badgeTextBase, { color: PALETTE.amberText }]}>Low Stock</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Cold Storage B · Batch BAT-TM-0312</Text>
              <Text style={[styles.recordAmountText, { color: PALETTE.amberText }]}>45 kg</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 3: RECEIVING REPORT (M12-S04)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'receiving_report') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'You have 3 unread notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellHeaderIcon />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
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
            <SearchIcon size={16} color="#9E9690" />
            <TextInput
              style={styles.searchInput}
              placeholder="GR ID, Farmer ref, Product, Batch"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterIcon size={16} color="#9E9690" />
          </View>

          {/* Orange Info Box */}
          <View style={styles.orangeInfoBox}>
            <Text style={styles.orangeInfoText}>
              Farmer reference is only shown if the SWA role is actually permitted to see it.
            </Text>
          </View>

          {/* Receiving Report Items */}
          <View style={styles.recordsStack}>
            <TouchableOpacity style={styles.recordCard} activeOpacity={0.75} onPress={() => Alert.alert('GR-00245', 'Carrot — Grade 1 · Received 420 kg · Accepted 400 kg (QC Accepted)')}>
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

            <TouchableOpacity style={styles.recordCard} activeOpacity={0.75} onPress={() => Alert.alert('GR-00244', 'Nilgiris Potato · Received 1,250 kg · Accepted 1,250 kg (QC Accepted)')}>
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

            <TouchableOpacity style={styles.recordCard} activeOpacity={0.75} onPress={() => Alert.alert('GR-00243', 'Tomato — Grade 2 · Received 320 kg · Rejected 320 kg (QC Rejected)')}>
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordIdText}>GR-00243</Text>
                <View style={[styles.badgePillBase, { backgroundColor: PALETTE.redBadge }]}>
                  <Text style={[styles.badgeTextBase, { color: PALETTE.redText }]}>QC Rejected</Text>
                </View>
              </View>
              <Text style={styles.recordSubText}>Tomato — Grade 2</Text>
              <View style={styles.receivingAmountRow}>
                <Text style={styles.receivedQtyMuted}>Received 320 kg</Text>
                <Text style={[styles.acceptedQtyBold, { color: PALETTE.redText }]}>Rejected 320 kg</Text>
              </View>
              <Text style={styles.recordDateText}>24 Sep 2026 · 04:45 PM</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 4: CUSTOMER REPORT (M12-S05)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'customer_report') {
    const CUSTOMER_DATA = [
      { id: 'CUS-10284', name: 'Customer #10284', channel: 'Online', orders: 12, lastOrder: '24 Sep 2026', totalSpent: '₹8,450', mobile: '+91 98765 43210' },
      { id: 'CUS-10283', name: 'Customer #10283', channel: 'Market', orders: 8, lastOrder: '24 Sep 2026', totalSpent: '₹5,120', mobile: '+91 98421 11223' },
      { id: 'CUS-10280', name: 'Customer #10280', channel: 'B2B', orders: 24, lastOrder: '23 Sep 2026', totalSpent: '₹22,800', mobile: '+91 99432 55667' },
      { id: 'CUS-10275', name: 'Customer #10275', channel: 'Online', orders: 5, lastOrder: '22 Sep 2026', totalSpent: '₹3,450', mobile: '+91 97890 12345' },
      { id: 'CUS-10268', name: 'Customer #10268', channel: 'Market', orders: 19, lastOrder: '21 Sep 2026', totalSpent: '₹14,200', mobile: '+91 96554 78901' },
      { id: 'CUS-10260', name: 'Customer #10260', channel: 'B2B', orders: 31, lastOrder: '20 Sep 2026', totalSpent: '₹38,900', mobile: '+91 94432 99881' },
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
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'You have 3 unread notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellHeaderIcon />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
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
            <SearchIcon size={16} color="#9E9690" />
            <TextInput
              style={styles.searchInput}
              placeholder="Customer ID, name, mobile"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterIcon size={16} color="#9E9690" />
          </View>

          {/* Customer Records Stack */}
          <View style={styles.recordsStack}>
            {filteredCustomers.map((cust) => (
              <TouchableOpacity
                key={cust.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() =>
                  Alert.alert(
                    cust.id,
                    `${cust.name}\nChannel: ${cust.channel}\nOrders: ${cust.orders}\nTotal Revenue: ${cust.totalSpent}\nLast Order: ${cust.lastOrder}\nMobile: ${cust.mobile}`
                  )
                }
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

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 5: CASH TOP-UP REPORT (M12-S06)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'cash_topup_report') {
    const TOPUP_DATA = [
      { id: 'TOP-002845', customer: 'Customer CUS-1024 · Cash', amount: '₹2,000', auth: 'SWA', status: 'Completed', time: '10:24 AM', period: 'Today' },
      { id: 'TOP-002844', customer: 'Customer CUS-1018 · Cash', amount: '₹1,500', auth: 'SWA', status: 'Completed', time: '09:40 AM', period: 'Today' },
      { id: 'TOP-002843', customer: 'Customer CUS-1092 · Cash', amount: '₹5,000', auth: 'SWA', status: 'Completed', time: '08:15 AM', period: 'Today' },
      { id: 'TOP-002840', customer: 'Customer CUS-0984 · Cash', amount: '₹3,000', auth: 'SWA', status: 'Completed', time: '24 Sep 2026 · 05:10 PM', period: 'This Month' },
      { id: 'TOP-002838', customer: 'Customer CUS-1002 · Cash', amount: '₹7,000', auth: 'SWA', status: 'Completed', time: '24 Sep 2026 · 02:30 PM', period: 'This Month' },
      { id: 'TOP-002835', customer: 'Customer CUS-0950 · Cash', amount: '₹10,000', auth: 'SWA', status: 'Completed', time: '23 Sep 2026 · 11:00 AM', period: 'This Month' },
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
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'You have 3 unread notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellHeaderIcon />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
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

          {/* Blue Info Notice Box */}
          <View style={styles.blueInfoBox}>
            <Text style={styles.blueInfoText}>
              The ₹10,000 per-transaction cash top-up limit is validated server-side, not merely shown in this report's UI.
            </Text>
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
            <SearchIcon size={16} color="#9E9690" />
            <TextInput
              style={styles.searchInput}
              placeholder="Top-up ID, Customer ID, Reference"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterIcon size={16} color="#9E9690" />
          </View>

          {/* Top-Up Record Cards */}
          <View style={styles.recordsStack}>
            {filteredTopups.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() =>
                  Alert.alert(
                    item.id,
                    `${item.customer}\nAmount: ${item.amount}\nAuthorized By: ${item.auth}\nStatus: ${item.status}\nTime: ${item.time}`
                  )
                }
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

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
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
        type: 'Market Sale',
        order: 'Order ORD-10284',
        amount: '₹3,450',
        paymentMethod: 'Wallet',
        status: 'Completed',
      },
      {
        id: 'REV-000844',
        type: 'Online Order',
        order: 'Order ORD-10280',
        amount: '₹1,850',
        paymentMethod: 'UPI',
        status: 'Completed',
      },
      {
        id: 'REV-000842',
        type: 'Market Sale',
        order: 'Order ORD-10275',
        amount: '₹4,200',
        paymentMethod: 'Card',
        status: 'Completed',
      },
      {
        id: 'REV-000840',
        type: 'Online Order',
        order: 'Order ORD-10268',
        amount: '₹6,100',
        paymentMethod: 'Cash',
        status: 'Completed',
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
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'You have 3 unread notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellHeaderIcon />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
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

          {/* Blue Info Notice Box */}
          <View style={styles.blueInfoBox}>
            <Text style={styles.blueInfoText}>
              Only channels the system actually returns values for are shown — HORECA/B2B display as unavailable rather than a fabricated ₹0.
            </Text>
          </View>

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color="#9E9690" />
            <TextInput
              style={styles.searchInput}
              placeholder="Revenue ID, Order ID..."
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterIcon size={16} color="#9E9690" />
          </View>

          {/* Revenue Records Stack */}
          <View style={styles.recordsStack}>
            {filteredRevenue.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() =>
                  Alert.alert(
                    item.id,
                    `${item.type} · ${item.order}\nAmount: ${item.amount}\nPayment: ${item.paymentMethod}\nStatus: ${item.status}`
                  )
                }
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.id}</Text>
                  <View style={styles.greenBadgePill}>
                    <Text style={styles.greenBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.recordSubText}>{item.type} · {item.order}</Text>
                <View style={styles.topupAmountRow}>
                  <Text style={[styles.topupAmountBold, { color: PALETTE.greenText }]}>{item.amount}</Text>
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

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
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
        vendor: 'Green Valley Logistics',
      },
      {
        id: 'EXP-001244',
        category: 'Loading',
        voucher: 'Voucher VCH-000820',
        amount: '₹1,800',
        status: 'Recorded',
        date: '25 Sep 2026',
        vendor: 'Coonoor Local Handlers',
      },
      {
        id: 'EXP-001243',
        category: 'Maintenance',
        voucher: 'Voucher VCH-000818',
        amount: '₹4,200',
        status: 'Recorded',
        date: '24 Sep 2026',
        vendor: 'CoolTech Ref Services',
      },
      {
        id: 'EXP-001240',
        category: 'Other',
        voucher: 'Voucher VCH-000815',
        amount: '₹3,500',
        status: 'Pending',
        date: '24 Sep 2026',
        vendor: 'Nilgiris Packaging Supplies',
      },
    ];

    const filteredExpenses = EXPENSE_DATA.filter((item) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.voucher.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.vendor.toLowerCase().includes(q)
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
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'You have 3 unread notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellHeaderIcon />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
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

          {/* Blue Info Notice Box */}
          <View style={styles.blueInfoBox}>
            <Text style={styles.blueInfoText}>
              Categories always mirror what's configured in Expense Categories (Module 11, S06) — this report never invents its own category list.
            </Text>
          </View>

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color="#9E9690" />
            <TextInput
              style={styles.searchInput}
              placeholder="Expense ID, Voucher ID, Vendor"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterIcon size={16} color="#9E9690" />
          </View>

          {/* Expense Records Stack */}
          <View style={styles.recordsStack}>
            {filteredExpenses.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() =>
                  Alert.alert(
                    item.id,
                    `${item.category} · ${item.voucher}\nAmount: ${item.amount}\nVendor: ${item.vendor}\nStatus: ${item.status}\nDate: ${item.date}`
                  )
                }
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.id}</Text>
                  <View
                    style={
                      item.status === 'Recorded'
                        ? styles.expenseRecordedBadge
                        : [styles.badgePillBase, { backgroundColor: PALETTE.amberBg }]
                    }
                  >
                    <Text
                      style={
                        item.status === 'Recorded'
                          ? styles.expenseRecordedText
                          : [styles.badgeTextBase, { color: PALETTE.amberText }]
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

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SCREEN 8: EXPORT REPORT (M12-S11)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentScreen === 'export_report') {
    const EXPORT_OPTIONS = [
      'Sales Report',
      'Inventory Report',
      'Receiving Report',
      'Customer Report',
      'Cash Top-Up Report',
      'Expense Report',
      'Revenue Report',
      'Returns Report',
      'Daily/Monthly Summary',
    ];

    const handleNextStep = () => {
      Alert.alert(
        'Export Report',
        `Selected: ${selectedExportReport}\nScope: Coonoor Warehouse\n\nChoose an export format to proceed:`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Download CSV',
            onPress: () =>
              Alert.alert('Export Generated', `${selectedExportReport} CSV downloaded successfully for Coonoor Warehouse.`),
          },
          {
            text: 'Download PDF',
            onPress: () =>
              Alert.alert('Export Generated', `${selectedExportReport} PDF report generated successfully.`),
          },
        ]
      );
    };

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Export Report</Text>
            </View>
          </View>

          {/* Warehouse Lock Sub-pill */}
          <View style={styles.warehouseLockSubRow}>
            <View style={styles.warehouseLockPill}>
              <LockBadgeIcon />
              <Text style={styles.warehouseLockPillText}>Coonoor Warehouse</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.exportScrollContent} showsVerticalScrollIndicator={false}>
          {/* Step Indicator Dots (5 dots) */}
          <View style={styles.stepDotsRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
            <View style={styles.stepDot} />
          </View>

          {/* Step 1 Title */}
          <Text style={styles.stepHeaderTitle}>Step 1 — Select Report</Text>

          {/* Report Options Card Stack */}
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

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom Next Button Container */}
        <View style={styles.exportBottomBar}>
          <TouchableOpacity
            style={styles.nextActionButton}
            activeOpacity={0.8}
            onPress={handleNextStep}
          >
            <ArrowRightIcon size={18} color="#FFFFFF" />
            <Text style={styles.nextActionButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
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
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Daily / Monthly Summary</Text>
            </View>
          </View>

          {/* Warehouse Lock Sub-pill */}
          <View style={styles.warehouseLockSubRow}>
            <View style={styles.warehouseLockPill}>
              <LockBadgeIcon />
              <Text style={styles.warehouseLockPillText}>Coonoor Warehouse</Text>
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

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
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
        order: 'Order ORD-10284',
        category: 'Damaged',
        affectedQty: 'Affected Qty 2',
        status: 'Approved',
        resolution: 'Refund Completed',
        resolutionColor: PALETTE.greenText,
      },
      {
        id: 'RMA-00244',
        order: 'Order ORD-10279',
        category: 'Quality',
        affectedQty: 'Affected Qty 5 kg',
        status: 'Approved',
        resolution: 'Replacement Dispatched',
        resolutionColor: PALETTE.greenText,
      },
      {
        id: 'RMA-00243',
        order: 'Order ORD-10265',
        category: 'Missing',
        affectedQty: 'Affected Qty 1',
        status: 'Pending',
        resolution: 'Under Review',
        resolutionColor: PALETTE.amberText,
      },
      {
        id: 'RMA-00240',
        order: 'Order ORD-10250',
        category: 'Wrong',
        affectedQty: 'Affected Qty 3 kg',
        status: 'Rejected',
        resolution: 'Dispute Closed',
        resolutionColor: PALETTE.redText,
      },
      {
        id: 'RMA-00238',
        order: 'Order ORD-10242',
        category: 'Quantity',
        affectedQty: 'Affected Qty 4 kg',
        status: 'Approved',
        resolution: 'Wallet Credited',
        resolutionColor: PALETTE.greenText,
      },
      {
        id: 'RMA-00235',
        order: 'Order ORD-10231',
        category: 'Late',
        affectedQty: 'Affected Qty 10 kg',
        status: 'Pending',
        resolution: 'Carrier Tracing',
        resolutionColor: PALETTE.amberText,
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
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentScreen('main')}
                activeOpacity={0.75}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>

            <TouchableOpacity
              style={styles.headerBellBtn}
              onPress={() => {
                if (onNavigateToNotifications) onNavigateToNotifications();
                else Alert.alert('Notifications', 'You have 3 unread notifications.');
              }}
              activeOpacity={0.8}
            >
              <BellHeaderIcon />
              <View style={styles.notifBadgeDot} />
            </TouchableOpacity>
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

          {/* Blue Info Notice Box */}
          <View style={styles.blueInfoBox}>
            <Text style={styles.blueInfoText}>
              The same six issue categories used in Module 10 are used consistently here.
            </Text>
          </View>

          {/* Search Bar with Filter Icon */}
          <View style={styles.searchBarWrap}>
            <SearchIcon size={16} color="#9E9690" />
            <TextInput
              style={styles.searchInput}
              placeholder="RMA ID, Order ID, Customer ID, Ticket ID"
              placeholderTextColor="#9E9690"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FilterIcon size={16} color="#9E9690" />
          </View>

          {/* Returns Records Stack */}
          <View style={styles.recordsStack}>
            {filteredReturns.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recordCard}
                activeOpacity={0.75}
                onPress={() =>
                  Alert.alert(
                    item.id,
                    `${item.order} · ${item.category}\nStatus: ${item.status}\n${item.affectedQty}\nResolution: ${item.resolution}`
                  )
                }
              >
                <View style={styles.recordHeaderRow}>
                  <Text style={styles.recordIdText}>{item.id}</Text>
                  <View
                    style={[
                      styles.badgePillBase,
                      {
                        backgroundColor:
                          item.status === 'Approved'
                            ? PALETTE.greenBadge
                            : item.status === 'Pending'
                            ? PALETTE.amberBg
                            : PALETTE.redBadge,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeTextBase,
                        {
                          color:
                            item.status === 'Approved'
                              ? PALETTE.greenText
                              : item.status === 'Pending'
                              ? PALETTE.amberText
                              : PALETTE.redText,
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

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Home')} activeOpacity={0.75}>
            <HomeTabIcon active={false} />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Receiving')} activeOpacity={0.75}>
            <ReceivingTabIcon active={false} />
            <Text style={styles.navLabel}>Receiving</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('Inventory')} activeOpacity={0.75}>
            <InventoryTabIcon active={false} />
            <Text style={styles.navLabel}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('More')} activeOpacity={0.75}>
            <MoreTabIcon active={true} />
            <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT: MAIN WAREHOUSE REPORTS DIRECTORY (M12-S01)
  // ═══════════════════════════════════════════════════════════════════════════

  const REPORT_SECTIONS = [
    {
      category: 'SALES',
      reports: [
        { title: 'Sales Report', code: 'SALES_REPORT' },
      ],
    },
    {
      category: 'INVENTORY',
      reports: [
        { title: 'Inventory Report', code: 'INVENTORY_REPORT' },
      ],
    },
    {
      category: 'WAREHOUSE',
      reports: [
        { title: 'Receiving Report', code: 'RECEIVING_REPORT' },
      ],
    },
    {
      category: 'CUSTOMERS',
      reports: [
        { title: 'Customer Report', code: 'CUSTOMER_REPORT' },
      ],
    },
    {
      category: 'FINANCE',
      reports: [
        { title: 'Revenue Report', code: 'REVENUE_REPORT' },
        { title: 'Expense Report', code: 'EXPENSE_REPORT' },
        { title: 'Cash Top-Up Report', code: 'CASH_TOPUP_REPORT' },
      ],
    },
    {
      category: 'RETURNS',
      reports: [
        { title: 'Returns Report', code: 'RETURNS_REPORT' },
      ],
    },
    {
      category: 'SUMMARY',
      reports: [
        { title: 'Daily / Monthly Summary', code: 'SUMMARY_REPORT' },
        { title: 'Export Report', code: 'EXPORT_REPORT' },
      ],
    },
  ];

  const query = searchQuery.trim().toLowerCase();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner (#F0562A Regular Colour) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerLeftGroup}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.75}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <ArrowBackIcon size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.headerTitleRow}>
              <ReportDocHeaderIcon size={22} color="#FFFFFF" />
              <Text style={styles.headerTitleText}>Reports</Text>
            </View>
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
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>
        </View>

        {/* Warehouse & Date Scope Pill */}
        <TouchableOpacity
          style={styles.warehouseBadgeRow}
          onPress={() => {
            const next = timeFilter === 'Today' ? 'Week' : timeFilter === 'Week' ? 'Month' : 'Today';
            setTimeFilter(next);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.warehouseBadge}>
            <LockBadgeIcon />
            <Text style={styles.warehouseBadgeText}>Coonoor Warehouse · {timeFilter} ▾</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ─── Main Content Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. KPI Metric Cards (2 Columns Grid) ─── */}
        <View style={styles.kpiGrid}>
          {/* Today's Sales */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TODAY'S SALES</Text>
            <Text style={styles.kpiValue}>₹24,850</Text>
          </View>

          {/* Inventory */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>INVENTORY</Text>
            <Text style={styles.kpiValue}>12,480 kg</Text>
          </View>

          {/* Received Today */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>RECEIVED TODAY</Text>
            <Text style={styles.kpiValue}>2,850 kg</Text>
          </View>

          {/* Customers Served */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CUSTOMERS SERVED</Text>
            <Text style={styles.kpiValue}>126</Text>
          </View>

          {/* Cash Top-Up */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CASH TOP-UP</Text>
            <Text style={styles.kpiValue}>₹18,500</Text>
          </View>

          {/* Expenses */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>EXPENSES</Text>
            <Text style={styles.kpiValue}>₹6,420</Text>
          </View>

          {/* Returns (Full Width Card) */}
          <View style={[styles.kpiCard, styles.kpiCardFull]}>
            <Text style={styles.kpiLabel}>RETURNS</Text>
            <Text style={styles.kpiValue}>8</Text>
          </View>
        </View>

        {/* ─── 2. Search Reports Input ─── */}
        <View style={styles.searchBarWrap}>
          <SearchIcon size={17} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── 3. Categorized Reports List ─── */}
        {REPORT_SECTIONS.map((sec) => {
          const filteredReports = sec.reports.filter(
            (r) => !query || r.title.toLowerCase().includes(query)
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
                    activeOpacity={0.75}
                  >
                    <Text style={styles.reportName}>{report.title}</Text>
                    <ChevronRightIcon size={16} color={PALETTE.categoryTitle} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        {/* ─── 4. Sub-Warehouse Strict Lock Banner ─── */}
        <View style={styles.lockNoticeCard}>
          <View style={styles.lockNoticeIconWrap}>
            <ShieldInfoIcon />
          </View>
          <Text style={styles.lockNoticeText}>
            Warehouse: Coonoor is locked here and everywhere in this module — enforced server-side, not just visually.
          </Text>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('More')}
          activeOpacity={0.75}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  warehouseBadgeRow: {
    marginTop: 2,
  },
  warehouseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerBellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
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
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiCardFull: {
    width: '100%',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
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
    borderRadius: 18,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  filterChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  blueInfoBox: {
    backgroundColor: PALETTE.infoBg,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  blueInfoText: {
    fontSize: 12,
    color: PALETTE.infoText,
    lineHeight: 16,
    fontWeight: '500',
  },
  orangeInfoBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  orangeInfoText: {
    fontSize: 12,
    color: '#C2410C',
    lineHeight: 16,
    fontWeight: '500',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: PALETTE.textInk,
    padding: 0,
    margin: 0,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  categoryHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: PALETTE.categoryTitle,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
  },
  reportsStack: {
    gap: 10,
  },
  reportRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  reportName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  recordsStack: {
    gap: 10,
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  recordSubText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  recordAmountText: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  recordDateText: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  receivingAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 4,
  },
  receivedQtyMuted: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  acceptedQtyBold: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.greenText,
  },
  returnResolutionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 2,
  },
  returnQtyText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  returnResolutionText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  custOrdersText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
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
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  swaTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  badgePillBase: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeTextBase: {
    fontSize: 11,
    fontWeight: '700',
  },
  greenBadgePill: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  greenBadgeText: {
    color: PALETTE.greenText,
    fontSize: 11,
    fontWeight: '700',
  },
  breakdownSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 10,
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  breakdownValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  expenseRecordedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  expenseRecordedText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  expenseAmountRed: {
    fontSize: 17,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 2,
  },
  chartBoxContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  chartSubtitle: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  summaryToggleWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  summaryToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryToggleBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  summaryToggleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  summaryToggleTextActive: {
    color: PALETTE.textInk,
    fontWeight: '700',
  },
  summaryDateBox: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  summaryDateBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5E3C',
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 2,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  financeLabel: {
    fontSize: 13.5,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  financeVal: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  financeNetLabel: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  financeNetVal: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.greenText,
  },
  chartSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 10,
  },
  chartTabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chartTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  chartTabBtnActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  chartTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  chartTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chartContainerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 16,
  },
  barGraphArea: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
    marginBottom: 10,
  },
  barColumn: {
    alignItems: 'center',
    gap: 4,
  },
  barValueText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  barVisual: {
    width: 28,
    borderRadius: 6,
    backgroundColor: PALETTE.primary,
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  chartDescText: {
    fontSize: 11.5,
    color: PALETTE.textMuted,
    textAlign: 'center',
  },
  lockNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.infoBg,
    borderWidth: 1,
    borderColor: PALETTE.infoBorder,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
    gap: 10,
  },
  lockNoticeIconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockNoticeText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.infoText,
    lineHeight: 17,
    fontWeight: '500',
  },
  warehouseLockSubRow: {
    marginTop: 4,
  },
  warehouseLockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  warehouseLockPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#D1D5DB',
  },
  stepDotActive: {
    backgroundColor: PALETTE.primary,
  },
  stepHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 14,
    marginLeft: 2,
  },
  exportCardContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.textInk,
    flex: 1,
  },
  exportOptionTextSelected: {
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  exportRowDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
  },
  exportBottomBar: {
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 20,
  },
  nextActionButton: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  nextActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minWidth: 60,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
