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
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { SubWarehouseSaleDetailScreen } from './SubWarehouseSaleDetailScreen';

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

  paidBg:        '#E6F4EA',
  paidText:      '#137333',
  pendingBg:     '#FEF3C7',
  pendingText:   '#B45309',
  amberText:     '#B45309',

  tabInactive:   '#827A74',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface SaleHistoryItem {
  id: string;
  customerName: string;
  itemCountText: string;
  channel: string;
  dateText: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Completed';
  invoiceNo?: string;
  customerCode?: string;
  paymentMethod?: string;
  items?: Array<{
    name: string;
    grade: string;
    batch: string;
    qtyText: string;
    pricePerUnit: number;
    lineTotal: number;
  }>;
}

const INITIAL_SALES_DATA: SaleHistoryItem[] = [
  {
    id: 'SALE-00251',
    customerName: 'Rajesh Kumar',
    customerCode: 'CUS-00291',
    itemCountText: '2 Items',
    channel: 'Direct Sale',
    dateText: '24 Sep · 6:35 PM',
    amount: 320,
    status: 'Paid',
    invoiceNo: 'INV-00251',
    paymentMethod: 'UPI',
    items: [
      {
        name: 'Tomato',
        grade: 'Grade 1',
        batch: 'BTH-00231',
        qtyText: '2 KG @ ₹100',
        pricePerUnit: 100,
        lineTotal: 200,
      },
      {
        name: 'Carrot',
        grade: 'Grade 1',
        batch: 'BTH-00189',
        qtyText: '1 KG @ ₹120',
        pricePerUnit: 120,
        lineTotal: 120,
      },
    ],
  },
  {
    id: 'SALE-00248',
    customerName: 'Walk-in',
    customerCode: 'CUS-00104',
    itemCountText: '1 Item',
    channel: 'Market Sale',
    dateText: '24 Sep · 3:10 PM',
    amount: 120,
    status: 'Paid',
    invoiceNo: 'INV-00248',
    paymentMethod: 'Cash',
    items: [
      {
        name: 'Carrot',
        grade: 'Grade 1',
        batch: 'BTH-00189',
        qtyText: '1 KG @ ₹120',
        pricePerUnit: 120,
        lineTotal: 120,
      },
    ],
  },
  {
    id: 'SALE-00240',
    customerName: 'Ganesh K.',
    customerCode: 'CUS-00388',
    itemCountText: '3 Items',
    channel: 'Direct Sale',
    dateText: '23 Sep · 5:45 PM',
    amount: 410,
    status: 'Pending',
    invoiceNo: 'INV-00240',
    paymentMethod: 'Wallet',
    items: [
      {
        name: 'Potato',
        grade: 'Grade 1',
        batch: 'BTH-00204',
        qtyText: '3 KG @ ₹50',
        pricePerUnit: 50,
        lineTotal: 150,
      },
      {
        name: 'Tomato',
        grade: 'Grade 2',
        batch: 'BTH-00219',
        qtyText: '2 KG @ ₹80',
        pricePerUnit: 80,
        lineTotal: 160,
      },
      {
        name: 'Onion',
        grade: 'Grade 1',
        batch: 'BTH-00177',
        qtyText: '2 KG @ ₹50',
        pricePerUnit: 50,
        lineTotal: 100,
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

function FilterSlidersIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export interface SubWarehouseSalesHistoryScreenProps {
  onBack?: (() => void) | undefined;
  onSelectSale?: ((sale: SaleHistoryItem) => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
}

export function SubWarehouseSalesHistoryScreen({
  onBack,
  onSelectSale,
  onTabChange,
}: SubWarehouseSalesHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SubWHTab>('Home');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<SaleHistoryItem | null>(null);

  const filteredSales = INITIAL_SALES_DATA.filter((sale) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      sale.id.toLowerCase().includes(q) ||
      sale.customerName.toLowerCase().includes(q) ||
      sale.channel.toLowerCase().includes(q) ||
      (sale.invoiceNo && sale.invoiceNo.toLowerCase().includes(q))
    );
  });

  const handleSalePress = (sale: SaleHistoryItem) => {
    if (onSelectSale) {
      onSelectSale(sale);
    } else {
      setSelectedSaleDetail(sale);
    }
  };

  const handleTabPress = (tab: SubWHTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    } else if (tab === 'Home' && onBack) {
      onBack();
    }
  };

  if (selectedSaleDetail) {
    return (
      <SubWarehouseSaleDetailScreen
        sale={selectedSaleDetail}
        onBack={() => setSelectedSaleDetail(null)}
        onTabChange={handleTabPress}
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

          <Text style={styles.headerTitle}>Sales History</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => Alert.alert('Filter Sales', 'Filter by Date range, Channel, or Payment Status.')}
            activeOpacity={0.8}
          >
            <FilterSlidersIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <View style={styles.mainContainer}>
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <SearchIcon size={18} color={PALETTE.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sale ID, invoice, customer"
            placeholderTextColor={PALETTE.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Sales List */}
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isPaid = item.status === 'Paid';
            return (
              <TouchableOpacity
                style={styles.saleCard}
                onPress={() => handleSalePress(item)}
                activeOpacity={0.82}
              >
                {/* Top Row: Sale ID & Status Pill */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.saleIdText}>{item.id}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isPaid ? PALETTE.paidBg : PALETTE.pendingBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isPaid ? PALETTE.paidText : PALETTE.pendingText },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Subtitle: Customer · Items */}
                <Text style={styles.customerSubText}>
                  {item.customerName} · {item.itemCountText}
                </Text>

                {/* Bottom Row: Channel (Left), Date & Amount (Right) */}
                <View style={styles.cardBottomRow}>
                  <Text style={styles.channelText}>{item.channel}</Text>

                  <View style={styles.rightInfoWrap}>
                    <Text style={styles.dateText}>{item.dateText}</Text>
                    <Text style={styles.amountText}>₹{item.amount}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.loadMoreWrap}
              onPress={() => Alert.alert('Loaded', 'All historical sales records loaded.')}
              activeOpacity={0.7}
            >
              <Text style={styles.loadMoreText}>Load More ↓</Text>
            </TouchableOpacity>
          }
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
    justifyContent: 'space-between',
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
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    marginBottom: 16,
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
  saleCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saleIdText: {
    fontSize: 15,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customerSubText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  channelText: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  rightInfoWrap: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 11,
    color: PALETTE.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  loadMoreWrap: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.amberText,
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
