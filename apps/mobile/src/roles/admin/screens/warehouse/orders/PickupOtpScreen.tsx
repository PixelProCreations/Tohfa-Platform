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
 *   - "Confirm Handover" (OTP submit): `order.pickup_otp.verify`. Without it
 *     the steps are read-only and the header back arrow is the way out.
 *   - "Continue to OTP" and "View Order" have no code of their own and stay
 *     ungated, as before. "View Invoice" is hidden until order invoices are
 *     wired (phase 7).
 *
 * Live data (API integration plan, phase 5): the order is GET
 * /admin/orders/{orderId} (name and masked mobile, never the OTP, BR-99).
 * "Confirm Handover" is POST .../verify-otp with the code the customer reads
 * out (BR-20): the boxes start empty (the design's pre-filled 4821 is gone),
 * the button stays disabled until exactly four digits are typed, and the API
 * call refuses anything else before a request is made, so a typo never costs
 * one of the server's attempts. A wrong code shows OTP_INVALID with the
 * attempts left; too many shows OTP_LOCKED. The write carries an
 * Idempotency-Key and is safe to retry (orderActions.ts). The OTP check is the
 * handover on the server (the order becomes PICKED_UP), so the old separate
 * "Complete Pickup" step is gone and success opens the completed view.
 *
 * The verify step (design 064) also shows the payment status
 * (AdminOrderDetail.paymentStatus, pickupSummaryFields) and a verification
 * checklist that is display only (pickupVerificationChecklist): "Customer
 * identified" is a local tick, "Order packed" reads the order status. Nothing
 * from it is sent and "Continue to OTP" does not wait on it; the order is
 * never completed at this step, only the OTP check hands it over.
 */
import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

import { adminColors, adminType, adminRadius, adminSpacing, adminShadow, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { adminErrorKey } from '../../../api/errors';
import { isPickupOtp, type VerifyOtpBody } from '../../../api/orders';
import { t } from '../../../i18n';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { otpAttemptsLeft, pickupSummaryFields, pickupVerificationChecklist, type OrderSummaryField } from './mappers';
import type { OrderDetailView, OrderScreenBaseProps, OrdersLiveStateProps, PickupStep } from './types';
import type { LiveOrderAction } from './useOrdersData';

export interface PickupOtpScreenProps extends OrderScreenBaseProps, OrdersLiveStateProps {
  /** Wizard step to open on. Defaults to 'otp' (the original M5S11 screen). */
  initialStep?: PickupStep | undefined;
  /** The order; undefined while loading or when the route names no order the API knows. */
  order?: OrderDetailView | undefined;
  /** POST .../verify-otp. */
  verify?: LiveOrderAction<VerifyOtpBody> | undefined;
}

/** The handover code's length (docs/openapi.yaml verify-otp `^[0-9]{4}$`, BR-20). */
const OTP_LENGTH = 4;

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

function TickIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={adminColors.onBrand} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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

/** Fields two to a row, as the design's summary cards lay them out. */
function FieldRows({ fields }: { fields: readonly OrderSummaryField[] }) {
  const rows: OrderSummaryField[][] = [];
  for (let index = 0; index < fields.length; index += 2) rows.push(fields.slice(index, index + 2));
  return (
    <>
      {rows.map((row, index) => (
        <View key={row.map((field) => field.key).join(':')} style={[styles.twoColRow, index > 0 && styles.rowGap]}>
          {row.map((field) => (
            <Field key={field.key} label={field.label} value={field.value} />
          ))}
        </View>
      ))}
    </>
  );
}

// ─── Step: verify (was M5S10) ────────────────────────────────────────────────

interface StepProps {
  order: OrderDetailView;
  onBack: () => void;
}

function VerifyStep({ order, onBack, onContinue }: StepProps & { onContinue: () => void }) {
  // The clerk's own tick; a counter aid only, never sent (see the header).
  const [customerIdentified, setCustomerIdentified] = useState(false);
  const checklist = pickupVerificationChecklist(order, customerIdentified);

  return (
    <>
      <Header title={t('orders.pickup.verifyTitle')} subtitle={order.orderNumber} onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('orders.pickup.section.customer')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <Field label={t('orders.pickup.field.customer')} value={order.buyerName} />
            {/* Masked by the server for every scope (BR-92). */}
            <Field label={t('orders.pickup.field.phone')} value={order.buyerMobileMasked ?? t('orders.noValue')} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('orders.pickup.section.summary')}</Text>
        <View style={styles.card}>
          <FieldRows fields={pickupSummaryFields(order)} />
        </View>

        <Text style={styles.sectionTitle}>{t('orders.pickup.section.verification')}</Text>
        <View style={styles.infoBox}>
          <InfoCircleIcon />
          <Text style={styles.infoText}>{t('orders.pickup.verifyHint')}</Text>
        </View>

        <View style={[styles.card, styles.cardAfterInfo]}>
          <View style={styles.twoColRow}>
            <Field label={t('orders.pickup.field.orderId')} value={order.orderNumber} />
            <Field label={t('orders.pickup.field.customerName')} value={order.buyerName} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('orders.pickup.section.checklist')}</Text>
        <View style={styles.card}>
          {checklist.map((item, index) => {
            const row = (
              <>
                <View style={[styles.checkbox, item.checked && styles.checkboxOn]}>{item.checked ? <TickIcon /> : null}</View>
                <Text style={styles.checkText}>{item.label}</Text>
              </>
            );
            return item.tickable ? (
              <TouchableOpacity
                key={item.key}
                style={[styles.checkRow, index > 0 && styles.rowGap]}
                activeOpacity={0.7}
                onPress={() => setCustomerIdentified((prev) => !prev)}
              >
                {row}
              </TouchableOpacity>
            ) : (
              <View key={item.key} style={[styles.checkRow, index > 0 && styles.rowGap]}>
                {row}
              </View>
            );
          })}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={onContinue}>
          <NumericKeypadIcon />
          <Text style={styles.primaryBtnText}>{t('orders.pickup.continue')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── Step: otp (the original M5S11) ──────────────────────────────────────────

function OtpStep({
  order,
  onBack,
  verify,
  canVerify,
  onVerified,
}: StepProps & { verify: LiveOrderAction<VerifyOtpBody>; canVerify: boolean; onVerified: () => void }) {
  // Never pre-filled: the code is the customer's and the API never returns it (BR-20).
  const [otp, setOtp] = useState('');
  const inputRef = useRef<TextInput>(null);
  const ready = order.status === 'readyForPickup';
  const complete = isPickupOtp(otp);
  const attemptsLeft = otpAttemptsLeft(verify.error);

  const onChange = (text: string) => {
    setOtp(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));
    if (verify.error !== null && verify.error !== undefined) verify.reset();
  };

  return (
    <>
      <Header title={t('orders.pickup.otpTitle')} subtitle={order.orderNumber} onBack={onBack} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.promptTitle}>{t('orders.pickup.otpPrompt', { count: OTP_LENGTH })}</Text>

        <TouchableOpacity style={styles.otpRow} activeOpacity={1} onPress={() => inputRef.current?.focus()}>
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <View key={index} style={styles.otpBox}>
              <Text style={styles.otpDigit}>{otp.charAt(index)}</Text>
            </View>
          ))}
          <TextInput
            ref={inputRef}
            style={styles.otpInput}
            value={otp}
            onChangeText={onChange}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus={ready && canVerify}
            editable={ready && canVerify && !verify.isPending}
            accessibilityLabel={t('orders.pickup.otpLabel')}
            textContentType="oneTimeCode"
          />
        </TouchableOpacity>

        {verify.error !== null && verify.error !== undefined ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t(adminErrorKey(verify.error))}</Text>
            {attemptsLeft !== null ? (
              <Text style={styles.errorText}>{t('orders.pickup.attemptsLeft', { count: attemptsLeft })}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.infoBox}>
          <InfoCircleIcon />
          <Text style={styles.infoText}>{ready ? t('orders.pickup.otpHint') : t('orders.pickup.notReady', { status: order.statusLabel })}</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Hidden, not disabled, without order.pickup_otp.verify or when the order is not ready. */}
      {canVerify && ready ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryBtn, (!complete || verify.isPending) && styles.primaryBtnDisabled]}
            activeOpacity={0.8}
            disabled={!complete || verify.isPending}
            onPress={() => verify.run({ otp }, onVerified)}
          >
            <ArrowRightIcon />
            <Text style={styles.primaryBtnText}>{verify.isPending ? t('orders.action.saving') : t('orders.pickup.confirmHandover')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

// ─── Step: handover (was M5S12) ──────────────────────────────────────────────

/**
 * The verified handover. The OTP check itself is the handover on the server
 * (verify-otp moves the order to PICKED_UP), so the old "Complete Pickup"
 * confirmation has nothing left to do and only the completed view remains.
 */
function HandoverStep({ order, onBack, onNavigate }: StepProps & { onNavigate: OrderScreenBaseProps['onNavigate'] }) {
  return (
    <>
      <Header title={t('orders.pickup.completedTitle')} onBack={onBack} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <View style={styles.successCircleBadge}>
            <CheckmarkCircleIcon size={36} strokeWidth="2.4" />
          </View>
          <Text style={styles.heroTitle}>{t('orders.pickup.completedTitle')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <Field label={t('orders.pickup.field.order')} value={order.orderNumber} />
            <Field label={t('orders.pickup.field.completed')} value={order.completedLabel ?? t('orders.noValue')} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('orders.pickup.section.final')}</Text>
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <Field label={t('orders.pickup.field.customer')} value={order.buyerName} />
            <Field label={t('orders.pickup.field.items')} value={String(order.itemCount)} />
          </View>
          <View style={[styles.twoColRow, styles.rowGap]}>
            <Field label={t('orders.pickup.field.payment')} value={order.paymentStatusLabel} />
            <Field label={t('orders.pickup.field.handoverWarehouse')} value={order.warehouseName} />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* View Invoice is hidden until order invoices are wired (phase 7). */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={() => onNavigate?.('M5S04', { orderId: order.id })}>
          <DocumentIcon />
          <Text style={styles.primaryBtnText}>{t('orders.pickup.viewOrder')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

export function PickupOtpScreen({
  can,
  onBack,
  onNavigate,
  order,
  initialStep = 'otp',
  isLoading = false,
  error,
  onRetry,
  verify,
}: PickupOtpScreenProps) {
  const [step, setStep] = useState<PickupStep>(initialStep);
  // Set when this screen's OTP check succeeded, before the refetched order says PICKED_UP.
  const [verifiedHere, setVerifiedHere] = useState(false);
  const canVerify = can('order.pickup_otp.verify');
  const view = queryViewState({ isLoading, error, itemCount: order === undefined ? 0 : 1 });

  // Back walks to the previous step, but only as far as the step the wizard
  // was opened on: before that there is nothing on screen to return to, so the
  // host navigator's back takes over (as it did when these were separate routes).
  const goBack = () => {
    const index = STEP_ORDER.indexOf(step);
    if (index > STEP_ORDER.indexOf(initialStep)) {
      setStep(STEP_ORDER[index - 1] as PickupStep);
    } else {
      onBack();
    }
  };

  if (view !== 'ready' || order === undefined || verify === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Header title={t('orders.pickup.otpTitle')} onBack={onBack} />
          {view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={error} onRetry={onRetry} />
          ) : (
            <AdminEmptyState title={t('orders.empty.notFound')} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // A handed-over order always shows its completed view; a handover step for
  // an order not yet handed over is the OTP step (the OTP is the handover).
  const handedOver = verifiedHere || order.status === 'pickedUp' || order.status === 'delivered';
  const shown: PickupStep = handedOver ? 'handover' : step === 'handover' ? 'otp' : step;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {shown === 'verify' ? <VerifyStep order={order} onBack={goBack} onContinue={() => setStep('otp')} /> : null}
        {shown === 'otp' ? (
          <OtpStep order={order} onBack={goBack} verify={verify} canVerify={canVerify} onVerified={() => setVerifiedHere(true)} />
        ) : null}
        {shown === 'handover' ? <HandoverStep order={order} onBack={onBack} onNavigate={onNavigate} /> : null}
      </View>
    </SafeAreaView>
  );
}

// Fixed sizes from the design (icon boxes and OTP cells), not spacing.
const BACK_BUTTON_SIZE = 32;
const OTP_BOX_WIDTH = 58;
const OTP_BOX_HEIGHT = 64;
const SUCCESS_BADGE_SIZE = 68;
const CHECKBOX_SIZE = 22;

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
  // The real input sits over the boxes, invisible, so tapping a box opens the number pad.
  otpInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
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
  bottomBar: {
    backgroundColor: adminColors.canvas,
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.md,
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: adminRadius.sm,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: adminColors.success.text,
    borderColor: adminColors.success.text,
  },
  checkText: {
    ...adminType.body,
    flex: 1,
    color: adminColors.ink,
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
