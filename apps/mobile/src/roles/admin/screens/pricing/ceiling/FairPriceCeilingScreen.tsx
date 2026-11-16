/**
 * Fair price ceilings (Market & Pricing, phase 2A): the team design's
 * FairPriceCeilingScreen (origin/tofhafarmfin-rbac) on Dev's structure, wired
 * to GET /fair-prices through useFairPriceList.
 *
 * View-only for every admin (owner decision: only Super Admin sets prices, on
 * screens still being designed). There is no Update / Bulk / edit action; the
 * old host props onUpdatePrice / onBulkUpdate / onViewHistory are accepted so
 * existing mounts compile, and are never called.
 *
 * Access is by permission code only, fail-closed: no `can`, or no
 * pricing.fair_price.view, draws a neutral not-available state and
 * LiveCeilingList (the only place that fetches) is not mounted.
 */
import React, { useState } from 'react';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { LiveCeilingList } from './LiveCeilingList';
import { PricingFrame } from './PricingFrame';
import { INITIAL_CEILING_FILTERS, pricingAccess, type CeilingFilterState, type PricingCropSelection } from './pricingLogic';

/** The price item shape the existing hosts' callbacks are typed with (legacy; never produced). */
export interface LegacyPriceItem {
  name: string;
  category: string;
  price: number;
  change?: number;
  lastUpdate: string;
}

export interface FairPriceCeilingScreenProps {
  onBack?: (() => void) | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only. */
  warehouseId?: string | undefined;
  /** A row's History: open the price history for that crop and grade. Without it, History opens the details sheet. */
  onNavigateToHistory?: ((crop: PricingCropSelection) => void) | undefined;
  /** "Retail Price Management" on a row; shown only with pricing.retail_price.view. */
  onNavigateToRetailPricing?: (() => void) | undefined;
  /** Legacy (Dev host mounts): accepted, never called. The ceiling is view-only here. */
  onUpdatePrice?: ((item: LegacyPriceItem) => void) | undefined;
  /** Legacy: accepted, never called. */
  onBulkUpdate?: (() => void) | undefined;
  /** Legacy: accepted, never called (it took a fixture item); use onNavigateToHistory. */
  onViewHistory?: ((item: LegacyPriceItem) => void) | undefined;
}

export function FairPriceCeilingScreen({ onBack, can, warehouseId, onNavigateToHistory, onNavigateToRetailPricing }: FairPriceCeilingScreenProps) {
  const access = pricingAccess(can);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<CeilingFilterState>(INITIAL_CEILING_FILTERS);

  const frame = {
    title: can && can('pricing.retail_price.set')
      ? t('pricingCeiling.ceiling.titleManagement')
      : t('pricingCeiling.ceiling.title'),
    subtitle: t('pricingCeiling.ceiling.subtitle'),
    onBack,
  };

  if (!access.canViewFair) {
    return (
      <PricingFrame {...frame}>
        <AdminEmptyState title={t('pricingCeiling.notAvailable.title')} subtitle={t('pricingCeiling.notAvailable.subtitle')} />
      </PricingFrame>
    );
  }

  return (
    <LiveCeilingList
      frame={frame}
      warehouseId={warehouseId}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      filters={filters}
      onFiltersChange={setFilters}
      onNavigateToHistory={onNavigateToHistory}
      onNavigateToRetailPricing={access.canViewRetail ? onNavigateToRetailPricing : undefined}
    />
  );
}
