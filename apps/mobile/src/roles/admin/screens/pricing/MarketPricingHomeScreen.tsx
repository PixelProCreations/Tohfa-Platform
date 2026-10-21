import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';

// ─── SVG Icons Matching Exact Design Mockup & Screenshot 2 ────────────────────

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function PriceTagHeaderIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="7" y1="7" x2="7.01" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = adminColors.ink }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function BanknotesIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="6" width="19" height="12" rx="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="2" />
      <Line x1="6" y1="9" x2="6" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="18" y1="9" x2="18" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function FairPriceIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* S-shaped currency curve with vertical stroke ticks */}
      <Path
        d="M11 3.5v2.2m0 8.8v2M13.5 7A2.2 2.2 0 0 0 11 5c-1.6 0-2.5.9-2.5 2 0 2 4.8 1.6 4.8 4 0 1.4-1 2.2-2.3 2.2a2.8 2.8 0 0 1-2.2-.9"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checkmark at bottom right */}
      <Path
        d="M14.5 14l2.2 2.2 4.3-4.3"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CategoryShapesActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5l4.5 7.5h-9L12 3.5z" stroke={color} strokeWidth="2.1" strokeLinejoin="round" />
      <Rect x="3.5" y="14" width="6.5" height="6.5" rx="1" stroke={color} strokeWidth="2.1" />
      <Circle cx="17" cy="17.2" r="3.3" stroke={color} strokeWidth="2.1" />
    </Svg>
  );
}

function HistoryClockActionIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12a8 8 0 1 0 2.34-5.66L3.5 9"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 4v5h5"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7.5v4.5l3 2"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface MarketPricingHomeScreenProps {
  onBack?: () => void;
  onNavigateOverview?: () => void;
  onNavigateToFairPrice?: () => void;
  onNavigateToCategories?: () => void;
  onNavigateToPriceHistory?: () => void;
  onNavigateToRetailPricing?: () => void;
  onOpenNotifications?: () => void;
  onNavigateToMarketDay?: () => void;
  onNavigateToListingApproval?: () => void;
}

