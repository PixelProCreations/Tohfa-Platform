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
 *   - View Invoice (menu, M5S18): `invoice.view_own`, and only when the order
 *     carries an invoice id (orderInvoiceEntry, BR-36).
 *   - Report Issue (M5S16) and Cancel Order (M5S17): ungated, as in the design.
 *     docs/rbac.json has no order-issue or order-cancel permission (spec gap);
 *     OrdersFlow decides whether those routes open (availability.ts).
 *   - Assign to warehouse: `order.warehouse.assign` (POST
 *     /admin/orders/{id}/assign-warehouse), the outermost gate of that section.
 *   - Check Stock (M5S05) is the design's primary button and always renders.
 */
// Design id: M5S04 (M5S04_OrderDetail)
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, RefreshControl } from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { adminColors, adminOverlay, adminType, adminRadius, adminSpacing, adminShadow } from '../../../theme';
import { adminErrorKey } from '../../../api/errors';
import type { AssignWarehouseBody } from '../../../api/orders';
import { t, type TranslationKey } from '../../../i18n';
import { ADMIN_NO_VALUE } from '../../../utils/noValue';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { nextOrderAction, orderInvoiceEntry } from './mappers';
import type { LiveOrderAction } from './useOrdersData';
import type {
  OrderDetailView,
  OrderNextAction,
  OrderScreenBaseProps,
  OrdersLiveStateProps,
  OrdersWarehouseSelector,
} from './types';

