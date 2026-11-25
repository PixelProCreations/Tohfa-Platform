import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../theme';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { resolveAdminRoleCategory } from './FarmerBankAccountDetailsScreen';
import type { Money } from '@tohfa/shared-types';
import { adminErrorKey } from '../../api/errors';
import type { PayoutDto } from '../../api/payouts';
import { useApprovePayout } from '../../api/payoutsHooks';
import { hasKey, t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { moneyText } from '../dashboard/saOverviewFormat';

function BackArrowWhiteIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** docs/rbac.json code of POST /admin/payouts/{id}/approve. */
const APPROVE_PAYOUT_CODE = 'payout.approve_above_10k';

/** Both approvals are in: the payout has left for the gateway (api/payouts.ts). */
const FULLY_APPROVED: readonly string[] = ['APPROVED', 'PROCESSING', 'PAID'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The payout's API status as words; a status the app does not know is shown as sent. */
export function payoutStatusText(status: string | undefined): string {
  if (status === undefined || status === '') return ADMIN_NO_VALUE;
  const key = `wiringPayouts.payoutStatus.${status}`;
  return hasKey(key) ? t(key) : status;
}

/** One payout as the API describes it (docs/openapi.yaml Payout / PayoutListItem). */
export interface PayoutDetailItem {
  /** Payout uuid. */
  id: string;
  /** The server's payoutNumber. */
  code: string;
  /** API decimal string. */
  amount: Money;
  /** openapi PayoutStatus. */
  status: string;
  /** The server's flag (BR-31, BR-144); the screen never derives it from the amount. */
  requiresDualApproval?: boolean | undefined;
  farmerId?: string | undefined;
  farmerName?: string | undefined;
  poNumber?: string | undefined;
  produce?: string | undefined;
  quantity?: string | undefined;
  date?: string | undefined;
}

export interface FarmerPayoutDetailScreenProps {
  payout?: PayoutDetailItem | undefined;
  farmerName?: string | undefined;
  /** The farmer's UUID (API addressing only); never displayed. */
  farmerId?: string | undefined;
  /** The farmer's TOHFA code (tohfaFarmerId), shown as "Farmer ID". */
  farmerCode?: string | undefined;
  role?: string | undefined;
  /** Permission check from /auth/me. Missing denies the approval (fail closed, root CLAUDE.md 2.1). */
  can?: Can | undefined;
  onBack: () => void;
  onApprove?: (() => void) | undefined;
  onReject?: (() => void) | undefined;
}

export function FarmerPayoutDetailScreen({
  payout,
  farmerName,
  farmerCode,
  role,
  can,
  onBack,
  onApprove,
}: FarmerPayoutDetailScreenProps): React.JSX.Element {
  const roleCategory = resolveAdminRoleCategory(role);

  const payoutCode = payout?.code ?? ADMIN_NO_VALUE;
  const displayFarmerName = payout?.farmerName ?? farmerName ?? ADMIN_NO_VALUE;
  // "Farmer ID" is the human code; a uuid (the payout's farmerId or the caller's) is never shown.
  const displayFarmerId = farmerCode ?? ADMIN_NO_VALUE;
  const amount = moneyText(payout?.amount);
  const poCode = payout?.poNumber ?? ADMIN_NO_VALUE;
  const produce = payout?.produce ?? ADMIN_NO_VALUE;
  const quantity = payout?.quantity ?? ADMIN_NO_VALUE;
  const date = payout?.date ?? ADMIN_NO_VALUE;
  const calcRef = ADMIN_NO_VALUE;

  const payoutId = payout !== undefined && UUID_RE.test(payout.id) ? payout.id : undefined;
  const allowed = typeof can === 'function' && can(APPROVE_PAYOUT_CODE);
  const approvePayout = useApprovePayout({ enabled: allowed });

  // What the server answered to our approval; until then the status the payout came with.
  const [result, setResult] = useState<PayoutDto | undefined>(undefined);
  const approvalStatus = payoutStatusText(result?.status ?? payout?.status);

  const handleApprove = () => {
    if (payoutId === undefined || !allowed || approvePayout.isPending || result !== undefined) return;
    Alert.alert(
      t('wiringPayouts.payoutDetail.confirm.title'),
      t('wiringPayouts.payoutDetail.confirm.body', { code: payoutCode, amount }),
      [
        { text: t('wiringPayouts.common.cancel'), style: 'cancel' },
        {
          text: t('wiringPayouts.payoutDetail.confirm.ok'),
          style: 'default',
          onPress: () => {
            // Success is reported only from the server's answer (onSuccess); a failure keeps the key.
            approvePayout.run(payoutId, {}, (answer) => {
              setResult(answer);
              const fully = FULLY_APPROVED.includes(answer.status);
              onApprove?.();
              Alert.alert(
                t(fully ? 'wiringPayouts.payoutDetail.done.title' : 'wiringPayouts.payoutDetail.recorded.title'),
                t(fully ? 'wiringPayouts.payoutDetail.done.body' : 'wiringPayouts.payoutDetail.recorded.body', {
                  code: answer.payoutNumber,
                }),
              );
            });
          },
        },
      ],
    );
  };

  const approveDisabled = payoutId === undefined || !allowed || approvePayout.isPending || result !== undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <BackArrowWhiteIcon size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout {payoutCode}</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1 · Farmer details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>1 · Farmer details</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Farmer ID" value={displayFarmerId} />
            <DataRow label="Farmer name" value={displayFarmerName} />
            <DataRow label="Registered contact" value="Not shown here" valueStyle={styles.mutedText} />
            <DataRow label="Verified payout account" value={ADMIN_NO_VALUE} isLast />
          </View>
        </View>

        {/* 2 · Purchase details */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>2 · Purchase details</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Purchase order" value={poCode} />
            <DataRow label="Purchase date" value={date} />
            <DataRow label="Goods receipt" value={ADMIN_NO_VALUE} />
            <DataRow label="Produce" value={produce} />
            <DataRow label="Accepted quantity" value={quantity} />
            <DataRow label="Accepted grade" value={ADMIN_NO_VALUE} />
            <DataRow label="Unit price" value={ADMIN_NO_VALUE} />
            <DataRow label="Purchase value" value={amount} isLast />
          </View>
        </View>

        {/* 3 · Payout calculation */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>3 · Payout calculation</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Accepted produce value" value={amount} />
            <DataRow label="Approved adjustments" value={ADMIN_NO_VALUE} />
            <DataRow label="Net payable amount" value={amount} isBold />
            <DataRow label="Currency" value="INR" />
            <DataRow label="Calculation reference" value={calcRef} isLast />
          </View>
        </View>

        {/* 4 · Approval history */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>4 · Approval history</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Requested by" value={ADMIN_NO_VALUE} />
            <DataRow label="Approval" value={approvalStatus} isBold />
            <DataRow label="Approver" value={ADMIN_NO_VALUE} />
            <DataRow label="Rejection reason" value={ADMIN_NO_VALUE} />
            <DataRow label="Processing reference" value={ADMIN_NO_VALUE} isLast />
          </View>

          {/* Audit note (design): no payout audit trail is read here, so both lines are dashes. */}
          <View style={styles.auditNoteBlock}>
            <Text style={styles.auditTimestamp}>{ADMIN_NO_VALUE}</Text>
            <Text style={styles.auditMessage}>{ADMIN_NO_VALUE}</Text>
          </View>
        </View>

        {/* 5 · Payment information */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>5 · Payment information</Text>
          <View style={styles.fieldsContainer}>
            <DataRow label="Payment method" value={ADMIN_NO_VALUE} isBold />
            <DataRow label="Provider reference" value={ADMIN_NO_VALUE} />
            <DataRow label="Initiated" value={ADMIN_NO_VALUE} />
            <DataRow label="Processed" value={ADMIN_NO_VALUE} />
            <DataRow label="Failure reason" value={ADMIN_NO_VALUE} />
            <DataRow label="Reconciliation status" value={ADMIN_NO_VALUE} isLast />
          </View>
        </View>

        {/* TOHFA Admin callout (design): shown only on the server's dual-approval flag (BR-31, R8). */}
        {roleCategory === 'TOHFA_ADMIN' && payout?.requiresDualApproval === true && (
          <View style={styles.tohfaNoticeBox}>
            <Text style={styles.tohfaNoticeText}>{t('wiringPayouts.payoutDetail.dualApproval')}</Text>
          </View>
        )}

        {/* When FarmerManagementFlow passes no payoutId, no payout arrives and Approve/Reject/Intimate stay disabled. */}
        {payoutId === undefined && (
          <View style={styles.tohfaNoticeBox}>
            <Text style={styles.tohfaNoticeText} testID="payoutDetail.noPayout">
              {t('wiringPayouts.payoutDetail.noPayout')}
            </Text>
          </View>
        )}

        {/* The real failure of the approval, worded by adminErrorKey; never a success. */}
        {approvePayout.error ? (
          <Text style={styles.errorText} testID="payoutDetail.error">
            {t(adminErrorKey(approvePayout.error))}
          </Text>
        ) : null}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Bottom Action Bars with RBAC */}
      {roleCategory === 'SUPER_ADMIN' && (
        <View style={styles.bottomBar}>
          {/* Approve — wired to POST /admin/payouts/{id}/approve */}
          <TouchableOpacity
            style={[styles.superAdminApproveBtn, approveDisabled && styles.actionUnavailable]}
            onPress={handleApprove}
            activeOpacity={0.8}
            disabled={approveDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: approveDisabled, busy: approvePayout.isPending }}
            testID="payoutDetail.approve"
          >
            <Text style={styles.superAdminApproveText}>
              {approvePayout.isPending ? t('wiringPayouts.payoutDetail.approving') : 'Approval'}
            </Text>
          </TouchableOpacity>

          {/* Reject — no endpoint; disabled per R3 */}
          <TouchableOpacity
            style={[styles.superAdminRejectBtn, styles.actionUnavailable]}
            activeOpacity={1}
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="payoutDetail.reject"
          >
            <Text style={styles.superAdminRejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {roleCategory === 'TOHFA_ADMIN' && (
        <View style={styles.bottomBar}>
          {/* Intimate — no endpoint; disabled per R3 */}
          <TouchableOpacity
            style={[styles.tripleBtn, styles.actionUnavailable]}
            activeOpacity={1}
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="payoutDetail.intimate"
          >
            <Text style={styles.tripleBtnText}>Intimate</Text>
          </TouchableOpacity>

          {/* Reject — no endpoint; disabled per R3 */}
          <TouchableOpacity
            style={[styles.tripleBtn, styles.tripleBtnReject, styles.actionUnavailable]}
            activeOpacity={1}
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="payoutDetail.reject"
          >
            <Text style={styles.tripleBtnRejectText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tripleBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.tripleBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {roleCategory === 'WAREHOUSE_ADMIN' && (
        <View style={styles.bottomBar}>
          {/* Intimate — no endpoint; disabled per R3 */}
          <TouchableOpacity
            style={[styles.doubleBtn, styles.actionUnavailable]}
            activeOpacity={1}
            disabled
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
            testID="payoutDetail.intimate"
          >
            <Text style={styles.doubleBtnText}>Intimate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doubleBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.doubleBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function DataRow({
  label,
  value,
  isBold = false,
  isLast = false,
  valueStyle,
}: {
  label: string;
  value: string;
  isBold?: boolean;
  isLast?: boolean;
  valueStyle?: any;
}) {
  return (
    <View style={[styles.dataRow, isLast && styles.dataRowLast]}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text
        style={[
          styles.dataValue,
          isBold && styles.dataValueBold,
          valueStyle,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  header: {
    height: 54,
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: adminRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.xs,
  },
  headerTitle: {
    ...adminType.title,
    fontWeight: '700',
    color: adminColors.onBrand,
    letterSpacing: -0.2,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    padding: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  sectionHeader: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
    marginBottom: adminSpacing.sm,
  },
  fieldsContainer: {
    // container
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: adminSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  dataRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  dataLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '500',
    flex: 1,
    paddingRight: adminSpacing.xs,
  },
  dataValue: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
    textAlign: 'right',
    flex: 1.2,
  },
  dataValueBold: {
    fontWeight: '800',
    color: adminColors.ink,
  },
  mutedText: {
    color: adminColors.muted,
    fontWeight: '400',
  },
  auditNoteBlock: {
    marginTop: 14,
    paddingTop: adminSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  auditTimestamp: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  auditMessage: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    lineHeight: 18,
  },
  errorText: {
    ...adminType.caption,
    color: adminColors.danger.text,
    textAlign: 'center',
    marginBottom: adminSpacing.md,
  },
  /** The designed button, kept visible, drawn as unavailable. */
  actionUnavailable: {
    opacity: 0.5,
  },
  tohfaNoticeBox: {
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    padding: adminSpacing.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.md,
  },
  tohfaNoticeText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
    fontWeight: '600',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: adminColors.card,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingTop: adminSpacing.sm,
    paddingBottom: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.md,
  },
  superAdminApproveBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.success.text,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superAdminApproveText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  superAdminRejectBtn: {
    flex: 1,
    height: 48,
    backgroundColor: adminColors.card,
    borderWidth: 1.4,
    borderColor: adminColors.danger.border,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  superAdminRejectText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  tripleBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.sm,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripleBtnText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  tripleBtnReject: {
    borderColor: adminColors.danger.border,
  },
  tripleBtnRejectText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.danger.text,
  },
  doubleBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.sm,
    borderWidth: 1.2,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doubleBtnText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
});
