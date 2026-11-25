/**
 * The design's Purchase Orders list (dashboard/PurchaseOrdersScreen) and
 * Purchase History (dashboard/PurchaseHistoryScreen), both on
 * GET /admin/purchase-orders. One component, two layouts, because the two
 * design screens are the same list with a different header and card footer:
 *
 *  - orders:  search under the header; status chips All / Awaiting Handover /
 *             Collection Scheduled / Completed; produce.
 *  - history: search inside the header; status All / Completed; produce;
 *             time period; each card has a divider and a collection date.
 *
 * Search goes to the API as `q` (debounced); status and period become
 * `status` and `from` / `to`. Paging loads the next page as the list nears its
 * end (the design has no load-more control, so none is added). The
 * collection date is not in the list response: it is the dash.
 *
 * Access: `purchase.order.view` only, fail closed. Without it the
 * not-available state is drawn and the list hook is never mounted.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { usePurchaseOrderList } from '../../api/purchaseOrdersHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminSpacing } from '../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { CloseIcon, FilterSlidersIcon, SearchIcon } from './PurchaseOrderIcons';
import { PurchaseOrderFilterPage } from './PurchaseOrderFilterPage';
import { PurchaseOrdersFrame } from './PurchaseOrdersFrame';
import {
  DASH,
  HISTORY_STATUS_CHIPS,
  ORDER_STATUS_CHIPS,
  buildListFilters,
  filterByProduce,
  isNearEnd,
  purchaseOrdersAccess,
  toOrderRow,
  type OrderRowView,
  type PeriodChip,
  type ProduceChip,
  type ScrollMetrics,
  type StatusChip,
} from './purchaseOrdersLogic';
import { styles, TONE_BG, TONE_TEXT } from './purchaseOrdersStyles';

export type PurchaseOrdersListMode = 'orders' | 'history';

/** Typing pause before the search is sent as `q`. */
const SEARCH_DEBOUNCE_MS = 300;

export interface PurchaseOrdersListScreenProps {
  mode: PurchaseOrdersListMode;
  can: Can | undefined;
  warehouseId?: string | undefined;
  onBack: () => void;
  onViewOrder: (id: string) => void;
}

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function PurchaseOrdersListScreen(props: PurchaseOrdersListScreenProps) {
  const access = purchaseOrdersAccess(props.can);
  const title = props.mode === 'history' ? t('purchaseOrders.history.title') : t('purchaseOrders.title');
  if (!access.canView) {
    return (
      <PurchaseOrdersFrame title={title} onBack={props.onBack}>
        <AdminEmptyState title={t('purchaseOrders.notAvailable.title')} subtitle={t('purchaseOrders.notAvailable.subtitle')} />
      </PurchaseOrdersFrame>
    );
  }
  return <LiveList {...props} title={title} />;
}

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
  inHeader: boolean;
}

function SearchBar({ value, onChange, placeholder, inHeader }: SearchBarProps) {
  return (
    <View style={inHeader ? styles.searchWrapInHeader : styles.searchWrap}>
      <SearchIcon size={18} color={adminColors.muted} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={adminColors.muted}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        testID="purchaseOrders.search"
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChange('')}
          hitSlop={{ top: adminSpacing.sm, bottom: adminSpacing.sm, left: adminSpacing.sm, right: adminSpacing.sm }}
          accessibilityRole="button"
          accessibilityLabel={t('purchaseOrders.clearSearch')}
          testID="purchaseOrders.search.clear"
        >
          <CloseIcon size={16} color={adminColors.muted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function OrderCard({ row, history, onPress }: { row: OrderRowView; history: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.8} accessibilityRole="button" testID={`purchaseOrders.card.${row.id}`}>
      <View style={styles.cardHeaderRow}>
        <Text style={history ? styles.orderIdTextHistory : styles.orderIdText}>{row.poNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: TONE_BG[row.tone] }]}>
          <Text style={[styles.statusBadgeText, { color: TONE_TEXT[row.tone] }]}>{row.statusText}</Text>
        </View>
      </View>
      <Text style={styles.farmerProduceText}>{t('purchaseOrders.farmerProduce', { farmer: row.farmer, produce: row.produce })}</Text>
      {history ? <View style={styles.cardDivider} /> : null}
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{t('purchaseOrders.label.quantity')}</Text>
        <Text style={styles.detailValue}>{row.quantity}</Text>
      </View>
      <View style={[styles.detailRow, styles.detailRowSpacing]}>
        <Text style={styles.detailLabel}>{t('purchaseOrders.label.total')}</Text>
        <Text style={styles.detailValue}>{row.total}</Text>
      </View>
      {history ? <Text style={styles.collectionDateText}>{t('purchaseOrders.history.collectionDate', { date: DASH })}</Text> : null}
    </TouchableOpacity>
  );
}

