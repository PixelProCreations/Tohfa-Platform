/**
 * Sale detail (design M6-S09): GET /admin/sales/{saleId}, everything the
 * SaleDetailView carries and nothing it does not. A sale outside the caller's
 * scope comes back 404 from the server (not 403, root CLAUDE.md 2.1), which
 * AdminErrorState renders as not found.
 *
 * A pending UPI sale (BR-94) shows PendingUpiPanel, which owns the confirm /
 * cancel actions and their permission checks. "View invoice" opens the shared
 * invoice detail only with the sale's real invoice uuid.
 */
import React from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { SaleStatus } from '../../../api/sales';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { isPendingUpiSale, type SaleDetailView } from './mappers';
import { PendingUpiPanel } from './PendingUpiPanel';
import {
  GRADE_KEY,
  PAYMENT_METHOD_KEY,
  PAYMENT_ROW_STATUS_KEY,
  PAYMENT_STATUS_KEY,
  SALE_CHANNEL_KEY,
  SALE_STATUS_KEY,
} from './salesLabels';
import type { PermissionCheck, WarehouseScope, WarehouseTab } from './types';
import { useSale } from './useSalesData';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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

function TimelineDotIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="10" r="8.5" fill={adminColors.success.bg} stroke={adminColors.success.text} strokeWidth="1.8" />
      <Circle cx="10" cy="10" r="3.5" fill={adminColors.success.text} />
    </Svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Timeline codes are sale statuses; an unknown future code shows as sent rather than vanishing. */
function statusLabel(code: string): string {
  return code in SALE_STATUS_KEY ? t(SALE_STATUS_KEY[code as SaleStatus]) : code;
}

function statusTone(status: SaleStatus): { bg: string; text: string } {
  if (status === 'PICKED_UP') return adminColors.success;
  if (status === 'CANCELLED') return adminColors.danger;
  return adminColors.warning;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValueBold}>{value}</Text>
    </View>
  );
}

function AmountRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={strong ? styles.totalLabel : styles.breakdownLabel}>{label}</Text>
      <Text style={strong ? styles.totalValue : styles.breakdownValue}>{value}</Text>
    </View>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

// Design id: M6-S09
export interface SaleDetailScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
  /** The sale uuid; undefined when the route was opened without one. */
  saleId: string | undefined;
  /** Warehouse uuid -> display name (useSalesWarehouseOptions().nameOf); undefined hides the field. */
  warehouseNameOf: (id?: string) => string | undefined;
  /** Opens the shared invoice detail; omitted when the viewer lacks invoice.view_own. */
  onViewInvoice?: ((invoiceId: string) => void) | undefined;
}

export function SaleDetailScreen({ can, onBack, saleId, warehouseNameOf, onViewInvoice }: SaleDetailScreenProps) {
  const { sale, isLoading, error, refresh, isRefreshing } = useSale(saleId);

  let body: React.ReactNode;
  if (saleId === undefined || saleId === '') {
    body = <AdminEmptyState title={t('sales.detail.none.title')} subtitle={t('sales.detail.none.subtitle')} />;
  } else if (sale) {
    body = (
      <SaleDetailBody
        sale={sale}
        can={can}
        warehouseName={warehouseNameOf(sale.warehouseId)}
        onViewInvoice={onViewInvoice}
        onUpdated={refresh}
        isRefreshing={isRefreshing}
      />
    );
  } else if (isLoading) {
    body = <AdminLoadingState />;
  } else {
    body = <AdminErrorState error={error} onRetry={refresh} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t('sales.common.back')}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('sales.detail.title')}</Text>
        </View>

        {sale ? (
          <View style={styles.headerSubRow}>
            <Text style={styles.headerSaleId}>{sale.saleNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusTone(sale.status).bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusTone(sale.status).text }]}>
                {t(SALE_STATUS_KEY[sale.status])}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {body}
    </SafeAreaView>
  );
}

