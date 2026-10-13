/**
 * Invoice list — `GET /invoices`, cursor-paged, read-only.
 *
 * Scope is the server's: a Sub Warehouse Admin gets invoices of orders placed
 * at its warehouse (BR-30, BR-36); the client sends no warehouse id and only
 * namespaces its cache by `scope.warehouseId`.
 *
 * Filters: invoice type only. `GET /invoices` has no `status` query param, so
 * there is no status filter (and no client-side filtering of a page, which
 * would make "load more" lie about what is left). There is no Generate
 * Invoice action: the API has no create endpoint.
 */
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge, Button } from '@tohfa/mobile-ui';
import { listInvoices, type InvoiceTypeDto } from '../../../api/invoices';
import { useCursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { useAdminSession } from '../../../session/AdminSession';
import { adminTheme } from '../../../theme';
import { AsyncStates } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ScreenHeader } from '../shared/ScreenHeader';
import { INVOICE_TYPE_FILTERS, invoiceTypeLabelKey, toInvoiceRow, type InvoiceRow } from './mappers';

export const INVOICES_RESOURCE = 'invoices';

export interface InvoiceListScreenProps {
  typeFilter: InvoiceTypeDto | undefined;
  onTypeFilterChange: (type: InvoiceTypeDto | undefined) => void;
  onOpenInvoice: (id: string) => void;
  onBack: () => void;
}

const { colors, spacing, typography, weights, radius, minTouchTarget } = adminTheme;

export function InvoiceListScreen(props: InvoiceListScreenProps): React.JSX.Element {
  const { scope } = useAdminSession();
  const list = useCursorList<InvoiceRow>(
    adminKeys.list(scope.warehouseId, INVOICES_RESOURCE, { type: props.typeFilter }),
    async (cursor, signal) => {
      const page = await listInvoices({ cursor, type: props.typeFilter }, signal);
      return { items: page.items.map(toInvoiceRow), page: page.page };
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
        title={t('admin.invoices.title')}
        subtitle={scope.warehouseName}
        onBack={props.onBack}
      />
      <TypeFilter value={props.typeFilter} onChange={props.onTypeFilterChange} />
      <AsyncStates
        state={state}
        error={list.error}
        onRetry={list.refresh}
        emptyTitleKey="admin.invoices.emptyTitle"
        emptyMessageKey="admin.invoices.emptyMessage"
      >
        <FlatList
          data={list.items}
          keyExtractor={(row) => row.id}
          renderItem={({ item }) => (
            <InvoiceCard row={item} onPress={() => props.onOpenInvoice(item.id)} />
          )}
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

function TypeFilter(props: {
  value: InvoiceTypeDto | undefined;
  onChange: (type: InvoiceTypeDto | undefined) => void;
}): React.JSX.Element {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('admin.invoices.filterLabel')}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        }}
      >
        {INVOICE_TYPE_FILTERS.map((type) => {
          const selected = type === props.value;
          return (
            <Pressable
              key={type ?? 'ALL'}
              onPress={() => props.onChange(type)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[
                styles.chip,
                {
                  minHeight: minTouchTarget,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.chip,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primaryPale : colors.surface,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? colors.primaryPressed : colors.onSurface,
                  fontSize: typography.bodySmall,
                  fontWeight: selected ? weights.semibold : weights.regular,
                }}
              >
                {type === undefined ? t('admin.common.all') : t(invoiceTypeLabelKey(type))}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function InvoiceCard(props: { row: InvoiceRow; onPress: () => void }): React.JSX.Element {
  const { row } = props;
  const status = t(row.status.labelKey);
  const amount = formatPaise(row.totalPaise);
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={t('admin.invoices.rowA11y', {
        number: row.invoiceNumber,
        status,
        amount,
      })}
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
          style={[
            styles.flex,
            { color: colors.onSurface, fontSize: typography.body, fontWeight: weights.semibold },
          ]}
        >
          {row.invoiceNumber}
        </Text>
        <Badge label={status} variant={row.status.tone} />
      </View>
      <View style={[styles.rowBetween, { gap: spacing.sm }]}>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.invoices.rowMeta', { type: t(row.typeLabelKey), date: row.issueDateLabel })}
        </Text>
        <Text style={{ color: colors.onSurface, fontSize: typography.body, fontWeight: weights.bold }}>
          {amount}
        </Text>
      </View>
    </Pressable>
  );
}

function ListFooter(props: {
  isLoadingMore: boolean;
  loadMoreFailed: boolean;
  hasMore: boolean;
  shown: number;
  onLoadMore: () => void;
}): React.JSX.Element | null {
  if (props.isLoadingMore) {
    return (
      <ActivityIndicator
        style={{ padding: spacing.lg }}
        color={colors.primary}
        accessibilityLabel={t('admin.common.loading')}
      />
    );
  }
  if (props.loadMoreFailed) {
    return (
      <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
        <Text style={[styles.center, { color: colors.error, fontSize: typography.bodySmall }]}>
          {t('admin.common.loadMoreError', { count: props.shown })}
        </Text>
        <Button title={t('admin.common.retry')} variant="outline" onPress={props.onLoadMore} />
      </View>
    );
  }
  if (props.hasMore) {
    return <Button title={t('admin.common.loadMore')} variant="outline" onPress={props.onLoadMore} />;
  }
  return null;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  chip: { borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  card: { borderWidth: StyleSheet.hairlineWidth },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { textAlign: 'center' },
});
