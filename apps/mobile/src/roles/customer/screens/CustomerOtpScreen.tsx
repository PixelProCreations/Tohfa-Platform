import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';
import branchLeavesTopLeft from '../assets/images/branch_leaves_top_left.png';
import { profileEmailVerified } from '../assets/images';
import {
  CUSTOMER_OTP_LENGTH,
  isValidCustomerOtp,
  renderOtpState,
  sendCustomerLoginOtp,
  verifyCustomerLoginOtp,
  type CustomerPostLoginRoute,
} from '../api/auth';
import { mapProblem } from '../api/problem';
import { getLocale, t } from '../../../i18n/customer';
import { otpTextInputProps, useOtpSmsAutofill } from '../../../shell/otp';

/** Boxes 1-5: same keyboard, but no autofill target, so the OS fills box 0. */
const NON_AUTOFILL_PIN_PROPS = {
  keyboardType: 'number-pad',
  textContentType: 'none',
  autoComplete: 'off',
  importantForAutofill: 'no',
} as const;

const GreenFloatingLeaf = () => (
  <View style={styles.floatingLeafBottomRight} pointerEvents="none">
    <Svg width={52} height={68} viewBox="0 0 52 68" fill="none">
      <Path
        d="M6 62C12 38 30 12 48 6C52 26 42 52 18 65C12 68 8 66 6 62z"
        fill={customerColors.legacy.greenMid}
        opacity={0.85}
      />
      <Path
        d="M6 62C18 46 32 30 48 6"
        stroke={customerColors.palette.green.sprout}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

const EMPTY_PIN: string[] = Array.from({ length: CUSTOMER_OTP_LENGTH }, () => '');
const PIN_INDEXES = EMPTY_PIN.map((_, i) => i);

function codeToPin(code: string | undefined): string[] {
  if (code && /^\d{6}$/.test(code)) {
    return code.split('');
  }
  return EMPTY_PIN;
}

interface CustomerOtpScreenProps {
  /** 10-digit mobile the challenge was sent to (from CustomerLogin). */
  mobile: string;
  challengeId: string;
  expiresAt?: string | undefined;
  resendAvailableAt?: string | undefined;
  attemptsRemaining?: number | undefined;
  mockCode?: string | undefined;
  onNavigate: (screen: CustomerPostLoginRoute | 'CustomerLogin', params?: Record<string, unknown>) => void;
}

interface ChallengeState {
  challengeId: string;
  resendAvailableAt: string | undefined;
  attemptsRemaining: number | undefined;
}

export const CustomerOtpScreen: React.FC<CustomerOtpScreenProps> = ({
  mobile,
  challengeId,
  resendAvailableAt,
  attemptsRemaining,
  mockCode,
  onNavigate,
}) => {
  const [challenge, setChallenge] = useState<ChallengeState>({
    challengeId,
    resendAvailableAt,
    attemptsRemaining,
  });
  const [pin, setPin] = useState<string[]>(() => codeToPin(mockCode));
  const [now, setNow] = useState(() => Date.now());
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [needsResend, setNeedsResend] = useState(false);
  const [locked, setLocked] = useState(false);
  const [verifiedRoute, setVerifiedRoute] = useState<CustomerPostLoginRoute | null>(null);
  const inputRefs = useRef<Array<React.ElementRef<typeof TextInput> | null>>([]);
  const inFlight = useRef(false);

  const otpState = renderOtpState({
    resendAvailableAt: challenge.resendAvailableAt,
    attemptsRemaining: locked ? 0 : challenge.attemptsRemaining,
    now,
  });
  const secondsLeft = otpState.secondsUntilResend;

  useEffect(() => {
    if (mockCode && /^\d{6}$/.test(mockCode)) {
      setPin(mockCode.split(''));
    }
  }, [mockCode]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const verify = async (code: string) => {
    if (inFlight.current || locked || !isValidCustomerOtp(code)) return;
    inFlight.current = true;
    setVerifying(true);
    setError(null);
    setCanRetry(false);
    try {
      const result = await verifyCustomerLoginOtp({
        mobile,
        challengeId: challenge.challengeId,
        otp: code,
        preferredLocale: getLocale(),
      });
      setVerifiedRoute(result.route);
    } catch (err) {
      const problem = mapProblem(err);
      if (problem.silent) return;
      // BR-153c: 403 means this number's account holds no customer role (a
      // farmer-only or staff number). The server keeps the reason generic; say
      // which sign-in to use instead of the bare "no access" text (BR-135).
      setError(problem.code === 'FORBIDDEN' ? t('customer.auth.otp.notCustomerAccount') : problem.message);
      if (problem.action === 'retry') {
        // Offline/timeout/5xx: keep the digits so "Try again" resubmits them.
        setCanRetry(true);
        return;
      }
      // OTP_INVALID 400 = expired/replayed/foreign challenge: only a new code helps.
      const challengeDead =
        problem.action === 'resend_otp' || (problem.code === 'OTP_INVALID' && problem.status === 400);
      if (problem.code === 'OTP_LOCKED') setLocked(true);
      setNeedsResend(challengeDead);
      setPin(EMPTY_PIN);
      if (problem.code !== 'OTP_LOCKED') inputRefs.current[0]?.focus();
    } finally {
      inFlight.current = false;
      setVerifying(false);
    }
  };

  const handlePinChange = (text: string, index: number) => {
    const digits = text.replace(/[^0-9]/g, '');
    let newPin: string[];
    if (digits.length >= CUSTOMER_OTP_LENGTH) {
      // Pasted / autofilled full code.
      newPin = digits.slice(0, CUSTOMER_OTP_LENGTH).split('');
    } else {
      newPin = [...pin];
      newPin[index] = digits.slice(-1);
    }
    setPin(newPin);
    if (error && !locked) setError(null);

    const code = newPin.join('');
    if (code.length === CUSTOMER_OTP_LENGTH) {
      void verify(code);
    } else if (digits && index < CUSTOMER_OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Android: the SMS the user allows on the system sheet fills all six boxes
  // and, exactly like a typed/pasted full code, submits once (verify() is
  // guarded by inFlight/locked). Re-armed for each new challenge.
  useOtpSmsAutofill({
    enabled: !locked && verifiedRoute === null,
    armKey: challenge.challengeId,
    length: CUSTOMER_OTP_LENGTH,
    onCode: (smsCode) => handlePinChange(smsCode, 0),
  });

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleNext = () => {
    void verify(pin.join(''));
  };

  const handleResend = async () => {
    if (!otpState.canResend || resending || verifying) return;
    setResending(true);
    setError(null);
    setCanRetry(false);
    try {
      const next = await sendCustomerLoginOtp(mobile);
      setChallenge({
        challengeId: next.challengeId,
        resendAvailableAt: next.resendAvailableAt,
        attemptsRemaining: next.attemptsRemaining,
      });
      setNow(Date.now());
      setLocked(false);
      setNeedsResend(false);
      if (next._mockCode && /^\d{6}$/.test(next._mockCode)) {
        setPin(next._mockCode.split(''));
      } else {
        setPin(EMPTY_PIN);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const problem = mapProblem(err);
      if (problem.silent) return;
      setError(problem.message);
      if (problem.action === 'wait' && problem.retryAfterSeconds !== null) {
        const until = Date.now() + problem.retryAfterSeconds * 1000;
        setChallenge(prev => ({ ...prev, resendAvailableAt: new Date(until).toISOString() }));
        setNow(Date.now());
      }
    } finally {
      setResending(false);
    }
  };

  const handleContinue = () => {
    if (!verifiedRoute) return;
    const route = verifiedRoute;
    setVerifiedRoute(null);
    onNavigate(route);
  };

  const pinComplete = isValidCustomerOtp(pin.join(''));
  const canSubmit = pinComplete && !verifying && !locked;
  // Faded = nothing to submit. While verifying (e.g. the autofilled code just
  // auto-submitted) the button is busy, not unavailable: it keeps its solid
  // fill and shows the spinner, and is still not pressable (canSubmit).
  const looksUnavailable = !pinComplete || locked;

  return (
    <View style={styles.container}>
      <ScreenStatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <StatusBar hidden={true} />

      {/* Decorative leaf branch top-left */}
      <Image
        source={branchLeavesTopLeft}
        style={styles.branchTopLeft}
        resizeMode="contain"
      />
      {/* Decorative floating leaf bottom-right */}
      <GreenFloatingLeaf />

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main Card (389 x 243 Hug from Figma) */}
        <View style={styles.card}>
          <Text style={styles.title}>{t('customer.auth.otp.pinTitle')}</Text>

          {/* Mobile number with Edit link */}
          <View style={styles.phoneEditRow}>
            <Text style={styles.phoneText}>+91 {mobile}</Text>
            <Text style={styles.bullet}> • </Text>
            <TouchableOpacity
              onPress={() => onNavigate('CustomerLogin')}
              accessibilityRole="link"
              testID="customer-otp-edit"
            >
              <Text style={styles.editText}>{t('customer.auth.otp.edit')}</Text>
            </TouchableOpacity>
          </View>

          {/* 6 PIN Underline Input Slots (BR-32: the customer OTP is 6 digits) */}
          <View style={styles.pinRow}>
            {PIN_INDEXES.map((index) => {
              const isFilled = (pin[index] || '').length > 0;
              return (
                <View key={index} style={styles.pinBox}>
                  <TextInput
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={styles.pinInput}
                    // Box 0 carries the iOS/Android autofill hints. Every box
                    // accepts a full-length paste so handlePinChange can
                    // spread it, whichever box had focus.
                    {...(index === 0 ? otpTextInputProps : NON_AUTOFILL_PIN_PROPS)}
                    maxLength={CUSTOMER_OTP_LENGTH}
                    value={pin[index]}
                    onChangeText={text => handlePinChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    textAlign="center"
                    autoFocus={index === 0}
                    editable={!locked && !verifying}
                    accessibilityLabel={t('customer.auth.otp.digitA11y', { number: index + 1 })}
                  />
                  <View
                    style={[
                      styles.pinUnderline,
                      isFilled && styles.pinUnderlineFilled,
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="customer-otp-error" accessibilityRole="alert">
                {error}
              </Text>
              {canRetry ? (
                <TouchableOpacity onPress={handleNext} accessibilityRole="link" testID="customer-otp-retry">
                  <Text style={styles.linkText}>{t('customer.auth.login.tryAgain')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Resend: cooldown from the server's resendAvailableAt */}
          <View style={styles.resendRow}>
            {secondsLeft > 0 && !locked ? (
              <Text style={styles.resendText} testID="customer-otp-timer">
                {t('customer.auth.otp.resendInPrefix')}{' '}
                <Text style={styles.timerHighlight}>{secondsLeft}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={() => void handleResend()}
                disabled={resending || verifying}
                accessibilityRole="button"
                accessibilityLabel={t('customer.auth.otp.resendA11y')}
                testID="customer-otp-resend"
              >
                <Text style={styles.resendText}>
                  {needsResend || locked ? t('customer.auth.otp.requestNew') : t('customer.auth.otp.noPin')}
                  <Text style={styles.timerHighlight}>{resending ? t('customer.auth.otp.sending') : t('customer.auth.otp.resendLink')}</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Circular Action Button - Green in Figma */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleNext}
            disabled={!canSubmit}
            style={[
              styles.circularButton,
              styles.circularButtonActive,
              customerShadow.raised,
              looksUnavailable && styles.circularButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('customer.auth.otp.verifyA11y')}
            accessibilityState={{ disabled: !canSubmit, busy: verifying }}
          >
            {verifying ? (
              <ActivityIndicator size="small" color={customerColors.white} />
            ) : (
              <ArrowRightFigmaIcon size={24} color={customerColors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── PHONE NUMBER VERIFIED POPUP MODAL (FIGMA PARITY) ────────────────── */}
      <Modal visible={verifiedRoute !== null} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.verifiedCard}>
            {/* Top Right Close Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleContinue}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>

            {/* Verified Envelope Graphic */}
            <View style={styles.verifiedGraphicWrap}>
              <Image
                source={profileEmailVerified}
                style={styles.verifiedEnvelopeImage}
                resizeMode="contain"
              />
            </View>

            {/* Headline & Subtitle */}
            <Text style={styles.verifiedTitle}>{t('customer.auth.otp.verifiedTitle')}</Text>
            <Text style={styles.verifiedSubtitle}>
              {t('customer.auth.otp.verifiedBody')}
            </Text>

            {/* Continue Full-Width Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinue}
              style={styles.continueButton}
              accessibilityRole="button"
              testID="customer-otp-continue"
            >
              <Text style={styles.continueButtonText}>{t('customer.auth.otp.continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: customerColors.white,
    position: 'relative',
  },
  branchTopLeft: {
    position: 'absolute',
    top: 24,
    left: -4,
    width: 80,
    height: 145,
    zIndex: 1,
  },
  floatingLeafBottomRight: {
    position: 'absolute',
    bottom: 40,
    right: 14,
    width: 80,
    height: 110,
    zIndex: 1,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: customerSpacing[24],
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: 389,
    alignItems: 'center',
  },
  title: {
    fontFamily: customerFonts.editorial,
    fontSize: 27,
    lineHeight: 34,
    color: customerColors.brand,
    textAlign: 'center',
    marginBottom: 8,
  },
  phoneEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  phoneText: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customerColors.body,
    letterSpacing: 0.3,
  },
  bullet: {
    color: customerColors.neutral.neutral500,
    fontSize: 14,
  },
  editText: {
    fontFamily: customerFonts.semibold,
    fontSize: 14,
    color: customerColors.brand,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 300,
    marginBottom: 20,
  },
  pinBox: {
    flex: 1,
    alignItems: 'center',
  },
  pinInput: {
    width: '100%',
    fontSize: 22,
    fontFamily: customerFonts.bold,
    color: customerColors.body,
    paddingVertical: 8,
    textAlign: 'center',
  },
  pinUnderline: {
    width: '100%',
    height: 1.5,
    backgroundColor: customerColors.neutral.neutral400,
  },
  pinUnderlineFilled: {
    backgroundColor: customerColors.brand,
    height: 2,
  },
  resendRow: {
    marginBottom: 32,
    alignItems: 'center',
  },
  resendText: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: customerColors.neutral.neutral700,
  },
  timerHighlight: {
    color: customerColors.brand,
    fontFamily: customerFonts.semibold,
  },
  circularButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButtonActive: {
    backgroundColor: customerColors.brand,
  },
  circularButtonDisabled: {
    opacity: 0.45,
  },
  errorBox: {
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 16,
    maxWidth: 300,
  },
  errorText: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: customerColors.shared.error,
    textAlign: 'center',
  },
  linkText: {
    fontFamily: customerFonts.semibold,
    fontSize: 13,
    color: customerColors.brand,
    marginTop: 6,
  },
  arrowText: {
    color: customerColors.white,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: customerColors.neutral.black,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 8,
  },

  // ── MODAL STYLES (MATCHING FIGMA EXACTLY) ─────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: customerColors.overlay.scrim50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  verifiedCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: customerColors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: -12,
    right: -12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: customerColors.neutral.neutral300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: customerColors.white,
    shadowColor: customerColors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 13,
    color: customerColors.neutral.neutral600,
    fontWeight: '700',
    lineHeight: 15,
  },
  verifiedGraphicWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  verifiedEnvelopeImage: {
    width: 100,
    height: 68,
  },
  envelopeBackdrop: {
    width: 80,
    height: 60,
    backgroundColor: customerColors.legacy.greenMid,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  letterSheet: {
    position: 'absolute',
    top: -12,
    width: 52,
    height: 40,
    backgroundColor: customerColors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: customerColors.shared.primaryLight,
  },
  envelopeFlap: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 38,
    backgroundColor: customerColors.palette.green.meadow,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: customerColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: customerColors.white,
    zIndex: 5,
  },
  checkmarkIcon: {
    color: customerColors.white,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  verifiedTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    lineHeight: 28,
    color: customerColors.neutral.neutral900,
    textAlign: 'center',
    marginBottom: 8,
  },
  verifiedSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: customerColors.neutral.neutral600,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 6,
  },
  continueButton: {
    width: '100%',
    backgroundColor: customerColors.brand,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: customerFonts.bold,
    fontSize: 15,
    color: customerColors.white,
  },
});
