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
 * Drawn with a dash until the server can back them: the KPI tiles and the
 * issue-category counts (no count or category endpoint; `reason` is free
 * text), the search box (no `q`), the customer name, order number, product,
 * quantity and price on a row (the row carries ids only) and the Main
 * all-warehouses selector (no warehouse filter).
 */
// Design id: M10-S01
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { OverviewDashboardCard } from '../../../components';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { SWABottomNav } from '../../swa/components';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  FilterChips,
  isAllWarehouses,
  IssueTag,
  LoadMoreButton,
  ReturnsScreen,
  ReturnsSearchBar,
  ScopePill,
  StatusBadge,
  WarehouseSelectorPlaceholder,
  type FilterChip,
} from './ReturnsParts';
import type { ReturnRowView, ReturnsLiveStateProps, WarehouseScreenBaseProps } from './types';

function FilterIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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
  /** Opens the full filter sheet (ReturnsFiltersScreen). Absent on history view. */
  onOpenFilters?: (() => void) | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
  emptyTitle?: string | undefined;
  /** Draw the warehouse bottom tabs (the queue is a top-level area). */
  showTabs?: boolean | undefined;
  /** Return History: no KPI tiles or category summary, the history's search placeholder and card. */
  history?: boolean | undefined;
}

/** The four status tiles of the design: title and subtitle keys, the tile's icon and tone. */
const KPI_TILES: readonly {
  title: TranslationKey;
  subtitle: TranslationKey;
  icon: 'orders' | 'pickup' | 'receiving' | 'alert';
  tone?: 'warning' | 'success' | 'danger';
}[] = [
  { title: 'returns.kpi.pending.title', subtitle: 'returns.kpi.pending.subtitle', icon: 'orders', tone: 'warning' },
  { title: 'returns.kpi.underReview.title', subtitle: 'returns.kpi.underReview.subtitle', icon: 'pickup' },
  { title: 'returns.kpi.approved.title', subtitle: 'returns.kpi.approved.subtitle', icon: 'receiving', tone: 'success' },
  { title: 'returns.kpi.refundPending.title', subtitle: 'returns.kpi.refundPending.subtitle', icon: 'alert', tone: 'danger' },
];

const CATEGORY_LABELS: readonly TranslationKey[] = [
  'returns.category.QUALITY',
  'returns.category.QUANTITY',
  'returns.category.MISSING',
  'returns.category.WRONG',
  'returns.category.DAMAGED',
  'returns.category.LATE',
];

/** One row of the queue (Sub card) or of the history. Customer, order and the rest are dashes: the row carries ids only. */
function ReturnRowCard({ row, history, onPress }: { row: ReturnRowView; history: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <View style={styles.rowBetween}>
        <Text style={styles.reference}>{row.reference}</Text>
        <StatusBadge label={row.statusLabel} tone={row.statusTone} />
      </View>
      <Text style={styles.customer}>{ADMIN_NO_VALUE}</Text>
      <Text style={styles.orderLine}>{ADMIN_NO_VALUE}</Text>
      {history ? (
        <View style={styles.tagRow}>
          <IssueTag label={row.reason} />
          <Text style={styles.refundAmount}>{t('returns.row.refund', { amount: ADMIN_NO_VALUE })}</Text>
        </View>
      ) : (
        <>
          <View style={styles.tagRow}>
            <IssueTag label={ADMIN_NO_VALUE} />
            <Text style={styles.quantity}>{ADMIN_NO_VALUE}</Text>
          </View>
          <Text style={styles.reason} numberOfLines={2}>
            {row.reason}
          </Text>
        </>
      )}
      <Text style={styles.meta}>{row.created}</Text>
    </TouchableOpacity>
  );
}

