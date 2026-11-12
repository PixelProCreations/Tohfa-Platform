import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { t } from '../../../../i18n/farmer';
import { ErrorState } from '@tohfa/mobile-ui';
import { BackButtonIcon, CallIcon, LockIcon } from '../../assets/icons/AssetIcons';
import { requestOtp } from '../../api/auth';
import { ApiError } from '../../../../shell/api/client';
import { authPalette as P, typography } from '../../theme';
import { toE164IndianMobile, useFieldValidation } from '../../utils/validation';
import { forgotRules, type ForgotField } from './authValidation';

interface ForgotPasswordScreenProps {
  onNavigate: (screen: 'Login' | 'Otp', params?: Record<string, string | number | undefined>) => void;
}

/**
 * Approved Forgot Password design (branding guidelines, Screen 12).
 *
 * Light screen: back button, 4-step progress indicator (step 1 active),
 * light-green lock circle, "Forgot Password" title, +91 mobile field,
 * solid "Send OTP" button and a "Remember your password? Login" footer.
 */


export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onNavigate }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const validation = useFieldValidation<ForgotField>({ values: { mobile }, rules: forgotRules });
  const mobileError = validation.messageFor('mobile');

  async function handleSubmit() {
    if (!validation.validateAll().valid) return;
    const cleanMobile = toE164IndianMobile(mobile);
    if (cleanMobile === null) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await requestOtp({ mobile: cleanMobile, purpose: 'PASSWORD_RESET' });
      onNavigate('Otp', {
        mobile: cleanMobile,
        challengeId: res.challengeId,
        resendAvailableAt: res.resendAvailableAt,
        attemptsRemaining: res.attemptsRemaining,
        mockCode: res._mockCode,
        purpose: 'PASSWORD_RESET'
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(t(`error.${err.problem.code}` as unknown as Parameters<typeof t>[0]) || err.problem.detail || t('error.generic'));
      } else {
        setErrorMsg(t('error.generic'));
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
          onPress={() => onNavigate('Login')}
        >
          <BackButtonIcon size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.iconCircle}>
        <LockIcon size={28} color={P.primary} />
      </View>

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your registered mobile number to receive an OTP</Text>

      {errorMsg ? (
        <View style={{ marginTop: 24, paddingHorizontal: 0 }}>
          <ErrorState message={errorMsg} onRetry={() => setErrorMsg(null)} />
        </View>
      ) : null}

      <Text style={styles.fieldLabel}>{t('farmer.auth.login.mobile')}</Text>
      <View style={styles.fieldRow}>
        <CallIcon size={16} color={P.muted} />
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.fieldInput}
          value={mobile}
          onChangeText={setMobile}
          onBlur={() => validation.onBlur('mobile')}
          keyboardType="phone-pad"
          placeholder="98765 43210"
          placeholderTextColor={P.muted}
          maxLength={12}
          accessibilityLabel={t('farmer.auth.login.mobile')}
        />
      </View>
      {mobileError ? (
        <Text accessibilityRole="alert" style={styles.fieldError}>
          {mobileError}
        </Text>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.ctaButton, loading && styles.ctaDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.ctaText}>{t('farmer.auth.forgot.sendOtp')}</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        {t('farmer.auth.forgot.rememberPassword')}{' '}
        <Text
          style={styles.footerLink}
          onPress={() => onNavigate('Login')}
          accessibilityRole="link"
        >
          {t('farmer.auth.forgot.loginLink')}
        </Text>
      </Text>
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
    padding: 24,
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
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
  backButtonText: {
    fontSize: typography.title,
    color: P.muted,
    fontWeight: '600',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 36,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.ink,
    textAlign: 'center',
    marginTop: 24,
  },
  subtitle: {
    fontSize: typography.bodySmall,
    lineHeight: 19,
    color: P.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  fieldLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '700',
    color: P.ink,
    marginTop: 32,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: P.white,
    borderWidth: 1.5,
    borderColor: P.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  prefix: {
    fontSize: typography.bodyLarge,
    fontWeight: '700',
    color: P.ink,
  },
  fieldInput: {
    flex: 1,
    fontSize: typography.bodyLarge,
    color: P.ink,
    paddingVertical: 0,
  },
  ctaButton: {
    backgroundColor: P.primary,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: P.white,
  },
  footerText: {
    fontSize: typography.bodySmall,
    color: P.muted,
    textAlign: 'center',
    marginTop: 20,
  },
  footerLink: {
    color: P.primary,
    fontWeight: '700',
  },
});
