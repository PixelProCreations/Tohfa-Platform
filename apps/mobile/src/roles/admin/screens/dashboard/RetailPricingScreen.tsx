import React, { useState } from 'react';
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
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── Icons ───────────────────────────────────────────────────────────────────

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

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={adminColors.brand} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface RetailPriceItem {
  id: string;
  product: string;
  cropGrade: string;
  category: 'Vegetables' | 'Fruits';
  grade: 'Grade 1' | 'Grade 2' | 'Reject';
  purchasePrice: string;
  markup: string;
  expenses: string;
  expensesDetail: string;
  retailPrice: string;
  customerDiscount: string;
  effectiveDate?: string | undefined;
  status: 'Active';
}

export const SAMPLE_RETAIL_PRICES: RetailPriceItem[] = [
  {
    id: 'rp-1',
    product: 'Carrot',
    cropGrade: 'Carrot · G1',
    category: 'Vegetables',
    grade: 'Grade 1',
    purchasePrice: '₹80.00',
    markup: '10%',
    expenses: '₹10.00',
    expensesDetail: 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00',
    retailPrice: '₹98.00',
    customerDiscount: '₹5.00',
    status: 'Active',
  },
  {
    id: 'rp-2',
    product: 'Cabbage',
    cropGrade: 'Cabbage · G2',
    category: 'Vegetables',
    grade: 'Grade 2',
    purchasePrice: '₹80.00',
    markup: '10%',
    expenses: '₹10.00',
    expensesDetail: 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00',
    retailPrice: '₹98.00',
    customerDiscount: '₹5.00',
    status: 'Active',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface RetailPricingScreenProps {
  onBack: () => void;
  onSelectBreakdown?: (item: RetailPriceItem) => void;
}

export function RetailPricingScreen({
  onBack,
  onSelectBreakdown,
}: RetailPricingScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RetailPriceItem | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Vegetables' | 'Fruits'>('All');
  const [selectedGrade, setSelectedGrade] = useState<'All' | 'Grade 1' | 'Grade 2'>('All');

  const filteredItems = SAMPLE_RETAIL_PRICES.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) {
      return false;
    }
    if (selectedGrade !== 'All' && item.grade !== selectedGrade) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        item.cropGrade.toLowerCase().includes(q) ||
        item.product.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleHeaderBack = () => {
    if (showFilters) {
      setShowFilters(false);
    } else if (selectedItem) {
      setSelectedItem(null);
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleHeaderBack}
              activeOpacity={0.7}
              accessibilityLabel={t('retailPricing.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('retailPricing.title')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.filterIconCircle, showFilters && styles.filterIconCircleActive]}
            onPress={() => {
              if (!showFilters && selectedItem) {
                setSelectedItem(null);
              }
              setShowFilters(!showFilters);
            }}
            activeOpacity={0.8}
            accessibilityLabel={t('retailPricing.filterLabel')}
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        {!showFilters && (
          <Text style={styles.headerSubtitle}>
            View current retail prices by crop and grade
          </Text>
        )}
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* VIEW 1: Filter Panel */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersHeading}>{t('retailPricing.filters.title')}</Text>

            <Text style={styles.filterGroupLabel}>{t('retailPricing.filters.category')}</Text>
            <View style={styles.chipsRow}>
              {(['All', 'Vegetables', 'Fruits'] as const).map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.filterGroupLabel, styles.filterGroupSpacing]}>
              {t('retailPricing.filters.grade')}
            </Text>
            <View style={styles.chipsRow}>
              {(['All', 'Grade 1', 'Grade 2'] as const).map((gr) => {
                const isActive = selectedGrade === gr;
                return (
                  <TouchableOpacity
                    key={gr}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setSelectedGrade(gr)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {gr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.filterButtonsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>{t('retailPricing.filters.apply')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setSelectedCategory('All');
                  setSelectedGrade('All');
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearBtnText}>{t('retailPricing.filters.clearAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* VIEW 2: Detail Breakdown View */}
        {!showFilters && selectedItem && (
          <View>
            <View style={styles.detailCard}>
              {/* Row 1: Product & Grade */}
              <View style={styles.detailGridRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('retailPricing.label.product')}</Text>
                  <Text style={styles.detailValue}>{selectedItem.product}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('retailPricing.label.grade')}</Text>
                  <Text style={styles.detailValue}>{selectedItem.grade}</Text>
                </View>
              </View>

              {/* Row 2: Purchase Price & Markup */}
              <View style={[styles.detailGridRow, styles.gridRowSpacing]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('retailPricing.label.purchasePrice')}</Text>
                  <Text style={styles.detailValue}>
                    {selectedItem.purchasePrice.includes('/kg')
                      ? selectedItem.purchasePrice
                      : `${selectedItem.purchasePrice}/kg`}
                  </Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('retailPricing.label.markup')}</Text>
                  <Text style={styles.detailValue}>{selectedItem.markup}</Text>
                </View>
              </View>

              {/* Row 3: Expenses */}
              <View style={styles.gridRowSpacing}>
                <Text style={styles.detailLabel}>{t('retailPricing.label.expenses')}</Text>
                <Text style={styles.detailExpensesValue}>{selectedItem.expensesDetail}</Text>
              </View>

              {/* Row 4: Retail Price & Customer Discount */}
              <View style={[styles.detailGridRow, styles.gridRowSpacing]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('retailPricing.label.retailPrice')}</Text>
                  <Text style={styles.detailValue}>
                    {selectedItem.retailPrice.includes('/kg')
                      ? selectedItem.retailPrice
                      : `${selectedItem.retailPrice}/kg`}
                  </Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>{t('retailPricing.label.discount')}</Text>
                  <Text style={styles.detailValue}>{selectedItem.customerDiscount}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewBreakdownBtn}
              onPress={() => onSelectBreakdown?.(selectedItem)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewBreakdownBtnText}>{t('retailPricing.action.viewBreakdown')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToRetailBtn}
              onPress={() => setSelectedItem(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.backToRetailBtnText}>{t('retailPricing.action.backToRetail')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* VIEW 3: List View */}
        {!showFilters && !selectedItem && (
          <View>
            {/* Search Bar on Canvas */}
            <View style={styles.searchBar}>
              <SearchIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Crop, product, category"
                placeholderTextColor={adminColors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('retailPricing.empty')}</Text>
              </View>
            ) : (
              filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.retailCard}
                  onPress={() => setSelectedItem(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cropTitleText}>{item.cropGrade}</Text>
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>{item.status}</Text>
                    </View>
                  </View>

                  <View style={styles.retailColsRow}>
                    <View style={styles.retailCol}>
                      <Text style={styles.colLabel}>{t('retailPricing.label.purchasePrice')}</Text>
                      <Text style={styles.colValue}>{item.purchasePrice}</Text>
                    </View>
                    <View style={styles.retailCol}>
                      <Text style={styles.colLabel}>{t('retailPricing.label.markup')}</Text>
                      <Text style={styles.colValue}>{item.markup}</Text>
                    </View>
                    <View style={styles.retailCol}>
                      <Text style={styles.colLabel}>{t('retailPricing.label.expenses')}</Text>
                      <Text style={styles.colValue}>{item.expenses}</Text>
                    </View>
                  </View>

                  <View style={styles.retailPriceSubRow}>
                    <Text style={styles.retailPriceLabel}>{t('retailPricing.label.retailPrice')}</Text>
                    <Text style={styles.retailPriceValue}>{item.retailPrice}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
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
    letterSpacing: -0.3,
  },
  filterIconCircle: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconCircleActive: {
    backgroundColor: adminColors.brandDeep,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: 4,
    opacity: 0.95,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    fontSize: 14,
    color: adminColors.ink,
    padding: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  retailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  cropTitleText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activeBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
  },
  activeBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  retailColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  retailCol: {
    flex: 1,
  },
  colLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  colValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  retailPriceSubRow: {
    marginTop: adminSpacing.md,
  },
  retailPriceLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  retailPriceValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  detailCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridRowSpacing: {
    marginTop: adminSpacing.md,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  detailValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  detailExpensesValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  viewBreakdownBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBreakdownBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  backToRetailBtn: {
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  backToRetailBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  filtersContainer: {
    paddingTop: adminSpacing.xs,
  },
  filtersHeading: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  filterGroupLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: adminSpacing.xs,
  },
  filterGroupSpacing: {
    marginTop: adminSpacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  chip: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
  },
  chipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  chipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  applyBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  clearBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
  },
  bottomSpacer: {
    height: 40,
  },
});
