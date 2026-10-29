/**
 * Pickup wizard — customer collects a packed order at the warehouse counter.
 *
 * Design id: M5S11 (M5S11_PickupOTP); absorbs M5S10 (PickupVerification) and
 * M5S12 (ConfirmHandover).
 *
 * These were three route keys that only ever led into each other, so they are
 * now three inline steps of one screen: verify -> otp -> handover. The route
 * key stays 'M5S11'; the host passes `params.step` as `initialStep`, and the
 * default is 'otp' so an old 'M5S11' link still opens the OTP step.
 *
 * Gates (docs/rbac.json; the server re-checks everything, CLAUDE.md 2.1):
 *   - "Confirm Handover" (OTP submit) and "Complete Pickup" (the handover
 *     itself): `order.pickup_otp.verify`. Without it the steps are read-only and
 *     the header back arrow is the way out.
 *   - "Continue to OTP", "View Order", "View Invoice" have no code of their own
 *     and stay ungated, as before.
 */
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getAdminOrder, verifyPickupOtp, isPickupOtp, type AdminOrderDetailDto } from '../../../api/orders';
import { formatMoney, paymentStatusLabel, formatOrderTime } from './mappers';
import type { OrderScreenBaseProps, PickupStep } from './types';

export interface PickupOtpScreenProps extends OrderScreenBaseProps {
  /** Wizard step to open on. Defaults to 'otp' (the original M5S11 screen). */
  initialStep?: PickupStep | undefined;
  /** Open the handover step already in its "Pickup Completed" state (was M5S12 `initialCompleted`). */
  initialHandoverCompleted?: boolean | undefined;
}

