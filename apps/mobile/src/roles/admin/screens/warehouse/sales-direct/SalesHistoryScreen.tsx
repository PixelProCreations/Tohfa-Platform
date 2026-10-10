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
import { adminColors, adminType, adminShadow } from '../../../theme';

import { WarehouseChips, inWarehouse, isAllWarehouses } from './SalesParts';
import type { SaleRecord, WarehouseScreenBaseProps } from './types';


export type SaleHistoryItem = SaleRecord;

const INITIAL_SALES_DATA: SaleHistoryItem[] = [
  {
    id: 'SALE-00251',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
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
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
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
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty Warehouse',
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

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

// Design id: M6-S08
export interface SalesHistoryScreenProps extends WarehouseScreenBaseProps {
  onSelectSale: (sale: SaleHistoryItem) => void;
  sales?: readonly SaleHistoryItem[] | undefined;
}

export function SalesHistoryScreen({
  scope,
  onBack,
  onSelectSale,
  sales = INITIAL_SALES_DATA,
}: SalesHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  // Main only: the picked warehouse (undefined = all). A Sub list is always
  // filtered to scope.warehouseId (FINAL_LIST row 116).
  const [pickedWarehouse, setPickedWarehouse] = useState<string | undefined>(undefined);
  const showWarehouse = isAllWarehouses(scope);

  const filteredSales = sales.filter((sale) => {
    if (!inWarehouse(scope, pickedWarehouse, sale.warehouseId)) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      sale.id.toLowerCase().includes(q) ||
      sale.customerName.toLowerCase().includes(q) ||
      sale.channel.toLowerCase().includes(q) ||
      (sale.invoiceNo && sale.invoiceNo.toLowerCase().includes(q)) ||
      (showWarehouse && (sale.warehouseName ?? '').toLowerCase().includes(q))
    );
  });

  const handleSalePress = (sale: SaleHistoryItem) => onSelectSale(sale);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sales History</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => Alert.alert('Filter Sales', 'Filter by Date range, Channel, or Payment Status.')}
            activeOpacity={0.8}
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Main Content ─── */}
      <View style={styles.mainContainer}>
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sale ID, invoice, customer"
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        <WarehouseChips scope={scope} selected={pickedWarehouse} onSelect={setPickedWarehouse} />

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
                      { backgroundColor: isPaid ? adminColors.success.bg : adminColors.warning.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isPaid ? adminColors.success.text : adminColors.warning.text },
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
                  <Text style={styles.channelText}>
                    {showWarehouse && item.warehouseName ? `${item.channel} · ${item.warehouseName}` : item.channel}
                  </Text>

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
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
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
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
    flex: 1,
    marginLeft: 8,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // Was translucent white over the orange header; no overlay token exists, so a solid deep-orange fill.
    backgroundColor: adminColors.brandDeep,
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
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  listContent: {
    paddingBottom: 20,
  },
  saleCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saleIdText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    ...adminType.rowTitle,
  },
  customerSubText: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  channelText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  rightInfoWrap: {
    alignItems: 'flex-end',
  },
  dateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  amountText: {
    ...adminType.title,
    color: adminColors.ink,
  },
  loadMoreWrap: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  loadMoreText: {
    ...adminType.sectionHead,
    color: adminColors.warning.text,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: 8,
    paddingBottom: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },
  navLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
