/**
 * Cash top-up, step 3: the server's receipt.
 *
 * Everything shown comes from the `WalletTransaction` the server returned
 * (BR-18: the client never asserts the credit) — the transaction id is the
 * real ledger id, not a client-made reference. If an amount in that row is
 * malformed (a contract bug) the id is still shown so the admin can quote it;
 * the amounts are left out rather than guessed.
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@tohfa/mobile-ui';
import type { WalletTransactionDto } from '../../../api/wallet';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminTheme } from '../../../theme';
import { formatIstDateTime } from '../../../utils/datetime';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import { toCashTopupResult, type CashTopupResult, type TopupCustomer } from './mappers';

const { colors, spacing, typography, weights } = adminTheme;

function safeResult(txn: WalletTransactionDto): CashTopupResult | null {
  try {
    return toCashTopupResult(txn);
  } catch {
    return null;
  }
}

export function CashTopupSuccessScreen(props: {
  customer: TopupCustomer;
  txn: WalletTransactionDto;
  onDone: () => void;
}): React.JSX.Element {
  const { txn } = props;
  const result = useMemo(() => safeResult(txn), [txn]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.wallet.topup.success.title')} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <Text
          accessibilityRole="header"
          style={{ color: colors.onSurface, fontSize: typography.bodyLarge, fontWeight: weights.semibold }}
        >
          {t('admin.wallet.topup.success.message', { name: props.customer.name })}
        </Text>
        <InfoSection>
          <InfoRow label={t('admin.wallet.topup.success.transactionId')} value={txn.id} />
          {result === null ? null : (
            <>
              <InfoRow label={t('admin.wallet.topup.success.type')} value={t(result.txnTypeKey)} />
              <InfoRow label={t('admin.wallet.topup.amount')} value={formatPaise(result.amountPaise)} />
              <InfoRow
                label={t('admin.wallet.topup.success.balanceAfter')}
                value={formatPaise(result.balanceAfterPaise)}
              />
            </>
          )}
          {txn.fiscalCashTag === null ? null : (
            <InfoRow label={t('admin.wallet.topup.fiscalTag')} value={txn.fiscalCashTag} />
          )}
          <InfoRow
            label={t('admin.wallet.topup.success.performedAt')}
            value={formatIstDateTime(txn.performedAt) ?? txn.performedAt}
          />
        </InfoSection>
        <Button title={t('admin.wallet.topup.success.done')} onPress={props.onDone} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
