/**
 * The data side of the price history. Mounted only with a crop and for a
 * caller holding pricing.fair_price.view (PriceHistoryScreen decides), so the
 * history hook is never reached otherwise.
 *
 * GET /fair-prices/history for the crop, starting at the ceiling row's grade
 * (the Grade filter can widen it to All), newest first, cursor paged, pull to
 * refresh. previousCeiling comes from the next older LOADED window (mapper);
 * the oldest loaded one shows the dash, never a guess.
 */
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useFairPriceHistory } from '../../../api/pricingHooks';
import type { CeilingHistoryRowView } from '../../../api/pricingTypes';
import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { queryViewState } from '../../warehouse/shared/queryViewState';
import { PricingFilterSheet } from '../ceiling/PricingFilterSheet';
import { PricingFrame, type PricingFrameProps } from '../ceiling/PricingFrame';
import { filterCeilingRows, GRADE_ALL, type CeilingFilterState, type PricingCropSelection } from '../ceiling/pricingLogic';
import { HeaderFilterButton, LoadMoreLink, PricingSearchBar } from '../ceiling/PricingParts';
import { styles } from '../ceiling/pricingStyles';
import { CounterOffersSection, HistoryCard, HistoryDetailsSheet } from './HistoryCards';

export interface LiveHistoryListProps {
  frame: Pick<PricingFrameProps, 'title' | 'subtitle' | 'onBack'>;
  warehouseId: string | undefined;
  crop: PricingCropSelection;
  searchText: string;
  onSearchTextChange: (text: string) => void;
}

export function LiveHistoryList({ frame, warehouseId, crop, searchText, onSearchTextChange }: LiveHistoryListProps) {
  const initial = useMemo<CeilingFilterState>(() => ({ grade: crop.grade, inForceOn: '' }), [crop.grade]);
  const [filters, setFilters] = useState<CeilingFilterState>(initial);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<CeilingHistoryRowView | null>(null);

  const historyFilters = useMemo(() => (filters.grade === GRADE_ALL ? {} : { grade: filters.grade }), [filters.grade]);
  const list = useFairPriceHistory(warehouseId, crop.cropId, historyFilters, { enabled: true });
  const shown = filterCeilingRows(list.items, searchText);
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });

  return (
    <PricingFrame
      {...frame}
      headerRight={<HeaderFilterButton onPress={() => setFilterOpen(true)} testID="pricingHistory.filterButton" />}
      onRefresh={list.refresh}
      isRefreshing={list.isRefreshing}
      overlay={
        <>
          <HistoryDetailsSheet row={selected} onClose={() => setSelected(null)} />
          <PricingFilterSheet
            visible={filterOpen}
            applied={filters}
            showDate={false}
            unavailableFields={[t('pricingCeiling.filter.status')]}
            onApply={(next) => {
              setFilters(next);
              setFilterOpen(false);
            }}
            onReset={() => {
              setFilters(initial);
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
        placeholder={t('pricingCeiling.history.searchPlaceholder')}
        testID="pricingHistory.search"
      />

      <CounterOffersSection />

      <View style={styles.sectionSpacer}>
        <Text style={styles.sectionHeaderTitle}>{t('pricingCeiling.history.records.title', { count: shown.length })}</Text>
        {view === 'loading' ? <AdminLoadingState /> : null}
        {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
        {view === 'empty' ? <AdminEmptyState title={t('pricingCeiling.history.empty')} /> : null}
        {view === 'ready' ? (
          <View>
            {shown.length === 0 ? <AdminEmptyState title={t('pricingCeiling.history.emptySearch')} /> : null}
            {shown.map((row) => (
              <HistoryCard key={row.id} row={row} onPress={setSelected} />
            ))}
            {list.hasMore ? <LoadMoreLink onPress={list.loadMore} testID="pricingHistory.loadMore" /> : null}
          </View>
        ) : null}
      </View>
    </PricingFrame>
  );
}
