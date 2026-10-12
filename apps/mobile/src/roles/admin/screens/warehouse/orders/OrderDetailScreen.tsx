/**
 * Order Detail — everything about one customer order (GET
 * /admin/orders/{orderId}), with its next action and a menu for the history.
 *
 * Live data (API integration plan, phase 5): the detail is farm-anonymous and
 * carries no OTP (BR-99); the buyer's mobile is masked (BR-92). Money is shown
 * from integer paise and weight from integer grams (./mappers.ts).
 *
 * The next action follows the status (nextOrderAction): a confirmed order is
 * packed, a packed pickup order is marked ready, an order ready for pickup has
 * its pickup code verified.
 *
 * Gates (docs/rbac.json; the server re-checks every action, CLAUDE.md 2.1):
 *   - Pack: `order.mark_packed`; mark ready: `order.dispatch`; verify pickup:
 *     `order.pickup_otp.verify`. Without the code the button is not rendered.
 *   - Check Stock, Report Issue, Cancel Order and View Invoice are hidden: no
 *     stock-check endpoint, no admin issue or cancel route (docs/rbac.json has
 *     no order-cancel permission either), and order invoices are phase 7
 *     (availability.ts).
 *   - This screen has no warehouse assign / reassign control, so
 *     `order.warehouse.assign` is not consulted.
 */
// Design id: M5S04 (M5S04_OrderDetail)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal, StatusBar, RefreshControl } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { t, type TranslationKey } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { nextOrderAction } from './mappers';
import type { OrderDetailView, OrderNextAction, OrderScreenBaseProps, OrdersLiveStateProps } from './types';

export interface OrderDetailScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** The order; undefined while loading or when the route names no order the API knows. */
  order?: OrderDetailView | undefined;
}

const NEXT_ACTION_LABEL: Readonly<Record<OrderNextAction['kind'], TranslationKey>> = {
  pack: 'orders.action.pack',
  markReady: 'orders.action.markReady',
  verifyPickup: 'orders.action.verifyPickup',
};

