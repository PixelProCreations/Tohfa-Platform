import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  BackChevronIcon,
  SALES_PALETTE,
} from './SalesChannelOverviewScreen';

// ─── Order Box Icon ──────────────────────────────────────────────────────────
function PackageBoxIcon({ color = SALES_PALETTE.primaryOrange, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface OnlineOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  pickupLocation: string;
  status: 'Confirmed' | 'Packed' | 'Ready for Pickup' | 'Delivered';
  amount: number;
  itemsCount?: number;
  time?: string;
}

export const DEMO_ONLINE_ORDERS: OnlineOrderItem[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-20260910-0091',
    customerName: 'Divya Ramesh',
    pickupLocation: 'Ooty pickup',
    status: 'Confirmed',
    amount: 135,
    itemsCount: 3,
    time: '10:15 AM',
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-20260909-0088',
    customerName: 'Anitha K.',
    pickupLocation: 'Coonoor pickup',
    status: 'Packed',
    amount: 210,
    itemsCount: 4,
    time: 'Yesterday',
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-20260909-0084',
    customerName: 'Ramesh P.',
    pickupLocation: 'Gudalur pickup',
    status: 'Ready for Pickup',
    amount: 95,
    itemsCount: 2,
    time: 'Yesterday',
  },
  {
    id: 'ord-4',
    orderNumber: 'ORD-20260909-0079',
    customerName: 'Suresh M.',
    pickupLocation: 'Kotagiri pickup',
    status: 'Confirmed',
    amount: 180,
    itemsCount: 3,
    time: 'Yesterday',
  },
  {
    id: 'ord-5',
    orderNumber: 'ORD-20260908-0071',
    customerName: 'Priya N.',
    pickupLocation: 'Ooty pickup',
    status: 'Packed',
    amount: 320,
    itemsCount: 5,
    time: 'Sep 8',
  },
  {
    id: 'ord-6',
    orderNumber: 'ORD-20260908-0065',
    customerName: 'Karthik Raja',
    pickupLocation: 'Coonoor pickup',
    status: 'Ready for Pickup',
    amount: 150,
    itemsCount: 2,
    time: 'Sep 8',
  },
];

export interface SalesOnlineOrdersScreenProps {
  onBack?: () => void;
  onSelectOrder?: (order: OnlineOrderItem) => void;
  onOpenInvoice?: (order: OnlineOrderItem) => void;
}

type FilterTab = 'All' | 'Confirmed' | 'Packed' | 'Ready for Pickup' | 'Delivered';

export function SalesOnlineOrdersScreen({
  onBack,
  onSelectOrder,
  onOpenInvoice,
}: SalesOnlineOrdersScreenProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const filterTabs: FilterTab[] = ['All', 'Confirmed', 'Packed', 'Ready for Pickup', 'Delivered'];

  const filteredOrders = DEMO_ONLINE_ORDERS.filter((ord) => {
    if (activeTab === 'All') return true;
    return ord.status === activeTab;
  });

  const getStatusBadgeStyle = (status: OnlineOrderItem['status']) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#E0F2FE', text: '#0284C7' };
      case 'Packed':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'Ready for Pickup':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'Delivered':
        return { bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={SALES_PALETTE.pageBg} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BackChevronIcon />
          </TouchableOpacity>
        </View>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Online Orders</Text>
          <Text style={styles.screenSubtitle}>412 orders this month · Customer App</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          <FlatList
            horizontal
            data={filterTabs}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterTabsList}
            renderItem={({ item }) => {
              const isActive = activeTab === item;
              return (
                <TouchableOpacity
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setActiveTab(item)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          {/* Sub visual scroll track line */}
          <View style={styles.scrollTrackWrapper}>
            <Text style={styles.trackArrow}>◀</Text>
            <View style={styles.scrollTrackBar}>
              <View
                style={[
                  styles.scrollTrackThumb,
                  {
                    left:
                      activeTab === 'All'
                        ? '0%'
                        : activeTab === 'Confirmed'
                        ? '25%'
                        : activeTab === 'Packed'
                        ? '50%'
                        : '75%',
                  },
                ]}
              />
            </View>
            <Text style={styles.trackArrow}>▶</Text>
          </View>
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const badge = getStatusBadgeStyle(item.status);
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => {
                  if (item.status === 'Ready for Pickup') {
                    onOpenInvoice?.(item);
                  } else {
                    onSelectOrder?.(item);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.orderCardLeft}>
                  <View style={styles.packageIconBox}>
                    <PackageBoxIcon color={SALES_PALETTE.primaryOrange} size={20} />
                  </View>
                  <View style={styles.orderInfo}>
                    <View style={styles.orderNumberRow}>
                      <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                    </View>
                    <Text style={styles.orderCustomer}>
                      {item.customerName} · {item.pickupLocation}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.bg },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.orderCardRight}>
                  <Text style={styles.orderAmount}>₹{item.amount}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
  },
  container: {
    flex: 1,
    backgroundColor: SALES_PALETTE.pageBg,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  titleBlock: {
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: SALES_PALETTE.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: SALES_PALETTE.textSecondary,
    lineHeight: 18,
  },
  filterTabsContainer: {
    marginBottom: 18,
  },
  filterTabsList: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: SALES_PALETTE.cardBg,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
  },
  filterPillActive: {
    backgroundColor: SALES_PALETTE.primaryOrange,
    borderColor: SALES_PALETTE.primaryOrange,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: SALES_PALETTE.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollTrackWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  trackArrow: {
    fontSize: 8,
    color: '#A0978E',
  },
  scrollTrackBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#E6DFD5',
    borderRadius: 2,
    marginHorizontal: 4,
    position: 'relative',
  },
  scrollTrackThumb: {
    position: 'absolute',
    width: '35%',
    height: 3,
    backgroundColor: '#9E948B',
    borderRadius: 2,
  },
  ordersList: {
    paddingBottom: 32,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SALES_PALETTE.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SALES_PALETTE.borderSoft,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  orderCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  packageIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: SALES_PALETTE.primaryOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
  },
  orderCustomer: {
    fontSize: 12,
    color: SALES_PALETTE.textSecondary,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: SALES_PALETTE.textPrimary,
  },
});
