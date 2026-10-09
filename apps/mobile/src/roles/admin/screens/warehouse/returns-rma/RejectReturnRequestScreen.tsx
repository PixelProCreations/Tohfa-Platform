/**
 * Reject Return Request — a mandatory rejection reason, then reject.
 *
 * Gates (docs/rbac.json; the server re-checks, CLAUDE.md 2.1):
 *   - "Reject Request" only with `rma.request.process` (FINAL_LIST row 98).
 *
 * Absorbs MainWarehouseRejectReturnRequestScreen (pair M10-S04R): its red
 * error outline on an empty reason is ported; the rest matched.
 */
// Design id: M10-S04R
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
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

export function RejectReturnRequestScreen({ can, rma, onBack, onRejectSuccess }: RejectReturnRequestScreenProps) {
  const canProcess = can('rma.request.process');
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);

  const handleReject = () => {
    if (!reason.trim()) {
      setShowError(true);
      return;
    }
    setShowError(false);
    onRejectSuccess({ rma, reason: reason.trim() });
  };

  return (
    <ReturnsScreen
      title="Reject Return Request"
      subtitle={rma.rmaId}
      onBack={onBack}
      footer={
        <ReturnsFooter>
          {canProcess ? (
            <ReturnsButton variant="danger" label="Reject Request" icon={<CloseCrossIcon />} onPress={handleReject} />
          ) : (
            <PermissionNote>Rejecting a return needs the RMA processing permission.</PermissionNote>
          )}
          <ReturnsButton variant="neutralOutline" label="Cancel" onPress={onBack} />
        </ReturnsFooter>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            editable={canProcess}
          />
        </View>
        {showError ? (
          <View style={styles.warningBanner}>
            <WarningTriangleIcon />
            <Text style={styles.warningText}>Rejection reason is required.</Text>
          </View>
        ) : null}
      </ScrollView>
    </ReturnsScreen>
  );
}

// Text area heights: fixed sizes, not spacing.
const TEXTAREA_MIN_HEIGHT = 120;
const TEXTAREA_INPUT_MIN_HEIGHT = 100;

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg },
  screenHeading: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.lg },
  label: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: adminSpacing.sm },
  asterisk: { color: adminColors.danger.text },
  textareaContainer: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    minHeight: TEXTAREA_MIN_HEIGHT,
  },
  textareaError: { borderColor: adminColors.danger.border },
  textarea: { ...adminType.body, color: adminColors.ink, minHeight: TEXTAREA_INPUT_MIN_HEIGHT, padding: 0 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  warningText: { ...adminType.sectionHead, color: adminColors.warning.text },
});
