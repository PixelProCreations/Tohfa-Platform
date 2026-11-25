import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SalesOrderRecord {
  id: string;
  soNumber: string;
  customerName: string;
  customerId: string;
  channel: 'Online' | 'Market' | 'B2B' | 'HORECA' | 'Direct';
  status: 'In fulfilment' | 'Issue' | 'Completed' | 'Pending';
  itemCount: number;
  totalPrice: number;
  paymentStatus: string;
  warehouse: string;
  subMeta: string;
  dateTime: string;
  paymentRef: string;
  invoiceRef?: string;
  itemName: string;
  itemGrade: string;
  itemQty: number;
  itemUnitPrice: number;
  fulfilledQty: number;
  remainingQty: number;
  fulfilmentStatus: string;
  exceptionNote?: string;
}

export interface SalesOrderDetailScreenProps {
  order: SalesOrderRecord;
  onBack: () => void;
}

export function SalesOrderDetailScreen({
  order,
  onBack,
}: SalesOrderDetailScreenProps) {
  const isIssue = order.status === 'Issue' || order.fulfilmentStatus === 'Issue';
  const formattedTotal = `₹${order.totalPrice.toFixed(2)}`;

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to sales orders"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales details</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── A · Order summary ── */}
        <Text style={styles.sectionHeading}>A · Order summary</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sales order ID</Text>
            <Text style={styles.detailValueBold}>{order.soNumber}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Channel</Text>
            <Text style={styles.detailValueBold}>{order.channel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order date and time</Text>
            <Text style={styles.detailValueBold}>{order.dateTime}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order status</Text>
            <Text
              style={[
                styles.detailValueBold,
                isIssue ? { color: adminColors.danger.text } : { color: adminColors.success.text },
              ]}
            >
              {order.status}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer or business</Text>
            <Text style={styles.detailValueBold}>
              {order.customerName} ({order.customerId})
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned warehouse</Text>
            <Text style={styles.detailValueBold}>{order.warehouse}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice reference</Text>
            <Text style={styles.detailValueBold}>{order.invoiceRef || ADMIN_NO_VALUE}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Payment reference</Text>
            <Text style={styles.detailValueBold}>{order.paymentRef}</Text>
          </View>
        </View>

        {/* ── B · Customer details ── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>B · Customer details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer ID</Text>
            <Text style={styles.detailValueBold}>{order.customerId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValueBold}>{order.customerName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contact</Text>
            <Text style={styles.detailValueBold}>{ADMIN_NO_VALUE}</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Delivery or pickup reference</Text>
            <Text style={styles.detailValueBold}>{ADMIN_NO_VALUE}</Text>
          </View>
        </View>

        {/* ── C · Order items ── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>C · Order items</Text>
        <View style={[styles.card, { paddingVertical: 12 }]}>
          <Text style={styles.itemTitle}>
            {order.itemName} · {order.itemGrade}
          </Text>
          <Text style={styles.itemSubtitle}>
            Quantity {order.itemQty} kg · Unit price ₹{order.itemUnitPrice.toFixed(2)}/kg
          </Text>
          <Text style={styles.itemSubtitle}>Line total {formattedTotal}</Text>
          <Text style={styles.itemSubtitle}>
            Fulfilled {order.fulfilledQty} kg · Remaining {order.remainingQty} kg
          </Text>
        </View>
        <Text style={styles.itemFootnote}>
          Order total {formattedTotal}. Taxes, discounts and fees are shown only where the rules and data exist, and none is recorded on this order.
        </Text>

        {/* ── D · Payment summary ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>D · Payment summary</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment reference</Text>
            <Text style={styles.detailValueBold}>{order.paymentRef}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Method</Text>
            <Text style={styles.detailValueBold}>Recorded method</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment status</Text>
            <Text style={[styles.detailValueBold, { color: adminColors.success.text }]}>
              {order.paymentStatus}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount paid</Text>
            <Text style={styles.detailValueBold}>{formattedTotal}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount pending</Text>
            <Text style={styles.detailValueBold}>₹0.00</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Refund reference</Text>
            <Text style={styles.detailValueBold}>{ADMIN_NO_VALUE}</Text>
          </View>
        </View>
        <Text style={styles.itemFootnote}>
          Payment success does not mean the order is fulfilled.
        </Text>

        {/* ── E · Fulfilment ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>E · Fulfilment</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fulfilment status</Text>
            <Text
              style={[
                styles.detailValueBold,
                order.fulfilmentStatus === 'Issue' ? { color: adminColors.danger.text } : { color: adminColors.success.text },
              ]}
            >
              {order.fulfilmentStatus}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Inventory allocation reference</Text>
            <Text style={styles.detailValueBold}>Not recorded</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Warehouse</Text>
            <Text style={styles.detailValueBold}>{order.warehouse}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pickup or delivery</Text>
            <Text style={styles.detailValueBold}>{ADMIN_NO_VALUE}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Completed</Text>
            <Text style={styles.detailValueBold}>
              {order.fulfilledQty === order.itemQty ? 'Completed' : 'Not completed'}
            </Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Recorded exception</Text>
            <Text style={styles.detailValueBold}>
              {order.exceptionNote || 'None'}
            </Text>
          </View>
        </View>
        <Text style={styles.itemFootnote}>
          Stock allocation is handled by Inventory & Warehouse and Reserve & Allocation. No status-changing action is offered here.
        </Text>

        {/* ── F · Timeline ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>F · Timeline</Text>
        <View style={styles.card}>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineMeta}>{order.dateTime.split(',')[0]}, 11:00</Text>
            <Text style={styles.timelineTitle}>Order confirmed</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineMeta}>{order.dateTime.split(',')[0]}, 10:10</Text>
            <Text style={styles.timelineTitle}>Payment updated: Paid</Text>
          </View>
          <View style={[styles.timelineItem, { borderBottomWidth: 0 }]}>
            <Text style={styles.timelineMeta}>{order.dateTime.split(',')[0]}, 10:00</Text>
            <Text style={styles.timelineTitle}>Order created</Text>
          </View>
        </View>

        {/* ── G · Payment Details ── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>G · Payment Details</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment reference</Text>
            <Text style={styles.detailValueBold}>{order.paymentRef}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment method</Text>
            <Text style={styles.detailValueBold}>Recorded method</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment status</Text>
            <Text style={[styles.detailValueBold, { color: adminColors.success.text }]}>
              {order.paymentStatus}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount paid</Text>
            <Text style={styles.detailValueBold}>{formattedTotal}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount pending</Text>
            <Text style={styles.detailValueBold}>₹0.00</Text>
          </View>
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Refund reference</Text>
            <Text style={styles.detailValueBold}>{ADMIN_NO_VALUE}</Text>
          </View>
        </View>

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.md,
    paddingTop: 16,
    paddingBottom: adminSpacing.xxxl,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: 10,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...adminShadow.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9.5,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    ...adminType.body,
    color: adminColors.muted,
    flex: 1,
  },
  detailValueBold: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'right',
    flexShrink: 1,
  },
  itemTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginBottom: 4,
  },
  itemSubtitle: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  itemFootnote: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  timelineItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    borderStyle: 'dashed',
  },
  timelineMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 2,
  },
  timelineTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
});
