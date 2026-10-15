// Design id: M11-S07b
/**
 * Expense voucher (BR-75): GET /admin/expenses/{id}/voucher, gated on
 * finance.expense.log. The voucher number and the recorder's name come from
 * the server; nothing here is derived.
 *
 * No print, share or download: there is no voucher document endpoint and no
 * in-app file mechanism to hand one to. With no expense id the screen shows a
 * not-found state and fetches nothing.
 */
import React from 'react';
import { ScrollView } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { AmountRow, Card, InfoCard, SectionTitle, StatusBadge, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { FINANCE_CODES, FinanceNotAvailable } from './FinanceParts';
import type { WarehouseScreenBaseProps } from './types';
import { useExpenseVoucher } from './useFinanceData';

export interface VoucherDetailScreenProps extends WarehouseScreenBaseProps {
  /** The expense uuid the voucher is derived from. */
  expenseId?: string | undefined;
}

export function VoucherDetailScreen(props: VoucherDetailScreenProps) {
  if (!props.can(FINANCE_CODES.expenseLog)) {
    return (
      <FinanceNotAvailable title={t('finance.voucherDetail.title')} message={t('finance.notAvailable.message')} onBack={props.onBack} />
    );
  }
  return (
    <WalletScreen title={t('finance.voucherDetail.title')} onBack={props.onBack}>
      {props.expenseId === undefined ? (
        <AdminEmptyState title={t('finance.voucherDetail.notFound.title')} subtitle={t('finance.voucherDetail.notFound.subtitle')} />
      ) : (
        <VoucherBody expenseId={props.expenseId} />
      )}
    </WalletScreen>
  );
}

function VoucherBody({ expenseId }: { expenseId: string }) {
  const { voucher, isLoading, error, refresh } = useExpenseVoucher(expenseId);
  if (voucher === undefined) {
    if (isLoading) return <AdminLoadingState />;
    if (error != null) return <AdminErrorState error={error} onRetry={refresh} />;
    return <AdminEmptyState title={t('finance.voucherDetail.notFound.title')} />;
  }
  const notRecorded = t('finance.voucherDetail.notRecorded');
  const warehouse =
    voucher.warehouseName === null
      ? notRecorded
      : voucher.warehouseCode === null
        ? voucher.warehouseName
        : t('finance.voucherDetail.warehouseValue', { name: voucher.warehouseName, code: voucher.warehouseCode });
  return (
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle right={<StatusBadge label={voucher.statusLabel} tone="info" />}>{voucher.voucherNumber}</SectionTitle>
      <Card>
        <AmountRow label={t('finance.voucherDetail.field.amount')} value={formatPaise(voucher.amountPaise)} emphasis="total" />
      </Card>
      <InfoCard
        rows={[
          [
            { label: t('finance.voucherDetail.field.voucherNumber'), value: voucher.voucherNumber },
            { label: t('finance.voucherDetail.field.date'), value: voucher.dateLabel },
          ],
          [
            { label: t('finance.voucherDetail.field.warehouse'), value: warehouse },
            { label: t('finance.voucherDetail.field.category'), value: voucher.categoryName },
          ],
          [
            { label: t('finance.voucherDetail.field.paymentMethod'), value: voucher.paymentMethodLabel || notRecorded },
            { label: t('finance.voucherDetail.field.vendor'), value: voucher.vendor ?? notRecorded },
          ],
          [{ label: t('finance.voucherDetail.field.description'), value: voucher.description ?? notRecorded }],
          [{ label: t('finance.voucherDetail.field.recordedBy'), value: voucher.recordedByName }],
        ]}
      />
    </ScrollView>
  );
}
