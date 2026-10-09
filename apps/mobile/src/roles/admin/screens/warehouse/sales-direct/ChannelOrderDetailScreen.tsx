/**
 * Channel Order Detail — one B2B or HORECA order, read-only.
 *
 * Replaces the SubWarehouseB2BDetailScreen / SubWarehouseHorecaDetailScreen
 * twins; the channel difference is the `channel` prop plus CHANNEL_COPY.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - GSTIN row: B2B only, and only with `customer.gst_details.manage`
 *     (MAIN_WH_ADMIN=view, SUB_WH_ADMIN=none). HORECA never had a GSTIN row.
 *   - View Invoice: `invoice.generate`.
 *   - The screen itself is ungated: there is no per-channel view code yet
 *     (SPEC_GAPS.md #5).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { SubWarehouseInvoiceDetailScreen } from '../../../../subwarehouse/screens/SubWarehouseInvoiceDetailScreen';
import { OrderStatusHistoryScreen } from '../orders';
import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import { CHANNEL_COPY, CHANNEL_FALLBACK_ORDER, invoiceIdForOrder } from './fixtures';
import type { ChannelOrderItem, ChannelOrderLine, SalesChannel } from './types';

// ─── Icons ────────────────────────────────────────────────────────────────────
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

function InvoiceDocIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlagStatusIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Splits order lines into rows of two for the two-column item grid. */
function pairs(lines: ChannelOrderLine[]): ChannelOrderLine[][] {
  const rows: ChannelOrderLine[][] = [];
  for (let i = 0; i < lines.length; i += 2) rows.push(lines.slice(i, i + 2));
  return rows;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ChannelOrderDetailScreenProps extends WarehouseScreenBaseProps {
  channel: SalesChannel;
  /** Order to show; the channel's fallback order when absent. */
  order?: ChannelOrderItem | null | undefined;
  /** Host navigation to the invoice; renders inline when absent. */
  onViewInvoice?: ((invoiceId: string) => void) | undefined;
  /** Host navigation to the status history; renders inline when absent. */
  onViewStatus?: ((orderId: string) => void) | undefined;
}

export function ChannelOrderDetailScreen({
  scope,
  can,
  onBack,
  onNavigate,
  channel,
  order,
  onViewInvoice,
  onViewStatus,
}: ChannelOrderDetailScreenProps): React.JSX.Element {
  const [currentSubView, setCurrentSubView] = useState<'detail' | 'invoice' | 'status'>('detail');

  const copy = CHANNEL_COPY[channel];
  const displayOrder: ChannelOrderItem = order ?? CHANNEL_FALLBACK_ORDER[channel];
  const invoiceId = invoiceIdForOrder(displayOrder);
  const showGstin = channel === 'B2B' && can('customer.gst_details.manage');
  const showInvoice = can('invoice.generate');

  const handleInvoicePress = () => {
    if (onViewInvoice) {
      onViewInvoice(invoiceId);
    } else {
      setCurrentSubView('invoice');
    }
  };

  const handleStatusPress = () => {
    if (onViewStatus) {
      onViewStatus(displayOrder.id);
    } else {
      setCurrentSubView('status');
    }
  };

  if (currentSubView === 'invoice') {
    return (
      <SubWarehouseInvoiceDetailScreen invoiceId={invoiceId} onBack={() => setCurrentSubView('detail')} />
    );
  }

  if (currentSubView === 'status') {
    return (
      <OrderStatusHistoryScreen
        scope={scope}
        can={can}
        orderId={displayOrder.id}
        onNavigate={(screen, params) => onNavigate?.(screen, params)}
        onBack={() => setCurrentSubView('detail')}
      />
    );
  }

  // Subtotal is the sum of the lines; GST is whatever the order total carries
  // above it. (The twins hard-coded GST as 1000 / 500; their fallback orders
  // give exactly those figures this way.)
  const lines = displayOrder.items ?? [];
  const total = displayOrder.amount;
  const subtotal = lines.length > 0 ? lines.reduce((sum, l) => sum + l.lineTotal, 0) : total;
  const gst = Math.max(0, total - subtotal);
  const warehouseName = displayOrder.warehouseName ?? scope.warehouseName ?? '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowBackIcon size={24} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{copy.detailTitle}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Business ─── */}
        <Text style={styles.sectionHeading}>{copy.businessSection}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{copy.businessLabel}</Text>
              <Text style={styles.fieldValue}>{displayOrder.businessName}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{copy.contactLabel}</Text>
              <Text style={styles.fieldValue}>XXXX</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowGap]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <Text style={styles.fieldValue}>XXXX</Text>
            </View>
            {showGstin && (
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>GSTIN</Text>
                <Text style={styles.fieldValue}>XXXX</Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── 2. Order ─── */}
        <Text style={styles.sectionHeading}>{copy.orderSection}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order ID</Text>
              <Text style={styles.fieldValue}>{displayOrder.id}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Warehouse</Text>
              <Text style={styles.fieldValue}>{warehouseName}</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowGap]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Order Date</Text>
              <Text style={styles.fieldValue}>{displayOrder.dateText}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>{displayOrder.status}</Text>
            </View>
          </View>
        </View>

        {/* ─── 3. Items ─── */}
        <Text style={styles.sectionHeading}>{copy.itemsSection}</Text>
        <View style={styles.card}>
          {pairs(lines).map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.row, rowIndex > 0 && styles.rowGap]}>
              {row.map((line) => (
                <View key={`${line.batch}-${line.name}`} style={styles.col}>
                  <Text style={styles.fieldLabel}>{line.name}</Text>
                  <Text style={styles.fieldValue}>{line.qtyText}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ─── 4. Amount ─── */}
        <Text style={styles.sectionHeading}>{copy.amountSection}</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryGap]}>
            <Text style={styles.summaryLabel}>GST</Text>
            <Text style={styles.summaryValue}>₹{gst.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* ─── Actions (read-only views) ─── */}
        {showInvoice && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleInvoicePress} activeOpacity={0.85}>
            <InvoiceDocIcon size={18} color={adminColors.onBrand} />
            <Text style={styles.primaryBtnText}>View Invoice</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={handleStatusPress} activeOpacity={0.8}>
          <FlagStatusIcon size={18} color={adminColors.brand} />
          <Text style={styles.secondaryBtnText}>View Status</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    gap: adminSpacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
    marginTop: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowGap: {
    marginTop: adminSpacing.lg,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.xs,
  },
  fieldValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryGap: {
    marginTop: adminSpacing.sm,
  },
  summaryLabel: {
    ...adminType.body,
    color: adminColors.muted,
  },
  summaryValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: adminSpacing.md,
  },
  totalLabel: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  totalValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  primaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.onBrand,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  secondaryBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brand,
  },
  bottomSpacer: {
    height: adminSpacing.xxl,
  },
});
