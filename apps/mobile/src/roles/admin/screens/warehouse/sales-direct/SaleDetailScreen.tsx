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


function TimelineCheckIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="8.5" fill={adminColors.success.bg} stroke={adminColors.success.text} strokeWidth="1.8" />
      <Circle cx="10" cy="10" r="3.5" fill={adminColors.success.text} />
    </Svg>
  );
}

// ─── Component Props ─────────────────────────────────────────────────────────

// Design id: M6-S09
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
    items: [
      {
        name: 'Tomato',
        grade: 'Grade 1',
        batch: 'BTH-00231',
        qtyText: '2 KG @ ₹100',
        pricePerUnit: 100,
        lineTotal: 200,
      },
    ],
  },
  onBack,
  onViewInvoice,
  scope,
  can,
}: SaleDetailScreenProps) {
  // View Invoice opens the shared invoice detail, which checks invoice.view_own
  // (MAIN all, SUB own); FINAL_LIST row 113 names invoice.generate, which both
  // roles also hold. Gate on the code the target screen enforces.
  const canShowInvoice = can('invoice.view_own');
  const [showInvoiceScreen, setShowInvoiceScreen] = useState(false);

  const handleViewInvoice = () => {
    if (onViewInvoice) {
      onViewInvoice();
    } else {
      setShowInvoiceScreen(true);
    }
  };

  // A Sub admin sees only its own warehouse's sales. A record from another
  // warehouse renders as not found (empty), never as a 403 that would confirm
  // the sale exists (root CLAUDE.md 2.1).
  const outOfScope =
    scope.warehouseId !== undefined && sale.warehouseId !== undefined && sale.warehouseId !== (scope.warehouseCode ?? scope.warehouseId);
  if (outOfScope) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        <View style={styles.headerBanner}>
          <View style={styles.headerTopRow}>
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

  const defaultItems = [
    {
      name: 'Tomato',
      grade: 'Grade 1',
      batch: 'BTH-00231',
      qtyText: '2 KG @ ₹100',
      pricePerUnit: 100,
      lineTotal: 200,
    },
    {
      name: 'Carrot',
      grade: 'Grade 1',
      batch: 'BTH-00189',
      qtyText: '1 KG @ ₹120',
      pricePerUnit: 120,
      lineTotal: 120,
    },
  ];

  const saleItems = sale.items && sale.items.length > 0 ? sale.items : defaultItems;
  const itemsTotal = saleItems.reduce((acc, it) => acc + (it.lineTotal ?? 0), 0);
  const totalAmount = sale.amount || itemsTotal || 320;

  const warehouseDisplayName =
    sale.warehouseName?.replace(/ Warehouse$/, '') ??
    scope.warehouseName?.replace(/ Warehouse$/, '') ??
    'Coonoor';

  const timelineSteps = [
    { title: 'Sale Created' },
    { title: 'Payment Confirmed' },
    { title: 'Inventory Updated' },
    { title: 'Sale Completed' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Top Brand Header Banner (#F0562A) ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sale Details</Text>
        </View>

        <View style={styles.headerSubRow}>
          <Text style={styles.headerSaleId}>{sale.id || 'SALE-00251'} · </Text>
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>Paid</Text>
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
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValueBold}>24 Sep 2026</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Time</Text>
              <Text style={styles.fieldValueBold}>10:42 AM</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValueBold}>{warehouseDisplayName}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Sales Channel</Text>
              <Text style={styles.fieldValueBold}>Direct</Text>
            </View>
          </View>
        </View>

        {/* ─── 2. Customer ─── */}
        <Text style={styles.sectionHeading}>Customer</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer</Text>
              <Text style={styles.fieldValueBold}>{sale.customerName || 'Arun Kumar'}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Customer ID</Text>
              <Text style={styles.fieldValueBold}>{sale.customerCode || 'CUS-00251'}</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Items ─── */}
        <Text style={styles.sectionHeading}>Items</Text>
        <View style={styles.card}>
          {saleItems.map((item, idx) => (
            <View key={idx}>
              {idx > 0 && <View style={styles.itemDivider} />}
              <View style={styles.itemRow}>
                <Text style={styles.itemLeftText}>
                  {item.name} · {item.grade || 'Grade 1'} · {item.qtyText}
                </Text>
                <Text style={styles.itemRightPrice}>₹{item.lineTotal}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── 4. Financial Summary ─── */}
        <Text style={styles.sectionHeading}>Financial Summary</Text>
        <View style={styles.card}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>₹{totalAmount}</Text>
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
            <Text style={styles.totalValue}>₹{totalAmount}</Text>
          </View>
        </View>

        {/* ─── 5. Payment ─── */}
        <Text style={styles.sectionHeading}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Method</Text>
              <Text style={styles.fieldValueBold}>{sale.paymentMethod || 'UPI'}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValueBold}>Paid</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <Text style={styles.fieldValueBold}>₹{totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* ─── 6. Inventory Reference ─── */}
        <Text style={styles.sectionHeading}>Inventory Reference</Text>
        <View style={styles.card}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Movement</Text>
              <Text style={styles.fieldValueBold}>{sale.movementId ?? `MOV-${sale.id.replace(/^SALE-/, '')}`}</Text>
            </View>

            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValueBold}>{warehouseDisplayName}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValueBold}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Reference disclaimer notice */}
        <View style={styles.referenceNoticeBox}>
          <Text style={styles.referenceNoticeText}>
            🚫 This is a reference only — detailed stock movement stays in Module 3, not duplicated here.
          </Text>
        </View>

        {/* ─── 7. Invoice ─── */}
        <Text style={styles.sectionHeading}>Invoice</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Invoice Number</Text>
          <Text style={styles.fieldValueBold}>{sale.invoiceNo || 'INV-00251'}</Text>
        </View>

        {canShowInvoice && (
          <TouchableOpacity
            style={styles.viewInvoiceOutlineBtn}
            onPress={handleViewInvoice}
            activeOpacity={0.82}
          >
            <Text style={styles.viewInvoiceOutlineBtnText}>View Invoice</Text>
          </TouchableOpacity>
        )}

        {/* ─── 8. Sale Timeline ─── */}
        <Text style={[styles.sectionHeading, { marginTop: 20 }]}>Sale Timeline</Text>
        <View style={styles.timelineCard}>
          {timelineSteps.map((step, idx) => {
            const isLast = idx === timelineSteps.length - 1;
            return (
              <View key={idx} style={styles.timelineRow}>
                {/* Left Indicator & connecting vertical line */}
                <View style={styles.indicatorCol}>
                  <TimelineCheckIcon size={20} />
                  {!isLast && <View style={styles.timelineVerticalLine} />}
                </View>

                {/* Right Step Content */}
                <View style={[styles.timelineContent, !isLast && { paddingBottom: 22 }]}>
                  <Text style={styles.timelineStepTitle}>{step.title}</Text>
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

// ─── Stylesheet ──────────────────────────────────────────────────────────────
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
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 36,
  },
  headerSaleId: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '600',
  },
  paidBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: adminColors.success.text,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: 0.2,
    flex: 1,
    marginLeft: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLeftText: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 14,
    flex: 1,
    paddingRight: 8,
  },
  itemRightPrice: {
    ...adminType.title,
    color: adminColors.ink,
    fontSize: 14,
  },
  itemDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 8,
  },
  referenceNoticeBox: {
    backgroundColor: adminColors.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  referenceNoticeText: {
    ...adminType.body,
    color: adminColors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  viewInvoiceOutlineBtn: {
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  viewInvoiceOutlineBtnText: {
    ...adminType.title,
    color: adminColors.brand,
    fontSize: 14,
  },
  timelineCard: {
    paddingLeft: 4,
    marginTop: 8,
  },
  completedPill: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  completedPillText: {
    ...adminType.rowTitle,
    color: adminColors.success.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    ...adminShadow.sm,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.body,
    color: adminColors.muted,
    marginBottom: 4,
  },
  fieldValueBold: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  itemTitle: {
    ...adminType.sectionHead,
    color: adminColors.muted,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  breakdownValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  breakdownDivider: {
    height: 1.5,
    backgroundColor: adminColors.ink,
    marginVertical: 12,
  },
  totalLabel: {
    ...adminType.title,
    color: adminColors.ink,
  },
  totalValue: {
    ...adminType.title,
    color: adminColors.ink,
  },
  viewInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: 12,
    backgroundColor: adminColors.card,
    paddingVertical: 14,
    marginTop: 14,
  },
  viewInvoiceBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
  downloadInvoiceTooltip: {
    alignSelf: 'center',
    backgroundColor: adminColors.ink,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 10,
    ...adminShadow.sm,
  },
  downloadInvoiceTooltipText: {
    color: adminColors.onBrand,
    ...adminType.sectionHead,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  timelineContainer: {
    paddingLeft: 4,
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineVerticalLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: adminColors.border,
    marginVertical: 2,
  },
  timelineContent: {
    marginLeft: 12,
    flex: 1,
  },
  timelineStepTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  timelineStepTime: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingTop: 8,
    paddingBottom: 6,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 3,
  },
  navLabelActive: {
    color: adminColors.brand,
    fontWeight: '700',
  },
});
