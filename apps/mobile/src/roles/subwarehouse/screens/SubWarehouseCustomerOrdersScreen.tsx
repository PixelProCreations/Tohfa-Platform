import React, { useState, useMemo } from 'react';
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
import Svg, { Path, Circle } from 'react-native-svg';

const PALETTE = {
  // Brand Palette
  primary: '#F0562A', // Orange: primary actions, active states, icons
  orangeDeep: '#7A2E14', // Orange Deep: section headings, emphasis text
  orangeTint: '#FDF3F0', // Orange Tint: icon chips, role badges, active pills
  pageBg: '#F3EFE9', // Background: app canvas
  cardBg: '#FFFFFF', // Card surfaces
  textInk: '#1A1A1A', // Ink: primary text
  textSecondary: '#5F5E5A', // Muted: secondary text
  textMuted: '#5F5E5A',
  border: '#EEDCD3', // Border: card and input borders
  inputBorder: '#EEDCD3',
  // Filter pills
  activePillBorder: '#F0562A',
  activePillText: '#7A2E14',
  activePillBg: '#FDF3F0',
  inactivePillBorder: '#EEDCD3',
  inactivePillText: '#5F5E5A',
  // Button
  actionBtnBg: '#FDF3F0',
  actionBtnText: '#7A2E14',
  // Badges
  badgeGreenBg: '#EAF3DE',
  badgeGreenText: '#173404',
  badgeAmberBg: '#FEF3E2',
  badgeAmberText: '#854F0B',
  badgeRedBg: '#FCEBEB',
  badgeRedText: '#E24B4A',
};

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top line with right notch */}
      <Path d="M4 6h10M18 6h2" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M14 4v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Middle line with left notch */}
      <Path d="M4 12h3M11 12h9" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M7 10v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Bottom line with right-middle notch */}
      <Path d="M4 18h11M19 18h1" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M15 16v4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#7A726C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StoreFrontIcon({ size = 15, color = '#4B5563' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l1-5h16l1 5M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M9 21V13h6v8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseCustomerOrderItem {
  id: string;
  orderNo: string;
  date: string;
  items: string;
  products?: string;
  type: string;
  paymentStatus: string;
  price: string;
  status: string;
  statusCategory: 'Active' | 'Completed' | 'Cancelled';
  buttonText: string;
}

const INITIAL_ORDERS: SubWarehouseCustomerOrderItem[] = [
  {
    id: 'ord-1',
    orderNo: 'ORD-00251',
    date: '24 Sep 2026',
    items: '3 Items',
    products: 'Tomato Grade 1, Potato, Onion',
    type: 'Pickup',
    paymentStatus: 'Paid',
    price: '₹850',
    status: 'Ready for Pickup',
    statusCategory: 'Active',
    buttonText: 'View Pickup Status',
  },
  {
    id: 'ord-2',
    orderNo: 'ORD-00238',
    date: '20 Sep 2026',
    items: '2 Items',
    products: 'Fresh Apple, Banana Robusta',
    type: 'Pickup',
    paymentStatus: 'Paid',
    price: '₹420',
    status: 'Completed',
    statusCategory: 'Completed',
    buttonText: 'View Invoice',
  },
  {
    id: 'ord-3',
    orderNo: 'ORD-00230',
    date: '18 Sep 2026',
    items: '4 Items',
    products: 'Carrots, Beetroot, Cabbage, Green Peas',
    type: 'Pickup',
    paymentStatus: 'Paid',
    price: '₹680',
    status: 'Ready for Pickup',
    statusCategory: 'Active',
    buttonText: 'View Pickup Status',
  },
  {
    id: 'ord-4',
    orderNo: 'ORD-00215',
    date: '14 Sep 2026',
    items: '5 Items',
    products: 'Basmati Rice 5kg, Cooking Oil 1L, Spices',
    type: 'Pickup',
    paymentStatus: 'Paid',
    price: '₹1,350',
    status: 'Completed',
    statusCategory: 'Completed',
    buttonText: 'View Invoice',
  },
  {
    id: 'ord-5',
    orderNo: 'ORD-00198',
    date: '08 Sep 2026',
    items: '1 Item',
    products: 'Organic Honey 500g',
    type: 'Pickup',
    paymentStatus: 'Refunded',
    price: '₹550',
    status: 'Cancelled',
    statusCategory: 'Cancelled',
    buttonText: 'View Details',
  },
];

type FilterTabOption = 'All' | 'Active' | 'Completed' | 'Cancelled';

const FILTER_TABS: FilterTabOption[] = ['All', 'Active', 'Completed', 'Cancelled'];

export interface SubWarehouseCustomerOrdersScreenProps {
  onBack: () => void;
  onOpenFilters?: () => void;
  customerName?: string;
  appliedFilters?: any;
  defaultFilter?: string;
  onClearFilters?: () => void;
  onOrderPress?: (orderId: string) => void;
  onNavigateToOrderDetail?: (order?: SubWarehouseCustomerOrderItem) => void;
  onViewPickupStatus?: (order?: SubWarehouseCustomerOrderItem) => void;
  onViewInvoice?: (order?: SubWarehouseCustomerOrderItem) => void;
}

