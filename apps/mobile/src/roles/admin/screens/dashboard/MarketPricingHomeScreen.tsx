import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { t } from '../../i18n';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function StorefrontIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M841-518v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Zm-272-42q27 0 41-18.5t11-41.5l-22-140h-78v148q0 21 14 36.5t34 15.5Zm-180 0q23 0 37.5-15.5T441-612v-148h-78l-22 140q-4 24 10.5 42t37.5 18Zm-178 0q18 0 31.5-13t16.5-33l22-154h-78l-40 134q-6 20 6.5 43t41.5 23Zm540 0q29 0 42-23t6-43l-42-134h-76l22 154q3 20 16.5 33t31.5 13ZM201-200h560v-282q-5 2-6.5 2H751q-27 0-47.5-9T663-518q-18 18-41 28t-49 10q-27 0-50.5-10T481-518q-17 18-39.5 28T393-480q-29 0-52.5-10T299-518q-21 21-41.5 29.5T211-480h-4.5q-2.5 0-5.5-2v282Zm560 0H201h560Z"
        fill={color}
      />
    </Svg>
  );
}

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

function BellIcon({ size = 19, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PriceCheckIcon({ size = 28, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M260-361v-40H160v-80h200v-80H200q-17 0-28.5-11.5T160-601v-160q0-17 11.5-28.5T200-801h60v-40h80v40h100v80H240v80h160q17 0 28.5 11.5T440-601v160q0 17-11.5 28.5T400-401h-60v40h-80Zm298 240L388-291l56-56 114 114 226-226 56 56-282 282Z"
        fill={color}
      />
    </Svg>
  );
}

function CategoryShapesIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l4.5 7.5h-9L12 3zM6 15a3 3 0 100 6 3 3 0 000-6zM15 15h5v5h-5v-5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PriceHistoryIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8v4l3 3M3.05 11a9 9 0 11.5 4m-.5 5v-5h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RetailPricingIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BlockCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface MarketPricingHomeScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateToFairPrice: () => void;
  onNavigateToCategories?: (() => void) | undefined;
  onNavigateToPriceHistory?: (() => void) | undefined;
  onNavigateToRetailPricing?: (() => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
  onNavigateToMarketDay?: (() => void) | undefined;
  onNavigateToListingApproval?: (() => void) | undefined;
}

export function MarketPricingHomeScreen({
  onBack,
  onNavigateToFairPrice,
  onNavigateToCategories,
  onNavigateToPriceHistory,
  onNavigateToRetailPricing,
  onOpenNotifications,
}: MarketPricingHomeScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityLabel="Go back"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : null}

            <StorefrontIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>{t('marketPricingHome.title')}</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel={t('marketPricingHome.notifications')}
          >
            <BellIcon size={19} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, onBack ? { paddingLeft: 34 } : null]}>
          {t('marketPricingHome.subtitle')}
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Cards (2x2 Grid) */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ACTIVE FAIR PRICES</Text>
              <Text style={styles.kpiValue}>124</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PRODUCT CATEGORIES</Text>
              <Text style={styles.kpiValue}>12</Text>
            </View>
          </View>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PRICE UPDATES</Text>
              <Text style={styles.kpiValue}>18</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>RETAIL PRICE RECORDS</Text>
              <Text style={styles.kpiValue}>124</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Current Market Snapshot */}
        <Text style={styles.sectionHeading}>{t('marketPricingHome.section.snapshot')}</Text>

        <View style={styles.snapshotCard}>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Crop</Text>
            <Text style={styles.snapshotValue}>Carrot</Text>
          </View>
          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Grade</Text>
            <Text style={styles.snapshotValue}>Grade 1</Text>
          </View>
          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Fair Price Ceiling</Text>
            <Text style={styles.snapshotValue}>₹100/kg</Text>
          </View>
          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Retail Price</Text>
            <Text style={styles.snapshotValue}>₹120/kg</Text>
          </View>
          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Effective Date</Text>
            <Text style={styles.snapshotValue}>30 Sep 2026</Text>
          </View>
          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Price Status</Text>
            <Text style={[styles.snapshotValue, styles.statusActiveText]}>Active</Text>
          </View>
        </View>

        {/* Section 2: Recently Updated Prices */}
        <Text style={styles.sectionHeading}>{t('marketPricingHome.section.recentPrices')}</Text>

        {/* Card 1: Carrot · Grade 1 */}
        <View style={styles.recentPriceCard}>
          <View style={styles.recentCardHeader}>
            <Text style={styles.recentCropTitle}>Carrot · Grade 1</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>

          <View style={styles.priceColsRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Fair Price</Text>
              <Text style={styles.priceColValue}>₹100/kg</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Retail Price</Text>
              <Text style={styles.priceColValue}>₹120/kg</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Effective</Text>
              <Text style={styles.priceColValue}>30 Sep</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Cabbage · Grade 2 */}
        <View style={[styles.recentPriceCard, { marginTop: adminSpacing.sm }]}>
          <View style={styles.recentCardHeader}>
            <Text style={styles.recentCropTitle}>Cabbage · Grade 2</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>

          <View style={styles.priceColsRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Fair Price</Text>
              <Text style={styles.priceColValue}>₹60/kg</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Retail Price</Text>
              <Text style={styles.priceColValue}>₹75/kg</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Effective</Text>
              <Text style={styles.priceColValue}>29 Sep</Text>
            </View>
          </View>
        </View>

        {/* View History Button */}
        <TouchableOpacity
          style={styles.viewHistoryBtn}
          onPress={onNavigateToPriceHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.viewHistoryBtnText}>View History</Text>
        </TouchableOpacity>

        {/* Section 3: Quick Actions 2x2 Grid */}
        <Text style={styles.sectionHeading}>{t('marketPricingHome.section.quickActions')}</Text>

        <View style={styles.quickGrid}>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToFairPrice}
              activeOpacity={0.8}
            >
              <PriceCheckIcon size={28} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Fair Prices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToCategories}
              activeOpacity={0.8}
            >
              <CategoryShapesIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Categories & Grades</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToPriceHistory}
              activeOpacity={0.8}
            >
              <PriceHistoryIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Price History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToRetailPricing}
              activeOpacity={0.8}
            >
              <RetailPricingIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Retail Pricing</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 4: Read-Only Disclaimer Banner */}
        <View style={styles.disclaimerCard}>
          <BlockCircleIcon size={18} color={adminColors.muted} />
          <Text style={styles.disclaimerText}>
            Fair-price ceiling setting is Super Admin only. Retail-price setting is not available to Farmer Admin. Nothing in this module can be edited.
          </Text>
        </View>

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
    gap: adminSpacing.sm,
  },
  backBtn: {
    paddingRight: adminSpacing.xs,
    paddingVertical: adminSpacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '800',
  },
  notificationBtn: {
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
    marginTop: 4,
    opacity: 0.95,
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },

  // KPI Grid
  kpiGrid: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: adminSpacing.md,
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: adminColors.ink,
  },

  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 16,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  snapshotCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 4,
    paddingHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  snapshotLabel: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  snapshotValue: {
    ...adminType.body,
    fontWeight: '800',
    color: adminColors.ink,
  },
  statusActiveText: {
    color: adminColors.success.text,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  recentPriceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  recentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.md,
  },
  recentCropTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
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
  priceColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceCol: {
    flex: 1,
  },
  priceColLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  priceColValue: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
  },
  viewHistoryBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: adminSpacing.lg,
  },
  viewHistoryBtnText: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  quickGrid: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  quickRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  quickCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 20,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  quickCardLabel: {
    ...adminType.caption,
    fontWeight: '800',
    color: adminColors.ink,
    textAlign: 'center',
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    ...adminType.caption,
    color: adminColors.muted,
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});

