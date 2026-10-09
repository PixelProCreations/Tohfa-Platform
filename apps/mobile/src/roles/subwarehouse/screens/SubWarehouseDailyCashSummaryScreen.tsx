import React, { useState } from 'react';
import {
  Alert,
  Platform,
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

const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EAE6DF',
  divider:       '#F0ECE4',

  greenBadge:    '#DCFCE7',
  greenText:     '#15803D',
  amberBadge:    '#FEF3C7',
  amberText:     '#B45309',
  brownAccent:   '#8B4513',

  tabInactive:   '#7A726C',
  tabBorder:     '#EAE6DF',
};

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

function CalendarIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowDownIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M19 12l-7 7-7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExportIcon({ size = 18, color = '#8B4513' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 6l-4-4-4 4M12 2v13"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : '#7A726C';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : '#7A726C';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M12 7v7.5M8.5 11.5L12 15l3.5-3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 18h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : '#7A726C';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.5 4A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a2.5 2.5 0 0 0 2.5-2.5v-11A2.5 2.5 0 0 0 18.5 4h-13z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M3 9.5h18" stroke={color} strokeWidth="1.8" />
      <Path d="M10 13.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : '#7A726C';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        fill={color}
      />
    </Svg>
  );
}

export interface SubWarehouseDailyCashSummaryScreenProps {
  onBack?: () => void;
  onViewTopUpHistory?: () => void;
  onNavigateToDailyCash?: () => void;
  onTabChange?: (tab: 'Home' | 'Receiving' | 'Inventory' | 'More') => void;
}

