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
  blue:          '#2563EB',
  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface RevenueRecord {
  id: string;
  orderRef: string;
  category: 'Orders' | 'Direct Sales' | 'Other';
  amount: number;
  paymentMethod: string;
  timestamp: string;
  status: 'Completed' | 'Pending' | 'Refunded';
}

const SAMPLE_REVENUE_RECORDS: RevenueRecord[] = [
  {
    id: 'REV-000845',
    orderRef: 'Market Sale · Order #ORD-10284',
    category: 'Direct Sales',
    amount: 3450,
    paymentMethod: 'Wallet',
    timestamp: '25 Sep 2026 · 11:20 AM',
    status: 'Completed',
  },
  {
    id: 'REV-000841',
    orderRef: 'Customer Order · ORD-10279',
    category: 'Orders',
    amount: 1900,
    paymentMethod: 'UPI',
    timestamp: '25 Sep 2026 · 9:05 AM',
    status: 'Completed',
  },
  {
    id: 'REV-000839',
    orderRef: 'Customer Order · ORD-10275',
    category: 'Orders',
    amount: 4200,
    paymentMethod: 'Cash',
    timestamp: '25 Sep 2026 · 8:30 AM',
    status: 'Completed',
  },
  {
    id: 'REV-000835',
    orderRef: 'Market Sale · Stalls & Counter',
    category: 'Direct Sales',
    amount: 2850,
    paymentMethod: 'Wallet',
    timestamp: '24 Sep 2026 · 4:15 PM',
    status: 'Completed',
  },
  {
    id: 'REV-000828',
    orderRef: 'Other channels · Wholesale Dispatch',
    category: 'Other',
    amount: 2600,
    paymentMethod: 'Bank Transfer',
    timestamp: '24 Sep 2026 · 2:00 PM',
    status: 'Completed',
  },
];

export interface SubWarehouseRevenueScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onNavigateToDetail?: ((revenueId: string) => void) | undefined;
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

function ChevronDownIcon({ size = 11, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="4" cy="12" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="10" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="14" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ── Tab Bar Icons ──
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
      <Path
        d="M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path
        d="M12 8v8M8 12l4 4 4-4"
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

export function SubWarehouseRevenueScreen({
  onBack,
  onTabChange,
  onNavigateToDetail,
}: SubWarehouseRevenueScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Orders' | 'Direct Sales' | 'Other'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabPress = (tab: SubWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'More' && onBack) {
      onBack();
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const filteredRecords = SAMPLE_REVENUE_RECORDS.filter((rec) => {
    const matchesCategory =
      selectedFilter === 'All' || rec.category === selectedFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      rec.id.toLowerCase().includes(query) ||
      rec.orderRef.toLowerCase().includes(query) ||
      rec.paymentMethod.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

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
          <Text style={styles.headerTitle}>Revenue</Text>
        </View>

        {/* Coonoor Warehouse · Today ▾ Subtitle */}
        <TouchableOpacity
          style={styles.warehouseSubtitleRow}
          onPress={() => Alert.alert('Period Filter', 'Filtered to: Coonoor Warehouse · Today')}
          activeOpacity={0.8}
        >
          <Text style={styles.warehouseSubtitleText}>Coonoor Warehouse · Today</Text>
          <ChevronDownIcon size={11} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ─── Main Content Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 4 Top KPI Cards (2x2 Grid) ─── */}
        <View style={styles.kpiGrid}>
          {/* Row 1: TOTAL REVENUE & TODAY'S REVENUE */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
              <Text style={styles.kpiValue}>₹1,84,500</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>TODAY'S REVENUE</Text>
              <Text style={styles.kpiValue}>₹24,850</Text>
            </View>
          </View>

          {/* Row 2: ONLINE / ORDER & MARKET SALES */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ONLINE / ORDER</Text>
              <Text style={styles.kpiValue}>₹12,400</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>MARKET SALES</Text>
              <Text style={styles.kpiValue}>₹9,850</Text>
            </View>
          </View>
        </View>

        {/* ─── Filter Category Pills ─── */}
        <View style={styles.filterPillsRow}>
          {(['All', 'Orders', 'Direct Sales', 'Other'] as const).map((filter) => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search & Filter Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Revenue ID, Order ID, Invoice or Customer"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Filters', 'Open advanced filter options')}
            activeOpacity={0.7}
          >
            <FilterSlidersIcon size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* ─── Revenue Transaction Cards List ─── */}
        <View style={styles.cardsList}>
          {filteredRecords.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recordCard}
              onPress={() => {
                if (onNavigateToDetail) {
                  onNavigateToDetail(item.id);
                } else {
                  Alert.alert(item.id, `${item.orderRef}\nAmount: ₹${item.amount.toLocaleString()}\nMethod: ${item.paymentMethod}\nStatus: ${item.status}`);
                }
              }}
              activeOpacity={0.75}
            >
              {/* Header: ID + Completed Badge */}
              <View style={styles.recordHeaderRow}>
                <Text style={styles.recordId}>{item.id}</Text>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>{item.status}</Text>
                </View>
              </View>

              {/* Subtitle: Order Reference */}
              <Text style={styles.recordOrderRef}>{item.orderRef}</Text>

              {/* Amount & Payment Method */}
              <View style={styles.recordAmountRow}>
                <Text style={styles.recordAmount}>₹{item.amount.toLocaleString()}</Text>
                <Text style={styles.recordPaymentMethod}>{item.paymentMethod}</Text>
              </View>

              {/* Date & Time */}
              <Text style={styles.recordTimestamp}>{item.timestamp}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>


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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  warehouseSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 36,
    gap: 4,
  },
  warehouseSubtitleText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.92)',
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

  // ─── 2x2 KPI Grid ───
  kpiGrid: {
    gap: 10,
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5C544E',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textDark,
  },

  // ─── Blue Callout ───
  blueCallout: {
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  blueCalloutText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.blueText,
    lineHeight: 16,
  },

  // ─── Filter Pills ───
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterPillActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.peachBg,
  },
  filterPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: PALETTE.primaryDark,
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: PALETTE.textDark,
    padding: 0,
    margin: 0,
  },

  // ─── Records List ───
  cardsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  recordId: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8B5E3C',
  },
  completedBadge: {
    backgroundColor: PALETTE.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  recordOrderRef: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textDark,
    marginBottom: 8,
  },
  recordAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.green,
  },
  recordPaymentMethod: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  recordTimestamp: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textMuted,
  },

  // ─── Bottom Navigation ───
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