export function MarketPricingHomeScreen({
  onBack,
  onNavigateOverview = () => {},
  onNavigateToFairPrice = () => {},
  onNavigateToCategories = () => {},
  onNavigateToPriceHistory = () => {},
  onNavigateToRetailPricing,
}: MarketPricingHomeScreenProps) {
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Header Banner with Back Button & Title Matching Design ── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeftGroup}>
            {onBack ? (
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={onBack}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : null}
            <View style={styles.headerTitleRow}>
              <PriceTagHeaderIcon size={20} color={adminColors.onBrand} />
              <Text style={styles.headerTitle} numberOfLines={1}>
                Market & Pricing
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 6 KPI Cards in 2-Column Grid Matching Image 1 ── */}
        <View style={styles.kpiGrid}>
          {/* KPI 1 */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>6</Text>
            <Text style={styles.kpiLabel}>Total Products</Text>
          </View>

          {/* KPI 2 */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>5</Text>
            <Text style={styles.kpiLabel}>With Retail Prices</Text>
          </View>

          {/* KPI 3 */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTextVal}>Not used</Text>
            <Text style={styles.kpiLabel}>Pending Price Updates</Text>
          </View>

          {/* KPI 4 */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>10 / 11</Text>
            <Text style={styles.kpiLabel}>Ceiling Compliance</Text>
          </View>

          {/* KPI 5 */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>2 / 4</Text>
            <Text style={styles.kpiLabel}>Categories & Grades</Text>
          </View>

          {/* KPI 6 */}
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNumber}>3</Text>
            <Text style={styles.kpiLabel}>Recent Changes (7d)</Text>
          </View>
        </View>

        {/* ── Subtitle Disclaimer below KPIs Matching Image 1 ── */}
        <Text style={styles.disclaimerSubtext}>
          Pending Price Updates has no review workflow configured, so it&apos;s shown as Not used; 2 scheduled changes exist regardless. Ceiling Compliance counts comparable records only.
        </Text>

        {/* ── Alerts Section Matching Image 1 (Static display) ── */}
        <Text style={styles.sectionHeading}>Alerts</Text>
        <View style={styles.alertsList}>
          {/* Alert 1: Over ceiling with red border */}
          <View style={[styles.alertCard, styles.alertCardRed]}>
            <View style={styles.alertHeaderRow}>
              <Text style={styles.alertTitle}>Carrot · Grade 1 is above its ceiling</Text>
              <View style={styles.badgeOverCeiling}>
                <Text style={styles.badgeTextOverCeiling}>Over ceiling</Text>
              </View>
            </View>
            <Text style={styles.alertSubtitle}>Retail ₹74.00 vs ceiling ₹70.00</Text>
          </View>

          {/* Alert 2: Missing price */}
          <View style={styles.alertCard}>
            <View style={styles.alertHeaderRow}>
              <Text style={styles.alertTitle}>Garlic has no retail price</Text>
              <View style={styles.badgeMissingPrice}>
                <Text style={styles.badgeTextMissingPrice}>Missing price</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Market & Pricing Overview Section Matching Image 1 ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Market & Pricing overview</Text>
          <TouchableOpacity onPress={onNavigateOverview} activeOpacity={0.7}>
            <Text style={styles.viewLinkText}>View →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.overviewCardsList}>
          {/* Card 1: Tomato Grade 1 */}
          <TouchableOpacity
            style={styles.overviewCard}
            onPress={onNavigateOverview}
            activeOpacity={0.8}
          >
            <View style={styles.overviewTopRow}>
              <Text style={styles.overviewCardTitle}>Tomato · Grade 1</Text>
              <View style={styles.badgeCompliant}>
                <Text style={styles.badgeTextCompliant}>Compliant</Text>
              </View>
            </View>
            <Text style={styles.overviewCardSubtitle}>
              Ceiling ₹60.00 · Retail ₹55.00 · Diff ₹5.00 · Updated 10 Oct 2026
            </Text>
          </TouchableOpacity>

          {/* Card 2: Carrot Grade 1 */}
          <TouchableOpacity
            style={styles.overviewCard}
            onPress={onNavigateOverview}
            activeOpacity={0.8}
          >
            <View style={styles.overviewTopRow}>
              <Text style={styles.overviewCardTitle}>Carrot · Grade 1</Text>
              <View style={styles.badgeOverCeiling}>
                <Text style={styles.badgeTextOverCeiling}>Over ceiling</Text>
              </View>
            </View>
            <Text style={styles.overviewCardSubtitle}>
              Ceiling ₹70.00 · Retail ₹74.00 · Diff -₹4.00 · Updated 9 Oct 2026
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Quick Actions Section Matching Image 1 ── */}
        <Text style={styles.sectionHeading}>Quick actions</Text>
        <View style={styles.quickGrid}>
          {/* Row 1 */}
          <View style={styles.quickRow}>
            {/* Action 1: Manage Retail Prices */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToRetailPricing || onNavigateOverview}
              activeOpacity={0.75}
            >
              <BanknotesIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Manage Retail Prices</Text>
            </TouchableOpacity>

            {/* Action 2: Fair Prices */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToFairPrice}
              activeOpacity={0.75}
            >
              <FairPriceIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Fair Prices</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={styles.quickRow}>
            {/* Action 3: Categories & Grades */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToCategories}
              activeOpacity={0.75}
            >
              <CategoryShapesActionIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Categories & Grades</Text>
            </TouchableOpacity>

            {/* Action 4: Price History & Counter-offer */}
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToPriceHistory}
              activeOpacity={0.75}
            >
              <HistoryClockActionIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Price History & Counter-offer</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Filters Popup Modal ── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Market & Pricing</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
                style={styles.modalCloseBtn}
              >
                <CloseIcon />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalBodyNote}>
              Filter records by category, compliance status, or product name across the market catalog.
            </Text>

            <TouchableOpacity
              style={styles.applyFilterBtn}
              onPress={() => {
                setFilterModalVisible(false);
                onNavigateOverview();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.applyFilterBtnText}>View All Records</Text>
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
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    flex: 1,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    flexShrink: 1,
  },
  headerTitle: {
    ...adminType.sectionHead,
    fontSize: 18,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  headerFilterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.headerIcon.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl * 2,
  },

  // 6 KPI Cards Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: adminSpacing.sm,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  kpiNumber: {
    ...adminType.kpiValue,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  kpiTextVal: {
    ...adminType.kpiValue,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: 4,
  },
  kpiLabel: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
  },

  disclaimerSubtext: {
    ...adminType.caption,
    fontSize: 11,
    lineHeight: 16,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
    paddingHorizontal: 2,
  },

  // Section Headings
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 14,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  viewLinkText: {
    ...adminType.caption,
    fontSize: 12.5,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Alerts List
  alertsList: {
    rowGap: 10,
    marginBottom: adminSpacing.lg,
  },
  alertCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  alertCardRed: {
    borderColor: adminColors.danger.text,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  alertSubtitle: {
    ...adminType.caption,
    fontSize: 11.5,
    color: adminColors.muted,
    marginTop: 6,
  },

  // Badges
  badgeOverCeiling: {
    backgroundColor: adminColors.danger.bg,
    borderColor: adminColors.danger.text,
    borderWidth: 1,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTextOverCeiling: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  badgeMissingPrice: {
    backgroundColor: adminColors.warning.bg,
    borderColor: adminColors.warning.text,
    borderWidth: 1,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTextMissingPrice: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  badgeCompliant: {
    backgroundColor: adminColors.success.bg,
    borderColor: adminColors.success.text,
    borderWidth: 1,
    borderRadius: adminRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTextCompliant: {
    ...adminType.caption,
    fontSize: 10.5,
    fontWeight: '700',
    color: adminColors.success.text,
  },

  // Market & Pricing Overview Cards
  overviewCardsList: {
    rowGap: 10,
    marginBottom: adminSpacing.lg,
  },
  overviewCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    ...adminShadow.sm,
  },
  overviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  overviewCardTitle: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '800',
    color: adminColors.ink,
  },
  overviewCardSubtitle: {
    ...adminType.caption,
    fontSize: 11,
    color: adminColors.muted,
    lineHeight: 15,
  },

  // Quick Actions 2x2 Grid
  quickGrid: {
    rowGap: 10,
    marginBottom: adminSpacing.lg,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.lg,
    paddingHorizontal: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: adminColors.border,
    rowGap: 8,
    ...adminShadow.sm,
  },
  quickCardLabel: {
    ...adminType.body,
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
    lineHeight: 16,
  },

  bottomSpacer: {
    height: adminSpacing.xl,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  modalTitle: {
    ...adminType.sectionHead,
    fontSize: 17,
    fontWeight: '800',
    color: adminColors.ink,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBodyNote: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
    lineHeight: 18,
    marginBottom: adminSpacing.lg,
  },
  applyFilterBtn: {
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFilterBtnText: {
    ...adminType.rowTitle,
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});
