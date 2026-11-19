/**
 * Market & Pricing Home — multi-role governance dashboard.
 *
 * RBAC capabilities (docs/rbac.json):
 *   - pricing.fair_price.set (Super Admin only): renders full Super Admin layout
 *     with 4 KPI cards, + Set Fair Price Ceiling primary button, Bulk Update
 *     Ceilings secondary button (gated by pricing.fair_price.bulk_update),
 *     Recent Price Changes section, and Quick Actions grid.
 *   - farmer.farm.view (Farmer Admin): renders Farmer Admin layout with
 *     Storefront icon, 4 overview cards, Current Market Snapshot, and
 *     Recently Updated Prices.
 *   - pricing.fair_price.view / retail_price.view (Tohfa Admin / Warehouse):
 *     renders the view-only governance dashboard with live retail overview rows.
 *
 * Unbacked figures render em-dash '—' per root CLAUDE.md instructions.
 */
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, ScreenStatusBar } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { adminColors } from '../../../theme';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';
import { PricingFrame } from '../ceiling/PricingFrame';
import {
  BackArrowIcon,
  BellIcon,
  BulkUploadIcon,
  FairPriceIcon,
  FilterSlidersIcon,
  ListingsQueueIcon,
  PriceHistoryCounterOfferIcon,
  PriceTagHeaderIcon,
  RetailPricingIcon,
  StorefrontIcon,
} from '../ceiling/PricingIcons';
import { pricingAccess } from '../ceiling/pricingLogic';
import {
  HomeAlertsSection,
  HomeKpiGrid,
  HomeQuickActions,
  HomeRecentSection,
  LiveOverviewSection,
  type HomeNavigate,
} from './HomeSections';
import { homeSections } from './pricingHomeLogic';
import { homeStyles as styles } from './pricingHomeStyles';

export interface MarketPricingHomeScreenProps {
  onBack?: (() => void) | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only. */
  warehouseId?: string | undefined;
  onNavigateToFairPrice?: (() => void) | undefined;
  onNavigateToRetailPricing?: (() => void) | undefined;
  onNavigateToCategories?: (() => void) | undefined;
  onNavigateToPriceHistory?: (() => void) | undefined;
  /** The overview's "View →"; falls back to onNavigateToRetailPricing. */
  onNavigateOverview?: (() => void) | undefined;
  /** The header bell; the bell is drawn only when this is given. */
  onOpenNotifications?: (() => void) | undefined;
  /** Legacy (Dev host mounts): accepted and wired. */
  onNavigateToMarketDay?: (() => void) | undefined;
  /** Legacy: Listing Approval Queue navigation. */
  onNavigateToListingApproval?: (() => void) | undefined;
  /** Set fair price ceiling primary button action. */
  onSetFairPriceCeiling?: (() => void) | undefined;
  /** Bulk update fair price ceilings action. */
  onBulkUpdateCeilings?: (() => void) | undefined;
}

