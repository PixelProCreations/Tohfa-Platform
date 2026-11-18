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
import { getLocale } from '../../../i18n/customer';

const GreenFloatingLeaf = () => (
  <View style={styles.floatingLeafBottomRight} pointerEvents="none">
    <Svg width={52} height={68} viewBox="0 0 52 68" fill="none">
      <Path
        d="M6 62C12 38 30 12 48 6C52 26 42 52 18 65C12 68 8 66 6 62z"
        fill="#4CAF50"
        opacity={0.85}
      />
      <Path
        d="M6 62C18 46 32 30 48 6"
        stroke="#81C784"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

const EMPTY_PIN: string[] = Array.from({ length: CUSTOMER_OTP_LENGTH }, () => '');
const PIN_INDEXES = EMPTY_PIN.map((_, i) => i);

interface CustomerOtpScreenProps {
  /** 10-digit mobile the challenge was sent to (from CustomerLogin). */
  mobile: string;
  challengeId: string;
  expiresAt?: string | undefined;
  resendAvailableAt?: string | undefined;
  attemptsRemaining?: number | undefined;
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
  onNavigate,
}) => {
  const [challenge, setChallenge] = useState<ChallengeState>({
    challengeId,
    resendAvailableAt,
    attemptsRemaining,
  });
  const [pin, setPin] = useState<string[]>(EMPTY_PIN);
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
      setError(problem.message);
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
      setPin(EMPTY_PIN);
      inputRefs.current[0]?.focus();
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
          <Text style={styles.title}>Please enter 6-digit PIN Sent to</Text>

          {/* Mobile number with Edit link */}
          <View style={styles.phoneEditRow}>
            <Text style={styles.phoneText}>+91 {mobile}</Text>
            <Text style={styles.bullet}> • </Text>
            <TouchableOpacity
              onPress={() => onNavigate('CustomerLogin')}
              accessibilityRole="link"
              testID="customer-otp-edit"
            >
              <Text style={styles.editText}>Edit</Text>
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
                    keyboardType="number-pad"
                    maxLength={index === 0 ? CUSTOMER_OTP_LENGTH : 1}
                    value={pin[index]}
                    onChangeText={text => handlePinChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    textAlign="center"
                    autoFocus={index === 0}
                    editable={!locked && !verifying}
                    textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                    accessibilityLabel={`PIN digit ${index + 1}`}
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
                  <Text style={styles.linkText}>Try again</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Resend: cooldown from the server's resendAvailableAt */}
          <View style={styles.resendRow}>
            {secondsLeft > 0 && !locked ? (
              <Text style={styles.resendText} testID="customer-otp-timer">
                Didn't receive the PIN? Resend in{' '}
                <Text style={styles.timerHighlight}>{secondsLeft}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={() => void handleResend()}
                disabled={resending || verifying}
                accessibilityRole="button"
                accessibilityLabel="Resend PIN"
                testID="customer-otp-resend"
              >
                <Text style={styles.resendText}>
                  {needsResend || locked ? 'Request a new PIN. ' : "Didn't receive the PIN? "}
                  <Text style={styles.timerHighlight}>{resending ? 'Sending...' : 'Resend'}</Text>
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
              !canSubmit && styles.circularButtonDisabled,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Verify PIN"
            accessibilityState={{ disabled: !canSubmit, busy: verifying }}
          >
            {verifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ArrowRightFigmaIcon size={24} color="#FFFFFF" />
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
            <Text style={styles.verifiedTitle}>Phone number Verified!</Text>
            <Text style={styles.verifiedSubtitle}>
              Your phone number has been successfully verified. You can now enjoy all features of TOHFA Market.
            </Text>

            {/* Continue Full-Width Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContinue}
              style={styles.continueButton}
              accessibilityRole="button"
              testID="customer-otp-continue"
            >
              <Text style={styles.continueButtonText}>Continue</Text>
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
    backgroundColor: '#FFFFFF',
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
    color: '#9CA3AF',
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
    backgroundColor: '#D1D5DB',
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
    color: '#4B5563',
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
    color: '#DC2626',
    textAlign: 'center',
  },
  linkText: {
    fontFamily: customerFonts.semibold,
    fontSize: 13,
    color: customerColors.brand,
    marginTop: 6,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 8,
  },

  // ── MODAL STYLES (MATCHING FIGMA EXACTLY) ─────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  verifiedCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
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
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 13,
    color: '#6B7280',
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
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  envelopeFlap: {
    position: 'absolute',
    bottom: 0,
    width: 80,
    height: 38,
    backgroundColor: '#388E3C',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 5,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  verifiedTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    lineHeight: 28,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  verifiedSubtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#6B7280',
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
    color: '#FFFFFF',
  },
});