export function SubWarehouseCustomerOrdersScreen({
  onBack,
  onOpenFilters,
  customerName = 'Rajesh Kumar',
  appliedFilters,
  defaultFilter,
  onClearFilters,
  onOrderPress,
  onNavigateToOrderDetail,
  onViewPickupStatus,
  onViewInvoice,
}: SubWarehouseCustomerOrdersScreenProps) {
  const [selectedTab, setSelectedTab] = useState<FilterTabOption>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredOrders = useMemo(() => {
    return INITIAL_ORDERS.filter((order) => {
      // Default filter (e.g. from staff detail "Assign Delivery")
      if (defaultFilter) {
        if (defaultFilter === 'Ready for Delivery' && order.status !== 'Ready for Delivery') return false;
        else if (defaultFilter !== 'Ready for Delivery' && order.type !== defaultFilter) return false;
      }
      // Tab filter
      if (selectedTab !== 'All' && order.statusCategory !== selectedTab) {
        return false;
      }
      // Search filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.orderNo.toLowerCase().includes(q);
        const matchesProduct = (order.products || '').toLowerCase().includes(q);
        const matchesItems = order.items.toLowerCase().includes(q);
        const matchesStatus = order.status.toLowerCase().includes(q);
        return matchesId || matchesProduct || matchesItems || matchesStatus;
      }
      return true;
    });
  }, [selectedTab, searchQuery, defaultFilter]);

  const handleActionPress = (order: SubWarehouseCustomerOrderItem) => {
    if (order.buttonText === 'View Pickup Status') {
      if (onViewPickupStatus) {
        onViewPickupStatus(order);
      } else if (onNavigateToOrderDetail) {
        onNavigateToOrderDetail(order);
      }
    } else if (order.buttonText === 'View Invoice') {
      if (onViewInvoice) {
        onViewInvoice(order);
      } else if (onNavigateToOrderDetail) {
        onNavigateToOrderDetail(order);
      }
    } else {
      if (onNavigateToOrderDetail) {
        onNavigateToOrderDetail(order);
      }
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Ready for Pickup':
      case 'Ready for Delivery':
      case 'Completed':
        return { bg: PALETTE.badgeGreenBg, text: PALETTE.badgeGreenText };
      case 'Confirmed':
      case 'Packing':
      case 'Active':
        return { bg: PALETTE.badgeAmberBg, text: PALETTE.badgeAmberText };
      case 'Cancelled':
        return { bg: PALETTE.badgeRedBg, text: PALETTE.badgeRedText };
      default:
        return { bg: PALETTE.badgeGreenBg, text: PALETTE.badgeGreenText };
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Orange Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Customer Orders</Text>
            <Text style={styles.headerSubtitle}>{customerName}</Text>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={onOpenFilters}
            activeOpacity={0.75}
            accessibilityLabel="Open Filters"
          >
            <FilterSlidersIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Body Scroll ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Filter Tabs (All, Active, Completed, Cancelled) ─── */}
        <View style={styles.pillsRow}>
          {FILTER_TABS.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.pill,
                  isActive ? styles.pillActive : styles.pillInactive,
                ]}
                onPress={() => setSelectedTab(tab)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive ? styles.pillTextActive : styles.pillTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── Search Box ─── */}
        <View style={styles.searchBox}>
          <SearchIcon size={18} color={PALETTE.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by Order ID or product"
            placeholderTextColor={PALETTE.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Orders List Cards ─── */}
        <View style={styles.cardsList}>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query or filter selection.
              </Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const badgeStyle = getBadgeStyle(order.status);
              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Top Row: Order ID & Status Badge */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.orderIdText}>{order.orderNo}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badgeStyle.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: badgeStyle.text },
                        ]}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  {/* Subtitle: Date & Items */}
                  <Text style={styles.dateItemsText}>
                    {order.date} · {order.items}
                  </Text>

                  {/* Details Row: Store Icon + Pickup on left; Paid + Price on right */}
                  <View style={styles.detailsRow}>
                    <View style={styles.pickupWrap}>
                      <StoreFrontIcon size={16} color="#4B5563" />
                      <Text style={styles.pickupLabel}>{order.type}</Text>
                    </View>

                    <View style={styles.priceWrap}>
                      <Text style={styles.paidStatusLabel}>
                        {order.paymentStatus}
                      </Text>
                      <Text style={styles.priceAmountText}>{order.price}</Text>
                    </View>
                  </View>

                  {/* Action Button: Peach/Warm Orange Tinted */}
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleActionPress(order)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.cardActionBtnText}>
                      {order.buttonText}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },

  /* Filter Pills */
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    borderWidth: 1.5,
    borderColor: PALETTE.activePillBorder,
    backgroundColor: PALETTE.activePillBg,
  },
  pillInactive: {
    borderWidth: 1,
    borderColor: PALETTE.inactivePillBorder,
    backgroundColor: '#FFFFFF',
  },
  pillText: {
    fontSize: 13.5,
  },
  pillTextActive: {
    fontWeight: '700',
    color: PALETTE.activePillText,
  },
  pillTextInactive: {
    fontWeight: '600',
    color: PALETTE.inactivePillText,
  },

  /* Search Input */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.inputBorder,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },

  /* Order Cards */
  cardsList: {
    gap: 16,
  },
  orderCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  dateItemsText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    marginTop: 4,
    fontWeight: '400',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 14,
  },
  pickupWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickupLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  paidStatusLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  priceAmountText: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 1,
  },
  cardActionBtn: {
    backgroundColor: PALETTE.actionBtnBg,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.actionBtnText,
  },

  emptyContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
