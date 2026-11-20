import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { toPaise } from '@tohfa/shared-types';
import type { Can } from '../../permissions/can';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { useRetailPriceList } from '../../api/pricingHooks';
import type { RetailPriceRowView } from '../../api/pricingTypes';
import { t } from '../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { queryViewState } from '../warehouse/shared/queryViewState';

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
      <Line x1="3.5" y1="8" x2="20.5" y2="8" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="16" y1="4.5" x2="16" y2="11.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="3.5" y1="16" x2="20.5" y2="16" stroke={color} strokeWidth="2.1" strokeLinecap="round" />
      <Line x1="8" y1="12.5" x2="8" y2="19.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type PricingRecordBadge = 'Compliant' | 'Action required' | 'No retail price' | 'Over ceiling';

export interface PricingRecordItem {
  id: string;
  cropId?: string | undefined;
  product: string;
  grade: string;
  category: string;
  badge: PricingRecordBadge;
  ceiling: string;
  retailPrice: string;
  difference: string;
  updatedAt: string;
  farmerPurchasePrice?: string | undefined;
  pricingUnit?: string | undefined;
}

function mapDtoToRecordItem(row: RetailPriceRowView): PricingRecordItem {
  let badge: PricingRecordBadge = 'Compliant';
  if (row.retailPrice === null) {
    badge = 'No retail price';
  } else if (row.ceilingComparison?.position === 'above') {
    badge = 'Over ceiling';
  } else if (row.ceilingComparison?.position === 'below' || row.ceilingComparison?.position === 'at') {
    badge = 'Compliant';
  } else {
    badge = 'Action required';
  }

  const ceilingPaise = row.ceilingPrice ? toPaise(row.ceilingPrice) : null;
  const retailPaise = row.retailPrice ? toPaise(row.retailPrice) : null;

  const ceilingStr = ceilingPaise !== null
    ? `₹${(ceilingPaise / 100).toFixed(2)}/kg`
    : '—';
  const retailStr = retailPaise !== null
    ? `₹${(retailPaise / 100).toFixed(2)}/kg`
    : 'none';

  let diffStr = 'Difference not comparable';
  if (ceilingPaise !== null && retailPaise !== null) {
    const diffPaise = ceilingPaise - retailPaise;
    if (diffPaise >= 0) {
      diffStr = `Difference ₹${(diffPaise / 100).toFixed(2)} below`;
    } else {
      diffStr = `Difference over by ₹${(Math.abs(diffPaise) / 100).toFixed(2)}`;
    }
  }

  const updatedStr = row.effectiveFrom
    ? row.effectiveFrom.replace('T', ' ').slice(0, 16)
    : '—';

  return {
    id: row.id,
    cropId: row.cropId,
    product: row.cropName ?? '—',
    grade: row.grade,
    category: row.category ?? '—',
    badge,
    ceiling: ceilingStr,
    retailPrice: retailStr,
    difference: diffStr,
    updatedAt: updatedStr,
    farmerPurchasePrice: '—',
    pricingUnit: '₹/kg',
  };
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface MarketPricingOverviewScreenProps {
  can?: Can | undefined;
  warehouseId?: string | undefined;
  onBack: () => void;
  onEditRetailPrice: (item: PricingRecordItem) => void;
  onViewBreakdown: (item: PricingRecordItem) => void;
  records?: PricingRecordItem[] | undefined;
}

export function MarketPricingOverviewScreen({
  can,
  warehouseId,
  onBack,
  onEditRetailPrice,
  onViewBreakdown,
  records,
}: MarketPricingOverviewScreenProps): React.JSX.Element {
  const canView = can ? can('pricing.retail_price.view') : true;
  const canEdit = can ? can('pricing.retail_price.set') : true;

  const retailQuery = useRetailPriceList(
    warehouseId,
    {},
    { enabled: canView && records === undefined },
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForDetails, setSelectedRecordForDetails] = useState<PricingRecordItem | null>(null);

  /*
   * There is no fixture fallback here any more. A genuinely empty result used
   * to render five invented records — Tomato G1/G2/G3, Beans… — with real
   * ceilings, retail prices and "Compliant" / "Action required" badges, so an
   * admin could read, and act on, prices that do not exist. An empty result
   * is an empty state.
   *
   * `records` stays: an explicit list from a caller (a host screen, a test) is
   * data someone supplied on purpose, not a stand-in for a failed request.
   */
  const effectiveRecords = useMemo(
    () => (records !== undefined ? records : retailQuery.items.map(mapDtoToRecordItem)),
    [records, retailQuery.items],
  );

  // Loading, failed and loaded-but-empty are three different things, and only
  // the last one is "no records". The flags are the query's own.
  const viewState = queryViewState(
    records !== undefined
      ? { isLoading: false, error: null, itemCount: records.length }
      : { isLoading: retailQuery.isLoading, error: retailQuery.error, itemCount: effectiveRecords.length },
  );

  const filteredRecords = effectiveRecords.filter((item) => {
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
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

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

        {/* ── Subtitle Count — only once there is a loaded result to count ── */}
        {viewState === 'ready' ? (
          <Text style={styles.countSubtitle}>
            {filteredRecords.length} of {effectiveRecords.length} pricing records
          </Text>
        ) : null}

        {viewState === 'loading' ? <AdminLoadingState /> : null}
        {viewState === 'error' ? <AdminErrorState error={retailQuery.error} onRetry={retailQuery.refresh} /> : null}
        {viewState === 'empty' ? (
          <AdminEmptyState
            title={t('pricingRetail.overview.empty.title')}
            subtitle={t('pricingRetail.overview.empty.subtitle')}
          />
        ) : null}

        {/* ── Pricing Records List ── */}
        <View style={styles.recordsList}>
          {(viewState === 'ready' ? filteredRecords : []).map((item) => {
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
                    onPress={canEdit ? () => onEditRetailPrice(item) : undefined}
                    disabled={!canEdit}
                    activeOpacity={canEdit ? 0.7 : 1}
                    style={[styles.actionBtn, !canEdit && styles.actionBtnDisabled]}
                  >
                    <Text style={[styles.actionBtnText, !canEdit && styles.actionBtnTextDisabled]}>
                      Edit Retail Price
                    </Text>
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

      {/* ── PRICING DETAILS BOTTOM SHEET MODAL ── */}
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
    color: adminColors.ink,
  },
  cardCategoryText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  cardDetailsText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  cardUpdatedText: {
    ...adminType.caption,
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
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },
  actionBtnText: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  actionBtnTextDisabled: {
    color: adminColors.muted,
  },

  // Details Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...(StyleSheet.absoluteFill as Record<string, unknown>),
    backgroundColor: adminOverlay.scrim,
  },
  modalSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    maxHeight: '85%',
    ...adminShadow.md,
  },
  modalTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.md,
  },
  detailsCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
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
    color: adminColors.muted,
  },
  detailsValue: {
    ...adminType.body,
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
    marginTop: 6,
  },
  modalCloseBtnText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
  },
});
