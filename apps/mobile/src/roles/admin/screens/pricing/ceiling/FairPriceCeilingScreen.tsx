/**
 * Fair Price Ceilings — multi-role governance screen.
 *
 * RBAC capabilities (docs/rbac.json):
 *   - pricing.fair_price.set (Super Admin only): renders full Super Admin layout
 *     with 3 KPI cards (Total Ceilings, Active, Upcoming), search & 3 filter
 *     dropdowns, multi-grade crop ceiling cards (Grade 1 | Grade 2 | Grade 3),
 *     frequency pills (Weekly / Daily), and sticky bottom bar '+ Set Fair Price Ceiling'.
 *   - farmer.farm.view (Farmer Admin): renders Farmer Admin layout with
 *     banner header, subtitle, search bar, and 3-column crop cards (Ceiling | Frequency | Date).
 *   - pricing.fair_price.view (Tohfa Admin / Warehouse): renders LiveCeilingList
 *     wired to GET /admin/fair-prices with full filtering, status badges, and details sheet.
 *
 * Unbacked figures render em-dash '—' per root CLAUDE.md instructions.
 */
import React, { useState } from 'react';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import { LiveCeilingList } from './LiveCeilingList';
import { PricingFrame } from './PricingFrame';
import { INITIAL_CEILING_FILTERS, pricingAccess, type CeilingFilterState, type PricingCropSelection } from './pricingLogic';

/** The price item shape the hosts' callbacks are typed with. */
export interface LegacyPriceItem {
  name?: string | undefined;
  cropName?: string | undefined;
  category?: string | undefined;
  price?: number | undefined;
  change?: number | undefined;
  lastUpdate?: string | undefined;
}

export interface FairPriceCeilingScreenProps {
  onBack?: (() => void) | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only. */
  warehouseId?: string | undefined;
  /** A row's History: open the price history for that crop and grade. */
  onNavigateToHistory?: ((crop: PricingCropSelection) => void) | undefined;
  /** "Retail Price Management" on a row; shown only with pricing.retail_price.view. */
  onNavigateToRetailPricing?: (() => void) | undefined;
  /** Set/Update Fair Price ceiling action. */
  onUpdatePrice?: ((item: LegacyPriceItem) => void) | undefined;
  /** Bulk update fair price ceilings action. */
  onBulkUpdate?: (() => void) | undefined;
  /** View ceiling history action. */
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
