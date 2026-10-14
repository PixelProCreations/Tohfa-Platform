// Design id: M5S02 (M5S02_OrdersList)
/**
 * Orders list — the warehouse order queue (GET /admin/orders), page by page,
 * newest first.
 *
 * Scope decides what is listed and shown:
 *   - `scope.warehouseId` set (Sub Warehouse): only that warehouse's orders,
 *     no warehouse label or selector (there is only one warehouse to show).
 *     The flow always sends that warehouse's uuid (BR-30, BR-101).
 *   - undefined (Main Warehouse): all warehouses, and a selector of the
 *     warehouses the host passes (held by the flow).
 * The server returns only in-scope orders (CLAUDE.md 2.1).
 *
 * A row shows the order number and item count: the list carries no customer
 * name (BR-101), and the detail is not fetched per row; the name is on the
 * detail. The search box narrows the rows already loaded by order number (the
 * API has no search). The filter button is gone: the filters screen is not
 * wired to any request. `status` (from a dashboard tile) is the server filter.
 *
 * Gates: the rows open the detail, which gates its own actions.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import type { OrderListStatusFilter } from '../../../api/orders';
import { t } from '../../../i18n';
import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { listStatusOf, orderStatusLabel } from './mappers';
import { orderToneColors } from './statusTone';
import type { OrderListRow, OrderScreenBaseProps, OrdersLiveStateProps, OrdersWarehouseSelector } from './types';

export interface OrdersListScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps, OrdersWarehouseSelector {
  /** The server-side status filter the list was opened with, if any. */
  status?: OrderListStatusFilter | undefined;
  /** The loaded rows, page by page. */
  orders?: readonly OrderListRow[] | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── Icons ──────────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={adminColors.muted} strokeWidth="2" />
      <Path d="M16 16l4.5 4.5" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function StorefrontIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l1-6h16l1 6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M4 12v9h16v-9"
        stroke={adminColors.muted}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DeliveryTruckSmallIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M1 3h13v12H1zM14 8h4l3 3v4h-7V8z" stroke={adminColors.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5" cy="17" r="2" stroke={adminColors.muted} strokeWidth="1.8" />
      <Circle cx="17" cy="17" r="2" stroke={adminColors.muted} strokeWidth="1.8" />
    </Svg>
  );
}

