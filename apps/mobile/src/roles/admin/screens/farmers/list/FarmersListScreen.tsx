/**
 * Farmers list (Module 1 "Farmers Management", phase 2B): the team design's
 * Farmers | Applications screen (origin/tofhafarmfin-rbac
 * AdminAllFarmersScreen.tsx) on Dev's structure, wired to the live API.
 *
 * Access is by permission code only, fail-closed (./farmersListLogic.ts):
 *   - no `can`, or no farmer.profile.view_all: a neutral not-available state,
 *     and LiveFarmersList (the only place that fetches) is not mounted;
 *   - the Applications tab, its content and the Pending KPI shortcut need
 *     farmer.application.list_pending as well. An initialTab='applications'
 *     for a caller without it draws the farmers tab: the content is gated,
 *     not just the toggle.
 * There is no role prop and no client-side scoping: the server returns what
 * the caller may see (BR-108a).
 */
import React, { useEffect, useState } from 'react';
import type { ApplicationRowView, FarmerRowView } from '../../../api/farmerTypes';
import { t } from '../../../i18n';
import type { Can } from '../../../permissions/can';
import { AdminEmptyState } from '../../warehouse/shared/AsyncStates';
import type { FarmersFilterValues } from './FarmersFilterModal';
import { FarmersListLayout } from './FarmersListLayout';
import {
  farmersListAccess,
  INITIAL_FILTERS,
  resolveMainTab,
  SEARCH_DEBOUNCE_MS,
  toLegacyFarmerListItem,
  type FarmersMainTab,
} from './farmersListLogic';
import type { FarmersListNavTab } from './FarmersListParts';
import type { FarmerListItem } from './legacyFarmerListItem';
import { LiveFarmersList } from './LiveFarmersList';

export interface AdminAllFarmersScreenProps {
  /** Header title; defaults to "Farmer Management". */
  title?: string | undefined;
  onBack?: (() => void) | undefined;
  /**
   * A farmer card was tapped. The first argument is the legacy shape the
   * existing hosts store (real id, no invented fields); the second is the
   * live row, which new hosts should use.
   */
  onSelectFarmer?: ((farmer: FarmerListItem, row: FarmerRowView) => void) | undefined;
  /** An application card was tapped (open the review screen with its id). */
  onReviewApplication?: ((application: ApplicationRowView) => void) | undefined;
  onNavigateTab?: ((tab: FarmersListNavTab) => void) | undefined;
  /** The design's bottom navigation; off by default, as in the design. */
  showBottomNav?: boolean | undefined;
  initialTab?: FarmersMainTab | undefined;
  /** Permission check from /auth/me. Missing means nothing is permitted. */
  can?: Can | undefined;
  /** The caller's warehouse, for the query cache key only (BR-30). */
  warehouseId?: string | undefined;
}

export function FarmersListScreen({
  title,
  onBack,
  onSelectFarmer,
  onReviewApplication,
  onNavigateTab,
  showBottomNav = false,
  initialTab,
  can,
  warehouseId,
}: AdminAllFarmersScreenProps) {
  const access = farmersListAccess(can);
  const [requestedTab, setRequestedTab] = useState<FarmersMainTab>(initialTab ?? 'farmers');
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<FarmersFilterValues>(INITIAL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  // A host that changes initialTab (e.g. a "pending applications" shortcut) moves the screen to it.
  useEffect(() => {
    if (initialTab !== undefined) setRequestedTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText]);

  const layout = {
    title: title ?? t('farmersList.header.title'),
    onBack,
    showBottomNav,
    onNavigateTab,
  };

  if (!access.canViewFarmers) {
    return (
      <FarmersListLayout {...layout}>
        <AdminEmptyState title={t('farmersList.notAvailable.title')} subtitle={t('farmersList.notAvailable.subtitle')} />
      </FarmersListLayout>
    );
  }

  return (
    <LiveFarmersList
      access={access}
      warehouseId={warehouseId}
      activeTab={resolveMainTab(requestedTab, access)}
      onTabChange={setRequestedTab}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      debouncedSearch={debouncedSearch}
      filters={filters}
      onFiltersChange={setFilters}
      filterOpen={filterOpen}
      onFilterOpenChange={setFilterOpen}
      onSelectFarmer={onSelectFarmer ? (row) => onSelectFarmer(toLegacyFarmerListItem(row), row) : undefined}
      onReviewApplication={onReviewApplication}
      layout={layout}
    />
  );
}
