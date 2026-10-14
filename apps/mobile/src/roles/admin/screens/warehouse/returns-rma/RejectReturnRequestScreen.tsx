/**
 * Reject Return — a reason, then POST /admin/returns/{id}/reject (plan
 * phase 10).
 *
 * BR-61: PENDING or INSPECTED -> REJECTED, with rma.refund.approve
 * (returnActions). The reason is 1..300 characters after trimming
 * (docs/openapi.yaml ReturnRejectCreate), checked by validateRejectReason
 * before anything is sent.
 *
 * Hidden, because the reject body has only `reason`: the rejection category
 * dropdown and the "notify customer" toggle.
 */
// Design id: M10-S07
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';

import { REJECT_REASON_MAX_LENGTH } from '../../../api/returns';
import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { returnActions, returnWriteErrorKey, validateRejectReason } from './mappers';
import { ActionError, PermissionNote, ReturnDetailGate, ReturnsButton, ReturnsFooter, ReturnsScreen, SectionTitle } from './ReturnsParts';
import type { ReturnDetailView, ReturnsLiveStateProps, ReturnsWriteStateProps, WarehouseScreenBaseProps } from './types';

export interface RejectReturnRequestScreenProps extends WarehouseScreenBaseProps, ReturnsLiveStateProps, ReturnsWriteStateProps {
  detail: ReturnDetailView | undefined;
  notFound?: boolean | undefined;
  onConfirmReject: (reason: string) => void;
}

// Fixed height of the multi-line reason box: a layout size, not spacing.
const REASON_MIN_HEIGHT = 96;

export function RejectReturnRequestScreen({
  can,
  onBack,
  detail,
  notFound,
  onConfirmReject,
  isSubmitting = false,
  submitError,
  isLoading,
  error,
  onRetry,
}: RejectReturnRequestScreenProps) {
  const [text, setText] = useState('');
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null);
  const canReject = detail !== undefined && returnActions(detail.status, can).reject;

  const confirm = () => {
    const result = validateRejectReason(text);
    if (!result.ok) {
      setErrorKey(result.errorKey);
      return;
    }
    setErrorKey(null);
    onConfirmReject(result.reason);
  };

  return (
    <ReturnsScreen
      title={t('returns.reject.title')}
      subtitle={detail?.reference}
      onBack={onBack}
      footer={
        detail === undefined ? null : (
          <ReturnsFooter>
            <ReturnsButton
              label={t(isSubmitting ? 'returns.reject.pending' : 'returns.reject.confirm')}
              variant="danger"
              disabled={!canReject || isSubmitting}
              onPress={confirm}
            />
            {canReject ? null : <PermissionNote>{t('returns.detail.noAction')}</PermissionNote>}
          </ReturnsFooter>
        )
      }
    >
      <ReturnDetailGate detail={detail} notFound={notFound} isLoading={isLoading} error={error} onRetry={onRetry}>
        {(d) => (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {submitError !== null && submitError !== undefined ? <ActionError messageKey={returnWriteErrorKey(submitError)} /> : null}
            <SectionTitle>{t('returns.detail.reason')}</SectionTitle>
            <Text style={styles.body}>{d.reason}</Text>
            <SectionTitle>{t('returns.reject.reasonLabel')}</SectionTitle>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={REJECT_REASON_MAX_LENGTH}
              placeholder={t('returns.reject.placeholder')}
              placeholderTextColor={adminColors.placeholder}
              editable={canReject && !isSubmitting}
              accessibilityLabel={t('returns.reject.reasonLabel')}
            />
            <Text style={styles.counter}>{t('returns.reject.counter', { count: text.trim().length, max: REJECT_REASON_MAX_LENGTH })}</Text>
            {errorKey ? <Text style={styles.fieldError}>{t(errorKey, { max: REJECT_REASON_MAX_LENGTH })}</Text> : null}
          </ScrollView>
        )}
      </ReturnDetailGate>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  body: { ...adminType.body, color: adminColors.ink },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    minHeight: REASON_MIN_HEIGHT,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    padding: adminSpacing.md,
  },
  counter: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'right', marginTop: adminSpacing.xs },
  fieldError: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
});
