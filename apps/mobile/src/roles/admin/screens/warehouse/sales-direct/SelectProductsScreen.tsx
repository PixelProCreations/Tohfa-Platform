import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
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
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listSaleProducts, type SaleProductDto } from '../../../api/sales';
import { toSaleProduct } from './mappers';
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

function ProduceIcon({ size = 18, color = adminColors.warning.text }: { size?: number; color?: string }) {
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
      <Circle cx="12" cy="12" r="10" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function QuestionCircleIcon({ size = 20, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkOutlineIcon({ size = 18, color = adminColors.success.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CancelCrossIcon({ size = 18, color = adminColors.brandDeep }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

type ProductItem = SaleProduct;

type FilterType = 'All' | 'GRADE_1' | 'Available' | 'Low Stock';

// Design id: M6-S03
export interface SelectProductsScreenProps extends WarehouseScreenBaseProps {
  /** Warehouse the sale is made from: only its stock is offered. Defaults to scope.warehouseId. */
  saleWarehouseId?: string | undefined;
  products?: readonly SaleProduct[] | undefined;
  isLoading?: boolean | undefined;
  error?: unknown | undefined;
  onRetry?: (() => void) | undefined;
  onContinue: (selectedItems: SaleProduct[]) => void;
}

export function SelectProductsScreen({
  scope,
  saleWarehouseId,
  products: productsProp,
  isLoading: isLoadingProp,
  error: errorProp,
  onRetry: onRetryProp,
  onBack,
  onContinue,
}: SelectProductsScreenProps) {
  // Products are limited to the sale warehouse's stock (FINAL_LIST row 118).
  const stockWarehouse = saleWarehouseId ?? scope.warehouseId;
  const productsQuery = useAdminQuery(
    adminKeys.scoped('sales', stockWarehouse ?? 'all', { resource: 'products' }),
    (signal: AbortSignal) => listSaleProducts({ channel: 'DIRECT', warehouseId: stockWarehouse }, signal),
    { enabled: productsProp === undefined }
  );

  const effectiveLoading = isLoadingProp ?? (productsProp === undefined && productsQuery.isLoading);
  const effectiveError = errorProp ?? (productsProp === undefined ? productsQuery.error : undefined);
  const effectiveRetry = onRetryProp ?? (productsProp === undefined ? () => productsQuery.refetch() : undefined);

  const rawProducts: readonly SaleProduct[] = useMemo(() => {
    if (productsProp !== undefined) return productsProp;
    if (productsQuery.data?.items) {
      return productsQuery.data.items.map((dto: SaleProductDto) => toSaleProduct(dto, stockWarehouse));
    }
    return [];
  }, [productsProp, productsQuery.data, stockWarehouse]);

  const warehouseStock = useMemo(
    () => rawProducts.filter((p) => p.warehouseId === undefined || stockWarehouse === undefined || p.warehouseId === stockWarehouse),
    [rawProducts, stockWarehouse],
  );
  const [screenStep, setScreenStep] = useState<'initial' | 'confirm_add' | 'summary'>('initial');
  const [pendingProduct, setPendingProduct] = useState<ProductItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [configuringQuantity, setConfiguringQuantity] = useState<number>(1);

  const displayProducts = useMemo(() => {
    return [...warehouseStock].sort((a, b) => a.name.localeCompare(b.name));
  }, [warehouseStock]);

  const visibleProducts = useMemo(() => {
    if (screenStep !== 'summary') {
      return displayProducts;
    }
    return displayProducts.filter((item) => {
      if (activeFilter === 'GRADE_1' && item.grade !== 'GRADE_1') return false;
      if (activeFilter === 'Available' && item.status !== 'Available') return false;
      if (activeFilter === 'Low Stock' && item.status !== 'Low Stock') return false;
      return true;
    });
  }, [displayProducts, activeFilter, screenStep]);

  const handleOpenAddProduct = (product: ProductItem) => {
    if (expandedProductId === product.id) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(product.id);
      setConfiguringQuantity(selectedQuantities[product.id] || 1);
    }
  };

  const handleDecrementQuantity = () => {
    setConfiguringQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrementQuantity = (maxKg: number) => {
    setConfiguringQuantity((prev) => Math.min(maxKg, prev + 1));
  };

  const handleAddToSalePress = (product: ProductItem) => {
    setPendingProduct(product);
    setExpandedProductId(null);
    setScreenStep('confirm_add');
  };

  const handleConfirmAddProduct = () => {
    if (pendingProduct) {
      setSelectedProductIds((prev) => (prev.includes(pendingProduct.id) ? prev : [...prev, pendingProduct.id]));
      setSelectedQuantities((prev) => ({
        ...prev,
        [pendingProduct.id]: configuringQuantity,
      }));
    }
    setScreenStep('summary');
  };

  const handleCancelAddProduct = () => {
    setScreenStep('initial');
    setExpandedProductId(pendingProduct?.id ?? null);
  };

  const handleContinuePress = () => {
    const selected = warehouseStock.filter((p) => selectedProductIds.includes(p.id)).map((p) => ({
      ...p,
      selectedQty: selectedQuantities[p.id] || 1,
    }));
    onContinue(selected);
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

      {/* ─── Product Cards List ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {screenStep === 'summary' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {(['All', 'GRADE_1', 'Available', 'Low Stock'] as FilterType[]).map((filter) => {
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
        )}

        {effectiveLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="small" color={adminColors.brand} />
            <Text style={styles.stateText}>Loading products...</Text>
          </View>
        ) : effectiveError ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>Failed to load products.</Text>
            {effectiveRetry && (
              <TouchableOpacity onPress={effectiveRetry} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : visibleProducts.length === 0 ? (
          <View style={styles.stateContainer}>
            <Text style={styles.stateText}>No products available</Text>
          </View>
        ) : (
          visibleProducts.map((product) => {
            const isExpanded = screenStep === 'initial' && expandedProductId === product.id;
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
                    <ProduceIcon size={18} color={adminColors.warning.text} />
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
                        {product.batch || '—'}
                      </Text>
                    </View>
                    <View style={styles.expandedGridCol}>
                      <Text style={styles.expandedGridLabel}>Location</Text>
                      <Text style={styles.expandedGridValueLoc}>
                        {product.location || '—'}
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
                    onPress={() => handleAddToSalePress(product)}
                  >
                    <Text style={styles.addToSaleBtnText}>+ Add to Sale</Text>
                  </TouchableOpacity>
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => handleOpenAddProduct(product)}
                activeOpacity={0.8}
              >
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
                      {isAdded ? `Added (${selectedQuantities[product.id] || 1} KG) ✓` : 'Add +'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* ─── Add Product? Confirmation Card (Image 2) ─── */}
        {screenStep === 'confirm_add' && (
          <View style={styles.confirmAddCard}>
            <View style={styles.confirmAddHeader}>
              <QuestionCircleIcon size={20} color={adminColors.success.text} />
              <Text style={styles.confirmAddTitle}>Add Product?</Text>
            </View>

            <View style={styles.confirmAddSubBox}>
              <Text style={styles.confirmAddProdName}>
                {pendingProduct?.name || '—'} · {pendingProduct?.grade || '—'}
              </Text>
              <Text style={styles.confirmAddCalculation}>
                {configuringQuantity} KG × ₹{pendingProduct?.pricePerKg || 0} = ₹{configuringQuantity * (pendingProduct?.pricePerKg || 0)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.confirmAddBtn}
              onPress={handleConfirmAddProduct}
              activeOpacity={0.8}
            >
              <CheckmarkOutlineIcon size={18} color={adminColors.success.text} />
              <Text style={styles.confirmAddBtnText}>Add to Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={handleCancelAddProduct}
              activeOpacity={0.8}
            >
              <CancelCrossIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.confirmCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Sale Summary Card (Image 3) ─── */}
        {screenStep === 'summary' && selectedProductIds.length > 0 && (() => {
          const selectedItems = warehouseStock.filter((p) => selectedProductIds.includes(p.id));
          const totalAmount = selectedItems.reduce((acc, p) => acc + (selectedQuantities[p.id] || 0) * p.pricePerKg, 0);
          return (
            <View style={styles.summaryCardBox}>
              <View style={styles.summaryHeaderRow}>
                <Text style={styles.summaryTitleText}>
                  {selectedItems.length} {selectedItems.length === 1 ? 'Product' : 'Products'}
                </Text>
                <Text style={styles.summarySubText}>in this sale</Text>
              </View>

              {selectedItems.map((p) => (
                <View key={p.id} style={styles.summaryItemRow}>
                  <Text style={styles.summaryItemName}>{p.name}</Text>
                  <Text style={styles.summaryItemQty}>{selectedQuantities[p.id] || 0} KG</Text>
                </View>
              ))}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>₹{totalAmount}</Text>
              </View>
            </View>
          );
        })()}

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
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  topControlContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  filterPill: {
    backgroundColor: adminColors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  filterPillSelected: {
    backgroundColor: adminColors.brandTint,
    borderColor: adminColors.brand,
  },
  filterPillText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  filterPillTextSelected: {
    color: adminColors.brand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  productCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    ...adminType.title,
    color: adminColors.ink,
    marginBottom: 3,
  },
  productGradePrice: {
    ...adminType.body,
    color: adminColors.muted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusBadgeAvailable: {
    backgroundColor: adminColors.success.bg,
  },
  statusBadgeLowStock: {
    backgroundColor: adminColors.danger.bg,
  },
  statusBadgeText: {
    ...adminType.caption,
  },
  statusBadgeTextAvailable: {
    color: adminColors.success.text,
  },
  statusBadgeTextLowStock: {
    color: adminColors.danger.text,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  availableLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  availableValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addBtnSelected: {
    backgroundColor: adminColors.brandTint,
  },
  addBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
  addBtnTextSelected: {
    color: adminColors.brand,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
  },

  // ─── Expanded Product Card (Matching Reference Design) ───
  expandedProductCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.brand,
    padding: 16,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  expandedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  expandedTitleText: {
    ...adminType.title,
    color: adminColors.ink,
  },
  expandedGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandedGridCol: {
    flex: 1,
  },
  expandedGridLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 3,
  },
  expandedGridValuePrice: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  expandedGridValueAvail: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  expandedGridValueBatch: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  expandedGridValueLoc: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  traceabilityBanner: {
    backgroundColor: adminColors.info.bg,
    borderColor: adminColors.info.border,
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
    ...adminType.rowMeta,
    color: adminColors.info.text,
  },
  quantitySectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
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
    borderRadius: 22,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    ...adminType.title,
    color: adminColors.brandDeep,
    marginTop: -2,
  },
  stepperValueText: {
    ...adminType.title,
    color: adminColors.ink,
    minWidth: 70,
    textAlign: 'center',
  },
  addToSaleBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    ...adminShadow.sm,
  },
  addToSaleBtnText: {
    color: adminColors.onBrand,
    ...adminType.sectionHead,
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
    height: 50,
    gap: 8,
  },
  continueBtnText: {
    color: adminColors.onBrand,
    ...adminType.title,
  },
  confirmAddCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: adminColors.success.border,
    padding: 16,
    marginTop: 12,
  },
  confirmAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmAddTitle: {
    ...adminType.title,
    color: adminColors.success.text,
  },
  confirmAddSubBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  confirmAddProdName: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.muted,
    marginBottom: 6,
  },
  confirmAddCalculation: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  confirmAddBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.success.border,
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: adminColors.card,
    gap: 6,
  },
  confirmAddBtnText: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  confirmCancelBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: adminColors.card,
    gap: 6,
  },
  confirmCancelBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  summaryCardBox: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    padding: 16,
    marginTop: 12,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  summaryTitleText: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  summarySubText: {
    ...adminType.body,
    color: adminColors.brandDeep,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryItemName: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  summaryItemQty: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: adminColors.brand,
    opacity: 0.4,
    marginVertical: 10,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  summaryTotalValue: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  stateText: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: adminColors.brand,
    borderRadius: 8,
  },
  retryButtonText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
});
