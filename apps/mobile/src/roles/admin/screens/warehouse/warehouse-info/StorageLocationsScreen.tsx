/**
 * Storage locations — `GET /warehouses/{id}/storage-locations`
 * (`inventory.batch.view`, SUB_WH_ADMIN `own`, BR-30/BR-79), read-only.
 *
 * OFFSET paged (`StorageLocationList`: page / pageSize / total), so it uses
 * useOffsetList rather than the cursor hook. Filter: the API's `isActive`
 * only. HIDDEN — create/edit/(de)activate: `warehouse.storage_location.manage`
 * is `none` for SUB_WH_ADMIN, and the designed screens are read-only for it.
 * `capacityKg` here is display-only per location (no stock is checked
 * against it); `inventory_batches.storage_location` is not linked to these
 * rows, so no stock-per-location figure is shown.
 */
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@tohfa/mobile-ui';
import { useOffsetList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listStorageLocations } from '../../../api/warehouseInfo';
import { t } from '../../../i18n';
import { formatGramsAsKg } from '../../../money/quantity';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { AsyncStates } from '../shared/AsyncStates';
import { FilterChips } from '../shared/FilterChips';
import { ListFooter } from '../shared/ListFooter';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { STORAGE_ACTIVE_FILTERS, toStorageLocationRow, type StorageLocationRow } from './mappers';

const RESOURCE = 'storageLocations';
const { colors, spacing, typography, weights, radius } = adminTheme;

function filterKey(value: boolean | undefined): string {
  return value === undefined ? 'all' : String(value);
}

function filterLabel(value: boolean | undefined): string {
  if (value === undefined) return t('admin.common.all');
  return t(value ? 'admin.warehouseInfo.storage.active' : 'admin.warehouseInfo.storage.inactive');
}

export function StorageLocationsScreen(props: { warehouseId: string; onBack: () => void }): React.JSX.Element {
  const { scope } = useAdminSession();
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const list = useOffsetList<StorageLocationRow>(
    adminKeys.list(scope.warehouseId, RESOURCE, { isActive }),
    async (page, signal) => {
      const res = await listStorageLocations(props.warehouseId, { isActive, page }, signal);
      return { ...res, items: res.items.map(toStorageLocationRow) };
    },
  );
  const state = queryViewState({
    isPending: list.isPending,
    isError: list.isError,
    data: list.data === undefined ? undefined : list.items,
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title={t('admin.warehouseInfo.storage.title')}
        subtitle={scope.warehouseName}
        onBack={props.onBack}
      />
      <FilterChips<boolean | undefined>
        accessibilityLabel={t('admin.warehouseInfo.storage.filterLabel')}
        options={STORAGE_ACTIVE_FILTERS.map((v) => ({ key: filterKey(v), value: v, label: filterLabel(v) }))}
        selectedKey={filterKey(isActive)}
        onSelect={setIsActive}
      />
      <AsyncStates
        state={state}
        error={list.error}
        onRetry={list.refresh}
        emptyTitleKey="admin.warehouseInfo.storage.emptyTitle"
        emptyMessageKey="admin.warehouseInfo.storage.emptyMessage"
      >
        <FlatList
          data={list.items}
          keyExtractor={(row) => row.id}
          renderItem={({ item }) => <LocationCard row={item} />}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefreshing}
              onRefresh={list.refresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={list.isFetchNextPageError ? undefined : list.loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter
              isLoadingMore={list.isLoadingMore}
              loadMoreFailed={list.isFetchNextPageError}
              hasMore={list.hasMore}
              shown={list.items.length}
              onLoadMore={list.loadMore}
            />
          }
        />
      </AsyncStates>
    </View>
  );
}

function LocationCard(props: { row: StorageLocationRow }): React.JSX.Element {
  const { row } = props;
  const status = t(row.status.labelKey);
  return (
    <View
      accessible
      accessibilityLabel={t('admin.warehouseInfo.storage.rowA11y', { code: row.code, name: row.name, status })}
      style={[
        styles.card,
        {
          padding: spacing.lg,
          gap: spacing.xs,
          borderRadius: radius.card,
          borderColor: colors.border,
          backgroundColor: colors.white,
        },
      ]}
    >
      <View style={[styles.rowBetween, { gap: spacing.sm }]}>
        <Text
          numberOfLines={1}
          style={[styles.flex, { color: colors.onSurface, fontSize: typography.body, fontWeight: weights.semibold }]}
        >
          {t('admin.warehouseInfo.storage.rowTitle', { code: row.code, name: row.name })}
        </Text>
        <Badge label={status} variant={row.status.tone} />
      </View>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
        {row.locationType ?? t('admin.warehouseInfo.storage.typeNotSet')}
      </Text>
      {row.capacityGrams === null ? null : (
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.warehouseInfo.storage.capacity', { qty: formatGramsAsKg(row.capacityGrams) })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
