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
import { adminColors, adminSpacing } from '../../../theme';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { OverviewCardsGrid, OverviewDashboardCard, OverviewActionCard } from '../../../components';
import { PricingFrame } from '../ceiling/PricingFrame';
import {
  BackArrowIcon,
  BellIcon,
  BulkUploadIcon,
  FairPriceIcon,
  FilterSlidersIcon,
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
  SaRecentChangesSection,
  type HomeNavigate,
} from './HomeSections';
import { usePricingHomeKpis } from '../../../api/pricingHooks';
import { recentCeilingChanges, todayInIndia } from '../../../api/pricingMappers';
import { homeSections, kpiValueText, HOME_RECENT_CHANGE_ROWS } from './pricingHomeLogic';
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
  onNavigateToListingApproval: _onNavigateToListingApproval,
  onSetFairPriceCeiling,
  onBulkUpdateCeilings,
}: MarketPricingHomeScreenProps) {
  const access = pricingAccess(can);
  const sections = homeSections(access);
  // Counted from GET /fair-prices and GET /retail-prices (no KPI endpoint
  // exists); a figure that cannot be counted honestly stays null and renders
  // as the dash. The lists are requested only with their read code.
  const { kpis, fairRows, isLoading: kpisLoading, error: kpisError } = usePricingHomeKpis(warehouseId, { fairEnabled: access.canViewFair, retailEnabled: access.canViewRetail });
  // The same look-back the "Recent Changes (7d)" KPI counts, as rows. The day
  // is fixed when the screen opens, as the ceiling list's own window status is.
  const today = React.useMemo(() => todayInIndia(), []);
  const recentChanges = React.useMemo(
    () => recentCeilingChanges(fairRows, today, HOME_RECENT_CHANGE_ROWS),
    [fairRows, today],
  );
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
  // 1. SUPER ADMIN LAYOUT (pricing.fair_price.set with management actions)
  // ═══════════════════════════════════════════════════════════════════════════
  if (canSetFairPrice && (onSetFairPriceCeiling || onBulkUpdateCeilings)) {
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

        <ScrollView style={styles.scroll} contentContainerStyle={styles.saScrollPad} showsVerticalScrollIndicator={false}>
          {/* 4 KPI Cards in 2x2 Grid using Reusable OverviewDashboardCard */}
          <OverviewCardsGrid style={styles.saKpiGrid}>
            {/*
              Counted from the live lists, never the design's figures: the
              236 / 182 / 24 / 17 the mock-up shows were sample data. "Pending
              Reviews" has no source at all (there is no pending state in the
              pricing schema), so it keeps the dash — see
              PricingHomeKpisView.pendingPriceUpdates.
            */}
            <OverviewDashboardCard
              value={kpiValueText(kpis.activeFairPrices)}
              title={t('pricingCeiling.sa.kpiActiveCeilings')}
              subtitle={t('pricingCeiling.sa.subActiveCeilings')}
              icon="market"
              preserveCase
            />
            <OverviewDashboardCard
              value={kpiValueText(kpis.retailPriceRecords)}
              title={t('pricingCeiling.sa.kpiRetailPrices')}
              subtitle={t('pricingCeiling.sa.subRetailPrices')}
              icon="card"
              preserveCase
            />
            <OverviewDashboardCard
              value={kpiValueText(kpis.pendingPriceUpdates)}
              title={t('pricingCeiling.sa.kpiPendingReviews')}
              subtitle={t('pricingCeiling.sa.subPendingReviews')}
              icon="clipboard"
              tone="warning"
              preserveCase
            />
            <OverviewDashboardCard
              value={kpiValueText(kpis.recentChanges7d)}
              title={t('pricingCeiling.sa.kpiRecentChanges')}
              subtitle={t('pricingCeiling.sa.subRecentChanges')}
              icon="history"
              preserveCase
            />
          </OverviewCardsGrid>

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

          {/*
            The design's three cards (Tomato ₹140 from ₹130, "↑ +7.7%", …)
            were sample data: every figure in them was invented, including the
            deltas. What the server can actually supply in one request is the
            ceiling windows in force (GET /fair-prices), so the rows here are
            the ones that came into force inside the look-back period, newest
            first. The previous price and the delta stay the dash — see
            SaRecentChangesSection for why they are not computable here.
          */}
          <SaRecentChangesSection rows={recentChanges} isLoading={kpisLoading} error={kpisError} />

          {/* Section: Quick Actions */}
          <View style={styles.saQuickHeaderRow}>
            <Text style={styles.saSectionHeading}>{t('pricingCeiling.home.quick.title')}</Text>
          </View>
          <View style={styles.saQuickGrid}>
            <OverviewActionCard
              title={t('pricingCeiling.sa.fairPrices')}
              icon={<FairPriceIcon size={22} color={adminColors.brand} />}
              onPress={onNavigateToFairPrice}
              style={styles.saQuickCard}
              accessibilityLabel={t('pricingCeiling.sa.fairPrices')}
              testID="pricingHome.quick.fairPrices"
            />

            <OverviewActionCard
              title={t('pricingCeiling.sa.manageRetail')}
              icon={<RetailPricingIcon size={22} color={adminColors.brand} />}
              onPress={onNavigateToRetailPricing}
              style={styles.saQuickCard}
              accessibilityLabel={t('pricingCeiling.sa.manageRetail')}
              testID="pricingHome.quick.retail"
            />

            <OverviewActionCard
              title={t('pricingCeiling.sa.priceHistoryCounterOffer')}
              icon={<PriceHistoryCounterOfferIcon size={22} color={adminColors.brand} />}
              onPress={onNavigateToPriceHistory}
              style={styles.saQuickCardFull}
              accessibilityLabel={t('pricingCeiling.sa.priceHistoryCounterOffer')}
              testID="pricingHome.quick.history"
            />
          </View>

          <View style={{ height: adminSpacing.xxxl }} />
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
          {/*
            Two of the four can be counted from the live lists; Product
            Categories has no backend (owner decision D6) and Price Updates
            would need a per-crop history call, so both keep the dash.
          */}
          <OverviewDashboardCard
            value={kpiValueText(kpis.activeFairPrices)}
            title={t('pricingCeiling.fa.kpiActiveFairPrices')}
            icon="sales"
            onPress={onNavigateToFairPrice}
          />
          <OverviewDashboardCard
            value={kpiValueText(kpis.productCategories)}
            title={t('pricingCeiling.fa.kpiProductCategories')}
            icon="inventory"
            onPress={onNavigateToCategories}
          />
          <OverviewDashboardCard
            value={kpiValueText(kpis.priceUpdates)}
            title={t('pricingCeiling.fa.kpiPriceUpdates')}
            icon="orders"
            onPress={onNavigateToPriceHistory}
          />
          <OverviewDashboardCard
            value={kpiValueText(kpis.retailPriceRecords)}
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
          <HomeKpiGrid access={access} navigate={navigate} kpis={kpis} />
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
