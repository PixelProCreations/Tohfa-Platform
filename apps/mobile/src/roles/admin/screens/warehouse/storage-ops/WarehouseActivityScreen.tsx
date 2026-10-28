import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  EmptyState,
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  ACTIVITY_CHIPS,
  activityChipLabel,
  filterActivityRows,
  type ActivityChip,
  type ActivityRow,
} from './mappers_activity';
import type { ActivityCategory, ActivityModule, ActivityPreset, WarehouseScreenBaseProps } from './types';
import { useActivityFeed } from './useActivityFeed';

export const ACTIVITY_STATUS_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  Completed: 'success',
  Pending: 'warning',
  Open: 'danger',
};

export function ActivityCategoryIcon(_props?: { category?: ActivityCategory; size?: number }) {
  return null;
}

export interface WarehouseActivityScreenProps extends WarehouseScreenBaseProps {
  /** Today = the IST day (Today's Operations); All / undefined = the whole feed. */
  initialPreset?: ActivityPreset | undefined;
  /** The tapped row itself: the API has no detail route, so the detail shows the row it was given. */
  onSelectActivity: (activity: ActivityRow) => void;
  onOpenModule?: ((module: ActivityModule) => void) | undefined;
  onExport?: (() => void) | undefined;
}

/**
 * Warehouse Activity (D03) on GET /warehouses/{id}/activity (BR-104, gated by
 * warehouse.activity.view). Main (all warehouses) merges every live
 * warehouse's newest page, or reads the one picked in the selector; a Sub
 * scope reads its own warehouse only (BR-30). The chips are the API's event
 * types; the search filters the loaded rows. Decisions: ./mappers_activity.ts.
 */
export function WarehouseActivityScreen({
  scope,
  can,
  onBack,
  initialPreset,
  onSelectActivity,
  onOpenModule: _onOpenModule,
  onExport: _onExport,
}: WarehouseActivityScreenProps) {
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<ActivityChip>('all');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  // One clock per visit: the Today range and the "Today · 10:42 AM" labels agree.
  const now = useMemo(() => new Date(), []);

  const feed = useActivityFeed(scope, can, initialPreset, chip, selectedWarehouseId, now);
  const view = queryViewState({ isLoading: feed.isLoading, error: feed.error, itemCount: feed.rows.length });
  const visible = useMemo(() => filterActivityRows(feed.rows, query), [feed.rows, query]);
  const warehouseOptions = useMemo(
    () => feed.warehouses.map((w) => ({ warehouseId: w.id, warehouseName: w.name })),
    [feed.warehouses],
  );

  return (
    <WalletScreen
      title={t('storageOps.activity.title')}
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={scope.warehouseName}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={t('storageOps.activity.search')} />
        </View>

        <View style={styles.chipsContainer}>
          <ChipGroup options={ACTIVITY_CHIPS} value={chip} onChange={setChip} labelOf={activityChipLabel} />
        </View>

        {!feed.canView ? (
          <EmptyState title={t('storageOps.activity.notAvailable.title')} subtitle={t('storageOps.activity.notAvailable.subtitle')} />
        ) : view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={feed.error} onRetry={feed.retry} />
        ) : visible.length === 0 ? (
          <EmptyState title={t('storageOps.activity.empty')} subtitle={t('storageOps.activity.emptyHint')} />
        ) : (
          visible.map((act) => (
            <TouchableOpacity
              key={act.key}
              style={styles.card}
              onPress={() => onSelectActivity(act)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`${act.title} ${act.subtitle}`}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{act.title}</Text>
                {act.status ? <StatusBadge label={act.status.label} tone={act.status.tone} /> : null}
              </View>
              <Text style={styles.cardSubtitle}>{act.subtitle}</Text>
              <Text style={styles.cardTime}>{act.time}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  chipsContainer: {
    marginBottom: adminSpacing.lg,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  cardSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  cardTime: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
});