function SaleDetailBody({
  sale,
  can,
  warehouseName,
  onViewInvoice,
  onUpdated,
  isRefreshing,
}: {
  sale: SaleDetailView;
  can: PermissionCheck;
  warehouseName: string | undefined;
  onViewInvoice: ((invoiceId: string) => void) | undefined;
  onUpdated: () => void;
  isRefreshing: boolean;
}) {
  const now = new Date();
  const { buyer, payment } = sale;
  const invoiceId = sale.invoiceId;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onUpdated} tintColor={adminColors.brand} />}
    >
      {isPendingUpiSale(sale) ? <PendingUpiPanel sale={sale} can={can} onUpdated={() => onUpdated()} /> : null}

      {/* ─── Sale information ─── */}
      <Text style={styles.sectionHeading}>{t('sales.detail.section.info')}</Text>
      <View style={styles.card}>
        <View style={styles.gridWrap}>
          <Field label={t('sales.detail.field.saleNumber')} value={sale.saleNumber} />
          <Field label={t('sales.detail.field.channel')} value={t(SALE_CHANNEL_KEY[sale.channel])} />
          <Field label={t('sales.detail.field.status')} value={t(SALE_STATUS_KEY[sale.status])} />
          <Field label={t('sales.detail.field.paymentStatus')} value={t(PAYMENT_STATUS_KEY[sale.paymentStatus])} />
          {warehouseName ? <Field label={t('sales.detail.field.warehouse')} value={warehouseName} /> : null}
          <Field label={t('sales.detail.field.createdAt')} value={formatAdminDate(sale.createdAt, now)} />
          {sale.completedAt ? (
            <Field label={t('sales.detail.field.completedAt')} value={formatAdminDate(sale.completedAt, now)} />
          ) : null}
        </View>
      </View>

      {/* ─── Customer ─── */}
      <Text style={styles.sectionHeading}>{t('sales.detail.section.customer')}</Text>
      <View style={styles.card}>
        <View style={styles.gridWrap}>
          <Field
            label={t('sales.detail.field.buyerType')}
            value={buyer.kind === 'WALK_IN' ? t('sales.common.walkIn') : t('sales.detail.buyer.CUSTOMER')}
          />
          {buyer.name.trim() !== '' ? <Field label={t('sales.detail.field.customerName')} value={buyer.name} /> : null}
          {buyer.customerCode ? <Field label={t('sales.detail.field.customerCode')} value={buyer.customerCode} /> : null}
          {buyer.mobileMasked ? <Field label={t('sales.detail.field.mobile')} value={buyer.mobileMasked} /> : null}
        </View>
      </View>

      {/* ─── Items ─── */}
      <Text style={styles.sectionHeading}>{t('sales.detail.section.items')}</Text>
      <View style={styles.card}>
        {sale.items.length === 0 ? (
          <Text style={styles.breakdownLabel}>{t('sales.detail.noItems')}</Text>
        ) : (
          sale.items.map((item, idx) => (
            <View key={`${item.productId}:${item.grade}`}>
              {idx > 0 ? <View style={styles.itemDivider} /> : null}
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {t('sales.detail.lineQty', {
                      grade: t(GRADE_KEY[item.grade]),
                      qty: formatKg(item.qtyGrams),
                      price: formatPaise(item.unitPricePaise),
                    })}
                  </Text>
                </View>
                <Text style={styles.itemRightPrice}>{formatPaise(item.lineTotalPaise)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* ─── Totals ─── */}
      <Text style={styles.sectionHeading}>{t('sales.detail.section.totals')}</Text>
      <View style={styles.card}>
        <AmountRow label={t('sales.detail.subtotal')} value={formatPaise(sale.subtotalPaise)} />
        <View style={styles.rowGap} />
        <AmountRow label={t('sales.detail.gst')} value={formatPaise(sale.gstPaise)} />
        <View style={styles.breakdownDivider} />
        <AmountRow label={t('sales.detail.total')} value={formatPaise(sale.totalPaise)} strong />
        {sale.changeGivenPaise !== null ? (
          <>
            <View style={styles.rowGap} />
            <AmountRow label={t('sales.detail.changeGiven')} value={formatPaise(sale.changeGivenPaise)} />
          </>
        ) : null}
      </View>

      {/* ─── Payment ─── */}
      <Text style={styles.sectionHeading}>{t('sales.detail.section.payment')}</Text>
      <View style={styles.card}>
        <View style={styles.gridWrap}>
          <Field label={t('sales.detail.payment.method')} value={t(PAYMENT_METHOD_KEY[payment.method])} />
          <Field label={t('sales.detail.payment.status')} value={t(PAYMENT_ROW_STATUS_KEY[payment.status])} />
          <Field label={t('sales.detail.payment.amount')} value={formatPaise(payment.amountPaise)} />
          {payment.amountReceivedPaise !== null ? (
            <Field label={t('sales.detail.payment.amountReceived')} value={formatPaise(payment.amountReceivedPaise)} />
          ) : null}
          {payment.cardRef ? <Field label={t('sales.detail.payment.cardRef')} value={payment.cardRef} /> : null}
          {payment.upiTxnRef ? <Field label={t('sales.detail.payment.upiTxnRef')} value={payment.upiTxnRef} /> : null}
          {payment.confirmedAt ? (
            <Field label={t('sales.detail.payment.confirmedAt')} value={formatAdminDate(payment.confirmedAt, now)} />
          ) : null}
        </View>
      </View>

      {/* ─── Invoice ─── */}
      <Text style={styles.sectionHeading}>{t('sales.detail.section.invoice')}</Text>
      <View style={styles.card}>
        {sale.invoiceNumber ? (
          <Field label={t('sales.detail.invoice.number')} value={sale.invoiceNumber} />
        ) : (
          <Text style={styles.breakdownLabel}>{t('sales.detail.invoice.none')}</Text>
        )}
      </View>

      {onViewInvoice && invoiceId ? (
        <TouchableOpacity
          style={styles.viewInvoiceBtn}
          onPress={() => onViewInvoice(invoiceId)}
          activeOpacity={0.82}
          accessibilityRole="button"
        >
          <InvoiceReceiptIcon size={18} color={adminColors.brand} />
          <Text style={styles.viewInvoiceBtnText}>{t('sales.detail.viewInvoice')}</Text>
        </TouchableOpacity>
      ) : null}

      {/* ─── Timeline ─── */}
      <Text style={styles.sectionHeading}>{t('sales.detail.section.timeline')}</Text>
      {sale.timeline.length === 0 ? (
        <Text style={styles.breakdownLabel}>{t('sales.detail.timeline.empty')}</Text>
      ) : (
        <View style={styles.timelineCard}>
          {sale.timeline.map((step, idx) => {
            const isLast = idx === sale.timeline.length - 1;
            const title =
              step.fromStatus === null
                ? t('sales.detail.timeline.created', { status: statusLabel(step.toStatus) })
                : t('sales.detail.timeline.change', {
                    from: statusLabel(step.fromStatus),
                    to: statusLabel(step.toStatus),
                  });
            return (
              <View key={`${step.at}:${step.toStatus}:${idx}`} style={styles.timelineRow}>
                <View style={styles.indicatorCol}>
                  <TimelineDotIcon size={20} />
                  {!isLast ? <View style={styles.timelineVerticalLine} /> : null}
                </View>
                <View style={[styles.timelineContent, !isLast && styles.timelineContentGap]}>
                  <Text style={styles.timelineStepTitle}>{title}</Text>
                  <Text style={styles.timelineStepTime}>{formatAdminDate(step.at, now)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
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
    gap: adminSpacing.sm,
    marginTop: 6,
    marginLeft: 36,
  },
  headerSaleId: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    ...adminType.caption,
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
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  field: {
    width: '50%',
    paddingRight: adminSpacing.sm,
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  itemMeta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  itemRightPrice: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  itemDivider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowGap: {
    height: 8,
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
  timelineCard: {
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
  timelineContentGap: {
    paddingBottom: 22,
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
});
