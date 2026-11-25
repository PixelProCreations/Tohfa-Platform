/**
 * The sticky Approve / Reject bar of a pending application, drawn as the
 * design draws it: a filled brand Approve and an outlined Reject with an amber
 * label, side by side.
 *
 * Shown only to an admin holding BOTH farmer.application.approve and
 * farmer.application.reject (applicationAccess.canDecide): a Farmer Admin holds
 * approve at `view` level only, so the server would 403 their Approve. Anyone
 * else who can open the application gets the read-only notice, worded without
 * role names. Approve opens the Approve Application screen (the approval and
 * its errors live there); Reject asks for confirmation, then opens the Reject
 * screen.
 */
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { detailStyles } from './detailStyles';

export interface ActionBarProps {
  canDecide: boolean;
  approveBlockedReason?: string | null | undefined;
  onApprove: () => void;
  onReject: () => void;
}

export function ActionBar({ canDecide, approveBlockedReason = null, onApprove, onReject }: ActionBarProps) {
  if (!canDecide) {
    return (
      <View style={detailStyles.bottomActionBar}>
        <View style={detailStyles.readOnlyBox}>
          <Text style={detailStyles.readOnlyText}>{t('farmerApps.action.readOnly')}</Text>
        </View>
      </View>
    );
  }
  const approveDisabled = approveBlockedReason !== null && approveBlockedReason !== undefined;
  return (
    <View style={detailStyles.bottomActionBar}>
      {approveDisabled ? (
        <Text style={detailStyles.gateWarningText} testID="farmerApps.approveGateReason">
          {approveBlockedReason}
        </Text>
      ) : null}
      <View style={detailStyles.bottomActionRow}>
        <TouchableOpacity
          style={[detailStyles.orangeApproveBtn, approveDisabled ? detailStyles.actionUnavailable : null]}
          onPress={approveDisabled ? undefined : onApprove}
          disabled={approveDisabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('farmerApps.action.approveLabel')}
          accessibilityState={{ disabled: approveDisabled }}
          accessibilityHint={approveDisabled ? approveBlockedReason : undefined}
          testID="farmerApps.approve"
        >
          <Text style={detailStyles.orangeApproveBtnText}>{t('farmerApps.action.approve')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={detailStyles.rejectOutlineBtn}
          onPress={onReject}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('farmerApps.action.rejectLabel')}
          testID="farmerApps.reject"
        >
          <Text style={detailStyles.rejectOutlineBtnText}>{t('farmerApps.action.reject')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
