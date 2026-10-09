// Design id: M5S02 (M5S02_OrdersList)
/**
 * Orders list — every customer order the viewer can see, with search and a
 * per-row next action.
 *
 * Scope decides what is listed and shown:
 *   - `scope.warehouseId` set (Sub Warehouse): only that warehouse's orders,
 *     no warehouse label or selector (there is only one warehouse to show).
 *   - undefined (Main Warehouse): all warehouses, a warehouse selector, and a
 *     warehouse label on each row.
 * The filter here is presentation only; the server returns only in-scope
 * orders (CLAUDE.md 2.1).
 *
 * Gates: the row actions are navigation into screens that gate themselves;
 * nothing here is gated.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import type { OrderScreenBaseProps } from './types';

interface WarehouseOption {
  id: string;
  name: string;
}

/** Params the host navigator forwards from the previous screen. */
export interface OrdersListRouteParams {
  /** Only list orders whose status equals this. */
  defaultFilter?: string | undefined;
  /** Main view only: open the list narrowed to this warehouse. */
  warehouseId?: string | undefined;
}

export interface OrdersListScreenProps extends OrderScreenBaseProps {
  routeParams?: OrdersListRouteParams | undefined;
  /** Warehouses offered by the Main-view selector. Ignored when `scope.warehouseId` is set. */
  warehouses?: WarehouseOption[] | undefined;
}

/** Neutral placeholder until the host passes the real warehouse list (same ids as the mock orders). */
const DEFAULT_WAREHOUSES: WarehouseOption[] = [
  { id: 'WH-COON', name: 'Warehouse 1' },
  { id: 'WH-2', name: 'Warehouse 2' },
  { id: 'WH-3', name: 'Warehouse 3' },
];

type OrderStatus = 'Confirmed' | 'Ready for Pickup' | 'Packing' | 'Quantity Issue' | 'Completed';

interface OrderRow {
  id: string;
  warehouseId: string;
  warehouseName: string;
  customer: string;
  status: OrderStatus;
  items: string;
  amount: string;
  fulfillment: 'Pickup' | 'Delivery';
  time: string;
  action: string;
  /** Route key of the screen that performs `action`. */
  actionScreen: string;
  /** Step inside `actionScreen`, for actions that land on a folded step. */
  actionStep?: string;
}

const ORDERS: OrderRow[] = [
  {
    id: 'ORD-1024',
    warehouseId: 'WH-COON',
    warehouseName: 'Warehouse 1',
    customer: 'Arun Kumar',
    status: 'Confirmed',
    items: '3 Items',
    amount: '₹850',
    fulfillment: 'Pickup',
    time: 'Today · 10:32 AM',
    action: 'Check Stock',
    actionScreen: 'M5S05',
  },
  {
    id: 'ORD-1023',
    warehouseId: 'WH-COON',
    warehouseName: 'Warehouse 1',
    customer: 'Priya',
    status: 'Ready for Pickup',
    items: '5 Items',
    amount: '₹1,240',
    fulfillment: 'Pickup',
    time: 'Today · 09:45 AM',
    action: 'Verify Pickup',
    // Was M5S10, now the 'verify' step of the pickup wizard.
    actionScreen: 'M5S11',
    actionStep: 'verify',
  },
  {
    id: 'ORD-1022',
    warehouseId: 'WH-2',
    warehouseName: 'Warehouse 2',
    customer: 'Ganesh K.',
    status: 'Packing',
    items: '2 Items',
    amount: '₹420',
    fulfillment: 'Pickup',
    time: 'Today · 09:10 AM',
    action: 'Pack',
    actionScreen: 'M5S07',
  },
  {
    id: 'ORD-1021',
    warehouseId: 'WH-COON',
    warehouseName: 'Warehouse 1',
    customer: 'Divya R.',
    status: 'Confirmed',
    items: '4 Items',
    amount: '₹960',
    fulfillment: 'Delivery',
    time: 'Today · 08:55 AM',
    action: 'Prepare Delivery',
    actionScreen: 'M5S13',
  },
  {
    id: 'ORD-1018',
    warehouseId: 'WH-3',
    warehouseName: 'Warehouse 3',
    customer: 'Meena S.',
    status: 'Quantity Issue',
    items: '2 Items',
    amount: '₹310',
    fulfillment: 'Pickup',
    time: 'Yesterday · 4:20 PM',
    action: 'Review Shortage',
    // Was M5S06, now the 'shortage' step of the stock check.
    actionScreen: 'M5S05',
    actionStep: 'shortage',
  },
  {
    id: 'ORD-1010',
    warehouseId: 'WH-COON',
    warehouseName: 'Warehouse 1',
    customer: 'Rahul Kumar',
    status: 'Completed',
    items: '3 Items',
    amount: '₹850',
    fulfillment: 'Pickup',
    time: 'Yesterday · 2:10 PM',
    action: 'View Invoice',
    actionScreen: 'M5S18',
  },
];

