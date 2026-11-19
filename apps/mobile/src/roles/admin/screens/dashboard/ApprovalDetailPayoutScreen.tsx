/**
 * Approval Detail, Farmer Payout (SA-M2-S06), ported from the Super Admin
 * design (origin/Superadmin-main screens/dashboard/ApprovalDetailPayoutScreen.tsx).
 *
 * Every section, row, banner, note box and both action buttons are drawn. The
 * API has no payout read (docs/openapi.yaml has only create, approve and a CSV
 * export), so no row has a value to show and each carries the dash. The two
 * buttons are live only when the host passes `onApprove` / `onReject` and the
 * caller holds the approve code; nothing here calls the money-moving approve
 * endpoint itself, because the approval needs an Idempotency-Key owned by the
 * host's mutation.
 */
import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';

import { adminColors, adminRadius, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../theme';
import { BackArrowIcon } from '../../components/AdminIcons';
import type { Can } from '../../permissions/can';
import { t, type TranslationKey } from '../../i18n';
import { ADMIN_NO_VALUE } from '../../utils/noValue';

export interface ApprovalDetailPayoutScreenProps {
  payoutId?: string | undefined;
  can?: Can | undefined;
  onBack: () => void;
  onApprove?: ((reason?: string) => void) | undefined;
  onReject?: ((reason?: string) => void) | undefined;
}

/** docs/rbac.json: the second (Super Admin) approval of a payout above the high-value threshold (BR-31). */
const APPROVE_CODE = 'payout.approve_above_10k';
const BACK_SIZE = adminSpacing.xxl + adminSpacing.xs;
const BACK_ICON_SIZE = adminSpacing.lg + adminSpacing.xs + adminSpacing.xs;
const NOTE_MIN_HEIGHT = adminSpacing.xxxl + adminSpacing.md;
const BOTTOM_SPACER = adminSpacing.xxxl + adminSpacing.xl + adminSpacing.sm;

interface RowDef {
  id: string;
  label: TranslationKey;
  /** Static text the design itself shows (not a value that comes from a payout); every other row is the dash. */
  fixed?: TranslationKey;
}

interface SectionDef {
  id: string;
  title: TranslationKey;
  rows: readonly RowDef[];
  /** A caption line under the card (the design's audit line). */
  caption?: boolean;
}

const SECTIONS: readonly SectionDef[] = [
  {
    id: 'farmer',
    title: 'saApprovals.payout.sec.farmer',
    rows: [
      { id: 'farmerId', label: 'saApprovals.payout.row.farmerId' },
      { id: 'farmerName', label: 'saApprovals.payout.row.farmerName' },
      { id: 'contact', label: 'saApprovals.payout.row.contact', fixed: 'saApprovals.payout.contactHidden' },
      { id: 'account', label: 'saApprovals.payout.row.account' },
    ],
  },
  {
    id: 'purchase',
    title: 'saApprovals.payout.sec.purchase',
    rows: [
      { id: 'po', label: 'saApprovals.payout.row.po' },
      { id: 'poDate', label: 'saApprovals.payout.row.poDate' },
      { id: 'gr', label: 'saApprovals.payout.row.gr' },
      { id: 'produce', label: 'saApprovals.payout.row.produce' },
      { id: 'qty', label: 'saApprovals.payout.row.qty' },
      { id: 'grade', label: 'saApprovals.payout.row.grade' },
      { id: 'unitPrice', label: 'saApprovals.payout.row.unitPrice' },
      { id: 'purchaseValue', label: 'saApprovals.payout.row.purchaseValue' },
    ],
  },
  {
    id: 'calc',
    title: 'saApprovals.payout.sec.calc',
    rows: [
      { id: 'produceValue', label: 'saApprovals.payout.row.produceValue' },
      { id: 'adjustments', label: 'saApprovals.payout.row.adjustments' },
      { id: 'net', label: 'saApprovals.payout.row.net' },
      { id: 'currency', label: 'saApprovals.payout.row.currency' },
      { id: 'calcRef', label: 'saApprovals.payout.row.calcRef' },
    ],
  },
  {
    id: 'history',
    title: 'saApprovals.payout.sec.history',
    caption: true,
    rows: [
      { id: 'requestedBy', label: 'saApprovals.payout.row.requestedBy' },
      { id: 'approval', label: 'saApprovals.payout.row.approval' },
      { id: 'approver', label: 'saApprovals.payout.row.approver' },
      { id: 'rejection', label: 'saApprovals.payout.row.rejection' },
      { id: 'processingRef', label: 'saApprovals.payout.row.processingRef' },
    ],
  },
  {
    id: 'payment',
    title: 'saApprovals.payout.sec.payment',
    rows: [
      { id: 'method', label: 'saApprovals.payout.row.method' },
      { id: 'providerRef', label: 'saApprovals.payout.row.providerRef' },
      { id: 'initiated', label: 'saApprovals.payout.row.initiated' },
      { id: 'processed', label: 'saApprovals.payout.row.processed' },
      { id: 'failure', label: 'saApprovals.payout.row.failure' },
      { id: 'reconciliation', label: 'saApprovals.payout.row.reconciliation' },
    ],
  },
];

export function ApprovalDetailPayoutScreen({ payoutId, can, onBack, onApprove, onReject }: ApprovalDetailPayoutScreenProps) {
  const [approvalNote, setApprovalNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const canApprove = typeof can === 'function' && can(APPROVE_CODE);
  const approveEnabled = canApprove && onApprove !== undefined && !isProcessing;
  const rejectEnabled = canApprove && onReject !== undefined && !isProcessing;

  const handleApprove = () => {
    if (!canApprove) {
      Alert.alert(t('saApprovals.payout.denied.title'), t('saApprovals.payout.denied.body'));
      return;
    }
    if (onApprove === undefined) return;
    setIsProcessing(true);
    Alert.alert(t('saApprovals.payout.approveConfirm.title'), t('saApprovals.payout.approveConfirm.body'), [
      { text: t('saApprovals.payout.cancel'), style: 'cancel', onPress: () => setIsProcessing(false) },
      {
        text: t('saApprovals.payout.approve'),
        onPress: () => {
          onApprove(approvalNote);
          setIsProcessing(false);
          onBack();
        },
      },
    ]);
  };

  const handleReject = () => {
    if (onReject === undefined) return;
    Alert.alert(t('saApprovals.payout.rejectConfirm.title'), t('saApprovals.payout.rejectConfirm.body'), [
      { text: t('saApprovals.payout.cancel'), style: 'cancel' },
      {
        text: t('saApprovals.payout.reject'),
        style: 'destructive',
        onPress: () => {
          onReject(approvalNote);
          onBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="saPayout.back"
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('saApprovals.back')}
        >
          <BackArrowIcon size={BACK_ICON_SIZE} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('saApprovals.payout.headerTitle', { id: payoutId ?? ADMIN_NO_VALUE })}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <React.Fragment key={section.id}>
            <Text style={styles.sectionHeader}>{t(section.title)}</Text>
            <View style={styles.card} testID={`saPayout.section.${section.id}`}>
              {section.rows.map((row, index) => (
                <React.Fragment key={row.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.keyValueRow} testID={`saPayout.row.${row.id}`}>
                    <Text style={styles.labelCol}>{t(row.label)}</Text>
                    <Text style={styles.valueCol}>{row.fixed !== undefined ? t(row.fixed) : ADMIN_NO_VALUE}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
            {section.caption === true ? (
              <Text style={styles.auditMetaText} testID="saPayout.audit">
                {t('saApprovals.payout.audit', { when: ADMIN_NO_VALUE, who: ADMIN_NO_VALUE, event: ADMIN_NO_VALUE })}
              </Text>
            ) : null}
          </React.Fragment>
        ))}

        {/* BR-31 Requirement Warning Banner */}
        <View style={styles.warningBox} testID="saPayout.warning">
          <Text style={styles.warningText}>{t('saApprovals.payout.warning')}</Text>
        </View>

        {/* Approval Reason Note */}
        <Text style={styles.sectionHeader}>{t('saApprovals.payout.noteHeading')}</Text>
        <View style={styles.noteBox}>
          <TextInput
            testID="saPayout.note"
            style={styles.noteInput}
            placeholder={t('saApprovals.payout.notePlaceholder')}
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
          testID="saPayout.approve"
          style={[styles.approveBtn, !approveEnabled && styles.btnDisabled]}
          onPress={handleApprove}
          disabled={!approveEnabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: !approveEnabled }}
        >
          <Text style={styles.approveBtnText}>{t('saApprovals.payout.approve')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="saPayout.reject"
          style={[styles.rejectBtn, !rejectEnabled && styles.btnDisabled]}
          onPress={handleReject}
          disabled={!rejectEnabled}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ disabled: !rejectEnabled }}
        >
          <Text style={styles.rejectBtnText}>{t('saApprovals.payout.reject')}</Text>
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
    width: BACK_SIZE,
    height: BACK_SIZE,
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
    marginVertical: adminSpacing.xs / 2,
  },
  auditMetaText: {
    ...adminType.caption,
    color: adminColors.muted,
    marginHorizontal: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
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
    minHeight: NOTE_MIN_HEIGHT,
    textAlignVertical: 'top',
  },
  bottomSpacer: {
    height: BOTTOM_SPACER,
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
  btnDisabled: {
    opacity: 0.5,
  },
});
