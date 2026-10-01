import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface M5S02Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIconGrey() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke="#7A726C" strokeWidth="2" />
      <Path d="M16 16l4.5 4.5" stroke="#7A726C" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StorefrontIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l1-6h16l1 6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M4 12v9h16v-9" stroke="#7A726C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryTruckSmallIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h13v12H1zM14 8h4l3 3v4h-7V8z" stroke="#7A726C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5" cy="17" r="2" stroke="#7A726C" strokeWidth="1.8" />
      <Circle cx="17" cy="17" r="2" stroke="#7A726C" strokeWidth="1.8" />
    </Svg>
  );
}

const ORDERS = [
  {
    id: 'ORD-1024',
    customer: 'Arun Kumar',
    status: 'Confirmed',
    items: '3 Items',
    amount: '₹850',
    fulfillment: 'Pickup',
    time: 'Today · 10:32 AM',
    action: 'Check Stock',
    actionScreen: 'M5S05',
  },
  {
    id: 'ORD-1023',
    customer: 'Priya',
    status: 'Ready for Pickup',
    items: '5 Items',
    amount: '₹1,240',
    fulfillment: 'Pickup',
    time: 'Today · 09:45 AM',
    action: 'Verify Pickup',
    actionScreen: 'M5S10',
  },
  {
    id: 'ORD-1022',
    customer: 'Ganesh K.',
    status: 'Packing',
    items: '2 Items',
    amount: '₹420',
    fulfillment: 'Pickup',
    time: 'Today · 09:10 AM',
    action: 'Pack',
    actionScreen: 'M5S07',
  },
  {
    id: 'ORD-1021',
    customer: 'Divya R.',
    status: 'Confirmed',
    items: '4 Items',
    amount: '₹960',
    fulfillment: 'Delivery',
    time: 'Today · 08:55 AM',
    action: 'Prepare Delivery',
    actionScreen: 'M5S13',
  },
  {
    id: 'ORD-1018',
    customer: 'Meena S.',
    status: 'Quantity Issue',
    items: '2 Items',
    amount: '₹310',
    fulfillment: 'Pickup',
    time: 'Yesterday · 4:20 PM',
    action: 'Review Shortage',
    actionScreen: 'M5S06',
  },
  {
    id: 'ORD-1010',
    customer: 'Rahul Kumar',
    status: 'Completed',
    items: '3 Items',
    amount: '₹850',
    fulfillment: 'Pickup',
    time: 'Yesterday · 2:10 PM',
    action: 'View Invoice',
    actionScreen: 'M5S18',
  },
];

export const M5S02_OrdersList: React.FC<M5S02Props> = ({ onNavigate, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = ORDERS.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with Filter Sliders Icon on Right */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={onBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BackArrowWhiteIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Orders</Text>
          </View>

          {/* Filter Icon Button -> Navigates to M5S03 (Order Filters) */}
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.7}
            onPress={() => onNavigate('M5S03')}
          >
            <FilterSlidersIcon />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Count Label */}
          <Text style={styles.orderCountLabel}>{filteredOrders.length} Orders</Text>

          {/* Search Input Box */}
          <View style={styles.searchBox}>
            <SearchIconGrey />
            <TextInput
              style={styles.searchInput}
              placeholder="Search order / customer / phone"
              placeholderTextColor="#7A726C"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Order Cards List */}
          {filteredOrders.map((order) => {
            const isConfirmed = order.status === 'Confirmed';
            const isReady = order.status === 'Ready for Pickup';
            const isPacking = order.status === 'Packing';
            const isIssue = order.status === 'Quantity Issue';
            const isCompleted = order.status === 'Completed';

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() => onNavigate('M5S04', { orderId: order.id })}
              >
                {/* Top Row: Order ID & Status Badge */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.orderIdText}>{order.id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isConfirmed && styles.badgeConfirmed,
                      isReady && styles.badgeReady,
                      isPacking && styles.badgePacking,
                      isIssue && styles.badgeIssue,
                      isCompleted && styles.badgeCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isConfirmed && styles.badgeTextConfirmed,
                        isReady && styles.badgeTextReady,
                        isPacking && styles.badgeTextPacking,
                        isIssue && styles.badgeTextIssue,
                        isCompleted && styles.badgeTextCompleted,
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Customer Name */}
                <Text style={styles.customerNameText}>{order.customer}</Text>

                {/* Items & Price */}
                <View style={styles.itemsPriceRow}>
                  <Text style={styles.itemsCountText}>{order.items}</Text>
                  <Text style={styles.amountText}>{order.amount}</Text>
                </View>

                {/* Fulfillment & Time */}
                <View style={styles.fulfillmentRow}>
                  <View style={styles.fulfillmentLeft}>
                    {order.fulfillment === 'Pickup' ? <StorefrontIcon /> : <DeliveryTruckSmallIcon />}
                    <Text style={styles.fulfillmentText}>{order.fulfillment}</Text>
                  </View>
                  <Text style={styles.timeText}>{order.time}</Text>
                </View>

                {/* Full-Width Action Button matching Left Reference */}
                <TouchableOpacity
                  style={styles.cardActionButton}
                  activeOpacity={0.7}
                  onPress={() => onNavigate(order.actionScreen, { orderId: order.id })}
                >
                  <Text style={styles.cardActionText}>{order.action}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    backgroundColor: '#E85226',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  orderCountLabel: {
    fontSize: 12,
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginBottom: 8,
    fontWeight: '500',
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EAE6DF',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1D2420',
    fontFamily: 'Poppins',
    paddingVertical: 0,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE6DF',
    padding: 16,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeConfirmed: {
    backgroundColor: '#FFF7ED',
  },
  badgeTextConfirmed: {
    color: '#C2410C',
  },
  badgeReady: {
    backgroundColor: '#E0F2FE',
  },
  badgeTextReady: {
    color: '#0369A1',
  },
  badgePacking: {
    backgroundColor: '#FFF7ED',
  },
  badgeTextPacking: {
    color: '#C2410C',
  },
  badgeIssue: {
    backgroundColor: '#FEE2E2',
  },
  badgeTextIssue: {
    color: '#DC2626',
  },
  badgeCompleted: {
    backgroundColor: '#DCFCE7',
  },
  badgeTextCompleted: {
    color: '#166534',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  customerNameText: {
    fontSize: 13,
    color: '#7A726C',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  itemsPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemsCountText: {
    fontSize: 12.5,
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1D2420',
    fontFamily: 'Poppins',
  },
  fulfillmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fulfillmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fulfillmentText: {
    fontSize: 12,
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  timeText: {
    fontSize: 11.5,
    color: '#7A726C',
    fontFamily: 'Poppins',
  },
  cardActionButton: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B4513',
    fontFamily: 'Poppins',
  },
});
