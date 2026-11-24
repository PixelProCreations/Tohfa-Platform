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
import Svg, { Circle, Path } from 'react-native-svg';

import { adminErrorKey } from '../../api/errors';
import type { PayoutDto } from '../../api/payouts';
import { useApprovePayout } from '../../api/payoutsHooks';
import { t } from '../../i18n';
import type { Can } from '../../permissions/can';
import { adminColors, adminShadow } from '../../theme';
import { moneyText } from '../dashboard/saOverviewFormat';

/** docs/rbac.json code of POST /admin/payouts/{id}/approve (SUPER_ADMIN only). */
const APPROVE_PAYOUT_CODE = 'payout.approve_above_10k';

/**
 * A payout that has both approvals in. Until then (PENDING_APPROVAL) the caller's
 * approval is recorded but no money is on its way, and the screen must say so.
 */
const FULLY_APPROVED: readonly string[] = ['APPROVED', 'PROCESSING', 'PAID'];

// ─── Design Tokens ────────────────────────────────────────────────────────────
const PALETTE = {
  titleRust:     adminColors.brandDeep,
  pageBg:        adminColors.canvas,
  cardBg:        adminColors.card,
  ink:           adminColors.ink,
  labelMuted:    adminColors.muted,
  border:        adminColors.border,
  grayBorder:    adminColors.border,
  peachBadgeBg:  adminColors.warning.bg,
  peachBadgeText:adminColors.warning.text,
  greenApproved: adminColors.success.text,
  greenBtnBg:    adminColors.success.bg,
  bannerBg:      adminColors.card,
  bannerBorder:  adminColors.border,
  bannerText:    adminColors.brandDeep,
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function BackChevronIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19l-7-7 7-7"
        stroke={adminColors.ink}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GreenCheckCircle() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={PALETTE.greenApproved} />
      <Path
        d="M8 12l3 3 5-5"
        stroke={adminColors.card}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockCircle() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.muted} strokeWidth="2" fill="none" />
      <Path d="M12 6v6l4 2" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function PenNibIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
        stroke={PALETTE.bannerText}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ActionCheckIcon() {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={PALETTE.greenApproved}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ReturnIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10h10a5 5 0 0 1 5 5v2M3 10l6-6M3 10l6 6"
        stroke={adminColors.ink}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface PayoutProcessingScreenProps {
  onBack: () => void;
  payoutAmount?: number | undefined;
  farmerName?: string | undefined;
  farmerId?: string | undefined;
  zone?: string | undefined;
  /**
   * The payout (docs/openapi.yaml Payout.id) the approval is recorded against.
   * Without it there is nothing to approve and the button stays disabled: a
   * payout "due" is not a payout, so the screen never guesses one.
   */
  payoutId?: string | undefined;
  /** Permission check from /auth/me. Missing denies the approval (fail closed, root CLAUDE.md 2.1). */
  can?: Can | undefined;
  onApprovedSuccess?: () => void;
}

export function PayoutProcessingScreen({
  onBack,
  payoutAmount = 15400,
  farmerName = 'Ramasamy S.',
  farmerId = '#TOHFA-F-00189',
  zone = 'Coonoor',
  payoutId,
  can,
  onApprovedSuccess,
}: PayoutProcessingScreenProps) {
  // What the server answered to our approval; undefined until a real 2xx. Nothing
  // on this screen reads "approved" from anything else.
  const [result, setResult] = useState<PayoutDto | undefined>(undefined);
  const allowed = typeof can === 'function' && can(APPROVE_PAYOUT_CODE);
  const approval = useApprovePayout({ enabled: allowed });
  const loading = approval.isPending;
  const recorded = result !== undefined;
  const approved = result !== undefined && FULLY_APPROVED.includes(result.status);
  const canApprove = allowed && payoutId !== undefined;

  function handleApprove() {
    if (!canApprove || payoutId === undefined || recorded || loading) return;
    approval.run(payoutId, {}, (payout) => {
      setResult(payout);
      const amount = moneyText(payout.amount);
      const fully = FULLY_APPROVED.includes(payout.status);
      Alert.alert(
        t(fully ? 'payoutProcessing.done.title' : 'payoutProcessing.recorded.title'),
        t(fully ? 'payoutProcessing.done.body' : 'payoutProcessing.recorded.body', { amount, farmer: farmerName }),
        [
          {
            text: t('payoutProcessing.done.ok'),
            onPress: () => {
              if (onApprovedSuccess) onApprovedSuccess();
              else onBack();
            },
          },
        ]
      );
    });
  }

  function handleReturn() {
    Alert.alert(
      'Return for Review',
      'The payout request will be returned to TOHFA Admin (Ganga Devi) for audit correction.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Return', style: 'destructive', onPress: onBack },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={PALETTE.pageBg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button First */}
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <BackChevronIcon />
        </TouchableOpacity>

        {/* Heading Next */}
        <Text style={styles.screenTitle}>Payout Processing</Text>
        <Text style={styles.screenSub}>Dual approval required above ₹10,000</Text>

        {/* Main Approval Card */}
        <View style={styles.mainCard}>
          {/* Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.reqBadge}>
              <Text style={styles.reqBadgeText}>Requires 2nd Super Admin</Text>
            </View>
          </View>

          {/* Amount */}
          <Text style={styles.amountText}>
            ₹{payoutAmount.toLocaleString('en-IN')}
          </Text>

          {/* Beneficiary Details */}
          <Text style={styles.farmerDetailText}>
            {farmerName} · {farmerId} · {zone}
          </Text>

          <View style={styles.cardDivider} />

          {/* Timeline Step 1 */}
          <View style={styles.stepRow}>
            <GreenCheckCircle />
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle}>Initiated by Ganga Devi (TOHFA Admin)</Text>
              <Text style={styles.stepSub}>Today, 9:14 AM</Text>
            </View>
          </View>

          {/* Timeline Step 2 */}
          <View style={styles.stepRow}>
            {approved ? <GreenCheckCircle /> : <ClockCircle />}
            <View style={styles.stepTextCol}>
              <Text style={styles.stepTitle}>
                {approved
                  ? t('payoutProcessing.step.approved')
                  : 'Awaiting 2nd Super Admin approval'}
              </Text>
              <Text style={styles.stepSub}>
                {approved
                  ? 'Sign-off recorded on immutable audit ledger'
                  : 'Cannot be approved by the same admin who initiated'}
              </Text>
            </View>
          </View>

          {/* Warning Banner */}
          <View style={styles.warningBanner}>
            <PenNibIcon />
            <Text style={styles.warningText}>
              Payouts above ₹10,000 require sign-off from a second Super Admin — the initiator cannot self-approve.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.btnStack}>
          {/* Approve Button */}
          <TouchableOpacity
            style={[styles.approveBtn, (recorded || !canApprove) && { opacity: 0.6 }]}
            onPress={handleApprove}
            activeOpacity={0.8}
            disabled={recorded || loading || !canApprove}
            testID="payoutProcessing.approve"
            accessibilityRole="button"
            accessibilityState={{ disabled: recorded || loading || !canApprove }}
          >
            <ActionCheckIcon />
            <Text style={styles.approveBtnText}>
              {loading
                ? 'Processing Sign-Off...'
                : approved
                ? '✓ Approved'
                : recorded
                ? t('payoutProcessing.button.recorded')
                : 'Approve as 2nd Super Admin'}
            </Text>
          </TouchableOpacity>

          {/* The real failure, worded by adminErrorKey; never the design's success copy. */}
          {approval.error ? (
            <Text style={styles.errorText} testID="payoutProcessing.error">
              {t(adminErrorKey(approval.error))}
            </Text>
          ) : null}
          {payoutId === undefined && !recorded ? (
            <Text style={styles.stepSub} testID="payoutProcessing.noPayout">
              {t('payoutProcessing.noPayout')}
            </Text>
          ) : null}

          {/* Return for Review Button */}
          <TouchableOpacity
            style={styles.returnBtn}
            onPress={handleReturn}
            activeOpacity={0.75}
            disabled={recorded}
          >
            <ReturnIcon />
            <Text style={styles.returnBtnText}>Return for Review</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: PALETTE.cardBg,
    borderWidth: 1,
    borderColor: PALETTE.grayBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...adminShadow.sm,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PALETTE.titleRust,
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 13,
    fontWeight: '400',
    color: PALETTE.labelMuted,
    marginTop: 4,
    marginBottom: 20,
  },
  mainCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: PALETTE.border,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 20,
    ...adminShadow.md,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reqBadge: {
    backgroundColor: PALETTE.peachBadgeBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reqBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.peachBadgeText,
  },
  amountText: {
    fontSize: 30,
    fontWeight: '800',
    color: PALETTE.ink,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  farmerDetailText: {
    fontSize: 13,
    color: PALETTE.labelMuted,
    marginBottom: 16,
  },
  cardDivider: {
    height: 1,
    backgroundColor: PALETTE.grayBorder,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  stepTextCol: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.ink,
    marginBottom: 2,
  },
  stepSub: {
    fontSize: 11.5,
    color: PALETTE.labelMuted,
    lineHeight: 16,
  },
  warningBanner: {
    backgroundColor: PALETTE.bannerBg,
    borderWidth: 1,
    borderColor: PALETTE.bannerBorder,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 6,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: PALETTE.bannerText,
    lineHeight: 17,
    fontWeight: '500',
  },
  btnStack: {
    gap: 12,
  },
  approveBtn: {
    backgroundColor: PALETTE.greenBtnBg,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.greenApproved,
  },
  returnBtn: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.grayBorder,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...adminShadow.sm,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: adminColors.danger.text,
    lineHeight: 17,
  },
  returnBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.ink,
  },
});
