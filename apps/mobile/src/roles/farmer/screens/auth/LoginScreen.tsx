import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { t, getLocale, setLocale } from '../../../../i18n/farmer';
import { Button, ErrorState, Icon } from '@tohfa/mobile-ui';
import {
  loginWithPassword,
  loginWithOAuth,
  isOAuthNotLinked,
  requestOtp,
  resolveRouteAfterLogin,
  fetchMe,
  isRoleSelectionRequired,
  type OAuthProviderCode,
} from '../../api/auth';
import { preferredRoleForSelection } from '../../utils/adminShell';
import { ApiError, formatErrorMessage } from '../../../../shell/api/client';
import {
  signInWithGoogle,
  signInWithFacebook,
  SocialSignInCancelledError,
} from '../../native/socialSignIn';
import { authPalette as P, colors, typography, weights } from '../../theme';
import { toE164IndianMobile, useFieldValidation } from '../../utils/validation';
import { LOGIN_FIELD_ORDER, PASSWORD_MAX_LENGTH, loginRules, type LoginField } from './authValidation';
import { BackButtonIcon, CallIcon, LockIcon } from '../../assets/icons/AssetIcons';
import googleIcon from '../../assets/icons/googleee.png';
import facebookIcon from '../../assets/icons/facebook.png';
import tohfaLogo from '../../assets/tohfa-logo.png';

// ── SVG Icons ────────────────────────────────────────────────────────────────



