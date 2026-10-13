/**
 * Cash top-up, step 2: review and submit — the money-moving write.
 *
 * Root CLAUDE.md §2.4: the Idempotency-Key is derived from customer + body via
 * the flow's `useIdempotencyKey`, so a retry of the SAME submission (timeout,
 * dropped Wi-Fi, second tap) resends the same key, and editing the amount or
 * tag yields a new one. The flow resets the key after a success.
 *
 * BR-18: the screen never shows "credited" on its own; the success screen is
 * only reached with the server's ledger row. BR-19: a 422
 * `CASH_LIMIT_EXCEEDED` from the server is shown even though the form already
 * checked the cap — the server is the enforcement.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@tohfa/mobile-ui';
import { useAdminMutation, type IdempotencyKeyHandle } from '../../../api/hooks';
import { processCashTopup, type CashTopupBody, type WalletTransactionDto } from '../../../api/wallet';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminTheme } from '../../../theme';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import { TopupCustomerCard } from './TopupCustomerCard';
import {
  cashTopupErrorKey,
  cashTopupIdempotencyFingerprint,
  cashTopupInvalidationKeys,
  type TopupCustomer,
  type ValidCashTopup,
} from './mappers';

const { colors, spacing, typography } = adminTheme;

interface SubmitVars {
  customerId: string;
  body: CashTopupBody;
  idempotencyKey: string;
}

function submitTopup(vars: SubmitVars): Promise<WalletTransactionDto> {
  return processCashTopup(vars.customerId, vars.body, vars.idempotencyKey);
}

export function CashTopupConfirmScreen(props: {
  customer: TopupCustomer;
  value: ValidCashTopup;
  body: CashTopupBody;
  warehouseId: string;
  idempotency: IdempotencyKeyHandle;
  onBack: () => void;
  onSuccess: (txn: WalletTransactionDto) => void;
}): React.JSX.Element {
  const { customer, value, body, idempotency } = props;
  const mutation = useAdminMutation(submitTopup, {
    invalidate: cashTopupInvalidationKeys(props.warehouseId),
    onSuccess: (txn: WalletTransactionDto) => {
      // The operation is complete: the next top-up, even with an identical
      // body, is a NEW operation and must not replay this key.
      idempotency.reset();
      props.onSuccess(txn);
    },
  });

  const submit = (): void => {
    if (mutation.isPending) return;
    const idempotencyKey = idempotency.keyFor(cashTopupIdempotencyFingerprint(customer.customerId, body));
    mutation.mutate({ customerId: customer.customerId, body, idempotencyKey });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title={t('admin.wallet.topup.confirm.title')}
        onBack={mutation.isPending ? undefined : props.onBack}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <TopupCustomerCard customer={customer} />
        <InfoSection title={t('admin.wallet.topup.confirm.details')}>
          <InfoRow label={t('admin.wallet.topup.amount')} value={formatPaise(value.amountPaise)} />
          <InfoRow label={t('admin.wallet.topup.fiscalTag')} value={value.fiscalTag} />
          {value.remarks === null ? null : (
            <InfoRow label={t('admin.wallet.topup.remarks')} value={value.remarks} />
          )}
        </InfoSection>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.wallet.topup.confirm.notice')}
        </Text>
        {mutation.isError ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
            {t(cashTopupErrorKey(mutation.error))}
          </Text>
        ) : null}
        <Button
          title={t(mutation.isError ? 'admin.wallet.topup.confirm.retry' : 'admin.wallet.topup.confirm.submit')}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onPress={submit}
        />
        <Button
          variant="outline"
          title={t('admin.wallet.topup.confirm.edit')}
          disabled={mutation.isPending}
          onPress={props.onBack}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
