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

import { inWarehouse, isAllWarehouses } from './SalesParts';
import type { SaleRecord, WarehouseScreenBaseProps } from './types';
import type { SalesFilterState } from './SalesFiltersScreen';

export type SaleHistoryItem = SaleRecord;

const INITIAL_SALES_DATA: SaleHistoryItem[] = [
  {
    id: 'SALE-00251',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    customerName: 'Rajesh Kumar',
    customerCode: 'CUS-00291',
    itemCountText: '2 items',
    channel: 'Direct Sale',
    dateText: '24 Sep 2026',
    amount: 320,
    status: 'Completed',
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
    id: 'SALE-00250',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    customerName: 'Priya Stores',
    customerCode: 'CUS-00152',
    itemCountText: '5 items',
    channel: 'Market Sale',
    dateText: '24 Sep 2026',
    amount: 1250,
    status: 'Completed',
    invoiceNo: 'INV-00250',
    paymentMethod: 'Cash',
    items: [
      {
        name: 'Carrot',
        grade: 'Grade 1',
        batch: 'BTH-00189',
        qtyText: '5 KG @ ₹120',
        pricePerUnit: 120,
        lineTotal: 600,
      },
      {
        name: 'Potato',
        grade: 'Grade 1',
        batch: 'BTH-00204',
        qtyText: '13 KG @ ₹50',
        pricePerUnit: 50,
        lineTotal: 650,
      },
    ],
  },
  {
    id: 'SALE-00249',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    customerName: 'Hotel Green View',
    customerCode: 'CUS-00087',
    itemCountText: '8 items',
    channel: 'HORECA Sale',
    dateText: '23 Sep 2026',
    amount: 4800,
    status: 'Completed',
    invoiceNo: 'INV-00249',
    paymentMethod: 'Bank Transfer',
    items: [
      {
        name: 'Tomato',
        grade: 'Grade 1',
        batch: 'BTH-00231',
        qtyText: '20 KG @ ₹100',
        pricePerUnit: 100,
        lineTotal: 2000,
      },
      {
        name: 'Potato',
        grade: 'Grade 1',
        batch: 'BTH-00204',
        qtyText: '40 KG @ ₹50',
        pricePerUnit: 50,
        lineTotal: 2000,
      },
      {
        name: 'Carrot',
        grade: 'Grade 1',
        batch: 'BTH-00189',
        qtyText: '8 KG @ ₹100',
        pricePerUnit: 100,
        lineTotal: 800,
      },
    ],
  },
  {
    id: 'SALE-00248',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor Warehouse',
    customerName: 'Metro Mart',
    customerCode: 'CUS-00192',
    itemCountText: '12 items',
    channel: 'B2B Sale',
    dateText: '23 Sep 2026',
    amount: 12400,
    status: 'Pending',
    invoiceNo: 'INV-00248',
    paymentMethod: 'Credit',
    items: [
      {
        name: 'Potato',
        grade: 'Grade 1',
        batch: 'BTH-00204',
        qtyText: '100 KG @ ₹50',
        pricePerUnit: 50,
        lineTotal: 5000,
      },
      {
        name: 'Tomato',
        grade: 'Grade 1',
        batch: 'BTH-00231',
        qtyText: '50 KG @ ₹100',
        pricePerUnit: 100,
        lineTotal: 5000,
      },
      {
        name: 'Carrot',
        grade: 'Grade 1',
        batch: 'BTH-00189',
        qtyText: '20 KG @ ₹120',
        pricePerUnit: 120,
        lineTotal: 2400,
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

// Design id: M6-S08 Sales History Screen
export interface SalesHistoryScreenProps extends WarehouseScreenBaseProps {
  onSelectSale: (sale: SaleHistoryItem) => void;
  onOpenFilters?: () => void;
  filters?: SalesFilterState | undefined;
  sales?: readonly SaleHistoryItem[] | undefined;
}

export function SalesHistoryScreen({
  scope,
  onBack,
  onSelectSale,
  onOpenFilters,
  filters,
  sales = INITIAL_SALES_DATA,
}: SalesHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.searchQuery ?? '');
  const showWarehouse = isAllWarehouses(scope);

  const pickedWarehouse = filters?.warehouseId;
  const statusFilter = filters?.status;
  const channelFilter = filters?.channel;
  const paymentFilter = filters?.paymentStatus;

  const filteredSales = sales.filter((sale) => {
    if (!inWarehouse(scope, pickedWarehouse, sale.warehouseId)) return false;

    if (statusFilter && statusFilter !== 'All' && sale.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    if (paymentFilter && paymentFilter !== 'All' && sale.status.toLowerCase() !== paymentFilter.toLowerCase()) {
      return false;
    }

    if (channelFilter && channelFilter !== 'All' && !sale.channel.toLowerCase().includes(channelFilter.toLowerCase())) {
      return false;
    }

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

      {/* ─── Top Brand Header Banner ─── */}
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
            onPress={onOpenFilters}
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

        {/* Sales List */}
        <FlatList
          data={filteredSales}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isCompleted = item.status === 'Completed' || item.status === 'Paid';
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
                      { backgroundColor: isCompleted ? adminColors.success.bg : adminColors.warning.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isCompleted ? adminColors.success.text : adminColors.warning.text },
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

                {/* Channel (Left) & Date (Right) Row */}
                <View style={styles.channelDateRow}>
                  <Text style={styles.channelText}>
                    {showWarehouse && item.warehouseName ? `${item.channel} · ${item.warehouseName}` : item.channel}
                  </Text>
                  <Text style={styles.dateText}>{item.dateText}</Text>
                </View>

                {/* Amount Row */}
                <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
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
    marginBottom: 12,
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
  channelDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  channelText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  dateText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  amountText: {
    ...adminType.title,
    color: adminColors.ink,
    marginTop: 8,
    fontWeight: '700',
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
