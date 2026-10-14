/**
 * Return status history — `GET /admin/returns/{id}/history`
 * (rma.request.process; BR-35 append-only trail, oldest first).
 *
 * Shows exactly the server's entries — no synthesized timeline steps. The
 * `changedBy` user id is not rendered: there is no endpoint to resolve it to a
 * name for a Sub Warehouse Admin, and a bare uuid helps nobody.
 */
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useAdminQuery } from '../../../api/hooks';
import { getReturnHistory } from '../../../api/returns';
import { t } from '../../../i18n';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { AsyncStates } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { returnHistoryKey, toReturnHistoryEntry, type ReturnHistoryEntry } from './mappers';

const { colors, spacing, typography, weights, radius } = adminTheme;

export function ReturnHistoryScreen(props: { returnId: string; onBack: () => void }): React.JSX.Element {
  const { scope } = useAdminSession();
  const query = useAdminQuery(returnHistoryKey(scope.warehouseId, props.returnId), async (signal) =>
    (await getReturnHistory(props.returnId, signal)).items.map(toReturnHistoryEntry),
  );
  const state = queryViewState(query);

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.returns.history.title')} subtitle={scope.warehouseName} onBack={props.onBack} />
      <AsyncStates
        state={state}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyTitleKey="admin.returns.history.emptyTitle"
      >
        <FlatList
          data={query.data ?? []}
          keyExtractor={(entry) => entry.id}
          renderItem={({ item }) => <EntryCard entry={item} />}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      </AsyncStates>
    </View>
  );
}

function EntryCard(props: { entry: ReturnHistoryEntry }): React.JSX.Element {
  const { entry } = props;
  const to = t(entry.to.labelKey);
  const title =
    entry.from === null
      ? t('admin.returns.history.created', { to })
      : t('admin.returns.history.transition', { from: t(entry.from.labelKey), to });
  return (
    <View
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
      <Text style={{ color: colors.onSurface, fontSize: typography.body, fontWeight: weights.semibold }}>{title}</Text>
      {entry.note === null ? null : (
        <Text style={{ color: colors.onSurface, fontSize: typography.bodySmall }}>{entry.note}</Text>
      )}
      <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.caption }}>{entry.createdAtLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  card: { borderWidth: StyleSheet.hairlineWidth },
});
