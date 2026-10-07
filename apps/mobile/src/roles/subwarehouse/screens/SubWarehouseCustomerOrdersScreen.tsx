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
import Svg, { Path, Circle } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  pageBg: '#F7F5F0',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#7A726C',
  border: '#EBE5DC',
  // badges
  badgeGreenBg: '#E8F5E9',
  badgeGreenText: '#064E3B',
  badgeOrangeBg: '#FEF3C7',
  badgeOrangeText: '#B45309',
  badgeRedBg: '#FEE2E2',
  badgeRedText: '#991B1B',
  badgeGrayBg: '#F3EFE9',
  badgeGrayText: '#7A726C',
};

function ArrowBackIcon({ size = 24, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#7A726C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StoreIcon({ size = 14, color = '#7A726C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryIcon({ size = 14, color = '#7A726C' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12h3M19 12h3M12 2v3M12 19v3M5 5l2 2M19 19l-2-2M5 19l2-2M19 5l-2 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

const ORDERS_DATA = [
  {
    id: 'o1',
    orderNo: 'ORD-1024',
    customer: 'Arun Kumar',
    status: 'Confirmed',
    items: '3 Items',
    price: '₹850',
    type: 'Pickup',
    date: 'Today · 10:32 AM',
  },
  {
    id: 'o2',
    orderNo: 'ORD-1023',
    customer: 'Priya',
    status: 'Ready for Pickup',
    items: '5 Items',
    price: '₹1,240',
    type: 'Pickup',
    date: 'Today · 09:45 AM',
  },
  {
    id: 'o3',
    orderNo: 'ORD-1022',
    customer: 'Ganesh K.',
    status: 'Packing',
    items: '2 Items',
    price: '₹420',
    type: 'Pickup',
    date: 'Today · 09:10 AM',
  },
  {
    id: 'o4',
    orderNo: 'ORD-1021',
    customer: 'Divya R.',
    status: 'Confirmed',
    items: '4 Items',
    price: '₹960',
    type: 'Delivery',
    date: 'Today · 08:55 AM',
  },
  {
    id: 'o5',
    orderNo: 'ORD-1018',
    customer: 'Meena S.',
    status: 'Quantity Issue',
    items: '2 Items',
    price: '₹310',
    type: 'Pickup',
    date: 'Yesterday · 4:20 PM',
  },
  {
    id: 'o6',
    orderNo: 'ORD-1010',
    customer: 'Rahul Kumar',
    status: 'Completed',
    items: '3 Items',
    price: '₹850',
    type: 'Pickup',
    date: 'Yesterday · 2:10 PM',
  },
];

export interface SubWarehouseCustomerOrdersScreenProps {
  onBack: () => void;
  onOpenFilters?: () => void;
  customerName?: string;
  appliedFilters?: any;
  onClearFilters?: () => void;
}

export function SubWarehouseCustomerOrdersScreen({
  onBack,
  onOpenFilters,
  customerName,
  appliedFilters,
  onClearFilters,
}: SubWarehouseCustomerOrdersScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Ready for Pickup':
      case 'Completed':
        return { bg: PALETTE.badgeGreenBg, text: PALETTE.badgeGreenText };
      case 'Confirmed':
      case 'Packing':
        return { bg: PALETTE.badgeOrangeBg, text: PALETTE.badgeOrangeText };
      case 'Quantity Issue':
        return { bg: PALETTE.badgeRedBg, text: PALETTE.badgeRedText };
      default:
        return { bg: PALETTE.badgeGrayBg, text: PALETTE.badgeGrayText };
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />
      
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
              <ArrowBackIcon size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Orders</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={onOpenFilters} activeOpacity={0.7}>
            <FilterSlidersIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.ordersCountText}>24 Orders</Text>

        {/* Search */}
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order / customer / phone"
            placeholderTextColor={PALETTE.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {ORDERS_DATA.map((order) => {
            const badge = getBadgeStyle(order.status);
            return (
              <View key={order.id} style={styles.card}>
                
                {/* Top Row: Order No + Badge */}
                <View style={styles.rowBetween}>
                  <Text style={styles.orderNo}>{order.orderNo}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{order.status}</Text>
                  </View>
                </View>
                
                {/* Customer */}
                <Text style={styles.customerName}>{order.customer}</Text>

                {/* Items & Price */}
                <View style={[styles.rowBetween, { marginTop: 12, marginBottom: 12 }]}>
                  <Text style={styles.itemsText}>{order.items}</Text>
                  <Text style={styles.priceText}>{order.price}</Text>
                </View>

                {/* Type & Date */}
                <View style={styles.rowBetween}>
                  <View style={styles.typeWrap}>
                    {order.type === 'Pickup' ? <StoreIcon /> : <DeliveryIcon />}
                    <Text style={styles.typeText}>{order.type}</Text>
                  </View>
                  <Text style={styles.dateText}>{order.date}</Text>
                </View>

              </View>
            );
          })}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  ordersCountText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    marginBottom: 10,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14, color: PALETTE.textSecondary, padding: 0 },

  listContainer: { gap: 16 },
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNo: { fontSize: 16, fontWeight: '800', color: '#B45309' },
  customerName: { fontSize: 14, color: PALETTE.textSecondary, marginTop: 4 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '800' },

  itemsText: { fontSize: 13, color: PALETTE.textSecondary },
  priceText: { fontSize: 16, fontWeight: '800', color: PALETTE.textInk },

  typeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeText: { fontSize: 13, color: PALETTE.textSecondary },
  dateText: { fontSize: 11, color: PALETTE.textSecondary },
});
