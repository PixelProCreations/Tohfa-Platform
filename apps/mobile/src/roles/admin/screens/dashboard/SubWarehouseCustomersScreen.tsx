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
  redBadge:      '#FEE2E2',
  redText:       '#DC2626',
  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface CustomerItem {
  id: string;
  name: string;
  code: string;
  phone: string;
  email?: string;
  status: 'Active' | 'Inactive';
  ordersCount: number;
  lastPurchase: string;
  totalPurchases?: string;
  walletBalance?: string;
  openIssues?: number;
  completedOrders?: number;
  cancelledOrders?: number;
  regDate?: string;
}

const INITIAL_CUSTOMERS: CustomerItem[] = [
  {
    id: 'CUS-00291',
    name: 'Rajesh Kumar',
    code: 'CUS-00291',
    phone: '+91 XXXXX XXXXX',
    email: 'customer@example.com',
    status: 'Active',
    ordersCount: 12,
    lastPurchase: '24 Sep 2026',
    totalPurchases: '₹8,450',
    walletBalance: '₹1,250',
    openIssues: 2,
    completedOrders: 10,
    cancelledOrders: 1,
    regDate: '12 Jan 2026',
  },
  {
    id: 'CUS-00152',
    name: 'Priya Stores',
    code: 'CUS-00152',
    phone: '+91 XXXXX XXXXX',
    email: 'priyastores@example.com',
    status: 'Active',
    ordersCount: 8,
    lastPurchase: '22 Sep 2026',
    totalPurchases: '₹5,320',
    walletBalance: '₹800',
    openIssues: 0,
    completedOrders: 8,
    cancelledOrders: 0,
    regDate: '04 Mar 2026',
  },
  {
    id: 'CUS-00087',
    name: 'Ganesh K.',
    code: 'CUS-00087',
    phone: '+91 XXXXX XXXXX',
    email: 'ganesh.k@example.com',
    status: 'Inactive',
    ordersCount: 3,
    lastPurchase: '2 months ago',
    totalPurchases: '₹1,950',
    walletBalance: '₹120',
    openIssues: 1,
    completedOrders: 2,
    cancelledOrders: 1,
    regDate: '18 Nov 2025',
  },
];

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

function CustomersHeaderIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke="#FFFFFF"
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

function FilterSlidersIcon({ size = 18, color = '#52525B' }: { size?: number; color?: string }) {
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

export interface SubWarehouseCustomersScreenProps {
  onBack?: () => void;
  onTabChange?: (tab: SubWHTab) => void;
  onNavigateToSearch?: () => void;
  onSelectCustomer?: (customer: CustomerItem) => void;
  onNavigateToNotifications?: () => void;
}

export function SubWarehouseCustomersScreen({
  onBack,
  onTabChange,
  onNavigateToSearch,
  onSelectCustomer,
  onNavigateToNotifications,
}: SubWarehouseCustomersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = INITIAL_CUSTOMERS.filter((cust) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.code.toLowerCase().includes(q) ||
      cust.phone.toLowerCase().includes(q)
    );
  });

  const handleTabPress = (tab: SubWHTab) => {
    if (tab === 'More') {
      if (onBack) onBack();
      return;
    }
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Header Banner (Orange Theme) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowBackIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <CustomersHeaderIcon />
            <Text style={styles.headerTitle}>Customers</Text>
          </View>

          <TouchableOpacity
            style={styles.notifButton}
            onPress={onNavigateToNotifications}
            activeOpacity={0.8}
          >
            <BellHeaderIcon />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Statistics Cards (Row of 3) ─── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1,248</Text>
            <Text style={styles.statLabel}>TOTAL CUSTOMERS</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>1,105</Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>NEW</Text>
          </View>
        </View>

        {/* ─── Search Customers Bar ─── */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.9}
          onPress={onNavigateToSearch}
        >
          <SearchIcon size={18} color="#7A726C" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers..."
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => {
              if (onNavigateToSearch) onNavigateToSearch();
            }}
          />
          <TouchableOpacity
            onPress={onNavigateToSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FilterSlidersIcon size={18} color="#52525B" />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* ─── Customer Cards List ─── */}
        {filteredCustomers.map((customer) => {
          const isActive = customer.status === 'Active';
          return (
            <TouchableOpacity
              key={customer.id}
              style={styles.customerCard}
              activeOpacity={0.75}
              onPress={() => onSelectCustomer && onSelectCustomer(customer)}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isActive ? PALETTE.greenBadge : PALETTE.redBadge },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: isActive ? PALETTE.greenText : PALETTE.redText },
                    ]}
                  >
                    {customer.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.customerSub}>
                {customer.code} · {customer.phone}
              </Text>

              <View style={styles.cardMetricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Orders</Text>
                  <Text style={styles.metricValue}>{customer.ordersCount}</Text>
                </View>

                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Last Purchase</Text>
                  <Text style={styles.metricValue}>{customer.lastPurchase}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 20 }} />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    paddingRight: 4,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  notifButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: PALETTE.pageBg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 15,
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
  customerCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    lineHeight: 18.4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '700',
  },
  customerSub: {
    fontFamily: 'Poppins',
    fontSize: 10.5,
    fontWeight: '400',
    color: PALETTE.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  cardMetricsRow: {
    flexDirection: 'row',
    gap: 28,
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontFamily: 'Poppins',
    fontSize: 10,
    fontWeight: '400',
    color: PALETTE.textSecondary,
  },
  metricValue: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginTop: 1,
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
