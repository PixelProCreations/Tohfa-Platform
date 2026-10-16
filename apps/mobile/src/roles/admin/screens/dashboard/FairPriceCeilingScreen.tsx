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

import { adminColors, adminOverlay, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
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

export interface FairPriceItem {
  id: string;
  crop: string;
  category: 'Vegetables' | 'Fruits';
  grade: 'Grade 1' | 'Grade 2' | 'Reject';
  fairPriceCeiling: string;
  frequency: string;
  effectiveFrom: string;
  status: 'Active';
  purchasePrice?: string | undefined;
  markup?: string | undefined;
  expensesDetail?: string | undefined;
  retailPrice?: string | undefined;
  customerDiscount?: string | undefined;
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
  onSelectPriceItem?: ((item: FairPriceItem) => void) | undefined;
  onNavigateToBreakdown?: ((item: FairPriceItem) => void) | undefined;
  onUpdatePrice?: ((item: any) => void) | undefined;
  onBulkUpdate?: (() => void) | undefined;
  onViewHistory?: ((item: any) => void) | undefined;
}

export function FairPriceCeilingScreen({
  onBack,
  onSelectPriceItem,
  onNavigateToBreakdown,
}: FairPriceCeilingScreenProps) {
  const [selectedItem, setSelectedItem] = useState<FairPriceItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Fruits' | 'Vegetables'>('All');
  const [selectedGrade, setSelectedGrade] = useState<'All' | 'Grade 1' | 'Grade 2' | 'Reject'>('All');
  const [selectedEffectiveDate, setSelectedEffectiveDate] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('Today');

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
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleHeaderBack}
            activeOpacity={0.7}
            accessibilityLabel={t('fairPriceCeiling.backLabel')}
          >
            <BackArrowIcon size={22} color={adminColors.onBrand} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {selectedItem ? selectedItem.crop : 'Fair Price'}
          </Text>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              if (selectedItem) setSelectedItem(null);
              setShowFilters(!showFilters);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={20} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          {showFilters
            ? t('fairPriceCeiling.filters.title')
            : selectedItem
            ? `${selectedItem.crop} · ${selectedItem.grade}`
            : 'View current TOHFA fair-price ceilings used for produce listing and purchase decisions'}
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {showFilters ? (
          /* Filter View */
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeaderRow}>
              <FilterSlidersIcon size={18} color={adminColors.brandDeep} />
              <Text style={styles.filtersHeaderTitle}>{t('fairPriceCeiling.filters.title')}</Text>
            </View>

            <Text style={styles.filterGroupLabel}>{t('fairPriceCeiling.filters.category')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Vegetables', 'Fruits'] as const).map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.filterGroupLabel}>{t('fairPriceCeiling.filters.grade')}</Text>
            <View style={styles.chipRow}>
              {(['All', 'Grade 1', 'Grade 2', 'Reject'] as const).map((grade) => {
                const isSelected = selectedGrade === grade;
                return (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedGrade(grade)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {grade}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.filterGroupLabel}>{t('fairPriceCeiling.filters.effectiveDate')}</Text>
            <View style={styles.chipRow}>
              {(['Today', 'This Week', 'This Month', 'Custom'] as const).map((date) => {
                const isSelected = selectedEffectiveDate === date;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setSelectedEffectiveDate(date)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.filterActionRow}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={handleClearFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.clearBtnText}>{t('fairPriceCeiling.filters.clearAll')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowFilters(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>{t('fairPriceCeiling.filters.apply')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : selectedItem ? (
          /* Fair Price Detail View */
          <>
            <View style={styles.detailCard}>
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

              <View style={[styles.detailGridRow, styles.gridRowSpacing]}>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Purchase Price</Text>
                  <Text style={styles.detailValue}>{selectedItem.purchasePrice || '₹80.00/kg'}</Text>
                </View>
                <View style={styles.detailCol}>
                  <Text style={styles.detailLabel}>Markup</Text>
                  <Text style={styles.detailValue}>{selectedItem.markup || '10%'}</Text>
                </View>
              </View>

              <View style={styles.gridRowSpacing}>
                <Text style={styles.detailLabel}>Expenses</Text>
                <Text style={[styles.detailExpensesValue, styles.detailExpensesSpacing]}>
                  {selectedItem.expensesDetail || 'Freight ₹5.00 · Loading ₹2.00 · Unloading ₹3.00'}
                </Text>
              </View>

              <View style={[styles.detailGridRow, styles.gridRowSpacing]}>
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

            <TouchableOpacity
              style={styles.viewBreakdownBtn}
              onPress={() => onNavigateToBreakdown?.(selectedItem)}
              activeOpacity={0.8}
            >
              <Text style={styles.viewBreakdownBtnText}>
                View Markup & Pricing Breakdown
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToRetailBtn}
              onPress={() => setSelectedItem(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.backToRetailBtnText}>Back to Retail Pricing</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Search Bar & Price Cards List */
          <>
            <View style={styles.searchBar}>
              <SearchIcon size={18} color={adminColors.muted} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('fairPriceCeiling.searchPlaceholder')}
                placeholderTextColor={adminColors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.listContainer}>
              {filteredPrices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t('fairPriceCeiling.empty')}</Text>
                </View>
              ) : (
                filteredPrices.map((item) => (
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

                    <View style={styles.detailColsRow}>
                      <View style={styles.col}>
                        <Text style={styles.colLabel}>{t('fairPriceCeiling.label.ceiling')}</Text>
                        <Text style={styles.colValue}>{item.fairPriceCeiling}</Text>
                      </View>

                      <View style={styles.col}>
                        <Text style={styles.colLabel}>{t('fairPriceCeiling.label.frequency')}</Text>
                        <Text style={styles.colValue}>{item.frequency}</Text>
                      </View>

                      <View style={styles.col}>
                        <Text style={styles.colLabel}>{t('fairPriceCeiling.label.effectiveFrom')}</Text>
                        <Text style={styles.colValue}>{item.effectiveFrom}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
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
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    ...adminType.title,
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.onBrand,
    marginLeft: 4,
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
    ...adminType.caption,
    color: adminColors.onBrand,
    lineHeight: 18,
    opacity: 0.95,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: adminSpacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    padding: 0,
  },
  listContainer: {
    gap: adminSpacing.md,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  priceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cropTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  activePill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activePillText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  cropSubline: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
  },
  detailColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
  },
  colLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  colValue: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
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
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  filterGroupLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.ink,
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
    backgroundColor: adminColors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  filterChipText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
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
    marginTop: adminSpacing.lg,
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
    marginTop: 4,
  },
  detailExpensesValue: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  detailExpensesSpacing: {
    marginTop: 4,
  },
  viewBreakdownBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    height: 44,
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
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: adminSpacing.sm,
  },
  backToRetailBtnText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
  },
  bottomSpacer: {
    height: 40,
  },
});
