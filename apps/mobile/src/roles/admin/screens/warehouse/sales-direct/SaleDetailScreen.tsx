import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { adminColors, adminType, adminShadow } from '../../../theme';
import { InvoiceDetailScreen } from '../billing-invoices';
import type { SaleRecord, WarehouseScreenBaseProps } from './types';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

function InvoiceReceiptIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SaleDetailScreenProps extends WarehouseScreenBaseProps {
  sale?: SaleRecord | undefined;
  /** Open the invoice in the host; without it the shared invoice detail opens inline. */
  onViewInvoice?: (() => void) | undefined;
}

export function SaleDetailScreen({
  sale = {
    id: 'SALE-00251',
    customerName: 'Rajesh Kumar',
    customerCode: 'CUS-00291',
    channel: 'Direct Sale',
    dateText: '24 Sep, 6:35 PM',
    amount: 320,
    status: 'Completed',
    invoiceNo: 'INV-00251',
    paymentMethod: 'UPI',
  },
  onBack,
  onViewInvoice,
  scope,
  can,
}: SaleDetailScreenProps) {
  const canShowInvoice = can ? can('invoice.view_own') : true;
  const [showInvoiceScreen, setShowInvoiceScreen] = useState(false);

  const handleViewInvoice = () => {
    if (onViewInvoice) {
      onViewInvoice();
    } else {
      setShowInvoiceScreen(true);
    }
  };

  const outOfScope =
    scope.warehouseId !== undefined && sale.warehouseId !== undefined && sale.warehouseId !== scope.warehouseId;
  if (outOfScope) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
              <ArrowBackIcon size={24} color={adminColors.onBrand} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Sale Details</Text>
          </View>
        </View>
        <View style={styles.scrollContent}>
          <Text style={styles.fieldLabel}>No sale found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showInvoiceScreen) {
    return (
      <InvoiceDetailScreen
        scope={scope}
        can={can}
        invoiceId={sale.invoiceNo || 'INV-00251'}
        onBack={() => setShowInvoiceScreen(false)}
      />
    );
  }

  const warehouseDisplayName =
    sale.warehouseName?.replace(/ Warehouse$/, '') ??
    scope.warehouseName?.replace(/ Warehouse$/, '') ??
    'Coonoor';

  const timelineSteps = [
    { title: 'Sale Created', time: '6:30 PM' },
    { title: 'Products Added', time: '6:31 PM' },
    { title: 'Stock Checked', time: '6:32 PM' },
    { title: 'Payment Initiated', time: '6:34 PM' },
    { title: 'Payment Confirmed', time: '6:35 PM' },
    { title: 'Sale Completed', time: '6:35 PM' },
    { title: 'Invoice Generated', time: '6:35 PM' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner (Image 3) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sale Details</Text>

          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Sale Information ─── */}
        <Text style={styles.sectionHeading}>Sale Information</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Sale ID</Text>
              <Text style={styles.fieldValueBold}>{sale.id || 'SALE-00251'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Created</Text>
              <Text style={styles.fieldValueBold}>24 Sep, 6:35 PM</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValueBold}>{warehouseDisplayName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Channel</Text>
              <Text style={styles.fieldValueBold}>Direct Sale</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Customer ─── */}
        <Text style={styles.sectionHeading}>Customer</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValueBold}>{sale.customerName || 'Rajesh Kumar'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer ID</Text>
              <Text style={styles.fieldValueBold}>{sale.customerCode || 'CUS-00291'}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Mobile</Text>
              <Text style={styles.fieldValueBold}>+91 XXXXX XXXXX</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Items ─── */}
        <Text style={styles.sectionHeading}>Items</Text>
        <View style={styles.card}>
          <View style={styles.itemHeaderRow}>
            <Text style={styles.itemNameText}>Tomato · Grade 1</Text>
            <View style={styles.batchWrap}>
              <Text style={styles.fieldLabel}>Batch</Text>
              <Text style={styles.batchValue}>BTH-00231</Text>
            </View>
          </View>
          <Text style={styles.itemRateText}>2 KG @ ₹100</Text>
          <View style={{ marginTop: 8 }}>
            <Text style={styles.fieldLabel}>Line Total</Text>
            <Text style={styles.lineTotalValue}>₹200</Text>
          </View>
        </View>

        {/* ─── 4. Amount Breakdown ─── */}
        <Text style={styles.sectionHeading}>Amount Breakdown</Text>
        <View style={styles.card}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>₹320</Text>
          </View>

          <View style={[styles.breakdownRow, { marginTop: 8 }]}>
            <Text style={styles.breakdownLabel}>Discount</Text>
            <Text style={styles.breakdownValue}>₹0</Text>
          </View>

          <View style={[styles.breakdownRow, { marginTop: 8 }]}>
            <Text style={styles.breakdownLabel}>GST</Text>
            <Text style={styles.breakdownValue}>₹0</Text>
          </View>

          <View style={styles.breakdownDivider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹320</Text>
          </View>
        </View>

        {/* ─── 5. Payment ─── */}
        <Text style={styles.sectionHeading}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Payment Method</Text>
              <Text style={styles.fieldValueBold}>{sale.paymentMethod || 'UPI'}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Payment Status</Text>
              <Text style={styles.fieldValueBold}>Paid</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Transaction ID</Text>
              <Text style={styles.fieldValueBold}>TXN-XXXXXX</Text>
            </View>
          </View>
        </View>

        {/* ─── 6. Invoice ─── */}
        <Text style={styles.sectionHeading}>Invoice</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Invoice No.</Text>
          <Text style={styles.fieldValueBold}>{sale.invoiceNo || 'INV-00251'}</Text>
        </View>

        {canShowInvoice && (
          <TouchableOpacity
            style={styles.viewInvoiceOutlineBtn}
            onPress={handleViewInvoice}
            activeOpacity={0.82}
          >
            <InvoiceReceiptIcon size={18} color="#92400E" />
            <Text style={styles.viewInvoiceOutlineBtnText}>View Invoice</Text>
          </TouchableOpacity>
        )}

        {/* ─── 7. Sale Timeline (Image 4) ─── */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Sale Timeline</Text>
        <View style={styles.timelineCard}>
          {timelineSteps.map((step, idx) => {
            const isLast = idx === timelineSteps.length - 1;
            return (
              <View key={idx} style={styles.timelineRow}>
                {/* Green Dot Indicator & connecting vertical line */}
                <View style={styles.indicatorCol}>
                  <View style={styles.timelineGreenDot} />
                  {!isLast && <View style={styles.timelineVerticalLine} />}
                </View>

                {/* Step Content */}
                <View style={[styles.timelineContent, !isLast && { paddingBottom: 18 }]}>
                  <Text style={styles.timelineStepTitle}>{step.title}</Text>
                  <Text style={styles.timelineStepTime}>{step.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 28 }} />
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
    flex: 1,
    marginLeft: 8,
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 14,
    marginBottom: 8,
    fontWeight: '700',
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: adminColors.muted,
    marginBottom: 4,
  },
  fieldValueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: adminColors.ink,
  },
  batchWrap: {
    alignItems: 'flex-end',
  },
  batchValue: {
    fontSize: 13,
    fontWeight: '700',
    color: adminColors.ink,
  },
  itemRateText: {
    fontSize: 14,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 6,
  },
  lineTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: adminColors.ink,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownLabel: {
    fontSize: 13,
    color: adminColors.muted,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.ink,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: adminColors.ink,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: adminColors.ink,
  },
  viewInvoiceOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.card,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#D97706',
    gap: 8,
    marginBottom: 10,
  },
  viewInvoiceOutlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: 14,
    ...adminShadow.sm,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 12,
  },
  timelineGreenDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    marginTop: 3,
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: 3,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  timelineStepTime: {
    fontSize: 11.5,
    color: adminColors.muted,
  },
});
