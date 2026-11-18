import React, { useRef, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import {
  customerColors,
  customerFonts,
  customerSpacing,
} from '../theme';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';
import {
  customerLoginBranchTopLeft,
  customerLoginRightLeaves,
} from '../assets/images';
import { isValidCustomerMobile, sendCustomerLoginOtp } from '../api/auth';
import { mapProblem } from '../api/problem';

import { t } from '../../../i18n/customer';
/** Challenge handed to CustomerOtp (BR-153: `POST /auth/customer/otp/send`). */
export interface CustomerOtpRouteParams {
  mobile: string;
  challengeId: string;
  expiresAt: string;
  resendAvailableAt?: string | undefined;
  attemptsRemaining: number;
  mockCode?: string | undefined;
}

interface CustomerLoginScreenProps {
  onNavigate: (
    screen: 'CustomerOtp' | 'RoleSelection' | 'CustomerWelcome',
    params?: CustomerOtpRouteParams
  ) => void;
}

export const CustomerLoginScreen: React.FC<CustomerLoginScreenProps> = ({ onNavigate }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);
  const inFlight = useRef(false);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const mobileValid = cleanPhone.length === 10 && isValidCustomerMobile(cleanPhone);
  const showMobileHint = cleanPhone.length === 10 && !mobileValid;
  const canSubmit = mobileValid && agreed && !submitting;

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    setError(null);
    setCanRetry(false);
  };

  const handleNext = async () => {
    if (!canSubmit || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    setCanRetry(false);
    try {
      const challenge = await sendCustomerLoginOtp(cleanPhone);
      onNavigate('CustomerOtp', {
        mobile: cleanPhone,
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt,
        resendAvailableAt: challenge.resendAvailableAt,
        attemptsRemaining: challenge.attemptsRemaining,
        ...(challenge._mockCode ? { mockCode: challenge._mockCode } : {}),
      });
    } catch (err) {
      const problem = mapProblem(err);
      if (!problem.silent) {
        // 422 field error, 429 wait (message carries the seconds), 502/offline retry.
        setError(problem.fieldErrors['mobile'] ?? problem.message);
        setCanRetry(problem.action === 'retry');
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Edge-to-edge transparent status bar matching Figma spec */}
      <ScreenStatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <StatusBar hidden={false} barStyle="dark-content" />

      {/* Decorative top-left branch foliage from Figma */}
      <Image
        source={customerLoginBranchTopLeft}
        style={styles.branchTopLeft}
        resizeMode="contain"
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main Card (Horizontally & vertically centered) */}
        <View style={styles.card}>
          {/* Right floating leaves positioned beside Welcome Back header */}
          <Image
            source={customerLoginRightLeaves}
            style={styles.floatingLeafRight}
            resizeMode="contain"
            pointerEvents="none"
          />

          <Text style={styles.title}>{t('customer.auth.login.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('customer.auth.login.letsStart')}</Text>

          {/* Underline Phone Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.phoneInput}
              placeholder={t('customer.auth.login.phonePlaceholder')}
              placeholderTextColor="#A0A7B1"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              textAlign="center"
              autoFocus={false}
              editable={!submitting}
              accessibilityLabel={t('customer.auth.login.phoneA11y')}
            />
            <View style={styles.underline} />
            {showMobileHint ? (
              <Text style={styles.errorText} testID="customer-login-mobile-hint">
                {t('customer.auth.login.mobileHint')}
              </Text>
            ) : null}
          </View>

          {/* Terms Agreement Checkbox with green border matching Figma */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAgreed(prev => !prev)}
            style={styles.checkboxRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText} numberOfLines={1}>
              {t('customer.auth.login.agree')}
            </Text>
          </TouchableOpacity>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} testID="customer-login-error" accessibilityRole="alert">
                {error}
              </Text>
              {canRetry ? (
                <TouchableOpacity
                  onPress={() => void handleNext()}
                  accessibilityRole="link"
                  accessibilityLabel={t('customer.auth.login.tryAgain')}
                  testID="customer-login-retry"
                >
                  <Text style={styles.retryText}>{t('customer.auth.login.tryAgain')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Circular Action Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => void handleNext()}
            disabled={!canSubmit}
            style={[styles.circularButton, !canSubmit && styles.circularButtonDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t('customer.auth.login.continueA11y')}
            accessibilityState={{ disabled: !canSubmit, busy: submitting }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ArrowRightFigmaIcon size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFDFB',
    position: 'relative',
  },
  branchTopLeft: {
    position: 'absolute',
    top: 60,
    left: 0,
    width: 68,
    height: 98,
    zIndex: 1,
  },
  floatingLeafRight: {
    position: 'absolute',
    top: -6,
    right: 0,
    width: 44,
    height: 55,
    zIndex: 1,
  },
  contentWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: customerSpacing[20],
    zIndex: 2,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    lineHeight: 28,
    color: customerColors.brand,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: customerFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 290,
    marginBottom: 20,
    alignSelf: 'center',
  },
  phoneInput: {
    fontFamily: customerFonts.regular,
    fontSize: 15,
    color: customerColors.body,
    paddingVertical: 8,
    textAlign: 'center',
    width: '100%',
  },
  underline: {
    height: 1,
    backgroundColor: '#EBEBEB',
    width: '100%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 8,
    alignSelf: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: customerColors.brand,
    borderColor: customerColors.brand,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: -1,
  },
  termsText: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#1F2937',
  },
  errorBox: {
    alignItems: 'center',
    marginTop: -16,
    marginBottom: 16,
    maxWidth: 290,
  },
  errorText: {
    fontFamily: customerFonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 6,
  },
  retryText: {
    fontFamily: customerFonts.semibold,
    fontSize: 13,
    color: customerColors.brand,
    marginTop: 6,
  },
  circularButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  circularButtonDisabled: {
    opacity: 0.45,
  },
});
