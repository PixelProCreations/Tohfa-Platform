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
 *
 * Live data (API integration plan, phase 5): the counts are the open order
 * tasks from GET /admin/tasks/summary (ORDER_PACK = orders confirmed and not
 * packed, ORDER_DISPATCH = packed and not yet ready, ORDER_PICKUP_OTP = ready
 * and waiting for the customer); a count that has not loaded shows as no
 * value, never 0. Figures with no API are hidden: new orders as a separate
 * state, delivery, order issues, today's summary, the Main total / issues KPIs
 * and the per-warehouse breakdown. Main's recent orders are the newest rows of
 * GET /admin/orders.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal, RefreshControl } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { t } from '../../../i18n';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { orderToneColors } from './statusTone';
import type {
  OrderListRow,
  OrderScreenBaseProps,
  OrdersLiveStateProps,
  OrdersWarehouseSelector,
  OrderTaskCounts,
} from './types';

export interface OrdersDashboardScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps, OrdersWarehouseSelector {
  /** The open order task counts; null until they load. */
  counts?: OrderTaskCounts | null | undefined;
  /** Main only: the newest orders of the selected warehouse(s). */
  recentOrders?: readonly OrderListRow[] | undefined;
}

/** How many recent orders the Main dashboard shows (a layout choice, not a business rule). */
const RECENT_ORDER_ROWS = 3;

/** A count, or the no-value mark while it has not loaded. */
function countText(value: number | undefined): string {
  return value === undefined ? t('orders.noValue') : String(value);
}

// "Issues" is gone with the order-issues area (no API).
const FILTER_PILLS = ['All', 'Confirmed', 'Packing', 'Ready', 'Completed'];

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

function ChevronDownSmallIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={adminColors.onBrand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckSmallIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={adminColors.brand} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

function BuildingWarehouseIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
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
  warehouseOptions = [],
  selectedWarehouseId,
  onSelectWarehouse,
  counts = null,
  recentOrders = [],
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: OrdersDashboardScreenProps) {
  const [activeFilterPill, setActiveFilterPill] = useState('All');
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const setSelectedWarehouseId = (id: string | undefined) => onSelectWarehouse?.(id);
  const warehouses = warehouseOptions.flatMap((w) =>
    w.warehouseId === undefined ? [] : [{ id: w.warehouseId, name: w.warehouseName ?? w.warehouseCode ?? w.warehouseId }],
  );

  const isAllWarehouses = scope.warehouseId === undefined;

  // The flow holds the Main warehouse selection, so the list it opens is already narrowed.
  const listParams = (extra?: Record<string, unknown>): Record<string, unknown> => ({ ...extra });

  const refreshControl = onRefresh ? (
    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
  ) : undefined;
  // The counts are the only data here; with none and a failure, the attention area says so.
  const countsState = counts !== null ? 'ready' : isLoading ? 'loading' : error !== null && error !== undefined ? 'error' : 'ready';

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

            <TouchableOpacity
              style={styles.dropdownBtn}
              activeOpacity={0.8}
              onPress={() => setShowWarehouseModal(true)}
            >
              <BuildingWarehouseIcon color={adminColors.onBrand} />
              <Text style={styles.dropdownBtnText}>
                {selectedWarehouseId
                  ? (warehouses.find((w) => w.id === selectedWarehouseId)?.name ?? selectedWarehouseId)
                  : 'All Warehouses'}
              </Text>
              <ChevronDownSmallIcon />
            </TouchableOpacity>

            <Modal
              visible={showWarehouseModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowWarehouseModal(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowWarehouseModal(false)}
              >
                <View style={styles.dropdownModalMenu}>
                  <Text style={styles.dropdownModalTitle}>Select Warehouse</Text>
                  <TouchableOpacity
                    style={[styles.dropdownModalItem, selectedWarehouseId === undefined && styles.dropdownModalItemActive]}
                    onPress={() => {
                      setSelectedWarehouseId(undefined);
                      setShowWarehouseModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownModalItemText,
                        selectedWarehouseId === undefined && styles.dropdownModalItemTextActive,
                      ]}
                    >
                      All Warehouses
                    </Text>
                    {selectedWarehouseId === undefined ? <CheckSmallIcon /> : null}
                  </TouchableOpacity>
                  {warehouses.map((w) => {
                    const isSelected = selectedWarehouseId === w.id;
                    return (
                      <TouchableOpacity
                        key={w.id}
                        style={[styles.dropdownModalItem, isSelected && styles.dropdownModalItemActive]}
                        onPress={() => {
                          setSelectedWarehouseId(w.id);
                          setShowWarehouseModal(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownModalItemText,
                            isSelected && styles.dropdownModalItemTextActive,
                          ]}
                        >
                          {w.name}
                        </Text>
                        {isSelected ? <CheckSmallIcon /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </TouchableOpacity>
            </Modal>
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
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
            {/* KPI cards: open order tasks. Total orders and issues have no API. */}
            <View style={styles.mainKpiGrid}>
              <View style={styles.mainKpiCard}>
                <Text style={styles.mainKpiLabel}>NEW ORDERS</Text>
                <Text style={styles.mainKpiValue}>{countText(counts?.toPack)}</Text>
              </View>

              <View style={styles.mainKpiCard}>
                <Text style={styles.mainKpiLabel}>READY PICKUP</Text>
                <Text style={styles.mainKpiValue}>{countText(counts?.awaitingPickup)}</Text>
              </View>
            </View>
            {countsState === 'error' ? <AdminErrorState error={error} onRetry={onRetry} /> : null}

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
            {recentOrders.slice(0, RECENT_ORDER_ROWS).map((order) => {
              const tone = orderToneColors(order.tone);
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.recentOrderCard}
                  activeOpacity={0.75}
                  onPress={() => onNavigate?.('M5S04', { orderId: order.id })}
                >
                  <View style={styles.recentOrderTopRow}>
                    <Text style={styles.recentOrderId}>{order.orderNumber}</Text>
                    <View style={[styles.confirmedBadge, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.confirmedBadgeText, { color: tone.text }]}>{order.statusLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.recentOrderCustomer}>{order.placedLabel}</Text>
                  <View style={styles.recentOrderDivider} />
                  <View style={styles.recentOrderBottomRow}>
                    <Text style={styles.recentOrderMeta}>{order.itemsLabel}</Text>
                    <Text style={styles.recentOrderAmount}>{order.amountLabel}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <View style={styles.bottomSpacer} />
          </ScrollView>
        ) : (
          // Sub Warehouse Content (existing, untouched)
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderInline}>Order Status</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('M5S02', listParams())}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* Open order tasks. New orders (no separate state), delivery and issues have no API. */}
            <View style={styles.statusGrid}>
              <TouchableOpacity
                style={styles.statusCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S02', listParams({ status: 'CONFIRMED' }))}
              >
                <View style={styles.statusCardTop}>
                  <CheckCircleTickIcon />
                </View>
                <Text style={styles.statusNumber}>{countText(counts?.toPack)}</Text>
                <Text style={styles.statusLabel}>Confirmed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statusCard}
                activeOpacity={0.75}
                onPress={() => onNavigate?.('M5S02', listParams({ status: 'PACKED' }))}
              >
                <View style={styles.statusCardTop}>
                  <PackageBoxIcon />
                </View>
                <Text style={styles.statusNumber}>{countText(counts?.toMarkReady)}</Text>
                <Text style={styles.statusLabel}>{t('orders.status.packed')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.statusCard} activeOpacity={0.75} onPress={() => onNavigate?.('M5S09')}>
                <View style={styles.statusCardTop}>
                  <ReadyPickupIcon />
                </View>
                <Text style={styles.statusNumber}>{countText(counts?.awaitingPickup)}</Text>
                <Text style={styles.statusLabel}>Ready for Pickup</Text>
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

            {countsState === 'loading' ? (
              <AdminLoadingState />
            ) : countsState === 'error' ? (
              <AdminErrorState error={error} onRetry={onRetry} />
            ) : counts !== null && counts.toPack + counts.toMarkReady + counts.awaitingPickup === 0 ? (
              <View style={[styles.attentionCard, styles.brandLeftBorder]}>
                <View style={styles.attentionContent}>
                  <Text style={styles.attentionTitle}>{t('orders.attention.noneTitle')}</Text>
                  <Text style={styles.attentionDesc}>{t('orders.attention.noneHint')}</Text>
                </View>
              </View>
            ) : (
              <>
                {counts !== null && counts.toPack > 0 ? (
                  <TouchableOpacity
                    style={[styles.attentionCard, styles.brandLeftBorder]}
                    activeOpacity={0.75}
                    onPress={() => onNavigate?.('M5S02', listParams({ status: 'CONFIRMED' }))}
                  >
                    <AttentionChecklistIcon />
                    <View style={styles.attentionContent}>
                      <Text style={styles.attentionTitle}>{t('orders.attention.toPack', { count: counts.toPack })}</Text>
                      <Text style={styles.attentionDesc}>{t('orders.attention.toPackHint')}</Text>
                    </View>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                ) : null}

                {counts !== null && counts.toMarkReady > 0 ? (
                  <TouchableOpacity
                    style={[styles.attentionCard, styles.brandLeftBorder]}
                    activeOpacity={0.75}
                    onPress={() => onNavigate?.('M5S02', listParams({ status: 'PACKED' }))}
                  >
                    <AttentionChecklistIcon />
                    <View style={styles.attentionContent}>
                      <Text style={styles.attentionTitle}>{t('orders.attention.toMarkReady', { count: counts.toMarkReady })}</Text>
                      <Text style={styles.attentionDesc}>{t('orders.attention.toMarkReadyHint')}</Text>
                    </View>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                ) : null}

                {counts !== null && counts.awaitingPickup > 0 ? (
                  <TouchableOpacity
                    style={[styles.attentionCard, styles.brandLeftBorder]}
                    activeOpacity={0.75}
                    onPress={() => onNavigate?.('M5S09')}
                  >
                    <AttentionPersonIcon />
                    <View style={styles.attentionContent}>
                      <Text style={styles.attentionTitle}>{t('orders.attention.awaitingPickup', { count: counts.awaitingPickup })}</Text>
                      <Text style={styles.attentionDesc}>{t('orders.attention.awaitingPickupHint')}</Text>
                    </View>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                ) : null}
              </>
            )}

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
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
    gap: 6,
    marginTop: 4,
  },
  dropdownBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: adminColors.toast.bg,
    opacity: 0.96,
    justifyContent: 'center',
    alignItems: 'center',
    padding: adminSpacing.lg,
  },
  dropdownModalMenu: {
    width: '85%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.md,
  },
  dropdownModalTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
    paddingBottom: adminSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dropdownModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.sm,
    borderRadius: adminRadius.sm,
  },
  dropdownModalItemActive: {
    backgroundColor: adminColors.brandTint,
  },
  dropdownModalItemText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  dropdownModalItemTextActive: {
    color: adminColors.brand,
    fontWeight: '700',
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
  mainSectionTitleStandalone: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 6,
    marginBottom: 10,
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
  statusNumber: {
    ...adminType.kpiValue,
    color: adminColors.ink,
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

