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
import Svg, { Path, Circle } from 'react-native-svg';
import { ORDERS_THEME } from './theme';
import { SWABottomNav } from '../components/SWABottomNav';

interface M5S02Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
  routeParams?: any;
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
      {/* Top track */}
      <Path d="M3.5 8h17" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      {/* Top knob on right */}
      <Path d="M15.5 4.5v7" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />

      {/* Bottom track */}
      <Path d="M3.5 16h17" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      {/* Bottom knob on left */}
      <Path d="M8.5 12.5v7" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
    </Svg>
  );
}

function SearchIconGrey() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={ORDERS_THEME.textSecondary} strokeWidth="2" />
      <Path d="M16 16l4.5 4.5" stroke={ORDERS_THEME.textSecondary} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StorefrontIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l1-6h16l1 6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M4 12v9h16v-9" stroke={ORDERS_THEME.textSecondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryTruckSmallIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h13v12H1zM14 8h4l3 3v4h-7V8z" stroke={ORDERS_THEME.textSecondary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5" cy="17" r="2" stroke={ORDERS_THEME.textSecondary} strokeWidth="1.8" />
      <Circle cx="17" cy="17" r="2" stroke={ORDERS_THEME.textSecondary} strokeWidth="1.8" />
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

export const M5S02_OrdersList: React.FC<M5S02Props> = ({ onNavigate, onBack, routeParams }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = ORDERS.filter(
    (order) => {
      if (routeParams?.defaultFilter && order.status !== routeParams.defaultFilter) return false;
      return order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
             order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    }
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
            activeOpacity={0.75}
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
              placeholderTextColor={ORDERS_THEME.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Order Cards List with Reduced Box Size */}
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
                activeOpacity={0.75}
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

                {/* Bottom Action Button */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() => onNavigate(order.actionScreen, { orderId: order.id })}
                >
                  <Text style={styles.actionBtnText}>{order.action}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <SWABottomNav
          activeTab="More"
          onTabChange={(tab) => {
            if (tab === 'Home') onBack();
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ORDERS_THEME.primary,
  },
  container: {
    flex: 1,
    backgroundColor: ORDERS_THEME.pageBg,
  },
  header: {
    backgroundColor: ORDERS_THEME.primary,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    borderRadius: ORDERS_THEME.radiusFull,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  orderCountLabel: {
    fontSize: 12.5,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    marginBottom: 8,
    fontWeight: '600',
  },
  searchBox: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
    paddingVertical: 0,
  },
  orderCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  orderIdText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: ORDERS_THEME.radiusFull,
  },
  badgeConfirmed: {
    backgroundColor: '#FEF3E2',
  },
  badgeTextConfirmed: {
    color: '#854F0B',
  },
  badgeReady: {
    backgroundColor: ORDERS_THEME.successBg,
  },
  badgeTextReady: {
    color: ORDERS_THEME.success,
  },
  badgePacking: {
    backgroundColor: '#FEF3E2',
  },
  badgeTextPacking: {
    color: '#854F0B',
  },
  badgeIssue: {
    backgroundColor: '#FCEBEB',
  },
  badgeTextIssue: {
    color: '#E24B4A',
  },
  badgeCompleted: {
    backgroundColor: ORDERS_THEME.successBg,
  },
  badgeTextCompleted: {
    color: ORDERS_THEME.success,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'Poppins',
  },
  customerNameText: {
    fontSize: 12,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
    marginBottom: 6,
  },
  itemsPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemsCountText: {
    fontSize: 12,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
  },
  amountText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
    fontFamily: 'Poppins',
  },
  fulfillmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fulfillmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fulfillmentText: {
    fontSize: 11.5,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
  },
  timeText: {
    fontSize: 11,
    color: ORDERS_THEME.textSecondary,
    fontFamily: 'Poppins',
  },
  actionBtn: {
    backgroundColor: '#FDF0EA',
    borderRadius: 10,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  actionBtnText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: ORDERS_THEME.orangeDeep,
  },
});
