import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  customerColors,
  customerFonts,
  customerShadow,
  customerSpacing,
} from '../theme';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { ArrowRightFigmaIcon } from '../components/ArrowRightFigmaIcon';
import {
  genderFromApi,
  genderToApi,
  useCustomerProfile,
  useUpdateCustomerProfile,
  validateAge,
  type UpdateCustomerProfileInput,
} from '../api/profile';
import { mapProblem } from '../api/problem';
import { t } from '../../../i18n/customer';

interface CustomerProfileAgeGenderScreenProps {
  onNavigate: (screen: 'CustomerProfilePreferences' | 'CustomerLoadingMarket' | 'CustomerMain' | 'CustomerProfileName') => void;
}

export const CustomerProfileAgeGenderScreen: React.FC<CustomerProfileAgeGenderScreenProps> = ({ onNavigate }) => {
  const [age, setAge] = useState('');
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  const genders = [
    { id: 'male', label: t('customer.account.setup.gender.male'), emoji: '👨' },
    { id: 'female', label: t('customer.account.setup.gender.female'), emoji: '👩' },
    { id: 'unspecified', label: t('customer.account.setup.gender.unspecified'), emoji: '' },
  ];

  const [ageError, setAgeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const profile = useCustomerProfile();
  const update = useUpdateCustomerProfile();
  const saving = update.isPending;

  // Prefill from a saved profile (re-entering onboarding).
  useEffect(() => {
    if (prefilled || !profile.data) return;
    setPrefilled(true);
    if (profile.data.age != null) setAge((cur) => (cur === '' ? String(profile.data.age) : cur));
    const g = genderFromApi(profile.data.gender);
    const uiGender = g === 'prefer_not_to_say' ? 'unspecified' : g;
    if (uiGender && uiGender !== 'other') setSelectedGender((cur) => cur ?? uiGender);
  }, [prefilled, profile.data]);

  const handleNext = async () => {
    if (saving) return;
    const parsed = validateAge(age);
    if (parsed.error) {
      setAgeError(parsed.error);
      return;
    }
    setAgeError(null);
    setError(null);
    const body: UpdateCustomerProfileInput = {};
    if (parsed.value != null) body.age = parsed.value;
    const gender = genderToApi(selectedGender);
    if (gender) body.gender = gender;
    // PATCH requires at least one property: nothing entered -> just move on.
    if (Object.keys(body).length === 0) {
      onNavigate('CustomerProfilePreferences');
      return;
    }
    try {
      await update.mutateAsync(body);
      onNavigate('CustomerProfilePreferences');
    } catch (err) {
      const p = mapProblem(err);
      if (p.silent) return;
      if (p.fieldErrors.age) setAgeError(p.fieldErrors.age);
      setError(p.fieldErrors.gender ?? (p.fieldErrors.age ? null : p.message));
    }
  };

  const handleSkip = () => {
    onNavigate('CustomerLoadingMarket');
  };

  return (
    <View style={styles.container}>
      {/* Hide status bar symbols, edge-to-edge pure white */}
      <ScreenStatusBar translucent={true} backgroundColor="transparent" barStyle="dark-content" />
      <StatusBar hidden={true} />

      {/* ── TOP HEADER: 3-SEGMENT PROGRESS (Green / Green / Grey) + SKIP ── */}
      <View style={styles.headerRow}>
        <View style={styles.progressSegmentsWrap}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentInactive]} />
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel={t('customer.account.setup.skip')}
        >
          <Text style={styles.skipText}>{t('customer.account.setup.skip')}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.contentWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── QUESTION 1: WHAT IS YOUR AGE? ───────────────────────────────── */}
          <View style={styles.sectionWrap}>
            <Text style={styles.questionTitle}>{t('customer.account.setup.age.title')}</Text>
            <View style={styles.ageInputWrap}>
              <TextInput
                style={styles.ageInput}
                placeholder=""
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={3}
                value={age}
                onChangeText={(v) => {
                  setAge(v.replace(/[^0-9]/g, ''));
                  if (ageError) setAgeError(null);
                }}
                editable={!saving}
                accessibilityLabel={t('customer.account.setup.age.inputA11y')}
                textAlign="center"
              />
              <View
                style={[
                  styles.ageUnderline,
                  age.trim().length > 0 && styles.ageUnderlineActive,
                  ageError ? styles.underlineError : null,
                ]}
              />
              {ageError ? (
                <Text style={styles.errorText} accessibilityRole="alert" testID="age-error">
                  {ageError}
                </Text>
              ) : null}
            </View>
          </View>

          {/* ── QUESTION 2: WHAT IS YOUR GENDER? ────────────────────────────── */}
          <View style={[styles.sectionWrap, { marginTop: 44 }]}>
            <Text style={styles.questionTitle}>{t('customer.account.setup.gender.title')}</Text>

            <View style={styles.genderRow}>
              {genders.map((g) => {
                const isSelected = selectedGender === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedGender(isSelected ? null : g.id)}
                    style={styles.genderItemWrap}
                    accessibilityRole="button"
                    accessibilityLabel={g.label}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.genderItemContent}>
                      {g.emoji ? <Text style={styles.genderEmoji}>{g.emoji}</Text> : null}
                      <Text style={[styles.genderLabel, isSelected && styles.genderLabelActive]}>
                        {g.label}
                      </Text>
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Text style={styles.checkIcon}>✓</Text>
                        </View>
                      ) : (
                        <Text style={styles.plusText}>+</Text>
                      )}
                    </View>
                    <View style={[styles.itemUnderline, isSelected && styles.itemUnderlineActive]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── BOTTOM CENTERED CIRCULAR ACTION BUTTON ──────────────────────── */}
          <View style={styles.buttonContainer}>
            {error ? (
              <Text style={[styles.errorText, styles.formError]} accessibilityRole="alert" testID="age-gender-error">
                {error}
              </Text>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={saving}
              accessibilityState={{ disabled: saving, busy: saving }}
              style={[
                styles.circularButton,
                styles.circularButtonActive,
                customerShadow.raised,
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('customer.account.setup.age.next')}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" testID="age-gender-saving" />
              ) : (
                <ArrowRightFigmaIcon size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  underlineError: {
    backgroundColor: '#DC2626',
  },
  errorText: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 8,
  },
  formError: {
    marginBottom: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: customerSpacing[24],
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 16,
  },
  progressSegmentsWrap: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    maxWidth: 240,
  },
  progressSegment: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: customerColors.brand,
  },
  progressSegmentInactive: {
    backgroundColor: '#E5E7EB',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  skipText: {
    fontFamily: customerFonts.semibold,
    fontSize: 15,
    color: customerColors.body,
    letterSpacing: 0.2,
  },
  contentWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: customerSpacing[24],
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  sectionWrap: {
    width: '100%',
    alignItems: 'center',
  },
  questionTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 27,
    lineHeight: 34,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  ageInputWrap: {
    width: '100%',
    alignItems: 'center',
  },
  ageInput: {
    width: '100%',
    fontSize: 24,
    fontFamily: customerFonts.bold,
    color: customerColors.brand,
    paddingVertical: 8,
  },
  ageUnderline: {
    height: 1.5,
    width: '100%',
    backgroundColor: '#E5E7EB',
  },
  ageUnderlineActive: {
    backgroundColor: customerColors.brand,
    height: 2,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  genderItemWrap: {
    flex: 1,
  },
  genderItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  genderEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  genderLabel: {
    fontFamily: customerFonts.regular,
    fontSize: 13,
    color: '#374151',
    flexShrink: 1,
  },
  genderLabelActive: {
    fontFamily: customerFonts.bold,
    color: customerColors.brand,
  },
  plusText: {
    fontFamily: customerFonts.regular,
    fontSize: 16,
    lineHeight: 18,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: customerColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  checkIcon: {
    fontSize: 10,
    fontWeight: '800',
    color: customerColors.brand,
    lineHeight: 11,
  },
  itemUnderline: {
    height: 1.5,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginTop: 4,
  },
  itemUnderlineActive: {
    backgroundColor: customerColors.brand,
    height: 2,
  },
  buttonContainer: {
    marginTop: 70,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButtonActive: {
    backgroundColor: customerColors.brand,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
  },
});
