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

function PriceCheckIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M260-361v-40H160v-80h200v-80H200q-17 0-28.5-11.5T160-601v-160q0-17 11.5-28.5T200-801h60v-40h80v40h100v80H240v80h160q17 0 28.5 11.5T440-601v160q0 17-11.5 28.5T400-401h-60v40h-80Zm298 240L388-291l56-56 114 114 226-226 56 56-282 282Z"
        fill={color}
      />
    </Svg>
  );
}

function CategoryShapesIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z"
        fill={color}
      />
    </Svg>
  );
}

function HistoryClockIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z"
        fill={color}
      />
    </Svg>
  );
}

function PriceTagIcon({ size = 24, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M856-390 570-104q-12 12-27 18t-30 6q-15 0-30-6t-27-18L103-457q-11-11-17-25.5T80-513v-287q0-33 23.5-56.5T160-880h287q16 0 31 6.5t26 17.5l352 353q12 12 17.5 27t5.5 30q0 15-5.5 29.5T856-390ZM513-160l286-286-353-354H160v286l353 354ZM260-640q25 0 42.5-17.5T320-700q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm220 160Z"
        fill={color}
      />
    </Svg>
  );
}

function BlockCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface MarketPricingHomeScreenProps {
  onBack: () => void;
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
  onNavigateToMarketDay,
  onNavigateToListingApproval,
}: MarketPricingHomeScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel={t('marketPricingHome.backLabel')}
            >
              <BackArrowIcon size={22} color={adminColors.onBrand} />
            </TouchableOpacity>

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

        <Text style={styles.headerSubtitle}>{t('marketPricingHome.subtitle')}</Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Current Market Snapshot */}
        <Text style={styles.sectionHeading}>{t('marketPricingHome.section.snapshot')}</Text>

        <View style={styles.snapshotCard}>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('marketPricingHome.label.activeListings')}</Text>
            <Text style={styles.snapshotValue}>124</Text>
          </View>
          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('marketPricingHome.label.pendingReview')}</Text>
            <Text style={styles.snapshotValue}>18</Text>
          </View>
          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('marketPricingHome.label.fairPriceCeilings')}</Text>
            <Text style={styles.snapshotValue}>32 active</Text>
          </View>
          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('marketPricingHome.label.retailPricesActive')}</Text>
            <Text style={styles.snapshotValue}>28 active</Text>
          </View>
        </View>

        {/* Section 2: Recently Updated Prices */}
        <Text style={styles.sectionHeading}>{t('marketPricingHome.section.recentPrices')}</Text>

        <View style={styles.recentPriceCard}>
          <View style={styles.recentCardHeader}>
            <Text style={styles.recentCropTitle}>Carrot · Grade 1</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>

          <View style={styles.priceColsRow}>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Fair Price Ceiling</Text>
              <Text style={styles.priceColValue}>₹100.00/kg</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Effective Date</Text>
              <Text style={styles.priceColValue}>30 Sep 2026</Text>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.priceColLabel}>Frequency</Text>
              <Text style={styles.priceColValue}>Weekly</Text>
            </View>
          </View>
        </View>

        {/* View History Button */}
        <TouchableOpacity
          style={styles.viewHistoryBtn}
          onPress={onNavigateToPriceHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.viewHistoryBtnText}>{t('marketPricingHome.action.viewHistory')}</Text>
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
              <Text style={styles.quickCardLabel}>{t('marketPricingHome.action.fairPrices')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToCategories}
              activeOpacity={0.8}
            >
              <CategoryShapesIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>{t('marketPricingHome.action.categories')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToPriceHistory}
              activeOpacity={0.8}
            >
              <HistoryClockIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>{t('marketPricingHome.action.priceHistory')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToRetailPricing}
              activeOpacity={0.8}
            >
              <PriceTagIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>{t('marketPricingHome.action.retailPricing')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 4: Read-Only Disclaimer Banner */}
        <View style={styles.disclaimerCard}>
          <BlockCircleIcon size={18} color={adminColors.muted} />
          <Text style={styles.disclaimerText}>
            {t('marketPricingHome.disclaimer')}
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: adminSpacing.xs,
    paddingLeft: 34,
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
    ...adminType.rowTitle,
    color: adminColors.ink,
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
    paddingVertical: adminSpacing.md,
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
    color: adminColors.ink,
  },
  activePill: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.xs,
    paddingHorizontal: adminSpacing.sm,
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
    color: adminColors.brand,
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
    ...adminType.rowTitle,
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
