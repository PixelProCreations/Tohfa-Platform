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
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../theme';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';

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

function FairPricesActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CategoriesActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l4.5 7.5h-9L12 3z" stroke={color} strokeWidth="2.1" strokeLinejoin="round" />
      <Rect x="4" y="14" width="6.5" height="6.5" rx="1" stroke={color} strokeWidth="2.1" />
      <Rect x="13.5" y="14" width="6.5" height="6.5" rx="1" stroke={color} strokeWidth="2.1" />
    </Svg>
  );
}

function PriceHistoryActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 3v5h5" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 7v5l3 3" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RetailPricingActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="7" cy="7" r="1.5" fill={color} />
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

export interface FarmerMarketPricingHomeScreenProps {
  onNavigateToFairPrice: () => void;
  onNavigateToCategories: () => void;
  onNavigateToPriceHistory: () => void;
  onNavigateToRetailPricing: () => void;
  onOpenNotifications?: () => void;
}

export function FarmerMarketPricingHomeScreen({
  onNavigateToFairPrice,
  onNavigateToCategories,
  onNavigateToPriceHistory,
  onNavigateToRetailPricing,
  onOpenNotifications,
}: FarmerMarketPricingHomeScreenProps) {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header Matching Screenshot 1 & 2 ─── */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <StorefrontIcon size={24} color={adminColors.onBrand} />
            <Text style={styles.headerTitle}>Market & Pricing</Text>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
            accessibilityLabel="Notifications"
          >
            <BellIcon size={19} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>Market & Pricing Dashboard</Text>
      </View>

      {/* ─── Main Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: KPI Cards (2x2 Grid using Reusable Components) */}
        <OverviewCardsGrid style={styles.kpiGridContainer}>
          <OverviewDashboardCard
            title="ACTIVE FAIR PRICES"
            value="124"
            titlePosition="top"
            preserveCase={true}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
            style={styles.kpiCard}
          />
          <OverviewDashboardCard
            title="PRODUCT CATEGORIES"
            value="12"
            titlePosition="top"
            preserveCase={true}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
            style={styles.kpiCard}
          />
          <OverviewDashboardCard
            title="PRICE UPDATES"
            value="18"
            titlePosition="top"
            preserveCase={true}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
            style={styles.kpiCard}
          />
          <OverviewDashboardCard
            title="RETAIL PRICE RECORDS"
            value="124"
            titlePosition="top"
            preserveCase={true}
            titleStyle={styles.kpiTitle}
            valueStyle={styles.kpiValue}
            style={styles.kpiCard}
          />
        </OverviewCardsGrid>

        {/* Section 2: Current Market Snapshot */}
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
            <Text style={[styles.snapshotValue, { color: adminColors.success.text }]}>Active</Text>
          </View>
        </View>

        {/* Section 3: Recently Updated Prices */}
        <Text style={styles.sectionHeading}>Recently Updated Prices</Text>

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

        {/* Section 4: Quick Actions */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Quick Actions</Text>

        <View style={styles.quickGrid}>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToFairPrice}
              activeOpacity={0.8}
            >
              <FairPricesActionIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Fair Prices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToCategories}
              activeOpacity={0.8}
            >
              <CategoriesActionIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Categories & Grades</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.quickRow, { marginTop: adminSpacing.sm }]}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToPriceHistory}
              activeOpacity={0.8}
            >
              <PriceHistoryActionIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Price History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToRetailPricing}
              activeOpacity={0.8}
            >
              <RetailPricingActionIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Retail Pricing</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 5: Read-only Disclaimer Box */}
        <View style={styles.disclaimerBox}>
          <BlockCircleIcon size={18} color={adminColors.muted} />
          <Text style={styles.disclaimerText}>
            Fair-price ceiling setting is Super Admin only. Retail-price setting is not available to
            Farmer Admin. Nothing in this module can be edited.
          </Text>
        </View>

        <View style={{ height: adminSpacing.xl }} />
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
  headerTitle: {
    ...adminType.title,
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    marginTop: 4,
    opacity: 0.95,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },

  // KPI Reusable Grid styles
  kpiGridContainer: {
    marginBottom: adminSpacing.lg,
  },
  kpiCard: {
    minHeight: 88,
    borderRadius: adminRadius.xl,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.sm,
    justifyContent: 'center',
  },
  kpiTitle: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '800',
    color: adminColors.muted,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  kpiValue: {
    ...adminType.title,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
    color: adminColors.ink,
  },

  sectionHeading: {
    ...adminType.sectionHeader,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },

  // Snapshot Card styles
  snapshotCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.xs,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  snapshotLabel: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  snapshotValue: {
    ...adminType.body,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.ink,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: '#F5EFE6',
  },

  // Recently Updated Prices
  recentPriceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  recentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  recentCropTitle: {
    ...adminType.body,
    fontSize: 16,
    fontWeight: '800',
    color: adminColors.ink,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
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
    fontSize: 12,
    color: adminColors.muted,
  },
  priceColValue: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 2,
  },

  viewHistoryBtn: {
    marginTop: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  viewHistoryBtnText: {
    ...adminType.body,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.brand,
  },

  quickGrid: {
    marginTop: adminSpacing.xs,
  },
  quickRow: {
    flexDirection: 'row',
    gap: adminSpacing.sm,
  },
  quickCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    minHeight: 88,
    ...adminShadow.sm,
  },
  quickCardLabel: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: 8,
    textAlign: 'center',
  },

  disclaimerBox: {
    marginTop: adminSpacing.lg,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: adminSpacing.sm,
  },
  disclaimerText: {
    ...adminType.caption,
    fontSize: 12,
    color: '#6B6055',
    lineHeight: 18,
    flex: 1,
  },
});
