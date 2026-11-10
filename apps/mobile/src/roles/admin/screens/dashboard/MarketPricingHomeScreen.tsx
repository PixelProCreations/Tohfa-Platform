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

import {
  adminColors,
  adminOverlay,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { OverviewDashboardCard, OverviewCardsGrid } from '../../components/OverviewDashboardCard';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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
      {/* Dollar sign on top */}
      <Path
        d="M11 2v2m0 9v2M13.5 5.5c0-1.1-.9-2-2.5-2s-2.5.9-2.5 2c0 2 5 1.5 5 4s-1 2.5-2.5 2.5-2.5-.9-2.5-2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Checkmark underneath */}
      <Path
        d="M13 18l2.5 2.5 5-5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CategoryShapesIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l4.5 7.5h-9L12 3zM6 15a3 3 0 100 6 3 3 0 000-6zM15 15h5v5h-5v-5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function _BlockCircleIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function _FairPricesCardIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 3v2.2m0 8.8v2.2M13.5 6.8A2.2 2.2 0 0011 4.8c-1.6 0-2.5.9-2.5 2 0 2 4.8 1.6 4.8 4 0 1.4-1 2.2-2.3 2.2a2.8 2.8 0 01-2.2-.9"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.5 14l2.5 2.5 4.5-4.5"
        stroke={color}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function _ManageRetailPriceIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6h14a1.8 1.8 0 011.8 1.8v7.4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="2" y="8" width="17" height="11" rx="1.8" stroke={color} strokeWidth="1.8" />
      <Circle cx="10.5" cy="13.5" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function ListingsQueueIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="7" r="1.5" fill={color} />
      <Line x1="10" y1="7" x2="21" y2="7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="5" cy="12" r="1.5" fill={color} />
      <Line x1="10" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Circle cx="5" cy="17" r="1.5" fill={color} />
      <Line x1="10" y1="17" x2="21" y2="17" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function PriceHistoryCounterOfferIcon({ size = 26, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 12a8.5 8.5 0 108.5-8.5c-2.3 0-4.5.9-6.1 2.5L3.5 8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 3.5v4.5H8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 7.5v4.5l3 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function _NavHomeIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10L12 3l9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1V10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function _NavWorkQueueIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 13.5l3.5 3.5L13 9"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="16" y1="12" x2="22" y2="12" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <Line x1="16" y1="16.5" x2="22" y2="16.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function _NavInventoryIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 20h18M4 17l2.5-9h11L20 17M8 17v-4h8v4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function _NavFinanceIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6.5h14a1.8 1.8 0 011.8 1.8v7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="2" y="8.5" width="17" height="11" rx="1.8" stroke={color} strokeWidth="1.8" />
      <Circle cx="10.5" cy="14" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

function _NavMenuIcon({ active }: { active: boolean }) {
  const color = active ? adminColors.brand : adminColors.muted;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="1.8" fill={color} />
      <Circle cx="12" cy="5" r="1.8" fill={color} />
      <Circle cx="19" cy="5" r="1.8" fill={color} />
      <Circle cx="5" cy="12" r="1.8" fill={color} />
      <Circle cx="12" cy="12" r="1.8" fill={color} />
      <Circle cx="19" cy="12" r="1.8" fill={color} />
      <Circle cx="5" cy="19" r="1.8" fill={color} />
      <Circle cx="12" cy="19" r="1.8" fill={color} />
      <Circle cx="19" cy="19" r="1.8" fill={color} />
    </Svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

export interface MarketPricingHomeScreenProps {
  onBack?: (() => void) | undefined;
  onNavigateOverview?: (() => void) | undefined;
  onNavigateToFairPrice?: (() => void) | undefined;
  onNavigateToCategories?: (() => void) | undefined;
  onNavigateToPriceHistory?: (() => void) | undefined;
  onNavigateToRetailPricing?: (() => void) | undefined;
  onOpenNotifications?: (() => void) | undefined;
  onNavigateToMarketDay?: (() => void) | undefined;
  onNavigateToListingApproval?: (() => void) | undefined;
  onSetFairPriceCeiling?: (() => void) | undefined;
  onBulkUpdateCeilings?: (() => void) | undefined;
  role?: ('TOHFA_ADMIN' | 'FARMER_ADMIN' | 'SUPER_ADMIN') | undefined;
  onNavigateHome?: (() => void) | undefined;
  onNavigateWorkQueue?: (() => void) | undefined;
  onNavigateInventory?: (() => void) | undefined;
  onNavigateFinance?: (() => void) | undefined;
  onNavigateMenu?: (() => void) | undefined;
  activeBottomTab?: 'Home' | 'WorkQueue' | 'Inventory' | 'Finance' | 'Menu';

}

export function MarketPricingHomeScreen({
  onBack,
  onNavigateOverview,
  onNavigateToFairPrice,
  onNavigateToCategories,
  onNavigateToPriceHistory,
  onNavigateToRetailPricing,
  onOpenNotifications,
  onNavigateToMarketDay: _onNavigateToMarketDay,
  onNavigateToListingApproval,
  onSetFairPriceCeiling,
  onBulkUpdateCeilings,
  role = 'TOHFA_ADMIN',
  onNavigateHome: _onNavigateHome,
  onNavigateWorkQueue: _onNavigateWorkQueue,
  onNavigateInventory: _onNavigateInventory,
  onNavigateFinance: _onNavigateFinance,
  onNavigateMenu: _onNavigateMenu,
  activeBottomTab: _activeBottomTab = 'Menu',
}: MarketPricingHomeScreenProps) {
  const isTohfaAdmin = role === 'TOHFA_ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPER ADMIN VIEW (Exact UI from Image 2 Left)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isSuperAdmin) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* Header */}
        <View style={styles.saHeader}>
          <View style={styles.saHeaderRow}>
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
            <PriceTagHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.saHeaderTitle}>Market & Pricing</Text>
          </View>
          <TouchableOpacity style={styles.saHeaderFilterBtn} activeOpacity={0.8}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* 4 KPI Cards in 2x2 Grid */}
          <View style={styles.saKpiGrid}>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiVal}>236</Text>
              <Text style={styles.saKpiSub}>Active Fair-price ceilings</Text>
            </View>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiVal}>182</Text>
              <Text style={styles.saKpiSub}>Retail prices</Text>
            </View>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiVal}>24</Text>
              <Text style={styles.saKpiSub}>Pending Listing Reviews</Text>
            </View>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiVal}>17</Text>
              <Text style={styles.saKpiSub}>Recent Price changes (30Days)</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saPrimaryBtn}
            onPress={onSetFairPriceCeiling || onNavigateToFairPrice}
            activeOpacity={0.8}
          >
            <Text style={styles.saPrimaryBtnText}>+ Set Fair Price Ceiling</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saSecondaryBtn}
            onPress={onBulkUpdateCeilings}
            activeOpacity={0.8}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke={adminColors.brand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.saSecondaryBtnText}>Bulk Update Ceilings</Text>
          </TouchableOpacity>

          {/* Section: Recent Price Changes */}
          <View style={styles.saSectionHeaderRow}>
            <Text style={styles.saSectionHeading}>Recent Price Changes</Text>
            <TouchableOpacity onPress={onNavigateToPriceHistory} activeOpacity={0.7}>
              <Text style={styles.saViewLink}>View →</Text>
            </TouchableOpacity>
          </View>

          {/* Row 1: Tomato */}
          <View style={styles.saRecentCardItem}>
            <View style={styles.saCropInfoCol}>
              <Text style={styles.saCropName}>Tomato</Text>
              <Text style={styles.saCropGrade}>Grade 1</Text>
            </View>
            <View style={styles.saPriceCol}>
              <Text style={styles.saPriceCurrent}>₹140/kg</Text>
              <Text style={styles.saPriceOld}>₹130/kg</Text>
            </View>
            <View style={styles.saBadgeCol}>
              <View style={styles.saBadgeBoxSuccess}>
                <Text style={styles.saPillSuccessText}>↑ +7.7%</Text>
                <Text style={styles.saPillSubDanger}>↓ -7.5%</Text>
              </View>
            </View>
            <View style={styles.saDateCol}>
              <Text style={styles.saDatePrimary}>05 Oct 2026</Text>
              <Text style={styles.saDateSecondary}>20 Sep 2026</Text>
            </View>
          </View>

          {/* Row 2: Carrot */}
          <View style={styles.saRecentCardItem}>
            <View style={styles.saCropInfoCol}>
              <Text style={styles.saCropName}>Carrot</Text>
              <Text style={styles.saCropGrade}>Grade 1</Text>
            </View>
            <View style={styles.saPriceCol}>
              <Text style={styles.saPriceCurrent}>₹75/kg</Text>
              <Text style={styles.saPriceOld}>₹70/kg</Text>
            </View>
            <View style={styles.saBadgeCol}>
              <View style={styles.saBadgeBoxSuccess}>
                <Text style={styles.saPillSuccessText}>↑ +7.1%</Text>
                <Text style={styles.saPillSubDanger}>↓ -6.8%</Text>
              </View>
            </View>
            <View style={styles.saDateCol}>
              <Text style={styles.saDatePrimary}>03 Oct 2026</Text>
              <Text style={styles.saDateSecondary}>15 Sep 2026</Text>
            </View>
          </View>

          {/* Row 3: Onion */}
          <View style={styles.saRecentCardItem}>
            <View style={styles.saCropInfoCol}>
              <Text style={styles.saCropName}>Onion</Text>
              <Text style={styles.saCropGrade}>Grade 2</Text>
            </View>
            <View style={styles.saPriceCol}>
              <Text style={styles.saPriceCurrent}>₹50/kg</Text>
              <Text style={styles.saPriceOld}>₹45/kg</Text>
            </View>
            <View style={styles.saBadgeCol}>
              <View style={styles.saBadgeBoxDanger}>
                <Text style={styles.saPillDangerText}>↓ -6.7%</Text>
                <Text style={styles.saPillSubDanger}>↓ -6.8%</Text>
              </View>
            </View>
            <View style={styles.saDateCol}>
              <Text style={styles.saDatePrimary}>04 Oct 2026</Text>
              <Text style={styles.saDateSecondary}>18 Sep 2026</Text>
            </View>
          </View>

          {/* Section: Quick Actions */}
          <Text style={[styles.saSectionHeading, { marginTop: 20 }]}>Quick actions</Text>
          <View style={styles.saQuickGrid}>
            <TouchableOpacity
              style={styles.saQuickCard}
              onPress={onNavigateToFairPrice}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Fair Prices"
            >
              <View style={styles.saQuickIconBox}>
                <FairPriceIcon size={24} color={adminColors.brand} />
              </View>
              <Text style={styles.saQuickLabel}>Fair Prices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saQuickCard}
              onPress={onNavigateToRetailPricing}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Manage Retail Prices"
            >
              <View style={styles.saQuickIconBox}>
                <BanknotesIcon size={24} color={adminColors.brand} />
              </View>
              <Text style={styles.saQuickLabel}>Manage Retail Prices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saQuickCard}
              onPress={onNavigateToListingApproval}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Listings Queue"
            >
              <View style={styles.saQuickIconBox}>
                <ListingsQueueIcon size={20} color={adminColors.brand} />
              </View>
              <Text style={styles.saQuickLabel}>Listings Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saQuickCard}
              onPress={onNavigateToPriceHistory}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Price History & Counter-offer"
            >
              <View style={styles.saQuickIconBox}>
                <PriceHistoryCounterOfferIcon size={20} color={adminColors.brand} />
              </View>
              <Text style={styles.saQuickLabel}>Price History & Counter-offer</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TOHFA ADMIN VIEW (Module 7 from Tohfa Admin Design Specification)
  // ═══════════════════════════════════════════════════════════════════════════
  if (isTohfaAdmin) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

        {/* ─── Tohfa Admin Header ─── */}
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

              <PriceTagHeaderIcon size={22} color={adminColors.onBrand} />
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

          <Text style={[styles.headerSubtitle, onBack ? { paddingLeft: 34 } : null]}>
            Market & pricing governance dashboard
          </Text>
        </View>

        {/* ─── Tohfa Admin Content ─── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollPad}
          showsVerticalScrollIndicator={false}
        >
          {/* 6 KPI Cards in 2-Column Grid Matching Tohfa Admin Design */}
          <OverviewCardsGrid style={{ marginBottom: adminSpacing.sm }}>
            <OverviewDashboardCard
              value="6"
              title="Total Products"
              icon="box"
              onPress={onNavigateOverview}
            />
            <OverviewDashboardCard
              value="5"
              title="With Retail Prices"
              icon="sales"
              onPress={onNavigateToRetailPricing}
            />
            <OverviewDashboardCard
              value="Not used"
              title="Pending Price Updates"
              icon="orders"
              onPress={onNavigateOverview}
            />
            <OverviewDashboardCard
              value="10 / 11"
              title="Ceiling Compliance"
              icon="clipboard"
              onPress={onNavigateToFairPrice}
            />
            <OverviewDashboardCard
              value="2 / 4"
              title="Categories & Grades"
              icon="categories"
              onPress={onNavigateToCategories}
            />
            <OverviewDashboardCard
              value="3"
              title="Recent Changes (7d)"
              icon="history"
              onPress={onNavigateToPriceHistory}
            />
          </OverviewCardsGrid>

          {/* Alerts Section Matching Tohfa Admin Specification */}
          <Text style={styles.sectionHeading}>Alerts</Text>
          <View style={styles.alertsList}>
            {/* Alert 1 */}
            <TouchableOpacity
              style={[styles.alertCard, styles.alertCardRed]}
              onPress={onNavigateOverview}
              activeOpacity={0.8}
            >
              <View style={styles.alertHeaderRow}>
                <Text style={styles.alertTitle}>Tomato · Grade 3</Text>
                <View style={styles.badgeOverCeiling}>
                  <Text style={styles.badgeTextOverCeiling}>Over ceiling</Text>
                </View>
              </View>
              <Text style={styles.alertSubtitle}>
                Ceiling ₹40.00 · Retail ₹45.00 · Diff +₹5.00 · Updated 7 Oct 2026
              </Text>
            </TouchableOpacity>

            {/* Alert 2 */}
            <TouchableOpacity
              style={styles.alertCard}
              onPress={onNavigateToRetailPricing}
              activeOpacity={0.8}
            >
              <View style={styles.alertHeaderRow}>
                <Text style={styles.alertTitle}>Beans · Grade 2</Text>
                <View style={styles.badgeMissingPrice}>
                  <Text style={styles.badgeTextMissingPrice}>No retail price</Text>
                </View>
              </View>
              <Text style={styles.alertSubtitle}>
                Ceiling ₹70.00 · Retail — · Diff — · Updated 8 Oct 2026
              </Text>
            </TouchableOpacity>

            {/* Alert 3 */}
            <TouchableOpacity
              style={styles.alertCard}
              onPress={onNavigateOverview}
              activeOpacity={0.8}
            >
              <View style={styles.alertHeaderRow}>
                <Text style={styles.alertTitle}>Capsicum · Grade 1</Text>
                <View style={styles.badgeCompliant}>
                  <Text style={styles.badgeTextCompliant}>Compliant</Text>
                </View>
              </View>
              <Text style={styles.alertSubtitle}>
                Ceiling ₹70.00 · Retail ₹74.00 · Diff -₹4.00 · Updated 9 Oct 2026
              </Text>
            </TouchableOpacity>
          </View>

          {/* Market & Pricing Overview Cards Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Market & Pricing Overview</Text>
            <TouchableOpacity onPress={onNavigateOverview} activeOpacity={0.7}>
              <Text style={styles.viewLinkText}>View →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.overviewCardsList}>
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
                Ceiling ₹80.00 · Retail ₹85.00 · Diff +₹5.00 · Updated 10 Oct 2026
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions 2x2 Grid */}
          <Text style={styles.sectionHeading}>Quick actions</Text>
          <View style={styles.quickGrid}>
            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={onNavigateToRetailPricing || onNavigateOverview}
                activeOpacity={0.75}
              >
                <BanknotesIcon size={26} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Manage Retail Prices</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                onPress={onNavigateToFairPrice}
                activeOpacity={0.75}
              >
                <FairPriceIcon size={26} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Fair Prices</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickRow}>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={onNavigateToCategories}
                activeOpacity={0.75}
              >
                <CategoryShapesIcon size={26} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Categories & Grades</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                onPress={onNavigateToPriceHistory}
                activeOpacity={0.75}
              >
                <PriceHistoryIcon size={26} color={adminColors.brand} />
                <Text style={styles.quickCardLabel}>Price Change History</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FARMER ADMIN VIEW (Matching Farmer Admin Design Specification)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Farmer Admin Header ─── */}
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

        <Text style={[styles.headerSubtitle, onBack ? { paddingLeft: 34 } : null]}>
          Market & Pricing Dashboard
        </Text>
      </View>

      {/* ─── Scroll Container ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 KPI Cards (2x2 Grid) */}
        <OverviewCardsGrid style={{ marginBottom: adminSpacing.lg }}>
          <OverviewDashboardCard
            value="124"
            title="ACTIVE FAIR PRICES"
            icon="sales"
            titlePosition="bottom"
            onPress={onNavigateToFairPrice}
          />
          <OverviewDashboardCard
            value="12"
            title="PRODUCT CATEGORIES"
            icon="inventory"
            titlePosition="bottom"
            onPress={onNavigateToCategories}
          />
          <OverviewDashboardCard
            value="18"
            title="PRICE UPDATES"
            icon="orders"
            titlePosition="bottom"
            onPress={onNavigateToPriceHistory}
          />
          <OverviewDashboardCard
            value="124"
            title="RETAIL PRICE RECORDS"
            icon="cash"
            titlePosition="bottom"
            onPress={onNavigateToRetailPricing}
          />
        </OverviewCardsGrid>

        {/* Section 1: Current Market Snapshot */}
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
            <Text style={styles.activeStatusText}>Active</Text>
          </View>
        </View>

        {/* Section 2: Recently Updated Prices */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Recently Updated Prices</Text>

        {/* Card 1: Carrot · Grade 1 */}
        <View style={styles.recentPriceCard}>
          <View style={styles.recentPriceHeaderRow}>
            <Text style={styles.recentPriceCropTitle}>Carrot · Grade 1</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>
          <View style={styles.recentPriceColsRow}>
            <View style={styles.recentPriceCol}>
              <Text style={styles.recentPriceLabel}>Fair Price</Text>
              <Text style={styles.recentPriceValue}>₹100/kg</Text>
            </View>
            <View style={styles.recentPriceCol}>
              <Text style={styles.recentPriceLabel}>Retail Price</Text>
              <Text style={styles.recentPriceValue}>₹120/kg</Text>
            </View>
            <View style={styles.recentPriceCol}>
              <Text style={styles.recentPriceLabel}>Effective</Text>
              <Text style={styles.recentPriceValue}>30 Sep</Text>
            </View>
          </View>
        </View>

        {/* Card 2: Cabbage · Grade 2 */}
        <View style={styles.recentPriceCard}>
          <View style={styles.recentPriceHeaderRow}>
            <Text style={styles.recentPriceCropTitle}>Cabbage · Grade 2</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>
          <View style={styles.recentPriceColsRow}>
            <View style={styles.recentPriceCol}>
              <Text style={styles.recentPriceLabel}>Fair Price</Text>
              <Text style={styles.recentPriceValue}>₹60/kg</Text>
            </View>
            <View style={styles.recentPriceCol}>
              <Text style={styles.recentPriceLabel}>Retail Price</Text>
              <Text style={styles.recentPriceValue}>₹75/kg</Text>
            </View>
            <View style={styles.recentPriceCol}>
              <Text style={styles.recentPriceLabel}>Effective</Text>
              <Text style={styles.recentPriceValue}>29 Sep</Text>
            </View>
          </View>
        </View>

        {/* View History Outline Button */}
        <TouchableOpacity
          style={styles.viewHistoryOutlineBtn}
          onPress={onNavigateToPriceHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.viewHistoryOutlineBtnText}>View History</Text>
        </TouchableOpacity>

        {/* Section 3: Quick Actions 2x2 Grid */}
        <Text style={[styles.sectionHeading, { marginTop: adminSpacing.lg }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToFairPrice}
              activeOpacity={0.75}
            >
              <PriceCheckIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Fair Prices</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToCategories}
              activeOpacity={0.75}
            >
              <CategoryShapesIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Categories & Grades</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToPriceHistory}
              activeOpacity={0.75}
            >
              <PriceHistoryIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Price History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={onNavigateToRetailPricing}
              activeOpacity={0.75}
            >
              <RetailPricingIcon size={26} color={adminColors.brand} />
              <Text style={styles.quickCardLabel}>Retail Pricing</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: adminSpacing.lg,
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
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    ...adminType.caption,
    color: adminColors.onBrand,
    opacity: 0.9,
    marginTop: 4,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollPad: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xxl,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  viewLinkText: {
    ...adminType.caption,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },

  // Alerts List (Tohfa Admin)
  alertsList: {
    gap: 10,
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

  // Market & Pricing Overview Cards (Tohfa Admin)
  overviewCardsList: {
    gap: 10,
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

  // Snapshot Card (Farmer Admin)
  snapshotCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  snapshotLabel: {
    ...adminType.body,
    fontSize: 13,
    color: adminColors.muted,
  },
  snapshotValue: {
    ...adminType.body,
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: adminColors.border,
  },
  compliantBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  compliantBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.success.text,
  },

  activeStatusText: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  recentPriceCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.card,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  recentPriceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  recentPriceCropTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 14,
  },
  recentPriceColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentPriceCol: {
    flex: 1,
  },
  recentPriceLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 2,
  },
  recentPriceValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontSize: 13,
  },
  viewHistoryOutlineBtn: {
    borderWidth: 1,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  viewHistoryOutlineBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },

  // Ceiling Prices Card (Farmer Admin)
  ceilingCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    ...adminShadow.sm,
  },
  ceilingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  ceilingCardTitle: {
    ...adminType.rowTitle,
    fontSize: 14,
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
    marginTop: 8,
    marginBottom: adminSpacing.lg,
  },
  viewHistoryBtnText: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.brandDeep,
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
  saHeader: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saHeaderTitle: {
    color: adminColors.onBrand,
    fontSize: 20,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 24,
  },
  saHeaderFilterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminOverlay.whitePill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  saKpiCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
  },
  saKpiVal: {
    color: adminColors.ink,
    fontSize: 22,
    fontWeight: '800',
    includeFontPadding: false,
    lineHeight: 26,
  },
  saKpiSub: {
    color: adminColors.muted,
    fontSize: 11,
    marginTop: 4,
    includeFontPadding: false,
  },
  saPrimaryBtn: {
    backgroundColor: adminColors.brand,
    height: 48,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...adminShadow.sm,
  },
  saPrimaryBtnText: {
    color: adminColors.onBrand,
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saSecondaryBtn: {
    backgroundColor: adminColors.card,
    height: 48,
    borderRadius: adminRadius.sm,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  saSecondaryBtnText: {
    color: adminColors.brand,
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  saSectionHeading: {
    color: adminColors.brandDeep,
    fontSize: 15,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saViewLink: {
    color: adminColors.brand,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saRecentCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    ...adminShadow.sm,
  },
  saRecentCardItem: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFE6DC',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  saBadgeBoxSuccess: {
    backgroundColor: '#EAF7EE',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saBadgeBoxDanger: {
    backgroundColor: '#FDE8E8',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saRecentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: adminColors.border,
  },
  saCropInfoCol: {
    flex: 1.2,
  },
  saCropName: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saCropGrade: {
    color: adminColors.muted,
    fontSize: 11,
    includeFontPadding: false,
  },
  saPriceCol: {
    flex: 1.1,
  },
  saPriceCurrent: {
    color: adminColors.ink,
    fontSize: 13,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saPriceOld: {
    color: adminColors.muted,
    fontSize: 11,
    textDecorationLine: 'line-through',
    includeFontPadding: false,
  },
  saBadgeCol: {
    flex: 1.1,
    alignItems: 'center',
  },
  saPillSuccess: {
    backgroundColor: adminColors.success.bg,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saPillSuccessText: {
    color: adminColors.success.text,
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saPillDanger: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  saPillDangerText: {
    color: adminColors.danger.text,
    fontSize: 10,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saPillSubDanger: {
    color: adminColors.danger.text,
    fontSize: 9,
    marginTop: 2,
    includeFontPadding: false,
  },
  saDateCol: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  saDatePrimary: {
    color: adminColors.ink,
    fontSize: 11,
    fontWeight: '600',
    includeFontPadding: false,
  },
  saDateSecondary: {
    color: adminColors.muted,
    fontSize: 10,
    includeFontPadding: false,
  },
  saQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  saQuickCard: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  saQuickIconBox: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  saQuickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: adminColors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  saQuickIconSymbol: {
    color: adminColors.brand,
    fontSize: 18,
    fontWeight: '700',
    includeFontPadding: false,
  },
  saQuickLabel: {
    color: adminColors.ink,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 16,
  },
  saBottomBar: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  saTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 54,
  },
  saTabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 3,
    includeFontPadding: false,
  },
  saTabLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
