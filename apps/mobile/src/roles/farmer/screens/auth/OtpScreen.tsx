import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from '@tohfa/mobile-ui';
import type { TextInputInstance } from 'react-native';
import { authPalette as themeAuthPalette, typography } from '../../theme';
import { BackButtonIcon, LockIcon } from '../../assets/icons/AssetIcons';
import {
  verifyOtp,
  requestOtp,
  renderOtpState,
  resolveRouteAfterAuth,
  fetchMe,
  isOtpVerifiedNoAccount,
  logout,
} from '../../api/auth';
import { rememberEntryRole, rolesForEntry } from '../../../../shell/auth/entryRole';
import { ApiError, formatErrorMessage } from '../../../../shell/api/client';
import { t } from '../../../../i18n/farmer';
import {
  OTP_CODE_LENGTH,
  otpTextInputProps,
  sanitizeOtpInput,
  useOtpSmsAutofill,
} from '../../../../shell/otp';

// This screen's mockup uses a distinct cream/dark-green scheme from the rest
// of the auth flow (which uses `authPalette` from the theme directly) — map
// its roles onto the shared theme fields so no hex is inlined here.
const authPalette = {
  background: themeAuthPalette.creamBg,
  primary: themeAuthPalette.otpInk,
  primaryLight: themeAuthPalette.lightGreen,
  // The enabled Verify fill must be a solid brand green. It used to be
  // `sageButtonBg` for every state, with only `opacity: 0.7` added when
  // disabled, so a complete code (typed or SMS-autofilled) still looked
  // disabled. Sage is now the disabled fill only.
  buttonBg: themeAuthPalette.primary,
  buttonBgDisabled: themeAuthPalette.sageButtonBg,
  text: themeAuthPalette.otpInk,
  textLight: themeAuthPalette.sageMutedText,
  inputBg: themeAuthPalette.white,
  inputBorder: themeAuthPalette.sageBorder,
  focusBorder: themeAuthPalette.green700,
  successLight: themeAuthPalette.successTint,
};

interface OtpScreenProps {
  mobile: string;
  challengeId?: string | undefined;
  resendAvailableAt?: string | undefined;
  attemptsRemaining?: number | undefined;
  purpose?: 'LOGIN' | 'PASSWORD_RESET';
  /**
   * BR-39, optional. Set only when this OTP challenge was requested to
   * complete an OAuth link (see `LoginScreen.tsx`'s `onSocialLogin`,
   * NOT_LINKED branch). Passed through unchanged to `verifyOtp()`.
   */
  linkToken?: string | undefined;
  /**
   * The API's `_mockCode`, which exists only when its SMS_PROVIDER is `mock`
   * (auth.service.ts sendOtp). Shown as a dev hint, gated again on `__DEV__`.
   */
  mockCode?: string | undefined;
  onNavigate: (
    screen:
      | 'CreatePassword'
      | 'ApplicationStatus'
      | 'MainTabs'
      | 'AdminMain'
      | 'CustomerMain'
      | 'Unsupported'
      | 'Login'
      | 'ResetPassword',
    params?: Record<string, string | number | undefined>
  ) => void;
}

