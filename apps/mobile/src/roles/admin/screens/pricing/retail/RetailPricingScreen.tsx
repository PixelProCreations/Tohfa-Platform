/**
 * Retail pricing (Market & Pricing phase 2B): the team design's
 * RetailPricingScreen (origin/tofhafarmfin-rbac) on Dev's structure, wired to
 * GET /retail-prices through useRetailPriceList.
 *
 * One shared screen for every admin role. The design had a Tohfa layout (list
 * with "Edit Retail Price" and an inline edit drawer) and a Farmer Admin
 * layout (view-only cards); the owner wants one view-only set for Tohfa,
 * Farmer Admin, Main WH and Sub WH, with every edit control gated only by
 * `can('pricing.retail_price.set')` (Super Admin only in rbac.json). There is
 * no role prop.
 *
 * Without pricing.retail_price.view (or without `can`) a neutral
 * not-available state is drawn and the list hook runs with enabled=false.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRetailPriceList } from '../../../api/pricingHooks';
import type { RetailPriceRowView } from '../../../api/pricingTypes';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { adminColors } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { queryViewState } from '../../warehouse/shared/queryViewState';
import { HorizontalSlidersIcon, SearchIcon } from './PricingIcons';
import { PricingScreenFrame } from './PricingScreenFrame';
import { RetailEditDrawer } from './RetailEditDrawer';
import { RetailFilterSheet } from './RetailFilterSheet';
import { RetailPriceCard } from './RetailPriceCard';
import {
  ALL_GRADES,
  filterRetailRows,
  INITIAL_RETAIL_FILTERS,
  retailCardView,
  retailPricingAccess,
  toRetailListFilters,
  type RetailFilterValues,
} from './retailPricingLogic';
import { frameStyles as styles } from './pricingFrameStyles';

export interface RetailPricingScreenProps {
  onBack?: (() => void) | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only. */
  warehouseId?: string | undefined;
  /** A card was tapped: open the markup breakdown for this live row. */
  onSelectBreakdown?: ((row: RetailPriceRowView) => void) | undefined;
}

export function RetailPricingScreen({ onBack, can, warehouseId, onSelectBreakdown }: RetailPricingScreenProps) {
  const access = retailPricingAccess(can);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<RetailFilterValues>(INITIAL_RETAIL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const listFilters = useMemo(() => toRetailListFilters(filters), [filters]);
  const list = useRetailPriceList(warehouseId, listFilters, { enabled: access.canViewRetail });

  // Hardware back closes an open drawer before leaving the screen.
  const onHardwareBack = useCallback(() => {
    if (editingId === null) return false;
    setEditingId(null);
    return true;
  }, [editingId]);

  const frame = {
    title: t('pricingRetail.header.title'),
    subtitle: t('pricingRetail.header.subtitle'),
    onBack,
    testIdPrefix: 'pricingRetail',
  };

  if (!access.canViewRetail) {
    return (
      <PricingScreenFrame {...frame}>
        <AdminEmptyState title={t('pricingRetail.notAvailable.title')} subtitle={t('pricingRetail.notAvailable.subtitle')} />
      </PricingScreenFrame>
    );
  }

  const shown = filterRetailRows(list.items, search);
  const filtering = search.trim() !== '' || filters.grade !== ALL_GRADES;
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const onEdit = access.canEditRetail
    ? (row: RetailPriceRowView) => setEditingId((current) => (current === row.id ? null : row.id))
    : undefined;

  return (
    <PricingScreenFrame
      {...frame}
      onHardwareBack={onHardwareBack}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      overlay={
        filterOpen ? (
          <RetailFilterSheet
            values={filters}
            onApply={(next) => {
              setFilters(next);
              setFilterOpen(false);
            }}
            onClose={() => setFilterOpen(false)}
          />
        ) : null
      }
    >
      <View style={styles.searchBarContainer}>
        <SearchIcon size={18} color={adminColors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('pricingRetail.search.placeholder')}
          placeholderTextColor={adminColors.placeholder}
          value={search}
          onChangeText={setSearch}
          testID="pricingRetail.search"
        />
        <TouchableOpacity
          style={styles.searchFilterBtn}
          onPress={() => setFilterOpen(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('pricingRetail.filter.open')}
          testID="pricingRetail.filter"
        >
          <HorizontalSlidersIcon size={18} color={adminColors.brand} />
        </TouchableOpacity>
      </View>

      {view === 'loading' ? <AdminLoadingState /> : null}
      {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
      {view === 'empty' ? <AdminEmptyState title={t(filtering ? 'pricingRetail.empty.filtered' : 'pricingRetail.empty.title')} /> : null}
      {view === 'ready' ? (
        <View>
          <Text style={styles.recordCountText}>{t('pricingRetail.list.count', { count: shown.length })}</Text>
          {shown.length === 0 ? <AdminEmptyState title={t('pricingRetail.empty.filtered')} /> : null}
          {shown.map((row) => (
            <View key={row.id}>
              <RetailPriceCard row={row} view={retailCardView(row, access)} onPress={onSelectBreakdown} onEdit={onEdit} />
              {access.canEditRetail && editingId === row.id ? (
                <RetailEditDrawer row={row} ceiling={access.canViewCeiling ? row.ceilingPrice : null} />
              ) : null}
            </View>
          ))}
          {list.hasMore ? (
            <TouchableOpacity style={styles.loadMore} onPress={list.loadMore} accessibilityRole="button" testID="pricingRetail.loadMore">
              <Text style={styles.linkText}>{t('pricingRetail.loadMore')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </PricingScreenFrame>
  );
}