function EyeIcon({ size = 18, color = P.greyMid1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function EyeOffIcon({ size = 18, color = P.greyMid1 }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1 1l22 22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface LoginScreenProps {
  onNavigate: (
    screen:
      | 'Welcome'
      | 'Otp'
      | 'CreatePassword'
      | 'ForgotPassword'
      | 'ApplicationStatus'
      | 'MainTabs'
      | 'AdminMain'
      | 'CustomerMain'
      | 'AdminMain'
      | 'Unsupported'
      | 'Register',
    params?: Record<string, string | number | undefined>,
  ) => void;
}

const MOBILE_PREFIX = '+91';

type AuthMode = 'password' | 'otp';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate }) => {
  // Password stays the default so existing password users see no change; the
  // "OTP Sign-In" switch restores the S-42 OTP login entry (see handleOtpLogin).
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<OAuthProviderCode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [locale, setLocaleState] = useState(getLocale());
  const [isMobileFocused, setIsMobileFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const switchLocale = (lang: 'en' | 'ta') => {
    setLocale(lang);
    setLocaleState(lang);
  };

  const validation = useFieldValidation<LoginField>({
    values: { mobile, password },
    rules: loginRules,
    order: LOGIN_FIELD_ORDER,
  });
  const mobileError = validation.messageFor('mobile');
  const passwordError = validation.messageFor('password');

  // E.164 from whatever the farmer typed (spaces / +91 / 0 prefix tolerated); the
  // fallback keeps the old behaviour for the social-link path, which only checks non-blank.
  const cleanMobile = () =>
    toE164IndianMobile(mobile) ?? (mobile.startsWith('+') ? mobile.trim() : `+91${mobile.trim()}`);

  /**
   * Social sign-in (BR-39). Apple Sign-In has been removed from this screen
   * for now (no backend support exists for it — `OAuthProviderCode` is only
   * `'GOOGLE' | 'FACEBOOK'` — so there was never a real flow to wire up).
   * Re-add it as a real integration if/when Apple Sign-In is actually in
   * scope, rather than restoring a no-op button.
   *
   * Google/Facebook: get a verified provider token from the native SDK, then
   * hand it to the same `/auth/oauth/{provider}` endpoint password login
   * uses via `/auth/login`. Three outcomes, mirrored from `handlePasswordLogin`
   * where the shape overlaps:
   *  - success -> same post-login navigation as a password login.
   *  - requiresRoleSelection -> same deterministic first-role resolution as
   *    `handlePasswordLogin` (see the comment there: this app has no
   *    role-picker UI for an existing login).
   *  - NOT_LINKED -> BR-39: this identity has no TOHFA account yet, and OAuth
   *    is never allowed to create one by itself. The farmer must still prove
   *    a real mobile number via OTP. Rather than adding a new "enter your
   *    mobile" screen, this reuses the mobile number field already on this
   *    same form — if it's empty, ask for it and stop (a defensible minimal
   *    choice; see the sub-agent report for why a dedicated screen wasn't
   *    built here without a design reference).
   */
  async function onSocialLogin(provider: OAuthProviderCode) {
    setSocialLoading(provider);
    setErrorMsg(null);

    try {
      const providerToken =
        provider === 'GOOGLE' ? await signInWithGoogle() : await signInWithFacebook();

      let outcome = await loginWithOAuth(provider, providerToken);

      if (isRoleSelectionRequired(outcome)) {
        const firstRole = outcome.availableRoles[0]?.code;
        if (!firstRole) {
          setErrorMsg(t('error.generic'));
          return;
        }
        outcome = await loginWithOAuth(provider, providerToken, { roleCode: firstRole });
      }

      if (isOAuthNotLinked(outcome)) {
        if (!mobile.trim()) {
          setErrorMsg(t('farmer.auth.login.socialLinkMobileRequired'));
          return;
        }
        const targetMobile = cleanMobile();
        const otpRes = await requestOtp({ mobile: targetMobile, purpose: 'LOGIN' });
        onNavigate('Otp', {
          mobile: targetMobile,
          challengeId: otpRes.challengeId,
          resendAvailableAt: otpRes.resendAvailableAt,
          attemptsRemaining: otpRes.attemptsRemaining,
          mockCode: otpRes._mockCode,
          purpose: 'LOGIN',
          linkToken: outcome.linkToken,
        });
        return;
      }

      if (isRoleSelectionRequired(outcome)) {
        setErrorMsg(t('error.generic'));
        return;
      }

      const me = await fetchMe();
      const route = resolveRouteAfterLogin(outcome, me);
      onNavigate(route.name, route.params);
    } catch (err: unknown) {
      if (err instanceof SocialSignInCancelledError) {
        // The farmer closed the native sheet — not an error worth surfacing.
        return;
      }
      setErrorMsg(formatErrorMessage(err, t('error.generic')));
    } finally {
      setSocialLoading(null);
    }
  }

  /**
   * OTP login (purpose LOGIN). Restores the S-42 "OTP Sign-In" entry
   * (2dd99bf2) that the 8e0d4feb redesign dropped: send a LOGIN challenge for
   * the typed number and hand it to the existing OTP screen, which verifies it
   * via `POST /auth/otp/verify` and routes exactly like a password login.
   */
  async function handleOtpLogin() {
    const rawMobile = mobile.replace(/\s+/g, '').trim();
    if (rawMobile.length < 10) {
      setErrorMsg(t('farmer.auth.login.mobileInvalid'));
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const cMobile = rawMobile.startsWith('+') ? rawMobile : `${MOBILE_PREFIX}${rawMobile}`;

    try {
      const res = await requestOtp({ mobile: cMobile, purpose: 'LOGIN' });
      onNavigate('Otp', {
        mobile: cMobile,
        challengeId: res.challengeId,
        resendAvailableAt: res.resendAvailableAt,
        attemptsRemaining: res.attemptsRemaining,
        mockCode: res._mockCode,
        purpose: 'LOGIN',
      });
    } catch (err: unknown) {
      setErrorMsg(formatErrorMessage(err, t('error.generic')));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(mode: AuthMode) {
    setAuthMode(mode);
    setErrorMsg(null);
  }

  /**
   * OTP login (purpose LOGIN). Restores the S-42 "OTP Sign-In" entry
   * (2dd99bf2) that the 8e0d4feb redesign dropped: send a LOGIN challenge for
   * the typed number and hand it to the existing OTP screen, which verifies it
   * via `POST /auth/otp/verify` and routes exactly like a password login.
   */
  async function handleOtpLogin() {
    const rawMobile = mobile.replace(/\s+/g, '').trim();
    if (rawMobile.length < 10) {
      setErrorMsg(t('farmer.auth.login.mobileInvalid'));
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const cMobile = rawMobile.startsWith('+') ? rawMobile : `${MOBILE_PREFIX}${rawMobile}`;

    try {
      const res = await requestOtp({ mobile: cMobile, purpose: 'LOGIN' });
      onNavigate('Otp', {
        mobile: cMobile,
        challengeId: res.challengeId,
        resendAvailableAt: res.resendAvailableAt,
        attemptsRemaining: res.attemptsRemaining,
        mockCode: res._mockCode,
        purpose: 'LOGIN',
      });
    } catch (err: unknown) {
      setErrorMsg(formatErrorMessage(err, t('error.generic')));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(mode: AuthMode) {
    setAuthMode(mode);
    setErrorMsg(null);
  }

  async function handleOtpLogin() {
    // Only the mobile number is needed for an OTP login.
    if (validation.allErrors.mobile !== undefined) {
      validation.validateAll();
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const cMobile = cleanMobile();

    try {
      const res = await requestOtp({ mobile: cMobile, purpose: 'LOGIN' });
      onNavigate('Otp', {
        mobile: cMobile,
        challengeId: res.challengeId,
        resendAvailableAt: res.resendAvailableAt,
        attemptsRemaining: res.attemptsRemaining,
        mockCode: res._mockCode,
        purpose: 'LOGIN',
      });
    } catch (err: unknown) {
      setErrorMsg(formatErrorMessage(err, t('error.generic')));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin() {
    if (!validation.validateAll().valid) return;
    setLoading(true);
    setErrorMsg(null);

    const cMobile = cleanMobile();

    try {
      let outcome = await loginWithPassword({ mobile: cMobile, password });

      // An account with more than one role and no pinned roleCode: complete the
      // login with its admin role if it has one, otherwise its first role (no
      // role picker exists; see preferredRoleForSelection).
      if (isRoleSelectionRequired(outcome)) {
        const chosenRole = preferredRoleForSelection(outcome.availableRoles);
        if (!chosenRole) {
          setErrorMsg(t('error.generic'));
          return;
        }
        outcome = await loginWithPassword({ mobile: cMobile, password, roleCode: chosenRole });
      }

      if (isRoleSelectionRequired(outcome)) {
        setErrorMsg(t('error.generic'));
        return;
      }

      // The shell comes from the role the server issued this session for. An
      // unrecognised role opens no admin shell ('Unsupported').
      const me = await fetchMe();
      const route = resolveRouteAfterLogin(outcome, me);
      onNavigate(route.name, route.params);
    } catch (err: unknown) {
      console.error('[LoginScreen] Catch block hit:', err);
      if (err instanceof ApiError && err.is('UNAUTHENTICATED')) {
        // BR-142: the server gives the same 401 for an unknown number, a wrong
        // password and an account with no password yet (so it never reveals
        // which). Every such refusal points to OTP sign-in, which is how a
        // first-time user gets in and then creates a password.
        setErrorMsg(t('farmer.auth.login.invalidCredentials'));
      } else {
        setErrorMsg(formatErrorMessage(err, t('error.generic')));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.backRow}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={() => onNavigate('Welcome')}
        >
          <BackButtonIcon size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.iconCircle}>
        <Image source={tohfaLogo} style={{ width: 48, height: 48 }} resizeMode="contain" />
      </View>

      <Text style={styles.title}>{t('farmer.auth.login.title')}</Text>
      <Text style={styles.subtitle}>{t('farmer.auth.login.subtitle')}</Text>

      <View style={styles.tabContainer}>
        {(['password', 'otp'] as const).map((mode) => (
          <TouchableOpacity
            key={mode}
            accessibilityRole="tab"
            accessibilityState={{ selected: authMode === mode }}
            style={[styles.tabButton, authMode === mode && styles.tabButtonActive]}
            onPress={() => switchMode(mode)}
          >
            <Text style={[styles.tabButtonText, authMode === mode && styles.tabButtonTextActive]}>
              {mode === 'password' ? t('farmer.auth.login.tabPassword') : t('farmer.auth.login.tabOtp')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMsg ? <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} /> : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{t('farmer.auth.login.mobile')}</Text>
        <View style={[styles.fieldRow, isMobileFocused && styles.fieldRowFocused]}>
          <View style={styles.fieldIconWrap}>
            <CallIcon size={18} color={isMobileFocused ? P.primary : P.greyMid2} />
          </View>
          <Text style={styles.prefix}>{MOBILE_PREFIX}</Text>
          <View style={styles.prefixDivider} />
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            onFocus={() => setIsMobileFocused(true)}
            onBlur={() => {
              setIsMobileFocused(false);
              validation.onBlur('mobile');
            }}
            keyboardType="phone-pad"
            maxLength={16}
            placeholder="98765 43210"
            placeholderTextColor={P.twGray400}
            style={styles.fieldInput}
            accessibilityLabel={t('farmer.auth.login.mobile')}
          />
        </View>
        {mobileError ? <Text accessibilityRole="alert" style={styles.fieldError}>{mobileError}</Text> : null}
      </View>

      {authMode === 'password' ? (
        <>
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{t('farmer.auth.login.password')}</Text>
          <View style={[styles.fieldRow, isPasswordFocused && styles.fieldRowFocused]}>
            <View style={styles.fieldIconWrap}>
              <LockIcon size={18} color={isPasswordFocused ? P.primary : P.greyMid2} />
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => {
              setIsPasswordFocused(false);
              validation.onBlur('password');
            }}
              secureTextEntry={!showPassword}
              maxLength={PASSWORD_MAX_LENGTH}
            placeholder="••••••••"
              placeholderTextColor={P.twGray400}
              style={[
                styles.fieldInput,
                styles.passwordInput,
                !showPassword && styles.passwordInputMasked,
              ]}
              accessibilityLabel={t('farmer.auth.login.password')}
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setShowPassword((s) => !s)}
              style={styles.eyeToggleBtn}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <EyeOffIcon size={18} color={P.greyMid2} />
              ) : (
                <EyeIcon size={18} color={P.greyMid2} />
              )}
            </TouchableOpacity>
          </View>
          {passwordError ? <Text accessibilityRole="alert" style={styles.fieldError}>{passwordError}</Text> : null}
      </View>

        <View style={styles.optionRow}>
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityState={{ checked: rememberMe }}
            style={styles.rememberWrap}
            onPress={() => setRememberMe((r) => !r)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe ? <Icon name="check" size={12} color={P.white} /> : null}
            </View>
            <Text style={styles.rememberText}>{t('farmer.auth.login.rememberMe')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => onNavigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>{t('farmer.auth.login.forgotPassword')}</Text>
          </TouchableOpacity>
        </View>

        <Button
          title={t('farmer.auth.login.submit')}
          onPress={handlePasswordLogin}
          loading={loading}
            style={styles.loginButton}
          textStyle={styles.loginButtonText}
        />
        </>
      ) : (
        <Button
          title={t('farmer.auth.login.requestOtp')}
          onPress={handleOtpLogin}
          loading={loading}
          disabled={!mobile}
          style={styles.loginButton}
          textStyle={styles.loginButtonText}
        />
      )}

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('farmer.auth.login.orContinueWith')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.socialRow}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('farmer.auth.login.continueWithGoogle')}
          style={styles.socialButton}
          onPress={() => onSocialLogin('GOOGLE')}
          disabled={socialLoading !== null}
        >
          {socialLoading === 'GOOGLE' ? (
            <ActivityIndicator size="small" color={P.primary} />
          ) : (
            <Image source={googleIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('farmer.auth.login.continueWithFacebook')}
          style={styles.socialButton}
          onPress={() => onSocialLogin('FACEBOOK')}
          disabled={socialLoading !== null}
        >
          {socialLoading === 'FACEBOOK' ? (
            <ActivityIndicator size="small" color={P.primary} />
          ) : (
            <Image source={facebookIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.registerWrap}
        onPress={() => onNavigate('Register')}
      >
        <Text style={styles.registerText}>
          {t('farmer.auth.login.newToTohfa')}{' '}
          <Text style={styles.registerLink}>{t('farmer.auth.login.applyAsFarmer')} →</Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.langRow}>
        <TouchableOpacity
          accessibilityRole="button"
          style={locale === 'en' ? styles.langPillActive : styles.langPill}
          onPress={() => switchLocale('en')}
        >
          <Text style={locale === 'en' ? styles.langPillActiveText : styles.langPillText}>EN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={locale === 'ta' ? styles.langPillActive : styles.langPill}
          onPress={() => switchLocale('ta')}
        >
          <Text style={locale === 'ta' ? styles.langPillActiveText : styles.langPillText}>{'\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.legalRow}>
        <Text style={styles.legalText}>
          <Text style={styles.legalLink}>{t('farmer.auth.welcome.terms')}</Text>
          {' · '}
          <Text style={styles.legalLink}>{t('farmer.auth.welcome.privacy')}</Text>
        </Text>
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  fieldError: {
    color: P.red700,
    fontSize: typography.caption,
    marginTop: 6,
  },
  container: {
    flex: 1,
    backgroundColor: P.bg,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backRow: {
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: P.progressInactive,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 18,
  },
  title: {
    fontSize: typography.title,
    fontWeight: weights.bold,
    color: P.ink,
    textAlign: 'center',
    marginTop: 18,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    fontWeight: weights.regular,
    lineHeight: 19,
    color: P.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 18,
    padding: 4,
    borderRadius: 12,
    backgroundColor: P.lightGreen,
  },
  tabButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: P.white,
  },
  tabButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    color: P.blueDeep1,
  },
  tabButtonTextActive: {
    color: P.primary,
    fontWeight: weights.bold,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGlyph: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.googleBlue,
  },
  facebookBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: P.facebookBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facebookGlyph: {
    fontSize: typography.bodyLarge,
    fontWeight: '800',
    color: P.white,
    marginTop: -1,
  },
  fieldGroup: {
    marginTop: 18,
  },
  fieldLabel: {
    fontSize: typography.caption,
    fontWeight: weights.bold,
    color: colors.textDark,
    marginBottom: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: P.weatherCloudWhite,
    borderWidth: 1.5,
    borderColor: P.tanTint2,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    shadowColor: P.nearBlackDark1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldRowFocused: {
    borderColor: P.primary,
    backgroundColor: P.weatherCloudWhite,
    shadowColor: P.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  prefix: {
    fontSize: typography.body,
    fontWeight: weights.bold,
    color: colors.textDark,
  },
  prefixDivider: {
    width: 1,
    height: 18,
    backgroundColor: P.twGray200,
    marginLeft: 10,
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    height: '100%',
    fontSize: typography.body,
    fontWeight: weights.medium,
    color: colors.textDark,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  passwordInput: {
    paddingRight: 4,
  },
  passwordInputMasked: {
    fontSize: typography.title,
    letterSpacing: 3,
    fontWeight: '700',
  },
  eyeToggleBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: P.border,
    backgroundColor: P.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: P.primary,
    borderColor: P.primary,
  },
  rememberText: {
    fontSize: typography.caption,
    fontWeight: weights.medium,
    color: P.ink,
  },
  forgotText: {
    fontSize: typography.caption,
    fontWeight: weights.bold,
    color: P.primary,
  },
  loginButton: {
    backgroundColor: P.primary,
    borderRadius: 12,
    height: 48,
    marginTop: 22,
  },
  loginButtonText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: P.border,
  },
  dividerText: {
    fontSize: typography.caption,
    fontWeight: weights.semibold,
    color: P.blueDeep1,
  },
  registerWrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  registerText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.regular,
    color: P.blueDeep1,
  },
  registerLink: {
    color: P.primary,
    fontWeight: weights.bold,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 64,
  },
  langPillActive: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: P.lightGreen,
  },
  langPillActiveText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.bold,
    color: P.primary,
  },
  langPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  langPillText: {
    fontSize: typography.bodySmall,
    fontWeight: weights.semibold,
    color: P.blueDeep1,
  },
  legalRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  legalText: {
    fontSize: typography.caption,
    fontWeight: weights.regular,
    color: P.blueMid1,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});
