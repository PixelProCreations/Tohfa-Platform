/**
 * Approve Return? — confirmation before an RMA moves to the refund stage.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1), FINAL_LIST row 93:
 *   - "Approve" is enabled only with `rma.request.process` AND `rma.refund.approve`.
 *   - A Sub scope may approve only RMAs of its own warehouse.
 */
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState } from '../shared/AsyncStates';
import { toRmaRecord } from './mappers';
import { useApproveReturn, useReturn } from './useReturnData';
import { inScope, PermissionNote, ReturnsButton, ReturnsScreen } from './ReturnsParts';
import type { RmaRecord, RmaScreenBaseProps } from './types';

export interface ApproveReturnScreenProps extends RmaScreenBaseProps {
  onConfirmApprove: (rma: RmaRecord) => void;
}

function QuestionCircleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={adminColors.success.text} strokeWidth="1.8" />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"
        stroke={adminColors.success.text}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={adminColors.success.text} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseCrossIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={adminColors.brandDeep} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function ApproveReturnScreen({ scope, can, returnId, rma: initialRma, onBack, onConfirmApprove }: ApproveReturnScreenProps) {
  const effectiveId = returnId ?? initialRma?.id;
  const returnQuery = useReturn(effectiveId);
  const rma = returnQuery.data ? toRmaRecord(returnQuery.data) : initialRma;

  const approveMutation = useApproveReturn();
  const [submitError, setSubmitError] = useState<unknown>(null);

  const canApprove =
    can('rma.request.process') &&
    can('rma.refund.approve') &&
    inScope(scope, rma?.warehouseId);

  const handleApprove = async () => {
    if (!effectiveId || !canApprove) return;
    setSubmitError(null);
    try {
      const updated = await approveMutation.mutateAsync(effectiveId);
      onConfirmApprove(toRmaRecord(updated));
    } catch (err) {
      setSubmitError(err);
    }
  };

  if (!rma) {
    return (
      <ReturnsScreen title="Review Return Request" onBack={onBack}>
        <View style={styles.content}>
          <Text style={{ ...adminType.body, color: adminColors.muted }}>Return not found</Text>
        </View>
      </ReturnsScreen>
    );
  }

  return (
    <ReturnsScreen title="Review Return Request" subtitle={rma.rmaId} onBack={onBack}>
      <View style={styles.content}>
        {submitError ? (
          <View style={{ marginBottom: adminSpacing.md }}>
            <AdminErrorState error={submitError} onRetry={handleApprove} />
          </View>
        ) : null}

        <View style={styles.confirmCard}>
          <View style={styles.cardHeaderRow}>
            <QuestionCircleIcon />
            <Text style={styles.cardHeaderTitle}>Approve Return?</Text>
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>This will move the RMA to the refund/resolution stage.</Text>
          </View>

          <View style={styles.actions}>
            <ReturnsButton
              variant="successOutline"
              label={approveMutation.isPending ? 'Approving...' : 'Approve'}
              icon={<CheckmarkIcon />}
              disabled={!canApprove || approveMutation.isPending}
              onPress={handleApprove}
            />
            <ReturnsButton
              variant="neutralOutline"
              label="Cancel"
              icon={<CloseCrossIcon />}
              disabled={approveMutation.isPending}
              onPress={onBack}
            />
            {canApprove ? null : (
              <PermissionNote>Approving needs both the RMA processing and refund approval permissions.</PermissionNote>
            )}
          </View>
        </View>
      </View>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg },
  confirmCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1.5,
    borderColor: adminColors.success.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  cardHeaderTitle: { ...adminType.title, color: adminColors.ink },
  noteBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  noteText: { ...adminType.body, color: adminColors.muted },
  actions: { gap: adminSpacing.md },
});
