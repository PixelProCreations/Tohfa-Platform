import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { SubWarehouseHorecaDetailScreen } from './SubWarehouseHorecaDetailScreen';

// ─── Design Tokens (#F0562A Unified Subwarehouse Palette) ────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#7A726C',
  textMuted:     '#9E9690',
  border:        '#EBE5DC',
  divider:       '#F0EAE1',

  infoBoxBg:     '#EFF6FF',
  infoBoxBorder: '#BFDBFE',
  infoBoxText:   '#1E40AF',

  confirmedBg:   '#FEF3C7',
  confirmedText: '#B45309',
  processingBg:  '#FEF3C7',
  processingText:'#B45309',
  completedBg:   '#E6F4EA',
  completedText: '#137333',

  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface HorecaOrderItem {
  id: string;
  businessName: string;
  customerCode: string;
  status: 'Confirmed' | 'Pending' | 'Processing' | 'Completed';
  itemCountText: string;
  dateText: string;
  amount: number;
  items?: Array<{
    name: string;
    grade: string;
    batch: string;
    qtyText: string;
    pricePerUnit: number;
    lineTotal: number;
  }>;
}

const INITIAL_HORECA_ORDERS: HorecaOrderItem[] = [
  {
    id: 'HORECA-0021',
    businessName: 'Green Valley Restaurant',
    customerCode: 'CUS-H0021',
    status: 'Confirmed',
    itemCountText: '12 Items',
    dateText: '24 Sep · 10:20 AM',
    amount: 8500,
    items: [
      {
        name: 'Tomato',
        grade: 'Grade 1',
        batch: 'BTH-00231',
        qtyText: '50 KG @ ₹80',
        pricePerUnit: 80,
        lineTotal: 4000,
      },
      {
        name: 'Carrot',
        grade: 'Grade 1',
        batch: 'BTH-00189',
        qtyText: '45 KG @ ₹100',
        pricePerUnit: 100,
        lineTotal: 4500,
      },
    ],
  },
  {
    id: 'HORECA-0020',
    businessName: 'Highland Residency Hotel',
    customerCode: 'CUS-H0020',
    status: 'Processing',
    itemCountText: '18 Items',
    dateText: '24 Sep · 09:15 AM',
    amount: 14200,
    items: [
      {
        name: 'Potato',
        grade: 'Grade 1',
        batch: 'BTH-00204',
        qtyText: '100 KG @ ₹45',
        pricePerUnit: 45,
        lineTotal: 4500,
      },
      {
        name: 'Onion',
        grade: 'Grade 1',
        batch: 'BTH-00177',
        qtyText: '100 KG @ ₹45',
        pricePerUnit: 45,
        lineTotal: 4500,
      },
      {
        name: 'Cabbage',
        grade: 'Grade 1',
        batch: 'BTH-00162',
        qtyText: '130 KG @ ₹40',
        pricePerUnit: 40,
        lineTotal: 5200,
      },
    ],
  },
  {
    id: 'HORECA-0019',
    businessName: 'Nilgiri Tea & Dine',
    customerCode: 'CUS-H0019',
    status: 'Completed',
    itemCountText: '8 Items',
    dateText: '23 Sep · 04:45 PM',
    amount: 6800,
    items: [
      {
        name: 'Tomato',
        grade: 'Grade 1',
        batch: 'BTH-00231',
        qtyText: '40 KG @ ₹80',
        pricePerUnit: 80,
        lineTotal: 3200,
      },
      {
        name: 'Beans',
        grade: 'Grade 1',
        batch: 'BTH-00155',
        qtyText: '40 KG @ ₹90',
        pricePerUnit: 90,
        lineTotal: 3600,
      },
    ],
  },
];

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function EyeMonitorIcon({ size = 16, color = '#1E40AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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

// ─── Component Props ─────────────────────────────────────────────────────────

export interface SubWarehouseHorecaSalesScreenProps {
  onBack?: (() => void) | undefined;
  onSelectOrder?: ((order: HorecaOrderItem) => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
}

export function SubWarehouseHorecaSalesScreen({
  onBack,
  onSelectOrder,
  onTabChange,
}: SubWarehouseHorecaSalesScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SubWHTab>('Home');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<HorecaOrderItem | null>(null);

  const filteredOrders = INITIAL_HORECA_ORDERS.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      order.id.toLowerCase().includes(q) ||
      order.businessName.toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q)
    );
  });

  const handleTabPress = (tab: SubWHTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  const handleOrderPress = (order: HorecaOrderItem) => {
    if (onSelectOrder) {
      onSelectOrder(order);
    } else {
      setSelectedOrderDetail(order);
    }
  };

  if (selectedOrderDetail) {
    return (
      <SubWarehouseHorecaDetailScreen
        order={selectedOrderDetail}
        onBack={() => setSelectedOrderDetail(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>HORECA Sales</Text>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <View style={styles.mainContainer}>
        {/* ─── Policy Notice Banner ─── */}
        <View style={styles.policyBanner}>
          <EyeMonitorIcon size={18} color={PALETTE.infoBoxText} />
          <Text style={styles.policyBannerText}>
            View / monitoring access only — SWA doesn't have HORECA create/edit authority in this build.
          </Text>
        </View>

        {/* ─── KPI Metrics 4-Box Row ─── */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>12</Text>
            <Text style={styles.kpiLabel}>ORDERS</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>3</Text>
            <Text style={styles.kpiLabel}>PENDING</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>4</Text>
            <Text style={styles.kpiLabel}>PROCESSING</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiNumber}>5</Text>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
          </View>
        </View>

        {/* ─── Sales Value Card ─── */}
        <View style={styles.salesValueCard}>
          <Text style={styles.salesValueLabel}>Sales Value</Text>
          <Text style={styles.salesValueNumber}>₹48,500</Text>
        </View>

        {/* ─── Search Bar ─── */}
        <View style={styles.searchBarWrap}>
          <SearchIcon size={18} color={PALETTE.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order / business"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* ─── Orders List ─── */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isConfirmed = item.status === 'Confirmed' || item.status === 'Processing';
            return (
              <TouchableOpacity
                style={styles.orderCard}
                onPress={() => handleOrderPress(item)}
                activeOpacity={0.82}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.orderIdText}>{item.id}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isConfirmed
                          ? PALETTE.confirmedBg
                          : PALETTE.completedBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: isConfirmed
                            ? PALETTE.confirmedText
                            : PALETTE.completedText,
                        },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.businessNameText}>{item.businessName}</Text>

                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.itemCountText}>{item.itemCountText}</Text>
                    <Text style={styles.dateText}>{item.dateText}</Text>
                  </View>
                  <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>


    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    flex: 1,
    marginLeft: 8,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.infoBoxBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.infoBoxBorder,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  policyBannerText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.infoBoxText,
    fontWeight: '500',
    lineHeight: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: PALETTE.textMuted,
    letterSpacing: 0.3,
  },
  salesValueCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 14,
  },
  salesValueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 4,
  },
  salesValueNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: PALETTE.textInk,
    fontWeight: '500',
    padding: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  businessNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginTop: 6,
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  itemCountText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: PALETTE.cardBg,
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingTop: 8,
    paddingBottom: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 11,
    color: PALETTE.tabInactive,
    marginTop: 3,
    fontWeight: '500',
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
