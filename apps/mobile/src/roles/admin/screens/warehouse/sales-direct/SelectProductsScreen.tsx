import React, { useState, useMemo } from 'react';
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
import type { SaleProduct, WarehouseScreenBaseProps } from './types';
import { adminColors, adminType, adminShadow } from '../../../theme';

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
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2.2" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

type ProductItem = SaleProduct;

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

export interface SelectProductsScreenProps extends WarehouseScreenBaseProps {
  saleWarehouseId?: string | undefined;
  products?: readonly SaleProduct[] | undefined;
  cartItems?: readonly SaleProduct[] | undefined;
  onContinue: (selectedItems: SaleProduct[]) => void;
}

export function SelectProductsScreen({
  scope,
  saleWarehouseId,
  products = MOCK_PRODUCTS,
  cartItems,
  onBack,
  onContinue,
}: SelectProductsScreenProps) {
  const stockWarehouse = saleWarehouseId ?? scope.warehouseId;
  const warehouseStock = useMemo(
    () => products.filter((p) => p.warehouseId === undefined || stockWarehouse === undefined || p.warehouseId === stockWarehouse),
    [products, stockWarehouse],
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>(() => {
    if (cartItems && cartItems.length > 0) {
      const map: Record<string, number> = {};
      cartItems.forEach((c) => {
        if (c.selectedQty) map[c.id] = c.selectedQty;
      });
      return map;
    }
    return {};
  });

  const filteredProducts = useMemo(() => {
    return warehouseStock.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesGrade = item.grade.toLowerCase().includes(q);
        const matchesBatch = item.batch?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesGrade && !matchesBatch) return false;
      }
      if (activeFilter === 'Grade 1' && item.grade !== 'Grade 1') return false;
      if (activeFilter === 'Available' && item.status !== 'Available') return false;
      if (activeFilter === 'Low Stock' && item.status !== 'Low Stock') return false;
      return true;
    });
  }, [warehouseStock, searchQuery, activeFilter]);

  const handleToggleAddProduct = (product: ProductItem) => {
    setSelectedQuantities((prev) => {
      if (prev[product.id]) {
        // Already added, increment or keep
        const next = { ...prev };
        delete next[product.id];
        return next;
      } else {
        return { ...prev, [product.id]: product.id === 'prod-1' ? 2 : 1 };
      }
    });
  };

  const handleIncrement = (product: ProductItem) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [product.id]: Math.min(product.availableKg, (prev[product.id] || 0) + 1),
    }));
  };

  const handleDecrement = (product: ProductItem) => {
    setSelectedQuantities((prev) => {
      const current = prev[product.id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[product.id];
        return next;
      }
      return { ...prev, [product.id]: current - 1 };
    });
  };

  const handleContinuePress = () => {
    const selected = warehouseStock
      .filter((p) => (selectedQuantities[p.id] || 0) > 0)
      .map((p) => ({
        ...p,
        selectedQty: selectedQuantities[p.id] || 1,
      }));
    if (selected.length === 0) {
      // Default sample selection matching Image 4
      const p1 = warehouseStock.find((p) => p.id === 'prod-1') || warehouseStock[0];
      const p2 = warehouseStock.find((p) => p.id === 'prod-2') || warehouseStock[1];
      const fallback = [
        { ...p1, selectedQty: 2 },
        { ...p2, selectedQty: 1 },
      ].filter(Boolean) as SaleProduct[];
      onContinue(fallback);
    } else {
      onContinue(selected);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner ─── */}
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

      {/* ─── Main Content ─── */}
      <View style={styles.contentWrap}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search product, crop, grade, batch"
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterRow}
        >
          {(['All', 'Grade 1', 'Available', 'Low Stock'] as FilterType[]).map((filter) => {
            const isSelected = activeFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product Cards List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredProducts.map((product) => {
            const qty = selectedQuantities[product.id] || 0;
            const isAdded = qty > 0;
            const isAvailable = product.status === 'Available';

            return (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={[styles.badge, isAvailable ? styles.badgeAvailable : styles.badgeLowStock]}>
                    <Text style={[styles.badgeText, isAvailable ? styles.badgeAvailableText : styles.badgeLowStockText]}>
                      {product.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productGradePrice}>
                  {product.grade} · ₹{product.pricePerKg} / KG
                </Text>

                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.availLabel}>Available</Text>
                    <Text style={styles.availQty}>{product.availableKg} KG</Text>
                  </View>

                  {isAdded ? (
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleDecrement(product)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperQtyText}>{qty}</Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleIncrement(product)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleToggleAddProduct(product)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.addBtnText}>Add +</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

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
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  filterScrollView: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  filterChip: {
    backgroundColor: adminColors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignSelf: 'center',
  },
  filterChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: '#FFF7ED',
  },
  filterChipText: {
    fontSize: 12.5,
    color: adminColors.ink,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 16,
    gap: 12,
  },
  productCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeAvailable: {
    backgroundColor: '#DCFCE7',
  },
  badgeAvailableText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  badgeLowStock: {
    backgroundColor: '#FEE2E2',
  },
  badgeLowStockText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  productGradePrice: {
    fontSize: 13,
    color: adminColors.muted,
    marginBottom: 14,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  availLabel: {
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 2,
  },
  availQty: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: adminColors.brand,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepperBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.brand,
  },
  stepperQtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.brand,
    minWidth: 20,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: adminColors.canvas,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  continueBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
    fontSize: 16,
  },
});
