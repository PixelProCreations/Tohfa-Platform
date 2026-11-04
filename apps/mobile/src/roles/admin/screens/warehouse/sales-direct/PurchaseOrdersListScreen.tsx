import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { WarehouseScreenBaseProps } from './types';

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

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

import type { PurchaseOrderRecord } from './types';

// ─── PO Record Interface ────────────────────────────────────────────────────

export type PurchaseOrderItem = PurchaseOrderRecord;

export const INITIAL_PO_LIST: PurchaseOrderItem[] = [
  {
    id: 'po-1',
    poNumber: 'PO-0009',
    listingCode: 'LST-2909',
    farmerName: 'Kumar',
    produceName: 'Beans',
    grade: 'Grade 2',
    quantityKg: 60,
    unitPrice: 55,
    totalPrice: 3300,
    warehouse: 'Main Warehouse, Ooty',
    dateStr: '30 Sep 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-2',
    poNumber: 'SO-0008',
    listingCode: 'LST-2908',
    farmerName: 'Meena',
    produceName: 'Carrot',
    grade: 'Grade 2',
    quantityKg: 90,
    unitPrice: 35,
    totalPrice: 3150,
    warehouse: 'Sub Warehouse, Coonoor',
    dateStr: '24 Sep 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-3',
    poNumber: 'SO-0007',
    listingCode: 'LST-2907',
    farmerName: 'Ramesh Kumar',
    produceName: 'Tomato',
    grade: 'Grade 2',
    quantityKg: 120,
    unitPrice: 36,
    totalPrice: 4320,
    warehouse: 'Sub Warehouse, Coonoor',
    dateStr: '8 Oct 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-4',
    poNumber: 'PO-0006',
    listingCode: 'LST-2906',
    farmerName: 'Senthil',
    produceName: 'Garlic',
    grade: 'Grade 1',
    quantityKg: 80,
    unitPrice: 110,
    totalPrice: 8800,
    warehouse: 'Main Warehouse, Ooty',
    dateStr: '10 Oct 2026',
    purchaseStatus: 'Receipt in progress',
    receiptStatus: 'Partial',
  },
  {
    id: 'po-5',
    poNumber: 'PO-0005',
    listingCode: 'LST-2905',
    farmerName: 'Anand Kumar',
    produceName: 'Potato',
    grade: 'Grade 1',
    quantityKg: 150,
    unitPrice: 45,
    totalPrice: 6750,
    warehouse: 'Main Warehouse, Ooty',
    dateStr: '12 Oct 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-6',
    poNumber: 'PO-0004',
    listingCode: 'LST-2904',
    farmerName: 'Deepa M.',
    produceName: 'Cabbage',
    grade: 'Grade 2',
    quantityKg: 70,
    unitPrice: 30,
    totalPrice: 2100,
    warehouse: 'Sub Warehouse, Kotagiri',
    dateStr: '14 Oct 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-7',
    poNumber: 'PO-0003',
    listingCode: 'LST-2903',
    farmerName: 'Ganesh K.',
    produceName: 'Onion',
    grade: 'Grade 1',
    quantityKg: 200,
    unitPrice: 40,
    totalPrice: 8000,
    warehouse: 'Main Warehouse, Ooty',
    dateStr: '16 Oct 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-8',
    poNumber: 'PO-0002',
    listingCode: 'LST-2902',
    farmerName: 'Praveen S.',
    produceName: 'Beetroot',
    grade: 'Grade 1',
    quantityKg: 50,
    unitPrice: 50,
    totalPrice: 2500,
    warehouse: 'Sub Warehouse, Coonoor',
    dateStr: '18 Oct 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
  {
    id: 'po-9',
    poNumber: 'PO-0001',
    listingCode: 'LST-2901',
    farmerName: 'Selvam R.',
    produceName: 'Carrot',
    grade: 'Grade 1',
    quantityKg: 110,
    unitPrice: 60,
    totalPrice: 6600,
    warehouse: 'Main Warehouse, Ooty',
    dateStr: '20 Oct 2026',
    purchaseStatus: 'Closed',
    receiptStatus: 'Completed',
  },
];

// ─── Component Props ─────────────────────────────────────────────────────────

export interface PurchaseOrdersListScreenProps extends WarehouseScreenBaseProps {
  onSelectPO?: ((po: PurchaseOrderItem) => void) | undefined;
  onOpenReceipt?: ((po: PurchaseOrderItem) => void) | undefined;
  onViewPayout?: ((po: PurchaseOrderItem) => void) | undefined;
  onOpenFilters?: (() => void) | undefined;
}

export function PurchaseOrdersListScreen({
  onBack,
  onSelectPO,
  onOpenReceipt,
  onViewPayout,
  onOpenFilters,
}: PurchaseOrdersListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return INITIAL_PO_LIST;
    const q = searchQuery.toLowerCase().trim();
    return INITIAL_PO_LIST.filter(
      (po) =>
        po.poNumber.toLowerCase().includes(q) ||
        po.farmerName.toLowerCase().includes(q) ||
        po.produceName.toLowerCase().includes(q) ||
        po.listingCode.toLowerCase().includes(q) ||
        po.warehouse.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner (Screenshot 2, Left Phone) ── */}
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
          <Text style={styles.headerTitle}>Purchase & Sales Orders list</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search & Filter Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={onOpenFilters}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>

        {/* ── Results Subtitle ── */}
        <Text style={styles.counterText}>
          {filteredOrders.length} of {INITIAL_PO_LIST.length} purchase orders
        </Text>

        {/* ── PO Cards List ── */}
        {filteredOrders.map((po) => {
          const isClosed = po.purchaseStatus === 'Closed';
          const isReceiptInProgress = po.purchaseStatus === 'Receipt in progress';

          return (
            <View key={po.id} style={styles.poCard}>
              <View style={styles.poCardHeaderRow}>
                <Text style={styles.poNumber}>{po.poNumber}</Text>
                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      isClosed
                        ? styles.badgeGreen
                        : isReceiptInProgress
                        ? styles.badgeAmber
                        : styles.badgeGray,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isClosed
                          ? styles.badgeTextGreen
                          : isReceiptInProgress
                          ? styles.badgeTextAmber
                          : styles.badgeTextGray,
                      ]}
                    >
                      {po.purchaseStatus}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      po.receiptStatus === 'Completed' ? styles.badgeGreen : styles.badgeAmber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        po.receiptStatus === 'Completed' ? styles.badgeTextGreen : styles.badgeTextAmber,
                      ]}
                    >
                      {po.receiptStatus}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.poDetailLine}>
                Listing {po.listingCode} · {po.farmerName}
              </Text>
              <Text style={styles.poDetailLine}>
                {po.produceName} · {po.grade} · {po.quantityKg} kg
              </Text>
              <Text style={styles.poDetailLine}>
                Unit price ₹{po.unitPrice.toFixed(2)}/kg · Total ₹
                {po.totalPrice.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text style={styles.poDetailLine}>
                {po.warehouse} · {po.dateStr}
              </Text>

              {/* Action Links Row */}
              <View style={styles.poActionsRow}>
                <TouchableOpacity
                  onPress={() => onSelectPO?.(po)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.poActionText}>View PO</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onOpenReceipt?.(po)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={styles.poActionText}>Open Receipt</Text>
                </TouchableOpacity>

                {isClosed && (
                  <TouchableOpacity
                    onPress={() => onViewPayout?.(po)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Text style={styles.poActionText}>View Payout</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: 14,
    paddingBottom: adminSpacing.xxxl,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    marginLeft: 6,
  },
  counterText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 12,
  },
  poCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 12,
    ...adminShadow.sm,
  },
  poCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  poNumber: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    fontWeight: '800',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeAmber: {
    backgroundColor: adminColors.warning.bg,
  },
  badgeGray: {
    backgroundColor: adminColors.canvas,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextAmber: {
    color: adminColors.warning.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  poDetailLine: {
    ...adminType.body,
    color: adminColors.ink,
    fontSize: 13,
    lineHeight: 19,
  },
  poActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  poActionText: {
    ...adminType.rowMeta,
    color: adminColors.brand,
    fontWeight: '700',
  },
});