function LiveList({ mode, warehouseId, onBack, onViewOrder, title }: PurchaseOrdersListScreenProps & { title: string }) {
  const history = mode === 'history';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusChip>('ALL');
  const [period, setPeriod] = useState<PeriodChip>('ALL');
  const [produce, setProduce] = useState<ProduceChip>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);
  const debouncedSearch = useDebounced(search, SEARCH_DEBOUNCE_MS);

  // The period is relative to when the filter was chosen; `now` is taken with it.
  const filters = useMemo(
    () => buildListFilters({ status, period: history ? period : 'ALL', search: debouncedSearch }, new Date()),
    [status, period, history, debouncedSearch],
  );
  const list = usePurchaseOrderList(warehouseId, filters, { enabled: true });
  const rows = useMemo(() => filterByProduce(list.items.map(toOrderRow), produce), [list.items, produce]);

  if (filterOpen) {
    return (
      <PurchaseOrderFilterPage
        title={history ? t('purchaseOrders.filter.historyTitle') : t('purchaseOrders.filter.title')}
        statusChips={history ? HISTORY_STATUS_CHIPS : ORDER_STATUS_CHIPS}
        status={status}
        onStatus={setStatus}
        produce={produce}
        onProduce={setProduce}
        showPeriod={history}
        period={period}
        onPeriod={setPeriod}
        onClearAll={() => {
          setStatus('ALL');
          setPeriod('ALL');
          setProduce('ALL');
        }}
        onClose={() => setFilterOpen(false)}
      />
    );
  }

  const filterButton = (
    <TouchableOpacity
      style={styles.filterBtn}
      onPress={() => setFilterOpen(true)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={history ? t('purchaseOrders.filter.historyTitle') : t('purchaseOrders.filter.title')}
      testID="purchaseOrders.filterButton"
    >
      <FilterSlidersIcon size={20} color={adminColors.onBrand} />
    </TouchableOpacity>
  );
  const searchBar = (
    <SearchBar
      value={search}
      onChange={setSearch}
      placeholder={history ? t('purchaseOrders.history.searchPlaceholder') : t('purchaseOrders.searchPlaceholder')}
      inHeader={history}
    />
  );

  const onScroll = (e: { nativeEvent: ScrollMetrics }) => {
    if (list.hasMore && isNearEnd(e.nativeEvent)) list.loadMore();
  };

  let body: React.ReactNode;
  if (list.isLoading) {
    body = <AdminLoadingState />;
  } else if (list.error && rows.length === 0) {
    body = <AdminErrorState error={list.error} onRetry={list.refresh} />;
  } else if (rows.length === 0) {
    body = (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{history ? t('purchaseOrders.history.empty') : t('purchaseOrders.empty')}</Text>
      </View>
    );
  } else {
    body = rows.map((row) => <OrderCard key={row.id} row={row} history={history} onPress={() => onViewOrder(row.id)} />);
  }

  return (
    <PurchaseOrdersFrame title={title} onBack={onBack} headerRight={filterButton} headerBelow={history ? searchBar : undefined}>
      {history ? null : <View style={styles.searchContainer}>{searchBar}</View>}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={200}
        testID="purchaseOrders.scroll"
        refreshControl={
          <RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
        }
      >
        {body}
      </ScrollView>
    </PurchaseOrdersFrame>
  );
}
