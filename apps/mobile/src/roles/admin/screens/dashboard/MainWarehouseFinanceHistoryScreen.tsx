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
  red:           '#DC2626',
  redBg:         '#FEE2E2',

  blueBg:        '#EFF6FF',
  blueBorder:    '#BFDBFE',
  blueText:      '#1E40AF',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type MainWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface FinanceHistoryItem {
  id: string;
  type: 'Revenue' | 'Expense';
  title: string;
  amount: number;
  time: string;
}

const SAMPLE_HISTORY: FinanceHistoryItem[] = [
  {
    id: 'REV-000845',
    type: 'Revenue',
    title: 'Market Sale',
    amount: 3450,
    time: '11:20 AM',
  },
  {
    id: 'EXP-001245',
    type: 'Expense',
    title: 'Transport',
    amount: 2400,
    time: '09:32 AM',
  },
  {
    id: 'REV-000844',
    type: 'Revenue',
    title: 'B2B Sale · Taj Hotel',
    amount: 14500,
    time: '08:45 AM',
  },
  {
    id: 'EXP-001244',
    type: 'Expense',
    title: 'Loading / Unloading',
    amount: 1800,
    time: '08:15 AM',
  },
  {
    id: 'REV-000843',
    type: 'Revenue',
    title: 'Horeca Order · Café Coonoor',
    amount: 6900,
    time: '24 Sep · 06:10 PM',
  },
  {
    id: 'EXP-001238',
    type: 'Expense',
    title: 'Generator Diesel & Power',
    amount: 620,
    time: '24 Sep · 02:30 PM',
  },
];

export interface MainWarehouseFinanceHistoryScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: MainWHTab) => void) | undefined;
  onSelectItem?: ((item: FinanceHistoryItem) => void) | undefined;
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

function TrendUpIcon({ size = 18, color = '#059669' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M17 6h6v6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TruckIcon({ size = 18, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" rx="1" stroke={color} strokeWidth="2" />
      <Path d="M16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
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

export function MainWarehouseFinanceHistoryScreen({
  onBack,
  onTabChange,
  onSelectItem,
}: MainWarehouseFinanceHistoryScreenProps) {
  const [filterTab, setFilterTab] = useState<'All' | 'Revenue' | 'Expenses'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabPress = (tab: MainWHTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else if (onBack) {
      onBack();
    }
  };

  const filteredHistory = SAMPLE_HISTORY.filter((item) => {
    if (filterTab === 'Revenue' && item.type !== 'Revenue') return false;
    if (filterTab === 'Expenses' && item.type !== 'Expense') return false;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.id.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)
    );
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
          <Text style={styles.headerTitle}>Finance History</Text>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Net Summary Card ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Revenue</Text>
            <Text style={styles.revenueValue}>₹24,850</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={styles.expensesValue}>₹6,420</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={styles.netValue}>₹18,430</Text>
          </View>
        </View>

        {/* ─── Filter Pills ─── */}
        <View style={styles.filterPillsRow}>
          {(['All', 'Revenue', 'Expenses'] as const).map((tab) => {
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

        {/* ─── Search & Filter Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Transaction, Voucher, Invoice, Order..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            onPress={() => Alert.alert('Filters', 'Advanced filter options')}
            activeOpacity={0.7}
          >
            <FilterSlidersIcon size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* ─── Transactions List Card ─── */}
        <View style={styles.cardContainer}>
          {filteredHistory.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                style={styles.txRow}
                onPress={() => {
                  if (onSelectItem) {
                    onSelectItem(item);
                  } else {
                    Alert.alert(
                      item.id,
                      `Transaction: ${item.id}\nType: ${item.type}\nTitle: ${item.title}\nAmount: ₹${item.amount.toLocaleString()}\nTime: ${item.time}`
                    );
                  }
                }}
                activeOpacity={0.7}
              >
                {/* Left Icon */}
                <View
                  style={[
                    styles.iconBox,
                    item.type === 'Revenue'
                      ? { backgroundColor: PALETTE.greenBg }
                      : { backgroundColor: PALETTE.peachBg },
                  ]}
                >
                  {item.type === 'Revenue' ? (
                    <TrendUpIcon size={18} color={PALETTE.green} />
                  ) : (
                    <TruckIcon size={18} color={PALETTE.iconColor} />
                  )}
                </View>

                {/* Text Col */}
                <View style={styles.textCol}>
                  <Text style={styles.txId}>{item.id}</Text>
                  <Text style={styles.txTitle}>{item.title}</Text>
                </View>

                {/* Amount Col */}
                <View style={styles.amountCol}>
                  <Text
                    style={[
                      styles.txAmount,
                      item.type === 'Revenue' ? { color: PALETTE.greenText } : { color: PALETTE.red },
                    ]}
                  >
                    {item.type === 'Revenue' ? `+₹${item.amount.toLocaleString()}` : `-₹${item.amount.toLocaleString()}`}
                  </Text>
                  <Text style={styles.txTime}>{item.time}</Text>
                </View>
              </TouchableOpacity>

              {index < filteredHistory.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ─── Pagination Info Callout ─── */}
        <View style={styles.blueCallout}>
          <Text style={styles.blueCalloutText}>
            Large histories are paginated server-side rather than loaded all at once.
          </Text>
        </View>

        {/* Screen Footer Code */}
        <Text style={styles.screenFooterCode}>M11-S09 · Finance History</Text>

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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
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

  // Top Summary Card
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textDark,
  },
  revenueValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.greenText,
  },
  expensesValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.red,
  },
  netValue: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginVertical: 10,
  },

  // Filter Pills
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

  // Search Bar
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

  // Transactions Card Container
  cardContainer: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 4,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  txId: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textDark,
  },
  txTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  txTime: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    backgroundColor: PALETTE.divider,
    marginHorizontal: 16,
  },

  // Blue Callout
  blueCallout: {
    backgroundColor: PALETTE.blueBg,
    borderWidth: 1,
    borderColor: PALETTE.blueBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  blueCalloutText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.blueText,
    lineHeight: 16,
  },

  // Screen Footer
  screenFooterCode: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  // Bottom Navigation
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
