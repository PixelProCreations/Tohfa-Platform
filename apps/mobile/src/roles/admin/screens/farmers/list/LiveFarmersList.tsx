/**
 * The data side of the farmers list. Mounted only for a caller holding
 * farmer.profile.view_all (FarmersListScreen decides), so without it no
 * request is ever made. useFarmerList has no `enabled` option, which is why
 * the gate is "do not mount" rather than a flag.
 *
 * Farmers: GET /admin/farmers with q / status / zoneId / ratingTier, cursor
 * paged ("Load more"), pull to refresh. The server returns exactly the
 * farmers the caller may see (BR-108a); the rows are drawn as they come.
 *
 * Applications: GET /admin/farmer-applications, fetched only while the tab is
 * open and only for a caller holding farmer.application.list_pending. The API
 * takes no search, so the box filters the loaded rows.
 *
 * Loading / error / empty use the warehouse screens' shared states
 * (screens/warehouse/shared), picked by queryViewState.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useApplicationList, useFarmerList } from '../../../api/farmerHooks';
import type { ApplicationRowView, FarmerRowView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../warehouse/shared/AsyncStates';
import { queryViewState } from '../../warehouse/shared/queryViewState';
import { ApplicationCard, FarmerCard } from './FarmersListCards';
import { FarmersFilterModal, type FarmersFilterValues } from './FarmersFilterModal';
import { FarmersListLayout, type FarmersListLayoutProps } from './FarmersListLayout';
import {
  ALL,
  FARMER_SEARCH_MAX,
  filterApplications,
  mergeZoneOptions,
  toFarmerListFilters,
  type FarmersListAccess,
  type FarmersMainTab,
  type ZoneOption,
} from './farmersListLogic';
import { FarmersKpiRow, FarmersSearchBar, FarmersTabToggle, LoadMoreLink } from './FarmersListParts';
import { styles } from './farmersListStyles';

export interface LiveFarmersListProps {
  access: FarmersListAccess;
  /** Keys the cache only (BR-30); no farmers request sends it. */
  warehouseId: string | undefined;
  activeTab: FarmersMainTab;
  onTabChange: (tab: FarmersMainTab) => void;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  /** The debounced search text the farmers request sends as `q`. */
  debouncedSearch: string;
  filters: FarmersFilterValues;
  onFiltersChange: (filters: FarmersFilterValues) => void;
  filterOpen: boolean;
  onFilterOpenChange: (open: boolean) => void;
  onSelectFarmer?: ((farmer: FarmerRowView) => void) | undefined;
  onReviewApplication?: ((application: ApplicationRowView) => void) | undefined;
  layout: Pick<FarmersListLayoutProps, 'title' | 'onBack' | 'showBottomNav' | 'onNavigateTab'>;
}

export function LiveFarmersList({
  access,
  warehouseId,
  activeTab,
  onTabChange,
  searchText,
  onSearchTextChange,
  debouncedSearch,
  filters,
  onFiltersChange,
  filterOpen,
  onFilterOpenChange,
  onSelectFarmer,
  onReviewApplication,
  layout,
}: LiveFarmersListProps) {
  const listFilters = useMemo(
    () => toFarmerListFilters({ ...filters, q: debouncedSearch }),
    [filters, debouncedSearch],
  );
  const farmers = useFarmerList(warehouseId, listFilters);
  const applications = useApplicationList(warehouseId, {}, { enabled: access.canViewApplications && activeTab === 'applications' });

  // Zone chips: every zone seen in the loaded rows so far (no zones endpoint).
  const [zones, setZones] = useState<readonly ZoneOption[]>([]);
  useEffect(() => {
    setZones((previous) => mergeZoneOptions(previous, farmers.items));
  }, [farmers.items]);

  const onFarmersTab = activeTab === 'farmers';
  const current = onFarmersTab ? farmers : applications;
  const filtering = listFilters.q !== undefined || filters.status !== ALL || filters.zoneId !== ALL || filters.tier !== ALL;

  return (
    <FarmersListLayout
      {...layout}
      onFilterPress={onFarmersTab ? () => onFilterOpenChange(true) : undefined}
      onRefresh={current.refresh}
      isRefreshing={current.isRefreshing}
      overlay={
        <FarmersFilterModal
          visible={filterOpen}
          values={filters}
          zones={zones}
          onChange={onFiltersChange}
          onClose={() => onFilterOpenChange(false)}
        />
      }
    >
      <FarmersKpiRow onPendingPress={access.canViewApplications ? () => onTabChange('applications') : undefined} />
      {access.canViewApplications ? <FarmersTabToggle active={activeTab} onChange={onTabChange} /> : null}
      <FarmersSearchBar
        value={searchText}
        onChangeText={onSearchTextChange}
        placeholder={t(onFarmersTab ? 'farmersList.search.farmersPlaceholder' : 'farmersList.search.applicationsPlaceholder')}
        maxLength={onFarmersTab ? FARMER_SEARCH_MAX : undefined}
      />
      {onFarmersTab ? (
        <FarmersBody list={farmers} filtering={filtering} onSelectFarmer={onSelectFarmer} />
      ) : (
        <ApplicationsBody list={applications} searchText={searchText} onReviewApplication={onReviewApplication} />
      )}
    </FarmersListLayout>
  );
}

interface ListState<T> {
  items: T[];
  isLoading: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
}

function FarmersBody({
  list,
  filtering,
  onSelectFarmer,
}: {
  list: ListState<FarmerRowView>;
  filtering: boolean;
  onSelectFarmer?: ((farmer: FarmerRowView) => void) | undefined;
}) {
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  if (view === 'loading') return <AdminLoadingState />;
  if (view === 'error') return <AdminErrorState error={list.error} onRetry={list.refresh} />;
  if (view === 'empty') return <AdminEmptyState title={t(filtering ? 'farmersList.empty.farmersFiltered' : 'farmersList.empty.farmers')} />;
  return (
    <View style={styles.cardsList}>
      {list.items.map((farmer) => (
        <FarmerCard key={farmer.id} farmer={farmer} onPress={onSelectFarmer} />
      ))}
      {list.hasMore ? <LoadMoreLink onPress={list.loadMore} /> : null}
    </View>
  );
}

function ApplicationsBody({
  list,
  searchText,
  onReviewApplication,
}: {
  list: ListState<ApplicationRowView>;
  searchText: string;
  onReviewApplication?: ((application: ApplicationRowView) => void) | undefined;
}) {
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  if (view === 'loading') return <AdminLoadingState />;
  if (view === 'error') return <AdminErrorState error={list.error} onRetry={list.refresh} />;
  if (view === 'empty') return <AdminEmptyState title={t('farmersList.empty.applications')} />;
  const shown = filterApplications(list.items, searchText);
  return (
    <View>
      <Text style={styles.countText}>{t('farmersList.applications.count', { count: shown.length })}</Text>
      <View style={styles.cardsList}>
        {shown.length === 0 ? <AdminEmptyState title={t('farmersList.empty.applicationsSearch')} /> : null}
        {shown.map((application) => (
          <ApplicationCard key={application.id} application={application} onPress={onReviewApplication} />
        ))}
        {list.hasMore ? <LoadMoreLink onPress={list.loadMore} /> : null}
      </View>
    </View>
  );
}