const STATUS_TONE: Record<OrderStatus, { bg: string; text: string }> = {
  Confirmed: adminColors.warning,
  Packing: adminColors.warning,
  'Ready for Pickup': adminColors.success,
  Completed: adminColors.success,
  'Quantity Issue': adminColors.danger,
};

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── Icons ──────────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon() {
  const c = adminColors.onBrand;
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M3.5 8h17" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M15.5 4.5v7" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
      <Path d="M3.5 16h17" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
      <Path d="M8.5 12.5v7" stroke={c} strokeWidth="2.4" strokeLinecap="round" />
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

export function OrdersListScreen({ scope, onBack, onNavigate, routeParams, warehouses = DEFAULT_WAREHOUSES }: OrdersListScreenProps) {
  const isAllWarehouses = scope.warehouseId === undefined;
  const [searchQuery, setSearchQuery] = useState('');
  // Main view only; a Sub admin is pinned to scope.warehouseId below.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    isAllWarehouses ? routeParams?.warehouseId : undefined,
  );

  const warehouseFilter = isAllWarehouses ? selectedWarehouseId : scope.warehouseId;
  const query = searchQuery.toLowerCase();

  const filteredOrders = ORDERS.filter((order) => {
    if (warehouseFilter !== undefined && order.warehouseId !== warehouseFilter) return false;
    if (routeParams?.defaultFilter && order.status !== routeParams.defaultFilter) return false;
    return order.id.toLowerCase().includes(query) || order.customer.toLowerCase().includes(query);
  });

  const warehouseNameOf = (order: OrderRow): string =>
    warehouses.find((wh) => wh.id === order.warehouseId)?.name ?? order.warehouseName;

  const selectorOptions: { id: string | undefined; name: string }[] = [{ id: undefined, name: 'All warehouses' }, ...warehouses];

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

          <TouchableOpacity style={styles.filterButton} activeOpacity={0.75} onPress={() => onNavigate?.('M5S03')}>
            <FilterSlidersIcon />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isAllWarehouses ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.whChipScroll}
              contentContainerStyle={styles.whChipRow}
            >
              {selectorOptions.map((wh) => {
                const isActive = wh.id === selectedWarehouseId;
                return (
                  <TouchableOpacity
                    key={wh.id ?? 'all'}
                    style={[styles.whChip, isActive && styles.whChipActive]}
                    activeOpacity={0.75}
                    onPress={() => setSelectedWarehouseId(wh.id)}
                  >
                    <BuildingWarehouseIcon color={isActive ? adminColors.onBrand : adminColors.ink} />
                    <Text style={[styles.whChipText, isActive && styles.whChipTextActive]}>{wh.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}

          <Text style={styles.orderCountLabel}>{filteredOrders.length} Orders</Text>

          <View style={styles.searchBox}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search order / customer / phone"
              placeholderTextColor={adminColors.placeholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredOrders.map((order) => {
            const tone = STATUS_TONE[order.status];
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S04', { orderId: order.id })}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.orderIdText}>{order.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: tone.text }]}>{order.status}</Text>
                  </View>
                </View>

                <Text style={styles.customerNameText}>{order.customer}</Text>

                {isAllWarehouses ? (
                  <View style={styles.warehouseRow}>
                    <BuildingWarehouseIcon color={adminColors.muted} />
                    <Text style={styles.warehouseText}>{warehouseNameOf(order)}</Text>
                  </View>
                ) : null}

                <View style={styles.itemsPriceRow}>
                  <Text style={styles.itemsCountText}>{order.items}</Text>
                  <Text style={styles.amountText}>{order.amount}</Text>
                </View>

                <View style={styles.fulfillmentRow}>
                  <View style={styles.fulfillmentLeft}>
                    {order.fulfillment === 'Pickup' ? <StorefrontIcon /> : <DeliveryTruckSmallIcon />}
                    <Text style={styles.fulfillmentText}>{order.fulfillment}</Text>
                  </View>
                  <Text style={styles.timeText}>{order.time}</Text>
                </View>

                <TouchableOpacity
                  style={styles.actionBtn}
                  activeOpacity={0.8}
                  onPress={() =>
                    onNavigate?.(
                      order.actionScreen,
                      order.actionStep ? { orderId: order.id, step: order.actionStep } : { orderId: order.id },
                    )
                  }
                >
                  <Text style={styles.actionBtnText}>{order.action}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    // Was a translucent overlay; no translucent token, so a solid brandDeep chip.
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
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
  customerNameText: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 6,
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
  actionBtn: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  actionBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
  },
  bottomSpacer: {
    height: adminSpacing.lg,
  },
});
