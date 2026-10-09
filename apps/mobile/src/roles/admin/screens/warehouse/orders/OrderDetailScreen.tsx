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
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Modal, StatusBar } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { OrderScreenBaseProps } from './types';

export interface OrderDetailScreenProps extends OrderScreenBaseProps {
  customerName?: string | undefined;
}

const SAMPLE_ORDER_ID = 'ORD-1024';
const SAMPLE_CUSTOMER = 'Arun Kumar';

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
      <Path
        d="M12 13a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM19 13a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM5 13a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z"
        fill={adminColors.onBrand}
        stroke={adminColors.onBrand}
        strokeWidth="1.5"
      />
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
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 11l3 3L22 4" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
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
  orderId = SAMPLE_ORDER_ID,
  customerName = SAMPLE_CUSTOMER,
  scope,
  onBack,
  onNavigate,
}: OrderDetailScreenProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Mock data keyed off two demo invoice ids, as in the old M5S04, until orders are wired.
  const isInv251 = orderId === 'INV-00251' || orderId === 'ORD-00251';
  const isInv238 = orderId === 'INV-00238' || orderId === 'ORD-00238';

  const displayDate = isInv251 ? '24 Sep, 10:42 AM' : isInv238 ? '20 Sep, 11:15 AM' : '24 Sep, 10:32 AM';
  const displayCustomer = customerName || (isInv251 || isInv238 ? 'Rajesh Kumar' : SAMPLE_CUSTOMER);
  const displayStatus = isInv251 || isInv238 ? 'Paid · Completed' : 'Confirmed';
  // The order's warehouse comes from the viewer's scope; no warehouse name is hard-coded.
  const warehouseName = scope.warehouseName ?? '—';

  const orderItemsList = isInv251
    ? [{ name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' }]
    : isInv238
      ? [
          { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
          { name: 'Carrot', grade: 'Grade 1', qtyDetail: '1 KG × ₹150', price: '₹150' },
          { name: 'Beans', grade: 'Grade 1', qtyDetail: '2 KG × ₹150', price: '₹300' },
        ]
      : [
          { name: 'Tomato', grade: 'Grade 1', qtyDetail: '2 KG × ₹100', price: '₹200' },
          { name: 'Carrot', grade: 'Grade 1', qtyDetail: '3 KG × ₹120', price: '₹360' },
        ];

  const subtotal = isInv251 ? '₹200' : isInv238 ? '₹650' : '₹560';
  const gst = isInv251 || isInv238 ? '₹0' : '₹28';
  const total = isInv251 ? '₹200' : isInv238 ? '₹650' : '₹588';

  const openFromMenu = (screen: string) => {
    setShowMenu(false);
    onNavigate?.(screen, { orderId });
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
              <Text style={styles.headerTitle}>{orderId}</Text>
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
                <Text style={styles.colValue}>{orderId}</Text>
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
                <Text style={styles.colValue}>+91 98765 43210</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Fulfillment</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Fulfillment</Text>
                <Text style={styles.colValue}>Warehouse Pickup</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Warehouse</Text>
                <Text style={styles.colValue}>{warehouseName}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Order Items ({orderItemsList.length})</Text>
          <View style={styles.card}>
            {orderItemsList.map((item, idx) => (
              <View key={item.name}>
                <View style={styles.orderItemHeaderRow}>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemPrice}>{item.price}</Text>
                </View>
                <Text style={styles.orderItemSub}>{item.grade}</Text>
                <Text style={styles.orderItemSub}>{item.qtyDetail}</Text>
                {idx < orderItemsList.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <Text style={styles.sectionHeader}>Amount</Text>
          <View style={styles.card}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Subtotal</Text>
              <Text style={styles.amountValue}>{subtotal}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Discount</Text>
              <Text style={styles.amountValue}>₹0</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>GST</Text>
              <Text style={styles.amountValue}>{gst}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Delivery Fee</Text>
              <Text style={styles.amountValue}>₹0</Text>
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
                <Text style={styles.colValue}>Paid</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Payment Method</Text>
                <Text style={styles.colValue}>Wallet</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Pickup Information</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup Status</Text>
                <Text style={styles.colValue}>Pending</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Pickup OTP</Text>
                <Text style={styles.colValue}>Verification required</Text>
              </View>
            </View>
            <View style={[styles.twoColRow, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.colLabel}>Order Pickup Type</Text>
                <Text style={styles.colValue}>Direct Pickup</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notesText}>Please pack tomatoes separately if possible.</Text>
          </View>

          <View style={styles.timelineHeaderRow}>
            <Text style={styles.sectionHeaderPlain}>Order Timeline</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onNavigate?.('M5S15', { orderId })}>
              <Text style={styles.viewTimelineLink}>View full timeline</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelineDoneLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Order Placed</Text>
                <Text style={styles.timelineTime}>10:32 AM</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelineCheckDot />
                <View style={styles.timelinePendingLine} />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitle}>Order Confirmed</Text>
                <Text style={styles.timelineTime}>10:34 AM</Text>
              </View>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineIndicatorCol}>
                <TimelinePendingDot />
              </View>
              <View style={styles.timelineTextCol}>
                <Text style={styles.timelineTitlePending}>Stock Checked</Text>
                <Text style={styles.timelineTime}>—</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryCheckBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S05', { orderId })}
          >
            <ChecklistIcon />
            <Text style={styles.primaryCheckBtnText}>Check Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryReportBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S16', { orderId })}
          >
            <Text style={styles.secondaryReportBtnText}>Report Issue</Text>
          </TouchableOpacity>

          {/* Ungated: docs/rbac.json has no order-cancel permission (spec gap). */}
          <TouchableOpacity
            style={styles.cancelOrderBtn}
            activeOpacity={0.8}
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
  // Was a translucent overlay (white at 22% on orange); no translucent token, so a solid brandDeep chip.
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
    paddingBottom: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    backgroundColor: adminColors.canvas,
    gap: 10,
  },
  primaryCheckBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.md,
  },
  primaryCheckBtnText: { ...adminType.sectionHead, color: adminColors.onBrand },
  secondaryReportBtn: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: SECONDARY_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryReportBtnText: { ...adminType.sectionHead, color: adminColors.brand },
  cancelOrderBtn: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.danger.text,
    height: SECONDARY_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOrderBtnText: { ...adminType.sectionHead, color: adminColors.danger.text },
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