/** The Main warehouse's queue card: customer and order line, then product, price and "View". */
function MainReturnRowCard({ row, onPress }: { row: ReturnRowView; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.mainCard} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <View style={styles.rowBetween}>
        <Text style={styles.reference}>{row.reference}</Text>
        <StatusBadge label={row.statusLabel} tone={row.statusTone} />
      </View>
      <Text style={styles.mainCustomerLine}>{`${ADMIN_NO_VALUE} · ${ADMIN_NO_VALUE}`}</Text>
      <View style={styles.mainDivider} />
      <View style={styles.rowBetween}>
        <Text style={styles.mainProduct}>{`${ADMIN_NO_VALUE} · ${ADMIN_NO_VALUE}`}</Text>
        <Text style={styles.mainPrice}>{ADMIN_NO_VALUE}</Text>
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.mainMeta} numberOfLines={1}>
          {`${row.reason} · ${row.created}`}
        </Text>
        <Text style={styles.mainView}>{t('returns.row.view')}</Text>
      </View>
    </TouchableOpacity>
  );
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
  onOpenFilters,
  onLoadMore,
  hasMore = false,
  emptyTitle,
  showTabs = false,
  history = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: ReturnsIssuesScreenProps) {
  const view = queryViewState({ isLoading, error, itemCount: rows.length });
  const allWarehouses = isAllWarehouses(scope);

  const filterButton =
    !history && onOpenFilters !== undefined ? (
      <TouchableOpacity
        onPress={onOpenFilters}
        activeOpacity={0.8}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={t('returns.filter.open')}
      >
        <FilterIcon />
      </TouchableOpacity>
    ) : null;

  return (
    <ReturnsScreen
      title={title ?? t('returns.title')}
      onBack={onBack}
      headerRight={filterButton}
      headerExtra={allWarehouses ? <WarehouseSelectorPlaceholder /> : <ScopePill scope={scope} />}
      footer={showTabs && !allWarehouses ? <SWABottomNav activeTab="More" onTabChange={onTabChange} /> : null}
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
        {history ? null : (
          <View style={styles.kpiGrid}>
            {KPI_TILES.map((tile) => (
              <OverviewDashboardCard
                key={tile.title}
                value={ADMIN_NO_VALUE}
                title={t(tile.title)}
                subtitle={t(tile.subtitle)}
                icon={tile.icon}
                {...(tile.tone === undefined ? {} : { tone: tile.tone })}
              />
            ))}
          </View>
        )}

        {history || allWarehouses ? null : (
          <>
            <Text style={styles.sectionTitle}>{t('returns.categories.title')}</Text>
            <View style={styles.categoryGrid}>
              {CATEGORY_LABELS.map((label) => (
                <View key={label} style={styles.categoryBox}>
                  <Text style={styles.categoryCount}>{ADMIN_NO_VALUE}</Text>
                  <Text style={styles.categoryLabel}>{t(label)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {history || allWarehouses ? <ReturnsSearchBar placeholder={t(history ? 'returns.search.historyPlaceholder' : 'returns.search.placeholder')} /> : null}

        <FilterChips chips={chips} value={chip} onChange={onChipChange} />

        {history ? null : (
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitleFlat}>{t('returns.queue.sectionTitle')}</Text>
            {onNavigateToHistory ? (
              <TouchableOpacity onPress={onNavigateToHistory} accessibilityRole="button">
                <Text style={styles.historyLinkText}>{t('returns.queue.historyLink')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : view === 'empty' ? (
          <AdminEmptyState title={emptyTitle ?? t('returns.queue.empty')} />
        ) : (
          rows.map((row) =>
            !history && allWarehouses ? (
              <MainReturnRowCard key={row.id} row={row} onPress={() => onSelectReturn(row.id)} />
            ) : (
              <ReturnRowCard key={row.id} row={row} history={history} onPress={() => onSelectReturn(row.id)} />
            ),
          )
        )}

        {view === 'ready' && hasMore && onLoadMore ? <LoadMoreButton onPress={onLoadMore} /> : null}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.md, paddingBottom: adminSpacing.xl },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: adminSpacing.smMd, marginBottom: adminSpacing.lg },
  sectionTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.md },
  sectionTitleFlat: { ...adminType.sectionHead, color: adminColors.ink },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.lg },
  categoryBox: {
    width: '31.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCount: { ...adminType.kpiValue, color: adminColors.ink },
  categoryLabel: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: adminSpacing.sm },
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
  customer: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.xs },
  orderLine: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.sm },
  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: adminSpacing.xs },
  quantity: { ...adminType.sectionHead, color: adminColors.ink },
  refundAmount: { ...adminType.rowTitle, color: adminColors.success.text },
  mainCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  mainCustomerLine: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs },
  mainDivider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  mainProduct: { ...adminType.rowMeta, color: adminColors.ink },
  mainPrice: { ...adminType.rowTitle, color: adminColors.brandDeep },
  mainMeta: { ...adminType.caption, color: adminColors.muted, flex: 1 },
  mainView: { ...adminType.caption, color: adminColors.brandDeep },
});
