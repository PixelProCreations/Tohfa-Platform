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
import { SWA_TYPOGRAPHY } from '../constants';
import { SWABottomNav } from '../components/SWABottomNav';

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
        stroke="#64748B"
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
        {/* Top Header - Orange Theme matching Image 1 */}
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
          {/* Search Box matching Image 1 */}
          <View style={styles.searchBox}>
            <SearchMutedIcon />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search order / customer"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Order Cards matching Image 1 */}
          {filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCardWrapper}>
              <View style={styles.orderCard}>
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
              </View>


            </View>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Fixed Bottom Button replacing Nav Bar */}
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
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  header: {
    backgroundColor: '#E85226',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backButton: {
    marginRight: 14,
    padding: 2,
  },
  headerTitle: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitleRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FAF8F5',
  },
  subtitleText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C7A6B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13.5,
    color: '#1D2420',
    height: '100%',
  },
  orderCardWrapper: {
    marginBottom: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderIdText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#1D2420',
  },
  timeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  timeBadgeText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  customerName: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13,
    fontWeight: '500',
    color: '#78716C',
    marginBottom: 10,
  },
  itemsPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemsText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  amountText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#1D2420',
  },
  packedReadyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packedTimeText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 12,
    fontWeight: '500',
    color: '#78716C',
  },
  readyBadge: {
    backgroundColor: '#E6F5ED',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readyBadgeText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E8E5A',
  },
  fixedBottomContainer: {
    backgroundColor: '#FAF8F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EBE5DC',
  },
  primaryActionButton: {
    backgroundColor: '#F0562A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
  },
  primaryActionText: {
    fontFamily: SWA_TYPOGRAPHY.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
