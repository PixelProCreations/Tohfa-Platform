/**
 * Order Detail — everything about one customer order, with the next actions
 * (check stock, report an issue, cancel) and a menu for invoice and history.
 *
 * Gates (docs/rbac.json; the server re-checks every action, CLAUDE.md 2.1):
 *   - Cancel Order (bottom bar and menu): docs/rbac.json has NO order-cancel
 *     permission, so both entries stay ungated exactly as before. Spec gap,
 *     reported for SPEC_GAPS.md; do not invent a code here.
 *   - This screen has no warehouse assign / reassign control, so
 *     `order.warehouse.assign` is not consulted.
 */
// Design id: M5S04 (M5S04_OrderDetail)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal, StatusBar, ActivityIndicator } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getAdminOrder } from '../../../api/orders';
import { formatMoney, formatOrderTime, gradeDisplayLabel, orderStatusLabel, paymentStatusLabel, toOrderDetailLines } from './mappers';
import type { OrderScreenBaseProps } from './types';

export interface OrderDetailScreenProps extends OrderScreenBaseProps {
  customerName?: string | undefined;
}

const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MoreDotsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="6" r="1.8" fill={adminColors.onBrand} />
      <Circle cx="12" cy="12" r="1.8" fill={adminColors.onBrand} />
      <Circle cx="12" cy="18" r="1.8" fill={adminColors.onBrand} />
    </Svg>
  );
}

function TimelineCheckDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={adminColors.success.text} />
      <Path d="M8 12l3 3 5-5" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TimelinePendingDot() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.muted} strokeWidth="2" fill={adminColors.canvas} />
    </Svg>
  );
}

function ChecklistIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path
        d="M7 8.5l1.8 1.8 3.5-3.5M14 9h3M7 14.5h10M7 17.5h6"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export function OrderDetailScreen({
  orderId,
  customerName,
  scope,
  onBack,
  onNavigate,
}: OrderDetailScreenProps) {
  const [showMenu, setShowMenu] = useState(false);

  const orderQuery = useAdminQuery(
    adminKeys.detail('orders', orderId ?? ''),
    (signal) => getAdminOrder(orderId!, signal),
    { enabled: !!orderId },
  );

  const openFromMenu = (screen: string) => {
    setShowMenu(false);
    onNavigate?.(screen, { orderId });
  };

  if (!orderId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Detail</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ ...adminType.body, color: adminColors.muted }}>No order selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{orderId}</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={adminColors.brand} />
          <Text style={{ ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.md }}>
            Loading order details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;

  if (orderQuery.error || !order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
            <BackArrowIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{orderId}</Text>
        </View>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: adminSpacing.lg }]}>
          <Text style={{ ...adminType.body, color: adminColors.muted, marginBottom: adminSpacing.md }}>
            Failed to load order details
          </Text>
          <TouchableOpacity
            style={styles.primaryCheckBtn}
            activeOpacity={0.8}
            onPress={() => orderQuery.refetch()}
          >
            <Text style={styles.primaryCheckBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayId = order.orderNumber;
  const displayDate = formatOrderTime(order.placedAt);
  const displayCustomer = order.buyer?.name || customerName || '—';
  const displayPhone = order.buyer?.mobileMasked || '—';
  const displayStatus = orderStatusLabel(order.status);
  const warehouseName = order.warehouse?.name ?? scope.warehouseName ?? '—';
  const orderItemsList = toOrderDetailLines(order.items);
  const subtotal = formatMoney(order.totals.subtotal);
  const discount = formatMoney(order.totals.discount);
  const gst = formatMoney(order.totals.gst);
  const deliveryFee = formatMoney(order.totals.deliveryFee);
  const total = formatMoney(order.totals.total);
  const displayPaymentStatus = paymentStatusLabel(order.paymentStatus);
  const displayPaymentMethod = order.paymentMethod;
  const fulfillmentLabel = order.fulfilmentType === 'PICKUP' ? 'Warehouse Pickup' : 'Home Delivery';
  const otpStatus = order.fulfilment.otpRequired ? 'Verification required' : 'Not required';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
              <BackArrowIcon />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{displayId}</Text>
              <View style={styles.headerStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerStatusText}>{displayStatus}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7} onPress={() => setShowMenu(true)}>
            <MoreDotsIcon />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeader}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order ID</Text>
                <Text style={styles.colValue}>{displayId}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Date</Text>
                <Text style={styles.colValue}>{displayDate}</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Status</Text>
                <Text style={styles.colValue}>{displayStatus}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Warehouse</Text>
                <Text style={styles.colValue}>{warehouseName}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Customer</Text>
                <Text style={styles.colValue}>{displayCustomer}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Phone</Text>
                <Text style={styles.colValue}>{displayPhone}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Fulfillment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Fulfillment</Text>
                <Text style={styles.colValue}>{fulfillmentLabel}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Warehouse</Text>
                <Text style={styles.colValue}>{warehouseName}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Order Items ({orderItemsList.length})</Text>
          <View style={styles.card}>
            {orderItemsList.length === 0 ? (
              <Text style={{ ...adminType.body, color: adminColors.muted }}>No items</Text>
            ) : (
              orderItemsList.map((item, idx) => (
                <View key={`${item.name}-${idx}`}>
                  <View style={styles.orderItemHeaderRow}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    <Text style={styles.orderItemPrice}>{item.price}</Text>
                  </View>
                  <Text style={styles.orderItemSub}>{item.grade}</Text>
                  <Text style={styles.orderItemSub}>{item.qtyDetail}</Text>
                  {idx < orderItemsList.length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </View>

          <Text style={styles.sectionHeader}>Amount</Text>
          <View style={styles.card}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>{subtotal}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Discount</Text>
              <Text style={styles.amountValue}>{discount}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>GST</Text>
              <Text style={styles.amountValue}>{gst}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Delivery Fee</Text>
              <Text style={styles.amountValue}>{deliveryFee}</Text>
            </View>

            <View style={styles.amountDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Payment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Status</Text>
                <Text style={styles.colValue}>{displayPaymentStatus}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Method</Text>
                <Text style={styles.colValue}>{displayPaymentMethod}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Pickup Information</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Status</Text>
                <Text style={styles.colValue}>{displayStatus}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup OTP</Text>
                <Text style={styles.colValue}>{otpStatus}</Text>
              </View>
            </View>
            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Pickup Type</Text>
                <Text style={styles.colValue}>{fulfillmentLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.timelineHeaderRow}>
            <Text style={styles.sectionHeaderPlain}>Order Timeline</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('M5S15', { orderId })}>
              <Text style={styles.viewTimelineLink}>View full timeline</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            {order.timeline.length === 0 ? (
              <Text style={{ ...adminType.body, color: adminColors.muted }}>No timeline events</Text>
            ) : (
              order.timeline.map((evt, idx) => {
                const isLast = idx === order.timeline.length - 1;
                return (
                  <View key={idx} style={styles.timelineRow}>
                    <View style={styles.timelineIndicatorCol}>
                      <TimelineCheckDot />
                      {!isLast && <View style={styles.timelineDoneLine} />}
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineTitle}>{orderStatusLabel(evt.toStatus)}</Text>
                      <Text style={styles.timelineTime}>{formatOrderTime(evt.at)}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          {order.status === 'CONFIRMED' ? (
            <TouchableOpacity
              style={styles.primaryCheckBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S05', { orderId })}
            >
              <ChecklistIcon />
              <Text style={styles.primaryCheckBtnText}>Check Stock</Text>
            </TouchableOpacity>
          ) : order.status === 'PACKED' ? (
            <TouchableOpacity
              style={styles.primaryCheckBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S07', { orderId, step: 'confirm' })}
            >
              <ChecklistIcon />
              <Text style={styles.primaryCheckBtnText}>Ready for Pickup</Text>
            </TouchableOpacity>
          ) : order.status === 'READY_FOR_PICKUP' ? (
            <TouchableOpacity
              style={styles.primaryCheckBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S11', { orderId, step: 'verify' })}
            >
              <ChecklistIcon />
              <Text style={styles.primaryCheckBtnText}>Verify Pickup</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.outlineActionBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S16', { orderId })}
          >
            <Text style={styles.outlineActionBtnText}>Report Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelOrderBtn}
            activeOpacity={0.7}
            onPress={() => onNavigate?.('M5S17', { orderId })}
          >
            <Text style={styles.cancelOrderBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          {/* Was a translucent overlay; no translucent token, so the scrim is transparent and the sheet carries adminShadow.lg. */}
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={styles.menuSheet}>
              <Text style={styles.menuTitle}>Order Actions</Text>

              <TouchableOpacity style={styles.modalOption} onPress={() => openFromMenu('M5S18')}>
                <Text style={styles.modalOptionText}>View Invoice</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={() => openFromMenu('M5S15')}>
                <Text style={styles.modalOptionText}>Status History</Text>
              </TouchableOpacity>

              {/* Ungated: docs/rbac.json has no order-cancel permission (spec gap). */}
              <TouchableOpacity style={[styles.modalOption, styles.modalOptionLast]} onPress={() => openFromMenu('M5S17')}>
                <Text style={[styles.modalOptionText, styles.modalOptionDanger]}>Cancel Order</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// Fixed component sizes (no size token exists for these).
const BACK_BUTTON = 32;
const MORE_BUTTON = 36;
const STATUS_DOT = 7;
const SECONDARY_BUTTON_HEIGHT = 48;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: adminColors.brand },
  container: { flex: 1, backgroundColor: adminColors.canvas },
  header: {
    backgroundColor: adminColors.brand,
    paddingTop: 14,
    paddingBottom: adminSpacing.lg,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  backButton: { width: BACK_BUTTON, height: BACK_BUTTON, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { ...adminType.title, color: adminColors.onBrand },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  // Was a light mint dot on the orange header; mapped to the success tint.
  statusDot: {
    width: STATUS_DOT,
    height: STATUS_DOT,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
  },
  headerStatusText: { ...adminType.rowTitle, color: adminColors.onBrand },
  moreButton: {
    width: MORE_BUTTON,
    height: MORE_BUTTON,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: adminSpacing.lg, paddingTop: 14 },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginBottom: adminSpacing.sm,
    marginTop: 6,
  },
  sectionHeaderPlain: { ...adminType.sectionHead, color: adminColors.ink },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  rowGap: { marginTop: 14 },
  twoColRow: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flex: 1 },
  colLabel: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: 2 },
  colValue: { ...adminType.sectionHead, color: adminColors.ink },
  orderItemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItemName: { ...adminType.sectionHead, color: adminColors.ink },
  orderItemPrice: { ...adminType.sectionHead, color: adminColors.ink },
  orderItemSub: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: adminColors.border, marginVertical: adminSpacing.md },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  amountLabel: { ...adminType.body, color: adminColors.muted },
  amountValue: { ...adminType.sectionHead, color: adminColors.ink },
  amountDivider: { height: 1, backgroundColor: adminColors.border, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { ...adminType.sectionHead, color: adminColors.ink },
  totalValue: { ...adminType.title, color: adminColors.ink },
  notesText: { ...adminType.body, color: adminColors.ink },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
    marginTop: 6,
  },
  viewTimelineLink: { ...adminType.rowTitle, fontWeight: '700', color: adminColors.brand },
  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.xl,
    ...adminShadow.sm,
  },
  timelineRow: { flexDirection: 'row', minHeight: 46 },
  timelineIndicatorCol: { alignItems: 'center', width: 20, marginRight: 10 },
  timelineDoneLine: { width: 2, flex: 1, backgroundColor: adminColors.success.text, marginVertical: 3 },
  timelinePendingLine: { width: 2, flex: 1, backgroundColor: adminColors.border, marginVertical: 3 },
  timelineTextCol: { flex: 1, paddingBottom: 10 },
  timelineTitle: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  timelineTitlePending: { ...adminType.body, fontWeight: '700', color: adminColors.muted },
  timelineTime: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  bottomBar: {
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
    paddingTop: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
    gap: adminSpacing.sm,
  },
  primaryCheckBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.xs,
  },
  primaryCheckBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  outlineActionBtn: {
    height: SECONDARY_BUTTON_HEIGHT,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.card,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineActionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  cancelOrderBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  cancelOrderBtnText: {
    ...adminType.rowTitle,
    color: adminColors.danger.text,
  },
  menuOverlay: { flex: 1, justifyContent: 'flex-end' },
  menuSheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 20,
    paddingBottom: 36,
    ...adminShadow.lg,
  },
  menuTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.lg },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: adminColors.border },
  modalOptionLast: { borderBottomWidth: 0 },
  modalOptionText: { ...adminType.sectionHead, color: adminColors.ink },
  modalOptionDanger: { color: adminColors.danger.text },
});
