// Design id: M3S10
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import type { InventoryScreenBaseProps } from './types';
import { WarehouseSelector } from './WarehouseSelector';

export type StockVerificationScreenProps = InventoryScreenBaseProps;

// ─── Custom Icons matching Reference Mockup Exactly ─────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function LockSmallIcon({ size = 12, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StockTabBoxIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v1.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1.5z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M5 9v9.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V9"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path d="M10 13.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LedgerTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4.5l2 1.5 2-1.5 2 1.5 2-1.5 2 1.5 2-1.5 2 1.5V20H6V4.5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9.5 10.5h5M9.5 14h5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AllocationTabIcon({ color = adminColors.ink }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a10 10 0 1 0 0 20a10 10 0 0 0 0-20z" stroke={color} strokeWidth="1.8" />
      <Path d="M12 2v20" stroke={color} strokeWidth="1.8" />
      <Path d="M12 12h10" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function VerifyTabIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M7 8.5h3.5M7 12h3.5M7 15.5h3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Path
        d="M12.5 12l1.8 1.8 3.5-3.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HourglassIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 2h14M5 22h14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <Path
        d="M6 2v4a6 6 0 0 0 6 6 6 6 0 0 0-6 6v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M18 2v4a6 6 0 0 1-6 6 6 6 0 0 1 6 6v4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M9 18h6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M10 7h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

const DEFAULT_WAREHOUSE_OPTIONS = [
  { warehouseId: 'WH-COON', warehouseName: 'Coonoor Warehouse' },
  { warehouseId: 'WH-OOTY', warehouseName: 'Ooty Warehouse' },
  { warehouseId: 'WH-KOTA', warehouseName: 'Kotagiri Warehouse' },
  { warehouseId: 'WH-GDLR', warehouseName: 'Gudalur Warehouse' },
];

export interface ProductOption {
  id: string;
  name: string;
  singleQty: number;
  allQty: number;
}

const PRODUCT_OPTIONS: ProductOption[] = [
  { id: 'tomato', name: 'Tomato · Grade 1', singleQty: 100, allQty: 340 },
  { id: 'carrot', name: 'Carrot · Grade 1', singleQty: 80, allQty: 290 },
  { id: 'beans', name: 'Beans · Grade 1', singleQty: 50, allQty: 180 },
  { id: 'beetroot', name: 'Beetroot · Grade 1', singleQty: 45, allQty: 160 },
  { id: 'spinach', name: 'Spinach · Grade 2', singleQty: 20, allQty: 85 },
];

