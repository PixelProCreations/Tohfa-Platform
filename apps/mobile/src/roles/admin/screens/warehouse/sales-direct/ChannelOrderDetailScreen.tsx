/**
 * Channel Order Detail — one B2B or HORECA order, read-only.
 *
 * What it shows, and from where:
 *   - The list row the host passes as `order` (GET /admin/sales/horeca | b2b):
 *     order number, business, status, payment status, item count, total, date.
 *   - With `order.list.view_all`, the general admin order detail
 *     (GET /admin/orders/{orderId}, BR-99): warehouse name, line items,
 *     subtotal / GST / total, and the order's invoice when one exists. The
 *     sales API has no channel-order detail of its own.
 *
 * The API carries no contact person, phone or GSTIN for a channel order, so
 * none is shown. Nothing here edits the order (BR-13: channel orders are not
 * created or changed from this app).
 *
 * Invoice: only an invoice uuid the server returned is ever opened; it goes to
 * the host's onViewInvoice, or renders LiveInvoiceDetail inline (gated on
 * invoice.view_own). Status history only through the host's onViewStatus.
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

import type { Grade } from '../../../api/sales';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { LiveInvoiceDetail } from '../billing-invoices';
import type { WarehouseScreenBaseProps } from '../finance-expenses';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { CHANNEL_ORDER_STATUS_KEY, GRADE_KEY, PAYMENT_STATUS_KEY } from './salesLabels';
import type { ChannelOrderItem, SalesChannel } from './types';
import { useChannelOrderDetail, useSalesWarehouseOptions } from './useSalesData';

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

const TITLE_KEY = {
  HORECA: 'sales.channelOrder.title.HORECA',
  B2B: 'sales.channelOrder.title.B2B',
} as const;

/** The detail's grade is a plain string; label it only when it is a known Grade code. */
function gradeLabel(grade: string): string | undefined {
  const key = GRADE_KEY[grade as Grade] as (typeof GRADE_KEY)[Grade] | undefined;
  return key ? t(key) : undefined;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ChannelOrderDetailScreenProps extends WarehouseScreenBaseProps {
  channel: SalesChannel;
  /** The list row to show; without one the screen shows an empty state. */
  order?: ChannelOrderItem | null | undefined;
  /** Host navigation to the invoice (a real invoice uuid); renders inline when absent. */
  onViewInvoice?: ((invoiceId: string) => void) | undefined;
  /** Host navigation to the status history; the button is hidden when absent. */
  onViewStatus?: ((orderId: string) => void) | undefined;
}

export function ChannelOrderDetailScreen({
  scope,
  can,
  onBack,
  onTabChange,
  channel,
  order,
  onViewInvoice,
  onViewStatus,
}: ChannelOrderDetailScreenProps): React.JSX.Element {
  const [inlineInvoiceId, setInlineInvoiceId] = useState<string | null>(null);

  const canViewDetail = can('order.list.view_all');
  const detailQuery = useChannelOrderDetail(order?.id, { enabled: canViewDetail && Boolean(order) });
  const detail = detailQuery.order;
  const warehouses = useSalesWarehouseOptions(scope, can);

  if (inlineInvoiceId) {
    return (
      <LiveInvoiceDetail
        scope={scope}
        can={can}
        invoiceId={inlineInvoiceId}
        onBack={() => setInlineInvoiceId(null)}
        onTabChange={onTabChange}
      />
    );
  }

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        activeOpacity={0.8}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={t('sales.channelOrder.backA11y')}
      >
        <ArrowBackIcon size={24} color={adminColors.onBrand} />
      </TouchableOpacity>
      <Text style={styles.headerTitle} accessibilityRole="header">
        {t(TITLE_KEY[channel])}
      </Text>
    </View>
  );

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
        {header}
        <View style={styles.content}>
          <AdminEmptyState
            title={t('sales.channelOrder.missingTitle')}
            subtitle={t('sales.channelOrder.missingSubtitle')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const businessName =
    order.businessName ?? detail?.buyerName ?? order.customerCode ?? t('sales.channelSales.unknownBusiness');
  const customerCode = order.customerCode ?? detail?.customerCode ?? null;
  const warehouseName = detail?.warehouseName ?? warehouses.nameOf(order.warehouseId);

  const invoiceId = detail?.invoiceId ?? null;
  const canOpenInvoice = invoiceId !== null && (onViewInvoice !== undefined || can('invoice.view_own'));
  const handleInvoicePress = () => {
    if (invoiceId === null) return;
    if (onViewInvoice) {
      onViewInvoice(invoiceId);
    } else {
      setInlineInvoiceId(invoiceId);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      {header}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Business ─── */}
        <Text style={styles.sectionHeading}>{t('sales.channelOrder.businessSection')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('sales.channelOrder.business')}</Text>
              <Text style={styles.fieldValue}>{businessName}</Text>
            </View>
            {customerCode ? (
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>{t('sales.channelOrder.customerCode')}</Text>
                <Text style={styles.fieldValue}>{customerCode}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ─── 2. Order ─── */}
        <Text style={styles.sectionHeading}>{t('sales.channelOrder.orderSection')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('sales.channelOrder.orderNumber')}</Text>
              <Text style={styles.fieldValue}>{order.orderNumber}</Text>
            </View>
            {warehouseName ? (
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>{t('sales.channelOrder.warehouse')}</Text>
                <Text style={styles.fieldValue}>{warehouseName}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.row, styles.rowGap]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('sales.channelOrder.placedAt')}</Text>
              <Text style={styles.fieldValue}>{formatAdminDate(order.placedAt, new Date())}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('sales.channelOrder.status')}</Text>
              <Text style={styles.fieldValue}>{t(CHANNEL_ORDER_STATUS_KEY[order.status])}</Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowGap]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('sales.channelOrder.paymentStatus')}</Text>
              <Text style={styles.fieldValue}>{t(PAYMENT_STATUS_KEY[order.paymentStatus])}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>{t('sales.channelOrder.items')}</Text>
              <Text style={styles.fieldValue}>{t('sales.common.itemCount', { count: order.itemCount })}</Text>
            </View>
          </View>
          {detail?.invoiceNumber ? (
            <View style={[styles.row, styles.rowGap]}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>{t('sales.channelOrder.invoiceNumber')}</Text>
                <Text style={styles.fieldValue}>{detail.invoiceNumber}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ─── 3. Items + 4. Amount (GET /admin/orders/{id}) ─── */}
        {!canViewDetail ? (
          <>
            <Text style={styles.sectionHeading}>{t('sales.channelOrder.amountSection')}</Text>
            <View style={styles.card}>
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>{t('sales.channelOrder.total')}</Text>
                <Text style={styles.totalValue}>{formatPaise(order.totalPaise)}</Text>
              </View>
            </View>
            <Text style={styles.noteText}>{t('sales.channelOrder.detailNoPermission')}</Text>
          </>
        ) : detailQuery.isLoading ? (
          <AdminLoadingState />
        ) : detailQuery.error || !detail ? (
          <AdminErrorState error={detailQuery.error} onRetry={detailQuery.refresh} />
        ) : (
          <>
            <Text style={styles.sectionHeading}>{t('sales.channelOrder.itemsSection')}</Text>
            <View style={styles.card}>
              {detail.items.length === 0 ? (
                <Text style={styles.summaryLabel}>{t('sales.channelOrder.noItems')}</Text>
              ) : (
                detail.items.map((line, index) => {
                  const grade = gradeLabel(line.grade);
                  return (
                    <View key={`${line.productId}-${line.grade}-${index}`} style={[styles.lineRow, index > 0 && styles.lineDivider]}>
                      <View style={styles.col}>
                        <Text style={styles.fieldValue}>{grade ? `${line.name} · ${grade}` : line.name}</Text>
                        <Text style={styles.fieldLabel}>
                          {t('sales.channelOrder.lineQty', {
                            qty: formatKg(line.qtyGrams),
                            price: formatPaise(line.unitPricePaise),
                          })}
                        </Text>
                      </View>
                      <Text style={styles.summaryValue}>{formatPaise(line.lineTotalPaise)}</Text>
                    </View>
                  );
                })
              )}
            </View>

            <Text style={styles.sectionHeading}>{t('sales.channelOrder.amountSection')}</Text>
            <View style={styles.card}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('sales.channelOrder.subtotal')}</Text>
                <Text style={styles.summaryValue}>{formatPaise(detail.subtotalPaise)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryGap]}>
                <Text style={styles.summaryLabel}>{t('sales.channelOrder.gst')}</Text>
                <Text style={styles.summaryValue}>{formatPaise(detail.gstPaise)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>{t('sales.channelOrder.total')}</Text>
                <Text style={styles.totalValue}>{formatPaise(detail.totalPaise)}</Text>
              </View>
            </View>

            {canOpenInvoice ? (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleInvoicePress}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <InvoiceDocIcon size={18} color={adminColors.onBrand} />
                <Text style={styles.primaryBtnText}>{t('sales.channelOrder.viewInvoice')}</Text>
              </TouchableOpacity>
            ) : invoiceId === null ? (
              <Text style={styles.noteText}>{t('sales.channelOrder.noInvoice')}</Text>
            ) : null}
          </>
        )}

        {/* ─── Status history (host route only) ─── */}
        {onViewStatus ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => onViewStatus(order.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <FlagStatusIcon size={18} color={adminColors.brand} />
            <Text style={styles.secondaryBtnText}>{t('sales.channelOrder.viewStatus')}</Text>
          </TouchableOpacity>
        ) : null}

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
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  lineDivider: {
    marginTop: adminSpacing.sm,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
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
  noteText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: adminSpacing.lg,
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
