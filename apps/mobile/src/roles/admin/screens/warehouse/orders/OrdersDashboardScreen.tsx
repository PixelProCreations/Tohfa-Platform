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
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import type { OrderScreenBaseProps } from './types';

interface WarehouseOption {
  id: string;
  name: string;
}

export interface OrdersDashboardScreenProps extends OrderScreenBaseProps {
  /** Warehouses offered by the Main-view selector. Ignored when `scope.warehouseId` is set. */
  warehouses?: WarehouseOption[] | undefined;
}

/**
 * Neutral placeholder until the host passes the real warehouse list. The ids
 * match the mock orders in OrdersListScreen so a tapped warehouse opens a
 * non-empty list.
 */
const DEFAULT_WAREHOUSES: WarehouseOption[] = [
  { id: 'WH-COON', name: 'Warehouse 1' },
  { id: 'WH-2', name: 'Warehouse 2' },
  { id: 'WH-3', name: 'Warehouse 3' },
  { id: 'WH-4', name: 'Warehouse 4' },
];

/** Mock per-warehouse order counts, applied to warehouses by position. */
const MOCK_WAREHOUSE_ORDER_COUNTS = [16, 12, 8, 12];

/** Mock all-warehouse fulfilment summary (OrderFulfilmentOperationsScreen). */
const FULFILMENT_SUMMARY = [
  { label: 'Packing', value: 42, isAlert: false },
  { label: 'Ready for Pickup', value: 86, isAlert: false },
  { label: 'Dispatched', value: 154, isAlert: false },
  { label: 'Exceptions', value: 3, isAlert: true },
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
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" stroke={adminColors.brand} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 8h8M8 12h8M8 16h5" stroke={adminColors.brand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Main-only sections ─────────────────────────────────────────────────────

interface WarehouseSelectorProps {
  warehouses: WarehouseOption[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
}

/** Header chips for the all-warehouse view. `undefined` = all warehouses. */
function WarehouseSelector({ warehouses, selectedId, onSelect }: WarehouseSelectorProps) {
  const options: { id: string | undefined; name: string }[] = [{ id: undefined, name: 'All warehouses' }, ...warehouses];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.whChipRow}>
      {options.map((wh) => {
        const isActive = wh.id === selectedId;
        return (
          <TouchableOpacity
            key={wh.id ?? 'all'}
            style={[styles.whChip, isActive && styles.whChipActive]}
            activeOpacity={0.8}
            onPress={() => onSelect(wh.id)}
          >
            <BuildingWarehouseIcon color={isActive ? adminColors.brand : adminColors.onBrand} />
            <Text style={[styles.whChipText, isActive && styles.whChipTextActive]}>{wh.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

interface WarehouseBreakdownProps {
  warehouses: WarehouseOption[];
  selectedId: string | undefined;
  onOpen: (warehouseId: string) => void;
}

/** Per-warehouse order counts (MainWarehouseCustomerOrdersScreen "Warehouse Order Summary"). */
function WarehouseBreakdown({ warehouses, selectedId, onOpen }: WarehouseBreakdownProps) {
  const rows = warehouses
    .map((wh, index) => ({ ...wh, count: MOCK_WAREHOUSE_ORDER_COUNTS[index % MOCK_WAREHOUSE_ORDER_COUNTS.length] ?? 0 }))
    .filter((wh) => selectedId === undefined || wh.id === selectedId);

  return (
    <>
      <Text style={styles.sectionHeader}>Warehouse Order Summary</Text>
      <View style={styles.breakdownList}>
        {rows.map((wh) => (
          <TouchableOpacity key={wh.id} style={styles.breakdownCard} activeOpacity={0.75} onPress={() => onOpen(wh.id)}>
            <Text style={styles.breakdownName}>{wh.name}</Text>
            <View style={styles.breakdownBadge}>
              <Text style={styles.breakdownBadgeText}>{wh.count} Orders</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

/** All-warehouse fulfilment pipeline (OrderFulfilmentOperationsScreen summary table). */
function FulfilmentSummary({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <Text style={styles.sectionHeader}>Order Fulfilment Summary</Text>
      <View style={styles.fulfilmentCard}>
        {FULFILMENT_SUMMARY.map((row, index) => {
          const isLast = index === FULFILMENT_SUMMARY.length - 1;
          return (
            <TouchableOpacity
              key={row.label}
              style={[styles.fulfilmentRow, !isLast && styles.fulfilmentRowBorder]}
              activeOpacity={0.7}
              onPress={onOpen}
            >
              <Text style={styles.fulfilmentLabel}>{row.label}</Text>
              <View style={styles.fulfilmentValueWrap}>
                <Text style={[styles.fulfilmentValue, row.isAlert && styles.fulfilmentValueAlert]}>{row.value}</Text>
                <ChevronRightIcon />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export function OrdersDashboardScreen({ scope, onBack, onNavigate, warehouses = DEFAULT_WAREHOUSES }: OrdersDashboardScreenProps) {
  const [activeFilterPill, setActiveFilterPill] = useState('All');
  // Main view only: which warehouse the all-warehouse cards are narrowed to.
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  const isAllWarehouses = scope.warehouseId === undefined;

  // The list screen filters by warehouse itself for a Sub admin; for Main we
  // pass the selector's choice along so the list opens on the same warehouse.
  const listParams = (extra?: Record<string, unknown>): Record<string, unknown> =>
    isAllWarehouses && selectedWarehouseId !== undefined ? { ...extra, warehouseId: selectedWarehouseId } : { ...extra };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

          {isAllWarehouses ? (
            <WarehouseSelector warehouses={warehouses} selectedId={selectedWarehouseId} onSelect={setSelectedWarehouseId} />
          ) : (
            <View style={styles.warehousePill}>
              <LockSmallIcon />
              <Text style={styles.warehousePillText}>{scope.warehouseName ?? '—'} · Assigned Warehouse</Text>
            </View>
          )}
        </View>

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

          {isAllWarehouses ? (
            <>
              <WarehouseBreakdown
                warehouses={warehouses}
                selectedId={selectedWarehouseId}
                onOpen={(warehouseId) => onNavigate?.('M5S02', { warehouseId })}
              />
              <FulfilmentSummary onOpen={() => onNavigate?.('M5S02', listParams())} />
            </>
          ) : null}

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
    marginBottom: adminSpacing.sm,
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
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    // Was a translucent overlay; no translucent token, so a solid brandDeep chip.
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warehousePill: {
    alignSelf: 'flex-start',
    // Was a translucent overlay (fill and stroke); no translucent token, so a solid brandDeep pill without a stroke.
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
    color: adminColors.onBrand,
    fontSize: 11.5,
    fontWeight: '700',
  },
  whChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginTop: 2,
  },
  whChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    // Was a translucent overlay in the Main design; no translucent token, so a solid brandDeep chip.
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.full,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 6,
  },
  whChipActive: {
    backgroundColor: adminColors.card,
  },
  whChipText: {
    color: adminColors.onBrand,
    fontSize: 11.5,
    fontWeight: '700',
  },
  whChipTextActive: {
    color: adminColors.brand,
  },
  content: {
    flex: 1,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
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
    fontSize: 8.5,
    fontWeight: '800',
    color: adminColors.brandDeep,
    letterSpacing: 0.6,
    includeFontPadding: false,
    lineHeight: 11,
    textAlign: 'center',
  },
  statusNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: adminColors.ink,
  },
  statusNumberDanger: {
    color: adminColors.danger.text,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
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
  breakdownList: {
    gap: 10,
    marginBottom: 18,
  },
  breakdownCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...adminShadow.sm,
  },
  breakdownName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  breakdownBadge: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.full,
    paddingHorizontal: 10,
    paddingVertical: adminSpacing.xs,
  },
  breakdownBadgeText: {
    ...adminType.caption,
    color: adminColors.success.text,
  },
  fulfilmentCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    marginBottom: 18,
    ...adminShadow.sm,
  },
  fulfilmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.md,
  },
  fulfilmentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  fulfilmentLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  fulfilmentValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
  },
  fulfilmentValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  fulfilmentValueAlert: {
    color: adminColors.danger.text,
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
    fontSize: 11.5,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 28,
  },
});
