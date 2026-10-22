import React, { useState } from 'react';
import {
  Modal,
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
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.3"
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

function HorizontalFilterIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top slider bar with vertical pip */}
      <Line x1="3.5" y1="8" x2="20.5" y2="8" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="16" y1="4.5" x2="16" y2="11.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Bottom slider bar with vertical pip */}
      <Line x1="3.5" y1="16" x2="20.5" y2="16" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="8" y1="12.5" x2="8" y2="19.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Types & Mock Data Matching Images 2 & 3 ────────────────────────────────

export interface PricingRecordItem {
  id: string;
  product: string;
  grade: string;
  category: string;
  badge: 'Compliant' | 'Action required' | 'No retail price' | 'Over ceiling';
  ceiling: string;
  retailPrice: string;
  difference: string;
  updatedAt: string;
  farmerPurchasePrice?: string;
  pricingUnit?: string;
}

export const INITIAL_PRICING_RECORDS: PricingRecordItem[] = [
  {
    id: 'pr-1',
    product: 'Tomato',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹60.00/kg',
    retailPrice: '₹55.00/kg',
    difference: 'Difference ₹5.00 below',
    updatedAt: '11 Oct 2026, 10:00',
    farmerPurchasePrice: '₹42.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-2',
    product: 'Tomato',
    grade: 'Grade 2',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹50.00/kg',
    retailPrice: '₹50.00/kg',
    difference: 'Difference ₹0.00 below',
    updatedAt: '9 Oct 2026, 10:00',
    farmerPurchasePrice: '₹38.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-3',
    product: 'Tomato',
    grade: 'Grade 3',
    category: 'Vegetables',
    badge: 'Action required',
    ceiling: '₹40.00/kg',
    retailPrice: '₹45.00/kg',
    difference: 'Difference over by ₹5.00',
    updatedAt: '7 Oct 2026, 10:00',
    farmerPurchasePrice: '₹30.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-4',
    product: 'Beans',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹80.00/kg',
    retailPrice: '₹75.00/kg',
    difference: 'Difference ₹5.00 below',
    updatedAt: '5 Oct 2026, 10:00',
    farmerPurchasePrice: '₹60.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-5',
    product: 'Beans',
    grade: 'Grade 2',
    category: 'Vegetables',
    badge: 'No retail price',
    ceiling: '₹70.00/kg',
    retailPrice: 'none',
    difference: 'Difference not comparable',
    updatedAt: '1 Apr 2026, 09:00',
    farmerPurchasePrice: '₹50.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-6',
    product: 'Cabbage',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹30.00/kg',
    retailPrice: '₹28.00/kg',
    difference: 'Difference ₹2.00 below',
    updatedAt: '1 Oct 2026, 10:00',
    farmerPurchasePrice: '₹20.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-7',
    product: 'Cabbage',
    grade: 'Grade 2',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹25.00/kg',
    retailPrice: '₹24.00/kg',
    difference: 'Difference ₹1.00 below',
    updatedAt: '29 Sep 2026, 10:00',
    farmerPurchasePrice: '₹18.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-8',
    product: 'Carrot',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Over ceiling',
    ceiling: '₹70.00/kg',
    retailPrice: '₹74.00/kg',
    difference: 'Difference over by ₹4.00',
    updatedAt: '9 Oct 2026, 10:00',
    farmerPurchasePrice: '₹55.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-9',
    product: 'Garlic',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'No retail price',
    ceiling: '₹120.00/kg',
    retailPrice: 'none',
    difference: 'Difference not comparable',
    updatedAt: '15 Sep 2026, 10:00',
    farmerPurchasePrice: '₹90.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-10',
    product: 'Onion',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹35.00/kg',
    retailPrice: '₹32.00/kg',
    difference: 'Difference ₹3.00 below',
    updatedAt: '25 Sep 2026, 10:00',
    farmerPurchasePrice: '₹24.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-11',
    product: 'Potato',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹40.00/kg',
    retailPrice: '₹38.00/kg',
    difference: 'Difference ₹2.00 below',
    updatedAt: '20 Sep 2026, 10:00',
    farmerPurchasePrice: '₹28.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-12',
    product: 'Capsicum',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹65.00/kg',
    retailPrice: '₹60.00/kg',
    difference: 'Difference ₹5.00 below',
    updatedAt: '18 Sep 2026, 10:00',
    farmerPurchasePrice: '₹45.00/kg',
    pricingUnit: '₹/kg',
  },
  {
    id: 'pr-13',
    product: 'Ginger',
    grade: 'Grade 1',
    category: 'Vegetables',
    badge: 'Compliant',
    ceiling: '₹90.00/kg',
    retailPrice: '₹85.00/kg',
    difference: 'Difference ₹5.00 below',
    updatedAt: '12 Sep 2026, 10:00',
    farmerPurchasePrice: '₹68.00/kg',
    pricingUnit: '₹/kg',
  },
];

// ─── Component Props ──────────────────────────────────────────────────────────

export interface MarketPricingOverviewScreenProps {
  onBack: () => void;
  onEditRetailPrice: (item: PricingRecordItem) => void;
  onViewBreakdown: (item: PricingRecordItem) => void;
  records?: PricingRecordItem[];
}

