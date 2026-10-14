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

// ─── Design Tokens ───────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: adminColors.muted,

  // Badges & Actions
  activeBadgeBg: adminColors.success.bg,
  activeBadgeText: adminColors.success.text,
  orangeBtn: adminColors.brand,
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
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

// Sliders / Tune Filter Icon (Exact Material Symbols tune)
function FilterSlidersIcon({ size = 20, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="15" cy="6" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="9" cy="12" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
      <Circle cx="16" cy="18" r="2.5" fill={THEME.headerBg} stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#78716C' }: { size?: number; color?: string }) {
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
    purchasePrice: '₹80.00/kg',
    markup: '10%',
    expenses: '₹10.00',
    expensesDetail: 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00',
    retailPrice: '₹98.00/kg',
    customerDiscount: '₹5.00',
    status: 'Active',
  },
  {
    id: 'rp-2',
    product: 'Cabbage',
    cropGrade: 'Cabbage · G2',
    category: 'Vegetables',
    grade: 'Grade 2',
    purchasePrice: '₹80.00/kg',
    markup: '10%',
    expenses: '₹10.00',
    expensesDetail: 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00',
    retailPrice: '₹98.00/kg',
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

  // Filter States (Screenshot 4)
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 3 Right, Screenshot 4 & Image 2/3 Detail ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={handleHeaderBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Retail Pricing</Text>
          </View>

          {/* Top Right Circular Filter Button */}
          <TouchableOpacity
            style={[styles.filterIconCircle, showFilters && styles.filterIconCircleActive]}
            onPress={() => {
              if (!showFilters && selectedItem) {
                setSelectedItem(null);
              }
              setShowFilters(!showFilters);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Toggle filters"
          >
            <FilterSlidersIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          View current retail prices by crop and grade
        </Text>
      </View>

      {/* ─── Main Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showFilters ? (
          /* ─── Filter Panel (Screenshot 4) ─── */
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeaderRow}>
              <FilterSlidersIcon size={18} color={THEME.titleRustDark} />
              <Text style={styles.filtersHeading}>Filters</Text>
            </View>

            {/* Sub-section: Category */}
            <Text style={styles.filterGroupLabel}>Category</Text>
            <View style={styles.chipsRow}>
              {(['All', 'Vegetables', 'Fruits'] as const).map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sub-section: Grade */}
            <Text style={[styles.filterGroupLabel, { marginTop: adminSpacing.md }]}>
              Grade
            </Text>
            <View style={styles.chipsRow}>
              {(['All', 'Grade 1', 'Grade 2'] as const).map((grd) => {
                const isSelected = selectedGrade === grd;
                return (
                  <TouchableOpacity
                    key={grd}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => setSelectedGrade(grd)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {grd}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buttons: Apply & Clear */}
            <View style={styles.filterButtonsRow}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setSelectedItem(null);
                  setShowFilters(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setSelectedCategory('All');
                  setSelectedGrade('All');
                  setSelectedItem(null);
                  setShowFilters(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : selectedItem ? (
          /* ─── Retail Pricing Detail View (Image 2 & 3 Request) ─── */
          <>
            <View style={styles.detailCard}>
              {/* Row 1: Product & Grade */}
              <View style={styles.detailGridRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Product</Text>
                  <Text style={styles.detailValue}>{selectedItem.product}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Grade</Text>
                  <Text style={styles.detailValue}>{selectedItem.grade}</Text>
                </View>
              </View>

              {/* Row 2: Purchase Price & Markup */}
              <View style={[styles.detailGridRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Purchase Price</Text>
                  <Text style={styles.detailValue}>{selectedItem.purchasePrice}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Markup</Text>
                  <Text style={styles.detailValue}>{selectedItem.markup}</Text>
                </View>
              </View>

              {/* Row 3: Expenses */}
              <View style={{ marginTop: adminSpacing.lg }}>
                <Text style={styles.detailLabel}>Expenses</Text>
                <Text style={[styles.detailExpensesValue, { marginTop: 4 }]}>
                  {selectedItem.expensesDetail}
                </Text>
              </View>

              {/* Row 4: Retail Price & Customer Discount */}
              <View style={[styles.detailGridRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Retail Price</Text>
                  <Text style={styles.detailValue}>{selectedItem.retailPrice}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Customer Discount</Text>
                  <Text style={styles.detailValue}>{selectedItem.customerDiscount}</Text>
                </View>
              </View>
            </View>

            {/* Button 1: View Markup & Pricing Breakdown */}
            <TouchableOpacity
              style={styles.viewBreakdownBtn}
              onPress={() => onSelectBreakdown && onSelectBreakdown(selectedItem)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewBreakdownBtnText}>
                View Markup & Pricing Breakdown
              </Text>
            </TouchableOpacity>

            {/* Button 2: Back to Retail Pricing */}
            <TouchableOpacity
              style={styles.backToRetailBtn}
              onPress={() => setSelectedItem(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.backToRetailBtnText}>Back to Retail Pricing</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* ─── Normal View with Search & Retail Pricing Cards (Screenshot 3 Right) ─── */
          <>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <SearchIcon size={18} color={THEME.labelMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Crop, product, category"
                placeholderTextColor={THEME.labelMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Retail Pricing Cards (Clicking opens Detail View Image 2/3) */}
            {filteredItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.retailCard}
                onPress={() => setSelectedItem(item)}
                activeOpacity={0.85}
              >
                {/* Header Row */}
                <View style={styles.retailCardHeader}>
                  <Text style={styles.retailCropTitle}>{item.cropGrade}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{item.status}</Text>
                  </View>
                </View>

                {/* 3 Columns Row */}
                <View style={styles.retailColsRow}>
                  <View style={styles.retailCol}>
                    <Text style={styles.colLabel}>Purchase Price</Text>
                    <Text style={styles.colValue}>{item.purchasePrice.replace('/kg', '')}</Text>
                  </View>
                  <View style={styles.retailCol}>
                    <Text style={styles.colLabel}>Markup</Text>
                    <Text style={styles.colValue}>{item.markup}</Text>
                  </View>
                  <View style={styles.retailCol}>
                    <Text style={styles.colLabel}>Expenses</Text>
                    <Text style={styles.colValue}>{item.expenses}</Text>
                  </View>
                </View>

                {/* Retail Price Subline */}
                <View style={styles.retailPriceSubRow}>
                  <Text style={styles.retailPriceLabel}>Retail Price</Text>
                  <Text style={styles.retailPriceValue}>{item.retailPrice.replace('/kg', '')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stylesheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.canvas,
  },

  // Header (Screenshot 3 Right & 4)
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.92)',
    marginTop: 4,
  },
  filterIconCircle: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconCircleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
  },

  // Scroll Body
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },

  // Search Bar (Screenshot 3 Right)
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.ink,
    paddingVertical: 0,
  },

  // Retail Pricing Card (Screenshot 3 Right)
  retailCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  retailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  retailCropTitle: {
    ...adminType.title,
    fontSize: 16,
    color: THEME.ink,
  },
  activeBadge: {
    backgroundColor: THEME.activeBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: adminRadius.full,
  },
  activeBadgeText: {
    ...adminType.caption,
    fontSize: 11,
    color: THEME.activeBadgeText,
  },

  // 3 Columns Row
  retailColsRow: {
    flexDirection: 'row',
    marginTop: adminSpacing.md,
    gap: adminSpacing.md,
  },
  retailCol: {
    flex: 1,
  },
  colLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: THEME.labelMuted,
  },
  colValue: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.ink,
    marginTop: 4,
  },

  // Retail Price Subline
  retailPriceSubRow: {
    marginTop: adminSpacing.md,
  },
  retailPriceLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: THEME.labelMuted,
  },
  retailPriceValue: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.ink,
    marginTop: 2,
  },

  // Retail Pricing Detail Card (Image 2/3)
  detailCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: THEME.labelMuted,
  },
  detailValue: {
    ...adminType.title,
    fontSize: 16,
    color: THEME.ink,
    marginTop: 4,
  },
  detailExpensesValue: {
    ...adminType.rowTitle,
    fontSize: 13,
    color: THEME.ink,
  },

  // Buttons in Retail Detail Screen (Image 2/3)
  viewBreakdownBtn: {
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBreakdownBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.titleRustDark,
  },
  backToRetailBtn: {
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.canvas,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  backToRetailBtnText: {
    ...adminType.caption,
    fontSize: 14,
    color: THEME.titleRustDark,
  },

  // Filters Panel (Screenshot 4)
  filtersContainer: {
    paddingTop: adminSpacing.xs,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: adminSpacing.md,
  },
  filtersHeading: {
    ...adminType.title,
    fontSize: 16,
    color: THEME.ink,
  },
  filterGroupLabel: {
    ...adminType.caption,
    fontSize: 13,
    color: THEME.ink,
    marginBottom: adminSpacing.xs,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
  },
  chip: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: THEME.headerBg,
    borderColor: THEME.headerBg,
  },
  chipText: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '600',
    color: THEME.ink,
  },
  chipTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },

  // Apply & Clear Buttons
  filterButtonsRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.xl,
  },
  applyBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.orangeBtn,
  },
  clearBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.canvas,
    borderRadius: adminRadius.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.caption,
    fontSize: 14,
    color: THEME.labelMuted,
  },
});
