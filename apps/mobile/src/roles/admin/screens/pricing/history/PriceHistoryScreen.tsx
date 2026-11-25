/**
 * Price history & counter-offers (Market & Pricing, phase 2A): the team
 * design's PriceHistoryScreen (Tohfa layout) on Dev's structure, wired to
 * GET /fair-prices/history through useFairPriceHistory.
 *
 * The API keeps history per crop only (cropId is required; there is no
 * cross-crop list). So the screen needs a `crop`, handed over by a ceiling
 * row's History action. Opened without one (the existing host mounts), it
 * shows a neutral "pick a crop" state and never mounts the history hook; the
 * old itemName / category / currentPrice props are accepted and ignored
 * (they were fixture values, never a crop id).
 *
 * Access is by permission code only, fail-closed: no `can`, or no
 * pricing.fair_price.view, draws the not-available state with no request.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { PricingFrame } from '../ceiling/PricingFrame';
import { pricingAccess, type PricingCropSelection } from '../ceiling/pricingLogic';
import { styles } from '../ceiling/pricingStyles';
import { CounterOffersSection } from './HistoryCards';
import { LiveHistoryList } from './LiveHistoryList';

export interface PriceHistoryScreenProps {
  onBack?: (() => void) | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only. */
  warehouseId?: string | undefined;
  /** The crop (and grade) whose ceiling history to show; from FairPriceCeilingScreen's onNavigateToHistory. */
  crop?: PricingCropSelection | undefined;
  /** Legacy (Dev host mounts): accepted, ignored. */
  itemName?: string | undefined;
  /** Legacy: accepted, ignored. */
  category?: string | undefined;
  /** Legacy: accepted, ignored. */
  currentPrice?: number | undefined;
}

export function PriceHistoryScreen({ onBack, can, warehouseId, crop }: PriceHistoryScreenProps) {
  const access = pricingAccess(can);
  const [searchText, setSearchText] = useState('');
  const frame = {
    title: t('pricingCeiling.history.title'),
    subtitle: t('pricingCeiling.history.subtitle'),
    onBack,
  };

  if (!access.canViewFair) {
    return (
      <PricingFrame {...frame}>
        <AdminEmptyState title={t('pricingCeiling.notAvailable.title')} subtitle={t('pricingCeiling.notAvailable.subtitle')} />
      </PricingFrame>
    );
  }

  if (crop === undefined) {
    return (
      <PricingFrame {...frame}>
        <CounterOffersSection />
        <View style={styles.sectionSpacer}>
          <AdminEmptyState title={t('pricingCeiling.history.pickCrop.title')} subtitle={t('pricingCeiling.history.pickCrop.subtitle')} />
        </View>
      </PricingFrame>
    );
  }

  return (
    <LiveHistoryList
      frame={frame}
      warehouseId={warehouseId}
      crop={crop}
      searchText={searchText}
      onSearchTextChange={setSearchText}
    />
  );
}
