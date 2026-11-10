/**
 * Approval Detail — Farmer Payout Screen (SA-M2-S06 / PAY-0002)
 * Details view for dual-approval of farmer payouts above Rs 10,000 (BR-31/31b).
 */
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  adminColors,
  adminRadius,
  adminSpacing,
  adminType,
  ADMIN_BUTTON_HEIGHT,
} from '../../theme';
import { BackArrowIcon } from '../../components/AdminIcons';
import { t } from '../../i18n';

export interface ApprovalDetailPayoutScreenProps {
  payoutId?: string;
  can?: (permission: string) => boolean;
  onBack: () => void;
  onApprove?: (reason?: string) => void;
  onReject?: (reason?: string) => void;
}

export function ApprovalDetailPayoutScreen({
  payoutId = 'PAY-0002',
  can,
  onBack,
  onApprove,
  onReject,
}: ApprovalDetailPayoutScreenProps) {
  const [approvalNote, setApprovalNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canApprove = can ? can('payout.approve_above_10k') : true;

  const handleApprove = () => {
    if (!canApprove) {
      Alert.alert('Permission Denied', 'Payouts above Rs 10,000 require Super Admin dual approval.');
      return;
    }
    setIsProcessing(true);
    Alert.alert(
      t('payoutDetail.approveConfirmTitle'),
      t('payoutDetail.approveConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => setIsProcessing(false) },
        {
          text: t('payoutDetail.approveButton'),
          onPress: () => {
            if (onApprove) onApprove(approvalNote);
            setIsProcessing(false);
            onBack();
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      t('payoutDetail.rejectConfirmTitle'),
      t('payoutDetail.rejectConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('payoutDetail.rejectButton'),
          style: 'destructive',
          onPress: () => {
            if (onReject) onReject(approvalNote);
            onBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <BackArrowIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{payoutId.replace('PAY', 'Payout PY')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Farmer Details */}
        <Text style={styles.sectionHeader}>1 · Farmer details</Text>
        <View style={styles.card}>
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Farmer ID</Text>
            <Text style={styles.valueCol}>FMR-00098</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Farmer name</Text>
            <Text style={styles.valueCol}>Kumar</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Registered contact</Text>
            <Text style={styles.valueCol}>Not shown here</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Verified payout account</Text>
            <Text style={styles.valueCol}>•••• 0123</Text>
          </View>
        </View>

        {/* Section 2: Purchase Details */}
        <Text style={styles.sectionHeader}>2 · Purchase details</Text>
        <View style={styles.card}>
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Purchase order</Text>
            <Text style={styles.valueCol}>PO-0002</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Purchase date</Text>
            <Text style={styles.valueCol}>8 Oct 2026</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Goods receipt</Text>
            <Text style={styles.valueCol}>GR-0002</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Produce</Text>
            <Text style={styles.valueCol}>Beans</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Accepted quantity</Text>
            <Text style={styles.valueCol}>300 kg</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Accepted grade</Text>
            <Text style={styles.valueCol}>Grade 1</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Unit price</Text>
            <Text style={styles.valueCol}>₹42.00 per kg</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Purchase value</Text>
            <Text style={styles.valueCol}>₹12,600.00</Text>
          </View>
        </View>

        {/* Section 3: Payout Calculation */}
        <Text style={styles.sectionHeader}>3 · Payout calculation</Text>
        <View style={styles.card}>
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Accepted produce value</Text>
            <Text style={styles.valueCol}>₹12,600.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Approved adjustments</Text>
            <Text style={styles.valueCol}>₹0.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Net payable amount</Text>
            <Text style={styles.valueCol}>₹12,600.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Currency</Text>
            <Text style={styles.valueCol}>INR</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Calculation reference</Text>
            <Text style={styles.valueCol}>CALC-PAY-0002</Text>
          </View>
        </View>

        {/* Section 4: Approval History */}
        <Text style={styles.sectionHeader}>4 · Approval history</Text>
        <View style={styles.card}>
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Requested by</Text>
            <Text style={styles.valueCol}>Demo TOHFA Admin, 9 Oct 2026, 10:00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Approval</Text>
            <Text style={styles.valueCol}>Awaiting Super Admin Approval</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Approver</Text>
            <Text style={styles.valueCol}>—</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Rejection reason</Text>
            <Text style={styles.valueCol}>—</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Processing reference</Text>
            <Text style={styles.valueCol}>—</Text>
          </View>
        </View>

        <Text style={styles.auditMetaText}>
          9 Oct 2026, 10:00 · Demo TOHFA Admin{'\n'}
          Payout requested and escalated to the Super Admin: ₹12,600.00
        </Text>

        {/* Section 5: Payment Information */}
        <Text style={styles.sectionHeader}>5 · Payment information</Text>
        <View style={styles.card}>
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Payment method</Text>
            <Text style={styles.valueCol}>Bank transfer (configured)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Provider reference</Text>
            <Text style={styles.valueCol}>—</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Initiated</Text>
            <Text style={styles.valueCol}>—</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Processed</Text>
            <Text style={styles.valueCol}>—</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Failure reason</Text>
            <Text style={styles.valueCol}>—</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.keyValueRow}>
            <Text style={styles.labelCol}>Reconciliation status</Text>
            <Text style={styles.valueCol}>Not applicable</Text>
          </View>
        </View>

        {/* BR-31 Requirement Warning Banner */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            This amount is above ₹10,000.00, so it needs a Super Admin who is not the requester.
          </Text>
        </View>

        {/* Approval Reason Note */}
        <Text style={styles.sectionHeader}>Approval reason</Text>
        <View style={styles.noteBox}>
          <TextInput
            style={styles.noteInput}
            placeholder="Optional note for the audit trail"
            placeholderTextColor={adminColors.placeholder}
            value={approvalNote}
            onChangeText={setApprovalNote}
            multiline
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Actions Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={handleApprove}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          <Text style={styles.approveBtnText}>Approval</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={handleReject}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          <Text style={styles.rejectBtnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.brand,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: adminSpacing.md,
  },
  sectionHeader: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    fontWeight: '700',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  keyValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.xs,
  },
  labelCol: {
    ...adminType.body,
    color: adminColors.muted,
    flex: 1,
  },
  valueCol: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: adminColors.border,
    marginVertical: 2,
  },
  auditMetaText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginHorizontal: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    marginVertical: adminSpacing.sm,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  warningText: {
    ...adminType.body,
    color: adminColors.ink,
    fontWeight: '600',
    lineHeight: 20,
  },
  noteBox: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  noteInput: {
    ...adminType.body,
    color: adminColors.ink,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  bottomSpacer: {
    height: 80,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.md,
  },
  approveBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.success.text,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtnText: {
    ...adminType.body,
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    height: ADMIN_BUTTON_HEIGHT,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.danger.text,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtnText: {
    ...adminType.body,
    color: adminColors.danger.text,
    fontWeight: '700',
  },
});

