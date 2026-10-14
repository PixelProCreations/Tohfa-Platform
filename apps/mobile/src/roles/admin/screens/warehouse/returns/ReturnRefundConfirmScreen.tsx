/**
 * Wallet refund — the money-moving write (`POST /admin/returns/{id}/refund/wallet`,
 * `rma.refund.wallet_process`, BR-61).
 *
 * Root CLAUDE.md §2.4: the Idempotency-Key comes from the FLOW's
 * `useIdempotencyKey` (ReturnsFlow), fingerprinted on the return id, so a
 * retry after a timeout or a second visit to this screen resends the same key.
 * The server additionally keys its ledger row on the return id (BR-61d), so a
 * wallet is credited once at most either way. The key is released only after
 * a success.
 *
 * The amount is NOT shown before the refund: no endpoint returns it until the
 * refund itself (`ReturnRefundResult.amount`; the server computes accepted qty
 * x unit price). The success screen shows the server's figure, in paise.
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@tohfa/mobile-ui';
import { useAdminMutation, type IdempotencyKeyHandle } from '../../../api/hooks';
import { refundReturnToWallet } from '../../../api/returns';
import { t } from '../../../i18n';
import { adminTheme } from '../../../theme';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import {
  refundIdempotencyFingerprint,
  refundInvalidationKeys,
  returnRefundErrorKey,
  toRefundResult,
  type RefundResult,
  type ReturnDetail,
} from './mappers';

const { colors, spacing, typography } = adminTheme;

interface RefundVars {
  returnId: string;
  idempotencyKey: string;
}

async function submitRefund(vars: RefundVars): Promise<RefundResult> {
  return toRefundResult(await refundReturnToWallet(vars.returnId, vars.idempotencyKey));
}

export function ReturnRefundConfirmScreen(props: {
  detail: ReturnDetail;
  warehouseId: string | null;
  idempotency: IdempotencyKeyHandle;
  onBack: () => void;
  onSuccess: (result: RefundResult) => void;
}): React.JSX.Element {
  const { detail, idempotency } = props;
  const mutation = useAdminMutation(submitRefund, {
    invalidate: refundInvalidationKeys(props.warehouseId),
    onSuccess: (result: RefundResult) => {
      idempotency.reset();
      props.onSuccess(result);
    },
  });

  const submit = (): void => {
    if (mutation.isPending) return;
    const idempotencyKey = idempotency.keyFor(refundIdempotencyFingerprint(detail.id));
    mutation.mutate({ returnId: detail.id, idempotencyKey });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader
        title={t('admin.returns.refund.title')}
        onBack={mutation.isPending ? undefined : props.onBack}
      />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <InfoSection>
          <InfoRow label={t('admin.returns.detail.order')} value={detail.orderId} />
          <InfoRow label={t('admin.returns.detail.status')} value={t(detail.status.labelKey)} />
          <InfoRow label={t('admin.returns.detail.reason')} value={detail.reason} />
        </InfoSection>
        <Text style={{ color: colors.onSurfaceVariant, fontSize: typography.bodySmall }}>
          {t('admin.returns.refund.notice')}
        </Text>
        {mutation.isError ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
            {t(returnRefundErrorKey(mutation.error))}
          </Text>
        ) : null}
        <Button
          title={t(mutation.isError ? 'admin.returns.refund.retry' : 'admin.returns.refund.submit')}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onPress={submit}
        />
        <Button
          variant="outline"
          title={t('admin.common.back')}
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
