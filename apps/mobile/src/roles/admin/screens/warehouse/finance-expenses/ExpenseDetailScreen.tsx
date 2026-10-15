// Design id: M11-S05
/**
 * Expense detail (BR-62, BR-63): GET /admin/expenses/{id}, gated on
 * finance.expense.log. Out of scope or unknown is a 404, rendered as the
 * error state.
 *
 * Read-only. An expense is recorded once and has no workflow: there is no
 * PATCH, cancel or approve endpoint (BR-62; BR-73 was withdrawn), so there is
 * no Edit or Cancel action. There is no receipt either (ExpenseCreate has no
 * receipt field). The voucher (BR-75) is opened on its own screen, which reads
 * GET /admin/expenses/{id}/voucher.
 *
 * The route carries only the expense id. The Sub shell also renders this
 * screen with no id; it then shows a not-found state and fetches nothing.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminSpacing } from '../../../theme';
import { formatAdminDate } from '../../../utils/datetime';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  AmountRow,
  Card,
  InfoCard,
  InfoNote,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { EXPENSE_STATUS_TONE } from './ExpenseRow';
import { FINANCE_CODES, FinanceNotAvailable } from './FinanceParts';
import type { WarehouseScreenBaseProps } from './types';
import { useExpense } from './useFinanceData';

export interface ExpenseDetailScreenProps extends WarehouseScreenBaseProps {
  /** The expense uuid. */
  expenseId?: string | undefined;
  /** Open the expense's voucher (VoucherDetail reads it). */
  onViewVoucher?: ((expenseId: string) => void) | undefined;
}

export function ExpenseDetailScreen(props: ExpenseDetailScreenProps) {
  if (!props.can(FINANCE_CODES.expenseLog)) {
    return (
      <FinanceNotAvailable title={t('finance.expenseDetail.title')} message={t('finance.notAvailable.message')} onBack={props.onBack} />
    );
  }
  return (
    <WalletScreen title={t('finance.expenseDetail.title')} onBack={props.onBack}>
      {props.expenseId === undefined ? (
        <AdminEmptyState title={t('finance.expenseDetail.notFound.title')} subtitle={t('finance.expenseDetail.notFound.subtitle')} />
      ) : (
        <ExpenseDetailBody expenseId={props.expenseId} onViewVoucher={props.onViewVoucher} />
      )}
    </WalletScreen>
  );
}

function ExpenseDetailBody({
  expenseId,
  onViewVoucher,
}: {
  expenseId: string;
  onViewVoucher?: ((expenseId: string) => void) | undefined;
}) {
  const { expense, isLoading, error, refresh } = useExpense(expenseId);
  if (expense === undefined) {
    if (isLoading) return <AdminLoadingState />;
    if (error != null) return <AdminErrorState error={error} onRetry={refresh} />;
    return <AdminEmptyState title={t('finance.expenseDetail.notFound.title')} />;
  }
  const notRecorded = t('finance.expenseDetail.notRecorded');
  return (
    <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
      <SectionTitle right={<StatusBadge label={expense.statusLabel} tone={EXPENSE_STATUS_TONE[expense.status] ?? 'info'} />}>
        {t('finance.expenseDetail.section.details')}
      </SectionTitle>
      <Card>
        <AmountRow label={t('finance.expenseDetail.field.amount')} value={formatPaise(expense.amountPaise)} emphasis="total" />
      </Card>
      <InfoCard
        rows={[
          [
            { label: t('finance.expenseDetail.field.category'), value: expense.categoryName },
            { label: t('finance.expenseDetail.field.date'), value: expense.dateLabel },
          ],
          [
            { label: t('finance.expenseDetail.field.paymentMethod'), value: expense.paymentMethodLabel || notRecorded },
            { label: t('finance.expenseDetail.field.vendor'), value: expense.vendor ?? notRecorded },
          ],
          [{ label: t('finance.expenseDetail.field.description'), value: expense.description ?? notRecorded }],
          [{ label: t('finance.expenseDetail.field.recordedAt'), value: formatAdminDate(expense.createdAt, new Date()) }],
        ]}
      />

      {onViewVoucher ? (
        <>
          <SectionTitle>{t('finance.expenseDetail.section.voucher')}</SectionTitle>
          <InfoNote tone="info">{t('finance.expenseDetail.voucherNote')}</InfoNote>
          <View style={styles.action}>
            <WalletButton label={t('finance.expenseDetail.viewVoucher')} variant="outline" onPress={() => onViewVoucher(expense.id)} />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  action: { marginTop: adminSpacing.sm },
});
