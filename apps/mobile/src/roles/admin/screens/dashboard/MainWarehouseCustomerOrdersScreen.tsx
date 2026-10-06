import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary: '#F0562A',
  primaryDark: '#D4451B',
  primaryLight: '#FFF0EB',
  headerBg: '#F0562A',
  headerPillBg: 'rgba(255, 255, 255, 0.22)',
  headerText: '#FFFFFF',

  pageBg: '#FAF7F2',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textHeading: '#7A4B28',
  textSecondary: '#7A726C',
  textMuted: '#9E9690',
  border: '#EDE8E0',
  borderLight: '#F4EFE9',

  greenBadgeBg: '#E6F7ED',
  greenBadgeText: '#0D6B4F',
  blueBadgeBg: '#E0F2FE',
  blueBadgeText: '#0369A1',
  orangeBadgeBg: '#FFF0EB',
  orangeBadgeText: '#F0562A',
  redBadgeBg: '#FEE2E2',
  redBadgeText: '#DC2626',

  tabActive: '#F0562A',
  tabInactive: '#827A74',
  tabBorder: '#EDE8E0',
};

// ─── SVG Icons ──────────────────────────────────────────────────────────────

function Grid4SquaresIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" fill={color} />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" fill={color} />
    </Svg>
  );
}

function BellOutlineIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BuildingWarehouseIcon({ size = 15, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownWhiteIcon({ size = 14, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningTriangleIcon({ size = 20, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="12" cy="17" r="1" fill={color} />
    </Svg>
  );
}

function DocumentOrdersIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="3" width="16" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 7h8M8 11h8M8 15h5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShelvesPickupIcon({ size = 26, color = '#F0562A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 3v18M20 3v18M4 7h16M4 12h16M4 17h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="7" y="8" width="4" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
      <Rect x="13" y="13" width="4" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

function HomeTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OrdersTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M8 9h8M8 13h6M8 17h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function InventoryTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabNavIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.tabActive : PALETTE.tabInactive;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

// ─── Types & Mock Data ──────────────────────────────────────────────────────

export interface WarehouseOrderSummaryItem {
  id: string;
  name: string;
  count: number;
}

export interface CustomerOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  warehouseName: string;
  itemsCount: number;
  amount: number;
  status: 'Confirmed' | 'Ready for Pickup' | 'New' | 'Needs Review' | 'Packed';
}

const WAREHOUSE_OPTIONS = ['All Warehouses', 'Ooty', 'Coonoor', 'Kotagiri', 'Gudalur'];

const INITIAL_SUMMARIES: WarehouseOrderSummaryItem[] = [
  { id: 'w1', name: 'Coonoor', count: 16 },
  { id: 'w2', name: 'Ooty', count: 12 },
  { id: 'w3', name: 'Kotagiri', count: 8 },
  { id: 'w4', name: 'Gudalur', count: 12 },
];

const INITIAL_ORDERS: CustomerOrderItem[] = [
  {
    id: 'ord-1024',
    orderNumber: 'ORD-1024',
    customerName: 'Arun Kumar',
    warehouseName: 'Coonoor',
    itemsCount: 4,
    amount: 850,
    status: 'Confirmed',
  },
  {
    id: 'ord-1025',
    orderNumber: 'ORD-1025',
    customerName: 'Divya Ramesh',
    warehouseName: 'Ooty',
    itemsCount: 2,
    amount: 420,
    status: 'Ready for Pickup',
  },
  {
    id: 'ord-1026',
    orderNumber: 'ORD-1026',
    customerName: 'Priya S',
    warehouseName: 'Kotagiri',
    itemsCount: 5,
    amount: 1150,
    status: 'New',
  },
  {
    id: 'ord-1027',
    orderNumber: 'ORD-1027',
    customerName: 'Karthik M',
    warehouseName: 'Coonoor',
    itemsCount: 3,
    amount: 640,
    status: 'Needs Review',
  },
];

export interface MainWarehouseCustomerOrdersScreenProps {
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: any) => void) | undefined;
  onViewOrderDetails?: ((orderId: string) => void) | undefined;
}

export function MainWarehouseCustomerOrdersScreen({
  onBack,
  onTabChange,
  onViewOrderDetails,
}: MainWarehouseCustomerOrdersScreenProps) {
  const [selectedWHFilter, setSelectedWHFilter] = useState('All Warehouses');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'Home' | 'Orders' | 'Inventory' | 'More'>('Orders');
  const [orderList, setOrderList] = useState<CustomerOrderItem[]>(INITIAL_ORDERS);
  const [orderFilterState, setOrderFilterState] = useState<'All' | 'Ready'>('All');

  const handleTabPress = (tab: 'Home' | 'Orders' | 'Inventory' | 'More') => {
    setActiveTab(tab);
    if (tab === 'Home' && onBack) {
      onBack();
    } else if (onTabChange) {
      onTabChange(tab);
    }
  };

  const handleViewOrders = () => {
    setOrderFilterState('All');
    Alert.alert('View Orders', 'Showing all customer orders across fulfillment centers.');
  };

  const handleReadyPickup = () => {
    setOrderFilterState('Ready');
    Alert.alert('Ready for Pickup', 'Filtering 9 orders ready for customer pickup.');
  };

  const handleNeedsAttention = () => {
    Alert.alert(
      'Stock Shortage Alert',
      'Order ORD-1027 (Karthik M) is short by 2 kg of Carrots at Coonoor Warehouse. Review stock ledger or initiate transfer.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Review Order',
          onPress: () => {
            if (onViewOrderDetails) onViewOrderDetails('ORD-1027');
          },
        },
      ]
    );
  };

  const getStatusBadgeStyle = (status: CustomerOrderItem['status']) => {
    switch (status) {
      case 'Confirmed':
      case 'Packed':
        return { bg: PALETTE.greenBadgeBg, text: PALETTE.greenBadgeText };
      case 'Ready for Pickup':
        return { bg: PALETTE.blueBadgeBg, text: PALETTE.blueBadgeText };
      case 'New':
        return { bg: PALETTE.orangeBadgeBg, text: PALETTE.orangeBadgeText };
      case 'Needs Review':
        return { bg: PALETTE.redBadgeBg, text: PALETTE.redBadgeText };
      default:
        return { bg: PALETTE.greenBadgeBg, text: PALETTE.greenBadgeText };
    }
  };

  const filteredOrders = orderList.filter((item) => {
    if (selectedWHFilter !== 'All Warehouses' && !item.warehouseName.toLowerCase().includes(selectedWHFilter.toLowerCase())) {
      return false;
    }
    if (orderFilterState === 'Ready' && item.status !== 'Ready for Pickup') {
      return false;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerBg} />

      {/* ─── Header Banner ─── */}
      <View style={styles.header}>
        {/* Top Status & Title Row */}
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleGroup}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.8}
              style={styles.headerIconBtn}
            >
              <Grid4SquaresIcon size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customer Orders</Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => Alert.alert('Notifications', 'You have 3 new order fulfillment alerts.')}
            activeOpacity={0.8}
          >
            <BellOutlineIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Warehouse Dropdown Selector */}
        <View style={styles.whSelectorRow}>
          <TouchableOpacity
            style={styles.whDropdownBtn}
            onPress={() => setShowFilterModal(true)}
            activeOpacity={0.8}
          >
            <BuildingWarehouseIcon size={16} color="#FFFFFF" />
            <Text style={styles.whDropdownText}>{selectedWHFilter}</Text>
            <ChevronDownWhiteIcon size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. KPI 2x2 Metric Grid ─── */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TOTAL ORDERS</Text>
            <Text style={styles.kpiValue}>48</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>NEW ORDERS</Text>
            <Text style={styles.kpiValue}>8</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>READY PICKUP</Text>
            <Text style={styles.kpiValue}>9</Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ISSUES</Text>
            <Text style={styles.kpiValue}>2</Text>
          </View>
        </View>

        {/* ─── 2. Warehouse Order Summary Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Warehouse Order Summary</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Warehouse Order Summary', 'Viewing detailed breakdown for all 4 sub-warehouses.')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewLinkText}>View →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryList}>
          {INITIAL_SUMMARIES.slice(0, 2).map((item) => (
            <View key={item.id} style={styles.summaryCard}>
              <Text style={styles.summaryWarehouseName}>{item.name}</Text>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{item.count} Orders</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── 3. Needs Attention Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Needs Attention</Text>
          <TouchableOpacity onPress={handleNeedsAttention} activeOpacity={0.7}>
            <Text style={styles.viewLinkText}>View →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.needsAttentionCard}
          onPress={handleNeedsAttention}
          activeOpacity={0.85}
        >
          <View style={styles.warningIconWrapper}>
            <WarningTriangleIcon size={22} color="#EF4444" />
          </View>
          <View style={styles.needsAttentionTextCol}>
            <Text style={styles.needsAttentionTitle}>Stock Shortage — 1 order</Text>
            <Text style={styles.needsAttentionSub}>Requires review before packing</Text>
          </View>
        </TouchableOpacity>

        {/* ─── 4. Quick Actions Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={handleViewOrders}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconBox}>
              <DocumentOrdersIcon size={24} color={PALETTE.primary} />
            </View>
            <Text style={styles.quickActionLabel}>View Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={handleReadyPickup}
            activeOpacity={0.8}
          >
            <View style={styles.quickActionIconBox}>
              <ShelvesPickupIcon size={24} color={PALETTE.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Ready for Pickup</Text>
          </TouchableOpacity>
        </View>

        {/* ─── 5. Recent Orders Section ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Recent Orders</Text>
        </View>

        <View style={styles.ordersList}>
          {filteredOrders.map((order) => {
            const badge = getStatusBadgeStyle(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => {
                  if (onViewOrderDetails) {
                    onViewOrderDetails(order.id);
                  } else {
                    Alert.alert(
                      order.orderNumber,
                      `Customer: ${order.customerName}\nWarehouse: ${order.warehouseName}\nItems: ${order.itemsCount}\nStatus: ${order.status}\nTotal: ₹${order.amount}`
                    );
                  }
                }}
                activeOpacity={0.85}
              >
                <View style={styles.orderCardTopRow}>
                  <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.customerNameText}>{order.customerName}</Text>

                <View style={styles.orderCardDivider} />

                <View style={styles.orderCardBottomRow}>
                  <Text style={styles.orderMetaText}>
                    {order.warehouseName} · {order.itemsCount} Items
                  </Text>
                  <Text style={styles.orderAmountText}>₹{order.amount}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ─── Bottom Tab Bar ─── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Home')}
          activeOpacity={0.7}
        >
          <HomeTabNavIcon active={activeTab === 'Home'} />
          <Text style={[styles.navLabel, activeTab === 'Home' && styles.navLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Orders')}
          activeOpacity={0.7}
        >
          <OrdersTabNavIcon active={activeTab === 'Orders'} />
          <Text style={[styles.navLabel, activeTab === 'Orders' && styles.navLabelActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('Inventory')}
          activeOpacity={0.7}
        >
          <InventoryTabNavIcon active={activeTab === 'Inventory'} />
          <Text style={[styles.navLabel, activeTab === 'Inventory' && styles.navLabelActive]}>
            Inventory
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => handleTabPress('More')}
          activeOpacity={0.7}
        >
          <MoreTabNavIcon active={activeTab === 'More'} />
          <Text style={[styles.navLabel, activeTab === 'More' && styles.navLabelActive]}>
            More
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Warehouse Filter Modal ─── */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Warehouse</Text>
            {WAREHOUSE_OPTIONS.map((wh) => (
              <TouchableOpacity
                key={wh}
                style={[
                  styles.modalOption,
                  selectedWHFilter === wh && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedWHFilter(wh);
                  setShowFilterModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedWHFilter === wh && styles.modalOptionTextSelected,
                  ]}
                >
                  {wh}
                </Text>
                {selectedWHFilter === wh && <View style={styles.selectedDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles matching M5-01 Screenshot ───────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.headerBg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PALETTE.headerText,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PALETTE.headerPillBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.headerPillBg,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 8,
  },
  whDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // 1. KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textHeading,
  },
  viewLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  // 2. Warehouse Order Summary
  summaryList: {
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryWarehouseName: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  summaryBadge: {
    backgroundColor: PALETTE.greenBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.greenBadgeText,
  },

  // 3. Needs Attention
  needsAttentionCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: PALETTE.primary,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  warningIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  needsAttentionTextCol: {
    flex: 1,
  },
  needsAttentionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  needsAttentionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },

  // 4. Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionIconBox: {
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    textAlign: 'center',
  },

  // 5. Recent Orders
  ordersList: {
    gap: 10,
  },
  orderCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  orderCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderNumberText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerNameText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 10,
  },
  orderCardDivider: {
    height: 1,
    backgroundColor: PALETTE.borderLight,
    marginBottom: 10,
  },
  orderCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderMetaText: {
    fontSize: 13,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  orderAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.tabInactive,
    marginTop: 4,
  },
  navLabelActive: {
    color: PALETTE.tabActive,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 14,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.borderLight,
  },
  modalOptionSelected: {
    backgroundColor: PALETTE.primaryLight,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: PALETTE.textInk,
  },
  modalOptionTextSelected: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PALETTE.primary,
  },
});
