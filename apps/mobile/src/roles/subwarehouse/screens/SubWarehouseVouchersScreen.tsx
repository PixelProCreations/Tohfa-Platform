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

import { SubWarehouseVoucherDetailScreen } from './SubWarehouseVoucherDetailScreen';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  peachBg:       '#FDF0EB',
  iconColor:     '#8B5E3C',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textDark:      '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F4EFE9',

  green:         '#059669',
  greenBg:       '#DCFCE7',
  greenText:     '#15803D',
  amberBg:       '#FEF3C7',
  amberText:     '#92400E',
  recordedBg:    '#FDF0EB',
  recordedText:  '#A0522D',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface VoucherRecord {
  id: string;
  type: 'Expense' | 'Revenue';
  title: string;
  amount: number;
  referenceId: string;
  date: string;
  status: 'Recorded' | 'Pending' | 'Completed';
}

const SAMPLE_VOUCHERS: VoucherRecord[] = [
  {
    id: 'VCH-000821',
    type: 'Expense',
    title: 'Expense Voucher · Transport',
    amount: 2400,
    referenceId: 'EXP-001245',
    date: '25 Sep 2026',
    status: 'Recorded',
  },
  {
    id: 'VCH-000820',
    type: 'Revenue',
    title: 'Revenue Voucher · B2B Sale - Taj Hotel',
    amount: 14500,
    referenceId: 'REV-001089',
    date: '25 Sep 2026',
    status: 'Completed',
  },
  {
    id: 'VCH-000819',
    type: 'Expense',
    title: 'Expense Voucher · Loading / Unloading',
    amount: 1800,
    referenceId: 'EXP-001244',
    date: '25 Sep 2026',
    status: 'Pending',
  },
  {
    id: 'VCH-000818',
    type: 'Revenue',
    title: 'Revenue Voucher · Market Day Cash',
    amount: 8200,
    referenceId: 'REV-001088',
    date: '24 Sep 2026',
    status: 'Completed',
  },
  {
    id: 'VCH-000815',
    type: 'Expense',
    title: 'Expense Voucher · Generator Diesel',
    amount: 620,
    referenceId: 'EXP-001238',
    date: '24 Sep 2026',
    status: 'Recorded',
  },
];

export interface SubWarehouseVouchersScreenProps {
  warehouseName?: string | undefined;
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onSelectVoucher?: ((voucher: VoucherRecord) => void) | undefined;
}

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

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function SubWarehouseVouchersScreen({
  warehouseName = 'Coonoor Warehouse',
  onBack,
  onTabChange,
  onSelectVoucher,
}: SubWarehouseVouchersScreenProps) {
  const [filterTab, setFilterTab] = useState<'All' | 'Expense' | 'Revenue'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherRecord | null>(null);

  const handleTabPress = (tab: SubWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (onBack) {
      onBack();
    }
  };

  if (selectedVoucher) {
    return (
      <SubWarehouseVoucherDetailScreen
        voucherId={selectedVoucher.id}
        type={selectedVoucher.type}
        title={selectedVoucher.title}
        amount={selectedVoucher.amount}
        referenceId={selectedVoucher.referenceId}
        date={selectedVoucher.date}
        status={selectedVoucher.status}
        warehouse={warehouseName}
        createdBy="SWA – Suresh"
        paymentMethod={selectedVoucher.type === 'Revenue' ? 'Cash / UPI' : 'Cash'}
        onBack={() => setSelectedVoucher(null)}
        onTabChange={onTabChange}
      />
    );
  }

  const filteredVouchers = SAMPLE_VOUCHERS.filter((vch) => {
    if (filterTab !== 'All' && vch.type !== filterTab) {
      return false;
    }
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      vch.id.toLowerCase().includes(query) ||
      vch.referenceId.toLowerCase().includes(query) ||
      vch.title.toLowerCase().includes(query) ||
      vch.status.toLowerCase().includes(query)
    );
  });

  const getStatusBadgeStyle = (status: VoucherRecord['status']) => {
    switch (status) {
      case 'Completed':
        return { bg: PALETTE.greenBg, text: PALETTE.greenText };
      case 'Pending':
        return { bg: PALETTE.amberBg, text: PALETTE.amberText };
      case 'Recorded':
      default:
        return { bg: PALETTE.recordedBg, text: PALETTE.recordedText };
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Vouchers</Text>
            <Text style={styles.headerSubtitle}>{warehouseName}</Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top 3 KPI Cards Row ─── */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TODAY</Text>
            <Text style={styles.kpiValue}>12</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>PENDING</Text>
            <Text style={styles.kpiValue}>3</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
            <Text style={styles.kpiValue}>9</Text>
          </View>
        </View>

        {/* ─── Filter Pills ─── */}
        <View style={styles.filterPillsRow}>
          {(['All', 'Expense', 'Revenue'] as const).map((tab) => {
            const isActive = filterTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilterTab(tab)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Voucher ID, Expense ID, Revenue ID..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Filters', 'Advanced voucher filter options')}
            activeOpacity={0.7}
          >
            <FilterSlidersIcon size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* ─── Voucher Cards List ─── */}
        <View style={styles.cardsList}>
          {filteredVouchers.map((item) => {
            const badge = getStatusBadgeStyle(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.voucherCard}
                onPress={() => {
                  if (onSelectVoucher) {
                    onSelectVoucher(item);
                  } else {
                    setSelectedVoucher(item);
                  }
                }}
                activeOpacity={0.75}
              >
                {/* Header: ID + Status Badge */}
                <View style={styles.voucherHeaderRow}>
                  <Text style={styles.voucherId}>{item.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Subtitle / Voucher Title */}
                <Text style={styles.voucherTitle}>{item.title}</Text>

                {/* Amount & Reference ID Row */}
                <View style={styles.voucherDetailsRow}>
                  <Text style={styles.voucherAmount}>₹{item.amount.toLocaleString()}</Text>
                  <Text style={styles.voucherRefId}>{item.referenceId}</Text>
                </View>

                {/* Date */}
                <Text style={styles.voucherDate}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Screen Footer Code */}
        <Text style={styles.screenFooterCode}>M11-S07 · Vouchers</Text>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.7}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Receiving')}
          activeOpacity={0.7}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('Inventory')}
          activeOpacity={0.7}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navTab}
          onPress={() => handleTabPress('More')}
          activeOpacity={0.7}
        >
          <MoreTabIcon active={true} />
          <Text style={[styles.navLabel, styles.navLabelActive]}>More</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.primary,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
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

  // ─── 3 KPI Cards Row ───
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textDark,
  },

  // ─── Filter Pills ───
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: PALETTE.peachBg,
    borderColor: PALETTE.primary,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: PALETTE.primaryDark,
    fontWeight: '800',
  },

  // ─── Search Bar ───
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: PALETTE.textDark,
    padding: 0,
  },

  // ─── Cards List ───
  cardsList: {
    gap: 12,
  },
  voucherCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  voucherId: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#B44516',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  voucherTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
    marginBottom: 8,
  },
  voucherDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  voucherAmount: {
    fontSize: 15.5,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  voucherRefId: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  voucherDate: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },

  // ─── Screen Footer ───
  screenFooterCode: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 4,
  },

  // ─── Bottom Navigation ───
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 4,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