export function StockVerificationScreen({
  scope,
  can,
  onBack,
  onNavigate,
  warehouseOptions = DEFAULT_WAREHOUSE_OPTIONS,
}: StockVerificationScreenProps) {
  const canPerformCount = can('inventory.stock_verification.perform');
  const canViewLedger = can('inventory.stock_ledger.view_own') || can('inventory.stock_ledger.view_all');
  const canViewAll = can('inventory.stock_ledger.view_all');

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(scope.warehouseId);
  const [selectedProduct, setSelectedProduct] = useState<ProductOption>(
    PRODUCT_OPTIONS[0] ?? { id: 'tomato', name: 'Tomato · Grade 1', singleQty: 100, allQty: 340 }
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isAllWarehouses = canViewAll && selectedWarehouseId === undefined;
  const currentQuantity = isAllWarehouses ? selectedProduct.allQty : selectedProduct.singleQty;

  const verificationHistory = [
    {
      id: '1',
      date: '24 Sep',
      produce: 'Tomato',
      grade: 'Grade 1',
      systemQty: '100 KG',
      countedQty: '95 KG',
      variance: '-5 KG',
      status: 'Pending Review',
      badgeBg: adminColors.warning.bg,
      badgeColor: adminColors.warning.text,
      warehouse: 'Coonoor Warehouse',
      warehouseId: 'WH-COON',
    },
    {
      id: '2',
      date: '20 Sep',
      produce: 'Carrot',
      grade: 'Grade 1',
      systemQty: '80 KG',
      countedQty: '80 KG',
      variance: '0 KG',
      status: 'Matched',
      badgeBg: adminColors.success.bg,
      badgeColor: adminColors.success.text,
      warehouse: 'Coonoor Warehouse',
      warehouseId: 'WH-COON',
    },
    {
      id: '3',
      date: '15 Sep',
      produce: 'Beans',
      grade: 'Grade 1',
      systemQty: '50 KG',
      countedQty: '48 KG',
      variance: '-2 KG',
      status: 'Completed',
      badgeBg: adminColors.success.bg,
      badgeColor: adminColors.success.text,
      warehouse: 'Coonoor Warehouse',
      warehouseId: 'WH-COON',
    },
    {
      id: '4',
      date: '22 Sep',
      produce: 'Tomato',
      grade: 'Grade 1',
      systemQty: '120 KG',
      countedQty: '118 KG',
      variance: '-2 KG',
      status: 'Pending Review',
      badgeBg: adminColors.warning.bg,
      badgeColor: adminColors.warning.text,
      warehouse: 'Ooty Warehouse',
      warehouseId: 'WH-OOTY',
    },
    {
      id: '5',
      date: '18 Sep',
      produce: 'Carrot',
      grade: 'Grade 1',
      systemQty: '90 KG',
      countedQty: '88 KG',
      variance: '-2 KG',
      status: 'Completed',
      badgeBg: adminColors.success.bg,
      badgeColor: adminColors.success.text,
      warehouse: 'Kotagiri Warehouse',
      warehouseId: 'WH-KOTA',
    },
  ];

  const filteredHistory = isAllWarehouses
    ? verificationHistory
    : verificationHistory.filter(
        (item) => !selectedWarehouseId || item.warehouseId === selectedWarehouseId || item.warehouse === (scope.warehouseName ?? 'Coonoor Warehouse')
      );

  const handleStartPhysicalCount = () => {
    onNavigate?.('M3S11', {
      produceName: selectedProduct.name,
      systemCount: currentQuantity,
      batchId: 'BAT-2026-00124',
      zone: 'Cold Storage · A03',
    });
  };

  const handleHistoryItemPress = (item: (typeof verificationHistory)[0]) => {
    if (item.status === 'Pending Review') {
      onNavigate?.('M3S12', {
        produceName: item.produce,
        systemCount: 100,
        physicalCount: 95,
        varianceKg: -5,
        variancePct: -5,
        batchId: 'BAT-2026-00124',
        zone: 'Cold Storage · A03',
      });
    } else {
      onNavigate?.('M3S12', {
        produceName: item.produce,
        systemCount: 80,
        physicalCount: 80,
        varianceKg: 0,
        variancePct: 0,
        batchId: 'BAT-2026-00118',
        zone: 'Storage B-01',
      });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerBand}>
          <View style={styles.headerTopRow}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Back"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle} numberOfLines={1}>
              Stock Verification
            </Text>
          </View>

          {/* Warehouse Selector or Locked Pill based on role */}
          {!canViewAll || scope.warehouseId !== undefined ? (
            <View style={styles.warehousePill}>
              <LockSmallIcon size={12} color={adminColors.onBrand} />
              <Text style={styles.warehousePillText}>
                {(() => {
                  const raw = (scope.warehouseName ?? 'Coonoor Warehouse').replace(/\s*·\s*(Active|Assigned Warehouse)$/, '');
                  return raw.includes('Warehouse') ? raw : `${raw} Warehouse`;
                })()}
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 10 }}>
              <WarehouseSelector
                scope={scope}
                options={warehouseOptions}
                selectedId={selectedWarehouseId}
                onSelect={setSelectedWarehouseId}
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      <View style={styles.container}>
        {/* 4 Tab Cards Row */}
        <View style={styles.tabCardsRow}>
          <TouchableOpacity
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S02')}
            activeOpacity={0.7}
          >
            <StockTabBoxIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>Stock</Text>
          </TouchableOpacity>

          {canViewLedger ? (
            <TouchableOpacity
              style={styles.tabCard}
              onPress={() => onNavigate?.('M3S06')}
              activeOpacity={0.7}
            >
              <LedgerTabIcon color={adminColors.ink} />
              <Text style={styles.tabCardText}>Ledger</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.tabCard}
            onPress={() => onNavigate?.('M3S07')}
            activeOpacity={0.7}
          >
            <AllocationTabIcon color={adminColors.ink} />
            <Text style={styles.tabCardText}>Allocation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabCard, styles.activeTabCard]}
            activeOpacity={0.9}
          >
            <VerifyTabIcon color={adminColors.onBrand} />
            <Text style={[styles.tabCardText, styles.activeTabCardText]}>Verify</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* PRODUCT Dropdown Selector */}
          <TouchableOpacity
            style={styles.productPickerCard}
            onPress={() => setIsDropdownOpen(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.productPickerLabel}>PRODUCT</Text>
            <View style={styles.productPickerValueRow}>
              <Text style={styles.productPickerValueText}>{selectedProduct.name}</Text>
              <ChevronDownIcon size={20} color={adminColors.ink} />
            </View>
          </TouchableOpacity>

          {/* System Quantity */}
          <Text style={styles.sectionHeaderTitle}>System Quantity</Text>
          <View style={styles.quantityCard}>
            <Text style={styles.quantityValueText}>{currentQuantity} KG</Text>
            <Text style={styles.quantityLabelText}>SYSTEM QUANTITY</Text>
          </View>

          {/* Verification History */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Verification History</Text>
            <TouchableOpacity onPress={() => onNavigate?.('M3S14')} activeOpacity={0.7}>
              <Text style={styles.historyLink}>Adjustment History</Text>
            </TouchableOpacity>
          </View>
          {filteredHistory.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyCard}
              onPress={() => handleHistoryItemPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.historyCardTopRow}>
                <Text style={styles.historyDateText}>{item.date}</Text>
                <View style={[styles.historyBadge, { backgroundColor: item.badgeBg }]}>
                  <Text style={[styles.historyBadgeText, { color: item.badgeColor }]}>{item.status}</Text>
                </View>
              </View>

              <Text style={styles.historyProduceTitle}>{item.produce}</Text>

              <Text style={styles.historySubtitle}>
                {item.systemQty} → {item.countedQty}
                {item.variance !== '0 KG' && (
                  <Text style={styles.historyVarianceText}> · Variance {item.variance}</Text>
                )}
                {isAllWarehouses && (
                  <Text style={styles.historyWarehouseText}> · {item.warehouse}</Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Bottom CTA Button */}
        {canPerformCount ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.startCountButton}
              onPress={handleStartPhysicalCount}
              activeOpacity={0.85}
            >
              <HourglassIcon size={22} color={adminColors.onBrand} />
              <Text style={styles.startCountButtonText}>Start Physical Count</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Product Selection Modal */}
      <Modal visible={isDropdownOpen} transparent animationType="fade" onRequestClose={() => setIsDropdownOpen(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Product</Text>
            {PRODUCT_OPTIONS.map((prod) => (
              <TouchableOpacity
                key={prod.id}
                style={[
                  styles.modalItem,
                  selectedProduct.id === prod.id && styles.modalItemActive,
                ]}
                onPress={() => {
                  setSelectedProduct(prod);
                  setIsDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    selectedProduct.id === prod.id && styles.modalItemTextActive,
                  ]}
                >
                  {prod.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  headerSafeArea: {
    backgroundColor: adminColors.brand,
  },
  headerBand: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  warehousePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.headerPill.bg,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.headerPill.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
    gap: 6,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  body: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  tabCardsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  tabCard: {
    flex: 1,
    height: 74,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  activeTabCard: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  tabCardText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  activeTabCardText: {
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  productPickerCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  productPickerLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productPickerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPickerValueText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionHeaderTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyLink: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  quantityCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  quantityValueText: {
    ...adminType.kpiValue,
    color: adminColors.brandDeep,
    marginBottom: 4,
  },
  quantityLabelText: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 12,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDateText: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyBadgeText: {
    ...adminType.caption,
  },
  historyProduceTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 4,
  },
  historySubtitle: {
    ...adminType.body,
    color: adminColors.muted,
  },
  historyVarianceText: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: adminColors.canvas,
  },
  startCountButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startCountButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  // Aliases for compatibility with any callers / tests
  startButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  historyProduct: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyDate: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  historyDetails: {
    ...adminType.body,
    color: adminColors.muted,
  },
  varianceBold: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.canvas,
    justifyContent: 'center',
    padding: adminSpacing.xl,
  },
  modalContent: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    ...adminShadow.lg,
  },
  modalTitle: {
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  modalItemActive: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  modalItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  modalItemTextActive: {
    color: adminColors.brand,
    fontWeight: '800',
  },
  historyWarehouseText: {
    color: adminColors.brand,
    fontWeight: '600',
  },
});
