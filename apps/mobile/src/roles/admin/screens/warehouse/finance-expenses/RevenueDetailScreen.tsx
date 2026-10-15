// Design id: M11-S03
/**
 * Revenue detail (BR-63): GET /admin/finance/revenue/{orderId}, gated on
 * finance.sales_income.view. An order outside the caller's scope, or unknown,
 * is a 404 and renders as the error state.
 *
 * The route carries only the order id; every figure comes from the server.
 * With no id (a host that opened the screen without one) it shows a
 * not-found state and fetches nothing.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminSpacing } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { AmountRow, Card, InfoCard, InfoNote, SectionTitle, WalletButton, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { FINANCE_CODES, FinanceNotAvailable } from './FinanceParts';
import type { WarehouseScreenBaseProps } from './types';
import { useRevenueDetail } from './useFinanceData';

export interface RevenueDetailScreenProps extends WarehouseScreenBaseProps {
  /** The order uuid. */
  orderId?: string | undefined;
  onViewOrder?: (() => void) | undefined;
  onViewInvoice?: (() => void) | undefined;
  onViewTransactionHistory?: (() => void) | undefined;
}

export function RevenueDetailScreen(props: RevenueDetailScreenProps) {
  if (!props.can(FINANCE_CODES.salesIncome)) {
    return (
      <FinanceNotAvailable title={t('finance.revenueDetail.title')} message={t('finance.notAvailable.message')} onBack={props.onBack} />
    );
  }
  return (
    <WalletScreen title={t('finance.revenueDetail.title')} onBack={props.onBack}>
      {props.orderId === undefined ? (
        <AdminEmptyState title={t('finance.revenueDetail.notFound.title')} subtitle={t('finance.revenueDetail.notFound.subtitle')} />
      ) : (
        <RevenueDetailBody {...props} orderId={props.orderId} />
      )}
    </WalletScreen>
  );
}

function RevenueDetailBody({
  can,
  orderId,
  onViewOrder,
  onViewInvoice,
  onViewTransactionHistory,
}: RevenueDetailScreenProps & { orderId: string }) {
  const { revenue, isLoading, error, refresh } = useRevenueDetail(orderId);
  if (revenue === undefined) {
    if (isLoading) return <AdminLoadingState />;
    if (error != null) return <AdminErrorState error={error} onRetry={refresh} />;
    return <AdminEmptyState title={t('finance.revenueDetail.notFound.title')} />;
  }
  const now = new Date();
  const showOrder = onViewOrder !== undefined && can(FINANCE_CODES.orderList);
  const showInvoice = onViewInvoice !== undefined && revenue.invoiceNumber !== null && can(FINANCE_CODES.invoiceView);

  return (
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle>{t('finance.revenueDetail.section.payment')}</SectionTitle>
      <Card>
        <AmountRow label={t('finance.revenueDetail.field.amount')} value={formatPaise(revenue.amountPaise)} emphasis="total" />
        <AmountRow divider label={t('finance.revenueDetail.field.gst')} value={formatPaise(revenue.gstPaise)} />
      </Card>
      <InfoCard
        rows={[
          [
            { label: t('finance.revenueDetail.field.channel'), value: revenue.channelLabel },
            { label: t('finance.revenueDetail.field.paymentMethod'), value: revenue.paymentMethodLabel },
          ],
          [
            { label: t('finance.revenueDetail.field.paymentStatus'), value: revenue.paymentStatus },
            { label: t('finance.revenueDetail.field.completedAt'), value: revenue.dateLabel },
          ],
        ]}
      />

      <SectionTitle>{t('finance.revenueDetail.section.order')}</SectionTitle>
      <InfoCard
        rows={[
          [
            { label: t('finance.revenueDetail.field.orderStatus'), value: revenue.orderStatus },
            { label: t('finance.revenueDetail.field.placedAt'), value: formatAdminDate(revenue.placedAt, now) },
          ],
        ]}
      />

      <SectionTitle>{t('finance.revenueDetail.section.invoice')}</SectionTitle>
      {revenue.invoiceNumber === null ? (
        <InfoNote tone="info">{t('finance.revenueDetail.noInvoice')}</InfoNote>
      ) : (
        <InfoCard
          rows={[
            [
              { label: t('finance.revenueDetail.field.invoiceNumber'), value: revenue.invoiceNumber },
              { label: t('finance.revenueDetail.field.invoiceStatus'), value: revenue.invoiceStatus ?? '' },
            ],
          ]}
        />
      )}

      <View style={styles.actions}>
        {showOrder ? <WalletButton label={t('finance.revenueDetail.viewOrder')} variant="outline" onPress={onViewOrder} /> : null}
        {showInvoice ? <WalletButton label={t('finance.revenueDetail.viewInvoice')} variant="outline" onPress={onViewInvoice} /> : null}
        {onViewTransactionHistory ? (
          <WalletButton label={t('finance.revenueDetail.viewHistory')} variant="neutral" onPress={onViewTransactionHistory} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: { gap: adminSpacing.sm, marginTop: adminSpacing.md },
});
