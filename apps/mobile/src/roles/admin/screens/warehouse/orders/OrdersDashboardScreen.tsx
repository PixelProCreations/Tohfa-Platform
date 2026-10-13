// Design id: M5S01 (M5S01_OrdersDashboard); Main-only parts ported from MainWarehouseCustomerOrdersScreen and OrderFulfilmentOperationsScreen.
/**
 * Orders dashboard — the entry screen of the warehouse customer-order module.
 *
 * One screen for both warehouse roles. `scope.warehouseId` decides the shape:
 *   - set (Sub Warehouse): the header shows the assigned warehouse, locked.
 *   - undefined (Main Warehouse, all warehouses): the header shows a warehouse
 *     selector, and two all-warehouse cards appear (per-warehouse order
 *     breakdown and the fulfilment summary). Scoping here is presentation
 *     only; the server scopes every order read again (CLAUDE.md 2.1).
 *
 * Gates: none of the tiles on this screen assigns an order to a warehouse, so
 * `order.warehouse.assign` currently has nothing to hide. Every other tile is
 * navigation and stays ungated, as it was in the design.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { WarehouseSelector } from '../inventory';
import type { OrderScreenBaseProps } from './types';

interface WarehouseOption {
  id: string;
  name: string;
}

export interface OrdersDashboardScreenProps extends OrderScreenBaseProps {
  /** Warehouses offered by the Main-view selector. Ignored when `scope.warehouseId` is set. */
  warehouses?: WarehouseOption[] | undefined;
  routeParams?: Record<string, unknown> | undefined;
}

/**
 * Neutral placeholder until the host passes the real warehouse list.
 */
const DEFAULT_WAREHOUSES: WarehouseOption[] = [
  { id: 'WH-COON', name: 'Coonoor' },
  { id: 'WH-OOTY', name: 'Ooty' },
  { id: 'WH-KOTA', name: 'Kotagiri' },
  { id: 'WH-GUDA', name: 'Gudalur' },
];

/** Mock per-warehouse order summary */
const WAREHOUSE_SUMMARY = [
  { id: 'WH-COON', name: 'Coonoor', orders: 16 },
  { id: 'WH-OOTY', name: 'Ooty', orders: 12 },
];

interface RecentOrderItem {
  id: string;
  warehouseId: string;
  warehouseName: string;
  customer: string;
  status: string;
  items: string;
  amount: string;
}

const RECENT_ORDERS_BY_WH: RecentOrderItem[] = [
  {
    id: 'ORD-1024',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor',
    customer: 'Arun Kumar',
    status: 'Confirmed',
    items: '4 items',
    amount: '₹850',
  },
  {
    id: 'ORD-1021',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor',
    customer: 'Divya R.',
    status: 'Confirmed',
    items: '4 items',
    amount: '₹960',
  },
  {
    id: 'ORD-1019',
    warehouseId: 'WH-COON',
    warehouseName: 'Coonoor',
    customer: 'Kavitha M.',
    status: 'Packing',
    items: '3 items',
    amount: '₹720',
  },
  {
    id: 'ORD-1022',
    warehouseId: 'WH-OOTY',
    warehouseName: 'Ooty',
    customer: 'Ganesh K.',
    status: 'Packing',
    items: '2 items',
    amount: '₹420',
  },
  {
    id: 'ORD-1018',
    warehouseId: 'WH-KOTA',
    warehouseName: 'Kotagiri',
    customer: 'Meena S.',
    status: 'Quantity Issue',
    items: '2 items',
    amount: '₹310',
  },
  {
    id: 'ORD-1016',
    warehouseId: 'WH-GUDA',
    warehouseName: 'Gudalur',
    customer: 'Ravi P.',
    status: 'Confirmed',
    items: '3 items',
    amount: '₹640',
  },
];



const FILTER_PILLS = ['All', 'Confirmed', 'Packing', 'Ready', 'Completed', 'Issues'];

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── Icons ──────────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GridMenuIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7.5" height="7.5" rx="1.5" stroke={adminColors.onBrand} strokeWidth="2" />
      <Rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" stroke={adminColors.onBrand} strokeWidth="2" />
      <Rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={adminColors.onBrand} strokeWidth="2" />
      <Rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" stroke={adminColors.onBrand} strokeWidth="2" />
    </Svg>
  );
}


function WarningTriangleAccentIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={adminColors.brand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={adminColors.brand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ShelfPickupIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="16" height="16" rx="2" stroke={adminColors.brand} strokeWidth="1.8" />
      <Path d="M4 12h16" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M10 8h4M10 16h4" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function ReceiptHeaderIcon() {
  const c = adminColors.onBrand;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 6.5l1.75-2 1.75 2 1.75-2 1.75 2 1.75-2 1.75 2 1.75-2 1.75 2v10H5V6.5z"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="7.5" y="8" width="9" height="4.5" rx="0.5" stroke={c} strokeWidth="1.2" />
      <Path d="M12 8v4.5" stroke={c} strokeWidth="1.2" />
      <Path d="M7.5 14.5h9" stroke={c} strokeWidth="1.3" strokeLinecap="round" />
      <Path
        d="M18.5 16.5H5c-1.6 0-2.6 1-2.6 2.2 0 1.3 1 2.3 2.6 2.3h13.2c1 0 1.8-.7 1.8-1.7 0-1.2-.9-2.1-1.8-2.1"
        stroke={c}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M4.8 16.6c-.8.4-1.3 1-1.3 1.8 0 .8.5 1.5 1.3 1.8" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LockSmallIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}


function NewBadgeIcon() {
  return (
    <View style={styles.newBadgeChip}>
      <Text style={styles.newBadgeText}>NEW</Text>
    </View>
  );
}

function CheckCircleTickIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={adminColors.ink} strokeWidth="1.8" />
      <Path d="M7.5 12l3 3 6-6" stroke={adminColors.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PackageBoxIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="2.5" y="5.5" width="19" height="14" rx="2" stroke={adminColors.ink} strokeWidth="1.8" />
      <Path d="M2.5 10h19M9.5 5.5v4.5" stroke={adminColors.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReadyPickupIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke={adminColors.ink} strokeWidth="1.8" />
      <Path d="M3 19v-1.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V19" stroke={adminColors.ink} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M15 11.5l2 2 4.5-4.5" stroke={adminColors.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeliveryTruckIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M2 4h12v11H2zM14 8.5h4.5l2.5 3.5v3h-7V8.5z" stroke={adminColors.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="6" cy="18" r="2.2" stroke={adminColors.ink} strokeWidth="1.8" />
      <Circle cx="17" cy="18" r="2.2" stroke={adminColors.ink} strokeWidth="1.8" />
    </Svg>
  );
}

function ErrorExclamationIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9.5" stroke={adminColors.danger.text} strokeWidth="1.8" />
      <Path d="M12 7v5.5M12 15.5h.01" stroke={adminColors.danger.text} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

function WarningTriangleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={adminColors.warning.text}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 9v4M12 17h.01" stroke={adminColors.warning.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function AttentionChecklistIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3.5" stroke={adminColors.brand} strokeWidth="1.8" />
      <Path d="M7 8.5h2M7 12.5h2M7 16.5h2M12 8.5h5M12 12.5h5M12 16.5h5" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function AttentionPersonIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke={adminColors.brand} strokeWidth="1.8" />
      <Path d="M3 19v-1.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V19" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M15 11.5l2 2 4-4" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ViewOrdersReceiptIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 8h8M8 12h8M8 16h5" stroke={adminColors.brand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}



// ─── Screen ─────────────────────────────────────────────────────────────────

export function OrdersDashboardScreen({
  scope,
  onBack,
  onNavigate,
  onTabChange: _onTabChange,
  routeParams,
  warehouses = DEFAULT_WAREHOUSES,
}: OrdersDashboardScreenProps) {
  const [activeFilterPill, setActiveFilterPill] = useState('All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    typeof routeParams?.warehouseId === 'string' ? routeParams.warehouseId : undefined,
  );
  const warehouseOptions = React.useMemo(
    () => warehouses.map((w) => ({ warehouseId: w.id, warehouseName: w.name })),
    [warehouses]
  );

  useEffect(() => {
    if (typeof routeParams?.warehouseId === 'string') {
      setSelectedWarehouseId(routeParams.warehouseId);
    }
  }, [routeParams?.warehouseId]);

  const isAllWarehouses = scope.warehouseId === undefined;

  const listParams = (extra?: Record<string, unknown>): Record<string, unknown> =>
    isAllWarehouses && selectedWarehouseId !== undefined ? { ...extra, warehouseId: selectedWarehouseId } : { ...extra };

  const visibleWarehouseSummary = selectedWarehouseId
    ? WAREHOUSE_SUMMARY.filter((w) => w.id === selectedWarehouseId)
    : WAREHOUSE_SUMMARY;

  const visibleRecentOrders = selectedWarehouseId
    ? RECENT_ORDERS_BY_WH.filter((o) => o.warehouseId === selectedWarehouseId)
    : RECENT_ORDERS_BY_WH;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {isAllWarehouses ? (
          // Main Warehouse Header (Matches M5-01 Customer Orders design)
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.titleWrap}>
                {onBack ? (
                  <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
                    <BackArrowIcon />
                  </TouchableOpacity>
                ) : null}
                <GridMenuIcon />
                <Text style={styles.headerTitle}>Customer Orders</Text>
              </View>
              <TouchableOpacity style={styles.bellBtn} activeOpacity={0.75}>
                <BellIcon />
              </TouchableOpacity>
            </View>

            <WarehouseSelector
              scope={scope}
              options={warehouseOptions}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
            />
          </View>
        ) : (
          // Sub Warehouse Header (unchanged)
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.titleWrap}>
                <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
                  <BackArrowIcon />
                </TouchableOpacity>
                <ReceiptHeaderIcon />
                <Text style={styles.headerTitle}>Orders</Text>
              </View>
              <TouchableOpacity style={styles.bellBtn} activeOpacity={0.75}>
                <BellIcon />
              </TouchableOpacity>
            </View>

            <View style={styles.warehousePill}>
              <LockSmallIcon />
              <Text style={styles.warehousePillText}>{scope.warehouseName ?? '—'} · Assigned Warehouse</Text>
            </View>
          </View>
        )}

        {isAllWarehouses ? (
          // Main Warehouse Content (Matches M5-01 Customer Orders design)
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 4 KPI Cards (2x2 Grid) - Static */}
            <View style={styles.mainKpiGrid}>
              <View style={styles.mainKpiCard}>
                <Text style={styles.mainKpiLabel}>TOTAL ORDERS</Text>
                <Text style={styles.mainKpiValue}>48</Text>
              </View>

              <View style={styles.mainKpiCard}>
                <Text style={styles.mainKpiLabel}>NEW ORDERS</Text>
                <Text style={styles.mainKpiValue}>8</Text>
              </View>

              <View style={styles.mainKpiCard}>
                <Text style={styles.mainKpiLabel}>READY PICKUP</Text>
                <Text style={styles.mainKpiValue}>9</Text>
              </View>

              <View style={styles.mainKpiCard}>
                <Text style={styles.mainKpiLabel}>ISSUES</Text>
                <Text style={styles.mainKpiValue}>2</Text>
              </View>
            </View>

            {/* Warehouse Order Summary */}
            <View style={styles.mainSectionHeaderRow}>
              <Text style={styles.mainSectionTitle}>Warehouse Order Summary</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('M5S02', listParams())}>
                <Text style={styles.mainViewLinkText}>View →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.whSummaryList}>
              {visibleWarehouseSummary.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.whSummaryCard}
                  activeOpacity={0.75}
                  onPress={() => onNavigate?.('M5S02', { warehouseId: item.id })}
                >
                  <Text style={styles.whSummaryName}>{item.name}</Text>
                  <View style={styles.orderCountBadge}>
                    <Text style={styles.orderCountBadgeText}>{item.orders} Orders</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Needs Attention */}
            <View style={styles.mainSectionHeaderRow}>
              <Text style={styles.mainSectionTitle}>Needs Attention</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onNavigate?.('M5S05', { orderId: 'ORD-1024', step: 'shortage' })}
              >
                <Text style={styles.mainViewLinkText}>View →</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.needsAttentionCard}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S05', { orderId: 'ORD-1024', step: 'shortage' })}
            >
              <View style={styles.needsAttentionAccent} />
              <View style={styles.needsAttentionInner}>
                <WarningTriangleAccentIcon />
                <View style={styles.needsAttentionTextWrap}>
                  <Text style={styles.needsAttentionTitle}>Stock Shortage — 1 order</Text>
                  <Text style={styles.needsAttentionSubtitle}>Requires review before packing</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Quick Actions */}
            <Text style={styles.mainSectionTitleStandalone}>Quick Actions</Text>
            <View style={styles.mainQuickActionsRow}>
              <TouchableOpacity
                style={styles.mainQuickActionCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S02', listParams())}
              >
                <View style={styles.mainQuickActionIconWrap}>
                  <ViewOrdersReceiptIcon />
                </View>
                <Text style={styles.mainQuickActionLabel}>View Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainQuickActionCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S09')}
              >
                <View style={styles.mainQuickActionIconWrap}>
                  <ShelfPickupIcon />
                </View>
                <Text style={styles.mainQuickActionLabel}>Ready for Pickup</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Orders */}
            <Text style={styles.mainSectionTitleStandalone}>Recent Orders</Text>
            {visibleRecentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.recentOrderCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S04', { orderId: order.id, customerName: order.customer })}
              >
                <View style={styles.recentOrderTopRow}>
                  <Text style={styles.recentOrderId}>{order.id}</Text>
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedBadgeText}>{order.status}</Text>
                  </View>
                </View>
                <Text style={styles.recentOrderCustomer}>{order.customer}</Text>
                <View style={styles.recentOrderDivider} />
                <View style={styles.recentOrderBottomRow}>
                  <Text style={styles.recentOrderMeta}>{order.warehouseName} · {order.items}</Text>
                  <Text style={styles.recentOrderAmount}>{order.amount}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        ) : (
          // Sub Warehouse Content (existing, untouched)
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderInline}>Order Status</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('M5S02', listParams())}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.statusGrid}>
              <TouchableOpacity
                style={styles.statusCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S02', listParams({ status: 'New' }))}
              >
                <View style={styles.statusCardTop}>
                  <NewBadgeIcon />
                </View>
                <Text style={styles.statusNumber}>12</Text>
                <Text style={styles.statusLabel}>New Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S02', listParams({ status: 'Confirmed' }))}
              >
                <View style={styles.statusCardTop}>
                  <CheckCircleTickIcon />
                </View>
                <Text style={styles.statusNumber}>8</Text>
                <Text style={styles.statusLabel}>Confirmed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S07', { orderId: 'ORD-1022' })}
              >
                <View style={styles.statusCardTop}>
                  <PackageBoxIcon />
                </View>
                <Text style={styles.statusNumber}>5</Text>
                <Text style={styles.statusLabel}>Packing</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statusCard} activeOpacity={0.75} onPress={() => onNavigate?.('M5S09')}>
                <View style={styles.statusCardTop}>
                  <ReadyPickupIcon />
                </View>
                <Text style={styles.statusNumber}>7</Text>
                <Text style={styles.statusLabel}>Ready for Pickup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S13', { orderId: 'ORD-1021' })}
              >
                <View style={styles.statusCardTop}>
                  <DeliveryTruckIcon />
                </View>
                <Text style={styles.statusNumber}>3</Text>
                <Text style={styles.statusLabel}>Delivery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S16', { orderId: 'ORD-1018' })}
              >
                <View style={styles.statusCardTop}>
                  <ErrorExclamationIcon />
                </View>
                <Text style={[styles.statusNumber, styles.statusNumberDanger]}>2</Text>
                <Text style={styles.statusLabel}>Order Issues</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsScrollContent}
              style={styles.pillsScrollView}
            >
              {FILTER_PILLS.map((pill) => {
                const isActive = activeFilterPill === pill;
                return (
                  <TouchableOpacity
                    key={pill}
                    style={[styles.pillBtn, isActive && styles.pillBtnActive]}
                    activeOpacity={0.75}
                    onPress={() => setActiveFilterPill(pill)}
                  >
                    <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{pill}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.attentionHeaderRow}>
              <WarningTriangleIcon />
              <Text style={styles.attentionSectionTitle}>Needs Attention</Text>
            </View>

            <TouchableOpacity
              style={[styles.attentionCard, styles.brandLeftBorder]}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S05')}
            >
              <AttentionChecklistIcon />
              <View style={styles.attentionContent}>
                <Text style={styles.attentionTitle}>Order #ORD-1024</Text>
                <Text style={styles.attentionDesc}>Stock verification required</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.attentionCard, styles.brandLeftBorder]}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S09')}
            >
              <AttentionPersonIcon />
              <View style={styles.attentionContent}>
                <Text style={styles.attentionTitle}>Order #ORD-1020</Text>
                <Text style={styles.attentionDesc}>Ready for pickup</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.attentionCard, styles.brandLeftBorder]}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S13', { orderId: 'ORD-1021' })}
            >
              <DeliveryTruckIcon />
              <View style={styles.attentionContent}>
                <Text style={styles.attentionTitle}>Order #ORD-1021</Text>
                <Text style={styles.attentionDesc}>Prepare for delivery</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.attentionCard, styles.dangerLeftBorder]}
              activeOpacity={0.75}
              onPress={() => onNavigate?.('M5S16')}
            >
              <ErrorExclamationIcon />
              <View style={styles.attentionContent}>
                <Text style={styles.attentionTitle}>Order #ORD-1018</Text>
                <Text style={styles.attentionDesc}>Quantity issue</Text>
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>Today's Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>24</Text>
                <Text style={styles.summaryLabel}>TODAY'S ORDERS</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>16</Text>
                <Text style={styles.summaryLabel}>COMPLETED</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>8</Text>
                <Text style={styles.summaryLabel}>PENDING</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.75} onPress={() => onNavigate?.('M5S02', listParams())}>
                <View style={styles.quickActionIconWrap}>
                  <ViewOrdersReceiptIcon />
                </View>
                <Text style={styles.quickActionText}>View Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.75} onPress={() => onNavigate?.('M5S09')}>
                <View style={styles.quickActionIconWrap}>
                  <AttentionPersonIcon />
                </View>
                <Text style={styles.quickActionText}>Ready for Pickup</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.75} onPress={() => onNavigate?.('M5S16')}>
                <View style={styles.quickActionIconWrap}>
                  <ErrorExclamationIcon />
                </View>
                <Text style={styles.quickActionText}>Order Issues</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
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
    paddingTop: 14,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },

  warehousePill: {
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 4.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  warehousePillText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
  },
  mainKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainKpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  mainKpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mainKpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  mainSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  mainSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  mainSectionTitleStandalone: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 6,
    marginBottom: 10,
  },
  mainViewLinkText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
    fontWeight: '600',
  },
  whSummaryList: {
    gap: 10,
    marginBottom: 16,
  },
  whSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  whSummaryName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
  orderCountBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  orderCountBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '600',
  },
  needsAttentionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  needsAttentionAccent: {
    width: 4.5,
    backgroundColor: adminColors.brand,
  },
  needsAttentionInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  needsAttentionTextWrap: {
    flex: 1,
  },
  needsAttentionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
  },
  needsAttentionSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  mainQuickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  mainQuickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  mainQuickActionIconWrap: {
    marginBottom: 8,
  },
  mainQuickActionLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
    textAlign: 'center',
  },
  recentOrderCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  recentOrderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recentOrderId: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
  },
  confirmedBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  confirmedBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
    fontWeight: '600',
  },
  recentOrderCustomer: {
    ...adminType.body,
    color: adminColors.muted,
  },
  recentOrderDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
  recentOrderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentOrderMeta: {
    ...adminType.body,
    color: adminColors.muted,
  },
  recentOrderAmount: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '700',
  },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: 10,
    marginTop: adminSpacing.xs,
  },
  sectionHeaderInline: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: adminSpacing.xs,
  },
  viewAllText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  statusCardTop: {
    height: 22,
    justifyContent: 'center',
    marginBottom: 6,
  },
  newBadgeChip: {
    borderWidth: 1.3,
    borderColor: adminColors.brandDeep,
    borderRadius: 3.5,
    paddingHorizontal: adminSpacing.xs,
    paddingVertical: 1,
    height: 15,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadgeText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    letterSpacing: 0.6,
    includeFontPadding: false,
    textAlign: 'center',
  },
  statusNumber: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  statusNumberDanger: {
    color: adminColors.danger.text,
  },
  statusLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 1,
  },
  pillsScrollView: {
    marginBottom: 18,
    marginHorizontal: -adminSpacing.lg,
  },
  pillsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    gap: adminSpacing.sm,
  },
  pillBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 7,
  },
  pillBtnActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  pillText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  pillTextActive: {
    color: adminColors.onBrand,
  },
  attentionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  attentionSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  attentionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  brandLeftBorder: {
    borderLeftWidth: 4.5,
    borderLeftColor: adminColors.brand,
  },
  dangerLeftBorder: {
    borderLeftWidth: 4.5,
    borderLeftColor: adminColors.danger.text,
  },
  attentionContent: {
    flex: 1,
  },
  attentionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  attentionDesc: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  summaryLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconWrap: {
    marginBottom: 6,
  },
  quickActionText: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 28,
  },
});

