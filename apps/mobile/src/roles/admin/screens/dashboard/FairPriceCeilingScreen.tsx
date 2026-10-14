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
  labelMuted: '#78716C',

  // Badges & Actions
  activeBadgeBg: '#DCFCE7',
  activeBadgeText: '#15803D',
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

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Data Types ──────────────────────────────────────────────────────────────

export interface FairPriceItem {
  id: string;
  crop: string;
  category: 'Vegetables' | 'Fruits';
  grade: 'Grade 1' | 'Grade 2' | 'Reject';
  fairPriceCeiling: string;
  frequency: string;
  effectiveFrom: string;
  status: 'Active';
  purchasePrice?: string;
  markup?: string;
  expensesDetail?: string;
  retailPrice?: string;
  customerDiscount?: string;
}

export const SAMPLE_FAIR_PRICES: FairPriceItem[] = [
  {
    id: 'FP-001',
    crop: 'Carrot',
    category: 'Vegetables',
    grade: 'Grade 1',
    fairPriceCeiling: '₹100.00/kg',
    frequency: 'Weekly',
    effectiveFrom: '30 Sep 2026',
    status: 'Active',
    purchasePrice: '₹80.00/kg',
    markup: '10%',
    expensesDetail: 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00',
    retailPrice: '₹98.00/kg',
    customerDiscount: '₹5.00',
  },
  {
    id: 'FP-002',
    crop: 'Cabbage',
    category: 'Vegetables',
    grade: 'Grade 2',
    fairPriceCeiling: '₹100.00/kg',
    frequency: 'Weekly',
    effectiveFrom: '30 Sep 2026',
    status: 'Active',
    purchasePrice: '₹80.00/kg',
    markup: '10%',
    expensesDetail: 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00',
    retailPrice: '₹98.00/kg',
    customerDiscount: '₹5.00',
  },
  {
    id: 'FP-003',
    crop: 'Tomato',
    category: 'Vegetables',
    grade: 'Grade 1',
    fairPriceCeiling: '₹60.00/kg',
    frequency: 'Weekly',
    effectiveFrom: '29 Sep 2026',
    status: 'Active',
    purchasePrice: '₹48.00/kg',
    markup: '10%',
    expensesDetail: 'Freight ₹4.00 · Loading ₹1.50 · Unloading ₹2.50',
    retailPrice: '₹59.00/kg',
    customerDiscount: '₹3.00',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface FairPriceCeilingScreenProps {
  onBack: () => void;
  onSelectPriceItem?: (item: FairPriceItem) => void;
  onNavigateToBreakdown?: (item: FairPriceItem) => void;
  onUpdatePrice?: (item: any) => void;
  onBulkUpdate?: () => void;
  onViewHistory?: (item: any) => void;
}

export function FairPriceCeilingScreen({
  onBack,
  onSelectPriceItem,
  onNavigateToBreakdown,
}: FairPriceCeilingScreenProps) {
  const [selectedItem, setSelectedItem] = useState<FairPriceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter States (Screenshot 4)
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Fruits' | 'Vegetables'>('All');
  const [selectedGrade, setSelectedGrade] = useState<'All' | 'Grade 1' | 'Grade 2' | 'Reject'>('All');
  const [selectedEffectiveDate, setSelectedEffectiveDate] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('Today');

  // Filtered List
  const filteredPrices = SAMPLE_FAIR_PRICES.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.crop.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.grade.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesGrade = selectedGrade === 'All' || item.grade === selectedGrade;

    return matchesSearch && matchesCategory && matchesGrade;
  });

  const handleClearFilters = () => {
    setSelectedCategory('All');
    setSelectedGrade('All');
    setSelectedEffectiveDate('Today');
  };

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

      {/* ─── Header: Matching Screenshot 3 & 4 ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <BackArrowIcon size={22} color={THEME.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Fair Price</Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              if (!showFilters && selectedItem) {
                setSelectedItem(null);
              }
              setShowFilters(!showFilters);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Filter fair prices"
          >
            <FilterSlidersIcon size={20} color={THEME.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          View current TOHFA fair-price ceilings used for produce listing and purchase decisions
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {showFilters ? (
          /* ─── Filters Section (Screenshot 4) ─── */
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeaderRow}>
              <FilterSlidersIcon size={18} color={THEME.titleRustDark} />
              <Text style={styles.filtersHeaderTitle}>Filters</Text>
            </View>

            {/* 1. Category */}
            <Text style={styles.filterGroupLabel}>Category</Text>
            <View style={styles.chipRow}>
              {(['All', 'Fruits', 'Vegetables'] as const).map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Grade */}
            <Text style={styles.filterGroupLabel}>Grade</Text>
            <View style={styles.chipRow}>
              {(['All', 'Grade 1', 'Grade 2', 'Reject'] as const).map((grade) => {
                const isActive = selectedGrade === grade;
                return (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedGrade(grade)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {grade}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Effective Date */}
            <Text style={styles.filterGroupLabel}>Effective Date</Text>
            <View style={styles.chipRow}>
              {(['Today', 'This Week', 'This Month', 'Custom'] as const).map((date) => {
                const isActive = selectedEffectiveDate === date;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedEffectiveDate(date)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive && styles.filterChipTextActive,
                      ]}
                    >
                      {date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Buttons: Apply & Clear */}
            <View style={styles.filterActionRow}>
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
                  handleClearFilters();
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
          /* ─── Fair Price Detail View (Image 1 Request) ─── */
          <>
            <View style={styles.detailCard}>
              {/* Row 1: Product & Grade */}
              <View style={styles.detailGridRow}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Product</Text>
                  <Text style={styles.detailValue}>{selectedItem.crop}</Text>
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
                  <Text style={styles.detailValue}>{selectedItem.purchasePrice || '₹80.00/kg'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Markup</Text>
                  <Text style={styles.detailValue}>{selectedItem.markup || '10%'}</Text>
                </View>
              </View>

              {/* Row 3: Expenses */}
              <View style={{ marginTop: adminSpacing.lg }}>
                <Text style={styles.detailLabel}>Expenses</Text>
                <Text style={[styles.detailExpensesValue, { marginTop: 4 }]}>
                  {selectedItem.expensesDetail || 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00'}
                </Text>
              </View>

              {/* Row 4: Retail Price & Customer Discount */}
              <View style={[styles.detailGridRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Retail Price</Text>
                  <Text style={styles.detailValue}>{selectedItem.retailPrice || '₹98.00/kg'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Customer Discount</Text>
                  <Text style={styles.detailValue}>{selectedItem.customerDiscount || '₹5.00'}</Text>
                </View>
              </View>
            </View>

            {/* Button 1: View Markup & Pricing Breakdown */}
            <TouchableOpacity
              style={styles.viewBreakdownBtn}
              onPress={() => onNavigateToBreakdown?.(selectedItem)}
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
          /* ─── Search Bar & Price Cards List (Screenshot 3) ─── */
          <>
            <View style={styles.searchBar}>
              <SearchIcon size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Crop, product, crop code, category"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.listContainer}>
              {filteredPrices.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.priceCard}
                  onPress={() => {
                    setSelectedItem(item);
                    onSelectPriceItem?.(item);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.cropTitle}>{item.crop}</Text>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>{item.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.cropSubline}>
                    {item.category} · {item.grade}
                  </Text>

                  {/* 3 Detail Columns */}
                  <View style={styles.detailColsRow}>
                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Fair Price Ceiling</Text>
                      <Text style={styles.colValue}>{item.fairPriceCeiling}</Text>
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Frequency</Text>
                      <Text style={styles.colValue}>{item.frequency}</Text>
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Effective From</Text>
                      <Text style={styles.colValue}>{item.effectiveFrom}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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

  // Header
  header: {
    backgroundColor: THEME.headerBg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backBtn: {
    paddingRight: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
    marginLeft: 6,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontWeight: '500',
  },

  // Scroll Container
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },

  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md, // 12px
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: adminSpacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: THEME.ink,
    padding: 0,
  },

  // List of Price Cards
  listContainer: {
    gap: adminSpacing.md,
  },
  priceCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl, // 16px
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.ink,
  },
  activePill: {
    backgroundColor: THEME.activeBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.activeBadgeText,
  },
  cropSubline: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  detailColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontSize: 11,
    color: THEME.labelMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  colValue: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.ink,
  },

  // Filters Section (Screenshot 4)
  filtersContainer: {
    paddingTop: 4,
    marginBottom: 20,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  filtersHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.titleRustDark,
  },
  filterGroupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.ink,
    marginTop: 8,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: THEME.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: THEME.orangeBtn,
    borderColor: THEME.orangeBtn,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.ink,
  },
  filterChipTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.orangeBtn,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.ink,
  },

  // ─── Detail View Styles (Image 1 Request) ──────────────────────────────────
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
});