export function SubWarehouseDailyCashSummaryScreen({
  onBack,
  onViewTopUpHistory,
  onNavigateToDailyCash,
  onTabChange,
}: SubWarehouseDailyCashSummaryScreenProps) {
  const [physicalCount, setPhysicalCount] = useState('18500');

  const parsedPhysical = parseInt(physicalCount.replace(/[^0-9]/g, '') || '0', 10);
  const variance = parsedPhysical - 18500;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Back"
        >
          <ArrowBackIcon size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Cash Summary</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selector Card */}
        <TouchableOpacity
          style={styles.dateSelectorCard}
          onPress={() => Alert.alert('Select Date', 'Choose summary date to inspect.')}
          activeOpacity={0.8}
        >
          <Text style={styles.dateSelectorText}>Today · 25 Sep 2026</Text>
          <CalendarIcon size={18} color={PALETTE.textSecondary} />
        </TouchableOpacity>

        {/* 3 KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>24</Text>
            <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>23</Text>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>1</Text>
            <Text style={styles.kpiLabel}>PENDING</Text>
          </View>
        </View>

        {/* Total Cash Received Card - Centered as requested */}
        <View style={styles.totalCashCard}>
          <Text style={styles.totalCashTitle}>Total Cash Received</Text>
          <Text style={styles.totalCashAmount}>₹18,500</Text>
        </View>

        {/* Cash Breakdown */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Cash Breakdown</Text>
          <Text style={styles.sectionSubMuted}>Where recorded</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>₹500 × 3</Text>
            <Text style={styles.denomAmount}>₹1,500</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>₹1,000 × 7</Text>
            <Text style={styles.denomAmount}>₹7,000</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>₹2,000 × 8</Text>
            <Text style={styles.denomAmount}>₹16,000</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>₹5,000 × 1</Text>
            <Text style={styles.denomAmount}>₹5,000</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.denomLabel}>Other × 5</Text>
            <Text style={styles.denomAmount}>—</Text>
          </View>
        </View>

        {/* System vs. Physical Cash */}
        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>System vs. Physical Cash</Text>
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 20 }]}>
          <Text style={styles.systemCashNumber}>₹18,500</Text>
          <Text style={styles.systemCashLabel}>SYSTEM RECORDED</Text>

          <View style={styles.downArrowWrap}>
            <ArrowDownIcon size={18} color={PALETTE.textSecondary} />
          </View>

          <Text style={styles.systemCashNumber}>₹18,500</Text>
          <Text style={styles.systemCashLabel}>PHYSICAL COUNTED</Text>

          <View style={styles.downArrowWrap}>
            <ArrowDownIcon size={18} color={PALETTE.textSecondary} />
          </View>

          <Text style={styles.varianceNumber}>₹{Math.abs(variance)}</Text>
          <Text style={styles.systemCashLabel}>VARIANCE</Text>
        </View>

        {/* Physical Cash Counted */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Physical Cash Counted</Text>
          <Text style={styles.sectionSubMuted}>If supported</Text>
        </View>

        <View style={styles.physicalCountBox}>
          <TextInput
            style={styles.physicalInput}
            value={physicalCount}
            onChangeText={setPhysicalCount}
            keyboardType="numeric"
          />
          <Text style={styles.rupeeSymbol}>₹</Text>
        </View>

        {/* Reconciliation Status */}
        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Reconciliation Status</Text>
        <View style={{ alignItems: 'flex-start', marginBottom: 16 }}>
          <TouchableOpacity
            style={styles.reconciledBadge}
            onPress={() => {
              if (onNavigateToDailyCash) onNavigateToDailyCash();
            }}
            activeOpacity={onNavigateToDailyCash ? 0.75 : 1}
          >
            <Text style={styles.reconciledText}>Reconciled</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction Breakdown */}
        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Transaction Breakdown</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>24</Text>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>1</Text>
            <Text style={styles.kpiLabel}>PENDING</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>0</Text>
            <Text style={styles.kpiLabel}>FAILED</Text>
          </View>
        </View>

        {/* Top-Up List */}
        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Top-Up List</Text>
        <View style={styles.card}>
          <View style={styles.topUpTopRow}>
            <View>
              <Text style={styles.topUpItemHeader}>10:42 AM · Ravi Kumar</Text>
              <Text style={styles.topUpFiscalCode}>FC-0012</Text>
            </View>
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>Completed</Text>
            </View>
          </View>
          <Text style={styles.topUpAmount}>₹2,000</Text>
        </View>

        {/* View Full Top-Up History Link */}
        <TouchableOpacity
          style={styles.viewFullHistoryBtn}
          onPress={() => {
            if (onViewTopUpHistory) onViewTopUpHistory();
            else Alert.alert('History', 'Navigating to full history...');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.viewFullHistoryText}>View Full Top-Up History →</Text>
        </TouchableOpacity>

        {/* Export */}
        <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>Export</Text>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => Alert.alert('Export Summary', 'Exporting daily cash settlement report (PDF/CSV)...')}
          activeOpacity={0.75}
        >
          <ExportIcon size={18} color={PALETTE.brownAccent} />
          <Text style={styles.exportBtnText}>Export Summary</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange ? onTabChange('Home') : (onBack && onBack())}
          activeOpacity={0.7}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('Receiving')}
          activeOpacity={0.7}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.tabLabel}>Receiving</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('Inventory')}
          activeOpacity={0.7}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.tabLabel}>Inventory</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabChange && onTabChange('More')}
          activeOpacity={0.7}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.tabLabel, styles.tabLabelActive]}>More</Text>
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
  header: {
    backgroundColor: PALETTE.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    fontFamily: 'Poppins',
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
  dateSelectorCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 14,
  },
  dateSelectorText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    fontFamily: 'Poppins',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: PALETTE.textInk,
    fontFamily: 'Poppins',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'Poppins',
  },
  totalCashCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  totalCashTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    fontFamily: 'Poppins',
  },
  totalCashAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 6,
    fontFamily: 'Poppins',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    fontFamily: 'Poppins',
  },
  sectionSubMuted: {
    fontSize: 12.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  denomLabel: {
    fontSize: 14,
    color: PALETTE.textInk,
    fontWeight: '500',
    fontFamily: 'Poppins',
  },
  denomAmount: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    fontFamily: 'Poppins',
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 8,
  },
  systemCashNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.textInk,
    fontFamily: 'Poppins',
  },
  systemCashLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 4,
    letterSpacing: 0.5,
    fontFamily: 'Poppins',
  },
  downArrowWrap: {
    paddingVertical: 10,
  },
  varianceNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.textInk,
    fontFamily: 'Poppins',
  },
  physicalCountBox: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  physicalInput: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
    flex: 1,
    paddingVertical: 0,
    fontFamily: 'Poppins',
  },
  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    fontFamily: 'Poppins',
  },
  reconciledBadge: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  reconciledText: {
    color: PALETTE.greenText,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  topUpTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topUpItemHeader: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.brownAccent,
    fontFamily: 'Poppins',
  },
  topUpFiscalCode: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  topUpAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  completedBadge: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: PALETTE.greenText,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  viewFullHistoryBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginVertical: 10,
  },
  viewFullHistoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.brownAccent,
    fontFamily: 'Poppins',
  },
  exportBtn: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1.5,
    borderColor: PALETTE.primary,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  exportBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: PALETTE.brownAccent,
    fontFamily: 'Poppins',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingHorizontal: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 4,
    fontFamily: 'Poppins',
  },
  tabLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
