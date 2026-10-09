/**
 * Approve Return? — confirmation before an RMA moves to the refund stage.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1), FINAL_LIST row 93:
 *   - "Approve" is enabled only with `rma.request.process` AND
 *     `rma.refund.approve`.
 *   - A Sub scope may approve only RMAs of its own warehouse
 *     (rma.refund.approve SUB grant `own`). Mock RMAs carry no warehouse yet,
 *     so this narrows nothing until the API returns one; the server must apply
 *     the same filter (cross-warehouse = empty result, not 403).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
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

export function ApproveReturnScreen({ scope, can, rma, onBack, onConfirmApprove }: ApproveReturnScreenProps) {
  const canApprove =
    can('rma.request.process') && can('rma.refund.approve') && inScope(scope, rma.warehouseId);

  return (
    <ReturnsScreen title="Review Return Request" subtitle={rma.rmaId} onBack={onBack}>
      <View style={styles.content}>
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
              label="Approve"
              icon={<CheckmarkIcon />}
              disabled={!canApprove}
              onPress={() => onConfirmApprove(rma)}
            />
            <ReturnsButton variant="neutralOutline" label="Cancel" icon={<CloseCrossIcon />} onPress={onBack} />
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
  cardHeaderTitle: { ...adminType.sectionHead, color: adminColors.success.text },
  noteBox: {
    backgroundColor: adminColors.canvas,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  noteText: { ...adminType.body, color: adminColors.ink },
  actions: { gap: adminSpacing.sm },
});
