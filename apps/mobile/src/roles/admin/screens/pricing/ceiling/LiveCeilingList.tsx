/**
 * The data side of the fair price ceiling list. Mounted only for a caller
 * holding pricing.fair_price.view (FairPriceCeilingScreen decides), so
 * without it no request is made; the hook is also told `enabled: true`
 * explicitly so the gate is visible here.
 *
 * GET /fair-prices with grade / effectiveOn (the API's filters), cursor paged
 * ("Load more"), pull to refresh. The API has no text search, so the search
 * box narrows the loaded rows. Loading / error / empty use the shared admin
 * states, picked by queryViewState (as the farmers list does).
 */
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useFairPriceList } from '../../../api/pricingHooks';
import type { FairPriceRowView } from '../../../api/pricingTypes';
import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { queryViewState } from '../../warehouse/shared/queryViewState';
import { CeilingCard, CeilingDetailsSheet } from './CeilingCards';
import { PricingFilterSheet } from './PricingFilterSheet';
import { PricingFrame, type PricingFrameProps } from './PricingFrame';
import {
  filterCeilingRows,
  GRADE_ALL,
  INITIAL_CEILING_FILTERS,
  toCropSelection,
  toFairListFilters,
  type CeilingFilterState,
  type PricingCropSelection,
} from './pricingLogic';
import { LoadMoreLink, PricingSearchBar } from './PricingParts';
import { styles } from './pricingStyles';

export interface LiveCeilingListProps {
  frame: Pick<PricingFrameProps, 'title' | 'subtitle' | 'onBack'>;
  warehouseId: string | undefined;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  filters: CeilingFilterState;
  onFiltersChange: (filters: CeilingFilterState) => void;
  onNavigateToHistory?: ((crop: PricingCropSelection) => void) | undefined;
  onNavigateToRetailPricing?: (() => void) | undefined;
}

export function LiveCeilingList({
  frame,
  warehouseId,
  searchText,
  onSearchTextChange,
  filters,
  onFiltersChange,
  onNavigateToHistory,
  onNavigateToRetailPricing,
}: LiveCeilingListProps) {
  const listFilters = useMemo(() => toFairListFilters(filters), [filters]);
  const list = useFairPriceList(warehouseId, listFilters, { enabled: true });
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<FairPriceRowView | null>(null);

  const filtering = filters.grade !== GRADE_ALL || listFilters.effectiveOn !== undefined;
  const shown = filterCeilingRows(list.items, searchText);
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });

  const openHistory = (row: FairPriceRowView) => {
    if (onNavigateToHistory) onNavigateToHistory(toCropSelection(row));
    else setSelected(row);
  };

  return (
    <PricingFrame
      {...frame}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      overlay={
        <>
          <CeilingDetailsSheet row={selected} onClose={() => setSelected(null)} />
          <PricingFilterSheet
            visible={filterOpen}
            applied={filters}
            showDate
            unavailableFields={[t('pricingCeiling.filter.category'), t('pricingCeiling.filter.records')]}
            onApply={(next) => {
              onFiltersChange(next);
              setFilterOpen(false);
            }}
            onReset={() => {
              onFiltersChange(INITIAL_CEILING_FILTERS);
              setFilterOpen(false);
            }}
            onClose={() => setFilterOpen(false)}
          />
        </>
      }
    >
      <PricingSearchBar
        value={searchText}
        onChangeText={onSearchTextChange}
        placeholder={t('pricingCeiling.ceiling.searchPlaceholder')}
        testID="pricingCeiling.search"
        onFilterPress={() => setFilterOpen(true)}
        filterTestID="pricingCeiling.filterButton"
      />

      {view === 'loading' ? <AdminLoadingState /> : null}
      {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
      {view === 'empty' ? (
        <AdminEmptyState title={t(filtering ? 'pricingCeiling.ceiling.emptyFiltered' : 'pricingCeiling.ceiling.empty')} />
      ) : null}
      {view === 'ready' ? (
        <View>
          <Text style={styles.recordCountText}>{t('pricingCeiling.ceiling.count', { count: shown.length })}</Text>
          {shown.length === 0 ? <AdminEmptyState title={t('pricingCeiling.ceiling.emptySearch')} /> : null}
          {shown.map((row) => (
            <CeilingCard key={row.id} row={row} onView={setSelected} onHistory={openHistory} onRetail={onNavigateToRetailPricing} />
          ))}
          {list.hasMore ? <LoadMoreLink onPress={list.loadMore} testID="pricingCeiling.loadMore" /> : null}
        </View>
      ) : null}
    </PricingFrame>
  );
}