export interface OrderDetailScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** The warehouses an order can be assigned to (uuid ids); only their ids and names are used. */
  warehouseOptions?: OrdersWarehouseSelector['warehouseOptions'];
  /** POST /admin/orders/{id}/assign-warehouse. */
  assign?: LiveOrderAction<AssignWarehouseBody> | undefined;
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
  order,
  can,
  onBack,
  onNavigate,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  warehouseOptions,
  assign,
}: OrderDetailScreenProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });

  if (view !== 'ready' || order === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
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
  const assignableWarehouses = (warehouseOptions ?? []).flatMap((w) =>
    w.warehouseId === undefined ? [] : [{ id: w.warehouseId, name: w.warehouseName ?? ADMIN_NO_VALUE }],
  );
  const selectedWarehouseName = assignableWarehouses.find((w) => w.id === selectedWarehouseId)?.name ?? ADMIN_NO_VALUE;
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

  const invoiceEntry = orderInvoiceEntry(order, can);

  const openFromMenu = (screen: string) => {
    setShowMenu(false);
    onNavigate?.(screen, { orderId: order.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
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
          <Text style={styles.sectionHeader}>{t('ordersLive.detail.orderSummary')}</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.orderId')}</Text>
                <Text style={styles.colValue}>{order.orderNumber}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.orderDate')}</Text>
                <Text style={styles.colValue}>{order.placedLabel}</Text>
              </View>
            </View>

            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.status')}</Text>
                <Text style={styles.colValue}>{order.statusLabel}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.warehouse')}</Text>
                <Text style={styles.colValue}>{order.warehouseName}</Text>
              </View>
            </View>
          </View>

          {can('order.warehouse.assign') ? (
            !isAssignOpen ? (
              <TouchableOpacity
                style={styles.assignToWarehouseBtn}
                onPress={() => setIsAssignOpen(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('ordersLive.detail.assignButton')}
              >
                <Text style={styles.assignToWarehouseBtnText}>{t('ordersLive.detail.assignButton')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.assignSectionWrap}>
                <Text style={styles.sectionHeader}>{t('ordersLive.detail.assignTitle')}</Text>
                <View style={styles.card}>
                  <Text style={styles.assignFieldLabel}>
                    {t('ordersLive.detail.assignLabel')} <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>

                  <TouchableOpacity
                    style={styles.dropdownSelector}
                    onPress={() => setShowWarehousePicker(true)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('ordersLive.detail.assignLabel')}
                  >
                    <Text style={styles.dropdownText}>{selectedWarehouseName}</Text>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M6 9l6 6 6-6"
                        stroke={adminColors.ink}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>

                  {assign?.error !== null && assign?.error !== undefined ? (
                    <Text style={styles.assignErrorText}>{t(adminErrorKey(assign.error))}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.assignOrderSubmitBtn}
                    disabled={assign === undefined || assign.isPending || selectedWarehouseId === undefined}
                    onPress={() => {
                      if (assign === undefined || selectedWarehouseId === undefined) return;
                      assign.run({ warehouseId: selectedWarehouseId }, () => setIsAssignOpen(false));
                    }}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t('ordersLive.detail.assignSubmit')}
                  >
                    <Text style={styles.assignOrderSubmitBtnText}>
                      {assign?.isPending === true ? t('orders.action.saving') : t('ordersLive.detail.assignSubmit')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          ) : null}

          <Text style={styles.sectionHeader}>{t('ordersLive.detail.customerSection')}</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.customer')}</Text>
                <Text style={styles.colValue}>{order.buyerName}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.phone')}</Text>
                <Text style={styles.colValue}>{order.buyerMobileMasked ?? t('orders.noValue')}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('ordersLive.detail.fulfillmentSection')}</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.fulfillment')}</Text>
                <Text style={styles.colValue}>{order.fulfilmentLabel}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{order.fulfilment === 'delivery' ? t('orders.detail.deliveryDate') : t('ordersLive.detail.pickupWarehouse')}</Text>
                <Text style={styles.colValue}>
                  {order.fulfilment === 'delivery' ? order.deliveryDateLabel ?? t('orders.noValue') : order.warehouseName}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('ordersLive.detail.orderItems', { count: order.itemCount })}</Text>
          <View style={styles.card}>
            {order.lines.length === 0 ? <AdminEmptyState variant="compact" iconName={null} title={t('orders.empty.lines')} /> : null}
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

          <Text style={styles.sectionHeader}>{t('ordersLive.detail.amount')}</Text>
          <View style={styles.card}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>{t('ordersLive.detail.subtotal')}</Text>
              <Text style={styles.amountValue}>{order.totals.subtotalLabel}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>{t('ordersLive.detail.discount')}</Text>
              <Text style={styles.amountValue}>{order.totals.discountLabel}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>{t('ordersLive.detail.gst')}</Text>
              <Text style={styles.amountValue}>{order.totals.gstLabel}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>{t('ordersLive.detail.deliveryFee')}</Text>
              <Text style={styles.amountValue}>{order.totals.deliveryFeeLabel}</Text>
            </View>

            <View style={styles.amountDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('ordersLive.detail.total')}</Text>
              <Text style={styles.totalValue}>{order.totals.totalLabel}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('ordersLive.detail.payment')}</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.paymentStatus')}</Text>
                <Text style={styles.colValue}>{order.paymentStatusLabel}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.paymentMethod')}</Text>
                <Text style={styles.colValue}>{order.paymentMethodLabel}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('ordersLive.detail.pickupInfo')}</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.pickupStatus')}</Text>
                <Text style={styles.colValue}>{pickupStatus}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.pickupOtp')}</Text>
                <Text style={styles.colValue}>{otpState}</Text>
              </View>
            </View>
            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>{t('ordersLive.detail.pickupType')}</Text>
                <Text style={styles.colValue}>{ADMIN_NO_VALUE}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('ordersLive.detail.notes')}</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>{ADMIN_NO_VALUE}</Text>
          </View>

          <View style={styles.timelineHeaderRow}>
            <Text style={styles.sectionHeaderPlain}>{t('ordersLive.detail.timeline')}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('M5S15', { orderId: order.id })}>
              <Text style={styles.viewTimelineLink}>{t('ordersLive.detail.viewTimeline')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            {timelinePreview.length === 0 ? <AdminEmptyState variant="compact" iconName={null} title={t('orders.empty.timeline')} /> : null}
            {timelinePreview.map((event, index) => (
              <View key={event.key} style={styles.timelineRow}>
                <View style={styles.timelineIndicatorCol}>
                  <TimelineCheckDot />
                  <View style={index < timelinePreview.length - 1 ? styles.timelineDoneLine : styles.timelinePendingLine} />
                </View>
                <View style={styles.timelineTextCol}>
                  <Text style={styles.timelineTitle}>{event.label}</Text>
                  <Text style={styles.timelineTime}>{event.atLabel}</Text>
                </View>
              </View>
            ))}
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelinePendingDot />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitlePending}>{t('ordersLive.detail.stockChecked')}</Text>
                <Text style={styles.timelineTime}>{ADMIN_NO_VALUE}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          {next !== null ? (
            <TouchableOpacity
              style={styles.primaryCheckBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.(next.screen, { orderId: order.id, step: next.step })}
            >
              <ChecklistIcon />
              <Text style={styles.primaryCheckBtnText}>{t(NEXT_ACTION_LABEL[next.kind])}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.primaryCheckBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S05', { orderId: order.id })}
          >
            <ChecklistIcon />
            <Text style={styles.primaryCheckBtnText}>{t('ordersLive.detail.checkStock')}</Text>
          </TouchableOpacity>

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.outlineHalfBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S16', { orderId: order.id })}
            >
              <Text style={styles.outlineHalfBtnText}>{t('ordersLive.detail.reportIssue')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineHalfBtn}
              activeOpacity={0.8}
              onPress={() => onNavigate?.('M5S17', { orderId: order.id })}
            >
              <Text style={styles.outlineHalfBtnText}>{t('ordersLive.detail.cancelOrder')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showWarehousePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWarehousePicker(false)}
        >
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowWarehousePicker(false)}>
            <View style={styles.pickerSheet}>
              <Text style={styles.pickerTitle}>{t('ordersLive.detail.assignPickerTitle')}</Text>
              {assignableWarehouses.map((wh) => (
                <TouchableOpacity
                  key={wh.id}
                  style={[styles.pickerOption, selectedWarehouseId === wh.id && styles.pickerOptionActive]}
                  onPress={() => {
                    setSelectedWarehouseId(wh.id);
                    setShowWarehousePicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, selectedWarehouseId === wh.id && styles.pickerOptionTextActive]}>
                    {wh.name}
                  </Text>
                  {selectedWarehouseId === wh.id ? (
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path d="M5 13l4 4L19 7" stroke={adminColors.brand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          {/* Was a translucent overlay; no translucent token, so the scrim is transparent and the sheet carries adminShadow.lg. */}
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={styles.menuSheet}>
              <Text style={styles.menuTitle}>{t('ordersLive.detail.menuTitle')}</Text>

              {invoiceEntry !== undefined ? (
                <TouchableOpacity style={styles.modalOption} onPress={() => openFromMenu('M5S18')}>
                  <Text style={styles.modalOptionText}>{t('orders.menu.viewInvoice')}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.modalOption} onPress={() => openFromMenu('M5S15')}>
                <Text style={styles.modalOptionText}>{t('ordersLive.detail.statusHistory')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalOption, styles.modalOptionLast]} onPress={() => openFromMenu('M5S17')}>
                <Text style={[styles.modalOptionText, styles.modalOptionDanger]}>{t('ordersLive.detail.cancelOrder')}</Text>
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
    backgroundColor: adminOverlay.headerMoreButton,
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
    backgroundColor: adminColors.warehouse.warmCanvas,
    gap: 10,
  },
  primaryCheckBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCheckBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  // Assign to warehouse (design M5S04).
  assignToWarehouseBtn: {
    height: 44,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
  },
  assignToWarehouseBtnText: { ...adminType.rowTitle, color: adminColors.brandDeep, fontWeight: '600' },
  assignSectionWrap: { marginBottom: 4 },
  assignFieldLabel: { ...adminType.rowMeta, color: adminColors.ink, fontWeight: '600', marginBottom: 8 },
  requiredAsterisk: { color: adminColors.danger.text, fontWeight: '700' },
  assignErrorText: { ...adminType.rowMeta, color: adminColors.danger.text, marginBottom: 10 },
  dropdownSelector: {
    height: 44,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  dropdownText: { ...adminType.body, color: adminColors.ink, fontWeight: '500' },
  assignOrderSubmitBtn: {
    height: 42,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignOrderSubmitBtnText: { ...adminType.rowTitle, color: adminColors.brandDeep, fontWeight: '600' },
  pickerOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  pickerSheet: {
    width: '100%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: 20,
    ...adminShadow.lg,
  },
  pickerTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: 14 },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: adminRadius.sm,
    marginBottom: 4,
  },
  pickerOptionActive: { backgroundColor: adminColors.brandTint },
  pickerOptionText: { ...adminType.body, color: adminColors.ink },
  pickerOptionTextActive: { color: adminColors.brand, fontWeight: '700' },
  timelinePendingLine: { width: 2, flex: 1, backgroundColor: adminColors.border, marginVertical: 3 },
  timelineTitlePending: { ...adminType.body, fontWeight: '700', color: adminColors.muted },
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
  modalOptionDanger: { color: adminColors.danger.text },
  notesText: { ...adminType.body, color: adminColors.ink },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineHalfBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1.2,
    borderColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineHalfBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  modalOptionText: { ...adminType.sectionHead, color: adminColors.ink },
});
