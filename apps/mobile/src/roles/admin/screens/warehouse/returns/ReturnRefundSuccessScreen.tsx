/**
 * Wallet refund receipt. Reached only with the server's `ReturnRefundResult`
 * (BR-61): the amount (paise) and wallet transaction id are the server's own.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@tohfa/mobile-ui';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminTheme } from '../../../theme';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import type { RefundResult } from './mappers';

const { colors, spacing } = adminTheme;

export function ReturnRefundSuccessScreen(props: { result: RefundResult; onDone: () => void }): React.JSX.Element {
  const { result } = props;
  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.returns.refund.successTitle')} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <InfoSection>
          <InfoRow label={t('admin.returns.refund.amount')} value={formatPaise(result.amountPaise)} />
          {result.walletTransactionId === null ? null : (
            <InfoRow label={t('admin.returns.refund.transaction')} value={result.walletTransactionId} />
          )}
          <InfoRow label={t('admin.returns.detail.order')} value={result.detail.orderId} />
          <InfoRow label={t('admin.returns.detail.status')} value={t(result.detail.status.labelKey)} />
        </InfoSection>
        <Button title={t('admin.returns.refund.done')} onPress={props.onDone} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