// Dev-only pre-fill: a full-length numeric mock code, and only under __DEV__.
// Uses the same 6-digit length the screen already validates against.
function devPrefill(mock: string | undefined): string {
  return __DEV__ && mock !== undefined && /^\d{6}$/.test(mock) ? mock : '';
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  mobile,
  challengeId: initialChallengeId,
  resendAvailableAt: initialResendAvailableAt,
  attemptsRemaining: initialAttemptsRemaining = 3,
  purpose = 'LOGIN',
  linkToken,
  mockCode: initialMockCode,
  onNavigate,
}) => {
  const [mockCode, setMockCode] = useState<string | undefined>(initialMockCode);
  const [activeChallengeId, setActiveChallengeId] = useState(initialChallengeId || '');
  const [code, setCode] = useState(() => devPrefill(initialMockCode));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<TextInputInstance>(null);

  const [resendAvailableAt, setResendAvailableAt] = useState<string | undefined>(initialResendAvailableAt);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(initialAttemptsRemaining);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const otpState = renderOtpState({
    resendAvailableAt,
    attemptsRemaining,
    now,
  });

  // Android: fill the boxes from the SMS once the user allows it on the
  // system sheet. Farmer/admin login never auto-submitted, so this only
  // fills; the user still taps Verify. Re-armed per challenge (resend).
  useOtpSmsAutofill({
    enabled: !otpState.isLocked,
    armKey: activeChallengeId,
    onCode: (smsCode) => {
      setCode(smsCode);
      setErrorMsg(null);
    },
  });

  async function handleVerify() {
    if (code.length < 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }
    if (otpState.isLocked) {
      setErrorMsg('Too many failed attempts. Please try again later.');
      return;
    }
    if (purpose === 'PASSWORD_RESET') {
      onNavigate('ResetPassword', { challengeId: activeChallengeId, code });
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // BR-39: `linkToken`, when present, tells the server to link (or
      // create-and-link) the OAuth identity that started this OTP challenge
      // atomically with this verify call. Its `oauthProfile` result field
      // (fullName/email/photoUrl the provider returned) is intentionally not
      // consumed here — see this task's sub-agent report for why routing a
      // brand-new OAuth-created account into the farmer registration wizard
      // was left unimplemented rather than guessed. Every verify outcome,
      // linked or not, proceeds through the same existing post-login route.
      const verified = await verifyOtp({
        challengeId: activeChallengeId,
        code,
        ...(linkToken !== undefined ? { linkToken } : {}),
      });

      // A correct code for a number with no account mints no tokens (the
      // server answers `{ verified, mobile, purpose }`, see openapi
      // OtpVerifiedNoAccount). Calling /auth/me now would only 401 into the
      // refresh path and bounce to Welcome with no explanation (BR-142).
      if (isOtpVerifiedNoAccount(verified)) {
        setErrorMsg(t('farmer.auth.otp.noAccount'));
        return;
      }

      // BR-135: this OTP screen is reached only from the farmer/staff Login, so
      // it is the farmer entry. `/auth/otp/verify` takes no roleCode and signs
      // the session for every role held, so the entry narrows the roles the
      // server returned: a FARMER + CUSTOMER account opens the farmer side
      // (whatever order the roles came in) and a customer-only account is
      // refused and signed out rather than opened as a customer.
      const me = await fetchMe();
      const entry = rolesForEntry('FARMER', me.roles);
      if (!entry.ok) {
        await logout().catch(() => undefined);
        setErrorMsg(t('farmer.auth.login.notFarmerAccount'));
        return;
      }
      await rememberEntryRole('FARMER');
      // BR-142: an account with no password yet is routed to Create Password
      // by resolveRouteAfterAuth (it reads `hasPassword` from /auth/me).
      const route = resolveRouteAfterAuth({ ...me, roles: entry.roles });
      onNavigate(route.name, route.params);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.is('OTP_INVALID') || err.is('OTP_EXPIRED')) {
          const nextAttempts = Math.max(0, attemptsRemaining - 1);
          setAttemptsRemaining(nextAttempts);
        } else if (err.is('OTP_LOCKED')) {
          setAttemptsRemaining(0);
        }
      }
      setErrorMsg(formatErrorMessage(err, t('error.generic')));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!otpState.canResend) return;
    setResendLoading(true);
    setErrorMsg(null);

    try {
      const res = await requestOtp({ mobile, purpose });
      if (res.challengeId) {
        setActiveChallengeId(res.challengeId);
      }
      setMockCode(res._mockCode || undefined);
      setResendAvailableAt(res.resendAvailableAt);
      setAttemptsRemaining(res.attemptsRemaining);
      setCode(devPrefill(res._mockCode));
    } catch (err: unknown) {
      setErrorMsg(formatErrorMessage(err, 'Could not resend OTP. Please try again.'));
    } finally {
      setResendLoading(false);
    }
  }

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const isFilled = i < code.length;
      const isActive = i === code.length;
      
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isActive && styles.otpBoxActive,
          ]}
        >
          <Text style={[styles.otpBoxText, isFilled && styles.otpBoxTextFilled]}>
            {code[i] || ''}
          </Text>
        </View>
      );
    }
    return boxes;
  };

  const canVerify = code.length === OTP_CODE_LENGTH && !otpState.isLocked;

  const formatTimer =(seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `0${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Login')}>
              <BackButtonIcon size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <LockIcon size={32} color={authPalette.primary} />
            </View>
          </View>

          <Text style={styles.title}>Verify your mobile</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to
          </Text>
          <Text style={styles.phoneNumber}>{mobile || '+91 98XXX XX789'}</Text>
          
          <TouchableOpacity onPress={() => onNavigate('Login')}>
            <Text style={styles.changeMobile}>Change mobile number</Text>
          </TouchableOpacity>

          {__DEV__ && mockCode ? (
            <Text style={styles.devHint}>{t('farmer.auth.otp.devMockCode', { code: mockCode })}</Text>
          ) : null}

          {errorMsg && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          <Pressable style={styles.otpContainer} onPress={() => inputRef.current?.focus()}>
            {renderOtpBoxes()}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={(text) => setCode(sanitizeOtpInput(text, OTP_CODE_LENGTH))}
              {...otpTextInputProps}
              autoFocus
            />
          </Pressable>

          <View style={styles.resendContainer}>
            {otpState.canResend ? (
              <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                <Text style={[styles.resendLabel, { color: authPalette.primary, fontWeight: '700' }]}>
                  {resendLoading ? 'Resending...' : 'Resend OTP now'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendLabel}>
                Resend OTP in <Text style={styles.resendTimer}>{formatTimer(otpState.secondsUntilResend)}</Text>
              </Text>
            )}
          </View>

          {/* Faded only when there is nothing valid to submit (incomplete
              code, or BR-32 locked). While verifying it stays solid with a
              spinner: busy, not unavailable. */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              !canVerify && styles.verifyButtonDisabled,
            ]}
            testID="otp-verify"
            onPress={handleVerify}
            disabled={!canVerify || loading}
            accessibilityRole="button"
            accessibilityLabel={t('farmer.auth.otp.verify')}
            accessibilityState={{ disabled: !canVerify || loading, busy: loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={authPalette.inputBg} />
            ) : (
              <Text style={styles.verifyButtonText}>{t('farmer.auth.otp.verify')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.supportContainer}>
            <Text style={styles.supportText}>
              Having trouble?{' '}
              <Text style={styles.supportLink} onPress={() => {}}>
                Contact TOHFA support
              </Text>
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: authPalette.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: themeAuthPalette.progressInactive,
    backgroundColor: themeAuthPalette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: typography.title,
    color: authPalette.textLight,
    fontWeight: '600',
  },
  iconWrapper: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: authPalette.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.headline,
    fontWeight: '800',
    color: authPalette.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.body,
    color: authPalette.textLight,
    marginBottom: 8,
  },
  phoneNumber: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: authPalette.text,
    marginBottom: 8,
  },
  changeMobile: {
    fontSize: typography.body,
    fontWeight: '700',
    color: authPalette.focusBorder,
    marginBottom: 32,
  },
  devHint: {
    fontSize: typography.body,
    color: authPalette.textLight,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    color: themeAuthPalette.red700,
    fontSize: typography.body,
    marginBottom: 16,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: authPalette.inputBorder,
    backgroundColor: authPalette.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    backgroundColor: authPalette.successLight,
    borderColor: authPalette.focusBorder,
  },
  otpBoxActive: {
    borderColor: authPalette.focusBorder,
  },
  otpBoxText: {
    fontSize: typography.title,
    fontWeight: '700',
    color: authPalette.text,
  },
  otpBoxTextFilled: {
    color: authPalette.primary,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendContainer: {
    marginBottom: 32,
  },
  resendLabel: {
    fontSize: typography.body,
    color: authPalette.textLight,
  },
  resendTimer: {
    fontWeight: '700',
    color: authPalette.focusBorder,
  },
  verifyButton: {
    width: '100%',
    height: 52,
    backgroundColor: authPalette.buttonBg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    backgroundColor: authPalette.buttonBgDisabled,
  },
  verifyButtonText: {
    color: authPalette.inputBg,
    fontSize: typography.bodyLarge,
    fontWeight: '700',
  },
  supportContainer: {
    marginBottom: 16,
  },
  supportText: {
    fontSize: typography.body,
    color: authPalette.textLight,
  },
  supportLink: {
    fontWeight: '700',
    color: authPalette.focusBorder,
  },
});

