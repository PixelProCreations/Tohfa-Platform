/**
 * Market & Pricing home (Module 7, phase 2A): ONE view-only layout for every
 * admin who may read prices (owner decision), replacing the design's
 * `role === 'TOHFA_ADMIN'` switch between a Tohfa and a Farmer Admin layout.
 * Base = the design's Tohfa layout; the FA layout's Recently Updated Prices
 * and View History are added. Each section shows only for its read code
 * (./pricingHomeLogic.ts); with neither code, a neutral not-available state
 * and no request.
 *
 * Removed (owner decision): Dev's "Market Day Schedule" and "Listing Approval
 * Queue" rows (listing approval becomes its own module) and every Update /
 * Bulk action. The old host props for those rows are accepted, never called.
 */
import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { adminColors } from '../../../theme';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { PricingFrame } from '../ceiling/PricingFrame';
import { BellIcon, PriceTagHeaderIcon } from '../ceiling/PricingIcons';
import { pricingAccess } from '../ceiling/pricingLogic';
import { HomeAlertsSection, HomeKpiGrid, HomeQuickActions, HomeRecentSection, LiveOverviewSection, type HomeNavigate } from './HomeSections';
import { homeSections } from './pricingHomeLogic';
import { homeStyles } from './pricingHomeStyles';

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
  /** Legacy (Dev host mounts): the Market Day row is removed; accepted, never called. */
  onNavigateToMarketDay?: (() => void) | undefined;
  /** Legacy: the Listing Approval row is removed; accepted, never called. */
  onNavigateToListingApproval?: (() => void) | undefined;
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
}: MarketPricingHomeScreenProps) {
  const access = pricingAccess(can);
  const sections = homeSections(access);
  const navigate: HomeNavigate = {
    fairPrice: onNavigateToFairPrice,
    retail: onNavigateToRetailPricing,
    categories: onNavigateToCategories,
    history: onNavigateToPriceHistory,
  };

  const showBell = can != null && can('notification.own.view');
  const bell = showBell ? (
    <TouchableOpacity
      style={homeStyles.notificationBtn}
      onPress={onOpenNotifications ?? (() => Alert.alert(t('pricingCeiling.home.notAvailable.title'), t('pricingCeiling.home.notAvailable.body')))}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('pricingCeiling.home.notifications')}
      testID="pricingHome.notifications"
    >
      <BellIcon />
    </TouchableOpacity>
  ) : null;

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
