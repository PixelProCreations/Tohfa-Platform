import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (#F0562A Existing Orange Palette) ─────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  pageBg:        '#F7F5EE',
  cardBg:        '#FFFFFF',
  textInk:       '#1D2420',
  textSecondary: '#7A726C',
  textMuted:     '#9CA3AF',
  textBody:      '#4B5563',
  border:        '#F0ECE3',
  divider:       '#F0ECE3',
  greenBadge:    '#E6F5ED',
  greenText:     '#1E8E5A',
  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

// ─── Pure SVG Icons (No Rect or Circle to avoid Hermes runtime errors) ───────

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

function FilterSlidersIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 21l-4.35-4.35"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
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
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 10l5 5 5-5M12 15V3"
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
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM5 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM12 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM19 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"
        fill={color}
      />
    </Svg>
  );
}

export interface PurchaseItem {
  id: string;
  invoiceNo: string;
  dateText: string;
  itemsSummary: string;
  amount: string;
  status: 'Paid' | 'Pending';
}

const SAMPLE_PURCHASES: PurchaseItem[] = [
  {
    id: 'p1',
    invoiceNo: 'INV-00251',
    dateText: '24 Sep 2026',
    itemsSummary: 'Tomato Grade 1 · 2 KG',
    amount: '₹200',
    status: 'Paid',
  },
  {
    id: 'p2',
    invoiceNo: 'INV-00238',
    dateText: '20 Sep 2026 · 3 Items',
    itemsSummary: 'Tomato — 2 KG · Carrot — 1 KG · Beans — 2 KG',
    amount: '₹650',
    status: 'Paid',
  },
];

import { PurchaseFilterState } from './SubWarehousePurchaseFiltersScreen';

export interface SubWarehousePurchaseHistoryScreenProps {
  customerName?: string | undefined;
  onBack: () => void;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
  onOpenFilters?: (() => void) | undefined;
  appliedFilters?: PurchaseFilterState | undefined;
  onClearFilters?: (() => void) | undefined;
}

export function SubWarehousePurchaseHistoryScreen({
  customerName = 'Rajesh Kumar',
  onBack,
  onTabChange,
  onOpenFilters,
  appliedFilters,
  onClearFilters,
}: SubWarehousePurchaseHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const hasActiveFilters = Boolean(
    appliedFilters && (
      (appliedFilters.purchaseStatus && appliedFilters.purchaseStatus !== 'All') ||
      (appliedFilters.grade && appliedFilters.grade !== 'All') ||
      (appliedFilters.datePreset && appliedFilters.datePreset !== 'All Time') ||
      (appliedFilters.sortBy && appliedFilters.sortBy !== 'Newest First') ||
      appliedFilters.productCrop ||
      appliedFilters.searchQuery
    )
  );

  const query = (searchQuery || appliedFilters?.searchQuery || '').trim().toLowerCase();
  const cropFilter = appliedFilters?.productCrop?.trim().toLowerCase();

  const filteredPurchases = SAMPLE_PURCHASES.filter((p) => {
    if (appliedFilters?.purchaseStatus && appliedFilters.purchaseStatus !== 'All' && p.status !== appliedFilters.purchaseStatus) {
      return false;
    }
    if (appliedFilters?.grade && appliedFilters.grade !== 'All' && !p.itemsSummary.toLowerCase().includes(appliedFilters.grade.toLowerCase())) {
      return false;
    }
    if (cropFilter && !p.itemsSummary.toLowerCase().includes(cropFilter)) {
      return false;
    }
    if (query) {
      const match =
        p.invoiceNo.toLowerCase().includes(query) ||
        p.itemsSummary.toLowerCase().includes(query) ||
        p.dateText.toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => {
    const sort = appliedFilters?.sortBy || 'Newest First';
    if (sort === 'Oldest First') {
      return a.id.localeCompare(b.id);
    }
    if (sort === 'Highest Amount') {
      const numA = parseInt(a.amount.replace(/[^0-9]/g, ''), 10);
      const numB = parseInt(b.amount.replace(/[^0-9]/g, ''), 10);
      return numB - numA;
    }
    if (sort === 'Lowest Amount') {
      const numA = parseInt(a.amount.replace(/[^0-9]/g, ''), 10);
      const numB = parseInt(b.amount.replace(/[^0-9]/g, ''), 10);
      return numA - numB;
    }
    return b.id.localeCompare(a.id);
  });

  const handleBottomTabPress = (tab: SubWHTab) => {
    if (tab === 'More') {
      onBack();
      return;
    }
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home') {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner (Orange Theme with Back Arrow & Filter Icon) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Purchase History</Text>
            <Text style={styles.headerSubtitle}>{customerName}</Text>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={onOpenFilters}
            activeOpacity={0.8}
            accessibilityLabel="Filter Purchases"
          >
            <FilterSlidersIcon size={18} color="#FFFFFF" />
            {hasActiveFilters && <View style={styles.activeFilterDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 3 Summary Cards in a row ─── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>₹8,450</Text>
            <Text style={styles.statLabel}>TOTAL PURCHASES</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>PURCHASES</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24 Sep</Text>
            <Text style={styles.statLabel}>LAST PURCHASE</Text>
          </View>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#7A726C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product, order ID or invoice"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Purchase Cards List ─── */}
        {filteredPurchases.map((purchase) => {
          return (
            <View key={purchase.id} style={styles.purchaseCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.invoiceNo}>{purchase.invoiceNo}</Text>
                <View style={styles.paidBadge}>
                  <Text style={styles.paidText}>{purchase.status}</Text>
                </View>
              </View>

              <Text style={styles.dateText}>{purchase.dateText}</Text>

              <View style={styles.cardBottomRow}>
                <Text style={styles.itemsSummary} numberOfLines={2}>
                  {purchase.itemsSummary}
                </Text>
                <Text style={styles.amountText}>{purchase.amount}</Text>
              </View>
            </View>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ─── Bottom Navigation Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Home')}
          activeOpacity={0.75}
        >
          <HomeTabIcon active={false} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Receiving')}
          activeOpacity={0.75}
        >
          <ReceivingTabIcon active={false} />
          <Text style={styles.navLabel}>Receiving</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('Inventory')}
          activeOpacity={0.75}
        >
          <InventoryTabIcon active={false} />
          <Text style={styles.navLabel}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleBottomTabPress('More')}
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
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 1,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilterDot: {
    position: 'absolute',
    top: 6,
    right: 6,
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
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  statLabel: {
    fontFamily: 'Poppins',
    fontSize: 9.5,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginTop: 2,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  searchBar: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '400',
    color: PALETTE.textInk,
    marginLeft: 8,
    paddingVertical: 0,
  },
  purchaseCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceNo: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  paidBadge: {
    backgroundColor: PALETTE.greenBadge,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidText: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.greenText,
  },
  dateText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  itemsSummary: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '400',
    color: PALETTE.textBody,
    paddingRight: 10,
  },
  amountText: {
    fontFamily: 'Poppins',
    fontSize: 15.5,
    fontWeight: '700',
    color: PALETTE.textInk,
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
    fontFamily: 'Poppins',
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
