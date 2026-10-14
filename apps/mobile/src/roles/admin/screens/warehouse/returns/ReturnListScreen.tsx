/**
 * Return queue — `GET /admin/returns`, cursor-paged (rma.request.process).
 *
 * BR-30: the server confines a Sub Warehouse Admin to returns against its own
 * warehouse's orders; the client sends no warehouse id and only namespaces its
 * cache by `scope.warehouseId`. The status filter is the API's `status` query
 * param (server-side), never a client-side filter of a page.
 *
 * The API returns no customer name/mobile or product name for a return, so a
 * row shows only what it does return: order id, status, reason, filed time.
 */
import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@tohfa/mobile-ui';
import { useCursorList } from '../../../api/hooks';
import { listReturns, type ReturnStatusDto } from '../../../api/returns';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { AsyncStates } from '../shared/AsyncStates';
import { FilterChips } from '../shared/FilterChips';
import { ListFooter } from '../shared/ListFooter';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { RETURN_STATUS_FILTERS, returnStatusMeta, returnsListKey, toReturnRow, type ReturnRow } from './mappers';

const { colors, spacing, typography, weights, radius } = adminTheme;

export function ReturnListScreen(props: {
  statusFilter: ReturnStatusDto | undefined;
  onStatusFilterChange: (status: ReturnStatusDto | undefined) => void;
  onOpenReturn: (id: string) => void;
  onBack: () => void;
}): React.JSX.Element {
  const { scope } = useAdminSession();
  const list = useCursorList<ReturnRow>(
    returnsListKey(scope.warehouseId, props.statusFilter),
    async (cursor, signal) => {
      const page = await listReturns({ cursor, status: props.statusFilter }, signal);
      return { items: page.items.map(toReturnRow), page: page.page };
    },
  );

  const state = queryViewState({
    isPending: list.isPending,
    isError: list.isError,
    data: list.data === undefined ? undefined : list.items,
  });

  const options = RETURN_STATUS_FILTERS.map((status) => ({
    key: status ?? 'ALL',
    value: status,
    label: status === undefined ? t('admin.common.all') : t(returnStatusMeta(status).labelKey),
  }));

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.returns.title')} subtitle={scope.warehouseName} onBack={props.onBack} />
      <FilterChips
        accessibilityLabel={t('admin.returns.filterLabel')}
        options={options}
        selectedKey={props.statusFilter ?? 'ALL'}
        onSelect={props.onStatusFilterChange}
      />
      <AsyncStates
        state={state}
        error={list.error}
        onRetry={list.refresh}
        emptyTitleKey="admin.returns.emptyTitle"
        emptyMessageKey="admin.returns.emptyMessage"
      >
        <FlatList
          data={list.items}
          keyExtractor={(row) => row.id}
          renderItem={({ item }) => <ReturnCard row={item} onPress={() => props.onOpenReturn(item.id)} />}
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

function ReturnCard(props: { row: ReturnRow; onPress: () => void }): React.JSX.Element {
  const { row } = props;
  const status = t(row.status.labelKey);
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={t('admin.returns.rowA11y', { order: row.orderId, status, date: row.createdAtLabel })}
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
          ellipsizeMode="middle"
          style={[styles.flex, { color: colors.onSurface, fontSize: typography.body, fontWeight: weights.semibold }]}
        >
          {t('admin.returns.rowTitle', { order: row.orderId })}
        </Text>
        <Badge label={status} variant={row.status.tone} />
      </View>
      <Text numberOfLines={2} style={{ color: colors.onSurface, fontSize: typography.bodySmall }}>
        {row.reason}
      </Text>
      <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>{row.createdAtLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