export function MarketPricingOverviewScreen({
  onBack,
  onEditRetailPrice,
  onViewBreakdown,
  records = INITIAL_PRICING_RECORDS,
}: MarketPricingOverviewScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<PricingRecordItem | null>(null);

  const filteredRecords = records.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.product.toLowerCase().includes(q) ||
      item.grade.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const getBadgeStyle = (badge: PricingRecordItem['badge']) => {
    switch (badge) {
      case 'Compliant':
        return {
          pill: styles.badgeCompliant,
          text: styles.badgeTextCompliant,
        };
      case 'Action required':
      case 'Over ceiling':
        return {
          pill: styles.badgeActionRequired,
          text: styles.badgeTextActionRequired,
        };
      case 'No retail price':
      default:
        return {
          pill: styles.badgeNoRetail,
          text: styles.badgeTextNoRetail,
        };
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner Matching Image 2 & 3 ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <BackArrowIcon />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Market & Pricing Overview
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search Bar with Filter Icon Matching Image 2 & 3 ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search common or scientific name"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {}}
            activeOpacity={0.7}
            accessibilityLabel="Filter"
          >
            <HorizontalFilterIcon />
          </TouchableOpacity>
        </View>

        {/* ── Subtitle Count ── */}
        <Text style={styles.countSubtitle}>
          {filteredRecords.length} of {records.length} pricing records
        </Text>

        {/* ── Pricing Records List ── */}
        <View style={styles.recordsList}>
          {filteredRecords.map((item) => {
            const badgeStyle = getBadgeStyle(item.badge);
            return (
              <View key={item.id} style={styles.pricingCard}>
                {/* Header Row */}
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTitle}>
                    {item.product} · {item.grade}
                  </Text>
                  <View style={[styles.badgePill, badgeStyle.pill]}>
                    <Text style={[styles.badgeText, badgeStyle.text]}>
                      {item.badge}
                    </Text>
                  </View>
                </View>

                {/* Category */}
                <Text style={styles.cardCategoryText}>{item.category}</Text>

                {/* Ceiling & Retail */}
                <Text style={styles.cardDetailsText}>
                  Ceiling {item.ceiling} · Retail {item.retailPrice}
                </Text>

                {/* Difference */}
                <Text style={styles.cardDetailsText}>{item.difference}</Text>

                {/* Updated At */}
                <Text style={styles.cardUpdatedText}>
                  Updated {item.updatedAt}
                </Text>

                {/* 3 Action Buttons Row Matching Image 2 & 3 */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    onPress={() => setSelectedRecordForDetails(item)}
                    activeOpacity={0.7}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onEditRetailPrice(item)}
                    activeOpacity={0.7}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>Edit Retail Price</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => onViewBreakdown(item)}
                    activeOpacity={0.7}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>View Breakdown</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════════
          PRICING DETAILS BOTTOM SHEET MODAL Matching Image 3 Right
         ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={selectedRecordForDetails !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRecordForDetails(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedRecordForDetails(null)}
          />

          <View style={styles.modalSheet}>
            {/* Modal Title */}
            <Text style={styles.modalTitle}>Pricing details</Text>

            {/* Details Table Card */}
            {selectedRecordForDetails && (
              <View style={styles.detailsCard}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Product</Text>
                  <Text style={styles.detailsValue}>{selectedRecordForDetails.product}</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Category</Text>
                  <Text style={styles.detailsValue}>{selectedRecordForDetails.category}</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Grade</Text>
                  <Text style={styles.detailsValue}>{selectedRecordForDetails.grade}</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Fair price ceiling</Text>
                  <Text style={styles.detailsValue}>{selectedRecordForDetails.ceiling}</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Retail price</Text>
                  <Text style={styles.detailsValue}>{selectedRecordForDetails.retailPrice}</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Status</Text>
                  <Text style={styles.detailsValue}>{selectedRecordForDetails.badge}</Text>
                </View>
                <View style={styles.tableDivider} />

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Last updated</Text>
                  <Text style={styles.detailsValue}>{selectedRecordForDetails.updatedAt}</Text>
                </View>
              </View>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setSelectedRecordForDetails(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: 6,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 8,
    ...adminShadow.sm,
  },
  searchInput: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.ink,
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
  },
  filterBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: adminSpacing.md,
    marginLeft: 2,
  },

  // Records List
  recordsList: {
    rowGap: 12,
  },
  pricingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
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
  cardTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  cardCategoryText: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginBottom: 4,
  },
  cardDetailsText: {
    ...adminType.body,
    fontSize: 12,
    color: adminColors.ink,
    lineHeight: 17,
  },
  cardUpdatedText: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    marginTop: 4,
    marginBottom: 10,
  },

  // Badges
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeCompliant: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.text,
  },
  badgeTextCompliant: {
    color: adminColors.success.text,
  },
  badgeActionRequired: {
    backgroundColor: adminColors.danger.bg,
    borderColor: adminColors.danger.text,
  },
  badgeTextActionRequired: {
    color: adminColors.danger.text,
  },
  badgeNoRetail: {
    backgroundColor: adminColors.warning.bg,
    borderColor: adminColors.warning.text,
  },
  badgeTextNoRetail: {
    color: adminColors.warning.text,
  },

  // 3 Action Buttons Row
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  actionBtnText: {
    ...adminType.caption,
    fontSize: 12,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: adminOverlay.scrim,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '85%',
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.md,
  },
  detailsCard: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    backgroundColor: adminColors.card,
    marginBottom: adminSpacing.lg,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailsLabel: {
    ...adminType.caption,
    fontSize: 12,
    color: adminColors.muted,
  },
  detailsValue: {
    ...adminType.body,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  tableDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    opacity: 0.5,
  },
  modalCloseBtn: {
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