function BuildingWarehouseIcon({ color }: { color: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export function OrdersListScreen({
  scope,
  onBack,
  onNavigate,
  status,
  orders = [],
  warehouseOptions = [],
  selectedWarehouseId,
  onSelectWarehouse,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: OrdersListScreenProps) {
  const isAllWarehouses = scope.warehouseId === undefined;
  const [searchQuery, setSearchQuery] = useState('');
  const query = searchQuery.trim().toLowerCase();
  const filteredOrders = query === '' ? orders : orders.filter((order) => order.orderNumber.toLowerCase().includes(query));
  const view = queryViewState({ isLoading, error, itemCount: orders.length });

  const warehouses = warehouseOptions.flatMap((w) =>
    w.warehouseId === undefined ? [] : [{ id: w.warehouseId, name: w.warehouseName ?? w.warehouseCode ?? w.warehouseId }],
  );
  const warehouseNameOf = (order: OrderListRow): string | undefined =>
    warehouses.find((wh) => wh.id === order.warehouseId)?.name;
  const selectorOptions: { id: string | undefined; name: string }[] = [
    { id: undefined, name: t('orders.list.allWarehouses') },
    ...warehouses,
  ];

  const countLabel =
    status === undefined
      ? t(hasMore ? 'orders.list.countMore' : 'orders.list.count', { count: orders.length })
      : t(hasMore ? 'orders.list.countStatusMore' : 'orders.list.countStatus', {
          count: orders.length,
          status: orderStatusLabel(listStatusOf(status)),
        });

  const renderOrder = ({ item: order }: { item: OrderListRow }) => {
    const tone = orderToneColors(order.tone);
    const warehouseName = isAllWarehouses ? warehouseNameOf(order) : undefined;
    return (
      <TouchableOpacity style={styles.orderCard} activeOpacity={0.75} onPress={() => onNavigate?.('M5S04', { orderId: order.id })}>
        <View style={styles.cardTopRow}>
          <Text style={styles.orderIdText}>{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusBadgeText, { color: tone.text }]}>{order.statusLabel}</Text>
          </View>
        </View>

        {warehouseName !== undefined ? (
          <View style={styles.warehouseRow}>
            <BuildingWarehouseIcon color={adminColors.muted} />
            <Text style={styles.warehouseText}>{warehouseName}</Text>
          </View>
        ) : null}

        <View style={styles.itemsPriceRow}>
          <Text style={styles.itemsCountText}>{order.itemsLabel}</Text>
          <Text style={styles.amountText}>{order.amountLabel}</Text>
        </View>

        <View style={styles.fulfillmentRow}>
          <View style={styles.fulfillmentLeft}>
            {order.fulfilment === 'delivery' ? <DeliveryTruckSmallIcon /> : <StorefrontIcon />}
            <Text style={styles.fulfillmentText}>{order.fulfilmentLabel}</Text>
          </View>
          <Text style={styles.timeText}>{order.placedLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <>
      {isAllWarehouses && warehouses.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.whChipScroll} contentContainerStyle={styles.whChipRow}>
          {selectorOptions.map((wh) => {
            const isActive = wh.id === selectedWarehouseId;
            return (
              <TouchableOpacity
                key={wh.id ?? 'all'}
                style={[styles.whChip, isActive && styles.whChipActive]}
                activeOpacity={0.75}
                onPress={() => onSelectWarehouse?.(wh.id)}
              >
                <BuildingWarehouseIcon color={isActive ? adminColors.onBrand : adminColors.ink} />
                <Text style={[styles.whChipText, isActive && styles.whChipTextActive]}>{wh.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <Text style={styles.orderCountLabel}>{countLabel}</Text>

      <View style={styles.searchBox}>
        <SearchIcon />
        <TextInput
          style={styles.searchInput}
          placeholder={t('orders.list.searchPlaceholder')}
          placeholderTextColor={adminColors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
              <BackArrowIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Orders</Text>
          </View>
        </View>

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : (
          <FlatList
            style={styles.content}
            data={filteredOrders}
            keyExtractor={(order) => order.id}
            renderItem={renderOrder}
            ListHeaderComponent={listHeader}
            showsVerticalScrollIndicator={false}
            onEndReached={hasMore ? onLoadMore : undefined}
            onEndReachedThreshold={0.5}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
              ) : undefined
            }
            ListEmptyComponent={<AdminEmptyState title={t(query === '' ? 'orders.empty.list' : 'orders.empty.search')} />}
            ListFooterComponent={hasMore ? <ActivityIndicator color={adminColors.brand} /> : <View style={styles.bottomSpacer} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
  },
  whChipScroll: {
    marginHorizontal: -adminSpacing.lg,
    marginBottom: 10,
  },
  whChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    paddingHorizontal: adminSpacing.lg,
  },
  whChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
  },
  whChipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  whChipText: {
    ...adminType.caption,
    color: adminColors.ink,
  },
  whChipTextActive: {
    color: adminColors.onBrand,
  },
  orderCountLabel: {
    ...adminType.rowTitle,
    color: adminColors.muted,
    marginBottom: adminSpacing.sm,
  },
  searchBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  searchInput: {
    flex: 1,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  orderCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  orderIdText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  statusBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2.5,
    borderRadius: adminRadius.full,
  },
  statusBadgeText: {
    ...adminType.caption,
  },
  warehouseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  warehouseText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  itemsPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemsCountText: {
    ...adminType.body,
    color: adminColors.muted,
  },
  amountText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  fulfillmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  fulfillmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fulfillmentText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  timeText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  bottomSpacer: {
    height: adminSpacing.lg,
  },
});
