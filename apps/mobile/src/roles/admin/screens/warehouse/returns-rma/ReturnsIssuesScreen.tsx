/**
 * Returns & Issues — the return (RMA) queue, on GET /admin/returns (plan
 * phase 10).
 *
 * The rows are the server's: newest first, paged with "Load more" and pull to
 * refresh, narrowed by the status chips (the server's `status` filter; "All"
 * sends none). Scope is the server's too (BR-30): a Sub admin sees the returns
 * of orders from its own warehouse; nothing here filters by warehouse.
 * Gates: the list itself needs rma.request.process (all for both warehouse
 * roles); what a row can lead to is decided on the detail (returnActions).
 *
 * Hidden, because GET /admin/returns cannot back them: the KPI tiles and the
 * issue-category summary (no count or category endpoint; `reason` is free
 * text), the search box (no `q`), the customer name and product on a row (the
 * row carries ids only) and the Main all-warehouses selector (no warehouse
 * filter).
 */
// Design id: M10-S01
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { SWABottomNav } from '../../swa/components';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { FilterChips, isAllWarehouses, LoadMoreButton, ReturnsScreen, ScopePill, StatusBadge, type FilterChip } from './ReturnsParts';
import type { ReturnRowView, ReturnsLiveStateProps, WarehouseScreenBaseProps } from './types';

export interface ReturnsIssuesScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps {
  /** The loaded rows, page by page. */
  rows?: readonly ReturnRowView[] | undefined;
  /** Title of the screen (the queue and Return History share this layout). */
  title?: string | undefined;
  /** The status chips (server filter) and the selected one. */
  chips: readonly FilterChip<string | undefined>[];
  chip: string | undefined;
  onChipChange: (value: string | undefined) => void;
  onSelectReturn: (returnId: string) => void;
  /** The queue's link to Return History; absent on the history itself. */
  onNavigateToHistory?: (() => void) | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
  emptyTitle?: string | undefined;
  /** Draw the warehouse bottom tabs (the queue is a top-level area). */
  showTabs?: boolean | undefined;
}

export function ReturnsIssuesScreen({
  scope,
  onBack,
  onTabChange,
  rows = [],
  title,
  chips,
  chip,
  onChipChange,
  onSelectReturn,
  onNavigateToHistory,
  onLoadMore,
  hasMore = false,
  emptyTitle,
  showTabs = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: ReturnsIssuesScreenProps) {
  const view = queryViewState({ isLoading, error, itemCount: rows.length });

  return (
    <ReturnsScreen
      title={title ?? t('returns.title')}
      onBack={onBack}
      headerExtra={<ScopePill scope={scope} />}
      footer={showTabs && !isAllWarehouses(scope) ? <SWABottomNav activeTab="More" onTabChange={onTabChange} /> : null}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={adminColors.brand} colors={[adminColors.brand]} />
          ) : undefined
        }
      >
        <FilterChips chips={chips} value={chip} onChange={onChipChange} />

        {onNavigateToHistory ? (
          <TouchableOpacity style={styles.historyLink} onPress={onNavigateToHistory} accessibilityRole="button">
            <Text style={styles.historyLinkText}>{t('returns.queue.historyLink')}</Text>
          </TouchableOpacity>
        ) : null}

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : view === 'empty' ? (
          <AdminEmptyState title={emptyTitle ?? t('returns.queue.empty')} />
        ) : (
          rows.map((row) => (
            <TouchableOpacity
              key={row.id}
              style={styles.card}
              onPress={() => onSelectReturn(row.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.rowBetween}>
                <Text style={styles.reference}>{row.reference}</Text>
                <StatusBadge label={row.statusLabel} tone={row.statusTone} />
              </View>
              <Text style={styles.reason} numberOfLines={2}>
                {row.reason}
              </Text>
              <Text style={styles.meta}>{row.created}</Text>
            </TouchableOpacity>
          ))
        )}

        {view === 'ready' && hasMore && onLoadMore ? <LoadMoreButton onPress={onLoadMore} /> : null}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  historyLink: { alignSelf: 'flex-end', marginBottom: adminSpacing.sm },
  historyLinkText: { ...adminType.sectionHead, color: adminColors.brand },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reference: { ...adminType.rowTitle, color: adminColors.ink },
  reason: { ...adminType.body, color: adminColors.ink, marginTop: adminSpacing.sm },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
});
