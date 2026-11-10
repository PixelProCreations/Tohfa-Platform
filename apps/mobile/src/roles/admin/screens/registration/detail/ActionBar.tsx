/**
 * The sticky Approve / Reject bar of a pending application.
 *
 * Shown only to an admin holding BOTH farmer.application.approve and
 * farmer.application.reject (applicationAccess.canDecide): a Farmer Admin holds
 * approve at `view` level only, so the server would 403 their Approve. Anyone
 * else who can open the application gets the read-only notice, worded without
 * role names. A refused approval (BR-69, BR-135, 403, 409, ...) is shown above
 * the buttons through applicationErrorKey; the button stays so the admin can
 * retry with the same Idempotency-Key.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { partStyles } from '../applications/ApplicationParts';
import { applicationErrorKey } from '../applications/applicationLogic';

export interface ActionBarProps {
  canDecide: boolean;
  isApproving: boolean;
  approveError: unknown;
  onApprove: () => void;
  onReject: () => void;
}

export function ActionBar({ canDecide, isApproving, approveError, onApprove, onReject }: ActionBarProps) {
  if (!canDecide) {
    return (
      <View style={styles.bar}>
        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyText}>{t('farmerApps.action.readOnly')}</Text>
        </View>
      </View>
    );
  }
  const hasError = approveError !== null && approveError !== undefined;
  return (
    <View style={styles.wrap}>
      {hasError ? (
        <View style={partStyles.errorBox} accessibilityLiveRegion="polite">
          <Text style={partStyles.errorText}>{t(applicationErrorKey(approveError))}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.approveBtn, isApproving ? styles.busy : null]}
          onPress={onApprove}
          disabled={isApproving}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: isApproving, busy: isApproving }}
          testID="farmerApps.approve"
        >
          <Text style={styles.approveText}>{isApproving ? t('farmerApps.action.approving') : t('farmerApps.action.approve')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={onReject}
          disabled={isApproving}
          activeOpacity={0.8}
          accessibilityRole="button"
          testID="farmerApps.reject"
        >
          <Text style={styles.rejectText}>{t('farmerApps.action.reject')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    gap: adminSpacing.sm,
    ...adminShadow.lg,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    ...adminShadow.lg,
  },
  row: { flexDirection: 'row', gap: adminSpacing.md },
  approveBtn: {
    flex: 1,
    backgroundColor: adminColors.success.text,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busy: { opacity: 0.6 },
  approveText: { ...adminType.rowTitle, color: adminColors.onBrand },
  rejectBtn: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.danger.text,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { ...adminType.rowTitle, color: adminColors.danger.text },
  readOnlyBox: {
    flex: 1,
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.smMd,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyText: { ...adminType.body, color: adminColors.warning.text, textAlign: 'center' },
});
