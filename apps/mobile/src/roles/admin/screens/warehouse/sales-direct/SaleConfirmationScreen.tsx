/**
 * The result of a sale (design M6-S07), drawn only from the SaleDetailView the
 * server returned (POST /admin/sales, or the UPI confirm / cancel). Nothing
 * here is computed on the phone: totals, status and the invoice come from
 * the server, so this screen never shows a local or optimistic success.
 *
 * "View invoice" appears only when the host passes onViewInvoice (it holds
 * invoice.view_own) and the sale already has a billing invoice uuid; a sale
 * still pending UPI payment or cancelled has none.
 */
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import type { SaleDetailView } from './mappers';
import { GRADE_KEY, PAYMENT_METHOD_KEY, PAYMENT_STATUS_KEY, SALE_CHANNEL_KEY, SALE_STATUS_KEY } from './salesLabels';
import type { WarehouseScreenBaseProps } from './types';

function ArrowBackIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SuccessCheckIcon({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx="16" cy="16" r="14" stroke={adminColors.success.text} strokeWidth="2.5" />
      <Path
        d="M10 16.5l4 4 8-8"
        stroke={adminColors.success.text}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CrossCircleIcon({ size = 32, color = adminColors.danger.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx="16" cy="16" r="14" stroke={color} strokeWidth="2.5" />
      <Path d="M11 11l10 10M21 11L11 21" stroke={color} strokeWidth="2.8" strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon({ size = 32, color = adminColors.warning.text }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Circle cx="16" cy="16" r="14" stroke={color} strokeWidth="2.5" />
      <Path d="M16 9v7l5 3" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InvoiceIcon({ size = 18, color = adminColors.onBrand }: { size?: number; color?: string }) {
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

// Design id: M6-S07
export interface SaleConfirmationScreenProps extends WarehouseScreenBaseProps {
  /** The sale as the server returned it. */
  sale: SaleDetailView;
  /** Name of the selling warehouse, when the host knows it. */
  warehouseName?: string | undefined;
  /** Open the billing invoice (host holds invoice.view_own); shown only with sale.invoiceId. */
  onViewInvoice?: ((invoiceId: string) => void) | undefined;
  onViewSale: (saleId: string) => void;
  onNewSale: () => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valueBold}>{value}</Text>
    </View>
  );
}

export function SaleConfirmationScreen({
  sale,
  warehouseName,
  onBack,
  onViewInvoice,
  onViewSale,
  onNewSale,
}: SaleConfirmationScreenProps): React.JSX.Element {
  const cancelled = sale.status === 'CANCELLED';
  const pending = sale.status === 'PENDING_PAYMENT';
  const invoiceId = sale.invoiceId;
  const when = formatAdminDate(sale.completedAt ?? sale.createdAt, new Date());

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={t('sales.common.back')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={24} color={adminColors.onBrand} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {t('sales.confirmation.title')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Outcome */}
        <View style={styles.resultSection}>
          <View
            style={[
              styles.resultCircle,
              cancelled ? styles.resultCircleDanger : pending ? styles.resultCircleWarning : styles.resultCircleSuccess,
            ]}
          >
            {cancelled ? <CrossCircleIcon size={34} /> : pending ? <ClockIcon size={34} /> : <SuccessCheckIcon size={34} />}
          </View>
          <Text style={styles.resultTitle}>
            {cancelled
              ? t('sales.confirmation.cancelledTitle')
              : pending
                ? t('sales.confirmation.pendingTitle')
                : t('sales.confirmation.successTitle')}
          </Text>
          {cancelled ? <Text style={styles.resultMessage}>{t('sales.confirmation.cancelledMessage')}</Text> : null}
          {pending ? <Text style={styles.resultMessage}>{t('sales.confirmation.pendingMessage')}</Text> : null}
        </View>

        {/* Sale */}
        <View style={styles.card}>
          <InfoRow label={t('sales.confirmation.saleNumber')} value={sale.saleNumber} />
          {when ? <Text style={styles.meta}>{when}</Text> : null}
          <InfoRow label={t('sales.confirmation.status')} value={t(SALE_STATUS_KEY[sale.status])} />
          <InfoRow label={t('sales.confirmation.channel')} value={t(SALE_CHANNEL_KEY[sale.channel])} />
          {warehouseName ? <InfoRow label={t('sales.confirmation.warehouse')} value={warehouseName} /> : null}
          {sale.invoiceNumber !== null ? (
            <InfoRow label={t('sales.confirmation.invoiceNumber')} value={sale.invoiceNumber} />
          ) : null}
        </View>

        {/* Buyer */}
        <Text style={styles.sectionHeading}>{t('sales.confirmation.buyer')}</Text>
        <View style={styles.card}>
          <Text style={styles.valueBold}>{sale.buyer.name}</Text>
          <Text style={styles.meta}>
            {sale.buyer.kind === 'WALK_IN' || sale.buyer.customerCode === null
              ? t('sales.common.walkIn')
              : sale.buyer.customerCode}
          </Text>
        </View>

        {/* Items */}
        <Text style={styles.sectionHeading}>
          {t('sales.confirmation.items')} · {t('sales.common.itemCount', { count: sale.items.length })}
        </Text>
        {sale.items.length > 0 ? (
          <View style={styles.card}>
            {sale.items.map((line, i) => (
              <View key={`${line.productId}:${line.grade}`}>
                {i > 0 ? <View style={styles.divider} /> : null}
                <View style={styles.productRow}>
                  <View style={styles.flex}>
                    <Text style={styles.productName}>{line.name}</Text>
                    <Text style={styles.meta}>
                      {t(GRADE_KEY[line.grade])} · {formatKg(line.qtyGrams)}
                    </Text>
                  </View>
                  <Text style={styles.valueBold}>{formatPaise(line.lineTotalPaise)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Payment and totals */}
        <Text style={styles.sectionHeading}>{t('sales.confirmation.paymentStatus')}</Text>
        <View style={styles.card}>
          <InfoRow label={t('sales.confirmation.method')} value={t(PAYMENT_METHOD_KEY[sale.payment.method])} />
          <InfoRow label={t('sales.confirmation.paymentStatus')} value={t(PAYMENT_STATUS_KEY[sale.paymentStatus])} />
          {sale.payment.upiTxnRef !== null ? (
            <InfoRow label={t('sales.confirmation.upiRef')} value={sale.payment.upiTxnRef} />
          ) : null}
          {sale.payment.cardRef !== null ? (
            <InfoRow label={t('sales.confirmation.cardRef')} value={sale.payment.cardRef} />
          ) : null}
          <View style={styles.divider} />
          <InfoRow label={t('sales.confirmation.subtotal')} value={formatPaise(sale.subtotalPaise)} />
          <InfoRow label={t('sales.confirmation.gst')} value={formatPaise(sale.gstPaise)} />
          <InfoRow label={t('sales.confirmation.total')} value={formatPaise(sale.totalPaise)} />
          {sale.changeGivenPaise !== null ? (
            <InfoRow label={t('sales.confirmation.changeGiven')} value={formatPaise(sale.changeGivenPaise)} />
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {onViewInvoice && invoiceId ? (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => onViewInvoice(invoiceId)}
            accessibilityRole="button"
            activeOpacity={0.85}
          >
            <InvoiceIcon size={18} color={adminColors.onBrand} />
            <Text style={styles.primaryBtnText}>{t('sales.confirmation.viewInvoice')}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => onViewSale(sale.id)}
          accessibilityRole="button"
          activeOpacity={0.75}
        >
          <Text style={styles.secondaryBtnText}>{t('sales.confirmation.viewSale')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onNewSale} accessibilityRole="button" activeOpacity={0.75}>
          <Text style={styles.secondaryBtnText}>{t('sales.confirmation.newSale')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  flex: {
    flex: 1,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
    gap: adminSpacing.md,
  },
  backButton: {
    padding: adminSpacing.xs,
    marginLeft: -4,
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  resultSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  resultCircle: {
    width: 56,
    height: 56,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  resultCircleSuccess: {
    backgroundColor: adminColors.success.bg,
  },
  resultCircleWarning: {
    backgroundColor: adminColors.warning.bg,
  },
  resultCircleDanger: {
    backgroundColor: adminColors.danger.bg,
  },
  resultTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
  resultMessage: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.xs,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.xs,
    gap: adminSpacing.md,
  },
  label: {
    ...adminType.body,
    color: adminColors.muted,
  },
  valueBold: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  meta: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginTop: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: adminSpacing.xs,
    gap: adminSpacing.md,
  },
  productName: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 10,
  },
  bottomBar: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    paddingBottom: adminSpacing.input,
    backgroundColor: adminColors.canvas,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    gap: adminSpacing.sm,
  },
  primaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  secondaryBtn: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
});