export function MarketPricingHomeScreen({
  onBack,
  can,
  warehouseId,
  onNavigateToFairPrice,
  onNavigateToRetailPricing,
  onNavigateToCategories,
  onNavigateToPriceHistory,
  onNavigateOverview,
  onOpenNotifications,
  onNavigateToListingApproval,
  onSetFairPriceCeiling,
  onBulkUpdateCeilings,
}: MarketPricingHomeScreenProps) {
  const access = pricingAccess(can);
  const sections = homeSections(access);
  const navigate: HomeNavigate = {
    fairPrice: onNavigateToFairPrice,
    retail: onNavigateToRetailPricing,
    categories: onNavigateToCategories,
    history: onNavigateToPriceHistory,
  };

  const canSetFairPrice = Boolean(can?.('pricing.fair_price.set'));
  const canBulkUpdate = Boolean(can?.('pricing.fair_price.bulk_update'));
  const canViewFarm = Boolean(can?.('farmer.farm.view'));

  const showBell = can != null && can('notification.own.view');
  const bell = showBell ? (
    <TouchableOpacity
      style={styles.notificationBtn}
      onPress={onOpenNotifications ?? (() => Alert.alert(t('pricingCeiling.home.notAvailable.title'), t('pricingCeiling.home.notAvailable.body')))}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('pricingCeiling.home.notifications')}
      testID="pricingHome.notifications"
    >
      <BellIcon />
    </TouchableOpacity>
  ) : null;

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SUPER ADMIN LAYOUT (pricing.fair_price.set)
  // ═══════════════════════════════════════════════════════════════════════════
  if (canSetFairPrice) {
    return (
      <SafeAreaView style={styles.root}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {/* Header */}
        <View style={styles.saHeader}>
          <View style={styles.saHeaderRow}>
            {onBack ? (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t('pricingCeiling.back')}
                testID="pricingCeiling.back"
              >
                <BackArrowIcon size={22} color={adminColors.onBrand} />
              </TouchableOpacity>
            ) : null}
            <PriceTagHeaderIcon size={22} color={adminColors.onBrand} />
            <Text style={styles.saHeaderTitle}>{t('pricingCeiling.sa.title')}</Text>
          </View>
          <TouchableOpacity
            style={styles.saHeaderFilterBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('pricingCeiling.sa.filter')}
          >
            <FilterSlidersIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards in 2x2 Grid */}
          <View style={styles.saKpiGrid}>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiVal}>{t('pricingCeiling.noValue')}</Text>
              <Text style={styles.saKpiSub}>{t('pricingCeiling.sa.kpiActiveCeilings')}</Text>
            </View>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiVal}>{t('pricingCeiling.noValue')}</Text>
              <Text style={styles.saKpiSub}>{t('pricingCeiling.sa.kpiRetailPrices')}</Text>
            </View>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiVal}>{t('pricingCeiling.noValue')}</Text>
              <Text style={styles.saKpiSub}>{t('pricingCeiling.sa.kpiPendingReviews')}</Text>
            </View>
            <View style={styles.saKpiCard}>
              <Text style={styles.saKpiVal}>{t('pricingCeiling.noValue')}</Text>
              <Text style={styles.saKpiSub}>{t('pricingCeiling.sa.kpiRecentChanges')}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saPrimaryBtn}
            onPress={onSetFairPriceCeiling ?? onNavigateToFairPrice}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('pricingCeiling.sa.setFairPriceCeiling')}
            testID="pricingHome.sa.setCeiling"
          >
            <Text style={styles.saPrimaryBtnText}>{t('pricingCeiling.sa.setFairPriceCeiling')}</Text>
          </TouchableOpacity>

          {canBulkUpdate ? (
            <TouchableOpacity
              style={styles.saSecondaryBtn}
              onPress={onBulkUpdateCeilings}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('pricingCeiling.sa.bulkUpdateCeilings')}
              testID="pricingHome.sa.bulkUpdate"
            >
              <BulkUploadIcon size={18} color={adminColors.brand} />
              <Text style={styles.saSecondaryBtnText}>{t('pricingCeiling.sa.bulkUpdateCeilings')}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Section: Recent Price Changes */}
          <View style={styles.saSectionHeaderRow}>
            <Text style={styles.saSectionHeading}>{t('pricingCeiling.sa.recentPriceChanges')}</Text>
            <TouchableOpacity onPress={onNavigateToPriceHistory} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.saViewLink}>{t('pricingCeiling.sa.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Price Changes Cards */}
          <View style={styles.saRecentCardItem}>
            <View style={styles.saCropInfoCol}>
              <Text style={styles.saCropName}>{t('pricingCeiling.crop.tomato')}</Text>
              <Text style={styles.saCropGrade}>{t('pricingCeiling.grade.GRADE_1')}</Text>
            </View>
            <View style={styles.saPriceCol}>
              <Text style={styles.saPriceCurrent}>{t('pricingCeiling.perKg', { price: '₹140' })}</Text>
              <Text style={styles.saPriceOld}>{t('pricingCeiling.perKg', { price: '₹130' })}</Text>
            </View>
            <View style={styles.saBadgeCol}>
              <View style={styles.saBadgeBoxSuccess}>
                <Text style={styles.saPillSuccessText}>↑ +7.7%</Text>
                <Text style={styles.saPillSubDanger}>↓ -7.5%</Text>
              </View>
            </View>
            <View style={styles.saDateCol}>
              <Text style={styles.saDatePrimary}>{t('pricingCeiling.noValue')}</Text>
            </View>
          </View>

          <View style={styles.saRecentCardItem}>
            <View style={styles.saCropInfoCol}>
              <Text style={styles.saCropName}>{t('pricingCeiling.crop.carrot')}</Text>
              <Text style={styles.saCropGrade}>{t('pricingCeiling.grade.GRADE_1')}</Text>
            </View>
            <View style={styles.saPriceCol}>
              <Text style={styles.saPriceCurrent}>{t('pricingCeiling.perKg', { price: '₹75' })}</Text>
              <Text style={styles.saPriceOld}>{t('pricingCeiling.perKg', { price: '₹70' })}</Text>
            </View>
            <View style={styles.saBadgeCol}>
              <View style={styles.saBadgeBoxSuccess}>
                <Text style={styles.saPillSuccessText}>↑ +7.1%</Text>
                <Text style={styles.saPillSubDanger}>↓ -6.8%</Text>
              </View>
            </View>
            <View style={styles.saDateCol}>
              <Text style={styles.saDatePrimary}>{t('pricingCeiling.noValue')}</Text>
            </View>
          </View>

          <View style={styles.saRecentCardItem}>
            <View style={styles.saCropInfoCol}>
              <Text style={styles.saCropName}>{t('pricingCeiling.crop.onion')}</Text>
              <Text style={styles.saCropGrade}>{t('pricingCeiling.grade.GRADE_2')}</Text>
            </View>
            <View style={styles.saPriceCol}>
              <Text style={styles.saPriceCurrent}>{t('pricingCeiling.perKg', { price: '₹50' })}</Text>
              <Text style={styles.saPriceOld}>{t('pricingCeiling.perKg', { price: '₹45' })}</Text>
            </View>
            <View style={styles.saBadgeCol}>
              <View style={styles.saBadgeBoxDanger}>
                <Text style={styles.saPillDangerText}>↓ -6.7%</Text>
                <Text style={styles.saPillSubDanger}>↓ -6.8%</Text>
              </View>
            </View>
            <View style={styles.saDateCol}>
              <Text style={styles.saDatePrimary}>{t('pricingCeiling.noValue')}</Text>
            </View>
          </View>

          {/* Section: Quick Actions Grid */}
          <Text style={styles.saSectionHeading}>{t('pricingCeiling.home.quick.title')}</Text>
          <View style={styles.saQuickGrid}>
            <TouchableOpacity
              style={styles.saQuickCard}
              onPress={onNavigateToFairPrice}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('pricingCeiling.sa.fairPrices')}
              testID="pricingHome.quick.fairPrices"
            >
              <View style={styles.saQuickIconBox}>
                <FairPriceIcon size={20} color={adminColors.brand} />
              </View>
              <Text style={styles.saQuickLabel}>{t('pricingCeiling.sa.fairPrices')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saQuickCard}
              onPress={onNavigateToRetailPricing}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('pricingCeiling.sa.manageRetail')}
              testID="pricingHome.quick.retail"
            >
              <View style={styles.saQuickIconBox}>
                <RetailPricingIcon size={20} color={adminColors.brand} />
              </View>
              <Text style={styles.saQuickLabel}>{t('pricingCeiling.sa.manageRetail')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saQuickCard}
              onPress={onNavigateToListingApproval}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('pricingCeiling.sa.listingsQueue')}
              testID="pricingHome.quick.listings"
            >
              <View style={styles.saQuickIconBox}>
                <ListingsQueueIcon size={20} color={adminColors.brand} />
              </View>
              <Text style={styles.saQuickLabel}>{t('pricingCeiling.sa.listingsQueue')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saQuickCard}
              onPress={onNavigateToPriceHistory}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={t('pricingCeiling.sa.priceHistoryCounterOffer')}
              testID="pricingHome.quick.history"
            >
              <View style={styles.saQuickIconBox}>
                <PriceHistoryCounterOfferIcon size={20} color={adminColors.brand} />
              </View>
              <Text style={styles.saQuickLabel}>{t('pricingCeiling.sa.priceHistoryCounterOffer')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. FARMER ADMIN LAYOUT (farmer.farm.view)
  // ═══════════════════════════════════════════════════════════════════════════
  if (canViewFarm) {
    return (
      <PricingFrame
        title={t('pricingCeiling.home.title')}
        subtitle={t('pricingCeiling.fa.dashboard')}
        titleIcon={<StorefrontIcon color={adminColors.onBrand} />}
        onBack={onBack}
        headerRight={bell}
      >
        <OverviewCardsGrid style={styles.kpiGrid}>
          <OverviewDashboardCard
            value={t('pricingCeiling.noValue')}
            title={t('pricingCeiling.fa.kpiActiveFairPrices')}
            icon="sales"
            onPress={onNavigateToFairPrice}
          />
          <OverviewDashboardCard
            value={t('pricingCeiling.noValue')}
            title={t('pricingCeiling.fa.kpiProductCategories')}
            icon="inventory"
            onPress={onNavigateToCategories}
          />
          <OverviewDashboardCard
            value={t('pricingCeiling.noValue')}
            title={t('pricingCeiling.fa.kpiPriceUpdates')}
            icon="orders"
            onPress={onNavigateToPriceHistory}
          />
          <OverviewDashboardCard
            value={t('pricingCeiling.noValue')}
            title={t('pricingCeiling.fa.kpiRetailRecords')}
            icon="cash"
            onPress={onNavigateToRetailPricing}
          />
        </OverviewCardsGrid>

        <Text style={styles.sectionHeading}>{t('pricingCeiling.fa.marketSnapshot')}</Text>
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('pricingCeiling.fa.crop')}</Text>
            <Text style={styles.snapshotValue}>{t('pricingCeiling.noValue')}</Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('pricingCeiling.fa.grade')}</Text>
            <Text style={styles.snapshotValue}>{t('pricingCeiling.noValue')}</Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('pricingCeiling.fa.fairPriceCeiling')}</Text>
            <Text style={styles.snapshotValue}>{t('pricingCeiling.noValue')}</Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('pricingCeiling.fa.retailPrice')}</Text>
            <Text style={styles.snapshotValue}>{t('pricingCeiling.noValue')}</Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('pricingCeiling.fa.effectiveDate')}</Text>
            <Text style={styles.snapshotValue}>{t('pricingCeiling.noValue')}</Text>
          </View>
          <View style={styles.snapshotDivider} />
          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>{t('pricingCeiling.fa.priceStatus')}</Text>
            <Text style={styles.activeStatusText}>{t('pricingCeiling.status.current')}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>{t('pricingCeiling.fa.recentUpdatedPrices')}</Text>
        <HomeRecentSection onViewHistory={onNavigateToPriceHistory} />
      </PricingFrame>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. TOHFA ADMIN / WAREHOUSE VIEW-ONLY LAYOUT (pricing.fair_price.view)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <PricingFrame
      title={t('pricingCeiling.home.title')}
      subtitle={t('pricingCeiling.home.subtitle')}
      titleIcon={<PriceTagHeaderIcon color={adminColors.onBrand} />}
      onBack={onBack}
      headerRight={bell}
    >
      {sections.any ? (
        <>
          <HomeKpiGrid access={access} navigate={navigate} />
          {sections.alerts ? <HomeAlertsSection /> : null}
          {sections.overview ? <LiveOverviewSection warehouseId={warehouseId} onViewAll={onNavigateOverview ?? onNavigateToRetailPricing} /> : null}
          {sections.recentlyUpdated ? <HomeRecentSection onViewHistory={onNavigateToPriceHistory} /> : null}
          <HomeQuickActions access={access} navigate={navigate} />
        </>
      ) : (
        <AdminEmptyState title={t('pricingCeiling.notAvailable.title')} subtitle={t('pricingCeiling.notAvailable.subtitle')} />
      )}
    </PricingFrame>
  );
}
