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
import Svg, { Path } from 'react-native-svg';
import { ORDERS_THEME } from './theme';

interface M5S09Props {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowWhiteIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchMutedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z"
        stroke={ORDERS_THEME.textSecondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const READY_ORDERS = [
  {
    id: 'ORD-1024',
    customer: 'Arun Kumar',
    items: '4 Items',
    amount: '₹850',
    time: 'Ready for 2h 15m',
    packed: 'Packed 11:15 AM',
  },
  {
    id: 'ORD-1023',
    customer: 'Priya',
    items: '5 Items',
    amount: '₹1,240',
    time: 'Ready for 3h 40m',
    packed: 'Packed 09:45 AM',
  },
];

export const M5S09_ReadyForPickup: React.FC<M5S09Props> = ({ onNavigate, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = READY_ORDERS.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackArrowWhiteIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ready for Pickup</Text>
        </View>

        {/* Subtitle directly below header */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>7 Orders</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Box */}
          <View style={styles.searchBox}>
            <SearchMutedIcon />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search order / customer"
              placeholderTextColor={ORDERS_THEME.textSecondary}
            />
          </View>

          {/* Order Cards */}
          {filteredOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              activeOpacity={0.75}
              onPress={() => onNavigate('M5S10', { orderId: order.id })}
            >
              {/* Top Row: Order ID & Time Badge */}
              <View style={styles.cardTopRow}>
                <Text style={styles.orderIdText}>{order.id}</Text>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>{order.time}</Text>
                </View>
              </View>

              {/* Customer Name */}
              <Text style={styles.customerName}>{order.customer}</Text>

              {/* Items & Price */}
              <View style={styles.itemsPriceRow}>
                <Text style={styles.itemsText}>{order.items}</Text>
                <Text style={styles.amountText}>{order.amount}</Text>
              </View>

              {/* Packed Time & Ready Badge */}
              <View style={styles.packedReadyRow}>
                <Text style={styles.packedTimeText}>{order.packed}</Text>
                <View style={styles.readyBadge}>
                  <Text style={styles.readyBadgeText}>Ready</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View style={styles.fixedBottomContainer}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            activeOpacity={0.8}
            onPress={() => onNavigate('M5S10')}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
              <Path d="M21 8H3V4h18v4zM21 8v12H3V8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M10 12h4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.primaryActionText}>New Packing</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: 'Poppins',
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitleRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: ORDERS_THEME.primary,
  },
  subtitleText: {
    fontFamily: 'Poppins',
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  searchBox: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusMD,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13.5,
    color: ORDERS_THEME.textInk,
    height: '100%',
  },
  orderCard: {
    backgroundColor: ORDERS_THEME.cardBg,
    borderRadius: ORDERS_THEME.radiusLG,
    borderWidth: 1,
    borderColor: ORDERS_THEME.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderIdText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
  },
  timeBadge: {
    backgroundColor: ORDERS_THEME.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ORDERS_THEME.radiusFull,
  },
  timeBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 11,
    fontWeight: '700',
    color: ORDERS_THEME.warning,
  },
  customerName: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
    marginBottom: 10,
  },
  itemsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemsText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
  },
  amountText: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '800',
    color: ORDERS_THEME.textInk,
  },
  packedReadyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packedTimeText: {
    fontFamily: 'Poppins',
    fontSize: 12,
    fontWeight: '500',
    color: ORDERS_THEME.textSecondary,
  },
  readyBadge: {
    backgroundColor: ORDERS_THEME.successBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: ORDERS_THEME.radiusFull,
  },
  readyBadgeText: {
    fontFamily: 'Poppins',
    fontSize: 11.5,
    fontWeight: '700',
    color: ORDERS_THEME.success,
  },
  fixedBottomContainer: {
    backgroundColor: ORDERS_THEME.pageBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: ORDERS_THEME.border,
  },
  primaryActionButton: {
    backgroundColor: ORDERS_THEME.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: ORDERS_THEME.radiusLG,
    shadowColor: ORDERS_THEME.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionText: {
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
