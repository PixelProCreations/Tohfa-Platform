/**
 * Reject Return Request — a mandatory rejection reason, then reject.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - "Reject Request" only with `rma.request.process` and `rma.refund.approve`.
 */
// Design id: M10-S04R
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { REJECT_REASON_MAX_LENGTH } from '../../../api/returns';
import { AdminErrorState } from '../shared/AsyncStates';
import { toRmaRecord } from './mappers';
import { useRejectReturn, useReturn } from './useReturnData';
import { PermissionNote, ReturnsButton, ReturnsFooter, ReturnsScreen } from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface RejectReturnRequestScreenProps extends RmaScreenBaseProps {
  onRejectSuccess: (data: { rma: RmaRecord; reason: string }) => void;
}

function WarningTriangleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"
        stroke={adminColors.warning.text}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseCrossIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function RejectReturnRequestScreen({ can, returnId, rma: initialRma, onBack, onRejectSuccess }: RejectReturnRequestScreenProps) {
  const effectiveId = returnId ?? initialRma?.id;
  const returnQuery = useReturn(effectiveId);
  const rma = returnQuery.data ? toRmaRecord(returnQuery.data) : initialRma;

  const canReject = can('rma.request.process') && can('rma.refund.approve');
  const rejectMutation = useRejectReturn();

  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const trimmed = reason.trim();
  const isReasonValid = trimmed.length >= 1 && trimmed.length <= REJECT_REASON_MAX_LENGTH;

  const handleReject = async () => {
    if (!isReasonValid) {
      setShowError(true);
      return;
    }
    if (!effectiveId || !canReject) return;
    setShowError(false);
    setSubmitError(null);
    try {
      const updated = await rejectMutation.mutateAsync({ id: effectiveId, reason: trimmed });
      onRejectSuccess({ rma: toRmaRecord(updated), reason: trimmed });
    } catch (err) {
      setSubmitError(err);
    }
  };

  if (!rma) {
    return (
      <ReturnsScreen title="Reject Return Request" onBack={onBack}>
        <View style={styles.scrollContent}>
          <Text style={{ ...adminType.body, color: adminColors.muted }}>Return not found</Text>
        </View>
      </ReturnsScreen>
    );
  }

  return (
    <ReturnsScreen
      title="Reject Return Request"
      subtitle={rma.rmaId}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          {canReject ? (
            <ReturnsButton
              variant="danger"
              label={rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
              icon={<CloseCrossIcon />}
              disabled={rejectMutation.isPending}
              onPress={handleReject}
            />
          ) : (
            <PermissionNote>Rejecting a return needs the RMA processing and refund approval permissions.</PermissionNote>
          )}
          <ReturnsButton variant="neutralOutline" label="Cancel" disabled={rejectMutation.isPending} onPress={onBack} />
        </ReturnsFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {submitError ? (
          <View style={{ marginBottom: adminSpacing.md }}>
            <AdminErrorState error={submitError} onRetry={handleReject} />
          </View>
        ) : null}

        <Text style={styles.screenHeading}>Reject Return Request</Text>
        <Text style={styles.label}>
          Rejection Reason <Text style={styles.asterisk}>*</Text>
        </Text>
        <View style={[styles.textareaContainer, showError && styles.textareaError]}>
          <TextInput
            style={styles.textarea}
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (showError && text.trim()) setShowError(false);
            }}
            placeholder="Enter the reason for rejecting this return request..."
            placeholderTextColor={adminColors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={REJECT_REASON_MAX_LENGTH}
            editable={canReject && !rejectMutation.isPending}
          />
        </View>
        <Text style={styles.charCount}>{`${reason.length}/${REJECT_REASON_MAX_LENGTH}`}</Text>

        {showError ? (
          <View style={styles.warningBanner}>
            <WarningTriangleIcon />
            <Text style={styles.warningText}>Rejection reason is required (1-{REJECT_REASON_MAX_LENGTH} characters).</Text>
          </View>
        ) : null}
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  screenHeading: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.lg },
  label: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: adminSpacing.xs },
  asterisk: { color: adminColors.danger.text },
  textareaContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    minHeight: 120,
    marginBottom: adminSpacing.xs,
  },
  textareaError: { borderColor: adminColors.danger.border },
  textarea: { ...adminType.body, color: adminColors.ink, flex: 1, padding: 0 },
  charCount: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'right', marginBottom: adminSpacing.md },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.sm,
  },
  warningText: { ...adminType.rowMeta, color: adminColors.warning.text, flex: 1 },
});