/** How many timeline rows the card shows before "View full timeline". */
const TIMELINE_PREVIEW_ROWS = 3;

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
  order,
  can,
  onBack,
  onNavigate,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
}: OrderDetailScreenProps) {
  const [showMenu, setShowMenu] = useState(false);
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });

  if (view !== 'ready' || order === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
                <BackArrowIcon />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('orders.detail.title')}</Text>
            </View>
          </View>
          {view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={error} onRetry={onRetry} />
          ) : (
            <AdminEmptyState title={t('orders.empty.notFound')} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const next = nextOrderAction(order, can);
  const timelinePreview = order.timeline.slice(-TIMELINE_PREVIEW_ROWS);
  const pickupStatus =
    order.status === 'pickedUp' || order.status === 'delivered'
      ? t('orders.detail.pickupDone')
      : order.status === 'cancelled' || order.status === 'returned'
        ? order.statusLabel
        : t('orders.detail.pickupPending');
  const otpState = order.otpVerifiedLabel !== null
    ? t('orders.detail.otpVerified', { at: order.otpVerifiedLabel })
    : order.otpRequired
      ? t('orders.detail.otpRequired')
      : t('orders.detail.otpNotSet');

  const openFromMenu = (screen: string) => {
    setShowMenu(false);
    onNavigate?.(screen, { orderId: order.id });
  };

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
              <Text style={styles.headerTitle}>{order.orderNumber}</Text>
              <View style={styles.headerStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.headerStatusText}>{order.statusLabel}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.moreButton} activeOpacity={0.7} onPress={() => setShowMenu(true)}>
            <MoreDotsIcon />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
            ) : undefined
          }
        >
          <Text style={styles.sectionHeader}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order ID</Text>
                <Text style={styles.colValue}>{order.orderNumber}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Date</Text>
                <Text style={styles.colValue}>{order.placedLabel}</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Status</Text>
                <Text style={styles.colValue}>{order.statusLabel}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Warehouse</Text>
                <Text style={styles.colValue}>{order.warehouseName}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Customer</Text>
                <Text style={styles.colValue}>{order.buyerName}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Phone</Text>
                <Text style={styles.colValue}>{order.buyerMobileMasked ?? t('orders.noValue')}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Fulfillment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Fulfillment</Text>
                <Text style={styles.colValue}>{order.fulfilmentLabel}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{order.fulfilment === 'delivery' ? t('orders.detail.deliveryDate') : 'Pickup Warehouse'}</Text>
                <Text style={styles.colValue}>
                  {order.fulfilment === 'delivery' ? order.deliveryDateLabel ?? t('orders.noValue') : order.warehouseName}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Order Items ({order.itemCount})</Text>
          <View style={styles.card}>
            {order.lines.length === 0 ? <Text style={styles.orderItemSub}>{t('orders.empty.lines')}</Text> : null}
            {order.lines.map((item, idx) => (
              <View key={item.key}>
                <View style={styles.orderItemHeaderRow}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemPrice}>{item.lineTotalLabel}</Text>
                </View>
                <Text style={styles.orderItemSub}>{item.gradeLabel}</Text>
                <Text style={styles.orderItemSub}>{item.qtyDetail}</Text>
                {idx < order.lines.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <Text style={styles.sectionHeader}>Amount</Text>
          <View style={styles.card}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>{order.totals.subtotalLabel}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Discount</Text>
              <Text style={styles.amountValue}>{order.totals.discountLabel}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>GST</Text>
              <Text style={styles.amountValue}>{order.totals.gstLabel}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Delivery Fee</Text>
              <Text style={styles.amountValue}>{order.totals.deliveryFeeLabel}</Text>
            </View>

            <View style={styles.amountDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{order.totals.totalLabel}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Payment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Status</Text>
                <Text style={styles.colValue}>{order.paymentStatusLabel}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Method</Text>
                <Text style={styles.colValue}>{order.paymentMethodLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Pickup Information</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Status</Text>
                <Text style={styles.colValue}>{pickupStatus}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup OTP</Text>
                <Text style={styles.colValue}>{otpState}</Text>
              </View>
            </View>
          </View>

          <View style={styles.timelineHeaderRow}>
            <Text style={styles.sectionHeaderPlain}>Order Timeline</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('M5S15', { orderId: order.id })}>
              <Text style={styles.viewTimelineLink}>View full timeline</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            {timelinePreview.length === 0 ? <Text style={styles.timelineTime}>{t('orders.empty.timeline')}</Text> : null}
            {timelinePreview.map((event, index) => (
              <View key={event.key} style={styles.timelineRow}>
                <View style={styles.timelineIndicatorCol}>
                  <TimelineCheckDot />
                  {index < timelinePreview.length - 1 ? <View style={styles.timelineDoneLine} /> : null}
                </View>
                <View style={styles.timelineTextCol}>
                  <Text style={styles.timelineTitle}>{event.label}</Text>
                  <Text style={styles.timelineTime}>{event.atLabel}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {next !== null ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.primaryCheckBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.(next.screen, { orderId: order.id, step: next.step })}
            >
              <ChecklistIcon />
              <Text style={styles.primaryCheckBtnText}>{t(NEXT_ACTION_LABEL[next.kind])}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          {/* Was a translucent overlay; no translucent token, so the scrim is transparent and the sheet carries adminShadow.lg. */}
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={styles.menuSheet}>
              <Text style={styles.menuTitle}>Order Actions</Text>

              {/* View Invoice (phase 7) and Cancel Order (no admin cancel route) are hidden. */}
              <TouchableOpacity style={[styles.modalOption, styles.modalOptionLast]} onPress={() => openFromMenu('M5S15')}>
                <Text style={styles.modalOptionText}>Status History</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
  timelineTextCol: { flex: 1, paddingBottom: 10 },
  timelineTitle: { ...adminType.body, fontWeight: '700', color: adminColors.ink },
  timelineTime: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  bottomBar: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#FBF8F2',
    gap: 10,
  },
  primaryCheckBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCheckBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
});
