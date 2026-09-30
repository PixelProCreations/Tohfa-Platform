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
  pillBtnBg:     '#FFF0EB',
  pillBtnText:   '#F0562A',
  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
  greenBadge:    '#DCFCE7',
  greenText:     '#15803D',
  blueBadge:     '#E0F2FE',
  blueText:      '#0369A1',
};

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

function StorePickupIcon({ size = 15, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"
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

export interface CustomerOrderRecord {
  id: string;
  orderNo: string;
  dateText: string;
  itemsCountText: string;
  status: 'Ready for Pickup' | 'Completed' | 'Cancelled';
  deliveryType: string;
  paymentStatus: string;
  amount: string;
  actionText: string;
}

const ORDERS_DATA: CustomerOrderRecord[] = [
  {
    id: 'o1',
    orderNo: 'ORD-00251',
    dateText: '24 Sep 2026',
    itemsCountText: '3 Items',
    status: 'Ready for Pickup',
    deliveryType: 'Pickup',
    paymentStatus: 'Paid',
    amount: '₹850',
    actionText: 'View Pickup Status',
  },
  {
    id: 'o2',
    orderNo: 'ORD-00238',
    dateText: '20 Sep 2026',
    itemsCountText: '2 Items',
    status: 'Completed',
    deliveryType: 'Pickup',
    paymentStatus: 'Paid',
    amount: '₹420',
    actionText: 'View Invoice',
  },
];

const FILTER_TABS = ['All', 'Active', 'Completed', 'Cancelled'];

import { OrderFilterState } from './SubWarehouseOrderFiltersScreen';

export interface SubWarehouseCustomerOrdersScreenProps {
  customerName?: string | undefined;
  onBack: () => void;
  onOpenFilters?: (() => void) | undefined;
  appliedFilters?: OrderFilterState | undefined;
  onClearFilters?: (() => void) | undefined;
}

export function SubWarehouseCustomerOrdersScreen({
  customerName = 'Rajesh Kumar',
  onBack,
  onOpenFilters,
  appliedFilters,
  onClearFilters,
}: SubWarehouseCustomerOrdersScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const hasActiveFilters = Boolean(
    appliedFilters && (
      (appliedFilters.orderStatus && appliedFilters.orderStatus !== 'All') ||
      (appliedFilters.orderType && appliedFilters.orderType !== 'All') ||
      (appliedFilters.paymentStatus && appliedFilters.paymentStatus !== 'All') ||
      (appliedFilters.datePreset && appliedFilters.datePreset !== 'All Time') ||
      appliedFilters.customer ||
      appliedFilters.searchQuery
    )
  );

  const query = (searchQuery || appliedFilters?.searchQuery || '').trim().toLowerCase();

  const effectiveStatus = appliedFilters?.orderStatus !== undefined && appliedFilters.orderStatus !== 'All'
    ? appliedFilters.orderStatus
    : selectedFilter;

  const filteredOrders = ORDERS_DATA.filter((item) => {
    if (effectiveStatus === 'Active' && item.status !== 'Ready for Pickup') return false;
    if (effectiveStatus === 'Completed' && item.status !== 'Completed') return false;
    if (effectiveStatus === 'Cancelled' && item.status !== 'Cancelled') return false;
    if (appliedFilters?.orderType && appliedFilters.orderType !== 'All' && item.deliveryType.toLowerCase() !== appliedFilters.orderType.toLowerCase()) {
      return false;
    }
    if (appliedFilters?.paymentStatus && appliedFilters.paymentStatus !== 'All' && item.paymentStatus.toLowerCase() !== appliedFilters.paymentStatus.toLowerCase()) {
      return false;
    }
    if (query && !item.orderNo.toLowerCase().includes(query)) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner ─── */}
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
            <Text style={styles.headerTitle}>Customer Orders</Text>
            <Text style={styles.headerSubtitle}>{appliedFilters?.customer || customerName}</Text>
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={onOpenFilters || (() => Alert.alert('Filter', 'Filter options...'))}
            activeOpacity={0.8}
            accessibilityLabel="Filter Orders"
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
        {/* ─── Filter Pills ─── */}
        <View style={styles.filterRow}>
          {FILTER_TABS.map((tab) => {
            const isSelected = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterPill,
                  isSelected ? styles.filterPillSelected : styles.filterPillUnselected,
                ]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected ? styles.filterPillTextSelected : styles.filterPillTextUnselected,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#7A726C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID or product"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Order Cards List ─── */}
        {filteredOrders.map((order) => {
          const isReady = order.status === 'Ready for Pickup';
          return (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.orderNo}>{order.orderNo}</Text>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: isReady ? PALETTE.blueBadge : PALETTE.greenBadge },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isReady ? PALETTE.blueText : PALETTE.greenText },
                    ]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.orderSub}>
                {order.dateText} · {order.itemsCountText}
              </Text>

              <View style={styles.orderMidRow}>
                <View style={styles.pickupWrap}>
                  <StorePickupIcon size={16} color="#7A726C" />
                  <Text style={styles.pickupLabel}>{order.deliveryType}</Text>
                </View>

                <View style={styles.priceWrap}>
                  <Text style={styles.paidLabel}>{order.paymentStatus}</Text>
                  <Text style={styles.amountText}>{order.amount}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.8}
                onPress={() => Alert.alert(order.orderNo, `${order.actionText} details`)}
              >
                <Text style={styles.actionBtnText}>{order.actionText}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  filterPill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterPillSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: PALETTE.primary,
  },
  filterPillUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: PALETTE.border,
  },
  filterPillText: {
    fontFamily: 'Poppins',
    fontSize: 12,
  },
  filterPillTextSelected: {
    fontWeight: '700',
    color: PALETTE.primary,
  },
  filterPillTextUnselected: {
    fontWeight: '400',
    color: PALETTE.textSecondary,
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
    marginBottom: 12,
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
  orderCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNo: {
    fontFamily: 'Poppins',
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
  },
  orderSub: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  orderMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickupWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickupLabel: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '400',
    color: PALETTE.textBody,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  paidLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  amountText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 1,
  },
  actionButton: {
    backgroundColor: PALETTE.pillBtnBg,
    borderRadius: 10,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.pillBtnText,
  },
});
