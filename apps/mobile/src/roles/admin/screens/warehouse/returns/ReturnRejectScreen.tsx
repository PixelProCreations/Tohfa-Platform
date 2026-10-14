/**
 * Reject a PENDING or INSPECTED return — `POST /admin/returns/{id}/reject`
 * (`rma.refund.approve`, BR-61). The reason (1..300, `ReturnRejectCreate`) is
 * recorded by the server in the status history.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '@tohfa/mobile-ui';
import { useAdminMutation } from '../../../api/hooks';
import { rejectReturn } from '../../../api/returns';
import { t, type TranslationKey } from '../../../i18n';
import { adminTheme } from '../../../theme';
import { InfoRow, InfoSection } from '../shared/InfoSection';
import { ScreenHeader } from '../shared/ScreenHeader';
import {
  returnTransitionInvalidationKeys,
  returnWriteErrorKey,
  validateRejectReason,
  type ReturnDetail,
} from './mappers';

const { colors, spacing, typography } = adminTheme;

export function ReturnRejectScreen(props: {
  detail: ReturnDetail;
  warehouseId: string | null;
  onBack: () => void;
  onDone: () => void;
}): React.JSX.Element {
  const { detail } = props;
  const [reason, setReason] = useState('');
  const [error, setError] = useState<TranslationKey | undefined>(undefined);
  const mutation = useAdminMutation((text: string) => rejectReturn(detail.id, { reason: text }), {
    invalidate: returnTransitionInvalidationKeys(props.warehouseId),
    onSuccess: () => props.onDone(),
  });

  const submit = (): void => {
    if (mutation.isPending) return;
    const result = validateRejectReason(reason);
    if (!result.ok) {
      setError(result.errorKey);
      return;
    }
    setError(undefined);
    mutation.mutate(result.reason);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.surface }]}>
      <ScreenHeader title={t('admin.returns.reject.title')} onBack={mutation.isPending ? undefined : props.onBack} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <InfoSection>
          <InfoRow label={t('admin.returns.detail.order')} value={detail.orderId} />
          <InfoRow label={t('admin.returns.detail.status')} value={t(detail.status.labelKey)} />
          <InfoRow label={t('admin.returns.detail.reason')} value={detail.reason} />
        </InfoSection>
        <InfoSection>
          <Input
            label={t('admin.returns.reject.reason')}
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              setError(undefined);
            }}
            multiline
            error={error === undefined ? undefined : t(error)}
          />
        </InfoSection>
        {mutation.isError ? (
          <Text accessibilityLiveRegion="polite" style={{ color: colors.error, fontSize: typography.bodySmall }}>
            {t(returnWriteErrorKey(mutation.error))}
          </Text>
        ) : null}
        <Button
          variant="danger"
          title={t('admin.returns.reject.submit')}
          loading={mutation.isPending}
          disabled={mutation.isPending}
          onPress={submit}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