const STEP_ORDER: readonly PickupStep[] = ['verify', 'otp', 'handover'];
const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckmarkCircleIcon({ size = 18, strokeWidth = '2.2' }: { size?: number; strokeWidth?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.success.text} strokeWidth="2" />
      <Path
        d="M8 12l2.5 2.5L16 9.5"
        stroke={adminColors.success.text}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InfoCircleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={adminColors.info.text} strokeWidth="2" />
      <Path d="M12 16v-4M12 8h.01" stroke={adminColors.info.text} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ArrowRightIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M12 5l7 7-7 7"
        stroke={adminColors.onBrand}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function NumericKeypadIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="3" stroke={adminColors.onBrand} strokeWidth="2" />
      <Path
        d="M6 9h1M6 12h1M6 15h1M11 9h2M11 12h2M11 15h2M17 9h1M17 12h1M17 15h1"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={adminColors.onBrand}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DocumentIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={adminColors.onBrand}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Shared pieces ───────────────────────────────────────────────────────────

function Header({ title, subtitle, onBack }: { title: string; subtitle?: string | undefined; onBack: () => void }) {
  return (
    <>
      <View style={[styles.header, subtitle === undefined && styles.headerNoSubtitle]}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack} hitSlop={HIT_SLOP}>
          <BackArrowIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      {subtitle !== undefined ? (
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      ) : null}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.col}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

// ─── Step: verify (was M5S10) ────────────────────────────────────────────────

interface StepProps {
  orderId: string;
  onBack: () => void;
}

function VerifyStep({
  order,
  orderId,
  warehouseName,
  onBack,
  onContinue,
}: {
  order: AdminOrderDetailDto;
  orderId: string;
  warehouseName: string;
  onBack: () => void;
  onContinue: () => void;
}) {
  const customerName = order.buyer?.name || '—';
  const phone = order.buyer?.mobileMasked || '—';
  const itemsText = `${order.items.length} ${order.items.length === 1 ? 'Item' : 'Items'}`;
  const totalText = formatMoney(order.totals.total);
  const pickupWarehouse = order.warehouse?.name ?? warehouseName;

  return (
    <>
      <Header title="Pickup Verification" subtitle={orderId} onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Customer</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <Field label="Customer" value={customerName} />
            <Field label="Phone" value={phone} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <Field label="Items" value={itemsText} />
            <Field label="Total" value={totalText} />
          </View>
          <View style={styles.rowGap}>
            <Field label="Pickup Warehouse" value={pickupWarehouse} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Customer Verification</Text>

        <View style={[styles.card, styles.cardAfterInfo]}>
          <View style={styles.twoColRow}>
            <Field label="Order ID" value={orderId} />
            <Field label="Customer Name" value={customerName} />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onContinue}>
          <NumericKeypadIcon />
          <Text style={styles.primaryBtnText}>Continue to OTP</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── Step: otp (the original M5S11) ──────────────────────────────────────────

function OtpStep({
  orderId,
  onBack,
  onVerified,
  canVerify,
}: {
  orderId: string;
  onBack: () => void;
  onVerified: () => void;
  canVerify: boolean;
}) {
  const [otp, setOtp] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const textInputRef = useRef<TextInput>(null);

  const digits = [otp[0] ?? '', otp[1] ?? '', otp[2] ?? '', otp[3] ?? ''];

  const handleVerify = async () => {
    if (!isPickupOtp(otp)) {
      setErrorMessage('A pickup OTP is exactly 4 digits.');
      return;
    }
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      await verifyPickupOtp(orderId, { otp }, crypto.randomUUID());
      setIsVerified(true);
      setTimeout(() => {
        onVerified();
      }, 400);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Incorrect OTP — please verify');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <Header title="Verify Pickup" subtitle={orderId} onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.promptTitle}>Enter 4-digit pickup OTP</Text>

        <TouchableOpacity activeOpacity={1} onPress={() => textInputRef.current?.focus()}>
          <View style={styles.otpRow}>
            {digits.map((digit, index) => (
              <View key={index} style={styles.otpBox}>
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        <TextInput
          ref={textInputRef}
          value={otp}
          onChangeText={(val) => {
            const cleaned = val.replace(/[^0-9]/g, '').slice(0, 4);
            setOtp(cleaned);
            setErrorMessage(null);
          }}
          keyboardType="number-pad"
          maxLength={4}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          autoFocus
        />

        {isVerified ? (
          <View style={styles.verifiedBox}>
            <CheckmarkCircleIcon />
            <Text style={styles.verifiedText}>✓ OTP Verified</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {canVerify ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryBtn, (otp.length !== 4 || isVerifying) && styles.primaryBtnDisabled]}
            activeOpacity={0.8}
            disabled={otp.length !== 4 || isVerifying}
            onPress={handleVerify}
          >
            {isVerifying ? (
              <ActivityIndicator size="small" color={adminColors.onBrand} />
            ) : (
              <>
                <ArrowRightIcon />
                <Text style={styles.primaryBtnText}>Confirm Handover</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

// ─── Step: handover (was M5S12) ──────────────────────────────────────────────

function HandoverStep({
  order,
  orderId,
  warehouseName,
  initialCompleted,
  onBack,
  canComplete,
  onNavigate,
}: {
  order: AdminOrderDetailDto;
  orderId: string;
  warehouseName: string;
  initialCompleted: boolean;
  onBack: () => void;
  canComplete: boolean;
  onNavigate: OrderScreenBaseProps['onNavigate'];
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const customerName = order.buyer?.name || '—';
  const itemsText = String(order.items.length);
  const paymentText = paymentStatusLabel(order.paymentStatus);
  const pickupWarehouse = order.warehouse?.name ?? warehouseName;
  const completedTime = order.timeline[order.timeline.length - 1]?.at
    ? formatOrderTime(order.timeline[order.timeline.length - 1]!.at)
    : '—';

  if (completed) {
    return (
      <>
        <Header title="Pickup Completed" onBack={() => setCompleted(false)} />

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.heroContainer}>
            <View style={styles.successCircleBadge}>
              <CheckmarkCircleIcon size={36} strokeWidth="2.4" />
            </View>
            <Text style={styles.heroTitle}>Pickup Completed</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <Field label="Order" value={orderId} />
              <Field label="Completed" value={completedTime} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Final Information</Text>
          <View style={styles.card}>
            <View style={styles.twoColRow}>
              <Field label="Customer" value={customerName} />
              <Field label="Items" value={itemsText} />
            </View>
            <View style={[styles.twoColRow, styles.rowGap]}>
              <Field label="Payment" value={paymentText} />
              <Field label="Warehouse" value={pickupWarehouse} />
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.stackedBtnGap]}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S04', { orderId })}
          >
            <DocumentIcon />
            <Text style={styles.primaryBtnText}>View Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={() => onNavigate?.('M5S18', { orderId })}
          >
            <Text style={styles.secondaryBtnText}>View Invoice</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Header title="Confirm Handover" onBack={onBack} />

      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <Field label="Order" value={orderId} />
            <Field label="Customer" value={customerName} />
          </View>
          <View style={[styles.twoColRow, styles.rowGap]}>
            <Field label="Items" value={itemsText} />
            <Field label="OTP" value="Verified ✓" />
          </View>
        </View>
      </View>

      <View style={styles.flexSpacer} />

      {canComplete ? (
        <View style={styles.bottomBarPlain}>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => setCompleted(true)}>
            <CheckmarkIcon />
            <Text style={styles.primaryBtnText}>Complete Pickup</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

export function PickupOtpScreen({
  scope,
  can,
  onBack,
  onNavigate,
  orderId,
  initialStep = 'otp',
  initialHandoverCompleted = false,
}: PickupOtpScreenProps) {
  const [step, setStep] = useState<PickupStep>(initialStep);
  const canVerify = can('order.pickup_otp.verify');
  const warehouseName = scope.warehouseName ?? '—';

  const orderQuery = useAdminQuery(
    adminKeys.detail('orders', orderId ?? ''),
    (signal) => getAdminOrder(orderId!, signal),
    { enabled: !!orderId },
  );

  const goBack = () => {
    const index = STEP_ORDER.indexOf(step);
    if (index > STEP_ORDER.indexOf(initialStep)) {
      setStep(STEP_ORDER[index - 1] as PickupStep);
    } else {
      onBack();
    }
  };

  if (!orderId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Verify Pickup" onBack={onBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ ...adminType.body, color: adminColors.muted }}>No order selected</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Verify Pickup" onBack={onBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={adminColors.brand} />
        </View>
      </SafeAreaView>
    );
  }

  if (orderQuery.error || !orderQuery.data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Verify Pickup" onBack={onBack} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: adminSpacing.lg }}>
          <Text style={{ ...adminType.sectionHead, color: adminColors.danger.text, marginBottom: adminSpacing.sm }}>
            Failed to load order
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => orderQuery.refetch()}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {step === 'verify' ? (
          <VerifyStep order={order} orderId={orderId} warehouseName={warehouseName} onBack={goBack} onContinue={() => setStep('otp')} />
        ) : null}
        {step === 'otp' ? (
          <OtpStep orderId={orderId} onBack={goBack} onVerified={() => setStep('handover')} canVerify={canVerify} />
        ) : null}
        {step === 'handover' ? (
          <HandoverStep
            order={order}
            orderId={orderId}
            warehouseName={warehouseName}
            initialCompleted={initialHandoverCompleted}
            onBack={goBack}
            canComplete={canVerify}
            onNavigate={onNavigate}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

// Fixed sizes from the design (icon boxes and OTP cells), not spacing.
const BACK_BUTTON_SIZE = 32;
const OTP_BOX_WIDTH = 58;
const OTP_BOX_HEIGHT = 64;
const SUCCESS_BADGE_SIZE = 68;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.brand,
  },
  container: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    backgroundColor: adminColors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 14,
    paddingBottom: adminSpacing.md,
    gap: adminSpacing.md,
  },
  headerNoSubtitle: {
    paddingBottom: adminSpacing.lg,
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
  },
  subtitleRow: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: 6,
    paddingBottom: 10,
    backgroundColor: adminColors.brand,
  },
  subtitleText: {
    ...adminType.rowTitle,
    // Was a translucent overlay; no translucent token, so solid onBrand.
    color: adminColors.onBrand,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.lg,
    paddingBottom: 20,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.sm,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardAfterInfo: {
    marginTop: adminSpacing.md,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowGap: {
    marginTop: 14,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    ...adminType.rowMeta,
    color: adminColors.muted,
    marginBottom: 3,
  },
  fieldValue: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  promptTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    textAlign: 'center',
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: adminSpacing.md,
    marginBottom: 20,
  },
  otpBox: {
    width: OTP_BOX_WIDTH,
    height: OTP_BOX_HEIGHT,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigit: {
    ...adminType.title,
    color: adminColors.brandDeep,
  },
  verifiedBox: {
    backgroundColor: adminColors.success.bg,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.lg,
  },
  verifiedText: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  errorBox: {
    backgroundColor: adminColors.danger.bg,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.lg,
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  errorText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.danger.text,
  },
  infoBox: {
    backgroundColor: adminColors.info.bg,
    borderWidth: 1,
    borderColor: adminColors.info.border,
    borderRadius: adminRadius.md,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: adminSpacing.lg,
  },
  infoText: {
    ...adminType.rowTitle,
    flex: 1,
    color: adminColors.info.text,
  },
  bottomSpacer: {
    height: adminSpacing.xl,
  },
  flexSpacer: {
    flex: 1,
  },
  bottomBar: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  bottomBarPlain: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.sm,
    paddingBottom: 20,
  },
  primaryBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    ...adminShadow.sm,
  },
  primaryBtnDisabled: {
    backgroundColor: adminColors.brandTint,
  },
  primaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.onBrand,
  },
  stackedBtnGap: {
    marginBottom: 10,
  },
  secondaryBtn: {
    backgroundColor: adminColors.brandTint,
    borderWidth: 1.5,
    borderColor: adminColors.brand,
    borderRadius: adminRadius.lg,
    height: ADMIN_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...adminType.sectionHead,
    color: adminColors.brand,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: adminSpacing.lg,
    marginBottom: adminSpacing.xl,
  },
  successCircleBadge: {
    width: SUCCESS_BADGE_SIZE,
    height: SUCCESS_BADGE_SIZE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.lg,
  },
  heroTitle: {
    ...adminType.title,
    color: adminColors.ink,
  },
});
