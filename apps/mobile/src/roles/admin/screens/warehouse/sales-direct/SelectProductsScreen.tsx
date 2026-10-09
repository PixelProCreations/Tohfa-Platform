import React, { useState, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

  greenBadgeBg:  '#DCFCE7',
  greenBadgeText:'#15803D',
  redBadgeBg:    '#FEE2E2',
  redBadgeText:  '#DC2626',
};

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

function SearchIcon({ size = 18, color = '#9E9690' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProduceIcon({ size = 18, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="14" r="7" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7V4M10 5.5l4-3M14 5.5l-4-3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleBlueIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

interface ProductItem {
  id: string;
  name: string;
  grade: string;
  pricePerKg: number;
  availableKg: number;
  status: 'Available' | 'Low Stock';
  batch?: string;
  location?: string;
  selectedQty?: number;
}

const MOCK_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Tomato',
    grade: 'Grade 1',
    pricePerKg: 100,
    availableKg: 48,
    status: 'Available',
    batch: 'BTH-00231',
    location: 'Cold Storage · A02',
  },
  {
    id: 'prod-2',
    name: 'Carrot',
    grade: 'Grade 1',
    pricePerKg: 120,
    availableKg: 32,
    status: 'Available',
    batch: 'BTH-00232',
    location: 'Cold Storage · B01',
  },
  {
    id: 'prod-3',
    name: 'Beans',
    grade: 'Grade 1',
    pricePerKg: 140,
    availableKg: 6,
    status: 'Low Stock',
    batch: 'BTH-00233',
    location: 'Dry Rack · C03',
  },
  {
    id: 'prod-4',
    name: 'Potato',
    grade: 'Grade 1',
    pricePerKg: 45,
    availableKg: 60,
    status: 'Available',
    batch: 'BTH-00234',
    location: 'Storage · D01',
  },
  {
    id: 'prod-5',
    name: 'Cabbage',
    grade: 'Grade 2',
    pricePerKg: 35,
    availableKg: 25,
    status: 'Available',
    batch: 'BTH-00235',
    location: 'Storage · D02',
  },
];

type FilterType = 'All' | 'Grade 1' | 'Available' | 'Low Stock';

import { SaleSummaryScreen } from './SaleSummaryScreen';

export interface SelectProductsScreenProps {
  onBack?: (() => void) | undefined;
  onContinue?: ((selectedItems: ProductItem[]) => void) | undefined;
}

export function SelectProductsScreen({
  onBack,
  onContinue,
}: SelectProductsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [configuringQuantity, setConfiguringQuantity] = useState<number>(2);
  const [showSummaryScreen, setShowSummaryScreen] = useState(false);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((item) => {
      // Filter tab match
      if (activeFilter === 'Grade 1' && item.grade !== 'Grade 1') return false;
      if (activeFilter === 'Available' && item.status !== 'Available') return false;
      if (activeFilter === 'Low Stock' && item.status !== 'Low Stock') return false;

      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchGrade = item.grade.toLowerCase().includes(q);
        return matchName || matchGrade;
      }
      return true;
    });
  }, [searchQuery, activeFilter]);

  const handleOpenAddProduct = (product: ProductItem) => {
    if (expandedProductId === product.id) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(product.id);
      setConfiguringQuantity(selectedQuantities[product.id] || 2);
    }
  };

  const handleDecrementQuantity = () => {
    setConfiguringQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrementQuantity = (maxKg: number) => {
    setConfiguringQuantity((prev) => Math.min(maxKg, prev + 1));
  };

  const handleConfirmAddToSale = (productId: string) => {
    setSelectedProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
    setSelectedQuantities((prev) => ({
      ...prev,
      [productId]: configuringQuantity,
    }));
    setExpandedProductId(null);
  };

  const handleContinuePress = () => {
    const selected = MOCK_PRODUCTS.filter((p) => selectedProductIds.includes(p.id)).map((p) => ({
      ...p,
      selectedQty: selectedQuantities[p.id] || 2,
    }));
    if (onContinue) {
      onContinue(selected);
    } else {
      setShowSummaryScreen(true);
    }
  };

  if (showSummaryScreen) {
    return (
      <SaleSummaryScreen
        onBack={() => setShowSummaryScreen(false)}
        onContinueToCustomer={() => {
          Alert.alert('Sale Completed', 'Order submitted successfully for Coonoor Hub.');
        }}
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
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Products</Text>
        </View>
      </View>

      {/* ─── Search & Filters Bar ─── */}
      <View style={styles.topControlContainer}>
        {/* Search Input */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color="#9E9690" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product, crop, grade, batch"
            placeholderTextColor="#9E9690"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}
        >
          {(['All', 'Grade 1', 'Available', 'Low Stock'] as FilterType[]).map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillSelected,
                ]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextSelected,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Product Cards List ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredProducts.map((product) => {
          const isExpanded = expandedProductId === product.id;
          const isAdded = selectedProductIds.includes(product.id);
          const isAvailable = product.status === 'Available';

          if (isExpanded) {
            return (
              <View key={product.id} style={styles.expandedProductCard}>
                {/* Header with Produce Icon & Title */}
                <TouchableOpacity
                  style={styles.expandedTitleRow}
                  activeOpacity={0.7}
                  onPress={() => setExpandedProductId(null)}
                >
                  <ProduceIcon size={18} color="#8B5E3C" />
                  <Text style={styles.expandedTitleText}>
                    {product.name} · {product.grade}
                  </Text>
                </TouchableOpacity>

                {/* 2-Column Details: Selling Price & Available */}
                <View style={styles.expandedGridRow}>
                  <View style={styles.expandedGridCol}>
                    <Text style={styles.expandedGridLabel}>Selling Price</Text>
                    <Text style={styles.expandedGridValuePrice}>₹{product.pricePerKg} / KG</Text>
                  </View>
                  <View style={styles.expandedGridCol}>
                    <Text style={styles.expandedGridLabel}>Available</Text>
                    <Text style={styles.expandedGridValueAvail}>{product.availableKg} KG</Text>
                  </View>
                </View>

                {/* 2-Column Details: Batch & Location */}
                <View style={[styles.expandedGridRow, { marginTop: 12 }]}>
                  <View style={styles.expandedGridCol}>
                    <Text style={styles.expandedGridLabel}>Batch</Text>
                    <Text style={styles.expandedGridValueBatch}>
                      {product.batch || 'BTH-00231'}
                    </Text>
                  </View>
                  <View style={styles.expandedGridCol}>
                    <Text style={styles.expandedGridLabel}>Location</Text>
                    <Text style={styles.expandedGridValueLoc}>
                      {product.location || 'Cold Storage · A02'}
                    </Text>
                  </View>
                </View>

                {/* Internal Traceability Alert Banner */}
                <View style={styles.traceabilityBanner}>
                  <InfoCircleBlueIcon size={16} />
                  <Text style={styles.traceabilityText}>
                    Internal traceability (batch/location) is visible to SWA; farmer identity is never shown in this customer-facing flow.
                  </Text>
                </View>

                {/* Quantity Section */}
                <Text style={styles.quantitySectionHeader}>Quantity</Text>
                <View style={styles.quantityStepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    activeOpacity={0.7}
                    onPress={handleDecrementQuantity}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>

                  <Text style={styles.stepperValueText}>{configuringQuantity} KG</Text>

                  <TouchableOpacity
                    style={styles.stepperBtn}
                    activeOpacity={0.7}
                    onPress={() => handleIncrementQuantity(product.availableKg)}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* + Add to Sale CTA Button */}
                <TouchableOpacity
                  style={styles.addToSaleBtn}
                  activeOpacity={0.85}
                  onPress={() => handleConfirmAddToSale(product.id)}
                >
                  <Text style={styles.addToSaleBtnText}>+ Add to Sale</Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.cardTopRow}>
                <View>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productGradePrice}>
                    {product.grade} · ₹{product.pricePerKg} / KG
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    isAvailable ? styles.statusBadgeAvailable : styles.statusBadgeLowStock,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isAvailable ? styles.statusBadgeTextAvailable : styles.statusBadgeTextLowStock,
                    ]}
                  >
                    {product.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBottomRow}>
                <View>
                  <Text style={styles.availableLabel}>Available</Text>
                  <Text style={styles.availableValue}>{product.availableKg} KG</Text>
                </View>

                <TouchableOpacity
                  style={[styles.addBtn, isAdded && styles.addBtnSelected]}
                  onPress={() => handleOpenAddProduct(product)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.addBtnText, isAdded && styles.addBtnTextSelected]}>
                    {isAdded ? `Added (${selectedQuantities[product.id] || 2} KG) ✓` : 'Add +'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredProducts.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products match your search or filter.</Text>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ─── Bottom Action Button ─── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinuePress}
          activeOpacity={0.85}
        >
          <ArrowRightIcon size={18} />
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  topControlContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    paddingVertical: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  filterPill: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  filterPillSelected: {
    backgroundColor: PALETTE.primaryLight,
    borderColor: PALETTE.primary,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.textInk,
  },
  filterPillTextSelected: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productName: {
    fontSize: 17,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  productGradePrice: {
    fontSize: 12,
    fontWeight: '500',
    color: PALETTE.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusBadgeAvailable: {
    backgroundColor: PALETTE.greenBadgeBg,
  },
  statusBadgeLowStock: {
    backgroundColor: PALETTE.redBadgeBg,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextAvailable: {
    color: PALETTE.greenBadgeText,
  },
  statusBadgeTextLowStock: {
    color: PALETTE.redBadgeText,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  availableLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textMuted,
    marginBottom: 2,
  },
  availableValue: {
    fontSize: 18,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addBtnSelected: {
    backgroundColor: PALETTE.primaryLight,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  addBtnTextSelected: {
    color: PALETTE.primary,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: PALETTE.textMuted,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: PALETTE.pageBg,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // ─── Expanded Product Card (Matching Reference Design) ───
  expandedProductCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E85226',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#E85226',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  expandedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  expandedTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E1612',
  },
  expandedGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandedGridCol: {
    flex: 1,
  },
  expandedGridLabel: {
    fontSize: 12,
    color: '#7A726C',
    fontWeight: '500',
    marginBottom: 3,
  },
  expandedGridValuePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1612',
  },
  expandedGridValueAvail: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1612',
  },
  expandedGridValueBatch: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1612',
  },
  expandedGridValueLoc: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1612',
  },
  traceabilityBanner: {
    backgroundColor: '#EBF5FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  traceabilityText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#1E40AF',
    fontWeight: '500',
  },
  quantitySectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1612',
    marginTop: 16,
    marginBottom: 12,
  },
  quantityStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FDF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8B5E3C',
    marginTop: -2,
  },
  stepperValueText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E1612',
    minWidth: 60,
    textAlign: 'center',
  },
  addToSaleBtn: {
    backgroundColor: '#E85226',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#E85226',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addToSaleBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
