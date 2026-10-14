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
import Svg, { Circle, Line, Path, Polygon, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const THEME = {
  headerBg: adminColors.brand,
  white: adminColors.onBrand,

  // Canvas & Surfaces
  canvas: adminColors.canvas,
  card: adminColors.card,
  border: adminColors.border,
  divider: adminColors.border,

  // Typography
  titleRustDark: adminColors.brandDeep,
  ink: adminColors.ink,
  muted: adminColors.muted,
  labelMuted: adminColors.muted,

  // Badges & Actions
  activeBadgeBg: adminColors.success.bg,
  activeBadgeText: adminColors.success.text,
  orangeIcon: adminColors.brand,
  orangeBtn: adminColors.brand,
};

// ─── Exact Google Material Symbols ───────────────────────────────────────────

// 1. Storefront Icon (Header Left) — Exact Material Symbols storefront / store
function StorefrontIcon({ size = 22, color = THEME.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M841-518v318q0 33-23.5 56.5T761-120H201q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518Zm-272-42q27 0 41-18.5t11-41.5l-22-140h-78v148q0 21 14 36.5t34 15.5Zm-180 0q23 0 37.5-15.5T441-612v-148h-78l-22 140q-4 24 10.5 42t37.5 18Zm-178 0q18 0 31.5-13t16.5-33l22-154h-78l-40 134q-6 20 6.5 43t41.5 23Zm540 0q29 0 42-23t6-43l-42-134h-76l22 154q3 20 16.5 33t31.5 13ZM201-200h560v-282q-5 2-6.5 2H751q-27 0-47.5-9T663-518q-18 18-41 28t-49 10q-27 0-50.5-10T481-518q-17 18-39.5 28T393-480q-29 0-52.5-10T299-518q-21 21-41.5 29.5T211-480h-4.5q-2.5 0-5.5-2v282Zm560 0H201h560Z"
        fill={color}
      />
    </Svg>
  );
}

// 2. Bell Notification Icon (Header Right)
function BellIcon({ size = 19, color = THEME.white }: { size?: number; color?: string }) {
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

// 3. Back Arrow Icon
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

// 4. Price Check Icon (Fair Prices) — Exact Material Symbols price_check ($ Currency + Attached Checkmark)
function PriceCheckIcon({ size = 26, color = THEME.orangeIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M260-361v-40H160v-80h200v-80H200q-17 0-28.5-11.5T160-601v-160q0-17 11.5-28.5T200-801h60v-40h80v40h100v80H240v80h160q17 0 28.5 11.5T440-601v160q0 17-11.5 28.5T400-401h-60v40h-80Zm298 240L388-291l56-56 114 114 226-226 56 56-282 282Z"
        fill={color}
      />
    </Svg>
  );
}

// 5. Category Icon (Categories & Grades) — Exact Material Symbols category (Triangle, Circle, Square)
function CategoryShapesIcon({ size = 24, color = THEME.orangeIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z"
        fill={color}
      />
    </Svg>
  );
}

// 6. History Clock Icon (Price History) — Exact Material Symbols history
function HistoryClockIcon({ size = 24, color = THEME.orangeIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z"
        fill={color}
      />
    </Svg>
  );
}

// 7. Price Tag Icon (Retail Pricing) — Exact Material Symbols sell / label
function PriceTagIcon({ size = 24, color = THEME.orangeIcon }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path
        d="M856-390 570-104q-12 12-27 18t-30 6q-15 0-30-6t-27-18L103-457q-11-11-17-25.5T80-513v-287q0-33 23.5-56.5T160-880h287q16 0 31 6.5t26 17.5l352 353q12 12 17.5 27t5.5 30q0 15-5.5 29.5T856-390ZM513-160l286-286-353-354H160v286l353 354ZM260-640q25 0 42.5-17.5T320-700q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm220 160Z"
        fill={color}
      />
    </Svg>
  );
}

// 8. Read-only Warning Circle Slash Icon (Exact Material Symbols block)
function BlockCircleIcon({ size = 18, color = '#6B7280' }: { size?: number; color?: string }) {
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
  onNavigateToCategories?: () => void;
  onNavigateToPriceHistory?: () => void;
  onNavigateToRetailPricing?: () => void;
  onOpenNotifications?: () => void;
  onNavigateToMarketDay?: () => void;
  onNavigateToListingApproval?: () => void;
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.headerBg} />

      {/* ─── Header: Matching Screenshot 1 Exactly ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <BackArrowIcon size={22} color={THEME.white} />
            </TouchableOpacity>

            <StorefrontIcon size={22} color={THEME.white} />
            <Text style={styles.headerTitle}>Market & Pricing</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={19} color={THEME.white} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.headerSubtitle, { paddingLeft: 34 }]}>Market & Pricing Dashboard</Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 2x2 Metric KPI Grid (Screenshot 1) ─── */}
        <View style={styles.kpiGrid}>
          {/* Row 1 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>ACTIVE FAIR PRICES</Text>
              <Text style={styles.kpiValueDark}>124</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PRODUCT CATEGORIES</Text>
              <Text style={styles.kpiValueDark}>12</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>PRICE UPDATES</Text>
              <Text style={styles.kpiValueDark}>18</Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>RETAIL PRICE RECORDS</Text>
              <Text style={styles.kpiValueDark}>124</Text>
            </View>
          </View>
        </View>

        {/* ─── Section: Current Market Snapshot (Screenshot 1) ─── */}
        <Text style={styles.sectionHeading}>Current Market Snapshot</Text>
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
            <Text style={[styles.snapshotValue, { color: THEME.activeBadgeText }]}>Active</Text>
          </View>
        </View>

        {/* ─── Section: Recently Updated Prices (Screenshot 1 & 2) ─── */}
        <Text style={styles.sectionHeading}>Recently Updated Prices</Text>

        {/* Price Card 1: Carrot · Grade 1 */}
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

        {/* Price Card 2: Cabbage · Grade 2 */}
        <View style={[styles.recentPriceCard, { marginTop: 10 }]}>
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

        {/* Button: View History (Screenshot 2) */}
        <TouchableOpacity
          style={styles.viewHistoryBtn}
          onPress={onNavigateToPriceHistory ?? onNavigateToFairPrice}
          activeOpacity={0.85}
        >
          <Text style={styles.viewHistoryBtnText}>View History</Text>
        </TouchableOpacity>

        {/* ─── Section: Quick Actions (Screenshot 2) ─── */}
        <Text style={styles.sectionHeading}>Quick Actions</Text>

        <View style={styles.quickGrid}>
          {/* Row 1 */}
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToFairPrice}
              activeOpacity={0.8}
            >
              <PriceCheckIcon size={26} color={THEME.orangeIcon} />
              <Text style={styles.quickCardLabel}>Fair Prices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToCategories ?? onNavigateToFairPrice}
              activeOpacity={0.8}
            >
              <CategoryShapesIcon size={26} color={THEME.orangeIcon} />
              <Text style={styles.quickCardLabel}>Categories & Grades</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToPriceHistory ?? onNavigateToFairPrice}
              activeOpacity={0.8}
            >
              <HistoryClockIcon size={26} color={THEME.orangeIcon} />
              <Text style={styles.quickCardLabel}>Price History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToRetailPricing ?? onNavigateToFairPrice}
              activeOpacity={0.8}
            >
              <PriceTagIcon size={26} color={THEME.orangeIcon} />
              <Text style={styles.quickCardLabel}>Retail Pricing</Text>
            </TouchableOpacity>
          </View>
        </View>


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
    paddingRight: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.white,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    fontWeight: '500',
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
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

  // 2x2 Metric KPI Grid
  kpiGrid: {
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 14,
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiLabel: {
    ...adminType.caption,
    fontSize: 11,
    color: THEME.muted,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  kpiValueDark: {
    ...adminType.kpiValue,
    fontSize: 24,
    color: THEME.ink,
    letterSpacing: -0.5,
  },

  // Section Heading
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 15,
    color: THEME.titleRustDark,
    marginBottom: adminSpacing.md,
    marginTop: 4,
  },

  // Current Market Snapshot Table Card
  snapshotCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 4,
    paddingHorizontal: 16,
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
    color: THEME.ink,
  },
  snapshotValue: {
    ...adminType.body,
    fontWeight: '800',
    color: THEME.ink,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: THEME.divider,
  },

  // Recently Updated Prices
  recentPriceCard: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    ...adminShadow.sm,
  },
  recentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentCropTitle: {
    ...adminType.title,
    fontSize: 15,
    color: THEME.ink,
  },
  activePill: {
    backgroundColor: THEME.activeBadgeBg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activePillText: {
    ...adminType.caption,
    fontSize: 11,
    color: THEME.activeBadgeText,
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
    fontSize: 11,
    color: THEME.labelMuted,
    marginBottom: 4,
  },
  priceColValue: {
    ...adminType.rowTitle,
    fontSize: 14,
    color: THEME.ink,
  },

  // View History Button
  viewHistoryBtn: {
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: THEME.orangeBtn,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: adminSpacing.lg,
  },
  viewHistoryBtnText: {
    ...adminType.rowTitle,
    fontSize: 15,
    color: THEME.orangeBtn,
  },

  // Quick Actions 2x2 Grid
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
    backgroundColor: THEME.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 20,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  quickCardLabel: {
    ...adminType.rowTitle,
    fontSize: 13,
    color: THEME.ink,
    textAlign: 'center',
  },

  // Read-only Disclaimer Banner
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  disclaimerText: {
    flex: 1,
    ...adminType.rowMeta,
    fontSize: 12,
    color: THEME.muted,
    lineHeight: 16,
  },
});
